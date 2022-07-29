// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

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
      remarks: remoteService.config.remarks,
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
