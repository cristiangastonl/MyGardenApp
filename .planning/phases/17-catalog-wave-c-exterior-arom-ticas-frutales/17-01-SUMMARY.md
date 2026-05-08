---
phase: 17-catalog-wave-c-exterior-arom-ticas-frutales
plan: 01
subsystem: catalog-content
tags: [plant-database, i18n, voseo, edu-schema, sub-batch-A, exterior-flores, CAT-17, CAT-20-partial, bulb-dormancy, ericaceous, magnoliaceae, char-limit-from-draft]

# Dependency graph
requires:
  - phase: 17-catalog-wave-c-exterior-arom-ticas-frutales
    provides: 17-00 Wave 0 smoke runner scaffold with CAT-17/18/19/20/21 SKIP placeholders + final CAT-21 idMatches===118 gate; PHASE_17_LANDED_FLAGS partial-landing window; PHASE_17_SCIENTIFIC_NAMES species-qualified array
  - phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending
    provides: Phase 16 Sub-batch A authoring template (entry shape + careAction structure + voseo discipline + char-limit-from-draft pattern); exact-match-first findPlantInDatabase refactor inherited as routing-fix regression sentinel; phase16-smoke.cjs regression baseline (now updated to >=104 floor for forward growth)
  - phase: 14-educational-detail-modal
    provides: PlantDBEntry EDU schema (5 educational fields — careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale); check-i18n-keys validator covers EDU sub-fields conditionally
provides:
  - 8 PlantDBEntry objects appended to PLANT_DATABASE (104 → 112): tulipan, ciclamen, crisantemo, azalea, clavel, fucsia, girasol, magnolia
  - 8 i18n entry blocks added to BOTH en/plants.json and es/plants.json (104 → 112 keys per locale; 160 net-new strings)
  - CAT-17 fully closed (8/8 exterior flores landed)
  - CAT-20 partially closed (8/14 i18n keysets + 8/14 IDENT scientificName co-occurrence + 8/14 ROUTING-FIX exact-match resolution via Phase 16 inherited refactor)
  - Bulb/dormancy copy lock applied to tulipan + ciclamen + crisantemo (waterMode soil_check + careAction.soilCheck + dormancy citation in tip + description + careAction + whyRationale)
  - Tree-realism framing applied to magnolia (description leads with size trajectory; placementRecommended cites 50+ litros pot bridge to ground transplant)
  - Ericaceous acidic-soil lexicon applied to azalea (placementAvoid + description + tip + whyRationale all cite pH 4.5-5.5 + soft-water requirement) — cross-references arandano lexicon ready for Plan 17-02
  - Tulipan vernalization explicit: ~12 weeks <8°C cold + Argentine regional reality (BsAs sur/Patagonia natural vs NEA-NOA heladera pre-frío)
  - phase16-smoke.cjs CAT-counts.total assertion bumped from `=== 104` to `>= 104` (Phase 16 floor) — same Rule 3 deviation pattern as Phase 16 applied to phase15-smoke.cjs
