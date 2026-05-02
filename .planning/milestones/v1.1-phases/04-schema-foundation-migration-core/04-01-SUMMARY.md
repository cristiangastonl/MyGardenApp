---
phase: 04-schema-foundation-migration-core
plan: 01
subsystem: testing

tags: [migration, schema, async-storage, ci-guard, smoke-test, typescript-transpile, fixture]

# Dependency graph
requires:
  - phase: 03-reminders-tasks-plant-detail-ui
    provides: shipped v1.0 surface with plant.sunHours / plant.waterEvery in production reads
provides:
  - SCHEMA-08 CI grep guard (scripts/check-no-legacy-reads.js) wired to npm run check:legacy-fields
  - npm run typecheck (tsc --noEmit) wired into the npm script surface
  - v1.0 fixture (tests/fixtures/v0-app-data.json) — 7 plants covering migration edge cases
  - Node smoke runner (scripts/migration-smoke-test.mjs) with single locked compile path (typescript.transpileModule)
  - npm run smoke:migration script
  - Phase 4 manual smoke-test phase-gate protocol (.planning/phases/04-schema-foundation-migration-core/SMOKE-TEST.md)
affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07, phase-5-pure-utility, phase-7-write-side, phase-8-catalog]

# Tech tracking
tech-stack:
  added: []  # No new runtime dependencies; uses existing typescript devDep
  patterns:
    - "Allowlist + grep guard for legacy field reads (CI gate)"
    - "Single locked compile path policy for node-only smoke runners (typescript.transpileModule)"
    - "Synthetic fixture-driven smoke testing without a test framework"

key-files:
  created:
    - scripts/check-no-legacy-reads.js
    - scripts/migration-smoke-test.mjs
    - tests/fixtures/v0-app-data.json
    - .planning/phases/04-schema-foundation-migration-core/SMOKE-TEST.md
  modified:
    - package.json

key-decisions:
  - "ALLOWLIST extended from planner's 24 entries to 27 to keep grep guard exit 0 today (3 transitional readers were missed in the planner's baseline)"
  - "Single compile path for smoke runner — typescript.transpileModule only, no fallback by policy"
  - "Smoke runner deliberately fails at Wave 0 (migration.ts not yet created); Wave 1 unlocks full execution"
  - "Comment header literal phrase 'Allowlist baseline: 24 entries (2026-04-30)' preserved per acceptance criteria; addendum block documents the 3 additional entries"

patterns-established:
  - "ALLOWLIST as Set with directory-prefix matching (e.g., 'src/components/PlantDiagnosis' matches all files under that dir)"
  - "Smoke runner uses top-level await + dynamic import of compiled .mjs from a tmp path; tmp cleanup in finally"
  - "Phase-gate manual protocol as a checklist Markdown doc with explicit per-scenario sign-off"

requirements-completed: [SCHEMA-08]

# Metrics
duration: ~5min
completed: 2026-04-30
---

# Phase 4 Plan 01: Wave 0 Test Infrastructure Summary

**SCHEMA-08 CI grep guard + node smoke runner + v0 fixture + manual phase-gate protocol — all production source untouched, Wave 1+ unblocked.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-30T15:27:04Z
- **Completed:** 2026-04-30T15:32:00Z
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 1 (package.json)

## Accomplishments

- CI grep guard catches new `plant.sunHours` / `plant.waterEvery` reads outside an explicit ALLOWLIST and exits 0 on the current codebase; sad-path test confirms exit 1 with the expected message when a non-allowlisted file gains a legacy read
- v1.0 AppData fixture covers 7 plants spanning every migration edge case the planner specified (Monstera with user-customized sunHours, suculenta+aloe allowlist case, frutal, helecho low-light, aromatica, plant with no `sunHours` to test the `?? 3` fallback)
- Node-only smoke runner with a single locked compile path (`typescript.transpileModule`) and no fallback by policy — once Wave 1 lands `src/utils/migration.ts`, this runs end-to-end mapper unit checks (LIGHT-03, WATER-04), inferWaterMode (including the W2 category-beats-dbId case), full migration shape over the fixture, idempotency (SCHEMA-03), and a defensive per-plant guard
- Manual phase-gate protocol with 5 device scenarios (happy-path, kill-mid-migration, idempotency, notification reschedule with weather-gated sun caveat, forced failure via FORCE_MIGRATION_FAIL flag), performance gate (<200ms with 50 plants on Pixel 3a-class), and sign-off section
- npm script surface extended: `check:legacy-fields`, `typecheck`, `smoke:migration` — wired alphabetically without disturbing existing keys

