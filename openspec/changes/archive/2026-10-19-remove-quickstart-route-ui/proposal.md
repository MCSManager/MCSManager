# Proposal

## Why

The frontend still exposes the legacy `/quickstart` and `/quickstart/minecraft` pages even though instance creation is now available through the application market dialog. These routes and their dashboard/install entry points leave an obsolete creation flow reachable and keep UI code that no longer has a supported entry point.

## What Changes

- **BREAKING** Remove the frontend `/quickstart` route and its `/quickstart/minecraft` child route.
- Remove the legacy quick-start flow cards, route-bound components, and their registration/default layout entries.
- Remove navigation links that push users to `/quickstart`, including the post-install quick-start option; route instance creation actions through the existing market dialog where an instance-creation entry is still needed.
- Keep the reusable market/preset installation components, shared quick-start type values, and backend quick-install APIs that are still used by the market and instance-management flows.
- Ensure generated frontend layout defaults no longer add quick-start pages.

## Capabilities

### New Capabilities

- `quickstart-ui`: Defines the frontend's supported instance-creation entry points and the absence of the removed legacy quick-start routes and cards.

### Modified Capabilities

- None.

## Impact

- Frontend router, layout-card registry/default card pool, instance-list and install-page navigation, and obsolete quick-start flow code/components.
- Panel frontend layout defaults, which currently provision `/quickstart` pages.
- No backend API, persistence schema, permissions, or dependencies change. Existing market-based preset/manual creation and quick-install service contracts remain available.
