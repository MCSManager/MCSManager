# Spec Delta

## Purpose

Governs how panel and daemon discover, compare, download and apply self-updates from an operator-configured source that defaults to the official GitHub Release, including fail-closed version checking and safe archive application.

## ADDED Requirements

### Requirement: Update source resolution
Panel and daemon SHALL resolve their update source from `updateSourceUrl`: an operator-configured URL wins, otherwise the default `https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_update_manifest.json` is used. An empty `updateSourceUrl` SHALL disable update information. When the panel queries a daemon's update info or triggers a daemon update, the daemon SHALL prefer the panel-forwarded source over its own configuration.

#### Scenario: Default source is the GitHub Release manifest
- **WHEN** the operator has configured no `updateSourceUrl`
- **THEN** the system checks for updates against the GitHub Release manifest URL

#### Scenario: Operator override wins
- **WHEN** the operator sets `updateSourceUrl` to a custom URL
- **THEN** update information is fetched from that URL instead of the default

#### Scenario: Empty source disables the feature
- **WHEN** `updateSourceUrl` is empty
- **THEN** no update information is reported and no update is offered

#### Scenario: Panel-forwarded source reaches the daemon
- **WHEN** the panel queries a daemon for update information while carrying its own `updateSourceUrl`
- **THEN** the daemon fetches the manifest from the forwarded URL rather than its local configuration

### Requirement: Update manifest schema
An update manifest SHALL carry optional `daemon` and `web` entries; each entry provides `version`, `url`, and optional `notes`. Each side SHALL compare and download through its own entry; a missing entry for the side being updated SHALL yield no update rather than a partial one.

#### Scenario: Side-specific entry drives the update
- **WHEN** the manifest contains a `web` entry with `version` and `url`
- **THEN** the panel compares `version` against its own and, if newer, downloads `url`

#### Scenario: Missing entry yields no update
- **WHEN** the manifest lacks the entry for the side being updated
- **THEN** no update is offered and no download is started

### Requirement: Fail-closed version comparison
A side SHALL offer an update only when the manifest fetch and parse succeed and the advertised version is a dotted numeric version (an optional leading `v` is ignored) greater than the running version. If fetching or parsing fails, the version is malformed, or comparison is not possible, the system MUST NOT claim that a new version is available.

#### Scenario: Fetch failure stays silent
- **WHEN** the update source cannot be fetched or returns invalid data
- **THEN** the system reports no new version instead of prompting for an update

#### Scenario: Malformed version stays silent
- **WHEN** the advertised version is not a dotted numeric string (e.g. arbitrary text)
- **THEN** the system reports no new version

#### Scenario: Newer version is offered
- **WHEN** the advertised version is dotted-numeric and greater than the running version
- **THEN** the system offers the update and displays its release notes when present

#### Scenario: Equal or older version is rejected
- **WHEN** the advertised version is equal to or lower than the running version
- **THEN** no update is offered and an explicit update attempt reports that the current version is already the latest

### Requirement: Update package download and extraction
An update SHALL download the entry's package to a staging area and extract it before any install-directory change. Both `.tar.gz`/`.tgz` and `.zip` packages SHALL be supported. Extraction MUST reject the whole package when any entry would escape the destination directory (absolute path or `..` traversal) or is a link entry, leaving the install directory untouched.

#### Scenario: tar.gz package extracts
- **WHEN** the downloaded package is a `.tar.gz`/`.tgz` archive with files at its root
- **THEN** its entries are extracted into the staging area for overlay

#### Scenario: zip package extracts
- **WHEN** the downloaded package is a `.zip` archive (custom update source)
- **THEN** its entries are extracted into the staging area for overlay

#### Scenario: Traversal entry rejects the package
- **WHEN** any archive entry resolves outside the staging directory or is a symbolic/hard link entry
- **THEN** extraction is aborted and the install directory is left unchanged

### Requirement: Update package application
Applying an update SHALL validate the extracted package contains `app.js`, then overlay every package file onto the install directory except runtime-state top-level directories (`data/`, `logs/`, `node_modules/`, staging). The overlay SHALL be transactional: if any file copy fails, files already overwritten are restored and files newly added are removed. An applied update takes effect only after a manual restart; the system MUST NOT restart itself.

#### Scenario: Validity gate rejects incomplete packages
- **WHEN** the extracted package has no `app.js`
- **THEN** the update is rejected before any install-directory file is modified

#### Scenario: Whole package is overlaid
- **WHEN** a valid package is applied
- **THEN** every file it ships replaces its counterpart in the install directory while runtime-state top-level directories stay untouched

#### Scenario: Failed copy rolls back
- **WHEN** any file copy fails during application
- **THEN** the install directory is restored to its pre-update state and the update is reported as failed

#### Scenario: Manual restart required
- **WHEN** an update is applied successfully
- **THEN** the operator is told to restart the panel/daemon manually and the running process keeps serving the old build until then
