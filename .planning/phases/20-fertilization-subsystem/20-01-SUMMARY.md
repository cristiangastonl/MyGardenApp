---
phase: 20-fertilization-subsystem
plan: 01
subsystem: storage-guard
tags: [fertilize, useStorage, deep-merge-guard, CRIT-1, protected-fields, react-native, typescript]

# Dependency graph
requires:
  - phase: 20-fertilization-subsystem
    provides: Plant.fertilizeSchedule type (additive optional from Plan 20-00 Task 2) — the type field this guard now protects
  - phase: 14-educational-detail-modal
    provides: PROTECTED_USER_FIELDS tuple + UpdatePlantOptions.fromUserEdit flag + deep-merge guard loop in useStorage.updatePlant — the CRIT-1 mechanism this plan extends APPEND-ONLY
provides:
  - Extended PROTECTED_USER_FIELDS tuple in useStorage.tsx now guards 4 fields (waterSchedule, lightLevel, waterMode, fertilizeSchedule) — closes FERT-01 type-side guarantee
  - Catalog-source updatePlant({ fertilizeSchedule: ... }) calls without { fromUserEdit: true } now silently dropped per CRIT-1 deep-merge guard contract
  - APPEND-ONLY tuple extension preserves existing 3 entries verbatim and `as const` literal-union narrowing for the loop
