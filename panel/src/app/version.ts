import * as fs from "fs-extra";
import GlobalVariable from "./common/global_variable";
import { logger } from "./service/log";
import path from "path";

const PACKAGE_JSON = "package.json";
let CURRENT_VERSION = "";
const VERSION_LOG_TEXT_PATH = path.normalize(path.join(process.cwd(), "data/current-version.txt"));

interface PackageInfo {
  name: string;
  version: string;
  daemonVersion: string;
  description: string;
}

export function initVersionManager() {
  try {
    GlobalVariable.set("version", "Unknown");
    if (fs.existsSync(PACKAGE_JSON)) {
      const data: PackageInfo = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
      if (data.version) {
        GlobalVariable.set("version", data.version);
        CURRENT_VERSION = String(data.version);
      }
    }
  } catch (error) {
    logger.error("Version Check failure:", error);
  }

  if (CURRENT_VERSION && fs.existsSync(VERSION_LOG_TEXT_PATH)) {
    const LastLaunchedVersion = fs.readFileSync(VERSION_LOG_TEXT_PATH, { encoding: "utf-8" });
    if (LastLaunchedVersion && LastLaunchedVersion != CURRENT_VERSION) {
      logger.info(`Version changed from ${LastLaunchedVersion} to ${CURRENT_VERSION}`);
      GlobalVariable.set("versionChange", CURRENT_VERSION);
    }
  }
  fs.writeFileSync(VERSION_LOG_TEXT_PATH, CURRENT_VERSION, { encoding: "utf-8" });
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
