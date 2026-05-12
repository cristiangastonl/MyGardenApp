# Phase 22: Gamification — Toasts + Haptics - Research

**Researched:** 2026-05-11
**Domain:** React Native (Expo SDK 54) — positive feedback wiring (haptic + Toast) across 4 task-done flows in 3 screens; cross-cutting concern via context. GAM-05 anti-pattern enforcement via STRICT smoke negative-grep.
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Toast firing + haptic pattern (Area 1)

- **Single Toast copy for all 4 task types:** `t('gamification.toastSuccess')` resolves to `"¡Vas bien! 🌱"` in ES and `"You're on it! 🌱"` in EN. No per-task variants — keeps copy simple and matches GAM-01 wording verbatim.
- **Toast duration:** 2 seconds auto-dismiss. Matches Phase 18 swipe-undo Toast + Phase 21 journal-saved Toast durations. Same animation primitives (existing `<Toast>` `durationMs` prop).
- **Firing site:** Inside `useStorage` actions — `waterPlant`, `sunPlant`, `outdoorPlant`, `fertilizePlant`. Each action calls `triggerHaptic('success')` AND signals the screen-level Toast via an `onTaskCompleted?: () => void` callback passed through the StorageContext. Single source of truth — fire-and-forget. NOT instrumented at each TaskButton call site (PlantCard, DayDetailModal) — that would be N call sites = N changes and would risk drift.
- **Screen-level Toast surface:** PlantsScreen + TodayScreen + CalendarScreen each own a `gamificationToastVisible` state declared distinctly from Phase 18's `toastVisible` and Phase 21's `journalToastVisible`. Each screen registers its setter as the `onTaskCompleted` callback. Render a THIRD independent `<Toast>` sibling. Three coexisting Toasts per screen at maximum (Phase 18 swipe-undo + Phase 21 journal-saved + Phase 22 task-done).

#### Streak-anxiety anti-pattern enforcement (Area 2)

- **STRICT smoke runner negative-grep:** `scripts/smoke-phase22.cjs` includes a sentinel that fails (NOT skippable) if any of these terms appears anywhere under `src/`:
  - `streak`
  - `consecutiveDays`
  - `dayCount`
  - `currentStreak`
  - `bestStreak`
  - `streakReset`
  - Whitelist exception: comments referencing the anti-pattern memory file by relative path (e.g., `// see ...memory/gam_anti_patterns.md`) are explicitly allowed via word-boundary regex excluding the path token.
- **Code documentation:** Add an inline comment block above the 4 task-done useCallback bodies in `useStorage.tsx`:
  ```
  // GAM-05 lock: NEVER add streak counters or consecutive-day tracking here.
  // The mood emoji (Phase 18 GAM-03/04) communicates plant state without anxiety.
  // Blossom cautionary tale — streaks weaponize missed days.
  // See /Users/gaston/.claude/.../memory/gam_anti_patterns.md
  ```
- **Confirmed: no new state UI in Phase 22.** Mood emoji + Phase 14 health-detail modal already communicate plant state. "¡Vas bien! 🌱" toast is transient positive reinforcement only — no persistence, no count, no score.
- **Cross-phase smoke regression:** `smoke-phase22.cjs` includes STRICT sentinels for Phase 18 mood emoji + 5-element PlantCard layout; Phase 19 TOX-03/04/06; Phase 20 FERT-03 5-site + FERT-06 two-column + FERT-07 i18n parity; Phase 21 JOURNAL-04 Diario section + journalToastVisible Toast wiring + JOURNAL-05 no-premium-gate. Any regression fails the gate.

### Claude's Discretion

- **`onTaskCompleted` callback wiring:** the cleanest plumbing is to add an optional `onTaskCompleted?: () => void` field to `StorageProviderProps` (or set up via a `setOnTaskCompleted(cb)` action exposed on the context). Each screen registers/unregisters its setter in a `useEffect`. Planner picks the mechanism that minimizes prop-drill noise — both are acceptable.
- **Haptic firing order:** call `triggerHaptic('success')` BEFORE the `setState` so the OS-level haptic is dispatched without waiting for React's render. Matches the `triggerHaptic('impactMedium')` ordering in PlantCard swipe-commit (Phase 18).
- **Toast Z-order with the existing Toasts:** each Toast is independent; if multiple fire simultaneously they stack in mount order. RN's natural layering handles this — no manual Z-index management.
- **i18n keys** (`src/i18n/locales/{en,es}/common.json`): new `gamification.*` namespace with at least `gamification.toastSuccess`. Voseo in ES (`"¡Vas bien! 🌱"`).
- **Smoke runner:** fork `smoke-phase21.cjs` for the three-tier sentinel pattern (PASS scaffold + SKIP→PASS placeholders for GAM-01/02/05 + STRICT cross-phase regression for Phase 18-21).
- **`check-i18n-keys.mjs`:** no extension needed (gamification keys live in common.json).

### Deferred Ideas (OUT OF SCOPE)

