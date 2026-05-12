---
phase: 23-polish-uat-brand-voice
plan: 01
subsystem: ui
tags: [polish, uat-fix, outdoor-task, plantnet, lightlevel-picker, two-layer-defense, identification, catalog]

# Dependency graph
requires:
  - phase: 23-polish-uat-brand-voice
    provides: "Wave 0 smoke-phase23.cjs three-tier runner with POLISH-01/02/03 SKIP→PASS placeholders + STRICT cross-phase Phase 18-22 regression block; baseline PASS=43 SKIP=6 already established"
  - phase: 7-light-level-picker
    provides: "LightLevelPicker component + IdentificationResults.tsx selectedLightLevel pre-select pattern (line 42-44) — POLISH-03 rewires the picker's typeId prop derivation without touching the picker itself"
  - phase: 17-catalog-exterior-wave-c
    provides: "Stevia/eneldo/salvia-officinalis aromaticas already at outdoor:false from Phase 17 lock — POLISH-02 inherits and skips these 3 (only flips the other 10 outdoor-aromaticas)"
provides:
  - "OUTDOOR_TYPE_IDS = new Set(['exterior', 'frutales']) module-private ReadonlySet in plantLogic.ts (POLISH-01 code-layer gate)"
  - "getTasksForDay outdoor emit branch AND-gated by !OUTDOOR_TYPE_IDS.has(p.typeId) — permanent-outdoor species (exterior + frutales) never emit 'Sacar afuera' (POLISH-01)"
  - "45 catalog entries flipped outdoor:true → outdoor:false (28 exterior + 7 frutales + 10 outdoor-aromaticas) in plantDatabase.ts (POLISH-02 data-layer complement)"
  - "resolveTypeIdForPicker(plant) three-tier ladder helper in IdentificationResults.tsx — catalog category wins, PlantNet indoor:false fallback, 'interior' default (POLISH-03)"
  - "Both LightLevelPicker call sites (Case A inline JSX line ~100 + Case B const line ~53) rewired to use the helper; old `indoor === false ? 'exterior' : 'interior'` ternary fully removed"
