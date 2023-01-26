// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Koa from "koa";
import userSystem from "./system_user";
import { timeUuid } from "./password";
import GlobalVariable from "../common/global_variable";
import { systemConfig } from "../setting";
import { logger } from "./log";
import { User } from "../entity/user";

export const BAN_IP_COUNT = "banip";
export const LOGIN_FAILED_KEY = "loginFailed";
export const ILLEGAL_ACCESS_KEY = "illegalAccess";
export const LOGIN_COUNT = "loginCount";
export const LOGIN_FAILED_COUNT_KEY = "loginFailedCount";

export function login(ctx: Koa.ParameterizedContext, userName: string, passWord: string): string {
  // record the number of login requests
  GlobalVariable.set(LOGIN_COUNT, GlobalVariable.get(LOGIN_COUNT, 0) + 1);
  const ip = ctx.socket.remoteAddress;
  // check user information
  if (userSystem.checkUser({ userName, passWord })) {
    // The number of errors to reset this IP after successful login
    const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
    if (ipMap) delete ipMap[ip];
    // Session Session state changes to logged in
    const user = userSystem.getUserByUserName(userName);
    user.loginTime = new Date().toLocaleString();
    ctx.session["login"] = true;
    ctx.session["userName"] = userName;
    ctx.session["uuid"] = user.uuid;
    ctx.session["token"] = timeUuid();
    ctx.session.save();
    logger.info(`[LOGIN] IP: ${ip} Login ${userName} successful!`);
    logger.info(`[LOGIN] Token: ${ctx.session["token"]}`);
    return ctx.session["token"];
  } else {
    // record the number of login failures
    GlobalVariable.set(LOGIN_FAILED_COUNT_KEY, GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0) + 1);
    ctx.session["login"] = null;
    ctx.session["token"] = null;
    ctx.session.save();
    logger.info(`[LOGIN] IP: ${ip} login ${userName} failed!`);
    return null;
  }
}

export function check(ctx: Koa.ParameterizedContext) {
  if (ctx.session["login"] && ctx.session["userName"] && ctx.session["token"]) return true;
  return false;
}

export function logout(ctx: Koa.ParameterizedContext): boolean {
  ctx.session["login"] = null;
  ctx.session["userName"] = null;
  ctx.session["uuid"] = null;
  ctx.session["token"] = null;
  ctx.session.save();
  return true;
}

export async function register(
  ctx: Koa.ParameterizedContext,
  userName: string,
  passWord: string,
  permission: number
) {
  let f = true;
  // Check for duplicate usernames.
  userSystem.objects.forEach((user) => {
    if (user && user.userName == userName) f = false;
  });
  if (f) {
    // Next. UUID and other data will be automatically generated.
    await userSystem.create({
      userName,
      passWord,
      permission
    });
    return true;
  }
  return false;
}

export function getUserPermission(ctx: Koa.ParameterizedContext): number {
  let user: User = null;
  if (isApiRequest(ctx)) {
    user = getUuidByApiKey(getApiKey(ctx));
  } else {
    user = userSystem.getInstance(ctx.session["uuid"]);
  }
  if (!user) return 0;
  return user.permission ?? 0;
}

export function getUserNameBySession(ctx: Koa.ParameterizedContext): string {
  if (isApiRequest(ctx)) {
    const user = getUuidByApiKey(getApiKey(ctx));
    return user ? user.userName : null;
  }
  return ctx.session["userName"];
}

export function getUserUuid(ctx: Koa.ParameterizedContext): string {
  if (isApiRequest(ctx)) {
    const user = getUuidByApiKey(getApiKey(ctx));
    return user ? user.uuid : null;
  }
  return ctx.session["uuid"];
}

export function getToken(ctx: Koa.ParameterizedContext): string {
  return ctx.session["token"];
}

export function isAjax(ctx: Koa.ParameterizedContext) {
  return (
    ctx.header["x-requested-with"] &&
    ctx.header["x-requested-with"].toString().toLocaleLowerCase() === "xmlhttprequest"
  );
}

export function checkBanIp(ctx: Koa.ParameterizedContext) {
  if (!GlobalVariable.map.has(LOGIN_FAILED_KEY)) GlobalVariable.set(LOGIN_FAILED_KEY, {});
  // This IpMap also needs to be used when logging in
  const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
  const ip = ctx.socket.remoteAddress;
  if (ipMap[ip] > 10 && systemConfig.loginCheckIp === true) {
    if (ipMap[ip] != 999) {
      // record the number of bans
      GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 0) + 1);
      setTimeout(() => {
        delete ipMap[ip];
        // delete the number of bans
        GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 1) - 1);
      }, 1000 * 60 * 10);
    }
    ipMap[ip] = 999;
    return false;
  }
  if (!isNaN(Number(ipMap[ip]))) ipMap[ip] = Number(ipMap[ip]) + 1;
  else ipMap[ip] = 1;
  return true;
}

export function getUuidByApiKey(apiKey: string) {
  const pageData = userSystem.getQueryWrapper().selectPage(
    {
      apiKey
    },
    1,
    1
  );
  if (pageData.total === 1) {
    return pageData.data[0];
  }
  return null;
}

export function isApiRequest(ctx: Koa.ParameterizedContext) {
  return ctx.query.apikey ? true : false;
}

export function getApiKey(ctx: Koa.ParameterizedContext) {
  return String(ctx.query.apikey);
}
