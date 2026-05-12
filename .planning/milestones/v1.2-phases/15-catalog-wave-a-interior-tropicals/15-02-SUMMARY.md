---
phase: 15-catalog-wave-a-interior-tropicals
plan: 02
subsystem: catalog
tags: [plant-catalog, i18n, voseo, edu-fields, interior-tropicals]

# Dependency graph
requires:
  - phase: 15-catalog-wave-a-interior-tropicals
    provides: "Plan 15-00 smoke runner with partial-landing SKIP gates; Plan 15-01 12-entry scaffold + voseo baseline"
  - phase: 14-educational-detail-modal
    provides: "PlantDBEntry shape (5 legacy + 5 EDU fields); careAction.soilCheck pattern; voseo lexicon"
provides:
  - "11 NEW PlantDBEntry objects (Sub-batch B): zamioculca, cola-burro, hiedra, palmera-areca, palmera-kentia, helecho-boston, helecho-nido, pilea, tradescantia, cheflera, arbol-dinero"
  - "11 mirrored i18n keysets in es/plants.json + en/plants.json"
  - "PLANT_DATABASE.length === 87 (closes CAT-09 count assertion)"
  - "All CAT-09 (per-id) + CAT-10 (per-keyset) smoke gates flipped to PASS"
  - "Catalog reaches Phase 15 locked target: 64 (pre-15) + 12 (15-01) + 11 (15-02) = 87"
affects: [15-catalog-wave-a-interior-tropicals (15-03 plant-id routing, 15-04 image plan), 16-19 future catalog waves, edu-modal future render]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sub-batch B physiology citation per sub-type (CAM-succulent / trepadora / Arecaceae / helecho / all-rounder)"
    - "Pre-write whyRationale char-budget verification (max 204 chars, well under 250 ceiling)"
    - "Pre-write voseo regex sweep on all draft strings (zero matches in new content)"
    - "All-rounder rationales avoid generic phrasing — each cites a distinct mechanism (rhizomatous pups / anthocyanins / 2024 POWO reclassification / wetland trunk-storage)"

key-files:
  created: []
  modified:
    - src/data/plantDatabase.ts (+380 LOC; 11 entries appended after maranta)
    - src/i18n/locales/es/plants.json (+220 LOC; 11 voseo blocks)
    - src/i18n/locales/en/plants.json (+220 LOC; 11 EN blocks parallel to ES)

key-decisions:
  - "All 11 entries use waterMode soil_check + careAction.soilCheck (none use fixed) — interior tropicals need finger-test discipline; humidity/temp drive evapotranspiration too variably for fixed schedules"
  - "Cheflera scientificName = Heptapleurum arboricola per 2024 POWO reclassification (was Schefflera arboricola); whyRationale cites the reclassification explicitly to anchor the new genus name"
  - "Arbol-dinero scientificName = Pachira aquatica (per Open Question 2 lock); description and rationale explain the popular name comes from prosperity belief, not biology"
  - "Hiedra (Hedera helix) tempMin = 5°C — outlier vs other interior tropicals (typical 12-16°C floor) — rationale cites temperate forest origin to justify the cold tolerance"
  - "Helecho-boston waterDays = 3 — most demanding humidity entry in catalog; tip + whyRationale both warn that <60% ambient humidity dries fronds irreversibly"

patterns-established:
  - "Sub-type physiology marquee: each Sub-batch B sub-type has a distinct mechanism citation (CAM 2x / trepadora 1x / Arecaceae 2x / helecho 2x / all-rounder 4x — never generic)"
  - "Char-limit-from-draft + voseo-regex pre-sweep discipline (originated Phase 14-06; Plan 15-01 confirmed; Plan 15-02 maintains zero rewordings)"

requirements-completed:
  - CAT-09
  - CAT-10

# Metrics
duration: 10 min
completed: 2026-05-07
---

# Phase 15 Plan 02: Wave A Sub-batch B (Diverse Interior Tropicals) Summary

