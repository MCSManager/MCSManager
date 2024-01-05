// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Koa from "koa";
import Router from "@koa/router";
import validator from "../../middleware/validator";
import permission from "../../middleware/permission";
import userSystem from "../../service/system_user";
import { $t } from "../../i18n";
import { check, register } from "../../service/passport_service";
import { systemConfig } from "../../setting";

const router = new Router({ prefix: "/auth" });

// [Public Permission]
// register route
router.post(
  "/register",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String, rePassword: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig.canRegister) throw new Error($t("router.register.disableRegister"));
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const rePassWord = String(ctx.request.body.rePassword);
    if (check(ctx)) return (ctx.body = "Logined");
    if (userSystem.existUserName(userName)) throw new Error($t("router.user.existsUserName"));
    if (!userSystem.validatePassword(passWord)) throw new Error($t("router.user.invalidPassword"));
    if (passWord !== rePassWord) throw new Error($t("router.register.passwordNotTheSame"));
    ctx.body = await register(ctx, userName, passWord, 1);
  }
);

// [Public Permission]
// Get the ability to register settings
router.get(
  "/register_setting",
  permission({ token: false, level: null }),
  async (ctx) => {
    ctx.body = {canRegister: systemConfig.canRegister};
  }
);

export default router;