affects: [17-02, 17-03, 17-04, future-catalog-phases, v1.2-milestone-end-image-upload-batch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sub-typology grouping with comment dividers in PLANT_DATABASE — bulb/dormancy → ericaceous/caryophyllaceae/onagraceae → annual+tree (3 groups, 8 entries) keeps related families adjacent for whyRationale lexicon sharing"
    - "Char-limit-from-draft + voseo-pre-sweep zero-trim pattern carried forward from Phase 15/16 — all 16 whyRationale strings (8 ES + 8 EN) drafted ≤250 chars from start; max ES=243 (tulipan), max EN=243 (tulipan)"
    - "Bulb/dormancy waterMode discipline: tulipan/ciclamen/crisantemo + azalea use careAction.soilCheck (NOT .fixed); touch-test discipline lets users water less during dormancy or pH-sensitive periods without rigid schedule fighting them"
    - "Tree-realism framing for magnolia: description LEADS with size trajectory + 50+ litros pot bridge in placementRecommended + ~95M-year primitive-flowering lineage in whyRationale (NOT 'perfecto para balcón')"
    - "Ericaceous acidic-soil lexicon shared across azalea + arandano (Plan 17-02) — pH 4.5-5.5 + soft-water + obligate mycorrhizae cited in tip + placementAvoid + whyRationale"
    - "Sub-typology citation matrix — zero copy-paste rationales across the 8 entries; each whyRationale cites distinct family lexicon (Liliácea/Primulácea/Asterácea/Ericácea/Cariofilácea/Onagrácea/Magnoliácea) + specific physiological mechanism (vernalización/cormo/heliotropismo/micorrizas/tricomas/sotobosque/primitive-flowering)"

key-files:
  created: []
  modified:
    - "src/data/plantDatabase.ts (+295 LOC, 104 → 112 entries; appended after Phase 16 cactus-san-pedro before closing `];`)"
    - "src/i18n/locales/en/plants.json (+154 LOC, 104 → 112 top-level keys)"
    - "src/i18n/locales/es/plants.json (+154 LOC, 104 → 112 top-level keys; voseo throughout)"
    - "scripts/phase16-smoke.cjs (+2 / -2 LOC; CAT-counts.total assertion bumped from `=== 104` to `>= 104` for forward-compat — Rule 3 deviation)"

key-decisions:
  - "ciclamen category locked to 'interior' (LATAM indoor-pot mental model from CONTEXT.md) — only Plan 17-01 entry deviating from exterior category despite phase name; matches user expectation as winter-flowering windowsill pot plant"
  - "magnolia variant locked to Magnolia stellata (Q4 default — RHS small-garden recommendation, 3m dwarf form); Magnolia grandiflora 20m mentioned in description as larger variant for context, will become legacy alias in Plan 17-03 COMMON_NAMES_ES"
  - "Bulb/dormancy + ericaceous → soil_check waterMode (4 of 8 entries: tulipan/ciclamen/crisantemo/azalea); Mediterranean drought-tolerant + annual + tree → fixed (4 of 8: clavel/fucsia/girasol/magnolia). Pattern: pH-sensitive or dormancy-cycling species use touch-test discipline; predictable schedule species use fixed cadence"
  - "Phase 16 smoke runner CAT-counts.total assertion changed from `=== 104` to `>= 104` (Phase 16 floor) — Rule 3 deviation. Frozen-phase smoke runners with growable-quantity assertions need >= floor to handle natural forward catalog growth. Same pattern as Phase 16 applied to phase15-smoke.cjs (`=== 87` → `>= 87`)."
  - "PHASE_17_LANDED_FLAGS partial-landing tolerance verified working — runner stays exit-0 across mid-band (idMatches=112, between 104 baseline and 118 final); CAT-counts.total stays SKIP correctly until Plan 17-02 lands the final 6 entries"

patterns-established:
  - "Pattern 1: Sub-typology grouping with comment dividers in PLANT_DATABASE batch appends — keeps shared whyRationale lexicon adjacent for review; comment headers reference family lexicon (Liliaceae bulbo + Primulaceae cormo + Asteraceae perennial corona) for self-documenting structure"
  - "Pattern 2: Forward-compatible smoke runner count assertions — when a frozen-phase smoke runner's CAT-counts.total assertion uses `=== N` and a future phase grows the catalog beyond N, switch to `>= N` floor semantics in the same commit as the catalog growth. Rule 3 deviation when discovered, but predictable: every time a phase lands new catalog entries, the previous phase's smoke runner CAT-counts gate needs the >= bump."
  - "Pattern 3: LATAM mental-model overrides botanical-purity for category assignment — ciclamen is a Primulaceae temperate-cool-flowering species, but in LATAM it's universally sold and used as a winter-blooming indoor pot plant. category='interior' + outdoor=false reflects user expectation, not strict botany. Pattern: when LATAM cultural usage diverges from botanical reality, encode the LATAM usage and document the reasoning in description."
  - "Pattern 4: Tree-class realism framing for compact-pot-friendly tree species (magnolia + olivo upcoming in Plan 17-02) — description LEADS with size trajectory (`magnolia es un árbol; M. stellata es la versión enana 3m, ideal patio chico`) + placementRecommended mentions pot-size + eventual ground transplant + whyRationale cites tree biology AND realism. Avoids the apartment-friendly-tree apartment-trap framing."

requirements-completed: [CAT-17]

# Metrics
duration: 8min
completed: 2026-05-08
---

# Phase 17 Plan 01: Sub-batch A — Exterior Flores (CAT-17 Closure) Summary

**8 exterior-flores PlantDBEntry objects + 16 i18n entry blocks (8 ES voseo + 8 EN) appended for CAT-17 closure (PLANT_DATABASE 104 → 112; mid-band SKIP); bulb/dormancy soil_check discipline + ericaceous acidic-soil lexicon + tree-realism framing all locked per 17-RESEARCH Pitfalls 3/5/7/8.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-08T15:55:20Z
- **Completed:** 2026-05-08T16:03:15Z
- **Tasks:** 2
- **Files modified:** 4 (3 source + 1 cross-phase smoke-runner Rule 3 deviation)

## Accomplishments

- 8 exterior-flores PlantDBEntry objects appended to PLANT_DATABASE: tulipan / ciclamen / crisantemo (bulb/dormancy soil_check) + azalea / clavel / fucsia (ericaceous + caryophyllaceae + onagraceae shrubs) + girasol / magnolia (annual + tree) — sub-typology grouped with comment dividers
- All 8 entries declare full 10-field schema: 5 legacy (name/scientificName/icon/imageUrl/category/waterDays/sunHours/tempMin/tempMax/humidity/outdoor/tip/description/problems/nutrients) + 5 EDU (careAction.{fixed|soilCheck} / placementRecommended / placementAlternatives / placementAvoid / whyRationale)
- 8 i18n entry blocks authored in BOTH en/plants.json and es/plants.json (104 → 112 keys per locale); ES uses voseo (regá/sacá/movela/pellizcá/cosechá/cubrí/protegé/acolchá); EN uses natural English (NOT literal translation)
- POWO 2024 canonical scientificNames verified: Rhododendron simsii / Cyclamen persicum / Fuchsia magellanica / Dianthus caryophyllus / Chrysanthemum × morifolium / Tulipa gesneriana / Helianthus annuus / Magnolia stellata
- ciclamen outdoor:false + category:'interior' (LATAM indoor-pot lock from CONTEXT.md); the other 7 outdoor:true + category:'exterior'
- Bulb/dormancy + pH-sensitive ericaceous → soil_check (4 entries: tulipan/ciclamen/crisantemo/azalea); Mediterranean/annual/tree → fixed (4 entries: clavel/fucsia/girasol/magnolia)
- All 16 whyRationale strings (8 ES + 8 EN) ≤250 chars from draft (max ES=243, max EN=243; both tulipan); zero post-hoc trims required
- Voseo regression preserved: plantDatabase.ts catalog-defaults regex count stays at 0; es/plants.json regex count stays at baseline 2
- 8 W1.CAT-17.* PASS + 8 W2.CAT-20.*.keyset PASS + 8 IDENT.CAT-20.* PASS + 8 W2.ROUTING-FIX.* PASS (via Phase 16 exact-match-first refactor inherited unchanged); CAT-counts.total stays SKIP at mid-band 112
- Cross-phase regression clean: phase15-smoke (PASS 81/81), phase16-smoke (PASS 69/69), phase16-smoke --routing-fix (PASS 92/92)

## Task Commits

Each task was committed atomically:

1. **Task 1: Append 8 exterior-flores PlantDBEntry objects to plantDatabase.ts (Sub-batch A — CAT-17 closure)** — `d05a5c6` (feat)
2. **Task 2: Author 8 i18n entry blocks in en/plants.json + es/plants.json (parallel keysets, ES voseo)** — `4efef0b` (feat)

## Smoke Runner Deltas

| Smoke runner mode | Before Plan 17-01 | After Plan 17-01 | Delta |
|-------------------|-------------------|------------------|-------|
| `phase17-smoke.cjs` (default) | PASS 10/54 | PASS 26/54 | +16 SKIP→PASS (8 W1.CAT-17 + 8 W2.CAT-20.keyset) |
| `phase17-smoke.cjs --identification` | PASS 10/68 | PASS 34/68 | +24 SKIP→PASS (16 from default + 8 IDENT.CAT-20) |
| `phase17-smoke.cjs --routing-fix` | PASS 10/68 | PASS 34/68 | +24 SKIP→PASS (16 from default + 8 W2.ROUTING-FIX) |
| `phase15-smoke.cjs` | PASS 81/81 | PASS 81/81 | unchanged (cross-phase regression clean) |
| `phase16-smoke.cjs` | FAIL 68/69 | PASS 69/69 | Rule 3 deviation `=== 104` → `>= 104` floor |
| `phase16-smoke.cjs --routing-fix` | FAIL 91/92 | PASS 92/92 | Same fix |

## Char-Limit Verification (whyRationale ≤250 chars)

ES whyRationale lengths:
- azalea: 198 / ciclamen: 221 / fucsia: 199 / clavel: 205 / crisantemo: 223 / **tulipan: 243** / girasol: 202 / magnolia: 206

EN whyRationale lengths:
- azalea: 188 / ciclamen: 207 / fucsia: 192 / clavel: 211 / crisantemo: 210 / **tulipan: 243** / girasol: 198 / magnolia: 208

All 16 strings under 250-char ceiling; max margin = 7 chars (tulipan in both locales). Comfortable margin for future minor edits without char-budget pressure. Zero post-hoc trims required (carried forward from Phase 15/16 char-limit-from-draft discipline).

## Sub-Typology Citation Matrix

Zero copy-paste whyRationale rationales across the 8 entries:

| id | Family lexicon | Specific mechanism | Argentine context |
|----|----------------|--------------------|--------------------|
| tulipan | Liliácea | Vernalización ~12sem <8°C | BsAs sur/Patagonia natural vs NEA-NOA heladera |
| ciclamen | Primulácea | Cormo subterráneo + dormancia estival mediterránea | LATAM indoor-pot context (no garden in BsAs) |
| crisantemo | Asterácea perenne | Corona invernante + capítulos compuestos + fotoperiodo otoñal | Día de la Madre HS reference |
| azalea | Ericácea | Micorrizas obligadas pH 4.5-5.5 + agua blanda | Sotobosque chino vs sol pleno mediodía argentino |
| clavel | Cariofilácea mediterránea | Tallos articulados + tricomas grises reducen evaporación | Defensa contra sequía estival |
| fucsia | Onagrácea | Bosque-húmedo patagónico + heladas leves toleradas | Nativa argentina (Patagonia sotobosque) |
| girasol | Asterácea anual día largo | Capítulo composite + heliotropismo juvenil | Pampa Húmeda ideal niche |
| magnolia | Magnoliácea | Linaje arcaico ~95M años + primitive-flowering anteriores a abejas | M. stellata 3m enana vs M. grandiflora 20m |

Each whyRationale hits ≥2 of: family lexicon + specific physiological mechanism + Argentine-context note.

## Pitfall Lock Verification (per 17-RESEARCH §Common Pitfalls)

- **Pitfall 3 (bulb-dormancy waterMode):** ✅ tulipan/ciclamen/crisantemo all use careAction.soilCheck (NOT .fixed); azalea also uses soilCheck (Pitfall 7 ericaceous lock). Verified per-entry in both plantDatabase.ts and plants.json.
- **Pitfall 5 (magnolia compact-pot misframing):** ✅ description leads with `Magnolia es un árbol... la versión enana 3m... primero maceta grande, eventualmente trasplante a tierra`. placementRecommended explicitly mentions `Maceta de 50+ litros como puente, eventual trasplante a tierra firme`. whyRationale cites `Pot temporario; tierra eventualidad`.
- **Pitfall 7 (azalea ericaceous acidic-soil hint):** ✅ tip cites `agua de lluvia o filtrada — el agua dura alcaliniza y mata la simbiosis con micorrizas`. description cites `tierra ácida pH 4.5-5.5 y agua blanda... clorosis ferrítica y muere`. placementAvoid cites `tierra alcalina + agua dura — la combinación quema hojas y mata las micorrizas obligadas`. whyRationale cites `Ericácea con micorrizas obligadas — su raíz necesita pH 4.5-5.5 y agua blanda`.
- **Pitfall 8 (tulipan vernalization):** ✅ tip cites `Si tu zona no enfría a 5°C en invierno, dale 6-8 semanas de heladera antes de plantar`. description cites `~12 semanas de frío bajo 8°C en invierno para desarrollar el botón floral. En BsAs sur y Patagonia florece naturalmente; en NEA-NOA hace falta pre-frío en heladera`. whyRationale cites `requiere ~12 semanas frío bajo 8°C... BsAs sur y Patagonia funciona natural; en NEA-NOA hace falta heladera pre-frío 6-8 semanas o no florece`.

## Files Created/Modified

- `src/data/plantDatabase.ts` (+295 LOC) — 8 PlantDBEntry objects appended after Phase 16 cactus-san-pedro before closing `];`; sub-typology comment dividers preserve readability
- `src/i18n/locales/en/plants.json` (+154 LOC) — 8 entry blocks added between cactus-san-pedro and humidity terminal-block
- `src/i18n/locales/es/plants.json` (+154 LOC) — 8 entry blocks added in same position; voseo throughout
- `scripts/phase16-smoke.cjs` (+2 / -2 LOC) — Rule 3 deviation: CAT-counts.total assertion `=== 104` → `>= 104`

## Decisions Made

- **ciclamen as 'interior' category + outdoor:false** — LATAM mental model lock from CONTEXT.md takes precedence over botanical/phase-name framing. Description explicitly notes `En LATAM se cultiva como pot interior de flor invernal-primaveral, no como planta de jardín` to make the choice transparent to users.
- **Magnolia stellata as canonical (Q4 default)** — RHS small-garden recommendation (3m dwarf form) chosen over M. grandiflora (20m iconic evergreen). M. grandiflora referenced in description as the iconic large variant; will be added as legacy alias in Plan 17-03 COMMON_NAMES_ES.
- **azalea uses soil_check (not fixed)** — Despite being a "shrub", azalea joins the bulb/dormancy + pH-sensitive ericaceous group at the discipline level. Touch-test discipline is the right primitive when watering quality (soft vs hard water) matters more than schedule cadence.
- **clavel/fucsia/girasol/magnolia use fixed** — Mediterranean drought-tolerant (clavel), seasonal patio routine (fucsia), warm-season annual (girasol), mature tree (magnolia) all benefit from predictable schedule cadence over touch-test.
- **Sub-typology comment dividers in plantDatabase.ts** — 3 dividers (`Bulb/dormancy` + `Ericaceous + Caryophyllaceae + Onagraceae shrubs` + `Annual + tree`) make the family-lexicon grouping self-documenting for future reviewers.
- **Phase 16 smoke runner CAT-counts.total bumped to >= floor** — Rule 3 deviation discovered when phase16-smoke FAILed at idMatches=112 (was hardcoded `=== 104`). Same pattern as Phase 16's fix to phase15-smoke (`=== 87` → `>= 87`). Bumped in same commit as Task 1 catalog growth so cross-phase regression stays green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bumped phase16-smoke.cjs CAT-counts.total assertion from `=== 104` to `>= 104` floor**
- **Found during:** Task 1 (after appending 8 entries; pre-commit cross-phase regression check)
- **Issue:** phase16-smoke.cjs hardcoded `idMatches === 104` exact-match assertion at line 205. After Task 1 grew catalog to 112 entries, phase16-smoke FAILed (`exit code 1`, `FAIL 68/69`), blocking commit. Same root cause as Phase 16's Rule 3 deviation on phase15-smoke (which had `=== 87` exact-match that needed bumping to `>= 87` after Phase 16 grew the catalog to 104).
- **Fix:** Changed `return idMatches === 104` to `return idMatches >= 104` (Phase 16 floor). Updated assertion message from `exactly 104` to `at least 104 (Phase 16 floor)`. The mid-band SKIP gate (`idMatches > 87 && < 104`) preserved unchanged — only the final assertion semantics shifted from exact-match to floor.
- **Files modified:** `scripts/phase16-smoke.cjs`
- **Verification:** `node scripts/phase16-smoke.cjs` exits 0 (PASS 69/69); `node scripts/phase16-smoke.cjs --routing-fix` exits 0 (PASS 92/92). All Phase 16 assertions still fire correctly within their phase scope; only the absolute-equality regression on forward catalog growth was relaxed.
- **Committed in:** `d05a5c6` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking smoke-runner regression on forward catalog growth)
**Impact on plan:** No scope creep. The fix is the predictable cross-phase pattern documented in Phase 16 SUMMARY (`> = floor` semantics for frozen-phase smoke runners). The Phase 17 SUMMARY now documents the pattern as `Pattern 2` so future phases (17-02 will trigger the same fix again on this same runner unless we proactively bump now to `>= 118` after Plan 17-02 lands).

