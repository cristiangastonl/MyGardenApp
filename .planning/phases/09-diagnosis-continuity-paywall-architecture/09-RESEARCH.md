# Phase 9: Diagnosis Continuity + Paywall Architecture — Research

**Researched:** 2026-05-01
**Domain:** React Native modal stacking, deferred callback pattern, diagnosis chat UX, edge function prompt extension
**Confidence:** HIGH — all findings from direct source code inspection of the live codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Continue Chat Button + Paywall Trigger (DIAG-01, DIAG-02)**
- Component reuse: `DiagnosisFollowUp` with new `mode: 'continue' | 'reopen'` prop. Mode from `Boolean(diagnosis.resolvedAt)`.
- Visibility: button visible to ALL users. `isPremium &&` gate REMOVED from render. Gating on TAP, not RENDER.
- Free-user tap flow: (1) Caller closes own modal, (2) calls `showPaywall('diagnosis-resume', { onSuccess: () => openChat(diagnosis), onCancel: () => navigate.back() })`, (3) App-level paywall opens at root, (4) On purchase, deferred callback re-opens chat. No re-tap.
- Premium-user tap flow: direct chat open, no paywall.

**Resolved Diagnosis Reopen (DIAG-03, DIAG-04, DIAG-05)**
- Discriminator: `Boolean(diagnosis.resolvedAt)` — BUT SEE CRITICAL FINDING BELOW re: actual field name.
- System message prepend on reopen, persisted via `addChatMessage` (or new `updateDiagnosis` — see below).
- Set `reopenedAt: new Date().toISOString()` — new additive optional field.
- ONE thread per diagnosis lifetime. Reopen does NOT create a new `SavedDiagnosis`.
- Resume system prompt prepended to chat-diagnosis payload via `priorDiagnosisSummary?: string`.
- User-visible banner above input: `"Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva."`.
- Text-only by design: no auto-attach of original photo.

**Per-diagnosis Message Limit + Count Visibility (DIAG-06, DIAG-07)**
- Limit constant: reuse existing `FREE_CHAT_MESSAGES_PER_DIAGNOSIS` (= 3, in `src/config/premium.ts`).
- Per-diagnosis-lifetime count = `diagnosis.chat.filter(m => m.role === 'user').length`.
- Count display above input row for free users only.
- At 0 remaining: input NOT disabled; send tap invokes `showPaywall('diagnosis-limit', { onSuccess: () => sendMessage(typedText) })`.
- `typedText` captured in closure before `showPaywall` fires.

**App-level Paywall + Deferred Callback (PAY-01, PAY-02, PAY-03)**
- Extend `showPaywall(trigger, options?)` signature.
- `pendingCallback: { onSuccess, onCancel } | null` in PremiumProvider state.
- PaywallModal's `onPurchaseComplete` invokes `pendingCallback.onSuccess?.()` then clears.
- Caller-close-first contract. usePremium does NOT auto-close anything.
- Audit all existing `showPaywall` callers; refactor nested-modal callers to close-then-trigger.
- `PaywallTrigger` union: add `'diagnosis-resume'` and `'diagnosis-limit'`.

