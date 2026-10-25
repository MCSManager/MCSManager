# Proposal

## Why

The auto-update feature has a single hard-coded manifest source (`DEFAULT_UPDATE_SOURCE_URL`, the GitHub Release asset). When that source is unreachable (regional blocking, GitHub outage, DNS/CDN failures) or errors, update discovery silently reports "no update" and operators have no way forward. The legacy mcsmanager.com manifest hosting (`LEGACY_DEFAULT_UPDATE_SOURCE_URL`) is still online and schema-compatible, so it can serve as a backup source — but today it is only used as a migration marker and is not reachable at runtime.

## What Changes

- Add an operator-configurable **backup update source** field `updateSourceUrlFallback` to both panel (`SystemConfig`) and daemon (`Config`) configuration, defaulting to `LEGACY_DEFAULT_UPDATE_SOURCE_URL`. The field is editable on the Settings → Auto Update page and persisted in the normal config files.
- Change source resolution from a single URL to an **ordered candidate list** (primary `updateSourceUrl`, then backup `updateSourceUrlFallback`, empty values skipped, duplicates collapsed):
  - fetching/parsing the manifest tries the candidates in order; a fetch-level failure (timeout, connection error, HTTP non-2xx, redirect limit, invalid JSON) moves on to the next candidate;
  - a successfully fetched manifest is used as-is — semantic issues (missing side entry, malformed version) stay fail-closed and MUST NOT trigger a cross-source retry;
  - when **every** candidate fails, the system reports no update (fail-closed) with an error aggregating each attempt;
  - **BREAKING** (behavioral): an empty `updateSourceUrl` alone no longer disables the feature — the feature is disabled only when *both* source fields are empty.
- The panel forwards **both** source URLs to daemons over socket.io (per-field: forwarded value wins over daemon-local).
- `IUpgradeInfo.updateSourceUrl` reports the source URL that actually served the manifest (first configured candidate when no fetch succeeded, empty when disabled).
- Raise the dual-fetch time budget: daemon info forward timeout 25s → 40s; frontend upgrade-info API axios timeouts 30s → 60s.
- Update the auto-update reference doc, comments, unit tests, and the two e2e verification harnesses (fallback scenarios + hermetic source handling).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auto-update`: the **Update source resolution** requirement changes from "one operator-configured URL with a default" to "an ordered primary/backup candidate list with fetch-level fallback and dual-empty disable semantics"; the panel→daemon forwarding requirement now covers both source fields.

## Impact

- `common/src/upgrade.ts` (+ `common/src/index.ts` export): new `fetchJsonFromSources` helper; comment refresh for `LEGACY_DEFAULT_UPDATE_SOURCE_URL`.
- `panel`: `src/app/entity/setting.ts`, `src/app/routers/settings_router.ts`, `src/app/service/upgrade_service.ts`, `src/app/routers/upgrade_router.ts`, `src/app/service/version_adapter.ts` (comment).
- `daemon`: `src/entity/config.ts`, `src/service/upgrade_service.ts`, `src/service/version_adapter.ts` (comment).
- `frontend`: `src/types/index.ts`, `src/services/apis/index.ts`, `src/widgets/Settings.vue` (backup source input + copy), `src/widgets/__test__/Settings.test.ts`.
- `languages/*.json` (12 locales): new backup-source UI keys; clarified source description.
- `docs/auto-update.md`: architecture, key components, design decisions, testing, i18n sections.
- `scripts/verify-auto-update.mjs`, `scripts/verify-auto-update-strict.mjs`: fallback scenarios and explicit handling of the second source field (the legacy default is non-empty, so tests that intend "disabled" or hermetic behavior must manage both fields).
- Config data: panel `data/SystemConfig/config.json` and daemon `data/Config/global.json` gain `updateSourceUrlFallback` (class default keeps older files working without migration).
- No new npm dependencies; no change to the manifest schema, package download, extraction or overlay behavior.
