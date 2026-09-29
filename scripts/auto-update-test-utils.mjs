// Cross-platform helpers shared by the auto-update verification harnesses
// (verify-auto-update.mjs / verify-auto-update-strict.mjs) and the package
// builder (build-update-packages.mjs).
//
// The original harnesses were POSIX-only (they shelled out to `zip`, `unzip`,
// `lsof` and `pkill`). This module abstracts those away so the same tests run on
// Windows (which ships `tar.exe`/`netstat`/`taskkill` but none of the above).

import fs from "fs";
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
