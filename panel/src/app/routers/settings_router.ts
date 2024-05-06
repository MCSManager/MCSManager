import Router from "@koa/router";
import remoteService from "../service/remote_service";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { saveSystemConfig, systemConfig } from "../setting";
import { logger } from "../service/log";
import { i18next, $t } from "../i18n";
import userSystem from "../service/user_service";
import { v4 } from "uuid";
import path from "path";
import * as fs from "fs-extra";
import {
  getFrontendLayoutConfig,
  resetFrontendLayoutConfig,
  setFrontendLayoutConfig
} from "../service/frontend_layout";
import { ROLE } from "../entity/user";
import { SAVE_DIR_PATH } from "../service/frontend_layout";
import FileManager from "../../../../daemon/src/service/system_file";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// Get panel configuration items
router.get("/setting", permission({ level: ROLE.ADMIN }), async (ctx) => {
  ctx.body = systemConfig;
});

// [Top-level Permission]
// Update panel configuration items
router.put("/setting", validator({ body: {} }), permission({ level: ROLE.ADMIN }), async (ctx) => {
  const config = ctx.request.body;
  if (config && systemConfig) {
    if (config.httpIp != null) systemConfig.httpIp = config.httpIp;
    if (config.httpPort != null) systemConfig.httpPort = config.httpPort;
    if (config.prefix != null) systemConfig.prefix = config.prefix;
    if (config.reverseProxyMode != null)
      systemConfig.reverseProxyMode = Boolean(config.reverseProxyMode);
    if (config.crossDomain != null) systemConfig.crossDomain = config.crossDomain;
    if (config.gzip != null) systemConfig.gzip = config.gzip;
    if (config.maxCompress != null) systemConfig.maxCompress = config.maxCompress;
    if (config.maxDownload != null) systemConfig.maxDownload = config.maxDownload;
    if (config.zipType != null) systemConfig.zipType = config.zipType;
    if (config.loginCheckIp != null) systemConfig.loginCheckIp = config.loginCheckIp;
    if (config.forwardType != null) systemConfig.forwardType = Number(config.forwardType);
    if (config.dataPort != null) systemConfig.dataPort = Number(config.dataPort);
    if (config.loginInfo != null) systemConfig.loginInfo = String(config.loginInfo);
    if (config.canFileManager != null) systemConfig.canFileManager = Boolean(config.canFileManager);
    if (config.allowUsePreset != null) systemConfig.allowUsePreset = Boolean(config.allowUsePreset);
    if (config.presetPackAddr != null) systemConfig.presetPackAddr = String(config.presetPackAddr);
    if (config.language != null) {
      logger.warn($t("TXT_CODE_e29a9317"), config.language);
      systemConfig.language = String(config.language);
      await i18next.changeLanguage(systemConfig.language.toLowerCase());
      remoteService.changeDaemonLanguage(systemConfig.language);
    }
    saveSystemConfig(systemConfig);
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
  const tmpFiles = ctx.request.files?.file;
  try {
    if (!tmpFiles || !(tmpFiles instanceof Array)) throw new Error($t("TXT_CODE_e4d6cc20"));
    if (!tmpFiles[0].filepath || !fs.existsSync(tmpFiles[0].filepath))
      throw new Error($t("TXT_CODE_1a499109"));
    const tmpFile = tmpFiles[0];
    const newFileName = v4() + path.extname(tmpFile.originalFilename || "");
    if (!FileManager.checkFileName(newFileName))
      throw new Error("Access denied: Malformed file name");
    const saveDirPath = path.join(process.cwd(), SAVE_DIR_PATH);
    if (!fs.existsSync(saveDirPath)) fs.mkdirsSync(saveDirPath);
    await fs.move(tmpFile.filepath, path.join(saveDirPath, newFileName));
    ctx.body = newFileName;
  } finally {
    tmpFiles?.forEach((v) => {
      if (v?.filepath) fs.remove(v.filepath, () => {});
    });
  }
});

export default router;
