# Backend Route Test Suite — Design Spec

> **中文摘要（给读者）**：为 MCSManager 后端（panel Web 后端 + daemon 守护进程后端）**每一个路由/接口**建立 vitest 单元/集成测试，实现 TDD 效果。关键修正：daemon 不是 HTTP-only —— 绝大多数"路由"是 **socket.io 事件**（经 `routerApp` 单例分发），只有 5 个真 HTTP/Koa 路由。本 spec 定义两套测试 harness、mock 策略、鉴权身份注入、bug 修复与疑虑文档流程、并行子 Agent 批次与每步 commit 策略。用户已授权自主无人值守执行，故跳过交互审批门。

Date: 2026-09-29
Status: Draft → Implementation (autonomous mode)

## 1. Goal & Scope

Build a maintainable vitest test suite that exercises **every backend route/interface** of
**panel** (Web backend, Koa + socket.io-client) and **daemon** (node worker, Koa + socket.io).
Frontend is **out of scope** (already has its own vitest suite).

Surface to cover (from the route mapping agents):

- **Panel** — 17 active routers, ~120 HTTP routes, `/api` prefix. `socket_router.ts` is dead
  code (immediately disconnects) → excluded.
- **Daemon** — dual transport:
  - **socket.io events** registered on the `routerApp` singleton (`service/router.ts`):
    48 `routerApp.on(...)` handlers + 4 `routerApp.use(...)` gate middlewares across 11
    router files.
  - **HTTP routes** (`routers/http_router.ts`): 5 routes (`/`, download, upload, upload-new,
    upload-piece).

### What "test coverage" means here

Each route/event handler gets **at minimum**:

1. **Auth/gate behavior** — correct request authenticated & authorized; wrong/missing auth
   rejected with the documented status/message (panel 403 codes; daemon `protocol.error` /
   silent drop). For public routes (panel `token:false, level:null`; daemon `auth` /
   `stream/auth` / HTTP `/`), assert they pass without auth.
2. **Happy path** — with auth + valid input, the response body/status (panel `{status,data,time}`
   envelope unwrapped to `data`) or the emitted packet (daemon) has the expected shape, and
   the delegated service was called with the expected args (spy on mocked services).
3. **Key validation/error branch** — at least one input-validation (`validator` 400) or a
   documented error branch (e.g. "installed", "banned", "already-latest", instance-not-found,
   file-out-of-workspace).

Pure-ish seams (no sockets/fs/network) get **deeper unit tests**: `permission_service`,
`instance_service.multiOperationForwarding` / `checkInstanceAdvancedParams`, `validator`
middleware, `speedLimit` / `requestConcurrencyLimiter`, `passport_service` session helpers,
`exchange_service` shaping, common `compareVersions` (already covered), and daemon
`mission_passport` / `protocol` helpers.

## 2. Testing Pyramid

- **Unit** — pure functions & middleware driven directly with a fake `ctx`/`RouterContext`.
  Fast, deterministic, no I/O.
- **Integration (route-level)** — a router mounted on an in-process Koa app (panel) or driven
  through the `routerApp` emitter with a fake Socket (daemon), with **boundary services mocked**.
  These genuinely exercise the handler + real protocol/auth-shaping middleware.

We deliberately **do not** spin up real processes or open real ports for the bulk of tests. A
small number of supertest HTTP integration tests cover daemon's 5 Koa routes. The existing
`scripts/verify-auto-update*.mjs` real-process E2E harness is left untouched (different layer).

## 3. Framework & Infrastructure

### 3.1 Shared conventions (from `AGENTS.md` §8)

- vitest (panel/common `^0.33.0`). Daemon will adopt the **same version** for consistency.
- `StorageSubsystem` / anything reading `DATA_PATH`: `DATA_PATH` is derived from `process.cwd()`
  at **import time**. When a test genuinely hits storage, `process.chdir(tmpDir)` **before** the
  dynamic `import()`. When the module is fully mocked, no chdir needed.
