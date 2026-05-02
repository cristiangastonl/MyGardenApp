---
phase: 09-diagnosis-continuity-paywall-architecture
plan: "06"
subsystem: diagnosis-chat-paywall
tags: [DIAG-04, DIAG-06, DIAG-07, paywall, lifetime-count, resume-banner, system-message]
dependency_graph:
  requires: [09-01, 09-02, 09-04]
  provides: [lifetime-count-fix, send-tap-paywall-gate, resume-banner, system-message-rendering]
  affects: [PlantDiagnosisModal, DiagnosisResults, premium.ts, smoke-phase09]
tech_stack:
  added: []
  patterns: [deferred-callback-closure, send-tap-gating-not-input-disable, lifetime-count-arithmetic]
key_files:
  created: []
  modified:
    - src/config/premium.ts
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
    - src/components/PlantDiagnosis/DiagnosisResults.tsx
    - scripts/smoke-phase09.mjs
decisions:
  - "priorPersistedCount from resumeDiagnosis?.chat not from in-session chatMessages — fixes CF-7 session-only bug"
  - "remaining ?? Infinity defensive idiom for no-gate-when-undefined (prop is optional)"
  - "4 new StyleSheet entries use only existing theme tokens (infoBg, infoText, textMuted, warningText, borderRadius.md, spacing.sm/md/xs)"
  - "resumeBanner placed between chat-message map and resolution card (not at top of section)"
metrics:
  duration: "8 min"
  completed: "2026-05-01"
  tasks_completed: 4
  files_modified: 4
---

# Phase 09 Plan 06: Lifetime Count Fix + Send-Tap Paywall + Resume Banner Summary

Implemented DIAG-04, DIAG-06, DIAG-07 in `PlantDiagnosisModal` and `DiagnosisResults`: per-diagnosis-lifetime message counting with CF-7 bug fix (`priorPersistedCount + sessionUserCount`), deferred paywall send-tap gate at 0 remaining (input stays enabled), resume banner above input, and system message centered-banner rendering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Export FREE_CHAT_MESSAGES_PER_DIAGNOSIS | ec56c4c | src/config/premium.ts |
| 2 | PlantDiagnosisModal — lifetime count fix + deferred paywall | 562c3d7 | PlantDiagnosisModal.tsx |
| 3 | DiagnosisResults — count display + send-tap gate + resume banner + system msg | 1cc57a4 | DiagnosisResults.tsx |
| 4 | Activate smoke-phase09 T6 | 3106b78 | scripts/smoke-phase09.mjs |

## CF-7 Bug Fix (priorPersistedCount + sessionUserCount)

**Before (buggy — session-only, both branches identical):**
```typescript
const userMessageCount = chatMessages.filter(m => m.role === 'user').length;
const totalUserMessages = isResumedChat
  ? userMessageCount  // comment says "only new messages" but is identical to else
  : userMessageCount;
const canChat = canChatDiagnosis(totalUserMessages);
```

**After (lifetime fix):**
```typescript
const sessionUserCount = chatMessages.filter(m => m.role === 'user').length;
const priorPersistedCount = (resumeDiagnosis?.chat || []).filter(m => m.role === 'user').length;
const lifetimeUserCount = priorPersistedCount + sessionUserCount;
const remaining = Math.max(0, FREE_CHAT_MESSAGES_PER_DIAGNOSIS - lifetimeUserCount);
const canChat = canChatDiagnosis(lifetimeUserCount);
```

The bug reset the message limit on every new session for a resumed diagnosis. A free user could exhaust 3 messages, reopen the diagnosis, and get 3 more — indefinitely. The fix counts all persisted user messages in `resumeDiagnosis.chat` plus the current session's messages.

## JSX Placement Map

- **System message banner**: inside `chatMessages.map((msg) => { if (msg.role === 'system') return <View style={styles.systemMessageBanner}>...`  — replaces the previous unconditional bubble render; user/assistant messages fall through to bubble path.
- **Resume banner (`isResumedChat`)**: between the chat-message map and the resolution suggestion card — positioned above the input area as required by DIAG-04.
- **Count display row**: at the very top of the `{canSendChat && !chatLoading ? (<View> ...` block, before the pending-photo preview — renders `t('diagnosis.messagesRemaining', { remaining, total: chatLimit ?? 3 })` with `warningText` color when `remaining <= 2`.

## New Style Tokens (Design-System Rule Honored)

Four new entries added to the StyleSheet. No new color tokens introduced — all values are from `src/theme.ts`:

| Style | Key tokens used |
|-------|----------------|
| `resumeBanner` | `colors.infoBg`, `borderRadius.md`, `spacing.sm/md` |
| `resumeBannerText` | `fonts.body`, `colors.infoText` |
| `systemMessageBanner` | identical shape to `resumeBanner` |
| `systemMessageBannerText` | identical shape to `resumeBannerText` |
| `messagesRemainingRow` | `fonts.body`, `colors.textMuted`, `spacing.xs` |
| `messagesRemainingWarning` | `colors.warningText` (color override only) |

## Send-Tap Gate Pattern (DIAG-07)

Input stays enabled for typing at all times. On send tap:

```typescript
if (!isPremium && (remaining ?? Infinity) === 0 && onPaywallWithDeferredSend) {
  onPaywallWithDeferredSend(text, base64, uri);
  setChatInput('');
  setPendingPhoto(null);
  return;
}
```

`remaining ?? Infinity` defaults to no-gate when the prop is `undefined` (prop is optional; callers that don't pass it get the old behavior). The typed text + photo is captured in a closure in `PlantDiagnosisModal.handlePaywallWithDeferredSend` before `showPaywall` fires — never stored in usePremium state (RESEARCH lock / Pitfall prevention).

## T6 Sub-Assert PASS Confirmation

All 11 T6 sub-asserts pass:
- T6a: lifetime count = prior(2) + session(1) = 3
- T6b: remaining = max(0, 3 - 3) = 0
- T6c: above-limit clamped to 0 by Math.max guard
- T6d: at lifetime=2, remaining=1
- T6e: FREE_CHAT_MESSAGES_PER_DIAGNOSIS exported from premium.ts
- T6f: PlantDiagnosisModal contains priorPersistedCount
- T6g: PlantDiagnosisModal computes lifetimeUserCount
- T6h: showPaywall('diagnosis-limit') wired
- T6i: DiagnosisResults renders system messages distinctly
- T6j: DiagnosisResults renders resume banner
- T6k: DiagnosisResults renders count display

`node scripts/smoke-phase09.mjs` exits 0 with `Phase 9 smoke: PASS (44/44)`.

## Deviations from Plan

None — plan executed exactly as written. The done-criteria grep count for `PLACEHOLDER — Plan 09` (plan expected 2, actual is 5) is a documentation artifact: T1/T2/T3 placeholders belong to Plan 09-05 and were already replaced in the runner by the time this plan ran. The runner still PASSes.

## Self-Check

**Files created:**
- .planning/phases/09-diagnosis-continuity-paywall-architecture/09-06-SUMMARY.md — this file

**Files modified (verified via git log):**
- ec56c4c: src/config/premium.ts
- 562c3d7: src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
- 1cc57a4: src/components/PlantDiagnosis/DiagnosisResults.tsx
- 3106b78: scripts/smoke-phase09.mjs
