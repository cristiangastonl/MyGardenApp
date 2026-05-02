---
phase: 9
slug: diagnosis-continuity-paywall-architecture
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
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

> Filled in by gsd-planner during plan creation.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| _TBD by planner_ | — | — | — | — | — | — | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase09.mjs` — pure smoke runner; assertions for: `usePremium` widening (showPaywall(trigger, options?) signature exists), pendingCallback state shape, deferred callback fired exactly once on success/cancel, system-message append idempotency for resolved-diagnosis reopen, per-diagnosis-lifetime user-message count = `messages.filter(m => m.role === 'user').length` (NOT session-scoped), priorDiagnosisSummary edge-function payload field accepted optionally.
- [ ] No new framework install — typescript already a project dep; node mjs runner sufficient.

*Visual rendering (PaywallModal mount, "Continuar consulta" button, system message banner, count display, send-tap gating, resume banner) is verified manually in Expo Go per the Manual-Only table — no React Native test renderer in this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Continuar consulta" button visible to free users | DIAG-01 | Visual + state check | As free user, open any past diagnosis (resolved or active) → confirm button visible. As premium user → same button visible (different internal route). |
| Free-user tap → close-then-paywall (no stacking) | DIAG-02, PAY-02 | iOS Modal stacking is the highest-risk visual behavior | As free user, tap "Continuar consulta" from inside `DiagnosisDetailModal`. Confirm: (a) DiagnosisDetailModal closes first, (b) PaywallModal opens cleanly at root, (c) no Z-order glitch on iOS, (d) tap-cancel returns to root, not the closed parent. |
| Resolved diagnosis reopen — system message + banner | DIAG-03, DIAG-04 | Visual + content review | Resolve a diagnosis (today). Wait until tomorrow OR set device clock +N days. Tap "Reabrir consulta" → confirm: (a) prepended system message shows "Hace N días marcaste esta consulta como resuelta. ¿Qué cambió?" centered as info banner (not chat bubble); (b) banner above input shows "Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva."; (c) AI response does NOT re-assess severity — confirm by checking edge function logs for `priorDiagnosisSummary` in payload. |
| Per-diagnosis-lifetime message count above input | DIAG-06 | Visual + count correctness | Free user opens an old diagnosis with N prior user messages. Confirm count above input reads `(LIMIT - N) de LIMIT mensajes restantes`. Send 1 message → count drops by 1. Resume next session → count persists (per-lifetime, not per-session). |
| At 0 remaining: send-tap gates with paywall (not typing) | DIAG-06 | Critical UX moment | Free user with 0 remaining types in the input freely (no disable). Tap send → PaywallModal opens. Cancel paywall → return to chat with typed text intact. Tap send again → PaywallModal opens again. |
| Premium upgrade fires deferred callback (auto-resend) | DIAG-07, PAY-03 | Critical revenue UX | Free user types "test message", taps send → PaywallModal opens. Complete purchase → confirm: (a) PaywallModal closes, (b) "test message" auto-sends without user re-tap, (c) message appears in chat, (d) count display disappears (premium = no limit), (e) input stays focused. |
| App-level paywall mounted in BOTH AppContent paths | PAY-01 | Architectural invariant | Toggle Features.AUTH off → MVP path → trigger paywall from any caller → opens. Toggle Features.AUTH on (when ready) → AUTH path → trigger paywall → opens. Both paths must mount PaywallModal at root. |
| Audit findings: all existing showPaywall callers use close-then-trigger | PAY-02 | Code review + manual UAT | Trigger paywall from each of the 8 existing callers (SettingsScreen, TodayScreen, PlantsScreen, MyPlantDetailModal, DailyTip, PlantPhotoAlbum, PlantDiagnosisModal, PlantIdentifierModal). Confirm none stack behind a parent modal. Document audit results in 09-SUMMARY.md. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify OR are listed in Manual-Only table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (`scripts/smoke-phase09.mjs`) covers usePremium widening + pendingCallback + system-message idempotency + message-count correctness
- [ ] No watch-mode flags
- [ ] Feedback latency < 25s
- [ ] `nyquist_compliant: true` set in frontmatter after planner fills the per-task map and Wave 0 ships

**Approval:** pending
