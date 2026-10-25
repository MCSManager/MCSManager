// Shared auto-update utilities for MCSManager daemon & panel.
//
// No new external dependencies are introduced here: everything uses Node
// built-ins (http/https/fs/path/stream) plus packages that `common` already
// declares (fs-extra, node-stream-zip, compressing). Both daemon and panel
// consume `common` from source (see webpack `resolve.alias` -> ../common/src),
// so exporting from here makes these helpers available to both bundles.

import fs from "fs-extra";
import http from "http";
import https from "https";
import path from "path";
import { pipeline } from "stream";

// node-stream-zip has no bundled types in this version; import it loosely.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StreamZip: any = require("node-stream-zip");
// compressing (tar-stream based) has no bundled types; import it loosely.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compressing: any = require("compressing");

type LogFn = (msg: string) => void;

/** Default update source: the manifest asset of the official GitHub Release. */
export const DEFAULT_UPDATE_SOURCE_URL =
  "https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json";

/**
 * Default BACKUP update source: the legacy mcsmanager.com manifest hosting.
 * Used as the second candidate when the primary source cannot be fetched or
 * parsed (see `fetchJsonFromSources`). It is also the value that
 * `migrateLegacyUpdateSourceUrl` rewrites away from a persisted PRIMARY field.
 */
export const LEGACY_DEFAULT_UPDATE_SOURCE_URL = "https://mcsmanager.com/upgrade/manifest.json";

/**
 * Migrate a persisted `updateSourceUrl` (the PRIMARY source) to the current
 * default when it still holds the legacy mcsmanager.com hosting. That URL is
 * now the default backup source (`updateSourceUrlFallback`), not a valid
 * primary value. Operator-customized URLs are returned unchanged.
 */
export function migrateLegacyUpdateSourceUrl(current?: string): string {
  const url = String(current ?? "").trim();
  return url === LEGACY_DEFAULT_UPDATE_SOURCE_URL ? DEFAULT_UPDATE_SOURCE_URL : url;
}

/**
 * Compare two dotted version strings (e.g. "4.18.3" vs "4.18.4").
 * Returns 1 if a > b, -1 if a < b, 0 if equal. Missing segments are treated as 0.
 */
export function compareVersions(a?: string, b?: string): number {
  const pa = String(a || "0")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Normalize a version string for comparison: trim whitespace and strip one
 * leading "v"/"V" marker when it precedes a digit (e.g. GitHub tags "v10.21.2"
 * -> "10.21.2"). Non-marker text such as "version" is left untouched.
 */
export function normalizeVersion(v?: string): string {
  return String(v ?? "")
    .trim()
    .replace(/^[vV](?=\d)/, "");
}

/**
 * True when `v` is a plain dotted-numeric version ("10.21.2", "4", "v1.2.3").
 * Anything else (empty, "1.2.3-beta", "abc", "1..2") is NOT comparable: update
 * checks must treat it as "no update available" (fail-closed) instead of
 * guessing how it ranks against the running version.
 */
export function isComparableVersion(v?: string): boolean {
  return /^\d+(\.\d+)*$/.test(normalizeVersion(v));
}

/**
 * GET a URL as a stream, following up to `maxRedirects` 3xx redirects.
 * `inactivityTimeoutMs` (if > 0) is a socket-inactivity timeout for the connect
 * phase via Node's `req.setTimeout` (resets on each socket event). Resolves with
 * the final response stream (status < 400).
 */
function httpGetStream(
  url: string,
  maxRedirects = 10,
  inactivityTimeoutMs = 0
): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith("https:") ? https : http;
    const req = transport.get(url, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        if (maxRedirects <= 0) {
          reject(new Error("Too many redirects"));
          return;
        }
        const nextUrl = new URL(res.headers.location, url).toString();
        resolve(httpGetStream(nextUrl, maxRedirects - 1, inactivityTimeoutMs));
        return;
      }
      if (status >= 400) {
        res.resume();
        reject(new Error(`HTTP ${status} for ${url}`));
        return;
      }
      resolve(res);
    });
    req.on("error", reject);
    if (inactivityTimeoutMs > 0) {
      req.setTimeout(inactivityTimeoutMs, () => req.destroy(new Error(`Request inactivity timeout for ${url}`)));
    }
  });
}

