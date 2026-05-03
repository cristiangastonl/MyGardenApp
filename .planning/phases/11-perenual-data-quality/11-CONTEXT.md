# Phase 11: Perenual Data Quality - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Perenual-enriched data accurate (`tempMax` derived from USDA zone, `humidity` inferred from family/type) and reject mismatched Perenual search results before they get cached. Phase 10 already moved the API key server-side and ships the edge function as a raw `{ data: PerenualPlantDetail | null }` passthrough. Phase 11 adds the **server-side mismatch validator** and the **client-side parsing/inference improvements** so plants identified via Perenual no longer fall back to the hardcoded `tempMax: 35` and `humidity: null`.

Locked from REQUIREMENTS.md: DATA-01, DATA-02, DATA-03, DATA-04.

**Out of scope (deferred):**
- Re-enriching existing `plant_knowledge` cache rows that already have `tempMax = 35 / humidity = null` from Phase 10's pre-fix behavior — accepted silent degradation per the testing-context principle.
- Unknown-plant tracking (TRACK-01..03) — Phase 12.
- Edge function output shape changes beyond adding `family` + `type` to the existing `PerenualPlantDetail` envelope.

</domain>

<decisions>
## Implementation Decisions

### Logic split (server vs client)

The validator runs server-side (rejects before returning); the parser and inference stay client-side (where they live today). Only the type definition expands.

- **DATA-01 `isGoodMatch(query, result)` validator → SERVER** (`supabase/functions/get-plant-care/index.ts`).
  - Runs immediately AFTER the search step (`/species-list`) and BEFORE the details fetch (`/species/details/:id`).
  - On mismatch: edge function returns `{ data: null }` (status 200 — same shape as "no plants found"). Client falls through to `getEnrichedPlantData` defaults.
  - On match: proceeds to details fetch, returns the full `PerenualPlantDetail` envelope as before.
  - Rationale: cache stays uncontaminated at the source — garbage results don't even traverse the wire to the client. Single round-trip avoided (skip the details fetch on mismatch).

- **DATA-02 `parseHardiness()` → CLIENT** (`src/services/plantKnowledgeService.ts`, lines ~258-288).
  - Improve in place: read `hardiness.max` (currently only reads `.min` and hardcodes `tempMax = 35`).
  - Apply per-category fallbacks when `hardiness.max` is missing or unparseable: indoor tropical 32, succulent/cactus 40, templada 35, fría 28.
  - Edge function stays a thin Perenual proxy — no enrichment shape changes.

- **DATA-03 humidity inference → CLIENT** (`src/services/plantKnowledgeService.ts`, in `convertPerenualToKnowledge` around line 168-201).
  - Add a humidity classifier reading `plant.family` and `plant.type` from the (expanded) raw Perenual response.
  - Rules per REQUIREMENTS: `araceae`/tropical → `'alta'`; `cactaceae`/`crassulaceae`/succulent/cactus → `'baja'`; default → `'media'`.
  - Co-located with `parseHardiness` so both Perenual-derived fields live in the same function.

### Schema expansion

- **`PerenualPlantDetail` interface gains 2 new optional fields: `family?: string` and `type?: string`** (Perenual `/species/details/:id` already returns these — currently not declared).
- **Update in BOTH locations** in the same plan:
  - `supabase/functions/get-plant-care/index.ts` — interface declaration (~line 20-44).
  - `src/services/plantKnowledgeService.ts` — `PerenualPlantDetail extends PerenualPlant` (~line 26-39).
- The edge function does NOT need to filter or transform these — Perenual returns them in the raw payload, and the type expansion just lets the client read them safely. No fetch/route change.

### Cross-cutting / Claude's Discretion (planner picks during planning)

