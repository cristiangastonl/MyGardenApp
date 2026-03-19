---
phase: 02-problem-tracking-core
plan: 03
subsystem: ui
tags: [react-native, plant-diagnosis, problem-tracking, premium, notifications, i18n]

# Dependency graph
requires:
  - phase: 02-01
    provides: TrackingStatus types, problemTrackingService (shouldShowTrackButton, isTrackingOptional, TRACKING_STATUS_CONFIG, persistDiagnosisPhoto, startTracking), i18n keys
  - phase: 02-02
    provides: useStorage tracking actions (trackProblem, resolveTrackedProblem, addFollowUpEntry), scheduleFollowUpReminder
provides:
  - Track button wired in DiagnosisResults (premium-only, severity-aware, i18n)
  - Resolution suggestion card rendered in chat area when AI detects improvement
  - Improvement detection flowing end-to-end: edge function -> ChatDiagnosisResponse.improvementDetected -> hook callback -> modal state -> DiagnosisResults
  - Photo persistence on capture for tracked diagnosis follow-up chat photos
  - ProblemEntry created per follow-up chat response (PROB-07)
  - PROB-08 satisfied: follow-up re-diagnosis creates new SavedDiagnosis (existing architecture)
affects: [03-problem-history-ui, any future diagnosis UI work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Improvement detection: edge function boolean -> hook option callback -> parent state -> child prop"
    - "Photo persistence on message creation: synchronous File.copy before pushing userMsg"
    - "Diagnosis ref pattern: currentDiagnosisRef tracks live SavedDiagnosis for async callbacks"

key-files:
  created: []
  modified:
    - src/components/PlantDiagnosis/DiagnosisResults.tsx
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
    - src/hooks/usePlantDiagnosis.ts
    - src/utils/plantDiagnosis.ts
    - supabase/functions/chat-diagnosis/index.ts

key-decisions:
  - "onFollowUpEntry callback passed as inline arrow function to usePlantDiagnosis options (not useCallback) — closure over savedDiagnosisId which is stable after diagnosis"
  - "Resolution card rendered inside chat section (after messages) rather than after care tips — contextually tied to chat-detected improvement"
  - "PROB-08 satisfied by existing architecture: no code path merges new diagnosis into existing one"
  - "resolvedAnimation state wired (setTimeout 1500ms) for subtle checkmark per CONTEXT.md — UI rendering deferred to Phase 3 visual polish"

patterns-established:
  - "Hook options pattern: optional callbacks in options object allow parent to react to hook-internal events without exposing internal state"
  - "Synchronous photo persistence: persistDiagnosisPhoto called without await inside sendChatMessage before async edge function call"

requirements-completed: [PROB-01, PROB-05, PROB-07, PROB-08]

# Metrics
duration: 7min
completed: 2026-03-19
---

# Phase 2 Plan 3: UI Wiring for Problem Tracking Summary

**Track button + resolution card fully wired: premium users can track diagnoses, AI-detected improvement triggers dismissible resolution card, follow-up chat photos persisted synchronously, ProblemEntry created per tracked chat response**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T14:58:39Z
- **Completed:** 2026-03-19T15:06:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- DiagnosisResults renders severity-aware Track button (premium-only via shouldShowTrackButton) and tracked indicator with TRACKING_STATUS_CONFIG emoji/label
- Inline resolution card appears in chat area when chat-diagnosis returns improvementDetected:true, dismissible via keepTracking button
- chat-diagnosis edge function extended with improvementDetected boolean in JSON schema and detection rules for both ES and EN prompts
- ChatDiagnosisResponse type updated with optional improvementDetected field
- Full improvement detection chain wired: edge fn -> ChatDiagnosisResponse -> hook onImprovementDetected callback -> setShowResolutionSuggestion(true) -> DiagnosisResults
- Photo persistence on capture: persistDiagnosisPhoto (synchronous) called in sendChatMessage for tracked diagnoses before message is created
- ProblemEntry construction and onFollowUpEntry callback wired (PROB-07): each tracked follow-up chat response creates {id, date, photoUri, aiNotes, statusChange} entry
- PROB-08 confirmed satisfied by existing architecture (new diagnosis = new diagId, no merge path)

## Task Commits

1. **Task 1: Track button, resolution card, improvementDetected** - `8112ac6` (feat)
2. **Task 2: Wire handlers, photo persistence, follow-up entries** - `f19e4ca` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/PlantDiagnosis/DiagnosisResults.tsx` - Added 7 new props (onTrackProblem, isAlreadyTracked, trackingStatus, showResolutionSuggestion, onConfirmResolution, onDismissResolution), Track button, tracked indicator, resolution card, and 12 new styles
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` - currentDiagnosisRef, showResolutionSuggestion state, handleTrackProblem/handleConfirmResolution/handleDismissResolution handlers, onFollowUpEntry inline callback, new props passed to DiagnosisResults
- `src/hooks/usePlantDiagnosis.ts` - onImprovementDetected + onFollowUpEntry in options, persistDiagnosisPhoto call, ProblemEntry construction, updated sendChatMessage deps
- `src/utils/plantDiagnosis.ts` - improvementDetected?: boolean added to ChatDiagnosisResponse
- `supabase/functions/chat-diagnosis/index.ts` - improvementDetected in JSON schema + detection rules for ES and EN

## Decisions Made

- `onFollowUpEntry` passed as inline arrow function to `usePlantDiagnosis` options (not extracted to a separate `useCallback`) because `savedDiagnosisId` is the only closure dependency and it's stable after diagnosis completes.
- Resolution card rendered inside the chat section (after messages), not after care tips — contextually it is tied to AI-detected improvement in the chat conversation.
- `resolvedAnimation` state wired with setTimeout 1500ms per CONTEXT.md "subtle checkmark animation" requirement; the actual Animated.spring visual rendering is deferred to Phase 3 (no animation component needed for functional tracking).
- PROB-08 documented as satisfied by existing architecture with no code changes needed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 2 requirements (PROB-01, PROB-03, PROB-05, PROB-07, PROB-08, PROB-09, PROB-10) are now wired end-to-end
- Phase 3 (problem history UI) can read isTracked, trackingStatus, entries[] from SavedDiagnosis and render the timeline
- The `resolvedAnimation` subtle checkmark (CONTEXT.md requirement) can be fully implemented in Phase 3 with Animated.spring

## Self-Check: PASSED

All files verified present. Both task commits (8112ac6, f19e4ca) confirmed in git log.

---
*Phase: 02-problem-tracking-core*
*Completed: 2026-03-19*
