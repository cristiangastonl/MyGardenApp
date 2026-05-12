---
phase: 20-fertilization-subsystem
plan: 03
subsystem: discriminator-sweep
tags: [fertilize, plantLogic, notificationScheduler, dayDetail, dayDetailModal, monthCalendar, calendarScreen, react-native, typescript, i18n, voseo]

# Dependency graph
requires:
  - phase: 20-fertilization-subsystem
    provides: getNextFertilizeDate real impl from Plan 20-02 (gates emit branch); FertilizeSchedule + Task 'fertilize' discriminator types + 9 i18n key pairs from Plan 20-00
  - phase: 5-hemisphere-season-helpers-pure-utility-switchover
    provides: 5-site discriminator sweep template (verbatim recipe applied here for 'fertilize')
provides:
  - getTasksForDay emit branch for fertilize tasks (gated by getNextFertilizeDate due-today)
  - notificationScheduler.createMorningContent fertilizeTasks filter + opt-in body-line gated by notifSettings?.fertilizeReminders === true
  - scheduleMorningReminder REQUIRED 5th positional arg notifSettings: NotificationSettings | null (Pitfall 2 — REQUIRED forces all callers to update at compile time)
  - DayDetail.tsx getTaskIcon + getTaskTypeLabel + taskIconFertilize style discriminator chain
  - DayDetailModal.tsx onFertilizeDone REQUIRED prop + isDone (plant.fertilizeSchedule?.lastFertilized) + handlePress + bgColor/textColor branches
  - MonthCalendar.tsx hasFertilize indicator (separate from hasWater per RESEARCH §Architecture Pattern 1) + dotFertilize style
  - 5 FERT-03.* SKIPs flipped to PASS (plantLogic.emit-branch + dayDetail.discriminator + dayDetailModal.discriminator + monthCalendar.dot-indicator + scheduler.body-filter)
  - 1 FERT-05.* SKIP flipped to PASS (scheduler.opt-in-gate)
  - dayDetail.taskFertilize i18n key in EN+ES (Fertilize / Fertilizar)
