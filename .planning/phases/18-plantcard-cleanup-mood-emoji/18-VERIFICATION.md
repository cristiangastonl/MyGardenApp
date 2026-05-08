---
phase: 18-plantcard-cleanup-mood-emoji
verified: 2026-05-08T21:05:00Z
status: human_needed
score: 5/5 truths verified at code level — 38-item device-test checklist deferred to v1.2 milestone-end backlog (user-approved per CLAUDE.md milestone-end batching pattern)
re_verification: null
human_verification:
  - test: "Manual device verification — Phase 18 38-item checklist (9 blocks: A smoke / B haptic / C long-press menu / D mood emoji / E Toast positioning / F FlatList recycling / G mode parity / H persistence / I i18n parity)"
    expected: "All 7 Phase 18 requirement IDs (CARD-01..05, GAM-03/04) confirmed on iOS + Android dev clients per 18-VALIDATION.md §Manual-Only Verifications"
    why_human: "Cannot verify programmatically — haptic feedback strength, gesture feel, BottomSheetModal Z-order vs PaywallModal, Reanimated slide-in tightness, FlatList row-recycling under load, persistence across kill/relaunch all require real-device exercise"
    deferred_to: "v1.2 milestone-end device-test session (user explicitly approved 2026-05-08, logged in /Users/gaston/.claude/projects/-Users-gaston-Documents-Personal-MiJardinApp/memory/v1_2_test_backlog.md §Phase 18). Treat as deferred-but-acknowledged for Phase 18 closure."
---

# Phase 18: PlantCard Cleanup + Mood Emoji Verification Report

**Phase Goal:** PlantCard is reduced to 5 visual elements; swipe-to-delete and long-press menu replace the in-card trash button; mood emoji is always visible as the health affordance
**Verified:** 2026-05-08T21:05:00Z
**Status:** human_needed (code level: PASSED; device-only verifications: deferred-but-acknowledged per user approval to v1.2 milestone-end backlog)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth                                                                                                                                                                  | Status     | Evidence                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Swiping left on a PlantCard reveals a delete affordance; completing the swipe triggers a haptic and a confirmation step — the plant is not instantly deleted          | ✓ VERIFIED | `Gesture.Pan()` with `activeOffsetX([-15,15])` + `failOffsetY([-10,10])` (PlantCard.tsx L138-169); reveal action layer L189-198; one-shot haptic via `runOnJS(triggerHaptic)('impactMedium')` guarded by `hapticFired` (L149-152); commit calls `onDelete` → screen `handleCommitDelete` queues 4s Toast undo (PlantsScreen.tsx L183-195) — plant restorable for 4s, NOT instant terminal delete |
| 2   | Long-pressing a PlantCard reveals an overflow menu with favorite, delete, and edit options                                                                              | ✓ VERIFIED | `Gesture.LongPress().minDuration(500)` composed via `Gesture.Race(longPressGesture, panGesture)` (PlantCard.tsx L171-180); `BottomSheetModal` rendered in PlantsScreen.tsx L419-441 + TodayScreen.tsx L627-649 with Favorite/Edit/Delete TouchableOpacities + `useDismissOnPaywall(longPressSheetRef)` Pitfall 10 |
| 3   | Every PlantCard shows a mood emoji (🌱/😊/😐/😟) derived from health score — always visible, not conditional on score threshold                                          | ✓ VERIFIED | `moodEmojiByLevel` table (PlantCard.tsx L26-31) maps every HealthLevel; mood badge rendered unconditionally inside `imageContainer` L218-237; no score gate (`showHealthBadge`/`score < 80` removed); tap opens existing `PlantHealthDetail` via `setShowHealthDetail(true)` |
| 4   | The legacy conditional PlantHealthBadge (shown only when score < 80) is removed from PlantCard                                                                          | ✓ VERIFIED | `grep -c "PlantHealthBadge" src/components/PlantCard.tsx` = 0; `grep -c "showHealthBadge" src/components/PlantCard.tsx` = 0; STRICT preservation sentinels green: PlantHealthBadge.tsx file exists (Feb 16, untouched), `index.ts` re-export at L20, `MyPlantDetailModal.tsx` L212 usage UNTOUCHED |
| 5   | First-render swipe affordance hint is shown on the first card in PlantsScreen (dismissible)                                                                              | ✓ VERIFIED | `@plantcard_swipe_discovered` AsyncStorage flag (PlantsScreen.tsx L138, 145, 177); `showSwipeHint` state + `hintTranslateX` shared value + chevron-peek `withSequence(-12px, 0px)` animation L158-173; gated by `index === 0 && showSwipeHint` in `renderPlant` L268-291; flips to dismissed via `handleSwipeDiscovered` wired to `onSwipeCommitted` callback; mode-parity divergence — TodayScreen does NOT replicate per CONTEXT.md lock |

