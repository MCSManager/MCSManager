import * as log4js from "log4js";
import { rotatingFileAppender, runLogMaintenance, systemInfo } from "mcsmanager-common";
import { $t } from "../i18n";

// The auto-update restarter may relaunch this process detached with inherited
// stdio (interactive console mode). If that terminal is closed later, the
// handles become invalid and stream writes emit "error" (EPIPE/EIO); swallow
// those so the process keeps running and the file appender keeps working.
process.stdout.on("error", () => {});
process.stderr.on("error", () => {});
process.stdin.on("error", () => {});

const LOG_FILE_PATH = "logs/current.log";
const LOG_SYS_INFO_FILE_PATH = "logs/sysinfo.log";

const maintenanceWarnings: string[] = [];
runLogMaintenance("logs", ["current.log", "sysinfo.log"], (message) =>
  maintenanceWarnings.push(message)
);

log4js.configure({
  appenders: {
    out: {
      type: "stdout",
      layout: {
        type: "pattern",
        pattern: "[%d{MM/dd hh:mm:ss}] [%[%p%]] %m"
      }
    },
    app: {
      type: rotatingFileAppender as any,
      filename: LOG_FILE_PATH,
      activeNames: ["current.log", "sysinfo.log"],
      layout: {
        type: "pattern",
        pattern: "[%d{MM/dd hh:mm:ss}] [%p] %m"
      }
    },
    sys: {
      type: rotatingFileAppender as any,
      filename: LOG_SYS_INFO_FILE_PATH,
      activeNames: ["current.log", "sysinfo.log"],
      layout: {
        type: "pattern",
        pattern: "[%d{MM/dd hh:mm:ss}] [%p] %m"
      }
    }
  },
  categories: {
    default: {
      appenders: ["out", "app"],
      level: "info"
    },
    sysinfo: {
      appenders: ["sys"],
      level: "info"
    }
  }
});

const logger = log4js.getLogger("default");
const loggerSysInfo = log4js.getLogger("sysinfo");

for (const message of maintenanceWarnings) logger.warn(message);

function toInt(v: number) {
  return parseInt(String(v));
}

function systemInfoReport() {
  const MB_SIZE = 1024 * 1024;
  const info = systemInfo();

  const self = process.memoryUsage();
  const sysInfo =
    `MEM: ${toInt((info.totalmem - info.freemem) / MB_SIZE)}MB/${toInt(
      info.totalmem / MB_SIZE
    )}MB` + ` CPU: ${toInt(info.cpuUsage * 100)}%`;
  const selfInfo = `Heap: ${toInt(self.heapUsed / MB_SIZE)}MB/${toInt(self.heapTotal / MB_SIZE)}MB`;
  const selfInfo2 = `RSS: ${toInt(self.rss / MB_SIZE)}MB`;
  const logTip = $t("TXT_CODE_app.sysinfo");
  loggerSysInfo.info([`[${logTip}]`, sysInfo, selfInfo, selfInfo2].join(" "));
}

setInterval(systemInfoReport, 1000 * 5);

export default logger;
