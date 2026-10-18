# Tasks

## 1. Separate the instance reinstall dialog

- [x] 1.1 Rename the current reinstall helper, props type, and dialog component to `openInstanceReinstallDialog` terminology; update the terminal caller and remove the iframe `OpenMarketDialog` action and import, then verify with `cd frontend && npm run type-check && npm test`.

## 2. Open the full application market

- [x] 2.1 Add a market-owned dialog wrapper that renders `widgets/market/index.vue` with a type-checked synthetic `LayoutCard`, implement lazy-loaded `openMarketDialog`, and add focused component/helper coverage; verify with `cd frontend && npm run type-check && npm test`.
- [x] 2.2 Verify the header/sidebar and instance-list market entry points use the full-market helper while `/market/editor` and existing quick-start flows remain unchanged; verify with `cd frontend && npm run type-check && npm test`.
- [x] 2.3 Make `useLayoutCardTools` tolerate standalone mounts without Vue Router while preserving metadata precedence and required-value errors; add focused tests and verify with `cd frontend && npm run type-check && npm test`.
- [x] 2.4 Merge the single-use market widget into `MarketDialog.vue`, remove `widgets/market/index.vue`, and close the dialog when opening `/market/editor`; add focused coverage and verify with `cd frontend && npm run type-check && npm test`.
- [x] 2.5 Emit an installation-started event after `McPreset` launches the download task and close `MarketDialog` in response; add focused coverage and verify with `cd frontend && npm run type-check && npm test`.

## 3. Frontend integration checks

- [ ] 3.1 Run the complete frontend validation and review the final diff for unrelated changes with `cd frontend && npm run type-check && npm run lint && npm test`.

## Workflow follow-up

- Archive the change after implementation review and all frontend checks pass.
