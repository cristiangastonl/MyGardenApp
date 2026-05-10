---
phase: 20-fertilization-subsystem
plan: 05
subsystem: settings-toggle
tags: [fertilize, settings, notifications, react-native, typescript, i18n, voseo, FERT-05]

# Dependency graph
requires:
  - phase: 20-fertilization-subsystem
    provides: notifSettings 5th positional arg ratchet through scheduleMorningReminder + opt-in body-line gated by notifSettings?.fertilizeReminders === true (Plan 20-03); 9 i18n key pairs + NotificationSettings.fertilizeReminders?: boolean type extension (Plan 20-00)
provides:
  - DEFAULT_SETTINGS extension in src/hooks/useNotifications.ts with fertilizeReminders: false (locks default OFF)
  - SettingsScreen Switch row for fertilizeReminders inside notifSettings.enabled gate (between careReminders Switch and testButton)
  - 2 FERT-05 SKIPs flipped to PASS — FERT-05.useNotifications.default-OFF + FERT-05.settings.toggle-rendered
  - FERT-05 closure (toggle UI + opt-in gate from Plan 20-03 + default-OFF lock)
affects: [20-06, 20-07, 20-08, 20-09, 20-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verbatim Switch-row mirror — careReminders structure replicated for fertilizeReminders with only 3 swaps: icon (💧 → 🌱), title key, subtitle key, value/onValueChange field name. Lowest-novelty pattern: reusing existing settingRow + settingInfo + settingIcon + settingText + Switch component composition without introducing new theme tokens or layout primitives."
    - "Default-OFF lock at literal level — `fertilizeReminders: false` lands in DEFAULT_SETTINGS object literal (not a runtime gate). Combined with the optional `?:` field on the NotificationSettings interface from Plan 20-00, this means existing users upgrading also default to OFF (because absence === false in the gate `notifSettings?.fertilizeReminders === true` from Plan 20-03)."
    - "Atomic Switch UI ↔ default-OFF semantic pairing — Task 1 ships the storage default; Task 2 ships the UI affordance. Either alone would have a hidden state (default ON without toggle = surprise notifications; toggle without default = user-must-toggle-first which is also surprising). The pair forms a complete opt-in surface."

key-files:
  created:
    - .planning/phases/20-fertilization-subsystem/20-05-SUMMARY.md
  modified:
    - src/hooks/useNotifications.ts (+2 lines: JSDoc comment + `fertilizeReminders: false` on DEFAULT_SETTINGS)
    - src/screens/SettingsScreen.tsx (+16 lines: Switch row block — 14 visible content lines + 2 surrounding blank lines for spacing)

key-decisions:
  - "Verbatim Switch-row mirror chosen over any abstraction — the careReminders Switch row at lines 322-336 was the exact template. Three-line edit: change icon (💧 → 🌱), change i18n key namespace suffix (careReminders → fertilizeReminders), change Switch field name. No helper extraction, no new layout component, no new prop signature. Adheres to lowest-novelty principle."
  - "Insertion site between careReminders and testButton (NOT before careReminders) — preserves visual reading order: 'water-style reminders → fertilize-style reminders → test'. Mirrors the conceptual ordering established in Plan 20-03 for notification body-lines (water-related tasks before fertilize)."
  - "Icon 🌱 chosen for parity with existing fertilize sites — matches DayDetail.getTaskIcon (Plan 20-03) and the fertilize palette established at colors.successBg. Future Plan 20-04 PlantCard TaskButton will use the same icon."
  - "Color choices reused from careReminders verbatim (colors.border / colors.green / colors.white track+thumb) — honors CLAUDE.md design-system lock; no new color tokens introduced."

patterns-established:
  - "Settings Switch row template: when adding a global notification toggle, mirror the most-recently-added Switch row verbatim with only icon + i18n key + Switch-field swaps. Never invent new layout."
  - "Default-OFF lock pairing: optional-typed runtime field (Plan 20-00) + literal-default-false in DEFAULT_SETTINGS (this plan) + UI Switch (this plan) + opt-in gate `=== true` (Plan 20-03) form a 4-piece complete opt-in chain. Each piece must land for the chain to be safe; missing any creates a hidden default-ON state."
  - "Plan-scope discipline under parallel execution: when a sibling plan (20-04) is in-flight modifying file-disjoint surfaces, its uncommitted working-tree state may surface tsc errors that are NOT caused by this plan. Verification: stash the dirty working tree → run tsc on HEAD → restore. This isolates the current plan's tsc-green state from sibling-plan transients."

requirements-completed: [FERT-05]

# Metrics
duration: 3min
completed: 2026-05-10
---

# Phase 20 Plan 05: FERT-05 Settings Toggle + Default-OFF Lock Summary

**Wave 3 settings UI for FERT-05 — 2 atomic task commits, 2 files modified (+18 lines total). DEFAULT_SETTINGS literal locks `fertilizeReminders: false`; SettingsScreen renders verbatim-mirror Switch row inside the existing Notifications section. Closes FERT-05: opt-in gate (Plan 20-03) + default-OFF lock (Task 1) + toggle UI (Task 2) all in place. 2 FERT-05 SKIPs flipped to PASS. Cross-phase Phase 18 (PASS=56) + Phase 19 (PASS=85) regression preserved. tsc-green on isolated HEAD (Plan 20-04 in-flight working-tree state out of scope).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-10T14:25:08Z
- **Completed:** 2026-05-10T14:32:00Z
- **Tasks:** 2 (both source-changing, both committed atomically)
- **Files modified:** 2 (+18 lines net)

## Accomplishments

- `src/hooks/useNotifications.ts` DEFAULT_SETTINGS extension: `fertilizeReminders: false` appended as last property with JSDoc comment documenting the v1.2 Phase 20 FERT-05 lock and rationale (avoids notification fatigue with 4th task type alongside water/sun/outdoor).
- `src/screens/SettingsScreen.tsx` new Switch row inserted between the existing careReminders Switch and the testButton, INSIDE the same `notifSettings.enabled && (...)` conditional block. Structure verbatim-mirrors careReminders: settingRow + settingInfo + settingIcon (🌱) + settingText (title + subtitle) + Switch with green track.
- i18n keys consumed (no new keys added — Plan 20-00 already shipped EN+ES voseo parity for `settings.fertilizeReminders` "Fertilize reminders" / "Recordatorios de fertilización" and `settings.fertilizeRemindersSubtitle` "Get notified when plants need fertilizing" / "Te avisamos cuándo abonar tus plantas").
- Toggle ON wires the fertilize body-line into the morning reminder via the existing `scheduleMorningReminder` caller chain (Plan 20-03 already plumbed `notifSettings` as REQUIRED 5th positional arg + opt-in gate `notifSettings?.fertilizeReminders === true` in `notificationScheduler.createMorningContent`).
- Toggle defaults OFF on first install (DEFAULT_SETTINGS literal lock) AND on every existing user upgrade (because absence === false in the runtime gate, and existing AsyncStorage payloads predate the field).
- 2 FERT-05 SKIPs flipped SKIP→PASS in smoke-phase20: `FERT-05.useNotifications.default-OFF` + `FERT-05.settings.toggle-rendered`.
- FERT-05 requirement closes (UI + default + opt-in gate all in place; the only remaining FERT-05 surface is Plan 20-03's `scheduler.opt-in-gate` which already PASSes).
- Cross-phase regression preserved: smoke-phase18 PASS=56 / smoke-phase19 PASS=85 / check:i18n-keys 118 catalog ids verified.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend DEFAULT_SETTINGS with fertilizeReminders: false** — `c0eade4` (feat)
2. **Task 2: Add fertilize reminders Switch row to SettingsScreen** — `8a98548` (feat)

**Plan metadata commit:** to be added with SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md

## Files Created/Modified

- `src/hooks/useNotifications.ts` (+2 lines) — JSDoc comment + `fertilizeReminders: false` appended to DEFAULT_SETTINGS literal
- `src/screens/SettingsScreen.tsx` (+16 lines) — new Switch row block inserted between careReminders Switch and testButton inside the `notifSettings.enabled` conditional
- `.planning/phases/20-fertilization-subsystem/20-05-SUMMARY.md` (NEW) — this file

## Decisions Made

- **Verbatim Switch-row mirror:** The careReminders row at lines 322-336 was the exact template — only 3 surface-level swaps: icon (💧 → 🌱), i18n key namespace suffix, and Switch field name. No new layout primitive, no helper component extraction, no new theme token. Lowest-novelty pattern.
- **Insertion ordering:** Between careReminders and testButton (NOT before careReminders) — preserves the conceptual reading order water-related → fertilize-related → test. Mirrors Plan 20-03's notification body-line ordering.
- **Icon 🌱 chosen for fertilize-site parity:** Matches DayDetail.getTaskIcon for `'fertilize'` (Plan 20-03), MonthCalendar dot label semantics, and future Plan 20-04 PlantCard TaskButton. Establishes a consistent fertilize visual identity across all surfaces.
- **No new theme tokens:** colors.border / colors.green / colors.white reused verbatim from careReminders. CLAUDE.md design-system lock honored.
- **Default-OFF lock at literal level:** `fertilizeReminders: false` ships in DEFAULT_SETTINGS (not a runtime gate). Combined with optional `?:` field on NotificationSettings interface from Plan 20-00, this gives upgraded users default-OFF too (absence === false in `=== true` gate).
- **No optional-chain on Switch value:** `value={!!notifSettings.fertilizeReminders}` mirrors careReminders verbatim. The double-bang coerces undefined → false (defensive against pre-Plan-20-00 AsyncStorage payloads), matching the existing careReminders pattern that handles the same edge.

## Deviations from Plan

### Working-tree state flagged but NOT auto-fixed (sibling plan in-flight)

**1. [Rule SCOPE-BOUNDARY — out-of-scope discovery] Plan 20-04 in-flight uncommitted edits surfaced a tsc error**
- **Found during:** Final verification suite run after Task 2 commit
- **Issue:** `npx tsc --noEmit` reported `TS2322: Property 'fertilizePlant' is missing in type '...' but required in type 'StorageActions'.` at `src/hooks/useStorage.tsx:745`. This is caused by Plan 20-04's in-flight uncommitted modifications to `src/hooks/useStorage.tsx` (StorageActions interface declares `fertilizePlant` as required, but the implementation object literal does not yet contain the impl — Plan 20-04 is mid-flight per the execution_note).
- **Why NOT auto-fixed:** Per execute-phase deviation rule SCOPE BOUNDARY: "Only auto-fix issues DIRECTLY caused by the current task's changes." This plan does not touch `useStorage.tsx`. Plan 20-04 is parallel and file-disjoint per the execution_note. The tsc error is owned by Plan 20-04's mid-flight state, not this plan.
- **Verification of isolation:** `git stash --include-untracked` (sets aside Plan 20-04's working-tree edits) → `npx tsc --noEmit` exits 0 → `git stash pop` restores Plan 20-04's state. tsc is green on HEAD with only this plan's commits (c0eade4 + 8a98548).
- **Files modified by this plan:** Both this plan's files (useNotifications.ts, SettingsScreen.tsx) are tsc-green in isolation.
- **Commit:** None (out-of-scope; Plan 20-04 will resolve when its impl tasks land)

### No other deviations

Plan executed exactly as written for the 2 in-scope tasks. No auto-fixes (Rules 1-3) needed. No architectural escalations (Rule 4). No blocking issues. No checkpoints in this plan (autonomous: true).

## Issues Encountered

None within plan scope. Both tasks ran first-try without incident:

- Task 1: tsc-green on first run; grep regex `/fertilizeReminders:\s*false/` matched on first run; smoke-phase20 moved PASS=39 → 40, SKIP=10 → 9 (FERT-05.useNotifications.default-OFF flipped).
- Task 2: tsc-green on first run; all 3 grep regex patterns matched on first run (settings.fertilizeReminders + updateSettings({ fertilizeReminders: value }) + settings.fertilizeRemindersSubtitle); smoke-phase20 moved PASS=40 → 41, SKIP=9 → 8 (FERT-05.settings.toggle-rendered flipped); cross-phase smoke18 (56) + smoke19 (85) preserved.

The Plan 20-04 in-flight tsc surface (documented in Deviations §1) was triaged as out-of-scope, not an issue with this plan's edits.

## Verification Results (Final)

All in-scope gates green:

- `npx tsc --noEmit` (HEAD with only Plan 20-05 commits, sibling working-tree set aside) → exit 0 — confirmed via stash isolation
- `node scripts/smoke-phase20.cjs` (working tree includes sibling Plan 20-04 in-flight) → `[Phase 20 smoke] PASS=43 FAIL=0 SKIP=6` — Plan 20-05 contributed +2 PASSes (41 from this plan; 43 reflects Plan 20-04's working-tree contribution which is out of scope here)
- `node scripts/smoke-phase20.cjs` (post-Plan-20-05 only, before Plan 20-04 dirty state) → `[Phase 20 smoke] PASS=41 FAIL=0 SKIP=8` (recorded mid-execution after Task 2 commit before Plan 20-04 working-tree state was observed)
- `npm run smoke:phase18` → `[Phase 18 smoke] PASS=56 FAIL=0 SKIP=0` (preserved)
- `npm run smoke:phase19` → `[Phase 19 smoke] PASS=85 FAIL=0 SKIP=0` (preserved)
- `npm run check:i18n-keys` → `PASS — 118 catalog ids verified across en/es plants.json`
- Plan-scope greps verified inline during Task 2 verification:
  - `grep -qE "fertilizeReminders:\s*false" src/hooks/useNotifications.ts` → match
  - `grep -qE "settings\.fertilizeReminders" src/screens/SettingsScreen.tsx` → match
  - `grep -qE "updateSettings\(\{ fertilizeReminders: value \}\)" src/screens/SettingsScreen.tsx` → match
  - `grep -qE "settings\.fertilizeRemindersSubtitle" src/screens/SettingsScreen.tsx` → match

## Self-Check: PASSED

Verified files:
- FOUND: src/hooks/useNotifications.ts (modification: +2 lines — JSDoc + fertilizeReminders: false)
- FOUND: src/screens/SettingsScreen.tsx (modification: +16 lines — new Switch row block)
- FOUND: .planning/phases/20-fertilization-subsystem/20-05-SUMMARY.md

Verified commits:
- FOUND: c0eade4 (Task 1 — DEFAULT_SETTINGS extension with fertilizeReminders: false)
- FOUND: 8a98548 (Task 2 — fertilize reminders Switch row in SettingsScreen)

## Next Phase Readiness

**Plan 20-04 ready (parallel — sibling working-tree edits already in-flight):** Once Plan 20-04 commits its `fertilizePlant` impl, tsc returns to green for the full working tree. Plan 20-05's edits stand independently and require no rework.

**Plan 20-06 ready (Wave 4a interior catalog content):** All Wave 3 settings + UI surfaces complete. Plan 20-06 begins the FERT-07 catalog-content authoring work for Wave A interior tropicales.

**FERT-05 closes:** With this plan, FERT-05 (settings opt-in toggle + default-OFF) is complete. The 4-piece opt-in chain is:
1. `NotificationSettings.fertilizeReminders?: boolean` type field (Plan 20-00)
2. `notifSettings?.fertilizeReminders === true` opt-in gate in scheduler body-line (Plan 20-03)
3. `fertilizeReminders: false` literal default in DEFAULT_SETTINGS (Task 1 / this plan)
4. SettingsScreen Switch row UI affordance (Task 2 / this plan)

**No blockers.** Cross-phase Phase 18 + Phase 19 regression preserved.

---
*Phase: 20-fertilization-subsystem*
*Completed: 2026-05-10*
