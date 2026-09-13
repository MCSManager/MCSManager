// End-to-end verification of the MCSManager auto-update feature.
//
// Orchestrates:
//   1. Local update static server (manifest.json + daemon.zip + web.zip) on :9999
//   2. A fresh daemon (product-code/daemon)
//   3. A fresh panel  (product-code/web)
//   4. Real HTTP calls against the panel API (install -> login -> upgrade endpoints)
//      EXACTLY the endpoints the new web UI buttons hit, then asserts:
//        - panel self-update: package overlaid (incl. an OVERLAY_MARKER), panel restarts, version -> 10.18.4
//        - daemon self-update (forwarded panel->daemon): package overlaid, daemon restarts, version -> 4.18.4
//
// Usage:  node scripts/verify-auto-update.mjs
//
// Cleanup is port-based (kills whatever is listening on 24444/23333/9999) because an
// updated process relaunches as a detached child the orchestrator cannot track directly.

import fs from "fs";
import net from "net";
import path from "path";
import { spawn, execSync } from "child_process";

const repo = path.resolve(import.meta.dirname, "..");
const prod = path.join(repo, "production-code");
const daemonDir = path.join(prod, "daemon");
const webDir = path.join(prod, "web");
const logDir = path.join(import.meta.dirname, "update-packages");
const MANIFEST_URL = "http://localhost:9999/manifest.json";
const PANEL = "http://localhost:23333";

const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin#12345"; // satisfies validatePassword
const BASE_DAEMON = "4.18.3";
const BASE_WEB = "10.18.3";
const NEW_DAEMON = "4.18.4";
const NEW_WEB = "10.18.4";

const cookies = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[verify]", ...a);
const err = (...a) => console.error("[verify][ERROR]", ...a);

function assert(cond, msg) {
  if (!cond) {
    err("ASSERT FAILED:", msg);
    process.exitCode = 1;
    throw new Error("assert: " + msg);
  } else {
    log("  ok:", msg);
  }
}

// ---- process & port helpers ----
function spawnProc(name, cmd, args, cwd) {
  const logPath = path.join(logDir, `verify-${name}.log`);
  const out = fs.createWriteStream(logPath, { flags: "w" });
  const p = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env } });
  p.stdout.pipe(out);
  p.stderr.pipe(out);
  p.on("exit", (code) => log(`${name} exited code=${code}`));
  return p;
}

function waitForPort(port, host = "127.0.0.1", timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConn = () => {
      const s = new net.Socket();
      s.setTimeout(1500);
      s.once("connect", () => {
        s.destroy();
        resolve();
      });
      s.once("error", () => {
        s.destroy();
        if (Date.now() - start > timeout) reject(new Error(`port ${port} not up in ${timeout}ms`));
        else setTimeout(tryConn, 400);
      });
      s.once("timeout", () => {
        s.destroy();
        if (Date.now() - start > timeout) reject(new Error(`port ${port} not up in ${timeout}ms`));
        else setTimeout(tryConn, 400);
      });
      s.connect(port, host);
    };
    tryConn();
  });
}

function killPort(port) {
  try {
    execSync(`lsof -ti tcp:${port} 2>/dev/null | xargs kill -9 2>/dev/null || true`, { stdio: "ignore" });
  } catch {
    // ignore
  }
}

// Track spawned children so cleanup can terminate them directly (a detached
// re-launch after an update is not a direct child and is handled via killPort).
let procServer, procDaemon, procPanel;
function killChild(p) {
  try {
    if (p && !p.killed) p.kill("SIGKILL");
  } catch {
    // ignore
  }
}
// Kill by command line (catches detached re-launched grandchildren, which are
// reparented to init/PID 1 after the restarter exits and may not be reachable
// via the spawned child handle or a single lsof snapshot).
function killPattern(pattern) {
  try {
    execSync(`pkill -9 -f ${JSON.stringify(pattern)} 2>/dev/null || true`, { stdio: "ignore" });
  } catch {
    // ignore
  }
}
function cleanup() {
  log("cleanup: killing children + processes + :9999 :23333 :24444");
  killChild(procServer);
  killChild(procDaemon);
  killChild(procPanel);
  killPattern("production-code/daemon/app.js");
  killPattern("production-code/web/app.js");
  killPattern("update-test-server.mjs");
  [9999, 23333, 24444].forEach((p) => killPort(p));
  [9999, 23333, 24444].forEach((p) => killPort(p));
}

