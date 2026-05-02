---
phase: 08-catalog-rebalance
plan: 02
subsystem: database
tags: [plant-catalog, waterSchedule, lightLevel, waterMode, expert-overrides, horticulture]

# Dependency graph
requires:
  - phase: 08-catalog-rebalance
    plan: 01
    provides: smoke-phase08.mjs with A1-A8 assertions (entry completeness + cold>=warm + waterMode contract); getCatalogEntry helper; Wave 0 gate complete
  - phase: 04-schema-foundation-migration-core
    provides: applyColdFactor mechanical mapper (now superseded by direct expert edits for these 50 entries)
provides:
  - "50 PLANT_DATABASE entries with expert-vetted lightLevel/waterSchedule/waterMode (27 changed, 23 verified-unchanged)"
  - "Mediterranean/drought-tolerant outdoor entries: 2-3x cold ratios (bougainvillea 3x, romero/tomillo 2.1x, jazmin 2.5x)"
  - "Tropical interior entries: 1:2 warm:cold (monstera/potus/filodendro/palmera-interior/orquidea cold=14)"
  - "Extreme drought entries: aloe-vera cold=30, jade cold=30 (soil_check mode preserved)"
  - "dracaena warm=14 cold=21 (Phase 4 had wrong warm=10)"
  - "higuera cold=14 (winter dormancy)"
  - "Citrus quartet (limonero/naranjo/aguacate/mandarino) cold=10 (Rule 1 fix from Phase 4 drift 8->10)"
affects:
  - "08-03: lavanda still cold=17 (Plan 03 owns rename+override atomically)"
  - "08-04: getCatalogEntry read-site consumers will surface these corrected values"
  - "08-05: check-i18n-keys.mjs runs over 50 entries (not 38)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "per-entry awk-bounded edit pattern: awk '/id: \"<slug>\"/,/waterMode/' verifies each edit independently"
    - "awk-bounded edit is precise: uses surrounding context (id line + waterMode line) to bound each entry uniquely"
    - "Rule 1 auto-fix for Phase 4 drift: when 'unchanged' acceptance criteria fails, apply expert SSOT value and document"

key-files:
  created: []
  modified:
    - src/data/plantDatabase.ts

key-decisions:
  - "Citrus cold drift fixed as Rule 1: RESEARCH SSOT says warm=5/cold=10 for citrus (1:2 ratio from FEATURES.md); Phase 4 codemod produced cold=8 (1.6× vs expected 2×). Task 3 acceptance criteria required cold=10. Applied expert values to 4 entries (limonero/naranjo/aguacate/mandarino) as Rule 1 bug fix."
  - "lavanda intentionally untouched at cold=17: Plan 03 owns the rename lavanda->lavanda-angustifolia atomically with the cold 17->21 override; splitting the rename from the value change would create a transient broken state"
  - "awk range pattern /id: slash,/waterMode/ is safe: each entry has a unique id; the range terminates at waterMode which appears once per entry block; no false-positives observed across 50 entries"

patterns-established:
  - "Expert override pattern: locate entry by id, edit only the v1.1 trio (lightLevel/waterSchedule.warm|cold/waterMode), leave all other fields untouched — reusable for Plan 03 lavanda edits"
  - "Verification pattern: awk-bounded grep spot-check per entry, then full smoke run, then full cross-phase regression — applied after every task"
  - "Phase 4 drift detection: 'unchanged' entries in RESEARCH table have expert target values; if current file differs, treat as Rule 1 bug (Phase 4 codemod drift) and apply expert value"

requirements-completed: [LIGHT-04, WATER-07, CAT-01, CAT-08]

# Metrics
duration: 18min
completed: 2026-05-01
---

# Phase 8 Plan 02: Catalog Expert Overrides Wave 1 Summary