/**
 * Download a JSON resource from `url` and parse it. Throws on non-2xx or bad JSON.
 */
export async function fetchJson(url: string, timeoutMs = 15000): Promise<any> {
  const res = await httpGetStream(url, 10, timeoutMs);
  return await new Promise<any>((resolve, reject) => {
    const chunks: Buffer[] = [];
    res.on("data", (c: Buffer) => chunks.push(c));
    res.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch (e) {
        reject(new Error(`Invalid JSON from ${url}`));
      }
    });
    res.on("error", reject);
  });
}

/** Successful multi-source JSON fetch: which URL served the parsed payload. */
export interface FetchedJsonResult {
  data: any;
  /** The candidate URL that actually served the parsed JSON. */
  sourceUrl: string;
  /** True when a later candidate answered, i.e. the first candidate failed. */
  usedFallback: boolean;
}

/**
 * Fetch JSON from an ordered list of update-source candidates: `primaryUrl`
 * first, then `fallbackUrl`. Empty/whitespace values are skipped and a
 * duplicate candidate is tried only once. A fetch-level failure (timeout,
 * connection error, HTTP non-2xx, redirect limit, invalid JSON) moves on to
 * the next candidate; the first parseable response wins. When no candidate can
 * be fetched and parsed, an error aggregating every attempt is thrown.
 */
export async function fetchJsonFromSources(
  primaryUrl?: string,
  fallbackUrl?: string,
  timeoutMs = 15000
): Promise<FetchedJsonResult> {
  const candidates: string[] = [];
  for (const raw of [primaryUrl, fallbackUrl]) {
    const url = String(raw ?? "").trim();
    if (url && !candidates.includes(url)) candidates.push(url);
  }
  if (candidates.length === 0) {
    throw new Error("No update source configured");
  }
  const attempts: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      const data = await fetchJson(url, timeoutMs);
      return { data, sourceUrl: url, usedFallback: i > 0 };
    } catch (e) {
      attempts.push(`${url} (${(e as Error)?.message || e})`);
    }
  }
  throw new Error(`All update sources failed: ${attempts.join("; ")}`);
}

/**
 * Stream-download `url` to `destPath`, following redirects. `timeoutMs` (if > 0)
 * is a TOTAL deadline: if the whole download takes longer, the response is
 * destroyed and the promise rejects (guards against TARPIT sources that accept
 * the connection but trickle bytes forever). `onProgress` receives
 * (receivedBytes, totalBytes) where total may be 0 if the server omits
 * Content-Length.
 */
export async function downloadToFile(
  url: string,
  destPath: string,
  timeoutMs = 0,
  onProgress?: (received: number, total: number) => void
): Promise<void> {
  const res = await httpGetStream(url, 10, timeoutMs > 0 ? Math.min(timeoutMs, 60000) : 0);
  await fs.ensureDir(path.dirname(destPath));
  return await new Promise<void>((resolve, reject) => {
    const cl = res.headers["content-length"];
    const total = cl ? parseInt(Array.isArray(cl) ? cl[0] : cl, 10) || 0 : 0;
    let received = 0;
    let totalTimer: NodeJS.Timeout | undefined;
    const clearTotalTimer = () => {
      if (totalTimer) {
        clearTimeout(totalTimer);
        totalTimer = undefined;
      }
    };
    if (timeoutMs > 0) {
      totalTimer = setTimeout(() => {
        clearTotalTimer();
        res.destroy(new Error(`Download timeout after ${timeoutMs}ms for ${url}`));
      }, timeoutMs);
    }
    const ws = fs.createWriteStream(destPath);
    const finish = (err: any) => {
      clearTotalTimer();
      if (err) reject(err);
      else resolve();
    };
    ws.on("error", (e) => finish(e));
    if (onProgress) {
      res.on("data", (chunk: Buffer) => {
        received += chunk.length;
        onProgress(received, total);
      });
    }
    res.on("error", (e) => finish(e));
    pipeline(res, ws, (err: any) => finish(err));
  });
}

/**
 * Extract every entry of `zipPath` into `destDir` (overwrite existing files).
 *
 * Zip-Slip guard: every entry's resolved target must stay inside `destDir`; an
 * entry using `../` or an absolute path is rejected before extraction (defense
 * against a malicious/tampered update package writing outside the staging dir).
 *
 * node-stream-zip v1 has no `extractAll`; extracting `null` (the root) writes
 * every entry into `outPath`, recreating the directory structure.
 */
