// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Koa from "koa";
import Router from "@koa/router";
import permission from "../../middleware/permission";
import userSystem from "../../service/system_user";
import { ICompleteUser } from "../../entity/entity_interface";
import { $t } from "../../i18n";

const router = new Router({ prefix: "/auth" });

// [Top-level Permission]
router.put("/", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const { uuid, config } = ctx.request.body;
  const { passWord } = config;
  if (passWord && !userSystem.validatePassword(passWord))
    throw new Error($t("router.user.passwordCheck"));
  try {
    await userSystem.edit(uuid, config);
    ctx.body = true;
  } catch (error) {
    ctx.throw(500, error.message);
  }
});

// [Top-level Permission]
router.get("/overview", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const users: Array<ICompleteUser> = [];
  userSystem.objects.forEach((user) => {
    users.push({
      uuid: user.uuid,
      userName: user.userName,
      permission: user.permission,
      instances: user.instances,
      loginTime: user.loginTime,
      registerTime: user.loginTime
    });
  });
  ctx.body = users;
});

export default router;
