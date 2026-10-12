# Design

## Context

Daemon (`daemon/src/service/log.ts`) and panel (`panel/src/app/service/log.ts`) each configure log4js with plain `file` appenders writing `logs/current.log` (plus `logs/sysinfo.log` on the daemon, a 5-second resource sample). There is no runtime rotation: files grow unbounded until startup renames them to `logs/<time>.log`. The apps are bundled with webpack (`BUNDLE=1`), run cross-platform (Linux production, Windows development), and `common/` is source-aliased into both apps, so shared code must be dependency-free and bundle-safe. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- One shared rotation implementation for both apps, behavior identical on Windows and Linux except permission enforcement.
- Rotation that never loses entries and never renames or deletes a file another writer holds open (Windows `EPERM` on renamed open files).
- Archives indistinguishable from a normal log dump after `gunzip`, with owner-only access from creation.

**Non-Goals:**

- Rotating instance output logs (`data/InstanceLog/`) or operation/audit logs (`data/operation_logs/`).
- Configurable thresholds (10 MB / 30 days are fixed constants in the shared module; they can be lifted to settings later without spec changes).
- Any frontend, API, or i18n surface.

## Decisions

**D1: Custom log4js appender in `common`, wired by both `log.ts` files.**
log4js accepts an appender `type` as a module object with `configure(config, layouts)` (verified in log4js 6.4.0 / 6.7.1 `lib/appenders/index.js`; typed as `CustomAppender`/`AppenderModule`), so the appender is plain duck-typed code with no log4js import — webpack-safe and hostable in `common/src`.
Alternatives rejected: (a) log4js built-in `maxLogSize` + `compress` — streamroller names backups by index, keeps them by count, and offers no hook to chmod archives, so naming and 30-day retention would need a racy side-loop; (b) polling timer + `log4js.shutdown()`/`configure()` swap — introduces an entry-loss window and reopens every appender when any one file rotates; (c) `logrotate` + SIGHUP — external dependency, Windows-hostile.

**D2: Synchronous append per event, no long-lived write stream.**
The appender writes each formatted line with `fs.appendFileSync`, tracking byte length (`Buffer.byteLength`) to decide rotation. Rotation therefore never touches an open handle: rename → gzip → prune is safe on every platform and no entry can be lost mid-rotation. Precedent: log4js's own `fileSync` appender. App-log volume is info-level operational output, so per-line sync I/O is acceptable; a write buffer can be added later behind the same interface if profiling says otherwise.

**D3: Compression with Node built-in `zlib`, not the Zip-Tools binary.**
Log archives are small text files; `zlib` streams gzip without spawning processes or depending on `daemon/lib` platform binaries that exist for user file operations.

**D4: Archive naming `<base>_<YYYY-MM-DD_HH-mm-ss>.log.gz` (zero-padded), collision-safe.**
Padded timestamps sort chronologically and match the intent of today's unpadded startup rename. If two rotations land in the same second, a numeric suffix disambiguates. Legacy plaintext names (e.g. `2026-10-12_15-3-4.log`) are still handled by maintenance as archives.

**D5: Retention by archive mtime, evaluated at startup and after each rotation.**
mtime reflects creation/rotation time without parsing names, and it covers legacy archives uniformly. 30 days is the fixed window.

**D6: Permission hardening mirrors `daemon/src/entity/config.ts`.**
The shared helper applies `chmod 0700` to the `logs/` directory, active files, and archives; failures (Windows, foreign owner) are logged as warnings and swallowed — hardening must never break logging.

**D7: Startup maintenance pipeline runs before log4js is configured.**
Order: archive leftover active files → gzip leftover plaintext `*.log` archives → apply permissions → prune over-age archives. This keeps today's one-archive-per-startup semantics but compressed, and cleans up state left by crashes or earlier versions.

## Risks / Trade-offs

- [Sync writes block the event loop under log storms] → Volume is bounded by info-level app logging today; buffer later if needed (interface unchanged).
- [Windows cannot enforce `0700`] → Best-effort `chmod` matching existing project precedent; the requirement is explicitly conditional on OS support.
- [Rotation runs in-process; a crash mid-archive can leave a plaintext partial] → Startup maintenance re-compresses any leftover plaintext artifact, so state self-heals on next boot.
- [Two apps could share one `logs/` directory if run from the same cwd] → Already broken today (both write `current.log`); unchanged and out of scope.
- [10 MB overshoot between the last byte written and the rotation decision] → Rotation triggers on the write that crosses the threshold, so the file never exceeds 10 MB plus one entry.

## Migration Plan

No data migration. On first startup after upgrade, existing plaintext archives in `logs/` are compressed and over-age files pruned automatically. Rollback is trivial: the feature is confined to the two `log.ts` files and the new `common` module; older binaries ignore the `.gz` archives.
