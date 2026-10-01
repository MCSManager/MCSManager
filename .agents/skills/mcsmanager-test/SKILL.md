---
name: mcsmanager-test
description: Run the MCSManager test suites. Use when the user asks to run tests (e.g. "run tests", "run all tests", "run the test suite") or whenever code in any module (common, daemon, panel, frontend) has been changed and must be verified. Covers the per-module vitest commands (incl. the common real-process integration runner), running all suites in one pass, and the common/frontend environment quirks.
---

# MCSManager Test Runner

All four subprojects use **vitest** (`vitest run`). There is no root test script — invoke each package (or loop over them). The backend (`common`) has TWO layers: a pure unit suite (`npm test`) and a real-process integration suite (`npm run test:integration`) that boots an actual daemon + panel.

**Mandatory rule:** after changing code in a module, run that module's test suite before finishing. `common/` is aliased as source into both `panel` and `daemon`, so a `common/` change requires running **common + daemon + panel** (see §3). If the change affects panel/daemon runtime behavior visible over HTTP, also run the common integration suite (`npm run test:integration`, see §4).

## 1. Run all suites in one pass

From the repository root (stops at the first failing suite). The loop runs the pure unit / kept suites first, then the common integration suite last (it is the slowest, and is a separate step):

```bash
# 1) pure unit + kept suites (fast)
for d in common daemon panel frontend; do
  echo "=== $d ==="
  (cd "$d" && npm test) || exit 1
done
# 2) common integration (real daemon + panel; build prerequisite applies — see §4)
echo "=== common (integration) ==="
(cd common && npm run test:integration) || exit 1
```

Expected current totals (post-migration, 2026-09-30):

| Step                              | Module      | Command                              | Expected                                       |
| --------------------------------- | ----------- | ------------------------------------ | ---------------------------------------------- |
| Pure unit                         | `common`    | `npm test`                           | 9 passed                                       |
| Pure unit (kept)                  | `panel`     | `npm test`                           | ~31 passed (login_ban 23 + integration_test_mode 8) |
| Real-disk/process (kept)          | `daemon`    | `npm test`                           | ~36 — `Instance_router.integration` 12 + `file_router.security` 24 (docker early-skipped off-Linux, so fewer passed on non-Linux) |
| Pure unit (jsdom)                 | `frontend`  | `npm test`                           | 41 passed                                      |
| Real-process integration (6 suites) | `common`  | `npm run test:integration`           | ≈65 passed / 6 skipped on macOS; ≈70 / 1 skipped on Linux+Docker (see §4) |

The old mock route suites (`panel/src/app/routers/__test__/*`, `daemon/src/routers/__test__/*_router.test.ts` mocks, `panel/test/integration/`, `panel/test/harness/`, `daemon/test/harness/smoke`) are DELETED; the new `common/test/integration/` is the canonical backend integration layer and the two kept daemon suites are its daemon-side low-level complement.

## 2. Per-module commands

| Module     | Command (run inside the module dir)    | Notes                                                                                                          |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `common`   | `npm test`                              | vitest, 9 pure unit tests (`system_storage` 6 + `upgrade` 3); see §4 cwd quirk                                  |
| `common`   | `npm run test:integration`             | vitest real-process integration: 6 suites (`auth/user/instance/files/streams/docker`) + `_smoke` proof. Build prerequisite + sequential runner; see §4 |
| `common`   | `npm run test:integration:build`       | Convenience: builds common → panel → daemon then runs `npm run test:integration`                                |
| `daemon`   | `npm test`                              | vitest, the 2 kept real-disk/process suites (`Instance_router.integration` 12 + `file_router.security` 24). `threads:false` + `process.chdir` quirk applies — see the `mcsmanager-docker-instance-test` skill |
| `panel`    | `npm test`                              | vitest, the kept pure unit tests (`login_ban` 23 + `integration_test_mode` 8)                                  |
| `frontend` | `npm test`                              | vitest (jsdom); run `npm run type-check` first when TS types changed (§5)                                     |

## 3. Which suite(s) to run for a change

