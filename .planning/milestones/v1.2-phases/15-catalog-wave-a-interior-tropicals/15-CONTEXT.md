# Phase 15: Catalog Wave A — Interior Tropicals - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning (user delegated all gray areas to Claude's discretion)

<domain>
## Phase Boundary

Add 23 specific interior/tropical plant species to `PLANT_DATABASE` with full v1.1 + Phase 14 EDU schema (10 fields total per entry: 5 legacy `name`/`tip`/`description`/`problems[]`/`nutrients?` + 5 educational `careAction.{fixed?,soilCheck?}`/`placementRecommended`/`placementAlternatives[]`/`placementAvoid`/`whyRationale`). Author voseo i18n in EN + ES (≈460 NEW strings). Add identification routing entries to `COMMON_NAMES_ES` in `src/utils/plantIdentification.ts` so PlantNet returns the curated entry id when the user identifies any of the 23. Document image plan: each entry's image is either uploaded to Supabase Storage or registered as accepted-known failure in `CLAUDE.md` mirroring the v1.1 LATAM 15-entry precedent.

The 23 species are LOCKED by REQUIREMENTS.md CAT-09: zamioculca, pilea, tradescantia, hiedra, croton, difenbaquia, fitonia, cheflera, anthurium, begonia-rex, arbol-dinero, maranta, helecho-boston, helecho-nido, alocasia, caladium, palmera-areca, palmera-kentia, costilla-adan, singonio, aglaonema, ficus-lyrata, cola-burro.

Catalog goes from 64 → 87 entries.

**Out of scope:** Catalog Wave B (Phase 16 — suculentas/cactus + trepadoras + trending), Catalog Wave C (Phase 17 — exterior + aromáticas + frutales). New plant categories (existing 8 in `getPlantTypes()` are sufficient — Phase 18+ may add). Browse-catalog UI (Phase 14.x or later — current add flow uses 8 categories + PlantNet identification, no direct catalog picker yet). Image sourcing/upload tooling beyond the documented "accepted-known" registry pattern.

</domain>

<decisions>
## Implementation Decisions

### Plan structure (split across 2 sub-batches sequential)

- **Wave 0:** smoke runner scaffold (`scripts/smoke-phase15.mjs`) with assertSkippable placeholders for CAT-09/10/11. Mirror Phase 11/12/13/14 pattern.
- **Wave 1:** schema/code prep (CAT-11) — extend `COMMON_NAMES_ES` map in `src/utils/plantIdentification.ts` with all 23 scientific names → catalog ids. This wave can land BEFORE catalog content because COMMON_NAMES_ES needs ids that catalog content will define. Resolution: Wave 1 can include placeholder/empty mappings for all 23 to lock the structure, OR Wave 1 happens AFTER Wave 2 — planner picks based on actual file-conflict analysis.
- **Wave 2 (sub-batch A):** 12 entries — aroceous + foliage especial group. Shared physiology citations make these batchable: anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia (all aroceous family — warmth + indirect bright + humidity); begonia-rex, croton, fitonia, ficus-lyrata, maranta (foliage especial — careful light placement, leaf-color expression).
- **Wave 3 (sub-batch B):** 11 entries — diverse rest. zamioculca + cola-burro (CAM-friendly succulent-tropicals); hiedra (trepadora); palmera-areca + palmera-kentia (palmeras); helecho-boston + helecho-nido (humidity-loving helechos); pilea + tradescantia + cheflera + arbol-dinero (all-rounder durables).
- **Wave 4 (optional):** image plan documentation — register the 23 entries' image status in CLAUDE.md (uploaded vs accepted-known). Lightweight; can fold into Wave 2/3 plans or be its own short plan. Planner picks.
- **Wave 5 (optional):** manual checkpoint? NOT needed for this phase — content is automated by smoke + check:i18n-keys. Phase 14's manual checkpoint covered the EDU rendering surface; Phase 15 is data-only.

Sub-batch grouping by sub-typology (vs alphabetical) lets the content authoring share whyRationale templates and placement guidance — same species family/habit get similar (but distinct) physiology citations.

