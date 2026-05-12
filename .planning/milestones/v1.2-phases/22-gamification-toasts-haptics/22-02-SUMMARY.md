---
phase: 22-gamification-toasts-haptics
plan: 02
subsystem: ui
tags: [toast, useEffect, useStorage, callback-registration, gamification, handler-migration, selectedDate-guard]

# Dependency graph
requires:
  - phase: 22-gamification-toasts-haptics
    provides: "Plan 22-01 — useStorage exposes waterPlant/sunPlant/outdoorPlant/fertilizePlant task actions + setOnTaskCompleted setter + onTaskCompletedRef useRef (Wave 1 action layer)"
  - phase: 22-gamification-toasts-haptics
    provides: "Plan 22-00 — gamification.toastSuccess i18n key (EN: 'You're on it! 🌱' / ES voseo: '¡Vas bien! 🌱') + smoke-phase22.cjs three-tier runner"
  - phase: 21-plant-journal
    provides: "Plan 21-04 (JOURNAL-04) — journalToastVisible distinct-identifier Toast pattern on PlantsScreen + TodayScreen; Phase 22 extends to a THIRD coexisting Toast"
  - phase: 18-plant-card-redesign
    provides: "Phase 18 CARD-01 — toastVisible swipe-undo Toast pattern on PlantsScreen + TodayScreen; Phase 22 preserves it and adds a 3rd sibling"
provides:
  - "src/screens/PlantsScreen.tsx: gamificationToastVisible state + setOnTaskCompleted callback registration + 3rd Toast sibling (no handler migration — collection-mode PlantCard does not render task chips)"
  - "src/screens/TodayScreen.tsx: gamificationToastVisible state + setOnTaskCompleted callback registration + 3rd Toast sibling; handleWater/handleSunDone/handleOutdoorDone migrated from inline updatePlant({lastWatered/sunDoneDate/outdoorDoneDate: ...}) to waterPlant(id)/sunPlant(id)/outdoorPlant(id) action calls"
  - "src/screens/CalendarScreen.tsx: FIRST Toast surface for this screen; gamificationToastVisible state + setOnTaskCompleted callback registration + Toast sibling; handlers migrated with selectedDate guard (today branch calls new actions; back-dating branch preserves inline updatePlant)"
  - "Three coexisting independent <Toast> siblings on PlantsScreen + TodayScreen (Phase 18 swipe-undo + Phase 21 journal-saved + Phase 22 task-done); single Toast surface on CalendarScreen (Phase 22 task-done only)"
affects:
  - "22-03 (manual device-test gate or Option B v1.2 backlog deferral)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-Toast coexistence pattern (Phase 18 + 21 + 22) — extends Phase 21's distinct-identifier discipline; each Toast owns independent visible/message/duration state, RN renders in mount order as natural Z-stack"
    - "Screen-level callback registration via useEffect + setter from context (setOnTaskCompleted) — mount registers, cleanup nulls. First codebase use of the context-callback-setter pattern landed in Plan 22-01"
    - "selectedDate-aware handler migration in CalendarScreen — present-day branch calls new useStorage actions (haptic+toast); back-dating branch preserves inline updatePlant (silent). Pattern preserves existing UX while enabling celebration on the common case"

key-files:
  created: []
  modified:
    - "src/screens/PlantsScreen.tsx (+20 LOC: state declaration + useEffect + 3rd Toast sibling; useStorage destructuring extended with setOnTaskCompleted)"
    - "src/screens/TodayScreen.tsx (+15 LOC net: state + useEffect + 3rd Toast sibling + handler migration; useStorage destructuring extended with waterPlant/sunPlant/outdoorPlant/setOnTaskCompleted; 3 inline updatePlant calls + 2 inline toggle ternaries removed)"
    - "src/screens/CalendarScreen.tsx (+37 LOC net: state + useEffect + Toast sibling + selectedDate-aware handler migration; imports extended with useEffect/Toast; useStorage destructuring extended with waterPlant/sunPlant/outdoorPlant/setOnTaskCompleted)"

