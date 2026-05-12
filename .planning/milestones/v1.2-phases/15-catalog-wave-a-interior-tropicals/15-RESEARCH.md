# Phase 15: Catalog Wave A — Interior Tropicals - Research

**Researched:** 2026-05-07
**Domain:** Catalog data extension at scale (23 entries × 10 fields × 2 locales = 460 strings + 23 catalog defaults + identification routing + image plan documentation)
**Confidence:** HIGH (every technical surface is established by Phase 14; this phase is data-only authoring on locked schema)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plan structure (split across 2 sub-batches sequential)**

- **Wave 0:** smoke runner scaffold (`scripts/smoke-phase15.mjs`) with assertSkippable placeholders for CAT-09/10/11. Mirror Phase 11/12/13/14 pattern.
- **Wave 1:** schema/code prep (CAT-11) — extend `COMMON_NAMES_ES` map in `src/utils/plantIdentification.ts` with all 23 scientific names → catalog ids. This wave can land BEFORE catalog content because COMMON_NAMES_ES needs ids that catalog content will define. Resolution: Wave 1 can include placeholder/empty mappings for all 23 to lock the structure, OR Wave 1 happens AFTER Wave 2 — planner picks based on actual file-conflict analysis.
- **Wave 2 (sub-batch A):** 12 entries — aroceous + foliage especial group. Shared physiology citations make these batchable: anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia (all aroceous family — warmth + indirect bright + humidity); begonia-rex, croton, fitonia, ficus-lyrata, maranta (foliage especial — careful light placement, leaf-color expression).
- **Wave 3 (sub-batch B):** 11 entries — diverse rest. zamioculca + cola-burro (CAM-friendly succulent-tropicals); hiedra (trepadora); palmera-areca + palmera-kentia (palmeras); helecho-boston + helecho-nido (humidity-loving helechos); pilea + tradescantia + cheflera + arbol-dinero (all-rounder durables).
- **Wave 4 (optional):** image plan documentation — register the 23 entries' image status in CLAUDE.md (uploaded vs accepted-known). Lightweight; can fold into Wave 2/3 plans or be its own short plan. Planner picks.
- **Wave 5 (optional):** manual checkpoint? NOT needed for this phase — content is automated by smoke + check:i18n-keys. Phase 14's manual checkpoint covered the EDU rendering surface; Phase 15 is data-only.

Sub-batch grouping by sub-typology (vs alphabetical) lets the content authoring share whyRationale templates and placement guidance — same species family/habit get similar (but distinct) physiology citations.

**File-conflict reality:** Waves 2 and 3 BOTH touch `src/data/plantDatabase.ts` and `src/i18n/locales/{en,es}/plants.json`. They MUST run sequentially. Wave 1 (COMMON_NAMES_ES extension) can run in parallel with Wave 2 if it's a separate file (`src/utils/plantIdentification.ts`) — confirm in planning.

**Image upload strategy: defer all 23 to "accepted-known" pattern**
- All 23 entries' imageUrls point to the standard Supabase pattern (`plant-images/catalog/<id>.jpg`) but are NOT uploaded as part of Phase 15.
- Document the 23 as accepted-known failures in CLAUDE.md — mirror the v1.1 LATAM 15-entry precedent. Add to the existing "accepted-known failures" list with a "Phase 15 Wave A" annotation.
- Image upload becomes a pre-submit task (milestone-end batch upload) consistent with the v1.2 device-test backlog pattern.

**PlantNet identification routing scope (minimum + documented aliases)**
- Required: every entry's `scientificName` (canonical, as appears in `PlantDBEntry.scientificName`) maps to its catalog id in `COMMON_NAMES_ES`.
- Aliases: add a small set of well-known PlantNet variants per entry when documented in research. Cap: ≤2 aliases per entry to limit maintenance burden.
- Don't go exhaustive. Phase 12 unknown-plants tracker silently logs anything we miss; the v1.2 backlog can flag high-frequency missed mappings for future addition.
- Validator: Wave 0 smoke runner asserts the 23 scientific names are present in `COMMON_NAMES_ES`. Doesn't enforce alias coverage (those are best-effort).

**Sub-typology in placement copy (informal, used as guidance)**

These sub-types inform `placementRecommended` / `placementAlternatives` / `placementAvoid` / `whyRationale` for each entry but do NOT introduce a new `PlantCategory` enum value (existing 6 categories cover all 23):

| Sub-type | Entries | Placement guidance |
|---|---|---|
| Aroceous (Araceae) | anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia | Warm + bright indirect + high humidity; avoid drafts + cold + direct sun |
| Foliage especial | begonia-rex, croton, fitonia, ficus-lyrata, maranta | Light placement is critical — too low = green only / leaf color drops; too direct = burn |
| Succulent-tropical (CAM) | zamioculca, cola-burro | Tolerate forgetfulness, don't tolerate over-watering |
| Trepadora | hiedra | Vertical support OR cascade; bright indirect; tolerate moderate cold |
| Palmera | palmera-areca, palmera-kentia | Brighter than aroceous; sensitive to over-watering; slow growth |
| Helecho | helecho-boston, helecho-nido | High humidity + indirect light + consistent moisture |
| All-rounder | pilea, tradescantia, cheflera, arbol-dinero | Forgiving of light + watering variations |

**Content quality bar (carrying forward from Phase 14)**
- Voseo discipline (ES): regá / sacá / podés / querés / podá / movela / tocá / hacé. Voseo grep guard runs vs post-Phase-14 baseline (count = 2 from legacy pre-Phase-14 strings); Phase 15 must NOT increase this count.
- whyRationale ≤ 250 chars — drafted at this length from the start (Phase 14-06 established this).
- Mechanism citations: every whyRationale cites a specific physiological or geographic mechanism. NEVER generic.
- EN parallel: factual, friendly, no exclamation marks unless emphasizing.
- Field shape parity: every NEW entry has all 5 legacy fields (name/tip/description/problems[]/nutrients?) + all 5 EDU fields.

