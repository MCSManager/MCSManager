// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { timeUuid } from "../../service/password";
import { getUserUuid } from "../../service/passport_service";
import { isHaveInstanceByUuid } from "../../service/permission_service";
import { $t } from "../../i18n";
const router = new Router({ prefix: "/protected_instance" });

// 路由权限验证中间件
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
// 开启实例路由
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
// 实例关闭路由
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
// 向实例发送命令路由
// 现阶段已实现WS跨面板端命令传递，此接口保留做API接口
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
// 重启实例
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
// 终止实例
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
// 执行异步任务
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
      const taskName = String(ctx.query.task_name);
      const parameter = ctx.body;
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
// 终止异步任务
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
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/stop_asynchronous", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// 请求与守护进程建立数据流专有通道
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
// 根据文件列表获取实例配置文件列表
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
// 获取指定配置文件内容
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
// 更新指定配置文件内容
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
// 更新实例低权限配置数据（普通用户）
router.put(
  "/instance_update",
  permission({ level: 1 }),
  validator({
    query: { uuid: String, remote_uuid: String },
    body: { pingConfig: Object, eventTask: Object, terminalOption: Object }
  }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      // 此处是低权限用户配置设置接口，为防止数据注入，必须进行一层过滤
      // Ping 协议配置
      const pingConfig = {
        ip: String(config.pingConfig?.ip),
        port: Number(config.pingConfig?.port),
        type: config.pingConfig?.type
      };
      // 事件任务配置
      const eventTask = {
        autoStart: Boolean(config.eventTask?.autoStart),
        autoRestart: Boolean(config.eventTask?.autoRestart)
      };
      // 网页终端设置
      const terminalOption = {
        haveColor: Boolean(config.terminalOption?.haveColor),
        pty: Boolean(config.terminalOption?.pty),
        ptyWindowCol: Number(config.terminalOption?.ptyWindowCol),
        ptyWindowRow: Number(config.terminalOption?.ptyWindowRow)
      };

      // 普通用户可控参数
      const crlf = Number(config?.crlf);
      const oe = config.oe ? String(config?.oe) : null;
      const ie = config.ie ? String(config?.ie) : null;
      const stopCommand = config.stopCommand ? String(config.stopCommand) : null;

      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);

      // 松散性参数传递，每个配置都可以传递或不传递
      // 其子对象配置一定要完整或者一个都没有
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config: {
          pingConfig: config.pingConfig?.ip != null ? pingConfig : null,
          eventTask: config.eventTask?.autoStart != null ? eventTask : null,
          terminalOption: config.terminalOption?.pty != null ? terminalOption : null,
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

// 获取某实例终端日志
router.get(
  "/outputlog",
  permission({ level: 1 }),
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
