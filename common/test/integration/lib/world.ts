import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Shared singleton state for the whole integration run.
// IMPORTANT: vitest 0.33 with `isolate:false` + singleFork does NOT share the
// module registry across test FILES — each file gets a fresh `world`. So all
// accumulated state (instance uuid, user uuids/cookies/tokens) is persisted to
// RUNTIME_FILE and re-read on every import; mutations call saveState().

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RUNTIME_FILE = path.join(HERE, "..", ".runtime.json");
// HERE = common/test/integration/lib, so ../../../.. = repo root.
export const REPO = path.resolve(HERE, "../../../..");

export interface WorldUser {
  name: string;
  pass: string;
  uuid?: string;
  cookie?: string;
  token?: string;
}

export interface Finding {
  id: string;
  step: string;
  severity: "info" | "warn" | "vuln";
  title: string;
  detail: string;
  evidence?: string;
}

export interface WorldInstance {
  uuid?: string;
  name: string;
  preset?: { title: string; description: string; targetLink: string; setupInfo: any };
}

export interface World {
  key: string;
  panelUrl: string;
  daemonHttpUrl: string;
  daemonId: string;
  workDir: string;
  panelPid?: number;
  daemonPid?: number;
  admin: WorldUser;
  u1: WorldUser;
  u2: WorldUser;
  instance: WorldInstance;
  zipPath?: string;
  findings: Finding[];
}

function readRuntime(): Partial<World> {
  try {
    const raw = fs.readFileSync(RUNTIME_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const rt = readRuntime() as any;

export const world: World = {
  key: rt.key || "",
  panelUrl: rt.panelUrl || "http://127.0.0.1:23333",
  daemonHttpUrl: rt.daemonHttpUrl || "http://127.0.0.1:24444",
  daemonId: rt.daemonId || "",
  workDir: rt.workDir || "",
  panelPid: rt.panelPid,
  daemonPid: rt.daemonPid,
  admin: rt.admin || { name: "test_admin", pass: "Www.123456" },
  u1: rt.u1 || { name: "test_user1", pass: "User.123456" },
  u2: rt.u2 || { name: "test_user2", pass: "User.123456" },
  instance: rt.instance || { name: "mcsm-it-mc" },
  zipPath: rt.zipPath,
  findings: [] // findings are in-process only (not persisted)
};

export function addFinding(f: Finding) {
  if (world.findings.some((x) => x.id === f.id)) return;
  world.findings.push(f);
  // Persist IMMEDIATELY: test files run in a forked worker with their own
  // `world` singleton, while stopRuntime()/writeFindings() runs in the MAIN
  // process - in-memory findings would otherwise vanish with the worker and
  // the main process would merge an empty list.
  try {
    let all: Finding[] = [];
    try {
      all = JSON.parse(fs.readFileSync(FINDINGS_JSON, "utf-8"));
    } catch {
      all = [];
    }
    if (!all.some((x) => x.id === f.id)) {
      all.push(f);
      fs.writeFileSync(FINDINGS_JSON, JSON.stringify(all, null, 2));
    }
  } catch {
    /* best effort */
  }
}

const FINDINGS_JSON = path.join(HERE, "..", "FINDINGS.json");
const FINDINGS_HTML = path.join(HERE, "..", "FINDINGS.html");

// Regenerate FINDINGS.html from the persisted FINDINGS.json (plus anything the
// current process holds). Called from stopRuntime() on every suite teardown;
// safe to call from a test file's afterAll as well.
export function writeFindings() {
  let all: Finding[] = [];
  try {
    all = JSON.parse(fs.readFileSync(FINDINGS_JSON, "utf-8"));
  } catch {
    all = [];
  }
  for (const f of world.findings) {
    if (!all.some((x) => x.id === f.id)) all.push(f);
  }
  if (!all.length) return;
  try {
    fs.writeFileSync(FINDINGS_JSON, JSON.stringify(all, null, 2));
    const esc = (s: string) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const rows = all
      .map(
        (f) =>
          `<tr><td>${esc(f.id)}</td><td>${esc(f.step)}</td><td>${esc(f.severity)}</td><td>${esc(
            f.title
          )}</td><td><pre>${esc(f.detail)}</pre></td><td><pre>${esc(f.evidence ?? "")}</pre></td></tr>`
      )
      .join("\n");
    fs.writeFileSync(
      FINDINGS_HTML,
      `<!doctype html><meta charset="utf-8"><title>Integration findings</title>
<style>body{font:14px/1.5 sans-serif;margin:24px}td,th{border:1px solid #ccc;padding:6px;vertical-align:top}pre{white-space:pre-wrap;margin:0}</style>
<h1>Integration findings (${all.length})</h1>
<table><thead><tr><th>id</th><th>step</th><th>severity</th><th>title</th><th>detail</th><th>evidence</th></tr></thead>
<tbody>
${rows}
</tbody></table>`
    );
    // Visibility: the summary must never be silent about what was recorded.
    console.log(`[findings] ${all.length} total -> ${FINDINGS_HTML}`);
  } catch (e) {
    console.warn(`[findings] write failed: ${e}`);
  }
}

// Persist accumulated state so subsequent test files (fresh module loads) see it.
export function saveState() {
  try {
    const persisted = {
      key: world.key,
      panelUrl: world.panelUrl,
      daemonHttpUrl: world.daemonHttpUrl,
      daemonId: world.daemonId,
      workDir: world.workDir,
      panelPid: world.panelPid,
      daemonPid: world.daemonPid,
      admin: world.admin,
      u1: world.u1,
      u2: world.u2,
      instance: world.instance,
      zipPath: world.zipPath
    };
    fs.writeFileSync(RUNTIME_FILE, JSON.stringify(persisted, null, 2));
  } catch {
    /* best effort */
  }
}

// Re-read RUNTIME_FILE into the (in-memory) world. vitest imports every test
// file at COLLECTION time (before any test runs), so each file's `world` is
// frozen at that moment (connection-only). Tests must call loadState() before
// using cross-file state so they pick up prior files' saveState() writes.
export function loadState() {
  try {
    const rt = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf-8"));
    if (rt.key) world.key = rt.key;
    if (rt.panelUrl) world.panelUrl = rt.panelUrl;
    if (rt.daemonHttpUrl) world.daemonHttpUrl = rt.daemonHttpUrl;
    if (rt.daemonId) world.daemonId = rt.daemonId;
    if (rt.workDir) world.workDir = rt.workDir;
    if (rt.panelPid) world.panelPid = rt.panelPid;
    if (rt.daemonPid) world.daemonPid = rt.daemonPid;
    if (rt.admin) world.admin = rt.admin;
    if (rt.u1) world.u1 = rt.u1;
    if (rt.u2) world.u2 = rt.u2;
    if (rt.instance) world.instance = rt.instance;
    if (rt.zipPath) world.zipPath = rt.zipPath;
  } catch {
    /* not yet available */
  }
}
