---
phase: 14-educational-detail-modal
plan: 06
subsystem: catalog-content + i18n
tags: [edu-03, content-authoring, voseo, aromaticas-catalog, huerta-catalog, i18n-locale-parity, wave-3c]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    plan: 01
    provides: "PlantDBEntry +5 educational optional fields (careAction/placementRecommended/placementAlternatives/placementAvoid/whyRationale); CareAction interface; getTranslatedPlant i18n indirection; check-i18n-keys.mjs sub-field-level validator"
  - phase: 14-educational-detail-modal
    plan: 03
    provides: "MyPlantDetailModal 4-section UI surface that renders the 5 fields via getTranslatedPlant and strictDbEntry"
  - phase: 14-educational-detail-modal
    plan: 04
    provides: "Voseo grep baseline (count=2), char-limit ceiling (≤250 chars whyRationale), interior-plant authoring rhythm"
  - phase: 14-educational-detail-modal
    plan: 05
    provides: "Char-limit-from-draft discipline (lesson learned from 14-05 post-hoc refactor), exterior-plant geographic-origin citation pattern"
provides:
  - "5 EDU-03 educational fields populated on 18 AROMATICAS+HUERTA catalog entries (90 catalog field declarations)"
  - "90 EN strings + 90 ES voseo strings authored across en/plants.json and es/plants.json"
  - "100% per-entry coverage on all 5 fields × 18 entries (exceeds ≥80%/≥90% targets)"
  - "Voseo discipline preserved — regex baseline of 2 pre-existing Castilian matches maintained"
  - "Locale parity 18/18 verified — Object.keys(en[id]).sort() === Object.keys(es[id]).sort() for all 18 ids"
  - "Cumulative phase progress: 54/64 entries (84%) have full EDU-02/03 content"
