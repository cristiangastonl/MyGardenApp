# Phase 16: Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning (2 areas captured from user, rest delegated to Claude's discretion mirroring Phase 15)
**Addendum 2026-05-07:** Two post-research user decisions added below (CAT-14 collision resolution + routing refactor scope). ROADMAP.md success criteria updated.

<domain>
## Phase Boundary

Add 19 specific plant species to `PLANT_DATABASE` with full v1.1 + Phase 14 EDU schema (10 fields per entry). Author voseo i18n in EN + ES (≈380 NEW strings). Extend `COMMON_NAMES_ES` in `src/utils/plantIdentification.ts` so PlantNet identification routes to curated entries. Document image plan: each entry's image registered as accepted-known failure in `CLAUDE.md` mirroring Phase 15 Wave A precedent (image upload deferred to milestone-end batch).

The 19 species are LOCKED:
- **CAT-13 (10 cactus/suculentas):** kalanchoe, siempreviva, piedras-vivas, nopal, mammillaria, corona-espinas, gasteria, senecio-rowleyanus, cactus-navidad, agave
- **CAT-14 (4 trepadoras/colgantes):** potus, filodendro, hoya, mini-monstera *(locked in this discussion — see decisions)*
- **CAT-15 (5 trending):** strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica (Dracaena angolensis — distinct from existing `sansevieria`), cactus-san-pedro

Catalog goes from 87 → 106 entries.

**Out of scope:** Catalog Wave C (Phase 17 — exterior/aromáticas/frutales). New `PlantCategory` enum values (existing 8 sufficient). Browse-catalog UI. Image sourcing/upload tooling beyond the accepted-known registry. Pet toxicity field (Phase 19).

</domain>

<decisions>
## Implementation Decisions

### Post-research addendum (2026-05-07) — locked

Research surfaced two findings that warranted user decisions before planning:

**1. CAT-14 collision resolution: Option A (upgrade in place).** Research found that `potus` (plantDatabase.ts:30) and `filodendro` (plantDatabase.ts:1038) already exist as v1.0/v1.1 entries lacking only the 5 Phase 14 EDU fields. CAT-14 is therefore 2 net-new entries (`hoya`, `mini-monstera`) + 2 in-place EDU upgrades. Catalog target: **87 → 104** (not 106). ROADMAP.md success criterion #1 amended to `PLANT_DATABASE.length === 104`. Both upgraded entries keep their existing ids (`potus`, `filodendro`) so no databaseId persistence issues for users with saved Plants.

