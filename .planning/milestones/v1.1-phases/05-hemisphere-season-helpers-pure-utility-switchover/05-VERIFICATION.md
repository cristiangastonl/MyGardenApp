---
phase: 05-hemisphere-season-helpers-pure-utility-switchover
verified: 2026-04-30T00:00:00Z
status: human_needed
score: 4/4 must-haves verified (4 truths automatable; 3 device scenarios deferred to human)
re_verification:
  is_re_verification: false
human_verification:
  - test: "BA Apr 1 warm→cold flip observable in real app"
    expected: "User in Buenos Aires (lat -34.6) on April 1 sees their tropical houseplant's next-water-date shift consistently with the cold-bucket interval; same plant in Singapore (lat 1.35) and New York (lat 40) shows zone-appropriate intervals"
    why_human: "Visual confirmation in running app context — data layer is fully verified via smoke runner (BA Apr 1 → cold, Singapore year-round tropical, NY warm Apr-Sep) but cross-device cross-month UX confirmation needs a real or simulated device"
  - test: "Cactus (soil_check) on non-check-in day shows no 'regar' task in Hoy"
    expected: "Hoy tab shows no water task and no check_soil task for a cactus mid-cycle; PlantCard shows correct next-check-in date; health status stays excellent (no overdue_water issue)"
    why_human: "Requires running app on device; UI rendering of empty Hoy state for soil_check plants is partly Phase 6 territory; data layer (no task emitted, no penalty) is asserted in smoke (101+103/106 PASS), but visual rendering needs human eye"
  - test: "Cactus on check-in day shows 'check_soil' task with exact copy 'Tocá la tierra. Si está seca 5cm hacia abajo, regá.'"
    expected: "Hoy tab shows 🤚 icon + 'Chequear tierra — <Cactus name>' label; tapping opens DayDetailModal with body copy 'Tocá la tierra. Si está seca 5cm hacia abajo, regá.'; tap-to-done updates lastWatered and removes task"
    why_human: "i18n key existence + voseo verbs (tocá, regá) verified in smoke; ES vs EN locale switching at runtime + sentence-final rendering inside ImageBackground card is visual; tap-to-done flow is interactive"
---

# Phase 5: Hemisphere/Season Helpers + Pure-Utility Switchover Verification Report

**Phase Goal:** Pure-utility layer (`plantLogic`, `plantHealth`, `notificationScheduler`) consumes `lightLevel` + `waterSchedule` + season — soil-check plants get a new task type, never penalized for "overdue" watering, and three-zone seasonality (Northern temperate / Southern temperate / Tropical) drives every interval calculation.

**Verified:** 2026-04-30
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria + must_haves)

| #   | Truth                                                                                                                                          | Status            | Evidence                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BA Apr 1 flips warm→cold; Singapore stays tropical year-round; NY warm Apr-Sep / cold Oct-Mar                                                  | ✓ VERIFIED (data) | Runtime check: `getWaterSeason(-34.6, Mar31)='warm'` ↔ `Apr1='cold'`; `getWaterSeason(1.35, Jan15)='tropical'` ↔ `Jul15='tropical'`; `getWaterSeason(40, …)` warm Apr-Sep / cold Oct-Mar (smoke 14 month-boundary assertions PASS). Visual UX confirmation flagged for human.       |
| 2   | Tasks in Hoy, OS notifications, and health score for a given plant on a given day all derive from the SAME `(waterSchedule, currentSeason)` lookup | ✓ VERIFIED        | All 7 `getNextWaterDate` callers pass `latitude` (plantLogic, wateringRecommendations × 2, plantHealth, TodayScreen, PlantCard); all 5 `getTasksForDay` callers pass `latitude` (plantLogic, notificationScheduler, DayDetail, MonthCalendar, DayDetailModal); scheduler threads through `getTasksForDay` → `getWaterSeason` (transitive SSOT, no duplicate import). Smoke matrix proves BA cold 10d / NY warm 5d / Singapore tropical→warm 5d for the same plant on Apr 15. |
| 3   | soil_check cactus on non-check-in day: no `regar` task, no overdue penalty; on check-in day: `'check_soil'` task with copy "Tocá la tierra…"   | ✓ VERIFIED (data) | `getTasksForDay` dispatch on `waterMode === 'soil_check'` → `type:'check_soil'` (smoke: check-in day 1 task, non-check-in 0 tasks); `calculatePlantHealth` gates `overdue_water` block on `waterMode !== 'soil_check'` (smoke: 73-days-overdue cactus stays score 100, no overdue_water issue; fixed plant still penalized; undefined-mode preserves pre-Phase-5 behavior). i18n keys with voseo verified in both en/es. UX rendering flagged for human.                       |
| 4   | Season transition observable in data layer; no NaN, no crash, no >1-cycle jump in next-watering date                                           | ✓ VERIFIED        | Smoke pin: BA plant lastWatered Mar 25 + Apr 1 Southern flip → next-water bounded by `[today, today + cold_cycle (10d)]`, no NaN. Tropical Singapore plant uses warm bucket (no `undefined` from `waterSchedule['tropical']`).                                                       |

