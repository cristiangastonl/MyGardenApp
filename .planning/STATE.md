---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Precision Care
status: completed
stopped_at: Completed 07-04-PLAN.md
last_updated: "2026-05-01T22:30:21.118Z"
last_activity: 2026-05-01 — Plan 05-05 complete (Wave 4 — notificationScheduler season-aware via latitude threading into createMorningContent + scheduleMorningReminder; 'check_soil' branches added across 8 component discriminator chains in DayDetail/DayDetailModal/MonthCalendar; multi-stage tsc handoff closed via Rule 3 PlantsScreen<PlantCard> + 3 cascading prop ratchets; project-wide tsc GREEN; smoke 106/106 unchanged; B4 invariant preserved; SEASON-04 satisfied transitively (no direct getWaterSeason import in scheduler — single source of truth via call-chain getTasksForDay). Phase 5 ships 5/5 plans.)
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 26
  completed_plans: 21
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29)

**Core value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Current focus:** v1.1 Precision Care — Phase 5 COMPLETE (5/5 plans). Hemisphere/Season Helpers + Pure-Utility Switchover shipped: SEASON-01..04, WATER-05, WATER-06 locked across plantLogic, plantHealth, calculateGardenHealth, wateringRecommendations, PlantCard, notificationScheduler, and 5 component callsites. v1.1 milestone complete pending Phase 6 UX polish (NEXT).

## Current Position

Phase: 5 of 6 (Hemisphere/Season Helpers + Pure-Utility Switchover) — COMPLETE
Plan: 5 of 5 — COMPLETE
Status: Phase 5 complete (5/5 plans). Multi-stage tsc handoff Plan 03 → 04 → 05 fully closed; project-wide `npx tsc --noEmit` exits 0; smoke 106/106 PASS; legacy-fields ALLOWLIST count unchanged at 27; B4 null-guard parity invariant preserved. Next: Phase 6 (UX badges + empty-state copy + dedicated 'check_soil' visual differentiation if telemetry warrants).
Last activity: 2026-05-01 — Plan 05-05 complete (Wave 4 — notificationScheduler season-aware via latitude threading into createMorningContent + scheduleMorningReminder; 'check_soil' branches added across 8 component discriminator chains in DayDetail/DayDetailModal/MonthCalendar; multi-stage tsc handoff closed via Rule 3 PlantsScreen<PlantCard> + 3 cascading prop ratchets; project-wide tsc GREEN; smoke 106/106 unchanged; B4 invariant preserved; SEASON-04 satisfied transitively (no direct getWaterSeason import in scheduler — single source of truth via call-chain getTasksForDay). Phase 5 ships 5/5 plans.)

Progress: [██████████] 100% (Phase 5: 5/5 plans complete; v1.1 overall: 12/12 plans)

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
| Phase 04 / Plan 05 (Wave 3 catalog codemod) | ~9 min | 2 (+1 blocking-bridge cleanup) | 4 |
| Phase 04 / Plan 06 (Wave 3 UX banner + tooltip + i18n) | ~9 min | 3 | 6 |

