---
phase: 04-schema-foundation-migration-core
plan: 04
subsystem: notifications

tags: [notifications, lightLevel, waterSchedule, schema-v1.1, scheduler, sun-window, uv-warning, defensive-fallback, ts-expect-error-cleanup]

# Dependency graph
requires:
  - phase: 04-schema-foundation-migration-core
    provides: Wave 1 — Plant.lightLevel optional + LightLevel union (Plan 02), Plant.waterSchedule optional + WaterSchedule type (Plan 02), runMigrations writes both fields on every plant on first launch (Plan 02 + Plan 03 wiring)
provides:
  - notificationScheduler.calculateSunWindow consumes Plant.lightLevel; returns null for non-direct levels
  - notificationScheduler.groupPlantsByLightLevel replaces old groupPlantsBySunHours; sunrise/sunset reminders only emitted for 'direct'-level plants
  - notificationScheduler.scheduleUVWarning sensitivity filter consumes lightLevel ('low' | 'medium_indirect' = sensitive) with defensive sunHours fallback
  - plantInfo.isSensitiveToSun derives from lightLevel with defensive sunHours fallback; defaults to false when both undefined
  - Every non-declaration calculateSunWindow call site is null-guarded (B4 invariant — verified by grep parity check)
  - All 9 @ts-expect-error transitional shims from Plan 02 removed across notificationScheduler, plantLogic, plantInfo, careTips, PlantHealthDetail, PlantDiagnosisModal
  - plantLogic.getNextWaterDate consumes waterSchedule.warm via new getWaterIntervalDays helper
  - careTips pest-root-rot predicate consumes waterSchedule.warm
  - PlantHealthDetail tip card derives display values (water cadence + approximate sun hours) from v1.1 fields
  - PlantDiagnosisModal populates PlantDiagnosisContext (waterEvery, sunHours) from v1.1 fields with sensible defaults — keeps Phase 7 edge-function prompts unchanged for now
affects: [04-05, 04-06, 04-07, phase-5, phase-7, phase-8]

# Tech tracking
tech-stack:
  added: []  # No new dependencies
  patterns:
    - "lightLevelToSunHours mapper — single source of truth for hours-per-day numeric used by scheduler (direct=5h, others=0h)"
    - "Defensive fallback pattern: prefer v1.1 field; fall back to legacy field; final fallback to a safe default. Used in 5 places across scheduler/plantInfo/plantLogic/careTips/PlantHealthDetail/PlantDiagnosisModal"
    - "B4 null-guard parity invariant: count of `calculateSunWindow(` callers minus declaration MUST equal count of `if (!window) return` lines — caller cannot deref the result without an explicit guard"
    - "Display-only lightLevel-to-hours approximation (direct=6, bright_indirect=4, medium_indirect=2, low=0/1) used by UI/diagnosis context surfaces — distinct from scheduler's 5/0 mapping which gates whether a notification fires at all"

key-files:
  created: []
  modified:
    - src/utils/notificationScheduler.ts
    - src/utils/plantInfo.ts
    - src/utils/plantLogic.ts
    - src/data/careTips.ts
    - src/components/PlantHealthDetail.tsx
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx

key-decisions:
  - "Two distinct lightLevel-to-hours mappings: scheduler uses 5/0/0/0 (only 'direct' generates outdoor reminders, all others return null). Display code uses 6/4/2/0 (richer approximation for tip-card text and AI diagnosis context). Decoupling these prevents non-direct plants from accidentally getting outdoor notifications scheduled while still letting UI render meaningful sun-hour text."
  - "Defensive fallbacks read legacy field then default to a safe value rather than throwing. Migration-failure code path (where a plant kept its v1.0 shape) plus any genuinely brand-new code path get coherent behavior without crashing."
  - "PlantDiagnosisContext shape (with required waterEvery, sunHours) preserved as-is — Phase 7 will rewrite the edge-function prompts to consume waterSchedule + lightLevel directly. Until then, PlantDiagnosisModal derives the legacy field values from the v1.1 schema so prompts remain stable."
  - "plantLogic.ts line 24 (`p.sunHours` interpolated into a label string) was NOT touched. It is allowlisted, has no @ts-expect-error shim, does not throw, and the resulting 'undefined' interpolation is a UX-only concern that belongs in a future plan (out of scope per deviation rule SCOPE BOUNDARY)."

