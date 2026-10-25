import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  world,
  requestPanel,
  ensureUser,
  ensureOwner,
  loginSessionRetry,
  createStream,
  waitForOutput,
  getUploadPassport,
  uploadToDaemon,
  uploadFileChunked,
  getDownloadPassport,
  downloadFromDaemon,
  listFiles,
  waitFor,
  sleep,
  addFinding,
  saveState,
  setDataPlane,
  getDataPlane,
  type Stream
} from "../lib";

// Panel unified data-gateway — BOTH-MODE integration suite (real daemon + real
// panel, no mocks, no network — all local). Verifies that upload, download, and
// terminal I/O work in BOTH `direct` and `proxy` data-plane modes against ONE
// freshly booted real daemon+panel pair. The fresh-install default is `proxy`
// (see the `Install-aware default for dataPlane` spec); the suite explicitly
// flips to `direct` first so both modes are exercised end to end.
//
// This is the load-bearing "addr-driven decoupling" proof: the EXISTING test
// helpers (uploadToDaemon, downloadFromDaemon, uploadFileChunked, createStream,
// getUploadPassport, getDownloadPassport, stream_channel) are used UNCHANGED in
// both modes. The only difference between modes is the `addr` returned by the
// passport/channel endpoints:
//
//   direct: addr = remoteService.config.{addr|fullAddr} (the daemon) — the
//          browser connects directly to the daemon.
//   proxy:  addr = ctx.request.host (the panel) — the panel reverse-proxies the
//          daemon's HTTP data plane (ProxyDataPlane) and bridges socket.io
//          terminal I/O (TerminalBridge). The browser never sees the daemon.
//
// Boots a FRESH REAL pair via globalSetup for this single suite. Self-contained:
// the first `it` ensures users + creates a `node test.mjs` instance via the
// integration-test key, uploads the test.mjs fixture, logs u1 in, opens the
// instance, and polls for RUNNING. Subsequent `it`s reuse the running instance
// to exercise upload/download/terminal in direct then proxy then direct again.

const di = () => world.daemonId;
const iu = () => world.instance.uuid!;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

// Status codes (daemon instance entity):
const RUNNING = 3;

const names = (r: any) => (r?.data?.items || []).map((x: any) => x.name);

