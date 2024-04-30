import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest, { RemoteRequestTimeoutError } from "../service/remote_command";
import { timeUuid } from "../service/password";
import { getUserUuid } from "../service/passport_service";
import { isHaveInstanceByUuid } from "../service/permission_service";
import { $t } from "../i18n";
import { isTopPermissionByUuid } from "../service/permission_service";
import { isEmpty, toText, toBoolean, toNumber } from "common";
import { ROLE } from "../entity/user";
import axios from "axios";
import { systemConfig } from "../setting";
import { IQuickStartTemplate } from "common/global";

const router = new Router({ prefix: "/protected_instance" });

// Routing permission verification middleware
router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const daemonId = String(ctx.query.daemonId);
  const userUuid = getUserUuid(ctx);
  if (isHaveInstanceByUuid(userUuid, daemonId, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("TXT_CODE_permission.forbiddenInstance");
  }
});

// [Low-level Permission]
// Enable instance routing
router.all(
  "/open",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/open", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      if (err instanceof RemoteRequestTimeoutError) {
        ctx.body = {};
        return;
      }
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// The instance closes the route
router.all(
  "/stop",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/stop", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Send the command route to the instance
// At this stage, WS cross-panel command transfer has been implemented, and this interface is reserved as an API interface
router.all(
  "/command",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String, command: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const command = String(ctx.query.command);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/command", {
        instanceUuid,
        command
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// restart the instance
router.all(
  "/restart",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/restart", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// terminate the instance
router.all(
  "/kill",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/kill", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// start asynchronous task
router.post(
  "/asynchronous",
  permission({ level: ROLE.USER }),
  validator({
    query: { daemonId: String, uuid: String, task_name: String },
    body: {}
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const taskName = String(ctx.query.task_name).toLowerCase().trim();
      const parameter = ctx.request.body;

      // some asynchronous tasks are only allowed for administrators
      const needTopPermissionTask = ["quick_install"];
      if (
        needTopPermissionTask.includes(taskName) &&
        !isTopPermissionByUuid(ctx.session?.["uuid"])
      ) {
        throw new Error("illegal access");
      }

      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/asynchronous", {
        instanceUuid,
        taskName,
        parameter
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// stop an asynchronous task
router.all(
  "/stop_asynchronous",
  permission({ level: ROLE.USER }),
  validator({
    query: { daemonId: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const parameter = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      // No permission check is required because "Parameter.TaskId" is not easily obtained.
      const result = await new RemoteRequest(remoteService).request("instance/stop_asynchronous", {
        instanceUuid,
        parameter
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// query asynchronous task status
router.all(
  "/query_asynchronous",
  permission({ level: ROLE.ADMIN, speedLimit: false }),
  validator({
    query: { daemonId: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const taskName = String(ctx.query.task_name);
      const parameter = ctx.request.body;
      const taskId = parameter.taskId;
      // Must have administrator to query all asynchronous tasks
      if (!taskId && !isTopPermissionByUuid(getUserUuid(ctx))) {
        throw new Error("Unauthorized access");
      }
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      ctx.body = await new RemoteRequest(remoteService).request("instance/query_asynchronous", {
        instanceUuid,
        taskName,
        parameter
      });
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Request to establish a data stream dedicated channel with the daemon
router.post(
  "/stream_channel",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const addr = `${remoteService?.config.ip}:${remoteService?.config.port}`;
      const prefix = remoteService?.config.prefix;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "stream_channel",
        password: password,
        parameter: {
          instanceUuid
        }
      });
      ctx.body = {
        password,
        addr,
        prefix
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Get the instance configuration file list based on the file list
router.post(
  "/process_config/list",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const files = ctx.request.body.files;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request(
        "instance/process_config/list",
        {
          instanceUuid,
          files
        }
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Get the content of the specified configuration file
router.get(
  "/process_config/file",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String, fileName: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.fileName);
      const type = String(ctx.query.type);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request(
        "instance/process_config/file",
        {
          instanceUuid,
          fileName,
          config: null,
          type
        }
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Update the content of the specified configuration file
router.put(
  "/process_config/file",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String, fileName: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.fileName);
      const type = String(ctx.query.type);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request(
        "instance/process_config/file",
        {
          instanceUuid,
          fileName,
          config,
          type
        }
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Update instance low-privilege configuration data (normal user)
router.put(
  "/instance_update",
  permission({ level: ROLE.USER }),
  validator({
    query: { uuid: String, daemonId: String },
    body: {}
  }),
  async (ctx) => {
    try {
      // Here is the low-privileged user configuration setting interface,
      // in order to prevent data injection, a layer of filtering must be performed
      const daemonId = toText(ctx.query.daemonId);
      const instanceUuid = toText(ctx.query.uuid);
      const config = ctx.request.body;

      // Steam Rcon configuration
      const rconIp = toText(config.rconIp);
      const rconPort = toNumber(config.rconPort);
      const rconPassword = toText(config.rconPassword);
      const enableRcon = toBoolean(config.enableRcon);

      // Ping protocol configuration
      const pingConfig = {
        ip: toText(config.pingConfig?.ip),
        port: toNumber(config.pingConfig?.port),
        type: config.pingConfig?.type
      };

      // event task configuration
      const eventTask = {
        autoStart: toBoolean(config.eventTask?.autoStart),
        autoRestart: toBoolean(config.eventTask?.autoRestart)
      };

      // web terminal settings
      const terminalOption = {
        haveColor: toBoolean(config.terminalOption?.haveColor),
        pty: toBoolean(config.terminalOption?.pty),
        ptyWindowCol: toNumber(config.terminalOption?.ptyWindowCol),
        ptyWindowRow: toNumber(config.terminalOption?.ptyWindowRow)
      };

      // extra service
      const extraServiceConfig = {
        openFrpTunnelId: toText(config.extraServiceConfig?.openFrpTunnelId),
        openFrpToken: toText(config.extraServiceConfig?.openFrpToken)
      };

      const crlf = !isEmpty(config.crlf) ? toNumber(config?.crlf) : null;
      const oe = !isEmpty(config.oe) ? toText(config?.oe) : null;
      const ie = !isEmpty(config.ie) ? toText(config?.ie) : null;
      const stopCommand = config.stopCommand ? toText(config.stopCommand) : null;

      const remoteService = RemoteServiceSubsystem.getInstance(daemonId || "");
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config: {
          pingConfig: !isEmpty(config.pingConfig) ? pingConfig : null,
          eventTask: !isEmpty(config.eventTask) ? eventTask : null,
          terminalOption: !isEmpty(config.terminalOption) ? terminalOption : null,
          extraServiceConfig: !isEmpty(config.extraServiceConfig) ? extraServiceConfig : null,
          crlf,
          oe,
          ie,
          stopCommand,
          rconIp,
          rconPort,
          rconPassword,
          enableRcon
        }
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// Get the terminal log of an instance
router.get(
  "/outputlog",
  permission({ level: ROLE.USER, speedLimit: false }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      let result = await new RemoteRequest(remoteService).request("instance/outputlog", {
        instanceUuid
      });
      if (ctx.query.size) {
        let size,
          sizeStr = ctx.query.size;
        if (sizeStr instanceof Array) {
          sizeStr = sizeStr[0];
        }
        size = parseInt(sizeStr);
        if (sizeStr.toLowerCase().endsWith("kb")) {
          size *= 1024;
        }
        if (result.length > size) {
          result = result.slice(-size);
        }
      }
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
router.post(
  "/install_instance",
  permission({ level: ROLE.USER, speedLimit: true }),
  validator({
    query: { daemonId: String, uuid: String },
    body: { description: String, title: String }
  }),
  async (ctx) => {
    if (systemConfig?.allowUsePreset === false && !isTopPermissionByUuid(getUserUuid(ctx))) {
      ctx.status = 403;
      ctx.body = new Error($t("TXT_CODE_b5a47731"));
      return;
    }
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const description = String(ctx.request.body.description);
      const title = String(ctx.request.body.title);

      const presetUrl = systemConfig?.presetPackAddr;
      if (!presetUrl) throw new Error("Preset Addr is empty!");

      const { data: presetConfig } = await axios<IQuickStartTemplate>({
        url: presetUrl,
        method: "GET"
      });

      const packages = presetConfig.packages;

      if (!(packages instanceof Array)) throw new Error("Preset Config is not array!");
      const targetPresetConfig = packages.find(
        (v) => v.title === title && v.description === description
      );
      if (!targetPresetConfig) throw new Error("Preset Config is not found!");

      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("instance/asynchronous", {
        taskName: "install_instance",
        instanceUuid,
        parameter: targetPresetConfig
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