**Score:** 5/5 truths verified at code level

### Required Artifacts

| Artifact                                          | Expected                                                                                                | Status     | Details                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/smoke-phase18.cjs`                       | File-content smoke runner with SKIP placeholders flipped to PASS post Plans 02-04                        | ✓ VERIFIED | 159 LOC; PASS=56 / FAIL=0 / SKIP=0 at exec; 3 STRICT GAM-04 sentinels green                                                                          |
| `src/components/Toast.tsx`                        | Reanimated v4 slide-in Toast with auto-dismiss + optional action button + accessibilityLiveRegion       | ✓ VERIFIED | 86 LOC; `useSharedValue` + `useAnimatedStyle` + `withTiming` + `Easing.out(Easing.cubic)`; `accessibilityLiveRegion="polite"` + `accessibilityRole="alert"`; bottom: spacing.xxl + spacing.fabClearance clears tab+FAB |
| `src/components/index.ts`                         | Toast re-export + PlantHealthBadge re-export preserved                                                   | ✓ VERIFIED | L34: `export { Toast } from './Toast';`; L20: `export { PlantHealthBadge } from './PlantHealthBadge';` UNTOUCHED                                       |
| `src/components/PlantCard.tsx`                    | 5-element layout + Gesture.Pan + Gesture.LongPress + Gesture.Race + always-visible mood emoji + scoped PlantHealthBadge removal | ✓ VERIFIED | 474 LOC; image+mood / name+subtitle / 1 task / water badge layout; `Gesture.Race(longPressGesture, panGesture)` L180; mood emoji on imageContainer L218-237; tip/Alert.alert/trash/favorite-heart/PlantHealthBadge ALL removed |
| `src/components/MyPlantDetailModal.tsx`           | Plant tip italic relocated to '¿Qué hacer?' section with 3-rung fallback + PlantHealthBadge L212 usage UNTOUCHED | ✓ VERIFIED | `relocatedTranslatedEntry?.tip ?? relocatedPlantType?.tip ?? ''` at L106; render at L289-290; `hasRelocatedTip` extends emptyWhatToDo gate L261-262; `<PlantHealthBadge healthStatus={healthStatus} />` at L212 UNTOUCHED |
| `src/screens/PlantsScreen.tsx`                    | Toast portal + undo flow + long-press BottomSheetModal + CARD-04 first-card hint                         | ✓ VERIFIED | Imports L13, 14-21, 26, 34, 40; pendingDelete/toastVisible state L127-129; longPressSheetRef + useDismissOnPaywall L133-135; SWIPE_DISCOVERED_KEY + showSwipeHint + hintTranslateX L138-181; full handler set + BottomSheetModal + Toast JSX L419-451 |
| `src/screens/TodayScreen.tsx`                     | Toast portal + undo flow + long-press BottomSheetModal (no affordance hint per mode parity)              | ✓ VERIFIED | BottomSheetModal/Toast/useDismissOnPaywall imported L14, L20; addPlant added to useStorage destructure L74; same handlers (handleCommitDelete/handleUndo/handleLongPress/handleMenu*) and JSX shape as PlantsScreen MINUS CARD-04 hint state |
| i18n keys (EN+ES locale parity)                   | 13 Phase 18 keys (plantCard.menu.*, menuSheet.*, deleteHint, undoToast.*, moodA11y.*) in BOTH locales    | ✓ VERIFIED | All 13 keys parity-confirmed by smoke runner (26 PASSes — 13 keys × 2 locales); `npm run check:i18n-keys` PASS — 118 catalog ids verified; voseo strings (Deslizá / eliminada / Deshacer) follow Phase 14-17 conventions |

### Key Link Verification

| From                                          | To                                          | Via                                                              | Status   | Details                                                                                                                                |
| --------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/PlantCard.tsx`                | `src/utils/haptics.ts`                      | `runOnJS(triggerHaptic)('impactMedium')` in pan worklet onUpdate | WIRED    | L19 import + L151 worklet call inside one-shot guard (`hapticFired` shared boolean); also L175 `runOnJS(triggerHaptic)('impactLight')` on long-press |
| `src/components/PlantCard.tsx`                | `src/utils/plantHealth.ts`                  | `calculatePlantHealth(...).level` → `moodEmojiByLevel` mapping  | WIRED    | L18 import + L103-106 `useMemo(calculatePlantHealth(...))` + L109 `moodEmojiByLevel[healthStatus.level]`                                |
| `src/components/PlantCard.tsx`                | `src/components/PlantHealthDetail.tsx`      | mood emoji TouchableOpacity → `setShowHealthDetail(true)`        | WIRED    | L228-236 mood badge `onPress={() => setShowHealthDetail(true)}` → `<PlantHealthDetail visible={showHealthDetail} ... />` rendered L310-315 |
| `src/components/PlantCard.tsx (worklet)`      | PlantsScreen + TodayScreen                  | `onLongPress(plant)` callback fired via `runOnJS` from worklet  | WIRED    | L134-136 `handleLongPressFire` → `onLongPress?.(plant)`; L176 `runOnJS(handleLongPressFire)()` inside `Gesture.LongPress().onStart`; consumed by both screens (`onLongPress={handleLongPress}`) |
| `src/screens/PlantsScreen.tsx`                | `src/components/Toast.tsx`                  | Toast component import + render at screen level                  | WIRED    | L34 `Toast` import via `'../components'`; rendered L444-451 with `actionLabel={t('plantCard.undoToast.undoLabel')}` + `onAction={handleUndo}` + `durationMs={4000}` + `onDismiss={handleToastDismissed}` |
| `src/screens/PlantsScreen.tsx`                | `src/hooks/useStorage.tsx`                  | `deletePlant + addPlant + updatePlant` for undo flow + favorite  | WIRED    | L55-56, 74 destructure; `handleCommitDelete` calls `deletePlant(plant.id)` L187; `handleUndo` calls `addPlant(pendingDelete)` L203; `handleMenuFavorite` calls `updatePlant(longPressTarget.id, { favorite: !... })` L229 |
| `src/screens/PlantsScreen.tsx`                | `@react-native-async-storage/async-storage` | `@plantcard_swipe_discovered` flag for CARD-04 dismissal         | WIRED    | L12 import; L145 `getItem` on mount; L177 `setItem('true')` after first successful onSwipeCommitted                                    |
| PlantsScreen + TodayScreen                    | `src/hooks/useDismissOnPaywall.ts`          | Hook on long-press BottomSheetModal sheetRef (Pitfall 10)        | WIRED    | PlantsScreen L26 + L135 `useDismissOnPaywall(longPressSheetRef)`; TodayScreen L20 + L248 `useDismissOnPaywall(longPressSheetRef)`     |
| `src/components/MyPlantDetailModal.tsx`       | `src/data/plantDatabase.ts` + `constants.ts` | `getCatalogEntry + getTranslatedPlant + getPlantTypes` for tip   | WIRED    | L16 `getPlantTypes` import; L104-106 3-rung fallback chain `relocatedTranslatedEntry?.tip ?? relocatedPlantType?.tip ?? ''`            |

