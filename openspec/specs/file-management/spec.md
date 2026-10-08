# file-management Specification

## Purpose

Defines sandboxed file management for instance workspaces: listing and status, file and directory operations, text editing, permission changes, direct browser transfers (upload and download via mission credentials), URL downloads with SSRF protection, and archive compression/extraction with Zip-Slip defense. The daemon enforces all path boundaries; the panel enforces user-level authorization on top.

## Requirements

### Requirement: Workspace Path Sandboxing
All daemon-side file operations SHALL resolve paths physically (expanding symlink chains, bounded by a hop limit) and SHALL confine every result to the instance's workspace root; any path that escapes MUST be rejected with an illegal-path error and MUST cause no filesystem effect. Destination checks SHALL validate containment without requiring existence; source checks SHALL additionally require existence.

#### Scenario: Dot-dot traversal is rejected
- **WHEN** a file operation supplies a relative path that climbs above the workspace root
- **THEN** the operation fails with an illegal-path error and no file is created, modified, or deleted

#### Scenario: Symlink escape is rejected
- **WHEN** a path reaches a symlink whose target resolves outside the workspace
- **THEN** the operation is rejected and the outside target is untouched

#### Scenario: Symlink followed by parent segments is resolved physically
- **WHEN** a path uses a symlink plus parent-directory segments so that lexical normalization would stay inside but physical resolution escapes
- **THEN** the operation is rejected

#### Scenario: Sibling workspace prefix is rejected
- **WHEN** a path targets another instance whose workspace path begins with this instance's workspace path as a string prefix
- **THEN** the operation is rejected as outside the workspace

#### Scenario: Escape causes no filesystem effect
- **WHEN** any file operation is rejected by a sandbox check
- **THEN** no file is created, modified, deleted, or read outside the workspace

### Requirement: Instance State Gate for File Operations
The daemon SHALL refuse `file/*` control operations except listing and status while the instance is in the busy or starting state. HTTP transfer routes (upload, download) and game-config file access are NOT covered by this gate (current behavior).

#### Scenario: Control-plane mutations are blocked while busy
- **WHEN** a file management mutation is requested while the instance is busy installing
- **THEN** the request is rejected and the filesystem is unchanged

#### Scenario: Listing remains available
- **WHEN** a listing or status request arrives while the instance is starting
- **THEN** the request succeeds

### Requirement: File Listing and Status
The daemon SHALL list a workspace directory paginated, rejecting out-of-range page or page-size values, optionally filtering entries by case-insensitive name substring within that directory, sorting directories before files and then by name, and reporting each entry's name, size, access time, permission mode, and type. Status SHALL report active in-workspace file tasks as workspace-relative paths, platform information, whether the instance is the global node instance, and available disks.

#### Scenario: Pagination bounds are enforced
- **WHEN** a listing request supplies a page size above the maximum, a non-positive page size, or a negative page
- **THEN** the request is rejected with a value-limit error

#### Scenario: Name filter is a substring match
- **WHEN** a listing request supplies a file-name filter
- **THEN** only entries whose names contain that substring case-insensitively are returned, with no recursion into subdirectories

### Requirement: File and Directory Creation
The daemon SHALL create empty files (without truncating an existing file) and create directories including missing parents, for validated destination paths inside the workspace.

#### Scenario: Touch creates missing parents
- **WHEN** a file creation targets a path whose parent directories do not exist
- **THEN** the parents are created recursively and an empty file appears at the target

#### Scenario: Touch does not truncate
- **WHEN** file creation targets an existing file
- **THEN** the existing contents are preserved

### Requirement: Move, Copy, and Delete
Move SHALL refuse to overwrite an existing destination; copy SHALL overwrite silently and MAY complete asynchronously after the success response; delete SHALL be recursive, SHALL ignore missing targets, and SHALL instead stop the matching in-flight upload or download task when the target path has one.

#### Scenario: Move onto an existing path fails
- **WHEN** a move targets a destination that already exists
- **THEN** the move fails and both source and destination remain unchanged

#### Scenario: Delete of a missing target succeeds
- **WHEN** a delete request includes a path that does not exist
- **THEN** the request succeeds without error

#### Scenario: Delete stops a matching transfer
- **WHEN** a delete request targets a path with an active upload or download task
- **THEN** the transfer task is stopped instead of the file being deleted

### Requirement: Text File Editing
Reading a file through the editor SHALL succeed only for existing workspace files up to a size cap of 5 MiB (larger files SHALL be rejected with a size-limit error), and writing SHALL store the supplied text using the instance's configured file encoding with no size cap and no automatic backup. An empty string SHALL be a valid save. Editing a non-existent target SHALL be rejected; creating a new file SHALL go through file creation first.

#### Scenario: Oversized file is refused for reading
- **WHEN** the editor reads a file larger than 5 MiB
- **THEN** the read fails with a size-limit error

