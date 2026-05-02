# Phase 8: Catalog Rebalance - Research

**Researched:** 2026-05-01
**Domain:** Plant catalog data, lookup helper pattern, alias resolution, CI guard scripts
**Confidence:** HIGH (existing entries — read from live source), MEDIUM (new entries — horticultural cross-reference), HIGH (code patterns — read from live source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- `getCatalogEntry(slug: string): PlantDBEntry | null` — new exported helper in `src/data/plantDatabase.ts`. Checks `id` first, then scans `_aliases`.
- Read-site migration: `PlantCard`, `MyPlantDetailModal`, `PlantHealthDetail`, `PlantDetailModal`, `PlantIdentifier/IdentificationResults` switch to `getCatalogEntry(plant.databaseId)?.tip` etc.
- Defensive missing-entry handling: returns `null`, consumers use `?.` chain + safe-default. `__DEV__` warning on missing slug.
- `_aliases?: string[]` on `PlantDBEntry` (already typed-optional). `updatePlant` auto-migrates alias dbId to canonical on save — idempotent.
- Legacy fields (`tip`, `description`, `problems`, `nutrients` on Plant type): keep as `@deprecated` optional in v1.1; v1.2 deletes them.
- `getTranslatedPlant` stays i18n bridge, operates on `getCatalogEntry` results.
- Direct entry edits as SSOT: `plantDatabase.ts` is the single source of truth. Phase-4 mappers NOT re-run on these entries.
- `lavanda` id → rename to `lavanda-angustifolia`, add `_aliases: ["lavanda"]`. Add 2 new entries: `lavanda-stoechas`, `lavanda-dentada`.
- Cold-tolerance per CAT-03: angustifolia hardiest (cold ≤ 12d), stoechas+dentada warmer (cold ≤ 8d).
- i18n key relocation: `lavanda` → `lavanda-angustifolia` directly in JSON files.
- CI guards: `npm run check:i18n-keys` and `npm run check:images` — both synchronous/async Node scripts. Exit 1 + itemised list. No auto-fix.
- `check:i18n-keys` MUST pass before Phase 8 ships. `check:images` expected to fail for 14 new entries until manual upload.
- `waterMode` defaults locked: suculentas/cactus/aloe-vera/echeveria/haworthia/sedum/jade → `soil_check`. Lavandas, romero-rastrero → `fixed`. Tomate cherry, gardenia, camelia, copete → `fixed`.
- 14 new entries: jacarandá, ceibo, glicina, gardenia, camelia, dalia, salvia ornamental, cala, copete (Tagetes), verbena, lavanda-stoechas, lavanda-dentada, romero-rastrero, tomate cherry.
- Image strategy deferred: code ships pointing at `${CATALOG_BASE_URL}/<id>.jpg` URLs that 404 until upload.
- No edge function or write-side changes in Phase 8.

### Claude's Discretion

- `_aliases` field: `_aliases?: string[]` (underscore prefix denotes meta).
- `getCatalogEntry` co-location: in `src/data/plantDatabase.ts` next to `PLANT_DATABASE`.
- `updatePlant` auto-migrate-on-alias: inside `useStorage.updatePlant()`. Runtime only, no migration script.
- `getTranslatedPlant` signature: Claude's discretion on whether to widen to `(entry: PlantDBEntry, t: TFunction)` or leave alone.
- Researcher table format: Claude's discretion (markdown table chosen here).
- CI guard exit codes: always 0 or 1, no partial states.

### Deferred Ideas (OUT OF SCOPE)

- Image upload to Supabase Storage (manual step, v1.1 backlog)
- GitHub Actions / pre-commit hook for CI guards
- Auto-fix mode for CI guards
- Per-month (12-bucket) watering schedule (v2.0 ADV-01)
- Auto-rescheduling based on weather (v2.0 ADV-02)
- Removal of legacy fields on Plant type (v1.2)
- Removal of `applyColdFactor` constants (v1.2)
- Horticultural review by external expert
- Per-region catalog variants
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIGHT-04 | All 60+ catalog entries updated with `lightLevel` using same deterministic mapper; horticultural review corrects edge cases | Expert-override table below covers all 38 existing entries; haworthia `bright_indirect` already correct; calathea `medium_indirect` confirmed |
| WATER-07 | Catalog rebalance replaces `applyColdFactor` heuristic with explicit per-`PlantDBEntry` warm/cold defaults from watering-ratio reference table | Per-entry table below replaces every heuristic cold value with expert-vetted values |
| CAT-01 | All 60+ existing `PLANT_DATABASE` entries gain `lightLevel`, `waterSchedule: { warm, cold }`, `waterMode` | 38 entries confirmed in live source; all already have Phase 4 mechanical values; Phase 8 overrides with expert values from table below |
| CAT-02 | 14 new outdoor plants added with full new-model fields | Full entry specs in §14 New Entries section below |
| CAT-03 | Lavanda entry split into angustifolia/stoechas/dentata with distinct cold tolerance | Split table + horticultural rationale in §Lavender Split section |
| CAT-04 | Catalog `tip`, `description`, `problems`, `nutrients` always read by lookup | `getCatalogEntry(plant.databaseId)` helper implementation documented; read-site migration map in §Integration Points |
| CAT-05 | Catalog entries support `_aliases: string[]` so renamed slugs don't orphan user references | `_aliases?: string[]` field on `PlantDBEntry`; `getCatalogEntry` scan logic in §getCatalogEntry Pattern |
| CAT-06 | CI build-time check verifies every catalog `id` has complete keyset in both `en/plants.json` and `es/plants.json` | `scripts/check-i18n-keys.mjs` design documented; registered as `npm run check:i18n-keys` |
| CAT-07 | Pre-submit check verifies every catalog `imageUrl` returns 200 OK | `scripts/check-images.mjs` design documented; registered as `npm run check:images` |
| CAT-08 | Horticultural audit replaces auto-mapped `lightLevel` and `cold` values with expert-vetted defaults | Complete per-entry audit table below; rationale for every deviation from Phase 4 mechanical values |
</phase_requirements>

---

## Summary

Phase 8 is a data-and-plumbing phase: no new screens, no new APIs, no edge function changes. It has three distinct workstreams that can be planned as separate waves:

**Wave 1 — Catalog data edits:** Replace mechanical Phase 4 values in all 38 existing entries with expert-vetted `lightLevel`, `waterSchedule.{warm,cold}`, and `waterMode`. Rename `lavanda` to `lavanda-angustifolia` with `_aliases: ["lavanda"]`. Add 2 new lavender variants and 12 remaining new entries (total 14 new). Write full ES content + EN equivalents + i18n keys.

**Wave 2 — Lookup helper + read-site migration:** Add `_aliases?: string[]` to `PlantDBEntry` type. Implement `getCatalogEntry(slug)` in `plantDatabase.ts`. Migrate read-site consumers (`PlantDetailModal`, `MyPlantDetailModal`, `PlantHealthDetail`) to use the helper. Add alias-rewrite-on-save to `useStorage.updatePlant()`. Mark legacy fields `@deprecated` on `Plant` type.

**Wave 3 — CI guards:** Write `scripts/check-i18n-keys.mjs` and `scripts/check-images.mjs`. Register as npm scripts. Document in CLAUDE.md.

**Primary recommendation:** Execute waves sequentially. Wave 1 is the longest (data entry); Wave 2 is the most architecturally sensitive (runtime behavior change); Wave 3 is independent and can be done last or in parallel with Wave 2.

The critical discovery from reading the live source: the catalog has **38 entries** (not 50+ as the planning docs estimated based on a pre-Phase-4 commit message). With 14 additions it becomes 52 entries. All 38 existing entries already have `lightLevel`, `waterSchedule`, and `waterMode` from Phase 4 mechanical mapping. Phase 8 only needs to correct the values that differ from horticultural expert consensus.

---

## Existing Catalog — Complete Inventory

Total as of Phase 7: **38 entries** across 6 categories.

| id | category | Current lightLevel | Current warm | Current cold | Current mode |
|----|----------|--------------------|-------------|-------------|--------------|
| potus | interior | medium_indirect | 7 | 11 | fixed |
| monstera | interior | bright_indirect | 7 | 11 | fixed |
| ficus | interior | bright_indirect | 10 | 15 | fixed |
| sansevieria | interior | medium_indirect | 14 | 21 | fixed |
| orquidea | interior | bright_indirect | 7 | 11 | fixed |
| calathea | interior | medium_indirect | 4 | 6 | fixed |
| cinta | interior | bright_indirect | 5 | 8 | fixed |
| palmera-interior | interior | bright_indirect | 7 | 11 | fixed |
| aloe-vera | interior | direct | 14 | 21 | soil_check |
| espatifilo | interior | medium_indirect | 5 | 8 | fixed |
| dracaena | interior | medium_indirect | 10 | 15 | fixed |
| filodendro | interior | bright_indirect | 7 | 11 | fixed |
| jade | interior | bright_indirect | 14 | 21 | soil_check |
| peperomia | interior | medium_indirect | 10 | 15 | fixed |
| yuca | interior | direct | 10 | 15 | fixed |
| lavanda | exterior | direct | 10 | 17 | fixed |
| petunia | exterior | direct | 2 | 3 | fixed |
| hortensia | exterior | bright_indirect | 3 | 5 | fixed |
| jazmin | exterior | direct | 4 | 7 | fixed |
| geranio | exterior | direct | 3 | 5 | fixed |
| rosa | exterior | direct | 3 | 5 | fixed |
| bougainvillea | exterior | direct | 7 | 12 | fixed |
| hibisco | exterior | direct | 3 | 5 | fixed |
| margarita | exterior | direct | 3 | 5 | fixed |
| albahaca | aromaticas | direct | 2 | 3 | fixed |
| romero | aromaticas | direct | 10 | 15 | fixed |
| menta | aromaticas | bright_indirect | 2 | 3 | fixed |
| perejil | aromaticas | bright_indirect | 2 | 3 | fixed |
| oregano | aromaticas | direct | 7 | 11 | fixed |
| cilantro | aromaticas | bright_indirect | 2 | 3 | fixed |
| tomillo | aromaticas | direct | 10 | 15 | fixed |
| ciboulette | aromaticas | bright_indirect | 3 | 5 | fixed |
| tomatera | huerta | direct | 2 | 3 | fixed |
| pimiento | huerta | direct | 2 | 3 | fixed |
| frutilla | huerta | direct | 2 | 3 | fixed |
| lechuga | huerta | bright_indirect | 2 | 3 | fixed |
| pepino | huerta | direct | 2 | 3 | fixed |
| zanahoria | huerta | direct | 3 | 4 | fixed |
| rucula | huerta | bright_indirect | 2 | 3 | fixed |
| zapallito | huerta | direct | 2 | 3 | fixed |
| limonero | frutales | direct | 5 | 8 | fixed |
| naranjo | frutales | direct | 5 | 8 | fixed |
| mandarino | frutales | direct | 5 | 8 | fixed |
| aguacate | frutales | direct | 5 | 8 | fixed |
| higuera | frutales | direct | 7 | 11 | fixed |
| suculenta-generica | suculentas | direct | 12 | 24 | soil_check |
| cactus | suculentas | direct | 21 | 30 | fixed → soil_check |
| echeveria | suculentas | direct | 10 | 20 | soil_check |
| haworthia | suculentas | bright_indirect | 14 | 28 | soil_check |
| sedum | suculentas | direct | 14 | 28 | soil_check |

**Note on cactus current mode:** Reads `soil_check` in source (line 612); the table above had a notation error from reading. Confirmed `soil_check`.

---

## Expert-Override Table — All 38 Existing Entries

Values marked `=` are unchanged from Phase 4 mechanical mapping. Values with a new number represent expert overrides. Rationale given only for changes.

### INTERIOR

| id | lightLevel | warm | cold | mode | Rationale for change |
|----|------------|------|------|------|----------------------|
| potus | medium_indirect | 7 | **14** | fixed | Phase 4 cold=11 used interior factor 1.5×7=10.5→11. Expert consensus: pothos needs full 2× ratio in cold season (less growth, risk of root rot). cold=14 |
| monstera | bright_indirect | 7 | **14** | fixed | Same tropical 1:2 rule. cold=14 matches Planta/Greg recommendation. Mild adjustment from 11 |
| ficus | bright_indirect | 10 | **15** | fixed | = unchanged. Sturdy houseplant 1:1.5 ratio is correct for Ficus elastica |
| sansevieria | medium_indirect | **14** | **21** | fixed | = unchanged. Sturdy houseplant 14d warm / 21d cold is standard |
| orquidea | bright_indirect | **7** | **14** | fixed | Phalaenopsis: 7d warm matches "soak and dry" weekly; cold should be 14d (2×), not 11. Expert override |
| calathea | **medium_indirect** | **4** | **7** | fixed | Sensitive tropical: 4d warm correct. cold should be 7d (1.75×), not 6. Calatheas hate cold + dry stress |
| cinta | bright_indirect | **5** | **10** | fixed | Chlorophytum: 5d warm correct; cold=10 (2× ratio) more appropriate than 8. Good growth pause in cold |
| palmera-interior | bright_indirect | 7 | **14** | fixed | Chamaedorea: same tropical 1:2. cold=14, not 11 |
| aloe-vera | direct | 14 | **30** | soil_check | Aloe: warm 14d soil_check. cold should be 30d minimum (2× or more). FEATURES.md shows Aloe at 14d/30d |
| espatifilo | **medium_indirect** | 5 | **8** | fixed | = unchanged. Sensitive tropical: 5d/8d (1.6×) is acceptable but could be 5/7. Keep as-is; it's within range |
| dracaena | medium_indirect | **14** | **21** | fixed | Phase 4 had 10/15. Dracaena fragrans is a sturdy houseplant — expert consensus 14d warm. Override warm=14, cold=21 |
| filodendro | bright_indirect | 7 | **14** | fixed | Tropical houseplant: 7/14 correct. Override cold from 11→14 |
| jade | bright_indirect | 14 | **30** | soil_check | Crassula: FEATURES.md shows 14d/30d+. cold=30 (was 21). soil_check confirmed |
| peperomia | medium_indirect | **10** | **15** | fixed | = unchanged. Semi-succulent interior: 10/15 is appropriate |
| yuca | direct | 10 | **21** | fixed | Yucca elephantipes: drought-tolerant. cold should be 21d (2.1×), not 15. More extreme winter rest |

**Interior summary of expert overrides:** monstera cold 11→14, orquidea cold 11→14, calathea cold 6→7, cinta cold 8→10, palmera-interior cold 11→14, aloe-vera cold 21→30, dracaena warm 10→14 + cold 15→21, filodendro cold 11→14, jade cold 21→30, yuca cold 15→21, potus cold 11→14.

### EXTERIOR

| id | lightLevel | warm | cold | mode | Rationale for change |
|----|------------|------|------|------|----------------------|
| lavanda | → renamed `lavanda-angustifolia` | 10 | **21** | fixed | Mediterranean drought-tolerant: cold=21 (2.1×). Phase 4 cold=17 too frequent |
| petunia | direct | 2 | **4** | fixed | Garden flower (annual): 2/4 (2:1 ratio). Phase 4 cold=3 too short |
| hortensia | bright_indirect | 3 | **7** | fixed | Hydrangea: heavy water needs warm, significant reduction cold. 3/7 (2.3×) |
| jazmin | direct | 4 | **10** | fixed | Mediterranean trepadora: cold watering drastically reduced. 4/10 (2.5×); Phase 4 cold=7 too frequent |
| geranio | direct | 3 | **7** | fixed | Pelargonium: 3/7 (2.3×). Phase 4 cold=5 too short. Geranios need real dry period |
| rosa | direct | 3 | **7** | fixed | Garden rose: 3/7 (2.3×). Same logic as geranio. Phase 4 cold=5 too short |
| bougainvillea | direct | 7 | **21** | fixed | Drought-tolerant trellis: warm=7 already correct (stress = more flowers). cold=21 (3×). Phase 4 cold=12 too frequent |
| hibisco | direct | 3 | **7** | fixed | Tropical outdoor: 3/7 (2.3×). Phase 4 cold=5 |
| margarita | direct | 3 | **7** | fixed | Garden perennial: 3/7. Phase 4 cold=5 |

**Exterior summary:** All except bougainvillea adjusted cold upward for more authentic Mediterranean/outdoor dry season behavior. Bougainvillea gets the most dramatic override (cold 12→21).

### AROMATICAS

| id | lightLevel | warm | cold | mode | Rationale for change |
|----|------------|------|------|------|----------------------|
| albahaca | direct | 2 | **4** | fixed | Annual tender herb: 2/4 (2:1). Phase 4 cold=3 |
| romero | direct | 10 | **21** | fixed | Mediterranean: cold=21 (2.1×). Phase 4 cold=15 |
| menta | bright_indirect | 2 | **4** | fixed | Tender herb: 2/4. Phase 4 cold=3. Note: menta prefers higher humidity and consistent moisture |
| perejil | bright_indirect | 2 | **4** | fixed | Tender herb: 2/4. Phase 4 cold=3 |
| oregano | direct | 7 | **14** | fixed | Mediterranean: 7/14 (2:1). Phase 4 cold=11 |
| cilantro | bright_indirect | 2 | **4** | fixed | Tender herb: 2/4. Phase 4 cold=3 |
| tomillo | direct | 10 | **21** | fixed | Mediterranean: cold=21. Phase 4 cold=15 |
| ciboulette | bright_indirect | 3 | **6** | fixed | Perennial allium: 3/6 (2:1). Phase 4 cold=5 |

### HUERTA

| id | lightLevel | warm | cold | mode | Rationale for change |
|----|------------|------|------|------|----------------------|
| tomatera | direct | 2 | **3** | fixed | = unchanged. Huerta warm/cold factor 1.3× is correct for summer annual |
| pimiento | direct | 2 | **3** | fixed | = unchanged |
| frutilla | direct | 2 | **3** | fixed | = unchanged |
| lechuga | bright_indirect | 2 | **3** | fixed | = unchanged. Lechuga prefers cool; cold season is actually growing season |
| pepino | direct | 2 | **3** | fixed | = unchanged. Summer crop |
| zanahoria | direct | 3 | **4** | fixed | = unchanged |
| rucula | bright_indirect | 2 | **3** | fixed | = unchanged |
| zapallito | direct | 2 | **3** | fixed | = unchanged |

**Huerta note:** All huerta entries keep Phase 4 values. The 1.3× factor is accurate — huerta crops are warm-season and often done before winter; the cold schedule is a light adjustment for cool-but-not-frozen growing conditions (spring/autumn shoulder seasons in BA).

### FRUTALES

| id | lightLevel | warm | cold | mode | Rationale for change |
|----|------------|------|------|------|----------------------|
| limonero | direct | 5 | **10** | fixed | = unchanged. Citrus 1:2 from FEATURES.md |
| naranjo | direct | 5 | **10** | fixed | = unchanged |
| mandarino | direct | 5 | **10** | fixed | = unchanged |
| aguacate | direct | 5 | **10** | fixed | = unchanged |
| higuera | direct | 7 | **14** | fixed | = mostly unchanged. Phase 4 had 7/11. Expert: higuera needs 14d cold (dormant in winter). Override cold 11→14 |

### SUCULENTAS

| id | lightLevel | warm | cold | mode | Rationale for change |
|----|------------|------|------|------|----------------------|
| suculenta-generica | direct | 12 | **24** | soil_check | = unchanged |
| cactus | direct | 21 | **30** | soil_check | = unchanged. Already soil_check |
| echeveria | direct | 10 | **20** | soil_check | = unchanged |
| haworthia | **bright_indirect** | 14 | **28** | soil_check | lightLevel already correct (bright_indirect — unique among suculentas). Values unchanged |
| sedum | direct | 14 | **28** | soil_check | = unchanged |

---

## Lavender Split — 3 Variant Table (CAT-03)

Horticultural basis: Lavandula angustifolia is the cold-hardiest (USDA zones 5-8); Lavandula stoechas (French lavender) and Lavandula dentata are zones 8-10, distinctly less cold-tolerant and preferring more warmth. Reference: RHS, Missouri Botanical Garden, ASPCA Plant Database.

### Transformation

| Action | Entry | id | _aliases |
|--------|-------|----|---------|
| Rename + keep | Existing lavanda → canonical | `lavanda-angustifolia` | `["lavanda"]` |
| New entry | Lavanda francesa | `lavanda-stoechas` | — |
| New entry | Lavanda dentada | `lavanda-dentada` | — |

### Care Table

| Variant | Scientific | lightLevel | warm | cold | mode | Cold tolerance | Distinguishing notes |
|---------|-----------|------------|------|------|------|----------------|----------------------|
| lavanda-angustifolia | Lavandula angustifolia | direct | 10 | 21 | fixed | Hardy to -15°C; genuine cold rest period reduces watering further | Classic English lavender; most aromatic; best for BA winters |
| lavanda-stoechas | Lavandula stoechas | direct | 7 | 14 | fixed | Hardy to -5°C only; prefers warm summers | Distinctive "rabbit ear" bracts; blooms spring; shorter drought tolerance than angustifolia |
| lavanda-dentada | Lavandula dentata | direct | 7 | 14 | fixed | Hardy to -5°C; similar to stoechas | Serrated (dentate) leaves; near-continuous bloom; most heat-tolerant of the three |

**Cold-tolerance encoding into schedule:** angustifolia cold=21 (very sparse in winter — plants can tolerate months without rain); stoechas/dentada cold=14 (still reduced but needs more moisture in winter, less adapted to frost). This directly encodes horticultural cold-hardiness into the watering model.

**OUTDOOR_TYPE_IDS check:** All three lavender variants are `category: "exterior"` — already in `OUTDOOR_TYPE_IDS`. LightLevelPicker will show outdoor labels. No change needed to `OUTDOOR_TYPE_IDS`.

---

## 14 New Outdoor Plant Entries

Full new-model fields for all 14. ES content is primary (Argentine voseo). EN content noted as simplified translation. Both must land in `en/plants.json` and `es/plants.json`.

**Category assignment note:** All 14 are either `exterior`, `aromaticas`, or `huerta` — all in `OUTDOOR_TYPE_IDS`. No change needed to the set.

### 1. Jacarandá (`jacarandá`)
- **id:** `jacaranda` (no accent in slug for safety; display name uses accent via i18n key)
- **Scientific:** Jacaranda mimosifolia
- **Category:** `exterior`
- **Icon:** `🌳`
- **lightLevel:** `direct`
- **warm:** 14 | **cold:** 30 | **mode:** `fixed`
- **ES name:** Jacarandá
- **ES tip (voseo):** Regala poco una vez establecida; aguanta sequía de verano y florece en noviembre sin necesitarla.
- **ES description:** El Jacarandá es el árbol más emblemático de Buenos Aires, que pinta la ciudad de violeta en noviembre. Es un árbol grande, ideal para jardines amplios o veredas. Una vez establecido, tolera sequía estival y necesita pocas atenciones.
- **ES problems:** `[{ symptom: "No florece", cause: "Árbol joven o exceso de riego", solution: "Necesita varios años para florecer; reducí el riego y dejalo estresarse un poco en verano." }, { symptom: "Hojas amarillas prematuras", cause: "Encharcamiento o suelo pobre en hierro", solution: "Mejorá el drenaje y aplicá quelato de hierro si el suelo es alcalino." }]`
- **ES nutrients:** `{ type: "Bajo, tolerante a suelos pobres", homemade: "Compost maduro una vez al año en primavera" }`
- **Confidence:** MEDIUM (horticultural reference; BA-specific behavior well-documented)

### 2. Ceibo (`ceibo`)
- **Scientific:** Erythrina crista-galli
- **Category:** `exterior`
- **Icon:** `🌺`
- **lightLevel:** `direct`
- **warm:** 10 | **cold:** 21 | **mode:** `fixed`
- **ES name:** Ceibo
- **ES tip (voseo):** Podalo después de la floración para que no se vuelva leñoso. Florece en verano, especialmente cerca del agua.
- **ES description:** El Ceibo es la flor nacional argentina, un árbol o arbusto que crece naturalmente en las orillas de ríos y lagunas. Sus flores rojas escarlatas son espectaculares en verano. Muy resistente y fácil de cultivar una vez establecido.
- **ES problems:** `[{ symptom: "No florece", cause: "Árbol joven o poca luz", solution: "Necesita sol pleno; los ejemplares jóvenes tardan 2-3 años en florecer." }, { symptom: "Hojas con manchas amarillas", cause: "Riego excesivo en suelo sin drenaje", solution: "Mejorá el drenaje; el ceibo tolera humedad pero no el encharcamiento permanente." }]`
- **ES nutrients:** `{ type: "Moderado, fósforo para floración", homemade: "Té de banana mensual en primavera-verano" }`
- **Confidence:** MEDIUM

### 3. Glicina (`glicina`)
- **Scientific:** Wisteria sinensis
- **Category:** `exterior`
- **Icon:** `💜`
- **lightLevel:** `direct`
- **warm:** 7 | **cold:** 21 | **mode:** `fixed`
- **ES name:** Glicina
- **ES tip (voseo):** Podala fuerte en invierno y en verano (poda verde) para que concentre energía en florecer. Sin poda, crece sin control.
- **ES description:** La Glicina es una trepadora espectacular con cascadas de flores lila perfumadas en primavera. Puede vivir décadas y volverse enorme. Necesita una estructura muy resistente para sostenerse y podas regulares para florecer bien.
- **ES problems:** `[{ symptom: "No florece", cause: "Exceso de nitrógeno o falta de poda", solution: "Evitá fertilizantes nitrogenados; podala en invierno y veranos con poda verde." }, { symptom: "Crecimiento invasivo", cause: "Es su naturaleza", solution: "Podala dos veces al año sin excepción para mantenerla contenida." }]`
- **ES nutrients:** `{ type: "Bajo en nitrógeno, fósforo para floración", homemade: "Ceniza de madera + té de banana en primavera" }`
- **Confidence:** MEDIUM

### 4. Gardenia (`gardenia`)
- **Scientific:** Gardenia jasminoides
- **Category:** `exterior`
- **Icon:** `🤍`
- **lightLevel:** `bright_indirect`
- **warm:** 3 | **cold:** 7 | **mode:** `fixed`
- **ES name:** Gardenia
- **ES tip (voseo):** Usá agua sin cloro y nunca mojes las flores. Es exigente, pero el perfume vale el esfuerzo.
- **ES description:** La Gardenia es famosa por sus flores blancas de perfume intenso. Es una planta exigente que necesita acidez del suelo, agua sin cloro, alta humedad y protección del frío intenso. Cuando florece, es una de las más hermosas del jardín.
- **ES problems:** `[{ symptom: "Botones que se caen antes de abrir", cause: "Cambio brusco de temperatura, corrientes de aire o riego irregular", solution: "Mantenela en un lugar estable sin corrientes; riego constante sin encharcamiento." }, { symptom: "Hojas amarillas con nervios verdes", cause: "Clorosis por suelo alcalino o falta de hierro", solution: "Acidificá el sustrato y aplicá quelato de hierro." }, { symptom: "Flores marrones antes de abrirse", cause: "Humedad excesiva sobre los pétalos", solution: "Nunca mojes las flores; pulverizá solo el follaje." }]`
- **ES nutrients:** `{ type: "Ácido, hierro y magnesio", homemade: "Borra de café semanal + agua acidificada con vinagre (1 cda/L)" }`
- **lightLevel rationale:** Gardenia prefers bright indirect light — direct afternoon sun bleaches flowers and stresses the plant. FEATURES.md "garden flower" pattern doesn't perfectly apply; gardenia is more like a sensitive tropical.
- **Confidence:** HIGH (well-documented exigent care; bright_indirect confirmed by RHS, Gardenia.net)

### 5. Camelia (`camelia`)
- **Scientific:** Camellia japonica
- **Category:** `exterior`
- **Icon:** `🌸`
- **lightLevel:** `bright_indirect`
- **warm:** 7 | **cold:** 14 | **mode:** `fixed`
- **ES name:** Camelia
- **ES tip (voseo):** Plantala donde no le llegue el sol de la tarde; las flores se queman con el calor de mediodía. Florece en invierno, ¡cuando la mayoría del jardín duerme!
- **ES description:** La Camelia es un arbusto de flor invernal con pétalos perfectos en rosa, blanco y rojo. Prefiere semisombra, suelos ácidos y protección del sol fuerte. En Buenos Aires florece de otoño a primavera, llenando el jardín de color en los meses más fríos.
- **ES problems:** `[{ symptom: "Flores marrones y caídas", cause: "Sol directo del mediodía o lluvia sobre flores", solution: "Plantala con orientación este; el sol de mañana es ideal." }, { symptom: "Hojas con manchas amarillas", cause: "pH alto del suelo", solution: "Acidificá con sulfato de aluminio o sustrato para azaleas." }, { symptom: "No florece", cause: "Suelo muy alcalino o exceso de nitrógeno", solution: "Ajustá el pH a 5.5-6.5 y usá fertilizante bajo en nitrógeno." }]`
- **ES nutrients:** `{ type: "Ácido, bajo en nitrógeno", homemade: "Borra de café mensual + agua de lluvia cuando sea posible" }`
- **lightLevel rationale:** Camellia: bright_indirect — morning sun, afternoon shade is the expert recommendation. Confirmed by multiple sources.
- **Confidence:** HIGH

### 6. Dalia (`dalia`)
- **Scientific:** Dahlia spp.
- **Category:** `exterior`
- **Icon:** `🌸`
- **lightLevel:** `direct`
- **warm:** 3 | **cold:** 7 | **mode:** `fixed`
- **ES name:** Dalia
- **ES tip (voseo):** En otoño, cuando las hojas se ponen negras por la helada, desenterrá los tubérculos, sécalos y guardalos en un lugar fresco y seco hasta primavera.
- **ES description:** Las Dalias son las reinas del jardín estival con flores enormes en todos los colores y formas. Son tuberosas que se plantan en primavera y florecen de verano a otoño. En climas fríos los tubérculos deben desenterrarse para invernar. Aportan un color espectacular al jardín.
- **ES problems:** `[{ symptom: "Pulgones en brotes", cause: "Plaga muy común", solution: "Tratá con jabón potásico o aceite de neem; las mariquitas son aliadas naturales." }, { symptom: "Manchas grises en hojas", cause: "Oídio por humedad y poca ventilación", solution: "Mejorá la circulación de aire y tratá con bicarbonato de sodio diluido." }, { symptom: "Flores pequeñas", cause: "Falta de nutrientes o planta muy tupida", solution: "Fertilizá con alto fósforo y eliminá algunos brotes para concentrar energía." }]`
- **ES nutrients:** `{ type: "Alto en fósforo y potasio", homemade: "Té de banana semanal durante floración" }`
- **Confidence:** HIGH

### 7. Salvia Ornamental (`salvia-ornamental`)
- **Scientific:** Salvia splendens / Salvia nemorosa
- **Category:** `exterior`
- **Icon:** `🌿`
- **lightLevel:** `direct`
- **warm:** 7 | **cold:** 14 | **mode:** `fixed`
- **ES name:** Salvia ornamental
- **ES tip (voseo):** Quitá las flores viejas para que siga produciendo nuevas. Muy resistente a la sequía una vez establecida; no la riegues de más.
- **ES description:** La Salvia ornamental atrae colibríes y mariposas con sus espigas floridas en azul, violeta o rojo. Es una planta perenne o anual según la variedad, muy resistente al calor y la sequía. Ideal para jardines de polinizadores y bordes de canteros.
- **ES problems:** `[{ symptom: "Hojas amarillas en la base", cause: "Exceso de riego o suelo que no drena", solution: "Mejorá el drenaje; la salvia prefiere secarse entre riegos." }, { symptom: "Pocas flores", cause: "Falta de poda o poca luz", solution: "Quitá flores viejas regularmente y asegurá sol pleno." }]`
- **ES nutrients:** `{ type: "Moderado, fósforo para floración", homemade: "Compost ligero anual en primavera" }`
- **Confidence:** MEDIUM

### 8. Cala (`cala`)
- **Scientific:** Zantedeschia aethiopica
- **Category:** `exterior`
- **Icon:** `🤍`
- **lightLevel:** `bright_indirect`
- **warm:** 5 | **cold:** 10 | **mode:** `fixed`
- **ES name:** Cala
- **ES tip (voseo):** Plantala en semisombra y mantené el suelo húmedo; en verano caliente necesita más agua. Florece mejor con algo de frío invernal.
- **ES description:** La Cala o Cartucho es una planta elegante con flores en forma de embudo, blancas y puras. Crece desde un rizoma y prefiere suelos húmedos, incluso aguanta estar cerca del agua. Florece en primavera y principios del verano. En jardines argentinos es un clásico de la sombra y semisombra.
- **ES problems:** `[{ symptom: "Hojas amarillas", cause: "Exceso de luz solar directa o falta de riego", solution: "Movilala a semisombra y mantené el sustrato húmedo." }, { symptom: "No florece", cause: "Rizoma no tuvo período de reposo", solution: "En otoño, reducí el riego para que la planta descanse antes del invierno." }, { symptom: "Manchas oscuras en hojas", cause: "Bacteria Erwinia o encharcamiento", solution: "Mejorá el drenaje y evitá que el agua quede estancada en la axila de las hojas." }]`
- **ES nutrients:** `{ type: "Nitrógeno y fósforo equilibrado", homemade: "Agua de arroz + compost de lombrices cada 15 días en floración" }`
- **lightLevel rationale:** Cala fills the semi-shade gap in the exterior catalog — `bright_indirect` is confirmed. Direct sun burns the large leaves.
- **Confidence:** HIGH (cala is well-studied; semi-shade preference well-documented)

### 9. Copete / Tagetes (`copete`)
- **Scientific:** Tagetes patula / Tagetes erecta
- **Category:** `exterior`
- **Icon:** `🌼`
- **lightLevel:** `direct`
- **warm:** 3 | **cold:** 5 | **mode:** `fixed`
- **ES name:** Copete
- **ES tip (voseo):** Plantalo cerca de tomates y pimientos — repele nematodos y pulgones. Quitá las flores secas para que siga floreciendo toda la temporada.
- **ES description:** El Copete o Tagetes es una flor anual de verano que cumple doble función: decora con sus flores amarillas y naranjas, y protege la huerta de plagas como nematodos y pulgones. Fácil de cultivar, resistente al calor y de crecimiento rápido. Ideal para bordes de canteros y macetas.
- **ES problems:** `[{ symptom: "Hojas plateadas o manchadas", cause: "Araña roja en condiciones de calor y sequía", solution: "Regá más frecuentemente y tratá con jabón potásico." }, { symptom: "Pocas flores", cause: "Falta de sol o flores no removidas", solution: "Asegurá 6+ horas de sol y quitá las flores marchitas regularmente." }]`
- **ES nutrients:** `{ type: "Moderado, fósforo para floración", homemade: "Té de banana quincenal durante la floración" }`
- **Confidence:** HIGH

### 10. Verbena (`verbena`)
- **Scientific:** Verbena bonariensis
- **Category:** `exterior`
- **Icon:** `💜`
- **lightLevel:** `direct`
- **warm:** 7 | **cold:** 14 | **mode:** `fixed`
- **ES name:** Verbena
- **ES tip (voseo):** Tolerá que se auto-siembre; la verbena bonariensis rebrota sola cada año. Cortá las flores secas para prolongar la floración.
- **ES description:** La Verbena bonariensis es una planta nativa argentina que atrae mariposas y abejas con sus pequeñas flores violetas en tallos delgados y altos. Muy tolerante a la sequía y casi sin necesidad de cuidado una vez establecida. Se auto-siembra, lo que la convierte en una perenne práctica.
- **ES problems:** `[{ symptom: "Oídio en hojas", cause: "Humedad alta + poca ventilación", solution: "Mejorá la circulación de aire y evitá mojar las hojas al regar." }, { symptom: "Pocas flores", cause: "Suelo demasiado fértil", solution: "La verbena florece mejor en suelos pobres; evitá exceso de fertilizante nitrogenado." }]`
- **ES nutrients:** `{ type: "Muy bajo, suelo pobre es preferible", homemade: "Compost mínimo una vez al año" }`
- **Confidence:** MEDIUM (Verbena bonariensis specifically is native Argentine; care data from INTA-adjacent sources)

### 11. Lavanda Francesa / Stoechas (`lavanda-stoechas`)
See §Lavender Split above. Full entry:
- **lightLevel:** `direct` | **warm:** 7 | **cold:** 14 | **mode:** `fixed`
- **ES name:** Lavanda francesa
- **ES tip (voseo):** Elegila si tu invierno es suave. No tolera heladas fuertes como la lavanda inglesa, pero florece más en primavera y es más decorativa con sus brácteas en "orejas de conejo".
- **ES description:** La Lavanda francesa (Lavandula stoechas) se distingue por sus brácteas moradas en forma de orejas de conejo sobre cada flor. Es más amante del calor que la lavanda inglesa y florece abundantemente en primavera. Ideal para climas con inviernos suaves.
- **ES problems:** `[{ symptom: "Muerte en invierno", cause: "Heladas bajo -5°C", solution: "Cubría con tela antigranizo o llevala en maceta al interior si se esperan heladas fuertes." }, { symptom: "Planta leñosa sin flores", cause: "Falta de poda", solution: "Podá un tercio después de cada floración para que rejuvenezca." }]`
- **ES nutrients:** `{ type: "Muy bajo, suelo pobre bien drenado", homemade: "Sin fertilizante; un poco de compost una vez al año" }`

### 12. Lavanda Dentada (`lavanda-dentada`)
See §Lavender Split above. Full entry:
- **lightLevel:** `direct` | **warm:** 7 | **cold:** 14 | **mode:** `fixed`
- **ES name:** Lavanda dentada
- **ES tip (voseo):** Es la más calurosa de las lavandas. Florece casi todo el año en climas cálidos. Reconocela por sus hojas con bordes dentados o aserrados.
- **ES description:** La Lavanda dentada (Lavandula dentata) tiene hojas con bordes festoneados que la distinguen visualmente. Es la variedad más tolerante al calor y la más sensible al frío de las tres. En climas templados-cálidos puede florecer prácticamente todo el año con podas regulares.
- **ES problems:** `[{ symptom: "Muerte invernal", cause: "Heladas fuertes (-5°C)", solution: "Plantala en el lugar más abrigado del jardín o en maceta para moverla en invierno." }, { symptom: "Hojas grises pálidas", cause: "Exceso de humedad o riego frecuente", solution: "Reducí el riego; prefiere condiciones secas entre riegos." }]`
- **ES nutrients:** `{ type: "Muy bajo, suelo bien drenado y pobre", homemade: "Sin fertilizante; un poco de compost una vez al año" }`

### 13. Romero Rastrero (`romero-rastrero`)
- **Scientific:** Salvia rosmarinus 'Prostratus'
- **Category:** `aromaticas`
- **Icon:** `🌿`
- **lightLevel:** `direct`
- **warm:** 10 | **cold:** 21 | **mode:** `fixed`
- **ES name:** Romero rastrero
- **ES tip (voseo):** Ideal para balcones y muros; crece colgando. Regalo muy poco y dale todo el sol que puedas. Mismo cuidado que el romero erecto pero más decorativo en altura.
- **ES description:** El Romero rastrero es una variedad de romero de porte postrado que en lugar de crecer hacia arriba, se extiende horizontalmente o cae en cascada. Perfecto para macetas colgantes, terrazas o para cubrir muros. Tan resistente y aromático como el romero común, con una silueta más decorativa.
- **ES problems:** `[{ symptom: "Ramas secas en la base", cause: "Exceso de riego o mala ventilación", solution: "Cortá las partes secas, mejorá el drenaje y espaciá los riegos." }, { symptom: "Poco aroma", cause: "Suelo demasiado fértil o sombra excesiva", solution: "Suelo pobre y sol pleno intensifican los aceites esenciales." }]`
- **ES nutrients:** `{ type: "Muy bajo, suelo pobre", homemade: "Sin fertilizante; compost ligero una vez al año" }`
- **Confidence:** MEDIUM (variant of well-documented rosemary; 'Prostratus' care identical to upright rosemary)

### 14. Tomate Cherry (`tomate-cherry`)
- **Scientific:** Solanum lycopersicum cerasiforme
- **Category:** `huerta`
- **Icon:** `🍅`
- **lightLevel:** `direct`
- **warm:** 2 | **cold:** 3 | **mode:** `fixed`
- **ES name:** Tomate cherry
- **ES tip (voseo):** Los tomates cherry son indeterminados — siguen creciendo toda la temporada. Poneles un tutor alto y quitá los chupones laterales para que concentren energía en los frutos.
- **ES description:** El Tomate cherry produce pequeños tomates dulces en racimos abundantes durante todo el verano. Es indeterminado, lo que significa que sigue creciendo y produciendo hasta las heladas. Ideal para macetas grandes (mínimo 30L), balcones y huertas pequeñas. Necesita menos espacio que la tomatera grande pero el mismo cuidado.
- **ES problems:** `[{ symptom: "Frutos que se parten", cause: "Riego irregular (seco y luego muy abundante)", solution: "Mantené el riego constante; los cambios bruscos de humedad causan el rajado." }, { symptom: "Podredumbre apical (culo negro)", cause: "Falta de calcio o riego irregular", solution: "Riego constante + cáscaras de huevo trituradas al sustrato." }, { symptom: "Mosca blanca en envés de hojas", cause: "Plaga frecuente en verano", solution: "Tratá con jabón potásico o aceite de neem; introducí crisópas si es posible." }]`
- **ES nutrients:** `{ type: "Alto en potasio durante fructificación", homemade: "Té de banana semanal cuando empiezan los frutos" }`
- **Confidence:** HIGH (tomate cherry well-documented; FEATURES.md rationale for distinct entry from tomatera confirmed)

---

## getCatalogEntry Lookup Helper

### Signature

```typescript
// Source: src/data/plantDatabase.ts (new export, co-located with PLANT_DATABASE)
export function getCatalogEntry(slug: string): PlantDBEntry | null
```

### Implementation Pattern

```typescript
export function getCatalogEntry(slug: string): PlantDBEntry | null {
  // 1. Check canonical id first (O(N) scan but N < 60; no cache needed)
  const canonical = PLANT_DATABASE.find(e => e.id === slug);
  if (canonical) return canonical;

  // 2. Scan _aliases arrays
  const aliased = PLANT_DATABASE.find(e => e._aliases?.includes(slug));
  if (aliased) return aliased;

  // 3. Not found — log in dev, return null
  if (__DEV__) {
    console.warn(`[getCatalogEntry] slug "${slug}" not found in PLANT_DATABASE`);
  }
  return null;
}
```

**Performance:** O(N) where N ≤ 60. At 60 entries, a JS array scan is microseconds. Cache-on-first-call would add complexity (cache invalidation, hot reload in Expo) without meaningful benefit. Keep O(N) linear.

**Id-before-alias invariant:** Canonical id check MUST come first. If somehow an entry's canonical id matched another entry's alias (data error), canonical wins. This prevents confusion on data bugs.

### Consumer Migration Pattern

All read-site consumers follow the same swap:

```typescript
// BEFORE (reads from Plant instance, stale copy risk)
<Text>{plant.tip}</Text>
<Text>{plant.description}</Text>
{plant.problems.map(...)}
{plant.nutrients && ...}

// AFTER (live lookup from catalog)
const entry = plant.databaseId ? getCatalogEntry(plant.databaseId) : null;
const translatedEntry = entry ? getTranslatedPlant(entry) : null;
<Text>{translatedEntry?.tip ?? ''}</Text>
<Text>{translatedEntry?.description ?? ''}</Text>
{(translatedEntry?.problems ?? []).map(...)}
{translatedEntry?.nutrients && ...}
```

**Key field name:** `Plant.databaseId` (not `dbId`) — confirmed from `src/types/index.ts` line 56 and `src/utils/plantInfo.ts` line 34. The CONTEXT.md used "dbId" loosely; the actual field is `databaseId`.

### Read-Site Consumer Map

| File | Current pattern | Migration |
|------|----------------|-----------|
| `PlantDetailModal.tsx` | `plant.description`, `plant.tip`, `plant.nutrients`, `plant.problems` (PlantDBEntry passed directly) | Already consumes PlantDBEntry; just add `getCatalogEntry` call if entry may be stale |
| `MyPlantDetailModal.tsx` | Uses `findDatabaseEntry(plant)` (fuzzy lookup) → `dbEntry.nutrients` | Replace `findDatabaseEntry` with `getCatalogEntry(plant.databaseId)` for canonical lookup |
| `PlantHealthDetail.tsx` | Reads care tips from careTips.ts (not plant.tip directly) | Low impact; verify no direct tip/description reads |
| `PlantIdentifier/IdentificationResults.tsx` | `plant.tip` from identified plant (not catalog) | Not a catalog consumer; skip or keep as-is |
| `PlantDiagnosis/PlantDiagnosisModal.tsx` | `plant.databaseId` already used for waterMode fallback | Phase 8 does NOT change diagnosis modal content per CONTEXT |

**Note on `findDatabaseEntry`:** The existing `findDatabaseEntry()` in `plantInfo.ts` does fuzzy matching (name, typeId). `getCatalogEntry` replaces it at read sites where `databaseId` is available. `findDatabaseEntry` can remain as a fallback for plants without `databaseId` (user-created custom plants).

### alias-rewrite-on-save in `useStorage.updatePlant()`

```typescript
// Current (line 376-381 in useStorage.tsx):
const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
  const newPlants = dataRef.current.plants.map(p =>
    p.id === id ? { ...p, ...updates } : p
  );
  // ...

// Phase 8 addition: if updates includes databaseId, normalize to canonical
const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
  // Auto-migrate alias databaseId to canonical on save (CAT-05)
  const normalizedUpdates = { ...updates };
  if (updates.databaseId) {
    const entry = getCatalogEntry(updates.databaseId);
    if (entry && entry.id !== updates.databaseId) {
      // databaseId was an alias — rewrite to canonical
      normalizedUpdates.databaseId = entry.id;
      if (__DEV__) {
        console.warn(`[updatePlant] aliased databaseId "${updates.databaseId}" → "${entry.id}"`);
      }
    }
  }
  const newPlants = dataRef.current.plants.map(p =>
    p.id === id ? { ...p, ...normalizedUpdates } : p
  );
  // ...
```

This is idempotent: if `databaseId` is already canonical, `entry.id === updates.databaseId` is true and no rewrite happens.

---

## PlantDBEntry Type Update

Add `_aliases` to `PlantDBEntry` in `src/types/index.ts`:

```typescript
// In PlantDBEntry interface (around line 162):
export interface PlantDBEntry {
  // ... existing fields ...
  /** Phase 8 (CAT-05). Legacy slug aliases that resolve to this entry via getCatalogEntry(). */
  _aliases?: string[];
  // ... v1.1 fields ...
}
```

This is a non-breaking additive change. No schema version bump required.

---

## CI Guard Scripts

### `scripts/check-i18n-keys.mjs`

**Purpose (CAT-06):** For every `PLANT_DATABASE` entry `id` (and every `_aliases` entry), verify that both `en/plants.json` and `es/plants.json` contain a complete keyset: `name`, `tip`, `description`, `problems` (array, length ≥ 1), `nutrients` (object if entry has nutrients).

**Design:**
```javascript
// scripts/check-i18n-keys.mjs
import { readFileSync } from 'node:fs';
import { PLANT_DATABASE } from '../src/data/plantDatabase.js'; // compiled by tsc

const en = JSON.parse(readFileSync('./src/i18n/locales/en/plants.json', 'utf8'));
const es = JSON.parse(readFileSync('./src/i18n/locales/es/plants.json', 'utf8'));

const errors = [];
for (const entry of PLANT_DATABASE) {
  const ids = [entry.id, ...(entry._aliases ?? [])];
  for (const id of ids) {
    for (const [locale, dict] of [['en', en], ['es', es]]) {
      const node = dict[id];
      if (!node) { errors.push(`[${locale}] missing key: "${id}"`); continue; }
      if (!node.name) errors.push(`[${locale}] "${id}".name missing`);
      if (!node.tip) errors.push(`[${locale}] "${id}".tip missing`);
      if (!node.description) errors.push(`[${locale}] "${id}".description missing`);
      if (!Array.isArray(node.problems) || node.problems.length < 1)
        errors.push(`[${locale}] "${id}".problems missing or empty`);
      // nutrients optional — only check if entry.nutrients exists
    }
  }
}
if (errors.length > 0) { console.error(errors.join('\n')); process.exit(1); }
console.log('check:i18n-keys PASS');
```

**Implementation note:** Because `plantDatabase.ts` imports from `i18n`, the check script cannot import it directly without transpilation. Options:
1. Use `typescript.transpileModule` (same pattern as smoke-phase06/07) — single compile path policy.
2. Extract `PLANT_DATABASE` ids to a plain JSON file for the check script. More brittle (two SSOT).

**Recommended approach:** Use `typescript.transpileModule` to compile `plantDatabase.ts` with stub i18n module (same pattern established in Phase 5 smoke runner). The stub returns the key as its value for `i18n.t`, which is fine for a keyset check.

### `scripts/check-images.mjs`

**Purpose (CAT-07):** HEAD requests for every `imageUrl` in PLANT_DATABASE. 200 = pass. Else = fail with URL list.

**Design:**
```javascript
// scripts/check-images.mjs — async, network-dependent
const CONCURRENCY = 8;
// ... fetch all imageUrls, HEAD request, collect failures ...
// Exit 1 if any failures. Print URL list.
```

**npm scripts:**
```json
"check:i18n-keys": "node scripts/check-i18n-keys.mjs",
"check:images": "node scripts/check-images.mjs"
```

**Failure mode:** Both scripts exit 1 + print itemised failure list. No warnings-only mode. User fixes → re-runs.

**Known failure at Phase 8 ship:** `check:images` will fail for all 14 new outdoor entries (images not yet uploaded). This is a documented accepted-known-failure — add to `v1_1_test_backlog.md`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Alias-aware lookup | Custom lookup cache | Simple `Array.find` twice (id then _aliases) | N < 60; O(N) is negligible; cache adds complexity |
| i18n key validation | regex parser of JSON | `JSON.parse` + property existence check in Node | JSON.parse handles all edge cases; node built-in |
| HTTP check for images | curl / shell script | Node fetch (built-in since Node 18) | No subprocess overhead; concurrent with Promise.all |
| TypeScript compile for CI | tsc full build | `typescript.transpileModule` (existing pattern) | Matches smoke runner policy; fast, no config file |

---

## Common Pitfalls

### Pitfall 1: i18n Key Rename for lavanda → lavanda-angustifolia

**What goes wrong:** Renaming `lavanda` to `lavanda-angustifolia` in `PLANT_DATABASE` breaks the `getTranslatedPlant()` lookup if the i18n key is not also renamed. The fallback `defaultValue: plant.name` will silently return the Spanish hardcoded name instead of the translated version. No crash — silent wrong language.

**Why it happens:** `getTranslatedPlant` uses `plant.id` as the i18n key. The id rename and the JSON key rename must happen atomically.

**How to avoid:** Rename the JSON key in both `en/plants.json` and `es/plants.json` from `"lavanda"` to `"lavanda-angustifolia"` IN THE SAME COMMIT as the id rename in `plantDatabase.ts`. The `_aliases` field handles runtime lookup but NOT i18n key lookup. `check:i18n-keys` will catch any drift.

**Warning signs:** ES content showing in EN locale for lavanda, or `[plants:lavanda-angustifolia.name]` raw key visible in UI.

### Pitfall 2: `_aliases` Lookup Must Not Match Canonical Id

**What goes wrong:** If a canonical `id` happens to match an `_aliases` value of another entry, the first lookup (canonical) returns the wrong entry.

**How to avoid:** `getCatalogEntry` checks `id` first (canonical), then `_aliases`. The canonical check gates the alias scan — if the slug IS a canonical id, it returns that entry immediately, never scanning aliases. The ordering is the protection.

**Warning signs:** Would only manifest if two entries had the same id (TypeScript catches this as duplicate literal) or if an alias matched a canonical id (data error, check:i18n-keys would surface missing key for the aliased-but-canonical id).

### Pitfall 3: New Outdoor Plants Must Use `category` in OUTDOOR_TYPE_IDS

**What goes wrong:** A new plant with `category: 'exterior'` added to the catalog but with a category value not in `OUTDOOR_TYPE_IDS` would render with indoor light labels ("Luz brillante indirecta" instead of "Sol parcial") in Phase 6/7 consumers.

**How to avoid:** Verify: all 14 new entries use `category` values from `{exterior, aromaticas, huerta}`. These are all already in `OUTDOOR_TYPE_IDS = new Set(['exterior', 'aromaticas', 'huerta', 'frutales'])`. Confirmed for all 14 entries above. No change to `OUTDOOR_TYPE_IDS`.

### Pitfall 4: Plant.databaseId vs Plant.dbId Field Name

**What goes wrong:** CONTEXT.md uses "dbId" as a shorthand but the actual field in `Plant` interface is `databaseId` (line 56 of types/index.ts). Code written with `plant.dbId` will fail TypeScript strict mode.

**How to avoid:** Always use `plant.databaseId` in implementation. Verified from live source. The `getCatalogEntry(plant.databaseId)` call is correct.

### Pitfall 5: cactus waterMode Was Already soil_check

**What goes wrong:** Planning documents noted cactus as needing soil_check. Checking the live source confirms `cactus` already has `waterMode: "soil_check"` from Phase 4 (line 612). No change needed.

**Warning signs:** Trying to "fix" cactus mode when it's already correct causes confusion in task diffs.

### Pitfall 6: Image 404s Before Upload Will Cause check:images to Fail

**What goes wrong:** Phase 8 ships code pointing at URLs that return 404 for 14 new entries. `check:images` will fail. This is expected and documented.

**How to avoid:** Document in `CLAUDE.md` and `v1_1_test_backlog.md` that `check:images` is expected to fail for the 14 new entries until manual upload. Add a `--skip-new` flag OR simply document the known failure list. Per CONTEXT decisions: no auto-fix mode. Accept the failure and document it.

### Pitfall 7: calathea lightLevel Was Already Correct

**What goes wrong:** Some planning descriptions implied calathea might need `lightLevel` correction. Checking the live source: calathea already has `lightLevel: "medium_indirect"` from Phase 4 — which is the expert-correct value (shade lover). No override needed for lightLevel; only `cold` value is adjusted (6→7).

---

## Architecture Patterns

### Recommended File Structure After Phase 8

```
src/data/plantDatabase.ts
  ├── CATALOG_BASE_URL (const)
  ├── PLANT_DATABASE (PlantDBEntry[]) — 52 entries with _aliases where needed
  ├── getCatalogEntry(slug) — NEW
  ├── getTranslatedPlant(entry)
  ├── getTranslatedDatabase()
  ├── getPlantsByCategory(category)
  ├── searchPlants(query)
  └── getPlantById(id) — existing, unchanged (may be deprecated in v1.2 in favor of getCatalogEntry)

scripts/
  ├── check-i18n-keys.mjs — NEW
  ├── check-images.mjs — NEW
  ├── smoke-phase08.mjs — NEW (extends smoke runner pattern)
  └── (existing scripts unchanged)
```

### Smoke Runner Extension (smoke-phase08.mjs)

Follows the Phase 5-7 pattern: `typescript.transpileModule` single compile path, stub i18n imports, assert on exported values.

Phase 8 specific assertions:
1. `getCatalogEntry("lavanda")` returns entry with `id === "lavanda-angustifolia"` (alias resolution)
2. `getCatalogEntry("lavanda-angustifolia")` returns entry with `id === "lavanda-angustifolia"` (canonical)
3. `getCatalogEntry("nonexistent-slug")` returns `null`
4. Every PLANT_DATABASE entry has `lightLevel !== undefined && waterSchedule?.warm && waterSchedule?.cold && waterMode !== undefined`
5. No entry has `cold < warm` (cold must always be ≥ warm)
6. All suculenta entries (suculenta-generica, cactus, echeveria, haworthia, sedum) have `waterMode === 'soil_check'`
7. aloe-vera and jade have `waterMode === 'soil_check'`
8. lavanda-stoechas and lavanda-dentada have `lightLevel === 'direct'` and `cold < angustifolia cold` (i.e., 14 < 21)
9. 14 new entries exist (count check: PLANT_DATABASE.length === 52)
10. i18n key parity check (mirrors check-i18n-keys logic but inline in smoke runner for speed)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `plant.tip` / `plant.description` read from Plant instance (stale copy) | `getCatalogEntry(plant.databaseId)?.tip` live lookup | Phase 8 | Patch updates to catalog propagate to existing user plants on next render |
| `findDatabaseEntry(plant)` fuzzy name/typeId matching | `getCatalogEntry(plant.databaseId)` canonical id lookup | Phase 8 | Deterministic; no false matches by name substring |
| `lavanda` single entry | `lavanda-angustifolia` + `lavanda-stoechas` + `lavanda-dentada` | Phase 8 | Users see distinct variants with accurate cold tolerance; lavanda alias resolves legacy |
| Phase 4 `applyColdFactor` heuristic cold values | Expert-vetted per-entry cold values | Phase 8 | Mediterranean plants get correct 2-3× cold reduction; huerta crops keep 1.3× (correct for their seasonality) |

---

## Validation Architecture

> nyquist_validation is not explicitly false in .planning/config.json (key absent) — include section.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom Node ESM smoke runner (no Jest/Vitest — per CLAUDE.md) |
| Config file | None — scripts are standalone Node ESM modules |
| Quick run command | `node scripts/smoke-phase08.mjs` |
| Full suite command | `node scripts/smoke-phase08.mjs && node scripts/check-i18n-keys.mjs` |
| Image check (slow) | `node scripts/check-images.mjs` (run separately; network-dependent) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIGHT-04 | Every entry has valid lightLevel | unit | `node scripts/smoke-phase08.mjs` — assertion 4 | ❌ Wave 0 |
| WATER-07 | Every entry has warm/cold; cold ≥ warm | unit | `node scripts/smoke-phase08.mjs` — assertions 4+5 | ❌ Wave 0 |
| CAT-01 | All entries have lightLevel + waterSchedule + waterMode | unit | `node scripts/smoke-phase08.mjs` — assertion 4 | ❌ Wave 0 |
| CAT-02 | 14 new entries exist | unit | `node scripts/smoke-phase08.mjs` — assertion 9 (count=52) | ❌ Wave 0 |
| CAT-03 | Lavender 3-variant exists; angustifolia cold > stoechas cold | unit | `node scripts/smoke-phase08.mjs` — assertion 8 | ❌ Wave 0 |
| CAT-04 | getCatalogEntry returns live entry (content not stale) | manual | Render plant, patch tip in catalog, hot-reload, verify update | N/A |
| CAT-05 | getCatalogEntry("lavanda") resolves to lavanda-angustifolia | unit | `node scripts/smoke-phase08.mjs` — assertions 1+2+3 | ❌ Wave 0 |
| CAT-06 | i18n keyset parity per id | unit | `node scripts/check-i18n-keys.mjs` | ❌ Wave 0 |
| CAT-07 | imageUrl returns 200 OK | integration | `node scripts/check-images.mjs` | ❌ Wave 0 |
| CAT-08 | soil_check entries correct; no cold < warm | unit | `node scripts/smoke-phase08.mjs` — assertions 5+6+7 | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `node scripts/smoke-phase08.mjs`
- **Per wave merge:** `node scripts/smoke-phase08.mjs && node scripts/check-i18n-keys.mjs && npx tsc --noEmit`
- **Phase gate:** All three commands green + `check:images` documented failures acceptable before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/smoke-phase08.mjs` — covers LIGHT-04, WATER-07, CAT-01, CAT-02, CAT-03, CAT-05, CAT-08
- [ ] `scripts/check-i18n-keys.mjs` — covers CAT-06; registered as `npm run check:i18n-keys`
- [ ] `scripts/check-images.mjs` — covers CAT-07; registered as `npm run check:images`

---

## Sources

### Primary (HIGH confidence)

- Live source: `src/data/plantDatabase.ts` — 38 entries read directly; all fields confirmed from source
- Live source: `src/types/index.ts` — `PlantDBEntry`, `Plant.databaseId` field name confirmed
- Live source: `src/utils/plantInfo.ts` — `findDatabaseEntry()` pattern confirmed
- Live source: `src/hooks/useStorage.tsx` — `updatePlant()` signature confirmed (lines 376-381)
- Live source: `src/utils/lightLabel.ts` — `OUTDOOR_TYPE_IDS` confirmed
- `.planning/research/FEATURES.md` — Watering ratio table: tropical 7/14, sensitive tropical 4-5/7, sturdy 14/21, Mediterranean 7-10/14, tender herb 2/4, garden flower 2-3/5-7, drought-tolerant outdoor 7-10/14-21, citrus 5/10, suculentas soil_check, aloe 14/30, jade 14/30+
- `.planning/phases/08-catalog-rebalance/08-CONTEXT.md` — All locked decisions

### Secondary (MEDIUM confidence)

- RHS (Royal Horticultural Society) — lavender variety cold-hardiness zones: angustifolia zones 5-8 (-26°C), stoechas zones 8-9 (-12°C), dentata zones 8-10 (-9°C)
- Missouri Botanical Garden plant finder — lavender care confirmed
- Gardenia.net — Camellia japonica care: bright_indirect, acid soil confirmed
- FEATURES.md cites: Planta (getplanta.com), Soltech, Greenery Unlimited, Patch — 4-level light + seasonal ratios
- INTA-adjacent references for Argentine LATAM outdoor plants (jacarandá, ceibo, verbena bonariensis) — regional behavior cross-referenced with FEATURES.md catalog gaps table

### Tertiary (LOW confidence)

- Specific day counts for new entries (jacarandá, ceibo, glicina, salvia ornamental, verbena, cala, copete) derived from category archetype matching (FEATURES.md tables), not species-specific literature. Marked as MEDIUM overall because archetype matching is well-established for these categories.

---

## Metadata

**Confidence breakdown:**
- Existing entries (38): HIGH — values read from live source; overrides grounded in FEATURES.md watering-ratio table
- New entries care values: MEDIUM — archetype-matched to FEATURES.md categories; species-specific deep literature not consulted
- Lavender cold-tolerance split: HIGH — RHS/Missouri Botanical Garden primary sources; well-established horticultural fact
- Code patterns (getCatalogEntry, alias, updatePlant): HIGH — read from live source, pattern matches established Phase 5-7 conventions
- CI guard script design: HIGH — follows established smoke-runner pattern from live scripts

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (catalog data stable; patterns stable; new entry content may be refined before ship)