patterns-established:
  - "Null-guard parity invariant: any function returning `T | null` whose result is consumed in multiple call sites should be checked via grep parity (callers minus declaration == guard count). This pattern locks the contract at code-review time."
  - "Display-vs-scheduling helpers split: a single domain field (lightLevel) drives two different mappings depending on consumer — scheduler's binary 'do/don't notify' decision uses {5, 0, 0, 0}; UI text uses {6, 4, 2, 0/1}. Future plans should keep these separate rather than collapsing to one constant."
  - "Defensive fallback ladder: v1.1 field → legacy field → safe default. All five touched consumers follow this exact ladder, making the codebase grep-able for migration-readiness."

requirements-completed: [SCHEMA-06, SCHEMA-08]

# Metrics
duration: ~28min (cross-session — first executor hit rate-limit after committing notificationScheduler refactor; resume completed Task 2 + extended cleanup)
completed: 2026-04-30
---

# Phase 4 Plan 04: notificationScheduler + plantInfo lightLevel Refactor Summary

**Severs the v1.1 notification subsystem's dependency on the deprecated `Plant.sunHours` field — `calculateSunWindow` and `scheduleUVWarning` now derive from `Plant.lightLevel` with B4-verified null-guard coverage at every call site, and the 9 transitional `@ts-expect-error` shims from Plan 02 are fully cleaned up across the codebase.**

## Performance

- **Duration:** ~28 min (cross-session — first executor hit rate limit after committing `87bc085`; resume completed Task 2 + the broader shim cleanup)
- **Started:** 2026-04-30T13:35:00Z (first commit `87bc085`)
- **Completed:** 2026-04-30T18:30:00Z (final commit `1a2a293`)
- **Tasks:** 2 (plus deviation cleanup of 5 sibling shim sites)
- **Files modified:** 6
- **Files created:** 0

## Accomplishments

- **Task 1 — notificationScheduler.ts (already committed in `87bc085` before resume):** `calculateSunWindow(plant, sunrise, sunset)` derives hours from `Plant.lightLevel` via new `lightLevelToSunHours` helper; returns `null` for non-direct levels (or undefined lightLevel). `groupPlantsBySunHours` replaced by `groupPlantsByLightLevel`. `scheduleSunriseNotification` and `scheduleSunsetNotification` both null-guard the `calculateSunWindow` result (B4 invariant). `scheduleUVWarning` filters sensitive plants by `lightLevel === 'low' || lightLevel === 'medium_indirect'` with defensive fallback to `sunHours <= 3`.
- **Task 2 — plantInfo.ts (this resume):** `getPlantFullInfo` derives `isSensitiveToSun` from `plant.lightLevel` (`'low'` or `'medium_indirect'` → sensitive); falls back to `plant.sunHours <= 3` when `lightLevel` is undefined; defaults to `false` when both are undefined.
- **Sibling shim cleanup (this resume, beyond plan scope):** Removed the remaining 5 `@ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` markers across `plantLogic.ts` (3), `careTips.ts` (1), `PlantHealthDetail.tsx` (1), and `PlantDiagnosisModal.tsx` (2). Each consumer now reads the v1.1 field with a defensive fallback to the legacy field. Net: zero `@ts-expect-error legacy field` shims remain anywhere in `src/`.
- **B4 invariant verified:** `CALLS=2 GUARDS=2` — both non-declaration `calculateSunWindow(` call sites have a corresponding `if (!window) return` guard.
- **All verifications green:** `npx tsc --noEmit` exits 0; `npm run check:legacy-fields` exits 0 (both `notificationScheduler.ts` and `plantInfo.ts` retain allowlist status because the remaining `sunHours` reads are explicit defensive fallbacks); `npm run smoke:migration` 63/63 PASS.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor notificationScheduler.ts to consume lightLevel (with full null-guard coverage)** — `87bc085` (refactor) — committed in the first session before the rate-limit interruption.
2. **Task 2: Refactor isSensitiveToSun in plantInfo.ts to derive from lightLevel** — `2b2829f` (refactor) — committed in the resume session.
3. **Deviation cleanup: remove remaining 5 @ts-expect-error shims** — `1a2a293` (refactor) — committed in the resume session, covering `plantLogic.ts`, `careTips.ts`, `PlantHealthDetail.tsx`, `PlantDiagnosisModal.tsx`.

