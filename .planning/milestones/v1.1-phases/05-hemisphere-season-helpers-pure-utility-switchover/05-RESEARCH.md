# Phase 5: Hemisphere/Season Helpers + Pure-Utility Switchover - Research

**Researched:** 2026-04-30
**Domain:** Pure-utility refactor — hemisphere/season helper, season-aware watering interval lookup, soil-check task type, plantHealth penalty skip
**Confidence:** HIGH

## Summary

Phase 5 is a **pure-utility refactor** with no UI work, no schema changes, and no new external dependencies. All v1.1 fields (`Plant.lightLevel`, `Plant.waterSchedule`, `Plant.waterMode`) were populated for migrated plants in Phase 4 — Phase 5 wires three pure-utility consumers (`plantLogic.ts`, `plantHealth.ts`, `notificationScheduler.ts`) to derive the active watering interval from `(waterSchedule, currentSeason)` based on the user's latitude, with a hard month-boundary flip and a tropical (no-flip) zone for `lat ∈ [-23.5°, 23.5°]`. The phase also introduces a new `'check_soil'` task type for `waterMode === 'soil_check'` plants that does NOT incur health-score penalty for "overdue watering."

The work is **constrained by a name collision**: a `getSeason(latitude)` already exists at `src/utils/tipSelector.ts:8` returning the 4-season UI string `'spring' | 'summer' | 'fall' | 'winter'` (used by `useSeason` hook + `seasonalThemes` palette). Phase 5's new function returns the orthogonal 3-zone watering string `'warm' | 'cold' | 'tropical'` and **must use a different export name** to avoid silent shadowing. The recommended naming is `getWaterSeason(latitude, date)` co-located in a new file (`src/utils/seasonality.ts`), with both functions co-existing.

**Primary recommendation:** Implement `getWaterSeason(latitude: number | null, date: Date = new Date()): WaterSeason` in `src/utils/seasonality.ts`; export `type WaterSeason = 'warm' | 'cold' | 'tropical'`; refactor `plantLogic.getNextWaterDate`, `plantHealth.calculatePlantHealth`, and `notificationScheduler` to consume it via the same defensive fallback ladder Phase 4 established. Extend the `Task` discriminator union to `'water' | 'sun' | 'outdoor' | 'check_soil'` and update all 6 task-type-discriminating call sites. Add 2 i18n keys (`tasks.checkSoil` + `tasks.checkSoilBody`) in EN + ES (voseo). Extend `scripts/migration-smoke-test.mjs` with a Phase-5 section asserting `getWaterSeason` over the BA/NY/Singapore + month-boundary matrix.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Soil-Check Task UX (Phase 5 emits, Phase 6 displays)**
- `'check_soil'` task generates with **same tap-to-done UX** as existing `'water'` task — single tap completes, no two-button "was wet / I watered" split. Defers complexity to a future milestone if data shows users need it.
- Next `'check_soil'` schedules using **same** `waterSchedule.{warm, cold}` interval as fixed plants — `mode` is the dispatcher, not the cadence source. Single source of truth across modes.
- Task only appears in "Hoy" on **check-in days** (when `lastWatered + currentSeasonInterval ≤ today`). Non-check-in days emit no task; UX-03 empty-state copy ("Te avisamos en N días") is Phase 6.
- Health score does **NOT** penalize soil_check plants for "no check_soil action in N days" — extending WATER-06's spirit. Soil_check plants are "always healthy on the water axis"; health degrades only via diagnosis or other axes (sun, outdoor, weather extremes).

**Season Transition Behavior**
- On month boundary (Oct 1 Northern, Apr 1 Southern), next-water-date is **recomputed** from `lastWatered + currentSeasonInterval`. A plant whose interval flips warm 5d → cold 10d will have next-water shift forward by 5 days. Simpler, no "remember which interval generated the original next-date" tracking.
- Tropical zone: `lat ∈ [-23.5°, 23.5°]` **inclusive** (matches Tropic of Cancer/Capricorn standard). São Paulo (lat -23.5) qualifies as tropical; Buenos Aires (lat -34.6) is Southern temperate.
- When `location === null` (Phase 7 wires LOC-03 fallback later, but Phase 5 utilities must not crash): `getSeason()` returns `'warm'` as the safe default. Aligns with LOC-03 ("never under-water by default").
- `currentSeason` is **recomputed on every read**, not cached. The function is pure (lat + date → string), cheap (~5 ops), and avoids cache-invalidation complexity at season boundaries.

**Boundaries with Scheduler / Health / Phase 6**
- `notificationScheduler.ts` **imports `getSeason()` directly**. Single source of truth, location is already in scheduler context via `Plant`/`Location` consumers. Avoids passing season through multiple call sites.
- `getTasksForDay(plants, day)` and health calculator apply a **defensive fallback ladder**: v1.1 `waterSchedule.{warm,cold}` → legacy `waterEvery` → safe default (e.g. 7 days). Same defensive pattern Phase 4 (Plan 04) established.
- Plants with `waterMode === 'soil_check'` **never generate** a `'water'` task, even on first encounter without `lastWatered`. Mode is the dispatcher — `'soil_check'` → emits `'check_soil'` (or nothing if not check-in day); `'fixed'` → emits `'water'` (or nothing).
- UX-03 empty-state copy ("Tu cactus está en modo chequeo. Te avisamos en N días.") is **Phase 6**, not here. Phase 5 only computes the next-check-in date and exposes it; Phase 6 will render the empty state when "Hoy" has zero tasks for a soil_check plant.

**Mapper Locks (carried over from Phase 4)**
- `lightLevelToSunHours` (used internally by scheduler): `{ direct: 5, bright_indirect: 0, medium_indirect: 0, low: 0 }`. Only `direct` plants get scheduled outdoor sun reminders. Locked in Phase 4 Plan 04.
- Display-layer light label mapping (used by Phase 6 UI): `{ direct: 6, bright_indirect: 4, medium_indirect: 2, low: 0/1 }`. Decoupled from scheduler mapping per Phase 4 decision.

### Claude's Discretion

- Filename for the season helper (`getSeason.ts` vs add to existing `plantLogic.ts` vs `seasonality.ts`).
- Internal cache layout if profiling later shows recompute is hot (current decision: no cache; revisit only on data).
- Exact constant values for fallback intervals when both v1.1 and legacy fields are missing.
- Whether to expose `getSeasonInterval(plant, season)` as a separate util or inline in callers.
- How to threading `Date` parameter through (default `new Date()` vs required arg).
- Granularity of `__DEV__` logging for season transitions / soil_check task generation.

