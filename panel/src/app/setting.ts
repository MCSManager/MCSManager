// global configuration initialization

import SystemConfig from "./entity/setting";
import StorageSystem from "./common/system_storage";
import { i18next } from "./i18n";
let systemConfig: SystemConfig | null = null;

// System persistence configuration table
export function initSystemConfig() {
  systemConfig = StorageSystem.load("SystemConfig", SystemConfig, "config");
  if (!systemConfig) {
    systemConfig = new SystemConfig();
    StorageSystem.store("SystemConfig", "config", systemConfig);
  }
  if (systemConfig.language) i18next.changeLanguage(systemConfig.language);
}

export function saveSystemConfig(_systemConfig: SystemConfig) {
  StorageSystem.store("SystemConfig", "config", _systemConfig);
}

export { systemConfig };