affects: [23-02-PLAN, 23-03-PLAN, 23-04-PLAN, future-phase-catalog-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-layer outdoor defense — code-layer OUTDOOR_TYPE_IDS Set in plantLogic.ts gates task emission AT runtime; data-layer outdoor:false in plantDatabase.ts gates outdoorDays at AddPlant time. Either alone would close UAT #3 for a subset; both together provide belt-and-suspenders for permanently-outdoor species (RESEARCH §Finding 11 + §Finding 2)."
    - "Three-tier preference ladder in resolveTypeIdForPicker — catalog category (always populated by convertPlantNetResult) wins; PlantNet indoor boolean is fallback for novel species; 'interior' is safe default. Pure preference reorder, no new data path (RESEARCH §Finding 4)."
    - "Module-private ReadonlySet for category-membership gates — declared at module top with NOTE comment explaining the 2-string scope (only exterior+frutales, NOT aromaticas/huerta which have mixed indoor/outdoor entries). Never exported; consumed only inside getTasksForDay (RESEARCH §Finding 11)."

key-files:
  created: []
  modified:
    - "src/utils/plantLogic.ts (+OUTDOOR_TYPE_IDS Set declaration, +outdoor emit gate; 23 insertions, 1 deletion)"
    - "src/data/plantDatabase.ts (45 outdoor:true → outdoor:false flips across 28 exterior + 7 frutales + 10 outdoor-aromaticas entries)"
    - "src/components/PlantIdentifier/IdentificationResults.tsx (+resolveTypeIdForPicker helper + 2 call-site rewrites; 18 insertions, 2 deletions)"

key-decisions:
  - "OUTDOOR_TYPE_IDS scope locked to ['exterior', 'frutales'] only — aromaticas+huerta NOT included because those categories have mixed indoor/outdoor entries (e.g., stevia/eneldo/salvia-officinalis indoor; rosemary/lavender/tomato outdoor). Per-entry catalog `outdoor: false` decides those via POLISH-02 data layer (RESEARCH §Pitfall 1)."
  - "POLISH-02 deterministic Node walker (apply-polish-02.cjs in scripts/.tmp-phase23/) used to flip 45 entries — walks PLANT_DATABASE entry-by-entry via `id: \"...\"` opener + balanced-brace heuristic, checks category membership in {exterior, frutales, aromaticas}, replaces ONLY the entry-scoped `outdoor: true,` line. Logged all 45 modified ids by category for sanity-check inspection. Temp script deleted post-run."
  - "resolveTypeIdForPicker is a pure preference reorder, not a new data path — IdentifiedPlant.category is ALWAYS populated by convertPlantNetResult (catalog hit OR generic family-based fallback at plantIdentification.ts:337/364), so the helper merely surfaces existing data with a different preference order (RESEARCH §Finding 4)."
  - "IdentifiedPlant import was already present in IdentificationResults.tsx (line 12 imports IdentificationResult, IdentifiedPlant, LightLevel from '../../types') — no import edit needed; the helper's parameter type annotation uses the existing import."
  - "POLISH-02 had no SKIP→PASS sentinel flip — count threshold (≥45 outdoor:false) was already satisfied at W0 baseline (53 entries from prior phases). Plan 23-01 confirms category-alignment (28 exterior + 7 frutales + 10 outdoor-aromaticas) rather than raw count growth. Smoke-phase23 PASS count went 43→45 (only POLISH-01 and POLISH-03 had explicit SKIP→PASS placeholders)."

patterns-established:
  - "Pattern: Two-layer outdoor defense (code + data) — code-layer Set membership gate prevents task EMISSION at runtime; data-layer catalog boolean prevents outdoorDays INITIALIZATION at AddPlant time. Either layer alone closes UAT #3 for a subset; both together cover the full intersect (catalog-known + catalog-unknown plants). Future category-gates (e.g., 'plants that should never emit fertilize task') can mirror this Set+boolean pair pattern."
  - "Pattern: Module-private ReadonlySet for category-membership predicates — declared at module top with explanatory comment block documenting WHY specific categories are/aren't included. Avoids re-export pollution; consumed only by the single function that needs it. Trivial to extend (add string to Set body) without breaking call sites."
  - "Pattern: Three-tier preference ladder helper for value resolution — catalog source wins → API-flag fallback → safe default. Encodes 'when multiple sources disagree, this is the authoritative order' as a named function rather than inline ternary. Self-documenting and trivially testable. Mirrors prior `getSeasonalInterval` (waterSchedule → legacy waterEvery → 7d) and `getEffectiveSeason` (override → location → 'warm') ladders."
  - "Pattern: Deterministic Node walker for bulk catalog edits — temp .cjs in scripts/.tmp-phase23/ walks entry blocks via id-opener + body-end heuristic, applies category-scoped regex replacement, logs modified ids by sub-category for human sanity check, deleted post-run. Reusable for future bulk per-entry boolean flips without touching the catalog's overall structure or unrelated fields."

requirements-completed: [POLISH-01, POLISH-02, POLISH-03]

# Metrics
duration: 2min
completed: 2026-05-12
---

# Phase 23 Plan 01: Outdoor Cluster Summary

**Two-layer outdoor defense (code-layer OUTDOOR_TYPE_IDS Set gate in plantLogic.getTasksForDay + data-layer 45-entry catalog outdoor:false flip) closes UAT #3, and resolveTypeIdForPicker helper prefers catalog category over PlantNet's mis-flagging indoor boolean to close UAT #3a — three atomic per-requirement commits.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-12T04:29:52Z
- **Completed:** 2026-05-12T04:32:15Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- **POLISH-01 (code layer):** `OUTDOOR_TYPE_IDS: ReadonlySet<string> = new Set(['exterior', 'frutales'])` declared module-private at top of `src/utils/plantLogic.ts` (after imports, before first function). `getTasksForDay` outdoor task emit branch AND-gated by `!OUTDOOR_TYPE_IDS.has(p.typeId)` — exterior+frutales plants (which already live outdoors permanently) never emit the nonsensical 'Sacar afuera' task even if their `outdoorDays` array somehow gets initialized.
- **POLISH-02 (data layer):** 45 catalog entries in `src/data/plantDatabase.ts` flipped from `outdoor: true` → `outdoor: false`. Exact breakdown matches RESEARCH §Finding 2: 28 exterior + 7 frutales + 10 outdoor-aromaticas. The 3 indoor-aromaticas (stevia, eneldo, salvia-officinalis) were already `outdoor: false` from Phase 17 lock and skipped. Pre-edit counts: `outdoor: true`=65, `outdoor: false`=53. Post-edit counts: `outdoor: true`=20, `outdoor: false`=98 (exact delta -45 / +45).
- **POLISH-03 (identification picker):** `resolveTypeIdForPicker(plant)` three-tier ladder helper added to `IdentificationResults.tsx` immediately above the component declaration. Both call sites rewired: Case B `const typeIdForPicker = resolveTypeIdForPicker(selectedPlant)` (line ~53) and Case A inline JSX `<LightLevelPicker typeId={resolveTypeIdForPicker(plant)} ...>` (line ~100). Old `indoor === false ? 'exterior' : 'interior'` ternary fully removed (negative-grep zero hits).
- **Smoke-phase23 progressed:** baseline PASS=43 SKIP=6 → post-plan PASS=45 SKIP=4. POLISH-01 (outdoor-task-gate) and POLISH-03 (category-over-indoor-flag) flipped SKIP→PASS. POLISH-02 was already PASSing at baseline (count threshold met by prior phases); this plan confirms category-alignment, not raw count.
- **Cross-phase regression preserved verbatim:** Phase 18 (PASS=56/0/0), Phase 19 (PASS=85/0/0), Phase 20 (PASS=49/0/0), Phase 21 (PASS=76/0/0), Phase 22 (PASS=56/0/0) — all five prior phases' smokes green.
- **All automation gates green:** `npx tsc --noEmit` exits 0; `npm run check:i18n-keys` PASS 118 catalog ids; `node scripts/smoke-phase23.cjs` PASS=45 FAIL=0 SKIP=4 exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: POLISH-01 — add OUTDOOR_TYPE_IDS + outdoor task gate in plantLogic.ts** — `6809f16` (feat)
2. **Task 2: POLISH-02 — flip outdoor:false on 45 catalog entries** — `7c8a3e3` (feat)
3. **Task 3: POLISH-03 — add resolveTypeIdForPicker helper, rewire both call sites** — `16495cb` (fix)

**Plan metadata commit:** _pending — final docs commit closes Plan 23-01 after STATE.md + ROADMAP.md updates._

## Files Created/Modified

- `src/utils/plantLogic.ts` (MODIFIED) — added `OUTDOOR_TYPE_IDS: ReadonlySet<string>` constant at module top with NOTE comment block explaining the 2-string scope; modified `getTasksForDay` outdoor emit branch to AND-gate on `!OUTDOOR_TYPE_IDS.has(p.typeId)`. 23 insertions, 1 deletion.
- `src/data/plantDatabase.ts` (MODIFIED) — flipped `outdoor: true,` → `outdoor: false,` on 45 entries spanning 3 categories (28 exterior + 7 frutales + 10 outdoor-aromaticas). 45 insertions, 45 deletions (line-for-line). All other fields untouched per Pitfall 2 lock (boolean type, never numeric).
- `src/components/PlantIdentifier/IdentificationResults.tsx` (MODIFIED) — added `resolveTypeIdForPicker` helper with JSDoc explaining catalog-wins rationale + IdentifiedPlant.category-always-populated invariant; replaced Case B `const typeIdForPicker = ...` (line ~53) and Case A inline JSX `<LightLevelPicker typeId={...}>` (line ~100) with helper calls. 18 insertions, 2 deletions.

## Decisions Made

- **OUTDOOR_TYPE_IDS scope locked to `['exterior', 'frutales']` only** — aromaticas+huerta NOT included because those categories have mixed indoor/outdoor entries. The 3 indoor aromaticas (stevia/eneldo/salvia-officinalis) and the 10 outdoor aromaticas (rosemary, lavender, tomate variants from huerta etc.) are decided per-entry via the POLISH-02 data layer `outdoor: false` flag (RESEARCH §Pitfall 1).
- **Module-private ReadonlySet, NOT exported** — never reused outside `getTasksForDay`; explicit `^export const` negative-grep passes; future consumers add Set OR import from a shared utility module if needed.
- **`resolveTypeIdForPicker` is a pure preference reorder** — `IdentifiedPlant.category` is ALWAYS populated by `convertPlantNetResult` (catalog hit at `plantIdentification.ts:337` OR generic family-based fallback at `:364`), so the helper merely surfaces existing data with a different preference order. No new data flow needed.
- **POLISH-02 used a deterministic Node walker** rather than bulk sed/awk — `scripts/.tmp-phase23/apply-polish-02.cjs` walked entry blocks via `id: "<id>"` opener + body-end heuristic, checked category membership in `{exterior, frutales, aromaticas}`, and replaced ONLY the entry-scoped `outdoor: true,` line. Logged all 45 modified ids by category (28/7/10 breakdown matched §Finding 2 expectation exactly). Temp script deleted post-run (scripts/.tmp-phase23/ is .gitignored per Plan 23-00).
- **No `IdentifiedPlant` import edit needed** — the type was already imported on line 12 of `IdentificationResults.tsx` alongside `IdentificationResult` and `LightLevel`.
- **POLISH-02 has no explicit SKIP→PASS sentinel** in `smoke-phase23.cjs` — the count threshold (`outdoor: false` count ≥ 45) was already satisfied at W0 baseline (53 entries from prior phases), so the sentinel passed without flipping. Plan 23-01 confirms category-alignment (28 exterior + 7 frutales + 10 outdoor-aromaticas matching the §Finding 2 enumeration) rather than raw count growth.

## Deviations from Plan

None — plan executed exactly as written.

All 3 tasks completed in single passes; all 9 acceptance criteria per task verified by grep + tsc + smoke-phase23 + check:i18n-keys output; cross-phase regression (Phase 18 + 19 + 20 + 21 + 22) preserved verbatim with zero impact. The plan's expected smoke delta (POLISH-01/02/03 SKIP→PASS) was achieved with the documented nuance: POLISH-02 had no SKIP placeholder because the count threshold was already met at W0 baseline (per Plan 23-00 SUMMARY's "implementation note" anticipating this exact behavior).

