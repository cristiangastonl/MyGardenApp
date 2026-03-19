---
phase: 03-reminders-tasks-plant-detail-ui
plan: "02"
subsystem: plant-detail-ui
tags: [ui, active-problems, problem-timeline, plant-detail, i18n]
dependency_graph:
  requires: [problemTrackingService, SavedDiagnosis types, ProblemEntry types]
  provides: [ActiveProblemsSection, ProblemTimeline]
  affects: [MyPlantDetailModal]
tech_stack:
  added: []
  patterns: [inline-timeline-toggle, photo-error-fallback, newest-first-sort]
key_files:
  created:
    - src/components/ActiveProblemsSection.tsx
    - src/components/ProblemTimeline.tsx
  modified:
    - src/components/MyPlantDetailModal.tsx
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json
decisions:
  - ProblemTimeline rendered inside ActiveProblemsSection (not in MyPlantDetailModal) — collapsed by default with local toggle state per diagnosis ID
  - allPlantDiagnoses (no .slice limit) passed to ActiveProblemsSection so tracked problems older than top-5 are still surfaced
  - onPressDiagnosis wires to resumeDiagnosis flow — opens PlantDiagnosisModal with existing tracked diagnosis pre-loaded
  - showTimeline/hideTimeline i18n keys added alongside plan-specified keys for toggle UX
metrics:
  duration: 7 min
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_changed: 5
requirements: [UI-01, UI-02, UI-04]
---

# Phase 03 Plan 02: Active Problems + Problem Timeline Summary

**One-liner:** ActiveProblemsSection and ProblemTimeline added to plant detail with collapsible timeline, photo fallback, and overdue date highlighting.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | ActiveProblemsSection + ProblemTimeline components | 4067801 | ActiveProblemsSection.tsx, ProblemTimeline.tsx, en/common.json, es/common.json |
| 2 | Wire ActiveProblemsSection into MyPlantDetailModal | 83ef914 | MyPlantDetailModal.tsx |

## What Was Built

### ActiveProblemsSection (`src/components/ActiveProblemsSection.tsx`)
- Filters `diagnoses` to those where `isTracked && trackingStatus && trackingStatus !== 'resolved'`
- Returns `null` when no active problems (no empty state shown in parent)
- Each problem card shows: status emoji+label (colored), summary (2 lines max), last check date, next follow-up date (red if overdue)
- Collapsible `ProblemTimeline` via local `Record<string, boolean>` expand state
- CTA "Re-diagnose" button wires to `onPressDiagnosis` prop

### ProblemTimeline (`src/components/ProblemTimeline.tsx`)
- Sorts entries newest-first
- Vertical timeline with dot + line connector per entry
- Each entry: date, optional status change badge (15% opacity background), AI notes (3 lines max), photo or emoji placeholder
- `onError` on `<Image>` sets local per-entry error state to render plant icon instead
- Empty state: plant icon + `t('diagnosis.tracking.noEntriesYet')`

### MyPlantDetailModal integration
- `ActiveProblemsSection` rendered above diagnosis history section
- `allPlantDiagnoses` (full list) passed — not limited to 5 like the history display
- `onPressDiagnosis` → `setResumeDiagnosis(d)` + `setShowDiagnosis(true)` — opens existing `PlantDiagnosisModal` with the tracked diagnosis pre-loaded for re-diagnosis

## i18n Keys Added

Both EN and ES:
- `diagnosis.tracking.activeProblems`
- `diagnosis.tracking.reDiagnose`
- `diagnosis.tracking.noEntriesYet`
- `diagnosis.tracking.lastCheck`
- `diagnosis.tracking.nextFollowUp`
- `diagnosis.tracking.overdue`
- `diagnosis.tracking.showTimeline`
- `diagnosis.tracking.hideTimeline`

## Deviations from Plan

### Auto-added functionality (Rule 2)

**1. [Rule 2 - Missing i18n keys] Added showTimeline/hideTimeline toggle keys**
- **Found during:** Task 1
- **Issue:** Timeline toggle button needed visible labels not specified in the plan's i18n list
- **Fix:** Added `showTimeline` and `hideTimeline` keys in both EN and ES
- **Files modified:** en/common.json, es/common.json
- **Commit:** 4067801

**2. [Rule 2 - Missing scope] allPlantDiagnoses for ActiveProblemsSection**
- **Found during:** Task 2
- **Issue:** Using `plantDiagnoses.slice(0, 5)` would hide tracked problems if they were not in the 5 most recent
- **Fix:** Derived `allPlantDiagnoses` from `getDiagnosesForPlant` without the `.slice` limit; `plantDiagnoses` still uses the limited list for the history section
- **Files modified:** MyPlantDetailModal.tsx
- **Commit:** 83ef914

## Self-Check: PASSED

All created files exist, all commits verified, TypeScript compiles clean.
