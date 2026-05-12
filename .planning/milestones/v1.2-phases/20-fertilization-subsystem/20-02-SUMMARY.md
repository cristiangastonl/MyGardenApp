---
phase: 20-fertilization-subsystem
plan: 02
subsystem: cadence-math
tags: [fertilize, plantLogic, helpers, advance-loop, catch-up, dormancy, react-native, typescript]

# Dependency graph
requires:
  - phase: 20-fertilization-subsystem
    provides: skeleton helpers (getSeasonalFertilizeInterval + getNextFertilizeDate returning null) + locked signatures + Plant.fertilizeSchedule + PlantDBEntry.fertilizeIntervalWarm/Cold types from Plan 20-00
  - phase: 5-hemisphere-season-helpers-pure-utility-switchover
    provides: getSeasonalInterval + getNextWaterDate advance-loop pattern (verbatim mirror source)
provides:
  - Real impl of getSeasonalFertilizeInterval (per-plant override > catalog warm/cold > null fallback ladder; cold-season dormancy via fertilizeIntervalCold === null)
  - Real impl of getNextFertilizeDate (advance-loop catch-up clip; returns today for never-fertilized plants; null for null/<=0 interval)
  - Top-level PlantDBEntry import in plantLogic.ts (replaces inline import('../types') for cleanliness)
  - 2 FERT-04.* SKIPs flipped to PASS in smoke-phase20 (getSeasonalFertilizeInterval-real-impl + getNextFertilizeDate-real-impl)
