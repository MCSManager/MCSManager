import { describe, it, expect } from "vitest";
import axios from "axios";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  world,
  unwrap,
  requestPanel,
  login,
  ensureUser,
  ensureOwner,
  listFiles,
  getUploadPassport,
  uploadToDaemon,
  uploadFileChunked,
  getDownloadPassport,
  downloadFromDaemon,
  createStream,
  buildZip,
  waitFor,
  sleep,
  addFinding,
  saveState
} from "../lib";

// Security / boundary / privilege-escalation integration suite
// (real daemon + real panel, no mocks, real HTTP + socket.io).
//
// Boots a FRESH REAL daemon + panel per invocation. Self-contained: the first
// `it` ensures admin/u1/u2, creates the main instance owned by u1 and uploads
// the test.mjs fixture. Everything after drives attack-style requests:
//   privilege escalation & mass assignment (incl. scrubbed-row write-back) ·
//   user permission-state boundaries (GUEST 0 / BAN -1) · API-key lifecycle
//   matrix (session-equivalent bypass) · command injection (start/stop command
//   must never hit a shell) · input boundaries (password/username/validator/
//   pagination) · two-factor auth (self-computed RFC 6238 TOTP) · file &
//   upload/download security (passport single-use, traversal filenames,
//   absolute-entry zips, chunked size/offset) · unauthorized matrix (u2 +
//   integration key + daemonId confusion + low-priv whitelist) · SSRF / URL
//   fetch gates · request rate limit · login failure ban (LAST: it bans
//   127.0.0.1 for 10 minutes).
//
// Notes:
// - The integration-test key bypasses the panel `permission` middleware ONLY
//   (see auth.test.ts #F-key-not-instance-admin): instance/file gates still
//   read `ctx.session.uuid`, so the key gets 403/500 there.
// - The login-ban block MUST stay last: the IP ban is in-memory for 10 minutes
//   and would break any later login in this panel process. Later suites boot
//   their own panel process (fresh ban state), so cross-suite impact is none.

const di = () => world.daemonId;
const u1 = () => ({ cookie: world.u1.cookie!, token: world.u1.token! });
const u2 = () => ({ cookie: world.u2.cookie!, token: world.u2.token! });
const adm = () => ({ cookie: world.admin.cookie!, token: world.admin.token! });
const FIXTURE = path.join(__dirname, "../fixtures/test.mjs");

const STOPPED = 0;
const RUNNING = 3;

const names = (r: any) => (r?.data?.items || []).map((x: any) => x.name);

// user rows from /auth/search are scrubbed: passWord/salt cleared, apiKey
// masked to "__MCSM_SECRET_DATA__" when set. Shape: { maxPage, page, data: [] }.
function searchRows(r: any): any[] {
  const sd = r?.data;
  return Array.isArray(sd) ? sd : sd?.data || [];
}

async function searchUser(name: string): Promise<any> {
  const r = await requestPanel({
    method: "GET",
    path: "/auth/search",
    key: world.key,
    query: { userName: name, page: 1, page_size: 10 }
  });
  return searchRows(r).find((x: any) => x.userName === name);
}

// Raw user record on disk (panel/data/User/<uuid>.json) - asserts against the
// REAL stored fields, not the scrubbed API view.
function readUserFile(uuid: string): any {
  const p = path.join(world.workDir, "panel/data/User", `${uuid}.json`);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

async function createInstance(nickname: string, extra: any = {}): Promise<string> {
  const r = await requestPanel({
    method: "POST",
    path: "/instance",
    key: world.key,
    query: { daemonId: di() },
    body: {
      nickname,
      startCommand: "node test.mjs",
      stopCommand: "exit",
      cwd: "",
      ie: "utf-8",
      oe: "utf-8",
      ...extra
    }
  });
  expect(r.httpStatus, `create ${nickname}: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
  expect(r.data?.instanceUuid).toBeTruthy();
  return r.data.instanceUuid;
}

async function deleteInstance(uuid: string) {
  return requestPanel({
    method: "DELETE",
    path: "/instance",
    key: world.key,
    query: { daemonId: di() },
    body: { uuids: [uuid], deleteFile: true }
  });
}

// setUserInstances REPLACES the whole list - always pass every uuid u1 owns.
async function assignToU1(uuids: string[]) {
  const r = await requestPanel({
    method: "PUT",
    path: "/auth",
    key: world.key,
    body: {
      uuid: world.u1.uuid,
      config: { instances: uuids.map((u) => ({ daemonId: di(), instanceUuid: u })) }
    }
  });
  expect(r.httpStatus, `assign u1: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
}

async function getStatusOf(uuid: string): Promise<number> {
  const r = await requestPanel({
    method: "GET",
    path: "/instance",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });
  return r?.data?.status ?? -99;
}

const openOf = (uuid: string) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/open",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });

const stopOf = (uuid: string) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/stop",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid }
  });

const commandTo = (uuid: string, command: string) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/command",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid, command }
  });

const outputlogOf = (uuid: string, query: Record<string, any> = {}) =>
  requestPanel({
    method: "GET",
    path: "/protected_instance/outputlog",
    cookie: u1().cookie,
    token: u1().token,
    query: { daemonId: di(), uuid, ...query }
  });

async function setSetting(config: any) {
  const r = await requestPanel({
    method: "PUT",
    path: "/overview/setting",
    key: world.key,
    body: config
  });
  expect(r.httpStatus, `setSetting ${JSON.stringify(config)}: ${JSON.stringify(r.raw).slice(0, 160)}`).toBe(
    200
  );
}

