# Phase 9: Diagnosis Continuity + Paywall Architecture - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the "Continuar consulta" button visible on every past-diagnosis card (free + premium). Free-user tap → close parent → App-level paywall opens with deferred callback that re-opens chat on successful purchase. Resolved diagnoses get a "Reabrir consulta" variant + a prepended system message ("Hace N días marcaste esta consulta como resuelta. ¿Qué cambió?"). Resume system prompt includes prior diagnosis summary + explicit "no severity re-assess unless new photo" clause. Per-diagnosis-lifetime message count (already in SavedDiagnosis.messages[]) is rendered above the input row; at 0-of-N, send button is gated by paywall trigger (NOT mid-typing). Premium upgrade fires the deferred onSuccess callback that resends the gated message — no re-tap.

Audit existing 7 paywall callers; refactor any that trigger from inside nested modals to use the close-then-trigger contract.

**No catalog or schema changes** — Phase 8 territory. Phase 9 only touches diagnosis chat UX + paywall plumbing.

Locked from REQUIREMENTS.md: DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05, DIAG-06, DIAG-07, PAY-01, PAY-02, PAY-03.

</domain>

<decisions>
## Implementation Decisions

### Continue Chat Button + Paywall Trigger (DIAG-01, DIAG-02)
- **Component reuse:** `DiagnosisFollowUp` with new `mode: 'continue' | 'reopen'` prop. Same component renders both labels via i18n (`diagnosis.continueChat` / `diagnosis.reopenChat`). Mode derived from `Boolean(diagnosis.resolvedAt)`.
- **Visibility:** Button visible to ALL users regardless of premium status. The `isPremium &&` gate (DIAG-01) is REMOVED from render. Premium-gating happens on TAP, not on RENDER.
- **Free-user tap flow:**
  1. Caller closes its own parent modal (e.g., `setShowDiagnosisDetail(false)`).
  2. Caller calls `showPaywall('diagnosis-resume', { onSuccess: () => openChat(diagnosis), onCancel: () => navigate.back() })`.
  3. App-level paywall opens at root (no stacking).
  4. On purchase, deferred callback re-opens the chat directly. User never re-taps.
- **Premium-user tap flow:** Direct chat open. No paywall.
- **Same button label internally branches:** the click handler checks `isPremium` and either opens chat directly or invokes the close-then-paywall flow. UI text doesn't differ.

### Resolved Diagnosis Reopen (DIAG-03, DIAG-04, DIAG-05)
- **Resolved status detection:** Reuse existing `SavedDiagnosis.resolvedAt: string | undefined` field (already populated by v1.0 problem-tracking flow). `Boolean(diagnosis.resolvedAt)` discriminates continue vs reopen.
- **System message prepend on reopen:**
  - On reopen tap, before opening chat: append a `role: 'system'` message to `diagnosis.messages[]` with literal copy:
    - ES: `"Hace {{N}} días marcaste esta consulta como resuelta. ¿Qué cambió?"` (voseo)
    - EN: `"You marked this consultation resolved {{N}} days ago. What changed?"`
  - `N` = `daysBetween(parseDate(resolvedAt), new Date())`.
  - Persisted via `useStorage().updateDiagnosis()`.
  - Set `reopenedAt: new Date().toISOString()` on the same diagnosis (new field).
- **Chat thread continuity:** ONE thread per diagnosis lifetime. Reopen does NOT create a new SavedDiagnosis. Per-diagnosis-lifetime limit (DIAG-06) implies one continuous `messages[]` array.
- **Resume system prompt (DIAG-05):**
  - Prepend a system block to the chat-diagnosis edge function payload that includes:
    - Prior diagnosis summary verbatim: severity, problem name, recommendation, photo description (if present).
    - Explicit instruction: `"No re-evalúes la severidad ni cambies el diagnóstico salvo que el usuario suba una foto nueva. Continuá el seguimiento basándote en el diagnóstico previo."`
  - User-visible chat banner above input: `"Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva."` (DIAG-04 verbatim).
- **Text-only by design:** Resume chat does NOT auto-attach the original diagnosis photo. User uploading a new photo triggers re-assessment. Banner copy makes this explicit.

