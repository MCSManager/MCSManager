// STRICT end-to-end verification of the MCSManager auto-update ACTUAL EFFECT.
//
// Goes beyond the basic harness (which only bumps package.json version with a
// byte-identical app.js) to prove the real on-disk artefacts change:
//
//   A. "Already latest"        -> trigger with onlineVersion == current: no restart, message.
//   B. Zip-Slip malicious zip  -> extractZip rejects the ../  entry; service stays up, files untouched.
//   C. Panel happy update      -> app.js gets a UNIQUE content marker appended in the zip; after the
//                                 update the on-disk app.js CONTAINS that marker (real content replaced),
//                                 a NEW public/ file appears, an EXISTING public file is overwritten, the
//                                 package.json version bumps, OVERLAY_MARKER lands, and the panel reboots
//                                 from the new app.js (API ok, version reads new).
//   D. Daemon happy update (forwarded) -> daemon app.js content marker lands, version bumps, marker lands.
//
// A/B/C/D are run on ONE fresh panel (in that order) so the no-mutation cases
// (A,B) precede the mutating ones (C,D). Usage: node scripts/verify-auto-update-strict.mjs

import fs from "fs";
import net from "net";
import path from "path";
import { spawn } from "child_process";
import { killChild, killPattern, killPort, listZip, makeZip } from "./auto-update-test-utils.mjs";

const repo = path.resolve(import.meta.dirname, "..");
const prod = path.join(repo, "production-code");
const daemonDir = path.join(prod, "daemon");
const webDir = path.join(prod, "web");
const outRoot = path.join(import.meta.dirname, "update-packages");
const outDir = path.join(outRoot, "strict");
const PORT = 9999;
const PANEL = "http://localhost:23333";

const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin#12345";
const BASE_DAEMON = "4.18.3";
const BASE_WEB = "10.18.3";
const NEW_DAEMON = "4.18.4";
const NEW_WEB = "10.18.4";
const SLIP_WEB = "10.18.5"; // > current so performUpgrade proceeds to extractZip
const NOAPP_WEB = "10.18.5"; // > current so performUpgrade proceeds to applyUpgradePackage

const APP_MARKER = (name) => `MCSM_STRICT_APP_MARKER_${name}`;
const ROBOTS_MARKER = "MCSM_STRICT_ROBOTS_MARKER_panel";

const cookies = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[strict]", ...a);
const err = (...a) => console.error("[strict][ERROR]", ...a);
function assert(cond, msg) {
  if (!cond) {
    err("ASSERT FAILED:", msg);
    process.exitCode = 1;
    throw new Error("assert: " + msg);
  } else log("  ok:", msg);
}

// ---- process / port ----
function spawnProc(name, cmd, args, cwd) {
  const logPath = path.join(outRoot, `strict-${name}.log`);
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
      s.once("connect", () => { s.destroy(); resolve(); });
      s.once("error", () => { s.destroy(); if (Date.now() - start > timeout) reject(new Error(`port ${port} not up`)); else setTimeout(tryConn, 400); });
      s.once("timeout", () => { s.destroy(); if (Date.now() - start > timeout) reject(new Error(`port ${port} not up`)); else setTimeout(tryConn, 400); });
      s.connect(port, host);
    };
    tryConn();
  });
}
let procServer, procDaemon, procPanel;
function cleanup() {
  killChild(procServer); killChild(procDaemon); killChild(procPanel);
  killPattern("production-code/daemon/app.js");
  killPattern("production-code/web/app.js");
  killPattern("update-test-server.mjs");
  [9999, 23333, 24444].forEach(killPort);
  [9999, 23333, 24444].forEach(killPort);
  try { restorePristine(); } catch {}
}