// The panel listens on 23333; the daemon on 24444 (both serve HTTP + socket.io
// on the same port). In direct mode the passport addr contains the daemon port;
// in proxy mode it contains the panel port. These helpers assert which port
// appears in the addr so we can prove the mode actually switched.
const panelPort =
  (world.panelUrl.replace(/^https?:\/\//, "").match(/:(\d+)/)?.pop()) || "23333";
const daemonPort =
  (world.daemonHttpUrl.replace(/^https?:\/\//, "").match(/:(\d+)/)?.pop()) || "24444";
const isPanelAddr = (a: any) => String(a ?? "").includes(String(panelPort));
const isDaemonAddr = (a: any) => String(a ?? "").includes(String(daemonPort));

// The verified POST /api/instance create body — uses `nickname` (NOT
// `full_name`); mirrors auth.test.ts it #13 + instance.test.ts/streams.test.ts.
// startCommand is `node test.mjs` so terminal `it`s can drive it immediately.
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
// passport from stream_channel is single-use-ish. Mirrors streams.test.ts.
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
// broadcast to every forwarded socket (direct) or the bridge's relay (proxy).
async function bothSee(s1: Stream, s2: Stream, substr: string): Promise<void> {
  const ok1 = await waitForOutput(s1, (t) => t.includes(substr), 8000);
  const ok2 = await waitForOutput(s2, (t) => t.includes(substr), 1500);
  expect(ok1, `socket1 saw "${substr}"`).toBe(true);
  expect(ok2, `socket2 saw the SAME "${substr}" (broadcast)`).toBe(true);
  s1.stdout.length = 0;
  s2.stdout.length = 0;
}

describe("dataplane: BOTH direct + proxy data-gateway (upload/download/terminal)", () => {
  it("setup: instance RUNNING on node test.mjs (fresh-install default = proxy, then flip to direct)", async () => {
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
    // cannot operate /files/* (per-instance gate).
    await ensureOwner("u1", world.key);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(pp.password, "upload passport must be granted to the owner").toBeTruthy();
    const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
    expect(up.httpStatus, `upload test.mjs: ${JSON.stringify(up.data).slice(0, 200)}`).toBe(200);
    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    expect(
      names(f),
      "test.mjs should be present in the instance cwd"
    ).toContain("test.mjs");

    // Re-login u1 so we have a fresh session for the rest of the suite.
    await loginSessionRetry("u1");

    // Open the instance and poll for RUNNING.
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

    // Fresh-install default mode must be "proxy".
    expect(await getDataPlane(), "fresh-install default dataPlane mode must be proxy").toBe("proxy");

    // In the fresh-install default (proxy) mode, a freshly fetched upload
    // passport must point to the PANEL.
    const ppDefault = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isPanelAddr(ppDefault.addr), "default (proxy) upload addr must be the panel").toBe(true);
    expect(isDaemonAddr(ppDefault.addr), "default (proxy) upload addr must NOT be the daemon").toBe(
      false
    );

    // Flip to direct so the direct-mode tests below run in explicitly-set
    // direct mode (mirroring the `flip to proxy` / `rollback to direct` flips
    // later in the suite).
    const setRes = await setDataPlane("direct");
    expect(
      setRes.httpStatus,
      `setDataPlane(direct): ${JSON.stringify(setRes.raw).slice(0, 200)}`
    ).toBe(200);
    expect(await getDataPlane(), "dataPlane mode must now be direct").toBe("direct");
    await sleep(300);

    // A freshly fetched upload passport must now point to the DAEMON in direct mode.
    const ppCheck = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isDaemonAddr(ppCheck.addr), "direct-mode upload addr must be the daemon").toBe(true);
    expect(isPanelAddr(ppCheck.addr), "direct-mode upload addr must NOT be the panel").toBe(false);
  });

  it("direct: chunked upload -> download byte-identical (addr = daemon)", async () => {
    const content = Buffer.alloc(3 * 1024 * 1024, 0x42);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isDaemonAddr(pp.addr), "direct upload passport addr must be the daemon").toBe(true);
    expect(isPanelAddr(pp.addr), "direct upload passport addr must NOT be the panel").toBe(false);
    const init = await uploadFileChunked({
      addr: pp.addr,
      password: pp.password,
      name: "dp_direct.bin",
      content,
      pieceSize: 2 * 1024 * 1024
    });
    expect(init?.data?.id, "/upload-new must return a tracking id").toBeTruthy();
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("dp_direct.bin");
      },
      { timeout: 15000, msg: "dp_direct.bin visible after chunked upload" }
    );
    const dp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "dp_direct.bin");
    expect(isDaemonAddr(dp.addr), "direct download passport addr must be the daemon").toBe(true);
    expect(isPanelAddr(dp.addr), "direct download passport addr must NOT be the panel").toBe(false);
    const d = await downloadFromDaemon(dp, "dp_direct.bin");
    expect(d.httpStatus, `download dp_direct.bin: ${d.httpStatus}`).toBe(200);
    expect(d.data.length, "downloaded dp_direct.bin must have the uploaded length").toBe(
      content.length
    );
    expect(d.data.equals(content), "downloaded dp_direct.bin must be byte-identical").toBe(true);
  });

  it("direct: terminal stdin->stdout (addr = daemon)", async () => {
    const sc = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(sc.httpStatus, `stream_channel: ${JSON.stringify(sc.raw).slice(0, 200)}`).toBe(200);
    expect(isDaemonAddr(sc.data.addr), "direct stream_channel addr must be the daemon").toBe(true);
    expect(isPanelAddr(sc.data.addr), "direct stream_channel addr must NOT be the panel").toBe(
      false
    );
    const s = createStream(sc.data.addr, sc.data.prefix, sc.data.password);
    expect(await s.ready, "direct stream must be ready").toBe(true);
    await sleep(300);
    s.stdout.length = 0;
    s.send("echo direct1");
    expect(
      await waitForOutput(s, t => t.includes("ECHO:direct1"), 8000),
      "direct terminal must echo ECHO:direct1"
    ).toBe(true);
    s.disconnect();
  });

  it("flip to proxy: upload/download/stream_channel addr becomes the panel", async () => {
    const setRes = await setDataPlane("proxy");
    expect(
      setRes.httpStatus,
      `setDataPlane(proxy): ${JSON.stringify(setRes.raw).slice(0, 200)}`
    ).toBe(200);
    expect(await getDataPlane(), "dataPlane mode must now be proxy").toBe("proxy");
    await sleep(300);

    // Upload passport -> panel addr
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isPanelAddr(pp.addr), "proxy upload passport addr must be the panel").toBe(true);
    expect(isDaemonAddr(pp.addr), "proxy upload passport addr must NOT be the daemon").toBe(false);

    // Download passport -> panel addr
    const dp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "dp_direct.bin");
    expect(isPanelAddr(dp.addr), "proxy download passport addr must be the panel").toBe(true);
    expect(isDaemonAddr(dp.addr), "proxy download passport addr must NOT be the daemon").toBe(
      false
    );

    // Stream channel -> panel addr + empty prefix
    const sc = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      sc.httpStatus,
      `stream_channel (proxy): ${JSON.stringify(sc.raw).slice(0, 200)}`
    ).toBe(200);
    expect(isPanelAddr(sc.data.addr), "proxy stream_channel addr must be the panel").toBe(true);
    expect(isDaemonAddr(sc.data.addr), "proxy stream_channel addr must NOT be the daemon").toBe(
      false
    );
    expect(sc.data.prefix, "proxy stream_channel prefix must be empty").toBe("");

    addFinding({
      id: "F-dataplane-addr-driven",
      step: "dataplane",
      severity: "info",
      title: "Proxy mode returns the panel addr for upload/download/stream_channel",
      detail:
        "When dataPlane='proxy', the panel's /files/upload, /files/download, and" +
        " /protected_instance/stream_channel return ctx.request.host (the panel" +
        " addr) as the addr field — the browser never sees the daemon address. The" +
        " panel reverse-proxies the daemon's HTTP data plane (/download, /upload," +
        " /upload-new, /upload-piece) via ProxyDataPlane and bridges socket.io" +
        " terminal I/O via TerminalBridge. This is the addr-driven decoupling" +
        " mechanism: the EXISTING test helpers (uploadToDaemon, downloadFromDaemon," +
        " uploadFileChunked, createStream) work in BOTH modes UNCHANGED because" +
        " they always connect to the addr returned by the passport/channel endpoint.",
      evidence: `proxy upload addr=${pp.addr}; download addr=${dp.addr}; stream addr=${sc.data.addr} prefix="${sc.data.prefix}"`
    });
  });

  it("proxy: chunked upload -> download byte-identical (streamed through panel)", async () => {
    const content = Buffer.alloc(3 * 1024 * 1024, 0x44);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isPanelAddr(pp.addr), "proxy upload passport addr must be the panel").toBe(true);
    expect(isDaemonAddr(pp.addr), "proxy upload passport addr must NOT be the daemon").toBe(false);
    const init = await uploadFileChunked({
      addr: pp.addr,
      password: pp.password,
      name: "dp_proxy.bin",
      content,
      pieceSize: 2 * 1024 * 1024
    });
    expect(init?.data?.id, "proxy /upload-new must return a tracking id").toBeTruthy();
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("dp_proxy.bin");
      },
      { timeout: 15000, msg: "dp_proxy.bin visible after proxy chunked upload" }
    );
    const dp = await getDownloadPassport(di(), iu(), u1().cookie, u1().token, "dp_proxy.bin");
    expect(isPanelAddr(dp.addr), "proxy download passport addr must be the panel").toBe(true);
    expect(isDaemonAddr(dp.addr), "proxy download passport addr must NOT be the daemon").toBe(
      false
    );
    const d = await downloadFromDaemon(dp, "dp_proxy.bin");
    expect(d.httpStatus, `proxy download dp_proxy.bin: ${d.httpStatus}`).toBe(200);
    expect(d.data.length, "downloaded dp_proxy.bin must have the uploaded length").toBe(
      content.length
    );
    expect(d.data.equals(content), "downloaded dp_proxy.bin must be byte-identical").toBe(true);

    addFinding({
      id: "F-dataplane-proxy-upload-download",
      step: "dataplane",
      severity: "info",
      title: "Proxy mode: chunked upload -> download is byte-identical (streamed through panel)",
      detail:
        "A 3MB buffer uploaded via /upload-new + /upload-piece (reverse-proxied by" +
        " the panel's ProxyDataPlane) and downloaded via /download (also" +
        " reverse-proxied) is byte-identical to the original. The panel streams both" +
        " request and response bodies via stream.pipeline with zero buffering" +
        " (ctx.respond = false), so large files pass through without memory pressure.",
      evidence: `3MB 0x44 buffer; upload init.id=${init?.data?.id}; download length=${d.data.length} equals=${d.data.equals(content)}`
    });
  });

  it("proxy: legacy single-shot upload (multipart) through panel", async () => {
    const tinyPath = path.join(world.workDir, "dp_legacy.bin");
    fs.writeFileSync(tinyPath, Buffer.alloc(2048, 0x43));
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isPanelAddr(pp.addr), "legacy upload passport must be panel (proxy mode)").toBe(true);
    const r = await uploadToDaemon(pp, tinyPath, "dp_legacy.bin", { unzip: false });
    expect(r.httpStatus, `proxy legacy upload: ${JSON.stringify(r.data).slice(0, 200)}`).toBe(200);
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("dp_legacy.bin");
      },
      { timeout: 15000, msg: "dp_legacy.bin visible after proxy legacy upload" }
    );
    expect(
      names(await listFiles(di(), iu(), u1().cookie, u1().token, ".")),
      "dp_legacy.bin must appear in list after proxy legacy upload"
    ).toContain("dp_legacy.bin");
  });

  it("proxy: terminal dual-socket broadcast + stdin + stop (bridged through panel)", async () => {
    const s1 = await openStream();
    const s2 = await openStream();
    expect(await s1.ready, "proxy socket1 must auth+detail via bridge").toBe(true);
    expect(await s2.ready, "proxy socket2 must auth+detail via bridge").toBe(true);
    await sleep(500); // drain any pre-existing stdout (READY/pid banner)
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    // ASCII line + broadcast to s2 through the panel -> daemon -> panel bridge.
    s1.send("echo proxyA");
    await bothSee(s1, s2, "ECHO:proxyA");
    // Chinese (UTF-8) line — must survive the socket.io JSON.stringify path
    // through the panel bridge.
    s1.send("echo 代理测试");
    await bothSee(s1, s2, "ECHO:代理测试");
    // Sum: a different fixture reply — proves the parser routes by token.
    s2.send("sum 7 8");
    await bothSee(s1, s2, "SUM:15");

    addFinding({
      id: "F-dataplane-proxy-terminal-bridge",
      step: "dataplane",
      severity: "info",
      title: "Proxy mode: terminal I/O bridged through panel (dual-socket broadcast + Chinese)",
      detail:
        "In proxy mode, socket.io clients connect to the PANEL (/socket.io) and" +
        " the TerminalBridge forwards stream/auth, stream/input, stream/write to" +
        " the daemon and instance/stdout back to every browser socket on the same" +
        " instance. Two sockets sending echo/sum see each other's output" +
        " (broadcast), and Chinese (UTF-8) survives the panel->daemon->panel" +
        " bridge. This proves the terminal bridge is a faithful relay, not a" +
        " single-socket passthrough.",
      evidence: "s1+s2 both saw ECHO:proxyA, ECHO:代理测试, SUM:15"
    });

    // Stop: open a fresh socket, listen for instance/stopped, call stop.
    // This MUST be the last terminal `it` — the instance is STOPPED after it.
    const ss = await openStream();
    expect(await ss.ready, "proxy stop-listener socket must be ready").toBe(true);
    let stopped = false;
    ss.socket.on("instance/stopped", () => {
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

    const received = await waitFor(
      async () => stopped,
      {
        timeout: 20000,
        interval: 200,
        msg: "proxy socket received instance/stopped packet"
      }
    );
    expect(
      received,
      "proxy socket must receive instance/stopped via bridge after stop"
    ).toBe(true);
    ss.disconnect();
    s1.disconnect();
    s2.disconnect();
  });

  it("rollback to direct: addr returns to daemon", async () => {
    const setRes = await setDataPlane("direct");
    expect(
      setRes.httpStatus,
      `setDataPlane(direct): ${JSON.stringify(setRes.raw).slice(0, 200)}`
    ).toBe(200);
    await sleep(300);
    expect(await getDataPlane(), "dataPlane mode must be back to direct").toBe("direct");
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(
      isDaemonAddr(pp.addr),
      "direct upload passport addr must be the daemon again after rollback"
    ).toBe(true);
    expect(
      isPanelAddr(pp.addr),
      "direct upload passport addr must NOT be the panel after rollback"
    ).toBe(false);
  });
});