_Note: This plan was paused mid-execution due to a rate-limit. The first executor shipped Task 1 cleanly in `87bc085`; the resume executor verified that commit, executed Task 2, and then executed the broader shim cleanup mandated by the resume prompt's success criterion ("No `@ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` strings remain in codebase")._

## Files Created/Modified

- `src/utils/notificationScheduler.ts` — `lightLevelToSunHours` helper added; `calculateSunWindow` returns `T | null`; `groupPlantsBySunHours` → `groupPlantsByLightLevel`; both `scheduleSunriseNotification` and `scheduleSunsetNotification` null-guard the `calculateSunWindow` result; `scheduleUVWarning` filters by `lightLevel`. (Committed in `87bc085`.)
- `src/utils/plantInfo.ts` — `isSensitiveToSun` in `getPlantFullInfo` now derives from `plant.lightLevel` with defensive `sunHours` fallback. (Committed in `2b2829f`.)
- `src/utils/plantLogic.ts` — new `getWaterIntervalDays(plant)` helper consumes `waterSchedule.warm` with `waterEvery` fallback; `getNextWaterDate` reads through this helper instead of touching `waterEvery` directly. The pre-existing `(${p.sunHours}h)` string-template read at line 24 was not touched (out of scope; allowlisted; not a TS error). (Committed in `1a2a293`.)
- `src/data/careTips.ts` — `pest-root-rot` predicate now reads `waterSchedule.warm` with `waterEvery` fallback. (Committed in `1a2a293`.)
- `src/components/PlantHealthDetail.tsx` — `waterDaysForDisplay` and `sunHoursForDisplay` derived inside the component body from v1.1 fields with defensive fallbacks; tip card uses these instead of touching `plant.waterEvery` / `plant.sunHours` directly. (Committed in `1a2a293`.)
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — `waterEveryForContext` and `sunHoursForContext` derived from v1.1 fields, then assembled into the existing `PlantDiagnosisContext` shape (which still requires `waterEvery: number` + `sunHours: number` fields — Phase 7 will rewire the edge-function prompts to consume `waterSchedule` / `lightLevel` directly). (Committed in `1a2a293`.)

## Decisions Made

- **Two distinct lightLevel-to-hours mappings, deliberately decoupled:**
  - Scheduler (`lightLevelToSunHours`): `direct: 5`, `bright_indirect: 0`, `medium_indirect: 0`, `low: 0`. Returning `0` is the gate that makes `calculateSunWindow` return `null` for non-direct plants — only direct-light plants get scheduled outdoor reminders.
  - Display (`PlantHealthDetail.sunHoursForDisplay`, `PlantDiagnosisModal.sunHoursForContext`): `direct: 6`, `bright_indirect: 4`, `medium_indirect: 2`, `low: 0|1`. Used purely for human-facing text. Keeping these separate prevents UI from accidentally triggering scheduler behavior or vice versa.
- **Defensive fallback ladder applied uniformly:** every consumer reads v1.1 field → legacy field → safe default. The `@deprecated` markers on `Plant.sunHours` / `Plant.waterEvery` (set in Plan 02) and the `check:legacy-fields` allowlist (set in Plan 01) together gate that no NEW reads of these fields enter the codebase. Existing transitional reads inside the allowlist are now all defensive fallbacks, not primary code paths.
- **PlantDiagnosisContext shape preserved as-is:** the `PlantDiagnosisContext` type still requires numeric `waterEvery` + `sunHours` fields because Phase 7 (edge-function prompts) hasn't been planned yet. `PlantDiagnosisModal` derives those from `Plant.waterSchedule.warm` / `Plant.lightLevel` so the AI prompts continue receiving meaningful values without needing a coordinated edge-function migration in this phase.
- **`plantLogic.ts` line 24 left untouched:** the read `(${p.sunHours}h)` is a label string that interpolates `undefined` harmlessly when `sunHours` is missing. It is not a TypeScript error, and the file is allowlisted by `check:legacy-fields`. Fixing it would be a UX improvement (showing "approx 5h" instead of "undefined h") but it is out of scope for this plan per the deviation rule's SCOPE BOUNDARY (only auto-fix issues directly caused by current task's changes; this read predates this plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] Removed 5 additional `@ts-expect-error` shims beyond Task 2's scope**

