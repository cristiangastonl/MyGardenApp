---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Precision Care
status: executing
stopped_at: "Completed 04-04-PLAN.md (Wave 2 notificationScheduler + plantInfo lightLevel refactor + sibling shim cleanup; B4 null-guard parity holds; tsc green, smoke 63/63 PASS, check:legacy-fields exit 0; zero @ts-expect-error legacy-field shims remain)"
last_updated: "2026-04-30T21:44:48.636Z"
last_activity: "2026-04-30 — Plan 04-04 complete (Wave 2 notificationScheduler + plantInfo lightLevel refactor; cross-session resume after rate-limit; commits 87bc085+2b2829f+1a2a293 chain; all 9 Plan-02 ts-expect-error shims removed; tsc + check:legacy-fields + smoke:migration 63/63 all green)"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 7
  completed_plans: 4
  percent: 57
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29)

**Core value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Current focus:** v1.1 Precision Care — Phase 4: Schema Foundation, Waves 0+1+2 complete (Plans 01-04). Wave 3 (catalog mechanical update + UX banner + reschedule trigger — Plans 05/06/07) UNBLOCKED.

## Current Position

Phase: 4 of 9 (Schema Foundation + Migration Core)
Plan: 04 of 7 (Wave 2: notificationScheduler + plantInfo lightLevel refactor) — COMPLETE
Status: In progress (4/7 plans complete in Phase 4; Wave 2 fully done; Wave 3 unblocked)
Last activity: 2026-04-30 — Plan 04-04 complete (Wave 2 notificationScheduler.calculateSunWindow + groupPlantsByLightLevel + scheduleUVWarning all consume lightLevel with B4 null-guard parity; plantInfo.isSensitiveToSun consumes lightLevel; cross-session resume cleaned up the remaining 5 @ts-expect-error shims across plantLogic + careTips + PlantHealthDetail + PlantDiagnosisModal; tsc + check:legacy-fields + smoke:migration 63/63 all green)

Progress: [██████░░░░] 57% (v1.1 milestone, 4/7 phase 4 plans)

## Performance Metrics

**Velocity:**
- Total plans completed (v1.0): 7
- Average duration: ~9 min
- Total execution time: ~1.0 hours

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-camera-in-chat | 1 | 25 min | 25 min |
| 02-problem-tracking-core | 3 | 17 min | 6 min |
| 03-reminders-tasks-plant-detail-ui | 3 | 24 min | 8 min |

**Recent Trend:**
- v1.0 shipped 2026-03-19 across 7 plans
- v1.1 in progress: Phase 4 Plans 01+02+03+04 complete — Wave 0 test infra + Wave 1 types/mappers + Wave 2 storage wiring + Wave 2 scheduler refactor (~54 min total; both Plan 03 and Plan 04 had cross-session resumes due to rate limits)

**v1.1 Plan Metrics:**

