# Phase 18: PlantCard Cleanup + Mood Emoji - Research

**Researched:** 2026-05-08
**Domain:** React Native gesture UX (swipe-to-delete, long-press menu, mood emoji overlay) + generic Toast primitive
**Confidence:** HIGH (all decisions are CONTEXT-locked; gesture infra is already installed and exercised; Reanimated v4 patterns proven in EducationalSection.tsx)

## Summary

Phase 18 is a JSX restructure + one new generic component (`<Toast/>`), running on top of Phase 13 infrastructure (`react-native-gesture-handler@~2.28.0`, `react-native-reanimated@~4.1.1`, `@gorhom/bottom-sheet@^5.2.13`, `expo-haptics@~15.0.8`) that is already installed and provider-wrapped at the App root. Almost every implementation detail is locked in `18-CONTEXT.md` — research role here is to verify the locked patterns are sound, surface the FlatList scroll/pan conflict configuration, document the canonical Reanimated v4 swipe + spring-back idiom, and identify the 5 pitfalls a planner must guard against.

The single most important research-backed decision: use **`Gesture.Race(panGesture, longPressGesture)`** (canonical "either-or" composition) NOT `Gesture.Simultaneous` for combining swipe-to-delete + long-press menu — the official docs and prevailing community pattern both endorse Race here, and CONTEXT.md is silent on which composition to use. Also: the `Gesture.Pan().activeOffsetX([-15, 15])` config is the canonical knob for distinguishing horizontal swipe from vertical FlatList scroll. Without it, every diagonal scroll triggers the swipe.

**Primary recommendation:** Build the swipe gesture with `Gesture.Pan().activeOffsetX([-15, 15]).failOffsetY([-10, 10])`, compose with `Gesture.Race(longPress, pan)`, drive `translateX` via `useSharedValue` + `useAnimatedStyle`, fire the haptic on threshold-cross via `runOnJS(triggerHaptic)('impactMedium')`, and on commit use `runOnJS(commitDelete)()`. Build the Toast as a portal-style absolute-positioned `<Animated.View>` slid in from the bottom of the screen — NOT a `BottomSheetModal` (overkill, wrong UX for transient feedback) and NOT a native `Modal` (z-order risk with PaywallModal per Phase 13 INFRA-04 lock).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**5-element budget (CARD-03):**
- Favorite heart REMOVED from card face → moves into long-press overflow menu only.
- Subtitle (category text) KEPT — counts as metadata attached to name.
- Diagnosis badge (🩺 / `TRACKING_STATUS_CONFIG[status].emoji`) KEPT — `headerRight` slot, conditional render unchanged.
- Water-needed border (`cardNeedsWater` style) KEPT — visual state, not an "element".
- Tip (italic gray) REMOVED from PlantCard. Relocated into `MyPlantDetailModal` "¿Qué hacer?" section.
- Trash button 🗑️ REMOVED entirely (CARD-01). Replaced by swipe + long-press menu.

**Swipe-to-delete UX (CARD-01, CARD-05):**
- HYBRID threshold model: small swipe (~25-40% width) reveals red "Eliminar" button, full swipe (~70% width) commits directly. Concrete percentages are Claude's discretion at planning.
- Confirmation: UNDO-TOAST (delete instantly + 4s undo). NO `Alert.alert`, NO bottom-sheet confirmation.
- Persistence: OPTIMISTIC `useStorage.deletePlant(id)` immediately + memory-only `pendingDelete: Plant | null` state for restore-on-undo. NO `deletedAt` tombstone field.
- Mid-swipe release below threshold: SPRING BACK to closed via Reanimated spring.
- Direction: LEFT-ONLY. Right-swipe is a no-op.
- Haptic: `triggerHaptic('impactMedium')` once at threshold-cross moment per swipe gesture. NOT on partial-swipe releases. NOT on undo.
- `Gesture.Pan()` ONLY — `ReanimatedSwipeable` is BANNED (iOS crash bug, RNGH 2.28 + Reanimated 4.1).

