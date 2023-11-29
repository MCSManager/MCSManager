import "module-alias/register";

// Initialize the version manager & i18n
import { $t } from "./app/i18n";
import { initVersionManager, getVersion } from "./app/version";

// Storage
import RedisStorage from "./app/common/storage/redis_storage";
import Storage from "./app/common/storage/sys_storage";

import { initSystemConfig, systemConfig } from "./app/setting";
import SystemUser from "./app/service/system_user";
import SystemRemoteService from "./app/service/system_remote_service";

// Http server requirements
import Koa from "koa";
import { v4 } from "uuid";
import path from "path";
import koaBody from "koa-body";
import session from "koa-session";
import koaStatic from "koa-static";
import http from "http";
import open from "open";

import { fileLogger, logger } from "./app/service/log";
import { middleware as protocolMiddleware } from "./app/middleware/protocol";

// Routes
import { index } from "./app/index";

function setupHttp(koaApp: Koa, port: number, host?: string) {
  const httpServer = http.createServer(koaApp.callback());

  httpServer.on("error", (err) => {
    logger.error($t("TXT_CODE_app.httpSetupError"));
    logger.error(err);
    process.exit(1);
  });

  // The Socket service is not required
  // SocketService.setUpSocketIO(httpServer);
  httpServer.listen(port, host);
  logger.info("==================================");
  logger.info($t("TXT_CODE_app.panelStarted"));
  logger.info($t("TXT_CODE_app.reference"));
  logger.info($t("TXT_CODE_app.host", { port }));
  logger.info($t("TXT_CODE_app.portTip", { port }));
  logger.info($t("TXT_CODE_app.exitTip", { port }));
  logger.info("==================================");

  // if (os.platform() == "win32") {
  //   open(`http://localhost:${port}/`).then(() => {});
  // }
}

async function processExit() {
  try {
    console.log("");
    logger.warn("Program received EXIT command.");
    logger.info("Exit.");
  } catch (err) {
    logger.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}

["SIGTERM", "SIGINT", "SIGQUIT"].forEach(function (sig) {
  process.on(sig, () => {
    logger.warn(`${sig} close process signal detected.`);
    processExit();
  });
});

process.stdin.on("data", (v) => {
  const command = v.toString().replace("\n", "").replace("\r", "").trim().toLowerCase();
  if (command === "exit") processExit();
});

async function main() {
  // load global configuration file
  initSystemConfig();

  if (systemConfig.redisUrl.length != 0) {
    await RedisStorage.initialize(systemConfig.redisUrl);
    Storage.setStorageType(Storage.TYPE.REDIS);
  }

  initVersionManager();
  const VERSION = getVersion();

  // show product Logo
  console.log(`______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __ \`/_  __ \\  __ \`/_  __ \`/  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
                                                        /____/     

 + Copyright (C) ${new Date().getFullYear()} MCSManager <mcsmanager-dev@outlook.com>
 + Version ${VERSION}
`);

  // Development environment detection before startup
  // if (!fs.existsSync(path.join(__dirname, "public"))) {
  //   console.log($t("TXT_CODE_app.developInfo"));
  //   process.exit(0);
  // }

  await SystemUser.initialize();
  await SystemRemoteService.initialize();

  const BASE_PATH = __dirname;

  const app = new Koa();

  // Listen for Koa errors
  app.on("error", (error) => {
    // Block all Koa framework level events
    // When Koa is attacked by a short connection flood, it is easy for error messages to swipe the screen, which may indirectly affect the operation of some applications
  });

  app.use(
    koaBody({
      multipart: true,
      parsedMethods: ["POST", "PUT", "DELETE", "GET"],
      formidable: {
        maxFieldsSize: Number.MAX_VALUE,
        maxFileSize: Number.MAX_VALUE
      },
      onError(err, ctx) {
        logger.error("koaBody Lib Error:", err);
      }
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
    const ignoreUrls = ["/api/overview", "/api/files/status"];
    for (const iterator of ignoreUrls) {
      if (ctx.URL.pathname.includes(iterator)) return await next();
    }
    fileLogger.info(`[HTTP] ${ctx.method}: ${ctx.URL.href}`);
    fileLogger.info(`[HTTP] IP: ${ctx.ip} USER: ${ctx.session.userName} UUID: ${ctx.session.uuid}`);
    await next();
  });

  // Protocol middleware
  app.use(protocolMiddleware);

  // static file routing
  const koaStaticOptions = {
    maxAge: 10 * 24 * 60 * 60 //Cache for ten days. Changed files will not be load from cache.
  };
  app.use(koaStatic(path.join(process.cwd(), "public"), koaStaticOptions));

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
  setupHttp(app, systemConfig.httpPort, systemConfig.httpIp);
}

main().catch((err) => {
  logger.error("main() error:", err);
  process.exit(0);
});