#### Scenario: New file cannot be edited into existence
- **WHEN** a write is issued for a target that does not exist
- **THEN** the write is rejected and no file is created

#### Scenario: Empty content saves
- **WHEN** a write is issued with empty text for an existing file
- **THEN** the file is truncated to empty

### Requirement: Permission Changes
The daemon SHALL apply permission mode changes to workspace paths, optionally recursively, using the platform's chmod facility with a bounded execution timeout, and SHALL support batch mode changes that report per-target success or failure without aborting the batch on individual errors.

#### Scenario: Batch reports partial failure
- **WHEN** a batch permission change contains one valid and one invalid target
- **THEN** the result reports success for the valid target and the error for the invalid one, and the valid change is applied

### Requirement: Direct File Download
The daemon SHALL serve a workspace file over HTTP only to a request presenting a valid single-use download mission credential minted by the panel for that file and instance, and SHALL serve exactly the file the credential was issued for regardless of the URL filename. The credential SHALL be consumed once the response is successfully prepared and SHALL expire one hour after minting; a credential of another mission type MUST NOT be accepted.

#### Scenario: Credential binds the file
- **WHEN** a download request presents a valid credential with a different URL filename
- **THEN** the file recorded in the credential is served and no other path is readable

#### Scenario: Credential is single-use
- **WHEN** a completed download credential is presented again
- **THEN** the request is rejected

#### Scenario: Pre-send failures keep the credential
- **WHEN** a download request fails before the response is prepared (bad name, missing file, invalid path)
- **THEN** the credential remains valid for retry

#### Scenario: Mid-transfer abort burns the credential
- **WHEN** a client aborts after the response has been prepared
- **THEN** the credential is consumed and cannot be reused (current behavior)

### Requirement: Direct File Upload
The daemon SHALL accept workspace uploads through a single-shot multipart route (one file per request, 100 MB limit) and a chunked resumable route, both gated by a valid single-use upload mission credential minted by the panel and expiring one hour after minting. All uploads SHALL reduce filenames to their base name and reject unsafe characters, and SHALL auto-rename colliding uploads with a copy suffix when overwrite is disabled.

#### Scenario: Traversal filename is neutralized
- **WHEN** an upload supplies a filename containing path separators or parent segments
- **THEN** only the base name is used and the file lands inside the target workspace directory

#### Scenario: Colliding upload is auto-renamed
- **WHEN** overwrite is disabled and the upload filename already exists in the destination
- **THEN** the upload is stored under a copy-suffixed name, bounded by a retry cap on the chunked route and unbounded on the single-shot route (current behavior)

#### Scenario: Idle chunked writer is swept
- **WHEN** a chunked upload writer has seen no data for longer than the idle limit
- **THEN** the writer is stopped and its partial file is removed

#### Scenario: Chunked writers are locked per path
- **WHEN** two chunked uploads target the same destination path
- **THEN** the second writer is refused because the path is locked (the single-shot route uses no lock — current behavior)

### Requirement: Chunked Upload Completion
A chunked upload SHALL reject writes beyond the size declared at initialization, SHALL finalize automatically (closing the file, releasing the lock, and applying ownership) once the declared byte range is fully covered, and SHALL support optional unzip-on-upload that extracts the archive into its own directory and MAY delete it afterwards. The single-shot route instead extracts into the instance root and always keeps the archive (current behavior).

#### Scenario: Chunked write past declared size is rejected
- **WHEN** a chunk write would extend past the size declared at chunked-upload initialization
- **THEN** the write is rejected and the declared bound is enforced

#### Scenario: Covered ranges finalize automatically
- **WHEN** chunk writes have covered the declared byte range completely
- **THEN** the upload finalizes without an explicit finish call

### Requirement: Download From URL
The daemon SHALL download a remote file into the workspace only after validating the URL safety rules: http or https scheme only, no IP-literal, localhost, dotless, `.local`/`.localhost`-suffixed, link-local, or private-range targets; every redirect hop SHALL be re-validated with a bounded redirect count. The transfer SHALL have a request timeout, bounded retries for transient failures, an optional fallback URL, a concurrency cap across instances, and cancellation that removes the partial file.

#### Scenario: Private target is refused
- **WHEN** a URL download targets a loopback, link-local, or private-range address, a `.local` host, or a scheme other than http/https
- **THEN** the request is rejected with an insecure-URL error and no connection is made

#### Scenario: Throttling follows the upload rate
- **WHEN** a URL download is throttled
- **THEN** it uses the upload speed rate rather than the download speed rate (current behavior)

#### Scenario: Redirect to a private target is refused
- **WHEN** a permitted URL redirects to an unsafe target
- **THEN** the download aborts and no data from the unsafe target is written

#### Scenario: Concurrency cap is enforced
- **WHEN** a URL download is requested while the maximum number of concurrent URL downloads is already running
- **THEN** the request is rejected

