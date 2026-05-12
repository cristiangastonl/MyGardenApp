---
phase: 18-plantcard-cleanup-mood-emoji
plan: 03
subsystem: ui
tags: [react-native, reanimated-v4, react-native-gesture-handler, gesture-pan, gesture-longpress, plantcard, mood-emoji, swipe-to-delete, jsx-restructure]

# Dependency graph
requires:
  - phase: 13-gesture-bottom-sheet-infrastructure
    provides: Gesture.Pan() + Reanimated v4 + triggerHaptic('impactMedium'/'impactLight') + GestureHandlerRootView at App root
  - phase: 18-plantcard-cleanup-mood-emoji (Plan 01)
    provides: i18n keys (plantCard.deleteButton, plantCard.moodA11y.{excellent,good,warning,danger})
  - phase: 18-plantcard-cleanup-mood-emoji (Plan 02)
    provides: tip relocation already landed in MyPlantDetailModal (PlantCard tip lookup safe to remove)
provides:
  - PlantCard.tsx restructured to 5-element budget (image+mood / name+subtitle / 1 task / water badge)
  - Gesture.Pan swipe-to-delete with reveal action layer + full-swipe shortcut
  - Gesture.LongPress.minDuration(500) composed via Gesture.Race
  - Always-visible mood-emoji overlay (Greg-style pet badge) on the 48×48 image thumbnail
  - One-shot haptic guard (hapticFired shared boolean) firing impactMedium at COMMIT_THRESHOLD
  - Pitfall 5 row-recycling reset (useEffect keyed on plant.id)
  - 2 new prop callbacks: onLongPress(plant) + onSwipeCommitted() for Plan 04 to wire menu + undo + affordance hint
  - PlantHealthBadge import + showHealthBadge gate + JSX block REMOVED from PlantCard (modal usage + index re-export + file UNTOUCHED — GAM-04 PlantCard-only scope)
affects: [18-plantcard-cleanup-mood-emoji Plan 04, 22-celebrations-haptics-streak]

# Tech tracking
tech-stack:
  added: []  # No new deps; all primitives ship from Phase 13 INFRA
  patterns:
    - "Gesture.Race(longPressGesture, panGesture) — Pitfall 3 (Race not Simultaneous)"
    - "activeOffsetX([-15,15]) + failOffsetY([-10,10]) — Pitfall 1 (FlatList scroll co-existence)"
    - "hapticFired shared boolean reset on onEnd — Pitfall 2 (one-shot haptic guard)"
    - "useEffect reset keyed on plant.id — Pitfall 5 (FlatList row-recycling state leak)"
    - "Mood-emoji 22×22 circular badge with 2px borderColor=colors.card ring + getHealthBgColor(level) fill — Pitfall 7"
    - "imageContainer relative-positioned wrapper anchors absolute-positioned badge to bottom-right of 48×48 image"
    - "handleCommitDelete + handleLongPressFire JS-thread bridge functions wrapped in runOnJS()"
    - "onToggleFavorite prop preserved-but-unused in card body (consumed by Plan 04 long-press menu)"
    - "Two-half restructure pattern (subtraction commit then addition commit) for heavy single-file plans"

key-files:
  created: []
  modified:
    - "src/components/PlantCard.tsx (350→474 LOC, +124 net; +282/-92 across 2 commits)"

key-decisions:
  - "Used colors.dangerText (#7a2d2d) for the reveal-action background — established precedent at WeatherAlerts.tsx:223; colors.danger does NOT exist in theme.ts. Did not introduce a new token."
  - "RESTING_REVEAL_X = -88px (matches actionLayer width). Reveal threshold 30%, commit threshold 70% of measured cardWidth (Pitfall 6 — measured not hardcoded). CARD_WIDTH_FALLBACK = 360px until first onLayout."
  - "mood badge fills with getHealthBgColor(level) — pastel theme tints (successBg/successLight/warningBg/dangerBg) — provides per-level visual semantics matching the emoji glyph."
  - "onToggleFavorite kept in PlantCardProps interface (not removed) so existing TodayScreen + PlantsScreen consumers compile unchanged. Plan 04's long-press menu invokes it."
  - "onDelete prop semantics re-purposed (NOT renamed to onCommitDelete) — chose simpler diff path; documented inline. Plan 04 wires the new optimistic-delete + undo flow to the same prop name."
  - "spring physics tuned to damping:18, stiffness:240 — feels snappy without overshoot for both reveal and spring-back paths."
  - "Withholding spring on commit path — used withTiming(-cardWidth.value, {duration:200}) for off-screen exit so commit feels deliberate (vs spring-y which would feel like a 'maybe')."

patterns-established:
  - "Two-half subtraction-then-addition commit pattern for heavy single-file restructures (~180 LOC delta)"
  - "Gesture.Race composition to prevent pan-and-long-press conflicts (canonical lock for swipeable list rows)"
  - "Greg-style mood-badge overlay anchored on imageContainer (relative position) — reusable for future on-thumbnail badges (toxicity Phase 19, fertilize Phase 20)"
  - "Action layer renders UNDER translating Animated.View foreground via outer cardContainer relative position + actionLayer absolute right-anchored 88px"

