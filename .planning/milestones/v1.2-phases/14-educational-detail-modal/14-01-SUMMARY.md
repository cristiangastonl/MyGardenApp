---
phase: 14-educational-detail-modal
plan: 01
subsystem: types
tags: [type-extension, i18n-indirection, validator-extension, edu-02, edu-07, additive-schema]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    provides: smoke runner (scripts/smoke-phase14.mjs) with 6 W1.EDU-02.* + 1 W1.EDU-07.1 SKIP placeholders ready to flip
  - phase: 08-catalog
    provides: nutrient-conditional pattern in scripts/check-i18n-keys.mjs (line 67) — template for the 5 new conditional checks
  - phase: 04-precision-care
    provides: getTranslatedPlant nutrients i18n indirection (plantDatabase.ts line 1637) — template for 5 new fields
provides:
  - PlantDBEntry extended with 5 optional educational fields (careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale)
  - CareAction interface with optional fixed?/soilCheck? sub-fields
  - getTranslatedPlant returns 5 new fields with i18n indirection (defaultValue fallback, returnObjects: true on placementAlternatives)
  - check-i18n-keys.mjs gate for 5 new fields with sub-field-level expansion on careAction (per Pitfall 5)
  - 7 of 19 smoke placeholders flipped from SKIP to PASS (W1.EDU-02.1..6 + W1.EDU-07.1)
affects: [14-02-storage-guard, 14-03-modal-restructure, 14-04-catalog, 14-05-catalog, 14-06-catalog, 14-07-catalog]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive optional-field extension on existing PlantDBEntry interface (no schema bump — catalog-only field, not Plant user data)"
    - "i18n conditional ternary at top level of getTranslatedPlant — avoids spurious 'missing key' warnings when entry doesn't declare the field"
    - "Sub-field-level validator expansion on nested-interface fields (careAction.fixed and careAction.soilCheck checked independently — entry with only fixed produces only fixed-missing errors)"
    - "returnObjects: true cast for array i18n keys (mirrors existing problems precedent)"

key-files:
  created: []
  modified:
    - src/types/index.ts (406 → 429 LOC, +23) — new CareAction interface + 5 optional PlantDBEntry fields
    - src/data/plantDatabase.ts (1705 → 1727 LOC, +22) — getTranslatedPlant returns 5 new fields with i18n indirection
    - scripts/check-i18n-keys.mjs (83 → 116 LOC, +33) — 5 conditional checks with sub-field expansion on careAction

key-decisions:
  - "All 5 PlantDBEntry fields are optional (?:) — required for backward compat with existing 64 catalog entries"
  - "CareAction declared as named interface BEFORE PlantDBEntry (project ordered-top-down convention) — unlocks reuse in section components in Plan 14-03"
  - "Both CareAction sub-fields independently optional — entry can declare only fixed (no soilCheck) or vice versa; section UI hides absent sub-blocks gracefully"
  - "Conditional ternary at top level for each scalar field in getTranslatedPlant — calling t() unconditionally would force a translation lookup even when the field is absent on the entry, polluting i18n's missing-key warnings"
  - "placementAlternatives uses returnObjects: true (mirrors existing problems pattern) with 'as string[]' cast for TS"
  - "Validator's careAction sub-field check is independent — pattern 'if (entry.careAction.fixed && !node.careAction.fixed)' enforces 'each locale satisfies the entry's declarations independently' contract"
  - "placementAlternatives length-1 floor in validator: empty array in locale file is invalid (signals content drift / authoring miss)"
  - "Existing nutrient-conditional pattern at line 67 PRESERVED VERBATIM — new checks ADDED below, not refactored — protects future plans that grep for 'line 67 nutrient if'"
  - "No schemaVersion bump — fields are additive optional on PlantDBEntry (catalog), not Plant (user data) — persistence envelope unaffected"

patterns-established:
  - "Hybrid i18n+catalog field pattern: (1) optional field on PlantDBEntry, (2) conditional ternary in getTranslatedPlant, (3) conditional check in check-i18n-keys.mjs — Plans 14-04..07 catalog content drops will be gated by step 3"
  - "Sub-field independence on nested interfaces (CareAction): types make sub-fields optional, getTranslatedPlant translates each sub-field independently with its own ternary, validator checks each sub-field independently"

