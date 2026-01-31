import { t } from "i18next";
import os from "os";
import { globalConfiguration, globalEnv } from "../entity/config";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import StorageSubsystem from "../common/system_storage";
import downloadManager from "../service/download_manager";
import { getFileManager, getWindowsDisks } from "../service/file_router_service";
import logger from "../service/log";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";
import uploadManager from "../service/upload_manager";
import { checkSafeUrl } from "../utils/url";

// Helper function to normalize path for comparison
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

// Helper function to get all parent folders of a path
// e.g., "a/b/c/file.txt" returns ["a", "a/b", "a/b/c"]
function getParentFolders(filePath: string): string[] {
  const normalized = normalizePath(filePath);
  const parts = normalized.split("/");
  const parents: string[] = [];

  // Build parent paths (exclude the file itself)
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join("/"));
  }

  return parents;
}

// Helper function to update foldersWithLockedContent based on current lockedFiles
// This recalculates which folders contain locked files
function updateFoldersWithLockedContent(instance: Instance): void {
  const lockedFiles = instance.config.lockedFiles || [];

  if (lockedFiles.length === 0) {
    instance.config.foldersWithLockedContent = [];
    return;
  }

  const foldersSet = new Set<string>();

  // For each locked file, add all its parent folders to the set
  for (const lockedPath of lockedFiles) {
    const parents = getParentFolders(lockedPath);
    for (const parent of parents) {
      foldersSet.add(parent);
    }
  }

  instance.config.foldersWithLockedContent = Array.from(foldersSet);
}

// Helper function to check if a path itself is directly locked (not inherited from parent)
// Used for display purposes - files should show their own lock status independently
function isPathDirectlyLocked(instance: Instance, targetPath: string): boolean {
  const lockedFiles = instance.config.lockedFiles || [];
  if (lockedFiles.length === 0) return false;

  const normalizedTarget = normalizePath(targetPath);

  for (const lockedPath of lockedFiles) {
    const normalizedLocked = normalizePath(lockedPath);

    // Only check if target is exactly the locked path (no inheritance)
    if (normalizedTarget === normalizedLocked) {
      return true;
    }
  }

  return false;
}

// Helper function to remove lock for a specific path
// Used when files are deleted or created to clear stale lock states
// Also handles folder deletion - removes all locks for files inside the folder
function removeLockForPath(instance: Instance, targetPath: string): boolean {
  if (!instance.config.lockedFiles) return false;
  const normalizedTarget = normalizePath(targetPath);

  let modified = false;

  // Case 1: Target path itself is directly locked
  const index = instance.config.lockedFiles.indexOf(normalizedTarget);
  if (index > -1) {
    instance.config.lockedFiles.splice(index, 1);
    modified = true;
  }

  // Case 2: Target is a folder containing locked files - remove all nested locks
  // e.g., deleting "folder1" should also remove locks for "folder1/a/b.txt"
  const targetPrefix = normalizedTarget + "/";
  const pathsToRemove: string[] = [];

  for (const lockedPath of instance.config.lockedFiles) {
    if (lockedPath.startsWith(targetPrefix)) {
      pathsToRemove.push(lockedPath);
    }
  }

  // Remove all nested locked paths
  for (const pathToRemove of pathsToRemove) {
    const idx = instance.config.lockedFiles.indexOf(pathToRemove);
    if (idx > -1) {
      instance.config.lockedFiles.splice(idx, 1);
      modified = true;
    }
  }

  if (modified) {
    // Performance optimization: recalculate foldersWithLockedContent
    updateFoldersWithLockedContent(instance);
    StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
  }

  return modified;
}