**Expert-vetted waterSchedule + lightLevel applied to all 50 existing PLANT_DATABASE entries: 27 changed (11 interior, 16 exterior+aromaticas, 1 huerta/frutales + 4 citrus Rule-1 fix), 23 verified unchanged; smoke-phase08 PASS 305/305 and all cross-phase runners green**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-01T00:13:00Z
- **Completed:** 2026-05-01T00:31:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- All 50 existing PLANT_DATABASE entries now carry expert-vetted horticultural values from RESEARCH §Expert-Override Table
- Mediterranean/drought-tolerant outdoor plants corrected to 2-3× cold ratios: bougainvillea cold=21 (3×), jazmin cold=10 (2.5×), romero+tomillo cold=21 (2.1×)
- Tropical interior plants corrected to 1:2 ratio: monstera/potus/filodendro/palmera-interior/orquidea all cold=14
- Extreme drought tolerance encoded: aloe-vera cold=30, jade cold=30 (FEATURES.md baseline; soil_check mode preserved)
- dracaena corrected warm=14 (was 10) + cold=21 (was 15) — largest warm correction
- Citrus drift from Phase 4 fixed: limonero/naranjo/aguacate/mandarino cold 8→10 (RESEARCH 1:2 ratio target)
- lavanda intentionally left at cold=17 (Plan 03 owns rename + cold=21 override as one atomic unit)

## Task Commits

Each task was committed atomically:

1. **Task 1: INTERIOR category — 11 entries** - `96ef533` (feat)
2. **Task 2: EXTERIOR + AROMATICAS categories — 16 entries** - `fec1742` (feat)
3. **Task 3: HUERTA + FRUTALES + SUCULENTAS — 1 planned + 4 Rule-1 fixes** - `dae7cb4` (feat)

## Files Created/Modified
- `src/data/plantDatabase.ts` - 27 waterSchedule.cold/warm edits; all edits to the v1.1 trio only (lightLevel/waterSchedule/waterMode); no other fields touched

## Decisions Made
- **Citrus cold drift treated as Rule 1:** RESEARCH marked citrus (limonero/naranjo/aguacate/mandarino) as "= unchanged" with target values warm=5/cold=10. Phase 4 codemod produced cold=8. Task 3 acceptance criteria explicitly requires cold=10. Applied Rule 1 (bug fix) to bring all 4 citrus entries to the RESEARCH SSOT value. Not treated as architectural change — it's a correcting a Phase 4 codemod rounding error.
- **lavanda frozen at cold=17:** Plan 03 renames lavanda→lavanda-angustifolia and sets cold=21 as one atomic commit. Splitting the rename from the value edit would create an intermediate state where the smoke runner sees a wrong cold value under the new id. Leave for Plan 03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Citrus cold Phase 4 drift corrected (4 entries: limonero/naranjo/aguacate/mandarino)**
- **Found during:** Task 3 (HUERTA+FRUTALES+SUCULENTAS verification)
- **Issue:** Task 3 acceptance criteria states "4 unchanged FRUTALES entries (limonero/naranjo/mandarino/aguacate) preserve cold=10". The actual file had cold=8 for all 4 citrus entries. RESEARCH table marks them "= unchanged. Citrus 1:2 from FEATURES.md" with target cold=10. Phase 4 applyColdFactor used 1.6× for frutales category, producing cold=8 (warm=5×1.6=8.0→8), not the FEATURES.md 1:2 target.
- **Fix:** Changed cold=8 to cold=10 for limonero, naranjo, aguacate, mandarino. Warm values (5) unchanged.
- **Files modified:** `src/data/plantDatabase.ts`
- **Verification:** Task 3 awk spot-checks pass for all 4 entries; smoke-phase08 PASS 305/305; tsc exit 0
- **Committed in:** `dae7cb4` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Phase 4 codemod rounding drift on citrus cold factor)
**Impact on plan:** 4 additional entries fixed beyond the 1 planned change (higuera). All citrus now at horticultural 1:2 ratio matching FEATURES.md and RESEARCH SSOT. No scope creep — these were always supposed to be cold=10 per RESEARCH.

## Issues Encountered
None beyond the citrus drift deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 50 PLANT_DATABASE entries now horticulturally correct per RESEARCH expert table
- lavanda still `cold: 17` — Plan 03 must own the rename + cold=21 override as one atomic commit
- smoke-phase08 PASS 305/305 (A1-A8 all green); tsc exit 0; smoke-phase07 PASS 100/100; smoke-phase06 PASS 82/82; migration-smoke-test PASS 106/106
- Plan 03 is unblocked: add lavanda-angustifolia + 2 new lavender variants + 12 other new outdoor entries; flip A8 from 50→64

---
*Phase: 08-catalog-rebalance*
*Completed: 2026-05-01*