- Windows `fs.chmod` only toggles the read-only bit → gate POSIX-mode assertions with
  `process.platform === "win32"` skips and assert mocked `fs.chmodSync` call args instead. The
  daemon `FileManager.chmod` spawns `/bin/chmod` → on non-Linux CI, mock `ProcessWrapper`.
- Module-alias resolution: `mcsmanager-common` must resolve to **source** (`common/src/index.ts`)
  and `@languages` to `../languages` under vitest. The existing `panel/vitest.config.ts` is
  minimal (only `include` + `environment: node`) and passes today only because its current tests
  never import `common`; router tests **do** transitively import `mcsmanager-common`
  (e.g. `permission.ts` imports `{ GlobalVariable }`). Therefore **add `resolve.alias`** to both
  the panel and daemon vitest configs:
  `mcsmanager-common` → absolute `common/src/index.ts`, `@languages` → absolute `../languages`.
  (webpack `resolve.alias` / tsconfig `paths` are the source of truth — we mirror them for
  vite.) This also avoids relying on the built `common/dist`.
- **Daemon config is a mutable singleton**: `globalConfiguration` is `new GlobalConfiguration()`
  at module load with an in-memory `config` (`key` = random `builderPassword()`); `load()` is
  **explicit** and only called from `app.ts`. So **importing a daemon router does no disk I/O**.
  Tests prefer **mutating the real singleton** (`globalConfiguration.config.key = "testkey"`,
  `whiteListPanelIp`, …) over `vi.mock`-ing config. When real storage must be avoided entirely,
  `vi.mock` `StorageSubsystem` / `InstanceSubsystem`.

### 3.2 Panel harness

Files to add (under `panel/src/app/__test__/` or co-located `*.test.ts` per existing convention
`src/**/*.test.ts`):

- `panel/test/harness/app.ts` — `createTestApp({ routers, sessions })`:
  - `new Koa()`.
  - **Fake session middleware** replacing `koa-session`: maps `x-test-session-id` header → an
    in-memory session object provided by the test. This gives full, deterministic control of
    `ctx.session` without cookie round-trips. (Real `permission` reads `ctx.session[...]`.)
  - Real `protocol.middleware` from `middleware/protocol.ts` — pure, safe to reuse, so the
    `{status,data,time}` envelope is genuinely exercised.
  - Mount the **provided router instance(s)** onto a `/api`-prefixed `@koa/router` (mirrors
    `index.ts` mounting, but only the routers under test → avoids loading every panel router +
    its heavy singletons).
  - Return `app.callback()` for supertest.
- `panel/test/harness/auth.ts` — `as({ uuid, userName, permission, token })` registers a session
  in the store and returns headers (`x-test-session-id`, `x-requested-with: XMLHttpRequest`,
  and the `?token=` query for token-checked routes). Plus `asApiKey(key)` for API-key path and
  `asPublic()` (no auth, for `token:false` routes).
- `panel/test/harness/mocks.ts` — factories for the standard `vi.mock` replacements of heavy
  services: `user_service` (userSystem: `getInstance`, `getUserByUserName`, `checkUser`, `create`,
  `edit`, `deleteInstance`, `objects` map), `remote_service` (RemoteServiceSubsystem stub +
  `RemoteRequest.prototype.request` stub), `operation_logger`, `remote_command`, plus a helper
  to stub `systemConfig` field reads. Each router test file opts into the mocks it needs via
  `vi.mock(path, () => factory(...))` (hoisted; vitest hoisting replaces module-level imports).

New devDeps: `supertest`, `@types/supertest`.

Auth injection rationale: real `permission` middleware runs against the seeded session +
mocked `userSystem.getInstance`. Auth **gating** is therefore genuinely tested (token mismatch →
403, Ajax missing → 403, API-key disabled → 403, insufficient level → 403, banned → logout),
not stubbed away. Only storage-backed user lookup is mocked.

### 3.3 Daemon harness

Files to add under `daemon/test/`:

