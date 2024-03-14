import Koa from "koa";
import Router from "@koa/router";
import permission from "../middleware/permission";
import { bind2FA, confirm2FaQRCode, getUserUuid, logout } from "../service/passport_service";
import userSystem from "../service/user_service";
import { getToken, isAjax } from "../service/passport_service";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import { isTopPermissionByUuid } from "../service/permission_service";
import validator from "../middleware/validator";
import { v4 } from "uuid";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";

const router = new Router({ prefix: "/auth" });

// [Low-level Permission]
// add token return
router.get(
  "/token",
  permission({ level: ROLE.USER, token: false, speedLimit: false }),
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
router.get("/", permission({ level: ROLE.USER, token: false, speedLimit: false }), async (ctx) => {
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
        const remoteService = RemoteServiceSubsystem.getInstance(iterator.daemonId);
        // If the remote service doesn't exist at all, load a deleted prompt
        if (!remoteService) {
          resInstances.push({
            hostIp: "-- Unknown --",
            instanceUuid: iterator.instanceUuid,
            daemonId: iterator.daemonId,
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
            daemonId: remoteService.uuid,
            status: instancesInfo.status,
            nickname: instancesInfo.config.nickname,
            ie: instancesInfo.config.ie,
            oe: instancesInfo.config.oe,
            endTime: instancesInfo.config.endTime,
            lastDatetime: instancesInfo.config.lastDatetime,
            stopCommand: instancesInfo.config.stopCommand
          });
        } catch (error: any) {
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            instanceUuid: iterator.instanceUuid,
            daemonId: iterator.daemonId,
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
      isInit: user.isInit,
      open2FA: user.open2FA,
      secret: user.secret
    };
  }
});

// [Low-level Permission]
// Modify personal user information
router.put(
  "/update",
  permission({ level: ROLE.USER }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    if (userUuid) {
      const config = ctx.request.body;
      const { passWord, isInit } = config;
      if (!userSystem.validatePassword(passWord))
        throw new Error($t("TXT_CODE_router.user.passwordCheck"));
      await userSystem.edit(userUuid, { passWord, isInit });
      ctx.body = logout(ctx);
    }
  }
);

// [Low-level Permission]
// API generation and shutdown
router.put(
  "/api",
  permission({ level: ROLE.USER }),
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
    } catch (error: any) {
      ctx.body = error;
    }
  }
);

// [Low-level Permission]
// 2FA
router.post(
  "/bind2fa",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    if (userUuid) {
      const qrcode = await bind2FA(ctx);
      ctx.body = qrcode;
    }
  }
);

// [Low-level Permission]
// 2FA
router.post(
  "/confirm2fa",
  permission({ level: 1 }),
  validator({ body: { enable: Boolean } }),
  async (ctx: Koa.ParameterizedContext) => {
    const enable = Boolean(ctx.request.body.enable);
    const userUuid = getUserUuid(ctx);
    await confirm2FaQRCode(userUuid, enable);
    ctx.body = true;
  }
);

export default router;
