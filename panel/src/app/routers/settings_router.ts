import Router from "@koa/router";
import formidable from "formidable";
import * as fs from "fs-extra";
import path from "path";
import { v4 } from "uuid";
import FileManager from "../../../../daemon/src/service/system_file";
import { MARKET_CACHE_FILE_PATH, SAVE_DIR_PATH } from "../const";
import SystemConfig from "../entity/setting";
import { ROLE } from "../entity/user";
import { $t, i18next } from "../i18n";
import { speedLimit } from "../middleware/limit";
import permission from "../middleware/permission";
import {
  getFrontendLayoutConfig,
  resetFrontendLayoutConfig,
  setFrontendLayoutConfig
} from "../service/frontend_layout";
import { logger } from "../service/log";
import { operationLogger } from "../service/operation_logger";
import remoteService from "../service/remote_service";
import userSystem from "../service/user_service";
import { saveSystemConfig, systemConfig } from "../setting";
import { checkBusinessMode } from "../version";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// Get panel configuration items
router.get("/setting", permission({ level: ROLE.ADMIN }), async (ctx) => {
  ctx.body = systemConfig;
});

// [Top-level Permission]
// Update panel configuration items
router.put("/setting", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const config = ctx.request.body as Partial<SystemConfig>;
  if (config && systemConfig) {
    if (config.httpIp != null) systemConfig.httpIp = config.httpIp;
    if (config.httpPort != null) systemConfig.httpPort = config.httpPort;
    if (config.prefix != null) systemConfig.prefix = config.prefix;
    if (config.reverseProxyMode != null) {
      systemConfig.reverseProxyMode = Boolean(config.reverseProxyMode);
      ctx.app.proxy = systemConfig.reverseProxyMode;
    }
    if (config.crossDomain != null) systemConfig.crossDomain = config.crossDomain;
    if (config.gzip != null) systemConfig.gzip = config.gzip;
    if (config.maxCompress != null) systemConfig.maxCompress = config.maxCompress;
    if (config.maxDownload != null) systemConfig.maxDownload = config.maxDownload;
    if (config.zipType != null) systemConfig.zipType = config.zipType;
    if (config.totpDriftToleranceSteps != null)
      systemConfig.totpDriftToleranceSteps = config.totpDriftToleranceSteps;
    if (config.loginCheckIp != null) systemConfig.loginCheckIp = config.loginCheckIp;
    if (config.forwardType != null) systemConfig.forwardType = Number(config.forwardType);
    if (config.dataPort != null) systemConfig.dataPort = Number(config.dataPort);
    if (config.loginInfo != null) systemConfig.loginInfo = String(config.loginInfo);
    if (config.canFileManager != null) systemConfig.canFileManager = Boolean(config.canFileManager);
    if (config.allowUsePreset != null) systemConfig.allowUsePreset = Boolean(config.allowUsePreset);

    if (config.businessMode != null) systemConfig.businessMode = Boolean(config.businessMode);
    if (config.businessId != null) systemConfig.businessId = String(config.businessId);
    if (config.allowChangeCmd != null) systemConfig.allowChangeCmd = Boolean(config.allowChangeCmd);
    if (config.registerCode != null) systemConfig.registerCode = String(config.registerCode);
    if (config.panelId != null) systemConfig.panelId = String(config.panelId);

    if (config.presetPackAddr != null) {
      // clear cache
      fs.remove(MARKET_CACHE_FILE_PATH).catch((err) => {
        logger.warn(`Failed to clear preset pack cache file at ${MARKET_CACHE_FILE_PATH}: ${err}`);
      });
      systemConfig.presetPackAddr = String(config.presetPackAddr);
    }

    if (config.language != null) {
      logger.warn($t("TXT_CODE_e29a9317"), config.language);
      systemConfig.language = String(config.language);
      await i18next.changeLanguage(systemConfig.language.toLowerCase());
      remoteService.changeDaemonLanguage(systemConfig.language);
    }

    operationLogger.log("system_config_change", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"]
    });

    saveSystemConfig(systemConfig);
    checkBusinessMode();
    ctx.body = "OK";
    return;
  }
  ctx.body = new Error($t("TXT_CODE_e4d6cc20"));
});

// [Public Permission]
// Update config when install
router.put("/install", async (ctx) => {
  const config = ctx.request.body;
  if (userSystem.objects.size === 0 && systemConfig) {
    if (config.language != null) {
      logger.warn($t("TXT_CODE_e29a9317"), config.language);
      systemConfig.language = String(config.language);
      i18next.changeLanguage(systemConfig.language.toLowerCase());
      remoteService.changeDaemonLanguage(systemConfig.language);
    }
    saveSystemConfig(systemConfig);
    ctx.body = "OK";
    return;
  }
  ctx.body = new Error($t("TXT_CODE_d37f0418"));
});

// [Public router]
router.get("/layout", async (ctx) => {
  ctx.body = getFrontendLayoutConfig();
});

// [Top-level Permission]
// Set frontend layout
router.post("/layout", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const config = ctx.request.body;
  setFrontendLayoutConfig(config);
  ctx.body = true;
});

// [Top-level Permission]
// Reset frontend layout
router.delete("/layout", permission({ level: ROLE.ADMIN }), async (ctx) => {
  resetFrontendLayoutConfig();
  ctx.body = true;
});

// [Top-level Permission]
// Upload file to asserts directory, only administrator can upload
router.post("/upload_assets", permission({ level: ROLE.ADMIN }), async (ctx) => {
  let files = ctx.request.files?.file;
  let tmpFile: formidable.File | undefined;
  if (Array.isArray(files)) {
    tmpFile = files[0];
  } else {
    tmpFile = files;
  }
  try {
    if (!tmpFile) throw new Error($t("TXT_CODE_e4d6cc20"));
    if (!tmpFile.filepath || !fs.existsSync(tmpFile.filepath))
      throw new Error($t("TXT_CODE_1a499109"));
    const newFileName = v4() + path.extname(tmpFile.originalFilename || "");
    if (!FileManager.checkFileName(newFileName))
      throw new Error("Access denied: Malformed file name");
    const saveDirPath = path.join(process.cwd(), SAVE_DIR_PATH);
    if (!fs.existsSync(saveDirPath)) fs.mkdirsSync(saveDirPath);
    await fs.move(tmpFile.filepath, path.join(saveDirPath, newFileName));
    ctx.body = newFileName;
  } finally {
    if (Array.isArray(files)) {
      files.forEach((v) => {
        if (v?.filepath) fs.remove(v.filepath, () => {});
      });
    } else {
      if (tmpFile?.filepath) fs.remove(tmpFile.filepath, () => {});
    }
  }
});

router.post(
  "/refresh_business_mode",
  speedLimit(5),
  permission({ level: ROLE.ADMIN }),
  async (ctx) => {
    await checkBusinessMode();
    ctx.body = "OK";
  }
);

export default router;