affects: [20-03, 20-04, 20-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verbatim mirror discipline — getNextFertilizeDate copies getNextWaterDate's advance-loop structure exactly (same while-loop body, same first-time-return-today branch); reusable for any future cadence helper that emits ONE task on due-day"
    - "Skeleton-then-impl in-place body replacement — Plan 20-00 locked signatures with `return null; // skeleton` body; Plan 20-02 replaces bodies in-place without churning callers (no callers exist yet — Plan 20-03 will be first consumer)"
    - "Top-level import migration during skeleton → impl transition — inline `import('../types').Plant` types in skeleton bodies (acceptable for one-off skeletons) replaced with extended top-level `import { Plant, PlantDBEntry, Task }` for real implementations"

key-files:
  created: []
  modified:
    - src/utils/plantLogic.ts (+30 insertions, -17 deletions: PlantDBEntry import + 2 helper bodies replaced)

key-decisions:
  - "Per-plant override is season-agnostic in this phase (Plant.fertilizeSchedule.intervalDays is a single value, not warm/cold split) — matches RESEARCH.md Pattern 2 lock; future phase may add per-plant warm/cold split if user demand emerges"
  - "Tropical bucket maps to 'warm' (mirrors getSeasonalInterval Pitfall 2) — Plant.fertilizeSchedule has no tropical bucket; catalog warm interval is the right answer in tropical climates"
  - "Cold-season dormancy via explicit `if (cold === null) return null` branch — distinct from `typeof cold === 'number' && cold > 0` branch — preserves the catalog author's ability to mark dormancy explicitly vs. omit the field (both yield null but for different semantic reasons)"
  - "No 'overdue penalty' branch added — advance-loop guarantees nextDate >= today, so daysUntil < 0 is dead code by-construction (Phase 5 plantHealth dead-code finding inherited verbatim per RESEARCH §Architecture Pattern 2 Pitfall)"
  - "while-loop body locked as `next = addDays(next, intervalDays)` (NOT `next = addDays(next, +intervalDays)` or any variant) to match the FERT-04.helper.catch-up-clip regex `while\\s*\\(\\s*next\\s*<\\s*today\\s*\\)\\s*next\\s*=\\s*addDays`"

patterns-established:
  - "Verbatim mirror discipline for cadence helpers — when adding a new task type that follows water's emit-ONE-on-due-day contract, copy getNextWaterDate's structure exactly (advance-loop, first-time-return-today, no overdue penalty); diverge only on the interval-resolver function"
  - "Skeleton bodies declare resolved types (number | null) and parameter shape (plant + catalogEntry + season; plant + catalogEntry + today + season) at Plan 20-00 — Plan 20-02 fills bodies without changing call signatures, so future Plan 20-03 emit-branch can call helpers directly without import churn"

requirements-completed: [FERT-04]

# Metrics
duration: 16 min
completed: 2026-05-09
---

# Phase 20 Plan 02: FERT-04 Cadence Math Real Impl Summary

**Replaced two skeleton helpers (`getSeasonalFertilizeInterval` + `getNextFertilizeDate`) with real impls mirroring `getSeasonalInterval` + `getNextWaterDate` verbatim — cold-season dormancy via `fertilizeIntervalCold === null`, catch-up clipping via while-loop advance, no overdue penalty.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-05-09T21:47:51Z
- **Completed:** 2026-05-09T22:04:50Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `getSeasonalFertilizeInterval` real impl — per-plant `Plant.fertilizeSchedule.intervalDays > 0` wins over catalog (season-agnostic override per RESEARCH lock); cold-season `catalogEntry.fertilizeIntervalCold === null` returns null (dormancy lock); warm/tropical bucket both use `fertilizeIntervalWarm`
- `getNextFertilizeDate` real impl — advance-loop catch-up clip mirrors `getNextWaterDate` verbatim (`while (next < today) next = addDays(next, intervalDays)`); returns `today` for never-fertilized plants (mirrors first-water behavior); returns null for null/<=0 interval
- Top-level `PlantDBEntry` import added to plantLogic.ts (replaces inline `import('../types').PlantDBEntry` types in skeleton bodies)
- 2 FERT-04.* SKIPs flipped to PASS in smoke-phase20: `FERT-04.helper.getSeasonalFertilizeInterval-real-impl` + `FERT-04.helper.getNextFertilizeDate-real-impl`
- Cross-phase regression preserved: smoke-phase18 PASS=56 FAIL=0, smoke-phase19 PASS=85 FAIL=0
- tsc-green throughout; no breaking changes; no callers churned (Plan 20-03 will be first consumer of these helpers)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement getSeasonalFertilizeInterval (real impl) — replaces skeleton in plantLogic.ts** — `c9b6854` (feat)
2. **Task 2: Implement getNextFertilizeDate (real impl with advance-loop catch-up) — replaces skeleton in plantLogic.ts** — `74d482a` (feat)

**Plan metadata commit:** to be added with SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md

## Files Created/Modified

- `src/utils/plantLogic.ts` (+30 insertions, -17 deletions) — PlantDBEntry top-level import added; both skeleton helpers replaced in-place with real implementations; signatures unchanged

## Decisions Made

- **Per-plant override is season-agnostic in this phase:** `Plant.fertilizeSchedule.intervalDays` is a single value (not a warm/cold split). When set per-plant, it wins over catalog season-bucketed values. Matches RESEARCH.md Pattern 2 lock. Future phase may add per-plant warm/cold split if user demand emerges.
- **Tropical maps to warm:** Mirrors `getSeasonalInterval` Pitfall 2 — `Plant.fertilizeSchedule` has no tropical bucket; catalog `fertilizeIntervalWarm` is the right answer in tropical climates. Helper handles this transparently — caller does NOT need to special-case tropical.
- **Explicit dormancy branch:** `if (cold === null) return null` is split from the `typeof cold === 'number' && cold > 0` branch even though both yield null when the field is missing. This preserves the catalog author's semantic intent: `fertilizeIntervalCold: null` ≠ `fertilizeIntervalCold: undefined` (both yield no emission, but `null` is an explicit dormancy declaration).
- **No overdue penalty branch:** Advance-loop guarantees `nextDate >= today`, so `daysUntilFertilize < 0` is unreachable dead code. Confirmed via Phase 5 plantHealth dead-code finding (inherited verbatim per RESEARCH §Architecture Pattern 2 Pitfall). Plan 20-03 will rely on this guarantee when emitting via `isSameDay(next, today)` — no underflow needed.
- **while-loop body locked verbatim:** `while (next < today) next = addDays(next, intervalDays)` — matches the smoke-phase20 catch-up-clip regex exactly. Reusable pattern for any future cadence helper that emits ONE task on due-day.

## Deviations from Plan

None — plan executed exactly as written. Both tasks ran first-try without incident, no auto-fixes, no architectural escalations, no blocking issues.

**Note on smoke runner SKIP→PASS arithmetic:** The plan-document expected 4 FERT-04 SKIPs to flip; only 2 actually flipped (getSeasonalFertilizeInterval-real-impl + getNextFertilizeDate-real-impl). The other 2 (`cold-season-null` + `catch-up-clip`) were already PASSing at Plan 20-00 baseline because their regex patterns matched pre-existing `getNextWaterDate` body content + the JSDoc skeleton comment in `plantLogic.ts` (heuristic regex sentinels are PASS-on-presence). Documented in 20-00-SUMMARY.md "Deviations" section. Net SKIP movement: 18 → 16, exactly +2 PASS as expected.

## Issues Encountered

None. Both tasks first-try green:
- Task 1 tsc-green on first run; all 3 grep regex patterns matched on first run; smoke-phase20 PASS count unchanged (smoke runner check for getSeasonalFertilizeInterval-real-impl uses `!plantLogicSrc.includes('return null; // skeleton')` AND-clause — flips only when ALL skeleton markers gone, which happens at Task 2)
- Task 2 tsc-green on first run; both grep regex patterns matched on first run; smoke-phase20 PASS count moved 31 → 33 (+2 net), SKIP count moved 18 → 16 (-2 net), zero FAILs; cross-phase regression smokes preserved at PASS=56 (Phase 18) + PASS=85 (Phase 19)

## Verification Results (Final)

All gates green:
- `npx tsc --noEmit` → exit 0 (Task 1 + Task 2)
- `node scripts/smoke-phase20.cjs` → PASS=33 FAIL=0 SKIP=16, exit 0
- `npm run smoke:phase18` → PASS=56 FAIL=0 SKIP=0
- `npm run smoke:phase19` → PASS=85 FAIL=0 SKIP=0
- Both grep regex patterns (`while \(next < today\) next = addDays\(next, intervalDays\)` + `if \(!lastFertilized\) return today`) match in plantLogic.ts
- Both grep regex patterns (`if \(plant\.fertilizeSchedule\?\.intervalDays != null` + `if \(season === 'cold'\)` + `if \(cold === null\) return null`) match in plantLogic.ts
- Zero `return null; // skeleton` markers remaining in plantLogic.ts

## Self-Check: PASSED

Verified files:
- FOUND: src/utils/plantLogic.ts (modifications: +30 insertions, -17 deletions across 2 helper bodies + 1 import line)

Verified commits:
- FOUND: c9b6854 (Task 1 — getSeasonalFertilizeInterval real impl)
- FOUND: 74d482a (Task 2 — getNextFertilizeDate real impl with advance-loop catch-up)

## Next Phase Readiness

**Plan 20-03 ready (Wave 2 5-site discriminator sweep):** FERT-04 cadence math is locked. Plan 20-03 lands the 5-site discriminator sweep (`getTasksForDay` emit branch + `notificationScheduler` body-line + `DayDetail`/`DayDetailModal`/`MonthCalendar` UI discriminator + `TaskButton` render dispatcher + `plantHealth` defensive no-op). Plan 20-03 is the first consumer of `getNextFertilizeDate` and `getSeasonalFertilizeInterval` — they will be imported alongside `getCatalogEntry(plant.databaseId)` to wire the emit branch in `getTasksForDay`.

**No blockers.** Cross-phase regression preserved. Helper signatures locked at Plan 20-00 unchanged. Plant 20-01 (parallel execution) modifies `src/hooks/useStorage.tsx` — no file conflict with this plan's `src/utils/plantLogic.ts` edits.

---
*Phase: 20-fertilization-subsystem*
*Completed: 2026-05-09*
