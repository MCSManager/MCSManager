# MCSManager Auto-Update — Design

Date: 2026-09-06 (last revised 2026-09-07)
Scope: in-place, one-click self-update for the daemon and the control-panel (web) — download a zip package from a configurable update source, overlay its contents onto the install directory, and restart the process so the new build loads.

> This document tracks the **final** implementation. The first draft used a hard-coded file whitelist (`app.js` / `app.js.map` / `package.json` / `public/`); that was replaced by a **whole-package overlay** after review, and several security/availability bugs found in review were hardened. See §7 Verification and the changelog at the end.

## 1. Background & goals

A MCSManager `build.sh` (`BUNDLE=1`) produces fully self-contained bundles:

```
production-code/
├── daemon/   app.js (deps + language packs inlined) + package.json + lib/ (per-platform native binaries, NOT inlined)
└── web/      app.js (self-contained panel)         + package.json + public/ (front-end static build)
```

Both are run as bare `node --max-old-space-size=8192 --enable-source-maps app.js` (see `prod-scripts/linux/start-daemon.sh`, `start-web.sh`). The repository ships no systemd/pm2 templates.

Goal:
1. A **"Update Daemon"** button on the daemon card (`frontend/src/widgets/node/NodeItem.vue`) → downloads the latest daemon zip → overlays it → restarts the daemon.
2. A **"Update Panel"** control at the top of the Settings page (`frontend/src/widgets/Settings.vue`) → downloads the latest web zip → overlays it (app.js + `public/` + anything else in the package) → restarts the panel.
3. Version comparison: the runtime `package.json` `version` is compared against the online version advertised in a remote **manifest**; an update is performed only when the online version is newer.

The update source URL is configurable (`updateSourceUrl`) and points to a `manifest.json`. For local verification a throwaway static HTTP server serves the manifest and the two zips.

## 2. Update source & version manifest

- `updateSourceUrl` = full URL to a `manifest.json`, e.g. `http://localhost:9999/manifest.json`.
- manifest format:

  ```json
  {
    "daemon": { "version": "4.18.4", "url": "http://localhost:9999/daemon.zip" },
    "web":    { "version": "10.18.4", "url": "http://localhost:9999/web.zip" }
  }
  ```

- `compareVersions(a, b)` splits on `.` and compares segments numerically, returning `-1 / 0 / 1`.
- `updateAvailable = compareVersions(manifest.version, currentPackageVersion) > 0`.

## 3. Shared utilities (`common/src/upgrade.ts`)

No new external dependencies: Node built-ins (`http/https/child_process/fs/os/path/stream/net`) plus packages `common` already declares (`fs-extra`, `node-stream-zip`). Both daemon and panel consume `common` from source via the webpack `resolve.alias` (`../common/src/index.ts`), so everything here is available to both bundles.

- **`compareVersions(a, b)`** — dotted version compare.
- **`fetchJson(url, timeoutMs=15000)`** — native http/https GET with redirect following + JSON parse.
- **`downloadToFile(url, destPath, timeoutMs=0, onProgress?)`** — native http/https stream-to-file. `timeoutMs` is a **total deadline** (not just inactivity): on expiry the response is destroyed and the promise rejects, which guards against TARPIT sources that accept the connection but trickle bytes forever.
- **`extractZip(zipPath, destDir)`** — `node-stream-zip` v1 has no `extractAll`; extracting `null` (the root) writes every entry into `outPath`. A **Zip-Slip guard** runs first: after the entries are loaded, every entry's `path.resolve(destDir, name)` must stay inside `destDir`; an entry using `../` or an absolute path is rejected before any extraction (defense against a malicious/tampered update package).
- **`isSupervisedProcess()`** — `true` only under a supervisor that auto-restarts on exit: **systemd** (`INVOCATION_ID`) or **pm2** (`pm_id`). `npm_lifecycle_event` is intentionally NOT counted — plain `npm start`/`npm run` set it but does NOT restart a process that calls `process.exit(0)`, so treating it as supervised would brick the service.
- **`selfRestartProcess({ logger?, port? })`** — restarts the current process so it re-loads the updated `app.js`:
  - Under a supervisor: just `process.exit(0)`; the supervisor relaunches the updated file.
  - Otherwise: spawn a **detached** CommonJS restarter helper (written to `os.tmpdir()`), then `process.exit(0)`. The helper waits for the parent to **release its listening port** — it polls `net.connect(port)`; connection refused ⇒ port free ⇒ parent gone ⇒ relaunch — then spawns `node <execArgv> app.js <argv...>` detached from the same `cwd`, and exits. Port-based detection is used instead of `process.kill(parentPid, 0)` to avoid the OS reusing the parent PID shortly after exit and making the helper wait forever. If no `port` is given, the helper falls back to PID polling. If the helper file cannot be written OR the spawn fails AND there is no supervisor, the function **does not exit** — the current (old-code) process stays alive so the service stays up; the on-disk `app.js` is already the new build and will load on the next manual restart.
