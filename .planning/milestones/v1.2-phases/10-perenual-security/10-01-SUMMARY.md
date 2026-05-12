---
phase: 10-perenual-security
plan: "01"
subsystem: api
tags: [supabase, edge-function, deno, perenual, security]

# Dependency graph
requires: []
provides:
  - "supabase/functions/get-plant-care/index.ts — server-side Perenual proxy edge function"
  - "PERENUAL_API_KEY moved exclusively to Supabase secrets (Deno.env.get) — no longer needed in client bundle"
affects:
  - "10-02 (client swap — plantKnowledgeService.fetchFromPerenual replaces 2 direct Perenual calls with supabase.functions.invoke('get-plant-care'))"
  - "10-03 (deploy checkpoint — deploys this function + sets PERENUAL_API_KEY secret)"
  - "11-perenual-data (Phase 11 improves Perenual response handling inside this edge function)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "get-plant-care mirrors identify-plant skeleton (CORS const, OPTIONS handler, Deno.env.get, try/catch envelope, Response builder)"
    - "Response envelope { data: T | null, error?: string } — null on any failure, never throws to client"
    - "HTTP 200 for no-results and degraded-search outcomes; HTTP 500 for missing-key and parse exceptions"

key-files:
  created:
    - supabase/functions/get-plant-care/index.ts
  modified: []

key-decisions:
  - "Response envelope is { data: PerenualPlantDetail | null, error?: string } so Plan 10-02 client reads invokeResponse?.data ?? null cleanly"
  - "No JWT validation — anonymous-allowed per identify-plant precedent (plant lookups are public read, no PII)"
  - "Search HTTP failure returns HTTP 200 data:null (degraded outcome) not 5xx — getEnrichedPlantData falls through to defaults without client-visible error"
  - "corsHeaders const mirrors identify-plant verbatim — single source-of-truth pattern for all edge functions"

patterns-established:
  - "Edge function skeleton: CORS const → OPTIONS → Deno.env.get key check → req.json() body parse → business logic → null-safe Response builder"
  - "Null-safe error envelope: return { data: null, error: msg } for all failure paths so consumers use simple ?? null chain"

requirements-completed:
  - SEC-02

# Metrics
duration: 1min
completed: "2026-05-02"
---

# Phase 10 Plan 01: Get-Plant-Care Edge Function Summary

**New Supabase edge function `get-plant-care` proxies the Perenual 2-call flow (species-list + species/details) server-side, keeping `PERENUAL_API_KEY` exclusively in Deno runtime via `Deno.env.get` — structural mirror of `identify-plant`**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-02T23:35:43Z
- **Completed:** 2026-05-02T23:36:43Z
- **Tasks:** 1 of 1
- **Files modified:** 1 (created)

## Accomplishments

- Created `supabase/functions/get-plant-care/index.ts` (151 lines) as a structural clone of `identify-plant` adapted for the Perenual 2-call flow
- `PERENUAL_API_KEY` sourced exclusively via `Deno.env.get('PERENUAL_API_KEY')` — zero `EXPO_PUBLIC_*` references in the edge function
- Response envelope `{ data: PerenualPlantDetail | null, error?: string }` matches the contract Plan 10-02 will consume via `invokeResponse?.data ?? null`

## Task Commits

1. **Task 1: Create get-plant-care edge function mirroring identify-plant structure** — `ca1bb8a` (feat)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified

- `supabase/functions/get-plant-care/index.ts` — Server-side Perenual proxy edge function (151 lines); mirrors `identify-plant` CORS/try-catch/Response patterns; performs species-list search + species/details fetch using `Deno.env.get('PERENUAL_API_KEY')`

## Decisions Made

- **Response envelope shape:** `{ data: PerenualPlantDetail | null, error?: string }` — not raw payload — so the Plan 10-02 Supabase invoke call reads `invokeResponse?.data ?? null` cleanly without shape transformation.
- **No-match and degraded-search return HTTP 200:** These are valid "no data" outcomes, not server errors. Returning 200 prevents Supabase's invoke from surfacing an error, keeping the `getEnrichedPlantData` null-fallback path clean.
- **HTTP 500 for missing key or parse exceptions:** These are genuine server-side failures and should surface in dev-build console logs for diagnosability.
- **Anonymous-allowed:** Mirrors `identify-plant` precedent — no JWT validation needed for public plant catalog reads (no PII involved).

## Response Envelope Contract (for Plan 10-02)

```typescript
// Plan 10-02 client invocation:
const { data: invokeResponse } = await supabase.functions.invoke('get-plant-care', {
  body: { plantName, lang }
});
const detail: PerenualPlantDetail | null = invokeResponse?.data ?? null;
```

The edge function always returns JSON with this shape:
```typescript
interface ResponseBody {
  data: PerenualPlantDetail | null;  // null on no-match, network failure, or parse error
  error?: string;                    // present only on 400/500 responses; never includes API key
}
```

## Structural Mirror Confirmation

`get-plant-care` mirrors `identify-plant` on these structural points:
- Same `corsHeaders` const (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`)
- Same `OPTIONS` → `return new Response('ok', { headers: corsHeaders })` preflight handler
- Same `Deno.env.get` pattern for API key retrieval
- Same `serve(async (req) => { try { ... } catch (error) { console.error(...); return 500 } })` envelope
- Same `{ ...corsHeaders, 'Content-Type': 'application/json' }` response headers pattern

Differences from `identify-plant` (intentional):
- Response envelope is `{ data: PerenualPlantDetail | null }` not raw payload (enables clean `?? null` chain)
- Two sequential fetch calls (search then details) vs single PlantNet call
- No-match returns 200 not 404 (different API semantic — Perenual returns empty array, not 404)

## Grep Proof

```
grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" supabase/functions/get-plant-care/index.ts
0
```

The edge function contains zero references to the client-side env var. The key is accessed exclusively as `Deno.env.get('PERENUAL_API_KEY')`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None at this plan stage. Plan 10-03 (manual checkpoint) handles:
- `supabase functions deploy get-plant-care`
- `supabase secrets set PERENUAL_API_KEY=<value>`
- Key rotation in Perenual dashboard

## Next Phase Readiness

- Plan 10-02 (client swap): `get-plant-care` edge function source is ready as the invocation target. Plan 10-02 replaces `fetchFromPerenual()` body in `plantKnowledgeService.ts` with a single `supabase.functions.invoke('get-plant-care', ...)` call.
- Plan 10-03 (deploy checkpoint): Edge function source exists; can be deployed once user runs `supabase functions deploy get-plant-care` and sets the `PERENUAL_API_KEY` secret.
- No blockers for Plan 10-02 execution.

---
*Phase: 10-perenual-security*
*Completed: 2026-05-02*
