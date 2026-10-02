import { describe, it, expect } from "vitest";
import axios from "axios";
import crypto from "node:crypto";
import {
  world,
  unwrap,
  requestPanel,
  login,
  sleep,
  saveState,
  addFinding,
  setSetting,
  rawApiKeyGet,
  searchUser,
  readUserFile,
  setupSecurityWorld,
  di,
  u1,
  u2,
  adm
} from "../lib";

// Security suite — AUTH module (split from the former monolithic
// suites/security.test.ts; shared helpers live in ../lib/security.ts).
//
// (real daemon + real panel, no mocks, real HTTP + socket.io). Boots a FRESH
// REAL daemon + panel per invocation. Self-contained: the first `it` ensures
// admin/u1/u2, creates the main instance owned by u1 and uploads the test.mjs
// fixture. This module drives attack-style requests at the auth surface:
//   API-key lifecycle matrix (session-equivalent bypass) · two-factor auth
//   (self-computed RFC 6238 TOTP) · request rate limit · login failure ban
//   (LAST: it bans 127.0.0.1 for 10 minutes).
//
// Sibling modules: security_user (privilege escalation / permission states /
// input boundaries / unauthorized matrix), security_instance (command
// injection), security_files (file/upload/download hardening + SSRF).
//
// Notes:
// - The integration-test key bypasses the panel `permission` middleware ONLY
//   (see auth.test.ts #F-key-not-instance-admin): instance/file gates still
//   read `ctx.session.uuid`, so the key gets 403/500 there.
// - The login-ban block MUST stay last IN THIS FILE: the IP ban is in-memory
//   for 10 minutes and would break any later login in this panel process.
//   Sibling suites boot their own panel process (fresh ban state), so
//   cross-suite impact is none.

describe("security: setup (users + main instance owned by u1)", () => {
  it("ensure admin/u1/u2, promote admin to ROLE.ADMIN, create + assign main instance, upload fixture", async () => {
    await setupSecurityWorld();
  });
});

