import "module-alias/register";
import os from "os";
import { $t } from "./app/i18n";
import { initVersionManager, getVersion } from "./app/version";
import RedisStorage from "./app/common/storage/redis_storage";
import Storage from "./app/common/storage/sys_storage";
import { initSystemConfig, systemConfig } from "./app/setting";
import SystemUser from "./app/service/user_service";
import SystemRemoteService from "./app/service/remote_service";
import Koa from "koa";
import { v4 } from "uuid";
import path from "path";
import koaBody, { HttpMethodEnum } from "koa-body-patch";
import session from "koa-session";
import koaStatic from "koa-static";
import http from "http";
import open from "open";
import { fileLogger, logger } from "./app/service/log";
import { middleware as protocolMiddleware } from "./app/middleware/protocol";
import { mountRouters } from "./app/index";
import versionAdapter from "./app/service/version_adapter";
import { removeTrail } from "common";

function hasParams(name: string) {
  return process.argv.includes(name);
}

function setupHttp(koaApp: Koa, port: number, host?: string) {
  const httpServer = http.createServer(koaApp.callback());

  httpServer.on("error", (err) => {
    logger.error($t("TXT_CODE_app.httpSetupError"));
    logger.error(err);
    process.exit(1);
  });

  httpServer.listen(port, host);
  logger.info("==================================");
  logger.info($t("TXT_CODE_app.panelStarted"));
  logger.info($t("TXT_CODE_app.reference"));
  logger.info($t("TXT_CODE_app.host", { port }));
  logger.info($t("TXT_CODE_app.portTip", { port }));
  logger.info($t("TXT_CODE_app.exitTip", { port }));
  logger.info("==================================");

  if (os.platform() == "win32" && hasParams("--open")) {
    open(`http://localhost:${port}/`);
  }
}

async function processExit() {
  try {
    logger.warn($t("TXT_CODE_cea5dba1"));
    logger.warn($t("TXT_CODE_b0aa2db9"));
  } catch (err) {
    logger.error(err);
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

  if (systemConfig && systemConfig?.redisUrl?.length != 0) {
    await RedisStorage.initialize(systemConfig.redisUrl);
    Storage.setStorageType(Storage.TYPE.REDIS);
  }

  initVersionManager();
  const VERSION = getVersion();

  console.log(`______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __ \`/_  __ \\  __ \`/_  __ \`/  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
                                                        /____/     

 + Copyright ${new Date().getFullYear()} MCSManager Dev <https://github.com/MCSManager>
 + Version ${VERSION}
`);

  // Detect whether the configuration file is from an older version and update it if so.
  versionAdapter.detectConfig();

  // Initialize services
  await SystemUser.initialize();
  await SystemRemoteService.initialize();

  const app = new Koa();

  // Listen for Koa errors
  app.on("error", (error) => {
    // Block all Koa framework level events
    // When Koa is attacked by a short connection flood, it is easy for error messages to swipe the screen, which may indirectly affect the operation of some applications
  });

  app.use(
    koaBody({
      multipart: true,
      parsedMethods: [
        HttpMethodEnum.GET,
        HttpMethodEnum.PUT,
        HttpMethodEnum.POST,
        HttpMethodEnum.DELETE
      ],
      formidable: {
        maxFieldsSize: Number.MAX_VALUE,
        maxFileSize: Number.MAX_VALUE,
        maxFiles: 1
      },
      jsonLimit: "10mb",
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

  app.use(async (ctx, next) => {
    const ignoreUrls = ["/api/overview", "/api/files/status"];
    for (const iterator of ignoreUrls) {
      if (ctx.URL.pathname.includes(iterator)) return await next();
    }
    fileLogger.info(`[HTTP] ${ctx.method}: ${ctx.URL.href}`);
    fileLogger.info(
      `[HTTP] IP: ${ctx.ip} USER: ${ctx.session?.userName} UUID: ${ctx.session?.uuid}`
    );
    await next();
  });

  if (systemConfig && systemConfig.prefix != "") {
    const prefix = systemConfig.prefix;
    app.use(async (ctx, next) => {
      if (ctx.url.startsWith(prefix)) {
        const orig = ctx.url;
        ctx.url = ctx.url.slice(prefix.length);
        if (!ctx.url.startsWith("/")) {
          ctx.url = "/" + ctx.url;
        }
        await next();
        ctx.url = orig;
      } else {
        ctx.redirect(removeTrail(prefix, "/") + ctx.url);
      }
    });
  }
  app.use(protocolMiddleware);
  app.use(
    koaStatic(path.join(process.cwd(), "public"), {
      maxAge: 10 * 24 * 60 * 60
    })
  );

  mountRouters(app);

  process.on("uncaughtException", function (err) {
    logger.error(`ERROR (uncaughtException):`, err);
  });

  process.on("unhandledRejection", (reason, p) => {
    logger.error(`ERROR (unhandledRejection):`, reason, p);
  });

  if (systemConfig) setupHttp(app, systemConfig.httpPort, systemConfig.httpIp);
}

main().catch((err) => {
  logger.error("main() error:", err);
  process.exit(0);
});
