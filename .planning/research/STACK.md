# Technology Stack — Additive Research

**Project:** My Garden Care — Camera-in-chat + AI Problem Tracking milestone
**Researched:** 2026-03-19
**Scope:** Additive only. Base stack (React Native, Expo SDK 54, Supabase, AsyncStorage) is established. This covers only the three new capability areas.

---

## Finding 1: Camera Capture in Chat

### Verdict: No new library needed. Wire existing code.

**Confidence: HIGH** (verified by reading the actual codebase)

`expo-image-picker` 17.0.10 is already installed, and `launchCameraAsync` is already wired in `usePlantDiagnosis.ts` with correct permissions handling. The `CameraCapture` component already exposes an `onPickCamera` prop. The diagnosis chat flow (`PlantDiagnosisModal`) already calls `pickFromCamera` from the hook.

The gap is architectural, not a missing library: the chat's input row does not surface a camera button after initial photo selection. The `sendChatMessage` API signature already accepts `imageBase64` and `imageUri` parameters, so the hook is ready to accept mid-conversation camera shots.

**What to build (no new installs):**

- Add a camera icon button to the chat input row inside `PlantDiagnosisModal` (after initial diagnosis is complete and the conversation is active)
- On tap: call `ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.5, base64: true })` — same options already used
- On success: call `sendChatMessage('', asset.base64, asset.uri)` to attach the image to the next AI message
- The `DiagnosisChatMessage` type already has `imageUri` field — no type changes needed

**Permissions note:** `NSCameraUsageDescription` must be in `app.json` Info.plist strings. Verify it is present (it likely is given existing camera usage in identification flow). The `requestCameraPermissionsAsync()` call is already in `pickFromCamera`, reuse the same pattern.

