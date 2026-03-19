---
phase: 03-reminders-tasks-plant-detail-ui
plan: "01"
subsystem: ui-diagnosis-followup
tags: [react-native, components, i18n, diagnosis, tracking, premium]
dependency_graph:
  requires:
    - 02-03 (problemTrackingService, TRACKING_STATUS_CONFIG, TrackingStatus types)
  provides:
    - FollowUpTaskSection component
    - activeTrackingStatus badge on PlantCard
  affects:
    - TodayScreen (follow-up section + filtered DiagnosisFollowUp)
    - PlantsScreen (tracking badge)
    - PlantCard (tracking emoji badge)
tech_stack:
  added: []
  patterns:
    - useMemo for follow-up due-today computation
    - isPremium guard as early return in component
    - Filtered diagnosisHistory passed to DiagnosisFollowUp to prevent duplicates
key_files:
  created:
    - src/components/FollowUpTaskSection.tsx
  modified:
    - src/screens/TodayScreen.tsx
    - src/screens/PlantsScreen.tsx
    - src/components/PlantCard.tsx
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json
decisions:
  - Filtered tracked diagnoses out of DiagnosisFollowUp to prevent duplicate cards when both sections render
  - activeTrackingStatus overrides default 🩺 emoji in PlantCard badge; falls back to 🩺 when only hasActiveDiagnosis is true
metrics:
  duration: "~15 min"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_changed: 6
---

# Phase 3 Plan 01: Follow-up Task Section and Tracking Badge Summary

**One-liner:** FollowUpTaskSection renders premium-gated due/overdue tracked follow-ups in Hoy, and PlantCard shows TRACKING_STATUS_CONFIG emoji badge for plants with active tracked problems.

## What Was Built

### Task 1: FollowUpTaskSection component + Hoy integration + i18n

Created `src/components/FollowUpTaskSection.tsx`:
- Props: `plants`, `diagnosisHistory`, `isPremium`, `onPressPlant`, `onPressDiagnosis`
- Early returns `null` when `!isPremium` or no due/overdue follow-ups found
- `useMemo` computes follow-ups: iterates all plants/diagnoses, filters `isTracked && trackingStatus !== 'resolved' && followUpDate` where the date is today or in the past
- Shows `TRACKING_STATUS_CONFIG[status].emoji` + translated label, plant name/icon, problem description (1-2 lines), CTA button calling `onPressPlant`
- All strings via `t()` from react-i18next

Updated `src/screens/TodayScreen.tsx`:
- Imported `FollowUpTaskSection`
- Renders it above `DiagnosisFollowUp`
- Passes `untrackedDiagnosisHistory` (filtered) to `DiagnosisFollowUp` to prevent duplicate cards for tracked diagnoses
- Computes `getActiveTrackingStatus(plantId)` helper and passes result to `PlantCard`

Added i18n keys to EN and ES `common.json` under `diagnosis.tracking`:
- `followUpDueToday`, `checkNow`, `overdueFollowUp`

### Task 2: PlantCard tracking badge + call site updates

Updated `src/components/PlantCard.tsx`:
- Added `activeTrackingStatus?: TrackingStatus` prop
- Imported `TRACKING_STATUS_CONFIG` from `problemTrackingService`
- Badge renders when `hasActiveDiagnosis === true` OR `activeTrackingStatus` is set and not `resolved`
- When `activeTrackingStatus` is set and not resolved: shows `TRACKING_STATUS_CONFIG[activeTrackingStatus].emoji`
- When only `hasActiveDiagnosis`: falls back to `🩺`

Updated `src/screens/TodayScreen.tsx` and `src/screens/PlantsScreen.tsx`:
- Added `getActiveTrackingStatus(plantId)` helper in each screen
- Pass `activeTrackingStatus={getActiveTrackingStatus(plant.id)}` to `PlantCard`

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | bb435f6 | feat(03-01): FollowUpTaskSection component + Hoy integration + i18n |
| Task 2 | 620b733 | feat(03-01): PlantCard tracking badge + call site updates |

## Self-Check: PASSED

- FollowUpTaskSection.tsx: FOUND
- Commit bb435f6: FOUND
- Commit 620b733: FOUND
