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
import permission from "../../middleware/permission";
import userSystem from "../../service/system_user";
import { ICompleteUser } from "../../entity/entity_interface";
import { $t } from "../../i18n";

const router = new Router({ prefix: "/auth" });

// [Top-level Permission]
// 更新用户数据
router.put("/", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const { uuid, config } = ctx.request.body;
  const { passWord } = config;
  if (passWord && !userSystem.validatePassword(passWord))
    throw new Error($t("router.user.passwordCheck"));
  try {
    userSystem.edit(uuid, config);
    ctx.body = true;
  } catch (error) {
    ctx.throw(500, error.message);
  }
});

// [Top-level Permission]
// 获取所有用户数据
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
