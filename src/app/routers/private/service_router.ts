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

import Koa from "koa";
import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";

const router = new Router({ prefix: "/service" });

// [Top-level Permission]
// 获取远程服务列表
// 仅包含服务信息，不包括实例信息列表
router.get("/remote_services_list", permission({ level: 10 }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    result.push({
      uuid: remoteService.uuid,
      ip: remoteService.config.ip,
      port: remoteService.config.port,
      available: remoteService.available,
      remarks: remoteService.config.remarks
    });
  }
  ctx.body = result;
});

// [Top-level Permission]
// 向守护进程查询指定的实例
router.get(
  "/remote_service_instances",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, page: Number, page_size: Number } }),
  async (ctx) => {
    const serviceUuid = String(ctx.query.remote_uuid);
    const page = Number(ctx.query.page);
    const pageSize = Number(ctx.query.page_size);
    const instanceName = ctx.query.instance_name;
    const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
    const result = await new RemoteRequest(remoteService).request("instance/select", {
      page,
      pageSize,
      condition: {
        instanceName
      }
    });
    ctx.body = result;
  }
);

// [Top-level Permission]
// 获取远程服务器系统信息
router.get("/remote_services_system", permission({ level: 10 }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let instancesInfo = null;
    try {
      instancesInfo = await new RemoteRequest(remoteService).request("info/overview");
    } catch (err) {
      continue;
    }
    result.push(instancesInfo);
  }
  ctx.body = result;
});

// [Top-level Permission]
// 获取远程服务器实例信息（浏览过大）
router.get("/remote_services", permission({ level: 10 }), async (ctx) => {
  const result = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let instancesInfo = [];
    try {
      instancesInfo = await new RemoteRequest(remoteService).request("instance/overview");
    } catch (err) {
      // 忽略请求出错
    }
    // 如果连接可用则发送远程指令
    result.push({
      uuid: remoteService.uuid,
      ip: remoteService.config.ip,
      port: remoteService.config.port,
      available: remoteService.available,
      instances: instancesInfo
    });
  }
  ctx.body = result;
});

// [Top-level Permission]
// 新增远程服务
router.post(
  "/remote_service",
  permission({ level: 10 }),
  validator({ body: { apiKey: String, port: Number, ip: String, remarks: String } }),
  async (ctx) => {
    const parameter = ctx.request.body;
    // 进行异步注册
    const instance = RemoteServiceSubsystem.registerRemoteService({
      apiKey: parameter.apiKey,
      port: parameter.port,
      ip: parameter.ip,
      remarks: parameter.remarks || ""
    });
    ctx.body = instance.uuid;
  }
);

// [Top-level Permission]
// 修改远程服务参数
router.put(
  "/remote_service",
  permission({ level: 10 }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    const parameter = ctx.request.body;
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("实例不存在");
    await RemoteServiceSubsystem.edit(uuid, {
      port: parameter.port,
      ip: parameter.ip,
      apiKey: parameter.apiKey,
      remarks: parameter.remarks
    });
    ctx.body = true;
  }
);

// [Top-level Permission]
// 删除远程服务
router.delete(
  "/remote_service",
  permission({ level: 10 }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("实例不存在");
    await RemoteServiceSubsystem.deleteRemoteService(uuid);
    ctx.body = true;
  }
);

// [Top-level Permission]
// 连接远程实例
router.get(
  "/link_remote_service",
  permission({ level: 10 }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.request.query.uuid);
    if (!RemoteServiceSubsystem.services.has(uuid)) throw new Error("实例不存在");
    try {
      RemoteServiceSubsystem.getInstance(uuid).connect();
      ctx.body = true;
    } catch (error) {
      ctx.body = error;
    }
  }
);

export default router;
