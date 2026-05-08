---
phase: 18
slug: plantcard-cleanup-mood-emoji
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — TypeScript strict + custom CJS smoke scripts (per CLAUDE.md: no test framework configured) |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase18.cjs` |
| **Estimated runtime** | ~15 seconds (typecheck) + ~2 seconds (smoke) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `node scripts/smoke-phase18.cjs`
- **Before `/gsd:verify-work`:** Full suite (typecheck + smoke) must be green
- **Max feedback latency:** ~17 seconds

---

## Per-Task Verification Map

> Filled by gsd-planner from PLAN.md tasks. One row per task. Status updated by executor.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| _pending planner_ | _ | _ | _ | _ | _ | _ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase18.cjs` — file-content asserts for CARD-01..05, GAM-03/04 (grep-based; no runtime)

*Smoke script asserts (per RESEARCH.md Validation Architecture):*
- PlantCard.tsx no longer imports/renders PlantHealthBadge (CARD-04)
- PlantCard.tsx contains GestureDetector + Gesture.Pan + Gesture.LongPress (CARD-01, CARD-02)
- PlantCard.tsx contains mood-emoji unconditional render (CARD-03, GAM-03/04)
- PlantsScreen.tsx contains swipe-hint affordance + AsyncStorage dismissal flag (CARD-05)
- i18n keys for new strings exist in en/common.json AND es/common.json (parity)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipe-to-delete UX feel + haptic feedback | CARD-01 | Requires real device; haptics not testable in JS | Open Plantas tab → swipe a card left → confirm haptic fires + confirmation Toast appears |
| Long-press menu opens BottomSheet | CARD-02 | Requires real device gesture | Long-press a PlantCard → BottomSheet rises with favorite/edit/delete |
| Mood emoji updates as health score changes | CARD-03 | Requires data state mutation over time | Mark watering overdue 3+ days → reopen Plantas → confirm emoji shifts (😊 → 😐 → 😟) |
| First-render swipe hint + dismissal persistence | CARD-05 | Requires AsyncStorage state across app restarts | Fresh install → confirm hint shows on first card → dismiss → kill app → reopen → confirm hint stays dismissed |
| FlatList row recycling does not leak swipe state | Pitfall 5 | Requires scrolling many cards | Add 20+ plants → scroll fast through Plantas → confirm no half-swiped cards reappear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