## Issues Encountered

None — both tasks landed cleanly first-try modulo the predictable cross-phase regression fix. No JSON parse errors, no tsc errors, no voseo regressions, no char-limit overflows. Char-limit-from-draft + voseo-pre-sweep discipline carried forward from Phase 15/16 continues to compound.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 17-02 unblocked to land remaining 6 entries (CAT-18 + CAT-19): salvia-officinalis, eneldo, stevia (3 aromáticas) + olivo, arandano, espinaca (3 frutales/huerta). Catalog will go 112 → 118; CAT-21 final assertion `idMatches === 118` flips SKIP→PASS, simultaneously closing CAT-21 AND the entire v1.2 catalog expansion.
- arandano in Plan 17-02 will share azalea's ericaceous acidic-soil lexicon (pH 4.5-5.5 + soft water + obligate mycorrhizae) — already locked here for cross-reference.
- olivo in Plan 17-02 will share magnolia's tree-realism framing (description LEADS with size trajectory + pot-bridge in placementRecommended) — already locked here for cross-reference.
- salvia-officinalis in Plan 17-02 will use distinct top-level i18n namespace from existing salvia-ornamental (Phase 16 sansevieria/sansevieria-cilindrica precedent applies) — Plan 17-00 W3 sentinel already verified.
- Plans 17-03 (COMMON_NAMES_ES) + 17-04 (CLAUDE.md image-plan) parallelize after Plan 17-02 closes the catalog count.
- Image upload backlog grows by 8 entries (cumulative v1.2 backlog will reach 63 after Plan 17-04: 15 v1.1 + 23 Phase 15 + 17 Phase 16 + 8 from Plan 17-01); milestone-end batch upload pattern preserved.