**11 interior-tropical PlantDBEntry rows added (CAM succulents + trepadora + 2 palmeras + 2 helechos + 4 all-rounders) with full Phase 14 EDU shape and ES+EN i18n keysets in lockstep — catalog reaches the locked Phase 15 target of 87 entries; CAT-09 and CAT-10 fully close.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-07T14:42:54Z
- **Completed:** 2026-05-07T14:53:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- **PLANT_DATABASE grows 76 → 87** — closes the CAT-09 count assertion at the locked Phase 15 target (64 pre-15 + 12 from 15-01 + 11 from 15-02).
- **All 11 new entries declare full Phase 14 EDU shape** — 5 legacy fields (waterDays, sunHours, tempMin/Max, humidity) + 5 EDU fields (careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale).
- **i18n keysets mirrored** — 11 NEW top-level keys in BOTH es/plants.json and en/plants.json, each with all 10 sub-keys (name, tip, description, problems[3], nutrients, careAction, placementRecommended, placementAlternatives[3], placementAvoid, whyRationale).
- **Voseo discipline preserved** — pre-write regex sweep caught zero new regressions; baseline stays at 2 (the same 2 false-positives that exist pre-Phase-15).
- **Char-limit-from-draft worked first try** — max whyRationale 203 chars (ES cheflera) / 204 (EN cheflera), well under 250 ceiling. Zero post-hoc trims needed.
- **Smoke runner advanced** — PASS 34/81 → PASS 57/81 (23 SKIP→PASS flips: 11 CAT-09 ids + 11 CAT-10 keysets + 1 CAT-09 count assertion).

## Task Commits

1. **Task 1: Append 11 PlantDBEntry objects to PLANT_DATABASE** - `71b964b` (feat)
2. **Task 2: Mirror 11 entry blocks to es+en plants.json** - `4c09fdd` (feat)

**Plan metadata:** _pending_ (docs: complete plan)

## Files Created/Modified
- `src/data/plantDatabase.ts` (+380 LOC) — 11 NEW entries appended after the maranta block; sub-type comment dividers (Succulent-tropical, Trepadora, Palmera, Helecho, All-rounder) preserved per spec
- `src/i18n/locales/es/plants.json` (+220 LOC) — 11 NEW voseo keysets; trailing comma added to maranta closing brace
- `src/i18n/locales/en/plants.json` (+220 LOC) — 11 NEW EN keysets parallel to ES; trailing comma added to maranta closing brace

## Per-Sub-Type Physiology Citation (RESEARCH §Pattern 2)

Each sub-type uses its own physiology marquee — no copy-paste rationales:

| Sub-type | Count | Mechanism cited |
| -------- | ----- | --------------- |
| CAM succulent-tropical | 2 (zamioculca, cola-burro) | Metabolismo CAM cierra estomas de día — minimiza pérdida diurna; rizomas (zamioculca) o hojas carnosas (cola-burro) almacenan agua |
| Trepadora | 1 (hiedra) | Raicillas adventicias para trepar; origen templado europeo justifica cold tolerance hasta 5°C |
| Palmera (Arecaceae) | 2 (palmera-areca, palmera-kentia) | Sotobosque tropical, drenaje rápido + humedad constante; kentia diferenciada por adaptación a sombreado profundo de Lord Howe |
| Helecho | 2 (helecho-boston, helecho-nido) | Boston: esporofito requiere humedad >60% (sin almacén de agua); Nido: epífito que recoge agua y detritos en el nido central |
| All-rounder | 4 (pilea, tradescantia, cheflera, arbol-dinero) | Cada uno con mecanismo distinto: rizomas + hojas-escudo (pilea); antocianinas que requieren luz (tradescantia); reclasificación POWO 2024 + bosques transición (cheflera); tronco-almacén de pantanos (arbol-dinero) |

**Total citations:** 11 distinct mechanisms — zero generic rationales.

## whyRationale Char Audit

| ID | ES chars | EN chars |
| -- | -------- | -------- |
| zamioculca | 196 | 176 |
| cola-burro | 197 | 189 |
| hiedra | 186 | 180 |
| palmera-areca | 185 | 187 |
| palmera-kentia | 191 | 165 |
| helecho-boston | 179 | 175 |
| helecho-nido | 181 | 160 |
| pilea | 198 | 173 |
| tradescantia | 180 | 164 |
| cheflera | 203 | 204 |
| arbol-dinero | 200 | 187 |
| **MAX** | **203** | **204** |

All 22 strings (11 ES + 11 EN) ≤ 204 chars; 250-char ceiling never approached.

## Voseo Discipline (ES)