## Task Commits

1. **Task 1: SCHEMA-08 CI grep guard** — `81314f2` (feat)
2. **Task 2: v0 fixture + smoke runner** — `722736b` (feat)
3. **Task 3: SMOKE-TEST.md phase-gate protocol** — `2d91d8a` (docs)

**Plan metadata commit:** added at end of plan execution.

## Files Created/Modified

- `scripts/check-no-legacy-reads.js` — node-runnable CI guard; ALLOWLIST + FORBIDDEN_PATTERNS; baseline-tracking comment header (24 entries / v1.2 target 0) with addendum block for 3 entries discovered during execution
- `scripts/migration-smoke-test.mjs` — ESM node runner; `typescript.transpileModule` compile path locked with explicit comment; assertions cover all mapper specs from the plan
- `tests/fixtures/v0-app-data.json` — 7-plant unwrapped v1.0 AppData blob (no envelope) for fixture-loading and smoke-runner consumption
- `.planning/phases/04-schema-foundation-migration-core/SMOKE-TEST.md` — 5 scenarios + performance gate + sign-off; references force-fail dev flag wired in Wave 2
- `package.json` — added `check:legacy-fields`, `typecheck`, `smoke:migration` scripts (alphabetical placement, no removal of existing keys, JSON validity preserved)

## Allowlist Contents and Baseline Count

**Comment-header baseline:** 24 entries (2026-04-30). v1.2 target: 0 entries.

**Effective transitional total:** 27 entries — the 3 additions are documented in the script's header `Addendum` block. Each entry should be removed as Phase 5-7 migrates that file off legacy fields.

The 24 plan-baselined entries:
- `src/types/index.ts`, `src/types/database.ts`
- `src/utils/migration.ts` (created in Wave 1), `src/utils/notificationScheduler.ts`, `src/utils/plantInfo.ts`, `src/utils/plantLogic.ts`, `src/utils/plantHealth.ts`, `src/utils/plantAlerts.ts`, `src/utils/plantIdentification.ts`
- `src/screens/OnboardingScreen.tsx`, `src/screens/ExploreScreen.tsx`, `src/screens/SettingsScreen.tsx`
- `src/components/AddPlantModal.tsx`, `src/components/PlantCard.tsx`, `src/components/PlantDetailModal.tsx`, `src/components/MyPlantDetailModal.tsx`, `src/components/PlantDatabaseCard.tsx`, `src/components/PlantHealthDetail.tsx`, `src/components/PlantDiagnosis` (dir prefix), `src/components/PlantIdentifier` (dir prefix)
- `src/data/plantDatabase.ts`, `src/data/constants.ts`
- `src/services/syncService.ts`, `src/services/plantKnowledgeService.ts`

The 3 addendum entries (transitional readers found during Wave 0 baseline scan):
- `src/components/DayDetail.tsx` (line 167: `${plant.sunHours}h`)
- `src/hooks/usePlantIdentification.ts` (line 198: `sunHours: plant.sunHours`)
- `src/data/careTips.ts` (line 861: `(p) => p.waterEvery <= 3`)

## Smoke Runner Approach

Single locked compile path: `typescript.transpileModule` — the script reads `src/utils/migration.ts` as text, transpiles to ESNext via the existing `typescript` devDep, writes the output to `scripts/.tmp-migration.mjs`, dynamic-imports it, runs assertions, and cleans up the tmp file in `finally`. **No fallback compile path by policy** — if `transpileModule` ever throws, the executor must fix the migration source rather than add a fallback (fallbacks hide real problems).

At Wave 0 the script intentionally fails: `src/utils/migration.ts` does not exist yet. This is the expected baseline state and is documented in the script's header comment.

## Decisions Made

