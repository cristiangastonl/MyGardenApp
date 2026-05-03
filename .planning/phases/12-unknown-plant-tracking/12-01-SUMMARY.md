---
phase: 12-unknown-plant-tracking
plan: 01
subsystem: infra
tags: [asyncstorage, local-first, instrumentation, tracking, typescript]

# Dependency graph
requires:
  - phase: 12-00
    provides: smoke-phase12.mjs harness with 7 SKIP placeholders for TRACK-01
provides:
  - src/services/unknownPlantTracker.ts — local-first catalog-miss tracker with trackUnknownPlant (fire-and-forget) and getUnknownPlantsReport (sorted read)
affects:
  - 12-02 (TRACK-02 call site in getEnrichedPlantData)
  - 12-03 (TRACK-03 Settings dev-tools report UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Local-first instrumentation service with dual try/catch silent error handling
    - Lowercase+trim canonicalization for case-insensitive AsyncStorage key merging
    - Fire-and-forget async function pattern with __DEV__ console.warn gating

key-files:
  created:
    - src/services/unknownPlantTracker.ts
  modified:
    - scripts/smoke-phase12.mjs

key-decisions:
  - "Smoke runner P1.1-P1.5 stub imports changed from cache-busted (?t=Date.now()) to bare URL so removeItem operates on the same Map singleton the tracker uses — the cache-bust design from Plan 12-00 was correct for W0.4/W0.5 but incorrect for TRACK-01 behavior tests that need shared state with the tracker"
  - "trackUnknownPlant uses dual try/catch: outer catches all errors including AsyncStorage.setItem failures; inner catches only JSON.parse to reset record to {} — enables write-over-corrupt behavior"
  - "No throw keyword anywhere (including comments) per acceptance criteria — renamed comment text to avoid grep false positives"

patterns-established:
  - "Pattern: Dual try/catch for fire-and-forget services — outer for full silent swallow, inner for specific JSON.parse reset"
  - "Pattern: Bare AsyncStorage import (no dynamic import) so smoke runner can share the same stub singleton via module cache"

requirements-completed: [TRACK-01]

# Metrics
duration: 7min
completed: 2026-05-03
---

# Phase 12 Plan 01: Unknown Plant Tracker Service Summary

**AsyncStorage-backed local-first catalog-miss tracker with lowercase+trim canonicalization, silent fire-and-forget error handling, and sorted report — smoke runner reports PASS 12/12**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-03T12:24:05Z
- **Completed:** 2026-05-03T12:31:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Created `src/services/unknownPlantTracker.ts` (113 LOC) with named exports `trackUnknownPlant`, `getUnknownPlantsReport`, and `UnknownPlantEntry` type
- Zero Supabase/network/telemetry imports — strictly local AsyncStorage under key `@unknown_plants`
- All 7 TRACK-01 behavior assertions flipped from SKIP to PASS in smoke-phase12.mjs
- Fixed smoke runner stub import bug (P1.1-P1.5 used cache-busted ?t= imports that couldn't share the tracker's Map singleton)

## Task Commits

1. **Task 1: Create unknownPlantTracker.ts with trackUnknownPlant + getUnknownPlantsReport** - `dce8712` (feat)

**Plan metadata:** (pending final commit)

## Smoke Runner Final Result

```
[smoke-phase12] PASS 12/12
```

5 Wave 0 scaffold assertions + 7 TRACK-01 behavior assertions. No SKIPs remaining.

## TRACK-01 Behavior Assertions (7 flipped from SKIP to PASS)

1. `W1.TRACK-01.insert: first track inserts 1 entry with count=1 [Plan 12-01]`
2. `W1.TRACK-01.increment: second track increments count to 2 [Plan 12-01]`
3. `W1.TRACK-01.lowercase: mixed-case + whitespace inputs merge into single canonical entry, count=3 [Plan 12-01]`
4. `W1.TRACK-01.sorted: report sorted desc by count [Plan 12-01]`
5. `W1.TRACK-01.firstSeen: firstSeen immutable across re-tracks; lastSeen advances [Plan 12-01]`
6. `W1.TRACK-01.silent-error: AsyncStorage setItem failure is swallowed (no throw) [Plan 12-01]`
7. `W1.TRACK-01.json-parse-fail: corrupt storage → empty array, no throw [Plan 12-01]`

## Files Created/Modified

- `src/services/unknownPlantTracker.ts` (113 lines) — local-first catalog-miss tracking service; exports `trackUnknownPlant`, `getUnknownPlantsReport`, `UnknownPlantEntry`
- `scripts/smoke-phase12.mjs` — fixed P1.1-P1.5 stub imports from `?t=Date.now()` to bare URL for correct Map singleton sharing

## Decisions Made

1. **Smoke runner stub import fix (Rule 1 - Bug):** Plan 12-00's smoke runner used `import(STUB_AS + '?t=' + Date.now())` in P1.1-P1.5, which creates fresh Map instances isolated from the tracker's cached module. The `removeItem` calls could not reset the tracker's state between tests. Fixed by using bare `import(STUB_AS)` for P1.1-P1.5 so all parties reference the same module-cached Map singleton. P1.6 and P1.7 already used bare imports correctly (for monkey-patching).

2. **No `throw` keyword in comments:** The acceptance criterion `grep -cE "throw\b" src/services/unknownPlantTracker.ts` = 0 was interpreted as matching anywhere in the file including comments. All comment text containing "throw" was reworded to avoid false-positive matches while preserving meaning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed smoke-phase12.mjs test isolation — P1.1-P1.5 used cache-busted stubs**
- **Found during:** Task 1 verification (smoke runner reported FAIL 3/12 on first run)
- **Issue:** `import(STUB_AS + '?t=' + Date.now())` creates a fresh Map instance per import. The tracker's compiled module imports AsyncStorage without a query string, so it gets the bare-URL cached Map. The test's `removeItem('@unknown_plants')` operated on a different Map, leaving the tracker's store unreset between tests. P1.2 failed because it saw count=3 (accumulated from P1.1) instead of count=2.
- **Fix:** Changed P1.1-P1.5 in smoke-phase12.mjs to use `import(STUB_AS)` (bare URL, no cache-bust) so `removeItem` operates on the same Map the tracker writes to.
- **Files modified:** `scripts/smoke-phase12.mjs`
- **Verification:** `node scripts/smoke-phase12.mjs` reports `PASS 12/12` after fix
- **Committed in:** `dce8712` (task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — smoke runner design bug)
**Impact on plan:** Fix was necessary for smoke runner to pass. The tracker implementation itself is correct and unchanged. The smoke runner fix aligns the test isolation strategy with the tracker's module caching behavior.

## Issues Encountered

No Supabase/network/telemetry verification: `grep -c "supabase\|fetch(\|axios" src/services/unknownPlantTracker.ts` = 0. PROJECT.md non-negotiable preserved.

SEC-01 guard clean: `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` shows count 0 on all lines.

## Next Phase Readiness

- `trackUnknownPlant(scientificName, commonName?, family?): Promise<void>` — ready for Plan 02 (TRACK-02) fire-and-forget call from `getEnrichedPlantData` in `plantKnowledgeService.ts`
- `getUnknownPlantsReport(): Promise<UnknownPlantEntry[]>` — ready for Plan 03 (TRACK-03) Settings dev-tools report UI
- Plans 02 and 03 can run in parallel — both depend only on Plan 01's exported contract which is now complete
- Smoke runner PASS 12/12 is the Wave 1 baseline for remaining Phase 12 plans

---
*Phase: 12-unknown-plant-tracking*
*Completed: 2026-05-03*
