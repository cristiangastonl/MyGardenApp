---
phase: 05-hemisphere-season-helpers-pure-utility-switchover
plan: 03
subsystem: utils
tags: [seasonality, water-season, plantLogic, getNextWaterDate, soil-check, task-dispatch, smoke-test, wave-2, phase-5-linchpin]

# Dependency graph
requires:
  - phase: 04-schema-foundation-migration-core
    provides: "Plant.waterSchedule.{warm,cold} populated for all migrated plants — Plan 03 finally consumes the cold bucket on a per-plant per-season basis"
  - phase: 05-hemisphere-season-helpers-pure-utility-switchover
    provides: "Plan 02 — getWaterSeason(lat, date) helper + WaterSeason type + Task['type'] check_soil discriminator + tasks.checkSoil i18n keys (EN/ES voseo) — all four imports landed in plantLogic.ts"
provides:
  - "src/utils/plantLogic.ts — season-aware getNextWaterDate(plant, today, latitude) + soil_check dispatch in getTasksForDay(plants, day, latitude)"
  - "Defensive fallback ladder preserved: waterSchedule[bucket] → legacy waterEvery → 7d safe default (tropical → warm bucket via dedicated bucket-from-season helper, never inlined)"
  - "Mode-as-dispatcher pattern: waterMode === 'soil_check' → 'check_soil' task; else → 'water' task. Mutually exclusive — same plant on same day NEVER emits both"
  - "4 caller files threading latitude through: wateringRecommendations.ts (2 sites), PlantCard.tsx, WateringTips.tsx, TodayScreen.tsx (1 useMemo + 2 JSX props)"
  - "15 new smoke assertions: SEASON-04 BA/NY/Singapore matrix + cross-month transition bounding + WATER-05 soil_check dispatch + first-encounter day-1 nudge + fixed/soil exclusivity"
affects:
  - "05-04 (plantHealth penalty skip — gates daysUntilWater<0 on plant.waterMode !== 'soil_check'; plantHealth.ts:40 will need latitude 3rd arg, will cascade to GardenHealth.tsx, MyPlantDetailModal.tsx, useNotifications.ts)"
  - "05-05 (notificationScheduler season-aware + 6 component callsites Task discriminator exhaustion — notificationScheduler.ts:51 createMorningContent calls getTasksForDay; DayDetail.tsx:59, DayDetailModal.tsx:63, MonthCalendar.tsx:62 all call getTasksForDay; PlantsScreen.tsx:134 renders <PlantCard> without latitude prop)"
  - "06-* (Phase 6 UX layer — new 'check_soil' task type already lands in DayDetail icon/label switches once Plan 05 makes the components compile; UX-03 empty-state copy lives in Phase 6)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bucket-from-season helper (getSeasonalInterval): 'tropical' | 'warm' both map to waterSchedule.warm; 'cold' maps to waterSchedule.cold. The 3-zone vs 2-bucket asymmetry (Pitfall 2) is centralized in ONE helper, never inlined at call sites — guarantees no undefined access across all consumers."
    - "Mode-as-dispatcher: waterMode === 'soil_check' branches the task type emit ('check_soil' icon 🤚 + tasks.checkSoil i18n label) but the cadence pathway (next-water-date math) is shared with 'fixed' mode plants. Single source of truth across modes per CONTEXT.md."
    - "Pitfall 5 first-encounter resolution: soil_check plant with lastWatered === null emits 'check_soil' on day-1 (treats 'user just added the plant' as the implicit first check-in), matching the 'Hoy is non-empty for new plants' UX expectation. Documented and asserted in smoke."
    - "Smoke runner stub idiom for ESM-imports-with-runtime-deps: rewrite '../i18n', '../types', './seasonality', './dates' import specifiers via regex BEFORE typescript.transpileModule, write minimal stub modules to scripts/.tmp-*.mjs, then dynamic-import the compiled module. Reusable for any future src/utils/* file with i18n + types deps."
    - "Cross-month transition bounding contract: a plant whose lastWatered straddles a season boundary (Mar 25 + flip Apr 1) MUST satisfy {next ≥ today, next ≤ today + cold_interval, !isNaN(next)} — the existing while-loop advance in getNextWaterDate already guarantees this; new smoke pin asserts it explicitly so future refactors don't regress."

