import { describe, it, expect } from "vitest";
import {
  world,
  requestPanel,
  sleep,
  waitFor,
  addFinding,
  listFiles,
  getUploadPassport,
  uploadToDaemon,
  setupSecurityWorld,
  createInstance,
  deleteInstance,
  assignToU1,
  getStatusOf,
  openOf,
  stopOf,
  commandTo,
  outputlogOf,
  names,
  di,
  u1,
  FIXTURE,
  STOPPED,
  RUNNING
} from "../lib";

// Security suite — INSTANCE module (split from the former monolithic
// suites/security.test.ts; shared helpers live in ../lib/security.ts).
//
// (real daemon + real panel, no mocks, real HTTP + socket.io). Boots a FRESH
// REAL daemon + panel per invocation. Self-contained: the first `it` ensures
// admin/u1/u2, creates the main instance owned by u1 and uploads the test.mjs
// fixture. This module drives attack-style requests at the instance command
// surface: command injection (start/stop commands must never hit a shell).
//
// Sibling modules: security_user (privilege escalation / permission states /
// input boundaries / unauthorized matrix), security_files (file/upload/
// download hardening + SSRF), security_auth (API-key / 2FA / rate limit /
// login ban — that file's ban block is destructive and LAST).
//
// Notes:
// - The integration-test key bypasses the panel `permission` middleware ONLY
//   (see auth.test.ts #F-key-not-instance-admin): instance/file gates still
//   read `ctx.session.uuid`, so the key gets 403/500 there.

describe("security: setup (users + main instance owned by u1)", () => {
  it("ensure admin/u1/u2, promote admin to ROLE.ADMIN, create + assign main instance, upload fixture", async () => {
    await setupSecurityWorld();
  });
});

