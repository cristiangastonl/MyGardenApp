# Phase 2: Problem Tracking Core - Research

**Researched:** 2026-03-19
**Domain:** React Native data model extension, AsyncStorage mutation patterns, expo-notifications scheduling, expo-file-system persistent photo copy, Supabase edge function response shaping, i18n for new problem-tracking strings
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Explicit "Track this problem" button shown to premium users after AI diagnosis (not auto-created)
- Button appears for all problems, but presentation differs by severity:
  - Moderate+ (Watch closely / Needs attention): button prominent, standard styling
  - Minor issues: button visible but labeled "Track this problem (optional)" — less prominent
- Free-tier users do not see the tracking button (premium gate via `usePremiumGate()`)
- The button appears at the end of the diagnosis results, after the AI analysis
- Emoji + text format for severity/status labels:
  - 🟠 Watch closely (severe)
  - 🟡 Needs attention (moderate)
  - 🟢 Recovering (improvement detected on follow-up)
  - ✅ Resolved (problem closed)
- AI sets the severity during diagnosis — returned as a field from the edge function
- Severity determines follow-up interval (client-side mapping):
  - 🟠 Watch closely → 3 days
  - 🟡 Needs attention → 7 days
  - Minor (below tracking threshold) → 14 days if user opts to track
- When AI detects improvement during re-diagnosis: inline card in the chat thread
  - Card says "Your plant improved!" (or ES: "¡Tu planta mejoró!") with green "Mark as resolved" button
  - One-tap confirm → status changes to ✅ Resolved
  - User can dismiss card and keep tracking
- After resolving: subtle checkmark animation (brief, not confetti)
- User can manually resolve from problem record at any time (PROB-04)
- User can reopen a resolved problem (PROB-06) — status goes back to previous severity
- Edge function must return: severity label and problem summary
- Client maps severity to follow-up days (no AI-returned interval number)
- Edge function receives `lang` parameter for localized descriptions (I18N-02)
- Photos captured for follow-up MUST be copied from cache to persistent `documentDirectory` immediately after capture (PROB-10)
- Push notification scheduled at follow-up date — premium only (NOTF-01)
- Notification IDs persisted in the problem record to prevent duplication on app restart (NOTF-04)
- Uses existing `expo-notifications` infrastructure and `notificationScheduler.ts`

### Claude's Discretion
- Edge function response format (flat fields vs nested tracking object)
- Data model structure for problem records (extend `SavedDiagnosis` vs new type)
- Notification scheduling implementation details
- How to handle existing `DiagnosisFollowUp` component (reuse, extend, or replace)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROB-01 | When AI diagnoses a problem, user can create a tracked problem record (premium only) | `usePremiumGate()` gate on button in `DiagnosisResults.tsx`; new storage action in `useStorage` |
| PROB-02 | Problem record stores: plant ID, problem summary, severity label, photo URI, AI notes, creation date, follow-up date, status | Extend `SavedDiagnosis` type with `trackingStatus`, `severity`, `followUpDate`, `followUpNotificationId`, `entries[]` |
| PROB-03 | AI determines follow-up frequency based on severity; client maps to days | Client-side mapping function in `problemTrackingService.ts`; edge function returns `severity` field |
| PROB-04 | User can manually resolve/close a tracked problem at any time | New `resolveTrackedProblem` action in `useStorage`, updating `trackingStatus` to `'resolved'` |
| PROB-05 | When follow-up diagnosis shows improvement, AI suggests resolution and user confirms with one tap | Inline resolution card rendered in chat thread within `DiagnosisResults.tsx` |
| PROB-06 | User can reopen a previously resolved problem | New `reopenTrackedProblem` action in `useStorage`, restoring previous severity status |
| PROB-07 | Each follow-up adds an entry to the problem record (photo, AI notes, date, status change) | `ProblemEntry` sub-type; `addFollowUpEntry` action in `useStorage` |
| PROB-08 | Follow-up re-diagnosis opens a new chat session (not same thread) | New `SavedDiagnosis` created per follow-up; linked to problem via `problemId` |
| PROB-09 | Problem uses descriptive severity labels (Watch closely / Needs attention / Recovering / Resolved) | `TrackingStatus` type distinct from `DiagnosisSeverity`; mapping in `problemTrackingService.ts` |
| PROB-10 | Photos copied from cache to persistent document directory immediately after capture | `expo-file-system` `copyAsync` pattern already used by `photoService.ts` — replicate for diagnosis photos |
| NOTF-01 | Push notification sent at AI-determined follow-up date (premium only) | New `scheduleFollowUpReminder()` in `notificationScheduler.ts`; uses `TIME_INTERVAL` trigger pattern |
| NOTF-04 | Notification IDs persisted to survive app restart without duplication | Store `followUpNotificationId` field on `SavedDiagnosis`; cancel before re-scheduling |
| I18N-01 | All new UI strings use `t('key')` with translations in EN and ES (vos) | New keys under `diagnosis.tracking.*` namespace in both `common.json` files |
| I18N-02 | Diagnose-plant edge function receives `lang` parameter for follow-up descriptions | Edge function already accepts `lang`; add `problemSummary` and `severity` to response schema |
</phase_requirements>

