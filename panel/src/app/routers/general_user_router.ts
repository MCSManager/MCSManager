import Koa from "koa";
import Router from "@koa/router";
import permission from "../middleware/permission";
import { bind2FA, confirm2FaQRCode, getUserUuid, getUserFromCtx, logout } from "../service/passport_service";
import userSystem from "../service/user_service";
import { getToken, isAjax } from "../service/passport_service";
import { getUserByUserName, isTopPermissionByUuid } from "../service/permission_service";
import validator from "../middleware/validator";
import { v4 } from "uuid";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";
import { getInstancesByUuid } from "../service/instance_service";
import { toBoolean } from "mcsmanager-common";

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
  if (isTopPermissionByUuid(uuid) && ctx.query.uuid) uuid = String(ctx.query.uuid);

  // Some and only Ajax requests grant access
  if (isAjax(ctx)) {
    const res = await getInstancesByUuid(uuid, undefined, toBoolean(advanced) || false);
    res.token = getToken(ctx);
    ctx.body = res;
  }
});

// [Low-level Permission]
// Modify personal user information
router.put("/update", permission({ level: ROLE.USER }), async (ctx: Koa.ParameterizedContext) => {
  const userUuid = getUserUuid(ctx);
  if (userUuid) {
    const config = ctx.request.body;
    const { passWord, isInit } = config;
    if (!userSystem.validatePassword(passWord))
      throw new Error($t("TXT_CODE_router.user.passwordCheck"));
    await userSystem.edit(userUuid, { passWord, isInit });
    ctx.body = logout(ctx);
  }
});

// [Low-level Permission]
// API generation and shutdown
router.put("/api", permission({ level: ROLE.USER }), async (ctx: Koa.ParameterizedContext) => {
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
});

// [Low-level Permission]
// 2FA
router.post("/bind2fa", permission({ level: 1 }), async (ctx: Koa.ParameterizedContext) => {
  const userUuid = getUserUuid(ctx);
  if (userUuid) {
    const qrcode = await bind2FA(ctx);
    ctx.body = qrcode;
  }
});

// [Low-level Permission]
// 2FA
router.post(
  "/confirm2fa",
  permission({ level: 1 }),
  validator({ body: { enable: Boolean, TOTPCode: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const TOTPCode = ctx.request.body.TOTPCode;
    const MFAResult = userSystem.check2FA(TOTPCode, getUserFromCtx(ctx) ?? {}, 0);
    const enable = Boolean(ctx.request.body.enable);
    if (enable && !MFAResult) {
      ctx.body = false;
      return;
    }
    const userUuid = getUserUuid(ctx);
    await confirm2FaQRCode(userUuid, enable);
    ctx.body = true;
  }
);

// [Public Permission]
router.get(
  "/query_username",
  permission({ token: false, level: null }),
  validator({
    query: { username: String }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.query.username);
    const user = getUserByUserName(userName);
    if (!user) {
      ctx.body = {
        uuid: null,
        userName: null
      };
    } else {
      ctx.body = {
        uuid: user?.uuid,
        userName: user?.userName
      };
    }
  }
);

export default router;
