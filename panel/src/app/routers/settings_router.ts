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

    // Snapshot identity-critical SSO fields before applying changes
    const prevSsoType = systemConfig.ssoType || "oidc";
    const prevSsoIssuer = systemConfig.ssoIssuer;
    const prevSsoUserinfoUrl = systemConfig.ssoUserinfoUrl;
    const prevSsoUserIdField = systemConfig.ssoUserIdField || "id";

    // SSO type
    if (config.ssoType != null) {
      const t = String(config.ssoType);
      if (t !== "oidc" && t !== "oauth2") throw new Error("ssoType must be 'oidc' or 'oauth2'");
      systemConfig.ssoType = t;
    }
    const ssoType = systemConfig.ssoType || "oidc";

    // SSO core fields
    {
      const wantEnable = config.ssoEnabled != null ? Boolean(config.ssoEnabled) : systemConfig.ssoEnabled;
      const clientId = config.ssoClientId != null ? String(config.ssoClientId) : systemConfig.ssoClientId;
      const clientSecret = config.ssoClientSecret != null ? String(config.ssoClientSecret) : systemConfig.ssoClientSecret;

      if (ssoType === "oidc") {
        const issuer = config.ssoIssuer != null ? String(config.ssoIssuer) : systemConfig.ssoIssuer;
        if (issuer && !issuer.startsWith("https://") && !issuer.startsWith("http://")) {
          throw new Error("SSO Issuer URL must use http(s) protocol");
        }
        if (wantEnable && (!issuer?.trim() || !clientId?.trim() || !clientSecret?.trim())) {
          throw new Error("Cannot enable SSO (OIDC): Issuer, Client ID, and Client Secret are required");
        }
        if (issuer?.trim() && clientId?.trim() && clientSecret?.trim()) {
          const { verifyIssuer, clearOIDCCache } = require("../service/sso_service");
          await verifyIssuer(issuer, clientId, clientSecret);
          clearOIDCCache();
        }
        if (config.ssoIssuer != null) systemConfig.ssoIssuer = issuer;
      } else {
        // OAuth 2.0
        const authorizeUrl = config.ssoAuthorizeUrl != null ? String(config.ssoAuthorizeUrl) : systemConfig.ssoAuthorizeUrl;
        const tokenUrl = config.ssoTokenUrl != null ? String(config.ssoTokenUrl) : systemConfig.ssoTokenUrl;
        const userinfoUrl = config.ssoUserinfoUrl != null ? String(config.ssoUserinfoUrl) : systemConfig.ssoUserinfoUrl;

        const validateUrl = (url: string, name: string) => {
          if (url && !url.startsWith("https://") && !url.startsWith("http://")) {
            throw new Error(`SSO ${name} must use http(s) protocol`);
          }
        };
        validateUrl(authorizeUrl, "Authorize URL");
        validateUrl(tokenUrl, "Token URL");
        validateUrl(userinfoUrl, "Userinfo URL");

        if (wantEnable && (!authorizeUrl?.trim() || !tokenUrl?.trim() || !userinfoUrl?.trim() || !clientId?.trim() || !clientSecret?.trim())) {
          throw new Error("Cannot enable SSO (OAuth 2.0): Authorize URL, Token URL, Userinfo URL, Client ID, and Client Secret are required");
        }

        if (config.ssoAuthorizeUrl != null) systemConfig.ssoAuthorizeUrl = authorizeUrl;
        if (config.ssoTokenUrl != null) systemConfig.ssoTokenUrl = tokenUrl;
        if (config.ssoUserinfoUrl != null) systemConfig.ssoUserinfoUrl = userinfoUrl;
      }

      if (config.ssoEnabled != null) systemConfig.ssoEnabled = wantEnable;
      if (config.ssoClientId != null) systemConfig.ssoClientId = clientId;
      if (config.ssoClientSecret != null) systemConfig.ssoClientSecret = clientSecret;
    }

    if (config.ssoUserIdField != null) systemConfig.ssoUserIdField = String(config.ssoUserIdField) || "id";

    // Unbind all SSO users when identity-critical fields change
    {
      const typeChanged = systemConfig.ssoType !== prevSsoType;
      const issuerChanged = ssoType === "oidc" && systemConfig.ssoIssuer !== prevSsoIssuer;
      const userinfoChanged = ssoType === "oauth2" && systemConfig.ssoUserinfoUrl !== prevSsoUserinfoUrl;
      const userIdFieldChanged = ssoType === "oauth2" && systemConfig.ssoUserIdField !== prevSsoUserIdField;

      if (typeChanged || issuerChanged || userinfoChanged || userIdFieldChanged) {
        const count = await userSystem.unbindAllSso();
        if (count > 0) {
          logger.warn(`[SSO] Identity-critical config changed, unbound ${count} SSO user(s).`);
        }
      }
    }
    if (config.ssoScopes != null) systemConfig.ssoScopes = String(config.ssoScopes);
    if (config.ssoOnlyMode != null) systemConfig.ssoOnlyMode = Boolean(config.ssoOnlyMode);
    if (config.ssoAutoRedirect != null) systemConfig.ssoAutoRedirect = Boolean(config.ssoAutoRedirect);
    if (config.ssoProviderName != null) systemConfig.ssoProviderName = String(config.ssoProviderName);
    if (config.ssoIconUrl != null) {
      const iconUrl = String(config.ssoIconUrl);
      if (iconUrl && !iconUrl.startsWith("https://") && !iconUrl.startsWith("http://") && !iconUrl.startsWith("/")) {
        throw new Error("SSO icon URL must use http(s) protocol or be a relative path");
      }
      systemConfig.ssoIconUrl = iconUrl;
    }
    if (config.ssoCallbackUrl != null) {
      const cbUrl = String(config.ssoCallbackUrl);
      if (cbUrl && !cbUrl.startsWith("https://") && !cbUrl.startsWith("http://")) {
        throw new Error("SSO Callback URL must use http(s) protocol");
      }
      systemConfig.ssoCallbackUrl = cbUrl;
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
