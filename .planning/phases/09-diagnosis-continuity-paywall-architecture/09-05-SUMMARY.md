---
phase: 09-diagnosis-continuity-paywall-architecture
plan: 05
subsystem: ui
tags: [react-native, modal, paywall, diagnosis, premium, i18n]

# Dependency graph
requires:
  - phase: 09-01
    provides: DiagnosisChatMessage role 'system' union widening + SavedDiagnosis.reopenedAt field
  - phase: 09-02
    provides: showPaywall(trigger, options?) API + PaywallCallbackOptions + consumePendingCallback
  - phase: 09-03
    provides: updateDiagnosis(plantId, diagnosisId, Partial<SavedDiagnosis>) action in useStorage
  - phase: 09-04
    provides: i18n keys diagnosis.continueChat/reopenChat/resumeBanner/reopenSystemMessage/messagesRemaining
provides:
  - DiagnosisDetailModal with isPremium gate REMOVED from continue-chat button render
  - handleContinueOrReopen: premium fast-path + free close-then-paywall (350ms iOS safe)
  - Reopen system message idempotent append via updateDiagnosis (key sys-${reopenedAtIso})
  - Mode-aware button label: 'Reopen consultation' for resolved, 'Continue chat' otherwise
  - MyPlantDetailModal onContinueChat closure documented for RESEARCH §Q3 deferred onSuccess
  - TodayScreen DiagnosisDetailModal caller fixed (isPremium prop removed)
  - T1 + T2 + T3 smoke assertions live in smoke-phase09.mjs (53/53 PASS)