**Generic Toast component (NEW — app-wide primitive):**
- One generic `<Toast/>` lives at `src/components/Toast.tsx` (canonical path — Claude's discretion).
- API: message text + optional action button label + optional action callback + auto-dismiss duration (default ~4s).
- Phase 18 consumer: swipe-to-delete undo flow.
- Phase 22 consumer (forward-looking): GAM-01 celebration toasts ("¡Vas bien! 🌱"). NO duplicate component, NO duplicate API.
- Locale parity: "Eliminar"/"Deshacer" land in EN + ES `common.json`.

**Mood emoji (GAM-03, GAM-04):**
- Slot: OVERLAY on plant image thumbnail (Greg-style pet badge). Anchor bottom-right of 48×48 image.
- Source: existing `calculatePlantHealth(plant, today, weather, diagnoses, currentSeason).level` — already memoized at `PlantCard.tsx:85-88`.
- Mapping (frozen by REQUIREMENTS GAM-03): `excellent` → 🌱, `good` → 😊, `warning` → 😐, `danger` → 😟.
- ALWAYS rendered (no `score < 80` gate).
- Tap: opens existing `<PlantHealthDetail visible=... />` modal at `PlantCard.tsx:212-218`. NO new modal.
- Diagnosis + mood: BOTH render side-by-side. Mood on image overlay; diagnosis in `headerRight`.
- A11y label recommendation: `accessibilityLabel={getHealthMessage(level)}` from `src/utils/plantHealth.ts`.
- `PlantHealthBadge` REMOVED from `PlantCard.tsx` (import L13, gate L91, render L138-143). NOT removed from `MyPlantDetailModal:203`. Component file NOT deleted.

**Long-press overflow menu (CARD-02):**
- Items: favorite (toggle), delete, edit. Per CARD-02.
- Container: Claude's discretion. Recommended `BottomSheetModal` (Phase 13 ready). `Alert.alert` action sheet acceptable fallback. Custom popover discouraged.
- Edit target: Recommended opens existing `MyPlantDetailModal`'s "Tus ajustes" section (Phase 14 EDU-01).
- Haptic on long-press fire: Recommended `triggerHaptic('impactLight')`.
- `useDismissOnPaywall(sheetRef)` if using `BottomSheetModal` — opt in.

**Affordance hint (CARD-04):**
- First-render swipe hint on first card in `PlantsScreen` ONLY (not `mode="tasks"`).
- Shape: Claude's discretion. Recommended chevron-peek animation that reveals red "Eliminar" by ~10-15px and springs back, fired once on first mount.
- Dismissal: Recommended AsyncStorage flag `@plantcard_swipe_discovered = 'true'` after user completes their first successful swipe.
- Scope: First card in sorted list per `PlantsScreen.tsx:114-127` (favorites first, then identity).

**Mode parity:**
- `mode="tasks"` (Hoy / TodayScreen): swipe + long-press + mood emoji apply identically. NO CARD-04 affordance hint.
- `mode="collection"` (PlantsScreen): swipe + long-press + mood emoji + CARD-04 affordance hint.
- Same `PlantCard` instance handles both modes — no per-mode forking of the gesture layer.

**Smoke (Claude's discretion):**
- `scripts/smoke-phase18.cjs` recommended, file-content asserts via `readFileSync` (Phase 18 is JSX restructure, not runtime catalog logic).

### Claude's Discretion

- Concrete swipe threshold percentages (~25-40% reveal, ~70% commit) — pick at planning.
- Toast visual + a11y polish (positioning, theming, animation choice, screen-reader announcement strategy) — design at planning, iterate at component-level once.
- Long-press menu container choice (`BottomSheetModal` recommended, `Alert.alert` acceptable, custom popover discouraged).
- Edit target for long-press "Edit" — recommended `MyPlantDetailModal`'s "Tus ajustes" section.
- Haptic on long-press fire — recommended `triggerHaptic('impactLight')`.
- CARD-04 affordance hint shape and dismissal mechanism — recommended chevron-peek + AsyncStorage flag.
- Smoke runner shape — recommended `scripts/smoke-phase18.cjs` mirroring Phase 13/14/15/16/17.
- Mood emoji circular-background tint — could use `getHealthBgColor(level)` from `plantHealth.ts`.
- Optional `__DEV__` "Reset swipe-discovered flag" toggle in `SettingsScreen` for re-testing CARD-04.
- Toast canonical path (`src/components/Toast.tsx` recommended).
- Per-screen vs. App-level Toast portal — Claude picks at planning.

### Deferred Ideas (OUT OF SCOPE)

- Right-swipe to mark watered (or any right-swipe action) — future "swipe shortcuts" phase.
- `PlantHealthBadge` removal from `MyPlantDetailModal:203` — locked PlantCard-only scope.
- Deletion of `src/components/PlantHealthBadge.tsx` file + `index.ts` re-export — modal still consumes it.
- Tooltip popover for mood emoji on tap — rejected; tap opens existing `PlantHealthDetail` modal per REQUIREMENTS GAM-03.
- Native `Alert.alert` confirmation for swipe-delete — rejected; chose undo-toast.
- `BottomSheetModal` confirmation for swipe-delete — rejected; chose undo-toast.
- Dedicated `<UndoToast/>` component separate from generic Toast — rejected; one Toast across the ecosystem.
- `deletedAt` tombstone field on `Plant` — rejected; in-component memory restore is sufficient.
- Mood emoji wins over diagnosis (or vice versa) — rejected; both render side-by-side.
- Pet toxicity badge on PlantCard (TOX-03) — Phase 19.
- Fertilize task badge on PlantCard (FERT-06) — Phase 20.
- Edit-plant-only modal — rejected as scope creep.
- Phase 22 celebration toast wiring (GAM-01) — Phase 22 owns this; Phase 18 only ships the primitive.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | Trash button removed; swipe-left delete via `Gesture.Pan()` (NOT `ReanimatedSwipeable`) | Reanimated v4 `useSharedValue` + `useAnimatedStyle` + `Gesture.Pan().activeOffsetX([-15,15])` is the canonical pattern. Phase 13 already installed RNGH ~2.28.0 + Reanimated ~4.1.1; Skeleton.tsx + EducationalSection.tsx prove the worklet API works in this codebase. Existing `useStorage.deletePlant(id)` + `addPlant(plant)` cover the optimistic delete + memory restore round-trip. |
| CARD-02 | Long-press reveals overflow menu (favorite, delete, edit) | `Gesture.LongPress().minDuration(500)` is canonical default. Compose with Pan via `Gesture.Race(longPress, pan)` (canonical "either-or"). `BottomSheetModal` from `@gorhom/bottom-sheet` already provider-wrapped at App root (App.tsx L378), with `useDismissOnPaywall` hook ready (`src/hooks/useDismissOnPaywall.ts`). SettingsScreen test sheet at L555 confirms the pattern works in this codebase. |
| CARD-03 | Tip moved to MyPlantDetailModal "¿Qué hacer?"; PlantCard = 5 elements (image + name + 1 task or none + water badge + mood emoji) | `MyPlantDetailModal.tsx:247-282` "¿Qué hacer?" section already exists (Phase 14 EDU-01). Tip can append into the empty-state path or alongside `careAction.fixed` / `careAction.soilCheck` rendering. Defensive 3-rung fallback (`translatedEntry?.tip ?? plantType?.tip ?? ''`) at PlantCard.tsx:74-79 must move with the tip. |
| CARD-04 | First-render swipe affordance hint on first card in PlantsScreen | AsyncStorage flag pattern established by `MigrationTooltip.tsx` (key `'migration-tooltip-seen-v1.1'`) and `DailyTip.tsx` (`SEEN_TIPS_KEY`). New key `@plantcard_swipe_discovered` (or unprefixed kebab; both styles coexist in codebase — see Pitfall 6). Chevron-peek implementable via `useSharedValue` + `withSequence` (Reanimated v4) — no new deps. |
| CARD-05 | Haptic on swipe-completion threshold | `triggerHaptic('impactMedium')` already exists at `src/utils/haptics.ts` (Phase 13). Fire-and-forget pattern (returns void, swallows errors). Must call from worklet via `runOnJS(triggerHaptic)('impactMedium')`. |
| GAM-03 | Mood emoji ALWAYS visible derived from `calculatePlantHealth(plant).healthLevel`. Mapping frozen: `excellent`→🌱, `good`→😊, `warning`→😐, `danger`→😟. Tap opens existing `PlantHealthDetail` modal | `calculatePlantHealth` already memoized at `PlantCard.tsx:85-88`; `level` field maps directly. `<PlantHealthDetail visible={showHealthDetail} ... />` already mounted at `PlantCard.tsx:212-218` — reuse the `useState(showHealthDetail)` toggle. Pure JSX restructure. |
| GAM-04 | Mood emoji REPLACES conditional `PlantHealthBadge`. Card stays at 5 elements. NO numeric score on card | Remove import (L13), `showHealthBadge` gate (L91), and `<PlantHealthBadge ... />` block (L138-143). Modal-side usage at `MyPlantDetailModal:203` STAYS. `PlantHealthBadge.tsx` file + `index.ts` re-export both KEPT. |

## Standard Stack

### Core (already installed via Phase 13 INFRA-01)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-gesture-handler` | `~2.28.0` | `Gesture.Pan()`, `Gesture.LongPress()`, `Gesture.Race()` composition, `GestureDetector` | The blessed gesture primitive in React Native. Phase 13 lock: `Gesture.Pan()` only — `ReanimatedSwipeable` BANNED (iOS crash, issue #3720). |
| `react-native-reanimated` | `~4.1.1` | `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `withSequence`, `runOnJS`, `Easing` | Drives swipe translation, spring-back, chevron-peek affordance, Toast slide-in. Worklet-based — runs on UI thread. Already proven in `Skeleton.tsx` + `EducationalSection.tsx`. |
| `@gorhom/bottom-sheet` | `^5.2.13` | `BottomSheetModal` for long-press overflow menu | Provider-wrapped at App root (App.tsx L378). `useDismissOnPaywall` hook ready. Test sheet at SettingsScreen L555 proves shape. |
| `expo-haptics` | `~15.0.8` | Haptic feedback on swipe threshold-cross + long-press fire | Wrapped by `triggerHaptic(kind)` at `src/utils/haptics.ts`. Fire-and-forget, void return, swallows errors. |
| `@react-native-async-storage/async-storage` | (already installed) | `@plantcard_swipe_discovered` flag for CARD-04 dismissal | Existing pattern — `MigrationTooltip` and `DailyTip` both use it. |

### Supporting (already in codebase)

| Library / Module | Purpose | When to Use |
|------------------|---------|-------------|
| `src/utils/haptics.ts` `triggerHaptic('impactMedium' \| 'impactLight')` | Swipe threshold + long-press fire haptics | All gesture-completion feedback |
| `src/utils/plantHealth.ts` `calculatePlantHealth(plant, today, weather, diagnoses, season)` | Health level computation (memoized at PlantCard.tsx:85-88) | Mood emoji source — `.level` field |
| `src/utils/plantHealth.ts` `getHealthMessage(level)` / `getHealthBgColor(level)` / `getHealthColor(level)` | Health-level i18n + color tokens | Mood emoji a11y label + optional circular-background tint |
| `src/components/PlantHealthDetail.tsx` | Detailed health modal | Tap target for mood emoji |
| `src/hooks/useStorage.tsx` `deletePlant(id)`, `addPlant(plant)`, `updatePlant(id, partial)` | Optimistic delete + memory restore + favorite toggle | Undo flow + long-press favorite item |
| `src/hooks/useDismissOnPaywall.ts` `useDismissOnPaywall(sheetRef)` | Auto-dismiss BottomSheetModal when paywall opens | Long-press menu sheet — opt in |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Gesture.Pan()` direct | `ReanimatedSwipeable` | BANNED in this codebase per Phase 13 lock. iOS crash bug (#3720) on RNGH 2.28 + Reanimated 4.1. Fix landed in 2.31.1 but expo-managed pin keeps us at 2.28. Locked by STATE.md + PITFALLS.md. |
| `Gesture.Race(pan, longPress)` | `Gesture.Simultaneous(pan, longPress)` | `Race` cancels the loser when one activates — correct for "either swipe OR long-press, not both". `Simultaneous` runs both concurrently — would cause a long-press to fire mid-swipe. Race is the canonical "swipe-or-menu" composition per docs. |
| `BottomSheetModal` for long-press menu | `Alert.alert` action sheet | BottomSheetModal is more on-brand (modern v1.2 direction); `Alert.alert` is smaller-LOC fallback acceptable per CONTEXT. Custom popover discouraged. |
| Custom Toast (this phase) | `react-native-toast-message`, `@backpackapp-io/react-native-toast` | Adding a 5th install + provider wrap for one in-house use case is overkill. Generic in-house Toast is ~80-120 LOC, locks the API, future-proofs Phase 22. User explicitly asked for "uno solo en todo el ecosistema" verbatim. |
| AsyncStorage `@plantcard_swipe_discovered` flag | Field on `AppData` (top-level) | Inline AsyncStorage key matches `MigrationTooltip` precedent (separate key, NOT in AppData). Simpler. No useStorage round-trip. |

**Installation:** None required — Phase 13 already installed all 4 native deps. `npx expo install` is NOT run in Phase 18.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── PlantCard.tsx                    # MODIFIED — heaviest delta (~150 LOC)
│   ├── PlantHealthBadge.tsx             # KEPT (modal still consumes it)
│   ├── PlantHealthDetail.tsx            # READ — mood emoji tap target
│   ├── MyPlantDetailModal.tsx           # MODIFIED — receives relocated tip
│   ├── Toast.tsx                        # NEW — generic app-wide primitive
│   ├── plant-card/                      # OPTIONAL — Claude's discretion
│   │   ├── SwipeableRow.tsx             # OPTIONAL extraction if PlantCard.tsx grows
│   │   ├── MoodEmojiOverlay.tsx         # OPTIONAL extraction
│   │   └── LongPressMenu.tsx            # OPTIONAL extraction (BottomSheetModal child)
│   └── index.ts                         # MODIFIED — add Toast export
├── screens/
│   ├── PlantsScreen.tsx                 # MODIFIED — wires undo Toast portal + CARD-04 hint
│   └── TodayScreen.tsx                  # READ — receives gesture changes via PlantCard transparently
├── utils/
│   ├── haptics.ts                       # READ (no changes)
│   └── plantHealth.ts                   # READ (no changes)
├── hooks/
│   ├── useStorage.tsx                   # READ — deletePlant + addPlant + updatePlant
│   └── useDismissOnPaywall.ts           # READ — opt in if menu uses BottomSheetModal
└── i18n/locales/{en,es}/common.json     # MODIFIED — Toast labels + (optional) mood-emoji a11y
```

**Note:** Sub-folder extraction is OPTIONAL — single-file PlantCard.tsx is acceptable if total length stays manageable (~500 LOC). Extract only if the planner judges the Phase 18 delta would push past readable.

### Pattern 1: `Gesture.Pan()` for swipe-to-delete with FlatList scroll co-existence

**What:** Horizontal-only Pan gesture that yields to vertical scroll via `activeOffsetX` + `failOffsetY` thresholds.

**When to use:** Any horizontal swipe action on a vertically-scrolling list row.

**Example:**
```typescript
// Source: react-native-gesture-handler docs (https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition)
//         + Phase 13 INFRA-01 install + locked Phase 13 decision (Gesture.Pan only).
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { triggerHaptic } from '../utils/haptics';

const CARD_WIDTH = /* measured via onLayout, default 0 until layout */;
const REVEAL_THRESHOLD = -CARD_WIDTH * 0.3;   // ~30% — reveal red Eliminar
const COMMIT_THRESHOLD = -CARD_WIDTH * 0.7;   // ~70% — full-swipe commits
const RESTING_REVEAL_X = -88;                 // pixel width of revealed action button
const HAPTIC_FIRED = useSharedValue(false);

const translateX = useSharedValue(0);
const isRevealed = useSharedValue(false);

const panGesture = Gesture.Pan()
  // CRITICAL: distinguishes horizontal swipe from vertical FlatList scroll.
  // [-15, 15] means: do not activate until finger has moved >15px horizontally.
  // Combined with failOffsetY([-10, 10]), the gesture FAILS if vertical motion
  // exceeds 10px before horizontal threshold — letting FlatList consume the touch.
  .activeOffsetX([-15, 15])
  .failOffsetY([-10, 10])
  .onUpdate((event) => {
    'worklet';
    // Left-only swipe per CONTEXT.md lock. Clamp positive translateX (no right-swipe reveal).
    const next = Math.min(0, event.translationX + (isRevealed.value ? RESTING_REVEAL_X : 0));
    translateX.value = next;

    // CARD-05: fire haptic ONCE at commit threshold-cross. Worklet → JS via runOnJS.
    if (next < COMMIT_THRESHOLD && !HAPTIC_FIRED.value) {
      HAPTIC_FIRED.value = true;
      runOnJS(triggerHaptic)('impactMedium');
    }
  })
  .onEnd((event) => {
    'worklet';
    HAPTIC_FIRED.value = false;
    if (event.translationX < COMMIT_THRESHOLD) {
      // Full-swipe path — commit delete immediately, optimistic
      translateX.value = withTiming(-CARD_WIDTH, { duration: 200 });
      runOnJS(handleCommitDelete)();
    } else if (event.translationX < REVEAL_THRESHOLD) {
      // Reveal path — snap to revealed position, wait for tap
      translateX.value = withSpring(RESTING_REVEAL_X, { damping: 18, stiffness: 240 });
      isRevealed.value = true;
    } else {
      // Below threshold — spring back to closed
      translateX.value = withSpring(0, { damping: 18, stiffness: 240 });
      isRevealed.value = false;
    }
  });

const longPressGesture = Gesture.LongPress()
  .minDuration(500)  // canonical default
  .onStart(() => {
    'worklet';
    runOnJS(triggerHaptic)('impactLight');
    runOnJS(presentLongPressMenu)();
  });

// CRITICAL: Race composition — first to activate cancels the other.
// "Either swipe OR long-press, not both" per docs.
const composedGesture = Gesture.Race(longPressGesture, panGesture);

const cardAnimatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));

return (
  <View>
    {/* Action layer (revealed under the card) */}
    <View style={styles.actionLayer}>
      <TouchableOpacity onPress={handleCommitDelete} style={styles.deleteAction}>
        <Text style={styles.deleteActionText}>{t('plantCard.deleteButton')}</Text>
      </TouchableOpacity>
    </View>

    {/* Foreground card (translates) */}
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        {/* PlantCard JSX */}
      </Animated.View>
    </GestureDetector>
  </View>
);
```

### Pattern 2: Optimistic delete + memory-only restore (undo flow)

**What:** Delete from AsyncStorage immediately; hold the deleted plant in component state until the toast dismisses; on undo, re-insert via `addPlant`.

**When to use:** Any UX with a short-window undo affordance (CONTEXT.md locks 4s).

**Example:**
```typescript
// Source: Phase 18 CONTEXT.md §"Persistence: OPTIMISTIC storage write + restore-on-undo".
//         Built on existing useStorage API (no schema changes).
const { plants, deletePlant, addPlant } = useStorage();
const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);
const [toastVisible, setToastVisible] = useState(false);
const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleCommitDelete = (plant: Plant) => {
  // 1. Hold reference for restore-on-undo (memory only — no tombstone field).
  setPendingDelete(plant);
  // 2. Optimistic delete — useStorage writes to AsyncStorage synchronously.
  deletePlant(plant.id);
  // 3. Show undo toast with 4s window.
  setToastVisible(true);
  if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
  dismissTimeoutRef.current = setTimeout(() => {
    setToastVisible(false);
    setPendingDelete(null); // Final — past 4s, deletion is permanent.
  }, 4000);
};

