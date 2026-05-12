---
phase: 22-gamification-toasts-haptics
plan: 00
subsystem: testing
tags: [smoke-runner, gamification, toasts, haptics, i18n, cross-phase-regression, nyquist-validation]

# Dependency graph
requires:
  - phase: 21-plant-journal
    provides: scripts/smoke-phase21.cjs (fork source — 3-tier sentinel pattern, harness helpers, cross-phase regression idiom)
  - phase: 18-plantcard-redesign
    provides: <Toast> primitive + Phase 18 cross-phase regression sentinel set
  - phase: 13-gesture-bottom-sheet-infrastructure
    provides: src/utils/haptics.ts triggerHaptic('success') utility (ready for use in Plan 22-01)
provides:
  - "scripts/smoke-phase22.cjs three-tier smoke runner (frozen after Wave 0)"
  - "npm run smoke:phase22 wired in package.json"
  - "gamification.toastSuccess i18n key in EN ('You're on it! 🌱') and ES voseo ('¡Vas bien! 🌱')"
  - "GAM-05 STRICT negative-grep block (NEVER SKIP) with CARE_STREAKS + gam_anti_patterns.md whitelist"
  - "Cross-phase regression sentinels preserving Phase 18 + 19 + 20 + 21 invariants verbatim"
  - "26 SKIP-to-PASS placeholders for GAM-01 (Toast wiring + setOnTaskCompleted plumbing) and GAM-02 (4-action haptic+callback) — flip as Plans 22-01/02 land"
affects: [22-01, 22-02, 22-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-tier smoke runner pattern (PASS scaffold + SKIP→PASS placeholders + STRICT cross-phase regression) — fourth consecutive Wave 0 plan to ship this idiom (precedent: 14-00 / 19-00 / 20-00 / 21-00)"
    - "STRICT negative-grep with line-level whitelist (CARE_STREAKS + gam_anti_patterns.md) — encodes GAM-05 anti-pattern lock as compile-time gate, not just policy"
    - "Cross-phase regression growth: each new phase's Wave 0 inherits ALL prior phase sentinels verbatim (Phase 22 = 22 STRICT cross-phase asserts spanning Phases 18-21)"

key-files:
  created:
    - "scripts/smoke-phase22.cjs (291 lines — three-tier runner)"
    - ".planning/phases/22-gamification-toasts-haptics/22-00-SUMMARY.md"
  modified:
    - "package.json (added smoke:phase22 npm script)"
    - ".gitignore (added scripts/.tmp-phase22/ ignore line)"
    - "src/i18n/locales/en/common.json (added gamification.toastSuccess)"
    - "src/i18n/locales/es/common.json (added gamification.toastSuccess voseo)"

key-decisions:
  - "Forked scripts/smoke-phase21.cjs structure verbatim (assert/assertSkippable/readSafe/getNested helpers preserved). All Phase 21 JOURNAL-* logic replaced with Phase 22 GAM-* logic; cross-phase regression block extended with Phase 21 sentinels."
  - "GAM-05 negative-grep is STRICT (NEVER SKIP) — runs at W0 baseline and beyond. Whitelist absorbs the lone existing streak token (src/config/features.ts:31 'CARE_STREAKS: false') and code-comment references to gam_anti_patterns.md memory file."
  - "Single-message Toast copy locked: EN 'You're on it! 🌱' / ES voseo '¡Vas bien! 🌱'. No per-task variants; matches GAM-01 wording verbatim from RESEARCH.md."
  - "Runner is FROZEN after this plan — Plans 22-01/02 flip SKIPs to PASSes by landing concrete code/JSX/data, never by editing the runner (Phase 14-00 / 19-00 / 20-00 / 21-00 precedent)."

patterns-established:
  - "Three coexisting Toasts per screen: Phase 18 swipe-undo + Phase 21 journal-saved + Phase 22 task-done. Independent state, independent durations, mount-order layering."
  - "useStorage as single source of truth for cross-cutting side effects (haptic + Toast callback) — mirrors Phase 21 fertilizePlant extension pattern."

requirements-completed: [GAM-01, GAM-02, GAM-05]  # Scaffold for these requirement IDs; full implementation in Plans 22-01/02. Wave 0 lands the validation contract.

# Metrics
duration: 3min
completed: 2026-05-12
---

# Phase 22 Plan 00: Gamification Wave 0 Scaffold Summary

**Three-tier smoke runner (scripts/smoke-phase22.cjs, 291 lines) + npm script + .gitignore + gamification.toastSuccess i18n key (EN + ES voseo) — locks the Phase 22 validation contract with GAM-05 STRICT negative-grep (whitelist for CARE_STREAKS + gam_anti_patterns.md) and 22-assert cross-phase regression spanning Phases 18 → 21.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-12T01:04:12Z
- **Completed:** 2026-05-12T01:07:04Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 edited)

