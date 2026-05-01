---
phase: 05-hemisphere-season-helpers-pure-utility-switchover
plan: 05
subsystem: utils
tags: [notificationScheduler, task-discriminator, check-soil, season-aware, latitude-threading, season-04, water-05, pitfall-8, wave-4, phase-5-final]

# Dependency graph
requires:
  - phase: 05-hemisphere-season-helpers-pure-utility-switchover
    provides: "Plan 04 — plantHealth/calculateGardenHealth season-aware via latitude 5th positional arg + WATER-06 soil_check overdue-water gate; 7 caller files threaded latitude through; smoke at 106/106 PASS; multi-stage tsc handoff bounded to exactly 5 Plan-05-owned files (DayDetail, DayDetailModal, MonthCalendar, PlantsScreen<PlantCard>, notificationScheduler.createMorningContent → getTasksForDay 2-arg)."
provides:
  - "src/utils/notificationScheduler.ts — createMorningContent(plants, weather, latitude, healthStatuses?) + scheduleMorningReminder(time, plants, weather, latitude, healthStatuses?) season-aware signatures. getTasksForDay called with 3-arg (plants, today, latitude) — closes SEASON-04 transitively (no direct getWaterSeason import needed; the lookup is one hop downstream via getTasksForDay). Morning notification body LUMPS check_soil tasks under the existing water verb (Phase 5 / Open Question 1 v1.1 lump decision) — single waterTasks filter is `t.type === 'water' || t.type === 'check_soil'`. B4 null-guard parity invariant preserved (callers - 1 = 2 = guards)."
  - "DayDetail.tsx — 'check_soil' branch added to all 3 discriminator chains (getTaskIcon → 🤚, getTaskTypeLabel → t('tasks.checkSoil'), taskIcon style switch reuses styles.taskIconWater for lump visual). DayDetailProps gains required `latitude: number | null` prop (no JSX consumers — file is unused in current codebase; required-prop-change is safe)."
  - "DayDetailModal.tsx — 'check_soil' branch added to all 4 discriminator chains: isDone reuses plant.lastWatered === dateStr (per CONTEXT.md mode-as-dispatcher / lastWatered-as-marker decision); handlePress dispatches to onWater (single tap completes); bgColor + textColor lump form (`'water' || 'check_soil'`) reuses water styling. DayDetailModalProps gains required latitude prop. CalendarScreen.tsx (only consumer) updated."
  - "MonthCalendar.tsx — hasWater dot indicator folds 'check_soil' into the same dot (`tasks.some(t => t.type === 'water' || t.type === 'check_soil')`). 3-dot calendar semantic preserved (no new dot color introduced — Phase 6 owns visual differentiation if user research shows distinct semantics matter). MonthCalendarProps gains required latitude prop. CalendarScreen.tsx caller updated."
  - "App.tsx — post-migration reschedule trigger updated to pass `location?.lat ?? null` as 4th positional arg to scheduleMorningReminder. `location` added to MVP AppContent's useStorage destructure (was missing — Rule 3 blocking fix; AUTH AppContent already had it)."
  - "Project-wide tsc GREEN: `npx tsc --noEmit` exits 0. All 6 task-type-discriminator audit sites from RESEARCH §Pitfall 8 now handle 'check_soil' (plantLogic Plan 03; scheduler Task 1; DayDetail Task 2; DayDetailModal Task 3; MonthCalendar Task 4; scheduler morning copy lump filter Task 1)."
  - "Phase 5 closes 5/5 plans. v1.1 hemisphere/season-helpers + pure-utility switchover complete: SEASON-01..04, WATER-05, WATER-06 all locked across plantLogic, plantHealth, notificationScheduler, and 5 component callsites. No new ALLOWLIST entries (legacy-fields exit 0). Smoke 106/106 PASS unchanged (this plan added no new utility behavior — only consumer wiring)."
