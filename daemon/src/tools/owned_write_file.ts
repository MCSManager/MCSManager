import { constants, createReadStream } from "fs";
import type { Stats } from "fs";
import fs from "fs/promises";
import type { FileHandle } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { $t } from "../i18n";
import type { FileOwnership } from "./file_ownership";
import { resolvePhysicalPath } from "./path_link_check";
import { reserveFileWrite } from "./file_reservation";
import type { FileOperationReservation } from "./file_reservation";

export interface OwnedWriteFile {
  file: FileHandle;
  created: boolean;
  assertCurrent: () => Promise<void>;
  commit: () => Promise<void>;
  removeCreated: () => Promise<void>;
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
  options: { mode?: number; staged?: boolean; operation?: FileOperationReservation } = {}
): Promise<OwnedWriteFile> {
  const { mode = 0o666, staged = false } = options;
  if (process.platform !== "linux" || !isInside(path.resolve(workspace), path.resolve(target)))
    throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
  const root = await fs.realpath(workspace);
  const destination = resolvePhysicalPath(path.resolve(target));
  if (!destination || !isInside(root, destination) || destination === root)
    throw new Error($t("TXT_CODE_file_ownership.outsideWorkspace"));
  const segments = path.relative(root, destination).split(path.sep);
  if (segments.length > 129) throw new Error($t("TXT_CODE_file_task.copyDepthExceeded"));
  // Acquire before opening or creating any workspace entry, not just the leaf.
  const reservation = options.operation
    ? options.operation.reserveWrite(root, destination)
    : reserveFileWrite(root, destination);
  const directoryFlags = constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW;
  let parent: FileHandle | undefined;
  let file: FileHandle | undefined;
  let createdFile: { entry: string; info: Stats } | undefined;
  const createdDirectories: { parent: FileHandle; entry: string; info: Stats }[] = [];
  const cleanDirectories = async () => {
    for (const directory of [...createdDirectories].reverse())
      await removeMatchingEntry(directory.entry, directory.info);
  };
  const closeDirectories = async () => {
    const handles = new Set(createdDirectories.map((directory) => directory.parent));
    if (parent) handles.add(parent);
    const results = await Promise.allSettled([...handles].map((handle) => handle.close()));
    reservation.release();
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );
    if (failure) throw failure.reason;
  };
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
        createdDirectories.push({ parent, entry, info: await fs.lstat(entry) });
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
      if (!created) await previous.close();
    }
    const entry = `/proc/self/fd/${parent.fd}/${segments[segments.length - 1]}`;
    let before: Stats | undefined;
    try {
      before = await fs.lstat(entry);
      if (!before.isFile()) throw new Error($t("TXT_CODE_file_ownership.invalidTarget"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (before) reservation.updateIdentity(before);
    // Staged replacements never truncate or change the existing target.
    const writeEntry = staged ? `/proc/self/fd/${parent.fd}/.mcsm-write-${randomUUID()}` : entry;
    file = await fs.open(
      writeEntry,
      constants.O_WRONLY |
        constants.O_NOFOLLOW |
        constants.O_NONBLOCK |
        (before && !staged ? 0 : constants.O_CREAT | constants.O_EXCL),
      staged ? 0o600 : mode
    );
    const opened = await file.stat();
    if (!before || staged) createdFile = { entry: writeEntry, info: opened };
    if (
      !opened.isFile() ||
      (!staged && before && (before.dev !== opened.dev || before.ino !== opened.ino))
    )
      throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
    if (!staged) {
      reservation.updateIdentity(opened);
    }
    if (!staged) await syncOwnedFileHandle(file, ownership);
    const heldFile = file;
    const heldParent = parent;
    let closed = false;
    let committed = false;
    let rollback = false;
    const assertCurrent = async () => {
      if (
        closed ||
        (await fs.realpath(`/proc/self/fd/${heldParent.fd}`)) !== path.dirname(destination)
      )
        throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
      const current = await fs.lstat(entry);
      const expected = staged && !committed ? before : opened;
      if (!expected || current.dev !== expected.dev || current.ino !== expected.ino)
        throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
    };
    return {
      file: heldFile,
      created: !before,
      assertCurrent,
      async commit() {
        if (!staged) return assertCurrent();
        if (closed || committed) throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
        if ((await fs.realpath(`/proc/self/fd/${heldParent.fd}`)) !== path.dirname(destination))
          throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
        const temporary = await fs.lstat(writeEntry);
        if (temporary.dev !== opened.dev || temporary.ino !== opened.ino)
          throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
        await syncOwnedFileHandle(heldFile, ownership);
        await heldFile.chmod((before?.mode ?? mode) & 0o777);
        if (before) {
          await assertCurrent();
          await fs.rename(writeEntry, entry);
        } else {
          // link() refuses a concurrently created destination instead of overwriting it.
          await fs.link(writeEntry, entry);
          await fs.unlink(writeEntry);
        }
        committed = true;
      },
      async removeCreated() {
        if (closed) throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
        rollback = true;
        if (!staged && !before) await removeMatchingEntry(entry, opened);
      },
      async remove() {
        if (closed) throw new Error($t("TXT_CODE_file_ownership.targetChanged"));
        rollback = true;
        await removeMatchingEntry(staged && !committed ? writeEntry : entry, opened);
      },
      async close() {
        if (closed) return;
        closed = true;
        try {
          try {
            if (staged && !committed) await removeMatchingEntry(writeEntry, opened);
          } finally {
            await heldFile.close();
          }
        } finally {
          try {
            if (rollback || (staged && !committed)) await cleanDirectories();
          } finally {
            await closeDirectories();
          }
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
        try {
          await cleanDirectories();
        } finally {
          await closeDirectories();
        }
      }
    }
    throw error;
  }
}

/** Stream a complete replacement, then publish it without truncating the old inode. */
export async function replaceOwnedFile(
  workspace: string,
  destination: string,
  ownership: FileOwnership,
  sourcePath: string,
  size: number,
  operation?: FileOperationReservation
): Promise<void> {
  if (!Number.isSafeInteger(size) || size < 0)
    throw new Error($t("TXT_CODE_http_router.updateErr"));
  const target = await openOwnedWriteFile(workspace, destination, ownership, {
    mode: 0o600,
    staged: true,
    operation
  });
  try {
    let offset = 0;
    for await (const chunk of createReadStream(sourcePath)) {
      if (offset + chunk.length > size) throw new Error($t("TXT_CODE_http_router.updateErr"));
      let written = 0;
      while (written < chunk.length) {
        const result = await target.file.write(
          chunk,
          written,
          chunk.length - written,
          offset + written
        );
        if (result.bytesWritten <= 0) throw new Error($t("TXT_CODE_http_router.updateErr"));
        written += result.bytesWritten;
      }
      offset += chunk.length;
    }
    if (offset !== size) throw new Error($t("TXT_CODE_http_router.updateErr"));
    await target.commit();
  } finally {
    await target.close();
  }
}
