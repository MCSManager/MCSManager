# Real-Process Integration Test Framework — Design Spec

> **给读者 (中文摘要):** 用一个放在 `common/test/integration/` 的真实进程测试基本库,启动真 panel+真 daemon(临时目录、复用构建产物与 `daemon/lib`),驱动真实 HTTP + socket.io,不 mock 业务行为。所有后端测试改为按模块聚合的集成测试(实例 / Docker / 用户 / 文件管理与上传下载 / 实例输入输出流多 Socket / 鉴权)。删除全部 mock 路由单测与对应 harness,把"真·边界"覆盖与既有 finding/assertion 折叠进新集成测试。更新 AGENTS.md 与 `.agents/skills/*`。用户已授权无人值守自主执行,故关键技术分叉由本 spec 自主裁定(见 §2),仅在设计审阅这一个节点请人类确认。

Date: 2026-09-30
Status: Draft (autonomous mode) → awaiting spec review
Branch: `yumao/full-test-v2`

## 1. Goal & Scope

Build **one** reusable real-process test library (in `common/`) and migrate **all** backend
tests onto it as module-oriented integration suites that drive a real panel + real daemon
over real HTTP + socket.io — no business-layer mocks.

**In scope:**
- A `common/test/integration/` library that boots a fresh panel+daemon pair in an isolated
  temp workspace, copies `daemon/lib` + `panel/data/market_cache.json`, exposes basic behavior
  helpers (`requestPanel`, `login`, `createSocket`, `uploadFile`, `downloadFile`, file ops),
  and tears the processes + temp data down per suite.
- Six integration suites by module: **instance**, **docker** (Linux only), **user**,
  **files + upload/download**, **instance I/O streams (multi-socket)**, **auth**.
- Deletion of all mock-data unit/route tests + their harnesses; folding the two existing
  real-disk/process daemon suites into the new framework.
- Refactor of the existing `panel/test/integration/` single-file flow into the shared library
  + the six suites (assertion shapes/findings preserved).
- Updates to `AGENTS.md` and `.agents/skills/{mcsmanager-test,mcsmanager-docker-instance-test}/`.
- Update of stale auto-memory notes ([[panel-integration-suite]], [[backend-route-test-suite]]).

**Out of scope:**
- **Frontend** test migration (frontend keeps its own vitest + jsdom suite) — but the common
  library's public helpers are isomorphic (axios + socket.io-client) so frontend tests *may*
  import `requestPanel`/`createSocket`/`uploadFile` to hit a running panel.
- The `scripts/verify-auto-update*.mjs` E2E harness is a separate E2E layer; migrating it onto
  the common harness is a **stretch goal** (§11), not part of the core 6 suites.
- Pure unit tests of logic that do not touch panel/daemon (see §5 keep-list) stay.

## 2. Key Decisions (made autonomously per the autonomy grant — flag for review)

These are the genuine forks. Each is decided here with rationale; if any is wrong, redirecting
after this spec is cheap (the harness is small and built first, alone).

### D1 — Library location: `common/test/integration/`

The reusable test framework lives in **`common/test/integration/`** (`lib/` = harness,
`suites/` = the six module files, `vitest.config.ts`, `run.mjs`). Rationale:
- The user said "代码可以放到 common 文件夹". `common/` is the shared library home.
- `common/tsconfig.json` already excludes `test/**` (per [[backend-route-test-suite]] fix +
  AGENTS.md §8), so the harness is **never** in the published `mcsmanager-common` bundle.
- Suites are black-box tests that drive the **panel** HTTP API (which proxies to the daemon),
  so they're panel-driven; keeping framework + suites together in one folder with one runner
  is cleaner than splitting across `panel/test/integration/` and `common/`.
- The existing `panel/test/integration/` is the **source**: its `lib/` is refactored into
  `common/test/integration/lib/`; its `integration.test.ts` is split into the six suites; the
  `panel/test/integration/` folder is then removed (its `FINDINGS.html` moves to the new home).

### D2 — Isolation strategy: per-suite boot, sequential runner

