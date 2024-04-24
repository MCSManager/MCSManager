import { $t } from "../i18n";
import fs from "fs-extra";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";
import Instance from "../entity/instance/instance";
import logger from "../service/log";
import path from "path";

import StartCommand from "../entity/commands/start";
import StopCommand from "../entity/commands/stop";
import SendCommand from "../entity/commands/cmd";
import KillCommand from "../entity/commands/kill";
import { IInstanceDetail, IJson } from "../service/interfaces";
import { QueryMapWrapper } from "common";
import ProcessInfoCommand from "../entity/commands/process_info";
import FileManager from "../service/system_file";
import { ProcessConfig } from "../entity/instance/process_config";
import RestartCommand from "../entity/commands/restart";
import { TaskCenter } from "../service/async_task_service";
import { createQuickInstallTask } from "../service/async_task_service/quick_install";
import { QuickInstallTask } from "../service/async_task_service/quick_install";

// Some instances operate router authentication middleware
routerApp.use((event, ctx, data, next) => {
  if (event === "instance/new" && data) return next();
  if (event === "instance/overview") return next();
  if (event === "instance/select") return next();
  if (event === "instance/asynchronous") return next();
  if (event === "instance/query_asynchronous") return next();
  if (event === "instance/stop_asynchronous") return next();
  if (event.startsWith("instance")) {
    // class AOP
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
  const page = data.page || 1;
  const pageSize = data.pageSize || 1;
  const condition = data.condition;
  const overview: IInstanceDetail[] = [];
  // keyword condition query
  const queryWrapper = InstanceSubsystem.getQueryMapWrapper();
  let result = queryWrapper.select<Instance>((v) => {
    if (InstanceSubsystem.isGlobalInstance(v)) return false;
    if (!v.config.nickname.toLowerCase().includes(condition.instanceName.toLowerCase()))
      return false;
    if (condition.status && v.instanceStatus !== Number(condition.status)) return false;
    return true;
  });
  result = result.sort((a, b) => (a.config.nickname > b.config.nickname ? 1 : -1));
  // paging function
  const pageResult = queryWrapper.page<Instance>(result, page, pageSize);
  // filter unwanted data
  pageResult.data.forEach((instance) => {
    overview.push({
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
      status: instance.status(),
      config: instance.config,
      info: instance.info
    });
  });

  overview.sort((a, b) => {
    return a.config.nickname >= b.config.nickname ? 1 : -1;
  });

  protocol.response(ctx, {
    page: pageResult.page,
    pageSize: pageResult.pageSize,
    maxPage: pageResult.maxPage,
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
    let space = null;
    try {
      // Parts that may be wrong due to file permissions, avoid affecting the acquisition of the entire configuration
      processInfo = await instance.forceExec(new ProcessInfoCommand());
      space = await instance.usedSpace();
    } catch (err: any) {}
    protocol.msg(ctx, "instance/detail", {
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
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
      config: newInstance.config
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
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    try {
      await instance!.exec(new StartCommand(ctx.socket.id));
      if (!disableResponse) protocol.msg(ctx, "instance/open", { instanceUuid });
    } catch (err: any) {
      if (!disableResponse) {
        logger.error(
          $t("TXT_CODE_Instance_router.openInstanceErr", { instanceUuid: instanceUuid }),
          err
        );
        protocol.error(ctx, "instance/open", { instanceUuid: instanceUuid, err: err.message });
      }
    }
  }
});

// close the instance
routerApp.on("instance/stop", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    try {
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      await instance.exec(new StopCommand());
      //Note: Removing this reply will cause the front-end response to be slow, because the front-end will wait for the panel-side message to be forwarded
      if (!disableResponse) protocol.msg(ctx, "instance/stop", { instanceUuid });
    } catch (err: any) {
      if (!disableResponse)
        protocol.error(ctx, "instance/stop", { instanceUuid: instanceUuid, err: err.message });
    }
  }
});

// restart the instance
routerApp.on("instance/restart", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    try {
      if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
      await instance.exec(new RestartCommand());
      if (!disableResponse) protocol.msg(ctx, "instance/restart", { instanceUuid });
    } catch (err: any) {
      if (!disableResponse)
        protocol.error(ctx, "instance/restart", { instanceUuid: instanceUuid, err: err.message });
    }
  }
});

// terminate instance method
routerApp.on("instance/kill", async (ctx, data) => {
  const disableResponse = data.disableResponse;
  for (const instanceUuid of data.instanceUuids) {
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) continue;
    try {
      await instance.forceExec(new KillCommand());
      if (!disableResponse) protocol.msg(ctx, "instance/kill", { instanceUuid });
    } catch (err: any) {
      if (!disableResponse)
        protocol.error(ctx, "instance/kill", { instanceUuid: instanceUuid, err: err.message });
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
    await instance.exec(new SendCommand(command));
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
  for (const instanceUuid of instanceUuids) {
    try {
      InstanceSubsystem.removeInstance(instanceUuid, deleteFile);
    } catch (err: any) {}
  }
  protocol.msg(ctx, "instance/delete", instanceUuids);
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
      .then(() => {})
      .catch((err) => {
        logger.error(
          $t("TXT_CODE_Instance_router.performTasksErr", {
            uuid: instance.instanceUuid,
            taskName: taskName,
            err: err
          })
        );
      });
  }

  // Instance software update via Command
  if (taskName === "update" && instance) {
    instance
      .execPreset("update", parameter)
      .then(() => {})
      .catch((err) => {
        logger.error(
          $t("TXT_CODE_Instance_router.performTasksErr", {
            uuid: instance.instanceUuid,
            taskName: taskName,
            err: err
          })
        );
      });
  }
  // Quick install Minecraft server task
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
      .then(() => {})
      .catch((err) => {});
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