key-files:
  created: []
  modified:
    - "src/utils/plantLogic.ts (47 → ~80 lines — full replace; getSeasonalInterval helper + season-aware getNextWaterDate + soil_check dispatch in getTasksForDay)"
    - "src/utils/wateringRecommendations.ts (+1 param + 2 caller sites — getWateringRecommendations 4-arg signature, both internal getNextWaterDate calls updated)"
    - "src/components/PlantCard.tsx (+1 required prop + 1 caller site — PlantCardProps gains latitude, getNextWaterDate call updated)"
    - "src/components/WateringTips.tsx (+1 required prop + 1 caller site — WateringTipsProps gains latitude, getWateringRecommendations call updated)"
    - "src/screens/TodayScreen.tsx (+1 useMemo dep + 2 JSX props — plantsWithTasks deps include location?.lat, <PlantCard> + <WateringTips> JSX both receive latitude)"
    - "scripts/migration-smoke-test.mjs (+126 lines — plantLogic compile path with stub deps + 15 SEASON-04/WATER-05/cross-month/defensive assertions)"

key-decisions:
  - "Mode-as-dispatcher with shared cadence: soil_check plants emit 'check_soil' but use the SAME waterSchedule[bucket] interval as fixed plants — CONTEXT.md 'mode is the dispatcher, not the cadence source' decision honored verbatim. Rejected an early-thought alternative of giving soil_check plants a 'cadence multiplier' (3× the fixed cadence) since CONTEXT.md explicitly locks single-source-of-truth across modes."
  - "Pitfall 5 first-encounter resolution: soil_check plant with lastWatered===null emits 'check_soil' on day-1 (NOT suppressed). Reasoning: matches the 'Hoy is non-empty for new plants' UX expectation; first user interaction with a new cactus is naturally a check-in (touch the soil), so the day-1 prompt IS self-explanatory. Documented in plan and asserted in smoke."
  - "Cross-month transition bounding asserted explicitly (smoke pin): even though the existing addDays/while-loop logic in getNextWaterDate is unchanged, a new test fixture (Mar 25 lastWatered + Apr 1 Southern flip) verifies the bounded result — protects future refactors from regressing the math at season boundaries."
  - "tsc handoff state corrected: planner enumerated 'errors ONLY in plantHealth.ts' but the actual handoff is 6 files (plantHealth + 5 Plan-05-owned files). The planner's success-criteria phrasing was an oversight; the verification block correctly identified multi-stage handoff (Plan 04 + Plan 05). Documented under Deviations for downstream plans 04/05 to consume."
  - "ALLOWLIST count unchanged at 27: the new sun-task `${p.sunHours}h` interpolation in getTasksForDay is a pre-existing line (not new); the existing src/utils/plantLogic.ts entry covers it; no NEW entries added per plan instruction."

patterns-established:
  - "Mode-as-dispatcher pattern: when a domain object has a discriminator field (e.g., waterMode), use it ONLY to choose which task type to emit — keep the cadence/scheduling pathway shared. Future v1.2/v2.0 additions of new modes (e.g., 'auto_water_sensor') should follow this — emit a different task type, share the cadence math."
  - "Smoke-runner stub pattern for src/utils/* files with React/i18n deps: regex-rewrite import specifiers to scripts/.tmp-*.mjs paths BEFORE typescript.transpileModule; write per-dep stubs (i18n no-op translator, types empty module, dates real impl); dynamic-import the compiled module. Reusable verbatim for Plan 04 (plantHealth.ts) and Plan 05 (notificationScheduler.ts) when they extend the smoke runner."

requirements-completed: ["SEASON-04", "WATER-05"]

# Metrics
duration: 8 min
completed: 2026-05-01
---

# Phase 5 Plan 03: Wave-2 Linchpin — plantLogic Season-Awareness + soil_check Dispatch Summary

