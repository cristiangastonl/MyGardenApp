# Phase 13: Gesture + Bottom-Sheet Infrastructure - Research

**Researched:** 2026-05-03
**Domain:** Expo SDK 54 native gesture/animation/haptic foundation + provider hierarchy wiring (React Native 0.81 + New Architecture)
**Confidence:** HIGH

## Summary

Phase 13 is pure infrastructure: install four native packages (`react-native-reanimated@^4`, `react-native-gesture-handler@~2.28`, `@gorhom/bottom-sheet@^5.2.11`, `expo-haptics`), wire `GestureHandlerRootView` + `BottomSheetModalProvider` once at App root, ship a 30-LOC `Skeleton` shimmer primitive plus a `triggerHaptic()` utility wrapper, and verify on iOS + Android dev clients that bottom-sheet gestures coexist with the existing `PaywallModal` native `Modal`. No business logic, no screens, no real bottom-sheet content — those phases (14, 18, 21, 22) build on top of this foundation without a second native rebuild.

The technical decisions are already locked in `13-CONTEXT.md`: install via `npx expo install` only, single root provider wrap (with adjusted INFRA-02 grep semantics: count of 2 = import + JSX usage), `PaywallModal` z-order is enforced natively and bottom sheets dismiss reactively when paywall opens via `useDismissOnPaywall(sheetRef)` hook, `ReanimatedSwipeable` is banned (use `Gesture.Pan()` directly when needed in Phase 18), no Lottie until consumer phase needs it. The remaining research surface area is verification of versions, install order, the Reanimated v4 babel-plugin reality under Expo SDK 54, and the exact gorhom BottomSheetModalProvider/Modal composition pattern.

**Key finding (HIGH confidence):** Reanimated v4 requires the `react-native-worklets/plugin` babel plugin (renamed from `react-native-reanimated/plugin` in v4). However, in Expo SDK 54 with `babel-preset-expo` (default), the plugin is **auto-managed** — no manual `babel.config.js` modification is required unless the project has manually configured a plugin. The MiJardinApp repo currently has **no `babel.config.js` file** (verified by `ls`), meaning it relies entirely on `babel-preset-expo` defaults and no plugin work is needed. CONTEXT.md's instruction to "verify babel.config.js includes react-native-reanimated/plugin as last plugin" should be relaxed to: "verify there is no manually-created babel.config.js with a stale reanimated plugin entry; if one exists, either delete it or update it to use react-native-worklets/plugin."

**Primary recommendation:** Execute the install + provider wrap exactly as CONTEXT.md prescribes, with two corrections: (1) skip the babel.config.js step (none exists; babel-preset-expo handles it) but add a smoke assertion that no stale babel.config.js exists, and (2) use `react-native-worklets/plugin` (not `react-native-reanimated/plugin`) if a babel.config.js is ever introduced.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Package install (INFRA-01):**
- Use `npx expo install`, NEVER `npm install` for all four packages — Expo's resolver pins SDK 54-compatible patch versions (Reanimated v4, RNGH ~2.28, expo-haptics ~14.x).
- Install order (single command groupings):
  1. `npx expo install react-native-reanimated react-native-gesture-handler` — animation foundation + gesture peer dep first.
  2. `npx expo install @gorhom/bottom-sheet` — pin to `^5.2.11`.
  3. `npx expo install expo-haptics` — first-party, zero native config beyond install.
- Reanimated babel plugin: verify `babel.config.js` includes `react-native-reanimated/plugin` as the LAST plugin in the array. If missing, add it. (Adjusted by research: see Standard Stack section — under SDK 54 with babel-preset-expo, this is auto-managed; the CONTEXT.md instruction stands as a safety check, not a required edit, since no babel.config.js exists in the repo today.)
- Metro cache: include a `npx expo start --clear` step in the dev-test plan (one-time cache reset).

**Provider hierarchy (INFRA-02) — Outermost wrapper at App root:**
- `GestureHandlerRootView` AND `BottomSheetModalProvider` wrap the entire `default export App` tree, ABOVE the `Features.AUTH` branch. Both AppContent paths inherit through React context — no duplication required, no drift possible.
- Exact nesting (App.tsx default export):
  ```tsx
  export default function App() {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SafeAreaProvider>
            <StorageProvider>
              <PremiumProvider>
                {Features.AUTH ? <AppContentFull /> : <AppContentMVP />}
              </PremiumProvider>
            </StorageProvider>
          </SafeAreaProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }
  ```
- `PaywallModal` placement unchanged: stays inside each AppContent as today. RN native `Modal` (`transparent`, `animationType="slide"`) renders above ALL JS-portal-based UI including gorhom bottom sheets — Z-order is enforced by the platform, not the JS tree.
- **Success-criterion adjustment for INFRA-02:** original ROADMAP says `grep -c "BottomSheetModalProvider" App.tsx === 2`. With outermost-wrapper decision: count is 1 import statement + 1 JSX usage = 2. Single source of truth covers both AppContent paths via React context.
- Smoke / planner enforcement: planner MUST update success-criterion language. Document the rationale inline.

