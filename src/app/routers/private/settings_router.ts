// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import { saveSystemConfig, systemConfig } from "../../setting";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// 获取面板配置项
router.get("/setting", permission({ level: 10 }), async (ctx) => {
  ctx.body = systemConfig;
});

// [Top-level Permission]
// 更新面板配置项
router.put("/setting", validator({ body: {} }), permission({ level: 10 }), async (ctx) => {
  const config = ctx.request.body;
  if (config) {
    if (config.httpIp != null) systemConfig.httpIp = config.httpIp;
    if (config.httpPort != null) systemConfig.httpPort = config.httpPort;
    if (config.crossDomain != null) systemConfig.crossDomain = config.crossDomain;
    if (config.gzip != null) systemConfig.gzip = config.gzip;
    if (config.maxCompress != null) systemConfig.maxCompress = config.maxCompress;
    if (config.maxDonwload != null) systemConfig.maxDonwload = config.maxDonwload;
    if (config.zipType != null) systemConfig.zipType = config.zipType;
    if (config.loginCheckIp != null) systemConfig.loginCheckIp = config.loginCheckIp;
    if (config.forwardType != null) systemConfig.forwardType = Number(config.forwardType);
    if (config.dataPort != null) systemConfig.dataPort = Number(config.dataPort);
    if (config.loginInfo != null) systemConfig.loginInfo = String(config.loginInfo);
    if (config.canFileManager != null) systemConfig.canFileManager = Boolean(config.canFileManager);
    saveSystemConfig(systemConfig);
    ctx.body = "OK";
    return;
  }
  ctx.body = new Error("The body is incorrect");
});

export default router;
