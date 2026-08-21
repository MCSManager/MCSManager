import Router from "@koa/router";
import axios from "axios";
import Koa from "koa";
import SystemConfig from "../entity/setting";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { logger } from "../service/log";
import { operationLogger } from "../service/operation_logger";
import { check, checkBanIp, getUserFromCtx, login, logout } from "../service/passport_service";
import userSystem, { TwoFactorError } from "../service/user_service";
import { systemConfig } from "../setting";

const router = new Router({ prefix: "/auth" });

// [Public Permission]
// login route
router.post(
  "/login",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    if (systemConfig?.ssoEnabled && systemConfig?.ssoOnlyMode) {
      ctx.body = new Error("Password login is disabled. Please use SSO.");
      return;
    }
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const code = String(ctx.request.body.code);
    if (!checkBanIp(ctx)) throw new Error($t("TXT_CODE_router.login.ban"));
    if (check(ctx)) return (ctx.body = "Logined");
    try {
      ctx.body = login(ctx, userName, passWord, code);
      operationLogger.info("user_login", {
        operator_ip: ctx.ip,
        operator_name: userName,
        login_result: true
      });
    } catch (error: any) {
      if (error instanceof TwoFactorError && !code) {
        ctx.body = "NEED_2FA";
        return;
      }
      ctx.body = error;
      operationLogger.warning("user_login", {
        operator_ip: ctx.ip,
        operator_name: userName,
        login_result: false
      });
    }
  }
);

// [Public Permission]
// exit route
router.get(
  "/logout",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    logout(ctx);
    ctx.body = true;
  }
);

// [Public Permission]
// Display the text of the login interface
router.all(
  "/login_info",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = {
      loginInfo: systemConfig?.loginInfo
    };
  }
);

// [Public Permission]
// Get the state information that the panel can expose
router.all(
  "/status",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    let isInstall = true;
    if (userSystem.objects.size === 0) {
      isInstall = false;
    }

    const settings: Partial<SystemConfig> = {
      businessMode: systemConfig?.businessMode || false,
      businessId: systemConfig?.businessId || ""
    };
    const user = getUserFromCtx(ctx);
    if (user && user.permission >= ROLE.USER) {
      settings.canFileManager = systemConfig?.canFileManager || false;
      settings.allowUsePreset = systemConfig?.allowUsePreset || false;
      settings.allowChangeCmd = systemConfig?.allowChangeCmd || false;
      settings.panelId = systemConfig?.panelId || "";
      settings.ssoEnabled = systemConfig?.ssoEnabled || false;
    }

    ctx.body = {
      isInstall,
      language: systemConfig?.language || null,
      settings
    };
  }
);

// [Public Permission]
// Install the panel, only available when the number of user entities is 0
router.all(
  "/install",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    if (userSystem.objects.size === 0) {
      if (!userSystem.validatePassword(passWord))
        throw new Error($t("TXT_CODE_router.user.passwordCheck"));
      logger.info($t("TXT_CODE_router.login.init", { userName }));
      await userSystem.create({
        userName,
        passWord,
        permission: 10
      });
      operationLogger.log("user_create", {
        operator_ip: ctx.ip,
        operator_name: userName,
        target_user_name: userName
      });
      login(ctx, userName, passWord);
      return (ctx.body = true);
    }
    throw new Error($t("TXT_CODE_router.user.installed"));
  }
);

router.all(
  "/proxy",
  validator({ query: { target: String } }),
  permission({ level: ROLE.ADMIN }),
  async (ctx) => {
    try {
      const response = await axios.request({
        method: (ctx.query.method as string) || ctx.method,
        url: String(ctx.query.target)
      });
      if (response.status !== 200) throw new Error("Response code != 200");
      ctx.body = response.data;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