- **Validator strictness (`isGoodMatch` exact behavior).** REQUIREMENTS.md DATA-01 locks "bidirectional `lowercase().includes(...)` overlap between query and `common_name`/`scientific_name`". Trust the spec verbatim — no word-boundary tightening unless DATA-04 fixture results show false-positive caching during verification. If tightening is needed later, that's a follow-up phase.
- **Category classifier for `parseHardiness` fallbacks (DATA-02) and humidity (DATA-03).** Field priority: check `plant.family` first (exact lowercase string match against family names), then `plant.type` (substring match against keywords), then `plant.scientific_name[0]` keyword fallback. Default to `'media'` for humidity and `35` (templada) for tempMax when nothing classifies. Planner is free to choose the exact match order — REQUIREMENTS.md gives the categories, not the discriminator order.
- **Test fixture composition (DATA-04).** Planner picks 5 species at planning time. Constraints: must cover ≥3 distinct families spanning the per-category fallback rules (one tropical, one cactus/succulent, one temperate flowering minimum) and use scientific names Perenual is known to return. Asserts `tempMax ≠ 35 AND humidity !== null` in ≥4/5 cases (≥80%).
- **Smoke runner.** Existing v1.1 single-compile-path smoke pattern (`typescript.transpileModule`) covers the client-side changes. Edge function validator is verified manually post-deploy with the test fixture (no Deno test framework in scope). Planner may add a unit test of `parseHardiness` + `convertPerenualToKnowledge` against mocked Perenual responses to the smoke harness.
- **Edge function deploy checkpoint.** Mirror Phase 10 precedent: validator change requires a redeploy of `get-plant-care`. Plan an explicit `autonomous: false` checkpoint task — user runs `source .envrc && supabase functions deploy get-plant-care`, replies "deployed", planner continues.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — edge function deploy commands, Supabase secrets pattern, Phase 10 grep guard.

### Planning artifacts
- `.planning/PROJECT.md` — milestone context (v1.2 Recommendation-First Plant Guide).
- `.planning/REQUIREMENTS.md` §"Perenual Data Quality (DATA)" — DATA-01..04 locked requirements.
- `.planning/ROADMAP.md` §"Phase 11: Perenual Data Quality" — goal, success criteria, dependency on Phase 10.
- `.planning/phases/10-perenual-security/10-CONTEXT.md` — Phase 10 envelope decision (`{ data: PerenualPlantDetail | null }`), checkpoint deploy pattern, and "edge function as Phase 10 entry point" precedent.
- `.planning/research/STACK.md` — stack notes (not directly relevant; verify no conflicts).
- `.planning/research/ARCHITECTURE.md` — integration points, mirror-identify-plant pattern.

### Source files of interest
- `supabase/functions/get-plant-care/index.ts` — current Phase 10 edge function. Phase 11 adds `isGoodMatch` between search (line ~84-100) and details fetch (line ~118), and expands `PerenualPlantDetail` interface (line ~20-44) with `family?: string, type?: string`.
- `src/services/plantKnowledgeService.ts` — client-side improvements:
  - Lines 26-39: extend `PerenualPlantDetail extends PerenualPlant` with `family?: string, type?: string`.
  - Lines 168-201 (`convertPerenualToKnowledge`): add humidity inference using `plant.family` + `plant.type`.
  - Lines 258-288 (`parseHardiness`): read `hardiness.max`, add category fallbacks (32/40/35/28).
  - Line 194: `humidity: null` (current hardcoded fallback) — replaced with classifier output.
  - Line 280: `tempMax = 35` (current hardcoded fallback) — replaced with category fallback derived from `plant.family` / `plant.type` / `indoor` flag.
- `supabase/functions/identify-plant/index.ts` — secondary reference for edge function patterns (CORS, error handling).
- `src/data/plantDatabase.ts` — source for test fixture species (when planner picks the 5).

