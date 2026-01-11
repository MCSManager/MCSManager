import Koa from "koa";
import { GlobalVariable } from "mcsmanager-common";
import { $t } from "../i18n";
import { getUuidByApiKey, ILLEGAL_ACCESS_KEY, isAjax, logout } from "../service/passport_service";
import userSystem from "../service/user_service";

/**
 * @description Request speed limit, 8 requests per second
 */
function requestSpeedLimit(ctx: Koa.ParameterizedContext) {
  const SESSION_REQ_TIMES = "SESSION_REQ_TIMES";
  const MAX_REQUESTS_PER_SECOND = 8;
  const WINDOW_SIZE = 1000;
  const currentTime = new Date().getTime();
  if (!ctx.session) return false;
  let requestTimes: number[] = ctx.session[SESSION_REQ_TIMES] || [];
  requestTimes = requestTimes.filter((time) => currentTime - time < WINDOW_SIZE);
  if (requestTimes.length >= MAX_REQUESTS_PER_SECOND) {
    return false;
  }
  requestTimes.push(currentTime);
  ctx.session[SESSION_REQ_TIMES] = requestTimes;
  return true;
}

// Failed callback
export function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `${$t("TXT_CODE_permission.forbidden")}`;
}

function tokenError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `${$t("TXT_CODE_permission.forbiddenTokenError")}`;
}

function ajaxError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `${$t("TXT_CODE_permission.xmlhttprequestError")}`;
}

function apiError(ctx: Koa.ParameterizedContext) {
  ctx.status = 403;
  ctx.body = `${$t("TXT_CODE_permission.apiError")}`;
}

function tooFast(ctx: Koa.ParameterizedContext) {
  ctx.status = 500;
  ctx.body = `${$t("TXT_CODE_permission.tooFast")}`;
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
    const key = ctx.request?.header["x-request-api-key"] || ctx.query.apikey;
    if (key) {
      const apiKey = String(key);
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