**Cross-Cutting (Claude's Discretion)**
- i18n keys: `diagnosis.continueChat`, `diagnosis.reopenChat`, `diagnosis.resumeBanner`, `diagnosis.reopenSystemMessage` (with `{{days}}` interp), `diagnosis.messagesRemaining` (with `{{remaining}}`, `{{total}}` interp). Both EN + ES with voseo.
- Type changes: `SavedDiagnosis.reopenedAt?: string`, `PaywallTrigger` union expansion, `PremiumContextType.showPaywall` signature widening.
- Edge function: `priorDiagnosisSummary?: string` field, backward-compat.
- `typedText` captured in deferred callback closure — NOT in usePremium state.
- Single-reopen tracking for v1.1 (latest reopen overwrites); v1.2 may extend.

### Claude's Discretion
- i18n key naming (within the locked key list above).
- Color token choice for count-display color shift (≤ 2 remaining → warning; use existing `colors.warningText` / `colors.textMuted`).
- Smoke runner test file structure for Phase 9 assertions.

### Deferred Ideas (OUT OF SCOPE)
- Re-upload photo within resumed chat (v2.0 DIAG-V01).
- Per-day or per-resume message limit.
- Multiple reopen tracking (`reopens: string[]`).
- Promise-based `await showPaywall()` API.
- Auto-close caller modal from usePremium.
- Generic "pending action" queue across non-paywall flows.
- Auto-attach prior photo to AI re-assessment on resume.
- Horticultural override for AI severity re-assessment.
- Migration of legacy SavedDiagnosis entries without resolvedAt.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIAG-01 | "Continue chat" button visible to ALL users — `isPremium &&` gate removed | Found exact gate in `DiagnosisDetailModal.tsx` line 248: `{isPremium && !diagnosis.resolved && onContinueChat && (...)` |
| DIAG-02 | Free users tapping "Continue chat" see paywall before chat opens | `showPaywall` API confirmed; deferred callback pattern is the implementation vehicle |
| DIAG-03 | Resolved diagnoses show "Reabrir consulta"; reopened chats prepend system message | `SavedDiagnosis.resolved` + `resolvedDate` already exist; `resolvedAt` is the CONTEXT name but `resolvedDate` is the actual field name — see Critical Finding |
| DIAG-04 | Resumed conversations text-only; UI shows explicit banner copy | `DiagnosisResults` is the render target; banner goes above input row |
| DIAG-05 | Resume system prompt includes prior assessment summary | `chat-diagnosis` edge function; add `priorDiagnosisSummary?: string` to `RequestBody` |
| DIAG-06 | Message-count limit per-diagnosis-lifetime; remaining count visible before typing | `FREE_CHAT_MESSAGES_PER_DIAGNOSIS = 3` in `premium.ts`; count = `diagnosis.chat.filter(m => m.role === 'user').length` |
| DIAG-07 | Premium upgrade lifts limit retroactively — no re-tap | Deferred callback via `options.onSuccess` fires `sendMessage(typedText)` after purchase |
| PAY-01 | Paywall at App-level context; single render at root | CONFIRMED: `<PaywallModal />` at line 227 of `App.tsx`, inside `AppContentMVP`, OUTSIDE NavigationContainer — correct position. MVP path is correct; AUTH path (`AppContentFullInner`) does NOT mount PaywallModal — see Critical Finding 2 |
| PAY-02 | Nested modal that triggers paywall closes itself first | Caller-close-first contract; `MyPlantDetailModal` already has `setTimeout(() => showPaywall(trigger), 350)` pattern |
| PAY-03 | Successful purchase invokes deferred callback | `PaywallModal.handlePurchase` currently calls `paymentService.purchaseAnnual/Lifetime()` and relies on `isPremium` side-effect via `setOnPremiumStatusChange` — need to add explicit deferred callback invocation |
</phase_requirements>

---

## Summary

Phase 9 is pure wiring work: it extends existing infrastructure rather than building new primitives. Every component and hook it touches already exists and is functional. The research identified five critical discrepancies between the CONTEXT.md design language and the actual codebase that the planner must account for.

**Critical Finding 1 — `resolvedDate` not `resolvedAt`:** The CONTEXT refers to `diagnosis.resolvedAt` throughout, but the actual `SavedDiagnosis` type uses `resolvedDate: string | null` (and `resolved: boolean`). The plan must use `resolvedDate` (existing) not `resolvedAt` (non-existent). The new additive field for reopen tracking should be named `reopenedAt?: string` (new optional) — this naming is fine since it does not exist yet.

**Critical Finding 2 — `AppContentFullInner` does NOT mount PaywallModal:** `AppContentMVP` mounts `<PaywallModal />` correctly (line 227, inside NotificationContext.Provider, after NavigationContainer). But `AppContentFullInner` (the AUTH=true path) has no `<PaywallModal />` at all. PAY-01 requires single root render on BOTH paths. Phase 9 must add `<PaywallModal />` to `AppContentFullInner`. The Two-AppContent-paths discipline (Phase 5 Plan 05 documented trap) applies here.

**Critical Finding 3 — `SavedDiagnosis.chat` not `messages[]`:** The CONTEXT refers to `messages[]` and `role: 'system'` but the actual persisted field is `chat: DiagnosisChatMessage[]` with type `role: 'user' | 'assistant'`. There is NO `'system'` role in `DiagnosisChatMessage`. The reopen system message approach must either (a) add `'system'` to the role union — this is a type change, or (b) use a different mechanism to track the system message (e.g., store separately and prepend to the edge function call without persisting to `chat[]`).

**Critical Finding 4 — `updateDiagnosis` does NOT exist in useStorage:** The CONTEXT references `useStorage().updateDiagnosis()` for persisting `reopenedAt` and the system message. This action does not exist. The available actions are `saveDiagnosis`, `addChatMessage`, `resolveDiagnosis`, and `getActiveDiagnosesForPlant`. The plan must either (a) add a new `updateDiagnosis` action, or (b) use the existing `addChatMessage` for the system message prepend and handle `reopenedAt` via a separate new action.

**Critical Finding 5 — PaywallModal has no explicit deferred callback hook:** The current `handlePurchase` flow calls `paymentService.purchaseAnnual/Lifetime()` and the success path is driven entirely by `setOnPremiumStatusChange` pushing `isPremium = true`, which triggers `useEffect({ if (isPremium && isPaywallVisible) hidePaywall() })`. There is no explicit `onPurchaseComplete` callback. To fire the deferred callback, the plan must add the callback invocation to the `handlePurchase` success branch in `PaywallModal.tsx` and read `pendingCallback` from context.

**Primary recommendation:** Execute in wave order: (1) type changes + useStorage new action, (2) usePremium API extension + PaywallModal deferred callback wiring, (3) DiagnosisDetailModal gate removal + close-then-paywall refactor, (4) PlantDiagnosisModal count display + send-tap gating + resume banner, (5) chat-diagnosis edge function extension, (6) i18n keys, (7) audit remaining callers.

---

## Standard Stack

### Core — All Existing Infrastructure (No New Dependencies)

| Component | Location | Role in Phase 9 |
|-----------|----------|----------------|
| `usePremium.tsx` | `src/hooks/usePremium.tsx` | Extend `showPaywall` signature, add `pendingCallback` state |
| `PaywallModal.tsx` | `src/components/PaywallModal.tsx` | Add deferred callback invocation on purchase success |
| `DiagnosisDetailModal.tsx` | `src/components/PlantDiagnosis/DiagnosisDetailModal.tsx` | Remove `isPremium &&` gate, add close-then-paywall handler |
| `PlantDiagnosisModal.tsx` | `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` | Count display, send-tap gating, resume banner |
| `DiagnosisResults.tsx` | `src/components/PlantDiagnosis/DiagnosisResults.tsx` | Count display row above input, send-tap gate, banner render |
| `useStorage.tsx` | `src/hooks/useStorage.tsx` | New `updateDiagnosis` action for reopenedAt + system message |
| `premium.ts` | `src/config/premium.ts` | `FREE_CHAT_MESSAGES_PER_DIAGNOSIS = 3` — reuse constant |
| `chat-diagnosis/index.ts` | `supabase/functions/chat-diagnosis/index.ts` | Add `priorDiagnosisSummary?: string` to `RequestBody`, conditional system-prompt prepend |
| `src/types/index.ts` | type definitions | Add `reopenedAt?: string` to `SavedDiagnosis`; add `'system'` to `DiagnosisChatMessage.role` OR handle differently |
| `App.tsx` | root | Add `<PaywallModal />` to `AppContentFullInner` (PAY-01 two-path discipline) |
| `src/i18n/locales/{en,es}/common.json` | i18n | 5 new key groups |
| `src/utils/dates.ts` | `daysBetween` | Already exists; used for "Hace N días" interpolation |

**Installation:** No new packages. All work is internal.

---

## Architecture Patterns

### Recommended File Touch Order

```
Wave 0: Type changes
  src/types/index.ts        — SavedDiagnosis.reopenedAt?, DiagnosisChatMessage role union

Wave 1: Storage action
  src/hooks/useStorage.tsx  — new updateDiagnosis(plantId, diagnosisId, updates: Partial<SavedDiagnosis>) action

Wave 2: Paywall plumbing
  src/hooks/usePremium.tsx  — showPaywall(trigger, options?) signature + pendingCallback state
  src/components/PaywallModal.tsx — invoke pendingCallback.onSuccess?() on purchase success, onCancel on close

Wave 3: DiagnosisDetailModal gate removal
  src/components/PlantDiagnosis/DiagnosisDetailModal.tsx — remove isPremium gate, add close-then-paywall handler

Wave 4: PlantDiagnosisModal + DiagnosisResults
  src/components/PlantDiagnosis/DiagnosisResults.tsx     — count row above input, send-tap gate, resume banner
  src/components/PlantDiagnosis/PlantDiagnosisModal.tsx  — pass through new props to DiagnosisResults

Wave 5: Edge function
  supabase/functions/chat-diagnosis/index.ts — priorDiagnosisSummary field

Wave 6: i18n
  src/i18n/locales/en/common.json
  src/i18n/locales/es/common.json

Wave 7: App root + audit
  App.tsx — PaywallModal to AppContentFullInner
  Audit remaining 7 showPaywall callers
```

### Pattern 1: Deferred Callback Extension of showPaywall

**What:** Extend `showPaywall` with optional options bag. Store callback pair in PremiumProvider state. Fire on purchase success or cancel.

**When to use:** Any gated action that should auto-proceed after purchase without user re-tapping.

```typescript
// src/hooks/usePremium.tsx — after Phase 9

interface PaywallCallbackOptions {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// In PremiumContextType:
showPaywall: (trigger: PaywallTrigger, options?: PaywallCallbackOptions) => void;

// In PremiumProvider:
const [pendingCallback, setPendingCallback] = useState<PaywallCallbackOptions | null>(null);

const showPaywall = useCallback((trigger: PaywallTrigger, options?: PaywallCallbackOptions) => {
  setPendingCallback(options ?? null);
  setPaywallTrigger(trigger);
  setIsPaywallVisible(true);
  trackEvent('paywall_shown', { trigger });
}, []);

const hidePaywall = useCallback(() => {
  trackEvent('paywall_dismissed', { trigger: paywallTrigger });
  pendingCallback?.onCancel?.();
  setPendingCallback(null);
  setIsPaywallVisible(false);
  setPaywallTrigger(null);
}, [paywallTrigger, pendingCallback]);
```

**Important:** `hidePaywall` is called by the close button (user cancel) AND must NOT be called by the purchase-success path. Purchase success needs its own path that fires `onSuccess` then clears.

### Pattern 2: Purchase Success with Deferred Callback in PaywallModal

**What:** `handlePurchase` in `PaywallModal.tsx` currently has no explicit success hook — success is detected via `isPremium` state change through `setOnPremiumStatusChange`. The `useEffect` that calls `hidePaywall()` when `isPremium && isPaywallVisible` must be extended to fire the deferred `onSuccess` callback before hiding.

**The correct hook point** is the existing `useEffect` at line 97-101:

```typescript
// PaywallModal.tsx — extend existing effect
useEffect(() => {
  if (isPremium && isPaywallVisible) {
    pendingCallback?.onSuccess?.();  // fire before hide
    hidePaywall();                   // clears pendingCallback
  }
}, [isPremium, isPaywallVisible]);
```

PaywallModal must also expose `pendingCallback` from context (via `usePremium()`). This requires adding `pendingCallback` to `PremiumContextType`.

### Pattern 3: Caller-Close-First for Nested Modals

**What:** Any modal component that calls `showPaywall()` must close itself first. usePremium does not auto-close anything.

**Existing implementation in MyPlantDetailModal (reference):**
```typescript
// MyPlantDetailModal.tsx line 111-114 — already correct pattern
const requestPaywall = (trigger: string) => {
  onClose();
  setTimeout(() => showPaywall(trigger), 350);
};
```

The `setTimeout(..., 350)` gives the slide-down animation time to complete before PaywallModal opens. This is the established pattern for iOS Modal stacking safety.

**DiagnosisDetailModal needs the same pattern for the "Continue chat" button handler:**
```typescript
// DiagnosisDetailModal.tsx — new handler
const handleContinueOrReopen = () => {
  const isResolved = Boolean(diagnosis.resolvedDate); // use .resolvedDate not .resolvedAt
  if (isPremium) {
    onContinueChat?.(diagnosis);
  } else {
    onClose(); // close self first
    setTimeout(() => {
      showPaywall(isResolved ? 'diagnosis-resume' : 'diagnosis-resume', {
        onSuccess: () => onContinueChat?.(diagnosis),
      });
    }, 350);
  }
};
```

### Pattern 4: Per-Diagnosis-Lifetime Message Count

**What:** Count user messages in `diagnosis.chat[]`, compare to `FREE_CHAT_MESSAGES_PER_DIAGNOSIS`.

```typescript
// In PlantDiagnosisModal.tsx (existing computation, to be corrected)
// Current line 159-163:
const userMessageCount = chatMessages.filter(m => m.role === 'user').length;
const canChat = canChatDiagnosis(totalUserMessages);

// Phase 9: per-diagnosis-lifetime means the count includes persisted messages
// from prior sessions, not just the current session's chatMessages[].
// When resumeDiagnosis is non-null, load prior count from resumeDiagnosis.chat.
const priorUserMessages = resumeDiagnosis
  ? resumeDiagnosis.chat.filter(m => m.role === 'user').length
  : 0;
const lifetimeUserCount = priorUserMessages + chatMessages.filter(m => m.role === 'user').length;
const remaining = Math.max(0, FREE_CHAT_MESSAGES_PER_DIAGNOSIS - lifetimeUserCount);
const canChat = canChatDiagnosis(lifetimeUserCount); // existing gate
```

**NOTE:** `FREE_CHAT_MESSAGES_PER_DIAGNOSIS` is not exported from `premium.ts`. Either export it or pass `remaining` as a prop. Recommend exporting the constant.

### Pattern 5: Send-Tap Gating at 0 Remaining

**What:** Input stays enabled for typing. On send tap with 0 remaining, fire paywall with deferred send.

```typescript
// DiagnosisResults.tsx — modify handleSendChat
const handleSendChat = () => {
  const trimmed = chatInput.trim();
  if ((!trimmed && !pendingPhoto) || !onSendChat) return;

  // Phase 9 DIAG-07: gate on send tap, not on input disable
  if (remaining === 0 && onPaywall) {
    const messageToSend = trimmed || t('diagnosis.photoSent');
    const photoBase64 = pendingPhoto?.base64;
    const photoUri = pendingPhoto?.uri;
    onPaywallWithCallback(() => {
      onSendChat(messageToSend, photoBase64, photoUri);
    });
    return;
  }

  onSendChat(trimmed || t('diagnosis.photoSent'), pendingPhoto?.base64, pendingPhoto?.uri);
  setChatInput('');
  setPendingPhoto(null);
};
```

`onPaywallWithCallback` is a new prop on `DiagnosisResults` that accepts `() => void`. Or: pass `onSendChatGated: (text: string, ...) => void` directly.

### Pattern 6: System Message on Reopen

**What:** On reopen, prepend a system message to `chat[]` before opening the chat modal. Persist via `addChatMessage`.

**Constraint — DiagnosisChatMessage.role does NOT have `'system'`** (current union: `'user' | 'assistant'`). Options:

A. Add `'system'` to the union in `src/types/index.ts`. This is a type-only additive change; existing callers continue to work. System messages rendered differently in the chat UI (e.g., centered italic banner, not a bubble).

B. Do not add `'system'` to persisted type; instead create a `ChatSystemBanner` component that reads a separate `reopenedAt` field and computes the "Hace N días" text at render time — no persisted system message.

**Recommendation:** Option A is simpler and matches CONTEXT intent. Add `'system'` to `DiagnosisChatMessage.role`. Render system messages as a centered info banner (not a chat bubble). Only persisted when `reopenedAt` is set.

```typescript
// src/types/index.ts — additive change
export interface DiagnosisChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';  // 'system' added in Phase 9
  text: string;
  timestamp: string;
  imageUri?: string | null;
}
```

### Pattern 7: New updateDiagnosis Storage Action

**What:** Needed for setting `reopenedAt` on the `SavedDiagnosis` record.

```typescript
// src/hooks/useStorage.tsx — new action
const updateDiagnosis = useCallback((plantId: string, diagnosisId: string, updates: Partial<SavedDiagnosis>) => {
  const cur = dataRef.current.diagnosisHistory;
  const plantDiagnoses = cur[plantId] || [];
  const updatedDiagnoses = plantDiagnoses.map(d =>
    d.id === diagnosisId ? { ...d, ...updates } : d
  );
  const newHistory = { ...cur, [plantId]: updatedDiagnoses };
  setDiagnosisHistory(newHistory);
  dataRef.current.diagnosisHistory = newHistory;
  scheduleSave();
}, [scheduleSave]);
```

### Anti-Patterns to Avoid

- **Do NOT call `showPaywall()` while another Modal is still animated open.** Always close the caller modal first with `onClose()`, then `setTimeout(() => showPaywall(...), 350)`.
- **Do NOT disable the text input at 0 remaining.** Gate on send tap only (CONTEXT lock: "mid-typing surprise" is the anti-pattern).
- **Do NOT use `diagnosis.resolvedAt`.** The actual field is `diagnosis.resolvedDate`. Using the wrong name results in a TypeScript error.
- **Do NOT call `hidePaywall()` in the purchase success path if you also want the deferred callback to fire.** The existing `useEffect` that calls `hidePaywall()` when `isPremium && isPaywallVisible` is the correct hook; attach `onSuccess?.()` there before `hidePaywall()`.
- **Do NOT store `typedText` in usePremium state.** Capture in closure at the send-tap call site. Per CONTEXT lock: cleanest scope, no stale text leaking between unrelated paywall triggers.
- **Do NOT mount `<PaywallModal />` inside a Tab.Screen component.** It must be at App root level, outside NavigationContainer but inside PremiumProvider.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deferred action after async event | Custom event bus, Redux action queue | Closure-captured callback in `pendingCallback` state | Single callback pair is sufficient; event bus adds indirection with no benefit |
| Message count persistence | New counter field on SavedDiagnosis | Count from `diagnosis.chat.filter(m => m.role === 'user').length` | Already persisted in `chat[]`; computing from data is always consistent |
| Modal Z-order management | Custom z-index manipulation | Close-then-trigger (setTimeout 350ms) | iOS does not reliably stack Modals; established pattern already in MyPlantDetailModal |
| "Days since" computation | New date utility | `daysBetween(parseDate(resolvedDate), new Date())` in `src/utils/dates.ts` | Already exists, already used |
| Premium status check | Inline RevenueCat call | `usePremiumGate().isPremium` | Single source of truth via `setOnPremiumStatusChange` already wired |

**Key insight:** The entire Phase 9 feature set is wiring and extension work. No new architectural primitive is required.

---

## Critical Findings (Planner Must Read)

### CF-1: Field Name Mismatch — `resolvedDate` not `resolvedAt`

The CONTEXT.md uses `resolvedAt` throughout (e.g., "reuse existing `SavedDiagnosis.resolvedAt`"). The actual type in `src/types/index.ts` line 381 is:
```typescript
resolvedDate: string | null;
```
The `resolved: boolean` field is the primary flag; `resolvedDate` holds the ISO string when resolved.

**Plan impact:** Every reference to `resolvedAt` in the CONTEXT must be translated to `resolvedDate` in implementation. The `daysBetween` call for "Hace N días" uses `resolvedDate` not `resolvedAt`.

### CF-2: AppContentFullInner Missing PaywallModal (PAY-01 Gap)

`App.tsx` audit result:
- `AppContentMVP` (line 106-230): mounts `<PaywallModal />` at line 227, inside `NotificationContext.Provider`, after the `NavigationContainer` block. **Correct position.**
- `AppContentFullInner` (line 252-367): does NOT mount `<PaywallModal />`. The JSX return is a bare `<>...</>` with only `NavigationContainer` and `DataMigrationModal`. **PaywallModal is absent.**

PAY-01 says "single render at root level." Currently the AUTH path has zero renders. Phase 9 must add `<PaywallModal />` to `AppContentFullInner`'s return fragment. The Two-AppContent-paths discipline (from Phase 5 Plan 05 accumulated context) requires both paths to stay in sync.

### CF-3: `DiagnosisChatMessage.role` Has No `'system'` Variant

`src/types/index.ts` line 353-359:
```typescript
export interface DiagnosisChatMessage {
  id: string;
  role: 'user' | 'assistant';   // NO 'system' today
  text: string;
  timestamp: string;
  imageUri?: string | null;
}
```

The CONTEXT says "system message prepend uses existing schema" — this is incorrect. The schema does NOT currently support `'system'` role. Phase 9 must add `'system'` to the union (additive, backward-compatible). The chat UI must render system messages differently from user/assistant bubbles (centered banner, italic, no bubble style).

### CF-4: `updateDiagnosis` Does NOT Exist in useStorage

`src/hooks/useStorage.tsx` StorageActions (line 38-75) lists: `saveDiagnosis`, `addChatMessage`, `getDiagnosesForPlant`, `resolveDiagnosis`, `getActiveDiagnosesForPlant`. No `updateDiagnosis`.

The CONTEXT references `useStorage().updateDiagnosis()` for persisting both `reopenedAt` and system-message append. Phase 9 must add `updateDiagnosis(plantId, diagnosisId, updates: Partial<SavedDiagnosis>)` to both `StorageActions` interface and the `useStorage` implementation.

### CF-5: PaywallModal Has No Explicit Purchase Success Callback

`PaywallModal.tsx` `handlePurchase` (line 103-118): calls `paymentService.purchaseAnnual()` or `paymentService.purchaseLifetime()`. On success, nothing explicit happens — the flow relies on `setOnPremiumStatusChange` pushing `isPremium = true` to PremiumProvider state, which then triggers:
```typescript
useEffect(() => {
  if (isPremium && isPaywallVisible) {
    hidePaywall();    // line 99
  }
}, [isPremium, isPaywallVisible, hidePaywall]);
```

To fire the deferred callback, Phase 9 must modify this `useEffect` to call `pendingCallback?.onSuccess?.()` before `hidePaywall()`. `PaywallModal` reads the callback via `usePremium()` — requires adding `pendingCallback` to the context value exposed by `PremiumProvider`.

### CF-6: `DiagnosisDetailModal` is the Actual "Continue Chat" Entry Point

`DiagnosisFollowUp.tsx` is the TodayScreen widget showing ACTIVE (non-resolved, non-healthy) diagnoses — it has NO "Continue chat" button currently. It only has "Mark as Resolved" and the whole card is tappable (`onPressDiagnosis`).

The actual "Continue chat" button (DIAG-01 gate to remove) is in `DiagnosisDetailModal.tsx` at line 248:
```typescript
{isPremium && !diagnosis.resolved && onContinueChat && (
  <TouchableOpacity ...>
    <Text>{t('diagnosis.continueChat')}</Text>
  </TouchableOpacity>
)}
```

The CONTEXT refers to `DiagnosisFollowUp` for the mode prop addition, but the gate to remove is in `DiagnosisDetailModal`. The plan may need to touch both — `DiagnosisDetailModal` for the gate removal, and `DiagnosisFollowUp` if it gains a "Continue chat" or "Reopen" button as a separate addition.

The `onContinueChat` flow in `MyPlantDetailModal.tsx` (lines 293-303) currently:
1. Sets `selectedDiagnosis(null)` — closes `DiagnosisDetailModal`.
2. Sets `resumeDiagnosis(diag)` and `showDiagnosis(true)` — opens `PlantDiagnosisModal`.

For PAY-02, when a free user taps "Continue chat," the flow must:
1. Close `DiagnosisDetailModal` (already done by `setSelectedDiagnosis(null)`).
2. Close `MyPlantDetailModal` (`onClose()` on MyPlantDetailModal).
3. Then open PaywallModal with deferred callback that opens the chat on success.

This means the `onContinueChat` prop callback chain must thread all three steps.

### CF-7: `userMessageCount` Computation in PlantDiagnosisModal is Session-Only

`PlantDiagnosisModal.tsx` line 159-163:
```typescript
const userMessageCount = chatMessages.filter(m => m.role === 'user').length;
const totalUserMessages = isResumedChat
  ? userMessageCount  // comment says "only new messages"
  : userMessageCount;
```

Both branches are identical — `totalUserMessages` is always the in-session count. For DIAG-06 (per-diagnosis-lifetime), Phase 9 must compute the lifetime count:
```typescript
const sessionUserCount = chatMessages.filter(m => m.role === 'user').length;
const priorPersistedCount = resumeDiagnosis
  ? (resumeDiagnosis.chat || []).filter(m => m.role === 'user').length
  : 0;
const lifetimeUserCount = priorPersistedCount + sessionUserCount;
```

This is a bug fix as well as a feature: the current code would reset the message limit on every new session for a resumed diagnosis.

---

## Existing Paywall Caller Audit

All 9 `showPaywall` call sites (from grep):

| File | Line | Trigger | Inside Modal? | Needs Close-Then-Trigger? | Current Pattern |
|------|------|---------|---------------|--------------------------|-----------------|
| `SettingsScreen.tsx` | 397 | `'settings'` | No — screen-level | No — correct | Direct call |
| `SettingsScreen.tsx` | 445 | `'dev_test'` | No — screen-level | No — correct | Direct call |
| `TodayScreen.tsx` | 158 | `'plant_limit'` | No — screen-level | No — correct | Direct call |
| `TodayScreen.tsx` | 330 | `'premium_feature'` | No — screen-level | No — correct | Direct call |
| `TodayScreen.tsx` | 499 | `'plant_identification'` | No — screen-level | No — correct | Direct call |
| `PlantsScreen.tsx` | 61 | `'plant_limit'` | No — screen-level | No — correct | Direct call |
| `PlantsScreen.tsx` | 211 | `'plant_identification'` | No — screen-level | No — correct | Direct call |
| `MyPlantDetailModal.tsx` | 113 | Various | YES — inside a Modal | YES — already implemented | `onClose(); setTimeout(() => showPaywall(trigger), 350)` |
| `DailyTip.tsx` | 113 | `'daily_tip'` | Depends on surface | Investigate at plan time | Direct call — needs audit |
| `PlantPhotoAlbum.tsx` | 43 | `'photo_album'` | Depends on surface | Investigate at plan time | Delegate to `onRequestPremium` prop — caller decides |
| `PlantDiagnosisModal.tsx` | 148 | `'plant_diagnosis'` | YES — inside a Modal | YES — currently calls showPaywall directly from inside Modal | NEEDS REFACTOR |
| `PlantDiagnosisModal.tsx` | 305 | `'plant_diagnosis'` | YES — inside a Modal | YES | NEEDS REFACTOR |
| `PlantIdentifierModal.tsx` | 76 | `'plant_diagnosis'` | YES — inside a Modal | YES | NEEDS REFACTOR |

**Key findings:**
- `MyPlantDetailModal` already follows the correct pattern.
- `PlantDiagnosisModal` and `PlantIdentifierModal` call `showPaywall` directly while inside an open Modal — these need close-then-trigger refactor.
- `DailyTip` is a component that may be rendered inside TodayScreen (not a Modal) — likely correct but needs confirmation at plan time.
- `PlantPhotoAlbum` delegates to the `onRequestPremium` prop — the caller decides; `MyPlantDetailModal` is already the correct caller with the close pattern.

---

## Common Pitfalls

### Pitfall 1: iOS Modal Stacking (PAY-02)
**What goes wrong:** Two React Native `<Modal>` components open simultaneously causes the older modal to become uninteractive on iOS (the new Modal intercepts all touches). On Android the behavior differs but is also unreliable.

**Why it happens:** React Native's `Modal` uses a native view hierarchy. Two stacked Modals = two UIWindow/View layers on iOS, and the top one captures all touch events.

**How to avoid:** Always `onClose()` + 350ms delay before `showPaywall()`. The 350ms allows the slide-down animation to complete. Established pattern from `MyPlantDetailModal.requestPaywall`.

**Warning signs:** PaywallModal opens but user cannot interact with it; or PaywallModal appears behind a dimmed overlay.

### Pitfall 2: Stale Deferred Callback Between Unrelated Paywall Triggers
**What goes wrong:** User taps diagnosis paywall trigger (stores `onSuccess: sendMessage`), then navigates away and taps a plant-limit paywall trigger before the first resolved. `pendingCallback` still holds the diagnosis send callback — on purchase, the wrong action fires.

**How to avoid:** `showPaywall(trigger, options)` ALWAYS overwrites `pendingCallback`. The new `onSuccess` replaces the old one. If `onCancel` is defined on the old callback, it is dropped silently (acceptable — user initiated the second paywall, implicitly cancelling the first context). `setPendingCallback(options ?? null)` every time.

**Warning signs:** Unexpected chat message sent after a plant-limit upgrade.

### Pitfall 3: Session-Only Message Count (CF-7)
**What goes wrong:** `totalUserMessages` only counts in-session messages. Free user gets 3 messages, closes and reopens the diagnosis, gets 3 MORE free messages.

**How to avoid:** Always compute lifetime count = prior persisted count + in-session count. Prior count from `resumeDiagnosis.chat.filter(m => m.role === 'user').length`.

### Pitfall 4: Two AppContent Paths (CF-2, PAY-01)
**What goes wrong:** PaywallModal missing from `AppContentFullInner`. When `Features.AUTH` is flipped true in a future milestone, the paywall will silently fail to appear.

**How to avoid:** Add `<PaywallModal />` to `AppContentFullInner`'s JSX return. Reference the Phase 5 Plan 05 accumulated decision: "Two-AppContent-paths discipline — both paths must be kept in sync."

### Pitfall 5: `resolvedAt` vs `resolvedDate` Field Name
**What goes wrong:** Using `diagnosis.resolvedAt` compiles to `undefined` in TypeScript strict mode (property does not exist on type).

**How to avoid:** Always use `diagnosis.resolvedDate`. The CONTEXT.md terminology ("resolvedAt") is a naming convention that does not match the actual TypeScript type.

### Pitfall 6: System Message Not Rendered Differently
**What goes wrong:** System messages in `chat[]` rendered as normal chat bubbles confuses users (who sent this?).

**How to avoid:** In `DiagnosisResults.tsx`, check `msg.role === 'system'` and render a centered info banner (`colors.infoBg` background, centered italic text, no bubble shape) instead of a user/assistant bubble.

### Pitfall 7: `pendingCallback.onCancel` Called by hidePaywall (User Presses Close)
**What goes wrong:** `hidePaywall()` is called by both the close button (user cancel) AND the purchase-success `useEffect`. If the deferred callback fires `onCancel` on purchase success (because hidePaywall triggers the cancel path), the gated action never runs.

**How to avoid:** Separate the two paths explicitly:
- User presses close → `hidePaywall()` → fires `pendingCallback.onCancel?.()` then clears.
- Purchase succeeds (`isPremium && isPaywallVisible` effect) → fires `pendingCallback.onSuccess?.()` THEN calls `hidePaywall()` with the callback already cleared.

Implementation: clear `pendingCallback` before calling `hidePaywall()` in the success path, so `hidePaywall()` doesn't fire the cancel again.

```typescript
// PaywallModal.tsx success effect
useEffect(() => {
  if (isPremium && isPaywallVisible) {
    const cb = pendingCallback;
    setPendingCallback(null); // clear first
    cb?.onSuccess?.();
    hidePaywall(); // now hidePaywall sees null pendingCallback, no double-fire
  }
}, [isPremium, isPaywallVisible]);
```

---

## Code Examples

### Example 1: Extended PremiumContextType

```typescript
// src/hooks/usePremium.tsx

type PaywallTrigger =
  | 'plant_limit'
  | 'weather_alert'
  | 'daily_tip'
  | 'premium_feature'
  | 'settings'
  | 'plant_diagnosis'
  | 'plant_identification'
  | 'photo_album'
  | 'diagnosis-resume'   // Phase 9 — continue/reopen from past diagnosis
  | 'diagnosis-limit'    // Phase 9 — send-tap at 0 remaining messages
  | 'dev_test'
  | string;

interface PaywallCallbackOptions {
  /** Called when purchase succeeds; the gated action proceeds without re-tap. */
  onSuccess?: () => void;
  /** Called when user closes paywall without purchasing. */
  onCancel?: () => void;
}

interface PremiumContextType {
  isPremium: boolean;
  isPaywallVisible: boolean;
  paywallTrigger: PaywallTrigger | null;
  pendingCallback: PaywallCallbackOptions | null;  // Phase 9 — needed by PaywallModal
  showPaywall: (trigger: PaywallTrigger, options?: PaywallCallbackOptions) => void;
  hidePaywall: () => void;
  toggleMockPremium: () => Promise<void>;
}
```

### Example 2: DiagnosisDetailModal Continue/Reopen Handler

```typescript
// DiagnosisDetailModal.tsx — modified button section
// Replace the current {isPremium && !diagnosis.resolved && onContinueChat && (...)} block

const { isPremium } = usePremiumGate();
const { showPaywall } = usePremium();

const isResolved = Boolean(diagnosis.resolvedDate);  // use resolvedDate not resolvedAt
const buttonLabel = isResolved
  ? t('diagnosis.reopenChat')
  : t('diagnosis.continueChat');

const handleContinueOrReopen = () => {
  if (!onContinueChat) return;
  if (isPremium) {
    onContinueChat(diagnosis);
  } else {
    onClose(); // close self FIRST
    setTimeout(() => {
      showPaywall('diagnosis-resume', {
        onSuccess: () => onContinueChat(diagnosis),
      });
    }, 350);
  }
};

// Render (always visible — no isPremium gate):
{onContinueChat && (
  <TouchableOpacity
    style={styles.continueChatAction}
    onPress={handleContinueOrReopen}
  >
    <Text style={styles.continueChatActionText}>{buttonLabel}</Text>
  </TouchableOpacity>
)}
```

### Example 3: edge function priorDiagnosisSummary Extension

```typescript
// supabase/functions/chat-diagnosis/index.ts

interface RequestBody {
  diagnosisResult: DiagnosisResult;
  plantContext: PlantContext;
  chatHistory: ChatMessage[];
  userMessage: string;
  imageBase64?: string;
  lang?: string;
  priorDiagnosisSummary?: string;  // Phase 9 (DIAG-05) — present on resume
}

// In systemPrompt construction (after contextInfo):
const resumeClause = body.priorDiagnosisSummary
  ? (isEs
    ? `\n\nResumen del diagnóstico previo:\n${body.priorDiagnosisSummary}\n\nNo re-evalúes la severidad ni cambies el diagnóstico salvo que el usuario suba una foto nueva. Continuá el seguimiento basándote en el diagnóstico previo.`
    : `\n\nPrior diagnosis summary:\n${body.priorDiagnosisSummary}\n\nDo not re-assess severity or change the diagnosis unless the user uploads a new photo. Continue follow-up based on the prior diagnosis.`)
  : '';

// Append resumeClause to systemPrompt string (both ES and EN branches)
```

### Example 4: i18n Keys Required

```json
// src/i18n/locales/es/common.json — new keys under "diagnosis" namespace
{
  "diagnosis": {
    "continueChat": "Continuar consulta",
    "reopenChat": "Reabrir consulta",
    "resumeBanner": "Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva.",
    "reopenSystemMessage": "Hace {{days}} días marcaste esta consulta como resuelta. ¿Qué cambió?",
    "messagesRemaining": "{{remaining}} de {{total}} mensajes restantes"
  }
}

// src/i18n/locales/en/common.json — new keys
{
  "diagnosis": {
    "continueChat": "Continue chat",
    "reopenChat": "Reopen consultation",
    "resumeBanner": "Continuing prior diagnosis. For visual reassessment, take a new photo.",
    "reopenSystemMessage": "You marked this consultation resolved {{days}} days ago. What changed?",
    "messagesRemaining": "{{remaining}} of {{total}} messages remaining"
  }
}
```

---

## State of the Art

| Old Approach | Current Approach (Post Phase 9) | Impact |
|---|---|---|
| `showPaywall(trigger)` — fire and forget | `showPaywall(trigger, { onSuccess, onCancel })` — deferred action on purchase | Gated actions proceed without re-tap |
| `isPremium &&` gate on render (DIAG-01) | Gate on tap only; button visible to all | All users see "Continue chat" — reduces discovery friction |
| Session-only message count | Lifetime message count across sessions | Free users can't reset limit by reopening |
| `AppContentFullInner` missing PaywallModal | PaywallModal mounted in both AppContent paths | Auth+sync path works correctly |
| No system-message role in DiagnosisChatMessage | `'system'` added to role union | Reopen context message persisted and rendered distinctly |

---

## Validation Architecture

`nyquist_validation` is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js smoke runner (`scripts/smoke-phase09.mjs`) — same pattern as Phases 4-8 |
| Config file | None — convention: `scripts/smoke-phase09.mjs` |
| Quick run command | `node scripts/smoke-phase09.mjs` |
| Full suite command | `node scripts/smoke-phase09.mjs && node scripts/smoke-phase08.mjs && node scripts/smoke-phase07.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIAG-01 | Gate removed — button always rendered | Unit (type/prop check) | `node scripts/smoke-phase09.mjs` — T1 | ❌ Wave 0 |
| DIAG-02 | Free user tap → paywall trigger with options | Unit (showPaywall call signature) | smoke-phase09 — T2 | ❌ Wave 0 |
| DIAG-03 | Resolved discriminator; system message appended | Unit (updateDiagnosis + addChatMessage) | smoke-phase09 — T3 | ❌ Wave 0 |
| DIAG-04 | Banner present in resumed chat render | Unit (prop/render check) | smoke-phase09 — T4 | ❌ Wave 0 |
| DIAG-05 | priorDiagnosisSummary in edge function payload | Unit (RequestBody type check) | smoke-phase09 — T5 | ❌ Wave 0 |
| DIAG-06 | Lifetime count = prior + session; remaining displayed | Unit (arithmetic) | smoke-phase09 — T6 | ❌ Wave 0 |
| DIAG-07 | deferred callback fires sendMessage after purchase | Unit (callback invocation) | smoke-phase09 — T7 | ❌ Wave 0 |
| PAY-01 | PaywallModal in both AppContent paths | Smoke (grep/import check) | smoke-phase09 — T8 | ❌ Wave 0 |
| PAY-02 | Nested modal callers follow close-then-trigger | Smoke (grep pattern check) | smoke-phase09 — T9 | ❌ Wave 0 |
| PAY-03 | Success callback fires without re-tap | Unit (pendingCallback flow) | smoke-phase09 — T10 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node scripts/smoke-phase09.mjs`
- **Per wave merge:** `node scripts/smoke-phase09.mjs && npx tsc --noEmit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Key Smoke Runner Assertions

The smoke runner pattern (`typescript.transpileModule` + dynamic import stubs) established in Phase 4 applies here. Key assertions:

**T1 — Gate removal verification:** Grep `DiagnosisDetailModal.tsx` for `isPremium &&` on the continue-chat button; assert count = 0.

**T6 — Lifetime message count arithmetic:**
```javascript
// Pure logic assertion — no RN dependencies needed
const priorMessages = [{role:'user'},{role:'assistant'},{role:'user'}]; // 2 user
const sessionMessages = [{role:'user'}]; // 1 user
const lifetimeCount = [...priorMessages, ...sessionMessages].filter(m => m.role === 'user').length;
assert(lifetimeCount === 3, 'Lifetime count must be 3');
assert(Math.max(0, 3 - lifetimeCount) === 0, 'Remaining must be 0 at limit');
```

**T7 — Deferred callback invocation (pure JS — no RevenueCat dependency):**
```javascript
// Simulate PremiumProvider state machine
let callbackFired = false;
let pendingCallback = { onSuccess: () => { callbackFired = true; } };
// Simulate purchase success path
const cb = pendingCallback;
pendingCallback = null; // clear first
cb?.onSuccess?.();
assert(callbackFired === true, 'onSuccess must fire on purchase');
assert(pendingCallback === null, 'pendingCallback must be cleared');
```

**T8 — PaywallModal present in both AppContent paths:**
```javascript
// Read App.tsx source, assert PaywallModal appears in both AppContentMVP and AppContentFullInner
const src = fs.readFileSync('App.tsx', 'utf8');
const mvpMatch = src.match(/AppContentMVP[\s\S]*?<PaywallModal/);
const authMatch = src.match(/AppContentFullInner[\s\S]*?<PaywallModal/);
assert(mvpMatch, 'PaywallModal must be in AppContentMVP');
assert(authMatch, 'PaywallModal must be in AppContentFullInner');
```

**T9 — No showPaywall inside open Modal without close-first:**
Grep `PlantDiagnosisModal.tsx` and `PlantIdentifierModal.tsx` for direct `showPaywall(` calls; assert count = 0 (all calls should be refactored to close-then-trigger or wrapped in a handler that calls close first).

### Wave 0 Gaps
- [ ] `scripts/smoke-phase09.mjs` — covers all 10 T-assertions above
- [ ] `src/types/index.ts` — add `'system'` to `DiagnosisChatMessage.role` union (type change needed before smoke can verify)
- [ ] Framework already installed (same Node.js runner pattern from Phase 4)

---

## Open Questions

1. **`DiagnosisFollowUp` mode prop scope**
   - What we know: CONTEXT says add `mode: 'continue' | 'reopen'` to `DiagnosisFollowUp`. But `DiagnosisFollowUp` currently shows only ACTIVE (non-resolved) diagnoses — it filters `!d.resolved`. Resolved diagnoses don't appear there.
   - What's unclear: Does Phase 9 want the "Reabrir consulta" button to appear in `DiagnosisFollowUp` too (which would require changing the filter), or only in `DiagnosisDetailModal`?
   - Recommendation: The gate removal (DIAG-01) is clearly in `DiagnosisDetailModal`. `DiagnosisFollowUp` is for the TodayScreen "active problems" widget. Unless the requirement is to also surface "Continue chat" on the TodayScreen widget, the `mode` prop on `DiagnosisFollowUp` may be a documentation artifact. The planner should add it to `DiagnosisFollowUp` only if DIAG-01 scope includes the TodayScreen surface.

2. **System message persistence vs. computed banner**
   - What we know: CONTEXT says persist system message via `updateDiagnosis()`. CF-3 confirms `'system'` role doesn't exist yet.
   - What's unclear: Should the system message persist to `chat[]` (readable in `DiagnosisDetailModal` chat history) or be computed from `reopenedAt` at render time?
   - Recommendation: Persist to `chat[]` with `role: 'system'`. This is simpler, consistent with the CONTEXT intent, and allows the message to appear in `DiagnosisDetailModal` chat history rendering.

3. **`onContinueChat` threading through MyPlantDetailModal for the nested-modal close chain**
   - What we know: For PAY-02 compliance, when a free user taps "Continue chat" in `DiagnosisDetailModal` (nested inside `MyPlantDetailModal`), both modals must close before PaywallModal opens.
   - What's unclear: The current `onContinueChat` callback in `MyPlantDetailModal` (line 298) calls `setSelectedDiagnosis(null)` (closes `DiagnosisDetailModal`) then opens `PlantDiagnosisModal`. For the paywall path, `MyPlantDetailModal` itself must also close.
   - Recommendation: The deferred callback approach handles this: `onContinueChat` in the free-user branch closes `DiagnosisDetailModal`, then `showPaywall` options.`onSuccess` re-opens chat directly (bypassing the need to re-open `MyPlantDetailModal`). But the `onSuccess` callback needs access to `plant` and `weather` props to open `PlantDiagnosisModal`. The planner must ensure the closure captures these correctly.

---

## Sources

### Primary (HIGH confidence)
- Direct source inspection: `src/hooks/usePremium.tsx` — full file read
- Direct source inspection: `src/components/PaywallModal.tsx` — full file read
- Direct source inspection: `src/components/DiagnosisFollowUp.tsx` — full file read
- Direct source inspection: `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — full file read
- Direct source inspection: `src/components/PlantDiagnosis/DiagnosisResults.tsx` — partial read (lines 1-396)
- Direct source inspection: `src/components/PlantDiagnosis/DiagnosisDetailModal.tsx` — full file read
- Direct source inspection: `src/components/MyPlantDetailModal.tsx` — lines 1-306
- Direct source inspection: `src/types/index.ts` — full file read (SavedDiagnosis at line 371-391; DiagnosisChatMessage at line 353-359)
- Direct source inspection: `App.tsx` — full file read (AppContentMVP PaywallModal at line 227; AppContentFullInner no PaywallModal confirmed)
- Direct source inspection: `supabase/functions/chat-diagnosis/index.ts` — full file read
- Direct source inspection: `src/config/premium.ts` — full file read (`FREE_CHAT_MESSAGES_PER_DIAGNOSIS = 3` at line 7)
- Direct source inspection: `src/hooks/useStorage.tsx` — grep for all diagnosis actions
- Direct source inspection: `.planning/phases/09-diagnosis-continuity-paywall-architecture/09-CONTEXT.md`
- Direct source inspection: `.planning/REQUIREMENTS.md` §DIAG, §PAY
- Direct source inspection: `.planning/STATE.md` accumulated context

### Secondary (MEDIUM confidence)
- `.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — defensive optional callback pattern
- `.planning/phases/07-ui-write-side-onboarding-edge-function-contract/07-CONTEXT.md` — chat-diagnosis dual-payload pattern
- `.planning/codebase/STRUCTURE.md` + `CONVENTIONS.md` — naming, code style

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct source code inspection, no inference
- Architecture patterns: HIGH — derived from live code; deferred callback is a new pattern but follows existing state management conventions
- Pitfalls: HIGH — CF-1 through CF-7 are all confirmed via source inspection, not guesses
- i18n keys: HIGH — locked by CONTEXT; ES voseo confirmed from existing es/common.json patterns

**Research date:** 2026-05-01
**Valid until:** Stable — no external dependencies; all findings from internal source. Valid until any of the 6 source files are materially changed.

**Files read:**
- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/usePremium.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/PaywallModal.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/DiagnosisFollowUp.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/PlantDiagnosis/DiagnosisDetailModal.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/PlantDiagnosis/DiagnosisResults.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/MyPlantDetailModal.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/types/index.ts`
- `/Users/gaston/Documents/Personal/MiJardinApp/App.tsx`
- `/Users/gaston/Documents/Personal/MiJardinApp/supabase/functions/chat-diagnosis/index.ts`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/config/premium.ts`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useStorage.tsx` (grep)
