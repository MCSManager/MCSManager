import StorageSubsystem from "../common/system_storage";
import logger from "./log";
import { t } from "i18next";

function readCategoryConfig(configCategory: string, callback: (config: any) => boolean) {
  const configPaths = StorageSubsystem.readDir(configCategory);
  for (const configPath of configPaths) {
    try {
      const config = JSON.parse(StorageSubsystem.readFile(configPath));
      if (callback(config)) {
        logger.info(t("已将旧版本配置升级为新版本配置："), configPath);
        StorageSubsystem.writeFile(configPath, JSON.stringify(config, null, 4));
      }
    } catch (error) {
      logger.error(t("[配置升级机制] 解析配置文件错误，已自动忽略："), error);
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