// Helper function to copy lock status from source to destination
// Used when copying files - if source is locked, destination should also be locked
function copyLockForPath(instance: Instance, sourcePath: string, destPath: string): boolean {
  if (!instance.config.lockedFiles) return false;
  const normalizedSource = normalizePath(sourcePath);
  const normalizedDest = normalizePath(destPath);

  // Check if source is directly locked
  if (instance.config.lockedFiles.includes(normalizedSource)) {
    // Add lock to destination if not already locked
    if (!instance.config.lockedFiles.includes(normalizedDest)) {
      instance.config.lockedFiles.push(normalizedDest);
      // Performance optimization: update foldersWithLockedContent
      updateFoldersWithLockedContent(instance);
      StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
    }
    return true;
  }
  return false;
}

// Helper function to move lock status from source to destination
// Used when moving/renaming files - lock status transfers from source to destination
// Also handles moving folders that contain locked files inside
function moveLockForPath(instance: Instance, sourcePath: string, destPath: string): boolean {
  if (!instance.config.lockedFiles) return false;
  const normalizedSource = normalizePath(sourcePath);
  const normalizedDest = normalizePath(destPath);

  let modified = false;

  // Case 1: Source path itself is directly locked
  const sourceIndex = instance.config.lockedFiles.indexOf(normalizedSource);
  if (sourceIndex > -1) {
    // Remove lock from source
    instance.config.lockedFiles.splice(sourceIndex, 1);
    // Add lock to destination if not already locked
    if (!instance.config.lockedFiles.includes(normalizedDest)) {
      instance.config.lockedFiles.push(normalizedDest);
    }
    modified = true;
  }

  // Case 2: Source is a folder containing locked files - update all nested locked paths
  // e.g., moving "folder1" to "folder2" should update "folder1/a/b.txt" to "folder2/a/b.txt"
  const sourcePrefix = normalizedSource + "/";
  const updatedPaths: { oldPath: string; newPath: string }[] = [];

  for (let i = 0; i < instance.config.lockedFiles.length; i++) {
    const lockedPath = instance.config.lockedFiles[i];
    if (lockedPath.startsWith(sourcePrefix)) {
      // This locked file is inside the moved folder
      const relativePath = lockedPath.substring(sourcePrefix.length);
      const newPath = normalizedDest + "/" + relativePath;
      updatedPaths.push({ oldPath: lockedPath, newPath });
    }
  }

  // Apply the path updates
  for (const { oldPath, newPath } of updatedPaths) {
    const idx = instance.config.lockedFiles.indexOf(oldPath);
    if (idx > -1) {
      instance.config.lockedFiles.splice(idx, 1);
      if (!instance.config.lockedFiles.includes(newPath)) {
        instance.config.lockedFiles.push(newPath);
      }
      modified = true;
    }
  }

  if (modified) {
    // Performance optimization: recalculate foldersWithLockedContent
    updateFoldersWithLockedContent(instance);
    StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
  }

  return modified;
}

// Helper function to check if a path is locked (including parent folder inheritance)
// Used for permission checking - modifications should be blocked if any parent is locked
function isPathLocked(instance: Instance, targetPath: string): boolean {
  const lockedFiles = instance.config.lockedFiles || [];
  if (lockedFiles.length === 0) return false;

  const normalizedTarget = normalizePath(targetPath);

  for (const lockedPath of lockedFiles) {
    const normalizedLocked = normalizePath(lockedPath);

    // Check if target is exactly the locked path
    if (normalizedTarget === normalizedLocked) {
      return true;
    }

    // Check if target is inside a locked directory
    if (normalizedTarget.startsWith(normalizedLocked + "/")) {
      return true;
    }

    // Check if target is a parent of a locked path (for operations that affect children)
    // This is handled separately in specific operations
  }

  return false;
}

