# Phase 16: Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending - Research

**Researched:** 2026-05-07
**Domain:** Catalog data extension at scale (19 entries × 10 fields × 2 locales = 380 strings + 19 catalog defaults + identification routing + image plan documentation), with NEW genus-prefix collision risk surface
**Confidence:** HIGH for content/authoring patterns (Phase 14 + 15 lock); HIGH for taxonomic name verification (POWO/Wikipedia/extension cross-checks); MEDIUM-HIGH for routing collision mitigation (requires either entry-reorder or `findPlantInDatabase` change — Phase 15 latent bug surfaces here)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary**

Add 19 specific plant species to `PLANT_DATABASE` with full v1.1 + Phase 14 EDU schema (10 fields per entry). Author voseo i18n in EN + ES (≈380 NEW strings). Extend `COMMON_NAMES_ES` in `src/utils/plantIdentification.ts` so PlantNet identification routes to curated entries. Document image plan: each entry's image registered as accepted-known failure in `CLAUDE.md` mirroring Phase 15 Wave A precedent (image upload deferred to milestone-end batch).

The 19 species are LOCKED:
- **CAT-13 (10 cactus/suculentas):** kalanchoe, siempreviva, piedras-vivas, nopal, mammillaria, corona-espinas, gasteria, senecio-rowleyanus, cactus-navidad, agave
- **CAT-14 (4 trepadoras/colgantes):** potus, filodendro, hoya, mini-monstera *(locked — see decisions table)*
- **CAT-15 (5 trending):** strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica (Dracaena angolensis — distinct from existing `sansevieria`), cactus-san-pedro

Catalog goes from 87 → 106 entries.

**Out of scope:** Catalog Wave C (Phase 17). New `PlantCategory` enum values. Browse-catalog UI. Image sourcing/upload tooling beyond accepted-known registry. Pet toxicity field (Phase 19).

**CAT-14 trepadora species selection (locked)**

| Id | Scientific name | Habit | Aliases |
|----|------|------|---------|
| `potus` | *Epipremnum aureum* | Vine, climbs/cascades | *Pothos aureus*, *Scindapsus aureus* |
| `filodendro` | *Philodendron hederaceum* | Vine, heart-leaf | *Philodendron scandens* |
| `hoya` | *Hoya kerrii* | Slow-growing succulent vine | (no major synonyms) |
| `mini-monstera` | *Rhaphidophora tetrasperma* | Climbs with moss pole | "Monstera minima", "Philodendron Ginny", "Philodendron Piccolo" |

**Outdoor flag exceptions (locked — botanically accurate)**

| Entry | `outdoor` | Rationale |
|-------|-----------|-----------|
| eucalipto | `true` | Tree species; only outdoor-viable in Argentine climate |
| agave | `true` | Large desert species; outdoor in temperate/subtropical regions |
| nopal | `true` | Opuntia tree-cactus; outdoor or very large container |
| cactus-san-pedro | `true` | Trichocereus pachanoi; large columnar cactus |
| All other 15 entries | `false` | Interior-tracking app default |

**Plan structure (mirrors Phase 15)**

- **Wave 0 (16-00):** smoke runner scaffold `scripts/phase16-smoke.cjs` with partial-landing-tolerant SKIP gates for CAT-13/14/15/16. Mid-band count SKIP: `idMatches > 87 && idMatches < 106 → undefined`.
- **Wave 1 (16-01):** Sub-batch A — cactus + suculentas (10 entries from CAT-13). Shared whyRationale templates for CAM metabolism, water-storage tissue, dormancy cycles.
- **Wave 2 (16-02):** Sub-batch B — trepadoras + trending non-succulent (potus, filodendro, hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica) — 8 entries (cactus-san-pedro/agave/nopal pre-folded into Sub-batch A as cactus physiology).
- **Wave 3 (parallel: 16-03 + 16-04):** COMMON_NAMES_ES extension for all 19 (CAT-16) ‖ CLAUDE.md image-plan registry (CAT-16).

**Trending entries — special cases**
- `bambu-suerte`: water-culture-primary plant; use `waterMode: 'fixed'` with low frequency, document water-culture variant in copy.
- `cactus-san-pedro`: purely horticultural framing — no Andean ceremonial/psychoactive context.
- `sansevieria-cilindrica`: distinct id from existing `sansevieria` (Dracaena trifasciata). i18n keys `sansevieria-cilindrica.*` namespace prevents collision with `sansevieria.*` keys. Smoke runner MUST assert each species-qualified scientificName routes to its OWN id.
- `strelitzia`: *Strelitzia reginae* (compact pot variant); CONTEXT.md explicitly excluded *S. nicolai*.
- `eucalipto`: species TBD by researcher (recommendation below).

**Lithops physiology — full custom whyRationale**
Mesemb family (Aizoaceae); annual leaf-replacement cycle; nearly dry summer dormancy; complete withhold during leaf replacement. Generic-succulent copy will misrepresent.

**Carrying forward from Phase 14/15**
- Voseo discipline (ES): regá / sacá / podés / querés / podá / movela / tocá / hacé. Voseo grep guard baseline = 2 (preserved through Phase 15). Phase 16 must NOT increase.
- whyRationale ≤ 250 chars drafted at length, not post-hoc trimmed.
- Mechanism citations per sub-type (CAM, mesembs, anthocyanins, etc.) — never generic.
- Defer all images to accepted-known — extend CLAUDE.md "Phase 15 Wave A" block with "Phase 16 Wave B" block.
- PlantNet alias coverage ≤2 aliases per entry (canonical scientificName + 1-2 well-known synonyms).
- Smoke runner Wave 0 with partial-landing tolerance (anyLanded/allLanded gates).
- Atomic per-task commits — clean revert path.
- Field shape parity: every NEW entry has all 5 legacy + all 5 EDU fields.

