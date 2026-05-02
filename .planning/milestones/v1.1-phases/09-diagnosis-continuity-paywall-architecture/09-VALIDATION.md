---
phase: 9
slug: diagnosis-continuity-paywall-architecture
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-02
last_updated: 2026-05-02
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | typescript.transpileModule smoke runner (Phase 4/5/6/7/8 single-compile-path policy carried) |
| **Config file** | `scripts/smoke-phase09.mjs` (Wave 0 / Plan 09-01 creates) |
| **Quick run command** | `npx tsc --noEmit` (type-only, ~6s) |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase09.mjs && node scripts/smoke-phase08.mjs && node scripts/smoke-phase07.mjs && node scripts/smoke-phase06.mjs && node scripts/migration-smoke-test.mjs` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite green AND manual UI inspection per Manual-Only table
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01.T1 | 09-01 | 1 | (infra) | Unit (tsc + grep) | `npx tsc --noEmit && grep -c "role: 'user' \| 'assistant' \| 'system'" src/types/index.ts` | After 09-01 | ⬜ |
| 09-01.T2 | 09-01 | 1 | (infra) | Unit (smoke runner) | `node scripts/smoke-phase09.mjs` | After 09-01 | ⬜ |
| 09-02.T1 | 09-02 | 2 | PAY-03 | Unit (tsc + grep) | `npx tsc --noEmit && grep -c "showPaywall: (trigger: PaywallTrigger, options?: PaywallCallbackOptions)" src/hooks/usePremium.tsx` | After 09-02 | ⬜ |
| 09-02.T2 | 09-02 | 2 | PAY-03 | Unit (tsc + grep) | `npx tsc --noEmit && grep -c "consumePendingCallback" src/components/PaywallModal.tsx` | After 09-02 | ⬜ |
| 09-02.T3 | 09-02 | 2 | PAY-01 | Unit (grep) | `grep -c "<PaywallModal" App.tsx` === 2 | After 09-02 | ⬜ |
| 09-02.T4 | 09-02 | 2 | PAY-01 + PAY-03 | Smoke T7+T8+T10 | `node scripts/smoke-phase09.mjs` | After 09-02 | ⬜ |
| 09-03.T1 | 09-03 | 2 | (DIAG-03 prereq) | Unit (tsc + grep) | `npx tsc --noEmit && grep -c "updateDiagnosis" src/hooks/useStorage.tsx` ≥ 4 | After 09-03 | ⬜ |
| 09-03.T2 | 09-03 | 2 | (infra) | Smoke T11 | `node scripts/smoke-phase09.mjs` | After 09-03 | ⬜ |
| 09-04.T1 | 09-04 | 3 | (DIAG-01..07 strings) | Unit (JSON parse + grep) | `node -e "JSON.parse(...)" && grep -c "Reabrir consulta" src/i18n/locales/es/common.json` | After 09-04 | ⬜ |
| 09-04.T2 | 09-04 | 3 | (DIAG-01..07 strings) | Unit (JSON parse + grep) | `node -e "JSON.parse(...)" && grep -c "Reopen consultation" src/i18n/locales/en/common.json` | After 09-04 | ⬜ |
| 09-04.T3 | 09-04 | 3 | (i18n parity) | Smoke T4 | `node scripts/smoke-phase09.mjs` | After 09-04 | ⬜ |
| 09-05.T1 | 09-05 | 4 | DIAG-01 + DIAG-02 + DIAG-03 | Unit (grep) | `grep -c "isPremium && !diagnosis.resolved" src/components/PlantDiagnosis/DiagnosisDetailModal.tsx` === 0 | After 09-05 | ⬜ |
| 09-05.T2 | 09-05 | 4 | (prop cleanup) | Unit (tsc) | `npx tsc --noEmit && grep -c "isPremium={isPremium}" src/components/MyPlantDetailModal.tsx` === 0 | After 09-05 | ⬜ |
| 09-05.T3 | 09-05 | 4 | DIAG-01..03 | Smoke T1+T2+T3 | `node scripts/smoke-phase09.mjs` | After 09-05 | ⬜ |
| 09-06.T1 | 09-06 | 4 | (DIAG-06 prereq) | Unit (grep) | `grep -c "^export const FREE_CHAT_MESSAGES_PER_DIAGNOSIS = 3;" src/config/premium.ts` === 1 | After 09-06 | ⬜ |
| 09-06.T2 | 09-06 | 4 | DIAG-06 + DIAG-07 | Unit (grep) | `grep -c "priorPersistedCount" src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` === 1 | After 09-06 | ⬜ |
| 09-06.T3 | 09-06 | 4 | DIAG-04 + DIAG-06 + DIAG-07 | Unit (tsc + grep) | `npx tsc --noEmit && grep -c "msg.role === 'system'" src/components/PlantDiagnosis/DiagnosisResults.tsx` === 1 | After 09-06 | ⬜ |
| 09-06.T4 | 09-06 | 4 | DIAG-04..07 | Smoke T6 | `node scripts/smoke-phase09.mjs` | After 09-06 | ⬜ |
| 09-07.T1 | 09-07 | 5 | DIAG-05 | Unit (grep) | `grep -c "priorDiagnosisSummary" supabase/functions/chat-diagnosis/index.ts` ≥ 3 | After 09-07 | ⬜ |
| 09-07.T2 | 09-07 | 5 | DIAG-05 | Unit (tsc + grep) | `npx tsc --noEmit && grep -c "buildPriorDiagnosisSummary" src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` ≥ 2 | After 09-07 | ⬜ |
| 09-07.T3 | 09-07 | 5 | DIAG-05 | Smoke T5 | `node scripts/smoke-phase09.mjs` | After 09-07 | ⬜ |
| 09-08.T1 | 09-08 | 6 | PAY-02 | Unit (grep) | `grep -c "() => showPaywall('plant_diagnosis')" src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` === 0 | After 09-08 | ⬜ |
| 09-08.T2 | 09-08 | 6 | PAY-02 | Unit (grep) | `grep -B3 "showPaywall('plant_diagnosis')" src/components/PlantIdentifier/PlantIdentifierModal.tsx \| grep -cE "onClose\(\)\|setVisible\(false\)"` ≥ 1 | After 09-08 | ⬜ |
| 09-08.T3 | 09-08 | 6 | PAY-02 | File exists check | `test -f .planning/phases/09-diagnosis-continuity-paywall-architecture/09-AUDIT.md` | After 09-08 | ⬜ |
| 09-08.T4 | 09-08 | 6 | PAY-02 | Smoke T9 | `node scripts/smoke-phase09.mjs` (zero PLACEHOLDER remaining) | After 09-08 | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase09.mjs` — covers all 11 T-assertions: T0a/b/c (Wave 0 type checks), T1 (DiagnosisDetailModal gate removal), T2 (close-then-paywall), T3 (system message idempotency), T4 (i18n parity + interpolation), T5 (priorDiagnosisSummary edge + client), T6 (lifetime count arithmetic + premium.ts export), T7 (deferred callback), T8 (PaywallModal in both AppContent paths), T9 (PAY-02 close-then-trigger compliance), T10 (usePremium signature widening), T11 (updateDiagnosis storage action).
- [ ] No new framework install — typescript already a project dep; node mjs runner sufficient.

