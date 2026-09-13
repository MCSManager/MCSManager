// Panel (web) self-update service.
//
// Triggered from the Settings page via POST /api/upgrade/panel. The panel
// fetches a manifest describing the latest available build, compares the
// online version against its own package.json version, downloads the web zip,
// extracts it, then OVERLAYS the entire package onto the install directory
// (every file/dir the package ships — app.js, package.json, public/, etc. — is
// copied over), and finally restarts itself so the new build loads.
//
// Replacement is NOT a fixed whitelist; runtime-state directories (data/,
// logs/) are skipped. The overlay + transactional backup/rollback lives in
// common/upgrade.ts::applyUpgradePackage.

import fs from "fs-extra";
import path from "path";
import {
  applyUpgradePackage,
  compareVersions,
  downloadToFile,
  extractZip,
  fetchJson,
  selfRestartProcess
} from "mcsmanager-common";
import { $t } from "../i18n";
import { systemConfig } from "../setting";
import { getVersion } from "../version";
import { logger } from "./log";

const STAGING_DIR = path.normalize(path.join(process.cwd(), "__upgrade_staging"));
const ZIP_NAME = "web.zip";
const EXTRACT_DIR_NAME = "extracted";
const BACKUP_DIR_NAME = "backup";
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000; // total download deadline (anti-TARPIT)
const RESTART_DELAY_MS = 1000;

const log = (m: string) => logger.info(`[AutoUpdate Panel] ${m}`);
const errLog = (m: string) => logger.error(`[AutoUpdate Panel] ${m}`);

interface IManifestEntry {
  version: string;
  url: string;
}
interface IManifest {
  daemon?: IManifestEntry;
  web?: IManifestEntry;
}

export interface IUpgradeInfo {
  configured: boolean;
  currentVersion: string;
  onlineVersion?: string;
  updateAvailable: boolean;
  updateSourceUrl: string;
  error?: string;
}

export interface IUpgradeResult {
  started: boolean;
  onlineVersion?: string;
  message?: string;
}

let upgradeInProgress = false;

function getUpdateSourceUrl(): string {
  return (systemConfig?.updateSourceUrl || "").trim();
}

async function fetchManifest(): Promise<IManifest | null> {
  const url = getUpdateSourceUrl();
  if (!url) return null;
  return (await fetchJson(url, 15000)) as IManifest;
}

/** Report the current panel version and whether a newer one is online. */
export async function getUpgradeInfo(): Promise<IUpgradeInfo> {
  const currentVersion = getVersion();
  const updateSourceUrl = getUpdateSourceUrl();
  if (!updateSourceUrl) {
    return { configured: false, currentVersion, updateAvailable: false, updateSourceUrl: "" };
  }
  try {
    const manifest = await fetchManifest();
    const entry = manifest?.web;
    if (!entry) {
      return {
        configured: true,
        currentVersion,
        updateAvailable: false,
        updateSourceUrl,
        error: $t("TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING", { key: "web" })
      };
    }
    return {
      configured: true,
      currentVersion,
      onlineVersion: entry.version,
      updateAvailable: compareVersions(entry.version, currentVersion) > 0,
      updateSourceUrl
    };
  } catch (e: any) {
    return {
      configured: true,
      currentVersion,
      updateAvailable: false,
      updateSourceUrl,
      error: String(e?.message || e)
    };
  }
}

/**
 * Perform the full panel self-update. Resolves with a result the caller can
 * respond over HTTP BEFORE the process actually restarts. On success a delayed
 * selfRestartProcess() is scheduled, then this process exits. applyUpgradePackage
 * is transactional, so this catch only cleans staging.
 */
export async function performUpgrade(): Promise<IUpgradeResult> {
  if (upgradeInProgress) {
    return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_ALREADY_PROGRESS") };
  }
  if (!systemConfig || !systemConfig.allowAutoUpdate) {
    return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_DISABLED_PANEL") };
  }

  upgradeInProgress = true;
  const cwd = process.cwd();

  try {
    const manifest = await fetchManifest();
    const entry = manifest?.web;
    if (!entry) throw new Error($t("TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING", { key: "web" }));
    if (!entry.url) throw new Error($t("TXT_CODE_AUTOUPDATE_B_NO_URL"));
    const currentVersion = getVersion();
    if (compareVersions(entry.version, currentVersion) <= 0) {
      upgradeInProgress = false;
      return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_LATEST_VER", { v: currentVersion }) };
    }

    log(`New version available: v${entry.version} (current v${currentVersion}). Preparing staging...`);
    await fs.remove(STAGING_DIR);
    await fs.ensureDir(STAGING_DIR);

    const zipPath = path.join(STAGING_DIR, ZIP_NAME);
    let lastLog = 0;
    await downloadToFile(entry.url, zipPath, DOWNLOAD_TIMEOUT_MS, (received, total) => {
      const now = Date.now();
      if (total > 0 && now - lastLog > 2000) {
        lastLog = now;
        log(`Downloading... ${Math.round(received / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB`);
      } else if (total === 0 && now - lastLog > 4000) {
        lastLog = now;
        log(`Downloading... ${Math.round(received / 1024 / 1024)}MB (size unknown)`);
      }
    });
    log("Download complete. Extracting...");

    const extractDir = path.join(STAGING_DIR, EXTRACT_DIR_NAME);
    await fs.remove(extractDir);
    await extractZip(zipPath, extractDir);
    log("Extraction complete. Overlaying package onto install dir...");

    let overlays: string[];
    try {
      overlays = (
        await applyUpgradePackage({
          extractDir,
          cwd,
          backupBase: path.join(STAGING_DIR, BACKUP_DIR_NAME),
          logger: log,
          requiredFiles: ["app.js"]
        })
      ).overlays;
    } catch (e) {
      throw new Error(`${$t("TXT_CODE_AUTOUPDATE_B_APPLY_FAILED")}: ${(e as Error).message}`);
    }
    log(`Overlay complete: ${overlays.length} file(s) replaced (${overlays.slice(0, 12).join(", ")}${overlays.length > 12 ? ", ..." : ""}). Scheduling restart...`);

    await fs.remove(STAGING_DIR);

    setTimeout(() => {
      selfRestartProcess({ logger: log, port: systemConfig?.httpPort });
    }, RESTART_DELAY_MS);

    return { started: true, onlineVersion: entry.version };
  } catch (e: any) {
    errLog(`Upgrade failed: ${e?.message || e}`);
    try {
      await fs.remove(STAGING_DIR);
    } catch {
      // ignore
    }
    upgradeInProgress = false;
    throw e;
  }
}
