/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/
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
// 登录路由
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
// 退出路由
router.get(
  "/logout",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    logout(ctx);
    ctx.body = true;
  }
);

// [Public Permission]
// 登录界面文案展示
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
// 面板可公开的状态信息获取
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
// 安装面板，只有当用户实体数为0时才可使用
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
