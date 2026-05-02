---
phase: 05-hemisphere-season-helpers-pure-utility-switchover
plan: 01
subsystem: testing
tags: [smoke-test, typescript-transpileModule, wave-0, phase-5-scaffold]

# Dependency graph
requires:
  - phase: 04-schema-foundation-migration-core
    provides: "scripts/migration-smoke-test.mjs single-compile-path runner with 63 Phase-4 PASS lines and locked typescript.transpileModule policy"
provides:
  - "Phase-5 section appended to scripts/migration-smoke-test.mjs (tmpSeason temp file, ENOENT-tolerant compile of src/utils/seasonality.ts, placeholder skip line at Wave 0)"
  - "Locked compile path for src/utils/seasonality.ts mirroring the migration.ts compile pattern (Plan 02 lands the source, Plans 03/04/05 fill in assertions)"
  - "Reusable scaffolding so every downstream Phase-5 plan can use 'npm run smoke:migration' as its automated verify without repeating compile-path setup"
affects:
  - "05-02 (seasonality.ts source + first matrix assertions)"
  - "05-03 (soil_check task emission assertions)"
  - "05-04 (plantHealth overdue-water penalty skip assertions)"
  - "05-05 (notification-scheduler season-aware assertions, optional)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase-5 graceful-skip: ENOENT on optional source file logs a single skip line and does NOT increment total/pass; non-ENOENT errors propagate"
    - "Single-compile-path policy extended to second source (seasonality.ts) — 2 ts.transpileModule invocations, 0 esbuild/swc fallbacks"

key-files:
  created: []
  modified:
    - "scripts/migration-smoke-test.mjs"

key-decisions:
  - "Acceptance-criteria literal grep counts (transpileModule == 2, esbuild|swc == 0) interpreted semantically — comments documenting the locked policy are positive guards, not violations. Actual code: 2 ts.transpileModule( invocations, 0 esbuild/swc fallback code paths."
  - "Phase-5 section placed AFTER 'CURRENT_SCHEMA_VERSION === 1' assert and BEFORE final '${pass}/${total} PASS' line so the Phase-4 contract is visually unchanged and Phase-5 is a strict appendage."
  - "tmpSeason cleanup added to existing finally block (additive); cleanup tolerates ENOENT via .catch(() => {}) for both temp files."
  - "Placeholder line distinguishes Wave-0 absence ('Phase 5: skipped — seasonality.ts not yet present') from Plan-02-onward presence ('Phase 5: section reached, no assertions yet (placeholder)') — gives downstream planners an unambiguous Plan-02 landing signal."

patterns-established:
  - "Wave-0 scaffold pattern: when a downstream plan will land a new source file, Wave 0 of that phase wires the compile path + skip-line behavior so smoke runner stays green throughout the phase"
  - "ENOENT-tolerant dynamic compile: try { read + transpile + import } catch (e) { if (e.code !== 'ENOENT') throw e } — the only acceptable swallow is the file-not-yet-present case"

requirements-completed: []

# Metrics
duration: 2 min
completed: 2026-05-01
---

# Phase 5 Plan 01: Phase-5 Scaffold in Migration Smoke Runner Summary

**Migration smoke runner extended with a Wave-0 Phase-5 section that locks the typescript.transpileModule compile path for src/utils/seasonality.ts (skipped today, populated by Plans 02-05) while preserving the existing 63/63 Phase-4 PASS contract verbatim.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-01T13:39:20Z
- **Completed:** 2026-05-01T13:41:47Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Phase-5 section appended to `scripts/migration-smoke-test.mjs` with the same locked typescript.transpileModule compile pattern used for migration.ts.
- Wave-0 graceful skip: emits `Phase 5: skipped — seasonality.ts not yet present` and does NOT increment total/pass counters when `src/utils/seasonality.ts` is absent (ENOENT swallowed by design).
- Existing Phase-4 contract preserved byte-for-byte: `63/63 PASS` line still emitted, all 63 assertions unchanged.
- Single-compile-path policy preserved across both phases: 2 `ts.transpileModule(` invocations (one per source), 0 esbuild/swc fallback paths.
- Cleanup symmetry: new `tmpSeason` temp file unlinked in the same `finally` block as `tmp`.

## Task Commits

1. **Task 1: Extend migration-smoke-test.mjs with a Phase-5 scaffold section** — `f4983c8` (feat)

_Plan metadata commit (SUMMARY.md + STATE.md + ROADMAP.md) follows separately._

## Files Created/Modified

- `scripts/migration-smoke-test.mjs` — Added top-of-file Phase-5 policy comment block, `tmpSeason` constant, Phase-5 section (try-compile-or-skip seasonality.ts), and `tmpSeason` cleanup in `finally`. Net: +43 lines.

## Decisions Made

- **Acceptance criteria 5/6 literal counts treated semantically.** The plan's grep count expectations (`transpileModule == 2`, `esbuild|swc == 0`) were written assuming the policy comments would not exist, but the same plan also instructed me to add a Phase-5 policy comment block that legitimately mentions `swc` and `esbuild` as forbidden fallbacks. Actual semantic counts: 2 `ts.transpileModule(` invocations (lines 56, 137), 0 esbuild/swc code paths. Comments documenting the lock are positive guards for future executors.
- **Phase-5 placement.** Section inserted AFTER the final Phase-4 assert (`CURRENT_SCHEMA_VERSION === 1`) and BEFORE the `${pass}/${total} PASS` summary line, so Phase-4 output ordering is identical and Phase-5 reads as a clean appendage in the log.
- **Two distinct placeholder messages.** Wave-0 absence emits `Phase 5: skipped — seasonality.ts not yet present`; Plan-02-onward presence emits `Phase 5: section reached, no assertions yet (placeholder)`. Gives downstream planners an unambiguous landing signal that the file is now present but assertions still need to be added.

## Deviations from Plan

None - plan executed exactly as written. The only judgment call (criterion 5/6 grep-count semantics) is documented under Decisions Made and was unavoidable given the plan instructed BOTH the policy comments AND the literal count check.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (`05-02-PLAN.md`) can now land `src/utils/seasonality.ts` and immediately use `npm run smoke:migration` as its automated verify. The compile path is locked, the temp-file lifecycle is set up, and the placeholder line will flip from `skipped` to `section reached, no assertions yet (placeholder)` the moment the file is created — giving Plan 02 a self-evident landing signal.
- Plans 03/04/05 inherit the same scaffold; each plan only needs to add its own assertions inside the `else { ... }` branch of the existing if-else, no further compile-path or temp-file work required.
- ALLOWLIST in `scripts/check-no-legacy-reads.js` unchanged at 27 entries (Phase 5 should never add legacy-field reads, per CONTEXT.md).

---
*Phase: 05-hemisphere-season-helpers-pure-utility-switchover*
*Completed: 2026-05-01*

## Self-Check: PASSED

- `scripts/migration-smoke-test.mjs` exists on disk: yes (170 lines, modified)
- `git log --oneline --all | grep -q f4983c8`: found
- `npm run smoke:migration` exit 0 with both `63/63 PASS` and `Phase 5: skipped` lines: confirmed
- `npx tsc --noEmit` exit 0: confirmed
- `npm run check:legacy-fields` exit 0, ALLOWLIST entries count = 27: confirmed
