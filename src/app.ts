/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/

// 程序启动入口文件

// 初始化版本管理器
import { initVersionManager, getVersion } from "./app/version";
initVersionManager();
const VERSION = getVersion();

// 显示产品标识
console.log(`______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __  /_  __ \\  __  /_  __  /  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
                                                        /____/             
 + Released under the AGPL-3.0 License
 + Copyright 2022 Suwings
 + Version ${VERSION}
`);

// 启动前开发环境检测
import fs from "fs";
if (!fs.existsSync("public")) {
  console.log($t("app.developInfo"));
  process.exit(0);
}

import Koa from "koa";
import { v4 } from "uuid";
import path from "path";
import koaBody from "koa-body";
import session from "koa-session";
import koaStatic from "koa-static";
import http from "http";

import { logger } from "./app/service/log";
import { middleware as protocolMiddleware } from "./app/middleware/protocol";

const BASE_PATH = __dirname;

// 装载全局配置文件
import { initSystemConfig, systemConfig } from "./app/setting";
initSystemConfig();

const app = new Koa();

// 监听 Koa 错误
app.on("error", (error) => {
  // 屏蔽所有 Koa 框架级别事件
  // 当 Koa 遭遇短连接洪水攻击时，很容易错误信息刷屏，有可能会间接影响某些应用程序运作
});

app.use(
  koaBody({
    multipart: true,
    parsedMethods: ["POST", "PUT", "DELETE", "GET"]
  })
);

app.keys = [v4()];
app.use(
  session(
    {
      key: v4(),
      maxAge: 86400000,
      overwrite: true,
      httpOnly: true,
      signed: true,
      rolling: false,
      renew: false,
      secure: false
    },
    app
  )
);

// Http log and print
app.use(async (ctx, next) => {
  logger.info(`${ctx.ip} ${ctx.method} - ${ctx.URL.href}`);
  await next();
});

// Protocol middleware
app.use(protocolMiddleware);

// 静态文件路由
app.use(koaStatic(path.join(BASE_PATH, "public")));

// 装载所有路由
import { index } from "./app/index";
import { $t } from "./app/i18n";
// Websocket 路由（暂无用）
// import SocketService from "./app/service/socket_service";
index(app);

// Error reporting
process.on("uncaughtException", function (err) {
  logger.error(`ERROR (uncaughtException):`, err);
});

// Error reporting
process.on("unhandledRejection", (reason, p) => {
  logger.error(`ERROR (unhandledRejection):`, reason, p);
});

// 启动 HTTP 服务
function startUp(port: number, host?: string) {
  const httpServer = http.createServer(app.callback());

  // The Socket service is not required
  // SocketService.setUpSocketIO(httpServer);

  httpServer.listen(port, host);
  logger.info("================================");
  logger.info($t("app.panelStarted"));
  logger.info($t("app.reference"));
  logger.info($t("app.host", { port }));
  logger.info($t("app.portTip", { port }));
  logger.info($t("app.exitTip", { port }));
  logger.info("================================");
}

startUp(systemConfig.httpPort, systemConfig.httpIp);
