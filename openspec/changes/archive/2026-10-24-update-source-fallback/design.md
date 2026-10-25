# Design

## Context

See proposal.md — Why. Current implementation has one manifest URL per side:

- `common/src/upgrade.ts` exports `DEFAULT_UPDATE_SOURCE_URL` (GitHub Release manifest) and `LEGACY_DEFAULT_UPDATE_SOURCE_URL` (mcsmanager.com hosting, currently only used by `migrateLegacyUpdateSourceUrl` to rewrite a persisted legacy *primary*).
- `panel/src/app/entity/setting.ts` (`SystemConfig.updateSourceUrl`) and `daemon/src/entity/config.ts` (`Config.updateSourceUrl`) default to `DEFAULT_UPDATE_SOURCE_URL`; empty disables the feature.
- `panel/src/app/service/upgrade_service.ts` and `daemon/src/service/upgrade_service.ts` each implement an identical `fetchManifest()` on top of `common`'s `fetchJson(url, 15000)`.
- `panel/src/app/routers/upgrade_router.ts::forwardedSource()` forwards the panel's `updateSourceUrl` over socket.io; the daemon resolves `forwarded || local` per request (`IUpgradeRequestData`).
- Timeouts assuming ONE 15s fetch: `DAEMON_INFO_TIMEOUT = 25000`, frontend axios default 30s for the upgrade-info APIs.

The legacy manifest is verified live and schema-identical (`daemon`/`web` entries with `version`/`url`/`notes`, `.zip` packages — already supported by `extractArchive`).

## Goals / Non-Goals

**Goals:**

- One shared, unit-testable fallback fetch in `common/` used by both panel and daemon.
- Behavior contract per specs delta: fetch-level fallback only, dual-empty disable, per-field forwarded precedence on the daemon.
- Config surface: `updateSourceUrlFallback` in panel `SystemConfig` + daemon `Config`, settings page editable, visible in the persisted JSON.
- Deterministic, offline-safe test harnesses (the default backup URL is a live internet host).

**Non-Goals:**

- No fallback for package downloads (`manifest entry.url` is fetched as-is).
- No manifest schema change, no cache/retry backoff beyond one pass over the candidate list.
- No change to `IUpgradeInfo` field set (only `updateSourceUrl`'s reported value changes).
- No publishing/sync tooling for the mcsmanager.com backup manifest (ops-side; documented only).
- No additional config migration (`migrateLegacyUpdateSourceUrl` stays as-is).

## Decisions

1. **Candidate list, not a second independent switch.** Resolution builds an ordered list from the two fields (trim → drop empty → collapse duplicates) and tries it once through. Chosen over "primary/backup as an if-else pair" because the user-selected semantics are a priority list: an empty primary means the backup *is* the source, and only an all-empty list disables the feature.
2. **Fallback triggers on fetch/parse failures only** (timeout, connection error, HTTP non-2xx, redirect limit, invalid JSON). A parseable manifest is used as-is: missing side entry or malformed version stays fail-closed and never retries another source. Alternative considered: retrying on semantic problems too — rejected because it mixes versions from different hosting lines and makes "which source decided" unexplainable.
3. **New shared helper `fetchJsonFromSources(primary, fallback, timeoutMs)` in `common/src/upgrade.ts`** returning `{ data, sourceUrl, usedFallback }` and throwing one error aggregating every attempt when the list is exhausted. Alternative: duplicating the loop in both `upgrade_service.ts` files (they already mirror each other) — rejected: the loop is exactly the kind of cross-cutting logic `common/upgrade.ts` exists for, and it needs unit tests without booting panel/daemon.
4. **Field name `updateSourceUrlFallback`** in configs, settings API and the panel→daemon payload: it sorts next to `updateSourceUrl` in JSON and keeps one vocabulary for "update source".
5. **Per-field `forwarded || local` on the daemon** (unchanged precedence model, now applied to both fields). Alternative: treat a present forward payload as authoritative for the whole list — rejected: it breaks the existing "panel field empty ⇒ daemon falls back to local config" contract used by standalone daemons.
6. **`IUpgradeInfo.updateSourceUrl` reports the URL that served the manifest** (first configured candidate when all fetches failed, empty when disabled). Alternative: keep reporting the configured primary — rejected: with a candidate list the response would claim a URL that never answered (or be empty while `configured: true`), and the e2e harnesses need an observable proof that the backup was used.
7. **Time budget matches two fetches:** `DAEMON_INFO_TIMEOUT` 25s → 40s, frontend `getPanelUpgradeInfo`/`getDaemonUpgradeInfo` axios timeouts 30s → 60s (worst case 2 × 15s inactivity + response time). Per-attempt manifest timeout stays 15s — slow links (the fallback's raison d'être) need it.
8. **No config migration.** The loader's `new classz()` + deep-copy merge keeps old files working; the class default fills `updateSourceUrlFallback`. `migrateLegacyUpdateSourceUrl` keeps rewriting a legacy *primary* to the GitHub default, after which the fallback default naturally holds the mcsmanager.com source. Only comments change.

## Risks / Trade-offs

- [The default backup URL is a live external host] → unit tests never fetch it (local `http.createServer` / closed ports); both e2e harnesses explicitly set *both* source fields in every scenario ("disabled" and hermetic cases clear both; the fallback scenario points the backup at the local test server). Any harness step that only cleared the primary would silently reach the internet.
- [Backup manifest is hosted separately and can lag releases] → document in `docs/auto-update.md` that releasing must also refresh the mcsmanager.com manifest + zips; the fallback then reports "already latest" rather than a wrong version (fail-closed).
- [Worst-case check latency doubles (2 × 15s)] → forwarding/axios budgets raised accordingly (decision 7); manifests are tiny so a healthy primary is unaffected.
- [Operators who clear only the primary expect "disabled" but keep getting update checks via the backup] → settings copy states that BOTH fields must be cleared to disable; the "not configured" tag keys off the all-empty list.
- [Aggregated multi-source error text is raw (English) like existing fetch errors] → consistent with the current `error` passthrough of `fetchJson` messages; UI labels remain i18n'd.

## Migration Plan

- Ship as a normal release: existing panel/daemon config files keep working (missing key → class default). Rollback = previous build; the extra JSON key is ignored by old code.
- Ops follow-up (outside this change): keep the backup manifest + zips in sync when publishing releases.

## Open Questions

None.
