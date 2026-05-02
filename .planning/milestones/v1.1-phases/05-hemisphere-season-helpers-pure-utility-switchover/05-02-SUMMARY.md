---
phase: 05-hemisphere-season-helpers-pure-utility-switchover
plan: 02
subsystem: utils
tags: [seasonality, water-season, i18n, voseo, task-discriminator, smoke-test, wave-1, phase-5-foundation]

# Dependency graph
requires:
  - phase: 04-schema-foundation-migration-core
    provides: "Plant.waterSchedule.{warm,cold}, Plant.waterMode {fixed,soil_check}, Plant.lightLevel populated for all migrated plants — Phase 5 finally consumes the cold bucket"
  - phase: 05-hemisphere-season-helpers-pure-utility-switchover
    provides: "Plan 01 — locked typescript.transpileModule compile path for src/utils/seasonality.ts in scripts/migration-smoke-test.mjs (placeholder else-branch ready to populate)"
provides:
  - "src/utils/seasonality.ts — getWaterSeason(latitude, date) pure utility + WaterSeason type + TROPICAL_LAT_BOUNDARY constant"
  - "Task type discriminator extended: 'water' | 'sun' | 'outdoor' | 'check_soil' (src/types/index.ts)"
  - "Top-level 'tasks' i18n key in en/es common.json with checkSoil + checkSoilBody (ES voseo locked)"
  - "Phase-5 smoke runner section with 23 new assertions: SEASON-01 enum + SEASON-02 inclusive tropical + SEASON-03 month-boundary hard flip + i18n parity + ES voseo gate"
affects:
  - "05-03 (plantLogic dispatch + getNextWaterDate signature change — imports getWaterSeason and Task['type'] check_soil)"
  - "05-04 (plantHealth penalty skip — gates overdue-water block on plant.waterMode !== 'soil_check')"
  - "05-05 (notificationScheduler season-aware morning copy — imports getWaterSeason; 6 component call sites for Task discriminator exhaustion)"
  - "06-* (Phase 6 UX layer — DayDetail/DayDetailModal/MonthCalendar render the new check_soil task type using tasks.checkSoil i18n keys)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure framework-free season utility with required Date arg (no default new Date()) — TZ-deterministic, smoke-test friendly"
    - "Defensive coercion: null OR !Number.isFinite(latitude) → safe-default season ('warm'); aligns with LOC-03 'never under-water by default'"
    - "Tropical bucket as orthogonal third zone (not 2-bucket waterSchedule field — schema has warm/cold, season has warm/cold/tropical; tropical maps to warm bucket via separate helper, never inlined)"
    - "Top-level i18n key for full sentences ('tasks') vs nested label fragments ('dayDetail.taskWater', 'notifications.water') — keeps existing nested labels untouched, full UX sentences in their own namespace"
    - "Smoke-runner Date assertions use new Date(year, monthIdx, day) (local-time constructor) instead of ISO strings to avoid TZ-dependent getMonth() drift"

key-files:
  created:
    - "src/utils/seasonality.ts (38 lines) — pure 3-zone water-season helper"
  modified:
    - "src/types/index.ts (Task type discriminator extended with 'check_soil')"
    - "src/i18n/locales/en/common.json (+4 lines — new tasks.checkSoil + tasks.checkSoilBody)"
    - "src/i18n/locales/es/common.json (+4 lines — new tasks.checkSoil + tasks.checkSoilBody, voseo)"
    - "scripts/migration-smoke-test.mjs (+44 lines — 23 Phase-5 assertions replacing Plan-01 placeholder)"

key-decisions:
  - "ES voseo regex uses /i case-insensitive flag — sentence-leading capitalized 'Tocá' would not match strict /tocá/ from the plan spec; case-insensitive matching satisfies the voseo invariant without forcing artificial lowercase that would violate sentence-start capitalization."
  - "Smoke-runner date construction switched from ISO 'YYYY-MM-DD' strings to multi-arg Date(year, monthIdx, day) — runner is in America/Buenos_Aires UTC-3, so 'new Date(\"2026-04-01\")' parses as UTC midnight which getMonth() then re-interprets as local Mar 31. Multi-arg form is unambiguous local time and TZ-independent."
  - "Documentation cross-reference to tipSelector.getSeason kept in seasonality.ts JSDoc — plan prescribed the verbatim docstring; the 1 grep hit on getSeason\\b is a /comment/ reference (zero declarations, zero imports). Semantic collision-avoidance is intact (no shadowing, no auto-import target)."
  - "Top-level 'tasks' key inserted between 'dayDetail' and 'dataMigration' (line ~683) per RESEARCH §Pitfall 7 — keeps existing label fragments untouched, gives soil-check sentences their own namespace."

