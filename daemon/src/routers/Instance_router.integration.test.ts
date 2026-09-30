import { spawnSync } from "child_process";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Real (integration) tests for the instance lifecycle exercised through
 * `Instance_router.ts`. Unlike the unit test, the instance entity, the command
 * dispatcher, the docker/general start commands and the instance subsystem are
 * all REAL. This is what actually spawns containers / child processes.
 *
 * Three suites live here:
 *  - "Docker instance lifecycle (real)" — real `alpine:3.20` containers
 *    (Linux + reachable Docker daemon only, otherwise the cases return early);
 *  - "General (non-Docker) instance lifecycle (real)" — real `bash` + `ping`
 *    (POSIX only);
 *  - "General process instance interactive lifecycle (real)" — the interactive
 *    fixture `test/fixtures/test.mjs` started with the start command
 *    `node test.mjs`: creation via `instance/new`, startup output, real
 *    stdin/stdout command round-trips, graceful stop, force kill and restart
 *    (cross-platform, Windows included — only `node` on PATH is needed).
 *
 * Isolation: every persistent path (`StorageSubsystem.DATA_PATH`, the instance
 * data dir, logs, java data, …) is derived from `process.cwd()` at import time,
 * so we chdir into a throw-away temp dir BEFORE loading any of those modules.
 * The temp dir is removed in afterAll, leaving no trace in the repo.
 *
 * The only modules that are mocked are ones with import-time side effects
 * (persistent timers: logger, disk_limit_service, upload_manager) or heavy deps
 * that these tests never touch (mod/download/system_file/etc.). Everything on
 * the real instance/process/docker code path stays unmocked.
 */

vi.mock("../service/log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

vi.mock("../service/disk_limit_service", () => ({
  default: {
    checkDiskNow: async () => ({ isFull: false }),
    checkInstanceDiskSize: () => {}
  },
  convertBytesToGB: (v: number) => v,
  convertGBToBytes: (v: number) => v
}));

vi.mock("../service/upload_manager", () => ({ default: { getUploads: () => new Map() } }));
vi.mock("../service/download_manager", () => ({ default: { tasks: [], downloadingCount: 0 } }));
vi.mock("../service/mod_service", () => ({
  modService: {
    listMods: vi.fn(),
    toggleMod: vi.fn(),
    deleteMod: vi.fn(),
    installMod: vi.fn(),
    getModConfig: vi.fn()
  }
}));
vi.mock("../service/system_file", () => ({ default: class FileManager {} }));
vi.mock("../entity/commands/process_info", () => ({ default: class ProcessInfoCommand {} }));
vi.mock("../entity/instance/process_config", () => ({ ProcessConfig: class {} }));
vi.mock("../service/async_task_service/quick_install", () => ({
  createQuickInstallTask: vi.fn(),
  QuickInstallTask: { TYPE: "quick_install" }
}));

const originalCwd = process.cwd();
const isLinux = process.platform === "linux";

// The interactive fixture app started as `node test.mjs`. Resolved from this
// file's location because beforeAll chdirs into the temp dir, so process.cwd()
// based paths would no longer point into the repo.
const FIXTURE_APP = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test/fixtures/test.mjs"
);

let tmpDir = "";
let dockerOk = false;
let nodeOk = false;

// Real module references, resolved after chdir (see beforeAll).
let Instance: any;
let InstanceSubsystem: any;
let invoke: any;
let dispatch: any;
let packetsFor: any;
let flush: any;

function detectNode(): boolean {
  try {
    return spawnSync("node", ["-v"], { stdio: "ignore" }).status === 0;
  } catch {
    return false;
  }
}