**Score:** 4/4 truths verified at the data/utility layer; 3 of those have UX surfaces flagged for human verification.

### Required Artifacts

| Artifact                                  | Expected                                                                                                                              | Status                  | Details                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/utils/seasonality.ts`                | `getWaterSeason()` + `WaterSeason` type + `TROPICAL_LAT_BOUNDARY`; pure, framework-free, no cache                                     | ✓ VERIFIED              | 38 lines; `Number.isFinite` guard for NaN; tropical-inclusive boundary; coexists with `tipSelector.getSeason` (4-season UI) — no naming collision.                                              |
| `src/utils/plantLogic.ts`                 | Season-aware `getNextWaterDate(plant, today, latitude)` + `getTasksForDay(plants, day, latitude)` + soil_check dispatch + bucket helper | ✓ VERIFIED              | 77 lines; `getSeasonalInterval` maps tropical→warm bucket; defensive ladder `waterSchedule[bucket]` → `waterEvery` → 7d. soil_check emits `🤚` + i18n label, never `'water'`.                |
| `src/utils/plantHealth.ts`                | `calculatePlantHealth` gains `latitude` 5th arg + `waterMode !== 'soil_check'` gate on `overdue_water` block; `calculateGardenHealth` 5-arg | ✓ VERIFIED              | 281 lines; gate at line 49 `if (daysUntilWater < 0 && plant.waterMode !== 'soil_check')`; defensive on `undefined` waterMode (preserves pre-Phase-5 penalty).                              |
| `src/utils/notificationScheduler.ts`      | `createMorningContent` + `scheduleMorningReminder` accept `latitude`; `getTasksForDay` 3-arg; `check_soil` lumped under water filter; B4 invariant preserved | ✓ VERIFIED              | 955 lines; 0 direct `getWaterSeason` imports (transitive SSOT enforced); waterTasks filter is `t.type === 'water' || t.type === 'check_soil'`; B4 callers=3, guards=2 → callers−1=2=guards. |
| `src/types/index.ts`                      | Task type extended to `'water' \| 'sun' \| 'outdoor' \| 'check_soil'`                                                                | ✓ VERIFIED              | Line 97 carries the 4-literal union.                                                                                  |
| `src/i18n/locales/en/common.json`         | Top-level `tasks.checkSoil` + `tasks.checkSoilBody`                                                                                  | ✓ VERIFIED              | `"Check soil — {{name}}"` + `"Touch the soil. If it's dry 5cm down, water."`.                                       |
| `src/i18n/locales/es/common.json`         | Same with voseo (tocá, regá), no tuteo (toca, riega)                                                                                  | ✓ VERIFIED              | `"Chequear tierra — {{name}}"` + `"Tocá la tierra. Si está seca 5cm hacia abajo, regá."`. Smoke voseo + tuteo-rejection regex both PASS.                                                       |
| `src/components/DayDetail.tsx`            | `'check_soil'` branch in 3 chains (icon → 🤚, label → t('tasks.checkSoil'), style switch reuse)                                       | ✓ VERIFIED              | Lines 88, 103, 161 confirm 3 branches; `latitude` required prop.                                                       |
| `src/components/DayDetailModal.tsx`       | `'check_soil'` branch in 4 chains (isDone, handlePress→onWater, bgColor, textColor lump)                                              | ✓ VERIFIED              | Lines 127, 133, 144, 151; isDone reuses `lastWatered` marker; tap dispatches to `onWater`.                            |
| `src/components/MonthCalendar.tsx`        | `hasWater` folds `'check_soil'` (3-dot semantic preserved)                                                                            | ✓ VERIFIED              | Line 67: `tasks.some(t => t.type === 'water' || t.type === 'check_soil')`. No new dot color.                          |
| `scripts/migration-smoke-test.mjs`        | Phase-5 section: SEASON-01..03 matrix + WATER-05 dispatch + WATER-06 skip + cross-month bounding + i18n parity (voseo)                | ✓ VERIFIED              | 106/106 PASS; 43 new Phase-5 assertions added (was 63/63).                                                              |

### Key Link Verification

| From                                          | To                                              | Via                                                                          | Status     | Details                                                                                                                |
| --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/utils/plantLogic.ts`                     | `src/utils/seasonality.ts`                      | `import { getWaterSeason, type WaterSeason }`                                | ✓ WIRED    | Line 3 import; called at line 35 inside `getNextWaterDate`.                                                            |
| `src/utils/plantHealth.ts`                    | `src/utils/plantLogic.ts` (`getNextWaterDate`)  | 3-arg call passing `latitude`                                                | ✓ WIRED    | Line 41 `getNextWaterDate(plant, today, latitude)`.                                                                    |
| `src/utils/notificationScheduler.ts`          | `src/utils/plantLogic.ts` (`getTasksForDay`)    | 3-arg call passing `latitude` (transitive SSOT)                              | ✓ WIRED    | Line 52 `getTasksForDay(plants, today, latitude)`; 0 direct `getWaterSeason` import in scheduler enforces SSOT contract. |
| `src/screens/TodayScreen.tsx` plantsWithTasks | `src/utils/plantLogic.ts` (`getNextWaterDate`)  | 3-arg call with `location?.lat ?? null`                                      | ✓ WIRED    | Line 165.                                                                                                              |
| `src/hooks/useNotifications.ts`               | `scheduleMorningReminder`                       | 5-arg call passing `latitude` 4th positional                                 | ✓ WIRED    | Lines 159, 278.                                                                                                        |
| `App.tsx` post-migration trigger              | `scheduleMorningReminder`                       | 5-arg call with `location?.lat ?? null`                                      | ✓ WIRED    | Line 174.                                                                                                              |
| `src/components/DayDetailModal.tsx` handlePress | `onWater` callback                            | `task.type === 'check_soil'` dispatches to `onWater` (single tap, mode-as-dispatcher) | ✓ WIRED    | Line 133.                                                                                                              |
| `src/utils/plantLogic.ts` `getTasksForDay`    | `Task['type'] === 'check_soil'` branch          | `p.waterMode === 'soil_check'` dispatch — emits `tasks.checkSoil` i18n label, NOT water emoji | ✓ WIRED    | Lines 57-63.                                                                                                            |