**Total deviations:** 0
**Impact on plan:** Zero scope creep. All 3 POLISH-* IDs closed; smoke runner advances from 6→4 SKIPs in line with Plan 23-00 forecast (3 remaining SKIPs: POLISH-05 textSecondary WCAG, POLISH-06 voseo button literals + voseo-lint strict body, POLISH-07 illustrated empty states — all in Plans 23-02 and 23-03 scope).

## Issues Encountered

None.

**Implementation note (not an issue):** The plan's acceptance criteria spot-check item `ruda-comun` does not exist in `plantDatabase.ts` (no such id). The `tomate-cherry` spot-check showed `outdoor: true` after Task 2 — confirmed correct because `tomate-cherry` is `category: "huerta"`, NOT in the POLISH-02 target set (exterior + frutales + aromaticas only). The plan body explicitly excludes huerta from this flip; the spot-check listing was an artifact of the plan template. The 45-entry flip exactly matched RESEARCH §Finding 2 enumeration (28 exterior + 7 frutales + 10 outdoor-aromaticas) with zero leaks.

## User Setup Required

None — no external service configuration required. All changes are local source edits to plantLogic.ts, plantDatabase.ts, and IdentificationResults.tsx.

## Next Phase Readiness

- **Plan 23-02 (Wave 2 — WCAG + voseo)** ready: smoke sentinel SKIPs POLISH-05 (`textSecondary` darkening to pass WCAG AA on `bgPrimary` + `card`), POLISH-06 button literals (4 action button voseo + emoji strings in `es/common.json`), and POLISH-06 voseo-lint exit 0 (replace skeleton state with strict body — populate BANNED list + fix 17 violations + remove `skeleton — BANNED list empty until Plan 23-02` stdout flag).
- **Plan 23-03 (Wave 3 — empty states)** ready: smoke sentinel SKIPs POLISH-07 (3 illustration PNGs + 3 EmptyState JSX inserts). I18n keys already wired by Plan 23-00; Plan 23-03 only adds JSX consumers.
- **Plan 23-04 (Wave 4 — manual gate)** ready: POLISH-04 device-test (identify→diagnose flow on iOS + Android) is the only manual-only requirement; no automated sentinel.
- **No blockers.** Cross-phase regression gate green across Phase 18 + 19 + 20 + 21 + 22.