**Defaults for new entries (Claude's discretion within these guardrails)**
- waterMode: prefer 'soil_check' for tropicals (most are humidity/touch-dependent); 'fixed' for predictable types (palmeras, all-rounders).
- lightLevel: most interior tropicals → 'bright_indirect'. Exceptions: aglaonema → 'low'; croton/ficus-lyrata → 'bright_indirect' with note about avoiding direct.
- tempMin/tempMax: standard tropical range 15-30°C unless species-specific (alocasia tolerates lower minimums, caladium needs warmer).
- humidity: 'alta' for helechos/aroceous/begonia-rex/fitonia/croton/anthurium/maranta; 'media' for most others; 'baja' for zamioculca/cola-burro/cheflera.
- outdoor: all 23 → false (interior tropical phase).
- category: map to existing 6 PlantCategory values — all 23 are 'interior'.

### Claude's Discretion
- Wave 1 timing — can wire COMMON_NAMES_ES extension before, after, or interleaved with content waves based on file-conflict analysis. Single hard constraint: Wave 0 ships smoke runner first.
- Image plan documentation phrasing — single CLAUDE.md update entry rather than 23 individual lines. Group as "Phase 15 Wave A (23 entries — image upload pending)".
- PlantNet alias selection — researcher identifies must-add aliases per entry. If unsure, add 0-1 aliases (canonical scientificName always present); skip the rest.
- Field shape variations within sub-types — planner may use slightly different placement copy patterns within sub-types if a species has a unique requirement.
- Smoke runner shape — mirror Phase 14's smoke-phase14.mjs pattern.
- Char-limit ceiling enforcement — ≤250 char on whyRationale strings drafted at this length from the start.
- Per-task autonomous commits — mirror Phase 14 pattern.

### Deferred Ideas (OUT OF SCOPE)
- Catalog browser UI (separate phase 14.x or future v1.2 phase).
- Catalog Wave B (Phase 16) — 19 more entries (suculentas/cactus + trepadoras + trending).
- Catalog Wave C (Phase 17) — 14 more entries (exterior + aromáticas + frutales).
- Image upload tooling — automated CC0 image search + upload pipeline.
- Pet toxicity for new entries (Phase 19) — `petToxicity` field added in Phase 19 to all 120 entries.
- PlantNet exhaustive alias coverage — wait for Phase 12 unknown-plants tracker data.
- Image upload for the existing 15 v1.1 LATAM entries — pre-existing accepted-known failure backlog.
- Browse-add flow with databaseId pre-population — deferred.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-09 | 23 new interior/tropical entries added to `plantDatabase.ts` with full v1.1 + EDU schema | §Architecture Patterns — Pattern 1 (Append to PLANT_DATABASE), Pattern 2 (Sub-typology batching); §Code Examples — Catalog entry shape |
| CAT-10 | All 23 Wave A entries have full keyset in EN + ES; `npm run check:i18n-keys` passes | §Architecture Patterns — Pattern 3 (i18n key authoring workflow); §Common Pitfalls — Voseo regression, char-limit drift; §Don't Hand-Roll — i18n validator (already covers EDU fields) |
| CAT-11 | All 23 Wave A entries are added to identification routing in `plantIdentification.ts` so PlantNet identification routes to the curated entry | §Architecture Patterns — Pattern 4 (PlantNet routing primary path is `findPlantInDatabase`, COMMON_NAMES_ES is fallback display); §Code Examples — Scientific name mapping; §Common Pitfalls — REQUIREMENTS.md "PLANT_TYPE_MAP" reference is misleading (no such symbol in plantIdentification.ts) |
| CAT-12 | All 23 Wave A entries' images are uploaded OR documented as accepted-known failure in CLAUDE.md | §Architecture Patterns — Pattern 5 (Accepted-known image registry); §Code Examples — CLAUDE.md update format |
</phase_requirements>

## Summary

Phase 15 is a **catalog data extension + i18n authoring + identification routing + image documentation** phase. The technical surface is already established by Phase 14 — schema is locked (PlantDBEntry already has all 5 EDU optional fields), the validator already enforces 5 EDU conditional checks, and `getTranslatedPlant` already surfaces the 5 fields via i18n indirection. Phase 14's content authoring rhythm covered 64 entries in 4 waves; Phase 15 extends the same rhythm to 23 new entries.

**The dominant technical surface is content authoring**, NOT new code:
- 23 catalog entries × 10 fields each (5 legacy + 5 EDU) = 230 catalog field declarations
- 23 entries × 10 i18n keys × 2 locales = 460 strings
- 23 scientificName → catalog id mappings in `COMMON_NAMES_ES` (plus optional ≤2 aliases each)
- 1 CLAUDE.md "Accepted-known failures" registry update

The dominant **risks** are content-quality drift (voseo regression, char-limit overruns, generic whyRationale) and identification-routing accuracy (canonical scientific names — verified against current taxonomic authorities since several species have undergone recent reclassification: Sansevieria → Dracaena (2017), Schefflera → Heptapleurum (2024), Pachira aquatica vs Pachira glabra). Phase 14 established proven discipline patterns for both: voseo grep guard against baseline=2, char-limit-from-draft (≤250 chars), and physiology-mechanism citation per whyRationale.

**Primary recommendation:** Plan as 4 waves matching the locked CONTEXT structure — (W0) smoke runner scaffold with 18-20 placeholders, (W1) `COMMON_NAMES_ES` extension in `plantIdentification.ts` (separate file from content waves, parallelizable), (W2) sub-batch A: 12 entries (aroceous + foliage especial), (W3) sub-batch B: 11 entries (diverse rest). Image plan doc folded into W3's commit OR a tiny W4 plan. Char-limit-from-draft + voseo grep + locale parity checks per content commit. PlantNet routing uses `scientificName` field on `PLANT_DATABASE` entries (primary path) and `COMMON_NAMES_ES` (display fallback) — the requirement language about "PLANT_TYPE_MAP" is a misnomer and refers to `COMMON_NAMES_ES` alone.

## Standard Stack

### Core (already installed; nothing new)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-i18next` | `^16.5.4` | Per-key surface for catalog content (already covers Phase 14 EDU keys) | Project lock; `t()` discipline enforced everywhere |
| `typescript` | `~5.x` | Catalog-defaults inline content + PlantDBEntry typecheck | Project standard; `npx tsc --noEmit` pre-submit gate |
| `node:fs` (smoke runner) | builtin | File-content asserts for catalog count + i18n key presence | Phase 11/12/13/14 smoke-runner pattern |

### Supporting (existing utilities being extended)

| Module | Purpose | Phase 15 change |
|---|---|---|
| `src/data/plantDatabase.ts` | PLANT_DATABASE source of truth | +23 entries (~50 LOC each → ~1150 LOC, 2415 → ~3565) |
| `src/i18n/locales/en/plants.json` | EN keyset per entry | +23 entry blocks (each ~30 LOC) → ~700 LOC |
| `src/i18n/locales/es/plants.json` | ES voseo keyset per entry | +23 entry blocks → ~700 LOC |
| `src/utils/plantIdentification.ts` | `COMMON_NAMES_ES` map | +23-46 mapping entries (canonical + optional aliases) |
| `scripts/check-i18n-keys.mjs` | Validator | NO change — already covers EDU fields conditionally (Phase 14-01) |
| `scripts/check-images.mjs` | Image HEAD-check | NO source change — accepted-known list grows in CLAUDE.md only |
| `scripts/smoke-phase15.mjs` | NEW | Phase-specific smoke runner (mirror smoke-phase14.mjs) |
| `package.json` | npm scripts | +`smoke:phase15` line |
| `CLAUDE.md` | Accepted-known image registry | +1 entry block grouping the 23 Phase 15 ids |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Inline catalog defaults + i18n keys | Single source-of-truth (only i18n, no defaults) | Defaults ARE the runtime fallback if i18n key is somehow missing; Phase 14 explicitly mirrors both for consistency |
| Append entries grouped by sub-typology | Strict alphabetical by id | Sub-typology grouping helps content quality (shared physiology citations) and audit; alphabetical adds friction with no benefit |
| Per-entry separate plans (23 plans) | Sub-batched plans (2 plans of 12 + 11) | Per-entry would add ~25 plans; sub-batched matches Phase 14's wave rhythm and keeps autonomous commits cleaner |
| Author full PlantNet aliases per entry | Canonical scientificName + ≤2 aliases (best-effort) | Exhaustive coverage adds maintenance with diminishing returns; Phase 12 tracker logs the misses |

**Installation:** None. All dependencies already installed.

## Architecture Patterns

### Recommended File Structure (no new files except smoke runner)

```
src/data/plantDatabase.ts        # +23 PlantDBEntry objects (~1150 LOC) — append by sub-typology
src/i18n/locales/en/plants.json  # +23 entry blocks
src/i18n/locales/es/plants.json  # +23 entry blocks (voseo)
src/utils/plantIdentification.ts # +23-46 lines in COMMON_NAMES_ES
scripts/smoke-phase15.mjs        # NEW — mirrors smoke-phase14.mjs
package.json                     # +"smoke:phase15" script
CLAUDE.md                        # +"Phase 15 Wave A (23 entries)" group in accepted-known list
```

### Pattern 1: Append PlantDBEntry to PLANT_DATABASE

**What:** Each new entry is a TypeScript object literal added to the `PLANT_DATABASE` array. The shape is locked in `src/types/index.ts` (PlantDBEntry interface).

**When to use:** Every new catalog entry.

**Required fields per entry (after Phase 14 EDU schema):**
```typescript
{
  // ─── Required scalar identity ───
  id: string,                    // kebab-case slug (e.g., "zamioculca")
  name: string,                  // catalog default ES (overridden by i18n at runtime)
  scientificName: string,        // canonical PlantNet-resolvable Latin name
  icon: string,                  // emoji (single grapheme)
  imageUrl: string,              // ${CATALOG_BASE_URL}/<id>.jpg pattern
  category: PlantCategory,       // 'interior' | 'exterior' | 'aromaticas' | 'huerta' | 'frutales' | 'suculentas'

  // ─── Required climate/care fields ───
  tempMin: number,               // °C
  tempMax: number,               // °C
  humidity: HumidityLevel,       // 'baja' | 'media' | 'alta'
  outdoor: boolean,              // false for all Phase 15 entries

  // ─── Required content (catalog defaults; i18n keys override at runtime) ───
  tip: string,
  description: string,
  problems: PlantProblem[],      // length ≥ 1; each {symptom, cause, solution}
  nutrients?: { type, homemade },// optional; if declared, i18n keys required

  // ─── v1.1 Precision Care fields (REQUIRED for new entries) ───
  lightLevel: LightLevel,        // 'direct' | 'bright_indirect' | 'medium_indirect' | 'low'
  waterSchedule: { warm, cold }, // days
  waterMode: WaterMode,          // 'fixed' | 'soil_check'

  // ─── v1.1 deprecated (still in use; SHOULD provide for v1.0 callers) ───
  waterDays?: number,            // mirror waterSchedule.warm
  sunHours?: number,             // mirror lightLevel mapping

  // ─── v1.2 Phase 14 EDU fields (REQUIRED for full coverage; CONTEXT.md locks 5/5) ───
  careAction: { fixed?, soilCheck? },  // ≥1 sub-field per waterMode
  placementRecommended: string,        // ≤110 chars
  placementAlternatives: string[],     // 2-3 bullets, each ≤90 chars
  placementAvoid: string,              // ≤90 chars
  whyRationale: string,                // ≤250 chars; cites physiology mechanism
}
```

**Example: source `src/data/plantDatabase.ts:30-64` (potus entry, full Phase 14 shape)**

### Pattern 2: Sub-Typology Batching for Content Quality

**What:** Group new entries by horticultural sub-typology so shared physiology rationales can be templated within the group while preserving species-specific differentiation.

**When to use:** Multi-entry content authoring waves.

**Phase 15 sub-typology groups (CONTEXT.md locked):**

```
Sub-batch A (12 entries) — Wave 2:
  Aroceous (Araceae family):
    anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia
  Foliage especial:
    begonia-rex, croton, fitonia, ficus-lyrata, maranta

Sub-batch B (11 entries) — Wave 3:
  Succulent-tropical (CAM): zamioculca, cola-burro
  Trepadora: hiedra
  Palmera: palmera-areca, palmera-kentia
  Helecho: helecho-boston, helecho-nido
  All-rounder: pilea, tradescantia, cheflera, arbol-dinero
```

**Per-sub-type physiology citation template (Phase 14 14-06/07 lesson):**
- Aroceous: "perteneciente a las aráceas, evolucionada en sotobosque tropical — luz tamizada le permite expresar fenestraciones y mantener clorofila"
- Foliage especial: "antocianinas requieren luz brillante para sintetizarse — sin ella las hojas pierden color"
- CAM succulent: "metabolismo CAM cierra estomas de día — pierde menos agua, tolera olvidos de riego"
- Helecho: "esporofito requiere humedad ambiental >60% — sin ella las frondas se secan irreversiblemente"
- Palmera: "Arecaceae adaptadas a sotobosque tropical — toleran luz dispersa pero requieren drenaje rápido"
- Trepadora: "raíces aéreas o estolones para trepar — adaptación a competir por luz en bosque"

### Pattern 3: i18n Authoring Workflow (per-entry mirror)

**What:** For each new entry: catalog default in `plantDatabase.ts` (ES voseo) is mirrored to `es/plants.json` (ES voseo, identical) AND to `en/plants.json` (natural English equivalent — NOT literal translation).

**When to use:** Every catalog content authoring task.

**Workflow (from Phase 14-04..07 SUMMARYs):**

```
For each entry:
1. Author catalog default in plantDatabase.ts (ES voseo, ≤char limits from draft)
2. Mirror to es/plants.json (identical voseo strings) under entry.id key
3. Author EN parallel in en/plants.json (natural English; NOT literal translation)
4. Run: grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' es/plants.json → count must equal baseline (currently 2)
5. Run: npm run check:i18n-keys → must PASS
6. Run: npx tsc --noEmit → must PASS
7. Run: node scripts/smoke-phase15.mjs → must PASS (and SKIPs flip per assertion)
```

**Per-entry i18n key shape:**
```json
{
  "<entry-id>": {
    "name": "...",
    "tip": "...",
    "description": "...",
    "problems": [
      { "symptom": "...", "cause": "...", "solution": "..." }
    ],
    "nutrients": { "type": "...", "homemade": "..." },  // if entry declares nutrients
    "careAction": { "fixed": "...", "soilCheck": "..." },  // ≥1 sub-field
    "placementRecommended": "...",
    "placementAlternatives": ["...", "...", "..."],
    "placementAvoid": "...",
    "whyRationale": "..."
  }
}
```

### Pattern 4: PlantNet Routing — Primary path is `findPlantInDatabase`

**What:** The actual identification → catalog routing happens in `convertPlantNetResult()` (`src/utils/plantIdentification.ts:185-217`) which calls `findPlantInDatabase(scientificName)`. The function does case-insensitive scientificName + genus prefix matching against `PLANT_DATABASE`. `COMMON_NAMES_ES` is ONLY used in the no-match fallback to produce a user-facing display name (line 221).

**When to use:** Every PlantNet-identified species.

**Critical insight (clarifies REQUIREMENTS.md CAT-11 wording):**
- The literal text "added to PLANT_TYPE_MAP and COMMON_NAMES_ES" in CAT-11 is a misnomer:
  - There is NO `PLANT_TYPE_MAP` in `plantIdentification.ts` (the only `PLANT_TYPE_MAP` lives in `OnboardingScreen.tsx:47` and is unrelated to identification routing — it maps catalog ids to onboarding type slugs).
  - The actual routing is driven by `findPlantInDatabase` matching `scientificName`. So the routing succeeds AS SOON AS each new entry's `scientificName` field is correct.
  - Adding to `COMMON_NAMES_ES` is needed for the FALLBACK display name when PlantNet returns a species NOT in PLANT_DATABASE.

**Operational implication for Phase 15:**
- Required: each of 23 entries must declare a correct, current canonical `scientificName` in `PlantDBEntry` (this alone makes routing work).
- Required for completeness (CONTEXT.md lock): add 23 mappings to `COMMON_NAMES_ES` so genus-only PlantNet results (without species qualifier) and the fallback chain still produce the right display name. Mappings can use either the genus-only key (e.g., `'Anthurium'`) or species-qualified (`'Anthurium andraeanum'`).
- Best-effort: add ≤2 well-known synonyms per entry where taxonomic reclassification has occurred.

**Existing genus-level entries already in COMMON_NAMES_ES** (CONTEXT.md noted; these now need to map to actual catalog ids the entries will use):
- `'Zamioculcas zamiifolia': 'Zamioculca'` — exists; entry id will be `zamioculca`
- `'Pilea peperomioides': 'Pilea'` — exists
- `'Tradescantia': 'Tradescantia'` — exists
- `'Hedera helix': 'Hiedra'` — exists
- `'Croton': 'Croton'` and `'Codiaeum': 'Croton'` — exist (genus alias)
- `'Dieffenbachia': 'Difenbaquia'` — exists
- `'Pachira aquatica': 'Árbol del dinero'` — exists
- `'Schefflera': 'Cheflera'` — exists
- `'Fittonia': 'Fitonia'` — exists
- `'Anthurium': 'Anturio'` — exists (entry id will be `anthurium` — ID/display name mismatch is fine)
- `'Begonia': 'Begonia'` — exists (entry id `begonia-rex`)
- `'Ficus lyrata': 'Ficus lyrata'` — exists

**Required NEW additions to COMMON_NAMES_ES (~11 minimum, plus aliases):**
- `'Maranta'` and/or `'Maranta leuconeura'` → 'Maranta'
- `'Nephrolepis'` and/or `'Nephrolepis exaltata'` → 'Helecho de Boston'
- `'Asplenium nidus'` → 'Helecho nido de ave'
- `'Alocasia'` and/or `'Alocasia × amazonica'` → 'Alocasia'
- `'Caladium'` and/or `'Caladium bicolor'` → 'Caladium'
- `'Dypsis lutescens'` → 'Palmera areca'
- `'Howea forsteriana'` → 'Palmera kentia'
- `'Syngonium'` and/or `'Syngonium podophyllum'` → 'Singonio'
- `'Aglaonema'` and/or `'Aglaonema commutatum'` → 'Aglaonema'
- `'Sedum morganianum'` → 'Cola de burro'
- `'Heptapleurum arboricola'` → 'Cheflera' (modern accepted name; Schefflera is now a synonym)

**Critical taxonomic notes (for `scientificName` field accuracy):**
- **costilla-adan**: scientificName SHOULD be `'Monstera deliciosa'` — but `'Monstera deliciosa'` is ALREADY mapped in `COMMON_NAMES_ES` to 'Monstera' AND a `monstera` catalog entry exists. **Naming conflict alert**: `costilla-adan` is the LATAM common name for `Monstera deliciosa` — same species. Planner must decide: (a) merge costilla-adan into existing `monstera` entry as alias (use `_aliases: ['costilla-adan']`); OR (b) costilla-adan refers to `Monstera adansonii` (a related species — "Swiss cheese plant" / "Adam's rib"), which is taxonomically distinct. Recommend option (b) — `costilla-adan` should map to `Monstera adansonii` and the entry remains distinct from the existing `monstera` (Monstera deliciosa) entry.
- **sansevieria** vs Phase 15: existing catalog entry `sansevieria` already uses `'Dracaena trifasciata'` (the post-2017 reclassified name) with both `'Dracaena trifasciata'` and `'Sansevieria trifasciata'` mapped in COMMON_NAMES_ES. No Phase 15 change required.
- **cheflera**: scientificName should be `'Heptapleurum arboricola'` (current accepted, 2024) with `Schefflera arboricola` as documented alias. If choosing `'Schefflera arboricola'` (the legacy name), PlantNet may still return either; both should be in COMMON_NAMES_ES.
- **arbol-dinero**: scientificName options are `'Pachira aquatica'` (legacy/most-cited) or `'Pachira glabra'` (taxonomically more accurate for the houseplant). PlantNet most often returns `Pachira aquatica`. Recommend `scientificName: 'Pachira aquatica'` for routing reliability; add `'Pachira glabra'` as alias.
- **ficus-lyrata**: scientificName `'Ficus lyrata'` — known PlantNet-returned synonym `Ficus pandurata`. Add as alias.
- **zamioculca**: scientificName `'Zamioculcas zamiifolia'`. PlantNet rarely returns synonyms; add no aliases.

### Pattern 5: Accepted-Known Image Registry (CLAUDE.md)

**What:** When new catalog entries reference imageUrls under the standard pattern but images are NOT yet uploaded to Supabase Storage, the entry IDs are listed under "Accepted-known failures" in CLAUDE.md. The `npm run check:images` test still fails for these — but the failure is documented and accepted (manual ops batched at milestone end).

**When to use:** Every catalog content phase that adds entries faster than image sourcing/upload can keep up.

**Existing CLAUDE.md format (`CLAUDE.md:179-187`):**
```
**Accepted-known failures (Phase 8, v1.1):** the following 15 entries point at imageUrls that 404 until manual image upload to Supabase Storage:
- jacaranda, ceibo, glicina, gardenia, camelia, dalia
- salvia-ornamental, cala, copete, verbena
- lavanda-stoechas, lavanda-dentada
- romero-rastrero, tomate-cherry
- lavanda-angustifolia (renamed from lavanda; old lavanda.jpg needs re-upload as lavanda-angustifolia.jpg)
```

**Phase 15 Wave A addition (recommended single-block format):**
```
**Phase 15 Wave A (v1.2, 23 entries — image upload pending):** the following 23 interior tropical entries are accepted-known failures until manual image upload to Supabase Storage:
- zamioculca, pilea, tradescantia, hiedra, croton, difenbaquia, fitonia, cheflera
- anthurium, begonia-rex, arbol-dinero, maranta, helecho-boston, helecho-nido
- alocasia, caladium, palmera-areca, palmera-kentia, costilla-adan, singonio
- aglaonema, ficus-lyrata, cola-burro
```

### Anti-Patterns to Avoid

- **Author EN as literal Spanish translation:** "Sol directo del mediodía — quema las hojas" → "Direct sun of midday" (BAD). Phase 14-04 SUMMARY: use natural English ("Direct midday sun — it scorches the leaves"). Match existing tone.
- **Generic whyRationale:** "porque crece bien con luz" / "para que esté sana" — Phase 14 explicitly rejects. Always cite specific physiological/geographical mechanism.
- **Trim char-limit AFTER commit:** Phase 14-05 had to refactor whyRationale strings post-hoc; Phase 14-06+ established "draft at ≤250 chars from the start." Apply this discipline.
- **Skip optional EDU fields:** Phase 14 reached 100% coverage on all 5 fields × 64 entries. Phase 15 should match (every entry declares all 5 EDU fields, not just careAction + 1 placement field).
- **Author 23 separate per-entry plans:** Each adds ~25-50 LOC; sub-batched plans (12 + 11) match Phase 14 wave rhythm. Single per-entry plans are over-fragmentation.
- **Pollute existing catalog ids:** `costilla-adan` ≠ `monstera`. Use distinct id with distinct scientificName (`Monstera adansonii` vs `Monstera deliciosa`).
- **Ship without voseo grep guard:** Run `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' es/plants.json` per content commit; count must equal baseline (2) — never increase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| i18n key validation | Custom JSON parser | `scripts/check-i18n-keys.mjs` (existing) | Phase 14-01 already extended this with EDU sub-field-level conditional checks — Phase 15 entries are validated automatically when they declare the fields |
| Image URL validation | Custom HEAD checker | `scripts/check-images.mjs` (existing) | Existing concurrency-8 runner with 10s timeout; just register Phase 15 ids as accepted-known in CLAUDE.md |
| Catalog count assertion | Inline JS in CI | `scripts/smoke-phase15.mjs` with `PLANT_DATABASE.length === 87` assertion | Phase 11/12/13/14 pattern; `ts.transpileModule` compile path locked |
| Voseo regression detection | Per-line review | `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' es/plants.json` | Per-commit guard; baseline = 2 (lines 801 + 923 in current es/plants.json) |
| Char-limit enforcement | Editor word-count manually | Inline draft discipline + post-authoring `awk '{print length, $0}' \| sort -n \| tail -5` spot-check | No automated tooling for char-limits; rely on draft discipline (Phase 14-06 lesson) |
| PlantNet → catalog matching | Custom scientific-name parser | Existing `findPlantInDatabase` (case-insensitive + genus prefix matching) | Robust enough for current catalog; just ensure new entries' scientificName values are canonical and current |

**Key insight:** Phase 15 has effectively zero new code surface beyond the smoke runner and content. Every validator, every gate, every conversion path was built and battle-tested in Phases 8 (i18n key check, image check), 11/12/13/14 (smoke runner pattern), and 14 (EDU sub-field conditional validation). Phase 15 is **content authoring on locked rails**.

## Common Pitfalls

### Pitfall 1: Voseo Regression
**What goes wrong:** Initial draft includes Castilian forms (riega, saca, pon, mueve, puedes) — increasing the regex grep count above baseline=2.
**Why it happens:** Author drafts in mental Spanish (often Castilian) and forgets the voseo conjugation discipline.
**How to avoid:**
- Draft in voseo from the start: regá, sacá, podá, movela, podés, querés, tocá, hacé.
- Per-commit grep check: `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' es/plants.json` — count must remain at 2.
- False-positive watch (Phase 14-04 lesson): `mueve sus hojas` in third-person descriptive form matches the regex but is not a voseo violation. Reword to avoid the regex match: "reorienta sus hojas" / "orienta sus hojas".
- False-positive watch (Phase 14-06 lesson): `se riega al pie` in reflexive third-person matches the regex. Reword to noun phrase: "el riego va al pie".
**Warning signs:** Grep count increases by exactly the number of new strings added without other reword pass.

### Pitfall 2: Char-Limit Drift on whyRationale
**What goes wrong:** Initial drafts run 252-312 chars; ship at >250 chars; later refactor to trim.
**Why it happens:** Authors include all the physiology + geography + behavior nuance ("originaria de X, donde Y, lo que le permite Z, por eso Q") and run long.
**How to avoid:**
- Draft at ≤250 chars from the start (Phase 14-06 lesson — established Phase 14-07 max=249 chars).
- Use one citation (geography OR family OR mechanism), not all three. Pick the most distinctive.
- Check char-count inline before committing: `awk -F: '/whyRationale/ {print length, $0}' es/plants.json | sort -n | tail -5`.
**Warning signs:** Specific entries' whyRationale exceed 250 chars; need post-hoc trim pass (Phase 14-05 anti-pattern).

### Pitfall 3: Generic whyRationale
**What goes wrong:** Author writes "Es resistente porque tolera la sombra" or "Florece bien con cuidados regulares" — no mechanism citation.
**Why it happens:** Easy to write filler when species' physiology isn't deeply understood; safer than risking a horticultural inaccuracy.
**How to avoid:**
- Required: every whyRationale cites at least ONE of: (a) family-level taxonomy + ecology lexicon (Aráceas, Lauráceas, Marantáceas, etc.); (b) specific physiology mechanism (CAM photosynthesis, anthocyanin synthesis, leaf-fold rhythm, hemiepiphytic root system, fenestrations); (c) precise geographic origin tied to behavior ("sotobosque amazónico", "semi-árida México", "Sudáfrica grasslands").
- Prefer (b) physiology over (a) family or (c) geography when possible — it's more actionable.
- See sub-typology table in CONTEXT for per-sub-type templates.
**Warning signs:** whyRationale doesn't include any of: family-name (-áceas/-aceae), Latin-name word, region/biome name, mechanism noun.

### Pitfall 4: Catalog Default vs i18n Key Drift
**What goes wrong:** plantDatabase.ts catalog default is one string; en/plants.json or es/plants.json has a different (longer/shorter/altered) string. The defaultValue fallback runs only if i18n key is missing — so the drift is latent until a key fails.
**Why it happens:** Author updates one location and forgets the other; or updates plantDatabase.ts during quick iteration and forgets to mirror to i18n.
**How to avoid:**
- Authoring rhythm (Phase 14-04..07): write catalog default → mirror to es/plants.json → mirror to en/plants.json → run validator. All in one commit.
- Catalog defaults should mirror trimmed (≤char-limit) ES voseo strings exactly. Phase 14 explicitly mirrors both for source-of-truth consistency.
**Warning signs:** Differences in length or content between catalog default ES and es/plants.json string for the same entry.

### Pitfall 5: PlantNet Synonym Drift / Outdated scientificName
**What goes wrong:** New catalog entry uses a deprecated scientific name (e.g., `Schefflera arboricola` instead of current `Heptapleurum arboricola`); PlantNet returns the current name and `findPlantInDatabase` doesn't match.
**Why it happens:** Common-name → scientific-name lookups in non-authoritative sources often return legacy taxonomy. PlantNet uses POWO/GBIF current names.
**How to avoid:**
- Verify each scientificName against current authoritative sources before commit:
  - **Schefflera arboricola → Heptapleurum arboricola** (since 2024 POWO accepted)
  - **Sansevieria trifasciata → Dracaena trifasciata** (since 2017 — already done in catalog)
  - **Pachira aquatica vs Pachira glabra** — most houseplants are P. glabra, but PlantNet usually returns P. aquatica; use P. aquatica as primary
  - **Ficus lyrata** — synonym Ficus pandurata occasionally returned by PlantNet
- Add ≤2 known-synonym aliases per entry to COMMON_NAMES_ES for routing fallback.
- For ambiguous LATAM common names (`costilla-adan`), pick the species that matches the LATAM use; document the disambiguation in a code comment.
**Warning signs:** Phase 12 unknown-plants tracker shows the entry's scientificName (or its synonym) appearing post-Phase-15 deploy.

### Pitfall 6: COMMON_NAMES_ES Genus-Only vs Species-Qualified Conflict
**What goes wrong:** Adding `'Anthurium'` (genus only) when the catalog entry's scientificName is `'Anthurium andraeanum'` (species qualified) — the genus entry takes precedence in the fallback path, which is correct, but if multiple species share a genus and only ONE is in catalog, identifying a different Anthurium species would route to the wrong entry via `findPlantInDatabase`'s genus-prefix matching.
**Why it happens:** `findPlantInDatabase:120-126` matches case-insensitively on (a) exact, (b) DB scientificName starts with searchName's genus, OR (c) searchName starts with DB scientificName's genus. So a single `Anthurium andraeanum` catalog entry will catch any `Anthurium <species>` PlantNet result.
**How to avoid (intentional behavior):** This is actually a feature, not a bug — the fuzzy genus-prefix match is desirable so users don't see "unknown plant" for closely-related species. But know that ONE catalog entry per genus IS the design.
**Warning signs:** A future Phase 16/17 entry shares a genus with a Phase 15 entry — they'll collide on the genus prefix match. Phase 15's species choices should pick the most common/canonical species per genus to absorb genus-level matches gracefully.

### Pitfall 7: REQUIREMENTS.md "PLANT_TYPE_MAP" Misnomer
**What goes wrong:** Reading CAT-11 literally ("entries added to PLANT_TYPE_MAP and COMMON_NAMES_ES in plantIdentification.ts") and looking for `PLANT_TYPE_MAP` in `plantIdentification.ts` — but it doesn't exist there.
**Why it happens:** REQUIREMENTS.md was authored before the codebase was fully audited. The only `PLANT_TYPE_MAP` is in `OnboardingScreen.tsx:47` and maps catalog ids to onboarding type slugs (suculenta/floral/trepa/etc.) — unrelated to PlantNet identification routing.
**How to avoid:**
- Treat CAT-11 as: extend `COMMON_NAMES_ES` ONLY (in `src/utils/plantIdentification.ts`).
- DO NOT extend `PLANT_TYPE_MAP` in `OnboardingScreen.tsx` as part of CAT-11 — that's a separate concern (onboarding plant type assignment) not in Phase 15 scope.
- HOWEVER: if any of the 23 Phase 15 entries are exposed in onboarding's plant suggestions UI (Phase 15 shouldn't add to that surface, but if Phase 16+ does), the OnboardingScreen `PLANT_TYPE_MAP` should grow then. Phase 15 itself: skip.

