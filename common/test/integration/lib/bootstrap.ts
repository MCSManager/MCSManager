import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomBytes } from "node:crypto";
import { createServer, type AddressInfo } from "node:net";
import { type ChildProcess } from "node:child_process";
import { copySync } from "fs-extra";
import { world, saveState, writeFindings, REPO, RUNTIME_FILE } from "./world";
import { requestPanel } from "./http";
import { sleep } from "./util";
import { spawnApp, groupKill } from "./process";
import { retryOnPortConflict, waitForChildReady } from "./startup";

export interface Runtime {
  key: string;
  panelUrl: string;
  daemonHttpUrl: string;
  daemonId: string;
  workDir: string;
  daemonProc?: ChildProcess;
  panelProc?: ChildProcess;
}

async function testPorts(): Promise<number[]> {
  const servers = [createServer(), createServer()];
  try {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
          })
      )
    );
    return servers.map((server) => (server.address() as AddressInfo).port);
  } finally {
    await Promise.all(
      servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve())))
    );
  }
}

// Boot a real daemon + panel in an isolated tmp workspace.
// daemon first; after 5s panel with --unsafe-integration-test-mode=<key>.
// lib binaries + market_cache are copied because all data/lib paths are
// process.cwd()-relative in MCSManager. The panel auto-discovers the sibling
// daemon at ../daemon/data/Config/global.json, so the sibling-dir layout
// (workDir/{daemon,panel}) is load-bearing.
export async function bootRuntime(): Promise<Runtime> {
  return retryOnPortConflict(bootRuntimeAttempt);
}

async function bootRuntimeAttempt(): Promise<Runtime> {
  const [daemonPort, panelPort] = await testPorts();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-it-"));
  const daemonDir = path.join(workDir, "daemon");
  const panelDir = path.join(workDir, "panel");
  fs.mkdirSync(path.join(daemonDir, "lib"), { recursive: true });
  fs.mkdirSync(path.join(panelDir, "data"), { recursive: true });
  fs.mkdirSync(path.join(daemonDir, "data/Config"), { recursive: true });
  fs.mkdirSync(path.join(panelDir, "data/SystemConfig"), { recursive: true });
  fs.writeFileSync(
    path.join(daemonDir, "data/Config/global.json"),
    JSON.stringify({ port: daemonPort, ip: "127.0.0.1", key: randomBytes(32).toString("hex") }),
    { mode: 0o600 }
  );
  fs.writeFileSync(
    path.join(panelDir, "data/SystemConfig/config.json"),
    JSON.stringify({ httpPort: panelPort, httpIp: "127.0.0.1" }),
    { mode: 0o600 }
  );
  world.panelUrl = `http://127.0.0.1:${panelPort}`;
  world.daemonHttpUrl = `http://127.0.0.1:${daemonPort}`;

  // Copy daemon native binaries (file_zip / pty) — cwd-relative at runtime.
  copySync(path.join(REPO, "daemon/lib"), path.join(daemonDir, "lib"));
  // Copy cached market list so quick_install_list works offline.
  const mc = path.join(REPO, "panel/data/market_cache.json");
  if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(panelDir, "data", "market_cache.json"));

  world.workDir = workDir;

  // 1) start daemon (detached => own process group for clean group-kill)
  let daemonProc: ChildProcess | undefined;
  let panelProc: ChildProcess | undefined;
  try {
    daemonProc = spawnApp({
      app: path.join(REPO, "daemon/production/app.js"),
      cwd: daemonDir,
      logFile: path.join(workDir, "daemon.log")
    });

    // user-required 5s gap (panel needs the daemon socket stable before connecting)
    await sleep(5000);

    const key = "mcsm-it-" + Math.random().toString(36).slice(2, 14);
    world.key = key;
    const panelUrl = world.panelUrl;
    const daemonHttpUrl = world.daemonHttpUrl;

    // 2) start panel with the integration-test flag
    panelProc = spawnApp({
      app: path.join(REPO, "panel/production/app.js"),
      args: [`--unsafe-integration-test-mode=${key}`],
      cwd: panelDir,
      logFile: path.join(workDir, "panel.log")
    });

    // 3) wait for panel readiness via the test key
    const children = [
      { process: daemonProc, logFile: path.join(workDir, "daemon.log") },
      { process: panelProc, logFile: path.join(workDir, "panel.log") }
    ];
    await waitForChildReady(
      async () => {
        try {
          const r = await requestPanel({ method: "GET", path: "/auth/status", key, timeout: 1000 });
          return r.httpStatus === 200;
        } catch {
          return false;
        }
      },
      children,
      40000,
      "panel ready (/auth/status 200)"
    );

    // 4) discover the local daemon id (NodeStatus[].uuid)
    let daemonId = "";
    await waitForChildReady(
      async () => {
        const r = await requestPanel({
          method: "GET",
          path: "/service/remote_services_list",
          key,
          timeout: 1000
        });
        const list: any = r.data;
        const arr = Array.isArray(list)
          ? list
          : Array.isArray((list as any)?.data)
          ? (list as any).data
          : [];
        if (arr.length > 0) {
          daemonId = arr[0].uuid;
          return true;
        }
        return false;
      },
      children,
      30000,
      "remote_services_list"
    );

    // Enable allowUsePreset so normal users can use quick_install_list and
    // reinstall (install_instance) — required for steps 3/13 as a normal user.
    // (install_instance forwards role=ADMIN hardcoded, so a normal user CAN
    //  reinstall once the panel-level allowUsePreset gate is open.)
    try {
      await requestPanel({
        method: "PUT",
        path: "/overview/setting",
        key,
        body: { allowUsePreset: true },
        timeout: 8000
      });
    } catch {
      /* best effort */
    }

    const rt: Runtime = { key, panelUrl, daemonHttpUrl, daemonId, workDir, daemonProc, panelProc };
    // Publish to world singleton (same process) + runtime file (cross-file).
    world.panelUrl = panelUrl;
    world.daemonHttpUrl = daemonHttpUrl;
    world.daemonId = daemonId;
    world.panelPid = panelProc?.pid;
    world.daemonPid = daemonProc?.pid;
    saveState();
    console.log(`\n[bootstrap] workDir=${workDir} daemonId=${daemonId} key=${key}`);
    return rt;
  } catch (error) {
    await groupKill(panelProc ?? null);
    await groupKill(daemonProc ?? null);
    fs.rmSync(workDir, { recursive: true, force: true });
    throw error;
  }
}

// Best-effort cleanup of users/instances created during the run, then kill
// processes (group-kill: SIGTERM the PGID, 1.5s grace, SIGKILL survivors),
// copy logs to .last-run/, then remove the tmp workDir + runtime file.
export async function stopRuntime(rt: Runtime) {
  // Persist this suite's findings (in-process only otherwise) before teardown.
  writeFindings();
  // Best-effort: delete test instance(s) + test users using the key.
  try {
    if (rt.daemonId && world.instance.uuid) {
      await requestPanel({
        method: "DELETE",
        path: "/instance",
        key: rt.key,
        query: { daemonId: rt.daemonId },
        body: { uuids: [world.instance.uuid], deleteFile: true }
      });
    }
    const uuids = [world.admin, world.u1, world.u2].map((u) => u.uuid).filter(Boolean) as string[];
    if (uuids.length) {
      await requestPanel({ method: "DELETE", path: "/auth", key: rt.key, body: uuids });
    }
  } catch {
    /* best effort */
  }
  await groupKill(rt.panelProc ?? null);
  await groupKill(rt.daemonProc ?? null);
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
