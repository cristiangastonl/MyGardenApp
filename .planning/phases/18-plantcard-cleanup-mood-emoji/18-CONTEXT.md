# Phase 18: PlantCard Cleanup + Mood Emoji - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce `src/components/PlantCard.tsx` to a 5-element card (image + name + 1 task or none + water badge + mood emoji). Replace the always-rendered trash button with `Gesture.Pan()` swipe-to-delete + a long-press overflow menu (favorite, delete, edit). Replace the conditional `PlantHealthBadge` (rendered today only when `score < 80`) with an always-visible mood emoji (🌱/😊/😐/😟) derived from existing `calculatePlantHealth(plant).healthLevel`. Add a first-render swipe-affordance hint on the first card in `PlantsScreen`.

Phase 18 also ships a generic app-wide `<Toast/>` primitive — used here for the "Eliminar / Deshacer" undo flow, and reused unchanged by Phase 22 (GAM-01 celebration toasts) and any future ecosystem use.

**In scope (REQUIREMENTS):** CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, GAM-03, GAM-04.

**Both render modes targeted:** `PlantCard` is used in `mode="tasks"` (Hoy / TodayScreen) AND `mode="collection"` (PlantsScreen). Gesture changes (swipe, long-press) apply to BOTH modes. The CARD-04 first-card swipe-affordance hint is `PlantsScreen`-only per literal spec wording.

**Out of scope (deferred):**
- Right-swipe shortcuts (e.g., mark-watered) — separate phase.
- Removing `PlantHealthBadge` from `MyPlantDetailModal:203` — locked PlantCard-only scope this phase.
- Building a dedicated edit-plant modal — long-press "Edit" reuses existing `MyPlantDetailModal` (or whatever Claude picks at planning time within existing surfaces).
- Phase 22 celebration toasts (GAM-01) — Phase 18 ships the Toast primitive; Phase 22 wires the celebration use-case.
- Pet toxicity badge on PlantCard (TOX-03) — Phase 19.
- Fertilize task badge on PlantCard (FERT-06) — Phase 20.

</domain>

<decisions>
## Implementation Decisions

### 5-Element Budget (CARD-03)

The "5 elements" per REQUIREMENTS literal: **image + name + 1 task (or none) + water badge + mood emoji**. The following decisions resolve what counts vs. what stays as "metadata, not an element":

- **Favorite heart** ❤️/🤍 — REMOVED from card face. Moves to the long-press overflow menu only (CARD-02 lists favorite as a menu item; menu becomes the single-source-of-truth toggle). Inline heart deleted from the `nameRow`. `onToggleFavorite` prop stays on `PlantCard`; called from inside the menu only.
- **Subtitle (category text — `PlantCategory.name` under the plant name)** — KEPT on card. Counts as metadata attached to the name (chip-like label), not a separate element. Disambiguates plants with the same nickname.
- **Diagnosis badge** (🩺 / `TRACKING_STATUS_CONFIG[status].emoji`) — KEPT on card, conditional render unchanged. Renders only when `hasActiveDiagnosis || activeTrackingStatus !== 'resolved'`. Sits in `headerRight`. Important at-a-glance signal for the recommendation-first pivot.
- **Water-needed border** (`cardNeedsWater` style — green border when `needsWaterToday && !waterDone`) — KEPT. Visual state of the card itself, not a separate element.
- **Tip (italic gray text)** — REMOVED from `PlantCard` per CARD-03. Relocated into `MyPlantDetailModal` "¿Qué hacer?" section. The `tip` variable (catalog `translatedEntry.tip` / `plantType.tip`) and the `<Text style={styles.tip}>` block at `PlantCard.tsx:162` are deleted.
- **Trash button** 🗑️ — REMOVED entirely (CARD-01). The `TouchableOpacity` block at `PlantCard.tsx:144-158` and its `Alert.alert(...)` confirmation are deleted; deletion is now driven by swipe + long-press menu.

### Swipe-to-Delete UX (CARD-01, CARD-05)

- **Threshold model: HYBRID — reveal at small swipe + full-swipe shortcut.**
  - Small left-swipe (~25-40% of card width) reveals a red "Eliminar" action button stuck under the card. User taps the revealed button to commit.
  - Full left-swipe past a higher threshold (~70% of card width) skips the revealed button entirely and goes straight to commit.
  - Both paths fire the haptic at the threshold-cross moment per CARD-05.
  - Concrete percentages are Claude's discretion at planning; the model is what's locked.