patterns-established:
  - "TZ-safe Date assertions in smoke runner: use new Date(YYYY, MM-1, DD) for any month-boundary check — getMonth() is local-time and ISO-string Dates parse as UTC. Future Phase-5 plans (03/04/05) and any subsequent month-boundary assertions in this runner MUST follow this rule."
  - "Voseo verification regex policy: use /i flag for verb-presence checks (sentence-leading capitalization is natural Spanish), but use \\b<lowercase>\\b (no /i) for tuteo-rejection — tuteo verbs are themselves lowercase tokens and case-insensitive rejection would over-match."

requirements-completed: ["SEASON-01", "SEASON-02", "SEASON-03"]

# Metrics
duration: 4 min
completed: 2026-05-01
---

# Phase 5 Plan 02: Wave-1 Foundation — getWaterSeason + check_soil Task Type + i18n Locks Summary

**Three-zone water-season helper (`getWaterSeason(lat, date) → 'warm' | 'cold' | 'tropical'`) shipped with Tropic-of-Cancer-inclusive boundary and TZ-safe smoke matrix; Task discriminator extended with `'check_soil'`; new top-level `tasks` i18n key in EN + ES (voseo) — Plans 03/04/05 can now consume the foundation without dangling references.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-01T13:46:10Z
- **Completed:** 2026-05-01T13:49:43Z
- **Tasks:** 3
- **Files modified:** 4 (1 created + 3 edited; smoke runner extended)

## Accomplishments

- `src/utils/seasonality.ts` ships with locked signature `getWaterSeason(latitude: number | null, date: Date): WaterSeason` — pure function, framework-free, no cache, recomputed on every read per CONTEXT.md SEASON locks.
- Tropical zone is `|lat| ≤ 23.5°` inclusive (Tropic of Cancer/Capricorn). `TROPICAL_LAT_BOUNDARY = 23.5` exported as a named constant for downstream consumers.
- Defensive guard: `null` OR non-finite `latitude` returns `'warm'` (LOC-03 safe default — never under-water on missing/corrupted location).
- Naming-collision avoided: function is `getWaterSeason` (not `getSeason`); coexists with `tipSelector.getSeason` (4-season UI palette) per RESEARCH Pitfall 1.
- `Task['type']` extended from 3 to 4 discriminator literals — TypeScript will flag any non-exhaustive switch in downstream Plans 03/04/05 callers.
- New top-level `tasks` i18n key inserted between `dayDetail` and `dataMigration` blocks in both `en/common.json` and `es/common.json`. ES copy uses voseo (`Tocá`, `regá`) per CLAUDE.md Spanish style.
- Smoke runner Phase-5 section populated with 23 new assertions: SEASON-01 enum/constant (2), SEASON-02 inclusive tropical (5), SEASON-03 month-boundary hard flip × {NY 40, BA -34.6} matrix (8), defensive null/NaN fallbacks (2), i18n parity (4), ES voseo + tuteo-rejection (2).
- Combined PASS count: **86/86** (was 63/63 + Phase-5-skipped placeholder; now 63 + 23 = 86, all green).

## Task Commits

1. **Task 1: Create src/utils/seasonality.ts** — `942a366` (feat)
2. **Task 2: Extend Task type with check_soil + add tasks.checkSoil i18n keys** — `1600c8a` (feat)
3. **Task 3: Populate Phase-5 smoke runner with SEASON-01..03 + i18n parity assertions** — `d06862d` (test)

_Plan metadata commit (SUMMARY.md + STATE.md + ROADMAP.md) follows separately._

## Files Created/Modified

- `src/utils/seasonality.ts` — NEW (38 lines). `getWaterSeason()` + `WaterSeason` type + `TROPICAL_LAT_BOUNDARY` constant. Pure utility, no hooks, no cache, defensive null/NaN guard.
- `src/types/index.ts` — line 97: `Task.type` union extended from `'water' | 'sun' | 'outdoor'` to include `'check_soil'`. Comment on line 24 (about `soil_check` waterMode plants) untouched but matches the new discriminator.
- `src/i18n/locales/en/common.json` — inserted `"tasks": { "checkSoil": "Check soil — {{name}}", "checkSoilBody": "Touch the soil. If it's dry 5cm down, water." }` after `dayDetail` block.
- `src/i18n/locales/es/common.json` — inserted `"tasks": { "checkSoil": "Chequear tierra — {{name}}", "checkSoilBody": "Tocá la tierra. Si está seca 5cm hacia abajo, regá." }` after `dayDetail` block. Voseo locked: `Tocá`, `regá` (NOT `toca`, `riega`).
- `scripts/migration-smoke-test.mjs` — Plan-01 placeholder `else` branch replaced with 23 real assertions; outer `if (!seasonalityMod)` skip path preserved as a safety net per Plan-01 contract.

