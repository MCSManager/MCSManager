import { $t } from "../i18n";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";
import { getFileManager } from "../service/file_router_service";
import { globalConfiguration, globalEnv } from "../entity/config";
import os from "os";
import * as nodeDiskInfo from "node-disk-info";

let diskInfos: any[] = [];
if (os.platform() === "win32") {
  diskInfos = nodeDiskInfo.getDiskInfoSync();
}

// Some routers operate router authentication middleware
routerApp.use((event, ctx, data, next) => {
  if (event.startsWith("file/")) {
    const instanceUuid = data.instanceUuid;
    if (!InstanceSubsystem.exists(instanceUuid)) {
      return protocol.error(ctx, event, {
        instanceUuid: instanceUuid,
        err: $t("TXT_CODE_file_router.instanceNotExist", { instanceUuid: instanceUuid })
      });
    }
  }
  next();
});

// List the files in the specified instance working directory
routerApp.on("file/list", (ctx, data) => {
  try {
    const fileManager = getFileManager(data.instanceUuid);
    const { page, pageSize, target, fileName } = data;
    fileManager.cd(target);
    const overview = fileManager.list(page, pageSize, fileName);
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
    protocol.response(ctx, {
      instanceFileTask: instance.info.fileLock ?? 0,
      globalFileTask: globalEnv.fileTaskCount ?? 0,
      platform: os.platform(),
      isGlobalInstance: data.instanceUuid === InstanceSubsystem.GLOBAL_INSTANCE_UUID,
      disks: diskInfos.map((v) => {
        return String(v._mounted).replace(":", "");
      })
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Create a new file
routerApp.on("file/touch", (ctx, data) => {
  try {
    const target = data.target;
    const fileManager = getFileManager(data.instanceUuid);
    fileManager.newFile(target);
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Create a directory
routerApp.on("file/mkdir", (ctx, data) => {
  try {
    const target = data.target;
    const fileManager = getFileManager(data.instanceUuid);
    fileManager.mkdir(target);
    protocol.response(ctx, true);
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
      fileManager.copy(target[0], target[1]);
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
      await fileManager.move(target[0], target[1]);
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
      // async delete
      fileManager.delete(target);
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
