# Phase 17: Catalog Wave C — Exterior + Aromáticas + Frutales - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning (2 areas captured from user, rest delegated to Claude's discretion mirroring Phases 15 + 16)

<domain>
## Phase Boundary

Add 14 specific plant species to `PLANT_DATABASE` with full v1.1 + Phase 14 EDU schema (10 fields per entry). Author voseo i18n in EN + ES (≈280 NEW strings). Extend `COMMON_NAMES_ES` in `src/utils/plantIdentification.ts` so PlantNet identification routes to curated entries. Document image plan: each entry's image registered as accepted-known failure in `CLAUDE.md` mirroring Phases 15/16 precedent (image upload deferred to milestone-end batch). Closes the v1.2 catalog expansion.

The 14 species are LOCKED by REQUIREMENTS.md:

- **CAT-17 (8 exterior flores):** azalea, ciclamen, fucsia, clavel, crisantemo, tulipan, girasol, magnolia
- **CAT-18 (3 aromáticas):** salvia-officinalis (distinct from existing `salvia-ornamental`), eneldo, stevia
- **CAT-19 (3 frutales/huerta):** olivo, arandano, espinaca

Catalog goes from 104 → 118 entries (NOT 120 — see "Catalog count target" decision below).

**Out of scope:** New `PlantCategory` enum values (existing 8 sufficient). Browse-catalog UI. Image sourcing/upload tooling beyond the accepted-known registry. Pet toxicity field (Phase 19). Fertilization fields (Phase 20). Catalog Wave D (none planned — v1.2 closes the catalog expansion at Phase 17).

</domain>

<decisions>
## Implementation Decisions

### Catalog count target — CAT-21 amended to 118 (locked)

REQUIREMENTS.md CAT-21 originally specified `PLANT_DATABASE.length === 120` (64 v1.1 + 56 v1.2). Actual delivery diverges:

- Phase 15 added 23 net-new (64 → 87)
- Phase 16 added 17 net-new (87 → 104; `potus` and `filodendro` upgraded in place rather than counted as 2 new entries per Phase 16 CAT-14 addendum)
- Phase 17 adds 14 net-new (104 → 118)

Total v1.2 net-add = 54, not 56. The 2-entry gap originates in Phase 16's Option-A collision resolution (potus/filodendro existed pre-Phase-16 as v1.0/v1.1 entries and only needed EDU upgrades).

**Decision:** Amend CAT-21 wording to `PLANT_DATABASE.length === 118 (64 v1.1 + 54 v1.2)`. Phase 17 ROADMAP.md success criterion #1 amended to `=== 118`. No scope creep — phase delivers exactly what CAT-17/18/19 specify. Smoke runner asserts `idMatches === 118`.

