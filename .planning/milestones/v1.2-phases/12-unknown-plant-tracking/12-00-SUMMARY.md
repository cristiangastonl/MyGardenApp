---
phase: 12-unknown-plant-tracking
plan: "00"
subsystem: testing
tags: [smoke-runner, typescript, ts.transpileModule, async-storage, esm, stub]

requires:
  - phase: 11-perenual-data-quality
    provides: smoke-phase11.mjs pattern — single-compile-path ts.transpileModule, assertSkippable placeholders, .tmp-* gitignored stubs

provides:
  - scripts/smoke-phase12.mjs: Phase 12 smoke runner with TRACK-01 Wave 1 placeholders; exits 0 on Wave 0 baseline
  - scripts/.tmp-phase12/async-storage.mjs: in-memory Map-backed AsyncStorage stub (written at runner startup)

affects:
  - 12-01-unknown-plant-tracker
  - 12-02-call-site
  - 12-03-settings-ui

tech-stack:
  added: []
  patterns:
    - Single-compile-path policy (ts.transpileModule only; no esbuild/swc fallback) — Phase 4 lock extended to Phase 12
    - AsyncStorage stub written at runner startup (gitignored .tmp-* dir) — mirrors Phase 11 pattern
    - assertSkippableAsync placeholders return undefined when svcMod=null; SKIP not FAIL on Wave 0 baseline

key-files:
  created:
    - scripts/smoke-phase12.mjs
    - scripts/.tmp-phase12/async-storage.mjs (gitignored; recreated at runner startup)
  modified: []

key-decisions:
  - "AsyncStorage stub is gitignored (.gitignore wildcard scripts/.tmp-*/) — runner writes it at startup via writeFileSync instead of checking existsSync; mirrors Phase 11 runtime-write pattern"
  - "7 TRACK-01 Wave 1 placeholders wired as assertSkippableAsync; each returns undefined when svcMod=null so they SKIP gracefully before Plan 01 lands the tracker service"

patterns-established:
  - "Phase 12 smoke: runner creates .tmp-phase12/async-storage.mjs at startup if absent (idempotent writeFileSync)"
  - "Wave 1 placeholders: condFn returns undefined when svcMod null OR named export absent — skip, not fail"

requirements-completed:
  - TRACK-01

duration: ~8min
completed: 2026-05-03
---

# Phase 12 Plan 00: Unknown Plant Tracking — Wave 0 Scaffold Summary

**Phase 12 smoke runner skeleton with in-memory AsyncStorage stub and 7 TRACK-01 assertSkippableAsync placeholders ready for Plan 01 to wire**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-03T04:40:13Z
- **Completed:** 2026-05-03T04:48:20Z
- **Tasks:** 2
- **Files created:** 2 (1 committed, 1 gitignored + runtime-written)

## Accomplishments

- `scripts/smoke-phase12.mjs` exits 0 with `PASS 5/5 (+7 skipped)` on Wave 0 baseline
- Single-compile-path policy preserved — `ts.transpileModule` is the sole compile path, no esbuild/swc fallback
- 7 TRACK-01 behavior assertion placeholders (insert, increment, lowercase, sorted, firstSeen, silent-error, JSON.parse-fail) wired as `assertSkippableAsync`; silently flip SKIP → PASS when Plan 01 lands `unknownPlantTracker.ts`
- AsyncStorage stub (`getItem`/`setItem`/`removeItem` backed by in-memory Map) written at runner startup; idempotent

## Smoke Runner Output (Wave 0 Baseline)

```
[smoke-phase12] Skipped 7 (Wave 1 placeholders):
SKIP: W1.TRACK-01.insert: first track inserts 1 entry with count=1 [Plan 12-01]
SKIP: W1.TRACK-01.increment: second track increments count to 2 [Plan 12-01]
SKIP: W1.TRACK-01.lowercase: mixed-case + whitespace inputs merge into single canonical entry, count=3 [Plan 12-01]
SKIP: W1.TRACK-01.sorted: report sorted desc by count [Plan 12-01]
SKIP: W1.TRACK-01.firstSeen: firstSeen immutable across re-tracks; lastSeen advances [Plan 12-01]
SKIP: W1.TRACK-01.silent-error: AsyncStorage setItem failure is swallowed (no throw) [Plan 12-01]
SKIP: W1.TRACK-01.json-parse-fail: corrupt storage → empty array, no throw [Plan 12-01]
[smoke-phase12] PASS 5/5 (+7 skipped)
```

