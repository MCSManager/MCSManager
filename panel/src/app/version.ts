import * as fs from "fs-extra";
import { GlobalVariable } from "common";
import { logger } from "./service/log";
import storage from "./common/system_storage";

interface PackageInfo {
  name: string;
  version: string;
  daemonVersion: string;
  description: string;
}

const PACKAGE_JSON = "package.json";
const VERSION_LOG_TEXT_NAME = "current-version.txt";
let currentVersion = "";

export function initVersionManager() {
  try {
    GlobalVariable.set("version", "Unknown");
    if (fs.existsSync(PACKAGE_JSON)) {
      const data: PackageInfo = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
      if (data.version) {
        GlobalVariable.set("version", data.version);
        currentVersion = String(data.version);
      }
    }
  } catch (error: any) {
    logger.error("Version Check failure:", error);
  }

  if (currentVersion && storage.fileExists(VERSION_LOG_TEXT_NAME)) {
    const LastLaunchedVersion = storage.readFile(VERSION_LOG_TEXT_NAME);
    if (LastLaunchedVersion && LastLaunchedVersion != currentVersion) {
      logger.warn(`Version changed from ${LastLaunchedVersion} to ${currentVersion}`);
      GlobalVariable.set("versionChange", currentVersion);
    }
  }
  storage.writeFile(VERSION_LOG_TEXT_NAME, currentVersion);
}

export function getVersion(): string {
  return GlobalVariable.get("version", "Unknown");
}

export function specifiedDaemonVersion() {
  try {
    const data: any = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
    return data.daemonVersion ?? "1.0.0";
  } catch (error: any) {
    return "1.0.0";
  }
}
