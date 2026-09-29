import fs from "fs-extra";
import log4js from "log4js";

// The auto-update restarter may relaunch this process detached with inherited
// stdio (interactive console mode). If that terminal is closed later, the
// handles become invalid and stream writes emit "error" (EPIPE/EIO); swallow
// those so the process keeps running and the file appender keeps working.
process.stdout.on("error", () => {});
process.stderr.on("error", () => {});
process.stdin.on("error", () => {});

const LOG_FILE_PATH = "logs/current.log";

// save the log file separately on each startup
if (fs.existsSync(LOG_FILE_PATH)) {
  const time = new Date();
  const timeString = `${time.getFullYear()}-${
    time.getMonth() + 1
  }-${time.getDate()}_${time.getHours()}-${time.getMinutes()}-${time.getSeconds()}`;
  fs.renameSync(LOG_FILE_PATH, `logs/${timeString}.log`);
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
    file: {
      type: "file",
      filename: LOG_FILE_PATH,
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

function fullTime(): string {
  const date = new Date();
  return `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`;
}

function fullLocalTime(): string {
  return new Date().toLocaleTimeString();
}

export { logger, fileLogger, fullTime, fullLocalTime };