requirements-completed: [CARD-01, CARD-02, CARD-03, CARD-05, GAM-03, GAM-04]

# Metrics
duration: 5min
completed: 2026-05-08
---

# Phase 18 Plan 03: PlantCard Cleanup + Mood Emoji Restructure Summary

**PlantCard.tsx restructured to 5-element layout with Gesture.Pan swipe-to-delete + Gesture.LongPress trigger + always-visible mood-emoji overlay; legacy Alert.alert + trash button + favorite heart + inline tip + score-gated PlantHealthBadge all removed; 16 smoke-runner SKIPs flipped to PASS in 2 atomic commits.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-08T20:30:12Z
- **Completed:** 2026-05-08T20:35:34Z
- **Tasks:** 2
- **Files modified:** 1 (PlantCard.tsx)

## Accomplishments

- Removed PlantHealthBadge import + score gate + JSX block (GAM-04 PlantCard-only scope; modal/index/file all preserved)
- Removed Alert.alert delete confirmation + trash button + favorite heart inline + tip render + 4 orphan styles + 5 unused-only-in-card imports
- Added Gesture.Pan() with hybrid threshold model (reveal at 30%, commit at 70% of measured cardWidth)
- Added Gesture.LongPress() composed via Gesture.Race (Pitfall 3 — NOT Simultaneous)
- Added 22×22 mood-emoji circular badge overlay anchored bottom-right of the 48×48 image, fill = getHealthBgColor(level), ring = 2px colors.card
- Added one-shot hapticFired guard (Pitfall 2) — runOnJS(triggerHaptic)('impactMedium') fires once at COMMIT_THRESHOLD
- Added Pitfall 5 row-recycling reset (useEffect keyed on plant.id)
- Added onLongPress + onSwipeCommitted prop callbacks for Plan 04 to host the menu container + CARD-04 affordance hint
- Re-purposed onDelete prop semantics from Alert-confirmed → swipe-commit (kept name; Plan 04 wires undo)
- 16 smoke-phase18 SKIPs flipped to PASS (PASS=37→52); only 4 SKIPs remain (all Plan-04-owned: CARD-02 menu containers + CARD-04 affordance hint)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove all deletion + favorite heart + tip + PlantHealthBadge from PlantCard** — `a293bc1` (refactor) — +5/-70 LOC, file compiles, visual layer intentionally incomplete pending Task 2
2. **Task 2: Add gesture layer + mood emoji overlay + reveal action; expose onLongPress + onSwipeCommitted props** — `f60011c` (feat) — +282/-92 LOC, full visual + gesture layer landed

**Plan metadata:** _(pending — final docs commit)_

## Files Created/Modified

- `src/components/PlantCard.tsx` — 350 → 474 LOC (+124 net). Restructured to 5-element layout with outer cardContainer wrapping a sibling actionLayer (revealed under) + GestureDetector-wrapped Animated.View foreground (translates under gesture). Mood-emoji overlay on imageContainer. PlantHealthDetail modal mount preserved at the bottom of cardContainer.

## Decisions Made

- **colors.dangerText for action red:** colors.danger does NOT exist in theme.ts. Established precedent at WeatherAlerts.tsx:223 uses `backgroundColor: colors.dangerText` (#7a2d2d) for vivid-red alert dots. Used the same token here. No new token introduced (per plan §"theme tokens" lock).
- **RESTING_REVEAL_X = -88px:** matches the 88px actionLayer width so the reveal lines up flush with the action button. Reveal at 30% / commit at 70% of measured cardWidth (CARD_WIDTH_FALLBACK = 360 until first onLayout fires).
- **getHealthBgColor(level) for mood-badge fill:** provides per-level pastel-tint semantic backing matching the glyph (successBg green for excellent/good, warningBg yellow, dangerBg pink). 2px colors.card ring isolates the badge from the image edge.
- **onToggleFavorite preserved in interface:** existing TodayScreen + PlantsScreen consumers pass this prop today; removing it would force consumer-side updates outside this plan's surface. Plan 04's long-press menu invokes it. Card body destructures but does not use — accepted under no-linter codebase convention.
- **onDelete name kept (not renamed to onCommitDelete):** simpler diff path. Inline JSDoc clarifies the re-purposed semantics. Plan 04 wires the optimistic-delete + Toast undo flow to the same prop name.
- **withTiming for commit exit (not withSpring):** off-screen exit at 200ms feels deliberate; spring would feel non-committal on a destructive action.
- **Two-half subtraction-then-addition commits:** plan explicitly designed Task 1 = removals (file must compile but visual incomplete) and Task 2 = additions. Pattern reusable for any future heavy single-file restructure (~180+ LOC delta).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comment text contained literal "PlantHealthBadge" causing Task 1 acceptance grep to fail**
- **Found during:** Task 1 acceptance verification
- **Issue:** Initial comment "Phase 18 (GAM-04): PlantHealthBadge gate removed — replaced..." contained the word "PlantHealthBadge", failing acceptance criterion `grep -c "PlantHealthBadge" src/components/PlantCard.tsx returns 0`. The acceptance gate is intentionally strict to ensure the literal symbol appears nowhere in PlantCard (in any context — import, JSX, comment).
- **Fix:** Reworded comment to "legacy score-based health-badge gate removed" — preserves explanatory intent without the literal symbol.
- **Files modified:** src/components/PlantCard.tsx
- **Verification:** `grep -c "PlantHealthBadge" src/components/PlantCard.tsx` returns 0; tsc clean.
- **Committed in:** a293bc1 (Task 1 commit, before commit was finalized)

**2. [Rule 4 → resolved without checkpoint - Token Selection] colors.danger does not exist in theme.ts**
- **Found during:** Task 2 (action layer styling)
- **Issue:** Plan §Step F lists `colors.danger` for the reveal-action background. theme.ts has `dangerBg`, `dangerText`, `dangerBorder` but no plain `danger`. Plan §"theme tokens used" warns: "If any token is missing surface in summary; do NOT introduce new ones."
- **Fix:** Inspected codebase — `WeatherAlerts.tsx:223` uses `backgroundColor: colors.dangerText` for vivid-red alert dots (established precedent). Used the same token. Did NOT introduce a new token.
- **Files modified:** src/components/PlantCard.tsx (single styles.actionLayer.backgroundColor)
- **Verification:** Smoke runner CARD-01 PASS; visual semantics preserved (deep-red destructive action with white text).
- **Committed in:** f60011c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 minor strictness comment fix, 1 token-substitution surfaced as decision)
**Impact on plan:** Zero scope creep. Both fixes within-task; no architectural changes.

