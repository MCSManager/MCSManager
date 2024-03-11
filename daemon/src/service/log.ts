import fs from "fs-extra";
import * as log4js from "log4js";
import { systemInfo } from "common";
import { $t } from "../i18n";

const LOG_FILE_PATH = "logs/current.log";
const LOG_SYS_INFO_FILE_PATH = "logs/sysinfo.log";

const time = new Date();
const timeString =
  `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}` +
  `_${time.getHours()}-${time.getMinutes()}-${time.getSeconds()}`;

if (fs.existsSync(LOG_FILE_PATH)) {
  fs.renameSync(LOG_FILE_PATH, `logs/${timeString}.log`);
}

if (fs.existsSync(LOG_SYS_INFO_FILE_PATH)) {
  fs.renameSync(LOG_SYS_INFO_FILE_PATH, `logs/sysinfo_${timeString}.log`);
}

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
      type: "file",
      filename: LOG_FILE_PATH,
      layout: {
        type: "pattern",
        pattern: "[%d{MM/dd hh:mm:ss}] [%p] %m"
      }
    },
    sys: {
      type: "file",
      filename: LOG_SYS_INFO_FILE_PATH,
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
