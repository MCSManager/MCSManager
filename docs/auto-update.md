# Auto-Update: Panel & Daemon Self-Update

This document is the reference for the MCSManager auto-update feature. Read it
before touching anything under `**/upgrade_*`, `common/src/upgrade.ts`,
`scripts/*update*`, or the update UI in `Settings.vue` / `NodeItem.vue`.

> Historical context: `docs/superpowers/specs/2026-09-06-auto-update-design.md`
> and `2026-09-07-auto-update-testing.md` are the original design/test specs.
> They are partially outdated (e.g. the `allowAutoUpdate` switch and the
> Settings top banner were removed; the UI now lives in the left tab bar).
> This file reflects the current implementation.

## 1. Overview

Operators can update the **panel (web)** and any **remote daemon (node)** from
the web UI — no manual file replacement, no SSH. Updates are **manual and
explicit**; nothing is downloaded or applied in the background.

| Target | Trigger surface | What gets updated |
| --- | --- | --- |
| Panel | Settings → "Auto Update" tab → "Update Panel" button | `app.js`, `package.json`, `public/` (front-end bundle), plus whatever the package ships |
| Daemon | Node card → operator button group → "Update Daemon" | daemon `app.js`, `package.json`, `lib/`, etc. |

Both flows download a zip from an operator-configured **update source**
(`updateSourceUrl`, a manifest URL) and overlay the whole package onto the
install directory. The new build takes effect only after a **manual restart**:
the UI shows a "restart to apply" modal and the process log records a
reminder — nothing restarts by itself.

## 2. Architecture / data flow

```
frontend
  Settings.vue (autoUpdate tab)              node/NodeItem.vue (update icon + button)
      |  GET/POST /api/upgrade/panel*            |  GET/POST /api/upgrade/daemon*
      v                                          v
panel/src/app/routers/upgrade_router.ts --(socket.io "upgrade/*", forwards updateSourceUrl)--> daemon/src/routers/upgrade_router.ts
      v                                          v
panel/src/app/service/upgrade_service.ts   daemon/src/service/upgrade_service.ts
      \_______________ both build on ______________/
                       common/src/upgrade.ts
        fetchJson -> downloadToFile -> extractZip -> applyUpgradePackage  (then: manual restart)
                                |
                                v
     updateSourceUrl -> manifest.json -> { web | daemon: { version, url, notes } } -> *.zip
```

`common/` is compiled into panel and daemon via source alias (tsconfig `paths` +
webpack `resolve.alias`), so changes there require rebuilding both apps.

## 3. Manifest schema

`updateSourceUrl` points at a small JSON document (see
`scripts/update-packages/manifest.json` and its generator
`scripts/build-update-packages.mjs`):

```json
{
  "daemon": {
    "version": "4.18.4",
    "url": "https://example.com/daemon.zip",
    "notes": {
      "en_us": "MCSManager Daemon v4.18.4\n- Bug fixes and performance improvements",
      "zh_cn": "MCSManager 守护进程 v4.18.4\n- 问题修复与性能改进"
    }
  },
  "web": {
    "version": "10.18.4",
    "url": "https://example.com/web.zip",
    "notes": { "en_us": "...", "zh_cn": "..." }
  }
}
```

- **`version`** — dotted numeric string. Compared with `compareVersions()`
  (`common/src/upgrade.ts`): split on `.`, compare segment-wise numerically,
  missing segments count as `0`. This is intentionally **not** strict semver.
- **`url`** — full http/https URL of the update zip (redirects are followed).
- **`notes`** *(optional)* — release notes of the new version, shown in the UI
  after a version scan:
  - Preferred form: a **locale → text map**. Keys are runtime locale codes
    (lowercase region, e.g. `en_us`, `zh_cn` — same shape as
    `toStandardLang()` output). Matching is case- and hyphen-insensitive, so
    `en-US` works too.
  - A plain **string** is accepted as language-neutral fallback text.
  - Resolution (`frontend/src/tools/localizedNotes.ts::pickLocalizedNotes`):
    exact locale → base language (`zh_cn` → `zh`) → `en_us` → `en`; if nothing
    matches the section is hidden. A missing English entry is a malformed
    manifest.
- Top-level `daemon` / `web` entries are **optional**; a missing entry for the
  side being updated yields `TXT_CODE_AUTOUPDATE_B_MANIFEST_MISSING`.

Language selection happens in the **frontend** (against the current panel UI
language, `getCurrentLang()`), not in the backend: the manifest is fetched by
the panel/daemon service, but only the browser knows the language the user is
actually looking at. The backend therefore passes `onlineNotes` through
untouched (`string | Record<string, string>`).

