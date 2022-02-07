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
import { getUserUuid } from "../../service/passport_service";
import userSystem from "../../service/system_user";
import { getToken, isAjax } from "../../service/passport_service";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { isTopPermissionByUuid } from "../../service/permission_service";
import validator from "../../middleware/validator";
import { v4 } from "uuid";

const router = new Router({ prefix: "/auth" });

// [Low-level Permission]
// 新增令牌返回
router.get(
  "/token",
  permission({ level: 1, token: false }),
  async (ctx: Koa.ParameterizedContext) => {
    // 有且只有 Ajax 请求能够获取 token 令牌
    if (isAjax(ctx)) {
      ctx.body = getToken(ctx);
    } else {
      throw new Error("The request is not an Ajax request.");
    }
  }
);

// [Low-level Permission]
// 获取用户数据
router.get("/", permission({ level: 1, token: false }), async (ctx) => {
  // 默认权限获取本人
  let uuid = getUserUuid(ctx);
  // 前端可以选择需要高级数据
  const advanced = ctx.query.advanced;
  // 管理权限可获取任何人
  if (isTopPermissionByUuid(uuid)) {
    if (ctx.query.uuid) uuid = String(ctx.query.uuid);
  }
  // 有且只有 Ajax 请求准许访问
  if (isAjax(ctx)) {
    const user = userSystem.getInstance(uuid);
    if (!user) throw new Error("此用户UID不存在");

    // 高级功能可选，分析每一个实例数据
    let resInstances = [];
    if (advanced) {
      const instances = user.instances;
      for (const iterator of instances) {
        const remoteService = RemoteServiceSubsystem.getInstance(iterator.serviceUuid);
        // 若此远程服务根本不存在，则装载一个已删除的提示
        if (!remoteService) {
          resInstances.push({
            hostIp: "-- Unknown --",
            instanceUuid: iterator.instanceUuid,
            serviceUuid: iterator.serviceUuid,
            status: -1,
            nickname: "--",
            remarks: "--"
          });
          continue;
        }
        try {
          // Note: 这里可以整合UUID来节省返回的流量，暂不做此优化
          let instancesInfo = await new RemoteRequest(remoteService).request("instance/section", {
            instanceUuids: [iterator.instanceUuid]
          });
          instancesInfo = instancesInfo[0];
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            remarks: remoteService.config.remarks,
            instanceUuid: instancesInfo.instanceUuid,
            serviceUuid: remoteService.uuid,
            status: instancesInfo.status,
            nickname: instancesInfo.config.nickname,
            ie: instancesInfo.config.ie,
            oe: instancesInfo.config.oe,
            endTime: instancesInfo.config.endTime,
            lastDatetime: instancesInfo.config.lastDatetime,
            stopCommand: instancesInfo.config.stopCommand
          });
        } catch (error) {
          resInstances.push({
            hostIp: `${remoteService.config.ip}:${remoteService.config.port}`,
            instanceUuid: iterator.instanceUuid,
            serviceUuid: iterator.serviceUuid,
            status: -1,
            nickname: "--"
          });
        }
      }
    } else {
      resInstances = user.instances;
    }
    // 响应用户数据
    ctx.body = {
      uuid: user.uuid,
      userName: user.userName,
      loginTime: user.loginTime,
      registerTime: user.registerTime,
      instances: resInstances,
      permission: user.permission,
      token: getToken(ctx),
      apiKey: user.apiKey
    };
  }
});

// [Low-level Permission]
// 修改个人用户信息
router.put(
  "/update",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    if (userUuid) {
      const config = ctx.request.body;
      const userName = config.userName;
      const passWord = config.passWord;
      if (userName && (userName.length < 2 || userName.length > 18))
        throw new Error("错误的用户名长度规则");
      if (passWord && (passWord.length < 2 || passWord.length > 18))
        throw new Error("错误的密码长度规则");
      if (userSystem.existUserName(userName)) throw new Error("用户名已经被占用");
      userSystem.edit(userUuid, { passWord, userName });
      ctx.body = true;
    }
  }
);

// [Low-level Permission]
// API 生成和关闭
router.put(
  "/api",
  permission({ level: 1 }),
  validator({ body: {} }),
  async (ctx: Koa.ParameterizedContext) => {
    const userUuid = getUserUuid(ctx);
    const enable = ctx.request.body.enable;
    const user = userSystem.getInstance(userUuid);
    let newKey = "";
    try {
      if (user) {
        if (enable) {
          newKey = v4().replace(/-/gim, "");
          userSystem.edit(userUuid, {
            apiKey: newKey
          });
        } else {
          userSystem.edit(userUuid, {
            apiKey: ""
          });
        }
      }
      ctx.body = newKey;
    } catch (error) {
      ctx.body = error;
    }
  }
);

export default router;
