# Design

## Context

The repository already uses `i18next-scanner` with `TXT_CODE_` keys and separate frontend/backend accessor conventions, but a source scan still finds Chinese literals in runtime templates and code. The scanner only rewrites literal arguments passed to `t` or `$t`; it cannot safely infer whether an arbitrary Chinese string is user-facing.

## Goals / Non-Goals

**Goals:**

- Establish a repeatable inventory of Chinese literals in runtime source and classify each occurrence before editing.
- Convert user-facing occurrences using the accessor already used by their module, including correct interpolation syntax.
- Run the existing scanner and make the Chinese and English catalogs valid, complete, and consistent.
- Keep generated changes reviewable and limit edits to source files and language catalogs required by the conversion.

**Non-Goals:**

- Translating comments, Markdown documentation, test-only input, protocol payloads, or game/domain data.
- Changing locale selection, fallback behavior, API contracts, or persisted data formats.
- Replacing the existing scanner or adding a new translation service.

## Decisions

1. **Classify before converting.** Use a Unicode scan over runtime source, then inspect each hit. Only text rendered to an end user is converted; comments, fixtures, and data literals remain untouched. This avoids corrupting protocol assertions and non-UI data.
2. **Reuse module accessors.** Frontend Vue/TS code uses its existing `t()` composables; panel and daemon code uses `$t()`. Static daemon HTML is converted through the existing template localization mechanism rather than introducing a second catalog.
3. **Use the repository scanner for key generation.** After accessors are in place, run `npm run i18n` from the repository root. Generated `TXT_CODE_` keys are retained, then `en_US.json` values are reviewed and translated while `zh_CN.json` keeps the original Chinese text.
4. **Preserve placeholders exactly.** Frontend messages use single-brace placeholders and backend/daemon messages use double-brace placeholders, matching the repository convention and scanner interpolation configuration.
5. **Verify with source and catalog checks.** Re-run the Unicode scan with exclusions for documentation, tests, comments, and catalogs; parse both JSON catalogs; run all module suites because root-level language files and shared runtime source affect all four modules.

## Risks / Trade-offs

- [Risk] Scanner hashing can produce duplicate keys for identical source text or leave unsupported dynamic expressions unchanged → Mitigation: inspect scanner output, deduplicate by key, and manually handle dynamic/parameterized occurrences.
- [Risk] A static HTML conversion can break escaping or client-side locale behavior → Mitigation: preserve the existing template structure and add focused daemon/frontend tests or build checks.
- [Risk] The full repository scan includes intentional Chinese fixtures and comments → Mitigation: maintain an explicit exclusion/classification list and report remaining intentional matches.
- [Risk] Catalog edits can create malformed JSON or placeholder drift → Mitigation: parse both files and compare placeholder sets before running module tests.

## Migration Plan

1. Apply source and catalog changes on the feature branch, then run the scanner and required test/build commands.
2. Deploy normally; no data migration is required because only source strings and language resources change.
3. Roll back by reverting the source/catalog commit if a locale regression is found.
