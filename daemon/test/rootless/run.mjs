// Opt-in: run as the local Rootless Docker account, never against customer data.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import dgram from "node:dgram";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const require = createRequire(import.meta.url);
const Docker = require("dockerode");
const { io } = require("socket.io-client");
const archiver = require("archiver");
const { createWriteStream } = require("node:fs");
const daemonDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const socketPath =
  process.env.DOCKER_HOST?.replace(/^unix:\/\//, "") ||
  path.join(process.env.XDG_RUNTIME_DIR || "", "docker.sock");
const docker = new Docker({ socketPath, timeout: 15_000 });
const image = "node:20-bookworm-slim";
const token = crypto.randomBytes(24).toString("hex");
const name = `mcsm-rootless-test-${crypto.randomBytes(6).toString("hex")}`;
const instanceIds = new Set();
let container;
let client;
let root;
let url;
let userImage;
let nativeDaemon;
let daemonRuntime = "container";

async function waitFor(check, label) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out: ${label}`);
}

function request(event, data, channel = client) {
  return new Promise((resolve, reject) => {
    const uuid = crypto.randomUUID();
    const timer = setTimeout(() => finish(new Error(`Timed out: ${event}`)), 30_000);
    const receive = (packet) => {
      if (packet.uuid !== uuid) return;
      finish(
        packet.status === 200 ? undefined : new Error(`${event}: ${JSON.stringify(packet.data)}`),
        packet.data
      );
    };
    function finish(error, result) {
      clearTimeout(timer);
      channel.off(event, receive);
      if (error) reject(error);
      else resolve(result);
    }
    channel.on(event, receive);
    channel.emit(event, { uuid, data });
  });
}

async function execNode(target, code) {
  const exec = await target.exec({
    Cmd: ["node", "-e", code],
    AttachStdout: true,
    AttachStderr: true,
    Tty: true
  });
  const stream = await exec.start({ Tty: true });
  const chunks = [];
  let length = 0;
  const timer = setTimeout(() => stream.destroy(new Error("Test exec timed out")), 15_000);
  try {
    for await (const chunk of stream) {
      length += chunk.length;
      assert(length < 1_048_576, "Excessive test output");
      chunks.push(Buffer.from(chunk));
    }
    assert.equal((await exec.inspect()).ExitCode, 0);
    return Buffer.concat(chunks).toString("utf8").trim();
  } finally {
    clearTimeout(timer);
    stream.destroy();
  }
}

async function passport(instanceUuid) {
  const password = crypto.randomBytes(24).toString("hex");
  await request("passport/register", {
    name: "upload",
    password,
    parameter: { instanceUuid, uploadDir: "." },
    count: 1
  });
  return password;
}

async function upload(instanceUuid, filename, data, chunked = false, unzip = false) {
  const key = await passport(instanceUuid);
  const form = new FormData();
  form.append("file", new Blob([data]), filename);
  let target = `${url}/upload/${key}?unzip=${unzip}`;
  if (chunked) {
    const init = await fetch(
      `${url}/upload-new/${key}?filename=${encodeURIComponent(filename)}&size=${data.length}&unzip=${unzip}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(10_000)
      }
    );
    assert.equal(init.status, 200, await init.clone().text());
    const {
      data: { id }
    } = await init.json();
    target = `${url}/upload-piece/${id}?offset=0`;
  }
  const response = await fetch(target, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(15_000)
  });
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal(await response.text(), "OK");
}

async function zipFixture(entryName = "archive/item.txt") {
  const file = path.join(root, "fixture.zip");
  const archive = archiver("zip");
  const output = createWriteStream(file);
  const done = new Promise((resolve, reject) => {
    output.once("close", resolve);
    output.once("error", reject);
    archive.once("error", reject);
  });
  archive.pipe(output);
  archive.append("extracted\n", { name: entryName, mode: 0o600 });
  await archive.finalize();
  await done;
  return fs.readFile(file);
}

async function udpEcho(port) {
  const socket = dgram.createSocket("udp4");
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Local UDP timed out")), 5000);
      socket.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      socket.once("message", (message) => {
        clearTimeout(timer);
        resolve(message.toString());
      });
      socket.send(Buffer.from("test"), port, "127.0.0.1");
    });
  } finally {
    socket.close();
  }
}

