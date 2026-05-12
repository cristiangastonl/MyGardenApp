---
phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending
plan: 02
subsystem: catalog
tags: [plant-database, i18n, voseo, edu-fields, powo-2024, trepadoras, trending, content-authoring]

# Dependency graph
requires:
  - phase: 16-00
    provides: Phase 16 smoke runner with mid-band SKIP gates (87..104) + findPlantInDatabase exact-match-first refactor
  - phase: 16-01
    provides: Sub-batch A 10-entry append (cactus/suculentas) — catalog at 97
  - phase: 14
    provides: PlantDBEntry shape with 5 EDU fields (CareAction, placementRecommended/Alternatives/Avoid, whyRationale); potus + filodendro EDU baseline
  - phase: 15
    provides: Voseo discipline (≤2 baseline), char-limit-from-draft pattern, sub-typology citation matrix discipline, COMMON_NAMES_ES routing pattern
provides:
  - "7 NEW catalog entries (hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro) with full 10-field schema"
  - "PLANT_DATABASE.length: 97 → 104 (Phase 16 final target hit)"
  - "Parallel i18n keysets in EN + ES plants.json (10 sub-keys per entry per locale)"
  - "Sub-typology citation matrix expanded: Asclepiadácea CAM-corazón / Aroide heteroblastia / Strelitziacea paddle / Mirtácea citronellal / Asparagácea hidropónica / Asparagácea cilíndrica CAM / Cactácea columnar Andes"
  - "POWO 2024 canonical scientific names (Echinopsis pachanoi, Dracaena angolensis verified)"
  - "sansevieria-cilindrica namespace lock: distinct top-level key from existing sansevieria"
  - "cactus-san-pedro horticultural-only framing (zero ceremonial/psychoactive references in either locale)"
  - "bambu-suerte water-culture variant documented in description"
  - "CAT-13/14/15 fully closed; CAT-16 keysets + identification routing PASS"
affects: [16-03, 16-04, 17, 24-DOCS]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "POWO 2024 canonical names used at-source (Dracaena angolensis, Echinopsis pachanoi) with 'trade still uses' historical-name acknowledgment in description"
    - "Horticultural-only framing for plants with cultural/ceremonial associations (cactus-san-pedro pattern; reusable in future ethnobotanical entries)"
    - "Distinct top-level i18n key namespace for cultivar/species splits (sansevieria-cilindrica vs sansevieria) — never nest under shared parent"
    - "Water-culture variants documented in description without changing waterMode (bambu-suerte: fixed waterMode + water-culture context)"

key-files:
  created: []
  modified:
    - "src/data/plantDatabase.ts (97 → 104 entries; +255 lines)"
    - "src/i18n/locales/es/plants.json (97 → 104 top-level keys; +140 lines, voseo)"
    - "src/i18n/locales/en/plants.json (97 → 104 top-level keys; +140 lines)"

