---
phase: 04-schema-foundation-migration-core
plan: 02
subsystem: schema

tags: [migration, schema, types, mappers, light-level, water-schedule, water-mode, async-storage, idempotent, runtime-pure]

# Dependency graph
requires:
  - phase: 04-schema-foundation-migration-core
    provides: Wave 0 — smoke runner contract, v0 fixture, CI grep guard, npm scripts (typecheck, smoke:migration, check:legacy-fields)
provides:
  - LightLevel / WaterMode / WaterSchedule / PersistedAppData types
  - Plant.lightLevel / waterSchedule / waterMode / _migratedFromV0 fields
  - Plant.sunHours / waterEvery now @deprecated optional
  - sunHoursToLightLevel(h) — locked LIGHT-03 thresholds
  - applyColdFactor(warmDays, category?) — locked WATER-04 factor table, clamped [1, 30]
  - inferWaterMode(category?, dbId?) — suculentas OR allowlist → soil_check
  - migratePlant_0to1(plant) — preserves user customizations, idempotent guard, sets _migratedFromV0: true
  - runMigrations(persisted) — envelope-aware, idempotent (SCHEMA-03)
  - isVersioned(raw) / toPersisted(raw) — envelope helpers (SCHEMA-09)
  - cleanupBackup_v1_1() — exported helper for v1.2 to call once on launch
  - CURRENT_SCHEMA_VERSION (=1) and BACKUP_KEY constants
affects: [04-03, 04-04, 04-05, 04-06, 04-07, phase-5-pure-utility, phase-7-write-side, phase-8-catalog]

# Tech tracking
tech-stack:
  added: []  # No new runtime dependencies — types-only + pure functions
  patterns:
    - "Runtime-pure migration module: try/catch require() for plantInfo enables node-only smoke testing while preserving Metro static-bundling for app builds"
    - "Idempotency via two layers: schemaVersion short-circuit at runMigrations + per-plant defensive guard inside migratePlant_0to1"
    - "Per-instance customization preserved: mappers consume plant.sunHours / plant.waterEvery (NOT catalog defaults — PITFALLS MOD-3)"
    - "// @ts-expect-error markers as transitional shims when making required fields optional — keeps tsc green during multi-plan refactors"

key-files:
  created:
    - src/utils/migration.ts
  modified:
    - src/types/index.ts
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
    - src/components/PlantHealthDetail.tsx
    - src/data/careTips.ts
    - src/utils/notificationScheduler.ts
    - src/utils/plantInfo.ts
    - src/utils/plantLogic.ts

key-decisions:
  - "SOIL_CHECK_DB_IDS extended from planner's 6 entries to 7 to add 'aloe-vera' (catalog's canonical id) alongside the planner's literal 'aloe' (which is the legacy/fixture databaseId). Both are needed: smoke runner asserts inferWaterMode('interior', 'aloe') === 'soil_check', and real production plants link via the catalog id 'aloe-vera'."
  - "@ts-expect-error markers added at 9 consumer sites (PlantDiagnosisModal, PlantHealthDetail, careTips, notificationScheduler×4, plantInfo, plantLogic×3) — explicit per-line shims with 'consumer migration in plan 04-04' annotation. Plan 04-04 will replace each with a real lightLevel / waterSchedule read."
  - "migration.ts uses bare require() inside try/catch for plantInfo lookup — works in both Metro (static analysis) and Node ESM (ReferenceError caught, falls back to undefined category + plant.databaseId pass-through). No conditional require() helper needed."

patterns-established:
  - "Versioned envelope detection: isVersioned(raw) type guard + toPersisted(raw) coercion → runMigrations(persisted) returns AppData"
  - "Pure mapper module that catalog-rebalance phase will reuse for the same source-of-truth thresholds"
  - "@deprecated JSDoc + optional types as the migration-window pattern for replacing required fields without big-bang refactors"

requirements-completed: [SCHEMA-03, SCHEMA-08, SCHEMA-09, LIGHT-03, WATER-04]

# Metrics
duration: ~4min
completed: 2026-04-30
---

# Phase 4 Plan 02: Type System + Pure Migration Mappers Summary