// ---- HTTP w/ cookie jar ----
function recordCookies(headers) {
  const sc =
    headers.getSetCookie?.() ||
    (headers.get("set-cookie") ? [headers.get("set-cookie")] : []);
  for (const c of sc) {
    const eq = c.indexOf("=");
    if (eq < 0) continue;
    cookies[c.slice(0, eq)] = c.slice(eq + 1).split(";")[0];
  }
}
function cookieHeader() {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}
async function httpReq(method, urlPath, body, token) {
  const opt = { method, headers: {} };
  if (cookieHeader()) opt.headers.cookie = cookieHeader();
  opt.headers["x-requested-with"] = "XMLHttpRequest";
  if (body !== undefined) {
    opt.headers["content-type"] = "application/json";
    opt.body = JSON.stringify(body);
  }
  let u = urlPath;
  if (token) u += (urlPath.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
  const res = await fetch(PANEL + u, opt);
  recordCookies(res.headers);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  // The panel's response protocol wraps normal/error bodies as {status, data, time}.
  // Unwrap so callers see the real payload directly.
  let payload = data;
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "status" in data &&
    "data" in data &&
    "time" in data
  ) {
    payload = data.data;
  }
  return { status: res.status, data: payload, raw: data };
}

async function pollUntil(label, fn, timeoutMs, intervalMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (await fn()) return true;
    } catch {
      // keep polling
    }
    await sleep(intervalMs);
  }
  err(`poll timeout: ${label}`);
  return false;
}

