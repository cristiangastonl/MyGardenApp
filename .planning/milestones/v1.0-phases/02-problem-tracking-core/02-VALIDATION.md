---
phase: 2
slug: problem-tracking-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 2 — Validation Strategy

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

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-XX-01 | XX | 1 | PROB-01,02 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-XX-02 | XX | 1 | PROB-03,09 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-XX-03 | XX | 1 | PROB-04,05,06 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-XX-04 | XX | 1 | PROB-07,10 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-XX-05 | XX | 1 | NOTF-01,04 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-XX-06 | XX | 1 | I18N-01,02 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — project uses type-checking only.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Track this problem" button appears for premium users after diagnosis | PROB-01 | Premium gate + UI interaction | Run diagnosis with premium → verify button appears |
| Problem record persists across app restart | PROB-02 | Requires app lifecycle test | Create problem → kill app → reopen → verify problem exists |
| Push notification fires at follow-up date | NOTF-01 | Requires time manipulation or waiting | Create problem → advance device clock → verify notification |
| Notification does not duplicate on restart | NOTF-04 | Requires app restart test | Create problem → restart app → verify single notification |
| Photos survive cache clear | PROB-10 | Requires storage manipulation | Take follow-up photo → clear app cache → verify photo URI resolves |
| AI suggests resolution with one-tap confirm | PROB-05 | Requires AI response with improvement | Do follow-up diagnosis showing improvement → verify inline card |
| Edge function returns severity + summary | I18N-02 | Requires edge function deployment | Deploy → call function → verify response fields |
| ES translations use vos conjugation | I18N-01 | Language verification | Switch to ES → verify all new strings use vos |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
