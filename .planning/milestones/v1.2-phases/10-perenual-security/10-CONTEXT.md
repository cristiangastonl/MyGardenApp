# Phase 10: Perenual Security - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Source:** Requirements-derived (SEC-01..05 are concrete; no grey areas needed)

<domain>
## Phase Boundary

Move the Perenual API key from the client bundle to Supabase Edge Functions so the key cannot be extracted from a decompiled `.aab`/`.ipa`. Replace `plantKnowledgeService.fetchFromPerenual()` (currently 2 fetch calls hitting Perenual directly with `EXPO_PUBLIC_PERENUAL_API_KEY` as query param at lines 145 and 165) with a single `supabase.functions.invoke('get-plant-care', { body: { plantName, lang } })` call that returns the same `PerenualPlantDetail` shape. Rotate the old key in the Perenual dashboard before merge so any leaked copy is invalidated.

**No data quality changes here** — DATA-01 (match validator), DATA-02 (tempMax dynamic), DATA-03 (humidity inferred) all live in Phase 11 which depends on this. Phase 10 is the **structural move**: client→edge function, same payload shape, same return shape. Phase 11 then improves the Perenual response handling inside the edge function.

Locked from REQUIREMENTS.md: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05.

</domain>

<decisions>
## Implementation Decisions

### Edge Function Structure (SEC-02)
- **File:** `supabase/functions/get-plant-care/index.ts` — mirror `identify-plant/index.ts` structure (CORS headers, error handling, Deno.env.get pattern).
- **Input:** `{ plantName: string, lang?: 'en' | 'es' }` — same shape `plantKnowledgeService.fetchFromPerenual()` accepts today.
- **Server-side flow:** 2 fetch calls to Perenual (search → details by ID) using `Deno.env.get('PERENUAL_API_KEY')` server-side. Both fetch URLs construct the API key as query param BUT only inside the Deno runtime — never exposed to the client.
- **Output shape:** Same `PerenualPlantDetail | null` the client used to receive directly. Backward-compat with all downstream consumers.
- **Error handling:** Same try/catch pattern as `identify-plant`. Network errors return `null`, not exceptions, so `getEnrichedPlantData()` falls through to defaults gracefully.
- **CORS headers:** Mirror `identify-plant` (Access-Control-Allow-Origin: *, etc).
- **No JWT validation:** Per `identify-plant` precedent, this is anonymous-allowed (no auth required). Plant lookups are public read — no PII involved.

### Client-side Change (SEC-03)
- **File:** `src/services/plantKnowledgeService.ts` — replace `fetchFromPerenual()` body (currently lines 138-179).
- **Replacement signature:** Same function signature (`fetchFromPerenual(plantName: string, lang?: 'en' | 'es'): Promise<PerenualPlantDetail | null>`) so all 4 internal callers (`getEnrichedPlantData`, etc.) need ZERO changes.
- **Implementation:** Single `supabase.functions.invoke('get-plant-care', { body: { plantName, lang } })`. Handle `error` field from Supabase response → return null. Handle missing `data` → return null.
- **Defensive logging:** Keep `console.log('[PlantKnowledge] Fetching from Perenual via edge function...')` for `__DEV__` debug parity with v1.0/v1.1 conventions.

### API Key Removal (SEC-01)
- **Files to clean:**
  - `.env` — remove `EXPO_PUBLIC_PERENUAL_API_KEY=` line
  - `.env.example` — remove the placeholder line
  - `src/services/plantKnowledgeService.ts` — remove the `process.env.EXPO_PUBLIC_PERENUAL_API_KEY` reference at line 10 (the const itself becomes dead after SEC-03 replaces fetchFromPerenual).