- `daemon/test/harness/router.ts`:
  - `fakeSocket(session?)` — returns a fake `Socket`-shaped object: `{ id, emit: vi.fn(),
    handshake: { address }, on: vi.fn(), disconnect: vi.fn(), use: vi.fn() }` plus an `emit` call
    recorder.
  - `newContext(event, { uuid, session })` — `new RouterContext(uuid, fakeSocket, session,
    event)`.
  - `dispatch(socket, event, data, { session })` — **gate mode**: runs every
    `routerApp.getMiddlewares()` fn in sequence (like koa-compose: each `fn(routePath, ctx, data,
    next)`) and then `routerApp.emitRouter(event, ctx, data)`. This reproduces `navigation()`'s
    middleware→handler dispatch without a real socket.io server.
  - `invoke(socket, event, data, { session })` — **handler mode**: directly
    `routerApp.emitRouter(event, ctx, data)` (skips gate middlewares; use when asserting the
    handler under an already-authenticated/preset session, or when the handler has its own
    in-router `use` gate we want to also bypass).
  - Assertion helpers: `lastPacket(socket, event)` reads the recorded `emit` args, unwrapping
    `IPacket`.
- `daemon/test/harness/http.ts` — `createHttpApp()` returns `initKoa().callback()` for supertest,
  with `globalConfiguration`, `missionPassport`, `uploadManager` mocked.
- `daemon/test/harness/mocks.ts` — factories for: `globalConfiguration` (config object),
  `InstanceSubsystem` (fake `Instance` map + `getInstance`/`getInstances`/`createInstance`/
  `removeInstance`/`forEachForward`/`forward`), `Instance.prototype.execPreset` (vi.fn recording
    `action` + `params`), `instance.process.write`, `FileManager` (in-memory over a tmp dir, or
    fully mocked), `DockerManager`/`dockerode`, `missionPassport`, `downloadManager`,
  `common/compress` (zip/unzip delegate), `node-schedule` (fake job registry; cancel in teardown).

New: add `"test": "vitest run"` + `vitest` (`^0.33.0`) devDep, and `supertest`/`@types/supertest`
to `daemon/package.json`.

Import strategy: a daemon test imports **only the specific router file** it tests (e.g.
`import "../src/routers/auth_router"`) — that registers its handler(s) on the singleton
`routerApp`. We avoid `import "src/service/router"` (which pulls all 11 routers). vitest isolates
the module registry per test file, so cross-file pollution is not a concern.

## 4. Mock Strategy (boundary — never mock the code under test)

| Domain | Mock at | Why |
| --- | --- | --- |
| panel→daemon RPC | `RemoteRequest.prototype.request` (socket.io emit/on) | no daemon process |
| panel user storage | `user_service` (UserSubsystem) methods | file/Redis I/O, DATA_PATH |
| panel remote registry | `RemoteServiceSubsystem` instance | auto-connects daemon |
| panel audit log | `operation_logger` | FS writes |
| panel settings mutation | allow `systemConfig` real object with temp value; mock `setting`/`saveSystemConfig` only where it writes disk | — |
| daemon config | `globalConfiguration.config` (or load real from a seeded temp `data/Config/global.json` via chdir) | file I/O at load |
| daemon instances | `InstanceSubsystem` + fake `Instance` objects; stub `Instance.prototype.execPreset`, `instance.process.write` | PTY, docker, arbitrary user commands |
| daemon docker | `DockerManager`/`DefaultDocker` (dockerode) | no docker daemon on CI |
| daemon FS | `FileManager` **over a real temp `data/InstanceData/<uuid>` sandbox** where cheap (list/touch/mkdir/copy/move/delete/edit); **mock** where it spawns binaries (chmod→`ProcessWrapper`, zip/unzip→`common/compress`) | exercises sandboxing logic, avoids binaries |
| daemon compress binaries | `common/compress` (`GOLANG_ZIP_PATH`/`SEVEN_ZIP_PATH` spawns) | binaries absent / not required to exist in CI |
| daemon download/network | `downloadManager`, `java_manager`, `modService`, `axios` for `environment/image_platforms` | network |
| daemon PTY | `PtyStartCommand` degrades to `GeneralStartCommand` if binary missing; prefer mocking `Instance.prototype.execPreset` at the higher seam | binary |
| daemon timers | `node-schedule` jobs (`schedule/register`) | real timers; cancel in `afterEach` |
| daemon upload/download HTTP | `missionPassport`/`uploadManager` real with temp dir, or mock | FS; keep real where cheap |

