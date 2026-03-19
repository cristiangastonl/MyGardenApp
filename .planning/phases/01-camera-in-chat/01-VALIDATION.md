---
phase: 1
slug: camera-in-chat
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

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
- **Before `/gsd:verify-work`:** Type check must pass
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CAM-01 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | CAM-02 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 01-01-03 | 01 | 1 | CAM-03 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 01-01-04 | 01 | 1 | CAM-04 | manual | visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — project uses type-checking only.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Action sheet appears with camera + gallery | CAM-02 | UI interaction, no test framework | Tap photo button in chat → verify action sheet shows two options |
| Camera launches and returns photo | CAM-01 | Device camera required | Select "Sacar foto" → take photo → verify thumbnail appears |
| Permission denial shows inline message | CAM-03 | Requires denied permission state | Deny camera permission → verify inline message in chat with Settings link |
| Thumbnail preview matches gallery flow | CAM-04 | Visual comparison | Take camera photo → compare preview to gallery photo preview |
| Photo button disabled at message limit | CAM-02 | Premium gate interaction | Use 3 free messages → verify photo button grayed out → tap → verify paywall |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