## Code Examples

### Example 1: Full PlantDBEntry shape (zamioculca)

```typescript
// Source: pattern from src/data/plantDatabase.ts:30-64 (potus, post-Phase 14)
{
  id: "zamioculca",
  name: "Zamioculca",
  scientificName: "Zamioculcas zamiifolia",
  icon: "🌿",
  imageUrl: `${CATALOG_BASE_URL}/zamioculca.jpg`,
  category: "interior",
  waterDays: 14,        // legacy mirror of waterSchedule.warm
  sunHours: 2,          // legacy mirror of lightLevel
  tempMin: 15,
  tempMax: 30,
  humidity: "baja",
  outdoor: false,
  tip: "Casi indestructible. El error más común es regarla demasiado.",
  description: "La Zamioculca es una planta resistente con tallos suculentos y rizomas almacenadores de agua...",
  problems: [
    { symptom: "Hojas amarillas", cause: "Exceso de riego", solution: "Dejá secar bien la tierra entre riegos." },
    { symptom: "Tallos blandos", cause: "Pudrición de rizomas", solution: "Sacala de la maceta, cortá zonas blandas y replantá en sustrato seco." },
    { symptom: "Crecimiento lento en invierno", cause: "Normal — entra en reposo", solution: "Reducí el riego; volverá a brotar en primavera." },
  ],
  nutrients: { type: "Bajo en nitrógeno", homemade: "Té de cáscara de banana cada 2 meses" },
  lightLevel: "low",
  waterSchedule: { warm: 14, cold: 28 },
  waterMode: "soil_check",
  careAction: {
    fixed: "Regá cada 14 días en cálido; cada 28 en frío. Mejor de menos que de más.",
    soilCheck: "Tocá los primeros 3 cm de tierra: solo regá si están completamente secos.",
  },
  placementRecommended: "Cualquier rincón con luz indirecta, incluso poca luz.",
  placementAlternatives: [
    "Pasillo o rincón sin ventana cercana",
    "Oficina con luz fluorescente",
    "Dormitorio de poca luz natural",
  ],
  placementAvoid: "Sustrato siempre húmedo y maceta sin drenaje.",
  whyRationale: "Originaria del este de África semi-árida, sus rizomas almacenan agua y nutrientes. Su metabolismo CAM le permite tolerar baja luz y olvidos de riego — pero la pudrición por exceso de agua es irreversible.",
}
```