### Existing patterns to mirror
- Phase 10 deferred deploy checkpoint (`autonomous: false`) — planner reuses the same pattern for the Phase 11 edge function redeploy.
- Phase 4 defensive fallback ladder — `getEnrichedPlantData` still gracefully handles null returns when the validator rejects.
- v1.1 single-compile-path smoke runner (`typescript.transpileModule`) — existing harness for parser tests; add Phase 11 cases inline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseHardiness()` at `plantKnowledgeService.ts:258-288` — already maps USDA zones 1-13 to °C; needs (a) read `.max` not just `.min` and (b) category-aware fallback when `.max` is missing.
- `convertPerenualToKnowledge()` at `plantKnowledgeService.ts:168-201` — central place to add humidity inference; it already destructures hardiness and watering, so adding family/type is symmetrical.
- `searchPlantKnowledge()` at `plantKnowledgeService.ts:51-93` — caches the converted result via `saveToCache()`; once `convertPerenualToKnowledge` returns `humidity !== null`, the cache row gets the right value automatically (no schema change to `plant_knowledge` table).
- Edge function `serve()` handler in `get-plant-care/index.ts:46-151` — single-file, ~100 LOC, has a clear point between search (line 87) and details fetch (line 119) where the validator slots in.
- `console.log('[get-plant-care] ...')` debug pattern — keep for parity, add a `[get-plant-care] Mismatch: query="X" vs result="Y"` log when validator rejects.

### Established Patterns
- **Edge function returns `{ data: ... | null }` envelope** (Phase 10) — DO NOT change envelope shape; mismatch returns `{ data: null }` to match the existing "no plants found" branch (line 105-110).
- **Anonymous-allowed (no JWT)** — Phase 10 precedent; Phase 11 keeps it.
- **Status 200 on "no useful data"** — Phase 10 precedent; mismatch is a "no useful data" outcome, not a server error. Status 200 with `{ data: null }`.
- **Defensive fallback ladder** — every Phase 11 change preserves the chain: validator-rejected/network-error/parse-error → `null` → client falls through to defaults in `getEnrichedPlantData`.
- **Deferred deploy checkpoint** — Phase 10 precedent; `autonomous: false` task for the edge function redeploy.

### Integration Points
- **Edge function ↔ client contract** — only the addition of `family?: string` and `type?: string` to `PerenualPlantDetail`. No method, route, or shape changes.
- **`searchPlantKnowledge` callers** — `getEnrichedPlantData` is the primary consumer; behavior preserved (returns enriched data with non-default `tempMax` and `humidity` when Perenual provides usable data; otherwise falls through to defaults).
- **`plant_knowledge` Supabase table** — no schema change; existing `humidity` and `temp_max_c` columns now receive non-null/non-35 values for new identifications.
- **PlantNet identification flow** — unchanged; Perenual enrichment happens after identification, transparently.

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" — apply to: existing cache rows with old defaults stay as-is; only new identifications benefit from improved derivations.
- Mirror Phase 10's exact patterns for the validator placement and checkpoint deploy task — single source of truth for edge function evolution.
- Validator placement is BEFORE the details fetch, not after — saves a Perenual API call when the search result is wrong.
- Type expansion (`family`, `type`) must happen in BOTH `index.ts` files (edge function + client service) in the same plan/commit so they don't drift.

</specifics>

<deferred>
## Deferred Ideas

- **Re-enriching old cache rows** — accepted silent degradation. If we ever want to repair them, that's a one-shot SQL/edge-function migration phase, not Phase 11.
- **Validator tightening (word-boundary, accent strip, Levenshtein)** — REQUIREMENTS.md locks the loose `lowercase().includes()` definition. Revisit only if DATA-04 fixture shows false-positive caching during verification.
- **Server-side parser/converter migration** — keeping `parseHardiness` + `convertPerenualToKnowledge` client-side for Phase 11. Could be revisited if the edge function ever needs to serve a non-RN consumer.
- **TRACK-01..03 unknown plant tracking** — Phase 12.

</deferred>

---

*Phase: 11-perenual-data-quality*
*Context gathered: 2026-05-02*
