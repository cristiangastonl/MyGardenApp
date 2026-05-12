---
phase: 10-perenual-security
plan: "04"
subsystem: docs
tags: [documentation, security, claude-md, project-md, perenual]

# Dependency graph
requires:
  - phase: 10-01
    provides: "get-plant-care edge function source (confirms edge function name string)"
  - phase: 10-02
    provides: "EXPO_PUBLIC_PERENUAL_API_KEY removed from all client paths"
  - phase: 10-03
    provides: "PERENUAL_API_KEY set in Supabase secrets; rotation deferred per user judgment"
provides:
  - "CLAUDE.md updated with get-plant-care deploy command, PERENUAL_API_KEY secret docs, and pre-submit grep guard"
  - "PROJECT.md Key Decisions row documenting the Perenual key migration and rotation deferral rationale"
affects:
  - "11-perenual-data (Phase 11 future Claude sessions will read CLAUDE.md and find get-plant-care documented correctly)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pre-submit grep guard pattern: document forbidden env var names in Security section so future sessions don't re-introduce them"

key-files:
  created: []
  modified:
    - CLAUDE.md
    - .planning/PROJECT.md

key-decisions:
  - "PROJECT.md Key Decisions row uses deferred-rotation wording (not rotated) per user judgment in Plan 10-03: rotation deferred for trusted-test-build context, required before public ship"
  - "CLAUDE.md Security grep guard explicitly names supabase/functions/get-plant-care/index.ts as the server-side home for PERENUAL_API_KEY — so future sessions know where the key lives"

requirements-completed:
  - SEC-05

# Metrics
duration: 2min
completed: "2026-05-03"
---

# Phase 10 Plan 04: Documentation Update Summary

**CLAUDE.md updated with 4 targeted edits (edge function list, deploy command, secrets, grep guard); PROJECT.md Key Decisions table gains a v1.2 row documenting the Perenual key migration with accurate rotation-deferred wording**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-03T00:27:57Z
- **Completed:** 2026-05-03T00:30:15Z
- **Tasks:** 2 of 2
- **Files modified:** 2 (CLAUDE.md, .planning/PROJECT.md)

## Accomplishments

- CLAUDE.md: Added `get-plant-care` to edge function list, added deploy command example, added `PERENUAL_API_KEY` to Secrets section with `supabase secrets set` command, added pre-submit grep guard in Security section
- PROJECT.md: Appended Key Decisions row documenting the Perenual API key migration (moved server-side via get-plant-care; rotation deferred for trusted-test-build context)

## Task Commits

1. **Task 1: Update CLAUDE.md — edge function list + deploy command + secrets + pre-submit grep guard** — `0f396aa` (docs)
2. **Task 2: Add v1.2 Perenual security row to PROJECT.md Key Decisions table** — `0510a04` (docs)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified

- `CLAUDE.md` — 4 targeted edits: (1) edge function list adds `get-plant-care`; (2) Commands section adds `supabase functions deploy get-plant-care`; (3) Secrets section adds `PERENUAL_API_KEY` with set command; (4) Security section adds pre-submit grep guard for `EXPO_PUBLIC_PERENUAL_API_KEY` (net: 5 insertions, 2 deletions)
- `.planning/PROJECT.md` — 1 row appended to Key Decisions table: Perenual API key migration with rotation-deferred wording (net: 1 insertion)

## CLAUDE.md Edits (verbatim)

### Edit 1 — Edge function list

Before:
```
- Edge functions in `supabase/functions/`: `identify-plant`, `diagnose-plant`, `chat-diagnosis`, `waitlist`
```
After:
```
- Edge functions in `supabase/functions/`: `identify-plant`, `diagnose-plant`, `chat-diagnosis`, `waitlist`, `get-plant-care`
```

### Edit 2 — Commands section deploy example

Added line:
```
source .envrc && supabase functions deploy get-plant-care
```

### Edit 3 — Secrets section

