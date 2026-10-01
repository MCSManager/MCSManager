import { describe, it, expect } from "vitest";
import { world, requestPanel, login, ensureUser, addFinding, saveState } from "../lib";

// Auth-system integration suite.
//
// Boots a FRESH REAL daemon + panel per invocation (via globalSetup's
// bootRuntime — no mocks). The in-memory `world` spans this single suite only;
// later sibling suites start with a fresh pair, so this suite is
// self-contained: its early `it`s create the admin + u1/u2 + a throwaway
// instance via the integration-test key.
//
// Coverage matrix (see task-5-brief):
//   install state · login · token/forgery · api-key gate · key boundary · validator
//
// Review Focus behaviors pinned (see brief):
//   #1 key-boundary  (key bypasses `permission` only, NOT the per-instance gate)
//   #2 apikey-disabled (default enableApiKey=false -> bogus header -> 403 disabledApiKey;
//      a normal user enabling api key is gated via the SAME i18n key)
//   #3 validator 400 (POST /auth with weak pw non-200; /auth/login missing password
//      -> 400 "Validator failed: ...")
//   #4 token/forged 403 (wrong token -> 403 forbiddenTokenError; forged cookie+token
//      -> 403; missing x-requested-with on a token route -> 403 ajaxError)

const di = () => world.daemonId;

describe("auth: install state machine", () => {
  it("fresh boot: GET /auth/status reports isInstall=false BEFORE any user exists", async () => {
    const r = await requestPanel({ method: "GET", path: "/auth/status", key: world.key });
    expect(r.httpStatus).toBe(200);
    expect(r.data).toHaveProperty("isInstall", false);
  });

  it("ensure users: admin + u1 + u2 created via the integration-test key", async () => {
    // ensureUser creates the record if absent (perm 1 fallback) and logs the
    // user in — populating world.{admin,u1,u2}.{uuid,cookie,token}.
    world.admin.uuid = await ensureUser("admin", world.key);
    world.u1.uuid = await ensureUser("u1", world.key);
    world.u2.uuid = await ensureUser("u2", world.key);
    saveState();
    expect(world.admin.uuid).toBeTruthy();
    expect(world.u1.uuid).toBeTruthy();
    expect(world.u2.uuid).toBeTruthy();
  });

  it("GET /auth/status reports isInstall=true AFTER the admin is created", async () => {
    const r = await requestPanel({ method: "GET", path: "/auth/status", key: world.key });
    expect(r.httpStatus).toBe(200);
    expect(r.data).toHaveProperty("isInstall", true);
  });

  it("POST /auth/install rejected after install -> 400 (validator catches handler throw)", async () => {
    // The brief predicted 500 (handler throws -> protocol Error branch -> 500).
    // Reality: the route's `validator({ body })` middleware wraps
    // `return await next()` in try/catch and converts the handler throw into a
    // 400 string body. Verified empirically against the real panel. See
    // docs/test-doubts/panel-login_router-validator-error-status.md.
    const r = await requestPanel({
      method: "POST",
      path: "/auth/install",
      body: { username: "second_admin", password: "Www.123456" }
    });
    expect(r.httpStatus, "install must reject a second admin with 400 (validator catches)").toBe(
      400
    );
    expect(String(r.data)).toMatch(/already|installed/i);
    addFinding({
      id: "F-install-rejected-status",
      step: "install",
      severity: "info",
      title: "POST /auth/install when already installed returns non-200 (400 by way of validator)",
      detail: `When users already exist, /auth/install throws
Error($t('TXT_CODE_router.user.installed')) ("Admin account has already been created...").
The brief predicted protocol-500. Reality is validator-400: the route's validator
middleware wraps \`return await next()\` in try/catch and catches the handler throw,
setting ctx.status=400 and a string body before protocol string-branches it into
the envelope. Status is therefore 400 (not 500) — same documented inconsistency
family as the per-route "which middleware catches the throw" ambiguity. No product
change; see docs/test-doubts/panel-login_router-validator-error-status.md.`,
      evidence: `http=${r.httpStatus} data=${String(r.data).slice(0, 120)}`
    });
  });
});