- **`applyUpgradePackage({ extractDir, cwd, backupBase, logger?, requiredFiles? })`** — the heart of the update. **Overlays the entire package** onto the install directory:
  - Locates the **package root**: the directory (root of the extracted zip, or a single top-level wrapper folder if the zip has one) that contains one of `requiredFiles` (default `["app.js"]`). This is a **validity gate only** — it rejects malformed/empty packages; it is NOT a replacement whitelist.
  - Recursively lists every file under the package root and copies each onto `cwd/<relativePath>`, recreating directories — i.e. **whatever the package ships gets overlaid** (`app.js`, `package.json`, `lib/`, language packs, `public/`, …).
  - **Skips runtime-state directories at the install root**: `data/`, `logs/`, `__upgrade_staging/`, `node_modules/` are never overwritten (they are runtime state, never part of a build).
  - **Transactional**: before overwriting a file, its current on-disk version is snapshotted into `backupBase`; if any file fails to copy, every file changed so far is restored from the snapshot (or, for files the package newly introduced, removed) and the original error is rethrown.
  - Returns `{ overlays, packageRoot }` where `overlays` is the list of relative paths replaced (for logging).

> **Cross-platform note.** Node reads a `.js` source and closes the handle, so a running `app.js` can be overwritten/renamed on both Linux and Windows (unlike `.node`/`.exe`, which the OS memory-maps and locks while loaded). Overlaying code files therefore works everywhere. The overlay also copies native binaries under `lib/` if the package ships them; on **Windows a loaded native binary is locked and cannot be overwritten**, so that single file's copy fails, the transaction rolls back, the update aborts with a clear error, and the daemon stays on the old version (no corruption). Code-only updates (app.js/public) work on all platforms.

## 4. Daemon self-update (`daemon/src/service/upgrade_service.ts` + `daemon/src/routers/upgrade_router.ts`)

- `daemon/src/entity/config.ts` `Config` gets `updateSourceUrl = ""` and `allowAutoUpdate = true` (persisted via `StorageSubsystem` to `data/Config/global.json`).
- Service:
  - `getUpgradeInfo(data?)` — effective source URL = `data.updateSourceUrl` (panel-forwarded, see §5) else the daemon's local `Config.updateSourceUrl`. Fetches the manifest, compares the `daemon` entry vs `getVersion()`, returns `{ configured, currentVersion, onlineVersion, updateAvailable, updateSourceUrl, error? }`.
  - `performUpgrade(data?)` — mutex-guarded; `allowAutoUpdate` gate; fetch manifest → `daemon` entry; reject if not newer; `downloadToFile(url, staging/daemon.zip, 5min)`; `extractZip` → `staging/extracted`; `applyUpgradePackage({ extractDir, cwd, backupBase: staging/backup, requiredFiles:["app.js"] })`; on success remove `staging` and schedule `selfRestartProcess({ port: config.port })` after 1 s (so the socket reply flushes first); on failure `applyUpgradePackage` has already rolled back, so the handler just cleans staging, releases the mutex, and rethrows.
- Routes (`daemon/src/routers/upgrade_router.ts`, registered in `daemon/src/service/router.ts`):
  - `routerApp.on("upgrade/info", (ctx, data) => …)` → `getUpgradeInfo(data)`
  - `routerApp.on("upgrade/daemon", (ctx, data) => …)` → `performUpgrade(data)`
  - Both async handlers are wrapped in `try/catch` and call `protocol.responseError(ctx, e)` on failure — otherwise the async rejection would never reach `routerApp.emitRouter`'s synchronous catch and the panel's `RemoteRequest` would hang to its timeout.

## 5. Panel self-update + forwarding (`panel/src/app/service/upgrade_service.ts` + `panel/src/app/routers/upgrade_router.ts`)

- `panel/src/app/entity/setting.ts` `SystemConfig` gets `updateSourceUrl = ""` and `allowAutoUpdate = true`. `panel/src/app/routers/settings_router.ts` PUT handler was extended to persist these two fields (the existing handler is a per-field whitelist).
- `panel/src/app/service/upgrade_service.ts` — mirrors the daemon service but reads the manifest **`web`** entry and restarts with `port: systemConfig.httpPort`.
- Routes (`panel/src/app/routers/upgrade_router.ts`, mounted under `/api/upgrade` in `panel/src/app/index.ts`, all `permission({ level: ROLE.ADMIN })`):
  - `GET  /upgrade/panel_info` → panel `getUpgradeInfo()`
  - `POST /upgrade/panel`        → calls `performUpgrade()` (responds before the 1 s restart)
  - `GET  /upgrade/daemon_info?uuid=` → forwards `upgrade/info` to the daemon over the existing socket, **passing `{ updateSourceUrl: systemConfig.updateSourceUrl }` in the request data**, with a 25 s timeout.
  - `POST /upgrade/daemon?uuid=`       → forwards `upgrade/daemon` likewise, with a 180 s timeout (the daemon downloads+extracts+overlays before responding).
  - **Forwarding the panel's `updateSourceUrl`** is what makes "Update Daemon" usable from the web UI: the operator configures one URL in Settings and both the panel self-update and every daemon update use it, without anyone editing each daemon's local config.
- Front-end API definitions carry a `timeout: 5 min` so a large/slow package does not hit the default 30 s axios timeout mid-update.

