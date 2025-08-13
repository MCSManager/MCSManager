import axios from "axios";
import * as fs from "fs-extra";
import { GlobalVariable } from "mcsmanager-common";
import storage from "./common/system_storage";
import { getFrontendLayoutConfig } from "./service/frontend_layout";
import { logger } from "./service/log";
import { saveSystemConfig, systemConfig } from "./setting";

interface IPackageInfo {
  name: string;
  version: string;
  daemonVersion: string;
  description: string;
}

// A business platform for selling instances released by the MCSManager Dev Team.
// Currently, it only supports some countries and regions.
// If you do not turn on "Business Mode", MCSManager will not send any data.
export const REDEEM_PLATFORM_ADDR = "http://localhost:3000";

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
  try {
    systemConfig.businessMode = false;
    const { data: response } = await axios.post<{ code: number; data: any }>(
      `${REDEEM_PLATFORM_ADDR}/api/user/check`,
      {
        panelId: systemConfig?.panelId,
        registerCode: systemConfig?.registerCode,
        businessMode: systemConfig?.businessMode
      }
    );
    if (response.data && response.code === 200) {
      logger.info(`Business mode is active: ${JSON.stringify(response.data)} !!!`);
      systemConfig.businessMode = true;
    } else {
      systemConfig.businessMode = false;
    }
    saveSystemConfig(systemConfig);
  } catch (error: any) {
    // ignore
  }
}

setInterval(checkBusinessMode, 1000 * 60 * 60);
