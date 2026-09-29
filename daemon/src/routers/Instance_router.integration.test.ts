import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Real (integration) tests for the instance lifecycle exercised through
 * `Instance_router.ts`. Unlike the unit test, the instance entity, the command
 * dispatcher, the docker/general start commands and the instance subsystem are
 * all REAL. This is what actually spawns containers / child processes.
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

let tmpDir = "";
let dockerOk = false;

// Real module references, resolved after chdir (see beforeAll).
let Instance: any;
let InstanceSubsystem: any;
let invoke: any;
let packetsFor: any;
let flush: any;

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
  packetsFor = harness.packetsFor;
  flush = harness.flush;

  // Register the real instance router handlers on the shared routerApp.
  await import("./Instance_router");

  dockerOk = await detectDocker();
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