### Example 2: Mirror in es/plants.json

```json
// Source: pattern from src/i18n/locales/es/plants.json:2-38 (potus block)
{
  "zamioculca": {
    "name": "Zamioculca",
    "tip": "Casi indestructible. El error más común es regarla demasiado.",
    "description": "Planta resistente con tallos suculentos y rizomas almacenadores de agua. Tolera olvidos y poca luz.",
    "problems": [
      { "symptom": "Hojas amarillas", "cause": "Exceso de riego", "solution": "Dejá secar bien la tierra entre riegos." },
      { "symptom": "Tallos blandos", "cause": "Pudrición de rizomas", "solution": "Sacala de la maceta, cortá zonas blandas y replantá en sustrato seco." },
      { "symptom": "Crecimiento lento en invierno", "cause": "Normal — entra en reposo", "solution": "Reducí el riego; volverá a brotar en primavera." }
    ],
    "nutrients": { "type": "Bajo en nitrógeno", "homemade": "Té de cáscara de banana cada 2 meses" },
    "careAction": {
      "fixed": "Regá cada 14 días en cálido; cada 28 en frío. Mejor de menos que de más.",
      "soilCheck": "Tocá los primeros 3 cm de tierra: solo regá si están completamente secos."
    },
    "placementRecommended": "Cualquier rincón con luz indirecta, incluso poca luz.",
    "placementAlternatives": [
      "Pasillo o rincón sin ventana cercana",
      "Oficina con luz fluorescente",
      "Dormitorio de poca luz natural"
    ],
    "placementAvoid": "Sustrato siempre húmedo y maceta sin drenaje.",
    "whyRationale": "Originaria del este de África semi-árida, sus rizomas almacenan agua y nutrientes. Su metabolismo CAM le permite tolerar baja luz y olvidos de riego — pero la pudrición por exceso de agua es irreversible."
  }
}
```

