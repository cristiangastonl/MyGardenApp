# Phase 2: Problem Tracking Core - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the data model with problem tracking fields, build a problem tracking service, schedule follow-up push notifications, and add i18n for all new strings. Premium users can create tracked problem records from diagnoses, with AI-determined severity, client-side follow-up scheduling, manual resolve, AI-suggested resolve with one-tap confirmation, and persistent photo storage.

This phase builds the service/data layer. UI surfaces (Hoy tasks, plant detail timeline, status indicators on plant cards) are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Problem Creation Flow
- Explicit "Track this problem" button shown to premium users after AI diagnosis (not auto-created)
- Button appears for all problems, but presentation differs by severity:
  - Moderate+ (Watch closely / Needs attention): button prominent, standard styling
  - Minor issues: button visible but labeled "Track this problem (optional)" — less prominent
- Free-tier users do not see the tracking button (premium gate via `usePremiumGate()`)
- The button appears at the end of the diagnosis results, after the AI analysis

### Severity & Status Labels
- Emoji + text format, following the app's emoji-throughout convention:
  - 🟠 Watch closely (severe — e.g., fungus, root rot)
  - 🟡 Needs attention (moderate — e.g., yellow leaves, pests)
  - 🟢 Recovering (improvement detected on follow-up)
  - ✅ Resolved (problem closed)
- AI sets the severity during diagnosis — returned as a field from the edge function
- Severity determines follow-up interval (client-side mapping):
  - 🟠 Watch closely → 3 days
  - 🟡 Needs attention → 7 days
  - Minor (below tracking threshold) → 14 days if user opts to track

### Follow-up Resolution
- When AI detects improvement during re-diagnosis: inline card in the chat thread
  - Card says "¡Tu planta mejoró!" (or EN equivalent) with a green "Marcar como resuelto" button
  - One-tap confirm → status changes to ✅ Resolved
  - User can dismiss the card and keep tracking if they disagree
- After resolving: subtle success animation (brief checkmark animation, not confetti)
- User can also manually resolve from the problem record at any time (PROB-04)
- User can reopen a resolved problem (PROB-06) — status goes back to previous severity

### Edge Function Output
- Claude's discretion on response format (add fields vs nested tracking object)
- Edge function must return: severity label and problem summary
- Client maps severity to follow-up days (no AI-returned interval number)
- Edge function receives `lang` parameter for localized descriptions (I18N-02)

### Photo Persistence
- Photos captured for follow-up MUST be copied from cache to persistent `documentDirectory` immediately after capture (PROB-10)
- This prevents URI invalidation after OS cache clears or app updates
- Each follow-up entry stores: persistent photo URI, AI notes, date, status change (PROB-07)

### Notification Scheduling
- Push notification scheduled at follow-up date (severity-mapped interval) — premium only (NOTF-01)
- Notification IDs persisted in the problem record to prevent duplication on app restart (NOTF-04)
- Uses existing `expo-notifications` infrastructure and `notificationScheduler.ts`

### Claude's Discretion
- Edge function response format (flat fields vs nested tracking object)
- Data model structure for problem records (extend `SavedDiagnosis` vs new type)
- Notification scheduling implementation details
- How to handle existing `DiagnosisFollowUp` component (reuse, extend, or replace)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing data model
- `src/types/index.ts` — `SavedDiagnosis` type (line 255) with `resolved`, `resolvedDate`, `imageUri`, `imageUris`, `chat`, `result`, `context` fields
- `src/hooks/useStorage.tsx` — `diagnosisHistory: Record<string, SavedDiagnosis[]>` storage, resolve/unresolve methods

### Existing diagnosis flow
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — Full diagnosis flow including chat
- `src/components/PlantDiagnosis/DiagnosisResults.tsx` — Renders diagnosis results and chat UI (modified in Phase 1)
- `src/hooks/usePlantDiagnosis.ts` — Diagnosis hook with state management
- `src/utils/plantDiagnosis.ts` — Formats diagnosis data for Claude Vision API

### Existing follow-up component
- `src/components/DiagnosisFollowUp.tsx` — Already renders unresolved diagnoses with resolve/unresolve buttons

### Edge function
- `supabase/functions/diagnose-plant/index.ts` — Diagnosis edge function (needs severity + summary fields)

### Notification infrastructure
- `src/utils/notificationScheduler.ts` — Existing notification scheduling logic
- `src/hooks/useNotifications.ts` — Notification hook

### Premium gating
- `src/config/premium.ts` — `usePremiumGate()` hook
- `src/config/features.ts` — Feature flags

### Design system
- `src/theme.ts` — All styling values
- `src/i18n/locales/en/common.json` — English translations
- `src/i18n/locales/es/common.json` — Spanish translations (vos conjugation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SavedDiagnosis` type: Already has `resolved`, `resolvedDate` fields — can be extended with `severity`, `followUpDate`, `followUpNotificationId`, `entries[]`
- `DiagnosisFollowUp` component: Renders unresolved diagnoses, has resolve/unresolve actions — can be extended or replaced for richer problem tracking
- `notificationScheduler.ts`: Existing scheduling logic for care reminders — pattern to follow for follow-up notifications
- `useStorage.diagnosisHistory`: Already manages `Record<string, SavedDiagnosis[]>` — storage operations can be extended

### Established Patterns
- Local-first: All data in AsyncStorage under `plant-agenda-v2` key
- Premium gating: `usePremiumGate()` + `Features.*` checks before rendering gated UI
- i18n: All strings via `t('key')`, translations in `en/common.json` and `es/common.json`
- Edge functions: Supabase edge function proxies, accept `lang` parameter
- Emoji icons: Used throughout for plant types, statuses — severity emoji labels fit naturally

### Integration Points
- `DiagnosisResults.tsx` (Phase 1 modified): Where "Track this problem" button would appear after diagnosis
- `useStorage.tsx`: Where problem tracking storage operations are added
- `notificationScheduler.ts`: Where follow-up scheduling logic is added
- `diagnose-plant` edge function: Where severity + summary response fields are added

</code_context>

<specifics>
## Specific Ideas

- Resolution card in chat: "¡Tu planta mejoró!" with green button — inline in the conversation flow, not a modal
- Subtle checkmark animation on resolve — not confetti, not over-the-top
- Spanish uses vos: "Seguí el tratamiento" / "Tu planta mejoró" / "Marcá como resuelto"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-problem-tracking-core*
*Context gathered: 2026-03-19*
