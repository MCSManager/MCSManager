---
description: Core project rules for all AI assistants (Claude, Cursor, etc.)
---

**BEFORE YOU MAKE ANY CHANGES TO THIS PROJECT'S CODE, YOU MUST READ THIS ARTICLE!!!**

## 1. Core Feature Description

This project, "MCSManager", is a web management panel for Minecraft and Steam game server programs, released on GitHub. It is made up of three subprojects: a web frontend, a web backend, and a Daemon. It supports a distributed deployment architecture and offers features such as multi-user support, file management, environment management, and Docker management.

All features of the project revolve around **instances** (`daemon\src\entity\instance\instance.ts`) and **users**. The project has exactly two roles, each with a different set of permissions (`panel\src\app\entity\user.ts`):

### Role Summary

- **Administrator**: Full control: create instances, configure instances, create users, assign instances, highest authority over the entire panel.
- **Regular user**: Limited permissions: **can only operate the instances assigned to them by an administrator**, without exceeding the scope the administrator permits, and Regular users must be prohibited from executing arbitrary commands on the host machine by any means, and the file management module must also be prohibited from accessing files outside the instance working directory without authorization.

### Core features mapped to permissions

| ADMINISTRATOR | REGULAR USER | CAPABILITY                                                                                  |
| ------------- | ------------ | ------------------------------------------------------------------------------------------- |
| Yes           | No           | Full management, deletion, and creation of instances (based on templates / Docker images)   |
| Yes           | No           | Configure instances (startup command, update command, advanced containerization parameters) |
| Yes           | No           | Regular user management, assigning instances to users                                       |
| Yes           | Yes          | Instance operations: start, stop, restart, update, instance terminal, send commands         |
| Yes           | Yes          | File management: upload, download, delete, decompress, move, edit                           |
| Yes           | Yes          | Config file updates: Minecraft, Steam and other game server configs, install Mods/Plugins   |

> Note: A server can run either inside a Docker container or directly as a process, and its terminal can be accessed through the web page; a regular user's instance operations above are limited to the instances assigned to them, and must not exceed the scope the administrator permits (ensured through means such as Docker containers and file permission checks).

Therefore, when you modify a feature or implement a requirement, **you must think carefully from a security standpoint to ensure that the new change does not introduce security or performance issues**.

## 2. Project Layout

- **`panel/`** — Web backend (Koa): users, nodes, auth, API. Entry `panel/src/app.ts`, webpack → `production/app.js`.
- **`daemon/`** — Node worker: instance processes, containers, files, terminal. Entry `daemon/src/app.ts`.
- **`frontend/`** — Vue 3 + Vite UI. Talks to panel; some features talk directly to daemon to reduce load.
- **`common/`** — Shared library published as `mcsmanager-common`. panel/daemon alias it to **source** (`common/src/index.ts`) via tsconfig `paths` + webpack `resolve.alias`, so edits are compiled directly into both apps — no publish step needed, but each app must be rebuilt to pick up changes.
- **`languages/`** — Root-level i18n JSON shared by all three subprojects (`@languages` alias). Filenames use capital region (`en_US.json`); runtime locale codes are lowercase (`en_us`) — don't mix them up.

## 3. OpenSpec Development Workflow (MANDATORY)

All non-trivial development in this repo goes through **OpenSpec** (spec-driven development). Workflow skills live in `.agents/skills/openspec-*` (tool-neutral, shared by all AI tools); artifacts live in `openspec/` (`config.yaml`, `specs/`, `changes/`). **If any generic process skill (brainstorming, planning, TDD kickoff, etc.) conflicts with this section, this section wins.**

**Must follow OpenSpec** (propose → implement → archive):

- New features or behavior changes (any module)
- Cross-module or external interface changes (APIs, instance configs, data formats, node/panel protocols)
- Changes that restructure how components fit together

**Exempt** (plain implementation is fine):

- Bug fixes that do not change behavior contracts
- Pure refactors with no behavior change
- Test-only or doc-only edits, dependency bumps, small single-file patches

