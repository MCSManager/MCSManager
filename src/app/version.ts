// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import * as fs from "fs-extra";
import GlobalVariable from "./common/global_variable";
import { logger } from "./service/log";

const PACKAGE_JSON = "package.json";

export function initVersionManager() {
  try {
    GlobalVariable.set("version", "Unknown");
    if (fs.existsSync(PACKAGE_JSON)) {
      const data: any = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
      if (data.version) {
        GlobalVariable.set("version", data.version);
      }
    }
  } catch (error) {
    logger.error("Version Check failure:", error);
  }
}

export function getVersion(): string {
  return GlobalVariable.get("version", "Unknown");
}

export function specifiedDaemonVersion() {
  try {
    const data: any = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
    return data.daemonVersion ?? "1.0.0";
  } catch (error) {
    return "1.0.0";
  }
}
