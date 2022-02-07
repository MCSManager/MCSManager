/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
*/

import Koa from "koa";
import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { register } from "../../service/passport_service";
import userSystem from "../../service/system_user";

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
    if (userName.length < 2 || userName.length > 18) throw new Error("错误的用户名长度规则");
    if (passWord.length < 6 || passWord.length > 18) throw new Error("错误的密码长度规则");
    if (userSystem.existUserName(userName)) throw new Error("用户名已经被占用");
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
    ctx.throw(500, "无法完成用户数据删除");
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