### Example 3: Mirror in en/plants.json (natural English, NOT literal translation)

```json
// Pattern: natural English equivalent. Do NOT word-for-word translate ES voseo.
{
  "zamioculca": {
    "name": "ZZ Plant",
    "tip": "Nearly indestructible. The most common mistake is overwatering.",
    "description": "Resilient plant with succulent stems and water-storing rhizomes. Tolerates neglect and low light.",
    "problems": [
      { "symptom": "Yellow leaves", "cause": "Overwatering", "solution": "Let the soil dry out fully between waterings." },
      { "symptom": "Soft stems", "cause": "Rhizome rot", "solution": "Unpot, cut away soft tissue, and replant in dry substrate." },
      { "symptom": "Slow winter growth", "cause": "Normal — entering dormancy", "solution": "Reduce watering; new growth resumes in spring." }
    ],
    "nutrients": { "type": "Low nitrogen", "homemade": "Banana-peel tea every 2 months" },
    "careAction": {
      "fixed": "Water every 14 days in warm season; every 28 in cold. Less is more.",
      "soilCheck": "Touch the top 3cm of soil: only water if completely dry."
    },
    "placementRecommended": "Any corner with indirect light, even low-light spots.",
    "placementAlternatives": [
      "Hallway or corner without a nearby window",
      "Office with fluorescent lighting",
      "Bedroom with low natural light"
    ],
    "placementAvoid": "Constantly damp soil and pots without drainage.",
    "whyRationale": "Native to semi-arid East Africa, its rhizomes store water and nutrients. Its CAM metabolism enables low-light and drought tolerance — but rot from overwatering is irreversible."
  }
}
```

