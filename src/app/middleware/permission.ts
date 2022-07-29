// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Koa from "koa";
import GlobalVariable from "../common/global_variable";
import userSystem from "../service/system_user";
import { getUuidByApiKey, ILLEGAL_ACCESS_KEY, isAjax } from "../service/passport_service";
import { $t } from "../i18n";

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("permission.forbidden")}`;
}

function tokenError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("permission.forbiddenTokenError")}`;
}

function ajaxError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("permission.xmlhttprequestError")}`;
}

function apiError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("permission.apiError")}`;
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
