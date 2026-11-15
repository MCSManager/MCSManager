# Proposal

## Why

MCSManager currently uses one background image for every viewport, so desktop artwork also fills narrow phone screens. Administrators need an independently configurable phone background that is uploaded, persisted by the panel, and selected automatically by the frontend.

## What Changes

- Add a `pBgUrl` field to the appearance form in `Settings.vue`, with URL input, upload, save, and reset actions matching the existing background controls.
- Persist the optional phone URL as `__settings__.theme.pBgUrl` through the existing panel layout API and storage, and include an empty value in newly generated layout defaults.
- Use the phone background at the existing phone breakpoint (`max-width: 992px`); use `theme.backgroundImage` at wider widths. An absent or empty phone URL falls back to the existing background.
- Reevaluate the selected background on viewport and light/dark theme changes, including immediate upload previews and removal of obsolete background styling when no background applies.
- Add translated labels and regression coverage for independent editing, persistence, compatibility, and responsive selection.

## Capabilities

### New Capabilities

- `panel-appearance`: Administrator-managed panel backgrounds, their persistence, and responsive application across public and authenticated pages.

### Modified Capabilities

None. Existing internationalization and authorization requirements continue to apply unchanged.

## Impact

- Frontend: `frontend/src/widgets/Settings.vue`, `frontend/src/stores/useAppConfigStore.ts`, and their tests; existing upload dialog, layout store, and screen breakpoint are reused.
- Shared contract: optional `pBgUrl` in the theme of `IPageLayoutConfig` in `common/global.d.ts`.
- Panel: default theme in `panel/src/app/service/frontend_layout.ts`; existing `/api/overview/layout` and `/api/overview/upload_assets` routes retain their public-read/admin-write permissions and storage paths.
- Catalogs: `languages/en_US.json` and `languages/zh_CN.json` for new appearance text.
- Verification: frontend type checking/lint/tests, common/daemon/panel tests and builds as required for the shared contract, and real-process integration coverage of layout persistence and authorization.
- No new dependencies, daemon protocol changes, or config migration are required.