**Flow:**

1. Not sure what to build yet? Start with the [`openspec-explore`](.agents/skills/openspec-explore/SKILL.md) skill to weigh options before committing.
2. [`openspec-propose`](.agents/skills/openspec-propose/SKILL.md) `<change-id>` — creates `openspec/changes/<change-id>/` (proposal.md, specs/, design.md, tasks.md).
3. Human reviews the artifacts **before any code is written**; revise via [`openspec-update-change`](.agents/skills/openspec-update-change/SKILL.md) if needed.
4. [`openspec-apply-change`](.agents/skills/openspec-apply-change/SKILL.md) — implement the tasks. Every task ends with its relevant test suite (§4, §10); the §10 testing gate still applies and must pass before a task is marked complete.
5. [`openspec-archive-change`](.agents/skills/openspec-archive-change/SKILL.md) — move the change to `openspec/changes/archive/` and sync spec deltas into `openspec/specs/` ([`openspec-sync-specs`](.agents/skills/openspec-sync-specs/SKILL.md)).

Durable project knowledge stays in this file and `docs/`; `openspec/config.yaml` carries only concise constraints for artifact generation. After a CLI upgrade run `openspec update` in the repo root to refresh the generated skills.

## 4. Commands

- Setup: `./install-dependents.sh` (or `.bat`) — installs all packages and builds `common` (root `npm run preview-build` = build common despite the name). Node.js 16+ (CI runs 16.x/20.x).
- Dev: `npm run dev` (all three concurrently) or `npm run panel` / `npm run daemon` / `npm run frontend` (each = nodemon → `npm run build` → run `production/app.js`).
- Build per package: `cd panel|daemon && npm run build` (webpack + ts-loader); `cd frontend && npm run build` (`type-check` + vite); `cd common && npm run build` (tsc → `dist/`).
- **Verification before finishing** — **MANDATORY: after changing code in _any_ module you MUST run the relevant test suite(s) and report the result before finishing. Never claim a change is done without running its tests.** `common`, `daemon`, `panel`, `frontend` all have vitest suites (`cd <module> && npm test`); a `common/` change requires running common + daemon + panel because both apps alias `common/src` directly (see the `mcsmanager-test` skill). Run **all** suites with the one-pass loop in the [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) skill. Frontend also: `npm run type-check`, `npm run lint` (eslint `--fix`) — run type-check before lint/test when touching TS types; panel/daemon webpack `npm run build` is their type check.
- Release package: `./build.sh` / `build.bat` → `production-code/` (`BUNDLE=1` inlines all deps + language packs into a single self-contained `app.js`). Platform binaries (`daemon/lib` PTY / Zip-Tools, see `lib-urls.txt`) are NOT bundled — required at runtime for terminal & compression, see DEVELOPMENT.md. Full build & deploy guide: the project Agent Skill [`mcsmanager-build`](.agents/skills/mcsmanager-build/SKILL.md) (in-repo, tool-neutral `.agents/skills/`, shared by all AI tools; short summary in [`docs/build-production.md`](docs/build-production.md)).
- i18n tooling: `npm run i18n`, `npm run sort-lang-keys`, `npm run scan-useless-key` (see §6).
- Prettier: `printWidth: 100`, `trailingComma: "none"`.

## 5. Persistence

- All JSON data models persist through `StorageSubsystem` (`common/src/system_storage.ts`): atomic tmp-file + rename into `data/<Category>/<uuid>.json`. Do not hand-roll `fs.writeFile` for config/data storage.
- Panel side: use `Storage.getStorage().store(...)` (`panel/src/app/common/storage/sys_storage.ts`) — it transparently swaps to Redis when `redisUrl` is configured. Daemon uses the `StorageSubsystem` singleton directly.
- Sensitive files (never log their contents): `daemon/data/Config/global.json` (panel↔daemon key), `panel/data/User/*.json` (apiKey, password hash, 2FA secret), `panel/data/RemoteServiceConfig/*.json` (node apiKey).