describe("auth: login + token + forgery", () => {
  it("admin login -> cookie + token (length 10+)", async () => {
    const r = await login(world.admin.name, world.admin.pass);
    expect(r.ok, `admin login failed: ${JSON.stringify(r.raw)}`).toBe(true);
    expect(r.token.length).toBeGreaterThan(10);
    expect(r.cookie.length).toBeGreaterThan(0);
    world.admin.cookie = r.cookie;
    world.admin.token = r.token;
    saveState();
  });

  it("u1 login -> cookie + token", async () => {
    const r = await login(world.u1.name, world.u1.pass);
    expect(r.ok, `u1 login failed: ${JSON.stringify(r.raw)}`).toBe(true);
    expect(r.token.length).toBeGreaterThan(10);
    world.u1.cookie = r.cookie;
    world.u1.token = r.token;
    saveState();
  });

  it("u1 (normal) cannot create a user via POST /auth (admin-only) -> 403", async () => {
    const r = await requestPanel({
      method: "POST",
      path: "/auth",
      cookie: world.u1.cookie,
      token: world.u1.token,
      body: { username: "evil_user", password: "Www.123456", permission: 1 }
    });
    expect(r.httpStatus).toBe(403);
    // permission middleware's verificationFailed branch sets the i18n
    // "Insufficient Permissions" string body -> protocol string-branches to 403.
    expect(String(r.data)).toMatch(/permission|forbidden|insufficient/i);
  });

  it("wrong token on a token-protected route -> 403 forbiddenTokenError", async () => {
    // GET /api/instance requires USER level + token + Ajax header. The token
    // check fires BEFORE the per-instance gate, so any uuid works here.
    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: world.u1.cookie,
      token: "WRONG-TOKEN",
      query: { daemonId: di(), uuid: "any" }
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/token/i);
  });

  it("forged cookie + fake token -> 403 forbiddenTokenError", async () => {
    // requestPanel auto-injects x-requested-with when `cookie:` is passed, so
    // we reach the token gate (which fails against the forged session's
    // empty `ctx.session.token`).
    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: "koa:sess=fake; koa:sess.sig=fake",
      token: "FAKE-TOKEN",
      query: { daemonId: di(), uuid: "any" }
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/token/i);
  });

  it("missing x-requested-with on a token route -> 403 ajaxError", async () => {
    // requestPanel only injects x-requested-with when `cookie:` is passed.
    // By setting `Cookie:` via `headers:` instead we send the real u1 session
    // WITHOUT the Ajax header -> ajaxError 403 fires before the token check.
    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      token: world.u1.token,
      query: { daemonId: di(), uuid: "any" },
      headers: { Cookie: world.u1.cookie }
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/xmlhttprequest|x-requested-with|ajax|header/i);
  });
});

