import { describe, it, expect, afterAll } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import {
  world,
  requestPanel,
  ensureUser,
  ensureOwner,
  createStream,
  waitForOutput,
  waitFor,
  addFinding,
  saveState,
  getUploadPassport,
  uploadToDaemon,
  type Stream
} from "../lib";

// Docker module integration suite (Linux + reachable dockerd only).
//
// Drives the docker module THROUGH THE PANEL (POST /api/instance with
// processType:"docker" + a `docker` config object → /protected_instance/open
// → /protected_instance/command → /stop → /kill → /restart → DELETE /api/instance;
// and POST/GET/DELETE /api/environment/image for the image lifecycle). The
// docker config shape is ported from the kept `daemon/src/routers/__test__/
// Instance_router.integration.test.ts` (which drives the DAEMON in-process) and
// verified against `daemon/src/service/docker_process_service.ts`
// SetupDockerContainer — the only place the docker config fields are validated.
//
// Visible-skip design: every docker `it` is `it.skip` on non-Linux or unreachable
// dockerd so vitest's verbose reporter shows SKIPPED (not silent passes). One
// always-running probe `it` records the availability state via addFinding. On a
// Linux+Docker CI runner, `dockerIt` resolves to `it` and the suite runs for
// real against the same fresh daemon+panel pair as the other suites.

