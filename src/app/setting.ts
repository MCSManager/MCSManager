/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/

// 全局配置初始化

import SystemConfig from "./entity/setting";
import StorageSystem from "./common/system_storage";
import GlobalVariable from "./common/global_variable";

let systemConfig: SystemConfig = null;

// 系统持久化配置表
export function initSystemConfig() {
  systemConfig = StorageSystem.load("SystemConfig", SystemConfig, "config");
  if (!systemConfig) {
    systemConfig = new SystemConfig();
    StorageSystem.store("SystemConfig", "config", systemConfig);
  }
}

export function saveSystemConfig(_systemConfig: SystemConfig) {
  StorageSystem.store("SystemConfig", "config", _systemConfig);
}

export { systemConfig };
