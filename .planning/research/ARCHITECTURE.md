# Architecture Patterns

**Domain:** AI-driven plant problem tracking + camera-in-chat for local-first React Native app
**Researched:** 2026-03-19
**Confidence:** HIGH (analysis based on actual codebase, not speculation)

---

## Context: What Already Exists

Before describing what to build, it is important to record what the codebase already provides, because this milestone is additive — not a rewrite.

**Already working (do not touch):**

- `usePlantDiagnosis` hook already has `pickFromCamera()` wired with full permission handling. The gap is that `PlantDiagnosisModal` delegates to `CameraCapture` but the **chat phase** inside `DiagnosisResults` only calls `pickChatPhoto()` which uses gallery-only `launchImageLibraryAsync`. Camera in chat is a one-function swap.
- `SavedDiagnosis` type already has `resolved` and `resolvedDate` fields.
- `diagnosisHistory: Record<plantId, SavedDiagnosis[]>` already lives in `AppData` and persists to AsyncStorage.
- `DiagnosisFollowUp` component already renders active (unresolved) diagnoses in the "Hoy" screen as cards with a "Mark resolved" button.
- `resolveDiagnosis(plantId, diagnosisId)` already exists in `useStorage`.
- Notification infrastructure (`expo-notifications`, `notificationScheduler.ts`) is fully operational for scheduling future-dated one-shot and daily notifications.

**What is missing:**

- Camera option in the chat photo picker (inside `DiagnosisResults`).
- A `followUpSchedule` on `SavedDiagnosis` — AI-decided date for when to re-diagnose.
- Scheduling a push notification for that follow-up date.
- A follow-up task surfacing in the "Hoy" screen on the scheduled date.
- Auto-resolve detection: when a follow-up diagnosis comes back healthy/minor, offer to close the tracked problem.
- A problem timeline view on the plant detail screen showing all diagnoses for that plant in chronological order.
- Premium gate for the scheduling / tracking features.

---

## Recommended Architecture

### Overview

Three concerns map cleanly to three build areas:

```
1. Camera-in-chat       — One component change, no data model change
2. Problem tracking     — Data model extension + notification scheduling
3. Problem timeline     — New UI component, reads existing diagnosisHistory
```

These are independent. Camera-in-chat has zero dependencies on the other two. Problem timeline has zero dependencies on tracking (it reads data that already exists). Tracking is the only one that touches the data model.

---

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `DiagnosisResults` (existing) | Chat UI, send message, show photo | `usePlantDiagnosis` hook for sendChatMessage |
| `pickChatPhoto` (inline in `PlantDiagnosisModal`) | Provides photo to chat | `ImagePicker` (currently gallery-only) |
| `usePlantDiagnosis` (existing hook) | Diagnosis state machine, camera/gallery pick, AI calls | `diagnosePlant` util, `chatDiagnosis` util, `SavedDiagnosis` |
| `SavedDiagnosis` type (extend) | Persisted diagnosis record | `AppData` in AsyncStorage via `useStorage` |
| `problemTrackingService.ts` (new) | Schedule follow-up notification, cancel on resolve | `notificationScheduler.ts`, `useStorage` |
| `DiagnosisFollowUp` (existing component) | Surface active diagnoses in Hoy screen with follow-up date | `diagnosisHistory` from `useStorage`, plants array |
| `getFollowUpTasksForDay` (new util) | Generate follow-up tasks like `getTasksForDay` does for care | `diagnosisHistory`, plant list, current date |
| `ProblemTimeline` (new component) | Chronological photo+diagnosis history per plant | `diagnosisHistory` for one plant, opens `PlantDiagnosisModal` with `resumeDiagnosis` |
| `MyPlantDetailModal` (existing) | Plant detail including problem timeline section | `ProblemTimeline`, `diagnosisHistory` |

---

### Data Model Extension

Extend `SavedDiagnosis` (in `src/types/index.ts`) with one new optional field:

```typescript
export interface SavedDiagnosis {
  // ... existing fields unchanged ...
  followUpDate: string | null;       // ISO date string — AI-decided re-check date
  followUpNotificationId: string | null;  // Expo notification identifier for cancellation
}
```

Extend `AppData` in `src/types/index.ts`:

```typescript
export interface AppData {
  // ... all existing fields unchanged ...
  problemTracking: ProblemTracking;  // new
}

export interface ProblemTracking {
  enabled: boolean;  // user opted in (premium gate enforced at enable time)
}
```

The `problemTracking` field is a slim envelope. Individual follow-up dates live on each `SavedDiagnosis` — not in a parallel structure — so timeline queries are `O(diagnosesForPlant)` without cross-joining two collections.

**Storage key stays the same** (`plant-agenda-v2`). Both new fields are optional (`| null`) so existing persisted data deserializes without migration code.

---

### Data Flow

#### Camera-in-Chat Flow

```
DiagnosisResults (chat phase)
  → user taps camera icon in chat input
  → pickChatPhoto() [currently: launchImageLibraryAsync only]
  → ADD: show action sheet "Camera / Gallery"
  → Camera branch: ImagePicker.launchCameraAsync({ base64: true })
  → Gallery branch: ImagePicker.launchImageLibraryAsync({ base64: true })  [unchanged]
  → { base64, uri } returned to DiagnosisResults
  → setPendingPhoto(result)
  → user sends → onSendChat(text, base64, uri)
  → usePlantDiagnosis.sendChatMessage() → chat-diagnosis edge function
```

This is entirely in `PlantDiagnosisModal.tsx`, one function (`pickChatPhoto`). No hook changes, no data model changes.

#### Problem Tracking Flow (Premium)

```
usePlantDiagnosis.analyze() completes
  → DiagnosisResult.overallStatus is 'moderate' | 'severe'
  → SavedDiagnosis created with followUpDate: null (as today)
  → onDiagnosisComplete(saved) → PlantDiagnosisModal → saveDiagnosis()
                                                         → AsyncStorage write

  [After save, if isPremium && overallStatus !== 'healthy']
  → problemTrackingService.scheduleFollowUp(diagnosis, plant)
      → determines followUpDate from severity:
          severe   → today + 3 days
          moderate → today + 7 days
          minor    → today + 14 days
      → scheduleFollowUpNotification(plant, followUpDate)
          → Notifications.scheduleNotificationAsync (TIME_INTERVAL trigger)
          → returns notificationId
      → updateDiagnosis(plantId, diagnosisId, { followUpDate, followUpNotificationId })
          → AsyncStorage write
```

The service receives severity from the `DiagnosisResult`; the AI does not need a new API field. Severity already encodes urgency. Follow-up intervals are hardcoded constants in the service, not AI-generated, which avoids the complexity of parsing a free-text AI response for a date.

**Note on "AI decides follow-up interval":** The PROJECT.md says "follow-up interval decided by AI." However, the existing `DiagnosisResult` type has `overallStatus: DiagnosisSeverity` which already represents the AI's severity assessment. Mapping severity to intervals (3/7/14 days) on the client is clean, deterministic, and does not require changing the edge function API contract. This is the recommended approach. If the product later needs per-issue-type intervals (e.g., fungus vs. overwatering recover differently), the edge function can be extended to return a `suggestedFollowUpDays` field — but that is a V2 concern.

#### Follow-up Reminder in Hoy Screen

```
TodayScreen renders
  → getFollowUpTasksForDay(plants, diagnosisHistory, today)
      → for each plant, for each unresolved diagnosis:
          if followUpDate matches today → emit FollowUpTask
  → DiagnosisFollowUp component receives activeDiagnoses
  → [EXTEND] show "Follow-up due today" badge when followUpDate === today
  → user taps → opens PlantDiagnosisModal with resumeDiagnosis=existing
  → user takes new photo → analyze() runs → new SavedDiagnosis created
  → if new result is 'healthy': auto-resolve prompt shown
      → user confirms → resolveDiagnosis() → problemTrackingService.cancelFollowUp()
```

`getFollowUpTasksForDay` is a new pure utility function in `src/utils/plantLogic.ts` (or a sibling file). It is stateless, just like `getTasksForDay`. It reads `diagnosisHistory` and returns an array of `FollowUpTask` items. `TodayScreen` renders these through the existing `DiagnosisFollowUp` component extended with a date-awareness prop.

#### Problem Timeline Flow

