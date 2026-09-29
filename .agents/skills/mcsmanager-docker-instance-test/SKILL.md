---
name: mcsmanager-docker-instance-test
description: Run the MCSManager Docker + instance lifecycle integration tests (daemon). MANDATORY after modifying daemon/src/routers/Instance_router.ts, daemon/src/entity/instance/instance.ts, or any daemon/src/service/docker_* / takeover_container service file. Use when the user asks to run Docker/instance tests, or when those files change and their behavior must be verified against a real Docker daemon and real child processes. Covers root/sudo Docker access, non-root vs root run modes, alpine/ping prerequisites, cleanup verification, and the vitest threads:false / process.chdir quirk.
---

# MCSManager — Docker + Instance Integration Test Runner

Real (non-mocked) lifecycle tests live in
`daemon/src/routers/Instance_router.integration.test.ts`:

| Suite | Tests | What it does for real |
| --- | --- | --- |
| `Docker instance lifecycle (real)` | 4 | starts an `alpine:3.20` container, checks RUNNING + terminal output, then `kill` / `stop` / `delete` and container removal |
| `General (non-Docker) instance lifecycle (real)` | 2 | starts a real `bash` process, sends a `ping` command, asserts captured output |

**Mandatory rule:** any change to `Instance_router.ts`, `instance.ts`, or the Docker
service files MUST be verified with this skill before finishing. Report the result.

## 1. Prerequisites

- **Linux** (Docker suite only runs on `process.platform === "linux"`; the general suite is skipped on Windows).
- A reachable **Docker daemon**. The Docker socket (`/var/run/docker.sock`) is usually `root:docker` — so the Docker suite needs **root/sudo**. Non-root runs silently return early (see §4).
- Image `alpine:3.20` (the test pulls it automatically if missing → needs network).
- `ping` on the host for the general suite (`iputils-ping`; the test also needs a route to a public IP).
- Never hardcode credentials in the repo. If `sudo` prompts, obtain the password out-of-band from the user.

## 2. Commands

Run from `daemon/`:

```bash
cd daemon

# a) Docker suite ONLY, as root, verbose (the common case)
sudo env "PATH=$(dirname "$(command -v node)"):$PATH" \
  node node_modules/vitest/vitest.mjs run \
  src/routers/Instance_router.integration.test.ts \
  -t "Docker instance lifecycle" \
  --reporter=verbose

# b) Full integration file (Docker + general), as root
sudo env "PATH=$(dirname "$(command -v node)"):$PATH" \
  node node_modules/vitest/vitest.mjs run src/routers/Instance_router.integration.test.ts

# c) Whole daemon suite (no root): Docker tests return early, general tests run
npm test
```

- `node` from nvm is NOT on `sudo`'s `PATH`; pass `PATH=$(dirname "$(command -v node)"):$PATH` as above (or use the absolute node path).
- `-t "Docker instance lifecycle"` selects only the Docker describe block (the general block then shows as skipped).

## 3. Expected result (all green)

- Docker-only run (root): `4 passed | 2 skipped (6)`.
- Full integration file (root): `6 passed (6)`.
- Full daemon suite (non-root): the stated daemon total (currently 119) passes.

## 4. Verify the tests RAN (not silently skipped)

The suites use `if (!dockerOk) return;` / `if (!canRun) return;`, so an unavailable
Docker daemon makes the test **pass without exercising Docker**. Always confirm:

1. Run as **root** and check the verbose names are present.
2. Optionally watch containers live during the run:

   ```bash
   watch -n1 'sudo docker ps -a --filter label=mcsmanager.instance.uuid'
   ```

   You should see short-lived `mcsm-int-docker-*` (`alpine:3.20`) containers appear and disappear.
3. After the run, ensure **no** leftover test containers:

   ```bash
   sudo docker ps -a --filter label=mcsmanager.instance.uuid
   ```

   Only pre-existing user containers (e.g. `MCSM-*`) may remain — never delete those.

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
- The container is started **before** the attach stream connects, so a one-shot `echo` can be
  lost. Test start commands must keep producing output (e.g. a `while true; do echo …; sleep 1; done` loop).
- Running as root creates root-owned files under the git-ignored `daemon/logs/`; clean them
  up afterwards if desired.

## 6. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Docker tests "pass" instantly as non-root | No socket access → early return. Re-run with `sudo` (§4). |
| `process.chdir() is not supported in workers` | `threads: false` removed from `daemon/vitest.config.ts`; restore it. |
| `Cannot connect to the Docker daemon` | Daemon down, or socket not reachable as this user; use root. |
| Timeout waiting for output | Start command produced no output after attach; make it stream continuously. |
| `image ... not found` / slow first run | First run pulls `alpine:3.20`; check network/registry access. |
| General test fails on `ping` | `iputils-ping` missing or no ICMP route; install it / pick another reachable IP. |

## 7. Reference

- Test file: `daemon/src/routers/Instance_router.integration.test.ts`
- Unit (fully mocked) counterpart: `daemon/src/routers/Instance_router.test.ts`
- Example run report: `docker-test-report.md` (repo root)
