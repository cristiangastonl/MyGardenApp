# Domain Pitfalls

**Domain:** Camera-in-chat + AI follow-up scheduling + photo problem timeline (plant care app)
**Researched:** 2026-03-19
**Codebase:** My Garden Care — Expo SDK 54, React Native, AsyncStorage local-first, Supabase edge functions, RevenueCat

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or broken user flows.

---

### Pitfall 1: Storing Follow-Up Photo URIs from expo-image-picker Directly in AsyncStorage

**What goes wrong:** expo-image-picker returns `file://` URIs pointing to the app's cache directory (e.g., `file:///data/user/0/com.app/cache/ImagePicker/uuid.jpeg`). These are temporary files. After an OS cache clear, app update, or full reinstall, those paths no longer exist. The diagnosis timeline in `PlantDetailModal` renders broken images. The existing codebase already does this for initial diagnosis photos (`SavedDiagnosis.imageUri`, `imageUris`), so the new follow-up photos will inherit the same flaw.

**Why it happens:** It appears to work during development because the cache persists across hot reloads. The bug only surfaces after production events: clearing app storage, upgrading the app, or the OS reclaiming cache space.

**Consequences:** User sees the plant problem timeline with blank photo slots. Tapping a follow-up diagnosis shows no visual history. Worst case: `JSON.parse` of corrupted photo metadata throws, silently wiping the diagnosis (known bug in `useStorage.tsx` line 363-371 per CONCERNS.md).

**Prevention:**
- After `ImagePicker` returns, immediately copy the file to a persistent directory using `expo-file-system`: `FileSystem.moveAsync({ from: pickerUri, to: FileSystem.documentDirectory + 'diagnoses/' + diagnosisId + '/' + filename })`.
- Store the persistent path, not the cache path.
- For the existing `SavedDiagnosis.imageUri` / `imageUris` fields, add the same migration as part of this milestone's data layer work.

**Warning signs:**
- Image thumbnails in diagnosis history disappear after a test install or app update during development.
- `FileSystem.getInfoAsync(uri).exists` returns `false` for stored diagnosis URIs on a fresh install.

**Phase mapping:** Must be addressed in the phase that implements the follow-up photo capture flow. Retrofitting the existing diagnosis photos is a bonus but can be a separate cleanup task.

---

### Pitfall 2: Follow-Up Notification IDs Not Persisted — Duplicates on App Restart

**What goes wrong:** The existing `notificationScheduler.ts` already has this flaw: notification IDs returned by `scheduleNotificationAsync` are never stored. For follow-up diagnosis reminders, this is worse because they are keyed to a specific `diagnosisId` and `followUpDate`. If the app is killed and restarted, there is no way to know whether the notification was already scheduled. Calling the scheduling function again creates a duplicate. The cancel logic then fails to find the right notification because it searches by content type, not by ID (confirmed fragile area, CONCERNS.md line 165-169).

**Why it happens:** The scheduling utility was built for daily morning reminders (one at a time, easy to just cancel-all). Follow-up reminders are per-diagnosis and could accumulate quickly.

**Consequences:** User receives the same follow-up reminder 2-5 times on the same day after app restarts. On iOS, the 64 system-scheduled notification limit is hit faster, causing later reminders to silently fail.

**Prevention:**
- Store notification IDs in AsyncStorage under a structured key: `scheduled_notifications` → `{ [diagnosisId]: { followUpNotifId: string, scheduledFor: string } }`.
- On app start, load the map and skip scheduling if an ID already exists for a diagnosis + date pair.
- Before scheduling a new follow-up, cancel the old one by ID if it exists in the map.
- This is also the right time to fix the morning reminder ID storage problem from CONCERNS.md.

**Warning signs:**
- Running the app in a simulator, force-quitting, relaunching, and seeing duplicate notifications in the system tray.
- `Notifications.getAllScheduledNotificationsAsync()` returns multiple entries with the same `diagnosisId` in their data payload.

**Phase mapping:** The notification scheduling phase. Do not defer; duplicate notifications are a user-facing quality issue that will generate app reviews.

---

### Pitfall 3: AI-Returned Follow-Up Interval Is Not Validated — Free-Form Text in Schedule

**What goes wrong:** The plan is for the AI (edge function) to decide the follow-up interval based on problem severity. The `chatDiagnosis` edge function currently returns free-form `reply` text plus `updatedTips`. Adding a `followUpDays` field to this response is straightforward, but LLMs do not reliably return structured integers even when instructed. Common failures: the model returns `"3-5 days"` (string range, not an int), `null` when it thinks the plant is healthy, `0` (which would fire an immediate notification), or a very large number like `30` for a severe problem.