key-decisions:
  - "PlantsScreen receives Toast surface + callback registration but NOT handler migration (verified PlantCard mode='collection' does not consume onWater/onSunDone/onOutdoorDone props — only onFertilizeDone={fertilizePlant} at L300; that flow already wires haptic+Toast via Plan 22-01's fertilizePlant extension). PlantsScreen still needs the Toast surface to display celebration when a fertilize-tap fires from MyPlantDetailModal opened over PlantsScreen, or when registered as the active screen during background action."
  - "CalendarScreen selectedDate special case: handlers branch on dateStr === todayStr. Today-branch calls new useStorage action (haptic+Toast fires). Else-branch preserves inline updatePlant() with back-dating ternary for sun/outdoor (silent — no celebration on retroactive task-marking). This preserves the existing 'mark task done for the selected day' UX without firing celebration for past-day completions."
  - "TodayScreen handlers fully migrated — toggle semantics for sun/outdoor now live inside the useStorage actions (wasUndone gate from Plan 22-01). Handler bodies simplified from ~6 lines each to 2 lines (action call + trackEvent). plants.find() lookups removed from the handler layer."
  - "Distinct identifier discipline preserved: gamificationToastVisible is distinct from Phase 18 toastVisible and Phase 21 journalToastVisible. Negative-grep would catch any clash; manual verification confirms no naming conflict across all 3 screens."

patterns-established:
  - "Pattern 1: Three coexisting independent Toast siblings (Phase 18 + 21 + 22) — each owns distinct state, message, duration. No queue/mutex. RN mount-order Z-stack handles rare simultaneous fires."
  - "Pattern 2: Screen-level setOnTaskCompleted registration via useEffect — mount sets, cleanup nulls. Standard React lifecycle; setter is stable (Plan 22-01 wrapped it in useCallback([])) so effect deps don't churn."
  - "Pattern 3: selectedDate-aware handler migration — when a screen operates on a non-today date, branch on equality to choose between the new action (today only) and the inline pattern (back-dating). Preserves existing UX for less-common back-dating flow."

requirements-completed: [GAM-01, GAM-02]

# Metrics
duration: 4 min
completed: 2026-05-12
---

# Phase 22 Plan 02: Screen-Level Toast Wiring + Handler Migration Summary