Cross-cutting: external HTTP (CurseForge/Modrinth, Docker registry, update manifests) always
mocked via `vi.mock("axios", ...)` or service-level stubs.

## 5. Bug-fix & Doubt-Doc Workflow (TDD)

For every handler we follow this loop:

1. **Write the assertion first** describing correct behavior per README/route semantics/flow.
2. **Run it.**
3. **If it fails** in a way that implies the handler is wrong:
   - Re-derive expected behavior from requirements + middleware/service flow. Confirm it is a
     genuine bug (not a misunderstanding of the protocol/links).
   - **If confirmed bug** → fix the source code (minimal, focused, matching surrounding style),
     re-run until green. Note the bug in the commit message.
   - **If uncertain / ambiguous requirement / environmental limitation** → **do NOT change code**.
     Write a Chinese markdown note under `docs/test-doubts/` describing the route, the
     expected-vs-actual, the link analysis, and the open question. Keep the test (skipped with a
     reason reference to the doc, or marked `it.fails`) so it doesn't break CI but records the
     expectation.
4. **If it passes** → keep, commit.

`docs/test-doubts/` index file `README.md` lists every doubt doc; each doc named
`<router>-<route-or-event>.md`.

## 6. Commit & Parallelization

Commit cadence (each commit is reviewable/revertible, as the user requested):

1. infra: daemon vitest setup + daemon harness + mock toolkit (1 commit)
2. infra: panel harness + mock toolkit (1 commit)
3. per-router batch: a subagent writes tests for N routers, runs `npm test`, fixes confirmed
   bugs, writes doubt docs for uncertainties, then the main session commits that batch.
4. final: full `npm test` across panel+daemon+common, verification note, doubt-doc index (1 commit).

Parallelization: panel routers and daemon routers are independent → dispatch parallel
subagents per **batch** (e.g. panel-auth-batch, panel-instance-batch, panel-files-environment
batch; daemon-auth-info-batch, daemon-instance-batch, daemon-file-env-batch, daemon-misc-batch).
Each subagent returns the test files it added + list of bugs fixed + list of doubts; the main
session reviews their report, runs the full suite once to confirm green, and commits. This
keeps the shared harness stable (built first, alone) before fan-out.

## 7. Out of Scope & Risks

- **No** real daemon/PTY/docker/network in CI unit/integration tests. Those are mocked or
  skipped with platform/availability gates.
- **No** `app.ts` boot tests (they require real config + `checkDependencies` binaries → too
  heavy/fragile). Covered by the existing `scripts/verify-auto-update*.mjs` harness, untouched.
- vitest `^0.33.0` is old; `vi.mock` factory hoisting and `vi.hoisted` are supported — fine.
- Path collisions in panel (`/auth`, `/overview` shared across routers): tests mount **one
  router at a time** on the test app, so collisions don't occur within a test file; cross-router
  collisions are a production-dispatch concern, noted but not our focus.
- Daemon socket-event handlers respond via `ctx.socket.emit(ctx.event, Packet)`; tests assert on
  the recorded packet(s). A handler that `protocol.msg`s to **other** events (e.g. instance
  broadcast) must have its emitted event asserted accordingly (read the handler to pick the event).

## 8. Self-Review (inline)

- Placeholders/TODOs: none.
- Internal consistency: panel = HTTP+routers; daemon = socket-emitter + 5 HTTP; harness sections
  align with both.
- Scope: large but decomposed into infra → router batches → final-verify. Each batch is a
  standalone, committable unit.
- Ambiguity: "every route" is interpreted as "every HTTP route (panel) + every socket.io event
  (daemon) + 5 daemon HTTP routes", each with auth/gate + happy + one error branch; pure seams
  get deeper unit coverage. Made explicit in §1.
