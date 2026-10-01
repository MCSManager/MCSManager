# MCSManager Backend Integration Test Coverage (2026-09-30)

> Supersedes [`docs/backend-test-coverage-2026-09-29.md`](backend-test-coverage-2026-09-29.md) (the mock route suite coverage from the `feat/backend-route-tests` branch). The mock route suites (`panel/src/app/routers/__test__/*` + `daemon/src/routers/__test__/*_router.test.ts` mocks) and the first-generation `panel/test/integration/` black-box E2E runner were DELETED in the cleanup; the canonical backend integration layer now lives in `common/test/integration/`.

## 1. Outcome

The backend has **two** test layers after the 2026-09-30 migration:

1. **Pure unit** per module — logic-only, mocks for boundary I/O.
2. **Real-process integration** — boots a REAL daemon + panel and drives the whole backend over HTTP + socket.io (no mocks).

| Layer | Module | Command | Test files | Expected |
| --- | --- | --- | --- | --- |
| Pure unit | `common` | `cd common && npm test` | `common/src/__test__/{system_storage,upgrade}.test.ts` | 9 passed |
| Pure unit | `panel` | `cd panel && npm test` | `panel/src/app/utils/__test__/integration_test_mode.test.ts` (8) + `panel/src/app/service/__test__/login_ban.test.ts` (23) | ~31 passed |
| Real-disk/process | `daemon` | `cd daemon && npm test` | `daemon/src/routers/__test__/Instance_router.integration.test.ts` (12) + `daemon/src/routers/__test__/file_router.security.test.ts` (24) | ~36 (docker early-skipped off-Linux) |
| Pure unit (jsdom) | `frontend` | `cd frontend && npm test` | 7 files | 41 passed |
| Real-process integration | `common` | `cd common && npm run test:integration` | `common/test/integration/suites/{_smoke,auth,user,instance,files,streams,docker}.test.ts` | ≈65 passed / 6 skipped on macOS; ≈70 passed / 1 skipped on Linux+Docker |

The old mock route suites + the `panel/test/integration/` black-box runner are DELETED. The new `common/test/integration/` is the canonical backend integration layer, with the two kept daemon suites as its daemon-side low-level complement.

## 2. Architecture — `common/test/integration/`

```
common/test/integration/
  lib/
    bootstrap.ts    # bootRuntime/stopRuntime: spawn daemon, sleep 5s, spawn panel --unsafe=<key>, wait /auth/status
    world.ts         # shared singleton + RUNTIME_FILE (cross-file persistence); addFinding/saveState
    http.ts          # requestPanel, login, ensureUser/Owner, createUser, loginSessionRetry
    socket.ts        # createStream, waitForOutput, collectText (socket.io)
    files.ts         # upload (single-shot/chunked), download, zip, list, edit, move, copy, delete, traversal
    util.ts          # waitFor, sleep, buildZip/System
    process.ts       # spawnApp, groupKill
    index.ts         # re-exports
  suites/
    _smoke.test.ts   # framework proof: key hits /auth/status + admin login
    auth.test.ts     # install state machine + login + token + forgery + api-key gate + key boundary
    user.test.ts     # admin user CRUD + 越权 + scrub + per-instance gate + normal-user quick_install
    instance.test.ts # lifecycle: create/open/command/stop/kill/restart/delete + startCommand change
    files.test.ts    # CRUD + zip + upload+unzip + download + zip-slip + path-traversal + per-instance gate
    streams.test.ts  # instance I/O multi-socket: broadcast, multi-line, write, disconnect, auth, stop
    docker.test.ts   # Linux + reachable dockerd: docker instance + image lifecycle (visible-skip off-Linux)
  fixtures/
    test.mjs         # interactive process fixture (line protocol + heartbeat; copied from daemon/test/fixtures/test.mjs)
  globalSetup.ts     # vitest globalSetup: loadState() then bootRuntime(); teardown stopRuntime()
  vitest.config.ts   # root: common/, 180s timeouts, environment node, the globalSetup
  run.mjs            # sequential runner: one vitest invocation PER suite file
  FINDINGS.html      # static findings doc (the runner's `addFinding` accumulation is separate)
  .runtime.json      # git-ignored cross-file runtime state (per-invocation key/pids/urls)
  .last-run/         # git-ignored post-mortem logs (daemon.log, panel.log, info.json)
```

