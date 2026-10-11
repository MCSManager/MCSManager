# instance-mods Specification

## Purpose

Defines mod and plugin management for game-server instances: jar discovery and metadata, enable/disable toggles, deletion, installation from remote URLs, config-file lookup, and market integration (Modrinth / CurseForge). Mod file operations may be redirected into an MCDR sub-workspace; transfers integrate with the shared file-task machinery.

## Requirements

### Requirement: Mod and Plugin Discovery
The daemon SHALL scan the instance's mod and plugin directories (common casings) for jar files, including disabled ones, and report each entry with its parsed metadata (id, name, version, description where the jar format provides it), file hash, and enabled flag. Listings SHALL be paginated with a page-size cap of 50 and MAY filter by folder and name substring. Metadata parsing and hashing SHALL be cached per file until the file's size or modification time changes (current behavior).

#### Scenario: Disabled jars are listed with their flag
- **WHEN** a jar file carries the disabled suffix
- **THEN** it appears in the listing with its enabled flag cleared

#### Scenario: Page size is capped at fifty
- **WHEN** a listing requests more than 50 entries per page
- **THEN** the page size is clamped to 50 (current behavior)

#### Scenario: Metadata cache is invalidated by file changes
- **WHEN** a jar's size or modification time changes
- **THEN** its metadata and hash are re-parsed (current behavior)

### Requirement: Mod Toggle and Deletion
Toggling SHALL flip a jar between its enabled and disabled form by renaming the file suffix; deletion SHALL remove the jar from disk. Both SHALL be confined to the mod workspace (see Mod File Workspace Redirection).

#### Scenario: Toggle renames the suffix
- **WHEN** an enabled mod is toggled off
- **THEN** the jar file is renamed to the disabled form and the listing reflects it

#### Scenario: Delete removes the jar
- **WHEN** a mod is deleted
- **THEN** the jar file is removed from the workspace

### Requirement: Mod Installation
The daemon SHALL download a mod jar from a validated URL into the mod workspace, with an optional fallback URL used when the primary download fails. The panel SHALL validate both URLs against the URL safety rules before forwarding. Downloads SHALL integrate with the shared URL-download task list and concurrency cap (current behavior).

#### Scenario: Unsafe URLs are refused at the panel
- **WHEN** a mod download request carries an unsafe primary or fallback URL
- **THEN** the request is rejected before reaching the daemon

#### Scenario: Fallback URL is used when the primary fails
- **WHEN** the primary mod download fails and a fallback URL is present
- **THEN** the download is retried against the fallback URL (once — current behavior)

### Requirement: Mod Config File Lookup
The daemon SHALL resolve configuration files for a mod by looking in the instance config directory and, for plugins, a per-mod-id subdirectory (current heuristic), returning matching config file paths inside the mod workspace.

#### Scenario: Config files are resolved inside the workspace
- **WHEN** config files are requested for a mod id
- **THEN** matching files inside the mod workspace are returned and paths outside it are unreachable

### Requirement: Mod File Workspace Redirection
For MCDR-type instances, mod file operations SHALL use the working directory declared in the instance's MCDR config file instead of the instance root. The resolved directory MUST stay inside the instance workspace: escapes, absolute paths that leave the workspace, and Windows-style absolute paths on Unix hosts SHALL all fall back to the instance root. Ordinary file-management routes SHALL NOT be redirected (they always use the instance root).

#### Scenario: Declared working directory stays inside the workspace
- **WHEN** an MCDR config declares a relative working directory inside the workspace
- **THEN** mod operations use that directory as their root

#### Scenario: Escape attempts fall back to the instance root
- **WHEN** the declared working directory resolves outside the workspace (or is the filesystem root)
- **THEN** the redirection is refused and mod operations fall back to the instance root (current behavior)

#### Scenario: Windows-style absolute paths are rejected on Unix hosts
- **WHEN** an MCDR config on a Unix host declares a Windows-style absolute working directory
- **THEN** the redirection is refused (current behavior)

#### Scenario: Plain file routes are not redirected
- **WHEN** an ordinary file-management operation runs on an MCDR-type instance
- **THEN** it is rooted at the instance workspace, not the MCDR working directory

### Requirement: Mod Market Integration
The panel SHALL proxy Minecraft version and mod project metadata lookups (search, info, batch info) from the configured market providers (Modrinth and CurseForge). These metadata routes SHALL NOT require instance ownership (current behavior); instance-scoped mod routes SHALL be gated by instance ownership and the file-manager switch.

#### Scenario: Market metadata is readable without an instance
- **WHEN** any authenticated user requests version or project metadata
- **THEN** the request succeeds without instance ownership (current behavior)

#### Scenario: Instance-scoped mod routes honor ownership
- **WHEN** a regular user requests listing, toggling, or deleting mods for an unassigned instance
- **THEN** the request is rejected as unauthorized

### Requirement: Mod Transfer Integration with File Tasks
Mod downloads SHALL reuse the URL-download task machinery: they count against the global download concurrency cap and appear in the file-status task list. Stopping a mod transfer SHALL stop a download by its file name, or stop an upload by issuing a file delete for the target path (the delete route stops matching transfer tasks instead of deleting — current behavior).

#### Scenario: Mod downloads occupy shared download slots
- **WHEN** mod downloads fill the global download cap
- **THEN** they occupy slots and further plain-file URL downloads are refused until a slot frees (mod downloads themselves are not admitted against the cap — current behavior)

#### Scenario: Stopping a mod upload reuses delete semantics
- **WHEN** a mod upload is stopped
- **THEN** the daemon issues a file delete for the target path which stops the transfer task (current behavior)