---

## Summary

Phase 2 builds the service and data layer for problem tracking. All implementation targets existing patterns and infrastructure — there is no new library to introduce. The core challenge is extending `SavedDiagnosis` in a backward-compatible way and wiring four integration points: the edge function response, the `DiagnosisResults` UI, `useStorage` mutations, and `notificationScheduler`.

The project already has the full picture for this phase: `expo-file-system` (new `File/Directory` API via `expo-file-system/next`) is in use in `photoService.ts`, `expo-notifications` with `TIME_INTERVAL` triggers is in `notificationScheduler.ts`, and `useStorage` follows a consistent ref-plus-debounce mutation pattern. Everything new must follow these exact patterns rather than introducing parallel approaches.

**Primary recommendation:** Extend `SavedDiagnosis` in-place (not a separate collection) with optional problem-tracking fields, add a `problemTrackingService.ts` for pure logic, add four new storage actions, add one new notification scheduler function, update the edge function response, and add i18n keys. Keep the service layer thin — business logic stays in `problemTrackingService.ts`, storage writes stay in `useStorage`.

---

## Standard Stack

### Core (already installed — no new packages needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-notifications` | SDK 54 | Schedule follow-up push notifications | Already used in `notificationScheduler.ts` |
| `expo-file-system` | SDK 54 | Copy diagnosis photos from cache to persistent storage | Already used in `photoService.ts` (new `File/Directory` API) |
| `@react-native-async-storage/async-storage` | existing | Local-first persistence for problem records | Project standard; all app data in `plant-agenda-v2` key |
| `react-i18next` | existing | All new UI strings | Project standard; `t()` everywhere |

**Installation:** No new packages required. All dependencies are present.

---

## Architecture Patterns

### Recommended Project Structure for New Files
```
src/
├── services/
│   └── problemTrackingService.ts    # NEW: pure logic — severity mapping, follow-up math, no side effects
├── hooks/
│   └── useStorage.tsx               # EXTEND: 4 new actions
└── utils/
    └── notificationScheduler.ts     # EXTEND: scheduleFollowUpReminder(), cancelFollowUpReminder()

src/types/
└── index.ts                         # EXTEND: SavedDiagnosis + new sub-types

supabase/functions/
└── diagnose-plant/index.ts          # EXTEND: add severity + problemSummary to response JSON

src/components/
└── PlantDiagnosis/
    └── DiagnosisResults.tsx         # EXTEND: "Track this problem" button + resolution suggestion card

src/i18n/locales/
├── en/common.json                   # EXTEND: diagnosis.tracking.* keys
└── es/common.json                   # EXTEND: diagnosis.tracking.* keys (vos)
```

### Pattern 1: Extending SavedDiagnosis (Backward-Compatible)

**What:** Add optional fields to `SavedDiagnosis`. Because all fields are optional (TypeScript `?`), existing stored records load without error — missing fields default to `undefined` which the UI treats as untracked.

**When to use:** Any time new tracking state must survive app restarts.

