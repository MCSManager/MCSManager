---
name: mcsmanager-docker-instance-test
description: Run the MCSManager Docker + instance lifecycle integration tests. MANDATORY after modifying daemon/src/routers/Instance_router.ts, daemon/src/entity/instance/instance.ts, daemon/src/entity/commands/general/* (general_start/command/stop/kill/restart), or any daemon/src/service/docker_* / takeover_container service file. Use when the user asks to run Docker/instance tests, or when those files change and their behavior must be verified against a real Docker daemon and real child processes. Covers BOTH the panel-driven common suite (common/test/integration/suites/{instance,docker}.test.ts — real spawned daemon+panel, visible-skip off-Linux) AND the kept in-process daemon suite (daemon/src/routers/__test__/Instance_router.integration.test.ts — root/sudo, node:20-alpine + test.mjs, threads:false / process.chdir quirk), the interactive `test.mjs` fixture used by both, run modes, and cleanup verification.
---

# MCSManager — Docker + Instance Integration Test Runner

The docker + instance real lifecycle is covered in **two** real-Docker / real-process suites that exist side by side after the 2026-09-30 test migration:

| Suite | Where | What it drives | Quirk |
| --- | --- | --- | --- |
| `common/test/integration/suites/{instance,docker}.test.ts` | common — panel-driven, real spawned daemon+panel (`globalSetup` boots fresh processes per suite) | The full lifecycle THROUGH THE PANEL over HTTP + socket.io: `POST /api/instance` (processType `bash`/`docker` + config) → `/protected_instance/open` → `/protected_instance/command` → `/stop` → `/kill` → `/restart` → `DELETE /api/instance`, plus `POST/GET/DELETE /api/environment/image` | `--unsafe` key boundary; build prerequisite; `threads:false` / `process.chdir` do NOT apply (real OS processes, not in-process) |
| `daemon/src/routers/__test__/Instance_router.integration.test.ts` | daemon — in-process, daemon-only low-level | Imports the daemon router in the test process and drives it directly. Actually starts a `node:20-alpine` container running `test/fixtures/test.mjs` (`node test.mjs`), a real `bash` process, and that fixture as a real child process | `threads: false` + `process.chdir` quirk apply (a `mkdtemp` workspace isolates `DATA_PATH`); `if (!dockerOk) return;` early-return off-Linux |

**Mandatory rule:** any change to `daemon/src/routers/Instance_router.ts`, `daemon/src/entity/instance/instance.ts`, the `general/*` start/command/stop/kill/restart commands, or the Docker service files (`docker_service.ts`, `docker_process_service.ts`, `takeover_container.ts`) MUST be verified with this skill before finishing. Those five source files carry a matching top-of-file MANDATORY TEST GATE comment — re-run BOTH suites after editing them. Report the result.

## 1. Prerequisites

- **Linux** for the docker cases (both suites). The common suite self-skips per `it` on non-Linux / unreachable dockerd (`dockerIt = dockerOk ? it : it.skip`); the in-process suite uses `if (!dockerOk) return;` early-return. The non-Docker / process / bash cases run on any OS.
- A reachable **Docker daemon**. The socket (`/var/run/docker.sock`) is usually `root:docker` — the docker cases need **root/sudo**. Non-root skips/early-returns (see §4).
- Image `node:20-alpine` (both suites pull it automatically if missing → needs network). Any image with `node` on its `PATH` works; the docker cases run the interactive fixture as `node test.mjs`.
- `ping` on the host for the in-process bash suite (`iputils-ping`)
- **`node` on `PATH`** for the process suites (their start command is literally `node test.mjs`; the fixture itself needs nothing but Node builtins).
- **The common suite has an extra build prerequisite:** pre-built `panel/production/app.js` + `daemon/production/app.js` (dev builds, no `BUNDLE=1`) + `daemon/lib/<pty|file_zip>_<os>_<arch>` + `panel/data/market_cache.json`. `cd common && npm run test:integration:build` provides it (builds common → panel → daemon then runs). See AGENTS.md §9.
- Never hardcode credentials in the repo. If `sudo` prompts, obtain the password out-of-band from the user.

## 2. Commands

### a) Common suite — panel-driven, fresh daemon+panel per suite (recommended first)

```bash
# from the repo root
# Build prerequisite applies; this rebuilds common → panel → daemon then runs all 6 suites:
cd common && npm run test:integration:build
# …or, if panel/daemon are already built:
cd common && npm run test:integration
```

`run.mjs` runs each suite file ONE AT A TIME (sequential runner — sidesteps vitest 0.33's ignored `singleFork` / `fileParallelism:false`). To run only the docker/instance suites:

```bash
cd common
node node_modules/vitest/vitest.mjs run --config test/integration/vitest.config.ts \
  test/integration/suites/instance.test.ts --reporter=verbose
node node_modules/vitest/vitest.mjs run --config test/integration/vitest.config.ts \
  test/integration/suites/docker.test.ts --reporter=verbose
```

### b) In-process suite — daemon-side low-level (root for docker)

Run from `daemon/`:

```bash
cd daemon

# b1) Docker suite ONLY, as root, verbose (the common case)
sudo env "PATH=$(dirname "$(command -v node)"):$PATH" \
  node node_modules/vitest/vitest.mjs run \
  src/routers/__test__/Instance_router.integration.test.ts \
  -t "Docker instance lifecycle" \
  --reporter=verbose

# b2) Full integration file (Docker + general + process), as root
sudo env "PATH=$(dirname "$(command -v node)"):$PATH" \
  node node_modules/vitest/vitest.mjs run src/routers/__test__/Instance_router.integration.test.ts

# b3) Interactive process suite only — any OS (Windows PowerShell included)
npx vitest run src/routers/__test__/Instance_router.integration.test.ts \
  -t "General process instance interactive" --reporter=verbose

# b4) Whole daemon suite (no root): docker case early-returns, the rest run
npm test
```

- `node` from nvm is NOT on `sudo`'s `PATH`; pass `PATH=$(dirname "$(command -v node)"):$PATH` (or use the absolute node path).
- `-t "Docker instance lifecycle"` selects only the Docker describe block; `-t "General process instance interactive"` selects only the process suite (the other blocks then show as skipped).

## 3. Expected result (all green)

### Common suite — `common/test/integration/suites/{instance,docker}.test.ts`

| Run | Expected |
| --- | --- |
| macOS dev box (no Docker) | `instance`: 9 passed. `docker`: 1 passed (availability probe) + 5 **skipped** (`dockerIt = it.skip`). Other suites unaffected. |
| Linux + root + reachable dockerd | `instance`: 9 passed. `docker`: 1 passed (probe) + 5 passed (docker cases run for real). |
| Either | First failing suite stops `run.mjs` (it short-circuits). |

### In-process suite — `daemon/src/routers/__test__/Instance_router.integration.test.ts` (12 tests)

| Run | Expected |
| --- | --- |
| Full file, Linux root | `12 passed (12)` |
| Full file, Linux non-root | `8 passed \| 4 skipped (12)` (Docker early-return) |
| Full file, Windows | `6 passed \| 6 skipped (12)` (Docker + bash early-return; process suite runs) |
| `-t "General process instance interactive"` | `6 passed \| 6 skipped (12)` on any OS |

- Full daemon suite (`cd daemon && npm test`): all test files green (~36 tests across the 2 kept files; docker early-skipped off-Linux).
- The process cases each spawn a real `node` child and include the instance engine's 2s start guard + up to 6s kill guard, so the suite needs ~30–60s. Do not lower the per-case timeouts (60–90s).

## 4. Verify the tests RAN (not silently skipped)

Both suites use skip / early-return patterns; an unavailable Docker daemon makes the docker cases **pass without exercising Docker**. Always confirm:

1. Run with `--reporter=verbose` and check the expected case names are present.
2. Docker: watch containers live during the run:
   ```bash
   watch -n1 'sudo docker ps -a --filter label=mcsmanager.integration.uuid'
   ```
   You should see short-lived `mcsm-int-docker-*` (in-process) / `MCSM-*` (common, panel-driven) containers appear and disappear (image `node:20-alpine`). After the run, ensure **no** leftover test containers — only pre-existing user containers may remain; never delete those.
3. Process suite: the run should take ~30–60s (each case really starts/stops a `node` child). While it runs, `test.mjs` heartbeats land in each instance workspace (`heartbeat.txt`, one per `proc-*` dir under the suite's temp dir) — the force-kill case asserts that file freezes when the process is killed. The temp dir is removed afterwards.
4. The common suite's `docker.test.ts` always emits the `F-docker-availability` finding via `addFinding`; check `common/test/integration/FINDINGS.html` for the recorded availability state.

## 5. Quirks

- **`threads: false`** is set in `daemon/vitest.config.ts` (in-process suite only). The in-process integration test calls `process.chdir()` to isolate `StorageSubsystem.DATA_PATH` (derived from `process.cwd()` at import time). `chdir` is unsupported inside vitest worker_threads, so worker threads must stay disabled for the in-process suite. Do not remove that setting — applies to the KEPT in-process suite ONLY. The common suite spawns real OS daemon/panel processes and is NOT subject to this quirk.
- The in-process test chdirs into a `mkdtemp` dir and removes it in `afterAll`; it must NOT touch the real `daemon/data`. The common suite uses `globalSetup` + a `mkdtemp` workspace (sibling `daemon/` + `panel/` dirs), torn down in `teardown`.
- The common suite uses **`--unsafe-integration-test-mode=<key>`** (the per-invocation key is passed as `x-request-api-key`). The key bypasses ONLY `panel/src/app/middleware/permission.ts`. It does NOT bypass `preCheckMiddleware` nor the per-instance `router.use` gates (those read `ctx.session.uuid`, empty under the key → 403). Per-instance operations use a REAL login (owner/admin cookie + `?token=`). The in-process suite does not need this key (the daemon router is imported directly).
- Peripheral modules with import-time timers (`log`, `disk_limit_service`, `upload_manager`, …) are mocked in the in-process suite. Everything on the real instance / command-dispatcher / Docker / process path stays unmocked. The common suite mocks nothing — it talks to the real spawned daemon + panel.
- The Docker container is started **before** the attach stream connects, so the fixture's one-shot `READY:<pid>` banner can be lost. Both suites therefore prove liveness out-of-band with the `heartbeat.txt` file and verify I/O with real `echo`/`sum` command round-trips after RUNNING.
- **Process fixture** `daemon/test/fixtures/test.mjs` is shared by both suites (the common suite copies it to `common/test/integration/fixtures/test.mjs`): each case copies it into the instance workspace and starts it with the literal `node test.mjs` (common docker case: workspace bind-mounted at `/data`, image `node:20-alpine`; common non-docker: real `bash`/`node`; in-process docker: same container layout; in-process non-docker: `terminalOption.pty: false`, pipes). It speaks a line protocol (`READY:`/`ECHO:`/`PID:`/`SUM:`/`SLEEPING:`/`SLEPT:`/`BYE`) and appends `heartbeat.txt` in its cwd every 200ms as an out-of-band liveness probe. Keep it dependency-free.
- **Instance engine timings** the cases must tolerate: `AbsStartCommand` sleeps 2s per start (dead-loop guard) and `GeneralKillCommand` protects instances younger than 6s before SIGKILL, so `kill` can fire several seconds after the request. `stopCommand: "exit"` + `stopTimeout: 5` make `stop` graceful-then-escalate.
- Gateway probes like `nodeOk`/`dockerOk` must be read **inside** the test bodies (at run time, after `beforeAll`) for the in-process suite, OR bound at module top-level for the common suite (`dockerIt = dockerOk ? it : it.skip` is a top-level const — that is intentional and works because the common suite is a fresh vitest process per file, not a worker thread). Binding a per-`describe` probe into a `const` at collect time silently skips everything in the in-process suite.
- Running as root creates root-owned files under the git-ignored `daemon/logs/`; clean them up afterwards if desired. The common suite's logs are preserved to `common/test/integration/.last-run/{daemon.log,panel.log,info.json}` after each run.

## 6. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `run.mjs` errors with "Build prerequisite missing" | Common suite needs pre-built `panel/production/app.js` + `daemon/production/app.js` + `daemon/lib/*` + `panel/data/market_cache.json`. Use `cd common && npm run test:integration:build`. |
| Docker tests "pass" instantly as non-root | No socket access → early return / `it.skip`. Re-run the in-process suite with `sudo` (§2 b1). The common suite stays visibly SKIPPED off-Linux by design. |
| Process cases "pass" instantly / 0s duration | `nodeOk` false (`node` not on `PATH`) or the in-process gate was bound at collect time — see §5. Re-run verbose; cases must take ~30–60s total. |
| `process.chdir() is not supported in workers` | `threads: false` removed from `daemon/vitest.config.ts`; restore it (in-process suite only). |
| `Cannot connect to the Docker daemon` | Daemon down, or socket not reachable as this user; use root. |
| Timeout waiting for output | Docker: no `ECHO:`/`SUM:`/`BYE` came back — check `node` exists in the container image and `test.mjs` was copied into the bind-mounted workspace (`/data`). Process: `READY:` never arrived — check `node` runs `test.mjs` in the instance cwd. |
| `image ... not found` / slow first run | First run pulls `node:20-alpine`; check network/registry access. |
| Bash suite fails on `ping` | `iputils-ping` missing or no ICMP route; install it / pick another reachable IP. |
| Force-kill case times out | The 6s startup guard delays SIGKILL; keep the 90s timeout and do not start asserting too early. |
| `heartbeat.txt` missing in a process case | Fixture not copied (see the suite's instance setup) or the instance cwd differs from the expectation. |
| Common suite leaves a `mcsm-it-*` tmp dir | A prior run crashed before `teardown`. `common/test/integration/.last-run/` keeps the logs; `mkdtemp` dirs under `$TMPDIR` may need a manual cleanup. |

## 7. Reference

- Common integration suite (panel-driven, real spawned daemon+panel):
  - `common/test/integration/suites/instance.test.ts` (9 `it`)
  - `common/test/integration/suites/docker.test.ts` (1 probe `it` + 5 `dockerIt`)
  - `common/test/integration/{lib/*, globalSetup.ts, vitest.config.ts, run.mjs}`
  - Fixture: `common/test/integration/fixtures/test.mjs` (copied from `daemon/test/fixtures/test.mjs`)
  - Findings: `common/test/integration/FINDINGS.html` (runtime `addFinding` accumulation)
- Kept in-process suite (daemon-side low-level):
  - `daemon/src/routers/__test__/Instance_router.integration.test.ts` (12 tests)
  - `daemon/src/routers/__test__/file_router.security.test.ts` (24 tests, real disk)
  - Helpers: `daemon/test/harness/{router.ts, mocks.ts}`
  - Interactive process fixture: `daemon/test/fixtures/test.mjs`
