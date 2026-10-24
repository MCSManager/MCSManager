import { t } from "i18next";
import { GlobalVariable, migrateLegacyUpdateSourceUrl } from "mcsmanager-common";
import StorageSubsystem from "../common/system_storage";
import { systemConfig } from "../setting";
import { hasVersionChanged } from "../version";
import { logger } from "./log";

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

/**
 * Starting from version 10.8.0, the configuration file path for preset templates has changed,
 * so we will perform an automatic upgrade to ensure users' paths are updated automatically!
 */
function upgradePresetPackAddr() {
  const config = systemConfig;
  const lastLaunchedVersion = GlobalVariable.get("lastLaunchedVersion");
  // If the version is less than 10.8.0 and the version has changed,
  // then we need to upgrade the preset pack addr
  if (config && lastLaunchedVersion < 108 && hasVersionChanged()) {
    logger.warn(
      `Upgrading Market source addr from ${config.presetPackAddr} to https://script.mcsmanager.com/market.json`
    );
    config.presetPackAddr = "https://script.mcsmanager.com/market.json";
    StorageSubsystem.store("SystemConfig", "config", config);
  }
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
  const config = systemConfig;
  if (!config) return;
  const migrated = migrateLegacyUpdateSourceUrl(config.updateSourceUrl);
  if (migrated !== config.updateSourceUrl) {
    logger.warn(`Upgrading update source addr from ${config.updateSourceUrl} to ${migrated}`);
    config.updateSourceUrl = migrated;
    StorageSubsystem.store("SystemConfig", "config", config);
  }
}

function detectConfig() {
  upgradePresetPackAddr();
  upgradeUpdateSourceUrl();
  readCategoryConfig("User", refactorUserConfig);
}

export default { detectConfig };
