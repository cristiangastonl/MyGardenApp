# Project Research Summary

**Project:** My Garden Care — Camera-in-Chat + AI Problem Tracking
**Domain:** Mobile plant care app — AI diagnosis with persistent follow-up tracking
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

This milestone adds two interrelated feature clusters to an already-working Expo SDK 54 / React Native app: camera capture inside the diagnosis chat, and a premium AI-powered problem tracking system that schedules follow-up reminders, surfaces tasks on the "Hoy" screen, and renders a chronological photo timeline per plant. Critically, the existing codebase already contains most of the building blocks — `expo-image-picker`, `expo-notifications`, `diagnosisHistory` in AsyncStorage, `DiagnosisFollowUp` component, and a `SavedDiagnosis` type with `resolved`/`resolvedDate` fields. **Zero new npm packages are required.** The work is wiring and extending, not greenfield construction.

The recommended approach is an additive, phase-gated build: start with camera-in-chat (a single-function change, zero data model impact), then solidify the data model extension before touching any tracking logic, then build the service layer (notifications + storage), then the UI surfaces (Hoy tasks + plant detail timeline). This ordering ensures each phase is independently testable and shippable. Problem tracking is gated behind the existing `DLC_PEST_DIAGNOSIS` flag and `usePremiumGate()` — no new feature flags are needed.

The highest risks are all storage-related: photo URIs from `expo-image-picker` are cache-temporary and will break the timeline on app reinstall; base64 images must be discarded after the edge function call to prevent AsyncStorage bloat (the `plant-agenda-v2` key is a single blob with a ~10 MB practical ceiling on Android); and notification IDs must be persisted so follow-up reminders do not duplicate on app restart. These three mitigations should be treated as prerequisites, not nice-to-haves — skipping them leads to data loss or silent failures that are hard to diagnose post-ship.

---

## Key Findings

### Recommended Stack

No new dependencies. Every capability needed for this milestone is already installed and in many cases already partially wired. The gap is architectural: connecting existing pieces in new combinations. See `STACK.md` for full details.

**Core technologies (existing, reused):**
- `expo-image-picker` 17.0.10 — camera capture in chat; `launchCameraAsync` already exists in `usePlantDiagnosis.ts`, just not surfaced in the chat phase
- `expo-notifications` 0.32.16 — follow-up scheduling via `SchedulableTriggerInputTypes.DATE` one-shot triggers; `notificationScheduler.ts` is already operational
- `@react-native-async-storage/async-storage` 2.2.0 — extend `SavedDiagnosis` with two nullable fields; no key change, no migration needed
- React Native `FlatList` + `Modal` (core) — problem timeline UI modeled on existing `PlantPhotoAlbum.tsx` patterns (~150-200 lines)

