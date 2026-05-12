# Phase 11: Perenual Data Quality - Research

**Researched:** 2026-05-02
**Domain:** Perenual API response shape, USDA hardiness zone semantics, server-side validation, TypeScript client-side parsing
**Confidence:** MEDIUM-HIGH (Perenual docs verified via official site; hardiness semantics from USDA/Wikipedia; smoke runner pattern from existing source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- DATA-01 `isGoodMatch(query, result)` validator lives SERVER-SIDE in `supabase/functions/get-plant-care/index.ts`. Runs AFTER search step (`/species-list`) and BEFORE details fetch (`/species/details/:id`). On mismatch returns `{ data: null }` (status 200). On match proceeds to details fetch.
- DATA-02 `parseHardiness()` improvements live CLIENT-SIDE in `src/services/plantKnowledgeService.ts` (lines ~258-288). Reads `hardiness.max`; category fallbacks when missing: indoor tropical 32, succulent/cactus 40, templada 35, fría 28.
- DATA-03 humidity inference lives CLIENT-SIDE in `convertPerenualToKnowledge` at `src/services/plantKnowledgeService.ts` (lines ~168-201). Rules: `araceae`/tropical → `'alta'`; `cactaceae`/`crassulaceae`/succulent/cactus → `'baja'`; default → `'media'`.
- `PerenualPlantDetail` interface gains `family?: string` and `type?: string` in BOTH the edge function file (`supabase/functions/get-plant-care/index.ts` lines ~20-44) and the client service file (`src/services/plantKnowledgeService.ts` lines ~26-39). Same plan/commit.
- Validator uses bidirectional `lowercase().includes(...)` overlap between query and `common_name`/`scientific_name`. No word-boundary tightening unless DATA-04 shows false-positive caching.
- Edge function envelope shape UNCHANGED: `{ data: PerenualPlantDetail | null }` (Phase 10 lock).
- Status 200 for all client-facing responses including mismatch (same as "no plants found" branch).
- Edge function redeploy required: plan explicit `autonomous: false` checkpoint mirroring Phase 10.

### Claude's Discretion
- Validator strictness exact behavior: trust the spec verbatim — bidirectional includes.
- Category classifier field priority for fallbacks (DATA-02) and humidity (DATA-03): `plant.family` first (exact lowercase match), then `plant.type` (substring match), then default.
- Test fixture 5 species selection (DATA-04): planner picks at planning time.
- Smoke runner: extend existing `typescript.transpileModule` harness (new `scripts/smoke-phase11.mjs`) for parser unit tests. Edge function validator verified manually post-deploy.
- Deploy checkpoint mirrors Phase 10 `autonomous: false` pattern.

### Deferred Ideas (OUT OF SCOPE)
- Re-enriching existing `plant_knowledge` cache rows with `tempMax = 35 / humidity = null` — accepted silent degradation.
- Validator tightening (word-boundary, accent strip, Levenshtein) — revisit only if DATA-04 shows false-positive caching.
- Server-side migration of `parseHardiness` + `convertPerenualToKnowledge` — Phase 11 keeps them client-side.
- TRACK-01..03 unknown plant tracking — Phase 12.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Edge function adds `isGoodMatch(query, result)` validator — bidirectional `lowercase().includes(...)` overlap between query and `common_name`/`scientific_name`; failed match returns `null` (no garbage cached) | Validator runs at line ~115 of edge function, between plants[0] extraction and details fetch. Both fields available in species-list payload. |
| DATA-02 | `parseHardiness()` reads `hardiness.max` (USDA zone → °C mapping) when present; falls back per category: indoor tropical 32, succulent/cactus 40, templada 35, fría 28 | `hardiness.max` format confirmed as bare integer string (e.g., `"10"`). Zone→tempMax mapping table required. Existing `[^0-9]` strip already handles this format. |
| DATA-03 | `convertPerenualToKnowledge()` infers `humidity` from `plant.family` and `plant.type`: `araceae`/tropical → `'alta'`; `cactaceae`/`crassulaceae`/succulent/cactus → `'baja'`; default → `'media'` | `family` and `type` confirmed in `/species/details/:id` response. `family` also in species-list but `type` is details-only. Both fields available when `convertPerenualToKnowledge` runs (called after details fetch). |
| DATA-04 | Identifying a plant not in the curated catalog produces enriched data with `tempMax ≠ 35` and `humidity ≠ null` in ≥80% of cases (verified via test fixture of 5 known species) | 5 fixture species selected below with rationale. Smoke runner pattern documented. |
</phase_requirements>

---

## Summary

Phase 11 adds a server-side mismatch guard and two client-side parsing improvements to the Perenual data pipeline established in Phase 10. The edge function (`get-plant-care/index.ts`) gets a 3-line `isGoodMatch` validator inserted between the search step and the details fetch — rejecting bad search results before they traverse the wire. The client service (`plantKnowledgeService.ts`) gets two targeted improvements: `parseHardiness()` now reads `hardiness.max` to produce a real `tempMax` instead of hardcoding 35, and `convertPerenualToKnowledge()` infers `humidity` from `plant.family`/`plant.type` instead of always returning `null`.

The Perenual `/species/details/:id` response has been verified to include both `family` (e.g., `"Araceae"`) and `type` (e.g., `"tree"`) fields. The `/species-list` response includes `family` but NOT `type` or `hardiness` — this is architecturally important: `isGoodMatch` runs against the search-list payload which has `common_name`, `scientific_name`, and `family`, but `type` and `hardiness` are only available after the details fetch. The humidity classifier and `parseHardiness` category fallbacks that use `type` therefore correctly live in `convertPerenualToKnowledge` (post-details fetch), not in the validator.

USDA hardiness zones define **minimum** cold tolerance, not maximum heat tolerance. `hardiness.max` represents the warmest zone where a plant still thrives (upper zone boundary for cold-dormancy needs). For `tempMax` derivation, this must be interpreted as a heat-tolerance proxy via an inverse mapping: higher zone → more tropical → higher `tempMax`. The planner must define a separate `zoneToTempMax` table distinct from the existing `zoneToTemp` (min) table.

**Primary recommendation:** Follow CONTEXT.md exactly. Schema expansion in both files same commit; validator at line ~115 of edge function; `parseHardiness` and `convertPerenualToKnowledge` changes in the client service. Smoke runner follows `smoke-phase09.mjs` pattern with `ts.transpileModule`.

---

## Perenual API Response Shape (Verified)

### `/species-list` endpoint — fields available to `isGoodMatch`

The search step returns `searchData.data[]` where each item contains:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `id` | number | `1` | Used for details fetch |
| `common_name` | string | `"European Silver Fir"` | Available for validator |
| `scientific_name` | string[] | `["Abies alba"]` | Available for validator |
| `other_name` | string[] | `[]` | Available but not used by validator |
| `family` | string\|null | `"Pinaceae"` | Available in list; null for some species |
| `default_image` | object\|null | — | Available |
| `watering` | string | `"Minimum"` | Available |
| `sunlight` | string[] | `["full sun"]` | Available |

**Confirmed NOT in species-list:** `type`, `hardiness`, `indoor`, `description`, `care_level`, `maintenance`

Source: Official Perenual docs page (perenual.com/docs/api) — MEDIUM confidence; backed by GitHub community projects

### `/species/details/:id` endpoint — full payload for `convertPerenualToKnowledge`

All species-list fields PLUS:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `type` | string\|null | `"tree"`, `"Flower"`, `"herb"` | Only in details. Key for DATA-03/DATA-02 fallback. |
| `family` | string\|null | `"Araceae"`, `"Cactaceae"` | Also in details (redundant with list) |
| `hardiness` | object\|null | `{ "min": "7", "max": "11" }` | Only in details. Zone numbers as bare strings. |
| `indoor` | boolean\|null | `true` | Available for fallback classifier |
| `description` | string\|null | — | Available |
| `care_level` | string\|null | `"Medium"` | Available |
| `maintenance` | string\|null | `"Low"` | Stored as `care_tips` |
| `watering_general_benchmark` | object\|null | `{ value: "1", unit: "week" }` | Available |

Source: Official Perenual docs (perenual.com/docs/api), corroborated by Backyarder-BE GitHub project — MEDIUM confidence

---

## USDA Hardiness Zone Formats and Semantics

### `hardiness.max` format

Confirmed format: **bare integer string** with no subzone suffix.

Examples from Perenual: `"7"`, `"10"`, `"11"`, `"13"`

The existing `replace(/[^0-9]/g, '')` in `parseHardiness` correctly handles this. No variants like `"9a"`, `"USDA 9"`, or `"Zone 9"` appear in Perenual responses.

**Confidence:** MEDIUM — verified via official Perenual docs page showing example `"min": "7", "max": "7"`; Backyarder-BE shows `{"min": "3", "max": "8"}`.

### Semantic interpretation (critical for DATA-02)

USDA hardiness zones define **minimum cold tolerance**, not maximum heat tolerance:

- Zone 1 = min temp −45°C (arctic)
- Zone 13 = min temp +10°C (tropical)
- `hardiness.min` = coldest zone the plant survives → maps to `tempMin`
- `hardiness.max` = warmest zone where the plant still thrives (can need cold dormancy above this)

For `tempMax` derivation from `hardiness.max`, a separate inverse mapping is needed. Rationale: plants rated to zone 11 (tropical min +5°C) tolerate more heat than plants rated to zone 7 (temperate min −15°C). The DATA-02 spec confirms this intent by naming the category fallbacks as "indoor tropical 32" and "succulent/cactus 40" — these are heat tolerance maxima, not cold minima.

### Proposed `zoneToTempMax` mapping (for planner to use verbatim)

| Zone | tempMax (°C) | Rationale |
|------|-------------|-----------|
| 1–4 | 25 | Cold-only perennials, need frost; can't thrive in heat |
| 5–6 | 28 | Cool/fría category (matches DATA-02 fallback 28) |
| 7–8 | 32 | Temperate; matches DATA-02 indoor tropical fallback 32 |
| 9 | 35 | Templada; matches existing default and DATA-02 fallback 35 |
| 10 | 38 | Subtropical |
| 11 | 40 | Tropical/succulento; matches DATA-02 succulent fallback 40 |
| 12–13 | 40 | Full tropical — same ceiling as zone 11 |

This table intentionally aligns zone 11+ with the succulent/cactus fallback (40°C) since desert species are rated to high zones AND tolerate extreme heat. Zones 7–8 align with indoor tropical fallback (32°C). Default when `hardiness.max` missing falls through to category classifier.

**Confidence:** MEDIUM (derived from USDA zone definitions + DATA-02 fallback values as anchors; no official source maps zones to heat maxima because USDA doesn't define heat tolerance)

---

## Architecture Patterns

### Validator Placement in Edge Function

The `isGoodMatch` function inserts at line ~115, replacing the current direct assignment:

```typescript
// Current (line 115):
const plant = plants[0];

// Phase 11 replacement:
const plant = plants[0];
if (!isGoodMatch(body.plantName, plant)) {
  console.log(`[get-plant-care] Mismatch: query="${body.plantName}" vs result="${plant.common_name}" / "${plant.scientific_name?.[0]}"`);
  return new Response(
    JSON.stringify({ data: null }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
// Then proceeds to details fetch at line ~118
```

### `isGoodMatch` Implementation Pattern

```typescript
// Server-side in get-plant-care/index.ts
function isGoodMatch(query: string, result: { common_name: string; scientific_name: string[] }): boolean {
  const q = query.toLowerCase();
  const cn = (result.common_name || '').toLowerCase();
  const sn = (result.scientific_name?.[0] || '').toLowerCase();
  // Bidirectional: query includes result name OR result name includes query
  return cn.includes(q) || q.includes(cn) || sn.includes(q) || q.includes(sn);
}
```

Source: DATA-01 spec in REQUIREMENTS.md — HIGH confidence (requirements-locked)

### Category Classifier Decision Tree (DATA-02 + DATA-03)

For classifying a Perenual details payload into a category when `hardiness.max` is missing or for humidity:

```
1. Check plant.family?.toLowerCase():
   - Matches "araceae"                      → tropical (tempMax=32, humidity='alta')
   - Matches "cactaceae" or "crassulaceae"  → succulent (tempMax=40, humidity='baja')
   - Matches "bromeliaceae" or "orchidaceae"→ tropical (tempMax=32, humidity='alta')

2. If no family match, check plant.type?.toLowerCase():
   - Contains "succulent" or "cactus"       → succulent (tempMax=40, humidity='baja')
   - Contains "tropical"                    → tropical (tempMax=32, humidity='alta')
   - Contains "fern" or "moss"              → tropical (tempMax=30, humidity='alta')

3. If no type match, check plant.indoor:
   - indoor === true                        → tempMax=32, humidity='media' (generic indoor)

4. Default:
   - tempMax=35, humidity='media'
```

**Confidence:** MEDIUM — family names verified against known Perenual docs; decision order matches CONTEXT.md spec

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript compilation in smoke runner | Custom TS parser | `typescript.transpileModule` (already used in all phase smoke runners) | Phase 4 single-compile-path policy lock |
| Zone→temp mapping table | Dynamic lookup API | Static inline table (already pattern in codebase) | Perenual zones are stable USDA standard zones 1-13 |
| Fuzzy name matching in validator | Levenshtein/edit-distance | `toLowerCase().includes()` bidirectional | DATA-01 explicitly locks this simpler approach |

---

## Common Pitfalls

### Pitfall 1: `type` field not available in species-list payload
**What goes wrong:** `isGoodMatch` or the validator tries to read `plant.type` from the search result. `type` is undefined (not in species-list). TypeScript won't catch this because `PerenualPlantDetail` is used for the search result but species-list items lack most detail fields.
**Why it happens:** The validator runs against `plants[0]` from the search step, not the details step.
**How to avoid:** Validator uses only `common_name` and `scientific_name` (both confirmed in species-list). `family` is also available in the list but is NOT needed by the validator.
**Warning signs:** `plant.type` returns `undefined` in validator; classifier accidentally called in validator context.

### Pitfall 2: `hardiness.max` used to derive `tempMin` instead of `tempMax`
**What goes wrong:** The existing `zoneToTemp` table maps zone numbers to **minimum** temperatures (negative Celsius values). If `hardiness.max` zone is looked up in `zoneToTemp`, you get a cold minimum, not a heat maximum.
**Why it happens:** Re-using the existing table for both `min` and `max` seems logical but is semantically wrong.
**How to avoid:** Introduce a separate `zoneToTempMax` lookup (see mapping table above). The two tables are unrelated conceptually.
**Warning signs:** `tempMax` comes out negative (e.g., zone 9 → zoneToTemp["9"] = -5°C, not the expected ~35°C).

### Pitfall 3: Schema expansion drift between edge function and client service
**What goes wrong:** `family` and `type` are added to `PerenualPlantDetail` in the client file but not the edge function (or vice versa). TypeScript strict mode won't error on optional fields that are missing from the interface, but the deployed edge function will return the fields without them being typed in the client.
**Why it happens:** Two separate files that mirror the same interface declaration.
**How to avoid:** CONTEXT.md locks this: both files updated in the same plan/commit. Smoke runner can assert the field names appear in both source files via grep.
**Warning signs:** `plant.family` returns `undefined` at runtime even though Perenual sends it; TypeScript shows no error (optional field).

### Pitfall 4: Cache contamination from pre-Phase-11 rows (deferred but flagged)
**What goes wrong:** Existing `plant_knowledge` rows with `humidity = null` and `temp_max_c = 35` will not benefit from Phase 11 improvements because they were cached before the fix. New identifications get correct values; old ones stay stale.
**Why it happens:** Cache-first lookup hits the stale row; API is never called again for that plant.
**How to avoid:** Per CONTEXT.md, this is explicitly accepted ("Estamos en testing"). No action needed in Phase 11. Flag in CLAUDE.md as known behavior for post-testing cleanup.
**Warning signs:** Manual test with a previously-cached plant shows old values. Solution: clear the `plant_knowledge` row in Supabase dashboard to force re-fetch.

### Pitfall 5: Mocked vs live Perenual differences in smoke runner
**What goes wrong:** Smoke runner tests `parseHardiness` and `convertPerenualToKnowledge` with mock payloads that have clean, well-formed fields. Live Perenual responses sometimes return `null` for `family`, empty `type` string, or missing `hardiness` entirely.
**Why it happens:** Perenual data quality varies by species; less common plants have sparse metadata.
**How to avoid:** Include a `null`/`undefined` case in every smoke runner assertion group. Test `parseHardiness(undefined)` and `convertPerenualToKnowledge({ family: null, type: '' })` explicitly.
**Warning signs:** Smoke passes but post-deploy manual test shows fallback values for well-known species.

### Pitfall 6: Edge function logs not surfacing in `__DEV__`
**What goes wrong:** Developer adds `console.log` for mismatch debugging in the edge function, then looks for it in Expo/Metro logs. It never appears because edge function logs go to Supabase Functions logs, not the mobile client.
**How to avoid:** Check Supabase Dashboard → Edge Functions → `get-plant-care` → Logs. The existing `[get-plant-care]` prefix pattern makes filtering easy.
**Warning signs:** No mismatch log appears after manual test; developer assumes validator is not running.

---

## Test Fixture (DATA-04) — 5 Species Selection

Constraints: ≥3 distinct families, ≥1 tropical (should yield `humidity='alta'`), ≥1 cactus/succulent (should yield `humidity='baja'`), ≥1 temperate flowering (should yield `humidity='media'`). All must be known to Perenual with reliable `hardiness` data.

| # | Scientific Name | Common Name | Family | Expected humidity | Expected tempMax | DATA-02 path | DATA-03 path |
|---|----------------|-------------|--------|-------------------|-----------------|--------------|--------------|
| 1 | Monstera deliciosa | Monstera | Araceae | `alta` | 32 (fallback: tropical, likely no `hardiness.max`) | category fallback | family match "araceae" |
| 2 | Echinopsis pachanoi | Cactus San Pedro | Cactaceae | `baja` | 40 (zone 9-11 OR category fallback) | zone 9-11 → 38-40; or fallback 40 | family match "cactaceae" |
| 3 | Rosa canina | Rosehip / Rosa silvestre | Rosaceae | `media` | 28-35 (zone 5-9 → 28-35) | zone 5 → 28 or zone 9 → 35 | no family/type match → default |
| 4 | Phalaenopsis amabilis | Orquídea mariposa | Orchidaceae | `alta` | 32 (fallback: tropical/alta, likely zone 10-12) | zone 10 → 38; OR category fallback 32 | family match "orchidaceae" → tropical |
| 5 | Aloe vera | Aloe Vera | Asphodelaceae | `baja` | 38-40 (zone 9-11 → 38-40) | zone 9-11 → 38-40 | type match "succulent" OR family "asphodelaceae" |

**Success threshold:** ≥4/5 cases must show `tempMax ≠ 35 AND humidity ≠ null` post-Phase-11 (≥80%).

**Rationale for each:**
- **Monstera deliciosa** — Araceae family, iconic tropical, widely in Perenual catalog, tests `family` path cleanly.
- **Echinopsis pachanoi** — Cactaceae, commonly found in LATAM app context, tests both `family` and zone-based `tempMax`.
- **Rosa canina** — Rosaceae (distinct family), temperate, widely known, tests default humidity path and zone-based `tempMax`.
- **Phalaenopsis amabilis** — Orchidaceae, tropical humidity via family, tests `orchidaceae`→`alta` path.
- **Aloe vera** — Asphodelaceae; `type: "succulent"` path since family "asphodelaceae" is not in the primary classifier; tests `type` substring fallback for both humidity and `tempMax`.

**Edge: Aloe vera family note:** Aloe vera is classified as Asphodelaceae in Perenual (not Aloeaceae or Cactaceae). The `baja` humidity result must come from `type` substring match on `"succulent"` — this makes it an important test for the `type` fallback path. If Perenual returns `type: "succulent"` for Aloe, the test validates the type-path. If not, the fallback defaults to `media`/35 and this species would not contribute to the ≥80% threshold.

---

## False-Positive Collision Risk for `isGoodMatch`

Bidirectional `includes()` with short strings creates substring collision risk. These pairs should be covered by the smoke runner fixture or documented for human review:

| Query | Perenual result | Collision type | Outcome |
|-------|----------------|----------------|---------|
| `"rose"` | `"rosemary"` (Salvia rosmarinus) | query included in result name | FALSE POSITIVE — match incorrectly passes |
| `"sage"` | `"sagebrush"` (Artemisia tridentata) | query included in result name | FALSE POSITIVE |
| `"palm"` | `"pampas grass"` | query included in result name | FALSE POSITIVE (3-char prefix) — unlikely but possible |
| `"mint"` | `"peppermint"` | result name includes query | FALSE POSITIVE |
| `"cactus san pedro"` | `"San Pedro cactus"` (scientific: Echinopsis) | bidirectional match works correctly | TRUE POSITIVE |

**Risk assessment:** Per CONTEXT.md, validator tightening is deferred. The planner should note these pairs in the PLAN as known limitations. If DATA-04 post-deploy test shows "rosemary" cached when user said "rose", that triggers the follow-up tightening phase.

**Smoke coverage:** Include a `false-positive-check` assertion group in the smoke runner testing `isGoodMatch("rose", { common_name: "rosemary", scientific_name: ["Salvia rosmarinus"] })` returns the expected value (per spec: `true`, which is a known acceptable limitation). This documents the behavior rather than failing on it.

---

## Smoke Runner Integration

### Existing harness location and pattern

| File | Phase | Pattern | What it tests |
|------|-------|---------|---------------|
| `scripts/migration-smoke-test.mjs` | 4-5 | `ts.transpileModule` | Migration functions, seasonality |
| `scripts/smoke-phase08.mjs` | 8 | `ts.transpileModule` | Plant database, getCatalogEntry |
| `scripts/smoke-phase09.mjs` | 9 | Source grep + pure JS logic | Diagnosis modal, paywall |
| `scripts/smoke-phase11.mjs` (NEW) | 11 | `ts.transpileModule` | `parseHardiness`, `convertPerenualToKnowledge`, `isGoodMatch` |

### How to add Phase 11 tests

Phase 11 smoke runner compiles `plantKnowledgeService.ts` via `ts.transpileModule` and tests exported pure functions. The `isGoodMatch` validator is a private function in the edge function — it cannot be compiled/tested via this runner directly. Instead:

1. **For `parseHardiness`:** Compile `plantKnowledgeService.ts` (with import stubs for `supabase`, `database` types), extract `parseHardiness` via module import, assert against known inputs.
2. **For `convertPerenualToKnowledge`:** Same compilation approach; call with mocked `PerenualPlantDetail` payloads.
3. **For `isGoodMatch`:** The function lives in Deno edge function code; cannot be run in Node. Test via source grep assertions (confirm function body present, confirm placement between search and details fetch).

### New runner skeleton (for planner reference)

```javascript
#!/usr/bin/env node
// Phase 11 Perenual data quality smoke runner. Single-compile-path policy (Phase 4 lock).
// COMPILE PATH IS LOCKED to typescript.transpileModule.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase11');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

let pass = 0, fail = 0;
const errors = [];
function assert(cond, label) {
  if (cond) { pass++; } else { fail++; errors.push(`FAIL: ${label}`); }
}
```

**Script location:** `scripts/smoke-phase11.mjs`
**Run command:** `node scripts/smoke-phase11.mjs`
**No new npm script needed** (runner is invoked directly; pattern mirrors smoke-phase08/09 which also lack dedicated npm scripts — check via `package.json` if `smoke:phase11` desired)

---

## Code Examples

### Current `parseHardiness` (lines 258-288 of plantKnowledgeService.ts)

```typescript
// CURRENT — only reads hardiness.min; tempMax always hardcoded 35
function parseHardiness(hardiness?: { min?: string; max?: string; }) {
  const zoneToTemp: Record<string, number> = {
    '1': -45, '2': -40, '3': -35, '4': -30, '5': -25,
    '6': -20, '7': -15, '8': -10, '9': -5, '10': 0, '11': 5, '12': 10, '13': 15,
  };
  let tempMin: number | null = null;
  let tempMax: number | null = 35; // <-- Phase 11 replaces this
  if (hardiness?.min) {
    const zone = hardiness.min.replace(/[^0-9]/g, '');
    tempMin = zoneToTemp[zone] ?? null;
  }
  return { tempMin, tempMax };
}
```

### Target `parseHardiness` pattern (DATA-02)

```typescript
// Phase 11 target — reads hardiness.max with separate zoneToTempMax table
// Category-based fallback is handled in convertPerenualToKnowledge (caller)
// since it requires plant.family/type which are not available here.
function parseHardiness(hardiness?: { min?: string; max?: string; }) {
  const zoneToTempMin: Record<string, number> = {
    '1': -45, '2': -40, '3': -35, '4': -30, '5': -25,
    '6': -20, '7': -15, '8': -10, '9': -5, '10': 0, '11': 5, '12': 10, '13': 15,
  };
  const zoneToTempMax: Record<string, number> = {
    '1': 25, '2': 25, '3': 25, '4': 25, '5': 28,
    '6': 28, '7': 32, '8': 32, '9': 35, '10': 38, '11': 40, '12': 40, '13': 40,
  };
  let tempMin: number | null = null;
  let tempMax: number | null = null; // null = caller will apply category fallback
  if (hardiness?.min) {
    const zone = hardiness.min.replace(/[^0-9]/g, '');
    tempMin = zoneToTempMin[zone] ?? null;
  }
  if (hardiness?.max) {
    const zone = hardiness.max.replace(/[^0-9]/g, '');
    tempMax = zoneToTempMax[zone] ?? null;
  }
  return { tempMin, tempMax };
}
```

**Key change:** `tempMax` now returns `null` when no zone is available (instead of hardcoded 35). The caller `convertPerenualToKnowledge` applies the category fallback: `tempMax ?? classifyTempMaxFallback(plant)`.

### Humidity inference pattern (DATA-03)

```typescript
// In convertPerenualToKnowledge, after parseHardiness call:
function inferHumidity(plant: PerenualPlantDetail): HumidityLevel {
  const family = (plant.family || '').toLowerCase();
  const type = (plant.type || '').toLowerCase();

  if (family.includes('araceae') || family.includes('orchidaceae')
      || family.includes('bromeliaceae') || type.includes('tropical')
      || type.includes('fern')) {
    return 'alta';
  }
  if (family.includes('cactaceae') || family.includes('crassulaceae')
      || type.includes('cactus') || type.includes('succulent')) {
    return 'baja';
  }
  return 'media';
}
```

### Interface expansion (both files)

```typescript
// In supabase/functions/get-plant-care/index.ts (line ~20-44):
interface PerenualPlantDetail {
  // ... existing fields ...
  family?: string;   // ADD: taxonomic family (e.g., "Araceae", "Cactaceae")
  type?: string;     // ADD: plant type (e.g., "tree", "Flower", "succulent")
}

// In src/services/plantKnowledgeService.ts (line ~26-39):
interface PerenualPlantDetail extends PerenualPlant {
  // ... existing fields ...
  family?: string;   // ADD: same field, same optionality
  type?: string;     // ADD: same field, same optionality
}
```

---

## State of the Art

| Old Approach | Current Approach (Phase 11) | Impact |
|--------------|----------------------------|--------|
| `tempMax` always 35 | Derived from `hardiness.max` zone; category fallback when missing | Plants identified via Perenual now get meaningful heat thresholds |
| `humidity: null` always | Inferred from `plant.family` + `plant.type` | Tropical plants get `'alta'`, succulents get `'baja'` |
| No result validation | `isGoodMatch` rejects search mismatches before caching | Garbage names (e.g., "Ficus benjamina" returned when querying "ficus") are filtered |
| `PerenualPlantDetail` omits `family`/`type` | Both fields declared as optional in both interface locations | Client-side classifier and planner tests can use typed access |

---

## Open Questions

1. **Aloe vera `type` field from Perenual**
   - What we know: Aloe vera (Asphodelaceae) is a succulent. Perenual should return `type: "succulent"` but this is unverified for this specific species.
   - What's unclear: If Perenual returns `type: "grass"` or another non-succulent type, the humidity classifier defaults to `'media'` and Aloe vera does not contribute to the ≥80% threshold.
   - Recommendation: Include this species in the fixture but document the dependency on `type` in the test assertion comments. If post-deploy verification shows `humidity: 'media'` for Aloe, replace with Echeveria (Crassulaceae) which has a reliable family match.

2. **`hardiness.max` null frequency**
   - What we know: Perenual provides `hardiness` for most well-known species.
   - What's unclear: What percentage of Perenual search results for typical user-submitted plant names have `null` or missing `hardiness`?
   - Recommendation: The category fallback handles this case; the post-deploy fixture test (DATA-04) will reveal frequency. If ≥2/5 fixture species have `hardiness: null`, category fallbacks need to be rock-solid.

3. **`family` null in species-list vs details**
   - What we know: `family` is in the species-list payload (per official docs) but may be null for some entries.
   - What's unclear: Whether `family` is more reliably populated in the details payload.
   - Recommendation: The humidity classifier reads from the details payload, where `family` should be more complete. The validator at line ~115 doesn't use `family` at all, so this only affects DATA-03.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No test framework — `typescript.transpileModule` single-compile-path smoke runner (Phase 4 policy lock) |
| Config file | none — runner is a standalone `.mjs` script |
| Quick run command | `node scripts/smoke-phase11.mjs` |
| Full suite command | `node scripts/smoke-phase11.mjs && npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | `isGoodMatch` returns `true` for exact name, `true` for substring, `false` for unrelated | unit (pure JS in smoke) | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-01 | `isGoodMatch` placement: after search, before details fetch | structural (source grep in smoke) | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-01 | Edge function returns `{ data: null }` on mismatch | integration (manual post-deploy) | manual — Supabase Functions logs | N/A |
| DATA-02 | `parseHardiness({ max: "10" })` returns `tempMax: 38` | unit (compiled module in smoke) | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-02 | `parseHardiness({ max: "11" })` returns `tempMax: 40` | unit | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-02 | `parseHardiness(undefined)` returns `{ tempMin: null, tempMax: null }` | unit | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-02 | Category fallback: tropical plant missing hardiness → `tempMax: 32` | unit (mock in smoke) | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-02 | Category fallback: cactus missing hardiness → `tempMax: 40` | unit | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-03 | `family: "Araceae"` → `humidity: 'alta'` | unit (mock in smoke) | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-03 | `family: "Cactaceae"` → `humidity: 'baja'` | unit | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-03 | `family: null, type: "succulent"` → `humidity: 'baja'` | unit | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-03 | `family: "Rosaceae"` → `humidity: 'media'` (default) | unit | `node scripts/smoke-phase11.mjs` | ❌ Wave 0 |
| DATA-04 | ≥4/5 fixture species return `tempMax ≠ 35 AND humidity ≠ null` | manual | manual post-deploy with 5-species list | N/A |
| DATA-04 | TypeScript strict: `family` and `type` readable without type errors on `PerenualPlantDetail` | structural | `npm run typecheck` | N/A (always run) |

### Sampling Rate

- **Per task commit:** `node scripts/smoke-phase11.mjs`
- **Per wave merge:** `node scripts/smoke-phase11.mjs && npm run typecheck`
- **Phase gate:** Full suite green + manual 5-species fixture verification before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/smoke-phase11.mjs` — covers DATA-01 structural, DATA-02 unit, DATA-03 unit (≥12 assertions)
- [ ] Smoke runner import stubs: `scripts/.tmp-phase11/supabase.mjs` (mock `supabase.functions.invoke`), `scripts/.tmp-phase11/database.mjs` (empty types export)

No new test framework install needed. Pattern identical to `smoke-phase09.mjs` (source grep) and `smoke-phase08.mjs` (ts.transpileModule import).

---

## Sources

### Primary (HIGH confidence)
- Official Perenual API docs (perenual.com/docs/api) — response shape for `/species-list` and `/species/details/:id`, `family`/`type`/`hardiness` field presence, `hardiness.max` format as bare integer string
- `supabase/functions/get-plant-care/index.ts` (project source) — exact line numbers, current `PerenualPlantDetail` interface, Phase 10 envelope shape
- `src/services/plantKnowledgeService.ts` (project source) — exact `parseHardiness` and `convertPerenualToKnowledge` code, lines 258-288 and 168-201
- `scripts/smoke-phase09.mjs` + `smoke-phase08.mjs` (project source) — smoke runner pattern, `ts.transpileModule` single-compile-path policy
- `.planning/REQUIREMENTS.md` §"Perenual Data Quality (DATA)" — DATA-01..04 locked requirements

### Secondary (MEDIUM confidence)
- Perenual API docs page (perenual.com/docs/api) showing `{ "min": "7", "max": "7" }` hardiness example format
- Backyarder-BE GitHub project — corroborates `type` and `hardiness` in species-list/details responses; shows `{"min": "3", "max": "8"}` format
- USDA Plant Hardiness Zone Map (planthardiness.ars.usda.gov) — zone definitions as minimum cold tolerance; zones 1-13 minimum temperature ranges
- Wikipedia "Hardiness zone" — confirms USDA zones are based on minimum temperatures, not maximum

### Tertiary (LOW confidence)
- Web search result summary claiming `type` appears in species-list — NOT confirmed by official docs; secondary source shows it only in details. Treat `type` as details-only until proven otherwise.

---

## Metadata

**Confidence breakdown:**
- Perenual API field availability: MEDIUM — official docs confirmed `family` + `type` in details; `family` in list; `type` absent from list per community project evidence
- `hardiness.max` format: MEDIUM — confirmed bare integer string from official docs example
- Zone→tempMax mapping: MEDIUM (derived, no official source maps USDA zones to heat tolerance)
- Smoke runner pattern: HIGH — verified directly from existing project files
- Validator placement: HIGH — line numbers verified from Phase 10 source

**Research date:** 2026-05-02
**Valid until:** 2026-07-01 (stable: Perenual API shape changes infrequently; USDA zones are permanent)