affects:
  - 09-06 (PlantDiagnosisModal count display — relies on chat open after paywall)
  - 09-08 (audit remaining showPaywall callers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "close-then-paywall (350ms): DiagnosisDetailModal now follows the established MyPlantDetailModal.requestPaywall pattern — onClose() then setTimeout(() => showPaywall(...), 350) — iOS Modal stacking safety"
    - "idempotency key sys-${reopenedAtIso}: system message id is deterministic from reopenedAt so duplicate appends are detectable without extra state"
    - "hook-reads-own-premium: DiagnosisDetailModal reads isPremium from usePremiumGate() directly; no prop threading needed"

key-files:
  created: []
  modified:
    - src/components/PlantDiagnosis/DiagnosisDetailModal.tsx
    - src/components/MyPlantDetailModal.tsx
    - src/screens/TodayScreen.tsx
    - scripts/smoke-phase09.mjs

key-decisions:
  - "isPremium prop removed from DiagnosisDetailModal entirely — component reads usePremiumGate() directly (single source of truth); all callers (MyPlantDetailModal + TodayScreen) updated atomically"
  - "Reopen system message idempotency key is sys-${reopenedAtIso} — deterministic id allows O(1) last-message check without scanning the full chat array; RESEARCH §Q2 lock"
  - "System message append runs BEFORE paywall check (both premium and free paths) — reopenedAt is set regardless of purchase outcome; this is intentional: the reopen intent is captured even if the user cancels the paywall"

patterns-established:
  - "Idempotency key pattern for chat system messages: id = sys-${reopenedAtIso}, check lastMsg.role === 'system' && lastMsg.id === sys-${diagnosis.reopenedAt}"

requirements-completed: ["DIAG-01", "DIAG-02", "DIAG-03"]

# Metrics
duration: 8min
completed: 2026-05-02
---

# Phase 9 Plan 05: DiagnosisDetailModal Gate Removal + Close-Then-Paywall + Reopen System Message

**isPremium gate removed from DiagnosisDetailModal continue-chat button; free users see close-then-paywall (350ms); resolved diagnoses append idempotent system message via updateDiagnosis before paywall opens**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-02T15:05:02Z
- **Completed:** 2026-05-02T15:13:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- DIAG-01: `{isPremium && !diagnosis.resolved && onContinueChat && ...}` (line 248) replaced with `{onContinueChat && ...}` — button now visible to ALL users
- DIAG-02: Free user tap closes parent modal then opens App-level paywall via `showPaywall('diagnosis-resume', { onSuccess: () => onContinueChat(diagnosis) })` with 350ms iOS safety delay
- DIAG-03: Resolved diagnoses show "Reopen consultation" label; on tap, idempotent system message with id `sys-${reopenedAtIso}` appended to chat[] and `reopenedAt` persisted via `updateDiagnosis`
- Both callers (MyPlantDetailModal + TodayScreen) cleaned up: `isPremium` prop removed
- T1 + T2a/b/c/d + T3a/b/c/d/e/f smoke assertions activated — smoke PASS 53/53 (up from 34/34)
- tsc exits 0 project-wide

## Task Commits

1. **Task 1: DiagnosisDetailModal restructuring** - `78ace59` (feat)
2. **Task 2: Drop isPremium prop from callers + closure doc** - `338e127` (feat)
3. **Task 3: Activate T1+T2+T3 in smoke-phase09** - `0713d52` (test)

**Plan metadata:** committed with docs(09-05) final commit

## Files Created/Modified

- `src/components/PlantDiagnosis/DiagnosisDetailModal.tsx` — Gate removed; imports usePremiumGate/usePremium/useStorage/daysBetween/parseDate/DiagnosisChatMessage; handleContinueOrReopen handler + idempotent reopen system message; mode-aware buttonLabel
- `src/components/MyPlantDetailModal.tsx` — isPremium prop removed from DiagnosisDetailModal JSX; RESEARCH §Q3 closure comment added
- `src/screens/TodayScreen.tsx` — isPremium prop removed from DiagnosisDetailModal JSX (Rule 3 fix — second consumer)
- `scripts/smoke-phase09.mjs` — T1 (gate removal), T2a-d (close-then-paywall pattern), T3a-f (idempotency) activated

## Decisions Made

- `isPremium` prop removed from `DiagnosisDetailModalProps` entirely — component now self-reads from `usePremiumGate()`. Cleaner single source of truth. All callers updated atomically.
- System message append runs before the premium/free branch — even if free user cancels paywall, `reopenedAt` is already persisted. This is intentional: the reopen intent is captured.
- Idempotency key `sys-${reopenedAtIso}` — deterministic from `reopenedAt` field, so the last-message check is O(1) and requires no extra state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TodayScreen.tsx also passes isPremium prop to DiagnosisDetailModal**
- **Found during:** Task 2 (running tsc after MyPlantDetailModal fix)
- **Issue:** tsc showed TodayScreen.tsx line 567 also passes `isPremium={premium.isPremium}` to `<DiagnosisDetailModal>`. Plan only mentioned MyPlantDetailModal as the sole consumer, but RESEARCH §CF-6 and grep revealed TodayScreen as a second consumer.
- **Fix:** Removed `isPremium={premium.isPremium}` from DiagnosisDetailModal JSX in TodayScreen.tsx (line 567). No other logic changed.
- **Files modified:** src/screens/TodayScreen.tsx
- **Verification:** tsc exits 0 after both fixes; smoke PASS 53/53
- **Committed in:** 338e127 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking: second caller not listed in plan)
**Impact on plan:** Required for tsc to exit 0. No scope creep — identical change type as the planned MyPlantDetailModal fix.

## Issues Encountered

None beyond the TodayScreen second-consumer (handled as Rule 3 above).

## Confirmation of Key Invariants

- `grep "isPremium && !diagnosis.resolved" DiagnosisDetailModal.tsx` === 0 (DIAG-01 satisfied)
- `grep "resolvedAt" DiagnosisDetailModal.tsx` === 0 (RESEARCH §CF-1 lock honored; only `resolvedDate` used)
- `grep "showPaywall('diagnosis-resume'" DiagnosisDetailModal.tsx` === 1 (DIAG-02 single invocation)
- `grep "isPremium={isPremium}" MyPlantDetailModal.tsx` === 0 (prop removed from caller)
- No other DiagnosisDetailModal consumers exist — tsc green confirms MyPlantDetailModal + TodayScreen are the only two callers
- T1, T2, T3 PASS in smoke-phase09.mjs

## Next Phase Readiness

- Plan 09-06 owns the visual differentiation of system messages (centered banner vs bubble) in DiagnosisResults.tsx — this plan left transitional bubble rendering acceptable
- Plan 09-06 also owns PlantDiagnosisModal count display + send-tap gating + resume banner
- Plan 09-08 audits remaining showPaywall callers (PlantDiagnosisModal, PlantIdentifierModal)

---
*Phase: 09-diagnosis-continuity-paywall-architecture*
*Completed: 2026-05-02*
