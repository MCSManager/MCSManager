# Proposal

## Why

`SystemConfig.dataPlane` currently defaults to `"direct"` for every install. A new deployment is therefore opted into the legacy browser→daemon direct data plane by default, which requires the daemon's :24444 port to be publicly reachable — the very attack surface the unified data gateway (`2026-10-14-unified-data-gateway`) was built to remove. The secure-by-default choice for a fresh install is `"proxy"`, where only the panel port is exposed.

At the same time, an existing deployment that has been running with `"direct"` (or whose config file predates the `dataPlane` field entirely) must not have its data-plane mode silently flipped on upgrade: a rolling change of the browser-facing connection topology is a user-visible behavior change that can break uploads, downloads, and terminals in environments where the daemon port is firewalled off.

Separately, the value is typed as the string-literal union `"direct" | "proxy"` and compared against raw strings at five panel sites (`app.ts`, `filemananger_router.ts` ×2, `instance_operate_router.ts`, `instance_admin_router.ts`), in the frontend `Settings` type, and in the integration test helper. A typo in any of those sites compiles cleanly and fails at runtime.

## What Changes

- `SystemConfig.dataPlane` is retyped from the string-literal union `"direct" | "proxy"` to a string enum `DataPlaneMode { Direct = "direct", Proxy = "proxy" }`. The JSON persisted value and the HTTP API payload remain the strings `"direct"` / `"proxy"`, so existing `panel/data/SystemConfig/config.json` files, the `PUT /overview/setting` body shape, and the frontend dropdown's wire value all round-trip unchanged.
- The default value of `dataPlane` becomes install-aware:
  - Fresh install (`panel/data/SystemConfig/config.json` does not exist on first boot) → `DataPlaneMode.Proxy`.
  - Upgrade (the config file already exists) → `DataPlaneMode.Direct` applies only when the loaded config carries no explicit `dataPlane` value; a config that already carries one keeps it unchanged.
- A matching `DataPlaneMode` enum is added to the frontend `Settings` type so the dropdown and the type-checker share one source of truth on the UI side.
- The five panel-side `dataPlane === "proxy"` comparisons become `=== DataPlaneMode.Proxy` (pure type-safety refactor, no behavior change).
- The security-tab hint text (`TXT_CODE_settings_dataPlane_hint`) is updated so it no longer claims `"direct"` is the default.
- The integration suite `common/test/integration/suites/dataplane.test.ts` asserts the new fresh-install default (`"proxy"`) and keeps its end-to-end coverage of both modes by explicitly setting each mode before exercising it.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `data-plane-gateway`: the `SystemConfig.dataPlane` field's value domain becomes a named enum and its default becomes install-aware (`"proxy"` on fresh install, `"direct"` when upgrading from a config that predates the field). All mode-dependent behavior — direct vs proxy addressing, proxied download/upload/terminal streaming, hot-reload on `PUT /overview/setting` — is unchanged.

## Impact

- `panel/src/app/entity/setting.ts`: new `DataPlaneMode` string enum; `SystemConfig.dataPlane` retyped; class-level default stays `DataPlaneMode.Direct` so a config that predates the field naturally falls back to `"direct"` via `StorageSubsystem.load`'s `new classz()` + deep-copy semantics.
- `panel/src/app/setting.ts` (`initSystemConfig`): on the fresh-install branch (load returned `null`), explicitly set `dataPlane = DataPlaneMode.Proxy` before persisting.
- `panel/src/app.ts`, `panel/src/app/routers/filemananger_router.ts`, `panel/src/app/routers/instance_operate_router.ts`, `panel/src/app/routers/instance_admin_router.ts`: raw `"proxy"` string comparisons become `DataPlaneMode.Proxy`.
- `frontend/src/types/index.ts`: add `DataPlaneMode` enum and retype `Settings.dataPlane`.
- `frontend/src/widgets/Settings.vue`: dropdown option `value`s become enum members.
- `languages/en_US.json`, `languages/zh_CN.json`: update `TXT_CODE_settings_dataPlane_hint` wording.
- `common/test/integration/lib/settings.ts`: `getDataPlane` fallback becomes `"proxy"`; `setDataPlane` keeps its string parameter (it drives the HTTP wire format).
- `common/test/integration/suites/dataplane.test.ts`: flip the default-mode assertion and keep both-mode functional coverage.
- No daemon, no `common/` source, no API route shape change, no persisted JSON schema change, no new runtime dependencies.