**Data model recommendation (Claude's discretion area):**

```typescript
// Source: existing src/types/index.ts pattern + CONTEXT.md decisions

export type TrackingStatus = 'watching' | 'needs_attention' | 'recovering' | 'resolved';

export interface ProblemEntry {
  id: string;
  date: string;            // ISO string
  photoUri: string | null; // persistent documentDirectory URI
  aiNotes: string;         // AI summary from this follow-up
  statusChange: TrackingStatus | null; // status at time of this entry
}

// Extend SavedDiagnosis (all new fields optional for backward compat)
export interface SavedDiagnosis {
  // ... existing fields unchanged ...

  // Problem tracking (Phase 2) — all optional
  isTracked?: boolean;                  // true when user tapped "Track this problem"
  trackingStatus?: TrackingStatus;      // current status
  previousStatus?: TrackingStatus;      // saved before resolving, used by reopen (PROB-06)
  followUpDate?: string;                // ISO date string for next check
  followUpNotificationId?: string | null; // expo-notifications identifier (NOTF-04)
  problemSummary?: string;              // AI-generated problem summary from edge function
  entries?: ProblemEntry[];             // follow-up history (PROB-07)
}
```

**Severity-to-tracking-status mapping (PROB-09, PROB-03):**
```typescript
// In problemTrackingService.ts
// DiagnosisSeverity → TrackingStatus (initial)
const SEVERITY_TO_STATUS: Record<DiagnosisSeverity, TrackingStatus> = {
  severe:   'watching',          // 🟠
  moderate: 'needs_attention',   // 🟡
  minor:    'needs_attention',   // 🟡 (shown less prominently)
  healthy:  'recovered',         // should not be tracked normally
};

// TrackingStatus → follow-up days (PROB-03)
const STATUS_TO_FOLLOW_UP_DAYS: Record<TrackingStatus, number> = {
  watching:         3,
  needs_attention:  7,
  recovering:       14, // used for minor if user opts in
  resolved:         0,  // no follow-up for resolved
};
```

### Pattern 2: useStorage Mutation (ref-plus-debounce)

**What:** Every new storage action follows the same pattern as existing actions. Update state, sync `dataRef.current`, call `scheduleSave()`.

**When to use:** Any write to `diagnosisHistory`.

```typescript
// Source: existing useStorage.tsx pattern (lines 383-398 for saveDiagnosis)

const trackProblem = useCallback((plantId: string, diagnosisId: string, followUpDate: string, notificationId: string | null) => {
  const cur = dataRef.current.diagnosisHistory;
  const plantDiagnoses = cur[plantId] || [];
  const updatedDiagnoses = plantDiagnoses.map(d =>
    d.id === diagnosisId
      ? {
          ...d,
          isTracked: true,
          trackingStatus: d.trackingStatus || severityToStatus(d.result.overallStatus),
          followUpDate,
          followUpNotificationId: notificationId,
        }
      : d
  );
  const newHistory = { ...cur, [plantId]: updatedDiagnoses };
  setDiagnosisHistory(newHistory);
  dataRef.current.diagnosisHistory = newHistory;
  scheduleSave();
}, [scheduleSave]);
```

**Four new actions needed in `useStorage`:**
1. `trackProblem(plantId, diagnosisId, followUpDate, notificationId)` — PROB-01, NOTF-04
2. `resolveTrackedProblem(plantId, diagnosisId)` — PROB-04 (saves `previousStatus` before overwriting)
3. `reopenTrackedProblem(plantId, diagnosisId)` — PROB-06 (restores `previousStatus`)
4. `addFollowUpEntry(plantId, diagnosisId, entry: ProblemEntry)` — PROB-07

### Pattern 3: Notification Scheduling (scheduleFollowUpReminder)

**What:** Follows the `scheduleCareReminder` pattern in `notificationScheduler.ts` exactly — compute `timeDiff`, guard `<= 0`, call `scheduleNotificationAsync` with `TIME_INTERVAL` trigger, return identifier. Persist identifier to AsyncStorage via `trackProblem` action.

**When to use:** When user taps "Track this problem" button.

```typescript
// Source: existing notificationScheduler.ts pattern (lines 244-282)
// New constant to add:
const FOLLOWUP_REMINDER_PREFIX = "followup-reminder-";

export async function scheduleFollowUpReminder(
  plant: Plant,
  diagnosis: SavedDiagnosis,
  followUpDate: Date
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  const now = new Date();
  const timeDiff = followUpDate.getTime() - now.getTime();
  if (timeDiff <= 0) return null;

  const seconds = Math.floor(timeDiff / 1000);

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${plant.icon} ${i18n.t('notifications.followUpTitle', { name: plant.name })}`,
        body: i18n.t('notifications.followUpBody', { summary: diagnosis.problemSummary || '' }),
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'followup-reminder',
          plantId: plant.id,
          diagnosisId: diagnosis.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

export async function cancelFollowUpReminder(notificationId: string): Promise<void> {
  if (!notificationsAvailable) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}
```

**Duplication prevention (NOTF-04):** Before scheduling, check `diagnosis.followUpNotificationId`. If set, cancel existing then schedule fresh. This handles app restart safely:

```typescript
// In problemTrackingService.ts (orchestration function)
export async function startTracking(
  plant: Plant,
  diagnosis: SavedDiagnosis,
  trackProblem: (plantId: string, diagnosisId: string, followUpDate: string, notificationId: string | null) => void
): Promise<void> {
  const followUpDays = getFollowUpDays(diagnosis.result.overallStatus);
  const followUpDate = addDays(new Date(), followUpDays);

  // Cancel existing notification if any (handles re-tracking)
  if (diagnosis.followUpNotificationId) {
    await cancelFollowUpReminder(diagnosis.followUpNotificationId);
  }

  const notificationId = await scheduleFollowUpReminder(plant, diagnosis, followUpDate);
  trackProblem(plant.id, diagnosis.id, followUpDate.toISOString(), notificationId);
}
```

### Pattern 4: Persistent Photo Copy (PROB-10)

**What:** The project already uses `expo-file-system` new API (`File`, `Directory`, `Paths`) in `photoService.ts`. For diagnosis follow-up photos, replicate that copy pattern immediately on capture — before returning the URI to the caller.

**When to use:** When user provides a photo for a follow-up re-diagnosis chat message.

```typescript
// Source: photoService.ts lines 68-86
// Approach: copy diagnosis photos to documentDirectory/diagnosis-photos/{diagnosisId}/
import { Paths, File, Directory } from 'expo-file-system/next';

export async function persistDiagnosisPhoto(
  diagnosisId: string,
  cacheUri: string
): Promise<string> {
  const dirPath = `${Paths.document.uri}diagnosis-photos/${diagnosisId}/`;
  const dir = new Directory(dirPath);
  if (!dir.exists) dir.create();

  const filename = `${Date.now()}.jpg`;
  const dest = new File(`${dirPath}${filename}`);
  const source = new File(cacheUri);
  source.copy(dest);
  return dest.uri;
}
```

Note: The existing `usePlantDiagnosis.ts` uses legacy `expo-file-system` (`FileSystem.readAsStringAsync`). New diagnosis photo persistence uses the new API (same as `photoService.ts`) for consistency.

### Pattern 5: Edge Function Response Extension (I18N-02, PROB-03)

**What:** Add `severity` and `problemSummary` fields to the diagnose-plant JSON response. Flat fields (not nested object) — simpler, and the client already destructures the response directly.

**Current response shape:**
```json
{
  "overallStatus": "moderate",
  "summary": "...",
  "issues": [...],
  "careTips": [...]
}
```

**Extended response shape (add to both ES and EN prompts):**
```json
{
  "overallStatus": "moderate",
  "summary": "...",
  "issues": [...],
  "careTips": [...],
  "severity": "moderate",
  "problemSummary": "Short problem description for tracking (1-2 sentences)"
}
```

**Edge function prompt addition** (add to the JSON schema comment in the system prompt):
```
"severity": same value as overallStatus (for client tracking UI),
"problemSummary": "1-2 sentence description of the main problem for tracking card display. In the user's language."
```

`severity` is intentionally redundant with `overallStatus` — the client needs it as a named tracking field so the data model does not couple `trackingStatus` initialization to `overallStatus` at read time.

### Pattern 6: DiagnosisResults "Track this problem" Button (PROB-01, PROB-09)

**What:** Add a new prop `onTrackProblem?: () => void` to `DiagnosisResults`. Rendered after the care tips section, before actions. Gated by `isPremium` prop (already present).

**Rendering logic:**
- `result.overallStatus === 'healthy'` → no button
- `isPremium && overallStatus === 'severe'` → prominent button, standard label
- `isPremium && overallStatus === 'moderate'` → prominent button, standard label
- `isPremium && overallStatus === 'minor'` → visible but `(optional)` suffix in label
- `!isPremium` → no button

### Pattern 7: Inline Resolution Suggestion Card (PROB-05)

**What:** Rendered inside the chat messages list in `DiagnosisResults.tsx`. When the AI response contains an improvement signal, show an inline card with green "Mark as resolved" button. A new prop `onSuggestResolve?: () => void` + `showResolutionCard?: boolean` handle this.

**Detection:** The AI chat response text is analyzed in `usePlantDiagnosis.sendChatMessage`. If the response contains improvement language, set a `showResolutionSuggestion` boolean in the hook state. Pass it down as prop.

A simpler approach: in the chat follow-up edge function (`chat-diagnosis`), add a boolean field `improvementDetected: true/false` to the response JSON. Client reads that directly — no fragile string matching.

### Anti-Patterns to Avoid

- **Separate problem collection:** Do not create `problemHistory: Record<string, TrackedProblem[]>`. The decision is to extend `SavedDiagnosis` to avoid stale cross-reference bugs (confirmed in STATE.md Decisions).
- **Auto-creating tracking records:** Do not track problems without explicit user consent. Button is always explicit.
- **Scheduling on every load:** Check `followUpNotificationId` before scheduling. Always cancel old ID first.
- **Storing base64 in AsyncStorage:** The existing `usePlantDiagnosis` already discards `base64` from images after sending to edge function. Never persist base64 in the diagnosis record.
- **Using legacy `FileSystem.copyAsync`:** Use `File.copy()` from the new `expo-file-system/next` API, matching `photoService.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo persistence | Custom file management | `expo-file-system/next` `File.copy()` (already in `photoService.ts`) | Race conditions, permission edge cases |
| Notification dedup | Custom ID store | Persist `followUpNotificationId` on `SavedDiagnosis`, cancel before reschedule | OS notification limits, restart safety |
| Date math (addDays) | Manual `Date` arithmetic | Simple inline date calculation is acceptable here — no library needed for 3/7/14 day offsets | Project has no date library dependency |
| Animation (checkmark) | Custom animated component | React Native `Animated` API or `Animated.spring` on opacity/scale — one component, ~30 lines | Keep it simple, no animation library |

**Key insight:** This phase is pure extension of existing patterns. The codebase already solved all the hard problems (file copy, notification scheduling, local-first storage). Phase 2 is wiring them together in a new domain.

---

## Common Pitfalls

### Pitfall 1: Cache URI Invalidation (PROB-10)
**What goes wrong:** `expo-image-picker` returns URIs in the system cache (`file:///var/...` on iOS, `/data/user/0/.../cache/` on Android). These are invalidated after OS cache clear, app update, or Expo build update.
**Why it happens:** ImagePicker gives you a temporary cached copy, not a permanent file.
**How to avoid:** Call `persistDiagnosisPhoto()` immediately after receiving the URI from the picker, before storing the URI anywhere. Store only the persistent `documentDirectory` URI.
**Warning signs:** Images showing broken/missing in follow-up records after OS cache clear.

### Pitfall 2: Duplicate Notifications on App Restart (NOTF-04)
**What goes wrong:** If `scheduleFollowUpReminder` is called again on app startup (e.g., in a `useEffect` that re-schedules based on active diagnoses), duplicate notifications pile up.
**Why it happens:** `expo-notifications` generates a new identifier on each `scheduleNotificationAsync` call; the old notification is NOT replaced.
**How to avoid:** Store `followUpNotificationId` on the diagnosis record. Before scheduling: if ID exists, call `cancelFollowUpReminder(existingId)` first. Only schedule when user explicitly taps "Track this problem" — not on app startup.
**Warning signs:** User receives duplicate follow-up notifications.

### Pitfall 3: AsyncStorage Bloat from base64
**What goes wrong:** Chat follow-up photos are read as base64 for the edge function call. If the base64 string is accidentally saved to `diagnosisHistory`, AsyncStorage approaches the 2.5 MB Android limit.
**Why it happens:** The photo object has both `uri` and `base64` fields; if the whole object is persisted, base64 goes with it.
**How to avoid:** `ProblemEntry` stores only `photoUri` (persistent document URI), never `base64`. When sending to edge function, read `base64` from disk on demand using `FileSystem.readAsStringAsync`, discard after the call.
**Warning signs:** AsyncStorage write failures on Android; app slowdowns on large diagnosis histories.

### Pitfall 4: Breaking Existing `resolveDiagnosis` Action
**What goes wrong:** The existing `resolveDiagnosis` in `useStorage` sets `resolved: true, resolvedDate: ...`. The new `resolveTrackedProblem` must also set `trackingStatus: 'resolved'` — but `resolveDiagnosis` may still be called from `DiagnosisFollowUp.tsx` on the existing resolve flow.
**Why it happens:** Two resolve code paths for the same entity.
**How to avoid:** Update `resolveDiagnosis` to also set `trackingStatus: 'resolved'` if the diagnosis `isTracked`. Keep backward compat (non-tracked diagnoses unaffected).
**Warning signs:** Resolved tracked problems still showing as active in `DiagnosisFollowUp`.

### Pitfall 5: Notification Scheduled for Past Date
**What goes wrong:** Follow-up notification is scheduled, but `followUpDate` is already in the past (e.g., user creates tracking record for a diagnosis from days ago).
**Why it happens:** `SavedDiagnosis.date` may be old; follow-up interval calculated from now is correct, but edge cases exist.
**How to avoid:** `scheduleFollowUpReminder` already guards `timeDiff <= 0 → return null`. If `notificationId` is null after scheduling, still save the `followUpDate` — the Hoy task (Phase 3) uses the date directly, not the notification.
**Warning signs:** `followUpNotificationId` is null but `followUpDate` is valid — this is acceptable.

---

## Code Examples

### Full "Track this problem" flow (orchestration in component)
```typescript
// In DiagnosisResults.tsx or parent PlantDiagnosisModal.tsx
// Source: CONTEXT.md decisions + established project patterns

const handleTrackProblem = async () => {
  if (!diagnosis || !plant) return;

  // 1. Persist photo if present (PROB-10)
  // (photo already persisted at capture time — URI in diagnosis.imageUri is already documentDirectory)

  // 2. Schedule notification + persist tracking data (NOTF-01, NOTF-04)
  await startTracking(plant, diagnosis, trackProblem);
  // startTracking is in problemTrackingService.ts
};
```

### i18n keys to add (I18N-01)

New keys under `diagnosis.tracking` namespace:

```json
// EN additions to diagnosis object in common.json
"tracking": {
  "trackButton": "Track this problem",
  "trackButtonOptional": "Track this problem (optional)",
  "statusWatching": "🟠 Watch closely",
  "statusNeedsAttention": "🟡 Needs attention",
  "statusRecovering": "🟢 Recovering",
  "statusResolved": "✅ Resolved",
  "improvementDetected": "Your plant improved!",
  "markResolved": "Mark as resolved",
  "keepTracking": "Keep tracking",
  "resolvedSuccess": "Problem marked as resolved",
  "followUpIn": "Follow-up in {{days}} days",
  "nextCheckDate": "Next check: {{date}}"
}
```

```json
// ES additions (vos conjugation)
"tracking": {
  "trackButton": "Seguir este problema",
  "trackButtonOptional": "Seguir este problema (opcional)",
  "statusWatching": "🟠 Vigilá de cerca",
  "statusNeedsAttention": "🟡 Necesita atención",
  "statusRecovering": "🟢 Recuperándose",
  "statusResolved": "✅ Resuelto",
  "improvementDetected": "¡Tu planta mejoró!",
  "markResolved": "Marcá como resuelto",
  "keepTracking": "Seguí monitoreando",
  "resolvedSuccess": "Problema marcado como resuelto",
  "followUpIn": "Seguimiento en {{days}} días",
  "nextCheckDate": "Próximo control: {{date}}"
}
```

Notification keys to add under `notifications` in `common.json`:
```json
// EN
"followUpTitle": "Time to check on {{name}}",
"followUpBody": "{{summary}} — do a follow-up diagnosis to track recovery."

// ES
"followUpTitle": "Es hora de revisar {{name}}",
"followUpBody": "{{summary}} — hacé un diagnóstico de seguimiento para ver cómo va."
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `FileSystem.copyAsync` (legacy expo-file-system) | `File.copy()` from `expo-file-system/next` | Expo SDK 53+ | New API used in `photoService.ts` — diagnosis photo copy must match |
| Numeric severity scores | Descriptive labels (Watch closely / Needs attention) | Product decision (REQUIREMENTS.md) | No numeric mapping needed |
| `overallStatus` re-used as tracking status | Separate `TrackingStatus` type (`watching/needs_attention/recovering/resolved`) | Phase 2 design | Avoids coupling display labels to DiagnosisSeverity enum |

---

## Open Questions

1. **Improvement detection in chat (PROB-05)**
   - What we know: When AI detects improvement during follow-up, show inline resolution card
   - What's unclear: Whether to detect improvement via string matching on AI response text, or via a structured field from the chat edge function (`chat-diagnosis`)
   - Recommendation: Add `improvementDetected: boolean` to `ChatDiagnosisResponse` in `plantDiagnosis.ts` and to the `chat-diagnosis` edge function response. Avoids brittle string matching. The chat edge function already returns structured JSON for the main diagnosis — same approach for improvement signal. (Claude's discretion per CONTEXT.md)

2. **`DiagnosisFollowUp` component fate (Claude's discretion)**
   - What we know: Component is gated behind `Features.DLC_PEST_DIAGNOSIS` which is false in MVP; it renders unresolved diagnoses with resolve/unresolve buttons
   - What's unclear: Whether to reuse it for the new tracking-aware display or replace it
   - Recommendation: Extend `DiagnosisFollowUp` — it already reads `diagnosisHistory`, understands `SavedDiagnosis`, and renders per-plant cards. Add `isTracked` filter and `trackingStatus` display. Avoids duplicating card rendering logic. The component's feature flag will need updating to the new tracking feature (not `DLC_PEST_DIAGNOSIS`).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test framework configured (CLAUDE.md: "No test framework is set up") |
| Config file | none |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npx tsc --noEmit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROB-01 | Track button visible for premium, hidden for free | manual-only | n/a — no test framework | n/a |
| PROB-02 | Problem record fields stored correctly | manual-only | n/a | n/a |
| PROB-03 | Severity maps to correct follow-up days | manual-only | n/a | n/a |
| PROB-04 | Manual resolve changes status | manual-only | n/a | n/a |
| PROB-05 | Improvement card appears in chat | manual-only | n/a | n/a |
| PROB-06 | Reopen restores previous status | manual-only | n/a | n/a |
| PROB-07 | Follow-up entry added with photo, notes, date | manual-only | n/a | n/a |
| PROB-08 | Re-diagnosis opens new chat session | manual-only | n/a | n/a |
| PROB-09 | Labels display correctly by status | manual-only | n/a | n/a |
| PROB-10 | Photo copied to documentDirectory | manual-only | n/a | n/a |
| NOTF-01 | Notification scheduled at follow-up date | manual-only | n/a | n/a |
| NOTF-04 | No duplicate notifications on restart | manual-only | n/a | n/a |
| I18N-01 | All new strings use t('key') | type-check | `npx tsc --noEmit` | ✅ |
| I18N-02 | Edge function returns severity + problemSummary | manual-only | n/a | n/a |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx tsc --noEmit`
- **Phase gate:** TypeScript clean + manual smoke test on device before `/gsd:verify-work`

### Wave 0 Gaps
None — no test framework to install. TypeScript check is the automated gate. Manual verification on physical device required for notifications and file persistence.

---

## Sources

### Primary (HIGH confidence)
- `src/utils/notificationScheduler.ts` — Full notification scheduling patterns; `TIME_INTERVAL` trigger, identifier return, error handling, `notificationsAvailable` guard
- `src/services/photoService.ts` — New `expo-file-system` API (`File`, `Directory`, `Paths.document.uri`); persistent copy pattern
- `src/hooks/useStorage.tsx` — ref-plus-debounce mutation pattern; `saveDiagnosis`, `resolveDiagnosis` as canonical models
- `src/types/index.ts` — `SavedDiagnosis`, `DiagnosisSeverity`, `DiagnosisResult` types
- `supabase/functions/diagnose-plant/index.ts` — Edge function response schema; existing `severity` concept via `overallStatus`
- `src/components/PlantDiagnosis/DiagnosisResults.tsx` — Where button and resolution card land; existing props model
- `src/components/DiagnosisFollowUp.tsx` — Existing `SEVERITY_CONFIG`, resolve button pattern
- `src/config/premium.ts` — `usePremiumGate()` existing methods; `canDiagnose`, `isPremium` access
- `.planning/phases/02-problem-tracking-core/02-CONTEXT.md` — All locked decisions
- `.planning/STATE.md` — Confirmed decision: follow-up dates live on `SavedDiagnosis`, not parallel collection

### Secondary (MEDIUM confidence)
- CLAUDE.md architecture notes — local-first pattern, AsyncStorage 2.5 MB Android limit risk (flagged in STATE.md blockers)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in the project, no new installs
- Architecture: HIGH — data model shape, storage actions, and notification patterns are direct extensions of verified existing code
- Pitfalls: HIGH — base64 bloat and notification duplication were pre-identified in STATE.md; photo cache risk is documented by Expo
- i18n keys: HIGH — translation namespace and pattern verified from live files

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable stack; Expo SDK 54 API won't change within 30 days)
