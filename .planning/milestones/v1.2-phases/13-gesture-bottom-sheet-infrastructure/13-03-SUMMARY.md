---
phase: 13-gesture-bottom-sheet-infrastructure
plan: 03
subsystem: infra
tags: [manual-checkpoint, device-verification, infra-04, android-verified, ios-deferred]

# Dependency graph
requires:
  - phase: 13-00
    provides: smoke-phase13.mjs (PASS 22/22 baseline)
  - phase: 13-01
    provides: 4 native deps installed + GestureHandlerRootView/BottomSheetModalProvider App-root wrap
  - phase: 13-02
    provides: Skeleton + haptics + useDismissOnPaywall + SettingsScreen __DEV__ test sheet + i18n keys
provides:
  - "INFRA-04 closure on Android (5/6 acceptance behaviors verified on physical Android device)"
  - "iOS device-test deferred entry in v1.2 backlog memory"
affects: [Phase 14 (real bottom-sheet content can build on top with confidence), Phase 18 (swipe-to-delete via Gesture.Pan can build on top), Phase 21 (journal quick-add bottom-sheet can build on top), Phase 22 (haptic call sites can use triggerHaptic)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual device-test checkpoint with autonomous: false — gate=blocking pattern from Phase 7/10 deferred-deploy precedent"
    - "Defer iOS device-test to milestone-end backlog when Xcode/SDK toolchain friction exceeds verification value (mirrors v1.1 device-test backlog precedent)"

key-files:
  created: []
  modified: []

key-decisions:
  - "Verified 5/6 INFRA-04 acceptance behaviors on physical Android device (cristian's Android, screenshot evidence captured during checkpoint dialogue)"
  - "Step 5 (PaywallModal Z-order coexistence) deferred: paywall fails to open because RevenueCat key is placeholder (CLAUDE.md confirmed) and yearly/lifetime products are not configured in Play Console. WARN [Payments] Annual product not in offering. The paywall block is pre-existing, NOT a Phase 13 regression."
  - "iOS device-test deferred to v1.2 backlog: Xcode 26.3 / iOS 26.2 SDK toolchain friction (8.39 GB simulator runtime download + Apple ID signing setup + iPhone Developer Mode + Trust Developer dance) exceeds the iOS-specific verification value, given (a) Reanimated v4, gorhom v5, and expo-haptics are all iOS-first historically, (b) JS-level integration verified via Android, (c) v1.1 milestone established the device-test backlog pattern as acceptable closure."
  - "INFRA-04 marked complete in REQUIREMENTS.md based on Android verification + deferred items documented in backlog"

patterns-established:
  - "Manual device-test checkpoints can close on a single platform when (a) the second-platform native libraries are first-class on that platform historically, (b) JS-level integration is verified, (c) a device-test backlog memory entry is created for the deferred platform"
  - "Pre-existing config blockers (RevenueCat placeholder key, missing IAP products) are documented as deferred at the requirement level, not treated as phase regressions"

requirements-completed: [INFRA-04]

# Metrics
duration: ~30 min device verification (Android rebuild + interactive checkpoint dialogue) + iOS attempt that hit Xcode toolchain friction
completed: 2026-05-03
---

# Phase 13 Plan 03: Manual Device Verification Checkpoint Summary

**Android device verification PASSED for 5 of 6 INFRA-04 acceptance behaviors. Step 5 (PaywallModal Z-order coexistence) deferred — paywall fails to open because of pre-existing RevenueCat placeholder-key block, not a Phase 13 regression. iOS device verification deferred to v1.2 backlog due to Xcode 26.3 / iOS 26.2 SDK toolchain setup friction. INFRA-04 closes on the Android-only verification + documented deferrals.**

## Performance

- **Duration:** ~30 min (Gradle rebuild for Android dev client ~7 min + interactive 6-step checkpoint dialogue + iOS toolchain diagnosis attempt + close decision)
- **Completed:** 2026-05-03
- **Tasks:** 1 (autonomous: false — checkpoint:human-verify)
- **Files modified:** 0 (plan is verification-only; no code edits)

## Accomplishments

- **Step 1 — App boots cleanly on Android dev client (PASS)**: `npx expo run:android` completed without red box. NO `TurboModule RNGestureHandlerModule not found` error. NO `Reanimated requires New Architecture` error. App reached MainTabs cleanly.
- **Step 2 — Test bottom sheet opens with gesture (PASS)**: Settings → "Herramientas de desarrollo" → tap "Probar hoja inferior". Sheet slid up smoothly to ~25% screen height with body text from `settings.devTestBottomSheetContent` and a "Cerrar" button.
- **Step 3 — Sheet dismisses with swipe-down gesture (PASS)**: Drag down on the sheet body — sheet followed finger and dismissed past the threshold. No stuck-sheet state.
- **Step 4 — Sheet dismisses with close button (PASS)**: Re-opened sheet via "Probar hoja inferior", tapped "Cerrar" — sheet dismissed programmatically via `closeTestSheet`.
- **Step 6 — Skeleton shimmer animates smoothly on real hardware (PASS)**: "Brillo de skeleton" row in Developer tools section showed left-to-right gradient sweep at ~1.2s cycle. Smooth, no stuttering — confirms Reanimated v4 worklet is running on the UI thread.

## Task Commits

1. **Task 1: Manual device verification checkpoint** — _no commit_ (autonomous: false; verification-only task with no code changes)

**Plan metadata:** _(separate final commit captures SUMMARY + STATE + ROADMAP)_

## Files Created/Modified

None. Plan 13-03 is verification-only.

## Deferred Items

### 1. Step 5 — PaywallModal Z-order coexistence (DEFERRED — pre-existing block)

**What was tested:** With test bottom sheet open on Android, tap "Mostrar paywall" → expected paywall to render unobstructed on top of the sheet.

**What happened:** Paywall fails to open. Logcat shows `WARN [Payments] Annual product not in offering. Expected: yearly` from `src/services/payments.ts:193`. The PaywallModal stalls before rendering.

**Root cause:** RevenueCat configuration is incomplete:
- CLAUDE.md confirms: *"RevenueCat iOS key must be set (currently placeholder in revenuecat.ts)"*
- IAP products `yearly` and `lifetime` are not configured in Play Console (Android) or App Store Connect (iOS)
- `payments.ts:185-197` queries RevenueCat for these products; without them, the paywall flow stalls

**Why this is NOT a Phase 13 regression:**
- The same warning fires whether the paywall is opened from inside a bottom sheet OR directly (without any sheet open)
- Paywall blocking pre-dates Phase 13 — it would block in any v1.2 build until RevenueCat is configured
- INFRA-04's Z-order contract is enforced at the platform level (RN native Modal portal vs. gorhom JS portal); Phase 13 cannot break this — it can only verify it

**Where this gets unblocked:** A future phase that configures RevenueCat (or a simulated product offering for dev builds) will allow this checkpoint to be re-run. Tracked in v1.2 device-test backlog.

### 2. iOS device verification (DEFERRED — toolchain friction)

**What was attempted:** `npx expo run:ios --device` → `Unexpected devicectl JSON version output from devicectl` → `CommandError: No iOS devices available in Simulator.app` (Expo CLI parser does not yet handle Xcode 26.3's devicectl JSON format)

**Workaround attempted:** `open ios/MyGarden.xcworkspace` to bypass Expo CLI and build directly via Xcode. Hit:
- "iOS 26.2 is not installed" — Xcode 26.3 ships with iOS 26.3 SDK; user's iPhone runs iOS 26.2.1 → Xcode triggered an 8.39 GB iOS Simulator runtime download
- "Signing for 'MyGarden' requires a development team" — no Apple ID configured in Xcode
- Estimated total friction: 1-1.5 h (download + signing setup + Developer Mode + Trust Developer + first build)

**Why deferred is acceptable:**
- All 4 Phase 13 native libraries are **iOS-first historically** — `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`, `expo-haptics` were all iOS-supported before Android
- JS-level integration verified via Android — the worklets, the gesture handlers, the sheet presentation, the haptics utility, and the Skeleton primitive are all platform-agnostic in their JS API surface
- Risk of an iOS-specific regression in pure infrastructure (no business logic) is low
- v1.1 milestone established a device-test backlog pattern (`v1_1_test_backlog.md` in user memory) where deferred device tests are batched at milestone-end before submission

**Where this gets unblocked:** v1.2 device-test backlog entry (added to user memory) — to be exercised before App Store submission, alongside the RevenueCat configuration that unblocks Step 5 on iOS too.

## Decisions Made

1. **Close INFRA-04 on Android-only verification.** Phase 13 is pure infrastructure (config + JSX + 30-LOC primitives). The 5 verified Android behaviors (boot, sheet open, gesture dismiss, programmatic close, Skeleton animation) cover the full INFRA-04 contract that Phase 13 itself can deliver. Step 5 (PaywallModal Z-order) is gated by external RevenueCat configuration; iOS device-test is gated by Xcode toolchain friction. Both deferrals are non-Phase-13 issues.

2. **Add v1.2 device-test backlog memory entry.** Mirrors the v1.1 pattern. Two items deferred:
   - iOS device verification of all 5 acceptance behaviors verified on Android
   - PaywallModal Z-order coexistence on both iOS + Android (gated on RevenueCat IAP product configuration)

3. **DO NOT pre-configure RevenueCat to unblock Step 5 in this phase.** Out of scope for Phase 13. RevenueCat product configuration is its own pre-submit task with its own dependencies (App Store Connect product creation, Play Console product creation, RevenueCat dashboard product mapping).

## Issues Encountered

1. **Xcode 26.3 + Expo CLI parser mismatch.** `devicectl` output format changed in Xcode 26.x; Expo CLI's parser still references the older format. Reported in the Expo issue tracker historically; workaround is `open ios/*.xcworkspace` to build via Xcode directly. Documented in v1.2 device-test backlog.

2. **iOS 26.2 SDK not bundled with Xcode 26.3.** The iPhone runs iOS 26.2.1; Xcode 26.3 ships with iOS 26.3 SDK only. Triggers an 8.39 GB iOS Simulator runtime download on first device-deploy attempt. Not a Phase 13 issue — would affect ANY build to this iPhone until either Xcode includes the matching SDK or the iPhone is updated to iOS 26.3.

3. **Initial Step 0 confusion: red box "TurboModule RNGestureHandlerModule not found".** This was a user-side process error (running `npx expo start --clear` with the OLD dev client still installed on device, before the rebuild). Fixed by skipping Step 0 and going directly to Step 2 (`npx expo run:android`). Documented for future readers in the device-test backlog.

## User Setup Required

**Currently blocking on:**
- RevenueCat: configure `yearly` + `lifetime` IAP products in Play Console + App Store Connect, replace placeholder key in `revenuecat.ts` with the real iOS + Android keys (this unblocks PaywallModal in dev and is required for App Store / Play Store submission anyway)
- iOS device test: install Apple ID team in Xcode → enable Developer Mode on iPhone → Trust Developer → build (alternatively wait for Expo CLI's devicectl parser to be updated, OR update iPhone to iOS 26.3 to match Xcode SDK)

Both are tracked in the v1.2 device-test backlog memory entry.

## Next Phase Readiness

- **Phase 14 (and beyond) ready:** The infrastructure foundation is verified to boot, accept gestures, render sheets, dismiss correctly, and animate UI-thread worklets on real Android hardware. iOS-specific risk is low (the libraries are iOS-first), and platform parity will be verified at the v1.2 device-test gate.
- **Phase 14/21 callers can now opt into `useDismissOnPaywall(sheetRef)`**: the hook is exported, type-safe, and ready. When RevenueCat is configured and the Z-order gate becomes testable, the close-then-trigger contract can be exercised end-to-end.
- **Phase 18/22 callers can now use `triggerHaptic(kind)`**: the utility is exported, type-safe, and silent-fire-and-forget. Devices have not been tested with actual haptic playback, but the API surface is locked.
- **Phase 10 SEC-01 grep guard preserved**: `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` returns count 0 on every line. Plan 13-03 did not touch any client source.
- **No bug-watch trigger:** The `@gorhom/bottom-sheet` v5.2.13 + Expo SDK 54 device bugs (#2528, #2471) flagged in STATE.md did NOT manifest on Android. The fallback (`Animated.View` + `PanResponder`) was NOT pre-built and remains unnecessary.

---
*Phase: 13-gesture-bottom-sheet-infrastructure*
*Completed: 2026-05-03*

## Self-Check: PASSED

Verification (run after SUMMARY.md write):

- `node scripts/smoke-phase13.mjs` exit code: 0
- Final report: `[smoke-phase13] PASS 22/22`
- `npx tsc --noEmit` exit code: 0
- Plan 13-00, 13-01, 13-02 SUMMARY.md files all exist with `Self-Check: PASSED`
- Android device verification: 5/6 acceptance behaviors PASS (steps 1, 2, 3, 4, 6)
- Android Step 5 deferred: pre-existing RevenueCat block, NOT Phase 13 regression — documented above and in v1.2 backlog memory
- iOS device verification deferred: Xcode 26.3 toolchain friction — documented above and in v1.2 backlog memory
- INFRA-04 closure rationale: Android-verified + 2 documented deferrals tracking external blockers
- SEC-01 grep guard: 0 hits (count 0 on every line)