**3 screen-level <Toast> surfaces wired (PlantsScreen 3rd sibling, TodayScreen 3rd sibling, CalendarScreen first-ever) with gamificationToastVisible distinct-identifier state + useEffect setOnTaskCompleted callback registration; TodayScreen handlers fully migrated to waterPlant/sunPlant/outdoorPlant actions; CalendarScreen handlers migrated with selectedDate === todayStr guard preserving back-dating UX — all 10 GAM-01/02 SKIPs flipped to PASS, smoke runner now PASS=56 FAIL=0 SKIP=0 with cross-phase chain (Phase 18=56, 19=85, 20=49, 21=76) all green.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-12T01:19:01Z
- **Completed:** 2026-05-12T01:23:03Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- **PlantsScreen (Task 1):** useStorage destructuring extended with `setOnTaskCompleted`. `gamificationToastVisible` state declared distinctly from Phase 18 `toastVisible` and Phase 21 `journalToastVisible`. `useEffect` registers `setGamificationToastVisible` as the callback via `setOnTaskCompleted(() => setGamificationToastVisible(true))` with `setOnTaskCompleted(null)` cleanup. Third independent `<Toast>` sibling rendered after the Phase 21 journal-saved Toast with `t('gamification.toastSuccess')` + `durationMs={2000}`. **No handler migration** — verified PlantsScreen's PlantCard `mode='collection'` does NOT consume `onWater`/`onSunDone`/`onOutdoorDone` props (only `onFertilizeDone={fertilizePlant}` at L300; that flow already wires haptic+Toast via Plan 22-01's `fertilizePlant` extension).
- **TodayScreen (Task 2):** useStorage destructuring extended with `waterPlant`, `sunPlant`, `outdoorPlant`, `setOnTaskCompleted`. `gamificationToastVisible` state + `useEffect` callback registration added. Third `<Toast>` sibling rendered after Phase 21 journal-saved Toast. **Full handler migration:** `handleWater` (was: `updatePlant(plantId, { lastWatered: todayStr })`), `handleSunDone` (was: `plants.find` + `updatePlant` with ternary toggle), `handleOutdoorDone` (was: same toggle shape) — now each is a 2-line body calling the corresponding useStorage action followed by `trackEvent` (analytics calls preserved verbatim for continuity). Toggle semantics for sun/outdoor now live inside the actions (Plan 22-01's `wasUndone` gate fires haptic+Toast only on transition TO done, not on undo).
- **CalendarScreen (Task 3):** Imports extended with `useEffect` (added to React import) and `Toast` (added to `../components` barrel import — mirrors PlantsScreen/TodayScreen shape). useStorage destructuring extended with `waterPlant`, `sunPlant`, `outdoorPlant`, `setOnTaskCompleted`. `gamificationToastVisible` state + `useEffect` callback registration added (FIRST Toast surface for this screen). Toast JSX rendered inside the top-level `<SafeAreaView>` after `DayDetailModal`. **selectedDate-aware handler migration:** each of `handleWater`/`handleSunDone`/`handleOutdoorDone` now branches on `dateStr === todayStr` — today-branch calls the new useStorage action (haptic+Toast fires); else-branch preserves the inline `updatePlant` pattern with the existing back-dating toggle ternary for sun/outdoor (silent — no celebration on retroactive marking). DayDetailModal prop wiring unchanged (handlers delegate internally).
- **Smoke runner:** all 10 GAM-01/02 SKIPs from Plan 22-01 baseline flipped to PASS. Final smoke state **PASS=56 FAIL=0 SKIP=0** (was PASS=46 FAIL=0 SKIP=10 at Plan 22-01 close). GAM-05 STRICT negative-grep remains clean (0 violations). Cross-phase chain green: Phase 18 PASS=56, Phase 19 PASS=85, Phase 20 PASS=49, Phase 21 PASS=76 — all FAIL=0.
- **TypeScript clean:** `npx tsc --noEmit` exits 0.
- **i18n parity preserved:** `npm run check:i18n-keys` PASS (118 catalog ids verified across en/es plants.json).
- **Cross-phase regression preserved:** Phase 18 `toastVisible` + Phase 21 `journalToastVisible` declarations and Toast JSX siblings remain untouched in PlantsScreen + TodayScreen. CalendarScreen had 0 Toasts at baseline; now has 1 (the new Phase 22 task-done Toast).

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire gamificationToastVisible Toast surface in PlantsScreen (no handler migration)** — `b20a6c1` (feat)
2. **Task 2: Wire gamificationToast + migrate task handlers in TodayScreen** — `5faf2b4` (feat)
3. **Task 3: Wire first Toast surface + migrate task handlers in CalendarScreen** — `07dd033` (feat)

**Plan metadata:** _(pending docs commit after STATE/ROADMAP/REQUIREMENTS update)_

## Files Created/Modified

- `src/screens/PlantsScreen.tsx` (+20 LOC): useStorage destructuring gains `setOnTaskCompleted`; new state + useEffect block added immediately after the Phase 21 `journalToastVisible` declaration (anchors comment block to the 3-Toast coexistence pattern); third `<Toast>` JSX sibling rendered after the Phase 21 Toast inside the existing `</SafeAreaView>` close. No handler migration.
- `src/screens/TodayScreen.tsx` (+30/-15 LOC net): useStorage destructuring gains 4 new identifiers (`waterPlant`, `sunPlant`, `outdoorPlant`, `setOnTaskCompleted`); new state + useEffect block added after `journalToastVisible`; third `<Toast>` JSX sibling rendered after Phase 21 Toast; handler bodies for `handleWater`/`handleSunDone`/`handleOutdoorDone` shrunk from 5/10/10 lines to 2/2/2 lines (action call + trackEvent) — inline `updatePlant` calls and `plants.find` toggle ternaries fully removed.
- `src/screens/CalendarScreen.tsx` (+45/-8 LOC net): React import extended with `useEffect`; components barrel import extended with `Toast`; useStorage destructuring gains 4 new identifiers; new state + useEffect block added after the existing `showDayDetail` state; handler bodies for `handleWater`/`handleSunDone`/`handleOutdoorDone` rewritten with `dateStr === todayStr` branch + preserved back-dating else-branch; `<Toast>` JSX sibling added inside `<SafeAreaView>` after `DayDetailModal`.

## Decisions Made

- **PlantsScreen gets Toast surface + callback registration but NOT handler migration:** Verified at planning time and again at execution that PlantCard `mode='collection'` does not consume `onWater`/`onSunDone`/`onOutdoorDone` props. Only `onFertilizeDone={fertilizePlant}` at L300 — and `fertilizePlant` already fires haptic+Toast via Plan 22-01's extension. PlantsScreen still NEEDS the Toast surface because (a) the Plan 22-01 `setOnTaskCompleted` callback can be registered by any focused screen, and (b) MyPlantDetailModal's fertilize card (Phase 20 FERT-06) opens from PlantsScreen — when a fertilize-tap fires inside the modal, the Toast must render on its parent screen.
- **CalendarScreen selectedDate guard via `dateStr === todayStr`:** The new useStorage actions always write `formatDate(new Date())` (today). CalendarScreen's existing UX lets users mark task-done for any selected day (back-dating). To preserve this while enabling haptic+Toast on the common case (marking today's tasks done from today's day-detail modal), each handler computes `todayStr = formatDate(new Date())` and `dateStr = formatDate(selectedDate)`, then branches: equal → call new action; not equal → preserve inline updatePlant pattern. The else-branch is silent (no celebration for retroactive completions — consistent with the UX principle that back-dating is "fixing the record" not "doing the task").
- **TodayScreen handlers fully migrated (no guard needed):** TodayScreen always operates on today (no `selectedDate` field). Direct migration to action calls is correct. `trackEvent` analytics calls preserved verbatim — they ride along with the action call as a second statement in the handler body.
- **useEffect deps `[setOnTaskCompleted]` (not `[]`):** Plan 22-01 wrapped `setOnTaskCompleted` in `useCallback([])` so its identity is stable across renders. Including it as a dep makes the lint rule happy and is harmless (effect re-runs at most when the setter identity changes, which never happens because of the stable `useCallback`). All 3 screens use the identical deps pattern.

## Deviations from Plan

None - plan executed exactly as written.

The plan was unusually well-scoped — Plan 22-01 had already absorbed the action-layer work, the smoke runner whitelist+proximity deviations, and the GAM-05 lock pattern. Plan 22-02 is pure screen-level wiring with the migration recipe specified in `<action>` blocks down to the exact diff. Three atomic commits, no surprises, no auto-fixes needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 22-03 (Wave 3):** Manual device-test gate or Option B v1.2 milestone-end backlog deferral. Per the established Phase 18-05 / 19-07 / 20-10 / 21-06 precedent, this is typically deferred to the v1.2 milestone-end manual-test pass. The smoke runner now has 0 SKIPs (all GAM-01/02/05 sentinels PASS); the only remaining verification surface is the manual device test (haptic actually fires on iOS+Android; Toast renders above tab bar + ExpandedFAB; three Toasts coexist without race; sun/outdoor toggle off is silent; GAM-05 anti-pattern visually absent across all screens).
- **No cross-phase regression risk:** Phase 18 (mood emoji + 5-element PlantCard) + Phase 19 (TOX-03/04/06) + Phase 20 (FERT-03 5-site + FERT-06 two-column + FERT-07 i18n parity) + Phase 21 (JOURNAL-04 Diario section + JOURNAL-05 no-premium-gate) cross-phase STRICT sentinels all remain green. tsc clean. i18n parity preserved (118 catalog ids).
- **Phase 22 implementation surface complete:** Plan 22-00 (Wave 0 scaffold) + Plan 22-01 (Wave 1 useStorage action layer) + Plan 22-02 (Wave 2 screen wiring) cover all 3 phase requirements (GAM-01 Toast, GAM-02 haptic, GAM-05 anti-pattern lock) with smoke runner full PASS. Only the manual device-test checkpoint (Plan 22-03) remains — and it follows the established Option B deferral precedent.

---
*Phase: 22-gamification-toasts-haptics*
*Completed: 2026-05-12*

## Self-Check: PASSED

- `.planning/phases/22-gamification-toasts-haptics/22-02-SUMMARY.md` — FOUND on disk
- `src/screens/PlantsScreen.tsx` — FOUND on disk with gamificationToastVisible + setOnTaskCompleted + 3rd Toast sibling
- `src/screens/TodayScreen.tsx` — FOUND on disk with handler migration + gamificationToastVisible + 3rd Toast sibling
- `src/screens/CalendarScreen.tsx` — FOUND on disk with selectedDate-aware handler migration + gamificationToastVisible + first Toast sibling
- Commit `b20a6c1` (Task 1: feat 22-02 PlantsScreen) — FOUND in git log
- Commit `5faf2b4` (Task 2: feat 22-02 TodayScreen) — FOUND in git log
- Commit `07dd033` (Task 3: feat 22-02 CalendarScreen) — FOUND in git log
- Smoke phase22: PASS=56 FAIL=0 SKIP=0
- Cross-phase chain: Phase 18 PASS=56, Phase 19 PASS=85, Phase 20 PASS=49, Phase 21 PASS=76 — all FAIL=0
- tsc --noEmit: exit 0
- check:i18n-keys: PASS (118 catalog ids)