export async function extractZip(zipPath: string, destDir: string): Promise<void> {
  await fs.ensureDir(destDir);
  const destResolved = path.resolve(destDir);
  return await new Promise<void>((resolve, reject) => {
    const zip = new StreamZip({ file: zipPath, storeEntries: true });
    zip.on("ready", () => {
      try {
        const entries = zip.entries();
        for (const name in entries) {
          if (!Object.prototype.hasOwnProperty.call(entries, name)) continue;
          const target = path.resolve(destDir, name);
          if (target !== destResolved && !target.startsWith(destResolved + path.sep)) {
            zip.close();
            reject(new Error(`Zip-slip detected (entry escapes destDir): ${name}`));
            return;
          }
        }
        zip.extract(null, destDir, (err: any) => {
          zip.close();
          if (err) reject(err);
          else resolve();
        });
      } catch (e) {
        zip.close();
        reject(e);
      }
    });
    zip.on("error", (err: any) => reject(err));
  });
}

/**
 * Extract every entry of a `.tar.gz`/`.tgz` archive into `destDir` (overwrite
 * existing files).
 *
 * Tar-Slip guard: each entry's resolved target must stay inside `destDir`
 * (`../`, absolute or drive-rooted names are rejected), and only regular files
 * and directories are written — symlink/hardlink/device entries are rejected
 * outright, since a link could later redirect writes outside the destination.
 * Entries are validated BEFORE they are written; a violating entry aborts the
 * whole extraction with an error (callers treat that as a failed update and
 * leave the install directory untouched).
 */
export async function extractTarGz(tgzPath: string, destDir: string): Promise<void> {
  await fs.ensureDir(destDir);
  const destResolved = path.resolve(destDir);
  return await new Promise<void>((resolve, reject) => {
    const uncompress = new compressing.tgz.UncompressStream({ source: tgzPath });
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
      uncompress.destroy();
    };
    uncompress.on("entry", (header: any, stream: any, next: (err?: Error) => void) => {
      const name = String(header?.name || "");
      const type = String(header?.type || "");
      const target = path.resolve(destDir, name);
      const escapes =
        target !== destResolved && !target.startsWith(destResolved + path.sep);
      const isFile = type === "file" || type === "contiguous-file";
      const isDir = type === "directory";
      if (settled) {
        stream.resume();
        return next();
      }
      if (escapes) {
        stream.resume();
        return fail(new Error(`Tar-slip detected (entry escapes destDir): ${name}`));
      }
      if (!isFile && !isDir) {
        stream.resume();
        return fail(new Error(`Unsupported tar entry type "${type}" in update package: ${name}`));
      }
      const done = (err?: Error) => {
        if (err) fail(err);
        else next();
      };
      if (isDir) {
        stream.resume();
        fs.ensureDir(target).then(() => done(), done);
        return;
      }
      fs.ensureDir(path.dirname(target))
        .then(
          () =>
            new Promise<void>((res, rej) => {
              pipeline(stream, fs.createWriteStream(target), (e: any) => (e ? rej(e) : res()));
            })
        )
        .then(() => done(), done);
    });
    uncompress.on("error", (err: any) => fail(err instanceof Error ? err : new Error(String(err))));
    uncompress.on("finish", () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });
  });
}

/**
 * Extract an update package into `destDir`, dispatching on the archive format
 * by file extension: `.tar.gz`/`.tgz` (release update packages) and `.zip`
 * (legacy / custom update sources). Throws on any other extension.
 */
export async function extractArchive(archivePath: string, destDir: string): Promise<void> {
  const lower = archivePath.toLowerCase();
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) {
    return extractTarGz(archivePath, destDir);
  }
  if (lower.endsWith(".zip")) {
    return extractZip(archivePath, destDir);
  }
  throw new Error(`Unsupported update package format: ${path.basename(archivePath)}`);
}

// Directories at the installation root that an update package must NOT overlay:
// they are runtime state (config / instances / logs), not part of a build.
const OVERLAY_SKIP_TOP_DIRS = new Set(["data", "logs", "__upgrade_staging", "node_modules"]);

