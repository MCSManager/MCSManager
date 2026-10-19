# Tasks

## 1. Inventory and conversion boundaries

- [x] 1.1 Scan runtime source for Chinese Unicode literals, classify each match as user-facing or intentional non-user-facing data, and record the exclusion rationale; verify the inventory with a repeatable `rg` command and `cd common && npm test`.

## 2. Frontend user-facing text

- [x] 2.1 Convert in-scope Chinese labels, messages, and errors in `frontend` to the existing `t()` accessor while preserving Vue interpolation and one-way data flow; verify with `cd frontend && npm run type-check` followed by `cd frontend && npm test`.
- [x] 2.2 Re-scan frontend runtime files and confirm remaining Chinese matches are only documented intentional exclusions; verify with the scoped `rg` scan and `cd frontend && npm test`.

## 3. Backend and daemon user-facing text

- [x] 3.1 Convert in-scope Chinese text in `panel`, `daemon`, and shared `common` runtime code to `$t()` or the existing localization path, preserving backend placeholder syntax and static template behavior; verify with `cd panel && npm run build`, `cd daemon && npm run build`, and `cd common && npm test`.
- [x] 3.2 Re-scan backend and daemon runtime files and confirm remaining Chinese matches are only intentional exclusions; verify with the scoped `rg` scan and `cd daemon && npm test` plus `cd panel && npm test`.

## 4. Catalog generation and translation

- [x] 4.1 Run the repository i18n scanner, review generated `TXT_CODE_` keys, and add accurate English translations while preserving Chinese translations and placeholders; verify both catalogs parse as JSON and `npm run i18n` is idempotent.
- [x] 4.2 Check for missing keys, placeholder mismatches, and stale generated references across all language resources; verify with the repository catalog scanner and `cd common && npm test`.

## 5. Integration verification

- [x] 5.1 Run the complete required verification for root-level language/source changes: `cd common && npm test`, `cd daemon && npm test`, `cd panel && npm test`, `cd frontend && npm run type-check`, and `cd frontend && npm test`; report any environment-blocked checks explicitly.

## Workflow follow-up

- Archive the completed change and sync its capability spec after review and all verification tasks pass.