**Why it happens:** The current `diagnose-plant` and `chat-diagnosis` edge functions do not use structured output mode (Gemini's `response_schema` or OpenAI's function calling). They parse JSON from the model response text, which already fails silently in some cases.

**Consequences:** A follow-up interval of `0` days would immediately create a notification and a task in "Hoy" for a diagnosis that was just completed. An interval of `null` would cause the scheduling code to call `new Date(NaN)`, generating an invalid trigger and a silent notification failure.

**Prevention:**
- In the edge function, define a strict response schema for the follow-up field. Use Gemini's `response_schema` or a Zod/JSON Schema validation layer on the server.
- In the client, validate the returned `followUpDays` before using it: must be a positive integer in the range 1–30. If invalid, fall back to a severity-based default map: `{ severe: 3, moderate: 7, minor: 14, healthy: null }`.
- Never pass an AI-returned number directly to `new Date()` arithmetic without clamping.

**Warning signs:**
- Test the edge function with a "healthy" plant photo — check whether `followUpDays` comes back as `null`, `0`, or a string.
- Check the existing `chatDiagnosis` mock in `plantDiagnosis.ts` — it returns `updatedTips: []` with no follow-up field at all. If the client uses `undefined` as `0`, it schedules immediately.

**Phase mapping:** Edge function work (wherever follow-up scheduling is wired into the AI response).

---

### Pitfall 4: AsyncStorage Bloat from Base64 Photos in the Diagnosis Timeline

**What goes wrong:** The existing `SavedDiagnosis` stores base64 images in the `images` field via `usePlantDiagnosis` (base64 is fetched at capture time). The new follow-up flow adds more photos per diagnosis over time. A single uncompressed device photo is 3-6 MB; at `quality: 0.5` it is still 400-900 KB. Base64 encoding adds ~33% overhead. Three follow-up photos per diagnosis × 5 active diagnoses = 6-13 MB, which exceeds the ~10 MB AsyncStorage practical limit. Android has a hard per-operation limit around 2.5 MB.

**Why it happens:** The current flow captures base64 at picker time (necessary for the edge function call). The base64 is never discarded after use — it persists in the `images` state and then into `SavedDiagnosis.imageUris`. The diagnosis history is appended-only (no pruning per CONCERNS.md line 61-65).

**Consequences:** AsyncStorage reads slow down. On Android, writes start throwing. The entire `AppData` blob (the single key `plant-agenda-v2`) may fail to save, causing data loss for all plants, not just diagnoses.

**Prevention:**
- After calling the edge function, discard the base64. Store only the persistent file URI (per Pitfall 1). Base64 is only needed for the API call.
- `usePlantDiagnosis` should clear `images[n].base64` from state after analysis completes: `setImages(prev => prev.map(img => ({ ...img, base64: '' })))`.
- For the photo timeline, load images lazily from disk using the stored file URI, not from stored base64.
- If base64 is needed for the timeline AI re-analysis, read it fresh from disk at call time: `FileSystem.readAsStringAsync(uri, { encoding: 'base64' })`.

**Warning signs:**
- Call `AsyncStorage.getItem('plant-agenda-v2')` after a multi-photo diagnosis and log the byte size. Any single diagnosis entry > 500 KB is a red flag.
- Test with 5 diagnoses, each with 3 photos; measure AsyncStorage write time before and after.

**Phase mapping:** Any phase that adds follow-up photo capture. This is the highest-impact storage risk.

---

### Pitfall 5: Camera Inside a Modal with a Chat Input Creates Keyboard/Layout Conflicts

**What goes wrong:** The diagnosis modal is a `Modal` with `animationType="slide"` that contains a `DiagnosisResults` chat interface. When the user taps the chat input (keyboard up), then taps the camera button to attach a photo-in-chat, the keyboard dismiss and the camera picker open race on both iOS and Android. On Android, if `statusBarTranslucent` is not set on the Modal, the keyboard dismiss animation causes a layout jump that makes the camera option button briefly invisible. On iOS, returning from the camera picker while the keyboard was previously open leaves the input bar in an incorrect position.

**Why it happens:** `KeyboardAvoidingView` inside React Native `Modal` requires manual `keyboardVerticalOffset` tuning that is different from the same component outside a modal. The existing `PlantDiagnosisModal` does not wrap its content in `KeyboardAvoidingView` at all — this works for the current flow but will break when the chat input and a camera button must coexist.

