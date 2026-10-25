import StorageSubsystem from "../common/system_storage";
import logger from "./log";
import { t } from "i18next";
import { migrateLegacyUpdateSourceUrl } from "mcsmanager-common";
import { globalConfiguration } from "../entity/config";

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
  if (isNaN(config.passWordType)) config.passWordType = 0;
  if (typeof config.endTime === "string") {
    config.endTime = new Date(config.endTime).getTime();
    return true;
  }
  return false;
}

/**
 * The primary auto-update source moved from the legacy mcsmanager.com hosting
 * to the official GitHub Release manifest (the same mcsmanager.com URL is now
 * the default BACKUP source, `updateSourceUrlFallback`). A persisted primary
 * `updateSourceUrl` still pointing at the legacy source is rewritten to the
 * current default; any operator-customized URL is left untouched. Idempotent:
 * after one rewrite the value no longer matches the legacy source.
 */
function upgradeUpdateSourceUrl() {
  const config = globalConfiguration?.config;
  if (!config) return;
  const migrated = migrateLegacyUpdateSourceUrl(config.updateSourceUrl);
  if (migrated !== config.updateSourceUrl) {
    logger.warn(`Upgrading update source addr from ${config.updateSourceUrl} to ${migrated}`);
    config.updateSourceUrl = migrated;
    globalConfiguration.store();
  }
}

function detectConfig() {
  upgradeUpdateSourceUrl();
  readCategoryConfig("InstanceConfig", refactorInstanceConfig);
}

export default { detectConfig };