### Per-diagnosis Message Limit + Count Visibility (DIAG-06, DIAG-07)
- **Limit constant:** Reuse existing `FREE_CHAT_MESSAGE_LIMIT` (current value lives in code; do NOT introduce new constant unless missing). **Per-diagnosis-lifetime** count = `diagnosis.messages.filter(m => m.role === 'user').length`. Compared against limit.
- **Count display (free users only):**
  - Above the input row: `t('diagnosis.messagesRemaining', { remaining, total })` interpolated.
  - ES: `"{{remaining}} de {{total}} mensajes restantes"` (voseo not needed — declarative string).
  - EN: `"{{remaining}} of {{total}} messages remaining"`.
  - Hidden for premium users (no limit applies).
  - Color shifts from neutral → warning when ≤ 2 remaining (uses existing theme tokens).
- **At 0 remaining behavior:**
  - Input is **NOT disabled** — user can type freely.
  - On SEND tap with 0 remaining: invoke `showPaywall('diagnosis-limit', { onSuccess: () => sendMessage(typedText) })`.
  - `typedText` is captured before showPaywall fires. After purchase, deferred callback fires send with the same text. No re-tap required (DIAG-07 + PAY-03).
  - Avoids mid-typing surprise per CONTEXT.
- **Premium upgrade lift (DIAG-07):**
  - Purchase succeeds → `onSuccess` fires → `sendMessage(typedText)` → message appears in chat.
  - Count display disappears immediately (premium = no limit).
  - Input stays focused. No "click send again" prompt.

### App-level Paywall + Deferred Callback (PAY-01, PAY-02, PAY-03)
- **Mount verification:** PaywallModal is currently mounted via PremiumProvider context. **Verify** during planning that it renders at App.tsx root (NOT inside a TabScreen or nested modal). If mounted lower, lift to App root in Plan 09-01. Single render at root per PAY-01.
- **Deferred callback API:**
  - Extend `usePremium().showPaywall()` signature to accept options:
    ```ts
    showPaywall(
      trigger: PaywallTrigger,
      options?: {
        onSuccess?: () => void;
        onCancel?: () => void;
      }
    ): void
    ```
  - usePremium stores `pendingCallback: { onSuccess, onCancel } | null` in state.
  - PaywallModal's `onPurchaseComplete` handler invokes `pendingCallback.onSuccess?.()` then clears `pendingCallback`.
  - User-cancellation (close paywall without purchase) invokes `pendingCallback.onCancel?.()` then clears.
  - Idempotent: clearing happens regardless of callback presence — no leaked state.
- **Nested-modal close contract (PAY-02):**
  - Caller responsibility: caller MUST close its own parent modal BEFORE calling `showPaywall(...)`. Document the contract in `usePremium.tsx` JSDoc.
  - usePremium does NOT auto-close anything — it doesn't know about caller's local state. Trying to coordinate would create coupling.
  - In React Native: opening a Modal while another Modal is open creates stacking + Z-order issues, and on iOS the older Modal becomes uninteractive. Caller-close-first is the simplest safe pattern.
- **Audit task:** Plan 09 includes an audit task that greps all 7 existing `showPaywall` call sites. For each:
  - Check: is the caller inside a Modal or nested modal context?
  - If yes: refactor to close-then-trigger pattern.
  - If no: document as already-correct.
  - Audit findings recorded in 09-SUMMARY.md.
- **PaywallTrigger union:** Add `'diagnosis-resume'` and `'diagnosis-limit'` variants. Document each variant's semantic in `usePremium.tsx` type comment.

### Cross-Cutting / Claude's Discretion
- **i18n keys:** New keys for: `diagnosis.continueChat`, `diagnosis.reopenChat`, `diagnosis.resumeBanner`, `diagnosis.reopenSystemMessage`, `diagnosis.messagesRemaining`. Plus paywall trigger labels for the new variants. Both EN + ES with voseo for verb forms.
- **Type changes:** `SavedDiagnosis.reopenedAt?: string` (additive, optional, no schema bump). `PaywallTrigger` union expansion. `PremiumContextType.showPaywall` signature widening (backward-compatible since options is optional).
- **Edge function payload:** `chat-diagnosis` accepts new optional field `priorDiagnosisSummary?: string` (server constructs the resume system prompt when present). Backward-compat: server falls back to current behavior if absent.
- **Resend-after-paywall captured-text storage:** When DIAG-07 path triggers, `typedText` is captured into the deferred callback closure (NOT in usePremium state). Cleanest scope — no risk of stale text leaking between unrelated paywall triggers.
- **`reopenedAt` vs multiple reopens:** v1.1 ships single-reopen tracking (latest reopen overwrites). If telemetry shows users reopen multiple times, v1.2 may extend to a `reopens: string[]` array.
- **AI prompt language matching:** Resume system prompt sent in user's locale (Phase 7 already added `lang` parameter to chat-diagnosis). Spanish prompt uses voseo.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — i18n rules (`t()` everywhere; voseo for ES), edge function deploy commands, premium gating rules.

