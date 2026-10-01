# Real-Process Integration Test Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user pre-selected **fully-autonomous** execution (no review checkpoints between phases) and **subagent fan-out** for the suites; each task ends with an independent commit.

**Goal:** Build a `common/test/integration/` real-process test framework (boots a real panel+daemon pair per suite, isolated temp workspace, reuses built `production/app.js` + `daemon/lib`) and migrate every backend mock route test onto six module integration suites (auth, user, instance, files, streams, docker), deleting the mocks and updating AGENTS.md + skills.

**Architecture:** Each suite is a standalone vitest file whose `globalSetup` boots a fresh daemon + panel (`--unsafe-integration-test-mode=<key>`) in a `mkdtemp` sibling-dir workspace (panel auto-discovers daemon via `../daemon/data/Config/global.json`), runs its `it`s sequentially against that one pair sharing an in-memory `world`, then force-kills + wipes `data/`. A `run.mjs` runner invokes the six suites **sequentially** (docker skipped on non-Linux / no Docker) so they reuse the default ports 23333/24444 — no parallelism, sidestepping vitest 0.33's ignored `singleFork`. Public helpers (`requestPanel`, `login`, `createStream`, `uploadFile`/`downloadFile`, file ops) are refactored out of the existing `panel/test/integration/lib/*` and exported from `common/test/integration/lib/index.ts`, isomorphic (axios + socket.io-client) so frontend tests may reuse them.

**Tech Stack:** vitest `^0.33.0` (pinned, existing), `axios` + `socket.io-client` (existing panel devDeps, added to common devDeps), `fs-extra` (`copySync`, added to common devDeps), Node builtins (`child_process.spawn`, `fs`, `os`, `path`, `process.kill` for group-kill). Tests run against built `panel/production/app.js` + `daemon/production/app.js` (dev builds) + `daemon/lib` platform binaries — **no ts-node path**.

**Spec:** `docs/superpowers/specs/2026-09-30-integration-test-framework-design.md` (decisions D1–D8; this plan argues from the spec).

## Global Constraints

