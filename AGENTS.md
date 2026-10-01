---
description: Core project rules for all AI assistants (Claude, Cursor, etc.)
---

## 1. Project Layout

- **`panel/`** — Web backend (Koa): users, nodes, auth, API. Entry `panel/src/app.ts`, webpack → `production/app.js`.
- **`daemon/`** — Node worker: instance processes, containers, files, terminal. Entry `daemon/src/app.ts`.
- **`frontend/`** — Vue 3 + Vite UI. Talks to panel; some features talk directly to daemon to reduce load.
- **`common/`** — Shared library published as `mcsmanager-common`. panel/daemon alias it to **source** (`common/src/index.ts`) via tsconfig `paths` + webpack `resolve.alias`, so edits are compiled directly into both apps — no publish step needed, but each app must be rebuilt to pick up changes.
- **`languages/`** — Root-level i18n JSON shared by all three subprojects (`@languages` alias). Filenames use capital region (`en_US.json`); runtime locale codes are lowercase (`en_us`) — don't mix them up.

## 2. Commands

- Setup: `./install-dependents.sh` (or `.bat`) — installs all packages and builds `common` (root `npm run preview-build` = build common despite the name). Node.js 16+ (CI runs 16.x/20.x).
- Dev: `npm run dev` (all three concurrently) or `npm run panel` / `npm run daemon` / `npm run frontend` (each = nodemon → `npm run build` → run `production/app.js`).
- Build per package: `cd panel|daemon && npm run build` (webpack + ts-loader); `cd frontend && npm run build` (`type-check` + vite); `cd common && npm run build` (tsc → `dist/`).
- **Verification before finishing** — **MANDATORY: after changing code in _any_ module you MUST run the relevant test suite(s) and report the result before finishing. Never claim a change is done without running its tests.** `common`, `daemon`, `panel`, `frontend` all have vitest suites (`cd <module> && npm test`); a `common/` change requires running common + daemon + panel because both apps alias `common/src` directly (see §8). Run **all** suites with the one-pass loop in the [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) skill. Frontend also: `npm run type-check`, `npm run lint` (eslint `--fix`) — run type-check before lint/test when touching TS types; panel/daemon webpack `npm run build` is their type check.
- Release package: `./build.sh` / `build.bat` → `production-code/` (`BUNDLE=1` inlines all deps + language packs into a single self-contained `app.js`). Platform binaries (`daemon/lib` PTY / Zip-Tools, see `lib-urls.txt`) are NOT bundled — required at runtime for terminal & compression, see DEVELOPMENT.md. Full build & deploy guide: the project Agent Skill [`mcsmanager-build`](.agents/skills/mcsmanager-build/SKILL.md) (in-repo, tool-neutral `.agents/skills/`, shared by all AI tools; short summary in [`docs/build-production.md`](docs/build-production.md)).
- i18n tooling: `npm run i18n`, `npm run sort-lang-keys`, `npm run scan-useless-key` (see §4).
- Prettier: `printWidth: 100`, `trailingComma: "none"`.

## 3. Persistence

- All JSON data models persist through `StorageSubsystem` (`common/src/system_storage.ts`): atomic tmp-file + rename into `data/<Category>/<uuid>.json`. Do not hand-roll `fs.writeFile` for config/data storage.
- Panel side: use `Storage.getStorage().store(...)` (`panel/src/app/common/storage/sys_storage.ts`) — it transparently swaps to Redis when `redisUrl` is configured. Daemon uses the `StorageSubsystem` singleton directly.
- Sensitive files (never log their contents): `daemon/data/Config/global.json` (panel↔daemon key), `panel/data/User/*.json` (apiKey, password hash, 2FA secret), `panel/data/RemoteServiceConfig/*.json` (node apiKey).

## 4. General Coding Rules

- **Minimal changes**: prefer small, focused edits. Before adding new logic, check existing `hooks`, `services`, `stores`, `utils` in the relevant subproject and reuse when possible.
- **Code & comments in English**; user-facing text goes through i18n (backend logs excepted).
- Aim for high cohesion, low coupling, reusable code.

## 5. i18n Conventions

- **Frontend (Vue)**: `t()` from `@/lang/i18n` (vue-i18n). **Backend/daemon**: `$t()` from `panel/src/app/i18n` / `daemon/src/i18n` (i18next).
- Keys use the `TXT_CODE_` prefix. Two styles coexist: manual descriptive keys (`TXT_CODE_system_instance.autoStart`) and auto-generated `TXT_CODE_<crc32hex>` keys.
- Source strings: short, correct English in `languages/en_US.json`; other locales are translations.

### 5.1 Parameterized strings — DIFFERENT placeholder syntax

