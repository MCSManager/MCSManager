import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";
import Instance from "../entity/instance/instance";

import { systemInfo } from "common";
import { getVersion } from "../service/version";
import { globalConfiguration } from "../entity/config";
import i18next from "i18next";
import logger from "../service/log";
import fs from "fs-extra";
import { LOCAL_PRESET_LANG_PATH } from "../const";
import VisualDataSubsystem from "../service/system_visual_data";

// Get the basic information of the daemon system
routerApp.on("info/overview", async (ctx) => {
  const daemonVersion = getVersion();
  let total = 0;
  let running = 0;
  InstanceSubsystem.getInstances().forEach((v) => {
    total++;
    if (v.status() == Instance.STATUS_RUNNING) running++;
  });
  const info = {
    version: daemonVersion,
    process: {
      cpu: process.cpuUsage().system,
      memory: process.memoryUsage().heapUsed,
      cwd: process.cwd()
    },
    instance: {
      running,
      total
    },
    system: systemInfo(),
    cpuMemChart: VisualDataSubsystem.getSystemChartArray()
  };
  protocol.response(ctx, info);
});

routerApp.on("info/setting", async (ctx, data) => {
  const language = String(data.language);
  try {
    logger.warn("Language change:", language);
    i18next.changeLanguage(language);
    fs.remove(LOCAL_PRESET_LANG_PATH, () => {});
    globalConfiguration.config.language = language;
    globalConfiguration.store();
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});
