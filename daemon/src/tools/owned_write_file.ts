import { constants } from "fs";
import type { Stats } from "fs";
import fs from "fs/promises";
import type { FileHandle } from "fs/promises";
import path from "path";
import { $t } from "../i18n";
import type { FileOwnership } from "./file_ownership";
import { resolvePhysicalPath } from "./path_link_check";

export interface OwnedWriteFile {
  file: FileHandle;
  remove: () => Promise<void>;
  close: () => Promise<void>;
}

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep))
  );
}

async function removeMatchingEntry(entry: string, expected: Stats): Promise<void> {
  try {
    const current = await fs.lstat(entry);
    if (current.dev !== expected.dev || current.ino !== expected.ino) return;
    if (expected.isDirectory()) await fs.rmdir(entry);
    else await fs.unlink(entry);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // Never recursively remove a directory that another process has populated.
    if (code !== "ENOENT" && !(expected.isDirectory() && code === "ENOTEMPTY")) throw error;
  }
}

/** Only use with a handle opened and validated by openOwnedWriteFile. */
export async function syncOwnedFileHandle(
  file: FileHandle,
  ownership: FileOwnership
): Promise<void> {
  const info = await file.stat();
  if (info.uid === ownership.uid && info.gid === ownership.gid) return;
  try {
    await file.chown(ownership.uid, ownership.gid);
  } catch (error) {
    if (["EPERM", "EACCES"].includes((error as NodeJS.ErrnoException).code || ""))
      throw new Error($t("TXT_CODE_file_ownership.permissionDenied"));
    throw error;
  }
}

/** Resolve internal links, then anchor all mutations to verified Linux descriptors. */
export async function openOwnedWriteFile(
  workspace: string,
  target: string,
  ownership: FileOwnership,
  mode = 0o666
): Promise<OwnedWriteFile> {
  if (process.platform !== "linux" || !isInside(path.resolve(workspace), path.resolve(target)))
    throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
  const root = await fs.realpath(workspace);
  const destination = resolvePhysicalPath(path.resolve(target));
  if (!destination || !isInside(root, destination) || destination === root)
    throw new Error($t("TXT_CODE_file_ownership.outsideWorkspace"));
  const segments = path.relative(root, destination).split(path.sep);
  if (segments.length > 129) throw new Error($t("TXT_CODE_file_task.copyDepthExceeded"));
  const directoryFlags = constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW;
  let parent: FileHandle | undefined;
  let file: FileHandle | undefined;
  let createdFile: { entry: string; info: Stats } | undefined;
  try {
    parent = await fs.open(root, directoryFlags);
    if ((await fs.realpath(`/proc/self/fd/${parent.fd}`)) !== root)
      throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
    for (const segment of segments.slice(0, -1)) {
      const entry = `/proc/self/fd/${parent.fd}/${segment}`;
      let next: FileHandle;
      let created = false;
      try {
        next = await fs.open(entry, directoryFlags);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        await fs.mkdir(entry, { mode: 0o755 });
        created = true;
        next = await fs.open(entry, directoryFlags);
      }
      let createdDirectory: Stats | undefined;
      try {
        if (created) createdDirectory = await next.stat();
        await syncOwnedFileHandle(next, ownership);
      } catch (error) {
        try {
          if (createdDirectory) await removeMatchingEntry(entry, createdDirectory);
        } finally {
          await next.close();
        }
        throw error;
      }
      const previous = parent;
      parent = next;
      await previous.close();
    }
    const entry = `/proc/self/fd/${parent.fd}/${segments[segments.length - 1]}`;
    let before: Awaited<ReturnType<typeof fs.lstat>> | undefined;
    try {
      before = await fs.lstat(entry);
      if (!before.isFile()) throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    // Never truncate until both the opened inode and its owner are verified.
    file = await fs.open(
      entry,
      constants.O_WRONLY |
        constants.O_NOFOLLOW |
        constants.O_NONBLOCK |
        (before ? 0 : constants.O_CREAT | constants.O_EXCL),
      mode
    );
    const opened = await file.stat();
    if (!before) createdFile = { entry, info: opened };
    if (!opened.isFile() || (before && (before.dev !== opened.dev || before.ino !== opened.ino)))
      throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
    await syncOwnedFileHandle(file, ownership);
    const heldFile = file;
    const heldParent = parent;
    let closed = false;
    return {
      file: heldFile,
      async remove() {
        if (closed) throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
        await removeMatchingEntry(entry, opened);
      },
      async close() {
        if (closed) return;
        closed = true;
        try {
          await heldFile.close();
        } finally {
          await heldParent.close();
        }
      }
    };
  } catch (error) {
    try {
      if (createdFile) await removeMatchingEntry(createdFile.entry, createdFile.info);
    } finally {
      try {
        await file?.close();
      } finally {
        await parent?.close();
      }
    }
    throw error;
  }
}
