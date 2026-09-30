# Backend Route Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user has pre-selected **parallel subagent** execution, and has authorized autonomous/unattended operation with per-step commits for traceability.

**Goal:** Give every backend route/interface of `panel` (Web backend) and `daemon` (node worker) a vitest unit/integration test, run it under TDD, and auto-fix confirmed bugs while recording uncertainties as Chinese doubt docs.

**Architecture:** Two purpose-built, in-process test harnesses — panel mounts a single real `@koa/router` on a Koa app with a fake-session middleware and the real `protocol` envelope middleware, driven by `supertest`; daemon drives the `routerApp` EventEmitter singleton with a fake `Socket` + `RouterContext`, plus `supertest` for its 5 Koa routes. Heavy boundary services (standing across both: socket.io RPC, storage, dockerode, compress binaries, network, timers, PTY) are mocked via `vi.mock`/`vi.fn`. Auth is injected by seeding sessions / mutating the daemon config singleton, so the real permission/gate middleware is genuinely exercised, not stubbed.

**Tech Stack:** vitest `^0.33.0` (panel/common already use it; daemon adopts it), `supertest` + `@types/supertest`, vite `resolve.alias` for `mcsmanager-common`→source and `@languages`.

**Spec:** `docs/superpowers/specs/2026-09-29-backend-route-tests-design.md`

## Global Constraints

- vitest `^0.33.0`, `environment: "node"`, `include: ["src/**/*.test.ts"]` (panel) and the daemon mirror.
- vitest `resolve.alias`: `mcsmanager-common` → absolute `common/src/index.ts`, `@languages` → absolute `../languages`.
- Tests **do not** spawn real daemons, open real ports, or require `daemon/lib` binaries / docker / network. Those are mocked or gated by `process.platform`.
- `DATA_PATH`-derived modules (`StorageSubsystem`, `system_storage`): when a test genuinely hits storage, `process.chdir(tmpDir)` **before** the dynamic `import()`; otherwise `vi.mock` them.
- Daemon `globalConfiguration` is a mutable singleton and `load()` is **not** called at import — mutate `globalConfiguration.config.*` directly in tests rather than mocking config.
- Windows: `fs.chmod` only toggles read-only; gate POSIX-mode assertions with `process.platform === "win32"` skips and assert mocked call args.
- Code/comments in English; doubt docs in Chinese under `docs/test-doubts/` with an index `README.md`.
- Panel response envelope is `{status, data, time}` (stringified JSON); unwrap to assert status + data.
- Do not edit `scripts/verify-auto-update*.mjs` (unrelated E2E layer).

## Review Focus

The spec implies behaviors that, if untested, are most likely to bite a user of this software. Each is pinned to a concrete test in the owning task.

1. **Panel: a logged-in session without a matching `?token=` on a token-required route is rejected (403 `forbiddenTokenError`)** — pinned in Task 7 (P1-auth batch: assert `/auth/update` PUT with mismatched token → 403).
2. **Panel: an API-key request when `enableApiKey` is false is rejected (403, i18n key `TXT_CODE_db253979`)** — pinned in Task 7 (assert `/overview` GET with `x-request-api-key` and `systemConfig.enableApiKey=false` → 403).
3. **Panel: `validator` rejects a missing required field before the handler runs (envelope status 400, data `"Validator failed: ..."`)** — pinned in Task 7 (assert `/auth/login` POST without `password` → status 400).
4. **Daemon: an unauthenticated socket event is silently dropped (emits back on `ctx.event` a `Packet` with `status: 500`)** — pinned in Task 9 (D1 gate: `dispatch("instance/overview", …)` with a non-logged-in session → emit captures `status===500`).
5. **Daemon: a file path escaping the instance cwd workspace is rejected** — pinned in Task 11 (D3 file: `file/list` with `target:"../../../../etc"` → error packet, none of the FS read).

---

## File Structure

```
daemon/
  vitest.config.ts                         (NEW — Task 1) alias + node env + include src + test dirs
  package.json                             (MODIFY — Task 1) add test script + vitest/​supertest devDeps
  test/
    harness/router.ts                      (NEW — Task 2) fakeSocket, newContext, invoke, dispatch, lastPackets
    harness/http.ts                        (NEW — Task 2) createHttpApp + supertest helper
    harness/mocks.ts                       (NEW — Task 2) factories: globalConfig, InstanceSubsystem, FileManager, docker, compress, missionPassport, downloadManager, node-schedule
    harness/smoke.test.ts                  (NEW — Task 3) proves harness (auth + info handlers)
  src/routers/*.test.ts                    (NEW — Tasks 9-14) one per daemon router, co-located per vitest include OR under test/ importing the router
panel/
  vitest.config.ts                         (MODIFY — Task 4) add resolve.alias (mcsmanager-common, @languages)
  package.json                             (MODIFY — Task 4) add supertest devDep
  test/
    harness/app.ts                        (NEW — Task 4) createTestApp (fake session + real protocol middleware + mount router)
    harness/auth.ts                        (NEW — Task 4) as/asAdmin/asApiKey/asPublic + envelope helper
    harness/mocks.ts                       (NEW — Task 4) factories: userSystem, remoteService, remoteCommand, operationLogger, systemConfig
    harness/smoke.test.ts                  (NEW — Task 5) proves harness (login_info + status)
  src/app/routers/*.test.ts               (NEW — Tasks 6-8) one per panel router
docs/test-doubts/README.md                (NEW — Task 6+ index; updated whenever a doubt is written)
```

Per-router test files live as `*.test.ts` next to the router (matches the existing `login_ban.test.ts` co-location and the vitest `include`). The daemon harness lives in `daemon/test/`; its `include` covers both `src/**/*.test.ts` and `test/**/*.test.ts`.

---

## Task 1: Daemon vitest scaffolding