- **Per-task-type toast variants** ("¡Regaste! 💧" / "¡Fertilizaste! 🌱") — single message in v1.2; future polish phase could add variants if user demand emerges.
- **Soft progress indicators** (e.g., "3 tasks done today" bar) — NEVER. Anti-pattern lock.
- **Sound effects** — out of scope; haptic is the only audible signal in v1.2.
- **Confetti animation** on milestone task counts — too gamified; anti-pattern adjacent.
- **Achievement badges** ("first watering of the season") — out of scope; would require persistent state.
- **Daily / weekly care recap email** — server-side feature; out of scope until v2.0 cloud sync.
- **Sharing care updates externally** (Twitter, Instagram) — out of scope.
- **Reward / coin / point economies** — anti-pattern. NEVER.
- **Mood emoji tap → gamification stats screen** — Phase 18 mood emoji opens PlantHealthDetail; no gamification overlay added.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAM-01 | Toast component shown on task completion ("¡Vas bien! 🌱") — positive-only, NEVER a broken-streak penalty | Toast primitive already in-repo (`src/components/Toast.tsx`); third screen-level `<Toast>` sibling per screen with `gamificationToastVisible` state. Firing site centralized via `onTaskCompleted` callback registered through StorageContext. i18n key `gamification.toastSuccess` in EN + ES (voseo). |
| GAM-02 | Haptic feedback (`Haptics.NotificationFeedbackType.Success`) on water/sun/outdoor/fertilize task done | `triggerHaptic('success')` already exists at `src/utils/haptics.ts:30-32` — maps to `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`. Fire-and-forget, errors swallowed in prod. Phase 22 is the first consumer; precedent for direct-call usage in useCallback bodies (vs. `runOnJS(triggerHaptic)` in PlantCard gesture worklets). |
| GAM-05 | NO persistent streak counter in primary UI (anti-pattern per research) | STRICT negative-grep in `scripts/smoke-phase22.cjs` over `src/` excluding 2 whitelisted token sites: `src/config/features.ts` line `CARE_STREAKS: false` (V2.0 placeholder) and any code comment containing `gam_anti_patterns.md`. No new UI state. Inline GAM-05 comment block above each of the 4 task-done useCallback bodies (anchored to keyword `'GAM-05 lock'` for grep). |
</phase_requirements>

## Summary

Phase 22 wires positive feedback (haptic + transient toast) on care-task completion across all 4 task types (water/sun/outdoor/fertilize) for 3 screens (PlantsScreen + TodayScreen + CalendarScreen). The work is small in volume (~30-60 LOC source code) but structurally distinctive because:

1. **There are no `waterPlant`/`sunPlant`/`outdoorPlant` actions today** — task-done is currently handled by per-screen `handleWater`/`handleSunDone`/`handleOutdoorDone` handlers that call `updatePlant(id, { lastWatered/sunDoneDate/outdoorDoneDate: ... })` directly. The CONTEXT decision to "fire haptic + toast inside useStorage actions" requires either (a) creating these missing actions OR (b) wiring the side-effects into a generic touchpoint. Recommendation: option (a) — add `waterPlant`, `sunPlant`, `outdoorPlant` actions to mirror the existing `fertilizePlant` shape (Phase 20 precedent), centralize the side-effects, and migrate the 3 screens to call the new actions instead of direct `updatePlant({ lastWatered: ... })`.

2. **CalendarScreen has no Toast surface today** — Phase 22 introduces it (existing grep confirms 0 occurrences of `Toast`/`toastVisible` in `src/screens/CalendarScreen.tsx`). Three new state declarations + one new `<Toast>` JSX node.

3. **The negative-grep regex MUST whitelist a real false-positive:** `src/config/features.ts:31` contains `CARE_STREAKS: false` (V2.0 placeholder flag). Without an exception, the GAM-05 sentinel will fail. Whitelist mechanism: exclude lines matching `CARE_STREAKS` OR lines containing the literal token `gam_anti_patterns.md`.

**Primary recommendation:** Add `waterPlant`/`sunPlant`/`outdoorPlant` actions to `useStorage` (mirroring `fertilizePlant`), add `setOnTaskCompleted(cb)` setter to the context, and migrate 3 screens to use the new actions and register their `setGamificationToastVisible(true)` setter via `useEffect`. Single i18n key (`gamification.toastSuccess`). Plan in 4 waves: W0 scaffold (smoke-phase22.cjs + i18n skeleton) → W1 useStorage actions + context wiring → W2 3-screen integration (parallel) → W3 manual checkpoint (auto-defer to v1.2 backlog per established precedent).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-haptics` | ~15.0.8 (already installed per `package.json:41`) | OS-level haptic feedback wrapper | Cross-platform iOS+Android haptic API; phase 13 INFRA-01 installed; phase 18 CARD-05 confirmed working on devices via existing `runOnJS(triggerHaptic)` calls in PlantCard. `NotificationFeedbackType.Success` is the standard "task completed" haptic kind. |
| `react-i18next` | (existing) | i18n via `t()` calls in EN + ES | Project convention — all user-facing strings MUST use `t()` per CLAUDE.md; never hardcode. ES uses voseo for the Argentine market. |
| `react-native-reanimated` v4 | (existing) | Toast slide-in/out animation via `withTiming` | Existing `<Toast>` primitive (Phase 18) already uses this — no new dependency. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-native-async-storage/async-storage` | (existing) | Storage persistence via useStorage | Already consumed — `useStorage.tsx` writes mutations through `scheduleSave()`. No new persistence in Phase 22 (transient toasts only). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `triggerHaptic('success')` direct call in useCallback body | `runOnJS(triggerHaptic)` (Reanimated worklet) | Worklet-wrapped invocation is only required when called FROM a worklet context (e.g., `Gesture.Pan().onEnd(...)` in PlantCard). The 4 task-done useCallback bodies are plain JS — direct call is correct. Precedent confirmed at `src/components/PlantCard.tsx:174,198` for the worklet path; useCallback context has no precedent in the codebase yet (Phase 22 first). |
| Provider-prop `onTaskCompleted` (passed via `StorageProvider onTaskCompleted={cb}>`) | Context-action `setOnTaskCompleted(cb)` exposed on the context interface | Provider-prop requires the screen to BE the parent of StorageProvider — impossible since StorageProvider wraps the entire app in `App.tsx`. Context-action approach is the only viable mechanism. **DECISION:** use `setOnTaskCompleted(cb \| null)` action; screens call `setOnTaskCompleted(setGamificationToastVisible)` in `useEffect` mount and `setOnTaskCompleted(null)` in cleanup. |
| Single `onTaskCompleted` callback (overwrite per-screen) | Multi-screen registration set (Set<() => void>) | Only ONE screen is mounted at a time in React Navigation bottom-tabs — the tabs are conditionally rendered, but the focused screen is the one consuming user input. Single-slot callback overwrite is sufficient (and `useEffect` cleanup handles unmount). Verified: `App.tsx` provider hierarchy + `AppContent` mounts MainTabs once; tabs unmount/remount lazily, so `useEffect` lifecycle is well-defined. |
| Adding `waterPlant`/`sunPlant`/`outdoorPlant` actions to useStorage | Wiring haptic + callback into an existing seam (e.g., `updatePlant` itself) | `updatePlant` is called from MANY non-task sites (favorite toggle, photo add, custom watering schedule edit, etc.) — wiring haptic there would fire on every plant edit. Action separation is necessary for behavioral correctness. **DECISION:** add 3 new task actions mirroring `fertilizePlant` shape (Phase 20 precedent at L485-501). |