**`getNextWaterDate(plant, today, latitude)` and `getTasksForDay(plants, day, latitude)` now derive the watering interval from `(waterSchedule, getWaterSeason(lat, today))` with a `tropical → warm` bucket map; `waterMode === 'soil_check'` plants dispatch to a `'check_soil'` task type (icon 🤚, `tasks.checkSoil` i18n label) instead of `'water'`; 4 callers (`wateringRecommendations` × 2, `PlantCard`, `WateringTips`, `TodayScreen` × 3 sites) thread `latitude` through; 15 new smoke assertions prove SEASON-04 single-source-of-truth (BA cold 10d / NY warm 5d / Singapore tropical→warm 5d for the same plant on Apr 15) + WATER-05 emit-side + cross-month transition bounding + defensive fallback ladder.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-01T13:57:47Z
- **Completed:** 2026-05-01T14:06:35Z
- **Tasks:** 3
- **Files modified:** 6 (1 utility refactored + 4 callers + 1 smoke runner)

## Accomplishments

- **`plantLogic.ts` is the single linchpin source** for next-water-date math across the app. `getSeasonalInterval(plant, season)` is the ONE helper that maps `('warm' | 'cold' | 'tropical') → ('warm' | 'cold')` waterSchedule bucket. Tropical zone explicitly maps to `'warm'` per CONTEXT.md SEASON-02 lock — Singapore/equatorial users no longer get `undefined` from `waterSchedule['tropical']` (Pitfall 2 eliminated).
- **Defensive fallback ladder preserved verbatim:** `plant.waterSchedule[bucket]` → `plant.waterEvery` (legacy) → `7` (safe default). Migration-failure code path still has coherent behavior.
- **Mode is the dispatcher, cadence is shared:** `waterMode === 'soil_check'` emits `{type:'check_soil', icon:'🤚', label: i18n.t('tasks.checkSoil', {name})}`; else emits `{type:'water', icon:'💧', label: 'Regar ${name}'}`. The if/else is exclusive — same plant on same day NEVER emits both.
- **Pitfall 5 first-encounter behavior locked:** new soil_check plants (lastWatered === null) emit `'check_soil'` on day-1 — matches the 'Hoy is non-empty for new plants' UX expectation. Asserted in smoke (`pNew` plant fixture).
- **4 callers updated:** `wateringRecommendations.ts` gains `latitude: number | null` 4th param + 2 internal `getNextWaterDate` calls updated; `PlantCard.tsx` `PlantCardProps` gains required `latitude` prop + 1 caller site updated; `WateringTips.tsx` `WateringTipsProps` gains required `latitude` prop + the `getWateringRecommendations` call passes it through; `TodayScreen.tsx` `plantsWithTasks` useMemo passes `location?.lat ?? null`, dep array adds `location?.lat`, `<PlantCard>` and `<WateringTips>` JSX both receive `latitude={location?.lat ?? null}`.
- **15 new smoke assertions** appended inside the existing Phase-5 `else` block: SEASON-04 single-source-of-truth × 3 zones (BA cold Apr 21 / NY warm Apr 16 / Singapore tropical→warm Apr 16) + cross-month transition bounding (Mar 25 → Apr 1 Southern flip stays bounded) + defensive fallbacks (legacy waterEvery; null lat → warm) + WATER-05 dispatch (check-in day, non-check-in day, first-encounter day-1, fixed-mode exclusivity).
- **Smoke PASS count: 86 → 101** (+15, exceeds the planner's ≥95 target).
- **Tropical-bucket schema mismatch (Pitfall 2) verified eliminated:** `getNextWaterDate(fixedPlantBA, apr15, 1.35)` returns a valid Date (Apr 16, warm bucket 5d), no NaN, no undefined access — asserted in smoke.

## Task Commits

1. **Task 1: Refactor plantLogic.ts (season-aware getNextWaterDate + soil_check dispatch)** — `fa18a3e` (refactor)
2. **Task 2: Update 4 callers (wateringRecommendations, PlantCard, WateringTips, TodayScreen)** — `6801392` (feat)
3. **Task 3: Add SEASON-04 + WATER-05 smoke assertions for plantLogic** — `aef583d` (test)

_Plan metadata commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows separately._

## Files Created/Modified

- `src/utils/plantLogic.ts` — full replace (47 → 80 lines). Adds `getSeasonalInterval` private helper, season-aware `getNextWaterDate(plant, today, latitude)`, `getTasksForDay(plants, day, latitude)` with `waterMode === 'soil_check'` dispatch. Imports `getWaterSeason`, `WaterSeason` from `./seasonality` and `i18n` from `../i18n`. Sun-task line still reads `plant.sunHours` (existing line, ALLOWLIST entry already in place — Phase 6 territory).
- `src/utils/wateringRecommendations.ts` — `getWateringRecommendations` signature gains `latitude: number | null` as 4th param. Both internal `getNextWaterDate` calls (lines 44, 51) updated. Function body otherwise unchanged.
- `src/components/PlantCard.tsx` — `PlantCardProps.latitude: number | null` (required, after `today: Date`). Function-component destructure adds `latitude`. Line 51 caller updated to `getNextWaterDate(plant, today, latitude)`. `calculatePlantHealth` call left UNCHANGED — Plan 04 owns plantHealth signature.
- `src/components/WateringTips.tsx` — `WateringTipsProps.latitude: number | null` (required). Function-component destructure adds `latitude`. The `getWateringRecommendations(plants, weather, today, latitude)` call updated.
- `src/screens/TodayScreen.tsx` — `plantsWithTasks` useMemo: `getNextWaterDate(plant, today, location?.lat ?? null)` + dep array adds `location?.lat`. `<PlantCard ...>` JSX adds `latitude={location?.lat ?? null}`. `<WateringTips ...>` JSX adds `latitude={location?.lat ?? null}`. No new state, no new effects.
- `scripts/migration-smoke-test.mjs` — top-level `tmpPlantLogic` const declared. Inside the existing Phase-5 `else { ... }` block, after the voseo NOT-tuteo assertion, appended: plantLogic compile path (regex-rewrite imports → typescript.transpileModule → dynamic import) + 15 assertions. `finally` block extended with 4 new `fs.unlink` calls (tmp-plantLogic + tmp-i18n + tmp-types + tmp-dates).

## Decisions Made

- **Mode-as-dispatcher with shared cadence (CONTEXT.md verbatim).** soil_check plants emit `'check_soil'` but use the SAME `waterSchedule[bucket]` interval as fixed plants. Rejected the early-thought alternative of giving soil_check plants a separate cadence multiplier — CONTEXT.md explicitly locks "mode is the dispatcher, not the cadence source." This makes the soil_check check-in cadence inherit Phase 4's per-category cold-factor heuristic without divergence.
- **Pitfall 5 first-encounter day-1 nudge for soil_check plants.** Plant fixture with `waterMode: 'soil_check', lastWatered: null` returns `getNextWaterDate === today` (existing logic), so `getTasksForDay` emits a `'check_soil'` task on day-1. Reasoning documented above; asserted in smoke (the `pNew` fixture explicitly tests this case).
- **Cross-month transition bounding asserted explicitly.** Even though the addDays/while-loop in getNextWaterDate is unchanged from before, a new fixture (BA Transition: Mar 25 lastWatered, Apr 1 Southern flip) verifies the result bounded by `[today, today + cold_cycle]` and !isNaN. Future refactors of getNextWaterDate cannot regress the math at season boundaries without breaking this assertion.
- **JSX prop ordering for `<PlantCard latitude={location?.lat ?? null}>`.** `latitude` placed alongside `today` (right after `plant`) — the prop ordering mirrors the `getNextWaterDate(plant, today, latitude)` signature, making the JSX visually echo the helper signature.
- **No new ALLOWLIST entries.** The plan instructed not to add a new `src/utils/plantLogic.ts` ALLOWLIST entry for the existing `${p.sunHours}h` sun-task interpolation — that read is covered by the existing entry. The eslint-disable comment was added per plan spec; ALLOWLIST count remains 27.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 4-adjacent — Architectural enumeration imprecision] Planner's "tsc errors ONLY in plantHealth.ts" was incorrect; actual handoff state spans 6 files**