### Example 4: COMMON_NAMES_ES extension

```typescript
// Source: src/utils/plantIdentification.ts:47-108 (existing structure)
const COMMON_NAMES_ES: Record<string, string> = {
  // ... existing entries ...

  // ─── v1.2 Phase 15 Wave A additions (23 species + select aliases) ───
  // Already mapped (verify they point to display names, not catalog ids — display name is fine):
  // 'Zamioculcas zamiifolia': 'Zamioculca',
  // 'Pilea peperomioides': 'Pilea',
  // 'Tradescantia': 'Tradescantia',
  // 'Hedera helix': 'Hiedra',
  // 'Croton': 'Croton', 'Codiaeum': 'Croton',
  // 'Dieffenbachia': 'Difenbaquia',
  // 'Pachira aquatica': 'Árbol del dinero',
  // 'Schefflera': 'Cheflera',
  // 'Fittonia': 'Fitonia',
  // 'Anthurium': 'Anturio',
  // 'Begonia': 'Begonia',
  // 'Ficus lyrata': 'Ficus lyrata',

  // NEW additions (~11 species + ~6 aliases):
  'Maranta leuconeura': 'Maranta',
  'Maranta': 'Maranta',                       // genus alias
  'Nephrolepis exaltata': 'Helecho de Boston',
  'Nephrolepis': 'Helecho de Boston',         // genus alias
  'Asplenium nidus': 'Helecho nido de ave',
  'Alocasia × amazonica': 'Alocasia',
  'Alocasia': 'Alocasia',                     // genus alias
  'Caladium bicolor': 'Caladium',
  'Caladium': 'Caladium',                     // genus alias
  'Dypsis lutescens': 'Palmera areca',
  'Howea forsteriana': 'Palmera kentia',
  'Syngonium podophyllum': 'Singonio',
  'Syngonium': 'Singonio',                    // genus alias
  'Aglaonema commutatum': 'Aglaonema',
  'Aglaonema': 'Aglaonema',                   // genus alias
  'Sedum morganianum': 'Cola de burro',
  'Heptapleurum arboricola': 'Cheflera',      // current accepted name (2024); Schefflera arboricola already mapped above
  'Monstera adansonii': 'Costilla de Adán',   // distinct from Monstera deliciosa (existing entry id `monstera`)
  'Begonia rex': 'Begonia rex',               // species-qualified (Begonia genus already mapped to 'Begonia')

  // Optional aliases for known synonym drift:
  'Ficus pandurata': 'Ficus lyrata',          // older synonym sometimes returned by PlantNet
  'Pachira glabra': 'Árbol del dinero',       // taxonomically more accurate but less common in PlantNet
  'Sansevieria': 'Sansevieria',               // some PlantNet returns still use legacy genus
};
```

### Example 5: Smoke runner skeleton (smoke-phase15.mjs)

```javascript
// Mirrors scripts/smoke-phase14.mjs (file-content asserts pattern, no transpileModule for content waves)
// Source: pattern from scripts/smoke-phase14.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase15');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Stubs auto-written (mirrors Phase 11/12/14 pattern; .gitignored)
// ... [stub i18n.mjs and types.mjs as in smoke-phase14.mjs] ...

// ── Assertion harness (mirrors Phase 14) ──
let pass = 0, fail = 0, skip = 0;
const errors = [];
const skips = [];
function assert(cond, label) { if (cond) pass++; else { fail++; errors.push(`FAIL: ${label}`); } }
function assertSkippable(condFn, label) {
  try {
    const cond = condFn();
    if (cond === undefined) { skip++; skips.push(`SKIP: ${label}`); }
    else if (cond) pass++;
    else { fail++; errors.push(`FAIL: ${label}`); }
  } catch (e) { skip++; skips.push(`SKIP: ${label} (threw: ${e.message})`); }
}

// ── W0 scaffold PASSes ──
assert(typeof readFileSync === 'function', 'W0.1: node:fs.readFileSync available');
assert(typeof ts.transpileModule === 'function', 'W0.2: typescript.transpileModule available');
assert(existsSync(resolve(ROOT, 'src/data/plantDatabase.ts')), 'W0.3: plantDatabase.ts present');
assert(existsSync(resolve(ROOT, 'src/utils/plantIdentification.ts')), 'W0.4: plantIdentification.ts present');
assert(existsSync(resolve(ROOT, 'src/i18n/locales/en/plants.json')), 'W0.5: en/plants.json present');
assert(existsSync(resolve(ROOT, 'src/i18n/locales/es/plants.json')), 'W0.6: es/plants.json present');

// Read source files ONCE
const dbSrc = readFileSync(resolve(ROOT, 'src/data/plantDatabase.ts'), 'utf8');
const idSrc = readFileSync(resolve(ROOT, 'src/utils/plantIdentification.ts'), 'utf8');
const enJson = readFileSync(resolve(ROOT, 'src/i18n/locales/en/plants.json'), 'utf8');
const esJson = readFileSync(resolve(ROOT, 'src/i18n/locales/es/plants.json'), 'utf8');

// 23 Phase 15 entry ids
const PHASE_15_IDS = [
  'zamioculca', 'pilea', 'tradescantia', 'hiedra', 'croton', 'difenbaquia', 'fitonia', 'cheflera',
  'anthurium', 'begonia-rex', 'arbol-dinero', 'maranta', 'helecho-boston', 'helecho-nido',
  'alocasia', 'caladium', 'palmera-areca', 'palmera-kentia', 'costilla-adan', 'singonio',
  'aglaonema', 'ficus-lyrata', 'cola-burro',
];

// 23 scientific names (canonical forms)
const PHASE_15_SCIENTIFIC_NAMES = [
  'Zamioculcas zamiifolia', 'Pilea peperomioides', 'Tradescantia', 'Hedera helix',
  'Codiaeum variegatum', 'Dieffenbachia', 'Fittonia', 'Heptapleurum arboricola',
  'Anthurium andraeanum', 'Begonia rex', 'Pachira aquatica', 'Maranta leuconeura',
  'Nephrolepis exaltata', 'Asplenium nidus', 'Alocasia × amazonica', 'Caladium bicolor',
  'Dypsis lutescens', 'Howea forsteriana', 'Monstera adansonii', 'Syngonium podophyllum',
  'Aglaonema commutatum', 'Ficus lyrata', 'Sedum morganianum',
];

// CAT-09: 23 entry ids declared in plantDatabase.ts
assertSkippable(() => {
  const allPresent = PHASE_15_IDS.every(id => new RegExp(`id:\\s*['"]${id}['"]`).test(dbSrc));
  if (PHASE_15_IDS.filter(id => new RegExp(`id:\\s*['"]${id}['"]`).test(dbSrc)).length === 0) return undefined;
  return allPresent;
}, 'W2-3.CAT-09.1: All 23 Phase 15 entry ids present in plantDatabase.ts');

