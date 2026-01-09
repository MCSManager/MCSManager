import fs from "fs-extra";
import path from "path";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import logger from "../service/log";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";

import { arrayUnique, toNumber } from "mcsmanager-common";
import ProcessInfoCommand from "../entity/commands/process_info";
import { ProcessConfig } from "../entity/instance/process_config";
import { TaskCenter } from "../service/async_task_service";
import { createQuickInstallTask, QuickInstallTask } from "../service/async_task_service/quick_install";
import { IInstanceDetail, IJson } from "../service/interfaces";
import FileManager from "../service/system_file";
import { modService } from "../service/mod_service";
import downloadManager from "../service/download_manager";
import uploadManager from "../service/upload_manager";

// Some instances operate router authentication middleware
routerApp.use((event, ctx, data, next) => {
  if (event === "instance/new" && data) return next();
  if (event === "instance/overview") return next();
  if (event === "instance/select") return next();
  if (event === "instance/asynchronous") return next();
  if (event === "instance/query_asynchronous") return next();
  if (event === "instance/stop_asynchronous") return next();
  if (event.startsWith("instance")) {
    if (data.instanceUuids) return next();
    const instanceUuid = data.instanceUuid;
    if (!InstanceSubsystem.exists(instanceUuid)) {
      return protocol.error(ctx, event, {
        instanceUuid: instanceUuid,
        err: `The operation failed, the instance ${instanceUuid} does not exist.`
      });
    }
  }
  next();
});

// Get the list of instances of this daemon (query)
routerApp.on("instance/select", (ctx, data) => {
  const page = toNumber(data.page) ?? 1;
  const pageSize = toNumber(data.pageSize) ?? 1;
  const condition = data.condition;
  const targetTag = data.condition.tag;
  const overview: IInstanceDetail[] = [];
  // keyword condition query
  const queryWrapper = InstanceSubsystem.getQueryMapWrapper();
  const allTags: string[] = [];

  let searchTags: string[] = [];
  if (targetTag instanceof Array && targetTag.length > 0) {
    searchTags = targetTag.map((v) => String(v).trim());
  }

  let result = queryWrapper.select<Instance>((v) => {
    if (v.config.tag) allTags.push(...v.config.tag);
    if (InstanceSubsystem.isGlobalInstance(v)) return false;
    if (
      condition.instanceName &&
      !v.config.nickname.toLowerCase().includes(condition.instanceName.toLowerCase())
    )
      return false;
    if (condition.status && v.instanceStatus !== Number(condition.status)) return false;

    if (searchTags.length > 0) {
      const myTags = v.config.tag || [];
      const res = myTags.filter((v) => searchTags.includes(v));
      if (res.length === 0 || res.length !== searchTags.length) return false;
    }
    return true;
  });
  // sort first by status， then by nickname
  result.sort((a, b) => {
    if (a.status() !== b.status()) {
      return b.status() - a.status();
    }
    return a.config.nickname >= b.config.nickname ? 1 : -1;
  });
  // paging function
  const pageResult = queryWrapper.page<Instance>(result, page, pageSize);
  // filter unwanted data
  pageResult.data.forEach((instance) => {
    overview.push({
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
      autoRestarted: instance.autoRestartCount,
      status: instance.status(),
      config: instance.config,
      info: instance.info
    });
  });


  protocol.response(ctx, {
    page: pageResult.page,
    pageSize: pageResult.pageSize,
    maxPage: pageResult.maxPage,
    allTags: arrayUnique(allTags).slice(0, 60),
    data: overview
  });
});

// Get an overview of this daemon instance
routerApp.on("instance/overview", (ctx) => {
  const overview: IInstanceDetail[] = [];
  InstanceSubsystem.getInstances().forEach((instance) => {
    overview.push({
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
      autoRestarted: instance.autoRestartCount,
      status: instance.status(),
      config: instance.config,
      info: instance.info
    });
  });

  protocol.msg(ctx, "instance/overview", overview);
});

// Get an overview of some instances of this daemon
routerApp.on("instance/section", (ctx, data) => {
  const instanceUuids = data.instanceUuids as string[];
  const overview: IInstanceDetail[] = [];
  InstanceSubsystem.getInstances().forEach((instance) => {
    instanceUuids.forEach((targetUuid) => {
      if (targetUuid === instance.instanceUuid) {
        overview.push({
          instanceUuid: instance.instanceUuid,
          started: instance.startCount,
          autoRestarted: instance.autoRestartCount,
          status: instance.status(),
          config: instance.config,
          info: instance.info
        });
      }
    });
  });
  protocol.msg(ctx, "instance/section", overview);
});

