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
    remote: remoteInfoList,
  };

  ctx.body = overviewData;
});

export default router;