describe("auth: api-key gate (default enableApiKey=false)", () => {
  it("bogus x-request-api-key header on an admin route -> 403 disabledApiKey", async () => {
    // The apikey branch in permission middleware sees enableApiKey=false and
    // short-circuits to `disabledApiKey` (i18n: "API key creation feature is
    // not enabled"). Test by hand-setting the header (NOT passing `key:` —
    // that would bypass via the unsafe-integration-test path).
    const r = await requestPanel({
      method: "GET",
      path: "/auth/overview",
      headers: { "x-request-api-key": "bogus-not-a-real-key" }
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/API key/i);
  });

  it("u1 PUT /auth/api {enable:true} -> 500 'API key creation feature is not enabled'", async () => {
    // The u1 session passes the USER-level permission gate. Inside the
    // handler, `enableApiKey=false` -> throw the same i18n key. The handler's
    // own try/catch captures the Error and sets ctx.body = Error; protocol's
    // Error branch returns the documented 500 envelope. Verified empirically.
    const r = await requestPanel({
      method: "PUT",
      path: "/auth/api",
      cookie: world.u1.cookie,
      token: world.u1.token,
      body: { enable: true }
    });
    expect(
      r.httpStatus,
      "enabling api key while globally disabled must be gated (handler-throws -> 500)"
    ).toBe(500);
    expect(String(r.data)).toMatch(/API key/i);
  });
});

describe("auth: key bypasses panel permission ONLY (per-instance gate still applies)", () => {
  it("create a throwaway instance via POST /api/instance with the integration-test key", async () => {
    // instance_admin_router POST / is ADMIN-level + validator(query:daemonId).
    // The key bypasses the admin gate; the validator needs daemonId; the
    // daemon's `instance/new` accepts a `nickname` config (not `full_name` —
    // confirmed from daemon/src/service/system_instance.ts `parameters(...)`
    // and Instance_router.ts's `instance/new` response).
    const r = await requestPanel({
      method: "POST",
      path: "/instance",
      key: world.key,
      query: { daemonId: di() },
      body: {
        nickname: world.instance.name,
        startCommand: "node test.mjs",
        stopCommand: "exit",
        cwd: "",
        ie: "utf-8",
        oe: "utf-8"
      }
    });
    expect(r.httpStatus, `create instance: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
    expect(r.data?.instanceUuid).toBeTruthy();
    world.instance.uuid = r.data.instanceUuid;
    saveState();
  });

  it("GET /api/instance?uuid=<real> with the key -> 500 (per-instance gate refuses the empty key-user)", async () => {
    // GET /api/instance is USER-level + token-free. Under the key the panel's
    // `permission` middleware bypasses entirely (level/ajax/token checks all
    // skipped). The route handler, though, calls isHaveInstanceByUuid(
    //   getUserUuid(ctx), daemonId, uuid). getUserUuid sees the apikey header
    //   and calls getUuidByApiKey(<integration key>) -> no user has that api
    //   key -> returns "" -> isHaveInstanceByUuid returns false -> the handler
    //   throws "Insufficient Permissions". The handler's outer try/catch sets
    //   ctx.body = Error -> protocol Error-branches to a 500 envelope.
    //
    // This proves the key bypasses PANEL `permission` only — it is NOT a
    // per-instance backdoor. F-key-not-instance-admin is always added;
    // F-instance-admin-throw-500 is added only if the return is 500, to
    // document the 500-vs-403 inconsistency vs the per-router `router.use`
    // gates (instance_operate/filemananger/java_manager all return 403).
    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      key: world.key,
      query: { daemonId: di(), uuid: world.instance.uuid }
    });
    expect(
      r.httpStatus,
      "the key must NOT read a specific instance via the per-instance gate (handler-throws -> 500)"
    ).toBe(500);
    addFinding({
      id: "F-key-not-instance-admin",
      step: "key-boundary",
      severity: "info",
      title: "Integration-test key does NOT bypass the per-instance gate",
      detail:
        "--unsafe-integration-test-mode skips ONLY the panel `permission` middleware" +
        " (level/token/session/ajax/apikey checks). The per-instance `isHaveInstanceByUuid`" +
        " check inside the route handler still runs and reads `getUserUuid(ctx)`, which" +
        ' under the key returns "" (the key is not a real api-key in the user store).' +
        " isHaveInstanceByUuid returns false -> handler throws 'Insufficient Permissions'." +
        " Consequence: the key can manage users/nodes/settings (routes with no per-instance" +
        " gate) but cannot read/operate a specific instance unless the panel would grant" +
        " that to an empty user. Good security: the key is admin-of-the-panel, not" +
        " admin-of-every-instance.",
      evidence: `GET /api/instance?uuid=<real> with key -> http=${r.httpStatus} data=${String(
        r.data
      ).slice(0, 120)}`
    });
    if (r.httpStatus === 500) {
      addFinding({
        id: "F-instance-admin-throw-500",
        step: "key-boundary",
        severity: "info",
        title: "instance_admin GET / 越权 returns 500 (handler throw) not 403",
        detail:
          "GET /api/instance by a non-owner (or the integration key) returns httpStatus 500" +
          " because instance_admin_router checks ownership inside the handler with `throw`," +
          " which the protocol middleware converts to a 500 error envelope. The sibling" +
          " routers (instance_operate/filemananger/java_manager/schedule/mod_manager) put the" +
          " same check in `router.use` and return a clean 403. Already documented in" +
          " docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md.",
        evidence: `http=${r.httpStatus} body=${JSON.stringify(r.raw).slice(0, 160)}`
      });
    }
  });
});

describe("auth: validator + input-shape gates", () => {
  it("POST /auth with a weak password -> non-200 (handler throws, validator catches)", async () => {
    // POST /auth is admin-only. With the key the permission gate is bypassed;
    // validator passes (all three fields present + correctly typed); the
    // handler runs `userSystem.validatePassword('123')` -> false -> throw
    // "Invalid Password Format". validator's try-by-next catch converts the
    // throw into a 400 string body (doc: same family as
    // panel-login_router-validator-error-status.md).
    const r = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: "weak_x", password: "123", permission: 1 }
    });
    expect(r.httpStatus).toBe(400);
    expect(String(r.data)).toMatch(/invalid password|password/i);
  });

  it("POST /auth/login without a password -> envelope status 400 'Validator failed'", async () => {
    // validator's check() throws `Validator failed: "password" is required!`
    // before the handler runs (body.password is null). validator's own
    // try/catch catches it -> ctx.status=400, body=string -> protocol
    // string-branches into the {400, "Validator failed: ...", time} envelope.
    const r = await requestPanel({
      method: "POST",
      path: "/auth/login",
      body: { username: world.admin.name } // password intentionally absent
    });
    expect(r.httpStatus).toBe(400);
    expect(String(r.data)).toMatch(/Validator failed.*password/i);
  });
});