// Raw axios call with ONLY an api-key credential (no cookie, no token, no
// x-requested-with) - proves the api-key branch is a full session substitute.
function rawApiKeyGet(urlPath: string, apiKey: string, query: Record<string, any> = {}) {
  return axios.get(`${world.panelUrl}${urlPath}`, {
    params: query,
    headers: { "x-request-api-key": apiKey },
    validateStatus: () => true,
    timeout: 30000
  });
}

// Passport `addr` values arrive as "host:port" / "ws://host:port" - normalize
// to an http(s) base URL like lib/files.ts httpBase().
function daemonBase(addr: string): string {
  if (!addr) return world.daemonHttpUrl;
  if (addr.startsWith("http://") || addr.startsWith("https://")) return addr;
  if (addr.startsWith("ws://")) return "http://" + addr.slice(5);
  if (addr.startsWith("wss://")) return "https://" + addr.slice(6);
  return "http://" + addr;
}

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

describe("security: setup (users + main instance owned by u1)", () => {
  it("ensure admin/u1/u2, promote admin to ROLE.ADMIN, create + assign main instance, upload fixture", async () => {
    world.admin.uuid = await ensureUser("admin", world.key);
    world.u1.uuid = await ensureUser("u1", world.key);
    world.u2.uuid = await ensureUser("u2", world.key);
    saveState();
    expect(world.admin.uuid).toBeTruthy();
    expect(world.u1.uuid).toBeTruthy();
    expect(world.u2.uuid).toBeTruthy();

    // Promote test_admin to permission 10 so the suite can contrast
    // ADMIN-vs-USER redaction (e.g. /files/status disk list).
    const p = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid: world.admin.uuid, config: { permission: 10 } }
    });
    expect(p.httpStatus, `promote admin: ${JSON.stringify(p.raw).slice(0, 160)}`).toBe(200);
    expect(readUserFile(world.admin.uuid!).permission).toBe(10);

    world.instance.uuid = await createInstance(world.instance.name);
    saveState();
    await ensureOwner("u1", world.key);

    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(pp.password).toBeTruthy();
    const up = await uploadToDaemon(pp, FIXTURE, "test.mjs", { unzip: false });
    expect(up.httpStatus, `upload fixture: ${JSON.stringify(up.data).slice(0, 160)}`).toBe(200);
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(names(f)).toContain("test.mjs");
  });
});

