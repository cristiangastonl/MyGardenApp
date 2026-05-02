# Technology Stack — v1.2 Recommendation-First Plant Guide

**Project:** My Garden Care (My Happy Garden)
**Milestone:** v1.2 Recommendation-First Plant Guide
**Researched:** 2026-05-01
**Mode:** Subsequent-milestone (additions/changes only vs v1.0/v1.1)
**Overall confidence:** MEDIUM-HIGH (bottom-sheet situation is nuanced, see critical warning)

## Bottom Line

**5 new npm packages are required.** v1.2 introduces gestures, haptics, bottom sheets, and animations that do not exist anywhere in the current dependency tree. The pet-toxicity and fertilization data features require no new packages — they are static catalog extensions plus a Perenual API field already available.

The one non-trivial decision is the **bottom-sheet / gesture-handler / reanimated triad**: Expo SDK 54 ships with `newArchEnabled: true` (confirmed in `app.json`) and therefore requires **react-native-reanimated v4** (v3 is legacy-only in SDK 54). `@gorhom/bottom-sheet` added v4 support in release 5.1.8 (July 2025) and the latest stable is 5.2.11. There are active bug reports on `ReanimatedSwipeable` crashing on iOS under v2.28; install gesture-handler at the expo-managed version (`~2.28.0`) and implement swipe via `Gesture API` directly rather than the `ReanimatedSwipeable` convenience component until the crash issue is resolved.

---

## New Packages — Required Additions

### Animation Foundation (unlocks bottom-sheet + skeleton + celebrations)

| Package | Install version | Purpose | Why |
|---------|----------------|---------|-----|
| `react-native-reanimated` | `~3.17.x` via `npx expo install` → resolves to v4 alias under SDK 54 | Drive bottom-sheet, skeleton shimmer, swipe gestures, and streak celebration animations | Expo SDK 54 bundles Reanimated v4 (New Architecture only). `newArchEnabled: true` is already set in `app.json`. Without reanimated, none of the UX-modernization theme is buildable. Currently missing from `package.json`. |
| `react-native-gesture-handler` | `~2.28.0` via `npx expo install` | Pan gestures for swipe-to-delete and swipe-to-complete | Peer dependency of `@gorhom/bottom-sheet` and required for any gesture-based list interaction. Already implicitly installed as a transitive dep of `@react-navigation/bottom-tabs` but not declared — must be explicit for direct use. |

**Installation note:** Always use `npx expo install react-native-reanimated react-native-gesture-handler` rather than `npm install`. Expo's resolver pins the exact patch versions compatible with SDK 54. Pinning the wrong patch is the root cause of most SDK 54 + reanimated v4 breakage reported in the wild.

### Bottom Sheet

| Package | Install version | Purpose | Why |
|---------|----------------|---------|-----|
| `@gorhom/bottom-sheet` | `^5.2.11` | Replace full-screen modals for short actions (delete confirm, photo-journal add, fertilization log) | The de-facto standard for bottom sheets in React Native. v5.1.8+ added Reanimated v4 support (released 2025-07-27). v5.2.11 is the current stable. No functional alternative with comparable API quality exists for the New Architecture. |

