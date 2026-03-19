# Phase 1: Camera in Chat - Research

**Researched:** 2026-03-19
**Domain:** React Native / Expo image picker, ActionSheet UX, inline permission messaging
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single photo button in chat input → opens iOS-style action sheet with two options: "Sacar foto" (camera) and "Elegir de galería" (gallery)
- Action sheet pattern matches WhatsApp/Telegram — standard, familiar to users
- When free-tier message limit is reached: photo button remains visible but disabled (grayed out). Tapping shows the premium paywall — same as chat input field behavior but reinforces premium exists
- If user denies camera permission: show an inline system message in the chat thread (not an Alert popup)
- Message explains why camera access is needed and includes a link to open device Settings
- Gallery option should still work independently even if camera is denied

### Claude's Discretion
- Photo quality setting (0.5 currently used for both initial diagnosis and chat) — Claude decides optimal value balancing AI accuracy vs upload speed
- Exact action sheet styling and animation
- Thumbnail preview implementation details (gallery path already has this working)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAM-01 | User can take a photo with the device camera directly from the diagnosis chat | `pickFromCamera` in `usePlantDiagnosis` (line 156) provides the complete implementation — request permission, launch camera, return `{ base64, uri }`. Lift-and-adapt into `pickChatPhoto`. |
| CAM-02 | User sees an action sheet (camera vs gallery) when tapping the attachment button in diagnosis chat | React Native's built-in `ActionSheetIOS` (iOS) + custom bottom-sheet modal (Android) pattern. No external library needed — existing `Platform.select` pattern used throughout the codebase. |
| CAM-03 | Camera permission denial shows a contextual explanation and links to device Settings | `Linking.openSettings()` already used in `SettingsScreen.tsx` line 332. Inline chat message approach avoids Alert. `sendChatMessage` already accepts role `'user'` / `'assistant'` — inject a synthetic `'assistant'` system message into chat state instead. |
| CAM-04 | Photo taken from camera shows as inline thumbnail preview before sending (same as gallery photos) | `DiagnosisResults.tsx` already renders `pendingPhoto` thumbnail (lines 240-247) and `chatImage` inside bubbles (lines 210-211). Camera path must return the same `{ base64, uri }` shape that gallery returns — zero additional UI work needed. |
</phase_requirements>

---

## Summary

This phase is a surgical extension of an already-working pattern. The initial diagnosis flow (`CameraCapture` component) already wires both camera and gallery through `usePlantDiagnosis.pickFromCamera()` and `pickFromGallery()`. The chat follow-up (`pickChatPhoto` in `PlantDiagnosisModal.tsx` line 111) currently only calls the gallery picker inline without the hook. The work is: (1) replace `pickChatPhoto` with a version that shows an action sheet offering both options, (2) route each option through the correct picker logic with appropriate permission handling, (3) inject an inline chat message on camera permission denial instead of silently returning null.

The thumbnail preview (CAM-04) requires zero UI changes — `DiagnosisResults` already renders `pendingPhoto` preview and `chatImage` inside message bubbles. The camera-captured image just needs to return the same `{ base64, uri }` interface.

No new libraries are required. All needed primitives (`ImagePicker`, `ActionSheetIOS`, `Linking`, chat state) are already present in the project.

