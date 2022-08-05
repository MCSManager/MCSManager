// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

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

// Basic user permission middleware
export = (parameter: any) => {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    // If it is an API request, perform API-level permission judgment
    if (ctx.query.apikey) {
      const apiKey = String(ctx.query.apikey);
      const user = getUuidByApiKey(apiKey);
      if (user && user.permission >= parameter["level"]) {
        return await next();
      } else {
        return apiError(ctx);
      }
    }

    // If the route requires Token verification, it will be verified, the default is automatic verification
    if (parameter["token"] !== false) {
      if (!isAjax(ctx)) return ajaxError(ctx);
      const requestToken = ctx.query.token;
      const realToken = ctx.session["token"];
      if (requestToken !== realToken) {
        return tokenError(ctx);
      }
    }

    // If the permission attribute is a number, the permission determination is automatically executed
    if (!isNaN(parseInt(parameter["level"]))) {
      // The most basic authentication decision
      if (ctx.session["login"] === true && ctx.session["uuid"] && ctx.session["userName"]) {
        const user = userSystem.getInstance(ctx.session["uuid"]);
        // Judgment of permissions for ordinary users and administrative users
        if (user && user.permission >= parameter["level"]) {
          return await next();
        }
      }
    } else {
      return await next();
    }

    // record the number of unauthorized access
    GlobalVariable.set(ILLEGAL_ACCESS_KEY, GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0) + 1);
    return verificationFailed(ctx);
  };
};
