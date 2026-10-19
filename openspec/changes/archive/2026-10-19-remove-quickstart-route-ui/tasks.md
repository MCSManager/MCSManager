# Tasks

## 1. Remove legacy frontend routes and UI registration

- [x] 1.1 Remove `/quickstart` and `/quickstart/minecraft` from the frontend router, delete the legacy `QuickStart` and `QuickStartFlow` components, and remove their layout-card registry/default-card entries; prune only the unused `useQuickStartFlow` implementation while retaining shared enum exports. Verify with `cd frontend && npm run type-check && npm test`.

## 2. Replace obsolete navigation entry points

- [x] 2.1 Change the instance-list create action to open the existing application market dialog, remove the install-page quick-start completion action, and verify no frontend code navigates to `/quickstart`; run `cd frontend && npm run type-check && npm test`.
- [x] 2.2 Confirm market preset/manual creation still renders and routes without the removed pages, including focused existing market tests; run `cd frontend && npm run type-check && npm test`.

## 3. Remove quick-start pages from generated panel layout

- [x] 3.1 Delete the `/quickstart` and `/quickstart/minecraft` entries from the panel's default frontend layout while preserving all market/editor and instance pages; run `cd panel && npm test`.

## 4. Final validation

- [x] 4.1 Review the final diff and run the complete touched-module checks: `cd frontend && npm run type-check && npm run lint && npm test`, then `cd panel && npm test`.

## Workflow follow-up

- Archive the change after implementation review and all required checks pass.
