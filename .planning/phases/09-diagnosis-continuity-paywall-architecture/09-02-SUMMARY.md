---
phase: 09-diagnosis-continuity-paywall-architecture
plan: 02
subsystem: payments
tags: [paywall, deferred-callback, premium, modal, usePremium, PaywallModal]

dependency_graph:
  requires:
    - phase: 09-01
      provides: Wave 0 type extensions (DiagnosisChatMessage.role union, SavedDiagnosis.reopenedAt) + smoke-phase09 scaffold
  provides:
    - showPaywall(trigger, options?) API — options bag with onSuccess/onCancel
    - pendingCallback state in PremiumProvider — stores deferred callback pair
    - consumePendingCallback() — atomic get-and-clear for purchase success path
    - PaywallCallbackOptions exported interface
    - PaywallTrigger union extended with 'diagnosis-resume' + 'diagnosis-limit'
    - PaywallModal fires deferred onSuccess before hidePaywall (Pitfall 7 ordering)
    - PaywallModal mounted in BOTH AppContent paths (PAY-01 two-path discipline)
    - T7 + T8 + T10 smoke assertions active
  affects:
    - Plans 09-05 (uses showPaywall('diagnosis-resume', { onSuccess }))
    - Plans 09-06 (uses showPaywall('diagnosis-limit', { onSuccess }))
    - Plans 09-08 (audit confirms close-then-trigger callers; T9 assertion)
    - All future showPaywall callers (options? is backward-compatible)

tech-stack:
  added: []
  patterns:
    - "consumePendingCallback atomic get-and-clear: PaywallModal calls this in isPremium effect to get onSuccess before clearning, then hidePaywall sees null pendingCallback (Pitfall 7 prevention)"
    - "Capture-then-clear-then-fire ordering for cancel path: hidePaywall captures pendingCallback, clears it, then fires onCancel — prevents double-fire if hidePaywall is called again"
    - "showPaywall ALWAYS overwrites pendingCallback (Pitfall 2 prevention): new paywall implicitly cancels prior deferred callback context"
    - "Two-AppContent-paths discipline (Phase 5 lock): both AppContentMVP and AppContentFullInner must mount PaywallModal at root"

key-files:
  created: []
  modified:
    - src/hooks/usePremium.tsx
    - src/components/PaywallModal.tsx
    - App.tsx
    - scripts/smoke-phase09.mjs

key-decisions:
  - "consumePendingCallback chosen over exposing setPendingCallback: atomic get-and-clear in single callback avoids race between read and clear; PaywallModal doesn't need raw setter"
  - "T8 smoke assertion uses slice-based function body extraction (indexOf + slice) not regex /function F\([\s\S]*?\n\}/ — the lazy regex stops at the first close-brace in the parameter destructuring block, not the function body close"
  - "hidePaywall fires onCancel AFTER clearing pendingCallback (capture-then-clear-then-fire) so the purchase-success path (which calls consumePendingCallback before hidePaywall) leaves pendingCallback null — hidePaywall's onCancel branch is a no-op"

patterns-established:
  - "Pitfall 7 lock: purchase success path uses consumePendingCallback() to atomically clear before firing onSuccess; then hidePaywall() sees null and onCancel is no-op"
  - "T8 slice extraction pattern: use indexOf + slice to extract function bodies in smoke assertions, not lazy regex that can stop at parameter block close-braces"

requirements-completed: [PAY-01, PAY-03]

duration: ~4min
completed: 2026-05-01
---

# Phase 9 Plan 02: Paywall Deferred Callback + Two-Path Mount Summary

**showPaywall widened to accept `{ onSuccess?, onCancel? }` options; consumePendingCallback exposes atomic get-and-clear for purchase success; PaywallModal mounted in both AppContent paths satisfying PAY-01.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-01T22:54:43Z
- **Completed:** 2026-05-01T22:58:03Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Widened `usePremium().showPaywall(trigger, options?)` to accept optional `PaywallCallbackOptions` — all 13 existing single-arg callers continue to compile without changes (tsc exits 0)
- Added `consumePendingCallback()` to PremiumContextType: atomic get-and-clear prevents the Pitfall 7 double-fire (onSuccess then onCancel for the same invocation)
- PaywallModal wired: existing isPremium-detection useEffect now calls `consumePendingCallback()` to capture-and-clear, fires `onSuccess?.()`, then calls `hidePaywall()` (which sees null pendingCallback — onCancel is a no-op)
- Added `<PaywallModal />` to `AppContentFullInner` — closes the PAY-01 gap (RESEARCH §CF-2); both AppContent paths now mount exactly one PaywallModal at App root

## consumePendingCallback API

```typescript
// PremiumContextType — new member
consumePendingCallback: () => PaywallCallbackOptions | null;

// Implementation (atomic get-and-clear)
const consumePendingCallback = useCallback((): PaywallCallbackOptions | null => {
  const cb = pendingCallback;
  setPendingCallback(null);
  return cb;
}, [pendingCallback]);
```