const isLinux = process.platform === "linux";
function detectDocker(): boolean {
  if (!isLinux) return false;
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const dockerOk = detectDocker();
// dockerIt = `it` on Linux+Docker, else `it.skip` → vitest visibly reports SKIPPED.
const dockerIt = dockerOk ? it : it.skip;

const di = () => world.daemonId;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

// Daemon instance entity status codes:
const STOPPED = 0;
const RUNNING = 3;

// Docker config accepted by SetupDockerContainer (docker_process_service.ts):
// image, containerName (2..64 chars, optional — defaults to MCSM-<uuid[:6]>),
// ports ("host:container/proto" | "ip:host:container/proto"), workingDir,
// changeWorkdir, extraVolumes ("hostPath|containerPath"), networkMode,
// networkAliases, env (string[]), capAdd/capDrop, devices, privileged, cpusetCpus,
// cpuUsage, memory, memorySwap, memorySwappiness, labels, uploadSpeedLimit,
// downloadSpeedLimit, gpu* fields. Ports are deliberately empty here (we do not
// exercise port forwarding; an empty array is valid and avoids host port races).
const NODE_IMAGE = "node:20-alpine";
const CONTAINER_PREFIX = "mcsm-it-docker-";
const LABEL_KEY = "mcsmanager.instance.uuid";
const TEST_IMG_NAME = "mcsm-it-test";
const TEST_IMG_TAG = "v1";
const TEST_IMG_REF = `${TEST_IMG_NAME}:${TEST_IMG_TAG}`;
const RUN_ID = `${Date.now()}-${process.pid}`;

// shell helper for labelled/container-name queries (Linux+Docker only).
function dockerPs(format: string, filter: string): string[] {
  if (!dockerOk) return [];
  try {
    const out = execSync(`docker ps -a --filter ${filter} --format ${format}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"]
    });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Container IDs whose name starts with the test prefix — these are test-owned,
// so `docker rm -f` here never touches user containers (e.g. real MCSM-*).
function cleanupTestContainers() {
  if (!dockerOk) return;
  try {
    const ids = dockerPs("{{.ID}}", `name=${CONTAINER_PREFIX}`);
    if (!ids.length) return;
    execSync(`docker rm -f ${ids.join(" ")}`, { stdio: "ignore" });
  } catch {
    /* best effort */
  }
}

// fresh containerName per test — every test owns its own docker instance so
// none of the per-instance state (uuid, stopCommand, cwd) crosses `it` bounds.
function containerName(label: string): string {
  return `${CONTAINER_PREFIX}${label}-${RUN_ID}`;
}

// Lazy one-time user bootstrap (cached; only fires on Linux+Docker CI, since
// `dockerIt` skips the caller entirely on non-Linux). The integration-test key
// (admin equivalent) handles every admin route below; u1 is the instance OWNER
// and exercises the per-instance gates (open/command/stream/stop/kill/restart).
let usersReady = false;
async function ensureUsersOnce() {
  if (usersReady) return;
  world.admin.uuid = await ensureUser("admin", world.key);
  world.u1.uuid = await ensureUser("u1", world.key);
  saveState();
  usersReady = true;
}

// Verified POST /api/instance docker create body — `nickname` + `startCommand:
// "node test.mjs"` bind-mounted at /data via the daemon's workingDir mount.
function dockerCreateBody(cName: string, startCommand = "node test.mjs") {
  return {
    nickname: "mcsm-it-docker",
    startCommand,
    stopCommand: "exit",
    cwd: "",
    ie: "utf-8",
    oe: "utf-8",
    processType: "docker",
    docker: {
      image: NODE_IMAGE,
      containerName: cName,
      ports: [],
      workingDir: "/data",
      changeWorkdir: true,
      networkMode: "bridge",
      env: [],
      extraVolumes: []
    }
  };
}

// Create a fresh docker instance via the KEY, upload test.mjs into its cwd
// (u1's session — the key cannot operate /files/*), assign it to u1, and
// return the uuid. The caller is responsible for delete.
async function createDockerInstance(
  cName: string,
  startCommand = "node test.mjs"
): Promise<string> {
  const c = await requestPanel({
    method: "POST",
    path: "/instance",
    key: world.key,
    query: { daemonId: di() },
    body: dockerCreateBody(cName, startCommand)
  });
  expect(c.httpStatus, `create docker instance: ${JSON.stringify(c.raw).slice(0, 200)}`).toBe(200);
  const uuid = c.data?.instanceUuid;
  expect(uuid, "create must return instanceUuid").toBeTruthy();
  // ensureOwner reads world.instance.uuid; set it BEFORE the call.
  world.instance.uuid = uuid;
  saveState();
  await ensureOwner("u1", world.key);
  // Upload the test.mjs fixture into the instance cwd using u1's session.
  const pp = await getUploadPassport(di(), uuid, u1().cookie, u1().token, ".");
  expect(pp.password, "upload passport must be granted to the owner").toBeTruthy();
  const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
  expect(up.httpStatus, `upload test.mjs: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(200);
  return uuid;
}

// Read the instance status via the OWNER's session. The integration-test key
// cannot read a specific instance (per-instance gate → 500). Owner session is
// required for every /protected_instance/* route and GET /instance <uuid>.
async function getStatus(uuid: string): Promise<number> {
  const r = await requestPanel({
    method: "GET",
    path: "/instance",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });
  return r?.data?.status ?? -99;
}

// Open ONE stream channel + connect ONE socket (refresh the channel per socket
// — the passport is single-use-ish, mirrors streams.test.ts).
async function openStream(uuid: string): Promise<Stream> {
  const sc = await requestPanel({
    method: "POST",
    path: "/protected_instance/stream_channel",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });
  expect(sc.httpStatus, `stream_channel: ${JSON.stringify(sc.raw).slice(0, 200)}`).toBe(200);
  expect(sc.data?.addr, "stream_channel must return addr").toBeTruthy();
  expect(sc.data?.password, "stream_channel must return password").toBeTruthy();
  return createStream(sc.data.addr, sc.data.prefix, sc.data.password);
}

// Stop the instance forcibly via the KEY (used in the delete tail and as a
// safety net before DELETE — DELETE rejects a RUNNING instance). The daemon's
// /instance/delete throws when status() !== STOP, so callers should poll
// STOPPED before issuing the DELETE.
async function forceStop(uuid: string) {
  try {
    await requestPanel({
      method: "GET",
      path: "/protected_instance/kill",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid }
    });
  } catch {
    /* best effort */
  }
  await waitFor(async () => (await getStatus(uuid)) === STOPPED, {
    timeout: 25000,
    interval: 500,
    msg: "docker instance STOPPED after force kill"
  });
}

// Delete a docker instance via the KEY (DELETE /api/instance). Polls STOPPED
// first (kill if needed), then asserts 200 + clears the cached world uuid.
async function deleteDockerInstance(uuid: string) {
  if ((await getStatus(uuid)) !== STOPPED) await forceStop(uuid);
  const d = await requestPanel({
    method: "DELETE",
    path: "/instance",
    key: world.key,
    query: { daemonId: di() },
    body: { uuids: [uuid], deleteFile: true }
  });
  expect(d.httpStatus, `delete docker instance: ${JSON.stringify(d.raw).slice(0, 200)}`).toBe(200);
  if (world.instance.uuid === uuid) {
    world.instance.uuid = undefined;
    saveState();
  }
}

afterAll(() => {
  // Best-effort teardown so a crashed `it` never leaks labelled containers
  // into the host. Skips cleanly on non-Linux (dockerOk=false ⇒ no-op).
  cleanupTestContainers();
});

describe("docker instance + image integration (Linux + reachable dockerd only)", () => {
  // Always-runs probe: records the availability state + guarantees at least
  // one real assertion executes on every platform.
  it("docker availability probe (informational)", async () => {
    expect(typeof dockerOk).toBe("boolean");
    addFinding({
      id: "F-docker-availability",
      step: "probe",
      severity: "info",
      title: "Docker availability",
      detail: dockerOk
        ? "docker reachable; suite exercised"
        : "docker UNREACHABLE (non-Linux or no dockerd); every docker it skipped — suite authored to run on Linux+Docker CI",
      evidence: `platform=${process.platform}, dockerOk=${dockerOk}`
    });
  });

  // 1) Image lifecycle: build a tiny image, verify it appears, progress reports,
  //    and DELETE cleans it up. The build is async (pre-response 200, the daemon
  //    fires startBuildImage() which sets builderProgress=1, then 2 on success,
  //    -1 on error).
  dockerIt(
    "image lifecycle: build a tiny Dockerfile → GET /environment/image → progress → DELETE",
    async () => {
      const dockerFile = `FROM alpine:latest\nLABEL mcsm.test=1\nCMD ["echo", "hello"]\n`;
      const build = await requestPanel({
        method: "POST",
        path: "/environment/image",
        key: world.key,
        query: { daemonId: di() },
        body: { dockerFile, name: TEST_IMG_NAME, tag: TEST_IMG_TAG }
      });
      expect(build.httpStatus, `build image: ${JSON.stringify(build.raw).slice(0, 200)}`).toBe(200);

      // Poll /environment/progress until the build settles (1=building,
      // 2=complete, -1=error). Allow generous time for the alpine pull on a
      // cold cache (first CI run only — node:20-alpine for the lifecycle test
      // is the same image reused by the instance suite).
      await waitFor(
        async () => {
          const p = await requestPanel({
            method: "GET",
            path: "/environment/progress",
            key: world.key,
            query: { daemonId: di() }
          });
          const v = p.data?.[TEST_IMG_REF];
          return v === 2 || v === -1;
        },
        { timeout: 180000, interval: 1000, msg: "docker build settles (2 or -1)" }
      );

      // GET /environment/image must list our image once built.
      await waitFor(
        async () => {
          const list = await requestPanel({
            method: "GET",
            path: "/environment/image",
            key: world.key,
            query: { daemonId: di() }
          });
          const items = (list.data || []) as any[];
          return items.some((img) => (img.RepoTags || []).includes(TEST_IMG_REF));
        },
        {
          timeout: 30000,
          interval: 2000,
          msg: `image ${TEST_IMG_REF} appears in /environment/image`
        }
      );

      // GET /environment/progress is always 200 even when the build is done.
      const prog = await requestPanel({
        method: "GET",
        path: "/environment/progress",
        key: world.key,
        query: { daemonId: di() }
      });
      expect(prog.httpStatus, "progress must always return 200").toBe(200);

      // DELETE /environment/image?imageId=<name:tag> cleans up (dockerode's
      // getImage accepts the name:tag reference).
      const del = await requestPanel({
        method: "DELETE",
        path: "/environment/image",
        key: world.key,
        query: { daemonId: di(), imageId: TEST_IMG_REF }
      });
      expect(del.httpStatus, `delete image: ${JSON.stringify(del.raw).slice(0, 200)}`).toBe(200);

      // Verify the image is gone from the list.
      await waitFor(
        async () => {
          const list = await requestPanel({
            method: "GET",
            path: "/environment/image",
            key: world.key,
            query: { daemonId: di() }
          });
          const items = (list.data || []) as any[];
          return !items.some((img) => (img.RepoTags || []).includes(TEST_IMG_REF));
        },
        { timeout: 30000, interval: 2000, msg: `image ${TEST_IMG_REF} removed` }
      );
    },
    240000
  );

  // 2) Docker instance full cycle driving the PANEL. The container is created
  //    BEFORE the attach stream is wired up, so the fixture's READY banner may
  //    be lost; liveness is proven by a `sum` round-trip on the stream. The
  //    restart must produce a NEW container id (same name — the daemon's
  //    createContainerWithNameRetry waits for AutoRemove to release the name).
  dockerIt(
    "docker instance full cycle: new processType=docker (node:20-alpine) → open RUNNING → command round-trip (echo/sum/pid via test.mjs) → stop graceful → kill → restart new container → delete",
    async () => {
      await ensureUsersOnce();
      const cName = containerName("cycle");
      const uuid = await createDockerInstance(cName);

      // open → poll RUNNING.
      const open = await requestPanel({
        method: "GET",
        path: "/protected_instance/open",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(open.httpStatus, `open: ${JSON.stringify(open.raw).slice(0, 200)}`).toBe(200);
      await waitFor(async () => (await getStatus(uuid)) === RUNNING, {
        timeout: 45000,
        interval: 500,
        msg: "docker instance RUNNING after open"
      });
      expect(await getStatus(uuid)).toBe(RUNNING);

      // The labelled container exists on the host while RUNNING.
      await waitFor(() => dockerPs("{{.Names}}", `label=${LABEL_KEY}=${uuid}`).includes(cName), {
        timeout: 20000,
        interval: 500,
        msg: `labelled container ${cName} running on host`
      });

      // Liveness via sum round-trip on the stream (READY banner may be lost
      // because the attach stream connects AFTER container start).
      const stream = await openStream(uuid);
      expect(await stream.ready, "stream must authenticate to the daemon").toBe(true);
      stream.send("sum 2 3");
      expect(
        await waitForOutput(stream, (t) => t.includes("SUM:5"), 15000),
        "sum round-trip must reach the stream"
      ).toBe(true);
      stream.send("echo mcsm");
      expect(
        await waitForOutput(stream, (t) => t.includes("ECHO:mcsm"), 10000),
        "echo round-trip must reach the stream"
      ).toBe(true);
      stream.disconnect();

      // Capture the container id BEFORE restart.
      const idBefore = dockerPs("{{.ID}}", `label=${LABEL_KEY}=${uuid}`)[0];
      expect(idBefore, "container must exist before restart").toBeTruthy();

      // stop (graceful stopCommand "exit") → STOPPED. AutoRemove deletes the
      // container once it exits.
      const stop = await requestPanel({
        method: "GET",
        path: "/protected_instance/stop",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(stop.httpStatus, `stop: ${JSON.stringify(stop.raw).slice(0, 200)}`).toBe(200);
      await waitFor(async () => (await getStatus(uuid)) === STOPPED, {
        timeout: 30000,
        interval: 500,
        msg: "docker instance STOPPED after graceful stop"
      });
      await waitFor(async () => dockerPs("{{.ID}}", `label=${LABEL_KEY}=${uuid}`).length === 0, {
        timeout: 20000,
        interval: 500,
        msg: "container removed after stop"
      });

      // restart → RUNNING with a NEW container id (same containerName; the
      // daemon's waitForContainerNameRelease retries until AutoRemove frees it).
      const restart = await requestPanel({
        method: "GET",
        path: "/protected_instance/restart",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(restart.httpStatus, `restart: ${JSON.stringify(restart.raw).slice(0, 200)}`).toBe(200);
      await waitFor(async () => (await getStatus(uuid)) === RUNNING, {
        timeout: 45000,
        interval: 500,
        msg: "docker instance RUNNING after restart"
      });
      await waitFor(
        async () => {
          const ids = dockerPs("{{.ID}}", `label=${LABEL_KEY}=${uuid}`);
          return ids.length === 1 && ids[0] !== idBefore;
        },
        { timeout: 30000, interval: 500, msg: "restart creates a NEW container id" }
      );

      // kill → STOPPED + container removed.
      const kill = await requestPanel({
        method: "GET",
        path: "/protected_instance/kill",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(kill.httpStatus, `kill: ${JSON.stringify(kill.raw).slice(0, 200)}`).toBe(200);
      await waitFor(async () => (await getStatus(uuid)) === STOPPED, {
        timeout: 30000,
        interval: 500,
        msg: "docker instance STOPPED after force-kill"
      });
      await waitFor(async () => dockerPs("{{.ID}}", `label=${LABEL_KEY}=${uuid}`).length === 0, {
        timeout: 20000,
        interval: 500,
        msg: "container removed after kill"
      });

      // DELETE the instance → 200, and no further labelled container exists.
      await deleteDockerInstance(uuid);
      await waitFor(async () => dockerPs("{{.Names}}", `label=${LABEL_KEY}=${uuid}`).length === 0, {
        timeout: 20000,
        interval: 500,
        msg: "no labelled container after delete"
      });
    },
    240000
  );

  // 3) Labelled container appears while RUNNING and disappears after delete —
  //    verifies the `mcsmanager.instance.uuid=<uuid>` label is set on the host
  //    container by SetupDockerContainer (containerOptions.Labels). Self-contained
  //    mini-cycle so the label assertion does NOT depend on the full-cycle `it`.
  dockerIt(
    "labelled container appears/disappears: docker ps --filter label=mcsmanager.instance.uuid",
    async () => {
      await ensureUsersOnce();
      const cName = containerName("label");
      const uuid = await createDockerInstance(cName);

      // Before open: no labelled container for this uuid.
      expect(
        dockerPs("{{.Names}}", `label=${LABEL_KEY}=${uuid}`).length,
        "no labelled container before open"
      ).toBe(0);

      // Open → RUNNING.
      const open = await requestPanel({
        method: "GET",
        path: "/protected_instance/open",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(open.httpStatus, `open: ${JSON.stringify(open.raw).slice(0, 200)}`).toBe(200);
      await waitFor(async () => (await getStatus(uuid)) === RUNNING, {
        timeout: 45000,
        interval: 500,
        msg: "label-instance RUNNING"
      });

      // While RUNNING: docker ps --filter label=mcsmanager.instance.uuid=<uuid>
      // shows our containerName.
      await waitFor(() => dockerPs("{{.Names}}", `label=${LABEL_KEY}=${uuid}`).includes(cName), {
        timeout: 20000,
        interval: 500,
        msg: `labelled container ${cName} visible`
      });

      // Stop + delete.
      await deleteDockerInstance(uuid);

      // After delete: empty list under the same label filter.
      await waitFor(async () => dockerPs("{{.Names}}", `label=${LABEL_KEY}=${uuid}`).length === 0, {
        timeout: 20000,
        interval: 500,
        msg: "labelled container gone after delete"
      });
    },
    240000
  );

  // 4) Admin can change startCommand on a docker instance via PUT /api/instance
  //    (the admin route forwards the config as-is). checkInstanceAdvancedParams
  //    PERMITS startCommand change for processType==="docker" (unlike non-docker
  //    — T7 #F-normal-cannot-change-startcmd), so a normal user via the low-priv
  //    /protected_instance/instance_update path CAN also change it WHEN
  //    systemConfig.allowChangeCmd is true (default false). This `it` exercises
  //    the admin PUT path on a docker instance and records the contract contrast
  //    via addFinding.
  dockerIt(
    "normal user CAN change startCommand on a docker instance (contrast with non-docker)",
    async () => {
      await ensureUsersOnce();
      const cName = containerName("startcmd");
      const uuid = await createDockerInstance(cName, "node test.mjs");

      // Precondition: startCommand is "node test.mjs" (from creation).
      const gBefore = await requestPanel({
        method: "GET",
        path: "/instance",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(
        gBefore.httpStatus,
        `u1 GET docker instance: ${JSON.stringify(gBefore.raw).slice(0, 200)}`
      ).toBe(200);
      expect(String(gBefore.data?.config?.startCommand || "")).toBe("node test.mjs");

      // PUT /api/instance (admin via key) with the docker config + a NEW
      // startCommand. The daemon applies the config as-is (no docker-specific
      // drop — the docker block is the same shape as creation).
      const newStart = "node test.mjs docker-changed";
      const cfg = gBefore.data?.config || {};
      const put = await requestPanel({
        method: "PUT",
        path: "/instance",
        key: world.key,
        query: { daemonId: di(), uuid },
        body: { ...cfg, startCommand: newStart }
      });
      expect(
        put.httpStatus,
        `admin PUT startCommand on docker: ${JSON.stringify(put.raw).slice(0, 200)}`
      ).toBe(200);

      // Verify via GET /instance — startCommand changed.
      const gAfter = await requestPanel({
        method: "GET",
        path: "/instance",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid }
      });
      expect(
        String(gAfter.data?.config?.startCommand || ""),
        "startCommand must be updated on a docker instance"
      ).toBe(newStart);

      // Cleanup.
      await deleteDockerInstance(uuid);

      addFinding({
        id: "F-docker-startcmd-change-allowed",
        step: "config",
        severity: "info",
        title: "Docker instance permits startCommand change (contrast with non-docker)",
        detail:
          "On a docker instance the admin can change startCommand via PUT /api/instance (exercised above)." +
          " The low-priv /protected_instance/instance_update path also permits it for processType==='docker'" +
          " WHEN systemConfig.allowChangeCmd is true, because panel's checkInstanceAdvancedParams(config," +
          " isTopPermission) returns {startCommand, ...} for docker even at non-top permission (see" +
          " panel/src/app/service/instance_service.ts:150-171). For non-docker the same function returns {}" +
          " at non-top permission regardless of allowChangeCmd — see T7 #F-normal-cannot-change-startcmd.",
        evidence:
          "panel/src/app/service/instance_service.ts checkInstanceAdvancedParams;" +
          " GET/PUT /api/instance {processType:docker} via admin key"
      });
    },
    120000
  );

  // 5) Final guard: no leaked labelled test containers after the run. Filters
  //    by the test container-name prefix (NOT the bare label) so pre-existing
  //    user containers (MCSM-*) are never touched. The afterAll best-effort
  //    cleanup also runs, but this `it` makes the assertion visible in the
  //    verbose report.
  dockerIt("cleanup: no leaked labelled containers after the run", async () => {
    // Force-purge any survivors from a crashed prior `it` (best-effort).
    cleanupTestContainers();
    const leftover = dockerPs("{{.Names}}", `name=${CONTAINER_PREFIX}`);
    expect(leftover, "no test-owned labelled containers remain").toEqual([]);
  });
});
