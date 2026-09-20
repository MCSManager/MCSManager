# MCSManager Auto-Update — Test Plan

Date: 2026-09-07
Feature: in-place self-update of the daemon and the control panel (web) via a downloaded zip package. See the companion [design document](./2026-09-06-auto-update-design.md).

This plan covers three complementary test modes:
- **Automated end-to-end (primary):** `scripts/verify-auto-update.mjs` — a headless harness that drives the real upgrade HTTP endpoints against fresh daemon/panel processes and asserts the full download → overlay → restart → reconnect flow. This is what you run to prove the feature works.
- **Automated strict / negative cases:** `scripts/verify-auto-update-strict.mjs` — runs on one fresh panel and additionally proves that (0) an unconfigured source reports `configured:false`, (A) an already-latest version does nothing, (B) a Zip-Slip package is rejected, (B2) a package missing `app.js` is rejected before any overlay, (B3) a disabled auto-update is guarded, and (C/D) a real content update actually replaces `app.js` + `public/` and restarts.
- **Manual / browser:** exercising the actual UI buttons against the same local update server.

---

## 1. What is under test

| Area | Tested behaviour |
|---|---|
| Version compare | `getVersion()` (runtime `package.json`) vs manifest online version; update only if online is newer |
| Manifest fetch | `updateSourceUrl` → `manifest.json` → `{daemon, web}` entries |
| Daemon self-update | socket `upgrade/daemon`: download, extract, overlay, self-restart |
| Panel self-update | HTTP `POST /api/upgrade/panel`: download, extract, overlay (incl. `public/`), self-restart |
| Panel→daemon forwarding | panel forwards its own `updateSourceUrl` so a daemon with no local config can be updated from the UI |
| Whole-package overlay | every file/dir in the package is overlaid (not a fixed whitelist); runtime-state dirs (`data/`, `logs/`, …) are skipped |
| Transactional rollback | on any failure mid-overlay, changed files are restored |
| Self-restart | detached restarter (port-based) relaunches `node app.js` after exit; supervisor detection |
| Front-end restart UX | panel update overlay + reconnect; false-success prevention |

---

## 2. Test artifacts (committed)

All live under `scripts/` (the generated zips + logs under `scripts/update-packages/` are git-ignored).

| Artifact | Purpose |
|---|---|
| `scripts/build-update-packages.mjs` | Builds the two update zips + `manifest.json` from `production-code/`. Bumps only `package.json.version` in each zip (the version is read at runtime from `package.json`, so the shipped `app.js` is byte-identical to the running one — this still exercises the whole pipeline). Also drops an `OVERLAY_MARKER.txt` at each package root to prove whole-package overlay. |
| `scripts/update-test-server.mjs` | Tiny static HTTP server on `:9999` serving `manifest.json`, `daemon.zip`, `web.zip`. |
| `scripts/verify-auto-update.mjs` | The orchestrator: builds packages, starts the server + a fresh daemon + a fresh panel, drives the upgrade endpoints, asserts each step, cleans up. |
| `scripts/verify-auto-update-strict.mjs` | The strict/negative orchestrator: unconfigured, already-latest, Zip-Slip, missing-`app.js`, disabled, and real content-update scenarios on one fresh panel. Restores a pristine snapshot of `production-code` afterwards so it is idempotent. |
| `scripts/auto-update-test-utils.mjs` | Cross-platform helpers (`makeZip`/`listZip` via `zip` or Windows `tar.exe`; `killPort`/`killPattern`/`killChild` via `lsof`/`pkill` or Windows `netstat`/`taskkill`/PowerShell). |

> The version-bumped-package trick keeps the verification honest and fast: the report-version genuinely changes on disk and via the API after restart, while avoiding a second full webpack build.

---

## 3. Automated end-to-end test (run this)

### 3.1 Prerequisites
1. A clean build of the current source: `bash build.sh` (or `build.bat` / the manual steps on Windows; produces `production-code/{daemon,web}` at the baseline versions, currently `daemon@4.18.3`, `panel@10.18.3`).
2. `node` (≥ 18; the harness uses global `fetch`, `fs.cpSync`, etc.).
3. Ports `9999`, `23333`, `24444` free (the harness kills anything on them at start and on exit).
4. **Cross-platform:** Linux/macOS use `zip`/`unzip`/`lsof`/`pkill`; Windows uses the bundled `tar.exe` (zip read/write) plus `netstat`/`taskkill`/PowerShell for process cleanup. Both are supported; the harnesses are idempotent and safe to re-run.