### Requirements Coverage

| Requirement | Source Plan(s)        | Description                                                                          | Status      | Evidence                                                                                                              |
| ----------- | --------------------- | ------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| SEASON-01   | 05-02                 | `getWaterSeason(latitude, date)` returns 3-zone string                              | ✓ SATISFIED | `src/utils/seasonality.ts` exports `getWaterSeason()`, `WaterSeason` type, `TROPICAL_LAT_BOUNDARY`. Smoke matrix asserts all 3 zones. REQUIREMENTS.md marks `[x]` Phase 5 Complete. |
| SEASON-02   | 05-02                 | Tropical zone (\|lat\| ≤ 23.5°) always uses `warm` schedule                          | ✓ SATISFIED | Inclusive `Math.abs(lat) <= 23.5`; `getSeasonalInterval` maps `'tropical' → 'warm'` bucket. Smoke asserts ±23.5 inclusive + Singapore year-round tropical. REQUIREMENTS.md `[x]`. |
| SEASON-03   | 05-02                 | Northern warm Apr-Sep / cold Oct-Mar; Southern inverted; month boundaries            | ✓ SATISFIED | `month >= 3 && month <= 8` Northern warm; Southern invert. Smoke asserts 8 month-boundary cases (NY + BA × {Mar 31, Apr 1, Sep 30, Oct 1}). REQUIREMENTS.md `[x]`.                 |
| SEASON-04   | 05-03, 05-04, 05-05   | Health calc, task generation, scheduler all derive interval from same lookup         | ✓ SATISFIED | All 6 consumer call paths thread `latitude` to `getWaterSeason` via `getTasksForDay`/`getNextWaterDate`. Same plant + day + lat → same `daysUntilWater` across 5 modules. REQUIREMENTS.md `[x]`. |
| WATER-05    | 05-02, 05-03, 05-05   | `soil_check` plants generate `'check_soil'` task with copy "Tocá la tierra…"        | ✓ SATISFIED | `Task['type']` extended; `getTasksForDay` dispatch (Plan 03); 3 component sites render new type (Plan 05); EN+ES voseo i18n keys (Plan 02). REQUIREMENTS.md `[x]`.                 |
| WATER-06    | 05-04                 | `soil_check` plants do NOT incur health-score penalty for overdue watering          | ✓ SATISFIED | `plantHealth.ts:49` gates `overdue_water` on `waterMode !== 'soil_check'`. Smoke: 73-days-overdue cactus stays score 100. Defensive on undefined waterMode. REQUIREMENTS.md `[x]`. |