affects:
  - "Phase 6 (UX badges + empty-state copy) — owns dedicated visual treatment for 'check_soil' tasks if telemetry shows users want a separate verb (currently lumped under water). Phase 6 may introduce taskIconCheckSoil style + dotCheckSoil indicator + 'Te avisamos en N días' empty-state copy. The lump decision is reversible — flip the OR-chain back to two-branch and add the new style/dot."
  - "Phase 7 (LOC-03 + manual climate-zone override) — already wired transparently. All `latitude` parameters accept `null` and fall back to 'warm' season default per LOC-03. Phase 7 layers manual override on top by replacing the `location?.lat ?? null` source at caller sites; Phase 5's contracts are downstream-stable."
  - "Phase 8 (catalog rebalance) — depends on getWaterSeason + check_soil dispatch (locked here in Phase 5). Phase 8 may add per-PlantDBEntry catalog overrides for cold-season factors; consumer code (this plan) is already season-aware end-to-end."

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lump-vs-split convention for new task types: when introducing a new Task discriminator (post-MVP), the FIRST decision is whether to lump the visual + notification copy under an existing axis or split into a dedicated visual + verb. Phase 5 lumps 'check_soil' under water (single waterTasks filter, single calendar dot, water-axis bgColor). v1.1 decision; Phase 6 may revisit. Pattern: add the OR-chain at every discriminator site (filter, isDone, handlePress, bgColor, textColor, indicator boolean) — 6 sites in this codebase, audited via RESEARCH §Pitfall 8 — and reuse existing styles. The lump form `t.type === 'X' || t.type === 'Y'` is naturally easy to flip back to split when telemetry warrants."
    - "Transitive single-source-of-truth via call-chain threading (vs direct import): scheduler does NOT import getWaterSeason directly. Instead, it threads `latitude` into getTasksForDay, which calls getWaterSeason internally. SEASON-04 contract is satisfied without adding a new import edge. Pattern: for utility A → utility B → utility C call chains, prefer threading the parameter through over duplicating imports of the leaf utility — single call path = single source of truth. Acceptance criterion `grep -c \"getWaterSeason\" src/utils/notificationScheduler.ts` returns 0 explicitly enforces this."
    - "Required-prop ratchet: when a previously-optional discriminator field becomes required (e.g., `latitude: number | null`), make it required at the prop-interface level rather than defaulting inside the component. Forces every JSX consumer to be explicit about the latitude source (location?.lat ?? null vs hard-coded null), surfacing via tsc which screens are season-aware vs LOC-03-fallback. Plan 05 made latitude required on DayDetail, DayDetailModal, MonthCalendar (propagating Plan 03's decision on PlantCard). All callers updated explicitly with the safe fallback expression."

key-files:
  created: []
  modified:
    - "src/utils/notificationScheduler.ts (+5 lines): createMorningContent gains latitude param (4th positional, before healthStatuses). getTasksForDay updated to 3-arg. waterTasks filter expanded to lump check_soil. scheduleMorningReminder gains latitude param (4th positional, before healthStatuses). createMorningContent caller updated to pass latitude. NO direct getWaterSeason import."
    - "src/hooks/useNotifications.ts (+0 lines, 2 sites): both scheduleMorningReminder callers (line 159 morning-reminder useEffect + line 278 enableNotifications) now pass `latitude` as 4th positional arg before `healthStatuses`. The hook's UseNotificationsOptions.latitude was already populated by Plan 04."
    - "App.tsx (+2 lines, 1 site): post-migration reschedule trigger (line 173) updated to scheduleMorningReminder(morningTime, plants, null, location?.lat ?? null, []). `location` added to MVP AppContent's useStorage destructure (was missing — Rule 3 blocking fix; AUTH AppContent destructure already had it on line 275)."
    - "src/components/DayDetail.tsx (+5 lines): getTaskIcon switch case 'check_soil' returns 🤚. getTaskTypeLabel switch case 'check_soil' returns t('tasks.checkSoil'). taskIcon style switch line for 'check_soil' reuses styles.taskIconWater. DayDetailProps gains required `latitude: number | null` (Rule 3 — required for getTasksForDay 3-arg call). getTasksForDay updated to 3-arg. NO JSX consumers exist for DayDetail (search verified)."
    - "src/components/DayDetailModal.tsx (+6 lines, 4 sites): isDone gains `(task.type === 'check_soil' && plant.lastWatered === dateStr)` line. handlePress gains `else if (task.type === 'check_soil') onWater(task.plantId)`. bgColor and textColor switches lump 'water' || 'check_soil' under water styling. DayDetailModalProps gains required latitude prop; getTasksForDay updated to 3-arg."
    - "src/components/MonthCalendar.tsx (+2 lines): hasWater = tasks.some(t => t.type === 'water' || t.type === 'check_soil'). MonthCalendarProps gains required latitude prop; getTasksForDay updated to 3-arg. No new dot color (3-dot semantic preserved)."
    - "src/screens/CalendarScreen.tsx (+3 lines, 2 sites + destructure): location added to useStorage destructure. <DayDetailModal> JSX gains latitude={location?.lat ?? null}. <MonthCalendar> JSX gains latitude={location?.lat ?? null}."
    - "src/screens/PlantsScreen.tsx (+1 line, 1 site, Rule 3 deviation): <PlantCard> JSX gains latitude={location?.lat ?? null}. Closes the final tsc error from the Plan 03/04 multi-stage handoff (PlantCard.latitude has been required since Plan 03 Task 2)."

