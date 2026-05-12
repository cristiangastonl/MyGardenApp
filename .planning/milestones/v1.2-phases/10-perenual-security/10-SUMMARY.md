---
phase: 10-perenual-security
subsystem: api, infra, docs
tags: [perenual, security, edge-function, client-cleanup, supabase]

# Phase outcome
outcome: "Perenual API key successfully migrated server-side via get-plant-care edge function; EXPO_PUBLIC_PERENUAL_API_KEY removed from all client paths; key rotation deferred for trusted-test-build context"

# Plans
plans:
  - plan: "01"
    summary: "Created get-plant-care edge function mirroring identify-plant skeleton"
    commit: ca1bb8a
    status: complete
  - plan: "02"
    summary: "Rewired fetchFromPerenual to supabase.functions.invoke; removed EXPO_PUBLIC_PERENUAL_API_KEY from src/, .env, .env.example"
    commits: [92dcbda, b74a6a8]
    status: complete
  - plan: "03"
    summary: "Deployed get-plant-care; set PERENUAL_API_KEY secret; curl-verified live Perenual payloads; rotation deferred"
    status: complete (rotation deferred)
  - plan: "04"
    summary: "Updated CLAUDE.md (4 edits) and PROJECT.md Key Decisions table with accurate rotation-deferred wording"
    commits: [0f396aa, 0510a04]
    status: complete

requirements-completed:
  - SEC-01
  - SEC-02
  - SEC-03
  - SEC-04  # partial — server-side access done; rotation deferred
  - SEC-05

duration: ~15min total across 4 plans
completed: "2026-05-03"
---

# Phase 10: Perenual Security — Phase Summary

**Perenual API key moved exclusively server-side via new get-plant-care Supabase edge function; EXPO_PUBLIC_PERENUAL_API_KEY removed from all client bundle paths; key rotation deferred for 5-user trusted test build**

## Phase Outcome

Phase 10 achieved its core security objective: the Perenual API key is no longer accessible in the client bundle. The migration involved 4 sequential plans executed across a single session.

## Plans Executed

| Plan | Name | Commits | Duration | Status |
|------|------|---------|----------|--------|
| 10-01 | Create get-plant-care edge function | ca1bb8a | 1 min | Complete |
| 10-02 | Client-side Perenual key removal | 92dcbda, b74a6a8 | 5 min | Complete |
| 10-03 | Deploy + secret set + verify | (manual) | ~10 min | Complete (rotation deferred) |
| 10-04 | Documentation update | 0f396aa, 0510a04 | 2 min | Complete |

**Total duration:** ~18 min

## ROADMAP Success Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `grep -r "EXPO_PUBLIC_PERENUAL_API_KEY" src/` returns 0 results | MET (Plan 10-02) |
| 2 | Live identify + Perenual enrichment end-to-end (curl verification) | MET (Plan 10-03) |
| 3 | Supabase logs show no key-missing 500s after deploy | MET (Plan 10-03 curl: HTTP 200 + real data) |
| 4 | PERENUAL_API_KEY rotated in Perenual dashboard | DEFERRED — per user judgment; test build distributed to 5 trusted users only; to be done before public store release |

## SEC-* Requirements Final Status

| Req | Description | Status |
|-----|-------------|--------|
| SEC-01 | EXPO_PUBLIC_PERENUAL_API_KEY removed from client bundle | CLOSED |
| SEC-02 | get-plant-care edge function uses Deno.env.get('PERENUAL_API_KEY') | CLOSED |
| SEC-03 | fetchFromPerenual rewired to supabase.functions.invoke('get-plant-care') | CLOSED |
| SEC-04 | PERENUAL_API_KEY rotated in Perenual dashboard | PARTIAL (deferred) |
| SEC-05 | CLAUDE.md + PROJECT.md updated | CLOSED |

## Deviations Summary

1. **[Plan 10-02 — Rule 1 Dead Code] Removed PERENUAL_API_BASE constant** — Auto-fixed inline with Task 1 (was dead code after direct fetch calls were replaced).
2. **[Plan 10-03 — Scope reduction] SEC-04 rotation deferred** — User judgment: build is internal test distribution to 5 trusted users; rotation risk/reward doesn't justify interruption.
3. **[Plan 10-03 — Methodology] curl verification over device verification** — Device test hit local Supabase cache (no edge function invoked); switched to direct curl POST with anon key for reliable signal.
4. **[Plan 10-04 — Wording adjustment] PROJECT.md rotation wording** — Plan said "rotated as part of v1.2"; adjusted to "rotation deferred for trusted-test-build context" to match Plan 10-03 reality.

## Architecture Established

- `get-plant-care` edge function is the canonical server-side Perenual proxy for Phase 11 data quality improvements
- Response envelope `{ data: PerenualPlantDetail | null, error?: string }` is the stable contract for Phase 11 to enhance
- Pre-submit grep guard documented in CLAUDE.md prevents re-introduction of EXPO_PUBLIC_PERENUAL_API_KEY

## Open Item

**Key rotation** — Before any public App Store / Google Play production release, rotate the Perenual API key:
1. Go to Perenual dashboard → API Keys → revoke current key
2. Generate new key
3. `source .envrc && supabase secrets set PERENUAL_API_KEY=<new-value>`
4. Verify curl still returns data

---
*Phase 10 completed: 2026-05-03*
