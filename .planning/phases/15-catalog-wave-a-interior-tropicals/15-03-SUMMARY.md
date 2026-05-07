---
phase: 15-catalog-wave-a-interior-tropicals
plan: 03
subsystem: api
tags: [plant-identification, plantnet, common-names, taxonomy, catalog-routing]

# Dependency graph
requires:
  - phase: 15-catalog-wave-a-interior-tropicals/15-01
    provides: 12 Phase 15 PLANT_DATABASE entries with canonical scientificName fields (Sub-batch A)
  - phase: 15-catalog-wave-a-interior-tropicals/15-02
    provides: 11 Phase 15 PLANT_DATABASE entries with canonical scientificName fields (Sub-batch B)
provides:
  - COMMON_NAMES_ES extended with 26 net new entries — 21 canonical Phase 15 species/genus mappings + 5 PlantNet synonym aliases for taxonomic-drift coverage
  - PlantNet → curated catalog routing closed for all 23 Phase 15 species (via species-qualified key, genus prefix, or PLANT_DATABASE.scientificName match in findPlantInDatabase)
  - Maranta leuconeura sentinel landed → Phase 15 smoke runner CAT-11 SKIP gate now flips PASS
affects: [16-catalog-wave-b-exterior-aromaticas, 17-catalog-wave-c-frutales-suculentas, 18-recommendation-card-mood-emoji]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "COMMON_NAMES_ES dual-coverage pattern: species-qualified key for canonical PlantNet returns + genus-only alias for related species (extends existing pattern from earlier phases)"
    - "PlantNet synonym alias pattern: ≤2 well-known synonyms per genus to absorb taxonomic drift (Heptapleurum/Schefflera arboricola, Pachira aquatica/glabra, Ficus lyrata/pandurata)"

key-files:
  created: []
  modified:
    - src/utils/plantIdentification.ts

key-decisions:
  - "costilla-adan = Monstera adansonii (distinct from existing 'Monstera deliciosa' → 'Monstera' entry; species-qualified key disambiguates)"
  - "arbol-dinero = Pachira aquatica (canonical, already mapped) + Pachira glabra alias (taxonomically more accurate; absorbs PlantNet drift)"
  - "cheflera = Heptapleurum arboricola (POWO 2024 accepted name) + Schefflera arboricola alias (legacy PlantNet returns); both routed to existing Schefflera genus entry"
  - "ficus-lyrata = Ficus lyrata (canonical, already mapped) + Ficus pandurata alias (older PlantNet drift)"
  - "Sansevieria genus-only key added as alias (existing entry only had Sansevieria trifasciata + Dracaena trifasciata); enables coverage of related species PlantNet may return"

patterns-established:
  - "Pattern: COMMON_NAMES_ES extension is APPEND-ONLY when adding catalog batches — NEVER modify existing entries. Verify with `git diff | grep '^-' | grep -v '^---' | wc -l` returning 0."
  - "Pattern: When a Phase 15-style sub-genus split exists (e.g., Monstera deliciosa vs. Monstera adansonii), use species-qualified keys for both, retain the genus-only alias for the more common species, and disambiguate via the species-qualified key for the less common."

requirements-completed: [CAT-11]

# Metrics
duration: 2min
completed: 2026-05-07
---

# Phase 15 Plan 03: COMMON_NAMES_ES Phase 15 Extension (CAT-11 closure) Summary

**26 net new COMMON_NAMES_ES entries (21 canonical Phase 15 species/genus mappings + 5 PlantNet synonym aliases) closing PlantNet → curated catalog routing for all 23 Phase 15 species; smoke runner now exits 0 with 81/81 default + 104/104 --identification.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-07T14:57:47Z
- **Completed:** 2026-05-07T14:59:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Extended COMMON_NAMES_ES with 26 net new entries (acceptance threshold was ≥17): 21 Phase 15 canonical mappings + 5 PlantNet synonym aliases for taxonomic-drift coverage.
- All 23 Phase 15 scientificNames now reachable via at least one of: (a) species-qualified key, (b) genus-only alias, (c) PLANT_DATABASE.scientificName match in `findPlantInDatabase`.
- Smoke runner exits 0 in both modes: `node scripts/phase15-smoke.cjs` → 81/81 PASS (was 57/81 with 24 SKIPs); `node scripts/phase15-smoke.cjs --identification` → 104/104 PASS (was 80/104 with 24 SKIPs). Every CAT-11 + IDENT.CAT-11 SKIP flipped to PASS.
- Existing 64 COMMON_NAMES_ES entries untouched (additive-only diff: `git diff … | grep '^-'` returns 0 modified lines).
- CAT-11 fully closed; only CAT-12 (Plan 15-04 image plan documentation) remains for Phase 15.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend COMMON_NAMES_ES with 23 Phase 15 mappings + ~5 synonym aliases** — `7ac84d7` (feat)

