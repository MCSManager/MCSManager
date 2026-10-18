# Design

## Context

See `proposal.md` for motivation. The frontend currently exposes one helper named `openMarketDialog`, but that helper mounts `frontend/src/widgets/instance/dialogs/MarketDialog.vue`, whose behavior is specifically preset selection and optional instance reinstall. Recent navigation changes call this helper as though it were the full market UI from `frontend/src/widgets/market/index.vue`.

The market UI is opened from the shared `fc` module through an independently mounted dialog component.

## Goals / Non-Goals

**Goals:**

- Give the full application market and instance preset reinstall flows distinct helper names and components.
- Keep the market install and preset UI in one dialog component.
- Preserve the existing reinstall API arguments and confirmation behavior for internal frontend callers.
- Keep navigation callers simple and keep unrelated routing/layout behavior unchanged.

**Non-Goals:**

- Redesign the market, quick-start, or reinstall experiences.
- Change backend install/reinstall APIs, permissions, or persisted data.
- Restore `/market` as a layout-configured page or re-add the market widget to the customizable card pool.
- Add a replacement iframe action for market or reinstall dialogs.

## Decisions

### 1. Rename the reinstall helper and its types explicitly

The existing helper becomes `openInstanceReinstallDialog`, and its options type becomes `OpenInstanceReinstallDialogProps`. The old instance dialog component is renamed to match its purpose. Terminal reinstall callers use the new helper name while retaining the same daemon id, instance id, `autoInstall`, and Docker-template options.

This is preferred over a generic name such as `openPresetDialog` because the helper can immediately execute the destructive reinstall flow when `autoInstall` is enabled.

### 2. Keep the full market UI in its dialog component

A market-owned dialog component will contain the full market UI inside the existing Ant Design modal pattern. It will supply a minimal synthetic `LayoutCard` with empty metadata for `McPreset` and the existing card helper contract.

The former `frontend/src/widgets/market/index.vue` component has no other caller, so merging it into `MarketDialog.vue` removes an unnecessary forwarding layer without changing behavior.

### 3. Load the full market dialog lazily from the shared helper

`openMarketDialog` will dynamically import the market dialog before mounting it with `useMountComponent`. Lazy loading keeps the market UI out of the shared helper's initial module graph.

This preserves the existing helper API without adding another wrapper component.

### 4. Remove the iframe market-dialog action

The `OpenMarketDialog` entry and its import will be removed from the iframe action handler. No replacement iframe action is added because market and instance reinstall dialogs remain first-party frontend interactions.

### 5. Keep navigation callers on the new full-market helper

Header/sidebar market entries and the instance-list market button will continue to call `openMarketDialog`, but after the helper is corrected they will display the full market widget. The `/market/editor` route remains unchanged.

### 6. Allow card tools to run without router injection

The dialog is mounted through `useMountComponent`, which creates an independent Vue app without installing Vue Router. `useLayoutCardTools` will therefore treat an unavailable route the same as a route without the requested query key, while preserving card metadata precedence and the existing required-value error.

### 7. Close the dialog when opening the market editor

The market editor action will keep its existing `/market/editor` navigation and call the dialog's existing `cancel` handler so the independently mounted dialog is destroyed after navigation.

### 8. Close the dialog after a preset installation starts

`McPreset` will emit an `install-started` event after the async installation task is created and `startDownloadTask` is invoked. `MarketDialog` will handle the event with its existing `cancel` handler, keeping the reusable preset flow independent from the dialog mounting implementation.

## Risks / Trade-offs

- [The market dialog is a comparatively large UI surface] → Keep the existing dynamic import so callers do not load it eagerly.
- [A synthetic card may drift if `LayoutCard` later gains required fields] → Define the complete minimal card object in one dialog wrapper and let TypeScript enforce the contract.
- [A nested create-instance modal opens above the market modal] → Reuse the current Ant Design modal behavior and verify the manual install flow in component tests or a focused UI smoke check.
- [A standalone mounted widget has no injected route] → Guard route query access in the shared card helper and cover optional and required lookups without a router.
- [Route navigation does not unmount an independently mounted dialog] → Explicitly cancel the market dialog when opening the market editor.
- [The preset component cannot destroy its independently mounted parent] → Emit an installation lifecycle event and let the market dialog close itself.

## Migration Plan

1. Rename the reinstall helper, type, component, and internal callers without changing behavior.
2. Add the full market dialog wrapper and implement the new `openMarketDialog` lazy mount.
3. Verify navigation entry points open the full market, terminal flows still open the reinstall selector, and the iframe action is absent.
4. Run frontend type checking, linting, and tests. Roll back by reverting the frontend-only changes; there is no data migration.
