# Proposal

## Why

Self-update is currently sourced from the third-party host `mcsmanager.com` (`upgrade/manifest.json` + `daemon.zip`/`web.zip`), which is disconnected from the official GitHub Releases that already publish every version. When that host is unreachable (common behind the GFW or when it is down) the panel/daemon cannot even check for updates, and operators must trust a non-official download channel for self-update code. The update channel should come from the official GitHub Release, and the release must ship dedicated lightweight update packages (built code only) instead of asking the updater to reuse full install archives.

## What Changes

- Release workflow publishes two new update packages: `mcsmanager_daemon_update.tar.gz` and `mcsmanager_web_update.tar.gz`. Each contains only the built application code (`app.js`, `app.js.map`, `package.json`, plus `public/` for the web package) with files at the archive root — no dependency trees, no PTY/Zip-Tools binaries (`daemon/lib`), no Node runtime, no startup scripts.
- Release workflow publishes `mcsmanager_update_manifest.json` alongside the packages: the existing manifest schema (`{daemon|web: {version, url, notes}}`) with per-component versions taken from the tagged build (`daemon/package.json`, `panel/package.json`), asset URLs pinned to that release's tag, and `notes` taken from the release body.
- **BREAKING**: the release no longer publishes `mcsmanager_windows_web_only_release.zip` and `mcsmanager_linux_web_only_release.tar.gz`.
- Auto-update default source switches from the mcsmanager.com manifest URL to the GitHub Release manifest (`https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json`). A custom `updateSourceUrl` stays supported and keeps the same manifest schema.
- Update packages are `.tar.gz`; the shared upgrade layer gains tar.gz extraction with the same path-traversal (tar-slip) guard as zip extraction. Zip archives remain supported for custom update sources.
- Version checking is fail-closed: if fetching/parsing the manifest fails, or the advertised version is malformed / not comparable, the system SHALL NOT prompt that a new version is available.

## Capabilities

### New Capabilities

- `release-artifacts`: the contract of what a GitHub Release publishes — the install packages, the two update packages (contents), and the update manifest (generation), and which packages are not part of the artifact set.
- `auto-update`: the runtime self-update behavior of panel and daemon — update source resolution (default GitHub Release manifest, custom source override), manifest consumption, fail-closed version comparison, archive download/extraction (tar.gz + zip with traversal guards), and transactional overlay onto the install directory.

### Modified Capabilities

(none — no existing capability covers release packaging or self-update)

## Impact

- `.github/workflows/release.yml` (artifact set: add update packages + manifest, drop web-only packages); new `scripts/build-release-update-packages.mjs` (update packages + manifest generation used by the workflow).
- `common/src/upgrade.ts` (tar.gz extraction + traversal guard, archive-type dispatch, version normalization/validation) and `common/src/__test__/upgrade.test.ts`.
- `panel/src/app/service/upgrade_service.ts`, `daemon/src/service/upgrade_service.ts` (archive download/extract dispatch, fail-closed comparison), `panel/src/app/entity/setting.ts`, `daemon/src/entity/config.ts` (default `updateSourceUrl`).
- Frontend i18n placeholder `TXT_CODE_AUTOUPDATE_WEB_SOURCE_PH` (`languages/*.json`); `docs/auto-update.md` (source, manifest hosting, package format).
- Local test harness: `scripts/build-update-packages.mjs`, `scripts/auto-update-test-utils.mjs`, `scripts/verify-auto-update.mjs`, `scripts/verify-auto-update-strict.mjs` (tar.gz packages, tar-slip and malformed-version scenarios).
- No change to the HTTP/socket update APIs (`/api/upgrade/*`, `upgrade/*`); the manifest schema is preserved, so existing custom sources and the update UI contract keep working.