## 6. Front-end

`frontend/src/services/apis/index.ts` adds `getPanelUpgradeInfo`, `upgradePanel`, `getDaemonUpgradeInfo` (params.uuid), `upgradeDaemon` (params.uuid); the two POST ones set `timeout: 5min`. Shared TS types `IUpgradeInfo` / `IUpgradeResult` live there (and the back-end equivalents live in each service; back-end uses `TXT_CODE_AUTOUPDATE_B_*` i18n keys).

`frontend/src/widgets/node/NodeItem.vue` — appends an "Update Daemon" operation to `nodeOperations` (icon `CloudUploadOutlined`, shown when the node is connected). Click → `Modal.confirm` → `upgradeDaemon({params:{uuid}})` → on success shows "update started, the daemon is restarting and will reconnect"; the overview already polls every 3 s, so the new version shows up automatically after restart.

`frontend/src/widgets/Settings.vue` — adds an update banner at the top of the card body showing the current online version + an "Update now" button + the `updateSourceUrl` input + the `allowAutoUpdate` toggle (saved through the existing settings form). Click → `Modal.confirm` → `upgradePanel()` → full-screen "restarting" overlay → `waitForPanelRestart()` polls `GET /api/auth/status` (a JSON 200 is served only by the panel process, so a reverse-proxy root does not falsely satisfy it) and **rejects on timeout** (no false "updated successfully" if the panel fails to come back); on success it reloads the page to pick up the new front-end bundle.

i18n: front-end keys `TXT_CODE_AUTOUPDATE_*` in `languages/en_US.json` + `zh_CN.json` (other locales fall back to `en_us` via `fallbackLocale`); back-end keys `TXT_CODE_AUTOUPDATE_B_*` (back-end `i18next` uses `{{v}}` double-brace interpolation, front-end `vue-i18n` uses `{v}`).

## 7. Verification

`scripts/verify-auto-update.mjs` is an autonomous, headless end-to-end harness that drives the **real** upgrade HTTP endpoints:

1. (Re)build update packages + manifest with `scripts/build-update-packages.mjs`.
2. Start a local static update server `scripts/update-test-server.mjs` on `:9999`.
3. Boot a fresh daemon (`production-code/daemon`) and panel (`production-code/web`), run the panel install + login flow, and configure the panel's `updateSourceUrl` via `PUT /api/overview/setting` (exercising settings persistence).
4. Assert `GET /api/upgrade/panel_info` → update available; find the daemon UUID; assert `GET /api/upgrade/daemon_info?uuid=…` → update available (this also proves the **forwarded updateSourceUrl** path: the daemon has no local config, the panel's URL is used).
5. `POST /api/upgrade/panel` → panel self-updates + restarts → assert on-disk `package.json` is the new version, re-login, assert `panel_info.currentVersion` is new.
6. `POST /api/upgrade/daemon?uuid=…` → daemon self-updates + restarts → poll `/api/overview` until the daemon reconnects with the new version; assert on-disk `package.json` is the new version.
7. Each update package also ships an `OVERLAY_MARKER.txt` at the package root; asserting its presence in the install dir after each update proves the **whole-package overlay** (the old hard-coded whitelist would have ignored it).

Run it with `node scripts/verify-auto-update.mjs` (see the separate **[Test Plan](./2026-09-07-auto-update-testing.md)** document).

## 8. Risks & mitigations

- **Zip-Slip** — `extractZip` validates every entry resolves inside `destDir` before extraction.
- **Service brick on `npm start`** — `isSupervisedProcess` only counts systemd/pm2; bare node and `npm start` get the detached restarter.
- **Restarter never launches (PID reuse)** — restarter polls the listening port, not the parent PID.
- **Spawn failure** — `selfRestartProcess` keeps the old process alive instead of exiting.
- **TARPIT download** — `downloadToFile` enforces a total deadline (5 min) and aborts.
- **Partial overlay on failure** — `applyUpgradePackage` snapshots + restores changed files (transactional).
- **Panel unreachable during restart / behind reverse proxy** — front-end polls `/api/auth/status` (JSON 200) and rejects on timeout.
- **Forward timeouts too short** — daemon_info 25 s (≥ internal manifest 15 s); daemon 180 s (≥ worst-case download+overlay).
- **Windows native binaries** — locked while loaded; overlay of a loaded `lib/*.node`/PTY fails → transaction rolls back → update aborts cleanly (no corruption). Code updates work everywhere.
- **Concurrency / double-trigger** — a module-level `upgradeInProgress` mutex in each service.

## Changelog
- 2026-09-06: initial design (hard-coded file whitelist, pre-review).
- 2026-09-07 (review + overlay): replaced the file whitelist with whole-package overlay (`applyUpgradePackage`); added Zip-Slip guard, port-based restarter, narrowed supervisor detection, total download timeout, transactional backup/rollback, panel-forwarded `updateSourceUrl`, expanded forward/axios timeouts, front-end probe + reject-on-timeout, back-end i18n. Consolidated the overlay/backup/restart orchestration into `common/upgrade.ts`, removing the per-side duplication.
