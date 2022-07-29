// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

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