// View details of a single instance
routerApp.on("instance/detail", async (ctx, data) => {
  try {
    const instanceUuid = data.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
    let processInfo = null;
    let space = 0;
    try {
      // Parts that may be wrong due to file permissions, avoid affecting the acquisition of the entire configuration
      processInfo = await instance.forceExec(new ProcessInfoCommand());
    } catch (err: any) { }
    protocol.msg(ctx, "instance/detail", {
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
      autoRestarted: instance.autoRestartCount,
      status: instance.status(),
      config: instance.config,
      info: instance.info,
      space,
      processInfo
    });
  } catch (err: any) {
    protocol.error(ctx, "instance/detail", { err: err.message });
  }
});

// create a new application instance
routerApp.on("instance/new", (ctx, data) => {
  const config = data;
  try {
    const newInstance = InstanceSubsystem.createInstance(config);
    protocol.msg(ctx, "instance/new", {
      instanceUuid: newInstance.instanceUuid,
      config: newInstance.config,
      nickname: newInstance.config.nickname
    });
  } catch (err: any) {
    protocol.error(ctx, "instance/new", { instanceUuid: null, err: err.message });
  }
});

// update instance data
routerApp.on("instance/update", (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const config = data.config;
  try {
    InstanceSubsystem.getInstance(instanceUuid)?.parameters(config);
    protocol.msg(ctx, "instance/update", { instanceUuid });
  } catch (err: any) {
    protocol.error(ctx, "instance/update", { instanceUuid: instanceUuid, err: err.message });
  }
});

// Request to forward all IO data of an instance
routerApp.on("instance/forward", (ctx, data) => {
  const targetInstanceUuid = data.instanceUuid;
  const isforward: boolean = data.forward;
  try {
    // InstanceSubsystem.getInstance(targetInstanceUuid);
    if (isforward) {
      logger.info(
        $t("TXT_CODE_Instance_router.requestIO", {
          id: ctx.socket.id,
          targetInstanceUuid: targetInstanceUuid
        })
      );
      InstanceSubsystem.forward(targetInstanceUuid, ctx.socket);
    } else {
      logger.info(
        $t("TXT_CODE_Instance_router.cancelIO", {
          id: ctx.socket.id,
          targetInstanceUuid: targetInstanceUuid
        })
      );
      InstanceSubsystem.stopForward(targetInstanceUuid, ctx.socket);
    }
    protocol.msg(ctx, "instance/forward", { instanceUuid: targetInstanceUuid });
  } catch (err: any) {
    protocol.error(ctx, "instance/forward", { instanceUuid: targetInstanceUuid, err: err.message });
  }
});

// open the instance
routerApp.on("instance/open", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  const instances = [];
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    instances.push({
      instanceUuid: instanceUuid,
      nickname: instance?.config.nickname
    });
    try {
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      await instance.execPreset("start");
      instance.autoRestartCount = 0;
      if (!disableResponse) protocol.msg(ctx, "instance/open", { instanceUuid, instances });
    } catch (err: any) {
      if (!disableResponse) {
        logger.error(
          $t("TXT_CODE_Instance_router.openInstanceErr", { instanceUuid: instanceUuid }),
          err
        );
        protocol.error(ctx, "instance/open", {
          instanceUuid: instanceUuid,
          nickname: instance?.config.nickname,
          err: err.message
        });
      }
    }
  }
});

// close the instance
routerApp.on("instance/stop", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  const instances = [];
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    instances.push({
      instanceUuid: instanceUuid,
      nickname: instance?.config.nickname
    });
    try {
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      await instance.execPreset("stop");
      //Note: Removing this reply will cause the front-end response to be slow, because the front-end will wait for the panel-side message to be forwarded
      if (!disableResponse) protocol.msg(ctx, "instance/stop", { instanceUuid, instances });
    } catch (err: any) {
      if (!disableResponse)
        protocol.error(ctx, "instance/stop", {
          instanceUuid: instanceUuid,
          nickname: instance?.config.nickname,
          err: err.message
        });
    }
  }
});

// restart the instance
routerApp.on("instance/restart", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  const instances = [];
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    instances.push({
      instanceUuid: instanceUuid,
      nickname: instance?.config.nickname
    });
    try {
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      await instance.execPreset("restart");
      if (!disableResponse) protocol.msg(ctx, "instance/restart", { instanceUuid, instances });
    } catch (err: any) {
      if (!disableResponse)
        protocol.error(ctx, "instance/restart", {
          instanceUuid: instanceUuid,
          nickname: instance?.config.nickname,
          err: err.message
        });
    }
  }
});

// terminate instance method
routerApp.on("instance/kill", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  const instances = [];
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    instances.push({
      instanceUuid: instanceUuid,
      nickname: instance?.config.nickname
    });
    if (!instance) continue;
    try {
      await instance.execPreset("kill");
      if (!disableResponse) protocol.msg(ctx, "instance/kill", { instanceUuid, instances });
    } catch (err: any) {
      if (!disableResponse)
        protocol.error(ctx, "instance/kill", {
          instanceUuid: instanceUuid,
          nickname: instance?.config.nickname,
          err: err.message
        });
    }
  }
});

