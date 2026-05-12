---
phase: 10-perenual-security
plan: "02"
subsystem: api
tags: [supabase, edge-function, perenual, security, client-cleanup]

# Dependency graph
requires:
  - phase: 10-01
    provides: "supabase/functions/get-plant-care/index.ts — server-side Perenual proxy edge function with response envelope { data: PerenualPlantDetail | null }"
provides:
  - "plantKnowledgeService.fetchFromPerenual() rewired to supabase.functions.invoke('get-plant-care') — no direct Perenual HTTP calls from client"
  - "EXPO_PUBLIC_PERENUAL_API_KEY removed from src/, .env, .env.example — 0 references remain in client bundle"
  - "Dead client-side key state (let perenualApiKey, setPerenualApiKey, getPerenualApiKey) removed"
affects:
  - "10-03 (deploy checkpoint — deploys get-plant-care + sets PERENUAL_API_KEY secret; after that point fetchFromPerenual returns live data)"
  - "11-perenual-data (Phase 11 improves convertPerenualToKnowledge inside the edge function — client changes are frozen)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "supabase.functions.invoke('get-plant-care', { body: { plantName, lang } }) — same invoke shape as diagnose-plant at plantDiagnosis.ts:29"
    - "isSupabaseConfigured() guard replaces !perenualApiKey guard in searchPlantKnowledge — key precondition is now 'Supabase reachable', not 'client has key'"
    - "Defensive null-chain: invokeResponse?.data ?? null — matches envelope contract from Plan 10-01"

key-files:
  created: []
  modified:
    - src/services/plantKnowledgeService.ts
    - .env.example

key-decisions:
  - "fetchFromPerenual lang parameter is optional (lang?: 'en' | 'es') — additive-optional so all existing callers that pass only plantName need zero changes"
  - "PERENUAL_API_BASE constant removed as dead code — previously only used in the two direct fetch calls that were replaced"
  - "Gap window acknowledged: from this commit until Plan 10-03 deploy + secret-set, fetchFromPerenual returns null on every call (edge function returns 500); getEnrichedPlantData falls through to defaults — expected and acceptable per CONTEXT.md ship-fast stance"

patterns-established:
  - "Zero-change discipline for internal callers: function signature preserved verbatim when rerouting a service to an edge function"
  - "isSupabaseConfigured() as the guard for both client-key and server-key flows — single consistent precondition check throughout plantKnowledgeService"

requirements-completed:
  - SEC-01
  - SEC-03

# Metrics
duration: 5min
completed: "2026-05-02"
---

# Phase 10 Plan 02: Client-Side Perenual API Key Removal Summary

**fetchFromPerenual() rewired from direct Perenual HTTP fetch to supabase.functions.invoke('get-plant-care'); EXPO_PUBLIC_PERENUAL_API_KEY removed from src/, .env, and .env.example — 0 client-bundle references remain**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-02T23:38:00Z
- **Completed:** 2026-05-02T23:43:00Z
- **Tasks:** 3 of 3
- **Files modified:** 3 (plantKnowledgeService.ts, .env, .env.example)

## Accomplishments

- Replaced direct Perenual HTTP calls with `supabase.functions.invoke('get-plant-care', { body: { plantName, lang } })` — Perenual API key now lives exclusively in Supabase secrets
- Removed dead client-side key state: `let perenualApiKey`, `setPerenualApiKey()`, `getPerenualApiKey()`, `PERENUAL_API_BASE` constant — 0 orphan callers found outside the service file
- Updated `searchPlantKnowledge` guard from `!perenualApiKey` to `!isSupabaseConfigured()` — consistent with all other guards in the service
- Removed `EXPO_PUBLIC_PERENUAL_API_KEY` from `.env` (gitignored local file) and `.env.example` (committed)
- `app.json` audit: confirmed clean — `extra` field only contains `{ eas: { projectId: ... } }`, no Perenual reference

## Task Commits

1. **Task 1: Rewrite fetchFromPerenual body + remove dead key state** - `92dcbda` (feat)
2. **Task 2: Remove EXPO_PUBLIC_PERENUAL_API_KEY from .env and .env.example** - `b74a6a8` (chore)
3. **Task 3: Audit app.json** - no commit (audit-only, no edit needed)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified

- `src/services/plantKnowledgeService.ts` — fetchFromPerenual() body replaced (lines 138-179 → 122-163 new); dead key state block (lines 14-23) removed; PERENUAL_API_BASE constant (line 4) removed; searchPlantKnowledge guard updated (line 73-81); net: 25 insertions, 41 deletions
- `.env.example` — 3 lines removed (Perenual API key comment + placeholder line + blank line)
- `.env` — Perenual API key line removed (gitignored, not committed)

## Grep Proof

```
grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/
(0 matches across all 97 files in src/)

grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" .env
0

grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" .env.example
0

grep -ci "perenual" app.json
0
```

ROADMAP success criterion #1: `grep -r "EXPO_PUBLIC_PERENUAL_API_KEY" src/` returns 0 results — MET.

## Decisions Made

- `lang` parameter added as optional to `fetchFromPerenual` (was implicit). All 4 internal callers pass only `plantName` and are unaffected — additive-optional per zero-change discipline.
- `PERENUAL_API_BASE` constant removed as dead code in the same commit as the function rewrite (not separately noted in plan, but falls under Rule 2 — dead code left behind would accumulate noise).

## Gap Window: Expected Degraded State

From this commit until **Plan 10-03** (deploy checkpoint) runs:
- `supabase functions deploy get-plant-care` NOT yet run
- `supabase secrets set PERENUAL_API_KEY=<value>` NOT yet run

During this window:
- Plant identification (PlantNet edge function) works normally — unaffected by this change
- Post-identification Perenual enrichment (`getEnrichedPlantData`) returns `null` from `fetchFromPerenual` on every call → falls through to defaults
- App UI shows default care values instead of Perenual-sourced data

This is **intentional and acceptable** per CONTEXT.md ship-fast stance. Plan 10-03 manual checkpoint resolves it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Dead Code] Removed PERENUAL_API_BASE constant**
- **Found during:** Task 1 (rewrite fetchFromPerenual body)
- **Issue:** `const PERENUAL_API_BASE = 'https://perenual.com/api'` was only used in the two direct fetch calls that were replaced; leaving it would be dead code referencing the old approach
- **Fix:** Removed the constant in the same edit as the function rewrite
- **Files modified:** src/services/plantKnowledgeService.ts
- **Verification:** `npx tsc --noEmit` exits 0; no remaining usages of `PERENUAL_API_BASE`
- **Committed in:** 92dcbda (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 dead code removal)
**Impact on plan:** Strictly additive cleanup — removes noise, no behavior change.

## Issues Encountered

None.

## User Setup Required

None at this plan stage. Plan 10-03 (manual checkpoint) handles:
- `supabase functions deploy get-plant-care`
- `supabase secrets set PERENUAL_API_KEY=<value>` (key value from Perenual dashboard)
- Key rotation in Perenual dashboard (revoke old key that was in `.env`)

## Next Phase Readiness

- **Plan 10-03 (deploy checkpoint):** Edge function source (Plan 10-01) and client swap (Plan 10-02) are both complete. Plan 10-03 is a manual checkpoint requiring `supabase functions deploy` + secret-set + key rotation.
- **No automated blockers.** The degraded state (Perenual returns null) is safe — app functions normally with default care values.

---
*Phase: 10-perenual-security*
*Completed: 2026-05-02*