**v1.1 type additions (LightLevel / WaterMode / WaterSchedule / PersistedAppData) + runtime-pure src/utils/migration.ts (mappers + idempotent runMigrations) — every Wave 0 smoke assertion (63/63) now passes.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-30T16:23:43Z
- **Completed:** 2026-04-30T16:28:18Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 7

## Accomplishments

- Plant interface gains lightLevel / waterSchedule / waterMode / _migratedFromV0 (all optional). Legacy sunHours / waterEvery now @deprecated optional. PersistedAppData envelope type added.
- src/utils/migration.ts (231 lines) ships pure LIGHT-03 / WATER-04 mappers, per-instance-customization-preserving migratePlant_0to1, envelope-aware runMigrations with two-layer idempotency, and lazy-import cleanupBackup_v1_1 helper for v1.2.
- npm run smoke:migration: 63/63 PASS (proves locked thresholds, preserved customizations, idempotency, defensive per-plant guard, schema version constant).
- npm run typecheck: green. npm run check:legacy-fields: green (zero new legacy reads outside the Wave 0 allowlist; @ts-expect-error markers chosen over guard-allowlist additions because they're per-line and self-explanatory).

## Task Commits

Each task was committed atomically:

1. **Task 1: v1.1 types + deprecated legacy fields** — `63096e2` (feat)
2. **Task 2: Pure migration mappers + runMigrations** — `b200164` (feat)

**Plan metadata commit:** added at end of plan execution.

## Files Created/Modified

**Created:**
- `src/utils/migration.ts` — Pure migration module (231 lines). Exports: CURRENT_SCHEMA_VERSION, BACKUP_KEY, sunHoursToLightLevel, applyColdFactor, inferWaterMode, migratePlant_0to1, isVersioned, toPersisted, runMigrations, cleanupBackup_v1_1.

**Modified:**
- `src/types/index.ts` — Added LightLevel, WaterMode, WaterSchedule, PersistedAppData. Plant interface gains 4 new optional v1.1 fields and marks 2 legacy fields as @deprecated optional.
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — 2 @ts-expect-error markers (waterEvery, sunHours reads into PlantDiagnosisContext).
- `src/components/PlantHealthDetail.tsx` — 1 @ts-expect-error marker (sunHours conditional render).
- `src/data/careTips.ts` — 1 @ts-expect-error marker (waterEvery filter in pest-root-rot rule).
- `src/utils/notificationScheduler.ts` — 4 @ts-expect-error markers (calculateSunWindow, groupPlantsBySunHours, sensitivePlants/hardyPlants filters).
- `src/utils/plantInfo.ts` — 1 @ts-expect-error marker (isSensitiveToSun heuristic).
- `src/utils/plantLogic.ts` — 3 @ts-expect-error markers (getNextWaterDate uses waterEvery 3 times).

## API Surface (downstream contract)

`src/utils/migration.ts` exports — Plans 03/04/05/06/07 import from here:

| Export | Signature | Purpose |
|---|---|---|
| `CURRENT_SCHEMA_VERSION` | `1` | Envelope version constant for storage layer |
| `BACKUP_KEY` | `'plant-agenda-v2.backup-pre-v1.1'` | AsyncStorage key for pre-migration backup |
| `sunHoursToLightLevel(h)` | `(number) => LightLevel` | Locked LIGHT-03 thresholds |
| `applyColdFactor(warmDays, category?)` | `(number, PlantCategory?) => number` | Locked WATER-04 factor table, clamped [1, 30] |
| `inferWaterMode(category?, dbId?)` | `(PlantCategory?, string?) => WaterMode` | suculentas / allowlist → 'soil_check' else 'fixed' |
| `migratePlant_0to1(plant)` | `(Plant) => Plant` | Per-plant v0→v1, idempotent, sets _migratedFromV0: true |
| `isVersioned(raw)` | `(unknown) => raw is PersistedAppData` | Type guard for envelope detection |
| `toPersisted(raw)` | `(unknown) => PersistedAppData` | Coerces raw to envelope (wraps unwrapped v0 as schemaVersion: 0) |
| `runMigrations(persisted)` | `(PersistedAppData) => AppData` | Idempotent migration entry point |
| `cleanupBackup_v1_1()` | `() => Promise<void>` | Lazy-import AsyncStorage helper for v1.2 to call once |

## SOIL_CHECK_DB_IDS Allowlist (validated against plantDatabase.ts)

After Wave 1 validation against `src/data/plantDatabase.ts`:

| dbId | In catalog | Notes |
|---|---|---|
| `aloe` | NO (catalog has `aloe-vera`) | RETAINED — legacy/fixture databaseId; smoke runner contract `inferWaterMode('interior', 'aloe') === 'soil_check'` |
| `aloe-vera` | YES (line 206) | ADDED — catalog's canonical id for production plants |
| `jade` | YES (line 636) | RETAINED |
| `echeveria` | YES (line 546) | RETAINED |
| `haworthia` | YES (line 1090) | RETAINED |
| `sedum` | YES (line 1112) | RETAINED |
| `cactus` | YES (line 524) | RETAINED |

Effective allowlist size: 7 entries (planner specified 6; 1 added).

## Smoke-Runner Stability

The Wave 0 smoke runner uses a single locked compile path: `typescript.transpileModule` (no fallback by policy). It worked end-to-end on first attempt:

- Compile path: `typescript.transpileModule` → `.tmp-migration.mjs` → dynamic `import()` → run assertions → cleanup tmp file in `finally`
- The bare `require('./plantInfo')` inside `migration.ts`'s try/catch resolves cleanly:
  - In Node ESM (smoke runner): `require` is undefined → ReferenceError → caught → `_findDatabaseEntry = null` → fallback path returns `{ category: undefined, dbId: plant.databaseId }`
  - In Metro bundler (production app): `require` is statically resolved → plantInfo.findDatabaseEntry available → category lookup works
- No `--experimental-strip-types` fallback was needed. The compile-path-locked policy stands.
- All 63 assertions pass on a clean run.

## Decisions Made

- **SOIL_CHECK_DB_IDS includes both 'aloe' and 'aloe-vera'**: smoke runner contract requires the legacy `'aloe'` entry; real catalog uses `'aloe-vera'`. Both are needed for correctness; documented in module comment.
- **@ts-expect-error over allowlist expansion**: 9 transitional consumer reads were marked with per-line `// @ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04`. This keeps each shim self-documenting, easy to grep for, and trivial to remove in plan 04-04 (the marker becomes a TS error if the underlying read is migrated correctly, providing a built-in cleanup signal).
- **Bare require() with try/catch (no helper)**: the planner's exact pattern works in both Node ESM and Metro because Metro statically follows `require()` calls and Node ESM throws a ReferenceError on the bare reference (caught by the try/catch). No `createRequire` or `eval('require')` indirection needed.
- **Defaults when legacy fields absent**: sunHours undefined → 3 (bright_indirect, safest indoor default); waterEvery undefined → 7 (per planner spec). Both documented inline.
- **migration.ts type imports use `import type`**: keeps the module runtime-pure (no value-side dependency on the types barrel), making the smoke runner's transpile path simpler and avoiding accidental React Native module-graph entanglement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @ts-expect-error markers at 9 consumer sites after making Plant.sunHours / Plant.waterEvery optional**
- **Found during:** Task 1 (final tsc check after types changes)
- **Issue:** Making `Plant.sunHours` and `Plant.waterEvery` optional (per plan-mandated `@deprecated` JSDoc + optional `?`) caused tsc to emit 12 errors across 7 files (PlantDiagnosisModal, PlantHealthDetail, careTips, notificationScheduler ×4, plantInfo, plantLogic ×3). The plan explicitly anticipated this and instructed: "if tsc breaks because of the optional change, the executor MUST add `// @ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` next to the breaking line and commit". This deviation is plan-prescribed, not improvised.
- **Fix:** Added 9 per-line `// @ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` markers. Some sites required only one marker for a multi-statement block (e.g., the JSX conditional `plant.sunHours > 0 && (...)`); others required one marker per usage (e.g., `getNextWaterDate` reads `plant.waterEvery` 3 times across 3 statements).
- **Files modified:** src/components/PlantDiagnosis/PlantDiagnosisModal.tsx, src/components/PlantHealthDetail.tsx, src/data/careTips.ts, src/utils/notificationScheduler.ts, src/utils/plantInfo.ts, src/utils/plantLogic.ts
- **Verification:** `npx tsc --noEmit` exits 0 after markers added. `npm run check:legacy-fields` continues to exit 0 because all 7 files were already in the Wave 0 allowlist.
- **Committed in:** 63096e2 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Extended SOIL_CHECK_DB_IDS with 'aloe-vera' (canonical catalog id)**
- **Found during:** Task 2 (validation step against plantDatabase.ts)
- **Issue:** Planner's literal allowlist `['aloe', 'jade', 'echeveria', 'haworthia', 'sedum', 'cactus']` includes `'aloe'` for the smoke-runner / fixture contract, but the catalog uses `'aloe-vera'` as the canonical id (verified at plantDatabase.ts:206). Without `'aloe-vera'` in the allowlist, real production plants linked via catalog (the common case after Phase 8 catalog rebalance) would NOT be classified as `soil_check` mode, defeating the planner's intent for the species. The plan instructs "for any id NOT present in plantDatabase.ts, REMOVE it" — but removing `'aloe'` would break the smoke runner's locked assertion. The correct fix is to add `'aloe-vera'` alongside (additive, not subtractive).
- **Fix:** Added `'aloe-vera'` to the SOIL_CHECK_DB_IDS Set. Documented in module comment that `'aloe'` is the legacy/fixture id and `'aloe-vera'` is the canonical catalog id; both are required for correctness across the v0-data and post-v1.1-catalog-rebalance scenarios.
- **Files modified:** src/utils/migration.ts
- **Verification:** Smoke runner still passes (63/63), and the catalog-resolved 'aloe-vera' species will now correctly default to soil_check mode in production.
- **Committed in:** b200164 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking shim, 1 missing-critical allowlist entry)
**Impact on plan:** Both deviations were anticipated/instructed by the plan or required to satisfy two simultaneous contracts (smoke runner + production catalog). Neither expands scope. Both are documented in code comments and traceable via git diff.

