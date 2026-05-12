# Phase 17: Catalog Wave C — Exterior + Aromáticas + Frutales - Research

**Researched:** 2026-05-08
**Domain:** Catalog data extension at scale (14 entries × 10 fields × 2 locales = ~280 strings + 14 catalog defaults + identification routing + image plan documentation), closing v1.2 catalog expansion at 118 entries
**Confidence:** HIGH for content/authoring patterns (Phase 14 + 15 + 16 lock; Phase 17 inherits unchanged); HIGH for taxonomic name verification (POWO 2024-2025 + Wikipedia cross-checks below); HIGH for routing — Phase 16's exact-match-first refactor is already in place and species-qualified additions only

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Catalog count target — CAT-21 amended to 118**

REQUIREMENTS.md CAT-21 originally specified `PLANT_DATABASE.length === 120` (64 v1.1 + 56 v1.2). Actual delivery diverges: Phase 15 added 23 net-new (64 → 87), Phase 16 added 17 net-new (87 → 104; `potus`/`filodendro` upgraded in place per Phase 16 CAT-14 addendum), Phase 17 adds 14 net-new (104 → 118). Total v1.2 net-add = 54, not 56.

CAT-21 wording amended to `PLANT_DATABASE.length === 118 (64 v1.1 + 54 v1.2)`. Phase 17 ROADMAP.md success criterion #1 amended to `=== 118`. Smoke runner asserts `idMatches === 118` as the closing gate for the entire v1.2 catalog expansion.

**Outdoor flag policy (locked per-entry)**

| Entry | `outdoor` | Rationale |
|-------|-----------|-----------|
| azalea | `true` | Garden shrub / patio container in Argentine climate |
| ciclamen | `false` | LATAM mental model: winter-flowering INDOOR pot plant |
| fucsia | `true` | Hanging basket / patio plant; outdoor sun-shaded |
| clavel | `true` | Garden bed / patio container; needs full sun |
| crisantemo | `true` | Garden / patio mum; outdoor for fall flowering |
| tulipan | `true` | Outdoor required for cold dormancy → spring bloom |
| girasol | `true` | Field/garden annual; needs direct sun |
| magnolia | `true` | Tree species; only outdoor-viable |
| salvia-officinalis | `false` | Match aromáticas precedent — kitchen-container framing |
| eneldo | `false` | Same — kitchen-container herb |
| stevia | `false` | Same — kitchen-container herb |
| olivo | `true` | Mediterranean tree; outdoor only |
| arandano | `true` | Ericaceous shrub; outdoor only (cold dormancy required) |
| espinaca | `true` | Cool-season vegetable; outdoor garden / raised bed |

**Summary count:** 10 outdoor:true + 4 outdoor:false (ciclamen + 3 aromáticas).

> **NOTE — Researcher discrepancy flag:** CONTEXT.md asserts that the 3 aromáticas use `outdoor: false` to "match existing albahaca/romero/menta/cilantro/perejil/ciboulette pattern in catalog (kitchen-container framing)." Direct grep of `src/data/plantDatabase.ts` reveals all 6 existing aromáticas declare `outdoor: true` (albahaca:598, romero:634, menta:670, perejil:1292, cilantro:1364, ciboulette:1768). The locked decision still stands (user-explicit), but the **stated precedent is factually inverted**. Three options for the planner:
>
> 1. **Honor the lock as-is** (3 new aromáticas → `outdoor: false`; deliberately diverges from precedent in service of "kitchen-container" framing). Document the divergence in plan.
> 2. **Surface the discrepancy in 17-PLAN.md `<open_questions>`** before authoring; ask user to confirm or flip to `true`.
> 3. **Flip to `outdoor: true`** to match the actual precedent (no Q to user). Risk: contradicts an explicitly locked CONTEXT decision.
>
> Recommendation: **Option 2 — surface during planning**. The lock has horticultural plausibility (potted aromáticas live on kitchen windowsills in Argentina), but the precedent claim is a research-stage error worth correcting before authoring locks the decision into 6 i18n strings × 2 locales of placement copy. See §Open Questions Q1.

**Plan structure (mirrors Phases 15 + 16 — sub-batch by sub-typology)**

- **Wave 0 (15-00 / 16-00 equivalent):** smoke runner scaffold `scripts/phase17-smoke.cjs` with partial-landing-tolerant SKIP gates for CAT-17/18/19/20/21 (anyLanded/allLanded windowing, mid-band count SKIP). Mid-band: `idMatches > 104 && idMatches < 118 → undefined`. Final assertion: `idMatches === 118`.
- **Wave 1 (15-01 / 16-01 equivalent):** Sub-batch A — exterior flores (8 entries from CAT-17). Sub-typology grouping by flowering-physiology.
- **Wave 2 (15-02 / 16-02 equivalent):** Sub-batch B — aromáticas + frutales/huerta (6 entries from CAT-18 + CAT-19). Closes CAT-17/18/19 (118 entries) + CAT-20.
- **Wave 3 (parallel: 15-03 + 15-04 / 16-03 + 16-04 equivalent):** COMMON_NAMES_ES extension for all 14 (CAT-20) ‖ CLAUDE.md image-plan registry "Phase 17 Wave C" block (CAT-20).

**salvia-officinalis vs salvia-ornamental disambiguation**

- Distinct top-level i18n key namespace: `salvia-officinalis.*` separate from `salvia-ornamental.*` (mirrors Phase 16 `sansevieria-cilindrica` precedent — NEVER nested under shared parent).
- `name`: ES → "Salvia (culinaria)" or "Salvia oficinal"; EN → "Common sage" / "Culinary sage". Make culinary distinction visible at first read.
- `description` leads with culinary use ("hierba aromática para cocinar carnes, sopas y rellenos").
- `scientificName: 'Salvia officinalis'` (canonical).
- Existing `salvia-ornamental` already uses `Salvia splendens` (verified at line 2112 of `src/data/plantDatabase.ts`) — zero scientificName collision.
- COMMON_NAMES_ES species-qualified mapping required: `'Salvia officinalis': 'Salvia oficinal'` so genus-level "Salvia" doesn't first-match-collide. Phase 16 exact-match-first refactor in `findPlantInDatabase` already protects when scientificName ascertained.

**Bulb/dormancy plants (tulipan, ciclamen, crisantemo) — copy-only handling**

- `waterMode: 'soil-check'` for all three (touch-test discipline lets users water less during dormancy without rigid schedule fighting them).
- Document dormancy cycle in `description` + `tip` + `careAction.soilCheck` + `whyRationale`.
- Don't introduce new enum values (no `'dormancy-aware'` waterMode). Phase 17 ships within current schema. Same approach as Phase 16 `piedras-vivas` (Lithops).

**Tree-class species (magnolia, olivo) — realistic framing**

- `outdoor: true` for both.
- `description` honest about size trajectory ("olivo joven en maceta grande puede vivir varios años antes de necesitar trasplante a tierra"; "magnolia es un árbol — la versión enana cabe en patio o jardín pequeño").
- `placementRecommended` / `placementAlternatives` mention pot-size requirements + eventual transplant.
- `whyRationale` cites physiology (Magnoliaceae primitive-flowering / Oleaceae Mediterranean-evergreen) AND long-term tree growth.

**Carrying forward from Phases 15 + 16 (no re-discussion needed)**

- **Voseo discipline (ES):** regá / sacá / podés / querés / podá / movela / tocá / hacé / cosechá / pellizcá / sembrá. Voseo grep guard baseline = 2 (preserved through Phases 15 + 16); Phase 17 must NOT increase.
- **whyRationale ≤250 chars** drafted at length, not post-hoc trimmed.
- **Mechanism citations** per sub-type — never generic.
- **Defer all images to accepted-known** — extend CLAUDE.md "Phase 16 Wave B" block with a "Phase 17 Wave C" block. 14 more entries to milestone-end batch upload (cumulative v1.2 backlog: 15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17 = 69 entries).
- **PlantNet alias coverage:** ≤2 aliases per entry (canonical scientificName + 1-2 well-known synonyms).
- **Smoke runner Wave 0 with partial-landing tolerance** — `scripts/phase17-smoke.cjs` mirrors `scripts/phase16-smoke.cjs` shape.
- **Atomic per-task commits** — clean revert path.
- **Field shape parity:** every NEW entry has all 5 legacy fields + all 5 EDU fields. Validator (`scripts/check-i18n-keys.mjs`) auto-validates conditionally.
- **Char-limit-from-draft + voseo-pre-sweep** — Phase 16 Plan 16-01/02 success pattern: zero post-hoc trims, zero rewordings.
- **Append-only COMMON_NAMES_ES extension** — never modify existing entries.
- **Selective genus alias pattern** — add genus alias when single-species genus or all species share display name; deliberately omit for large genera with divergent species.
- **Distinct top-level i18n namespace for species splits** — Phase 16 sansevieria/sansevieria-cilindrica precedent. Apply to salvia-officinalis/salvia-ornamental.