// ---- HTTP ----
function recordCookies(h) {
  const sc = h.getSetCookie?.() || (h.get("set-cookie") ? [h.get("set-cookie")] : []);
  for (const c of sc) { const eq = c.indexOf("="); if (eq < 0) continue; cookies[c.slice(0, eq)] = c.slice(eq + 1).split(";")[0]; }
}
function cookieHeader() { return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "); }
async function httpReq(method, urlPath, body, token) {
  const opt = { method, headers: {} };
  if (cookieHeader()) opt.headers.cookie = cookieHeader();
  opt.headers["x-requested-with"] = "XMLHttpRequest";
  if (body !== undefined) { opt.headers["content-type"] = "application/json"; opt.body = JSON.stringify(body); }
  let u = urlPath;
  if (token) u += (urlPath.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
  const res = await fetch(PANEL + u, opt);
  recordCookies(res.headers);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  let payload = data;
  if (data && typeof data === "object" && !Array.isArray(data) && "status" in data && "data" in data && "time" in data) payload = data.data;
  return { status: res.status, data: payload, raw: data };
}
async function pollUntil(label, fn, timeoutMs, intervalMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { if (await fn()) return true; } catch {}
    await sleep(intervalMs);
  }
  err(`poll timeout: ${label}`); return false;
}

async function panelUp() {
  try { const r = await fetch(PANEL + "/api/auth/status"); return r.ok; } catch { return false; }
}

// Poll until the panel has an available daemon and return its uuid (used both by
// the "unconfigured" scenario and the daemon happy-path scenario).
async function waitDaemonUuid(token) {
  const ok = await pollUntil("panel<->daemon connected", async () => {
    const r = await httpReq("GET", "/api/service/remote_services_list", undefined, token);
    return r.status === 200 && Array.isArray(r.data) && r.data.some((n) => n.available);
  }, 60000, 2000);
  if (!ok) return undefined;
  const r = await httpReq("GET", "/api/service/remote_services_list", undefined, token);
  return r.data[0]?.uuid;
}

function restoreBaseline() {
  fs.copyFileSync(path.join(repo, "daemon", "package.json"), path.join(daemonDir, "package.json"));
  fs.copyFileSync(path.join(repo, "panel", "package.json"), path.join(webDir, "package.json"));
}

// Unlike the basic harness, this one ships a MODIFIED app.js (content marker),
// so a successful run permanently changes production-code unless we restore it.
// Snapshot the pristine build once, then restore it before every run and after
// cleanup so the strict harness is idempotent and leaves production-code as it
// found it (this was previously a latent bug: a second run failed scenario A).
const PRISTINE_DIR = path.join(outRoot, "strict-pristine");
const PRISTINE_FILES = [
  ["web", "app.js"],
  ["daemon", "app.js"],
  ["web", path.join("public", "robots.txt")]
];
function preparePristine() {
  if (fs.existsSync(path.join(PRISTINE_DIR, ".ready"))) return;
  fs.rmSync(PRISTINE_DIR, { recursive: true, force: true });
  for (const [side, rel] of PRISTINE_FILES) {
    const src = path.join(prod, side, rel);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(PRISTINE_DIR, side, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(PRISTINE_DIR, ".ready"), "1");
}
function restorePristine() {
  for (const [side, rel] of PRISTINE_FILES) {
    const src = path.join(PRISTINE_DIR, side, rel);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(prod, side, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  // Remove files the strict update introduces/overwrites on top of the build.
  for (const f of [
    path.join(webDir, "OVERLAY_MARKER.txt"),
    path.join(daemonDir, "OVERLAY_MARKER.txt"),
    path.join(webDir, "public", "UPDATE_ASSET.txt")
  ]) {
    fs.rmSync(f, { force: true });
  }
  restoreBaseline();
}

// ---- build strict packages ----
function bumpPkg(src, ver) { const p = JSON.parse(fs.readFileSync(src, "utf-8")); p.version = ver; return p; }
function zipit(zipPath, entries, cwd) {
  makeZip(zipPath, entries, cwd);
}
function buildPackages() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // helpers
  const tmp = (n) => { const d = path.join(outDir, "__stage_" + n); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); return d; };

  // daemon.zip: real app.js + UNIQUE content marker + bumped package.json + OVERLAY_MARKER
  {
    const d = tmp("daemon");
    const appSrc = fs.readFileSync(path.join(daemonDir, "app.js"));
    fs.writeFileSync(path.join(d, "app.js"), appSrc + `\n// ${APP_MARKER("daemon")}\n`);
    fs.writeFileSync(path.join(d, "package.json"), JSON.stringify(bumpPkg(path.join(daemonDir, "package.json"), NEW_DAEMON), null, 2));
    fs.writeFileSync(path.join(d, "OVERLAY_MARKER.txt"), `overlay marker daemon\n`);
    zipit(path.join(outDir, "daemon.zip"), ["app.js", "package.json", "OVERLAY_MARKER.txt"], d);
  }
  // web.zip: real app.js + UNIQUE marker + bumped package.json + public/ with a NEW file + an OVERWRITTEN robots.txt
  {
    const d = tmp("web");
    const appSrc = fs.readFileSync(path.join(webDir, "app.js"));
    fs.writeFileSync(path.join(d, "app.js"), appSrc + `\n// ${APP_MARKER("web")}\n`);
    fs.writeFileSync(path.join(d, "package.json"), JSON.stringify(bumpPkg(path.join(webDir, "package.json"), NEW_WEB), null, 2));
    fs.writeFileSync(path.join(d, "OVERLAY_MARKER.txt"), `overlay marker web\n`);
    fs.cpSync(path.join(webDir, "public"), path.join(d, "public"), { recursive: true });
    fs.writeFileSync(path.join(d, "public", "UPDATE_ASSET.txt"), `strict new public asset\n`);    // NEW file
    fs.writeFileSync(path.join(d, "public", "robots.txt"), `${ROBOTS_MARKER}\n`);                  // OVERWRITE existing file
    zipit(path.join(outDir, "web.zip"), ["app.js", "package.json", "OVERLAY_MARKER.txt", "public"], d);
  }
  // noapp.zip: a package WITHOUT app.js (only package.json + marker). It must be
  // rejected by applyUpgradePackage's requiredFiles validity gate before any
  // overlay happens (no app.js, no marker, no version change in the install dir).
  {
    const d = tmp("noapp");
    fs.writeFileSync(path.join(d, "package.json"), JSON.stringify(bumpPkg(path.join(webDir, "package.json"), NOAPP_WEB), null, 2));
    fs.writeFileSync(path.join(d, "OVERLAY_MARKER.txt"), `must never be overlaid (package has no app.js)\n`);
    zipit(path.join(outDir, "noapp.zip"), ["package.json", "OVERLAY_MARKER.txt"], d);
    fs.writeFileSync(
      path.join(outDir, "manifest-noapp.json"),
      JSON.stringify({ daemon: { version: NOAPP_WEB, url: `http://localhost:${PORT}/strict/noapp.zip` }, web: { version: NOAPP_WEB, url: `http://localhost:${PORT}/strict/noapp.zip` } }, null, 2)
    );
  }
  // manifest-strict.json
  fs.writeFileSync(
    path.join(outDir, "manifest-strict.json"),
    JSON.stringify({ daemon: { version: NEW_DAEMON, url: `http://localhost:${PORT}/strict/daemon.zip` }, web: { version: NEW_WEB, url: `http://localhost:${PORT}/strict/web.zip` } }, null, 2)
  );
  // manifest-same.json (web version == current baseline -> "already latest")
  fs.writeFileSync(
    path.join(outDir, "manifest-same.json"),
    JSON.stringify({ daemon: { version: BASE_DAEMON, url: `http://localhost:${PORT}/strict/daemon.zip` }, web: { version: BASE_WEB, url: `http://localhost:${PORT}/strict/web.zip` } }, null, 2)
  );
  // malicious.zip with a "../" entry (Zip-Slip). Store app.js so package-root is valid, plus ../escape.txt.
  let slipSupported = true;
  {
    const d = tmp("slip");
    fs.copyFileSync(path.join(webDir, "app.js"), path.join(d, "app.js"));
    // put escape.txt in the PARENT dir so the stored entry name is "../escape.txt"
    fs.writeFileSync(path.join(outDir, "escape.txt"), "should not be written outside\n");
    try {
      // cwd = d; archive includes "../escape.txt" (parent) and "app.js"
      makeZip(path.join(outDir, "malicious.zip"), ["../escape.txt", "app.js"], d);
    } catch (e) {
      slipSupported = false;
    }
    // verify the zip actually contains a "../" entry; some zip builds normalise it away
    if (slipSupported) {
      try {
        const listing = listZip(path.join(outDir, "malicious.zip"));
        if (!/\.\.\/escape\.txt/.test(listing)) slipSupported = false;
      } catch { slipSupported = false; }
    }
    fs.rmSync(path.join(outDir, "escape.txt"), { force: true });
  }
  if (slipSupported) {
    fs.writeFileSync(
      path.join(outDir, "manifest-slip.json"),
      JSON.stringify({ daemon: { version: SLIP_WEB, url: `http://localhost:${PORT}/strict/malicious.zip` }, web: { version: SLIP_WEB, url: `http://localhost:${PORT}/strict/malicious.zip` } }, null, 2)
    );
  } else {
    log("  (zip-slip test disabled: local zip tool normalised the ../  entry; guarding code remains, just not exercised here)");
  }
  log("strict packages built in " + outDir);
  return { slipSupported };
}

// ---- main ----
async function main() {
  ["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => { cleanup(); process.exit(128); }));

  log("step 0: kill stale + reset data + restore pristine build");
  [9999, 23333, 24444].forEach(killPort);
  fs.rmSync(path.join(daemonDir, "data"), { recursive: true, force: true });
  fs.rmSync(path.join(webDir, "data"), { recursive: true, force: true });
  fs.rmSync(path.join(daemonDir, "__upgrade_staging"), { recursive: true, force: true });
  fs.rmSync(path.join(webDir, "__upgrade_staging"), { recursive: true, force: true });
  preparePristine();
  restorePristine();

  log("step 1: build strict packages");
  const { slipSupported } = buildPackages();

  log("step 2: start update server + daemon + panel");
  procServer = spawnProc("server", "node", ["scripts/update-test-server.mjs"], repo);
  await waitForPort(9999);
  procDaemon = spawnProc("daemon", process.execPath, ["app.js"], daemonDir);
  await waitForPort(24444);
  procPanel = spawnProc("panel", process.execPath, ["app.js"], webDir);
  await waitForPort(23333);

  let token;
  log("step 3: install + login");
  {
    const install = await httpReq("POST", "/api/auth/install", { username: ADMIN_USER, password: ADMIN_PASS });
    assert(install.status === 200 && install.data === true, "install admin ok");
    await httpReq("GET", "/api/auth/logout");
    const login = await httpReq("POST", "/api/auth/login", { username: ADMIN_USER, password: ADMIN_PASS });
    assert(login.status === 200 && typeof login.data === "string" && login.data !== "Logined", "login returns real token");
    token = login.data;
  }
  const setSource = async (manifestFile) => {
    const g = await httpReq("GET", "/api/overview/setting", undefined, token);
    const merged = { ...(typeof g.data === "string" ? {} : g.data || {}) };
    merged.updateSourceUrl = `http://localhost:${PORT}/strict/${manifestFile}`;
    merged.allowAutoUpdate = true;
    const r = await httpReq("PUT", "/api/overview/setting", merged, token);
    assert(r.status === 200 || r.status === 204, `set source -> ${manifestFile}`);
  };
  const baselineAppHasMarker = (dir, name) =>
    fs.readFileSync(path.join(dir, "app.js"), "utf-8").includes(APP_MARKER(name));

  // ----- SCENARIO 0: no update source configured (no mutation) -----
  log("\n== SCENARIO 0: no update source configured ==");
  {
    const info = await httpReq("GET", "/api/upgrade/panel_info", undefined, token);
    assert(info.data?.configured === false, "panel_info: configured=false when no source");
    assert(info.data?.updateAvailable === false, "panel_info: no update when no source");
    const du = await waitDaemonUuid(token);
    assert(!!du, "panel connected to daemon (for daemon_info)");
    if (du) {
      const di = await httpReq("GET", "/api/upgrade/daemon_info?uuid=" + du, undefined, token);
      assert(di.data?.configured === false, "daemon_info: configured=false when no source forwarded");
      assert(di.data?.updateAvailable === false, "daemon_info: no update when no source forwarded");
    }
  }

  // ----- SCENARIO A: already latest (no mutation) -----
  log("\n== SCENARIO A: already latest (onlineVersion == current) ==");
  await setSource("manifest-same.json");
  {
    const info = await httpReq("GET", "/api/upgrade/panel_info", undefined, token);
    assert(info.data?.updateAvailable === false, "panel_info: no update available when versions match");
    const r = await httpReq("POST", "/api/upgrade/panel", undefined, token);
    assert(r.status === 200, "already-latest: 200");
    log("  result:", JSON.stringify(r.data));
    assert(r.data?.started === false, "already-latest: started=false");
    assert(/up to date/i.test(String(r.data?.message || "")), "already-latest: message mentions 'up to date'");
    assert(await panelUp(), "panel stayed up (no restart)");
    assert(JSON.parse(fs.readFileSync(path.join(webDir, "package.json"), "utf-8")).version === BASE_WEB, "panel still baseline version");
    assert(!baselineAppHasMarker(webDir, "web"), "panel app.js untouched (no content marker)");
  }

  // ----- SCENARIO B: zip-slip malicious package (rejected, no corruption) -----
  if (slipSupported) {
    log("\n== SCENARIO B: zip-slip malicious package ==");
    await setSource("manifest-slip.json");
    {
      const info = await httpReq("GET", "/api/upgrade/panel_info", undefined, token);
      assert(info.data?.updateAvailable === true && info.data?.onlineVersion === SLIP_WEB, "slip manifest: update available " + SLIP_WEB);
      const r = await httpReq("POST", "/api/upgrade/panel", undefined, token);
      assert(r.status === 500, "slip: endpoint returns 500 (aborted)");
      log("  error body:", JSON.stringify(r.data));
      // node-stream-zip's built-in guard reports "Malicious entry: ..."; our
      // extractZip reports "Zip-slip detected...". Either means the malicious
      // package was rejected.
      assert(/zip-slip|malicious/i.test(String((r.data && (r.data.message || r.data)) || "")), "slip: error mentions zip-slip/malicious");
      assert(await panelUp(), "slip: panel stayed up (no restart)");
      assert(JSON.parse(fs.readFileSync(path.join(webDir, "package.json"), "utf-8")).version === BASE_WEB, "slip: panel version still baseline");
      assert(!baselineAppHasMarker(webDir, "web"), "slip: panel app.js untouched (no content marker)");
      assert(!fs.existsSync(path.join(path.dirname(webDir), "escape.txt")), "slip: traversal file NOT written outside install dir");
    }
  }

  // ----- SCENARIO B2: package missing app.js (validity gate, no corruption) -----
  log("\n== SCENARIO B2: package missing app.js (requiredFiles gate) ==");
  await setSource("manifest-noapp.json");
  {
    const info = await httpReq("GET", "/api/upgrade/panel_info", undefined, token);
    assert(info.data?.updateAvailable === true && info.data?.onlineVersion === NOAPP_WEB, "noapp manifest: update available " + NOAPP_WEB);
    const r = await httpReq("POST", "/api/upgrade/panel", undefined, token);
    assert(r.status === 500, "noapp: endpoint returns 500 (rejected)");
    log("  error body:", JSON.stringify(r.data));
    assert(/required file not found|app\.js/i.test(String(r.data?.message || r.data)), "noapp: error mentions missing app.js");
    assert(await panelUp(), "noapp: panel stayed up (no restart)");
    assert(JSON.parse(fs.readFileSync(path.join(webDir, "package.json"), "utf-8")).version === BASE_WEB, "noapp: panel version still baseline");
    assert(!baselineAppHasMarker(webDir, "web"), "noapp: panel app.js untouched (no content marker)");
    assert(!fs.existsSync(path.join(webDir, "OVERLAY_MARKER.txt")), "noapp: rejected BEFORE any overlay (no marker written)");
  }

  // ----- SCENARIO B3: auto-update disabled (guarded, no mutation) -----
  log("\n== SCENARIO B3: auto-update disabled ==");
  {
    const g = await httpReq("GET", "/api/overview/setting", undefined, token);
    const merged = { ...(typeof g.data === "string" ? {} : g.data || {}) };
    merged.updateSourceUrl = `http://localhost:${PORT}/strict/manifest-strict.json`;
    merged.allowAutoUpdate = false;
    const put = await httpReq("PUT", "/api/overview/setting", merged, token);
    assert(put.status === 200 || put.status === 204, "disabled: settings saved");
    const r = await httpReq("POST", "/api/upgrade/panel", undefined, token);
    assert(r.status === 200, "disabled: 200");
    log("  result:", JSON.stringify(r.data));
    assert(r.data?.started === false, "disabled: started=false");
    assert(/disabled/i.test(String(r.data?.message || "")), "disabled: message mentions disabled");
    assert(await panelUp(), "disabled: panel stayed up (no restart)");
    assert(JSON.parse(fs.readFileSync(path.join(webDir, "package.json"), "utf-8")).version === BASE_WEB, "disabled: panel version still baseline");
    assert(!fs.existsSync(path.join(webDir, "OVERLAY_MARKER.txt")), "disabled: no overlay performed");
  }

  // ----- SCENARIO C: panel happy content-update (REAL content replaced) -----
  log("\n== SCENARIO C: panel happy update — actual on-disk content must change ==");
  await setSource("manifest-strict.json");
  {
    const info = await httpReq("GET", "/api/upgrade/panel_info", undefined, token);
    assert(info.data?.updateAvailable === true && info.data?.onlineVersion === NEW_WEB, "strict manifest: update available " + NEW_WEB);
    const r = await httpReq("POST", "/api/upgrade/panel", undefined, token);
    assert(r.status === 200 && r.data?.started === true, "strict panel: update started");
  }
  await sleep(3000);
  await pollUntil("panel http back", panelUp, 60000, 2000);
  // re-login (session store is in-memory; lost on restart)
  {
    const login = await httpReq("POST", "/api/auth/login", { username: ADMIN_USER, password: ADMIN_PASS });
    assert(login.status === 200 && typeof login.data === "string", "re-login after strict panel update");
    token = login.data;
  }
  {
    const pkg = JSON.parse(fs.readFileSync(path.join(webDir, "package.json"), "utf-8"));
    assert(pkg.version === NEW_WEB, "panel package.json -> " + NEW_WEB);
    const appContent = fs.readFileSync(path.join(webDir, "app.js"), "utf-8");
    assert(appContent.includes(APP_MARKER("web")), "panel app.js CONTENT replaced (unique marker present in shipped bundle)");
    assert(fs.existsSync(path.join(webDir, "OVERLAY_MARKER.txt")), "panel OVERLAY_MARKER.txt overlaid");
    assert(fs.existsSync(path.join(webDir, "public", "UPDATE_ASSET.txt")), "panel NEW public file overlaid (UPDATE_ASSET.txt)");
    const robots = fs.readFileSync(path.join(webDir, "public", "robots.txt"), "utf-8");
    assert(robots.includes(ROBOTS_MARKER), "panel EXISTING public file OVERWRITTEN (robots.txt has new content)");
    const info = await httpReq("GET", "/api/upgrade/panel_info", undefined, token);
    assert(info.data?.currentVersion === NEW_WEB, "panel now reports " + NEW_WEB);
  }

  // ----- SCENARIO D: daemon happy content-update (forwarded) -----
  log("\n== SCENARIO D: daemon happy update (panel forwards source) ==");
  let daemonUuid = await waitDaemonUuid(token);
  assert(!!daemonUuid, "panel connected to daemon");
  {
    const info = await httpReq("GET", "/api/upgrade/daemon_info?uuid=" + daemonUuid, undefined, token);
    assert(info.data?.configured === true && info.data?.updateAvailable === true && info.data?.onlineVersion === NEW_DAEMON, "daemon update available via forwarded URL");
    const r = await httpReq("POST", "/api/upgrade/daemon?uuid=" + daemonUuid, undefined, token);
    assert(r.status === 200 && r.data?.started === true && r.data?.onlineVersion === NEW_DAEMON, "daemon update started");
  }
  await sleep(3000);
  const recon = await pollUntil("daemon reconnect v" + NEW_DAEMON, async () => {
    const r = await httpReq("GET", "/api/overview", undefined, token);
    if (r.status !== 200 || !Array.isArray(r.data?.remote)) return false;
    const n = r.data.remote.find((x) => x?.uuid === daemonUuid);
    return !!n && n.available === true && n.version === NEW_DAEMON;
  }, 90000, 2000);
  assert(recon, "daemon came back online at " + NEW_DAEMON);
  {
    const pkg = JSON.parse(fs.readFileSync(path.join(daemonDir, "package.json"), "utf-8"));
    assert(pkg.version === NEW_DAEMON, "daemon package.json -> " + NEW_DAEMON);
    const appContent = fs.readFileSync(path.join(daemonDir, "app.js"), "utf-8");
    assert(appContent.includes(APP_MARKER("daemon")), "daemon app.js CONTENT replaced (unique marker present)");
    assert(fs.existsSync(path.join(daemonDir, "OVERLAY_MARKER.txt")), "daemon OVERLAY_MARKER.txt overlaid");
  }

  log("\n================ STRICT RESULT ================");
  log("0 no source configured: configured=false, no update                   OK");
  log("A already-latest      : no restart, 'up to date', files untouched     OK");
  if (slipSupported) log("B zip-slip            : rejected, service up, no traversal written      OK");
  else log("B zip-slip            : SKIPPED (local zip tool normalised ../ entry)");
  log("B2 missing app.js     : requiredFiles gate rejects, no overlay        OK");
  log("B3 update disabled    : guarded, no restart, no overlay               OK");
  log("C panel content-update: app.js marker + new+overwritten public + ver  OK");
  log("D daemon content-update: app.js marker + version + overlay marker     OK");
  log("==============================================");
  cleanup();
  process.exit(process.exitCode || 0);
}

process.on("exit", () => { try { cleanup(); } catch {} });
main().catch((e) => { err("verification failed:", e?.stack || e); cleanup(); process.exit(1); });
