// Daemon self-update service.
//
// Triggered (via panel -> socket.io "upgrade/daemon") from the web UI. The
// daemon fetches a manifest describing the latest available build, compares
// the online version against its own package.json version, downloads the
// daemon zip, extracts it, then OVERLAYS the entire package onto the install
// directory (every file the package ships is copied over), and finally
// restarts itself so the new build loads.
//
// Replacement is NOT a fixed whitelist: whatever the package contains
// (app.js, package.json, lib/, language packs, ...) is overlaid; runtime-state
// directories (data/, logs/) are skipped. The heavy lifting (overlay +
// transactional backup/rollback) lives in common/upgrade.ts::applyUpgradePackage.

import fs from "fs-extra";
import {
  applyUpgradePackage,
  compareVersions,
  downloadToFile,
  extractZip,
  fetchJson,
  selfRestartProcess
} from "mcsmanager-common";
import path from "path";
import { globalConfiguration } from "../entity/config";
import { $t } from "../i18n";
import logger from "./log";
import { getVersion } from "./version";

const STAGING_DIR = path.normalize(path.join(process.cwd(), "__upgrade_staging"));
const ZIP_NAME = "daemon.zip";
const EXTRACT_DIR_NAME = "extracted";
const BACKUP_DIR_NAME = "backup";
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000; // total download deadline (anti-TARPIT)
const RESTART_DELAY_MS = 1000; // let the socket reply flush before exit

const log = (m: string) => logger.info(`[AutoUpdate Daemon] ${m}`);
const errLog = (m: string) => logger.error(`[AutoUpdate Daemon] ${m}`);

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

export interface IUpgradeRequestData {
  // The panel forwards its own configured updateSourceUrl so the daemon can be
  // updated from the panel UI without the operator editing the daemon config.
  updateSourceUrl?: string;
}

let upgradeInProgress = false;

function localUpdateSourceUrl(): string {
  return (globalConfiguration.config.updateSourceUrl || "").trim();
}

/** Effective update-source URL: forwarded override first, then daemon config. */
function effectiveUpdateSourceUrl(override?: string): string {
  return (override || localUpdateSourceUrl()).trim();
}

async function fetchManifest(overrideUrl?: string): Promise<IManifest | null> {
  const url = effectiveUpdateSourceUrl(overrideUrl);
  if (!url) return null;
  return (await fetchJson(url, 15000)) as IManifest;
}

/** Report the current daemon version and whether a newer one is online. */
export async function getUpgradeInfo(data?: IUpgradeRequestData): Promise<IUpgradeInfo> {
  const currentVersion = getVersion();
  const updateSourceUrl = effectiveUpdateSourceUrl(data?.updateSourceUrl);
  if (!updateSourceUrl) {
    return { configured: false, currentVersion, updateAvailable: false, updateSourceUrl: "" };
  }
  try {
    const manifest = await fetchManifest(data?.updateSourceUrl);
    const entry = manifest?.daemon;
    if (!entry) {
      return {
        configured: true,
        currentVersion,
        updateAvailable: false,
        updateSourceUrl,
        error: $t("TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING", { key: "daemon" })
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
 * Perform the full daemon self-update. Resolves with a result the caller can
 * emit back over the socket BEFORE the process actually restarts. On success a
 * delayed selfRestartProcess() (detached restarter or supervisor-handled) is
 * scheduled, then this process exits. applyUpgradePackage is transactional: on
 * any failure it restores the install dir, so this catch only cleans staging.
 */
export async function performUpgrade(data?: IUpgradeRequestData): Promise<IUpgradeResult> {
  if (upgradeInProgress) {
    return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_ALREADY_PROGRESS") };
  }
  if (!globalConfiguration.config.allowAutoUpdate) {
    return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_DISABLED_DAEMON") };
  }

  upgradeInProgress = true;
  const cwd = process.cwd();

  try {
    const manifest = await fetchManifest(data?.updateSourceUrl);
    const entry = manifest?.daemon;
    if (!entry) throw new Error($t("TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING", { key: "daemon" }));
    const currentVersion = getVersion();
    if (!entry.url) throw new Error($t("TXT_CODE_AUTOUPDATE_B_NO_URL"));
    if (compareVersions(entry.version, currentVersion) <= 0) {
      upgradeInProgress = false;
      return {
        started: false,
        message: $t("TXT_CODE_AUTOUPDATE_B_LATEST_VER", { v: currentVersion })
      };
    }

    log(
      `New version available: v${entry.version} (current v${currentVersion}). Preparing staging...`
    );
    await fs.remove(STAGING_DIR);
    await fs.ensureDir(STAGING_DIR);

    const zipPath = path.join(STAGING_DIR, ZIP_NAME);
    let lastLog = 0;
    await downloadToFile(entry.url, zipPath, DOWNLOAD_TIMEOUT_MS, (received, total) => {
      const now = Date.now();
      if (total > 0 && now - lastLog > 2000) {
        lastLog = now;
        log(
          `Downloading... ${Math.round(received / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB`
        );
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
    log(
      `Overlay complete: ${overlays.length} file(s) replaced (${overlays.slice(0, 12).join(", ")}${overlays.length > 12 ? ", ..." : ""}). Scheduling restart...`
    );

    // Success: drop the staging area (backup no longer needed).
    await fs.remove(STAGING_DIR);

    setTimeout(() => {
      selfRestartProcess({ logger: log, port: globalConfiguration.config.port });
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