(From the spec — every task's requirements implicitly include this section.)

- vitest `^0.33.0`, `environment: "node"`. Suite files live at `common/test/integration/suites/*.test.ts`; the runner invokes vitest once per file (sequential), so each invocation has one file + one `globalSetup` boot.
- **Build prerequisite (D3, confirmed):** runner requires `panel/production/app.js` + `daemon/production/app.js` + `daemon/lib/<pty|file_zip>_<os>_<arch>` to exist; else errors with the exact build commands `cd common && npm run build && cd ../panel && npm run build && cd ../daemon && npm run build`. Dev builds (no `BUNDLE=1`) are correct (they use `node_modules/` which is present).
- The `--unsafe-integration-test-mode=<key>` bypasses **only** `panel/src/app/middleware/permission.ts:75-77`. It does NOT bypass `preCheckMiddleware` (so uploads go daemon-direct) and NOT the per-instance `router.use` gates (which read `ctx.session.uuid`, empty under the key → 403). Every per-instance `it` does a real `login` + `ensureOwner` first; the key alone is only for no-per-instance-gate admin routes (user/node/settings CRUD, market list).
- Panel responses are `{status,data,time}` envelopes → `unwrap`. Session cookie **name** is a random UUID per panel boot → replay whatever `Set-Cookie` login returns (never hardcode `koa:sess`).
- speedLimit cooldown on `/files/list` (0.1) + `/files/move` (3) → `requestPanel` retries 400ms ×10 on HTTP 500 matching `/cooldown|try again/i`.
- Workspace layout is load-bearing: `${os.tmpdir()}/mcsm-it-XXX/{daemon,panel}` are siblings (panel auto-discovers daemon at `../daemon/data/Config/global.json`).
- Process group-kill via `process.kill(-pid, "SIGTERM")` (spawn `detached: true`) → 1.5s → `SIGKILL` survivors; copy logs to `.last-run/`; `fs.rmSync(workDir)`.
- Keep (do NOT delete): `common/src/__test__/*`, `panel/src/app/service/__test__/login_ban.test.ts`, `panel/src/app/utils/__test__/integration_test_mode.test.ts`, `daemon/src/routers/__test__/Instance_router.integration.test.ts`, `daemon/src/routers/__test__/file_router.security.test.ts`, `daemon/test/fixtures/test.mjs`. Delete everything else mock (see §5 of spec).
- Code/comments in English; findings (ambiguities, do-not-fix product inconsistencies) go to `common/test/integration/FINDINGS.html` + `docs/test-doubts/`; confirmed bugs get minimal source fixes with a TDD test.
- `REPO` (repo root) resolves from `common/test/integration/lib/` as `path.resolve(HERE, "../../../..")`.
- TDD for suites: write the assertion → run (real panel) → if a real bug, fix product minimally + add a regression assertion; if ambiguous (500-vs-403 越权, command-injection inert, normal-user-cannot-change-startCommand, key-not-instance-admin), record in FINDINGS + `docs/test-doubts/` without changing code.

## Review Focus

The spec implies behaviors that, if untested, are most likely to bite a user of MCSManager. Each is pinned to a concrete suite/`it` below.

1. **The `--unsafe` test-key does NOT grant per-instance access** — `GET /api/instance?uuid=<real>` with `x-request-api-key=<key>` returns 403 (per-instance gate reads `ctx.session.uuid`, empty under the key). Pinned in **Task 5 (auth suite)**: the `it("key is NOT instance-admin: per-instance gate 403s under the key")`.
2. **Per-instance `router.use` gate rejects a non-owner with 403** on `/protected_instance/*`, `/files/*`, `/protected_instance/stream_channel` — but `GET /api/instance` returns 500 (handler-throws, not gate-403). Pinned in **Task 6 (user suite)**: the `it("越权: u2 cannot read/operate u1's instance")` asserting the 403/500 split as a documented finding.
3. **A path target escaping the instance cwd is rejected** (`list/move/edit/delete/upload` with `../`). Pinned in **Task 8 (files suite)**: the `it("path traversal: ../ on list/move/edit/delete/upload is rejected")` + zip-slip `it`.
4. **Token mismatch + forged cookie + apikey-disabled are rejected with 403** on protected routes. Pinned in **Task 5 (auth suite)**: the token-mismatch + forged-session + apikey-disabled `it`s.
5. **Stdout from one instance broadcasts to ALL attached sockets** (two sockets both see the same `ECHO:hello` / `ECHO:你好世界` line). Pinned in **Task 9 (streams suite)**: the `it("dual-socket broadcast: both sockets see the same ASCII + Chinese line")` using `bothSee`.

---

## File Structure

```
common/test/integration/
├─ lib/
│  ├─ bootstrap.ts        # bootRuntime/stopRuntime: workspace, spawn daemon+panel, wait ready, kill+rm
│  ├─ process.ts          # spawn, fs-extra copy, group-kill, log tee to .last-run/
│  ├─ world.ts            # per-invocation state singleton + .runtime.json handoff + REPO/HERE
│  ├─ http.ts             # requestPanel, unwrap, cooldown retry, login, loginSessionRetry, ensureUser, ensureOwner, createUser
│  ├─ socket.ts           # createStream (stream_channel→connect→stream/auth→stream/detail), waitForOutput, collectText
│  ├─ files.ts            # fileOps*, uploadFile (single-shot), uploadFileChunked (upload-new+upload-piece), downloadFile
│  ├─ util.ts             # waitFor, sleep, buildZip, buildZipSystem, diskUsers
│  └─ index.ts            # re-export the public API
├─ suites/
│  ├─ _smoke.test.ts      # Task 4: proves the framework end-to-end (the de-risk gate)
│  ├─ auth.test.ts        # Task 5
│  ├─ user.test.ts        # Task 6
│  ├─ instance.test.ts    # Task 7
│  ├─ files.test.ts       # Task 8
│  ├─ streams.test.ts     # Task 9
│  └─ docker.test.ts      # Task 10
├─ fixtures/
│  └─ test.mjs            # Task 3: copied (not moved) from daemon/test/fixtures/test.mjs so the framework is self-contained
├─ vitest.config.ts       # Task 1
├─ globalSetup.ts         # Task 4: setup=bootRuntime, teardown=stopRuntime
├─ run.mjs                # Task 1: sequential runner + build-prereq check
├─ FINDINGS.html          # Task 12: moved from panel/test/integration/, appended-to thereafter
└─ .gitignore             # Task 1: .runtime.json, .last-run/
```

Modified (non-test):
- `common/package.json` — add devDeps (`axios`, `socket.io-client`, `fs-extra`) + scripts `test:integration`, `test:integration:build`.
- `common/tsconfig.json` — ensure `exclude: ["test/**","src/**/*.test.ts"]` (Task 1).
- `common/vitest.config.ts` — keep `npm test` (pure unit tests at `src/__test__/**`) unchanged; integration is a separate config.
- `package.json` (root) — add `test:integration` delegating to common (Task 1); update `test`? no — keep `test` = panel+daemon pure unit layers.
- `AGENTS.md` — §8 + §9 rewritten (Task 12).
- `.agents/skills/mcsmanager-test/SKILL.md` + `.agents/skills/mcsmanager-docker-instance-test/SKILL.md` — updated (Task 12).

Deleted (Task 11, after P2 suites are green and committed):
- `panel/test/integration/**` (refactored into common).
- `panel/test/harness/**` + the 17 `panel/src/app/routers/__test__/*.test.ts` + `panel/src/app/middleware/__test__/permission.test.ts`.
- `daemon/test/harness/smoke.test.ts` + mock-router-only parts of `daemon/test/harness/{http,router,mocks}.ts`.
- the 12 `daemon/src/routers/__test__/*.test.ts` mock router tests (NOT the 2 kept).

---

## Task 1: Common integration scaffolding (config + runner + scripts)

**Files:**
- Create: `common/test/integration/vitest.config.ts`
- Create: `common/test/integration/run.mjs`
- Create: `common/test/integration/.gitignore`
- Modify: `common/package.json`
- Modify: `package.json` (root)
- Modify: `common/tsconfig.json` (verify/extend exclude)

**Interfaces:** Produces `vitest run --config common/test/integration/vitest.config.ts <suite>` (one invocation per suite), the sequential `run.mjs` runner, and the npm scripts. No code dependencies yet (those land in Task 2–3); this task's smoke is "runner errors clearly when the build is missing".

- [ ] **Step 1: Add the vitest config**

`common/test/integration/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One vitest invocation PER suite file (the runner calls vitest once per file).
// globalSetup boots a fresh daemon+panel pair for that invocation and tears it down
// in teardown. Because each invocation has exactly one file, the it blocks run
// sequentially by default and share one in-memory `world` — sidestepping vitest 0.33's
// ignored singleFork (multiple files would race the shared ports/state).
export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    include: ["test/integration/suites/**/*.test.ts"],
    environment: "node",
    globalSetup: path.resolve(__dirname, "globalSetup.ts"),
    testTimeout: 180000,
    hookTimeout: 180000,
    passWithNoTests: false
  }
});
```

- [ ] **Step 2: Add the sequential runner**

`common/test/integration/run.mjs` (Node ESM, no deps beyond node builtins + the panel/daemon vitest binary):
```js
#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../../..");
const isLinux = process.platform === "linux";

const SUITES = ["auth", "user", "instance", "files", "streams", "docker"];
// docker.test.ts self-skips per `it` on non-Linux/no-Docker; the runner still invokes it
// when isLinux so the early-return skip is visible in the report.

function prereq() {
  const missing = [];
  for (const p of [
    "panel/production/app.js",
    "daemon/production/app.js",
    "panel/data/market_cache.json"
  ]) if (!existsSync(path.join(REPO, p))) missing.push(p);
  // daemon/lib: require at least one pty + one file_zip binary for this platform
  const libDir = path.join(REPO, "daemon/lib");
  if (!existsSync(libDir) || !require("node:fs").readdirSync(libDir).some(f => /^pty_/.test(f)))
    missing.push("daemon/lib/pty_<os>_<arch>");
  if (missing.length) {
    console.error("\n[run.mjs] Build prerequisite missing:\n  " + missing.join("\n  "));
    console.error("\nBuild first:\n  cd common && npm run build && cd ../panel && npm run build && cd ../daemon && npm run build");
    console.error("(and install platform binaries via install-dependents.sh if daemon/lib is empty)\n");
    process.exit(1);
  }
}

function runSuite(name) {
  const file = `test/integration/suites/${name}.test.ts`;
  console.log(`\n===== integration suite: ${name} =====`);
  const r = spawnSync(
    process.execPath,
    ["node_modules/vitest/vitest.mjs", "run", "--config", "test/integration/vitest.config.ts", file, "--reporter=verbose"],
    { cwd: path.resolve(__dirname, ".."), stdio: "inherit" }
  );
  return r.status;
}

prereq();
let failed = false;
const summary = [];
for (const name of SUITES) {
  const status = runSuite(name);
  summary.push(`${name}: ${status === 0 ? "PASS" : "FAIL"}`);
  if (status !== 0) { failed = true; break; } // stop on first failure
}
console.log("\n===== integration summary =====\n" + summary.join("\n"));
process.exit(failed ? 1 : 0);
```

(Note: `run.mjs` uses a `require("node:fs")` one-liner for listing lib — acceptable in a CJS-interop ESM context; alternatively use `readdirSync` from `node:fs` ESM import. Prefer the ESM import to keep it clean — replace the `require` with the already-imported `existsSync` sibling `readdirSync`.)

- [ ] **Step 3: Add the .gitignore**

`common/test/integration/.gitignore`:
```
.runtime.json
.last-run/
```

- [ ] **Step 4: Add npm scripts + devDeps**

`common/package.json` — add to `scripts`:
```json
"test:integration": "node test/integration/run.mjs",
"test:integration:build": "npm run build && npm --prefix ../panel run build && npm --prefix ../daemon run build && node test/integration/run.mjs"
```
Add to `devDependencies` (match panel's exact versions — read them from `panel/package.json` during implementation): `"axios"`, `"socket.io-client"`, `"fs-extra"` (panel already pins these; copy the version strings verbatim).

Root `package.json` — add to `scripts`:
```json
"test:integration": "cd common && npm run test:integration"
```

- [ ] **Step 5: Verify the tsconfig exclude**

`common/tsconfig.json` must exclude `test/**` so the integration harness (which imports panel/daemon source aliases) is never type-checked into the published `common/dist`. If `exclude` already contains `test/**` (per [[backend-route-test-suite]] fix), do nothing; else add it.

- [ ] **Step 6: Run the runner to verify the prereq gate**

Run: `cd common && node test/integration/run.mjs`
Expected: exits 1 with the "[run.mjs] Build prerequisite missing" message ONLY IF a prereq is absent; since the dev box has `panel/production/app.js` + `daemon/production/app.js` + `daemon/lib/pty_darwin_arm64` + `market_cache.json`, the prereq passes and the runner proceeds to invoke vitest on `auth.test.ts` → which fails because no suites exist yet (Task 4+). That's the expected state at end of Task 1: runner wiring works, suites are next.

- [ ] **Step 7: Commit**

```bash
git add common/test/integration/vitest.config.ts common/test/integration/run.mjs common/test/integration/.gitignore common/package.json common/tsconfig.json package.json package-lock.json
git commit -m "test(common): integration suite scaffolding — vitest config + sequential runner + scripts"
```

---

## Task 2: Lifecycle — `bootstrap.ts` + `process.ts` + `world.ts`

**Files:**
- Create: `common/test/integration/lib/world.ts`
- Create: `common/test/integration/lib/process.ts`
- Create: `common/test/integration/lib/bootstrap.ts`

**Interfaces:**
- Consumes: the existing `panel/test/integration/lib/{bootstrap,world,util}.ts` as the port source (read them verbatim; they are not deleted until Task 11).
- Produces:
  - `world.ts`: `world` singleton; `World` type `{ key, panelUrl, daemonHttpUrl, workDir, daemonId, admin, u1, u2, instance, zipPath, findings, ... }`; `REPO` constant; `RUNTIME_FILE`; `saveState()` / `loadState()`; `addFinding(f)`.
  - `process.ts`: `spawnApp({app, args, cwd})` → `ChildProcess` (detached); `teeLogs(proc, file)`; `groupKill(proc)` (SIGTERM group → SIGKILL).
  - `bootstrap.ts`: `bootRuntime(): Promise<Runtime>`; `stopRuntime(rt): Promise<void>`; `Runtime { daemonProc, panelProc, workDir, key, daemonId, panelUrl, daemonHttpUrl }`.

- [ ] **Step 1: Write `world.ts`**

Port `panel/test/integration/lib/world.ts` verbatim, adjusting only the `REPO`/`HERE` resolution (HERE is now `common/test/integration/lib/`, so REPO = `path.resolve(HERE, "../../../..")`). Keep the `World` interface, `saveState`/`loadState`/`addFinding`, and the `.runtime.json` path (`RUNTIME_FILE = path.join(HERE, "..", ".runtime.json")`). Keep `findings` deliberately non-persistent.

```ts
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, "../../../..");
export const RUNTIME_FILE = path.join(HERE, "..", ".runtime.json");

export interface Finding { id: string; step: string; severity: "info" | "warn"; title: string; detail: string; evidence: string; }
export interface WorldUser { name: string; pass: string; uuid?: string; cookie?: string; token?: string; }
export interface WorldInstance { name: string; uuid?: string; preset?: { title: string; description: string; targetLink: string; setupInfo: any }; }

export const world = {
  key: "", panelUrl: "http://127.0.0.1:23333", daemonHttpUrl: "http://127.0.0.1:24444",
  workDir: "", daemonId: "",
  admin: { name: "test_admin", pass: "Www.123456" } as WorldUser,
  u1: { name: "test_user1", pass: "Www.123456" } as WorldUser,
  u2: { name: "test_user2", pass: "Www.123456" } as WorldUser,
  instance: { name: "mcsm-it-inst" } as WorldInstance,
  zipPath: "", findings: [] as Finding[]
};

export function addFinding(f: Finding) { world.findings.push(f); }

export function saveState() {
  fs.writeFileSync(RUNTIME_FILE, JSON.stringify({
    key: world.key, workDir: world.workDir, daemonId: world.daemonId,
    panelUrl: world.panelUrl, daemonHttpUrl: world.daemonHttpUrl,
    admin: world.admin, u1: world.u1, u2: world.u2, instance: world.instance, zipPath: world.zipPath
  }, null, 2));
}
export function loadState() {
  if (!fs.existsSync(RUNTIME_FILE)) return;
  const s = JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf-8"));
  Object.assign(world, s);
}
```

- [ ] **Step 2: Write `process.ts`**

```ts
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function spawnApp(opts: { app: string; args?: string[]; cwd: string; logFile: string }): ChildProcess {
  const proc = spawn(process.execPath, [opts.app, ...(opts.args || [])], {
    cwd: opts.cwd, env: { ...process.env }, stdio: ["ignore", "pipe", "pipe"], detached: true
  });
  const stream = fs.createWriteStream(opts.logFile);
  proc.stdout?.on("data", d => stream.write(d));
  proc.stderr?.on("data", d => stream.write(d));
  proc.on("exit", code => fs.appendFileSync(opts.logFile, `\n[exit ${code}]\n`));
  return proc;
}

// Group-kill mirrors the existing harness: detached spawn → each child is a PGID leader,
// so -pid kills the whole group. SIGTERM, 1.5s grace, SIGKILL survivors.
export async function groupKill(proc: ChildProcess | null) {
  if (!proc || proc.exitCode !== null) return;
  try { process.kill(-proc.pid!, "SIGTERM"); } catch { try { proc.kill("SIGTERM"); } catch {} }
  await new Promise(s => setTimeout(s, 1500));
  try { if (proc.exitCode === null) proc.kill("SIGKILL"); } catch {}
}
```

- [ ] **Step 3: Write `bootstrap.ts`**

Port `panel/test/integration/lib/bootstrap.ts`'s `startAll`/`stopAll`, renamed `bootRuntime`/`stopRuntime`, using `world.ts` + `process.ts` above. Key sequence (verbatim mechanism from the existing harness):

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { copySync } from "fs-extra";
import { spawnApp, groupKill } from "./process";
import { world, saveState, REPO, addFinding } from "./world";
import { requestPanel } from "./http";      // Task 3
import { waitFor, sleep } from "./util";     // Task 3

export interface Runtime { daemonProc: any; panelProc: any; workDir: string; key: string; daemonId: string; panelUrl: string; daemonHttpUrl: string; }

export async function bootRuntime(): Promise<Runtime> {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcsm-it-"));
  const daemonDir = path.join(workDir, "daemon");
  const panelDir = path.join(workDir, "panel");
  fs.mkdirSync(path.join(daemonDir, "lib"), { recursive: true });
  fs.mkdirSync(path.join(panelDir, "data"), { recursive: true });
  copySync(path.join(REPO, "daemon/lib"), path.join(daemonDir, "lib"));
  const mc = path.join(REPO, "panel/data/market_cache.json");
  if (fs.existsSync(mc)) fs.copyFileSync(mc, path.join(panelDir, "data", "market_cache.json"));

  world.workDir = workDir;
  const daemonProc = spawnApp({ app: path.join(REPO, "daemon/production/app.js"), cwd: daemonDir, logFile: path.join(workDir, "daemon.log") });
  await waitFor(() => fs.existsSync(path.join(daemonDir, "data/Config/global.json")), { timeout: 20000, msg: "daemon global.json" });
  await sleep(5000);

  const key = "mcsm-it-" + Math.random().toString(36).slice(2, 14);
  world.key = key;
  const panelProc = spawnApp({
    app: path.join(REPO, "panel/production/app.js"),
    args: [`--unsafe-integration-test-mode=${key}`],
    cwd: panelDir, logFile: path.join(workDir, "panel.log")
  });
  await waitFor(async () => {
    const r = await requestPanel({ method: "GET", path: "/auth/status", key, timeout: 8000 });
    return r.httpStatus === 200;
  }, { timeout: 40000, msg: "panel ready (/auth/status 200)" });

  let daemonId = "";
  await waitFor(async () => {
    const r = await requestPanel({ method: "GET", path: "/service/remote_services_list", key, timeout: 8000 });
    const arr = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
    if (arr.length > 0) { daemonId = arr[0].uuid; return true; }
    return false;
  }, { timeout: 30000, msg: "remote_services_list" });
  world.daemonId = daemonId;

  // Enable preset install (quick_install_list) for admin; documented in the existing suite.
  await requestPanel({ method: "PUT", path: "/overview/setting", key, body: { allowUsePreset: true } });
  saveState();
  return { daemonProc, panelProc, workDir, key, daemonId, panelUrl: world.panelUrl, daemonHttpUrl: world.daemonHttpUrl };
}

export async function stopRuntime(rt: Runtime) {
  // best-effort delete test instance + users via the key
  try {
    if (rt.daemonId) {
      await requestPanel({ method: "DELETE", path: "/instance", key: rt.key, query: { daemonId: rt.daemonId }, body: { uuids: [], deleteFile: true } }).catch(() => {});
      const uuids = [world.admin, world.u1, world.u2].map(u => u.uuid).filter(Boolean);
      if (uuids.length) await requestPanel({ method: "DELETE", path: "/auth", key: rt.key, body: uuids }).catch(() => {});
    }
  } catch {}
  await groupKill(rt.daemonProc);
  await groupKill(rt.panelProc);
  // preserve logs for post-mortem
  const lastRun = path.join(REPO, "common/test/integration/.last-run");
  fs.mkdirSync(lastRun, { recursive: true });
  try { fs.copyFileSync(path.join(rt.workDir, "daemon.log"), path.join(lastRun, "daemon.log")); } catch {}
  try { fs.copyFileSync(path.join(rt.workDir, "panel.log"), path.join(lastRun, "panel.log")); } catch {}
  fs.writeFileSync(path.join(lastRun, "info.json"), JSON.stringify({ workDir: rt.workDir, daemonId: rt.daemonId, key: rt.key }, null, 2));
  try { fs.rmSync(rt.workDir, { recursive: true, force: true }); } catch {}
  try { fs.unlinkSync(path.join(REPO, "common/test/integration/.runtime.json")); } catch {}
}
```

- [ ] **Step 4: Commit** (this task does not run yet — Task 3 supplies `http`/`util`; Task 4 wires `globalSetup` + smoke to prove it)

```bash
git add common/test/integration/lib/world.ts common/test/integration/lib/process.ts common/test/integration/lib/bootstrap.ts
git commit -m "test(common): integration lifecycle — boot/stop runtime, world state, process spawn/group-kill"
```

---

## Task 3: Helpers — `http.ts` + `socket.ts` + `files.ts` + `util.ts` + `index.ts` + fixture

**Files:**
- Create: `common/test/integration/lib/util.ts`
- Create: `common/test/integration/lib/http.ts`
- Create: `common/test/integration/lib/socket.ts`
- Create: `common/test/integration/lib/files.ts`
- Create: `common/test/integration/lib/index.ts`
- Create: `common/test/integration/fixtures/test.mjs` (copy)

**Interfaces:** Produces the public API (D5 of the spec). Each file is a near-verbatim port of the corresponding `panel/test/integration/lib/*` with names generalized to the public surface.

- [ ] **Step 1: Port `util.ts`**

Port `panel/test/integration/lib/util.ts` verbatim: `sleep(ms)`, `waitFor(fn, {timeout=60000, interval=500, msg})` (polls, rejects on timeout with `msg`), `diskUsers()`, and the dependency-free `buildZip(entries)` (STORE/DEFLATE, CRC32 table + zlib deflateRaw, supports `../` entry names for zip-slip) + `buildZipSystem(zipPath, entries)` (uses the `zip` binary if present, falls back to `buildZip`). Copy these as-is — they are pure and proven.

- [ ] **Step 2: Port `http.ts`**

Port `panel/test/integration/lib/http.ts` with the public names. Core:

```ts
import axios from "axios";
import { world, saveState } from "./world";
import { sleep } from "./util";

export interface RawRes { status: number; data: any; httpStatus: number; raw: any; }

export function unwrap(res: any): RawRes {
  let status = res.status, data = res.data, raw = res.data;
  const body = res.data;
  if (body && typeof body === "object" && "status" in body && "data" in body && "time" in body) { status = body.status; data = body.data; }
  else if (typeof body === "string") { try { const j = JSON.parse(body); if (j && typeof j === "object" && "status" in j && "data" in j) { status = j.status; data = j.data; raw = j; } } catch {} }
  return { status, data, httpStatus: res.status, raw };
}

export async function requestPanel(o: { method: any; path: string; key?: string; cookie?: string; token?: string; query?: any; body?: any; headers?: any; timeout?: number }): Promise<RawRes> {
  const headers: any = { ...(o.headers || {}) };
  if (o.key) headers["x-request-api-key"] = o.key;
  if (o.cookie) { headers["Cookie"] = o.cookie; headers["x-requested-with"] = "XMLHttpRequest"; }
  const params: any = { ...(o.query || {}) };
  if (o.token) params.token = o.token;
  for (let attempt = 0; attempt < 10; attempt++) {
    let res;
    try {
      res = await axios({ method: o.method, url: `${world.panelUrl}/api${o.path}`, params, data: o.body, headers, validateStatus: () => true, maxRedirects: 0, timeout: o.timeout ?? 90000 });
    } catch (e: any) { return { status: 500, data: String(e?.message || e), httpStatus: 0, raw: String(e) }; }
    const r = unwrap(res);
    if (r.httpStatus === 500 && /cooldown|try again/i.test(String(r.data))) { await sleep(400); continue; }
    return r;
  }
  return { status: 500, data: "cooldown exhausted", httpStatus: 500, raw: "cooldown exhausted" };
}

// login : POST /auth/login — body shape ported verbatim from the existing http.ts login().
export async function login(name: string, pass: string): Promise<{ ok: boolean; cookie: string; token: string; raw: any }> { /* port verbatim */ }
export async function loginSessionRetry(role: "admin" | "u1" | "u2"): Promise<{ cookie: string; token: string }> { /* port verbatim (6×700ms) */ }
export async function ensureUser(role: "admin" | "u1" | "u2", key: string): Promise<void> { /* port verbatim */ }
export async function ensureOwner(role: "u1" | "u2", key: string): Promise<void> { /* port verbatim (PUT /auth assign + /auth/overview verify, 8×) */ }
export async function createUser(name: string, pass: string, permission: number, key: string): Promise<{ uuid: string }> { /* POST /auth */ }
```

(The `login`/`ensureUser`/`ensureOwner`/`loginSessionRetry` bodies must be copied **verbatim** from `panel/test/integration/lib/http.ts` — they encode the exact `/auth/login` body shape, the `Set-Cookie` capture (`c.split(";")[0]` join), the transient-user-store retry loops, and the `PUT /auth` instance-assignment shape. Do not reimplement from memory; read the source.)

- [ ] **Step 3: Port `socket.ts`**

Port `panel/test/integration/lib/socket.ts` with the public name `createStream`:

```ts
import { io } from "socket.io-client";
export interface Stream { socket: any; ready: Promise<boolean>; stdout: string[]; send(cmd: string): void; write(input: string): void; disconnect(): void; }
export function createStream(addr: string, prefix: string, password: string): Stream {
  const url = addr.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
  const socket = io(url, { path: (prefix || "") + "/socket.io", transports: ["websocket"], reconnection: false, timeout: 10000, forceNew: true });
  const stdout: string[] = [];
  socket.on("instance/stdout", (p: any) => { const t = p?.data?.text ?? ""; if (t) stdout.push(t); });
  const ready = new Promise<boolean>(resolve => {
    const to = setTimeout(() => resolve(false), 15000);
    socket.on("connect", () => socket.emit("stream/auth", { data: { password } }));
    socket.on("stream/auth", (p: any) => { if (p?.data === true) { socket.emit("stream/detail", {}); clearTimeout(to); resolve(true); } });
    socket.on("connect_error", () => { clearTimeout(to); resolve(false); });
  });
  return { socket, ready, stdout, send: c => socket.emit("stream/input", { data: { command: c } }), write: i => socket.emit("stream/write", { data: { input: i } }), disconnect: () => socket.disconnect() };
}
export async function waitForOutput(s: Stream, pred: (t: string) => boolean, timeout = 15000, interval = 100): Promise<boolean> { /* poll s.stdout */ }
export function collectText(s: Stream): string { return s.stdout.join(""); }
```

- [ ] **Step 4: Port `files.ts` + add chunked upload**

Port `panel/test/integration/lib/files.ts` (`listFiles`, `mkdirP`, `moveFile`, `copyFile`, `editFile`, `readFileText`, `deleteFiles`, `decompress`, `getUploadPassport`, `uploadToDaemon`, `getDownloadPassport`, `downloadFromDaemon`, `httpBase`) — verbatim. **Add** the chunked upload path the frontend uses (`/upload-new` + `/upload-piece`):

```ts
export async function uploadFileChunked(o: { addr: string; password: string; name: string; content: Buffer; unzip?: boolean; overwrite?: boolean; pieceSize?: number }): Promise<any> {
  const base = httpBase(o.addr);
  const pieceSize = o.pieceSize ?? 2 * 1024 * 1024;
  const init = await axios.post(`${base}/upload-new/${encodeURIComponent(o.password)}`, null, { params: { filename: o.name, size: o.content.length, unzip: o.unzip ? 1 : 0, overwrite: String(o.overwrite ?? false) }, validateStatus: () => true, maxRedirects: 0, timeout: 120000 });
  const id = init.data?.data?.id; if (!id) throw new Error("upload-new gave no id");
  for (let off = 0; off < o.content.length; off += pieceSize) {
    const chunk = o.content.subarray(off, off + pieceSize);
    const boundary = "----mcsmtest" + Math.random().toString(36).slice(2);
    const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"\r\nContent-Type: application/octet-stream\r\n\r\n`), chunk, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    await axios.post(`${base}/upload-piece/${id}`, body, { params: { offset: off }, headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` }, validateStatus: () => true, maxRedirects: 0, timeout: 120000 });
  }
  return init.data;
}
```

- [ ] **Step 5: Write `index.ts` (the public API surface — D5)**

```ts
export * from "./world";
export { bootRuntime, stopRuntime, type Runtime } from "./bootstrap";
export { requestPanel, unwrap, login, loginSessionRetry, ensureUser, ensureOwner, createUser, type RawRes } from "./http";
export { createStream, waitForOutput, collectText, type Stream } from "./socket";
export { listFiles, mkdirP, moveFile, copyFile, editFile, readFileText, deleteFiles, decompress, getUploadPassport, uploadToDaemon, uploadFileChunked, getDownloadPassport, downloadFromDaemon } from "./files";
export { waitFor, sleep, buildZip, buildZipSystem } from "./util";
```

- [ ] **Step 6: Copy the fixture**

`cp daemon/test/fixtures/test.mjs common/test/integration/fixtures/test.mjs` (a COPY; the original stays at `daemon/test/fixtures/test.mjs` for the kept `Instance_router.integration.test.ts`).

- [ ] **Step 7: Commit**

```bash
git add common/test/integration/lib/ common/test/integration/fixtures/
git commit -m "test(common): integration helpers — http/socket/files/util public API + fixture copy"
```

---

## Task 4: `globalSetup.ts` + smoke suite (the de-risk gate)

**Files:**
- Create: `common/test/integration/globalSetup.ts`
- Create: `common/test/integration/suites/_smoke.test.ts`

**Interfaces:** Wires `bootRuntime`/`stopRuntime` to vitest's per-invocation globalSetup. The smoke suite proves the whole stack (boot → `/auth/status` via key → login admin → hit `/auth/overview` → tear down) before ANY module suite is written. **This is the gate: P2 suite fan-out only starts once `_smoke.test.ts` is green.**

- [ ] **Step 1: Write `globalSetup.ts`**

```ts
import { bootRuntime, stopRuntime, type Runtime } from "./lib/bootstrap";
import { world, loadState } from "./lib/world";

let rt: Runtime | null = null;

export async function setup() {
  loadState(); // no-op on a fresh run; picks up state if a suite reuses a prior invocation's runtime file
  rt = await bootRuntime();
}
export async function teardown() {
  if (rt) { await stopRuntime(rt); rt = null; }
}
```

(`world` is imported so the forked test file's import of `world` shares the same singleton address only within a single vitest invocation; cross-file state flows through `.runtime.json` per the existing design — but since each invocation is one suite file, in-file `world` mutation is the common path.)

- [ ] **Step 2: Write the failing smoke test**

`suites/_smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { world, requestPanel, login, loginSessionRetry, ensureUser } from "../lib";

describe("framework smoke", () => {
  it("boots: key hits /auth/status 200 and /service/remote_services_list has the daemon", async () => {
    const r = await requestPanel({ method: "GET", path: "/auth/status", key: world.key });
    expect(r.httpStatus).toBe(200);
    expect(world.daemonId).toBeTruthy();
  });

  it("real login: admin can log in and read /auth/overview", async () => {
    await ensureUser("admin", world.key);          // create-or-verify test_admin (perm 10)
    const s = await loginSessionRetry("admin");   // real cookie + token
    expect(s.cookie.length).toBeGreaterThan(0);
    const ov = await requestPanel({ method: "GET", path: "/auth/overview", key: world.key });
    expect(ov.httpStatus).toBe(200);
    expect((ov.data || []).some((u: any) => u.userName === world.admin.name)).toBe(true);
  });
});
```

- [ ] **Step 3: Run the smoke suite**

Run: `cd common && node test/integration/run.mjs` (the runner iterates `SUITES`; `_smoke` is NOT in `SUITES`, so invoke it directly:)
`node node_modules/vitest/vitest.mjs run --config test/integration/vitest.config.ts test/integration/suites/_smoke.test.ts --reporter=verbose`

Expected: **PASS** — daemon+panel boot, key works, admin created + logged in, `/auth/overview` returns the admin. If it fails: read `common/test/integration/.last-run/{daemon,panel}.log`. Common fixes: build prereq (Task 1 Step 6), `REPO` resolution (Task 2 Step 1), `--unsafe-integration-test-mode` arg spelling (case-insensitive name, case-sensitive key — Task 3 Step 2 / Agent 3 finding).

- [ ] **Step 4: Commit**

```bash
git add common/test/integration/globalSetup.ts common/test/integration/suites/_smoke.test.ts
git commit -m "test(common): integration globalSetup + smoke suite (de-risk gate green)"
```

**— End of P1 (framework). P2 suite fan-out begins; each suite task below is dispatched to a fresh subagent. —**

---

## Task 5: `auth.test.ts` (auth system checks)

**Files:**
- Create: `common/test/integration/suites/auth.test.ts`

**Interfaces:** Consumes `requestPanel`, `login`, `ensureUser`, `createUser`, `world`, `addFinding` from the framework. Produces a green auth suite + any confirmed bug fixes / FINDINGS entries.

**Reference:** the existing `panel/test/integration/integration.test.ts` steps 1–3 (users + login + privilege negatives) and the Mock test "Review Focus #1/#2" pin its assertions — port the assertion shapes, drop the mocks.

Test matrix (each `it` drives the REAL panel; the suite shares one `world`):

- `it("install state machine: GET /auth/status.isInstall reflects users; second /auth/install rejected")` — assert `status.isInstall===true` after the smoke created admin; `POST /auth/install` now returns 500 `installed` (handler throws → protocol 500). Document as a finding if non-200 is ambiguous.
- `it("login → /auth/token requires Ajax; wrong token → 403 on a token route")` — `login(admin)`, then `GET /auth/instance?token=WRONG` → 403 (Review Focus #1).
- `it("forged cookie + fake token → 403")` — `requestPanel({cookie:"koa:sess=fake; koa:sess.sig=fake", token:"FAKE"})` on `GET /instance` → 403.
- `it("apikey path: enableApiKey=false → 403 disabledApiKey (Review Focus #2)")` — with default `systemConfig.enableApiKey=false`, `GET /api/auth/overview` is admin-only; test `PUT /auth/api {enable:true}` by a normal user → rejected; `x-request-api-key: <bogus>` → 403. (If turning `enableApiKey` on is needed, do it via `PUT /overview/setting` with the key, then restore.)
- `it("key bypasses permission ONLY: GET /api/instance?uuid=<real> with key → 403 (Review Focus #1, per-instance gate)")` — create a throwaway instance (admin quick_install or `instance/new`) OR reuse one; assert `GET /instance?uuid=...&daemonId=...` with `key` returns non-200 (403). Add the `F-key-not-instance-admin` finding.
- `it("speedLimit/validator: missing field on a validator route → envelope status 400")` — `POST /auth` with `username:"weak_x", password:"123"` → non-200 (validator reject); `POST /auth/login` without password → 400 `Validator failed` (Review Focus #3, ported).

- [ ] **Step 1:** Write the suite file with the matrix above. Reuse `ensureUser("admin"|"u1"|"u2", world.key)` + `login`/`loginSessionRetry` from the framework; assert via `requestPanel` + `unwrap`.
- [ ] **Step 2:** Run: `cd common && node node_modules/vitest/vitest.mjs run --config test/integration/vitest.config.ts test/integration/suites/auth.test.ts --reporter=verbose`.
- [ ] **Step 3:** Triage per TDD: if a real bug → minimal source fix + regression `it`; if ambiguous (install 400-vs-500, apikey semantics) → `addFinding` + `docs/test-doubts/` Chinese note, mark the `it` `.skip` with a reference (do NOT change product code).
- [ ] **Step 4:** Commit

```bash
git add common/test/integration/suites/auth.test.ts docs/test-doubts/
git commit -m "test(common): auth integration suite (install/login/token/apikey/key-boundary) + doubts"
```

---

## Task 6: `user.test.ts` (user module + 越权)

**Files:** Create `common/test/integration/suites/user.test.ts`

**Interfaces:** Consumes `requestPanel`, `login`, `loginSessionRetry`, `ensureUser`, `ensureOwner`, `createUser`, `world`, `addFinding`.

**Reference:** existing `integration.test.ts` steps 1–4 (admin + normal users + login + 越权) — port the assertions.

Matrix:
- `it("admin can create normal users; duplicate + weak password rejected")` — `createUser` admin + `u1`/`u2` (perm 1); duplicate `u1` → no uuid;
  `Www.123456` accepted, `123` rejected (validator/YYYY).
- `it("normal user cannot create/delete/search/edit others (403)")` — `u1` `POST /auth` → 403; `DELETE /auth` → 403; `GET /auth/overview` → 403;
  `PUT /auth` on another user → 403.
- `it("GET /auth/search paginated + scrubbed (no password/salt/apiKey in data)")` — admin search; assert fields absent.
- `it("越权: u2 cannot read/operate u1's instance (403 on gates, 500 on GET /api/instance)")` (Review Focus #2) — create an instance owned by u1 (via admin ensuring ownership); `u2`
  `GET /api/instance?daemonId&uuid=u1inst` → **500** (handler-throws, finding) and `GET /protected_instance/open`, `GET /files/list`, `POST /protected_instance/stream_channel` → **403**.
- `it("u1 cannot self quick_install (per-instance gate on uuid='-') → 403")` — `POST /protected_instance/asynchronous?uuid=-&task_name=quick_install` as `u1` → 403 (add `F-normal-quickinstall` finding).

- [ ] **Step 1–4:] Write, run (`node node_modules/vitest/vitest.mjs ...suites/user.test.ts`), triage, commit.

```bash
git add common/test/integration/suites/user.test.ts docs/test-doubts/
git commit -m "test(common): user integration suite (CRUD/越权/scrubbing) + doubts"
```

---

## Task 7: `instance.test.ts` (instance module: lifecycle + config)

**Files:** Create `common/test/integration/suites/instance.test.ts`

**Interfaces:** Consumes `requestPanel`, `loginSessionRetry`, `ensureOwner`, `world`, `listFiles`, `waitFor`, `sleep`, `addFinding`, the `test.mjs` fixture (uploaded to the instance).

**Reference:** existing `integration.test.ts` steps 3b–4 (quick_install), 9–11 (config + start + I/O + kill), 12–14 (assign/reinstall/cleanup). The lifecycle is driven via `/protected_instance/*` + `/instance` (panel → socket.io → daemon) — NOT mocked.

Matrix (uses `node test.mjs` as startCommand so lifecycle is fast + deterministic; admin sets startCommand since normal users can't on non-docker):
- `it("admin quick_install creates an instance; waits STOPPED; jar present")` — `POST /protected_instance/asynchronous?uuid=-&task_name=quick_install` as admin; poll `GET /instance?status===0`; `listFiles` shows a `.jar`.
- `it("assign to u1; u1 can read its own instance (200)")` — `ensureOwner("u1")`; `GET /instance` as `u1` → 200 with the right nickname.
- `it("low-priv instance_update (oe/ie/stopCommand/terminalOption) by u1 → 200")` — `PUT /protected_instance/instance_update`.
- `it("normal user CANNOT change startCommand on a non-docker instance (admin can)")` (Review Focus #ff) — `u1` `PUT /instance` with a new startCommand → rejected; admin `PUT /instance` sets `startCommand: "node test.mjs"`; re-assert via `GET /instance`. Add `F-normal-cannot-change-startcmd` finding (this is a "good security" finding, not a bug).
- `it("open → poll RUNNING → command round-trip (via /protected_instance/command)")` — `GET /protected_instance/open` as `u1`; poll `status===3`; `GET /protected_instance/command` "echo ok" → assert output contains `ECHO:ok` (poll instance `outputlog` OR use the streams suite's socket for output; here use `/protected_instance/outputlog` polling).
- `it("stop (graceful, stopCommand 'exit') → STOPPED")` then `it("kill (force) → STOPPED")` then `it("restart → new pid, startCount++")` — drive each via `/protected_instance/{stop,kill,restart}` + poll status.
- `it("delete running instance rejected; delete STOPPED instance → gone")` — `DELETE /instance?deleteFile=true` on running → throws (assert non-200); after stop → 200; `GET /instance` → gone.
- `it("install_instance reinstall wipes uploaded files + re-downloads jar")` — `POST /protected_instance/install_instance` as `u1`; poll STOPPED; `listFiles` no longer has `test.mjs` but has a `.jar`.

- [ ] **Step 1–4:] Write, run, triage, commit.

```bash
git add common/test/integration/suites/instance.test.ts docs/test-doubts/
git commit -m "test(common): instance lifecycle+config integration suite (quick_install/assign/config/open/stop/kill/restart/reinstall/delete)"
```

> Note: this suite downloads a ~52MB jar from `fill-data.papermc.io` (the market preset) → ~2–4 min on first run. The `instance/new` path with `startCommand:"node test.mjs"` (no quick_install) is a faster alternative if the network is flaky — prefer it for the bare-lifecycle `it`s and use quick_install only for the install/reinstall `it`s.

---

## Task 8: `files.test.ts` (file management + upload/download)

**Files:** Create `common/test/integration/suites/files.test.ts`

**Interfaces:** Consumes `requestPanel`, `loginSessionRetry`, `ensureOwner`, `world`, the files helpers (`listFiles`, `mkdirP`, `moveFile`, `copyFile`, `editFile`, `readFileText`, `deleteFiles`, `decompress`, `uploadFile`/`uploadToDaemon`, `uploadFileChunked`, `getDownloadPassport`, `downloadFromDaemon`, `getUploadPassport`), `buildZip`, `buildZipSystem`, `addFinding`.

**Reference:** existing `integration.test.ts` steps 5–8 (files) + the security `describe` (zip-slip, path traversal, key-not-instance-admin), AND the existing `daemon/src/routers/__test__/file_router.security.test.ts` (kept; reads for the in-process assertion shapes to mirror — but drove via the real panel here).

Matrix:
- `it("mkdir → touch → edit (Chinese text) → read → move → copy → delete → verify via list")` (Review Focus #3 happy path) — exercise UTF-8 `"中文"` end-to-end.
- `it("compress (zip) → decompress → byte-identical")` — use `file_zip` binary (boot copies `daemon/lib`).
- `it("upload single-shot multipart → list shows it → upload with unzip=1 → extracted")` — `uploadToDaemon` to `/upload/{password}`.
- `it("upload chunked (/upload-new + /upload-piece) → received tracking → auto-complete")` — `uploadFileChunked` with a 5MB content, `pieceSize: 2MB` → 3 pieces; assert completion.
- `it("download (passport) → /download/{password}/{name} → byte-identical")`.
- `it("download_from_url async: start → poll /files/status → stop")` — `POST /files/download_from_url` then `download_from_url_stop`.
- `it("path traversal: list/move/edit/delete/upload with ../ all rejected (Review Focus #3)")` — `listFiles target:"../../../../etc"` → non-200; `moveFile`/`editFile`/`deleteFiles`/`uploadFile` with `../` → non-200; assert the escape file does NOT exist above the instance cwd.
- `it("zip-slip: a '../' entry upload + decompress rejected; escape file absent")` — `buildZip([{name:"../slipescape.txt",content:"PWNED"},{name:"inside.txt",content:"ok"}])` → upload + `decompress` non-200; `fs.existsSync(path.join(workDir,"daemon/data/InstanceData/slipescape.txt"))===false`.
- `it("per-instance gate: u2 GET /files/list?uuid=u1inst → 403; admin → 200")`.

- [ ] **Step 1–4:] Write, run, triage, commit.

```bash
git add common/test/integration/suites/files.test.ts docs/test-doubts/
git commit -m "test(common): files+upload/download integration suite (CRUD/zip/chunked-upload/download/traversal/zip-slip)"
```

---

## Task 9: `streams.test.ts` (instance I/O streams — multi-socket)

**Files:** Create `common/test/integration/suites/streams.test.ts`

**Interfaces:** Consumes `requestPanel`, `ensureOwner`, `createStream`, `waitForOutput`, `collectText`, `world`, `sleep`, `addFinding`.

**Reference:** existing `integration.test.ts` step 10 (dual-socket Chinese/English broadcast) + step 10p (command-injection inert). Requires an instance running `node test.mjs` (the instance suite's lifecycle or a bootstrapped one here).

Matrix (boot/restart a `node test.mjs` instance in `beforeAll`/first `it`):
- `it("dual-socket broadcast: both sockets see the same ASCII + Chinese line")` (Review Focus #5) — `createStream` ×2; `bothSee("ECHO:hello")` and `bothSee("ECHO:你好世界")` and `bothSee("SUM:5")`.
- `it("multi-line back-to-back ordering on both sockets")` — `echo a` + `echo b` → both sockets contain both.
- `it("both sockets can WRITE; s2.send('pid') → both see PID:")`.
- `it("disconnect s1 → s1.connected false; s2 still receives")`.
- `it("command injection inert: echo x; rm -rf / → ECHO:x; rm -rf / (literal, no shell)")` — add `F-cmd-injection-inert` finding.
- `it("stream/auth wrong password → ready resolves false")`.
- `it("non-owner u2 POST /protected_instance/stream_channel → 403")`.
- `it("instance/stop delivers instance/stopped packet to both sockets")` (stretch).

- [ ] **Step 1–4:] Write, run, triage, commit.

```bash
git add common/test/integration/suites/streams.test.ts docs/test-doubts/
git commit -m "test(common): instance I/O streams multi-socket integration suite (broadcast/injection/auth/stop)"
```

---

## Task 10: `docker.test.ts` (Docker module — Linux + reachable dockerd only)

**Files:** Create `common/test/integration/suites/docker.test.ts`

**Interfaces:** Consumes `requestPanel`, `loginSessionRetry`, `ensureOwner`, `world`, `createStream`, `waitForOutput`, `addFinding`, `waitFor`. Requires Linux + a reachable Docker socket + `node:20-alpine` (auto-pulled) — **every `it` early-returns when `dockerOk=false`**.

**Reference:** existing `daemon/src/routers/__test__/Instance_router.integration.test.ts` (kept) for the `detectDocker()` pattern + the `node:20-alpine` + `test.mjs` bind-mount + cleanup-verification shapes — mirror them, but drive through the **panel** (`/instance` new with `processType:"docker"` + `docker.open`→`/protected_instance/open` etc.) rather than in-process `routerApp`.

- [ ] **Step 1:** Module top:
```ts
import { execSync } from "node:child_process";
const isLinux = process.platform === "linux";
function detectDocker(): boolean {
  if (!isLinux) return false;
  try { execSync("docker info", { stdio: "ignore" }); return true; } catch { return false; }
}
const dockerOk = detectDocker();
const skip = (name: string, fn: () => Promise<any>) => it(name, async () => { if (!dockerOk) return; await fn(); });
```
- [ ] **Step 2:** Matrix using `skip(...)`:
- `skip("image lifecycle: build tiny Dockerfile → GET /environment/image → progress → DELETE")`.
- `skip("docker instance full cycle: new processType=docker (node:20-alpine) → open RUNNING → command round-trip (echo/sum/pid via test.mjs) → stop graceful → kill → restart new container → delete")`.
- `skip("labelled container appears/disappears: docker ps --filter label=mcsmanager.instance.uuid")`.
- `skip("normal user CAN change startCommand on a docker instance (contrast with non-docker)")`.
- `skip("cleanup: no leaked labelled containers after the run (afterAll best-effort kill+remove)")`.
- [ ] **Step 3:** On the dev macOS box (no docker), `node run.mjs` for this suite reports every `it` skipped (early-return) — that's the expected green-on-non-Linux result. On a Linux+Docker CI runner it runs for real.
- [ ] **Step 4:** Commit.

```bash
git add common/test/integration/suites/docker.test.ts docs/test-doubts/
git commit -m "test(common): docker instance integration suite (Linux+docker only; graceful skip otherwise)"
```

---

## Task 11: Cleanup — delete mock tests + harness; remove `panel/test/integration/`

**Note:** Run AFTER Tasks 5–10 are green + committed (so the new suites don't reference the deleted `panel/test/integration/lib/*` — they use `common/test/integration/lib/*`).

**Files:**
- Delete: `panel/test/integration/**` (refactored into common; move `FINDINGS.html` + `.last-run/` content to `common/test/integration/`)
- Delete: `panel/test/harness/**` (`app.ts`, `auth.ts`, `mocks.ts`, `smoke.test.ts`)
- Delete: `panel/src/app/routers/__test__/*.test.ts` (17 files)
- Delete: `panel/src/app/middleware/__test__/permission.test.ts`
- Delete: `daemon/test/harness/smoke.test.ts`
- Delete: `daemon/test/harness/{http,router,mocks}.ts` **partially** — keep the exports imported by the two kept real suites (verify with `grep -r "test/harness" daemon/src/routers/__test__/Instance_router.integration.test.ts daemon/src/routers/__test__/file_router.security.test.ts`); delete only the mock-router-only pieces.
- Delete: `daemon/src/routers/__test__/*.test.ts` **except** `Instance_router.integration.test.ts` + `file_router.security.test.ts` (the 12 mock router tests).
- Modify: `panel/vitest.config.ts` — remove the now-obsolete `exclude: ["test/integration/**"]` line (the folder is gone) + the comment.
- **Keep:** `panel/src/app/service/__test__/login_ban.test.ts`, `panel/src/app/utils/__test__/integration_test_mode.test.ts`, `common/src/__test__/*`, `daemon/test/fixtures/test.mjs`, the two kept daemon real suites.

- [ ] **Step 1:** Verify nothing in the new `common/test/integration/suites/*` imports from `panel/test/integration/`: `grep -rn "panel/test/integration" common/test/integration/` → expect no hits.
- [ ] **Step 2:** Move `panel/test/integration/FINDINGS.html` + any `.last-run/` artifacts to `common/test/integration/FINDINGS.html` (Task 12 extends it).
- [ ] **Step 3:** Delete the files above. For `daemon/test/harness/`, first run the grep to identify kept exports; trim the files to keep ONLY those, then delete `smoke.test.ts`.
- [ ] **Step 4:** Run the survivors to confirm the new test surface:
```bash
cd panel && npm test          # expect: login_ban + integration_test_mode (pure unit) green
cd daemon && npm test         # expect: Instance_router.integration + file_router.security (real) green; (docker early-skips on macos)
cd common && npm test         # expect: common/src/__test__/* pure unit green, unchanged
```
- [ ] **Step 5:** Run the new integration suites to confirm they're unaffected by the deletion:
```bash
cd common && npm run test:integration   # all suites green (docker skipped on macos)
```
- [ ] **Step 6:** Commit

```bash
git add -A
git commit -m "test: delete mock route tests + harnesses; remove panel/test/integration (refactored to common)

Kept: common pure unit tests; panel login_ban + integration_test_mode; the two
real-disk/process daemon suites (Instance_router.integration, file_router.security)
as a daemon-side complement; daemon/test/fixtures/test.mjs. daemon npm test now
runs the two kept real suites; common npm run test:integration covers end-to-end."
```

---

## Task 12: Docs + skills + memory

**Files:**
- Modify: `AGENTS.md` (§8 Testing Quirks, §9 Feature Deep-Dives)
- Modify: `.agents/skills/mcsmanager-test/SKILL.md`
- Modify: `.agents/skills/mcsmanager-docker-instance-test/SKILL.md`
- Create: `docs/integration-test-coverage-2026-09-30.md` (supersedes `docs/backend-test-coverage-2026-09-29.md`)
- Create/Update: `common/test/integration/FINDINGS.html` (the movers + new findings from Tasks 5–10)
- Update memory: `panel-integration-suite.md`, `backend-route-test-suite.md`, add `integration-test-framework.md`

- [ ] **Step 1: Rewrite AGENTS.md §9 "Panel black-box integration tests" entry** — point at `common/test/integration/` (lib + six suites + runner), command `cd common && npm run test:integration`, build prereq, the per-suite boot + sequential-runner rationale (vitest 0.33 parallelism), the `--unsafe` key boundary, the docker skip policy, the deletion of the old mock suites. Rewrite the "Docker + instance integration tests" entry to reference the new `common/test/integration/suites/{instance,docker}.test.ts` (panel-driven) PLUS the kept `Instance_router.integration.test.ts`/`file_router.security.test.ts` (daemon-side low-level).
- [ ] **Step 2: Rewrite AGENTS.md §8** — state the post-migration test surface: `cd common && npm test` (pure unit) + `npm run test:integration` (real-process); `cd panel && npm test` (login_ban + integration_test_mode); `cd daemon && npm test` (the two kept real-disk/process suites). Remove the now-stale references to the deleted harnesses.
- [ ] **Step 3: Update `.agents/skills/mcsmanager-test/SKILL.md`** — per-module commands + expected totals (integration count = sum of the six suites' `it`s; pure unit counts unchanged), build prereq, the `test:integration` runner, which suites survived (pure unit) vs moved (integration). Update the "all four suites in one pass" loop to include `common npm run test:integration` as the integration step.
- [ ] **Step 4: Update `.agents/skills/mcsmanager-docker-instance-test/SKILL.md`** — docker + instance real lifecycle now lives in `common/test/integration/suites/{instance,docker}.test.ts` (panel-driven, real spawned daemon) AND the kept `daemon/src/routers/__test__/Instance_router.integration.test.ts` (in-process low-level); keep the root/sudo Docker requirement, `node:20-alpine` + `test.mjs` prereqs, cleanup verification; note the `threads:false`/`process.chdir` quirk no longer applies to the new (spawned) suite but still to the kept in-process one.
- [ ] **Step 5: Write `docs/integration-test-coverage-2026-09-30.md`** — counts (six suites + their `it`s; the kept pure unit + the 2 kept daemon suites), how to run (`cd common && npm run test:integration`; build prereq; docker auto-skip), known limitations (build prereq; ~52MB jar download on quick_install; docker Linux-only), bugs fixed + doubts list (carried + new), and the relationship (common integration = end-to-end panel-driven; kept daemon suites = daemon-side low-level complement; pure unit = logic).
- [ ] **Step 6: Update auto-memory** — update the existing notes ([[panel-integration-suite]], [[backend-route-test-suite]]) to reflect the new home (`common/test/integration/`), the six suites, the deleted mocks, the runner command, the build prereq; add a new note `integration-test-framework.md` summarizing the framework + the `--unsafe` key boundary + the vitest 0.33 sequential-runner rationale. Add MEMORY.md pointers.
- [ ] **Step 7: Commit**

```bash
git add AGENTS.md .agents/skills/ docs/integration-test-coverage-2026-09-30.md common/test/integration/FINDINGS.html
git commit -m "docs: integration test framework — AGENTS.md §8/§9 + skills + coverage note + findings"
```
(Memory files live outside the repo; update them via the memory tool, not git.)

---

## Task 13: Full green run + verification note

**Files:**
- Modify: `docs/integration-test-coverage-2026-09-30.md` (append the final run results)

- [ ] **Step 1:** Full run:
```bash
cd common && npm test                     # pure unit green
cd panel && npm test                     # login_ban + integration_test_mode green
cd daemon && npm test                    # 2 kept real suites green (docker skips on macos)
cd common && npm run test:integration    # 6 suites green (docker auto-skipped on macos)
```
- [ ] **Step 2:** Capture the totals (suites + `it`s, skipped count for docker) + any non-deterministic flakes into `docs/integration-test-coverage-2026-09-30.md`.
- [ ] **Step 3:** Verify the production builds still pass (the AGENTS §8 contract — panel/daemon webpack is their type check): `cd panel && npm run build && cd ../daemon && npm run build` → both green.
- [ ] **Step 4:** Commit the final verification note.

```bash
git add docs/integration-test-coverage-2026-09-30.md
git commit -m "test: integration test framework — final verification note (all green; docker auto-skipped off-Linux)"
```

---

## Self-Review

1. **Spec coverage:** D1 (common location) → Tasks 1–4 file structure. D2 (per-suite boot + sequential runner) → Task 1 `run.mjs` + Task 4 `globalSetup`. D3 (build prereq) → Task 1 `run.mjs` prereq. D4 (keep pure + kept daemon suites + delete mocks) → Task 11 + KEEP notes. D5 (public API) → Task 3 `index.ts`. D6 (six suites) → Tasks 5–10. D7 (docs/skills/memory) → Task 12. D8 (subagent execution) → handoff below. Every fork + §3 architecture + §5 manifest + §7 phases → covered.
2. **Placeholder scan:** Tasks 2–3 explicitly say "port verbatim from panel/test/integration/lib/*" (a real, present source until Task 11) — not a placeholder but a directed port; the alternative (re-typing the exact `/auth/login` body shape from memory) would be wrong. The suite tasks list concrete `it`s + assertion shapes + the exact endpoint/event per the module-mapping pass — no "TBD". `run.mjs` uses a `require("node:fs")` inside ESM — flagged inline to use the ESM `readdirSync` import instead (fixed before commit). No other red flags.
3. **Type consistency:** `Runtime`, `RawRes`, `Stream`, `World`/`Finding`/`WorldUser`/`WorldInstance` defined once (Tasks 2–3) and reused (Task 4 smoke, Tasks 5–10 suites). `requestPanel` signature `(o:{method,path,key?,cookie?,token?,query?,body?,headers?,timeout?})` consistent across all suites. `createStream(addr,prefix,password)` consistent (suites use `sc1.data.{addr,prefix,password}` from the `POST /protected_instance/stream_channel` response, exactly as the existing `integration.test.ts` step 10 does). `ensureUser`/`ensureOwner`/`loginSessionRetry` role param `"admin"|"u1"|"u2"` consistent.
4. **Review Focus:** #1 (key-boundary 403) → Task 5. #2 (越权 403/500 split) → Task 6. #3 (path traversal) → Task 8. #4 (token/forged/apikey 403) → Task 5. #5 (dual-socket broadcast) → Task 9. All pinned.
5. **Scope/risk:** Tasks 1–4 build + prove the framework alone (de-risk gate = `suites/_smoke.test.ts` green) BEFORE any suite fan-out (Tasks 5–10), so a framework bug is caught cheap. Tasks 5–10 are independent (each a separate suite file + commit), so a subagent-per-suite fan-out is safe. Task 11 (cleanup) runs only after the suites are green, so nothing references the deleted `panel/test/integration/lib/*`. Task 12–13 are docs + verify.
