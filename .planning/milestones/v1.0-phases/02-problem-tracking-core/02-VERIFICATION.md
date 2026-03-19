---
phase: 02-problem-tracking-core
verified: 2026-03-19T17:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 02: Problem Tracking Core — Verification Report

**Phase Goal:** Premium users can create a tracked problem record from a diagnosis, with AI-determined follow-up scheduling, persistent storage, push notifications, and full i18n coverage for all new strings
**Verified:** 2026-03-19
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Premium user sees "Track this problem" button after a non-healthy AI diagnosis | VERIFIED | `DiagnosisResults.tsx:217` guards with `shouldShowTrackButton(result.overallStatus, isPremium ?? false)` |
| 2 | Free-tier user does NOT see the tracking button | VERIFIED | `shouldShowTrackButton` in `problemTrackingService.ts:56` returns false when `!isPremium` |
| 3 | Minor severity shows button with "(optional)" suffix, less prominent styling | VERIFIED | `DiagnosisResults.tsx:230` uses `trackButtonOptional` style and `diagnosis.tracking.trackButtonOptional` i18n key |
| 4 | Tapping the Track button calls startTracking, persists data, and schedules notification | VERIFIED | `PlantDiagnosisModal.tsx:108-111` — `handleTrackProblem` calls `await startTracking(plant, diagnosis, trackProblem)` |
| 5 | Follow-up re-diagnosis opens a new chat session (new SavedDiagnosis) | VERIFIED | `usePlantDiagnosis.ts:241` generates `diag_${Date.now()}_...` unique ID for every new diagnosis |
| 6 | When AI detects improvement, an inline resolution card appears | VERIFIED | `DiagnosisResults.tsx:274` renders `resolutionCard` when `showResolutionSuggestion` is true |
| 7 | User can dismiss the resolution card and continue tracking | VERIFIED | `PlantDiagnosisModal.tsx` has `handleDismissResolution` setting `dismissedResolution=true` |
| 8 | chat-diagnosis edge function returns `improvementDetected` boolean | VERIFIED | `chat-diagnosis/index.ts:113,145` — field in both ES and EN JSON schemas |
| 9 | Each follow-up chat message with photo creates a ProblemEntry in entries[] | VERIFIED | `usePlantDiagnosis.ts:331-339` constructs `ProblemEntry` and calls `options.onFollowUpEntry(entry)` |
| 10 | Push notification is scheduled at AI-determined follow-up date, ID persisted | VERIFIED | `notificationScheduler.ts:287` — `scheduleFollowUpReminder` returns identifier; `useStorage.tsx:459` persists as `followUpNotificationId` |
| 11 | Cancelling an existing notification before re-scheduling prevents duplicates | VERIFIED | `problemTrackingService.ts:119-120` — `cancelFollowUpReminder` called before `scheduleFollowUpReminder` |
| 12 | Photos copied from cache to documentDirectory immediately after capture | VERIFIED | `usePlantDiagnosis.ts:276-279` calls synchronous `persistDiagnosisPhoto` before creating `userMsg` |
| 13 | All new i18n keys exist in both EN and ES under diagnosis.tracking and notifications | VERIFIED | Both `en/common.json` and `es/common.json` lines 576-591 have 12 tracking keys; lines 678-679 have `followUpTitle`/`followUpBody` |
| 14 | TypeScript compiles cleanly | VERIFIED | `npx tsc --noEmit` returns zero errors |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/types/index.ts` | `TrackingStatus`, `ProblemEntry`, extended `SavedDiagnosis` | VERIFIED | Lines 255-285: types defined, 9 optional tracking fields on `SavedDiagnosis` |
| `src/services/problemTrackingService.ts` | Pure logic + orchestration + photo persistence | VERIFIED | Exports: `TRACKING_STATUS_CONFIG`, `severityToTrackingStatus`, `getFollowUpDays`, `severityToFollowUpDays`, `calculateFollowUpDate`, `shouldShowTrackButton`, `isTrackingOptional`, `persistDiagnosisPhoto`, `startTracking` |
| `src/hooks/useStorage.tsx` | Four new storage actions + updated `resolveDiagnosis` | VERIFIED | Lines 51-54: interface declares all 4 actions; lines 449-519: implementations; lines 593-596: in value object; line 611: in useMemo deps |
| `src/utils/notificationScheduler.ts` | `scheduleFollowUpReminder` + `cancelFollowUpReminder` | VERIFIED | Lines 287 and 328: both functions present with `followup-reminder` type, guard checks, error handling |
| `src/components/PlantDiagnosis/DiagnosisResults.tsx` | Track button + tracked indicator + resolution card | VERIFIED | 7 new props, 3 conditional render blocks, 12 new styles using theme tokens (`fonts.bodyMedium`, `fonts.bodySemiBold`) |
| `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` | Handler wiring, ref pattern, state | VERIFIED | `currentDiagnosisRef`, `showResolutionSuggestion` state, all handlers, `onFollowUpEntry` inline callback |
| `src/hooks/usePlantDiagnosis.ts` | Photo persistence, improvement detection, follow-up entry | VERIFIED | `onImprovementDetected` + `onFollowUpEntry` options; `persistDiagnosisPhoto` called sync; `ProblemEntry` constructed per response |
| `src/utils/plantDiagnosis.ts` | `ChatDiagnosisResponse` with `improvementDetected` | VERIFIED | Line 143: `improvementDetected?: boolean` field added |
| `supabase/functions/diagnose-plant/index.ts` | `severity` + `problemSummary` in AI response schema | VERIFIED | Lines 134-151, 164-181: fields in both ES and EN prompt schemas |
| `supabase/functions/chat-diagnosis/index.ts` | `improvementDetected` boolean in response schema | VERIFIED | Lines 113, 145: field in both prompts with detection rules |
| `src/i18n/locales/en/common.json` | English tracking strings (12 keys + 2 notification keys) | VERIFIED | Lines 576-591: `diagnosis.tracking` object; lines 678-679: notification keys |
| `src/i18n/locales/es/common.json` | Spanish tracking strings with vos conjugation | VERIFIED | Lines 576-591: parallel key structure with vos forms; lines 678-679: notification keys |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/services/problemTrackingService.ts` | `src/types/index.ts` | `import { DiagnosisSeverity, TrackingStatus, Plant, SavedDiagnosis }` | WIRED | Line 2: import confirmed |
| `src/hooks/useStorage.tsx` | `src/types/index.ts` | `import { TrackingStatus, ProblemEntry }` | WIRED | Line 3: `TrackingStatus, ProblemEntry` in import |
| `src/hooks/useStorage.tsx` | `src/services/problemTrackingService.ts` | `import { severityToTrackingStatus }` | WIRED | Line 6: import confirmed |
| `src/utils/notificationScheduler.ts` | `src/types/index.ts` | `import { SavedDiagnosis, Plant }` | WIRED | Line 2: both in import |
| `src/services/problemTrackingService.ts` | `src/utils/notificationScheduler.ts` | `import { scheduleFollowUpReminder, cancelFollowUpReminder }` | WIRED | Line 3: import confirmed |
| `src/components/PlantDiagnosis/DiagnosisResults.tsx` | `src/services/problemTrackingService.ts` | `import { shouldShowTrackButton, isTrackingOptional, TRACKING_STATUS_CONFIG }` | WIRED | Line 18: import confirmed |
| `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` | `src/services/problemTrackingService.ts` | `import { startTracking }` | WIRED | Line 20: import confirmed |
| `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` | `DiagnosisResults.tsx` | `onTrackProblem={handleTrackProblem}` prop | WIRED | Line 297: prop passed with handler |
| `src/hooks/usePlantDiagnosis.ts` | `src/services/problemTrackingService.ts` | `import { persistDiagnosisPhoto }` | WIRED | Line 8: import confirmed |
| `src/hooks/usePlantDiagnosis.ts` | `src/utils/plantDiagnosis.ts` | `response.improvementDetected` read | WIRED | Line 325: field accessed after chat response |
| `src/hooks/usePlantDiagnosis.ts` | `useStorage.addFollowUpEntry` (via `onFollowUpEntry` callback) | `options.onFollowUpEntry(entry)` call | WIRED | Line 339: callback invoked; wired in modal line 101-103 to `addFollowUpEntry` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PROB-01 | 02-03 | Premium-only "Track this problem" from diagnosis | SATISFIED | `DiagnosisResults.tsx:217` + `shouldShowTrackButton` premium check |
| PROB-02 | 02-01 | Problem record stores all required fields | SATISFIED | `trackProblem` writes: `isTracked`, `trackingStatus`, `followUpDate`, `followUpNotificationId`, `problemSummary`; `SavedDiagnosis` already has `plantId`, `date`, `imageUri`, `result` |
| PROB-03 | 02-01 | AI determines follow-up frequency by severity | SATISFIED | `getFollowUpDays()`: watching=3d, needs_attention=7d, recovering=14d; minor override=14d |
| PROB-04 | 02-02 | User can manually resolve a tracked problem | SATISFIED | `resolveTrackedProblem` in `useStorage.tsx:470` — sets `resolved:true`, `trackingStatus:'resolved'`, saves `previousStatus` |
| PROB-05 | 02-03 | AI-detected improvement triggers resolution suggestion | SATISFIED | End-to-end chain: edge fn `improvementDetected` -> hook callback -> `setShowResolutionSuggestion(true)` -> `resolutionCard` rendered |
| PROB-06 | 02-02 | User can reopen a resolved problem | SATISFIED | `reopenTrackedProblem` in `useStorage.tsx:490` — restores `previousStatus`, clears `resolved` flag |
| PROB-07 | 02-02, 02-03 | Each follow-up adds a ProblemEntry to entries[] | SATISFIED | `usePlantDiagnosis.ts:331-339` constructs entry; `addFollowUpEntry` appends to `entries` array (line 514: spread operator preserves prior entries) |
| PROB-08 | 02-03 | Follow-up re-diagnosis creates new chat session | SATISFIED | `usePlantDiagnosis.ts:241` always generates new `diagId`; no path merges new diagnoses into existing ones |
| PROB-09 | 02-01 | Descriptive severity labels not numeric scores | SATISFIED | `TRACKING_STATUS_CONFIG` maps to: Watch closely / Needs attention / Recovering / Resolved |
| PROB-10 | 02-02, 02-03 | Photos copied from cache to documentDirectory on capture | SATISFIED | `persistDiagnosisPhoto` synchronously copies to `documentDirectory/diagnosis-photos/{diagnosisId}/`; called in `sendChatMessage` before `userMsg` creation |
| NOTF-01 | 02-02 | Push notification at AI-determined follow-up date (premium) | SATISFIED | `scheduleFollowUpReminder` uses `TIME_INTERVAL` trigger in seconds; called from `startTracking` |
| NOTF-04 | 02-02 | Notification IDs persisted, no duplication | SATISFIED | `trackProblem` stores `followUpNotificationId`; `startTracking` cancels old ID before scheduling new |
| I18N-01 | 02-01 | All new UI strings use `t('key')` with EN/ES translations | SATISFIED | All strings in `DiagnosisResults.tsx` and `PlantDiagnosisModal.tsx` use `t()` — no hardcoded user-facing strings found |
| I18N-02 | 02-01 | Edge function accepts `lang` for follow-up descriptions | SATISFIED | `diagnose-plant/index.ts:82-83` reads `lang` param, selects ES or EN prompt |

