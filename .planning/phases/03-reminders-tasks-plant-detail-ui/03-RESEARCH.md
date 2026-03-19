# Phase 3: Reminders, Tasks & Plant Detail UI - Research

**Researched:** 2026-03-19
**Domain:** React Native / Expo — notification deep-linking, in-app task surfaces, modal UI composition
**Confidence:** HIGH

## Summary

Phase 3 closes the loop on the problem-tracking feature built in Phase 2. All the data it needs already exists in AsyncStorage: `SavedDiagnosis.followUpDate`, `isTracked`, `trackingStatus`, `entries[]`, and `followUpNotificationId`. The notification payload (`type: 'followup-reminder'`, `plantId`, `diagnosisId`) was purposely structured in Phase 2 to support navigation. Phase 3 has three distinct work streams: (1) a Hoy-screen task surface for follow-up due dates, (2) notification tap-to-navigate deep linking, and (3) plant detail UI additions (active problem section + problem timeline with entries).

No new dependencies are needed. All UI patterns, theme tokens, and i18n infrastructure already exist and are well established. The only non-trivial engineering challenge is cold-start notification navigation: the NavigationContainer must be ready before the notification response is processed.

**Primary recommendation:** Build in three plans — (A) Hoy follow-up task cards, (B) notification deep-link handler wired through App.tsx, (C) plant detail problem section + timeline. Keep all changes additive and premium-gated.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTF-02 | Follow-up task appears in "Hoy" screen on the follow-up date (premium only) | `diagnosisHistory` already flows into TodayScreen; `followUpDate` and `isTracked` on SavedDiagnosis are ready to filter on |
| NOTF-03 | Tapping the push notification navigates to the plant's detail or diagnosis flow | Notification payload already carries `plantId` + `diagnosisId`; `addNotificationResponseReceivedListener` skeleton exists in `useNotifications.ts`; cold-start handled via `Notifications.getLastNotificationResponseAsync()` |
| UI-01 | Active problems shown as a section/card in the plant detail screen | `MyPlantDetailModal` has a `historySection` pattern ready to clone; `getDiagnosesForPlant` already available via `useStorage` |
| UI-02 | Problem timeline shows chronological photo history with AI notes per entry | `SavedDiagnosis.entries[]` (type `ProblemEntry`) has `photoUri`, `aiNotes`, `date`, `statusChange`; need new `ProblemTimeline` component |
| UI-03 | Status indicator (dot or badge) on plant card in plant list when plant has active problem | `PlantCard` already has `hasActiveDiagnosis` prop and `diagnosisBadge` style — needs to surface tracking status, not just presence |
| UI-04 | Problem card shows current status, severity label, last check date, and next follow-up date | `TRACKING_STATUS_CONFIG` in `problemTrackingService.ts` has emoji + label keys; `followUpDate` and `trackingStatus` are on `SavedDiagnosis` |
</phase_requirements>

---

## Standard Stack

No new dependencies. All tooling was established in Phases 1 and 2.

### Core (already installed)
| Library | Purpose | How Used in Phase 3 |
|---------|---------|---------------------|
| `expo-notifications` | Push notifications + response listener | `getLastNotificationResponseAsync()` for cold-start, `addNotificationResponseReceivedListener` for foreground/background |
| `@react-navigation/bottom-tabs` | Tab navigator with `navigate()` | Navigate to "Hoy" or open plant detail modal on notification tap |
| `react-i18next` | i18n | All new strings through `t()` |
| `react-native` `Image` | Render persisted `photoUri` in timeline | Already used throughout |
| `AsyncStorage` via `useStorage` | Source of truth | Read `diagnosisHistory`, `followUpDate`, `isTracked`, `entries[]` |

### No New Packages Needed
The roadmap explicitly states: "No new dependencies required." Confirmed by code audit — all necessary APIs are present.

---

## Architecture Patterns

### Recommended Approach Per Requirement

#### NOTF-02: Follow-Up Task Cards in Hoy Screen

**What exists:** TodayScreen already has a `<DiagnosisFollowUp>` component that renders active (unresolved) diagnoses. It checks `!d.resolved && d.result.overallStatus !== 'healthy'`.

**What's needed:** A separate task card (or a new filter on the existing component) that specifically surfaces diagnoses where `isTracked === true`, `trackingStatus !== 'resolved'`, and `isSameDay(new Date(d.followUpDate), today)`. This is a premium-only surface.

