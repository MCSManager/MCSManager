import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import axios from "axios";
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
  readFileText,
  waitFor,
  sleep,
  addFinding,
  saveState,
  setDataPlane,
  getDataPlane,
  setUserInstances,
  type Stream
} from "../lib";

// Panel unified data-gateway — PROXY-mode advanced integration suite (real
// daemon + real panel, no mocks, no network — all local). Covers three angles:
// PENTEST (authorization boundary + token hardening), FUNCTIONAL (concurrent
// upload/download/terminal), and PERFORMANCE (parallel download wall-clock).
//
// Boots a FRESH REAL pair via globalSetup for this single suite. Self-contained:
// the first `it` ensures users + creates a `node test.mjs` instance via the
// integration-test key, makes BOTH u1 AND u2 own it, uploads the test.mjs
// fixture, opens the instance, and switches to proxy mode. Subsequent `it`s
// exercise concurrent uploads/downloads/terminal in proxy, then revoke u2 to
// test the authorization boundary, then test token hardening (single-use,
// op-mismatch, forged tokens), and finally rollback to direct.
//
// All proxy data-plane calls go to the PANEL (world.panelUrl, port 23333) —
// the panel reverse-proxies the daemon's HTTP data plane (ProxyDataPlane) and
// bridges socket.io terminal I/O (TerminalBridge). The existing helpers
// (uploadToDaemon, downloadFromDaemon, uploadFileChunked, createStream) are
// addr-driven and work unchanged because the passport addr = panel host.

const di = () => world.daemonId;
const iu = () => world.instance.uuid!;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const u2 = () => ({ cookie: world.u2.cookie!, token: world.u2.token! });
const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

// Status codes (daemon instance entity):
const RUNNING = 3;

const names = (r: any) => (r?.data?.items || []).map((x: any) => x.name);

