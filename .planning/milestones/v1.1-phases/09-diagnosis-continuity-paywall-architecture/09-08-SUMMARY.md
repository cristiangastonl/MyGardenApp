---
phase: 09-diagnosis-continuity-paywall-architecture
plan: "08"
subsystem: paywall
tags: [PAY-02, paywall, modal-stacking, iOS, refactor, audit]
dependency_graph:
  requires: ["09-02", "09-05", "09-06"]
  provides: ["PAY-02 compliance — all nested-modal showPaywall callers use close-then-trigger"]
  affects: []
tech_stack:
  added: []
  patterns: ["close-then-trigger (onClose() + setTimeout 350ms before showPaywall)", "named-handler delegation (handlePaywallFromChat)"]
key_files:
  created:
    - .planning/phases/09-diagnosis-continuity-paywall-architecture/09-AUDIT.md
  modified:
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
    - src/components/PlantIdentifier/PlantIdentifierModal.tsx
    - scripts/smoke-phase09.mjs
decisions:
  - "handlePaywallFromChat named useCallback chosen over inlining 350ms delay in DiagnosisResults JSX prop — keeps JSX clean and makes T9b smoke assertion unambiguous"
  - "T9a regex checks onPaywall={() JSX-prop shape specifically (not generic () => showPaywall substring) to avoid false positives from correct setTimeout wrappers"
  - "handlePaywallWithDeferredSend remains inside modal by design (DIAG-07 documented exception) — closing chat on send-tap would lose typed text (UX failure)"
metrics:
  duration: "8 min"
  completed: "2026-05-01"
  tasks_completed: 4
  files_modified: 4
---

# Phase 09 Plan 08: PAY-02 Closure — Nested-Modal showPaywall Audit + Refactor

**One-liner:** Flipped reversed handleRetake order in PlantDiagnosisModal, added `handlePaywallFromChat` close-then-trigger wrapper, refactored PlantIdentifierModal — PAY-02 satisfied across all 13 showPaywall call sites.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1+2 | Refactor PlantDiagnosisModal + PlantIdentifierModal (PAY-02) | 267de6a | PlantDiagnosisModal.tsx, PlantIdentifierModal.tsx |
| 3 | Write 09-AUDIT.md (13-row compliance table) | 8b6678c | 09-AUDIT.md |
| 4 | Activate T9 smoke assertions | fff7871 | smoke-phase09.mjs |

## Changes Made

### PlantDiagnosisModal.tsx (Tasks 1 + 2)

**Bug fixed (handleRetake order reversal — line 182-190):**
```
Before:  showPaywall('plant_diagnosis');   // ← modal still open, stacking bug
         handleClose();
After:   handleClose();                    // ← close first
         setTimeout(() => showPaywall('plant_diagnosis'), 350);  // ← then paywall
```

**New handler added (`handlePaywallFromChat`):**
```typescript
const handlePaywallFromChat = useCallback(() => {
  handleClose();
  setTimeout(() => showPaywall('plant_diagnosis'), 350);
}, [handleClose, showPaywall]);
```

**JSX prop updated:**
```
Before:  onPaywall={() => showPaywall('plant_diagnosis')}   // bare inline, inside open modal
After:   onPaywall={handlePaywallFromChat}                  // named close-then-trigger handler
```

**Documented exception comment added** above `handlePaywallWithDeferredSend` explaining the DIAG-07 PAY-02 carve-out (chat stays open because closing it would lose typed text; `typedText` captured in closure; deferred `onSuccess` re-fires `sendChatMessage`).

### PlantIdentifierModal.tsx (Task 2)

**handleDiagnose paywall path refactored:**
```
Before:  showPaywall('plant_diagnosis');   // bare call inside open modal
After:   onClose();                        // close modal first
         setTimeout(() => showPaywall('plant_diagnosis'), 350);  // PAY-02 compliant
```

### 09-AUDIT.md (Task 3)

13-row table covering all `showPaywall` call sites:
- 7 screen-level (correct as-is)
- 1 already-correct reference impl (`MyPlantDetailModal.requestPaywall`)
- 1 delegation pattern (`PlantPhotoAlbum` via `onRequestPremium` prop)
- 1 non-modal context (`DailyTip` renders in TodayScreen ScrollView)
- 3 refactored in this plan
- 1 documented exception (DIAG-07 deferred-send, `'diagnosis-limit'` trigger)

PAY-02 Status: **PASS**

### smoke-phase09.mjs T9 (Task 4)

8 sub-assertions (T9a–T9h) replacing the placeholder `pass++`:
- T9a: No bare `onPaywall={() => showPaywall('plant_diagnosis')}` JSX prop
- T9b: `handlePaywallFromChat` declared in PlantDiagnosisModal
- T9c: `handleClose() + setTimeout + showPaywall('plant_diagnosis')` pattern >= 2 occurrences
- T9d: PlantIdentifierModal has single `showPaywall('plant_diagnosis')` call
- T9e: PlantIdentifierModal has `setTimeout` close-then-trigger pattern
- T9f: `handlePaywallWithDeferredSend` exists (documented exception)
- T9g: `09-AUDIT.md` file exists
- T9h: Audit compliance summary marked PASS

Final result: `Phase 9 smoke: PASS (68/68)`. Zero remaining PLACEHOLDER blocks.

## DIAG-07 Documented Exception (PAY-02 Carve-Out)

`handlePaywallWithDeferredSend` in PlantDiagnosisModal deliberately does NOT follow the close-then-trigger rule:

- **Trigger:** User types a chat message, taps Send with 0 messages remaining.
- **Why modal stays open:** Closing the chat surface at this point dismisses the typed text — a surprising UX failure mid-typing.
- **Why it's safe:** `typedText` is captured in the closure passed to `showPaywall('diagnosis-limit', { onSuccess: ... })`. The `onSuccess` re-fires `sendChatMessage(text, base64, uri)` regardless of modal mount state. The paywall opens over the chat UI, which is the same `<Modal>` — React Native's `Modal.visible` toggle handles re-render correctly.
- **Trigger distinguisher:** Uses `'diagnosis-limit'` not `'plant_diagnosis'` — not in the PAY-02 audit scope for the bare-inline check.

This exception is documented in a code comment above `handlePaywallWithDeferredSend` in the source file.

## Deviations from Plan

None — plan executed exactly as written. The T9a regex was refined from the plan's draft to exclude `setTimeout(() => showPaywall(...))` substrings (which are the correct pattern) and instead check specifically for the JSX prop form `onPaywall={()`, preventing false positives.

## Self-Check: PASSED

All created files exist. All task commits verified present. `npx tsc --noEmit` exits 0. `node scripts/smoke-phase09.mjs` exits 0 with PASS (68/68).