**Installation:** none — all dependencies present.

## Architecture Patterns

### Recommended Project Structure
No new directories. All changes live in existing files:

```
src/
├── hooks/useStorage.tsx           # +3 actions (waterPlant/sunPlant/outdoorPlant)
│                                  # +1 action (setOnTaskCompleted)
│                                  # +1 ref (onTaskCompletedRef)
│                                  # GAM-05 comment block above each of 4 task actions
├── screens/
│   ├── PlantsScreen.tsx           # +1 state (gamificationToastVisible)
│   │                              # +1 useEffect (register/cleanup callback)
│   │                              # +1 <Toast> sibling
│   │                              # Migrate handleWater/Sun/Outdoor to call new actions
│   ├── TodayScreen.tsx            # Same as PlantsScreen
│   └── CalendarScreen.tsx         # Same — NEW Toast surface for this screen
├── i18n/locales/{en,es}/common.json  # +1 namespace `gamification` with 1 leaf key
└── scripts/smoke-phase22.cjs      # NEW — fork from smoke-phase21.cjs
```

### Pattern 1: Centralized Side-Effect via Context Callback Setter
**What:** Cross-cutting concerns (haptic + UI feedback) fire from a single source-of-truth action in `useStorage`. Screens register their UI-feedback callback via a context setter, NOT prop-drilling.
**When to use:** When N call sites need the same side-effect (4 task types × 3 screens = 12 potential drift points → 1 centralized point).
**Example:**
```typescript
// Source: useStorage.tsx pattern — extending Phase 20 fertilizePlant (L485-501)
const onTaskCompletedRef = useRef<(() => void) | null>(null);

const setOnTaskCompleted = useCallback((cb: (() => void) | null) => {
  onTaskCompletedRef.current = cb;
}, []);

const waterPlant = useCallback((id: string) => {
  // GAM-05 lock: NEVER add streak counters or consecutive-day tracking here.
  // The mood emoji (Phase 18 GAM-03/04) communicates plant state without anxiety.
  // See /Users/gaston/.claude/.../memory/gam_anti_patterns.md
  const todayStr = formatDate(new Date());
  triggerHaptic('success');               // fire BEFORE setState (CONTEXT order)
  onTaskCompletedRef.current?.();         // fire BEFORE setState
  updatePlant(id, { lastWatered: todayStr }, { fromUserEdit: true });
}, [updatePlant]);
```

**Why a ref, not a state field:** registering the callback should NOT cause `value` memo invalidation (which would rerender every consumer). Ref-based registration is invisible to React's reconciler.

### Pattern 2: Three Coexisting Toast Siblings per Screen
**What:** Each Toast owns independent `visible`/`message`/`duration` state. RN render order is the natural Z-order (last-mounted = on top).
**When to use:** Three semantically distinct events (swipe-undo / journal-saved / task-done). Coexistence is rare but legal.
**Example:**
```tsx
// Source: TodayScreen.tsx L695-711 (existing Phase 18 + 21 pattern; Phase 22 adds 3rd sibling)
<Toast
  visible={toastVisible}            // Phase 18: swipe-undo (4s, "Plant deleted" + Undo action)
  message={toastMessage}
  actionLabel={t('plantCard.undoToast.undoLabel')}
  onAction={handleUndo}
  durationMs={4000}
  onDismiss={handleToastDismissed}
/>
<Toast
  visible={journalToastVisible}     // Phase 21: journal-saved (2s, "Entrada guardada 📔")
  message={t('journal.savedToast')}
  durationMs={2000}
  onDismiss={() => setJournalToastVisible(false)}
/>
<Toast
  visible={gamificationToastVisible}  // Phase 22 NEW (2s, "¡Vas bien! 🌱")
  message={t('gamification.toastSuccess')}
  durationMs={2000}
  onDismiss={() => setGamificationToastVisible(false)}
/>
```

**Note on simultaneous fires:** if user marks a task done AND swipe-deletes within ~2s, two toasts stack. Toast styles use `position: 'absolute'; bottom: ...` — both render at the same vertical position. This is the acknowledged behavior; no manual stacking needed. Verified in Toast.tsx:71-72.

### Pattern 3: Screen-Level Callback Registration with `useEffect` Cleanup
**What:** Each screen's `useEffect` registers its `setGamificationToastVisible` setter as the active callback on mount; cleans up to `null` on unmount.
**When to use:** When the callback target is mount-scoped (only the focused screen should respond).
**Example:**
```tsx
// In each screen (PlantsScreen / TodayScreen / CalendarScreen):
const [gamificationToastVisible, setGamificationToastVisible] = useState(false);
const { setOnTaskCompleted } = useStorage();

useEffect(() => {
  setOnTaskCompleted(() => setGamificationToastVisible(true));
  return () => setOnTaskCompleted(null);
}, [setOnTaskCompleted]);
```

**Race condition consideration:** React Navigation bottom-tabs lazily mounts/unmounts tabs. If Screen A unmounts and Screen B mounts in the same render cycle, B's `useEffect` runs AFTER A's cleanup — correct order. The setter is stable (wrapped in `useCallback`), so the `useEffect` dependency array is stable.

### Anti-Patterns to Avoid

