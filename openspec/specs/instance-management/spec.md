# instance-management Specification

## Purpose

Defines the game-server instance: its configuration model, lifecycle state machine, execution backends (host process, PTY, Docker container), control commands, terminal streaming, automated behaviors, and the install/update task system. The daemon owns the instance entity and its processes; the panel orchestrates instances across nodes and enforces per-user ownership on top of daemon capabilities.

## Requirements

### Requirement: Instance Configuration Model
The daemon SHALL persist each instance as a configuration record identified by a dashless UUID v4, containing at minimum: display name, start/stop/update command lines, stop timeout, workspace directory, stdin/stdout/file encodings, game type, process backend type, tags, expiry timestamp, category, base port, terminal options, event task options (auto start, auto restart, max restart times, ignore flag), optional RCON and ping settings, Docker container settings, and extra service settings.

#### Scenario: Creation applies defaults
- **WHEN** an instance is created without optional fields
- **THEN** the stored configuration carries the documented defaults (universal game type, general process backend, empty start command, caret-C stop command, PTY enabled, auto start and auto restart disabled, expiry zero meaning never)

#### Scenario: Creation normalizes encodings and workspace
- **WHEN** an instance is created
- **THEN** stdin, stdout, and file encodings are forced to UTF-8, and an empty or dot workspace is resolved to the per-instance data directory under the daemon data root

#### Scenario: Docker settings are complete
- **WHEN** a Docker-backed instance is configured
- **THEN** its Docker settings can express image, container name, port mappings, extra volumes, working directory, environment, labels, network mode and aliases, capabilities, devices, privileged mode, memory / CPU / disk-quota limits, I/O and bandwidth limits, GPU request parameters, and an update-command image selector

### Requirement: Configuration Mutation Rules
The daemon SHALL accept configuration updates through a parameterized merge that type-checks every field and persists the result atomically. Changes to the game type, process backend type, PTY toggle, or RCON enablement SHALL be accepted only while the instance is stopped or busy, and after such a change the instance's preset command bindings SHALL be rebuilt. The stop timeout SHALL be clamped to integer values between 0 and 86400 seconds.

#### Scenario: Runtime-only fields refuse mutation while running
- **WHEN** a configuration update changes the process backend while the instance is running
- **THEN** the change is rejected and the stored configuration is unchanged

#### Scenario: Stop timeout is clamped
- **WHEN** a configuration update sets a stop timeout outside 0–86400
- **THEN** the stored value is clamped into that range and truncated to an integer

#### Scenario: Invalid types are rejected
- **WHEN** a configuration update supplies a non-numeric value for a numeric field
- **THEN** the update is rejected and nothing is persisted

### Requirement: Lifecycle State Machine
The daemon SHALL track every instance in exactly one of the states BUSY (-1), STOP (0), STOPPING (1), STARTING (2), or RUNNING (3). Start SHALL be possible only from STOP; stop SHALL move RUNNING to STOPPING and then to STOP; kill SHALL force the process to exit and settle at STOP; restart SHALL sequence stop then start; install and update SHALL occupy BUSY and settle at STOP. Runtime state SHALL NOT be persisted, so every instance SHALL boot in STOP.

#### Scenario: Start requires stopped state
- **WHEN** a start command is issued for an instance that is not stopped
- **THEN** the command fails and the state is unchanged

#### Scenario: Process exit settles at stopped
- **WHEN** the instance process exits on its own
- **THEN** the instance state becomes STOP, an exit event is emitted to subscribers, and the configuration is persisted

#### Scenario: Daemon restart yields stopped instances
- **WHEN** the daemon restarts and no live container exists for an instance
- **THEN** that instance boots in the STOP state regardless of its prior runtime state (Docker instances with a live labeled container are taken over and end up RUNNING)

### Requirement: Instance Creation and Deletion
The daemon SHALL create instances with a fresh dashless UUID v4 and persist their configuration. Deletion SHALL be accepted only when every targeted instance is stopped, and SHALL remove the instance's configuration, its scheduled tasks, and optionally its workspace files. The panel SHALL, on instance deletion, remove the instance from every user's assignment list.

#### Scenario: Deleting a running instance is refused
- **WHEN** a delete request targets an instance that is running
- **THEN** the request fails and the instance is preserved

#### Scenario: Delete with file removal wipes the workspace
- **WHEN** a delete request for a stopped instance requests file removal
- **THEN** the configuration, scheduled tasks, and workspace directory are removed

