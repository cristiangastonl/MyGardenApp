# Phase 22: Gamification — Toasts + Haptics - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire positive celebration on care-task completion. When a user marks any task done (water/sun/outdoor/fertilize), the app fires `triggerHaptic('success')` (Haptics.NotificationFeedbackType.Success on both iOS + Android) AND shows a transient toast `"¡Vas bien! 🌱"` (2-second auto-dismiss). All four task-done flows in `useStorage` (`waterPlant`, `sunPlant`, `outdoorPlant`, `fertilizePlant`) become the single source of truth for firing both signals. Screen-level Toast surfaces (PlantsScreen + TodayScreen + CalendarScreen) own `gamificationToastVisible` state and render a third independent `<Toast>` sibling alongside the existing Phase 18 swipe-undo Toast and Phase 21 journal-saved Toast.

GAM-05 (streak-anxiety anti-pattern) is enforced at the smoke-runner level via a STRICT negative-grep that fails if any of `streak`, `consecutiveDays`, `dayCount`, `currentStreak`, `bestStreak`, `streakReset` appears in `src/` (excluding the existing `gam_anti_patterns.md` memory reference comments). Mood emoji (Phase 18 GAM-03/04) already communicates plant state — no new UI state added.

**Out of scope:** per-task-type toast copy variants (single message only); persistent counters / scoreboards / leaderboards; any longitudinal "you cared for X days in a row" stats; daily/weekly digest emails; sharing achievements externally; streak-style badges; sound effects (haptic is the only audible signal); animated confetti; reward/coin economies.

</domain>

<decisions>
## Implementation Decisions

### Toast firing + haptic pattern (Area 1)

- **Single Toast copy for all 4 task types:** `t('gamification.toastSuccess')` resolves to `"¡Vas bien! 🌱"` in ES and `"You're on it! 🌱"` in EN. No per-task variants — keeps copy simple and matches GAM-01 wording verbatim.
- **Toast duration:** 2 seconds auto-dismiss. Matches Phase 18 swipe-undo Toast + Phase 21 journal-saved Toast durations. Same animation primitives (existing `<Toast>` `durationMs` prop).
- **Firing site:** Inside `useStorage` actions — `waterPlant`, `sunPlant`, `outdoorPlant`, `fertilizePlant`. Each action calls `triggerHaptic('success')` AND signals the screen-level Toast via an `onTaskCompleted?: () => void` callback passed through the StorageContext. Single source of truth — fire-and-forget. NOT instrumented at each TaskButton call site (PlantCard, DayDetailModal) — that would be N call sites = N changes and would risk drift.
- **Screen-level Toast surface:** PlantsScreen + TodayScreen + CalendarScreen each own a `gamificationToastVisible` state declared distinctly from Phase 18's `toastVisible` and Phase 21's `journalToastVisible`. Each screen registers its setter as the `onTaskCompleted` callback. Render a THIRD independent `<Toast>` sibling. Three coexisting Toasts per screen at maximum (Phase 18 swipe-undo + Phase 21 journal-saved + Phase 22 task-done).

### Streak-anxiety anti-pattern enforcement (Area 2)

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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`triggerHaptic` utility** (`src/utils/haptics.ts:18-50`, Phase 13 INFRA): `success` kind maps to `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`. Already in-repo; just call from useStorage actions.
- **`<Toast>` primitive** (`src/components/Toast.tsx`, Phase 18): `visible + message + durationMs + onDismiss` props. Already wired for cross-screen use.
- **`useStorage` task-done actions** (`src/hooks/useStorage.tsx`): `waterPlant`, `sunPlant`, `outdoorPlant`, `fertilizePlant` — single source of truth for the 4 task types. Each follows the same pattern (`cur` snapshot + spread + setState + scheduleSave).
- **Screen-level Toast pattern** (`src/screens/PlantsScreen.tsx:135-145, 472-480` + `src/screens/TodayScreen.tsx:249-260, 681-690`): Phase 18 `toastVisible` + Phase 21 `journalToastVisible`. Phase 22 adds a third `gamificationToastVisible`.
- **CalendarScreen** (`src/screens/CalendarScreen.tsx`): consumes useStorage but does NOT currently render Toasts at screen level. Phase 22 introduces it.
- **`PlantCard.tsx:174,198`** Phase 18 precedent for `runOnJS(triggerHaptic)` invocation pattern (gesture-driven). Phase 22 uses the simpler direct call inside useCallback bodies.