**File-conflict reality:** Waves 2 and 3 BOTH touch `src/data/plantDatabase.ts` and `src/i18n/locales/{en,es}/plants.json`. They MUST run sequentially. Wave 1 (COMMON_NAMES_ES extension) can run in parallel with Wave 2 if it's a separate file (`src/utils/plantIdentification.ts`) — confirm in planning.

### Image upload strategy (defer all 23 to "accepted-known" pattern)

- **All 23 entries' imageUrls point to the standard Supabase pattern** (`plant-images/catalog/<id>.jpg`) but are NOT uploaded as part of Phase 15.
- **Document the 23 as accepted-known failures in CLAUDE.md** — mirror the v1.1 LATAM 15-entry precedent. Add to the existing "accepted-known failures" list with a "Phase 15 Wave A" annotation.
- **Image upload becomes a pre-submit task** (milestone-end batch upload) consistent with the v1.2 device-test backlog pattern.
- Rationale: image sourcing (CC0/public domain finding + downloading + uploading to Supabase) is slow, manual, low-priority for the educational-content goal of this phase. The placeholder default rendering still fires for end users; only `npm run check:images` fails (which is bypassed for accepted-known). Defer is the practical choice.

### PlantNet identification routing scope (minimum + documented aliases)

- **Required:** every entry's `scientificName` (canonical, as appears in `PlantDBEntry.scientificName`) maps to its catalog id in `COMMON_NAMES_ES`.
- **Aliases:** add a small set of well-known PlantNet variants per entry when documented in research — e.g., "Ficus lyrata" sometimes returned as "Ficus pandurata" by PlantNet; "Zamioculcas zamiifolia" sometimes "ZZ Plant" or "Aroid Palm". Researcher should identify must-add aliases via PlantNet API behavior or community reports. Cap: ≤2 aliases per entry to limit maintenance burden.
- **Don't go exhaustive.** Every variant adds LOC and maintenance with diminishing return. Phase 12 unknown-plants tracker silently logs anything we miss; the v1.2 backlog can flag high-frequency missed mappings for future addition.
- **Validator:** Wave 0 smoke runner asserts the 23 scientific names are present in `COMMON_NAMES_ES`. Doesn't enforce alias coverage (those are best-effort).

### Sub-typology in placement copy (informal, used as guidance)

These sub-types inform `placementRecommended` / `placementAlternatives` / `placementAvoid` / `whyRationale` for each entry but do NOT introduce a new `PlantCategory` enum value (existing 8 categories in `getPlantTypes()` cover all 23):

| Sub-type | Entries | Placement guidance |
|---|---|---|
| Aroceous (family Araceae) | anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia | Warm + bright indirect + high humidity; avoid drafts + cold + direct sun. Cite: "perteneciente a las aráceas, evolucionada en sotobosque tropical" |
| Foliage especial | begonia-rex, croton, fitonia, ficus-lyrata, maranta | Light placement is critical — too low = green only / leaf color drops; too direct = burn. Cite specific physiology (anthocyanin in croton, leaf-fold rhythm in maranta) |
| Succulent-tropical (CAM-friendly) | zamioculca, cola-burro | Tolerate forgetfulness, don't tolerate over-watering. Cite CAM metabolism + water-storage tissue |
| Trepadora | hiedra (others handled in Phase 16) | Need vertical support OR cascade; bright indirect; tolerate moderate cold |
| Palmera | palmera-areca, palmera-kentia | Tolerate brighter conditions than aroceous; sensitive to over-watering; slow growth = patient watering schedule |
| Helecho | helecho-boston, helecho-nido | High humidity + indirect light + consistent moisture; sensitive to dry air + direct sun |
| All-rounder | pilea, tradescantia, cheflera, arbol-dinero | Forgiving of light + watering variations; good "starter" plants. Cite their adaptability |

### Content quality bar (carrying forward from Phase 14)

