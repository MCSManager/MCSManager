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

import * as fs from "fs-extra";
import GlobalVariable from "./common/global_variable";
import { logger } from "./service/log";

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
  } catch (error) {
    logger.error("Version Check failure:", error);
  }
}

export function getVersion() {
  return GlobalVariable.get("version", "Unknown");
}

export function specifiedDaemonVersion() {
  try {
    const data: any = JSON.parse(fs.readFileSync(PACKAGE_JSON, { encoding: "utf-8" }));
    return data.daemonVersion ?? "1.0.0";
  } catch (error) {
    return "1.0.0";
  }
}
