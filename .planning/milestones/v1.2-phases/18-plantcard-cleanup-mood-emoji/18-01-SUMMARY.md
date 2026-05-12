---
phase: 18-plantcard-cleanup-mood-emoji
plan: 01
subsystem: infra
tags: [smoke-runner, i18n, toast, scaffold, validation]

# Dependency graph
requires:
  - phase: 13-gesture-bottom-sheet-infrastructure
    provides: triggerHaptic + useDismissOnPaywall + BottomSheetModalProvider (Toast skeleton imports/types ready for Plan 18-02 consumption)
  - phase: 17-catalog-wave-c-exterior-aromaticas-frutales
    provides: 118-entry catalog locked (downstream PlantCard restructure operates over the closed catalog surface)
provides:
  - "scripts/smoke-phase18.cjs file-content smoke runner — 159 LOC, 35 PASS / 21 SKIP / 0 FAIL exit 0 baseline"
  - "13 i18n keys (plantCard.menu.*, menuSheet.*, deleteHint, undoToast.*, moodA11y.*) with EN+ES locale parity"
  - "src/components/Toast.tsx skeleton — ToastProps interface + minimal no-op render; full impl deferred to Plan 18-02"
  - "package.json smoke:phase18 script entry"
  - ".gitignore reservation for scripts/.tmp-phase18/ (convention-only, Phase 18 has no runtime stubs)"