// Port helpers — same as dataplane.test.ts. In proxy mode the passport addr
// contains the panel port (23333); in direct mode it contains the daemon
// port (24444).
const panelPort =
  (world.panelUrl.replace(/^https?:\/\//, "").match(/:(\d+)/)?.pop()) || "23333";
const daemonPort =
  (world.daemonHttpUrl.replace(/^https?:\/\//, "").match(/:(\d+)/)?.pop()) || "24444";
const isPanelAddr = (a: any) => String(a ?? "").includes(String(panelPort));
const isDaemonAddr = (a: any) => String(a ?? "").includes(String(daemonPort));

// The panel base URL for raw-axios calls (e.g. forged-token tests).
const panelBase = world.panelUrl; // http://127.0.0.1:23333

// The verified POST /api/instance create body — uses `nickname` (NOT
// `full_name`); mirrors dataplane.test.ts + streams.test.ts.
// startCommand is `node test.mjs` so terminal `it`s can drive it immediately.
const createBody = () => ({
  nickname: world.instance.name,
  startCommand: "node test.mjs",
  stopCommand: "exit",
  cwd: "",
  ie: "utf-8",
  oe: "utf-8"
});

// Read the instance status via the OWNER's session.
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

// Open ONE stream channel + connect ONE socket for the given user.
// Each socket needs its OWN channel (stream tokens are connection-level
// one-time). Mirrors dataplane.test.ts openStream but parameterized by user.
async function openStream(user: { cookie: string; token: string }): Promise<Stream> {
  const sc = await requestPanel({
    method: "POST",
    path: "/protected_instance/stream_channel",
    cookie: user.cookie,
    token: user.token,
    query: { daemonId: di(), uuid: iu() }
  });
  expect(
    sc.httpStatus,
    `stream_channel: ${JSON.stringify(sc.raw).slice(0, 200)}`
  ).toBe(200);
  expect(sc.data?.addr, "stream_channel must return addr").toBeTruthy();
  expect(sc.data?.password, "stream_channel must return password").toBeTruthy();
  return createStream(sc.data.addr, sc.data.prefix, sc.data.password);
}

// bothSee: assert BOTH sockets see the same substring. s1 sees it via echo
// (the daemon stdout from its own command), s2 sees it via the bridge's
// broadcast to every connected browser on the same instance.
async function bothSee(s1: Stream, s2: Stream, substr: string): Promise<void> {
  const ok1 = await waitForOutput(s1, (t) => t.includes(substr), 8000);
  const ok2 = await waitForOutput(s2, (t) => t.includes(substr), 1500);
  expect(ok1, `socket1 saw "${substr}"`).toBe(true);
  expect(ok2, `socket2 saw the SAME "${substr}" (broadcast)`).toBe(true);
  s1.stdout.length = 0;
  s2.stdout.length = 0;
}

describe("proxy_advanced: panel unified data-gateway PROXY mode (pentest+functional+performance)", () => {
  // ---- A. Setup ----

  it("setup: instance RUNNING, owned by u1 AND u2, proxy mode", async () => {
    // Ensure users: admin + u1 + u2.
    world.admin.uuid = await ensureUser("admin", world.key);
    world.u1.uuid = await ensureUser("u1", world.key);
    world.u2.uuid = await ensureUser("u2", world.key);
    saveState();
    expect(world.u1.uuid).toBeTruthy();
    expect(world.u2.uuid).toBeTruthy();

    // Create the instance via the KEY (bypasses admin permission gate).
    const r = await requestPanel({
      method: "POST",
      path: "/instance",
      key: world.key,
      query: { daemonId: di() },
      body: createBody()
    });
    expect(
      r.httpStatus,
      `create instance: ${JSON.stringify(r.raw).slice(0, 200)}`
    ).toBe(200);
    expect(r.data?.instanceUuid, "create must return instanceUuid").toBeTruthy();
    world.instance.uuid = r.data.instanceUuid;
    saveState();

    // BOTH u1 AND u2 own the instance.
    await ensureOwner("u1", world.key);
    await ensureOwner("u2", world.key);

    // Upload test.mjs fixture (direct mode at this point). Use the chunked
    // path so the daemon logs "Browser Uploaded File" for diagnostics.
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(
      pp.password,
      "upload passport must be granted to the owner"
    ).toBeTruthy();
    const fixtureContent = fs.readFileSync(FIXTURE);
    const upInit = await uploadFileChunked({
      addr: pp.addr,
      password: pp.password,
      name: "test.mjs",
      content: fixtureContent,
      pieceSize: 2 * 1024 * 1024
    });
    expect(upInit?.data?.id, "chunked upload must return tracking id").toBeTruthy();
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("test.mjs");
      },
      { timeout: 15000, msg: "test.mjs visible after chunked upload" }
    );
    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    expect(
      names(f),
      "test.mjs should be present in the instance cwd"
    ).toContain("test.mjs");
    // Verify the file content is correct (not empty/corrupted).
    const readBack = await readFileText(di(), iu(), u1().cookie, u1().token, "test.mjs");
    expect(
      String(readBack.data || "").length,
      "test.mjs content must be readable and non-empty"
    ).toBeGreaterThan(100);

    // Re-login u1 for a fresh session.
    await loginSessionRetry("u1");

    // Open the instance and poll for RUNNING.
    const open = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      open.httpStatus,
      `open: ${JSON.stringify(open.raw).slice(0, 200)}`
    ).toBe(200);
    await waitFor(async () => (await getStatus()) === RUNNING, {
      timeout: 25000,
      interval: 500,
      msg: "instance RUNNING after open"
    });
    expect(await getStatus()).toBe(RUNNING);

    // Switch to proxy mode.
    const setRes = await setDataPlane("proxy");
    expect(
      setRes.httpStatus,
      `setDataPlane(proxy): ${JSON.stringify(setRes.raw).slice(0, 200)}`
    ).toBe(200);
    expect(await getDataPlane(), "dataPlane mode must be proxy").toBe("proxy");
    saveState();
  });

  // ---- B. FUNCTIONAL + PERFORMANCE: concurrency (both u1+u2 own) ----

  it("perf+func: 4 concurrent downloads (u1+u2 mix) → all byte-identical, within bound", async () => {
    // Upload a ~6MB file via u1 chunked (proxy mode).
    const bigBuf = Buffer.alloc(6 * 1024 * 1024, 0x7a);
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(isPanelAddr(pp.addr), "proxy upload passport addr must be the panel").toBe(true);
    expect(isDaemonAddr(pp.addr), "proxy upload passport addr must NOT be the daemon").toBe(false);
    const init = await uploadFileChunked({
      addr: pp.addr,
      password: pp.password,
      name: "big_concurrent.bin",
      content: bigBuf,
      pieceSize: 2 * 1024 * 1024
    });
    expect(init?.data?.id, "proxy /upload-new must return a tracking id").toBeTruthy();
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("big_concurrent.bin");
      },
      { timeout: 15000, msg: "big_concurrent.bin visible after chunked upload" }
    );

    // Issue 4 download passports SEQUENTIALLY (alternating u1/u2 to avoid any
    // /files/download speedLimit cooldown).
    const sessions = [u1(), u2(), u1(), u2()];
    const dps: { password: string; addr: string; remoteMappings: any[] }[] = [];
    for (let i = 0; i < 4; i++) {
      dps.push(
        await getDownloadPassport(
          di(),
          iu(),
          sessions[i].cookie,
          sessions[i].token,
          "big_concurrent.bin"
        )
      );
      expect(isPanelAddr(dps[i].addr), `download passport ${i} addr must be panel`).toBe(true);
    }

    // Fire all 4 downloads concurrently.
    const t0 = Date.now();
    const res = await Promise.all(
      dps.map((dp) => downloadFromDaemon(dp, "big_concurrent.bin"))
    );
    const dt = Date.now() - t0;

    // Assert all 4 are byte-identical to the uploaded buffer.
    for (let i = 0; i < 4; i++) {
      expect(res[i].httpStatus, `download ${i} httpStatus`).toBe(200);
      expect(res[i].data.length, `download ${i} length`).toBe(bigBuf.length);
      expect(res[i].data.equals(bigBuf), `download ${i} byte-identical`).toBe(true);
    }
    expect(dt, "4 concurrent downloads must complete within 25s").toBeLessThan(25000);

    addFinding({
      id: "F-proxy-advanced-concurrent-download",
      step: "proxy_advanced",
      severity: "info",
      title: "Proxy mode: 4 concurrent downloads byte-identical within performance bound",
      detail:
        "4 concurrent downloads of a 6MB file (alternating u1/u2 sessions) through the" +
        " panel's proxy data plane all return HTTP 200 and are byte-identical to the" +
        " uploaded content. The panel streams each response via stream.pipeline with" +
        " zero buffering, so concurrent downloads do not cause memory pressure.",
      evidence: `4x6MB downloads; wall-clock=${dt}ms; all 200 + byte-identical`
    });
  });

  it("func: 4 concurrent uploads (distinct names, u1+u2 mix) → all appear", async () => {
    // Issue 4 upload passports SEQUENTIALLY (u1/u2 mix).
    const sessions = [u1(), u2(), u1(), u2()];
    const passports: { password: string; addr: string; remoteMappings: any[] }[] = [];
    for (let i = 0; i < 4; i++) {
      passports.push(
        await getUploadPassport(di(), iu(), sessions[i].cookie, sessions[i].token, ".")
      );
    }
    const uploadNames = ["conc_0.bin", "conc_1.bin", "conc_2.bin", "conc_3.bin"];

    // Fire all 4 uploads concurrently (each 1MB).
    await Promise.all(
      passports.map((pp, i) =>
        uploadFileChunked({
          addr: pp.addr,
          password: pp.password,
          name: uploadNames[i],
          content: Buffer.alloc(1 * 1024 * 1024, 0x40 + i)
        })
      )
    );

    // Wait for all 4 to appear in the file list.
    for (const name of uploadNames) {
      await waitFor(
        async () => {
          const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
          return names(f).includes(name);
        },
        { timeout: 15000, msg: `${name} visible after concurrent upload` }
      );
    }
    const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
    const fileNames = names(f);
    for (const name of uploadNames) {
      expect(fileNames, `${name} must appear in list`).toContain(name);
    }
  });

  it("func: concurrent upload + download (u1 uploads while u2 downloads)", async () => {
    const bigBuf = Buffer.alloc(6 * 1024 * 1024, 0x7a); // same as big_concurrent.bin

    // Issue u2's download passport BEFORE Promise.all to avoid cooldown.
    const u2dp = await getDownloadPassport(
      di(),
      iu(),
      u2().cookie,
      u2().token,
      "big_concurrent.bin"
    );
    const u1pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");

    // u1 uploads "interleave.bin" while u2 downloads "big_concurrent.bin".
    const [, dlRes] = await Promise.all([
      uploadFileChunked({
        addr: u1pp.addr,
        password: u1pp.password,
        name: "interleave.bin",
        content: Buffer.alloc(512 * 1024, 0x55),
        pieceSize: 512 * 1024
      }),
      downloadFromDaemon(u2dp, "big_concurrent.bin")
    ]);

    expect(dlRes.httpStatus, "concurrent download must be 200").toBe(200);
    expect(dlRes.data.length, "concurrent download length").toBe(bigBuf.length);
    expect(
      dlRes.data.equals(bigBuf),
      "concurrent download must be byte-identical"
    ).toBe(true);

    // Verify the upload appears.
    await waitFor(
      async () => {
        const f = await listFiles(di(), iu(), u1().cookie, u1().token, ".");
        return names(f).includes("interleave.bin");
      },
      { timeout: 15000, msg: "interleave.bin visible after concurrent upload" }
    );
  });

  it("func: multiple users (u1+u2) terminal on the SAME instance → broadcast to both (bridge fan-out + connection reuse)", async () => {
    const s1 = await openStream(u1());
    const s2 = await openStream(u2());
    expect(await s1.ready, "u1 stream must be ready").toBe(true);
    expect(await s2.ready, "u2 stream must be ready").toBe(true);
    await sleep(500); // drain any pre-existing stdout (READY/pid banner)
    s1.stdout.length = 0;
    s2.stdout.length = 0;

    // u1 sends echo — both sockets must see it (u2 via bridge broadcast).
    s1.send("echo userBcast");
    await bothSee(s1, s2, "ECHO:userBcast");

    // u2 sends sum — both sockets must see it (proves u2's stdin forwards to
    // daemon AND broadcast to u1 through the panel bridge).
    s2.send("sum 11 22");
    await bothSee(s1, s2, "SUM:33");

    s1.disconnect();
    s2.disconnect();

    addFinding({
      id: "F-proxy-advanced-multi-user-bridge",
      step: "proxy_advanced",
      severity: "info",
      title: "Proxy mode: multi-user terminal on same instance (bridge fan-out + connection reuse)",
      detail:
        "Two different users (u1, u2) both owning the same instance open terminal streams" +
        " through the panel bridge. u1's command (echo userBcast) is broadcast to u2's" +
        " socket, and u2's command (sum 11 22) is forwarded to the daemon AND broadcast" +
        " back to u1. This proves the panel bridge fans out instance/stdout to every" +
        " connected browser on the same instance, regardless of which user issued the" +
        " command.",
      evidence: "s1+s2 both saw ECHO:userBcast (from u1) and SUM:33 (from u2)"
    });
  });

  // ---- C. PENTEST: authorization boundary (REVOKE u2) ----

  it("setup: revoke u2 ownership — instance now u1-only", async () => {
    // Revoke u2's ownership (set instances to empty).
    await setUserInstances(world.key, world.u2.uuid!, []);

    // Verify via /auth/overview: u1 still owns, u2 does NOT.
    const ov = await requestPanel({
      method: "GET",
      path: "/auth/overview",
      key: world.key
    });
    const u1Entry = (ov.data || []).find((x: any) => x.uuid === world.u1.uuid);
    const u2Entry = (ov.data || []).find((x: any) => x.uuid === world.u2.uuid);
    const u1Owns = u1Entry?.instances?.some(
      (x: any) => x.daemonId === di() && x.instanceUuid === iu()
    );
    const u2Owns = u2Entry?.instances?.some(
      (x: any) => x.daemonId === di() && x.instanceUuid === iu()
    );
    expect(u1Owns, "u1 must still own the instance after revoke").toBe(true);
    expect(u2Owns, "u2 must NOT own the instance after revoke").toBe(false);
  });

  it("pentest: u2 (unauthorized) CANNOT access u1's instance (all data-plane issuances + instance ops → 403)", async () => {
    // Ensure u2 has a fresh REAL session (NOT the key — the key bypasses
    // panel permission but the per-instance gate still 403s ctx.session.uuid-
    // less key requests; we want the real authz path).
    await loginSessionRetry("u2");
    const u2s = u2();

    // POST /protected_instance/stream_channel -> 403
    const sc = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(sc.httpStatus, "u2 stream_channel must be 403").toBe(403);

    // POST /files/upload -> 403
    const upRes = await requestPanel({
      method: "POST",
      path: "/files/upload",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu(), upload_dir: "." }
    });
    expect(upRes.httpStatus, "u2 /files/upload must be 403").toBe(403);

    // POST /files/download -> 403
    const dlRes = await requestPanel({
      method: "POST",
      path: "/files/download",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu(), file_name: "big_concurrent.bin" }
    });
    expect(dlRes.httpStatus, "u2 /files/download must be 403").toBe(403);

    // GET /protected_instance/open -> 403
    const openRes = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(openRes.httpStatus, "u2 /protected_instance/open must be 403").toBe(403);

    // GET /protected_instance/stop -> 403
    const stopRes = await requestPanel({
      method: "GET",
      path: "/protected_instance/stop",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(stopRes.httpStatus, "u2 /protected_instance/stop must be 403").toBe(403);

    // GET /protected_instance/command -> 403
    const cmdRes = await requestPanel({
      method: "GET",
      path: "/protected_instance/command",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu(), command: "echo hi" }
    });
    expect(cmdRes.httpStatus, "u2 /protected_instance/command must be 403").toBe(403);

    // GET /instance -> rejected (403 or 500; the inline ownership gate on the
    // detail route throws an Error which the panel wraps as 500, while
    // protected_instance/* and files/* set ctx.status=403 — both reject u2).
    const instRes = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: u2s.cookie,
      token: u2s.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      [403, 500],
      `u2 /instance must be rejected (403 or 500), got ${instRes.httpStatus}`
    ).toContain(instRes.httpStatus);

    addFinding({
      id: "F-proxy-advanced-authz-boundary",
      step: "proxy_advanced",
      severity: "info",
      title: "Proxy mode: unauthorized user gets NO token (issuance boundary holds)",
      detail:
        "After revoking u2's ownership, u2's REAL session is rejected (403) on every" +
        " data-plane issuance route (/files/upload, /files/download," +
        " /protected_instance/stream_channel) AND every instance operation (open, stop," +
        " command, /instance detail). u2 never receives a proxy token, so no data-plane" +
        " access is possible.",
      evidence:
        "u2 403 on: stream_channel, files/upload, files/download, open, stop, command, instance"
    });

    // Control: u1 STILL works (u1 owns the instance).
    const u1dp = await getDownloadPassport(
      di(),
      iu(),
      u1().cookie,
      u1().token,
      "big_concurrent.bin"
    );
    const d = await downloadFromDaemon(u1dp, "big_concurrent.bin");
    expect(d.httpStatus, "u1 (owner) download must still work").toBe(200);
  });

  // ---- D. PENTEST: token hardening (u1 owns; assert REJECTION) ----

  it("pentest: download token is single-use (replay rejected)", async () => {
    const pp = await getDownloadPassport(
      di(),
      iu(),
      u1().cookie,
      u1().token,
      "big_concurrent.bin"
    );
    // First download: 200 (nonce consumed).
    const d1 = await downloadFromDaemon(pp, "big_concurrent.bin");
    expect(d1.httpStatus, "first download must succeed").toBe(200);
    // Same token replay: nonce deleted -> 403.
    const d2 = await downloadFromDaemon(pp, "big_concurrent.bin");
    expect(d2.httpStatus, "download token replay must be rejected").toBe(403);
  });

  it("pentest: upload token is single-use (replay rejected) — via legacy /upload/:token", async () => {
    const repPath = path.join(world.workDir, "rep.bin");
    fs.writeFileSync(repPath, Buffer.alloc(2048, 0x99));
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(pp.password, "upload passport must be granted").toBeTruthy();

    // First upload: 200 (nonce consumed).
    const u1r = await uploadToDaemon(pp, repPath, "rep.bin", { unzip: false });
    expect(u1r.httpStatus, "first upload must succeed").toBe(200);
    // Same token replay: nonce deleted -> 403.
    const u2r = await uploadToDaemon(pp, repPath, "rep2.bin", { unzip: false });
    expect(u2r.httpStatus, "upload token replay must be rejected").toBe(403);
  });

  it("pentest: stream token is connection-level one-time (2nd connection rejected)", async () => {
    // Issue a stream channel for u1.
    const sc = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(sc.httpStatus, "stream_channel must succeed for owner").toBe(200);
    const T = sc.data.password;
    const addr = sc.data.addr;
    const prefix = sc.data.prefix;

    // First connection claims the nonce.
    const a = createStream(addr, prefix, T);
    const ok = await a.ready;
    expect(ok, "first stream must be ready").toBe(true);

    // Second concurrent connection with the SAME token -> claimed -> rejected.
    const b = createStream(addr, prefix, T);
    const ok2 = await b.ready;
    expect(
      ok2,
      "2nd stream conn with same token must be rejected (connection-level)"
    ).toBe(false);

    a.disconnect();
    b.disconnect();
  });

  it("pentest: forged/garbage token rejected on all proxy routes", async () => {
    // Download with garbage token -> 403 (verifyProxyToken fails: bad payload).
    const dlRes = await downloadFromDaemon(
      { password: "garbage.aa", addr: "127.0.0.1:23333", remoteMappings: [] },
      "x"
    );
    expect(dlRes.httpStatus, "garbage download token must be 403").toBe(403);

    // Upload-new init with garbage token -> 403 (raw axios for the panel route).
    const upRes = await axios.post(
      `${panelBase}/upload-new/garbage.aa`,
      null,
      {
        params: { filename: "x", size: 0, unzip: 0, overwrite: "false" },
        validateStatus: () => true,
        timeout: 30000
      }
    );
    expect(upRes.status, "garbage upload-new token must be 403").toBe(403);

    // Stream/auth with garbage token -> ready false (bridge rejects).
    const s = createStream("127.0.0.1:23333", "", "garbage.aa");
    expect(
      await s.ready,
      "garbage stream token must be rejected (ready=false)"
    ).toBe(false);
    s.disconnect();
  });

  it("pentest: token op-mismatch rejected", async () => {
    const repPath = path.join(world.workDir, "rep.bin");
    fs.writeFileSync(repPath, Buffer.alloc(2048, 0x99));

    // Download token used on the UPLOAD route (legacy /upload/:token) -> 403
    // (op=download but expectedOp=upload -> verifyProxyToken returns null).
    const dlPp = await getDownloadPassport(
      di(),
      iu(),
      u1().cookie,
      u1().token,
      "big_concurrent.bin"
    );
    const upRes = await uploadToDaemon(dlPp, repPath, "mmm.bin", { unzip: false });
    expect(
      upRes.httpStatus,
      "download token on upload route must be 403 (op mismatch)"
    ).toBe(403);

    // Stream token used on the DOWNLOAD route -> 403
    // (op=stream but expectedOp=download -> verifyProxyToken returns null).
    const sc = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(sc.httpStatus, "stream_channel must succeed for owner").toBe(200);
    const stTok = sc.data.password;
    const scAddr = sc.data.addr;
    const dlRes = await downloadFromDaemon(
      { password: stTok, addr: scAddr, remoteMappings: [] },
      "x"
    );
    expect(
      dlRes.httpStatus,
      "stream token on download route must be 403 (op mismatch)"
    ).toBe(403);
  });

  // ---- E. Rollback + cleanup ----

  it("rollback to direct", async () => {
    const setRes = await setDataPlane("direct");
    expect(
      setRes.httpStatus,
      `setDataPlane(direct): ${JSON.stringify(setRes.raw).slice(0, 200)}`
    ).toBe(200);
    await sleep(300);
    expect(await getDataPlane(), "dataPlane mode must be back to direct").toBe(
      "direct"
    );
    const pp = await getUploadPassport(di(), iu(), u1().cookie, u1().token, ".");
    expect(
      isDaemonAddr(pp.addr),
      "addr returns to daemon after rollback"
    ).toBe(true);
    expect(
      isPanelAddr(pp.addr),
      "addr must NOT be panel after rollback"
    ).toBe(false);
  });
});
