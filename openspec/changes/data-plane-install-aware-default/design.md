# Design

## Context

`SystemConfig.dataPlane` is the string-literal union `"direct" | "proxy"` with class default `"direct"` (`panel/src/app/entity/setting.ts`). It is compared against raw strings at five panel sites — `panel/src/app.ts:164`, `panel/src/app/routers/filemananger_router.ts:493,547`, `panel/src/app/routers/instance_operate_router.ts:249`, `panel/src/app/routers/instance_admin_router.ts:97` — surfaced to the frontend via `Settings.dataPlane: "direct" | "proxy"` (`frontend/src/types/index.ts:78`), rendered as two hardcoded option values in `frontend/src/widgets/Settings.vue`, and round-tripped by `common/test/integration/lib/settings.ts` against a real booted panel.

`StorageSubsystem.load` (`common/src/system_storage.ts:80`) constructs `new classz()` and then deep-copies the persisted JSON onto it, so any field absent from the JSON keeps the class default. `initSystemConfig` (`panel/src/app/setting.ts:10`) already distinguishes the two install shapes exactly: `load` returns `null` when `panel/data/SystemConfig/config.json` is missing (fresh install), and a populated object when the file exists (upgrade). The integration suite `common/test/integration/suites/dataplane.test.ts` boots a real panel into an `mkdtemp` workspace — i.e. a fresh install — and currently asserts the default is `"direct"`.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- One named type for the `dataPlane` domain on each side of the wire, with the JSON / HTTP payload format preserved.
- Fresh installs default to `proxy` so a new deployment does not require a publicly reachable daemon port.
- Upgrades never silently flip an existing deployment's data-plane mode: a config that predates the field falls back to `direct`, and a config that already carries an explicit value keeps it.
- Mode-dependent behavior — direct vs proxy addressing, proxied download/upload/terminal streaming, hot-reload on `PUT /overview/setting` — is unchanged.

**Non-Goals:**

- Changing the wire values `"direct"` / `"proxy"` (JSON, HTTP API, and frontend option values all stay string-valued).
- Per-node data-plane configuration.
- Migrating already-persisted `dataPlane` values.
- Touching the daemon, `common/` source, or the proxy implementation itself (`proxy_data_plane.ts`, `gateway_token.ts`, `terminal_bridge`).

## Decisions

**D1: String enum `DataPlaneMode { Direct = "direct", Proxy = "proxy" }`, not a numeric enum or a `as const` object.**
String-valued enum members keep the persisted JSON value and the HTTP API payload byte-identical to today, so existing `panel/data/SystemConfig/config.json` files, the `PUT /overview/setting` body shape, and the frontend dropdown's wire value all round-trip unchanged. A numeric enum would rewrite persisted values to `0`/`1` and break API clients and stored configs. An `as const` object plus a derived union would work but gives no nominal type on the field and no `keyof typeof` handle for the dropdown; the project already uses `export enum` for comparable domains (`ROLE`, `UserPassWordType` in `panel/src/app/entity/user.ts`; `INSTANCE_STATUS_CODE`, `AppTheme` in `frontend/src/types/const.ts`).
Rejected: numeric enum (breaks persisted JSON and API clients); `as const` object (no nominal type, diverges from project convention).

**D2: Keep the class-level default as `DataPlaneMode.Direct`; set `DataPlaneMode.Proxy` only on the fresh-install branch of `initSystemConfig`.**
`StorageSubsystem.load` restores absent fields from the class default, so a config that predates the `dataPlane` field naturally falls back to `Direct` — exactly the upgrade contract. The fresh-install branch (`load` returned `null`) then explicitly writes `Proxy` before persisting. This keeps the upgrade path as a pure property of the loader and puts the one intentional divergence in a single, obvious line.
Rejected: (a) flip the class default to `Proxy` and post-process loaded configs to backfill `Direct` when the key is absent — requires inspecting the raw JSON (the loader already abstracted that distinction) and duplicates the loader's contract; (b) add a persisted `dataPlaneVersion` marker to detect upgrades — extra persisted state for a distinction `load` already makes.
Note: `load` also returns `null` for a present-but-unparseable config file (`common/src/system_storage.ts` logs "Treating it as missing"), so a corrupted `config.json` follows the fresh-install path and becomes `Proxy` — and the entire config resets to defaults, not only `dataPlane`. That is the loader's pre-existing corrupt-file behavior, unchanged here; the spec delta names it explicitly so the boundary is documented rather than accidental.

**D3: The enum is defined independently in `panel/src/app/entity/setting.ts` and `frontend/src/types/index.ts`.**
The frontend does not alias `common/` today (only panel and daemon do, via tsconfig `paths` + webpack `resolve.alias`); adding that alias for a two-member enum is out of scope. The two enums carry identical string values and are documented as a matched pair; the contract between them is the wire format, not a shared TypeScript symbol.
Rejected: export from `common/src/` and add a frontend alias (touches build config for a two-member enum, out of scope).

**D4: The five panel-side `dataPlane === "proxy"` comparisons become `=== DataPlaneMode.Proxy`, and the frontend dropdown option `value`s become enum members.**
Pure type-safety refactor with no behavior change. A typo in a comparison or in the dropdown's `value` becomes a compile error instead of a silent runtime divergence. `settings_router.ts`'s `if (config.dataPlane != null) systemConfig.dataPlane = config.dataPlane;` needs no change beyond the type flowing through `Partial<SystemConfig>`.

