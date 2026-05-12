---
phase: 13-gesture-bottom-sheet-infrastructure
plan: 02
subsystem: infra
tags: [skeleton, reanimated-v4, expo-haptics, gorhom-bottom-sheet, useDismissOnPaywall, dev-tools, i18n-parity]

# Dependency graph
requires:
  - phase: 13-00
    provides: smoke-phase13.mjs harness with INFRA-03/04 placeholders pre-wired
  - phase: 13-01
    provides: react-native-reanimated@~4.1.1, @gorhom/bottom-sheet@^5.2.13, expo-haptics@~15.0.8 deps + App-root GestureHandlerRootView + BottomSheetModalProvider wrap
provides:
  - "src/components/Skeleton.tsx — UI-thread Reanimated v4 shimmer primitive (~53 LOC)"
  - "src/utils/haptics.ts — type-safe expo-haptics wrapper with 7-kind union + fire-and-forget pattern (~50 LOC)"
  - "src/hooks/useDismissOnPaywall.ts — close-then-trigger contract for sheet/paywall Z-order coexistence (~22 LOC)"
  - "SettingsScreen __DEV__ block: Test bottom sheet TouchableOpacity + Skeleton shimmer demo + screen-level <BottomSheetModal> (sibling of ScrollView)"
  - "4 new dev-tool i18n keys per locale (en + es parity): devTestBottomSheet, devTestBottomSheetContent, devTestBottomSheetClose, devSkeletonDemo"
  - "All 7 INFRA-03/04 smoke placeholders flipped SKIP → PASS"