No orphaned requirements: every Phase-5 ID in REQUIREMENTS.md is claimed by at least one plan's `requirements` field and verified in code.

### Anti-Patterns Found

None. Recent skills/rules scan against the modified files surfaced no blocker patterns:

- No `TODO` / `FIXME` / `PLACEHOLDER` introduced in Phase-5 files.
- No empty implementations / `return null` / `return {}` stubs.
- No `console.log`-only handlers.
- No new ALLOWLIST entries in `scripts/check-no-legacy-reads.js` (count unchanged at 27).
- No `useStorage`/hook usage inside utilities (Pitfall 6 avoided).
- No `Date.now()` inside `getWaterSeason` (Pitfall 4 avoided).
- No naming collision: `seasonality.ts` exports `getWaterSeason`, never `getSeason`; `tipSelector.getSeason` (4-season UI) coexists.

ℹ️ Info — `notificationScheduler.ts` exposes a known structural surprise documented in 05-04 SUMMARY: `plantHealth.ts:49` overdue branch is unreachable through the production `getNextWaterDate` advance-loop. The WATER-06 gate is defensive against future refactors. The smoke runner uses a no-advance plantLogic stub specifically to exercise the gate. Logged for v1.2 consideration; not a Phase-5 gap.

### Critical Invariants