**Plan metadata:** (separate commit at end of plan with SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md)

## Files Created/Modified
- `src/utils/plantIdentification.ts` (+36 LOC) — Appended Phase 15 block to COMMON_NAMES_ES Record before the closing `};`. Two sub-blocks with header comments: "v1.2 Phase 15 Wave A — Interior Tropicals" (21 entries) and "PlantNet synonym aliases" (5 entries). Existing 64 entries above the new block are byte-identical to pre-plan state.

## Decisions Made

### Taxonomic decisions confirmed (per RESEARCH §Open Questions 1-3)
- **`costilla-adan` = Monstera adansonii** — Distinct from existing `'Monstera deliciosa' → 'Monstera'` entry. Used species-qualified key `'Monstera adansonii': 'Costilla de Adán'` to disambiguate. Genus-prefix matching in `findPlantInDatabase` still routes correctly because both PLANT_DATABASE entries share the genus prefix.
- **`arbol-dinero` = Pachira aquatica** — Canonical scientificName already mapped at line 96 (untouched). Added `'Pachira glabra': 'Árbol del dinero'` alias to absorb PlantNet returns of the more taxonomically-accurate species name.
- **`cheflera` = Heptapleurum arboricola** — POWO 2024 accepted name (per Plan 15-02 lock). Added `'Heptapleurum arboricola': 'Cheflera'` (canonical) AND `'Schefflera arboricola': 'Cheflera'` (legacy alias). Existing `'Schefflera': 'Cheflera'` genus entry untouched.
- **`ficus-lyrata` = Ficus lyrata** — Canonical scientificName already mapped at line 51 (untouched). Added `'Ficus pandurata': 'Ficus lyrata'` alias for older PlantNet drift.
- **Sansevieria genus alias** — Existing entries map `'Sansevieria trifasciata'` and `'Dracaena trifasciata'` (line 52-53). Added bare `'Sansevieria': 'Sansevieria'` for related species PlantNet may return (e.g., `Sansevieria zeylanica`).

### Duplicates skipped per Step B (avoid double-key TS errors)
- `'Pilea peperomioides'` — already exists at line 81 (mapped to 'Pilea'). NOT re-added.
- `'Zamioculcas zamiifolia'` — already exists at line 80 (mapped to 'Zamioculca'). NOT in plan's new list, NOT added.
- `'Hedera helix'` — already exists at line 83. NOT re-added.
- `'Pachira aquatica'` — already exists at line 96. NOT re-added (only the `Pachira glabra` alias added).
- `'Ficus lyrata'` — already exists at line 51. NOT re-added (only the `Ficus pandurata` alias added).

### Net entry count
- Plan estimated ~17 net adds; actual = 26 (every planned line in the insertion block was kept because none of them collided with existing keys per Step B verification).

## Deviations from Plan

None — plan executed exactly as written. Pre-insertion duplicate-key audit (Step B) confirmed all proposed lines were safe to add. The plan's `'Pilea peperomioides'` line was correctly skipped per Step B guidance (already at line 81); the comment in the inserted block was also dropped to keep the diff clean.

## Issues Encountered

None. TypeScript check passed first try (no duplicate-key errors). Both smoke-runner modes passed first try.

## Self-Check

Verifying claims:

- File created/modified: `src/utils/plantIdentification.ts` — FOUND (modified)
- Commit `7ac84d7` — FOUND in `git log`
- All 11 sentinel keys present exactly once (Maranta leuconeura, Heptapleurum arboricola, Monstera adansonii, Sedum morganianum, Asplenium nidus, Dypsis lutescens, Howea forsteriana, Caladium bicolor, Alocasia × amazonica, Syngonium podophyllum, Aglaonema commutatum) — VERIFIED
- `npx tsc --noEmit` exit 0 — VERIFIED
- `node scripts/phase15-smoke.cjs` exit 0 (81/81) — VERIFIED
- `node scripts/phase15-smoke.cjs --identification` exit 0 (104/104) — VERIFIED
- `git diff ... | grep '^-' | grep -v '^---' | wc -l` returns 0 (additive-only) — VERIFIED

## Self-Check: PASSED

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- CAT-11 fully closed; PlantNet → catalog routing intact for all 23 Phase 15 species.
- Plan 15-04 (CAT-12 image plan documentation) is the final plan in Phase 15. File-disjoint from this plan (touches CLAUDE.md only) — may run in parallel.
- After Plan 15-04 lands, Phase 15 closes and the milestone moves to Phase 16 (Wave B exterior aromáticas) catalog planning.

---
*Phase: 15-catalog-wave-a-interior-tropicals*
*Completed: 2026-05-07*
