---
phase: 08-catalog-rebalance
plan: 01
subsystem: testing
tags: [smoke-runner, typescript, transpileModule, plant-catalog, alias-resolution]

# Dependency graph
requires:
  - phase: 07-ui-write-side-onboarding-edge-function-contract
    provides: Final Phase 7 type baseline (WaterSeason in types/index.ts, PlantDBEntry shape)
  - phase: 04-schema-foundation-migration-core
    provides: typescript.transpileModule single-compile-path policy, SOIL_CHECK_IDS set, waterMode/lightLevel/waterSchedule fields
provides:
  - smoke-phase08.mjs: Wave 0 smoke runner with A1-A8 assertions (entry completeness + alias resolution)
  - PlantDBEntry._aliases?: string[]: type-level alias contract for catalog entry resolution
  - getCatalogEntry(slug): canonical lookup helper with id-before-alias invariant
  - "@deprecated marker on getPlantById": grep-auditable migration signal
  - 08-VALIDATION.md wave_0_complete: true: Wave 0 execution gate unlocked
affects:
  - 08-02: must run node scripts/smoke-phase08.mjs after every catalog edit; A3 waterMode contract enforced
  - 08-03: must flip A8 baseline from 50→64 when 14 entries land; activate A9 lavender split assertions
  - 08-04: getCatalogEntry is the read-site API; consumers migrate to getCatalogEntry(plant.databaseId)
  - 08-05: check-i18n-keys.mjs will run as standalone (A10); smoke-phase08 remains gating regression check

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "smoke-phase08 single-compile-path: typescript.transpileModule, no esbuild/swc fallbacks"
    - "stub-rewrite idiom: regex-replace '../i18n' and '../types' imports to .tmp-phase08/ stubs before transpileModule"
    - "synthetic harness for A6/A7: inline 2-entry array + inline getCatalogEntry algorithm copy — NO PLANT_DATABASE mutation"
    - "id-before-alias invariant: canonical PLANT_DATABASE.find(e.id===slug) runs before alias scan"
    - "__DEV__ = false set globally before import to silence dev warnings in smoke run"

key-files:
  created:
    - scripts/smoke-phase08.mjs
  modified:
    - src/types/index.ts
    - src/data/plantDatabase.ts
    - .planning/phases/08-catalog-rebalance/08-VALIDATION.md

key-decisions:
  - "A8 count baseline set to 50 (not 38): live catalog has 50 entries; RESEARCH.md had stale count from pre-Phase-4 commit; Plan 03 must flip A8 from 50->64 when 14 new entries land (not 38->52 as plan stated)"
  - "Synthetic 2-entry harness for A6/A7: no mutation of PLANT_DATABASE inside smoke runner; inline copy of getCatalogEntry algorithm asserts alias resolution and id-before-alias invariant independently"
  - "Stub placement in scripts/.tmp-phase08/: compiled plantDatabase.compiled.mjs lands in scripts/; relative path './.tmp-phase08/i18n.mjs' resolves correctly from that location"
  - "getCatalogEntry id-before-alias invariant: PLANT_DATABASE.find(e.id===slug) runs FIRST before _aliases scan; protects against data bugs where another entry aliases an existing canonical id"
  - "getPlantById preserved with @deprecated JSDoc: still exported for legacy consumers; v1.2 target for removal"

patterns-established:
  - "smoke-phase08 extension idiom: to extend, append new assertions after A8 block; A9/A10 are comment-placeholders ready for Plan 03"
  - "A8 count assertion must be updated when catalog entries change (Plan 03 responsibility)"

requirements-completed: [CAT-04, CAT-05, CAT-08, LIGHT-04, WATER-07, CAT-01]

# Metrics
duration: 12min
completed: 2026-05-01
---

# Phase 8 Plan 01: Catalog Rebalance Wave 0 — Validation Harness Summary

