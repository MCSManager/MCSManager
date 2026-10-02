import { describe, it, expect } from "vitest";
import {
  world,
  requestPanel,
  login,
  saveState,
  addFinding,
  setupSecurityWorld,
  readUserFile,
  searchUser,
  searchRows,
  di,
  u1,
  u2
} from "../lib";

// Security suite — USER module (split from the former monolithic
// suites/security.test.ts; shared helpers live in ../lib/security.ts).
//
// (real daemon + real panel, no mocks, real HTTP + socket.io). Boots a FRESH
// REAL daemon + panel per invocation. Self-contained: the first `it` ensures
// admin/u1/u2, creates the main instance owned by u1 and uploads the test.mjs
// fixture. Everything after drives attack-style requests:
//   privilege escalation & mass assignment (incl. scrubbed-row write-back) ·
//   user permission-state boundaries (GUEST 0 / BAN -1) · input boundaries
//   (password/username/validator/pagination) · unauthorized matrix (u2 +
//   integration key + daemonId confusion + low-priv whitelist).
//
// Sibling modules: security_instance (command injection), security_files
// (file/upload/download hardening + SSRF), security_auth (API-key / 2FA /
// rate limit / login ban — that file's ban block is destructive and LAST).
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
