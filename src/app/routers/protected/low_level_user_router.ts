// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Koa from "koa";
import Router from "@koa/router";
import permission from "../../middleware/permission";
import { getUserUuid } from "../../service/passport_service";
import userSystem from "../../service/system_user";
import { getToken, isAjax } from "../../service/passport_service";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { isTopPermissionByUuid } from "../../service/permission_service";
import validator from "../../middleware/validator";
import { v4 } from "uuid";
import { $t } from "../../i18n";

const router = new Router({ prefix: "/auth" });

// [Low-level Permission]
// 新增令牌返回
router.get(
  "/token",
  permission({ level: 1, token: false }),
  async (ctx: Koa.ParameterizedContext) => {
    // 有且只有 Ajax 请求能够获取 token 令牌
    if (isAjax(ctx)) {
      ctx.body = getToken(ctx);
    } else {
      throw new Error("The request is not an Ajax request.");
    }
  }
);

// [Low-level Permission]
// 获取用户数据
router.get("/", permission({ level: 1, token: false }), async (ctx) => {
  // 默认权限获取本人
  let uuid = getUserUuid(ctx);
  // 前端可以选择需要高级数据
  const advanced = ctx.query.advanced;
  // 管理权限可获取任何人
  if (isTopPermissionByUuid(uuid)) {
    if (ctx.query.uuid) uuid = String(ctx.query.uuid);
  }
  // 有且只有 Ajax 请求准许访问
  if (isAjax(ctx)) {
    const user = userSystem.getInstance(uuid);
    if (!user) throw new Error("The UID does not exist");

    // 高级功能可选，分析每一个实例数据
    let resInstances = [];
    if (advanced) {
      const instances = user.instances;
      for (const iterator of instances) {
        const remoteService = RemoteServiceSubsystem.getInstance(iterator.serviceUuid);
        // 若此远程服务根本不存在，则装载一个已删除的提示
        if (!remoteService) {
          resInstances.push({
            hostIp: "-- Unknown --",
            instanceUuid: iterator.instanceUuid,
            serviceUuid: iterator.serviceUuid,
            status: -1,
            nickname: "--",
            remarks: "--"
          });
          continue;
        }
        try {
          // Note: 这里可以整合UUID来节省返回的流量，暂不做此优化
          let instancesInfo = await new RemoteRequest(remoteService).request("instance/section", {
            instanceUuids: [iterator.instanceUuid]
          });
          instancesInfo = instancesInfo[0];
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            remarks: remoteService.config.remarks,
            instanceUuid: instancesInfo.instanceUuid,
            serviceUuid: remoteService.uuid,
            status: instancesInfo.status,
            nickname: instancesInfo.config.nickname,
            ie: instancesInfo.config.ie,
            oe: instancesInfo.config.oe,
            endTime: instancesInfo.config.endTime,
            lastDatetime: instancesInfo.config.lastDatetime,
            stopCommand: instancesInfo.config.stopCommand
          });
        } catch (error) {
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            instanceUuid: iterator.instanceUuid,
            serviceUuid: iterator.serviceUuid,
            status: -1,
            nickname: "--"
          });
        }
      }
    } else {
      resInstances = user.instances;
    }
    // 响应用户数据
    ctx.body = {
      uuid: user.uuid,
      userName: user.userName,
      loginTime: user.loginTime,
      registerTime: user.registerTime,
      instances: resInstances,
      permission: user.permission,
      token: getToken(ctx),
      apiKey: user.apiKey,
      isInit: user.isInit
    };
  }
});

// [Low-level Permission]
// 修改个人用户信息
router.put(
  "/update",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    if (userUuid) {
      const config = ctx.request.body;
      const { passWord, isInit } = config;
      if (!userSystem.validatePassword(passWord)) throw new Error($t("router.user.passwordCheck"));
      userSystem.edit(userUuid, { passWord, isInit });
      ctx.body = true;
    }
  }
);

// [Low-level Permission]
// API 生成和关闭
router.put(
  "/api",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    const enable = ctx.request.body.enable;
    const user = userSystem.getInstance(userUuid);
    let newKey = "";
    try {
      if (user) {
        if (enable) {
          newKey = v4().replace(/-/gim, "");
          userSystem.edit(userUuid, {
            apiKey: newKey
          });
        } else {
          userSystem.edit(userUuid, {
            apiKey: ""
          });
        }
      }
      ctx.body = newKey;
    } catch (error) {
      ctx.body = error;
    }
  }
);

export default router;
