import Koa from "koa";
import { GlobalVariable } from "common";
import userSystem from "../service/user_service";
import { getUuidByApiKey, ILLEGAL_ACCESS_KEY, isAjax, logout } from "../service/passport_service";
import { $t } from "../i18n";

function requestSpeedLimit(ctx: Koa.ParameterizedContext) {
  const SESSION_REQ_TIME = "lastRequestTime";
  const INV = 40;
  const currentTime = new Date().getTime();
  const LastTime = ctx.session?.[SESSION_REQ_TIME];
  if (!ctx.session) return false;
  if (LastTime && typeof LastTime === "number") {
    if (currentTime - LastTime < INV) return false;
    ctx.session[SESSION_REQ_TIME] = currentTime;
  } else {
    ctx.session[SESSION_REQ_TIME] = currentTime;
  }

  return true;
}

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("TXT_CODE_permission.forbidden")}`;
}

function tokenError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("TXT_CODE_permission.forbiddenTokenError")}`;
}

function ajaxError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("TXT_CODE_permission.xmlhttprequestError")}`;
}

function apiError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `[Forbidden] ${$t("TXT_CODE_permission.apiError")}`;
}

function tooFast(ctx: Koa.ParameterizedContext) {
  ctx.status = 500;
  ctx.body = `[TooFast] ${$t("TXT_CODE_permission.tooFast")}`;
}

interface IPermissionCfg {
  token?: boolean;
  level?: number | null;
  speedLimit?: boolean;
}

// Basic user permission middleware
export default (parameter: IPermissionCfg) => {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    if (
      (parameter.speedLimit == null || parameter.speedLimit === true) &&
      Number(parameter.level) < 10
    ) {
      // Request speed check
      if (!requestSpeedLimit(ctx)) {
        return tooFast(ctx);
      }
    }

    // If it is an API request, perform API-level permission judgment
    if (ctx.query.apikey) {
      const apiKey = String(ctx.query.apikey);
      const user = getUuidByApiKey(apiKey);
      if (user && user.permission >= Number(parameter.level)) {
        return await next();
      } else {
        return apiError(ctx);
      }
    }

    // If the route requires Token verification, it will be verified, the default is automatic verification
    if (parameter.token !== false) {
      if (!isAjax(ctx)) return ajaxError(ctx);
      const requestToken = ctx.query.token;
      const realToken = ctx.session?.["token"];
      if (requestToken !== realToken) {
        return tokenError(ctx);
      }
    }

    // If the permission attribute is a number, the permission determination is automatically executed
    if (!isNaN(parseInt(String(parameter.level)))) {
      // The most basic authentication decision
      if (ctx.session?.["login"] === true && ctx.session["uuid"] && ctx.session["userName"]) {
        const user = userSystem.getInstance(ctx.session["uuid"]);

        // ban check
        if (user && user.permission < 0) {
          return logout(ctx);
        }

        // Judgment of permissions for ordinary users and administrative users
        if (user && user.permission >= Number(parameter.level)) {
          return await next();
        }
      }
      // END: to verificationFailed()
    } else {
      return await next();
    }

    // record the number of unauthorized access
    GlobalVariable.set(ILLEGAL_ACCESS_KEY, GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0) + 1);
    return verificationFailed(ctx);
  };
};
