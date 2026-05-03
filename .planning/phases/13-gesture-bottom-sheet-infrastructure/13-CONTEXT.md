# Phase 13: Gesture + Bottom-Sheet Infrastructure - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** Hybrid — INFRA-01..04 are concrete; one focused discussion locked the provider nesting + PaywallModal Z-order strategy + haptics utility shape.

<domain>
## Phase Boundary

Install the four native packages (`react-native-reanimated@^4`, `react-native-gesture-handler@~2.28`, `@gorhom/bottom-sheet@^5.2.11`, `expo-haptics`) and wire `GestureHandlerRootView` + `BottomSheetModalProvider` into `App.tsx` so every downstream v1.2 phase that needs swipe gestures, bottom sheets, haptic feedback, or shimmer skeletons can be built on top WITHOUT a second native rebuild. Ship the custom 30-LOC `Skeleton` primitive and the `triggerHaptic()` utility wrapper in the same phase so Phase 14/18/20/21/22 callers have stable import paths from day one. Verify on iOS + Android device that bottom-sheet gestures and the App-level `PaywallModal` coexist without a Z-order glitch.

**Out of scope (deferred):**
- Any actual swipe-to-delete or long-press menu UI (Phase 18 — `PlantCard` cleanup).
- Any actual bottom-sheet content (Phase 14 educational modal, Phase 21 journal quick-add, Phase 22 toast confirmations).
- Any actual haptic call sites (Phase 18 swipe-complete, Phase 22 task-done success).
- `lottie-react-native` install — STACK.md flags it as MEDIUM confidence and only-if-needed; defer until Phase 22 (gamification toasts) or Phase 23 (illustrated empty states) actually needs Lottie files.
- `ReanimatedSwipeable` — explicitly banned per STATE.md and `.planning/research/PITFALLS.md` (iOS crash bug). Phase 18 will use `Gesture.Pan()` directly.
- Migration of any existing `LoadingScreen` usages to `Skeleton` — Skeleton is added; consumers migrate in their own phase when they need inline loading.

Locked from REQUIREMENTS.md: INFRA-01, INFRA-02 (with success-criterion adjustment below), INFRA-03, INFRA-04.

</domain>

<decisions>
## Implementation Decisions

### Package install (INFRA-01)

