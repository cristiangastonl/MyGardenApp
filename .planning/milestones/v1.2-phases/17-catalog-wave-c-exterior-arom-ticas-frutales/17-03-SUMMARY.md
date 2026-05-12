---
phase: 17-catalog-wave-c-exterior-arom-ticas-frutales
plan: 03
subsystem: ai-identification
tags: [plant-identification, plantnet, taxonomy, common-names, routing, powo]

requires:
  - phase: 17-00
    provides: phase17-smoke runner with W3.CAT-20.commonNames SKIP gates ready to flip
  - phase: 17-01
    provides: 8 net-new CAT-17 exterior flores entries (catalog 104→112)
  - phase: 17-02
    provides: 6 net-new CAT-18 + CAT-19 entries (catalog 112→118; CAT-21 closed)
  - phase: 16-00
    provides: findPlantInDatabase exact-match-first refactor (inherited unchanged)
  - phase: 16-03
    provides: COMMON_NAMES_ES Phase 16 extension pattern (append-only, selective genus aliases, ≤2 synonym aliases)
provides:
  - "COMMON_NAMES_ES extended with 27 net-new entries: 14 species-qualified canonical mappings (CAT-17/18/19) + 8 net-new genus aliases (Dianthus/Chrysanthemum/Tulipa/Helianthus/Magnolia/Anethum/Olea/Spinacia) + 5 legacy synonym aliases (Rhododendron indicum/Tulipa hybrida/Magnolia grandiflora/Fuchsia × hybrida/Chrysanthemum indicum)"
  - "PlantNet → curated catalog routing closure for all 14 Phase 17 species via species-qualified exact-match (Phase 16 refactor) + genus prefix fallback (3 already-covered: Rhododendron/Cyclamen/Fuchsia) + new genus alias coverage (8 net-new)"
  - "CAT-20 routing portion fully closed; only CAT-20 image plan (17-04) remains for Phase 17"
affects: [17-04, future-catalog-waves, plantnet-integration]

tech-stack:
  added: []
  patterns:
    - "Append-only COMMON_NAMES_ES extension (never modify pre-existing entries — git diff deletions = 0)"
    - "Species-qualified override pattern: species-key takes precedence over genus-key via findPlantInDatabase exact-match-first (Phase 16-00 refactor)"
    - "Selective genus alias pattern: add genus alias only when single-species genus or all species share display name; deliberately omit for large/divergent genera (Stevia ~240 species, Vaccinium divergent display names, Salvia >900 species + collision)"
    - "≤2 synonym aliases per entry for taxonomic-drift coverage (POWO canonical + legacy/parent species)"
    - "POWO 2024 × Unicode hybrid symbol preserved verbatim (Chrysanthemum × morifolium, Fuchsia × hybrida)"

key-files:
  created: []
  modified:
    - "src/utils/plantIdentification.ts (+49 LOC; COMMON_NAMES_ES grew by 27 entries — 14 species-qualified + 8 net-new genus aliases + 5 legacy synonym aliases + ~5 comment headers/sub-section markers)"

key-decisions:
  - "3 genus aliases DELIBERATELY OMITTED following Phase 16 Echinopsis precedent: Stevia (~240 species, divergent — non-rebaudiana spp would mis-route), Vaccinium (divergent display names — V. myrtillus = European blueberry, V. macrocarpon = cranberry/oxicoco), Salvia (>900 species + already split between salvia-ornamental Salvia splendens and salvia-officinalis Salvia officinalis with collision risk; existing 'Salvia rosmarinus' species-qualified pattern at line 65 proves multiply-routed-genus is established safe approach)."
  - "Magnolia stellata canonical (Plan 17-01 Q4 default — RHS small-garden 3m dwarf form); Magnolia grandiflora retained as legacy synonym alias to absorb PlantNet drift if user identifies a grandiflora variety. Magnolia genus alias added (single display name, no divergence among cultivated species)."
  - "Fuchsia magellanica canonical (Patagonian native — Argentine LATAM heritage per Plan 17-01); Fuchsia × hybrida retained as legacy alias for commercial cultivar mix variants. Existing 'Fuchsia' genus mapping at line 84 covers fallback."
  - "Salvia officinalis species-qualified ONLY (Pitfall 1 — DO NOT add 'Salvia' genus alias). Mirrors existing 'Salvia rosmarinus' species-qualified pattern at line 65. Phase 16 exact-match-first refactor protects against genus collision with salvia-ornamental (Salvia splendens)."
  - "5 legacy synonym aliases (≤2 per entry budget — Phase 17 species are taxonomically stable, fewer drift candidates than Phase 16's 8): Rhododendron indicum (Japanese-azalea drift), Tulipa hybrida (older horticultural designation), Magnolia grandiflora (Q4 alternative variant coverage), Fuchsia × hybrida (commercial cultivar mix), Chrysanthemum indicum (parent species — sometimes returned by PlantNet)."