- **Found during:** Resume verification — the resume prompt's success criteria explicitly listed: "No `@ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` strings remain in codebase". The PLAN.md only mandates Task 2 (the shim in `plantInfo.ts`). After Task 1 (`87bc085`) and Task 2 (`2b2829f`) committed, 5 shims still remained in `plantLogic.ts` (3), `careTips.ts` (1), `PlantHealthDetail.tsx` (1), `PlantDiagnosisModal.tsx` (2).
- **Issue:** Plan 02 added these 9 markers as a built-in cleanup signal (per STATE.md decision log: "9 transitional consumer reads of plant.sunHours / plant.waterEvery shimmed with per-line `// @ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` markers — built-in cleanup signal when 04-04 migrates each read"). Leaving 5 shims behind would defer the cleanup to a phantom future plan — the resume prompt correctly flagged this as in scope for this plan.
- **Fix:** Migrated each of the 5 shimmed reads to consume the v1.1 field with a defensive fallback to the legacy field. New `getWaterIntervalDays` helper in `plantLogic.ts`, inline ternaries in `careTips.ts` predicate, derived display values in `PlantHealthDetail.tsx` and `PlantDiagnosisModal.tsx`.
- **Files modified:** `src/utils/plantLogic.ts`, `src/data/careTips.ts`, `src/components/PlantHealthDetail.tsx`, `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`
- **Verification:** `grep -rn "@ts-expect-error: legacy field made optional in v1.1" --include="*.ts" --include="*.tsx" src/` returns no matches; `npx tsc --noEmit` exits 0; `npm run check:legacy-fields` exits 0; `npm run smoke:migration` 63/63 PASS.
- **Committed in:** `1a2a293`

---

**Total deviations:** 1 auto-fixed (1 missing critical, treating "shims left behind" as a v1.2 ship blocker since they would silently rot the cleanup signal that Plan 02 explicitly designed)
**Impact on plan:** No scope creep. The shim cleanup was explicitly signaled by Plan 02's design intent ("built-in cleanup signal when 04-04 migrates each read") and made an explicit success criterion in the resume prompt. All five additional consumer migrations are minimal and follow the same defensive fallback pattern as the planned changes in `notificationScheduler.ts` and `plantInfo.ts`.

## Issues Encountered

- **Rate-limit interruption between Task 1 and Task 2:** The first executor committed Task 1 (`87bc085`) cleanly and the working tree was clean before the rate limit triggered. The resume executor read `87bc085`, the current state of `notificationScheduler.ts`, and confirmed Task 1's acceptance criteria all pass before starting Task 2. No work was lost; commit chain is `87bc085` → `2b2829f` → `1a2a293`.

## Verification

All acceptance criteria pass:

```text
npx tsc --noEmit                                                                         exit 0
npm run check:legacy-fields                                                              exit 0
npm run smoke:migration                                                                  exit 0 (63/63 PASS)

# Task 1 acceptance (notificationScheduler.ts)
grep -c "function lightLevelToSunHours" src/utils/notificationScheduler.ts               1
grep -c "function groupPlantsByLightLevel" src/utils/notificationScheduler.ts            1
grep -c "groupPlantsBySunHours" src/utils/notificationScheduler.ts                       0
grep -cE "plant\.sunHours|p\.sunHours" src/utils/notificationScheduler.ts                1   (only the defensive fallback in scheduleUVWarning's isSensitive)
grep -c "lightLevel === 'low'" src/utils/notificationScheduler.ts                        1
grep -c "lightLevel === 'medium_indirect'" src/utils/notificationScheduler.ts            1
grep -c "import.*LightLevel" src/utils/notificationScheduler.ts                          1
grep -c "calculateSunWindow" src/utils/notificationScheduler.ts                          3   (declaration + 2 callers)

# B4 null-guard parity check (the contract this plan enforces)
CALLS = grep -cE "calculateSunWindow\(" - grep -cE "function calculateSunWindow"         2
GUARDS = grep -cE "if \(!window\) return"                                                2
CALLS == GUARDS                                                                          OK

# Task 2 acceptance (plantInfo.ts)
grep -c "plant.lightLevel === 'low'" src/utils/plantInfo.ts                              1
grep -c "plant.lightLevel === 'medium_indirect'" src/utils/plantInfo.ts                  1
grep -c "isSensitiveToSun" src/utils/plantInfo.ts                                        5
grep -c "const isSensitiveToSun = plant.sunHours <= 3" src/utils/plantInfo.ts            0   (old bare line removed)

# Resume prompt extra criterion (shim cleanup)
grep -rn "@ts-expect-error: legacy field made optional in v1.1" src/                     0 matches
```