key-decisions:
  - "Phase 16 Plan 02: 7 NEW entries hoya/mini-monstera/strelitzia/eucalipto/bambu-suerte/sansevieria-cilindrica/cactus-san-pedro authored against the SHAPE used by Phase 14/15/Plan 16-01 (10 fields, voseo, char-limit ≤250). potus + filodendro untouched (CAT-14 Option A baseline preserved as regression sentinels via Phase 16 smoke runner)."
  - "POWO 2024 canonical names cited at-source: Echinopsis pachanoi (was Trichocereus pachanoi); Dracaena angolensis (was Sansevieria cylindrica, POWO 2018). Description text acknowledges trade-name persistence to avoid user confusion when buyers see legacy names."
  - "cactus-san-pedro framed PURELY as horticulture per CONTEXT.md lock — 0 ceremonial/psychoactive/sagrad/ritual references in description, tip, or whyRationale of either locale. Verified by grep gate."
  - "sansevieria-cilindrica i18n key uses distinct top-level namespace from sansevieria (no nesting under shared parent) per CONTEXT.md lock — confirmed by node parse showing both names coexist."
  - "bambu-suerte: waterMode 'fixed' but description/tip/careAction.fixed all explicitly mention water-culture variant (cultivo hidropónico). Aligns CONTEXT.md water-culture framing with predictable schedule semantics."
  - "mini-monstera description explicitly clarifies it is NOT a true Monstera and NOT 'Monstera minima' — addresses the most common nursery mis-labeling per RESEARCH §Pattern 2."
  - "strelitzia compact (~1-1.5m) form chosen over giant S. nicolai per CONTEXT.md lock; description names both species to prevent mis-identification at point of sale."
  - "eucalipto = Eucalyptus citriodora (lemon-scented citronellal aromatic) chosen over E. globulus per RESEARCH recommendation — better fit for the 'aromaticas' category and home-pot scale."
  - "All 7 whyRationale rationales DISTINCT (no copy-paste); each cites a per-entry physiology mechanism: heart-shaped CAM tissue / heteroblastia fenestrations / savanna paddle-leaves / volatile citronellal defense / riparian fluoride-sensitivity / cylindrical-tubular CAM / Andean foothills columnar growth."

patterns-established:
  - "Pattern: POWO-2024 reclassification at-source — when a genus is reclassified, use the canonical Latin name in scientificName + cite the reclassification + acknowledged trade-name persistence in description. Reusable for future taxonomic-drift entries."
  - "Pattern: Horticultural-only framing gate — for plants with cultural/ceremonial associations, lock framing in CONTEXT.md AND in plan acceptance criteria, then verify via per-locale grep counter (==0). Pattern usable for any ethnobotanical entries."
  - "Pattern: Distinct-namespace i18n keys for species splits — sansevieria + sansevieria-cilindrica live as separate top-level keys, never nested. Verified by Node parse showing both names coexist; prevents key-shape collisions in getTranslatedPlant."
  - "Pattern: Water-culture variant documented in description without altering waterMode — keeps schedule predictable while flagging the alternative cultivation context in user-facing copy."

requirements-completed: [CAT-14, CAT-15, CAT-16]

# Metrics
duration: 32min
completed: 2026-05-08
---

# Phase 16 Plan 02: Sub-batch B (Trepadoras + Trending) Summary

**7 NEW catalog entries authored — hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro — closing CAT-13/14/15 at PLANT_DATABASE.length === 104 (Phase 16 final target).**

## Performance

- **Duration:** ~32 min
- **Started:** 2026-05-08T10:16:00Z
- **Completed:** 2026-05-08T10:48:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- 7 NEW PlantDBEntry objects appended to `src/data/plantDatabase.ts` with full 10-field schema (5 legacy + 5 EDU)
- 7 parallel i18n keyset blocks added to BOTH `src/i18n/locales/en/plants.json` and `src/i18n/locales/es/plants.json` (ES voseo, EN natural English)
- POWO 2024 canonical scientific names cited at-source for all 7: Hoya kerrii / Rhaphidophora tetrasperma / Strelitzia reginae / Eucalyptus citriodora / Dracaena sanderiana / Dracaena angolensis / Echinopsis pachanoi
- Catalog count flipped 97 → 104; CAT-counts.total Phase 16 mid-band SKIP→PASS at the locked target
- `cactus-san-pedro` framed PURELY as horticulture: 0 ceremonial/psychoactive references in either locale (description, tip, whyRationale all clean)
- `sansevieria-cilindrica` namespace distinct from `sansevieria` in BOTH plantDatabase.ts ids and plants.json top-level keys (no collision)
- `bambu-suerte` water-culture variant explicit in description + tip + careAction.fixed (waterMode 'fixed' preserved)
- `mini-monstera` description explicitly clarifies NOT a true Monstera and NOT 'Monstera minima' (nursery mis-labeling addressed)
- `potus` + `filodendro` UNTOUCHED (CAT-14 Option A baseline preserved — Phase 14-04 EDU lock, regression sentinels intact)
- All 7 whyRationale rationales DISTINCT, each citing per-entry physiology: Asclepiadácea CAM-corazón / Aroide heteroblastia / Strelitziacea paddle-leaves / Mirtácea citronellal / Asparagácea hidropónica-flúor / Asparagácea cilíndrica-CAM / Cactácea columnar Andes-precordillera (zero copy-paste rationales)