### Requirement: Process Instance Start
When the process backend is general, starting SHALL parse the configured start command into an argument vector without invoking a shell, resolve the workspace as working directory, substitute documented text placeholders, and spawn the process. Unbalanced quotes in the command SHALL abort the start with an error instead of spawning. Start SHALL refuse expired instances and instances whose disk quota is exhausted.

#### Scenario: Shell metacharacters are inert
- **WHEN** the start command contains shell operators or command substitution
- **THEN** they are passed as literal argv elements and no shell interpretation occurs

#### Scenario: Unbalanced quote aborts start
- **WHEN** the start command contains an unclosed quoted token
- **THEN** the start fails with an error and no process is spawned

#### Scenario: Placeholders resolve at start
- **WHEN** a start command references a supported placeholder (workspace path, instance uuid, run-as user, steamcmd path, instance name, base port, allocated ports, configured Java runtime, or random uuid)
- **THEN** the spawned argument vector carries the resolved values

### Requirement: Graceful Stop and Timeout Escalation
Stopping SHALL send the configured stop command to the instance's standard input as one or more lines (a caret-C / Ctrl-C token SHALL be translated to an interrupt signal instead of text), mark the instance STOPPING, and start a watchdog. With a positive stop timeout, the watchdog SHALL force-kill the process when the timeout elapses; with a zero timeout, the watchdog SHALL return the instance to RUNNING after ten minutes and report an error. Intentional stops SHALL suppress crash auto-restart.

#### Scenario: Multi-line stop command is delivered
- **WHEN** a stop command contains multiple lines and the instance is running
- **THEN** each line is written to standard input in order

#### Scenario: Timeout escalates to force kill
- **WHEN** a stop is issued with a positive timeout and the process ignores the stop command
- **THEN** the process is force-killed once the timeout elapses and the instance settles at STOP

#### Scenario: Zero timeout falls back to running
- **WHEN** a stop is issued with a zero timeout and the process is still alive ten minutes later
- **THEN** the instance returns to the RUNNING state and an error is reported

### Requirement: Force Kill
Force kill SHALL stop any running asynchronous task, delay the kill until the process has been alive for six seconds, and terminate the process tree (task-tree kill on Windows, recursive kill on Linux; other platforms fall back to killing the direct process) with an unconditional kill. Kill SHALL suppress crash auto-restart.

#### Scenario: Very young process is delayed
- **WHEN** kill is issued within six seconds of process start
- **THEN** the command waits until the six-second mark and then kills the process (it is delayed, not refused)

#### Scenario: Child processes die with the parent
- **WHEN** a running instance with child processes is killed on Windows or Linux
- **THEN** the entire process tree is terminated and the instance settles at STOP

### Requirement: Restart
Restart SHALL suppress crash auto-restart, sequence stop then start, and guard against racing with concurrent lifecycle operations by verifying the start counter has not changed; a mismatched counter or unexpected state SHALL abort the restart.

#### Scenario: Restart produces a new process
- **WHEN** restart completes on a running instance
- **THEN** the old process has exited, a new process has been spawned, and the start counter has advanced

#### Scenario: Restart races are aborted
- **WHEN** a restart poller observes that the start counter changed or the state is unexpected
- **THEN** the restart is aborted instead of starting a second process

### Requirement: Command Input
The command preset SHALL write the supplied text to the instance's standard input encoded with the configured stdin encoding and terminated with the configured line ending. The literal caret-C token SHALL be treated as an interrupt signal rather than text. When RCON is enabled, commands SHALL instead be delivered to the configured RCON endpoint with a bounded response timeout.

#### Scenario: Commands reach the process verbatim
- **WHEN** a command is sent to a running instance with RCON disabled
- **THEN** the encoded text plus line ending appears on the process's standard input

#### Scenario: Caret-C is a control code
- **WHEN** the caret-C token is sent as a command
- **THEN** an interrupt signal is delivered and no caret-C text is written

### Requirement: PTY Terminal Backend
When PTY mode is enabled for a general instance, the daemon SHALL spawn the process through the bundled PTY helper with a named-pipe control channel for window resizing, decode output as UTF-8, and apply the effective terminal size as the minimum of the configured size and all attached watchers. When the PTY helper binary is missing, the daemon SHALL transparently fall back to non-PTY execution.

#### Scenario: Watchers resize the terminal
- **WHEN** a terminal watcher reports a smaller window size than the configured size
- **THEN** the effective PTY size becomes the smaller value

#### Scenario: Missing helper falls back
- **WHEN** the PTY helper binary is absent from the daemon library directory
- **THEN** the instance starts in non-PTY mode and remains fully operable