key-decisions:
  - "Phase 5 final tsc closure was a 5-file handoff per Plan 04 SUMMARY's affects field (DayDetail, DayDetailModal, MonthCalendar, PlantsScreen<PlantCard>, notificationScheduler.createMorningContent), NOT the 4-file enumeration in Plan 05's task list. PlantsScreen<PlantCard> wasn't a Plan 05 task, but closing project-wide tsc green required fixing it. Handled as Rule 3 (Blocking) deviation. Future planners: when a plan's success_criteria says 'project-wide tsc green' AND the previous plan's handoff includes more error sites than the current plan's tasks enumerate, all handoff sites must be addressed inline as deviations."
  - "DayDetail.tsx, DayDetailModal.tsx, MonthCalendar.tsx all received `latitude: number | null` as a REQUIRED prop (not optional). Forces every JSX consumer to be explicit about season-source vs LOC-03-fallback. CalendarScreen (only consumer of DayDetailModal + MonthCalendar) already had useStorage but was not destructuring location — required-prop ratchet surfaced the blind spot. DayDetail.tsx has zero JSX consumers in the current codebase (grep verified) — making the prop required there is a no-op risk-wise, but maintains symmetry with the other two."
  - "App.tsx had MVP AppContent path NOT destructuring location from useStorage (the AUTH AppContent path on line 275 already does). Plan 05's Edit 8 instruction said 'Verify the existing destructure already includes location (it does — Phase 4 Plan 07 added it). If not, add location' — added in this plan as a Rule 3 fix. The two AppContent paths (MVP vs AUTH) destructure independently, so blind-spot was real."
  - "B4 null-guard parity invariant preserved without explicit work: Plan 05 did NOT add new calculateSunWindow callers or new null-guards. The grep count is 3 callers (1 declaration + 2 invokers) and 2 guards — `callers - 1 = 2 = guards` holds. Defensive against any future Plan-5-adjacent refactor that might inadvertently break the invariant; the verify command in Task 1 explicitly checks it."
  - "SEASON-04 single-source-of-truth contract satisfied transitively, not by direct import: notificationScheduler does NOT import getWaterSeason. The single source of truth is `getTasksForDay`, which is the only place that calls `getWaterSeason(latitude, today)`. Scheduler's createMorningContent calls getTasksForDay with the latitude param threaded through — same call chain as plantHealth (which calls getNextWaterDate which calls getWaterSeason). Acceptance criterion `grep -c 'getWaterSeason' src/utils/notificationScheduler.ts` returns 0 enforces this. Pattern: prefer threading params over duplicating leaf-utility imports for SSOT contracts."
  - "Lump-under-water decision (Open Question 1) locked across all 6 audit sites coherently: morning notification body, calendar dot indicator, DayDetailModal bgColor + textColor, DayDetail taskIcon style, plantLogic emit (Plan 03 sets task.type === 'check_soil' with i18n label distinct from water but visual lumping at consumer sites). The visual lump is consistent — the LABEL is what differentiates ('Chequear tierra de Aloe' vs 'Regar Aloe'). Phase 6 will revisit visual differentiation if user research warrants."

patterns-established:
  - "Required-prop ratchet for season-aware components: when a downstream utility (here getTasksForDay) gains a required parameter, ratchet the prop interface of every component that calls it from optional to required. Forces tsc to surface every JSX consumer that needs to be updated. Plan 05 ratcheted DayDetail, DayDetailModal, MonthCalendar — and CalendarScreen + PlantsScreen had to be updated as cascading consumers. Anti-pattern (rejected): defaulting `latitude = null` inside the component — silently masks blind spots."
  - "Multi-stage tsc handoff verification: when the previous plan (here Plan 04) ships an intentionally-bounded set of tsc errors as 'handed off to next plan', the next plan's first verify step should `npx tsc --noEmit 2>&1 | head -10` to confirm the baseline matches the documented handoff. Plan 05 baseline showed exactly the 5 errors documented in Plan 04 SUMMARY's affects field. Future planners with multi-stage handoffs should always verify baseline before starting tasks — drift between SUMMARY's affects and actual tsc state is a signal of mid-stream changes that need acknowledgement."
  - "Transitive SSOT via call-chain threading: avoid duplicating leaf-utility imports across multiple consumers. Thread the parameter through one call chain. Plan 05 example: plantLogic.getTasksForDay calls getWaterSeason directly; scheduler calls getTasksForDay with latitude threaded; the 'single source of truth' is the one call chain, not multiple imports. Verified by acceptance criterion `grep -c 'getWaterSeason' src/utils/notificationScheduler.ts === 0`."