## Task Commits

Each task was committed atomically:

1. **Task 1: Append 7 NEW PlantDBEntry objects to PLANT_DATABASE** — `d1b2047` (feat)
2. **Task 2: Author 7 i18n entry blocks in EN + ES plants.json (parallel keysets)** — `8a0be5b` (feat)

**Plan metadata:** _to be created in final commit (this SUMMARY.md + STATE.md + ROADMAP.md)_

## Files Created/Modified

- `src/data/plantDatabase.ts` — +255 lines; 7 NEW entries (hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro) appended after Plan 16-01's `agave` block; total entries 97 → 104
- `src/i18n/locales/es/plants.json` — +140 lines; 7 NEW top-level keys with voseo (regá, sacá, podés, querés, movela, tocá), 10 sub-keys each, voseo regex baseline preserved at 2
- `src/i18n/locales/en/plants.json` — +140 lines; 7 NEW top-level keys with natural English (NOT literal translation), 10 sub-keys each

## Catalog Count Progression

| Stage                          | Count | Notes                                                            |
| ------------------------------ | ----- | ---------------------------------------------------------------- |
| Phase 14 closure (Plan 14-07)  | 64    | Full EDU coverage                                                |
| Phase 15 closure (Plan 15-04)  | 87    | +23 interior tropicals                                           |
| Phase 16 Plan 16-01 closure    | 97    | +10 cactus/suculentas (Sub-batch A)                              |
| Phase 16 Plan 16-02 closure    | **104** | **+7 trepadoras/trending (Sub-batch B) — Phase 16 final target** |

## Decisions Made

- **POWO 2024 canonical naming at-source.** Echinopsis pachanoi (was Trichocereus pachanoi) and Dracaena angolensis (was Sansevieria cylindrica) cited per POWO with explicit reclassification text in description and acknowledgment that the trade still uses legacy names. Avoids user confusion at point of sale when nurseries label by old name.
- **Horticultural-only framing for cactus-san-pedro.** Zero ceremonial/psychoactive references per CONTEXT.md lock. Verified at commit time via per-locale grep counter (`grep -ciE "(ceremonial|psychoactive|sagrad|ritual|ancestral|spiritual)"` = 0 in both ES and EN). Description focuses purely on columnar cactus care: fast vertical growth, full sun, drainage discipline, frost tolerance.
- **Distinct-namespace i18n keys for sansevieria-cilindrica vs sansevieria.** Top-level keys live side-by-side in plants.json, not nested. Confirmed by node parse showing both names coexist (`Sansevieria` + `Sansevieria cilíndrica`). Prevents key-shape collisions in getTranslatedPlant runtime lookup.
- **Water-culture variant in bambu-suerte without changing waterMode.** waterMode 'fixed' preserves predictable schedule semantics; description/tip/careAction.fixed all flag the water-culture cultivation context (cultivo hidropónico, agua filtrada, cambio cada 10-14 días). User gets correct guidance whether they're growing in soil or water without forking the schedule logic.
- **strelitzia compact form (S. reginae ~1-1.5m) NOT giant nicolai.** CONTEXT.md lock; description names both species to prevent mis-identification ("NO confundir con la giant S. nicolai (2-3m, flores blancas — especie distinta)"). Apt for indoor-pot scale.
- **eucalipto = Eucalyptus citriodora (lemon-aromatic).** Chosen over E. globulus per RESEARCH recommendation: better fit for 'aromaticas' category, citronellal volatile is the user-recognizable trait, and the description includes the POWO synonym Corymbia citriodora for taxonomic completeness.
- **Pre-emptive voseo + char-limit discipline.** All ES drafts written voseo-first; all 14 whyRationale strings (7 ES + 7 EN) drafted ≤250 chars from the start. Result: zero post-hoc rewrites, zero voseo regression false-positives, ES voseo regex baseline preserved at 2 (Phase 15 lock).