- **Found during:** Task 2 (after `npx tsc --noEmit` post-caller-update)
- **Issue:** The plan's Task 2 acceptance criterion stated tsc would fail "ONLY in plantHealth.ts" (and per the verification block: "plantHealth.ts and src/components/GardenHealth.tsx and App.tsx"). In reality, tsc reports errors in 6 files: `plantHealth.ts:40` (Plan 04 owner) + `DayDetail.tsx:59`, `DayDetailModal.tsx:63`, `MonthCalendar.tsx:62`, `PlantsScreen.tsx:134`, `notificationScheduler.ts:51` (Plan 05 owners per 05-02-SUMMARY's `affects` field). The planner enumerated 5 callers of `getNextWaterDate` in the `<interfaces>` block but missed the 3 callers of `getTasksForDay` (DayDetail, DayDetailModal, MonthCalendar, notificationScheduler) and the 1 additional `<PlantCard>` JSX usage in PlantsScreen.
- **Fix:** Did NOT expand Plan 03 scope to fix these — they're cleanly owned by Plan 05 per the planner's own `affects` field in 05-02-SUMMARY ("05-05 (notificationScheduler season-aware morning copy + 6 component call sites for Task discriminator exhaustion)"). Plan 04 owns `plantHealth.ts` and downstream cascade (GardenHealth, MyPlantDetailModal, useNotifications). Plan 03's deliverable (smoke runner green + 4 immediate callers green) is met. The acceptance criterion was an enumeration imprecision, not missing work — the actual handoff was anticipated by the planner just imprecisely listed.
- **Files NOT modified by Plan 03 (deferred):** src/utils/plantHealth.ts (Plan 04), src/components/DayDetail.tsx (Plan 05), src/components/DayDetailModal.tsx (Plan 05), src/components/MonthCalendar.tsx (Plan 05), src/screens/PlantsScreen.tsx (Plan 05), src/utils/notificationScheduler.ts (Plan 05).
- **Verification:** `npx tsc --noEmit` reports exactly the 6 expected errors above. `npm run smoke:migration` exits 0 with 101/101 PASS. `npm run check:legacy-fields` exits 0. B4 invariant preserved (calculateSunWindow caller-only count = null-guard count = 2).
- **Committed in:** N/A (no code change required — purely a documentation correction for downstream plans). Documented here so Plan 04 + Plan 05 know the precise file list they own.