async function testUser(runAs, gameImage = image) {
  const workspace = path.join(root, "instances", runAs ? runAs.replace(":", "-") : "image-user");
  const created = await request("instance/new", {
    nickname: `Rootless test ${runAs}`,
    cwd: workspace,
    processType: "docker",
    runAs,
    startCommand: "node server.js",
    stopCommand: "^C",
    updateCommand: "touch update-marker",
    docker: {
      image: gameImage,
      updateCommandImage: image,
      ports: ["127.0.0.1:0:8211/udp"],
      workingDir: "/data",
      memory: 256,
      cpuUsage: 50
    }
  });
  const instanceUuid = created.instanceUuid;
  instanceIds.add(instanceUuid);
  const file = (event, data) => request(event, { instanceUuid, ...data });
  const server = [
    'const fs = require("fs"), dgram = require("dgram");',
    'fs.appendFileSync("boots", "boot\\n");',
    'for (const file of ["legacy.txt", "chunk.txt", "archive/item.txt", "legacy-extract/item.txt", "chunk-extract/item.txt"]) fs.appendFileSync(file, "game-write\\n");',
    'fs.writeFileSync("private", "private", {mode: 0o600});',
    'fs.writeFileSync("removed-by-game", "remove me"); fs.unlinkSync("removed-by-game");',
    'fs.appendFileSync("moved/nested/file", "game-write\\n");',
    'fs.writeFileSync("moved/nested/sibling", "writable"); fs.renameSync("moved/nested/sibling", "moved/nested/renamed"); fs.unlinkSync("moved/nested/renamed");',
    'if (fs.existsSync("/var/run/docker.sock")) throw new Error("Socket leaked to game");',
    'const udp = dgram.createSocket("udp4"); udp.on("message", (data, peer) => udp.send("pong:" + data, peer.port, peer.address)); udp.bind(8211);',
    'process.stdin.on("data", data => console.log("ECHO:" + data.toString().trim()));',
    'process.on("SIGINT", () => { udp.close(); process.exit(0); });'
  ].join("\n");
  await file("file/touch", { target: "server.js" });
  await file("file/edit", { target: "server.js", text: server });
  await upload(instanceUuid, "legacy.txt", Buffer.from("legacy\n"));
  await upload(instanceUuid, "chunk.txt", Buffer.from("chunk\n"), true);
  await upload(instanceUuid, "archive.zip", await zipFixture());
  await file("file/compress", { source: "archive.zip", targets: ".", type: 0, code: "UTF-8" });
  await upload(
    instanceUuid,
    "legacy-extract.zip",
    await zipFixture("legacy-extract/item.txt"),
    false,
    true
  );
  await upload(
    instanceUuid,
    "chunk-extract.zip",
    await zipFixture("chunk-extract/item.txt"),
    true,
    true
  );
  await waitFor(
    async () => (await file("file/status", {})).instanceFileTask === 0,
    "automatic extraction completion"
  );
  await file("file/edit", { target: "legacy-extract/item.txt" });
  await file("file/edit", { target: "chunk-extract/item.txt" });
  await file("file/mkdir", { target: "nested/directory" });
  await file("file/touch", { target: "nested/directory/new" });
  await file("file/copy", { targets: [["nested", "copied"]] });
  await waitFor(
    () =>
      fs.stat(path.join(workspace, "copied/directory/new")).then(
        () => true,
        () => false
      ),
    "background copy"
  );
  await waitFor(
    async () => (await file("file/status", {})).instanceFileTask === 0,
    "copy ownership completion"
  );
  await execNode(
    container,
    `const fs = require("fs"); const st = fs.statSync(${JSON.stringify(path.join(workspace, "copied/directory/new"))}); if (st.uid !== ${runAs ? Number(runAs.split(":")[0]) : 1000} || st.gid !== ${runAs ? Number(runAs.split(":")[1]) : 1000}) throw new Error("Copied ownership mismatch");`
  );
  await file("file/move", { targets: [["copied/directory/new", "moved/nested/file"]] });
  await execNode(
    container,
    `const fs = require("fs"), path = require("path");
    const root = ${JSON.stringify(path.join(workspace, "moved"))};
    for (const entry of [root, path.join(root, "nested"), path.join(root, "nested/file")]) {
      const st = fs.statSync(entry);
      if (st.uid !== ${runAs ? Number(runAs.split(":")[0]) : 1000} || st.gid !== ${runAs ? Number(runAs.split(":")[1]) : 1000}) throw new Error("Moved ownership mismatch");
    }`
  );
  await file("file/mkdir", { target: "readonly" });
  await file("file/touch", { target: "readonly/file" });
  await execNode(
    container,
    `require("fs").chmodSync(${JSON.stringify(path.join(workspace, "readonly"))}, 0o500);`
  );
  await file("file/copy", { targets: [["readonly", "readonly-copy"]] });
  await waitFor(
    async () => (await file("file/status", {})).instanceFileTask === 0,
    "read-only directory copy"
  );
  await execNode(
    container,
    `const fs = require("fs");
    const root = ${JSON.stringify(workspace)};
    const info = fs.statSync(root + "/readonly-copy");
    if ((info.mode & 0o777) !== 0o500 || !fs.existsSync(root + "/readonly-copy/file")) throw new Error("Read-only copy mismatch");
    fs.chmodSync(root + "/readonly", 0o700); fs.chmodSync(root + "/readonly-copy", 0o700);`
  );
  await request("instance/update", {
    instanceUuid,
    config: {
      updateCommand: "touch host-update-marker",
      docker: { updateCommandImage: "HOST" }
    }
  });
  let updateOutput = "";
  const receiveUpdateOutput = (packet) => {
    updateOutput = (updateOutput + JSON.stringify(packet)).slice(-8192);
  };
  client.on("instance/stdout", receiveUpdateOutput);
  await request("instance/forward", { instanceUuid, forward: true });
  await request("instance/asynchronous", {
    instanceUuid,
    taskName: "update",
    role: 10,
    parameter: {}
  });
  await waitFor(() => updateOutput.includes("HOST"), "HOST rejection");
  await waitFor(
    async () => (await file("instance/detail", {})).status === 0,
    "rejected update stops"
  );
  await request("instance/forward", { instanceUuid, forward: false });
  client.off("instance/stdout", receiveUpdateOutput);
  assert.equal(
    await fs.stat(path.join(workspace, "host-update-marker")).then(
      () => true,
      () => false
    ),
    false
  );
  await request("instance/update", {
    instanceUuid,
    config: { updateCommand: "touch update-marker", docker: { updateCommandImage: image } }
  });
  await request("instance/asynchronous", {
    instanceUuid,
    taskName: "update",
    role: 10,
    parameter: {}
  });
  await waitFor(
    () =>
      fs.stat(path.join(workspace, "update-marker")).then(
        () => true,
        () => false
      ),
    "update"
  );
  await waitFor(async () => (await file("instance/detail", {})).status === 0, "update completion");
  await request("instance/open", { instanceUuids: [instanceUuid] });
  await waitFor(async () => (await file("instance/detail", {})).status === 3, "running");
  const game = docker.getContainer(`MCSM-${instanceUuid.slice(0, 6)}`);
  await waitFor(
    () =>
      fs.stat(path.join(workspace, "private")).then(
        () => true,
        () => false
      ),
    "private file"
  );
  const expectedUid = runAs ? Number(runAs.split(":")[0]) : 1000;
  const report = JSON.parse(
    await execNode(
      game,
      [
        'const fs = require("fs");',
        'const files = ["legacy.txt", "chunk.txt", "archive/item.txt", "legacy-extract/item.txt", "chunk-extract/item.txt", "nested/directory/new", "moved/nested/file", "update-marker"];',
        'console.log(JSON.stringify({uid: process.getuid(), owners: files.map(p => fs.statSync("/data/" + p).uid), memory: fs.readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim(), cpu: fs.readFileSync("/sys/fs/cgroup/cpu.max", "utf8").trim()}));'
      ].join("\n")
    )
  );
  assert.equal(report.uid, expectedUid);
  assert.deepEqual(report.owners, Array(8).fill(expectedUid));
  assert.equal(report.memory, "268435456");
  const gameHostUid = (await fs.stat(`/proc/${(await game.inspect()).State.Pid}`)).uid;
  assert.notEqual(gameHostUid, 0, "Game must not run as host root");
  const [quota, period] = report.cpu.split(" ").map(Number);
  assert.equal(quota / period, 0.5);
  assert.equal(await file("file/edit", { target: "private" }), "private");
  const downloadKey = crypto.randomBytes(24).toString("hex");
  await request("passport/register", {
    name: "download",
    password: downloadKey,
    parameter: { instanceUuid, fileName: "private" },
    count: 1
  });
  const download = await fetch(`${url}/download/${downloadKey}/private`, {
    signal: AbortSignal.timeout(10_000)
  });
  assert.equal(download.status, 200);
  assert.equal(await download.text(), "private");
  await file("file/edit", { target: "private", text: "edited by daemon" });
  assert.equal(
    await execNode(
      game,
      'process.stdout.write(require("fs").readFileSync("/data/private", "utf8"))'
    ),
    "edited by daemon"
  );
  await file("file/delete", { targets: ["private"] });
  await execNode(
    container,
    `require("fs").symlinkSync(${JSON.stringify(root)}, ${JSON.stringify(
      path.join(workspace, "escape")
    )});`
  );
  await assert.rejects(file("file/touch", { target: "escape/tenant-escape" }));
  await assert.rejects(file("file/touch", { target: "../tenant-escape" }));
  assert.equal(
    await fs.stat(path.join(root, "tenant-escape")).then(
      () => true,
      () => false
    ),
    false
  );
  const port = Number((await game.inspect()).NetworkSettings.Ports["8211/udp"][0].HostPort);
  assert.equal(await udpEcho(port), "pong:test");
  const streamKey = crypto.randomBytes(24).toString("hex");
  await request("passport/register", {
    name: "stream_channel",
    password: streamKey,
    parameter: { instanceUuid },
    count: 1
  });
  const consoleSocket = io(url, { transports: ["websocket"], timeout: 5000 });
  try {
    await waitFor(() => consoleSocket.connected, "console socket");
    await request("stream/auth", { password: streamKey }, consoleSocket);
    let output = "";
    consoleSocket.on("instance/stdout", (packet) => {
      output = (output + JSON.stringify(packet)).slice(-8192);
    });
    consoleSocket.emit("stream/input", {
      uuid: crypto.randomUUID(),
      data: { command: "rootless-console-test" }
    });
    await waitFor(() => output.includes("ECHO:rootless-console-test"), "console input/output");
  } finally {
    consoleSocket.close();
  }
  await request("instance/restart", { instanceUuids: [instanceUuid] });
  await waitFor(async () => {
    const output = await execNode(
      container,
      `process.stdout.write(require("fs").readFileSync(${JSON.stringify(
        path.join(workspace, "boots")
      )}, "utf8"));`
    );
    return output.split("boot").length >= 3;
  }, "restart");
  console.log(
    JSON.stringify({
      runAs,
      daemonRuntime,
      ...report,
      gameHostUid,
      uploads: "legacy+chunked",
      unzip: "manual+legacy+chunked",
      privateFile: "read/download/edit/delete",
      console: true,
      update: true,
      hostUpdateRejected: true,
      restart: true,
      localUdp: true,
      isolation: true,
      move: "nested ownership + game write/rename/delete",
      readOnlyDirectoryCopy: true
    })
  );
  await request("instance/kill", { instanceUuids: [instanceUuid] });
  await waitFor(async () => (await file("instance/detail", {})).status === 0, "stopped");
  await request("instance/delete", { instanceUuids: [instanceUuid], deleteFile: true });
  instanceIds.delete(instanceUuid);
}

