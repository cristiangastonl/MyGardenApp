---
phase: 13-gesture-bottom-sheet-infrastructure
plan: 01
subsystem: infra
tags: [native-deps, expo-install, gesture-handler, bottom-sheet, reanimated, expo-haptics, provider-wrap, app-root]

# Dependency graph
requires:
  - phase: 13-00
    provides: scripts/smoke-phase13.mjs harness with INFRA-01/02 placeholders pre-wired (c === 3 lock)
provides:
  - "react-native-reanimated@~4.1.1, react-native-gesture-handler@~2.28.0, @gorhom/bottom-sheet@^5.2.13, expo-haptics@~15.0.8 in package.json"
  - "GestureHandlerRootView + BottomSheetModalProvider single App-root wrap (above Features.AUTH branch)"
  - "All 9 INFRA-01/02 smoke placeholders flipped SKIP → PASS"
affects: [13-02 (consumer primitives can now import BottomSheetModal/expo-haptics/Reanimated v4 worklets), 13-03 (manual device verification target)]

# Tech tracking
tech-stack:
  added:
    - "react-native-reanimated@~4.1.1 (Reanimated v4 — required by SDK 54 New Arch; ban on v3)"
    - "react-native-gesture-handler@~2.28.0 (compatible peer for Reanimated v4; ReanimatedSwipeable banned per STATE.md)"
    - "@gorhom/bottom-sheet@^5.2.13 (resolver picked latest patch under ^5.2.11 caret; v5.2.10/11/13 ship the SDK 54 + Reanimated v4 fixes)"
    - "expo-haptics@~15.0.8 (first-party Expo, zero native config)"
  patterns:
    - "Single App-root wrap for stateless context providers (NOT duplicated into AppContentMVP/AppContentFullInner) — locked JSX shape produces grep -c === 3"
    - "Two-AppContent-paths discipline (CRIT-4) preserved exclusively for stateful render-once components like <PaywallModal />; stateless providers use App-root wrap"
    - "babel.config.js stays absent under Expo SDK 54 — babel-preset-expo auto-manages react-native-worklets/plugin; manual config would cause conflict warning"

key-files:
  created: []
  modified:
    - "package.json (4 new dependencies via npx expo install)"
    - "package-lock.json (resolver-pinned transitive tree; +662 lines)"
    - "App.tsx (2 new imports adjacent to RN-ecosystem block; default-export return JSX wrapped with locked GestureHandlerRootView + BottomSheetModalProvider shape)"

key-decisions:
  - "Used `npx expo install` (NEVER `npm install`) for all 4 packages per CONTEXT.md lock — Expo's resolver pins SDK 54-compatible patches automatically"
  - "Single App-root wrap above the Features.AUTH branch — both AppContentMVP and AppContentFullInner inherit context via React context propagation; no duplication, no drift possible"
  - "babel.config.js NOT created — Expo SDK 54's babel-preset-expo auto-manages the worklets plugin; the smoke runner's babel-conditional placeholder remains PASS via the absent-is-preferred branch"
  - "PaywallModal placement inside both AppContentMVP and AppContentFullInner is unchanged — CRIT-4 / two-AppContent-paths discipline preserved exclusively for stateful render"

patterns-established:
  - "Stateless context providers go at App root; stateful render-once modals follow two-AppContent-paths discipline. The distinction is whether the component holds local state that diverges between the MVP and Full code paths."
  - "ROADMAP success criteria phrased as substring-match counts (`grep -c X === 3`) document the literal JSX shape: 1 import + 1 opening tag + 1 closing tag = 3 substring matches via /Pattern/g"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: ~3 min execution + ~50 min stream-timeout aftermath
completed: 2026-05-03
---

# Phase 13 Plan 01: Native Package Install + Provider Wrap Summary

**Installed the four native v1.2 foundation packages via `npx expo install` and wired a single App-root `GestureHandlerRootView` + `BottomSheetModalProvider` wrap above the `Features.AUTH` branch in `App.tsx`. INFRA-01 + INFRA-02 closed; smoke runner reports `PASS 15/15 (+7 skipped)` with all remaining skips attributable to Plan 13-02 deliverables.**

## Performance