**2. Routing refactor in Phase 16 Wave 0.** Research identified an existing latent bug: `findPlantInDatabase` does first-match-wins on genus prefix. Adding `bambu-suerte` (Dracaena sanderiana) and `sansevieria-cilindrica` (Dracaena angolensis) compounds an existing collision — all `Dracaena <species>` PlantNet results currently route to the existing `sansevieria` entry (D. trifasciata) regardless of species. **Fix:** ~5-LOC refactor of `findPlantInDatabase` for exact-match-first, then genus-prefix fallback. Lands as a dedicated task in the Wave 0 plan (alongside the smoke runner scaffold). Smoke runner MUST assert each Phase 16 species-qualified scientificName routes to its own id (this requires a TS-transpile or function-import path — `phase15-smoke.cjs`'s file-content regex is insufficient; planner extends pattern accordingly). New ROADMAP.md success criterion #5 records this requirement.

### CAT-14 trepadora species selection (locked in discussion)

Four climber/hanging entries:

| Id | Scientific name | Habit | Notes |
|----|------|------|------|
| `potus` | *Epipremnum aureum* | Vine, climbs/cascades | Golden pothos. Highest-recognition trepadora; entry-level beginner plant. Aliases: *Pothos aureus* (old synonym), *Scindapsus aureus* |
| `filodendro` | *Philodendron hederaceum* | Vine, heart-leaf | Heart-leaf philodendron; classic LATAM-home staple. Aliases: *Philodendron scandens* (old synonym) |
| `hoya` | *Hoya kerrii* | Slow-growing succulent vine | Lucky-heart hoya — single-leaf gift-plant context + larger climbing form. Trending. Aliases: *Hoya kerrii* "Sweetheart Plant" |
| `mini-monstera` | *Rhaphidophora tetrasperma* | Climbs with moss pole | Trending, often mis-sold as "Monstera minima" or "Philodendron Ginny" — alias coverage important |

Rationale: 2 beginner staples (potus, filodendro) + 2 trending (hoya kerrii, mini-monstera). Existing catalog already has `hiedra` and `costilla-adan` (Monstera adansonii), so these 4 round out the trepadora coverage without duplication.

### Outdoor flag exceptions (locked — botanically accurate)

| Entry | `outdoor` | Rationale |
|-------|-----------|-----------|
| eucalipto | `true` | Tree species; only outdoor-viable in Argentine climate |
| agave | `true` | Large desert species; outdoor in temperate/subtropical regions |
| nopal | `true` | Opuntia tree-cactus; outdoor or very large container |
| cactus-san-pedro | `true` | Trichocereus pachanoi; large columnar cactus, outdoor or large pot |
| **All other 15 entries** | `false` | Interior-tracking app default; matches Phase 15 framing |

Note: `strelitzia` stays `outdoor: false` — assume compact-pot indoor context (S. reginae rather than S. nicolai giant). Cactus-navidad stays `outdoor: false` — Schlumbergera is typically indoor.

### Plan structure (mirrors Phase 15 — sub-batch by sub-typology)

Following Phase 15's proven 5-plan layout:

- **Wave 0 (15-00 equivalent):** smoke runner scaffold `scripts/phase16-smoke.cjs` with partial-landing-tolerant SKIP gates for CAT-13/14/15/16 (anyLanded/allLanded windowing, mid-band count SKIP)
- **Wave 1 (15-01 equivalent):** Sub-batch A — cactus + suculentas (10 entries from CAT-13 + agave/nopal/cactus-san-pedro share physiology). Shared whyRationale templates for CAM metabolism, water-storage tissue, dormancy cycles
- **Wave 2 (15-02 equivalent):** Sub-batch B — trepadoras + trending non-succulent (potus, filodendro, hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica) — 8 entries
- **Wave 3 (parallel: 15-03 + 15-04 equivalent):** COMMON_NAMES_ES extension for all 19 (CAT-16) ‖ CLAUDE.md image-plan registry (CAT-16)

Exact wave splits and sub-batch contents are Claude's discretion at planning time — file-conflict analysis on `plantDatabase.ts` + i18n files forces sequential authoring waves.

### Trending entries — Claude's discretion (special cases noted for planner)

- **bambu-suerte (Dracaena sanderiana):** primarily grown in water culture, not soil. `waterMode` doesn't cleanly fit. Recommended approach: use `waterMode: 'fixed'` with low frequency, document water-culture context in `description` + `tip` + `whyRationale`. Add `placementRecommended` text noting water-culture variant.
- **cactus-san-pedro (Trichocereus pachanoi):** purely horticultural framing — describe care needs without referencing Andean ceremonial/psychoactive context. App is plant-care, not ethnobotany. Aliases: *Echinopsis pachanoi* (current accepted), *Trichocereus pachanoi* (older synonym still widely used).
- **sansevieria-cilindrica (Dracaena angolensis):** distinct entry id from existing `sansevieria`. Risk: genus-prefix matching in `findPlantInDatabase` could collide with bambu-suerte (also Dracaena) or existing sansevieria entries. Mitigation: extend smoke runner to assert each Phase 16 entry's exact scientificName routes to its own id (not collateral genus matches). i18n keys `sansevieria-cilindrica.*` namespace prevents collision with `sansevieria.*` keys.
- **strelitzia:** species TBD by researcher (likely *Strelitzia reginae* — compact pot variant, more common in Argentine homes than *S. nicolai* giant). Confirm at research time.
- **eucalipto:** species TBD by researcher (likely *Eucalyptus citriodora* aromatic-leaf variety, or *E. globulus* common Argentine plantation tree). Confirm at research time. Aromatic category likely.

### Lithops (`piedras-vivas`) physiology — full custom whyRationale

Lithops have extreme drought physiology that generic-succulent copy will misrepresent:
- **Mesemb family** (Aizoaceae) — South African desert species
- **Annual leaf cycle:** new leaves replace old via internal absorption
- **Watering rhythm:** nearly dry summer dormancy, water only spring/autumn, complete withhold during leaf-replacement
- **`whyRationale` ≤250 char must cite:** mesemb family + leaf-replacement cycle + summer dormancy → why generic succulent watering kills them

Other cactus + succulent entries can share standard CAM/water-storage-tissue templates; Lithops gets its own.

### Carrying forward from Phase 15 (no re-discussion needed)

All Phase 15 patterns apply unchanged:

- **Voseo discipline (ES):** regá / sacá / podés / querés / podá / movela / tocá / hacé. Voseo grep guard baseline = 2 (preserved through Phase 15); Phase 16 must NOT increase.
- **whyRationale ≤ 250 chars** drafted at length, not post-hoc trimmed.
- **Mechanism citations** per sub-type (CAM metabolism, mesembs, anthocyanins, etc.) — never generic "porque sí".
- **Defer all images to accepted-known** — extend CLAUDE.md "Phase 15 Wave A" block with a "Phase 16 Wave B" block. 19 more entries to milestone-end batch upload.
- **PlantNet alias coverage:** ≤2 aliases per entry (canonical scientificName + 1-2 well-known synonyms). Researcher identifies must-add aliases (e.g., *Pothos aureus*, *Trichocereus pachanoi*, *Sansevieria cylindrica*).
- **Smoke runner Wave 0 with partial-landing tolerance** — `scripts/phase16-smoke.cjs` mirrors `phase15-smoke.cjs` shape: anyLanded/allLanded gates per CAT-13/14/15 ids, mid-band count SKIP, IDENT.CAT-16 species-qualified scientificName matching.
- **Atomic per-task commits** — clean revert path; mirror Phase 15's commit cadence.
- **Field shape parity:** every NEW entry has all 5 legacy fields (name/tip/description/problems[]/nutrients?) + all 5 EDU fields. Validator (`scripts/check-i18n-keys.mjs`) auto-validates conditionally.

### Defaults (Claude's discretion within these guardrails)

- **`waterMode`:** `'fixed'` for cactus + most succulents (predictable schedule); `'soil-check'` for trepadoras + Lithops (touch-dependent). Bambu-suerte → `'fixed'` with water-culture caveat in copy.
- **`lightLevel`:** cactus/succulents → `'bright_indirect'` to `'direct'`; trepadoras → `'bright_indirect'`; trending mixed (bambu-suerte `'low'` to `'medium'`, sansevieria-cilindrica `'low'` to `'bright_indirect'`).
- **`tempMin` / `tempMax`:** standard tropical for trepadoras (15-30°C); succulent/cactus tolerates wider (5-35°C); Lithops 5-30°C.
- **`humidity`:** `'low'` for most cactus + sansevieria-cilindrica + bambu-suerte; `'medium'` for trepadoras; `'high'` for hoya kerrii (succulent vine but enjoys higher humidity).
- **`category`:** map to existing 8 `PlantCategory` values (planner verifies at planning time). Likely: succulent for cactus/suculentas; tropical/foliage for trepadoras; aromáticas for eucalipto; tropical for strelitzia/bambu-suerte/sansevieria-cilindrica.

### Claude's Discretion

- **Trending special cases** — bambu-suerte water-culture framing, cactus-san-pedro horticultural-only framing, sansevieria-cilindrica routing distinct from sansevieria via smoke runner assertion, strelitzia + eucalipto species selection at research time
- **Sub-batch organization** — exact split between Sub-batch A and B (cactus+succulents vs trepadoras+trending non-succulent). Wave layout follows Phase 15's 5-plan pattern; planner adjusts based on file-conflict analysis
- **PlantNet alias selection** — researcher identifies must-add aliases per entry (capped ≤2). Common ones: *Pothos aureus*, *Sansevieria cylindrica*, *Echinopsis pachanoi* / *Trichocereus pachanoi*, *Hoya kerrii* "Sweetheart Plant"
- **Char-limit ceiling enforcement** ≤250 char on whyRationale at draft time
- **Per-task autonomous commits** mirror Phase 15 atomic commit pattern
- **Whether to fold image-plan registry update into Sub-batch B plan or split into its own plan** — file-disjoint with `COMMON_NAMES_ES` so they parallelize either way

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 16 spec
- `.planning/REQUIREMENTS.md` §"Catalog Expansion Wave B" (lines 54-59) — CAT-13 through CAT-16, the 4 requirements that close in Phase 16
- `.planning/ROADMAP.md` §"Phase 16: Catalog Wave B" — goal + success criteria

### Project conventions
- `CLAUDE.md` — design system, i18n discipline, voseo for ES, pre-submit checks, accepted-known image failures registry pattern (existing "Phase 15 Wave A" block serves as the model for Phase 16's 19 additions)
- `.planning/STATE.md` — current state, milestone version (v1.2 Recommendation-First Plant Guide)

### Existing files (modified or referenced by Phase 16)
- `src/data/plantDatabase.ts` (~3300 LOC after Phase 15) — the catalog file. Append 19 new PlantDBEntry objects following the established shape (read existing Phase 15 entries 2400+ for the convention, especially Sub-batch B entries 2700+ for trepadora/diverse-species pattern).
- `src/types/index.ts` §`PlantDBEntry` — the interface (Phase 14 EDU fields established).
- `src/utils/plantIdentification.ts` (~280 LOC after Phase 15) §`COMMON_NAMES_ES` and §`findPlantInDatabase` — extend the map with 19 new scientificName → catalog id mappings. Phase 15 added 26 entries (21 canonical + 5 aliases); Phase 16 adds ~25-30 (19 canonical + ≤2 aliases each).
- `src/i18n/locales/en/plants.json` (~3100 LOC after Phase 15) — 10 strings × 19 entries = 190 EN strings.
- `src/i18n/locales/es/plants.json` (~3100 LOC after Phase 15) — 190 ES voseo strings.
- `scripts/check-i18n-keys.mjs` — validator. Phase 14 + 15 already cover EDU fields conditionally; no changes needed.
- `scripts/phase15-smoke.cjs` (217 LOC) — reference smoke runner pattern for Phase 16's new `scripts/phase16-smoke.cjs`.

### Prior phase context (read for pattern continuity)
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-CONTEXT.md` — the direct pattern template for this phase. Sub-batch by sub-typology, voseo discipline, char-limit, smoke runner shape, defer images.
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-RESEARCH.md` — research methodology (taxonomic name verification via POWO/Wikipedia, PlantNet alias identification approach).
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-VALIDATION.md` — Nyquist validation contract template.
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-VERIFICATION.md` — final verification report (4/4 must-haves, 81/81 PASS smoke, 104/104 PASS identification).
- `.planning/phases/15-catalog-wave-a-interior-tropicals/15-{00,01,02,03,04}-SUMMARY.md` — execution lessons + voseo regex baseline preservation pattern + char-limit-from-draft success.
- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — original EDU schema decisions, citation style guide, voseo discipline lock.
- `.planning/phases/14-educational-detail-modal/14-04..07-SUMMARY.md` — content authoring lessons, char-limit refactor lesson, family lexicon citation pattern.
- `.planning/phases/12-unknown-plant-tracking/12-CONTEXT.md` — unknown-plants tracker context (relevant for Phase 16 routing coverage measurement post-deploy).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/data/plantDatabase.ts` `PLANT_DATABASE` array (87 entries after Phase 15)** — Phase 15 Sub-batch A (12 entries) + Sub-batch B (11 entries) provide the most direct authoring pattern. Read entries appended after line 2400 for Phase 15 conventions.
- **`getCatalogEntry(slug)` and `findPlantInDatabase(scientificName)`** — both consume new entries automatically.
- **`getTranslatedPlant(plant)`** — surfaces 5 EDU fields automatically when i18n keys exist.
- **`scripts/phase15-smoke.cjs` (217 LOC)** — direct template for `phase16-smoke.cjs`. Copy structure, swap PHASE_15_IDS → PHASE_16_IDS, PHASE_15_SCIENTIFIC_NAMES → PHASE_16_SCIENTIFIC_NAMES, swap CAT-09/10/11/12 → CAT-13/14/15/16. Mid-band count SKIP: `idMatches > 87 && idMatches < 106 → undefined`.
- **`scripts/check-i18n-keys.mjs`** — auto-validates Phase 16 entries with no extension.
- **Phase 15 SUMMARYs (especially 15-01, 15-02)** — proven sub-batch authoring patterns + 24-flip + 23-flip cadence.

### Established Patterns
- **Catalog entries are JS module data** — pure JS code change, no DB schema migration.
- **Additive-optional EDU schema** — adding entries doesn't break existing entries.
- **Per-entry i18n keyset** — each entry's id keyspace under `plants.json`. `sansevieria-cilindrica.*` is a distinct namespace from `sansevieria.*` so no collision.
- **Voseo grep guard** — baseline = 2 (legacy strings); Phase 15 preserved at 2; Phase 16 must NOT increase.
- **Atomic commits per substantive change** — Phase 14/15 pattern. Each Wave/sub-batch = its own commit.
- **Smoke runner per phase** — Phase 11/12/13/14/15 pattern. Wave 0 ships harness with partial-landing SKIP gates; later waves flip placeholders SKIP → PASS.
- **"Accepted-known failures" registry in CLAUDE.md** — v1.1 (15 entries) + Phase 15 Wave A (23 entries) precedent; Phase 16 extends with "Phase 16 Wave B" block (19 entries).

### Integration Points
- **PlantNet → catalog routing**: `findPlantInDatabase(scientificName)` resolves to PlantDBEntry; `COMMON_NAMES_ES` provides scientificName → ES common name. Phase 14.1 fix ensures end-to-end persistence.
- **MyPlantDetailModal display**: Phase 16 entries surface 5 EDU fields automatically once `databaseId` is persisted on saved Plants.
- **`getPlantCategories()`**: Phase 16 entries map to existing 8 PlantCategory values; no new category creation.
- **Smoke runner integration**: `scripts/phase16-smoke.cjs` exposed via `npm run smoke:phase16`; per-task `<verify><automated>` blocks invoke it.
- **Genus-prefix collision risk**: bambu-suerte (Dracaena sanderiana), sansevieria-cilindrica (Dracaena angolensis), and existing sansevieria all share Dracaena genus after taxonomic reclassification. Smoke runner must assert each species-qualified scientificName routes to its own entry id (not first-match collateral).

</code_context>

<specifics>
## Specific Ideas

- "Mixed trepadora set: 2 beginner staples + 2 trending" — potus + filodendro + hoya kerrii + mini-monstera. Distinct from existing hiedra/costilla-adan (Monstera adansonii).
- "Hoya = kerrii (lucky heart)" not Hoya carnosa — more giftable/trending, single-leaf gift-plant context resonates.
- "Botanically accurate outdoor flag" — eucalipto/agave/nopal/cactus-san-pedro = `outdoor:true`; rest = `false`. Strelitzia stays interior (compact pot framing).
- "Mirror Phase 15 patterns wherever applicable" — sub-batch by sub-typology, voseo discipline, char-limit, smoke runner shape, defer images, ≤2 aliases.
- "Lithops gets its own custom whyRationale" — mesemb family + leaf-replacement cycle + summer dormancy. Generic succulent copy will mislead.
- "sansevieria-cilindrica routing must be smoke-asserted distinct from existing sansevieria" — Dracaena genus collision risk after taxonomic reclass.

</specifics>

<deferred>
## Deferred Ideas

- **Catalog Wave C (Phase 17)** — 14 more entries (exterior + aromáticas + frutales). Out of Phase 16 scope.
- **Pet toxicity field (Phase 19)** — `petToxicity` will be added to all 120 entries (after all 3 catalog waves). Phase 16 doesn't need to populate.
- **Image upload tooling** — automated CC0 image search + upload pipeline. Future tooling phase.
- **Image upload for the existing accepted-known list** — pre-existing 38-entry backlog (15 v1.1 + 23 Phase 15). Milestone-end batch upload, not Phase 16 scope.
- **Browse-catalog UI** — direct picker for catalog entries instead of PlantNet identification flow. Future v1.2 or v1.3 phase.
- **PlantNet exhaustive alias coverage** — wait for Phase 12 unknown-plants tracker data; address in future micro-phase if signal warrants.
- **Cactus-san-pedro ethnobotanical context** — explicitly out of scope. App is plant-care, not ethnobotany.
- **Bambu-suerte water-culture mode** — special `waterMode: 'water-culture'` enum value. Out of scope; use `'fixed'` + copy-level documentation for now.
- **Strelitzia nicolai (giant) variant** — Phase 16 covers the compact reginae context. Giant variant may merit separate entry in a future phase if user demand emerges.

</deferred>

---

*Phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending*
*Context gathered: 2026-05-07*