## Wave 1 Placeholder Labels (7 total — will flip SKIP → PASS when Plan 12-01 lands)

1. `W1.TRACK-01.insert: first track inserts 1 entry with count=1 [Plan 12-01]`
2. `W1.TRACK-01.increment: second track increments count to 2 [Plan 12-01]`
3. `W1.TRACK-01.lowercase: mixed-case + whitespace inputs merge into single canonical entry, count=3 [Plan 12-01]`
4. `W1.TRACK-01.sorted: report sorted desc by count [Plan 12-01]`
5. `W1.TRACK-01.firstSeen: firstSeen immutable across re-tracks; lastSeen advances [Plan 12-01]`
6. `W1.TRACK-01.silent-error: AsyncStorage setItem failure is swallowed (no throw) [Plan 12-01]`
7. `W1.TRACK-01.json-parse-fail: corrupt storage → empty array, no throw [Plan 12-01]`

Plan 01 tasks can reference `node scripts/smoke-phase12.mjs` in their `<verify><automated>` blocks — the harness is operational.

## Task Commits

1. **Task 1: async-storage.mjs stub** — incorporated into Task 2 commit (stub is gitignored; runner writes it at startup)
2. **Task 2: smoke-phase12.mjs runner** — `d9fe9d4` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/smoke-phase12.mjs` — Phase 12 smoke runner; single-compile-path ts.transpileModule, 5 W0 scaffold PASSes, 7 W1 TRACK-01 assertSkippableAsync placeholders
- `scripts/.tmp-phase12/async-storage.mjs` — gitignored; in-memory Map-backed AsyncStorage stub (getItem/setItem/removeItem); written at runner startup via writeFileSync

## Decisions Made

- **AsyncStorage stub is gitignored:** `.gitignore` wildcard `scripts/.tmp-*/` blocks all `.tmp-*` directories. Runner writes the stub via `writeFileSync` at startup if absent — mirrors Phase 11 pattern exactly. The plan's intent ("durable scaffolding") is achieved through idempotent startup write rather than git-committed file.
- **Single assertSkippableAsync async variant:** Phase 12 uses `assertSkippableAsync` (async condFn) instead of Phase 11's synchronous `assertSkippable` — required because all 7 TRACK-01 assertions await AsyncStorage operations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stub startup-write replaces existsSync-then-exit-2 check**
- **Found during:** Task 1 (attempting to git add stub)
- **Issue:** `.gitignore` wildcard `scripts/.tmp-*/` prevents committing the stub. The plan's `existsSync(STUB_AS) → process.exit(2)` check would fail on a fresh clone with no prior runner run.
- **Fix:** Runner writes the stub via `writeFileSync` at startup when absent (same pattern as Phase 11 stubs), then continues. Idempotent — existing stub is preserved on re-runs.
- **Files modified:** `scripts/smoke-phase12.mjs` (startup write block replaces exit-2 guard)
- **Verification:** Three consecutive `node scripts/smoke-phase12.mjs` runs all exit 0 with `PASS 5/5 (+7 skipped)`. Clean-slate test: deleted stub, ran runner — stub recreated, run succeeded.
- **Committed in:** `d9fe9d4`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: gitignore blocks committed stub)
**Impact on plan:** Fix necessary for correctness — gitignored stub would break on fresh clone without the runtime-write. Behavior is identical to intent; stub is always present when runner executes.

## Issues Encountered

None beyond the gitignore deviation above.

## Next Phase Readiness

- `node scripts/smoke-phase12.mjs` is operational and exits 0 — Plan 01 tasks can reference it in `<verify><automated>` blocks
- 7 TRACK-01 placeholders are wired; Plan 01 landing `src/services/unknownPlantTracker.ts` with `export function trackUnknownPlant` and `export function getUnknownPlantsReport` will flip all 7 from SKIP to PASS with no runner edits
- Phase 10 SEC-01 guard remains clean (grep count 0 on all client paths)

---
*Phase: 12-unknown-plant-tracking*
*Completed: 2026-05-03*
