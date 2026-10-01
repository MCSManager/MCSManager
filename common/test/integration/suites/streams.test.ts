import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  world,
  requestPanel,
  ensureUser,
  ensureOwner,
  loginSessionRetry,
  createStream,
  waitForOutput,
  collectText,
  getUploadPassport,
  uploadToDaemon,
  listFiles,
  waitFor,
  sleep,
  addFinding,
  saveState,
  type Stream
} from "../lib";

// Instance I/O streams — multi-socket integration suite (real daemon + real
// panel over socket.io, no mocks, no network — all local: a `node test.mjs`
// instance + socket.io clients connecting DIRECTLY to the daemon).
//
// Boots a FRESH REAL pair via globalSetup for this single suite. Self-contained:
// the first `it` creates a `node test.mjs` instance via the integration-test key
// (POST /api/instance with the verified `nickname` body — same shape as
// auth.test.ts it #13 + instance.test.ts/files.test.ts), uploads the test.mjs
// fixture into the cwd, assigns the instance to u1, logs u1 in, opens it, and
// polls for RUNNING. Subsequent `it`s reuse the running instance and open
// stream channels on it via POST /protected_instance/stream_channel.
//
// Stream channel: POST /protected_instance/stream_channel (u1, ?daemonId&uuid)
// -> 200 -> r.data.{addr,prefix,password} -> createStream(addr, prefix,
// password) -> await stream.ready (true on auth+detail). Each socket needs
// its OWN channel (the passport is single-use-ish) — the legacy panel/test/
// integration/integration.test.ts step 10 calls `stream_channel` twice for two
// sockets; this suite mirrors that. The socket connects DIRECTLY to the daemon
// (panel socket_router is dead code).
//
// Coverage matrix (see task-9-brief):
//   open + setup · dual-socket broadcast (ASCII + Chinese) [Review Focus #5]
//   multi-line back-to-back ordering · both sockets can WRITE
//   disconnect → other socket still receives · command injection inert
//   (F-cmd-injection-inert) · wrong-password auth fails · non-owner u2 → 403
//   stop delivers instance/stopped to attached sockets (stretch).

const di = () => world.daemonId;
const iu = () => world.instance.uuid!;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

// Status codes (daemon instance entity):
const RUNNING = 3;

// The verified POST /api/instance create body — uses `nickname` (NOT
// `full_name`); mirrors auth.test.ts it #13 + instance.test.ts/files.test.ts.
// startCommand is `node test.mjs` so the stream `it`s can drive it immediately.
const createBody = () => ({
  nickname: world.instance.name,
  startCommand: "node test.mjs",
  stopCommand: "exit",
  cwd: "",
  ie: "utf-8",
  oe: "utf-8"
});

// Read the instance status via the OWNER's session. The integration-test key
// CANNOT read a specific instance (per-instance gate handler-throws -> 500),
// so this helper always uses u1.
async function getStatus(): Promise<number> {
  const r = await requestPanel({
    method: "GET",
    path: "/instance",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid: iu() }
  });
  return r?.data?.status ?? -99;
}

// Open ONE stream channel + connect ONE socket. Call once per socket — the
// passport from stream_channel is single-use-ish (the legacy step 10 calls
// stream_channel twice for two sockets; this helper mirrors that).
async function openStream(): Promise<Stream> {
  const sc = await requestPanel({
    method: "POST",
    path: "/protected_instance/stream_channel",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid: iu() }
  });
  expect(sc.httpStatus, `stream_channel: ${JSON.stringify(sc.raw).slice(0, 200)}`).toBe(200);
  expect(sc.data?.addr, "stream_channel must return addr").toBeTruthy();
  expect(sc.data?.password, "stream_channel must return password").toBeTruthy();
  return createStream(sc.data.addr, sc.data.prefix, sc.data.password);
}

// bothSee: assert BOTH sockets see the same substring. s1 sees it via echo
// (the daemon stdout from its own command), s2 sees it via the daemon's
// broadcast to every forwarded socket. The 8s/1.5s timeouts are the existing
// pattern (legacy step 10): s1 first (longer — it must round-trip), then s2
// (shorter — broadcast should already be in its buffer by then).
async function bothSee(s1: Stream, s2: Stream, substr: string): Promise<void> {
  const ok1 = await waitForOutput(s1, (t) => t.includes(substr), 8000);
  const ok2 = await waitForOutput(s2, (t) => t.includes(substr), 1500);
  expect(ok1, `socket1 saw "${substr}"`).toBe(true);
  expect(ok2, `socket2 saw the SAME "${substr}" (broadcast)`).toBe(true);
  s1.stdout.length = 0;
  s2.stdout.length = 0;
}