| Phase / Plan | Duration | Tasks | Files |
|--------------|----------|-------|-------|
| Phase 04 / Plan 01 (Wave 0 test infra) | 5 min | 3 | 5 |
| Phase 04 / Plan 02 (Wave 1 types + mappers) | 4 min | 2 | 8 |
| Phase 04 / Plan 03 (Wave 2 storage envelope) | ~17 min | 2 | 1 |
| Phase 04 / Plan 04 (Wave 2 notificationScheduler + plantInfo lightLevel) | ~28 min | 2 (+1 deviation cleanup) | 6 |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.1 schema is a one-way migration with versioned envelope; legacy `sunHours`/`waterEvery` stay `@deprecated` optional for v1.1 only (SCHEMA-08), grep guard rejects new reads
- Three-zone seasonality (Northern temperate / Southern temperate / Tropical) from day one — never two-hemisphere only (SEASON-01, SEASON-02)
- Cold-season default uses category-factor heuristic during Phase 4 migration; Phase 8 catalog overrides per-`PlantDBEntry` with expert-vetted values (WATER-04 + WATER-07 + CAT-08)
- Soil-check plants get a new `'check_soil'` task type, no health-score penalty for overdue watering, low-frequency check-in notification (CRIT-5)
- Paywall lifts to App-level context (mirrors NotificationContext pattern); deferred callback after purchase, no modal stacking (CRIT-4 + PAY-01..03)
- Diagnosis resume is text-only by design; explicit copy + system-message context summary; message-count limit per diagnosis lifetime, not per session (MOD-4 + MOD-5 + DIAG-04..06)
- [Phase 04-schema-foundation-migration-core]: Wave 0 ALLOWLIST extended from planner's 24 entries to 27 to keep grep guard exit 0 today (3 transitional readers found in baseline scan); v1.2 target remains 0 entries
- [Phase 04-schema-foundation-migration-core]: Migration smoke runner uses single locked compile path (typescript.transpileModule) with no fallback by policy — fallbacks hide real source-level problems
- [Phase 04-schema-foundation-migration-core / Plan 02]: SOIL_CHECK_DB_IDS includes both 'aloe' (legacy/fixture) and 'aloe-vera' (canonical catalog id) — 7 entries vs planner's 6, additive deviation to satisfy two simultaneous contracts
- [Phase 04-schema-foundation-migration-core / Plan 02]: 9 transitional consumer reads of plant.sunHours / plant.waterEvery shimmed with per-line `// @ts-expect-error: legacy field made optional in v1.1; consumer migration in plan 04-04` markers — built-in cleanup signal when 04-04 migrates each read
- [Phase 04-schema-foundation-migration-core / Plan 02]: migration.ts is runtime-pure — bare `require('./plantInfo')` inside try/catch works in both Metro (static analysis) and Node ESM (ReferenceError caught), enabling the smoke runner without conditional-require helpers
- [Phase 04]: [Plan 03]: B2 simplified stage contract honored — single migration_failed emission with stage: 'load' covers any pre-write throw (read/parse/migrate/backup-write/envelope-write). Plan 07 owns separate stage: 'reschedule' emission.
- [Phase 04]: [Plan 03]: On migration throw, best-effort legacy parse runs in catch block so user keeps their plants on screen while migrationFailed flag drives banner. migration_failed event fires AFTER fallback parse so plantCount payload reflects what hydrated, not 0.
- [Phase 04]: [Plan 03]: Three-flag context surface (migrationFailed, migrationJustHappened, acknowledgeMigrationReschedule) enables Plan 06 banner and Plan 07 reschedule trigger to wire independently. Failure during migration sets migrationFailed=true AND didMigrate=false so reschedule effect won't fire on a failed migration.
- [Phase 04]: [Plan 04]: Two distinct lightLevel-to-hours mappings deliberately decoupled — scheduler uses {direct: 5, others: 0} so only 'direct' plants get scheduled outdoor reminders; display layer uses {direct: 6, bright_indirect: 4, medium_indirect: 2, low: 0/1} for human-readable text. Future plans should keep these separate rather than collapsing them.
- [Phase 04]: [Plan 04]: B4 null-guard parity invariant established — count of `calculateSunWindow(` callers minus declaration MUST equal count of `if (!window) return` lines (verified via grep). Locks the contract that callers cannot deref a null window without an explicit guard.
- [Phase 04]: [Plan 04]: Defensive fallback ladder applied uniformly across 5 consumers — v1.1 field → legacy field → safe default. Same pattern in scheduler (UV sensitivity), plantInfo (isSensitiveToSun), plantLogic (water interval), careTips (root-rot predicate), PlantHealthDetail/PlantDiagnosisModal (display values). Migration-failure code path (where Plan 03's catch block falls back to legacy parse) gets coherent behavior without crashing.
- [Phase 04]: [Plan 04]: PlantDiagnosisContext shape preserved — Phase 7 will rewrite edge-function prompts to consume waterSchedule + lightLevel directly. Until then, PlantDiagnosisModal derives waterEvery + sunHours from v1.1 fields so prompts stay stable. Decouples Phase 7 cadence from Phase 4 schema migration.
- [Phase 04]: [Plan 04]: All 9 transitional @ts-expect-error legacy-field shims (Plan 02) removed. v1.2 ALLOWLIST target (0 entries) one step closer — files still in allowlist now contain only defensive fallbacks, not primary reads.

### Pending Todos

None yet for v1.1.

### Blockers/Concerns

- **Phase 4 (Schema):** AsyncStorage write is not atomic from the user's perspective — kill-during-migration on real device is a release blocker (CRIT-1). Backup blob + idempotent re-runs + analytics events are mandated by SCHEMA-02/03/05/07.
- ~~**Phase 4 (Notifications):** All scheduled OS notifications must be cancelled and rebuilt against the new schema as part of migration completion (SCHEMA-06 + CRIT-3); `notificationScheduler` must be refactored to consume `lightLevel` before this can ship without throwing in `calculateSunWindow`.~~ **RESOLVED in Plan 04-04** — scheduler refactored, B4 null-guard parity established, Plan 07 reschedule trigger now safe to ship.
- **Phase 7 (Edge functions):** `chat-diagnosis`, `diagnose-plant`, `identify-plant` edge function source not yet read — backward-compat window design needs research before Phase 7 plans lock.
- **Phase 9 (Paywall):** Modal-stacking pattern is the highest revenue risk in v1.1; iOS+Android × free × upgraded × cancelled-purchase test matrix is mandatory before ship.
- **No test framework:** Migration regressions caught only by hand-run smoke test until a test runner is added in a future milestone.

## Session Continuity

Last session: 2026-04-30T21:44:48.636Z
Stopped at: Completed 04-04-PLAN.md (Wave 2 notificationScheduler + plantInfo lightLevel refactor + sibling shim cleanup; B4 null-guard parity holds; tsc green, smoke 63/63 PASS, check:legacy-fields exit 0; zero @ts-expect-error legacy-field shims remain)
Resume file: None