async function main() {
  assert.equal(process.platform, "linux");
  assert.notEqual(process.getuid(), 0, "Run this harness as the unprivileged host engine account");
  const socket = await fs.stat(socketPath);
  assert(socket.isSocket());
  assert.equal(socket.uid, process.getuid(), "Use only this account's Rootless socket");
  assert(
    (await docker.info()).SecurityOptions.includes("name=rootless"),
    "Rootless engine required"
  );
  await fs.access(path.join(daemonDir, "production/app.js"));
  try {
    await docker.getImage(image).inspect();
  } catch {
    const stream = await docker.pull(image);
    await new Promise((resolve, reject) =>
      docker.modem.followProgress(stream, (error) => (error ? reject(error) : resolve()))
    );
  }
  root = await fs.mkdtemp(path.join(os.tmpdir(), "mcsm-rootless-"));
  await fs.mkdir(path.join(root, "data/Config"), { recursive: true });
  await fs.writeFile(
    path.join(root, "data/Config/global.json"),
    JSON.stringify({ ip: "0.0.0.0", port: 24444, key: token }),
    { mode: 0o600 }
  );
  container = await docker.createContainer({
    name,
    Image: image,
    WorkingDir: root,
    Cmd: ["node", "/opt/mcsm/app.js"],
    Env: ["DOCKER_HOST=unix:///var/run/docker.sock", `MCSM_ROOTLESS_DOCKER_CONTAINER=${name}`],
    ExposedPorts: { "24444/tcp": {} },
    HostConfig: {
      Binds: [
        `${root}:${root}`,
        `${daemonDir}/production/app.js:/opt/mcsm/app.js:ro`,
        `${daemonDir}/lib:${root}/lib:ro`,
        `${socketPath}:/var/run/docker.sock`
      ],
      PortBindings: { "24444/tcp": [{ HostIp: "127.0.0.1", HostPort: "" }] }
    }
  });
  await container.start();
  const daemonHostUid = (await fs.stat(`/proc/${(await container.inspect()).State.Pid}`)).uid;
  assert.equal(daemonHostUid, process.getuid());
  console.log(`Daemon host UID: ${daemonHostUid} (non-root)`);
  const port = (await container.inspect()).NetworkSettings.Ports["24444/tcp"][0].HostPort;
  url = `http://127.0.0.1:${port}`;
  client = io(url, { transports: ["websocket"], timeout: 5000 });
  await waitFor(() => client.connected, "Daemon connection");
  assert.equal(await request("auth", token), true);
  for (const user of ["0:0", "1000:1000"]) await testUser(user);
  const seed = await docker.createContainer({ Image: image });
  try {
    userImage = `${name}:uid1000`;
    await seed.commit({ repo: name, tag: "uid1000", changes: ["USER 1000:1000"] });
    assert.equal((await docker.getImage(userImage).inspect()).Config.User, "1000:1000");
  } finally {
    await seed.remove();
  }
  await testUser("", userImage);
  await testNativeDaemon();
  console.log("Rootless compatibility checks passed (newly built Daemon; no customer data).");
}