// Send a command to the application instance
routerApp.on("instance/command", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  const instanceUuid = data.instanceUuid;
  const command = data.command || "";
  const instance = InstanceSubsystem.getInstance(instanceUuid);
  try {
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
    await instance.execPreset("command", command);
    if (!disableResponse) protocol.msg(ctx, "instance/command", { instanceUuid });
  } catch (err: any) {
    if (!disableResponse)
      protocol.error(ctx, "instance/command", { instanceUuid: instanceUuid, err: err.message });
  }
});

// delete instance
routerApp.on("instance/delete", (ctx, data) => {
  const instanceUuids = data.instanceUuids;
  const deleteFile = data.deleteFile;
  const instances = [];
  for (const instanceUuid of instanceUuids) {
    try {
      const instance = InstanceSubsystem.getInstance(instanceUuid);
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      instances.push({
        instanceUuid: instance.instanceUuid,
        nickname: instance.config.nickname
      });
      InstanceSubsystem.removeInstance(instanceUuid, deleteFile);
    } catch (err: any) { }
  }
  protocol.msg(ctx, "instance/delete", { instanceUuids, instances });
});

// perform complex asynchronous tasks
routerApp.on("instance/asynchronous", (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const taskName = data.taskName;
  const parameter = data.parameter;
  const instance = InstanceSubsystem.getInstance(instanceUuid);

  logger.info(
    $t("TXT_CODE_Instance_router.performTasks", {
      id: ctx.socket.id,
      uuid: instanceUuid,
      taskName: taskName
    })
  );

  // Install instance via preset package
  if (taskName === "install_instance" && instance) {
    instance
      .execPreset("install", parameter)
      .then(() => { })
      .catch((err) => {
        logger.error(
          $t("TXT_CODE_Instance_router.performTasksErr", {
            uuid: instance.instanceUuid,
            taskName: taskName,
            nickname: instance.config.nickname,
            err: err
          })
        );
      });
  }

  // Instance software update via Command
  if (taskName === "update" && instance) {
    instance
      .execPreset("update", parameter)
      .then(() => { })
      .catch((err) => {
        logger.error(
          $t("TXT_CODE_Instance_router.performTasksErr", {
            uuid: instance.instanceUuid,
            taskName: taskName,
            nickname: instance.config.nickname,
            err: err
          })
        );
      });
  }

  // Quick install Minecraft server task
  // Why not use the ".execPreset("install", parameter)" that already exists in Instance?
  // Because the instance has not yet been created at this stage.
  if (taskName === "quick_install") {
    const newInstanceName = String(parameter.newInstanceName);
    const targetLink = String(parameter.targetLink);
    logger.info(`Quick install: Name: ${newInstanceName} | Download: ${targetLink}`);
    const task = createQuickInstallTask(targetLink, newInstanceName, parameter.setupInfo);
    return protocol.response(ctx, task.toObject());
  }

  protocol.response(ctx, true);
});

// Terminate the execution of complex asynchronous tasks
routerApp.on("instance/stop_asynchronous", (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const { taskId } = data.parameter;
  const instance = InstanceSubsystem.getInstance(instanceUuid);

  // Multi-instance async task
  if (taskId && typeof taskId === "string") {
    const task = TaskCenter.getTask(taskId);
    if (!task) throw new Error(`Async Task ID: ${taskId} does not exist`);
    task.stop();
    return protocol.response(ctx, true);
  }

  // Singleton async task
  const task = instance?.asynchronousTask;
  if (task && task.stop) {
    task
      .stop(instance)
      .then(() => { })
      .catch((err) => { });
  } else {
    return protocol.error(
      ctx,
      "instance/stop_asynchronous",
      $t("TXT_CODE_Instance_router.taskEmpty")
    );
  }

  protocol.response(ctx, true);
});

// Query async task status
routerApp.on("instance/query_asynchronous", (ctx, data) => {
  const taskId = data.parameter.taskId as string | undefined;
  const taskName = data.taskName as string;
  const taskNameTypeMap: IJson<string> = {
    quick_install: QuickInstallTask.TYPE
  };
  const type = String(taskNameTypeMap[taskName] || QuickInstallTask.TYPE);
  if (!taskId) {
    const result = [];
    for (const task of TaskCenter.getTasks(type)) {
      result.push({
        taskId: task.taskId,
        status: task.status(),
        detail: task.toObject()
      });
    }
    protocol.response(ctx, result);
  } else {
    const task = TaskCenter.getTask(String(taskId));
    if (task)
      protocol.response(ctx, {
        taskId: task.taskId,
        status: task.status(),
        detail: task.toObject()
      });
  }
});

