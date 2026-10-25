// global configuration initialization

import SystemConfig, { DataPlaneMode } from "./entity/setting";
import StorageSystem from "./common/system_storage";
import { i18next } from "./i18n";
import { v4 } from "uuid";
let systemConfig: SystemConfig | null = null;

// System persistence configuration table
export function initSystemConfig() {
  systemConfig = StorageSystem.load("SystemConfig", SystemConfig, "config");
  if (!systemConfig) {
    // Fresh install (no config file on first boot): default to Proxy so the daemon
    // port does not need to be publicly reachable. Upgrades (config file already
    // exists) keep the class-level default Direct, or the explicit value already
    // persisted in the config.
    systemConfig = new SystemConfig();
    systemConfig.dataPlane = DataPlaneMode.Proxy;
    StorageSystem.store("SystemConfig", "config", systemConfig);
  }
  if (systemConfig.language) i18next.changeLanguage(systemConfig.language);
  if (!systemConfig.panelId) {
    systemConfig.panelId = v4();
    saveSystemConfig(systemConfig);
  }
}

export function saveSystemConfig(_systemConfig: SystemConfig) {
  StorageSystem.store("SystemConfig", "config", _systemConfig);
}

export { systemConfig };