---

**Total deviations:** 1 documented (planner enumeration imprecision; no code change required).
**Impact on plan:** Zero scope creep. Plan 03's deliverable is unchanged — refactor plantLogic.ts, update its 4 immediate callers, extend the smoke runner. The 5 additional tsc errors that surfaced beyond plantHealth.ts are cleanly owned by Plan 05 per the dependency graph in 05-02-SUMMARY's `affects` field. Future planners should treat the planner's `affects:` field as authoritative for downstream-caller enumeration, not just the `<interfaces>` block.

## Issues Encountered

- **Initial tsc check after Task 2 surfaced 5 unanticipated callers** (DayDetail.tsx, DayDetailModal.tsx, MonthCalendar.tsx, PlantsScreen.tsx, notificationScheduler.ts) beyond the plan's 5-caller `<interfaces>` enumeration. Resolved by reading the planner's `affects` field in 05-02-SUMMARY which had explicitly listed these as Plan 05 territory ("6 component call sites for Task discriminator exhaustion") — confirming this is a documentation precision issue, not missing work. Plan 03's `<verify>` block runs grep-only by design (acceptance criterion 9 explicitly says "DO NOT run npx tsc --noEmit for Task 1 alone — it WILL fail until Task 2 updates the 4 callers"); the multi-stage tsc handoff is intentional.

## User Setup Required

None — no external service configuration required. Pure-utility refactor + caller updates + smoke-test extension, all entirely local.

## Next Phase Readiness