### Per-suite boot model

Each suite is a separate `vitest run` invocation. `globalSetup` boots a fresh daemon + panel on the default ports (panel `23333`, daemon `24444`) in a per-suite `mkdtemp` workspace (`workDir/{daemon,panel}` siblings), passes a per-invocation random `--unsafe-integration-test-mode=<key>`, waits for `/auth/status` 200, discovers the local daemon id, opens `allowUsePreset`, then hands off to the test file. **No state inherits across suites** — each suite's admin/u1/u2/instance are freshly created via the `--unsafe` key + real logins. `teardown` best-effort deletes the test instance + users, group-kills the processes (with 1.5s SIGTERM grace + SIGKILL), copies logs to `.last-run/`, and removes the tmp workDir.

### Sequential-runner rationale (vitest 0.33 parallelism gotcha)

vitest 0.33 **ignores** `singleFork` / `fileParallelism:false`; multiple files in one invocation would run in parallel and race the shared panel/state (same default ports, same `world`). `run.mjs` instead invokes each suite file as its OWN `vitest` process with one shared `globalSetup` per file → sidestepping the parallelism bug. **Do NOT collapse the suites into a single vitest invocation.**

### The `--unsafe-integration-test-mode=<key>` boundary (load-bearing)

The per-invocation random key is passed as the `x-request-api-key` header to all panel routes. It bypasses **only** `panel/src/app/middleware/permission.ts` (level/token/session/speedLimit). It does NOT bypass:

- `preCheckMiddleware` — multipart uploads still go daemon-direct via the `stream_channel`/mission passport system.
- The per-instance `router.use` gates on `instance_operate_router` / `filemananger_router` / `instance_admin_router` / `java_manager_router` / `schedule_router` / `mod_manager_router` — these read `ctx.session.uuid`, which is empty under the key, so they return **403**.

Per-instance operations therefore use a REAL login (owner/admin cookie + `?token=`); the key alone is only valid for **no-per-instance-gate** admin routes (user/node/settings CRUD, market list, `/service/remote_services_list`).

## 3. The six suites + the smoke proof — `it` counts + coverage

Counts are exact (`grep -cE "^\s*it\("` in each file); the `it.skip` and the `dockerIt = dockerOk ? it : it.skip` cases are called out explicitly.