### Deferred Ideas (OUT OF SCOPE)

- **Two-button check_soil completion** ("estaba húmeda" / "regué") — deferred. Single tap in Phase 5; revisit in v2.0 if telemetry shows users want disambiguation.
- **Memoized currentSeason cache** — deferred. Recompute on read until profiling shows it matters.
- **Per-plant user-configurable seasonal ratio** — out of scope per PROJECT.md (catalog defaults sufficient).
- **Manual climate-zone override (LOC-05)** — Phase 7 territory. Phase 5 derives season from latitude only; Phase 7 layers manual override on top.
- **Season transition smoothing** (linear interpolation between months) — rejected. Hard month-boundary flip per SEASON-03 lock.
- **`getSeasonInterval(plant, season)` named export** — Claude's discretion during implementation; may keep inline.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **SEASON-01** | New `getSeason(latitude, date)` utility returns `'warm' \| 'cold' \| 'tropical'` | Recommended file: `src/utils/seasonality.ts`; export name `getWaterSeason` (NOT `getSeason` — collides with `tipSelector.getSeason` returning `'spring'\|'summer'\|'fall'\|'winter'`). See Pitfall 1. |
| **SEASON-02** | Tropical zone (`\|lat\| ≤ 23.5°`) always uses `warm` schedule | Inclusive range `Math.abs(lat) <= 23.5`. São Paulo (-23.5) is tropical, Buenos Aires (-34.6) is Southern temperate. Constant: `TROPICAL_LAT_BOUNDARY = 23.5`. |
| **SEASON-03** | Northern uses warm Apr-Sep, cold Oct-Mar; Southern uses warm Oct-Mar, cold Apr-Sep — month boundaries | Use `date.getMonth()` (0-indexed). Northern: `month >= 3 && month <= 8` → warm. Southern: invert. Hard flip at month boundary, no equinox. |
| **SEASON-04** | Health calc, task generation, notification scheduler all derive interval from `(waterSchedule, currentSeason)` consistently | Single source of truth: pure function `getWaterSeason()` imported by all 3 consumers. New helper `getSeasonalInterval(plant, season)` recommended (private, returns `plant.waterSchedule[season]` with defensive fallback to `waterEvery`). |
| **WATER-05** | `soil_check` plants generate `'check_soil'` task with copy "Tocá la tierra. Si está seca 5cm hacia abajo, regá." | Extend `Task` type discriminator. Add `tasks.checkSoil` (label) + `tasks.checkSoilBody` (description) i18n keys in EN + ES (voseo: `regá`, `tocá`). Update 6 call sites: `getTasksForDay`, `DayDetail.tsx` (icon + style + label switch), `DayDetailModal.tsx` (4 discriminators), `MonthCalendar.tsx` (1 discriminator), `notificationScheduler.createMorningContent` (3 filters). |
| **WATER-06** | `soil_check` plants do NOT incur health-score penalty for overdue watering | In `calculatePlantHealth`, gate the `daysUntilWater < 0` block on `plant.waterMode !== 'soil_check'`. Defensive fallback: when `waterMode` undefined (legacy plant pre-migration-failure), preserve current behavior (apply penalty). |

## Standard Stack

### Core (already installed — no new deps)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.9.2 | Type-checked refactor | Project standard, `strict` mode |
| React Native | 0.81.5 | Runtime platform | Project standard |
| react-i18next | ^16.5.4 | Translation lookup for new copy | Project standard, `t('key')` pattern |
| expo-notifications | ~0.32.16 | OS notification scheduler API | Already used in `notificationScheduler.ts` |

### Supporting (existing internal helpers)
| Module | Purpose | When to Use |
|--------|---------|-------------|
| `src/utils/dates.ts` | `parseDate`, `addDays`, `isSameDay`, `daysBetween`, `formatDate` | Date arithmetic in season helper, task generation, health calc |
| `src/utils/migration.ts` | `sunHoursToLightLevel`, `applyColdFactor`, `inferWaterMode` | Reuse in defensive fallbacks (NOT modify) |
| `src/utils/plantInfo.ts` | `findDatabaseEntry`, `getPlantsAtTempRisk` | Don't touch — already lightLevel-aware post Phase 4 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure utility `getWaterSeason` | Hook `useWaterSeason` | Hook ties to React lifecycle; pure utility works in `notificationScheduler` (called from non-hook context) and is easier to test. **Stick with pure utility.** |
| Co-locate in existing `tipSelector.ts` | New `seasonality.ts` | Co-location risks confusion with existing `getSeason` (4-season). New file makes the orthogonal taxonomy explicit. **Stick with new file.** |
| `Date` required arg | Default `new Date()` | Required arg = better testability; default = ergonomic for production callers. **Recommend: required arg, no default.** Forces every caller to be explicit, smoke-test friendly. |
| Memoize per (lat, dateKey) | Recompute every read | CONTEXT.md locks: no cache. ~5 ops per call, profiling can revisit. **Stick with no cache.** |

**Installation:** None required. Phase 5 uses only existing dependencies.

## Architecture Patterns

### Recommended Project Structure (additions)
```
src/
├── utils/
│   ├── seasonality.ts           # NEW — getWaterSeason() + WaterSeason type + constants
│   ├── plantLogic.ts            # MODIFY — season-aware getNextWaterDate, soil_check dispatch
│   ├── plantHealth.ts           # MODIFY — skip overdue-water penalty for soil_check
│   └── notificationScheduler.ts # MODIFY — import getWaterSeason for water reminder cadence
├── types/
│   └── index.ts                 # MODIFY — extend Task type discriminator
├── i18n/locales/
│   ├── en/common.json           # MODIFY — add tasks.checkSoil + tasks.checkSoilBody
│   └── es/common.json           # MODIFY — same, voseo (tocá, regá)
└── components/
    ├── DayDetail.tsx            # MODIFY — handle 'check_soil' icon/style/label
    ├── DayDetailModal.tsx       # MODIFY — handle 'check_soil' tap → "log check" handler
    └── MonthCalendar.tsx        # MODIFY — include 'check_soil' in indicator dot logic
scripts/
└── migration-smoke-test.mjs     # MODIFY — add Phase-5 section (BA/NY/Singapore × 4 months × 2 modes)
```