- **Use `npx expo install`, NEVER `npm install`** for all four packages — Expo's resolver pins SDK 54-compatible patch versions (Reanimated v4, RNGH ~2.28, expo-haptics ~14.x). This is the root cause of most reported SDK 54 + Reanimated v4 breakage in the wild per STACK.md.
- **Install order (single command groupings):**
  1. `npx expo install react-native-reanimated react-native-gesture-handler` — animation foundation + gesture peer dep first (BottomSheet's peer-dep requirement).
  2. `npx expo install @gorhom/bottom-sheet` — pin to `^5.2.11` (latest stable with Reanimated v4 support and shipped patches for #2528).
  3. `npx expo install expo-haptics` — first-party, zero native config beyond the install.
- **Reanimated babel plugin:** verify `babel.config.js` includes `react-native-reanimated/plugin` as the LAST plugin in the array. If missing, add it. Reanimated v4 will throw at runtime without this.
- **Metro cache:** after install, planner should include a `npx expo start --clear` step in the dev-test plan (one-time cache reset).

### Provider hierarchy (INFRA-02) — Outermost wrapper at App root

- **Single source of truth:** `GestureHandlerRootView` AND `BottomSheetModalProvider` wrap the entire `default export App` tree, ABOVE the `Features.AUTH` branch. Both AppContent paths inherit through React context — no duplication required, no drift possible.
- **Exact nesting (App.tsx default export):**
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
- **`PaywallModal` placement unchanged:** stays inside each AppContent as today. RN native `Modal` (`transparent`, `animationType="slide"`) renders above ALL JS-portal-based UI including gorhom bottom sheets — Z-order is enforced by the platform, not the JS tree.
- **Success-criterion adjustment for INFRA-02:** the original ROADMAP/REQUIREMENTS line says `grep -c "BottomSheetModalProvider" App.tsx === 2`. With the outermost-wrapper decision that count is **1 JSX usage** (plus the import line). Update the criterion to:
  > `grep -c "BottomSheetModalProvider" App.tsx === 2` — counts the import statement + a single JSX usage at App root above the `Features.AUTH` branch (single source of truth covers both AppContent paths via React context).
  
  The two-AppContent-paths discipline is still preserved for `<PaywallModal />` (CRIT-4 lock from STATE.md remains exactly as-is for paywall — that pattern is unchanged). For BottomSheet specifically, the App-root wrapper is the cleaner architecture and removes the drift risk.
- **Smoke / planner enforcement:** the planner MUST update the success-criterion language in the phase plans (ROADMAP language frozen, but the phase's plan + smoke runner + verification script enforce the adjusted shape). Document the rationale inline so future readers understand the "single wrap" is intentional.

### PaywallModal Z-order coexistence (INFRA-04)

- **Mutually exclusive at runtime:** if `PaywallModal` opens while a bottom sheet is open, the bottom sheet must dismiss first. Mirrors Phase 9 "close-then-trigger" PaywallContext contract.
- **Where to enforce:** add a `useEffect` inside `BottomSheetModalProvider`'s consumers (or a small helper hook `useDismissOnPaywall(sheetRef)`) that subscribes to PaywallContext's `isPaywallVisible`. When it becomes true, call `sheetRef.current?.dismiss()`. The hook is added in Phase 13 (the infrastructure phase) so Phase 14/21 sheet callers can opt in via one import. Since no real sheets ship in Phase 13, the hook is exported but unused until Phase 14.
- **Rationale:** native RN Modal renders above JS portal sheets on both iOS and Android. Without dismissal, a user gated mid-action would see the paywall slide up over a stuck bottom sheet — visually correct but the sheet stays mounted in memory. Explicit dismiss avoids state desync.
- **Device test:** INFRA-04 verification on iOS + Android checks: open the dev-tools test bottom sheet, then trigger PaywallModal → bottom sheet must close cleanly, paywall must render unobstructed.

### Skeleton component (INFRA-03)

- **File:** `src/components/Skeleton.tsx` — single primitive, ~30 LOC. Theme-driven (`colors.bgPrimary` base, `colors.border` highlight gradient).
- **Props (minimum surface):** `width: number | string`, `height: number`, `borderRadius?: number` (default `borderRadius.sm`).
- **Implementation:** `View` with `expo-linear-gradient` child, animated via Reanimated v4 `useSharedValue` + `withRepeat(withTiming(...), -1)` — horizontal translateX shimmer.
- **No pre-built variants in Phase 13** (no `SkeletonText`, `SkeletonCard`). Wait until a consumer phase needs them. Premature abstraction risk if we author variants without a real use site.
- **Verification:** import + render once in the SettingsScreen dev-tools section (mirrors the unknown-plants report dev-tool from Phase 12) so INFRA-04 device test confirms the shimmer animates on real hardware (not just simulator). Remove or keep as a permanent dev tool — Claude's discretion at planning time.

### Haptics utility wrapper (Phase 13 ships it)

- **File:** `src/utils/haptics.ts` — exports `triggerHaptic(kind: HapticKind): void` wrapping `expo-haptics`.
- **API surface (locked):**
  ```ts
  type HapticKind =
    | 'impactLight' | 'impactMedium' | 'impactHeavy'
    | 'success' | 'warning' | 'error'
    | 'selection';
  export function triggerHaptic(kind: HapticKind): void;
  ```
- **Error handling:** silent try/catch; in `__DEV__` log a `console.warn('[haptics] ...')`; in production swallow. Mirrors established pattern (unknown-plant tracker, sync errors).
- **Fire-and-forget:** function returns `void`, internally calls `Haptics.*Async()` and discards the promise (no await). Calling code never blocks on haptics.
- **Why ship in Phase 13:** Phase 18 swipe (`impactMedium`), Phase 22 task-done (`success`), and Phase 14 long-press menu (`impactLight`) all need this in the next 4 phases. Locking the import path now prevents 8 divergent ad-hoc usages later.

### Smoke runner (Claude's discretion)

- **Recommendation:** add `scripts/smoke-phase13.mjs` modeled after `smoke-phase11.mjs` / `smoke-phase12.mjs`. Coverage:
  1. `package.json` contains all 4 new deps at expected version ranges.
  2. `App.tsx` contains exactly 2 `BottomSheetModalProvider` references (1 import + 1 JSX usage) and exactly 2 `GestureHandlerRootView` references.
  3. `App.tsx` import block contains both packages.
  4. `babel.config.js` includes `react-native-reanimated/plugin` as the LAST plugin.
  5. `Skeleton.tsx` exports a function/component named `Skeleton`.
  6. `haptics.ts` exports `triggerHaptic` and the `HapticKind` type.
- **No transpileModule import-execution needed** — Phase 13 is config + JSX wrapping, not runtime logic. File-content asserts via `readFileSync` are sufficient.

### Cross-cutting / Claude's Discretion

- **Dev-tool test sheet for INFRA-04:** add a `__DEV__`-gated `TouchableOpacity` in `SettingsScreen` Dev tools section (next to "Show Paywall" and the unknown-plants report) labeled `t('settings.devTestBottomSheet')`. Tap opens a minimal `BottomSheetModal` with one line of text + a close button. This serves the device-verification surface AND survives as a regression check for future phases. Acceptable to keep or strip; planner decides.
- **Manual checkpoint task for INFRA-04:** mirror Phase 7 / Phase 10 deferred-deploy pattern — explicit `autonomous: false` task in the phase plan that says "Open the app on iOS dev client AND Android dev client. Tap the dev-tools test bottom sheet. Confirm: sheet opens with gesture, dismisses with swipe-down, no PaywallModal Z-conflict, Skeleton shimmer animates. Reply 'verified' to continue." Executor blocks until user confirms.
- **Bottom-sheet bug fallback:** STATE.md flagged `@gorhom/bottom-sheet` v5.2.11 + Expo SDK 54 device bugs (#2528, #2471). Phase 13 trusts the patches and ships at `^5.2.11`. If the device test reveals a regression, the fallback is a custom `Animated.View` + `PanResponder` action sheet covering only the 2-3 in-scope use cases (delete confirm, journal add, fertilization log). Defer this contingency to a deviation handler at Phase 14 planning if INFRA-04 fails — do NOT pre-build the fallback in Phase 13.
- **Skeleton variants deferred:** no `SkeletonText` / `SkeletonCard` / `SkeletonImage` until Phase 14 (educational modal loading state) or Phase 21 (journal photo loading) actually needs one. YAGNI.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — Expo SDK 54 stack, design-system constraints, two-AppContent-paths discipline, no test framework.
- `/Users/gaston/Documents/Personal/MiJardinApp/app.json` — verify `newArchEnabled: true` is set (Reanimated v4 requirement).
- `/Users/gaston/Documents/Personal/MiJardinApp/package.json` — current deps; verify the 4 new packages don't already appear.
- `/Users/gaston/Documents/Personal/MiJardinApp/babel.config.js` — must include `react-native-reanimated/plugin` as last plugin after install.

### Planning artifacts
- `.planning/PROJECT.md` — milestone context (v1.2 Recommendation-First Plant Guide), key decisions table.
- `.planning/REQUIREMENTS.md` §"Gesture + Bottom-Sheet Infrastructure (INFRA)" — INFRA-01..04 locked requirements (with INFRA-02 success-criterion adjustment captured in §Decisions above).
- `.planning/ROADMAP.md` §"Phase 13: Gesture + Bottom-Sheet Infrastructure" — goal + 4 success criteria.
- `.planning/STATE.md` §"Blockers/Concerns" — Phase 13 entry on `@gorhom/bottom-sheet` 5.2.11 device bugs and the PanResponder fallback option.
- `.planning/research/STACK.md` §"Animation Foundation", §"Bottom Sheet", §"Haptic Feedback", §"Skeleton Loaders", §"Installation Commands", §"Architectural Decisions for v1.2" — version pinning rationale, install order, provider sketch.
- `.planning/research/PITFALLS.md` — `ReanimatedSwipeable` ban rationale (iOS crash bug); `Gesture.Pan()` is the safe alternative.
- `.planning/research/ARCHITECTURE.md` — provider hierarchy mirroring conventions.

### Source files of interest (Phase 13 modifies)
- `App.tsx:373-383` — `default export App` provider tree; both `GestureHandlerRootView` + `BottomSheetModalProvider` wrap above the `Features.AUTH ? AppContentFull : AppContentMVP` branch.
- `App.tsx:227` (AppContentMVP) and `App.tsx:368` (AppContentFullInner) — `<PaywallModal />` placement unchanged; both inherit BottomSheet/Gesture context from the App root wrapper.
- `App.tsx:155` (PaywallModal) — `Modal` component with `transparent` + `animationType="slide"`; native presentation explains why it renders above JS portal sheets.
- `babel.config.js` — append `react-native-reanimated/plugin` as last plugin entry.
- `package.json` — add 4 new deps via `npx expo install`.

### Source files of interest (Phase 13 creates)
- `src/components/Skeleton.tsx` — new file; ~30 LOC primitive (View + LinearGradient + Reanimated v4 shimmer).
- `src/utils/haptics.ts` — new file; `triggerHaptic(kind)` wrapper + `HapticKind` type.
- `src/screens/SettingsScreen.tsx` — extend `__DEV__` block with test-bottom-sheet entry (Claude's discretion at planning).
- `src/i18n/locales/{en,es}/common.json` — add `settings.devTestBottomSheet` key (and any companion keys) with locale parity.
- `scripts/smoke-phase13.mjs` — new smoke runner (file-content asserts only; no transpileModule).

### Existing patterns to mirror
- **Provider hierarchy discipline:** v1.1 Phase 5 Plan 05 lock — providers are added in App.tsx ONCE at the right tree level; do not nest inside individual screens.
- **Two-AppContent-paths for `<PaywallModal />`:** v1.1 Phase 9 PAY-01 — `PaywallModal` JSX appears in BOTH AppContentMVP AND AppContentFullInner. This pattern stays exactly as-is for paywall; the bottom-sheet provider takes a different (App-root) approach because it's stateless context, not a stateful modal.
- **Manual checkpoint task:** v1.1 Phase 7 + v1.2 Phase 10 — `autonomous: false` task that returns `CHECKPOINT REACHED` until the user replies. INFRA-04 device verification follows this exact pattern.
- **Smoke runner shape:** `scripts/smoke-phase11.mjs` and `scripts/smoke-phase12.mjs` — `transpileModule` + `.tmp-phaseN/` stubs at runtime. Phase 13 simplifies this to file-content reads only (no module execution needed).
- **Silent fire-and-forget services:** `src/services/unknownPlantTracker.ts` (Phase 12) — try/catch, `console.warn` in `__DEV__`, swallow in production. `triggerHaptic()` follows the same shape.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expo-linear-gradient ~15.0.8` is already installed (used in PaywallModal:163) — Skeleton's gradient layer reuses it; zero new deps for the gradient itself.
- `__DEV__` guard pattern in `SettingsScreen.tsx:421+` already hosts dev-only entries (Show Paywall, Load v0 fixture, Unknown plants report from Phase 12). Test-bottom-sheet entry slots in the same block with the same `styles.devButton` style — no new component scope.
- `NotificationContext.Provider` in `App.tsx:215` shows the established pattern for wrapping AppContent in extra providers — but BottomSheet/Gesture sit at App root (above Features.AUTH branch) per the locked nesting decision.
- PaywallContext (`src/hooks/usePaywall.ts` per Phase 9 architecture) exposes `isPaywallVisible` — `useDismissOnPaywall` hook subscribes here.

### Established Patterns
- **`npx expo install`-only for native modules** — never raw `npm install` for any of the 4 new packages; Expo's resolver pins SDK 54-compatible patches.
- **Babel plugin discipline:** Reanimated's plugin MUST be the last entry in `babel.config.js` plugins array. Existing config likely doesn't include it (no Reanimated installed yet).
- **Native rebuild needed:** all 4 packages add native code. After install + provider wire, a fresh `eas build --profile development` (or `expo prebuild` + native rebuild) is required. Expo Go does NOT support these on first install — `npx expo run:ios`/`run:android` builds a dev client. Document this in the manual-checkpoint task.
- **Two-AppContent-paths discipline (CRIT-4):** stays in force for `<PaywallModal />`. The BottomSheetModalProvider takes a different architectural shape (App root) because it's a context provider, not a render-once stateful modal.

### Integration Points
- **`App.tsx` default export** — single insertion of 2 wrapper components above the AUTH branch. ~6 line addition.
- **`SettingsScreen.tsx` Dev tools section** — 1 new TouchableOpacity + bottom-sheet handler (~20 LOC for the test sheet).
- **`PaywallContext` (read-only consumer)** — `useDismissOnPaywall` hook subscribes to `isPaywallVisible`. No PaywallContext mutation in Phase 13.
- **No screen / no business logic touched** — pure infrastructure.

</code_context>

<specifics>
## Specific Ideas

- **"Single source of truth at App root" wins over the literal grep gate.** The user's call: keep the architectural cleanliness, adjust the success criterion language to match (count = 1 JSX usage covers both AppContent paths via context). The two-AppContent-paths discipline still applies to `<PaywallModal />` exactly as it does today.
- **PaywallModal preempts bottom sheets** — mirrors Phase 9 close-then-trigger contract. Bottom sheets dismiss when `isPaywallVisible` flips true. No paywall-on-top-of-stuck-sheet state.
- **Skeleton primitive is intentionally minimal.** No variants until a consumer phase needs them. Premature variant authoring is a YAGNI trap.
- **Haptics utility ships now even though Phase 13 has no callers.** Phase 14/18/22 callers all need it within the next 4 phases — locking the import path early prevents 8 divergent ad-hoc usages.
- **Manual checkpoint task for device test** — explicit `autonomous: false`, executor blocks until user replies "verified". Pattern from Phase 7 + Phase 10.
- **Trust @gorhom/bottom-sheet 5.2.11 patches; defer fallback construction.** Don't pre-build PanResponder fallback. If device test fails, escalate to deviation handler at Phase 14 planning time.

</specifics>

<deferred>
## Deferred Ideas

- **`lottie-react-native`** — not installed in Phase 13. Defer to Phase 22 (gamification toasts) or Phase 23 (illustrated empty states). STACK.md flags MEDIUM confidence and "only when designer provides Lottie files".
- **`SkeletonText` / `SkeletonCard` / `SkeletonImage` variants** — Phase 14/21 will add what they actually need. YAGNI.
- **Migrating existing `LoadingScreen` usages to `Skeleton`** — separate refactor; not in Phase 13. Skeleton is for inline loading states (cards, sections); LoadingScreen is for full-screen.
- **Custom `Animated.View` + `PanResponder` bottom-sheet fallback** — only built if INFRA-04 device test reveals an unrecoverable regression with `@gorhom/bottom-sheet`. Deviation contingency at Phase 14 planning, not Phase 13.
- **Pre-built haptic call sites (PlantCard swipe, task-done toast)** — Phase 18 / Phase 22 own these.
- **Real bottom-sheet content (delete confirm, journal add, fertilization log)** — Phase 14 / 18 / 21 / 22 own these.
- **`ReanimatedSwipeable` reconsideration** — banned for v1.2 per STATE.md and PITFALLS.md (iOS crash bug). Revisit only if the upstream fix lands in a future RNGH version pinned by Expo.

</deferred>

---

*Phase: 13-gesture-bottom-sheet-infrastructure*
*Context gathered: 2026-05-03*
