import { $t } from "../i18n";
import * as fs from "fs-extra";
import { GlobalVariable } from "common";
import logger from "./log";

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
  } catch (error: any) {
    logger.error($t("TXT_CODE_version.versionDetectErr"), error);
  }
}

export function getVersion() {
  return GlobalVariable.get("version", "Unknown");
}