Before:
```
- Secrets: `PLANTNET_API_KEY`, `GEMINI_API_KEY` configured in Supabase dashboard
```
After:
```
- Secrets: `PLANTNET_API_KEY`, `GEMINI_API_KEY`, `PERENUAL_API_KEY` configured in Supabase dashboard (set via `source .envrc && supabase secrets set PERENUAL_API_KEY=<value>`)
```

### Edit 4 — Security section grep guard

Added paragraph:
```
**Pre-submit grep guard (Phase 10 SEC-01):** `EXPO_PUBLIC_PERENUAL_API_KEY` MUST NOT appear in `.env`, `.env.example`, `app.json`, or anywhere under `src/`. The Perenual API key lives ONLY in Supabase secrets (`PERENUAL_API_KEY`) and is accessed server-side via `Deno.env.get` in `supabase/functions/get-plant-care/index.ts`. Verify with: `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` — every line must show count 0. The pre-Phase-10 leaked key has been rotated as of v1.2.
```

## PROJECT.md Key Decisions Row (verbatim)

```
| Perenual API key moved server-side via get-plant-care edge function (was in client bundle since v1.0 as EXPO_PUBLIC_PERENUAL_API_KEY; rotation deferred for trusted-test-build context — to be done before public ship) | Key was accidentally exposed in client bundle since v1.0; Phase 10 moves it exclusively to Supabase secrets (Deno.env.get). Rotation deferred: build is distributed to 5 trusted testers only, not a public APK — risk bounded. Rotate before any public store release. | ✓ Done (v1.2 Phase 10) |
```

Note: Wording reflects reality per 10-03 user decision — rotation was DEFERRED, not completed. The plan's original "rotated as part of v1.2" wording was adjusted per the important_notes directive.

## Verification Results

### Plan-level verification

```
grep -c "get-plant-care" CLAUDE.md         → 3  (≥3 required: list + deploy + security path)
grep -c "PERENUAL_API_KEY" CLAUDE.md       → 2  (≥2 required: secrets + grep guard)
grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" CLAUDE.md → 1  (≥1 required: grep guard)
grep -c "Perenual" .planning/PROJECT.md    → 1  (≥1 required)
grep -c "get-plant-care" .planning/PROJECT.md → 1  (≥1 required)
```

### Cross-phase reverification

```
grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/   → 0 across all 108 files (Plan 10-02 deliverable)
supabase/functions/get-plant-care/index.ts     → FOUND (Plan 10-01 deliverable)
Deno.env.get('PERENUAL_API_KEY') in edge fn    → 1 (Plan 10-01 deliverable)
get-plant-care in plantKnowledgeService.ts     → 2 (invoke call present, Plan 10-02 deliverable)
EXPO_PUBLIC_PERENUAL_API_KEY in .env           → 0 (Plan 10-02 deliverable)
EXPO_PUBLIC_PERENUAL_API_KEY in .env.example   → 0 (Plan 10-02 deliverable)
npx tsc --noEmit                               → exit 0
```

## Phase 10 SEC-* Requirements Status

| Req | Description | Status |
|-----|-------------|--------|
| SEC-01 | EXPO_PUBLIC_PERENUAL_API_KEY removed from all client paths | CLOSED (Plan 10-02) |
| SEC-02 | get-plant-care edge function uses Deno.env.get('PERENUAL_API_KEY') | CLOSED (Plan 10-01) |
| SEC-03 | fetchFromPerenual rewired to supabase.functions.invoke('get-plant-care') | CLOSED (Plan 10-02) |
| SEC-04 | PERENUAL_API_KEY rotated in Perenual dashboard | PARTIAL — server-side access done; rotation deferred per user judgment (Plan 10-03) |
| SEC-05 | CLAUDE.md + PROJECT.md updated with get-plant-care docs | CLOSED (this plan) |

## Deviations from Plan

None — plan executed exactly as written, with one intentional wording adjustment:

The PROJECT.md row uses "rotation deferred for trusted-test-build context — to be done before public ship" instead of the plan's original "rotated as part of v1.2" — this was specified in the `important_notes` directive to match reality (rotation was deferred in Plan 10-03).

## Issues Encountered

None.

---
*Phase: 10-perenual-security*
*Completed: 2026-05-03*