affects:
  - 18-02 (Toast Reanimated impl + undo flow consumers)
  - 18-03 (PlantCard JSX restructure: swipe + long-press + 5-element layout + mood emoji + GAM-04 health-badge removal scoped to card face)
  - 18-04 (affordance hint + cross-screen wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 smoke-runner discipline (Phase 11-17 lineage): file-content asserts + SKIP placeholders that flip to PASS as later plans land concrete code; runner is NEVER edited after Wave 0."
    - "i18n key surface locked on day-zero with explicit EN+ES locale parity assertions in the smoke runner — prevents the 'added EN, forgot ES' anti-pattern from Phases 14-17."
    - "STRICT (non-skippable) regression sentinels for cross-component preservation: GAM-04.healthBadge.MODAL-USAGE-PRESERVED + INDEX-REEXPORT-PRESERVED + FILE-NOT-DELETED guarantee PlantHealthBadge survives the upcoming PlantCard scoped removal in Plan 18-03."

key-files:
  created:
    - scripts/smoke-phase18.cjs
    - src/components/Toast.tsx
  modified:
    - package.json
    - .gitignore
    - src/components/index.ts
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json

key-decisions:
  - "Phase 18 smoke runner intentionally drops ts.transpileModule + Module._resolveFilename intercept + runtime stubs (vs Phase 11-17). Phase 18 is JSX-restructure only; file-content asserts are sufficient and ~5x faster."
  - "GAM-04 PlantHealthBadge preservation guaranteed via 3 STRICT (non-skippable) regression sentinels in the smoke runner: modal usage, index re-export, file existence. Plan 18-03 will scope-remove only the PlantCard import + JSX site."
  - "Toast skeleton uses React.ReactElement return type (not JSX.Element). Codebase-wide convention is to NOT type component returns; the explicit React.ReactElement here keeps the props contract self-documenting for Plan 18-02 consumers without depending on the global JSX namespace (React 19 + react-native types do not provide a global JSX namespace by default)."
  - "Voseo strings ES-locale follow Phase 14-17 conventions: Deslizá (vos imperative of deslizar), eliminada (feminine agreement with planta), Deshacer (voseo-neutral infinitive button label per cancelButton precedent)."

patterns-established:
  - "Phase 18 smoke runner skeleton: scaffold-PASS + plan-targeted SKIP placeholders gated on minimal sentinel literals (e.g., 'Gesture.Pan' substring → CARD-01 placeholders flip from SKIP to assertion). Pattern reusable for any JSX-restructure phase that lands code in waves."
  - "STRICT regression sentinels coexist with SKIP placeholders in the same runner: STRICT for cross-component preservation invariants (must hold at every wave), SKIP for code that will land later in this phase. Three-tier: PASS-always / SKIP-then-PASS / PASS-or-FAIL."

requirements-completed: [CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, GAM-03, GAM-04]

# Metrics
duration: 3min
completed: 2026-05-08
---

# Phase 18 Plan 01: PlantCard Cleanup + Mood Emoji — Wave 0 Scaffold Summary

**Phase 18 baseline scaffold: smoke runner (159 LOC, 35/56 PASS exit 0), 13 i18n keys with EN+ES voseo parity, Toast skeleton ready for Plan 18-02 Reanimated impl.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-08T20:14:36Z
- **Completed:** 2026-05-08T20:17:36Z (approx)
- **Tasks:** 2 / 2
- **Files modified:** 7 (2 created + 5 modified)

## Accomplishments

- Wave 0 smoke runner shipped at 159 LOC with 35 PASS / 21 SKIP / 0 FAIL exit 0 baseline. Every Phase 18 requirement (CARD-01..05 + GAM-03/04) has at least one SKIP placeholder that will flip to PASS as Plans 02-04 commit concrete JSX/code.
- 13 i18n keys (plantCard.menu.{favorite,unfavorite,delete,edit}, plantCard.menuSheet.{title,cancel}, plantCard.deleteHint, plantCard.undoToast.{deletedMessage,undoLabel}, plantCard.moodA11y.{excellent,good,warning,danger}) landed with strict EN+ES locale parity, verified by smoke-runner assertions (26 PASSes — 13 keys × 2 locales).
- Toast skeleton (src/components/Toast.tsx) exports the ToastProps contract (visible, message, actionLabel?, onAction?, durationMs?, onDismiss?) with a minimal no-op render that satisfies the W0.scaffold.Toast-file-exists + Toast-reexport assertions. Full Reanimated v4 implementation (slide-in animation, accessibilityLiveRegion, action button, auto-dismiss) deferred to Plan 18-02.
- 3 STRICT (non-skippable) GAM-04 regression sentinels in the smoke runner guarantee PlantHealthBadge survives unchanged outside PlantCard scope: modal usage preserved, index re-export preserved, file not deleted.

## Task Commits

Each task was committed atomically:

1. **Task 1: Smoke runner + npm script + .gitignore** — `a985934` (chore)
2. **Task 2: i18n keys (EN+ES) + Toast skeleton + index re-export** — `e73c406` (feat)

## Files Created/Modified

- **scripts/smoke-phase18.cjs** (created, 159 LOC) — Phase 18 file-content smoke harness with assertSkippable + assert helpers, getNested(obj, dotted) i18n traversal, 9 W0.scaffold PASSes + 26 i18n parity PASSes + 21 SKIP placeholders + 3 STRICT GAM-04 sentinels
- **src/components/Toast.tsx** (created, 55 LOC) — ToastProps interface + skeleton no-op render with theme tokens
- **package.json** (modified) — smoke:phase18 script entry between smoke:phase17 and typecheck
- **.gitignore** (modified) — scripts/.tmp-phase18/ slot reserved
- **src/components/index.ts** (modified) — Toast re-export after MigrationTooltip
- **src/i18n/locales/en/common.json** (modified, +21 lines) — 13 keys appended after plantCard.a11y block
- **src/i18n/locales/es/common.json** (modified, +21 lines) — identical key shape, voseo strings

## Smoke Runner Assertion Totals

- Total assertions: 56
- PASS at Wave 0 baseline: 35 (9 scaffold + 26 i18n parity)
- SKIP placeholders (will flip to PASS as Plans 02-04 land): 21
- STRICT (non-skippable, must always pass): 3 (GAM-04 PlantHealthBadge modal usage / index re-export / file existence)
- FAIL at Wave 0 baseline: 0 (exit code 0)

## i18n Keys Landed (with voseo notes)

| Key                                       | EN                  | ES (voseo)                |
| ----------------------------------------- | ------------------- | ------------------------- |
| plantCard.menu.favorite                   | Favorite            | Favorito                  |
| plantCard.menu.unfavorite                 | Remove favorite     | Sacar de favoritos        |
| plantCard.menu.delete                     | Delete              | Eliminar                  |
| plantCard.menu.edit                       | Edit                | Editar                    |
| plantCard.menuSheet.title                 | Plant actions       | Acciones de la planta     |
| plantCard.menuSheet.cancel                | Cancel              | Cancelar                  |
| plantCard.deleteHint                      | Swipe to delete     | Deslizá para eliminar     |
| plantCard.undoToast.deletedMessage        | {{name}} deleted    | {{name}} eliminada        |
| plantCard.undoToast.undoLabel             | Undo                | Deshacer                  |
| plantCard.moodA11y.excellent              | Excellent health    | Salud excelente           |
| plantCard.moodA11y.good                   | Good health         | Salud buena               |
| plantCard.moodA11y.warning                | Needs attention     | Necesita atención         |
| plantCard.moodA11y.danger                 | In danger           | En peligro                |

**Voseo notes:**
- `Deslizá` — vos imperative of `deslizar` (matches existing `Regá`/`Chequeá`/`Sacá` precedent in plantCard.* namespace).
- `eliminada` — feminine agreement with `planta`.
- `Deshacer` — voseo-neutral infinitive used as button label, mirrors existing `cancelButton: 'Cancelar'` convention.
- `Sacar de favoritos` — voseo-neutral infinitive button label, consistent with `Sacar afuera` (plantCard.outdoor) precedent.

## Toast Skeleton Signature

```typescript
export interface ToastProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  onDismiss?: () => void;
}

export function Toast(props: ToastProps): React.ReactElement | null;
```

Skeleton renders only when `visible === true`: a single `View` with `accessibilityLiveRegion="polite"` + `accessibilityRole="alert"` containing the message text. Phase 18-02 will replace the body with the full Reanimated v4 slide-in animation, durationMs auto-dismiss, and action button. Theme tokens used: `colors.textPrimary`, `colors.white`, `spacing.md/lg/xxl/fabClearance`, `borderRadius.lg`, `fonts.body`, `shadows.lg` — all already present in src/theme.ts.

## Decisions Made

- **Phase 18 smoke runner skips ts.transpileModule + Module._resolveFilename + runtime stubs (a Phase 11-17 staple).** Phase 18 is purely a JSX restructure — file-content asserts via readFileSync + regex are sufficient and run in <100ms. The runner is 159 LOC vs Phase 17's 337 LOC. Future JSX-restructure phases can adopt this lighter shape.
- **3 STRICT (non-skippable) regression sentinels for GAM-04.** PlantHealthBadge preservation outside PlantCard scope is enforced at the runner level (modal usage, index re-export, file existence) — even Plan 18-03 cannot accidentally over-remove the badge.
- **Toast return type uses React.ReactElement, not JSX.Element.** The codebase has no global JSX namespace under React 19 + react-native types; React.ReactElement is the canonical type for typed component returns when the codebase doesn't already infer them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Toast.tsx return type `JSX.Element` failed tsc**
- **Found during:** Task 2 (Toast skeleton creation, post-write tsc verification)
- **Issue:** The plan literally specified `export function Toast(props: ToastProps): JSX.Element | null` but tsc emitted `error TS2503: Cannot find namespace 'JSX'.` — the project's React 19 + @types/react setup does not expose a global JSX namespace.
- **Fix:** Changed return type to `React.ReactElement | null`. Same semantic meaning, uses React 19's canonical type.
- **Files modified:** src/components/Toast.tsx
- **Verification:** `npx tsc --noEmit` exit 0 post-fix; smoke-runner W0.scaffold.Toast-file-exists assertion still PASS (file is non-empty).
- **Committed in:** `e73c406` (Task 2 commit, fix bundled with the file's initial creation)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Single inline fix, zero scope creep. The plan's interfaces block had a copy-paste error from a different React-version codebase; the fix preserves the typed return contract semantically without depending on a global namespace.

## Issues Encountered

None — both tasks executed cleanly. The single deviation (above) was caught by the Task 2 typecheck verification gate exactly as designed and resolved inline within the same commit.

## User Setup Required

None — no external service configuration required. All work is repo-local file changes.

## Next Phase Readiness

- **Plan 18-02 ready:** Toast skeleton + i18n undoToast keys land — Reanimated v4 impl can replace the no-op render body and consume the existing ToastProps contract.
- **Plan 18-03 ready:** All 21 SKIP placeholders in the smoke runner will flip to PASS as JSX restructure lands (Gesture.Pan + Gesture.LongPress + Gesture.Race composition, mood emoji 4-glyph mapping, scoped PlantHealthBadge removal from PlantCard).
- **Plan 18-04 ready:** affordance-hint AsyncStorage flag (`@plantcard_swipe_discovered`) + state-or-prop pattern placeholders are wired and waiting.
- **Cross-component invariants:** PlantHealthBadge usage in MyPlantDetailModal + index re-export + source file are guarded by 3 STRICT smoke-runner sentinels — Plan 18-03 cannot accidentally over-remove the badge.

## Self-Check

- [x] `scripts/smoke-phase18.cjs` exists — confirmed (159 LOC)
- [x] `src/components/Toast.tsx` exists — confirmed (55 LOC)
- [x] Commit `a985934` exists — confirmed via `git log`
- [x] Commit `e73c406` exists — confirmed via `git log`
- [x] `npm run smoke:phase18` exits 0 — confirmed
- [x] `npx tsc --noEmit` exits 0 — confirmed
- [x] `npm run check:i18n-keys` exits 0 — confirmed
- [x] `[Phase 18 smoke] PASS=35 FAIL=0 SKIP=21` summary line emitted — confirmed

## Self-Check: PASSED

---
*Phase: 18-plantcard-cleanup-mood-emoji*
*Completed: 2026-05-08*
