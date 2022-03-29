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
  console.log(
    "Unable to start, this project is used by the MCSManager development environment and cannot be run directly."
  );
  console.log("Please go to https://mcsmanager.com/ for the latest installation method.");
  console.log(
    'If you are running in development mode, create "public" directory and place the frontend static files before rerunning.'
  );
  console.log("");
  console.log("无法启动，此项目是 MCSManager 开发人员所用项目，普通用户不可直接运行。");
  console.log("请前往 https://mcsmanager.com/ 了解最新的安装方式。");
  console.log("如果您要以开发模式运行，请创建 public 目录并放置前端静态文件再重新运行。");
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

  // 暂不需要 Socket 服务
  // SocketService.setUpSocketIO(httpServer);

  httpServer.listen(port, host);
  logger.info("================================");
  logger.info("控制面板端已启动");
  logger.info("项目参考: https://github.com/mcsmanager");
  logger.info(`访问地址: http://${host ? host : "localhost"}:${port}/`);
  logger.info(`软件公网访问需开放端口 ${port} 与守护进程端口`);
  logger.info("关闭此程序请使用 Ctrl+C 快捷键");
  logger.info("================================");
}

startUp(systemConfig.httpPort, systemConfig.httpIp);
