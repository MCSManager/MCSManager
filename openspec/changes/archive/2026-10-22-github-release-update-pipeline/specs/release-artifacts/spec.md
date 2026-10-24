# Spec Delta

## Purpose

Defines the artifact set a GitHub Release publishes for installing and updating MCSManager: the install packages, the code-only update packages, and the update manifest consumed by self-update.

## ADDED Requirements

### Requirement: Release publishes update packages
A GitHub Release SHALL publish `mcsmanager_daemon_update.tar.gz` and `mcsmanager_web_update.tar.gz` as release assets, built from the same source revision as the release tag.

#### Scenario: Release assets contain both update packages
- **WHEN** a release build completes and its assets are listed
- **THEN** `mcsmanager_daemon_update.tar.gz` and `mcsmanager_web_update.tar.gz` are both present among the uploaded assets

### Requirement: Daemon update package contents
`mcsmanager_daemon_update.tar.gz` SHALL contain only the built daemon application code — `app.js`, `app.js.map` and `package.json` — placed at the archive root. It MUST NOT contain dependency trees, PTY/Zip-Tools binaries (e.g. `lib/`), a Node.js runtime, startup scripts, or license/desktop extras.

#### Scenario: Package holds built code at the root
- **WHEN** `mcsmanager_daemon_update.tar.gz` is extracted
- **THEN** `app.js`, `app.js.map` and `package.json` exist at the extraction root

#### Scenario: Package excludes dependencies and binaries
- **WHEN** the daemon update package entries are listed
- **THEN** no `node_modules`, no `lib/` PTY or Zip-Tools binaries, no Node.js runtime executable, and no startup scripts appear

### Requirement: Web update package contents
`mcsmanager_web_update.tar.gz` SHALL contain only the built panel application code — `app.js`, `app.js.map`, `package.json` and the `public/` front-end bundle — placed at the archive root. It MUST NOT contain dependency trees, runtimes, or startup scripts.

#### Scenario: Package holds built code and front-end bundle
- **WHEN** `mcsmanager_web_update.tar.gz` is extracted
- **THEN** `app.js`, `app.js.map`, `package.json` and `public/` exist at the extraction root

#### Scenario: Package excludes dependencies and runtimes
- **WHEN** the web update package entries are listed
- **THEN** no `node_modules`, no Node.js runtime executable, and no startup scripts appear

### Requirement: Release publishes the update manifest
A GitHub Release SHALL publish `mcsmanager_update_manifest.json` whose entries follow the auto-update manifest schema: per side (`daemon`, `web`) a `version`, a package `url`, and optional release notes. `version` SHALL equal that side's `package.json` version in the tagged build, `url` SHALL point at this release's corresponding update package, and `notes` SHALL carry the release body text.

#### Scenario: Versions match the tagged build
- **WHEN** `mcsmanager_update_manifest.json` of a release is read
- **THEN** `web.version` equals the tagged `panel/package.json` version and `daemon.version` equals the tagged `daemon/package.json` version

#### Scenario: Package URLs are pinned to the release
- **WHEN** the manifest's `url` fields are read
- **THEN** each points at the matching update package asset of the same release tag (not a floating "latest" URL)

#### Scenario: Notes carry the release body
- **WHEN** the manifest's `notes` field is read
- **THEN** it contains the release body text of that release

### Requirement: Web-only install packages are not published
A GitHub Release MUST NOT publish `mcsmanager_windows_web_only_release.zip` or `mcsmanager_linux_web_only_release.tar.gz`; the full install packages and daemon-only packages remain part of the artifact set.

#### Scenario: Web-only packages are absent
- **WHEN** the release assets of a new build are listed
- **THEN** neither `mcsmanager_windows_web_only_release.zip` nor `mcsmanager_linux_web_only_release.tar.gz` is present

#### Scenario: Other install packages remain
- **WHEN** the release assets of a new build are listed
- **THEN** the linux/windows full and daemon-only install packages are still present