## 4. Key components

| Layer | File | Role |
| --- | --- | --- |
| shared | `common/src/upgrade.ts` | `compareVersions`, `fetchJson`, `downloadToFile`, `extractZip` (Zip-Slip guard), `applyUpgradePackage` (transactional overlay) |
| panel | `panel/src/app/service/upgrade_service.ts` | manifest fetch (uses `web` entry), version compare, download/overlay (no auto-restart) |
| panel | `panel/src/app/routers/upgrade_router.ts` | `/api/upgrade/panel_info`, `/api/upgrade/panel`, `/api/upgrade/daemon_info`, `/api/upgrade/daemon` (ADMIN only); forwards panel `updateSourceUrl` to daemons |
| daemon | `daemon/src/service/upgrade_service.ts` | same as panel side, for the `daemon` entry; `updateSourceUrl` override (forwarded) wins over local config |
| daemon | `daemon/src/routers/upgrade_router.ts` | socket.io `upgrade/info`, `upgrade/daemon` |
| config | `panel/src/app/entity/setting.ts`, `daemon/src/entity/config.ts` | `updateSourceUrl` (default: official source URL; empty ⇒ feature disabled) |
| frontend API | `frontend/src/services/apis/index.ts` | `IUpgradeInfo` / `IUpgradeResult`, `getPanelUpgradeInfo`, `upgradePanel`, `getDaemonUpgradeInfo`, `upgradeDaemon` |
| frontend UI | `frontend/src/widgets/Settings.vue` | auto-update tab: status tags, source URL input, update button, localized release-notes box |
| frontend UI | `frontend/src/widgets/node/NodeItem.vue` | update icon + tooltip next to the daemon version, "Update Daemon" in the operator button group |
| frontend util | `frontend/src/tools/localizedNotes.ts` | release-notes locale resolution (unit-tested) |
| test harness | `scripts/build-update-packages.mjs`, `scripts/update-test-server.mjs`, `scripts/verify-auto-update.mjs`, `scripts/verify-auto-update-strict.mjs`, `scripts/auto-update-test-utils.mjs` | local packages + static server + E2E verification (see §6) |

## 5. Design decisions & rationale

- **Manual, explicit updates.** No background polling for updates, no silent
  installs. The operator scans (via the refresh button / page load), reviews the
  release notes, and clicks update.
- **Whole-package overlay** instead of a fixed file whitelist
  (`app.js`/`package.json`/`public`). Whatever the package ships is copied over,
  so updates can add new files (e.g. new front-end assets). Runtime-state
  directories are skipped: `data/`, `logs/`, `__upgrade_staging/`,
  `node_modules/` (`OVERLAY_SKIP_TOP_DIRS` in `common/src/upgrade.ts`).
- **Transactional apply.** `applyUpgradePackage` backs up every file it will
  overwrite into `__upgrade_staging/backup`, applies the overlay, and rolls back
  (restores backups, deletes added files) if any single copy fails. The staging
  area is deleted on success.
- **Validity gate before mutation.** The package must contain `app.js`
  (`requiredFiles`); a package without it is rejected before anything is
  written.
- **Zip-Slip protection.** `extractZip` resolves every entry and refuses
  entries escaping the destination directory. node-stream-zip's own guard is a
  second layer.
- **Download deadline, not idle timeout.** `downloadToFile(url, dest, timeoutMs)`
  enforces a *total* deadline (5 min for update zips) so a slow-drip (TARPIT)
  source cannot hold the upgrade lock forever.
- **Upgrade lock.** A single `upgradeInProgress` flag per process prevents
  concurrent upgrades.
- **No automatic restart.** An update only overlays files on disk; the running
  process keeps the old build in memory. The UI shows a `Modal.success` popup
  and the process log records a reminder, both telling the operator to restart
  the panel/daemon manually (systemd/pm2 restart, Ctrl+C + start, ...) for the
  new version to take effect. `getVersion()` is read at startup, so the API
  keeps reporting the old version — and keeps offering the update — until that
  restart happens.
- **Panel forwards `updateSourceUrl` to daemons.** Configure the source once in
  the panel; every node is updated from that source even if its own config is
  empty. Daemon-local `updateSourceUrl` is the fallback
  (`effectiveUpdateSourceUrl` in `daemon/src/service/upgrade_service.ts`).
- **Version reporting** comes from `package.json` at runtime
  (`getVersion()`); an update that only replaces `package.json` still reports
  the new version after restart.