**Each suite file boots its OWN panel+daemon pair** in its own `mkdtemp` workspace, runs its
`it`s sequentially against that one pair (sharing one in-memory `world`), then force-kills +
wipes the workspace's `data/`. A runner script (`common/test/integration/run.mjs`) invokes the
six suite files **sequentially** (and skips `docker` on non-Linux / no Docker). Rationale:
- This matches the user's mental model exactly: "每个单元测试启动一次真实的 panel+daemon...强制终止面板,删除临时目录下的 data 文件夹...方便后续测试复用".
- vitest 0.33 **ignores** `singleFork` / `fileParallelism:false` for cross-file serialization
  (confirmed by the existing suite's single-file comment + [[panel-integration-suite]] gotcha
  #1). Relying on the vitest config to serialize 6 files would race the shared ports/state.
  The runner invokes vitest once per suite file; since each invocation has exactly one file,
  `it`s run sequentially by default and `globalSetup` boots/tears-down once per file.
- Sequential execution means **all suites reuse the default ports 23333/24444** (only one pair
  alive at a time) — no random-port allocation needed. If a previous suite's kill failed, the
  next suite's panel can't bind → it fails fast with a clear "port in use" error (acceptable;
  the group-kill `SIGTERM`→`SIGKILL` is robust).
- Boot cost: ~6× ~10s = ~60s total + per-suite runtime. Acceptable and robust.

> **Alternative considered (rejected):** One shared pair booted by a single `globalSetup`,
> all six suites sharing it and re-seeding `data/` between files. Faster boot, but vitest 0.33
> would run the six files in **parallel** (racing the one panel) — exactly the bug that forced
> the existing suite to a single file. Rejecting single-file collapse for 6 modules would
> reintroduce the race. Per-suite boot + sequential runner is the clean fix.

### D3 — Build prerequisite: require built `production/app.js` (dev build) + `daemon/lib`

The harness spawns `node panel/production/app.js` and `node daemon/production/app.js`
(the existing pattern; there is **no** ts-node / run-from-source path — confirmed by Agent 3 +
the existing `lib/bootstrap.ts`). So:
- Prereq: `cd common && npm run build` (common must be built first — panel/daemon alias its
  source), then `cd ../panel && npm run build` and `cd ../daemon && npm run build` (dev builds,
  no `BUNDLE=1` — the dev `production/app.js` uses `node_modules/`, which is present).
- `daemon/lib` platform binaries (`pty_<os>_<arch>`, `file_zip_<os>_<arch>`) must exist
  (downloaded via `install-dependents.bat/sh`).
- The runner checks at startup (existence + non-empty), prints a clear error with the exact
  build commands if missing. A convenience `test:integration:build` script builds then runs.
- This means: **after editing panel/daemon source, you must rebuild before re-running
  integration tests** (unlike the old mock route tests which ran against TS source via vitest).
  This is the cost of "real panel, real ops, no mocks" — accepted, documented in AGENTS.md.

> **Alternative considered (rejected):** Auto-build if `app.js` is older than the newest
  `src/**` file. Convenient but a ~minute webpack run on every test invocation is worse than a
  clear, explicit "build first" contract. Rejected; the runner only checks + errors.

### D4 — Keep pure unit tests; delete mock-data tests + harnesses; fold the 2 real hybrids

- **KEEP (pure logic / no panel/daemon I/O, no mock-of-thing-under-test):**
  `common/src/__test__/{system_storage,upgrade}.test.ts`; `panel/src/app/service/__test__/login_ban.test.ts`;
  `panel/src/app/utils/__test__/integration_test_mode.test.ts` (pure CLI parser of the `--unsafe`
  flag). These stay and run via `npm test` in their modules — they are not "mock 数据" tests.
- **DELETE (mock route tests + their harnesses):** `panel/test/harness/{app,auth,mocks,smoke.test}.ts`;
  the 17 `panel/src/app/routers/__test__/*_router.test.ts`; `panel/src/app/middleware/__test__/permission.test.ts`;
  `daemon/test/harness/{http,router,mocks,smoke.test}.ts`; the 14 `daemon/src/routers/__test__/*.test.ts`
  (the 12 mock router tests **plus** the 2 real-disk/process hybrids — see below).
- **KEEP (low-level real-disk/process daemon suites, per review decision):** the two existing
  in-process real-disk/process suites stay as a **lower daemon-side layer**:
  `daemon/src/routers/__test__/Instance_router.integration.test.ts` (real spawned child/Docker,
  in-process `routerApp` dispatch + import-time-timer mocks only) and `daemon/src/routers/__test__/
  file_router.security.test.ts` (real `FileManager` + real temp dirs, in-process dispatch). Decision
  (spec review): delete only the mock router tests + the mock-only harness; these two provide a
  daemon-side complement to the new panel-driven common suites — overlapping coverage, but at a
  different (lower) layer. `daemon npm test` therefore runs these two (NOT empty).
- **KEEP harness deps they use:** the two kept suites import some of `daemon/test/harness/
  {router,http,mocks}.ts` (verify exactly which during P1) — keep those parts, delete only the
  mock-router-only pieces + `daemon/test/harness/smoke.test.ts`. Same for the two kept suites'
  `vi.mock` of import-time-timer modules (those are boundary mocks for *test isolation* of timers,
  not "mock the thing under test" — allowed, as today).
- **KEEP fixture:** `daemon/test/fixtures/test.mjs` (reused by instance/docker/streams common
  suites — uploaded + run as `node test.mjs` inside the instance — AND kept as the local fixture
  the in-process daemon suite spawns).
- **Coverage preserved:** the "Review Focus" behaviors the deleted mock tests pinned
  (token mismatch → 403; apikey disabled → 403; `validator` 400; daemon gate silent 500-drop;
  file `../`-traversal reject) are **re-asserted in the new real-process suites** (auth suite,
  files suite) AND, for the daemon-side gate-drop + file-security, remain covered by the two
  kept in-process daemon suites. No coverage lost.

> **Net effect on `npm test`:** after migration `cd common && npm test` = the pure unit tests
> only (integration runs via `npm run test:integration`). `cd panel && npm test` = the kept
> pure unit tests (`login_ban`, `integration_test_mode`) — a fast pure layer. `cd daemon &&
> npm test` = the two kept real-disk/process daemon suites (Instance_router.integration +
> file_router.security) — the mock router tests are gone; the low-level real layer remains;
> end-to-end behavior is additionally covered by `cd common && npm run test:integration`.

### D5 — Public harness API surface (the "basic behavior functions" the user asked for)

Exported from `common/test/integration/lib/index.ts`, importable by any test (panel/daemon
suites AND frontend tests — the public helpers are isomorphic; only the bootstrap is
node-only):

```ts
// lifecycle (node-only; suites call in globalSetup)
bootRuntime(): Promise<Runtime>      // mkdtemp workspace, copy daemon/lib + market_cache, spawn daemon+panel, wait ready, return {key, panelUrl, daemonId, workDir, ...}
stopRuntime(rt: Runtime): Promise<void>   // best-effort cleanup via key, SIGTERM group, SIGKILL fallback, copy logs to .last-run/, rm workDir

// HTTP (isomorphic — axios)
requestPanel(opts): Promise<RawRes>  // {method,path,query,body,key?,cookie?,token?,headers?,timeout?} → {status,data,httpStatus,raw}; envelope unwrap + cooldown retry baked in
unwrap(res): {status,data,httpStatus,raw}
login(name, pass): Promise<{ok,cookie,token,raw}>
loginSessionRetry(role): Promise<{cookie,token}>
ensureUser(role, key): Promise<void>     // create-or-verify user
ensureOwner(role, key): Promise<void>    // assign current instance to role, retry transient store
createUser(name, pass, permission, key): Promise<{uuid}>

// sockets (isomorphic — socket.io-client)
createStream({daemonId, uuid, cookie, token}): Promise<Stream>  // POST stream_channel → connect → stream/auth → stream/detail → ready
Stream: { ready: Promise<boolean>, stdout: string[], send(cmd), write(input), disconnect(), socket }

// files (panel API + daemon-direct transfer)
fileOps.list/mkdir/move/copy/edit/read/delete/compress(...)
uploadFile({daemonId, uuid, dir, name, content|localPath, unzip?, overwrite?}): Promise<RawRes>   // single-shot multipart to daemon /upload/{password}
uploadFileChunked({..., pieceSize?}): Promise<RawRes>        // /upload-new + /upload-piece?offset= (mirrors frontend uploadService)
downloadFile({daemonId, uuid, name}): Promise<{httpStatus, data:Buffer}>

// misc
waitFor(fn, opts), sleep(ms), buildZip(entries), buildZipSystem(entries)
```

This is the "requestPanel / createSocket / uploadFile" basic-function library the user wants,
extracted/generalized from the existing `panel/test/integration/lib/*` so it is reusable by all
six suites and by frontend tests. The existing `lib/{bootstrap,world,http,socket,files,util}.ts`
are refactored into `common/test/integration/lib/` with the public surface above; the
node-only spawn/fs code stays in `lib/bootstrap.ts` + `lib/process.ts`.

### D6 — Six suites' content (one file each under `common/test/integration/suites/`)

Each suite is a standalone vitest file with its own per-invocation `globalSetup` (boots a fresh
pair), a single top-level `describe` of ordered `it`s sharing one `world`, and a `teardown`
that kills + wipes. Module content (from the module-mapping pass):

1. **`auth.test.ts`** — Install state machine (empty → `/auth/install` creates admin → second
   install 500 `installed`); login/logout/token (`?token=` mismatch → 403; forged cookie+token
   → 403; missing `x-requested-with` on token routes → 403 `ajaxError`); apikey path
   (`enableApiKey=false` → 403 `disabledApiKey`; ONLY_ADMIN; `x-request-api-key` with real key
   vs bogus key); **the `--unsafe` test-key boundary** (bypasses `permission` only;
   `GET /api/instance?uuid=<real>` with key → still 403 because the per-instance gate reads
   `ctx.session.uuid` — the "key is NOT instance-admin" finding); `GET /auth/status.isInstall`
   flip; `settings` block populates only for real logged-in users. (2FA: optional; skip + doc.)
2. **`user.test.ts`** — Create admin + normal users via key; `POST /auth` duplicate / weak
   password rejected; normal user cannot `POST /auth` (403) / delete / `GET /auth/overview` /
   edit others; `PUT /auth` instance-assignment primitive; `GET /auth/search` pagination +
   scrubbing (password/salt/apiKey); **越权**: `u2` reading `u1`'s instance → 403 on
   `/protected_instance/*` + `/files/*`, **500** on `GET /api/instance` (handler-throws-vs-gate
   403 inconsistency — kept as a finding, not fixed); `u1` `asynchronous?uuid=-&task_name=
   quick_install` → 403; forged session → 403.
3. **`instance.test.ts`** — `instance/new` → detail (config persisted) → `open` → poll RUNNING
   → `command` round-trip → `stop` (graceful via `stopCommand: exit`) → `kill` (force) →
   `restart` (new pid, startCount++) → `delete` (only when STOP; running-instance delete throws).
   Low-priv `PUT /protected_instance/instance_update` (oe/ie/stopCommand/terminalOption) by
   owner; assert `startCommand` change **rejected for non-docker instances** (use admin
   `PUT /api/instance` to change startCommand — documents `checkInstanceAdvancedParams` `{}` for
   non-docker). Async `quick_install` (admin, `uuid=-`); `install_instance` reinstall wipes
   uploaded files + re-downloads jar (the "files are wiped" invariant). Uses `test.mjs`
   fixture as `node test.mjs`.
4. **`docker.test.ts`** (Linux + reachable Docker only; `dockerOk = detectDocker()`, every `it`
   early-returns when false) — Image lifecycle (`POST /environment/image` build tiny Dockerfile,
   `GET /image`, `GET /progress`, `DELETE /image`); **container instance full cycle**:
   `instance/new` with `processType:"docker"` + docker config (image `node:20-alpine`,
   `ports`, `workingDir`, etc.) → `open` (poll RUNNING via `instance/detail.status===3`) →
   command round-trip (`echo`/`sum`/`pid`) via the `test.mjs` fixture bind-mounted at `/data` →
   `stop` (graceful via stopCommand `exit`) → `kill` (force) → `restart` (new container id, same
   uuid) → `delete` (removes config). Assert the **labelled** container actually appears/
   disappears via `docker.listContainers({all:true})` filtered on `mcsmanager.instance.uuid`.
   Assert a **normal user CAN change startCommand on a docker instance** (contrast with #3).
   Cleanup verification: no leaked labelled containers after the run.
5. **`files.test.ts`** — List (paginated) → mkdir → touch → edit (write `{target,text}`) →
   read (omit `text`) → move → copy → delete → verify via list; Chinese text
   (`"中文"`) through the stack; compress (zip) → decompress → compare. **Upload**: single-shot
   multipart `/upload/{password}` and **chunked `/upload-new` + `/upload-piece?offset=`**
   (mirrors frontend `uploadService`, concurrency-5, 2 MiB pieces) — assert `received` range
   tracking + auto-completion. **Download** via passport → `GET {addr}/download/{password}/
   {name}` → byte-identical. `download_from_url` async (start / poll status / stop).
   **Security**: zip-slip (`../slipescape.txt` entry → decompress rejected → escape file must
   not exist above instance cwd), path-traversal (`list/move/edit/delete/upload` with `../` all
   rejected). Per-instance gate: `u2` `GET /files/list?uuid=u1inst` → 403. Cooldown retry
   baked into `requestPanel` (speedLimit on `/files/list` 0.1, `/files/move` 3). chmod/
   chmod_batch skipped on non-Linux.
6. **`streams.test.ts`** — Two sockets to one instance (`createStream` ×2); identical broadcast
   of ASCII + Chinese `你好世界` on both (`bothSee`); computed `sum 2 3` → `SUM:5`; multi-line
   back-to-back ordering; both sockets can WRITE (`s2.send("pid")` → both see `PID:`);
   disconnect one → still receives on the other. **Command-injection inert** (`echo x; rm -rf /`
   etc. echoed literally — no shell). `stream/auth` wrong password → `ready` resolves false.
   `stream_channel` panel route: non-owner → 403. (Stretch: assert `instance/stopped` packet
   on both sockets on stop.)

### D7 — Docs + skills + memory updates
- `AGENTS.md` §8 (Testing Quirks) + §9 (Feature Deep-Dives) rewritten: the "Panel black-box
  integration tests" + "Docker + instance integration tests" entries now point at
  `common/test/integration/` as the canonical backend integration suite; the runner command,
  build prereq, the vitest 0.33 sequential-runner rationale, the six module suites, the docker
  skip policy, and the deletion of the old mock suites + harnesses documented.
- `.agents/skills/mcsmanager-test/SKILL.md`: update per-module commands (`cd common && npm run
  test:integration` for the real-process suites; `npm test` for the pure unit layers),
  expected totals, build prereq, and which suites survived (pure unit) vs moved (integration).
- `.agents/skills/mcsmanager-docker-instance-test/SKILL.md`: update — Docker + instance real
  lifecycle tests now live in `common/test/integration/suites/{instance,docker}.test.ts`
  (driven via panel over a real spawned daemon) instead of
  `daemon/src/routers/__test__/Instance_router.integration.test.ts`. Keep the root/sudo Docker
  requirement, `node:20-alpine` + `test.mjs` prerequisites, cleanup verification; the
  `threads:false` / `process.chdir` quirk no longer applies (spaw a real daemon, not in-process).
- Auto-memory: update [[panel-integration-suite]] + [[backend-route-test-suite]] to reflect the
  migration (new home, new suites, deleted mocks, new runner). Add a new note for the framework.

### D8 — Execution via superpowers (writing-plans → subagent-driven-development)
After spec approval: `superpowers:writing-plans` creates the detailed task plan; then
`superpowers:subagent-driven-development` executes via fan-out subagents per phase, with
per-step commits for traceability (matching the established MCSManager pattern + the user's
"per-step revertible" preference from prior work). The user authorized unattended execution,
so phases run sequentially without further confirmation; the harness is built + proven first
(Phase 1) before any suite fan-out.

## 3. Architecture

```
common/test/integration/
├─ lib/                        # the reusable real-process test framework (D5)
│  ├─ bootstrap.ts             # bootRuntime/stopRuntime: mkdtemp workspace, copy daemon/lib + market_cache, spawn daemon+panel(--unsafe), wait ready, kill+rm
│  ├─ process.ts               # spawn helpers, fs-extra copy, group-kill (SIGTERM→SIGKILL), log teeing
│  ├─ world.ts                 # per-invocation state (key, urls, daemonId, workDir, users, instance, findings) + .runtime.json handoff
│  ├─ http.ts                  # requestPanel, unwrap, cooldown retry, login, loginSessionRetry, ensureUser, ensureOwner, createUser
│  ├─ socket.ts                # createStream (stream_channel→connect→stream/auth→stream/detail), waitForOutput, collectText
│  ├─ files.ts                 # fileOps*, uploadFile (single-shot), uploadFileChunked (/upload-new+/upload-piece), downloadFile, getUploadPassport/getDownloadPassport
│  ├─ util.ts                  # waitFor, sleep, buildZip, buildZipSystem (zip-slip-capable), diskUsers
│  └─ index.ts                 # public API export (D5)
├─ suites/
│  ├─ auth.test.ts             # D6.1  ┐
│  ├─ user.test.ts             # D6.2  │ each file: own per-invocation globalSetup (bootRuntime),
│  ├─ instance.test.ts         # D6.3  │ single describe of ordered `it`s sharing one world,
│  ├─ docker.test.ts           # D6.4  │ teardown stopRuntime + wipe. Run SEQUENTIALLY by run.mjs.
│  ├─ files.test.ts            # D6.5  │
│  └─ streams.test.ts          # D6.6  ┘
├─ fixtures/
│  └─ test.mjs                 # copied from daemon/test/fixtures/test.mjs (single source of truth)
├─ vitest.config.ts            # root=common, include suites/**/*.test.ts, node env, globalSetup per suite invocation, 180s timeouts, passWithNoTests
├─ run.mjs                     # sequential runner: build-prereq check → loop suites (skip docker on !linux/!docker) → stop on first fail, summary
├─ globalSetup.ts              # shared globalSetup entry: setup=bootRuntime, teardown=stopRuntime (one per vitest invocation = one suite file)
├─ FINDINGS.html               # moved from panel/test/integration/; append new findings here
└─ .gitignore                  # .runtime.json, .last-run/
```

### Lifecycle (per suite invocation)
1. `run.mjs` verifies `panel/production/app.js` + `daemon/production/app.js` + `daemon/lib`
   exist; else errors with the build commands.
2. For each suite (docker skipped if not Linux / no docker): `node vitest run --config
   common/test/integration/vitest.config.ts suites/<suite>.test.ts`.
3. That invocation's `globalSetup` → `bootRuntime()`:
   - `mkdtemp(os.tmpdir()/mcsm-it-XXX)` → sibling `daemon/` + `panel/` dirs (sibling layout is
     load-bearing — panel auto-discovers daemon via `../daemon/data/Config/global.json`).
   - `copySync(daemon/lib → daemonDir/lib)`; copy `panel/data/market_cache.json` →
     `panelDir/data/`; copy `test.mjs` fixture into the suite's shared upload source.
   - spawn daemon `node daemon/production/app.js` with `cwd=daemonDir, detached:true`;
     wait for `daemonDir/data/Config/global.json` (20s) + 5s gap.
   - spawn panel `node panel/production/app.js --unsafe-integration-test-mode=<key>` with
     `cwd=panelDir, detached:true`; poll `GET /api/auth/status` with `x-request-api-key=<key>`
     until 200 (40s); discover `daemonId` via `GET /api/service/remote_services_list` (30s);
     `PUT /api/overview/setting {allowUsePreset:true}` via key.
   - write `.runtime.json` (`workDir/key/daemonId`).
4. The suite's `it`s run sequentially, share `world`, drive real HTTP + socket.io.
5. `globalSetup.teardown` → `stopRuntime()`: best-effort delete test instance + users via key;
   `process.kill(-pid, SIGTERM)` (group) → 1.5s → SIGKILL survivors; copy logs to `.last-run/`;
   `fs.rmSync(workDir)`; unlink `.runtime.json`.

### Why the auto-discovery + key mechanics are unchanged from the existing harness
Verified by the boot/apikey pass: the harness never reads the daemon apikey directly. The
**panel** reads `../daemon/data/Config/global.json` (`panel/src/app/service/remote_service.ts:
91-104`) and registers the daemon. The harness only waits for that file + waits for the panel to
surface the daemon. The `--unsafe` key is generated by the harness (not read back). Panel
`app.keys` + session cookie name are random per boot → the HTTP helper replays whatever
`Set-Cookie` login returns. All of this is proven by the existing 29-green suite; refactoring it
into `common/` preserves the exact mechanism.

## 4. The `--unsafe` test-mode boundary (load-bearing for suite design)

Two facts (confirmed by Agents 3 + 4) shape every suite:
1. The key bypasses **only** `panel/src/app/middleware/permission.ts:75-77` (level/token/
   session/speedLimit checks). It does NOT bypass `preCheckMiddleware` (mounted before
   everything) — which rejects key multipart uploads (`getUserFromCtx(key)` → null → throws).
   → **uploads go daemon-direct** (`POST {addr}/upload/{password}`), never via the panel.
2. The per-instance `router.use` gates (`instance_operate_router`, `filemananger_router`,
   `mod_manager_router`, `schedule_router`, `java_manager_router`) call
   `getUserUuid(ctx)` = `ctx.session?.["uuid"] || ""` — empty under the key → 403. → **every
   per-instance operation needs a real login (owner or admin) with the resulting cookie +
   `?token=`**. The key alone can only do the no-per-instance-gate admin routes (user/node/
   settings CRUD, market list).

So each suite's `world` holds a real admin + `u1`/`u2` real-login sessions (via `login` +
`ensureOwner`). `instance_admin_router` `GET /` checks ownership **inside** the handler → 403
becomes a 500 (handler-throws → protocol middleware 500). That inconsistency is documented as
a finding (do **not** fix product code); the user/instance suites assert it.

## 5. Cleanup / Migration Manifest

**DELETE (mock + harness):**
- `panel/test/harness/{app,auth,mocks}.ts` + `panel/test/harness/smoke.test.ts`
- `panel/src/app/routers/__test__/*.test.ts` (17 files)
- `panel/src/app/middleware/__test__/permission.test.ts`
- `daemon/test/harness/smoke.test.ts` + the mock-router-only parts of
  `daemon/test/harness/{http,router,mocks}.ts` (keep the pieces the two kept real suites import —
  verified in P1)
- `daemon/src/routers/__test__/*.test.ts` (the **12 mock router tests**; the 2 `.integration` /
  `.security` files are KEPT — see KEEP below)

**KEEP (decision: lower in-process real layer, do NOT fold/delete):**
- `daemon/src/routers/__test__/Instance_router.integration.test.ts` — real spawned child/Docker
  lifecycle, in-process `routerApp` dispatch; kept as the daemon-side complement to the new
  panel-driven `instance` + `docker` common suites.
- `daemon/src/routers/__test__/file_router.security.test.ts` — real `FileManager` workspace
  isolation / traversal / zip-slip, in-process dispatch; kept as the daemon-side complement to
  the new panel-driven `files` common suite.

**DELETE (after refactor):**
- `panel/test/integration/{integration.test.ts, vitest.config.ts, lib/*}` (refactored into
  `common/test/integration/`); `panel/test/integration/FINDINGS.html` + `.last-run/` move to
  `common/test/integration/`.

**KEEP (pure unit tests; unchanged):**
- `common/src/__test__/{system_storage,upgrade}.test.ts`
- `panel/src/app/service/__test__/login_ban.test.ts`
- `panel/src/app/utils/__test__/integration_test_mode.test.ts`

**KEEP (fixture):** `daemon/test/fixtures/test.mjs` (single source; the `common/test/integration/
fixtures/` copy is just a copy at boot to the workspace).

**KEEP (untouched, separate layer):** `scripts/verify-auto-update*.mjs`, `frontend/**` tests.

**DELETE (stale docs after rewrite):**
- `docs/backend-test-coverage-2026-09-29.md` — superseded (or archived) by the new coverage note.

## 6. Coverage-preservation map (assertions the deleted mock tests pinned → new suites)

| Deleted-mock assertion | New home (real-process) |
| --- | --- |
| `PUT /auth/update` token mismatch → 403 | `auth.test.ts` |
| `GET /overview` with `x-request-api-key` while `enableApiKey=false` → 403 | `auth.test.ts` |
| `POST /auth/login` missing field → 400 `Validator failed` | `auth.test.ts` (login) / `user.test.ts` (create) |
| daemon gate silent drop (unauthenticated socket → 500 packet) | covered two ways: the two **kept** in-process daemon suites assert it directly; the common `instance`/`auth` suites exercise the real panel→daemon socket auth end-to-end (panel sends the daemon key; a request while the link is down surfaces the error). No coverage delta. |
| `file/list` `target:"../../../../etc"` → rejected, no FS read | `files.test.ts` (path-traversal block) |
| per-instance gate 403 (non-owner) | `user.test.ts` + `instance.test.ts` + `files.test.ts` + `streams.test.ts` |
| validator 400 across routers | folded into the module suites' input-validation `it`s |
| 3 confirmed bug fixes (filemananger/java_manager/mod_manager 403-not-500) | the source fixes stay; the suites assert the 403 behavior end-to-end |

One **coverage delta** is explicit: the in-process daemon `routerApp` gate-drop packet assertion
(no real socket.io server) is removed — the new suites test daemon behavior through a real
spawned daemon over real socket.io, which is a stronger guarantee but doesn't isolate the gate's
silent-drop packet shape the way the in-process test did. Noted in the coverage doc.

## 7. Execution phases (high-level — `writing-plans` details tasks/commits)

- **P1 — Build the common framework.** Refactor `panel/test/integration/lib/*` into
  `common/test/integration/lib/` with the D5 public API; add `vitest.config.ts`, `globalSetup.ts`,
  `run.mjs`, npm scripts (`common` `test:integration`, `test:integration:build`; root `test:integration`);
  update `common/tsconfig.json` exclude (if needed). **Prove with a `suites/_smoke.test.ts`**
  that boots a pair, hits `/auth/status`, logs in, and tears down — before any suite fan-out.
  Commit `test(common): real-process integration framework + smoke`.
- **P2 — The six suites (fan-out, one subagent per suite).** Each subagent writes its suite
  against the stable P1 API, runs it via the runner, triages findings (fix confirmed bugs in
  product code per the TDD workflow; record ambiguities in `FINDINGS.html` / `docs/test-doubts/`
  WITHOUT changing code), reports. Main session reviews + commits each suite. Order:
  auth → user → instance → files → streams → docker (docker last; skip-authorable on non-Linux).
- **P3 — Cleanup.** Delete the 12 mock router tests + `daemon/test/harness/smoke.test.ts` + the
  mock-router-only parts of `daemon/test/harness/{http,router,mocks}.ts` (keeping the imports
  the two kept real suites use), the 17 panel mock router tests + `panel/test/harness/*` +
  `panel/src/app/middleware/__test__/permission.test.ts`, and `panel/test/integration/` (after
  refactor). **Keep** `Instance_router.integration.test.ts` + `file_router.security.test.ts` +
  `daemon/test/fixtures/test.mjs`. Verify `cd panel && npm test` = kept pure unit tests;
  `cd daemon && npm test` = the two kept real-disk/process daemon suites (green);
  `cd common && npm test` unchanged (pure).
- **P4 — Docs + skills + memory.** Rewrite AGENTS.md §8/§9 + the two skills; update
  [[panel-integration-suite]] + [[backend-route-test-suite]] + add [[integration-test-framework]];
  write the new coverage note (supersedes `backend-test-coverage-2026-09-29.md`).
- **P5 — Full green run + verification note.** `cd common && npm run test:integration`
  (docker auto-skipped on this macOS dev box) → all suites green (docker suite reports
  "skipped: need Linux + Docker"); `cd common/panel/daemon && npm test` reflects the pure layer;
  capture totals + write the verification note.

## 8. Risks & Gotchas
- **vitest 0.33 parallelism**: the one hard constraint → D2 (sequential runner, per-suite boot).
  Do NOT split suites expecting vitest's `singleFork` to serialize them.
- **Build prereq**: tests run against built `production/app.js`, not TS source. After editing
  panel/daemon `src`, rebuild before re-running. Runner checks + errors clearly.
- **Per-instance gate under the key**: key can't operate a specific instance → every
  per-instance `it` does a real `login` + `ensureOwner` first; the panel user store can be
  transiently empty → `ensureOwner` retries (8× within the helper).
- **session cookie name is random per panel boot** → replay whatever `Set-Cookie` returns.
- **speedLimit cooldown** on `/files/list` (0.1) + `/files/move` (3) → `requestPanel` retries
  400ms ×10 on 500 "cooldown".
- **uploads go daemon-direct** (panel `preCheckMiddleware` rejects the key) → `uploadFile` hits
  the daemon's `/upload/{password}` (single-shot) or `/upload-new`+`/upload-piece` (chunked),
  never the panel upload route.
- **Docker suite needs Linux + reachable dockerd + root/sudo** → `dockerOk` early-return per
  `it` (the established pattern from `Instance_router.integration.test.ts`); on the dev macOS
  box it auto-skips. The suite pulls `node:20-alpine` if missing (network).
- **macOS lib**: `daemon/lib` has `pty_darwin_arm64` + `file_zip_darwin_arm64` locally; the
  `file_zip` binary backs compress/decompress; zip/unzip in the files suite needs it.
- **No new heavy deps**: `fs-extra` (copySync) is the only extra dep the existing harness uses;
  everything else is Node builtins + `axios` + `socket.io-client` (already devDeps in panel).
- **Frontend helpers isomorphic**: public API uses axios + socket.io-client (jsdom-compatible);
  bootstrap is node-only. Frontend tests importing `requestPanel` need a running panel (started
  by an integration globalSetup or a dev) — documented usage pattern.

## 9. Out of Scope / Stretch
- Migrating `scripts/verify-auto-update*.mjs` onto the common harness (its own sub-project; do
  after the 6 suites are green if the user wants it).
- Adding the daemon-side gate-drop packet assertion back (coverage delta §6) — would need a
  minimal in-process daemon test, which the user's "no mocks" direction rules out; skip.
- 2FA end-to-end (TOTP) in `auth.test.ts` — optional; skip + document if time-bound.
- Re-implementing the in-process `file_router.security` micro-variations (symlink, sibling);
  they're covered by the real-process `files.test.ts` traversal block.

## 10. Self-Review (inline)
- **Placeholders/TODOs**: none. The D6 content is concrete per the module-mapping pass.
- **Internal consistency**: D2 (sequential runner) is consistent with the vitest 0.33 gotcha
  (§8) and the existing single-file rationale; D5's API matches D6's usage; D4's coverage map
  (§6) preserves the deleted-mock pinned behaviors.
- **Scope**: large but decomposed P1 (framework, alone) → P2 (suites, fan-out) → P3 cleanup →
  P4 docs → P5 verify. Each is a committable, revertible unit — matches the user's per-step
  preference. The framework is de-risked by the `_smoke.test.ts` before any fan-out.
- **Ambiguity**: "all tests → real process" is interpreted as "convert all panel/daemon mock
  route/behavior tests to real-process integration; keep pure logic unit tests; delete mocks;
  KEEP the two existing low-level real-disk/process daemon suites as a daemon-side complement"
  (per spec-review decision). The build-prereq + execution-mode decisions are confirmed by
  the user.