### Requirements Coverage

| Requirement | Source Plan(s)         | Description                                                                                        | Status      | Evidence                                                                                                                                              |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| CARD-01     | 18-01, 18-03, 18-04, 18-05 | Trash button removed; swipe-left via `Gesture.Pan()`                                                | ✓ SATISFIED | Truth #1 evidence; smoke runner PASSes (CARD-01.swipe.gestureRef-and-alert-removed, gestureDetector-wraps-card, activeOffsetX-15, failOffsetY-10, trash-emoji-removed) |
| CARD-02     | 18-01, 18-03, 18-04, 18-05 | Long-press overflow menu (favorite, delete, edit)                                                   | ✓ SATISFIED | Truth #2 evidence; smoke runner PASSes (gestureRef + race-composition + bottomSheet-on-PlantsScreen + bottomSheet-on-TodayScreen); useDismissOnPaywall opted in both screens |
| CARD-03     | 18-01, 18-02, 18-03, 18-05 | 5-element budget; tip relocated to MyPlantDetailModal                                                | ✓ SATISFIED | Truth #3+#4 partial; PlantCard renders only image/mood, name+subtitle, 1 task, water badge — favorite heart, tip italic, PlantHealthBadge all removed; tip relocated with 3-rung fallback intact |
| CARD-04     | 18-01, 18-04, 18-05    | Swipe affordance hint on first card in PlantsScreen, dismissible                                    | ✓ SATISFIED | Truth #5 evidence; smoke runner PASSes (async-storage-flag + state-or-prop); chevron-peek animation + AsyncStorage persistence |
| CARD-05     | 18-01, 18-03, 18-05    | Haptic at swipe-completion threshold                                                                 | ✓ SATISFIED | Truth #1 partial; smoke runner PASSes (haptic.runOnJS-impactMedium + haptic.one-shot-guard); `hapticFired` shared boolean prevents per-frame re-fire (Pitfall 2) |
| GAM-03      | 18-01, 18-03, 18-05    | Mood emoji always visible (🌱/😊/😐/😟); tap opens PlantHealthDetail modal                          | ✓ SATISFIED | Truth #3 evidence; smoke runner PASSes (all-four-glyphs-present + level-mapping-table + tap-opens-existing-PlantHealthDetail) |
| GAM-04      | 18-01, 18-03, 18-05    | Mood emoji REPLACES PlantHealthBadge on PlantCard; component preserved everywhere else (modal etc.) | ✓ SATISFIED | Truth #4 evidence; smoke runner PASSes (import-removed-from-PlantCard + score-gate-removed); 3 STRICT GAM-04 preservation sentinels green: file exists + index re-export + modal usage |