| Invariant                                                                                                              | Status     | Evidence                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` exits 0                                                                                              | ✓ PASS     | Exit 0 confirmed.                                                                                                                                                                                          |
| `npm run smoke:migration` exits 0 with ≥106/106 PASS                                                                    | ✓ PASS     | 106/106 PASS, exit 0. (63 Phase-4 + 43 Phase-5 across Plans 02/03/04.)                                                                                                                                       |
| `npm run check:legacy-fields` exits 0                                                                                   | ✓ PASS     | "✅ No new legacy-field reads outside allowlist." Exit 0.                                                                                                                                                 |
| ALLOWLIST entries unchanged at 27                                                                                       | ✓ PASS     | `grep -E "^[[:space:]]+'src/" scripts/check-no-legacy-reads.js \| wc -l` returns 27.                                                                                                                       |
| B4 null-guard parity: `calculateSunWindow(` callers minus declaration === `if (!window) return` count                  | ✓ PASS     | callers=3, declaration=1, guards=2 → `callers - 1 = 2 = guards`.                                                                                                                                            |
| All 6 task-type-discriminator sites handle `'check_soil'`                                                              | ✓ PASS     | Verified: plantLogic dispatch (line 57+), notificationScheduler `createMorningContent` filter (line 84 lump), DayDetail × 3 chains (lines 88, 103, 161), DayDetailModal × 4 chains (lines 127, 133, 144, 151), MonthCalendar getIndicators (line 67). |
| `getWaterSeason` exported from `src/utils/seasonality.ts` only (no collision with `tipSelector.getSeason`)             | ✓ PASS     | seasonality.ts exports `getWaterSeason`/`WaterSeason`/`TROPICAL_LAT_BOUNDARY`; tipSelector.ts:8 still exports the original 4-season `getSeason` — different name, no shadowing.                          |
| `tasks.checkSoil` + `tasks.checkSoilBody` in BOTH en/es common.json with voseo verified                                | ✓ PASS     | EN: `"Check soil — {{name}}"` / `"Touch the soil. If it's dry 5cm down, water."`. ES: `"Chequear tierra — {{name}}"` / `"Tocá la tierra. Si está seca 5cm hacia abajo, regá."` Smoke voseo regex + tuteo-rejection regex both PASS. |

### Human Verification Required

Three observable behaviors require running the app on a real or simulated device. The data layer is fully proven via the 106-assertion smoke runner; what remains is interactive UX.

#### 1. BA Apr 1 warm→cold flip observable in the app's Hoy / PlantCard surface

**Test:** Set device location to Buenos Aires (or override `location.lat = -34.6` in storage). Add a plant with `waterSchedule = { warm: 5, cold: 10 }`. Set device clock to Mar 31, then Apr 1. Cold-launch the app each time.
**Expected:** Mar 31: PlantCard "next water" reflects warm bucket cadence (5d). Apr 1: PlantCard "next water" reflects cold bucket cadence (10d). Same plant in Singapore (lat 1.35) shows warm cadence year-round; same plant in NY (lat 40) shows opposite Northern flip in October.
**Why human:** Data layer is verified end-to-end (smoke); visual confirmation of the badge/PlantCard label across timezones and locations is interactive UX.

#### 2. Cactus (soil_check) on non-check-in day shows no "regar" task

**Test:** Add a cactus (`waterMode='soil_check'`, `waterSchedule={warm:14,cold:28}`). Set `lastWatered` to a date mid-cycle (e.g., 5 days ago). Cold-launch app. Navigate to Hoy.
**Expected:** No water task and no check_soil task in Hoy for the cactus. PlantCard shows correct next-check-in date. Cactus PlantCard shows "excellent" health (no overdue_water issue, even if "overdue" by classic cadence).
**Why human:** Data layer asserts the absence of task and the absence of penalty; verifying the empty UI surface plus the green health badge requires a running app.

#### 3. Cactus on check-in day shows `'check_soil'` task with the exact ES copy

**Test:** Same cactus; advance device date past `lastWatered + cold_interval`. Cold-launch app with ES locale. Navigate to Hoy. Tap the task. Switch to EN locale and re-verify.
**Expected:** Hoy shows 🤚 icon + label "Chequear tierra — <cactus name>". Tapping opens DayDetailModal with body text "Tocá la tierra. Si está seca 5cm hacia abajo, regá." Tap-to-done updates `lastWatered` (same handler as water task) and removes the task. EN locale shows "Check soil — <name>" + "Touch the soil. If it's dry 5cm down, water." Voseo verbs (tocá, regá) are present in ES; not tuteo (toca, riega).
**Why human:** i18n keys + voseo regex are smoke-verified; sentence rendering inside the modal card and tap-to-done flow are interactive UX.

### Gaps Summary

No automated gaps. All 4 success criteria are verified at the data layer (utility functions, type discriminators, smoke runner, i18n keys). Phase 5's contract is "the right data and tasks; Phase 6 renders them" (per CONTEXT.md `<domain>` section). The 3 human-verification items above test the rendered behaviors that fall out of correct data — they are the natural Phase-5/Phase-6 boundary.

Phase 5 is complete and gates clean (tsc green, smoke 106/106, legacy-fields green, ALLOWLIST 27, B4 invariant preserved). The phase is ready to proceed once the 3 device-scenario human checks pass (or sooner if Phase 6 begins and folds these into its UX testing).

---

_Verified: 2026-04-30_
_Verifier: Claude (gsd-verifier)_