- **Pre-write regex sweep:** all draft strings scanned with `/\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b/g` BEFORE writing to file. Result: zero matches.
- **Post-write count:** `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json` → 2 (baseline preserved; no new regressions).
- **Voseo imperatives used:** regá, sacá, podá, podés, querés, movela, tocá, dejá, evitá, pulverizá, aceptá, mantené, agrupala, acercala, mejorá, reducí, cortá, rotá, alejala, bajá, duchá, optá, estabilizá, limpiá, revisá, colocala, podá.

## Smoke Runner Delta

```
Before (post Plan 15-01):  PASS 34/81  ·  47 SKIP  ·  0 FAIL  ·  exit 0
After  (post Plan 15-02):  PASS 57/81  ·  24 SKIP  ·  0 FAIL  ·  exit 0
Flips: +23 (11 CAT-09 ids + 11 CAT-10 keysets + 1 CAT-09 count assertion)
```

Remaining 24 SKIPs are all CAT-11 (Plan 15-03 plantIdentification.ts COMMON_NAMES_ES routing for the 23 species) + 1 CAT-12 (Plan 15-04 CLAUDE.md image-plan documentation).

## Decisions Made

- **All 11 entries use `waterMode: "soil_check"` + `careAction.soilCheck`.** Interior tropicals need finger-test discipline because evapotranspiration varies with ambient humidity and temperature (especially helechos and palmeras). Fixed schedules can't span the variance — for example, palmera-areca's `cold` schedule is double its `warm`, suggesting strong seasonal swing. CONTEXT.md locked this.
- **Cheflera scientificName = `Heptapleurum arboricola`** per the 2024 POWO reclassification from Schefflera. The whyRationale explicitly cites the reclassification to give the user a recognizable anchor (`antes Schefflera arboricola`).
- **Arbol-dinero scientificName = `Pachira aquatica`** per Open Question 2 lock. Description and rationale explain that the "money tree" name comes from popular belief about prosperity, not from any biological feature — staying truthful while preserving the common-name appeal.
- **Hiedra tempMin = 5°C** — far below the typical interior-tropical floor (12-16°C). The whyRationale specifically calls out "su origen es templado, no tropical" to make the outlier coherent for users browsing the catalog.
- **Helecho-boston is the most demanding humidity entry in the catalog (waterDays = 3, humidity = "alta", whyRationale warns of irreversible drying below 60% RH).** Tip and whyRationale both make this an explicit warning so users self-select out if they can't sustain the conditions.

## Deviations from Plan

None - plan executed exactly as written.

The pre-write voseo regex sweep + char-limit-from-draft discipline (now compounding from Phase 14-06 → Plan 15-01 → Plan 15-02) caught zero issues mid-authoring. All 11 entries authored in a single pass with no rewordings or trims.

**Total deviations:** 0
**Impact on plan:** Zero scope creep. Plan executed at the rate of ~1 entry per minute (10 min / 11 entries) due to the cumulative discipline.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **CAT-09 and CAT-10 fully closed.** Phase 15 catalog content is complete at 87 entries with full Phase 14 EDU shape and ES+EN i18n keysets.
- **Plan 15-03 (CAT-11) is unblocked and ready** — needs to register the 23 Phase 15 species in `src/services/plantIdentification.ts` `COMMON_NAMES_ES` map (or equivalent routing). The Plan 15-00 smoke runner will flip its 23 CAT-11 SKIPs to PASS once the routing lands.
- **Plan 15-04 (CAT-12) is unblocked and ready** — needs to add the 23 Phase 15 ids to the CLAUDE.md "Accepted-known failures" list under `npm run check:images` (since none of the 23 will have catalog images at first; manual upload is a milestone-end ops task).
- **Smoke runner remains exit 0** at PASS 57/81 — runner stays green across the Plan 15-02 → 15-03 → 15-04 progression.

---
*Phase: 15-catalog-wave-a-interior-tropicals*
*Completed: 2026-05-07*

## Self-Check: PASSED

- File `.planning/phases/15-catalog-wave-a-interior-tropicals/15-02-SUMMARY.md` exists on disk
- File `src/data/plantDatabase.ts` modified (commit 71b964b)
- File `src/i18n/locales/es/plants.json` modified (commit 4c09fdd)
- File `src/i18n/locales/en/plants.json` modified (commit 4c09fdd)
- Commits `71b964b` and `4c09fdd` present in `git log --oneline`
- All Task 1 + Task 2 acceptance criteria verified inline before each commit
