# Spec Delta

## Purpose

Defines how the daemon and panel store and manage their application runtime logs: size-based rotation, timestamped gzip archiving, owner-only access, and age-based retention of rotation archives.

## ADDED Requirements

### Requirement: Size-based rotation of application logs
Each active application log file — `logs/current.log` and `logs/sysinfo.log` for the daemon, `logs/current.log` for the panel, relative to the process working directory — SHALL rotate once it exceeds 10 MB and continue receiving entries under its original name. No log entry written around a rotation SHALL be lost.

#### Scenario: Active log exceeds the size threshold

- **WHEN** an active application log file grows beyond 10 MB
- **THEN** the file is archived and subsequent entries are written to a fresh file of the same name

#### Scenario: Logging continues without loss across a rotation

- **WHEN** entries are logged while a rotation is being performed
- **THEN** every entry appears either in the resulting archive or in the fresh active file

#### Scenario: File below the threshold is untouched

- **WHEN** an active application log file is at or below 10 MB
- **THEN** it is not rotated and keeps receiving entries

### Requirement: Timestamped gzip archives
A rotation SHALL move the rotated content into a gzip-compressed archive named `<base>_<YYYY-MM-DD_HH-mm-ss>.log.gz` in `logs/`, where `<base>` is the active file base name and the timestamp reflects the rotation time. The archive SHALL decompress to exactly the rotated content.

#### Scenario: Archive is named by rotation time

- **WHEN** `logs/current.log` is rotated
- **THEN** a gzip archive whose name embeds the rotation timestamp appears in `logs/`, and no plaintext copy of the rotated content remains

#### Scenario: Archive content preserved

- **WHEN** a rotated archive is decompressed
- **THEN** its content equals the content of the file at rotation time

### Requirement: Owner-only access to logs
The `logs/` directory, active application log files, and rotated archives SHALL be restricted to the owning user (mode `0700`) on operating systems that support POSIX permissions. On platforms with limited permission support, restriction SHALL be best-effort and SHALL never break logging or rotation.

#### Scenario: POSIX permissions applied

- **WHEN** application logs are created or rotated on a POSIX system
- **THEN** the `logs/` directory, active files, and archives each have mode `0700`

#### Scenario: Permission failure does not break logging

- **WHEN** restricting permissions fails (unsupported platform or foreign file owner)
- **THEN** logging and rotation continue normally and the failure is reported through the application log

### Requirement: Age-based archive retention
Rotated application-log archives older than 30 days SHALL be deleted automatically. Retention SHALL be evaluated at process startup and after every rotation, and SHALL apply only to application-log rotation artifacts in `logs/`.

#### Scenario: Archive older than the retention window

- **WHEN** a rotated archive is more than 30 days old at startup or after a rotation
- **THEN** the archive is deleted

#### Scenario: Archive inside the retention window

- **WHEN** a rotated archive is at most 30 days old
- **THEN** the archive is retained

### Requirement: Startup archival of leftover logs
At process startup, before new entries are written, a leftover active application log file SHALL be archived with the same timestamped gzip treatment as a size-triggered rotation, preserving the one-archive-per-run separation. Uncompressed `*.log` archives left by earlier versions SHALL also be compressed and restricted like other archives.

#### Scenario: Leftover active log archived at startup

- **WHEN** the process starts and a leftover active log file from the previous run exists
- **THEN** it is compressed into a timestamped gzip archive before new entries are appended

#### Scenario: Legacy plaintext archive compressed

- **WHEN** the process starts and `logs/` contains an uncompressed `*.log` archive produced by an earlier version
- **THEN** that file is gzip-compressed and restricted like other archives