## Self-Check: PASSED

All claimed files exist:
- `src/data/plantDatabase.ts` — FOUND (3725 LOC → 4020 LOC; 8 new entries with full 10-field schema)
- `src/i18n/locales/en/plants.json` — FOUND (3114 LOC → 3268 LOC; 8 new entry blocks)
- `src/i18n/locales/es/plants.json` — FOUND (3114 LOC → 3268 LOC; 8 new entry blocks)
- `scripts/phase16-smoke.cjs` — FOUND (Rule 3 deviation `=== 104` → `>= 104`)

All claimed commits exist:
- `d05a5c6` (Task 1: feat — 8 PlantDBEntry objects to plantDatabase.ts + phase16-smoke.cjs Rule 3 deviation) — FOUND in `git log`
- `4efef0b` (Task 2: feat — 8 i18n entry blocks in en + es plants.json) — FOUND in `git log`

All claimed assertions verified:
- PLANT_DATABASE.length === 112 (104 → 112): ✅
- 8 scientificNames per POWO 2024: ✅
- npm run check:i18n-keys exits 0 (112 catalog ids verified): ✅
- npx tsc --noEmit clean: ✅
- Voseo grep on plantDatabase.ts = 0 (baseline 0 preserved): ✅
- Voseo grep on es/plants.json = 2 (baseline 2 preserved): ✅
- All 16 whyRationale strings ≤250 chars (max ES=243, max EN=243): ✅
- ciclamen outdoor:false + category:'interior' (LATAM lock): ✅
- 7 other entries outdoor:true + category:'exterior': ✅
- Bulb/dormancy careAction.soilCheck (tulipan/ciclamen/crisantemo): ✅
- azalea careAction.soilCheck (Pitfall 7 ericaceous lock): ✅
- clavel/fucsia/girasol/magnolia careAction.fixed: ✅
- 0 existing entries modified (git diff ADDS only): ✅
- phase17-smoke 26/54 default + 34/68 --identification + 34/68 --routing-fix: ✅
- phase15-smoke 81/81 + phase16-smoke 69/69 + phase16-smoke --routing-fix 92/92 (cross-phase clean): ✅

---
*Phase: 17-catalog-wave-c-exterior-arom-ticas-frutales*
*Completed: 2026-05-08*