describe("security: API-key lifecycle matrix (session-equivalent credential)", () => {
  let u1Key = "";
  let adminKey = "";

  it("enableApiKey=true: u1 mints a key; the raw key acts as a session (no cookie/token/ajax)", async () => {
    await setSetting({ enableApiKey: true });

    const mint = await requestPanel({
      method: "PUT",
      path: "/auth/api",
      cookie: u1().cookie,
      token: u1().token,
      body: { enable: true }
    });
    expect(mint.httpStatus, `mint api key: ${JSON.stringify(mint.raw).slice(0, 160)}`).toBe(200);
    u1Key = String(mint.data || "");
    expect(u1Key.length).toBeGreaterThan(10);

    // Search view must still be masked even after minting.
    const row = await searchUser(world.u1.name);
    expect(row?.apiKey, "minted apiKey must be masked in /auth/search").toBe("__MCSM_SECRET_DATA__");

    // ONLY the api-key header - no Cookie, no ?token=, no x-requested-with.
    const r = await rawApiKeyGet("/api/instance", u1Key, {
      daemonId: di(),
      uuid: world.instance.uuid
    });
    expect(r.status, `api-key session call: ${JSON.stringify(r.data).slice(0, 160)}`).toBe(200);
    // GET /api/instance returns the instance DETAIL (config/status/...), so the
    // identity pin is the returned instance, not a user uuid field.
    expect(unwrap(r).data?.config?.nickname).toBe(world.instance.name);
    addFinding({
      id: "F-apikey-session-equivalent",
      step: "api-key",
      severity: "info",
      title: "A user API key is a full session substitute for that user's permission level",
      detail:
        "permission.ts apikey branch skips token/ajax/session checks and authorizes purely on" +
        " `user.permission >= level`. With enableApiKey=true any user can mint a long-lived" +
        " bearer credential; per-instance ownership checks still apply (isHaveInstanceByUuid).",
      evidence: `GET /api/instance with x-request-api-key only -> ${r.status}`
    });
  });

  it("?apikey= query channel works; admin routes stay gated for normal-user keys", async () => {
    // build the query-channel call manually (apikey in query, not header)
    const res = await axios.get(`${world.panelUrl}/api/instance`, {
      params: { daemonId: di(), uuid: world.instance.uuid, apikey: u1Key },
      validateStatus: () => true,
      timeout: 30000
    });
    expect(res.status, `?apikey= channel: ${JSON.stringify(res.data).slice(0, 160)}`).toBe(200);

    // The same key on an ADMIN-level route must fail (permission 1 < 10).
    const admRes = await rawApiKeyGet("/api/auth/overview", u1Key);
    expect(admRes.status, "normal-user key on admin route must be 403").toBe(403);
  });

  it("malformed api keys (blacklist chars / spaces / overlong) -> 403, never a crash", async () => {
    for (const bad of ["abc; rm -rf /", "has space", "../../etc", "a".repeat(300)]) {
      const g = await rawApiKeyGet("/api/auth/overview", bad);
      expect([403, 500], `bad key ${JSON.stringify(bad)} -> ${g.status}`).toContain(g.status);
      expect(g.status).not.toBe(200);
    }
  });

  it("enableApiKey=ONLY_ADMIN rejects normal-user keys", async () => {
    await setSetting({ enableApiKey: "ONLY_ADMIN" });
    const r = await rawApiKeyGet("/api/instance", u1Key, {
      daemonId: di(),
      uuid: world.instance.uuid
    });
    expect(r.status, "ONLY_ADMIN must reject a normal-user key").toBe(403);
    expect(JSON.stringify(r.data)).toMatch(/API key/i);
  });

  it("an ADMIN user's key passes admin routes in ONLY_ADMIN mode", async () => {
    const mint = await requestPanel({
      method: "PUT",
      path: "/auth/api",
      cookie: adm().cookie,
      token: adm().token,
      body: { enable: true }
    });
    expect(mint.httpStatus, `mint admin key: ${JSON.stringify(mint.raw).slice(0, 160)}`).toBe(200);
    adminKey = String(mint.data || "");
    expect(adminKey.length).toBeGreaterThan(10);

    const r = await rawApiKeyGet("/api/auth/overview", adminKey);
    expect(r.status, "admin key on admin route must be 200").toBe(200);
    expect(Array.isArray(unwrap(r).data)).toBe(true);
  });

  it("disabling enableApiKey revokes every key immediately", async () => {
    await setSetting({ enableApiKey: false });
    const a = await rawApiKeyGet("/api/instance", u1Key, {
      daemonId: di(),
      uuid: world.instance.uuid
    });
    expect(a.status, "u1 key must die when the switch is off").toBe(403);
    expect(JSON.stringify(a.data)).toMatch(/API key/i);
    const b = await rawApiKeyGet("/api/auth/overview", adminKey);
    expect(b.status, "admin key must die when the switch is off").toBe(403);
  });
});

// ---- RFC 6238 TOTP (compatible with the panel's otplib authenticator:
//      SHA-1, 30s step, 6 digits, base32 secret) ----
function base32Decode(s: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpCode(secretBase32: string, atMs: number = Date.now()): string {
  const counter = Math.floor(atMs / 1000 / 30);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32Decode(secretBase32)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) %
    1000000;
  return String(bin).padStart(6, "0");
}