### Planning artifacts
- `.planning/PROJECT.md` — milestone goals.
- `.planning/REQUIREMENTS.md` §Diagnosis Continuity (DIAG-01..07), §Paywall Architecture (PAY-01..03).
- `.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — SCHEMA-08 stance for additive optional fields.
- `.planning/phases/07-ui-write-side-onboarding-edge-function-contract/07-CONTEXT.md` — chat-diagnosis edge function dual-payload pattern (Phase 9 extends with `priorDiagnosisSummary?`).

### Codebase maps
- `.planning/codebase/STRUCTURE.md` — file layout.
- `.planning/codebase/CONVENTIONS.md` — naming, i18n discipline.

### Source files of interest (read-side + write-side)
- `src/hooks/usePremium.tsx` — `showPaywall(trigger)` signature widens to accept options. PaywallTrigger union expands.
- `src/components/PaywallModal.tsx` — `onPurchaseComplete` invokes deferred callback. Verify mount at App root.
- `src/components/DiagnosisFollowUp.tsx` — currently the resume entry point. Add `mode` prop; remove `isPremium &&` gate.
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — chat UI. Render count above input; gate send tap; resume banner copy.
- `src/components/MyPlantDetailModal.tsx` — past-diagnosis card list (likely surface). Audit "Continuar consulta" button render path.
- `src/types/index.ts` — `SavedDiagnosis` (add `reopenedAt?`); `Message` shape (already supports `role: 'system' | 'user' | 'assistant'`).
- `src/hooks/useStorage.tsx` — `updateDiagnosis` action (used to persist reopen system message + reopenedAt).
- `App.tsx` — verify PaywallModal mount location (should be at root, not inside TabScreen).
- `supabase/functions/chat-diagnosis/index.ts` — payload extension with `priorDiagnosisSummary?: string`. Resume system prompt construction.

### Existing paywall callers (audit targets)
- `src/screens/SettingsScreen.tsx`
- `src/screens/TodayScreen.tsx`
- `src/screens/PlantsScreen.tsx`
- `src/components/MyPlantDetailModal.tsx`
- `src/components/DailyTip.tsx`
- `src/components/PlantPhotoAlbum.tsx`
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`
- `src/components/PlantIdentifier/PlantIdentifierModal.tsx`

### i18n
- `src/i18n/locales/{en,es}/common.json` — add `diagnosis.continueChat`, `diagnosis.reopenChat`, `diagnosis.resumeBanner`, `diagnosis.reopenSystemMessage` (with `{{days}}` interp), `diagnosis.messagesRemaining` (with `{{remaining}}, {{total}}` interp).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`usePremium` hook + PaywallModal infrastructure** already exists. Phase 9 EXTENDS the API rather than rebuilding.
- **`SavedDiagnosis.resolvedAt`** field already populated by v1.0 problem-tracking. Phase 9 reads it as the discriminator.
- **`SavedDiagnosis.messages[]`** already supports `role: 'system' | 'user' | 'assistant'`. System message prepend uses existing schema.
- **`useStorage().updateDiagnosis()`** already exists for persisting per-diagnosis updates. Phase 9 calls it for both `reopenedAt` set and system-message append.
- **`chat-diagnosis` edge function** (Phase 7 wired) accepts `lang` parameter. Phase 9 extends with `priorDiagnosisSummary?: string` — backward-compatible.
- **`DiagnosisFollowUp` component** already wraps the resume button render. Phase 9 modifies its render gate + adds `mode` prop.
- **`daysBetween` helper** in `src/utils/dates.ts` for computing the "Hace N días" interpolation.
- **Phase 7 dual-payload server pattern** for chat-diagnosis carries forward — `priorDiagnosisSummary` is just another optional field server reads if present.

