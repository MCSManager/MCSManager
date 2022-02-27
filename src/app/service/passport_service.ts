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
import userSystem from "./system_user";
import { timeUuid } from "./password";
import GlobalVariable from "../common/global_variable";
import { systemConfig } from "../setting";
import { logger } from "./log";

export const BAN_IP_COUNT = "banip";
export const LOGIN_FAILED_KEY = "loginFailed";
export const ILLEGAL_ACCESS_KEY = "illegalAccess";
export const LOGIN_COUNT = "loginCount";
export const LOGIN_FAILED_COUNT_KEY = "loginFailedCount";

export function login(ctx: Koa.ParameterizedContext, userName: string, passWord: string): string {
  // 记录登录请求次数
  GlobalVariable.set(LOGIN_COUNT, GlobalVariable.get(LOGIN_COUNT, 0) + 1);
  const ip = ctx.socket.remoteAddress;
  // 进行用户信息检查
  if (userSystem.checkUser({ userName, passWord })) {
    // 登录成功后重置此IP的错误次数
    const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
    delete ipMap[ip];
    // 会话 Session 状态改变为已登陆
    const user = userSystem.getUserByUserName(userName);
    user.loginTime = new Date().toLocaleString();
    ctx.session["login"] = true;
    ctx.session["userName"] = userName;
    ctx.session["uuid"] = user.uuid;
    ctx.session["token"] = timeUuid();
    ctx.session.save();
    logger.info(`[Logined Event] IP: ${ip} 成功登录账号 ${userName}`);
    logger.info(`Token: ${ctx.session["token"]}`);
    return ctx.session["token"];
  } else {
    // 记录登录失败次数
    GlobalVariable.set(LOGIN_FAILED_COUNT_KEY, GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0) + 1);
    ctx.session["login"] = null;
    ctx.session["token"] = null;
    ctx.session.save();
    logger.info(`[Logined Event] IP: ${ip} 登录账号 ${userName} 失败`);
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

export function register(
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
    userSystem.create({
      userName,
      passWord,
      permission
    });
    return true;
  }
  return false;
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
  // 此IpMap 在登录时也需要使用
  const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
  const ip = ctx.socket.remoteAddress;
  if (ipMap[ip] > 10 && systemConfig.loginCheckIp === true) {
    if (ipMap[ip] != 999) {
      // 记录封禁次数
      GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 0) + 1);
      setTimeout(() => {
        delete ipMap[ip];
        // 删除封禁次数
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