- **Voseo discipline (ES):** regá / sacá / podés / querés / podá / movela / tocá / hacé. NEVER riega/saca/puedes/quieres/mueve/toca/haz. Voseo grep guard runs vs post-Phase-14 baseline (count = 2 from legacy pre-Phase-14 strings); Phase 15 must NOT increase this count.
- **whyRationale ≤ 250 chars** — drafted at this length from the start (Phase 14-06 established this; Phase 14-05 had to refactor post-hoc, avoid that).
- **Mechanism citations:** every whyRationale cites a specific physiological or geographic mechanism. NEVER generic ("porque sí" / "para que crezca bien"). Examples for Phase 15 sub-types:
  - Aroceous: "evolucionada bajo dosel tropical — luz tamizada le permite expresar fenestraciones y mantener clorofila"
  - Foliage especial: "antocianinas requieren luz brillante para sintetizarse — sin ella las hojas pierden color"
  - CAM succulent: "metabolismo CAM cierra estomas de día — pierde menos agua, tolera olvidos de riego"
  - Helecho: "esporofito requiere humedad ambiental >60% — sin ella las frondas se secan irreversiblemente"
- **EN parallel:** factual, friendly, no exclamation marks unless emphasizing. Match existing entry tone in `plants.json`.
- **Field shape parity:** every NEW entry has all 5 legacy fields (name/tip/description/problems[]/nutrients?) + all 5 EDU fields. The validator (`scripts/check-i18n-keys.mjs`) already enforces this conditionally for EDU fields (Phase 14 EDU-07 extension); Wave 0 smoke runner asserts entry-shape uniformity.

### Defaults for new entries (Claude's discretion within these guardrails)

- **`waterMode`:** prefer `'soil-check'` for tropicals (most are humidity/touch-dependent); `'fixed'` for predictable types (palmeras, all-rounders). Planner decides per entry based on plant biology.
- **`lightLevel`:** most interior tropicals → `'bright_indirect'`. Exceptions: aglaonema/sansevieria-like → `'low'`; croton/ficus-lyrata → `'bright_indirect'` with note about avoiding direct.
- **`tempMin` / `tempMax`:** standard tropical range 15-30°C unless species-specific (alocasia tolerates lower minimums, caladium needs warmer).
- **`humidity`:** `'high'` for helechos/aroceous/begonia-rex/fitonia/croton/anthurium/maranta; `'medium'` for most others; `'low'` for zamioculca/cola-burro/cheflera (succulent or durable).
- **`outdoor`:** all 23 → `false` (interior tropical phase).
- **`category`:** map to existing 8 `PlantCategory` values — most likely `'foliage'` or `'tropical'` (TBD which exists; planner verifies).

### Claude's Discretion

