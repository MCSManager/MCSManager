// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import fs from "fs-extra";
import log4js from "log4js";

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
    app: {
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
      appenders: ["out", "app"],
      level: "info"
    }
  }
});

const logger = log4js.getLogger("default");

function fullTime(): string {
  const date = new Date();
  return `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`;
}

function fullLocalTime(): string {
  return new Date().toLocaleTimeString();
}

export { logger, fullTime, fullLocalTime };