This action is taken at context-write time (REQUIREMENTS.md CAT-21 + ROADMAP.md Phase 17 SC #1 edited in the same docs commit as this CONTEXT.md, mirroring the Phase 16 addendum precedent that amended ROADMAP SC #1 from 106 → 104).

### Outdoor flag policy (locked per-entry)

Phase name says "Exterior + Aromáticas + Frutales" but botanical reality + LATAM mental model don't perfectly align. Per-entry outdoor flag:

| Entry | `outdoor` | Rationale |
|-------|-----------|-----------|
| azalea | `true` | Garden shrub / patio container in Argentine climate |
| ciclamen | `false` | LATAM mental model: winter-flowering INDOOR pot plant (commonly sold as such); user expectation is kitchen/living-room placement |
| fucsia | `true` | Hanging basket / patio plant; outdoor sun-shaded |
| clavel | `true` | Garden bed / patio container; needs full sun |
| crisantemo | `true` | Garden / patio mum; outdoor for fall flowering |
| tulipan | `true` | Outdoor required for cold dormancy → spring bloom |
| girasol | `true` | Field/garden annual; needs direct sun |
| magnolia | `true` | Tree species; only outdoor-viable |
| salvia-officinalis | `false` | Match existing aromáticas precedent (albahaca/romero/menta/cilantro/perejil/ciboulette all `outdoor:false` in current catalog) — kitchen-container framing |
| eneldo | `false` | Same — kitchen-container herb |
| stevia | `false` | Same — kitchen-container herb |
| olivo | `true` | Mediterranean tree; outdoor only |
| arandano | `true` | Ericaceous shrub; outdoor only (cold dormancy required) |
| espinaca | `true` | Cool-season vegetable; outdoor garden / raised bed |

**Summary count:** 10 outdoor:true + 4 outdoor:false (ciclamen + 3 aromáticas).

### Plan structure (mirrors Phases 15 + 16 — sub-batch by sub-typology)

Following the proven 5-plan layout from Phases 15 and 16:

- **Wave 0 (15-00 / 16-00 equivalent):** smoke runner scaffold `scripts/phase17-smoke.cjs` with partial-landing-tolerant SKIP gates for CAT-17/18/19/20/21 (anyLanded/allLanded windowing, mid-band count SKIP). Mid-band: `idMatches > 104 && idMatches < 118 → undefined`. Final assertion: `idMatches === 118`.
- **Wave 1 (15-01 / 16-01 equivalent):** Sub-batch A — exterior flores (8 entries from CAT-17). Sub-typology grouping by flowering-physiology: bulb/dormancy (tulipan, ciclamen, crisantemo) + temperate-shrub (azalea, fucsia, clavel) + annual (girasol) + tree (magnolia). Shared `whyRationale` templates for Mediterranean/temperate-cold-flowering, dormancy cycles, ericaceous acidic-soil (azalea), magnoliaceae.
- **Wave 2 (15-02 / 16-02 equivalent):** Sub-batch B — aromáticas + frutales/huerta (6 entries from CAT-18 + CAT-19). Sub-typology grouping: Mediterranean aromática (salvia-officinalis), apiaceae annual (eneldo), tropical-stevioside (stevia), Mediterranean-tree (olivo), ericaceous-acidophilic (arandano), cool-season-leafy-green (espinaca). Closes CAT-17/18/19 (118 entries) + CAT-20.
- **Wave 3 (parallel: 15-03 + 15-04 / 16-03 + 16-04 equivalent):** COMMON_NAMES_ES extension for all 14 (CAT-20) ‖ CLAUDE.md image-plan registry "Phase 17 Wave C" block (CAT-20).

Exact wave splits and sub-batch contents are Claude's discretion at planning time — file-conflict analysis on `plantDatabase.ts` + i18n files forces sequential authoring waves.

### salvia-officinalis vs salvia-ornamental disambiguation (locked)

REQUIREMENTS.md CAT-18 explicitly calls this out: `salvia-officinalis` distinct from existing `salvia-ornamental`, `name` and `description` make this clear. Mirrors Phase 16 `sansevieria` / `sansevieria-cilindrica` precedent:

- **Distinct top-level i18n key namespace:** `salvia-officinalis.*` separate from `salvia-ornamental.*` (NEVER nested under shared parent — prevents `getTranslatedPlant` runtime collisions per Phase 16 lesson).
- **`name` field:** ES → "Salvia (culinaria)" or "Salvia oficinal"; EN → "Common sage" / "Culinary sage". Make the culinary distinction visible at first read.
- **`description` field:** lead with culinary use ("hierba aromática para cocinar carnes, sopas y rellenos") to differentiate from existing `salvia-ornamental` (decorative flowering).
- **`scientificName`:** *Salvia officinalis* (canonical); existing `salvia-ornamental` already uses *Salvia splendens* or similar (researcher confirms at planning time).
- **`COMMON_NAMES_ES`:** species-qualified mapping required (`'Salvia officinalis': 'Salvia oficinal'` or similar) so genus-level "Salvia" doesn't first-match-collide. Phase 16 Plan 16-00 exact-match-first refactor in `findPlantInDatabase` already protects against this for already-keyed species, but the COMMON_NAMES_ES extension must be species-qualified.

### Bulb/dormancy plants — Claude's discretion (guidance below)

Three Phase 17 entries have annual dormancy cycles (`tulipan`, `ciclamen`, `crisantemo`). The current `waterMode` enum (`'fixed'` | `'soil-check'`) doesn't model dormancy. Approach:

- **`waterMode: 'soil-check'`** for all three (touch-test discipline lets users water less during dormancy without rigid schedule fighting them).
- **Document dormancy cycle in copy:** `description` notes the dormancy phase + when to expect it; `tip` calls out the dormancy-watering rule ("dejá de regar cuando las hojas se marchitan tras florecer — entra en reposo"); `careAction.soilCheck` references dormancy ("durante reposo, suspendé el riego hasta que aparezcan brotes nuevos"); `whyRationale` cites the physiology (bulbo subterráneo / cormo / corona perenne — annual aboveground cycle).
- **Don't introduce new enum values** — Phase 17 is not the place to add a `'dormancy-aware'` waterMode. Future v2 work could revisit. Phase 17 ships within current schema.

Same approach as Phase 16 `piedras-vivas` (Lithops) — special physiology cited in copy, custom whyRationale, no schema bump.

### Tree-class species (magnolia, olivo) — Claude's discretion (guidance below)

Both are trees. Compact-pot framing makes them accessible to apartment-dwellers; garden-ground framing is botanically more honest:

- **`outdoor: true`** for both (locked above).
- **`description` framing:** lead with realistic usage — "olivo joven en maceta grande puede vivir varios años antes de necesitar trasplante a tierra"; "magnolia es un árbol — la versión enana (`Magnolia stellata`) cabe en patio o jardín pequeño". Honest about size trajectory.
- **`placementRecommended` / `placementAlternatives`:** mention pot-size requirements + eventual transplant. Don't pretend they're permanent container plants.
- **`whyRationale`:** cite physiology (Magnoliaceae primitive-flowering / Oleaceae Mediterranean-evergreen) AND the reality of long-term tree growth. Argentine-context note where useful (olivo widely grown in Mendoza/Cuyo; magnolia ornamental in Buenos Aires gardens).
- **Researcher verifies species at planning time** — `magnolia` likely *Magnolia grandiflora* or *Magnolia stellata* (compact dwarf); `olivo` = *Olea europaea*.

### Sub-batch organization — Claude's discretion (planner picks)

Rough split between sub-batch A (CAT-17 8 flores) and sub-batch B (CAT-18 + CAT-19 6 entries). Final composition decided in 17-PLAN.md based on file-conflict analysis. Possible alternatives:

- **Symmetric split** (recommended): A = 8 flores, B = 6 aromáticas/frutales. Roughly equal authoring load. Each sub-batch shares some sub-typology lexicon.
- **Bulb-grouped split:** A = 3 bulb/dormancy (tulipan/ciclamen/crisantemo) + 3 aromáticas (salvia-officinalis/eneldo/stevia), B = 5 non-bulb flores (azalea/fucsia/clavel/girasol/magnolia) + 3 frutales (olivo/arandano/espinaca). Groups dormancy plants together for shared whyRationale.
- **Family-grouped split:** A = ericaceous-acidophilic (azalea, arandano) + Mediterranean (olivo, salvia-officinalis, lavanda-already-exists-cross-ref) + ..., B = rest. More awkward — too many family lines to draw cleanly across 14 entries.

Symmetric split is the default; planner adjusts if file-conflict analysis or content-cohesion argues otherwise.

### Carrying forward from Phases 15 + 16 (no re-discussion needed)

All Phase 15/16 patterns apply unchanged:

- **Voseo discipline (ES):** regá / sacá / podés / querés / podá / movela / tocá / hacé / cosechá / pellizcá / sembrá. Voseo grep guard baseline = 2 (preserved through Phases 15 + 16); Phase 17 must NOT increase.
- **whyRationale ≤ 250 chars** drafted at length, not post-hoc trimmed.
- **Mechanism citations** per sub-type (Magnoliaceae primitive-flowering / Oleaceae Mediterranean-evergreen / Ericaceae acidophilic-mycorrhiza / Asteraceae compositae-radial-symmetry / Liliaceae bulbo-cormo / Apiaceae aromática-fruta / etc.) — never generic "porque sí".
- **Defer all images to accepted-known** — extend CLAUDE.md "Phase 16 Wave B" block with a "Phase 17 Wave C" block. 14 more entries to milestone-end batch upload (cumulative v1.2 backlog: 15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17 = 69 entries).
- **PlantNet alias coverage:** ≤2 aliases per entry (canonical scientificName + 1-2 well-known synonyms). Researcher identifies must-add aliases (e.g., *Tulipa gesneriana* canonical + *Tulipa hybrida* legacy; *Vaccinium corymbosum* canonical + *Vaccinium myrtillus* European-blueberry adjacent; *Helianthus annuus* single canonical).
- **Smoke runner Wave 0 with partial-landing tolerance** — `scripts/phase17-smoke.cjs` mirrors `scripts/phase16-smoke.cjs` shape: anyLanded/allLanded gates per CAT-17/18/19 ids, mid-band count SKIP at 104+ < 118, IDENT.CAT-20 species-qualified scientificName matching, IMAGE.CAT-20 CLAUDE.md "Phase 17 Wave C" sentinel.
- **Atomic per-task commits** — clean revert path; mirror Phase 15/16 commit cadence.
- **Field shape parity:** every NEW entry has all 5 legacy fields (name/tip/description/problems[]/nutrients?) + all 5 EDU fields. Validator (`scripts/check-i18n-keys.mjs`) auto-validates conditionally.
- **Char-limit-from-draft + voseo-pre-sweep** — Phase 16 Plan 16-01 / 16-02 success pattern: zero post-hoc trims, zero rewordings; sweep for false-positive voseo regex matches (`tocá` / `tenés` / `riega/saca/puedes/quieres/mueve/toca/haz`) BEFORE commit.
- **Append-only COMMON_NAMES_ES extension** — never modify existing entries; verify with `git diff | grep '^-'` returning 0.
- **Selective genus alias pattern** — add genus alias when single-species genus or all species share display name; deliberately omit for large genera with divergent species. Mirrors Phase 16 Plan 16-03 lesson (Echinopsis omitted).

### Defaults (Claude's discretion within these guardrails)

- **`waterMode`:** `'soil-check'` for bulbs/dormancy (tulipan, ciclamen, crisantemo); `'soil-check'` for ericaceous (azalea, arandano — pH-sensitive, watering-quality matters); `'fixed'` for predictable schedules (girasol annual, espinaca cool-season cycle, fucsia/clavel patio routine, eneldo/stevia kitchen herbs); `'fixed'` for Mediterranean drought-tolerant (salvia-officinalis, olivo); `'fixed'` for magnolia (mature tree).
- **`lightLevel`:** mostly `'direct'` or `'bright_indirect'` (exterior phase). Aromáticas → `'bright_indirect'` to `'direct'` (kitchen sun). Magnolia/olivo → `'direct'`. Azalea → `'bright_indirect'` (sotobosque-adapted, dappled sun). Ciclamen → `'medium'` to `'bright_indirect'` (indoor pot context).
- **`tempMin` / `tempMax`:** wider ranges than Phases 15/16 (exterior phase). Tulipan needs cold dormancy (-5°C tolerable); azalea/arandano/magnolia tolerate cold (-10°C arandano hardy, magnolia -15°C grandiflora); olivo Mediterranean (-5°C to 40°C); espinaca cool-season (-5°C to 25°C — bolts in heat); girasol warm-season (5°C to 35°C). Researcher verifies per-species at planning time.
- **`humidity`:** mostly `'media'` for outdoor garden plants; `'baja'` for olivo (Mediterranean drought); `'alta'` for arandano (acidophilic shrub) and ciclamen (indoor cool-pot).
- **`category`:** map to existing 8 `PlantCategory` values (planner verifies at planning time). Likely: `'flower'` for 8 exterior flores; `'aromatic'` for 3 aromáticas; `'fruit'` or `'vegetable'` for olivo/arandano/espinaca depending on existing enum granularity.

### Claude's Discretion

- **Bulb/dormancy copy framing** — physiology-cited dormancy descriptions across tulipan/ciclamen/crisantemo. Each gets distinct mechanism citation (Liliaceae bulbo / Primulaceae cormo-tuberosus / Asteraceae perennial-corona).
- **Tree-class realism framing** — magnolia/olivo `description` honest about size + transplant trajectory; `placementRecommended` mentions pot-size + eventual ground transplant.
- **Sub-batch organization** — symmetric split (A=8 flores, B=6 aromáticas/frutales) is default; planner adjusts based on file-conflict analysis.
- **Researcher species verification** — magnolia (likely *M. grandiflora* or *M. stellata*); strelitzia-precedent applies. olivo (*Olea europaea*). tulipan (*Tulipa gesneriana*). crisantemo (*Chrysanthemum × morifolium*). girasol (*Helianthus annuus*). azalea (*Rhododendron simsii* compact pot or *R. indicum*). arandano (*Vaccinium corymbosum* highbush). magnolia + olivo dwarf-vs-standard variant choice noted in description.
- **PlantNet alias selection** — researcher identifies must-add aliases per entry (capped ≤2). Common ones: *Tulipa hybrida* / *Helianthus annuus* / *Olea europaea* / *Vaccinium corymbosum* / *Spinacia oleracea* / *Anethum graveolens* / *Stevia rebaudiana*.
- **Char-limit ceiling enforcement** ≤250 char on whyRationale at draft time.
- **Per-task autonomous commits** mirror Phase 15/16 atomic commit pattern.
- **Whether to fold image-plan registry update into Sub-batch B plan or split into its own plan** — file-disjoint with `COMMON_NAMES_ES` so they parallelize either way (mirrors Phase 16 Plan 16-04 standalone-doc-plan precedent).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 17 spec
- `.planning/REQUIREMENTS.md` §"Catalog Expansion Wave C" (lines 62-67) — CAT-17 through CAT-21, the 5 requirements that close in Phase 17. **CAT-21 wording amended in same docs commit as this CONTEXT.md (120 → 118; 56 v1.2 → 54 v1.2).**
- `.planning/ROADMAP.md` §"Phase 17: Catalog Wave C" — goal + success criteria. **SC #1 amended in same docs commit (`PLANT_DATABASE.length === 120` → `=== 118`).**

### Project conventions
- `CLAUDE.md` — design system, i18n discipline, voseo for ES, pre-submit checks, accepted-known image failures registry pattern (existing "Phase 15 Wave A" + "Phase 16 Wave B" blocks serve as the model for Phase 17's 14 additions; new "Phase 17 Wave C" block expected).
- `.planning/STATE.md` — current state, milestone version (v1.2 Recommendation-First Plant Guide), velocity metrics.

### Existing files (modified or referenced by Phase 17)
- `src/data/plantDatabase.ts` (~3700 LOC after Phase 16) — the catalog file. Append 14 new PlantDBEntry objects following the established shape. Read existing Phase 16 entries 3300+ for the convention, especially Sub-batch B entries 3500+ for mixed-typology pattern. Existing `salvia-ornamental` at line 2110 is the disambiguation reference for `salvia-officinalis`.
- `src/types/index.ts` §`PlantDBEntry` — the interface (Phase 14 EDU fields + v1.1 fields established; no schema changes needed).
- `src/utils/plantIdentification.ts` (~310 LOC after Phase 16) §`COMMON_NAMES_ES` and §`findPlantInDatabase` — extend the map with 14 new scientificName → catalog id mappings + selective genus aliases (Tulipa/Helianthus/Olea/Vaccinium/Spinacia/Anethum/Stevia where single-species or shared display name) + ≤2 legacy synonym aliases per entry. Phase 16 added 30 entries; Phase 17 expected ~20-25 (14 canonical + selective genus aliases + per-entry legacy).
- `src/i18n/locales/en/plants.json` (~3300 LOC after Phase 16) — 10 strings × 14 entries = 140 EN strings.
- `src/i18n/locales/es/plants.json` (~3300 LOC after Phase 16) — 140 ES voseo strings.
- `scripts/check-i18n-keys.mjs` — validator. Phase 14 + 15 + 16 already cover EDU fields conditionally; no changes needed for Phase 17.
- `scripts/phase16-smoke.cjs` (~280 LOC) — reference smoke runner pattern for Phase 17's new `scripts/phase17-smoke.cjs`. Mid-band count SKIP window: `idMatches > 104 && idMatches < 118 → undefined`; final assertion `idMatches === 118`.

### Prior phase context (read for pattern continuity)
- `.planning/phases/16-catalog-wave-b-suculentas-cactus-trepadoras-trending/16-CONTEXT.md` — direct pattern template for this phase. Sub-batch by sub-typology, voseo discipline, char-limit, smoke runner shape, defer images, exact-match-first routing fix already landed.
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-CONTEXT.md` — original 5-plan pattern template; Phase 16 inherited; Phase 17 inherits.
- `.planning/phases/16-catalog-wave-b-suculentas-cactus-trepadoras-trending/16-{00,01,02,03,04}-SUMMARY.md` — execution lessons: char-limit-from-draft, voseo-pre-sweep, append-only COMMON_NAMES_ES, selective genus alias pattern, distinct top-level i18n namespace for species splits (sansevieria/sansevieria-cilindrica precedent applies to salvia-ornamental/salvia-officinalis).
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-{00,01,02,03,04}-SUMMARY.md` — execution lessons: voseo regex baseline preservation, mid-band SKIP windowing, append-only routing extensions, image-plan registry pattern.
- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — original EDU schema decisions, citation style guide, voseo discipline lock.
- `.planning/phases/14-educational-detail-modal/14-{04,05,06,07}-SUMMARY.md` — content authoring lessons by sub-type: interior (14-04), exterior (14-05 — DIRECTLY relevant for Phase 17 exterior flores), aromáticas + huerta (14-06 — DIRECTLY relevant for Phase 17 aromáticas + frutales), frutales + suculentas (14-07 — family lexicon citation pattern, partially relevant for Phase 17 olivo/magnolia/arandano).
- `.planning/phases/12-unknown-plant-tracking/12-CONTEXT.md` — unknown-plants tracker context (relevant for Phase 17 routing coverage measurement post-deploy; potential signal source for any future post-v1.2 catalog wave).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/data/plantDatabase.ts` `PLANT_DATABASE` array (104 entries after Phase 16)** — Phase 16 Sub-batch A (10 entries) + Sub-batch B (7 entries) provide the most direct authoring pattern for diverse-species batches. Phase 14-05 SUMMARY (exterior plants content × 21 entries) is the closest content-authoring precedent for Phase 17's 8 exterior flores; Phase 14-06 SUMMARY (aromáticas + huerta × 18 entries) is the closest precedent for Phase 17's 3 aromáticas + 3 frutales/huerta.
- **`getCatalogEntry(slug)` and `findPlantInDatabase(scientificName)`** — both consume new entries automatically. Phase 16 Plan 16-00 exact-match-first refactor protects against genus collisions for species-qualified scientificNames (relevant for `salvia-officinalis` vs `salvia-ornamental`).
- **`getTranslatedPlant(plant)`** — surfaces 5 EDU fields automatically when i18n keys exist.
- **`scripts/phase16-smoke.cjs` (~280 LOC)** — direct template for `phase17-smoke.cjs`. Copy structure, swap `PHASE_16_IDS` → `PHASE_17_IDS`, `PHASE_16_SCIENTIFIC_NAMES` → `PHASE_17_SCIENTIFIC_NAMES`, swap CAT-13/14/15/16 → CAT-17/18/19/20. Mid-band count SKIP: `idMatches > 104 && idMatches < 118 → undefined`. Final assertion: `idMatches === 118`.
- **`scripts/check-i18n-keys.mjs`** — auto-validates Phase 17 entries with no extension.
- **Phase 16 SUMMARYs (especially 16-01, 16-02)** — proven sub-batch authoring patterns + char-limit-from-draft success + voseo-pre-sweep discipline.
- **Phase 14-05 + 14-06 SUMMARYs** — content-authoring lessons for exterior + aromáticas/huerta sub-types specifically; family lexicon citation patterns directly applicable to Phase 17.

### Established Patterns
- **Catalog entries are JS module data** — pure JS code change, no DB schema migration.
- **Additive-optional EDU schema** — adding entries doesn't break existing entries.
- **Per-entry i18n keyset** — each entry's id keyspace under `plants.json`. `salvia-officinalis.*` is a distinct namespace from `salvia-ornamental.*` so no collision (mirrors Phase 16 `sansevieria-cilindrica.*` / `sansevieria.*` precedent).
- **Voseo grep guard** — baseline = 2 (legacy strings); Phase 15/16 preserved at 2; Phase 17 must NOT increase.
- **Atomic commits per substantive change** — Phase 14/15/16 pattern. Each Wave/sub-batch = its own commit.
- **Smoke runner per phase** — Phase 11/12/13/14/15/16 pattern. Wave 0 ships harness with partial-landing SKIP gates; later waves flip placeholders SKIP → PASS.
- **"Accepted-known failures" registry in CLAUDE.md** — v1.1 (15 entries) + Phase 15 Wave A (23 entries) + Phase 16 Wave B (17 entries) precedents; Phase 17 extends with "Phase 17 Wave C" block (14 entries; cumulative 69 backlog).
- **Append-only COMMON_NAMES_ES extension** — Phase 15 Plan 15-03 + Phase 16 Plan 16-03 pattern. Verify `git diff | grep '^-' === 0` for plantIdentification.ts.
- **Distinct top-level i18n namespace for species splits** — Phase 16 sansevieria/sansevieria-cilindrica precedent. Apply to salvia-officinalis/salvia-ornamental.

### Integration Points
- **PlantNet → catalog routing**: `findPlantInDatabase(scientificName)` resolves to PlantDBEntry; `COMMON_NAMES_ES` provides scientificName → ES common name. Phase 14.1 fix ensures end-to-end persistence. Phase 16 exact-match-first refactor ensures species-qualified routing wins over genus-prefix.
- **MyPlantDetailModal display**: Phase 17 entries surface 5 EDU fields automatically once `databaseId` is persisted on saved Plants.
- **`getPlantCategories()`**: Phase 17 entries map to existing 8 PlantCategory values; no new category creation. `salvia-officinalis` likely shares category with `salvia-ornamental` (verify).
- **Smoke runner integration**: `scripts/phase17-smoke.cjs` exposed via `npm run smoke:phase17`; per-task `<verify><automated>` blocks invoke it.
- **CAT-21 final-count assertion**: smoke runner final assertion `idMatches === 118` (post-amendment). This is the closing assertion for the entire v1.2 catalog expansion.

</code_context>

<specifics>
## Specific Ideas

- "Amend CAT-21 to 118 — accept the gap, no scope creep" — preferred over adding 2 filler entries that wouldn't have been in the original requirements scope.
- "Ciclamen is INDOOR pot in LATAM mental model" — outdoor:false despite phase name; matches user expectation (winter-flowering pot plant near windowsill).
- "Aromáticas all outdoor:false" — match existing albahaca/romero/menta/cilantro/perejil/ciboulette pattern in catalog. Don't break the kitchen-container precedent.
- "salvia-officinalis distinct namespace from salvia-ornamental" — name + description make culinary vs decorative crystal-clear; mirrors Phase 16 sansevieria-cilindrica precedent.
- "Tree species realistic framing" — magnolia + olivo description honest about size trajectory; pot is temporary, ground transplant eventual.
- "Bulb/dormancy in copy not schema" — tulipan/ciclamen/crisantemo dormancy documented in description/tip/whyRationale, soil-check waterMode handles touch-discipline; no waterMode enum bump.
- "Mirror Phase 15 + 16 patterns wherever applicable" — sub-batch by sub-typology, voseo discipline, char-limit, smoke runner shape, defer images, ≤2 aliases, append-only routing.

</specifics>

<deferred>
## Deferred Ideas

- **Catalog Wave D / post-v1.2 expansion** — none planned; v1.2 closes catalog expansion at Phase 17. Future expansion driven by Phase 12 unknown-plants tracker data (post-deploy signal).
- **`waterMode: 'dormancy-aware'` enum value** — out of scope; copy-level dormancy documentation sufficient for v1.2. Future v2 work could revisit if user pain emerges.
- **Pet toxicity field (Phase 19)** — `petToxicity` will be added to all 118 entries. Phase 17 doesn't populate; field declaration order TBD (likely Phase 19 sweeps the full catalog).
- **Fertilization fields (Phase 20)** — `fertilizer` + `fertilizeIntervalWarm`/`fertilizeIntervalCold` will land per-entry in Phase 20. Phase 17 doesn't populate.
- **Image upload tooling** — automated CC0 image search + upload pipeline. Future tooling phase.
- **Image upload for the existing accepted-known list** — cumulative 69-entry backlog (15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17). Milestone-end batch upload, not Phase 17 scope.
- **Browse-catalog UI** — direct picker for catalog entries instead of PlantNet identification flow. Future v1.2 or v1.3 phase.
- **PlantNet exhaustive alias coverage** — wait for Phase 12 unknown-plants tracker data; address in future micro-phase if signal warrants.
- **Magnolia grandiflora vs Magnolia stellata variant decision** — researcher confirms at planning time; both are valid LATAM ornamentals.
- **Olivo dwarf cultivar vs standard `Olea europaea`** — researcher confirms at planning time.
- **Cool-season vegetable expansion (lechuga, rúcula, kale, acelga, rabanito)** — out of Phase 17 scope; possible future huerta micro-phase if user signal warrants.
- **Bulb expansion (narciso, jacinto, lirio, dalia)** — out of Phase 17 scope; possible future flores micro-phase. Note: `dalia` is referenced in CLAUDE.md v1.1 LATAM list — may already exist or be a renamed entry.

</deferred>

---

*Phase: 17-catalog-wave-c-exterior-arom-ticas-frutales*
*Context gathered: 2026-05-08*