## Accomplishments

- Smoke runner scripts/smoke-phase22.cjs shipped (291 lines, CommonJS, three-tier sentinel pattern verbatim-forked from scripts/smoke-phase21.cjs harness)
- npm script `smoke:phase22` wired in package.json adjacent to `smoke:phase21` entry
- .gitignore extended with `scripts/.tmp-phase22/` for precautionary parity with prior phases (no transpileModule stubs planned)
- i18n gamification namespace landed in both EN (`"You're on it! 🌱"`) and ES voseo (`"¡Vas bien! 🌱"`) — exact-literal matches verified by smoke sentinels
- GAM-05 STRICT negative-grep block walks src/ recursively for `streak|consecutiveDays|dayCount|currentStreak|bestStreak|streakReset` tokens and FAILs unless the line is whitelisted by CARE_STREAKS or gam_anti_patterns.md — at W0 baseline returns 0 violations (single false-positive at src/config/features.ts:31 absorbed by CARE_STREAKS whitelist)
- Cross-phase regression coverage extended: Phase 18 (5 asserts) + Phase 19 (4 asserts) + Phase 20 (4 asserts) + Phase 21 (9 asserts) = 22 STRICT cross-phase asserts, all PASS at baseline
- Baseline metrics: **PASS=30 FAIL=0 SKIP=26**, exit code 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/smoke-phase22.cjs (fork from smoke-phase21.cjs)** — `b12d4f5` (feat)
2. **Task 2: Wire npm script, .gitignore, and i18n skeleton** — `1098aaa` (feat)

**Plan metadata:** _(pending docs commit after STATE/ROADMAP/REQUIREMENTS update)_

## Files Created/Modified

- `scripts/smoke-phase22.cjs` — Phase 22 three-tier smoke runner (291 lines): TIER 1 (7 W0 scaffold STRICT asserts) + TIER 2 (26 SKIP-to-PASS placeholders for GAM-01/02 + GAM-05 anti-pattern-comment-x4 marker + GAM-05 STRICT negative-grep) + TIER 3 (22 STRICT cross-phase regression sentinels for Phases 18-21)
- `package.json` — added `"smoke:phase22": "node scripts/smoke-phase22.cjs"` after the existing `smoke:phase21` entry
- `.gitignore` — added `scripts/.tmp-phase22/` after `scripts/.tmp-phase21/`
- `src/i18n/locales/en/common.json` — added `gamification` top-level namespace with `toastSuccess: "You're on it! 🌱"` before the existing `journal` namespace
- `src/i18n/locales/es/common.json` — added `gamification` top-level namespace with `toastSuccess: "¡Vas bien! 🌱"` (voseo) before the existing `journal` namespace

## Decisions Made