requirements-completed: ["SEASON-04", "WATER-05"]

# Metrics
duration: 11 min
completed: 2026-05-01
---

# Phase 5 Plan 05: notificationScheduler Season-Aware + Component Discriminator Exhaustion Summary

**`scheduleMorningReminder` and `createMorningContent` now accept `latitude` (4th positional arg, before optional `healthStatuses`); `getTasksForDay` is invoked with the 3-arg form throughout, closing SEASON-04 transitively (no direct `getWaterSeason` import in scheduler); morning-notification body LUMPS `check_soil` tasks under the water verb (Phase 5 / Open Question 1 v1.1 lump decision); DayDetail / DayDetailModal / MonthCalendar all handle the new `'check_soil'` task type across all 8 discriminator chains (getTaskIcon, getTaskTypeLabel, taskIconWater style, isDone, handlePress, bgColor, textColor, hasWater dot indicator) without a single fallthrough to default; CalendarScreen + PlantsScreen received the cascading latitude-prop updates plus the final Rule 3 PlantsScreen<PlantCard> fix that closes the multi-stage tsc handoff Plan 03 → Plan 04 → Plan 05; project-wide `npx tsc --noEmit` exits 0; smoke runner stays at 106/106 PASS; legacy-fields ALLOWLIST count unchanged at 27; B4 null-guard parity invariant preserved (callers - 1 = 2 = guards). Phase 5 ships 5/5 plans complete.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-01T14:33:37Z
- **Completed:** 2026-05-01T14:44:40Z
- **Tasks:** 4
- **Files modified:** 8 (1 utility + 1 hook + App.tsx + 3 components + 2 screens)

## Accomplishments

- **`notificationScheduler.ts` is the third and final SEASON-04 single-source-of-truth consumer wired this phase.** `createMorningContent` and `scheduleMorningReminder` accept `latitude: number | null` as the 4th positional arg (before optional `healthStatuses`). The scheduler invokes `getTasksForDay(plants, today, latitude)` — the same single source of truth that drives task generation, plantHealth.calculatePlantHealth, calculateGardenHealth, wateringRecommendations, and PlantCard.tsx. SEASON-04 closed across all 6 consumer call paths.
- **Morning notification body LUMPS `check_soil` tasks under the water verb** per RESEARCH.md Open Question 1 v1.1 decision. Single filter: `t.type === 'water' || t.type === 'check_soil'`. The label semantically renders as "Regá: Aloe y 2 plantas" treating check-soil as water-axis attention. v1.2 may split if telemetry shows users want a separate verb.
- **All 6 task-type-discriminator audit sites from RESEARCH §Pitfall 8 now handle `'check_soil'`:** plantLogic (Plan 03), scheduler.createMorningContent filter (this plan Task 1), DayDetail's 3 chains (Task 2: getTaskIcon → 🤚; getTaskTypeLabel → t('tasks.checkSoil'); taskIcon style → reuse styles.taskIconWater), DayDetailModal's 4 chains (Task 3: isDone reuses lastWatered; handlePress dispatches to onWater; bgColor + textColor lump under water styling), MonthCalendar getIndicators hasWater (Task 4: folds check_soil into same dot — 3-dot semantic preserved). Zero fallthrough to default.
- **Project-wide tsc GREEN:** `npx tsc --noEmit` exits 0. The multi-stage tsc handoff documented in Plan 03+04 SUMMARYs `affects:` fields fully closed: DayDetail (getTasksForDay 3-arg), DayDetailModal (3-arg), MonthCalendar (3-arg), PlantsScreen<PlantCard> (latitude prop), notificationScheduler.createMorningContent (3-arg) — all 5 errors gone.
- **B4 null-guard parity invariant preserved** without explicit work: 3 calculateSunWindow callers (1 declaration + 2 invokers) and 2 `if (!window) return` guards. `callers - 1 = 2 = guards`. Plan 05 did not touch the scheduler's sun-window code paths.
- **Smoke 106/106 PASS** unchanged across the plan (no new utility-level assertions added — Plan 05 was pure consumer wiring). `npm run check:legacy-fields` exit 0; ALLOWLIST count unchanged at 27.
- **Phase 5 ships 5/5 plans complete.** v1.1 hemisphere/season-helpers + pure-utility switchover is locked: SEASON-01 (getWaterSeason), SEASON-02 (tropical zone), SEASON-03 (month-boundary flip), SEASON-04 (single-source-of-truth across 6 consumers), WATER-05 (check_soil emit + UI), WATER-06 (no-overdue-penalty for soil_check) all complete.

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor notificationScheduler.ts + useNotifications.ts + App.tsx** — `1da97bc` (refactor)
2. **Task 2: DayDetail.tsx 'check_soil' branch (icon/label/style)** — `990e92e` (feat)
3. **Task 3: DayDetailModal.tsx 'check_soil' branch (4 chains) + CalendarScreen latitude prop** — `4fc25c8` (feat)
4. **Task 4: MonthCalendar.tsx 'check_soil' lump in hasWater + CalendarScreen + PlantsScreen<PlantCard> latitude prop (Rule 3 closure)** — `cb09415` (feat)

