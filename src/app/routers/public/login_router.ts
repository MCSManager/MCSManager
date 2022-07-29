// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Koa from "koa";
import Router from "@koa/router";
import validator from "../../middleware/validator";
import permission from "../../middleware/permission";
import { check, login, logout, checkBanIp } from "../../service/passport_service";
import { systemConfig } from "../../setting";
import userSystem from "../../service/system_user";
import { logger } from "../../service/log";
import { $t } from "../../i18n";
const router = new Router({ prefix: "/auth" });

// [Public Permission]
// login route
router.post(
  "/login",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    if (!checkBanIp(ctx)) throw new Error($t("router.login.ban"));
    if (check(ctx)) return (ctx.body = "Logined");
    let token = login(ctx, userName, passWord);
    if (token) {
      ctx.body = true;
    } else {
      throw new Error($t("router.login.nameOrPassError"));
    }
  }
);

// [Public Permission]
// exit route
router.get(
  "/logout",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    logout(ctx);
    ctx.body = true;
  }
);

// [Public Permission]
// Display the text of the login interface
router.all(
  "/login_info",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = {
      loginInfo: systemConfig.loginInfo
    };
  }
);

// [Public Permission]
// Get the state information that the panel can expose
router.all(
  "/status",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    let isInstall = true;
    if (userSystem.objects.size === 0) {
      isInstall = false;
    }
    ctx.body = {
      isInstall
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
    const userName = ctx.request.body.username;
    const passWord = ctx.request.body.password;
    if (userSystem.objects.size === 0) {
      if (!userSystem.validatePassword(passWord)) throw new Error($t("router.user.passwordCheck"));
      logger.info($t("router.login.init", { userName }));
      userSystem.create({
        userName,
        passWord,
        permission: 10
      });
      login(ctx, userName, passWord);
      return (ctx.body = true);
    }
    throw new Error($t("router.user.installed"));
  }
);

export default router;