**Known risk to mitigate:** Android security patch (2025-09-05) caused `launchCameraAsync` to silently fail on some devices (expo/expo issue #39480). The existing `try/catch` in `pickFromCamera` covers this; test on physical Android device.

### Expected Features

Competitor analysis (Planta, PictureThis, PlantIn, Agrio, GrowMate, Blossom, ChatPlant) reveals clear expectations. See `FEATURES.md` for full breakdown.

**Must have (table stakes):**
- Camera option in the diagnosis chat (action sheet: camera vs. gallery) — gallery-only feels incomplete vs. every competing app
- Camera permission denied → graceful alert with deep-link to Settings
- Follow-up reminder push notification after a non-healthy diagnosis — all diagnosis-oriented apps send this
- Active problem visible in plant detail (not buried in chat history only)
- Manual "Mark as resolved" button — users lose trust in apps that only allow AI-driven resolution
- Status dot on plant card when an active problem exists

**Should have (differentiators):**
- AI-determined follow-up interval (severity-mapped, not user-configured) — removes cognitive burden
- Follow-up task appearing in "Hoy" screen alongside watering/sun tasks — no competitor does this
- Problem timeline with photo history per plant — personal health journal, premium-feeling, sticky
- Dual delivery: push notification + Hoy task (users who dismiss notifications still see the in-app task)

**Defer to later milestone:**
- Re-diagnosis in the same chat thread with prior AI context — high complexity edge function change; deliver as a new chat session for now
- AI auto-resolve with confidence signal — requires prompt engineering iteration; manual resolve covers MVP need
- Severity labels beyond active/resolved — add incrementally once data model is stable

**Anti-features (deliberately excluded):**
- User-configurable follow-up interval — contradicts the "AI decides" value proposition
- Numeric severity scores (e.g., "7/10") — creates anxiety, not clinically meaningful
- Photo edit/crop before sending — adds friction; `allowsEditing: false` is correct

### Architecture Approach

The three build areas are independent and can be developed in sequence without blocking each other. Camera-in-chat has zero data model dependencies. Problem timeline reads only the already-existing `diagnosisHistory`. Problem tracking (scheduling, notifications) is the only area that touches the data model, and it does so via two optional nullable fields on `SavedDiagnosis` — no migration needed. A new `problemTrackingService.ts` bridges `notificationScheduler.ts` and `useStorage`, keeping scheduling logic out of hooks and UI components. See `ARCHITECTURE.md` for full component boundaries and data flow.

**Major components:**
1. `PlantDiagnosisModal.tsx` — add action sheet (camera vs. gallery) to `pickChatPhoto`; add `KeyboardAvoidingView` around chat content
2. `SavedDiagnosis` type — extend with `followUpDate: string | null` and `followUpNotificationId: string | null`
3. `problemTrackingService.ts` (new) — `scheduleFollowUp`, `cancelFollowUp`; severity-to-interval mapping (severe: 3d, moderate: 7d, minor: 14d)
4. `getFollowUpTasksForDay` (new util in `plantLogic.ts`) — stateless task generator for "Hoy" screen, mirrors `getTasksForDay` pattern
5. `ProblemTimeline` (new component) — presentational, reads `diagnosisHistory[plant.id]`, integrates into `MyPlantDetailModal`
6. Notification deep-link handler in `App.tsx` — `Notifications.addNotificationResponseReceivedListener` + `getLastNotificationResponseAsync` for cold start

**Key architectural decisions:**
- Follow-up dates live on `SavedDiagnosis`, not in a parallel collection — avoids stale cross-reference bugs
- Severity-to-interval mapping done on the client from existing `overallStatus` field — avoids edge function deployment and free-form AI number parsing
- Premium gate at task generation time (not render time) — free users never see paywall in Hoy screen

### Critical Pitfalls

See `PITFALLS.md` for full details with warning signs and phase mappings.

1. **Cache URI invalidation** — `expo-image-picker` returns temporary `file://` cache paths that break after OS cache clear or reinstall. Fix: copy to `FileSystem.documentDirectory` immediately after pick; store the persistent path.
2. **AsyncStorage base64 bloat** — storing base64 image data in `SavedDiagnosis` will exceed Android's ~2.5 MB per-operation limit as follow-up photos accumulate. Fix: discard base64 after the edge function call; store file URI only; re-read from disk when needed.
3. **Duplicate follow-up notifications on restart** — notification IDs are not persisted in the current codebase; rescheduling on restart creates duplicates and fills the iOS 64-notification limit. Fix: persist notification IDs to AsyncStorage keyed by `diagnosisId`; check before scheduling.
4. **Keyboard/modal layout conflict** — camera button in a chat input inside a `Modal` conflicts with keyboard dismiss on Android. Fix: add `KeyboardAvoidingView`, call `Keyboard.dismiss()` before launching the picker, set `statusBarTranslucent={true}` on the Modal.
5. **No notification deep-link routing** — tapping a follow-up notification opens the app to the last-visited screen. Fix: implement `addNotificationResponseReceivedListener` with wait-for-storage-load guard before navigating to the specific plant/diagnosis.

---

## Implications for Roadmap

Based on research, the natural build order follows strict dependency flow: the data model must precede tracking; camera is independent and should ship first to unblock re-diagnosis UX.

### Phase 1: Camera in Chat
**Rationale:** Zero data model dependencies, zero service dependencies. Single-function change. Unblocks the re-diagnosis user flow that all subsequent phases assume. Lowest risk, highest visibility.
**Delivers:** Users can take a photo mid-conversation in the diagnosis chat (camera or gallery via action sheet).
**Addresses:** "Camera in chat" table stake; "action sheet" table stake; camera permission handling table stake.
**Avoids:** Pitfall 5 (keyboard/modal conflict) — add `KeyboardAvoidingView` here; Pitfall 11 (redundant permission requests) — check status before requesting.

### Phase 2: Data Model + Storage Layer
**Rationale:** Everything in Phases 3-5 reads from or writes to the extended `SavedDiagnosis` type. Solidifying the data model before building consumers prevents rework. This is also the right phase to fix the base64 bloat and debounce issues that will otherwise cause data loss.
**Delivers:** Extended `SavedDiagnosis` with `followUpDate`/`followUpNotificationId`; `updateDiagnosisFollowUp` action in `useStorage`; base64 discarded after AI call; persistent file URI pattern in place; 100ms debounce removed from `saveDiagnosis`.
**Addresses:** Pitfall 4 (AsyncStorage bloat); Pitfall 1 (cache URI invalidation) for new follow-up photos; Pitfall 13 (debounced save loss); Pitfall 8 (unbounded history — add `parentDiagnosisId` linking or per-parent cap).
**Avoids:** All downstream phases inheriting broken storage patterns.

### Phase 3: Problem Tracking Service + Notifications
**Rationale:** Depends on Phase 2 data model. This phase wires the premium follow-up scheduling: create `problemTrackingService.ts`, integrate into `PlantDiagnosisModal` post-save, add notification deep-link handler in `App.tsx`, and fix i18n gaps in `notificationScheduler.ts`.
**Delivers:** Follow-up notifications scheduled on diagnosis save (premium only); notifications cancelled on resolve; notification tap deep-links to correct plant/diagnosis; all notification strings translated.
**Uses:** `expo-notifications` `SchedulableTriggerInputTypes.DATE`; `canTrackProblems()` premium gate.
**Addresses:** Table stake "follow-up reminder push notification"; Pitfall 2 (duplicate notifications); Pitfall 9 (no deep-link routing); Pitfall 10 (hardcoded Spanish strings).

### Phase 4: Hoy Screen Follow-Up Tasks
**Rationale:** Depends on Phase 2 data model. Can be built in parallel with Phase 3. Follow-up tasks are the in-app complement to push notifications — dual delivery is a key differentiator. Gate at task generation, not render.
**Delivers:** `getFollowUpTasksForDay()` utility; "Follow-up due today" cards on Hoy screen; `Task.type: "followup"` variant; premium gate at generation time.
**Addresses:** "Follow-up task in Hoy" differentiator; Pitfall 6 (premium gate at wrong layer).

### Phase 5: Problem Timeline + Plant Detail UI
**Rationale:** `ProblemTimeline` is a pure presentational component reading already-existing `diagnosisHistory`. It has no dependency on Phases 3-4 — it can be built after Phase 2. The status dot on the plant card is a simple derived value from `diagnosisHistory`.
**Delivers:** `ProblemTimeline` component in `MyPlantDetailModal`; status dot on plant list cards; active problem card in plant detail; manual "Mark as resolved" CTA.
**Addresses:** "Problem visible in plant detail" table stake; "Status indicator on plant card" table stake; "Manual resolve" table stake; "Problem timeline with photo history" differentiator.
**Avoids:** Pitfall 7 (auto-resolve on low-confidence assessment) — user confirmation prompt rather than silent auto-resolve.

### Phase 6: Cleanup + Edge Cases
**Rationale:** Cross-cutting concerns that span multiple phases: plant deletion cleanup, auto-resolve prompt, re-open flow.
**Delivers:** `deletePlant` cancels follow-up notifications and clears `diagnosisHistory[plantId]`; auto-resolve prompt (with confirmation) when re-diagnosis returns "healthy"; manual reopen of resolved diagnoses.
**Addresses:** Pitfall 12 (orphaned notifications on plant delete); Pitfall 7 (auto-resolve false positive).

### Phase Ordering Rationale

- Phase 1 first because it is zero-dependency and immediately user-visible — it also gives the team a complete camera-in-chat flow before complex state management begins.
- Phase 2 before Phases 3-5 because data model correctness is a prerequisite for all consumers. Storage bugs discovered in Phase 3 or 4 would require retroactive data model changes.
- Phases 3 and 4 are order-independent and can run in parallel. Both depend on Phase 2, both feed into Phase 5.
- Phase 5 can start after Phase 2 and does not need to wait for Phases 3-4. The timeline reads existing data.
- Phase 6 wraps cross-phase concerns after the primary flows are proven stable.

### Research Flags

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Camera in chat):** Single-function change with verified code path in codebase. Standard Expo API.
- **Phase 2 (Data model):** Type extension only. AsyncStorage serialization is trivially verified.
- **Phase 5 (Timeline UI):** Pure presentational component modeled on existing `PlantPhotoAlbum.tsx`. FlatList patterns are standard.