**Consequences:** The attach-photo button in the chat area is unreachable or invisible on Android after the keyboard opens. On iOS, the post-camera return leaves the modal in a visually broken state that requires a tap to recover.

**Prevention:**
- Add `KeyboardAvoidingView` around the `DiagnosisResults` chat content with `behavior="padding"` on iOS and `behavior="height"` on Android.
- Set `statusBarTranslucent={true}` on the outer `Modal`.
- Dismiss the keyboard explicitly (`Keyboard.dismiss()`) before launching the camera picker: call it in the `onPickChatPhoto` callback before the `ImagePicker.launchCameraAsync` call.
- Test this interaction on a physical Android device with the software keyboard, not just the simulator.

**Warning signs:**
- Tap chat text input → keyboard opens → tap camera icon → notice the camera option moves or disappears.
- Check if `Platform.OS === 'android'` requires different `keyboardVerticalOffset` values inside the modal (it does).

**Phase mapping:** The camera-in-chat phase. This is a polish issue but will appear immediately in user testing.

---

## Moderate Pitfalls

Mistakes that create poor UX or future tech debt.

---

### Pitfall 6: Premium Gate Shown After Each Follow-Up Task Tap on "Hoy" Screen

**What goes wrong:** The plan adds follow-up diagnosis tasks to the "Hoy" screen (Today) for premium users. `getTasksForDay` in `plantLogic.ts` is a pure function that returns `Task[]`. The current `Task` type only has `type: "water" | "sun" | "outdoor"`. Adding a `type: "followup"` variant requires changes across `TodayScreen.tsx`, `taskButton.tsx`, and `plantLogic.ts`. If the premium check for tapping a follow-up task is not implemented consistently, free users who somehow receive a follow-up task (e.g., from a state migration bug) will see the paywall repeatedly.

**Prevention:**
- Extend `Task.type` to include `"followup"` with an associated `diagnosisId` field.
- Filter follow-up tasks in `getTasksForDay` (or a new `getFollowUpTasksForDay`) behind the `isPremium` check at generation time, not at render time. If the task is never generated for free users, the paywall trigger never fires.
- The `TodayScreen` premium check pattern should gate task generation, not just task rendering.

**Warning signs:**
- A free-tier test account shows a follow-up task card on "Hoy".
- Tapping the task shows the paywall, but tapping the same area again also shows the paywall (double-trigger).

**Phase mapping:** Hoy screen integration phase.

---

### Pitfall 7: Auto-Resolve Logic Triggers on Low-Confidence AI Assessment

**What goes wrong:** The plan states: "If AI sees improvement → auto-marks as resolved." The `DiagnosisResult.overallStatus` field uses `'healthy' | 'minor' | 'moderate' | 'severe'`. If a follow-up photo is blurry, badly lit, or shows an angle the AI cannot assess, the model may return `'healthy'` at low confidence simply because it cannot see any visible problem. The app would then auto-resolve a diagnosis that is still active, removing the user's reminder and task.

**Why it happens:** The current `diagnosePlant` function returns `overallStatus` but no model confidence score for the overall assessment (only per-issue `confidence: number`). The auto-resolve check would operate on `overallStatus === 'healthy'` alone.

**Consequences:** User's severe fungus problem gets auto-resolved after a dark follow-up photo. The reminder disappears. The user assumes the app confirmed recovery and delays treatment. The plant gets worse.

**Prevention:**
- Do not auto-resolve on `overallStatus: 'healthy'` alone.
- Require either: (a) the AI explicitly states recovery with a minimum overall confidence ≥ 80%, OR (b) the user manually confirms.
- Consider a two-step: "The AI thinks your plant looks better. Mark as resolved?" with a CTA rather than silent auto-resolve.
- Add an `autoResolved: boolean` field to `SavedDiagnosis` so auto-resolves are distinguishable from manual ones in the timeline.

**Warning signs:**
- Test with a blurry follow-up photo of a healthy-looking background (not the plant). If the diagnosis returns `'healthy'`, auto-resolve fires incorrectly.

**Phase mapping:** AI auto-resolve logic phase. This is a trust issue — wrong auto-resolves will erode user confidence in the feature.

---

### Pitfall 8: diagnosisHistory Grows Unbounded with Follow-Up Entries

