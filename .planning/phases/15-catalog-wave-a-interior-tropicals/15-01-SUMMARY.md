---
phase: 15-catalog-wave-a-interior-tropicals
plan: 01
subsystem: catalog
tags: [plant-database, i18n, voseo, catalog, edu-fields, aroceous, foliage, content-authoring]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    provides: PlantDBEntry EDU shape (5 new optional fields), getTranslatedPlant indirection, check-i18n-keys EDU sub-field rules
  - phase: 15-catalog-wave-a-interior-tropicals
    provides: scripts/phase15-smoke.cjs runner with partial-landing tolerance + voseo regression baseline (Plan 15-00)
provides:
  - 12 interior-tropical PlantDBEntry rows (Aroceous + Foliage especial sub-batches) with full Phase 14 EDU shape
  - 12 i18n keysets in EN + ES (voseo) under top-level keys in plants.json
  - Catalog grows from 64 → 76 entries; CAT-09 partial closure; CAT-10 keyset coverage for 12 ids
  - 24 SKIP→PASS flips in scripts/phase15-smoke.cjs runner
affects: [15-02-PLAN (Wave 2 sub-batch B authoring), 15-03-PLAN (CAT-11 species map), 15-04-PLAN (CAT-12 docs)]

# Tech tracking
tech-stack:
  added: []  # No new libs — content-only authoring on existing rails
  patterns:
    - "Sub-batch comment dividers (Aroceous + Foliage especial) inside catalog array"
    - "Inline char-limit-from-draft discipline (Phase 14-06/07 pattern carries forward)"
    - "Voseo enclitic-form usage: agrupala / movela / mantenela / acercala / cubrila / dejalo / mantenelo / alejala (no banned 3rd-person forms)"

key-files:
  created: []
  modified:
    - src/data/plantDatabase.ts (+411 LOC; 12 new entries appended; 64 existing untouched)
    - src/i18n/locales/es/plants.json (+240 LOC; 12 new top-level keys; voseo throughout)
    - src/i18n/locales/en/plants.json (+240 LOC; 12 new top-level keys; natural English)

key-decisions:
  - "All 12 entries declare waterMode: 'soil_check' + careAction.soilCheck — no fixed waterers in Sub-batch A (interior tropics need finger-test discipline because temperature/humidity drive evapotranspiration unpredictably)"
  - "Aroceous (7) physiology rationales kept distinct per genus mechanism: anthurium (spathes-as-pollinator-attractors), alocasia (capillary-vein-humidity reflection), caladium (tuber dormancy + chlorophyll-free patches), singonio (heteroblasty), aglaonema (low-light chlorophyll efficiency), costilla-adan (hemiepiphyte fenestrations vs M. deliciosa), difenbaquia (water-storing stems + oxalate sap)"
  - "Foliage especial (5) anchored to pigment-vs-light mechanism: begonia-rex / croton (anthocyanins+carotenoids require bright light to express), fitonia (white veins reflect understory light), ficus-lyrata (hemi-epiphyte canopy adaptation + stress sensitivity), maranta (nyctinasty via petiole pulvini)"
  - "begonia-rex name field uses 'Begonia rex' (cultivar series, no botanical alternative); croton EN tip uses 'Glossy leaves, almost sculptural' (kept descriptive, not literal Spanish translation 'gomosa')"

patterns-established:
  - "Pre-write voseo regex sweep: validate each ES string block against /\\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\\b/ BEFORE editing files (zero post-hoc rewordings needed in this plan)"
  - "Char-limit-from-draft for whyRationale: drafts targeted ≤200 chars from the start (max landed = 198 ES / 189 EN, all ≤250 ceiling)"

requirements-completed: [CAT-09, CAT-10]

# Metrics
duration: 12min
completed: 2026-05-07
---

# Phase 15 Plan 01: Wave A Sub-batch A — Interior Tropicals (Aroceous + Foliage especial) Summary

**12 interior-tropical PlantDBEntry rows (anthurium / alocasia / caladium / singonio / aglaonema / costilla-adan / difenbaquia / begonia-rex / croton / fitonia / ficus-lyrata / maranta) added to PLANT_DATABASE with full Phase 14 EDU shape, mirrored to EN + ES (voseo) plants.json keysets.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-07T14:25:45Z
- **Completed:** 2026-05-07T14:38:15Z
- **Tasks:** 2
- **Files modified:** 3 (+891 LOC total)

## Accomplishments

- Catalog grows from 64 → 76 entries (+12) — all marked `category: "interior"`, `outdoor: false`
- All 12 entries declare full Phase 14 EDU shape: 5 legacy fields (name, tip, description, problems[3], nutrients) + 5 EDU fields (careAction.soilCheck, placementRecommended, placementAlternatives[3], placementAvoid, whyRationale)
- ES + EN i18n keysets shipped in lockstep with TS catalog (`check:i18n-keys` passes — 76 ids verified, full keysets in both locales)
- Voseo discipline maintained: regex baseline (≤2) preserved at exactly 2 hits (zero new regressions across 12 entries × ~15 ES strings each)
- Phase 15 smoke runner: 24 of 47 SKIP gates flip to PASS this plan (12 CAT-09 ids + 12 CAT-10 keysets); CAT-09 count assertion correctly remains SKIP at 76 (waits on Plan 15-02 final 11 entries to land at 87)
- All whyRationale strings ≤250 chars (ES max 198, EN max 189) — well within ceiling
- Aroceous sub-batch (7 entries) shares "aráceas / sotobosque" framing but each entry cites a distinct physiological/family mechanism (no copy-paste rationales)
- Foliage especial sub-batch (5 entries) anchored on pigment-light interactions or specialized adaptations (nyctinasty, fenestrations)