async function testNativeDaemon() {
  const nativeDir = path.join(root, "native-daemon");
  await fs.mkdir(path.join(nativeDir, "data/Config"), { recursive: true });
  await fs.cp(path.join(daemonDir, "lib"), path.join(nativeDir, "lib"), { recursive: true });
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", resolve);
  });
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  await fs.writeFile(
    path.join(nativeDir, "data/Config/global.json"),
    JSON.stringify({ ip: "127.0.0.1", port, key: token }),
    { mode: 0o600 }
  );
  nativeDaemon = spawn(process.execPath, [path.join(daemonDir, "production/app.js")], {
    cwd: nativeDir,
    env: {
      ...process.env,
      DOCKER_HOST: `unix://${socketPath}`,
      MCSM_ROOTLESS_DOCKER_CONTAINER: name
    },
    stdio: "ignore"
  });
  client.close();
  url = `http://127.0.0.1:${port}`;
  client = io(url, { transports: ["websocket"], timeout: 5000 });
  await waitFor(() => client.connected, "native Daemon connection");
  assert.equal((await fs.stat(`/proc/${nativeDaemon.pid}`)).uid, process.getuid());
  assert.equal(await request("auth", token), true);
  daemonRuntime = "host";
  await testUser("0:0");

  const workspace = path.join(root, "instances/unsupported-host-user");
  const { instanceUuid } = await request("instance/new", {
    cwd: workspace,
    processType: "docker",
    runAs: "1000:1000",
    docker: { image }
  });
  instanceIds.add(instanceUuid);
  await fs.writeFile(path.join(workspace, "existing"), "original");
  await assert.rejects(upload(instanceUuid, "existing", Buffer.from("overwritten")));
  await assert.rejects(upload(instanceUuid, "existing", Buffer.from("overwritten"), true));
  assert.equal(await fs.readFile(path.join(workspace, "existing"), "utf8"), "original");
  await request("instance/delete", { instanceUuids: [instanceUuid], deleteFile: true });
  instanceIds.delete(instanceUuid);
  console.log("Native non-root Daemon: UID 0 passes; UID 1000 uploads rejected before overwrite.");
}

async function cleanup() {
  client?.close();
  if (nativeDaemon && nativeDaemon.exitCode === null) {
    const stopped = new Promise((resolve) => nativeDaemon.once("exit", resolve));
    nativeDaemon.kill("SIGTERM");
    const timer = setTimeout(() => nativeDaemon.kill("SIGKILL"), 5000);
    try {
      await stopped;
    } finally {
      clearTimeout(timer);
    }
  }
  for (const id of instanceIds) {
    await docker
      .getContainer(`MCSM-${id.slice(0, 6)}`)
      .remove({ force: true })
      .catch((error) => {
        if (error.statusCode !== 404) throw error;
      });
  }
  if (container) {
    if (root && (await container.inspect()).State.Running) {
      // Namespace root can remove subordinate-owned test files; the host user cannot.
      await execNode(
        container,
        `const fs = require("fs"); fs.rmSync(${JSON.stringify(
          path.join(root, "instances")
        )}, {recursive: true, force: true});`
      );
    }
    await container.remove({ force: true });
  }
  if (root) await fs.rm(root, { recursive: true, force: true });
  if (userImage) await docker.getImage(userImage).remove();
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
}