**getCatalogEntry(slug) with id-before-alias resolution shipped to plantDatabase.ts; smoke-phase08.mjs PASS 305/305 on 50-entry baseline; Wave 0 verification contract locked**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-01T00:00:00Z
- **Completed:** 2026-05-01T00:12:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `PlantDBEntry._aliases?: string[]` added to types/index.ts (additive, no schema bump, no downstream breaks)
- `getCatalogEntry(slug): PlantDBEntry | null` exported from plantDatabase.ts with id-before-alias invariant and `__DEV__` warning on miss
- `getPlantById` annotated `@deprecated` pointing to `getCatalogEntry`; still exported for legacy consumers
- `scripts/smoke-phase08.mjs` passes 305/305 assertions (A1–A8: entry completeness, cold>=warm, waterMode contract, canonical lookup, missing returns null, synthetic alias harness)
- Wave 0 gate confirmed: tsc exits 0, all prior smoke runners (06/07/migration) unaffected
- `08-VALIDATION.md` `wave_0_complete` flipped to `true`; all 16 task rows remain pending (planner cannot self-approve)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add _aliases to PlantDBEntry + getCatalogEntry + @deprecated** - `c9cc6c0` (feat)
2. **Task 2: Create smoke-phase08.mjs** - `15a38de` (feat)
3. **Task 3: Flip wave_0_complete in 08-VALIDATION.md** - `f4b1c0b` (chore)

## Files Created/Modified
- `scripts/smoke-phase08.mjs` - Wave 0 smoke runner; A1–A8 assertions; synthetic alias harness; Plan 03 forward references
- `src/types/index.ts` - PlantDBEntry gains `_aliases?: string[]` (after waterMode field, Phase 8 CAT-05)
- `src/data/plantDatabase.ts` - `getCatalogEntry` exported; `getPlantById` gets `@deprecated` JSDoc
- `.planning/phases/08-catalog-rebalance/08-VALIDATION.md` - `wave_0_complete: false` → `true`

## Decisions Made
- **A8 count baseline 50 not 38:** The RESEARCH.md stated 38 entries but the live catalog has 50. Phase 4 Plan 05 codemod added entries beyond the planner's estimate (as documented in 04-05-SUMMARY.md). The smoke runner uses the actual live count 50. Plan 03 must flip A8 to 64 (50 + 14 new entries) when the new outdoor entries land.
- **Synthetic harness for A6/A7:** The plan required alias and id-before-alias assertions before any real aliases exist in PLANT_DATABASE. The inline 2-entry synthetic array + inline algorithm copy tests the algorithm without mutating live data. This approach avoids a transient state where the smoke runner would fail until Plan 03 adds real aliases.
- **Stub layout:** Stubs go to `scripts/.tmp-phase08/` subdirectory. Compiled output `plantDatabase.compiled.mjs` goes to `scripts/`. Relative path `./.tmp-phase08/i18n.mjs` resolves correctly. This mirrors the Phase 6/7 pattern of sibling-tmp-files with namespace suffixes, but uses a subdirectory to avoid namespace collisions across phases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A8 count assertion corrected from 38 to 50**
- **Found during:** Task 2 (running smoke-phase08.mjs)
- **Issue:** The plan specified `PLANT_DATABASE.length === 38` but the live catalog has 50 entries. RESEARCH.md had a stale count; Phase 4 Plan 05 added entries to reach 50 (the Phase 4 Plan 05 SUMMARY explicitly documents this as a deviation: "Catalog actually has 50 entries (not the 56 the planner expected)").
- **Fix:** Updated A8 assertion from 38 to 50 and updated forward reference comment: "Plan 03 must update this assertion to 64" (50 + 14 = 64, not 38 + 14 = 52).
- **Files modified:** `scripts/smoke-phase08.mjs`
- **Verification:** `node scripts/smoke-phase08.mjs` → PASS 305/305
- **Committed in:** `15a38de` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — wrong count constant)
**Impact on plan:** The count fix is required for correctness; the wrong baseline would make smoke-phase08 permanently red, blocking all downstream plans. No scope creep.

## Issues Encountered
None beyond the A8 count deviation above.

## Next Phase Readiness
- Wave 0 gate fully green: tsc + smoke-phase08 + all prior runners pass
- Plan 02 can begin catalog expert-override edits immediately; every edit will be validated by smoke-phase08 A1-A3
- Plan 03 must: (1) flip A8 from 50→64, (2) activate A9 lavender split assertions
- `getCatalogEntry` is the read-side API for Plans 04+05 consumer migration

---
*Phase: 08-catalog-rebalance*
*Completed: 2026-05-01*