| Suite | `it` count | What it covers | Deferred / skipped |
| --- | --- | --- | --- |
| `_smoke.test.ts` | 2 | Framework proof: key hits `/auth/status` 200; admin login works and reads `/auth/overview`. | — |
| `auth.test.ts` | 16 | Install state machine (`isInstall` flips after admin create); `POST /auth/install` rejected post-install; admin + u1 + u2 created via the key; login → cookie + token; u1 cannot create user; wrong/forged/missing token; api-key gate (`enableApiKey=false`); the `--unsafe` key bypasses `permission` ONLY (per-instance gate still applies — the throwaway-instance test asserts the key gets 500 on `/api/instance?uuid=<real>`); validator/input-shape gates (weak password, missing password). | — |
| `user.test.ts` | 17 | Admin creates users (duplicate/weak password rejected); minimal instance via the key; `ensureOwner(u1)`; u1 cannot POST/DELETE/GET-search/PUT-on-others (admin-only → 403); `/auth/search` paginated + scrubbed (no `passWord`/`salt`/`apiKey`); 越权 u2 → 403 (per-instance `router.use` gate) or 500 (handler-throw on `instance_admin GET /`); u2 cannot `stream_channel`; normal user cannot self `quick_install` (per-instance gate on `uuid='-'`). | — |
| `instance.test.ts` | 9 | `POST /api/instance` create; low-priv `instance_update` by u1 (oe/ie/stopCommand/terminalOption); normal user CANNOT change `startCommand` on a non-docker instance, admin CAN; open → poll RUNNING; command round-trip via `/protected_instance/command` + `outputlog`; stop (graceful `stopCommand: 'exit'`); kill (force); restart (`pid` change + `startCount++`); delete running rejected → delete STOPPED. | Market `quick_install` + `reinstall` **deferred** — network-bound ~52MB jar from `fill-data.papermc.io`; recorded via `addFinding` `F-quick-install-deferred`, no skipped `it`. |
| `files.test.ts` | 11 | setup + mkdir → upload single-shot → list; mkdir → edit (Chinese) → read → move → copy → delete; compress (zip) → decompress → byte-identical; upload single-shot multipart; upload with `unzip=1` → extracted; upload chunked (`/upload-new` + `/upload-piece`) → received tracking → auto-complete; download (passport) → `/download/{password}/{name}` → byte-identical; zip-slip `../` entry rejected; path-traversal `../` on list/move/edit/delete/upload rejected; per-instance gate u2 → 403. | `download_from_url` **deferred** — network-bound; `addFinding` `F-download-from-url-deferred` + 1 `it.skip`. |
| `streams.test.ts` | 9 | open + setup (instance RUNNING on `node test.mjs`); dual-socket broadcast (both sockets see the same ASCII + Chinese line); multi-line back-to-back ordering on both sockets; both sockets can WRITE; disconnect → `s1.connected false`, s2 still receives; **command injection inert** (`echo x; rm -rf /` → `ECHO:x; rm -rf /`, literal, no shell); stream/auth wrong password → ready false; non-owner u2 POST `/protected_instance/stream_channel` → 403; stop delivers `instance/stopped` to attached sockets. | — |
| `docker.test.ts` | 1 + 5 `dockerIt` | Always-running availability probe `it` (records `F-docker-availability`). 5 `dockerIt` (Linux + reachable dockerd only): create docker instance; open + RUNNING; command round-trip via `/protected_instance/command`; stop / kill / restart; image lifecycle (`POST/GET/DELETE /api/environment/image`); cleanup — no leaked labelled containers. | Off-Linux / unreachable dockerd: the 5 `dockerIt` become `it.skip` (visible SKIPPED, not silent passes). |

**Totals:** 2 + 16 + 17 + 9 + 11 + 9 + 1 = 65 `it`, plus 1 always-skipped `it.skip` in `files` and 5 `dockerIt` (gated). Registered entries = 71.

On a macOS dev box: ≈65 passed / 6 skipped / 0 failed. On Linux + root + reachable docker: ≈70 passed / 1 skipped / 0 failed (the 1 skipped is `download_from_url`).

## 4. Findings (design-level ambiguities — NOT product-code fixes)

The suites record ambiguities via `addFinding` at runtime; the runner accumulates them into `common/test/integration/FINDINGS.html`. They are **not** bugs to fix in product code — they are documented behavior the tests assert against, surfaced for future design review.