## Confirmation Items (per plan §output)

- **Functions refactored:** `calculateSunWindow` (now lightLevel-aware, returns `T | null`), `groupPlantsBySunHours` → `groupPlantsByLightLevel`, `scheduleSunriseNotification` (null-guarded), `scheduleSunsetNotification` (null-guarded), `scheduleUVWarning` (lightLevel-based sensitivity filter), `isSensitiveToSun` in `plantInfo.ts` (lightLevel-derived).
- **Defensive fallback rationale:** When `Plant.lightLevel` is undefined (covers the migration-failure code path from Plan 03 where `migrationFailed = true` and the catch block falls back to legacy parse — the user keeps their plants on screen with v1.0 shape), every consumer falls through to the legacy `plant.sunHours` field. When BOTH are undefined, each consumer picks a conservative default: scheduler returns `null` (no notification), UV-sensitivity defaults to `false` (under-warn rather than over-warn).
- **Light-level-to-sun-hours mapping table chosen:** Scheduler uses `direct: 5h, bright_indirect: 0, medium_indirect: 0, low: 0` (only direct gets a scheduled outdoor window — research §Pitfall 1 light-band table). Display layer (PlantHealthDetail, PlantDiagnosisModal) uses `direct: 6, bright_indirect: 4, medium_indirect: 2, low: 0/1` for human-readable text. The two mappings are intentionally distinct.
- **B4 verification result:** Non-declaration `calculateSunWindow(` call sites = 2 (one in `scheduleSunriseNotification`, one in `scheduleSunsetNotification`'s forEach). `if (!window) return` guards = 2. Counts match — invariant holds.
- **Wave 2 sign-off:** This plan + Plan 03 are both Wave 2. Both are now complete (Plan 03 in `c6c4806`, Plan 04 across `87bc085` + `2b2829f` + `1a2a293`). Wave 3 (Plans 05/06/07: catalog mechanical update + UX banner + reschedule trigger) is unblocked.

## Next Phase Readiness

- **Plan 05 (Wave 3 — catalog mechanical update):** plantDatabase.ts entries can now reference `lightLevel` / `waterSchedule` knowing the scheduler and plantInfo helpers consume those fields with full safety.
- **Plan 06 (Wave 3 — MigrationBanner):** No dependency on this plan; depends on Plan 03's `migrationFailed` context flag (already in).
- **Plan 07 (Wave 3 — reschedule trigger):** Depends on this plan — calling `cancelAllNotifications()` then `scheduleSmartSunNotifications(plants, weather)` after migration is now safe; no `calculateSunWindow` call site can throw on `undefined.sunHours`. The `markNotificationsUnavailable` silent-disable path triggered by CRIT-3 is no longer reachable from the v1.1 schema.
- **Phase 7 (edge functions):** `PlantDiagnosisContext` shape unchanged; edge-function prompts (`diagnose-plant`, `chat-diagnosis`, `identify-plant`) continue receiving numeric `waterEvery` / `sunHours` derived from the v1.1 schema. Phase 7 can update the prompts at its own cadence.

## Self-Check: PASSED

- Files modified verified present:
  - `src/utils/notificationScheduler.ts` ✓ FOUND
  - `src/utils/plantInfo.ts` ✓ FOUND
  - `src/utils/plantLogic.ts` ✓ FOUND
  - `src/data/careTips.ts` ✓ FOUND
  - `src/components/PlantHealthDetail.tsx` ✓ FOUND
  - `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` ✓ FOUND
- Commits verified present in `git log`:
  - `87bc085` ✓ FOUND (Task 1 — notificationScheduler refactor)
  - `2b2829f` ✓ FOUND (Task 2 — plantInfo isSensitiveToSun)
  - `1a2a293` ✓ FOUND (Deviation cleanup — 5 sibling shim sites)
- All acceptance grep counts pass (see Verification block above)
- B4 null-guard parity invariant holds (CALLS=2, GUARDS=2)
- Zero `@ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` strings remain in `src/`
- `npx tsc --noEmit` exits 0 ✓
- `npm run check:legacy-fields` exits 0 ✓
- `npm run smoke:migration` 63/63 PASS ✓
- Working tree clean for all touched files ✓

---
*Phase: 04-schema-foundation-migration-core*
*Completed: 2026-04-30*