- **Frontend**: one pair of braces `{name}` (vue-i18n).
- **Backend/daemon**: double braces `{{uuid}}` (i18next).

```json
{
  "TXT_CODE_FILE_ERROR": "File {name} error!",
  "TXT_CODE_INSTANCE_ERROR": "Exception instance {{uuid}}: {{err}}"
}
```

```vue
<template>{{ t("TXT_CODE_FILE_ERROR", { name: props.fileName }) }}</template>
```

```ts
const errorMsgWithParams = $t("TXT_CODE_INSTANCE_ERROR", {
  uuid: instance.instanceUuid,
  err: err
});
```

### 5.2 `npm run i18n` rewrites source files

`i18next-scanner` (`i18-scanner.config.js`) finds literal strings in `t()`/`$t()` calls and **rewrites the source file in place**, replacing the literal with a generated `TXT_CODE_<crc32>` key, then writes `languages/zh_CN.json` + `en_US.json` only (other locales are maintained separately, e.g. `scripts/auto-translate.mjs`). Run it deliberately; review the diff it produces in `src/`.

## 6. Backend Conventions (`daemon/src/**`, `panel/src/app/**`)

- Folder names express layers (routes, middleware, services, instances, …) — put new code in the right layer.
- Use the project **logger**, not raw `console.*`; pick severity by context.
- External resources (files, network, containers, shell): validate inputs/boundaries first; on failure log and rethrow or return a typed result — never silently swallow.
- Security: strictly parse/validate container & command config (length, format, allowed values); never pass unvalidated frontend input into shell args or path operations.
- Long-lived structures (Map, queues, buffers, streams) need corresponding cleanup — avoid unbounded growth.

## 7. Frontend Conventions (`frontend/src/**/*.vue`)

- Vue 3 `<script setup lang="ts">`; prefer `const` with explicit types.
- Extract complex logic into `hooks/` (composables) grouped by responsibility; extract complex template blocks into components.
- One-way data flow: props down, events up — never mutate parent state directly.

## 8. Testing Quirks

- **Post-migration test surface (2026-09-30):** every module has a vitest suite, and the backend has **two** test layers — pure unit + a real-process integration runner.
  - `cd common && npm test` — pure unit (`common/src/__test__/{system_storage,upgrade}.test.ts`, 9 tests; logic only).
  - `cd common && npm run test:integration` — the canonical backend integration layer: real spawned daemon + panel, six suites in `common/test/integration/suites/` (see §9). Slower; build prerequisite applies (see §9). `cd common && npm run test:integration:build` rebuilds common → panel → daemon then runs.
  - `cd panel && npm test` — the kept pure unit tests (`panel/src/app/utils/__test__/integration_test_mode.test.ts` 8 + `panel/src/app/service/__test__/login_ban.test.ts` 23; ~31 tests). The old mock route suites (`panel/src/app/routers/__test__/*` + `panel/test/harness/`) are DELETED; the new common integration is the canonical backend integration.
  - `cd daemon && npm test` — the two kept real-disk/process suites: `daemon/src/routers/__test__/Instance_router.integration.test.ts` (12, in-process real child/container lifecycle) + `daemon/src/routers/__test__/file_router.security.test.ts` (24, real disk). The old daemon mock route suites (`daemon/src/routers/__test__/*_router.test.ts`) + the `daemon/test/harness/smoke` smoke runner are DELETED; the `daemon/test/harness/{router,mocks}.ts` helper stays (used by the two kept suites).
  - `cd frontend && npm test` — vitest (jsdom env for DOM tests); run `npm run type-check` before tests when TS types change.
  - The all-in-one loop (common unit → daemon → panel → frontend → common integration) lives in the [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) skill.
- **Every module's suite is mandatory after touching that module (see §2).** `common/` is compiled directly into panel/daemon, so a `common/` change must be verified with **common + daemon + panel** (and common integration if behavior matters). Test files are **not** co-located with source: put them under a `__test__` subfolder of the directory they cover (`src/<dir>/__test__/*.test.ts`); node env by default, add `// @vitest-environment jsdom` for DOM tests.
- `common/src/__test__/system_storage.test.ts` must `process.chdir(tmpDir)` **before** importing the module — `DATA_PATH` is derived from `process.cwd()` at import time (module-level constant). Follow the same pattern in new tests touching `StorageSubsystem`. The same quirk underpins the kept daemon `Instance_router.integration.test.ts` (`threads: false` + `process.chdir` — see the `mcsmanager-docker-instance-test` skill).
- Windows: `fs.chmod` only toggles the read-only bit — POSIX mode assertions are meaningless there; gate such tests with `process.platform === "win32"` skips and assert mocked `fs.chmodSync` call arguments instead.