Phases that may benefit from targeted research during planning:
- **Phase 3 (Notifications + deep-link):** Cold-start notification navigation in React Navigation modals has known complexity. The pattern in `App.tsx` for `getLastNotificationResponseAsync` timing relative to `StorageProvider` loading should be prototyped early.
- **Phase 6 (Auto-resolve prompt):** The interaction between AI confidence signals and user trust in a health/care context warrants UX review before implementation. The edge case of `overallStatus: 'healthy'` on a blurry photo is real.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Research verified against actual codebase file-by-file; no speculation. All library versions confirmed installed. |
| Features | MEDIUM-HIGH | Competitor analysis cross-referenced across 7 apps; some competitor data is from marketing pages (LOW) but table stakes are corroborated by multiple sources. |
| Architecture | HIGH | Based on direct codebase analysis of `src/types/index.ts`, `useStorage`, `usePlantDiagnosis`, `notificationScheduler.ts`, `PlantDiagnosisModal`, `DiagnosisFollowUp`. Not speculative. |
| Pitfalls | HIGH | Critical pitfalls (1, 2, 4) are confirmed against `.planning/codebase/CONCERNS.md` audit. Pitfalls 3, 5, 9 are well-documented Expo patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **AI auto-resolve confidence threshold:** The `diagnosePlant` function returns per-issue confidence scores but no overall assessment confidence. The auto-resolve threshold (suggested: 80%) cannot be validated without testing the edge function with deliberately bad photos. Validate in Phase 6 before shipping.
- **Notification cold-start timing:** The exact sequence for handling `getLastNotificationResponseAsync` relative to `StorageProvider` `loading === false` needs a prototype run on a physical device. Do not assume simulator behavior matches.
- **diagnosisHistory unbounded growth:** PITFALLS.md recommends a `parentDiagnosisId` linking pattern to cap follow-up chains. The exact cap (suggested: 10 per parent) should be confirmed against realistic user behavior before baking it into the data model. A daily-use gardener tracking a severe problem for a month would hit this cap.
- **Existing `SavedDiagnosis.imageUri` / `imageUris` fields:** These already store cache paths for existing diagnoses. The Phase 2 data model work should decide whether to retroactively migrate these or only fix new captures. Retroactive migration requires a one-time `FileSystem.moveAsync` pass on app upgrade — add to Phase 2 scope if prioritized.

---

## Sources

### Primary (HIGH confidence)
- Expo ImagePicker docs: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Expo Notifications docs: https://docs.expo.dev/versions/latest/sdk/notifications/
- Apple Human Interface Guidelines (Action Sheets): https://developer.apple.com/design/human-interface-guidelines/components/presentation/action-sheets
- Direct codebase analysis: `src/types/index.ts`, `src/hooks/useStorage.tsx`, `src/hooks/usePlantDiagnosis.ts`, `src/utils/notificationScheduler.ts`, `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`, `src/components/DiagnosisFollowUp.tsx`, `src/components/PlantPhotoAlbum.tsx`
- `.planning/codebase/CONCERNS.md` (2026-03-19 audit)

### Secondary (MEDIUM confidence)
- Best Plant Care Apps 2026 — MyPlantIn blog (cross-referenced with App Store listings)
- Planta App Store listing (official)
- Agrio official product page
- KeyboardAvoidingView in modals — community reference (pattern confirmed in Expo docs)
- LLM structured output 2026 — dev.to (Gemini response_schema pattern)

### Tertiary (LOW confidence)
- GrowMate marketing page — feature claims unverified by independent review
- AI Plant Doctor app — small app, limited reviews

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
