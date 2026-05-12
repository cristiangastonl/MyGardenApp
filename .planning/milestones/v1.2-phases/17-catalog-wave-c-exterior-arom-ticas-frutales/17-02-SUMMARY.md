---
phase: 17-catalog-wave-c-exterior-arom-ticas-frutales
plan: 02
subsystem: catalog-content
tags: [plant-database, i18n, voseo, edu-schema, sub-batch-B, aromaticas, frutales, huerta, CAT-18, CAT-19, CAT-20-partial, CAT-21-final, ericaceous, oleaceae, amaranthaceae, salvia-disambiguation, char-limit-from-draft]

# Dependency graph
requires:
  - phase: 17-catalog-wave-c-exterior-arom-ticas-frutales
    provides: 17-00 Wave 0 smoke runner scaffold with CAT-17/18/19/20/21 SKIP placeholders + final CAT-21 idMatches===118 gate; 17-01 Sub-batch A 8 entries (104 → 112); azalea ericaceous lexicon + magnolia tree-realism framing for cross-reference
  - phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending
    provides: Phase 16 sansevieria/sansevieria-cilindrica distinct top-level i18n namespace precedent (applied verbatim to salvia-officinalis/salvia-ornamental); exact-match-first findPlantInDatabase refactor (inherited unchanged as routing-fix regression sentinel)
  - phase: 14-educational-detail-modal
    provides: PlantDBEntry EDU schema (5 educational fields — careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale); check-i18n-keys validator covers EDU sub-fields conditionally
provides:
  - 6 PlantDBEntry objects appended to PLANT_DATABASE (112 → 118 — closes CAT-21 + entire v1.2 catalog expansion): salvia-officinalis, eneldo, stevia (3 aromáticas — CAT-18) + olivo, arandano, espinaca (3 frutales/huerta — CAT-19)
  - 6 i18n entry blocks added to BOTH en/plants.json and es/plants.json (112 → 118 keys per locale; ~120 net-new strings)
  - CAT-18 fully closed (3/3 aromáticas landed)
  - CAT-19 fully closed (3/3 frutales/huerta landed)
  - CAT-20 keyset partial closed (14/14 i18n keysets verified — full closure pending Plans 17-03 + 17-04 routing + image plan)
  - CAT-21 fully closed — `PLANT_DATABASE.length === 118` final assertion satisfied; v1.2 catalog expansion content layer complete
  - salvia-officinalis distinct top-level i18n namespace from existing salvia-ornamental (Phase 16 sansevieria-cilindrica precedent applied) — verified via Node parse (sibling keys, no shared parent)
  - Ericaceous acidic-soil lexicon shared between azalea (Plan 17-01) and arandano (this plan) — pH 4.5-5.5 + agua blanda + micorrizas obligadas cited consistently in both
  - Tree-realism framing shared between magnolia (Plan 17-01) and olivo (this plan) — description LEADS with size trajectory; placementRecommended cites pot-bridge to ground transplant; whyRationale cites tree biology AND realism
  - Cool-season bolt risk locked in espinaca (Pitfall 4 — tempMax: 25, NOT 30; description + tip + placementAvoid + whyRationale all cite Argentine summer >25°C → 2-3 week bolt)
  - Aromáticas outdoor:false honored per CONTEXT lock (researcher discrepancy surfaced in Decisions Made — see below)
