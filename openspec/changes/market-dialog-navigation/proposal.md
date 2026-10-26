# Proposal

## Why

The shared `openMarketDialog` helper currently opens the instance preset reinstall selector, while newer navigation entry points use the same name expecting the full application market. This naming and behavior mismatch makes market navigation open the wrong UI and obscures the destructive reinstall-specific flow.

## What Changes

- Rename the existing instance preset reinstall helper to `openInstanceReinstallDialog` and update its internal callers without changing reinstall behavior.
- Make `openMarketDialog` open the full application market UI directly from a market-owned dialog component.
- Close the market dialog when navigating to the market editor.
- Close the market dialog after a preset installation task starts.
- Remove the iframe `OpenMarketDialog` action and its unused shared-helper import.
- Add focused frontend coverage for the two distinct dialog entry points and run the required frontend checks.

## Capabilities

### New Capabilities

- `application-market`: Defines how users open the full application market separately from the instance preset reinstall selector.

### Modified Capabilities

- None.

## Impact

- Affected frontend areas include `frontend/src/components/fc/index.ts`, market/reinstall dialog components, terminal reinstall actions, market navigation callers, and the iframe action handler.
- No backend API, persisted data, permission model, dependency, or language-key changes are expected.
- The TypeScript helper name changes for internal callers, and the iframe `OpenMarketDialog` action is removed.
