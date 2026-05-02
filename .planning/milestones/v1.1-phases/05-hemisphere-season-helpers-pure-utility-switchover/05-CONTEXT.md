# Phase 5: Hemisphere/Season Helpers + Pure-Utility Switchover - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor the pure-utility layer (`plantLogic`, `plantHealth`, `notificationScheduler`) to consume `lightLevel` + `waterSchedule` + season instead of legacy `sunHours`/`waterEvery`. Introduce three-zone seasonality (`'warm' | 'cold' | 'tropical'`) via a new `getSeason(latitude, date)` helper. Add a new `'check_soil'` task type for `waterMode === 'soil_check'` plants that does NOT incur health-score penalty for "overdue" watering.

**No UI work in this phase** — copy strings, badges, empty-state messaging belong to Phase 6 (UX-02, UX-03, SEASON-05). Phase 5 only emits the right data and tasks; Phase 6 renders them.

Locked from REQUIREMENTS.md: WATER-05, WATER-06, SEASON-01, SEASON-02, SEASON-03, SEASON-04.

</domain>

<decisions>
## Implementation Decisions

### Soil-Check Task UX (Phase 5 emits, Phase 6 displays)
- `'check_soil'` task generates with **same tap-to-done UX** as existing `'water'` task — single tap completes, no two-button "was wet / I watered" split. Defers complexity to a future milestone if data shows users need it.
- Next `'check_soil'` schedules using **same** `waterSchedule.{warm, cold}` interval as fixed plants — `mode` is the dispatcher, not the cadence source. Single source of truth across modes.
- Task only appears in "Hoy" on **check-in days** (when `lastWatered + currentSeasonInterval ≤ today`). Non-check-in days emit no task; UX-03 empty-state copy ("Te avisamos en N días") is Phase 6.
- Health score does **NOT** penalize soil_check plants for "no check_soil action in N days" — extending WATER-06's spirit. Soil_check plants are "always healthy on the water axis"; health degrades only via diagnosis or other axes (sun, outdoor, weather extremes).

### Season Transition Behavior
- On month boundary (Oct 1 Northern, Apr 1 Southern), next-water-date is **recomputed** from `lastWatered + currentSeasonInterval`. A plant whose interval flips warm 5d → cold 10d will have next-water shift forward by 5 days. Simpler, no "remember which interval generated the original next-date" tracking.
- Tropical zone: `lat ∈ [-23.5°, 23.5°]` **inclusive** (matches Tropic of Cancer/Capricorn standard). São Paulo (lat -23.5) qualifies as tropical; Buenos Aires (lat -34.6) is Southern temperate.
- When `location === null` (Phase 7 wires LOC-03 fallback later, but Phase 5 utilities must not crash): `getSeason()` returns `'warm'` as the safe default. Aligns with LOC-03 ("never under-water by default").
- `currentSeason` is **recomputed on every read**, not cached. The function is pure (lat + date → string), cheap (~5 ops), and avoids cache-invalidation complexity at season boundaries.

### Boundaries with Scheduler / Health / Phase 6
- `notificationScheduler.ts` **imports `getSeason()` directly**. Single source of truth, location is already in scheduler context via `Plant`/`Location` consumers. Avoids passing season through multiple call sites.
- `getTasksForDay(plants, day)` and health calculator apply a **defensive fallback ladder**: v1.1 `waterSchedule.{warm,cold}` → legacy `waterEvery` → safe default (e.g. 7 days). Same defensive pattern Phase 4 (Plan 04) established.
- Plants with `waterMode === 'soil_check'` **never generate** a `'water'` task, even on first encounter without `lastWatered`. Mode is the dispatcher — `'soil_check'` → emits `'check_soil'` (or nothing if not check-in day); `'fixed'` → emits `'water'` (or nothing).
- UX-03 empty-state copy ("Tu cactus está en modo chequeo. Te avisamos en N días.") is **Phase 6**, not here. Phase 5 only computes the next-check-in date and exposes it; Phase 6 will render the empty state when "Hoy" has zero tasks for a soil_check plant.

### Mapper Locks (carried over from Phase 4)
- `lightLevelToSunHours` (used internally by scheduler): `{ direct: 5, bright_indirect: 0, medium_indirect: 0, low: 0 }`. Only `direct` plants get scheduled outdoor sun reminders. Locked in Phase 4 Plan 04.
- Display-layer light label mapping (used by Phase 6 UI): `{ direct: 6, bright_indirect: 4, medium_indirect: 2, low: 0/1 }`. Decoupled from scheduler mapping per Phase 4 decision.

### Claude's Discretion
- Filename for the season helper (`getSeason.ts` vs add to existing `plantLogic.ts` vs `seasonality.ts`).
- Internal cache layout if profiling later shows recompute is hot (current decision: no cache; revisit only on data).
- Exact constant values for fallback intervals when both v1.1 and legacy fields are missing.
- Whether to expose `getSeasonInterval(plant, season)` as a separate util or inline in callers.
- How to threading `Date` parameter through (default `new Date()` vs required arg).
- Granularity of `__DEV__` logging for season transitions / soil_check task generation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — project guidelines (i18n rules, design system, build/submit)