## Self-Check: PASSED

- `src/utils/plantLogic.ts` contains `const OUTDOOR_TYPE_IDS: ReadonlySet<string> = new Set(['exterior', 'frutales']);` at module top ✓
- `src/utils/plantLogic.ts` `getTasksForDay` AND-gates outdoor emit with `!OUTDOOR_TYPE_IDS.has(p.typeId)` ✓
- `src/utils/plantLogic.ts` does NOT export `OUTDOOR_TYPE_IDS` (negative-grep `^export\s+const OUTDOOR_TYPE_IDS` exits 1) ✓
- `src/data/plantDatabase.ts` `outdoor: true` count went 65 → 20 (delta -45) ✓
- `src/data/plantDatabase.ts` `outdoor: false` count went 53 → 98 (delta +45) ✓
- Zero exterior/frutales entries with `outdoor: true` remain (programmatic walker verified 0/0) ✓
- `src/components/PlantIdentifier/IdentificationResults.tsx` contains `function resolveTypeIdForPicker` ✓
- Helper used at 3 sites (declaration + 2 call sites; grep count = 3) ✓
- Helper body: `category` check appears BEFORE `indoor` check (awk-extracted order verified) ✓
- Old ternary `indoor === false ? 'exterior' : 'interior'` fully removed (negative-grep exits 1) ✓
- `npx tsc --noEmit` exits 0 ✓
- `npm run check:i18n-keys` PASS 118 catalog ids ✓
- `node scripts/smoke-phase23.cjs` exits 0 with PASS=45 FAIL=0 SKIP=4 (was 43/0/6 at baseline; POLISH-01 + POLISH-03 flipped SKIP→PASS) ✓
- Phase 18 + 19 + 20 + 21 + 22 cross-phase smokes preserved verbatim (PASS=56/85/49/76/56 all green) ✓
- Commit `6809f16` (Task 1 POLISH-01) exists in git log ✓
- Commit `7c8a3e3` (Task 2 POLISH-02) exists in git log ✓
- Commit `16495cb` (Task 3 POLISH-03) exists in git log ✓
- `scripts/.tmp-phase23/apply-polish-02.cjs` deleted post-run (directory does not exist) ✓

---
*Phase: 23-polish-uat-brand-voice*
*Completed: 2026-05-12*
