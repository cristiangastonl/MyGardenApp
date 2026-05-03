---
phase: 13
slug: gesture-bottom-sheet-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Project smoke-runner pattern (`scripts/smoke-phaseNN.mjs` executed via `node`). No general test framework configured (per CLAUDE.md). |
| **Config file** | none — Wave 0 installs `scripts/smoke-phase13.mjs` |
| **Quick run command** | `node scripts/smoke-phase13.mjs` |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase13.mjs && npm run check:i18n-keys` |
| **Estimated runtime** | ~10 seconds (file-content asserts only; pure config phase) |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/smoke-phase13.mjs`
- **After every plan wave:** Run `npx tsc --noEmit && node scripts/smoke-phase13.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green AND manual checkpoint replied "verified"
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-00-01 | 00 | 0 | INFRA-01/02/03/04 | smoke scaffold | `node scripts/smoke-phase13.mjs` | ❌ W0 (created here) | ⬜ pending |
| 13-01-01 | 01 | 1 | INFRA-01 | file-content assert | `node scripts/smoke-phase13.mjs` (deps in package.json) | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | INFRA-02 | grep assert | `node scripts/smoke-phase13.mjs` (App.tsx contains 2× BottomSheetModalProvider, 2× GestureHandlerRootView) | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | INFRA-02 | conditional file assert | `node scripts/smoke-phase13.mjs` (babel.config.js absent OR uses worklets/plugin) | ✅ | ⬜ pending |
| 13-02-01 | 02 | 2 | INFRA-03 | file-content assert | `node scripts/smoke-phase13.mjs` (Skeleton.tsx exports `Skeleton`) | ✅ | ⬜ pending |
| 13-02-02 | 02 | 2 | INFRA-03 | file-content assert | `node scripts/smoke-phase13.mjs` (haptics.ts exports `triggerHaptic` + `HapticKind`) | ✅ | ⬜ pending |
| 13-02-03 | 02 | 2 | INFRA-04 | file-content assert | `node scripts/smoke-phase13.mjs` (useDismissOnPaywall.ts exports `useDismissOnPaywall`) | ✅ | ⬜ pending |
| 13-02-04 | 02 | 2 | INFRA-03/04 | grep assert | `node scripts/smoke-phase13.mjs` (SettingsScreen.tsx has __DEV__ test sheet + Skeleton demo) | ✅ | ⬜ pending |
| 13-03-01 | 03 | 3 | INFRA-04 | manual checkpoint | (autonomous: false) — see Manual-Only Verifications | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase13.mjs` — smoke runner with stub PASS/SKIP entries for each Plan 13-01/02 deliverable, flipping to assertion as plans land. Initial wave-0 state: all Plan 13-01/02 assertions stubbed as SKIP with TODO; INFRA-01/02 base assertions (4 deps absent, App.tsx provider count = 0) flagged as expected-fail until Plan 13-01 lands.
- [ ] `.gitignore` review — no new tmp dir needed (Phase 13 is config-only, no transpileModule artifacts).

*No framework install needed — existing `node` + smoke-runner pattern covers Phase 13.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App boots without crash on iOS dev client after install | INFRA-01, INFRA-04 | Native rebuild required; cannot be asserted from JS smoke | `npx expo run:ios` after install + provider wire; verify no red box, no "TurboModule not found" error |
| App boots without crash on Android dev client after install | INFRA-01, INFRA-04 | Native rebuild required; cannot be asserted from JS smoke | `npx expo run:android` after install + provider wire; verify no red box |
| Test bottom sheet opens, gesture-dismisses cleanly | INFRA-04 | Gesture interaction; no headless harness | SettingsScreen → __DEV__ → tap "Test bottom sheet" → swipe down → verify dismiss |
| Bottom sheet dismisses when PaywallModal opens (no Z-order glitch) | INFRA-04 | Cross-modal interaction on real device | Open test sheet → trigger paywall → verify sheet closes, paywall renders unobstructed on iOS AND Android |
| Skeleton shimmer animates on real hardware (UI thread, not jank) | INFRA-03 | UI-thread worklet; simulator may differ from device | SettingsScreen → __DEV__ → observe Skeleton row shimmering smoothly (not stuttering) on iOS AND Android dev clients |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`scripts/smoke-phase13.mjs`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
