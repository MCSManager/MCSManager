import fs from "fs-extra";
import { constants as fsConstants } from "fs";
import type { Stats } from "fs";
import { opendir } from "fs/promises";
import iconv from "iconv-lite";
import { ProcessWrapper } from "mcsmanager-common";
import StreamZip from "node-stream-zip";
import os from "os";
import path from "path";
import { compress, decompress, listArchiveEntries } from "../common/compress";
import { globalConfiguration } from "../entity/config";
import { $t, i18next } from "../i18n";
import { syncPathOwnershipWithinRoot } from "../tools/file_ownership";
import type { FileOwnership } from "../tools/file_ownership";
import { normalizedJoin } from "../tools/filepath";
import { resolvePhysicalPath } from "../tools/path_link_check";

const ERROR_MSG_01 = $t("TXT_CODE_system_file.illegalAccess");
const ERROR_PATH_NOT_FOUND = $t("TXT_CODE_96281410");
const MAX_EDIT_SIZE = 1024 * 1024 * 5;
const MAX_COPY_DEPTH = 128;

interface IFile {
  name: string;
  size: number;
  time: string;
  type: number;
  mode: number;
}

export default class FileManager {
  public cwd: string = ".";

  constructor(
    public topPath: string = "",
    public fileCode?: string,
    private readonly ownershipResolver?: () => Promise<FileOwnership | undefined>
  ) {
    if (!path.isAbsolute(topPath)) {
      this.topPath = path.normalize(path.join(process.cwd(), topPath));
    } else {
      this.topPath = path.normalize(topPath);
    }
    if (!fileCode) {
      this.fileCode = "utf-8";
      if (i18next.language == "zh_cn") this.fileCode = "gbk";
    }
  }

  isRootTopRath() {
    return this.topPath === "/" || this.topPath === "\\";
  }