### Established Patterns

- **Phase 18 atomic commit per task** (GSD baseline)
- **Phase 18 Toast 2s auto-dismiss + cross-screen consistency**: reused twice already (Phase 21 journal-saved); Phase 22 reuses a third time
- **Phase 19/20/21 ModalSectionId extension pattern**: NOT applicable here (Phase 22 adds no modal sections)
- **Phase 21 distinct identifier discipline**: Phase 22 adds `gamificationToastVisible` (distinct from `toastVisible` + `journalToastVisible`); negative-grep sentinels lock the discipline
- **Atomic single-source-of-truth for cross-cutting concerns** (useStorage as the gateway for state-mutating actions): mirror Phase 21's `fertilizePlant` extension pattern

### Integration Points

- **`useStorage.tsx`** action bodies for `waterPlant` / `sunPlant` / `outdoorPlant` / `fertilizePlant`: each gains 2 lines — `triggerHaptic('success')` + `onTaskCompleted?.()` (callback invocation)
- **`StorageContext` interface**: add optional `setOnTaskCompleted?: (cb: (() => void) | null) => void` action OR provider-prop `onTaskCompleted?: () => void` (planner's choice)
- **`PlantsScreen.tsx` / `TodayScreen.tsx` / `CalendarScreen.tsx`**: each declares `const [gamificationToastVisible, setGamificationToastVisible] = useState(false);`, registers callback in `useEffect`, renders third `<Toast visible={gamificationToastVisible} message={t('gamification.toastSuccess')} ... />` sibling
- **`scripts/smoke-phase22.cjs`**: new — fork `smoke-phase21.cjs` structure; replace JOURNAL-* sentinels with GAM-* sentinels; preserve STRICT cross-phase regression sentinels for Phase 18 + 19 + 20 + 21
- **i18n keys** (`src/i18n/locales/{en,es}/common.json`): `gamification.toastSuccess` key in both locales (ES voseo)

</code_context>

<specifics>
## Specific Ideas

- **GAM-05 anti-pattern lock is enforced at compile-time, not just policy.** The smoke runner negative-grep will FAIL if anyone (future Claude, future contributor) tries to add streak tracking. Documented in code comment + memory file.
- **Three coexisting Toasts per screen is the established pattern.** Phase 18 + Phase 21 + Phase 22 = 3 Toasts. They're independent (each has its own state, message, duration). No conflict.
- **`triggerHaptic('success')` is the EXISTING utility** — Phase 13 shipped it ready for use. Phase 22 is the first phase to call it (Phase 18 used `impactMedium` + `impactLight` for swipe-commit).
- **CalendarScreen is the new Toast-rendering screen.** Phases 18 + 21 only added Toasts to PlantsScreen + TodayScreen. Phase 22 brings CalendarScreen into the pattern because tasks can be marked done from the day-detail modal launched from CalendarScreen.

</specifics>

<deferred>
## Deferred Ideas

- **Per-task-type toast variants** ("¡Regaste! 💧" / "¡Fertilizaste! 🌱") — single message in v1.2; future polish phase could add variants if user demand emerges.
- **Soft progress indicators** (e.g., "3 tasks done today" bar) — NEVER. Anti-pattern lock.
- **Sound effects** — out of scope; haptic is the only audible signal in v1.2.
- **Confetti animation** on milestone task counts — too gamified; anti-pattern adjacent.
- **Achievement badges** ("first watering of the season") — out of scope; would require persistent state.
- **Daily / weekly care recap email** — server-side feature; out of scope until v2.0 cloud sync.
- **Sharing care updates externally** (Twitter, Instagram) — out of scope.
- **Reward / coin / point economies** — anti-pattern. NEVER.
- **Mood emoji tap → gamification stats screen** — Phase 18 mood emoji opens PlantHealthDetail; no gamification overlay added.

</deferred>

---

*Phase: 22-gamification-toasts-haptics*
*Context gathered: 2026-05-11 via smart-discuss (autonomous mode)*
