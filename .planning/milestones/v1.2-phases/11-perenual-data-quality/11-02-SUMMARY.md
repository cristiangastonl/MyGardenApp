---
phase: 11-perenual-data-quality
plan: "02"
subsystem: plant-knowledge-service
tags: [data-quality, perenual, hardiness, humidity, smoke-runner]
dependency_graph:
  requires: [11-00]
  provides: [DATA-02-client, DATA-03-client]
  affects: [plantKnowledgeService.ts, smoke-phase11.mjs]
tech_stack:
  added: []
  patterns: [zone-to-temp-lookup, family-type-classifier, category-fallback]
key_files:
  modified:
    - src/services/plantKnowledgeService.ts
    - scripts/smoke-phase11.mjs
decisions:
  - "parseHardiness returns tempMax: null (not 35) when hardiness.max is absent — caller applies category fallback"
  - "classifyTempMaxFallback has four anchors (40/32/28/35); cactus-first rule prevents Cactaceae perennials from getting fría-28"
  - "inferHumidity: family match beats type substring (taxonomic signal more reliable than free-text)"
  - "All 4 internal helpers exported via export keyword (not a re-export file) for smoke harness invocation"
metrics:
  duration: "~9 min"
  completed: "2026-05-02"
  tasks_completed: 3
  files_modified: 2
---

# Phase 11 Plan 02: Perenual Data Quality — Client-Side Parsing (DATA-02 + DATA-03) Summary

**One-liner:** Client-side Perenual parsing upgraded: `parseHardiness` reads `hardiness.max` via zone lookup table; `inferHumidity` classifies Araceae/Cactaceae/etc from `family`/`type`; `classifyTempMaxFallback` provides four-anchor category fallback (40/32/28/35 including fría-28 cold-hardy branch); all four helpers exported and exercised by 17 new behavior asserts in the smoke runner.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Expand PerenualPlantDetail interface + rewrite parseHardiness | 9bf77f1 | src/services/plantKnowledgeService.ts |
| 2 | Add inferHumidity + classifyTempMaxFallback + wire into convertPerenualToKnowledge | 4948633 | src/services/plantKnowledgeService.ts |
| 3 | Wire Wave 1 behavior assertions into scripts/smoke-phase11.mjs | af3788a | scripts/smoke-phase11.mjs |

## Diff Summary: src/services/plantKnowledgeService.ts

**Net change: +78 LOC (28 added Task 1, 78 added Task 2 minus 3 removed hardcoded lines)**

### Task 1 changes:
- `PerenualPlantDetail` interface: added `family?: string` and `type?: string` (mirrors edge function from Plan 11-01, same wave)
- `parseHardiness`: replaced single `zoneToTemp` table with two separate tables (`zoneToTempMin` and `zoneToTempMax`); `tempMax` now defaults to `null` instead of `35`; added `if (hardiness?.max)` branch reading `zoneToTempMax`; added `export` keyword
- Removed hardcoded `tempMax: number | null = 35` default

### Task 2 changes:
- New `export function inferHumidity()`: family → `'alta'`/`'baja'`; type substring fallback; `'media'` default
  - `'alta'`: Araceae, Orchidaceae, Bromeliaceae families; tropical/fern/moss types
  - `'baja'`: Cactaceae, Crassulaceae families; cactus/succulent types
  - `'media'`: all other inputs (default)
- New `export function classifyTempMaxFallback()`: four anchors per REQUIREMENTS.md DATA-02
  - Step 1 (cactus-first): Cactaceae/Crassulaceae/cactus/succulent → `40`
  - Step 2 (tropical): Araceae/Orchidaceae/Bromeliaceae/tropical/fern/moss → `32`
  - Step 3 (fría/cold-hardy): Rosaceae/Asteraceae/Lamiaceae/Fagaceae/Pinaceae or type contains perennial/conifer/tree/bulb → `28`
  - Step 4 (generic indoor): `indoor === true` → `32`
  - Step 5 (default templada): `35`