  private isOutsideWorkspace(absPath: string): boolean {
    // fix the /app/ vs /app mismatch bug and keep it secure
    if (this.isRootTopRath()) return false;
    const realTop = resolvePhysicalPath(this.topPath);
    const realPath = resolvePhysicalPath(absPath);
    if (!realTop || !realPath) return true; // If the path cannot be resolved, treat it as outside for safety
    const relative = path.relative(realTop, realPath);
    return relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative);
  }

  toAbsolutePath(fileName: string = "") {
    const topAbsolutePath = this.topPath;

    let finalPath = "";
    if (path.normalize(fileName).indexOf(topAbsolutePath) === 0) {
      // This value is what every caller passes to fs, so it must be the value the
      // containment check below validates. Keeping the raw caller string let a
      // symlink followed by '..' pass the lexical check and then be resolved
      // physically by the kernel, escaping the instance workspace.
      finalPath = path.normalize(fileName);
    } else if (os.platform() === "win32") {
      const reg = new RegExp("^[A-Za-z]{1}:[\\\\/]{1}");
      if (reg.test(this.cwd)) {
        finalPath = path.normalize(path.join(this.cwd, fileName));
      } else if (reg.test(fileName)) {
        finalPath = path.normalize(fileName);
      }
    }

    if (!finalPath) {
      finalPath = path.normalize(path.join(this.topPath, this.cwd, fileName));
    }

    if (this.isOutsideWorkspace(finalPath)) throw new Error(ERROR_MSG_01);
    return finalPath;
  }

  checkPath(fileNameOrPath: string) {
    if (this.isRootTopRath()) return true;
    const destAbsolutePath = path.normalize(this.toAbsolutePath(fileNameOrPath));
    const topAbsolutePath = path.normalize(this.topPath);

    const destPath = destAbsolutePath.endsWith(path.sep)
      ? destAbsolutePath.slice(0, -1)
      : destAbsolutePath;
    const topPath = topAbsolutePath.endsWith(path.sep)
      ? topAbsolutePath.slice(0, -1)
      : topAbsolutePath;

    this.assertInsideWorkspace(destPath);

    if (destPath.startsWith(topPath)) {
      const parts = destPath.split(path.sep);
      return topPath.split(path.sep).every((part, index) => {
        return part === parts[index];
      });
    }
    return false;
  }

  assertInsideWorkspace(fileNameOrPath: string) {
    const absPath = this.toAbsolutePath(fileNameOrPath);
    if (this.isOutsideWorkspace(absPath)) throw new Error(ERROR_MSG_01);
  }

  check(destPath: string) {
    if (this.isRootTopRath()) return true;
    if (!this.checkPath(destPath)) return false;
    if (!fs.existsSync(this.toAbsolutePath(destPath))) return false;
    return true;
  }

  cd(dirName: string) {
    if (!this.check(dirName)) throw new Error(ERROR_MSG_01);
    this.cwd = normalizedJoin(this.cwd, dirName);
  }

  async list(page: 0, pageSize = 40, searchFileName?: string) {
    if (pageSize > 100 || pageSize <= 0 || page < 0) throw new Error("Beyond the value limit");

    this.assertInsideWorkspace(".");

    // Use withFileTypes option to get file type directly, reducing stat calls
    const dirents = await fs.readdir(this.toAbsolutePath(), { withFileTypes: true });

    // Filter search results and create basic file info with type
    let filteredItems = await Promise.all(
      dirents
        .filter(
          (dirent) =>
            !searchFileName || dirent.name.toLowerCase().includes(searchFileName.toLowerCase())
        )
        .map(async (dirent) => {
          let type = dirent.isFile() ? 1 : 0;
          if (type === 0 && !dirent.isDirectory()) {
            // Symbolic links may return false for both isFile() and isDirectory()
            // see #2124
            try {
              type = (await fs.stat(this.toAbsolutePath(dirent.name))).isFile() ? 1 : 0;
            } catch {}
          }
          return { name: dirent.name, type };
        })
    );

    const total = filteredItems.length;

    // Sort: directories first (type 0), then files (type 1), both alphabetically
    filteredItems.sort((a, b) => {
      if (a.type !== b.type) return a.type - b.type;
      return a.name.localeCompare(b.name);
    });

    const sliceStart = page * pageSize;
    const sliceEnd = sliceStart + pageSize;
    const targetItems = filteredItems.slice(sliceStart, sliceEnd);

    const statPromises = targetItems.map(async (item) => {
      try {
        const info = await fs.stat(this.toAbsolutePath(item.name));
        const mode = parseInt(String(parseInt(info.mode?.toString(8), 10)).slice(-3));
        return {
          name: item.name,
          size: info.isFile() ? info.size : 0,
          time: info.atime.toString(),
          mode,
          type: item.type
        };
      } catch (error: any) {
        return {
          name: item.name,
          size: 0,
          time: new Date().toString(),
          mode: 0,
          type: item.type
        };
      }
    });

    // Execute all stat operations concurrently
    const resultList = await Promise.all(statPromises);

    return {
      items: resultList,
      page,
      pageSize,
      total,
      absolutePath: this.toAbsolutePath()
    };
  }

  async chmod(fileName: string, chmodValue: number, deep: boolean) {
    if (!this.check(fileName) || isNaN(parseInt(chmodValue as any))) throw new Error(ERROR_MSG_01);
    const absPath = this.toAbsolutePath(fileName);
    const defaultPath = "/bin/chmod";
    let file = "chmod";
    if (fs.existsSync(defaultPath)) file = defaultPath;
    const params: string[] = [];
    if (deep) params.push("-R");
    params.push(String(chmodValue));
    params.push(absPath);
    return await new ProcessWrapper(file, params, ".", 60 * 10).start();
  }

  async readFile(fileName: string) {
    if (!this.check(fileName)) throw new Error(ERROR_MSG_01);
    const absPath = this.toAbsolutePath(fileName);
    const buf = await fs.readFile(absPath);
    const text = iconv.decode(buf, this.fileCode || "utf-8");
    return text;
  }

  async writeFile(fileName: string, data: string) {
    if (!this.check(fileName)) throw new Error(ERROR_MSG_01);
    const absPath = this.toAbsolutePath(fileName);
    const buf = iconv.encode(data, this.fileCode || "utf-8");
    const ownership = await this.ownershipResolver?.();
    this.assertInsideWorkspace(absPath);
    await fs.writeFile(absPath, buf);
    await this.syncOwnership(absPath, ownership);
  }

  async newFile(fileName: string) {
    // if (!FileManager.checkFileName(fileName)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(fileName)) throw new Error(ERROR_MSG_01);
    const target = this.toAbsolutePath(fileName);
    const ownership = await this.ownershipResolver?.();
    this.assertInsideWorkspace(target);
    const parentDir = path.resolve(path.dirname(target));
    if (parentDir !== path.parse(parentDir).root) await fs.mkdir(parentDir, { recursive: true });
    await fs.createFile(target);
    await this.syncOwnership(target, ownership);
  }

  async copy(target1: string, target2: string) {
    if (!this.checkPath(target2) || !this.check(target1)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target1);
    target2 = this.toAbsolutePath(target2);
    const ownership = await this.ownershipResolver?.();
    if (!ownership) return await fs.copy(targetPath, target2);
    const realRoot = await fs.realpath(this.topPath);
    const source = await this.resolveCopyPath(targetPath, realRoot);
    const destination = await this.resolveCopyPath(target2, realRoot);
    const relative = path.relative(source, destination);
    if (
      relative === "" ||
      (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative))
    ) {
      throw new Error(ERROR_MSG_01);
    }
    await this.prepareOwnedDirectory(path.dirname(target2), ownership);
    await this.copyOwnedEntry(targetPath, target2, realRoot, ownership, 0);
  }

  private async resolveCopyPath(target: string, realRoot: string): Promise<string> {
    const relative = path.relative(this.topPath, target);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
      throw new Error(ERROR_MSG_01);
    }
    let current = target;
    const missing: string[] = [];
    for (;;) {
      try {
        await fs.lstat(current);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        const parent = path.dirname(current);
        if (parent === current) throw new Error(ERROR_MSG_01);
        missing.push(path.basename(current));
        current = parent;
      }
    }
    const resolved = path.join(await fs.realpath(current), ...missing.reverse());
    const physicalRelative = path.relative(realRoot, resolved);
    if (
      physicalRelative === ".." ||
      physicalRelative.startsWith(".." + path.sep) ||
      path.isAbsolute(physicalRelative)
    ) {
      throw new Error(ERROR_MSG_01);
    }
    return resolved;
  }

  private async prepareOwnedDirectory(target: string, ownership: FileOwnership): Promise<void> {
    const realRoot = await fs.realpath(this.topPath);
    await this.resolveCopyPath(target, realRoot);
    await fs.mkdir(target, { recursive: true });
    await this.syncOwnership(target, ownership);
  }

  private async copyOwnedEntry(
    source: string,
    destination: string,
    realRoot: string,
    ownership: FileOwnership,
    depth: number,
    overwrite = true
  ): Promise<void> {
    if (depth > MAX_COPY_DEPTH) throw new Error($t("TXT_CODE_file_task.copyDepthExceeded"));
    await this.resolveCopyPath(source, realRoot);
    await this.resolveCopyPath(destination, realRoot);
    const sourceInfo = await fs.lstat(source);
    if (sourceInfo.isDirectory()) {
      let created = false;
      try {
        // Keep a new directory private and writable until its children are copied.
        await fs.mkdir(destination, { mode: 0o700 });
        created = true;
      } catch (error) {
        if (
          !overwrite ||
          (error as NodeJS.ErrnoException).code !== "EEXIST" ||
          !(await fs.lstat(destination)).isDirectory()
        )
          throw error;
      }
      let destinationFd: number | undefined;
      let destinationIdentityVerified = false;
      try {
        if (created) {
          await this.resolveCopyPath(destination, realRoot);
          const destinationInfo = await fs.lstat(destination);
          destinationFd = await fs.open(
            destination,
            fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_DIRECTORY
          );
          const openedInfo = await fs.fstat(destinationFd);
          if (openedInfo.dev !== destinationInfo.dev || openedInfo.ino !== destinationInfo.ino)
            throw new Error(ERROR_MSG_01);
          destinationIdentityVerified = true;
        }
        await syncPathOwnershipWithinRoot(this.topPath, destination, ownership);
        // Keep only the current directory iterator at each depth, not the entire tree.
        const directory = await opendir(source);
        try {
          const openedInfo = await fs.lstat(source);
          if (openedInfo.dev !== sourceInfo.dev || openedInfo.ino !== sourceInfo.ino)
            throw new Error(ERROR_MSG_01);
          for await (const entry of directory) {
            await this.copyOwnedEntry(
              path.join(source, entry.name),
              path.join(destination, entry.name),
              realRoot,
              ownership,
              depth + 1,
              overwrite
            );
          }
        } finally {
          await directory.close().catch((error: NodeJS.ErrnoException) => {
            if (error.code !== "ERR_DIR_CLOSED") throw error;
          });
        }
      } finally {
        if (destinationFd !== undefined) {
          try {
            // The descriptor cannot be redirected by replacing the destination pathname.
            if (destinationIdentityVerified)
              await fs.fchmod(destinationFd, sourceInfo.mode & 0o777);
          } finally {
            await fs.close(destinationFd);
          }
        }
      }
    } else if (sourceInfo.isSymbolicLink()) {
      const link = await fs.readlink(source);
      await this.validateRelocatedLink(link, destination, realRoot);
      let destinationInfo: Stats | undefined;
      try {
        destinationInfo = await fs.lstat(destination);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (destinationInfo) {
        if (!overwrite || !destinationInfo.isSymbolicLink()) throw new Error(ERROR_MSG_01);
        await fs.unlink(destination);
      }
      // Use the validated link text rather than rereading a mutable source in fs.copy().
      await fs.symlink(link, destination);
    } else if (sourceInfo.isFile()) {
      try {
        await fs.copy(
          source,
          destination,
          overwrite ? undefined : { overwrite: false, errorOnExist: true }
        );
      } finally {
        try {
          await syncPathOwnershipWithinRoot(this.topPath, destination, ownership);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
    } else {
      throw new Error(ERROR_MSG_01);
    }
  }

  async mkdir(target: string) {
    if (!this.checkPath(target)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    const ownership = await this.ownershipResolver?.();
    this.assertInsideWorkspace(targetPath);
    await fs.mkdir(targetPath, { recursive: true });
    await this.syncOwnership(targetPath, ownership);
  }

  async syncOwnership(target: string, ownership?: FileOwnership): Promise<void> {
    if (!ownership) return;
    let current = this.toAbsolutePath(target);
    while (current !== this.topPath) {
      await syncPathOwnershipWithinRoot(this.topPath, current, ownership);
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  async delete(target: string, options: { ignoreMissing?: boolean } = {}): Promise<boolean> {
    if (!this.checkPath(target)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    if (!options.ignoreMissing && !fs.existsSync(targetPath)) throw new Error(ERROR_MSG_01);
    return new Promise((r, j) => {
      fs.remove(targetPath, (err) => {
        if (!err || (options.ignoreMissing && (err as NodeJS.ErrnoException).code === "ENOENT"))
          r(true);
        else j(err);
      });
    });
  }

  async move(target: string, destPath: string) {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(destPath)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    destPath = this.toAbsolutePath(destPath);
    const ownership = await this.ownershipResolver?.();
    if (!ownership) return await fs.move(targetPath, destPath);

    const realRoot = await fs.realpath(this.topPath);
    const source = await this.resolveCopyPath(targetPath, realRoot);
    const destination = await this.resolveCopyPath(destPath, realRoot);
    const relative = path.relative(source, destination);
    if (
      source === realRoot ||
      relative === "" ||
      (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative))
    )
      throw new Error(ERROR_MSG_01);
    await this.assertMoveDestinationAbsent(destPath);
    const sourceInfo = await fs.lstat(targetPath);
    // Renaming a directory also relocates its relative symlinks. Validate before mutation.
    await this.visitTree(targetPath, realRoot, async (entry, info) => {
      if (info.isSymbolicLink()) {
        const relocated = path.join(destPath, path.relative(targetPath, entry));
        await this.validateRelocatedLink(await fs.readlink(entry), relocated, realRoot);
      }
    });
    await this.prepareOwnedDirectory(path.dirname(destPath), ownership);
    await this.resolveCopyPath(targetPath, realRoot);
    await this.resolveCopyPath(destPath, realRoot);
    await this.assertMoveDestinationAbsent(destPath);
    const verifiedInfo = await fs.lstat(targetPath);
    if (verifiedInfo.dev !== sourceInfo.dev || verifiedInfo.ino !== sourceInfo.ino)
      throw new Error(ERROR_MSG_01);
    try {
      await fs.rename(targetPath, destPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
      await this.copyOwnedEntry(targetPath, destPath, realRoot, ownership, 0, false);
      await this.resolveCopyPath(targetPath, realRoot);
      const currentInfo = await fs.lstat(targetPath);
      if (currentInfo.dev !== sourceInfo.dev || currentInfo.ino !== sourceInfo.ino)
        throw new Error(ERROR_MSG_01);
      // Do not delete the source until the entire copy and ownership pass succeed.
      await fs.remove(targetPath);
      return;
    }
    await this.visitTree(destPath, realRoot, (entry) =>
      syncPathOwnershipWithinRoot(this.topPath, entry, ownership)
    );
  }

  private async assertMoveDestinationAbsent(destination: string): Promise<void> {
    try {
      await fs.lstat(destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    throw new Error(ERROR_MSG_01);
  }

  private async validateRelocatedLink(
    link: string,
    destination: string,
    realRoot: string
  ): Promise<void> {
    const target = path.isAbsolute(link) ? link : path.dirname(destination) + path.sep + link;
    await this.resolveCopyPath(target, realRoot);
  }

  private async visitTree(
    target: string,
    realRoot: string,
    visit: (entry: string, info: Stats) => Promise<void>,
    depth = 0
  ): Promise<void> {
    if (depth > MAX_COPY_DEPTH) throw new Error($t("TXT_CODE_file_task.copyDepthExceeded"));
    await this.resolveCopyPath(target, realRoot);
    const info = await fs.lstat(target);
    if (!info.isFile() && !info.isDirectory() && !info.isSymbolicLink())
      throw new Error(ERROR_MSG_01);
    await visit(target, info);
    if (!info.isDirectory()) return;
    const directory = await opendir(target);
    try {
      const openedInfo = await fs.lstat(target);
      if (openedInfo.dev !== info.dev || openedInfo.ino !== info.ino) throw new Error(ERROR_MSG_01);
      for await (const entry of directory)
        await this.visitTree(path.join(target, entry.name), realRoot, visit, depth + 1);
    } finally {
      await directory.close().catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ERR_DIR_CLOSED") throw error;
      });
    }
  }

  async unzip(sourceZip: string, destDir: string, code?: string, ownership?: FileOwnership) {
    if (!code) code = this.fileCode;
    if (!this.check(sourceZip) || !this.checkPath(destDir)) throw new Error(ERROR_MSG_01);
    this.zipFileCheck(this.toAbsolutePath(sourceZip));
    const absSource = this.toAbsolutePath(sourceZip);
    const absDest = this.toAbsolutePath(destDir);

    const archiveEntries = await this.getArchiveEntries(absSource);
    const hasZipSlip = this.hasZipSlip(absDest, archiveEntries);
    if (hasZipSlip) throw new Error(ERROR_MSG_01);

    // Different extractors disagree on literal backslashes. Rootless ownership
    // must never guess which pathname was created or silently skip it.
    if (ownership?.rootless && archiveEntries.some((entry) => entry.name.includes("\\"))) {
      throw new Error($t("TXT_CODE_file_task.ambiguousArchivePath"));
    }
    if (ownership) await this.prepareOwnedDirectory(absDest, ownership);
    try {
      return await decompress(absSource, absDest, code);
    } finally {
      if (ownership) await this.syncArchiveOwnership(absDest, archiveEntries, ownership);
    }
  }

  private async getArchiveEntries(
    absSource: string
  ): Promise<Array<{ name: string; isDirectory: boolean; linkTarget?: string }>> {
    const zip = new StreamZip.async({ file: absSource });
    let archiveEntries: Array<{ name: string; isDirectory: boolean; linkTarget?: string }>;
    try {
      // zip archive
      const zipEntries = Object.values(await zip.entries());
      archiveEntries = [];
      for (const zipEntry of zipEntries) {
        const entry: { name: string; isDirectory: boolean; linkTarget?: string } = {
          name: zipEntry.name,
          isDirectory: zipEntry.isDirectory
        };
        // Unix-created zips store symlinks with the link target as entry data
        // and the S_IFLNK mode in the high attribute bits. The target must be
        // part of the containment check below, so read it here and fail closed
        // when it cannot be read.
        if (!zipEntry.isDirectory && ((zipEntry.attr >>> 16) & 0xf000) === 0xa000) {
          let target: Buffer;
          try {
            target = await zip.entryData(zipEntry.name);
          } catch {
            throw new Error(ERROR_MSG_01);
          }
          entry.linkTarget = target.toString("utf8");
        }
        archiveEntries.push(entry);
      }
    } catch (err: any) {
      const reason = String(err?.message);
      if (reason.includes("Malicious entry")) throw new Error(ERROR_MSG_01);
      if (reason !== "Bad archive" && reason !== "Archive read error") throw err;

      // other archive
      archiveEntries = await listArchiveEntries(absSource);
    } finally {
      await zip.close().catch(() => {});
    }
    return archiveEntries;
  }

  /**
   * Zip-Slip guard — reject the whole archive if ANY entry could write
   * outside the extraction directory.
   *
   * Two simple rules (no kernel-symlink simulation needed):
   *   1. The entry name, after normalizing '\' → '/', must not traverse
   *      upward (contain a '..' segment).
   *   2. A symlink target must not contain '..' segments, must not be an
   *      absolute path outside the destination, and — when the target is
   *      a plain name — must not resolve (via real on-disk links) outside
   *      the destination.
   *
   * Rule 2 is intentionally aggressive: a legitimate symlink whose
   * target is e.g. "dir/../other" is also rejected.  This eliminates the
   * symlink-chain escape (s1→. , s2→s1/.. , s2/file) at the cost of a
   * rare false positive — which is the right trade-off for an archive
   * extraction boundary.
   */
  private hasZipSlip(
    absDest: string,
    archiveEntries: Array<{ name: string; isDirectory: boolean; linkTarget?: string }>
  ): boolean {
    const destRoot = resolvePhysicalPath(absDest) ?? absDest;

    for (const entry of archiveEntries) {
      const segments = entry.name.split(/[\\/]/).filter(Boolean);

      // Rule 1: entry name must not traverse upward
      if (segments.includes("..")) return true;
      const name = segments.join(path.sep);
      const entryPath = path.resolve(absDest, entry.name.split(/[\\/]/).join(path.sep));
      const relativeEntry = path.relative(absDest, entryPath);
      if (
        relativeEntry === ".." ||
        relativeEntry.startsWith(".." + path.sep) ||
        path.isAbsolute(relativeEntry)
      )
        return true;
      for (const candidate of [entryPath, path.resolve(absDest, entry.name)]) {
        const physical = resolvePhysicalPath(candidate);
        if (!physical) return true;
        const relative = path.relative(destRoot, physical);
        if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative))
          return true;
      }

      // Rule 2: symlink target must not traverse upward or escape
      if (entry.linkTarget) {
        const targetSegs = entry.linkTarget.split(/[\\/]/).filter(Boolean);
        if (targetSegs.includes("..")) return true;

        const target = entry.linkTarget.split(/[\\/]/).join(path.sep);
        const rawTarget = path.isAbsolute(target) ? target : path.join(absDest, name, "..", target);
        const resolved = resolvePhysicalPath(rawTarget);
        if (!resolved) return true;
        const rel = path.relative(destRoot, resolved);
        if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) return true;
      }
    }
    return false;
  }

  private async syncArchiveOwnership(
    absDest: string,
    archiveEntries: Array<{ name: string; isDirectory: boolean }>,
    ownership: FileOwnership
  ): Promise<void> {
    const syncedParents = new Set<string>();
    const syncExisting = async (target: string) => {
      try {
        await syncPathOwnershipWithinRoot(this.topPath, target, ownership);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    };
    for (const entry of archiveEntries) {
      const entryPath = path.resolve(absDest, entry.name);
      if (entryPath === absDest) continue;
      await syncExisting(entryPath);
      let parentPath = path.dirname(entryPath);
      while (parentPath !== absDest) {
        if (syncedParents.has(parentPath)) break;
        await syncExisting(parentPath);
        if (syncedParents.size >= 256) syncedParents.clear();
        syncedParents.add(parentPath);
        const nextParent = path.dirname(parentPath);
        if (nextParent === parentPath) break;
        parentPath = nextParent;
      }
    }
  }

  async zip(sourceZip: string, files: string[], code?: string) {
    if (!code) code = this.fileCode;
    if (!this.checkPath(sourceZip)) throw new Error(ERROR_MSG_01);
    const MAX_ZIP_GB = globalConfiguration.config.maxZipFileSize;
    const MAX_TOTAL_FIELS_SIZE = 1024 * 1024 * 1024 * MAX_ZIP_GB;
    const sourceZipPath = this.toAbsolutePath(sourceZip);
    const filesPath = [];
    let totalSize = 0;
    for (const iterator of files) {
      try {
        if (this.check(iterator)) {
          filesPath.push(this.toAbsolutePath(iterator));
          totalSize += fs.statSync(this.toAbsolutePath(iterator))?.size;
        }
      } catch (error: any) {}
    }
    if (totalSize > MAX_TOTAL_FIELS_SIZE)
      throw new Error($t("TXT_CODE_system_file.unzipLimit", { max: MAX_ZIP_GB }));
    const ownership = await this.ownershipResolver?.();
    this.assertInsideWorkspace(sourceZipPath);
    const result = await compress(sourceZipPath, filesPath, code);
    await this.syncOwnership(sourceZipPath, ownership);
    return result;
  }

  async edit(target: string, data?: string) {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    if (data || typeof data === "string") {
      return await this.writeFile(target, data);
    } else {
      const absPath = this.toAbsolutePath(target);
      const info = fs.statSync(absPath);
      if (info.size > MAX_EDIT_SIZE) {
        throw new Error($t("TXT_CODE_system_file.execLimit"));
      }
      return await this.readFile(target);
    }
  }

  rename(target: string, newName: string) {
    if (!this.check(target)) throw new Error(ERROR_MSG_01);
    if (!this.checkPath(newName)) throw new Error(ERROR_MSG_01);
    const targetPath = this.toAbsolutePath(target);
    const newPath = this.toAbsolutePath(newName);
    fs.renameSync(targetPath, newPath);
  }

  public static checkFileName(fileName?: string): boolean {
    if (!fileName) return false;
    const blackKeys = ["/", "\\", "|", "?", "*", ">", "<", ";", '"'];
    for (const ch of blackKeys) {
      if (fileName.includes(ch)) return false;
    }
    return true;
  }

  private zipFileCheck(path: string) {
    const fileInfo = fs.statSync(path);
    const MAX_ZIP_GB = globalConfiguration.config.maxZipFileSize;
    if (fileInfo.size > 1024 * 1024 * 1024 * MAX_ZIP_GB)
      throw new Error($t("TXT_CODE_system_file.unzipLimit", { max: MAX_ZIP_GB }));
  }
}