## Decisions Made

- **ES voseo regex `/i` flag.** Plan Task 3 spec wrote the regex as `/tocá/.test(...)` (no flag), but the body string starts with capital `Tocá` (sentence-start capitalization is natural Spanish). Strict `/tocá/` returned `false` against `Tocá la tierra...`. Fix: `/tocá/i` and `/regá/i` for voseo presence; the tuteo-rejection regex stays case-sensitive (`/\btoca\b|\briega\b/`) because tuteo verbs are themselves lowercase and a case-insensitive rejection would over-match the voseo body.
- **TZ-safe Date construction in smoke runner.** Plan Task 3 spec used `new Date('2026-04-01')` which parses as UTC midnight; in `America/Buenos_Aires` (UTC-3) `getMonth()` then returns 2 (March), not 3 (April). Switched to `new Date(2026, 3, 1)` (local-time multi-arg constructor). All 14 month-boundary assertions follow this pattern. Pattern is now established for Phase 5 Plans 03/04/05.
- **JSDoc cross-reference to tipSelector.getSeason kept.** Plan acceptance criterion 7 says `grep -c "getSeason\b" src/utils/seasonality.ts` must return 0, but the plan's verbatim source spec (Action block) prescribes a JSDoc line `Coexists with src/utils/tipSelector.ts > getSeason (4-season UI palette);`. The two requirements are inherently contradictory. Kept the JSDoc reference (1 hit) — the more important contract is "no actual declaration or import of `getSeason`" which IS satisfied (verified: 0 declarations, 0 imports). Future maintainers benefit from the explicit collision-avoidance documentation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] ES voseo regex case-sensitivity mismatch with sentence-start capitalization**
- **Found during:** Task 2 (i18n key verification command failed: `voseo missing`)
- **Issue:** Plan-prescribed Spanish copy `Tocá la tierra. Si está seca 5cm hacia abajo, regá.` starts with capital `Tocá`. The plan's Task 2 verify command uses `/tocá/.test(...)` (no `/i`), which returned `false`. Same regex appeared in Task 3 acceptance criterion. Internally inconsistent specification — capitalized sentence-start verb but lowercase-only regex.
- **Fix:** Added `/i` case-insensitive flag to voseo presence regex (`/tocá/i`, `/regá/i`). Kept tuteo-rejection regex case-sensitive (`/\btoca\b|\briega\b/`) — tuteo verbs are themselves lowercase tokens and case-insensitive rejection would over-match.
- **Files modified:** scripts/migration-smoke-test.mjs (regex `/tocá/i` and `/regá/i` in voseo assertion)
- **Verification:** `npm run smoke:migration` — `PASS: es.tasks.checkSoilBody uses voseo (tocá+regá)` line emits; `86/86 PASS`.
- **Committed in:** `d06862d` (Task 3 commit)

**2. [Rule 1 — Bug] Date assertions failed in non-UTC timezone (TZ-dependent getMonth() drift)**
- **Found during:** Task 3 (first smoke run produced 4 FAIL lines: NY Apr 1, NY Oct 1, BA Apr 1, BA Oct 1)
- **Issue:** Plan-prescribed assertions use `new Date('2026-04-01')` which parses as UTC midnight (`2026-04-01T00:00:00Z`). The smoke runner is executed in `America/Buenos_Aires` (UTC-3), so `getMonth()` returns the LOCAL-time month — `2026-03-31T21:00:00 ART` → `getMonth()` === 2 (March), causing Northern temperate "Apr 1" to be classified as March (cold), not April (warm). Same for Oct 1 → Sep 30 local. The seasonality.ts source itself uses `date.getMonth()` correctly per the plan; the bug is in the assertion's Date construction.
- **Fix:** Replaced all 14 month-boundary `new Date('YYYY-MM-DD')` calls with `new Date(YYYY, monthIdx, DD)` (local-time multi-arg constructor, which is unambiguous regardless of runner TZ). Added a 5-line comment in the smoke runner explaining the policy so future executors don't regress.
- **Files modified:** scripts/migration-smoke-test.mjs (all Phase-5 Date constructors)
- **Verification:** `npm run smoke:migration` — all 14 month-boundary assertions PASS, 86/86 PASS, exit 0. Verified independently of TZ: `node -e "console.log(new Date(2026, 3, 1).getMonth())"` always returns 3 regardless of `TZ` env var.
- **Committed in:** `d06862d` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs in plan specification; 0 missing critical, 0 blocking).
**Impact on plan:** Both fixes were necessary to satisfy the plan's success criteria (smoke test exit 0, 86/86 PASS). Both are timezone/locale corner cases the planner did not anticipate; the fixes are minimal (regex flag, Date constructor form) and the established patterns are documented in this summary's `patterns-established` for downstream plans 03/04/05.

