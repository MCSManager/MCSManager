// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

// Initialize the version manager
import { $t } from "./app/i18n";
import { initVersionManager, getVersion } from "./app/version";
initVersionManager();
const VERSION = getVersion();

// show product Logo
console.log(`______ _______________________ ___
___ |/ /_ ____/_ ___/__ |/ /_____ _____________ _______ _____________
__ /|_/ /_ / _____ \\__ /|_/ /_ __ /_ __ \\ __ /_ __ / _ \\_ ___/
_ / / / / /___ ____/ /_ / / / / /_/ /_ / / /_/ /_ /_/ // __/ /
/_/ /_/ \\____/ /____/ /_/ /_/ \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/
                                                        /_____/
 + Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>
 + Version ${VERSION}
`);

// Development environment detection before startup
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

// load global configuration file
import { initSystemConfig, systemConfig } from "./app/setting";
initSystemConfig();

const app = new Koa();

// Listen for Koa errors
app.on("error", (error) => {
  // Block all Koa framework level events
  // When Koa is attacked by a short connection flood, it is easy for error messages to swipe the screen, which may indirectly affect the operation of some applications
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

// static file routing
app.use(koaStatic(path.join(BASE_PATH, "public")));

// load all routes
import { index } from "./app/index";

// Websocket routing (useless for now)
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

// start the HTTP service
function startUp(port: number, host?: string) {
  const httpServer = http.createServer(app.callback());

  // The Socket service is not required
  // SocketService.setUpSocketIO(httpServer);

  httpServer.listen(port, host);
  logger.info("==================================");
  logger.info($t("app.panelStarted"));
  logger.info($t("app.reference"));
  logger.info($t("app.host", { port }));
  logger.info($t("app.portTip", { port }));
  logger.info($t("app.exitTip", { port }));
  logger.info("==================================");
}

startUp(systemConfig.httpPort, systemConfig.httpIp);