describe("security: two-factor auth (TOTP) lifecycle", () => {
  // A dedicated throwaway user so 2FA state never interferes with u1/u2.
  const NAME = "twofa_user_x";
  const PASS = "Www.123456";
  let uuid = "";
  let cookie = "";
  let token = "";
  let secret = "";

  const loginWithCode = async (password: string, code?: string) => {
    const res = await axios.post(
      `${world.panelUrl}/api/auth/login`,
      { username: NAME, password, ...(code ? { code } : {}) },
      { headers: { "x-requested-with": "XMLHttpRequest" }, validateStatus: () => true, timeout: 30000 }
    );
    return unwrap(res);
  };

  // Codes live for one 30s step and the panel validates with window=0: if a
  // request crosses a step boundary mid-flight the freshly computed code is
  // already stale. Retry once with a new code to keep the suite deterministic.
  const withTotp = async <T>(fn: (code: string) => Promise<T>, ok: (r: T) => boolean): Promise<T> => {
    let r = await fn(totpCode(secret));
    if (!ok(r)) {
      await sleep(1500);
      r = await fn(totpCode(secret));
    }
    return r;
  };

  it("bind2fa issues a QR + stores a secret (2FA still OFF until confirmed)", async () => {
    const c = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: NAME, password: PASS, permission: 1 }
    });
    expect(c.httpStatus, `create: ${JSON.stringify(c.raw).slice(0, 140)}`).toBe(200);
    uuid = c.data.uuid;

    const l = await login(NAME, PASS);
    expect(l.ok).toBe(true);
    cookie = l.cookie;
    token = l.token;

    const bind = await requestPanel({
      method: "POST",
      path: "/auth/bind2fa",
      cookie,
      token
    });
    expect(bind.httpStatus, `bind2fa: ${JSON.stringify(bind.raw).slice(0, 140)}`).toBe(200);
    expect(String(bind.data)).toMatch(/^data:image/);
    secret = String(readUserFile(uuid).secret || "");
    expect(secret.length, "a TOTP seed must be stored after bind").toBeGreaterThan(10);
    expect(readUserFile(uuid).open2FA, "binding alone must NOT enable 2FA").toBe(false);
  });

  it("confirm2fa refuses a wrong code and enables 2FA only on the correct one", async () => {
    // Contract note: the handler answers `ctx.body = false` on a bad code and
    // the protocol middleware treats a falsy body as "processing failed"
    // (500 + data:null). The frontend enable-flow relies on exactly this
    // 200-vs-500 split (MyselfInfoDialog try/catch) - pinned as a finding.
    const wrong = await requestPanel({
      method: "POST",
      path: "/auth/confirm2fa",
      cookie,
      token,
      body: { enable: true, TOTPCode: "000000" }
    });
    expect(
      wrong.httpStatus,
      `wrong TOTP must be a non-200 failure: ${JSON.stringify(wrong.raw).slice(0, 160)}`
    ).not.toBe(200);
    expect(readUserFile(uuid).open2FA, "wrong TOTP must not enable 2FA").toBe(false);

    const right = await withTotp(
      (code) =>
        requestPanel({
          method: "POST",
          path: "/auth/confirm2fa",
          cookie,
          token,
          body: { enable: true, TOTPCode: code }
        }),
      (r) => r.httpStatus === 200
    );
    expect(right.httpStatus, JSON.stringify(right.raw).slice(0, 200)).toBe(200);
    expect(right.data, "correct TOTP enables 2FA").toBe(true);
    expect(readUserFile(uuid).open2FA).toBe(true);
    addFinding({
      id: "F-confirm2fa-false-body",
      step: "2fa",
      severity: "info",
      title: "confirm2fa answers a rejected TOTP with 500+null (falsy body -> protocol 'failed')",
      detail:
        "The handler sets `ctx.body = false` for a wrong code; protocol.ts maps null/false/" +
        "undefined bodies to a 500 envelope with data:null. A boolean `false` therefore cannot" +
        " travel as 200/false. Frontend (MyselfInfoDialog.confirm2FACode) treats 500 as the" +
        " wrong-code signal, so the quirk is load-bearing for UX. Documented, not changed.",
      evidence: `wrong-code -> http=${wrong.httpStatus} data=${JSON.stringify(wrong.data)}`
    });
  });

  it("login now requires the 2FA code (NEED_2FA / wrong code / correct code)", async () => {
    // Password-first request WITHOUT a code field must be challenged - this is
    // the SsoBindLogin flow (`code: undefined`) and pins the login_router fix
    // for `String(undefined)` defeating the NEED_2FA branch.
    const noCode = await loginWithCode(PASS);
    expect(
      String(noCode.data),
      `password-only login must ask for 2FA: ${JSON.stringify(noCode.data).slice(0, 120)}`
    ).toBe("NEED_2FA");

    const badCode = await loginWithCode(PASS, "000000");
    expect(badCode.httpStatus, "wrong TOTP must not log in").not.toBe(200);

    const goodCode = await withTotp((code) => loginWithCode(PASS, code), (r) => r.httpStatus === 200);
    expect(
      goodCode.httpStatus,
      `correct TOTP must log in: ${JSON.stringify(goodCode.data).slice(0, 120)}`
    ).toBe(200);
    expect(String(goodCode.data).length).toBeGreaterThan(4);
  });

  it("disabling 2FA needs only a session (documented downgrade surface)", async () => {
    // Current product contract (frontend MyselfInfoDialog.disable2FACode sends
    // a placeholder TOTPCode "000000"): the disable path does NOT validate the
    // code. Any session holder can strip 2FA. Recorded as a finding - a policy
    // change here would also require a frontend prompt for the real code.
    const disable = await requestPanel({
      method: "POST",
      path: "/auth/confirm2fa",
      cookie,
      token,
      body: { enable: false, TOTPCode: "000000" }
    });
    expect(disable.httpStatus, JSON.stringify(disable.raw).slice(0, 160)).toBe(200);
    expect(disable.data).toBe(true);
    expect(readUserFile(uuid).open2FA, "2FA must be off after disable").toBe(false);

    // Back to password-only login.
    const plain = await loginWithCode(PASS);
    expect(plain.httpStatus, "password-only login restored").toBe(200);
    addFinding({
      id: "F-2fa-disable-no-code",
      step: "2fa",
      severity: "warn",
      title: "Disabling 2FA requires only a valid session (no TOTP verification)",
      detail:
        "POST /auth/confirm2fa with enable:false skips the code check entirely (the frontend" +
        " hardcodes TOTPCode \"000000\"). Combined with re-binding (bind2fa also resets" +
        " open2FA=false), a stolen session can downgrade an account to password-only. A" +
        " proper fix needs both a server-side code requirement AND a frontend prompt; the" +
        " same session can already change the password via /auth/update (no old password)," +
        " so the practical marginal risk is limited. Documented, not changed.",
      evidence: "enable:false TOTPCode=000000 -> 200 true; open2FA=false"
    });
  });

  it("admin password reset clears the 2FA binding (secret + open2FA)", async () => {
    // Re-enable 2FA first so the reset has something to clear.
    await withTotp(
      (code) =>
        requestPanel({
          method: "POST",
          path: "/auth/confirm2fa",
          cookie,
          token,
          body: { enable: true, TOTPCode: code }
        }),
      (r) => r.httpStatus === 200
    );
    expect(readUserFile(uuid).open2FA).toBe(true);

    const reset = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid, config: { passWord: "Newpass.1234" } }
    });
    expect(reset.httpStatus, `admin reset: ${JSON.stringify(reset.raw).slice(0, 140)}`).toBe(200);
    const raw = readUserFile(uuid);
    expect(raw.open2FA, "reset must turn 2FA off").toBe(false);
    expect(raw.secret, "reset must wipe the TOTP seed").toBe("");

    const after = await loginWithCode("Newpass.1234");
    expect(after.httpStatus, "login with the new password works without 2FA").toBe(200);

    const del = await requestPanel({ method: "DELETE", path: "/auth", key: world.key, body: [uuid] });
    expect(del.httpStatus, "temp user cleanup must succeed").toBe(200);
  });
});