*Visual rendering (PaywallModal mount, "Continuar consulta" / "Reabrir consulta" button label, system message banner, count display, send-tap gating, resume banner) is verified manually in Expo Go per the Manual-Only table — no React Native test renderer in this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Continuar consulta" button visible to free users | DIAG-01 | Visual + state check | As free user, open any past diagnosis (resolved or active) → confirm button visible. As premium user → same button visible (different internal route). |
| "Reabrir consulta" label on resolved diagnoses | DIAG-03 | Visual + label discrimination | Resolve a diagnosis. Reopen `DiagnosisDetailModal` for the resolved diagnosis → confirm button label is "Reabrir consulta" (not "Continuar consulta"). |
| Free-user tap → close-then-paywall (no stacking) | DIAG-02, PAY-02 | iOS Modal stacking is the highest-risk visual behavior | As free user, tap "Continuar consulta" from inside `DiagnosisDetailModal`. Confirm: (a) DiagnosisDetailModal closes first, (b) PaywallModal opens cleanly at root, (c) no Z-order glitch on iOS, (d) tap-cancel returns to root, not the closed parent. |
| Resolved diagnosis reopen — system message + banner | DIAG-03, DIAG-04 | Visual + content review | Resolve a diagnosis (today). Wait until tomorrow OR set device clock +N days. Tap "Reabrir consulta" → confirm: (a) prepended system message shows "Hace N días marcaste esta consulta como resuelta. ¿Qué cambió?" centered as info banner (not chat bubble); (b) banner above input shows "Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva."; (c) AI response does NOT re-assess severity — confirm by checking edge function logs for `priorDiagnosisSummary` in payload. |
| System message idempotency | DIAG-03 | Multiple-reopen safety | Reopen the same resolved diagnosis twice in the same session. Confirm only ONE system message exists in the chat history (RESEARCH §Q2 lock). |
| Per-diagnosis-lifetime message count above input | DIAG-06 | Visual + count correctness | Free user opens an old diagnosis with N prior user messages. Confirm count above input reads `(LIMIT - N) de LIMIT mensajes restantes`. Send 1 message → count drops by 1. Resume next session → count persists (per-lifetime, not per-session). |
| At 0 remaining: send-tap gates with paywall (not typing) | DIAG-06 | Critical UX moment | Free user with 0 remaining types in the input freely (no disable). Tap send → PaywallModal opens. Cancel paywall → return to chat with typed text intact (or with the captured deferred-callback semantics). Tap send again → PaywallModal opens again. |
| Premium upgrade fires deferred callback (auto-resend) | DIAG-07, PAY-03 | Critical revenue UX | Free user types "test message", taps send → PaywallModal opens. Complete purchase → confirm: (a) PaywallModal closes, (b) "test message" auto-sends without user re-tap, (c) message appears in chat, (d) count display disappears (premium = no limit), (e) input stays focused. |
| App-level paywall mounted in BOTH AppContent paths | PAY-01 | Architectural invariant | Toggle Features.AUTH off → MVP path → trigger paywall from any caller → opens. Toggle Features.AUTH on (when ready) → AUTH path → trigger paywall → opens. Both paths must mount PaywallModal at root. |
| Audit findings: all existing showPaywall callers use close-then-trigger | PAY-02 | Code review + manual UAT | Trigger paywall from each of the 8 existing callers (SettingsScreen, TodayScreen, PlantsScreen, MyPlantDetailModal, DailyTip, PlantPhotoAlbum, PlantDiagnosisModal, PlantIdentifierModal). Confirm none stack behind a parent modal. Audit results recorded in 09-AUDIT.md (Plan 09-08). |
| Edge function deploy (DIAG-05 server-side activation) | DIAG-05 | Manual deploy step deferred to v1.1 batch | After all Phase 9 plans land, run `source .envrc && supabase functions deploy chat-diagnosis` as part of the v1.1 batch deploy. Confirm Supabase dashboard shows new deploy SHA. UAT priorDiagnosisSummary in resumed-chat conversation logs. |

---

## Validation Sign-Off

- [x] All tasks have automated verify OR are listed in Manual-Only table above
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every plan ends with a smoke-runner activation task)
- [x] Wave 0 (`scripts/smoke-phase09.mjs`) covers usePremium widening + pendingCallback + system-message idempotency + message-count correctness (T7, T3, T6 — Plans 09-02, 09-05, 09-06)
- [x] No watch-mode flags
- [x] Feedback latency < 25s
- [x] `nyquist_compliant: true` set in frontmatter — per-task map populated, smoke assertions enumerated

**Approval:** plan-time approved (planner-derived). Execution-time validation: each plan's smoke-runner activation task is the green-gate.