/** Recursively list every file (absolute path) under `dir`. */
async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(d);
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e);
      let st: fs.Stats;
      try {
        st = await fs.stat(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) await walk(p);
      else if (st.isFile()) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

/** Find the package root: the directory (directly under extractDir, or one
 *  level deep if the zip has a single top-level wrapper folder) that contains
 *  `markerFile`. Returns undefined if not found. */
async function findPackageRoot(extractDir: string, markerFile: string): Promise<string | undefined> {
  if (fs.existsSync(path.join(extractDir, markerFile))) return extractDir;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(extractDir);
  } catch {
    return undefined;
  }
  for (const e of entries) {
    const sub = path.join(extractDir, e);
    try {
      if ((await fs.stat(sub)).isDirectory() && fs.existsSync(path.join(sub, markerFile))) return sub;
    } catch {
      // ignore non-dir entries
    }
  }
  return undefined;
}

/** True if an overlay target relative path points at a runtime-state folder. */
function shouldSkipOverlay(relPath: string): boolean {
  const top = relPath.split(path.sep)[0];
  return OVERLAY_SKIP_TOP_DIRS.has(top);
}

/** Restore the install dir to its pre-overlay state for the given rel paths. */
async function rollbackOverlays(rels: string[], cwd: string, backupBase: string, log: LogFn): Promise<void> {
  for (const rel of rels) {
    const dest = path.join(cwd, rel);
    const bak = path.join(backupBase, rel);
    try {
      if (fs.existsSync(bak)) {
        await fs.copy(bak, dest, { overwrite: true }); // restore original file
      } else {
        await fs.remove(dest); // file was newly introduced by the failed overlay
      }
    } catch (e) {
      log(`Rollback failed for "${rel}": ${(e as Error).message}`);
    }
  }
  log(`Rollback complete: ${rels.length} path(s) restored/removed.`);
}

/**
 * Overlay the ENTIRE update package onto the installation directory `cwd`.
 *
 * The package root is the directory (root of the extracted zip, or a single
 * top-level wrapper folder) that contains one of `requiredFiles` (e.g.
 * "app.js") 鈥?used only as a VALIDITY GATE so a malformed/empty package is
 * rejected before anything changes. Every file under the package root is then
 * copied onto its matching relative path in `cwd` (overwriting), recreating
 * directories 鈥?i.e. "whatever the package ships, gets overlaid". Runtime-state
 * directories at the install root (data/, logs/, __upgrade_staging/,
 * node_modules/) are never touched.
 *
 * Transactional: before overwriting a file, its current on-disk version is
 * snapshotted into `backupBase`; if any file fails to copy, all files changed
 * so far are restored (or, for files the package newly introduced, removed),
 * then the error is rethrown. Returns the relative paths overlaid.
 */
export async function applyUpgradePackage(opts: {
  extractDir: string;
  cwd: string;
  backupBase: string;
  logger?: LogFn;
  requiredFiles?: string[];
}): Promise<{ overlays: string[]; packageRoot: string }> {
  const log: LogFn = opts.logger || (() => {});
  const required = opts.requiredFiles && opts.requiredFiles.length ? opts.requiredFiles : ["app.js"];

  let packageRoot: string | undefined;
  for (const f of required) {
    packageRoot = await findPackageRoot(opts.extractDir, f);
    if (packageRoot) break;
  }
  if (!packageRoot) {
    throw new Error(`Required file not found in update package: ${required.join(", ")}`);
  }

  await fs.remove(opts.backupBase);
  await fs.ensureDir(opts.backupBase);

  const allFiles = await listFilesRecursive(packageRoot);
  const overlays: string[] = [];
  for (const absSrc of allFiles) {
    const rel = path.relative(packageRoot, absSrc);
    if (shouldSkipOverlay(rel)) {
      log(`Skipped runtime-state path: ${rel}`);
      continue;
    }
    const dest = path.join(opts.cwd, rel);
    try {
      if (fs.existsSync(dest)) {
        await fs.copy(dest, path.join(opts.backupBase, rel), { overwrite: true });
      }
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(absSrc, dest, { overwrite: true });
      overlays.push(rel);
    } catch (e) {
      log(`Failed to apply "${rel}": ${(e as Error).message}`);
      await rollbackOverlays([...overlays, rel], opts.cwd, opts.backupBase, log);
      throw e;
    }
  }
  return { overlays, packageRoot };
}