**Pattern options:**
- Option A (simpler): Add a `followUpDueToday` filter inside `DiagnosisFollowUp.tsx` and render a distinct "due today" visual variant.
- Option B (cleaner separation): A new `FollowUpTaskCard` component, inserted in TodayScreen above the existing `DiagnosisFollowUp` section.

Option B is recommended because the "due today" task card has a different CTA ("Check on plant now" → opens diagnosis modal) vs the general follow-up section.

**Premium gate:** Wrap with `premium.isPremium` check (same pattern as shopping list, paywall banner).

#### NOTF-03: Notification Deep-Link Navigation

**The challenge:** `Notifications.addNotificationResponseReceivedListener` only fires when the app is running (foreground or background). For cold-start (app killed, user taps notification), you must call `Notifications.getLastNotificationResponseAsync()` at app initialization.

**Critical timing constraint (from STATE.md):** "Cold-start notification navigation timing relative to StorageProvider loading needs prototype on physical device — do not rely on simulator." The NavigationContainer must be mounted and StorageProvider must finish loading before navigation is attempted.

**Pattern to use:**
```typescript
// In App.tsx (AppContentMVP), inside AppContentMVP after NavigationContainer mounts:
const navigationRef = useRef<NavigationContainerRef<any>>(null);

useEffect(() => {
  // Cold-start: check last response after nav is ready
  const checkLastResponse = async () => {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) handleNotificationResponse(lastResponse);
  };
  checkLastResponse();

  // Foreground/background taps
  const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  return () => sub.remove();
}, []);

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data;
  if (data?.type === 'followup-reminder' && data?.plantId) {
    // Navigate to Hoy, then trigger plant detail open
    navigationRef.current?.navigate('Hoy');
    // Signal to TodayScreen to open the plant detail for plantId
  }
}
```

**Navigation signal pattern:** The simplest approach for this app (no nested navigators, modal-based detail) is to use a ref or a React context to signal TodayScreen that it should open a specific plant's detail. Avoid deep linking URL schemes (unnecessary complexity for this use case).

**Recommended:** Pass `navigationRef` to `NavigationContainer` via `ref` prop. In `handleNotificationResponse`, after navigating to "Hoy", store the `plantId` in a lightweight `useRef` or a simple state in `AppContentMVP`. TodayScreen reads this signal via a prop or context and auto-opens `MyPlantDetailModal`.

**Simpler alternative:** Just navigate to the "Hoy" tab and show a brief banner/toast pointing the user to the relevant plant. This avoids cold-start timing complexity. However NOTF-03 requires navigation "to the plant's detail or diagnosis flow" so the fuller approach is needed.

**Implementation guard:** Do not navigate until `!storageLoading`. If storage is still loading when the notification fires, defer navigation with a `useEffect` that fires when `storageLoading` transitions to `false`.

#### UI-01 & UI-04: Active Problems Section in Plant Detail

**What exists:** `MyPlantDetailModal` has a `historySection` that renders `DiagnosisHistoryItem` rows. This is a generic diagnosis list ordered by recency.

**What's needed:** A dedicated "Active Problems" section above the history, showing only tracked + unresolved diagnoses. Each card should show:
- `TRACKING_STATUS_CONFIG[trackingStatus].emoji` + `t(TRACKING_STATUS_CONFIG[trackingStatus].labelKey)`
- `problemSummary` or `result.summary`
- Last check date (most recent `entry.date` or `diagnosis.date`)
- Next follow-up date (formatted from `followUpDate`)
- CTA: "Re-diagnose" → opens `PlantDiagnosisModal` with `resumeDiagnosis` set

**Component:** A new `ActiveProblemsSection` component, similar in structure to `DiagnosisHistoryItem` but with the richer tracking-specific fields.

#### UI-02: Problem Timeline (Photo History per Entry)

**What exists:** `ProblemEntry` type has `id`, `date`, `photoUri: string | null`, `aiNotes`, `statusChange`. Entries are stored in `SavedDiagnosis.entries[]`.

**What's needed:** A `ProblemTimeline` component that renders entries chronologically. Each entry row:
- Date formatted (day month, time)
- `statusChange` badge (using `TRACKING_STATUS_CONFIG`)
- `aiNotes` text
- `Image` component for `photoUri` (handle null gracefully with placeholder)

