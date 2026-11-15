# Tasks

## 1. Extend the stored appearance contract

- [ ] 1.1 Add optional `theme.pBgUrl` to `common/global.d.ts`, add the empty phone URL to panel default themes, and add isolated regression tests for default generation, stored URL round trips, preservation of sibling configuration, and older layouts without the property. Verify common/panel/daemon builds, then run `cd common && npm test`, `cd daemon && npm test`, and `cd panel && npm test`.

## 2. Apply responsive backgrounds

- [x] 2.1 Extend `useAppConfigStore` to keep both background sources, select by the existing 992px phone rule, update on initialization/resize/theme changes, and clear obsolete body styles/classes and `hasBgImage` when no image applies. Add DOM regression tests for 992/993px, phone fallback, desktop-only and phone-only configurations, light/dark overlays, and cleanup. Verify `cd frontend && npm run type-check`, then `cd frontend && npm test`.

## 3. Add phone background controls

- [x] 3.1 Add `pBgUrl` input/upload/save/reset controls to `Settings.vue`, restore the saved value on mount, reuse the existing upload/layout APIs, target the correct preview source, and preserve the other background and unrelated theme fields. Add English/Chinese catalog keys and component tests for manual input, uploads, save/reset confirmations, cancellation, and older configuration. Verify `cd frontend && npm run type-check`, `cd frontend && npm run lint`, review lint edits and catalog JSON, then run `cd frontend && npm test`.

## 4. Verify the complete persistence and permission flow

- [ ] 4.1 Add real-process integration coverage using the existing isolated `common/test/integration/` harness for administrator asset upload and layout save, public layout retrieval, regular-user/unauthenticated write rejection, and persisted configuration after a fresh panel read/start. Use only temporary test storage. Run the full `mcsmanager-test` workflow, including `cd common && npm run test:integration:build` and every module's `npm test`; do not mark complete with failed checks. Finish with `cd common && npm test`.

## Workflow follow-up

- Present these artifacts for human review before editing project code, as required by `AGENTS.md` section 3.
- After implementation and passing verification, archive the change through `openspec-archive-change` and synchronize its spec delta.

## Verification notes (2026-11-15)

- Human implementation approval was received before code changes.
- The requested implementation is present. Frontend unit/component tests pass: 123 tests across 19 files. Frontend type-check and production build pass; lint reports 0 errors and 99 existing warnings.
- Panel unit tests pass: 61 tests, including four new default/persistence/legacy-layout regressions. Common unit tests passed: 68 tests. Common, panel, and daemon builds pass.
- The full `npm run test:integration:build` command passes: all 13 executed suites pass (162 tests passed, one existing network-bound test skipped); the Docker suite is skipped on Windows. This includes all six new appearance cases for administrator upload/save, public reads, denied writes, and persistence after restarting the isolated panel.
- The daemon unit suite has three existing failures in `src/service/__test__/mod_update_download.test.ts` (167 passed, 3 failed, 1 skipped). Its URL mock exports only `checkSafeUrl`, while the current downloader calls `resolveSafeUrl`. All three failures were reproduced with the new shared type property temporarily removed and then restored. Daemon runtime sources and tests are unchanged by this feature.
- A read-only review found an already-open terminal retained its initial opacity after a phone-only background became active on resize. A scoped watcher now updates its background while preserving the other theme colors; its regression test covers both transitions and cleanup on unmount. The follow-up review found no remaining issue.
- Tasks 1.1 and 4.1 remain unchecked because the required daemon test gate is not green. Do not archive the change while this verification blocker remains.