- `convertPerenualToKnowledge`: added `export` keyword; replaced `temp_max_c: tempMax` with `tempMax ?? classifyTempMaxFallback(plant)`; replaced `humidity: null` with `inferHumidity(plant)`
- Removed comment `// Perenual doesn't provide this directly`

## Diff Summary: scripts/smoke-phase11.mjs

**Net change: +99 LOC added, -11 LOC removed (3 superseded placeholders)**

### Removed (3 superseded assertSkippable placeholders):
- `W1.DATA-02.zoneToTempMax` — structural grep replaced by 4 real parseHardiness behavior asserts
- `W1.DATA-03.inferHumidity` — structural grep replaced by 4 real inferHumidity behavior asserts
- `W1.schema.client` — schema check replaced by E2E convertPerenualToKnowledge asserts

### Added (Wave 1 Behavior Assertions block — 17 behavior asserts):
```
─── Wave 1 Behavior Assertions ───
DATA-02: parseHardiness (4 asserts): zone 10→38, zone 11→40, undefined→null, min+max combined
DATA-02: classifyTempMaxFallback (6 asserts): tropical 32, cactus 40, fría Rosaceae 28, fría perennial-type 28, cactus-first order, templada default 35
DATA-03: inferHumidity (4 asserts): Araceae→alta, Cactaceae→baja, succulent-type→baja, Rosaceae→media
E2E: convertPerenualToKnowledge (3 asserts): zone-derived, category fallback, Rosaceae fría+media
```

## Final Smoke Run Output

```
[smoke-phase11] PASS 31/31
```

Breakdown: 12 Wave 0 scaffold + 2 Wave 1 server-side placeholders (W1.DATA-01 + W1.schema.edge still assertSkippable) + 17 Wave 1 behavior asserts = **31 PASS, 0 FAIL, 0 SKIP**.

Note: Plan 11-01 landed concurrently in this same session, activating the W1.DATA-01.placement and W1.schema.edge placeholders as PASS (they were SKIP before 11-01). The 31/31 count reflects both plans having landed.

## TypeScript Strict Check

`npx tsc --noEmit` exits 0. No type errors on:
- `plant.family` / `plant.type` access in `convertPerenualToKnowledge` (interface now declares both fields)
- `humidity: inferHumidity(plant)` assignment — `'alta' | 'media' | 'baja'` widens to `string` for `DbPlantKnowledgeInsert.humidity: string | null`
- `export` keywords on all four functions — no module system conflicts

## fría-28 Case Exercised End-to-End

```
W1.DATA-02.f3: fría fallback Rosaceae → 28 (got 28)  → PASS
W1.E2E.k3: Rosaceae no-hardiness → humidity='media', tempMax=28 (fría branch)  → PASS
```

The fría-28 branch (Issue 1 fix from the plan revision context) is verified both at the unit level (`classifyTempMaxFallback({ family: 'Rosaceae' })`) and at the E2E level (a full `convertPerenualToKnowledge` call with a Rosaceae plant).

Note: `inferHumidity` for Rosaceae returns `'media'` — humidity rules and tempMax fallback rules are independent classifiers. Rosaceae plants get cold-hardy tempMax (28) but neutral humidity (media), which is correct botanical behavior.

## Deviations from Plan

None — plan executed exactly as written. The fría-28 branch was already part of the revised plan spec; the full classifyTempMaxFallback with all four anchors was implemented as specified.

## Deferred Items

- **DATA-04 live fixture verification**: Live 5-species fixture verification deferred to Plan 11-03, which deploys and verifies the full chain end-to-end against the actual Perenual API. This plan shipped only unit-level changes.
- **Plan 11-01 + 11-02 co-equal**: Both Wave 1 plans must land before Plan 11-03 deploy can verify the full chain. Plan 11-01 (edge function) and Plan 11-02 (client service) both landed in this session.

## Self-Check: PASSED

- src/services/plantKnowledgeService.ts: FOUND
- scripts/smoke-phase11.mjs: FOUND
- Commit 9bf77f1 (Task 1): FOUND
- Commit 4948633 (Task 2): FOUND
- Commit af3788a (Task 3): FOUND