## 9. Feature Deep-Dives

- **Auto-update (panel & daemon self-update)**: read [`docs/auto-update.md`](docs/auto-update.md) before touching `**/upgrade_*`, `common/src/upgrade.ts`, `scripts/*update*`, or the update UI (`Settings.vue` / `NodeItem.vue`). It documents the architecture, manifest schema (incl. multi-language `notes`), design rationale, and the E2E test harnesses.
- **Production build & deploy**: read the project Agent Skill [`.agents/skills/mcsmanager-build/SKILL.md`](.agents/skills/mcsmanager-build/SKILL.md) before touching `build.bat` / `build.sh`, `prod-scripts/`, or deploying `production-code/`. It documents the `BUNDLE=1` bundling model, `daemon/lib` external binaries, runtime `data/` layout (incl. sensitive files & paired key migration), run/stop commands, and the post-deploy verification checklist. It lives in the in-repo, tool-neutral `.agents/skills/` directory (auto-discovered by opencode and other agent-compatible tools), so keywords such as build/compile trigger it automatically in supporting tools; a short summary lives in [`docs/build-production.md`](docs/build-production.md).
- **Running tests**: use the project Agent Skill [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) whenever the user asks to run tests or after changing code in any module. It documents the per-module vitest commands, the one-pass "run all four suites" loop, which suites a given change requires (notably common → common + daemon + panel), and the `common` cwd / frontend jsdom quirks.
- **Backend integration tests (real daemon + panel, `common/test/integration/`)** — the canonical backend integration layer: read [`common/test/integration/FINDINGS.html`](common/test/integration/FINDINGS.html) and the coverage note [`docs/integration-test-coverage-2026-09-30.md`](docs/integration-test-coverage-2026-09-30.md) before touching this suite. It boots a REAL daemon + panel (panel started with `--unsafe-integration-test-mode=<key>`) in an isolated tmp workspace (sibling `daemon/` + `panel/` dirs under one `mkdtemp`), then drives the full backend over REAL HTTP + socket.io (no mocks).
  - **Framework:** `common/test/integration/` — `lib/bootstrap.ts` spawns daemon, sleeps 5s (socket-stability), spawns panel with the `--unsafe` key; `lib/world.ts` is the shared singleton; `lib/{http,socket,files,util,process}.ts` are the helpers; `globalSetup.ts` calls `bootRuntime`/`stopRuntime` (one boot + teardown per vitest invocation); `vitest.config.ts` sets `root: common/`, 180s timeouts; `run.mjs` is the sequential runner.
  - **Suites (`common/test/integration/suites/`):** `_smoke` (framework proof, 2 `it`), `auth` (16), `user` (17), `instance` (9; market `quick_install`/reinstall deferred — network-bound ~52MB jar), `files` (11 + 1 skipped `download_from_url` deferred — network-bound), `streams` (9), `docker` (Linux + reachable dockerd only; `dockerIt = dockerOk ? it : it.skip` → off-Linux the 5 docker cases visibly **skip**; 1 always-run availability probe `it`). ≈65 `it` + 1 always-skipped + 5 docker-gated = 71 entries; on macOS dev box ≈65 passed / 6 skipped / 0 failed.
  - **Per-suite model:** each suite is a separate `vitest run` invocation; `globalSetup` boots a fresh daemon+panel on the default ports 23333/24444, with a fresh `daemon/data/`, its own admin/u1/u2 + instance created via the `--unsafe` key + real logins. **No state inherits across suites.**
  - **Sequential runner rationale:** vitest 0.33 **ignores** `singleFork` / `fileParallelism:false`, so multiple files in one invocation would race the shared panel/state. `run.mjs` instead invokes each suite file **one at a time** as its own vitest process with one shared `globalSetup` per file — sidestepping the parallelism bug. Do NOT collapse the suites into a single vitest invocation.
  - **Run:** `cd common && npm run test:integration` (stops at first failing suite; verbose reporter).
  - **Build prerequisite (load-bearing):** the runner requires pre-built `panel/production/app.js` + `daemon/production/app.js` (dev builds, no `BUNDLE=1`) + `daemon/lib/<pty|file_zip>_<os>_<arch>` + `panel/data/market_cache.json`; else `run.mjs` errors with the build commands. Convenience: `cd common && npm run test:integration:build` (builds common → panel → daemon then runs). After editing panel/daemon SOURCE, rebuild before re-running integration.
  - **The `--unsafe-integration-test-mode=<key>` boundary (load-bearing):** the key (passed as `x-request-api-key`) bypasses **only** `panel/src/app/middleware/permission.ts` (level/token/session/speedLimit). It does NOT bypass `preCheckMiddleware` (multipart uploads go daemon-direct via the `stream_channel`/mission passport) NOR the per-instance `router.use` gates (`instance_operate_router`/`filemananger_router`/…` read `ctx.session.uuid`, empty under the key → 403). Per-instance operations therefore use a REAL login (owner/admin cookie + `?token=`); the key alone is only for no-per-instance-gate admin routes (user/node/settings CRUD, market list).
  - **Docker auto-skip:** `docker.test.ts` self-skips per `it` on non-Linux / unreachable dockerd (`dockerOk ? it : it.skip`) so skipped cases show as SKIPPED (not silent passes). One always-running probe `it` records availability via `addFinding`. Linux+Docker CI: 5 docker cases actually run.
  - **Deferred (network-bound) cases:** market `quick_install` + `reinstall` (instance suite, ~52MB jar pull from `fill-data.papermc.io`) and `download_from_url` (files suite) are recorded as `addFinding` and explicitly `it.skip` — they exist for manual / CI-with-network runs, not the default dev-box run.
  - **Findings (design-level ambiguities, NOT product-code fixes):** collected at runtime by `addFinding` in `common/test/integration/FINDINGS.html` (the runner accumulates; this file is the static doc). 12 registered: `F-install-rejected-status`, `F-key-not-instance-admin`, `F-instance-admin-throw-500` (auth; the 500-vs-403 越权 inconsistency is cross-referenced from [`docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md`](docs/test-doubts/panel-instance_admin-perm-throw-vs-gate-403.md) — do NOT fix product code), `F-normal-quickinstall` (user), `F-quick-install-deferred`, `F-normal-cannot-change-startcmd` (instance — "good security"), `F-download-from-url-deferred`, `F-unzip-keeps-source-archive`, `F-compress-source-targets-swap` (files), `F-cmd-injection-inert` (streams — "good security"), `F-docker-availability`, `F-docker-startcmd-change-allowed` (docker). See FINDINGS.html for the live runtime accumulation.
- **Docker + instance integration tests (daemon + panel)**: any change to `daemon/src/routers/Instance_router.ts`, `daemon/src/entity/instance/instance.ts`, the `daemon/src/entity/commands/general/*` commands (general_start/command/stop/kill/restart), or the Docker service files (`daemon/src/service/docker_service.ts`, `docker_process_service.ts`, `takeover_container.ts`) **MUST** be verified with the project Agent Skill [`mcsmanager-docker-instance-test`](.agents/skills/mcsmanager-docker-instance-test/SKILL.md). The docker + instance real lifecycle is now covered in TWO places:
  1. **`common/test/integration/suites/{instance,docker}.test.ts`** (panel-driven, real spawned daemon+panel) — drives the full lifecycle THROUGH THE PANEL over HTTP + socket.io: `POST /api/instance` (processType `bash`/`docker` + config) → `/protected_instance/open` → `/protected_instance/command` → `/stop` → `/kill` → `/restart` → `DELETE /api/instance`, plus `POST/GET/DELETE /api/environment/image` for the image lifecycle. Fresh daemon+panel per suite (`globalSetup`), 9 instance `it` + 1 always-run docker probe + 5 docker `dockerIt` (= `it.skip` off-Linux). Uses the same interactive `test.mjs` fixture (copied to `common/test/integration/fixtures/test.mjs` from `daemon/test/fixtures/test.mjs`). Build prerequisite + `--unsafe` key boundary apply (see the "Backend integration tests" entry above). `threads:false` / `process.chdir` do NOT apply here — the suite spawns real OS processes, not in-process daemons.
  2. **`daemon/src/routers/__test__/Instance_router.integration.test.ts`** (in-process, daemon-only, low-level) — drives the daemon router directly by importing it in the test process: actually starts a `node:20-alpine` container running the interactive `daemon/test/fixtures/test.mjs` fixture (`node test.mjs`: create/start/command I/O/graceful stop/force kill/restart), a real `bash` process, and that fixture as a real child process (12 tests). `threads: false` + `process.chdir` quirk DO apply here (a `mkdtemp` workspace isolates `DATA_PATH`; `chdir` is unsupported in worker threads, so `daemon/vitest.config.ts` keeps `threads: false` — do not remove). `if (!dockerOk) return;` early-return for the docker cases when unreachable.
  Both suites keep the root/sudo Docker requirement, the `node:20-alpine` + `ping` + `node` prerequisites, and the cleanup verification (no leftover `mcsmanager.integration.uuid`-labelled containers). The five source files above carry a matching top-of-file MANDATORY TEST GATE comment — re-run BOTH suites (common integration for the panel-driven flow + the kept in-process suite for the daemon-side low-level flow) after editing them.
