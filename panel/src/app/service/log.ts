import log4js from "log4js";
import { rotatingFileAppender, runLogMaintenance } from "mcsmanager-common";

// The auto-update restarter may relaunch this process detached with inherited
// stdio (interactive console mode). If that terminal is closed later, the
// handles become invalid and stream writes emit "error" (EPIPE/EIO); swallow
// those so the process keeps running and the file appender keeps working.
process.stdout.on("error", () => {});
process.stderr.on("error", () => {});
process.stdin.on("error", () => {});

const LOG_FILE_PATH = "logs/current.log";

const maintenanceWarnings: string[] = [];
runLogMaintenance("logs", ["current.log"], (message) => maintenanceWarnings.push(message));

log4js.configure({
  appenders: {
    out: {
      type: "stdout",
      layout: {
        type: "pattern",
        pattern: "[%d{MM/dd hh:mm:ss}] [%[%p%]] %m"
      }
    },
    file: {
      type: rotatingFileAppender as any,
      filename: LOG_FILE_PATH,
      activeNames: ["current.log"],
      layout: {
        type: "pattern",
        pattern: "%d %p %m"
      }
    }
  },
  categories: {
    default: {
      appenders: ["out", "file"],
      level: "info"
    },
    file: {
      appenders: ["file"],
      level: "info"
    }
  }
});

const logger = log4js.getLogger("default");
const fileLogger = log4js.getLogger("file");

for (const message of maintenanceWarnings) logger.warn(message);

function fullTime(): string {
  const date = new Date();
  return `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`;
}

function fullLocalTime(): string {
  return new Date().toLocaleTimeString();
}

export { logger, fileLogger, fullTime, fullLocalTime };
