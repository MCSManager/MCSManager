import StorageSubsystem from "../common/system_storage";
import { t } from "i18next";
import { logger } from "./log";

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

function refactorUserConfig(config: any) {
  let changed = false;
  const { instances } = config;
  if (instances instanceof Array && instances.length > 0) {
    for (const iterator of instances) {
      if (typeof iterator.serviceUuid === "string") {
        iterator.daemonId = iterator.serviceUuid;
        delete iterator.serviceUuid;
        changed = true;
      }
    }
  }
  return changed;
}

function detectConfig() {
  readCategoryConfig("User", refactorUserConfig);
}

export default { detectConfig };