**Photo display:** Use `<Image source={{ uri: photoUri }} resizeMode="cover" />`. Photos are guaranteed to be in `documentDirectory` (Phase 2 handles `persistDiagnosisPhoto`). No network calls needed.

**Where to place it:** Inside `MyPlantDetailModal`, below the active problems section, as an expandable or scrollable sub-section per tracked problem.

#### UI-03: Status Badge on Plant Card

**What exists:** `PlantCard` already has:
- `hasActiveDiagnosis` prop (boolean)
- `diagnosisBadge` style — renders a 🩺 emoji in a circle when true

**What's needed:** Upgrade the badge to also reflect tracking status. When `isTracked` and `trackingStatus !== 'resolved'`, show the `TRACKING_STATUS_CONFIG[trackingStatus].emoji` in the badge instead of (or alongside) 🩺.

**Data needed at call site:** In `TodayScreen` and `PlantsScreen`, where `PlantCard` is rendered, compute whether the plant has active *tracked* problems. The `getActiveDiagnosesForPlant` function in `useStorage` returns unresolved diagnoses — filter for `isTracked && trackingStatus !== 'resolved'` to determine badge content.

**Avoid:** Passing the full `diagnoses` array to derive this in `PlantCard` — that belongs at the call site. Pass a computed `activeTrackingStatus?: TrackingStatus` prop instead.

### File Touch Map

| File | Change |
|------|--------|
| `src/screens/TodayScreen.tsx` | Add `FollowUpTaskSection`, add notification signal consumer |
| `App.tsx` | Add `navigationRef`, cold-start + response listener, navigate-to-Hoy logic |
| `src/hooks/useNotifications.ts` | Wire `followup-reminder` response type (currently a no-op comment) |
| `src/components/MyPlantDetailModal.tsx` | Add `ActiveProblemsSection` + `ProblemTimeline` |
| `src/components/PlantCard.tsx` | Upgrade `diagnosisBadge` to reflect tracking status |
| `src/components/FollowUpTaskSection.tsx` | New component — follow-up due-today cards in Hoy |
| `src/components/ProblemTimeline.tsx` | New component — chronological photo + notes entries |
| `src/i18n/locales/en/common.json` | New keys for Phase 3 UI strings |
| `src/i18n/locales/es/common.json` | Same keys in Argentine Spanish |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cold-start notification handling | Custom app-state listener | `Notifications.getLastNotificationResponseAsync()` | Expo API exists precisely for this; handles the timing edge case |
| Timeline photo display | Custom image loader with caching | React Native `<Image>` | Photos are local `documentDirectory` URIs — no network, no caching needed |
| Status badge color management | Hardcoded switch/case | `TRACKING_STATUS_CONFIG` from `problemTrackingService.ts` | Config already has emoji, labelKey, color — single source of truth |
| Navigation to modal | URL-based deep linking | `navigationRef.current?.navigate()` + state signal | App has no nested navigators; URL schemes add complexity with no benefit |
| Date formatting in timeline | New date utility | Extend existing `formatDate` / inline with `toLocaleDateString` | No new library needed; existing pattern in `DiagnosisDetailModal.tsx` already formats ISO dates |

---

## Common Pitfalls

### Pitfall 1: Cold-Start Navigation Race Condition
**What goes wrong:** `getLastNotificationResponseAsync()` is called before `NavigationContainer` is mounted or before `StorageProvider` finishes loading. Navigate call throws "Navigator is not mounted" or navigates to a plant that hasn't loaded yet.
**Why it happens:** The notification response is available immediately, but the nav stack and storage are asynchronous.
**How to avoid:** Gate the navigation call on `!storageLoading` AND `navigationContainerReady`. Use `NavigationContainer`'s `onReady` callback to set a `navReady` flag. Only call navigate when both are true.
**Warning signs:** Navigation works in development (fast storage) but fails in production (slower cold start).

