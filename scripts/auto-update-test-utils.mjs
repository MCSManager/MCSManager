// Cross-platform helpers shared by the auto-update verification harnesses
// (verify-auto-update.mjs / verify-auto-update-strict.mjs) and the package
// builder (build-update-packages.mjs).
//
// The original harnesses were POSIX-only (they shelled out to `zip`, `unzip`,
// `lsof` and `pkill`). This module abstracts those away so the same tests run on
// Windows (which ships `tar.exe`/`netstat`/`taskkill` but none of the above).

import fs from "fs";
import zlib from "zlib";
import { execSync } from "child_process";

export const isWindows = process.platform === "win32";

const quote = (s) => JSON.stringify(s);

/**
 * Create a zip archive at `zipPath` containing `entries` (paths relative to
 * `cwd`). Uses `zip` on POSIX and Windows' bundled bsdtar (`tar.exe -a`) on
 * Windows; both produce a standard zip that node-stream-zip can extract.
 */
export function makeZip(zipPath, entries, cwd) {
  fs.rmSync(zipPath, { force: true });
  const list = entries.map(quote).join(" ");
  if (isWindows) {
    // -a selects the archive format from the .zip extension (libarchive).
    execSync(`tar.exe -a -c -f ${quote(zipPath)} ${list}`, { cwd, stdio: "ignore" });
  } else {
    execSync(`zip -rq ${quote(zipPath)} ${list}`, { cwd, stdio: "ignore" });
  }
}

/** Return the archive's entry listing as text (used to detect a "../" entry). */
export function listZip(zipPath) {
  if (isWindows) return execSync(`tar.exe -t -f ${quote(zipPath)}`, { encoding: "utf-8" });
  return execSync(`unzip -l ${quote(zipPath)}`, { encoding: "utf-8" });
}

const tarBin = () => (isWindows ? "tar.exe" : "tar");

/**
 * Create a gzip-compressed tar at `tgzPath` containing `entries` (paths
 * relative to `cwd`). Both GNU tar and Windows' bsdtar accept the -czf form.
 */
export function makeTarGz(tgzPath, entries, cwd) {
  fs.rmSync(tgzPath, { force: true });
  const list = entries.map(quote).join(" ");
  execSync(`${tarBin()} -czf ${quote(tgzPath)} -C ${quote(cwd)} ${list}`, {
    cwd,
    stdio: "ignore"
  });
}

/** Return the tar.gz entry listing as text (used to assert package allowlists). */
export function listTarGz(tgzPath) {
  return execSync(`${tarBin()} -tzf ${quote(tgzPath)}`, { encoding: "utf-8" });
}

/**
 * Bump the last numeric segment of a dotted version ("4.19.2" -> "4.19.3").
 * Used by the update harnesses to derive an "online newer version" from the
 * baseline package.json version instead of hardcoding version numbers.
 */
export function bumpPatch(version) {
  const parts = String(version).split(".");
  parts[parts.length - 1] = String((parseInt(parts[parts.length - 1], 10) || 0) + 1);
  return parts.join(".");
}

// Minimal ustar writer (512-byte headers) + gzip, supporting arbitrary entry
// names and types so malicious traversal/link entries can be crafted for the
// extractTarGz guard tests (system tar tools normalise such names away).
function tarHeader(entry, size) {
  const buf = Buffer.alloc(512);
  buf.write(entry.name, 0, 100, "utf-8");
  buf.write("0000644\0", 100, 8, "utf-8");
  buf.write("0000000\0", 108, 8, "utf-8");
  buf.write("0000000\0", 116, 8, "utf-8");
  buf.write(size.toString(8).padStart(11, "0") + "\0", 124, 12, "utf-8");
  buf.write("00000000000\0", 136, 12, "utf-8");
  buf.write("        ", 148, 8, "utf-8");
  const typeflag =
    entry.type === "directory" ? "5" : entry.type === "symlink" ? "2" : entry.type === "hardlink" ? "1" : "0";
  buf.write(typeflag, 156, 1, "utf-8");
  if (entry.linkname) buf.write(entry.linkname, 157, 100, "utf-8");
  buf.write("ustar\0", 257, 6, "utf-8");
  buf.write("00", 263, 2, "utf-8");
  let sum = 0;
  for (const b of buf) sum += b;
  buf.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "utf-8");
  return buf;
}

/**
 * Write a crafted .tar.gz at `tgzPath`. Each entry: { name, content?, type?,
 * linkname? } where type is "file" (default), "directory", "symlink" or
 * "hardlink". Names are stored verbatim (including "../" traversal names).
 */
export function writeTarGz(tgzPath, entries) {
  const parts = [];
  for (const e of entries) {
    const data = Buffer.from(e.content ?? "", "utf-8");
    const size = e.type === "file" || !e.type ? data.length : 0;
    parts.push(tarHeader(e, size));
    if (size) {
      parts.push(data);
      const pad = (512 - (size % 512)) % 512;
      if (pad) parts.push(Buffer.alloc(pad));
    }
  }
  parts.push(Buffer.alloc(1024));
  fs.writeFileSync(tgzPath, zlib.gzipSync(Buffer.concat(parts)));
  return tgzPath;
}

/**
 * Kill whatever process is listening on `port`. Best-effort and idempotent:
 * never throws, so it is safe to call in cleanup / signal handlers.
 */
export function killPort(port) {
  try {
    if (isWindows) {
      const out = execSync("netstat -ano -p tcp", { encoding: "utf-8" });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        // "  TCP    127.0.0.1:23333   0.0.0.0:0   LISTENING   1234"
        const m = line.trim().match(/^TCP\S*\s+\S+:(\d+)\s+\S+\s+/i);
        if (m && Number(m[1]) === Number(port)) {
          const pid = line.trim().split(/\s+/).pop();
          if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        } catch {
          // already gone
        }
      }
    } else {
      execSync(`lsof -ti tcp:${port} 2>/dev/null | xargs kill -9 2>/dev/null || true`, {
        stdio: "ignore"
      });
    }
  } catch {
    // ignore
  }
}

/**
 * Kill processes whose command line contains `pattern` (used to catch detached
 * re-launched grandchildren the orchestrator cannot track by handle). On Windows
 * the separator is normalised to `\` because Node reports absolute script paths
 * with backslashes. Best-effort: never throws.
 */
export function killPattern(pattern) {
  try {
    if (isWindows) {
      const needle = pattern.replace(/\//g, "\\").replace(/'/g, "''");
      const ps =
        "Get-CimInstance Win32_Process | " +
        `Where-Object { $_.CommandLine -and $_.CommandLine.Contains('${needle}') } | ` +
        "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
      execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { stdio: "ignore" });
    } else {
      execSync(`pkill -9 -f ${quote(pattern)} 2>/dev/null || true`, { stdio: "ignore" });
    }
  } catch {
    // ignore
  }
}

/** Terminate a spawned child (SIGKILL on POSIX, TerminateProcess on Windows). */
export function killChild(p) {
  try {
    if (p && !p.killed) p.kill("SIGKILL");
  } catch {
    // ignore
  }
}