**Critical caveat:** Multiple bug reports (issues #2471, #2476, #2507, #2528 on the gorhom repo) show instability with specific version combinations. The library is actively patched — install at `^5.2.11` to receive patches. If a regression surface appears on device test, the fallback is a custom `Animated.View` + `PanResponder` bottom-sheet that covers the limited use-cases in scope (2–3 action sheets, not complex scrollable sheets).

### Haptic Feedback

| Package | Install version | Purpose | Why |
|---------|----------------|---------|-----|
| `expo-haptics` | via `npx expo install expo-haptics` | Tactile feedback on swipe-complete, swipe-delete, streak toast, task check-off | Official Expo package. Zero native configuration beyond the install. Provides `impactAsync(ImpactFeedbackStyle.Light/Medium/Heavy)` and `notificationAsync(NotificationFeedbackType.Success/Warning/Error)`. iOS uses Core Haptics engine; Android uses vibration. Latest npm version as of research: 55.0.14 (the 55.x line is cross-compatible with SDK 54 for Expo first-party packages). |

### Skeleton Loaders

No third-party library is recommended. Build custom skeleton components using the already-installed `expo-linear-gradient` + newly-installed `react-native-reanimated` v4.

**Why custom over a library:**
- `moti` (the most common skeleton library) has an open GitHub issue (#391) confirming it does NOT work with Reanimated v4 / Expo SDK 54 as of early 2026.
- `react-native-reanimated-skeleton` targets Reanimated v3 explicitly in its README.
- `react-native-skeleton-content` is unmaintained and targets v2.
- A skeleton shimmer is 30–40 LOC: a `View` with `expo-linear-gradient` as a child, animated horizontally with `useSharedValue` + `withRepeat(withTiming(...))` from Reanimated v4. This pattern is documented as working on Reanimated v4 (see Reanimated docs for `withTiming`).

**Confidence:** HIGH that custom is better here. The library ecosystem has not caught up to Reanimated v4.

### Celebration / Streak Animations

| Package | Install version | Purpose | Why |
|---------|----------------|---------|-----|
| `lottie-react-native` | `^7.3.6` | Streak celebration toast animation, empty-state illustrations | Lottie renders After Effects JSON animations natively at 60fps with no GPU overhead. Latest version 7.3.6 (last published Feb 2026). Version 7.3.1 is documented as working with Expo SDK 54 + RN 0.81. LottieFiles has thousands of free plant/garden/celebration assets. Alternative (CSS-style Reanimated sequence) works but authoring celebrations frame-by-frame in code is significantly more expensive than dropping in a Lottie JSON. |

**Alternative considered:** Pure Reanimated v4 CSS animations. Sufficient for simple scale/opacity toasts. Use this if Lottie adds unacceptable bundle weight or the designer doesn't provide Lottie files. The streak toast specifically can be a spring-scale + emoji emoji text with `withSpring`, keeping Lottie optional until proven needed.

---

## Existing Dependencies Used in New Ways

| Package | Already installed | New v1.2 use |
|---------|-------------------|--------------|
| `expo-linear-gradient` `~15.0.8` | Yes | Skeleton shimmer gradient layer |
| `@react-native-async-storage/async-storage` `^2.2.0` | Yes | Photo journal entries (array per plant), fertilization log entries, streak counter |
| `react-i18next` / `i18next` | Yes | New keys: toxicity labels, fertilization section headers, journal prompts, streak copy, empty states |
| `react-native-purchases` `^9.14.0` | Yes | Photo journal + streaks are free-tier features per PROJECT.md scope — no new gating, existing RevenueCat setup unchanged |
| Perenual API (via `plantKnowledgeService.ts`) | Yes (service exists) | `poisonous_to_pets` field is already in Perenual's species-details response. No new API call structure — add field extraction to the existing lookup. |

---

## Data Sources — Pet Toxicity

**Strategy: static catalog extension, no runtime API.**

The Perenual API's `/api/species/details/{id}` response includes a `poisonous_to_pets` boolean field (confirmed from Perenual's own docs). However, coverage is inconsistent for the 64-plant catalog because many entries use PlantNet/custom IDs that may not map cleanly.

**Recommended approach:**

1. **Primary:** ASPCA Animal Poison Control Center plant lists at `aspca.org/pet-care/animal-poison-control/cats-plant-list` and the dogs equivalent. These are curated by veterinary toxicologists and are the authoritative source for pet safety (over 1,000 plants listed). No API — scrape or cross-reference manually for the 64 catalog entries.

2. **Secondary:** Cornell University Department of Animal Science poisonous-plants database (`poisonousplants.ansci.cornell.edu`) for cross-reference on ambiguous cases.

3. **Result:** Add `petToxicity: { cats: 'toxic' | 'non-toxic' | 'unknown', dogs: 'toxic' | 'non-toxic' | 'unknown' }` to `PlantDBEntry` in `plantDatabase.ts`. Static values — no runtime lookup. All 64 entries can be manually classified in one focused session using ASPCA lists.

**Why not runtime Perenual lookup:** The catalog uses static `databaseId` values. Perenual's `poisonous_to_pets` field coverage is incomplete (particularly for LATAM species added in v1.1). Static curation is more reliable and zero latency.

**Confidence:** HIGH for the approach. MEDIUM for coverage completeness (some LATAM species like `heliconias` or `palo borracho` may not be in ASPCA's list — classify as `'unknown'` and surface that in the UI).

---

## Data Sources — Fertilization Cadences

**Strategy: static per-category baselines in `plantDatabase.ts`, no external dataset.**

No authoritative machine-readable dataset for per-species houseplant fertilization cadences exists as a public API or download. The horticultural sources available (RHS, UMN Extension, Savvy Gardening) express cadences as prose:

- Tropical foliage: every 4 weeks during growing season, none in dormancy
- Cacti/succulents: every 6–8 weeks growing season, none in cold
- Flowering plants: every 2 weeks during bloom, 4 weeks otherwise
- Ferns/shade plants: every 4–6 weeks, reduced in winter
- Orchids: every 2 weeks with quarter-strength fertilizer during growth

**Recommended approach:**

Add `fertilizationSchedule: { growingSeason: number, dormantSeason: number | null, unit: 'weeks' }` to `PlantDBEntry`. Populate per entry using the per-category baselines above as defaults, with per-species overrides for catalog entries that are well-documented (rose, orchid, citrus, etc.). This is the same static-curation approach used for watering cadences.

**No new dependency.** The UI reads from `plantDatabase.ts` and the seasonal utility (`getEffectiveSeason`) already in `src/utils/season.ts` (added in v1.1) to determine whether to show growing or dormant cadence.

**Confidence:** MEDIUM. The per-category baselines are consistent across horticultural sources. Per-species accuracy for all 64 entries requires a manual curation pass.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `moti` | Does not work with Reanimated v4 / Expo SDK 54 (open issue #391, unresolved as of May 2026) | Custom Reanimated v4 animations or Lottie |
| `react-native-reanimated-skeleton` | Targets Reanimated v3 explicitly; will conflict with v4 peer dep | Custom skeleton with `expo-linear-gradient` + Reanimated v4 |
| `react-native-skeleton-content` | Unmaintained (last commit 2022), targets Reanimated v2 | Same as above |
| `react-native-swipeable` / `react-swipeable` | Web-only or outdated React Native wrappers | `ReanimatedSwipeable` from gesture-handler or custom Gesture API |
| `ReanimatedSwipeable` component (from gesture-handler) | Active iOS crash bug reported with RNGH 2.28.0 + Reanimated 4.1.0 (issue #3720). Fix landed in 2.31.1 but that version is not pinned by SDK 54's expo install resolver | Implement swipe via the lower-level `Gesture.Pan()` API from gesture-handler, which is not affected by the `ReanimatedSwipeable` crash |
| `@shopify/flash-list` | Only needed if `FlatList` performance is measured as a bottleneck. 64 plants is well within `FlatList`'s comfort zone. | Native `FlatList` — already in use |
| `react-native-haptic-feedback` (community package) | Redundant with `expo-haptics` which is the official Expo-SDK-integrated solution | `expo-haptics` |
| A full charting library (`victory-native`, `recharts`) for streak display | The streak display is a celebration toast + counter, not a data chart | Reanimated spring animation + emoji/text |
| LottieFiles/dotlottie-react-native | The `.dotlottie` container format isn't necessary for the simple celebration JSON files we'll use | `lottie-react-native` with standard `.json` files |
| `spacetime`, `luxon`, `date-fns` | Not needed for streak calculation (simple difference in epoch days) | Inline math, same as v1.1 season utilities |

---

## Installation Commands

```bash
# Install all new packages through Expo's resolver for SDK 54-compatible patch versions
npx expo install react-native-reanimated react-native-gesture-handler

# Bottom sheet (use npm after expo install resolves peer deps)
npx expo install @gorhom/bottom-sheet

# Haptics (first-party Expo package)
npx expo install expo-haptics

# Lottie (optional — install only when designer provides Lottie files)
npx expo install lottie-react-native
```

**Do not** use `npm install` directly for any of the above — Expo's resolver ensures the patch version is compatible with SDK 54's Reanimated v4 and New Architecture.

After installing reanimated and gesture-handler, add the GestureHandlerRootView wrapper to `App.tsx` (required for gesture-handler to function in New Architecture mode):

```tsx
// App.tsx — wrap AppContent with GestureHandlerRootView
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// ...
<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider>
    {/* existing provider tree */}
  </SafeAreaProvider>
</GestureHandlerRootView>
```

The `BottomSheetModalProvider` from `@gorhom/bottom-sheet` should be placed inside `GestureHandlerRootView` but outside `StorageProvider` so modals can overlay everything:

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <BottomSheetModalProvider>
    <SafeAreaProvider>
      <StorageProvider>
        {/* ... */}
      </StorageProvider>
    </SafeAreaProvider>
  </BottomSheetModalProvider>
</GestureHandlerRootView>
```

---

## Version Compatibility Matrix

| Package | Version | Expo SDK 54 | RN 0.81 | New Arch | Confidence |
|---------|---------|-------------|---------|---------|------------|
| `react-native-reanimated` | v4.x (via expo install) | Required — v3 is legacy-only | Yes | Required | HIGH |
| `react-native-gesture-handler` | `~2.28.0` | Yes | Yes | Yes | HIGH |
| `@gorhom/bottom-sheet` | `^5.2.11` | Yes (5.1.8+ added v4 support) | Yes | Yes | MEDIUM (active bugs) |
| `expo-haptics` | `~14.x` (expo install resolves) | Yes | Yes | Yes | HIGH |
| `lottie-react-native` | `^7.3.6` | Yes (7.3.1 documented working) | Yes | Yes | MEDIUM |

---

## Architectural Decisions for v1.2

### Bottom-Sheet Usage Scope

Limit bottom-sheet adoption to 3 use-cases in v1.2:
1. Fertilization log action (confirm + frequency nudge)
2. Photo journal entry (caption + save/discard)
3. Plant delete confirmation (from PlantCard swipe or detail menu)

Do NOT convert the diagnosis chat, paywall, or plant-add flows to bottom sheets. These are full-screen by design and the existing modal pattern is correct for them.

### Gesture Scope

Implement swipe gestures via the `Gesture.Pan()` API (not `ReanimatedSwipeable`) to avoid the iOS crash:
- `PlantCard`: swipe-left reveals delete; threshold at 80px → haptic medium + delete confirmation bottom-sheet
- Task items in Hoy: swipe-right reveals complete; threshold at 60px → haptic light + task completion

Long-press on `PlantCard` (200ms) → show action menu bottom-sheet (edit, favorite, delete). This avoids tap-target conflicts with the existing card-press-to-detail navigation.

### Skeleton Scope

Skeleton loaders are needed only for:
- Catalog browse screen (if implemented as a separate tab in v1.2 — check FEATURES.md)
- Plant detail educational modal while Perenual data loads
- Photo journal while images load from AsyncStorage

All three are thin shimmer bars (not complex bone layouts) — the custom 30-LOC implementation is sufficient.

### Streak Data Model

Streaks live in AsyncStorage as part of the existing `AppData` envelope (schema v3). No new persistence layer. Shape:

```ts
interface StreakData {
  currentStreak: number;       // days with at least one task completed
  longestStreak: number;
  lastActivityDate: string;    // ISO date string, compared vs today
}
```

Attach to `AppData` root (not per-plant). Per-plant streaks create exponential UI complexity — the celebration toast fires on global streak milestones (3, 7, 14, 30 days).

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| New Architecture requirement | HIGH | `app.json` confirms `newArchEnabled: true`; SDK 54 docs confirm Reanimated v4 is required |
| `expo-haptics` | HIGH | First-party Expo package, zero compatibility risk, simple API |
| `lottie-react-native` | MEDIUM | v7.3.1 documented working with SDK 54; v7.3.6 is current; no breaking changes reported |
| `react-native-gesture-handler` | MEDIUM-HIGH | v2.28 is the SDK 54 managed version; `ReanimatedSwipeable` has a crash but `Gesture API` is unaffected |
| `@gorhom/bottom-sheet` | MEDIUM | v5.1.8+ supports Reanimated v4; active bug reports exist but latest 5.2.11 includes patches; monitor device-test |
| Skeleton (custom) | HIGH | Pattern is well-documented; Reanimated v4 `withRepeat`/`withTiming` API is stable |
| Pet toxicity data | MEDIUM | ASPCA is authoritative but requires manual cross-reference for 64 entries; some LATAM species may not appear |
| Fertilization cadences | MEDIUM | Per-category baselines are consistent across horticultural sources; per-species accuracy requires curation pass |

---

## Sources

- [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54) — New Architecture default, Reanimated v4 requirement — HIGH
- [Expo New Architecture guide](https://docs.expo.dev/guides/new-architecture/) — `newArchEnabled` default behavior — HIGH
- [Reanimated compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) — v4 = New Arch only — HIGH
- [Reanimated migration 3.x → 4.x](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) — migration guide — HIGH
- [@gorhom/bottom-sheet npm](https://www.npmjs.com/package/@gorhom/bottom-sheet) — v5.2.11 current, v5.1.8 release date — HIGH
- [gorhom/bottom-sheet release v5.1.8](https://github.com/gorhom/react-native-bottom-sheet/releases/tag/v5.1.8) — Reanimated v4 support added 2025-07-27 — HIGH
- [gorhom/bottom-sheet issue #2528](https://github.com/gorhom/react-native-bottom-sheet/issues/2528) — won't open after Expo 54 upgrade — MEDIUM (ongoing)
- [gorhom/bottom-sheet issue #2600](https://github.com/gorhom/react-native-bottom-sheet/issues/2600) — feature request for v4 support (resolved in 5.1.8) — HIGH
- [react-native-gesture-handler npm](https://www.npmjs.com/package/react-native-gesture-handler) — v2.31.1 latest, v2.28 is SDK 54 managed — HIGH
- [ReanimatedSwipeable crash issue #3720](https://github.com/software-mansion/react-native-gesture-handler/issues/3720) — iOS crash with RNGH 2.28 + Reanimated 4.1 — MEDIUM
- [ReanimatedSwipeable docs](https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/) — component API — HIGH
- [expo-haptics npm](https://www.npmjs.com/package/expo-haptics) — latest version — HIGH
- [Haptics - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/) — API reference — HIGH
- [lottie-react-native npm](https://www.npmjs.com/package/lottie-react-native) — v7.3.6 last published Feb 2026 — HIGH
- [moti issue #391](https://github.com/nandorojo/moti/issues/391) — Expo 54 / Reanimated 4 incompatibility — HIGH (rejection rationale)
- [ASPCA Toxic and Non-Toxic Plants](https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants) — pet toxicity reference — HIGH
- [ASPCA cats plant list](https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list) — authoritative cat toxicity data — HIGH
- [Cornell poisonous plants database](https://poisonousplants.ansci.cornell.edu/) — secondary toxicity reference — HIGH
- [Perenual API docs](https://perenual.com/docs/api/logs) — `poisonous_to_pets` field confirmed — MEDIUM
- [Savvy Gardening: Houseplant Fertilizer Basics](https://savvygardening.com/houseplant-fertilizer/) — fertilization cadence baselines — MEDIUM
- [Planet Houseplant: Fertilising schedule](https://planethouseplant.com/how-to-organise-your-house-plant-fertilising-schedule/) — per-category baselines — MEDIUM

---
*Stack research for: My Garden Care v1.2 Recommendation-First Plant Guide*
*Researched: 2026-05-01*