**Ordering contract (Pitfall 7 prevention):**
1. `consumePendingCallback()` — captures and clears atomically
2. `cb?.onSuccess?.()` — fires deferred action
3. `hidePaywall()` — hides modal; sees `pendingCallback === null`, so `onCancel` branch is no-op

Alternative considered (rejected): expose raw `setPendingCallback` setter on context. Rejected because it requires callers to manage two operations (read + clear) in sequence, creating a race window. `consumePendingCallback` is a single atomic operation.

## Pitfall 7 Ordering Rationale

The plan's §Pattern 2 in RESEARCH presents two approaches:
- A. Direct access to `pendingCallback` in PaywallModal + clear via setter (requires two context members)
- B. `consumePendingCallback()` atomic get-and-clear (single context member, no race)

Approach B was implemented. Key benefit: `hidePaywall()` does not need special-casing — it always tries `pendingCallback?.onCancel?.()`, but since `consumePendingCallback()` already cleared it, this is a safe no-op. The purchase-success and user-cancel paths are fully orthogonal.

## All 13 Existing showPaywall Callers Still Compile

The `options?` second argument is optional (`PaywallCallbackOptions | undefined`). TypeScript accepts all existing single-arg `showPaywall('trigger')` call sites unchanged. Verified by tsc 0-exit.

## T7 / T8 / T10 Smoke Results

| Test | Label | Status |
|------|-------|--------|
| T7 | onSuccess fires on consume (Pitfall 7 lock) | PASS |
| T7 | onCancel does NOT fire after consume | PASS |
| T7 | pendingCallback cleared atomically | PASS |
| T8 | PaywallModal mounted in AppContentMVP | PASS |
| T8 | PaywallModal mounted in AppContentFullInner | PASS |
| T10a | showPaywall signature accepts options? PaywallCallbackOptions | PASS |
| T10b | PaywallTrigger union has diagnosis-resume + diagnosis-limit | PASS |
| T10c | consumePendingCallback exposed | PASS |

Full smoke: `Phase 9 smoke: PASS (20/20)`.

## Task Commits

1. **Task 1: Widen usePremium API** - `750e075` (feat)
2. **Task 2: PaywallModal deferred onSuccess wiring** - `561150b` (feat)
3. **Task 3: App.tsx AppContentFullInner mount** - `bade4a5` (feat)
4. **Task 4: Activate T7 + T8 + T10 smoke assertions** - `fd38809` (feat)

## Files Created/Modified

- `src/hooks/usePremium.tsx` — PaywallCallbackOptions interface, pendingCallback state, widened showPaywall, consumePendingCallback, hidePaywall capture-then-clear-then-fire, diagnosis-resume + diagnosis-limit in union
- `src/components/PaywallModal.tsx` — consumePendingCallback destructured from usePremium(); isPremium useEffect extended with clear-then-fire-then-hide ordering
- `App.tsx` — `<PaywallModal />` added to AppContentFullInner fragment (PAY-01 two-path discipline)
- `scripts/smoke-phase09.mjs` — T7 (3 asserts), T8 (2 asserts, slice-based), T10a/b/c activated; 7 placeholder slots unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] T8 smoke regex fix — plan's suggested regex captures only the parameter block, not function body**
- **Found during:** Task 4 (smoke-phase09 T8 activation)
- **Issue:** Plan's suggested regex `/function AppContentFullInner\([\s\S]*?\n\}/` uses lazy `[\s\S]*?` which stops at the first `\n}` — the closing brace of the destructuring parameter block, not the function body. `<PaywallModal />` in the body was never matched, causing T8 FAIL.
- **Fix:** Replaced regex with slice-based extraction: `src.indexOf('function AppContentFullInner(')` + `src.indexOf('\nexport default function App(')` as delimiters. Slice between the two positions captures the full function body.
- **Files modified:** `scripts/smoke-phase09.mjs`
- **Verification:** `node scripts/smoke-phase09.mjs` — PASS (20/20) after fix
- **Committed in:** fd38809

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in plan's suggested smoke regex)
**Impact on plan:** Fix is purely in the assertion code, not in production code. The underlying implementation (PaywallModal in AppContentFullInner) was correct all along — only the assertion needed repair.

## Issues Encountered

None in production code. The only issue was the T8 smoke regex bug (see Deviations).

## Next Phase Readiness

- `showPaywall('diagnosis-resume', { onSuccess, onCancel })` API ready for Plan 09-05 (DiagnosisDetailModal gate removal)
- `showPaywall('diagnosis-limit', { onSuccess })` API ready for Plan 09-06 (send-tap gating)
- Both AppContent paths mount PaywallModal — PAY-01 satisfied for current + AUTH=true future state
- 7 smoke placeholder slots remain (T1-T6, T9) — activated by Plans 09-04 through 09-08

## Self-Check: PASSED

- src/hooks/usePremium.tsx: FOUND
- src/components/PaywallModal.tsx: FOUND
- App.tsx: FOUND
- scripts/smoke-phase09.mjs: FOUND
- commit 750e075: FOUND
- commit 561150b: FOUND
- commit bade4a5: FOUND
- commit fd38809: FOUND
