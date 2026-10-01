import { spawnSync } from "child_process";
import Docker from "dockerode";
import fs from "fs-extra";
import net from "net";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Live tests for `DockerProcessAdapter` console reconnection after the Docker
 * transport dies (issue #2314 / PR #2362): the hijacked attach stream and the
 * container wait request are disconnected while the container keeps running,
 * so the console used to keep a dead stream (input lost, output stopped) until
 * the instance was force-deleted and the MCSManager daemon restarted.
 *
 * Two suites:
 *  - "…transport loss (simulated daemon restart)" — a tiny TCP proxy fronts the
 *    Docker socket; killing every proxy connection at once reproduces exactly
 *    the client-side condition of a daemon restart (attach + wait dropped,
 *    container still running) without touching the host's Docker daemon. It
 *    runs wherever the other Docker suites run (Linux + reachable daemon).
 *  - "…real Docker daemon restart" — restarts `docker.service` for real. Gated
 *    behind MCSM_DOCKER_RESTART_TEST=1 (it interrupts every container on the
 *    host) and needs root plus `live-restore: true` in /etc/docker/daemon.json,
 *    otherwise the daemon kills running containers on shutdown and the scenario
 *    of issue #2314 cannot occur. Run it with a file filter so no other Docker
 *    suite is active during the restart.
 *
 * Both suites drive the REAL `DockerProcessAdapter` against a real
 * `node:20-alpine` container running the interactive fixture `test.mjs`
 * (line protocol: `sum <a> <b>` -> `SUM:<a+b>`, `exit` -> `BYE` + exit 0).
 *
 * Command delivery model: the adapter deliberately drops writes while the
 * stream is being re-established (PR #2362), so a console user retypes the
 * command once the terminal is back — `expectRoundTrip` therefore re-sends the
 * command every 2 s until the answer arrives, and the recovery case asserts
 * that a command written *inside* the reconnect window is dropped, not silently
 * replayed later. The fixture's `heartbeat.txt` proves the container process
 * was alive the whole time the console was disconnected.
 */

vi.mock("../log", () => {
  const f: any = () => {};
  f.info = f;
  f.debug = f;
  f.warn = f;
  f.error = f;
  return { default: f };
});

vi.mock("../disk_limit_service", () => ({
  default: {
    checkDiskNow: async () => ({ isFull: false }),
    checkInstanceDiskSize: () => {}
  },
  convertBytesToGB: (v: number) => v,
  convertGBToBytes: (v: number) => v
}));

vi.mock("../upload_manager", () => ({ default: { getUploads: () => new Map() } }));
vi.mock("../download_manager", () => ({ default: { tasks: [], downloadingCount: 0 } }));
vi.mock("../mod_service", () => ({
  modService: {
    listMods: vi.fn(),
    toggleMod: vi.fn(),
    deleteMod: vi.fn(),
    installMod: vi.fn(),
    getModConfig: vi.fn()
  }
}));
vi.mock("../system_file", () => ({ default: class FileManager {} }));
vi.mock("../../entity/commands/process_info", () => ({ default: class ProcessInfoCommand {} }));
vi.mock("../../entity/instance/process_config", () => ({ ProcessConfig: class {} }));
vi.mock("../async_task_service/quick_install", () => ({
  createQuickInstallTask: vi.fn(),
  QuickInstallTask: { TYPE: "quick_install" }
}));

const originalCwd = process.cwd();
const isLinux = process.platform === "linux";
const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
const realRestartEnabled = process.env.MCSM_DOCKER_RESTART_TEST === "1";

const FIXTURE_APP = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../test/fixtures/test.mjs"
);
const DOCKER_NODE_IMAGE = "node:20-alpine";
const DOCKER_SOCKET = os.platform() === "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock";

let tmpDir = "";
let dockerOk = false;
let DockerProcessAdapter: any;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function waitFor(
  cond: () => boolean | Promise<boolean>,
  timeoutMs: number,
  label: string
): Promise<void> {
  const start = Date.now();
  return (async () => {
    while (true) {
      if (await cond()) return;
      if (Date.now() - start > timeoutMs) throw new Error(`waitFor timed out: ${label}`);
      await sleep(100);
    }
  })();
}

/**
 * Byte-level TCP front-end for the Docker socket. Every client connection is
 * piped to the real socket, so it carries regular HTTP requests and hijacked
 * attach streams alike. `simulateDaemonRestart()` drops every live connection
 * at once and refuses new ones for a while — the client-side picture of a
 * Docker daemon going down and coming back while containers keep running.
 */
class DockerSocketProxy {
  private server?: net.Server;
  private pairs = new Set<{ client: net.Socket; upstream: net.Socket }>();
  private down = false;
  port = 0;

  async listen(targetSocketPath = DOCKER_SOCKET): Promise<number> {
    this.server = net.createServer((client) => {
      if (this.down) {
        client.destroy();
        return;
      }
      const upstream = net.createConnection({ path: targetSocketPath });
      const pair = { client, upstream };
      this.pairs.add(pair);
      const drop = () => {
        if (!this.pairs.delete(pair)) return;
        client.destroy();
        upstream.destroy();
      };
      client.on("error", drop);
      upstream.on("error", drop);
      client.on("close", drop);
      upstream.on("close", drop);
      client.pipe(upstream);
      upstream.pipe(client);
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject);
      this.server!.listen(0, "127.0.0.1", () => resolve());
    });
    this.port = (this.server!.address() as net.AddressInfo).port;
    return this.port;
  }

  async simulateDaemonRestart(downMs = 2500): Promise<void> {
    this.down = true;
    for (const pair of [...this.pairs]) {
      pair.client.destroy();
      pair.upstream.destroy();
    }
    this.pairs.clear();
    await sleep(downMs);
    this.down = false;
  }

  close(): void {
    for (const pair of [...this.pairs]) {
      pair.client.destroy();
      pair.upstream.destroy();
    }
    this.pairs.clear();
    this.server?.close();
  }
}