affects: [17-03, 17-04, future-catalog-phases, v1.2-milestone-end-image-upload-batch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sub-typology grouping with comment dividers in PLANT_DATABASE batch appends — 2 groups (Aromáticas Lamiaceae+Apiaceae+Asteraceae / Frutales+Huerta Oleaceae+Ericaceae+Amaranthaceae) keep family-lexicon adjacent for review"
    - "salvia-officinalis distinct top-level i18n namespace from salvia-ornamental — both keys coexist as siblings in plants.json, never nested under shared parent (Phase 16 sansevieria-cilindrica precedent applied verbatim to salvia split)"
    - "Ericaceous acidic-soil lexicon shared cross-plan — azalea (Plan 17-01) and arandano (this plan) both cite pH 4.5-5.5 + agua blanda + micorrizas obligadas; consistency drives user understanding without copy-paste"
    - "Tree-realism framing pattern carried forward — magnolia (Plan 17-01) and olivo (this plan) both LEAD description with honest size trajectory; placementRecommended cites pot-bridge to ground transplant; whyRationale cites tree biology"
    - "Char-limit-from-draft + voseo-pre-sweep zero-trim discipline preserved — all 12 whyRationale strings (6 ES + 6 EN) ≤250 chars from draft; max ES=212 (eneldo), max EN=217 (olivo); zero post-hoc trims"

key-files:
  created: []
  modified:
    - "src/data/plantDatabase.ts (+228 LOC, 112 → 118 entries; appended after Plan 17-01 magnolia entry before closing `];`)"
    - "src/i18n/locales/en/plants.json (+118 LOC, 112 → 118 top-level keys)"
    - "src/i18n/locales/es/plants.json (+122 LOC, 112 → 118 top-level keys; voseo throughout)"

key-decisions:
  - "Aromáticas outdoor:false honored per CONTEXT lock (Q1 default) — salvia-officinalis/eneldo/stevia all outdoor:false. Researcher flagged that the existing 6 aromáticas (albahaca/romero/menta/cilantro/perejil/ciboulette) all use outdoor:true, so CONTEXT lock deliberately diverges from the actual catalog precedent. Default honors CONTEXT lock; surfaced here for user awareness — user may flip to outdoor:true in a future micro-task to match real precedent if preferred."
  - "arandano category locked to 'frutales' (Q3 default — woody perennial like limonero, NOT annual like espinaca/frutilla which are 'huerta')."
  - "salvia-officinalis distinct top-level i18n namespace from salvia-ornamental — both keys coexist as siblings (sansevieria/sansevieria-cilindrica Phase 16 precedent). Verified via Node parse: salvia-officinalis ✓ + salvia-ornamental ✓ + shared salvia parent ✗ in BOTH locales."
  - "arandano uses waterMode soil_check (Pitfall 7 ericaceous lock) + careAction.soilCheck — pH-sensitive watering touch-test discipline. Cross-references azalea (Plan 17-01) lexicon. Other 5 entries (salvia-officinalis/eneldo/stevia/olivo/espinaca) use waterMode fixed — predictable schedule cadence appropriate for Mediterranean drought (salvia/olivo), kitchen-herb (eneldo/stevia), and cool-season cycle (espinaca)."
  - "espinaca tempMax: 25 (NOT 30 — Pitfall 4 bolt-flag). Argentine summer >25°C triggers premature flowering in 2-3 weeks. tempMax: 25 is the design-time signal for any future temperature-aware UI to surface the bolt-risk warning."
  - "olivo uses tree-realism framing (Pitfall 5 lock) — description LEADS with 'olivo joven en maceta grande puede vivir varios años antes de necesitar trasplante a tierra firme'; placementRecommended explicitly mentions 'maceta de 50+ litros como puente, eventual trasplante a tierra firme'; whyRationale cites Mendoza/Cuyo + 'Arauco' endémico nacional + 'Pot temporario; tierra eventualidad'."
  - "Sub-typology citation matrix — zero copy-paste rationales across the 6 entries; each whyRationale cites distinct family lexicon (Lamiácea/Apiácea/Asterácea/Oleácea/Ericácea/Amarantácea) + specific physiological mechanism (tricomas grises / hojas filiformes / esteviósidos / sequía-estival-Arauco / micorrizas-obligadas / cool-season-bolt) + Argentine context where useful (BsAs HS / Mendoza-Cuyo / Tucumán-Entre Ríos)."

patterns-established:
  - "Pattern 1: Aromáticas outdoor flag policy — when CONTEXT.md and existing catalog precedent diverge, default to honoring the CONTEXT lock (it's user-explicit) but surface the divergence in SUMMARY for future micro-task adjustment. Avoids unilateral flip during execution. Pattern reusable for any future catalog batch where research-stage assumptions don't match implementation reality."
  - "Pattern 2: Distinct top-level i18n namespace for genus-level species splits — applied to salvia-officinalis/salvia-ornamental verbatim as Phase 16 did with sansevieria/sansevieria-cilindrica. Verification rubric: Node parse confirms both top-level keys exist + no shared parent key. Reusable for any future species-split (e.g., menta-piperita vs menta if both were ever added)."
  - "Pattern 3: Cross-plan shared lexicon for thematic consistency — ericaceous acidic-soil lexicon shared between Plan 17-01 azalea and Plan 17-02 arandano (pH 4.5-5.5 + agua blanda + micorrizas obligadas); tree-realism framing shared between Plan 17-01 magnolia and Plan 17-02 olivo (size trajectory + pot-bridge + ground transplant). Pattern: thematically related entries across sub-batches share lexicon at description/tip/placementAvoid/whyRationale levels for user mental-model continuity."
  - "Pattern 4: CAT-21 final-count assertion as v1.2 catalog expansion close gate — `PLANT_DATABASE.length === 118` simultaneously closes CAT-21 AND the entire v1.2 catalog expansion. Smoke runner final assertion is the closure gate. After this plan, only documentation-only requirements remain (CAT-20 routing in Plan 17-03 + image plan in Plan 17-04)."

requirements-completed: [CAT-18, CAT-19, CAT-21]

# Metrics
duration: 7min
completed: 2026-05-08
---

# Phase 17 Plan 02: Sub-batch B — Aromáticas + Frutales/Huerta (CAT-18 + CAT-19 + CAT-21 Closure) Summary

**6 aromáticas + frutales/huerta PlantDBEntry objects + 12 i18n entry blocks (6 ES voseo + 6 EN) appended for CAT-18 + CAT-19 closure (PLANT_DATABASE 112 → 118 — CAT-21 final assertion satisfied); salvia-officinalis distinct top-level i18n namespace from salvia-ornamental (Phase 16 sansevieria-cilindrica precedent applied); ericaceous acidic-soil lexicon + tree-realism framing + cool-season bolt-risk all locked per 17-RESEARCH Pitfalls 1/4/5/7. Closes the entire v1.2 catalog expansion content layer.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-08T16:11:03Z
- **Completed:** 2026-05-08T16:18:41Z
- **Tasks:** 2
- **Files modified:** 3 (1 source + 2 i18n)

## Accomplishments

- 6 catalog entries appended to PLANT_DATABASE: salvia-officinalis / eneldo / stevia (3 Lamiaceae+Apiaceae+Asteraceae aromáticas — CAT-18) + olivo / arandano / espinaca (3 Oleaceae+Ericaceae+Amaranthaceae frutales/huerta — CAT-19) — sub-typology grouped with comment dividers
- All 6 entries declare full 10-field schema: 5 legacy (name/scientificName/icon/imageUrl/category/waterDays/sunHours/tempMin/tempMax/humidity/outdoor/tip/description/problems/nutrients) + 5 EDU (careAction.{fixed|soilCheck} / placementRecommended / placementAlternatives / placementAvoid / whyRationale)
- 6 i18n entry blocks authored in BOTH en/plants.json and es/plants.json (112 → 118 keys per locale); ES uses voseo (regá/sacá/movela/pellizcá/cosechá/cubrí/podá/dejá/sembrá/cortá/tocá); EN uses natural English (NOT literal translation)
- POWO 2024 canonical scientificNames verified per RESEARCH: Salvia officinalis / Anethum graveolens / Stevia rebaudiana / Olea europaea / Vaccinium corymbosum / Spinacia oleracea
- salvia-officinalis distinct top-level i18n namespace from existing salvia-ornamental (Salvia splendens at line 2110, untouched) — verified via Node parse in BOTH locales: both keys present as siblings + no shared salvia parent
- Aromáticas outdoor:false honored per CONTEXT lock (3 entries: salvia-officinalis/eneldo/stevia); Frutales/Huerta outdoor:true (3 entries: olivo/arandano/espinaca) — researcher discrepancy on aromáticas precedent surfaced in Decisions Made
- arandano uses waterMode soil_check + careAction.soilCheck (Pitfall 7 ericaceous pH-sensitive lock); other 5 use waterMode fixed
- espinaca tempMax: 25 (Pitfall 4 cool-season bolt-flag); description + tip + placementAvoid + whyRationale all cite Argentine summer >25°C → 2-3 week bolt
- olivo description LEADS with tree-realism (Pitfall 5 lock); placementRecommended cites maceta 50+ litros como puente; whyRationale cites Mendoza/Cuyo + 'Arauco' endémico nacional
- arandano cites ericaceous acidic-soil (Pitfall 7 lock; cross-references azalea Plan 17-01) — pH 4.5-5.5 + agua blanda + micorrizas obligadas in description + tip + placementAvoid + whyRationale
- All 12 whyRationale strings (6 ES + 6 EN) ≤250 chars from draft (max ES=212 eneldo, max EN=217 olivo); zero post-hoc trims required
- Voseo regression preserved: plantDatabase.ts catalog-defaults regex count stays at 0; es/plants.json regex count stays at baseline 2
- 6 W2.CAT-18/19.* PASS + 6 W2.CAT-20.*.keyset PASS + 6 IDENT.CAT-20.* PASS + 6 W2.ROUTING-FIX.* PASS (via Phase 16 exact-match-first refactor inherited unchanged); CAT-counts.total flips SKIP→PASS at 118 — CAT-21 closes
- Cross-phase regression clean: phase15-smoke (PASS 81/81), phase16-smoke (PASS 69/69), phase16-smoke --routing-fix (PASS 92/92)

## Task Commits

Each task was committed atomically:

1. **Task 1: Append 6 PlantDBEntry objects (Sub-batch B — CAT-18 + CAT-19 closure; CAT-21 final 118)** — `6ce92e0` (feat)
2. **Task 2: Author 6 i18n entry blocks in en + es plants.json (parallel keysets, ES voseo); salvia-officinalis distinct top-level namespace** — `b2d2ce2` (feat)

## Smoke Runner Deltas

| Smoke runner mode | Before Plan 17-02 | After Plan 17-02 | Delta |
|-------------------|-------------------|------------------|-------|
| `phase17-smoke.cjs` (default) | PASS 26/54 | PASS 39/54 | +13 SKIP→PASS (6 W2.CAT-18/19 + 6 W2.CAT-20.keyset + 1 CAT-counts.total) |
| `phase17-smoke.cjs --identification` | PASS 34/68 | PASS 53/68 | +19 SKIP→PASS (13 from default + 6 IDENT.CAT-20) |
| `phase17-smoke.cjs --routing-fix` | PASS 34/68 | PASS 53/68 | +19 SKIP→PASS (13 from default + 6 W2.ROUTING-FIX) |
| `phase15-smoke.cjs` | PASS 81/81 | PASS 81/81 | unchanged (cross-phase regression clean) |
| `phase16-smoke.cjs` | PASS 69/69 | PASS 69/69 | unchanged (cross-phase regression clean) |
| `phase16-smoke.cjs --routing-fix` | PASS 92/92 | PASS 92/92 | unchanged (cross-phase regression clean) |

**Remaining 15 SKIPs after Plan 17-02:**
- 14 × W3.CAT-20.* (COMMON_NAMES_ES routing closure — Plan 17-03 will land 14+ net-new mappings)
- 1 × W3.CAT-20.imagePlan (CLAUDE.md "Phase 17 Wave C" image-deferral block — Plan 17-04 will land documentation)

## Char-Limit Verification (whyRationale ≤250 chars)

ES whyRationale lengths:
- salvia-officinalis: 205 / **eneldo: 212** / stevia: 194 / olivo: 201 / arandano: 204 / espinaca: 201

EN whyRationale lengths:
- salvia-officinalis: 180 / eneldo: 179 / stevia: 176 / **olivo: 217** / arandano: 209 / espinaca: 193

All 12 strings under 250-char ceiling; max margin = 33 chars (olivo EN). Comfortable margin for future minor edits without char-budget pressure. Zero post-hoc trims required (carried forward from Phase 15/16 + Plan 17-01 char-limit-from-draft discipline).

## Sub-Typology Citation Matrix

Zero copy-paste whyRationale rationales across the 6 entries:

| id | Family lexicon | Specific mechanism | Argentine context |
|----|----------------|--------------------|--------------------|
| salvia-officinalis | Lamiácea mediterránea | Tricomas grises reflectantes + defensa calor+sequía | (CONTEXT lock outdoor:false) |
| eneldo | Apiácea anual | Hojas filiformes + bolt en verano caliente | Verano argentino caliente — sembrá otoño-invierno |
| stevia | Asterácea sudamericana | Esteviósidos 200-300x más dulces + frío <5°C debilita | Paraguay-Brasil; en BsAs HS protegé de heladas |
| olivo | Oleácea mediterránea perennifolia | Sequía estival adaptada + Arauco endémico | Mendoza/Cuyo extensivos cultivos |
| arandano | Ericácea acidofilica | Micorrizas obligadas pH 4.5-5.5 + agua blanda | Tucumán/Entre Ríos cultivos extensos |
| espinaca | Amarantácea anual cool-season | Bolt risk >25°C 2-3 semanas + cool-season cycle | Sembrá otoño-invierno-comienzo-primavera |

Each whyRationale hits ≥2 of: family lexicon + specific physiological mechanism + Argentine-context note.

## Pitfall Lock Verification (per 17-RESEARCH §Common Pitfalls — Sub-batch B subset)

- **Pitfall 1 (Salvia genus collision):** ✅ salvia-officinalis i18n keys are a distinct top-level namespace from salvia-ornamental in BOTH en + es plants.json — verified via Node parse (`!!j['salvia-officinalis'] && !!j['salvia-ornamental'] && !j['salvia']`). scientificName 'Salvia officinalis' is fully distinct from existing 'Salvia splendens'. salvia-ornamental entry at plantDatabase.ts:2110 + plants.json untouched (git diff ADDS only).
- **Pitfall 4 (espinaca cool-season bolt risk):** ✅ tempMax: 25 (NOT 30). description cites `en verano caliente argentino (>25°C) se va a flor (bolt) en 2-3 semanas y pierde calidad de hojas`. tip cites `Sembrá en otoño-invierno-comienzo-primavera; en verano >25°C se va a flor (bolt) en 2-3 semanas`. placementAvoid cites `Verano caliente bajo sol pleno — bolt en 2-3 semanas`. whyRationale cites `bolt risk a >25°C: el calor estival argentino la hace florecer en 2-3 semanas`.
- **Pitfall 5 (olivo compact-pot misframing):** ✅ description LEADS with `Olivo joven en maceta grande puede vivir varios años antes de necesitar trasplante a tierra firme`. placementRecommended explicitly mentions `maceta de 50+ litros como puente, eventual trasplante a tierra firme`. whyRationale cites `Pot temporario; tierra eventualidad`. Mendoza/Cuyo + Arauco endémico nacional cited as Argentine context.
- **Pitfall 7 (arandano ericaceous acidic-soil):** ✅ description cites `Necesita pH 4.5-5.5 estricto + agua blanda + sol pleno + frío invernal... el agua dura alcaliniza la tierra y deshace la simbiosis con micorrizas — clorosis ferrítica y muerte progresiva en meses`. tip cites `Usá agua de lluvia o filtrada — el agua dura alcaliniza la tierra y mata la simbiosis con micorrizas`. placementAvoid cites `Tierra alcalina o agua dura — pH alto bloquea hierro y deshace la simbiosis con micorrizas; muere en pocos meses`. whyRationale cites `Ericácea con micorrizas obligadas — su raíz necesita pH 4.5-5.5 y agua blanda; tierra alcalina bloquea hierro y mata la simbiosis. Cultivos en Tucumán y Entre Ríos prosperan con agua y sustrato adecuados`.

## Files Created/Modified

- `src/data/plantDatabase.ts` (+228 LOC, 4126 → 4354 LOC) — 6 PlantDBEntry objects appended after Plan 17-01 magnolia entry before closing `];`; 2 sub-typology comment dividers preserve readability
- `src/i18n/locales/en/plants.json` (+118 LOC, 3274 → 3392 LOC) — 6 entry blocks added between magnolia and humidity terminal-block
- `src/i18n/locales/es/plants.json` (+122 LOC, 3274 → 3396 LOC) — 6 entry blocks added in same position; voseo throughout

## Decisions Made

- **Aromáticas outdoor:false honored per CONTEXT lock (researcher discrepancy surfaced).** salvia-officinalis/eneldo/stevia all `outdoor: false` per CONTEXT.md user-explicit lock (kitchen-container framing). However, the 6 existing aromáticas in plantDatabase.ts (albahaca:598, romero:634, menta:670, perejil:1292, cilantro:1364, ciboulette:1768) ALL declare `outdoor: true` — meaning the CONTEXT.md "matches existing precedent" claim is factually inverted. Default honors the CONTEXT lock (it's user-explicit), with this divergence surfaced here for user awareness — a future micro-task may flip the 3 new aromáticas to `outdoor: true` to match the actual catalog precedent if user prefers consistency. No source change made unilaterally during execution.
- **arandano category locked to 'frutales' (Q3 default — woody perennial)** matching limonero precedent rather than huerta (frutilla precedent for annuals). Description LEADS with `arbusto frutal de bayas azules muy nutritivas` to reinforce the woody-perennial framing.
- **salvia-officinalis distinct top-level i18n namespace** locked verbatim per Phase 16 sansevieria-cilindrica precedent — both keys are siblings in plants.json, never nested under shared parent. Verified post-edit via Node parse: `salvia-officinalis ✓ + salvia-ornamental ✓ + shared salvia parent ✗` in BOTH en + es. salvia-ornamental entry at plantDatabase.ts:2110 + plants.json:2107 untouched.
- **arandano uses soil_check + careAction.soilCheck** — touch-test discipline appropriate for pH-sensitive ericaceous; cross-references azalea Plan 17-01 lexicon. Other 5 entries use fixed waterMode + careAction.fixed (predictable schedule cadence for Mediterranean drought-tolerant salvia/olivo, kitchen herbs eneldo/stevia, cool-season cycle espinaca).
- **olivo + arandano + espinaca outdoor:true** matching CONTEXT lock — Mediterranean tree (olivo), ericaceous shrub with cold dormancy (arandano), cool-season vegetable (espinaca) are all garden/outdoor-only species.
- **Sub-typology comment dividers in plantDatabase.ts** — 2 dividers (`Aromáticas (Lamiaceae + Apiaceae + Asteraceae)` + `Frutales + Huerta (Oleaceae + Ericaceae + Amaranthaceae)`) make the family-lexicon grouping self-documenting for future reviewers.
- **No findPlantInDatabase refactor task in Plan 17-02** — Phase 16 Plan 16-00 exact-match-first refactor inherited unchanged. Plan 17-02 species-qualified additions (Salvia officinalis vs existing Salvia splendens) automatically benefit from exact-match-first protection. Verified via `phase17-smoke.cjs --routing-fix` PASS 53/68.
- **No phase16-smoke `>= 104` floor adjustment needed** — Plan 17-01 already bumped phase16-smoke CAT-counts.total assertion from `=== 104` to `>= 104` floor in its Rule 3 deviation. Plan 17-02 inherits the floor semantics; phase16-smoke stays PASS 69/69 at idMatches=118 because `>= 104` accepts any forward catalog growth.

## Deviations from Plan

None — plan executed exactly as written. All 6 entries authored against the locked specifications in the `<entries>` block; all acceptance criteria PASS first-pass; no auto-fix rules triggered (no blocking issues, no missing critical functionality, no architectural changes needed). Char-limit-from-draft + voseo-pre-sweep + ericaceous lexicon-from-azalea + tree-realism-from-magnolia + sub-typology citation matrix all carried forward cleanly from Plan 17-01.

## Issues Encountered

None — both tasks landed cleanly first-try. No JSON parse errors, no tsc errors, no voseo regressions, no char-limit overflows, no cross-phase smoke runner failures. The disciplines compounding from Phase 14 → 15 → 16 → 17-01 → 17-02 continue to deliver zero-trim, zero-regression first-pass authoring.

## Open Questions Resolution Log

- **Q1 (aromáticas outdoor flag):** Resolved as **default — honor CONTEXT lock (outdoor:false)**. Researcher discrepancy with actual catalog precedent (existing 6 aromáticas all use outdoor:true) surfaced in Decisions Made for user awareness. No unilateral flip performed during execution; user may flip in a future micro-task if preferred for consistency with the existing aromáticas precedent.
- **Q3 (arandano category):** Resolved as **default — `frutales`** (woody perennial like limonero). Description LEADS with `arbusto frutal de bayas azules` to reinforce framing. Researcher's recommendation honored.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 17-03 (COMMON_NAMES_ES routing closure for all 14 Phase 17 entries — CAT-20 routing) UNBLOCKED — 14 catalog ids stable, scientificNames verified, ready for COMMON_NAMES_ES extension. Per RESEARCH §Net-new genera: 8 new genus aliases (Dianthus/Chrysanthemum/Tulipa/Helianthus/Magnolia/Anethum/Olea/Spinacia) + species-qualified canonical for all 14 + ≤2 legacy synonyms each.
- Plan 17-04 (CLAUDE.md "Phase 17 Wave C" image-plan registry — CAT-20 image plan) UNBLOCKED — 14 catalog ids stable, ready for accepted-known image deferral block insertion. Cumulative v1.2 image-upload backlog will reach 69 entries (15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17).
- Plans 17-03 + 17-04 are file-disjoint (`src/utils/plantIdentification.ts` vs `CLAUDE.md`) and parallelizable.
- ROADMAP success criterion #1 (length===118) SATISFIED — CAT-21 closed, entire v1.2 catalog expansion content layer complete.
- ROADMAP success criterion #3 (salvia-officinalis distinct from salvia-ornamental) VERIFIED — distinct catalog id + distinct scientificName + distinct top-level i18n namespace in BOTH locales.
- After Plans 17-03 + 17-04 close, Phase 17 fully complete; v1.2 catalog expansion (Phases 15 + 16 + 17) fully complete; only documentation-only requirements remain.

## Self-Check: PASSED

All claimed files exist:
- `src/data/plantDatabase.ts` — FOUND (4126 → 4354 LOC; 6 new entries with full 10-field schema)
- `src/i18n/locales/en/plants.json` — FOUND (3274 → 3392 LOC; 6 new entry blocks)
- `src/i18n/locales/es/plants.json` — FOUND (3274 → 3396 LOC; 6 new entry blocks)

All claimed commits exist:
- `6ce92e0` (Task 1: feat — 6 PlantDBEntry objects to plantDatabase.ts) — FOUND in `git log`
- `b2d2ce2` (Task 2: feat — 6 i18n entry blocks in en + es plants.json) — FOUND in `git log`

All claimed assertions verified:
- PLANT_DATABASE.length === 118 (112 → 118): ✅ — CAT-21 closes
- 6 scientificNames verified per POWO 2024: ✅ Salvia officinalis / Anethum graveolens / Stevia rebaudiana / Olea europaea / Vaccinium corymbosum / Spinacia oleracea
- npm run check:i18n-keys exits 0 (118 catalog ids verified): ✅
- npx tsc --noEmit clean: ✅
- Voseo grep on plantDatabase.ts = 0 (baseline 0 preserved): ✅
- Voseo grep on es/plants.json = 2 (baseline 2 preserved): ✅
- All 12 whyRationale strings ≤250 chars (max ES=212 eneldo, max EN=217 olivo): ✅
- salvia-officinalis distinct top-level i18n namespace (no shared salvia parent): ✅ in BOTH en + es
- salvia-ornamental untouched: ✅ git diff ADDS only (0 deletions in any file)
- arandano waterMode soil_check + careAction.soilCheck: ✅ in BOTH plantDatabase.ts and i18n keysets
- Other 5 entries waterMode fixed + careAction.fixed: ✅ in BOTH plantDatabase.ts and i18n keysets
- olivo/arandano/espinaca outdoor:true; salvia-officinalis/eneldo/stevia outdoor:false (CONTEXT lock honored): ✅
- espinaca tempMax: 25 (Pitfall 4 bolt-flag): ✅
- 0 existing entries modified (git diff ADDS only): ✅
- phase17-smoke 39/54 default + 53/68 --identification + 53/68 --routing-fix: ✅
- phase15-smoke 81/81 + phase16-smoke 69/69 + phase16-smoke --routing-fix 92/92 (cross-phase clean): ✅
- CAT-counts.total flips SKIP→PASS at 118 — closes the entire v1.2 catalog expansion content layer: ✅

---
*Phase: 17-catalog-wave-c-exterior-arom-ticas-frutales*
*Completed: 2026-05-08*