- **Grep guard:** acceptance criterion `grep -r "EXPO_PUBLIC_PERENUAL_API_KEY" src/` returns zero results (matches success-criterion #1 from ROADMAP).
- **app.json check:** verify the key is NOT also exposed via `extra` field; if present, remove there too.

### Key Rotation (SEC-04)
- **Manual step:** User logs into Perenual dashboard, generates new API key, sets it via `supabase secrets set PERENUAL_API_KEY=<new_value>`. Old key is then invalidated/deleted in Perenual dashboard so any leaked copy stops working.
- **Order:** key rotation happens AFTER edge function is deployed and verified working with the new key in Supabase secrets. Otherwise we break production for the brief window between key invalidation and deploy.
- **Verification:** Trigger a plant identification of a known species in Expo Go AFTER rotation; check Supabase Functions logs show successful invocation; check the plant gets enriched data (not just defaults).
- **This is a manual action item** — the executor cannot rotate the key (no Perenual dashboard access). It will be a checkpoint task with `autonomous: false`, similar to the v1.1 Phase 7 Supabase deploy checkpoint.

### Documentation (SEC-05)
- **CLAUDE.md updates:**
  - Add `get-plant-care` to the existing edge functions list ("Edge functions in `supabase/functions/`: `identify-plant`, `diagnose-plant`, `chat-diagnosis`, `waitlist`, `get-plant-care`")
  - Add deploy command example to the existing edge function section: `source .envrc && supabase functions deploy get-plant-care`
  - Update Secrets section with `PERENUAL_API_KEY` (in addition to existing `PLANTNET_API_KEY`, `GEMINI_API_KEY`)
  - Pre-submit Checks section: add a note that `EXPO_PUBLIC_PERENUAL_API_KEY` should NEVER appear in `.env*` files (grep guard at submit time)
- **PROJECT.md:** add Key Decisions row noting the v1.0→v1.2 evolution: "Perenual key moved server-side (was leaked in client bundle since v1.0; rotated as part of v1.2)"

### Cross-Cutting / Claude's Discretion
- **Edge function deploy:** like v1.1 Phase 7, the executor cannot run `supabase functions deploy` (no `.envrc` token access). Plan an explicit checkpoint task with `autonomous: false` for the deploy + key rotation manual step. User runs the deploy + rotation, replies "deployed" to continue.
- **Smoke runner:** Phase 10 doesn't NEED a new smoke runner — it's a structural refactor (client→server). The verification surface is: tsc green + grep guard + manual edge function deploy verification. Optionally extend `migration-smoke-test.mjs` or `smoke-phase08.mjs` with a unit test of `fetchFromPerenual` returning a mocked Supabase response shape (deferred to Claude's discretion).
- **Test fixture:** the existing 5-species test fixture from DATA-04 (Phase 11) doesn't apply here — Phase 10 just verifies the structural change works with at least 1 species end-to-end.
- **Backward-compat window:** there is NO old client to support. Once the user upgrades the app, all clients use the edge function. Old shipped APKs would still try to use the bundled key — but since the key is rotated, those APKs stop getting Perenual data and fall through to safe defaults. Acceptable degradation per "ship-fast" stance — old APKs simply lose the Perenual enrichment, they don't crash.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — edge function deploy commands, Supabase secrets pattern, current edge function list.

### Planning artifacts
- `.planning/PROJECT.md` — milestone context.
- `.planning/REQUIREMENTS.md` §Perenual Security Hardening (SEC-01..05) — locked requirements.
- `.planning/research/STACK.md` — Reanimated v4 / SDK 54 stack notes (NOT relevant to Phase 10 directly, but verify no stack conflicts).
- `.planning/research/ARCHITECTURE.md` — integration points, mirror-identify-plant pattern noted.

### Source files of interest
- `src/services/plantKnowledgeService.ts` — line 10 `EXPO_PUBLIC_PERENUAL_API_KEY` const; lines 138-179 `fetchFromPerenual()` function with 2 Perenual API calls; line 400 `getEnrichedPlantData()` consumer.
- `supabase/functions/identify-plant/index.ts` — TEMPLATE for `get-plant-care` edge function (CORS, Deno.env.get, error handling pattern).
- `supabase/functions/diagnose-plant/index.ts` — secondary reference (more complex but same patterns).
- `.env`, `.env.example` — files to clean.
- `app.json` — verify no `extra.EXPO_PUBLIC_PERENUAL_API_KEY` exposure.

### Existing patterns to mirror
- v1.1 Phase 7 deferred Supabase deploy checkpoint (`autonomous: false` task) — same pattern for SEC-04 + post-deploy verification.
- v1.1 Phase 4 Plan 04 defensive fallback ladder — `getEnrichedPlantData` should still gracefully fall through to defaults when edge function returns null.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase.functions.invoke()` is already used in the codebase (e.g., `src/utils/plantDiagnosis.ts:71`) — same pattern, no new client setup.
- `identify-plant` edge function is the closest structural match: 1 input → fetch external API with secret key → return shape to client. Mirror its skeleton.
- `console.log('[PlantKnowledge] ...')` debug pattern — keep for parity.

### Established Patterns
- **Edge function CORS headers** — mirror `identify-plant` `corsHeaders` const.
- **Error handling** — return `null` on any error (network, parse, missing data); never throw to client. Client `?? defaults` chain handles it.
- **Anonymous-allowed** — plant lookups don't require auth (no PII).
- **Deferred deploy checkpoint** — v1.1 Phase 7 precedent: planner explicitly marks the deploy task `autonomous: false`, executor returns CHECKPOINT REACHED state, user runs deploy from their terminal, replies "deployed".

### Integration Points
- **`getEnrichedPlantData()` and other 3 internal callers of `fetchFromPerenual`** in `plantKnowledgeService.ts` — ZERO changes if we preserve the function signature.
- **`useStorage` and `App.tsx`** — no changes (Phase 10 is service-layer only).
- **PlantNet identification flow (`PlantIdentifierModal`)** — no changes; the enrichment happens after identification, transparently.

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" — apply to backward-compat: old APKs degrade silently to defaults, no scaffolding.
- Mirror `identify-plant` exactly — same dir structure, same CORS, same error handling. Single source of truth pattern for edge functions.
- Defensive fallback ladder (Phase 4 lock) — preserved at the consumer level: `fetchFromPerenual` returns `null` on error, callers fall through to defaults.

</specifics>

<deferred>
## Deferred Ideas

- **DATA-01..04** (match validator + tempMax + humidity inference) — Phase 11. The validator and dynamic field derivation live INSIDE the edge function (server-side), but their implementation is Phase 11's scope.
- **TRACK-01..03** (unknown plant tracking) — Phase 12. Independent of Phase 10.
- **Backward-compat shim for old APKs** — explicitly rejected; old APKs will degrade to defaults after key rotation. Acceptable.
- **Smoke runner for Phase 10** — Claude's discretion at planning time. Not strictly required; tsc + grep + manual edge function verification cover the surface.

</deferred>

---

*Phase: 10-perenual-security*
*Context gathered: 2026-05-02 (requirements-derived; no discuss-phase needed for this focused security work)*