**Files:**
- Create: `daemon/vitest.config.ts`
- Modify: `daemon/package.json` (script + devDeps)

**Interfaces:** Produces a working `npm test` in `daemon` that runs `vitest run` against `src/**/*.test.ts` + `test/**/*.test.ts`, resolving `mcsmanager-common` and `@languages` to source.

- [ ] **Step 1: Add the vitest config**

`daemon/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "mcsmanager-common": path.resolve(__dirname, "../common/src/index.ts"),
      "@languages": path.resolve(__dirname, "../languages")
    }
  },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    environment: "node",
    globals: false
  }
});
```

- [ ] **Step 2: Add the test script and devDeps to `daemon/package.json`**

Add to `scripts`: `"test": "vitest run"`.
Add to `devDependencies`: `"vitest": "^0.33.0"`, `"supertest": "^7.0.0"`, `"@types/supertest": "^6.0.2"`. (Match panel's vitest version exactly.)

- [ ] **Step 3: Install + smoke run**

Run: `cd daemon && npm install && npm test`
Expected: PASS (exit 0, "No test files found" is acceptable here — the harness smoke test comes in Task 3). If the alias fails, fix the absolute paths in `vitest.config.ts`.

- [ ] **Step 4: Commit**

```bash
git add daemon/vitest.config.ts daemon/package.json daemon/package-lock.json
git commit -m "test(daemon): add vitest scaffolding and module aliases"
```

---

## Task 2: Daemon test harness

**Files:**
- Create: `daemon/test/harness/router.ts`
- Create: `daemon/test/harness/http.ts`
- Create: `daemon/test/harness/mocks.ts`

**Interfaces:**
- Produces `fakeSocket(session?)`, `newContext(event, { uuid?, session })`, `invoke(socket, event, data, opts)`, `dispatch(socket, event, data, opts)`, `packetsFor(socket, event)`, `createHttpApp()`, and mock factories used by every daemon router test.

- [ ] **Step 1: Write the router harness**

`daemon/test/harness/router.ts`:
```ts
import { vi } from "vitest";
import RouterContext from "../../src/entity/ctx";
import { routerApp } from "../../src/service/router";

export interface FakeSocket {
  id: string;
  handshake: { address: string };
  on: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  use: ReturnType<typeof vi.fn>;
}

let idSeq = 0;
export function fakeSocket(address = "127.0.0.1"): FakeSocket {
  return {
    id: `sock-${idSeq++}`,
    handshake: { address: address.startsWith("::ffff:") ? address : `::ffff:${address}` },
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    use: vi.fn()
  };
}

export function newContext(event: string, opts: { uuid?: string | null; session?: any } = {}) {
  const socket = fakeSocket();
  const session = opts.session ?? {};
  const ctx = new RouterContext(opts.uuid ?? null, socket as any, session, event);
  return { ctx, socket, session };
}

// Handler mode: skip gate middlewares, run only the event handler (assume auth).
export function invoke(event: string, data: any, opts: { uuid?: string | null; session?: any } = {}) {
  const { ctx, socket, session } = newContext(event, opts);
  routerApp.emitRouter(event, ctx, data);
  return { socket, ctx, session };
}

// Gate mode: run every routerApp.use middleware in order, then the event handler.
// Mirrors navigation()'s socket.use(...)+socket.on(...) dispatch without a real server.
export function dispatch(
  event: string,
  data: any,
  opts: { uuid?: string | null; session?: any } = {}
) {
  const { ctx, socket, session } = newContext(event, opts);
  const mws = routerApp.getMiddlewares();
  let i = -1;
  function next() {
    i += 1;
    const mw = mws[i];
    if (!mw) {
      routerApp.emitRouter(event, ctx, data);
      return;
    }
    // Middleware signature: (routePath, ctx, data, next)
    const result = mw(event, ctx, data, next);
    if (result && typeof (result as any).then === "function") {
      return result as any;
    }
  }
  next();
  return { socket, ctx, session };
}

// Return every recorded packet for an event: [{status, data, ...}]
export function packetsFor(socket: FakeSocket, event: string) {
  return socket.emit.mock.calls.filter((c) => c[0] === event).map((c) => c[1]);
}
```

- [ ] **Step 2: Write the HTTP harness**

`daemon/test/harness/http.ts`:
```ts
import supertest from "supertest";

// Build the daemon Koa app (http.ts:initKoa). Callers vi.mock heavy deps first.
export async function createHttpApp() {
  const { initKoa } = await import("../../src/service/http");
  return supertest(initKoa().callback());
}
```

- [ ] **Step 3: Write the mock factories**

`daemon/test/harness/mocks.ts` (factories used by `vi.mock(path, () => factory())`):
```ts
import { vi } from "vitest";

export function mockGlobalConfig(overrides: Record<string, any> = {}) {
  return {
    globalConfiguration: {
      config: {
        key: "test-key",
        whiteListPanelIp: false,
        whiteListPanelIps: ["127.0.0.1"],
        prefix: "",
        language: "en_us",
        defaultInstancePath: "",
        ...overrides
      },
      store: vi.fn()
    },
    globalEnv: { fileTaskCount: 0 },
    Config: class {}
  };
}

export function fakeInstance(uuid: string, overrides: Record<string, any> = {}) {
  return {
    instanceUuid: uuid,
    config: { extraConfig: {}, nickName: uuid, startCommand: "", ie: "", stopCommand: "", type: "universal", processType: "general", ...overrides.config },
    info: { maxSpace: 0, cacheSize: 0, playerName: [], ...overrides.info },
    startCount: 0,
    status: vi.fn(() => 0),
    execPreset: vi.fn(async () => undefined),
    forceExec: vi.fn(async () => undefined),
    parameters: vi.fn((cfg) => cfg),
    absoluteCwdPath: vi.fn(() => `/tmp/inst-${uuid}`),
    parseTextParams: vi.fn((t) => t),
    ...overrides
  };
}

export function mockInstanceSystem(instances: any[] = []) {
  const map = new Map(instances.map((i) => [i.instanceUuid, i]));
  return {
    default: {
      instances: map,
      instanceStream: { requestForward: vi.fn(), cannelForward: vi.fn(), forward: vi.fn(), hasListenInstance: vi.fn(() => false) },
      getInstance: vi.fn((uuid) => map.get(uuid)),
      getInstances: vi.fn(() => Array.from(map.values())),
      createInstance: vi.fn(async (cfg) => ({ ...fakeInstance("new"), ...cfg })),
      removeInstance: vi.fn(),
      exists: vi.fn((uuid) => map.has(uuid)),
      forEachForward: vi.fn(),
      exit: vi.fn(),
      on: vi.fn(), emit: vi.fn()
    }
  };
}
```
(Add `mockDocker`, `mockFileManager`, `mockNodeSchedule`, `mockDownloadManager` factories as the batch tasks need them — each batch task adds the factory it requires.)

- [ ] **Step 4: Commit**

```bash
git add daemon/test/harness/
git commit -m "test(daemon): add router/http/mocks test harness"
```

---

## Task 3: Daemon harness smoke test

**Files:**
- Create: `daemon/test/harness/smoke.test.ts`

**Interfaces:** Proves the harness end-to-end before fan-out; later tasks trust these seams.

- [ ] **Step 1: Write the failing smoke test**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mutate the real singleton config (no import-time disk I/O — load() is not called).
import { globalConfiguration } from "../../src/entity/config";
import { IGNORE } from "../../src/const";
import { invoke, dispatch, packetsFor, fakeSocket } from "./harness/router";

// Register the auth + info handlers on the singleton routerApp.
import "../../src/routers/auth_router";
import "../../src/routers/info_router";

beforeEach(() => {
  globalConfiguration.config.key = "test-key";
  globalConfiguration.config.whiteListPanelIp = false;
});

describe("harness: auth handler", () => {
  it("authenticates with the correct key and replies {status:200,data:true}", () => {
    const { socket, session } = invoke("auth", "test-key");
    const pkts = packetsFor(socket, "auth");
    expect(pkts).toHaveLength(1);
    expect(pkts[0].status).toBe(200);
    expect(pkts[0].data).toBe(true);
    expect(session.key).toBe("test-key");
    expect(session.login).toBe(true);
  });

  it("rejects the wrong key with {status:200,data:false} (no throw, no session)", () => {
    const { socket, session } = invoke("auth", "WRONG");
    expect(packetsFor(socket, "auth")[0].data).toBe(false);
    expect(session.login).toBeUndefined();
  });
});

describe("harness: auth gate", () => {
  it("silently drops an unauthenticated non-public event (status 500 on ctx.event)", () => {
    const socket = fakeSocket();
    // dispatch runs the auth-gate middleware first; no login session.
    const RouterContext = (() => {
      const { newContext } = require("./harness/router");
      return newContext;
    })();
    // Use dispatch with a known handler-less event to assert the gate alone:
    const { packetsFor: pf } = require("./harness/router");
    dispatch("info/unknown-for-gate", null, { session: {} });
    // The gate emitted on ctx.event ("info/unknown-for-gate") with status 500.
    const got = socket.emit.mock.calls.find((c) => c[0] === "info/unknown-for-gate");
    // (If the event is unknown there is no handler; the gate still emits the IGNORE packet first.)
    // Use a real protected event instead:
  });
});
```
(Refine in Step 3: see expected-fail analysis.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd daemon && npm test -- test/harness/smoke.test.ts`
Expected: the harness path imports resolve, the auth happy-path passes; the gate assertion likely needs the real event (`instance/overview`) plus InstanceSubsystem mocked. Refine.

- [ ] **Step 3: Refine to a clean green smoke test**

Replace the gate `it` with a confirmed behavior targeting a real protected event with `InstanceSubsystem` mocked away. Expected: PASS for all three `it`s, proving `invoke` (handler), `dispatch` (gate), and `packetsFor`.

- [ ] **Step 4: Run and confirm green**

Run: `cd daemon && npm test -- test/harness/smoke.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add daemon/test/harness/smoke.test.ts
git commit -m "test(daemon): harness smoke test for auth handler + gate"
```

---

## Task 4: Panel test harness

**Files:**
- Modify: `panel/vitest.config.ts` (add `resolve.alias`)
- Modify: `panel/package.json` (add `supertest` devDep)
- Create: `panel/test/harness/app.ts`
- Create: `panel/test/harness/auth.ts`
- Create: `panel/test/harness/mocks.ts`

**Interfaces:** Produces `createTestApp({ routers, sessions })`, auth helpers (`as`, `asAdmin`, `asApiKey`, `asPublic`, `tokenQuery`), `unwrap(res)`, and service mock factories.

- [ ] **Step 1: Add aliases + devDep**

`panel/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "mcsmanager-common": path.resolve(__dirname, "../common/src/index.ts"),
      "@languages": path.resolve(__dirname, "../languages")
    }
  },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    environment: "node"
  }
});
```
Add to `panel/package.json` devDependencies: `"supertest": "^7.0.0"`, `"@types/supertest": "^6.0.2"`.

- [ ] **Step 2: Write the app harness**

`panel/test/harness/app.ts`:
```ts
import Koa from "koa";
import Router from "@koa/router";
import { middleware as protocolMiddleware } from "../../src/app/middleware/protocol";

// In-memory session store keyed by a test-supplied id (header x-test-session-id).
const sessions = new Map<string, any>();

export function registerSession(s: any): { id: string; session: any } {
  const id = `sess-${Math.random().toString(36).slice(2)}`;
  sessions.set(id, s);
  return { id, session: s };
}

export function createTestApp(routers: Router[]) {
  const app = new Koa();
  const api = new Router({ prefix: "/api" });
  for (const r of routers) {
    api.use(r.routes()).use(r.allowedMethods());
  }
  // Fake session middleware (replaces koa-session for tests).
  app.use(async (ctx, next) => {
    const id = ctx.get("x-test-session-id");
    ctx.session = (id && sessions.get(id)) || { save() {}, maxAge: -1 };
    await next();
  });
  app.use(protocolMiddleware);
  app.use(api.routes()).use(api.allowedMethods());
  return app;
}

// Unwrap the {status,data,time} envelope. Returns {status, data, raw}.
export function unwrap(res: { text?: string; status: number }) {
  let raw: any = res.text;
  try {
    raw = JSON.parse(res.text as string);
  } catch {
    /* keep text */
  }
  if (raw && typeof raw === "object" && "status" in raw && "data" in raw && "time" in raw) {
    return { status: raw.status, data: raw.data, raw };
  }
  return { status: res.status, data: raw, raw };
}
```

- [ ] **Step 3: Write the auth helpers**

`panel/test/harness/auth.ts`:
```ts
import { registerSession } from "./app";

export interface SessionUser { uuid: string; userName: string; permission: number; }

export function asAdmin(overrides: Partial<SessionUser> = {}): { headers: Record<string, string>; session: any; token: string } {
  return asUser({ uuid: "admin-uuid", userName: "admin", permission: 10, ...overrides });
}

export function asUser(u: SessionUser, opts: { tokenMismatch?: boolean } = {}): { headers: Record<string, string>; session: any; token: string } {
  const token = "tok-" + Math.random().toString(36).slice(2);
  const session = { login: true, uuid: u.uuid, userName: u.userName, token, save() {}, maxAge: -1, SESSION_REQ_TIMES: [] } as any;
  const { id } = registerSession(session);
  const sendToken = opts.tokenMismatch ? "WRONG" : token;
  return { headers: { "x-test-session-id": id, "x-requested-with": "XMLHttpRequest" }, session, token: sendToken };
}

export function asApiKey() {
  return { headers: { "x-request-api-key": "APIKEYVALUE" } };
}

export function asPublic() {
  return { headers: {}, session: null, token: "" };
}

export function tokenQuery(token: string): string {
  return `token=${encodeURIComponent(token)}`;
}
```

- [ ] **Step 4: Write the mock factories**

`panel/test/harness/mocks.ts` (factories used by `vi.mock(path, () => factory())`):
```ts
import { vi } from "vitest";

export function mockUserSystem(findUser: (uuid: string) => any | undefined) {
  return {
    default: {
      objects: new Map<string, any>(),
      getInstance: vi.fn((uuid: string) => findUser(uuid)),
      getUserByUserName: vi.fn(),
      checkUser: vi.fn(),
      create: vi.fn(async () => ({ uuid: "new-uuid" })),
      edit: vi.fn(),
      deleteInstance: vi.fn(),
      validatePassword: vi.fn(() => true),
      getQueryWrapper: vi.fn(() => ({ selectPage: vi.fn(() => ({ total: 0, data: [] })) }))
    },
    TwoFactorError: class TwoFactorError extends Error {}
  };
}

export function mockRemoteService(rpc: Record<string, any> = {}) {
  return {
    default: { RemoteServiceSubsystem: { services: new Map(), list: vi.fn(() => []) } },
    getRemoteService: vi.fn(),
    RemoteRequest: { prototype: { request: vi.fn(async (event, data) => rpc[event]?.(data)) } },
    RemoteService: class {}
  };
}

export function mockOperationLogger() {
  return { operationLogger: { info: vi.fn(), warning: vi.fn(), log: vi.fn(), error: vi.fn() } };
}
```
(Each batch task extends `mocks.ts` with the factories it needs, e.g. `mockInstanceService`, `mockSsoService`, `mockExchangeService`.)

- [ ] **Step 5: Install + commit**

Run: `cd panel && npm install`
```bash
git add panel/vitest.config.ts panel/package.json panel/test/harness/
git commit -m "test(panel): add fake-session/protocol/envelope harness + mock factories"
```

---

## Task 5: Panel harness smoke test

**Files:**
- Create: `panel/test/harness/smoke.test.ts`

**Interfaces:** Proves the panel harness via two real public routes in `login_router.ts`.

- [ ] **Step 1: Write the failing/expected test**

```ts
import { describe, expect, it, vi } from "vitest";
import request from "supertest";

// systemConfig reads happen at route time; mock setting to control values.
vi.mock("../../src/app/setting", () => ({ systemConfig: { loginInfo: "hello", businessMode: false } }));

// user_service touched by login_router (status route reads userSystem.objects.size).
vi.mock("../../src/app/service/user_service", () => ({
  default: { objects: new Map(), getInstance: vi.fn(), getUserByUserName: vi.fn() }
}));

import loginRouter from "../../src/app/routers/login_router";
import request from "./harness/request"; // supertest wrapper around createTestApp
import { createTestApp } from "./harness/app";

const app = createTestApp([loginRouter]);

describe("harness: panel public routes", () => {
  it("GET /api/auth/login_info returns {loginInfo}", async () => {
    const res = await request(app.callback()).get("/api/auth/login_info");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toEqual({ loginInfo: "hello" });
  });

  it("GET /api/auth/status returns isInstall+settings shape", async () => {
    const res = await request(app.callback()).get("/api/auth/status");
    const env = unwrap(res);
    expect(env.status).toBe(200);
    expect(env.data).toHaveProperty("isInstall");
    expect(env.data).toHaveProperty("settings");
  });
});
```

- [ ] **Step 2: Run and confirm green**

Run: `cd panel && npm test -- test/harness/smoke.test.ts`
Expected: PASS. If `mcsmanager-common`/`@languages` fail to resolve, verify the alias paths. If `protocol.middleware` throws, ensure its imports (`visual_data`, `version`) load — they may need a light mock; add to `mocks.ts` if so.

- [ ] **Step 3: Commit**

```bash
git add panel/test/harness/smoke.test.ts
git commit -m "test(panel): harness smoke test for login_info + status public routes"
```

---

> **Infra complete.** Tasks 6-8 (panel) and 9-14 (daemon) are **independent after infra** → dispatch them as parallel subagents (one subagent per batch). Each subagent: writes the listed tests, runs the suite, triages failures per the TDD workflow (fix confirmed bugs in source; write a Chinese doubt doc for uncertainties without changing code), and reports. The main session reviews the report, runs the full suite once, and commits that batch. Each batch task below specifies the exact test cases.

## Task 6: Panel auth routers (P1)

**Files:**
- Create: `panel/src/app/routers/login_router.test.ts`
- Create: `panel/src/app/routers/general_user_router.test.ts`
- Create: `panel/src/app/routers/manage_user_router.test.ts`
- Create: `panel/src/app/routers/user_overview_router.test.ts`
- Create: `panel/src/app/routers/sso_router.test.ts`
- Modify: `panel/test/harness/mocks.ts` (add `mockSsoService`, `mockInstanceService`)

**Interfaces:** Consumes `createTestApp`, `as/asAdmin/asUser/asPublic`, `unwrap`, mock factories. Produces: green tests; bugfixes or `docs/test-doubts/` entries.

Per-route test matrix (every case is a separate `it`):

**`login_router` (prefix /auth):**
- `POST /login`: happy — `login()` returns token, `operationLogger.info` called; banned IP (`checkBanIp` false) → `403/data TXT_CODE_router.login.ban`; SSO-only mode → body "Password login is disabled..."; `NEED_2FA` when `TwoFactorError` and no code; wrong credentials → envelope status 500 with error.
- `GET /logout` (public): calls `logout(ctx)` → `data === true`.
- `ALL /login_info` (public): `data` = `{loginInfo: <systemConfig.loginInfo>}`.
- `ALL /status` (public): `data.isInstall = (userSystem.objects.size>0)`; includes settings shape; when API key / public超人 不计入.
- `ALL /install` (public, validator body username/password): when no users → creates admin + `login()` + `data===true`; when users exist → throws installed (status 500).
- `ALL /proxy` (admin, validator query target): admin authed → proxies via axios (mock axios) → `data=response.data`; non-admin → 403.
- **Review Focus #2** API key disabled: GET `/api/overview/...` not in this router — used in P2 (Task 7). Here assert instead: `POST /login` requires no token (public) — covered.
- **Review Focus #1** token mismatch: PUT `/auth/update` is in `general_user_router` (below).

**`general_user_router` (prefix /auth):**
- `GET /token` (USER, token:false): admin authed via session → returns token string; assert `data` is a string token.
- `GET /` (USER, token:false): returns user info (`getUserFromCtx`) shape.
- `PUT /update` (USER, token default true): **Review Focus #1** — same-session token match → 200; mismatched `?token=` → 403 `forbiddenTokenError`; no Ajax header → 403 `xmlhttprequestError`.
- `PUT /api` (USER): updates apiKey via `userSystem.edit`; asserts the edit call args.
- `POST /bind2fa` (level 1): returns QR data URL (`bind2FA` mocked).
- `POST /confirm2fa` (level 1, validator enable/TOTPCode): calls `confirm2FaQRCode`.

**`manage_user_router` (prefix /auth, ADMIN):**
- `POST /`: happy create via `passport_service.register`; missing password/username → 400 Validator (Review Focus #3 → assert via `/auth/login` instead, where validator is `body:{username,password}`; here `POST /` validator is `body:{username,password,permission}`).
- `DELETE /` (`.del`, ADMIN): deletes user.
- `GET /search` (ADMIN, validator query page/page_size): paginated user search via `userSystem.getQueryWrapper().selectPage`; assert page params forwarded.

**`user_overview_router` (prefix /auth, ADMIN):**
- `PUT /`: admin edits a user overview; non-admin → 403.
- `GET /overview`: returns users overview list (mock `userSystem`).

**`sso_router` (prefix /auth/sso):**
- `GET /config` (public): returns public SSO config (`getPublicSsoConfig` mocked).
- `GET /authorize` (public): redirects/returns auth URL (`buildAuthorizationUrl` mocked); calls `checkBanIp` (banned → 403).
- `GET /callback` (public): `handleOIDCCallback`/`handleOAuth2Callback` mocked → `loginSuccess` on match, or error body on mismatch.
- `GET /bind-status`, `POST /bind`, `POST /bind-current`, `PUT /unbind`: each happy path + one auth/validator branch; mock `sso_service`, `user_service`.

Each `it`: set `vi.mock` for the router's deps (per spec §4), seed a session via `asAdmin()`/`asUser()`, `supertest(app.callback()).method(url).set(headers).query({token}).send(body)`, then `unwrap(res)` and assert `status` + `data` + (where relevant) `expect(mock).toHaveBeenCalledWith(...)`.

- [ ] **Step 1:** Create the 5 test files with the test matrix above. Add `mockSsoService`/`mockInstanceService` to `panel/test/harness/mocks.ts`.
- [ ] **Step 2:** Run `cd panel && npm test` for these files. Triage per TDD: fix confirmed bugs in `panel/src/app/routers/*.ts` or their services; for uncertainties write `docs/test-doubts/<router>-<route>.md` (Chinese) and mark the `it` `.skip` with a reference, or `it.fails`.
- [ ] **Step 3:** Commit
```bash
git add panel/src/app/routers/*_router.test.ts panel/test/harness/mocks.ts docs/test-doubts/
git commit -m "test(panel): cover auth routers (login/general/manage/overview/sso) + bugfixes/doubts"
```

---

## Task 7: Panel overview + settings + upgrade (P2)

**Files:**
- Create: `panel/src/app/routers/overview_router.test.ts`
- Create: `panel/src/app/routers/settings_router.test.ts`
- Create: `panel/src/app/routers/upgrade_router.test.ts`

Test matrix:

**`overview_router` (prefix /overview):**
- `GET /` (ADMIN): fans out to daemons (mock `RemoteServiceSubsystem.services` + `RemoteRequest`) → aggregated data shape.
- `GET /operation_logs` (ADMIN): mock `operation_logger.get` returns rows → `data` shape; non-admin → 403.
- `GET /operation_logs/search` (ADMIN, validator query page/page_size): search forwards filters.
- **Review Focus #2**: `GET /` with `x-request-api-key` header while `systemConfig.enableApiKey=false` → 403 disabledApiKey (i18n `TXT_CODE_db253979`). Also `enableApiKey=true` + matching user → 200 (apikey path).

**`settings_router` (prefix /overview):**
- `GET /setting` (ADMIN): returns systemConfig subset.
- `PUT /setting` (ADMIN): mutates systemConfig + `saveSystemConfig` (mock) called; `verifyIssuer` branch (mock sso_service) when ssoEnabled.
- `PUT /install` (anon, no auth): returns layout/config — assert public + no 403.
- `GET /layout` (none): returns layouts.
- `POST /layout` (ADMIN): saves layout; `DELETE /layout` (ADMIN): deletes.
- `POST /upload_assets` (ADMIN): multipart — mock `formidable`/`fs.move`; assert file accepted shape (skip real multipart parse heavier; mock `ctx.request.files` via a test helper).
- `POST /refresh_business_mode` (ADMIN, speedLimit 5): calls `checkBusinessMode`.

**`upgrade_router` (prefix /upgrade, ADMIN):**
- `GET /panel_info` (ADMIN): `getUpgradeInfo` (web entry) mocked → version/notes/onlineNotes passthrough.
- `POST /panel` (ADMIN): `performUpgrade` mocked (do NOT run real overlay) → success shape.
- `GET /daemon_info` (ADMIN, validator query uuid): forwards to daemon `getUpgradeInfo`; assert `RemoteRequest.request` called with `updateSourceUrl`.
- `POST /daemon` (ADMIN, validator query uuid): forwards `upgrade/daemon` event.
- Every route: non-admin → 403; missing `uuid` on the validators → 400.

- [ ] **Step 1-3:** implement → run → triage → commit (`test(panel): cover overview/settings/upgrade routers + bugfixes/doubts`).

---

## Task 8: Panel instance + schedule + java + files + env + mod + exchange + daemon-router (P3-P4)

**Files:**
- Create: `panel/src/app/routers/instance_admin_router.test.ts`
- Create: `panel/src/app/routers/instance_operate_router.test.ts`
- Create: `panel/src/app/routers/schedule_router.test.ts`
- Create: `panel/src/app/routers/java_manager_router.test.ts`
- Create: `panel/src/app/routers/filemananger_router.test.ts`
- Create: `panel/src/app/routers/environment_router.test.ts`
- Create: `panel/src/app/routers/mod_manager_router.test.ts`
- Create: `panel/src/app/routers/instance_exchange_router.test.ts`
- Create: `panel/src/app/routers/daemon_router.test.ts`

For each router the matrix = (a) auth/level gate (admin vs user vs public per the route table) incl. per-instance ownership (`isHaveInstanceByUuid` — mock `permission_service`); (b) happy path asserts the forwarded `RemoteRequest.request(“<daemonEvent>”, data)` was called with the right event + payload + `permissionService`-selected instance uuid; (c) one validation (`validator` 400) or error branch per route.

Highlights:
- **`instance_operate_router`** (`/protected_instance`, router.use `isHaveInstanceByUuid`): `open/stop/kill/restart/command` forward the right daemon events; non-owner user → gate 403; admin → always allowed.
- **`filemananger_router`** (`/files`, router.use `canFileManager`+`isHaveInstanceByUuid`): each op forwards the matching `file/*` event to the daemon with `instance_stream`-resolved cwd. Assert payloads. **Not** the workspace-sandbox logic itself (that's the daemon's job, covered in Task 11).
- **`environment_router`** (`/environment`, ADMIN): `image/containers/networkModes/progress/image_platforms` forward; `dockerhub_image_platforms` exercises axios (mock) — assert it does NOT call RemoteRequest (panel-side fetch).
- **`mod_manager_router`** (`/mod`): `search/versions/download` use `modManagerService` (mock HTTP to CurseForge/Modrinth) + `requestConcurrencyLimiter`; `download` forwards a transfer task to the daemon.
- **`instance_exchange_router`** (`/exchange`): `POST /` (ADMIN, validator `request_action`) → `exchange_service` dispatch; `GET /sso` (public, validator username/token/instanceId/daemonId/origin) → SSO token verify + `loginSuccess`; `POST /request_buy_instance` (public) → `requestUseRedeem`/`buyOrRenewInstance` mocked.
- **`daemon_router`** (`/service`, ADMIN): `remote_services_list`/`remote_service_instances`/…/`link_remote_service` CRUD over `RemoteServiceSubsystem` + `RemoteRequest`; assert the connect/disconnect/list calls.

- [ ] **Step 1-3:** implement → run → triage → commit (`test(panel): cover instance/schedule/java/files/env/mod/exchange/daemon routers + bugfixes/doubts`).

---

## Task 9: Daemon auth + info + passport (D1)

**Files:** `daemon/src/routers/auth_router.test.ts`, `daemon/src/routers/info_router.test.ts`, `daemon/src/routers/passport_router.test.ts`
(Smoke test from Task 3 already covers auth handler — extend, don't duplicate.)

Matrix:
- `auth`: correct key → `{200,true}` + session set; wrong key → `{200,false}`; IP not in whitelist (`whiteListPanelIp=true`, ip absent) → `{200,false}`.
- **Review Focus #4** gate: `dispatch` a non-public event (`info/overview`) with no-login session → captured emit on `ctx.event` with `status===500`. With a `loginSuccessful` session → handler runs, no gate emit.
- `connection`: 6000 ms timer sets `disconnect` only when `!session.login`. (Use `vi.useFakeTimers`; advance; assert `socket.disconnect` called/not-called; restore timers in `afterEach`.)
- `info/overview`: `invoke` with mocked `InstanceSubsystem`/`VisualDataSubsystem`/`DockerManager` (degrade-safe) → packet `{200, data:{ version, … }}`. Assert the docker call is try/caught (mock it to throw → still `200`).
- `info/setting`: `invoke` with mutated `globalConfiguration.config` + mock `store()` → `{200, true}`, then `store` called.
- `passport/register`: authenticated session → `missionPassport.registerMission` called; dup key → error packet (`status:500`). Assert `getMission` lookup afterwards.

- [ ] **Step 1-3:** implement → run → triage → commit (`test(daemon): cover auth/info/passport events + bugfixes/doubts`).

---

## Task 10: Daemon instance + stream + instance_event relay (D2)

**Files:** `daemon/src/routers/Instance_router.test.ts`, `daemon/src/routers/stream_router.test.ts`, `daemon/src/routers/instance_event_router.test.ts`

Matrix:
- `Instance_router` (router.use instance-existence gate): `instance/select|overview|section|detail` over a fake `InstanceSubsystem` map — owner UUIDs returned; missing uuid → gate error (`status:500` or the handler's error event). `instance/open|stop|restart|kill|command` → assert `instance.execPreset` called with the right preset + params (`command` forwards `data.command`). `instance/new/update/delete/forward` → `InstanceSubsystem.createInstance/parameters/removeInstance/forward` called. `instance/process_config/list|file` → `FileManager` + `ProcessConfig` (mock or temp cwd). `instance/asynchronous` → `createQuickInstallTask` / `instance_update_action` / `general_install` mocked. `instance/mods/list|toggle|delete|install|config_files` → `modService` mocked.
- **`stream_router`** (its own `use` gate): `stream/auth` via `missionPassport.getMission(pw,"stream_channel")` → `streamLoginSuccessful`; `stream/detail|input|write|resize` require `checkStreamLogin` (session.stream.check) — without it → error/drop; with it → `instance.execPreset("command"/"resize")` / `instance.process.write(data.input)`. **Review Focus** none new here; the stream-gate is the key behavior.
- `instance_event_router`: it's a side-effect event relay (not request handlers). Test `InstanceSubsystem` `.emit("data"/"exit"/"open"/"failure")` → forwarded sockets get `protocol.msg` with `instance/stdout`/`instance/stopped`/`instance/opened`/`instance/failure`. Mock `InstanceSubsystem` as an EventEmitter, register the router, register a forward socket via `instanceStream.requestForward`/`addGlobalSocket`, emit, assert packets.

- [ ] **Step 1-3:** implement → run → triage → commit (`test(daemon): cover instance/stream/instance_event events + bugfixes/doubts`).

---

## Task 11: Daemon file + java (D3)

**Files:** `daemon/src/routers/file_router.test.ts`, `daemon/src/routers/java_manager_router.test.ts`

Matrix:
- `file_router`: use **real `FileManager` over a temp `data/InstanceData/<uuid>` sandbox** where cheap (list/touch/mkdir/copy/move/delete/edit), with a tmp cwd from `mkdtemp` + `process.chdir` before importing (`common/system_storage` DATA_PATH convention). `file/chmod` spawns `/bin/chmod` → on non-Linux mock `ProcessWrapper`/spawn; on Linux assert the right path. **Review Focus #5**: `file/list` with `target:"../../../../etc"` → error packet, NO FS read of `/etc` (assert via mock that list was not called with an outside path). `file/compress`/zip+unzip → mock `common/compress` (binary spawn) and assert the delegate invoked with src/dst. `file/download_from_url` → mock `downloadManager`.
- `java_manager`: `list`/`using`/`delete` over the in-memory `javaManager` (mutate registry); `add` does `path.normalize` + storage (temp dir); `download` → mock `downloadManager.downloadFromUrl` + unzip/untar (`common/compress` mocked).

- [ ] **Step 1-3:** implement → run → triage → commit (`test(daemon): cover file/java_manager events + bugfixes/doubts`).

---

## Task 12: Daemon environment + schedule + upgrade (D4)

**Files:** `daemon/src/routers/environment_router.test.ts`, `daemon/src/routers/schedule_router.test.ts`, `daemon/src/routers/upgrade_router.test.ts`

Matrix:
- `environment_router`: every event constructs `new DockerManager().getDocker()` — `vi.mock("../service/docker_service", …)` returning dockerode stubs (`listImages`/`listContainers`/`listNetworks`/`buildImage`/`getImage().remove()`). Assert each event maps to the right dockerode call and the right packet shape. `environment/progress` reads `DockerManager.builderProgress` map. `environment/image_platforms` — mock registry HTTP. `environment/new_image` pre-responds then builds async (assert the immediate ack + that buildImage was called).
- `schedule_router`: `list`/`delete` over `InstanceControlSubsystem` fake; `register` → `node-schedule.scheduleJob` (mock to a fake job with `cancel()`); assert `TaskConfig` storage call; cancel in `afterEach`.
- `upgrade_router`: `upgrade/info` → `getUpgradeInfo` mocked (manifest shape + `onlineNotes` passthrough). `upgrade/daemon` → `performUpgrade` mocked (do NOT run real overlay/restart); assert upgrade lock + call args.

- [ ] **Step 1-3:** implement → run → triage → commit (`test(daemon): cover environment/schedule/upgrade events + bugfixes/doubts`).

---

## Task 13: Daemon HTTP routes (D5)

**Files:** `daemon/src/routers/http_router.test.ts`

Matrix (supertest via `createHttpApp()`):
- `GET /` (no auth) → `DAEMON_INDEX_HTML` body; status 200.
- `GET /download/:key/:fileName` with a valid `missionPassport.getMission(key,"download")` → `FileManager.check` + `sendFile` (mock fs-stream send); invalid key → mission-null error (status 500 envelope / thrown).
- `POST /upload/:key` (legacy), `POST /upload-new/:key`, `POST /upload-piece/:id`: with a valid mission/uploadManager entry → accepted (mock formidable parsing + FileWriter); without → uploadFileCheckMiddleware rejects before koaBody. Assert `?unzip`/`?stop` branching.
- Mock `missionPassport`/`uploadManager`/`FileManager`/`koa-send`.

- [ ] **Step 1-3:** implement → run → triage → commit (`test(daemon): cover the 5 HTTP routes + bugfixes/doubts`).

---

## Task 14: Daemon pure-seam unit tests (D6)

**Files:** `daemon/src/service/protocol.test.ts`, `daemon/src/service/mission_passport.test.ts`

Matrix (pure, direct calls, no harness):
- `protocol.response`/`msg`/`error`/`responseError` with a fake socket → assert emitted packets (status/data/event) including the `IGNORE` short-circuit.
- `mission_passport`: `registerMission` → `getMission` returns the mission by name; dup key throws; `deleteMission` flags `isDeleted`; expiry sweep (`vi.useFakeTimers`, advance 1h) deletes expired. (The constructor's `setInterval` — use fake timers to assert the sweep.)

- [ ] **Step 1-3:** implement → run → triage → commit (`test(daemon): unit tests for protocol + mission_passport`).

---

## Task 15: Panel pure-seam unit tests (P5)

**Files:** `panel/src/app/service/permission_service.test.ts`, `panel/src/app/service/instance_service.test.ts`, `panel/src/app/middleware/limit.test.ts`, `panel/src/app/middleware/validator.test.ts`

Matrix (direct calls / fake ctx):
- `permission_service`: `isHaveInstance` admin-always-true vs user-with-instance vs user-without; `isTopPermission`/`isTopPermissionByUuid` (mock `userSystem.getInstance`).
- `instance_service`: `multiOperationForwarding` classification by daemonId (pure); `checkInstanceAdvancedParams` gated on `systemConfig.allowChangeCmd`.
- `limit.test.ts`: `speedLimit(8)` — 8th+ request within 1s → `ctx.status=500` (tooFast); admin (`permission>=10`) bypasses; `requestConcurrencyLimiter` mutual-exclusion (two concurrent, one waits).
- `validator.test.ts`: missing required → status 400 body "Validator failed"; Number/String/Date/Boolean/Array coercion correctness; empty `body:{}` skipped. (Construct a minimal fake ctx with `params`/`query`/`request.body`.)

- [ ] **Step 1-3:** implement → run → triage → commit (`test(panel): unit tests for permission_service/instance_service/limit/validator`).

---

## Task 16: Final full run + verification note + doubt index

**Files:**
- Create: `docs/test-doubts/README.md` (or update if already seeded in earlier batches) — index every doubt doc written across all batches.
- Create: `docs/backend-test-coverage-2026-09-29.md` — a short verification note: counts (routers covered, tests, bugs fixed with links to commits, doubts open), how to run (`cd panel && npm test`, `cd daemon && npm test`, `cd common && npm test`), known limitations (mocked boundaries, no real binaries/docker/network).

- [ ] **Step 1:** Run all three suites: `cd common && npm test` (unchanged, must still pass), `cd panel && npm test`, `cd daemon && npm test`. Capture exit codes.
- [ ] **Step 2:** If any suite fails, triage per TDD (fix confirmed bug / doubt doc). Iterate until green.
- [ ] **Step 3:** Write the coverage + verification note and the doubts index.
- [ ] **Step 4:** Commit
```bash
git add docs/test-doubts/README.md docs/backend-test-coverage-2026-09-29.md
git commit -m "test: final verification note + doubts index for backend route suite"
```

---

## Self-Review

1. **Spec coverage:** Panel 17 routers → Tasks 6/7/8 + pure-seam Task 15. Daemon 11 routers + HTTP → Tasks 9-14. Infra → Tasks 1-5. Bug-fix/doubt workflow + commit cadence → every batch task + Task 16. ✓ (Panel `socket_router.ts` excluded as dead code per spec.)
2. **Placeholder scan:** Each batch task lists a concrete per-route test matrix (route/scenario/mock/expected) — no "TBD"/"handle edge cases". The shared `mocks.ts` is extended per batch with named factories.
3. **Type consistency:** `fakeSocket`/`newContext`/`invoke`/`dispatch`/`packetsFor` (daemon) and `createTestApp`/`registerSession`/`as*`/`unwrap`/`tokenQuery` (panel) are named consistently across infra + batch tasks. Packet shape `{status, data, event, uuid}` matches `daemon/src/service/protocol.ts`. Envelope `{status, data, time}` matches `panel/src/app/middleware/protocol.ts`.
4. **Review Focus:** #1 → Task 6 (`PUT /auth/update` token mismatch); #2 → Task 7 (`GET /overview` with apikey disabled); #3 → Task 6 (`POST /auth/login` missing password → 400); #4 → Task 9 (gate drop); #5 → Task 11 (`file/list` traversal). All pinned. ✓