### Planning artifacts
- `.planning/PROJECT.md` — current milestone, validated requirements, key decisions
- `.planning/REQUIREMENTS.md` §Watering Model (WATER-05, WATER-06) and §Seasonality (SEASON-01..04) — locked requirements for this phase
- `.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — prior phase decisions on mappers, fallback ladder, defensive patterns

### Codebase maps
- `.planning/codebase/STRUCTURE.md` — file layout
- `.planning/codebase/CONVENTIONS.md` — coding patterns
- `.planning/codebase/ARCHITECTURE.md` — runtime flows

### Source files of interest
- `src/utils/plantLogic.ts` — `getTasksForDay`, `getWarmInterval` (already has v1.1-aware fallback per Plan 04). Phase 5 extends with season-aware selection + `check_soil` emission.
- `src/utils/plantHealth.ts` — health score calculator. Phase 5 adds soil_check skip on water-overdue penalty.
- `src/utils/notificationScheduler.ts` — Phase 4 already migrated to `lightLevel`. Phase 5 adds season import for water reminder cadence.
- `src/types/index.ts` — `Task` type extended with `'check_soil'`; `Location` already exists with `lat`.
- `src/hooks/useStorage.tsx` — provides `Location` to consumers; no schema change in Phase 5.

### Migration mapper sources (Phase 4, locked)
- `src/utils/migration.ts` — `sunHoursToLightLevel`, `applyColdFactor`, `inferWaterMode`. Phase 5 reuses these only via `getTranslatedPlant`/data layer; does not modify.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Plant.waterSchedule.{warm,cold}` populated for all migrated plants (Phase 4 invariant).
- `Plant.waterMode: 'fixed' | 'soil_check'` populated for all migrated plants (Phase 4 invariant).
- `Plant.lightLevel` populated for all migrated plants (Phase 4 invariant). Scheduler already consumes it.
- `useStorage().location: Location | null` accessible from any context that already calls `useStorage()`.
- `getWarmInterval(plant)` helper in `plantLogic.ts:5-13` already has v1.1 fallback to `waterEvery`. Phase 5 extends this into a season-aware variant.
- B4 null-guard parity invariant established in Phase 4 Plan 04: `calculateSunWindow(` callers minus declaration MUST equal `if (!window) return` count. Maintain in any new caller introductions.

### Established Patterns
- **Defensive fallback ladder:** v1.1 field → legacy field → safe default. Applied in 5 consumers in Phase 4. New season-aware code follows same shape.
- **Single source of truth for mappers:** Phase 4 used `migration.ts` for both user data + catalog seed. Phase 5 should put `getSeason` in one file imported by all three utility modules.
- **`__DEV__`-gated logging:** `if (__DEV__) console.log(...)` is the trace pattern; no logger abstraction.
- **Pure utilities are stateless:** `getTasksForDay` already recalculates fresh from plant data each call (no task storage). Season computation follows same model — pure functions, no memoization.
- **Skip silent failures:** Phase 4 established that errors in load/migration must trace + emit analytics. Phase 5 utilities should not swallow errors silently either; trace via `__DEV__`.

### Integration Points
- `getTasksForDay(plants, day)` — primary task generator. Phase 5 extends to dispatch on `waterMode` and use `getSeason(location.lat, day)` for interval lookup.
- `calculatePlantHealth(plant, weather)` — primary health calculator. Phase 5 adds soil_check skip path for water-overdue penalty.
- `groupPlantsByLightLevel` + `calculateSunWindow` (notificationScheduler.ts) — Phase 4 already lightLevel-aware. Phase 5 adds water-reminder pathway that uses season.
- `Location` from `useStorage()` is the lat source. Callers already destructure it; Phase 5 utilities accept lat as a primitive arg, not the whole Location, to keep helpers framework-free.

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" (Phase 4) — preserved: prefer simpler implementation over paranoid edge-case coverage. Recompute season on every read, accept that month-boundary days might shift next-water by hours.
- One source of truth for mappers (Phase 4 invariant) — extend to one source of truth for season computation. `getSeason` lives in one file, imported by all three utilities.
- "Plant.lightLevel populated for all migrated plants" — Phase 5 can rely on this. Defensive fallback to legacy `sunHours` is for safety only; primary read path is v1.1 fields.

</specifics>

<deferred>
## Deferred Ideas

- **Two-button check_soil completion** ("estaba húmeda" / "regué") — deferred. Single tap in Phase 5; revisit in v2.0 if telemetry shows users want disambiguation.
- **Memoized currentSeason cache** — deferred. Recompute on read until profiling shows it matters.
- **Per-plant user-configurable seasonal ratio** — out of scope per PROJECT.md (catalog defaults sufficient).
- **Manual climate-zone override (LOC-05)** — Phase 7 territory. Phase 5 derives season from latitude only; Phase 7 layers manual override on top.
- **Season transition smoothing** (linear interpolation between months) — rejected. Hard month-boundary flip per SEASON-03 lock.
- **`getSeasonInterval(plant, season)` named export** — Claude's discretion during implementation; may keep inline.

</deferred>

---

*Phase: 05-hemisphere-season-helpers-pure-utility-switchover*
*Context gathered: 2026-05-01*