**What goes wrong:** The existing `diagnosisHistory` in `AppData` already has no pruning (CONCERNS.md line 61-65). Each follow-up diagnosis creates a new `SavedDiagnosis` entry under the same plant. A user who tracks a fungal problem for 3 weeks at 3-day intervals generates 7 follow-up diagnoses for one problem. Multiply by 5 tracked problems and the history becomes large, slow to scan, and eventually causes write failures (see Pitfall 4).

**Prevention:**
- Model follow-up diagnoses as children of a parent `ProblemTracking` record, not as independent `SavedDiagnosis` entries. This keeps history navigable and bounded.
- Alternatively, link follow-up diagnoses via a `parentDiagnosisId` field on `SavedDiagnosis` and cap follow-ups per parent at 10.
- When resolving a problem, archive its follow-up chain rather than leaving it in the main history array.

**Warning signs:**
- `diagnosisHistory[plantId].length > 10` for any single plant after moderate use.

**Phase mapping:** Data model design phase (before implementing storage mutations).

---

### Pitfall 9: Notification Deep-Link Does Not Navigate to the Correct Diagnosis

**What goes wrong:** A follow-up reminder notification tapped while the app is in the background (cold start) must open the specific plant's diagnosis detail. The existing codebase has no notification response handler and no deep-link routing. Without implementing `Notifications.addNotificationResponseReceivedListener`, tapping the notification opens the app to the last visited screen, not the relevant diagnosis. On cold start, the app may not have loaded `diagnosisHistory` from AsyncStorage yet when the listener fires.

**Why it happens:** The existing `scheduleCareReminder` and related functions store `plantId` in `notification.content.data`. A follow-up notification would also need `diagnosisId`. But there is no existing code to consume `notification.content.data` on tap.

**Consequences:** User taps "Time to check your Monstera" notification, app opens to "Hoy" screen with no indication of which plant or problem to look at. User frustration. Feature feels broken.

**Prevention:**
- Implement `Notifications.addNotificationResponseReceivedListener` in `App.tsx` (or a top-level hook).
- Store `{ plantId, diagnosisId }` in the notification's `data` field.
- On notification tap, wait for `StorageProvider` loading to complete (`loading === false`), then navigate to the plant detail modal filtered to the active diagnosis.
- Handle the "app was closed" case: read `Notifications.getLastNotificationResponseAsync()` on app start and navigate accordingly.

**Warning signs:**
- Schedule a test follow-up notification, force-quit the app, tap the notification — does it navigate to the right place?
- Check whether `diagnosisHistory` is loaded before the navigation handler fires.

**Phase mapping:** Push notification integration phase.

---

### Pitfall 10: i18n Keys Missing for Follow-Up Notification Strings

**What goes wrong:** The existing `notificationScheduler.ts` mixes translated strings (via `i18n.t(...)`) with hardcoded Spanish strings (`"Buenos dias!"`, `"Hora de sacar las plantas!"`, `"🥶 Alerta de frío para tus plantas"`). The cancel logic searches by the hardcoded Spanish title (confirmed bug, CONCERNS.md line 165-169). Adding follow-up notifications the same way means the English locale will receive Spanish notification text and cancellation will break for English users.

**Prevention:**
- Add translation keys for all new follow-up notification strings in both `en/common.json` and `es/common.json` before implementing the scheduler.
- Store the scheduled notification `identifier` (not the content title) to look up and cancel.
- Do a pass to replace the hardcoded Spanish strings in `notificationScheduler.ts` as part of this milestone.

**Warning signs:**
- Switch the app language to English in Settings, then trigger a follow-up reminder notification. The notification body appears in Spanish.

**Phase mapping:** Notification content phase.

---

## Minor Pitfalls

Issues that create technical debt or confuse edge-case users.

---

### Pitfall 11: Camera Permission Request on Every Chat Photo Attach

**What goes wrong:** The current `pickFromCamera` in `usePlantDiagnosis.ts` calls `requestCameraPermissionsAsync()` every time. On iOS, once permission is granted, repeated calls are silent. On Android 13+, the permission is remembered but re-requesting can trigger an unexpected system dialog in some ROM variants. In a chat UI where the user attaches multiple photos across a session, this generates unnecessary permission requests.

**Prevention:**
- Check permission status first with `getCameraPermissionsAsync()`. Only call `requestCameraPermissionsAsync()` if status is not `'granted'`.
- The same applies to `pickChatPhoto` in `PlantDiagnosisModal`, which currently requests media library permission each time.

**Phase mapping:** Camera integration cleanup, same phase as camera-in-chat work.

---