### Pattern 1: Pure season utility with required date arg
**What:** A pure function `getWaterSeason(lat, date)` returning `WaterSeason`.
**When to use:** Single source of truth for season classification across all 3 consumers.
**Example:**
```typescript
// src/utils/seasonality.ts
export type WaterSeason = 'warm' | 'cold' | 'tropical';

/** Tropic of Cancer/Capricorn — inclusive boundary per CONTEXT.md SEASON-02 lock. */
export const TROPICAL_LAT_BOUNDARY = 23.5;

/**
 * Returns the watering season for a given latitude and date.
 * - Tropical (|lat| ≤ 23.5°): always 'warm' (no seasonal flip).
 * - Northern temperate: warm Apr-Sep, cold Oct-Mar.
 * - Southern temperate: warm Oct-Mar, cold Apr-Sep.
 * - Hard month boundary (no equinox); pure, recomputed on every read.
 *
 * @param latitude  GPS latitude in degrees, or null for safe default.
 * @param date      Reference date (callers MUST pass; no default for testability).
 * @returns `'warm' | 'cold' | 'tropical'`
 */
export function getWaterSeason(latitude: number | null, date: Date): WaterSeason {
  // SCHEMA-07 / LOC-03 alignment — never under-water on null location
  if (latitude === null) return 'warm';

  if (Math.abs(latitude) <= TROPICAL_LAT_BOUNDARY) return 'tropical';

  const month = date.getMonth(); // 0=Jan, 11=Dec
  // Northern: Apr(3)-Sep(8) warm; Oct(9)-Mar(2) cold.
  const isNorthernWarm = month >= 3 && month <= 8;
  if (latitude > 0) return isNorthernWarm ? 'warm' : 'cold';
  // Southern hemisphere: invert.
  return isNorthernWarm ? 'cold' : 'warm';
}
```

### Pattern 2: Season-aware interval lookup (defensive ladder)
**What:** A helper that picks the right interval from `waterSchedule` based on season, with v1.1 → legacy → default fallback.
**When to use:** Wherever `getNextWaterDate` or notification cadence needs to compute "next water in N days." Single source of truth across `plantLogic`, `plantHealth`, `notificationScheduler`.
**Example:**
```typescript
// Inside src/utils/plantLogic.ts (or a co-located helper)
import type { Plant } from '../types';
import type { WaterSeason } from './seasonality';

/**
 * Resolves the active watering interval (days) for a plant given the season.
 * Tropical → use `warm` interval (no separate tropical bucket per SEASON-02).
 * Defensive fallback: v1.1 waterSchedule[bucket] → legacy waterEvery → 7 days.
 */
function getSeasonalInterval(plant: Plant, season: WaterSeason): number {
  // Tropical maps to the warm bucket — schedule has 2 buckets, season has 3 zones.
  const bucket: 'warm' | 'cold' = season === 'cold' ? 'cold' : 'warm';

  const fromSchedule = plant.waterSchedule?.[bucket];
  if (typeof fromSchedule === 'number' && fromSchedule > 0) return fromSchedule;

  // Legacy fallback (covers migration-failure code path)
  if (typeof plant.waterEvery === 'number' && plant.waterEvery > 0) return plant.waterEvery;

  return 7; // safe default — weekly
}
```

### Pattern 3: Soil-check task dispatch in `getTasksForDay`
**What:** `waterMode` decides which task type to emit; cadence comes from the same season-aware interval lookup.
**When to use:** Inside `getTasksForDay` plant loop — replaces the current single `'water'` branch.
**Example:**
```typescript
// src/utils/plantLogic.ts (proposed shape)
export function getTasksForDay(
  plants: Plant[],
  day: Date,
  latitude: number | null
): Task[] {
  const tasks: Task[] = [];
  const season = getWaterSeason(latitude, day);

  plants.forEach(p => {
    const next = getNextWaterDate(p, day, season);
    if (isSameDay(next, day)) {
      // Mode is the dispatcher — same cadence, different task type
      if (p.waterMode === 'soil_check') {
        tasks.push({
          type: 'check_soil',
          icon: '🤚',
          label: i18n.t('tasks.checkSoil', { name: p.name }),
          plantId: p.id,
        });
      } else {
        tasks.push({
          type: 'water',
          icon: '💧',
          label: `Regar ${p.name}`,
          plantId: p.id,
        });
      }
    }
    // sun + outdoor branches unchanged
    if (p.sunDays.includes(day.getDay())) { /* ... */ }
    if (p.outdoorDays.includes(day.getDay())) { /* ... */ }
  });
  return tasks;
}
```

### Anti-Patterns to Avoid
- **Naming `getSeason` in seasonality.ts** — silently shadows or conflicts with existing `tipSelector.getSeason`. Use `getWaterSeason` (or `getCurrentWaterSeason`).
- **Calling `useStorage()` from inside the season helper** — utilities must remain framework-free. Pass `latitude: number | null` as a primitive arg.
- **Caching season in module scope** (e.g., `let _season; if (!_season) _season = ...`) — breaks at month boundary, breaks tests, no measurable perf win. Recompute every read per CONTEXT.md.
- **Using `Date.now()` directly in season helper** — kills determinism in smoke tests. Always pass `date: Date` as arg.
- **Penalizing soil_check plants when `waterMode` is undefined** — defensive fallback should preserve PRE-Phase-5 behavior (apply penalty) when mode is unknown, NOT skip the penalty optimistically. WATER-06 says "soil_check plants do NOT incur penalty"; it does not say "unknown plants do not incur penalty."
- **Adding `'check_soil'` to ALLOWLIST in `check-no-legacy-reads.js`** — Phase 5 should NOT add to allowlist. The allowlist is for legacy `sunHours`/`waterEvery` reads only; new task type doesn't read legacy fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic (`addDays`, `parseDate`, `isSameDay`, `daysBetween`) | Manual `new Date()` math | `src/utils/dates.ts` helpers | Existing helpers are already used by `plantLogic` + `plantHealth`; consistency + DST/timezone safety. |
| Season classification | Custom hemisphere math in each consumer | `getWaterSeason(lat, date)` from `seasonality.ts` | Single source of truth (SEASON-04 contract). |
| Defensive fallback ladder | Different fallback per consumer | Pattern from Phase 4 Plan 04 (`v1.1 → legacy → default`) | 5 consumers already follow this exact shape; consistency reduces bugs at migration-failure boundary. |
| `lightLevel`-to-hours mapping | New mapping in scheduler | Existing `lightLevelToSunHours` in `notificationScheduler.ts:527` | Locked in Phase 4: `{direct: 5, others: 0}`. Don't introduce a parallel mapping. |
| `waterMode` inference at runtime | Re-derive from category | `plant.waterMode` field (populated by Phase 4 migration) | Already populated for migrated plants. Defensive fallback only when `undefined` (failure path). |
| Task type icon/style switch | New centralized helper | Inline `task.type === 'X'` switches (existing pattern) | The codebase uses inline switches in `DayDetail`/`DayDetailModal`/`MonthCalendar`; matching this style avoids divergent rendering paths. |