interface OutputCollector {
  text(): string;
}

function collectOutput(adapter: any): OutputCollector {
  const chunks: string[] = [];
  adapter.on("data", (d: any) => chunks.push(Buffer.from(d).toString("utf-8")));
  return { text: () => chunks.join("") };
}

// Send a console command and wait for its answer in the output produced after
// the first write. The command is re-sent every 2 s: while the transport is
// being re-established the adapter drops writes (documented PR #2362 behavior),
// which models a console user retyping once the terminal is responsive again.
async function expectRoundTrip(
  adapter: any,
  out: OutputCollector,
  command: string,
  expected: string,
  timeoutMs = 15000
): Promise<void> {
  const mark = out.text().length;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    adapter.write(`${command}\n`);
    const until = Math.min(Date.now() + 2000, deadline);
    while (Date.now() < until) {
      if (out.text().slice(mark).includes(expected)) return;
      await sleep(100);
    }
    if (Date.now() >= deadline) {
      throw new Error(`waitFor timed out: console answers "${expected}" to "${command}"`);
    }
  }
}

async function detectDocker(): Promise<boolean> {
  if (!isLinux) return false;
  try {
    const { DefaultDocker } = await import("../docker_service");
    const docker = new DefaultDocker();
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

// Mirror the container options of SetupDockerContainer (TTY + open stdin), but
// with AutoRemove disabled so the test can prove the adapter itself removes the
// container on exit.
async function startFixtureContainer(
  docker: Docker,
  workspace: string,
  labelUuid: string
): Promise<Docker.Container> {
  fs.copyFileSync(FIXTURE_APP, path.join(workspace, "test.mjs"));
  const container = await docker.createContainer({
    Image: DOCKER_NODE_IMAGE,
    Cmd: ["node", "test.mjs"],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    WorkingDir: "/data",
    Labels: { "mcsmanager.instance.uuid": labelUuid },
    HostConfig: { Binds: [`${workspace}:/data`] }
  });
  await container.start();
  return container;
}

function heartbeatSize(workspace: string): number {
  const file = path.join(workspace, "heartbeat.txt");
  return fs.existsSync(file) ? fs.statSync(file).size : 0;
}

async function containerRunning(container: Docker.Container): Promise<boolean> {
  try {
    const info = await container.inspect();
    return Boolean(info.State?.Running);
  } catch {
    return false;
  }
}

// Cleanup must not depend on the test's Docker client (the proxy may already be
// closed), so removal runs on a direct socket connection.
async function forceRemoveById(containerId?: string): Promise<void> {
  if (!containerId) return;
  try {
    const direct = new Docker({ socketPath: DOCKER_SOCKET });
    await direct.getContainer(containerId).remove({ force: true });
  } catch (error) {}
}

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-docker-reconnect-"));
  process.chdir(tmpDir);
  // Import order matters: entity/instance/instance first, like the instance
  // integration suite does, otherwise the instance <-> dispatcher <->
  // java_manager <-> system_instance import cycle evaluates java_manager's
  // top-level `InstanceSubsystem.on(...)` before system_instance is initialized.
  await import("../../entity/instance/instance");
  DockerProcessAdapter = (await import("../docker_process_service")).DockerProcessAdapter;
  dockerOk = await detectDocker();
}, 60000);

afterAll(async () => {
  process.chdir(originalCwd);
  fs.removeSync(tmpDir);
}, 60000);