### Requirement: Docker Container Backend
When the process backend is Docker, starting SHALL validate all container parameters, pull the image when absent, and create a container that binds the instance workspace to the container working directory, labels the container with the instance uuid, and auto-removes it on exit. Container name conflicts SHALL be retried only when the conflicting container carries the same instance label. Bandwidth limits SHALL be applied after start; failure SHALL kill and remove the container.

#### Scenario: Container parameters are validated
- **WHEN** a Docker start request supplies an invalid container name, port mapping, volume, device, CPU set, or GPU request
- **THEN** the start is rejected with a validation error and no container is created (capability lists are passed through unchecked, and out-of-range resource numbers are silently ignored — current behavior)

#### Scenario: Container is labeled and bound
- **WHEN** a Docker instance starts successfully
- **THEN** the created container carries the instance-uuid label and mounts the instance workspace at the configured container working directory

#### Scenario: Foreign name conflict aborts
- **WHEN** container creation fails because a container with the same name exists but lacks this instance's label
- **THEN** the start fails and no takeover of the foreign container occurs

#### Scenario: Restart creates a fresh container
- **WHEN** a Docker instance is restarted after a clean stop
- **THEN** a new container is created under the same name with a new container id

### Requirement: Docker Container Takeover
On daemon boot, the daemon SHALL find containers carrying its instance-uuid label, re-attach each to its Docker-type instance, resume paused containers, and stream their output into the instance channel. A container that cannot be re-attached SHALL be killed and removed.

#### Scenario: Boot re-attaches labeled containers
- **WHEN** the daemon boots while a labeled container from a previous run is still alive
- **THEN** the container's output and lifecycle are re-attached to its instance without restarting the container

#### Scenario: Orphaned labeled containers are skipped
- **WHEN** a labeled container has no matching instance, or its instance is not Docker-backed
- **THEN** the takeover skips it silently and leaves the container running (current behavior)

### Requirement: Terminal Output Streaming and Logs
The daemon SHALL buffer instance output in a bounded ring buffer flushed to connected watchers and appended to a per-instance log file, and SHALL notify watchers of instance start, exit, and failure events. Overflowing the ring buffer SHALL insert a dropped-output notice (oldest entries are evicted); the log file SHALL be deleted once it exceeds its size cap (512 KB).

#### Scenario: Multiple watchers receive the same output
- **WHEN** two terminal watchers are attached to a running instance
- **THEN** both receive identical output events

#### Scenario: Log file self-truncates
- **WHEN** the per-instance log file grows past its size cap
- **THEN** the file is deleted and logging continues to a fresh file

### Requirement: Auto-Start and Crash Auto-Restart
On daemon boot, instances with auto start enabled SHALL be started sequentially after a short delay. When an instance exits and auto restart is enabled and not suppressed, and the restart budget (unlimited exactly when the max-restart-times value is -1) is not exhausted, the daemon SHALL start it again and increment the restart counter. Stop, kill, and restart SHALL suppress exactly one auto-restart cycle. Opening an instance manually SHALL reset the restart counter.

#### Scenario: Crash triggers restart within budget
- **WHEN** an instance with auto restart enabled and budget remaining exits unexpectedly
- **THEN** it is started again and its auto-restart counter increments

#### Scenario: Intentional stop does not restart
- **WHEN** an instance is stopped gracefully through the stop command
- **THEN** no auto-restart occurs

#### Scenario: Exhausted budget stops restarting
- **WHEN** an instance whose restart budget is exhausted exits again
- **THEN** it remains stopped

### Requirement: Instance Expiry Enforcement
An instance whose expiry timestamp is in the past SHALL refuse to start, and any running expired instance SHALL be killed by a periodic check.

#### Scenario: Expired instance refuses start
- **WHEN** start is issued for an instance whose expiry timestamp has passed
- **THEN** the start is refused with an expiry error

#### Scenario: Running expired instance is killed
- **WHEN** the periodic expiry check finds a running instance past its expiry timestamp
- **THEN** that instance is stopped and killed

### Requirement: Disk Quota Enforcement
When a Docker-style disk quota greater than zero is configured, the daemon SHALL periodically measure the workspace and, on overflow, stop the instance and force-kill it if it does not exit within a grace period. Start SHALL refuse to launch an instance whose workspace already exceeds the quota. The check is a no-op on Windows and for the global node instance (current behavior).

#### Scenario: Overflow stops the instance
- **WHEN** a running instance's workspace exceeds its configured disk quota
- **THEN** the instance is stopped and, if still alive after the grace period, force-killed