// Helper function to check if a path contains any locked files (for folder operations)
// This checks if any locked file is inside the given path
// Performance optimization: first check foldersWithLockedContent before detailed check
function containsLockedPath(instance: Instance, targetPath: string): string | null {
  const lockedFiles = instance.config.lockedFiles || [];
  if (lockedFiles.length === 0) return null;

  const normalizedTarget = normalizePath(targetPath);

  // Performance optimization: check if this folder is marked as containing locked files
  const foldersWithLockedContent = instance.config.foldersWithLockedContent || [];
  if (foldersWithLockedContent.length > 0) {
    // Check if targetPath is in foldersWithLockedContent or is a parent of any marked folder
    let hasLockedContent = false;
    for (const markedFolder of foldersWithLockedContent) {
      // targetPath contains locked content if:
      // 1. targetPath equals a marked folder, or
      // 2. a marked folder starts with targetPath (targetPath is parent of marked folder)
      if (markedFolder === normalizedTarget || markedFolder.startsWith(normalizedTarget + "/")) {
        hasLockedContent = true;
        break;
      }
    }

    // If not marked as containing locked content, skip detailed check
    if (!hasLockedContent) {
      return null;
    }
  }

  // Detailed check: find the actual locked path
  for (const lockedPath of lockedFiles) {
    const normalizedLocked = normalizePath(lockedPath);

    // Check if the locked path is inside the target path
    if (normalizedLocked.startsWith(normalizedTarget + "/")) {
      return lockedPath;
    }
  }

  return null;
}

// Helper function to check if a path is locked or contains locked files
// Used for operations that affect the path and all its contents (copy, move, delete)
function isPathOrContentsLocked(instance: Instance, targetPath: string): string | null {
  // First check if the path itself is locked
  if (isPathLocked(instance, targetPath)) {
    return targetPath;
  }
  // Then check if it contains any locked files
  return containsLockedPath(instance, targetPath);
}

// Some routers operate router authentication middleware
routerApp.use((event, ctx, data, next) => {
  if (event.startsWith("file/")) {
    const instanceUuid = data.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) {
      return protocol.error(ctx, event, {
        instanceUuid: instanceUuid,
        err: $t("TXT_CODE_file_router.instanceNotExist", { instanceUuid: instanceUuid })
      });
    }

    if (
      [Instance.STATUS_BUSY, Instance.STATUS_STARTING].includes(instance.status()) &&
      !["file/list", "file/status"].includes(event)
    ) {
      return protocol.error(ctx, event, {
        instanceUuid: instanceUuid,
        err: $t("TXT_CODE_bbedcf29")
      });
    }
  }
  next();
});

