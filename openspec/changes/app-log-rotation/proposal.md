# Proposal

## Why

The daemon and panel application logs (`logs/current.log`, `logs/sysinfo.log`) grow without bound while the process runs: the only archival today is a plain rename at the next startup. A long-running deployment therefore accumulates ever-larger active files, keeps rotated history as uncompressed text with no retention limit, and leaves every archive readable by any local user (default umask) even though application logs can contain operational details — the project already restricts `data/Config/global.json` to its owner for the same reason.

## What Changes

- A shared log-rotation module is added to `common` (a log4js-compatible rotating file appender plus archive/prune/permission helpers) and used by the daemon and panel application log services.
- Active application log files rotate automatically once they exceed 10 MB: the file is renamed with its rotation timestamp, gzip-compressed, and a fresh active file continues receiving writes without losing entries.
- Rotated archives are named by rotation time (e.g. `current_2026-10-12_15-30-00.log.gz`).
- The `logs/` directory, active log files, and `.gz` archives are restricted to the owning user (mode `0700` where the OS supports it).
- Startup archival is upgraded: leftover `current.log` / `sysinfo.log` are archived compressed (still preserving the one-archive-per-startup separation) instead of left as plain renamed files, and leftover plain archive files are compressed as well.
- Archives older than 30 days are deleted automatically (checked at startup and after each rotation).
- Instance output logs (`data/InstanceLog/`) and panel operation/audit logs (`data/operation_logs/`) are intentionally unchanged.

## Capabilities

### New Capabilities

- `application-logging`: Storage, size-based rotation, timestamped gzip archiving, owner-only access restriction, and time-based retention of daemon/panel application runtime logs.

### Modified Capabilities

(none — the 512 KB delete-on-cap behavior of instance output logs (`instance-management`) and the operation-log retention behavior (`user-management`) are intentionally unchanged)

## Impact

- `common`: new `log_rotation` module with unit tests, exported via `common/src/index.ts`.
- `daemon/src/service/log.ts` and `panel/src/app/service/log.ts`: adopt the new appender and run startup maintenance (archive leftovers, compress plain archives, prune, restrict permissions).
- No API, frontend, i18n, or data-model changes; no new runtime dependencies (Node built-in `zlib` / `fs`).
- Windows: permission restriction is best-effort (`chmod` is limited there), consistent with the existing `data/Config/global.json` handling.