```
MyPlantDetailModal opens for a plant
  → reads diagnosisHistory[plant.id] from useStorage
  → ProblemTimeline component receives sorted array (newest first)
  → renders each diagnosis as a timeline entry:
      - photo thumbnail (imageUris[0])
      - severity badge
      - date
      - first issue name
      - status: active / resolved
  → tapping entry → opens DiagnosisDetailModal (already exists) OR
                     opens PlantDiagnosisModal with resumeDiagnosis=entry
```

`ProblemTimeline` is a pure presentational component. It receives diagnoses as props and calls back with `onPressDiagnosis(diagnosis)`. No direct storage access.

---

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Parallel Follow-Up Collection

**What:** Creating `followUpSchedule: Record<diagnosisId, FollowUpEntry>` as a separate collection in `AppData`.

**Why bad:** Every place that reads a `SavedDiagnosis` now needs to cross-join with a second collection to know if it has a follow-up. This creates stale-reference bugs (delete a diagnosis, orphan its follow-up entry) and forces every consumer to know about two tables.

**Instead:** Put `followUpDate` and `followUpNotificationId` directly on `SavedDiagnosis`. Data lives with the record it describes.

#### Anti-Pattern 2: Storing Follow-Up Tasks Like Care Tasks

**What:** Persisting follow-up task completion state in its own structure (e.g., `completedFollowUps: string[]` in `AppData`).

**Why bad:** The existing pattern for care tasks (`getTasksForDay`) is intentionally stateless — tasks regenerate fresh every render from plant data. Following the same pattern for follow-up tasks keeps them consistent with the rest of the task system and avoids a synchronization problem between "task done" state and "diagnosis resolved" state.

**Instead:** A follow-up task for today is present if `followUpDate === today && !diagnosis.resolved`. Completing it means opening the diagnosis and either resolving it or setting a new `followUpDate`. No separate completion state needed.

#### Anti-Pattern 3: Edge Function Change for Follow-Up Scheduling

**What:** Adding `suggestedFollowUpDays` to the `diagnose-plant` edge function response to let the AI decide the interval.

**Why bad:** This requires deploying a new edge function version, changing the `DiagnosisResult` type, and handling cases where the field is absent (old edge function versions). The severity field already encodes the AI's urgency signal. Mapping severity to intervals on the client is equivalent in practice and requires no deployment.

**Instead:** Map `DiagnosisSeverity` to a constant interval table on the client. Only revisit this if product needs truly per-issue intervals.

#### Anti-Pattern 4: Re-Architecting the Camera Flow

**What:** Creating a shared `CameraOrGalleryPicker` service or wrapping `usePlantDiagnosis` to expose a unified picker.

**Why bad:** Camera-in-chat is a single-location change (the `pickChatPhoto` closure in `PlantDiagnosisModal`). The diagnosis capture phase already has camera working. Over-engineering the picker into a shared service adds abstraction with no reuse benefit at this scope.

**Instead:** Add an `ActionSheetIOS` / `Alert.alert` two-option prompt directly in `pickChatPhoto`. One function, one file.

---

### Premium Gating Integration

The existing `usePremiumGate()` pattern handles this cleanly. Add one new method:

```typescript
canTrackProblems(): boolean {
  return isPremium && Features.DLC_PEST_DIAGNOSIS;
}
```

Call sites:
- After `saveDiagnosis()` in `PlantDiagnosisModal`: gate `problemTrackingService.scheduleFollowUp()` behind `canTrackProblems()`.
- In `DiagnosisFollowUp`: show follow-up date badge only when `canTrackProblems()`.
- No gate on the timeline itself (all users should be able to see their diagnosis history).

Feature flag: no new flag needed. `DLC_PEST_DIAGNOSIS` already gates the diagnosis feature. Problem tracking is a premium layer on top of diagnosis.

---

### New Service: `problemTrackingService.ts`

Location: `src/services/problemTrackingService.ts`

Responsibilities:
- `scheduleFollowUp(diagnosis: SavedDiagnosis, plant: Plant): Promise<void>` — determines interval from severity, schedules notification, updates diagnosis record in storage
- `cancelFollowUp(diagnosisId: string, notificationId: string | null): Promise<void>` — cancels scheduled notification when problem resolved
- `rescheduleFollowUp(diagnosis: SavedDiagnosis, plant: Plant, newDate: string): Promise<void>` — if user wants to snooze (V2 concern, scaffold only)

