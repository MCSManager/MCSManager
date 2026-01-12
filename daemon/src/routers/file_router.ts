import { t } from "i18next";
import os from "os";
import { globalConfiguration, globalEnv } from "../entity/config";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import { DiskQuotaService } from "../service/disk_quota_service";
import downloadManager from "../service/download_manager";
import { getFileManager, getWindowsDisks } from "../service/file_router_service";
import { ioTaskService } from "../service/io_task_service";
import logger from "../service/log";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";
import uploadManager from "../service/upload_manager";
import { checkSafeUrl } from "../utils/url";

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
    const fileManager = getFileManager(data.instanceUuid);
    const { page, pageSize, target, fileName } = data;
    fileManager.cd(target);
    const overview = await fileManager.list(page, pageSize, fileName);
    protocol.response(ctx, overview);
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
    const scope = data.scope === "node" ? "node" : "instance";

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

    const ioTasks = ioTaskService.getTasks(scope, data.instanceUuid);

    protocol.response(ctx, {
      instanceFileTask: instance.info.fileLock ?? 0,
      globalFileTask: globalEnv.fileTaskCount ?? 0,
      downloadFileFromURLTask: downloadManager.downloadingCount,
      downloadTasks,
      ioTasks,
      platform: os.platform(),
      isGlobalInstance: data.instanceUuid === InstanceSubsystem.GLOBAL_INSTANCE_UUID,
      disks: getWindowsDisks()
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Create a new file
routerApp.on("file/touch", async (ctx, data) => {
  try {
    const target = data.target;
    const fileManager = getFileManager(data.instanceUuid);
    const task = ioTaskService.startTask({
      instanceUuid: data.instanceUuid,
      type: "newFile",
      path: target
    });
    try {
      await fileManager.newFile(target);
      await ioTaskService.finishTask(task.task?.id, "success");
      protocol.response(ctx, true);
    } catch (err: any) {
      await ioTaskService.finishTask(task.task?.id, "failed", err?.message);
      throw err;
    }
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Create a directory
routerApp.on("file/mkdir", async (ctx, data) => {
  try {
    const target = data.target;
    const fileManager = getFileManager(data.instanceUuid);
    const task = ioTaskService.startTask({
      instanceUuid: data.instanceUuid,
      type: "mkdir",
      path: target
    });
    try {
      await fileManager.mkdir(target);
      await ioTaskService.finishTask(task.task?.id, "success");
      protocol.response(ctx, true);
    } catch (err: any) {
      await ioTaskService.finishTask(task.task?.id, "failed", err?.message);
      throw err;
    }
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// download a file from url
routerApp.on("file/download_from_url", async (ctx, data) => {
  let taskId: string | undefined;
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
    // Check disk quota before downloading
    // We check if the instance has exceeded its quota (no space available)
    const quotaService = DiskQuotaService.getInstance();
    const normalizedPath = targetPath.replace(/\\/g, "/");
    const instance = InstanceSubsystem.getInstance(data.instanceUuid);
    if (instance && !(await quotaService.hasSpaceAvailable(instance))) {
      protocol.responseError(ctx, $t("TXT_CODE_disk_quota_exceeded_write"));
      return;
    }

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

    const task = ioTaskService.startTask({
      instanceUuid: data.instanceUuid,
      type: "download_url",
      path: targetPath
    });
    taskId = task.task?.id;

    downloadManager
      .downloadFromUrl(url, targetPath, fallbackUrl, {
        instance,
        quotaService,
        hooks: {
          onProgress: (current: number, total: number) => {
            const percent = total > 0 ? (current / total) * 100 : 0;
            ioTaskService.updateProgress(taskId, percent);
          },
          onComplete: async (status: "success" | "failed", error?: string) => {
            await ioTaskService.finishTask(
              taskId,
              status === "success" ? "success" : "failed",
              error
            );
          }
        }
      })
      .catch((err) => {
        ioTaskService.finishTask(taskId, "failed", err?.message);
        logger.error(`Download failed: ${url} -> ${targetPath}`, err);
      });

    protocol.response(ctx, {});
  } catch (error: any) {
    if (taskId) {
      await ioTaskService.finishTask(taskId, "failed", error?.message);
    }
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
    // [["a.txt","b.txt"],["cxz","zzz"]]
    const targets = data.targets;
    const fileManager = getFileManager(data.instanceUuid);
    for (const target of targets) {
      const task = ioTaskService.startTask({
        instanceUuid: data.instanceUuid,
        type: "copy",
        path: `${target[0]} -> ${target[1]}`
      });
      try {
        await fileManager.copy(target[0], target[1]);
        await ioTaskService.finishTask(task.task?.id, "success");
      } catch (err: any) {
        await ioTaskService.finishTask(task.task?.id, "failed", err?.message);
        throw err;
      }
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// move the file
routerApp.on("file/move", async (ctx, data) => {
  try {
    // [["a.txt","b.txt"],["cxz","zzz"]]
    const targets = data.targets;
    const fileManager = getFileManager(data.instanceUuid);
    for (const target of targets) {
      const task = ioTaskService.startTask({
        instanceUuid: data.instanceUuid,
        type: "move",
        path: `${target[0]} -> ${target[1]}`
      });
      try {
        await fileManager.move(target[0], target[1]);
        await ioTaskService.finishTask(task.task?.id, "success");
      } catch (err: any) {
        await ioTaskService.finishTask(task.task?.id, "failed", err?.message);
        throw err;
      }
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Delete Files
routerApp.on("file/delete", async (ctx, data) => {
  try {
    const targets = data.targets;
    const fileManager = getFileManager(data.instanceUuid);
    for (const target of targets) {
      const path = fileManager.toAbsolutePath(target);
      const uploadTask = uploadManager.getByPath(path);
      if (uploadTask != undefined) {
        uploadManager.delete(uploadTask.id);
        uploadTask.writer.stop();
      } else {
        // await the delete operation
        const task = ioTaskService.startTask({
          instanceUuid: data.instanceUuid,
          type: "delete",
          path: target
        });
        try {
          await fileManager.delete(target);
          await ioTaskService.finishTask(task.task?.id, "success");
        } catch (err: any) {
          await ioTaskService.finishTask(task.task?.id, "failed", err?.message);
          throw err;
        }
      }
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// edit file
routerApp.on("file/edit", async (ctx, data) => {
  try {
    const target = data.target;
    const text = data.text;
    const fileManager = getFileManager(data.instanceUuid);
    const task = ioTaskService.startTask({
      instanceUuid: data.instanceUuid,
      type: "edit",
      path: target
    });
    try {
      const result = await fileManager.edit(target, text);
      await ioTaskService.finishTask(task.task?.id, "success");
      protocol.response(ctx, result ? result : true);
    } catch (err: any) {
      await ioTaskService.finishTask(task.task?.id, "failed", err?.message);
      throw err;
    }
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