// List the files in the specified instance working directory
routerApp.on("file/list", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const fileManager = getFileManager(data.instanceUuid);
    const { page, pageSize, target, fileName } = data;
    fileManager.cd(target);
    const overview = await fileManager.list(page, pageSize, fileName);

    // Add locked status to each file item
    // Use isPathDirectlyLocked for display - files show their own lock status independently
    // Permission checking (modifications) still uses isPathLocked to check parent inheritance
    const lockedFiles = instance.config.lockedFiles || [];
    if (overview.items && Array.isArray(overview.items)) {
      overview.items = overview.items.map((item: any) => {
        const itemPath = target ? normalizePath(target + "/" + item.name) : item.name;
        return {
          ...item,
          locked: isPathDirectlyLocked(instance, itemPath)
        };
      });
    }

    // Also return the locked files list for admin reference
    const result = {
      ...overview,
      lockedFiles
    };

    protocol.response(ctx, result);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// File chmod (only Linux)
routerApp.on("file/chmod", async (ctx, data) => {
  try {
    const fileManager = getFileManager(data.instanceUuid);
    const { chmod, target, deep } = data;
    await fileManager.chmod(target, chmod, deep);
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Query the status of the file management system
routerApp.on("file/status", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const downloadTasks = [];
    if (downloadManager.task) {
      downloadTasks.push({
        path: downloadManager.task.path,
        total: downloadManager.task.total,
        current: downloadManager.task.current,
        status: downloadManager.task.status,
        error: downloadManager.task.error
      });
    }

    protocol.response(ctx, {
      instanceFileTask: instance.info.fileLock ?? 0,
      globalFileTask: globalEnv.fileTaskCount ?? 0,
      downloadFileFromURLTask: downloadManager.downloadingCount,
      downloadTasks,
      platform: os.platform(),
      isGlobalInstance: data.instanceUuid === InstanceSubsystem.GLOBAL_INSTANCE_UUID,
      disks: getWindowsDisks()
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Create a new file
routerApp.on("file/touch", (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const target = data.target;
    const fileManager = getFileManager(data.instanceUuid);
    fileManager.newFile(target);
    // Clear any stale lock status for the new file path
    removeLockForPath(instance, target);
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Create a directory
routerApp.on("file/mkdir", (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const target = data.target;
    const fileManager = getFileManager(data.instanceUuid);
    fileManager.mkdir(target);
    // Clear any stale lock status for the new directory path
    removeLockForPath(instance, target);
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// download a file from url
routerApp.on("file/download_from_url", async (ctx, data) => {
  try {
    const url = data.url;
    const fileName = data.fileName;

    if (!checkSafeUrl(url)) {
      protocol.responseError(ctx, t("TXT_CODE_3fe1b194"), {
        disablePrint: true
      });
      return;
    }

    const fileManager = getFileManager(data.instanceUuid);
    fileManager.checkPath(fileName);
    const targetPath = fileManager.toAbsolutePath(fileName);

    // Start download in background
    const fallbackUrl = data.fallbackUrl;

    const maxDownloadFromUrlFileCount = globalConfiguration.config.maxDownloadFromUrlFileCount;
    if (
      maxDownloadFromUrlFileCount > 0 &&
      downloadManager.downloadingCount >= maxDownloadFromUrlFileCount
    ) {
      protocol.responseError(ctx, t("TXT_CODE_821a742e", { count: maxDownloadFromUrlFileCount }), {
        disablePrint: true
      });
      return;
    }

    downloadManager.downloadFromUrl(url, targetPath, fallbackUrl).catch((err) => {
      logger.error(`Download failed: ${url} -> ${targetPath}`, err);
    });

    protocol.response(ctx, {});
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// stop download from url
routerApp.on("file/download_stop", (ctx, data) => {
  try {
    const fileManager = getFileManager(data.instanceUuid);
    fileManager.checkPath(data.fileName);
    const targetPath = fileManager.toAbsolutePath(data.fileName);
    const result = downloadManager.stop(targetPath);
    protocol.response(ctx, result);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// copy the file
routerApp.on("file/copy", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    // [["a.txt","b.txt"],["cxz","zzz"]]
    const targets = data.targets;
    const fileManager = getFileManager(data.instanceUuid);

    // Note: Lock permission check is done at Panel level
    // Daemon only handles file operations and lock status maintenance

    for (const target of targets) {
      fileManager.copy(target[0], target[1]);
      // Copy lock status from source to destination
      copyLockForPath(instance, target[0], target[1]);
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// move the file
routerApp.on("file/move", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    // [["a.txt","b.txt"],["cxz","zzz"]]
    const targets = data.targets;
    const fileManager = getFileManager(data.instanceUuid);

    // Note: Lock permission check is done at Panel level
    // Daemon only handles file operations and lock status maintenance

    for (const target of targets) {
      await fileManager.move(target[0], target[1]);
      // Move lock status from source to destination
      moveLockForPath(instance, target[0], target[1]);
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Delete Files
routerApp.on("file/delete", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const targets = data.targets;
    const fileManager = getFileManager(data.instanceUuid);

    // Note: Lock permission check is done at Panel level
    // Daemon only handles file operations and lock status maintenance

    for (const target of targets) {
      const path = fileManager.toAbsolutePath(target);
      const uploadTask = uploadManager.getByPath(path);
      if (uploadTask != undefined) {
        uploadManager.delete(uploadTask.id);
        uploadTask.writer.stop();
      } else {
        // async delete
        fileManager.delete(target);
      }
      // Clear lock status for deleted file/folder
      removeLockForPath(instance, target);
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// edit file
routerApp.on("file/edit", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const target = data.target;
    const text = data.text;

    // Note: Lock permission check is done at Panel level
    // Daemon only handles file operations

    const fileManager = getFileManager(data.instanceUuid);
    const result = await fileManager.edit(target, text);
    protocol.response(ctx, result ? result : true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// compress/decompress the file
routerApp.on("file/compress", async (ctx, data) => {
  const maxFileTask = globalConfiguration.config.maxFileTask;
  try {
    const source = data.source;
    const targets = data.targets;
    const type = data.type;
    const code = data.code;
    const fileManager = getFileManager(data.instanceUuid);
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
    if (instance.info.fileLock >= maxFileTask) {
      throw new Error(
        $t("TXT_CODE_file_router.unzipLimit", {
          maxFileTask: maxFileTask,
          fileLock: instance.info.fileLock
        })
      );
    }

    // Note: Lock permission check is done at Panel level
    // Daemon only handles file operations

    // Statistics of the number of tasks in a single instance file and the number of tasks in the entire daemon process
    function fileTaskStart() {
      if (instance) {
        instance.info.fileLock++;
        globalEnv.fileTaskCount++;
      }
    }

    function fileTaskEnd() {
      if (instance) {
        instance.info.fileLock--;
        globalEnv.fileTaskCount--;
      }
    }

    // start decompressing or compressing the file
    fileTaskStart();
    try {
      if (type === 1) {
        await fileManager.zip(source, targets, code);
      } else {
        await fileManager.unzip(source, targets, code);
      }
      protocol.response(ctx, true);
    } catch (error: any) {
      throw error;
    } finally {
      fileTaskEnd();
    }
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Lock file/folder (admin only - permission check done at Panel level)
routerApp.on("file/lock", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const { target } = data;
    const normalizedTarget = normalizePath(target);

    // Initialize lockedFiles array if not exists
    if (!instance.config.lockedFiles) {
      instance.config.lockedFiles = [];
    }

    // Check if already locked
    if (!instance.config.lockedFiles.includes(normalizedTarget)) {
      instance.config.lockedFiles.push(normalizedTarget);

      // Performance optimization: update foldersWithLockedContent
      updateFoldersWithLockedContent(instance);

      // Save instance config
      StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
    }

    protocol.response(ctx, {
      locked: true,
      lockedFiles: instance.config.lockedFiles
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Unlock file/folder (admin only - permission check done at Panel level)
routerApp.on("file/unlock", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const { target } = data;
    const normalizedTarget = normalizePath(target);

    // Initialize lockedFiles array if not exists
    if (!instance.config.lockedFiles) {
      instance.config.lockedFiles = [];
    }

    // Remove from locked files
    const index = instance.config.lockedFiles.indexOf(normalizedTarget);
    if (index > -1) {
      instance.config.lockedFiles.splice(index, 1);

      // Performance optimization: recalculate foldersWithLockedContent
      updateFoldersWithLockedContent(instance);

      // Save instance config
      StorageSubsystem.store("InstanceConfig", instance.instanceUuid, instance.config);
    }

    protocol.response(ctx, {
      locked: false,
      lockedFiles: instance.config.lockedFiles
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Check if path is locked (used by Panel for permission checking)
// checkContents: if true, also check if the path contains any locked files (for non-admin users)
routerApp.on("file/check_lock", async (ctx, data) => {
  try {
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));

    const { targets, checkContents } = data;
    const lockedPaths: string[] = [];

    for (const target of targets) {
      if (checkContents) {
        // For non-admin users: check both path itself and contents
        const lockedPath = isPathOrContentsLocked(instance, target);
        if (lockedPath) {
          lockedPaths.push(lockedPath);
        }
      } else {
        // For admin users: only check path itself
        if (isPathLocked(instance, target)) {
          lockedPaths.push(target);
        }
      }
    }

    protocol.response(ctx, {
      hasLocked: lockedPaths.length > 0,
      lockedPaths
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});