describe("security: privilege escalation + mass assignment", () => {
  it("u1 PUT /auth/update mass-assignment cannot escalate (permission/apiKey/instances ignored)", async () => {
    // /auth/update is the self-service profile route (USER level). The handler
    // must only apply passWord/isInit - a body smuggling permission:10,
    // apiKey or foreign instances must NOT take effect.
    const r = await requestPanel({
      method: "PUT",
      path: "/auth/update",
      cookie: u1().cookie,
      token: u1().token,
      body: {
        passWord: world.u1.pass,
        isInit: true,
        permission: 10,
        apiKey: "stolen-api-key-123",
        instances: [{ daemonId: di(), instanceUuid: "forged-instance" }]
      }
    });
    expect(r.httpStatus, `/auth/update: ${JSON.stringify(r.raw).slice(0, 160)}`).toBe(200);

    // The handler logs the user out after a password change - re-login with the
    // SAME password (it was re-hashed, not changed).
    const rl = await login(world.u1.name, world.u1.pass);
    expect(rl.ok, `re-login u1: ${JSON.stringify(rl.raw).slice(0, 160)}`).toBe(true);
    world.u1.cookie = rl.cookie;
    world.u1.token = rl.token;
    saveState();

    // Assert against the RAW stored record, not the scrubbed API view.
    const raw = readUserFile(world.u1.uuid!);
    expect(raw.permission, "mass-assigned permission:10 must not stick").toBe(1);
    expect(raw.apiKey, "mass-assigned apiKey must not stick").not.toBe("stolen-api-key-123");
    const ov = await requestPanel({ method: "GET", path: "/auth/overview", key: world.key });
    const me = (ov.data || []).find((x: any) => x.uuid === world.u1.uuid);
    expect(
      me?.instances?.some((x: any) => x.instanceUuid === "forged-instance"),
      "mass-assigned instance ownership must not stick"
    ).toBe(false);
  });

  it("u1 PUT /auth/update rejects weak or missing password (non-200)", async () => {
    const weak = await requestPanel({
      method: "PUT",
      path: "/auth/update",
      cookie: u1().cookie,
      token: u1().token,
      body: { passWord: "123" }
    });
    expect(weak.httpStatus, "weak password on self-update must be rejected").not.toBe(200);

    const missing = await requestPanel({
      method: "PUT",
      path: "/auth/update",
      cookie: u1().cookie,
      token: u1().token,
      body: {}
    });
    expect(missing.httpStatus, "missing password on self-update must be rejected").not.toBe(200);
  });

  it("GET /auth?uuid=<u2> is ignored for normal users (confused deputy) + response is scrubbed", async () => {
    // general_user_router GET / only swaps in ?uuid= for top permission. A
    // normal user asking for u2's record must get their OWN record back, and
    // no password/salt/secret material may leave the panel.
    const r = await requestPanel({
      method: "GET",
      path: "/auth",
      cookie: u1().cookie,
      token: u1().token,
      query: { uuid: world.u2.uuid, advanced: "true" }
    });
    expect(r.httpStatus).toBe(200);
    expect(r.data?.uuid, "must return the CALLER's record, not the target's").toBe(world.u1.uuid);
    const s = JSON.stringify(r.data);
    expect(s).not.toContain("passWord");
    expect(s).not.toContain("salt");
    expect(s).not.toContain("secret");
    const apiKeyView = String(r.data?.apiKey ?? "");
    expect(
      apiKeyView === "" || apiKeyView === "__MCSM_SECRET_DATA__",
      `apiKey must be masked, got ${apiKeyView}`
    ).toBe(true);
  });

  it("/auth/search masks secrets AND the admin edit round-trip cannot write the mask back as a key", async () => {
    // Give u1 a real apiKey + secret + ssoSub, then verify the search view
    // never exposes them. The search row is what the admin UserList edit form
    // round-trips back through PUT /auth - writing the MASK string into the
    // apiKey field would make "__MCSM_SECRET_DATA__" a valid bearer key.
    const seed = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: {
        uuid: world.u1.uuid,
        config: { apiKey: "realkey-roundtrip-123", secret: "TOTPSEED123456", ssoSub: "sso-sub-x" }
      }
    });
    expect(seed.httpStatus).toBe(200);

    const row = await searchUser(world.u1.name);
    expect(row, "search must find u1").toBeTruthy();
    expect(row.apiKey, "apiKey must be masked").toBe("__MCSM_SECRET_DATA__");
    expect(row.secret, "TOTP seed must never leave the panel").toBe("__MCSM_SECRET_DATA__");
    expect(row.ssoSub, "SSO subject must never leave the panel").toBe("__MCSM_SECRET_DATA__");
    expect(String(row.secret)).not.toContain("TOTPSEED");
    expect(String(row.ssoSub)).not.toContain("sso-sub-x");

    // Simulate the frontend full-row save: PUT the scrubbed row back.
    const back = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: {
        uuid: world.u1.uuid,
        config: {
          userName: world.u1.name,
          permission: 1,
          apiKey: row.apiKey,
          secret: row.secret,
          ssoSub: row.ssoSub
        }
      }
    });
    expect(back.httpStatus).toBe(200);
    const raw = readUserFile(world.u1.uuid!);
    expect(
      raw.apiKey,
      "the MASKED view value must never be stored as a real api key"
    ).not.toBe("__MCSM_SECRET_DATA__");
    expect(raw.apiKey, "the real key must survive the round-trip").toBe("realkey-roundtrip-123");
    expect(
      raw.secret,
      "the scrubbed secret must NOT overwrite the real TOTP seed (would silently kill 2FA)"
    ).toBe("TOTPSEED123456");
    expect(raw.ssoSub, "the scrubbed ssoSub must NOT unbind SSO").toBe("sso-sub-x");

    // Clean the side fields so later asserts on u1 stay focused.
    await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid: world.u1.uuid, config: { apiKey: "", secret: "", ssoSub: "" } }
    });
    expect((await searchUser(world.u1.name))?.apiKey).toBe("");
  });

  it("admin overview rows carry no secret material at all", async () => {
    const ov = await requestPanel({ method: "GET", path: "/auth/overview", key: world.key });
    expect(ov.httpStatus).toBe(200);
    for (const row of ov.data || []) {
      expect(row, "overview rows must not carry credentials").not.toHaveProperty("passWord");
      expect(row).not.toHaveProperty("salt");
      expect(row).not.toHaveProperty("apiKey");
      expect(row).not.toHaveProperty("secret");
      expect(row).not.toHaveProperty("ssoSub");
    }
  });

  it("normal user cannot use admin surface: PUT/DELETE /api/instance, PUT /overview/setting -> 403", async () => {
    const cfg = await requestPanel({
      method: "PUT",
      path: "/instance",
      cookie: u2().cookie,
      token: u2().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { nickname: "pwned-by-u2", startCommand: "evil" }
    });
    expect(cfg.httpStatus, "u2 PUT /api/instance (admin route) must be 403").toBe(403);

    const del = await requestPanel({
      method: "DELETE",
      path: "/instance",
      cookie: u2().cookie,
      token: u2().token,
      query: { daemonId: di() },
      body: { uuids: [world.instance.uuid], deleteFile: true }
    });
    expect(del.httpStatus, "u2 DELETE /api/instance (admin route) must be 403").toBe(403);

    const st = await requestPanel({
      method: "PUT",
      path: "/overview/setting",
      cookie: u2().cookie,
      token: u2().token,
      body: { enableApiKey: true }
    });
    expect(st.httpStatus, "u2 PUT /overview/setting (admin route) must be 403").toBe(403);
  });
});