- **Windows caveat.** Runtime `.js` files can be overwritten while running, but
  loaded native binaries (`daemon/lib/*.node`, `*.exe`) are locked; the overlay
  then fails mid-way and the transaction rolls back — the update aborts cleanly
  instead of leaving a half-upgraded install.
- **UI precedence on the node card.** When the manifest advertises a newer
  version, the version row shows the update icon + localized notes instead of
  the "version mismatch with panel" warning (`TXT_CODE_e520908a`); the mismatch
  warning remains as fallback when no update is advertised.

## 6. Testing

### Frontend unit tests (vitest)

- `frontend/src/tools/__test__/localizedNotes.test.ts` — locale matching / English
  fallback rules for release notes.
- `frontend/src/widgets/__test__/Settings.test.ts` — auto-update tab rendering, localized
  notes box, save/refresh/update flow.
- `frontend/src/widgets/node/__test__/NodeItem.test.ts` — update icon + tooltip on the
  node card, offline behavior, update via the operator button group.

Run: `cd frontend && npm run type-check && npm run lint && npm test`.

### Shared unit tests (vitest)

- `common/src/__test__/upgrade.test.ts` — `compareVersions` semantics.

Run: `cd common && npm test`.

### E2E harnesses (the "backend tests")

Panel/daemon have no unit-test suite — the webpack build *is* the type check —
so end-to-end behavior is verified by two orchestrated harnesses:

```bash
# 1. build a release bundle first (BUNDLE=1), producing production-code/
./build.sh          # or build.bat on Windows

# 2. basic: version bump + whole-package overlay for panel & daemon
node scripts/verify-auto-update.mjs

# 3. strict: actual content replacement + negative scenarios
node scripts/verify-auto-update-strict.mjs
```

- `scripts/build-update-packages.mjs` — packs `daemon.zip` / `web.zip` from
  `production-code/` (bumped `package.json`, `OVERLAY_MARKER.txt`) and writes
  `manifest.json` (incl. multi-language `notes`).
- `scripts/update-test-server.mjs` — static HTTP server on `:9999` serving the
  manifest + zips.
- `scripts/verify-auto-update.mjs` — install/login, configure source, assert
  `panel_info`/`daemon_info` (incl. `onlineNotes` passthrough), run panel +
  forwarded daemon updates, verify on-disk versions and overlay markers, then
  simulate the operator's **manual restart** (kill + respawn) and verify the
  new build reports the new version. The process is expected to stay up
  during the update itself — there is no auto-restart.
- `scripts/verify-auto-update-strict.mjs` — scenarios:
  `0` unconfigured (no source anywhere), `A` already-latest rejection,
  `B` Zip-Slip rejection, `B2` missing-`app.js` validity gate,
  `C` panel content replacement (app.js marker, public added + overwritten,
  version bump), `D` daemon content replacement via forwarded source.

Both harnesses assume fresh runtime state: they reset `production-code/*/data`
and restore baseline `package.json`. Note that `updateSourceUrl` **defaults to
the official source URL** (commit `fix: default addr`); the "unconfigured"
scenarios must therefore clear it explicitly (panel setting + daemon config,
which is read at boot).

## 7. i18n keys

UI strings live in `languages/*.json` (`TXT_CODE_AUTOUPDATE_*`); frontend uses
`t()` with single-brace params `{v}`, backend/daemon use `$t()` with double
brace `{{v}}`. Notable keys:

| Key | Where | Meaning |
| --- | --- | --- |
| `TXT_CODE_AUTOUPDATE_TAB_TITLE` | Settings tab | "Auto Update" |
| `TXT_CODE_AUTOUPDATE_WEB_*` | Settings tab | panel update section (title, source, save, confirm, restart-required modal, ...) |
| `TXT_CODE_AUTOUPDATE_WEB_NOTES` | Settings tab | heading of the release-notes box |
| `TXT_CODE_AUTOUPDATE_WEB_LATEST` | Settings tab | "New version available: {v}" tag |
| `TXT_CODE_AUTOUPDATE_DAEMON_BTN` | Node card button group | "Update Daemon" |
| `TXT_CODE_AUTOUPDATE_DAEMON_UPDATE_TIP` | Node card tooltip | "New version available: v{v}. Click the Update Daemon button..." |
| `TXT_CODE_AUTOUPDATE_B_*` | backend errors | already-in-progress / already-latest / manifest missing / no url / apply failed |

Release-note texts inside the manifest are **not** i18n keys — they are
operator-authored content, localized via the `notes` locale map (§3).
