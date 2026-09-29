---
name: mcsmanager-build
description: Build/compile/package/production-deploy skill for the MCSManager project. Use when the user says keywords such as build、compile、package、production build, deploy production-code, etc., or asks to produce/run a production-code production build. Covers the BUNDLE=1 build pipeline (common → daemon/panel/frontend), production-code layout, deploy & run (web 23333 / daemon 24444), paired data migration, sensitive files, and post-deploy verification. Use ONLY for MCSManager build/deploy/run tasks.
---

# MCSManager Build & Production Deployment

## Workflow (when receiving a build/deploy request)

1. **Confirm the goal**: build artifacts only / build + deploy to a specified directory / build + deploy + run.
2. **Check existing data**: if the target location or `production-code/` already has a runtime `data/` (accounts, nodes, instances), ask whether to reuse or start fresh; if reusing, migrate `web/data` + `daemon/data` **as a pair** (see §6).
3. **Back up before building**: `build.bat` / `build.sh` deletes `production-code/` entirely at the start (including `data/`), so back it up before building.
4. Run the build (§4) → assemble artifacts (§2) → deploy and run (§5) → verify (§5 verification checklist).

## 1. Build script walkthrough

1. **`BUNDLE=1` (the key switch)**: passed to panel/daemon's webpack, it inlines the entire npm dependency tree + all language packs (static `@languages` imports) into a **single self-contained `app.js`**. The artifact runs with bare `node`, **no `npm install` needed at runtime**. Mechanism: `panel/webpack.config.js`, `daemon/webpack.config.js`.
2. **`npm run preview-build`** (misleading name): it is actually `cd common && npm install && npm run build` (tsc → `common/dist/`). panel/daemon compile `common/src` source directly via tsconfig `paths` + webpack `resolve.alias`, so **after changing `common/` you must rebuild panel and daemon**.
3. Clean old artifacts: `production-code/`, `daemon/{dist,production}`, `panel/{dist,production}`.
4. Build the three ends: `daemon` webpack → `daemon/production/app.js`; `panel` webpack → `panel/production/app.js`; `frontend` = `vue-tsc` type check + vite → `frontend/dist/` (type errors abort the build).
5. Assemble artifacts into `production-code/` (layout see §2), clean up intermediate directories.
6. If `daemon/lib/` exists, copy it into the artifacts as-is — platform binaries are **not bundled** (see §3).

Harmless build-time warnings: log4js `Critical dependency ... is an expression` (dynamic require of appenders; upstream behaves this way); vite chunk > 1024 kB notice (size hint only).

## 2. Artifact layout

```
production-code/
├── daemon/                      # Node process (runs app.js with cwd = this directory)
│   ├── app.js                   # self-contained artifact (BUNDLE=1)
│   ├── app.js.map
│   ├── package.json             # version info only; no dependency install needed at runtime
│   ├── package-lock.json
│   └── lib/                     # external platform binaries (see §3)
└── web/                         # Panel process (runs app.js with cwd = this directory)
    ├── app.js / app.js.map
    ├── package.json / package-lock.json
    └── public/                  # frontend static assets (frontend/dist)
```

At runtime the two processes each create `data/` (persistence) and `logs/` (logs) under their cwd.

## 3. External binaries `daemon/lib/` (not packaged into app.js)

| File                                   | Purpose                        | Source                                                                                |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| `pty_<platform>` / `pty_win32_x64.exe` | terminal PTY                   | `lib-urls.txt`, downloaded by `install-dependents.bat`                                |
| `file_zip_*` / `7z_*`                  | compress/decompress            | same as above (MCSManager/Zip-Tools)                                                  |
| `steamcmd.exe` (or `steamcmd_<arch>`)  | Steam game server installation | `STEAM_CMD_PATH` in `daemon/src/const.ts`; `initSteamCmd()` auto-downloads if missing |