**Defaults (Claude's discretion within these guardrails)**
- waterMode: `'fixed'` for cactus + most succulents; `'soil-check'` for trepadoras + Lithops. Bambu-suerte → `'fixed'` with water-culture caveat.
- lightLevel: cactus/succulents → `'bright_indirect'` to `'direct'`; trepadoras → `'bright_indirect'`; trending mixed.
- tempMin/tempMax: standard tropical for trepadoras (15-30°C); succulent/cactus tolerates wider (5-35°C); Lithops 5-30°C.
- humidity: `'baja'` for most cactus + sansevieria-cilindrica + bambu-suerte; `'media'` for trepadoras; `'alta'` for hoya kerrii.
- category: map to existing PlantCategory values.

### Claude's Discretion
- Trending special cases — bambu-suerte water-culture framing, cactus-san-pedro horticultural-only, sansevieria-cilindrica distinct routing, strelitzia + eucalipto species selection.
- Sub-batch organization — exact split between Sub-batch A and B.
- PlantNet alias selection per entry (capped ≤2).
- Char-limit ceiling enforcement ≤250 char on whyRationale at draft time.
- Per-task autonomous commits.
- Whether to fold image-plan registry update into Sub-batch B plan or split into its own plan.

### Deferred Ideas (OUT OF SCOPE)
- Catalog Wave C (Phase 17).
- Pet toxicity field (Phase 19) — added in Phase 19 to all 120 entries.
- Image upload tooling — automated CC0 image search + upload pipeline.
- Image upload for the existing 38-entry accepted-known list (15 v1.1 + 23 Phase 15).
- Browse-catalog UI.
- PlantNet exhaustive alias coverage.
- Cactus-san-pedro ethnobotanical context.
- Bambu-suerte `waterMode: 'water-culture'` enum value.
- Strelitzia nicolai (giant) variant.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-13 | 10 cactus/suculentas added: kalanchoe, siempreviva, piedras-vivas, nopal, mammillaria, corona-espinas, gasteria, senecio-rowleyanus, cactus-navidad, agave | §Standard Stack — taxonomic-name table; §Architecture Patterns — Pattern 1 (PlantDBEntry shape), Pattern 2 (sub-typology batching); §Code Examples — full entry shape |
| CAT-14 | 4 trepadoras/colgantes added: potus, filodendro, hoya, mini-monstera | §**Architecture Patterns — Pattern 6 (CRITICAL: id collision protocol — `potus` and `filodendro` already exist in PLANT_DATABASE; planner MUST decide merge-vs-replace strategy)**; §Code Examples — alias mapping for taxonomic drift |
| CAT-15 | 5 trending added: strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro | §Standard Stack — species selection (S. reginae compact, E. citriodora aromatic); §Common Pitfalls — Dracaena genus-prefix collision (3 Dracaena entries after Phase 16) |
| CAT-16 | All Wave B entries have full v1.1 + EDU keyset, identification map entries, and image plan | §Architecture Patterns — Pattern 3 (i18n authoring), Pattern 4 (PlantNet routing primary path = `findPlantInDatabase`), Pattern 5 (accepted-known image registry); §Don't Hand-Roll — existing validators cover Wave B automatically |
</phase_requirements>

## Summary

Phase 16 is a **catalog data extension + i18n authoring + identification routing + image documentation** phase mirroring Phase 15's playbook with three NEW risks the planner must address:

1. **CAT-14 ID-COLLISION (CRITICAL):** Two of the four locked CAT-14 ids — `potus` (Epipremnum aureum) and `filodendro` (Philodendron hederaceum) — **ALREADY EXIST** in PLANT_DATABASE (lines 30 and 1038, both v1.0/v1.1 entries). They lack the 5 Phase 14 EDU fields. CONTEXT.md treats CAT-14 as 4 NEW entries (380-string estimate assumes 19 net adds), but reality is CAT-14 = 2 net new (`hoya`, `mini-monstera`) + 2 in-place EDU upgrades (`potus`, `filodendro`). Final catalog count `=== 106` only holds if those 2 are upgrades, not duplicates. Planner MUST resolve at planning time.
2. **CAT-15 GENUS-PREFIX COLLISION:** `findPlantInDatabase` uses array-order-first-match on genus prefix. Phase 16 introduces 2 more *Dracaena* species (`bambu-suerte` = D. sanderiana, `sansevieria-cilindrica` = D. angolensis) on top of existing `sansevieria` (D. trifasciata, line 136) and `dracaena` (D. fragrans, line 1002). All 4 collide; ANY `Dracaena ...` PlantNet result routes to `sansevieria` (first occurrence). Mitigation requires either entry-reorder OR `findPlantInDatabase` exact-match-first refactor — both are single-edit fixes; planner picks.
3. **CAT-13 SUCCULENT/CACTUS TAXONOMIC DRIFT:** Three 2024-relevant reclassifications affect routing reliability:
   - `senecio-rowleyanus`: POWO accepts *Curio rowleyanus* (since 1999), but ecosystem still uses *Senecio rowleyanus* heavily. Recommendation: `scientificName: 'Curio rowleyanus'` (current accepted) + alias *Senecio rowleyanus* in COMMON_NAMES_ES.
   - `cactus-san-pedro`: POWO 2024 accepts *Echinopsis pachanoi* (Trichocereus is now a synonym of Echinopsis). Recommendation: `scientificName: 'Echinopsis pachanoi'` + alias *Trichocereus pachanoi*.
   - `sansevieria-cilindrica`: POWO 2018 accepts *Dracaena angolensis* (was *Sansevieria cylindrica*). Already locked in CONTEXT.md.

The dominant **technical surface is content authoring** on locked rails, NOT new code:
- 19 catalog entries × 10 fields each = 190 catalog field declarations (minus 2 if `potus`/`filodendro` are upgrades)
- 19 entries × 10 i18n keys × 2 locales = 380 strings (or 360 if upgrades)
- ~25 scientificName → catalog id mappings in COMMON_NAMES_ES (most genera already mapped from v1.1; only ~6 net-new genera needed)
- 1 CLAUDE.md "Phase 16 Wave B" block addition

**Primary recommendation:** Plan as 4 plans matching CONTEXT-locked structure — (W0) smoke runner scaffold + collision-aware assertion shape; (W1) Sub-batch A: 10 cactus/suculentas; (W2) Sub-batch B: ~9 trepadoras+trending (depending on CAT-14 resolution); (W3 parallel) COMMON_NAMES_ES extension + CLAUDE.md image-plan. Resolve CAT-14 collision in Wave 0 of planning (recommended path: in-place EDU upgrade for `potus`/`filodendro`, treat them as 2 of CAT-14's 4 ids; final entry count adds 17 net new = 87 + 17 = 104 ≠ 106 — OR add as new entries with different ids like `potus-aureo`/`filodendro-corazon`. **Planner decision required.**). Char-limit-from-draft + voseo grep + locale parity per content commit. Smoke runner asserts EACH Phase 16 entry's species-qualified scientificName routes to its own id (closes Dracaena collision).

## Standard Stack

### Core (already installed; nothing new)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-i18next` | `^16.5.4` | Per-key surface for catalog content | Project lock; covers Phase 14 EDU keys |
| `typescript` | `~5.x` | Catalog-defaults inline content + PlantDBEntry typecheck | Project standard; `npx tsc --noEmit` pre-submit gate |
| `node:fs` (smoke runner) | builtin | File-content asserts for catalog count + i18n key presence | Phase 11/12/13/14/15 smoke-runner pattern |

### Supporting (existing utilities being extended)

| Module | Purpose | Phase 16 change |
|---|---|---|
| `src/data/plantDatabase.ts` (~3300 LOC after Phase 15) | PLANT_DATABASE source of truth | +17-19 entries (~50 LOC each → ~850-950 LOC) depending on CAT-14 resolution |
| `src/i18n/locales/en/plants.json` (~3100 LOC) | EN keyset | +17-19 entry blocks (each ~30 LOC) |
| `src/i18n/locales/es/plants.json` (~3100 LOC) | ES voseo keyset | +17-19 entry blocks |
| `src/utils/plantIdentification.ts` (~280 LOC after Phase 15) | `COMMON_NAMES_ES` map | +~25-30 mapping entries (19 canonical + ≤2 aliases each, minus genera already covered) |
| `scripts/check-i18n-keys.mjs` | Validator | NO change — already covers EDU fields conditionally (Phase 14-01) |
| `scripts/check-images.mjs` | Image HEAD-check | NO source change — accepted-known list grows in CLAUDE.md only |
| `scripts/phase16-smoke.cjs` | NEW | Phase-specific smoke runner (mirror phase15-smoke.cjs) |
| `package.json` | npm scripts | +`smoke:phase16` line |
| `CLAUDE.md` | Accepted-known image registry | +1 entry block grouping the 19 Phase 16 ids |

### Canonical Scientific Names (verified against POWO 2024-2025 + Wikipedia + extension sources)

| Id | Recommended scientificName | Source/Reasoning | Aliases for COMMON_NAMES_ES |
|----|--------------------------|----|----|
| `kalanchoe` | `Kalanchoe blossfeldiana` | "Florist Kalanchoe" — most widely-grown houseplant kalanchoe; flowering. K. daigremontiana ("mother of thousands") is a different species and rejected. | (existing `'Kalanchoe': 'Kalanchoe'` genus alias already covers) |
| `siempreviva` | `Sempervivum tectorum` | "Common houseleek" — most-cited Sempervivum species; existing `getMockIdentificationResult` already returns this name; `'Sempervivum': 'Siempreviva'` already in COMMON_NAMES_ES. | (genus already covered) |
| `piedras-vivas` | `Lithops lesliei` | Most-recognized RHS Garden-Merit Lithops species; commonly sold. Accept `Lithops spp.` as alternative if planner prefers genus-level. Existing `'Lithops': 'Piedras vivas'` covers genus. | (genus already covered) |
| `nopal` | `Opuntia ficus-indica` | POWO accepted (Mill.); the canonical "nopal" species (Indian fig opuntia / cactus pear). Existing `'Opuntia': 'Nopal'` covers genus. | (genus already covered) |
| `mammillaria` | `Mammillaria elongata` | "Ladyfinger Cactus" — most popular indoor Mammillaria; clumping habit; beginner-friendly. Existing `'Mammillaria': 'Mammillaria'` covers genus. | (genus already covered) |
| `corona-espinas` | `Euphorbia milii` | "Crown of Thorns" — universally accepted name. Existing `'Euphorbia': 'Euforbia'` covers GENUS but with different display name. Add species-qualified `'Euphorbia milii': 'Corona de espinas'`. | `'Euphorbia milii'` species-qualified |
| `gasteria` | `Gasteria bicolor` | Most common indoor Gasteria; "Lawyer's tongue"; variable but widely cultivated. Alternative: G. carinata var. verrucosa (more iconic appearance). Existing `'Gasteria': 'Gasteria'` covers genus. | (genus already covered) |
| `senecio-rowleyanus` | **`Curio rowleyanus`** | **POWO accepted (since 1999); reclassified from Senecio**. Wikipedia, NCSU Extension, iNaturalist all use Curio. PlantNet/community still heavily use Senecio. **Add BOTH for routing reliability.** | `'Curio rowleyanus'` (canonical) + `'Senecio rowleyanus'` (legacy) |
| `cactus-navidad` | `Schlumbergera × buckleyi` | True "Christmas cactus" (December bloomer); hybrid of S. russelliana × S. truncata. Note: `S. bridgesii` is an INVALID name (Wikipedia confirms erroneous publication). `S. truncata` is "Thanksgiving cactus" (different species, November bloomer). Recommended canonical for "cactus-navidad": `'Schlumbergera × buckleyi'`. | `'Schlumbergera truncata'` (frequently mis-sold/PlantNet returns), `'Schlumbergera'` (genus) |
| `agave` | `Agave americana` | "Century plant" — most cold-hardy and widely cultivated; better Argentine outdoor candidate than A. attenuata (frost-sensitive). | (no Agave genus in COMMON_NAMES_ES yet; add `'Agave': 'Agave'`) |
| `potus` | `Epipremnum aureum` | **EXISTING** (line 30). PlantNet returns this name reliably; canonical. Already in COMMON_NAMES_ES line 48. | `'Pothos aureus'` (legacy synonym) [≤2 alias cap honored] |
| `filodendro` | `Philodendron hederaceum` | **EXISTING** (line 1038). Heart-leaf philodendron. Already covered by genus `'Philodendron': 'Filodendro'`. | `'Philodendron scandens'` (legacy synonym) [≤2 cap honored] |
| `hoya` | `Hoya kerrii` | POWO accepted. Synonym `Hoya obovata var. kerrii` is rare in PlantNet. Sweetheart Plant. | (no major synonyms; canonical is enough) |
| `mini-monstera` | `Rhaphidophora tetrasperma` | Wikipedia + NCSU Extension accept. Frequently mis-sold as "Monstera minima" / "Philodendron Ginny" / "Philodendron Piccolo" — all NOT real Latin names. **Use `Rhaphidophora tetrasperma` only**; the others are commercial names, not PlantNet-routable scientific names. | (no Latin synonyms — commercial names go in `description`/`name` copy) |
| `strelitzia` | `Strelitzia reginae` | CONTEXT.md locked compact (S. reginae). Compact 1-1.5m vs S. nicolai 2-3m. PlantNet returns species-qualified reliably. | `'Strelitzia'` (genus) for genus-level fallback |
| `eucalipto` | `Eucalyptus citriodora` | **Recommended**: aromatic-leaf species (lemon eucalyptus); citronellal scent; widely sold in Argentine nurseries for aromatic-pot use. CONTEXT-listed alternative *E. globulus* is the plantation/timber tree (less common as ornamental). NOTE: POWO synonym `Corymbia citriodora` since 2000s. | `'Corymbia citriodora'` (POWO accepted as separate genus), `'Eucalyptus'` (genus) |
| `bambu-suerte` | `Dracaena sanderiana` | Wikipedia accepted. *Dracaena braunii* sometimes treated as synonym, sometimes as separate species (W. African; 5x shorter flowers). For PlantNet routing reliability, use *D. sanderiana*. | `'Dracaena braunii'` (legacy/contested synonym) [≤2 cap honored] |
| `sansevieria-cilindrica` | `Dracaena angolensis` | POWO 2018 accepted (Welw. ex Carrière) Byng & Christenh. *Sansevieria cylindrica* now synonym. PlantNet may return either. | `'Sansevieria cylindrica'` (legacy synonym, very common in trade) |
| `cactus-san-pedro` | **`Echinopsis pachanoi`** | **POWO 2024 accepted (Britton & Rose) H.Friedrich & G.D.Rowley**. Trichocereus reduced to Echinopsis synonym. Communities/PlantNet still use Trichocereus heavily. | `'Trichocereus pachanoi'` (legacy synonym), `'Trichocereus macrogonus var. pachanoi'` (interim 2012-2024 name; rarer) |

**Net-new genera needing new COMMON_NAMES_ES entries:** `Hoya`, `Rhaphidophora`, `Strelitzia`, `Eucalyptus`/`Corymbia`, `Dracaena sanderiana`, `Dracaena angolensis`, `Echinopsis`, `Trichocereus`, `Curio`, `Senecio rowleyanus` (species-qualified), `Schlumbergera`, `Agave`, `Euphorbia milii` (species-qualified to override genus default `'Euforbia'`).

**Already-covered genera (no NEW entry needed; existing genus mapping suffices for routing):** `Kalanchoe`, `Sempervivum`, `Lithops`, `Opuntia`, `Mammillaria`, `Gasteria`, `Epipremnum aureum`, `Philodendron`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| `Curio rowleyanus` | `Senecio rowleyanus` | Curio is POWO accepted (since 1999) but ecosystem heavily uses Senecio. Solution: use Curio as canonical scientificName + Senecio alias. Best of both. |
| `Echinopsis pachanoi` | `Trichocereus pachanoi` | Echinopsis is POWO 2024 accepted; Trichocereus genus reduced to synonym. Same alias-route solution. |
| `Schlumbergera × buckleyi` | `Schlumbergera truncata` | If "cactus-navidad" colloquially means "Christmas cactus" (December), buckleyi is correct. If it means generic Schlumbergera (Nov-Jan bloom range), truncata is more PlantNet-routable. Recommend buckleyi (CONTEXT framing is "Christmas") + truncata alias. |
| `Eucalyptus citriodora` | `Corymbia citriodora` (POWO) | POWO since 2000s places lemon eucalyptus in Corymbia, but Argentine market and PlantNet still return Eucalyptus citriodora. Use Eucalyptus canonical + Corymbia alias. |
| In-place EDU upgrade for `potus`/`filodendro` | New entry ids `potus-aureo`/`filodendro-corazon` | Upgrade keeps user-saved plants linked (`databaseId` continuity); new ids would orphan v1.0/v1.1 saved Plants. **Recommend upgrade.** Means CAT-14 = 2 net new + 2 upgrades; final count goes 87 → 104 ≠ 106. Planner adjusts ROADMAP success criterion OR adds 2 placeholder bonus entries. |
| Append entries grouped by sub-typology | Strict alphabetical | Sub-typology grouping helps content quality (shared physiology citations); Phase 14/15 lock. |

**Installation:** None. All dependencies already installed.

## Architecture Patterns

### Recommended File Structure (no new files except smoke runner)

```
src/data/plantDatabase.ts        # +17-19 PlantDBEntry objects (sub-typology-grouped append + 2 in-place upgrades for potus/filodendro)
src/i18n/locales/en/plants.json  # +17-19 entry blocks
src/i18n/locales/es/plants.json  # +17-19 entry blocks (voseo)
src/utils/plantIdentification.ts # +25-30 lines in COMMON_NAMES_ES
scripts/phase16-smoke.cjs        # NEW — mirrors phase15-smoke.cjs
package.json                     # +"smoke:phase16" script
CLAUDE.md                        # +"Phase 16 Wave B" group in accepted-known list
```

### Pattern 1: Append (or Upgrade) PlantDBEntry to PLANT_DATABASE

**What:** Each new entry is a TypeScript object literal added to PLANT_DATABASE. Existing entries (`potus`, `filodendro`) are upgraded in-place by adding the 5 Phase 14 EDU fields (`careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`) — NOT re-declared as duplicates. Field-shape parity is verified by `scripts/check-i18n-keys.mjs` (already covers EDU conditionally).

**When to use:** Every new catalog entry. For CAT-14 collision: planner verifies entry exists, adds EDU fields in-place, adds matching i18n keys.

**Required fields per entry (after Phase 14 EDU schema):**
```typescript
{
  // ─── Required scalar identity ───
  id: string,                    // kebab-case slug
  name: string,                  // catalog default ES (overridden by i18n at runtime)
  scientificName: string,        // canonical PlantNet-resolvable Latin name
  icon: string,                  // emoji (single grapheme)
  imageUrl: string,              // ${CATALOG_BASE_URL}/<id>.jpg pattern
  category: PlantCategory,       // 'interior' | 'exterior' | 'aromaticas' | 'huerta' | 'frutales' | 'suculentas'

  // ─── Required climate/care fields ───
  tempMin: number,               // °C
  tempMax: number,               // °C
  humidity: HumidityLevel,       // 'baja' | 'media' | 'alta'
  outdoor: boolean,              // false except eucalipto/agave/nopal/cactus-san-pedro

  // ─── Required content (catalog defaults; i18n keys override at runtime) ───
  tip: string,
  description: string,
  problems: PlantProblem[],      // length ≥ 1
  nutrients?: { type, homemade },// optional; if declared, i18n keys required

  // ─── v1.1 Precision Care fields ───
  lightLevel: LightLevel,        // 'direct' | 'bright_indirect' | 'medium_indirect' | 'low'
  waterSchedule: { warm, cold }, // days
  waterMode: WaterMode,          // 'fixed' | 'soil_check'
  waterDays?: number,            // legacy mirror of waterSchedule.warm
  sunHours?: number,             // legacy mirror of lightLevel mapping

  // ─── v1.2 Phase 14 EDU fields (REQUIRED for full coverage) ───
  careAction: { fixed?, soilCheck? },  // ≥1 sub-field per waterMode
  placementRecommended: string,        // ≤110 chars
  placementAlternatives: string[],     // 2-3 bullets, each ≤90 chars
  placementAvoid: string,              // ≤90 chars
  whyRationale: string,                // ≤250 chars; cites physiology mechanism
}
```

### Pattern 2: Sub-Typology Batching for Content Quality (Phase 16-specific)

**Phase 16 sub-typology groups (CONTEXT.md locked):**

```
Sub-batch A (10 entries) — Wave 1 — cactus/suculentas (CAM physiology):
  Cactus (true Cactaceae): nopal, mammillaria, cactus-navidad, cactus-san-pedro
  Crassulaceae succulents: kalanchoe, siempreviva, gasteria
  Mesembs (Aizoaceae) — special physiology: piedras-vivas
  Asteraceae succulents: senecio-rowleyanus
  Outliers: corona-espinas (Euphorbiaceae spurge — NOT a true cactus despite spines), agave (Asparagaceae monocots)

Sub-batch B (~7-9 entries depending on CAT-14 resolution) — Wave 2 — trepadoras + trending:
  Trepadoras: hoya, mini-monstera (and +potus, +filodendro as in-place upgrades, OR as 2 of the 4 new ids)
  Trending: strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica
```

**Per-sub-type physiology citation template (proven in Phase 14/15):**
- **CAM cactus + Crassulaceae:** "metabolismo CAM cierra estomas de día — fija CO2 nocturno, pierde menos agua, tolera sequía prolongada" (apply to all 10 cactus/suculentas EXCEPT piedras-vivas)
- **Mesembs (Lithops):** "perteneciente a las Aizoáceas mesemb — ciclo de reemplazo foliar anual: hojas nuevas absorben las viejas. Dormancia estival absoluta — un riego de verano puede reventarla."
- **Euphorbiaceae (corona-espinas):** "Euforbiácea espinosa — su apariencia cactiforme es convergencia evolutiva, no Cactaceae. Látex tóxico al corte. Floración casi continua con luz directa."
- **Asparagaceae monocots (agave):** "Suculenta xerófita en roseta — fotosíntesis CAM + acumulación de agua en hojas carnosas; floración monocárpica única tras décadas."
- **Senecio→Curio (string of pearls):** "Asterácea suculenta de hojas globosas — almacenan agua y limitan superficie evaporativa. Crece bajo dosel árido sudafricano."
- **Hoya kerrii:** "Asclepiadácea trepadora suculenta — hojas en forma de corazón con tejido CAM modificado. Tolera olvidos pero crece muy lento."
- **Mini-monstera (Rhaphidophora):** "Aroide trepadora — las fenestraciones aparecen al alcanzar tutor vertical (heteroblastia). Sin tutor → permanece juvenil sin agujeros."
- **Strelitzia reginae:** "Strelitziacea sudafricana — hojas paddle-shaped reducen pérdida de agua en savanna. Floración requiere luz brillante + maduración 3-4 años."
- **Eucalyptus citriodora:** "Mirtácea australiana — hojas con citronellal volátil (defensa anti-herbivoría). Crecimiento muy rápido en exterior; difícil mantener en maceta a largo plazo."
- **Bambu-suerte (Dracaena sanderiana):** "Asparagácea africana — adaptada a humedad ribereña, crece bien en cultivo hidropónico. Sensible a flúor del agua corriente."
- **Sansevieria-cilindrica (Dracaena angolensis):** "Asparagácea angoleña — hojas cilíndricas tubulares con almacén de agua + CAM. Tolerancia extrema a baja luz, sequía, descuido."

### Pattern 3: i18n Authoring Workflow (per-entry mirror) — UNCHANGED from Phase 15

For each new (or upgraded) entry: catalog default in `plantDatabase.ts` (ES voseo) is mirrored to `es/plants.json` (ES voseo, identical) AND to `en/plants.json` (natural English equivalent — NOT literal translation).

**Workflow:**
1. Author catalog default in plantDatabase.ts (ES voseo, ≤char limits from draft)
2. Mirror to es/plants.json (identical voseo strings) under entry.id key
3. Author EN parallel in en/plants.json (natural English; NOT literal translation)
4. Run: `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' es/plants.json` → count must equal baseline (currently 2)
5. Run: `npm run check:i18n-keys` → must PASS
6. Run: `npx tsc --noEmit` → must PASS
7. Run: `node scripts/phase16-smoke.cjs` → must PASS (and SKIPs flip per assertion)

### Pattern 4: PlantNet Routing — Primary Path is `findPlantInDatabase`

**Critical insight (carried from Phase 15):** The actual identification → catalog routing happens in `convertPlantNetResult()` calling `findPlantInDatabase(scientificName)`. The function does case-insensitive scientificName + genus prefix matching against PLANT_DATABASE. `COMMON_NAMES_ES` is ONLY used in the no-match fallback for display name.

**Phase 16 NEW concern: genus-prefix collision (Pitfall 6 in Phase 15 RESEARCH foreshadowed; now actualized).**

`findPlantInDatabase` source (line 153-163, verified 2026-05-07):
```typescript
export function findPlantInDatabase(scientificName: string): PlantDBEntry | undefined {
  const searchName = scientificName.toLowerCase();
  return PLANT_DATABASE.find(plant => {
    const dbName = plant.scientificName.toLowerCase();
    return dbName === searchName ||
           dbName.startsWith(searchName.split(' ')[0]) ||
           searchName.startsWith(dbName.split(' ')[0]);
  });
}
```

**Behavior is array-order-first-match.** With Phase 16:
- Existing PLANT_DATABASE order (relevant entries):
  - Line 138: `sansevieria` → `Dracaena trifasciata`
  - Line 1004: `dracaena` → `Dracaena fragrans`
  - Line 2729: `zamioculca` (Phase 15)
  - Line 2763: `cola-burro` → `Sedum morganianum` (Phase 15)
- Phase 16 will add (appended):
  - `bambu-suerte` → `Dracaena sanderiana` (after line ~3100)
  - `sansevieria-cilindrica` → `Dracaena angolensis` (after line ~3100)

**Result:** PlantNet returning ANY of `Dracaena fragrans` / `Dracaena sanderiana` / `Dracaena angolensis` will route to `sansevieria` (the first in array order whose scientificName starts with "Dracaena"). This is a **pre-existing latent bug** — Phase 15's smoke runner used species-qualified IDENT.CAT-11 assertions but only tested co-occurrence in `plantDatabase.ts`, NOT actual `findPlantInDatabase` routing. Phase 16 makes the bug observable by introducing 2 more genus-mate entries.

**Mitigation options (planner picks):**

1. **Refactor `findPlantInDatabase` to prefer exact-match over genus-prefix** (single 5-LOC change):
```typescript
export function findPlantInDatabase(scientificName: string): PlantDBEntry | undefined {
  const searchName = scientificName.toLowerCase();
  // First pass: exact match (case-insensitive)
  const exactMatch = PLANT_DATABASE.find(p => p.scientificName.toLowerCase() === searchName);
  if (exactMatch) return exactMatch;
  // Second pass: genus prefix (legacy behavior)
  return PLANT_DATABASE.find(plant => {
    const dbName = plant.scientificName.toLowerCase();
    return dbName.startsWith(searchName.split(' ')[0]) ||
           searchName.startsWith(dbName.split(' ')[0]);
  });
}
```
Simplest, most robust. Fixes existing latent bug (Dracaena fragrans → dracaena routes correctly post-fix). Recommended.

2. **Reorder entries** so each genus's "canonical" species appears first. Brittle (catalog growth re-introduces collisions); rejected.

3. **Compound primary key** (`id` + `scientificName`) — over-engineering; rejected.

**Smoke runner MUST assert:** for each Phase 16 entry, `findPlantInDatabase('<species-qualified scientificName>')?.id === '<expected id>'`. This requires `ts.transpileModule` runtime test (not just file-content regex), mirroring Phase 11/12/14 pattern. Phase 15's CJS file-content-only approach is INSUFFICIENT for this assertion — Phase 16 smoke runner needs ts-transpile path for the routing test.

### Pattern 5: Accepted-Known Image Registry (CLAUDE.md) — UNCHANGED from Phase 15

**Phase 16 Wave B addition (recommended single-block format, mirrors Phase 15 Wave A precedent at CLAUDE.md:179-200):**
```
**Phase 16 Wave B (v1.2, 19 entries — image upload pending):** the following 19 entries are accepted-known failures until manual image upload to Supabase Storage:
- kalanchoe, siempreviva, piedras-vivas, nopal, mammillaria
- corona-espinas, gasteria, senecio-rowleyanus, cactus-navidad, agave
- hoya, mini-monstera
- strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro
[+ potus, filodendro if upgraded — image already exists; no entry needed]
```

If `potus`/`filodendro` are in-place EDU upgrades, they DON'T need new image registry entries (their images already exist or are already in v1.1 accepted-known).

### Pattern 6 (NEW): CAT-14 ID Collision Resolution Protocol

**The collision:** CONTEXT.md locks CAT-14 ids as `potus, filodendro, hoya, mini-monstera`, and the success criterion locks `PLANT_DATABASE.length === 106` (87 + 19). But `potus` (line 30) and `filodendro` (line 1038) ALREADY exist as v1.0/v1.1 entries lacking only the 5 Phase 14 EDU fields.

**Three planner-decidable resolution paths:**

**Option A (RECOMMENDED): In-place EDU upgrade.**
- `potus` and `filodendro` get the 5 EDU fields added to their existing PlantDBEntry literals.
- `hoya` and `mini-monstera` are 2 net-new entries.
- Net catalog growth: 87 + 17 (10 cactus/suculentas + 5 trending + 2 net-new trepadoras) = **104**, NOT 106.
- **ROADMAP Success Criterion #1 must be amended** from `length === 106` to `length === 104` (or `length === 87 + 17`). User has already locked CAT-14 species; the math just needs reconciliation.
- Pros: Preserves user `databaseId` continuity for v1.0/v1.1 users with saved Potus/Filodendro plants. Zero data migration.
- Cons: Requires ROADMAP edit; smoke runner final-state count assertion changes.

**Option B: Distinct new ids.**
- `potus` → keep existing as-is; new entry `potus-aureo` (Epipremnum aureum) with EDU fields.
- `filodendro` → keep existing as-is; new entry `filodendro-corazon` (Philodendron hederaceum scandens) with EDU fields.
- Net catalog growth: 87 + 19 = **106** (matches success criterion).
- Pros: No ROADMAP edit needed.
- Cons: Two-entry duplication for the same scientificName (genus-prefix collision worsens — two `Epipremnum` entries; both Philodendron). Existing v1.0/v1.1 saved Plants stay on the OLD entry (which lacks EDU fields → modal continues to look bare). User confusion: catalog browse will show two "Potus"-like entries.

**Option C: Replace existing entries.**
- Delete v1.0 `potus`/`filodendro`; add new full-EDU entries with same id.
- Net catalog growth: 87 + 19 - 0 (replacement) = **106** (matches).
- Pros: Same id preserves continuity; new entries have full schema.
- Cons: Effectively the same as Option A but with extra delete-then-add LOC churn. Smoke runner sees the entries fluctuate during plan execution.

**Recommended path (planner approves at planning time):** Option A — in-place EDU upgrade with ROADMAP success criterion amendment. Communicate the catalog-count change to user via plan summary.

### Anti-Patterns to Avoid

- **Treat `potus`/`filodendro` as net-new ids:** Will FAIL the catalog count assertion (would yield 108 entries with duplicates). Resolve at planning time via Pattern 6.
- **Generic CAM rationale shared across all 10 succulents:** Phase 14-07 SUMMARY established sub-genus distinct rationales. Lithops gets its own; corona-espinas gets Euphorbia-specific; agave gets Asparagaceae-specific.
- **Author EN as literal Spanish translation:** Phase 14-04 SUMMARY lock — natural English ("Direct midday sun — it scorches the leaves"), not "Direct sun of midday".
- **Trim char-limit AFTER commit:** Phase 14-06 lock — draft at ≤250 chars from start.
- **Skip optional EDU fields:** Phase 14 reached 100% on all 5 fields × 64 entries; Phase 15 maintained at 87. Phase 16 must match.
- **Skip aliasing for taxonomically-drifting species:** `Curio rowleyanus` and `Echinopsis pachanoi` are POWO-correct but PlantNet/community heavily uses legacy `Senecio rowleyanus` and `Trichocereus pachanoi`. Add legacy aliases to COMMON_NAMES_ES.
- **Ship without exact-match-first refactor of `findPlantInDatabase`:** Three Dracaena entries collide; routing breaks silently. Smoke runner must catch it.
- **Author 19 separate per-entry plans:** Sub-batched (10 + ~7 + COMMON_NAMES_ES + image-doc) matches Phase 15's 5-plan rhythm.
- **Ship without voseo grep guard:** Run `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' es/plants.json` per content commit; baseline = 2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| i18n key validation | Custom JSON parser | `scripts/check-i18n-keys.mjs` (existing) | Phase 14-01 already covers EDU sub-fields conditionally |
| Image URL validation | Custom HEAD checker | `scripts/check-images.mjs` (existing) | Existing concurrency-8 runner; just register Phase 16 ids as accepted-known in CLAUDE.md |
| Catalog count assertion | Inline JS in CI | `scripts/phase16-smoke.cjs` with partial-landing-tolerant count gate | Phase 11/12/13/14/15 pattern. Mid-band SKIP: `idMatches > 87 && idMatches < 106 → undefined` |
| Voseo regression detection | Per-line review | `grep -cE '\b(riega\|saca\|pon\|ten\|haz\|quieres\|toca\|mueve\|puedes)\b' es/plants.json` | Per-commit guard; baseline = 2 |
| Char-limit enforcement | Editor word-count manually | Inline draft discipline + `awk '{print length, $0}' \| sort -n \| tail -5` spot-check | No automated tooling for char-limits; rely on draft discipline (Phase 14-06 lesson) |
| PlantNet → catalog matching | Custom scientific-name parser | Existing `findPlantInDatabase` **after exact-match-first refactor** (Pattern 4 mitigation) | Robust enough for current catalog; just ensure exact match takes precedence over genus prefix |
| Routing-correctness verification | File-content-only smoke | `ts.transpileModule` runtime test (Phase 11/12/14 pattern) | Phase 16 smoke runner needs to actually CALL `findPlantInDatabase` — not just regex-check that `id` and `scientificName` co-occur in source |

**Key insight:** Phase 16 has effectively zero new code surface beyond the smoke runner, content, and a 5-LOC `findPlantInDatabase` refactor. Every validator, every gate, every conversion path was built and battle-tested in Phases 8 → 14 → 15. Phase 16 is **content authoring on locked rails** with a one-time routing-engine refactor that benefits all future catalog phases.

## Common Pitfalls

### Pitfall 1: Voseo Regression (carried from Phase 14/15)
**What goes wrong:** Initial draft includes Castilian forms (riega, saca, pon, mueve, puedes) — increasing the regex grep count above baseline=2.
**Why it happens:** Author drafts in mental Spanish (often Castilian) and forgets the voseo conjugation discipline.
**How to avoid:**
- Draft in voseo from the start: regá, sacá, podá, movela, podés, querés, tocá, hacé.
- Per-commit grep check: count must remain at 2.
- False-positive watch: `mueve sus hojas` matches but is third-person descriptive — reword to "reorienta" / "orienta".
- False-positive watch: `se riega al pie` reflexive matches — reword to "el riego va al pie".
**Warning signs:** Grep count increases after a content commit.

### Pitfall 2: Char-Limit Drift on whyRationale (carried from Phase 14/15)
**What goes wrong:** Initial drafts run 252-312 chars; ship at >250 chars; later refactor to trim.
**Why it happens:** Authors include all the physiology + geography + behavior nuance and run long.
**How to avoid:**
- Draft at ≤250 chars from the start (Phase 14-06 lesson — Phase 14-07 final max=249).
- Use one citation (geography OR family OR mechanism), not all three.
- Inline char-count check before commit.
**Warning signs:** Specific entries' whyRationale exceed 250 chars.

### Pitfall 3: Generic whyRationale (carried from Phase 14/15)
**How to avoid:** Every whyRationale cites at least ONE of: (a) family-level taxonomy + ecology lexicon (Aizoáceas, Cactáceas, Crassuláceas, Asparagáceas, Mirtáceas); (b) specific physiology mechanism (CAM photosynthesis, mesemb leaf-replacement, citronellal defense, heteroblastic fenestration); (c) precise geographic origin tied to behavior. Prefer (b) over (a) over (c).
**Sub-typology citation cookbook in Pattern 2 above.**

### Pitfall 4: Catalog Default vs i18n Key Drift (carried from Phase 15)
Same as Phase 15. Author rhythm: catalog default → es/plants.json mirror → en/plants.json natural EN → run validator. All in one commit.

### Pitfall 5: PlantNet Synonym Drift / Outdated scientificName (PHASE 16 EXTENSIONS)
**Phase 16-specific verifications already done in §Standard Stack table:**
- `Curio rowleyanus` (POWO since 1999) vs `Senecio rowleyanus` (legacy). PlantNet returns either; alias both.
- `Echinopsis pachanoi` (POWO 2024) vs `Trichocereus pachanoi` (legacy). PlantNet returns either; alias both.
- `Dracaena angolensis` (POWO 2018) vs `Sansevieria cylindrica` (legacy). Heavy trade-name use of legacy; alias both.
- `Schlumbergera × buckleyi` (true Christmas) vs `Schlumbergera bridgesii` (invalid name) vs `Schlumbergera truncata` (Thanksgiving). Avoid bridgesii; pick × buckleyi for canonical "cactus-navidad".
- `Corymbia citriodora` (POWO since 2000s) vs `Eucalyptus citriodora` (legacy). PlantNet still returns Eucalyptus; use Eucalyptus canonical + Corymbia alias.

### Pitfall 6: COMMON_NAMES_ES Genus-Only vs Species-Qualified Conflict (UPGRADED FROM PHASE 15)
**Phase 16 actualizes the latent bug.** Three Dracaena species across PLANT_DATABASE:
- `sansevieria` (line 138) → `Dracaena trifasciata`
- `dracaena` (line 1004) → `Dracaena fragrans`
- `bambu-suerte` (Phase 16 add) → `Dracaena sanderiana`
- `sansevieria-cilindrica` (Phase 16 add) → `Dracaena angolensis`

`findPlantInDatabase('Dracaena fragrans')` returns `sansevieria` (first in array order). **This is a bug.**

**Mitigation:** Pattern 4 — exact-match-first refactor of `findPlantInDatabase` (5 LOC). Fixes existing bug (Dracaena fragrans → dracaena correctly post-fix); fixes Phase 16 bambu/sansevieria-cilindrica routing automatically. Smoke runner asserts each species-qualified scientificName routes to its own id post-refactor.

**Warning signs:** Phase 12 unknown-plants tracker shows "Dracaena fragrans" appearing post-Phase-16 deploy (impossible if refactor is in place).

### Pitfall 7: CAT-14 ID Collision (NEW)
**What goes wrong:** Treating `potus`/`filodendro` as 4 net-new ids when 2 already exist; net catalog count fails the `=== 106` assertion (would be 108 with duplicates, or 104 if upgraded in place).
**How to avoid:** Pattern 6 in this RESEARCH. Resolve at planning time. Recommend Option A (in-place upgrade + amend ROADMAP success criterion to `=== 104` OR `=== 87 + 17`).

### Pitfall 8: REQUIREMENTS.md "PLANT_TYPE_MAP" Misnomer (carried from Phase 15)
CAT-16 references "identification map entries" — interpret as `COMMON_NAMES_ES` ONLY in `src/utils/plantIdentification.ts`. The `PLANT_TYPE_MAP` in `OnboardingScreen.tsx:47` is unrelated to identification routing (maps catalog ids to onboarding type slugs).

### Pitfall 9: Sedum Duplicate (PHASE 15 LATENT BUG OBSERVABLE IN PHASE 16)
Existing `sedum` (line 1842) and `cola-burro` (line 2761) BOTH declare `scientificName: 'Sedum morganianum'`. This means `findPlantInDatabase('Sedum morganianum')` returns `sedum` (first in array order), NOT `cola-burro` — even though Phase 15 added `cola-burro` as the EDU-rich entry. Phase 16 doesn't add new Sedums, but Phase 14.x or 17 should reconcile this. **Document as Phase-15-era latent bug; do NOT fix in Phase 16 to keep scope tight.** Note in Wave 0 SUMMARY.

## Code Examples

### Example 1: Full PlantDBEntry shape (kalanchoe — represents CAT-13 sub-batch A)

```typescript
// Pattern: src/data/plantDatabase.ts:30-64 (potus, post-Phase 14 reference shape)
{
  id: "kalanchoe",
  name: "Kalanchoe",
  scientificName: "Kalanchoe blossfeldiana",
  icon: "🌸",
  imageUrl: `${CATALOG_BASE_URL}/kalanchoe.jpg`,
  category: "suculentas",
  waterDays: 10,
  sunHours: 5,
  tempMin: 10,
  tempMax: 30,
  humidity: "baja",
  outdoor: false,
  tip: "Florece con días cortos. Si querés flores, dale 14h de oscuridad por la noche.",
  description: "El Kalanchoe blossfeldiana es una suculenta crassulácea originaria de Madagascar...",
  problems: [
    { symptom: "No florece", cause: "Poca oscuridad", solution: "Cubrila 14h por noche durante 6 semanas para inducir flores." },
    { symptom: "Hojas blandas", cause: "Exceso de riego", solution: "Dejá secar el sustrato; tiene rizomas que pudren rápido." },
    { symptom: "Estiramiento entre hojas", cause: "Falta de luz", solution: "Acercala a una ventana con sol indirecto brillante." },
  ],
  nutrients: { type: "Bajo en nitrógeno; alto en fósforo (floración)", homemade: "Té de cáscara de banana cada 3 semanas en floración" },
  lightLevel: "bright_indirect",
  waterSchedule: { warm: 10, cold: 21 },
  waterMode: "fixed",
  careAction: {
    fixed: "Regá cada 10 días en cálido; cada 21 en frío. Dejá secar bien entre riegos.",
  },
  placementRecommended: "Ventana con sol filtrado o luz brillante indirecta.",
  placementAlternatives: [
    "Repisa cerca de ventana sur (HS) con cortina translúcida",
    "Balcón cubierto sin sol directo del mediodía",
    "Mesada de cocina con buena luz natural",
  ],
  placementAvoid: "Sustrato siempre húmedo y poca luz.",
  whyRationale: "Crassulácea malgache de fotosíntesis CAM: cierra estomas de día, fija CO2 nocturno. Florece con noches largas (>14h oscuridad) — su reloj fotoperiódico requiere ese contraste para emitir botones.",
}
```

### Example 2: COMMON_NAMES_ES extension (Phase 16 net-new + aliases)

```typescript
// Source: src/utils/plantIdentification.ts:47-144 (existing structure post-Phase 15)
const COMMON_NAMES_ES: Record<string, string> = {
  // ... existing entries (98 mappings post-Phase 15) ...

  // ─── v1.2 Phase 16 Wave B additions (~25 species + alias entries) ───
  // Already covered by genus mappings (verify):
  // 'Kalanchoe', 'Sempervivum', 'Lithops', 'Opuntia', 'Mammillaria',
  // 'Gasteria', 'Epipremnum aureum', 'Philodendron'

  // NEW canonical species mappings:
  'Kalanchoe blossfeldiana': 'Kalanchoe',
  'Sempervivum tectorum': 'Siempreviva',
  'Lithops lesliei': 'Piedras vivas',
  'Opuntia ficus-indica': 'Nopal',
  'Mammillaria elongata': 'Mammillaria',
  'Euphorbia milii': 'Corona de espinas',     // species-qualified to override genus 'Euforbia'
  'Gasteria bicolor': 'Gasteria',
  'Curio rowleyanus': 'Senecio colgante',     // POWO accepted (1999+)
  'Schlumbergera × buckleyi': 'Cactus de Navidad',
  'Schlumbergera': 'Cactus de Navidad',       // genus alias
  'Agave americana': 'Agave',
  'Agave': 'Agave',                           // genus alias
  'Hoya kerrii': 'Hoya corazón',
  'Hoya': 'Hoya',                             // genus fallback for other Hoya species
  'Rhaphidophora tetrasperma': 'Mini Monstera',
  'Strelitzia reginae': 'Strelitzia',
  'Strelitzia': 'Strelitzia',                 // genus alias
  'Eucalyptus citriodora': 'Eucalipto limón',
  'Eucalyptus': 'Eucalipto',                  // genus alias
  'Dracaena sanderiana': 'Bambú de la suerte',
  'Dracaena angolensis': 'Sansevieria cilíndrica',
  'Echinopsis pachanoi': 'Cactus San Pedro',
  'Echinopsis': 'Cactus San Pedro',           // genus alias (likely too aggressive — see warning below)

  // ─── PlantNet synonym aliases (taxonomic drift coverage; ≤2 per entry) ───
  'Senecio rowleyanus': 'Senecio colgante',   // legacy synonym (still heavy use in trade)
  'Trichocereus pachanoi': 'Cactus San Pedro',// legacy synonym (POWO reduced Trichocereus)
  'Sansevieria cylindrica': 'Sansevieria cilíndrica',  // legacy synonym (very common in trade)
  'Schlumbergera truncata': 'Cactus de Navidad',       // Thanksgiving cactus often mis-sold as Christmas
  'Pothos aureus': 'Potus',                   // legacy Epipremnum aureum synonym
  'Philodendron scandens': 'Filodendro',      // legacy Philodendron hederaceum synonym
  'Dracaena braunii': 'Bambú de la suerte',   // contested synonym for D. sanderiana
  'Corymbia citriodora': 'Eucalipto limón',   // POWO new genus (since 2000s); PlantNet still uses Eucalyptus
};
```

**Warning on `'Echinopsis': 'Cactus San Pedro'` genus alias:** Echinopsis is a large genus with many species (Echinopsis oxygona, Echinopsis multiplex, etc.). Adding genus-only mapping routes ALL Echinopsis species to "cactus San Pedro" — likely incorrect for non-pachanoi species. **Recommendation: skip the genus alias; use species-qualified `'Echinopsis pachanoi'` only.** Same caution applies to `'Trichocereus'` — DO NOT add genus alias.

### Example 3: phase16-smoke.cjs skeleton (file-content + ts-transpile hybrid)

```javascript
#!/usr/bin/env node
// scripts/phase16-smoke.cjs
// Phase 16 Catalog Wave B smoke runner. Mirrors phase15-smoke.cjs with two additions:
//   1. ts.transpileModule path for routing-correctness (findPlantInDatabase test)
//   2. exact-match-first refactor regression check on plantIdentification.ts

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

globalThis.__DEV__ = false;
const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.resolve(__dirname, '.tmp-phase16');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Stubs (auto-write if absent — gitignored; mirrors Phase 11/12/14/15)
// ... [identical to phase15-smoke.cjs stubs for async-storage and i18n] ...

let pass = 0, fail = 0, skip = 0;
const errors = [], skips = [];
function assert(cond, label) { if (cond) pass++; else { fail++; errors.push(`FAIL: ${label}`); } }
function assertSkippable(condFn, label) {
  try {
    const cond = condFn();
    if (cond === undefined) { skip++; skips.push(`SKIP: ${label}`); }
    else if (cond) pass++;
    else { fail++; errors.push(`FAIL: ${label}`); }
  } catch (e) { skip++; skips.push(`SKIP: ${label} (threw: ${e.message})`); }
}

const PHASE_16_IDS = [
  // CAT-13 (10): cactus + suculentas
  'kalanchoe', 'siempreviva', 'piedras-vivas', 'nopal', 'mammillaria',
  'corona-espinas', 'gasteria', 'senecio-rowleyanus', 'cactus-navidad', 'agave',
  // CAT-14 (4): trepadoras (potus + filodendro are upgrades — listed but counted differently)
  'potus', 'filodendro', 'hoya', 'mini-monstera',
  // CAT-15 (5): trending
  'strelitzia', 'eucalipto', 'bambu-suerte', 'sansevieria-cilindrica', 'cactus-san-pedro',
];

const PHASE_16_NEW_IDS = PHASE_16_IDS.filter(id => !['potus', 'filodendro'].includes(id));  // 17 net-new

const PHASE_16_SCIENTIFIC_NAMES = {
  'kalanchoe': 'Kalanchoe blossfeldiana',
  'siempreviva': 'Sempervivum tectorum',
  'piedras-vivas': 'Lithops lesliei',
  'nopal': 'Opuntia ficus-indica',
  'mammillaria': 'Mammillaria elongata',
  'corona-espinas': 'Euphorbia milii',
  'gasteria': 'Gasteria bicolor',
  'senecio-rowleyanus': 'Curio rowleyanus',
  'cactus-navidad': 'Schlumbergera × buckleyi',
  'agave': 'Agave americana',
  'potus': 'Epipremnum aureum',
  'filodendro': 'Philodendron hederaceum',
  'hoya': 'Hoya kerrii',
  'mini-monstera': 'Rhaphidophora tetrasperma',
  'strelitzia': 'Strelitzia reginae',
  'eucalipto': 'Eucalyptus citriodora',
  'bambu-suerte': 'Dracaena sanderiana',
  'sansevieria-cilindrica': 'Dracaena angolensis',
  'cactus-san-pedro': 'Echinopsis pachanoi',
};

// ─── File-content asserts (mirrors phase15-smoke.cjs pattern) ───
// CAT-13/14/15 per-id presence (partial-landing tolerant)
// CAT-16 count: idMatches > 87 && idMatches < 104 → SKIP
// (count threshold = 104 if Option A in-place upgrade; planner adjusts to 106 if Option B)

// ─── ts.transpileModule routing-correctness (Phase 16 NEW) ───
// Compile plantIdentification.ts via TypeScript, dynamic-import the result,
// call findPlantInDatabase('<species>') for each Phase 16 species, assert .id matches.
// SKIP gates on findPlantInDatabase exact-match-first refactor sentinel.
// ... [implementation mirrors smoke-phase14.mjs ts.transpileModule pattern] ...
```

### Example 4: `findPlantInDatabase` exact-match-first refactor (5 LOC change)

```typescript
// src/utils/plantIdentification.ts:153-163 — current implementation
export function findPlantInDatabase(scientificName: string): PlantDBEntry | undefined {
  const searchName = scientificName.toLowerCase();
  return PLANT_DATABASE.find(plant => {
    const dbName = plant.scientificName.toLowerCase();
    return dbName === searchName ||
           dbName.startsWith(searchName.split(' ')[0]) ||
           searchName.startsWith(dbName.split(' ')[0]);
  });
}

// Phase 16 recommended refactor — exact match takes precedence
export function findPlantInDatabase(scientificName: string): PlantDBEntry | undefined {
  const searchName = scientificName.toLowerCase();
  // First pass: exact match (case-insensitive) — fixes genus-prefix collision
  const exactMatch = PLANT_DATABASE.find(p => p.scientificName.toLowerCase() === searchName);
  if (exactMatch) return exactMatch;
  // Second pass: genus prefix (legacy fuzzy fallback)
  return PLANT_DATABASE.find(plant => {
    const dbName = plant.scientificName.toLowerCase();
    return dbName.startsWith(searchName.split(' ')[0]) ||
           searchName.startsWith(dbName.split(' ')[0]);
  });
}
```

This 5-LOC change fixes:
- `Dracaena fragrans` → routes to `dracaena` (currently routes to `sansevieria`)
- `Dracaena sanderiana` → routes to `bambu-suerte` (Phase 16)
- `Dracaena angolensis` → routes to `sansevieria-cilindrica` (Phase 16)
- `Sedum morganianum` → routes to first array-order match (`sedum` line 1842 — pre-existing duplicate, separate Phase 17 fix)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Senecio rowleyanus` | `Curio rowleyanus` | POWO 1999 (genus reclassification) | Trade still uses Senecio; alias both for routing |
| `Sansevieria cylindrica` | `Dracaena angolensis` | POWO 2018 (Sansevieria → Dracaena) | Trade still uses Sansevieria heavily; alias both |
| `Trichocereus pachanoi` | `Echinopsis pachanoi` | POWO 2024 (Trichocereus → Echinopsis synonym) | Recent reclassification; PlantNet returns either; alias both |
| `Eucalyptus citriodora` | `Corymbia citriodora` | POWO ~2000s (Eucalyptus citriodora-group → Corymbia) | Argentine market still uses Eucalyptus heavily; alias both |
| `Schefflera arboricola` | `Heptapleurum arboricola` | POWO 2024 | Already addressed in Phase 15 (cheflera entry) |
| `Schlumbergera bridgesii` | `Schlumbergera × buckleyi` | (always) — bridgesii is invalid published name | Many sources still use bridgesii; Wikipedia confirms invalid; avoid bridgesii |
| `findPlantInDatabase` array-order-first-match on genus prefix | Exact-match-first + genus-prefix fallback | Phase 16 (this phase) | Fixes existing latent bug; required for Dracaena disambiguation |

**Deprecated/outdated:**
- Use of `Schlumbergera bridgesii` — never validly published; use `Schlumbergera × buckleyi` for true Christmas cactus.
- Use of `Pachira glabra` for arbol-dinero (Phase 15 already locked Pachira aquatica + glabra alias).
- Use of `Sansevieria` for the trifasciata-group OR cylindrica-group as canonical — Dracaena since 2017/2018.

## Open Questions

1. **CAT-14 collision resolution: Option A (upgrade) vs Option B (new ids) vs Option C (replace)?**
   - What we know: `potus` (line 30) and `filodendro` (line 1038) already exist; CONTEXT.md treats them as 4 net-new; success criterion locks `length === 106`.
   - What's unclear: The user has NOT addressed this collision in CONTEXT.md (it's listed as a "trepadora staple" without flagging the existing entries).
   - **Recommendation:** Option A (in-place EDU upgrade); planner amends ROADMAP success criterion to `=== 104`. Surface the choice to the user in the plan summary.

2. **Final ROADMAP success criterion for `PLANT_DATABASE.length`?**
   - With Option A: `=== 104` (87 + 17 net-new).
   - With Option B: `=== 106` (87 + 19, but introduces 2 duplicate scientificNames).
   - With Option C: `=== 106` (87 + 19 - 2 deletes + 2 fresh adds).
   - **Recommendation:** Match Option A → 104.

3. **Is `findPlantInDatabase` exact-match-first refactor in Phase 16 scope, or punt to Phase 17/18?**
   - In scope: minimal LOC, fixes existing bug + Phase 16 routing — clean atomic change.
   - Out of scope: refactor adds non-content surface to a content-only phase; risks regression.
   - **Recommendation:** In Wave 0 plan as a small dedicated task with smoke-runner regression assertion. ALTERNATIVELY: ship without the refactor, document Phase 16 entries' scientificName routing as currently-broken-for-Dracaena, fix in dedicated Phase 16.x or 17 micro-phase. Planner picks based on risk appetite.

4. **`piedras-vivas` species: `Lithops lesliei` (specific) or `Lithops spp.` (genus-level)?**
   - Specific: PlantNet routes more reliably; matches RHS Garden Merit AGM species.
   - Genus: Real Lithops are often sold without species labels; user may have any species.
   - **Recommendation:** `Lithops lesliei` canonical with `Lithops` genus alias. Lithops genus mapping `'Lithops': 'Piedras vivas'` already exists at line 104 of plantIdentification.ts; covers all Lithops species.

5. **`gasteria` species: G. bicolor (most common) or G. carinata var. verrucosa (more iconic)?**
   - bicolor: Most-cultivated; "Lawyer's tongue".
   - carinata var. verrucosa: More photogenic; warty texture is the iconic Gasteria look.
   - **Recommendation:** Either works. Lean `Gasteria bicolor` for trade ubiquity. Leave to authoring discretion.

6. **`siempreviva` species: Sempervivum tectorum vs Echeveria spp.?**
   - Sempervivum tectorum: Frost-hardy European houseleek; existing mock returns this.
   - Echeveria: LATAM-native rosette succulent; existing `echeveria` entry covers Echeveria spp.
   - **Recommendation:** `Sempervivum tectorum` per existing mock + `'Sempervivum': 'Siempreviva'` already in COMMON_NAMES_ES. Use this canonical.

7. **`mini-monstera` aliases: should we add commercial mis-names to COMMON_NAMES_ES?**
   - Commercial names like "Monstera minima" / "Philodendron Ginny" are NOT valid Latin; PlantNet won't return them.
   - **Recommendation:** No PlantNet alias entries needed. Mention in `description` and `tip` copy that the plant is mis-sold under those commercial names so users recognize the entry from a nursery label.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (no test runner configured); pre-submit guard scripts (`check:i18n-keys`, `check:images`) + `tsc --noEmit` + `phase16-smoke.cjs` |
| Config file | `package.json` (script entries); `tsconfig.json` |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/phase16-smoke.cjs` |
| Estimated runtime | ~5–10 seconds (tsc) + ~2 seconds (i18n) + ~1 second (smoke) ≈ 13s |

`npm run check:images` is network-bound (~30–60s) and is **not** part of the per-task feedback loop. It is run only at end-of-phase as the gate for CAT-16 image plan, where the 19 new entries are expected to fail (registered as accepted-known in CLAUDE.md).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-13 | 10 cactus/suculentas appear in PLANT_DATABASE | smoke (file-content) | `node scripts/phase16-smoke.cjs` | ❌ (created Wave 0) |
| CAT-13 | 10 cactus/suculentas have full EN+ES keyset | static | `npm run check:i18n-keys` | ✅ |
| CAT-14 | `potus`/`filodendro` upgraded with 5 EDU fields; `hoya`/`mini-monstera` net-new | smoke (file-content + collision check) | `node scripts/phase16-smoke.cjs` | ❌ (Wave 0) |
| CAT-15 | 5 trending entries (incl. correct Dracaena disambiguation) | smoke (routing) | `node scripts/phase16-smoke.cjs --routing` | ❌ (Wave 0) |
| CAT-15 | `sansevieria-cilindrica` distinct from `sansevieria` (no i18n collision) | static | `npm run check:i18n-keys` (already key-shape-validates) | ✅ |
| CAT-16 | All 19 entries in COMMON_NAMES_ES | smoke (--identification) | `node scripts/phase16-smoke.cjs --identification` | ❌ (Wave 0) |
| CAT-16 | CLAUDE.md "Phase 16 Wave B" block lists ≥17 of 19 ids | smoke (doc + grep) | `node scripts/phase16-smoke.cjs && grep -q "Phase 16 Wave B" CLAUDE.md` | ❌ (Wave 0) |
| GLOBAL | Voseo regex baseline preserved at 2 | static | `grep -cE '\b(riega\|saca\|pon\|ten\|haz\|quieres\|toca\|mueve\|puedes)\b' src/i18n/locales/es/plants.json` | ✅ |
| GLOBAL | TypeScript strict | static | `npx tsc --noEmit` | ✅ |
| OPTIONAL | `findPlantInDatabase` exact-match-first refactor regression | smoke (ts-transpile + runtime call) | `node scripts/phase16-smoke.cjs --routing` | ❌ (Wave 0) |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit && node scripts/phase16-smoke.cjs`
- **Per wave merge:** `npx tsc --noEmit && npm run check:i18n-keys && node scripts/phase16-smoke.cjs`
- **Phase gate:** Full suite green before `/gsd:verify-work`. `npm run check:images` runs at end-of-phase; the 19 NEW failures expected and gated on CLAUDE.md "Phase 16 Wave B" block presence.

### Wave 0 Gaps
- [ ] `scripts/phase16-smoke.cjs` — covers CAT-13/14/15/16 with partial-landing-tolerant SKIP gates; ts-transpile path for routing-correctness assertion
- [ ] `scripts/.tmp-phase16/` — gitignore line + auto-written stubs (mirrors Phase 15)
- [ ] `package.json` — `smoke:phase16` script entry
- [ ] (Optional) Pre-write a 5-LOC `findPlantInDatabase` refactor placeholder if planner picks Pattern 4 mitigation in Phase 16 scope

## Sources

### Primary (HIGH confidence)
- [Plants of the World Online (POWO)](https://powo.science.kew.org/) — taxonomic authority for all Phase 16 species verifications
  - [Dracaena angolensis](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77182375-1)
  - [Echinopsis pachanoi](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:88444-2)
  - [Opuntia ficus-indica](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:1151735-2)
  - [Hoya kerrii](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:98512-1)
- [src/utils/plantIdentification.ts (lines 47-144, 153-163)](file:///Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantIdentification.ts) — verified `findPlantInDatabase` algorithm; identified genus-prefix collision
- [src/data/plantDatabase.ts](file:///Users/gaston/Documents/Personal/MiJardinApp/src/data/plantDatabase.ts) — verified existing `potus` (line 30), `filodendro` (line 1038), `sedum`/`cola-burro` duplicate (lines 1842, 2761)
- [scripts/phase15-smoke.cjs](file:///Users/gaston/Documents/Personal/MiJardinApp/scripts/phase15-smoke.cjs) — 217 LOC reference template for phase16-smoke.cjs

### Secondary (MEDIUM-HIGH confidence — verified across multiple authoritative extension/community sources)
- [Curio rowleyanus - Wikipedia](https://en.wikipedia.org/wiki/Curio_rowleyanus) — POWO genus reclassification 1999
- [Schlumbergera - Wikipedia](https://en.wikipedia.org/wiki/Schlumbergera) — confirms S. × buckleyi = Christmas, S. truncata = Thanksgiving, bridgesii invalid
- [Rhaphidophora tetrasperma - Wikipedia](https://en.wikipedia.org/wiki/Rhaphidophora_tetrasperma) — commercial names "Monstera minima"/"Philodendron Ginny" mis-attributions
- [Dracaena sanderiana - Wikipedia](https://en.wikipedia.org/wiki/Dracaena_sanderiana) — D. braunii synonym status (contested but widely accepted)
- [Crown of Thorns, Euphorbia milii — Wisconsin Horticulture Extension](https://hort.extension.wisc.edu/articles/crown-of-thorns-euphorbia-milii/) — Euphorbiaceae spurge convergent-evolution-with-cacti framing
- [Mammillaria elongata — World of Succulents](https://worldofsucculents.com/) — Ladyfinger Cactus most popular indoor Mammillaria
- [Lithops lesliei — World of Succulents](https://worldofsucculents.com/lithops-lesliei-leslies-living-stone/) — RHS AGM 2002, mesemb dormancy physiology
- [Strelitzia Nicolai vs Reginae — XXLPlant](https://xxlplant.com/en/blogs/kamerplanten-tips/strelitzia-nicolai-vs-strelitzia-reginae-verschil-uitgelegd) — compact (1-1.5m) vs giant (2-3m) framing
- [Eucalyptus citriodora — Infojardín](https://fichas.infojardin.com/arboles/eucalyptus-citriodora-eucalipto-aromatico-limon.htm) — citronellal aromatic profile
- [Hoya kerrii — POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:98512-1) — accepted name; var. obovata synonym
- [Sempervivum tectorum — Wikipedia](https://en.wikipedia.org/wiki/Sempervivum_tectorum) — common houseleek; mountains of southern Europe
- [Kalanchoe blossfeldiana — University of Missouri Extension](https://ipm.missouri.edu/meg/2017/1/kalanchoe/) — most widely-grown houseplant kalanchoe; photoperiodic flowering
- [Agave americana vs attenuata — DavesGarden + ElMueble](https://davesgarden.com/guides/articles/view/1315) — A. americana frost-hardier, better Argentine outdoor candidate

### Tertiary (LOW confidence — single-source; flagged for validation)
- [Sansevieria cylindrica or Dracaena Angolensis — Himadri Gardens](https://himadrigardens.com/product/sansevieria-cylindrica-or-dracaena-angolensis/) — trade-side confirmation Sansevieria still in commerce post-POWO
- [Gasteria bicolor — Dave's Garden](https://davesgarden.com/guides/articles/view/2915) — most common indoor Gasteria

## Metadata

**Confidence breakdown:**
- Standard stack (taxonomic names): HIGH — POWO + Wikipedia + Extension cross-verified for all 19 species
- Architecture (Pattern 1-5 unchanged from Phase 15; Pattern 6 + routing refactor NEW): HIGH for unchanged patterns, MEDIUM-HIGH for new patterns (refactor is mechanical and verified against current source)
- Pitfalls (1-9): HIGH for 1-5 (carried from Phase 14/15 SUMMARYs); HIGH for 6-9 (verified by direct source-code reading and Phase 15 latent-bug confirmation)
- Validation Architecture: HIGH — mirrors Phase 15 contract; gap list verified against current repo state

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days for stable taxonomy + content patterns; POWO updates infrequently)

---

*Phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending*
*Research date: 2026-05-07*
