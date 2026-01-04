import * as fs from "fs-extra";
import { GlobalVariable } from "mcsmanager-common";
import storage from "./common/system_storage";
import { getFrontendLayoutConfig } from "./service/frontend_layout";
import { logger } from "./service/log";
import { systemConfig } from "./setting";

interface IPackageInfo {
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
    GlobalVariable.set("lastLaunchedVersion", 100);
    GlobalVariable.set("version", "Unknown");
    if (fs.existsSync(PACKAGE_JSON)) {
      const data: IPackageInfo = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
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
    const lastVersionNumber = Number(LastLaunchedVersion.split(".").slice(0, 2).join(""));

    if (LastLaunchedVersion && LastLaunchedVersion != currentVersion && !isNaN(lastVersionNumber)) {
      logger.warn(`Version changed from ${LastLaunchedVersion} to ${currentVersion}`);
      GlobalVariable.set("lastLaunchedVersion", lastVersionNumber);
      GlobalVariable.set("versionChange", currentVersion);

      // reload layout
      getFrontendLayoutConfig();
    }
  }
  storage.writeFile(VERSION_LOG_TEXT_NAME, currentVersion);
}

export function getVersion(): string {
  return GlobalVariable.get("version", "Unknown");
}

export function hasVersionChanged(): boolean {
  return GlobalVariable.get("versionChange") || false;
}

export function specifiedDaemonVersion() {
  try {
    const data: any = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
    return data.daemonVersion ?? "1.0.0";
  } catch (error: any) {
    return "1.0.0";
  }
}

export async function checkBusinessMode() {
  if (!systemConfig) return;
  if (systemConfig.panelId && systemConfig.registerCode) {
    systemConfig.businessMode = true;
  } else {
    systemConfig.businessMode = false;
  }
}
