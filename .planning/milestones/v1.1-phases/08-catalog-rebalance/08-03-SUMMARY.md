---
phase: 08-catalog-rebalance
plan: 03
subsystem: database
tags: [plant-catalog, i18n, lavender-split, voseo, alias-resolution, smoke-runner]

# Dependency graph
requires:
  - phase: 08-catalog-rebalance
    plan: 02
    provides: 50 PLANT_DATABASE entries with expert-vetted waterSchedule/lightLevel/waterMode; lavanda frozen at cold=17 awaiting Plan 03 atomic rename
  - phase: 08-catalog-rebalance
    plan: 01
    provides: smoke-phase08.mjs with A1-A8 assertions; getCatalogEntry helper; _aliases type field; Wave 0 gate complete
provides:
  - "64-entry PLANT_DATABASE (50 existing + 14 new outdoor entries)"
  - "lavanda-angustifolia (renamed from lavanda) with _aliases: ['lavanda'] and cold=21 expert override"
  - "lavanda-stoechas + lavanda-dentada: 2 new lavender variants (cold=14, less hardy than angustifolia)"
  - "12 new outdoor entries across exterior/aromaticas/huerta categories with full v1.1 fields"
  - "Full EN+ES i18n keys for all 14 new/renamed entries in plants.json (atomic with source)"
  - "smoke-phase08 A8 baseline 50→64 + A9 lavender-split assertions (A9.1-A9.7) active"
affects:
  - "08-04: getCatalogEntry consumers can now resolve lavanda alias; 64 entries require catalog-lookup migration"
  - "08-05: check-i18n-keys.mjs must verify 64 entry ids (not 50)"
  - "Future: PLANT_DATABASE.length === 64 is the new baseline for smoke-phase08 A8"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomic source+i18n commit pattern: PlantDBEntry rename + i18n key rename land in SAME commit (CONTEXT Pitfall 1 prevention)"
    - "Inline cold>=warm assertion without full smoke runner: compile-stub idiom used between T1/T2 when A8 baseline is stale"
    - "humidity field uses Spanish values (baja/media/alta) matching HumidityLevel type — new entries must follow"

key-files:
  created: []
  modified:
    - src/data/plantDatabase.ts
    - src/i18n/locales/es/plants.json
    - src/i18n/locales/en/plants.json
    - scripts/smoke-phase08.mjs

key-decisions:
  - "A8 baseline corrected 50→64 (not 38→52 as plan stated): live catalog had 50 entries (per 08-01 deviation); 50 + 14 new = 64; plan text had stale counts from RESEARCH.md which still said 38"
  - "lavanda entry renamed to lavanda-angustifolia with tempMin corrected from -5 to -15 (Lavandula angustifolia is cold-hardy to -15°C per horticultural SSOT; RESEARCH §Care Table notes 'Hardy to -15°C')"
  - "humidity: 'baja' used for new lavender variants (not 'low') — HumidityLevel type is Spanish-value enum (baja/media/alta); English words are invalid TypeScript"
  - "lavanda-stoechas + lavanda-dentada do NOT have waterDays/sunHours fields — these are deprecated optional fields not required for new entries"
  - "Plan counts (52) vs actual counts (64): plan was written with stale 38-base; all plan acceptance criteria recalibrated to actual values (40→52 in plan = 52→64 in reality)"

patterns-established:
  - "New outdoor entries use category in {exterior, aromaticas, huerta} — all in OUTDOOR_TYPE_IDS; never interior or suculentas"
  - "humidity field: always Spanish enum values (baja/media/alta); EN display via i18n only"
  - "A9 smoke assertion template: getCatalogEntry(canonical) + getCatalogEntry(alias) + cold-tolerance ordering assertion — copy for future splits"

requirements-completed: [CAT-02, CAT-03, CAT-05, CAT-06, LIGHT-04, WATER-07, CAT-01, CAT-08]

# Metrics
duration: 25min
completed: 2026-05-01
---

# Phase 8 Plan 03: Wave 2 — 14 New Outdoor Entries + Lavender Split Summary

**64-entry PLANT_DATABASE with atomic lavender split (lavanda→angustifolia + stoechas + dentada) + 12 new LATAM outdoor plants, full EN/ES i18n parity, smoke-phase08 A9 lavender assertions active**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-01T00:32:00Z
- **Completed:** 2026-05-01T00:57:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Atomic lavender split: `lavanda` renamed to `lavanda-angustifolia` with `_aliases: ["lavanda"]`, cold 17→21 override; 2 new variants (`lavanda-stoechas` + `lavanda-dentada`) with cold=14 (less hardy); all 3 variants + their i18n keys (EN+ES) land in single commit (no orphaned intermediate state)
- 12 new outdoor entries added with full v1.1 fields: 10 exterior (jacaranda, ceibo, glicina, gardenia, camelia, dalia, salvia-ornamental, cala, copete, verbena), 1 aromatica (romero-rastrero), 1 huerta (tomate-cherry)
- All 14 new/renamed entries have complete EN+ES i18n keys in plants.json (atomic with source per CONTEXT Pitfall 1)
- Voseo coverage: 14 verified voseo verb hits across new ES tips; zero tuteo verb forms detected
- `smoke-phase08` A8 baseline updated 50→64; A9.1-A9.7 lavender split assertions activated; PASS 396/396
- All cross-phase regression runners green: smoke-phase07 100/100, smoke-phase06 82/82, migration-smoke-test 106/106