- **Anti-pattern: Wiring haptic+toast in TaskButton onPress.** TaskButton is rendered N times (per-plant per-task-type). Wiring there means N call sites × 4 task types = drift risk. Always centralize at the action layer (useStorage). Established precedent: Phase 18 swipe-commit haptic fires from PlantCard.tsx (one site) NOT from each card consumer.
- **Anti-pattern: Multiple callback slots / array of callbacks.** Only the focused screen needs the callback. Multi-slot adds complexity without benefit (and risks stale closures if a non-focused screen's callback fires).
- **Anti-pattern: Coupling haptic to `updatePlant`.** `updatePlant` is called from many non-task flows (favorite, photo, custom schedule). Haptic must only fire on task completion.
- **Anti-pattern: Storing callback as state field (not ref).** Triggers `value` memo invalidation → rerenders every useStorage consumer. Use ref.
- **Anti-pattern: Adding a `streak` counter "but just internal, not displayed."** GAM-05 forbids ALL streak data structures — even internal-only ones drift toward UI exposure over time. Negative-grep enforces this at smoke-runner level.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback wrapper | New `Haptics.notificationAsync(...)` call sites | `triggerHaptic('success')` from `src/utils/haptics.ts` | Already wraps error-swallow + __DEV__ logging + 7-kind union. Adding raw `Haptics.*Async` calls bypasses these affordances. |
| Toast UI primitive | Custom celebration banner / confetti view | Existing `<Toast>` component (`src/components/Toast.tsx`) | Existing primitive has slide-in/out animation, accessibility live-region, auto-dismiss timer, action button affordance. Phase 22 uses 3 of 5 props (visible/message/durationMs/onDismiss). |
| Per-task-type i18n string variants | "¡Regaste!" / "¡Fertilizaste!" per task | Single key `gamification.toastSuccess` | CONTEXT locked single-copy approach. Per-task variants are deferred (out of scope). |
| Screen-level Toast coordination (mutex / queue) | Custom "only one Toast at a time" controller | Three independent siblings with overlapping animations | Toasts share the same `bottom` style; if both visible they render at the same spot. Visual stacking is acceptable per CONTEXT; race is rare in practice. Hand-rolling a queue adds 100+ LOC for marginal benefit. |
| Streak-anxiety detection in code review | "Reviewer should catch it" | STRICT smoke negative-grep | Code review is human-fallible; smoke-runner is deterministic. Phase 22 anchors anti-pattern at the gate. |

**Key insight:** All 4 problems above have existing solutions in-repo. Phase 22 is pure wiring + enforcement, NOT new infrastructure.

## Common Pitfalls

### Pitfall 1: Negative-Grep False Positive on `CARE_STREAKS`
**What goes wrong:** `src/config/features.ts:31` contains `CARE_STREAKS: false` as a V2.0 placeholder flag. A naive `grep -rE "streak" src/` will match this line and fail the GAM-05 sentinel.
**Why it happens:** `streak` is a substring of `CARE_STREAKS`; the feature flag is intentional dead code per the project's two-axis gating model (see CLAUDE.md § Feature Flags).
**How to avoid:** Add explicit whitelist in `smoke-phase22.cjs`:
```js
const STREAK_RE = /\b(streak|consecutiveDays|dayCount|currentStreak|bestStreak|streakReset)\b/i;
const WHITELIST_LINE_RE = /CARE_STREAKS|gam_anti_patterns\.md/;
// for each src file:
const lines = readFileSync(file, 'utf8').split('\n');
const hits = lines
  .map((line, i) => ({ line, i }))
  .filter(({ line }) => STREAK_RE.test(line) && !WHITELIST_LINE_RE.test(line));
assert(hits.length === 0, `GAM-05.negative-grep.no-streak-tokens (file: ${file})`);
```
**Warning signs:** Smoke runner fails on `src/config/features.ts:31` after a clean Wave 0 land. The fix is the whitelist, NOT renaming `CARE_STREAKS`.

### Pitfall 2: Missing waterPlant/sunPlant/outdoorPlant Actions
**What goes wrong:** CONTEXT says "Inside useStorage actions — waterPlant, sunPlant, outdoorPlant, fertilizePlant. Each action calls triggerHaptic + onTaskCompleted." But only `fertilizePlant` exists today (Phase 20). The other three task-done flows are inlined into each screen as `handleWater(plantId) { updatePlant(plantId, { lastWatered: todayStr }) }` calls.
**Why it happens:** v1.0/v1.1 used direct `updatePlant` calls; only Phase 20 introduced a per-task-type action (because fertilize had complex catalog-bootstrap logic). Phases 22's CONTEXT assumes parity but the parity doesn't exist yet.
**How to avoid:** Plan must include CREATING `waterPlant(id: string)`, `sunPlant(id: string)`, `outdoorPlant(id: string)` actions in useStorage.tsx, exposing them on the context, then migrating 3 screens × 3 actions = 9 call sites from `updatePlant({...})` to the new action calls. Migration sites:
- `src/screens/TodayScreen.tsx:203` (handleWater), `:210` (handleSunDone), `:220` (handleOutdoorDone)
- `src/screens/CalendarScreen.tsx:87` (handleWater), `:96` (handleSunDone), `:108` (handleOutdoorDone)
- (PlantsScreen does NOT have task handlers — it consumes TodayScreen-style behavior via PlantCard, BUT confirm none exist in PlantsScreen; if they do, migrate those too)

**Warning signs:** Smoke runner `GAM-02.useStorage.waterPlant-exists` SKIPs at W0 and never flips to PASS; phase 22's haptic firing is wired but only fires on fertilize. Manual device test reveals "haptic works for fertilize but not water" — a clear signal that the action layer is incomplete.

### Pitfall 3: Toggle Semantics for Sun/Outdoor Task-Done
**What goes wrong:** Today's `handleSunDone` and `handleOutdoorDone` are TOGGLES — tapping again undoes the done state:
```typescript
// TodayScreen.tsx:210-212 — current behavior
updatePlant(plantId, {
  sunDoneDate: plant.sunDoneDate === todayStr ? null : todayStr
});
```
If the new `sunPlant(id)` action always fires haptic+toast, the user gets celebration feedback on un-done (toggle off) too — wrong UX.
**Why it happens:** v1.0 task-done was reversible by tapping the chip a second time; v1.2 inherited this.
**How to avoid:** The new action should compute the new state and only fire celebration when transitioning to "done":
```typescript
const sunPlant = useCallback((id: string) => {
  const plant = dataRef.current.plants.find(p => p.id === id);
  if (!plant) return;
  const todayStr = formatDate(new Date());
  const isDoing = plant.sunDoneDate !== todayStr;  // transitioning TO done
  if (isDoing) {
    triggerHaptic('success');
    onTaskCompletedRef.current?.();
  }
  updatePlant(id, { sunDoneDate: isDoing ? todayStr : null }, { fromUserEdit: true });
}, [updatePlant]);
```
Same applies to `outdoorPlant`. `waterPlant` does NOT toggle in current code (it just sets `lastWatered: todayStr`), so it's a no-conditional case. `fertilizePlant` already does not toggle.
**Warning signs:** Manual device test: tap sun → haptic+toast. Tap sun again → also haptic+toast (wrong). Should silently undo on second tap.

### Pitfall 4: setOnTaskCompleted Identity Stability Causing Re-Registration Loop
**What goes wrong:** If `setOnTaskCompleted` is not wrapped in `useCallback`, its identity changes every render → screen's `useEffect` re-runs every render → callback re-registered every render → no harm functionally, but verbose console traffic in __DEV__ and unnecessary work.
**Why it happens:** `useMemo(() => ({ ...actions }), [...deps])` rebuilds the actions object when any dep changes; if the setter is created fresh inline, identity churns.
**How to avoid:** Wrap `setOnTaskCompleted` in `useCallback(..., [])` (no deps — the ref mutation is stable). Include `setOnTaskCompleted` in the `useMemo` value deps so consumers re-read it consistently.
**Warning signs:** __DEV__ console floods with re-registration logs (if planner adds debug logging). Manual fix: add to `useCallback`.

### Pitfall 5: Toast Stacking Visual Overlap
**What goes wrong:** If task-done toast fires while swipe-undo toast or journal-saved toast is still visible, both render at the same `bottom: spacing.xxl + spacing.fabClearance` position — they overlap visually as one squashed banner.
**Why it happens:** Toast.tsx:71-72 uses `position: 'absolute'; bottom: <fixed>` with no Z-stacking offset for siblings.
**How to avoid:** Acknowledged behavior — CONTEXT explicitly accepts this ("RN's natural layering handles this — no manual Z-index management"). DO NOT introduce a Toast queue or vertical offset; per CONTEXT, simultaneous is rare and acceptable. If user complains in beta feedback, address in a later polish phase.
**Warning signs:** QA reports "two toasts overlap when I swipe-delete then mark another plant's task done within 2s." Plan should add a manual-test note to the v1.2 device-test backlog.

### Pitfall 6: PlantsScreen Has No Water/Sun/Outdoor Handlers Today
**What goes wrong:** PlantsScreen renders PlantCard but does NOT pass `onWater`/`onSunDone`/`onOutdoorDone` props (verified via grep: `onFertilizeDone` at L300 exists but the others appear absent from PlantsScreen's PlantCard mount). PlantCard's `mode="collection"` branch may suppress task buttons.
**Why it happens:** v1.0/v1.1 design split: TodayScreen shows tasks; PlantsScreen shows the collection (no task chips). The user can tap the card → opens MyPlantDetailModal → marks task done from there? OR PlantCard handles its own task-done?
**How to avoid:** **VERIFICATION REQUIRED at planning time** — confirm whether PlantsScreen's PlantCard actually renders TaskButtons. If NO, then PlantsScreen needs the `gamificationToastVisible` state ONLY to display the toast triggered via the context callback registration (the action fires regardless of which screen is focused). If YES, planner must wire the same migration as TodayScreen. **Recommendation:** Read PlantsScreen.tsx lines 290-450 during planning to confirm. Either way, the screen still needs the Toast + registration because tasks can complete via MyPlantDetailModal's fertilize card (Phase 20 FERT-06) which is reachable from PlantsScreen.

### Pitfall 7: NotificationFeedbackType.Success on Android
**What goes wrong:** Android's haptic implementation for `NotificationFeedbackType.Success` is sometimes weaker or absent on certain devices (manufacturer-specific haptic engines).
**Why it happens:** `expo-haptics` `Haptics.notificationAsync` maps to platform-native APIs; iOS has dedicated UINotificationFeedbackType.Success (strong distinct buzz); Android's implementation maps to `VibrationEffect.EFFECT_HEAVY_CLICK` or similar, which varies by OEM.
**How to avoid:** Already handled — `triggerHaptic('success')` wraps in try/catch; production swallows; __DEV__ logs (haptics.ts:43-49). The fallback is silent. Manual device test on a representative Android device (Samsung mid-tier) is in the v1.2 device-test backlog precedent (Phase 18 CARD-05 device-tested haptic on swipe-commit).
**Warning signs:** Beta tester reports "no haptic on Android" — likely OEM-specific, not a bug in our code. Address with documentation note in v1.2 backlog if pattern emerges.

### Pitfall 8: Smoke Runner Missing CalendarScreen Toast Wiring
**What goes wrong:** Phase 21's smoke runner only checks PlantsScreen + TodayScreen for `journalToastVisible`. If Phase 22's smoke runner copies that pattern, it will only check 2 of 3 screens for `gamificationToastVisible`. CalendarScreen is the new addition.
**Why it happens:** Phase 21 didn't add Toast to CalendarScreen; Phase 22 does.
**How to avoid:** `smoke-phase22.cjs` MUST assert `gamificationToastVisible` AND `gamification.toastSuccess` proximity (per Phase 21 STRICT pattern at smoke-phase21.cjs L155-163) in ALL THREE screens — PlantsScreen, TodayScreen, AND CalendarScreen. Read CalendarScreen file once and run the proximity regex against all three.

## Code Examples

Verified patterns from in-repo sources:

### Adding a New Task-Done Action (Mirror fertilizePlant)
```typescript
// Source: src/hooks/useStorage.tsx:485-501 (Phase 20 FERT-06 precedent)
// Phase 22 extends this pattern for water/sun/outdoor.

const fertilizePlant = useCallback((id: string) => {
  // ... existing body
  triggerHaptic('success');               // ← Phase 22 adds (BEFORE updatePlant)
  onTaskCompletedRef.current?.();         // ← Phase 22 adds
  updatePlant(id, { fertilizeSchedule: nextSchedule }, { fromUserEdit: true });
}, [updatePlant]);

// NEW in Phase 22:
const waterPlant = useCallback((id: string) => {
  // GAM-05 lock: NEVER add streak counters or consecutive-day tracking here.
  // The mood emoji (Phase 18 GAM-03/04) communicates plant state without anxiety.
  // Blossom cautionary tale — streaks weaponize missed days.
  // See /Users/gaston/.claude/projects/-Users-gaston-Documents-Personal-MiJardinApp/memory/gam_anti_patterns.md
  const todayStr = formatDate(new Date());
  triggerHaptic('success');
  onTaskCompletedRef.current?.();
  updatePlant(id, { lastWatered: todayStr }, { fromUserEdit: true });
}, [updatePlant]);
```

### Registering Toast Callback in Screen
```typescript
// Source: NEW pattern in Phase 22; no existing precedent.
// PlantsScreen.tsx / TodayScreen.tsx / CalendarScreen.tsx

const [gamificationToastVisible, setGamificationToastVisible] = useState(false);
const { setOnTaskCompleted } = useStorage();

useEffect(() => {
  setOnTaskCompleted(() => setGamificationToastVisible(true));
  return () => setOnTaskCompleted(null);
}, [setOnTaskCompleted]);

// In JSX, AFTER the Phase 21 journalToastVisible Toast:
<Toast
  visible={gamificationToastVisible}
  message={t('gamification.toastSuccess')}
  durationMs={2000}
  onDismiss={() => setGamificationToastVisible(false)}
/>
```

### i18n Key Shape
```json
// Source: NEW namespace; placement follows Phase 21 `journal` namespace precedent (es/common.json:9-38)
// EN — src/i18n/locales/en/common.json
{
  "gamification": {
    "toastSuccess": "You're on it! 🌱"
  }
}

// ES — src/i18n/locales/es/common.json (voseo)
{
  "gamification": {
    "toastSuccess": "¡Vas bien! 🌱"
  }
}
```

### Smoke Runner Negative-Grep with Whitelist
```javascript
// Source: NEW; pattern adapted from Phase 21 JOURNAL-05 negative-grep at smoke-phase21.cjs:173-181

const STREAK_TOKENS_RE = /\b(streak|consecutiveDays|dayCount|currentStreak|bestStreak|streakReset)\b/i;
// Whitelist: CARE_STREAKS feature flag (V2.0 placeholder) + gam_anti_patterns.md comment references
const WHITELIST_LINE_RE = /CARE_STREAKS|gam_anti_patterns\.md/;

function findStreakViolations() {
  const srcRoot = path.resolve(ROOT, 'src');
  const violations = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (STREAK_TOKENS_RE.test(line) && !WHITELIST_LINE_RE.test(line)) {
            violations.push(`${full}:${i + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
  walk(srcRoot);
  return violations;
}

const streakHits = findStreakViolations();
assert(streakHits.length === 0,
  `GAM-05.negative-grep.no-streak-tokens-in-src (found ${streakHits.length}: ${streakHits.slice(0, 3).join('; ')})`);
```

### Three-Toast Proximity Regex (Smoke Sentinel)
```javascript
// Source: Adapted from Phase 21 smoke-phase21.cjs:155-163 STRICT proximity pattern.
// Required in ALL THREE screens (Phase 22 adds CalendarScreen).

assertSkippable(() => {
  if (plantsScreenSrc.length === 0 && todayScreenSrc.length === 0 && calendarScreenSrc.length === 0) return undefined;
  const proximityRe = /gamificationToastVisible[\s\S]{0,500}gamification\.toastSuccess|gamification\.toastSuccess[\s\S]{0,500}gamificationToastVisible/;
  const inPlants = proximityRe.test(plantsScreenSrc);
  const inToday = proximityRe.test(todayScreenSrc);
  const inCalendar = proximityRe.test(calendarScreenSrc);
  if (!inPlants && !inToday && !inCalendar) return undefined;
  return inPlants && inToday && inCalendar;
}, 'GAM-01.Toast.vas-bien-wired-3-screens');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `updatePlant(id, { lastWatered: ... })` from each screen | Centralized `waterPlant`/`sunPlant`/`outdoorPlant` actions on useStorage | Phase 22 introduces (Phase 20 fertilizePlant precedent) | Single source of truth for task-completion side-effects; future haptic/toast/analytics extensions land in 4 places, not 12. |
| `runOnJS(triggerHaptic)('impactMedium')` (Reanimated worklet context — PlantCard.tsx) | Direct `triggerHaptic('success')` (plain useCallback body — useStorage actions) | Phase 22 is the first non-worklet consumer of triggerHaptic | Demonstrates both invocation patterns are supported. |
| Two-Toast screen surface (Phase 18 swipe-undo + Phase 21 journal-saved) | Three-Toast surface (+ Phase 22 task-done) | Phase 22 introduces | RN's natural Z-order handles stacking; no new infrastructure needed. |
| Anti-pattern documented in code comments only | Anti-pattern enforced at smoke-runner gate | Phase 22 introduces (STRICT negative-grep) | Documentation is human-fallible; smoke is deterministic. |

**Deprecated/outdated:**
- Nothing deprecated in Phase 22 (purely additive).

## Open Questions

1. **Does PlantsScreen render TaskButtons (water/sun/outdoor chips) on its PlantCards?**
   - What we know: PlantsScreen.tsx:300 passes `onFertilizeDone={fertilizePlant}` to PlantCard; the other `on*Done` props are absent in PlantsScreen for water/sun/outdoor based on initial grep.
   - What's unclear: Does PlantCard with `mode="collection"` render TaskButton chips at all, or only the 5-element layout? If chips are rendered, PlantsScreen needs to wire `onWater/onSunDone/onOutdoorDone` via the new actions.
   - Recommendation: Planner reads PlantsScreen.tsx lines 290-450 and PlantCard.tsx mode-collection branch to confirm. If chips are NOT rendered in collection mode, no migration needed for PlantsScreen task handlers — only Toast surface + callback registration.

2. **Does Phase 22 still want the action layer abstraction even if PlantsScreen doesn't migrate handlers?**
   - What we know: CONTEXT mandates the action layer for waterPlant/sunPlant/outdoorPlant.
   - What's unclear: Whether to back out the migration if PlantsScreen has 0 callers (TodayScreen + CalendarScreen + MyPlantDetailModal would still consume the new actions).
   - Recommendation: YES — keep the action layer regardless. Even if only 2 of 3 screens migrate, centralization is correct for future extension (analytics, notifications, achievements deferred to v2.0).

3. **Should the GAM-05 comment block reference the absolute path to `gam_anti_patterns.md` or a relative repo path?**
   - What we know: CONTEXT example uses `/Users/gaston/.claude/.../memory/gam_anti_patterns.md` (absolute).
   - What's unclear: That path is machine-specific to one developer. Relative `.claude/memory/gam_anti_patterns.md` is more portable.
   - Recommendation: Use the literal absolute path from CONTEXT in code comments (matches CONTEXT's verbatim language) AND have the whitelist regex match `gam_anti_patterns\.md` (the file name, not the path), which works for both absolute and relative references.

4. **Does the GAM-05 negative-grep need to scan tsx/ts ONLY or all source files?**
   - What we know: CONTEXT says "anywhere under `src/`".
   - What's unclear: i18n JSON keys? Strings in plantDatabase.ts catalog content?
   - Recommendation: Scan all `.ts`, `.tsx`, `.js`, `.jsx` under `src/`. EXCLUDE `.json` (catalog content might legitimately use "streak" in a plant description if it ever exists, though currently none do — and we don't want to block plant-related strings in the future). Verified: `grep -rni "streak" src/i18n` returns nothing.

5. **What's the haptic-firing order requirement when `onTaskCompletedRef.current` is null?**
   - What we know: CONTEXT says "haptic BEFORE setState".
   - What's unclear: If no screen has registered a callback yet (e.g., race condition on app launch), do we skip haptic too?
   - Recommendation: Fire haptic UNCONDITIONALLY (physical feedback always desired regardless of UI state). Only skip the Toast (via the `?.()` optional-chain). Toast registration is mount-scoped; null is a legitimate state during transitions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Smoke runner (CJS, `node scripts/smoke-phaseNN.cjs`) — file-content asserts via `readFileSync` + regex; no Jest/Vitest in repo |
| Config file | None — convention-driven; each phase ships its own `scripts/smoke-phase{NN}.cjs` |
| Quick run command | `node scripts/smoke-phase22.cjs` |
| Full suite command | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/smoke-phase18.cjs && node scripts/smoke-phase19.cjs && node scripts/smoke-phase20.cjs && node scripts/smoke-phase21.cjs && node scripts/smoke-phase22.cjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAM-01 | Toast component shown on task completion with 2s auto-dismiss | smoke (file-content) | `node scripts/smoke-phase22.cjs` — sentinels: (a) `gamificationToastVisible` proximity regex with `gamification.toastSuccess` literal in PlantsScreen + TodayScreen + CalendarScreen; (b) i18n key `gamification.toastSuccess` present in en+es common.json; (c) `<Toast ... durationMs={2000}` proximity to `gamificationToastVisible` | ❌ Wave 0 — `scripts/smoke-phase22.cjs` must be created |
| GAM-01 | Toast actually appears on device after task-done tap (water/sun/outdoor/fertilize) | manual device test | Tap "Regar" chip on a plant in TodayScreen → expect transient "¡Vas bien! 🌱" toast for 2s + haptic buzz | N/A — deferred to v1.2 milestone-end backlog per Phase 18-05 / 19-07 / 20-10 / 21-06 precedent |
| GAM-02 | `triggerHaptic('success')` called inside each of 4 task-done actions in useStorage.tsx | smoke (file-content) | sentinels: (a) `waterPlant.*triggerHaptic\('success'\)` proximity (≤200 chars); same for sunPlant, outdoorPlant, fertilizePlant; (b) `import.*triggerHaptic.*from.*'..\\/utils\\/haptics'` in useStorage.tsx | ❌ Wave 0 |
| GAM-02 | Haptic actually fires on iOS + Android devices | manual device test | Tap "Regar" → expect NotificationFeedbackType.Success buzz (single short distinctive vibration) on both platforms | N/A — deferred to v1.2 backlog |
| GAM-05 | No streak-token identifiers in src/ except whitelisted lines | smoke (negative-grep) | walk `src/**/*.{ts,tsx,js,jsx}` → fail if line matches `\b(streak\|consecutiveDays\|dayCount\|currentStreak\|bestStreak\|streakReset)\b/i` AND does NOT match `CARE_STREAKS\|gam_anti_patterns\.md` | ❌ Wave 0 |
| GAM-05 | GAM-05 comment block present above each of 4 task-done useCallback bodies in useStorage.tsx | smoke (file-content) | sentinel: count of `GAM-05 lock` literal in useStorage.tsx === 4 | ❌ Wave 0 |
| Cross-phase | Phase 18 mood emoji + 5-element layout preserved | smoke (file-content) | reuse Phase 21 sentinels CROSS.GAM-03 / CROSS.CARD-01 verbatim | ✅ (already in smoke-phase21.cjs L222-228 — copy to smoke-phase22.cjs) |
| Cross-phase | Phase 19 TOX-03/04/06 preserved | smoke (file-content) | reuse Phase 21 sentinels CROSS.TOX-03 / CROSS.TOX-04 / CROSS.TOX-06 | ✅ (already in smoke-phase21.cjs L229-237) |
| Cross-phase | Phase 20 FERT-03 / FERT-06 / FERT-07 preserved | smoke (file-content) | reuse Phase 21 sentinels CROSS.FERT-03 / CROSS.FERT-06 / CROSS.FERT-07 | ✅ (already in smoke-phase21.cjs L238-244) |
| Cross-phase | Phase 21 JOURNAL-04 Diario section + journalToastVisible + JOURNAL-05 no-premium-gate preserved | smoke (file-content) | new sentinels mirroring smoke-phase21.cjs's own STRICT asserts: ModalSectionId includes `'diario'`; modal JSX includes JournalSection; PlantsScreen+TodayScreen `journalToastVisible` proximity with `journal.savedToast`; no premium-gate in 3 journal files | ❌ Wave 0 — copy from smoke-phase21.cjs |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit && node scripts/smoke-phase22.cjs`
- **Per wave merge:** Full smoke chain (Phase 18 + 19 + 20 + 21 + 22) + `npm run check:i18n-keys`
- **Phase gate:** Full suite green before `/gsd:verify-work`; manual device-test deferred to v1.2 milestone-end backlog memory (Option B precedent locked across Phases 18-21)

### Wave 0 Gaps
- [ ] `scripts/smoke-phase22.cjs` — covers GAM-01/02/05 + STRICT cross-phase Phase 18+19+20+21 sentinels (forked from smoke-phase21.cjs)
- [ ] `package.json` — add `"smoke:phase22": "node scripts/smoke-phase22.cjs"` npm script
- [ ] `.gitignore` — add `scripts/.tmp-phase22/` if any ts.transpileModule stubs are planned (likely not needed; file-content asserts are sufficient)
- [ ] `src/i18n/locales/en/common.json` — add `gamification.toastSuccess` key (EN: "You're on it! 🌱")
- [ ] `src/i18n/locales/es/common.json` — add `gamification.toastSuccess` key (ES voseo: "¡Vas bien! 🌱")
- [ ] (No new component files — Phase 22 reuses existing Toast primitive and adds inline JSX siblings to 3 screens.)
- [ ] (No framework install needed — `expo-haptics ~15.0.8` already present in package.json:41.)

## Sources

### Primary (HIGH confidence)
- `src/utils/haptics.ts:18-50` — `triggerHaptic('success')` maps to `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`; try/catch wrapper; production swallow; __DEV__ console.warn fallback. Verified directly.
- `src/components/Toast.tsx:1-86` — Toast props shape (`visible`/`message`/`actionLabel`/`onAction`/`durationMs`/`onDismiss`); Reanimated v4 slide-in from bottom; positions absolutely at `bottom: spacing.xxl + spacing.fabClearance`. Verified directly.
- `src/hooks/useStorage.tsx:485-501` — `fertilizePlant` action precedent for Phase 22 water/sun/outdoor parity; mirrors update pattern (find plant, compute next state, call `updatePlant` with `{ fromUserEdit: true }`). Verified directly.
- `src/hooks/useStorage.tsx:148-149,170,224,312,327,345,353,148` — `journals` state field hydration path showing the load + ref + setState + scheduleSave shape Phase 22 actions will mirror. Verified directly.
- `src/screens/TodayScreen.tsx:201-225` — current task-done handlers (handleWater/handleSunDone/handleOutdoorDone) that call `updatePlant` directly; Phase 22 migration targets. Toggle semantics for sun/outdoor at L210-212 and L218-222. Verified directly.
- `src/screens/CalendarScreen.tsx:83-113,254-266` — current day-detail handlers; CalendarScreen has no Toast surface today (grep count = 0); Phase 22 introduces the third Toast home. Verified directly.
- `src/screens/PlantsScreen.tsx:135-146,487-500` — Phase 18 + Phase 21 dual-Toast pattern; Phase 22 adds the third Toast sibling. Verified directly.
- `scripts/smoke-phase21.cjs:1-260` — Three-tier sentinel pattern (W0 STRICT PASS + SKIP→PASS placeholders + CROSS STRICT regression); fork target for smoke-phase22.cjs; proximity-regex pattern (L155-163) and negative-grep pattern (L173-181). Verified directly.
- `src/config/features.ts:31` — `CARE_STREAKS: false` confirmed as the sole false-positive in src/ for the streak negative-grep whitelist. Verified via `grep -rni "streak" src/`.
- `package.json:41` — `expo-haptics: ~15.0.8` already installed. Verified directly.
- `.planning/REQUIREMENTS.md:106-110` — GAM-01/02/05 wording. Verified directly.
- `.planning/ROADMAP.md:267-275` — Phase 22 success criteria. Verified directly.
- `.planning/phases/22-gamification-toasts-haptics/22-CONTEXT.md` — All locked decisions and discretion areas. Verified directly.

### Secondary (MEDIUM confidence)
- `src/i18n/locales/es/common.json:9-38` — Phase 21 `journal` namespace shape (header/savedToast/careTag/dateLabel/error) used as the structural precedent for `gamification` namespace placement; voseo applied consistently. Verified directly.
- `src/components/PlantCard.tsx:174,198` — `runOnJS(triggerHaptic)('impactMedium')` Reanimated worklet invocation precedent; contrasts with Phase 22's plain useCallback direct-call usage. Verified directly.

### Tertiary (LOW confidence)
- None — Phase 22 is entirely a "wire existing primitives + enforce anti-pattern at gate" exercise. All sources are in-repo HIGH confidence.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed (expo-haptics 15.0.8, Toast primitive, useStorage shape, i18n).
- Architecture: HIGH — context-callback pattern is novel for this repo but well-established in React (e.g., context-based notification systems). useEffect-cleanup discipline is standard.
- Pitfalls: HIGH — 8 pitfalls identified via direct source inspection; most rooted in the action-layer-missing observation (Pitfall 2) and the streak-flag whitelist (Pitfall 1).
- GAM-05 negative-grep: HIGH — verified the single false-positive (`CARE_STREAKS`) via direct grep; whitelist regex tested mentally against that line.
- Open Question 1 (PlantsScreen handlers): MEDIUM — needs ~3 minutes of read during planning to confirm; doesn't block research.

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (30 days — stable in-repo patterns; expo-haptics is a settled library; no upstream breakage expected)