- **Forked Phase 21 runner verbatim:** preserved assert/assertSkippable/readSafe/getNested helpers untouched; only the per-phase content body changed. This is the fourth consecutive Wave 0 plan to ship this three-tier idiom (precedent: 14-00 / 19-00 / 20-00 / 21-00).
- **GAM-05 negative-grep is STRICT (not SKIPpable):** runs unconditionally at W0 baseline. The lone existing streak token (src/config/features.ts:31 `CARE_STREAKS: false`) is absorbed by the `CARE_STREAKS|gam_anti_patterns\.md` whitelist regex applied per line. Comments referencing the anti-pattern memory file are explicitly allowed so Plan 22-01 can include `// See .../memory/gam_anti_patterns.md` annotations inline.
- **Single-message Toast copy:** EN `"You're on it! 🌱"` / ES voseo `"¡Vas bien! 🌱"` — no per-task variants. Matches GAM-01 wording verbatim from 22-RESEARCH.md.
- **Runner FROZEN after Wave 0:** Plans 22-01/02 will flip the 26 SKIPs to PASSes by landing concrete code (useStorage actions, screen state, JSX), never by editing the runner. The runner's contract is locked.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 22-01 (Wave 1):** Wire the `triggerHaptic('success')` call + `onTaskCompletedRef.current?.()` invocation inside the 4 useStorage task-done actions (`waterPlant`, `sunPlant`, `outdoorPlant`, `fertilizePlant`), add `setOnTaskCompleted` action to the StorageContext interface, add the 4 `// GAM-05 lock` anti-pattern comments. Smoke SKIPs that will flip to PASS:
  - GAM-02.useStorage.{waterPlant,sunPlant,outdoorPlant}-action (3)
  - GAM-02.useStorage.{waterPlant,sunPlant,outdoorPlant,fertilizePlant}.triggerHaptic-success (4)
  - GAM-02.useStorage.triggerHaptic-import (1)
  - GAM-01.useStorage.setOnTaskCompleted-in-interface (1)
  - GAM-01.useStorage.setOnTaskCompleted-implementation (1)
  - GAM-01.useStorage.onTaskCompletedRef-useRef (1)
  - GAM-01.useStorage.{waterPlant,sunPlant,outdoorPlant,fertilizePlant}.onTaskCompleted-call (4)
  - GAM-05.useStorage.anti-pattern-comment-x4 (1)
  - Total: 16 SKIPs → PASS

- **Plan 22-02 (Wave 2):** Add `gamificationToastVisible` state + `<Toast>` sibling + `useEffect` callback registration to all three screens (PlantsScreen + TodayScreen + CalendarScreen); migrate handlers in TodayScreen + CalendarScreen to call useStorage actions directly. Smoke SKIPs that will flip to PASS:
  - GAM-01.{PlantsScreen,TodayScreen,CalendarScreen}.gamificationToastVisible-state (3)
  - GAM-01.Toast.vas-bien-wired-3-screens (1)
  - GAM-01.Toast.durationMs-2000-3-screens (1)
  - GAM-01.{PlantsScreen,TodayScreen,CalendarScreen}.useEffect-registers-callback (3)
  - GAM-02.{TodayScreen,CalendarScreen}.handlers-migrated-to-actions (2)
  - Total: 10 SKIPs → PASS

- **Plan 22-03 (Wave 3):** Manual device-test gate (or Option B deferral to v1.2 milestone-end batch per established Phase 18-05 / 19-07 / 20-10 / 21-06 precedent).

- **Cross-phase regression coverage locked:** Phase 22 smoke runner asserts 22 STRICT cross-phase invariants (Phase 18 PlantCard 5-element layout + mood emoji + PlantHealthBadge + Gesture.Pan + Toast primitive; Phase 19 TOX-03 pet toxicity badges + TOX-04 Mascotas section + initialSection + TOX-06 check-i18n-keys symptoms extension; Phase 20 FERT-03 5-site discriminator + FERT-06 FertilizeCard + FERT-07 fertilizer industrial/homemade i18n extension; Phase 21 JOURNAL-01 types.journals + JOURNAL-02 service file + JOURNAL-04 ModalSectionId.diario + JournalSection-rendered + journalToastVisible in BOTH PlantsScreen + TodayScreen + JOURNAL-05 no-premium-gate across all 3 journal components). Any regression in any of these surfaces fails the Phase 22 gate.

---
*Phase: 22-gamification-toasts-haptics*
*Completed: 2026-05-12*

## Self-Check: PASSED

- scripts/smoke-phase22.cjs — FOUND on disk
- .planning/phases/22-gamification-toasts-haptics/22-00-SUMMARY.md — FOUND on disk
- Commit b12d4f5 (Task 1: smoke runner) — FOUND in git log
- Commit 1098aaa (Task 2: npm script + .gitignore + i18n) — FOUND in git log
