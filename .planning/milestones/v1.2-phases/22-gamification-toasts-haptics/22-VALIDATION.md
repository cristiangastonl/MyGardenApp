---
phase: 22
slug: gamification-toasts-haptics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `22-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom Node CJS smoke runner (`scripts/smoke-phase22.cjs`) — three-tier sentinel pattern (PASS scaffold + SKIP→PASS placeholders for GAM-01/02/05 + STRICT cross-phase regression for Phase 18 + 19 + 20 + 21). |
| **Config file** | `package.json` `scripts` entry: `"smoke:phase22": "node scripts/smoke-phase22.cjs"` |
| **Quick run command** | `npm run smoke:phase22` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20 && npm run smoke:phase21 && npm run smoke:phase22` |
| **Estimated runtime** | ~3-5 s quick · ~18 s full |

---

## Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npm run smoke:phase22` (~3-5 s)
- **Per wave merge:** Full suite (~18 s)
- **Phase gate:** Full suite green + manual device-test checklist (or Option B deferral)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-00-01 | 00 | 0 | scaffold (smoke runner + npm + i18n + STRICT cross-phase) | unit (file-content) | `node scripts/smoke-phase22.cjs` | ❌ W0 | ⬜ pending |
| 22-01-01 | 01 | 1 | GAM-01 / GAM-02 | unit (file-content + tsc) | smoke (waterPlant/sunPlant/outdoorPlant actions + triggerHaptic('success') + onTaskCompletedRef call in all 4 actions) + tsc | ✅ | ⬜ pending |
| 22-01-02 | 01 | 1 | GAM-05 | unit (file-content + negative-grep) | smoke (GAM-05 negative-grep with `CARE_STREAKS` + `gam_anti_patterns\\.md` whitelist) | ✅ | ⬜ pending |
| 22-02-01 | 02 | 2 | GAM-01 / GAM-02 | unit (file-content + tsc) | smoke (TodayScreen + PlantsScreen + CalendarScreen: `gamificationToastVisible` state + Toast sibling + useEffect callback registration) + tsc | ✅ | ⬜ pending |
| 22-02-02 | 02 | 2 | GAM-01 | unit (file-content) | smoke (Toast smoke proximity regex on `gamification.toastSuccess` ↔ `gamificationToastVisible` in all 3 screens) | ✅ | ⬜ pending |
| 22-03-01 | 03 | 3 | GAM-01..02..05 | manual (device test) | Manual checklist (or Option B deferral) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase22.cjs` — three-tier runner (PASS scaffold + SKIP→PASS placeholders for GAM-01/02/05 + STRICT cross-phase Phase 18 + 19 + 20 + 21 regression sentinels)
- [ ] `package.json` — add `"smoke:phase22": "node scripts/smoke-phase22.cjs"`
- [ ] `src/i18n/locales/{en,es}/common.json` — `gamification.toastSuccess` key:
  - EN: `"You're on it! 🌱"`
  - ES (voseo): `"¡Vas bien! 🌱"`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Haptic actually fires on device | GAM-02 | Haptic hardware requires real device (NOT simulator) | Mark a water/sun/outdoor/fertilize task done on iOS + Android physical devices; Single `Haptics.NotificationFeedbackType.Success` thump fires once. |
| Toast renders above tab bar + above ExpandedFAB | GAM-01 | Visual Z-order layout | Mark a task done; "¡Vas bien! 🌱" Toast renders centered, fully visible, ~bottom 25% of screen, auto-dismisses ~2 s |
| Three Toasts coexist without race | GAM-01 | Multi-toast layering | Trigger swipe-undo (Phase 18) + journal-saved (Phase 21) + task-done (Phase 22) in quick succession — each renders independently; mount-order layering OK |
| Sun/outdoor TOGGLE: no haptic on undo | GAM-02 | Toggle direction is runtime behavior | Tap an already-done sun chip to undo; NO haptic + NO toast fires |
| GAM-05 anti-pattern enforced in real app | GAM-05 | Visual check across all screens | Scroll Today, Plantas, Calendar, Explore, Settings; verify NO "N-day streak", reset counter, or consecutive-day badge visible anywhere |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (smoke runner + npm script + 1 i18n key EN+ES)
- [ ] No watch-mode flags
- [ ] Feedback latency < 18 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