async function detectDocker(): Promise<boolean> {
  if (!isLinux) return false;
  try {
    const { DefaultDocker } = await import("../service/docker_service");
    const docker = new DefaultDocker();
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

function waitFor(
  cond: () => boolean | Promise<boolean>,
  timeoutMs: number,
  label: string
): Promise<void> {
  const start = Date.now();
  return (async () => {
    while (true) {
      if (await cond()) return;
      if (Date.now() - start > timeoutMs) {
        throw new Error(`waitFor timed out: ${label}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  })();
}

async function waitOutputContains(
  output: string[],
  substr: string,
  timeoutMs = 40000
): Promise<void> {
  await waitFor(() => output.join("").includes(substr), timeoutMs, `output contains "${substr}"`);
}

// Create a real instance through the real subsystem and capture its output.
function createInstance(cfg: any) {
  const inst = InstanceSubsystem.createInstance(cfg);
  const output: string[] = [];
  inst.on("data", (text: any) => output.push(String(text)));
  return { inst, output, uuid: inst.instanceUuid };
}

async function killInstance(inst: any) {
  if (inst.status() !== Instance.STATUS_STOP) {
    try {
      await inst.execPreset("kill");
    } catch (err) {}
  }
  await waitFor(() => inst.status() === Instance.STATUS_STOP, 20000, "instance stopped");
}

async function listLabeledContainers(uuid: string): Promise<any[]> {
  const { DefaultDocker } = await import("../service/docker_service");
  const docker = new DefaultDocker();
  const containers = await docker.listContainers({ all: true });
  return containers.filter(
    (c: any) => c.Labels?.["mcsmanager.instance.uuid"] === uuid
  );
}

function dockerConfig(name: string, startCommand: string) {
  return {
    nickname: name,
    type: "universal",
    processType: "docker",
    cwd: path.join(tmpDir, name),
    startCommand,
    stopCommand: "^C",
    docker: {
      image: "alpine:3.20",
      containerName: `mcsm-int-${name}-${Date.now()}`
    }
  };
}

function generalConfig(name: string) {
  return {
    nickname: name,
    type: "universal",
    processType: "general",
    cwd: path.join(tmpDir, name),
    startCommand: "bash",
    stopCommand: "^C",
    terminalOption: { pty: false }
  };
}

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-instance-int-"));
  process.chdir(tmpDir);

  Instance = (await import("../entity/instance/instance")).default;
  InstanceSubsystem = (await import("../service/system_instance")).default;
  const harness = await import("../../test/harness/router");
  invoke = harness.invoke;
  dispatch = harness.dispatch;
  packetsFor = harness.packetsFor;
  flush = harness.flush;

  // Register the real instance router handlers on the shared routerApp.
  await import("./Instance_router");

  dockerOk = await detectDocker();
  nodeOk = detectNode();
}, 60000);

afterAll(async () => {
  // Best-effort teardown of anything still running so we never leak child
  // processes or Docker containers into the host.
  try {
    for (const inst of InstanceSubsystem.getInstances()) {
      if (inst.status() !== Instance.STATUS_STOP) {
        await killInstance(inst);
      }
      if (inst.config.processType === "docker") {
        try {
          const containers = await listLabeledContainers(inst.instanceUuid);
          for (const c of containers) {
            const { DefaultDocker } = await import("../service/docker_service");
            const docker = new DefaultDocker();
            const container = docker.getContainer(c.Id);
            await container.kill().catch(() => {});
            await container.remove({ force: true }).catch(() => {});
          }
        } catch (err) {}
      }
    }
  } catch (err) {}
  process.chdir(originalCwd);
  fs.removeSync(tmpDir);
}, 60000);

describe("Docker instance lifecycle (real)", () => {
  it("opens a Docker instance: container reaches RUNNING and emits start output", async () => {
    if (!dockerOk) return;

    // Continuous output: the container starts *before* the attach stream is
    // wired up, so a one-shot echo would be emitted (and lost) too early.
    const { inst, output, uuid } = createInstance(
      dockerConfig("docker-start", 'sh -c "while true; do echo MCSM_DOCKER_STARTED; sleep 1; done"')
    );

    const { socket } = invoke("instance/open", { instanceUuids: [uuid] });

    await waitFor(
      () => inst.status() === Instance.STATUS_RUNNING,
      45000,
      "docker instance RUNNING"
    );
    await waitOutputContains(output, "MCSM_DOCKER_STARTED");

    expect(inst.status()).toBe(Instance.STATUS_RUNNING);
    expect(inst.process).toBeTruthy();
    // For docker instances the process adapter exposes the container id as pid.
    expect(inst.process.pid).toBeTruthy();

    // The ack packet is only sent after the async handler resolves.
    const pkt = packetsFor(socket, "instance/open")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe(uuid);

    // The container must actually exist and be running on the daemon.
    const containers = await listLabeledContainers(uuid);
    expect(containers).toHaveLength(1);
    expect(containers[0].State).toBe("running");

    // detail reports the RUNNING status through the router.
    const detailSocket = invoke("instance/detail", { instanceUuid: uuid }).socket;
    await flush();
    const detail = packetsFor(detailSocket, "instance/detail")[0];
    expect(detail.status).toBe(200);
    expect(detail.data.status).toBe(Instance.STATUS_RUNNING);

    await killInstance(inst);
  }, 120000);

  it("kill terminates the Docker instance and removes its container", async () => {
    if (!dockerOk) return;

    const { inst, uuid } = createInstance(
      dockerConfig("docker-kill", 'sh -c "echo MCSM_DOCKER_KILL; sleep 300"')
    );
    invoke("instance/open", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_RUNNING, 45000, "docker RUNNING");

    const { socket } = invoke("instance/kill", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_STOP, 30000, "docker STOP after kill");

    const pkt = packetsFor(socket, "instance/kill")[0];
    expect(pkt.status).toBe(200);

    // The container must be gone (AutoRemove + adapter destroy).
    await waitFor(async () => (await listLabeledContainers(uuid)).length === 0, 20000, "container removed");
  }, 120000);

  it("stop gracefully terminates the Docker instance (SIGINT via ^C)", async () => {
    if (!dockerOk) return;

    // A continuous loop keeps the container alive and lets us confirm it was
    // RUNNING; ^C (SIGINT) is delivered to the container's PID 1 (sh), whose
    // default disposition terminates the container cleanly.
    const { inst, uuid } = createInstance(
      dockerConfig("docker-stop", 'sh -c "while true; do echo MCSM_DOCKER_STOP; sleep 1; done"')
    );
    invoke("instance/open", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_RUNNING, 45000, "docker RUNNING");

    invoke("instance/stop", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_STOP, 30000, "docker STOP after ^C");

    expect(inst.status()).toBe(Instance.STATUS_STOP);
    await waitFor(async () => (await listLabeledContainers(uuid)).length === 0, 20000, "container removed after stop");
  }, 120000);

  it("delete destroys a stopped Docker instance (config + subsystem entry removed)", async () => {
    if (!dockerOk) return;

    const { inst, uuid } = createInstance(
      dockerConfig("docker-delete", 'sh -c "echo MCSM_DOCKER_DELETE; sleep 300"')
    );
    invoke("instance/open", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_RUNNING, 45000, "docker RUNNING");
    await killInstance(inst);

    expect(InstanceSubsystem.exists(uuid)).toBe(true);
    const configPath = path.join(tmpDir, "data", "InstanceConfig", `${uuid}.json`);
    expect(fs.existsSync(configPath)).toBe(true);

    const { socket } = invoke("instance/delete", { instanceUuids: [uuid], deleteFile: false });

    const pkt = packetsFor(socket, "instance/delete")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuids).toEqual([uuid]);

    expect(InstanceSubsystem.exists(uuid)).toBe(false);
    expect(fs.existsSync(configPath)).toBe(false);
  }, 120000);
});

describe("General (non-Docker) instance lifecycle (real)", () => {
  const canRun = process.platform !== "win32";

  it("opens a general instance and reaches RUNNING", async () => {
    if (!canRun) return;

    const { inst, uuid } = createInstance(generalConfig("general-start"));
    invoke("instance/open", { instanceUuids: [uuid] });

    await waitFor(() => inst.status() === Instance.STATUS_RUNNING, 30000, "general RUNNING");
    expect(inst.status()).toBe(Instance.STATUS_RUNNING);
    expect(inst.process).toBeTruthy();
    expect(inst.process.pid).toBeTruthy();

    await killInstance(inst);
  }, 60000);

  it("runs a system command (ping a public IP) and captures its output", async () => {
    if (!canRun) return;

    const { inst, output, uuid } = createInstance(generalConfig("general-command"));
    invoke("instance/open", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_RUNNING, 30000, "general RUNNING");

    const command = "ping -c 1 -W 3 8.8.8.8";
    const { socket } = invoke("instance/command", { instanceUuid: uuid, command });

    await waitOutputContains(output, "8.8.8.8", 30000);
    await waitOutputContains(output, "packets transmitted");

    const pkt = packetsFor(socket, "instance/command")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuid).toBe(uuid);

    // The process must still be alive after the command has returned.
    expect(inst.status()).toBe(Instance.STATUS_RUNNING);

    await killInstance(inst);
  }, 60000);
});

describe("General process instance interactive lifecycle (real)", () => {
  // Real non-Docker instances running the interactive fixture `test.mjs`
  // (`node test.mjs`, pipes, no PTY, no shell wrapper). The fixture speaks a
  // line protocol on stdin/stdout and appends `heartbeat.txt` in its workspace
  // as an out-of-band liveness probe, so these cases can prove command I/O,
  // force-kill and restart effects against a real OS process. Unlike the bash
  // cases above they run on Windows too (only `node` on PATH is required).
  // `nodeOk` is probed in beforeAll, so each case checks it at run time (the
  // same pattern as `dockerOk`) instead of binding it at collect time.

  function processConfig(name: string) {
    const cwd = path.join(tmpDir, name);
    fs.mkdirpSync(cwd);
    fs.copyFileSync(FIXTURE_APP, path.join(cwd, "test.mjs"));
    return {
      nickname: name,
      type: "universal",
      processType: "general",
      cwd,
      startCommand: "node test.mjs",
      // Graceful stop: the fixture answers `exit` with BYE + exit(0).
      stopCommand: "exit",
      // Escalate to a force kill when the stop command is ignored.
      stopTimeout: 5,
      terminalOption: { pty: false }
    };
  }

  function heartbeatFileOf(cfg: any) {
    return path.join(cfg.cwd, "heartbeat.txt");
  }

  async function startInstance(inst: any, output: string[]) {
    await waitFor(() => inst.status() === Instance.STATUS_RUNNING, 30000, "process RUNNING");
    await waitOutputContains(output, "READY:");
  }

  async function stopInstance(inst: any) {
    if (inst.status() === Instance.STATUS_STOP) return;
    try {
      await inst.execPreset("stop");
    } catch (err) {}
    await waitFor(() => inst.status() === Instance.STATUS_STOP, 30000, "instance stopped");
  }

  // The fixture appends a heartbeat every 200ms while it is alive.
  async function expectHeartbeatGrows(file: string) {
    const before = fs.existsSync(file) ? fs.statSync(file).size : 0;
    await waitFor(
      () => fs.existsSync(file) && fs.statSync(file).size > before,
      10000,
      "heartbeat file grows"
    );
  }

  async function expectHeartbeatFrozen(file: string) {
    const before = fs.statSync(file).size;
    await new Promise((r) => setTimeout(r, 700));
    expect(fs.statSync(file).size).toBe(before);
  }

  // Cross-platform liveness probe: signal 0 only checks for existence
  // (ESRCH when the pid is gone, on POSIX and Windows alike).
  function isPidAlive(pid?: number | string | null): boolean {
    if (pid == null) return false;
    try {
      process.kill(Number(pid), 0);
      return true;
    } catch (err) {
      return false;
    }
  }

  it("creates an instance via instance/new, persists config and emits real startup output", async () => {
    if (!nodeOk) return;

    const cfg = processConfig("proc-create");
    const { socket } = invoke("instance/new", cfg);
    const pkt = packetsFor(socket, "instance/new")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.nickname).toBe("proc-create");
    const uuid = pkt.data.instanceUuid;
    expect(pkt.data.config.processType).toBe("general");
    expect(pkt.data.config.startCommand).toBe("node test.mjs");

    expect(InstanceSubsystem.exists(uuid)).toBe(true);
    const configPath = path.join(tmpDir, "data", "InstanceConfig", `${uuid}.json`);
    const saved = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(saved.processType).toBe("general");
    expect(saved.startCommand).toBe("node test.mjs");

    // The real instance-existence gate rejects unknown instances up front.
    const badSocket = dispatch("instance/command", {
      instanceUuid: "no-such-instance",
      command: "pid"
    }).socket;
    expect(packetsFor(badSocket, "instance/command")[0].status).toBe(500);

    const inst = InstanceSubsystem.getInstance(uuid);
    const output: string[] = [];
    inst.on("data", (text: any) => output.push(String(text)));

    const detailSocket = invoke("instance/detail", { instanceUuid: uuid }).socket;
    await flush();
    const detail = packetsFor(detailSocket, "instance/detail")[0];
    expect(detail.status).toBe(200);
    expect(detail.data.status).toBe(Instance.STATUS_STOP);

    const openSocket = invoke("instance/open", { instanceUuids: [uuid] }).socket;
    await startInstance(inst, output);
    expect(inst.process.pid).toBeTruthy();
    await waitFor(() => packetsFor(openSocket, "instance/open").length > 0, 10000, "open ack");
    expect(packetsFor(openSocket, "instance/open")[0].status).toBe(200);

    // The child really runs in the instance workspace: it keeps appending
    // heartbeats to its own cwd.
    await expectHeartbeatGrows(heartbeatFileOf(cfg));

    await stopInstance(inst);
  }, 60000);

  it("interactive stdin/stdout: echo, pid and sum round-trip through instance/command", async () => {
    if (!nodeOk) return;

    const cfg = processConfig("proc-stdio");
    const { inst, output, uuid } = createInstance(cfg);
    invoke("instance/open", { instanceUuids: [uuid] });
    await startInstance(inst, output);

    const send = (command: string) =>
      invoke("instance/command", { instanceUuid: uuid, command }).socket;

    const echoSocket = send("echo MCSM_STDIO_TEST");
    await waitOutputContains(output, "ECHO:MCSM_STDIO_TEST");
    await waitFor(() => packetsFor(echoSocket, "instance/command").length > 0, 10000, "echo ack");
    expect(packetsFor(echoSocket, "instance/command")[0].status).toBe(200);

    // The fixture answers with its real OS pid — true stdin->stdout round-trip.
    send("pid");
    await waitOutputContains(output, `PID:${inst.process.pid}`);

    // A computed answer proves the stream keeps working across commands.
    send("sum 19 23");
    await waitOutputContains(output, "SUM:42");

    // Unknown input gets a structured error and does not hurt the process.
    send("bogus arg");
    await waitOutputContains(output, "ERR:unknown command:bogus arg");
    expect(inst.status()).toBe(Instance.STATUS_RUNNING);

    await stopInstance(inst);
  }, 60000);

  it("graceful stop: stopCommand `exit` terminates the process cleanly", async () => {
    if (!nodeOk) return;

    const cfg = processConfig("proc-stop");
    const { inst, output, uuid } = createInstance(cfg);
    invoke("instance/open", { instanceUuids: [uuid] });
    await startInstance(inst, output);
    const pid = inst.process.pid;
    const beatFile = heartbeatFileOf(cfg);
    await expectHeartbeatGrows(beatFile);

    const { socket } = invoke("instance/stop", { instanceUuids: [uuid] });
    await waitFor(() => inst.status() === Instance.STATUS_STOP, 30000, "STOP after stop");
    await waitFor(() => packetsFor(socket, "instance/stop").length > 0, 10000, "stop ack");
    expect(packetsFor(socket, "instance/stop")[0].status).toBe(200);

    // Effects of the clean shutdown: BYE was printed, the OS process is gone,
    // the adapter is released and the heartbeat file freezes.
    await waitOutputContains(output, "BYE");
    expect(isPidAlive(pid)).toBe(false);
    expect(inst.process).toBeUndefined();
    await expectHeartbeatFrozen(beatFile);
  }, 60000);

  it("force kill: instance/kill interrupts a busy process and stops all effects", async () => {
    if (!nodeOk) return;

    const cfg = processConfig("proc-kill");
    const { inst, output, uuid } = createInstance(cfg);
    invoke("instance/open", { instanceUuids: [uuid] });
    await startInstance(inst, output);
    const pid = inst.process.pid;
    const beatFile = heartbeatFileOf(cfg);
    await expectHeartbeatGrows(beatFile);

    // Put the app to work so the kill has to interrupt it mid-command.
    invoke("instance/command", { instanceUuid: uuid, command: "sleep 8000" });
    await waitOutputContains(output, "SLEEPING:8000");

    const { socket } = invoke("instance/kill", { instanceUuids: [uuid] });
    // GeneralKillCommand shields instances younger than 6s (startup guard),
    // so the SIGKILL can fire a few seconds after the request.
    await waitFor(() => inst.status() === Instance.STATUS_STOP, 45000, "STOP after kill");
    await waitFor(() => packetsFor(socket, "instance/kill").length > 0, 10000, "kill ack");
    expect(packetsFor(socket, "instance/kill")[0].status).toBe(200);

    // Effects: the OS process is gone, the pending sleep never completes, the
    // adapter is released and the heartbeat file freezes.
    expect(isPidAlive(pid)).toBe(false);
    expect(inst.process).toBeUndefined();
    expect(output.join("")).not.toContain("SLEPT:8000");
    await expectHeartbeatFrozen(beatFile);

    // A stopped instance refuses further stdin commands (router returns 500).
    const cmdSocket = invoke("instance/command", { instanceUuid: uuid, command: "pid" }).socket;
    await waitFor(() => packetsFor(cmdSocket, "instance/command").length > 0, 10000, "command ack");
    expect(packetsFor(cmdSocket, "instance/command")[0].status).toBe(500);
  }, 90000);

  it("restart: instance/restart replaces the process (new pid, fresh banner, I/O alive)", async () => {
    if (!nodeOk) return;

    const cfg = processConfig("proc-restart");
    const { inst, output, uuid } = createInstance(cfg);
    invoke("instance/open", { instanceUuids: [uuid] });
    await startInstance(inst, output);
    const pidBefore = inst.process.pid;
    expect(inst.startCount).toBe(1);

    invoke("instance/restart", { instanceUuids: [uuid] });
    await waitFor(
      () => inst.status() === Instance.STATUS_RUNNING && inst.startCount === 2,
      45000,
      "RUNNING after restart"
    );
    await waitOutputContains(output, "BYE");
    // RUNNING is set at spawn time; the second banner is printed by the new
    // child and flushed in 50ms output batches, so wait for it explicitly.
    await waitFor(
      () => output.join("").split("READY:").length - 1 >= 2,
      15000,
      "second READY banner"
    );

    const pidAfter = inst.process.pid;
    expect(pidAfter).toBeTruthy();
    expect(pidAfter).not.toBe(pidBefore);
    expect(inst.startCount).toBe(2);
    // Both boots announced themselves on stdout.
    expect(output.join("").split("READY:").length - 1).toBe(2);

    // The new process answers commands again.
    invoke("instance/command", { instanceUuid: uuid, command: "sum 20 22" });
    await waitOutputContains(output, "SUM:42");

    await stopInstance(inst);
  }, 90000);

  it("delete removes the stopped instance and its persisted config", async () => {
    if (!nodeOk) return;

    const cfg = processConfig("proc-delete");
    const { inst, output, uuid } = createInstance(cfg);
    invoke("instance/open", { instanceUuids: [uuid] });
    await startInstance(inst, output);
    await stopInstance(inst);

    expect(InstanceSubsystem.exists(uuid)).toBe(true);
    const configPath = path.join(tmpDir, "data", "InstanceConfig", `${uuid}.json`);
    expect(fs.existsSync(configPath)).toBe(true);

    const { socket } = invoke("instance/delete", { instanceUuids: [uuid], deleteFile: false });
    const pkt = packetsFor(socket, "instance/delete")[0];
    expect(pkt.status).toBe(200);
    expect(pkt.data.instanceUuids).toEqual([uuid]);
    expect(InstanceSubsystem.exists(uuid)).toBe(false);
    expect(fs.existsSync(configPath)).toBe(false);
  }, 60000);
});