const handleUndo = () => {
  if (!pendingDelete) return;
  if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
  // Re-insert the plant. addPlant appends to the end; pendingDelete keeps the original id.
  addPlant(pendingDelete);
  setPendingDelete(null);
  setToastVisible(false);
};

// On unmount, ensure no orphan timeout.
useEffect(() => () => {
  if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
}, []);
```

**Trade-off accepted (per CONTEXT.md):** if the app closes mid-window, the deletion is final. The 4s window is short enough that this is acceptable.

### Pattern 3: Generic Toast primitive (slide-in from bottom)

**What:** Absolute-positioned `<Animated.View>` rendered at the screen level, slides up from below using Reanimated v4. Auto-dismisses on duration; supports an optional action button.

**When to use:** Any transient feedback message (Phase 18 undo, Phase 22 celebration).

**Example:**
```typescript
// Source: composed from existing Skeleton.tsx Reanimated v4 patterns + react-native-toast-message
//         shape (https://www.npmjs.com/package/@backpackapp-io/react-native-toast).
//         Custom primitive avoids 5th install per CONTEXT.md user direction.
import React, { useEffect } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';

interface ToastProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;     // default 4000 (matches CONTEXT.md undo window)
  onDismiss?: () => void;  // called once duration elapses or after onAction
}

