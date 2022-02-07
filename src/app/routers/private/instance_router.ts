/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
*/

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { multiOperationForwarding } from "../../service/instance_service";
import { timeUuid } from "../../service/password";

const router = new Router({ prefix: "/instance" });

// [Top-level Permission]
// 获取某实例详细信息
router.get(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/detail", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 创建实例
router.post(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/new", config);
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 创建实例时上传文件
router.post(
  "/upload",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, upload_dir: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      // const uploadDir = String(ctx.query.upload_dir);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/new", config);
      const newInstanceUuid = result.instanceUuid;
      if (!newInstanceUuid) throw new Error("创建实例失败");
      // 向守护进程发送跨端文件上传任务
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "upload",
        password: password,
        parameter: {
          uploadDir: ".",
          instanceUuid: newInstanceUuid
        }
      });
      ctx.body = {
        instanceUuid: newInstanceUuid,
        password,
        addr
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 更新实例信息（管理用户）
router.put(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 删除实例
router.delete(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String }, body: { uuids: Object, deleteFile: Boolean } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuids = ctx.request.body.uuids;
      const deleteFile = ctx.request.body.deleteFile;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/delete", {
        instanceUuids,
        deleteFile
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// 批量开启实例路由
router.post("/multi_open", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/open", {
          instanceUuids
        })
        .catch(() => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
// 批量关闭实例路由
router.post("/multi_stop", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/stop", {
          instanceUuids
        })
        .catch(() => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
// 批量终止实例路由
router.post("/multi_kill", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/kill", { instanceUuids })
        .catch((err) => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

export default router;