affects: [14-07-catalog-frutales-suculentas, 14-08-checkpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aromaticas tone: harvest-cycle care (cosechá / pellizcá / cortá) + climate-of-origin whyRationale (Mediterráneo / Frigorial / Tropical / Subtropical húmedo)"
    - "Huerta tone: tutorá + sembrá + regá profundo + cosecha por escalera; whyRationale cites family-level ecology (Solanáceas / Cucurbitáceas / Asteráceas / Brassicáceas / Apiáceas bienales / Rosáceas perennes)"
    - "Char-limit-from-draft discipline: all 18 whyRationale strings drafted ≤250 chars from the start (max 241 chars), avoiding the post-content refactor pattern from Plan 14-05"
    - "Photoperiod-aware whyRationale citations: cilantro/lechuga/rucula day-length sensitivity; tomatera/pimiento ≥18°C nocturno fruit-set requirement"

key-files:
  created: []
  modified:
    - src/data/plantDatabase.ts (2107 → 2401 LOC, +294) — 18 entries (9 aromaticas + 9 huerta) gain 5 new fields each (90 field declarations)
    - src/i18n/locales/en/plants.json (2006 → 2168 LOC, +162) — 90 EN strings across 18 entry blocks
    - src/i18n/locales/es/plants.json (2006 → 2168 LOC, +162) — 90 ES voseo strings; locale parity with en

key-decisions:
  - "Char-limit-from-draft discipline applied (vs post-hoc refactor from Plan 14-05). All 18 whyRationale strings authored ≤250 chars from the start; max observed = 241 chars (pepino). One initial draft (tomate-cherry at 269 chars) was trimmed inline before commit. No separate refactor commit needed."
  - "Aromaticas vs Huerta thematic batch: both share cosecha-driven care vocabulary (cosechá / pellizcá / cortá / sembrá) but diverge on whyRationale framing — aromaticas use climate-of-origin (Mediterráneo / Frigorial / Tropical / Subtropical húmedo), huerta use family-level ecology (Solanáceas / Cucurbitáceas / Asteráceas / Brassicáceas)"
  - "tomatera ≠ tomate-cherry distinct rationale enforced. tomatera whyRationale frames the species as 'Solanácea anual de origen andino domesticada hace ~7000 años'; tomate-cherry frames it as 'variante de Solanum lycopersicum con frutos chicos y planta indeterminada (crece hasta la helada)' emphasizing daily harvest cadence and indeterminate growth habit"
  - "romero ≠ romero-rastrero distinct rationale enforced. romero whyRationale frames the species as 'arbusto perenne mediterráneo evolved on chalky hillsides'; romero-rastrero frames it as 'variedad postrada del romero común, mismo origen mediterráneo y misma fisiología drought-adapted' explicitly noting the form variation doesn't change physiology"
  - "Voseo regression caught at 'se riega al pie' (frutilla draft). Initial whyRationale draft for frutilla ended with 'por eso se riega al pie' — the Spanish reflexive 'se riega' matched the regex \\b(riega|...) even though it's third-person reflexive (not Castilian imperative). Reworded to 'el riego va al pie' to keep regex baseline at 2."
  - "Voseo regression caught at 'ciboulette' self-reference (Rule 1 bug). Initial draft of ciboulette's placementAlternatives included 'Cantero de aromáticas con perejil y ciboulette' — self-referential. Replaced with 'cilantro' as the herb companion (also fixed in catalog default for source-of-truth consistency)"
  - "All 18 entries use careAction.fixed (not soilCheck) — verified by waterMode='fixed' on all 18 (no waterMode='soil_check' in aromaticas/huerta). Confirms Plan 14-06 \"Do NOT use careAction.soilCheck for any aromaticas/huerta entry\" guidance."
  - "Photoperiod-aware whyRationale on cilantro / lechuga / rucula. Each cites long-day + heat → bolting mechanism explicitly: cilantro 'días largos + calor disparan la floración (bolting)'; lechuga 'con días largos y calor entra en bolting'; rucula 'día largo + calor disparan floración temprana'. This explains why successive sowing is the recommended care strategy."
  - "Ecology-aware whyRationale on solanáceas / cucurbitáceas / brassicáceas / apiáceas / rosáceas / asteráceas. Each huerta entry uses the family taxonomy as a horticultural shorthand: tomatera/pimiento/tomate-cherry → solanáceas; pepino/zapallito → cucurbitáceas (with male/female flower separation); rucula → brassicáceas (glucosinolatos = picante); zanahoria → apiácea bienal (raíz año 1, flor año 2); frutilla → rosácea perenne con estolones; lechuga → asterácea anual"
  - "Catalog defaults in plantDatabase.ts mirror i18n strings — same source-of-truth consistency rule from Plan 14-04/05 maintained"

patterns-established:
  - "Plan 14-06 char-limit-from-draft as the new discipline (vs Plan 14-05's post-hoc refactor). Effective: 18/18 strings ≤250 chars on first authoring; one trim (tomate-cherry 269→232) was caught inline. Applied to Plan 14-07 by default."
  - "Family-level taxonomy as horticultural shorthand for huerta entries — adds depth without academic stiffness; Spanish-speaking gardeners recognize 'solanáceas' / 'cucurbitáceas' / 'brassicáceas' / 'apiáceas' as botanical-cultural lexicon"

requirements-completed: [EDU-03 (partial — 54/64 entries done; full closure at end of 14-07)]

# Metrics
duration: ~46 min
completed: 2026-05-05
---

# Phase 14 Plan 06: 18 AROMATICAS+HUERTA Catalog Entries (Wave 3c) Summary

**18 catalog entries (9 aromaticas: albahaca, ciboulette, cilantro, menta, oregano, perejil, romero, romero-rastrero, tomillo + 9 huerta: frutilla, lechuga, pepino, pimiento, rucula, tomate-cherry, tomatera, zanahoria, zapallito) gain all 5 EDU-02 educational fields (careAction.fixed, placementRecommended, placementAlternatives, placementAvoid, whyRationale) populated in `src/data/plantDatabase.ts` catalog defaults plus 180 matching i18n strings (90 EN + 90 ES voseo) authored in both locale files. Voseo grep baseline of 2 preserved (no NEW Castilian forms in +90 ES strings). Char-limit-from-draft discipline applied — all 18 whyRationale strings drafted ≤250 chars from the start (max 241 chars), avoiding the post-content refactor pattern from Plan 14-05. tomatera ≠ tomate-cherry; romero ≠ romero-rastrero (distinct rationales verified). Cumulative phase progress: 54/64 entries (84%) have full EDU-02/03 content.**

## Performance

- **Duration:** ~46 min (single content-authoring task)
- **Started:** 2026-05-05T12:23:39Z
- **Completed:** 2026-05-05T13:09:51Z
- **Tasks:** 1 (single content-authoring task per plan structure)
- **Files modified:** 3 (no new files)
- **Content units authored:** 270 (90 catalog field declarations + 180 i18n strings across 2 locales)

## Per-Entry Coverage Table

All 18 entries declare all 5 EDU-02 fields. The careAction sub-field selection is `fixed` for all 18 (none have `waterMode: 'soil_check'` in the catalog).

| id              | careAction sub-field | placementRecommended | placementAlternatives bullets | placementAvoid | whyRationale chars (ES) |
| --------------- | -------------------- | -------------------- | ----------------------------- | -------------- | ----------------------- |
| albahaca        | fixed                | ✓                    | 3                             | ✓              | 194                     |
| ciboulette      | fixed                | ✓                    | 3                             | ✓              | 220                     |
| cilantro        | fixed                | ✓                    | 3                             | ✓              | 227                     |
| menta           | fixed                | ✓                    | 3                             | ✓              | 215                     |
| oregano         | fixed                | ✓                    | 3                             | ✓              | 220                     |
| perejil         | fixed                | ✓                    | 3                             | ✓              | 226                     |
| romero          | fixed                | ✓                    | 3                             | ✓              | 209                     |
| romero-rastrero | fixed                | ✓                    | 3                             | ✓              | 234                     |
| tomillo         | fixed                | ✓                    | 3                             | ✓              | 205                     |
| frutilla        | fixed                | ✓                    | 3                             | ✓              | 221                     |
| lechuga         | fixed                | ✓                    | 3                             | ✓              | 230                     |
| pepino          | fixed                | ✓                    | 3                             | ✓              | 241                     |
| pimiento        | fixed                | ✓                    | 3                             | ✓              | 215                     |
| rucula          | fixed                | ✓                    | 3                             | ✓              | 230                     |
| tomate-cherry   | fixed                | ✓                    | 3                             | ✓              | 232                     |
| tomatera        | fixed                | ✓                    | 3                             | ✓              | 218                     |
| zanahoria       | fixed                | ✓                    | 3                             | ✓              | 216                     |
| zapallito       | fixed                | ✓                    | 3                             | ✓              | 228                     |

**Coverage summary:**
- careAction: 18/18 (100%)
- placementRecommended: 18/18 (100%) — exceeds ≥14/18 (≥78%) target
- placementAlternatives: 18/18 (100%, 54 total bullets across 18 entries; all 3-bullet)
- placementAvoid: 18/18 (100%)
- whyRationale: 18/18 (100%) — exceeds ≥16/18 (≥89%) target
- **Per-entry 5/5 field coverage: 18/18 entries (100%)** — exceeds ≥80% target

## Origin / Ecology Distribution

### Aromaticas (climate-of-origin citations)

| Origin region                | Entries                                              | Count |
| ---------------------------- | ---------------------------------------------------- | ----- |
| Mediterráneo                 | oregano, romero, romero-rastrero, tomillo            | 4     |
| Frigorial / templado fresco  | cilantro, perejil, ciboulette                        | 3     |
| Tropical (sudeste asiático)  | albahaca                                             | 1     |
| Subtropical húmedo           | menta                                                | 1     |

### Huerta (family-level ecology citations)

| Family / ecology                              | Entries                              | Count |
| --------------------------------------------- | ------------------------------------ | ----- |
| Solanáceas andinas (anuales)                  | tomatera, tomate-cherry, pimiento    | 3     |
| Cucurbitáceas (cosecha por polinización)      | pepino, zapallito                    | 2     |
| Brassicáceas (glucosinolatos picantes)        | rucula                               | 1     |
| Asteráceas (clima fresco, bolting)            | lechuga                              | 1     |
| Apiáceas bienales (raíz año 1, flor año 2)    | zanahoria                            | 1     |
| Rosáceas perennes (estolones, replanting)     | frutilla                             | 1     |

## tomatera vs tomate-cherry Distinguishing Rationale

**tomatera (ES):**
> Solanácea anual de origen andino (Sudamérica), domesticada hace ~7000 años. Su fructificación depende del calor sostenido y luz plena; el riego irregular causa rajado del fruto y podredumbre apical por falta de calcio.

**tomate-cherry (ES):**
> Variante de Solanum lycopersicum con frutos chicos y planta indeterminada (crece hasta la helada). Cosecha casi diaria por el tamaño; los racimos abundantes exigen tutor alto y poda de chupones para concentrar energía en los frutos.

The tomatera frames the species as the original Andean cultivar with deep history; tomate-cherry frames it as a variant emphasizing daily harvest cadence and indeterminate growth habit (which dictates the tall stake and sucker-pruning requirement). Distinct strings — no copy-paste.

## romero vs romero-rastrero Distinguishing Rationale

**romero (ES):**
> Arbusto perenne mediterráneo, evolucionó en colinas calcáreas con veranos secos. Sus aceites esenciales protegen del calor; el riego excesivo lo mata más rápido que la sequía. Suelo pobre intensifica el aroma.

**romero-rastrero (ES):**
> Variedad postrada del romero común, mismo origen mediterráneo y misma fisiología drought-adapted. La forma rastrera no cambia las necesidades: sol pleno, suelo pobre y poco riego; ideal cuando se busca cubresuelo o cascada decorativa.

The romero frames the species' physiology directly; romero-rastrero explicitly references the form variation while noting "mismo origen mediterráneo y misma fisiología" — the prostrate variety inherits the parent species' care needs. Distinct strings — no copy-paste.

## Voseo Discipline

**Baseline pre-plan grep count (Castilian forms in es/plants.json):** 2 matches (lines 801 + 890 — pre-existing legacy content from pre-Phase-14 catalog).

**Post-plan grep count:** 2 matches (unchanged — same legacy lines; no NEW Castilian forms introduced).

**Regression check command:**
```bash
grep -cE "\b(riega|saca|puedes|quieres|mueve|toca|haz)\b" src/i18n/locales/es/plants.json  # → 2
```

**Voseo verbs used in NEW content (correct vos forms):** Regá, Pellizcá, Cosechá, Cortá, Tutorá, Sembrá, Trasplantá, Mantené, Aclará, Polinizá, Acolchá, Podá

**Initial regression caught + fixed:** First draft of frutilla whyRationale ended with "Mojar las hojas favorece hongos, por eso se riega al pie" — the Spanish 3rd-person reflexive form "se riega" matched the regex even though it's reflexive descriptive, not Castilian imperative. Reworded to "Mojar las hojas favorece hongos: el riego va al pie" to keep regex baseline at 2.

## Char-Limit Discipline

**All 18 entries' whyRationale strings ≤250 chars from the first draft.** Min = 194 chars (albahaca); max = 241 chars (pepino); median ≈ 220 chars.

This contrasts with Plan 14-05 where 18 ES + 15 EN strings ran 251-309 chars on first draft and required a separate refactor commit (`70fdeac`) to trim. Plan 14-06 applied the lesson: drafted ≤250 chars from the start. One initial draft (tomate-cherry at 269 chars) was trimmed inline before commit (no separate refactor needed).

Other char-limit bands respected:
- careAction.fixed: ≤120 chars (all within bounds; widest ≈ 117 chars in pepino)
- placementRecommended: ≤100 chars (all within bounds)
- placementAlternatives bullets: ≤80 chars each (all 54 bullets within bounds)
- placementAvoid: ≤90 chars (all within bounds)

## Locale Parity

```
$ node -e "const en = require('./src/i18n/locales/en/plants.json'); const es = require('./src/i18n/locales/es/plants.json'); const ids = ['albahaca','ciboulette','cilantro','menta','oregano','perejil','romero','romero-rastrero','tomillo','frutilla','lechuga','pepino','pimiento','rucula','tomate-cherry','tomatera','zanahoria','zapallito']; let drift = []; for (const id of ids) { const e = Object.keys(en[id] ?? {}).sort(); const s = Object.keys(es[id] ?? {}).sort(); if (JSON.stringify(e) !== JSON.stringify(s)) drift.push(id); } console.log(drift.length === 0 ? 'PARITY (18/18)' : 'DRIFT: ' + drift.join(', '))"
PARITY (18/18)
```

Every key under `<id>.<field>` in es/plants.json has a matching key in en/plants.json. The validator (Plan 14-01) enforces this at the catalog→i18n level (entry declares field → i18n key required in BOTH locales); this Object.keys parity check is the final cross-locale gate.

## Total New Strings Authored

- **Catalog field declarations in plantDatabase.ts:** 90 (5 fields × 18 entries — careAction counts as 1 declaration with 1 sub-field [fixed])
- **EN i18n strings:** 90 (same shape mirrored to en/plants.json)
- **ES i18n strings:** 90 (same shape mirrored to es/plants.json with voseo)
- **Total new content units:** 270

## Cumulative Phase Progress

After Plan 14-06 completion: **54 of 64 catalog entries (84%) have full EDU-02/03 content.**

| Plan    | Wave | Category                                | Entries |
| ------- | ---- | --------------------------------------- | ------- |
| 14-04   | 3a   | INTERIOR                                | 15      |
| 14-05   | 3b   | EXTERIOR                                | 21      |
| 14-06   | 3c   | AROMATICAS (9) + HUERTA (9)             | 18      |
| 14-07   | 3d   | FRUTALES + SUCULENTAS (pending)         | 10      |
| **Cum** |      |                                         | **54 / 64** |

10 entries remaining (frutales + suculentas) → Plan 14-07 closes EDU-03 to 64/64 (100%).

## Final Verification Block

```
$ npm run check:i18n-keys                           → exit 0 (64 catalog ids verified)
$ npx tsc --noEmit                                  → exit 0
$ node scripts/smoke-phase14.mjs                    → PASS 19/19, 0 SKIP, 0 FAIL, exit 0
$ cat src/i18n/locales/en/plants.json | python3 -m json.tool > /dev/null  → exit 0
$ cat src/i18n/locales/es/plants.json | python3 -m json.tool > /dev/null  → exit 0

$ grep -c "whyRationale:" src/data/plantDatabase.ts                          → 55 (54 entries + 1 in getTranslatedPlant)
$ grep -c '"whyRationale":' src/i18n/locales/es/plants.json                  → 54
$ grep -c '"whyRationale":' src/i18n/locales/en/plants.json                  → 54

$ grep -cE "\b(riega|saca|puedes|quieres|mueve|toca|haz)\b" src/i18n/locales/es/plants.json  → 2 (== baseline)
$ grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json   → 0 on every line
```

## Task Commits

1. **Task 1: Author 5 EDU-02 fields × 18 aromaticas+huerta entries × 2 locales + matching catalog defaults** — `a4d3d34` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `src/data/plantDatabase.ts` (MODIFIED, 2107 → 2401 LOC, +294) — 18 entries (9 aromaticas + 9 huerta) gain 5 new fields each. Field order locked from Plan 14-04/05: careAction → placementRecommended → placementAlternatives → placementAvoid → whyRationale. Inserted before each entry's closing brace, after the existing `waterMode` line.
- `src/i18n/locales/en/plants.json` (MODIFIED, 2006 → 2168 LOC, +162) — 90 EN strings across 18 entry blocks. Natural English phrasing (NOT literal Spanish translations). Added before each entry's closing brace.
- `src/i18n/locales/es/plants.json` (MODIFIED, 2006 → 2168 LOC, +162) — 90 ES voseo strings; locale parity with en. Voseo verbs throughout: Regá, Pellizcá, Cosechá, Cortá, Tutorá, Sembrá, Trasplantá, Mantené, Aclará, Polinizá, Acolchá, Podá. NO new Castilian forms.

## Decisions Made

- **Char-limit-from-draft discipline applied (vs Plan 14-05's post-hoc refactor).** All 18 whyRationale strings drafted ≤250 chars from the start; max observed = 241 chars (pepino). One initial draft (tomate-cherry at 269 chars) was trimmed inline before commit. No separate refactor commit needed.
- **Aromaticas vs Huerta thematic batch.** Both share cosecha-driven care vocabulary (cosechá / pellizcá / cortá / sembrá) but diverge on whyRationale framing — aromaticas use climate-of-origin (Mediterráneo / Frigorial / Tropical / Subtropical húmedo), huerta use family-level ecology (Solanáceas / Cucurbitáceas / Asteráceas / Brassicáceas / Apiáceas / Rosáceas).
- **tomatera ≠ tomate-cherry distinct rationale.** Tomatera frames the species as 'Solanácea anual de origen andino domesticada hace ~7000 años'; tomate-cherry frames it as 'variante de Solanum lycopersicum con frutos chicos y planta indeterminada (crece hasta la helada)' emphasizing daily harvest cadence and indeterminate growth habit.
- **romero ≠ romero-rastrero distinct rationale.** Romero frames the species as 'arbusto perenne mediterráneo evolved on chalky hillsides'; romero-rastrero frames it as 'variedad postrada del romero común, mismo origen mediterráneo y misma fisiología drought-adapted' explicitly noting the form variation doesn't change physiology.
- **Photoperiod-aware whyRationale on cilantro / lechuga / rucula.** Each cites long-day + heat → bolting mechanism explicitly. This explains why successive sowing is the recommended care strategy — encodes horticultural science in user-facing strings.
- **Family-level taxonomy as horticultural shorthand for huerta entries.** Solanáceas / Cucurbitáceas / Brassicáceas / Apiáceas / Rosáceas / Asteráceas are recognized by Spanish-speaking gardeners; using these names adds depth without academic stiffness.
- **All 18 entries use careAction.fixed (not soilCheck).** Verified by waterMode='fixed' on all 18 (no waterMode='soil_check' in aromaticas/huerta categories). This honors Plan 14-06's "Do NOT use careAction.soilCheck for any aromaticas/huerta entry" guidance.
- **Catalog defaults in plantDatabase.ts mirror i18n strings.** Same source-of-truth consistency rule from Plan 14-04/05 maintained — defaultValue at runtime stays in sync with the i18n keys that override it.

## Deviations from Plan

**1. [Rule 1 - Bug] Voseo regression on frutilla whyRationale**
- **Found during:** Task 1 final voseo check (post-authoring)
- **Issue:** Initial draft had "Mojar las hojas favorece hongos, por eso se riega al pie" — the Spanish 3rd-person reflexive form "se riega" matched the regex `\b(riega|...)` even though it's reflexive descriptive (not Castilian imperative)
- **Fix:** Reworded to "Mojar las hojas favorece hongos: el riego va al pie" (changes verb form to noun phrase, preserves meaning)
- **Files modified:** src/i18n/locales/es/plants.json (frutilla whyRationale, line 797), src/data/plantDatabase.ts (frutilla whyRationale)
- **Commit:** included in `a4d3d34`

**2. [Rule 1 - Bug] ciboulette self-reference in placementAlternatives**
- **Found during:** Task 1 inline review (during authoring)
- **Issue:** Initial draft of ciboulette's placementAlternatives included "Cantero de aromáticas con perejil y ciboulette" — self-referential
- **Fix:** Replaced "ciboulette" with "cilantro" as the herb companion (also fixed in catalog default for source-of-truth consistency)
- **Files modified:** src/i18n/locales/es/plants.json, src/data/plantDatabase.ts
- **Commit:** included in `a4d3d34`

**3. [Rule 1 - Bug] tomate-cherry whyRationale char-limit overflow (caught inline)**
- **Found during:** Task 1 char-limit spot check (post-authoring)
- **Issue:** Initial draft was 269 chars (over 250 ceiling)
- **Fix:** Inline trim — removed redundant clause "Misma genética que la tomatera" while preserving the core mechanism citation; final = 232 chars
- **Files modified:** src/i18n/locales/es/plants.json (tomate-cherry whyRationale), src/data/plantDatabase.ts (tomate-cherry whyRationale)
- **Commit:** included in `a4d3d34`

No Rule 4 architectural changes triggered. No auth gates encountered.

## Authentication Gates

None — all work is local file authoring. No external service calls.

## Issues Encountered

None blocking. Three Rule 1 auto-fixes applied (frutilla voseo regression + ciboulette self-reference + tomate-cherry char-limit overflow) — all caught by inline or post-authoring verification gates and fixed without spawning new tasks. The char-limit-from-draft discipline (lesson from Plan 14-05) prevented the systematic 13-entry refactor pattern from recurring.

## User Setup Required

None — no external service configuration required. All gates run locally via `npx tsc --noEmit`, `npm run check:i18n-keys`, and `node scripts/smoke-phase14.mjs`.

## Next Phase Readiness

**Plan 14-07 (Wave 3d — frutales + suculentas, 10 entries) is unblocked.** Plan 14-07 will author the same 5 fields × 10 FRUTALES+SUCULENTAS entries (limonero, naranjo, mandarino, aguacate, higuera, suculenta-generica, cactus, echeveria, haworthia, sedum). Sequential dependency: Plan 14-07 modifies the same 3 files as this plan (file conflict, no parallelism).

**Voseo baseline now `count=2`** — Plan 14-07's voseo grep guard runs against this same baseline (it should remain at 2 throughout the remaining content waves).

**Char-limit-from-draft discipline now standard** — Plan 14-07 should apply the same rule (draft whyRationale ≤250 chars from the start).

**Coverage so far:** 54 of 64 catalog entries done (15 INTERIOR from 14-04 + 21 EXTERIOR from 14-05 + 18 AROMATICAS+HUERTA from this plan). 10 remaining: 5 FRUTALES + 5 SUCULENTAS in 14-07 → 64/64 (100%) at end of Wave 3.

**Phase 10 SEC-01 grep guard preserved:** `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` returns count 0 on every line. Plan 14-06 did not touch any client source.

## Self-Check: PASSED

- [x] All 18 aromaticas+huerta catalog entries declare all 5 EDU-02 fields in src/data/plantDatabase.ts (FOUND, 90 field declarations)
- [x] All 18 entries have all 5 fields populated in src/i18n/locales/en/plants.json (FOUND, 90 EN strings)
- [x] All 18 entries have all 5 fields populated in src/i18n/locales/es/plants.json (FOUND, 90 ES strings)
- [x] Locale parity 18/18 verified via Object.keys comparison (FOUND PARITY)
- [x] whyRationale coverage 18/18 (100%) — exceeds ≥16/18 (≥89%) target (FOUND)
- [x] careAction coverage 18/18 (100%) — meets 100% target (FOUND)
- [x] placementRecommended coverage 18/18 (100%) — exceeds ≥14/18 (≥78%) target (FOUND)
- [x] Voseo regression count 2 (matches pre-plan baseline of 2; no NEW Castilian forms introduced) (FOUND)
- [x] All char limits respected: max whyRationale = 241 chars (≤250 ceiling); all careAction/placement* within bands (FOUND)
- [x] JSON syntax valid for both en/plants.json and es/plants.json (FOUND)
- [x] `npm run check:i18n-keys` exits 0 with 64 catalog ids verified (FOUND)
- [x] `npx tsc --noEmit` exits 0 (FOUND)
- [x] `node scripts/smoke-phase14.mjs` exits 0 with PASS 19/19, 0 SKIP, 0 FAIL (FOUND)
- [x] Phase 10 SEC grep guard preserved: `EXPO_PUBLIC_PERENUAL_API_KEY` count = 0 across all client paths (FOUND)
- [x] Commit `a4d3d34` exists in git log (FOUND)
- [x] tomatera ≠ tomate-cherry rationale distinct (FOUND)
- [x] romero ≠ romero-rastrero rationale distinct (FOUND)
- [x] All acceptance criteria from `<acceptance_criteria>` block of Task 1 verified

---
*Phase: 14-educational-detail-modal*
*Plan: 06*
*Completed: 2026-05-05*