describe("security: request rate limiting", () => {
  // The limiter's counter lives in the SESSION COOKIE - the recovery check
  // must reuse the burst's final cookie or it measures an empty window.
  let burstCookie = "";

  it("per-session burst over the 8/s cap returns tooFast 500s, others still 200", async () => {
    // koa-session is COOKIE-backed (no server store), so a real client must
    // adopt every Set-Cookie - SESSION_REQ_TIMES lives inside the cookie.
    let cookie = u1().cookie;
    const statuses: number[] = [];
    const t0 = Date.now();
    for (let i = 0; i < 20; i++) {
      const res = await axios.get(`${world.panelUrl}/api/instance`, {
        params: { daemonId: di(), uuid: world.instance.uuid, token: u1().token },
        headers: { Cookie: cookie, "x-requested-with": "XMLHttpRequest" },
        validateStatus: () => true,
        timeout: 30000
      });
      statuses.push(res.status);
      const setCookie: string[] = res.headers["set-cookie"] || [];
      if (setCookie.length) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
    }
    burstCookie = cookie;
    const elapsed = Date.now() - t0;
    expect(statuses, `burst statuses: ${JSON.stringify(statuses)}`).toContain(200);
    // The limiter only trips if the burst is actually faster than 8/s. On a
    // slow host each round-trip can stretch the window open - only assert the
    // throttle when the measured rate really exceeds the cap (9/s margin).
    const ratePerSec = (statuses.length / Math.max(elapsed, 1)) * 1000;
    if (ratePerSec > 9) {
      expect(statuses, "the speed limiter must throttle an above-cap burst").toContain(500);
    } else {
      addFinding({
        id: "F-ratelimit-burst-slow-host",
        step: "rate-limit",
        severity: "info",
        title: "Rate-limit burst ran below the 8/s cap on this host - throttle not exercised",
        detail:
          `20 sequential requests took ${elapsed}ms (~${ratePerSec.toFixed(1)}/s); under the cap ` +
          "the limiter correctly stays silent. The throttle path is pinned by the branch above " +
          "whenever the host is fast enough to exceed 9 requests per second.",
        evidence: `elapsed=${elapsed}ms rate=${ratePerSec.toFixed(2)}/s statuses=${JSON.stringify(statuses)}`
      });
    }
  });

  it("the window recovers after ~1s (same session, post-burst cookie)", async () => {
    await sleep(1300);
    const res = await axios.get(`${world.panelUrl}/api/instance`, {
      params: { daemonId: di(), uuid: world.instance.uuid, token: u1().token },
      headers: { Cookie: burstCookie, "x-requested-with": "XMLHttpRequest" },
      validateStatus: () => true,
      timeout: 30000
    });
    expect(res.status, `post-window request: ${JSON.stringify(res.data).slice(0, 120)}`).toBe(200);
  });
});