describe("security: user permission-state boundaries (GUEST 0 / BAN -1)", () => {
  it("explicit permission values persist; PUT /auth can demote a user to GUEST(0)", async () => {
    // User.permission defaults to 0, so creating with permission=0 proves
    // nothing on its own. This pins BOTH write paths with non-default values:
    // create() with an explicit level, then the edit() demotion to GUEST - the
    // latter is the regression lock for the old `if (config.permission)`
    // truthy check, which silently ignored permission=0 and kept the old level.
    const c = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: "guest_boundary_x", password: "Www.123456", permission: 5 }
    });
    expect(c.httpStatus, `create perm=5: ${JSON.stringify(c.raw).slice(0, 160)}`).toBe(200);
    const uuid = c.data?.uuid;
    expect(uuid).toBeTruthy();
    expect(readUserFile(uuid).permission, "create must persist the explicit level").toBe(5);

    const demote = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid, config: { permission: 0 } }
    });
    expect(demote.httpStatus).toBe(200);
    expect(readUserFile(uuid).permission, "permission=0 must persist as GUEST(0)").toBe(0);

    const del = await requestPanel({
      method: "DELETE",
      path: "/auth",
      key: world.key,
      body: [uuid]
    });
    expect(del.httpStatus, "temp user cleanup must succeed").toBe(200);
  });

  it("permission=0 (GUEST): USER-level routes deny with 403", async () => {
    const set0 = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid: world.u2.uuid, config: { permission: 0 } }
    });
    expect(set0.httpStatus).toBe(200);
    expect(readUserFile(world.u2.uuid!).permission).toBe(0);

    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: u2().cookie,
      token: u2().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(r.httpStatus, "GUEST must not read instances").toBe(403);

    const restore = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid: world.u2.uuid, config: { permission: 1 } }
    });
    expect(restore.httpStatus, "GUEST restore must succeed").toBe(200);
    expect(readUserFile(world.u2.uuid!).permission, "u2 must be back to USER(1)").toBe(1);
    const rl = await login(world.u2.name, world.u2.pass);
    expect(rl.ok, "u2 must log back in after restore").toBe(true);
    world.u2.cookie = rl.cookie;
    world.u2.token = rl.token;
    saveState();
  });

  it("permission=-1 (BAN): an existing session is cut off from protected data", async () => {
    // Positive control FIRST: the same u2 session can read its own record.
    const before = await requestPanel({
      method: "GET",
      path: "/auth",
      cookie: u2().cookie,
      token: u2().token
    });
    expect(before.httpStatus, "control: u2 reads own /auth record").toBe(200);
    expect(before.data?.uuid).toBe(world.u2.uuid);

    const setB = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid: world.u2.uuid, config: { permission: -1 } }
    });
    expect(setB.httpStatus).toBe(200);
    expect(readUserFile(world.u2.uuid!).permission).toBe(-1);

    // The ban branch in permission.ts returns `logout(ctx)` without a body ->
    // protocol's empty-body path answers 404 "[404] Not Found". Pin the exact
    // outcome: the session is logged out AND no user data is returned. (A
    // regression that drops the ban branch would fall through to the handler
    // and return 200 + the record - this assertion catches exactly that.)
    const r = await requestPanel({
      method: "GET",
      path: "/auth",
      cookie: u2().cookie,
      token: u2().token
    });
    expect(
      r.httpStatus,
      `banned session must be denied, got http=${r.httpStatus} data=${JSON.stringify(r.data).slice(0, 120)}`
    ).toBe(404);
    expect(JSON.stringify(r.data ?? ""), "no user data for a banned session").not.toContain(
      world.u2.uuid!
    );
    addFinding({
      id: "F-banned-user-session-cut",
      step: "ban-state",
      severity: "info",
      title: "Banned user (permission=-1) existing session is logged out and gets 404",
      detail:
        "permission.ts checks `user.permission < 0` inside the level branch and returns" +
        " `logout(ctx)` (session cleared) without setting a body - protocol turns the empty" +
        " body into a 404 \"[404] Not Found\" envelope. Sibling denial paths return a clean" +
        " 403; the inconsistency is documented here (same family as F-instance-admin-throw-500)." +
        " The security property is pinned exactly: no protected data is ever returned.",
      evidence: `http=${r.httpStatus} data=${JSON.stringify(r.data).slice(0, 120)}`
    });

    const unban = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid: world.u2.uuid, config: { permission: 1 } }
    });
    expect(unban.httpStatus, "BAN restore must succeed").toBe(200);
    expect(readUserFile(world.u2.uuid!).permission, "u2 must be back to USER(1)").toBe(1);
    const rl = await login(world.u2.name, world.u2.pass);
    expect(rl.ok, "u2 must log back in after unban").toBe(true);
    world.u2.cookie = rl.cookie;
    world.u2.token = rl.token;
    saveState();
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

describe("security: input boundaries (passwords / usernames / validator / pagination)", () => {
  it("password boundaries: 8-char and 37-char and no-digit rejected; 9-char accepted", async () => {
    const cases: Array<[string, string, boolean]> = [
      ["pw_short_x", "Abcdefg1", false], // 8 chars: below the 9 minimum
      ["pw_long_x", "A1a" + "x".repeat(34), false], // 37 chars: above the 36 maximum
      ["pw_nodigit_x", "Abcdefghi", false], // no digit
      ["pw_ok_x", "Abcdefg1h", true] // 9 chars, lower+upper+digit
    ];
    for (const [name, pw, shouldPass] of cases) {
      const r = await requestPanel({
        method: "POST",
        path: "/auth",
        key: world.key,
        body: { username: name, password: pw, permission: 1 }
      });
      if (shouldPass) {
        expect(r.httpStatus, `password ${name} should be accepted: ${JSON.stringify(r.raw).slice(0, 160)}`).toBe(
          200
        );
        const del = await requestPanel({ method: "DELETE", path: "/auth", key: world.key, body: [r.data.uuid] });
        expect(del.httpStatus, "temp user cleanup must succeed").toBe(200);
      } else {
        expect(r.httpStatus, `password ${name} must be rejected`).not.toBe(200);
        expect(r.data?.uuid).toBeFalsy();
      }
    }
  });

  it("usernames with control characters / blank / overlong are rejected (log-injection guard)", async () => {
    const bad: Array<[string, string]> = [
      ["newline", "bad\nname"],
      ["crlf", "bad\r\nname"],
      ["blank", "   "],
      ["overlong", "u".repeat(200)]
    ];
    for (const [label, userName] of bad) {
      const r = await requestPanel({
        method: "POST",
        path: "/auth",
        key: world.key,
        body: { username: userName, password: "Www.123456", permission: 1 }
      });
      expect(
        r.httpStatus,
        `username ${label} must be rejected (log/audit injection guard), got http=${r.httpStatus} data=${JSON.stringify(r.data).slice(0, 120)}`
      ).not.toBe(200);
      expect(r.data?.uuid, `username ${label} must not create a user`).toBeFalsy();
    }
  });

  it("unicode usernames are still accepted (i18n)", async () => {
    const r = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: "测试用户_sec", password: "Www.123456", permission: 1 }
    });
    expect(r.httpStatus, `unicode username: ${JSON.stringify(r.raw).slice(0, 160)}`).toBe(200);
    expect(r.data?.uuid).toBeTruthy();
    const delU = await requestPanel({ method: "DELETE", path: "/auth", key: world.key, body: [r.data.uuid] });
    expect(delU.httpStatus, "temp user cleanup must succeed").toBe(200);
  });

  it("admin rename (PUT /auth config.userName) cannot bypass the username format guard", async () => {
    const c = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: "rename_target_x", password: "Www.123456", permission: 1 }
    });
    expect(c.httpStatus).toBe(200);
    const uuid = c.data.uuid;

    const bad = await requestPanel({
      method: "PUT",
      path: "/auth",
      key: world.key,
      body: { uuid, config: { userName: "evil\nrename" } }
    });
    expect(bad.httpStatus, "rename to a control-char name must be rejected").not.toBe(200);
    expect(readUserFile(uuid).userName, "the stored name must be unchanged").toBe("rename_target_x");

    const del = await requestPanel({ method: "DELETE", path: "/auth", key: world.key, body: [uuid] });
    expect(del.httpStatus, "temp user cleanup must succeed").toBe(200);
  });

  it("/auth/search pagination + type boundaries (validator gates NaN; no crash)", async () => {
    const nanPage = await requestPanel({
      method: "GET",
      path: "/auth/search",
      key: world.key,
      query: { page: "abc", page_size: 10 }
    });
    expect(nanPage.httpStatus, "NaN page must hit the validator -> 400").toBe(400);

    const negPage = await requestPanel({
      method: "GET",
      path: "/auth/search",
      key: world.key,
      query: { page: -5, page_size: 10 }
    });
    expect(negPage.httpStatus, "negative page clamps to page 1").toBe(200);

    const huge = await requestPanel({
      method: "GET",
      path: "/auth/search",
      key: world.key,
      query: { page: 1, page_size: 999999 }
    });
    expect(huge.httpStatus).toBe(200);
    expect(searchRows(huge).length).toBeLessThanOrEqual(50);
    expect(searchRows(huge).length).toBeGreaterThan(0);
  });

  it("protected routes reject missing/empty/traversal uuid (validator + instance gate)", async () => {
    const empty = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: "" }
    });
    // The per-instance router.use gate runs BEFORE the route validator, so an
    // empty uuid is denied with 403 (gate) - a validator 400 would be equally
    // acceptable. The security property: the request never reaches the daemon.
    expect(
      [400, 403],
      `empty uuid must be rejected (gate 403 or validator 400), got ${empty.httpStatus}`
    ).toContain(empty.httpStatus);

    const trav = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: "../" + world.instance.uuid }
    });
    expect(trav.httpStatus, "traversal-shaped uuid must not pass the instance gate").toBe(403);
  });
});

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