## Deviations from Plan

None — plan executed exactly as written. All 7 entries authored against the locked specifications in `<entries>` block; all acceptance criteria PASS first-pass; no auto-fix rules triggered (no blocking issues, no missing critical functionality, no architectural changes needed).

## Issues Encountered

None. The Plan 16-01 / Phase 14 / Phase 15 disciplines (voseo-first drafting, char-limit-from-draft, citation matrix anti-copy-paste, sub-typology lock per entry) all carried forward cleanly. The two PLAN.md regression checks (potus + filodendro EDU baseline; mid-band catalog count gate) both passed at Wave 0 baseline; insertion was a clean append before the closing `];` of `PLANT_DATABASE`.

## Sub-typology Citation Matrix (Sub-batch B)

| Entry                  | Family            | Mechanism citation                                            |
| ---------------------- | ----------------- | ------------------------------------------------------------- |
| hoya                   | Asclepiadácea     | hojas-corazón + tejido CAM modificado + crecimiento muy lento |
| mini-monstera          | Aroide            | hemiepífita trepadora + heteroblastia → fenestraciones       |
| strelitzia             | Strelitziacea     | savanna sudafricana + paddle-leaves + sunbird pollination     |
| eucalipto              | Mirtácea          | citronellal volátil (defensa anti-herbivoría) + crecimiento rápido |
| bambu-suerte           | Asparagácea       | zonas ribereñas africanas + cultivo hidropónico + flúor-sensitivity |
| sansevieria-cilindrica | Asparagácea       | hojas cilíndricas tubulares + CAM + sequía-tolerance extrema |
| cactus-san-pedro       | Cactácea          | Andes-precordillera columnar + CAM + crecimiento vertical >1cm/año |

Zero copy-paste rationales across the 7 entries. Each cites a unique physiological adaptation drawn from the entry's botanical record.

## whyRationale Char-Limit Margin

| Entry                  | ES  | EN  |
| ---------------------- | --- | --- |
| hoya                   | 203 | 198 |
| mini-monstera          | 223 | 224 |
| strelitzia             | 227 | 211 |
| eucalipto              | 216 | 189 |
| bambu-suerte           | 228 | 222 |
| sansevieria-cilindrica | 198 | 213 |
| cactus-san-pedro       | 206 | 193 |

**Max ES = 228 / Max EN = 224 — comfortable margin under the 250 ceiling. Zero trims required.**

## Smoke Runner Output

| Mode                                        | Before Plan 16-02 | After Plan 16-02 | Delta |
| ------------------------------------------- | ----------------- | ---------------- | ----- |
| `phase16-smoke.cjs` (default)               | PASS 34/69 + 35 SKIP, exit 0 | **PASS 49/69 + 20 SKIP, exit 0** | +15 PASS (7 entries × 2 gates + 1 count flip) |
| `phase16-smoke.cjs --identification`        | PASS 53/88 + 35 SKIP, exit 0 | **PASS 68/88 + 20 SKIP, exit 0** | +15 PASS |
| `phase16-smoke.cjs --routing-fix`           | PASS 57/92 + 35 SKIP, exit 0 | **PASS 72/92 + 20 SKIP, exit 0** | +15 PASS |
| `phase15-smoke.cjs`                         | exit 0            | exit 0           | no regression |
| `npm run check:i18n-keys`                   | 97 catalog ids    | **104 catalog ids verified** | +7 |
| `npx tsc --noEmit`                          | exit 0            | exit 0           | no regression |
| ES voseo regex baseline                     | 2                 | **2 (preserved)** | 0 |
| plantDatabase.ts voseo regex                | 0                 | **0 (preserved)** | 0 |

