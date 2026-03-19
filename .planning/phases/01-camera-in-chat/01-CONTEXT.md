# Phase 1: Camera in Chat - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire camera capture into the diagnosis chat alongside the existing gallery picker. The initial diagnosis step already supports both camera and gallery via `CameraCapture` component — the gap is only in the chat follow-up phase, where `pickChatPhoto` currently only opens the gallery.

</domain>

<decisions>
## Implementation Decisions

### Attachment UX
- Single photo button in chat input → opens iOS-style action sheet with two options: "Sacar foto" (camera) and "Elegir de galería" (gallery)
- Action sheet pattern matches WhatsApp/Telegram — standard, familiar to users
- When free-tier message limit is reached: photo button remains visible but disabled (grayed out). Tapping shows the premium paywall — same as chat input field behavior but reinforces premium exists

### Permission Denial
- If user denies camera permission: show an inline system message in the chat thread (not an Alert popup)
- Message explains why camera access is needed and includes a link to open device Settings
- Gallery option should still work independently even if camera is denied

### Claude's Discretion
- Photo quality setting (0.5 currently used for both initial diagnosis and chat) — Claude decides optimal value balancing AI accuracy vs upload speed
- Exact action sheet styling and animation
- Thumbnail preview implementation details (gallery path already has this working)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Diagnosis chat implementation
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — Contains `pickChatPhoto` (line 111) which is the gallery-only function to replace. Also passes `onPickChatPhoto` to the chat component (line 185)
- `src/hooks/usePlantDiagnosis.ts` — Has working `pickFromCamera` (line 156) and `pickFromGallery` (line 178) already implemented with permission handling

### Reference implementation (camera + gallery already working)
- `src/components/PlantIdentifier/PlantIdentifierModal.tsx` — Uses `CameraCapture` component with both `onPickCamera` and `onPickGallery` (lines 177-178). This is the pattern to follow.
- `src/components/PlantIdentifier/CameraCapture.tsx` — Component with camera + gallery buttons for initial photo step

### Photo service
- `src/services/photoService.ts` — Shared photo service with `launchCameraAsync` (line 48) and `launchImageLibraryAsync` (line 57)

### Premium gating
- `src/config/premium.ts` — `usePremiumGate()` hook and `canChatDiagnosis()` function that controls free-tier message limits

### Design system
- `src/theme.ts` — All styling values (colors, spacing, fonts, shadows)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePlantDiagnosis.pickFromCamera()`: Already implemented, handles permissions, launches camera, processes image. Can be adapted for chat context.
- `usePlantDiagnosis.pickFromGallery()`: Already implemented, mirrors camera flow for gallery.
- `CameraCapture` component: Renders camera + gallery buttons in PlantIdentifier. Pattern reference for action sheet alternative.
- `photoService.ts`: Shared service with both camera and gallery launch functions.

### Established Patterns
- Chat photo function (`pickChatPhoto`) returns `{ base64, uri }` — camera version must match this interface
- Permission handling: hook versions set error state; chat version returns null. New approach: inline chat message.
- `sendChatMessage` already accepts `imageBase64` and `imageUri` parameters — no changes needed downstream
- Image quality: 0.5 used consistently across diagnosis flows

### Integration Points
- `PlantDiagnosisModal.tsx` line 185: `onPickChatPhoto={pickChatPhoto}` — this is the single point where chat photo picking is wired
- The chat component (likely `DiagnosisChat` or similar) receives `onPickChatPhoto` prop and renders the attachment button
- `canChat` boolean (line 109) already controls whether the user can send messages — photo button should respect this

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The action sheet with "Sacar foto" / "Elegir de galería" is the core UX decision.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-camera-in-chat*
*Context gathered: 2026-03-19*
