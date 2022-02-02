/*
  Copyright (C) 2022 Suwings(https://github.com/Suwings)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  According to the GPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings(https://github.com/Suwings)

  本程序为自由软件，你可以依据 GPL 的条款（第三版或者更高），再分发和/或修改它。
  该程序以具有实际用途为目的发布，但是并不包含任何担保，
  也不包含基于特定商用或健康用途的默认担保。具体细节请查看 GPL 协议。

  根据协议，您必须保留所有版权声明，如果修改源码则必须开源修改后的源码。
  前往 https://mcsmanager.com/ 申请闭源开发授权或了解更多。
*/

import Koa from "koa";
import GlobalVariable from "../common/global_variable";
import userSystem from "../service/system_user";
import { getUuidByApiKey, ILLEGAL_ACCESS_KEY, isAjax } from "../service/passport_service";

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] 权限不足";
}

function tokenError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] 令牌(Token)验证失败，拒绝访问";
}

function ajaxError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] 无法找到请求头 x-requested-with: xmlhttprequest";
}

function apiError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = "[Forbidden] API 密钥不正确";
}

// 基本用户权限中间件
export = (parameter: any) => {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    // 若为 API 请求，则进行 API 级的权限判断
    if (ctx.query.apikey) {
      const apiKey = String(ctx.query.apikey);
      const user = getUuidByApiKey(apiKey);
      if (user && user.permission >= parameter["level"]) {
        return await next();
      } else {
        return apiError(ctx);
      }
    }

    // 若路由需要 Token 验证则进行验证，默认是自动验证
    if (parameter["token"] !== false) {
      if (!isAjax(ctx)) return ajaxError(ctx);
      const requestToken = ctx.query.token;
      const realToken = ctx.session["token"];
      if (requestToken !== realToken) {
        return tokenError(ctx);
      }
    }

    // 若权限属性为数字则自动执行权限判定
    if (!isNaN(parseInt(parameter["level"]))) {
      // 最基础的身份认证判定
      if (ctx.session["login"] === true && ctx.session["uuid"] && ctx.session["userName"]) {
        const user = userSystem.getInstance(ctx.session["uuid"]);
        // 普通用户与管理用户的权限判断
        if (user && user.permission >= parameter["level"]) {
          return await next();
        }
      }
    } else {
      return await next();
    }

    // 记录越权访问次数
    GlobalVariable.set(ILLEGAL_ACCESS_KEY, GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0) + 1);
    return verificationFailed(ctx);
  };
};