export function Toast({ visible, message, actionLabel, onAction, durationMs = 4000, onDismiss }: ToastProps) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 220 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(80, { duration: 180 });
        opacity.value = withTiming(0, { duration: 180 });
        onDismiss?.();
      }, durationMs);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(80, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, durationMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[styles.toast, animatedStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityLiveRegion="polite"   // Android announces on appear
      accessibilityRole="alert"          // iOS announces via VoiceOver
    >
      <Text style={styles.message}>{message}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.fabClearance, // above bottom tabs + FAB
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.textPrimary,        // dark backdrop, theme-aligned
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.white, flex: 1 },
  actionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.green, marginLeft: spacing.md },
});
```

**Placement:** Render at screen level (`PlantsScreen.tsx` / `TodayScreen.tsx`) — sibling of the `FlatList` / `ScrollView`. NOT inside the list row. Multiple toasts queueing is NOT required for Phase 18.

**A11y:** `accessibilityLiveRegion="polite"` (Android) + `accessibilityRole="alert"` (iOS) is the standard pattern for screen-reader announcements — see [React Native AccessibilityInfo docs](https://reactnative.dev/docs/accessibilityinfo). Both work without `AccessibilityInfo.announceForAccessibility()` (which is iOS-imperative-only).

### Pattern 4: Mood emoji overlay on plant image

**What:** Small circular badge anchored to bottom-right of the 48×48 plant image. Always rendered.

**Example:**
```typescript
// Source: CONTEXT.md §"Slot: OVERLAY on the plant image thumbnail (Greg-style pet badge)".
//         Reuses calculatePlantHealth memo at PlantCard.tsx:85-88.
import { getHealthMessage, getHealthBgColor } from '../utils/plantHealth';

const moodEmojiByLevel: Record<HealthLevel, string> = {
  excellent: '🌱',
  good: '😊',
  warning: '😐',
  danger: '😟',
};

const moodEmoji = moodEmojiByLevel[healthStatus.level];

// Inside the imageContainer wrapper:
<View style={styles.imageContainer}>
  {plant.imageUrl ? (
    <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} resizeMode="cover" />
  ) : (
    <Text style={styles.icon}>{plant.icon}</Text>
  )}
  <TouchableOpacity
    style={[styles.moodBadge, { backgroundColor: getHealthBgColor(healthStatus.level) }]}
    onPress={() => setShowHealthDetail(true)}
    hitSlop={8}
    accessibilityLabel={getHealthMessage(healthStatus.level)}
    accessibilityRole="button"
  >
    <Text style={styles.moodEmoji}>{moodEmoji}</Text>
  </TouchableOpacity>
</View>

