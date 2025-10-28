import fs from "fs-extra";
import path from "path";
import http from "http";
import https from "https";
import { removeTrail } from "mcsmanager-common";
import { Server, Socket } from "socket.io";
import { GOLANG_ZIP_PATH, LOCAL_PRESET_LANG_PATH, PTY_PATH } from "./const";
import { globalConfiguration } from "./entity/config";
import { $t, i18next } from "./i18n";
import "./service/async_task_service";
import "./service/async_task_service/quick_install";
import { checkDependencies } from "./service/dependencies";
import * as koa from "./service/http";
import logger from "./service/log";
import * as protocol from "./service/protocol";
import * as router from "./service/router";
import InstanceSubsystem from "./service/system_instance";
import "./service/system_visual_data";
import uploadManager from "./service/upload_manager";
import { getVersion, initVersionManager } from "./service/version";
import versionAdapter from "./service/version_adapter";

initVersionManager();
const VERSION = getVersion();

console.log(`
______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __ \`/_  __ \\  __ \`/_  __ \`/  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
                                                        /____/               
________                                                                     
___  __ \\_____ ____________ ________________                                 
__  / / /  __ \`/  _ \\_  __ \`__ \\  __ \\_  __ \\                                
_  /_/ // /_/ //  __/  / / / / / /_/ /  / / /                                
/_____/ \\__,_/ \\___//_/ /_/ /_/\\____//_/ /_/                                 
                                                                             

 + Copyright ${new Date().getFullYear()} MCSManager Dev <https://github.com/MCSManager>
 + Version ${VERSION}
`);

// Initialize the global configuration service
globalConfiguration.load();
const config = globalConfiguration.config;

// Detect whether the configuration file is from an older version and update it if so.
versionAdapter.detectConfig();

checkDependencies();

// Set language
if (fs.existsSync(LOCAL_PRESET_LANG_PATH)) {
  i18next.changeLanguage(fs.readFileSync(LOCAL_PRESET_LANG_PATH, "utf-8"));
} else {
  const lang = config.language || "en_us";
  logger.info(`LANGUAGE: ${lang}`);
  i18next.changeLanguage(lang);
}
logger.info($t("TXT_CODE_app.welcome"));

// Initialize HTTP service
const koaApp = koa.initKoa();

// Listen for Koa errors
koaApp.on("error", (error) => {
  // Block all Koa framework error
  // When Koa is attacked by a short connection flood, it is easy for error messages to swipe the screen, which may indirectly affect the operation of some applications
});

let httpServer: http.Server | https.Server;
if (config.ssl) {
  const options = {
    cert: fs.readFileSync(path.join(config.sslPemPath)),
    key: fs.readFileSync(path.join(config.sslKeyPath))
  };
  httpServer = https.createServer(options, koaApp.callback());
} else {
  httpServer = http.createServer(koaApp.callback());
}

httpServer.on("error", (err) => {
  logger.error($t("TXT_CODE_app.httpSetupError"));
  logger.error(err);
  process.exit(1);
});
httpServer.listen(config.port, config.ip);

// Initialize Websocket service to HTTP service
const io = new Server(httpServer, {
  serveClient: false,
  pingInterval: 1000 * 20,
  pingTimeout: 1000 * 10,
  cookie: false,
  path: removeTrail(config.prefix, "/") + "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  },
  maxHttpBufferSize: 1e8
});

// Initialize application instance system
try {
  InstanceSubsystem.loadInstances();
  logger.info($t("TXT_CODE_app.instanceLoad", { n: InstanceSubsystem.getInstances().length }));
} catch (err) {
  logger.error($t("TXT_CODE_app.instanceLoadError"), err);
  process.exit(-1);
}

(function initCompressModule() {
  try {
    fs.chmodSync(GOLANG_ZIP_PATH, 0o755);
    fs.chmodSync(PTY_PATH, 0o755);
  } catch (error: any) {
    logger.error(error?.message);
    logger.error($t("TXT_CODE_a8b245fa"));
  }
})();

// Initialize Websocket server
io.on("connection", (socket: Socket) => {
  protocol.addGlobalSocket(socket);
  router.navigation(socket);

  socket.on("error", (err) => {
    logger.error("Connection(): Socket.io Error:", err);
  });

  socket.on("disconnect", () => {
    protocol.delGlobalSocket(socket);
    for (const name of socket.eventNames()) socket.removeAllListeners(name);
  });
});

process.on("uncaughtException", function (err) {
  logger.error(`Error: UncaughtException:`, err);
});

process.on("unhandledRejection", (reason, p) => {
  logger.error(`Error: UnhandledRejection:`, reason, p);
});

logger.info("----------------------------");
logger.info($t("TXT_CODE_app.started"));
logger.info($t("TXT_CODE_app.doc"));
let appHost = $t("TXT_CODE_app.host", { port: config.port })
if (config.ssl) appHost = appHost.replace("http", "https");
logger.info(appHost);
logger.info($t("TXT_CODE_app.configPathTip", { path: "" }));
logger.info($t("TXT_CODE_app.password", { key: config.key }));
logger.info($t("TXT_CODE_app.passwordTip"));
logger.info($t("TXT_CODE_app.exitTip"));
logger.info("----------------------------");
console.log("");

let isExiting = false;
async function listenExitSig(signal: string, isForce = true) {
  if (isExiting) {
    logger.warn($t("TXT_CODE_6f862823"));
    return;
  }
  try {
    logger.warn($t("TXT_CODE_4ffdc91d", { signal }));
    isExiting = true;
    await InstanceSubsystem.exit(isForce);
    await uploadManager.exit();
    logger.info($t("TXT_CODE_dff680b7"));
    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(-1);
  }
}

// Listen for close process signals
["SIGTERM", "SIGINT", "SIGQUIT"].forEach(function (sig) {
  process.on(sig, async () => {
    await listenExitSig(sig);
  });
});

process.stdin.on("data", (v) => {
  const command = v.toString().replace("\n", "").replace("\r", "").trim().toLowerCase();
  if (command === "exit") listenExitSig("exit");
});