**Known issue to watch:** A 2025 Android security patch (2025-09-05) caused `launchCameraAsync` to silently fail on some devices (issue #39480 on expo/expo). Mitigation: wrap the call in try/catch with user-visible error (already done in existing `pickFromCamera`) and test on physical Android device, not only emulator.

---

## Finding 2: AI Follow-up Scheduling (Local)

### Verdict: No new library needed. Extend existing notification + storage infrastructure.

**Confidence: HIGH** (verified against official Expo docs and existing notificationScheduler.ts)

**Storage:** The `AppData` type in AsyncStorage needs a new top-level key for problem tracking. The existing `diagnosisHistory: Record<string, SavedDiagnosis[]>` holds diagnoses per plant but `SavedDiagnosis` lacks scheduling metadata. Extend the type:

```typescript
// Additive to SavedDiagnosis
followUp?: {
  nextCheckDate: string;        // ISO date string, AI-determined
  intervalDays: number;         // what the AI recommended
  notificationId: string | null; // expo-notifications identifier for cancellation
  checkCount: number;           // how many follow-ups done so far
}
```

No new storage library is needed. Keep everything in the existing `plant-agenda-v2` AsyncStorage key via `useStorage`.

**Notifications:** `expo-notifications` 0.32.16 is already installed and the codebase has a mature `notificationScheduler.ts` with `scheduleNotificationAsync`. For follow-up reminders, use `SchedulableTriggerInputTypes.DATE` (one-shot trigger at a specific future `Date` object). This is documented as supported on both iOS and Android in the current Expo docs.

```typescript
// Pattern to add to notificationScheduler.ts
await Notifications.scheduleNotificationAsync({
  content: {
    title: '...',
    body: '...',
    data: { type: 'diagnosis-followup', plantId, diagnosisId },
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(nextCheckDate),
  },
});
```

Store the returned identifier in `followUp.notificationId` so it can be cancelled when the problem resolves or the user manually closes it.

**Task integration:** `getTasksForDay()` in `plantLogic.ts` is stateless and recalculates from plant data. The follow-up tasks for the "Hoy" screen should follow the same pattern: a new task generator function that reads `diagnosisHistory`, finds active diagnoses with `followUp.nextCheckDate === today`, and returns tasks. Extend the `Task` type with `type: "followup"`.

**AI-determined interval:** The edge function (`diagnose-plant`) response should be extended to return a suggested `followUpDays: number | null`. Parse this in `usePlantDiagnosis` and store it. No schema change to the edge function's external API is required — add it as a nullable field that existing clients silently ignore.

---

## Finding 3: Photo Timeline / History UI

### Verdict: Build custom. No external library justified.

**Confidence: HIGH** (based on library audit + existing codebase patterns)

**Why not `react-native-timeline-flatlist`:** Last published 4 years ago (v0.8.0, circa 2021). No React 19 or Expo SDK 54 compatibility signal. Only 9 downstream dependents. Unmaintained.

**Why not `react-native-gifted-chat`:** Designed for real-time messaging, not photo timelines. Carries `react-native-reanimated` and `FlashList` peer deps that conflict with current RN 0.82+ / Expo SDK 54 stack (documented compatibility issues in 2025). Heavy for what is a read-mostly display component.

**What to build:** A `DiagnosisTimeline` component using React Native's `FlatList` (already used across the codebase). The data model is already in place (`SavedDiagnosis[]` per plant, ordered by `date`). Each timeline entry is:

- A date badge
- Thumbnail of diagnosis photo(s)
- Status chip (active / resolved)
- Summary of issues found
- "Follow up" or "Re-open" CTA

This is ~150-200 lines of StyleSheet code following existing patterns in `PlantPhotoAlbum.tsx` (which already has thumbnail grid, fullscreen modal, FlatList layout). Use the same `THUMB_SIZE` math and `shadows.md` from `theme.ts`.

The fullscreen photo viewer for tapping a timeline photo: `Modal` + `Image` with `resizeMode="contain"` — already implemented in `PlantPhotoAlbum.tsx`, extract or copy that pattern.

---

## Dependency Delta

No new npm packages are required for this milestone. All capabilities exist in already-installed packages.

| Capability | Library | Already Installed | Version |
|---|---|---|---|
| Camera capture in chat | `expo-image-picker` | YES | 17.0.10 |
| Follow-up notification scheduling | `expo-notifications` | YES | 0.32.16 |
| Local follow-up data storage | `@react-native-async-storage/async-storage` | YES | 2.2.0 |
| Photo timeline UI | React Native `FlatList` + `Modal` | YES | (core) |
| Image compression | `expo-image-manipulator` | YES | 14.0.8 |

---

## Alternatives Considered

| Category | Rejected | Why |
|---|---|---|
| Timeline UI | `react-native-timeline-flatlist` | Unmaintained (4 years, v0.8.0), no React 19 signal |
| Chat UI | `react-native-gifted-chat` | Reanimated version conflicts with SDK 54; overkill for existing custom chat |
| Background scheduling | `react-native-background-task` | Not needed — follow-up checks happen when app is opened (app-launch check pattern), notifications are sufficient for reminders |
| Dedicated camera library | `expo-camera` (direct) | `expo-image-picker` wraps it and is already installed; direct use adds no benefit |

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Android security patch breaks `launchCameraAsync` silently | LOW (patched in newer expo-image-picker) | Test on physical device; existing error handling catches it |
| iOS `DATE` trigger fires incorrectly on older iOS | LOW (current Expo docs confirm iOS + Android support) | Fallback: compute seconds delta and use `TIME_INTERVAL` trigger as the existing `scheduleWeatherAlert` does |
| AsyncStorage serialization size for diagnosis history with follow-up metadata | LOW | Follow-up metadata is <100 bytes per diagnosis; typical user has <20 diagnoses |
| Notification identifier lost if app is reinstalled | MEDIUM | On next app open, scan `diagnosisHistory` for active diagnoses without valid notification IDs and re-schedule; implement in an app-launch side effect |

---

## Sources

- Expo ImagePicker docs (current): https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Expo Notifications docs (current): https://docs.expo.dev/versions/latest/sdk/notifications/
- expo/expo issue #39480 (Android camera regression): https://github.com/expo/expo/issues/39480
- react-native-timeline-flatlist npm (last published date): https://www.npmjs.com/package/react-native-timeline-flatlist
- react-native-gifted-chat issue #2670 (RN 0.82 incompatibility): https://github.com/FaridSafi/react-native-gifted-chat/issues/2670
- Codebase: `src/utils/notificationScheduler.ts`, `src/hooks/usePlantDiagnosis.ts`, `src/components/PlantIdentifier/CameraCapture.tsx`, `src/components/PlantPhotoAlbum.tsx`, `src/types/index.ts`