## Pitfalls Handled

| # | Pitfall | Handling |
|---|---------|----------|
| 1 | Pan gesture conflicts with FlatList vertical scroll | `activeOffsetX([-15,15])` + `failOffsetY([-10,10])` |
| 2 | Haptic buzzes throughout swipe (not one-shot) | `hapticFired` shared boolean; reset on `onEnd`; check before fire in `onUpdate` |
| 3 | Long-press and pan compete (Simultaneous → both fire) | `Gesture.Race(longPressGesture, panGesture)` — first-to-activate wins |
| 5 | FlatList row recycling leaks swipe state to recycled plant | `useEffect(() => { translateX.value=0; isRevealed.value=false; hapticFired.value=false; }, [plant.id])` |
| 7 | Mood emoji visually merges with image edge | 2px `borderColor: colors.card` ring + `getHealthBgColor(level)` fill |

## Issues Encountered

None — plan executed in order with two minor in-task auto-fixes (see Deviations).

## Smoke Runner Pass Count Delta

- **Wave 0 baseline (Plan 00):** PASS=37, FAIL=0, SKIP=19
- **After Plan 02:** PASS=37, FAIL=0, SKIP=19 (no overlap with Plan 03 sentinels)
- **After Plan 03 (this plan):** PASS=52, FAIL=0, SKIP=4 (+15 vs Plan 02 baseline ; +16 net SKIP→PASS flips because GAM-03.moodEmoji.tap-opens-existing-PlantHealthDetail re-PASSed — it had degraded between Task 1 and Task 2)

**Remaining 4 SKIPs (all owned by Plan 04 — file-disjoint):**
- CARD-02.longPress.bottomSheet-on-PlantsScreen
- CARD-02.longPress.bottomSheet-on-TodayScreen
- CARD-04.affordanceHint.async-storage-flag
- CARD-04.affordanceHint.state-or-prop

## GAM-04 Preservation Verification

All 3 STRICT (non-skippable) regression sentinels GREEN:
- `src/components/MyPlantDetailModal.tsx` line 212 — `<PlantHealthBadge healthStatus={healthStatus} />` UNTOUCHED (grep -c = 2 — import + usage)
- `src/components/index.ts` line 20 — `export { PlantHealthBadge } from './PlantHealthBadge';` UNTOUCHED (grep -c = 1)
- `src/components/PlantHealthBadge.tsx` file EXISTS (not deleted)

## Next Phase Readiness

- **Plan 18-04 unblocked:** PlantCard exposes onLongPress(plant) + onSwipeCommitted() callbacks; onDelete prop semantics re-purposed to swipe-commit. Plan 04's screens (PlantsScreen + TodayScreen) can now host the BottomSheetModal long-press menu container, the optimistic-delete + Toast undo flow, and the CARD-04 first-card affordance hint without further PlantCard touches.
- **No blockers.**

## Self-Check: PASSED

Verified after writing summary:
- File created: `.planning/phases/18-plantcard-cleanup-mood-emoji/18-03-SUMMARY.md` ✓
- Task 1 commit `a293bc1` exists in git log ✓
- Task 2 commit `f60011c` exists in git log ✓
- `src/components/PlantCard.tsx` modified (474 LOC) ✓
- Smoke runner PASS=52 / FAIL=0 / SKIP=4 ✓
- tsc 0 errors ✓
- check:i18n-keys 118 catalog ids PASS ✓
- phase17-smoke regression PASS 54/54 ✓

---
*Phase: 18-plantcard-cleanup-mood-emoji*
*Completed: 2026-05-08*