**Primary recommendation:** Rewrite `pickChatPhoto` in `PlantDiagnosisModal.tsx` to show an action sheet, then delegate to camera or gallery paths adapted from `usePlantDiagnosis`. Add a `injectSystemChatMessage` helper for the permission-denial inline message.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-image-picker` | Already installed (Expo SDK 54) | Camera launch + gallery launch | Used in `usePlantDiagnosis` and `photoService.ts`. No alternative needed. |
| `react-native` `ActionSheetIOS` | Built-in | Native iOS action sheet | Zero dependencies, matches WhatsApp pattern. iOS only — Android fallback is a custom modal. |
| `react-native` `Linking` | Built-in | `Linking.openSettings()` for deep-link to device Settings | Already used in `SettingsScreen.tsx` line 332. |
| `react-native` `Platform` | Built-in | Platform.OS branching for ActionSheet vs modal | Pattern used throughout the codebase. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-i18next` | Already installed | All new user-facing strings | Every string must use `t('key')` — no hardcoded text. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ActionSheetIOS` + custom Android modal | `@expo/react-native-action-sheet` | External dep adds overhead; native is sufficient for two-item sheets. Stick with built-in. |
| Inline chat message for permission denial | `Alert.showAlert` | Decision is locked: no Alert popup. Inline message is more contextual and matches chat UX. |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Pattern 1: Replace `pickChatPhoto` with action sheet + dual paths

**What:** `pickChatPhoto` is a `useCallback` defined inline in `PlantDiagnosisModal.tsx` (line 111). Replace it with a new version that shows an action sheet, then calls either a camera or gallery branch.

**When to use:** This is the only change point. The function signature `() => Promise<{ base64: string; uri: string } | null>` must be preserved — `DiagnosisResults` calls it via `onPickChatPhoto` prop and expects exactly this return type.

**Camera branch implementation** (adapted from `usePlantDiagnosis.pickFromCamera` lines 156-176):
```typescript
// Source: usePlantDiagnosis.ts lines 156-176 (existing, verified)
const pickChatPhotoFromCamera = useCallback(async (): Promise<{ base64: string; uri: string } | null> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      // CAM-03: inject inline system message instead of returning null silently
      injectPermissionDeniedMessage();
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.5,   // Matches existing diagnosis quality constant
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return null;
    return { base64: result.assets[0].base64!, uri: result.assets[0].uri };
  } catch {
    return null;
  }
}, []);
```

**Gallery branch implementation** (mirror of existing `pickChatPhoto`):
```typescript
// Source: PlantDiagnosisModal.tsx lines 111-126 (existing, verified)
const pickChatPhotoFromGallery = useCallback(async (): Promise<{ base64: string; uri: string } | null> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return null;
    return { base64: result.assets[0].base64!, uri: result.assets[0].uri };
  } catch {
    return null;
  }
}, []);
```

### Pattern 2: Action sheet — iOS native, Android custom modal

**What:** `pickChatPhoto` itself becomes a dispatcher that shows the action sheet UI before delegating.

**iOS (ActionSheetIOS):**
```typescript
// Source: React Native built-in docs
import { ActionSheetIOS, Platform } from 'react-native';