### 3.2 Run
```
node scripts/verify-auto-update.mjs          # primary happy-path end-to-end
node scripts/verify-auto-update-strict.mjs   # strict / negative cases (recommended)
```
Expected wall-clock: ~60–90 s each. Exit code `0` and the banner:
```
================ RESULT ================
Panel  self-update: 10.18.3 -> 10.18.4  OK (whole-package overlay verified)
Daemon self-update: 4.18.3 -> 4.18.4  OK (whole-package overlay verified)
=======================================
```

### 3.3 What the harness asserts (step by step)
| Step | Action | Assertion |
|---|---|---|
| 0 | Kill stale ports; reset `data/` of daemon+panel; remove `__upgrade_staging`/`.bak` leftovers; restore baseline `package.json` | clean slate, deterministic re-run |
| 1 | `build-update-packages.mjs` | `daemon.zip` (v4.18.4) + `web.zip` (v10.18.4) + `manifest.json` created |
| 2 | Start update server on :9999 | port up |
| 3 | Start daemon (write config + random key; **no local `updateSourceUrl`**) | port 24444 up; `allowAutoUpdate=true` default |
| 4 | (skipped — daemon update relies on the panel-forwarded URL) | — |
| 5 | Start panel on :23333 | port up |
| 6 | `POST /api/auth/install` (admin) → `GET /api/auth/logout` → `POST /api/auth/login` | admin created; login returns a real session **token** (not the `"Logined"` short-circuit) |
| 7 | `GET /api/overview/setting` → merge `updateSourceUrl`+`allowAutoUpdate` → `PUT` | settings persist (200) |
| 8 | `GET /api/upgrade/panel_info` | `configured:true`, `currentVersion=10.18.3`, `updateAvailable:true`, `onlineVersion=10.18.4` |
| 9 | Poll `GET /api/service/remote_services_list` | panel connected to a daemon (available) |
| 10 | `GET /api/upgrade/daemon_info?uuid=…` | daemon `configured:true` via the **forwarded** `updateSourceUrl` (the daemon has none locally), `updateAvailable:true`, `onlineVersion=4.18.4` |
| 11 | `POST /api/upgrade/panel` | `{started:true, onlineVersion:"10.18.4"}` |
| 12 | Poll `GET /api/auth/status` until 200; then read on-disk `production-code/web/package.json` | panel restarted; `version = 10.18.4`; `OVERLAY_MARKER.txt` present in web dir (whole-package overlay) |
| 13 | re-login; `GET /api/upgrade/panel_info` | `currentVersion = 10.18.4`, `updateAvailable:false` |
| 14 | `POST /api/upgrade/daemon?uuid=…` (forwarded) | `{started:true, onlineVersion:"4.18.4"}` |
| 15 | Poll `GET /api/overview` until the daemon reconnects; read on-disk `production-code/daemon/package.json` | daemon back online `version = 4.18.4`; `OVERLAY_MARKER.txt` present in daemon dir |

After step 15 the harness removes the two marker files (so `production-code` stays pristine), kills all spawned processes (and any detached relaunches by pattern + port), and exits.

### 3.4 Determinism & cleanup
- Step 0 restores the baseline `package.json` and wipes runtime `data/`, so consecutive runs are independent.
- The harness cleans up on both success and failure (SIGINT/SIGTERM handlers + `process.on('exit')`), killing by child handle, by command pattern (POSIX `pkill -f …` / Windows `Get-CimInstance Win32_Process`), and by port (POSIX `lsof` / Windows `netstat` + `taskkill`).
- Per-run logs: `scripts/update-packages/verify-{server,daemon,panel}.log` (grep `[AutoUpdate …]` for the upgrade trace).

### 3.5 Pass / fail criteria
- **Pass:** the `[verify]` lines show `ok:` for every assertion and the final `RESULT` banner with both `OK`; no `[verify][ERROR] ASSERT FAILED`; exit `0`; no listeners left on 9999/23333/24444.
- **Fail:** any `ASSERT FAILED` line names the offending step; the daemon/panel log tails usually reveal the cause (download/extract/overlay error, port not released, version mismatch). Re-run after fixing — the harness is idempotent.

---

## 4. Manual / browser test

