---
phase: 3
slug: reminders-tasks-plant-detail-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework configured (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Type check must be green
- **Max feedback latency:** 15 seconds

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Follow-up task appears in Hoy on due date | NOTF-02 | Requires time/date manipulation | Create tracked problem → advance device date → verify task card in Hoy |
| Push notification tap navigates to plant (cold start) | NOTF-03 | Requires killing and restarting app | Schedule notification → kill app → tap notification → verify navigation |
| Push notification tap navigates to plant (foreground) | NOTF-03 | Requires active notification | Trigger notification while in app → tap → verify navigation |
| Active problems section in plant detail | UI-01 | Visual verification | Track a problem → open plant detail → verify problems section |
| Photo timeline shows chronological entries | UI-02 | Visual + data verification | Add 2+ follow-up entries → verify timeline order with photos |
| Status indicator on plant card | UI-03 | Visual verification | Track problem → go to plant list → verify indicator dot/badge |
| Problem card shows all required fields | UI-04 | Visual verification | Track problem → verify status, severity, dates all shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