**All 14 phase requirements satisfied.** NOTF-02 and NOTF-03 are correctly scoped to Phase 3 and are not Phase 2 requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PlantDiagnosisModal.tsx` | 61 | `resolvedAnimation` state declared but only set, never read in JSX | Info | Intentional deferral — CONTEXT.md "subtle checkmark animation" deferred to Phase 3 visual polish per plan decision. No user-visible regression. |

No blockers or warnings found.

---

### Human Verification Required

#### 1. Track button premium gate at runtime

**Test:** Log in as a free user, run a diagnosis with a moderate or severe result, view DiagnosisResults.
**Expected:** No "Track this problem" button visible.
**Why human:** `isPremium` is a runtime value from `usePremiumGate()` which reads feature flags and subscription state — cannot verify the conditional branch exercised from static analysis alone.

#### 2. Push notification delivery on device

**Test:** Track a problem on a physical device. Wait for the follow-up interval (or short-circuit by setting `followUpDate` to 30 seconds in the future in a debug build).
**Expected:** Notification arrives with plant name in title and problem summary in body.
**Why human:** `Notifications.scheduleNotificationAsync` behavior and `TIME_INTERVAL` trigger accuracy require a real device with notification permissions granted.

#### 3. Photo persistence survives cache clear

**Test:** Take a follow-up chat photo for a tracked diagnosis. Clear the app cache. Reopen the diagnosis.
**Expected:** Photo URI in `ProblemEntry.photoUri` still resolves to a valid image.
**Why human:** File system paths (`documentDirectory` vs `cacheDirectory`) cannot be validated programmatically without running on-device.

#### 4. Resolution card dismissal

**Test:** In a tracked diagnosis chat, trigger improvement detection (mock or actual). Tap "Keep tracking". Verify card disappears and does not reappear in the same session.
**Expected:** Card dismissed, `dismissedResolution=true` state persists for session.
**Why human:** State interaction between `showResolutionSuggestion` and `dismissedResolution` requires UI exercising.

---

### Gaps Summary

No gaps. All 14 truths verified, all artifacts pass all three levels (exists, substantive, wired), all key links confirmed. The single info-level anti-pattern (`resolvedAnimation` declared but not rendered) is a documented intentional deferral per the plan's own decision record, not a blocker.

---

_Verified: 2026-03-19T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