## Issues Encountered

- **JSDoc grep-count vs plan acceptance criterion conflict** (Task 1). Plan Action block instructed `Create NEW file src/utils/seasonality.ts with EXACTLY this shape (verbatim, including JSDoc)` where the JSDoc body explicitly references `tipSelector.ts > getSeason` for collision-avoidance documentation. Plan Acceptance Criterion 7 simultaneously demanded `grep -c "getSeason\b" src/utils/seasonality.ts` returns 0. The verbatim JSDoc was kept because (a) the plan's Action block is the more authoritative directive (it ships actual code), (b) the semantic intent of the criterion ("no naming collision") is satisfied — there are zero actual declarations or imports of `getSeason` in seasonality.ts, only a documentation cross-reference, (c) the documentation is itself a collision-avoidance guard for future maintainers per Pitfall 1 from RESEARCH.md. Documented under Decisions Made.

## User Setup Required

None — no external service configuration required. Pure-utility addition + i18n keys + smoke-test extension, all entirely local.

## Next Phase Readiness

- **Plan 03 unblocked.** Can `import { getWaterSeason, type WaterSeason } from '../utils/seasonality'` and dispatch on `Plant.waterMode === 'soil_check'` to emit `Task{type:'check_soil', label: i18n.t('tasks.checkSoil', {name})}`. Smoke runner already has the matrix scaffold to extend with task-emission assertions inside the same `else` branch.
- **Plan 04 unblocked.** Can gate the `daysUntilWater < 0` penalty block on `plant.waterMode !== 'soil_check'` with `getWaterSeason()` driving the correct seasonal interval lookup.
- **Plan 05 unblocked.** Can wire `notificationScheduler.scheduleMorningReminder` to consume `getWaterSeason(latitude, today)` for season-aware water cadence and audit the 6 task-type-discriminating component call sites (DayDetail, DayDetailModal × 4 chains, MonthCalendar) for `'check_soil'` exhaustion. TS strict mode will flag any non-exhaustive switch.
- **Smoke runner contract preserved + extended.** 63 → 86 PASS lines; Plan-01 ENOENT-tolerant skip path preserved as safety net; locked typescript.transpileModule policy preserved (still 2 invocations, 0 fallbacks).
- **TZ-safe Date assertion pattern established.** Plans 03/04/05 MUST use `new Date(YYYY, monthIdx, DD)` for any month-boundary check. Documented under `patterns-established`.
- **No legacy-field reads added** — `npm run check:legacy-fields` exit 0; ALLOWLIST count unchanged at 27 (Phase 5 should never grow it per RESEARCH §Anti-Patterns).

---
*Phase: 05-hemisphere-season-helpers-pure-utility-switchover*
*Completed: 2026-05-01*

## Self-Check: PASSED

- `src/utils/seasonality.ts` exists on disk: yes (38 lines)
- `src/types/index.ts`, `src/i18n/locales/en/common.json`, `src/i18n/locales/es/common.json`, `scripts/migration-smoke-test.mjs` exist on disk: yes
- `git log --oneline --all | grep -q 942a366` (Task 1): found
- `git log --oneline --all | grep -q 1600c8a` (Task 2): found
- `git log --oneline --all | grep -q d06862d` (Task 3): found
- `npm run smoke:migration` exit 0 with `86/86 PASS` (was `63/63` + `Phase 5: skipped`): confirmed
- `npx tsc --noEmit` exit 0: confirmed
- `npm run check:legacy-fields` exit 0, ALLOWLIST entries unchanged at 27: confirmed