**Key insight:** Phase 5 is a refactor inside an established pattern. The defensive ladder, the lightLevel mapping, the i18n key conventions, the `Task` discriminator pattern — all already exist. Don't introduce new abstractions; extend the existing ones.

## Common Pitfalls

### Pitfall 1: Naming collision with existing `getSeason`
**What goes wrong:** `src/utils/tipSelector.ts:8` already exports `getSeason(latitude: number): Season` returning `'spring' | 'summer' | 'fall' | 'winter'` (used by `useSeason` hook + `seasonalThemes` palette in `theme.ts:75`). If Phase 5 adds another `getSeason` returning `'warm' | 'cold' | 'tropical'`, callers may import the wrong one (TypeScript's `import { getSeason } from '../utils/...'` is path-specific but a fuzzy auto-import can grab the wrong file).
**Why it happens:** Both functions occupy the same conceptual namespace ("what's the current season?") but have different return-type semantics (4-season UI flavor vs. 3-zone watering taxonomy).
**How to avoid:** Name the new function **`getWaterSeason`** and the type **`WaterSeason`**. Co-locate in a new file `src/utils/seasonality.ts` (NOT `tipSelector.ts`). The two functions co-exist; `tipSelector.getSeason` is unaffected.
**Warning signs:** TS error "Type 'Season' is not assignable to type 'WaterSeason'" → wrong import. CI grep for `import.*getSeason` outside `tipSelector.ts` and `useSeason.ts` should find zero hits after Phase 5.

### Pitfall 2: Tropical-bucket schema mismatch
**What goes wrong:** `Plant.waterSchedule` has only `{ warm: number, cold: number }` (2 buckets), but `getWaterSeason` returns 3 zones (`'warm' | 'cold' | 'tropical'`). If a consumer naively does `plant.waterSchedule[season]`, the tropical case returns `undefined`.
**Why it happens:** SEASON-02 locks tropical → "always uses warm schedule" — there is no per-plant tropical interval, by design. The orthogonality between `waterSchedule.{warm,cold}` and `WaterSeason.{warm,cold,tropical}` is intentional but easy to forget.
**How to avoid:** Centralize the bucket-from-season logic in a helper (e.g., `getSeasonalInterval(plant, season)` shown in Pattern 2). Map `'tropical' → 'warm'` exactly once. Never inline `plant.waterSchedule[season]` at call sites.
**Warning signs:** Runtime: `next-water-date` becomes `Invalid Date` (NaN math). TS: `plant.waterSchedule[season]` typechecks as `number | undefined` if `season: WaterSeason` because `WaterSchedule` only has `warm|cold` keys — the typecheck **catches this** if the helper is missing.

### Pitfall 3: Off-by-one month boundary semantics
**What goes wrong:** `date.getMonth()` is 0-indexed (0=Jan, 11=Dec). SEASON-03 says "Apr-Sep" / "Oct-Mar". Off-by-one error: `month >= 4 && month <= 8` would mean May-Sep (wrong) instead of Apr-Sep.
**Why it happens:** Human "April" thinking maps to "month index 3" — easy to mis-write the boolean.
**How to avoid:** Northern warm: `month >= 3 && month <= 8` (Apr-Sep). Add a unit assertion in `migration-smoke-test.mjs` Phase-5 section: `getWaterSeason(40, new Date('2026-04-01')) === 'warm'` AND `getWaterSeason(40, new Date('2026-03-31')) === 'cold'`. Same for Southern: BA Apr 1 must flip cold (not stay warm).
**Warning signs:** Smoke test expectation mismatch on month-boundary days; Northern/Southern asymmetry in test output.

### Pitfall 4: Season transition shifts next-water-date by N days
**What goes wrong:** A plant's `lastWatered` is, say, Mar 25 (Southern hemisphere, warm bucket = 5d). On Apr 1 the season flips to cold (10d). The next-water-date jumps from Mar 30 (already past) to Apr 4 (lastWatered + cold = 25 + 10 = Apr 4). User-perceptible "my plant just got 5 days less attention."
**Why it happens:** CONTEXT.md explicitly accepts this — "next-water-date is recomputed from `lastWatered + currentSeasonInterval`" — but it's worth verifying the math doesn't accidentally produce >1-cycle jumps or NaN.
**How to avoid:** Keep the existing `while (next < today) next = addDays(next, intervalDays)` advance loop in `getNextWaterDate`. The loop guarantees the next date is always ≥ today and ≤ today + intervalDays. Smoke test: simulate March 31 → April 1 transition for a Southern plant and assert `daysBetween(today, nextWater) <= cold_interval`.
**Warning signs:** `daysBetween` returns negative values or > intervalDays after transition; `Invalid Date` from `addDays(NaN, ...)`.

### Pitfall 5: Soil_check plants without `lastWatered` flooding "Hoy"
**What goes wrong:** A user adds a cactus today; `lastWatered === null`. Current `getNextWaterDate` returns `today` when `lastWatered` is null. If Phase 5 emits `'check_soil'` whenever `next === today` for soil_check plants, EVERY new soil_check plant generates a check task on day 1 — possibly noisy.
**Why it happens:** The current `getNextWaterDate(plant, today)` short-circuit `if (!plant.lastWatered) return today` was designed for fixed-mode plants (gentle nudge to set baseline). Soil-check plants don't need that nudge — they want a check-in cadence, not an immediate prompt.
**How to avoid:** CONTEXT.md is explicit: "Plants with `waterMode === 'soil_check'` **never generate** a `'water'` task, even on first encounter without `lastWatered`." Implementation choice: when `waterMode === 'soil_check'` AND `!lastWatered`, EITHER (a) emit `check_soil` on day-1 (treating "user just added it" as the implicit check-in) OR (b) suppress until first `lastWatered` is logged. **Recommendation: (a)** — matches the "Hoy is non-empty for new plants" UX expectation and makes the first check-in self-explanatory. Document the choice in the plan.
**Warning signs:** New cactus added today shows no task in "Hoy" → user confused. New cactus added today shows a check task immediately → user not confused; matches expectation.

### Pitfall 6: Notification scheduler imports `useStorage` (forbidden)
**What goes wrong:** A natural reflex is to read `location` from `useStorage()` inside `notificationScheduler` to pass to `getWaterSeason`. But `notificationScheduler.ts` is a pure utility — it cannot call hooks.
**Why it happens:** The scheduler is called from `useNotifications` hook (which has access to `useStorage`); the scheduler functions themselves accept `(plants, weather)` not `(plants, weather, location)`.
**How to avoid:** Add `latitude: number | null` (NOT the whole `Location`) as a parameter to scheduler functions that need season. Update `useNotifications` callers (line 157, 177, 276) to pass `location?.lat ?? null`. Keep helpers framework-free per CONTEXT.md "Location from useStorage() is the lat source. Callers already destructure it; Phase 5 utilities accept lat as a primitive arg."
**Warning signs:** Import of `useStorage` from inside `src/utils/`. tsc error "Hooks can only be called inside the body of a function component."

### Pitfall 7: Missing or wrong i18n keys
**What goes wrong:** Hardcoded `"Tocá la tierra. Si está seca 5cm hacia abajo, regá."` in code violates CLAUDE.md ("never hardcode user-facing strings"). Or keys added to ES only, not EN.
**Why it happens:** Quick prototyping; voseo only feels natural in ES so EN gets forgotten.
**How to avoid:** Add `tasks.checkSoil` (label, e.g., "Chequear tierra de {{name}}" / "Check soil of {{name}}") AND `tasks.checkSoilBody` (description, e.g., "Tocá la tierra. Si está seca 5cm hacia abajo, regá." / "Touch the soil. If it's dry 5cm down, water.") in BOTH `en/common.json` AND `es/common.json`. Plan a smoke-test grep similar to Phase 4's voseo verification (`grep -E "(toca|riega)\b" es/common.json` should fail; `(tocá|regá)` should pass). The codebase uses a **flat top-level key** for new domains — recommend creating a new `tasks` top-level key (currently only `dayDetail.taskWater/taskSun/taskOutdoor` and `notifications.water/sun/outdoor` exist; neither is the right home for a full sentence). New top-level `tasks` key avoids muddying the existing nested labels.
**Warning signs:** `grep -rn "Tocá la tierra" src/` finds matches outside `i18n/locales/`. Translation lookup returns the key string itself ("tasks.checkSoil") at runtime.

### Pitfall 8: Updating only some `task.type ===` call sites
**What goes wrong:** The `Task` type discriminator union extends from 3 to 4 variants. TypeScript catches the missing branches ONLY if call sites use exhaustive switches. Most existing call sites use `task.type === 'water' ? ... : task.type === 'sun' ? ... : ...` chains that silently fall through for the new `'check_soil'` value (no compile error, no runtime error, just wrong behavior).
**Why it happens:** TypeScript's `===` comparison narrowing is permissive — `'water' | 'sun' | 'outdoor' | 'check_soil'` never errors on `task.type === 'water'`.
**How to avoid:** Audit ALL 6 task-type-discriminating call sites:
1. `src/utils/plantLogic.ts:36-43` — `getTasksForDay` (the emitter — owner)
2. `src/utils/notificationScheduler.ts:80-82` — 3 filter chains (`waterTasks`, `sunTasks`, `outdoorTasks`) → likely add `checkSoilTasks` or fold into `waterTasks` for morning notification copy
3. `src/components/DayDetail.tsx:79-99, 152-165` — 2 switches (icon + label) → add 'check_soil' branch
4. `src/components/DayDetailModal.tsx:122-149` — 4 discriminators (isDone check, handlePress dispatch, bgColor, textColor) → add 'check_soil' tap handler that calls `updatePlant({ lastWatered: todayStr })` (mode is dispatcher, action is the same — log a "checked-and-watered-or-not" timestamp)
5. `src/components/MonthCalendar.tsx:65-67` — 3 indicator booleans → add `hasCheckSoil` (or fold into `hasWater` for the dot indicator)
6. `src/utils/notificationScheduler.ts:50-51` — `createMorningContent` calls `getTasksForDay`; the morning notification body needs to mention check-soil tasks alongside water tasks (decision: lump or split per UX call — recommend lump under existing "regar" word for v1.1, refine in v1.2)
**Warning signs:** New cactus in Hoy shows no icon (default fallback). DayDetailModal tap on check_soil task does nothing.

### Pitfall 9: TodayScreen's `plantsWithTasks` uses inline cadence logic
**What goes wrong:** `src/screens/TodayScreen.tsx:160-176` builds `plantsWithTasks` independently of `getTasksForDay` — it directly calls `getNextWaterDate(plant, today)`. If `getTasksForDay` learns season-awareness but `plantsWithTasks` doesn't, the "Hoy" tab list and the per-plant TaskButton stack disagree.
**Why it happens:** Two different code paths arrived at the same answer pre-Phase-5. Phase 5 changes one, the other drifts.
**How to avoid:** Update `getNextWaterDate` signature to accept `season: WaterSeason` (or pass it through transparently). All callers — `TodayScreen.tsx:164`, `wateringRecommendations.ts:44,51`, `PlantCard.tsx:51`, `plantHealth.ts:40` — must be updated. SEASON-04 explicitly says "task generation, health calculator, notification scheduler all derive from the same `(waterSchedule, currentSeason)` lookup." The caller list has 5 entries and is bounded; no risk of missing one if checked exhaustively.
**Warning signs:** "Hoy" shows a watering task but PlantCard shows "next water in 3 days" or vice versa.

## Code Examples

Verified patterns from existing source:

### Existing 4-Season helper (NOT to reuse, but to coexist with)
```typescript
// Source: /Users/gaston/Documents/Personal/MiJardinApp/src/utils/tipSelector.ts:8-44
// Returns 'spring' | 'summer' | 'fall' | 'winter' for UI/tips. Phase 5's helper returns a
// different taxonomy and lives in a different file.
export function getSeason(latitude: number): Season {
  const month = new Date().getMonth(); // 0-11
  const isSouthernHemisphere = latitude < 0;
  let season: Season;
  if (month >= 2 && month <= 4)       season = 'spring';
  else if (month >= 5 && month <= 7)  season = 'summer';
  else if (month >= 8 && month <= 10) season = 'fall';
  else                                 season = 'winter';
  if (isSouthernHemisphere) {
    const seasonMap: Record<Season, Season> = {
      spring: 'fall', summer: 'winter', fall: 'spring', winter: 'summer',
    };
    season = seasonMap[season];
  }
  return season;
}
```

### Existing defensive fallback ladder (Phase 4 Plan 04 pattern — extend, do not break)
```typescript
// Source: /Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantLogic.ts:11-19
// Phase 5 extends this to be season-aware while keeping the v1.1 → legacy → default ladder.
function getWaterIntervalDays(plant: Plant): number {
  if (plant.waterSchedule?.warm && plant.waterSchedule.warm > 0) {
    return plant.waterSchedule.warm;
  }
  if (typeof plant.waterEvery === 'number' && plant.waterEvery > 0) {
    return plant.waterEvery;
  }
  return 7; // safe default — weekly
}
```

### Existing lightLevel-aware scheduler null-guard (Phase 4 Plan 04 — B4 invariant)
```typescript
// Source: /Users/gaston/Documents/Personal/MiJardinApp/src/utils/notificationScheduler.ts:544-561
// B4 invariant: every calculateSunWindow caller MUST null-guard. Phase 5 must
// preserve this — if Phase 5 adds new sunWindow callers, increment the null-check count.
function calculateSunWindow(plant: Plant, sunrise: Date, sunset: Date): { start: Date; end: Date } | null {
  const hours = lightLevelToSunHours(plant.lightLevel);
  if (hours <= 0) return null;
  const start = new Date(sunrise.getTime() + SUNRISE_OFFSET_MINUTES * 60 * 1000);
  const sunHoursMs = hours * 60 * 60 * 1000;
  let end = new Date(start.getTime() + sunHoursMs);
  const maxEnd = new Date(sunset.getTime() - 30 * 60 * 1000);
  if (end > maxEnd) end = maxEnd;
  return { start, end };
}
```

### Existing health overdue-water penalty (Phase 5 will gate this on waterMode)
```typescript
// Source: /Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantHealth.ts:40-64
// Phase 5: wrap this entire `if (daysUntilWater < 0)` block in `if (plant.waterMode !== 'soil_check')`.
// Defensive: when waterMode is undefined (legacy/migration-failure), preserve current behavior (apply penalty).
const nextWaterDate = getNextWaterDate(plant, today);
const daysUntilWater = daysBetween(today, nextWaterDate);
if (daysUntilWater < 0) {
  const daysOverdue = Math.abs(daysUntilWater);
  score -= 20;
  const extraPenalty = Math.min(daysOverdue - 1, 3) * 10;
  score -= extraPenalty;
  // ... pushes 'overdue_water' health issue
}
```

### Existing Task type discriminator (Phase 5 extends with 'check_soil')
```typescript
// Source: /Users/gaston/Documents/Personal/MiJardinApp/src/types/index.ts:96-101
// Phase 5: extend the union literal.
export interface Task {
  type: "water" | "sun" | "outdoor";  // → "water" | "sun" | "outdoor" | "check_soil"
  icon: string;
  label: string;
  plantId: string;
}
```

### Existing i18n nested label structure (Phase 5 adds top-level `tasks`)
```json
// Source: /Users/gaston/Documents/Personal/MiJardinApp/src/i18n/locales/es/common.json:678-682
"dayDetail": {
  "taskWater": "Riego",
  "taskSun": "Sol",
  "taskOutdoor": "Exterior"
}
// notifications.water / .sun / .outdoor are short verb fragments for morning copy
// Phase 5 recommendation — new top-level "tasks" key for full sentences:
// "tasks": {
//   "checkSoil": "Chequear tierra de {{name}}",
//   "checkSoilBody": "Tocá la tierra. Si está seca 5cm hacia abajo, regá.",
//   "water": "Regar {{name}}"   // (optional — could migrate existing `Regar ${p.name}` template here)
// }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two-zone hemisphere flip (winter/summer only) | Three-zone with explicit tropical bucket | Phase 5 design (CONTEXT.md SEASON-02 lock) | Singapore (lat 1.35) and other equatorial users get correct year-round behavior; PROJECT.md decision documented in STATE.md "Three-zone seasonality from day one — never two-hemisphere only" |
| Equinox-based season (astronomical) | Hard month-boundary flip | Phase 5 design (CONTEXT.md SEASON-03 lock) | Simpler, predictable, no per-year recomputation. User-visible: season may flip a few days off astronomical equinox. |
| `waterEvery: number` (single interval) | `waterSchedule: { warm, cold }` (per-season) | Phase 4 (already shipped) | Phase 5 finally makes this useful — Phase 4 populated the field but no consumer used `cold` yet |
| `'water'` task only | `'water' \| 'check_soil'` based on `waterMode` | Phase 5 design (CONTEXT.md, WATER-05) | Users with cacti/succulents get a different prompt, no inappropriate "you're 5 days overdue!" health penalty (WATER-06) |
| Health penalty for any overdue water | Skip penalty for `soil_check` plants | Phase 5 design (CONTEXT.md, WATER-06) | Cacti/succulents stop showing as "warning" status purely from missed cadence — they go yellow only via diagnosis or other axes |

**Deprecated/outdated:**
- The phrase "winter schedule" / "summer schedule" — Phase 5 uses "cold schedule" / "warm schedule" semantically (the schema fields are `cold`/`warm`, not `winter`/`summer`).
- 2-bucket assumption for tropical (`tropical → warm` only) — was never the schema, but worth being explicit in the helper.

## Open Questions

1. **Where should the `'check_soil'` morning-notification copy live?**
   - What we know: `notificationScheduler.createMorningContent` lines 80-82 filter tasks by type and build human-readable parts. Adding a 4th filter for `check_soil` is mechanical.
   - What's unclear: UX call — does the morning notification say "Regá Aloe" or "Chequeá Aloe" or just lump it into "Regá: 3 plantas"? CONTEXT.md doesn't lock this; it's UX territory partly Phase 5 (we emit the task) and partly Phase 6 (we render the badge). Notification body is morning only — Phase 5 ships SOMETHING.
   - Recommendation: **Lump under existing "regar" verb for v1.1** — morning copy says "Regá: Aloe y 2 plantas" (treating check_soil as "needs water attention" semantically). Refine in v1.2 if telemetry shows confusion.

2. **Should `getNextWaterDate` take `season` as required arg or compute it from `latitude`?**
   - What we know: 5 callers (TodayScreen, plantHealth, plantLogic.getTasksForDay, wateringRecommendations × 2). All have access to `location` either via `useStorage` or props.
   - What's unclear: Whether to thread `season` through the call chain (more callers update) OR thread `latitude` and compute season inside (1 update inside getNextWaterDate but couples it to `seasonality.ts`).
   - Recommendation: **Thread `latitude: number | null` through** — getNextWaterDate computes season inside via `getWaterSeason(latitude, today)`. Reduces caller-side complexity and makes the function behavior obvious from its signature.

3. **Should `'check_soil'` taps log to `lastWatered` or a new field `lastSoilCheckedDate`?**
   - What we know: CONTEXT.md says "single tap completes." Currently `'water'` taps update `lastWatered`. Soil-check plants need a "checked-in" marker so their next check-in date advances.
   - What's unclear: Reusing `lastWatered` is simplest (one field, all existing logic works) but semantically muddy ("they may have checked and not watered"). New field `lastSoilCheckedDate` is cleaner but is a schema addition (out of CONTEXT.md scope?).
   - Recommendation: **Reuse `lastWatered`** — pragma matches CONTEXT.md "mode is the dispatcher, not the cadence source"; same field, same advance-by-interval math. The cadence-source argument extends to the persistence-marker argument. Rename consideration is deferred to v1.2 if telemetry shows confusion. Plan should explicitly call this out so it's not a surprise.

4. **Does `notificationScheduler.scheduleSmartSunNotifications` need `latitude` for water-cadence reminders?**
   - What we know: The scheduler currently has no per-plant water-cadence reminder pathway — only sunrise/sunset/UV/temperature notifications. Morning reminder uses `getTasksForDay` which Phase 5 will season-aware.
   - What's unclear: Does CONTEXT.md "notificationScheduler.ts imports getSeason() directly" require new water-cadence notifications, or is "water reminder cadence comes from morning reminder" sufficient?
   - Recommendation: **Sufficient as-is for v1.1.** Morning reminder already aggregates water tasks; adding per-plant water-cadence notifications is feature creep. The scheduler import of `getWaterSeason` is needed because `createMorningContent` calls `getTasksForDay`, which Phase 5 makes season-aware. No new notification types.

5. **What's the bounded latitude range we accept?**
   - What we know: GPS latitude is `[-90, 90]`. Open-Meteo geocoding returns valid floats.
   - What's unclear: Should we defensive-clamp or assert? `lat = NaN` (corrupted location) would currently fail `Math.abs(NaN) <= 23.5` (false) AND `lat > 0` (false) AND `lat < 0` (false) — silently returning `'cold'` for the Northern hemisphere fallthrough.
   - Recommendation: **Treat `Number.isFinite(latitude) === false` as `null`** — return `'warm'` per LOC-03. Add a unit assertion in smoke test.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (CLAUDE.md: "No test framework is set up") |
| Config file | None — Phase 5 extends Node-only smoke runner pattern from Phase 4 (`scripts/migration-smoke-test.mjs`) |
| Quick run command | `npm run smoke:migration` (currently 63/63 PASS; extend with Phase-5 section) |
| Full suite command | `npm run typecheck && npm run check:legacy-fields && npm run smoke:migration` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEASON-01 | `getWaterSeason` returns 3-zone string | unit | extend `smoke:migration` to import + assert against compiled `seasonality.ts` (mirror Phase 4 typescript.transpileModule pattern) | NEW Wave 0 |
| SEASON-02 | `lat ∈ [-23.5, 23.5]` returns `'tropical'` regardless of date | unit | smoke: `getWaterSeason(1.35, anyDate) === 'tropical'`; `getWaterSeason(-23.5, anyDate) === 'tropical'`; `getWaterSeason(23.5, anyDate) === 'tropical'`; `getWaterSeason(23.51, julyDate) === 'warm'` | NEW Wave 0 |
| SEASON-03 | Northern Apr-Sep warm; Southern Apr-Sep cold; month-boundary hard flip | unit | smoke: matrix `[NY 40, BA -34.6] × [Mar 31, Apr 1, Sep 30, Oct 1] === expected season`; verify off-by-one | NEW Wave 0 |
| SEASON-04 | All 3 utilities derive interval from same lookup | unit + integration | smoke: build a Plant fixture with `waterSchedule:{warm:5,cold:10}`, assert `getNextWaterDate` (Apr 1 BA) → cold; `calculatePlantHealth` overdue threshold uses 10d not 5d; mock `notificationScheduler.createMorningContent` indirectly via `getTasksForDay` returning correct flag | NEW Wave 0 |
| WATER-05 | `soil_check` plant emits `'check_soil'` task with i18n copy | unit | smoke: build `Plant{ waterMode: 'soil_check', waterSchedule:{warm:14,cold:28}, lastWatered: 14 days ago }`, assert `getTasksForDay` returns `[{type:'check_soil', label: contains 'Chequear'/'Check'}]` (assert LABEL via running `i18next` in smoke isn't trivial — assert task.type === 'check_soil' and trust DayDetail label rendering separately) | NEW Wave 0 |
| WATER-06 | `soil_check` plant 5 days overdue → no `overdue_water` issue, score unchanged | unit | smoke: same Plant + 5-days-overdue scenario, assert `calculatePlantHealth(p, today, null).issues.find(i => i.type === 'overdue_water')` is undefined; assert score === 100 (or 90 if `no_care` triggered) | NEW Wave 0 |
| (Cross-cutting) | Smoke test 7-plant fixture still passes | regression | `npm run smoke:migration` 63/63 → 75/75-ish PASS (existing 63 + ~12 new) | EXISTING |
| (Cross-cutting) | Legacy field grep guard stays exit 0 | regression | `npm run check:legacy-fields` exit 0 (Phase 5 should NOT add ALLOWLIST entries) | EXISTING |
| (Cross-cutting) | Tsc strict typecheck | regression | `npm run typecheck` exit 0 | EXISTING |
| (Cross-cutting) | i18n key parity (EN + ES voseo) | unit | smoke: parse both common.json files, assert `tasks.checkSoil` + `tasks.checkSoilBody` exist in both; assert ES `checkSoilBody` matches `/tocá|regá/` (voseo); assert NO conjugations like "toca\b" or "riega\b" | NEW Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npm run smoke:migration` (target ~5s total — typecheck is fast, smoke is <1s)
- **Per wave merge:** `npm run typecheck && npm run check:legacy-fields && npm run smoke:migration` (full suite, target <10s)
- **Phase gate:** Full suite green + manual scenario walk-through on Hoy (BA + Singapore device location overrides) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `scripts/migration-smoke-test.mjs` with Phase-5 section (compile `src/utils/seasonality.ts` via `typescript.transpileModule`, run new assertions, increment PASS count). Mirror the existing `migration.ts` compile pattern.
- [ ] Add Phase-5 fixture entries (or augment existing fixture) covering: Northern temperate plant (NY-flavored test), Southern temperate plant (BA, the existing fixture), tropical plant (Singapore), soil_check plant overdue.
- [ ] Add i18n key parity assertion to smoke runner (parse `en/common.json` + `es/common.json`, validate `tasks.checkSoil*` presence and ES voseo verbs).
- [ ] No new framework install — smoke runner pattern is sufficient for Phase 5.
- [ ] Wave 0 should also lock the **task-discriminator-exhaustion** invariant: a grep-based check that every `task.type ===` chain in `src/components/` has a `'check_soil'` branch. Mirror the B4 null-guard parity invariant from Phase 4 Plan 04. (Optional but recommended given Pitfall 8.)

## Sources

### Primary (HIGH confidence)
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/phases/05-hemisphere-season-helpers-pure-utility-switchover/05-CONTEXT.md` — locked decisions (FIRST in research scope)
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/REQUIREMENTS.md` — requirements WATER-05/06, SEASON-01/02/03/04
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — defensive fallback ladder, mapper locks, B4 invariant
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/phases/04-schema-foundation-migration-core/04-VERIFICATION.md` — Phase 4 invariants (B4 null-guard parity, ALLOWLIST 27 entries)
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/STATE.md` — accumulated decisions across all Phase-4 plans
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — project-wide i18n + design system rules
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantLogic.ts` (47 LoC) — current `getTasksForDay`, `getNextWaterDate`, `getWaterIntervalDays`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantHealth.ts` (276 LoC) — current `calculatePlantHealth` with overdue-water penalty block to gate
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/notificationScheduler.ts` (951 LoC) — current scheduler with `lightLevel`-aware Phase-4 refactor
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/migration.ts` (232 LoC) — Phase-4 mappers (read-only, do not modify in Phase 5)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/tipSelector.ts` (122 LoC) — **EXISTING `getSeason`** (4-season UI) — naming-collision evidence
- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useSeason.ts` — wraps `getCurrentSeason` for theme palette; co-exists with Phase 5 helper
- `/Users/gaston/Documents/Personal/MiJardinApp/src/types/index.ts` — `Task`, `Plant`, `WaterSchedule`, `WaterMode`, `LightLevel` types
- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useStorage.tsx` — `location: Location | null` state source; debounced save patterns
- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useNotifications.ts` — `scheduleMorningReminder` + `scheduleSmartSunNotifications` callers
- `/Users/gaston/Documents/Personal/MiJardinApp/src/screens/TodayScreen.tsx` — `plantsWithTasks` (parallel cadence path that must stay in sync)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/wateringRecommendations.ts` — 2 callers of `getNextWaterDate`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/PlantCard.tsx` — `getNextWaterDate` + `calculatePlantHealth` caller
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/MyPlantDetailModal.tsx` — `calculatePlantHealth` caller
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/DayDetail.tsx` — task discriminator (icon + label switches)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/DayDetailModal.tsx` — task discriminator (4 chains: isDone, handlePress, bgColor, textColor)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/components/MonthCalendar.tsx` — task discriminator (3 indicator booleans)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/i18n/locales/en/common.json` — current task-related keys (`dayDetail.taskWater/taskSun/taskOutdoor`, `notifications.water/sun/outdoor`)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/i18n/locales/es/common.json` — same, Spanish (voseo verified by Phase 4 Plan 06)
- `/Users/gaston/Documents/Personal/MiJardinApp/scripts/migration-smoke-test.mjs` — Phase-4 smoke runner (extend, do not replace)
- `/Users/gaston/Documents/Personal/MiJardinApp/scripts/check-no-legacy-reads.js` — CI grep guard (do NOT add to ALLOWLIST in Phase 5)
- `/Users/gaston/Documents/Personal/MiJardinApp/tests/fixtures/v0-app-data.json` — 7-plant fixture (extend or fork for Phase-5 scenarios)
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/codebase/CONVENTIONS.md` — naming/imports/error patterns
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/config.json` — `nyquist_validation: true` (Validation Architecture section required)
- `/Users/gaston/Documents/Personal/MiJardinApp/package.json` — confirms `typescript ~5.9.2`, `react-i18next ^16.5.4`, no test framework

### Secondary (MEDIUM confidence)
- N/A — All findings sourced from project files; no external lookups needed for Phase 5 (pure-utility refactor with no new deps).

### Tertiary (LOW confidence)
- N/A.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All deps already installed; Phase 5 adds zero packages.
- Architecture: HIGH — Pattern already established in Phase 4 (defensive fallback ladder, single-source-of-truth mappers, framework-free utilities, B4 null-guard parity).
- Pitfalls: HIGH — Discovered the `getSeason` naming collision via direct codebase scan (Pitfall 1); validated all 6 task-type-discriminating call sites by grep (Pitfall 8); validated 5 `getNextWaterDate` callers (Pitfall 9). All confidence rooted in existing source files, not training data.
- Validation: HIGH — Pattern from Phase 4 smoke runner (`typescript.transpileModule` + assertions) is directly extensible; no test framework required.
- I18n strategy: HIGH — Phase 4 Plan 06 already established voseo verification pattern; same applies to Phase 5 keys.

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (30 days — Phase 5 scope is bounded by current codebase state; no fast-moving external deps).
