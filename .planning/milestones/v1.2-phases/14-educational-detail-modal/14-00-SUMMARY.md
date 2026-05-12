---
phase: 14-educational-detail-modal
plan: 00
subsystem: testing
tags: [smoke-runner, typescript-transpile, async-storage-stub, single-compile-path]

# Dependency graph
requires:
  - phase: 12-unknown-plant-tracking
    provides: smoke-runner pattern with assertSkippableAsync + ts.transpileModule + auto-written async-storage stub
  - phase: 13-gesture-bottom-sheet-infrastructure
    provides: file-content-asserts pattern (readFileSync + regex) + scaffold PASS harness
provides:
  - Phase 14 smoke runner skeleton with 6 W0 scaffold PASSes + 12 SKIP placeholders for EDU-01/02/04/05/06/07
  - In-memory AsyncStorage + i18n stubs at scripts/.tmp-phase14/ (auto-written, gitignored)
  - npm run smoke:phase14 entry point for CI/dev
  - Locked label shapes (W1.EDU-02.*, W1.EDU-05.*, W1.EDU-06.*, W1.EDU-07.*, W2.EDU-01.*, W2.EDU-04.*) so Wave 1+ executors flip SKIP→PASS without touching the harness
affects: [14-01-foundation, 14-02-storage-guard, 14-03-modal-restructure, 14-04-catalog, 14-05-catalog, 14-06-catalog, 14-07-catalog, 14-08-checkpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-compile-path policy (Phase 4 lock) — typescript.transpileModule is the SOLE compile path; no esbuild/swc fallback"
    - "Auto-write gitignored stubs at runner startup (Phase 11/12 precedent extended)"
    - "Heuristic SKIP gate: marker regex distinguishes baseline (Wave N not landed) from partial-shape FAIL"
    - "Hybrid runner — file-content asserts for JSX/config (Phase 13 pattern) + ts.transpileModule for runtime logic (Phase 12 pattern) in one harness"

key-files:
  created:
    - scripts/smoke-phase14.mjs (~241 LOC)
    - scripts/.tmp-phase14/async-storage.mjs (auto-written, gitignored)
    - scripts/.tmp-phase14/i18n.mjs (auto-written, gitignored)
  modified:
    - package.json (smoke:phase14 script entry)
    - .gitignore (explicit scripts/.tmp-phase14/ line)

key-decisions:
  - "Auto-written stubs at runtime (NOT committed) — same pattern as Phase 11/12; the 2 stubs at scripts/.tmp-phase14/{async-storage,i18n}.mjs are gitignored"
  - "Heuristic SKIP gate (marker regex) per requirement — e.g., /careAction|placementRecommended|whyRationale/ — prevents false PASS during partial Wave 1 work; FAIL only fires when marker present + shape incomplete"
  - "EDU-04 has NO SKIP gate — IdentificationResults.tsx pre-select pattern already exists at lines 42-44 (Phase 7 closed it); the assertion is a regression check that MUST PASS at Wave 0 baseline"
  - "Modal-emoji SKIP gate triggers only when MyPlantDetailModal.tsx contains EducationalSection OR ANY of the 4 emojis — once Plan 14-03 starts touching the file, the SKIP becomes either PASS or FAIL"
  - "EDU-05 placeholder uses ts.transpileModule + dynamic import to assert behavioral correctness of compareUserVsCatalog (null=0, full-mismatch=3, partial=2) — runtime smoke, not file-content"
  - "Explicit .gitignore line scripts/.tmp-phase14/ added even though wildcard scripts/.tmp-*/ already covers it — plan acceptance criterion requires literal grep of phase-specific path to return 1"

patterns-established:
  - "Phase 14 hybrid: file-content asserts (modal/JSX) + ts.transpileModule (overrideDetection.ts) + readSafe helper for nullable file reads"
  - "12-skip placeholder lockdown: every Wave 1+ task verify command targets a label that already exists in the runner — no new label invention downstream"

requirements-completed: []  # Wave 0 scaffold — sets up smoke harness + SKIP placeholders only. Actual EDU-01/02/04/05/06/07 closure happens in Plans 14-01..03 when locked code shapes land.

# Metrics
duration: 3min
completed: 2026-05-05
---

# Phase 14 Plan 00: Wave 0 Scaffold Summary

**Phase 14 smoke runner harness wired with 6 W0 scaffold PASSes + 1 EDU-04 regression PASS + 12 SKIP placeholders covering every Wave 1+ requirement (EDU-01/02/04/05/06/07); auto-writes 2 gitignored stubs, single-compile-path locked to ts.transpileModule.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-05T02:08:22Z
- **Completed:** 2026-05-05T02:11:01Z
- **Tasks:** 1
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `scripts/smoke-phase14.mjs` (241 LOC) lands with single-compile-path policy: `ts.transpileModule` is the sole compile path; no esbuild/swc fallback
- Wave 0 baseline runs: **PASS 7/19 (12 SKIP, 0 FAIL, exit 0)** — exactly the predicted 6 W0 scaffold PASSes + 1 EDU-04 regression PASS
- 12 SKIP placeholders locked with stable labels — Wave 1+ plans flip them in-place by landing the locked code shapes (no new labels needed downstream)
- Auto-write at startup: `scripts/.tmp-phase14/async-storage.mjs` (in-memory Map-backed) + `scripts/.tmp-phase14/i18n.mjs` (defaultValue passthrough) — both gitignored, NOT committed
- `npm run smoke:phase14` wired (idempotent runs)

## Task Commits

1. **Task 1: Create smoke-phase14.mjs + 2 stubs + package.json + .gitignore** — `f8af882` (feat)

## Files Created/Modified

- `scripts/smoke-phase14.mjs` (CREATED, 241 LOC) — Phase 14 smoke runner; 6 W0 scaffold PASSes, 12 SKIP placeholders, ts.transpileModule single-compile-path
- `scripts/.tmp-phase14/async-storage.mjs` (AUTO-WRITTEN at runtime, gitignored) — in-memory Map-backed AsyncStorage stub
- `scripts/.tmp-phase14/i18n.mjs` (AUTO-WRITTEN at runtime, gitignored) — i18n stub returning defaultValue or key
- `package.json` (MODIFIED) — added `"smoke:phase14": "node scripts/smoke-phase14.mjs"` after `smoke:migration`
- `.gitignore` (MODIFIED) — explicit `scripts/.tmp-phase14/` line (wildcard already covers but acceptance criterion requires literal grep)

## Wave 0 Baseline Report

**Exact stdout final line:** `[smoke-phase14] PASS 7/19 (12 placeholders skipped — Wave 1+ will flip)`

### PASSes (7)

| ID    | Label                                                                  |
| ----- | ---------------------------------------------------------------------- |
| W0.1  | node:fs.readFileSync available                                         |
| W0.2  | typescript.transpileModule available (single-compile-path policy)      |
| W0.3  | __DEV__ shim present (false in smoke runner)                           |
| W0.4  | scripts/.tmp-phase14/async-storage.mjs exists (auto-written)           |
| W0.5  | scripts/.tmp-phase14/i18n.mjs exists (auto-written)                    |
| W0.6  | src/types/index.ts present at repo root                                |
| W2.EDU-04.1 | IdentificationResults.tsx still pre-selects from selectedPlant?.lightLevel ?? (regression) |

### SKIPs (12) — Wave 1+ flip targets

| Label                                                                                         | Flipped by  |
| --------------------------------------------------------------------------------------------- | ----------- |
| W1.EDU-02.1: src/types/index.ts declares careAction?: optional field                          | Plan 14-01  |
| W1.EDU-02.2: src/types/index.ts declares placementRecommended?: string                        | Plan 14-01  |
| W1.EDU-02.3: src/types/index.ts declares placementAlternatives?: string[]                     | Plan 14-01  |
| W1.EDU-02.4: src/types/index.ts declares placementAvoid?: string                              | Plan 14-01  |
| W1.EDU-02.5: src/types/index.ts declares whyRationale?: string                                | Plan 14-01  |
| W1.EDU-02.6: getTranslatedPlant body references all 5 new educational fields                  | Plan 14-01  |
| W1.EDU-07.1: scripts/check-i18n-keys.mjs has conditional checks for all 5 new fields          | Plan 14-01  |
| W1.EDU-06.1: useStorage.updatePlant has PROTECTED_USER_FIELDS + fromUserEdit option           | Plan 14-02  |
| W1.EDU-05.*: compareUserVsCatalog returns correct override list (null=0, full-mismatch=3, partial=2) | Plan 14-02  |
| W2.EDU-01.1-4: MyPlantDetailModal.tsx contains all 4 locked emoji anchors (🌿/🏠/ℹ️/⚙️)        | Plan 14-03  |
| W2.EDU-01.5: MyPlantDetailModal.tsx imports EducationalSection                                | Plan 14-03  |
| W2.EDU-01.6: EducationalSection.tsx uses Reanimated v4 (useSharedValue + withTiming + useAnimatedStyle) | Plan 14-03  |

### FAILs (0)

None — all assertions either PASSed (scaffold + EDU-04 regression) or SKIPped (Wave 1+ placeholders).

## Stub Auto-Write + Gitignore Verification

```
$ git check-ignore scripts/.tmp-phase14/async-storage.mjs
scripts/.tmp-phase14/async-storage.mjs   (exit 0 — gitignored)

$ git check-ignore scripts/.tmp-phase14/i18n.mjs
scripts/.tmp-phase14/i18n.mjs            (exit 0 — gitignored)

$ test -f scripts/.tmp-phase14/async-storage.mjs                       # exit 0 (auto-written)
$ test -f scripts/.tmp-phase14/i18n.mjs                                # exit 0 (auto-written)
$ grep -c "scripts/.tmp-phase14" .gitignore                            # 1
$ grep -c "smoke:phase14" package.json                                 # 1
$ grep -c "ts.transpileModule" scripts/smoke-phase14.mjs               # 2
$ grep -c "esbuild\|swc" scripts/smoke-phase14.mjs                     # 0
$ grep -c "BottomSheetModal\|@gorhom" scripts/smoke-phase14.mjs        # 0
$ grep -c "🌿\|🏠\|ℹ️\|⚙️" scripts/smoke-phase14.mjs                    # 6
$ grep -c "selectedPlant?.lightLevel" scripts/smoke-phase14.mjs        # 1
```

## Decisions Made

- **Auto-write pattern preserved.** Stubs are NOT committed; runner writes them via `writeFileSync` at startup if absent — mirrors Phase 11/12 convention exactly. The `scripts/.tmp-*/` wildcard in `.gitignore` already covers them, plus an explicit `scripts/.tmp-phase14/` line was added to satisfy the plan's literal-grep acceptance criterion.
- **Single-compile-path lock honored.** Only `ts.transpileModule` is used (2 references — once for the EDU-05 overrideDetection.ts compile, plus the W0.2 availability check). No esbuild/swc.
- **Heuristic SKIP gate per EDU group.** Each EDU-02/06/07 placeholder uses a marker-regex sentinel (e.g., `/careAction|placementRecommended|whyRationale/`) so an in-progress Wave 1 commit that lands the marker but not the full shape FAILs (loud signal) instead of silently SKIPping.
- **EDU-04 NO-SKIP exception.** The `selectedPlant?.lightLevel ??` pre-select pattern already exists at `IdentificationResults.tsx:42-44` (Phase 7). The assertion is a regression check — MUST PASS at Wave 0 baseline. Confirmed: 1 of the 7 W0-baseline PASSes is EDU-04.
- **No Phase 21 leakage.** Zero `BottomSheetModal` or `@gorhom` references in the runner — Phase 14 keeps fullscreen Modal per CONTEXT.md lock; bottom-sheet adoption is Phase 21 territory.
- **No EDU-03 catalog assertions.** Plans 14-04..07 use `npm run check:i18n-keys` exclusively for catalog content validation — extending `scripts/check-i18n-keys.mjs` per Plan 14-01 is the EDU-03 verification gate, not the smoke runner. The EDU-07.1 placeholder asserts the validator extension itself, not catalog content.

## Deviations from Plan

None - plan executed exactly as written.

The plan specified 12 SKIP placeholders (≥8 acceptance threshold; actual = 12 — exceeds). Wave 0 baseline PASS line is `PASS 7/19 (12 placeholders skipped)` — exactly the predicted ratio (6 W0 scaffold + 1 EDU-04 regression = 7 PASS; 12 SKIP; 0 FAIL).

The `.gitignore` already contained a `scripts/.tmp-*/` wildcard that covers `scripts/.tmp-phase14/`, but the plan's acceptance criterion requires `grep -c "scripts/.tmp-phase14" .gitignore` to return 1. The explicit phase-14 line was added per spec — no deviation, just documentation that the wildcard line is preserved alongside the explicit line.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. All artifacts run locally via `node scripts/smoke-phase14.mjs` or `npm run smoke:phase14`.

## Next Phase Readiness

**Plan 14-01 (foundation: types + getTranslatedPlant + validator)** can run immediately — flips W1.EDU-02.1..6 + W1.EDU-07.1 SKIPs to PASS by landing:
- 5 optional fields on `PlantDatabaseEntry` in `src/types/index.ts`
- 5 new conditional reads in `getTranslatedPlant` body in `src/data/plantDatabase.ts`
- 5 new conditional checks in `scripts/check-i18n-keys.mjs`

**Plan 14-02 (storage guard + override detection)** can run in parallel with 14-01 (file-disjoint) — flips W1.EDU-06.1 + W1.EDU-05.* SKIPs to PASS by landing:
- `PROTECTED_USER_FIELDS` + `fromUserEdit` option in `src/hooks/useStorage.tsx`
- `compareUserVsCatalog` export in new `src/utils/overrideDetection.ts`

**Plan 14-03 (modal restructure)** waits on 14-01 + 14-02 — flips W2.EDU-01.* SKIPs by landing:
- 4 emoji anchors + `EducationalSection` import in `src/components/MyPlantDetailModal.tsx`
- New `src/components/plant-detail/EducationalSection.tsx` with Reanimated v4 worklet

**Wave 1+ runner-skeleton untouched.** Future plans satisfy the 12 locked SKIP labels — no new label invention required.

## Self-Check: PASSED

- [x] `scripts/smoke-phase14.mjs` exists (FOUND)
- [x] Commit `f8af882` exists (FOUND in git log)
- [x] `scripts/.tmp-phase14/async-storage.mjs` exists (FOUND, gitignored)
- [x] `scripts/.tmp-phase14/i18n.mjs` exists (FOUND, gitignored)
- [x] `npm run smoke:phase14` exits 0
- [x] `node scripts/smoke-phase14.mjs` exits 0 with PASS 7/19, 12 SKIP, 0 FAIL
- [x] All 16 acceptance criteria from `<acceptance_criteria>` block verified

---
*Phase: 14-educational-detail-modal*
*Plan: 00*
*Completed: 2026-05-05*