- **Duration:** ~3 min for the two task commits (`a6b9dd2` install + `1ff44d3` App.tsx wrap); the final SUMMARY/STATE/ROADMAP bookkeeping was finalized after a Claude API stream-idle timeout that interrupted the executor mid-bookkeeping
- **Started:** 2026-05-03T14:22:22Z
- **Code commits completed:** 2026-05-03T14:23:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `package.json` declares all 4 native deps at SDK 54-compatible patches: `react-native-reanimated@~4.1.1`, `react-native-gesture-handler@~2.28.0`, `@gorhom/bottom-sheet@^5.2.13`, `expo-haptics@~15.0.8`
- `App.tsx` default-export return JSX wraps the entire provider tree (above the `Features.AUTH` branch) in `<GestureHandlerRootView style={{ flex: 1 }}><BottomSheetModalProvider>...</BottomSheetModalProvider></GestureHandlerRootView>`
- `grep -c "BottomSheetModalProvider" App.tsx` returns 3; `grep -c "GestureHandlerRootView" App.tsx` returns 3 — locked JSX shape per ROADMAP success criterion (1 import + 1 opening tag + 1 closing tag)
- Both AppContent paths (MVP and FullInner) inherit gesture/sheet context via React context — no duplication required, no drift possible
- PaywallModal placement inside both AppContent paths is unchanged — CRIT-4 / two-AppContent-paths discipline preserved exclusively for stateful render
- `babel.config.js` remains absent — Expo SDK 54's `babel-preset-expo` auto-manages the worklets plugin
- `app.json` `newArchEnabled: true` preserved (read-only verification — Reanimated v4 requirement)
- `node scripts/smoke-phase13.mjs` exits 0 with final report `PASS 15/15 (+7 skipped)`; the 7 remaining skips are all Plan 13-02 deliverables (Skeleton, haptics util, useDismissOnPaywall, SettingsScreen dev test sheet, en/es i18n keys)
- `npx tsc --noEmit` exits 0

## Task Commits

1. **Task 1: Install 4 native packages via `npx expo install`** — `a6b9dd2` (chore)
2. **Task 2: Wire GestureHandlerRootView + BottomSheetModalProvider into App.tsx default export** — `1ff44d3` (feat)

**Plan metadata:** _(separate final commit captures SUMMARY + STATE + ROADMAP + the locked-`=== 3` CONTEXT.md inline note that was authored during planning revision but never committed)_

## Files Created/Modified

- `package.json` (+4 dep entries) — 4 new native deps via `npx expo install`
- `package-lock.json` (+662 lines) — resolver-pinned transitive tree
- `App.tsx` (13 insertions, 7 deletions) — 2 new imports adjacent to RN-ecosystem block (lines 8-9); default-export return JSX wrapped with locked `GestureHandlerRootView` + `BottomSheetModalProvider` shape

## Smoke Runner Outcome

Wave 0 baseline (Plan 13-00 ship) reported `PASS 6/6 (+16 skipped)`. After Plan 13-01:

- **PASS 15/15 (+7 skipped)** — flipped 9 placeholders from SKIP to PASS:
  - 4 INFRA-01 deps placeholders
  - 5 INFRA-02 placeholders (provider counts × 2, imports present, JSX nesting, flex: 1)
  - (the 6th INFRA-02 placeholder, babel-conditional, was already PASS at Wave 0 baseline because absence is the preferred state)
- **7 SKIPs remaining** — all attributable to Plan 13-02 (Skeleton, haptics util, useDismissOnPaywall hook, SettingsScreen dev test sheet, en/es i18n keys)

## Decisions Made

1. **Used `npx expo install`, NEVER `npm install`** — per CONTEXT.md lock, Expo's resolver pins SDK 54-compatible patch versions automatically. Raw `npm install` is the most-reported root cause of SDK 54 + Reanimated v4 breakage in the wild.

2. **Single App-root wrap, not per-AppContent duplication.** Stateless context providers (`GestureHandlerRootView`, `BottomSheetModalProvider`) go at App root above the `Features.AUTH` branch. Both AppContent paths inherit context via React context propagation. The two-AppContent-paths discipline (CRIT-4) is preserved exclusively for stateful render-once components like `<PaywallModal />`.

3. **No `babel.config.js` created.** Expo SDK 54's `babel-preset-expo` auto-manages the `react-native-worklets/plugin`. Creating one manually would cause a conflict warning and may double-transform worklets. The smoke runner's babel-conditional placeholder asserts "absent OR uses worklets/plugin"; absence is the preferred state.

4. **`@gorhom/bottom-sheet` resolved to `^5.2.13`** even though CONTEXT.md pins `^5.2.11`. The caret allows the resolver to pick the latest 5.2.x patch; 5.2.13 (April 2026) ships the React mount-reset fix on top of 5.2.11's Expo SDK 54 + Reanimated v4 patches. Behaviorally compatible with the lock.

## Deviations from Plan

### Operational deviations

**1. [Stream timeout] Executor agent stream-idled mid-bookkeeping after task commits landed**