**PaywallModal Z-order coexistence (INFRA-04):**
- Mutually exclusive at runtime: if `PaywallModal` opens while a bottom sheet is open, the bottom sheet must dismiss first. Mirrors Phase 9 "close-then-trigger" PaywallContext contract.
- Where to enforce: add `useEffect` inside `BottomSheetModalProvider`'s consumers, or a small helper hook `useDismissOnPaywall(sheetRef)` that subscribes to PaywallContext's `isPaywallVisible`. When true, call `sheetRef.current?.dismiss()`. Hook is added in Phase 13 (exported but unused until Phase 14).
- Rationale: native RN Modal renders above JS portal sheets on both iOS and Android. Without dismissal, paywall slides up over a stuck bottom sheet — visually correct but sheet stays mounted in memory.
- Device test: INFRA-04 verification on iOS + Android: open dev-tools test bottom sheet, then trigger PaywallModal → bottom sheet must close cleanly, paywall renders unobstructed.

**Skeleton component (INFRA-03):**
- File: `src/components/Skeleton.tsx` — single primitive, ~30 LOC. Theme-driven (`colors.bgPrimary` base, `colors.border` highlight gradient).
- Props (minimum surface): `width: number | string`, `height: number`, `borderRadius?: number` (default `borderRadius.sm`).
- Implementation: `View` with `expo-linear-gradient` child, animated via Reanimated v4 `useSharedValue` + `withRepeat(withTiming(...), -1)` — horizontal translateX shimmer.
- No pre-built variants in Phase 13 (no `SkeletonText`, `SkeletonCard`).
- Verification: import + render once in SettingsScreen dev-tools section so INFRA-04 device test confirms shimmer animates on real hardware (not just simulator). Remove or keep as permanent dev tool — Claude's discretion.

**Haptics utility wrapper (Phase 13 ships it):**
- File: `src/utils/haptics.ts` — exports `triggerHaptic(kind: HapticKind): void` wrapping `expo-haptics`.
- API surface (locked):
  ```ts
  type HapticKind =
    | 'impactLight' | 'impactMedium' | 'impactHeavy'
    | 'success' | 'warning' | 'error'
    | 'selection';
  export function triggerHaptic(kind: HapticKind): void;
  ```
- Error handling: silent try/catch; in `__DEV__` log a `console.warn('[haptics] ...')`; in production swallow. Mirrors established pattern.
- Fire-and-forget: function returns `void`, internally calls `Haptics.*Async()` and discards the promise (no await).

**Smoke runner (recommended):**
- Add `scripts/smoke-phase13.mjs` modeled after `smoke-phase11.mjs` / `smoke-phase12.mjs`. Coverage:
  1. `package.json` contains all 4 new deps at expected version ranges.
  2. `App.tsx` contains exactly 2 `BottomSheetModalProvider` references (1 import + 1 JSX usage) and exactly 2 `GestureHandlerRootView` references.
  3. `App.tsx` import block contains both packages.
  4. `babel.config.js` includes `react-native-reanimated/plugin` as the LAST plugin (NOTE: research finding: under SDK 54 with babel-preset-expo, no babel.config.js is needed; assertion should be amended to "either no babel.config.js exists OR if it exists, it uses react-native-worklets/plugin as last plugin").
  5. `Skeleton.tsx` exports a function/component named `Skeleton`.
  6. `haptics.ts` exports `triggerHaptic` and the `HapticKind` type.
- No transpileModule import-execution needed — Phase 13 is config + JSX wrapping. File-content asserts via `readFileSync` are sufficient.

### Claude's Discretion

