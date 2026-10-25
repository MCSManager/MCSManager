# auto-update Specification

## Purpose

Governs how panel and daemon discover, compare, download and apply self-updates from an operator-configured source that defaults to the official GitHub Release, including fail-closed version checking and safe archive application.

## Requirements

### Requirement: Update source resolution
Panel and daemon SHALL resolve their update source from an ordered candidate list of `updateSourceUrl` (primary) then `updateSourceUrlFallback` (backup): non-empty values win over their defaults; empties skipped, duplicates collapsed. Fetching moves to the next candidate only on fetch-level failure (timeout, connection error, HTTP non-2xx, redirect limit, invalid JSON). If all candidates fail or are empty, no update is offered. The daemon prefers panel-forwarded values over local configuration.

#### Scenario: Default source is the GitHub Release manifest
- **WHEN** the operator has configured no `updateSourceUrl`
- **THEN** the system checks for updates against the GitHub Release manifest URL first

#### Scenario: Operator override wins
- **WHEN** the operator sets `updateSourceUrl` to a custom URL
- **THEN** update information is fetched from that URL first instead of the default

#### Scenario: Default backup source is the legacy manifest
- **WHEN** the operator has configured no `updateSourceUrlFallback`
- **THEN** the system uses `https://mcsmanager.com/upgrade/manifest.json` as the backup candidate

#### Scenario: Primary fetch failure falls back to the backup source
- **WHEN** fetching or parsing the manifest from the primary source fails with a timeout, connection error, HTTP non-2xx, redirect limit, or invalid JSON, and a backup source is configured
- **THEN** the system fetches the manifest from the backup source and reports update information from it

#### Scenario: Empty primary source uses the backup source directly
- **WHEN** `updateSourceUrl` is empty and `updateSourceUrlFallback` is set
- **THEN** the backup source is the first and only candidate used for update information

#### Scenario: Semantic manifest problems never cross sources
- **WHEN** a source serves a parseable manifest whose entry for the side being updated is missing or whose version is malformed
- **THEN** the system reports no update for that side and does not fetch from another source

#### Scenario: All sources failing stays silent
- **WHEN** every configured source fails to yield a parseable manifest
- **THEN** no update is offered, no download is started, and the error is surfaced instead of an update prompt

#### Scenario: Empty source disables the feature
- **WHEN** `updateSourceUrl` and `updateSourceUrlFallback` are both empty
- **THEN** no update information is reported and no update is offered

#### Scenario: Reported update info names the source that answered
- **WHEN** update information is reported after a successful manifest fetch
- **THEN** the reported update source is the URL that served the manifest; when no fetch succeeded it is the first configured candidate, and when the feature is disabled it is empty

#### Scenario: Panel-forwarded source reaches the daemon
- **WHEN** the panel queries a daemon for update information or triggers a daemon update while carrying its own `updateSourceUrl` and/or `updateSourceUrlFallback`
- **THEN** the daemon fetches the manifest from the forwarded values rather than its local configuration, preferring each forwarded field over its local counterpart

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
- **WHEN** no configured update source can be fetched or parsed successfully
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

### Requirement: Backup source configuration
Panel and daemon SHALL each persist `updateSourceUrlFallback` in their configuration file, defaulting to `https://mcsmanager.com/upgrade/manifest.json`, and the panel settings page SHALL let the operator read and change both source URLs. A configuration file without the field SHALL keep the default.

#### Scenario: Default backup source in configuration
- **WHEN** a fresh or upgraded configuration file has no `updateSourceUrlFallback` key
- **THEN** the system uses `https://mcsmanager.com/upgrade/manifest.json` as the backup source and persists the field on the next configuration write

#### Scenario: Operator edits the backup source in settings
- **WHEN** the operator saves the settings form with a custom backup source URL
- **THEN** the value is persisted in the panel configuration file and used as the backup candidate for panel and daemon update checks

#### Scenario: Clearing both settings fields disables update checks
- **WHEN** the operator clears both source fields in the settings form and saves
- **THEN** update information is disabled for the panel and for daemons updated through it