- **Plan 04 unblocked.** Owns `src/utils/plantHealth.ts:40` (currently `getNextWaterDate(plant, today)` 2-arg call). Plan 04 should: (a) update `calculatePlantHealth` signature to accept `latitude: number | null` (or compute it inline if a Plant→latitude lookup is preferred), (b) gate the `daysUntilWater < 0` penalty block on `plant.waterMode !== 'soil_check'`, (c) cascade signature change to `calculateGardenHealth` → `GardenHealth.tsx`, `MyPlantDetailModal.tsx`, `useNotifications.ts`, (d) add WATER-06 smoke assertion (soil_check plant 5 days "overdue" → no `overdue_water` issue). After Plan 04 lands, `npx tsc --noEmit` should be green for all files except the 5 Plan-05-owned ones.
- **Plan 05 unblocked.** Owns the 6 component callsites (DayDetail, DayDetailModal, MonthCalendar) + 1 PlantCard JSX (PlantsScreen) + scheduler (notificationScheduler.ts). Plan 05 should: (a) thread `latitude` through `getTasksForDay(plants, day, latitude)` callers in 4 places, (b) add `'check_soil'` branches to the existing `task.type === 'X'` switches in DayDetail (icon + label) / DayDetailModal (4 chains: isDone, handlePress, bgColor, textColor) / MonthCalendar (1 indicator boolean), (c) thread `latitude` through `<PlantCard>` JSX in PlantsScreen (already destructures `location` from `useStorage`), (d) plumb `latitude` into `notificationScheduler.createMorningContent` and downstream `useNotifications` callers (3 sites: lines 157, 177, 276). After Plan 05 lands, `npx tsc --noEmit` should be fully green.
- **Mode-as-dispatcher pattern documented.** Future modes (e.g., v2.0 'auto_water_sensor', 'manual_only') can follow the same shape — emit a different task type, share the cadence math via `getSeasonalInterval`.
- **Smoke-runner stub idiom established.** Plans 04/05 can extend the runner by following the same pattern: regex-rewrite import specifiers, write minimal stub modules to `scripts/.tmp-*.mjs`, dynamic-import the compiled output. Single-compile-path policy preserved (still typescript.transpileModule, no esbuild/swc fallbacks).
- **Cross-month transition bounding now pinned.** Future refactors of `getNextWaterDate` math cannot regress at season boundaries without breaking the smoke pin (Mar 25 → Apr 1 Southern flip; result bounded by [today, today+10d]).
- **TZ-safe Date construction pattern (from Plan 02) preserved.** All 11 new Date instantiations in the appended assertion block use `new Date(YYYY, monthIdx, DD)` (local-time multi-arg constructor). Zero ISO-string Date constructors in the Phase-5 section.
- **No legacy-field reads added** — `npm run check:legacy-fields` exit 0; ALLOWLIST count unchanged at 27.

---
*Phase: 05-hemisphere-season-helpers-pure-utility-switchover*
*Completed: 2026-05-01*

## Self-Check: PASSED

- `src/utils/plantLogic.ts` exists on disk: yes (full replace, ~80 lines)
- `src/utils/wateringRecommendations.ts`, `src/components/PlantCard.tsx`, `src/components/WateringTips.tsx`, `src/screens/TodayScreen.tsx`, `scripts/migration-smoke-test.mjs` exist on disk: yes
- `git log --oneline --all | grep -q fa18a3e` (Task 1): found
- `git log --oneline --all | grep -q 6801392` (Task 2): found
- `git log --oneline --all | grep -q aef583d` (Task 3): found
- `npm run smoke:migration` exit 0 with `101/101 PASS` (was `86/86`; +15 new): confirmed
- `npm run check:legacy-fields` exit 0, ALLOWLIST entries unchanged at 27: confirmed
- `npx tsc --noEmit` reports exactly 6 expected errors: plantHealth.ts:40 (Plan 04) + DayDetail/DayDetailModal/MonthCalendar/PlantsScreen/notificationScheduler (Plan 05) — confirmed handoff state
- B4 invariant preserved: calculateSunWindow caller-only count (2) === null-guard count (2) — Plan 03 did NOT touch scheduler