requirements-completed: [EDU-02, EDU-07]

# Metrics
duration: 13 min
completed: 2026-05-05
---

# Phase 14 Plan 01: Foundation Summary

**Schema + i18n surface for educational detail modal — PlantDBEntry gains 5 optional fields (careAction/placementRecommended/placementAlternatives/placementAvoid/whyRationale) plus new CareAction interface; getTranslatedPlant surfaces them via i18n indirection mirroring nutrients; check-i18n-keys.mjs gates them via 5 conditional checks with sub-field expansion.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-05-05T02:24:19Z
- **Completed:** 2026-05-05T02:37:08Z
- **Tasks:** 3
- **Files modified:** 3 (+78 LOC total)

## Accomplishments

- `src/types/index.ts` — `CareAction` interface (5 LOC) + 5 optional fields on `PlantDBEntry` (15 LOC). All additive. `npx tsc --noEmit` exits 0; existing 64 catalog entries compile unchanged.
- `src/data/plantDatabase.ts` — `getTranslatedPlant()` body extended with 5 new fields. Each scalar field uses conditional ternary `plant.<field> ? t(...) : undefined`. `placementAlternatives` uses `returnObjects: true` with `as string[]` cast. `careAction` has independent sub-field translation for `fixed` and `soilCheck`. Mirrors existing nutrients pattern.
- `scripts/check-i18n-keys.mjs` — 5 conditional checks added below the existing nutrient block (line 67 preserved verbatim). Sub-field-level checks on `careAction.fixed` and `careAction.soilCheck`. Length-1 floor on `placementAlternatives`. Existing 64 entries vacuously pass — none declare new fields yet.
- Smoke runner: PASS 16/19 (was PASS 7/19 at Wave 0 baseline). All 6 W1.EDU-02.* + 1 W1.EDU-07.1 placeholders flipped from SKIP to PASS. 0 FAIL.
- All verification gates green: `npx tsc --noEmit` exits 0, `npm run check:i18n-keys` exits 0 (64 ids verified), `node scripts/smoke-phase14.mjs` exits 0.
- Phase 10 grep guard unchanged: `EXPO_PUBLIC_PERENUAL_API_KEY` count = 0 across all client-bundle paths.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend PlantDBEntry with 5 optional educational fields + CareAction interface** — `7cbd999` (feat)
2. **Task 2: Extend getTranslatedPlant() to return 5 new educational fields with i18n indirection** — `7d0d31d` (feat)
3. **Task 3: Extend scripts/check-i18n-keys.mjs with 5 conditional checks for the new educational fields** — `36b2c6d` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `src/types/index.ts` (MODIFIED, +23 LOC, 406 → 429) — new `CareAction` interface (with `fixed?: string` and `soilCheck?: string`) and 5 optional fields on `PlantDBEntry`: `careAction?: CareAction`, `placementRecommended?: string`, `placementAlternatives?: string[]`, `placementAvoid?: string`, `whyRationale?: string`.
- `src/data/plantDatabase.ts` (MODIFIED, +22 LOC, 1705 → 1727) — `getTranslatedPlant()` now returns the 5 new fields with i18n indirection. Each field uses the existing pattern (`ns: 'plants'`, `defaultValue: <original-value>`). `placementAlternatives` uses `returnObjects: true` (mirrors `problems` precedent). `careAction` has independent translation per sub-field.
- `scripts/check-i18n-keys.mjs` (MODIFIED, +33 LOC, 83 → 116) — 5 new conditional checks added below the existing nutrient block. `careAction` has sub-field-level expansion (independent checks on `fixed` and `soilCheck`). `placementAlternatives` enforces `length >= 1` if declared. Mirrors existing nutrient-conditional pattern.

## Final Smoke Runner State

```
[smoke-phase14] PASS 16/19 (3 placeholders skipped — Wave 1+ will flip)
```

### Placeholders Flipped (7)

