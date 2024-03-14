import StorageSubsystem from "../common/system_storage";
import logger from "./log";
import { t } from "i18next";

function readCategoryConfig(configCategory: string, callback: (config: any) => boolean) {
  const configPaths = StorageSubsystem.readDir(configCategory);
  for (const configPath of configPaths) {
    try {
      const config = JSON.parse(StorageSubsystem.readFile(configPath));
      if (callback(config)) {
        logger.info(t("TXT_CODE_6b2a9cab"), configPath);
        StorageSubsystem.writeFile(configPath, JSON.stringify(config, null, 4));
      }
    } catch (error: any) {
      logger.error(t("TXT_CODE_fb75aba9"), error);
    }
  }
}

function refactorInstanceConfig(config: any) {
  if (typeof config.endTime === "string") {
    config.endTime = new Date(config.endTime).getTime();
    return true;
  }
  return false;
}

function detectConfig() {
  readCategoryConfig("InstanceConfig", refactorInstanceConfig);
}

export default { detectConfig };