## Task Commits

Each task was committed atomically:

1. **Task 1: Atomic lavender bundle** - `0583022` (feat)
2. **Task 2: Atomic 12-entry bundle** - `85854c6` (feat)
3. **Task 3: Smoke runner alignment** - `f0201fb` (test)

## Files Created/Modified
- `src/data/plantDatabase.ts` - lavanda renamed; 2 new lavender variants + 12 new outdoor entries; PLANT_DATABASE.length = 64
- `src/i18n/locales/es/plants.json` - lavanda key renamed → lavanda-angustifolia; 13 new ES keys (3 lavenders + 12 new entries)
- `src/i18n/locales/en/plants.json` - lavanda key renamed → lavanda-angustifolia; 13 new EN keys (3 lavenders + 12 new entries)
- `scripts/smoke-phase08.mjs` - A8 baseline 50→64; A9.1-A9.7 active; PASS 396/396

## Decisions Made
- **A8 baseline 50→64 (not 38→52 as plan text said):** The plan was written with stale RESEARCH.md counts (38 entries). The live catalog had 50 entries (per 08-01-SUMMARY deviation). 50 + 14 new = 64. All plan acceptance criteria recalibrated accordingly (e.g., "count===52" in T2 verify block becomes "count===64" in practice).
- **lavanda-angustifolia tempMin corrected to -15°C:** RESEARCH §Care Table documents "Hardy to -15°C" for Lavandula angustifolia. The existing lavanda entry had tempMin=-5 (inherited from before the split). Corrected to -15 as a Rule 1 fix (wrong botanical data).
- **humidity: 'baja' not 'low' for new lavender entries:** HumidityLevel is a TypeScript enum with Spanish string values (baja/media/alta). The plan's entry templates used English "low" which is invalid. Fixed before tsc check caught it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lavanda-angustifolia tempMin corrected -5 → -15**
- **Found during:** Task 1 (lavanda-angustifolia entry edit)
- **Issue:** Existing lavanda entry had tempMin=-5. RESEARCH §Care Table documents "Hardy to -15°C" for Lavandula angustifolia. -5 was wrong botanical data.
- **Fix:** Set tempMin=-15 on lavanda-angustifolia entry.
- **Files modified:** `src/data/plantDatabase.ts`
- **Verification:** tsc exits 0; T1 inline assertion passes
- **Committed in:** `0583022` (Task 1 commit)

**2. [Rule 1 - Bug] humidity values corrected from English to Spanish ('low' → 'baja')**
- **Found during:** Task 1 (lavanda-stoechas + lavanda-dentada entry creation)
- **Issue:** Plan entry templates used `humidity: "low"`. HumidityLevel TypeScript type is `"baja" | "media" | "alta"` — English words are invalid values.
- **Fix:** Changed humidity to `"baja"` for both new lavender variants; all 12 T2 entries written with correct Spanish values from the start.
- **Files modified:** `src/data/plantDatabase.ts`
- **Verification:** `npx tsc --noEmit` exits 0 (would error on invalid enum value)
- **Committed in:** `0583022` (Task 1 commit)

**3. [Note] Plan count baseline (52) vs actual (64):** Plan text throughout uses counts based on 38-entry baseline (38+14=52). Actual counts based on 50-entry baseline (50+14=64). All assertions calibrated to 64. Not a deviation from implementation — the plan's <important> block explicitly documented this correction needed.

---

**Total deviations:** 2 auto-fixed (Rule 1 — wrong botanical data, Rule 1 — wrong TypeScript enum values)
**Impact on plan:** Both auto-fixes required for correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PLANT_DATABASE has 64 entries, all with expert-vetted lightLevel/waterSchedule/waterMode
- Alias resolution: getCatalogEntry('lavanda') resolves to lavanda-angustifolia via _aliases
- smoke-phase08 PASS 396/396 (A1-A9); all prior runners green
- Plan 04 (read-site consumer migration) can proceed: getCatalogEntry is ready; 64 entries to migrate
- Plan 05 (check-i18n-keys.mjs CI guard) must verify 64 entry ids (not 50)

---
*Phase: 08-catalog-rebalance*
*Completed: 2026-05-01*
