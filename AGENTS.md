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
- **Verification before finishing** — **MANDATORY: after changing code in *any* module you MUST run the relevant test suite(s) and report the result before finishing. Never claim a change is done without running its tests.** `common`, `daemon`, `panel`, `frontend` all have vitest suites (`cd <module> && npm test`); a `common/` change requires running common + daemon + panel because both apps alias `common/src` directly (see §8). Run **all** suites with the one-pass loop in the [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) skill. Frontend also: `npm run type-check`, `npm run lint` (eslint `--fix`) — run type-check before lint/test when touching TS types; panel/daemon webpack `npm run build` is their type check.
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

- **Every module has a vitest suite: `cd common|daemon|panel|frontend && npm test`. Running the relevant suite after any code change is mandatory (see §2).** `common/` is compiled directly into panel/daemon, so a `common/` change must be verified with common + daemon + panel. Files are `src/**/*.test.ts`; node env by default, add `// @vitest-environment jsdom` for DOM tests. The all-in-one command lives in the [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) skill.
- `common/src/system_storage.test.ts` must `process.chdir(tmpDir)` **before** importing the module — `DATA_PATH` is derived from `process.cwd()` at import time (module-level constant). Follow the same pattern in new tests touching `StorageSubsystem`.
- Windows: `fs.chmod` only toggles the read-only bit — POSIX mode assertions are meaningless there; gate such tests with `process.platform === "win32"` skips and assert mocked `fs.chmodSync` call arguments instead.

## 9. Feature Deep-Dives

- **Auto-update (panel & daemon self-update)**: read [`docs/auto-update.md`](docs/auto-update.md) before touching `**/upgrade_*`, `common/src/upgrade.ts`, `scripts/*update*`, or the update UI (`Settings.vue` / `NodeItem.vue`). It documents the architecture, manifest schema (incl. multi-language `notes`), design rationale, and the E2E test harnesses.
- **Production build & deploy**: read the project Agent Skill [`.agents/skills/mcsmanager-build/SKILL.md`](.agents/skills/mcsmanager-build/SKILL.md) before touching `build.bat` / `build.sh`, `prod-scripts/`, or deploying `production-code/`. It documents the `BUNDLE=1` bundling model, `daemon/lib` external binaries, runtime `data/` layout (incl. sensitive files & paired key migration), run/stop commands, and the post-deploy verification checklist. It lives in the in-repo, tool-neutral `.agents/skills/` directory (auto-discovered by opencode and other agent-compatible tools), so keywords such as build/compile trigger it automatically in supporting tools; a short summary lives in [`docs/build-production.md`](docs/build-production.md).
- **Running tests**: use the project Agent Skill [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) whenever the user asks to run tests or after changing code in any module. It documents the per-module vitest commands, the one-pass "run all four suites" loop, which suites a given change requires (notably common → common + daemon + panel), and the `common` cwd / frontend jsdom quirks.
- **Docker + instance integration tests (daemon)**: any change to `daemon/src/routers/Instance_router.ts`, `daemon/src/entity/instance/instance.ts`, the `daemon/src/entity/commands/general/*` commands (general_start/command/stop/kill/restart), or the Docker service files (`daemon/src/service/docker_service.ts`, `docker_process_service.ts`, `takeover_container.ts`) **MUST** be verified with the project Agent Skill [`mcsmanager-docker-instance-test`](.agents/skills/mcsmanager-docker-instance-test/SKILL.md). It runs the real (`Instance_router.integration.test.ts`) suite — actually starting an `alpine` container, a real `bash` process, and the interactive `daemon/test/fixtures/test.mjs` child process (`node test.mjs`: create/start/command I/O/graceful stop/force kill/restart) — and documents the root/sudo Docker requirement, image/`ping`/`node` prerequisites, run modes, cleanup verification, and the `threads: false` / `process.chdir` quirk. Those source files carry a matching top-of-file MANDATORY TEST GATE comment.