*Updated after each plan completion*
| Phase 04 P07 | 5min | 1 tasks | 1 files |
| Phase 05 P01 | 2 min | 1 tasks | 1 files |
| Phase 05 P02 | 4 min | 3 tasks | 5 files |
| Phase 05 P03 | 8 min | 3 tasks | 6 files |
| Phase 05 P04 | 8 min | 3 tasks | 9 files |
| Phase 05-hemisphere-season-helpers-pure-utility-switchover P05 | 11 | 4 tasks | 8 files |
| Phase 06-ui-read-side-propagation P01 | 3 | 3 tasks | 3 files |
| Phase 06-ui-read-side-propagation P02 | 3 | 3 tasks | 3 files |
| Phase 06-ui-read-side-propagation P04 | 2 | 1 tasks | 1 files |
| Phase 06-ui-read-side-propagation P05 | 2 | 2 tasks | 2 files |
| Phase 06-ui-read-side-propagation P03 | 5 | 2 tasks | 2 files |
| Phase 06 P06 | 4 | 1 tasks | 1 files |
| Phase 07 P01 | 4 | 4 tasks | 4 files |
| Phase 07 P02 | 15 | 6 tasks | 19 files |
| Phase 07-ui-write-side-onboarding-edge-function-contract P04 | 4 | 2 tasks | 3 files |

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
- [Phase 04]: [Plan 05]: Catalog codemod compiles src/utils/migration.ts via typescript.transpileModule on-the-fly to reuse the canonical Plan-02 mappers (sunHoursToLightLevel / applyColdFactor / inferWaterMode) — guarantees zero drift between user-data migration and catalog seeding. One source of truth across both axes.
- [Phase 04]: [Plan 05]: Brace-depth-aware line walker (per-character string/comment state tracking + reverse-iteration injection) chosen over flat regex for catalog mass-edit. Pattern reusable for Phase 8 catalog rebalance.
- [Phase 04]: [Plan 05]: Catalog actually has 50 entries (not the 56 the planner expected). Stale count from a pre-Phase-4 commit titled "expand plant catalog to 49"; threshold satisfied in spirit (every entry mapped, no skips).
- [Phase 04]: [Plan 05]: Safe-default fallback (??) chosen over @ts-expect-error in plantIdentification.convertPlantNetResult because the bridge is a real value coercion (PlantDBEntry → IdentifiedPlant required-field gap), not a type assertion. @ts-expect-error would itself become unused and error.
- [Phase 04-schema-foundation-migration-core]: [Plan 06]: Migration tooltip placed sibling-to-ScrollView (inside container View, not overlay) so absolute backdrop overlays only the modal card content, not the dimmed full-screen backdrop. W3 line guard satisfied (tip > </ScrollView> AND < </Modal>).
- [Phase 04-schema-foundation-migration-core]: [Plan 06]: Tooltip seen-state in separate AsyncStorage key 'migration-tooltip-seen-v1.1' (Record<plantId, true>) — keeps domain model clean; v1.2 cleanup is a single removeItem paired with cleanupBackup_v1_1().
- [Phase 04-schema-foundation-migration-core]: [Plan 06]: ES voseo verification scoped via JSON.parse(.migration) subtree, NOT file-wide grep — prevents false positives from voseo verbs elsewhere in es/common.json (W5 contract).
- [Phase 04]: [Plan 07]: B1 invariant — scheduleSmartSunNotifications NOT imported or called in App.tsx (grep -c == 0). Sun reschedule continues via TodayScreen's existing useNotifications hook once weather loads (lightLevel-aware after Plan 04). App-level reschedule is morning-only because the smart-sun scheduler short-circuits on !weather and would no-op at App-level.
- [Phase 04]: [Plan 07]: One-shot reschedule with finally-acknowledge — useEffect calls acknowledgeMigrationReschedule() in finally regardless of success/failure. Failure path emits trackEvent('migration_failed', { stage: 'reschedule' }) per Plan 03's separation-of-stages contract. No retry loop — partial reschedule acceptable per CONTEXT.md.
- [Phase 04]: [Plan 07]: MigrationBanner placed sibling-to-NavigationContainer (above MainTabs) inside NotificationContext.Provider — visible on every tab, not just Hoy. bannerDismissed is local React state only (not persisted), so banner reappears next launch if migration still fails (matches CONTEXT.md idempotent-retry stance).
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 01]: Phase-5 smoke-runner scaffold uses ENOENT-tolerant try-catch — non-ENOENT errors propagate so source-level bugs surface; ENOENT swallowed only at Wave 0 to keep 63/63 contract green until Plan 02 lands seasonality.ts
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 01]: Single-compile-path policy extended verbatim from Phase 4 to Phase 5 — 2 ts.transpileModule( invocations (one per source), 0 esbuild/swc fallbacks. Policy comments documenting the lock count semantically as guards, not violations of grep-count acceptance criteria.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 01]: Two distinct Phase-5 placeholder messages — 'skipped — seasonality.ts not yet present' (Wave 0, ENOENT branch) vs 'section reached, no assertions yet (placeholder)' (Plan-02-onward, present-but-empty branch). Gives downstream planners an unambiguous landing signal that the file flipped from absent to present.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 02]: TZ-safe Date assertions in smoke runner — use new Date(YYYY, monthIdx, DD) (local-time multi-arg constructor) instead of new Date('YYYY-MM-DD') ISO strings. Runner is in America/Buenos_Aires UTC-3, so ISO 'Apr 1' parses as UTC midnight which getMonth() returns as local Mar 31. Pattern is now mandatory for Plans 03/04/05 month-boundary assertions.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 02]: ES voseo regex uses /i flag for verb-presence checks (sentence-leading 'Tocá' is naturally capitalized; strict /tocá/ would miss). Tuteo-rejection regex stays case-sensitive (/\btoca\b|\briega\b/) — tuteo verbs are themselves lowercase tokens; case-insensitive rejection would over-match the voseo body.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 02]: getWaterSeason naming chosen over getSeason to coexist with src/utils/tipSelector.ts > getSeason (4-season UI palette). Different files, different export names, same conceptual namespace ('what season is it?') but orthogonal taxonomies. JSDoc cross-reference kept in seasonality.ts to document the coexistence for future maintainers.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 02]: Top-level 'tasks' i18n key inserted between 'dayDetail' and 'dataMigration' blocks — keeps existing nested label fragments (dayDetail.taskWater, notifications.water) untouched while giving full UX sentences (checkSoilBody) their own namespace. RESEARCH §Pitfall 7 pattern.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 03]: Mode-as-dispatcher pattern locked — waterMode === 'soil_check' branches the task type emit ('check_soil' icon 🤚 + tasks.checkSoil i18n label) but the cadence pathway (next-water-date math) is shared with 'fixed' mode plants via getSeasonalInterval. Single source of truth across modes per CONTEXT.md. Future v1.2/v2.0 modes (auto_water_sensor, manual_only) MUST follow this — emit different task type, share cadence math.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 03]: Pitfall 5 first-encounter day-1 nudge for soil_check plants — plants with waterMode==='soil_check' and lastWatered===null emit 'check_soil' on day-1 (NOT suppressed). Matches 'Hoy is non-empty for new plants' UX expectation; first user interaction with a new cactus is naturally a check-in (touch the soil). Asserted in smoke runner via pNew fixture.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 03]: tsc handoff is multi-stage across 6 files, NOT 'only plantHealth.ts' as the planner's success-criteria phrasing implied. Actual handoff: plantHealth.ts (Plan 04) + DayDetail.tsx + DayDetailModal.tsx + MonthCalendar.tsx + PlantsScreen.tsx + notificationScheduler.ts (all 5 Plan 05). Future planners should treat the affects: field in dependency-graph as authoritative for downstream-caller enumeration, not just the <interfaces> block.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 03]: Smoke-runner stub idiom for src/utils/* with React/i18n deps — regex-rewrite import specifiers ('../i18n', '../types', './seasonality', './dates') to scripts/.tmp-*.mjs paths BEFORE typescript.transpileModule, write minimal stub modules (i18n no-op translator, types empty module, dates real impl), then dynamic-import the compiled module. Reusable verbatim for Plan 04 (plantHealth.ts) and Plan 05 (notificationScheduler.ts) when they extend the smoke runner. Single-compile-path policy preserved (still typescript.transpileModule, no esbuild/swc fallbacks).
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 04]: WATER-06 gate idiom — `if (penaltyCondition && plant.waterMode !== 'soil_check')` — the second clause defensively skips ONLY for `'soil_check'`, NEVER for `undefined` (legacy/migration-failure path). Future health-axis additions targeting only fixed-mode plants should use the same idiom (single explicit string compare, never a !== nullish check). RESEARCH §Anti-Pattern locked.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 04]: Two-stub compile-and-load pattern for cross-module smoke testing — when test A needs production semantics of util X (advance-loop) and test B needs different semantics (no-advance to force a past-date), write TWO temp stubs (.tmp-X-prod.mjs + .tmp-X-overdue.mjs) and load each in its own compiled-on-the-fly consumer. Plan 04 used .tmp-plantLogic.mjs (real, WATER-05 dispatch tests) and .tmp-plantLogic-overdue.mjs (no-advance, WATER-06 penalty tests). Reusable for any future smoke test where production advance-loop semantics block coverage of a downstream consumer's edge cases.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 04]: First-write contract for `.tmp-dates.mjs` (and any other multi-consumer stub module) — Node ES module imports are cached per-URL on first resolution; re-writing the file mid-test does NOT re-trigger import resolution. ALL exports the second consumer needs MUST be present at first-write time. Plan 04 added daysBetween + formatDate to the first .tmp-dates.mjs write so plantHealth's later import succeeds (Plan 05 should treat this stub as append-only at the source-write site).
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 04]: Structural insight (deferred to v1.2) — the `daysUntilWater < 0` overdue_water penalty branch in plantHealth.ts is unreachable through the production getNextWaterDate advance-loop (`while (next < today) next = addDays(next, intervalDays)` always returns >= today). The WATER-06 gate is shipped (defensive against future refactors) but exercising it in tests required a no-advance plantLogic stub. v1.2 may want to refactor either (a) plantHealth to compute days-since-lastWatered directly via daysBetween(parseDate(lastWatered), today) and compare to getSeasonalInterval, OR (b) plantLogic.getNextWaterDate to expose a non-advancing variant for health calculations. Current code is structurally surprising but correct.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 05]: SEASON-04 single-source-of-truth contract satisfied transitively, not via direct import. Scheduler does NOT import getWaterSeason — instead threads latitude into getTasksForDay (which calls getWaterSeason internally). Acceptance criterion grep -c 'getWaterSeason' src/utils/notificationScheduler.ts === 0 enforces this. Pattern: prefer call-chain parameter threading over duplicating leaf-utility imports for SSOT contracts. Future planners should treat 'single source of truth' as 'single call path,' not 'single import edge'.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 05]: Lump-under-water decision applied uniformly across 6 task-discriminator audit sites (Pitfall 8 list): morning notification body, calendar dot indicator, DayDetailModal bgColor + textColor, DayDetail taskIcon style, plantLogic emit. Visual + notification copy lump check_soil under water; the SEMANTIC differentiation lives in the i18n label only ('Chequear tierra de Aloe' vs 'Regar Aloe'). The lump form 't.type === "X" || t.type === "Y"' is naturally easy to flip back to split when telemetry warrants — Phase 6 may revisit. v1.1 default: lump.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 05]: Required-prop ratchet for season-aware components — when a downstream utility (here getTasksForDay) gains a required parameter, ratchet the prop interface of every component that calls it from optional to required. Plan 05 ratcheted DayDetail/DayDetailModal/MonthCalendar from optional to required latitude prop. The ratchet forces tsc to surface every JSX consumer that needs to be updated (CalendarScreen had blind-spot — wasn't destructuring location from useStorage). Anti-pattern (rejected): defaulting latitude = null inside the component — silently masks blind spots.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 05]: Multi-stage tsc handoff verification pattern — when the previous plan ships an intentionally-bounded set of tsc errors as 'handed off to next plan,' the next plan's first verify step should be 'npx tsc --noEmit 2>&1 | head' to confirm baseline matches the documented handoff. Plan 05 baseline showed exactly the 5 errors documented in Plan 04 SUMMARY's affects field (DayDetail, DayDetailModal, MonthCalendar, PlantsScreen<PlantCard>, notificationScheduler). When current plan task list enumerates fewer sites than previous plan's affects field, treat unenumerated sites as Rule 3 deviations to satisfy success_criteria 'project-wide tsc green'.
- [Phase 05-hemisphere-season-helpers-pure-utility-switchover]: [Plan 05]: App.tsx has TWO independent AppContent paths — MVP (Features.AUTH=false) and AUTH (Features.AUTH=true). Each destructures useStorage independently. Phase 4 Plan 07 added 'location' to the AUTH path's destructure (line 275) but NOT the MVP path (line 116). Plan 05 added it to MVP path as a Rule 3 fix. Two-AppContent-paths pattern is a v1.1-readiness decision (Phase 4) that requires both paths to be kept in sync — a future plan may merge them once V1.1 ships.
- [Phase 06-ui-read-side-propagation]: OUTDOOR_TYPE_IDS typed as ReadonlySet<string> not as const array; Translator type is local (key: string) => string NOT i18next TFunction to keep lightLabel.ts framework-free; suculentas excluded from outdoor set per 06-CONTEXT.md lock
- [Phase 06-ui-read-side-propagation]: lightLevel block inserted after plantCategories; waterBadge inside plantCard after inDays; seasonBadge inside plantDetail after sunHours; soilCheckEmptyRow appended to today block
- [Phase 06-ui-read-side-propagation]: [Plan 04]: useMemo deps array includes 't' for MyPlantDetailModal season/interval/lightLabel memo — locale-switch correctness; t identity changes on locale switch and memo must recompute localized lightLabel when locale changes
- [Phase 06-ui-read-side-propagation]: [Plan 04]: Nested <Text style={styles.seasonQualifier}> inside parent infoPillText <Text> uses React Native nested Text pattern; qualifier inherits parent font/size and only overrides color via seasonQualifier style (colors.textSecondary)
- [Phase 06-ui-read-side-propagation]: PlantDBEntry.category mapped to typeId at call site in both catalog surfaces — single getLightLabel signature handles Plant and PlantDBEntry without overloading
- [Phase 06-ui-read-side-propagation]: numberOfLines={2} added to PlantDatabaseCard sun badge — localized labels longer than legacy sunHours text; wrapping prevents truncation at 48% card width
- [Phase 06-ui-read-side-propagation]: nextWaterDate variable name chosen for the getNextWaterDate result (was nextWater) to satisfy grep nextWater word-boundary acceptance criterion while preserving the variable
- [Phase 06-ui-read-side-propagation]: waterBadge sits outside mode tasks guard — renders in both tasks and collection modes per UX-02 always-visible lock
- [Phase 06-ui-read-side-propagation]: lightLabel row renders unconditionally in PlantHealthDetail — even Low light / Poca luz is informative, no sunHoursForDisplay conditional
- [Phase 06-ui-read-side-propagation]: soilCheckSilentPlants sorted alphabetically (not favorite-first) — passive info rows have no actionable priority; daysBetween(today, getNextWaterDate(...)) gives correct forward countdown without a separate getSeasonalInterval call; inline JSX for soil-check rows per CONTEXT.md; triple-condition all-caught-up guard locks UX-03 correctness
- [Phase 07]: ClimateOverride optional on AppData but non-optional in StorageState — backward compat via ?? 'auto' hydration, no schema bump (additive field, version stays at 1)
- [Phase 07]: Two-AppContent-paths discipline applied in Wave 0: both AppContentMVP and AppContentFullInner destructure climateOverride atomically per Phase 5 Plan 05 documented trap
- [Phase 07]: Phase 7 smoke runner ENOENT-tolerant placeholder for getEffectiveSeason — Plan 07-02 extends without restructuring the runner
- [Phase 07]: Pattern A (inline getEffectiveSeason) vs Pattern B (prop ratchet to season: WaterSeason): components with prior getWaterSeason import use Pattern A; components that only threaded latitude use Pattern B
- [Phase 07]: getEffectiveSeason is the new public SSOT for season selection — getWaterSeason becomes module-private; callers pre-compute season once per render/tick and thread to all consumers
- [Phase 07]: LightLevelPicker uses flexBasis 48% + flexWrap for 2x2 grid — no FlatList for fixed 4-card layout (RESEARCH lock)
- [Phase 07]: WaterScheduleEditor HIDE-not-disable: soil_check conditional render removes inputs from tree entirely; zero disabled= props

### Pending Todos

None yet for v1.1.

### Blockers/Concerns

- **Phase 4 (Schema):** AsyncStorage write is not atomic from the user's perspective — kill-during-migration on real device is a release blocker (CRIT-1). Backup blob + idempotent re-runs + analytics events are mandated by SCHEMA-02/03/05/07.
- ~~**Phase 4 (Notifications):** All scheduled OS notifications must be cancelled and rebuilt against the new schema as part of migration completion (SCHEMA-06 + CRIT-3); `notificationScheduler` must be refactored to consume `lightLevel` before this can ship without throwing in `calculateSunWindow`.~~ **RESOLVED in Plan 04-04** — scheduler refactored, B4 null-guard parity established, Plan 07 reschedule trigger now safe to ship.
- **Phase 7 (Edge functions):** `chat-diagnosis`, `diagnose-plant`, `identify-plant` edge function source not yet read — backward-compat window design needs research before Phase 7 plans lock.
- **Phase 9 (Paywall):** Modal-stacking pattern is the highest revenue risk in v1.1; iOS+Android × free × upgraded × cancelled-purchase test matrix is mandatory before ship.
- **No test framework:** Migration regressions caught only by hand-run smoke test until a test runner is added in a future milestone.

## Session Continuity

Last session: 2026-05-01T22:30:21.116Z
Stopped at: Completed 07-04-PLAN.md
Resume file: None
