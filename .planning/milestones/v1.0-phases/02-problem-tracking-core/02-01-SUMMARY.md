---
phase: 02-problem-tracking-core
plan: 01
subsystem: api
tags: [typescript, i18n, supabase, edge-functions, tracking]

# Dependency graph
requires: []
provides:
  - TrackingStatus union type (watching | needs_attention | recovering | resolved)
  - ProblemEntry interface for follow-up log entries
  - Extended SavedDiagnosis with optional problem-tracking fields
  - problemTrackingService.ts with severity mapping and follow-up day calculation
  - TRACKING_STATUS_CONFIG with emoji, labelKey, color per status
  - EN/ES i18n keys under diagnosis.tracking and notifications (followUpTitle/Body)
  - Edge function diagnose-plant returning severity and problemSummary fields
affects:
  - 02-problem-tracking-core (plans 02, 03 depend on these contracts)
  - UI components that render tracking status badges
  - Notification scheduling service (follow-up intervals)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Emoji stored in TRACKING_STATUS_CONFIG.emoji (not in i18n strings) so labels can be reused without emoji in non-UI contexts
    - All new SavedDiagnosis fields are optional (?) for backward compatibility with existing AsyncStorage data
    - severity field on edge function response mirrors overallStatus to decouple tracking from result parsing

key-files:
  created:
    - src/services/problemTrackingService.ts
  modified:
    - src/types/index.ts
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json
    - supabase/functions/diagnose-plant/index.ts

key-decisions:
  - "TRACKING_STATUS_CONFIG.emoji is separate from i18n label keys — UI combines them at render time to allow emoji-free reuse"
  - "minor severity maps to needs_attention status but gets 14-day follow-up interval (not 7d) per locked CONTEXT.md decision"
  - "All SavedDiagnosis tracking fields are optional to ensure zero migration cost for existing stored data"

patterns-established:
  - "Config objects (TRACKING_STATUS_CONFIG) store emoji + i18n key refs together; UI resolves via t() at render time"
  - "Pure service modules have no side effects, no hook imports, no AsyncStorage calls"

requirements-completed: [PROB-02, PROB-03, PROB-09, I18N-01, I18N-02]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 2 Plan 01: Problem Tracking Foundation Summary

**TrackingStatus type system, pure severity-mapping service, EN/ES i18n tracking keys, and edge function severity+problemSummary response fields established as shared contracts for Plans 02 and 03.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-19T16:38:12Z
- **Completed:** 2026-03-19T16:41:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- TrackingStatus, ProblemEntry types and extended SavedDiagnosis compile cleanly with zero impact on existing code
- problemTrackingService.ts provides all pure logic (severity mapping, follow-up day calculation, track button visibility) with no side effects
- Both EN and ES common.json have complete, parallel i18n key structures under diagnosis.tracking and notifications
- diagnose-plant edge function prompts now request severity and problemSummary fields in both ES and EN schemas

## Task Commits

1. **Task 1: Define tracking types and extend SavedDiagnosis** - `31c9dc8` (feat)
2. **Task 2: Create problemTrackingService, i18n keys, edge function update** - `ff9c707` (feat)

## Files Created/Modified
- `src/types/index.ts` - Added TrackingStatus, ProblemEntry, extended SavedDiagnosis with optional tracking fields
- `src/services/problemTrackingService.ts` - Pure service: TRACKING_STATUS_CONFIG, severityToTrackingStatus, getFollowUpDays, severityToFollowUpDays, calculateFollowUpDate, shouldShowTrackButton, isTrackingOptional
- `src/i18n/locales/en/common.json` - Added diagnosis.tracking object (12 keys) and notifications.followUpTitle/Body
- `src/i18n/locales/es/common.json` - Added diagnosis.tracking object (12 keys, vos conjugation) and notifications.followUpTitle/Body
- `supabase/functions/diagnose-plant/index.ts` - Added severity and problemSummary to JSON schema in both ES and EN prompts

## Decisions Made
- Emoji stored in TRACKING_STATUS_CONFIG.emoji, not in i18n strings, so label keys can be reused in emoji-free contexts (badges, accessibility labels)
- minor severity gets 14-day follow-up even though it maps to needs_attention status (7 days) — CONTEXT.md locked decision honored via severityToFollowUpDays override

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All type contracts ready for Plan 02 (storage layer: trackProblem, updateTrackingStatus, addProblemEntry mutations)
- TRACKING_STATUS_CONFIG ready for Plan 03 UI badge rendering
- Edge function prompts updated; existing clients ignore new fields (backward compatible)

---
*Phase: 02-problem-tracking-core*
*Completed: 2026-03-19*