_Plan metadata commit (SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md) follows separately._

## Files Created/Modified

- `src/utils/notificationScheduler.ts` — createMorningContent gains latitude param (4th positional, before healthStatuses). getTasksForDay updated to 3-arg call. waterTasks filter expanded to lump 'check_soil'. scheduleMorningReminder gains latitude param + threads to createMorningContent. NO direct getWaterSeason import (acceptance criterion enforces 0 occurrences).
- `src/hooks/useNotifications.ts` — both scheduleMorningReminder callers (line 159 + line 278) pass latitude as 4th positional arg before healthStatuses.
- `App.tsx` — `location` added to MVP AppContent useStorage destructure (was missing — Rule 3 fix). Post-migration reschedule trigger updated to pass location?.lat ?? null as 4th arg.
- `src/components/DayDetail.tsx` — 'check_soil' branch in 3 discriminator chains (getTaskIcon → 🤚, getTaskTypeLabel → t('tasks.checkSoil'), taskIcon style switch → reuse styles.taskIconWater). DayDetailProps gains required latitude prop. getTasksForDay 3-arg.
- `src/components/DayDetailModal.tsx` — 'check_soil' branch in 4 discriminator chains: isDone reuses lastWatered marker, handlePress dispatches to onWater, bgColor + textColor lump form `'water' || 'check_soil'`. DayDetailModalProps gains required latitude prop. getTasksForDay 3-arg.
- `src/components/MonthCalendar.tsx` — hasWater dot indicator folds 'check_soil' into same dot. MonthCalendarProps gains required latitude prop. getTasksForDay 3-arg.
- `src/screens/CalendarScreen.tsx` — `location` added to useStorage destructure. `<DayDetailModal>` and `<MonthCalendar>` JSX both pass latitude={location?.lat ?? null}.
- `src/screens/PlantsScreen.tsx` (Rule 3 deviation) — `<PlantCard>` JSX gains latitude={location?.lat ?? null}. Closes the final multi-stage tsc handoff site from Plan 03/04.

## Decisions Made

- **Phase 5 final tsc closure was a 5-file handoff, not the 4 tasks Plan 05 enumerated.** PlantsScreen<PlantCard> latitude prop was missing from Plan 05's task list but documented as Plan-05-owned in Plan 04 SUMMARY's affects field. Closed inline as Rule 3 deviation. Future planners: trust the previous plan's `affects` field, not just the current plan's task enumeration.
- **DayDetail/DayDetailModal/MonthCalendar received required (not optional) latitude props.** Forces tsc to surface every JSX consumer that needs to be updated. CalendarScreen wasn't destructuring `location` — the required-prop ratchet surfaced the blind spot via tsc error, which is the intended forcing function.
- **App.tsx MVP AppContent path was missing `location` from useStorage destructure.** AUTH AppContent path (line 275) already had it; MVP path (line 116) did not. Plan 05 Edit 8 instruction anticipated this with "Verify the existing destructure already includes location… If not, add location" — added as a Rule 3 fix, which the plan explicitly authorized.
- **SEASON-04 satisfied transitively, not via direct import.** notificationScheduler does NOT import getWaterSeason. The single source of truth is the call chain `useNotifications → scheduleMorningReminder → createMorningContent → getTasksForDay → getWaterSeason`. Acceptance criterion `grep -c "getWaterSeason" src/utils/notificationScheduler.ts === 0` enforces this. Pattern: prefer call-chain threading over duplicating leaf-utility imports for SSOT contracts.
- **Lump-under-water decision applied uniformly across 6 discriminator sites.** Visual + notification-body + calendar-dot all lump check_soil under water styling/verb. The semantic differentiation lives in the i18n label only ('Chequear tierra de Aloe' vs 'Regar Aloe'). Phase 6 may revisit visual differentiation; the lump form `'water' || 'check_soil'` is naturally easy to flip back to split.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] App.tsx MVP AppContent missing `location` in useStorage destructure**