- **Confirmation: UNDO-TOAST (delete instantly + 4s undo).** No `Alert.alert`, no bottom-sheet confirmation. After commit, plant is removed from the visible list immediately and a Toast appears at the bottom with "Tomate eliminado" + "Deshacer" action. Tapping Deshacer restores the plant. After 4 seconds the toast auto-dismisses and the deletion is final.
- **Persistence: OPTIMISTIC storage write + restore-on-undo.** The plant is removed from `AsyncStorage` immediately via `useStorage.deletePlant(id)`. The deleted plant object is held in component memory (e.g., `pendingDelete: Plant | null` state) until the toast dismisses or undo fires. On undo, the held plant is re-inserted via `useStorage.addPlant(...)` — no schema changes, no `deletedAt` tombstone field. Trade-off accepted: if the app closes mid-window the deletion is final (no restore on next launch); the 4s window is short enough that this is acceptable.
- **Mid-swipe release (below threshold): SPRING BACK to closed.** Card animates back to its resting position with a Reanimated spring. No revealed button stays open.
- **Direction: LEFT-ONLY.** Right-swipe is a no-op in Phase 18. Mark-watered shortcut and other right-swipe ideas are deferred to a future phase.
- **Haptic (CARD-05):** `triggerHaptic('impactMedium')` from `src/utils/haptics.ts` (Phase 13 lock — `Haptics.ImpactFeedbackStyle.Medium`) fires once at the threshold-cross moment per swipe gesture. Not called on partial-swipe releases. Not called on undo.
- **`Gesture.Pan()` only — `ReanimatedSwipeable` is BANNED** per Phase 13 lock + STATE.md + `.planning/research/PITFALLS.md` (iOS crash bug with RNGH 2.28 + Reanimated 4.1).

### Generic Toast Component (NEW — app-wide primitive)

User direction quoted verbatim:
> "El toast deberia ser el mismo en todo el ecosistema, si tenemos uno hay que reutilizarlo y luego si no me gusta podemos diseñar uno para que se use en TODA la experiencia y la app."