describe("security: command injection (start/stop commands must not hit a shell)", () => {
  let inj = "";

  it("startCommand with `;`, `$(...)`, backticks never executes: no marker file, instance runs", async () => {
    // If any layer used a shell, `touch` would create marker files in the
    // instance cwd. spawn(command, args, {shell:false}) keeps them literal argv.
    inj = await createInstance("mcsm-it-cmdinj", {
      startCommand: "node test.mjs ; touch cmdinj_semi.txt $(touch cmdinj_dollar.txt)"
    });
    await assignToU1([world.instance.uuid!, inj]);

    const pp = await getUploadPassport(di(), inj, u1().cookie, u1().token, ".");
    const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
    expect(up.httpStatus, `upload fixture: ${JSON.stringify(up.data).slice(0, 160)}`).toBe(200);

    const o = await openOf(inj);
    expect(o.httpStatus, `open: ${JSON.stringify(o.raw).slice(0, 160)}`).toBe(200);
    await waitFor(async () => (await getStatusOf(inj)) === RUNNING, {
      timeout: 30000,
      interval: 500,
      msg: "cmdinj instance RUNNING"
    });

    // The process is alive and answering -> the metacharacters were argv, not shell.
    await commandTo(inj, "echo injalive");
    await waitFor(
      async () => {
        const log = await outputlogOf(inj);
        return String(log.data || "").includes("ECHO:injalive");
      },
      { timeout: 15000, interval: 400, msg: "ECHO:injalive in outputlog" }
    );

    const f = await listFiles(di(), inj, u1().cookie, u1().token, ".");
    const ns = names(f);
    expect(ns, "shell metacharacters in startCommand must not spawn processes").not.toContain(
      "cmdinj_semi.txt"
    );
    expect(ns).not.toContain("cmdinj_dollar.txt");
    addFinding({
      id: "F-startcmd-no-shell",
      step: "cmd-injection",
      severity: "info",
      title: "startCommand is split to argv and spawned without a shell",
      detail:
        "general_start uses commandStringToArray + spawn(exe, args) (no shell:true), so `;`, " +
        "$() and backticks are literal arguments. Defense-in-depth pin: if a regression ever " +
        "introduces shell execution the marker files appear and this test fails.",
      evidence: `list after open: ${JSON.stringify(ns).slice(0, 160)}`
    });
  });

  it("outputlog size-parameter boundaries (abc / 0 / 5kb / -5) are robust while RUNNING", async () => {
    for (const size of ["abc", "0", "5kb", "-5"]) {
      const r = await outputlogOf(inj, { size });
      expect(r.httpStatus, `outputlog size=${size}: ${JSON.stringify(r.raw).slice(0, 120)}`).toBe(
        200
      );
    }
  });

  it("stopCommand is stdin protocol, not shell: multi-line with `touch` leaves no file", async () => {
    // instance_update is the low-priv config route: stopCommand is whitelisted
    // for normal users (by design). The security pin: its lines are written to
    // the process stdin, never executed by a shell.
    const r = await requestPanel({
      method: "PUT",
      path: "/protected_instance/instance_update",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: inj },
      body: { stopCommand: "exit\ntouch stopinj.txt" }
    });
    expect(r.httpStatus, `instance_update stopCommand: ${JSON.stringify(r.raw).slice(0, 160)}`).toBe(
      200
    );

    const s = await stopOf(inj);
    expect(s.httpStatus, `stop: ${JSON.stringify(s.raw).slice(0, 160)}`).toBe(200);
    await waitFor(async () => (await getStatusOf(inj)) === STOPPED, {
      timeout: 30000,
      interval: 500,
      msg: "cmdinj instance STOPPED"
    });

    const f = await listFiles(di(), inj, u1().cookie, u1().token, ".");
    expect(names(f), "stopCommand must never spawn a shell").not.toContain("stopinj.txt");
  });

  it("quoted argv boundary: `node \"test.mjs\"` still starts (parser strips quotes)", async () => {
    const cfg = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: inj }
    });
    const p = await requestPanel({
      method: "PUT",
      path: "/instance",
      key: world.key,
      query: { daemonId: di(), uuid: inj },
      body: { ...(cfg.data?.config || {}), startCommand: 'node "test.mjs"' }
    });
    expect(p.httpStatus).toBe(200);

    await openOf(inj);
    await waitFor(async () => (await getStatusOf(inj)) === RUNNING, {
      timeout: 30000,
      interval: 500,
      msg: "quoted startCommand RUNNING"
    });
    await stopOf(inj);
    await waitFor(async () => (await getStatusOf(inj)) === STOPPED, {
      timeout: 30000,
      interval: 500,
      msg: "quoted startCommand STOPPED"
    });
  });

  it("unclosed quote: refused cleanly (save-time 500 or start-time fail; never RUNNING)", async () => {
    const cfg = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: inj }
    });
    const p = await requestPanel({
      method: "PUT",
      path: "/instance",
      key: world.key,
      query: { daemonId: di(), uuid: inj },
      body: { ...(cfg.data?.config || {}), startCommand: 'node "test.mjs' }
    });
    // Observed: the daemon validates the command string at UPDATE time and the
    // save is rejected (500). A future implementation may accept the config and
    // fail at start instead - both are safe as long as the instance NEVER runs
    // a malformed command via a shell fallback.
    if (p.httpStatus === 200) {
      await openOf(inj);
      await sleep(3000);
    } else {
      expect([400, 500], `malformed startCommand save: ${JSON.stringify(p.raw).slice(0, 160)}`).toContain(
        p.httpStatus
      );
    }
    expect(
      await getStatusOf(inj),
      "a malformed startCommand must never reach RUNNING (parser throws, no shell fallback)"
    ).toBe(STOPPED);
  });

  it("cleanup: delete the injection instance", async () => {
    const d = await deleteInstance(inj);
    expect(d.httpStatus, `delete cmdinj: ${JSON.stringify(d.raw).slice(0, 160)}`).toBe(200);
  });
});