## Issues Encountered

None — both tasks executed cleanly. The plan's `try { require('./plantInfo') } catch {}` pattern worked exactly as designed in Node ESM (silently caught, fell back to undefined-category path). No surprises during smoke-runner execution.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Wave 2 unblocked.** Plans 04-03 (storage envelope + backup write) and 04-04 (notification refactor) can now both run in parallel:
  - 04-03 imports `runMigrations`, `isVersioned`, `toPersisted`, `CURRENT_SCHEMA_VERSION`, `BACKUP_KEY` from `src/utils/migration.ts`.
  - 04-04 refactors the 9 `@ts-expect-error`-marked consumer sites to read `plant.lightLevel` / `plant.waterSchedule.warm` instead. Each marker becomes a TS error if the underlying read is migrated correctly — built-in cleanup signal.
- **Wave 3+ unblocked.** Plans 04-05 (catalog rebalance) and 04-06 (UX tooltip) import the same mappers for parity with user-data migration.
- **Smoke runner ready for regression detection.** Any future change to `migration.ts` mappers or `migratePlant_0to1` will trigger smoke-runner failures if the locked thresholds drift.
- **No blockers introduced.** The 9 @ts-expect-error markers are explicitly transitional and will be removed in plan 04-04. Wave 0's allowlist already covers all touched files.

---
*Phase: 04-schema-foundation-migration-core*
*Completed: 2026-04-30*

---

## Self-Check: PASSED

Files verified to exist:
- src/utils/migration.ts
- src/types/index.ts
- src/components/PlantDiagnosis/PlantDiagnosisModal.tsx (modified)
- src/components/PlantHealthDetail.tsx (modified)
- src/data/careTips.ts (modified)
- src/utils/notificationScheduler.ts (modified)
- src/utils/plantInfo.ts (modified)
- src/utils/plantLogic.ts (modified)
- .planning/phases/04-schema-foundation-migration-core/04-02-SUMMARY.md

Commits verified to exist on `main`:
- 63096e2 (Task 1: types + deprecated legacy fields)
- b200164 (Task 2: pure migration mappers + runMigrations)

Verification commands (all exit 0):
- `npm run typecheck`
- `npm run smoke:migration` — 63/63 PASS
- `npm run check:legacy-fields`