| Label                                                                                          | From | To   |
| ---------------------------------------------------------------------------------------------- | ---- | ---- |
| W1.EDU-02.1: src/types/index.ts declares careAction?: optional field                           | SKIP | PASS |
| W1.EDU-02.2: src/types/index.ts declares placementRecommended?: string                         | SKIP | PASS |
| W1.EDU-02.3: src/types/index.ts declares placementAlternatives?: string[]                      | SKIP | PASS |
| W1.EDU-02.4: src/types/index.ts declares placementAvoid?: string                               | SKIP | PASS |
| W1.EDU-02.5: src/types/index.ts declares whyRationale?: string                                 | SKIP | PASS |
| W1.EDU-02.6: getTranslatedPlant body references all 5 new educational fields                   | SKIP | PASS |
| W1.EDU-07.1: scripts/check-i18n-keys.mjs has conditional checks for all 5 new fields           | SKIP | PASS |

### Remaining SKIPs (3) — Plan 14-03 territory

| Label                                                                                          | Flipped by  |
| ---------------------------------------------------------------------------------------------- | ----------- |
| W2.EDU-01.1-4: MyPlantDetailModal.tsx contains all 4 locked emoji anchors (🌿/🏠/ℹ️/⚙️)         | Plan 14-03  |
| W2.EDU-01.5: MyPlantDetailModal.tsx imports EducationalSection                                 | Plan 14-03  |
| W2.EDU-01.6: EducationalSection.tsx uses Reanimated v4                                         | Plan 14-03  |

### FAILs (0)

None.

## Verification Block

```
$ grep -c "export interface CareAction" src/types/index.ts          → 1
$ grep -c "careAction?:" src/types/index.ts                          → 1
$ grep -c "placementRecommended?: string" src/types/index.ts         → 1
$ grep -c "placementAlternatives?: string\[\]" src/types/index.ts    → 1
$ grep -c "placementAvoid?: string" src/types/index.ts               → 1
$ grep -c "whyRationale?: string" src/types/index.ts                 → 1
$ grep -c "ns: 'plants'" src/data/plantDatabase.ts                   → 12 (existing 5 + new 7)
$ grep -c "returnObjects: true" src/data/plantDatabase.ts            → 2 (problems + placementAlternatives)
$ grep -c "whyRationale" src/data/plantDatabase.ts                   → 2
$ grep -c "entry.careAction" scripts/check-i18n-keys.mjs              → 3
$ grep -c "entry.whyRationale" scripts/check-i18n-keys.mjs            → 1
$ grep -c "EDU-07" scripts/check-i18n-keys.mjs                        → 1
$ npx tsc --noEmit                                                   → exit 0
$ npm run check:i18n-keys                                            → exit 0 (64 ids verified)
$ node scripts/smoke-phase14.mjs                                     → exit 0 (PASS 16/19)
$ node scripts/smoke-phase14.mjs 2>&1 | grep -c "W1.EDU-02"          → 0
$ node scripts/smoke-phase14.mjs 2>&1 | grep -c "W1.EDU-07"          → 0
$ node scripts/smoke-phase14.mjs 2>&1 | grep -c "^FAIL"              → 0
$ grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json → 0 on every line
```

## Decisions Made

- **All 5 fields optional + CareAction sub-fields optional.** Per CONTEXT.md "Sub-blocks within sections hide gracefully when their backing field is missing." Required fields would break tsc on the existing 64 catalog entries immediately. Sub-field independence on careAction unlocks a content-authoring rhythm where entries can declare `fixed` first and `soilCheck` later (or vice versa) without forcing a paired commit.
- **Named CareAction interface (not inline object type) BEFORE PlantDBEntry.** Project ordered-top-down convention. Unlocks reuse in section components in Plan 14-03 (`CareActionSection.tsx` will import `CareAction` directly).
- **Conditional ternary at top level of each scalar field in getTranslatedPlant.** Pattern: `plant.placementRecommended ? t(...) : undefined`. Calling `t()` unconditionally would force a translation lookup even when the field is absent on the entry, polluting i18n's missing-key warnings during dev runs.
- **`returnObjects: true` ONLY on `placementAlternatives`.** Mirrors existing `problems` precedent at line 1636. The `as string[]` cast is required because i18next's `t()` with `returnObjects: true` returns `unknown` by default in TS typings.
- **Validator sub-field check independence.** Pattern: `if (entry.careAction.fixed && !node.careAction.fixed)` — each sub-field is checked independently. Per Pitfall 5: an entry with only `fixed` and no `soilCheck` must only produce `fixed-missing` errors when locale lacks `fixed` — never spurious `soilCheck-missing` errors.
- **`placementAlternatives` length-1 floor in validator.** Empty array in locale file is invalid (signals content drift / authoring miss). Pattern: `!Array.isArray(node.placementAlternatives) || node.placementAlternatives.length < 1`.
- **Nutrient block at line 67 preserved verbatim.** Lock-step preservation: any future plan that needs to read this file expects line 67 to be the nutrient `if`. New checks added BELOW (line 75+).