**Plan-frontmatter requirement coverage:** All 7 requirement IDs listed in REQUIREMENTS.md for Phase 18 (CARD-01..05, GAM-03/04) appear in at least one plan's `requirements:` field. No orphaned requirements.

### Anti-Patterns Found

| File                                  | Line | Pattern                       | Severity | Impact |
| ------------------------------------- | ---- | ----------------------------- | -------- | ------ |
| `src/screens/PlantsScreen.tsx`        | 307-308 | `placeholder=`, `placeholderTextColor=` | (none — false positive) | Legitimate `<TextInput placeholder>` props for the search bar; not stub markers |

No TODO / FIXME / XXX / HACK / "coming soon" / empty-implementation / console.log-only patterns found in any of the 5 modified files (PlantCard.tsx, Toast.tsx, MyPlantDetailModal.tsx, PlantsScreen.tsx, TodayScreen.tsx).

### Human Verification Required

The 38-item Phase 18 device-test checklist (9 blocks A-I covering smoke, haptic, long-press menu, mood emoji, Toast positioning, FlatList recycling, mode parity, persistence, i18n parity) was explicitly approved by the user (2026-05-08) for deferral to the v1.2 milestone-end batch session per CLAUDE.md milestone-end batching pattern.

**Status:** Deferred-but-acknowledged. Logged at `/Users/gaston/.claude/projects/-Users-gaston-Documents-Personal-MiJardinApp/memory/v1_2_test_backlog.md` §"Phase 18 — PlantCard Cleanup + Mood Emoji" with HARD-FAIL vs SOFT-FAIL classifiers per item.

**Items requiring real-device exercise (not classifiable as code-level gaps):**

1. **Block B — Haptic strength on real iOS + real Android device** (Apple/Google haptic engines — only real hardware can confirm `'impactMedium'` translates to a satisfying COMMIT confirmation buzz).
2. **Block C — BottomSheetModal Z-order vs PaywallModal coexistence** (`useDismissOnPaywall` opt-in is wired, but the Phase 13 PaywallModal Z-order issue tracked in v1.2 backlog still needs platform-level coexistence verification).
3. **Block D — Mood emoji visual contrast on dark plant images** (Pitfall 7 — the 2px `colors.card` ring + `getHealthBgColor(level)` fill is in code; real photo backdrop verification is the gate).
4. **Block E — Toast positioning above tab bar + FAB** (Pitfall 8 — `bottom: spacing.xxl + spacing.fabClearance` = 124px in code; real-device-pixel verification is the gate).
5. **Block F — FlatList row recycling under load** (Pitfall 5 — `useEffect` reset keyed on `plant.id` is wired; the 20+ plants fast-scroll exercise needs a real device).
6. **Block H — Persistence across kill/relaunch** (`@plantcard_swipe_discovered` AsyncStorage write is wired; real kill+relaunch verifies it stays dismissed).
7. **Block I — i18n parity in Spanish UI** (catalog parity verified by `npm run check:i18n-keys`; visual ES UI confirmation pending).

Per user approval, these are NOT classified as Phase 18 closure gaps. They remain ship-blockers for the v1.2 store submission window, NOT for Phase 18 closure.

### Toolchain Gate Status (Re-run at Verification Time)

| Gate                                  | Result                                  |
| ------------------------------------- | --------------------------------------- |
| `npx tsc --noEmit`                    | exit 0 (no errors)                      |
| `npm run check:i18n-keys`             | PASS — 118 catalog ids verified across en/es plants.json |
| `node scripts/smoke-phase18.cjs`      | `[Phase 18 smoke] PASS=56 FAIL=0 SKIP=0` |
| `npm run smoke:phase17`               | `[phase17-smoke] PASS 54/54` (cross-phase regression intact) |

### Gaps Summary

**No code-level gaps.** All 5 ROADMAP success criteria are satisfied at the code level with concrete artifacts and verified key links. All 7 requirement IDs (CARD-01..05, GAM-03/04) reach a closing PASS state. All 3 STRICT GAM-04 preservation sentinels (PlantHealthBadge file existence + components/index.ts re-export + MyPlantDetailModal:212 usage) remain green.

**Deferred-but-acknowledged:** The 38-item device-test checklist is parked in the v1.2 milestone-end backlog per user approval. Verifier classifies this as `human_needed` (not `gaps_found`) per orchestrator instruction — the item is logged, classified, and scheduled, just not yet exercised on hardware.

---

_Verified: 2026-05-08T21:05:00Z_
_Verifier: Claude (gsd-verifier)_
