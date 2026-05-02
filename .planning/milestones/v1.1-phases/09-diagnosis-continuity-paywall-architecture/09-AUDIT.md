# Phase 9 — showPaywall Caller Audit (PAY-02)

**Date:** 2026-05-01 (researched) / 2026-05-01 (refactored in Plan 09-08)
**Audited as part of:** Plan 09-08 (Wave 6 — PAY-02 closure).
**Pattern lock:** Caller-close-first (RESEARCH §Pattern 3 + §Pitfall 1). Reference impl: `MyPlantDetailModal.requestPaywall` (lines 111-114).

## Audit Table

| File | Line | Trigger | Inside Modal? | Verdict | Resolution |
|------|------|---------|---------------|---------|------------|
| `SettingsScreen.tsx` | 397 | `'settings'` | No (screen-level handler) | ✅ correct as-is | Direct call from screen-level handler — no parent Modal to dismiss |
| `SettingsScreen.tsx` | 445 | `'dev_test'` | No (screen-level handler) | ✅ correct as-is | Same |
| `TodayScreen.tsx` | 158 | `'plant_limit'` | No (screen-level handler) | ✅ correct as-is | Same |
| `TodayScreen.tsx` | 330 | `'premium_feature'` | No (screen-level handler) | ✅ correct as-is | Same |
| `TodayScreen.tsx` | 499 | `'plant_identification'` | No (screen-level handler) | ✅ correct as-is | Same |
| `PlantsScreen.tsx` | 61 | `'plant_limit'` | No (screen-level handler) | ✅ correct as-is | Same |
| `PlantsScreen.tsx` | 211 | `'plant_identification'` | No (screen-level handler) | ✅ correct as-is | Same |
| `MyPlantDetailModal.tsx` | 113 | various | YES (modal) | ✅ correct as-is | Already uses `requestPaywall` close-then-trigger: `onClose(); setTimeout(() => showPaywall(trigger), 350)` — the reference implementation |
| `DailyTip.tsx` | 113 | `'daily_tip'` | No (rendered inside TodayScreen — not a Modal component) | ✅ correct as-is | Confirmed not nested inside a React Native `<Modal>` context; DailyTip renders as a plain View inside TodayScreen's ScrollView |
| `PlantPhotoAlbum.tsx` | 43 (handleUnlock fallback) | `'photo_album'` | Inside MyPlantDetailModal | ✅ correct as-is — delegation pattern | PlantPhotoAlbum calls `showPaywall` only when `onRequestPremium` prop is absent (fallback). In practice, `MyPlantDetailModal` always supplies `onRequestPremium={() => requestPaywall('photo_album')}` which closes itself first. |
| `PlantDiagnosisModal.tsx` | 182–190 (handleRetake) | `'plant_diagnosis'` | YES (modal) | ❌ REFACTORED in Plan 09-08 | Was: `showPaywall('plant_diagnosis'); handleClose();` (reversed order — iOS stacking bug). Now: `handleClose(); setTimeout(() => showPaywall('plant_diagnosis'), 350);` |
| `PlantDiagnosisModal.tsx` | 358 (DiagnosisResults `onPaywall` prop) | `'plant_diagnosis'` | YES (modal) | ❌ REFACTORED in Plan 09-08 | Was: `onPaywall={() => showPaywall('plant_diagnosis')}` inline. Now: `onPaywall={handlePaywallFromChat}` — a named useCallback that calls `handleClose()` then `setTimeout(() => showPaywall('plant_diagnosis'), 350)`. |
| `PlantIdentifierModal.tsx` | 74–78 (handleDiagnose) | `'plant_diagnosis'` | YES (modal) | ❌ REFACTORED in Plan 09-08 | Was: bare `showPaywall('plant_diagnosis')` from inside open modal. Now: `onClose(); setTimeout(() => showPaywall('plant_diagnosis'), 350);` |

## Documented Exception (PAY-02 + DIAG-07)

**PlantDiagnosisModal.tsx — `handlePaywallWithDeferredSend` (Plan 09-06):**

This handler is a deliberate exception to the PAY-02 close-then-trigger rule. Rationale:

- The user has typed a message and tapped Send with 0 messages remaining.
- Closing the chat surface would dismiss the typed text (UX failure — CONTEXT.md lock: "mid-typing surprise" is the anti-pattern).
- `typedText` is captured in the closure passed to `showPaywall('diagnosis-limit', { onSuccess: ... })` — the deferred `onSuccess` re-fires `sendChatMessage(text, base64, uri)` regardless of whether the chat surface is still mounted.
- The paywall opening over the chat is acceptable because the chat surface is the SAME Modal containing this caller; React Native's `Modal.visible` toggle handles re-render correctly.

This exception is documented in code (PlantDiagnosisModal.tsx, comment block above `handlePaywallWithDeferredSend`).

**Source:** `showPaywall('diagnosis-limit', { onSuccess: () => sendChatMessage(text, base64, uri) })` — not `'plant_diagnosis'`, so it does not appear in the close-then-trigger compliance table above.

## Compliance Summary

| Metric | Value |
|--------|-------|
| Total showPaywall sites audited | 13 |
| Screen-level callers (correct as-is) | 7 (SettingsScreen×2, TodayScreen×3, PlantsScreen×2) |
| Already-correct nested (close-then-trigger reference impl) | 1 (MyPlantDetailModal — `requestPaywall`) |
| Delegation pattern (correct) | 1 (PlantPhotoAlbum via `onRequestPremium` prop) |
| Non-Modal context (correct) | 1 (DailyTip — renders in TodayScreen ScrollView) |
| Refactored in Plan 09-08 | 3 (PlantDiagnosisModal handleRetake + onPaywall prop + PlantIdentifierModal handleDiagnose) |
| Documented exceptions (DIAG-07 deferred-send) | 1 (PlantDiagnosisModal `handlePaywallWithDeferredSend` — `'diagnosis-limit'` trigger, modal stays open by design) |
| **PAY-02 Status** | **PASS** |
