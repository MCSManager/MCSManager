// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

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
// add token return
router.get(
  "/token",
  permission({ level: 1, token: false, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    // Some and only Ajax requests can get the token
    if (isAjax(ctx)) {
      ctx.body = getToken(ctx);
    } else {
      throw new Error("The request is not an Ajax request.");
    }
  }
);

// [Low-level Permission]
// get user data
router.get("/", permission({ level: 1, token: false, speedLimit: false }), async (ctx) => {
  // Default permission to get me
  let uuid = getUserUuid(ctx);
  // The front end can choose to require advanced data
  const advanced = ctx.query.advanced;
  // Admin permissions can be obtained from anyone
  if (isTopPermissionByUuid(uuid)) {
    if (ctx.query.uuid) uuid = String(ctx.query.uuid);
  }
  // Some and only Ajax requests grant access
  if (isAjax(ctx)) {
    const user = userSystem.getInstance(uuid);
    if (!user) throw new Error("The UID does not exist");

    // Advanced functions are optional, analyze each instance data
    let resInstances = [];
    if (advanced) {
      const instances = user.instances;
      for (const iterator of instances) {
        const remoteService = RemoteServiceSubsystem.getInstance(iterator.serviceUuid);
        // If the remote service doesn't exist at all, load a deleted prompt
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
          // Note: UUID can be integrated here to save the returned traffic, and this optimization will not be done for the time being
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
    // respond to user data
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
// Modify personal user information
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
      await userSystem.edit(userUuid, { passWord, isInit });
      ctx.body = true;
    }
  }
);

// [Low-level Permission]
// API generation and shutdown
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
          await userSystem.edit(userUuid, {
            apiKey: newKey
          });
        } else {
          await userSystem.edit(userUuid, {
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