describe("security: file + upload/download hardening", () => {
  it("download passport is single-use; replay is rejected", async () => {
    // create a small file via touch+edit
    await requestPanel({
      method: "POST",
      path: "/files/touch",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { target: "sec_dl.txt" }
    });
    const edit = await requestPanel({
      method: "PUT",
      path: "/files",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { target: "sec_dl.txt", text: "SINGLE-USE" }
    });
    expect(edit.httpStatus).toBe(200);

    const pp = await getDownloadPassport(
      di(),
      world.instance.uuid!,
      u1().cookie,
      u1().token,
      "sec_dl.txt"
    );
    expect(pp.password).toBeTruthy();
    const first = await downloadFromDaemon(pp, "sec_dl.txt");
    expect(first.httpStatus, "first download must succeed").toBe(200);
    expect(first.data.toString("utf-8")).toBe("SINGLE-USE");

    const replay = await downloadFromDaemon(pp, "sec_dl.txt");
    expect(replay.httpStatus, "passport replay must be rejected (mission deleted after use)").not.toBe(
      200
    );
  });

  it("an UPLOAD passport cannot be used on /download (mission-type mismatch)", async () => {
    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const r = await downloadFromDaemon(pp, "test.mjs");
    expect(r.httpStatus, "cross-mission passport use must be rejected").not.toBe(200);
  });

  it("upload passport is single-use; second upload with the same key fails", async () => {
    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const tmp = path.join(world.workDir, "sec_once.txt");
    fs.writeFileSync(tmp, "once");
    const a = await uploadToDaemon(pp, tmp, "sec_once.txt", { unzip: false });
    expect(a.httpStatus).toBe(200);
    const b = await uploadToDaemon(pp, tmp, "sec_once.txt", { unzip: false });
    expect(b.httpStatus, "upload passport replay must be rejected").not.toBe(200);
  });

  it("stream_channel passport is REUSABLE within its TTL (documented, unlike file passports)", async () => {
    // Contrast with the file passports above: stream/auth never consumes the
    // mission (no deleteMission in stream_router), so the same password keeps
    // authenticating new sockets until the 1h TTL sweeper drops it. Terminal
    // reconnects depend on this (frontend useTerminal.ts reuses the password) -
    // pinned as current design, with the replay window recorded.
    const ch = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(ch.httpStatus, `stream_channel: ${JSON.stringify(ch.raw).slice(0, 140)}`).toBe(200);
    const { addr, prefix, password } = ch.data || {};
    expect(password, "stream passport password").toBeTruthy();

    const s1 = createStream(addr, prefix, password);
    const first = await s1.ready;
    s1.disconnect();
    expect(first, "first stream auth must succeed").toBe(true);

    const s2 = createStream(addr, prefix, password);
    const second = await s2.ready;
    s2.disconnect();
    expect(second, "current design: the same stream passport authenticates again").toBe(true);
    addFinding({
      id: "F-stream-passport-reusable",
      step: "passport",
      severity: "warn",
      title: "stream_channel passports are NOT consumed on use (1h replay window)",
      detail:
        "stream/auth reads the mission but never deleteMission's it - unlike /upload & /download" +
        " which consume on first use. A leaked stream password therefore authenticates new" +
        " terminal sockets for up to one hour. The reuse is load-bearing for console reconnects" +
        " (useTerminal.ts), so it is pinned as design rather than changed; the password itself" +
        " is a random timeUuid. Consuming on auth would need a reconnect-friendly re-issue flow.",
      evidence: `same password: first auth=${first}, second auth=${second}`
    });
  });

  it("multipart / chunked filenames with traversal are neutralized to basename inside the workspace", async () => {
    const tmp = path.join(world.workDir, "sec_trav.txt");
    fs.writeFileSync(tmp, "trav-payload");

    const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const up = await uploadToDaemon(pp, tmp, "../../evil_trav.txt", { unzip: false });
    // Whether the route accepts the weird name or not, it must never escape:
    // the save path is basename()-normalized into the instance workspace.
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    const ns = names(f);
    expect(
      ns.includes("evil_trav.txt") || up.httpStatus !== 200,
      "traversal filename must be neutralized (basename) or rejected, never escaped"
    ).toBe(true);
    // If anything was saved, its list entry must be the plain basename - a name
    // containing path separators can never appear in the workspace listing.
    for (const n of ns.filter((x: string) => x.includes("evil_trav"))) {
      expect(n, "saved entry must be the neutralized basename").toBe("evil_trav.txt");
    }
    // Escape probes: the traversal target `../../evil_trav.txt` from the
    // instance cwd (workDir/daemon/data/InstanceData/<uuid>) would land in
    // daemon/data or workDir - none of them may exist.
    for (const escaped of [
      path.join(world.workDir, "evil_trav.txt"),
      path.join(world.workDir, "daemon/data/evil_trav.txt"),
      path.join(world.workDir, "daemon/data/InstanceData/evil_trav.txt")
    ]) {
      expect(fs.existsSync(escaped), `must not escape to ${escaped}`).toBe(false);
    }

    // Chunked path: FileWriter.getPath also basenames before joining.
    const pp2 = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    let chunkOk = true;
    try {
      await uploadFileChunked({
        addr: pp2.addr,
        password: pp2.password,
        name: "..\\..\\evil_chunk.txt",
        content: Buffer.from("chunk-trav"),
        pieceSize: 1024
      });
    } catch {
      chunkOk = false; // clean rejection is acceptable - escaping is not
    }
    if (chunkOk) {
      const f2 = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      expect(
        names(f2),
        "if the chunked upload was accepted it must be stored under its basename"
      ).toContain("evil_chunk.txt");
    }
    expect(
      fs.existsSync(path.join(world.workDir, "daemon/data/evil_chunk.txt")),
      "chunked traversal must not escape into daemon/data"
    ).toBe(false);
  });

  it("zips with absolute-path / windows-backslash entries are rejected BEFORE extraction", async () => {
    // Entry names that resolve OUTSIDE the destination directory (zip-slip
    // family). hasZipSlip must reject the whole archive up front.
    const absZip = path.join(world.workDir, "sec_abs.zip");
    buildZip(absZip, [
      { name: "/evil_abs.txt", content: "abs" },
      { name: "inside_ok.txt", content: "ok" }
    ]);
    const winZip = path.join(world.workDir, "sec_win.zip");
    buildZip(winZip, [
      { name: "..\\..\\evil_win.txt", content: "win" },
      { name: "ok2.txt", content: "ok" }
    ]);

    for (const [zipPath, zipName, members] of [
      [absZip, "sec_abs.zip", ["evil_abs.txt", "inside_ok.txt"]],
      [winZip, "sec_win.zip", ["evil_win.txt", "ok2.txt"]]
    ] as Array<[string, string, string[]]>) {
      const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      const up = await uploadToDaemon(pp, zipPath, zipName, { unzip: false });
      expect(up.httpStatus, `upload ${zipName}: ${JSON.stringify(up.data).slice(0, 120)}`).toBe(200);

      const d = await requestPanel({
        method: "POST",
        path: "/files/compress",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid: world.instance.uuid },
        body: { type: 0, source: zipName, targets: ".", code: "utf-8" }
      });
      expect(d.httpStatus, `${zipName} with escaping entries must be rejected`).not.toBe(200);

      const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      const ns = names(f);
      for (const m of members) {
        expect(ns, `nothing from ${zipName} may be extracted`).not.toContain(m);
      }
    }

    expect(
      fs.existsSync(path.join(path.parse(world.workDir).root, "evil_abs.txt")),
      "absolute-entry zip must not write to the drive root"
    ).toBe(false);
  });

  it("chunked upload boundaries: size=0 ok; size=NaN rejected; offset past EOF rejected", async () => {
    const base = async (name: string) => {
      const pp = await getUploadPassport(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
      return { base: daemonBase(pp.addr), password: pp.password, name };
    };

    // size=0: empty file completes immediately.
    const zero = await base("sec_zero.bin");
    const z = await uploadFileChunked({
      addr: zero.base,
      password: zero.password,
      name: zero.name,
      content: Buffer.alloc(0),
      pieceSize: 1024
    });
    expect(z?.data?.id, `size=0 upload must complete: ${JSON.stringify(z).slice(0, 120)}`).toBeTruthy();
    const zList = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(names(zList), "the empty file must land in the workspace").toContain("sec_zero.bin");

    // size=NaN: the writer init must reject (ftruncate ERR_OUT_OF_RANGE).
    const nan = await base("sec_nan.bin");
    const nanRaw = await axios.post(`${nan.base}/upload-new/${encodeURIComponent(nan.password)}`, null, {
      params: { filename: nan.name, size: "abc", unzip: 0, overwrite: "false" },
      validateStatus: () => true,
      timeout: 30000
    });
    expect(
      nanRaw.status,
      `size=NaN must be rejected: ${JSON.stringify(nanRaw.data).slice(0, 120)}`
    ).not.toBe(200);

    // offset past EOF: a piece that would write beyond `size` must be refused.
    const over = await base("sec_over.bin");
    const init = await axios.post(`${over.base}/upload-new/${encodeURIComponent(over.password)}`, null, {
      params: { filename: over.name, size: 8, unzip: 0, overwrite: "false" },
      validateStatus: () => true,
      timeout: 30000
    });
    const id = init.data?.data?.id;
    expect(id, `upload-new(8): ${JSON.stringify(init.data).slice(0, 120)}`).toBeTruthy();

    const boundary = "----mcsmtest" + Math.random().toString(36).slice(2);
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\nContent-Type: application/octet-stream\r\n\r\n`
      ),
      Buffer.from("OVERFLOW"),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    const piece = await axios.post(`${over.base}/upload-piece/${id}`, body, {
      params: { offset: 100 },
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      validateStatus: () => true,
      timeout: 30000
    });
    expect(
      piece.status,
      `offset=100 on an 8-byte file must fail: ${JSON.stringify(piece.data).slice(0, 120)}`
    ).not.toBe(200);

    // Daemon must still be healthy after the malformed attempts.
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(f.httpStatus, "daemon alive after malformed uploads").toBe(200);
  });

  it("/files/status redacts the host disk list for non-admins (info leak guard)", async () => {
    const mine = await requestPanel({
      method: "GET",
      path: "/files/status",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(mine.httpStatus, `/files/status u1: ${JSON.stringify(mine.raw).slice(0, 160)}`).toBe(200);
    // The daemon returns `disks` (host volume letters on Windows). The panel
    // redacts it for non-admins as an EMPTY ARRAY - keeping the frontend
    // `disks: string[]` contract while leaking no host information. (An empty
    // array is the redaction; a populated one is the leak.)
    expect(
      mine.data?.disks,
      `host disk list must be redacted for normal users, got ${JSON.stringify(mine.data?.disks)}`
    ).toEqual([]);
    expect(mine.data?.disk).toBeUndefined();

    const adminView = await requestPanel({
      method: "GET",
      path: "/files/status",
      cookie: adm().cookie,
      token: adm().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(adminView.httpStatus, `/files/status admin: ${JSON.stringify(adminView.raw).slice(0, 160)}`).toBe(
      200
    );
    expect(Array.isArray(adminView.data?.disks), "admin keeps the disk list").toBe(true);
  });
});

describe("security: unauthorized matrix (u2 + integration key)", () => {
  it("u2 cannot touch u1's instance: instance_update / outputlog / upload passport -> 403", async () => {
    const cfg = await requestPanel({
      method: "PUT",
      path: "/protected_instance/instance_update",
      cookie: u2().cookie,
      token: u2().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { stopCommand: "pwned" }
    });
    expect(cfg.httpStatus).toBe(403);

    const log2 = await requestPanel({
      method: "GET",
      path: "/protected_instance/outputlog",
      cookie: u2().cookie,
      token: u2().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(log2.httpStatus).toBe(403);

    const pp = await requestPanel({
      method: "POST",
      path: "/files/upload",
      cookie: u2().cookie,
      token: u2().token,
      query: { daemonId: di(), uuid: world.instance.uuid, upload_dir: "." }
    });
    expect(pp.httpStatus, "u2 must not obtain an upload passport").toBe(403);
  });

  it("the integration key is not an instance admin: POST /files/touch with key -> 403", async () => {
    const r = await requestPanel({
      method: "POST",
      path: "/files/touch",
      key: world.key,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: { target: "key_touch.txt" }
    });
    expect(r.httpStatus, "key must not operate instance files").toBe(403);
  });

  it("normal user cannot run admin-gated async tasks (install_instance) on their own instance", async () => {
    const r = await requestPanel({
      method: "POST",
      path: "/protected_instance/asynchronous",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid, task_name: "install_instance" },
      body: {}
    });
    // The GENERIC /asynchronous channel derives `role` from the CALLER
    // (getUserPermission) and the daemon only runs install tasks for
    // role===ROLE.ADMIN - a normal user must be refused even on an instance
    // they own. (The dedicated /protected_instance/install_instance route is a
    // different story: it hardcodes role=ADMIN and is gated by the panel's
    // allowUsePreset setting instead - out of scope here.)
    expect(
      r.httpStatus,
      `install_instance as normal user must be refused: ${JSON.stringify(r.raw).slice(0, 160)}`
    ).not.toBe(200);
    expect(JSON.stringify(r.raw)).toMatch(/access denied|not allowed|admin|permission|denied/i);
  });

  it("admin infra routes stay closed for normal users (search/overview/nodes)", async () => {
    for (const p of ["/auth/search", "/auth/overview", "/service/remote_services_list"]) {
      const r = await requestPanel({
        method: "GET",
        path: p,
        cookie: u2().cookie,
        token: u2().token,
        query: { page: 1, page_size: 10 }
      });
      expect(r.httpStatus, `u2 GET ${p} must be 403`).toBe(403);
    }
  });

  it("daemonId confusion: own uuid paired with a foreign daemonId is refused", async () => {
    // Ownership is the (daemonId, instanceUuid) PAIR - a u1-owned uuid under a
    // different node id must fail the per-instance gate everywhere.
    const FAKE = "deadbeefdeadbeefdeadbeefdeadbeef";
    const files = await requestPanel({
      method: "GET",
      path: "/files/list",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: FAKE, uuid: world.instance.uuid, target: ".", page: 0, page_size: 10 }
    });
    expect(files.httpStatus, "files list with a forged daemonId must be 403").toBe(403);

    const open = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: FAKE, uuid: world.instance.uuid }
    });
    expect(open.httpStatus, "instance op with a forged daemonId must be 403").toBe(403);
  });

  it("low-priv instance_update cannot smuggle whitelist-outside fields (startCommand/nickname/endTime)", async () => {
    const before = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    const beforeCfg = before.data?.config || {};
    expect(String(beforeCfg.startCommand)).toBe("node test.mjs");

    const smuggle = await requestPanel({
      method: "PUT",
      path: "/protected_instance/instance_update",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid },
      body: {
        startCommand: "evil smuggled",
        nickname: "pwned-nickname",
        endTime: 999999999999,
        disable: true
      }
    });
    expect(smuggle.httpStatus).toBe(200);

    const after = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: u1().cookie,
      token: u1().token,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    const cfg = after.data?.config || {};
    expect(String(cfg.startCommand), "startCommand must be untouched").toBe("node test.mjs");
    expect(String(cfg.nickname), "nickname must be untouched").toBe(beforeCfg.nickname);
    expect(cfg.endTime, "endTime must be untouched").toBe(beforeCfg.endTime);
    expect(cfg.disable, "disable flag must be untouched").toBe(beforeCfg.disable);
  });
});

describe("security: SSRF / URL-fetch gates", () => {
  it("/auth/proxy stays admin-only (SSRF-capable endpoint)", async () => {
    // login_router /proxy forwards ?target= to axios with NO scheme/host check:
    // it is a deliberate admin tool and a full SSRF primitive in the wrong
    // hands. Pin the privilege gate: normal users get 403 even with a valid
    // session, and only the admin surface may reach internal services.
    const user = await requestPanel({
      method: "GET",
      path: "/auth/proxy",
      cookie: u1().cookie,
      token: u1().token,
      query: { target: `http://127.0.0.1:${new URL(world.daemonHttpUrl).port}/` }
    });
    expect(user.httpStatus, "normal user must not use /auth/proxy").toBe(403);

    // Admin-equivalent key DOES proxy to the local daemon (documented surface).
    const keyRes = await requestPanel({
      method: "GET",
      path: "/auth/proxy",
      key: world.key,
      query: { target: `http://127.0.0.1:${new URL(world.daemonHttpUrl).port}/` }
    });
    expect(keyRes.httpStatus, `admin proxy: ${JSON.stringify(keyRes.raw).slice(0, 120)}`).toBe(200);
    // A real ADMIN session (not just the integration key) reaches it too.
    const adminRes = await requestPanel({
      method: "GET",
      path: "/auth/proxy",
      cookie: adm().cookie,
      token: adm().token,
      query: { target: `http://127.0.0.1:${new URL(world.daemonHttpUrl).port}/` }
    });
    expect(adminRes.httpStatus, "admin session proxy must work").toBe(200);
    addFinding({
      id: "F-auth-proxy-ssrf-admin-only",
      step: "ssrf",
      severity: "info",
      title: "/auth/proxy is an unfiltered SSRF primitive gated only by ADMIN level",
      detail:
        "login_router /proxy passes ?target= straight to axios (no checkSafeUrl): any URL the" +
        " panel host can reach (internal services, cloud metadata, file:// in some axios" +
        " versions) is fetchable by an admin. Gate verified closed for normal users. If the" +
        " permission level on this route is ever lowered it becomes a critical SSRF hole.",
      evidence: `u1 -> ${user.httpStatus}; key -> ${keyRes.httpStatus}`
    });
  });

  it("file download_from_url rejects private-IP / file-scheme / no-dot targets (SSRF guard)", async () => {
    // The panel forwards the URL unchecked, but the DAEMON runs checkSafeUrl
    // (rejects IP literals, localhost, .local, no-dot hosts, private DNS
    // results and non-http(s) schemes) BEFORE starting the fetch. No network
    // is needed: every target below is refused at validation time.
    for (const url of [
      "file:///etc/passwd",
      "http://127.0.0.1:24444/",
      "http://169.254.169.254/latest/meta-data/",
      "http://localhost:23333/",
      "http://metadata/"
    ]) {
      const r = await requestPanel({
        method: "POST",
        path: "/files/download_from_url",
        cookie: u1().cookie,
        token: u1().token,
        query: { daemonId: di(), uuid: world.instance.uuid },
        body: { url, file_name: "sec_ssrf_probe.bin" },
        timeout: 30000
      });
      expect(r.httpStatus, `SSRF target ${url} must be refused: ${JSON.stringify(r.raw).slice(0, 140)}`).not.toBe(
        200
      );
      // Pin the REASON (daemon checkSafeUrl) - a generic failure would go
      // green even if the URL guard were removed and something else errored.
      expect(
        JSON.stringify(r.raw),
        `refusal for ${url} must come from the URL guard: ${JSON.stringify(r.raw).slice(0, 140)}`
      ).toMatch(/insecure/i);
    }
    const f = await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".");
    expect(names(f), "no probe file may be created").not.toContain("sec_ssrf_probe.bin");
    // daemon alive afterwards
    expect((await listFiles(di(), world.instance.uuid!, u1().cookie, u1().token, ".")).httpStatus).toBe(
      200
    );
    addFinding({
      id: "F-download-url-ssrf-guard",
      step: "ssrf",
      severity: "info",
      title: "download_from_url SSRF guard lives on the daemon (checkSafeUrl), not the panel",
      detail:
        "The panel route performs no URL validation; rejection happens in daemon" +
        " file/download_from_url via checkSafeUrl (IP/localhost/.local/no-dot/private-DNS and" +
        " non-http(s) schemes refused). Defense-in-depth note: if a daemon ever skips that" +
        " check the panel would happily forward internal targets. DNS-rebinding and open" +
        " redirect-following are NOT covered by checkSafeUrl (documented residual risk).",
      evidence: "5 SSRF-shaped targets all non-200; workspace clean"
    });
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