- **Found during:** Task 1 (after `npx tsc --noEmit` post-App.tsx edit)
- **Issue:** Plan 05 Edit 8 instruction said `location?.lat ?? null` should be passed as 4th arg to scheduleMorningReminder. Plan said "Verify the existing destructure already includes location (it does — Phase 4 Plan 07 added it). If not, add location to the useStorage() destructure at the top of App.tsx." Verification showed Plan 07 added `location` to the AUTH AppContent path (line 275) but NOT to the MVP AppContent path (line 116). Without the destructure, App.tsx tsc-errors with `Cannot find name 'location'`.
- **Fix:** Added `location` to MVP AppContent's useStorage destructure (line 121).
- **Files modified:** App.tsx (1 line)
- **Verification:** `grep -c "scheduleMorningReminder(morningTime, plants, null, location?.lat ?? null" App.tsx` returns 1; `npx tsc --noEmit 2>&1 | grep "App.tsx"` returns 0 errors.
- **Committed in:** 1da97bc (Task 1 commit)

**2. [Rule 3 - Blocking] DayDetail.tsx getTasksForDay 2-arg call (line 59) — Plan 05 task did not enumerate the 3-arg upgrade**

- **Found during:** Task 2 (initial tsc check after icon/label/style edits)
- **Issue:** Plan 05 Task 2's action block enumerated 3 edits to DayDetail.tsx (getTaskIcon switch, getTaskTypeLabel switch, taskIcon style switch) but did NOT include the `getTasksForDay(plants, date)` 2-arg call on line 59 that Plan 03 made obsolete. Plan 05's success_criteria requires project-wide tsc green, so this had to be addressed.
- **Fix:** Added `latitude: number | null` as a required prop to DayDetailProps. Updated getTasksForDay call to 3-arg form. DayDetail.tsx has zero JSX consumers in the current codebase (grep verified — only DayDetailModal is used), so making the prop required breaks nothing.
- **Files modified:** src/components/DayDetail.tsx (3 lines: prop interface + destructure + getTasksForDay call)
- **Verification:** `npx tsc --noEmit 2>&1 | grep "DayDetail.tsx"` returns 0 errors. Acceptance criteria for Task 2 unchanged (all 4 grep checks pass).
- **Committed in:** 990e92e (Task 2 commit)

**3. [Rule 3 - Blocking] DayDetailModal.tsx + CalendarScreen.tsx cascading latitude-prop updates**

- **Found during:** Task 3 (initial tsc check after the 4 discriminator chain edits)
- **Issue:** Plan 05 Task 3's action block enumerated 4 edits to DayDetailModal.tsx (isDone, handlePress, bgColor, textColor) but did NOT include the `getTasksForDay(plants, date)` 2-arg → 3-arg upgrade on line 63. Same issue as DayDetail. Additionally, CalendarScreen.tsx renders `<DayDetailModal>` and was not destructuring `location` from useStorage — required-prop ratchet surfaced this.
- **Fix:** DayDetailModalProps gains required latitude prop. getTasksForDay updated to 3-arg. CalendarScreen.tsx adds `location` to useStorage destructure + passes `latitude={location?.lat ?? null}` to `<DayDetailModal>`.
- **Files modified:** src/components/DayDetailModal.tsx (3 lines), src/screens/CalendarScreen.tsx (2 lines: destructure + JSX prop)
- **Verification:** `npx tsc --noEmit 2>&1 | grep -E "(DayDetailModal|CalendarScreen)"` returns 0 errors.
- **Committed in:** 4fc25c8 (Task 3 commit)

**4. [Rule 3 - Blocking] MonthCalendar.tsx + CalendarScreen.tsx + PlantsScreen.tsx cascading latitude-prop updates (final tsc handoff closure)**

