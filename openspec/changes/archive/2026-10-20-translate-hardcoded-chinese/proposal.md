# Proposal

## Why

User-facing Chinese literals remain in application source outside the project's i18n key workflow. This makes locale switching incomplete and leaves future translations dependent on source edits; the existing scanner and language catalogs should become the single path for these messages.

## What Changes

- Inventory Chinese literals in runtime code across `common`, `daemon`, `panel`, `frontend`, and relevant root scripts, distinguishing user-facing text from test fixtures, protocol data, comments, documentation, and intentional locale labels.
- Convert in-scope user-facing Chinese strings to the existing `t`/`$t` i18n accessors, using generated `TXT_CODE_` keys and preserving interpolation semantics.
- Run the repository i18n scanner so source keys and the `languages/zh_CN.json` / `languages/en_US.json` catalogs are synchronized.
- Add English translations for newly generated keys while retaining Chinese source translations and existing catalog entries.
- Verify no in-scope Chinese hardcoded user-facing strings remain and run the required module test/build checks.

## Capabilities

### New Capabilities

- `internationalized-user-facing-text`: Runtime user-facing messages and labels use catalog-backed i18n keys with synchronized Chinese and English language resources.

### Modified Capabilities

- None.

## Impact

- Runtime source in the four application modules and selected shared UI/daemon templates.
- Root i18n scanner configuration and generated `languages/zh_CN.json` / `languages/en_US.json` entries.
- Frontend, panel, daemon, and common test/build verification; no API or persisted-data schema changes are intended.
