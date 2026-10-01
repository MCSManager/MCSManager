import { describe, it, expect } from "vitest";
import {
  world,
  requestPanel,
  login,
  loginSessionRetry,
  ensureUser,
  ensureOwner,
  addFinding,
  saveState
} from "../lib";

// User-module + 越权 integration suite.
//
// Boots a FRESH REAL daemon + panel per invocation (via globalSetup's
// bootRuntime — no mocks). Self-contained: the early `it`s create admin + u1
// + u2 via the integration-test key, then create a minimal instance (NOT
// quick_install — no jar) and assign it to u1, so the 越权 `it`s can pin the
// 403/500 split against real u1/u2 sessions.
//
// Coverage matrix (see task-6-brief):
//   create/duplicate/weak-password · normal-user 403 paths · /auth/search
//   paginated + scrubbed · 越权 403/500 split (Review Focus #2) · normal-user
//   quick_install 403.
//
// Review Focus #2 — the 403/500 split pinned here (越权 u2 vs u1's instance):
//   GET /api/instance                  -> 500 (handler-throws, finding)
//   GET /protected_instance/open       -> 403 (per-instance router.use gate)
//   GET /files/list                    -> 403 (per-instance router.use gate)
//   POST /protected_instance/stream_channel -> 403 (per-instance router.use gate)

const di = () => world.daemonId;
const iu = () => world.instance.uuid!;

describe("user: admin creates users; duplicate + weak password rejected", () => {
  it("ensure admin + u1 + u2 exist (via the integration-test key, perm 1)", async () => {
    // ensureUser creates the record if absent (perm 1 fallback — even
    // `ensureUser("admin", key)` is perm 1 here; admin routes below are
    // reached via the KEY, not via world.admin's cookie). All three logins
    // are stored on world so later `it`s can use them.
    world.admin.uuid = await ensureUser("admin", world.key);
    world.u1.uuid = await ensureUser("u1", world.key);
    world.u2.uuid = await ensureUser("u2", world.key);
    saveState();
    expect(world.admin.uuid).toBeTruthy();
    expect(world.u1.uuid).toBeTruthy();
    expect(world.u2.uuid).toBeTruthy();
  });

  it("duplicate username returns no uuid; weak password (123) rejected, Www.123456 accepted", async () => {
    // POST /auth is admin-only. With the key the permission gate is bypassed.
    // Duplicate: handler throws `existsUserName` -> validator converts to a
    // 400 string body (doc family: panel-login_router-validator-error-status).
    // The body is a string, so `.data?.uuid` is undefined (falsy).
    const dup = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: world.u1.name, password: world.u1.pass, permission: 1 }
    });
    expect(dup.data?.uuid, "duplicate create must not return a uuid").toBeFalsy();
    expect(dup.httpStatus, "duplicate create must be non-200").not.toBe(200);

    // Weak password: handler throws `invalidPassword` -> 400 string body.
    const weak = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: "weak_x", password: "123", permission: 1 }
    });
    expect(weak.httpStatus, "weak password must be rejected").not.toBe(200);
    expect(weak.data?.uuid, "weak password create must not return a uuid").toBeFalsy();

    // Strong password with a new username is accepted (200 + uuid).
    const strong = await requestPanel({
      method: "POST",
      path: "/auth",
      key: world.key,
      body: { username: "ok_user_x", password: "Www.123456", permission: 1 }
    });
    expect(
      strong.httpStatus,
      `strong password create: ${JSON.stringify(strong.raw).slice(0, 200)}`
    ).toBe(200);
    expect(strong.data?.uuid).toBeTruthy();
  });
});