This service is the only component that bridges `notificationScheduler.ts` and `useStorage`. It keeps notification scheduling out of hooks and out of UI components.

Notification data payload (for deep-link on tap):

```typescript
data: {
  type: "followup-reminder",
  plantId: plant.id,
  diagnosisId: diagnosis.id,
}
```

This matches the existing pattern in `notificationScheduler.ts` where `type` is the discriminant.

---

### Suggested Build Order

**Phase 1 — Camera in chat** (zero dependencies, lowest risk)
- Modify `pickChatPhoto` in `PlantDiagnosisModal.tsx`
- Test on device (camera permissions are a known edge case on iOS simulator)
- No data model changes, no storage changes

**Phase 2 — Data model + types** (prerequisite for tracking features)
- Add `followUpDate` and `followUpNotificationId` to `SavedDiagnosis`
- Add `problemTracking` to `AppData`
- Add `updateDiagnosisFollowUp(plantId, diagnosisId, updates)` action to `useStorage`
- Verify existing persisted data deserializes cleanly (both fields optional/null)

**Phase 3 — Problem tracking service** (depends on Phase 2)
- Implement `problemTrackingService.ts`
- Integrate into `PlantDiagnosisModal` after `saveDiagnosis()` call
- Add `canTrackProblems()` to `usePremiumGate()`
- Wire notification tap handler in App.tsx for deep-link (open plant + diagnosis)

**Phase 4 — Hoy screen follow-up tasks** (depends on Phase 2)
- Implement `getFollowUpTasksForDay(plants, diagnosisHistory, today)` in `plantLogic.ts`
- Extend `DiagnosisFollowUp` to show follow-up due date and "due today" highlight
- Wire in TodayScreen

**Phase 5 — Problem timeline** (depends only on existing data in diagnosisHistory)
- Implement `ProblemTimeline` component
- Integrate into `MyPlantDetailModal`
- No new data, reads `diagnosisHistory[plant.id]`

**Phase 6 — Auto-resolve on improvement** (depends on Phase 3 + 4)
- After `analyze()` completes on a follow-up, compare new severity vs. original
- If improved to 'healthy' or 'minor' from 'moderate'/'severe': show "Plant looks better — mark resolved?"
- On confirm: `resolveDiagnosis()` + `cancelFollowUp()`

---

### Notification Deep-Link Pattern

When user taps the follow-up notification, the app should open to the relevant plant's diagnosis. The pattern used for existing notifications is a `data` payload with `type` discriminant. The handler lives in `App.tsx`.

Add to the notification response handler in `App.tsx`:

```typescript
if (data?.type === 'followup-reminder') {
  // Navigate to TodayScreen with plantId and diagnosisId highlighted
  // OR open PlantDiagnosisModal for that plant with resumeDiagnosis=diagnosisId
}
```

Deep navigation into a modal from a notification is a known complexity in React Navigation. The recommended pattern here is: navigate to the plant's tab, then use a local state flag on `TodayScreen` or `PlantsScreen` to auto-open the correct detail modal. This avoids the nested navigator anti-pattern.

---

### Scalability Considerations

| Concern | Current Scale | Implication |
|---------|--------------|-------------|
| diagnosisHistory size | A few diagnoses per plant | AsyncStorage handles easily; no pagination needed |
| Notification limit | iOS: 64 scheduled max | Problem tracking adds at most 1 notification per active diagnosis. With typical 5-20 plants, this is safe |
| Timeline rendering | < 50 diagnoses per plant lifetime | Flat list, no virtualization needed |
| Photo storage | Local URIs only (no cloud in this milestone) | URIs become stale if app is reinstalled; acceptable for MVP. Cloud photo storage deferred to V1.1 auth milestone |

---

## Sources

- Direct codebase analysis: `src/types/index.ts`, `src/hooks/useStorage.tsx`, `src/hooks/usePlantDiagnosis.ts`, `src/utils/notificationScheduler.ts`, `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`, `src/components/DiagnosisFollowUp.tsx`, `src/config/premium.ts`, `src/config/features.ts`
- Architecture documentation: `.planning/codebase/ARCHITECTURE.md`
- Project scope: `.planning/PROJECT.md`

*Analysis date: 2026-03-19*