**Remaining 20 SKIPs after Plan 16-02:**
- 19 × W3.CAT-16.* (COMMON_NAMES_ES routing closure — Plan 16-03 will land 19 net-new mappings)
- 1 × W3.CAT-16.imagePlan (CLAUDE.md "Phase 16 Wave B" image-deferral block — Plan 16-04 will land documentation)

## Phase 16 Closure Status (after Plan 16-02)

- ✅ **CAT-13** (suculentas/cactus content): closed Plan 16-01
- ✅ **CAT-14** (trepadoras content + EDU): closed by this plan (hoya/mini-monstera new + potus/filodendro upgrade-baseline)
- ✅ **CAT-15** (trending content): closed by this plan (5 new entries: strelitzia/eucalipto/bambu-suerte/sansevieria-cilindrica/cactus-san-pedro)
- 🟡 **CAT-16** partial:
  - ✅ Keyset gates PASS for full 19-id Phase 16 coverage (verified via check:i18n-keys + smoke runner)
  - ✅ findPlantInDatabase routing PASS (verified via --identification + --routing-fix flags)
  - ⏳ COMMON_NAMES_ES extension — pending Plan 16-03 (19 net-new mappings)
  - ⏳ Image plan documentation — pending Plan 16-04 (CLAUDE.md "Phase 16 Wave B" image-deferral block)

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ✅ Plan 16-03 (COMMON_NAMES_ES routing closure) UNBLOCKED — 19 catalog ids stable, scientific names verified, ready for COMMON_NAMES_ES extension
- ✅ Plan 16-04 (image plan documentation) UNBLOCKED — 19 catalog ids stable, ready for CLAUDE.md "Phase 16 Wave B" image-deferral block
- ✅ ROADMAP success criterion #1 (length === 104) SATISFIED
- ✅ ROADMAP success criterion #4 (sansevieria-cilindrica distinct from sansevieria) VERIFIED via check:i18n-keys + grep
- ✅ ROADMAP success criterion #5 (routing-fix verified) VERIFIED via --routing-fix flag (PASS 72/92)
- 🟢 Phase 16 closure trajectory: 2 plans remaining (16-03 routing + 16-04 image-plan docs); both are short tactical plans

## Self-Check: PASSED

**Files created/modified — verified:**
- `src/data/plantDatabase.ts` — FOUND, 104 entries (idMatches === 104)
- `src/i18n/locales/es/plants.json` — FOUND, 104 catalog ids verified by check:i18n-keys
- `src/i18n/locales/en/plants.json` — FOUND, 104 catalog ids verified by check:i18n-keys

**Commits — verified:**
- `d1b2047` — FOUND in git log (Task 1: PLANT_DATABASE append)
- `8a0be5b` — FOUND in git log (Task 2: i18n keysets append)

**Smoke runner exit codes — verified:**
- `phase16-smoke.cjs` (default): exit 0
- `phase16-smoke.cjs --identification`: exit 0
- `phase16-smoke.cjs --routing-fix`: exit 0
- `phase15-smoke.cjs`: exit 0
- `npx tsc --noEmit`: exit 0
- `npm run check:i18n-keys`: exit 0

**Discipline regression checks — verified:**
- ES voseo regex: 2 (preserved)
- plantDatabase.ts voseo regex: 0 (preserved)
- cactus-san-pedro ceremonial/psychoactive references: 0 in plantDatabase.ts, 0 in es/plants.json, 0 in en/plants.json
- whyRationale char-limit max ES = 228, EN = 224 (≤250 ceiling)
- potus + filodendro untouched: `git diff d1b2047^..8a0be5b -- src/data/plantDatabase.ts | grep '^-' | grep -v '^---' | wc -l` = 0 deletions

---
*Phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending*
*Completed: 2026-05-08*
