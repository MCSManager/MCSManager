# Design

## Context

See `proposal.md` for motivation. `Settings.vue` currently maps its local `bgUrl` field to `__settings__.theme.backgroundImage`. It uses `useUploadFileDialog` for uploads and `useLayoutConfigStore.setSettingsConfig` to save the full global layout and reload the page.

The shared `IPageLayoutConfig` contract lives in `common/global.d.ts`. The panel supplies the default theme from `panel/src/app/service/frontend_layout.ts`, persists the existing layout using its `StorageSubsystem` instance and `layout.json`, and exposes public GET plus administrator-only POST/DELETE routes at `/api/overview/layout`. `/api/overview/upload_assets` already stores administrator-uploaded assets and returns their names; the dialog constructs `/upload_files/<name>` URLs.

`useAppConfigStore` owns body background styling, overlays, and `hasBgImage`, but currently accepts only one URL and does not clear stale background styling. `useScreen` defines phone screens as `(max-width: 992px)` and follows media-query changes. VueUse responsive helpers are already installed and used by the app store.

## Goals / Non-Goals

**Goals:**
- Extend the current appearance form, layout contract, and default theme without introducing a separate persistence path.
- Keep both background sources available so previews, resizing, and theme changes consistently select the correct source.
- Make omission of the new property compatible with saved layouts and preserve all other layout data.

**Non-Goals:**
- Image resizing, automatic format conversion, separate tablet artwork, per-user backgrounds, or asset garbage collection.
- Changing the global layout API structure, upload restrictions, authorization model, or daemon behavior.
- Refactoring unrelated settings, stores, or layout components.

## Decisions

### 1. Store the requested field on the existing theme

Add optional `pBgUrl?: string` to `IPageLayoutConfig.theme`, use `pBgUrl` in `MySettings`, and initialize `pBgUrl: ""` in newly generated backend themes. Save it through the same `__settings__` entry as the desktop image. Missing values are interpreted as empty by the frontend; existing stored layouts do not need rewriting.

Alternatives considered: a second top-level system setting would duplicate the appearance persistence path; requiring the property would break old layouts and existing theme initializers. Keep the exact requested field name rather than adding another persisted alias.

### 2. Reuse the current upload and save workflow

Add the phone controls beside the desktop controls, retaining the current confirmation and reload conventions. Extend the existing background handlers with an explicit desktop/phone target where this removes duplication, while keeping logo handling separate. Read both fields from layout configuration on mount and save only the selected theme property. Include empty phone defaults anywhere this change creates a new theme object.

Upload results update their own form field and the corresponding store source for preview; canceling an upload does nothing. Reset clears only the selected configuration property. It does not delete the physical file, matching existing background reset behavior. Add concise labels and fallback guidance to English and Chinese catalogs through existing `t()` keys.

Alternatives considered: a new upload component or endpoint adds no needed behavior; automatically saving uploads would change the established explicit-save contract.

### 3. Centralize viewport selection in the app store

Keep desktop and phone URL sources in `useAppConfigStore`, derive the effective URL from the existing 992px phone rule, and have one DOM application path apply the effective URL and current theme. Reuse the existing screen hook when its lifecycle fits the global store; otherwise use an already installed VueUse media-query helper with the identical query and store-scoped cleanup. Do not classify devices by user agent or orientation.

React to initial configuration, viewport changes, upload previews, and theme changes without fetching settings on every resize. Desktop selection ignores the phone source; phone selection uses the phone source or falls back to desktop. Preserve the current cover/center/no-repeat styling and light/dark gradients. With no effective URL, clear owned inline background properties, remove both background-specific theme classes, and set `hasBgImage` to false.

Alternatives considered: CSS variables plus media queries could select an image, but the existing JavaScript-owned `hasBgImage` and theme classes would still need synchronized state. Route-specific selection would duplicate behavior and miss public pages.

### 4. Verify both persistence and visible selection

Extend the existing `Settings.vue` tests for loading, uploading, manual input, saving, resetting, and cancellation without overwriting the other background. Add store-level DOM tests for both sides of the 992px boundary, missing or empty phone configuration, phone-only configuration, resize cleanup, and light/dark transitions.

Add panel default/persistence coverage and a real-process backend integration case using the existing isolated harness: administrator asset upload and layout save, public layout readback, regular-user/unauthenticated rejection, and a fresh-process read from the same isolated layout storage. Never use real panel data for tests. The referenced `docs/integration-test-framework.md` is absent in this checkout; consult the actual `common/test/integration/` harness and existing suites before editing the suite, and preserve their isolation and authentication conventions.

Run the required `mcsmanager-test` workflow plus frontend type-check/lint and builds for the shared contract consumers. Every implementation checkbox remains incomplete until its relevant suites pass.

## Risks / Trade-offs

- [Breakpoint drift] Use the current `(max-width: 992px)` rule and test 992/993px explicitly; avoid introducing a different phone threshold.
- [Preview state overwrites the wrong source] Give each update an explicit target and test desktop and phone uploads independently on both viewport classes.
- [Stale image or transparency after resizing/reset] Centralize cleanup with `hasBgImage` updates and test the phone-only-to-desktop transition.
- [Loss of customized layouts] Extend only the theme property and preserve sibling fields and cards in round-trip tests.
- [Unnecessary downloads or listeners] Apply only the effective URL and use lifecycle-aware reactive helpers; do not fetch configuration on media-query events.
- [Existing upload format/security policy] Reuse the administrator-only asset endpoint and storage boundary; this feature introduces no server-side fetch of user-supplied URLs.

## Migration Plan

After human review, implement and verify the change. Rebuild the frontend and panel together using the normal project workflow; no data migration is required. Existing layouts without `pBgUrl` keep the desktop image on all screen sizes. Rolling back application code leaves an unused optional property and uploaded asset, while the desktop configuration remains usable. Archiving follows successful implementation and verification.
