---
phase: 18
slug: plantcard-cleanup-mood-emoji
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-08
updated: 2026-05-08
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
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/smoke-phase18.cjs && npm run smoke:phase17` |
| **Estimated runtime** | ~15s typecheck + ~2s i18n + ~2s phase18 smoke + ~3s phase17 smoke ≈ 22s total |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && node scripts/smoke-phase18.cjs`
- **After every plan wave merge:** Run full suite (typecheck + i18n + phase18 + phase17 cross-phase regression sentinel)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~22 seconds

---

## Per-Task Verification Map

> Filled by gsd-planner from PLAN.md tasks. Status updated by executor as each task commits.

| Task ID | Plan | Wave | Requirement(s) | Test Type | Automated Command | File Exists | Status |
|---------|------|------|----------------|-----------|-------------------|-------------|--------|
| 18-01-T1 | 01 | 1 | (scaffold for all) | smoke | `node scripts/smoke-phase18.cjs && npm run smoke:phase18` | ✅ post-task | ⬜ pending |
| 18-01-T2 | 01 | 1 | (i18n parity) | typecheck + i18n + smoke | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/smoke-phase18.cjs` | ✅ post-task | ⬜ pending |
| 18-02-T1 | 02 | 2 | (Toast primitive) | typecheck + smoke | `npx tsc --noEmit && node scripts/smoke-phase18.cjs` | ✅ post-task | ⬜ pending |
| 18-02-T2 | 02 | 2 | CARD-03 | typecheck + smoke | `npx tsc --noEmit && node scripts/smoke-phase18.cjs` | ✅ post-task | ⬜ pending |
| 18-03-T1 | 03 | 3 | CARD-01,03,GAM-04 (removal pass) | typecheck | `npx tsc --noEmit` | ✅ post-task | ⬜ pending |
| 18-03-T2 | 03 | 3 | CARD-01,02,03,05,GAM-03,04 (additions) | typecheck + smoke | `npx tsc --noEmit && node scripts/smoke-phase18.cjs` | ✅ post-task | ⬜ pending |
| 18-04-T1 | 04 | 4 | CARD-01,02,04 (PlantsScreen) | typecheck + smoke | `npx tsc --noEmit && node scripts/smoke-phase18.cjs` | ✅ post-task | ⬜ pending |
| 18-04-T2 | 04 | 4 | CARD-01,02 (TodayScreen mode parity) | full suite | `npx tsc --noEmit && node scripts/smoke-phase18.cjs && npm run smoke:phase17` | ✅ post-task | ⬜ pending |
| 18-05-T1 | 05 | 5 | (automation gate) | full suite | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/smoke-phase18.cjs && npm run smoke:phase17` | ✅ pre-checkpoint | ⬜ pending |
| 18-05-T2 | 05 | 5 | All — manual device acceptance | manual-only | n/a — `checkpoint:human-verify` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (Plan 01)

- [ ] `scripts/smoke-phase18.cjs` — file-content asserts for CARD-01..05, GAM-03/04 + Toast.tsx existence + i18n key parity
- [ ] `package.json` `smoke:phase18` script entry
- [ ] `.gitignore` reservation of `scripts/.tmp-phase18/`
- [ ] `src/components/Toast.tsx` skeleton (full impl in Plan 02)
- [ ] `src/components/index.ts` re-export of Toast
- [ ] 13 i18n keys landed in BOTH `src/i18n/locales/en/common.json` AND `src/i18n/locales/es/common.json`:
  - `plantCard.menu.{favorite,unfavorite,delete,edit}`
  - `plantCard.menuSheet.{title,cancel}`
  - `plantCard.deleteHint`
  - `plantCard.undoToast.{deletedMessage,undoLabel}`
  - `plantCard.moodA11y.{excellent,good,warning,danger}`

*Smoke script file-content asserts (per RESEARCH.md Validation Architecture + 18-01-PLAN Task 1 spec):*
- CARD-01: PlantCard.tsx contains Gesture.Pan + activeOffsetX([-15, 15]) + failOffsetY([-10, 10]) + GestureDetector; trash 🗑️ + Alert.alert deletion path removed.
- CARD-02: PlantCard.tsx contains Gesture.LongPress + Gesture.Race(longPressGesture, panGesture); PlantsScreen + TodayScreen contain BottomSheetModal + useDismissOnPaywall.
- CARD-03: PlantCard.tsx no longer contains styles.tip render OR favorite-heart 🤍/❤️ block; MyPlantDetailModal contains relocatedTip + 3-rung fallback.
- CARD-04: PlantsScreen contains @plantcard_swipe_discovered + showSwipeHint state.
- CARD-05: PlantCard.tsx contains runOnJS(triggerHaptic)('impactMedium') + hapticFired one-shot guard.
- GAM-03: PlantCard.tsx contains all four mood glyphs (🌱😊😐😟) + moodEmojiByLevel mapping + setShowHealthDetail(true) tap handler.
- GAM-04: PlantCard.tsx import of PlantHealthBadge removed; showHealthBadge gate removed; MyPlantDetailModal STILL contains PlantHealthBadge (modal-side preserved); index.ts STILL re-exports PlantHealthBadge; PlantHealthBadge.tsx file STILL exists.
- Toast: Toast.tsx contains useSharedValue + useAnimatedStyle + accessibilityLiveRegion="polite" + interface ToastProps.

---

## Manual-Only Verifications (Plan 05 Block A-I)

| Behavior | Requirement | Why Manual | Block / Item |
|----------|-------------|------------|--------------|
| Swipe-to-delete UX feel + haptic feedback | CARD-01 + CARD-05 | Requires real device; haptics not testable in JS | Block A items 3-7 + Block B items 8-9 |
| Long-press menu opens BottomSheet | CARD-02 | Requires real device gesture | Block C items 11-15 + Block B item 10 |
| Long-press BottomSheetModal dismisses on paywall (Pitfall 10) | CARD-02 | Requires real PaywallModal trigger | Block C item 16 (SOFT) |
| Mood emoji updates as health score changes | GAM-03 | Requires data state mutation over time | Block D items 17-23 |
| First-render swipe hint + dismissal persistence | CARD-04 | Requires AsyncStorage state across app restarts | Block H items 33-34 |
| Toast positioning above tab bar + FAB (Pitfall 8) | CARD-01 | Requires real device chrome | Block E items 24-25 |
| FlatList row recycling does not leak swipe state (Pitfall 5) | CARD-01 | Requires scrolling many cards | Block F items 26-28 |
| TodayScreen mode parity | CARD-01/02 | Requires switching tabs + real gestures | Block G items 29-32 |
| i18n parity at runtime (EN ↔ ES strings) | (parity) | Requires language switch | Block I items 35-38 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (Plan 05 Task 2 has manual-only echo placeholder per `checkpoint:human-verify` convention)
- [x] Sampling continuity: every plan ends with at least one task running typecheck + smoke
- [x] Wave 0 covers all MISSING references in 18-RESEARCH.md §"Validation Architecture"
- [x] No watch-mode flags
- [x] Feedback latency < 22s (full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** Plan structure validated 2026-05-08 by gsd-planner. Wave 0 (Plan 01) gates full Phase 18 surface; Plans 02-04 flip SKIPs to PASSes; Plan 05 is the manual checkpoint.