// ---- main ----
async function main() {
  ["SIGINT", "SIGTERM"].forEach((sig) =>
    process.on(sig, () => {
      cleanup();
      process.exit(128);
    })
  );

  log("step 0: kill stale listeners & reset runtime data");
  [9999, 23333, 24444].forEach(killPort);
  fs.rmSync(path.join(daemonDir, "data"), { recursive: true, force: true });
  fs.rmSync(path.join(webDir, "data"), { recursive: true, force: true });
  fs.rmSync(path.join(daemonDir, "__upgrade_staging"), { recursive: true, force: true });
  fs.rmSync(path.join(webDir, "__upgrade_staging"), { recursive: true, force: true });
  for (const d of [daemonDir, webDir]) {
    for (const f of fs.readdirSync(d)) {
      if (/^(app\.js\.bak\.|public\.bak\.)/.test(f)) fs.rmSync(path.join(d, f), { recursive: true, force: true });
    }
  }
  // A successful prior run mutates production-code/{daemon,web}/package.json on
  // disk (the update replaces it). app.js/public are byte-identical (the zip
  // ships the current build), so restoring the baseline package.json is enough
  // to re-run from the baseline version.
  fs.copyFileSync(path.join(repo, "daemon", "package.json"), path.join(daemonDir, "package.json"));
  fs.copyFileSync(path.join(repo, "panel", "package.json"), path.join(webDir, "package.json"));
  log("  baseline restored: daemon 4.18.3 / panel 10.18.3");

  log("step 1: build update packages + manifest");
  execSync("node scripts/build-update-packages.mjs", { stdio: "inherit", cwd: repo });

  log("step 2: start update server (9999)");
  procServer = spawnProc("server", "node", ["scripts/update-test-server.mjs"], repo);
  await waitForPort(9999);

  log("step 3: start daemon (writes config with random key; defaults: allowAutoUpdate=true, updateSourceUrl empty)");
  procDaemon = spawnProc("daemon", process.execPath, ["app.js"], daemonDir);
  await waitForPort(24444);
  await sleep(800); // let config persist
  const daemonCfgPath = path.join(daemonDir, "data", "Config", "global.json");
  assert(fs.existsSync(daemonCfgPath), "daemon config file created");
  const dCfg = JSON.parse(fs.readFileSync(daemonCfgPath, "utf-8"));
  log(`  daemon key: ${dCfg.key}`);
  // NOTE: we intentionally do NOT set the daemon's local updateSourceUrl. The
  // daemon update must work via the panel FORWARDING its own updateSourceUrl
  // (the realistic UI flow) — that is exactly what gets exercised below.

  log("step 4: (skipped — daemon uses panel-forwarded updateSourceUrl, no local config)");

  log("step 5: start panel (23333)");
  procPanel = spawnProc("panel", process.execPath, ["app.js"], webDir);
  await waitForPort(23333);

  log("step 6: install + login (panel)");
  {
    const install = await httpReq("POST", "/api/auth/install", { username: ADMIN_USER, password: ADMIN_PASS });
    assert(install.status === 200 && install.data === true, "install admin ok");
    // install also logs the session in and returns `true` (not the token).
    // Logout to clear that session, then fresh-login to obtain the token string.
    await httpReq("GET", "/api/auth/logout");
    const login = await httpReq("POST", "/api/auth/login", { username: ADMIN_USER, password: ADMIN_PASS });
    assert(
      login.status === 200 && typeof login.data === "string" && login.data.length > 0 && login.data !== "Logined",
      "login returns a real token (got: " + JSON.stringify(login.data) + ")"
    );
    global.__token = login.data;
    log("  token:", global.__token);
  }

  log("step 7: configure panel updateSourceUrl via PUT /api/overview/setting");
  {
    const g = await httpReq("GET", "/api/overview/setting", undefined, global.__token);
    assert(g.status === 200, "GET setting 200");
    const merged = { ...(typeof g.data === "string" ? {} : g.data || {}) };
    merged.updateSourceUrl = MANIFEST_URL;
    merged.allowAutoUpdate = true;
    const r = await httpReq("PUT", "/api/overview/setting", merged, global.__token);
    assert(r.status === 200 || r.status === 204 || r.status === 201, "setting PUT ok (" + r.status + ")");
  }

  log("step 8: GET /api/upgrade/panel_info -> expect update available");
  {
    const r = await httpReq("GET", "/api/upgrade/panel_info", undefined, global.__token);
    assert(r.status === 200, "panel_info 200");
    log("  panel_info:", JSON.stringify(r.data));
    assert(r.data?.configured === true, "panel updateSource configured");
    assert(r.data?.currentVersion === BASE_WEB, "panel currentVersion = " + BASE_WEB);
    assert(r.data?.updateAvailable === true && r.data?.onlineVersion === NEW_WEB, "panel updateAvailable -> " + NEW_WEB);
  }

  log("step 9: find daemon uuid (wait for panel<->daemon connection)");
  let daemonUuid;
  {
    const connected = await pollUntil("panel connected to daemon", async () => {
      const r = await httpReq("GET", "/api/service/remote_services_list", undefined, global.__token);
      return r.status === 200 && Array.isArray(r.data) && r.data.some((n) => n.available);
    }, 60000, 2000);
    assert(connected, "panel connected to a daemon");
    const r = await httpReq("GET", "/api/service/remote_services_list", undefined, global.__token);
    daemonUuid = r.data[0].uuid;
    log("  daemon uuid:", daemonUuid, "available:", r.data[0].available);
  }

  log("step 10: GET /api/upgrade/daemon_info -> expect update available");
  {
    const r = await httpReq("GET", "/api/upgrade/daemon_info?uuid=" + daemonUuid, undefined, global.__token);
    assert(r.status === 200, "daemon_info 200");
    log("  daemon_info:", JSON.stringify(r.data));
    assert(r.data?.configured === true, "daemon updateSource configured");
    assert(r.data?.updateAvailable === true && r.data?.onlineVersion === NEW_DAEMON, "daemon updateAvailable -> " + NEW_DAEMON);
  }

  // ---- panel self-update ----
  log("step 11: POST /api/upgrade/panel -> trigger panel self-update + restart");
  {
    const r = await httpReq("POST", "/api/upgrade/panel", undefined, global.__token);
    assert(r.status === 200, "panel upgrade 200");
    log("  panel upgrade result:", JSON.stringify(r.data));
    assert(r.data?.started === true && r.data?.onlineVersion === NEW_WEB, "panel upgrade started -> " + NEW_WEB);
  }
  log("step 12: wait for panel restart, verify on-disk package.json -> " + NEW_WEB);
  await sleep(3000); // let panel exit + restarter relaunch
  await pollUntil("panel http back", async () => {
    try {
      const res = await fetch(PANEL + "/api/auth/status");
      return res.ok || res.status === 200;
    } catch {
      return false;
    }
  }, 60000, 2000);
  {
    const pkg = JSON.parse(fs.readFileSync(path.join(webDir, "package.json"), "utf-8"));
    assert(pkg.version === NEW_WEB, "panel package.json on disk -> " + NEW_WEB);
    // The marker ships at the package root and is NOT in any fixed file list —
    // its presence proves the WHOLE package was overlaid, not just app.js/public.
    assert(
      fs.existsSync(path.join(webDir, "OVERLAY_MARKER.txt")),
      "panel OVERLAY_MARKER.txt overlaid (whole-package overlay)"
    );
  }
  global.__token = null;
  // re-login on the new panel (fresh session store)
  {
    const login = await httpReq("POST", "/api/auth/login", { username: ADMIN_USER, password: ADMIN_PASS });
    assert(login.status === 200 && typeof login.data === "string", "re-login after panel restart ok");
    global.__token = login.data;
  }
  log("step 13: GET /api/upgrade/panel_info -> currentVersion now " + NEW_WEB);
  {
    const r = await httpReq("GET", "/api/upgrade/panel_info", undefined, global.__token);
    assert(r.status === 200, "panel_info 200 (after update)");
    log("  panel_info:", JSON.stringify(r.data));
    assert(r.data?.currentVersion === NEW_WEB, "panel currentVersion = " + NEW_WEB);
    assert(r.data?.updateAvailable === false, "panel no longer updateAvailable");
  }

  // ---- daemon self-update (panel forwards) ----
  log("step 14: POST /api/upgrade/daemon -> trigger daemon self-update + restart");
  {
    const r = await httpReq("POST", "/api/upgrade/daemon?uuid=" + daemonUuid, undefined, global.__token);
    assert(r.status === 200, "daemon upgrade forward 200");
    log("  daemon upgrade result:", JSON.stringify(r.data));
    assert(r.data?.started === true && r.data?.onlineVersion === NEW_DAEMON, "daemon upgrade started -> " + NEW_DAEMON);
  }
  log("step 15: wait for daemon reconnect + version -> " + NEW_DAEMON);
  await sleep(3000);
  const ok = await pollUntil("daemon available & version " + NEW_DAEMON, async () => {
    const r = await httpReq("GET", "/api/overview", undefined, global.__token);
    if (r.status !== 200 || !r.data || !Array.isArray(r.data.remote)) return false;
    const node = r.data.remote.find((n) => n && n.uuid === daemonUuid);
    return !!node && node.available === true && node.version === NEW_DAEMON;
  }, 90000, 2000);
  assert(ok, "daemon came back online with version " + NEW_DAEMON);
  {
    const pkg = JSON.parse(fs.readFileSync(path.join(daemonDir, "package.json"), "utf-8"));
    assert(pkg.version === NEW_DAEMON, "daemon package.json on disk -> " + NEW_DAEMON);
    assert(
      fs.existsSync(path.join(daemonDir, "OVERLAY_MARKER.txt")),
      "daemon OVERLAY_MARKER.txt overlaid (whole-package overlay)"
    );
  }

  log("\n================ RESULT ================");
  log("Panel  self-update: " + BASE_WEB + " -> " + NEW_WEB + "  OK (whole-package overlay verified)");
  log("Daemon self-update: " + BASE_DAEMON + " -> " + NEW_DAEMON + "  OK (whole-package overlay verified)");
  log("=======================================");
  // Remove the overlay marker files so production-code stays pristine.
  fs.rmSync(path.join(webDir, "OVERLAY_MARKER.txt"), { force: true });
  fs.rmSync(path.join(daemonDir, "OVERLAY_MARKER.txt"), { force: true });
  cleanup();
  process.exit(process.exitCode || 0);
}

process.on("exit", () => {
  // Best-effort; the user may want to inspect, so do NOT kill here.
  // Comment out the line below to leave processes running.
  cleanup();
});

main().catch((e) => {
  err("verification failed:", e?.stack || e);
  cleanup();
  process.exit(1);
});
