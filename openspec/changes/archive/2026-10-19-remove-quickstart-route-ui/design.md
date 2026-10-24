# Design

## Context

The frontend router currently maps `/quickstart` to `QuickStartFlow` and its nested Minecraft path to `McPreset`. The dashboard card registry also exposes `QuickStart`, while the panel's default layout provisions both pages. The application market dialog already owns the reusable preset and manual creation flows, so it can replace the old route entry point without changing instance-creation APIs.

## Goals / Non-Goals

**Goals:**

- Make both legacy quick-start paths resolve through the existing unknown-route/404 handling.
- Remove legacy quick-start widgets, flow-only logic, registry entries, and default layout pages.
- Keep instance creation reachable from the instance list through `openMarketDialog`.
- Keep market preset/manual creation, shared quick-start enum values, and install APIs intact.
- Verify frontend and panel changes with their required test/build checks.

**Non-Goals:**

- Do not remove the application market dialog, `McPreset`, `CreateInstanceForm`, or preset/quick-install backend services.
- Do not migrate or delete user-authored persisted layout files; inaccessible legacy pages can remain in existing saved layout data.
- Do not remove translation keys or shared package types that are still used by market and instance-management code.

## Decisions

1. **Delete route registrations instead of redirecting them.** The requested behavior is removal, and leaving redirects would keep the obsolete URL contract alive. Unmatched paths will use the router's existing `/404` handling.

2. **Use the market dialog for the instance-list create action.** `InstanceList` already imports `openMarketDialog` for its empty-state market action, so the primary create button will reuse that helper rather than adding a new route or wrapper.

3. **Remove only flow-specific code from the quick-start hook.** Delete the `useQuickStartFlow` implementation and its route navigation, but retain `QUICKSTART_ACTION_TYPE` and `QUICKSTART_METHOD` exports in the existing module because `CreateInstanceForm`, market components, command-assistant code, and start-command generation still depend on them.

4. **Remove legacy layout defaults at the source.** Delete `/quickstart` and `/quickstart/minecraft` entries from `panel/src/app/service/frontend_layout.ts`. Existing persisted layout JSON is not rewritten, avoiding an unrelated data migration; with the routes gone those pages cannot be opened.

5. **Remove the install-page quick-start choice.** Delete the `toQuickStart` handler and its completion card, leaving the existing overview action as the sole post-install destination.

## Risks / Trade-offs

- [Existing bookmarks to `/quickstart` stop opening a creation flow] → This is the intentional breaking behavior; the router's 404 page remains available and users can use the instance-list market action.
- [Persisted layout JSON may still contain obsolete page records] → Do not mutate user data in this change; route removal prevents rendering, and a later layout migration can clean records if needed.
- [Removing the flow implementation may expose an unused import or enum dependency] → Run frontend type-check, lint, and tests and search for all remaining quick-start route references.

## Migration Plan

1. Remove frontend route/card/entry-point code and prune the flow-only hook implementation.
2. Remove quick-start pages from the panel's generated default layout.
3. Search for remaining `/quickstart` route references and validate that only intentional non-route API/type names remain.
4. Run `cd frontend && npm run type-check && npm run lint && npm test`, then run the panel test suite for the panel layout change.
5. Rollback is a source revert; no persisted data or API migration is required.
