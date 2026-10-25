# Design

## Context

See `proposal.md` — Why. Current state that shapes the approach:

- The update pipeline is manifest-driven: `updateSourceUrl` → `manifest.json` → `{daemon|web: {version, url, notes}}` → archive → `applyUpgradePackage` overlay. Panel (`panel/src/app/service/upgrade_service.ts`) and daemon (`daemon/src/service/upgrade_service.ts`) share `common/src/upgrade.ts` (fetch/download/extract/overlay) and the HTTP/socket surface `/api/upgrade/*`, `upgrade/*` stays as is.
- Today only `extractZip` exists; the release packages this change adopts are `.tar.gz`.
- GitHub Release tags track the **panel** version (`v10.21.2` ↔ `panel/package.json` `10.21.2`) while the daemon keeps an independent line (`4.19.2`, mirrored in `panel/package.json` `daemonVersion`), so a single tag cannot represent both components' versions.
- Existing installs persist `updateSourceUrl` (default was `https://mcsmanager.com/upgrade/manifest.json`), so a default change alone would not reach them. `panel/src/app/service/version_adapter.ts` (and the daemon twin) already migrate stale config defaults (`presetPackAddr`).
- `common` is source-aliased into both apps; `compressing` is already a declared `common` dependency and wraps `tar-stream`, whose extract stream emits per-entry events (handles PAX/GNU headers).

## Goals / Non-Goals

**Goals:**

- Release artifact set: add the two code-only update packages + update manifest; drop the web-only packages.
- Update source defaults to the official GitHub Release manifest while keeping `updateSourceUrl` as an operator/test override with the unchanged manifest schema.
- Fail-closed version checking (no "new version" prompt on any failure or malformed version).
- tar.gz support with the same reject-on-escape standard as the existing zip guard.
- Existing installs migrate from the old default source without operator action.

**Non-Goals:**

- Automatic restart / unattended self-update (remains manual by design).
- Changing the manifest schema, the `/api/upgrade/*` and socket `upgrade/*` APIs, or the overlay semantics of `applyUpgradePackage`.
- Localizing release notes beyond what the manifest carries (`notes` = release body string; locale maps remain possible for custom sources).
- Replacing or mirroring GitHub for regions where it is unreachable (operators can point `updateSourceUrl` at a mirror of the same schema).

## Decisions

### D1. Per-component versions come from a generated release manifest asset
The workflow generates `mcsmanager_update_manifest.json` from the tagged build (`production-code/*/package.json` versions), the release's own asset URLs, and the release body, and uploads it with the release. Alternatives rejected: (a) comparing the GitHub API `tag_name` against both sides — the daemon (4.x) would permanently compare "older" than a 10.x tag and prompt forever; (b) fetching `daemon/package.json` via `raw.githubusercontent.com` at the tag — extra host, `api.github.com` unauthenticated rate limit (60/h) and both are often unreachable from CN; (c) unifying daemon versions with the tag — changes the daemon version line and release conventions outside this change's scope.

### D2. Manifest hosted at `releases/latest/download/`, pinned URLs inside
Default `updateSourceUrl` = `https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json` — a stable redirect to the newest release's asset, no API calls or rate limits. The `url` fields inside the manifest are pinned to the release tag that produced it, so a manifest can never point at a different release's packages (atomic manifest↔package pair even if a client caches the manifest).

### D3. Keep the manifest schema and configurable `updateSourceUrl`
The existing schema (`{daemon|web: {version, url, notes}}`) is preserved, so the download→extract→overlay path, the UI contract, and custom mirrors/tests keep working unchanged. The only consumer-visible change is the default URL and the package format it points at. Alternative rejected: switching the wire format to the GitHub Releases API JSON shape — couples the updater to GitHub's API and breaks existing custom sources and the local test harness for no gain.

### D4. tar.gz extraction in `common` via `compressing` entry stream with explicit reject
`extractTarGz` will stream entries from `compressing.tgz.UncompressStream` (already declared in `common`, built on `tar-stream`, so PAX/GNU tar variants from GNU tar and bsdtar both parse) and write files itself after per-entry validation. Entries that resolve outside the destination, and any non-file/non-directory entry (symlink/hardlink/device), reject the whole extraction before anything is written — matching `extractZip`'s reject-on-escape behavior rather than silently stripping. Alternatives rejected: `node-tar`'s `extract` — new declared dependency for `common` and its default silently rewrites escaping paths instead of rejecting; hand-rolled tar parsing — must reimplement PAX/GNU header variants that different tar implementations emit.

### D5. Archive dispatch by extension; zip stays supported
`extractArchive` picks tar.gz for `.tar.gz`/`.tgz` and zip for `.zip`. New packages are tar.gz; keeping zip costs little and keeps custom sources (and their older `.zip` mirrors) and the existing zip tests valid.

### D6. Update packages are code-only, flat at the archive root
Contents: `app.js`, `app.js.map`, `package.json`, plus `public/` for web; nothing else. Rationale: `BUNDLE=1` builds are self-contained, so no dependency tree or runtime is needed; excluding `daemon/lib` means the overlay never overwrites target-specific PTY/Zip-Tools binaries; excluding `package-lock.json`/extras keeps the allowlist minimal. Flat layout means `findPackageRoot` resolves at the extraction root and an operator can `tar xzf` straight into an install dir. A single wrapper folder was considered (nicer for blind extraction) but adds an indirection without benefit for the updater.

### D7. Fail-closed comparison with version-shape validation
`common` gains a version-normalization helper (strip one leading `v`/`V`) and shape check (dotted numeric segments). `getUpgradeInfo` treats fetch/parse errors, missing entries, and malformed versions uniformly as "no update offered" (the existing `IUpgradeInfo` shape keeps `updateAvailable: false`; no new prompt path). `compareVersions` semantics stay unchanged.

### D8. Config migration for the default source
Both panel and daemon `version_adapter`s rewrite a persisted `updateSourceUrl` equal to the legacy default (`https://mcsmanager.com/upgrade/manifest.json`) to the new GitHub default, mirroring the existing `presetPackAddr` migration. Explicit operator URLs are left untouched.

## Risks / Trade-offs

- [GitHub unreachable for some operators] → `updateSourceUrl` remains configurable for mirrors; on failure the feature degrades to "no update prompt" (fail-closed), never a wrong prompt.
- [`compressing` entry semantics differ across tar producers] → unit tests cover tars produced by GNU tar and bsdtar (`tar.exe`) plus crafted malicious archives (traversal entries, link entries).
- [Update applied while old native modules are loaded (Windows)] → unchanged transactional rollback; since update packages ship no binaries, only `app.js`/`public` are overlaid and lock conflicts are limited.
- [Release body becomes `notes` as a plain string] → accepted by the current UI (`pickLocalizedNotes` string fallback); richer per-locale notes remain possible via custom manifests.
- [Release workflow is only exercised on publish] → the packaging commands are runnable locally; a dry-run check asserts archive contents and manifest fields before the first real release.

## Migration Plan

1. Land the change; the next GitHub Release exercises the new workflow (update packages + manifest appear, web-only packages disappear).
2. On first boot after upgrading, panel/daemon `version_adapter` migrates the legacy default `updateSourceUrl` to the GitHub default (operator-customized URLs untouched).
3. Until a release carrying the new manifest exists, the new default serves the (older-format) manifest only if present; otherwise checks fail closed with no prompt — acceptable window.
4. Rollback: revert the commit; the manifest schema never changed, so a previous build keeps working against the old mcsmanager.com source.
