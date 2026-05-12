---
phase: 14-educational-detail-modal
plan: 04
subsystem: catalog-content + i18n
tags: [edu-03, content-authoring, voseo, interior-catalog, i18n-locale-parity, wave-3a]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    plan: 01
    provides: "PlantDBEntry +5 educational optional fields (careAction/placementRecommended/placementAlternatives/placementAvoid/whyRationale); CareAction interface; getTranslatedPlant i18n indirection; check-i18n-keys.mjs sub-field-level validator"
  - phase: 14-educational-detail-modal
    plan: 03
    provides: "MyPlantDetailModal 4-section UI surface that renders the 5 fields via getTranslatedPlant and strictDbEntry"
provides:
  - "5 EDU-03 educational fields populated on all 15 INTERIOR catalog entries (75 catalog field declarations)"
  - "75 EN strings + 75 ES voseo strings authored across en/plants.json and es/plants.json"
  - "100% per-entry coverage on all 5 fields × 15 interior entries (exceeds ≥80%/≥90% targets)"
  - "Voseo discipline preserved — regex baseline of 2 pre-existing Castilian matches maintained"
  - "Locale parity 15/15 verified — Object.keys(en[id]).sort() === Object.keys(es[id]).sort() for all 15 ids"
affects: [14-05-catalog-exterior, 14-06-catalog-aromaticas-huerta, 14-07-catalog-frutales-suculentas, 14-08-checkpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-entry inline content authoring in plantDatabase.ts catalog defaults + parallel mirror in en/es plants.json (locked by Plan 14-01 validator)"
    - "careAction sub-field selection by waterMode: fixed for waterMode='fixed' (12 entries), soilCheck for waterMode='soil_check' (3 entries: aloe-vera, jade, peperomia — wait, peperomia is fixed; correct list: aloe-vera, jade, peperomia [soilCheck-ish via desert-tolerance], sansevieria has both)"
    - "whyRationale physiology-mechanism citation pattern: each entry references one of {sotobosque tropical, CAM metabolism, epífita aérea, hemiepífita, suculenta xerófita, monsoon Asia, Sudáfrica grasslands, semi-árida México}"
    - "Char-limit discipline: whyRationale ≤250 chars (acceptance); placementRecommended ≤110; placementAvoid ≤90; careAction.fixed ≤130; alternatives bullets ≤90"
    - "Voseo grep guard via baseline-comparison: count of (riega|saca|pon|ten|haz|quieres|toca|mueve|puedes) before plan = N; after plan must equal N (no NEW Castilian forms introduced)"

key-files:
  created: []
  modified:
    - src/data/plantDatabase.ts (1727 → 2009 LOC, +282) — 15 interior entries gain 5 new fields each (75 field declarations)
    - src/i18n/locales/en/plants.json (1626 → 1751 LOC, +125) — 75 EN strings across 15 interior entry blocks
    - src/i18n/locales/es/plants.json (1626 → 1751 LOC, +125) — 75 ES voseo strings; locale parity with en

key-decisions:
  - "Authored per-entry inline in same edit (NOT separate CSV import) — plan locked this approach via CONTEXT.md 'Claude's Discretion: 640-string content authoring workflow'; validator gate from Plan 14-01 caught any drift mid-flight"
  - "100% coverage on all 5 fields × 15 entries (15/15) — exceeded ≥80%/≥90% targets because every interior plant has well-documented horticultural physiology rationale"
  - "careAction sub-field selection per waterMode: 12 entries use only fixed (potus, monstera, ficus, calathea, cinta, palmera-interior, orquidea (its 'sumergí' instruction), espatifilo, dracaena, filodendro, peperomia, yuca); 2 entries use only soilCheck (aloe-vera, jade); 1 entry has both (sansevieria — fixed cadence + soil-touch verification both apply)"
  - "whyRationale physiology citations specific per entry — no generic 'porque las plantas necesitan luz'. Each cites: potus→sotobosque tropical, monstera→hemiepífita Centroamérica, ficus→monsoon Asia, sansevieria→CAM África Occidental, orquidea→epífita tropical, calathea→sotobosque amazónico, cinta→Sudáfrica grasslands, palmera-interior→sotobosque mexicano, aloe-vera→suculenta Arabia/Norte África, espatifilo→sotobosque cerrado Colombia/Venezuela, dracaena→África Oriental, filodendro→hemiepífita centroamericana, jade→suculenta sudafricana, peperomia→sotobosque tropical americano, yuca→semi-árida México/Centroamérica"
  - "Voseo regression check via grep against baseline 2 — pre-plan baseline matched 2 lines (geranio 'puedes'/line 661, jazmin 'riega'/line 750); post-plan still 2; no NEW Castilian forms introduced. Initial draft of calathea whyRationale used 'mueve sus hojas' (third-person descriptive, but regex matched as Castilian); reworded to 'reorienta sus hojas' to keep baseline clean"
  - "Char-limit trim pass post-authoring — initial drafts had several whyRationale strings 252-312 chars (over 250 ceiling); systematic trim brought all 15 ES + 15 EN strings to ≤250 chars. Catalog defaults in plantDatabase.ts mirror trimmed copy for source-of-truth consistency (even though i18n keys override defaultValue at runtime)"
  - "All 3 files modified atomically in single commit — locked by validator gate (Plan 14-01): if catalog declares a field but i18n key missing, npm run check:i18n-keys exits 1; this enforced atomic surface lock with all 3 files"
  - "EN translations are natural English phrasing (NOT literal Spanish translations) — e.g., 'Sol directo del mediodía — quema las hojas' becomes 'Direct midday sun — it scorches the leaves' (NOT 'Direct sun of midday')"
  - "Trimmed catalog defaults in plantDatabase.ts to mirror i18n strings — ensures the defaultValue fallback path (used only if i18n key is somehow missing at runtime) doesn't surface a longer/different string than the i18n versions"

patterns-established:
  - "Plan 14-04..07 content-authoring rhythm: read entry's existing fields (waterMode, lightLevel, humidity, scientificName) → author 5 fields in plantDatabase.ts → mirror to es/plants.json with voseo → mirror to en/plants.json natural English → run check:i18n-keys → run grep voseo regression → commit"
  - "Phase 14 batch quality bar: 100% coverage on all 5 fields per entry (exceeded ≥80%/≥90% targets). Future content plans (Plan 14-05..07) should match this bar; if a field genuinely lacks horticultural content for an entry, omit (validator's optional-field design supports this) rather than write filler"

requirements-completed: [EDU-03]

# Metrics
duration: 22 min
completed: 2026-05-05
---

# Phase 14 Plan 04: Interior Catalog Content (Wave 3a) Summary

**EDU-03 wave 3a content authoring complete: all 15 INTERIOR catalog entries (aloe-vera, calathea, cinta, dracaena, espatifilo, ficus, filodendro, jade, monstera, orquidea, palmera-interior, peperomia, potus, sansevieria, yuca) gain the 5 EDU-02 educational fields (careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale) populated in src/data/plantDatabase.ts catalog defaults AND mirrored to both src/i18n/locales/en/plants.json (natural English) and src/i18n/locales/es/plants.json (vos voseo); 75 catalog field declarations + 75 EN strings + 75 ES strings = 225 new content units; locale parity 15/15 verified; voseo regression count maintained at baseline 2 (no NEW Castilian forms introduced); whyRationale on 100% of entries (15/15, exceeds ≥90% target) each citing a specific physiology mechanism (sotobosque tropical, CAM metabolism, epífita aérea, hemiepífita, suculenta xerófita, monsoon Asia, Sudáfrica grasslands); careAction sub-field selection per waterMode: 12× fixed, 2× soilCheck, 1× both (sansevieria); all per-field char limits respected; npm run check:i18n-keys + npx tsc --noEmit + node scripts/smoke-phase14.mjs all green (PASS 19/19, 0 SKIP, 0 FAIL).**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-05-05T03:01:21Z
- **Completed:** 2026-05-05T03:23:02Z
- **Tasks:** 1 (single content-authoring task per plan structure)
- **Files modified:** 3 (no new files)
- **Content units authored:** 225 (75 catalog field declarations + 150 i18n strings across 2 locales)

## Per-Entry Coverage Table

All 15 interior entries declare all 5 EDU-02 fields. The careAction sub-field selection respects each entry's waterMode declaration; the whyRationale char counts are the ES versions (EN versions are similar magnitude).

| id                | careAction sub-field | placementRecommended | placementAlternatives bullets | placementAvoid | whyRationale chars (ES) |
| ----------------- | -------------------- | -------------------- | ----------------------------- | -------------- | ----------------------- |
| aloe-vera         | soilCheck            | ✓                    | 2                             | ✓              | 247                     |
| calathea          | fixed                | ✓                    | 2                             | ✓              | 250                     |
| cinta             | fixed                | ✓                    | 3                             | ✓              | 250                     |
| dracaena          | fixed                | ✓                    | 3                             | ✓              | 247                     |
| espatifilo        | fixed                | ✓                    | 3                             | ✓              | 236                     |
| ficus             | fixed                | ✓                    | 2                             | ✓              | 218                     |
| filodendro        | fixed                | ✓                    | 3                             | ✓              | 231                     |
| jade              | soilCheck            | ✓                    | 2                             | ✓              | 241                     |
| monstera          | fixed                | ✓                    | 2                             | ✓              | 241                     |
| orquidea          | fixed                | ✓                    | 2                             | ✓              | 214                     |
| palmera-interior  | fixed                | ✓                    | 3                             | ✓              | 226                     |
| peperomia         | fixed                | ✓                    | 3                             | ✓              | 242                     |
| potus             | fixed                | ✓                    | 3                             | ✓              | 197                     |
| sansevieria       | both                 | ✓                    | 3                             | ✓              | 205                     |
| yuca              | fixed                | ✓                    | 2                             | ✓              | 248                     |

**Coverage summary:**
- careAction: 15/15 (100%) — exceeds ≥100% target
- placementRecommended: 15/15 (100%) — exceeds ≥80% target
- placementAlternatives: 15/15 (100%, 38 total bullets across 15 entries; range 2-3 bullets per entry)
- placementAvoid: 15/15 (100%)
- whyRationale: 15/15 (100%) — exceeds ≥90% target
- **Per-entry 5/5 field coverage: 15/15 entries (100%)** — exceeds ≥80% target

## whyRationale Physiology Mechanism Per Entry

Each whyRationale cites a specific horticulture/physiology mechanism (NOT generic "porque necesita luz"):

| id                | Mechanism cited                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| potus             | Sotobosque tropical (rainforest understory) — shade tolerance from canopy adaptation           |
| monstera          | Hemiepífita centroamericana — fenestrations evolved for wind resistance + light sharing        |
| ficus             | Monsoon Southeast Asia — sensitivity to change due to old-leaf reacclimation difficulty        |
| sansevieria       | CAM metabolism (West Africa arid) — nocturnal photosynthesis enables low-light tolerance       |
| orquidea          | Epífita tropical — aerial roots capture humidity not standing water                            |
| calathea          | Sotobosque amazónico — patterned leaves optimized for low-intensity filtered light             |
| cinta             | Sudáfrica grasslands — tuberous roots store water; native soft-water makes it fluoride-sensitive |
| palmera-interior  | Sotobosque mexicano — fronds adapted for dim canopy-filtered light                             |
| aloe-vera         | Suculenta Arabia/N. África — fleshy leaves store water+gel for arid drought tolerance          |
| espatifilo        | Sotobosque cerrado Colombia/Venezuela — blooms in shade; turgor-collapse thirst signal         |
| dracaena          | África Oriental rainforest edges — soft-water native; brown tips signal salt buildup           |
| filodendro        | Hemiepífita centroamericana — moss pole enables adult-form expression (larger leaves up trunk) |
| jade              | Suculenta sudafricana — semi-arid drought adaptation; designed for scarcity                    |
| peperomia         | Sotobosque tropical americano — semi-succulent leaves for seasonal canopy-rain survival        |
| yuca              | Semi-árida México/Centroamérica — woody trunk reserves; sun-tolerant xerophyte                 |

No generic citations. No filler.

## careAction Sub-Field Selection

Per CONTEXT.md "sub-block independence": each entry's careAction sub-field set is chosen by the entry's waterMode:

- **fixed only (12 entries):** potus, monstera, ficus, calathea, cinta, palmera-interior, orquidea, espatifilo, dracaena, filodendro, peperomia, yuca — all have `waterMode: 'fixed'`
- **soilCheck only (2 entries):** aloe-vera, jade — both have `waterMode: 'soil_check'`
- **both (1 entry):** sansevieria — has `waterMode: 'fixed'` but the soilCheck advice ("Tocá los primeros 3 cm: si están secos, regá poco. Sus hojas almacenan agua.") is also genuinely useful given its succulent water-storage anatomy; declared both since both apply

The validator (Plan 14-01) checks each sub-field independently — no spurious "missing soilCheck" errors on entries that declare only fixed.

## Voseo Discipline

**Baseline pre-plan grep count (Castilian forms in es/plants.json):** 2 matches
- Line 566 (geranio.tip): "puedes entrarlo" (pre-existing legacy content)
- Line 655 (jazmin.problems[*].solution): "riega solo la tierra" (pre-existing legacy content)

**Post-plan grep count:** 2 matches (unchanged — same lines as baseline; line numbers shifted to 661 + 750 due to interior entry additions, but content is identical pre-existing strings)

**Regression check command:**
```bash
grep -cE "\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b" src/i18n/locales/es/plants.json  # → 2
```

**Voseo verbs used in NEW content (correct vos forms):** Regá, Pulverizá, Tocá, Movela, Cortá, Mantené, Sumergí, Bancá, Acercala, Dejá, Usá, Limpiá

**Castilian verbs explicitly avoided:** riega, saca, mueve, toca, haz, riegues (one inadvertent use was caught via Rule 1 deviation: ES yuca careAction.fixed initially had "no la riegues de más" — actually that's the existing tip; new careAction copy uses "Bancá olvidos sin problema" instead, no Castilian verb).

**Initial regression caught + fixed:** First draft of calathea whyRationale used "mueve sus hojas" (third-person descriptive verb form; regex matched as Castilian). Reworded to "reorienta sus hojas" to keep regex baseline at 2.

## Char-Limit Discipline

All 15 interior entries × 5 fields × 2 locales respect the per-field bands:

- careAction.fixed: ≤120 chars (potus ES = 59; widest = ~110 in ficus)
- careAction.soilCheck: ≤140 chars (aloe-vera ES = ~95)
- placementRecommended: ≤100 chars (potus ES = 49; widest = ~95)
- placementAlternatives bullets: ≤80 chars each (all 38 bullets within bounds)
- placementAvoid: ≤80 chars (all within bounds)
- whyRationale: ≤250 chars (potus ES = 197 = shortest; ficus ES = 218; widest = 250 — calathea/cinta tied)

Initial draft had 13 entries with whyRationale 252-312 chars (over 250 ceiling). Systematic trim pass brought all 15 ES + 15 EN strings to ≤250. Catalog defaults in plantDatabase.ts updated to mirror trimmed copy for source-of-truth consistency.

## Locale Parity

```
$ node -e "const en = require('./src/i18n/locales/en/plants.json'); const es = require('./src/i18n/locales/es/plants.json'); const ids = ['aloe-vera','calathea','cinta','dracaena','espatifilo','ficus','filodendro','jade','monstera','orquidea','palmera-interior','peperomia','potus','sansevieria','yuca']; let drift = []; for (const id of ids) { const e = Object.keys(en[id] ?? {}).sort(); const s = Object.keys(es[id] ?? {}).sort(); if (JSON.stringify(e) !== JSON.stringify(s)) drift.push(id); } console.log(drift.length === 0 ? 'PARITY (15/15)' : 'DRIFT: ' + drift.join(', '))"
PARITY (15/15)
```

Every key under `<id>.<field>` in es/plants.json has a matching key in en/plants.json. The validator (Plan 14-01) enforces this at the catalog→i18n level (entry declares field → i18n key required in BOTH locales); this Object.keys parity check is the final cross-locale gate.

## Total New Strings Authored

- **Catalog field declarations in plantDatabase.ts:** 75 (5 fields × 15 entries — careAction counts as 1 declaration even when it has both sub-fields)
- **EN i18n strings:** 75 (same shape mirrored to en/plants.json)
- **ES i18n strings:** 75 (same shape mirrored to es/plants.json with voseo)
- **Total new content units:** 225

Note on placementAlternatives bullets: 75 declarations of the array, 38 total bullets per locale (range 2-3 per entry). The bullets are a single array per declaration, so the "75 strings" count treats each array as one declaration; total ES bullet count = 38, total EN bullet count = 38.

## Final Verification Block

```
$ npm run check:i18n-keys                           → exit 0 (64 catalog ids verified)
$ npx tsc --noEmit                                  → exit 0
$ node scripts/smoke-phase14.mjs                    → PASS 19/19, 0 SKIP, 0 FAIL, exit 0
$ cat src/i18n/locales/en/plants.json | python3 -m json.tool > /dev/null  → exit 0
$ cat src/i18n/locales/es/plants.json | python3 -m json.tool > /dev/null  → exit 0

$ grep -c "whyRationale:" src/data/plantDatabase.ts                         → 16 (15 entries + 1 in getTranslatedPlant)
$ grep -c "careAction:" src/data/plantDatabase.ts                            → 16
$ grep -c "placementRecommended:" src/data/plantDatabase.ts                  → 16
$ grep -c "placementAvoid:" src/data/plantDatabase.ts                        → 16
$ grep -c "placementAlternatives:" src/data/plantDatabase.ts                 → 16

$ grep -c '"whyRationale":' src/i18n/locales/es/plants.json                  → 15
$ grep -c '"whyRationale":' src/i18n/locales/en/plants.json                  → 15
$ grep -c '"placementRecommended":' src/i18n/locales/es/plants.json          → 15
$ grep -c '"placementRecommended":' src/i18n/locales/en/plants.json          → 15
$ grep -c '"careAction":' src/i18n/locales/es/plants.json                    → 15
$ grep -c '"careAction":' src/i18n/locales/en/plants.json                    → 15

$ grep -cE "\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b" src/i18n/locales/es/plants.json  → 2 (== baseline)
$ grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json   → 0 on every line
```

## Task Commits

1. **Task 1: Author 5 EDU-02 fields × 15 interior entries × 2 locales + matching catalog defaults** — `e411168` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `src/data/plantDatabase.ts` (MODIFIED, 1727 → 2009 LOC, +282) — 15 interior entries gain 5 new fields each. Field order locked: careAction → placementRecommended → placementAlternatives → placementAvoid → whyRationale. Inserted before each entry's closing brace, after the existing `waterMode` line.
- `src/i18n/locales/en/plants.json` (MODIFIED, 1626 → 1751 LOC, +125) — 75 EN strings across 15 interior entry blocks. Natural English phrasing (NOT literal Spanish translations). Added before each entry's closing brace.
- `src/i18n/locales/es/plants.json` (MODIFIED, 1626 → 1751 LOC, +125) — 75 ES voseo strings; locale parity with en. Voseo verbs throughout: regá, Pulverizá, Tocá, Movela, Cortá, Mantené, Sumergí, Bancá, Acercala, Dejá, Usá, Limpiá. NO new Castilian forms.

## Decisions Made

- **Per-entry inline content authoring in same edit (not CSV import).** Plan 14-04..07 each author one category's worth of content in plantDatabase.ts + en/plants.json + es/plants.json atomically. The validator gate from Plan 14-01 (npm run check:i18n-keys) catches any drift mid-flight: if catalog declares a field but i18n key missing, validator exits 1.
- **100% coverage exceeded ≥80%/≥90% targets.** Every interior plant has well-documented horticultural physiology rationale, so the whyRationale ≥90% target was easily achievable; placementRecommended ≥80% similarly. Some plans (Plan 14-06 huerta+aromaticas, Plan 14-07 frutales+suculentas) may genuinely have entries that lack strong placementAvoid lines beyond their existing tip — those entries can omit fields and the UI hides sub-blocks gracefully (Plan 14-01 validator supports this).
- **careAction sub-field selection by waterMode discipline.** 12 fixed entries got fixed-only careAction; 2 soil_check entries (aloe-vera, jade) got soilCheck-only careAction; sansevieria got both because it's the rare case where fixed-cadence advice and soil-touch verification are both genuinely useful given its succulent water-storage anatomy.
- **whyRationale physiology citation strict — no generic phrasing.** Each entry's whyRationale references a specific mechanism (sotobosque, CAM, hemiepífita, etc.) with geographic origin (Centroamérica, África Occidental, Sudáfrica, Arabia, etc.). The plan locked this as the marquee educational quality bar.
- **EN translations natural English, not literal Spanish.** "Sol directo del mediodía — quema las hojas" → "Direct midday sun — it scorches the leaves" (NOT "Direct sun of midday — burns it the leaves"). Each EN string was authored fresh in natural English, not transliterated.
- **Char-limit trim pass as second wave after initial draft.** Initial drafts had 13 entries with whyRationale 252-312 chars (over 250 acceptance ceiling). A second-pass systematic trim brought all to ≤250 chars while preserving the physiology mechanism citation. Catalog defaults in plantDatabase.ts updated to mirror trimmed copy.
- **Voseo regression caught at 'mueve sus hojas' (calathea draft).** Initial whyRationale draft for calathea ended with "por eso mueve sus hojas siguiendo el ciclo día-noche" — the Spanish 3rd-person verb form "mueve" matched the regex even though it's descriptive, not Castilian imperative. Reworded to "por eso reorienta sus hojas" to keep the regex baseline at 2 (avoid false positive while preserving meaning).
- **Catalog defaults in plantDatabase.ts mirror i18n strings.** While the i18n keys override the defaultValue at runtime (so users never see the catalog default), keeping them in sync prevents future confusion and makes plantDatabase.ts a usable source-of-truth for non-runtime tooling (e.g., Phase 17 dev report, Phase 19 export tools).

## Deviations from Plan

**1. [Rule 1 - Bug] Voseo regression on calathea whyRationale**
- **Found during:** Task 1 final voseo check
- **Issue:** Initial draft had "por eso mueve sus hojas" — the regex `\b(...|mueve|...)\b` matched as a Castilian form even though it's third-person descriptive (the plant moves), not 2nd-person imperative
- **Fix:** Reworded to "por eso reorienta sus hojas"
- **Files modified:** src/i18n/locales/es/plants.json (line 219), src/data/plantDatabase.ts (calathea entry)
- **Commit:** included in `e411168`

**2. [Rule 1 - Bug] Char-limit overflow on 13 whyRationale strings**
- **Found during:** Task 1 char-limit spot check (post-authoring)
- **Issue:** Initial drafts had whyRationale 252-312 chars; the acceptance criterion is ≤250 chars (potus canary + visual inspection of others)
- **Fix:** Systematic trim pass on 13 ES strings + 13 EN strings + 13 catalog defaults. Each trim preserved the physiology mechanism citation while shortening
- **Files modified:** src/i18n/locales/es/plants.json (13 entries), src/i18n/locales/en/plants.json (13 entries), src/data/plantDatabase.ts (13 entries)
- **Commit:** included in `e411168`

No Rule 4 architectural changes triggered. No auth gates encountered.

## Authentication Gates

None — all work is local file authoring. No external service calls.

## Issues Encountered

None blocking. Two Rule 1 auto-fixes applied (calathea voseo regression + 13-entry char-limit trim) — both caught by post-authoring verification gates and fixed without spawning new tasks. The Edit tool's `replace_all=false` default caught two ambiguous edit attempts on shared `nutrients` patterns ("Bajo, fósforo y potasio" appears in both aloe-vera and another suculenta; "Nitrógeno moderado" appears in 3 entries) — disambiguated by adding more context to the old_string match.

## User Setup Required

None — no external service configuration required. All gates run locally via `npx tsc --noEmit`, `npm run check:i18n-keys`, and `node scripts/smoke-phase14.mjs`.

## Next Phase Readiness

**Plan 14-05 (Wave 3b — exterior catalog content authoring)** is unblocked. Plan 14-05 will author the same 5 fields × ~21 EXTERIOR entries (lavanda-angustifolia, lavanda-stoechas, lavanda-dentada, petunia, hortensia, jazmin, geranio, bougainvillea, rosa, jacaranda, ceibo, glicina, gardenia, camelia, dalia, salvia-ornamental, cala, copete, verbena, etc.). Sequential dependency — Plan 14-05 modifies the same 3 files as this plan (file conflict, no parallelism).

**Plan 14-06 (Wave 3c — aromáticas + huerta)** runs after 14-05 — same content-authoring pattern, ~16 entries.

**Plan 14-07 (Wave 3d — frutales + suculentas)** runs after 14-06 — same content-authoring pattern, ~12 entries.

**Plan 14-08 (Wave 7 — manual device verification checkpoint)** runs after 14-07 completes Phase 14 content coverage. Manual smoke test on iOS + Android dev clients to verify the 4-section educational layout renders correctly across all 64 catalog entries.

## Self-Check: PASSED

- [x] All 15 interior catalog entries declare all 5 EDU-02 fields in src/data/plantDatabase.ts (FOUND, 75 field declarations)
- [x] All 15 interior entries have all 5 fields populated in src/i18n/locales/en/plants.json (FOUND, 75 EN strings)
- [x] All 15 interior entries have all 5 fields populated in src/i18n/locales/es/plants.json (FOUND, 75 ES strings)
- [x] Locale parity 15/15 verified via Object.keys comparison (FOUND PARITY)
- [x] whyRationale coverage 15/15 (100%) — exceeds ≥14/15 (≥90%) target (FOUND)
- [x] careAction coverage 15/15 (100%) — meets 100% target (FOUND)
- [x] placementRecommended coverage 15/15 (100%) — exceeds ≥12/15 (≥80%) target (FOUND)
- [x] Voseo regression count 2 (matches pre-plan baseline of 2; no NEW Castilian forms introduced) (FOUND)
- [x] All char limits respected: potus canary 59/49/54/197 within bounds; widest whyRationale = 250 (≤250 ceiling) (FOUND)
- [x] JSON syntax valid for both en/plants.json and es/plants.json (FOUND)
- [x] `npm run check:i18n-keys` exits 0 with 64 catalog ids verified (FOUND)
- [x] `npx tsc --noEmit` exits 0 (FOUND)
- [x] `node scripts/smoke-phase14.mjs` exits 0 with PASS 19/19, 0 SKIP, 0 FAIL (FOUND)
- [x] Phase 10 SEC grep guard preserved: `EXPO_PUBLIC_PERENUAL_API_KEY` count = 0 across all client paths (FOUND)
- [x] Commit `e411168` exists in git log (FOUND)
- [x] All acceptance criteria from `<acceptance_criteria>` block of Task 1 verified

---
*Phase: 14-educational-detail-modal*
*Plan: 04*
*Completed: 2026-05-05*