- **Found during:** Post-Task 2 (SUMMARY/STATE/ROADMAP write phase)
- **Issue:** Claude API stream-idle timeout interrupted the gsd-executor agent after both code commits (`a6b9dd2`, `1ff44d3`) were already on disk. The agent never wrote `13-01-SUMMARY.md`, never ran `gsd-tools state advance-plan`, and never ran `gsd-tools roadmap update-plan-progress`. Full code work was complete; only bookkeeping was stranded.
- **Fix:** Orchestrator finalized bookkeeping directly after spot-checking that both commits were authored cleanly and the smoke runner reports `PASS 15/15 (+7 skipped)`. SUMMARY.md authored from the captured commit metadata; STATE.md + ROADMAP.md updated via the same gsd-tools commands the executor would have used.
- **Files modified:** This SUMMARY.md (new), STATE.md (append session + advance plan position), ROADMAP.md (plan-progress update), 13-CONTEXT.md (commit the inline `=== 3` note authored during planning revision but never committed)
- **Verification:** `node scripts/smoke-phase13.mjs` → `PASS 15/15 (+7 skipped)`, `npx tsc --noEmit` → exit 0, `git log --oneline` shows both task commits present, no `Self-Check: FAILED` markers anywhere

### No code deviations

The two task commits faithfully implement the plan's `<action>` blocks. No scope creep, no shape changes, no fallback paths invoked. The bottom-sheet bug-watch from STATE.md (gorhom v5.2.11 + SDK 54) was NOT triggered — install completed without errors. INFRA-04 device verification (Plan 13-03) is the next gate for the bug-watch.

## Issues Encountered

1. **Stream-idle timeout in executor agent.** Documented above. No code impact.
2. **CONTEXT.md inline `=== 3` note authored during planning revision was never committed.** The planner agent edited `13-CONTEXT.md` during the iteration-2 revision (adding a "Final smoke assertion" bullet to align the doc with the ROADMAP `=== 3` lock) but the orchestrator's earlier `state record-session` flow had already moved past the commit gate. The diff was sitting in the working tree as `M .planning/phases/13-gesture-bottom-sheet-infrastructure/13-CONTEXT.md` until this SUMMARY's finalize commit picks it up.

## User Setup Required

None — `npx expo install` runs locally and writes only to `package.json` + `package-lock.json`. No external accounts, no service credentials, no remote config.

## Next Phase Readiness

- **Plan 13-02 unblocked:** The 4 native deps are in `package.json` and the App-root provider wrap is live, so Plan 13-02 can:
  - Import `react-native-reanimated` worklets (`useSharedValue`, `withRepeat`, `withTiming`) for the 30-LOC `Skeleton` shimmer
  - Import `expo-haptics` for the `triggerHaptic(kind)` utility
  - Import `BottomSheetModal`, `BottomSheetView` from `@gorhom/bottom-sheet` for the SettingsScreen `__DEV__` test sheet
  - Import `usePremium` from `src/hooks/usePremium` for the `useDismissOnPaywall(sheetRef)` hook
- **Plan 13-03 (manual device checkpoint) target ready:** The complete native foundation is in place; iOS + Android dev clients can now be rebuilt (`npx expo run:ios` / `npx expo run:android`) and the manual gesture/Z-order/shimmer verification surface (added by Plan 13-02) becomes testable.
- **Phase 10 SEC-01 grep guard preserved:** `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` returns count 0 on every line. Plan 13-01 did not touch any client source.
- **Active bug-watch unchanged:** STATE.md flagged `@gorhom/bottom-sheet` v5.2.11+ + Expo SDK 54 device bugs (#2528, #2471). The install completed cleanly; surfaces will be verified in Plan 13-03 device test. If regression is observed, fallback is custom `Animated.View` + `PanResponder` per CONTEXT.md (do NOT pre-build).

---
*Phase: 13-gesture-bottom-sheet-infrastructure*
*Completed: 2026-05-03*

## Self-Check: PASSED

Verification (run after SUMMARY.md write):

- `package.json` contains all 4 deps: FOUND (`react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`, `expo-haptics`)
- `App.tsx` has 3 `BottomSheetModalProvider` matches: FOUND
- `App.tsx` has 3 `GestureHandlerRootView` matches: FOUND
- `node scripts/smoke-phase13.mjs` exit code: 0
- Final report: `[smoke-phase13] PASS 15/15 (+7 skipped)`
- `npx tsc --noEmit` exit code: 0
- Commits `a6b9dd2` + `1ff44d3` exist in git log: FOUND
- SEC-01 grep guard: 0 hits (count 0 on every line)
- `babel.config.js` absent: CONFIRMED (`ls babel.config.js 2>/dev/null` returns nothing)
- `app.json` `newArchEnabled: true` preserved: CONFIRMED