### Requirement: Asynchronous Install and Update Tasks
The daemon SHALL run per-instance asynchronous tasks (quick install, preset reinstall, update) that occupy the BUSY state, report progress, and settle at STOP. Quick install and preset reinstall SHALL require an administrator role at the daemon, and preset reinstall SHALL wipe the workspace before unpacking. Update SHALL be available to any role allowed to reach the instance. Task errors SHALL be reported without leaking credentials.

#### Scenario: Panel preset reinstall forwards a trusted role
- **WHEN** a regular user requests preset reinstall while the preset switch is enabled
- **THEN** the panel forwards it with an administrator role and the daemon executes it (current behavior)

#### Scenario: Preset reinstall wipes the workspace first
- **WHEN** a preset reinstall task starts for an instance
- **THEN** the workspace contents are removed before the package is unpacked

#### Scenario: Concurrent asynchronous task is refused
- **WHEN** an asynchronous task is requested while another is already running for the instance
- **THEN** the request is rejected

#### Scenario: Quick install denies non-administrators
- **WHEN** a non-administrator role requests a quick install task through the generic async route
- **THEN** the task is denied

#### Scenario: Docker instance requires a Docker package
- **WHEN** a quick install targets a Docker-backed instance with a non-Docker package
- **THEN** the install is refused

### Requirement: Privilege Separation for Instance Configuration
The panel SHALL restrict non-administrators to a whitelist of instance configuration fields (encodings, line endings, stop command, terminal options, event-task options, RCON settings, ping settings, extra service settings, and tags for administrators). Start command, update command, and Docker environment changes SHALL be accepted only for administrators, or when the allow-command-change switch is enabled and the request claims a Docker process backend.

#### Scenario: Backend claim is taken from the request body
- **WHEN** the allow-command-change switch is enabled and a non-administrator claims `processType: "docker"` for a host-process instance
- **THEN** the command change is accepted because the claim is not verified against the stored instance (current behavior)

#### Scenario: Regular user cannot change start command
- **WHEN** a non-administrator submits a start-command change for a general-process instance
- **THEN** the change is rejected or stripped and the stored start command is unchanged

#### Scenario: Docker command change honors the switch
- **WHEN** a non-administrator submits a start-command change for a Docker instance while the allow-command-change switch is enabled
- **THEN** the change is applied

### Requirement: Game Configuration File Editing
The daemon SHALL read and write structured game configuration files (YAML, TOML, properties, JSON, and plain text) inside the instance workspace, using format-specific serialization, and SHALL list which recognized config files are present.

#### Scenario: Structured round-trip preserves values
- **WHEN** a game config file is read, modified, and written back through the config interface
- **THEN** the file remains parseable with the edited values and unaffected keys preserved

### Requirement: Port Allocation
The daemon SHALL allocate each instance a base port from the configured allocatable range on first persistence, wrapping through the range and skipping the daemon's own port, and SHALL expose derived port placeholders as base port plus a bounded offset.

#### Scenario: Base port is assigned once
- **WHEN** an instance is persisted without a base port
- **THEN** it receives the next free base port and keeps that value on later updates

### Requirement: Global Node Instance
The daemon SHALL maintain a fixed synthetic instance (global0001) with a root working directory for node-level operations, hidden from all instance listings, and SHALL recreate it on every boot. The panel assignment API does not filter it out, so keeping it unassigned is by operator discipline (current behavior).

#### Scenario: Hidden from listings
- **WHEN** an instance listing is requested
- **THEN** the global instance is not present in the result

### Requirement: Panel Instance Access Control
The panel SHALL gate every instance-scoped operation (lifecycle, terminal stream, schedules, files, mods) behind instance ownership: administrators pass implicitly, other users only for assigned (daemonId, instanceUuid) pairs. Cross-node batch operations and unrestricted instance search SHALL require administrator level.

#### Scenario: Non-owner is rejected at the gate
- **WHEN** a regular user requests an instance-scoped operation on an unassigned instance
- **THEN** the request is rejected before reaching the daemon

#### Scenario: API key does not bypass ownership
- **WHEN** a valid API key request targets an instance outside that user's assignments
- **THEN** the ownership check still rejects the request

### Requirement: Direct Terminal Streaming
The panel SHALL mint a single-purpose, time-limited stream credential for an authorized instance, allowing the browser to connect directly to the daemon for terminal input, raw input, output, and resize events; the daemon SHALL bind such a stream session to the instance it was issued for.

#### Scenario: Stream credential grants only its instance
- **WHEN** a browser connects to the daemon with a valid stream credential
- **THEN** it can read and write only the terminal of the instance the credential was issued for

#### Scenario: Forged stream password is refused
- **WHEN** a connection presents an invalid or expired stream credential
- **THEN** the daemon refuses the stream session