## 6. General Coding Rules

- **Minimal changes**: prefer small, focused edits. Before adding new logic, check existing `hooks`, `services`, `stores`, `utils` in the relevant subproject and reuse when possible.
- **Code & comments in English**; user-facing text goes through i18n (backend logs excepted).
- Aim for high cohesion, low coupling, reusable code.

## 7. i18n Conventions

- **Frontend (Vue)**: `t()` from `@/lang/i18n` (vue-i18n). **Backend/daemon**: `$t()` from `panel/src/app/i18n` / `daemon/src/i18n` (i18next).
- Keys use the `TXT_CODE_` prefix. Two styles coexist: manual descriptive keys (`TXT_CODE_system_instance.autoStart`) and auto-generated `TXT_CODE_<crc32hex>` keys.
- Source strings: short, correct English in `languages/en_US.json`; other locales are translations.

### 7.1 Parameterized strings — DIFFERENT placeholder syntax

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

### 7.2 `npm run i18n` rewrites source files

`i18next-scanner` (`i18-scanner.config.js`) finds literal strings in `t()`/`$t()` calls and **rewrites the source file in place**, replacing the literal with a generated `TXT_CODE_<crc32>` key, then writes `languages/zh_CN.json` + `en_US.json` only (other locales are maintained separately, e.g. `scripts/auto-translate.mjs`). Run it deliberately; review the diff it produces in `src/`.

## 8. Backend Conventions (`daemon/src/**`, `panel/src/app/**`)

- Folder names express layers (routes, middleware, services, instances, …) — put new code in the right layer.
- Use the project **logger**, not raw `console.*`; pick severity by context.
- External resources (files, network, containers, shell): validate inputs/boundaries first; on failure log and rethrow or return a typed result — never silently swallow.
- Security: strictly parse/validate container & command config (length, format, allowed values); never pass unvalidated frontend input into shell args or path operations.
- Long-lived structures (Map, queues, buffers, streams) need corresponding cleanup — avoid unbounded growth.

## 9. Frontend Conventions (`frontend/src/**/*.vue`)

- Vue 3 `<script setup lang="ts">`; prefer `const` with explicit types.
- Extract complex logic into `hooks/` (composables) grouped by responsibility; extract complex template blocks into components.
- One-way data flow: props down, events up — never mutate parent state directly.

## 10. Testing & Build Conventions

- **Test-Driven Development mindset**: every module has a vitest suite; the backend has **two** layers — pure unit tests + a real-process integration runner.
- **Testing gate**: after completing any new requirement or feature change, you **MUST use** the [`mcsmanager-test`](.agents/skills/mcsmanager-test/SKILL.md) skill, or manually run `npm run test` and `npm run test:integration`, to perform a full test check. This testing convention is mandatory.
- **Production build & deploy**: before touching `build.bat` / `build.sh`, `prod-scripts/`, or deploying `production-code/`, first read the project Agent Skill [`.agents/skills/mcsmanager-build/SKILL.md`](.agents/skills/mcsmanager-build/SKILL.md). It documents the `BUNDLE=1` bundling model, `daemon/lib` external binaries, the runtime `data/` layout (incl. sensitive files & paired key migration), run/stop commands, and the post-deploy verification checklist. It lives in the in-repo, tool-neutral `.agents/skills/` directory (auto-discovered by opencode and other agent-compatible tools), so keywords such as build/compile trigger it automatically in supporting tools; a short summary lives in [`docs/build-production.md`](docs/build-production.md).
- **Backend integration tests (real daemon + panel, `common/test/integration/`)** — the canonical backend integration layer; **see [`docs/integration-test-framework.md`](docs/integration-test-framework.md) for the API + usage reference** — read it before touching this suite. It boots a REAL daemon + panel (panel started with `--unsafe-integration-test-mode=<key>`), then drives the full backend over REAL HTTP + socket.io in an isolated `mkdtemp` workspace — no mocks.