affects: [20-04, 20-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verbatim 5-site discriminator sweep template (Phase 5 Plan 05 recipe applied to 'fertilize'): plantLogic emit + notificationScheduler body-line + DayDetail/DayDetailModal/MonthCalendar UI discriminator + plantHealth defensive no-op"
    - "Pitfall 2 averted — notifSettings: NotificationSettings | null is REQUIRED (not optional ?:) — tsc forced all 3 callers to update atomically (useNotifications x2 + App.tsx x1)"
    - "Pitfall 3 averted — DayDetailModal isDone uses NESTED path plant.fertilizeSchedule?.lastFertilized (NOT the wrong plant.lastFertilized). Optional-chain handles plants without fertilizeSchedule cleanly."
    - "Plan-checker advisory honored — pre-edit grep enumeration of <DayDetailModal> JSX usage revealed sole consumer is CalendarScreen.tsx (NOT PlantsScreen/TodayScreen as plan body assumed). Plan instruction adapted: only CalendarScreen needed onFertilizeDone wiring (no-op closure for Plan 20-04 to replace)."

key-files:
  created: []
  modified:
    - src/utils/plantLogic.ts (+16 lines: getCatalogEntry import + fertilize emit branch in getTasksForDay)
    - src/utils/notificationScheduler.ts (+11 lines: notifSettings 5th arg + fertilizeTasks filter + opt-in body-line)
    - src/hooks/useNotifications.ts (~2 lines updated: 2 callers pass settings as 5th arg)
    - App.tsx (~1 line updated: post-migration caller passes null as 5th arg)
    - src/components/DayDetail.tsx (+8 lines: 3 discriminator extensions — getTaskIcon case + getTaskTypeLabel case + taskIconFertilize style branch + style declaration)
    - src/components/DayDetailModal.tsx (+11 lines: onFertilizeDone REQUIRED prop + destructure + isDone OR-clause + handlePress branch + bgColor/textColor ternary extensions)
    - src/components/MonthCalendar.tsx (+8 lines: hasFertilize getIndicators + destructure + JSX dot + Styles interface entry + dotFertilize style)
    - src/screens/CalendarScreen.tsx (+1 line: onFertilizeDone no-op closure for Plan 20-04 to replace)
    - src/i18n/locales/en/common.json (+1 line: dayDetail.taskFertilize "Fertilize")
    - src/i18n/locales/es/common.json (+1 line: dayDetail.taskFertilize "Fertilizar")

key-decisions:
  - "DayDetailModal sole consumer is CalendarScreen — pre-edit grep enumeration revealed plan-body's PlantsScreen/TodayScreen assumption was incorrect. Adapted: only CalendarScreen.tsx wired with onFertilizeDone no-op closure. Pattern reusable: ALWAYS grep-verify caller enumeration before editing REQUIRED-prop interfaces, never trust plan-body assumptions about caller sites."
  - "notifSettings ratcheted as REQUIRED 5th positional arg through scheduleMorningReminder per Pitfall 2 — tsc forced all 3 callers to update atomically (useNotifications.ts:160 + 279 pass settings; App.tsx:179 passes null). Optional would have let tsc accept missing-arg state and fertilize body would emit even when toggle OFF."
  - "App.tsx post-migration scheduler call passes literal null for notifSettings — at post-migration time the user hasn't seen Settings yet, so fertilize OFF is correct semantically. The opt-in gate notifSettings?.fertilizeReminders === true short-circuits correctly on null (no fertilize body-line emitted)."
  - "DayDetailModal isDone uses NESTED path plant.fertilizeSchedule?.lastFertilized (Pitfall 3 averted) — NOT the wrong plant.lastFertilized. Optional-chain handles plants without fertilizeSchedule (additive optional from Plan 20-00) cleanly: undefined === dateStr is always false, so isDone resolves false for fertilize-less plants."
  - "MonthCalendar hasFertilize is separate from hasWater per RESEARCH §Architecture Pattern 1 — fertilize is NOT lumped under water because lastFertilized is its own marker. Distinct dotFertilize style (colors.successBg) keeps visual indicator distinguishable from dotOutdoor (colors.green) per Open Question 5 recommendation."
  - "Task 4 verification gate yielded NO source-change commit per plan instruction — TaskButton.tsx remains generic (bgColor: string prop) and plantHealth.ts contains zero fertilize literals (CROSS.health-no-fertilize-axis preserved). Documented in this SUMMARY's Verification Results section instead of an empty commit."
  - "Color choice colors.successBg (#f0f7f0) honors CLAUDE.md design-system lock (no new color tokens) — the leaf-green-tinted background is reused for taskIconFertilize + dotFertilize + DayDetailModal fertilize bgColor. Consistent fertilize palette across DayDetail surface (icon container) + MonthCalendar (dot) + DayDetailModal (button bg)."

patterns-established:
  - "ALWAYS grep-verify caller enumeration before editing REQUIRED-prop interfaces — `grep -rn 'DayDetailModal' src/` revealed sole CalendarScreen consumer despite plan-body's PlantsScreen/TodayScreen assumption. Reusable for any plan that adds a REQUIRED prop to a shared component."
  - "5-site discriminator sweep template proven reusable — Plan 20-03 mirrors Phase 5 Plan 05 recipe verbatim for 'fertilize' (the same 5 sites: plantLogic emit + notificationScheduler body + DayDetail discriminator + DayDetailModal discriminator + MonthCalendar dot indicator). For any future task type (pruning, repotting), the same 5 sites are the touch surface."
  - "REQUIRED positional-arg ratchet pattern (Pitfall 2) — when a function gains a new parameter that downstream callers MUST pass, declare it REQUIRED (not optional ?:) and let tsc surface every caller. Optional would silently allow callers to drift, defeating the purpose of compile-time enforcement."

requirements-completed: []  # FERT-03 sweep is part of multi-plan FERT-03 closure; full closure happens after FERT-03.TaskButton.fertilize-render flips (Plan 20-04 PlantCard+FertilizeCard wiring). FERT-05 partial (opt-in gate landed; default-OFF + Settings UI ship in Plan 20-05).

# Metrics
duration: 7 min
completed: 2026-05-10
---

# Phase 20 Plan 03: FERT-03 5-Site Discriminator Sweep Summary

**Wave 2 mechanical 5-site discriminator sweep — verbatim Phase 5 Plan 05 recipe applied to `'fertilize'`. 8 files modified across 3 atomic task commits + 1 documentation-only verification gate (Task 4). 5 FERT-03 sentinels + 1 FERT-05 sentinel flipped SKIP→PASS. Cross-phase Phase 18 (56) + Phase 19 (85) regression preserved. tsc-green throughout.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-10T14:05:09Z
- **Completed:** 2026-05-10T14:12:00Z
- **Tasks:** 4 (3 source-changing + 1 verification gate)
- **Files modified:** 10 (8 source + 2 i18n)

## Accomplishments

- `plantLogic.getTasksForDay` emit branch for fertilize tasks — `getCatalogEntry(p.databaseId)` resolves catalog entry (null for custom plants), `getNextFertilizeDate` (Plan 20-02) gates emission via due-today check, `i18n.t('tasks.fertilize', { name })` provides voseo-aware label
- `notificationScheduler.createMorningContent` accepts `notifSettings: NotificationSettings | null` as 4th arg, `fertilizeTasks` filter declared, opt-in body-line emits ONLY when `notifSettings?.fertilizeReminders === true` (FERT-05 opt-in gate prepared; toggle UI lands in Plan 20-05)
- `scheduleMorningReminder` ratchets `notifSettings` as NEW REQUIRED 5th positional arg (between season and healthStatuses) — Pitfall 2 averted: REQUIRED (not optional) forced all 3 callers to update atomically (useNotifications.ts:160 + 279 + App.tsx:179)
- `DayDetail.tsx`: `getTaskIcon` + `getTaskTypeLabel` cases for `'fertilize'` (returns 🌱 + `t('dayDetail.taskFertilize')`) + `taskIconFertilize` style branch (`colors.successBg`)
- `DayDetailModal.tsx`: `onFertilizeDone: (plantId: string) => void` REQUIRED prop + destructure + 5th OR-clause to `isDone` (NESTED path `plant.fertilizeSchedule?.lastFertilized` per Pitfall 3) + `handlePress` branch + `bgColor` ternary (colors.successBg) + `textColor` ternary (colors.green)
- `MonthCalendar.tsx`: `hasFertilize` getIndicators (separate from hasWater per RESEARCH §Architecture Pattern 1) + JSX dot insertion after dotOutdoor + Styles interface entry + `dotFertilize` style declaration (`colors.successBg`)
- `CalendarScreen.tsx`: `onFertilizeDone` no-op closure passed to `<DayDetailModal>` (sole caller — verified by `grep -rn DayDetailModal`; Plan 20-04 will replace with real `fertilizePlant` action)
- `i18n` EN+ES parity: `dayDetail.taskFertilize` → "Fertilize" / "Fertilizar"
- 5 FERT-03 SKIPs + 1 FERT-05 SKIP flipped to PASS in smoke-phase20: `FERT-03.plantLogic.emit-branch` + `FERT-03.dayDetail.discriminator` + `FERT-03.dayDetailModal.discriminator` + `FERT-03.monthCalendar.dot-indicator` + `FERT-03.scheduler.body-filter` + `FERT-05.scheduler.opt-in-gate`
- Cross-phase regression preserved: smoke-phase18 PASS=56 FAIL=0, smoke-phase19 PASS=85 FAIL=0, check:i18n-keys 118 ids verified
- `plantHealth.ts` UNCHANGED (Success Criterion 5 — defensive no-op satisfied trivially); Task 4 verification confirmed zero `'fertilize'` literals (CROSS.health-no-fertilize-axis preserved)
- `TaskButton.tsx` UNCHANGED (remains generic with `bgColor: string` prop) — `FERT-03.TaskButton.fertilize-render` correctly remains SKIP (PASS-after-Plan-20-04 when PlantCard renders `<TaskButton .../>` for fertilize)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fertilize emit branch to getTasksForDay** — `7c639eb` (feat)
2. **Task 2: Thread fertilize body-line + notifSettings ratchet through scheduler** — `365662a` (feat)
3. **Task 3: Extend DayDetail + DayDetailModal + MonthCalendar with fertilize discriminator** — `e8dc618` (feat)
4. **Task 4: Verify TaskButton + plantHealth defensive no-op** — NO source change; verification documented in this SUMMARY (per plan Task 4's "skip empty commit" guidance — atomic-commit discipline preserves the principle that commits represent diffs)

**Plan metadata commit:** to be added with SUMMARY.md + STATE.md + ROADMAP.md

## Files Created/Modified

- `src/utils/plantLogic.ts` (+16 lines) — getCatalogEntry import + fertilize emit branch inside getTasksForDay forEach (after outdoor branch, before closing })
- `src/utils/notificationScheduler.ts` (+11 lines) — createMorningContent gains notifSettings 4th arg + fertilizeTasks filter + opt-in body-line; scheduleMorningReminder gains notifSettings 5th REQUIRED arg + threads through to createMorningContent call
- `src/hooks/useNotifications.ts` (~2 lines) — both scheduleMorningReminder call sites (line 160 morning effect + line 279 enableNotifications) pass settings as 5th arg
- `App.tsx` (~1 line) — post-migration scheduleMorningReminder call passes null as 5th arg (matches semantic intent: pre-Settings, fertilize OFF)
- `src/components/DayDetail.tsx` (+8 lines) — getTaskIcon + getTaskTypeLabel cases for fertilize + taskIconFertilize style branch in JSX + style declaration
- `src/components/DayDetailModal.tsx` (+11 lines) — onFertilizeDone prop + destructure + isDone OR-clause + handlePress branch + bgColor/textColor ternary extensions
- `src/components/MonthCalendar.tsx` (+8 lines) — hasFertilize getIndicators + destructure + JSX dot + Styles interface entry + dotFertilize style
- `src/screens/CalendarScreen.tsx` (+1 line) — onFertilizeDone no-op closure passed to <DayDetailModal>
- `src/i18n/locales/en/common.json` (+1 line) — dayDetail.taskFertilize "Fertilize"
- `src/i18n/locales/es/common.json` (+1 line) — dayDetail.taskFertilize "Fertilizar"

## Decisions Made

- **DayDetailModal sole consumer is CalendarScreen:** Pre-edit grep enumeration (`grep -rn 'DayDetailModal' src/`) revealed the plan-body's PlantsScreen/TodayScreen assumption was incorrect — those screens do NOT render <DayDetailModal>. Adapted by adding `onFertilizeDone` no-op closure ONLY to CalendarScreen.tsx. Pattern: ALWAYS grep-verify caller enumeration before editing REQUIRED-prop interfaces, never trust plan-body assumptions about caller sites.
- **notifSettings ratcheted as REQUIRED:** Per Pitfall 2 (RESEARCH lines 715-720), `notifSettings: NotificationSettings | null` is REQUIRED (not optional `?:`). Optional would have let tsc accept the missing-arg state and fertilize body would emit even when toggle OFF. REQUIRED forced all 3 callers to update atomically.
- **App.tsx post-migration passes null:** At post-migration time the user hasn't seen Settings yet — fertilize OFF is correct semantically. The opt-in gate `notifSettings?.fertilizeReminders === true` short-circuits correctly on null (no fertilize body-line emitted).
- **DayDetailModal isDone uses NESTED path:** `plant.fertilizeSchedule?.lastFertilized === dateStr` (Pitfall 3 averted) — NOT the wrong `plant.lastFertilized`. Optional-chain handles plants without fertilizeSchedule (additive optional from Plan 20-00) cleanly: undefined === dateStr is always false, so isDone resolves false for fertilize-less plants.
- **MonthCalendar hasFertilize is separate from hasWater:** Per RESEARCH §Architecture Pattern 1 — fertilize is NOT lumped under water because lastFertilized is its own marker. Distinct dotFertilize style (colors.successBg) keeps visual indicator distinguishable from dotOutdoor (colors.green). Honors CLAUDE.md design-system lock (no new color tokens).
- **Task 4 documented, not committed:** TaskButton.tsx remains generic + plantHealth.ts contains zero fertilize literals (CROSS.health-no-fertilize-axis preserved) — both are PRESERVATION assertions, not edits. Atomic-commit discipline preserves the principle that commits represent diffs; verification gate captured in this SUMMARY's Verification Results section.
- **Color choice colors.successBg (#f0f7f0):** Reused across taskIconFertilize + dotFertilize + DayDetailModal fertilize bgColor for consistent fertilize palette. Honors CLAUDE.md design-system lock — no new color tokens introduced.

## Deviations from Plan

### Plan-body assumption corrected (Plan-checker advisory MINOR honored)

**1. [Rule 1 - Bug-prevention] DayDetailModal caller enumeration via grep**
- **Found during:** Pre-Task 3 read pass + plan-checker advisory
- **Issue:** Plan body (Task 3 Edit 2) instructed "In `src/screens/TodayScreen.tsx` and `src/screens/PlantsScreen.tsx`, find the `<DayDetailModal>` element". Pre-edit grep `grep -rn 'DayDetailModal' src/` revealed sole consumer is `CalendarScreen.tsx:254` — those two assumed screens do NOT render it.
- **Fix:** Wired `onFertilizeDone` no-op closure into CalendarScreen.tsx only. tsc green confirms no other consumer exists.
- **Files modified:** src/screens/CalendarScreen.tsx (+1 line) instead of src/screens/{TodayScreen,PlantsScreen}.tsx
- **Commit:** e8dc618 (Task 3)

### No-op tasks intentionally not committed

**2. [Rule 4-equivalent — explicit plan instruction] Task 4 verification gate yields NO commit**
- **Found during:** Task 4 execution
- **Issue:** Task 4 is a "no-source-change verification gate" per plan instructions; the smoke runner already enforces both invariants permanently (CROSS.health-no-fertilize-axis + FERT-03.TaskButton.fertilize-render SKIP).
- **Fix:** Captured verification result inline in this SUMMARY (TaskButton remains generic with `bgColor: string`; plantHealth.ts has 0 fertilize literals). Per plan Task 4 explicit instruction: "If atomic-commit-per-task discipline objects to a no-source-change commit, skip this task entirely and treat the verification as a verify gate of Task 3."
- **Files modified:** None
- **Commit:** None (intentional)

## Issues Encountered

None. All 3 source-changing tasks ran first-try without incident, no auto-fixes, no architectural escalations, no blocking issues.

- Task 1: tsc-green on first run; both grep regex patterns matched on first run; smoke moved PASS=33 → 34, SKIP=16 → 15 (FERT-03.plantLogic.emit-branch flipped)
- Task 2: tsc-green on first run; all 4 grep regex patterns matched on first run (fertilizeTasks filter, opt-in gate, useNotifications callers, App.tsx caller); smoke moved PASS=34 → 36, SKIP=15 → 13 (+2: scheduler.body-filter + opt-in-gate)
- Task 3: tsc-green on first run; all 6 grep regex patterns matched (DayDetail case, DayDetailModal disc, hasFertilize, dotFertilize, EN i18n, ES i18n); smoke moved PASS=36 → 39, SKIP=13 → 10 (+3: dayDetail.discriminator + dayDetailModal.discriminator + monthCalendar.dot-indicator)
- Cross-phase: smoke-phase18 PASS=56, smoke-phase19 PASS=85 throughout (zero regression)
- check:i18n-keys: 118 ids verified across en/es plants.json (i18n parity preserved despite dayDetail namespace edit)

## Verification Results (Final)

All gates green:
- `npx tsc --noEmit` → exit 0
- `node scripts/smoke-phase20.cjs` → PASS=39 FAIL=0 SKIP=10, exit 0
  - 5 FERT-03 sentinels flipped SKIP→PASS: plantLogic.emit-branch, dayDetail.discriminator, dayDetailModal.discriminator, monthCalendar.dot-indicator, scheduler.body-filter
  - 1 FERT-05 sentinel flipped SKIP→PASS: scheduler.opt-in-gate
  - Remaining 10 SKIPs intentional (FERT-02 catalog content, FERT-03.TaskButton awaits Plan 20-04, FERT-05 default-OFF + settings UI await Plan 20-05, FERT-06 PlantCard + modal + FertilizeCard await Plan 20-04, FERT-07 i18n parity check script await Plan 20-08)
- `npm run smoke:phase18` → PASS=56 FAIL=0 SKIP=0
- `npm run smoke:phase19` → PASS=85 FAIL=0 SKIP=0
- `npm run check:i18n-keys` → PASS — 118 catalog ids verified across en/es plants.json
- `grep -c "scheduleMorningReminder" App.tsx src/hooks/useNotifications.ts` → 2 + 3 = 5 (App.tsx: 1 import + 1 call; useNotifications: 1 import + 2 calls — exceeds verification floor of ≥3)
- `grep -c "'fertilize'" src/utils/plantHealth.ts` → 0 (CROSS.health-no-fertilize-axis preserved; Success Criterion 5 satisfied trivially)
- `grep -c '"fertilize"' src/utils/plantHealth.ts` → 0
- `grep -qE "bgColor: string" src/components/TaskButton.tsx` → match (TaskButton remains generic — no Phase 18 regression)

## Self-Check: PASSED

Verified files:
- FOUND: src/utils/plantLogic.ts (modifications: +16 lines — getCatalogEntry import + fertilize emit branch)
- FOUND: src/utils/notificationScheduler.ts (modifications: +11 lines — notifSettings 5th arg + fertilizeTasks filter + opt-in body-line)
- FOUND: src/hooks/useNotifications.ts (modifications: 2 caller sites updated)
- FOUND: App.tsx (modification: 1 caller site updated)
- FOUND: src/components/DayDetail.tsx (modifications: +8 lines)
- FOUND: src/components/DayDetailModal.tsx (modifications: +11 lines)
- FOUND: src/components/MonthCalendar.tsx (modifications: +8 lines)
- FOUND: src/screens/CalendarScreen.tsx (modification: +1 line)
- FOUND: src/i18n/locales/en/common.json (modification: +1 line)
- FOUND: src/i18n/locales/es/common.json (modification: +1 line)

Verified commits:
- FOUND: 7c639eb (Task 1 — fertilize emit branch in getTasksForDay)
- FOUND: 365662a (Task 2 — fertilize body-line + notifSettings ratchet through scheduler + 3 callers)
- FOUND: e8dc618 (Task 3 — DayDetail + DayDetailModal + MonthCalendar discriminator extensions + CalendarScreen wiring + EN+ES i18n)

## Next Phase Readiness

**Plan 20-04 ready (Wave 2 PlantCard + FertilizeCard implementation):** 5-site discriminator sweep complete. Plan 20-04 will:
- Fill the FertilizeCard skeleton body with Reanimated v4 collapse + tap-to-expand + recipe rendering (flips 4 FERT-06 SKIPs)
- Add fertilize task indicator to PlantCard mode='tasks' branch (flips FERT-06.PlantCard.fertilize-task-row)
- Replace CalendarScreen's onFertilizeDone no-op closure with real fertilizePlant action via useStorage
- Render <TaskButton ... label="Fertilize" .../> via PlantCard task row (flips FERT-03.TaskButton.fertilize-render — last FERT-03 SKIP)

**Plan 20-05 ready (FERT-05 Settings toggle + default-OFF):** opt-in gate already lands at scheduler. Plan 20-05 ships the SettingsScreen Switch UI + DEFAULT_SETTINGS extension (`fertilizeReminders: false`) — flips remaining 2 FERT-05 SKIPs.

**No blockers.** Cross-phase regression preserved. Smoke runner authored once at Plan 20-00 — never edited.

---
*Phase: 20-fertilization-subsystem*
*Completed: 2026-05-10*