affects: [13-03 (manual device verification target — sheet gestures, skeleton shimmer animation, paywall Z-order), 14 (educational modal — first useDismissOnPaywall consumer), 18 (swipe + impactMedium haptic), 21 (journal quick-add sheet — second useDismissOnPaywall consumer), 22 (task-done success haptic)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UI-thread Reanimated v4 shimmer: useSharedValue + withRepeat(withTiming(...), -1, false) + useAnimatedStyle for translateX-driven LinearGradient sweep"
    - "Fire-and-forget service pattern (mirrors Phase 12 unknownPlantTracker.ts): sync void return, internal try/catch, console.warn in __DEV__, swallow in production"
    - "useDismissOnPaywall hook: useEffect dependency on [isPaywallVisible, sheetRef] + sheetRef.current?.dismiss() — null-safe ref access for race-condition protection"
    - "BottomSheetModal placement OUTSIDE ScrollView (sibling of), not inside — gorhom's portal logic requires stable parent for BottomSheetModalProvider portal target"
    - "Stable import paths locked NOW for unused primitives — Phase 14/18/21/22 callers opt in via single import without API renegotiation"

key-files:
  created:
    - "src/components/Skeleton.tsx (53 LOC) — Skeleton({width, height, borderRadius?}) primitive component using react-native-reanimated v4 + expo-linear-gradient"
    - "src/utils/haptics.ts (50 LOC) — triggerHaptic(kind: HapticKind): void wrapper around expo-haptics; HapticKind union covers 7 values (impactLight/Medium/Heavy + success/warning/error + selection)"
    - "src/hooks/useDismissOnPaywall.ts (22 LOC) — useDismissOnPaywall(sheetRef: RefObject<BottomSheetModal | null>): void hook subscribing to usePremium().isPaywallVisible"
  modified:
    - "src/screens/SettingsScreen.tsx (+33 lines) — 3 new imports (useRef/useCallback merged into existing React import; BottomSheetModal/BottomSheetView; Skeleton); testSheetRef + openTestSheet/closeTestSheet handlers; new TouchableOpacity entry + Skeleton demo row inside __DEV__ block; __DEV__-gated <BottomSheetModal> at screen-component level (sibling of ScrollView)"
    - "src/i18n/locales/en/common.json (+4 lines) — devTestBottomSheet, devTestBottomSheetContent, devTestBottomSheetClose, devSkeletonDemo keys under settings.* namespace"
    - "src/i18n/locales/es/common.json (+4 lines) — same 4 keys with es-AR voseo translations (locale parity preserved at 78 settings.* keys each)"

key-decisions:
  - "Skeleton has NO variants exported — no SkeletonText, SkeletonCard, SkeletonImage. YAGNI lock from CONTEXT.md §Skeleton component. Phase 14/21 will add what they actually need."
  - "translateX shimmer uses fixed 200px sweep range (x.value * 200) — no measured-width threading. UX is identical and code is simpler. Phase 14 can override if a wider component reveals stutter."
  - "triggerHaptic returns void synchronously — Haptics.*Async promises explicitly discarded, no await/then. Mirrors Phase 12 unknownPlantTracker.ts silent fire-and-forget pattern."
  - "useDismissOnPaywall ships unused in Phase 13 — no callers. Phase 14 (educational modal) and Phase 21 (journal quick-add) sheet callers will be the first real consumers, opting in via one-line import."
  - "BottomSheetModal placed as SIBLING of ScrollView (not inside) at screen-component level — gorhom's portal-based modal needs a stable parent so it can portal to the App-root BottomSheetModalProvider correctly."
  - "Added a 4th dev-tool key settings.devTestBottomSheetClose instead of reusing a non-existent common.close — see deviations below."

patterns-established:
  - "When the action block prescribes verbatim concrete content that conflicts with line-count ACs, the concrete content wins — the AC is a soft estimate, the locked content is the source of truth."
  - "Always verify i18n key paths exist at the expected namespace BEFORE assuming reuse — the plan claimed `common.close` was at lines 632 + 743 of common.json but those keys were actually scoped to diagnosis.* and plantDetailModal.* (no top-level common namespace exists in this project)."

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: ~6 min
completed: 2026-05-04
---

# Phase 13 Plan 02: Consumer Primitives + Dev-Tools Test Sheet Summary

**Shipped 3 new files (Skeleton primitive + triggerHaptic wrapper + useDismissOnPaywall hook), wired a `__DEV__`-only BottomSheetModal + Skeleton shimmer demo into SettingsScreen as the manual-verification surface for Plan 13-03, and added 4 new dev-tool i18n keys with locale parity. Smoke runner reports `PASS 22/22` (0 skipped). INFRA-03 + INFRA-04 closed; Phase 14/18/21/22 callers can now opt in via stable import paths.**

## Performance

- **Duration:** ~6 min for the three task commits (`885a734` Skeleton+haptics, `e69f410` hook+i18n, `049fb25` SettingsScreen)
- **Started:** 2026-05-04T03:03:54Z
- **Completed:** 2026-05-04T03:50:28Z (full elapsed; code commits done by ~03:30)
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 3

## Accomplishments

- `src/components/Skeleton.tsx` ships the 53-LOC UI-thread Reanimated v4 shimmer primitive with locked API surface `{width: number | string, height: number, borderRadius?: number}`. Theme-driven (colors.bgPrimary base, colors.border highlight) — no variants exported, YAGNI lock preserved.
- `src/utils/haptics.ts` exports `HapticKind` union (7 values) + `triggerHaptic(kind: HapticKind): void` with fire-and-forget + silent-error pattern. All 3 `Haptics.impactAsync` + 3 `Haptics.notificationAsync` + 1 `Haptics.selectionAsync` calls are exhaustive on the kind switch.
- `src/hooks/useDismissOnPaywall.ts` subscribes to `usePremium().isPaywallVisible` via useEffect and calls `sheetRef.current?.dismiss()` when paywall opens. Implements the close-then-trigger contract from Phase 9 PaywallContext (CRIT-1 lock).
- SettingsScreen `__DEV__` block gains a "Test bottom sheet" TouchableOpacity entry (between Load v0 fixture and Reset App, so the destructive button stays at the bottom) + a Skeleton shimmer demo row.
- A `__DEV__`-gated `<BottomSheetModal>` lands at the screen-component level (sibling of ScrollView, NOT inside it) with `snapPoints={['25%']}`, body text from `settings.devTestBottomSheetContent`, and a close button.
- 4 new dev-tool keys in BOTH `src/i18n/locales/en/common.json` and `src/i18n/locales/es/common.json` under `settings.*` namespace with locale parity (78 keys each).
- `npx tsc --noEmit` exits 0.
- `npm run check:i18n-keys` PASS — 64 catalog ids verified across en/es plants.json.
- `node scripts/smoke-phase13.mjs` exits 0 with final report `PASS 22/22` — all 7 INFRA-03/04 placeholders flipped from SKIP to PASS, no skips remaining.
- Phase 10 SEC-01 grep guard preserved: `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` returns count 0 on every line.

## Task Commits

1. **Task 1: Create Skeleton primitive (INFRA-03) + haptics utility wrapper (Phase 13 ships unused)** — `885a734` (feat)
2. **Task 2: Create useDismissOnPaywall hook + i18n keys (INFRA-04 close-then-trigger contract + locale parity)** — `e69f410` (feat)
3. **Task 3: Add __DEV__ test BottomSheetModal + Skeleton demo to SettingsScreen (INFRA-03/04 verification surface)** — `049fb25` (feat)

**Plan metadata:** _(separate final commit captures SUMMARY + STATE + ROADMAP)_

## Files Created

- `src/components/Skeleton.tsx` (53 LOC) — Skeleton component
- `src/utils/haptics.ts` (50 LOC) — triggerHaptic + HapticKind type
- `src/hooks/useDismissOnPaywall.ts` (22 LOC) — useDismissOnPaywall hook

## Files Modified

- `src/screens/SettingsScreen.tsx` (+33 lines) — imports, ref + handlers, __DEV__ block additions, screen-level BottomSheetModal sibling
- `src/i18n/locales/en/common.json` (+4 lines)
- `src/i18n/locales/es/common.json` (+4 lines)

## i18n Keys Added (per locale, exact key:value pairs)

**en/common.json** under `settings.*`:
```json
"devTestBottomSheet": "Test bottom sheet",
"devTestBottomSheetContent": "Phase 13 infrastructure check — gestures, sheet, haptics wired.",
"devTestBottomSheetClose": "Close",
"devSkeletonDemo": "Skeleton shimmer",
```

**es/common.json** under `settings.*`:
```json
"devTestBottomSheet": "Probar hoja inferior",
"devTestBottomSheetContent": "Verificación de infraestructura Fase 13 — gestos, hoja y haptics conectados.",
"devTestBottomSheetClose": "Cerrar",
"devSkeletonDemo": "Brillo de skeleton",
```

Locale parity preserved at **78 settings.* keys** in each locale file (74 pre-existing + 4 new).

## SettingsScreen Diff (high-level)

**Imports (top of file, lines 1-19):**
- React import line gains `useRef, useCallback`.
- Adds `import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';` adjacent to existing Expo imports.
- Adds `import { Skeleton } from '../components/Skeleton';` after the Phase 12 `unknownPlantTracker` import.

**Component body (around line 76, after existing useState hooks):**
```tsx
// Phase 13 INFRA-04 — dev-only test bottom sheet (regression check + manual verification surface)
const testSheetRef = useRef<BottomSheetModal>(null);
const openTestSheet = useCallback(() => { testSheetRef.current?.present(); }, []);
const closeTestSheet = useCallback(() => { testSheetRef.current?.dismiss(); }, []);
```

**__DEV__ block (around line 510, between Load v0 fixture and Reset App):**
```tsx
<TouchableOpacity style={styles.devButton} onPress={openTestSheet}>
  <Text style={styles.devButtonText}>{t('settings.devTestBottomSheet')}</Text>
</TouchableOpacity>

<View style={{ marginTop: spacing.md }}>
  <Text style={[styles.devButtonText, { marginBottom: spacing.xs }]}>
    {t('settings.devSkeletonDemo')}
  </Text>
  <Skeleton width="100%" height={20} />
</View>
```

**Screen-level BottomSheetModal (around line 555, sibling of ScrollView, before closing SafeAreaView):**
```tsx
{__DEV__ && (
  <BottomSheetModal ref={testSheetRef} snapPoints={['25%']}>
    <BottomSheetView style={{ flex: 1, padding: spacing.lg }}>
      <Text style={styles.sectionTitle}>{t('settings.devTestBottomSheet')}</Text>
      <Text style={[styles.sectionDescription, { marginVertical: spacing.md }]}>
        {t('settings.devTestBottomSheetContent')}
      </Text>
      <TouchableOpacity style={styles.devButton} onPress={closeTestSheet}>
        <Text style={styles.devButtonText}>{t('settings.devTestBottomSheetClose')}</Text>
      </TouchableOpacity>
    </BottomSheetView>
  </BottomSheetModal>
)}
```

All existing dev-tool entries (togglePremium Switch, Show Paywall, Unknown plants report, Load v0 fixture, Reset App) are functionally and stylistically unchanged.

## Smoke Runner Outcome

After Plan 13-01: `PASS 15/15 (+7 skipped)`. After this plan:

- **PASS 22/22** — flipped 7 placeholders from SKIP to PASS:
  - 2 INFRA-03 Skeleton placeholders (skeleton-export, skeleton-impl)
  - 2 INFRA-03 haptics placeholders (haptics-exports, haptics-kinds)
  - 1 INFRA-03 dismiss-hook placeholder
  - 1 INFRA-03/04 settings-test-sheet placeholder
  - 1 INFRA-03/04 i18n-parity placeholder
- **0 skips remaining** — every Plan 13-01/02 placeholder is now a real PASS.

## Decisions Made

1. **No Skeleton variants exported.** YAGNI lock from CONTEXT.md §Skeleton component. Phase 14/21 callers will add SkeletonText/SkeletonCard/SkeletonImage variants only when a real consumer needs them. Today's surface is the minimum to verify the shimmer pipeline works.

2. **Fixed 200px translateX sweep range — no measured-width threading.** `useSharedValue(-1)` → `withTiming(1, ...)` → `translateX: x.value * 200` translates -200px to +200px. Sufficient for typical card-row width sweeps. Phase 14 can override if a wider component reveals stutter; today this keeps the primitive minimal.

3. **triggerHaptic returns void synchronously.** Haptics.*Async promises explicitly discarded — no await, no `.then()`. Mirrors Phase 12 `unknownPlantTracker.ts` silent fire-and-forget pattern. The `try/catch` shields callers from native-bridge failures (older Android devices may lack haptic engines, web has no haptics).

4. **useDismissOnPaywall ships unused in Phase 13.** Phase 14 (educational modal) + Phase 21 (journal quick-add) will be the first consumers. Locking the API surface NOW (single-arg `RefObject<BottomSheetModal | null>`, void return, idempotent useEffect) means downstream phases opt in via one-line import without API renegotiation.

5. **BottomSheetModal at screen-component level, NOT inside ScrollView.** Gorhom's portal-based modal needs a stable parent to portal to the App-root BottomSheetModalProvider. Inside ScrollView would break portaling. Siblings-of-ScrollView pattern is the canonical gorhom v5 placement.

6. **Skeleton.tsx slightly exceeds 50-line AC (53 lines).** The plan's `<action>` block prescribed verbatim concrete content that produces 53 lines — locked content wins over the soft 50-line estimate AC. Same logic applies to haptics.ts (50 lines, hits the AC ceiling exactly).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `settings.devTestBottomSheetClose` key instead of reusing non-existent `common.close`**

- **Found during:** Task 3 (verifying the close button i18n key)
- **Issue:** The plan's `<action>` block (CHANGE 4) and `<read_first>` notes claimed:
  > "the close button reuses existing `common.close` (already at lines 632 + 743 of both locale files; matches "Close"/"Cerrar"). DRY."
  >
  > "Decision: reuse `common.close` for the close button (already exists in both locales) — saves 1 i18n key per locale, matches existing patterns."
  
  However, `grep -n '"close"' src/i18n/locales/en/common.json` shows the keys exist at:
  - Line 635: inside the `diagnosis` namespace (i.e., `diagnosis.close`)
  - Line 746: inside the `plantDetailModal` namespace (i.e., `plantDetailModal.close`)
  
  There is NO top-level `common.*` namespace in `common.json` — the file's top-level keys are `tabs`, `migration`, `header`, `seasons`, `days`, `months`, etc. Calling `t('common.close')` would have produced an i18n fallback warning at runtime (key not found) and rendered the literal string `"common.close"` as the button label.
- **Fix:** Added a 4th dev-tool key `settings.devTestBottomSheetClose` ("Close" / "Cerrar") in BOTH locale files under the existing `settings.*` namespace. SettingsScreen now references `t('settings.devTestBottomSheetClose')`.
- **Files modified:** `src/i18n/locales/en/common.json` (+1 line), `src/i18n/locales/es/common.json` (+1 line), `src/screens/SettingsScreen.tsx` (1 line — `t('common.close')` → `t('settings.devTestBottomSheetClose')`)
- **Verification:** locale parity preserved at 78 `settings.*` keys each (74 pre-existing + 4 new instead of the plan-predicted +3); `npm run check:i18n-keys` PASS; smoke runner PASS 22/22.
- **Committed in:** `049fb25` (Task 3 commit, applied before commit)

### No other deviations

The three task commits faithfully implement the plan's `<action>` blocks. Skeleton.tsx is verbatim from the action block (53 lines instead of plan-predicted ~30, but the concrete content matches exactly). haptics.ts is verbatim. useDismissOnPaywall.ts is verbatim. SettingsScreen edits follow the prescribed positions exactly (after Load v0 fixture, before Reset App; sibling of ScrollView for the modal).

## Issues Encountered

1. **Plan claim about `common.close` key path was incorrect.** Documented above as Rule 3 deviation. Worth flagging in CLAUDE.md or PROJECT.md if a Phase 24 (DOCS) pass cleans up i18n key conventions — there is no top-level `common.*` namespace in this project, despite the file being named `common.json`.

## User Setup Required

None — pure code changes. No external services, no credentials, no remote config. Phase 13 still ships ~50% native primitives ready for downstream consumption; Plan 13-03 (manual device checkpoint) is where iOS + Android dev clients will be rebuilt and the gesture/sheet/haptic surfaces verified on real hardware.

## Next Phase Readiness

- **Plan 13-03 (manual device checkpoint) ready:**
  - On iOS dev client AND Android dev client: open SettingsScreen → __DEV__ section → tap "Test bottom sheet" → verify sheet opens with gesture, swipe-down dismisses cleanly, snap-point at 25% renders correctly.
  - With test sheet open, tap "Show Paywall" → verify expected behavior per CONTEXT.md §"PaywallModal Z-order coexistence" — paywall renders on top via native Modal (always wins Z-order); sheet may stay mounted in memory until user dismisses, which is acceptable. NOTE: SettingsScreen does NOT currently call `useDismissOnPaywall(testSheetRef)` because Phase 13 ships the hook unused — Plan 13-03 verifies the BASE behavior (paywall-on-top with sheet mounted), and Phase 14/21 will be the first to wire `useDismissOnPaywall` for the close-then-trigger contract.
  - Observe Skeleton shimmer animating smoothly (UI thread, not stuttering) on both platforms — gradient sweeps left-to-right every 1200ms infinitely.
- **Phase 14 (EDU — educational modal) unblocked:**
  - First consumer of `useDismissOnPaywall(sheetRef)` for the close-then-trigger contract.
  - Can import `Skeleton` for inline loading states.
  - Can import `triggerHaptic('impactLight')` for long-press feedback.
- **Phase 18 (PlantCard refactor) unblocked:**
  - Can import `triggerHaptic('impactMedium')` for swipe gestures.
  - Can use `Skeleton` for plant card loading skeletons.
- **Phase 21 (Journal quick-add) unblocked:**
  - Second consumer of `useDismissOnPaywall(sheetRef)` for the journal sheet's close-then-trigger contract.
- **Phase 22 (Task-done celebration) unblocked:**
  - Can import `triggerHaptic('success')` for task-done haptic.
- **Phase 10 SEC-01 grep guard preserved:** `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` returns count 0 on every line. Plan 13-02 did not touch any client-bundle env paths.
- **Active bug-watch unchanged:** `@gorhom/bottom-sheet` v5.2.13 + Expo SDK 54 device bug-watch from STATE.md remains in place. The compile path is clean (`npx tsc --noEmit` PASS); device verification happens in Plan 13-03.

## Carry-forward to Plan 13-03 + Phase 24 (DOCS)

- **Phase 24 (DOCS):** The smoke-runner count assertion (`c === 3` for provider-count placeholders, locked in Plan 13-00 SUMMARY) is an established pattern. CLAUDE.md / PROJECT.md may want a Key Decisions row update during Phase 24 to reflect the actual grep semantics. Also: there is no top-level `common.*` namespace in `src/i18n/locales/{en,es}/common.json` despite the file name — this is worth documenting as a project convention so future plans don't repeat the Plan 13-02 deviation.
- **Plan 13-03 manual checkpoint:** has 3 verification surfaces from this plan:
  1. Test bottom sheet opens via TouchableOpacity tap → BottomSheetModal.present() → 25% snap point.
  2. Test bottom sheet dismissable via close button (TouchableOpacity → BottomSheetModal.dismiss()) AND swipe-down gesture (gorhom default behavior with App-root GestureHandlerRootView).
  3. Skeleton shimmer animates smoothly on UI thread (Reanimated v4 worklet).

---
*Phase: 13-gesture-bottom-sheet-infrastructure*
*Completed: 2026-05-04*

## Self-Check: PASSED

Verification (run after SUMMARY.md write):

- `src/components/Skeleton.tsx` exists: FOUND
- `src/utils/haptics.ts` exists: FOUND
- `src/hooks/useDismissOnPaywall.ts` exists: FOUND
- `.planning/phases/13-gesture-bottom-sheet-infrastructure/13-02-SUMMARY.md` exists: FOUND
- Commit `885a734` (Task 1: Skeleton + haptics) in git log: FOUND
- Commit `e69f410` (Task 2: hook + i18n) in git log: FOUND
- Commit `049fb25` (Task 3: SettingsScreen) in git log: FOUND
- `node scripts/smoke-phase13.mjs` exit code: 0
- Final report: `[smoke-phase13] PASS 22/22` (no skips remaining — every Plan 13-01/02 placeholder flipped to PASS)
- `npx tsc --noEmit` exit code: 0
- `npm run check:i18n-keys` exit code: 0 (PASS — 64 catalog ids verified)
- Locale parity for `settings.*`: 78 keys identical across en/es
- SEC-01 grep guard: 0 hits (count 0 on every line)