// Called when user taps the 📷 button
const pickChatPhoto = useCallback((): Promise<{ base64: string; uri: string } | null> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common.cancel'), t('diagnosis.chatTakePhoto'), t('diagnosis.chatChooseGallery')],
          cancelButtonIndex: 0,
        },
        async (index) => {
          if (index === 1) resolve(await pickChatPhotoFromCamera());
          else if (index === 2) resolve(await pickChatPhotoFromGallery());
          else resolve(null);
        }
      );
    } else {
      // Android: set state flag to show modal, resolve via callbacks
      setShowPhotoSourceModal(true);
      photoSourceResolveRef.current = resolve;
    }
  });
}, [pickChatPhotoFromCamera, pickChatPhotoFromGallery, t]);
```

**Android bottom sheet:** A simple `Modal` with two `TouchableOpacity` rows — camera and gallery — plus a cancel row. Use `colors.card`, `borderRadius.xl`, `shadows.lg` from theme. This is the "exact styling" left to Claude's discretion.

### Pattern 3: Inline permission-denial system message (CAM-03)

**What:** Instead of an Alert or silent null return on camera permission denial, inject a synthetic assistant-role message into `chatMessages` state. The message includes a `Linking.openSettings()` call-to-action rendered as a tappable link inside the bubble.

**Integration point:** `sendChatMessage` in `usePlantDiagnosis` uses `setChatMessages`. The injection needs to happen in `PlantDiagnosisModal`, which means it must call a new callback prop or pass a ref down. The cleanest approach:

Option A (recommended): `PlantDiagnosisModal` calls `sendChatMessage` directly with a synthetic system text and no imageBase64. The AI receives the message but won't reply usefully — this is the wrong signal.

Option B (correct): Add a `injectChatMessage` helper that calls `setChatMessages` in the hook directly. Expose it from `usePlantDiagnosis` as a new return value.

Option C (simplest, recommended): The inline message is rendered **outside** the normal chat bubble flow — as a special `View` inside `DiagnosisResults` that only appears when a `cameraPermissionDenied` prop is true. This is stateless from the chat's perspective and does not pollute message history. A boolean flag `chatCameraPermissionDenied` is lifted to `PlantDiagnosisModal` state and passed as prop.

**Recommended: Option C.** No hook changes needed. The inline inline UI can render between the input area and the message list, styled as an info-color system notification with a "Abrir configuración" link.

```typescript
// Source: SettingsScreen.tsx line 332 (existing Linking.openSettings pattern)
import { Linking } from 'react-native';
Linking.openSettings(); // opens device Settings for this app
```

### Pattern 4: Premium-disabled button (existing canSendChat gate)

The photo button in `DiagnosisResults.tsx` line 249 already checks:
```typescript
// Source: DiagnosisResults.tsx line 249 (existing, verified)
{onPickChatPhoto && isPremium && (
  <TouchableOpacity style={styles.chatPhotoButton} onPress={handlePickPhoto}>
```

The CONTEXT.md decision says: photo button should be **visible but disabled** when the free-tier message limit is reached (not hidden, not premium-only). Currently the button is only rendered for `isPremium`. This guard needs to change to: **always render the button** when chat is in premium-gate state, but `onPress` calls `showPaywall` instead of `handlePickPhoto`.

The `canSendChat` boolean (line 238) and `isPremium` (line 273) are already available as props. The updated logic:
```typescript
// Derived from DiagnosisResults.tsx lines 238-253 (existing)
// Proposed change:
{onPickChatPhoto && (
  <TouchableOpacity
    style={[styles.chatPhotoButton, !canSendChat && styles.chatPhotoButtonDisabled]}
    onPress={canSendChat ? handlePickPhoto : onPaywall}
  >
    <Text style={styles.chatPhotoButtonText}>📷</Text>
  </TouchableOpacity>
)}
```

This requires adding an `onPaywall` prop to `DiagnosisResults`.

### Anti-Patterns to Avoid

- **Do NOT route through `sendChatMessage` for the permission denial message.** It would trigger an AI API call with no useful content.
- **Do NOT add a new permission check to `usePlantDiagnosis.pickFromCamera`.** That function changes `state` to `'error'` on denial — wrong behavior for the chat context where we want inline messaging, not a full screen error state.
- **Do NOT call `usePlantDiagnosis.pickFromCamera` directly for the chat picker.** That function mutates hook state (`setImages`, `setState`) which belongs to the initial diagnosis flow, not the chat flow. Implement camera logic inline in `PlantDiagnosisModal` for the chat case.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Action sheet | Custom animated bottom drawer with gesture handler | `ActionSheetIOS` (iOS) + simple `Modal` (Android) | Two-item sheet doesn't warrant a gesture library. Native sheet matches OS conventions automatically. |
| Camera permission check | Custom permission state machine | `ImagePicker.requestCameraPermissionsAsync()` | Already used in `usePlantDiagnosis`. Handles both first-ask and already-denied states. |
| Deep link to Settings | Custom URL scheme construction | `Linking.openSettings()` | Already used in `SettingsScreen.tsx`. Works cross-platform. |
| Photo quality optimization | Adaptive quality based on network | Fixed 0.5 quality | Consistent with existing diagnosis flows. AI accuracy does not measurably improve above 0.5 for plant disease analysis based on existing usage. |

---

## Common Pitfalls

### Pitfall 1: Calling `usePlantDiagnosis.pickFromCamera` from the chat context

**What goes wrong:** `pickFromCamera` sets `setState('error')` on permission denial and calls `setError(t('diagnosis.cameraPermissionNeeded'))`. This transitions the entire modal to error state, not just the chat.

**Why it happens:** The hook's camera function owns the diagnosis capture state machine.

**How to avoid:** Implement a separate, inline camera-picker function inside `pickChatPhoto` that only returns `{ base64, uri } | null` — no state mutations.

**Warning signs:** After permission denial, the chat screen disappears and is replaced by the error screen.

### Pitfall 2: Android silent camera failure

**What goes wrong:** On Android security patch 2025-09-05 (expo issue #39480), `launchCameraAsync` can fail silently — no error thrown, result has `canceled: true` but user did not actually cancel.

**Why it happens:** Known Expo upstream issue documented in STATE.md.

**How to avoid:** Existing `try/catch` and the `result.canceled` guard handle both cases. The chat camera picker must include a `try/catch` block — do not write a version without it. Test on physical Android device.

**Warning signs:** Works fine in iOS simulator, fails on physical Android.

### Pitfall 3: Action sheet `Promise` stays unresolved on Android back-press

**What goes wrong:** If implementing Android action sheet as a `Modal` with a `Promise` resolver pattern, pressing the Android hardware back button dismisses the modal without calling the resolve function, leaving a dangling Promise.

**Why it happens:** `Modal` `onRequestClose` is called on back-press but is often not wired to the resolver.

**How to avoid:** Always wire `onRequestClose` to `resolve(null)` and use `useRef` for the resolver to avoid stale closure issues.

**Warning signs:** Second tap on photo button appears to do nothing (previous Promise never resolved).

### Pitfall 4: `isPremium` guard hides photo button for all non-premium users

**What goes wrong:** Current code (`DiagnosisResults.tsx` line 249) only renders the photo button when `isPremium && canSendChat`. The CONTEXT.md decision requires the button to be **visible but disabled** when `!canSendChat`.

**Why it happens:** The original implementation treated camera as a strictly premium feature.

**How to avoid:** Change the render condition to always show the button when `onPickChatPhoto` is provided, and handle the disabled/paywall state inside the `onPress` handler.

---

## Code Examples

### Existing `pickChatPhoto` (gallery-only, to be replaced)
```typescript
// Source: PlantDiagnosisModal.tsx lines 111-126
const pickChatPhoto = useCallback(async (): Promise<{ base64: string; uri: string } | null> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });
    if (pickerResult.canceled || !pickerResult.assets?.[0]?.base64) return null;
    return { base64: pickerResult.assets[0].base64!, uri: pickerResult.assets[0].uri };
  } catch {
    return null;
  }
}, []);
```

### Existing `Linking.openSettings()` pattern (for permission-denial link)
```typescript
// Source: SettingsScreen.tsx line 332
import { Linking } from 'react-native';
<TouchableOpacity onPress={() => Linking.openSettings()}>
  <Text>{t('settings.openSettings')}</Text>