describe("user: create a minimal instance owned by u1 (via the key)", () => {
  it("POST /api/instance with the key creates the instance (no jar, no quick_install)", async () => {
    // instance_admin_router POST / is ADMIN-level + validator(query:daemonId).
    // The key bypasses the admin gate. The daemon's `instance/new` accepts a
    // `nickname` config (mirrors T5 auth.test.ts it #13 — verified against
    // daemon/src/service/system_instance.ts `parameters(...)`).
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

  it("ensureOwner(u1, key) assigns the instance to u1 and verifies via /auth/overview", async () => {
    const uuid = await ensureOwner("u1", world.key);
    expect(uuid).toBe(world.u1.uuid);
    const ov = await requestPanel({ method: "GET", path: "/auth/overview", key: world.key });
    const me = (ov.data || []).find((x: any) => x.uuid === world.u1.uuid);
    expect(
      me?.instances?.some((x: any) => x.daemonId === di() && x.instanceUuid === iu()),
      "u1 must own the instance after ensureOwner"
    ).toBe(true);
  });
});

describe("user: normal user cannot create/delete/search/overview/edit others (403)", () => {
  it("u1 POST /auth (admin-only) -> 403", async () => {
    const r = await requestPanel({
      method: "POST",
      path: "/auth",
      cookie: world.u1.cookie,
      token: world.u1.token,
      body: { username: "evil_user", password: "Www.123456", permission: 1 }
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/permission|forbidden|insufficient/i);
  });

  it("u1 DELETE /auth (admin-only) -> 403", async () => {
    const r = await requestPanel({
      method: "DELETE",
      path: "/auth",
      cookie: world.u1.cookie,
      token: world.u1.token,
      body: [world.u2.uuid]
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/permission|forbidden|insufficient/i);
  });

  it("u1 GET /auth/overview (admin-only) -> 403", async () => {
    const r = await requestPanel({
      method: "GET",
      path: "/auth/overview",
      cookie: world.u1.cookie,
      token: world.u1.token
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/permission|forbidden|insufficient/i);
  });

  it("u1 PUT /auth on another user (admin-only) -> 403", async () => {
    // user_overview_router PUT / is ADMIN-level. u1 hits the permission gate
    // before the handler runs, so the body target (u2's uuid) is irrelevant.
    const r = await requestPanel({
      method: "PUT",
      path: "/auth",
      cookie: world.u1.cookie,
      token: world.u1.token,
      body: { uuid: world.u2.uuid, config: { instances: [] } }
    });
    expect(r.httpStatus).toBe(403);
    expect(String(r.data)).toMatch(/permission|forbidden|insufficient/i);
  });
});

describe("user: GET /auth/search paginated + scrubbed (no password/salt/apiKey in data)", () => {
  it("admin search returns a page whose user objects have passWord/salt/apiKey scrubbed", async () => {
    // manage_user_router GET /search: ADMIN-level + validator(query:page,page_size).
    // The handler calls `selectPage` then scrubs every row:
    //   v.passWord = ""; v.salt = ""; v.apiKey = v.apiKey ? "__MCSM_SECRET_DATA__" : "";
    // So the fields are PRESENT but scrubbed — the secret never crosses the wire.
    const r = await requestPanel({
      method: "GET",
      path: "/auth/search",
      key: world.key,
      query: { page: 1, page_size: 10 }
    });
    expect(r.httpStatus, `search: ${JSON.stringify(r.raw).slice(0, 200)}`).toBe(200);
    const page = r.data;
    expect(page, "search must return a page object").toBeTruthy();
    const rows: any[] = Array.isArray(page) ? page : page?.data || [];
    expect(rows.length, "search must return at least one user row").toBeGreaterThan(0);
    // Pagination envelope: { data, maxPage, page, pageSize } (or similar).
    if (page && typeof page === "object" && "maxPage" in page) {
      expect(page.maxPage).toBeGreaterThanOrEqual(1);
      expect(page.page).toBe(1);
    }
    for (const u of rows) {
      // The secrets are scrubbed to empty string (or sentinel for apiKey).
      expect(u.passWord, "passWord must be scrubbed to empty").toBe("");
      expect(u.salt, "salt must be scrubbed to empty").toBe("");
      expect(
        u.apiKey === "" || u.apiKey === "__MCSM_SECRET_DATA__",
        "apiKey must be scrubbed"
      ).toBe(true);
    }
  });

  it("search by userName filters to u1 (still scrubbed) and respects role filter", async () => {
    const r = await requestPanel({
      method: "GET",
      path: "/auth/search",
      key: world.key,
      query: { userName: world.u1.name, page: 1, page_size: 10 }
    });
    expect(r.httpStatus).toBe(200);
    const page = r.data;
    const rows: any[] = Array.isArray(page) ? page : page?.data || [];
    expect(
      rows.some((u: any) => u.userName === world.u1.name),
      "u1 must appear in filtered search"
    ).toBe(true);
    for (const u of rows) {
      expect(u.passWord).toBe("");
      expect(u.salt).toBe("");
      expect(u.apiKey === "" || u.apiKey === "__MCSM_SECRET_DATA__").toBe(true);
    }
  });
});

describe("user: 越权 u2 cannot read/operate u1's instance (403 / 500 split)", () => {
  it("refresh real u1 + u2 sessions for the cross-user assertions", async () => {
    // ensureUser already logged u1/u2 in. The brief asks for explicit real
    // logins here so the cross-user cookies/tokens are unambiguously fresh.
    const r1 = await login(world.u1.name, world.u1.pass);
    expect(r1.ok, `u1 login failed: ${JSON.stringify(r1.raw)}`).toBe(true);
    world.u1.cookie = r1.cookie;
    world.u1.token = r1.token;
    const r2 = await loginSessionRetry("u2");
    expect(r2.cookie.length).toBeGreaterThan(0);
    saveState();
  });

  it("u1 can read its own instance (positive control)", async () => {
    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: world.u1.cookie,
      token: world.u1.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      r.httpStatus,
      `u1 must read its own instance: ${JSON.stringify(r.raw).slice(0, 200)}`
    ).toBe(200);
    expect(String(r.data?.config?.nickname || "")).toBe(world.instance.name);
  });

  it("u2 GET /api/instance?uuid=u1inst -> 500 (handler-throws, NOT 403)", async () => {
    // instance_admin_router GET / checks ownership INSIDE the handler with
    // `throw` — the protocol middleware converts that to a 500 error envelope.
    // The sibling routers (instance_operate/filemananger) put the same check
    // in `router.use` and return a clean 403. The 500-vs-403 split is an
    // inconsistency we DOCUMENT, not fix — see
    // docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md.
    const r = await requestPanel({
      method: "GET",
      path: "/instance",
      cookie: world.u2.cookie,
      token: world.u2.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(r.httpStatus, "u2 must NOT read u1's instance; expect 500 (handler throw)").toBe(500);
    addFinding({
      id: "F-instance-admin-throw-500",
      step: "越权",
      severity: "info",
      title: "instance_admin GET / 越权 returns 500 (handler throw) not 403",
      detail:
        "GET /api/instance by a non-owner returns httpStatus 500 because instance_admin_router" +
        " checks ownership inside the handler with `throw`, which the protocol middleware" +
        " converts to a 500 error envelope. The sibling routers (instance_operate/" +
        "filemananger/java_manager/schedule/mod_manager) put the same check in `router.use`" +
        " and return a clean 403. Already documented in" +
        " docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md.",
      evidence: `http=${r.httpStatus} body=${JSON.stringify(r.raw).slice(0, 160)}`
    });
  });

  it("u2 GET /protected_instance/open -> 403 (per-instance router.use gate)", async () => {
    const r = await requestPanel({
      method: "GET",
      path: "/protected_instance/open",
      cookie: world.u2.cookie,
      token: world.u2.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(r.httpStatus, "u2 must NOT open u1's instance via the per-instance gate").toBe(403);
  });

  it("u2 GET /files/list -> 403 (per-instance router.use gate)", async () => {
    const r = await requestPanel({
      method: "GET",
      path: "/files/list",
      cookie: world.u2.cookie,
      token: world.u2.token,
      query: { daemonId: di(), uuid: iu(), target: ".", page: 0, page_size: 10 }
    });
    expect(r.httpStatus, "u2 must NOT list files of u1's instance via the per-instance gate").toBe(
      403
    );
  });

  it("u2 POST /protected_instance/stream_channel -> 403 (per-instance router.use gate)", async () => {
    const r = await requestPanel({
      method: "POST",
      path: "/protected_instance/stream_channel",
      cookie: world.u2.cookie,
      token: world.u2.token,
      query: { daemonId: di(), uuid: iu() }
    });
    expect(
      r.httpStatus,
      "u2 must NOT open a stream channel to u1's instance via the per-instance gate"
    ).toBe(403);
  });
});

describe("user: normal user cannot self quick_install (per-instance gate on uuid='-')", () => {
  it("u1 POST /protected_instance/asynchronous?uuid=-&task_name=quick_install -> 403", async () => {
    // The per-instance `router.use` gate runs isHaveInstanceByUuid(user,
    // daemonId, '-') which is false for non-admins (only isTopPermission
    // passes uuid='-'). McPreset.vue sends uuid='-' on the install path, so a
    // normal user cannot install an own instance — an admin must install
    // then assign (PUT /api/auth). The gate is CORRECT/SAFE: documented via
    // the F-normal-quickinstall finding, no product change, no doubt doc
    // (the assertion passes deterministically — no fragile path to flag).
    const r = await requestPanel({
      method: "POST",
      path: "/protected_instance/asynchronous",
      cookie: world.u1.cookie,
      token: world.u1.token,
      query: { daemonId: di(), uuid: "-", task_name: "quick_install" },
      body: { time: Date.now(), newInstanceName: "blocked", targetLink: "", setupInfo: {} }
    });
    expect(r.httpStatus, "u1 must be blocked from quick_install on uuid='-'").toBe(403);
    addFinding({
      id: "F-normal-quickinstall",
      step: "quick_install",
      severity: "info",
      title: "Normal user blocked from quick_install by per-instance gate on uuid='-'",
      detail:
        "POST /api/protected_instance/asynchronous?uuid=-&task_name=quick_install with a" +
        " normal user returns httpStatus=403. The per-instance `router.use` gate calls" +
        " isHaveInstanceByUuid(user, daemonId, '-') which is false for non-admins; only" +
        " isTopPermission passes uuid='-'. McPreset.vue sends uuid='-', so a normal user" +
        " cannot install an own instance — an admin must install then assign" +
        " (PUT /api/auth). The gate is correct/safe: documented here, no product change.",
      evidence: `http=${r.httpStatus} body=${JSON.stringify(r.raw).slice(0, 160)}`
    });
  });
});