// Styles:
imageContainer: { position: 'relative', marginRight: spacing.md },
moodBadge: {
  position: 'absolute',
  bottom: -4,
  right: -4,
  width: 22,
  height: 22,
  borderRadius: 11,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: colors.card,  // ring gives visual separation from image
},
moodEmoji: { fontSize: 12 },
```

When `plant.imageUrl` is absent and the fallback `<Text>{plant.icon}</Text>` renders, the `imageContainer` wrapper's bounds are still the 48×48 box — the mood emoji anchors identically.

### Anti-Patterns to Avoid

- **`ReanimatedSwipeable`:** banned by Phase 13 + STATE.md + PITFALLS.md. iOS crash bug (#3720) on RNGH 2.28 + Reanimated 4.1.
- **`Gesture.Simultaneous(pan, longPress)`:** allows long-press to fire mid-swipe. Wrong UX. Use `Gesture.Race`.
- **Native `Modal` for Toast:** z-order conflict risk with PaywallModal (Phase 13 INFRA-04 lock — only one native `Modal` allowed; PaywallModal owns it). Toast must be `<Animated.View>` portal.
- **Tombstone field on `Plant`:** explicitly rejected by CONTEXT.md. Restore-on-undo is memory-only.
- **Right-swipe shortcuts:** out of scope. Phase 18 is left-only.
- **Toast wrapping `BottomSheetModal`:** wrong UX for transient feedback. Bottom sheets are interactive surfaces, toasts are auto-dismissing.
- **Multiple gesture handlers per row instead of composed `Gesture.Race`:** stacking handlers manually re-creates the conflict the composition API solves. Use `Gesture.Race`.
- **Long-press without haptic confirmation:** users can't tell if it fired. CONTEXT.md recommends `triggerHaptic('impactLight')`.
- **Affordance hint that fires every render:** must be once-per-user via AsyncStorage flag (CARD-04 lock).
- **Heart-symbol favorite remains on card face:** explicitly rejected by CONTEXT.md decisions table. Goes to long-press menu only.
- **Removing `PlantHealthBadge` file or `index.ts` re-export:** explicitly rejected — `MyPlantDetailModal:203` still consumes it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pan gesture handling | Custom `PanResponder` chain | `Gesture.Pan()` from RNGH | RNGH already installed; native-thread tracking; first-class composition with `Gesture.Race`. PanResponder is JS-thread, slower, no composition primitives. |
| Long-press detection | `setTimeout(..., 500)` race against `onPressOut` | `Gesture.LongPress().minDuration(500)` | Clean cancel semantics, race composition with Pan, no manual timeout cleanup, automatic worklet integration with Reanimated. |
| Spring/timing animations on translation | `Animated.spring` / `LayoutAnimation` | Reanimated v4 `withSpring` / `withTiming` | UI thread, no JS bridge crossings during gesture; already used in Skeleton.tsx + EducationalSection.tsx. |
| Swipe-vs-scroll conflict resolution | Manual touch threshold + cancel logic | `Gesture.Pan().activeOffsetX([-15, 15]).failOffsetY([-10, 10])` | Built into RNGH at native level; matches the canonical "horizontal action on vertical list" pattern (every Stripe/iOS-style mail-app swipe-list uses this exact config). |
| Either-or gesture composition | Mutual-exclusion booleans + manual `if (longPressActive) return` guards | `Gesture.Race(longPressGesture, panGesture)` | Race is the canonical "first activation wins, others cancelled" composition. Officially documented for the swipe-or-menu use case. |
| Haptic feedback | Direct `Haptics.impactAsync(...)` calls | `triggerHaptic('impactMedium')` from `src/utils/haptics.ts` | Phase 13 wrapper handles the void-return + try/catch + production-swallow + dev-warn pattern. Calling Haptics.* directly recreates the wrapper. |
| Bottom sheet for long-press menu | Custom popover absolute-positioned over card | `BottomSheetModal` from `@gorhom/bottom-sheet` | Provider already wrapped at App root. Built-in backdrop, snap points, dismiss-on-paywall integration via `useDismissOnPaywall`. Custom popovers re-implement these and conflict with PaywallModal z-order. |
| Auto-dismiss timer for Toast | Multiple `setInterval` ticks | One `setTimeout(durationMs)` cleared on unmount | Standard. Don't overengineer. |
| Toast queue management | Custom queue array + dedupe + priority | Single instance with `visible` boolean | Phase 18 needs ONE toast at a time (delete undo). Phase 22 may add a second consumer; if collisions become real, defer queue logic to that phase. YAGNI. |
| AsyncStorage flag for swipe-discovered | Custom file storage / SQLite | `AsyncStorage.setItem('@plantcard_swipe_discovered', 'true')` | One key, no schema, no migrations. Mirrors `MigrationTooltip` pattern. |
| Mood-emoji computation | New scoring algorithm | `calculatePlantHealth(...).level` already memoized at PlantCard.tsx:85-88 | The whole point of GAM-03 is to surface the existing health computation, not invent a new one. |

**Key insight:** Phase 18's job is to compose proven primitives (`Gesture.Pan`, `Gesture.Race`, `useSharedValue`, `triggerHaptic`, `BottomSheetModal`, existing `calculatePlantHealth`), not invent new ones. Every "should I build it custom?" answer is no.

## Common Pitfalls

### Pitfall 1: FlatList scroll vs. horizontal swipe gesture conflict

**What goes wrong:** Without `activeOffsetX` + `failOffsetY` config, every diagonal scroll triggers the swipe (Pan activates immediately on touch). On Android the conflict is worst — vertical scrolling with any horizontal jitter accidentally reveals or commits delete.

**Why it happens:** `Gesture.Pan()` defaults to activate on any movement. The list and the row both want the touch; without explicit X/Y thresholds the row wins.

**How to avoid:**
- Always set `.activeOffsetX([-15, 15])` — gesture FAILS to activate until horizontal movement exceeds 15px.
- Always set `.failOffsetY([-10, 10])` — if vertical motion exceeds 10px before horizontal threshold, gesture FAILS and FlatList consumes the touch.
- Always specify `Gesture.Pan()` with these BOTH set, not just one.

**Warning signs:**
- Vertical scroll on the list reveals the delete button on every diagonal stroke.
- Tested scroll feels "sticky" or "stuttery" especially on Android.

This is documented as PITFALLS.md MOD-4 ("Swipe-to-delete vs. scroll — gesture conflict in FlatList") — the activeOffsetX threshold of 15px is the canonical knob. Lower values (5px) cause false activations; higher (40px) make swipe feel sluggish.

### Pitfall 2: Haptic fires multiple times during a single swipe

**What goes wrong:** Without a one-shot guard, `onUpdate` calls `runOnJS(triggerHaptic)('impactMedium')` on every frame the threshold is crossed — meaning the user feels a buzz every ~16ms during the rest of the swipe.

**Why it happens:** Worklet `onUpdate` fires at frame rate (60fps); `runOnJS` doesn't dedupe.

**How to avoid:**
- Guard with a shared boolean: `const hapticFired = useSharedValue(false)`. Set true on first cross; reset on `onEnd`.
- Reset BEFORE the next gesture (in `onEnd`/`onFinalize`) so the next swipe can fire it again.

**Warning signs:**
- User reports "buzzing" during full-swipe instead of single thump.
- Battery drain on long swipe sessions.

### Pitfall 3: Long-press fires mid-swipe with `Gesture.Simultaneous`

**What goes wrong:** Composing Pan + LongPress with `Simultaneous` means a slow-start swipe (>500ms hold before motion) fires the menu while the swipe is animating. User sees both behaviors at once.

**Why it happens:** `Simultaneous` allows both gestures to activate concurrently — the API name is literal.

**How to avoid:**
- Use `Gesture.Race(longPress, pan)` — first activation wins, the other is cancelled.
- Optional: tune `Gesture.LongPress().minDuration(500)` upward (e.g., 600ms) if early-swipe long-press false positives surface in device testing.

**Warning signs:**
- Bottom-sheet menu pops while card is mid-animation.
- "Pull list down to refresh"-style gesture interferes with long-press.

### Pitfall 4: Optimistic delete confirms before undo timer elapses

**What goes wrong:** User taps "Deshacer" but the timeout has already fired and `pendingDelete` was cleared. Tap does nothing.

**Why it happens:** Race between user tap → state read and `setTimeout` → `setPendingDelete(null)`. JS event loop ordering is not guaranteed in React Native if the user taps right at the boundary.

**How to avoid:**
- Always `clearTimeout(dismissTimeoutRef.current)` BEFORE checking `pendingDelete` in `handleUndo`.
- Use a `ref` for `pendingDelete` if state-update timing matters; React state may not have re-rendered between user tap and the handler.
- Cleanup on unmount: `useEffect(() => () => { if (dismissTimeoutRef.current) clearTimeout(...); }, [])`.

**Warning signs:**
- Undo tap intermittently does nothing right at the 4s mark.
- Plant returns to list a frame later (state update lag).

### Pitfall 5: Swipe state leaks across rerenders / row recycling

**What goes wrong:** If a card is in the revealed-action position and the parent rerenders (e.g., FlatList recycles the row for a different plant after a delete), the new plant inherits the revealed offset.

**Why it happens:** `useSharedValue` is bound to the component instance. FlatList row recycling is OK in `react-native` core (each item in `data` triggers a fresh render via `keyExtractor`), but stale `translateX` shared-value can persist if the component is reused with a different `plant` prop.

**How to avoid:**
- Reset `translateX.value = 0` and `isRevealed.value = false` in a `useEffect` keyed on `plant.id`.
- Verify by deleting a plant near the top of the list and checking that no other plant card is left in revealed state.
- Test by toggling search query — recycled rows should reset.

**Warning signs:**
- After delete, another plant card is showing the red "Eliminar" reveal.
- After search filter, row offsets visibly persist.

### Pitfall 6: AsyncStorage key naming inconsistency

**What goes wrong:** New `@plantcard_swipe_discovered` key collides with future codebase conventions or fails to follow the established `@`-prefix pattern from `unknownPlantTracker` (`@unknown_plants`).

**Why it happens:** Codebase has TWO co-existing AsyncStorage key styles:
- `@`-prefix snake_case: `@unknown_plants` (Phase 12 services)
- Unprefixed kebab: `'plant-agenda-v2'`, `'migration-tooltip-seen-v1.1'`, `'daily-tips-seen'`, `'plant-agenda-v2.backup-pre-v1.1'`

There is NO project lint enforcing one style. Both work.

**How to avoid:**
- Pick one and document inline at top of the consuming file.
- Recommendation per CONTEXT.md: `@plantcard_swipe_discovered` (`@`-prefix matches the Phase 12 services convention; CONTEXT explicitly names this key shape).
- Optionally add to a shared `src/constants/storage.ts` if you want lint-style centralization (not required for Phase 18).

**Warning signs:**
- Reviewer asks "why @ vs no @?".
- Future phase introduces a key that collides.

### Pitfall 7: Mood-emoji circular background looks "noisy" on the plant image

**What goes wrong:** Small saturated circle on top of an image can clash with image colors and feel cluttered.

**Why it happens:** No border-stroke (white ring) means the badge blends into the image edge. Without contrast it's hard to read.

**How to avoid:**
- Add a 2px border using `colors.card` (white-ish) — see Pattern 4 example.
- Use `getHealthBgColor(level)` for the fill (lights green/yellow/orange/red) — these are designed to be soft.
- If still noisy in device test, drop the fill (transparent background) and rely on the emoji + 2px ring.
- Final size 22×22px with 12px emoji is the recommended starting point — adjust if cramped.

**Warning signs:**
- Mood emoji invisible on dark plant images.
- User reports card "feels busy".

### Pitfall 8: Toast appears under the FAB or the tab bar

**What goes wrong:** Hardcoded `bottom: 24` doesn't account for the tab bar height + safe-area insets + the `ExpandedFAB`. Toast renders behind them.

**Why it happens:** Toast positioning often defaults to "bottom of screen" without including the chrome above the screen.

**How to avoid:**
- Use `bottom: spacing.xxl + spacing.fabClearance` (where `fabClearance: 100` from `theme.ts`) — clears the FAB stack.
- For TodayScreen (no FAB) the same value works since both screens have the bottom tab bar at ~60+insets.bottom.
- If the toast lives at App-root level (not per-screen), use `useSafeAreaInsets()` + `tab bar height` calculation.

**Warning signs:**
- User reports toast visible only momentarily (covered by FAB before disappearing).
- Action button not tappable on iOS bottom edge.

### Pitfall 9: Tip relocation breaks 3-rung fallback chain

**What goes wrong:** When moving the tip italic from PlantCard to MyPlantDetailModal, the 3-rung fallback (`translatedEntry?.tip ?? plantType?.tip ?? ''`) at PlantCard.tsx:74-79 is dropped on the floor and the modal-side rendering only checks `strictDbEntry?.tip`.

**Why it happens:** PlantCard uses LEGACY/fuzzy `dbEntry` lookup (3-rung). Modal uses STRICT `strictDbEntry` (Phase 14). Different lookup semantics.

**How to avoid:**
- Preserve the fallback in the modal site: `const tip = translatedEntry?.tip ?? plantType?.tip ?? '';` then `{tip && <Text style={styles.tip}>{tip}</Text>}` inside the "¿Qué hacer?" section.
- Source the same `getTranslatedPlant(catalogEntry)` used at PlantCard.tsx:75 — the modal already imports `getCatalogEntry` and `getTranslatedPlant`.
- Render position: append AFTER `careAction.fixed`/`careAction.soilCheck`, BEFORE nutrients card. Use `styles.tip` (italic gray, fontSize 13) — port the existing style.
- Update `MyPlantDetailModal.tsx` empty-state path: if `!hasDiagnoses && !hasCareAction && !hasNutrients` AND `!tip`, show placeholder. If `tip` exists alone, render only it (no placeholder).

**Warning signs:**
- Custom plants without `databaseId` lose their tip entirely after the move.
- Plants with only a generic `plantType.tip` (e.g., onboarding-added) have no tip in modal.

### Pitfall 10: `useDismissOnPaywall` opt-in forgotten on long-press menu sheet

**What goes wrong:** If the long-press overflow menu uses `BottomSheetModal` and a paywall opens (e.g., user taps a premium-gated favorite-toggle), the menu stays open under the paywall — z-order conflict per PITFALLS.md MOD-6.

**Why it happens:** `useDismissOnPaywall(sheetRef)` is opt-in by design (Phase 13 lock). Forgetting it leaves the conflict in place.

**How to avoid:**
- If long-press menu uses `BottomSheetModal`, ALWAYS opt in:
  ```typescript
  const sheetRef = useRef<BottomSheetModal>(null);
  useDismissOnPaywall(sheetRef);
  ```
- If the menu uses `Alert.alert` action sheet instead, this pitfall is N/A (native action sheet auto-stacks).
- Smoke runner could grep for `useDismissOnPaywall` reference if BottomSheetModal is detected.

**Warning signs:**
- Paywall + bottom sheet visible simultaneously in dev test.
- iOS shows paywall on top, Android shows random z-order.

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Reanimated v4 worklet running on UI thread (existing in this codebase)

```typescript
// Source: src/components/Skeleton.tsx (Phase 13 INFRA-03)
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const x = useSharedValue(-1);
useEffect(() => {
  x.value = withRepeat(
    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
    -1,
    false
  );
}, [x]);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: x.value * 200 }],
}));
```

### Example 2: Existing BottomSheetModal usage (Phase 13 dev surface)

```typescript
// Source: src/screens/SettingsScreen.tsx:80, 555-565
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