describe("streams: instance I/O multi-socket (broadcast/injection/auth/stop)", () => {
  it("open + setup: instance RUNNING on node test.mjs", async () => {
    // Ensure users: admin + u1 + u2 (perm 1 fallback — admin routes below are
    // reached via the KEY, not via world.admin's cookie). All three logins are
    // stored on world so later `it`s can use them.
    world.admin.uuid = await ensureUser("admin", world.key);
    world.u1.uuid = await ensureUser("u1", world.key);
    world.u2.uuid = await ensureUser("u2", world.key);
    saveState();
    expect(world.u1.uuid).toBeTruthy();

    // Create the bare-lifecycle instance via the KEY (bypasses the admin
    // permission gate on POST /api/instance). The daemon's instance/new
    // accepts a `nickname` config and returns `instanceUuid`.
    const r = await requestPanel({
      method: "POST",
      path: "/instance",
      key: world.key,
      query: { daemonId: di() },
      body: createBody()
    });
    expect(r.httpStatus, `create instance: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
    expect(r.data?.instanceUuid, "create must return instanceUuid").toBeTruthy();
    world.instance.uuid = r.data.instanceUuid;
    saveState();

    // Assign to u1 BEFORE uploading so u1 owns the files too. Then upload the
    // test.mjs fixture into the cwd using u1's real session — the KEY alone
    // cannot operate /files/* (per-instance gate, auth.test.ts
    // #F-key-not-instance-admin).
    await ensureOwner("u1", world.key);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(pp.password, "upload passport must be granted to the owner").toBeTruthy();
    const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
    expect(up.httpStatus, `upload test.mjs: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(200);
    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    expect(
      (f?.data?.items || []).map((x: any) => x.name),
      "test.mjs should be present in the instance cwd"
    ).toContain("test.mjs");

    // Re-login u1 so we have a fresh session for the rest of the suite.
    await loginSessionRetry("u1");

    // Open the instance and poll for RUNNING (the daemon enforces a 2s start
    // guard before STATUS_STARTING; allow up to 25s).
    const open = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(open.httpStatus, `open: ${JSON.stringify(open.raw).slice(0, 200)}`).toBe(200);
    await waitFor(async () => (await getStatus()) === RUNNING, {
      timeout: 25000,
      interval: 500,
      msg: "instance RUNNING after open"
    });
    expect(await getStatus()).toBe(RUNNING);
  });

  // Review Focus #5 — dual-socket broadcast: open two channels+sockets, send
  // commands on s1, assert s2 receives the SAME bytes (the daemon's
  // instance/stdout forward path broadcasts to every forwarded socket).
  it("dual-socket broadcast: both sockets see the same ASCII + Chinese line", async () => {
    const s1 = await openStream();
    const s2 = await openStream();
    expect(await s1.ready, "socket1 must auth+detail").toBe(true);
    expect(await s2.ready, "socket2 must auth+detail").toBe(true);
    await sleep(500); // drain any pre-existing stdout (READY/pid banner)
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    // ASCII line + the same line broadcast to s2.
    s1.send("echo hello");
    await bothSee(s1, s2, "ECHO:hello");
    // Chinese (UTF-8) line — must survive the socket.io JSON.stringify path.
    s1.send("echo 你好世界");
    await bothSee(s1, s2, "ECHO:你好世界");
    // Sum (a different fixture reply — proves the parser routes by token).
    s1.send("sum 2 3");
    await bothSee(s1, s2, "SUM:5");

    s1.disconnect();
    s2.disconnect();
  });

  it("multi-line back-to-back ordering on both sockets", async () => {
    const s1 = await openStream();
    const s2 = await openStream();
    expect(await s1.ready).toBe(true);
    expect(await s2.ready).toBe(true);
    await sleep(300);
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    // Two commands sent back-to-back without awaiting between them. The
    // daemon writes both to stdout in order; both sockets must see both
    // lines in the same order.
    s1.send("echo a");
    s1.send("echo b");
    await sleep(600);
    const t1 = collectText(s1);
    const t2 = collectText(s2);
    expect(t1, "s1 must contain ECHO:a").toContain("ECHO:a");
    expect(t1, "s1 must contain ECHO:b").toContain("ECHO:b");
    expect(t2, "s2 (broadcast) must contain ECHO:a").toContain("ECHO:a");
    expect(t2, "s2 (broadcast) must contain ECHO:b").toContain("ECHO:b");

    s1.disconnect();
    s2.disconnect();
  });

  it("both sockets can WRITE; s2.send('pid') → both see PID:", async () => {
    // s2 (not s1) issues the command — proves both sockets can WRITE to the
    // instance stdin, not just the first-opened one.
    const s1 = await openStream();
    const s2 = await openStream();
    expect(await s1.ready).toBe(true);
    expect(await s2.ready).toBe(true);
    await sleep(300);
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    s2.send("pid");
    await bothSee(s1, s2, "PID:");

    s1.disconnect();
    s2.disconnect();
  });

  it("disconnect s1 → s1.connected false; s2 still receives", async () => {
    const s1 = await openStream();
    const s2 = await openStream();
    expect(await s1.ready).toBe(true);
    expect(await s2.ready).toBe(true);
    await sleep(300);
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    s1.disconnect();
    await sleep(400);
    expect(s1.socket.connected, "s1 must be disconnected").toBe(false);

    // s2 still receives broadcast output from its own command — the daemon's
    // forward set drops s1 but keeps s2.
    s2.send("echo after");
    const ok2 = await waitForOutput(s2, (t) => t.includes("ECHO:after"), 8000);
    expect(ok2, "s2 must still receive output after s1 disconnected").toBe(true);

    s2.disconnect();
  });

  it("command injection inert: echo x; rm -rf / → ECHO:x; rm -rf / (literal, no shell)", async () => {
    // The daemon spawns startCommand WITHOUT a shell — stream/input writes the
    // line directly to the child's stdin. test.mjs splits on the first space
    // and treats the rest as the echo arg, so shell metacharacters (`;`,
    // `$()`, backticks) are echoed literally and are NOT interpreted.
    const s = await openStream();
    expect(await s.ready).toBe(true);
    await sleep(300);
    s.stdout.length = 0;

    s.send("echo x; rm -rf /");
    expect(await waitForOutput(s, (t) => t.includes("ECHO:x; rm -rf /"), 6000)).toBe(true);
    s.send("echo $(reboot)");
    expect(await waitForOutput(s, (t) => t.includes("ECHO:$(reboot)"), 6000)).toBe(true);
    s.send("echo `whoami`");
    expect(await waitForOutput(s, (t) => t.includes("ECHO:`whoami`"), 6000)).toBe(true);

    s.disconnect();
    addFinding({
      id: "F-cmd-injection-inert",
      step: "streams",
      severity: "info",
      title: "Command injection via stream/input is inert (no shell)",
      detail:
        "stream/input sends each line to the process stdin; node test.mjs echoes the" +
        " literal — the daemon spawns startCommand without a shell, so shell metacharacters" +
        " (`;`, `$()`, backticks) are NOT interpreted. Good security.",
      evidence:
        "all three injection payloads (echo x; rm -rf /, echo $(reboot), echo `whoami`) echoed literally"
    });
  });

  it("stream/auth wrong password → ready resolves false", async () => {
    // Open a channel to get a valid addr/prefix, then connect with a WRONG
    // password. The daemon's stream/auth handler rejects -> ready resolves
    // false (createStream resolves ready=false on auth failure or 15s timeout).
    const sc = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      sc.httpStatus,
      `stream_channel precondition: ${JSON.stringify(sc.raw).slice(0, 200)}`
    ).toBe(200);
    const s = createStream(sc.data.addr, sc.data.prefix, "WRONG-PASSWORD");
    expect(await s.ready, "wrong password must NOT auth").toBe(false);
    s.disconnect();
  });

  it("non-owner u2 POST /protected_instance/stream_channel → 403", async () => {
    // u2 exists but does NOT own the instance. The per-instance gate on
    // stream_channel rejects u2 — the integration-test key bypasses panel
    // `permission` only, NOT the per-instance gate (auth.test.ts
    // #F-key-not-instance-admin). Use u2's REAL cookie+token (the KEY would
    // bypass the panel gate entirely).
    await ensureUser("u2", world.key);
    await loginSessionRetry("u2");
    const r = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: world.u2.cookie,
      token: world.u2.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      r.httpStatus,
      "u2 must NOT open a stream channel on u1's instance (per-instance gate)"
    ).toBe(403);
  });

  // Stretch: open a channel+socket, listen for the `instance/stopped` packet
  // (the daemon's instance_event_router.ts emits it via protocol.msg to all
  // forwarded sockets on instance exit), then call /protected_instance/stop
  // and assert the socket receives the packet within a few seconds. This MUST
  // be the last `it` — the instance is STOPPED after it (no later `it` can
  // reuse it). globalSetup's teardown deletes the (now stopped) instance.
  it("stop delivers instance/stopped to attached sockets", async () => {
    const s = await openStream();
    expect(await s.ready).toBe(true);
    let stopped = false;
    s.socket.on("instance/stopped", () => {
      stopped = true;
    });

    const r = await requestPanel({
      method: "GET",
      path: "/protected_instance/stop",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(r.httpStatus, `stop: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);

    // The fixture exits on `exit` after writing "BYE"; the daemon emits
    // instance/stopped to all forwarded sockets. Allow generous time.
    const received = await waitFor(async () => stopped, {
      timeout: 20000,
      interval: 200,
      msg: "socket received instance/stopped packet"
    });
    expect(received, "attached socket must receive instance/stopped on stop").toBe(true);
    s.disconnect();
  });
});