patterns-established:
  - "Selective genus alias pattern reinforced: 8 ADD (Dianthus/Chrysanthemum/Tulipa/Helianthus/Magnolia/Anethum/Olea/Spinacia — single display name / monotypic / cultivated-only) + 3 OMIT (Stevia/Vaccinium/Salvia — large or divergent). Mirrors Phase 16 Echinopsis pattern. Reusable for any future catalog wave needing same large-genus discipline."
  - "POWO × Unicode hybrid symbol preserved at-source: Chrysanthemum × morifolium key uses the actual × character (U+00D7 Multiplication Sign), not 'x' or '*'. Pattern continued from Phase 16 Schlumbergera × buckleyi."

requirements-completed: [CAT-20]

duration: 1min
completed: 2026-05-08
---

# Phase 17 Plan 03: COMMON_NAMES_ES Phase 17 Routing Closure Summary

**Extended `COMMON_NAMES_ES` with 27 net-new entries covering all 14 Phase 17 species via species-qualified mappings, 8 new genus aliases (Dianthus/Chrysanthemum/Tulipa/Helianthus/Magnolia/Anethum/Olea/Spinacia), and 5 legacy synonym aliases for taxonomic-drift coverage; closes CAT-20 routing portion.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-05-08T16:24:49Z
- **Completed:** 2026-05-08T16:26:20Z
- **Tasks:** 1 (single Task 1: Extend COMMON_NAMES_ES with Phase 17 mappings)
- **Files modified:** 1

## Accomplishments

- 14 Phase 17 W3.CAT-20.commonNames SKIPs flipped to PASS — `node scripts/phase17-smoke.cjs` now PASS 54/54 (was 40/54 + 14 SKIP at Plan 17-02 close).
- `--identification` flag PASS 68/68 (Plan 17-02 close: 54/68 + 14 SKIP); `--routing-fix` PASS 68/68 (Plan 17-02 close: 54/68 + 14 SKIP).
- Phase 16 regression CLEAN: phase16-smoke 69/69, --identification 88/88, --routing-fix 92/92. Phase 15 regression CLEAN: phase15-smoke 81/81, --identification 104/104.
- Existing 100+ pre-Phase-17 COMMON_NAMES_ES entries untouched (git diff: 0 deletions; 49 insertions only).
- `npx tsc --noEmit` exits 0 — no duplicate-key errors despite 27 net-new entries in same Record.
- Stevia/Vaccinium/Salvia genus aliases deliberately NOT added (RESEARCH lock); single-species precision preserved via species-qualified `Stevia rebaudiana` / `Vaccinium corymbosum` / `Salvia officinalis` only.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend COMMON_NAMES_ES with 14 Phase 17 species-qualified mappings + 8 net-new genus aliases + 5 legacy synonyms** — `6150f11` (feat)

**Plan metadata:** TBD (final commit covers SUMMARY + STATE + ROADMAP + REQUIREMENTS).

## Files Created/Modified

- `src/utils/plantIdentification.ts` — COMMON_NAMES_ES Record extended (+49 LOC; 27 net-new entries with ~5 comment headers and sub-section markers).

## COMMON_NAMES_ES Net Adds Breakdown

**14 canonical species-qualified mappings:**
- CAT-17 (8 exterior flores): Rhododendron simsii (override → Azalea), Cyclamen persicum, Fuchsia magellanica, Dianthus caryophyllus, Chrysanthemum × morifolium (POWO 2024 × Unicode), Tulipa gesneriana, Helianthus annuus, Magnolia stellata
- CAT-18 (3 aromáticas): Salvia officinalis, Anethum graveolens, Stevia rebaudiana
- CAT-19 (3 frutales/huerta): Olea europaea, Vaccinium corymbosum, Spinacia oleracea

