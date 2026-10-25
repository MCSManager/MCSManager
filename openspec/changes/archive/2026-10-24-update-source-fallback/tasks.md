# Tasks

## 1. Shared fallback fetch (common)

- [x] 1.1 Implement `fetchJsonFromSources(primary, fallback, timeoutMs)` in `common/src/upgrade.ts`: build the ordered candidate list (trim, drop empty, collapse duplicates), try each with `fetchJson`, return `{ data, sourceUrl, usedFallback }`, and throw one error aggregating every attempt when exhausted. Update the `LEGACY_DEFAULT_UPDATE_SOURCE_URL` comment (now the default backup source) and export the helper from `common/src/index.ts`. Unit-test in `common/src/__test__/upgrade.test.ts` with a local `http.createServer` / closed ports: primary success, fallback on connection error, HTTP non-2xx and invalid JSON, empty primary uses backup, duplicate candidates fetched once, all-fail aggregated message. Verify: `cd common && npm test`
- [x] 1.2 Re-read `migrateLegacyUpdateSourceUrl` comments in `common/src/upgrade.ts` and adjust wording only (the legacy primary is still rewritten to the default; the same URL is now the default *backup* value). Verify: `cd common && npm test`

## 2. Panel backend

- [x] 2.1 Add `updateSourceUrlFallback = LEGACY_DEFAULT_UPDATE_SOURCE_URL` to `SystemConfig` (`panel/src/app/entity/setting.ts`), persist it in `panel/src/app/routers/settings_router.ts`, and refresh the `upgradeUpdateSourceUrl` comment in `panel/src/app/service/version_adapter.ts`. Extend `panel/src/__test__/system_config_default.test.ts`: class default = legacy URL, old config without the key keeps the default, custom value preserved, both fields empty preserved. Verify: `cd panel && npm test`
- [x] 2.2 Wire candidate-list resolution into `panel/src/app/service/upgrade_service.ts` (`getUpgradeInfo`/`performUpgrade` use `fetchJsonFromSources`; `configured` = any candidate non-empty; `updateSourceUrl` reports the serving URL, first candidate on total failure, empty when disabled). Forward both fields from `panel/src/app/routers/upgrade_router.ts::forwardedSource()` and raise `DAEMON_INFO_TIMEOUT` to 40000. Verify: `cd panel && npm test`

## 3. Daemon backend

- [x] 3.1 Add `updateSourceUrlFallback = LEGACY_DEFAULT_UPDATE_SOURCE_URL` to `Config` (`daemon/src/entity/config.ts`) and refresh the `upgradeUpdateSourceUrl` comment in `daemon/src/service/version_adapter.ts`. Extend `daemon/src/entity/__test__/config.test.ts` with the same four persistence cases as the panel. Verify: `cd daemon && npm test`
- [x] 3.2 Wire candidate-list resolution into `daemon/src/service/upgrade_service.ts`: `IUpgradeRequestData.updateSourceUrlFallback`, per-field `forwarded || local` candidates, shared fetch helper, same `configured`/`updateSourceUrl` semantics as the panel. Verify: `cd daemon && npm test`

## 4. Frontend settings UI + i18n

- [x] 4.1 Add the backup source field to `frontend/src/types/index.ts` and `Settings.vue` (input bound to `formData.updateSourceUrlFallback`, copy stating primary-first order and that BOTH fields must be cleared to disable), raise `getPanelUpgradeInfo`/`getDaemonUpgradeInfo` timeouts to 60s in `frontend/src/services/apis/index.ts`, and add `TXT_CODE_AUTOUPDATE_WEB_SOURCE_BACKUP{,_PH,_DESC}` plus the adjusted `TXT_CODE_AUTOUPDATE_WEB_SOURCE_DESC` to all `languages/*.json` locales. Verify: `cd frontend && npm run type-check && npm test`
- [x] 4.2 Extend `frontend/src/widgets/__test__/Settings.test.ts`: backup input renders and binds `updateSourceUrlFallback`, saving submits it, and the dual-empty disable copy is shown. Verify: `cd frontend && npm test && npm run lint`

## 5. Reference docs and e2e harnesses

- [x] 5.1 Sync `docs/auto-update.md` (overview source/backup, architecture forwarding both fields, key-components rows, design-decisions bullets incl. fetch-level-only fallback and dual-empty disable, testing section, i18n key table, release-side backup-manifest sync note). Verify: grep shows `updateSourceUrlFallback` in the overview, components table and decisions, and no remaining "empty ⇒ disabled" claim without the both-empty qualifier
- [x] 5.2 Update `scripts/verify-auto-update.mjs`: the disabled step clears BOTH panel source fields; new steps for dead-primary+local-backup (update offered, `updateSourceUrl` equals the backup URL), both-dead (fail-closed, no update), daemon forwarded fallback, and a config-file visibility assertion for `updateSourceUrlFallback`. Verify: `node --check scripts/verify-auto-update.mjs`
- [x] 5.3 Update `scripts/verify-auto-update-strict.mjs`: `setSource` manages both source fields (hermetic — never leave the live default backup armed), SCENARIO 0 clears both fields on the panel and in the daemon config, plus scenarios "badver primary + good backup stays fail-closed (no cross-source)" and "dead primary + good backup serves the update". Verify: `node --check scripts/verify-auto-update-strict.mjs`

## 6. Integration verification

- [x] 6.1 Run the full `mcsmanager-test` one-pass loop (common/daemon/panel/frontend `npm test`, frontend `type-check` + `lint`, common integration suite) and record the results in the change log. Verify: all suites green
- [x] 6.2 Build `production-code/` per `mcsmanager-build` and run `node scripts/verify-auto-update.mjs` and `node scripts/verify-auto-update-strict.mjs` end to end. Verify: both harnesses exit 0

## Workflow follow-up

- Archive the change (`openspec-archive-change`) and sync the delta into `openspec/specs/auto-update/spec.md` once the project's review requirements are satisfied.