// CAT-09 secondary: PLANT_DATABASE.length === 87 via runtime compile
assertSkippable(() => {
  // ... transpile + import dbSrc ... (use Phase 14 pattern for ts.transpileModule + dynamic import)
  // Heuristic: count `id: "..."` occurrences in PLANT_DATABASE block.
  const idMatches = (dbSrc.match(/^\s{4}id:\s*['"][^'"]+['"]/gm) || []).length;
  if (idMatches < 64) return undefined;  // pre-W2 baseline = 64
  return idMatches === 87;
}, 'W2-3.CAT-09.2: PLANT_DATABASE has exactly 87 entry id declarations (64 + 23)');

// CAT-10: each id has full keyset in en + es plants.json
PHASE_15_IDS.forEach(id => {
  assertSkippable(() => {
    const enHas = new RegExp(`"${id}"\\s*:\\s*\\{`).test(enJson);
    const esHas = new RegExp(`"${id}"\\s*:\\s*\\{`).test(esJson);
    if (!enHas && !esHas) return undefined;
    return enHas && esHas;
  }, `W2-3.CAT-10.${id}: ${id} keyset present in both en + es plants.json`);
});

// CAT-11: each scientificName present in COMMON_NAMES_ES (or as a key/value alias)
PHASE_15_SCIENTIFIC_NAMES.forEach(sn => {
  assertSkippable(() => {
    const present = new RegExp(`['"]${sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*:`).test(idSrc);
    if (!/Maranta leuconeura|Asplenium nidus/.test(idSrc)) return undefined;  // SKIP gate: only run after W1 lands
    return present;
  }, `W1.CAT-11.${sn}: scientific name '${sn}' mapped in COMMON_NAMES_ES`);
});

// CAT-12: image plan documented in CLAUDE.md
const claudeMd = readFileSync(resolve(ROOT, 'CLAUDE.md'), 'utf8');
assertSkippable(() => {
  if (!/Phase 15/i.test(claudeMd)) return undefined;
  // At least 20 of the 23 ids mentioned in the accepted-known section
  const found = PHASE_15_IDS.filter(id => claudeMd.includes(id)).length;
  return found >= 20;
}, 'W4.CAT-12: CLAUDE.md accepted-known list mentions ≥20 of 23 Phase 15 ids');

// Voseo regression check (against es/plants.json)
assert(
  (esJson.match(/\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b/g) || []).length <= 2,
  'GLOBAL.voseo: es/plants.json voseo regex count ≤ 2 (post-Phase-14 baseline)'
);

// ── Report ──
if (skips.length > 0) {
  console.log('─── SKIPS ───');
  skips.forEach(s => console.log('  ' + s));
}
if (errors.length > 0) {
  console.error('─── FAILURES ───');
  errors.forEach(e => console.error('  ' + e));
  console.error(`[smoke-phase15] FAIL — ${pass} pass, ${fail} fail, ${skip} skip`);
  process.exit(1);
}
console.log(`[smoke-phase15] PASS ${pass}/${pass + skip} (${skip} placeholder${skip === 1 ? '' : 's'} skipped — Wave 1+ flips)`);
```

### Example 6: CLAUDE.md update format

```markdown
<!-- Source: append to CLAUDE.md after existing Phase 8 accepted-known list -->

**Phase 15 Wave A (v1.2, 23 entries — image upload pending):** the following 23 interior tropical entries are accepted-known failures until manual image upload to Supabase Storage:
- zamioculca, pilea, tradescantia, hiedra, croton, difenbaquia, fitonia, cheflera
- anthurium, begonia-rex, arbol-dinero, maranta, helecho-boston, helecho-nido
- alocasia, caladium, palmera-areca, palmera-kentia, costilla-adan, singonio
- aglaonema, ficus-lyrata, cola-burro

These follow the same milestone-end batch upload pattern as the v1.1 LATAM 15-entry list.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Hardcoded `tip: "..."` strings in plantDatabase.ts | i18n key indirection via `getTranslatedPlant` | Phase 8 (v1.1) | All catalog content now in `plants.json` per locale; defaults are runtime fallback only |
| 5 legacy fields per entry (name/tip/description/problems/nutrients?) | 5 legacy + 5 EDU fields (careAction/placementRecommended/placementAlternatives/placementAvoid/whyRationale) | Phase 14 (v1.2) | Phase 15 entries MUST declare all 10 fields for full educational surface |
| `Sansevieria trifasciata` | `Dracaena trifasciata` | Reclassification 2017 (POWO) | catalog already uses Dracaena; new entries for the genus must use current names |
| `Schefflera arboricola` | `Heptapleurum arboricola` | Reclassification 2024 (POWO) | Phase 15 cheflera entry should use Heptapleurum; Schefflera as alias |
| `outdoor: 0/1` numeric | `outdoor: boolean` | Phase 4 (v1.1) | All Phase 15 entries: `outdoor: false` |
| Single `waterEvery` field | `waterSchedule: { warm, cold }` + `waterMode` | Phase 4 (v1.1) | Required on every new entry |
| `sunHours: number` | `lightLevel: LightLevel` | Phase 4 (v1.1) | Required on every new entry |

**Deprecated / legacy fields still required for backward compat:**
- `waterDays?: number` — mirror `waterSchedule.warm` (v1.0 callers still read this); document with `// @deprecated` comment in PlantDBEntry interface (already done)
- `sunHours?: number` — mirror lightLevel range (v1.0 fallback path)

## Open Questions

1. **costilla-adan species disambiguation**
   - **What we know:** "Costilla de Adán" is a LATAM common name. Two candidate species:
     - `Monstera deliciosa` — the Swiss cheese plant (already in catalog as `monstera`)
     - `Monstera adansonii` — Adam's rib / Swiss cheese vine (smaller, holed not split leaves)
   - **What's unclear:** Which species the user meant in CONTEXT.md's lock. CONTEXT lists `costilla-adan` as a separate entry from `monstera`, suggesting a DISTINCT species.
   - **Recommendation:** Use `Monstera adansonii`. Document in code comment: "costilla-adan is M. adansonii (smaller-leafed; LATAM common name); M. deliciosa is the existing `monstera` entry." Keeps both species addressable. Confirmed by horticultural sources that "costilla de Adán" applies to BOTH species in LATAM Spanish but is more strongly associated with M. adansonii.

2. **arbol-dinero scientificName: aquatica vs glabra?**
   - **What we know:** Most houseplants sold as "money tree" / "Pachira aquatica" are taxonomically Pachira glabra (per Wikipedia, NYBG). PlantNet returns Pachira aquatica more often (legacy convention).
   - **What's unclear:** Which to use as primary `scientificName` field.
   - **Recommendation:** `scientificName: 'Pachira aquatica'` (PlantNet routing reliability) + `'Pachira glabra'` as alias in COMMON_NAMES_ES. Document in code comment.

3. **cheflera scientificName: Schefflera vs Heptapleurum?**
   - **What we know:** Heptapleurum arboricola is the 2024-current accepted name (POWO); Schefflera arboricola is now a synonym. PlantNet may return either depending on training data freshness.
   - **What's unclear:** PlantNet's actual return frequency.
   - **Recommendation:** `scientificName: 'Heptapleurum arboricola'` (forward-compatible) + Schefflera arboricola already exists in COMMON_NAMES_ES (genus-level Schefflera) — this gives bidirectional coverage. If PlantNet integration tests show Schefflera arboricola returned more often, swap primary later.