Under `BUNDLE=1`, webpack marks `.node` native acceleration modules (ssh2's `sshcrypto.node`, bufferutil / utf-8-validate) as external: at runtime `require` throws `MODULE_NOT_FOUND`, which the caller catches with try/catch and **falls back to pure JS** — this is not an error.

## 4. Manual build (equivalent to `build.bat`, useful for step-by-step troubleshooting)

```powershell
# 1) Compile common (preview-build)
cd common; npm install; npm run build

# 2) Clean (back up data/ first if production-code exists)
Remove-Item -Recurse -Force production-code, daemon\dist, daemon\production, panel\dist, panel\production, frontend\dist

# 3) Build the three ends (daemon/panel must have BUNDLE=1; can run in parallel in different terminals)
cd ..\daemon;    $env:BUNDLE='1'; npm run build
cd ..\panel;     $env:BUNDLE='1'; npm run build
cd ..\frontend;  npm run build

# 4) Assemble (in the repo root)
New-Item -ItemType Directory -Force production-code\daemon, production-code\web, production-code\web\public
Copy-Item daemon\production\app.js, daemon\production\app.js.map, daemon\package.json, daemon\package-lock.json -Destination production-code\daemon\
Copy-Item panel\production\app.js, panel\production\app.js.map, panel\package.json, panel\package-lock.json -Destination production-code\web\
Copy-Item frontend\dist\* -Destination production-code\web\public\ -Recurse
Copy-Item daemon\lib -Destination production-code\daemon\lib -Recurse   # copy only if it exists
```

- To run `build.bat` from a script, use `cmd /c "build.bat < nul"` to skip the trailing `pause`.
- Install dependencies before the first build: `install-dependents.bat` (which also downloads the `daemon/lib` binaries).

## 5. Deploy and run

After copying the whole `production-code/` to the deployment directory (daemon first, then web):

```powershell
cd <deploy-dir>\daemon; node --enable-source-maps --max-old-space-size=8192 app.js
cd <deploy-dir>\web;    node --enable-source-maps --max-old-space-size=8192 app.js   # add --open to auto-open the browser
```

- `node_app.exe` in `prod-scripts/windows/start.bat` is the **node binary bundled with the official release package**; source-built artifacts use the system `node` directly (16+, CI runs 16.x/20.x; the verified environment in 2026-09 was node 22).
- Default ports: web panel **23333**, daemon **24444** (`ws://localhost:24444`).
- **First startup**: when the user count is 0, the frontend enters the installation wizard (backend `/install` in `login_router.ts`), where you create the first admin account (permission 10). There is no default root password.
- **Migrating existing data**: copy `web/data/` + `daemon/data/` as a pair to preserve accounts, nodes, and instances. The two must be migrated **as a pair**: the access key in daemon `data/Config/global.json` and the apiKey in panel `data/RemoteServiceConfig/*.json` are paired credentials.
- Stopping: Ctrl+C in the corresponding console window, or terminate the respective `node` process.

### Verification checklist

1. `Get-NetTCPConnection -State Listen`: 23333 and 24444 are listening;
2. `Invoke-WebRequest http://127.0.0.1:23333` returns 200 (frontend index.html);
3. `web/logs/current.log` shows `Connected to remote daemon ... key validation successful`;
4. `daemon/logs/current.log` shows `Session ... has successfully authenticated`.

## 6. Data and security

- JSON models all go through `StorageSubsystem` (`common/src/system_storage.ts`): atomic write to `data/<Category>/<uuid>.json` (tmp + rename). Do not hand-roll `fs.writeFile` for persistence.
- Sensitive files (do not print their contents, do not commit, and remove before packaging/distribution):
  - `daemon/data/Config/global.json` — panel↔node access key;
  - `web/data/User/*.json` — apiKey, password hash, 2FA secret;
  - `web/data/RemoteServiceConfig/*.json` — node apiKey.
- `daemon/data/InstanceConfig/global0001.json` (`__MCSM_GLOBAL_INSTANCE__`) is the global instance settings template and is **not counted as an instance** (the log `All 0 instances` is normal).

## 7. FAQ

| Symptom                                      | Explanation                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Version changed from X to Y` (web log WARN) | Version-adaptation log only (`version_adapter.ts`); data format is compatible, no action needed      |
| `All 0 instances have been loaded`           | See §6; the template file does not count as an instance                                              |
| `.node` / `bufferutil` MODULE_NOT_FOUND      | native acceleration package not bundled; automatically falls back to pure JS (§3)                    |
| Changes to `common/` have no effect          | must rebuild panel + daemon (§1 item 2)                                                              |
| Want to keep old data after building         | the script deletes `production-code/` entirely; back up `web/data` and `daemon/data` before building |