- **Dev-tool test sheet for INFRA-04:** add `__DEV__`-gated `TouchableOpacity` in `SettingsScreen` Dev tools section labeled `t('settings.devTestBottomSheet')`. Tap opens minimal `BottomSheetModal` with one line of text + close button. Acceptable to keep or strip.
- **Manual checkpoint task for INFRA-04:** mirror Phase 7 / Phase 10 deferred-deploy pattern — explicit `autonomous: false` task: "Open the app on iOS dev client AND Android dev client. Tap the dev-tools test bottom sheet. Confirm: sheet opens with gesture, dismisses with swipe-down, no PaywallModal Z-conflict, Skeleton shimmer animates. Reply 'verified' to continue." Executor blocks until user confirms.
- **Bottom-sheet bug fallback:** STATE.md flagged `@gorhom/bottom-sheet` v5.2.11 + Expo SDK 54 device bugs (#2528, #2471). Phase 13 trusts the patches at `^5.2.11`. If device test reveals regression, fallback is custom `Animated.View` + `PanResponder`. Do NOT pre-build the fallback.
- **Skeleton variants deferred:** no `SkeletonText` / `SkeletonCard` / `SkeletonImage` variants. Phase 14/21 will add what they need.

### Deferred Ideas (OUT OF SCOPE)

- **`lottie-react-native`** — not installed in Phase 13. Defer to Phase 22 or Phase 23.
- **`SkeletonText` / `SkeletonCard` / `SkeletonImage` variants** — Phase 14/21 will add.
- **Migrating existing `LoadingScreen` usages to `Skeleton`** — separate refactor; not in Phase 13.
- **Custom `Animated.View` + `PanResponder` bottom-sheet fallback** — only built if INFRA-04 device test reveals unrecoverable regression. Deviation contingency at Phase 14.
- **Pre-built haptic call sites** (PlantCard swipe, task-done toast) — Phase 18 / Phase 22 own these.
- **Real bottom-sheet content** (delete confirm, journal add, fertilization log) — Phase 14 / 18 / 21 / 22 own these.
- **`ReanimatedSwipeable` reconsideration** — banned for v1.2 per STATE.md and PITFALLS.md (iOS crash bug). Use `Gesture.Pan()` directly.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | 4 native dependencies installed via `npx expo install`: `react-native-reanimated@^4`, `react-native-gesture-handler` (compatible v4), `@gorhom/bottom-sheet@^5.1.8`, `expo-haptics` | Standard Stack table provides exact versions + install order; Don't Hand-Roll documents resolver discipline |
| INFRA-02 | `App.tsx` provider hierarchy updated to wrap `StorageProvider` with `GestureHandlerRootView` and add `BottomSheetModalProvider` — present in BOTH `AppContentMVP` and `AppContentFullInner` (Two-AppContent-paths discipline; grep count assertion = 2) | Architecture Pattern 1 shows exact JSX structure (single App-root wrap covers both paths via React context); Code Examples shows verified import + JSX shape; success-criterion adjustment locked in CONTEXT.md (count of 2 = 1 import + 1 JSX usage) |
| INFRA-03 | Custom `Skeleton` component using `expo-linear-gradient` + Reanimated v4 `withRepeat/withTiming` (30 LOC; replaces full-screen `LoadingScreen` for inline loads) | Code Examples provides verified Reanimated v4 shimmer pattern; Don't Hand-Roll explains why ecosystem libraries fail (moti, reanimated-skeleton) |
| INFRA-04 | Verified on iOS + Android device (Expo Go or dev client) that bottom-sheet gestures work without Z-order glitch with App-level `PaywallModal` | Pitfall 3 (Z-order) + Architecture Pattern 2 (`useDismissOnPaywall` hook) + Code Examples (test sheet skeleton); manual checkpoint pattern from Phase 7 / 10 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-reanimated` | `~4.x` (resolved by `npx expo install` under SDK 54) | UI-thread animations for shimmer, swipe, sheet snap | Required by `@gorhom/bottom-sheet` v5; only animation lib that supports Expo SDK 54 New Architecture (v3 is legacy-only). Bundled with SDK 54 via expo install resolver. |
| `react-native-gesture-handler` | `~2.28.x` (resolved by `npx expo install`) | Pan/longPress/tap gestures; peer dep of bottom-sheet | Already a transitive dep of `@react-navigation/bottom-tabs` but must be declared explicitly for direct use. Use `Gesture.Pan()` API; AVOID `ReanimatedSwipeable` (iOS crash with RNGH 2.28 + Reanimated 4.1, issue #3720). |
| `@gorhom/bottom-sheet` | `^5.2.11` (latest stable as of research: 5.2.13, all 5.2.x include Reanimated v4 patches) | Bottom-sheet modal infrastructure | De-facto standard for RN bottom sheets. v5.1.8+ added Reanimated v4 support. v5.2.11 ships patches for #2528 (Expo 54 won't-open). Active patches: 5.2.10 fixed rapid present/close freeze; 5.2.11 rewrote modal status logic; 5.2.13 (Apr 30) restored React mount reset after unmount. |
| `expo-haptics` | `~15.x` (resolved by `npx expo install`) | Tactile feedback wrapping iOS Core Haptics + Android Vibration | First-party Expo package. Zero native config beyond install. `Haptics.impactAsync` / `Haptics.notificationAsync` / `Haptics.selectionAsync` cover all use cases. Don't use `react-native-haptic-feedback` (community redundant package). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-linear-gradient` | `~15.0.8` (already installed) | Skeleton shimmer gradient layer | Reuse for Skeleton component; zero new deps for the gradient itself. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@gorhom/bottom-sheet` | Custom `Animated.View` + `PanResponder` | Use as deviation fallback ONLY if INFRA-04 device test fails. Covers limited 2-3 action-sheet cases but loses gesture polish, snap points, scroll-within-sheet, and ergonomic API. Do NOT pre-build. |
| Custom Skeleton | `moti`, `react-native-reanimated-skeleton`, `react-native-skeleton-content` | All ecosystem libraries fail under Reanimated v4 + SDK 54: moti issue #391 unresolved, reanimated-skeleton targets v3 explicitly, skeleton-content unmaintained since 2022. Custom 30-LOC primitive is HIGH confidence. |
| `expo-haptics` | `react-native-haptic-feedback` | Redundant with first-party expo-haptics; community package adds maintenance risk for zero capability gain. |
| Reanimated v4 | Reanimated v3 | v3 is legacy-architecture only; SDK 54 ships New Architecture by default (`newArchEnabled: true` confirmed in `app.json`). v3 is non-viable. |
| `ReanimatedSwipeable` | `Gesture.Pan()` API direct | iOS crash bug (RNGH issue #3720, Sept 2025, status closed but workaround unclear). Phase 18 swipe-to-delete uses `Gesture.Pan()` — avoid `ReanimatedSwipeable` entirely. |

**Installation:**
```bash
# Step 1: Animation foundation + gesture peer dep
npx expo install react-native-reanimated react-native-gesture-handler

# Step 2: Bottom sheet (depends on above)
npx expo install @gorhom/bottom-sheet

# Step 3: Haptics (independent)
npx expo install expo-haptics

# Step 4: Clear Metro cache once
npx expo start --clear
```

**Critical: never use `npm install` directly for these.** Expo's resolver pins SDK 54-compatible patches; raw npm install is the root cause of most reported SDK 54 + Reanimated v4 breakage in the wild.

## Architecture Patterns

### Recommended Project Structure (Phase 13 additions)
```
src/
├── components/
│   └── Skeleton.tsx               # NEW: ~30 LOC primitive
├── utils/
│   └── haptics.ts                 # NEW: triggerHaptic + HapticKind
├── hooks/
│   └── useDismissOnPaywall.ts     # NEW: subscribes to isPaywallVisible
└── screens/
    └── SettingsScreen.tsx         # MODIFIED: add __DEV__ test sheet
scripts/
└── smoke-phase13.mjs              # NEW: file-content asserts only
App.tsx                            # MODIFIED: wrap with 2 providers
```

### Pattern 1: Single-source-of-truth provider wrap at App root

**What:** Place `GestureHandlerRootView` + `BottomSheetModalProvider` ONCE at the outermost layer of the `default export App` function — above the `Features.AUTH` branch. Both `AppContentMVP` and `AppContentFull` inherit the gesture/sheet context via React context propagation.

**When to use:** This is the locked architectural decision for Phase 13. Rationale: BottomSheet/Gesture providers are stateless context, unlike `<PaywallModal />` which is a stateful render-once component. Stateful modals must follow Two-AppContent-paths discipline (CRIT-4); stateless context providers are cleaner at App root.

**Example:**
```tsx
// App.tsx — verified pattern (CONTEXT.md lock)
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <StorageProvider>
            <PremiumProvider>
              {Features.AUTH ? <AppContentFull /> : <AppContentMVP />}
            </PremiumProvider>
          </StorageProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

**Grep semantics for INFRA-02:** `grep -c "BottomSheetModalProvider" App.tsx === 2` — counts the import statement (line ~) + a single JSX usage at App root. Same for `GestureHandlerRootView`. Smoke runner asserts this shape.

### Pattern 2: useDismissOnPaywall hook — close-then-trigger contract

**What:** A small consumer hook that subscribes to `usePremium().isPaywallVisible` and calls `sheetRef.current?.dismiss()` whenever the paywall opens. Phase 13 ships the hook unused; Phase 14/21 sheet callers opt in via one import.

**When to use:** Any consumer that holds a `BottomSheetModalRef` AND lives in a screen that may trigger a premium gate. Mirrors the Phase 9 PaywallContext close-then-trigger pattern.

**Example:**
```tsx
// src/hooks/useDismissOnPaywall.ts
import { useEffect, RefObject } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { usePremium } from './usePremium';

export function useDismissOnPaywall(sheetRef: RefObject<BottomSheetModal | null>) {
  const { isPaywallVisible } = usePremium();
  useEffect(() => {
    if (isPaywallVisible) {
      sheetRef.current?.dismiss();
    }
  }, [isPaywallVisible, sheetRef]);
}
```

### Pattern 3: Reanimated v4 shimmer (UI-thread worklet)

**What:** A horizontally-translating gradient strip animated by `useSharedValue` + `withRepeat(withTiming(...), -1)`. Runs on the UI thread (not JS) so it doesn't jank on slow JS thread.

**When to use:** Skeleton placeholders for cards, sections, or images while async data loads. NOT for full-screen loading (that's `LoadingScreen`, unchanged).

**Example:**
```tsx
// src/components/Skeleton.tsx — verified Reanimated v4 pattern
import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius as r } from '../theme';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
}

export function Skeleton({ width, height, borderRadius = r.sm }: Props) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [x]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 200 }], // pixel sweep across ~200px
  }));

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: colors.bgPrimary,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <LinearGradient
          colors={['transparent', colors.border, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
```

### Anti-Patterns to Avoid

- **Adding `BottomSheetModalProvider` separately to `AppContentMVP` and `AppContentFull`.** Avoid. The locked architectural choice is a single App-root wrap. Two-AppContent-paths discipline applies to `<PaywallModal />` (stateful) but NOT to stateless context providers (BottomSheet/Gesture).
- **`ReanimatedSwipeable` for swipe-to-delete.** Banned. iOS crash bug (RNGH issue #3720). Use `Gesture.Pan()` directly in Phase 18.
- **`TextInput` (standard RN) inside a `BottomSheetView`.** iOS keyboard fights the sheet. Use `BottomSheetTextInput` from `@gorhom/bottom-sheet` when a sheet content includes input fields (Phase 21 journal quick-add will need this).
- **`KeyboardAvoidingView` inside a bottom sheet.** Conflicts with the sheet's internal keyboard handling. Use sheet props `keyboardBehavior="extend"` and `keyboardBlurBehavior="restore"` instead.
- **`expo-haptics` `await` calls in render or event handlers.** Fire-and-forget only. Wrap in `triggerHaptic(kind)` utility — discards the promise, swallows errors silently.
- **Adding the new providers BELOW `<NavigationContainer>` or inside individual screens.** Providers must be at App root for context to reach all consumers; navigation-scoped providers cause "no provider found" runtime errors when sheets are presented from nested screens.
- **Manual `babel.config.js` with `react-native-reanimated/plugin`.** Under Expo SDK 54, `babel-preset-expo` auto-includes the plugin. Adding it manually causes a conflict warning and may double-transform worklets. Repository currently has NO `babel.config.js`; do not create one.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom-sheet snap-point modal with gesture pan + scroll-within-sheet | Custom `Animated.View` + `PanResponder` | `@gorhom/bottom-sheet@^5.2.11` | Snap points, scroll, keyboard handling, modal portal, accessibility — gorhom's 5+ years of bug fixes are uncatchable in custom code. Fallback only if device test fails. |
| Tactile feedback abstraction | Custom Vibration API + Core Haptics bridge | `expo-haptics` + `triggerHaptic(kind)` thin wrapper | First-party Expo package, no native config, cross-platform parity, error-resilient. Wrapper consolidates type-safe API surface. |
| UI-thread shimmer animation | Custom `Animated` API + `setInterval` | Reanimated v4 `useSharedValue` + `withRepeat(withTiming)` | Reanimated runs on UI thread; React Native's legacy Animated runs on JS thread (janks on slow devices). Reanimated v4 is required by gorhom anyway. |
| Skeleton component library | `moti`, `react-native-reanimated-skeleton`, `react-native-skeleton-content` | Custom 30-LOC primitive (Pattern 3) | All ecosystem libs broken under Reanimated v4 / SDK 54. Custom is HIGH confidence and minimal. |
| Swipe gesture wrapper | `ReanimatedSwipeable` from RNGH | `Gesture.Pan()` API directly (Phase 18) | iOS crash bug in RNGH 2.28 + Reanimated 4.1 (#3720). `Gesture.Pan()` is unaffected. Banned per STATE.md + PITFALLS.md. |
| Native module install | `npm install` followed by version pinning | `npx expo install <pkg>` | Expo's resolver pins SDK 54-compatible patches automatically. Raw npm install is the root cause of most SDK 54 + Reanimated v4 breakage in the wild. |
| Babel plugin configuration | Manually adding `react-native-reanimated/plugin` to babel.config.js | `babel-preset-expo` auto-management (do nothing) | SDK 54's `babel-preset-expo` already includes the worklets plugin. Adding it manually causes conflict warnings. Project currently has no `babel.config.js` — keep it that way. |

**Key insight:** Phase 13 is a config-only phase, but the temptation to "just add a small babel config" or "just write a tiny custom sheet" is a real trap. Every native-module phase has bitten projects this way. Trust the Expo resolver, trust gorhom's patches, and ship the minimum surface.

## Common Pitfalls

### Pitfall 1: BottomSheetModalProvider in only one AppContent path (CRIT-4 from PITFALLS.md)
**What goes wrong:** Provider added to `AppContentMVP` but forgotten in `AppContentFull`. Silent in MVP mode (current); surfaces only when AUTH milestone flips `Features.AUTH: true`.
**Why it happens:** `AppContentFull` uses lazy requires and is never rendered during current dev. Easy to add a provider where you're testing and forget the other.
**How to avoid:** Phase 13 sidesteps this entirely by using **single App-root wrap** above the AUTH branch. Both AppContent paths inherit context. Smoke runner asserts `grep -c "BottomSheetModalProvider" App.tsx === 2` (1 import + 1 JSX = 2).
**Warning signs:** Smoke fails on grep count != 2; runtime error "No BottomSheetModalProvider found" on a screen rendered by AppContentFull.

### Pitfall 2: Reanimated v4 install without New Architecture
**What goes wrong:** `react-native-reanimated@^4` requires `newArchEnabled: true`. If a future config change disables New Arch, Reanimated v4 throws at runtime.
**Why it happens:** Reanimated v3 supports legacy arch, v4 does not. SDK 54 defaults New Arch on, but app.json can override.
**How to avoid:** Verify `app.json` has `"newArchEnabled": true` (current verified state). Smoke runner can assert this.
**Warning signs:** Runtime error "Reanimated requires New Architecture"; iOS pod install warnings about Fabric/TurboModules.

### Pitfall 3: PaywallModal Z-order conflict with bottom sheet (MOD-6 from PITFALLS.md)
**What goes wrong:** User mid-action triggers a premium gate while a bottom sheet is open. iOS native Modal renders ABOVE gorhom's JS portal sheet; bottom sheet stays mounted in memory behind the paywall. Android z-order is non-deterministic depending on render order.
**Why it happens:** RN `Modal` uses native presentation; gorhom uses JS portals. Different rendering layers.
**How to avoid:** `useDismissOnPaywall(sheetRef)` hook (Pattern 2) — sheet listens for `isPaywallVisible === true` and calls `sheetRef.current?.dismiss()`. Hook ships in Phase 13, used by Phase 14/21 callers.
**Warning signs:** Bottom sheet visible underneath paywall on Android dev test; sheet "stuck" after closing paywall (still mounted in tree).

### Pitfall 4: Manual babel.config.js conflicts with babel-preset-expo
**What goes wrong:** CONTEXT.md instructs verifying `react-native-reanimated/plugin` is the last plugin in `babel.config.js`. Under SDK 54, this is auto-managed by `babel-preset-expo`. Manually adding the plugin causes a conflict warning ("react-native-worklets/plugin already included via babel-preset-expo").
**Why it happens:** Reanimated v4 renamed its babel plugin from `react-native-reanimated/plugin` to `react-native-worklets/plugin`. Documentation written for v3 still references the old name. Expo's `babel-preset-expo` for SDK 54 includes the new plugin automatically.
**How to avoid:** Repository currently has NO `babel.config.js` — keep it that way. If a future need arises, use `react-native-worklets/plugin` (not the old `react-native-reanimated/plugin`). Smoke runner should assert: "if babel.config.js exists, it does not contain stale `react-native-reanimated/plugin` reference."
**Warning signs:** Metro warning at startup mentioning duplicate worklets plugin; worklets executing twice; weird animation glitches after a manual babel config edit.

### Pitfall 5: Standard `TextInput` inside bottom sheet (MOD-5 from PITFALLS.md)
**What goes wrong:** iOS keyboard fights the sheet's snap behavior — keyboard covers the input or the sheet snaps to wrong position.
**Why it happens:** RN `TextInput` doesn't know about gorhom's internal keyboard handling.
**How to avoid:** Use `BottomSheetTextInput` from `@gorhom/bottom-sheet` for any focusable input inside a sheet. Document this constraint for Phase 21 (journal quick-add). Phase 13's dev test sheet has no inputs, so this is a doc-only deliverable for now.
**Warning signs:** Test sheet input field hidden behind iOS keyboard; sheet snap point fights keyboard avoidance.

### Pitfall 6: Metro cache stale after install
**What goes wrong:** `npx expo install` adds packages but Metro's bundle cache still references the old dep tree. Reanimated worklets fail to compile or fail at runtime.
**Why it happens:** Metro caches transformed modules across sessions.
**How to avoid:** Run `npx expo start --clear` exactly once after the 4-package install. Document in plan as a manual step.
**Warning signs:** "Worklets cannot be created" runtime error; "Reanimated babel plugin not detected" message; bottom sheet renders but doesn't animate.

### Pitfall 7: Native rebuild required before testing
**What goes wrong:** All 4 packages add native code. Hot reload alone doesn't pick up native changes — a fresh dev client build is required.
**Why it happens:** Reanimated, Gesture Handler, Bottom Sheet, and Haptics each include iOS pods + Android Gradle modules. Pure-JS hot reload bypasses these.
**How to avoid:** Document explicitly in the manual checkpoint task: "After install + provider wire, run `npx expo run:ios` and `npx expo run:android` to rebuild dev clients." Do NOT attempt to test in Expo Go (won't work for these).
**Warning signs:** "TurboModule 'RNGestureHandlerModule' not found" red box; bottom sheet imports fail at runtime; haptics silently no-op.

## Code Examples

Verified patterns from official sources and existing project code.

### Provider hierarchy (verified — App.tsx default export)
```tsx
// App.tsx — full default export with Phase 13 additions
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
// (existing imports unchanged)

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <StorageProvider>
            <PremiumProvider>
              {Features.AUTH ? <AppContentFull /> : <AppContentMVP />}
            </PremiumProvider>
          </StorageProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```
Source: gorhom official docs (https://gorhom.dev/react-native-bottom-sheet/modal/usage) + CONTEXT.md lock.

### Haptics utility (verified shape — CONTEXT.md API surface)
```tsx
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

export type HapticKind =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

export function triggerHaptic(kind: HapticKind): void {
  try {
    switch (kind) {
      case 'impactLight':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'impactHeavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[haptics] triggerHaptic failed:', err);
    }
    // production: swallow
  }
}
```
Source: expo-haptics official API (https://docs.expo.dev/versions/latest/sdk/haptics/) + project's silent-fire-and-forget pattern (mirrors `unknownPlantTracker.ts`).

### Dev-tools test sheet (verified shape — INFRA-04 verification surface)
```tsx
// SettingsScreen.tsx — append inside __DEV__ block (line ~423)
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef, useCallback } from 'react';
import { Skeleton } from '../components/Skeleton';

// inside SettingsScreen component:
const testSheetRef = useRef<BottomSheetModal>(null);
const openTestSheet = useCallback(() => {
  testSheetRef.current?.present();
}, []);

// inside __DEV__ JSX block, alongside existing devButton entries:
<TouchableOpacity style={styles.devButton} onPress={openTestSheet}>
  <Text style={styles.devButtonText}>{t('settings.devTestBottomSheet')}</Text>
</TouchableOpacity>
{/* Skeleton shimmer demo — verifies INFRA-04 device animation */}
<View style={{ marginTop: spacing.md }}>
  <Skeleton width="100%" height={20} />
</View>

// inside the SettingsScreen component return, OUTSIDE the ScrollView (so it portals correctly):
<BottomSheetModal ref={testSheetRef} snapPoints={['25%']}>
  <BottomSheetView style={{ flex: 1, padding: spacing.lg }}>
    <Text>{t('settings.devTestBottomSheetContent')}</Text>
    <TouchableOpacity onPress={() => testSheetRef.current?.dismiss()}>
      <Text>{t('common.close')}</Text>
    </TouchableOpacity>
  </BottomSheetView>
</BottomSheetModal>
```
Source: gorhom official docs (BottomSheetModal usage) + project's `__DEV__` style discipline (mirrors `unknownPlantsReport` button pattern).

### Skeleton component (verified Reanimated v4 shimmer)
See Architecture Pattern 3 above — full implementation.

### useDismissOnPaywall hook (verified)
See Architecture Pattern 2 above — full implementation.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reanimated v3 + legacy architecture | Reanimated v4 + New Architecture | Expo SDK 54 (released 2025-09) | v3 only works on legacy arch; v4 only on New Arch. SDK 54 defaults New Arch on. No middle ground. |
| `react-native-reanimated/plugin` babel plugin | `react-native-worklets/plugin` (auto-managed by babel-preset-expo) | Reanimated v4 release (2025) | Plugin renamed; Expo's preset auto-includes new name. Manual babel configs need updating; otherwise auto-managed. |
| `ReanimatedSwipeable` from RNGH | `Gesture.Pan()` API direct | Sept 2025 (issue #3720, RNGH 2.28 + Reanimated 4.1) | Crash bug on iOS unresolved at v4 introduction. Lower-level Gesture API is the safe path. |
| `@gorhom/bottom-sheet` v4 with Reanimated v3 | `@gorhom/bottom-sheet` v5.1.8+ with Reanimated v4 | gorhom v5.1.8 (2025-07-27) | First version with Reanimated v4 support. v5.2.x adds Expo SDK 54 fixes (#2528). Latest stable as of research: 5.2.13 (April 2026). |
| Custom `npm install` with manual version pinning | `npx expo install` | Stable practice, reinforced by SDK 54 breakage reports | Expo's resolver pins compatible patches automatically. Raw npm install is the most-reported breakage cause. |
| Skeleton libraries (moti, reanimated-skeleton) | Custom 30-LOC primitive | Reanimated v4 incompatibility (moti #391, skeleton-content unmaintained, reanimated-skeleton v3-only) | Library ecosystem has not caught up to v4. Custom is current best practice. |

**Deprecated/outdated:**
- `react-native-reanimated/plugin` babel entry — replaced by `react-native-worklets/plugin` (auto-managed by babel-preset-expo).
- `ReanimatedSwipeable` — banned for v1.2 in this project; iOS crash bug.
- `moti`, `react-native-reanimated-skeleton`, `react-native-skeleton-content` — all incompatible with Reanimated v4 + SDK 54.
- `@gorhom/bottom-sheet` v4 — superseded by v5.1.8+; v4 doesn't support Reanimated v4.

## Open Questions

1. **Should the `DEFAULT` smoke assertion for babel.config.js be "absent" or "present-but-correct"?**
   - What we know: Repo has no `babel.config.js`; `babel-preset-expo` auto-manages the plugin under SDK 54. Manual config would conflict.
   - What's unclear: Whether a future contributor will accidentally create a `babel.config.js`. CONTEXT.md says assert plugin presence; research says assert absence-or-correct-name.
   - Recommendation: Smoke assertion should be: "either `babel.config.js` does not exist, OR if it exists, it includes `react-native-worklets/plugin` as the last plugin AND does not include the deprecated `react-native-reanimated/plugin`." Document the rationale inline in the smoke runner.

2. **Should the dev-tools test sheet remain after Phase 13 ships?**
   - What we know: It serves as the INFRA-04 manual-checkpoint verification surface AND a regression check for future phases.
   - What's unclear: Whether it pollutes the Settings UX even gated by `__DEV__`.
   - Recommendation: Keep it as a permanent `__DEV__`-gated regression check (low maintenance cost; high diagnostic value when future bottom-sheet bugs emerge). Same pattern as Phase 12's "Unknown plants report" dev tool.

3. **Should `useDismissOnPaywall` ship in Phase 13 even though no caller exists yet?**
   - What we know: CONTEXT.md locks the API; Phase 14/21 sheet callers will need it.
   - What's unclear: Whether shipping unused code violates YAGNI.
   - Recommendation: Ship it. Same rationale as `triggerHaptic` — locking the import path now prevents 3-4 divergent ad-hoc usages later. Hook is ~10 LOC; YAGNI risk is negligible.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — project uses smoke runners (`scripts/smoke-phaseNN.mjs`) executed via `node` directly. CLAUDE.md confirms "No test framework is set up. No linter/formatter configured." |
| Config file | None — each smoke runner is self-contained; uses `typescript.transpileModule` for source compilation when behavior assertions are needed. |
| Quick run command | `node scripts/smoke-phase13.mjs` — Wave 0 scaffold + asserts after each plan |
| Full suite command | `npx tsc --noEmit && node scripts/smoke-phase13.mjs && npm run check:i18n-keys` (typecheck + phase smoke + i18n parity if any new keys ship) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | 4 packages declared in `package.json` at expected version ranges | smoke | `node scripts/smoke-phase13.mjs` (assertion: `pkg.dependencies['react-native-reanimated']` matches `^4` etc.) | Wave 0 — file created in Plan 13-00 |
| INFRA-02 | `App.tsx` contains exactly 2 `BottomSheetModalProvider` references (1 import + 1 JSX) and exactly 2 `GestureHandlerRootView` references | smoke | `node scripts/smoke-phase13.mjs` (assertion: `readFileSync('App.tsx').match(/BottomSheetModalProvider/g).length === 2`) | Wave 0 — runner asserts existing App.tsx initially fails (count = 0); Plan 13-01 brings it to 2 |
| INFRA-02 | `babel.config.js` either absent OR contains `react-native-worklets/plugin` as last plugin (NOT `react-native-reanimated/plugin`) | smoke | `node scripts/smoke-phase13.mjs` (conditional file-content assertion) | Wave 0 |
| INFRA-03 | `src/components/Skeleton.tsx` exports a function/component named `Skeleton` | smoke | `node scripts/smoke-phase13.mjs` (file-content + named export assertion via grep or transpileModule) | Wave 0 — placeholder; Plan 13-02 lands the component |
| INFRA-03 | `src/utils/haptics.ts` exports `triggerHaptic` and `HapticKind` type | smoke | `node scripts/smoke-phase13.mjs` (file-content assertion: `export function triggerHaptic` + `export type HapticKind`) | Wave 0 — placeholder; Plan 13-02 lands the utility |
| INFRA-03 | Skeleton renders shimmer animation on real device (UI thread, not JS thread) | manual | Open SettingsScreen → __DEV__ section → observe shimmer animating smoothly on iOS + Android dev clients | Manual checkpoint task |
| INFRA-04 | Test bottom sheet opens on tap, dismisses on swipe-down, has correct gesture behavior | manual | Open SettingsScreen → __DEV__ → tap "Test bottom sheet" → swipe down to dismiss | Manual checkpoint task |
| INFRA-04 | Bottom sheet dismisses cleanly when PaywallModal opens (no Z-order glitch) | manual | Open test bottom sheet → tap "Show Paywall" → confirm sheet closes, paywall renders unobstructed | Manual checkpoint task |
| INFRA-04 | App boots without crash on iOS + Android dev client after install | manual | `npx expo run:ios` + `npx expo run:android`; verify no red box | Manual checkpoint task |

### Sampling Rate
- **Per task commit:** `node scripts/smoke-phase13.mjs` (file-content asserts; ~1s)
- **Per wave merge:** `npx tsc --noEmit && node scripts/smoke-phase13.mjs` (typecheck + phase smoke; ~10s)
- **Phase gate:** Full smoke green + manual checkpoint task replied "verified" (iOS + Android dev client tested)

### Wave 0 Gaps
- [ ] `scripts/smoke-phase13.mjs` — file-content assertions for INFRA-01/02/03 (no transpileModule needed; pure config phase)
- [ ] `.gitignore` entry for `scripts/.tmp-phase13/` (consistency with Phase 11/12 pattern, though Phase 13 may not need a tmp dir)
- [ ] Smoke runner placeholder PASS/SKIP entries for each Plan 13-NN deliverable, flipping to assertion as plans land

*(Framework install: not needed — existing `node` + TypeScript + smoke-runner pattern covers Phase 13's needs)*

## Sources

### Primary (HIGH confidence)
- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54) — New Architecture default, Reanimated v4 requirement
- [react-native-reanimated v4 Getting Started](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) — `react-native-worklets/plugin` requirement, New Arch requirement
- [Expo Reanimated docs](https://docs.expo.dev/versions/latest/sdk/reanimated/) — confirms babel-preset-expo auto-manages the plugin
- [expo/fyi: expo-54-reanimated.md](https://github.com/expo/fyi/blob/main/expo-54-reanimated.md) — official Expo guidance: "no need to change to react-native-worklets/plugin unless you manually specified a plugin"
- [@gorhom/bottom-sheet npm](https://www.npmjs.com/package/@gorhom/bottom-sheet) — current versions 5.2.9 through 5.2.13 listed
- [@gorhom/bottom-sheet releases](https://github.com/gorhom/react-native-bottom-sheet/releases) — release notes for 5.2.9–5.2.13 (April 2026 patches)
- [@gorhom/bottom-sheet BottomSheetModal usage docs](https://gorhom.dev/react-native-bottom-sheet/modal/usage) — canonical setup pattern for provider + ref + present/dismiss
- [expo-haptics docs](https://docs.expo.dev/versions/latest/sdk/haptics/) — official API reference for `impactAsync`, `notificationAsync`, `selectionAsync`
- Project source files read directly:
  - `App.tsx` (provider tree, two-AppContent paths, PaywallModal placement at lines 227, 368)
  - `package.json` (no Reanimated/RNGH/bottom-sheet/haptics installed)
  - `app.json` (`newArchEnabled: true` confirmed)
  - `src/hooks/usePremium.tsx` (PaywallContext exposes `isPaywallVisible`)
  - `src/components/PaywallModal.tsx` (uses RN `Modal` with `transparent` + `animationType="slide"`)
  - `src/screens/SettingsScreen.tsx` (existing `__DEV__` block at line 423 with `styles.devButton` pattern; `unknownPlantsReport` precedent)
  - `scripts/smoke-phase12.mjs` (smoke runner template to mirror)
  - `.planning/research/STACK.md` (v1.2 stack rationale, version pinning)
  - `.planning/research/PITFALLS.md` (CRIT-4, MOD-5, MOD-6 — directly applicable)

### Secondary (MEDIUM confidence)
- [Reanimated v4 migration guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) — `react-native-reanimated/plugin` → `react-native-worklets/plugin` rename
- [react-native-gesture-handler issue #3720](https://github.com/software-mansion/react-native-gesture-handler/issues/3720) — `ReanimatedSwipeable` iOS crash, status closed but workaround unclear (issue page does not surface fix details)
- [moti issue #391](https://github.com/nandorojo/moti/issues/391) — Reanimated v4 incompatibility, unresolved as of research date

### Tertiary (LOW confidence — flagged for validation)
- Specific patch behavior of `@gorhom/bottom-sheet` 5.2.13 (April 2026) — release notes are succinct ("restore React mount reset after unmount"); device test will reveal whether the v5.2.11 pin (CONTEXT.md lock) is sufficient or whether bumping to 5.2.13 is wiser. Recommendation: trust CONTEXT.md's `^5.2.11` pin (caret allows resolver to pick latest patch), defer the call to install time.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions cross-verified across Expo docs, gorhom releases, and STACK.md; install order matches gorhom + Expo official guidance
- Architecture: HIGH — provider patterns verified against gorhom official docs and locked in CONTEXT.md
- Pitfalls: HIGH — drawn from PITFALLS.md (project-specific), expo/fyi (official Expo), and live verification of project source files
- babel.config.js handling: HIGH — official Expo docs explicitly state auto-management; project repo verified to have no babel.config.js
- Skeleton implementation: HIGH — pattern is well-documented; Reanimated v4 `withRepeat`/`withTiming` API is stable; `expo-linear-gradient` already installed
- Z-order coexistence: HIGH — confirmed by PaywallModal source (uses RN native `Modal`) + gorhom architecture (JS portal); native always wins
- `useDismissOnPaywall` hook: HIGH — uses existing `usePremium()` API surface (verified in `src/hooks/usePremium.tsx`)

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (30 days — Reanimated v4 + gorhom v5 ecosystem is stable; minor patches expected but no major breakage forecast)

---

*Phase 13 — Gesture + Bottom-Sheet Infrastructure research*
*Researched: 2026-05-03*