routerApp.on("instance/process_config/list", (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const files = data.files;
  const result: any[] = [];
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
    const fileManager = new FileManager(instance.absoluteCwdPath());
    for (const filePath of files) {
      if (fileManager.check(filePath)) {
        result.push({
          file: filePath,
          check: true
        });
      }
    }
    protocol.response(ctx, result);
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

// Get or update the content of the instance specified file
routerApp.on("instance/process_config/file", (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  const fileName = data.fileName;
  const config = data.config || null;
  const fileType = data.type;
  try {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
    const fileManager = new FileManager(instance.absoluteCwdPath());
    if (!fileManager.check(fileName)) throw new Error($t("TXT_CODE_Instance_router.accessFileErr"));
    const filePath = path.normalize(path.join(instance.absoluteCwdPath(), fileName));
    const processConfig = new ProcessConfig({
      fileName: fileName,
      redirect: fileName,
      path: filePath,
      type: fileType,
      info: null,
      fromLink: null
    });
    if (config) {
      processConfig.write(config);
      return protocol.response(ctx, true);
    } else {
      const json = processConfig.read();
      return protocol.response(ctx, json);
    }
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

// Get instance terminal log
routerApp.on("instance/outputlog", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  try {
    const filePath = path.join(InstanceSubsystem.LOG_DIR, `${instanceUuid}.log`);
    if (fs.existsSync(filePath)) {
      const text = await fs.readFile(filePath, { encoding: "utf-8" });
      return protocol.response(ctx, text);
    }
    protocol.responseError(ctx, new Error($t("TXT_CODE_Instance_router.terminalLogNotExist")), {
      disablePrint: true
    });
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/list", async (ctx, data) => {
  const instanceUuid = data.instanceUuid;
  try {
    const mods = await modService.listMods(instanceUuid);
    const downloadTasks = [];
    if (downloadManager.task) {
      downloadTasks.push({
        path: downloadManager.task.path,
        total: downloadManager.task.total,
        current: downloadManager.task.current,
        status: downloadManager.task.status,
        error: downloadManager.task.error,
        type: "download"
      });
    }

    const uploadTasks = [];
    for (const [id, writer] of uploadManager.getUploads()) {
      if (writer.cwd === instanceUuid || writer.path.includes(instanceUuid)) {
        uploadTasks.push({
          id,
          path: writer.path,
          total: writer.size,
          current: writer.received.reduce((acc: number, r: { start: number; end: number }) => acc + (r.end - r.start), 0),
          status: 0,
          type: "upload"
        });
      }
    }

    protocol.response(ctx, {
      ...mods,
      downloadTasks: [...downloadTasks, ...uploadTasks],
      downloadFileFromURLTask: downloadManager.downloadingCount
    });
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/toggle", async (ctx, data) => {
  const { instanceUuid, fileName, deferred, extraInfo } = data;
  try {
    if (deferred) {
      modService.addDeferredTask(instanceUuid, { type: "toggle", fileName, extraInfo });
      protocol.response(ctx, true);
    } else {
      await modService.toggleMod(instanceUuid, fileName);
      protocol.response(ctx, true);
    }
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/delete", async (ctx, data) => {
  const { instanceUuid, fileName, deferred, extraInfo } = data;
  try {
    if (deferred) {
      modService.addDeferredTask(instanceUuid, { type: "delete", fileName, extraInfo });
      protocol.response(ctx, true);
    } else {
      await modService.deleteMod(instanceUuid, fileName);
      protocol.response(ctx, true);
    }
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/install", async (ctx, data) => {
  const { instanceUuid, url, fileName, type, fallbackUrl, deferred, extraInfo } = data;
  try {
    await modService.installMod(instanceUuid, url, fileName, type, { fallbackUrl, deferred, extraInfo });
    protocol.response(ctx, true);
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/config_files", async (ctx, data) => {
  const { instanceUuid, modId, type, fileName } = data;
  try {
    const files = await modService.getModConfig(instanceUuid, modId, type, fileName);
    protocol.response(ctx, files);
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/deferred/list", async (ctx, data) => {
  const { instanceUuid } = data;
  try {
    const tasks = modService.getDeferredTasks(instanceUuid);
    protocol.response(ctx, tasks);
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/deferred/auto_execute", async (ctx, data) => {
  const { instanceUuid, enabled } = data;
  try {
    modService.setAutoExecute(instanceUuid, enabled);
    protocol.response(ctx, true);
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});

routerApp.on("instance/mods/deferred/clear", async (ctx, data) => {
  const { instanceUuid } = data;
  try {
    modService.clearDeferredTasks(instanceUuid);
    protocol.response(ctx, true);
  } catch (err: any) {
    protocol.responseError(ctx, err);
  }
});