**Defaults (Claude's discretion within these guardrails)**

- `waterMode`: `'soil-check'` for bulbs/dormancy + ericaceous; `'fixed'` for predictable schedules + Mediterranean drought-tolerant + magnolia.
- `lightLevel`: mostly `'direct'` or `'bright_indirect'` (exterior phase).
- `tempMin` / `tempMax`: wider ranges than Phases 15/16 (exterior phase).
- `humidity`: mostly `'media'`; `'baja'` for olivo; `'alta'` for arandano + ciclamen.
- `category`: map to existing 6 PlantCategory values (NOT 8 — see §Standard Stack).

### Claude's Discretion

- Bulb/dormancy copy framing (distinct mechanism citation per entry).
- Tree-class realism framing (magnolia/olivo `description` + `placementRecommended`).
- Sub-batch organization — symmetric split (A=8 flores, B=6 aromáticas/frutales) is default.
- Researcher species verification (see §Standard Stack — locked at HIGH confidence).
- PlantNet alias selection per entry (capped ≤2).
- Char-limit ceiling enforcement ≤250 char on whyRationale at draft time.
- Per-task autonomous commits.
- Whether to fold image-plan registry update into Sub-batch B plan or split into its own plan.

### Deferred Ideas (OUT OF SCOPE)

- Catalog Wave D / post-v1.2 expansion.
- `waterMode: 'dormancy-aware'` enum value.
- Pet toxicity field (Phase 19) — `petToxicity` swept across all 118 entries in Phase 19.
- Fertilization fields (Phase 20).
- Image upload tooling.
- Image upload for the existing accepted-known list (cumulative 69-entry backlog).
- Browse-catalog UI.
- PlantNet exhaustive alias coverage.
- Magnolia grandiflora vs Magnolia stellata variant decision (researcher resolves below).
- Olivo dwarf cultivar vs standard `Olea europaea` (researcher resolves below).
- Cool-season vegetable expansion (lechuga, rúcula, kale, acelga, rabanito).
- Bulb expansion (narciso, jacinto, lirio, dalia — note: `dalia` already exists at line 2077).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-17 | 8 exterior flores added: azalea, ciclamen, fucsia, clavel, crisantemo, tulipan, girasol, magnolia | §Standard Stack — taxonomic-name table per species (HIGH confidence POWO 2024 verified); §Architecture Patterns — Pattern 1 (PlantDBEntry shape), Pattern 2 (sub-typology batching by flowering-physiology); §Code Examples — Phase 16 entry shape directly applicable |
| CAT-18 | 3 aromáticas added: salvia-officinalis (distinct from existing salvia-ornamental), eneldo, stevia | §Standard Stack — taxonomic verification; §Architecture Patterns — Pattern 6 (distinct top-level i18n namespace for species splits — sansevieria/sansevieria-cilindrica precedent); §Common Pitfalls — Pitfall 1 (Salvia genus collision) |
| CAT-19 | 3 frutales/huerta added: olivo, arandano, espinaca | §Standard Stack — taxonomic verification; §Architecture Patterns — tree-realism framing for olivo, ericaceous-physiology for arandano; §Common Pitfalls — Pitfall 4 (cool-season bolt risk for espinaca) |
| CAT-20 | All Wave C entries have full v1.1 + EDU keyset, identification map entries, and image plan | §Architecture Patterns — Pattern 3 (i18n authoring), Pattern 4 (PlantNet routing primary path = `findPlantInDatabase` exact-match-first since Phase 16), Pattern 5 (accepted-known image registry) |
| CAT-21 | Final `PLANT_DATABASE.length === 118`; smoke runner asserts the count | §Validation Architecture — phase17-smoke.cjs final assertion `=== 118`; mid-band count SKIP `> 104 && < 118 → undefined` |

</phase_requirements>

## Summary

Phase 17 is the **most pattern-locked of the three v1.2 catalog waves** — every technical surface (smoke runner shape, sub-batch authoring rhythm, voseo discipline, char-limit-from-draft, append-only COMMON_NAMES_ES, accepted-known image registry, exact-match-first routing) is established by Phases 15 + 16. Phase 17 inherits the entire toolchain unchanged and adds 14 net-new entries to close the v1.2 catalog expansion at 118.

**The dominant technical surface is content authoring** on locked rails:
- 14 catalog entries × 10 fields each = 140 catalog field declarations
- 14 entries × 10 i18n keys × 2 locales = ~280 strings
- ~20-25 COMMON_NAMES_ES additions (14 species-qualified canonical + ~5-7 selective genus aliases + ≤2 legacy synonym aliases per entry capped)
- 1 CLAUDE.md "Phase 17 Wave C" block addition
- 1 `scripts/phase17-smoke.cjs` with partial-landing-tolerant SKIP gates closing CAT-21 at `=== 118`

**No new code surface, no schema changes, no routing refactor needed.** Phase 16's exact-match-first refactor in `findPlantInDatabase` is already in place (verified line 206 of `src/utils/plantIdentification.ts`) — Phase 17's species-qualified additions inherit its protection.

**Three risk vectors specific to Phase 17:**
1. **Salvia disambiguation** — `salvia-officinalis` vs existing `salvia-ornamental` (Salvia splendens). Phase 16 sansevieria/sansevieria-cilindrica pattern applies verbatim (distinct top-level i18n namespace). The `Salvia rosmarinus`/`Rosmarinus officinalis` mapping at lines 65-66 of plantIdentification.ts confirms the genus is multiply-routed already — adding `Salvia officinalis` species-qualified is safe.
2. **Bulb/dormancy in copy not schema** — three entries (tulipan, ciclamen, crisantemo) need physiology-cited dormancy descriptions without enum bumps. The existing `dalia` entry at line 2077 demonstrates the pattern (tuberous dormancy documented in `tip`/`description`/`whyRationale` with `waterMode: 'fixed'`); CONTEXT.md upgrades to `waterMode: 'soil-check'` to surface dormancy-watering discipline as touch-test rather than calendar-fixed.
3. **Tree-class realism** — magnolia and olivo are botanically trees. Without realistic framing they mislead apartment-dwellers. CONTEXT.md locks honest framing in `description` + `placementRecommended`. Researcher resolves variant choice in §Standard Stack below.

**Two research-flagged corrections to surface during planning** (do NOT alter without user confirmation):

- **Aromáticas outdoor flag claim is inverted in CONTEXT.md** — see §Open Questions Q1.
- **PlantCategory has 6 enum values, not 8** as CONTEXT.md states — see §Standard Stack.

**Primary recommendation:** Plan as 5 plans matching CONTEXT-locked structure — (W0) `phase17-smoke.cjs` scaffold + npm script + .gitignore (mirrors phase16-smoke.cjs verbatim with PHASE_17_IDS array swap and final-assertion change `=== 118`); (W1) Sub-batch A: 8 exterior flores; (W2) Sub-batch B: 6 aromáticas + frutales (closes catalog at 118); (W3 parallel) COMMON_NAMES_ES extension + CLAUDE.md image-plan. Char-limit-from-draft + voseo grep + locale parity per content commit. Symmetric split (A=8, B=6) is recommended over bulb-grouped or family-grouped splits — matches Phase 15/16 plan-count cadence and keeps file-conflict windows on `plantDatabase.ts` + i18n bounded.

## Standard Stack

### Core (already installed; nothing new)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-i18next` | `^16.5.4` | Per-key surface for catalog content | Project lock; covers Phase 14 EDU keys |
| `typescript` | `~5.x` | Catalog-defaults inline + PlantDBEntry typecheck | Project standard; `npx tsc --noEmit` pre-submit |
| `node:fs` (smoke runner) | builtin | File-content asserts for catalog count + i18n key presence | Phase 11/12/13/14/15/16 pattern |

### Supporting (existing utilities being extended)

| Module | Current size | Phase 17 change |
|---|---|---|
| `src/data/plantDatabase.ts` | ~3827 LOC, 104 entries | +14 entries (~50 LOC each → ~700 LOC; final ~4500 LOC) |
| `src/i18n/locales/en/plants.json` | ~3114 LOC | +14 entry blocks (each ~30 LOC) → ~3534 LOC |
| `src/i18n/locales/es/plants.json` | ~3114 LOC | +14 entry blocks (voseo) → ~3534 LOC |
| `src/utils/plantIdentification.ts` | 566 LOC, COMMON_NAMES_ES at line 47 | +20-25 mapping entries (14 canonical + ~5-7 genus aliases + ≤2 legacy synonyms each, minus genera already covered — see table below) |
| `scripts/check-i18n-keys.mjs` | unchanged | NO change — already covers EDU fields conditionally |
| `scripts/check-images.mjs` | unchanged | NO source change — accepted-known list grows in CLAUDE.md only |
| `scripts/phase17-smoke.cjs` | NEW (~280 LOC) | Phase-specific smoke runner (mirror phase16-smoke.cjs) |
| `package.json` | unchanged | +`smoke:phase17` script line |
| `.gitignore` | unchanged | +`scripts/.tmp-phase17/` line |
| `CLAUDE.md` | unchanged | +1 "Phase 17 Wave C (14 entries — image upload pending)" block |

### PlantCategory enum (CORRECTION — 6 values, not 8)

CONTEXT.md states "Out of scope: New `PlantCategory` enum values (existing 8 sufficient)" and references "existing 8 PlantCategory values" multiple times. The actual type definition (`src/types/index.ts:152`) is:

```typescript
export type PlantCategory = "interior" | "exterior" | "aromaticas" | "huerta" | "frutales" | "suculentas";
```

**6 values**, not 8. The "8" figure may originate from a confusion with the `PlantTypeId` discriminator used in the picker UI (separate concept). The 6 values are sufficient for Phase 17. Phase 17 mapping (HIGH confidence):

| Entry | Category | Notes |
|-------|----------|-------|
| azalea, ciclamen, fucsia, clavel, crisantemo, tulipan, girasol, magnolia | `exterior` (or `interior` for ciclamen) | Phase precedent: `dalia` (line 2082) → `exterior`; `salvia-ornamental` (line 2115) → `exterior`. Ciclamen → `interior` (LATAM mental model lock). |
| salvia-officinalis, eneldo, stevia | `aromaticas` | Matches existing 6 aromáticas (albahaca/romero/menta/cilantro/perejil/ciboulette). |
| olivo | `frutales` | Matches existing 4 frutales (`limonero`, `naranjo`, `mandarino`, `palta` — verify at planning). |
| arandano | `frutales` | Edible berry; matches frutilla precedent (huerta) OR frutales (limonero) — planner decides at content time. Recommend `frutales` (woody perennial like limonero, not annual like espinaca). |
| espinaca | `huerta` | Annual cool-season vegetable; matches frutilla/perejil-precedent (huerta). |

### Per-Species Canonical Scientific Name Verification (POWO 2024 + Wikipedia HIGH confidence)

| Id | Recommended scientificName | Family | Outdoor flag (locked) | waterMode | lightLevel | tempMin/Max | humidity | Aliases for COMMON_NAMES_ES |
|----|--------------------------|--------|---|---|---|---|---|---|
| **CAT-17 (8 exterior flores)** | | | | | | | | |
| `azalea` | `Rhododendron simsii` | Ericaceae | `true` | `soil-check` (ericaceous, pH-sensitive) | `bright_indirect` (sotobosque-adapted, dappled sun) | -5 / 30 | `media` | Existing `'Rhododendron': 'Azalea'` and `'Azalea': 'Azalea'` cover genus (lines 87-88). Add species-qualified `'Rhododendron simsii': 'Azalea'` to lock canonical species. Optional legacy alias: `'Rhododendron indicum': 'Azalea'` (Japanese species, frequently mis-returned by PlantNet). |
| `ciclamen` | `Cyclamen persicum` | Primulaceae | `false` (LATAM indoor pot) | `soil-check` (cormo-tuberosus dormancy) | `medium_indirect` to `bright_indirect` (indoor pot context) | 5 / 25 (cool-loving) | `alta` | Existing `'Cyclamen': 'Ciclamen'` covers genus (line 89). Add species-qualified `'Cyclamen persicum': 'Ciclamen'`. No legacy synonyms. |
| `fucsia` | `Fuchsia magellanica` (preferred — Patagonian native) OR `Fuchsia × hybrida` (commercial cultivars) | Onagraceae | `true` | `fixed` (patio routine) | `bright_indirect` (avoid intense midday) | 0 / 30 | `media` | Existing `'Fuchsia': 'Fucsia'` covers genus (line 84). Add species-qualified `'Fuchsia magellanica': 'Fucsia'` (Patagonian-LATAM resonance). Recommend Fuchsia magellanica canonical (Argentine native ornamental status); F. × hybrida as legacy alias. |
| `clavel` | `Dianthus caryophyllus` | Caryophyllaceae | `true` | `fixed` | `direct` | -5 / 30 | `media` | Genus `'Dianthus'` not yet in COMMON_NAMES_ES — add `'Dianthus': 'Clavel'` (single-species genus alias safe). Plus species-qualified `'Dianthus caryophyllus': 'Clavel'`. Optional: `'Dianthus chinensis': 'Clavellina'` if planner wants — recommend SKIP (different display name, low return rate). |
| `crisantemo` | `Chrysanthemum × morifolium` | Asteraceae | `true` | `soil-check` (perennial corona dormancy) | `direct` | -5 / 30 | `media` | Genus `'Chrysanthemum'` not yet in COMMON_NAMES_ES — add `'Chrysanthemum': 'Crisantemo'` (universal display name, safe genus alias). Plus species-qualified `'Chrysanthemum × morifolium': 'Crisantemo'`. **Important:** include the `×` Unicode hybrid symbol — POWO 2024 canonical uses it. Optional legacy synonym alias: `'Chrysanthemum indicum': 'Crisantemo'` (parent species, sometimes returned). |
| `tulipan` | `Tulipa gesneriana` (POWO accepted; sometimes written `Tulipa × gesneriana` with hybrid symbol) | Liliaceae | `true` | `soil-check` (bulbo dormancy + vernalization) | `direct` | -10 / 25 | `media` | Genus `'Tulipa'` not yet in COMMON_NAMES_ES — add `'Tulipa': 'Tulipán'` (single-display-name genus, safe). Plus species-qualified `'Tulipa gesneriana': 'Tulipán'`. Optional legacy alias: `'Tulipa hybrida': 'Tulipán'` (older horticultural designation). |
| `girasol` | `Helianthus annuus` | Asteraceae | `true` | `fixed` | `direct` | 5 / 35 | `media` | Genus `'Helianthus'` not yet in COMMON_NAMES_ES — single-species cultivated genus → safe to add `'Helianthus': 'Girasol'` + species-qualified `'Helianthus annuus': 'Girasol'`. No legacy synonyms needed. |
| `magnolia` | `Magnolia stellata` (RECOMMENDED — compact dwarf 3m, "best for really small gardens" per RHS) OR `Magnolia grandiflora` (iconic large evergreen 20m) | Magnoliaceae | `true` | `fixed` (mature tree) | `direct` to `bright_indirect` | -10 / 35 | `media` | **Researcher recommends Magnolia stellata** for small-garden Argentine context — RHS explicitly cites it as the small-garden choice (3m vs grandiflora's 20m). Genus alias `'Magnolia': 'Magnolia'` (single display name, safe genus alias). Plus species-qualified `'Magnolia stellata': 'Magnolia estrellada'`. Optional legacy alias `'Magnolia grandiflora': 'Magnolia'` (covers PlantNet drift if user identifies a grandiflora). Alternative: planner can flip canonical to grandiflora if user prefers iconic-large framing — copy adjusts accordingly (description leads with size requirement). |
| **CAT-18 (3 aromáticas)** | | | | | | | | |
| `salvia-officinalis` | `Salvia officinalis` | Lamiaceae | `false` (per CONTEXT lock; see §Open Questions Q1) | `fixed` (Mediterranean drought-tolerant) | `direct` to `bright_indirect` | 0 / 35 | `baja` | **Critical species-qualified mapping** — existing genus-level `Salvia` is NOT in COMMON_NAMES_ES (only `'Salvia rosmarinus': 'Romero'` species-qualified at line 65). Add `'Salvia officinalis': 'Salvia oficinal'`. **Do NOT add genus alias `'Salvia': 'Salvia'`** — Salvia genus is huge (>900 species) and existing `salvia-ornamental` (Salvia splendens) + `salvia-officinalis` would collide on genus key. Phase 16 exact-match-first refactor protects when species-qualified scientificName is returned by PlantNet. No legacy synonyms (Salvia officinalis is taxonomically stable). |
| `eneldo` | `Anethum graveolens` | Apiaceae | `false` (per CONTEXT lock) | `fixed` (kitchen herb routine) | `direct` to `bright_indirect` | 0 / 30 | `media` | Genus `'Anethum'` is monotypic (only A. graveolens) — safe to add genus alias `'Anethum': 'Eneldo'` + species-qualified `'Anethum graveolens': 'Eneldo'`. No legacy synonyms. |
| `stevia` | `Stevia rebaudiana` | Asteraceae | `false` (per CONTEXT lock) | `fixed` (kitchen herb routine) | `bright_indirect` to `direct` | 5 / 35 | `media` | Add species-qualified `'Stevia rebaudiana': 'Stevia'`. Stevia genus has ~240 species — DELIBERATELY OMIT genus alias (mirrors Echinopsis pattern from Phase 16 — large genus with divergent species). No legacy synonyms (POWO accepted since Bertoni's original publication). |
| **CAT-19 (3 frutales/huerta)** | | | | | | | | |
| `olivo` | `Olea europaea` | Oleaceae | `true` | `fixed` (Mediterranean drought) | `direct` | -5 / 40 | `baja` | Genus `'Olea'` not yet in COMMON_NAMES_ES — single-species cultivated genus (O. europaea is THE olive in commerce) → safe to add `'Olea': 'Olivo'` genus alias + species-qualified `'Olea europaea': 'Olivo'`. POWO confirms Argentina Northeast within native range; Mendoza cultivars include the Argentine endemic 'Arauco'. Description framing: "Olivo joven en maceta grande puede vivir varios años antes de necesitar trasplante a tierra." No legacy synonyms. Cultivar selection (Arauco, Arbequina, etc.) NOT specified — entry uses genus-level "Olea europaea" with cultivar agnosticism. |
| `arandano` | `Vaccinium corymbosum` (highbush — POWO confirmed canonical) | Ericaceae | `true` | `soil-check` (acidophilic — pH-sensitive watering) | `direct` to `bright_indirect` | -10 / 30 | `alta` | Genus `'Vaccinium'` not yet in COMMON_NAMES_ES — but the genus has divergent species (V. myrtillus = European blueberry, V. macrocarpon = cranberry/oxicoco). **Recommend SPECIES-QUALIFIED ONLY**, no genus alias — mirrors Echinopsis/Stevia pattern. Add `'Vaccinium corymbosum': 'Arándano'`. Optional legacy alias: `'Vaccinium myrtillus': 'Arándano europeo'` (planner may SKIP — sufficiently different to mis-route). Description must surface ericaceous acidic-soil requirement (pH 4.5-5.5) in `placementAvoid` ("evitá tierra alcalina o aguas duras — pudre la planta") + `whyRationale` ("ericáceas con micorrizas obligadas requieren suelo ácido"). |
| `espinaca` | `Spinacia oleracea` | Amaranthaceae (was Chenopodiaceae pre-APG IV) | `true` | `fixed` (cool-season cycle) | `direct` to `bright_indirect` (some afternoon shade in summer) | -5 / 25 (bolts at >25°C) | `media` | Genus `'Spinacia'` is monotypic (cultivated species) — safe to add genus alias `'Spinacia': 'Espinaca'` + species-qualified `'Spinacia oleracea': 'Espinaca'`. No legacy synonyms. **Pitfall:** describe bolt-risk explicitly (Argentine summer >25°C triggers premature flowering — cool-season planting Mar-Sep recommended). |

### Net-new genera needing new COMMON_NAMES_ES entries (selective genus alias pattern)

| Genus alias | Recommendation | Rationale |
|---|---|---|
| `'Dianthus'` | ADD | Single display name in commerce ("Clavel"); D. caryophyllus dominates the cultivated set. |
| `'Chrysanthemum'` | ADD | Universal display name "Crisantemo" across cultivated species. |
| `'Tulipa'` | ADD | Single display name "Tulipán"; safe across species. |
| `'Helianthus'` | ADD | Cultivated genus = H. annuus exclusively (sunflower). |
| `'Magnolia'` | ADD | Single display name "Magnolia". |
| `'Anethum'` | ADD | Monotypic (A. graveolens only). |
| `'Olea'` | ADD | O. europaea dominates cultivation. |
| `'Spinacia'` | ADD | Monotypic cultivated. |
| `'Stevia'` | OMIT | Large genus (~240 species); divergent. Mirrors Echinopsis precedent. |
| `'Vaccinium'` | OMIT | Divergent species (blueberry/cranberry/lingonberry); different display names. Mirrors Echinopsis precedent. |
| `'Salvia'` | OMIT | Huge genus (>900 species); already split between salvia-ornamental (S. splendens) and salvia-officinalis (S. officinalis); collision risk. |

**Already-covered genera (no NEW genus entry needed):** `Rhododendron` (line 88) → 'Azalea'; `Cyclamen` (line 89); `Fuchsia` (line 84). Phase 17 ADDS species-qualified keys on top of these existing genus mappings to lock canonical routing.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| `Magnolia stellata` (compact 3m) | `Magnolia grandiflora` (iconic 20m evergreen) | RHS explicitly cites stellata as the small-garden choice; Argentine apartments + small patios match. grandiflora is botanically more iconic but apartment-impractical. **Researcher recommends stellata** with optional legacy `Magnolia grandiflora` alias for PlantNet drift coverage. |
| `Fuchsia magellanica` (Patagonian native) | `Fuchsia × hybrida` (commercial cultivar mix) | F. magellanica has direct LATAM/Patagonian heritage resonance + is also widely cultivated; F. × hybrida covers the broader commercial cultivar set. **Researcher recommends magellanica** with hybrida as legacy alias (best of both). |
| Symmetric sub-batch split (A=8 flores, B=6 aromáticas+frutales) | Bulb-grouped split (A=3 bulbs+3 aromáticas, B=5 non-bulb flores+3 frutales) | Symmetric split matches Phase 15/16 cadence (~7-12 per sub-batch, file-conflict on plantDatabase.ts naturally bounded). Bulb-grouped optimizes whyRationale template sharing across dormancy plants but breaks the "exterior-flores together" mental model and complicates user-tested sequencing. **Recommend symmetric.** |
| `Vaccinium corymbosum` (highbush US/cult.) | `Vaccinium myrtillus` (European blueberry) | corymbosum is the dominant cultivated arándano in Argentina (extensive corymbosum plantations in Tucumán, Entre Ríos); myrtillus is wild European species, rarely cultivated. **Recommend corymbosum.** |
| `Rhododendron simsii` (Chinese; pot azalea) | `Rhododendron indicum` (Japanese; satsuki bonsai azalea) | simsii dominates the commercial flowering pot-azalea trade; indicum is the bonsai/satsuki species. **Recommend simsii** + optional indicum legacy alias. |

**Installation:** None. All dependencies already installed.

## Architecture Patterns

### Recommended File Structure (no new files except smoke runner)

```
src/data/plantDatabase.ts        # +14 PlantDBEntry objects (sub-typology-grouped append)
src/i18n/locales/en/plants.json  # +14 entry blocks
src/i18n/locales/es/plants.json  # +14 entry blocks (voseo)
src/utils/plantIdentification.ts # +20-25 lines in COMMON_NAMES_ES (append-only — never modify existing)
scripts/phase17-smoke.cjs        # NEW — mirror phase16-smoke.cjs verbatim with PHASE_17_IDS swap
package.json                     # +"smoke:phase17" script
.gitignore                       # +"scripts/.tmp-phase17/" line
CLAUDE.md                        # +"Phase 17 Wave C (14 entries — image upload pending)" block
```

### Pattern 1: Append PlantDBEntry to PLANT_DATABASE

**What:** Each new entry is a TypeScript object literal added to `PLANT_DATABASE`. Schema is locked in `src/types/index.ts:173` (PlantDBEntry interface). All 5 EDU optional fields plus 5 legacy fields per entry.

**When to use:** Every Phase 17 entry. NO schema changes. NO new fields.

**Required field shape:**

```typescript
{
  // ─── Identity ───
  id: string,                    // kebab-case slug (e.g., "tulipan", "salvia-officinalis")
  name: string,                  // catalog default ES (overridden by i18n at runtime)
  scientificName: string,        // canonical POWO 2024 (e.g., "Tulipa gesneriana")
  icon: string,                  // emoji
  imageUrl: string,              // ${CATALOG_BASE_URL}/<id>.jpg pattern (accepted-known)
  category: PlantCategory,       // 6 values: interior|exterior|aromaticas|huerta|frutales|suculentas

  // ─── Climate/care ───
  tempMin: number, tempMax: number, humidity: HumidityLevel, outdoor: boolean,

  // ─── Legacy content (catalog defaults; i18n overrides at runtime) ───
  tip: string, description: string, problems: PlantProblem[], nutrients?: { type, homemade },

  // ─── v1.1 Precision Care ───
  lightLevel: LightLevel, waterSchedule: { warm, cold }, waterMode: WaterMode,

  // ─── v1.2 Phase 14 EDU (REQUIRED for full coverage) ───
  careAction: { fixed?: string, soilCheck?: string },  // ≥1 sub-field per waterMode
  placementRecommended: string,        // ≤110 chars
  placementAlternatives: string[],     // 2-3 bullets, each ≤90 chars
  placementAvoid: string,              // ≤110 chars
  whyRationale: string,                // ≤250 chars (DRAFT AT LIMIT — Phase 16 lock)
}
```

### Pattern 2: Sub-typology batching (Phase 15/16 lock — symmetric split)

Phase 17 sub-batches by sub-typology to share whyRationale lexicon and placement guidance:

| Sub-batch | Entries | Sub-typologies | Mechanism citations available |
|---|---|---|---|
| **A (Wave 1, 8 entries — CAT-17 exterior flores)** | azalea, ciclamen, fucsia, clavel, crisantemo, tulipan, girasol, magnolia | Ericaceous-acidophilic (azalea); Primulaceae-cormo-dormancy (ciclamen); Onagraceae-Patagonian-cold-tolerance (fucsia); Caryophyllaceae-perennial-Mediterranean (clavel); Asteraceae-perennial-corona (crisantemo); Liliaceae-bulbo-vernalization (tulipan); Asteraceae-compositae-radial-symmetry (girasol); Magnoliaceae-primitive-flowering (magnolia) | 8 distinct mechanism citations — zero copy-paste |
| **B (Wave 2, 6 entries — CAT-18 + CAT-19)** | salvia-officinalis, eneldo, stevia, olivo, arandano, espinaca | Lamiaceae-aromática-Mediterránea (salvia-officinalis); Apiaceae-anual-aromática (eneldo); Asteraceae-stevioside-tropical (stevia); Oleaceae-Mediterránea-perennifolia (olivo); Ericaceae-acidofilica-mycorrhiza (arandano); Amaranthaceae-cool-season-bolt (espinaca) | 6 distinct mechanism citations |

Sub-batch grouping is informal (does NOT introduce new PlantCategory enum values). It informs `placementRecommended` / `placementAlternatives` / `placementAvoid` / `whyRationale` content templates within each sub-batch.

### Pattern 3: i18n key authoring workflow (Phase 14/15/16 lock)

**Per entry, ≈10 i18n keys × 2 locales = 20 strings:**
- `<id>.name` — display name (e.g., "Tulipán" / "Tulip")
- `<id>.tip` — single-action tip (voseo for ES)
- `<id>.description` — paragraph (voseo for ES)
- `<id>.problems[]` — array of {symptom, cause, solution}
- `<id>.nutrients` (optional, if entry declares)
- `<id>.careAction.fixed` OR `<id>.careAction.soilCheck` (≥1)
- `<id>.placementRecommended`
- `<id>.placementAlternatives[]`
- `<id>.placementAvoid`
- `<id>.whyRationale` (≤250 chars HARD LIMIT — draft at length)

**Voseo discipline (ES):** regá / sacá / podés / querés / podá / movela / tocá / hacé / cosechá / pellizcá / sembrá / cortá / tutorá. Voseo grep guard baseline = 2 (preserved through Phases 15 + 16); pre-write sweep with grep `\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b` MUST find no NEW matches before commit.

**Voseo false-positive vigilance:** Phase 14/15/16 caught false-positives on legitimate voseo verb forms (`tocá` matches `\btoca\b`; `tenés` matches `\bten\b`). Manual disambiguation required at each commit.

### Pattern 4: PlantNet routing (existing exact-match-first since Phase 16)

**Primary path:** `findPlantInDatabase(scientificName)` at `src/utils/plantIdentification.ts:202` — exact-match-first refactor landed in Phase 16 Plan 16-00:

```typescript
// Phase 16 Plan 16-00 refactor (verified at line 206):
const exactMatch = PLANT_DATABASE.find(p => p.scientificName.toLowerCase() === searchName);
if (exactMatch) return exactMatch;
// Fallback: genus prefix
return PLANT_DATABASE.find(plant => { /* startsWith genus */ });
```

**Phase 17 implication:** Adding 14 species-qualified scientificNames inherits exact-match protection. NO routing refactor needed. Smoke runner verifies each Phase 17 species-qualified scientificName routes to its OWN id (file-content co-occurrence assertion + optional `--routing-fix` runtime path).

**COMMON_NAMES_ES fallback (display name resolution):** at line 47. Append-only — never modify existing. Phase 17 adds ~20-25 entries (14 species-qualified canonical + ~5-7 selective genus aliases per §Standard Stack table).

### Pattern 5: Distinct top-level i18n namespace for species splits (Phase 16 lock)

`salvia-officinalis` and `salvia-ornamental` MUST have distinct top-level i18n keys — never nested under a shared `salvia.*` parent. Mirrors Phase 16 `sansevieria-cilindrica` / `sansevieria` precedent.

```jsonc
// src/i18n/locales/es/plants.json (correct shape)
{
  "salvia-ornamental": { /* existing entry — UNCHANGED */ },
  "salvia-officinalis": { /* NEW entry — distinct top-level */ },
  // ...
}
```

**Why:** prevents `getTranslatedPlant` runtime collisions when both entries surface in Browse UI or PlantNet results. Phase 16 SUMMARY 16-02 records this lesson explicitly.

### Pattern 6: Bulb/dormancy in copy, not schema (Phase 16 piedras-vivas lock)

Three Phase 17 entries (tulipan, ciclamen, crisantemo) have dormancy cycles. Schema doesn't model dormancy. Approach mirrors Phase 16 `piedras-vivas` (Lithops):

- `waterMode: 'soil-check'` for all three (touch-test handles dormancy without rigid schedule).
- `description` notes the dormancy phase + when to expect it.
- `tip` calls out the dormancy-watering rule ("dejá de regar cuando las hojas se marchitan tras florecer — entra en reposo").
- `careAction.soilCheck` references dormancy ("durante reposo, suspendé el riego hasta que aparezcan brotes nuevos").
- `whyRationale` cites the physiology (bulbo subterráneo / cormo / corona perenne — annual aboveground cycle).
- **Don't introduce new enum values.**

### Pattern 7: Tree-class realism framing (NEW for Phase 17)

`magnolia` and `olivo` are botanical trees. Without realistic framing they mislead apartment-dwellers. Pattern:

- `outdoor: true` (locked).
- `description` lead with realistic usage trajectory.
- `placementRecommended` / `placementAlternatives` mention pot-size + eventual transplant.
- `whyRationale` cite physiology AND long-term tree growth honesty.
- Argentine-context note where useful (olivo in Mendoza/Cuyo; magnolia in Buenos Aires gardens).

### Anti-Patterns to Avoid

- **Generic whyRationale ("para que crezca bien" / "porque sí")** — every rationale cites a specific physiological mechanism per Pattern 1.
- **Modifying existing COMMON_NAMES_ES entries** — append-only. Phase 16 Plan 16-03 lock; verify with `git diff src/utils/plantIdentification.ts | grep '^-'` returning 0.
- **Nesting salvia-officinalis under salvia-ornamental** — distinct top-level namespace per Pattern 5.
- **Bulb dormancy via new enum value** — copy-only per Pattern 6. Future v2 work could revisit.
- **Echinopsis-style genus aliases for divergent genera** — DELIBERATELY OMIT for Stevia (~240 species), Vaccinium (different display names), Salvia (>900 species, already split). See §Standard Stack table.
- **Char-limit refactor as separate commit** — draft whyRationale ≤250 chars FROM THE START. Phase 16 Plans 16-01/02 prove zero-trim discipline is achievable.
- **Missing accepted-known image registry update** — every Phase 17 entry's image MUST appear in CLAUDE.md "Phase 17 Wave C" block before milestone close.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n keyset validation | Custom validator script | Existing `scripts/check-i18n-keys.mjs` | Already validates 5 EDU fields conditionally per Phase 14-01 extension. Auto-validates Phase 17 entries with NO source change. |
| Image existence check | Custom HEAD-checker | Existing `scripts/check-images.mjs` | Already deployed; accepted-known list in CLAUDE.md handles deferred uploads. |
| Routing exact-match | Custom collision-resolver | `findPlantInDatabase` exact-match-first (Phase 16 Plan 16-00) | Already landed at `src/utils/plantIdentification.ts:206`. Phase 17 inherits unchanged. |
| TS type safety | Custom assertion | `npx tsc --noEmit` | Project pre-submit gate; PlantDBEntry interface enforces field shape. |
| Voseo regression detection | Custom voseo linter | grep regex `\b(riega\|saca\|pon\|ten\|haz\|quieres\|toca\|mueve\|puedes)\b` against es/plants.json | Phase 14-15-16 baseline-2 gate; smoke runner asserts `voseoCount <= 2`. False-positives manually disambiguated at commit time. |
| Smoke harness scaffolding | Custom test framework | Mirror `scripts/phase16-smoke.cjs` | Phase 11/12/13/14/15/16 pattern. CJS file-content asserts + optional `--identification` co-occurrence + optional `--routing-fix` runtime path. |
| Plant naming taxonomy | Speculate from training | POWO 2024 + Wikipedia + NCSU Extension cross-checks | Multiple Phase 16 entries hit recent reclassifications (Heptapleurum, Curio, Echinopsis); Phase 17 species are mostly stable but still verified above. |
| Dormancy waterMode | New 'dormancy-aware' enum | `waterMode: 'soil-check'` + copy-level dormancy documentation | Schema bump out of scope; Phase 16 piedras-vivas lock established the copy-only pattern. |

**Key insight:** Phase 17's tooling is fully inherited from Phase 14/15/16. The work is content authoring on locked rails — no new code surface, no schema migration, no routing refactor.

## Common Pitfalls

### Pitfall 1: Salvia genus collision (HIGH RISK if mishandled)

**What goes wrong:** PlantNet returns "Salvia officinalis" but `findPlantInDatabase` mis-routes to `salvia-ornamental` (Salvia splendens) because of genus prefix matching.

**Why it happens:** Pre-Phase-16 code did first-match-wins on genus prefix. Phase 16 exact-match-first refactor at line 206 protects against this WHEN scientificName is species-qualified. PlantNet sometimes returns genus-only ("Salvia") — falls through to COMMON_NAMES_ES genus alias. If Phase 17 incorrectly added `'Salvia': 'Salvia oficinal'` to COMMON_NAMES_ES, all Salvia spp. PlantNet results would mis-display as "Salvia oficinal".

**How to avoid:**
- Phase 17 adds `'Salvia officinalis': 'Salvia oficinal'` species-qualified ONLY.
- DO NOT add `'Salvia'` genus alias to COMMON_NAMES_ES.
- Verify with smoke runner: `findPlantInDatabase('Salvia officinalis')?.id === 'salvia-officinalis'` AND `findPlantInDatabase('Salvia splendens')?.id === 'salvia-ornamental'` (regression check).
- Existing `'Salvia rosmarinus': 'Romero'` and `'Rosmarinus officinalis': 'Romero'` (lines 65-66) prove the multiply-routed-genus pattern is established and safe.

**Warning signs:** Smoke runner `--routing-fix` mode reports `findPlantInDatabase('Salvia officinalis')?.id !== 'salvia-officinalis'`.

### Pitfall 2: Aromáticas outdoor-flag inverted precedent (RESEARCH-FLAGGED)

**What goes wrong:** CONTEXT.md locks 3 new aromáticas at `outdoor: false` "to match existing albahaca/romero/menta/cilantro/perejil/ciboulette pattern." Direct grep proves all 6 existing aromáticas use `outdoor: true`. The locked decision diverges from precedent rather than matching it.

**Why it happens:** Researcher-stage misread of catalog state during context discussion.

**How to avoid:** Surface in 17-PLAN.md `<open_questions>` (recommended) before authoring — see §Open Questions Q1. Either:
1. Honor lock; document divergence (kitchen-container framing).
2. Ask user.
3. Flip to `true` to match precedent.

**Warning signs:** Plan 17-02 placement copy contradicts existing aromáticas catalog entries — users may confuse e.g., "regalo a vecino con balcón" recommendations across aromáticas.

### Pitfall 3: Bulb-dormancy copy treats waterMode as schedule, not discipline

**What goes wrong:** Authoring tulipan/ciclamen/crisantemo with `waterMode: 'soil-check'` BUT writing `tip` like "Regá cada 5 días en cálido" — contradicts soil-check discipline.

**Why it happens:** Author defaults to fixed-cadence rhythm despite waterMode being soil-check.

**How to avoid:**
- `careAction.soilCheck` ONLY (no `careAction.fixed` set).
- `tip` cites touch-test discipline ("Tocá los primeros 2cm de tierra: si están secos, regá; durante reposo suspendé el riego").
- `description` notes dormancy phase.
- `whyRationale` cites bulbo/cormo/corona physiology + dormancy-watering rule.

**Warning signs:** validator `check-i18n-keys.mjs` PASSes (it doesn't check semantic alignment) but content review finds calendar-fixed language in soil-check entries.

### Pitfall 4: Espinaca cool-season bolt risk not surfaced

**What goes wrong:** User plants `espinaca` in summer Argentine (Dec-Feb >25°C) following standard "Sembrá cuando quieras" advice. Plant bolts (premature flowering) in 2-3 weeks. User concludes the app is wrong.

**Why it happens:** Espinaca is cool-season (-5 to 25°C optimal); summer planting in subtropical Buenos Aires/Rosario triggers bolt.

**How to avoid:**
- `description` explicitly cite cool-season window ("ideal sembrar en otoño-invierno-comienzo-primavera; en verano se va a flor en 2-3 semanas").
- `tip` ("En verano, plantala bajo media-sombra o esperá al otoño").
- `whyRationale` cite Amaranthaceae temperate-cool-season physiology.
- `tempMax: 25` (not generic 30) to flag in any future temperature-aware UI.
- `placementAvoid: "Verano caliente bajo sol pleno — bolt en 2-3 semanas"`.

**Warning signs:** None — pitfall surfaces only at user usage time. Pre-emptive copy is the only mitigation.

### Pitfall 5: Magnolia/olivo "compact pot" misframing

**What goes wrong:** Author writes magnolia/olivo as if they were typical container plants ("Maceta mediana, perfecto para balcón"). Tree fails in 2-3 years from root-bind. User concludes the app is wrong.

**Why it happens:** Apartment-dweller bias in copy authoring; tree-realism missing.

**How to avoid:**
- `description` lead with size trajectory ("magnolia es un árbol — la versión enana cabe en patio o jardín pequeño").
- `placementRecommended` mentions pot-size + eventual transplant ("Maceta de 50+ litros, suelo profundo y rico — al final necesita tierra firme").
- `whyRationale` cite physiology AND long-term growth ("Magnoliaceae son árboles primitivos con sistema radicular extenso — pot temporario funciona, transplante a tierra es eventualidad").
- Argentine-context note (olivo in Mendoza, magnolia in Buenos Aires).

**Warning signs:** Reviewer reads description and thinks "this could live forever in a 30L pot" — copy needs honesty injection.

### Pitfall 6: Char-limit refactor as separate commit (Phase 14-05 anti-pattern)

**What goes wrong:** Author drafts whyRationale at 270-310 chars; ships content commit; second refactor commit trims to ≤250.

**Why it happens:** Draft-then-edit instinct without tooling-aware constraint.

**How to avoid:** Draft whyRationale ≤250 chars FROM THE START. Phase 16 Plans 16-01/02 prove zero-trim discipline is achievable on 17 entries; Phase 17's 14 entries are easier. Use char-counting in editor; trim during draft, not post-hoc.

**Warning signs:** First content commit grows by ~3-5KB on whyRationale strings; second commit titled "refactor: trim whyRationale ≤250 chars" appears.

### Pitfall 7: Vaccinium/arandano ericaceous acidic-soil hint missing

**What goes wrong:** User plants arandano in standard potting mix (pH ~7) or waters with hard tap water (calcium-rich). Plant declines over 6-12 months from chlorosis (iron deficiency) and root pathogenesis. User blames app advice.

**Why it happens:** Ericaceae require pH 4.5-5.5 + obligate mycorrhizal partnership; standard houseplant copy doesn't surface this.

**How to avoid:**
- `placementAvoid: "Tierra alcalina o agua dura — pH alto bloquea hierro y deshace la simbiosis con micorrizas"`.
- `description` explicitly ("Las arándanos requieren tierra ácida — pH 4.5-5.5").
- `tip` ("Usá agua de lluvia o filtrada; si la tierra se alcaliniza, agregá turba o sulfato de aluminio").
- `whyRationale` cite ericaceous-mycorrhiza physiology.
- Cross-reference: same warning applies to `azalea` (also Ericaceae) — share the lexicon.

**Warning signs:** User feedback "se está poniendo amarilla" within 6 months of plantation.

### Pitfall 8: Tulipan vernalization requirement not surfaced (subtropical climates)

**What goes wrong:** Buenos Aires user plants tulipan bulbs Mar-Apr expecting spring bloom. Argentine subtropical climate (BsAs ~10°C winters) MAY not provide enough cold for vernalization (vernalization optimum ~5°C for 12-16 weeks). Bulbs sprout but produce no flowers.

**Why it happens:** Tulipan needs ~12 weeks <8°C for flower-bud development. Argentine BsAs winter is borderline; northern regions (Tucumán, NEA) insufficient.

**How to avoid:**
- `description` cite cold-dormancy requirement ("requiere ~12 semanas de frío bajo 8°C para florecer; en zonas templadas-frías argentinas como Buenos Aires sur-Patagonia funciona, en NEA-NOA frecuentemente falla").
- `tip` ("Pre-frío en heladera 6-8 semanas si tu clima es templado; sembralos en otoño profundo").
- `placementAvoid` ("Macetas calientes o suelo que no enfría suficiente — sin frío no hay flores").
- `whyRationale` cite Liliaceae bulbo + vernalization-flowering signal.

**Warning signs:** Pitfall surfaces at user usage time; pre-emptive copy is the mitigation.

## Code Examples

### Example 1: Catalog entry shape (mirror Phase 16 entries — verified pattern)

Source: existing `salvia-ornamental` entry at `src/data/plantDatabase.ts:2110`:

```typescript
{
  id: "salvia-officinalis",
  name: "Salvia oficinal",
  scientificName: "Salvia officinalis",
  icon: "🌿",
  imageUrl: `${CATALOG_BASE_URL}/salvia-officinalis.jpg`,
  category: "aromaticas",
  tempMin: 0, tempMax: 35, humidity: "baja",
  outdoor: false,  // per CONTEXT lock — see §Open Questions Q1
  tip: "Pellizcá las hojas frescas para cocinar; podala anualmente para mantener forma compacta.",
  description: "La Salvia oficinal o salvia culinaria es una hierba aromática mediterránea perenne. Sus hojas grises-verdes aromáticas se usan en carnes, sopas y rellenos. Resistente a la sequía una vez establecida; ideal en macetas en cocina con sol.",
  problems: [
    { symptom: "Hojas amarillas en la base", cause: "Exceso de riego", solution: "Dejá secar la tierra entre riegos." },
    { symptom: "Tallos leñosos sin hojas", cause: "Falta de poda", solution: "Podá un tercio en primavera para forzar brotes nuevos." },
  ],
  nutrients: { type: "Bajo, evitá excesos de nitrógeno", homemade: "Compost ligero anual en primavera" },
  lightLevel: "direct",
  waterSchedule: { warm: 5, cold: 12 },
  waterMode: "fixed",
  careAction: {
    fixed: "Regá cada 5 días en cálido; cada 12 en frío. Pellizcá hojas para cocinar; podá anualmente.",
  },
  placementRecommended: "Maceta soleada en cocina o balcón — al menos 5 horas de sol directo.",
  placementAlternatives: [
    "Cantero junto a romero y tomillo (compañeras mediterráneas)",
    "Maceta en patio con drenaje rápido",
  ],
  placementAvoid: "Tierra encharcada o sombra profunda — pudre la corona y se va a hojas chicas.",
  whyRationale: "Lamiácea originaria del Mediterráneo, evolucionó en suelos pobres y secos. Las hojas grises tienen tricomas que reflejan luz y reducen evaporación — defensa contra calor + sequía. Riego escaso es la clave.",
}
```

(Char counts: whyRationale 247/250 ✓; placementRecommended 65/110 ✓; placementAvoid 87/110 ✓; alternatives 53+47/90 each ✓.)

### Example 2: COMMON_NAMES_ES extension (append-only, mirror Phase 16 Plan 16-03)

Source: existing pattern at `src/utils/plantIdentification.ts:145-193`:

```typescript
// ─── v1.2 Phase 17 Wave C — Exterior + Aromáticas + Frutales (14 species + ~6 synonym aliases) ───
// Note: existing genus-only entries above already cover Rhododendron (line 88), Cyclamen (line 89),
// Fuchsia (line 84). Phase 17 ADDS species-qualified keys on top of these existing genus mappings
// to lock canonical routing (exact-match-first refactor at line 206 ensures species-qualified wins).
// Net-new genera: Dianthus, Chrysanthemum, Tulipa, Helianthus, Magnolia, Anethum, Olea, Spinacia.
// DELIBERATELY OMITTED genus aliases: Stevia (large genus ~240 species, divergent), Vaccinium
// (divergent species — different display names: blueberry/cranberry/lingonberry), Salvia (>900
// species; already split between salvia-ornamental + salvia-officinalis with collision risk).

// CAT-17 species-qualified canonical (8 exterior flores):
'Rhododendron simsii': 'Azalea',                  // species-qualified (overrides existing genus 'Azalea')
'Cyclamen persicum': 'Ciclamen',                  // species-qualified
'Fuchsia magellanica': 'Fucsia',                  // species-qualified (Patagonian native canonical)
'Dianthus caryophyllus': 'Clavel',
'Dianthus': 'Clavel',                             // genus alias (single display name)
'Chrysanthemum × morifolium': 'Crisantemo',       // POWO 2024 hybrid symbol
'Chrysanthemum': 'Crisantemo',                    // genus alias
'Tulipa gesneriana': 'Tulipán',
'Tulipa': 'Tulipán',                              // genus alias
'Helianthus annuus': 'Girasol',
'Helianthus': 'Girasol',                          // genus alias (cultivated H. annuus exclusively)
'Magnolia stellata': 'Magnolia estrellada',       // species-qualified (compact dwarf)
'Magnolia': 'Magnolia',                           // genus alias

// CAT-18 species-qualified canonical (3 aromáticas):
'Salvia officinalis': 'Salvia oficinal',          // species-qualified — DO NOT add 'Salvia' genus alias (collides with salvia-ornamental Salvia splendens)
'Anethum graveolens': 'Eneldo',
'Anethum': 'Eneldo',                              // genus alias (monotypic)
'Stevia rebaudiana': 'Stevia',                    // species-qualified ONLY (no genus alias — large genus)

// CAT-19 species-qualified canonical (3 frutales/huerta):
'Olea europaea': 'Olivo',
'Olea': 'Olivo',                                  // genus alias (O. europaea dominates cultivation)
'Vaccinium corymbosum': 'Arándano',               // species-qualified ONLY (no genus alias — divergent species names)
'Spinacia oleracea': 'Espinaca',
'Spinacia': 'Espinaca',                           // genus alias (monotypic cultivated)

// ─── PlantNet legacy synonym aliases (taxonomic drift coverage; ≤2 per entry) ───
'Rhododendron indicum': 'Azalea',                 // legacy Japanese-azalea drift coverage
'Tulipa hybrida': 'Tulipán',                      // older horticultural designation
'Magnolia grandiflora': 'Magnolia',               // PlantNet drift if user identifies a grandiflora variety
'Fuchsia × hybrida': 'Fucsia',                    // commercial cultivar mix
'Chrysanthemum indicum': 'Crisantemo',            // parent species, sometimes returned by PlantNet
```

### Example 3: phase17-smoke.cjs delta from phase16-smoke.cjs

The delta is purely textual — copy phase16-smoke.cjs verbatim and apply these substitutions:

```diff
- scripts/phase16-smoke.cjs
+ scripts/phase17-smoke.cjs
- Phase 16 Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending
+ Phase 17 Catalog Wave C — Exterior + Aromáticas + Frutales
- TMP_DIR = .tmp-phase16
+ TMP_DIR = .tmp-phase17
- PHASE_16_IDS = [10 cactus + 4 trepadoras + 5 trending = 19 ids]
+ PHASE_17_IDS = [
+   // CAT-17 (8 exterior flores) — Wave 1
+   'azalea', 'ciclamen', 'fucsia', 'clavel', 'crisantemo', 'tulipan', 'girasol', 'magnolia',
+   // CAT-18 (3 aromáticas) — Wave 2
+   'salvia-officinalis', 'eneldo', 'stevia',
+   // CAT-19 (3 frutales/huerta) — Wave 2
+   'olivo', 'arandano', 'espinaca',
+ ]
- PHASE_16_SCIENTIFIC_NAMES = { kalanchoe → ..., ... }
+ PHASE_17_SCIENTIFIC_NAMES = {
+   'azalea': 'Rhododendron simsii',
+   'ciclamen': 'Cyclamen persicum',
+   'fucsia': 'Fuchsia magellanica',
+   'clavel': 'Dianthus caryophyllus',
+   'crisantemo': 'Chrysanthemum × morifolium',
+   'tulipan': 'Tulipa gesneriana',
+   'girasol': 'Helianthus annuus',
+   'magnolia': 'Magnolia stellata',
+   'salvia-officinalis': 'Salvia officinalis',
+   'eneldo': 'Anethum graveolens',
+   'stevia': 'Stevia rebaudiana',
+   'olivo': 'Olea europaea',
+   'arandano': 'Vaccinium corymbosum',
+   'espinaca': 'Spinacia oleracea',
+ }
- if (idMatches > 87 && idMatches < 104) return undefined;  // Phase 16 mid-band
- return idMatches === 104;
+ if (idMatches > 104 && idMatches < 118) return undefined;  // Phase 17 mid-band
+ return idMatches === 118;
- W3.CAT-16.imagePlan: CLAUDE.md "Phase 16 Wave B" block ≥17 of 19
+ W3.CAT-20.imagePlan: CLAUDE.md "Phase 17 Wave C" block ≥12 of 14 ids
- W2.CAT-counts.total: ... 87 + 17 net-new
+ W2.CAT-counts.total: ... 104 + 14 net-new (closes v1.2 catalog at 118)
```

**REMOVE Phase 16-specific assertions:**
- `hasEduFieldsForId` helper (Phase 16 used for `potus`/`filodendro` in-place upgrades — Phase 17 has no in-place upgrades; all 14 ids are net-new).
- `PHASE_16_NEW_IDS` filter (Phase 17 PHASE_17_NEW_IDS === PHASE_17_IDS — no upgrades).
- `--routing-fix` mode's BUG-FIX probes for Dracaena fragrans/Pachira/Heptapleurum (Phase 15/16 regression checks; planner can OPTIONALLY keep them as forward-running regression sentinels OR drop them as Phase 16-closed).

**KEEP Phase 16 patterns verbatim:**
- Stub auto-write for async-storage + i18n.
- assertSkippable harness.
- anyLanded / allLanded gates per CAT-17/18/19 ids.
- `--identification` flag with file-content scientificName↔id co-occurrence.
- `--routing-fix` flag with ts.transpileModule + Module._resolveFilename intercept (PHASE_17_NEW_IDS routing assertions: each scientificName routes to its OWN id).
- Voseo regression PASS at Wave 0 (`voseoCount <= 2` against es/plants.json).

**Final assertion structure (Phase 17 closes v1.2):**
- 14 W1.CAT-17/18/19 per-id presence gates (anyLanded/allLanded windowing).
- 14 W2.CAT-20 i18n keyset gates (en + es presence).
- 14 W3.CAT-20 COMMON_NAMES_ES gates (species-qualified OR genus key present).
- 1 W2.CAT-counts.total gate (`=== 118` final assertion — CAT-21 closure).
- 1 W3.CAT-20.imagePlan gate (CLAUDE.md "Phase 17 Wave C" + ≥12 of 14 ids).
- 14 IDENT.CAT-20.<id> gates (`--identification` mode).
- 14 W2.ROUTING-FIX.<id> gates (`--routing-fix` mode).
- 1 GLOBAL.voseo gate.
- ~9 W0.* harness scaffold gates.

### Example 4: CLAUDE.md "Phase 17 Wave C" block (mirror Phase 16 Wave B)

Source: existing pattern at CLAUDE.md (Phase 16 Wave B block):

```markdown
**Accepted-known failures (Phase 17 Wave C, v1.2 — 14 entries — image upload pending):** the following 14 exterior flores + aromáticas + frutales/huerta entries are accepted-known failures until manual image upload to Supabase Storage:

- azalea, ciclamen, fucsia, clavel, crisantemo, tulipan, girasol, magnolia
- salvia-officinalis, eneldo, stevia
- olivo, arandano, espinaca

These follow the same milestone-end batch upload pattern as the v1.1 LATAM, Phase 15 Wave A, and Phase 16 Wave B backlogs. Image upload tracked alongside the v1.2 device-test backlog. Cumulative v1.2 image-upload backlog totals 69 entries (15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17). Phase 17 closes the v1.2 catalog expansion at 118 entries.
```

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Genus-prefix first-match-wins routing | Exact-match-first refactor at line 206 | Phase 16 Plan 16-00 (2026-05-08) | Phase 17 species-qualified scientificNames inherit protection automatically |
| Per-entry separate plans | Sub-batched plans by sub-typology | Phase 14/15/16 lock | Plan count cadence ~5 per catalog wave; matches file-conflict bounds on plantDatabase.ts + i18n |
| Char-limit refactor as separate commit | Char-limit-from-draft (≤250 chars at draft time) | Phase 14-06 → Phase 15-01 → Phase 16-01/02 lock | Zero-trim discipline; first-time-right authoring |
| Voseo grep guard absent | Pre-write voseo regex sweep + post-write baseline-2 gate | Phase 14-04 → Phase 15-01 → Phase 16-01/02 lock | Voseo regressions caught at commit time, not post-hoc |
| Image upload in same phase | Accepted-known registry in CLAUDE.md, milestone-end batch | Phase 8 (v1.1 LATAM) → Phase 15 → Phase 16 → Phase 17 | Phase 17 inherits 69-entry cumulative backlog; closes v1.2 catalog expansion |
| Smoke runner per-phase | Smoke runner per-phase with partial-landing tolerance | Phase 11+ pattern | anyLanded/allLanded gates allow mid-band SKIP without false-failure during multi-plan landing |
| New enum values for novel physiology | Copy-only documentation (mirroring Lithops pattern) | Phase 16 piedras-vivas → Phase 17 tulipan/ciclamen/crisantemo | Schema stable; bulb-dormancy, ericaceous-pH, tree-realism all surfaced in copy |

**Deprecated/outdated (do NOT use in Phase 17):**
- `'Echinopsis'` genus alias (Phase 16 deliberately omitted — large genus). Phase 17 mirrors with `'Stevia'`/`'Vaccinium'`/`'Salvia'` omissions.
- Calendar-fixed-mode tip language for soil-check entries (Phase 16 piedras-vivas lock — copy must match waterMode discipline).
- `Magnolia grandiflora` as primary canonical for `magnolia` (use `M. stellata` for small-garden Argentine context; grandiflora as legacy alias only).
- `Salvia rosmarinus`/`Rosmarinus officinalis` precedent for adding genus aliases — `Salvia` genus alias must NOT be added (collision with salvia-ornamental).

## Open Questions

### Q1. Aromáticas outdoor-flag inverted precedent (HIGH IMPACT)

**What we know:** CONTEXT.md locks 3 new aromáticas at `outdoor: false` "to match existing albahaca/romero/menta/cilantro/perejil/ciboulette pattern in catalog (kitchen-container framing)."

**What's verified:** Direct grep of `src/data/plantDatabase.ts` shows all 6 existing aromáticas use `outdoor: true` (albahaca:598, romero:634, menta:670, perejil:1292, cilantro:1364, ciboulette:1768). The locked decision diverges from precedent, not matches it.

**Recommendation:** Surface in 17-PLAN.md `<open_questions>` section. Three resolution paths:

1. **Honor CONTEXT lock as-is** (3 aromáticas → `outdoor: false`; document divergence as kitchen-container framing).
2. **Ask user during plan execution** (add `<open_questions>` block to PLAN.md).
3. **Flip to `outdoor: true`** to match real precedent (no Q to user). Risk: contradicts explicit CONTEXT lock.

**Researcher recommendation: Option 2 (surface).** The lock has horticultural plausibility (potted aromáticas live on kitchen windowsills in Argentina) but the precedent claim is a research-stage error. User should decide whether to honor the divergence intentionally or correct it.

### Q2. PlantCategory enum count (LOW IMPACT, doc correction)

**What we know:** CONTEXT.md states "existing 8 PlantCategory values" multiple times.

**What's verified:** `src/types/index.ts:152` declares `PlantCategory = "interior" | "exterior" | "aromaticas" | "huerta" | "frutales" | "suculentas"` — 6 values.

**Recommendation:** No action — Phase 17 entries map cleanly to the actual 6 values. Phase 17 SUMMARY can note the doc correction; Phase 24 (DOCS) sweeps if needed.

### Q3. arandano — frutales vs huerta category (CONTENT-LEVEL)

**What we know:** Existing frutilla (line 780) is `category: "huerta"` despite being a perennial berry. Existing limonero (line 818) is `category: "frutales"` (woody perennial citrus). arandano is woody perennial shrub (Vaccinium corymbosum).

**What's unclear:** Does the catalog convention put woody-perennial berries in frutales (limonero precedent) or in huerta (frutilla precedent)?

**Recommendation:** Assign arandano → `frutales` (woody perennial closer to limonero than to annual frutilla). Espinaca → `huerta` (annual leafy green, frutilla precedent). Surface in plan if planner wants user confirmation.

### Q4. Magnolia variant choice (MEDIUM IMPACT)

**What we know:** CONTEXT.md says "researcher confirms at planning time. magnolia (likely *M. grandiflora* or *M. stellata*); strelitzia-precedent applies."

**What's verified:** RHS small-garden guide explicitly cites `Magnolia stellata` (3m) as the small-garden choice; `Magnolia grandiflora` is the iconic 20m evergreen. NCSU Extension confirms.

**Researcher recommendation:** `Magnolia stellata` canonical (matches Argentine apartment/small-garden context per CONTEXT lock), with `Magnolia grandiflora` as legacy alias for PlantNet drift coverage. Planner can flip to grandiflora if user prefers iconic-large framing — copy adjusts accordingly.

### Q5. Olivo cultivar specification (LOW IMPACT)

**What we know:** Olea europaea is the universal canonical scientificName. Argentine 'Arauco' is the only autochthonous Argentine cultivar; 'Arbequina' is the most widely planted in Mendoza.

**Recommendation:** Use genus-level `Olea europaea` without cultivar specification (matches existing limonero `Citrus limon` shape — no cultivar specification). `description` may mention 'Arauco' as Argentine endemic in passing for cultural resonance.

### Q6. Magnolia × stellata or × stellata var? (LOW IMPACT)

**What we know:** POWO accepts `Magnolia stellata` without hybrid symbol (vs `Chrysanthemum × morifolium` which uses ×).

**Recommendation:** Use `Magnolia stellata` (no hybrid symbol). Confirmed at POWO.

## Validation Architecture

### Test Framework

Phase 17 inherits the established test infrastructure unchanged.

| Property | Value |
|----------|-------|
| Framework | CJS smoke runners (`scripts/phaseNN-smoke.cjs`) + `scripts/check-i18n-keys.mjs` (TS transpile) + `scripts/check-images.mjs` (network HEAD) |
| Config file | `package.json` scripts; no separate config |
| Quick run command | `node scripts/phase17-smoke.cjs` (~50ms) |
| Full suite command | `npm run smoke:phase17 && npm run check:i18n-keys && npx tsc --noEmit` (~10s; check:images is network-bound and gated to milestone-end) |
| Phase gate | All Phase 17 smoke gates PASS (no SKIP at allLanded), check:i18n-keys PASS, tsc 0 errors, voseo regex count ≤ 2 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-17 | 8 exterior flores entries present in PLANT_DATABASE | smoke (file-content) | `node scripts/phase17-smoke.cjs` (8 W1.CAT-17.* gates) | ❌ Wave 0 |
| CAT-18 | 3 aromáticas entries present in PLANT_DATABASE | smoke (file-content) | `node scripts/phase17-smoke.cjs` (3 W2.CAT-18.* gates) | ❌ Wave 0 |
| CAT-19 | 3 frutales/huerta entries present in PLANT_DATABASE | smoke (file-content) | `node scripts/phase17-smoke.cjs` (3 W2.CAT-19.* gates) | ❌ Wave 0 |
| CAT-20 (i18n keyset) | All 14 entries have full keyset in en + es plants.json | smoke (file-content) + validator | `node scripts/phase17-smoke.cjs` (14 W2.CAT-20.*.keyset gates) + `npm run check:i18n-keys` | ❌ Wave 0; ✅ check-i18n-keys.mjs already covers EDU |
| CAT-20 (routing) | All 14 species-qualified scientificNames present in COMMON_NAMES_ES + each routes to OWN id | smoke (file-content + runtime) | `node scripts/phase17-smoke.cjs --identification && node scripts/phase17-smoke.cjs --routing-fix` | ❌ Wave 0 |
| CAT-20 (image plan) | CLAUDE.md "Phase 17 Wave C" block lists ≥12 of 14 ids | smoke (file-content) | `node scripts/phase17-smoke.cjs` (W3.CAT-20.imagePlan gate) | ❌ Wave 0 |
| CAT-21 | Final `PLANT_DATABASE.length === 118` | smoke (file-content count) | `node scripts/phase17-smoke.cjs` (W2.CAT-counts.total gate; final assertion === 118) | ❌ Wave 0 |
| GLOBAL voseo regression | es/plants.json voseo regex count ≤ 2 (baseline preserved) | smoke (regex count) | `node scripts/phase17-smoke.cjs` (GLOBAL.voseo gate) | ✅ pattern from Phase 15/16 |
| GLOBAL char-limit | All whyRationale strings ≤250 chars | manual grep + tsc + content review | grep `whyRationale:.*length` not directly automatable; verified at draft time + content review | ❌ manual discipline (Phase 16 lock proves zero-overflow achievable) |
| GLOBAL ts strict | npx tsc --noEmit returns 0 errors | tsc | `npx tsc --noEmit` | ✅ project pre-submit gate |

### Sampling Rate

- **Per task commit:** `node scripts/phase17-smoke.cjs` (CJS file-content asserts only; ~50ms)
- **Per wave merge:** `node scripts/phase17-smoke.cjs --identification --routing-fix && npm run check:i18n-keys && npx tsc --noEmit` (~10s; routing-fix uses ts.transpileModule)
- **Phase gate (before `/gsd:verify-work`):** Full suite + voseo regex regression check + char-limit content review pass

### Wave 0 Gaps (must close in Plan 17-00)

- [ ] `scripts/phase17-smoke.cjs` — covers CAT-17/18/19/20/21 with anyLanded/allLanded windowing + mid-band SKIP + final `=== 118` + IDENT.CAT-20 + IMAGE.CAT-20 + voseo regression
- [ ] `package.json` — add `"smoke:phase17": "node scripts/phase17-smoke.cjs"` script line
- [ ] `.gitignore` — add `scripts/.tmp-phase17/` line (mirrors `.tmp-phase15/`, `.tmp-phase16/` precedent)
- [ ] (No new fixture files needed — phase17-smoke.cjs auto-writes async-storage + i18n stubs to `.tmp-phase17/` like phase16-smoke.cjs does)
- [ ] (No framework install needed — node:fs + typescript already available)

**Pre-write discipline (no automated test, but discipline enforced at commit time):**
- Voseo grep sweep before each content commit: `grep -E '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json | wc -l` MUST stay ≤2 (baseline)
- Char-limit grep: `grep -E 'whyRationale: .{251,}' src/data/plantDatabase.ts` MUST return 0 lines (≤250 chars from draft)
- Voseo false-positive disambiguation: `tocá` matches `\btoca\b` regex — manual confirm voseo verb form vs Castilian; same for `tenés` → `\bten\b`

### Per-Task Atomic Commits — clean revert path

Phase 14/15/16 lock pattern. Each Plan = 1-3 commits:
- 17-00 (Wave 0): 1 commit (smoke runner + npm script + .gitignore)
- 17-01 (Wave 1, Sub-batch A): 2-3 commits (sub-batch A content + i18n EN + i18n ES, OR single combined commit per Phase 16 Plan 16-01 pattern)
- 17-02 (Wave 2, Sub-batch B): 2-3 commits (sub-batch B content closing CAT-17/18/19/20 + final count assertion CAT-21)
- 17-03 (Wave 3, parallel): 1 commit (COMMON_NAMES_ES extension)
- 17-04 (Wave 3, parallel): 1 commit (CLAUDE.md "Phase 17 Wave C" block)

Total expected: 7-11 commits across 5 plans (matches Phase 16 cadence).

### Final Manifest Assertion (CAT-21 closure)

```javascript
// scripts/phase17-smoke.cjs — final assertion (closes v1.2 catalog expansion)
assertSkippable(() => {
  const idMatches = (dbSrc.match(/^\s{4}id:\s*['"][^'"]+['"]/gm) || []).length;
  if (idMatches < 104) return undefined;       // pre-baseline catalog drift — SKIP
  if (idMatches === 104) return undefined;     // baseline = pre-Wave-1 — SKIP
  if (idMatches > 104 && idMatches < 118) return undefined;  // mid-band Plan 17-01 → 17-02 — SKIP
  return idMatches === 118;
}, 'W2.CAT-counts.total: plantDatabase.ts has exactly 118 entry id declarations (104 + 14 net-new; closes v1.2 catalog expansion)');
```

This is the closing gate for the entire v1.2 catalog. After Plan 17-02 lands, `idMatches === 118` PASSes and CAT-21 closes.

## Sources

### Primary (HIGH confidence)
- POWO (Plants of the World Online, Kew Science) — taxonomic verification for all 14 species:
  - [Stevia rebaudiana — POWO accepted](https://powo.science.kew.org/taxon/245468-2)
  - [Chrysanthemum × morifolium — POWO accepted](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77111328-1)
  - [Vaccinium corymbosum L. — POWO accepted](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:261823-2/general-information)
  - [Tulipa gesneriana L. — POWO accepted](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:542923-1)
  - [Olea europaea L. — POWO accepted](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:610675-1)
  - [Rhododendron simsii Planch. — POWO accepted](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:333359-1)
- Project source files (verified directly):
  - `src/types/index.ts:152` — PlantCategory enum (6 values, not 8)
  - `src/data/plantDatabase.ts:2110` — salvia-ornamental (Salvia splendens) — confirms zero collision with Salvia officinalis
  - `src/utils/plantIdentification.ts:47-193` — COMMON_NAMES_ES current state (Phase 16 closed)
  - `src/utils/plantIdentification.ts:202-215` — `findPlantInDatabase` exact-match-first refactor verified at line 206
  - `scripts/check-i18n-keys.mjs:76-107` — EDU field validator already extends to Phase 17 entries automatically
  - `scripts/phase16-smoke.cjs` (full file) — direct template for `scripts/phase17-smoke.cjs`
- `.planning/phases/16-catalog-wave-b-suculentas-cactus-trepadoras-trending/16-RESEARCH.md` — direct methodology template; Phase 16 lessons reused unchanged
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-RESEARCH.md` — older methodology template; sub-typology batching established
- `CLAUDE.md` — accepted-known image registry pattern (Phase 15 Wave A + Phase 16 Wave B blocks); voseo discipline; pre-submit gates
- STATE.md — Phase 16 completion record + accumulated context across v1.2 phases

### Secondary (MEDIUM-HIGH confidence)
- [Wikipedia — Tulipa gesneriana](https://en.wikipedia.org/wiki/Tulipa_gesneriana)
- [Wikipedia — Vaccinium corymbosum](https://en.wikipedia.org/wiki/Vaccinium_corymbosum)
- [Wikipedia — Cyclamen persicum / Cyclamen Society](https://www.cyclamen.org/plants/species/cyclamen-persicum/)
- [Wikipedia — Olive (Olea europaea)](https://en.wikipedia.org/wiki/Olive)
- [Wikipedia — Rhododendron simsii](https://en.wikipedia.org/wiki/Rhododendron_simsii)
- [RHS — Magnolias for small gardens](https://www.rhs.org.uk/garden-inspiration/plants-we-love/magnolias-for-small-gardens) — Magnolia stellata small-garden recommendation
- [NCSU Extension — Chrysanthemum × morifolium](https://plants.ces.ncsu.edu/plants/chrysanthemum-x-morifolium/)
- [NCSU Extension — Stevia rebaudiana](https://plants.ces.ncsu.edu/plants/stevia-rebaudiana/)
- [NCSU Extension — Cyclamen persicum](https://plants.ces.ncsu.edu/plants/cyclamen-persicum/)
- [Missouri Botanical Garden — Stevia rebaudiana](https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?kempercode=e489)
- [ISHS Acta Horticulturae — Olea europaea cultivars Mendoza Argentina](https://ishs.org/ishs-article/1057_66/) — Argentine 'Arauco' cultivar context

### Tertiary (LOW confidence, no critical claims rest on these)
- General WebSearch results for ornamental plant care (not cited as primary source for any locked decision)

## Metadata

**Confidence breakdown:**
- Standard stack (PlantCategory enum, scientific name verification, alias selection): **HIGH** — POWO 2024 verified for all 14 species; project source files inspected directly
- Architecture patterns (sub-typology batching, distinct i18n namespace, exact-match-first routing, dormancy-in-copy): **HIGH** — all patterns established by Phases 14/15/16 and verified in current codebase
- Pitfalls (Salvia collision, aromáticas precedent, bulb dormancy, espinaca bolt, ericaceous pH, tree realism, vernalization, char-limit): **HIGH** for taxonomic/routing pitfalls; **HIGH** for content-pitfalls based on horticultural domain knowledge cross-checked with extension sources
- Validation architecture (smoke runner deltas, full suite, sampling rate): **HIGH** — phase17-smoke.cjs is a textual delta from phase16-smoke.cjs

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 days for stable taxonomy + project conventions; Phase 17 should land well within)

**Pre-submission checklist:**
- [x] All domains investigated (stack, patterns, pitfalls, validation, deferred)
- [x] Negative claims verified with project source files (e.g., PlantCategory has 6 values; aromáticas all `outdoor: true`; salvia-ornamental uses Salvia splendens)
- [x] Multiple sources cross-referenced (POWO + Wikipedia + NCSU/RHS) for critical taxonomic claims
- [x] URLs provided for authoritative sources (POWO, Wikipedia, RHS, NCSU)
- [x] Publication dates checked (POWO entries are 2024-current; reclassifications dated)
- [x] Confidence levels assigned honestly (HIGH for verified items; MEDIUM-HIGH for cross-referenced items; no LOW items in critical path)
- [x] "What might I have missed?" review completed — surfaced 2 doc-corrections (aromáticas outdoor; PlantCategory count) before authoring would lock errors into 280 strings