const testSheetRef = useRef<BottomSheetModal>(null);

const closeTestSheet = () => testSheetRef.current?.dismiss();

// In render:
<BottomSheetModal ref={testSheetRef} snapPoints={['25%']}>
  <BottomSheetView style={{ flex: 1, padding: spacing.lg }}>
    <Text style={styles.sectionTitle}>{t('settings.devTestBottomSheet')}</Text>
    <TouchableOpacity style={styles.devButton} onPress={closeTestSheet}>
      <Text style={styles.devButtonText}>{t('settings.devTestBottomSheetClose')}</Text>
    </TouchableOpacity>
  </BottomSheetView>
</BottomSheetModal>

// To present from elsewhere: testSheetRef.current?.present();
```

### Example 3: Existing AsyncStorage flag pattern (model for `@plantcard_swipe_discovered`)

```typescript
// Source: src/components/MigrationTooltip.tsx
const TOOLTIP_SEEN_KEY = 'migration-tooltip-seen-v1.1';
type SeenMap = Record<string, true>;

const dismiss = async () => {
  setState('hidden');
  try {
    const raw = await AsyncStorage.getItem(TOOLTIP_SEEN_KEY);
    const seen: SeenMap = raw ? JSON.parse(raw) : {};
    seen[plantId] = true;
    await AsyncStorage.setItem(TOOLTIP_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Silent — tooltip will reappear on next open if write fails; acceptable
  }
};
```

For `@plantcard_swipe_discovered` the value is just a string flag — no per-plant map needed (CONTEXT.md locks "after the user has performed at least one swipe gesture" globally, not per-card).

### Example 4: Existing haptics fire-and-forget pattern

```typescript
// Source: src/utils/haptics.ts (Phase 13 INFRA-03)
import { triggerHaptic } from '../utils/haptics';

// Synchronous, void-returning, swallows all errors:
triggerHaptic('impactMedium');  // CARD-05 swipe completion
triggerHaptic('impactLight');   // CARD-02 long-press fire (recommendation)

// From a Reanimated worklet, must use runOnJS:
import { runOnJS } from 'react-native-reanimated';
const panGesture = Gesture.Pan().onUpdate((e) => {
  'worklet';
  if (/* threshold cross */) runOnJS(triggerHaptic)('impactMedium');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `PanResponder` from `react-native` | `Gesture.Pan()` from `react-native-gesture-handler` | RNGH 2.0 (Q4 2021); enforced in this codebase by Phase 13 lock | UI-thread tracking, native composition primitives. PanResponder still works but is an anti-pattern in any codebase that has RNGH installed. |
| `ReanimatedSwipeable` from RNGH | `Gesture.Pan()` direct + custom row | RNGH 2.28 + Reanimated 4.1 iOS crash bug (#3720); fix in 2.31.1 not yet pinned by Expo SDK 54 | Forced by the bug. ReanimatedSwipeable is convenient but unsafe under our pinned version. |
| `react-native-toast-message` etc. | Custom in-house Toast (this phase ships it) | User direction "uno solo en todo el ecosistema"; avoids 5th install | One primitive, owned, future-proofed for Phase 22. ~80-120 LOC. |
| Reanimated v3 `useAnimatedGestureHandler` | Reanimated v4 `Gesture.Pan().onUpdate(worklet)` | Reanimated v4 (mid-2024) | Cleaner API, automatic worklet scoping in gesture callbacks. Reanimated v4 is the SDK 54 default. |
| `Modal` from `react-native` for transient feedback | `<Animated.View>` portal/absolute-positioned | Long-standing — Modal is for native presentation | Avoids z-order conflict with PaywallModal (Phase 13 INFRA-04 lock — only ONE Modal at App root: PaywallModal owns it). |

**Deprecated/outdated:**
- `PanResponder`: deprecated in this codebase by Phase 13.
- `ReanimatedSwipeable`: BANNED by Phase 13 + STATE.md until version pin moves to >=2.31.1.
- Embedding `Alert.alert(...)` for delete confirmation: replaced by undo toast (CONTEXT.md locked).
- Conditional `PlantHealthBadge` on PlantCard: replaced by always-visible mood emoji (GAM-04).

## Open Questions

1. **Does FlatList virtualization correctly recycle the swipe state on row reuse?**
   - What we know: React's `keyExtractor={item.id}` typically forces a fresh component instance per id, so `useSharedValue` is recreated. But virtualization windows (offscreen rows) can sometimes reuse cells.
   - What's unclear: Whether `react-native@~latest` under Expo SDK 54 reuses `<PlantCard>` cell containers when `data` is short (e.g., 5 plants). Worth a device test in the Phase 18 manual checkpoint.
   - Recommendation: Add `useEffect(() => { translateX.value = 0; isRevealed.value = false; }, [plant.id])` defensively. See Pitfall 5.

2. **Should the long-press menu use `BottomSheetModal` or `Alert.alert` action sheet?**
   - What we know: CONTEXT.md says recommendation is `BottomSheetModal`, fallback is `Alert.alert`, custom popover discouraged.
   - What's unclear: Whether the BottomSheetModal at long-press warrants the additional surface area (`ref`, `present()`, `dismiss()`, `useDismissOnPaywall`, `BottomSheetView`, snap points) for a 3-item menu.
   - Recommendation at planning time: Default to `BottomSheetModal` since infrastructure is ready and v1.2 direction is modern bottom sheets. If LOC budget is tight, `Alert.alert` is the smaller-LOC fallback. Custom popover is discouraged.

3. **Should the affordance hint fire ONCE EVER (locked after first swipe) or repeatedly until user swipes?**
   - What we know: CONTEXT.md says "fired once on first mount; optionally repeated for subsequent app launches until the user has performed at least one swipe gesture."
   - What's unclear: "Optionally repeated" leaves Claude room. Repeated until first swipe gives discoverability over multiple sessions; once-ever is simpler.
   - Recommendation: "Repeated until first successful swipe" — matches CONTEXT spirit, larger discoverability surface, simple AsyncStorage flag flip on first commit/reveal.

4. **Where should the Toast component be portaled — per-screen or App-root?**
   - What we know: CONTEXT.md says "positioning, theming, animation choice, screen-reader announcement strategy — Claude's discretion at Phase 18 planning."
   - What's unclear: Per-screen (PlantsScreen + TodayScreen each render their own) vs. App-root (one instance + a context for triggering). Phase 22 will need it across many screens.
   - Recommendation at planning time: Per-screen for Phase 18 (simpler, the only consumer is the per-screen swipe-undo flow). Phase 22 can promote to App-root context if multi-screen consumers emerge. YAGNI today; same component shape works at either level.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no Jest/Vitest config); Phase-specific smoke runners under `scripts/` (Node CJS or MJS) |
| Config file | None — each phase ships a self-contained `scripts/phaseNN-smoke.{cjs,mjs}` |
| Quick run command | `node scripts/smoke-phase18.cjs` (or `.mjs` — matches Phase 13/14 convention) |
| Full suite command | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/smoke-phase18.cjs` (+ existing phase15/16/17 smoke runners as cross-phase regression sentinels) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARD-01 | Trash button JSX removed; `Alert.alert` deletion call site removed; `Gesture.Pan` reference present | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts `!source.includes("Alert.alert(\n        t('plantCard.deletePlant')")` AND `source.includes('Gesture.Pan')`) | ❌ Wave 0 |
| CARD-02 | Long-press JSX present; `Gesture.LongPress` reference; menu items (favorite/delete/edit) keys exist | unit (file-content + i18n keyset) | `node scripts/smoke-phase18.cjs` (asserts `Gesture.LongPress` ref + `t('plantCard.menu.favorite')` etc.) | ❌ Wave 0 |
| CARD-03 | `<Text style={styles.tip}>{tip}</Text>` block deleted from PlantCard.tsx; tip rendering present in MyPlantDetailModal `¿Qué hacer?` section | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts NO tip block in PlantCard.tsx; asserts catalog `tip` field reference present in MyPlantDetailModal `whatToDo` section) | ❌ Wave 0 |
| CARD-04 | `@plantcard_swipe_discovered` AsyncStorage key referenced; first-card affordance JSX in PlantsScreen | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts string literal `'@plantcard_swipe_discovered'` exists) | ❌ Wave 0 |
| CARD-05 | `triggerHaptic('impactMedium')` referenced in PlantCard.tsx; called from gesture worklet via `runOnJS` | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts `runOnJS(triggerHaptic)('impactMedium')` substring) | ❌ Wave 0 |
| GAM-03 | Mood emoji JSX present (one of 🌱/😊/😐/😟); always rendered (no `score < 80` gate); tap opens existing `PlantHealthDetail` | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts `'🌱'` etc. in PlantCard.tsx; asserts NO `showHealthBadge` variable; asserts `setShowHealthDetail(true)` in mood emoji handler) | ❌ Wave 0 |
| GAM-04 | `PlantHealthBadge` import + `showHealthBadge` gate + `<PlantHealthBadge ... />` block REMOVED from PlantCard.tsx; KEPT in MyPlantDetailModal:203 + index.ts:20 | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts `!plantCardSrc.includes("import { PlantHealthBadge }")` AND `myPlantDetailModalSrc.includes('PlantHealthBadge')` AND `indexSrc.includes("PlantHealthBadge")`) | ❌ Wave 0 |
| (additional) | `Toast.tsx` exists and is exported from `src/components/index.ts` | unit (file-content) | `node scripts/smoke-phase18.cjs` (asserts file existence + export line) | ❌ Wave 0 |
| (additional) | i18n keyset parity for new strings (Toast labels, menu items, mood-emoji a11y) | unit (key parity) | `npm run check:i18n-keys` | ✅ Existing |
| (additional) | TypeScript strict pass (no new `any` introduced; gesture types correct) | unit (compile) | `npx tsc --noEmit` | ✅ Existing |
| (manual) | Device test: swipe-vs-scroll on iOS + Android (Pitfall 1); long-press fires haptic; mood emoji visible on all 4 health states; toast undo restores plant; CARD-04 hint fires once | manual-only | Manual checkpoint plan (mirror Phase 13 Plan 13-03) | n/a |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit && node scripts/smoke-phase18.cjs` (~2-5s).
- **Per wave merge:** Above + `npm run check:i18n-keys` + cross-phase regression `node scripts/phase17-smoke.cjs` (catalog count must remain 118).
- **Phase gate:** Full suite green + manual device-test checkpoint signed off (mirrors Phase 13 INFRA-04 + Phase 14 Plan 14-08 pattern).

### Wave 0 Gaps
- [ ] `scripts/smoke-phase18.cjs` — file-content asserts for all 7 Phase 18 reqs + Toast export + i18n keys
- [ ] `npm run` script entry for `phase18-smoke` mirroring Phase 17 (`scripts/phase17-smoke.cjs`)
- [ ] `.gitignore` line for any temp stub directory if the runner needs runtime stubs (Phase 13/14 pattern; Phase 18 likely doesn't need this since it's file-content only)

*Manual-only checks (not automatable in this codebase):*
- Swipe-vs-scroll feel on real iOS + Android device (Pitfall 1 sensitivity tuning)
- Haptic feedback verification (simulator does not produce real haptics)
- Bottom-sheet z-order vs. PaywallModal coexistence (Pitfall 10 + PITFALLS.md MOD-6)
- Mood-emoji visual contrast on dark plant images (Pitfall 7)
- Toast positioning above tab bar + FAB (Pitfall 8)

## Sources

### Primary (HIGH confidence)
- **Local source files** — every assertion about existing code is verified against the working tree:
  - `src/components/PlantCard.tsx` (350 LOC; full read)
  - `src/components/PlantHealthBadge.tsx` (254 LOC; full read)
  - `src/components/MyPlantDetailModal.tsx` (692 LOC; relevant sections read at L88-92, L203, L244-326, L631)
  - `src/utils/plantHealth.ts` (282 LOC; full read)
  - `src/utils/haptics.ts` (50 LOC; full read)
  - `src/components/plant-detail/EducationalSection.tsx` (155 LOC; full read — Reanimated v4 reference impl)
  - `src/components/Skeleton.tsx` (53 LOC; full read — Reanimated v4 reference impl)
  - `src/screens/PlantsScreen.tsx` (372 LOC; full read)
  - `src/screens/SettingsScreen.tsx` L540-569 (BottomSheetModal usage)
  - `src/screens/TodayScreen.tsx` L380-410 (PlantCard usage in mode="tasks")
  - `src/hooks/useStorage.tsx` L360-420 (deletePlant, addPlant, updatePlant)
  - `src/hooks/useDismissOnPaywall.ts` (22 LOC; full read)
  - `src/components/MigrationTooltip.tsx` (126 LOC; full read — AsyncStorage flag reference impl)
  - `App.tsx` (provider hierarchy verification)
  - `src/theme.ts` (full read — token catalog)
  - `package.json` (version pins for RNGH 2.28.0, Reanimated 4.1.1, Bottom Sheet 5.2.13, expo-haptics 15.0.8)
- **Phase 18 CONTEXT.md** — `.planning/phases/18-plantcard-cleanup-mood-emoji/18-CONTEXT.md` (locked decisions + canonical refs)
- **Phase 13 CONTEXT.md** — `.planning/phases/13-gesture-bottom-sheet-infrastructure/13-CONTEXT.md` (gesture infra locks)
- **PITFALLS.md** — `.planning/research/PITFALLS.md` (MOD-3 Health badge hide; MOD-4 Swipe vs scroll; MOD-6 Bottom-sheet z-order; MIN-4 Long-press discoverability)
- **STACK.md** — `.planning/research/STACK.md` (RNGH version pin; ReanimatedSwipeable ban rationale)
- **STATE.md** — `.planning/STATE.md` (ReanimatedSwipeable ban; two-AppContent-paths discipline; haptic kind lock)
- **REQUIREMENTS.md** — `.planning/REQUIREMENTS.md` §"PlantCard Cleanup + Swipe (CARD)" + §"Gamification — Light Celebrations (GAM)"
- **CLAUDE.md** — design tokens, i18n discipline, voseo rule, two-AppContent-paths
- **React Native AccessibilityInfo docs** ([reactnative.dev/docs/accessibilityinfo](https://reactnative.dev/docs/accessibilityinfo)) — `accessibilityLiveRegion` + `accessibilityRole="alert"` semantics for Toast announcement
- **react-native-gesture-handler official docs** ([docs.swmansion.com](https://docs.swmansion.com/react-native-gesture-handler/docs/)) — `Gesture.Pan`, `Gesture.LongPress`, `Gesture.Race` composition

### Secondary (MEDIUM confidence — community + verified examples)
- **LogRocket "React Native Gesture Handler" tutorial** ([blog.logrocket.com](https://blog.logrocket.com/react-native-gesture-handler-tutorial-examples/)) — `Gesture.Race(longPress, pan)` example, verified against official docs
- **Daniel Merrill / Async "Swipe-To-Delete With Reanimated"** ([medium.com/async](https://medium.com/async/swipe-to-delete-with-reanimated-react-native-gesture-handler-bd7d66085aee)) — pattern reference (predates v3+ but confirms the threshold + spring-back idiom)
- **Roberto Tatasciore "Handling Pan And Scroll Gestures Simultaneously"** ([medium.com](https://medium.com/@taitasciore/handling-pan-and-scroll-gestures-simultaneously-and-gracefully-with-gesture-handler-2-reanimated-63f0d8f72d3c)) — `activeOffsetX` + `failOffsetY` pattern for FlatList row swipe
- **Bar Shaya / AT&T "Building a Custom Swipe to Delete Component"** ([medium.com/att-israel](https://medium.com/att-israel/building-a-custom-swipe-or-tap-to-delete-component-in-react-native-53c67defc8e5)) — confirmation of the "either reveal action or full-swipe-commit" hybrid pattern
- **gluestack-ui Toast** ([gluestack.io/ui/docs/components/toast](https://gluestack.io/ui/docs/components/toast)) — toast accessibility patterns (ARIA, screen reader)
- **@gorhom/bottom-sheet docs** ([gorhom.dev/react-native-bottom-sheet/modal](https://gorhom.dev/react-native-bottom-sheet/modal)) — `BottomSheetModal` ref + `present()` / `dismiss()` API

### Tertiary (LOW confidence — for context only)
- **GitHub issue #3720** (RNGH `ReanimatedSwipeable` iOS crash) — referenced via STACK.md; not directly verified for current status (locked ban regardless)
- **GitHub issue #3140** (`GestureDetector` + Pan inside FlatList Android scrolling break) — referenced; informs the failOffsetY mitigation. Confirms the conflict exists; the activeOffsetX/failOffsetY config is the canonical fix.
- **react-native-sonner / @backpackapp-io/react-native-toast** (npm) — surveyed for Toast API surface inspiration. Not used as a dep; locked by user direction "uno solo en todo el ecosistema".

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dep already installed and exercised in this codebase (Phase 13). Versions pinned.
- Architecture (gesture composition + Reanimated worklet): HIGH — patterns proven in Skeleton.tsx + EducationalSection.tsx + SettingsScreen test sheet.
- Pitfalls: HIGH — pitfalls 1, 3, 4, 5, 7, 8, 10 are all surfaced in PITFALLS.md, official docs, or have observable codebase precedent. Pitfalls 2, 6, 9 are derived from worklet/AsyncStorage/3-rung-fallback codebase patterns.
- Toast component (new build): MEDIUM-HIGH — no in-codebase precedent for Toast specifically, but every primitive (Reanimated v4 worklets, slide-in animation, `accessibilityLiveRegion`) has multiple references. Visual + a11y design is Claude's discretion at planning per CONTEXT.md.
- Open questions (1-4): MEDIUM — surfaced explicitly because each has a documented default but warrants a planner-time decision.

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 days — stable infra, locked decisions)