4. **Sub-batch A vs B routing — does Wave 1 need to land first?**
   - **What we know:** CONTEXT.md says Wave 1 (COMMON_NAMES_ES extension) "can run in parallel with Wave 2" if it's a separate file (which it is).
   - **What's unclear:** Wave 1 needs the catalog ids that Waves 2+3 will define. If Wave 1 mappings reference future ids, we need either (a) Wave 1 lands AFTER Waves 2+3 (sequential), or (b) Wave 1 ships placeholder/empty mappings and Waves 2+3 fill them.
   - **Recommendation:** Wave 1 ships AFTER Wave 2 (sub-batch A) — the catalog ids needed by Wave 1's COMMON_NAMES_ES extension exist as soon as Wave 2 lands. Wave 1 can run in parallel with Wave 3 (sub-batch B). Total order: W0 → W2 → (W1 ‖ W3) → W4. This is what the planner should encode.

5. **Helecho category mapping**
   - **What we know:** All 23 entries are `category: "interior"` per CONTEXT lock. Existing 6 categories include `interior` but no `helecho` sub-category.
   - **What's unclear:** Helechos are visually + horticulturally distinct — should the planner consider adding a `'helecho'` PlantCategory enum value?
   - **Recommendation:** NO. CONTEXT explicitly locks "no new PlantCategory enum values." All 23 use `interior`. The `'helecho'` distinction surfaces via `typeId: 'helecho'` in Plant (via OnboardingScreen's PLANT_TYPE_MAP, NOT plantDatabase) — but Phase 15 doesn't ship via onboarding suggestions, so no PLANT_TYPE_MAP extension is needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Custom node-based smoke runner (single-compile-path: `typescript.transpileModule`) |
| Config file | None — each `scripts/smoke-phase*.mjs` is self-contained |
| Quick run command | `npm run smoke:phase15` (after Wave 0 adds the package.json script) |
| Full suite command | `npm run check:i18n-keys && npx tsc --noEmit && node scripts/smoke-phase15.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-09 | All 23 ids declared in PLANT_DATABASE | unit (file-content) | `node scripts/smoke-phase15.mjs` (asserts each of 23 ids present + count===87) | Wave 0 |
| CAT-09 | PLANT_DATABASE.length === 87 | unit (runtime compile) | `node scripts/smoke-phase15.mjs` (transpileModule + import + length check) | Wave 0 |
| CAT-10 | Each id has en + es key block | unit (file-content regex) | `node scripts/smoke-phase15.mjs` (23 ids × 2 locales presence) | Wave 0 |
| CAT-10 | Each entry's full keyset (incl. EDU fields) | unit (runtime) | `npm run check:i18n-keys` (existing; covers EDU sub-fields conditionally) | ✓ existing |
| CAT-10 | TypeScript shape parity | unit (typecheck) | `npx tsc --noEmit` | ✓ existing |
| CAT-10 | Voseo regression | smoke (regex count) | `node scripts/smoke-phase15.mjs` (asserts es/plants.json voseo grep count ≤ 2) + per-commit `grep -cE '\b(riega\|saca\|pon\|ten\|haz\|quieres\|toca\|mueve\|puedes)\b' src/i18n/locales/es/plants.json` | Wave 0 |
| CAT-11 | 23 scientific names present in COMMON_NAMES_ES | unit (file-content regex) | `node scripts/smoke-phase15.mjs` (23 SN regex assertions) | Wave 0 |
| CAT-11 | findPlantInDatabase routes 23 SNs to expected ids | integration | manual or future test fixture (NOT automated in Phase 15 — out of scope) | manual-only |
| CAT-12 | CLAUDE.md accepted-known list mentions ≥20 of 23 ids | unit (file-content) | `node scripts/smoke-phase15.mjs` (CLAUDE.md regex check) | Wave 0 |
| CAT-12 | check:images expected to fail for 23 new ids | smoke (HEAD check) | `npm run check:images` — failure is documented as accepted-known (NOT a Phase 15 ship blocker) | ✓ existing |

### Sampling Rate
- **Per task commit:** `node scripts/smoke-phase15.mjs && npm run check:i18n-keys && npx tsc --noEmit` (SKIPs flip to PASS as waves land)
- **Per wave merge:** Same as per-commit + voseo grep count regression check
- **Phase gate:** Full suite + `npm run check:images` (expected to fail with 23 new accepted-known ids — verify failure list matches CLAUDE.md exactly) + manual: spot-check that 2-3 representative entries render correctly in detail modal

### Wave 0 Gaps
- [ ] `scripts/smoke-phase15.mjs` — covers CAT-09/10/11/12 with 18-22 placeholders (Wave 0 PASS at baseline 6 + 16 SKIPs; flips to PASS as waves land)
- [ ] `package.json` — add `"smoke:phase15": "node scripts/smoke-phase15.mjs"` script entry
- [ ] `.gitignore` — add `scripts/.tmp-phase15/` line (mirrors Phase 14 pattern)
- [ ] Phase 15 starting voseo baseline confirmation: `grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json` → 2 (verified 2026-05-07; lines 801 + 923)

*(No framework install gap — typescript already a project dependency.)*

## Sources

### Primary (HIGH confidence)
- `src/types/index.ts:152-224` — PlantDBEntry interface (post-Phase-14 with EDU fields)
- `src/data/plantDatabase.ts:30-64` — potus entry as full-shape reference
- `src/utils/plantIdentification.ts:47-126` — COMMON_NAMES_ES + findPlantInDatabase
- `scripts/check-i18n-keys.mjs:76-108` — EDU sub-field validator (Phase 14-01)
- `scripts/smoke-phase14.mjs` — smoke runner pattern reference
- `.planning/phases/14-educational-detail-modal/14-04-SUMMARY.md` — interior content authoring rhythm
- `.planning/phases/14-educational-detail-modal/14-06-SUMMARY.md` — char-limit-from-draft discipline established
- `.planning/phases/14-educational-detail-modal/14-07-SUMMARY.md` — full catalog coverage final wave + frutales/suculentas patterns
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md:49-52` — CAT-09 through CAT-12 specifications

### Secondary (MEDIUM confidence — verified web)
- [Heptapleurum arboricola POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:91930-1) — 2024 accepted name; Schefflera arboricola synonym
- [Heptapleurum arboricola Wikipedia](https://en.wikipedia.org/wiki/Heptapleurum_arboricola) — taxonomic history
- [Ficus lyrata Wikipedia](https://en.wikipedia.org/wiki/Ficus_lyrata) — Ficus pandurata as synonym
- [Pachira aquatica Wikipedia](https://en.wikipedia.org/wiki/Pachira_aquatica) — most houseplants are P. glabra; Taiwan misidentification history
- [Sansevieria → Dracaena reclassification (Plant Care Today)](https://plantcaretoday.com/sansevieria-now-dracaena.html) — 2017 reclassification context (already applied in catalog)
- [Sedum morganianum Wikipedia](https://en.wikipedia.org/wiki/Sedum_morganianum) — donkey tail / cola de burro / burro's tail; Crassulaceae
- [Zamioculcas Wikipedia](https://en.wikipedia.org/wiki/Zamioculcas) — taxonomic history; Caladium zamiifolium → Zamioculcas zamiifolia
- [Caladium praetermissum Top Tropicals](https://toptropicals.com/catalog/uid/caladium_praetermissum.htm) — distinct from Zamioculcas; Hilo Beauty cultivar reference

### Tertiary (LOW confidence)
- None used. All claims either codebase-verified or web-cross-referenced.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure already established by Phases 8/14
- Architecture: HIGH — patterns proven across 4 content waves in Phase 14
- Pitfalls: HIGH — Phase 14-04..07 SUMMARYs document each pitfall with example commits
- PlantNet scientific name canonicality: MEDIUM — POWO/Wikipedia confirms the 4 known reclassifications (Sansevieria/Schefflera/Pachira/Ficus); other 19 entries use stable canonical names
- COMMON_NAMES_ES routing semantics: HIGH — confirmed via direct read of `findPlantInDatabase` code (genus-prefix matching is the primary route; COMMON_NAMES_ES is fallback display only)
- CAT-11 "PLANT_TYPE_MAP" misnomer: HIGH — confirmed via grep across `src/`; only `OnboardingScreen.tsx:47` declares this symbol, unrelated to identification routing

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days — stable phase scope; no fast-moving dependencies)
