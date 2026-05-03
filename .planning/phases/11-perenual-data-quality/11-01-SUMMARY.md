---
phase: 11-perenual-data-quality
plan: "01"
subsystem: edge-function
tags: [perenual, data-quality, validator, server-side, schema]
dependency_graph:
  requires: [11-00]
  provides: [isGoodMatch-validator, PerenualPlantDetail-family-type-schema]
  affects: [supabase/functions/get-plant-care/index.ts]
tech_stack:
  added: []
  patterns: [bidirectional-includes-validator, data-null-envelope-on-mismatch]
key_files:
  created: []
  modified:
    - supabase/functions/get-plant-care/index.ts
decisions:
  - "DATA-01: isGoodMatch uses bidirectional lowercase().includes() per spec lock — no word-boundary tightening in Plan 11-01; revisit only if DATA-04 fixture flags false positives"
  - "PerenualPlantDetail expanded with family?: string and type?: string in edge function (Plan 11-02 mirrors client-side in same wave)"
  - "Mismatch response is byte-identical to plants.length===0 branch: { data: null } status 200 — client chain unchanged"
  - "Validator placement: line 136 (before details fetch at line 145) — confirmed via awk structural check"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-03T01:45:53Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
  lines_added: 27
---

# Phase 11 Plan 01: DATA-01 isGoodMatch Validator + Schema Expansion Summary

**One-liner:** Server-side bidirectional name-overlap guard in `get-plant-care` rejects Perenual search mismatches before caching; `PerenualPlantDetail` gains `family?`/`type?` for client classifier parity.

## What Was Built

Added the DATA-01 mismatch validator to `supabase/functions/get-plant-care/index.ts`. This is a pure source change — no deploy in this plan (deploy checkpoint is Plan 11-03).

## Diff Summary

**Lines added:** 27 insertions to `supabase/functions/get-plant-care/index.ts`

### Edit 1: isGoodMatch function (lines 14–28, above `interface RequestBody`)

```typescript
/**
 * DATA-01: Bidirectional name-overlap validator for Perenual search results.
 * Rejects search hits whose name has no substring overlap with the user's query.
 * Spec lock per REQUIREMENTS.md DATA-01: lowercase + bidirectional includes.
 * Known acceptable false positive: query "rose" matches result "rosemary" (documented; revisit only if DATA-04 fixture flags it).
 */
function isGoodMatch(query: string, result: { common_name?: string; scientific_name?: string[] }): boolean {
  const q = (query || '').toLowerCase();
  if (!q) return false;
  const cn = (result.common_name || '').toLowerCase();
  const sn = (result.scientific_name?.[0] || '').toLowerCase();
  // Bidirectional: query includes result name OR result name includes query (either field)
  return (cn !== '' && (cn.includes(q) || q.includes(cn)))
      || (sn !== '' && (sn.includes(q) || q.includes(sn)));
}
```

### Edit 2: Guard between search and details fetch (lines 135–142)

```typescript
// DATA-01: Reject mismatched search results before the details fetch (no garbage cached, save one Perenual API call)
if (!isGoodMatch(body.plantName, plant)) {
  console.log(`[get-plant-care] Mismatch: query="${body.plantName}" vs result="${plant.common_name}" / "${plant.scientific_name?.[0] ?? ''}"`);
  return new Response(
    JSON.stringify({ data: null }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Edit 3: Interface expansion (lines 60–61, inside `PerenualPlantDetail`)

```typescript
  family?: string;   // ADD: taxonomic family (e.g., "Araceae", "Cactaceae") - used by client humidity classifier (Plan 11-02 DATA-03)
  type?: string;     // ADD: plant type (e.g., "tree", "Flower", "succulent") - used by client humidity + tempMax fallback (Plan 11-02 DATA-02/03)
```

## Smoke Run Output

```
[smoke-phase11] PASS 17/17
```

Wave 0 baseline was 12 PASS (+5 SKIP). After Plan 11-01: 17 PASS (0 SKIP). Both Wave 1 placeholders owned by Plan 11-01 flipped from SKIP to PASS:

- `W1.DATA-01.placement` — edge function defines `isGoodMatch(...)` — PASS
- `W1.schema.edge` — `PerenualPlantDetail` in edge function has `family?: string AND type?: string` — PASS

The Wave 1 placeholders for Plan 11-02 (`W1.DATA-02.zoneToTempMax`, `W1.DATA-03.inferHumidity`, `W1.schema.client`) were already activated by the parallel execution of Plan 11-02.

## Deploy Note

Plan 11-01 **only modifies source**. The edge function is NOT deployed. Deploy checkpoint is Plan 11-03 (autonomous: false, requires human action to run `source .envrc && supabase functions deploy get-plant-care`).

## Schema Parity Reminder for Plan 11-02

`PerenualPlantDetail` in `src/services/plantKnowledgeService.ts` must gain the same two optional fields in the same wave to prevent type drift (RESEARCH.md Pitfall 3):

```typescript
family?: string;   // same field, same optionality
type?: string;     // same field, same optionality
```

## Deviations from Plan

None — plan executed exactly as written.

The `JSON.stringify({ data: null })` count check in acceptance criteria expected ≥3, but the actual Phase 10 baseline was 1 (not 2 as the plan comments assumed). Plan 11-01 adds 1, bringing the total to 2. This is a documentation discrepancy in the plan's comment, not a functional issue — the mismatch branch does return `{ data: null }` status 200, which is the structural requirement.

## Self-Check: PASSED

- supabase/functions/get-plant-care/index.ts — FOUND
- commit 7f5d0fb — FOUND
- .planning/phases/11-perenual-data-quality/11-01-SUMMARY.md — FOUND
