import fs from "node:fs";
import { copySync } from "fs-extra";
import path from "node:path";
import os from "node:os";
import { spawn, type ChildProcess } from "node:child_process";
import { world, REPO, RUNTIME_FILE } from "./world";
import { panelCall } from "./http";
import { sleep, waitFor } from "./util";

export interface Runtime {
  key: string;
  panelUrl: string;
  daemonHttpUrl: string;
  daemonId: string;
  workDir: string;
  daemonProc?: ChildProcess;
  panelProc?: ChildProcess;
}

function tee(proc: ChildProcess, logPath: string) {
  const write = (chunk: Buffer) => fs.appendFileSync(logPath, chunk);
  proc.stdout?.on("data", write);
  proc.stderr?.on("data", write);
}

// Boot a real daemon + panel in an isolated tmp workspace.
// daemon first; after 5s panel with --unsafe-integration-test-mode=<key>.
// lib binaries + market_cache are copied because all data/lib paths are
// process.cwd()-relative in MCSManager.
export async function startAll(): Promise<Runtime> {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-it-"));
  const daemonDir = path.join(workDir, "daemon");
  const panelDir = path.join(workDir, "panel");
  fs.mkdirSync(path.join(daemonDir, "lib"), { recursive: true });
  fs.mkdirSync(path.join(panelDir, "data"), { recursive: true });

  // Copy daemon native binaries (file_zip / pty) — cwd-relative at runtime.
  copySync(path.join(REPO, "daemon/lib"), path.join(daemonDir, "lib"));
  // Copy cached market list so quick_install_list works offline.
  const mc = path.join(REPO, "panel/data/market_cache.json");
  if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(panelDir, "data", "market_cache.json"));

  const key = "mcsm-it-" + Math.random().toString(36).slice(2, 14);
  const panelUrl = "http://127.0.0.1:23333";
  const daemonHttpUrl = "http://127.0.0.1:24444";

  const daemonApp = path.join(REPO, "daemon/production/app.js");
  const panelApp = path.join(REPO, "panel/production/app.js");

  // 1) start daemon (detached => own process group for clean group-kill)
  const daemonProc = spawn(process.execPath, [daemonApp], {
    cwd: daemonDir,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true
  });
  tee(daemonProc, path.join(workDir, "daemon.log"));
  daemonProc.on("exit", (code) => fs.appendFileSync(path.join(workDir, "daemon.log"), `\n[daemon exit ${code}]\n`));

  // daemon writes data/Config/global.json on first boot
  await waitFor(
    () => fs.existsSync(path.join(daemonDir, "data/Config/global.json")),
    { timeout: 20000, msg: "daemon global.json" }
  );

  // user-required 5s gap
  await sleep(5000);

  // 2) start panel with the integration-test flag
  const panelProc = spawn(process.execPath, [panelApp, `--unsafe-integration-test-mode=${key}`], {
    cwd: panelDir,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true
  });
  tee(panelProc, path.join(workDir, "panel.log"));
  panelProc.on("exit", (code) => fs.appendFileSync(path.join(workDir, "panel.log"), `\n[panel exit ${code}]\n`));

  // 3) wait for panel readiness via the test key
  await waitFor(
    async () => {
      try {
        const r = await panelCall({ method: "GET", path: "/auth/status", key, timeout: 5000 });
        return r.httpStatus === 200;
      } catch {
        return false;
      }
    },
    { timeout: 40000, msg: "panel ready (key)" }
  );

  // 4) discover the local daemon id (NodeStatus[].uuid)
  let daemonId = "";
  await waitFor(
    async () => {
      const r = await panelCall({ method: "GET", path: "/service/remote_services_list", key, timeout: 8000 });
      const list: any = r.data;
      const arr = Array.isArray(list) ? list : Array.isArray((list as any)?.data) ? (list as any).data : [];
      if (arr.length > 0) {
        daemonId = arr[0].uuid;
        return true;
      }
      return false;
    },
    { timeout: 30000, msg: "remote_services_list" }
  );

  // Enable allowUsePreset so normal users can use quick_install_list and
  // reinstall (install_instance) — required for steps 3/13 as a normal user.
  // (install_instance forwards role=ADMIN hardcoded, so a normal user CAN
  //  reinstall once the panel-level allowUsePreset gate is open.)
  try {
    await panelCall({ method: "PUT", path: "/overview/setting", key, body: { allowUsePreset: true }, timeout: 8000 });
  } catch {
    /* best effort */
  }

  const rt: Runtime = { key, panelUrl, daemonHttpUrl, daemonId, workDir, daemonProc, panelProc };
  // Publish to world singleton (same process) + runtime file (test files).
  world.key = key;
  world.panelUrl = panelUrl;
  world.daemonHttpUrl = daemonHttpUrl;
  world.daemonId = daemonId;
  world.workDir = workDir;
  world.panelPid = panelProc.pid;
  world.daemonPid = daemonProc.pid;
  fs.writeFileSync(
    RUNTIME_FILE,
    JSON.stringify({ key, panelUrl, daemonHttpUrl, daemonId, workDir, panelPid: panelProc.pid, daemonPid: daemonProc.pid }, null, 2)
  );
  console.log(`\n[bootstrap] workDir=${workDir} daemonId=${daemonId} key=${key}`);
  return rt;
}

// Best-effort cleanup of users/instances created during the run, then kill procs.
export async function stopAll(rt: Runtime) {
  // Best-effort: delete test instance(s) + test users using the key.
  try {
    if (rt.daemonId && world.instance.uuid) {
      await panelCall({
        method: "DELETE",
        path: "/instance",
        key: rt.key,
        query: { daemonId: rt.daemonId },
        body: { uuids: [world.instance.uuid], deleteFile: true }
      });
    }
    const uuids = [world.admin, world.u1, world.u2].map((u) => u.uuid).filter(Boolean) as string[];
    if (uuids.length) {
      await panelCall({ method: "DELETE", path: "/auth", key: rt.key, body: uuids });
    }
  } catch {
    /* best effort */
  }
  for (const p of [rt.panelProc, rt.daemonProc]) {
    try {
      if (p && p.exitCode === null) {
        process.kill(-p.pid!, "SIGTERM");
      }
    } catch {
      try {
        p?.kill("SIGTERM");
      } catch {
        /* noop */
      }
    }
  }
  await sleep(1500);
  for (const p of [rt.panelProc, rt.daemonProc]) {
    try {
      if (p && p.exitCode === null) p.kill("SIGKILL");
    } catch {
      /* noop */
    }
  }
  // Preserve the last run's logs to a stable location (workDir is removed below)
  // so post-mortem debugging is possible after a failed run.
  try {
    const lastRun = path.join(path.dirname(RUNTIME_FILE), ".last-run");
    fs.mkdirSync(lastRun, { recursive: true });
    for (const name of ["daemon.log", "panel.log"]) {
      const src = path.join(rt.workDir, name);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(lastRun, name));
    }
    fs.writeFileSync(
      path.join(lastRun, "info.json"),
      JSON.stringify({ workDir: rt.workDir, daemonId: rt.daemonId, key: rt.key }, null, 2)
    );
  } catch {
    /* noop */
  }
  try {
    fs.rmSync(rt.workDir, { recursive: true, force: true });
  } catch {
    /* noop */
  }
  try {
    fs.unlinkSync(RUNTIME_FILE);
  } catch {
    /* noop */
  }
}