affects: [20-04, 20-05, 21-plant-journal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-line APPEND-ONLY tuple extension pattern — when a new optional field on Plant joins the CRIT-1 deep-merge guard inventory, append the field name as the LAST element of PROTECTED_USER_FIELDS (never reorder, never rename); preserves `as const` for TypeScript literal-union narrowing of the for-of loop key type"
    - "Surgical-edit discipline for cross-phase guard-tuple maintenance — single-line edit to a 23-character constant, zero JSDoc churn (existing CRIT-1 doc block stays accurate verbatim), zero loop-body churn (iterates the tuple agnostically)"

key-files:
  created: []
  modified:
    - src/hooks/useStorage.tsx (+1 insertion, -1 deletion at line 23: PROTECTED_USER_FIELDS tuple gains 'fertilizeSchedule' as 4th entry)

key-decisions:
  - "APPEND-ONLY enforcement — 'fertilizeSchedule' is the 4th and last entry; existing 3 entries (waterSchedule, lightLevel, waterMode) preserved verbatim. No reorder, no rename, no JSDoc update needed (CRIT-1 doc block above the tuple stays accurate)."
  - "`as const` preserved — without it, TypeScript loses the literal-union narrowing for `key in normalizedUpdates` and the for-of loop falls back to `string`, breaking `delete normalizedUpdates[key]` type-safety. Verified post-edit by tsc-green."
  - "No new sentinel added to smoke-phase20 — this plan ENSURES the existing CRIT-1 guard doesn't break for the new field; the affirmative encoding lives in Plan 20-00 W0.scaffold.types.* (Plant.fertilizeSchedule presence) + Plan 20-04 modal-side fertilize override path. Smoke runner stays at PASS=33 FAIL=0 SKIP=16."
  - "Migration / first-launch derivation paths reserved — when/if a future plan derives fertilizeSchedule from catalog at first launch, it MUST either use raw setPlants() (bypasses guard entirely) OR pass { fromUserEdit: true } (explicitly opts in). Both paths documented in Phase 14 EDU-06 SUMMARY and remain valid for Phase 20 + future v1.3+ work."

patterns-established:
  - "Cross-phase guard-tuple extension is a surgical-edit pattern: single-line APPEND, zero adjacent code touched, tsc + cross-phase smoke runners as the verification triad. Reusable for any future Plan that adds an optional Plant field eligible for CRIT-1 protection (e.g., custom user-set bloom schedule, custom prune schedule)."
  - "Single-task plans for guard-tuple extensions use atomic-commit-equals-plan pattern — 1 task, 1 commit, 1 file modified, no SUMMARY decisions section beyond decision-rationale boilerplate. Validates the GSD plan granularity decision that even minimal type-side hardening deserves its own plan when it closes a requirement."

requirements-completed: [FERT-01, FERT-02]

# Metrics
duration: 16 min
completed: 2026-05-10
---

# Phase 20 Plan 01: PROTECTED_USER_FIELDS Extension for fertilizeSchedule Summary

**One-line APPEND-ONLY extension of the Phase 14 CRIT-1 deep-merge guard tuple in `useStorage.tsx` so that catalog-source updates to the new `Plant.fertilizeSchedule` field are silently dropped unless the caller explicitly opts in with `{ fromUserEdit: true }`.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-05-10T13:42:33Z
- **Completed:** 2026-05-10T13:58:50Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `PROTECTED_USER_FIELDS` tuple in `src/hooks/useStorage.tsx:23` extended from 3 entries → 4 entries with `'fertilizeSchedule'` appended as the LAST element
- `as const` preserved — TypeScript literal-union narrowing for the `for (const key of PROTECTED_USER_FIELDS)` loop body intact (verified by tsc-green)
- Existing 3 protected fields (`'waterSchedule'`, `'lightLevel'`, `'waterMode'`) verbatim — no reorder, no rename
- JSDoc comment block above the tuple (lines 18-22) unchanged — still accurate (CRIT-1 doc block applies to the 4th field identically)
- Guard loop body (lines 402-414) unchanged — iterates the tuple agnostically
- FERT-01 type-side guarantee CLOSED: when/if a future UI lets users manually override fertilize cadence, the guard kicks in for any catalog-source code path that doesn't pass `{ fromUserEdit: true }`
- Cross-phase regression preserved: smoke-phase18 PASS=56 / smoke-phase19 PASS=85, both unchanged
- No file conflict with parallel Plan 20-02 (this edits `src/hooks/useStorage.tsx`; Plan 20-02 edits `src/utils/plantLogic.ts`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Append 'fertilizeSchedule' to PROTECTED_USER_FIELDS tuple in useStorage.tsx** — `4ef666f` (feat)

**Plan metadata commit:** to be added with SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md

## Files Created/Modified

- `src/hooks/useStorage.tsx` (+1 insertion, -1 deletion at line 23) — `PROTECTED_USER_FIELDS` tuple extended APPEND-ONLY with `'fertilizeSchedule'`; `as const` preserved; surrounding JSDoc + guard loop body unchanged

## Decisions Made

- **APPEND-ONLY enforcement:** `'fertilizeSchedule'` is the 4th and final entry. Existing 3 entries (`'waterSchedule'`, `'lightLevel'`, `'waterMode'`) preserved verbatim. No reorder, no rename, no JSDoc update needed — the CRIT-1 doc block above the tuple stays accurate (it documents the contract, not the field list).
- **`as const` preserved:** Without it, TypeScript loses the literal-union narrowing for `key in normalizedUpdates` and the for-of loop falls back to `string`, breaking the `delete normalizedUpdates[key]` type-safety. Verified post-edit by `npx tsc --noEmit` exit 0.
- **No new sentinel added to smoke-phase20:** This plan ENSURES the existing CRIT-1 guard doesn't break for the new field — the affirmative encoding lives in Plan 20-00 W0.scaffold.types.* (Plant.fertilizeSchedule presence) + Plan 20-04 modal-side fertilize override path. Smoke runner stays at PASS=33 FAIL=0 SKIP=16 (unchanged from Plan 20-02 baseline).
- **Migration / first-launch derivation paths reserved:** When/if a future plan derives `fertilizeSchedule` from catalog at first launch (e.g., a v1.3+ migration script), it MUST either use raw `setPlants()` (bypasses guard entirely) OR pass `{ fromUserEdit: true }` (explicitly opts in). Both paths documented in Phase 14 EDU-06 SUMMARY and remain valid for Phase 20 + future v1.3+ work.

## Deviations from Plan

None - plan executed exactly as written. Single task ran first-try without incident: tsc-green on first run, exact tuple shape grep matched on first run, smoke-phase20 PASS count unchanged at 33, cross-phase smokes preserved at 56 (Phase 18) + 85 (Phase 19).

## Issues Encountered

None. Single task first-try green:
- tsc-green on first run after the single-line edit (literal-union narrowing for the loop body intact via `as const`)
- Exact-shape grep matched on first run: `const PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode', 'fertilizeSchedule'] as const`
- Grep count for `PROTECTED_USER_FIELDS` returns 2 (1 declaration + 1 loop usage) — unchanged from baseline, confirming no accidental dual-edit
- smoke-phase20 PASS count unchanged (33) — no regression on Plan 20-00 W0.scaffold.* nor Plan 20-02 FERT-04.*
- Cross-phase regression preserved (smoke-phase18 PASS=56 FAIL=0, smoke-phase19 PASS=85 FAIL=0)

## Verification Results (Final)

All gates green:
- `npx tsc --noEmit` → exit 0
- `grep -nE "PROTECTED_USER_FIELDS = \['waterSchedule', 'lightLevel', 'waterMode', 'fertilizeSchedule'\] as const" src/hooks/useStorage.tsx` → matches exactly at line 23
- `grep -c "PROTECTED_USER_FIELDS" src/hooks/useStorage.tsx` → 2 (1 declaration + 1 loop usage; unchanged from baseline)
- `node scripts/smoke-phase20.cjs` → PASS=33 FAIL=0 SKIP=16, exit 0
- `npm run smoke:phase18` → PASS=56 FAIL=0 SKIP=0
- `npm run smoke:phase19` → PASS=85 FAIL=0 SKIP=0

## Self-Check: PASSED

Verified files:
- FOUND: src/hooks/useStorage.tsx (1 insertion, 1 deletion at line 23 — PROTECTED_USER_FIELDS tuple gains fertilizeSchedule)

Verified commits:
- FOUND: 4ef666f (Task 1 — feat(20-01): extend PROTECTED_USER_FIELDS with fertilizeSchedule)

## Next Phase Readiness

**Plan 20-03 ready (Wave 2 5-site discriminator sweep):** Type-side hardening complete. Plan 20-03 lands the 5-site discriminator sweep (`getTasksForDay` emit branch + `notificationScheduler` body-line + `DayDetail`/`DayDetailModal`/`MonthCalendar` UI discriminator + `TaskButton` render dispatcher + `plantHealth` defensive no-op). Plan 20-03 will be the first consumer of `getNextFertilizeDate` (Plan 20-02 real impl) within `getTasksForDay` and the first consumer of the now-protected `Plant.fertilizeSchedule` field guard from this plan.

**No blockers.** Cross-phase regression preserved. Wave 1 closes file-disjoint dual completion (Plan 20-01 useStorage.tsx + Plan 20-02 plantLogic.ts) — both sibling plans complete with zero file-conflict and zero coordination overhead. Plan 20-03 (Wave 2) can begin immediately.

---
*Phase: 20-fertilization-subsystem*
*Completed: 2026-05-10*
