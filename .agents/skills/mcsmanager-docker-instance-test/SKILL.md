---
name: mcsmanager-docker-instance-test
description: Run the MCSManager Docker + instance lifecycle integration tests (daemon). MANDATORY after modifying daemon/src/routers/Instance_router.ts, daemon/src/entity/instance/instance.ts, daemon/src/entity/commands/general/* (general_start/command/stop/kill/restart), or any daemon/src/service/docker_* / takeover_container service file. Use when the user asks to run Docker/instance tests, or when those files change and their behavior must be verified against a real Docker daemon and real child processes. Covers the Docker suite (root/sudo), the interactive `test.mjs` fixture used by both the Docker and non-Docker process suites (`node test.mjs`, cross-platform), root vs non-root run modes, node image/ping/node prerequisites, cleanup verification, and the vitest threads:false / process.chdir quirk.
---

# MCSManager — Docker + Instance Integration Test Runner

Real (non-mocked) lifecycle tests live in
`daemon/src/routers/__test__/Instance_router.integration.test.ts`:

| Suite | Tests | What it does for real |
| --- | --- | --- |
| `Docker instance lifecycle (real)` | 4 | starts a `node:20-alpine` container running the same interactive fixture `test/fixtures/test.mjs` (`node test.mjs`, workspace bind-mounted at `/data`), checks RUNNING + stdin/stdout command round-trips (`echo`/`sum`), then `kill` / `stop` (BYE) / `delete` and container removal |
| `General (non-Docker) instance lifecycle (real)` | 2 | starts a real `bash` process, sends a `ping` command, asserts captured output (POSIX only) |
| `General process instance interactive lifecycle (real)` | 6 | runs the interactive fixture `test/fixtures/test.mjs` as `node test.mjs`: creation via `instance/new` + config persistence, startup output (`READY:<pid>`), stdin/stdout command round-trips (`echo`/`pid`/`sum`), graceful stop (`stopCommand: exit`), force kill (interrupts a busy `sleep`), restart (new pid + fresh banner) and `delete` — **cross-platform, Windows included** |

**Mandatory rule:** any change to `Instance_router.ts`, `instance.ts`, the general
start/command/stop/kill/restart commands, or the Docker service files MUST be
verified with this skill before finishing. Report the result.

## 1. Prerequisites

- **Linux** for the Docker suite (it only runs on `process.platform === "linux"`) and for the `bash`/`ping` suite (skipped on Windows). The **interactive process suite runs on any OS**, Windows included.
- A reachable **Docker daemon**. The Docker socket (`/var/run/docker.sock`) is usually `root:docker` — so the Docker suite needs **root/sudo**. Non-root runs silently return early (see §4).
- Image `node:20-alpine` (the test pulls it automatically if missing → needs network). Any image with `node` on its `PATH` works; the Docker cases run the interactive fixture as `node test.mjs`.
- `ping` on the host for the bash suite (`iputils-ping`; the test also needs a route to a public IP).
- **`node` on `PATH`** for the process suite (its start command is literally `node test.mjs`; the fixture itself needs nothing but Node builtins).
- Never hardcode credentials in the repo. If `sudo` prompts, obtain the password out-of-band from the user.

## 2. Commands

Run from `daemon/`:

```bash
cd daemon

# a) Docker suite ONLY, as root, verbose (the common case)
sudo env "PATH=$(dirname "$(command -v node)"):$PATH" \
  node node_modules/vitest/vitest.mjs run \
  src/routers/__test__/Instance_router.integration.test.ts \
  -t "Docker instance lifecycle" \
  --reporter=verbose

# b) Full integration file (Docker + general + process), as root
sudo env "PATH=$(dirname "$(command -v node)"):$PATH" \
  node node_modules/vitest/vitest.mjs run src/routers/__test__/Instance_router.integration.test.ts

# c) Interactive process suite only — any OS (Windows PowerShell included)
npx vitest run src/routers/__test__/Instance_router.integration.test.ts \
  -t "General process instance interactive" --reporter=verbose

# d) Whole daemon suite (no root): Docker tests return early, the rest run
npm test
```

- `node` from nvm is NOT on `sudo`'s `PATH`; pass `PATH=$(dirname "$(command -v node)"):$PATH` as above (or use the absolute node path).
- `-t "Docker instance lifecycle"` selects only the Docker describe block; `-t "General process instance interactive"` selects only the process suite (the other blocks then show as skipped).

## 3. Expected result (all green)

The integration file contains **12 tests**. Depending on platform and privileges:

| Run | Expected |
| --- | --- |
| Full file, Linux root | `12 passed (12)` |
| Full file, Linux non-root | `8 passed \| 4 skipped (12)` (Docker early-return) |
| Full file, Windows | `6 passed \| 6 skipped (12)` (Docker + bash early-return; process suite runs) |
| `-t "General process instance interactive"` | `6 passed \| 6 skipped (12)` on any OS |

- Full daemon suite (`npm test`): all test files green (count grows over time — trust the run output).
- The process cases each spawn a real `node` child and include the instance engine's 2s start guard + up to 6s kill guard, so the suite needs ~30–60s. Do not lower the per-case timeouts (60–90s).

## 4. Verify the tests RAN (not silently skipped)

The suites use `if (!dockerOk) return;` / `if (!nodeOk) return;` patterns, so an
unavailable Docker daemon makes the Docker cases **pass without exercising
Docker**. Always confirm:

1. Run with `--reporter=verbose` and check the expected case names are present.
2. Docker: watch containers live during the run:

   ```bash
   watch -n1 'sudo docker ps -a --filter label=mcsmanager.instance.uuid'
   ```

   You should see short-lived `mcsm-int-docker-*` (`node:20-alpine`) containers appear and disappear. After the run, ensure **no** leftover test containers — only pre-existing user containers (e.g. `MCSM-*`) may remain; never delete those.
3. Process suite: the run should take ~30–60s (each case really starts/stops a `node` child). While it runs, `test.mjs` heartbeats land in each instance workspace (`heartbeat.txt`, one per `proc-*` dir under the suite's temp dir) — the force-kill case asserts that file freezes when the process is killed. The temp dir is removed afterwards.

## 5. Quirks

- **`threads: false`** is set in `daemon/vitest.config.ts`. The integration test calls
  `process.chdir()` to isolate `StorageSubsystem.DATA_PATH` (derived from `process.cwd()`
  at import time). `chdir` is unsupported inside vitest worker_threads, so worker threads
  must stay disabled. Do not remove that setting.
- The test chdirs into a `mkdtemp` dir and removes it in `afterAll`; it must NOT touch the
  real `daemon/data`.
- Peripheral modules with import-time timers (`log`, `disk_limit_service`, `upload_manager`,
  …) are mocked. Everything on the real instance / command-dispatcher / Docker / process
  path stays unmocked.
- The Docker container is started **before** the attach stream connects, so the fixture's one-shot
  `READY:<pid>` banner can be lost. The Docker cases therefore prove liveness out-of-band with the
  `heartbeat.txt` file and verify I/O with real `echo`/`sum` command round-trips after RUNNING.
- **Process fixture** `daemon/test/fixtures/test.mjs` is reused by both the Docker suite and the
  non-Docker process suite: it is copied into each instance workspace and started with the literal
  start command `node test.mjs` (Docker: workspace bind-mounted at `/data`, container image
  `node:20-alpine`; non-Docker: `terminalOption.pty: false`, pipes).
  It speaks a line protocol (`READY:`/`ECHO:`/`PID:`/`SUM:`/`SLEEPING:`/`SLEPT:`/`BYE`) and appends
  `heartbeat.txt` in its cwd every 200ms as an out-of-band liveness probe. Keep it dependency-free.
- **Instance engine timings** the cases must tolerate: `AbsStartCommand` sleeps 2s per start
  (dead-loop guard) and `GeneralKillCommand` protects instances younger than 6s before SIGKILL,
  so `kill` can fire several seconds after the request. `stopCommand: "exit"` + `stopTimeout: 5`
  make `stop` graceful-then-escalate.
- Gateway probes like `nodeOk`/`dockerOk` must be read **inside** the test bodies (at run time,
  after `beforeAll`) — binding them into a `const` at describe/collect time silently skips everything.
- Running as root creates root-owned files under the git-ignored `daemon/logs/`; clean them
  up afterwards if desired.

## 6. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Docker tests "pass" instantly as non-root | No socket access → early return. Re-run with `sudo` (§4). |
| Process cases "pass" instantly / 0s duration | `nodeOk` false (`node` not on `PATH`) or the gate was bound at collect time — see §5. Re-run verbose; cases must take ~30–60s total. |
| `process.chdir() is not supported in workers` | `threads: false` removed from `daemon/vitest.config.ts`; restore it. |
| `Cannot connect to the Docker daemon` | Daemon down, or socket not reachable as this user; use root. |
| Timeout waiting for output | Docker: no `ECHO:`/`SUM:`/`BYE` came back — check `node` exists in the container image and `test.mjs` was copied into the bind-mounted workspace (`/data`). Process: `READY:` never arrived — check `node` runs `test.mjs` in the instance cwd. |
| `image ... not found` / slow first run | First run pulls `node:20-alpine`; check network/registry access. |
| Bash suite fails on `ping` | `iputils-ping` missing or no ICMP route; install it / pick another reachable IP. |
| Force-kill case times out | The 6s startup guard delays SIGKILL; keep the 90s timeout and do not start asserting too early. |
| `heartbeat.txt` missing in a process case | Fixture not copied (see `processConfig()` in the test) or the instance cwd differs from the expectation. |

## 7. Reference

- Test file: `daemon/src/routers/__test__/Instance_router.integration.test.ts`
- Interactive process fixture: `daemon/test/fixtures/test.mjs`
- Unit (fully mocked) counterpart: `daemon/src/routers/__test__/Instance_router.test.ts`
- Example run report: `docker-test-report.md` (repo root)