- **One generic `<Toast/>` component** lives at `src/components/Toast.tsx` (or similar canonical path — Claude's discretion at planning) and is the single Toast primitive across the app.
- **API surface (minimum):** message text + optional action button label + optional action callback + auto-dismiss duration (default ~4 seconds for undo, configurable).
- **Phase 18 consumer:** the swipe-to-delete undo flow.
- **Phase 22 consumer (forward-looking):** GAM-01 celebration toasts ("¡Vas bien! 🌱"). Phase 22 imports the same component — no duplicate component, no duplicate API.
- **Visual + a11y polish (positioning, theming, animation choice, screen-reader announcement strategy)** — Claude's discretion at Phase 18 planning. If the design proves dissatisfying, iteration happens at the component-level once and propagates everywhere — that is the point of having one primitive.
- **Locale parity:** "Eliminar"/"Deshacer" strings land in EN + ES `common.json` (voseo for ES — "Deshacer" is voseo-neutral and OK).

### Mood Emoji (GAM-03, GAM-04)

- **Slot: OVERLAY on the plant image thumbnail** (Greg-style pet badge). Mood emoji renders as a small circular badge anchored at the bottom-right corner of the existing 48×48 image (`styles.plantImage`). When `plant.imageUrl` is absent and the fallback `<Text>{plant.icon}</Text>` renders instead, the mood emoji still anchors to the same bounding box. Specific size, offset, and circle-background styling are Claude's discretion at planning.
- **Source: existing `calculatePlantHealth(plant, today, weather, diagnoses, currentSeason).level`.** No new computation; reuse the memo already present at `PlantCard.tsx:85-88`. Map to emoji: `excellent` → 🌱, `good` → 😊, `warning` → 😐, `danger` → 😟 (frozen by REQUIREMENTS GAM-03).
- **Always rendered.** Unlike the legacy `PlantHealthBadge` (`showHealthBadge = healthStatus.score < 80` at `PlantCard.tsx:91`), the mood emoji renders for ALL health levels including `excellent`. The conditional gate is removed.
- **Tap: opens existing `PlantHealthDetail` modal** (preserves today's behavior). Reuses the existing `showHealthDetail` state and `<PlantHealthDetail visible=... />` mount at `PlantCard.tsx:212-218`. The mood emoji's `TouchableOpacity` triggers `setShowHealthDetail(true)`. No new modal.
- **Diagnosis + mood conflict resolution:** BOTH render side-by-side. Mood emoji on the image-overlay slot; diagnosis badge in `headerRight` (its current slot). The two communicate distinct facts — "how the plant is feeling per health metrics" vs. "an open diagnosis is being tracked" — and conflating them would lose information for the recommendation-first pivot. Card may feel busy when both fire; that's acceptable because the case is rare in practice.
- **Accessibility — Claude's discretion.** Recommendation: state-based label using existing `getHealthMessage(level)` from `src/utils/plantHealth.ts` (already i18n-keyed) — e.g., `accessibilityLabel={getHealthMessage(level)}`. If new strings are needed they land in `health.*` namespace with EN+ES locale parity (voseo for ES).
- **`PlantHealthBadge` deprecation scope:**
  - REMOVED from `PlantCard.tsx` (the import at line 13, the `showHealthBadge` gate at line 91, and the `<PlantHealthBadge ... />` block at lines 138-143).
  - **NOT** removed from `MyPlantDetailModal.tsx:203` — that usage stays untouched in Phase 18.
  - **NOT** removed from `src/components/index.ts:20` re-export — modal still consumes it.
  - The `PlantHealthBadge` component file itself is NOT deleted.

### Long-press Overflow Menu (CARD-02 — Claude's discretion at planning)

- **Items:** favorite (toggle), delete, edit. Per CARD-02.
- **Container:** Claude picks at planning. Recommendation: `BottomSheetModal` from `@gorhom/bottom-sheet` (Phase 13 infra ready; consistent with v1.2 modal direction). `Alert.alert` action sheet acceptable as a smaller-LOC fallback. Custom popover discouraged.
- **Edit target:** Claude picks at planning. Recommendation: opens existing `MyPlantDetailModal` — its current "Tus ajustes" section (Phase 14 EDU-01) is already the canonical edit surface. Building a separate edit modal is out of scope for Phase 18.
- **Haptic on long-press fire:** Claude's discretion. `triggerHaptic('impactLight')` is the natural choice (Phase 13 utility ships this).
- **`useDismissOnPaywall(sheetRef)` hook** (Phase 13 lock) — opt in if the menu uses `BottomSheetModal`, mirrors the Phase 14 pattern.

### Affordance Hint UX (CARD-04 — Claude's discretion at planning)

- **Spec:** First-render swipe-affordance hint on the first card in `PlantsScreen` (only — not in `mode="tasks"`).
- **Shape:** Claude picks at planning. Default recommendation: brief chevron-peek animation that reveals the red "Eliminar" action button by ~10-15px and springs back, fired once on first mount; optionally repeated for subsequent app launches until the user has performed at least one swipe gesture.
- **Dismissal mechanism:** Claude picks at planning. Recommendation: AsyncStorage flag `@plantcard_swipe_discovered` set to `'true'` after the user completes their first successful swipe (any direction past threshold or any reveal-then-tap). Once set, the affordance hint never fires again on any device for that user.
- **Iconography:** Claude picks. Recommendation: chevron-style reveal of the action button itself (no separate text label needed — the revealed "Eliminar" text serves as the label).
- **Scope:** First card in the sorted list per `PlantsScreen.tsx:114-127` sort order (favorites first, then identity).

### Mode parity

- **`mode="tasks"` (Hoy / TodayScreen):** swipe-to-delete + long-press menu apply identically. Mood emoji renders identically. No CARD-04 affordance hint here.
- **`mode="collection"` (PlantsScreen):** swipe-to-delete + long-press menu + mood emoji + CARD-04 affordance hint.
- The same `PlantCard` component instance handles both modes — no per-mode forking of the gesture layer.

### Smoke / Verification (Claude's discretion)

- A `scripts/smoke-phase18.cjs` (or similar) runner mirroring the Phase 13/14/15/16/17 shape is recommended. Coverage candidates:
  - `PlantCard.tsx` no longer imports `PlantHealthBadge` and no longer contains `Alert.alert` deletion call site.
  - `PlantCard.tsx` contains `Gesture.Pan` reference and `triggerHaptic('impactMedium')` reference.
  - `PlantCard.tsx` no longer contains the `<Text style={styles.tip}>` rendering block.
  - `MyPlantDetailModal.tsx` contains the relocated tip (regex match on the i18n key or styled tip block in "¿Qué hacer?" section).
  - `<Toast/>` component file exists and is exported.
  - i18n keys for "Eliminar" / "Deshacer" / mood-emoji a11y labels (if added) exist in BOTH `en/common.json` and `es/common.json`.
- File-content asserts via `readFileSync` likely sufficient — Phase 18 is JSX restructure + new component, not runtime catalog logic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 18 spec (REQUIREMENTS + ROADMAP)
- `.planning/REQUIREMENTS.md` §"PlantCard Cleanup + Swipe (CARD)" — CARD-01..05 locked spec.
- `.planning/REQUIREMENTS.md` §"Gamification — Light Celebrations (GAM)" — GAM-03, GAM-04 mood-emoji + badge-deprecation locks. (GAM-01, GAM-02, GAM-05 are Phase 22 — out of scope here.)
- `.planning/ROADMAP.md` §"Phase 18: PlantCard Cleanup + Mood Emoji" — goal + 5 success criteria.

### Locked decisions from prior phases
- `.planning/phases/13-gesture-bottom-sheet-infrastructure/13-CONTEXT.md` §"Decisions" — `Gesture.Pan()` is the only swipe primitive (`ReanimatedSwipeable` banned); `triggerHaptic(kind)` API at `src/utils/haptics.ts`; `BottomSheetModalProvider` at App root; `useDismissOnPaywall(sheetRef)` hook; manual checkpoint pattern for device tests.
- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — pattern for restructuring a modal with sectioned content (relevant when relocating the tip into "¿Qué hacer?").

### Project + state
- `.planning/PROJECT.md` — v1.2 Recommendation-First Plant Guide milestone context, Key Decisions table.
- `.planning/STATE.md` §"Decisions" — `ReanimatedSwipeable` ban; two-AppContent-paths discipline (PaywallModal scope, NOT BottomSheet); GAM split (03/04 here vs. 01/02/05 in Phase 22); `Haptics.ImpactFeedbackStyle.Medium` is the locked swipe-completion haptic.
- `CLAUDE.md` — design system tokens (`colors.*`, `spacing.*`, `borderRadius.*`, `shadows.*`, fonts); i18n discipline (`t(key)` only, voseo for ES); two-AppContent-paths note; pre-submit `npm run check:i18n-keys`.

### Research artifacts
- `.planning/research/PITFALLS.md` — `ReanimatedSwipeable` iOS crash bug rationale; `Gesture.Pan()` is the safe alternative.
- `.planning/research/STACK.md` §"Bottom Sheet", §"Haptic Feedback", §"Animation Foundation" — version pinning, install commands, gorhom architectural notes.
- `.planning/research/ARCHITECTURE.md` — provider hierarchy, conventions.

### Source files Phase 18 modifies
- `src/components/PlantCard.tsx:1-350` — primary touch site. Trash button at L144-158 → removed; tip rendering at L162 → removed; `PlantHealthBadge` import L13 + gate L91 + render L138-143 → removed; favorite heart at L116-123 → removed (replaced by long-press menu item). New: `Gesture.Pan()` + Reanimated layout, mood emoji overlay on image, long-press detector.
- `src/screens/PlantsScreen.tsx:113-147` — sorted list + `renderPlant`; CARD-04 first-card affordance hint integrates here.
- `src/components/MyPlantDetailModal.tsx` (specifically the "¿Qué hacer?" section established by Phase 14 EDU-01) — receives the relocated tip italic. `MyPlantDetailModal:203` `<PlantHealthBadge ... />` is intentionally NOT touched in Phase 18.
- `src/i18n/locales/en/common.json` + `src/i18n/locales/es/common.json` — new strings (Toast labels "Eliminar" / "Deshacer", any new health.* labels for mood-emoji a11y if added). Locale parity required.

### Source files Phase 18 creates
- `src/components/Toast.tsx` (or canonical equivalent — Claude's discretion at planning) — generic app-wide Toast primitive. `src/components/index.ts` re-export.
- `scripts/smoke-phase18.cjs` (recommended) — file-content assertions.

### Source files Phase 18 reads (no edits)
- `src/utils/plantHealth.ts:30-264` — `calculatePlantHealth`, `getHealthLevel`, `getHealthColor`, `getHealthBgColor`, `getHealthMessage`. Mood emoji maps from `.level` field.
- `src/utils/haptics.ts` — `triggerHaptic('impactMedium')` for swipe; `triggerHaptic('impactLight')` for long-press (planning recommendation).
- `src/hooks/useStorage.ts` — `deletePlant(id)`, `addPlant(plant)` (for restore-on-undo), `updatePlant(id, partial)` (for favorite toggle from menu).
- `src/components/PlantHealthDetail.tsx` — modal opened by mood-emoji tap; no edits.
- `src/components/PlantHealthBadge.tsx` — kept as a file; no edits this phase. (Modal-side cleanup deferred.)
- `App.tsx` (provider tree) — verifies `BottomSheetModalProvider` + `GestureHandlerRootView` are wrapped at App root per Phase 13 INFRA-02 lock; no edits expected.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Gesture.Pan()` from `react-native-gesture-handler`** — installed Phase 13. The only safe swipe primitive for this app (`ReanimatedSwipeable` is banned).
- **`Reanimated v4` (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`)** — installed Phase 13. Drives the swipe translation, the spring-back, the chevron-peek affordance, and the Toast slide-in.
- **`@gorhom/bottom-sheet` `BottomSheetModal`** — installed + provider-wrapped at App root (Phase 13). Recommended container for the long-press overflow menu.
- **`triggerHaptic(kind)` at `src/utils/haptics.ts`** — locked-API utility shipped by Phase 13. CARD-05 uses `'impactMedium'`; long-press uses `'impactLight'` (recommended).
- **`useDismissOnPaywall(sheetRef)` hook at `src/utils/...` (Phase 13)** — opt-in on the long-press BottomSheetModal if used.
- **`calculatePlantHealth(plant, today, weather, diagnoses, currentSeason)` at `src/utils/plantHealth.ts:30`** — already memoized at `PlantCard.tsx:85-88`. Returns `{ score, level, issues }`. The `level` field maps directly to mood emoji.
- **`getHealthMessage(level)` / `getHealthColor(level)` / `getHealthBgColor(level)`** — already i18n-keyed; reusable for mood-emoji a11y label and (optionally) the mood-emoji circular-background tint.
- **`<PlantHealthDetail visible= ... />` already mounted at `PlantCard.tsx:212-218`** — mood-emoji tap reuses this; no new modal.
- **`useStorage.deletePlant(id)` + `addPlant(plant)` + `updatePlant(id, partial)`** — covers the full undo + favorite-from-menu surface.
- **`AsyncStorage`** — already imported elsewhere; new `@plantcard_swipe_discovered` key for CARD-04 (no schema, just a string flag).
- **Theme tokens (`colors.dangerBg`, `colors.danger`, `colors.green`, `colors.card`, `spacing.*`, `borderRadius.*`, `shadows.*`)** — all swipe-related visuals (red action button, success-feedback haptic colors if needed) come from the existing palette. No new tokens.

### Established Patterns
- **Silent fire-and-forget for ergonomic side effects** — `triggerHaptic` returns void synchronously and swallows errors (Phase 12 unknown-plant-tracker pattern + Phase 13 haptics). Swipe code calls it without `await`.
- **Defensive 3-rung catalog fallback** — `PlantCard.tsx:74-79` already shows the `translatedEntry → plantType.tip → ''` chain. The tip relocation must preserve this chain in `MyPlantDetailModal` "¿Qué hacer?" section.
- **`BottomSheetModal` placement at screen-component level** (Phase 13 lock) — sibling of the main scroll surface, never inside it. If the long-press menu uses BottomSheetModal, place its `<BottomSheetModal>` JSX at `PlantsScreen.tsx` / `TodayScreen.tsx` level (or a shared portal), not inside `PlantCard.tsx`.
- **Optimistic + restore is established for storage**: `useStorage.deletePlant` is synchronous to AsyncStorage already (`useStorage` writes on every mutation per CLAUDE.md "Local-First" §). Re-inserting via `addPlant(plant)` round-trips cleanly.
- **i18n keyset discipline** — every user-facing string lives in `common.json` or `plants.json` with EN+ES parity. `npm run check:i18n-keys` enforces. New Toast strings + mood-emoji a11y go in `common.json`.
- **`__DEV__`-gated dev tools in `SettingsScreen`** (Phase 12 + Phase 13 pattern) — useful for an optional "Reset swipe-discovered flag" toggle to re-test CARD-04 affordance hint on demand.

### Integration Points
- **`PlantCard.tsx`** — heaviest modification surface. ~150 LOC delta expected (swipe + long-press wiring + mood emoji overlay + tip removal + favorite-heart removal + trash-button removal).
- **`PlantsScreen.tsx`** — adds CARD-04 affordance hint to the first-card render path (small wrapper component or `index === 0` prop). Imports the new `<Toast/>` for the undo flow OR consumes it via a screen-local toast portal — Claude's discretion at planning.
- **`MyPlantDetailModal.tsx`** — receives the relocated tip italic in the "¿Qué hacer?" section established by Phase 14 EDU-01. Modal-side `PlantHealthBadge:203` stays untouched.
- **`Toast.tsx` (new)** — generic primitive. Used by Phase 18 immediately and Phase 22 later.
- **`i18n/locales/{en,es}/common.json`** — new keys for Toast labels + (optional) mood-emoji a11y. Locale parity enforced by `check:i18n-keys`.
- **No types-layer changes expected.** All decisions are additive UX/JSX. No `Plant` schema fields added (no `deletedAt` tombstone — optimistic memory-restore was chosen).

</code_context>

<specifics>
## Specific Ideas

- **Greg-style mood-emoji overlay** — image-thumbnail bottom-right anchor; reads like a pet status; the user explicitly chose this slot over headerRight or inline-with-name.
- **One Toast across the ecosystem** — verbatim user direction: *"El toast deberia ser el mismo en todo el ecosistema, si tenemos uno hay que reutilizarlo y luego si no me gusta podemos diseñar uno para que se use en TODA la experiencia y la app."* Phase 18 is the first consumer; Phase 22 must reuse the same component.
- **Hybrid swipe (reveal + full-swipe shortcut)** — covers both cautious users (small swipe → tap red button) and power users (full swipe → straight to undo). Both paths fire the haptic at threshold-cross.
- **Optimistic delete with memory-only restore** — chose simplicity over crash resilience; the 4-second window is short enough that the trade-off is acceptable. No `deletedAt` tombstone field.
- **Diagnosis + mood emoji coexist** — both render, no winner-takes-all. Mood = horticultural state; diagnosis = open issue. Two facts, two badges.
- **Favorite heart leaves the card face entirely** — discoverability moves to the long-press menu. CARD-02 already names favorite as a menu item; the inline heart was the source of "more than 5 elements" pressure.
- **Subtitle, water-border, diagnosis badge stay** — they're metadata/state, not "elements" in the budget sense. The 5-element budget is about the visual primary signals (image, name, task, water badge, mood), not a literal count of all DOM nodes.

</specifics>

<deferred>
## Deferred Ideas

- **Right-swipe to mark watered (or any right-swipe action)** — out of scope for Phase 18. Belongs in a future "swipe shortcuts" phase if pursued.
- **`PlantHealthBadge` removal from `MyPlantDetailModal:203`** — locked PlantCard-only scope this phase. Future cleanup if/when modal-side health affordance is reconsidered.
- **Deletion of `src/components/PlantHealthBadge.tsx` file + `index.ts` re-export removal** — not this phase; modal still consumes it.
- **Tooltip popover for mood-emoji (one-line summary on tap)** — rejected; tap opens the existing `PlantHealthDetail` modal per REQUIREMENTS GAM-03 literal.
- **Native `Alert.alert` confirmation for swipe-delete** — rejected; chose undo-toast.
- **`BottomSheetModal` confirmation for swipe-delete** — rejected; chose undo-toast (lighter, less interruption).
- **Dedicated `<UndoToast/>` component separate from generic Toast** — rejected; one Toast across the ecosystem.
- **`deletedAt` tombstone field on `Plant`** — rejected; in-component memory restore is sufficient.
- **Mood emoji wins over diagnosis (or vice versa)** — rejected; both render side-by-side.
- **Pet toxicity badge on PlantCard** — Phase 19 (TOX-03), not Phase 18.
- **Fertilize task badge on PlantCard** — Phase 20 (FERT-06), not Phase 18.
- **Edit-plant-only modal** — rejected as scope creep; long-press "Edit" reuses `MyPlantDetailModal` (or whatever existing surface Claude picks).
- **Phase 22 celebration toast wiring (GAM-01 "¡Vas bien! 🌱")** — Phase 22 owns this; Phase 18 only ships the primitive.

</deferred>

---

*Phase: 18-plantcard-cleanup-mood-emoji*
*Context gathered: 2026-05-08*