- `common/` change → **common + daemon + panel** (both apps compile `common/src` directly) and, if UI types are affected, frontend. If the `common/` change affects panel/daemon runtime behavior over HTTP, also run `cd common && npm run test:integration`.
- `panel/` change → panel; if it affects panel HTTP/socket behavior, also run `cd common && npm run test:integration`.
- `daemon/` change → daemon; if it affects `daemon/src/routers/Instance_router.ts`, `daemon/src/entity/instance/instance.ts`, the `daemon/src/entity/commands/general/*` commands, or the Docker service files, also run BOTH `cd common && npm run test:integration` AND the `mcsmanager-docker-instance-test` skill (see the `mcsmanager-docker-instance-test` skill for the in-process low-level suite).
- `frontend/` change → frontend (`type-check` → `lib`/`npm test`).
- Root-level config / `languages/` → run all four.
- Unsure → run all four (§1) plus the common integration step.

## 4. Common integration suite (`common/test/integration/`)

The canonical backend integration layer. Boots a REAL daemon + panel (panel started with `--unsafe-integration-test-mode=<key>`) in an isolated tmp workspace, then drives the backend over REAL HTTP + socket.io (no mocks).

- **Run:** `cd common && npm run test:integration` → runs `common/test/integration/run.mjs`, which invokes each suite file ONE AT A TIME (`vitest run --config test/integration/vitest.config.ts suites/<name>.test.ts`). Each suite's `globalSetup` boots a fresh daemon+panel on the default ports 23333/24444 then tears them down. Sequential runner → sidesteps vitest 0.33's ignored `singleFork` / `fileParallelism:false` parallelism bug (multiple files in one invocation would race the shared ports/state). Do NOT collapse the suites into one vitest invocation.
- **Build prerequisite (load-bearing):** the runner requires pre-built `panel/production/app.js` + `daemon/production/app.js` (dev builds, no `BUNDLE=1`) + `daemon/lib/<pty|file_zip>_<os>_<arch>` + `panel/data/market_cache.json`; else `run.mjs` errors with the build commands. Convenience: `cd common && npm run test:integration:build` (builds common → panel → daemon then runs). After editing panel/daemon SOURCE, rebuild before re-running integration.
- **Suites (`common/test/integration/suites/`) — `it` counts:** `_smoke` 2, `auth` 16, `user` 17, `instance` 9, `files` 11 (+1 `it.skip` `download_from_url` deferred — network-bound), `streams` 9, `docker` 1 always-run probe + 5 `dockerIt` (= `it.skip` off-Linux). ≈65 `it` + 1 always-skipped + 5 docker-gated = 71 entries.
- **The `--unsafe-integration-test-mode=<key>` boundary:** the key (passed as `x-request-api-key`) bypasses ONLY `panel/src/app/middleware/permission.ts` (level/token/session/speedLimit). It does NOT bypass `preCheckMiddleware` (multipart uploads go daemon-direct via the `stream_channel`/mission passport) NOR the per-instance `router.use` gates (`instance_operate_router`/`filemananger_router`/…` read `ctx.session.uuid`, empty under the key → 403). Per-instance operations therefore use a REAL login (owner/admin cookie + `?token=`).
- **Docker auto-skip:** `docker.test.ts` self-skips per `it` on non-Linux / unreachable dockerd (`dockerOk ? it : it.skip`); skipped cases show as SKIPPED (not silent passes).
- **Findings:** design-level ambiguities are collected at runtime by `addFinding` into `common/test/integration/FINDINGS.html` (NOT product-code fixes). See AGENTS.md §9 "Backend integration tests" and `docs/integration-test-coverage-2026-09-30.md` for the full list.

## 5. Quirks

- **`common/src/__test__/system_storage.test.ts`** must `process.chdir(tmpDir)` **before** importing the module — `DATA_PATH` is derived from `process.cwd()` at import time. Follow the same pattern in new tests touching `StorageSubsystem`. The kept daemon `Instance_router.integration.test.ts` uses the same pattern (`threads: false` + `process.chdir` — see the `mcsmanager-docker-instance-test` skill).
- Tests use node env by default; add `// @vitest-environment jsdom` for DOM tests (frontend).
- Windows: `fs.chmod` only toggles the read-only bit — gate POSIX-mode assertions with `process.platform === "win32"` skips and assert mocked `fs.chmodSync` arguments instead.

## 6. Related checks (not tests, but required before finishing)

- `frontend`: `npm run type-check` (vue-tsc) before `npm test` / `npm run lint` when touching TS types; `npm run lint` (eslint `--fix`).
- `panel` / `daemon`: webpack `npm run build` is the type check (no separate lint). The common integration runner needs these builds as a prerequisite.
- `common`: `npm run build` (tsc → `dist/`).