### Requirement: Compression and Decompression
Compression SHALL always produce a ZIP archive from selected workspace inputs and reject the request when nothing valid is selected. Decompression SHALL prefer the bundled 7-Zip extractor and fall back to the bundled ZIP tool for ZIP archives only, honoring the configured maximum archive size (200 GB default) and the per-instance concurrent archive-task limit (2 default) on the compress/decompress route.

#### Scenario: Compression produces a zip
- **WHEN** compression is requested for a set of workspace files
- **THEN** a ZIP archive containing those inputs is written at the requested output path

#### Scenario: Oversized archive is refused
- **WHEN** decompression is requested for an archive larger than the configured maximum
- **THEN** the request is rejected with a size-limit error and nothing is extracted

#### Scenario: Concurrent archive limit is enforced
- **WHEN** an archive task is requested through the compress/decompress route while the instance already runs the maximum number of archive tasks
- **THEN** the request is rejected with a concurrency error

#### Scenario: Fallback extractor accepts ZIP only
- **WHEN** the 7-Zip binary is unavailable and a non-ZIP archive is submitted
- **THEN** decompression is refused (the fallback also rejects multi-volume archives)

#### Scenario: Size cap ignores directory recursion
- **WHEN** compression inputs include a directory
- **THEN** only the directory entry's own stat size counts toward the cap (current behavior)

#### Scenario: Upload unzip bypasses the archive-task gate
- **WHEN** an archive is extracted as part of an upload
- **THEN** the extract is not rejected by the archive-task gate (no admission check) but still occupies the file-lock counter while running (current behavior)

### Requirement: Archive Extraction Safety
Before extracting any archive, the daemon SHALL enumerate its entries and reject the entire archive when an entry name contains parent-directory segments, when an entry is a symlink whose target contains parent-directory segments or resolves outside the destination directory (deliberately strict), or when the archive is otherwise malformed; extraction MUST NOT begin for a rejected archive. Extraction SHALL overwrite existing files at the destination.

#### Scenario: Zip-Slip entry rejects the whole archive
- **WHEN** an archive contains an entry whose name escapes the destination directory
- **THEN** the archive is rejected before extraction and the destination is unchanged

#### Scenario: Symlink-target escape rejects the archive
- **WHEN** an archive contains a symlink entry whose target contains parent segments or resolves outside the destination
- **THEN** the archive is rejected before extraction

#### Scenario: Benign archive extracts
- **WHEN** a well-formed archive with normal relative entries is decompressed
- **THEN** its contents appear under the destination directory

#### Scenario: Absolute names are rejected on the ZIP path
- **WHEN** a ZIP archive contains an absolute or backslash entry name
- **THEN** it is rejected before extraction; for non-ZIP formats such names are left to the extractor (current behavior)

### Requirement: File Ownership Synchronization
On Linux, files written by uploads and archive extractions SHALL be chowned to the instance's configured run-as user when that user resolves to a valid system identity. Ownership changes SHALL follow neither symlinks nor special files, SHALL verify containment both lexically and by real path, and SHALL re-verify device and inode identity before applying the change.

#### Scenario: Extracted files match run-as
- **WHEN** an archive is extracted for an instance with a resolvable run-as user
- **THEN** extracted entries and their intermediate directories are owned by that user

#### Scenario: Symlinked entries are not chowned
- **WHEN** extraction produces symlink entries
- **THEN** the ownership pass skips them

### Requirement: File Manager Access Control
The panel SHALL expose file management only when the file-manager switch is enabled for non-administrators, and only for instances the caller owns (administrators pass implicitly). The panel SHALL redact host disk information in status responses for non-administrators and SHALL apply per-route request rate limits for non-administrators. The daemon-side sandbox remains authoritative for all path checks regardless of caller.

#### Scenario: Non-owner is rejected at the panel
- **WHEN** a regular user requests file operations for an instance they are not assigned
- **THEN** the request is rejected before reaching the daemon

#### Scenario: Disabling the file manager blocks regular users
- **WHEN** the file-manager switch is off and a regular user requests file operations
- **THEN** the request is rejected while administrators retain access

#### Scenario: Disk information is redacted
- **WHEN** a non-administrator requests file status
- **THEN** the disk list in the response is empty

### Requirement: Global Node File Manager
File operations SHALL be confined to the instance workspace root; when the workspace root is the filesystem root the confinement is disabled. The synthetic global instance (global0001) is created with a root working directory for node-level file management and is hidden from instance listings; the assignment API does not filter it out, so only operator discipline keeps it unassigned (current behavior). Access to it SHALL remain gated by the panel authorization rules above.

#### Scenario: Root workspace is exclusive by configuration
- **WHEN** file operations run under an instance whose workspace root is `/`
- **THEN** paths may address the whole node filesystem, while the same paths remain rejected for ordinary instances
