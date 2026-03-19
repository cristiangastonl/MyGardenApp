---
phase: 02-problem-tracking-core
plan: "02"
subsystem: storage
tags: [async-storage, notifications, expo-file-system, tracking, diagnosis]

# Dependency graph
requires:
  - phase: 02-problem-tracking-core/02-01
    provides: TrackingStatus, ProblemEntry types; problemTrackingService pure logic functions; i18n keys
provides:
  - useStorage trackProblem action (sets isTracked, trackingStatus, followUpDate, notificationId, problemSummary)
  - useStorage resolveTrackedProblem action (saves previousStatus, sets trackingStatus=resolved)
  - useStorage reopenTrackedProblem action (restores previousStatus, clears resolved flag)
  - useStorage addFollowUpEntry action (accumulates ProblemEntry without overwriting prior entries)
  - resolveDiagnosis updated to also set trackingStatus=resolved when isTracked
  - scheduleFollowUpReminder in notificationScheduler (TIME_INTERVAL, returns id or null)
  - cancelFollowUpReminder in notificationScheduler (cancels by id)
  - persistDiagnosisPhoto in problemTrackingService (synchronous copy to documentDirectory)
  - startTracking orchestrator (cancel old notif -> schedule new -> persist via storage action)
affects: [02-03, phase-3]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ref-plus-debounce pattern for all four new useStorage actions (matching saveDiagnosis pattern)
    - expo-file-system Paths/File/Directory sync copy for persistDiagnosisPhoto (matching photoService.ts)
    - notification scheduling with TIME_INTERVAL trigger and notificationsAvailable guard (matching scheduleCareReminder)

key-files:
  created: []
  modified:
    - src/hooks/useStorage.tsx
    - src/utils/notificationScheduler.ts
    - src/services/problemTrackingService.ts

key-decisions:
  - "persistDiagnosisPhoto is synchronous (returns string, not Promise) — uses expo-file-system File.copy() matching photoService.ts pattern"
  - "startTracking cancel-then-schedule order prevents duplicate notifications on re-tracking"
  - "resolveDiagnosis updated with spread conditional to avoid breaking non-tracked diagnoses"

patterns-established:
  - "All new useStorage mutations follow: read from dataRef.current -> map -> setState -> update dataRef.current -> scheduleSave"
  - "Notification functions guard with notificationsAvailable flag and call markNotificationsUnavailable on error"
  - "Persistent photo storage goes to documentDirectory/diagnosis-photos/{diagnosisId}/ (not cache)"

requirements-completed: [PROB-04, PROB-06, PROB-07, PROB-10, NOTF-01, NOTF-04]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 02 Plan 02: Storage Mutations and Notification Scheduling Summary

**Four useStorage tracking actions, follow-up notification scheduling with dedup, synchronous photo persistence to documentDirectory, and startTracking orchestrator wired together**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T14:47:27Z
- **Completed:** 2026-03-19T14:54:16Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added four new storage actions to useStorage (trackProblem, resolveTrackedProblem, reopenTrackedProblem, addFollowUpEntry) following the ref-plus-debounce pattern
- Added scheduleFollowUpReminder and cancelFollowUpReminder to notificationScheduler with proper error handling and guard
- Added persistDiagnosisPhoto (sync, copies to documentDirectory) and startTracking (async orchestrator) to problemTrackingService

## Task Commits

Each task was committed atomically:

1. **Task 1: Add useStorage tracking actions and update resolveDiagnosis** - `12478d4` (feat)
2. **Task 2: Add notification scheduling, photo persistence, and startTracking orchestrator** - `b7f391f` (feat)

**Plan metadata:** _(final docs commit follows)_

## Files Created/Modified
- `src/hooks/useStorage.tsx` - Added TrackingStatus/ProblemEntry imports, severityToTrackingStatus import, four new actions in interface and implementation, updated resolveDiagnosis, wired into value object and useMemo deps
- `src/utils/notificationScheduler.ts` - Added SavedDiagnosis import, scheduleFollowUpReminder and cancelFollowUpReminder functions
- `src/services/problemTrackingService.ts` - Added expo-file-system/Plant/SavedDiagnosis/notification imports, persistDiagnosisPhoto (sync), startTracking (async orchestrator)

## Decisions Made
- Used `expo-file-system` (not `expo-file-system/next`) for imports in problemTrackingService — matching the existing `photoService.ts` pattern which is the established project standard
- `persistDiagnosisPhoto` is explicitly synchronous, returns `string` not `Promise<string>` — matching the photoService.ts File.copy() pattern
- `startTracking` follows cancel-before-schedule order to prevent duplicate notifications on re-tracking

## Deviations from Plan

None - plan executed exactly as written. The only adjustment was using `'expo-file-system'` instead of `'expo-file-system/next'` for the import path in Task 2, matching the existing project pattern in `photoService.ts` (not a deviation from intent, just correcting the import path string to match what the codebase actually uses).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend/service operations are wired: storage mutations, notification scheduling, photo persistence, and the startTracking orchestrator
- Plan 03 can now connect these to the UI (DiagnosisResults Track button, problem timeline, reopen/resolve actions)
- Blocking concern from STATE.md still active: notification deep-link cold-start timing needs physical device testing in Plan 03

---
*Phase: 02-problem-tracking-core*
*Completed: 2026-03-19*
