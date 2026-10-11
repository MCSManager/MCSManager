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

#### Scenario: Entry metadata encoding and stat-failure placeholder
- **WHEN** a listing entry's stat fails
- **THEN** it is reported with zero size and mode but keeps its name and type (current behavior); modes are the permission bits' last octal digits and type distinguishes file from directory

#### Scenario: Panel clamps pagination before forwarding
- **WHEN** a panel listing request carries out-of-range page values
- **THEN** the panel clamps them instead of forwarding the daemon's rejection (current behavior)

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

#### Scenario: Copy failures are not reported to the caller
- **WHEN** a copy operation fails after the success response is sent
- **THEN** no error reaches the caller (copy is fire-and-forget — current behavior)

#### Scenario: Move batches apply partially
- **WHEN** a batched move fails partway
- **THEN** earlier moves stay applied and later ones are not attempted (current behavior)

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

#### Scenario: Encoding falls back to gbk under zh_cn when unset
- **WHEN** the instance has no configured file encoding and the daemon language is zh_cn
- **THEN** reads and writes use gbk instead of utf-8 (current behavior)

### Requirement: File Operation Auditing
The panel SHALL record file mutations to the operation log: edits (only when content actually changed), moves and renames, deletes, compression and decompression, and downloads from URL. Audit entries SHALL carry the operator and the affected paths.

#### Scenario: Edit audit fires only when content changes
- **WHEN** a file save writes identical content
- **THEN** no audit entry is written (current behavior)

### Requirement: Permission Changes
The daemon SHALL apply permission mode changes to workspace paths, optionally recursively, using the platform's chmod facility with a bounded execution timeout, and SHALL support batch mode changes that report per-target success or failure without aborting the batch on individual errors.

#### Scenario: Batch reports partial failure
- **WHEN** a batch permission change contains one valid and one invalid target
- **THEN** the result reports success for the valid target and the error for the invalid one, and the valid change is applied

#### Scenario: chmod is Linux-only
- **WHEN** a permission change is requested on a non-Linux daemon
- **THEN** it fails (the implementation spawns the system chmod utility — current behavior)

### Requirement: Direct File Download
The daemon SHALL serve a workspace file over HTTP only to a request presenting a valid download mission credential (see Mission Passport Credentials) minted by the panel for that file and instance, and SHALL serve exactly the file the credential was issued for regardless of the URL filename. The credential SHALL be consumed once the response is successfully prepared.

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

#### Scenario: Response headers differ between throttled and unthrottled serving
- **WHEN** downloads are served with no download speed rate configured
- **THEN** the response omits the attachment disposition header (current behavior), which appears only on the throttled path

### Requirement: Mission Passport Credentials
Download and upload credentials SHALL be registered as typed missions with a one-hour lifetime and a unique password, single-use after successful consumption, and retired strictly by their own mission type. Expiry SHALL be enforced lazily by a periodic sweeper (a credential may outlive its nominal TTL until the next sweep — current behavior). Stream-channel credentials SHALL NOT be consumed on use and stay valid within the same lifetime.

#### Scenario: Duplicate mission password is refused
- **WHEN** a mission registration reuses an existing password
- **THEN** the registration is rejected

#### Scenario: A probe against one mission type cannot poison another
- **WHEN** a request misuses a credential of a different mission type
- **THEN** the credential is not retired and stays valid for its own type (current behavior)

#### Scenario: Expired credentials outlive the nominal TTL until swept
- **WHEN** a credential passes its one-hour lifetime before the periodic sweeper runs
- **THEN** it may still be accepted until the next sweep (current behavior)

#### Scenario: Stream-channel credentials are reusable
- **WHEN** a stream-channel credential is used and reused within its lifetime
- **THEN** every use succeeds (contrast: file transfer credentials are single-use — current behavior)

### Requirement: Direct File Upload
The daemon SHALL accept workspace uploads through a single-shot multipart route (one file per request, 100 MB limit) and a chunked resumable route, both gated by a valid upload mission credential (see Mission Passport Credentials) minted by the panel. All uploads SHALL reduce filenames to their base name and reject unsafe characters, and SHALL auto-rename colliding uploads with a copy suffix when overwrite is disabled.

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

#### Scenario: Received ranges enable resume
- **WHEN** a chunked upload session is initialized
- **THEN** the response reports the already-written byte ranges so the client can resume gaps (current behavior)

#### Scenario: Zero-byte uploads complete at initialization
- **WHEN** a chunked upload declares size 0
- **THEN** it finalizes immediately without any chunk writes (current behavior)

#### Scenario: A size mismatch restarts the writer
- **WHEN** a chunked upload session is re-initialized for a path whose declared size differs from the active writer
- **THEN** the old writer is stopped and replaced (current behavior)

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

#### Scenario: Request parameters are overloaded by type
- **WHEN** a compress request is submitted with type 1
- **THEN** the source field names the output archive and the targets field is the input list; for other type values the source field is the archive and the targets field is the destination directory (current behavior)

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

### Requirement: Direct Transfer HTTP Surface Trust Model
The daemon's HTTP transfer routes SHALL rely solely on the mission credential in the URL path for authorization: no session or header authentication applies, cross-origin requests are allowed, and a multipart gate SHALL reject any multipart request whose path tail is neither a live writer id nor a live upload credential. Request body size and file count SHALL be bounded.

#### Scenario: Multipart request without a live credential is refused
- **WHEN** a multipart request arrives with an unknown path tail
- **THEN** it is rejected at the middleware before any handler runs

### Requirement: Chunked Upload Session Authorization
After a chunked upload session is initialized (which consumes the upload credential), subsequent chunk writes and stop requests SHALL be authorized by the session id alone; the daemon SHALL NOT re-check mission credentials or ownership per chunk. Stopping a download by task id SHALL likewise not verify task ownership (the panel's ownership gate is the only guard — current behavior).

#### Scenario: Chunk writes are authorized by session id after initialization
- **WHEN** chunk writes arrive with a valid session id
- **THEN** they are accepted without further credential or ownership checks (current behavior)

#### Scenario: Stopping by task id skips ownership verification
- **WHEN** a stop request names another instance's download task id
- **THEN** the daemon stops it (current behavior)

### Requirement: File Status Task Accounting
File status SHALL report per-instance and global file-task counters, the count of active URL downloads, and the URL-download task list with workspace-relative paths and progress; completed tasks linger in the list briefly before removal (current behavior). Available disks SHALL be enumerated on Windows only and cached for the process lifetime (current behavior), and the panel SHALL redact them for non-administrators.

#### Scenario: Status counters map to the shared task machinery
- **WHEN** file status is requested while transfers are active
- **THEN** the counters reflect the instance file-lock count, the global task count, and active URL downloads

#### Scenario: Disk enumeration is Windows-only and cached
- **WHEN** file status is requested on a Unix daemon
- **THEN** the disk list is empty; on Windows it is computed once and reused (current behavior)

### Requirement: Transfer Rate Limiting
Transfer speed limits SHALL be expressed as a packet count per second where each packet is 64 KiB. Direct browser downloads SHALL honor the download speed rate, while URL downloads SHALL honor the upload speed rate (current behavior); a zero rate SHALL mean unlimited.

#### Scenario: Configured rate is counted in 64 KiB packets
- **WHEN** a transfer rate limit of N is configured
- **THEN** the transfer is throttled to N × 64 KiB per second

#### Scenario: Direct and URL downloads follow different rates
- **WHEN** both rate limits are configured
- **THEN** direct downloads use the download rate and URL downloads use the upload rate (current behavior)
