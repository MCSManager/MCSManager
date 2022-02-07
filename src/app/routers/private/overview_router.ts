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

import Router from "@koa/router";
import permission from "../../middleware/permission";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import VisualDataSubsystem from "../../service/system_visual_data";
import RemoteRequest from "../../service/remote_command";
import os from "os";
import { systemInfo } from "../../common/system_info";
import { getVersion, specifiedDaemonVersion } from "../../version";
import GlobalVariable from "../../common/global_variable";
import {
  LOGIN_FAILED_KEY,
  ILLEGAL_ACCESS_KEY,
  LOGIN_COUNT,
  LOGIN_FAILED_COUNT_KEY,
  BAN_IP_COUNT
} from "../../service/passport_service";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// 控制面板首页信息总览路由
router.get("/", permission({ level: 10, token: false }), async (ctx) => {
  // 获取远程服务各个信息
  const remoteInfoList = new Array();
  for (const iterator of RemoteServiceSubsystem.services.entries()) {
    const remoteService = iterator[1];
    let remoteInfo: any = {};
    try {
      remoteInfo = await new RemoteRequest(remoteService).request("info/overview");
    } catch (err) {
      // 忽略请求错误，继续循环
    }
    // 赋予一些标识符值
    remoteInfo.uuid = remoteService.uuid;
    remoteInfo.ip = remoteService.config.ip;
    remoteInfo.port = remoteService.config.port;
    remoteInfo.available = remoteService.available;
    remoteInfo.remarks = remoteService.config.remarks;
    remoteInfoList.push(remoteInfo);
  }
  const selfInfo = systemInfo();
  // 获取本面板端所在系统信息
  const overviewData = {
    version: getVersion(),
    specifiedDaemonVersion: specifiedDaemonVersion(),
    process: {
      cpu: selfInfo.processCpu,
      memory: process.memoryUsage().rss,
      cwd: selfInfo.cwd
    },
    record: {
      logined: GlobalVariable.get(LOGIN_COUNT, 0),
      illegalAccess: GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0),
      banips: GlobalVariable.get(BAN_IP_COUNT, 0),
      loginFailed: GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0)
    },
    system: {
      user: os.userInfo(),
      time: new Date().toLocaleString(),
      totalmem: selfInfo.totalmem,
      freemem: selfInfo.freemem,
      type: selfInfo.type,
      version: os.version(),
      node: process.version,
      hostname: selfInfo.hostname,
      loadavg: selfInfo.loadavg,
      platform: selfInfo.platform,
      release: selfInfo.release,
      uptime: os.uptime(),
      cpu: selfInfo.cpuUsage
    },
    chart: {
      system: VisualDataSubsystem.getSystemChartArray(),
      request: VisualDataSubsystem.getStatusChartArray()
    },
    remoteCount: RemoteServiceSubsystem.count(),
    remote: remoteInfoList
  };

  ctx.body = overviewData;
});

export default router;
