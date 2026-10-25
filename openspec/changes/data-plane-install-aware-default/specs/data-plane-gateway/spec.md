# Spec Delta

## Purpose

Refine the `SystemConfig.dataPlane` field's value domain into a named enum and make its default value install-aware: `"proxy"` for a fresh install, `"direct"` when upgrading from a config that predates the field (or that already carries an explicit value, which is preserved). Mode-dependent data-plane behavior is unchanged.

## MODIFIED Requirements

### Requirement: Data-plane mode switch

The panel SHALL expose a `SystemConfig.dataPlane` field whose value domain is the string enum `DataPlaneMode { Direct = "direct", Proxy = "proxy" }`. The persisted JSON value and the HTTP API payload SHALL remain the strings `"direct"` and `"proxy"`. Switching the field at runtime SHALL take effect without a process restart. In `"direct"` mode the browser-facing data-plane APIs SHALL return the daemon's address, identical to the pre-change product.

#### Scenario: Value domain is the DataPlaneMode enum

- **WHEN** `SystemConfig.dataPlane` is typed and assigned in the panel
- **THEN** its TypeScript type is `DataPlaneMode` and its persisted JSON / HTTP API value is the string `"direct"` or `"proxy"`

#### Scenario: Default direct behaves as today

- **WHEN** `dataPlane` is `"direct"`
- **THEN** the browser reaches the daemon directly via the address returned by `stream_channel`/`files/download`/`/files/upload`, identical to the pre-change product

#### Scenario: Switching to proxy takes effect at runtime

- **WHEN** an admin sets `dataPlane` to `"proxy"` via PUT `/overview/setting`
- **THEN** subsequent data-plane API calls return the panel's own address, without a panel restart

#### Scenario: PUT rejects an out-of-domain value

- **WHEN** an admin sends `PUT /overview/setting` with a `dataPlane` value other than `"direct"` or `"proxy"`
- **THEN** the request is rejected and the persisted `dataPlane` is unchanged

## ADDED Requirements

### Requirement: Install-aware default for dataPlane

The default value of `SystemConfig.dataPlane` SHALL depend on whether the panel is booting for the first time. On a fresh install (`panel/data/SystemConfig/config.json` does not exist on first boot) the default SHALL be `DataPlaneMode.Proxy`. On an upgrade (the config file already exists) the default SHALL be `DataPlaneMode.Direct`, applied only when the loaded config carries no `dataPlane` value; a config that already carries one SHALL keep that value unchanged. A config file that exists but cannot be parsed SHALL be treated as a fresh install, consistent with `StorageSubsystem.load`'s existing corrupt-file handling.

#### Scenario: Fresh install defaults to proxy

- **WHEN** the panel boots and `panel/data/SystemConfig/config.json` does not exist
- **THEN** the created `SystemConfig` has `dataPlane === DataPlaneMode.Proxy` and the mode is persisted

#### Scenario: Upgrade from a pre-dataPlane config falls back to direct

- **WHEN** the panel boots and `panel/data/SystemConfig/config.json` exists but its JSON carries no `dataPlane` key
- **THEN** the loaded `SystemConfig` has `dataPlane === DataPlaneMode.Direct`

#### Scenario: Upgrade preserves an explicit value

- **WHEN** the panel boots and `panel/data/SystemConfig/config.json` exists with `dataPlane` set to `"direct"` or `"proxy"`
- **THEN** the loaded `SystemConfig` keeps that value unchanged

#### Scenario: Fresh-install default is observable through the settings API

- **WHEN** an admin reads `GET /overview/setting` on a freshly installed panel with no prior `PUT /overview/setting`
- **THEN** the response's `dataPlane` field is `"proxy"`

#### Scenario: Unparseable config is treated as a fresh install

- **WHEN** the panel boots and `panel/data/SystemConfig/config.json` exists but contains unparseable JSON
- **THEN** the loader discards it and the panel follows the fresh-install default (`dataPlane === DataPlaneMode.Proxy`), noting that the entire config is reset on this path — not only `dataPlane`