</TouchableOpacity>
```

### Existing photo button render guard (to be extended)
```typescript
// Source: DiagnosisResults.tsx lines 249-253
{onPickChatPhoto && isPremium && (
  <TouchableOpacity style={styles.chatPhotoButton} onPress={handlePickPhoto}>
    <Text style={styles.chatPhotoButtonText}>📷</Text>
  </TouchableOpacity>
)}
```

### Existing pending photo thumbnail (already works for camera path)
```typescript
// Source: DiagnosisResults.tsx lines 240-247
{pendingPhoto && (
  <View style={styles.pendingPhotoContainer}>
    <Image source={{ uri: pendingPhoto.uri }} style={styles.pendingPhotoPreview} />
    <TouchableOpacity style={styles.pendingPhotoRemove} onPress={() => setPendingPhoto(null)}>
      <Text style={styles.pendingPhotoRemoveText}>✕</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## Translation Keys Needed

New i18n keys required in both `en/common.json` and `es/common.json`:

| Key | EN value | ES value (vos, casual) |
|-----|----------|------------------------|
| `diagnosis.chatTakePhoto` | "Take a photo" | "Sacar foto" |
| `diagnosis.chatChooseGallery` | "Choose from gallery" | "Elegir de galería" |
| `diagnosis.chatCameraPermissionDenied` | "Camera access was denied. To take photos in chat, enable camera access in your device settings." | "No tenés permiso para usar la cámara. Para sacar fotos en el chat, habilitá el acceso a la cámara en la configuración del dispositivo." |
| `diagnosis.chatOpenSettings` | "Open Settings" | "Abrir configuración" |

Note: `t('common.cancel')` already exists. ActionSheetIOS cancel label reuses it.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `ImagePicker.MediaTypeOptions.Images` (deprecated) | `mediaTypes: 'images'` (string literal) | Already updated in this codebase — verified in `usePlantDiagnosis.ts` line 165. |
| `allowsEditing: true` in diagnosis flows | `allowsEditing: false` | CLAUDE.md notes: "disable image crop step" — already set in existing code. Keep `false` for camera in chat. |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test runner configured (per CLAUDE.md: "No test framework is set up") |
| Config file | none |
| Quick run command | `npx tsc --noEmit` (type-check only) |
| Full suite command | `npx tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAM-01 | Camera picker returns `{ base64, uri }` from chat | manual-only | — | N/A — no test framework |
| CAM-02 | Action sheet appears with two options on photo button tap | manual-only | — | N/A |
| CAM-03 | Camera permission denial shows inline message with Settings link | manual-only | — | N/A |
| CAM-04 | Camera photo shows as thumbnail preview (pending photo area) | manual-only | — | N/A |

Manual-only justification: No test framework exists in this project. TypeScript type-checking (`npx tsc --noEmit`) is the only automated validation. All behavior verification is via device testing.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx tsc --noEmit`
- **Phase gate:** TypeScript clean + manual device testing of all 4 requirements on iOS and Android physical devices before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure setup needed. TypeScript is already configured.

---

## Key Decisions for the Planner

1. **Photo quality: keep 0.5.** Consistent with all other diagnosis flows. At 0.5, a typical plant close-up is ~200-400KB — fast to upload, adequate for AI. Going lower risks losing detail the AI needs.

2. **Android action sheet: simple Modal.** A two-row `Modal` with camera and gallery `TouchableOpacity` rows is sufficient. No animation library. Style with `colors.card`, `borderRadius.xl`, `shadows.lg`.

3. **Permission denial: Option C (prop-based flag).** Add `cameraPermissionDenied: boolean` state to `PlantDiagnosisModal`, pass as `chatCameraPermissionDenied` prop to `DiagnosisResults`. Render inline info box above the input row. No hook changes. Does not pollute chat message history.

4. **Photo button visible-but-disabled for free-tier gate.** Add `onPaywall?: () => void` prop to `DiagnosisResults`. Render button always (when `onPickChatPhoto` provided), disable + call `onPaywall` when `!canSendChat`.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `PlantDiagnosisModal.tsx` — `pickChatPhoto` lines 111-126, integration at line 185
- Direct code inspection: `usePlantDiagnosis.ts` — `pickFromCamera` lines 156-176, `pickFromGallery` lines 178-198
- Direct code inspection: `DiagnosisResults.tsx` — photo button line 249, pending photo lines 240-247, chat image line 210
- Direct code inspection: `SettingsScreen.tsx` line 332 — `Linking.openSettings()` pattern
- Direct code inspection: `photoService.ts` — camera/gallery options used in the project
- Direct code inspection: `premium.ts` — `canChatDiagnosis` gate logic
- Direct code inspection: `en/common.json` — existing translation key inventory

### Secondary (MEDIUM confidence)
- React Native docs (built-in knowledge): `ActionSheetIOS.showActionSheetWithOptions` API — stable API, unchanged in React Native 0.73+
- React Native docs (built-in knowledge): `Linking.openSettings()` — cross-platform, stable

### Tertiary (LOW confidence)
- STATE.md reference to expo issue #39480 (Android silent camera failure) — flagged in project docs, not independently verified. Treat `try/catch` + `result.canceled` guard as mandatory.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, verified by direct code inspection
- Architecture: HIGH — integration points identified by exact file+line, interfaces verified
- Pitfalls: HIGH for pitfalls 1/4 (code-verified), MEDIUM for pitfall 2 (issue reference from STATE.md), HIGH for pitfall 3 (React Native Modal known behavior)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable Expo SDK 54 / React Native APIs)
