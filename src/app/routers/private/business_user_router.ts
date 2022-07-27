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
import validator from "../../middleware/validator";
import { register } from "../../service/passport_service";
import userSystem from "../../service/system_user";
import { $t } from "../../i18n";

const router = new Router({ prefix: "/auth" });

// 新增用户数据
router.post(
  "/",
  permission({ level: 10 }),
  validator({ body: { username: String, password: String, permission: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const permission = Number(ctx.request.body.permission);
    if (userName.length < 2 || userName.length > 18)
      throw new Error($t("router.user.invalidUserName"));
    if (passWord.length < 6 || passWord.length > 18)
      throw new Error($t("router.user.invalidPassword"));
    if (userSystem.existUserName(userName)) throw new Error($t("router.user.existsUserName"));
    const result = register(ctx, userName, passWord, permission);
    ctx.body = result;
  }
);

// 删除用户数据
router.del("/", permission({ level: 10 }), async (ctx: Koa.ParameterizedContext) => {
  const uuids = ctx.request.body;
  try {
    for (const iterator of uuids) {
      userSystem.deleteInstance(iterator);
    }
    ctx.body = true;
  } catch (error) {
    ctx.throw(500, $t("router.user.deleteFailure"));
  }
});

// 用户搜索功能
router.get(
  "/search",
  permission({ level: 10 }),
  validator({ query: { page: Number, page_size: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = ctx.query.userName as string;
    const page = Number(ctx.query.page);
    const pageSize = Number(ctx.query.page_size);
    const condition: any = {};
    if (userName) condition["userName"] = `%${userName}%`;
    let resultPage = userSystem.getQueryWrapper().selectPage(condition, page, pageSize);
    // 复制一份，删除多余数据
    resultPage = JSON.parse(JSON.stringify(resultPage));
    resultPage.data.forEach((v) => {
      delete v.passWord;
      delete v.salt;
    });
    ctx.body = resultPage;
  }
);

export default router;