// ============================ LAST: destructive ============================
describe("security: login failure ban (bans 127.0.0.1 - MUST stay last)", () => {
  it("control: correct credentials still log in before the attack", async () => {
    const r = await login(world.u2.name, world.u2.pass);
    expect(r.ok, `control login: ${JSON.stringify(r.raw).slice(0, 120)}`).toBe(true);
    world.u2.cookie = r.cookie;
    world.u2.token = r.token;
    saveState();
  });

  it("11 failed logins accumulate; the 12th is IP-banned; correct password is also refused", async () => {
    // login_ban: ban triggers when activeCount > LOGIN_FAILED_MAX(10), i.e.
    // on the 12th request. checkBanIp counts EVERY /auth/login attempt.
    const rawText = (r: any) => JSON.stringify(r?.raw ?? r);
    let firstBanAt = -1;
    for (let i = 1; i <= 11; i++) {
      const r = await login(world.u2.name, "Wrong.123456");
      expect(r.ok).toBe(false);
      if (/banned/i.test(rawText(r))) firstBanAt = i;
    }
    expect(firstBanAt, "attempts 1-11 must fail on the password, not the ban").toBe(-1);

    const banned = await login(world.u2.name, "Wrong.123456");
    expect(banned.ok).toBe(false);
    expect(
      rawText(banned),
      `attempt 12 should be the ban: ${rawText(banned).slice(0, 160)}`
    ).toMatch(/banned|too many failed/i);

    // Even the CORRECT password is refused while the ban is active: checkBanIp
    // runs before the password check.
    const correct = await login(world.u2.name, world.u2.pass);
    expect(correct.ok, "correct password must be refused during the ban window").toBe(false);
    expect(rawText(correct)).toMatch(/banned|too many failed/i);

    addFinding({
      id: "F-login-ban-e2e",
      step: "login-ban",
      severity: "info",
      title: "Login failure IP ban (10 min) works end-to-end over real HTTP",
      detail:
        "11 failed attempts accumulate in the sliding window; the 12th request is denied by" +
        " checkBanIp with the ban message before any password check. The correct password is" +
        " also refused while banned. Unit logic lives in login_ban.ts; this pins the HTTP wiring." +
        " Note: the ban is keyed on ctx.ip and lasts IP_BAN_DURATION_MS (10 min) - this test is" +
        " therefore the LAST in the suite (in-memory state dies with the panel process).",
      evidence: `attempt12=${rawText(banned).slice(0, 80)} correct=${rawText(correct).slice(0, 80)}`
    });
  });

  it("disabling loginCheckIp lifts the deny (documented switch semantics)", async () => {
    await setSetting({ loginCheckIp: false });
    const r = await login(world.u2.name, world.u2.pass);
    expect(r.ok, "with loginCheckIp=false the ban no longer denies").toBe(true);
    addFinding({
      id: "F-logincheckip-switch",
      step: "login-ban",
      severity: "info",
      title: "loginCheckIp=false bypasses an already-active IP ban",
      detail:
        "checkBanIp forwards loginCheckIp into registerFailureAttempt; when false the counter" +
        " still updates but never denies - including for an already-recorded ban. Admins can" +
        " therefore unlock an IP instantly by toggling the setting. Documented behavior.",
      evidence: "login after 12 failures with loginCheckIp=false -> ok"
    });
  });
});
