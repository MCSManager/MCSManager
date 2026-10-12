# Tasks

## 1. Shared rotation module (`common`)

- [x] 1.1 Implement `common/src/log_rotation.ts` core helpers (constants 10 MB / 30 days / mode `0700`; secure `logs/` directory creation; best-effort permission restriction; timestamped rename + zlib gzip archive helper) with unit tests in `common/src/__test__/log_rotation.test.ts` covering archive naming, gzip round-trip content equality, and platform-guarded POSIX mode assertions; verify `cd common && npm test` passes
- [x] 1.2 Implement maintenance helpers (compress leftover plaintext `*.log` archives, prune archives older than 30 days by mtime, same-second collision suffix) and extend `log_rotation.test.ts` with legacy-name compression, 29-day retention vs 31-day deletion, and collision-disambiguation cases; verify `cd common && npm test` passes
- [x] 1.3 Implement the log4js-compatible rotating file appender (module object with `configure(config, layouts)` returning the log-event function plus a `shutdown` hook; per-event UTF-8 byte accounting; rotation when a write crosses 10 MB) and add appender tests covering rotation at the threshold, entry continuity (no loss across rotation), and independent rotation of two files; verify `cd common && npm test` passes
- [x] 1.4 Export the rotation helpers and appender from `common/src/index.ts`; verify `cd common && npm run build` and `cd common && npm test` pass

## 2. Daemon wiring

- [x] 2.1 Rewire `daemon/src/service/log.ts` (`logs/current.log` + `logs/sysinfo.log`): run startup maintenance before `log4js.configure`, and replace the plain rename block and `file`/`sys` appenders with the shared rotating appender while keeping the existing layout patterns; verify `cd daemon && npm run build` and `cd daemon && npm test` pass

## 3. Panel wiring

- [x] 3.1 Rewire `panel/src/app/service/log.ts` (`logs/current.log`, shared by the `logger`/`fileLogger` categories) the same way, keeping its layout pattern; verify `cd panel && npm run build` and `cd panel && npm test` pass

## 4. Cross-module verification

- [x] 4.1 Run the one-pass full test loop from the `mcsmanager-test` skill (common + daemon + panel suites; frontend untouched) and confirm every suite passes
- [x] 4.2 Boot smoke check against the built daemon and panel: force `logs/current.log` over 10 MB (e.g. pre-fill near the threshold and emit one entry) and observe the contract end to end — timestamped `.log.gz` created, fresh `current.log` continues receiving entries, `logs/`/files/archives are mode `0700` on POSIX, and an over-age archive is pruned; verify the observed behavior matches the `application-logging` spec scenarios

## Workflow follow-up

- After human review and implementation, run the testing gate and archive the change with `/openspec-archive-change`, which syncs the `application-logging` delta into `openspec/specs/`.
- Verify the archived main spec contains the five requirements with their scenarios.