For UI-level confidence (the automated test drives the same endpoints the UI calls, but this exercises the actual buttons + reconnect/reload flows):

1. Build + run the baseline:
   ```
   bash build.sh
   node scripts/build-update-packages.mjs          # make daemon.zip / web.zip / manifest
   node scripts/update-test-server.mjs &           # serve on :9999
   cd production-code/daemon && node --enable-source-maps app.js   # terminal A
   cd production-code/web    && node --enable-source-maps app.js   # terminal B
   ```
2. Open the panel in a browser (`http://localhost:23333`), complete first-run install, log in.
3. **Configure the source:** Settings → top "Panel Update" banner → enter `http://localhost:9999/manifest.json` into "Update source" → Save.
4. **Update the panel:** the banner should now show `New version available: 10.18.4` with an enabled "Update Panel" button. Click it → confirm → expect the full-screen "The panel is restarting, please wait…" overlay, then an automatic page reload. After reload the banner shows `currentVersion 10.18.4` / "Up to date".
5. **Update a daemon:** go to the daemon card → click the **"Update Daemon"** icon (`CloudUploadOutlined`) → confirm → expect "update started, the daemon is restarting" toast. The card's version refreshes within ~3 s (overview auto-poll) to `4.18.4`.
6. (Optional) Inspect logs: `[AutoUpdate …]` lines in the respective `logs/` dir show the download/extract/overlay/restart trace.

> The manual flow uses the **forwarded** `updateSourceUrl` for the daemon (you only configure the source once, on the panel), which is exactly the path the automated test asserts in steps 10/14.

---

## 5. Scenario matrix

| # | Scenario | Covered by | Expected |
|---|---|---|---|
| 1 | Newer version available → update | automated (daemon+panel) | files overlaid, process restarts, version changes, marker lands |
| 2 | Whole-package overlay (non-whitelisted file) | automated (`OVERLAY_MARKER.txt`) | marker present in install dir after update |
| 3 | Daemon updated with no local config (panel-forwarded URL) | automated step 10/14 | `configured:true`, update succeeds |
| 4 | `updateSourceUrl` empty / not configured | automated (basic step 6.5 + strict scenario 0) + manual | `configured:false`; banner shows "not configured"; "Update" disabled |
| 5 | Already on latest version | strict scenario A / code path in `performUpgrade` | `{started:false, message:"Already up to date (v…)"}`; no restart |
| 6 | Update aborted mid-overlay (e.g., disk full) | transactional `applyUpgradePackage` | changed files restored from snapshot; service stays up on old version; error returned |
| 7 | Malicious zip with `../` entry (Zip-Slip) | strict scenario B / `extractZip` guard | extraction rejected before any write; update aborts with "Zip-slip detected" |
| 8 | Package missing `app.js` | strict scenario B2 / `requiredFiles:["app.js"]` gate | `applyUpgradePackage` throws "Required file not found"; no overlay |
| 9 | Slow / stalled download (TARPIT) | `downloadToFile` total timeout (5 min) | download aborts; mutex released; error returned |
| 10 | Panel restart behind a reverse proxy | manual / `waitForPanelRestart` probes `/api/auth/status` (JSON 200) | no false "alive" from proxy root; reload only on real panel-up; rejects on timeout |
| 11 | Bare node vs systemd vs `npm start` | supervisor detection | bare node & `npm start` get the detached restarter; systemd/pm2 just exit |
| 12 | Windows native binary in package | overlay attempts it | on Windows the loaded `lib/*` binary is locked → that file's copy fails → transactional rollback → clean abort (no corruption); code-only updates still work |

Scenarios 1–5, 7, 8 are exercised by the automated harnesses; scenario 0/B3 (unconfigured / disabled) are covered by the strict harness too. 6, 9, 11, 12 are covered by the design's guards (see design §8); they can be exercised manually by crafting a bad zip / killing disk space / inspecting the supervisor-detection branch.

---

## 6. Re-generating the update packages

If the build changes, regenerate before re-running:
```
bash build.sh                          # (or build.bat on Windows) rebuild production-code from current source
node scripts/build-update-packages.mjs # rebuild daemon.zip / web.zip / manifest.json (bumped versions)
```
`build-update-packages.mjs` reads the bumped versions from its own constants (`DAEMON_NEW_VERSION` / `WEB_NEW_VERSION`); bump them along with `daemon/package.json` / `panel/package.json` when the baseline version changes.
