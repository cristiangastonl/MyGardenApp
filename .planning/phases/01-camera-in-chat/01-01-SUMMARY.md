---
phase: 01-camera-in-chat
plan: 01
subsystem: ui
tags: [react-native, expo-image-picker, action-sheet, i18n, camera, permissions]

# Dependency graph
requires: []
provides:
  - Camera option in diagnosis chat photo picker (iOS ActionSheetIOS + Android custom Modal)
  - Permission denial inline info box in chat UI with Settings deep-link
  - Photo button visible for all users (disabled + paywall tap for free-tier)
  - New i18n keys: diagnosis.chatTakePhoto, chatChooseGallery, chatCameraPermissionDenied, chatOpenSettings
affects:
  - Phase 2 (diagnosis tracking) - camera capture returns same {base64, uri} interface as gallery
  - Any future chat UI work that touches DiagnosisResults or PlantDiagnosisModal

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Action sheet dispatcher pattern: pickChatPhoto returns a Promise resolved asynchronously by either iOS native ActionSheetIOS or Android custom Modal via ref"
    - "Inline permission-denial pattern: permission errors surface as React state prop (chatCameraPermissionDenied) not as error messages or API calls"
    - "Free-tier button visibility: photo button always rendered when onPickChatPhoto provided; disabled state (opacity 0.4) + onPaywall tap when !canSendChat"

key-files:
  created: []
  modified:
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json
    - src/components/PlantDiagnosis/DiagnosisResults.tsx
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx

key-decisions:
  - "Used settings.cancel for Android cancel row instead of a new common.cancel key — no top-level cancel key exists in common.json and settings.cancel is identical in meaning"
  - "pickChatPhotoFromCamera is separate from usePlantDiagnosis.pickFromCamera to avoid mutating diagnosis hook state during chat"
  - "Camera permission denial surfaces as a React boolean prop (chatCameraPermissionDenied) passed from Modal to Results, not as an alert or toast"

patterns-established:
  - "Promise resolver ref pattern: Android bottom sheet stores Promise resolve function in a useRef to bridge React Modal and async photo picker"
  - "Free-tier button: always visible when picker prop provided, disabled state on !canSendChat, onPaywall callback on tap"

requirements-completed: [CAM-01, CAM-02, CAM-03, CAM-04]

# Metrics
duration: 25min
completed: 2026-03-19
---

# Phase 1 Plan 01: Camera in Chat Summary

**iOS ActionSheetIOS + Android bottom sheet modal dispatching to camera and gallery in diagnosis chat, with inline camera permission denial message and free-tier paywall gating**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-19
- **Completed:** 2026-03-19
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Photo button in diagnosis chat now shows action sheet (iOS native / Android custom) with camera and gallery options
- Camera path: requests permission, launches camera, returns {base64, uri} for inline thumbnail preview
- Permission denial handled inline — info box appears below message list with "Open Settings" deep-link
- Photo button always visible; free-tier users see disabled (0.4 opacity) button that triggers paywall on tap
- All 4 new i18n keys added in EN and ES (vos, casual tone)

## Task Commits

1. **Task 1: Add i18n keys and update DiagnosisResults with permission UI and free-tier button** - `6adef18` (feat)
2. **Task 2: Rewrite pickChatPhoto with action sheet dispatcher, camera path, and Android modal** - `57ad3ae` (feat)

## Files Created/Modified
- `src/i18n/locales/en/common.json` - 4 new diagnosis.chat* keys
- `src/i18n/locales/es/common.json` - 4 new diagnosis.chat* keys (Argentine Spanish, vos conjugation)
- `src/components/PlantDiagnosis/DiagnosisResults.tsx` - New props (chatCameraPermissionDenied, onPaywall), reworked photo button guard, permission denial info box, new styles
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` - pickChatPhotoFromCamera, pickChatPhotoFromGallery, action sheet dispatcher, Android bottom sheet Modal, new styles

## Decisions Made
- Used `t('settings.cancel')` instead of `t('common.cancel')` since no top-level cancel key exists in common.json; settings.cancel is semantically identical
- Camera and gallery split into two separate callbacks (`pickChatPhotoFromCamera`, `pickChatPhotoFromGallery`) to keep the permission flows and try/catch blocks clean
- Permission denial state (cameraPermissionDenied) is cleared automatically when the user subsequently grants camera permission

## Deviations from Plan

None - plan executed exactly as written. The only minor adaptation was using `t('settings.cancel')` instead of `t('common.cancel')` (no top-level key exists), which is functionally identical.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CAM-01 through CAM-04 complete — camera capture returns identical {base64, uri} interface as gallery
- Phase 2 (diagnosis tracking / SavedDiagnosis persistence) can proceed without changes to the camera/gallery interface
- Android physical device testing recommended (expo issue #39480: silent failure on 2025-09-05 security patch — existing try/catch covers it)

---
*Phase: 01-camera-in-chat*
*Completed: 2026-03-19*