### Established Patterns
- **App-level context pattern** (PremiumContext, NotificationContext, MigrationContext): single mount at App root; consumers via hook. Phase 9 verifies + extends — does NOT introduce new context.
- **Defensive optional callback invocation** (Phase 4 lock pattern): `pendingCallback?.onSuccess?.()`. Same shape used elsewhere; no new pattern.
- **i18n parity** (Phase 4/6/7/8 lock) — every new key in BOTH EN + ES; voseo for verbs.
- **Backward-compat dual-payload at edge** (Phase 7 lock) — `priorDiagnosisSummary?: string` is additive; server falls back to current behavior when absent.
- **Caller-close-first nested-modal contract** — RN doesn't reliably stack Modals on iOS. Caller closes own modal before triggering App-level modal. Documented in PaywallModal usage examples.
- **Deferred callback in closure** — captured in click handler (`typedText` closure), passed to showPaywall as `options.onSuccess`. Cleanest scope; no usePremium state pollution.

### Integration Points
- **DiagnosisFollowUp.tsx:** removes `isPremium &&` gate from button render. Adds `mode` prop. Click handler routes by isPremium.
- **PlantDiagnosisModal.tsx (chat):** renders count above input; gates send button on free + 0-remaining; banner copy on resume.
- **MyPlantDetailModal.tsx (past-diagnosis card list):** entry surface for "Continuar consulta". Audit target.
- **usePremium.tsx:** `showPaywall(trigger, options?)` extension. Stores `pendingCallback` state. Type widens.
- **PaywallModal.tsx:** invokes deferred callback on success/cancel; clears state idempotently.
- **App.tsx:** verify PaywallModal mount; if nested, lift to root. Two AppContent paths discipline (Phase 5 lock) carries — both must mount.
- **chat-diagnosis edge function:** new optional `priorDiagnosisSummary?` field; conditional system-prompt construction.
- **`useStorage.updateDiagnosis()`** consumers: reopen path persists `reopenedAt` + system message append. addDiagnosis is unchanged.

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" (Phase 4 carry) — accept simple deferred-callback closure over more elaborate state-machine designs. Single optional callback pair is sufficient.
- "Caller-close-first" for nested modals is the locked pattern — RN's Modal stacking is unreliable on iOS, and PR review history confirms this is the convention. Audit confirms which call sites need refactoring.
- Reuse existing `SavedDiagnosis.resolvedAt` (Phase 1.0) — no new field needed for the active/resolved discriminator. New `reopenedAt?` is additive only.
- Per-diagnosis-lifetime message count = `messages.filter(m => m.role === 'user').length`. Persisted in chat history already; no new counter field.
- Voseo discipline carries: `diagnosis.reopenSystemMessage` ES uses voseo if any verbs are added (current copy is interrogative — "¿Qué cambió?" — no verb form needed).

</specifics>

<deferred>
## Deferred Ideas

- **Re-upload photo within resumed chat for visual context update** — v2.0 (DIAG-V01 in REQUIREMENTS). Phase 9 ships text-only resume per CONTEXT lock.
- **Per-day or per-resume message limit** — rejected; per-diagnosis-lifetime per CONTEXT.
- **Multiple reopen tracking** (`reopens: string[]`) — v1.2 if telemetry shows users reopen multiple times.
- **Promise-based `await showPaywall()` API** — rejected; callback API is simpler given React Native's Modal lifecycle.
- **Auto-close caller modal from usePremium** — rejected; coupling violation.
- **Generic "pending action" queue across non-paywall flows** — out of scope; only paywall has the deferred-callback need today.
- **Auto-attach prior photo to AI re-assessment on resume** — rejected; CONTEXT locks text-only by design.
- **Horticultural override for AI severity re-assessment** — out of scope.
- **Migration of legacy SavedDiagnosis entries without resolvedAt** — N/A (resolvedAt has been optional since v1.0; existing entries either have it or are still-active).

</deferred>

---

*Phase: 09-diagnosis-continuity-paywall-architecture*
*Context gathered: 2026-05-02*