- **Wave 1 timing:** plan can wire COMMON_NAMES_ES extension before, after, or interleaved with content waves — depending on exact file-conflict analysis. Single hard constraint: Wave 0 ships smoke runner first.
- **Image plan documentation phrasing:** add a single CLAUDE.md update entry rather than 23 individual lines. Group as "Phase 15 Wave A (23 entries — image upload pending)".
- **PlantNet alias selection:** researcher identifies must-add aliases per entry. If unsure, add 0-1 aliases (canonical scientificName always present); skip the rest. Don't block on perfect coverage.
- **Field shape variations within sub-types:** planner may use slightly different placement copy patterns within sub-types if a species has a unique requirement (e.g., palmera-kentia tolerates lower light than palmera-areca — reflect in placementRecommended).
- **Smoke runner shape:** mirror Phase 14's smoke-phase14.mjs pattern (assertSkippable for content-dependent assertions, immediate PASS for code-dependent ones). 18-20 placeholders covering CAT-09 (entry presence x23 — likely batched into 1-2 omnibus assertions), CAT-10 (i18n keys present — covered by check:i18n-keys integration), CAT-11 (COMMON_NAMES_ES coverage), CAT-12 (image plan documented).
- **Char-limit ceiling enforcement:** ≤250 char on whyRationale strings — draft at this length from the start (Phase 14-06 established). If a draft runs over, inline-trim before commit (don't ship + post-hoc refactor like Phase 14-05 did).
- **Per-task autonomous commits:** mirror Phase 14 pattern — separate commits for each substantive change (smoke scaffold, COMMON_NAMES_ES extension, sub-batch A content, sub-batch B content, image plan doc). Atomic commits = clean revert path.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 15 spec
- `.planning/REQUIREMENTS.md` — CAT-09 through CAT-12 (lines 49-52) — the 4 requirements that close in Phase 15
- `.planning/ROADMAP.md` §"Phase 15: Catalog Wave A — Interior Tropicals" (lines 45 + 138) — goal + success criteria

### Project conventions
- `CLAUDE.md` — design system, i18n discipline, voseo for ES, pre-submit checks, accepted-known image failures registry pattern (existing 15-entry list serves as the model for Phase 15's 23 additions)
- `.planning/STATE.md` — current state, active bug-watches, milestone version

### Existing files (modified or referenced by Phase 15)
- `src/data/plantDatabase.ts` (~2415 LOC after Phase 14 + 14.1) — the catalog file. Add 23 new PlantDBEntry objects following the established shape (read existing entries 53-200 for the convention).
- `src/types/index.ts` §`PlantDBEntry` (line 162-220+) — the interface. Phase 14 already added the 5 EDU fields; Phase 15 just uses the type as-is.
- `src/utils/plantIdentification.ts` (~250 LOC) §`COMMON_NAMES_ES` (line 47) and §`findPlantInDatabase` (line 117) — extend the map with 23 new scientificName → catalog id mappings. The existing map structure is `Record<string, string>`; planner extends.
- `src/i18n/locales/en/plants.json` (~2314 LOC after Phase 14-07) — i18n keys for EN. Each new entry adds 5 legacy keys + 5 EDU keys = 10 strings × 23 entries = 230 EN strings.
- `src/i18n/locales/es/plants.json` (~2314 LOC after Phase 14-07) — i18n keys for ES (voseo). Same shape as EN: 230 ES strings.
- `scripts/check-i18n-keys.mjs` (~116 LOC after Phase 14-01) — validator. Already enforces 5 EDU conditional checks; should automatically validate Phase 15 entries with no extension needed.
- `scripts/smoke-phase14.mjs` — reference smoke runner pattern for Phase 15's new `scripts/smoke-phase15.mjs`.

### Prior phase context (read for pattern continuity)
- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — EDU schema decisions, voseo discipline lock, char-limit ≤250 chars, citation style guide
- `.planning/phases/14-educational-detail-modal/14-RESEARCH.md` §Pattern 3 — i18n authoring workflow recommended pattern
- `.planning/phases/14-educational-detail-modal/14-04-SUMMARY.md` — interior plants content (15 entries) — references for citation style + sub-block patterns
- `.planning/phases/14-educational-detail-modal/14-05-SUMMARY.md` — exterior plants content (21 entries) + char-limit refactor lesson + voseo regression false-positive learning ("se riega al pie" → "el riego va al pie")
- `.planning/phases/14-educational-detail-modal/14-06-SUMMARY.md` — aromáticas/huerta content + char-limit-from-draft discipline established
- `.planning/phases/14-educational-detail-modal/14-07-SUMMARY.md` — frutales/suculentas content + family lexicon citation pattern (Rutáceas/Lauráceas/Moráceas)
- `.planning/phases/12-unknown-plant-tracking/12-CONTEXT.md` — unknown-plants tracker (silently logs PlantNet-identified species not in catalog; relevant for measuring Phase 15's identification coverage post-deploy)
- `.planning/phases/14.1-databaseid-persistence-fix/14.1-00-SUMMARY.md` — databaseId persistence fix; Phase 15 entries' identification routing now works end-to-end

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/data/plantDatabase.ts` `PLANT_DATABASE` array** — established shape for entries. Read first 5-10 entries to match convention. New entries append to the array (no specific order required, but grouping by sub-typology in source helps audit).
- **`getCatalogEntry(slug)` and `findPlantInDatabase(scientificName)`** — both return PlantDBEntry. Phase 15 doesn't modify these; they consume the new entries automatically.
- **`getTranslatedPlant(plant)` (line 2316)** — Phase 14 extended this to surface 5 EDU fields. Works for Phase 15 entries automatically when their i18n keys exist.
- **`scripts/check-i18n-keys.mjs:76-108`** — Phase 14 EDU-07 extension already validates 5 EDU fields conditionally. Phase 15 entries automatically get validator coverage when they declare the fields.
- **Phase 14 SUMMARYs (especially 14-04..07)** — proven authoring patterns + lessons learned (char-limit, voseo regression, citation style by sub-type).

### Established Patterns

- **Catalog entries are JS module data** — `PLANT_DATABASE` is loaded fresh on each app launch. No DB schema migration needed for new entries (purely JS code change).
- **Additive-optional EDU schema** — adding entries with EDU fields doesn't break existing entries (other entries continue to work). Phase 14-01 SUMMARY confirmed.
- **Per-entry i18n keyset** — each entry's id keyspace under `plants.json` (e.g., `monstera.name`, `monstera.tip`, `monstera.careAction.fixed`). Phase 15 mirrors.
- **Voseo grep guard** — established in Phase 14, applied per content commit. Baseline = 2 (legacy strings); must not increase.
- **Atomic commits per substantive change** — Phase 14's pattern. Each Wave/sub-batch = its own commit; ROADMAP/STATE updates in the SUMMARY commit.
- **Smoke runner per phase** — established Phase 11/12/13/14 pattern. Wave 0 ships the harness; later waves' verification flips placeholders SKIP → PASS.
- **"Accepted-known failures" registry in CLAUDE.md** — v1.1 precedent, 15 entries listed; Phase 15 extends with 23 more (or annotates the list with phase reference).

### Integration Points

- **PlantNet → catalog routing**: `findPlantInDatabase(scientificName)` resolves to PlantDBEntry; `COMMON_NAMES_ES` provides the scientific name → ES common name mapping; together they enable PlantNet identification → curated catalog entry. Phase 14.1 fix ensures this round-trips through the save flow.
- **MyPlantDetailModal display**: When a Phase 15 entry's `databaseId` is persisted on a saved Plant (via Phase 14.1 fix), the detail modal's strictDbEntry resolution surfaces the new entry's 5 EDU fields automatically.
- **`getPlantCategories()`**: Phase 15 entries map to existing PlantCategory values; no new category creation.
- **`scripts/smoke-phase15.mjs` integration with Wave 0**: mirrors Phase 14's pattern. Place in `scripts/`, expose via `npm run smoke:phase15` script, wire into per-task `<verify><automated>` blocks.

</code_context>

<specifics>
## Specific Ideas

- "Sub-batch by sub-typology, not alphabetically" — let the planner share whyRationale templates within sub-types (aroceous, foliage especial, succulent-tropical, etc.) for content quality + author efficiency
- "Defer image upload, register as accepted-known" — practical choice; mirror v1.1 precedent
- "PlantNet routing minimum + 1-2 aliases per entry max" — coverage vs maintenance trade-off; researcher identifies must-add aliases
- "Char-limit ≤250 chars on whyRationale from draft" — Phase 14-06 lesson: don't ship + post-hoc refactor
- "Mechanism citations per sub-type" — physiology + family lexicon (aráceas, palmaceae, etc.) gives content depth without generic phrasing

</specifics>

<deferred>
## Deferred Ideas

- **Catalog browser UI** — direct picker to choose a catalog entry instead of going through PlantNet identification. Would benefit Phase 15+'s entries (currently inaccessible without PlantNet flow). Estimate: separate phase 14.x or future v1.2 phase.
- **Catalog Wave B (Phase 16)** — 19 more entries (suculentas/cactus + trepadoras + trending). Out of Phase 15 scope.
- **Catalog Wave C (Phase 17)** — 14 more entries (exterior + aromáticas + frutales). Out of Phase 15 scope.
- **Image upload tooling** — automated CC0 image search + upload pipeline. Could be a future tooling phase. For now manual is the v1.1 + v1.2 pattern.
- **Pet toxicity for new entries (Phase 19)** — `petToxicity` field will be added in Phase 19 to all 120 entries (after all 3 catalog waves). Phase 15 doesn't need to touch this field.
- **PlantNet exhaustive alias coverage** — wait for Phase 12 unknown-plants tracker data to identify high-frequency misses; address in a future micro-phase if signal warrants.
- **Image upload for the existing 15 v1.1 LATAM entries** — pre-existing accepted-known failure backlog item; not Phase 15 scope.
- **Browse-add flow with databaseId pre-population** — Phase 14.1 fixed databaseId persistence for prefilledPlant + PlantNet flows; a "browse catalog and add" UI would be the third call site. Deferred.

</deferred>

---

*Phase: 15-catalog-wave-a-interior-tropicals*
*Context gathered: 2026-05-07 (delegated to Claude's discretion per user)*