## Deviations from Plan

None - plan executed exactly as written.

The plan locked exact field shapes via `<interfaces>` block and exact validator additions via `<existing_patterns>` reference. All three tasks reproduced the locked shapes verbatim. No auto-fixes triggered (Rules 1-3) — the additive-only nature of the plan and the smoke runner's marker-regex SKIP gates kept every diff clean.

## Authentication Gates

None — all work is local/file-only. No external service calls.

## Issues Encountered

None — three TDD cycles (RED via smoke runner SKIP confirmation → GREEN via locked-shape edit → verification via tsc + smoke + check:i18n-keys) executed cleanly. No retries, no pre-commit hook failures, no type drift.

**Note on parallel work observation:** The smoke runner reported W1.EDU-06.1 (Plan 14-02 storage guard) and W1.EDU-05.* (Plan 14-02 override comparator) flipping to PASS during this plan's execution. These flips were caused by `src/utils/overrideDetection.ts` (Plan 14-02 territory) already existing in the working tree at runner start (likely pre-staged work or a parallel-execution artifact). Plan 14-01 did not touch those files; the W1.EDU-06.1 / W1.EDU-05.* flips are tracked in Plan 14-02's summary, not here. Plan 14-01's owned placeholders are exactly the 7 listed above.

## User Setup Required

None — no external service configuration required. All artifacts run locally via `npx tsc --noEmit`, `npm run check:i18n-keys`, and `node scripts/smoke-phase14.mjs`.

## Next Phase Readiness

**Plan 14-02 (storage guard + override comparator + section labels)** runs in parallel with this plan — file-disjoint (touches `src/hooks/useStorage.tsx`, `src/utils/overrideDetection.ts`, `src/i18n/locales/{en,es}/common.json`). Wave 1 work after this plan: confirm Plan 14-02 has landed before Wave 2.

**Plan 14-03 (modal restructure)** waits on this plan + 14-02 — flips W2.EDU-01.* SKIPs by:
- Importing `CareAction` and the 5 new fields from `src/types/index.ts` (this plan's contract)
- Calling `getTranslatedPlant(raw)` at the modal's existing call site (line 83) — return shape now includes the 5 new fields
- Adding `EducationalSection` with 4 emoji anchors (🌿/🏠/ℹ️/⚙️) and Reanimated v4 worklet

**Plans 14-04..07 (catalog content authoring)** are gated by `scripts/check-i18n-keys.mjs` from this plan — every catalog drop that declares any of the 5 new fields on an entry MUST add the corresponding i18n keys to both `en/plants.json` and `es/plants.json`, or `npm run check:i18n-keys` will exit 1 with the missing-key list.

## Self-Check: PASSED

- [x] `src/types/index.ts` exists with `CareAction` interface and 5 optional fields on `PlantDBEntry` (FOUND)
- [x] `src/data/plantDatabase.ts` `getTranslatedPlant` body references all 5 new fields (FOUND)
- [x] `scripts/check-i18n-keys.mjs` has 5 conditional checks with sub-field expansion on careAction (FOUND)
- [x] Commit `7cbd999` exists in git log (FOUND)
- [x] Commit `7d0d31d` exists in git log (FOUND)
- [x] Commit `36b2c6d` exists in git log (FOUND)
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run check:i18n-keys` exits 0
- [x] `node scripts/smoke-phase14.mjs` exits 0 with PASS 16/19, 3 SKIP, 0 FAIL
- [x] All 7 owned placeholders (W1.EDU-02.1..6 + W1.EDU-07.1) flipped from SKIP to PASS
- [x] All acceptance criteria from `<acceptance_criteria>` blocks of all 3 tasks verified
- [x] Phase 10 grep guard unchanged: `EXPO_PUBLIC_PERENUAL_API_KEY` count = 0 across all client paths

---
*Phase: 14-educational-detail-modal*
*Plan: 01*
*Completed: 2026-05-05*
