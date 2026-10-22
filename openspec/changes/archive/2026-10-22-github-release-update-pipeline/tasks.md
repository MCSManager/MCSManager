# Tasks

## 1. Release: code-only update packages + manifest (Req 1)

- [x] 1.1 Add `scripts/build-release-update-packages.mjs` that packs `mcsmanager_daemon_update.tar.gz` (`app.js`, `app.js.map`, `package.json` at archive root) and `mcsmanager_web_update.tar.gz` (plus `public/`) from `production-code/`, and writes `mcsmanager_update_manifest.json` (per-component versions from `production-code/*/package.json`, URLs pinned to `--tag`, notes from `--notes-file`/env); verify by running it against a local `./build.sh` output and asserting `tar -tzf` listings contain exactly the allowlist (no `lib/`, `node_modules`, runtime, scripts) and manifest fields match the build
- [x] 1.2 Wire the script into `.github/workflows/release.yml` (generate packages + manifest after the build, upload all three as release assets); verify by re-running the 1.1 dry-run commands and checking the workflow `files:` list includes `mcsmanager_daemon_update.tar.gz`, `mcsmanager_web_update.tar.gz`, `mcsmanager_update_manifest.json`

## 2. Release: drop web-only packages (Req 2)

- [x] 2.1 Remove `mcsmanager_windows_web_only_release.zip` / `mcsmanager_linux_web_only_release.tar.gz` creation and upload from `release.yml`; verify the workflow diff leaves exactly the linux/windows full + daemon-only packages plus the three new assets (grep release.yml for `web_only` returns nothing)

## 3. Shared upgrade layer: tar.gz extraction + version gate (Req 3a)

- [x] 3.1 Implement `extractTarGz` (via `compressing` entry stream: write files only after per-entry validation; reject entries escaping the destination and any link/device entry before writing) and `extractArchive` (`.tar.gz`/`.tgz` → tar.gz, `.zip` → zip) in `common/src/upgrade.ts`; add unit tests in `common/src/__test__/upgrade.test.ts` for plain tgz extraction, `../`-entry rejection, link-entry rejection, and zip compatibility; verify with `cd common && npm test`
- [x] 3.2 Add version normalization/validation helper (strip one leading `v`/`V`; accept dotted-numeric only) in `common/src/upgrade.ts` with unit tests for prefixed/malformed/empty versions and unchanged `compareVersions` semantics; verify with `cd common && npm test`

## 4. Panel/daemon updater + default source (Req 3b)

- [x] 4.1 Switch `panel/src/app/service/upgrade_service.ts` and `daemon/src/service/upgrade_service.ts` to `extractArchive`, archive naming by extension, and fail-closed `getUpgradeInfo` (fetch/parse failure or malformed version ⇒ `updateAvailable:false`, no prompt); verify with `cd panel && npm test` and `cd daemon && npm test`
- [x] 4.2 Change default `updateSourceUrl` to `https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json` in `panel/src/app/entity/setting.ts` and `daemon/src/entity/config.ts`, and migrate the legacy mcsmanager.com default in both `version_adapter`s (custom URLs untouched); verify with `cd panel && npm test` and `cd daemon && npm test`
- [x] 4.3 Update i18n source-placeholder `TXT_CODE_AUTOUPDATE_WEB_SOURCE_PH` in `languages/*.json`; verify with `cd frontend && npm run type-check && npm run lint && npm test`
- [x] 4.4 Update `docs/auto-update.md` (GitHub Release source, manifest hosting/asset names, tar.gz packages, fail-closed comparison, migration note); verify the documented flow matches the code paths in 4.1–4.2

## 5. Test harness + end-to-end verification

- [x] 5.1 Add `makeTarGz`/`listTarGz` to `scripts/auto-update-test-utils.mjs` and switch `scripts/build-update-packages.mjs` to emit `.tar.gz` update packages with a manifest whose URLs end in `.tar.gz`; verify by running the builder and asserting its archive listings and manifest JSON
- [x] 5.2 Run `./build.sh` then `node scripts/verify-auto-update.mjs` (basic: version bump + whole-package overlay for panel & forwarded daemon via tar.gz packages) and verify it exits 0
- [x] 5.3 Extend `scripts/verify-auto-update-strict.mjs` with a tar-slip rejection scenario and a malformed-version ("no prompt") scenario alongside existing A–D; verify with `node scripts/verify-auto-update-strict.mjs` exiting 0

## 6. Full test gate

- [x] 6.1 Run the one-pass suite over all touched modules (`common`, `panel`, `daemon`, `frontend` incl. `type-check`/`lint`) plus both E2E harnesses and report results; verify all commands exit 0

## Workflow follow-up

- After human review and successful implementation, archive the change and sync delta specs into `openspec/specs/` (openspec-archive-change / openspec-sync-specs).