**8 net-new genus aliases:** Dianthus → Clavel, Chrysanthemum → Crisantemo, Tulipa → Tulipán, Helianthus → Girasol, Magnolia → Magnolia, Anethum → Eneldo, Olea → Olivo, Spinacia → Espinaca

**5 legacy synonym aliases (taxonomic-drift coverage):** Rhododendron indicum → Azalea, Tulipa hybrida → Tulipán, Magnolia grandiflora → Magnolia, Fuchsia × hybrida → Fucsia, Chrysanthemum indicum → Crisantemo

**Net add count: 27 mapping entries (14 + 8 + 5) + ~5 comment headers/sub-section markers = +49 LOC total (incl. inline taxonomy notes).**

**3 genus aliases DELIBERATELY OMITTED:** Stevia (~240 spp), Vaccinium (divergent display names), Salvia (>900 spp + collision with salvia-ornamental). Documented inline in source via comment block. Mirrors Phase 16 Echinopsis pattern.

## Taxonomic Decisions Confirmed

| ID | Canonical (POWO) | Legacy alias kept | Existing genus mapping | Display |
|---|---|---|---|---|
| azalea | Rhododendron simsii | Rhododendron indicum | 'Rhododendron'→'Azalea' (line 88) | Azalea |
| ciclamen | Cyclamen persicum | — | 'Cyclamen'→'Ciclamen' (line 89) | Ciclamen |
| fucsia | Fuchsia magellanica (Patagonian) | Fuchsia × hybrida | 'Fuchsia'→'Fucsia' (line 84) | Fucsia |
| clavel | Dianthus caryophyllus | — | NEW 'Dianthus'→'Clavel' | Clavel |
| crisantemo | Chrysanthemum × morifolium (POWO 2024 × Unicode) | Chrysanthemum indicum | NEW 'Chrysanthemum'→'Crisantemo' | Crisantemo |
| tulipan | Tulipa gesneriana | Tulipa hybrida | NEW 'Tulipa'→'Tulipán' | Tulipán |
| girasol | Helianthus annuus | — | NEW 'Helianthus'→'Girasol' | Girasol |
| magnolia | Magnolia stellata (compact dwarf, Q4 default) | Magnolia grandiflora | NEW 'Magnolia'→'Magnolia' | Magnolia estrellada |
| salvia-officinalis | Salvia officinalis | — | NO genus alias (Pitfall 1) | Salvia oficinal |
| eneldo | Anethum graveolens | — | NEW 'Anethum'→'Eneldo' (monotypic) | Eneldo |
| stevia | Stevia rebaudiana | — | NO genus alias (large divergent genus) | Stevia |
| olivo | Olea europaea | — | NEW 'Olea'→'Olivo' (O. europaea dominates) | Olivo |
| arandano | Vaccinium corymbosum | — | NO genus alias (divergent species names) | Arándano |
| espinaca | Spinacia oleracea | — | NEW 'Spinacia'→'Espinaca' (monotypic cultivated) | Espinaca |

## Decisions Made

See key-decisions in frontmatter. Notably:

- **Selective genus alias pattern (8 ADD + 3 OMIT)** locked. Add genus alias when single-species genus, monotypic, or all cultivated species share display name (Dianthus/Chrysanthemum/Tulipa/Helianthus/Magnolia/Anethum/Olea/Spinacia ✓). Deliberately omit for large divergent genera or genera with collision risk: Stevia (~240 species), Vaccinium (divergent species names — blueberry/cranberry/lingonberry), Salvia (>900 species + collision risk with salvia-ornamental Salvia splendens). Mirrors Phase 16 Echinopsis pattern.
- **Append-only discipline:** 100+ pre-Phase-17 entries preserved verbatim; new block appended before closing `};`. `git diff | grep '^-' | grep -v '^---'` returns 0.
- **POWO × Unicode hybrid symbols preserved:** Chrysanthemum × morifolium and Fuchsia × hybrida use actual × character (U+00D7 Multiplication Sign), continuing the Phase 16 Schlumbergera × buckleyi convention.

## Deviations from Plan

