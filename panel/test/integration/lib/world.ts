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
export const REPO = path.resolve(HERE, "../../../..");

export interface UserSession {
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

export interface World {
  key: string;
  panelUrl: string;
  daemonHttpUrl: string;
  daemonId: string;
  workDir: string;
  panelPid?: number;
  daemonPid?: number;
  admin: UserSession;
  u1: UserSession;
  u2: UserSession;
  instance: {
    uuid?: string;
    name: string;
    preset?: { title: string; description: string; targetLink: string; setupInfo: any };
  };
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
  if (!world.findings.some((x) => x.id === f.id)) world.findings.push(f);
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