- **Found during:** Task 4 (final tsc check)
- **Issue:** Plan 05 Task 4's action block enumerated only the hasWater fold edit on MonthCalendar.tsx line 65, but did NOT include the `getTasksForDay(plants, date)` 2-arg → 3-arg upgrade on line 62, the MonthCalendarProps required-latitude addition, the cascading CalendarScreen<MonthCalendar> JSX prop, OR the PlantsScreen<PlantCard> latitude prop fix that Plan 04 SUMMARY documented as Plan-05-owned. All 5 sites had to be addressed for the success_criteria's "project-wide tsc green" to hold.
- **Fix:** MonthCalendarProps gains required latitude prop. getTasksForDay updated to 3-arg. CalendarScreen.tsx <MonthCalendar> JSX passes latitude={location?.lat ?? null}. PlantsScreen.tsx <PlantCard> JSX passes latitude={location?.lat ?? null} — closes the multi-stage tsc handoff documented in Plan 03+04 SUMMARYs `affects:` fields.
- **Files modified:** src/components/MonthCalendar.tsx (3 lines), src/screens/CalendarScreen.tsx (1 line — JSX prop), src/screens/PlantsScreen.tsx (1 line — JSX prop)
- **Verification:** `npx tsc --noEmit` exits 0 (project-wide green). All Task 4 acceptance criteria pass.
- **Committed in:** cb09415 (Task 4 commit)

---

**Total deviations:** 4 auto-fixed (all Rule 3 - Blocking). All deviations were enumerated-task-instruction-vs-success-criteria gaps: Plan 05's task action blocks enumerated the new 'check_soil'-branch edits but assumed (incorrectly) that the underlying `getTasksForDay` 2-arg → 3-arg upgrade and prop-interface ratchet would happen "for free." In practice, project-wide tsc green required 4 additional edit clusters.

**Impact on plan:** Zero scope creep — every deviation closes a Plan-05-owned tsc error documented in Plan 03/04 SUMMARYs. All 4 plan tasks' acceptance criteria still pass verbatim. The lump-under-water decisions, the i18n label routing, the B4 invariant preservation — all locked exactly as the plan describes. The deviations are mechanical wiring needed to satisfy the plan's `npx tsc --noEmit exits 0 PROJECT-WIDE GREEN` success criterion.

## Issues Encountered

- **Initial tsc baseline showed 5 errors, not 4.** Plan 05's task list enumerated 4 component-level fixes (notificationScheduler+useNotifications+App.tsx; DayDetail; DayDetailModal; MonthCalendar) but the previous plan's documented handoff included 5 sites (the 4 plus PlantsScreen<PlantCard>). Resolved by treating PlantsScreen<PlantCard> as a Rule 3 (Blocking) deviation in Task 4 — closing the multi-stage tsc handoff in the same commit that finishes MonthCalendar wiring. Future planners: when a plan's success_criteria says "project-wide tsc green" and the previous plan's `affects:` field documents more error sites than the current plan's tasks enumerate, audit the baseline before starting and treat unenumerated sites as Rule 3 deviations.
- **App.tsx MVP AppContent path destructure was incomplete.** Plan 07 of Phase 4 added `location` to the AUTH AppContent path (the V1.1 codepath gated on Features.AUTH) but not to the MVP AppContent path that's actually rendered today (Features.AUTH = false in MVP). Plan 05 Edit 8 instruction anticipated this possibility ("If not, add location") — fix took 1 line. The two-AppContent-paths pattern is a v1.1-readiness decision (Phase 4) that requires both paths to be kept in sync; a future plan may merge them once V1.1 ships.

## User Setup Required

None — pure-utility refactor + consumer wiring + cascading prop updates, all entirely local. No external service configuration, no env vars, no migrations.

## Next Phase Readiness

