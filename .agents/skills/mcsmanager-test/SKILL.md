---
name: mcsmanager-test
description: Run the MCSManager test suites. Use when the user asks to run tests (e.g. "run tests", "run all tests", "run the test suite") or whenever code in any module (common, daemon, panel, frontend) has been changed and must be verified. Covers the per-module vitest commands, running all four suites in one pass, and the common/frontend environment quirks.
---

# MCSManager Test Runner

All four subprojects use **vitest** (`vitest run`). There is no root test script — invoke each package (or loop over them).

**Mandatory rule:** after changing code in a module, run that module's test suite before finishing. `common/` is aliased as source into both `panel` and `daemon`, so a `common/` change requires running **common + daemon + panel** tests (see §3).

## 1. Run all suites in one pass

From the repository root (stops at the first failing suite):

```bash
for d in common daemon panel frontend; do
  echo "=== $d ==="
  (cd "$d" && npm test) || exit 1
done
```

Expected current totals: common 9, daemon 176, panel 193 (+1 skipped), frontend 41.

## 2. Per-module commands

| Module     | Command (run inside the module dir) | Notes                                                            |
| ---------- | ----------------------------------- | ---------------------------------------------------------------- |
| `common`   | `npm test`                          | vitest, ~9 tests; see §4 cwd quirk                                |
| `daemon`   | `npm test`                          | vitest, router + smoke + real instance lifecycle integration tests (`src/routers/__test__/Instance_router.integration.test.ts` spawns real child processes / Docker containers — see §4) |
| `panel`    | `npm test`                          | vitest, router/service tests                                     |
| `frontend` | `npm test`                          | vitest; run `npm run type-check` first when TS types changed (§5) |

## 3. Which suite(s) to run for a change

- `common/` change → **common + daemon + panel** (both apps compile `common/src` directly) and, if UI types are affected, frontend.
- `panel/` change → panel.
- `daemon/` change → daemon.
- `frontend/` change → frontend (`type-check` → `lib`/`npm test`).
- Root-level config / `languages/` → run all four.
- Unsure → run all four (§1).

## 4. Quirks

- **`common/src/__test__/system_storage.test.ts`** must `process.chdir(tmpDir)` **before** importing the module — `DATA_PATH` is derived from `process.cwd()` at import time. Follow the same pattern in new tests touching `StorageSubsystem`.
- Tests use node env by default; add `// @vitest-environment jsdom` for DOM tests (frontend).
- Windows: `fs.chmod` only toggles the read-only bit — gate POSIX-mode assertions with `process.platform === "win32"` skips and assert mocked `fs.chmodSync` arguments instead.
- `daemon/src/routers/__test__/Instance_router.integration.test.ts` is a **real** integration suite (spawns `alpine` containers and a real interactive `node test.mjs` child process). It needs `node` on `PATH`, adds ~30–60s to the daemon run, and its Docker cases silently return early without root/Docker access — details and run modes in the `mcsmanager-docker-instance-test` skill.

## 5. Related checks (not tests, but required before finishing)

- `frontend`: `npm run type-check` (vue-tsc) before `npm test` / `npm run lint` when touching TS types; `npm run lint` (eslint `--fix`).
- `panel` / `daemon`: webpack `npm run build` is the type check (no separate lint).
- `common`: `npm run build` (tsc → `dist/`).
