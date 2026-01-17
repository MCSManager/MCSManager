import Instance from "../entity/instance/instance";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import InstanceSubsystem from "../service/system_instance";

import fs from "fs-extra";
import i18next from "i18next";
import { systemInfo, toNumber, toText } from "mcsmanager-common";
import { LOCAL_PRESET_LANG_PATH } from "../const";
import { globalConfiguration } from "../entity/config";
import { $t } from "../i18n";
import { DockerManager } from "../service/docker_service";
import logger from "../service/log";
import VisualDataSubsystem from "../service/system_visual_data";
import { getVersion } from "../service/version";

// Get the basic information of the daemon system
routerApp.on("info/overview", async (ctx) => {
  const daemonVersion = getVersion();
  let total = 0;
  let running = 0;
  InstanceSubsystem.getInstances().forEach((v) => {
    total++;
    if (v.status() == Instance.STATUS_RUNNING) running++;
  });

  let dockerPlatforms: string[] | undefined;
  try {
    const dockerManager = new DockerManager();
    dockerPlatforms = await dockerManager.getSupportedPlatforms();
  } catch (error: any) {
    logger.debug("Failed to get Docker platforms:", error);
  }

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
    cpuMemChart: VisualDataSubsystem.getSystemChartArray(),
    config: {
      language: globalConfiguration.config.language,
      uploadSpeedRate: globalConfiguration.config.uploadSpeedRate,
      downloadSpeedRate: globalConfiguration.config.downloadSpeedRate,
      maxDownloadFromUrlFileCount: globalConfiguration.config.maxDownloadFromUrlFileCount,
      portRangeStart: globalConfiguration.config.allocatablePortRange[0],
      portRangeEnd: globalConfiguration.config.allocatablePortRange[1],
      portAssignInterval: globalConfiguration.config.portAssignInterval,
      port: globalConfiguration.config.port
    },
    dockerPlatforms
  };
  protocol.response(ctx, info);
});

routerApp.on("info/setting", async (ctx, data) => {
  const language = toText(data.language);
  const uploadSpeedRate = toNumber(data.uploadSpeedRate);
  const downloadSpeedRate = toNumber(data.downloadSpeedRate);
  const maxDownloadFromUrlFileCount = toNumber(data.maxDownloadFromUrlFileCount);
  const portRangeStart = toNumber(data.portRangeStart);
  const portRangeEnd = toNumber(data.portRangeEnd);
  const portAssignInterval = toNumber(data.portAssignInterval);
  const port = toNumber(data.port);
  if (language) {
    logger.warn($t("TXT_CODE_66e32091"), language);
    i18next.changeLanguage(language);
    fs.remove(LOCAL_PRESET_LANG_PATH, () => {});
    globalConfiguration.config.language = language;
  }
  if (uploadSpeedRate != null && uploadSpeedRate >= 0) {
    globalConfiguration.config.uploadSpeedRate = uploadSpeedRate;
  }
  if (downloadSpeedRate != null && downloadSpeedRate >= 0) {
    globalConfiguration.config.downloadSpeedRate = downloadSpeedRate;
  }
  if (maxDownloadFromUrlFileCount != null && maxDownloadFromUrlFileCount >= 0) {
    globalConfiguration.config.maxDownloadFromUrlFileCount = maxDownloadFromUrlFileCount;
  }
  if (portRangeStart != null && portRangeEnd != null && portRangeStart < portRangeEnd) {
    globalConfiguration.config.allocatablePortRange = [portRangeStart, portRangeEnd];
    globalConfiguration.config.currentAllocatablePort = portRangeStart;
  }
  if (portAssignInterval != null && portAssignInterval > 0) {
    globalConfiguration.config.portAssignInterval = portAssignInterval;
  }
  if (port && port > 0 && port < 65535) {
    globalConfiguration.config.port = port;
  }
  globalConfiguration.store();
  protocol.response(ctx, true);
});
