// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { timeUuid } from "../../service/password";
import { getUserUuid } from "../../service/passport_service";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import { $t } from "../../i18n";
import { isTopPermissionByUuid } from "../../service/permission_service";
import { isEmpty, toText } from "../../../app/common/typecheck";
import { toBoolean } from "../../../app/common/typecheck";
import { toNumber } from "../../../app/common/typecheck";
const router = new Router({ prefix: "/protected_instance" });

// Routing permission verification middleware
router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const serviceUuid = String(ctx.query.remote_uuid);
  const userUuid = getUserUuid(ctx);
  if (isHaveInstanceByUuid(userUuid, serviceUuid, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("permission.forbiddenInstance");
  }
});

// [Low-level Permission]
// Enable instance routing
router.all(
  "/open",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/open", {
        instanceUuids: [instanceUuid]
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// The instance closes the route
router.all(
  "/stop",
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String, command: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const command = String(ctx.query.command);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String, task_name: String },
    body: {}
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const taskName = String(ctx.query.task_name).toLowerCase().trim();
      const parameter = ctx.request.body;

      // some asynchronous tasks are only allowed for administrators
      const needTopPermissionTask = ["quick_install"];
      if (needTopPermissionTask.includes(taskName) && !isTopPermissionByUuid(ctx.session["uuid"])) {
        throw new Error("illegal access");
      }

      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({
    query: { remote_uuid: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const parameter = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 10, speedLimit: false }),
  validator({
    query: { remote_uuid: String, uuid: String }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const taskName = String(ctx.query.task_name);
      const parameter = ctx.request.body;
      const taskId = parameter.taskId;
      // Must have administrator to query all asynchronous tasks
      if (!taskId && !isTopPermissionByUuid(getUserUuid(ctx))) {
        throw new Error("Unauthorized access");
      }
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
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
        addr
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const files = ctx.request.body.files;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String, fileName: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.fileName);
      const type = String(ctx.query.type);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({ query: { remote_uuid: String, uuid: String, fileName: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const fileName = String(ctx.query.fileName);
      const type = String(ctx.query.type);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 1 }),
  validator({
    query: { uuid: String, remote_uuid: String },
    body: {}
  }),
  async (ctx) => {
    try {
      // Here is the low-privileged user configuration setting interface,
      // in order to prevent data injection, a layer of filtering must be performed
      const serviceUuid = toText(ctx.query.remote_uuid);
      const instanceUuid = toText(ctx.query.uuid);
      const config = ctx.request.body;

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

      const extraServiceConfig = {
        openFrpTunnelId: toText(config.extraServiceConfig?.openFrpTunnelId),
        openFrpToken: toText(config.extraServiceConfig?.openFrpToken)
      };

      const crlf = !isEmpty(config.crlf) ? toNumber(config?.crlf) : null;
      const oe = !isEmpty(config.oe) ? toText(config?.oe) : null;
      const ie = !isEmpty(config.ie) ? toText(config?.ie) : null;
      const stopCommand = config.stopCommand ? toText(config.stopCommand) : null;

      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
          stopCommand
        }
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// Get the terminal log of an instance
router.get(
  "/outputlog",
  permission({ level: 1, speedLimit: false }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/outputlog", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