## Task Commits

Each task was committed atomically:

1. **Task 1: Append 12 PlantDBEntry objects to PLANT_DATABASE in src/data/plantDatabase.ts** — `fb70ed0` (feat) — +411 LOC
2. **Task 2: Mirror 12 entry blocks to src/i18n/locales/{en,es}/plants.json** — `eec6d17` (feat) — +480 LOC (240 each locale)

**Plan metadata:** _pending final commit_

## Files Created/Modified

- `src/data/plantDatabase.ts` (+411 LOC) — 12 new entries appended with sub-type comment dividers (Aroceous, Foliage especial); 64 pre-existing entries untouched
- `src/i18n/locales/es/plants.json` (+240 LOC) — 12 new top-level voseo keysets; humidity tail-key preserved; 64 pre-existing keys untouched
- `src/i18n/locales/en/plants.json` (+240 LOC) — 12 new top-level natural-English keysets; humidity tail-key preserved; 64 pre-existing keys untouched

## Decisions Made

- **waterMode discipline:** All 12 Sub-batch A entries use `soil_check` rather than `fixed`. Interior tropics depend on temperature/humidity driving evapotranspiration; soil-check discipline scales correctly across both warm and cold seasons, especially for variable-dormancy entries (alocasia, caladium).
- **whyRationale per-entry specialization:** Started from the Phase 14-04/07 templates (aráceas / Pacífico tropical / Himalayas) but each entry got a distinct mechanism citation — anthurium specializes on pollinator-attracting spathes, fitonia on understory vein-reflection, maranta on nyctinasty pulvini, croton vs begonia-rex on anthocyanins-vs-carotenoids. No two rationales copy each other.
- **Pre-write voseo sweep:** Ran the banned-form regex against drafts BEFORE editing files (vs Phase 14-04 which caught "mueve sus hojas" mid-authoring and Phase 14-06 which caught "se riega al pie"). Zero post-hoc rewordings needed in this plan — discipline is compounding.
- **Char-limit-from-draft (Phase 14-06/07 lesson):** All ES whyRationale drafts targeted ≤200 chars. Max landed at 198 (ficus-lyrata). No trim pass required (vs Phase 14-04 which had 13/15 entries over ceiling and required trimming).
- **begonia-rex naming:** Kept `name: "Begonia rex"` (cultivar series, no Spanish vernacular widely accepted); EN copy uses "Rex Begonia" (standard horticultural form).
- **costilla-adan disambiguation:** whyRationale explicitly contrasts with Monstera deliciosa ("distinta de la Monstera deliciosa") to prevent user confusion since Monstera entry already exists in catalog.

## Deviations from Plan

None — plan executed exactly as written. All 12 entries authored verbatim from the `<entries>` spec block, all field names and shapes match the PlantDBEntry interface, all acceptance criteria met on first verify pass.

**Total deviations:** 0
**Impact on plan:** Plan was correctly self-contained; rails (TS interface, i18n validator, smoke runner, voseo regex) from Phase 14 + Plan 15-00 absorbed all the discipline.

## Issues Encountered

None — verification passed clean on first run for both tasks. No TypeScript errors, no i18n key gaps, no voseo regressions, no JSON syntax errors, no missing fields.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 15-02 (Wave 2 sub-batch B) is unblocked.** It will append the remaining 11 ids (zamioculca, cola-burro, hiedra, palmera-areca, palmera-kentia, helecho-boston, helecho-nido, pilea, tradescantia, cheflera, arbol-dinero, plus pachira/scheflera depending on final taxonomy) to bring catalog to 87 and close CAT-09 count assertion.
- **Voseo baseline remains at 2.** Plan 15-02 author should mirror the pre-write regex sweep discipline (zero rewordings needed here proves it's repeatable).
- **Smoke runner is exit-0 healthy at PASS 34/81.** Plan 15-02 should flip another ~22 SKIPs (11 ids + 11 keysets), bringing PASS to ~56/81 — and CAT-09 count assertion (currently sole SKIP at 76) flips to PASS at 87.
- **No carry-forward concerns.** No deferred items, no broken stubs, no pending refactors.

## Self-Check: PASSED

- `[ -f src/data/plantDatabase.ts ]` → FOUND
- `[ -f src/i18n/locales/es/plants.json ]` → FOUND
- `[ -f src/i18n/locales/en/plants.json ]` → FOUND
- `git log --oneline | grep fb70ed0` → FOUND (Task 1 feat commit)
- `git log --oneline | grep eec6d17` → FOUND (Task 2 feat commit)
- `grep -cE "^\s{4}id:\s*['\"]" src/data/plantDatabase.ts` → 76 (matches expected 64 + 12)
- `npm run check:i18n-keys` → PASS — 76 catalog ids verified
- `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json` → 2 (baseline preserved)
- `npx tsc --noEmit` → exit 0
- `node scripts/phase15-smoke.cjs` → PASS 34/81, exit 0

---
*Phase: 15-catalog-wave-a-interior-tropicals*
*Completed: 2026-05-07*
