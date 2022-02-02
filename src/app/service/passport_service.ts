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
import userSystem from "./system_user";
import { timeUuid } from "./password";
import GlobalVariable from "../common/global_variable";
import { systemConfig } from "../setting";

export const BAN_IP_COUNT = "banip";
export const LOGIN_FAILED_KEY = "loginFailed";
export const ILLEGAL_ACCESS_KEY = "illegalAccess";
export const LOGIN_COUNT = "loginCount";
export const LOGIN_FAILED_COUNT_KEY = "loginFailedCount";

export function login(ctx: Koa.ParameterizedContext, userName: string, passWord: string): string {
  // 记录登录请求次数
  GlobalVariable.set(LOGIN_COUNT, GlobalVariable.get(LOGIN_COUNT, 0) + 1);
  // 进行用户信息检查
  if (userSystem.checkUser({ userName, passWord })) {
    // 登录成功后重置此IP的错误次数
    const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
    const ip = ctx.socket.remoteAddress;
    delete ipMap[ip];
    // 会话 Session 状态改变为已登陆
    const user = userSystem.getUserByUserName(userName);
    user.loginTime = new Date().toLocaleString();
    ctx.session["login"] = true;
    ctx.session["userName"] = userName;
    ctx.session["uuid"] = user.uuid;
    ctx.session["token"] = timeUuid();
    ctx.session.save();
    return ctx.session["token"];
  } else {
    // 记录登录失败次数
    GlobalVariable.set(LOGIN_FAILED_COUNT_KEY, GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0) + 1);
    ctx.session["login"] = null;
    ctx.session["token"] = null;
    ctx.session.save();
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