**D5: The integration suite asserts the new fresh-install default (`"proxy"`) and still exercises both modes end to end.**
`common/test/integration/` boots a real panel into an `mkdtemp` workspace — i.e. a fresh install — so the natural default assertion flips from `"direct"` to `"proxy"`. The suite keeps its existing direct-vs-proxy functional coverage (chunked upload, byte-identical download, terminal stdin/stdout) by explicitly setting each mode before exercising it, so the change of default does not reduce coverage. The `getDataPlane` helper's `?? "direct"` fallback in `common/test/integration/lib/settings.ts` becomes `?? "proxy"` to match.
Rejected: keep asserting `"direct"` and force-set the mode before the assertion — would hide the very behavior this change introduces.

**D6: The i18n hint text is updated in both `en_US.json` and `zh_CN.json`.**
`TXT_CODE_settings_dataPlane_hint` currently frames `"direct"` as "(legacy default)". After this change the default is install-dependent, so the hint describes the two modes and states that `proxy` is the default on new installs. Other locales are maintained separately (per AGENTS.md §7) and are out of scope.

**D7: Integration suites that assert DAEMON-side terminal/passport semantics are pinned to `direct` mode.**
The fresh-install default flip changes the mode those suites run in. Three suites document the daemon's own stream/mission semantics and would otherwise silently switch to exercising the panel's `TerminalBridge` / `GatewayToken` instead: `streams.test.ts` (the daemon's socket forward-set — "disconnect s1 → s2 still receives"), `security_files.test.ts` ("stream_channel passport is REUSABLE within its TTL" — the daemon's `stream_router` never `deleteMission`s), and `docker.test.ts` (container terminal round-trips on the attach stream). Each pins `setDataPlane("direct")` in its setup, with a comment naming the proxy-mode counterpart coverage in `dataplane.test.ts` / `proxy_advanced.test.ts`. Suites whose assertions are mode-agnostic (`auth`, `user`, `instance`, `files`, `security_user`, `security_instance`, `security_sso_redirect`, `security_auth`) keep running on the default and were verified to pass in `proxy` mode.
Rejected: leave them on the default and fix `TerminalBridge` instead — the bridge's browser-facing semantics are a separate concern from this change's contract ("mode-dependent behavior is unchanged"), and the suites above are explicitly about the daemon's own surface.

**D8: A panel unit test pins the upgrade half of the contract.**
`panel/src/__test__/system_config_default.test.ts` asserts (a) the class-level default is `DataPlaneMode.Direct`, (b) a persisted config with no `dataPlane` key loads as `Direct`, (c) an explicit `"direct"` / `"proxy"` value round-trips unchanged, and (d) the enum's wire values are the persisted strings. The fresh-install half (`initSystemConfig` → `Proxy`) is covered end-to-end by `dataplane.test.ts`. The round-trip cases write into a throwaway `Storage` category under the real `DATA_PATH` and clean up in `afterAll`, because panel's vitest runs in worker threads where `process.chdir` is unsupported (unlike `common/` and `daemon/`, which set `threads: false`); redirecting `DATA_PATH` would mean changing panel's vitest execution mode for every suite, which is a larger change than this contract needs.

**D9: `PUT /overview/setting` validates `dataPlane` membership before persisting.**
The enum is erased at runtime, so a wire value of `"garbage"` would otherwise be persisted verbatim and silently behave as `Direct` (it is only compared with `=== DataPlaneMode.Proxy`). The handler rejects anything outside `{Direct, Proxy}` and leaves the persisted value untouched, mirroring the existing `ssoType` guard at `settings_router.ts`. The route is `ROLE.ADMIN`-gated and the value is only compared for equality, so this is hardening/consistency rather than an injection fix — but AGENTS.md §8 asks for input validation on external boundaries, and the failure mode (a silently-accepted typo'd mode) is exactly the kind of thing the enum refactor exists to prevent.
Rejected: leave it unvalidated (pre-change behavior) — the refactor would then still permit a value the type system says is impossible.

## Risks / Trade-offs

- [Operators upgrading from a pre-`dataPlane` version keep `direct` and may not learn about `proxy`] → Acceptable: the change's contract is "never silently flip an existing deployment". The security-tab hint and docs advertise `proxy` for new installs.
- [A fresh install that later downgrades to a pre-`dataPlane` build would see the persisted `dataPlane: "proxy"` field ignored by the older loader] → Harmless: older builds fall back to their own class default (`direct`); no data loss, and the field is not yet read by that build.
- [Two enum definitions could drift] → Each is two members with fixed string values; drift is caught by the integration suite, which round-trips the value over the real HTTP API and asserts equality.
- [Existing automation that asserted "a fresh panel boots in direct mode" breaks] → Intentional and expected; the new contract is captured in the spec delta and the integration test is updated in the same change.
- [A deployment that relies on `direct` but starts with no config file (e.g. wiped `data/`) would silently move to `proxy`] → This is the definition of a fresh install; the operator's explicit `dataPlane` value lives in the config file that was removed. Documented in the spec delta's "Upgrade preserves an explicit value" scenario as the counterpart.
- [Terminal I/O through the panel's `TerminalBridge` is less exercised than the daemon's direct socket path, and the flip makes it the default for new installs] → Observed while landing this change: `streams.test.ts`'s "disconnect s1 → s2 still receives" and `docker.test.ts`'s container terminal round-trip both fail in `proxy` mode but pass in `direct` mode, while `dataplane.test.ts`'s proxy terminal case (dual-socket broadcast + Chinese + stop) passes. The affected suites are pinned to `direct` per D7 so this change stays inside its "mode-dependent behavior is unchanged" boundary, but the underlying bridge behavior is a real pre-existing gap that this change now exposes to every new install. It should be tracked as a follow-up (reproduce the two failures with `dataPlane=proxy`, then decide whether `TerminalBridge` needs per-subscriber stream clients or a different refcount/teardown path), not fixed here.