### Pitfall 2: Duplicate Follow-Up Task Cards
**What goes wrong:** Both the new `FollowUpTaskSection` (for today's due-date tasks) and the existing `DiagnosisFollowUp` component render cards for the same diagnosis.
**Why it happens:** `DiagnosisFollowUp` currently shows ALL active (unresolved, non-healthy) diagnoses — including tracked ones.
**How to avoid:** Filter `DiagnosisFollowUp` to exclude `isTracked === true` diagnoses (those are handled by `FollowUpTaskSection`), OR consolidate them into one component.
**Recommended:** Consolidate — modify `DiagnosisFollowUp` to handle both tracked and untracked active diagnoses with different visual treatments.

### Pitfall 3: Empty `entries[]` Timeline
**What goes wrong:** A tracked problem has no `entries[]` (it was created in Phase 2 before follow-up chats happened) — the timeline renders nothing or crashes on `.map`.
**Why it happens:** `entries` is optional (`entries?: ProblemEntry[]`) and starts as `undefined` on older tracked diagnoses.
**How to avoid:** Guard with `(diagnosis.entries ?? []).map(...)`. Also handle the "no entries yet" state with a descriptive empty state in the timeline.

### Pitfall 4: `photoUri` Points to Cache
**What goes wrong:** Timeline images fail to load on older diagnoses where photos were not yet copied to `documentDirectory`.
**Why it happens:** Phase 2 added `persistDiagnosisPhoto` but only for future captures. Historical diagnoses may have cache URIs.
**How to avoid:** Wrap `<Image>` with `onError` handler and show a placeholder (plant icon emoji) on load failure. Do NOT attempt re-copy at render time.

### Pitfall 5: `PlantsScreen` Missing `hasActiveDiagnosis` Prop
**What goes wrong:** Status badge update on `PlantCard` works on `TodayScreen` but not on `PlantsScreen`.
**Why it happens:** `PlantsScreen` renders `PlantCard` but may not pass `diagnosisHistory` / `hasActiveDiagnosis`.
**How to avoid:** Check `PlantsScreen.tsx` when updating `PlantCard` — pass the same computed `hasActiveDiagnosis` signal from `useStorage`.

---

## Code Examples

Verified patterns from existing codebase:

### Cold-Start Notification Check (expo-notifications pattern)
```typescript
// Source: expo-notifications docs + existing useNotifications.ts skeleton
useEffect(() => {
  if (!isNotificationsAvailable()) return;

  // Cold-start: notification tapped before app was running
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleFollowUpNavigation(response.notification.request.content.data);
  });

  // Foreground/background tap
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    handleFollowUpNavigation(response.notification.request.content.data);
  });
  return () => sub.remove();
}, [storageLoaded, navReady]); // Re-run when both become true
```

### Filtering Due-Today Tracked Problems (from existing TodayScreen patterns)
```typescript
// Same pattern as plantsWithTasks — compute in useMemo
const followUpsDueToday = useMemo(() => {
  if (!premium.isPremium) return [];
  const today = new Date();
  const result: { plant: Plant; diagnosis: SavedDiagnosis }[] = [];
  for (const plant of plants) {
    const diagnoses = diagnosisHistory[plant.id] || [];
    for (const d of diagnoses) {
      if (
        d.isTracked &&
        d.trackingStatus !== 'resolved' &&
        d.followUpDate &&
        isSameDay(new Date(d.followUpDate), today)
      ) {
        result.push({ plant, diagnosis: d });
      }
    }
  }
  return result;
}, [plants, diagnosisHistory, premium.isPremium]);
```

### TRACKING_STATUS_CONFIG Usage (established Phase 2 pattern)
```typescript
// Source: src/services/problemTrackingService.ts
import { TRACKING_STATUS_CONFIG } from '../services/problemTrackingService';

// In render:
const cfg = TRACKING_STATUS_CONFIG[diagnosis.trackingStatus ?? 'watching'];
<Text>{cfg.emoji} {t(cfg.labelKey)}</Text>
// Color: cfg.color
```

### NavigationContainer ref pattern (React Navigation)
```typescript
// Source: React Navigation docs — navigationRef pattern
const navigationRef = useRef<NavigationContainerRef<any>>(null);
const [navReady, setNavReady] = useState(false);

<NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
```

### Photo in Timeline (local URI)
```typescript
// Follows existing PlantCard/MyPlantDetailModal Image pattern
{entry.photoUri ? (
  <Image
    source={{ uri: entry.photoUri }}
    style={styles.entryPhoto}
    resizeMode="cover"
    onError={() => {/* show placeholder */}}
  />
) : (
  <Text style={styles.entryPhotoPlaceholder}>{plant.icon}</Text>
)}
```

---

## State of the Art

| Old Pattern | Current Pattern | Impact for Phase 3 |
|-------------|-----------------|-------------------|
| Deep-link via URL scheme | `getLastNotificationResponseAsync()` + response listener | Use the listener pattern — no URL scheme needed |
| Notification data as string | Typed `data` object (`plantId`, `diagnosisId`, `type`) | Phase 2 already structured the payload correctly |
| Manual tracking in component | `TRACKING_STATUS_CONFIG` + `TrackingStatus` type | Consume the config, don't duplicate status logic |

---

## Open Questions

1. **Where exactly should `followUpsDueToday` render in TodayScreen?**
   - What we know: TodayScreen renders in order: weather, premium banner, daily tip, watering tips, garden health, `DiagnosisFollowUp`, reminders, notes, plants with tasks.
   - What's unclear: Should follow-up due-today cards appear above or below the existing `DiagnosisFollowUp` section? Or replace it when items are tracked?
   - Recommendation: Place above existing `DiagnosisFollowUp` (follow-ups due today are higher priority than general active diagnoses). Consolidation approach (single component with multiple visual modes) is cleaner but riskier for this phase.

2. **How does tapping a notification navigate to diagnosis vs. plant detail?**
   - What we know: NOTF-03 says "plant's detail or diagnosis flow." Opening `MyPlantDetailModal` for the plant, then letting the user tap "Re-diagnose" from the Active Problems section, satisfies the requirement without imperative navigation into a modal.
   - Recommendation: Navigate to "Hoy" tab, auto-open `MyPlantDetailModal` for the `plantId`. This avoids stacking modals imperatively from App.tsx.

3. **Should `DiagnosisHistoryItem` in plant detail show tracked problems differently?**
   - What we know: The existing history item is used for ALL diagnoses. Tracked ones now have richer data (status, follow-up date, entries count).
   - Recommendation: Keep `DiagnosisHistoryItem` as-is for the generic history list. The new `ActiveProblemsSection` is a separate, richer component — no need to modify the generic item.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (per CLAUDE.md) |
| Config file | none |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npx tsc --noEmit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTF-02 | Follow-up task appears on Hoy screen on follow-up date | manual | n/a | n/a |
| NOTF-03 | Notification tap navigates to plant detail | manual (physical device) | n/a | n/a |
| UI-01 | Active problems section in plant detail | manual | n/a | n/a |
| UI-02 | Problem timeline with photo history | manual | n/a | n/a |
| UI-03 | Status badge on plant card | manual | n/a | n/a |
| UI-04 | Problem card fields (status, severity, dates) | manual | n/a | n/a |

### Type-Check as Proxy
Since no test framework exists, TypeScript strict mode serves as automated validation:
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx tsc --noEmit`
- **Phase gate:** Clean tsc output + manual smoke test on physical device before `/gsd:verify-work`

### Wave 0 Gaps
None — existing infrastructure (tsc, no test runner) covers all automated checks. Manual testing on physical device is required for NOTF-03 (cold-start navigation).

---

## Sources

### Primary (HIGH confidence)
- Codebase audit of `src/utils/notificationScheduler.ts` — confirmed `scheduleFollowUpReminder` payload structure (`type`, `plantId`, `diagnosisId`)
- Codebase audit of `src/hooks/useNotifications.ts` — confirmed `addNotificationResponseReceivedListener` skeleton exists at line 129 with `// Could navigate to specific screen` comment
- Codebase audit of `src/types/index.ts` — confirmed `SavedDiagnosis.followUpDate`, `isTracked`, `trackingStatus`, `entries: ProblemEntry[]` types
- Codebase audit of `src/services/problemTrackingService.ts` — confirmed `TRACKING_STATUS_CONFIG` with emoji, labelKey, color
- Codebase audit of `src/components/MyPlantDetailModal.tsx` — confirmed existing section pattern for adding new sections
- Codebase audit of `src/components/PlantCard.tsx` — confirmed `hasActiveDiagnosis` prop and `diagnosisBadge` style at line 110-113

### Secondary (MEDIUM confidence)
- expo-notifications `getLastNotificationResponseAsync()` — documented pattern for cold-start deep linking; confirmed available in Expo SDK (app uses expo-notifications already)
- React Navigation `ref` pattern for programmatic navigation — standard documented approach

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all APIs confirmed present in codebase
- Architecture: HIGH — patterns directly derived from existing code; no speculation
- Pitfalls: HIGH — pitfalls 1-3 derived from direct code inspection (race condition guard comment in STATE.md, optional `entries`, duplicate rendering risk); pitfalls 4-5 from code structure audit

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable Expo SDK, no fast-moving surface)