### Pitfall 12: Problem Tracking State Not Cleaned Up When a Plant Is Deleted

**What goes wrong:** `diagnosisHistory` is keyed by `plantId`. When `deletePlant` is called in `useStorage.tsx`, it removes the plant from `plants[]` but does not clean up `diagnosisHistory[plantId]`. Follow-up notifications scheduled for that plant's diagnosis ID will still fire. Tapping them will try to navigate to a plant that no longer exists.

**Prevention:**
- Extend the `deletePlant` mutation to also: (a) delete `diagnosisHistory[plantId]`, and (b) cancel any scheduled notifications whose `content.data.plantId` matches (using the stored notification ID map from Pitfall 2's fix).

**Warning signs:**
- Delete a plant that has an active follow-up diagnosis. Fire the scheduled notification. App crashes or shows empty state with no recovery path.

**Phase mapping:** Can be addressed in the plant deletion flow as part of the data cleanup work.

---

### Pitfall 13: The 100ms Debounced Save Risks Losing a Follow-Up Photo Entry

**What goes wrong:** The existing 100ms debounce on AsyncStorage saves (CONCERNS.md line 12-17) means that if the user takes a follow-up photo and immediately force-quits the app, the new `SavedDiagnosis` entry may not have been written. This is a pre-existing flaw, but it becomes more visible with follow-up tracking because users are expected to open the app, take a quick photo, and close it — exactly the timing window where data loss occurs.

**Prevention:**
- `saveDiagnosis` and `addChatMessage` should be treated as write-through operations (no debounce): call `AsyncStorage.setItem` immediately after the state update for these mutations.
- The 100ms debounce can remain for lower-priority updates (watering logs, settings).

**Phase mapping:** The storage mutation layer for follow-up tracking. Worth fixing as part of the data model work.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Camera button added to chat input area | Keyboard + modal layout conflict (Pitfall 5) | Add `KeyboardAvoidingView`, call `Keyboard.dismiss()` before launching picker |
| Follow-up photo capture | Cache URI invalidation after update (Pitfall 1) | Copy to documentDirectory immediately after pick |
| Follow-up photo storage | AsyncStorage bloat from base64 (Pitfall 4) | Discard base64 after edge function call, store file URI only |
| AI returns follow-up interval | Non-integer or null from LLM (Pitfall 3) | Server-side schema + client-side clamp to 1-30 days |
| Scheduling follow-up notifications | Duplicate notifications on restart (Pitfall 2) | Persist notification IDs in AsyncStorage, check before scheduling |
| Auto-resolve on "healthy" status | Low-confidence false positive (Pitfall 7) | Require confidence threshold or user confirmation |
| Notification tap handler | No deep-link routing to diagnosis (Pitfall 9) | Implement response listener before merge |
| Hoy screen follow-up tasks | Premium gate at wrong layer (Pitfall 6) | Gate at task generation, not render |
| Plant deletion | Orphaned follow-up notifications and history (Pitfall 12) | Cancel notifications and clear history in deletePlant |
| i18n for new notifications | Hardcoded Spanish strings (Pitfall 10) | Add translation keys before writing scheduler code |

---

## Sources

- Expo ImagePicker documentation: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Expo Notifications documentation: https://docs.expo.dev/versions/latest/sdk/notifications/
- [expo-image-picker Android URI issue #11214](https://github.com/expo/expo/issues/11214)
- [expo-image-picker cache dir not readable #3706](https://github.com/expo/expo/issues/3706)
- [AsyncStorage extreme optimization — Sendbird](https://medium.com/@Sendbird/extreme-optimization-of-asyncstorage-in-react-native-b2a1e0107b34)
- [Stop using AsyncStorage: MMKV is 10x faster](https://medium.com/@nomanakram1999/stop-using-asyncstorage-in-react-native-mmkv-is-10x-faster-82485a108c25)
- [LLM structured output 2026](https://dev.to/pockit_tools/llm-structured-output-in-2026-stop-parsing-json-with-regex-and-do-it-right-34pk)
- [KeyboardAvoidingView in modals — Medium](https://medium.com/@felippepuhle/react-native-quick-tip-solving-keyboardavoidingview-problems-on-screens-using-native-headers-or-1c77b5ec417c)
- [Adding AI to Expo React Native — CodeMiner42](https://blog.codeminer42.com/thinking-about-adding-ai-to-your-expo-react-native-app-read-this-first/)
- Codebase analysis: `.planning/codebase/CONCERNS.md` (2025-03-19 audit)