- **Phase 5 ships 5/5 plans complete.** v1.1 hemisphere/season-helpers + pure-utility switchover is locked across 6 consumer call paths (plantLogic, plantHealth, calculateGardenHealth, wateringRecommendations, PlantCard, notificationScheduler) and 5 component callsites (DayDetail, DayDetailModal, MonthCalendar, PlantsScreen, CalendarScreen).
- **Phase 6 unblocked.** Owns dedicated visual differentiation for 'check_soil' tasks if telemetry/user research warrants — taskIconCheckSoil style, dotCheckSoil indicator color, "Te avisamos en N días" empty-state copy. The Phase 5 lump-under-water decisions (`'water' || 'check_soil'` OR-chains at 6 sites) are all naturally reversible — flip OR-chains back to two-branch and add new style/dot tokens. The lump form is a v1.1 default; Phase 6 may split.
- **Phase 7 (LOC-03 + manual climate-zone override) ready to layer.** All `latitude` parameters accept `null` and fall back to 'warm' season per LOC-03 ('never under-water by default'). Phase 7 layers manual override on top by replacing the `location?.lat ?? null` source at caller sites; Phase 5's contracts are downstream-stable.
- **Phase 8 (catalog rebalance) ready.** Consumer code is fully season-aware end-to-end. Phase 8 may add per-PlantDBEntry catalog overrides for cold-season factors; consumers will pick them up transparently via Plant.waterSchedule.{warm,cold}.
- **No new ALLOWLIST entries; no new patterns to deprecate.** `npm run check:legacy-fields` exit 0; ALLOWLIST count unchanged at 27. The v1.2 target of 0 entries is one phase closer (Phase 5 added zero legacy reads).
- **Smoke 106/106 PASS unchanged** — Plan 05 was pure consumer wiring with no new utility-level behavior to assert. The smoke runner's Phase-5 section (Plans 02+03+04) covers the season helper, plantLogic dispatch, and plantHealth gate. Phase 6 may add visual-rendering smoke if a snapshot framework is introduced (currently none).
- **B4 null-guard parity invariant preserved.** Plan 05 did not touch the scheduler's sun-window code paths; the invariant holds (callers - 1 = 2 = guards). Future plans extending the scheduler should continue to verify via the documented grep formula.

---
*Phase: 05-hemisphere-season-helpers-pure-utility-switchover*
*Completed: 2026-05-01*

## Self-Check: PASSED

- All 9 modified files exist on disk: confirmed (notificationScheduler.ts, useNotifications.ts, App.tsx, DayDetail.tsx, DayDetailModal.tsx, MonthCalendar.tsx, CalendarScreen.tsx, PlantsScreen.tsx + SUMMARY.md).
- All 4 task commits found in git log: 1da97bc (Task 1 refactor), 990e92e (Task 2 feat), 4fc25c8 (Task 3 feat), cb09415 (Task 4 feat).
- `npx tsc --noEmit` exits 0 (project-wide GREEN): confirmed.
- `npm run smoke:migration` exits 0 with 106/106 PASS (unchanged from Plan 04 baseline — pure consumer wiring): confirmed.
- `npm run check:legacy-fields` exits 0, ALLOWLIST entries unchanged at 27: confirmed.
- B4 invariant preserved: calculateSunWindow callers (3) - 1 = 2 = if (!window) return guards (2): confirmed.
- `grep -c "getWaterSeason" src/utils/notificationScheduler.ts` returns 0 (SEASON-04 satisfied transitively, not via direct import): confirmed.
- `grep -c "latitude: number | null" src/utils/notificationScheduler.ts` returns 2 (createMorningContent + scheduleMorningReminder signatures): confirmed.
- `grep -c "getTasksForDay(plants, today, latitude)" src/utils/notificationScheduler.ts` returns 1: confirmed.
- `grep -c "scheduleMorningReminder(settings.morningTime, plants, weather, latitude" src/hooks/useNotifications.ts` returns 2 (both call sites updated): confirmed.
- `grep -c "scheduleMorningReminder(morningTime, plants, null, location?.lat ?? null" App.tsx` returns 1 (post-migration reschedule trigger updated): confirmed.
- All 6 task-type-discriminator audit sites from RESEARCH §Pitfall 8 handle 'check_soil': plantLogic (Plan 03 ✓); scheduler.createMorningContent filter (Task 1 lump ✓); DayDetail 3 chains (Task 2 ✓); DayDetailModal 4 chains (Task 3 ✓); MonthCalendar getIndicators hasWater (Task 4 ✓); scheduler morning copy (Task 1 lump filter ✓).
- All 4 plan tasks' acceptance criteria verified verbatim: Task 1 (8 grep checks + B4 invariant), Task 2 (4 grep checks: case >= 2, 🤚 == 1, tasks.checkSoil == 1, task.type === 'check_soil' == 1), Task 3 (4 grep checks: task.type === 'check_soil' >= 3 → got 4, isDone reuses lastWatered == 1, handlePress routes to onWater == 1, lump form >= 2), Task 4 (3 grep checks: lump form == 1, hasCheckSoil == 0, 3 const has* decls).
- 4 Rule 3 deviations documented in §Deviations from Plan; all closed via Rule 3 (Blocking) and committed atomically with their respective task commits.