describe("Docker console reconnect after transport loss (simulated daemon restart)", () => {
  let proxy: DockerSocketProxy;
  let docker: Docker;
  let container: Docker.Container;
  let adapter: any;
  let out: OutputCollector;
  let workspace: string;
  let started = false;

  beforeAll(async () => {
    if (!dockerOk) return;
    workspace = path.join(tmpDir, "sim-workspace");
    fs.mkdirpSync(workspace);
    proxy = new DockerSocketProxy();
    const port = await proxy.listen();
    docker = new Docker({ protocol: "http", host: "127.0.0.1", port });
    container = await startFixtureContainer(docker, workspace, `mcsm-reconnect-${Date.now()}`);
    adapter = new DockerProcessAdapter({} as any);
    out = collectOutput(adapter);
    await adapter.start({ isTty: true, h: 24, w: 80 }, container);
    started = true;
  }, 120000);

  afterAll(async () => {
    await forceRemoveById(container?.id);
    proxy?.close();
  }, 60000);

  it("round-trips console commands before the outage", async () => {
    if (!started) return;
    await expectRoundTrip(adapter, out, "sum 1 2", "SUM:3");
  }, 30000);

  it("keeps the container running and restores the console once the transport comes back", async () => {
    if (!started) return;
    const beatsBefore = heartbeatSize(workspace);
    await proxy.simulateDaemonRestart(2500);

    // The container never noticed the outage: the fixture keeps heartbeating.
    await waitFor(
      () => heartbeatSize(workspace) > beatsBefore,
      10000,
      "container process stayed alive during the outage"
    );

    // A command written inside the reconnect window is dropped, not queued.
    adapter.write("sum 7 8\n");
    await sleep(1000);
    expect(out.text()).not.toContain("SUM:15");

    // The adapter re-attaches on its own and the console works again.
    await expectRoundTrip(adapter, out, "sum 4 5", "SUM:9", 30000);
    expect(await containerRunning(container)).toBe(true);
  }, 60000);

  it("re-arms the exit watcher after the reconnect", async () => {
    if (!started) return;
    const exited = new Promise<any>((resolve) => adapter.once("exit", (code: any) => resolve(code)));
    await expectRoundTrip(adapter, out, "exit", "BYE", 15000);
    const code = await Promise.race([exited, sleep(20000).then(() => "timeout")]);
    expect(code).toBe(0);
    await waitFor(
      async () => !(await containerRunning(container)),
      20000,
      "container removed after exit"
    );
  }, 60000);
});

describe("Docker console after a real Docker daemon restart (live)", () => {
  let docker: Docker;
  let container: Docker.Container;
  let adapter: any;
  let out: OutputCollector;
  let workspace: string;
  let started = false;
  let skipReason = "";

  beforeAll(async () => {
    if (!realRestartEnabled) {
      skipReason = "set MCSM_DOCKER_RESTART_TEST=1 to run (restarts the host's Docker daemon)";
      return;
    }
    if (!dockerOk) {
      skipReason = "Docker daemon not reachable";
      return;
    }
    if (!isRoot) {
      skipReason = "restarting docker.service requires root";
      return;
    }
    workspace = path.join(tmpDir, "restart-workspace");
    fs.mkdirpSync(workspace);
    docker = new Docker({ socketPath: DOCKER_SOCKET });
    container = await startFixtureContainer(docker, workspace, `mcsm-restart-${Date.now()}`);
    adapter = new DockerProcessAdapter({} as any);
    out = collectOutput(adapter);
    await adapter.start({ isTty: true, h: 24, w: 80 }, container);
    started = true;
  }, 120000);

  afterAll(async () => {
    await forceRemoveById(container?.id);
  }, 60000);

  it("restores the console after `systemctl restart docker` and keeps the same container", async () => {
    if (!started) {
      if (skipReason) console.log(`[skip] real restart suite: ${skipReason}`);
      return;
    }
    await expectRoundTrip(adapter, out, "sum 1 2", "SUM:3");

    const restart = spawnSync("systemctl", ["restart", "docker"], { timeout: 120000 });
    expect(restart.status, String(restart.stderr)).toBe(0);

    // Wait until the API answers again.
    await waitFor(
      async () => {
        try {
          await docker.ping();
          return true;
        } catch {
          return false;
        }
      },
      60000,
      "Docker daemon back online"
    );

    // live-restore must have kept the container alive across the restart.
    await waitFor(() => containerRunning(container), 30000, "container survived the daemon restart");

    await expectRoundTrip(adapter, out, "sum 4 5", "SUM:9", 60000);
  }, 300000);

  it("emits exit and removes the container after the restart recovery", async () => {
    if (!started) return;
    const exited = new Promise<any>((resolve) => adapter.once("exit", (code: any) => resolve(code)));
    await expectRoundTrip(adapter, out, "exit", "BYE", 30000);
    const code = await Promise.race([exited, sleep(30000).then(() => "timeout")]);
    expect(code).toBe(0);
  }, 120000);
});