| ID | Suite | One-line explanation |
| --- | --- | --- |
| `F-install-rejected-status` | auth | `POST /auth/install` when already installed returns non-200 (400 by way of `validator`'s try/catch) — handler-throw → validator error envelope. |
| `F-key-not-instance-admin` | auth | The `--unsafe` test key bypasses `panel/src/app/middleware/permission.ts` only, NOT the per-instance `router.use` gate — the gate reads `ctx.session.uuid`, empty under the key → 403. |
| `F-instance-admin-throw-500` | auth | `instance_admin GET /` puts the ownership check INSIDE the handler (outside the `router.use` gate), so a non-owner returns a 500 error envelope, NOT 403 like its sibling routers. Cross-referenced from [`docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md`](test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md). **Do NOT fix product code.** |
| `F-normal-quickinstall` | user | A normal user is blocked from `quick_install` by the per-instance gate on `uuid='-'` (admin-only). |
| `F-quick-install-deferred` | instance | Market `quick_install` + `reinstall` are deferred — network-bound ~52MB jar pull. Recorded for manual / CI-with-network runs. |
| `F-normal-cannot-change-startcmd` | instance | A normal user cannot change `startCommand` on a non-docker instance (good security — admin can). |
| `F-download-from-url-deferred` | files | `download_from_url` start/poll/stop deferred — network-bound. Explicit `it.skip` + `addFinding`. |
| `F-unzip-keeps-source-archive` | files | The legacy `/upload/:k` route does NOT delete the source archive after `unzip=1` (intentional behavior under that route). |
| `F-compress-source-targets-swap` | files | `POST /files/compress` source/targets semantics are overloaded across `type=1` vs `type=0`. |
| `F-cmd-injection-inert` | streams | Command injection via stream/input is inert — `echo x; rm -rf /` arrives as the literal string `ECHO:x; rm -rf /`, no shell. (Good security.) |
| `F-docker-availability` | docker | Informational probe — records whether the docker cases ran for real or were skipped on this host. |
| `F-docker-startcmd-change-allowed` | docker | A docker instance permits `startCommand` change (contrast with non-docker — see `F-normal-cannot-change-startcmd`). |

The `F-instance-admin-throw-500` 500-vs-403 越权 inconsistency is the one with an existing test-doubts doc; the others are documented in `common/test/integration/FINDINGS.html`.

## 5. How to run

```bash
# 1) pure unit + kept suites per module (fast)
cd common  && npm test           # 9 passed
cd panel   && npm test           # ~31 passed (login_ban + integration_test_mode)
cd daemon  && npm test           # ~36 — Instance_router.integration (12) + file_router.security (24); docker early-skipped off-Linux
cd frontend && npm test         # 41 passed

# 2) common real-process integration (build prerequisite — see below)
cd common && npm run test:integration       # run after building panel+daemon
# convenience: rebuild common → panel → daemon then run integration
cd common && npm run test:integration:build
```

### Build prerequisite (load-bearing)

`run.mjs` requires pre-built:

- `panel/production/app.js` (dev build, no `BUNDLE=1`)
- `daemon/production/app.js` (dev build, no `BUNDLE=1`)
- `daemon/lib/<pty|file_zip>_<os>_<arch>` platform binaries (install via `./install-dependents.sh`)
- `panel/data/market_cache.json` (so `quick_install_list` works offline)

If any are missing, `run.mjs` errors with the build commands. After editing panel or daemon SOURCE, rebuild before re-running integration. `npm run test:integration:build` automates that (common → panel → daemon → run).

## 6. Known limitations

- **Build prerequisite.** The integration runner does not build panel/daemon; misbuilds cause a hard error with the build commands.
- **Network-bound deferred cases.** Market `quick_install` (`instance`), `reinstall` (`instance`), and `download_from_url` (`files`) need network access (a ~52MB jar pulls from `fill-data.papermc.io`). They are `it.skip` + `addFinding` so the default dev-box run stays offline and fast; they exist for manual or CI-with-network runs.
- **Docker is Linux + reachable dockerd only.** `docker.test.ts` self-skips per `it` off-Linux (`dockerIt = dockerOk ? it : it.skip`). The common suite NEVER fails on macOS / Windows due to docker — the docker cases show as SKIPPED (not silent passes).
- **Sequential + per-suite boot makes it slow.** Each suite boots a fresh daemon (sleep 5s + readiness wait) + panel (readiness wait up to 40s) → the full run is several minutes even on a fast box. The 180s per-test timeout is generous (instance engine has 2s start + 6s kill guards).
- **Run.mjs stops on first failure.** It short-circuits so the first broken suite is debuggable in isolation. Fix it and re-run.
- **macOS / dev box expected results:** `cd common && npm run test:integration` → ≈65 passed / 6 skipped (5 docker + 1 `download_from_url`) / 0 failed; docker test suite clearly shows the SKIPPED case names via the verbose reporter.

## 7. Relationship — the three backend test layers

| Layer | What it tests | Where |
| --- | --- | --- |
| **Pure unit** | Logic in isolation (mocked boundary I/O). Fast feedback, exhaustive branch coverage. | `common/src/__test__/*`, `panel/src/app/{utils,service}/__test__/*`, `frontend/src/**/__test__/*` |
| **Real-process integration (panel-driven, end-to-end)** | The whole backend as a user would see it: real spawned daemon + panel, real HTTP + socket.io, real disk + child processes + Docker. The **canonical** backend integration layer. | `common/test/integration/` |
| **Real-disk/process (daemon-side, in-process low-level)** | The daemon router in isolation from the panel: real child/container lifecycle, real disk, but the daemon is imported in the test process (no panel socket). The daemon-side **complement** to the common suite. | `daemon/src/routers/__test__/Instance_router.integration.test.ts` + `file_router.security.test.ts` |

A change to `daemon/src/routers/Instance_router.ts` / `instance.ts` / the `general/*` commands / the docker services is covered by BOTH real-process integration suites — the common one (panel-driven) and the kept in-process one (daemon-side low-level). Run both (see the `mcsmanager-docker-instance-test` skill).

## 8. Cross-references

- AGENTS.md §8 "Testing Quirks" — the post-migration test surface, all-in-one loop.
- AGENTS.md §9 "Backend integration tests" + "Docker + instance integration tests" — the canonical deep-dive entries.
- `.agents/skills/mcsmanager-test/SKILL.md` — per-module commands + the loop.
- `.agents/skills/mcsmanager-docker-instance-test/SKILL.md` — docker + instance lifecycle (both suites).
- `common/test/integration/FINDINGS.html` — the static findings doc + the runtime accumulation pointer.
- `docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md` — the test-doubts cross-reference for `F-instance-admin-throw-500`.
- `docs/backend-test-coverage-2026-09-29.md` — the prior (mock-based) coverage note this file supersedes.

## 9. Final Verification (closing run)

Branch: `yumao/full-test-v2`. The migration is functionally complete (framework built, mock tests deleted, docs updated).

**Verified green — sources cited:**

| Surface | Command | Result | Source |
| --- | --- | --- | --- |
| common pure unit | `cd common && npm test` | 9 passed (2 files: `system_storage` 6 + `upgrade` 3) | re-run this closing pass (197ms) |
| panel pure unit | `cd panel && npm test` | 31 passed (2 files: `login_ban` 23 + `integration_test_mode` 8) | re-run this closing pass (219ms) |
| daemon kept real suites | `cd daemon && npm test` | 36 passed across `Instance_router.integration` (real child/container lifecycle, docker early-skipped off-Linux) + `file_router.security` (real-disk sandbox, 24) | T11 verify pass (no source changed since — T12 was docs-only); takes ~2 min due to real child processes |
| common integration (canonical) | `cd common && npm run test:integration` | 6 suites green: `_smoke` 2 / `auth` 16 / `user` 17 / `instance` 9 / `files` 11 (+1 skipped) / `streams` 9 / `docker` 1 (+5 skipped) ≈ **65 passed, 6 skipped** | T11 full-run verify pass; `_smoke` re-run this closing pass (2 passed, 12.81s, real daemon+panel boot confirmed post-T12) |
| webpack type-check builds | `npm run build` in `common`/`panel`/`daemon` | all compile green | T12 verify pass |

**docker auto-skip (macOS dev box):** Docker is not installed locally, so `dockerOk=false`; `common/test/integration/suites/docker.test.ts` uses `dockerIt = dockerOk ? it : it.skip` → 1 always-runs probe `it` passes + 5 `dockerIt` visibly SKIP; the kept `daemon/.../Instance_router.integration.test.ts` early-returns its Docker cases (`if (!dockerOk) return;`). **On a Linux + Docker CI runner the docker suite exercises the real container lifecycle** (root/sudo for the socket; see the `mcsmanager-docker-instance-test` skill).

**Skipped/deferred cases (documented, not blocking):**
- `instance` market `quick_install` + reinstall — network-bound (~52MB jar from `fill-data.papermc.io`); `F-quick-install-deferred` finding; bare lifecycle covered via `instance/new` + `node test.mjs`.
- `files` `download_from_url` — network-bound; `.skip` + `F-download-from-url-deferred`.

**Deferred polish (non-blocking, recorded in the SDD ledger):** `run.mjs`'s `isLinux` dead var / all-platforms docker invocation (a `if (name === "docker" && !dockerOk) continue` would save a ~12s wasted boot off-Linux); `files` per-instance-gate `it` omits admin→200 (u2→403 solid); docker `it #4` title-vs-body (startCommand-change admin-key path, not the user path — documented via `F-docker-startcmd-change-allowed`); `common/package.json` lists `fs-extra` in both `dependencies` + `devDependencies` (npm dedups).

**Run cost on this box:** the four module `npm test` runs are sub-second to ~2 min (daemon); `cd common && npm run test:integration` is ~3–5 min sequential (6 suites × ~30–90s each, one panel+daemon boot per suite). Rebuild panel/daemon after editing their `src` before re-running integration (the runner requires pre-built `production/app.js`).