None — plan executed exactly as written. Step A (insert block before `};`) + Step B (duplicate-key avoidance via grep — all 27 keys verified net-new pre-insert, zero conflicts) + Step E (no existing-entry modification) + Step F (`tsc --noEmit` clean) + Step G (`--routing-fix` regression clean — Phase 16 refactor sentinel `const exactMatch = PLANT_DATABASE.find` count = 1 preserved) + Step H (`phase15-smoke` + `phase16-smoke` regression clean) + Step I (W3 sentinel triggered SKIP→PASS flip on all 14 W3.CAT-20.* gates) all passed first-try.

## Smoke Runner Status

| Smoke variant | Pre-Plan-17-03 | Post-Plan-17-03 | Delta |
|---|---|---|---|
| `phase17-smoke.cjs` | PASS 40/54 + 14 SKIP, exit 0 | PASS 54/54, 0 SKIP, exit 0 | +14 PASS |
| `phase17-smoke.cjs --identification` | PASS 54/68 + 14 SKIP, exit 0 | PASS 68/68, 0 SKIP, exit 0 | +14 PASS |
| `phase17-smoke.cjs --routing-fix` | PASS 54/68 + 14 SKIP, exit 0 | PASS 68/68, 0 SKIP, exit 0 | +14 PASS |
| `phase16-smoke.cjs` | PASS 69/69, exit 0 | PASS 69/69, exit 0 | unchanged (regression clean) |
| `phase16-smoke.cjs --identification` | PASS 88/88, exit 0 | PASS 88/88, exit 0 | unchanged (regression clean) |
| `phase16-smoke.cjs --routing-fix` | PASS 92/92, exit 0 | PASS 92/92, exit 0 | unchanged (regression clean) |
| `phase15-smoke.cjs` | PASS 81/81, exit 0 | PASS 81/81, exit 0 | unchanged (regression clean) |
| `phase15-smoke.cjs --identification` | PASS 104/104, exit 0 | PASS 104/104, exit 0 | unchanged (regression clean) |

## Issues Encountered

None.

## Next Phase Readiness

- **Phase 17 status:** CAT-17/18/19/20 catalog content + i18n keysets + identification routing all closed. CAT-21 final assertion idMatches===118 still PASS. Only Plan 17-04 (CAT-20 image plan in CLAUDE.md "Phase 17 Wave C" image-deferral block) remains for Phase 17.
- **Plan 17-04 prerequisites all satisfied:** all 14 Phase 17 ids landed in plantDatabase.ts (118 entries); plan 17-04 will append a single Phase 17 Wave C grouping block to CLAUDE.md mirroring the Phase 15 Wave A + Phase 16 Wave B precedent. File-disjoint with this plan (plantIdentification.ts vs CLAUDE.md) so could have parallelized — both plans now near complete sequentially.
- **Forward-compat:** New COMMON_NAMES_ES selective-genus-alias pattern with 8 ADD + 3 OMIT documented inline in source as Phase 17 block. Pattern reusable for any future catalog wave (post-v1.2) needing same large-genus species discipline.
- **v1.2 catalog expansion content layer:** Closed since Plan 17-02; routing layer for Phase 17 closes here. Image plan layer (Plans 17-04) is the last step before Phase 17 completes entirely.

---
*Phase: 17-catalog-wave-c-exterior-arom-ticas-frutales*
*Plan: 03*
*Completed: 2026-05-08*

## Self-Check: PASSED

- File `src/utils/plantIdentification.ts` exists and contains all required entries (verified via grep: 14 species-qualified canonical = 1 each, 8 net-new genus aliases = 1 each, 5 legacy synonyms = 1 each = 5 total)
- 3 deliberately-omitted genus aliases (Stevia/Vaccinium/Salvia) confirmed absent (count 0 each)
- findPlantInDatabase exact-match-first refactor still in place (grep count 1)
- 0 deletions in git diff (append-only discipline preserved); 49 insertions
- Commit `6150f11` exists in git log (FOUND)
- All 8 smoke variants exit 0 (phase17 default + --identification + --routing-fix; phase16 default + --identification + --routing-fix; phase15 default + --identification)
- Phase 17 W3.CAT-20.commonNames gates flipped 14 SKIP → 14 PASS
