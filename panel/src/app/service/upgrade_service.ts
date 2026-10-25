// Panel (web) self-update service.
//
// Triggered from the Settings page via POST /api/upgrade/panel. The panel
// fetches a manifest describing the latest available build (by default the
// GitHub Release manifest, with the legacy mcsmanager.com manifest as backup
// source), compares the online version against its own package.json version,
// downloads the web update package (.tar.gz from the official release, .zip
// from custom sources), extracts it, then OVERLAYS the entire package onto the
// install directory (every file/dir the package ships — app.js, package.json,
// public/, etc. — is copied over). The new build only takes effect after a
// manual restart — the UI and the log tell the operator to restart the panel.
//
// Source resolution is a two-candidate list (updateSourceUrl, then
// updateSourceUrlFallback): a fetch-level failure of one candidate moves on to
// the next; a parseable manifest is used as-is. Version checking is
// fail-closed: a failed fetch/parse or a malformed online version NEVER
// reports "update available".
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
  extractArchive,
  fetchJsonFromSources,
  isComparableVersion,
  normalizeVersion
} from "mcsmanager-common";
import { $t } from "../i18n";
import { systemConfig } from "../setting";
import { getVersion } from "../version";
import { logger } from "./log";

const STAGING_DIR = path.normalize(path.join(process.cwd(), "__upgrade_staging"));
const ARCHIVE_BASENAME = "web";
const EXTRACT_DIR_NAME = "extracted";
const BACKUP_DIR_NAME = "backup";
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000; // total download deadline (anti-TARPIT)
const MANIFEST_TIMEOUT_MS = 15000; // per-source manifest fetch budget

const log = (m: string) => logger.info(`[AutoUpdate Panel] ${m}`);
const errLog = (m: string) => logger.error(`[AutoUpdate Panel] ${m}`);

interface IManifestEntry {
  version: string;
  url: string;
  // Release notes of the new version: a locale -> text map (keys like "en_us")
  // or a plain string used as a language-neutral fallback.
  notes?: string | Record<string, string>;
}
interface IManifest {
  daemon?: IManifestEntry;
  web?: IManifestEntry;
}

export interface IUpgradeInfo {
  configured: boolean;
  currentVersion: string;
  onlineVersion?: string;
  onlineNotes?: string | Record<string, string>;
  updateAvailable: boolean;
  updateSourceUrl: string;
  error?: string;
}

export interface IUpgradeResult {
  started: boolean;
  onlineVersion?: string;
  message?: string;
}

interface IManifestFetch {
  manifest: IManifest;
  /** The source URL that actually served the manifest. */
  sourceUrl: string;
}

let upgradeInProgress = false;

function getSourceUrls(): { primary: string; fallback: string } {
  return {
    primary: (systemConfig?.updateSourceUrl || "").trim(),
    fallback: (systemConfig?.updateSourceUrlFallback || "").trim()
  };
}

/** First candidate of the source list ("" when the feature is disabled). */
function firstCandidate(): string {
  const { primary, fallback } = getSourceUrls();
  return primary || fallback || "";
}

async function fetchManifest(): Promise<IManifestFetch> {
  const { primary, fallback } = getSourceUrls();
  const { data, sourceUrl, usedFallback } = await fetchJsonFromSources(
    primary,
    fallback,
    MANIFEST_TIMEOUT_MS
  );
  if (usedFallback) log(`Primary update source failed, using backup source: ${sourceUrl}`);
  return { manifest: data as IManifest, sourceUrl };
}

/** Staging file name for a package URL, preserving the archive format. */
function archiveFileNameFromUrl(url: string): string {
  const lower = String(url || "").split("?")[0].split("#")[0].toLowerCase();
  for (const ext of [".tar.gz", ".tgz", ".zip"]) {
    if (lower.endsWith(ext)) return ARCHIVE_BASENAME + ext;
  }
  throw new Error(`Unsupported update package format: ${String(url || "")}`);
}

/** Report the current panel version and whether a newer one is online. */
export async function getUpgradeInfo(): Promise<IUpgradeInfo> {
  const currentVersion = getVersion();
  const primaryCandidate = firstCandidate();
  if (!primaryCandidate) {
    return { configured: false, currentVersion, updateAvailable: false, updateSourceUrl: "" };
  }
  try {
    const { manifest, sourceUrl } = await fetchManifest();
    const entry = manifest?.web;
    if (!entry) {
      return {
        configured: true,
        currentVersion,
        updateAvailable: false,
        updateSourceUrl: sourceUrl,
        error: $t("TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING", { key: "web" })
      };
    }
    // Fail-closed: a malformed advertised version is never offered as an update.
    if (!isComparableVersion(entry.version)) {
      return {
        configured: true,
        currentVersion,
        updateAvailable: false,
        updateSourceUrl: sourceUrl,
        error: $t("TXT_CODE_AUTOUPDATE_B_VERSION_INVALID", { v: String(entry.version ?? "") })
      };
    }
    return {
      configured: true,
      currentVersion,
      onlineVersion: normalizeVersion(entry.version),
      onlineNotes: entry.notes,
      updateAvailable: compareVersions(normalizeVersion(entry.version), normalizeVersion(currentVersion)) > 0,
      updateSourceUrl: sourceUrl
    };
  } catch (e: any) {
    return {
      configured: true,
      currentVersion,
      updateAvailable: false,
      updateSourceUrl: primaryCandidate,
      error: String(e?.message || e)
    };
  }
}

/**
 * Perform the full panel self-update. Resolves with a result the caller can
 * respond over HTTP. On success the new files are on disk and the operator is
 * told (UI + log) to restart the panel manually — no automatic restart.
 * applyUpgradePackage is transactional, so this catch only cleans staging.
 */
export async function performUpgrade(): Promise<IUpgradeResult> {
  if (upgradeInProgress) {
    return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_ALREADY_PROGRESS") };
  }

  upgradeInProgress = true;
  const cwd = process.cwd();

  try {
    const { manifest } = await fetchManifest();
    const entry = manifest?.web;
    if (!entry) throw new Error($t("TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING", { key: "web" }));
    if (!entry.url) throw new Error($t("TXT_CODE_AUTOUPDATE_B_NO_URL"));
    if (!isComparableVersion(entry.version)) {
      throw new Error($t("TXT_CODE_AUTOUPDATE_B_VERSION_INVALID", { v: String(entry.version ?? "") }));
    }
    const currentVersion = getVersion();
    if (compareVersions(normalizeVersion(entry.version), normalizeVersion(currentVersion)) <= 0) {
      upgradeInProgress = false;
      return { started: false, message: $t("TXT_CODE_AUTOUPDATE_B_LATEST_VER", { v: currentVersion }) };
    }

    log(`New version available: v${entry.version} (current v${currentVersion}). Preparing staging...`);
    await fs.remove(STAGING_DIR);
    await fs.ensureDir(STAGING_DIR);

    const archivePath = path.join(STAGING_DIR, archiveFileNameFromUrl(entry.url));
    let lastLog = 0;
    await downloadToFile(entry.url, archivePath, DOWNLOAD_TIMEOUT_MS, (received, total) => {
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
    await extractArchive(archivePath, extractDir);
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
    log(`Overlay complete: ${overlays.length} file(s) replaced (${overlays.slice(0, 12).join(", ")}${overlays.length > 12 ? ", ..." : ""}).`);

    await fs.remove(STAGING_DIR);

    log(
      "Update applied on disk. The panel is still running the old build — restart it manually to load the new version."
    );
    upgradeInProgress = false;
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