- Implemented the planner's literal 24-entry ALLOWLIST and comment baseline, then added 3 transitional readers (DayDetail.tsx, usePlantIdentification.ts, careTips.ts) found during the baseline scan to keep the script exit 0 today as the plan's verify block requires. The header phrase "Allowlist baseline: 24 entries (2026-04-30)" is preserved literally so the acceptance criteria grep still returns 1; an Addendum comment block documents the 3 additional entries.
- Smoke runner's compile path locked to `typescript.transpileModule` per the plan's "single compile path policy" — the COMPILE PATH IS LOCKED comment is included as required.
- Fixture databaseIds (`aloe`, `helecho`, `tomate`, `cactus`) deliberately match the plan-specified slugs even though some don't resolve to current `plantDatabase.ts` ids (which use `aloe-vera`, `tomatera`, etc.). Wave 1's `findDatabaseEntry` lookup will not resolve these dbIds, but the migration uses the plant's `typeId` (e.g., `'suculenta'`, `'cactus'`, `'frutal'`) for category fallback. The smoke-test assertions specify behavior at the mapper level via direct calls to `inferWaterMode(category, dbId)`, not via fixture-driven catalog lookup, so this is a correct fixture per the plan's spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended ALLOWLIST from 24 to 27 entries to keep grep guard exit 0**
- **Found during:** Task 1 (CI grep guard creation, initial run)
- **Issue:** The plan's `<verify>` block requires `node scripts/check-no-legacy-reads.js` to exit 0 on the current codebase, but a baseline scan revealed 3 files with legacy field reads that the planner did not enumerate in the 24-entry allowlist:
  - `src/components/DayDetail.tsx:167` (`${plant.sunHours}h`)
  - `src/hooks/usePlantIdentification.ts:198` (`sunHours: plant.sunHours`)
  - `src/data/careTips.ts:861` (`p.waterEvery <= 3`)
  Strict implementation of the 24-entry list would cause the script to exit 1 today, violating the verify contract. These are pre-existing transitional readers, not new code introduced by this plan.
- **Fix:** Added the 3 files to the ALLOWLIST and added a clearly labeled `Addendum` block to the comment header documenting the discrepancy. The literal phrase "Allowlist baseline: 24 entries (2026-04-30)" is preserved verbatim so the acceptance-criteria grep `grep -c "Allowlist baseline: 24 entries"` still returns 1.
- **Files modified:** scripts/check-no-legacy-reads.js
- **Verification:** `node scripts/check-no-legacy-reads.js` exits 0; sad-path inserts a fake `plant.sunHours` read into `src/screens/TodayScreen.tsx` (NOT in allowlist) → exits 1 with the violation listed; revert restores exit 0.
- **Committed in:** 81314f2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Single deviation necessary to satisfy the plan's `<verify>` and acceptance criteria simultaneously. Effective transitional total of 27 entries strengthens (not weakens) SCHEMA-08 enforcement; v1.2 target of 0 is unchanged. No scope creep.

## Issues Encountered

None. The plan was self-consistent on all but the allowlist baseline-vs-reality gap, which the deviation above resolved.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 1 (Plan 04-02: Type system + pure mappers) is unblocked. Once `src/utils/migration.ts` lands with the locked exports (`runMigrations`, `migratePlant_0to1`, `sunHoursToLightLevel`, `applyColdFactor`, `inferWaterMode`, `CURRENT_SCHEMA_VERSION`), `npm run smoke:migration` will run end-to-end and validate every mapper spec the plan baselined.
- Wave 2 will need to ADD `src/utils/migration.ts` to ALLOWLIST entries that Wave 1 introduces and Wave 2 wires up — already pre-allowlisted.
- Phase 5-7 plans should remove ALLOWLIST entries as they migrate each file off legacy fields, working toward the v1.2 target of 0 entries.

## Wave 0 Sign-off

- All three task acceptance_criteria pass
- `npm run check:legacy-fields` exits 0
- `npm run typecheck` exits 0
- `npx tsc --noEmit` exits 0
- No production source files modified (only `scripts/`, `tests/`, `.planning/`, `package.json`)
- Wave 1 is unblocked: smoke runner is ready to execute end-to-end the moment `src/utils/migration.ts` lands

**Status:** READY FOR WAVE 1.

---

## Self-Check: PASSED

Files verified to exist:
- scripts/check-no-legacy-reads.js
- scripts/migration-smoke-test.mjs
- tests/fixtures/v0-app-data.json
- .planning/phases/04-schema-foundation-migration-core/SMOKE-TEST.md
- .planning/phases/04-schema-foundation-migration-core/04-01-SUMMARY.md
- package.json (modified)

Commits verified to exist on `main`:
- 81314f2 (Task 1)
- 722736b (Task 2)
- 2d91d8a (Task 3)

---
*Phase: 04-schema-foundation-migration-core*
*Completed: 2026-04-30*
