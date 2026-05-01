---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "02"
subsystem: seasonality-ssot
tags: [getEffectiveSeason, climate-override, season-threading, ssot, wave-0]
dependency_graph:
  requires:
    - "ClimateOverride type + useStorage wiring (Plan 07-01)"
    - "getWaterSeason private helper (Phase 5)"
    - "getNextWaterDate / getTasksForDay signatures (Phase 5)"
  provides:
    - "getEffectiveSeason(location, climateOverride, date): WaterSeason — public SSOT exported from seasonality.ts"
    - "getWaterSeason module-private (export removed) — zero external callers"
    - "getNextWaterDate(plant, today, season: WaterSeason) — signature migration"
    - "getTasksForDay(plants, day, season: WaterSeason) — signature migration"
    - "All 8+ production call sites migrated to pre-compute season via getEffectiveSeason"
    - "Phase 7 smoke: PASS 21/21 (4 foundation + 17 matrix assertions)"
  affects:
    - "src/screens/TodayScreen.tsx (Plan 07-07 LocationBanner reads effectiveSeason)"
    - "src/components/SettingsPanel.tsx (Plan 07-07 setClimateOverride consumer)"
    - "All downstream consumers of season-aware utilities"
tech_stack:
  added: []
  patterns:
    - "getEffectiveSeason as public SSOT — 4-branch dispatch (tropical/northern/southern/auto)"
    - "Pattern A: component computes season inline via getEffectiveSeason (PlantCard, MyPlantDetailModal)"
    - "Pattern B: prop ratchet to season: WaterSeason (DayDetail, DayDetailModal, MonthCalendar, GardenHealth, WateringTips)"
    - "Pre-compute season once per render/effect — thread to all consumers"
    - "Rule 1 auto-fix: migration-smoke-test uses getEffectiveSeason + ws() wrapper instead of private getWaterSeason"
key_files:
  created: []
  modified:
    - "src/utils/seasonality.ts"
    - "src/utils/plantLogic.ts"
    - "src/utils/plantHealth.ts"
    - "src/utils/wateringRecommendations.ts"
    - "src/utils/notificationScheduler.ts"
    - "src/components/PlantCard.tsx"
    - "src/components/MyPlantDetailModal.tsx"
    - "src/components/DayDetail.tsx"
    - "src/components/DayDetailModal.tsx"
    - "src/components/MonthCalendar.tsx"
    - "src/components/GardenHealth.tsx"
    - "src/components/WateringTips.tsx"
    - "src/hooks/useNotifications.ts"
    - "src/screens/TodayScreen.tsx"
    - "src/screens/CalendarScreen.tsx"
    - "src/screens/SettingsScreen.tsx"
    - "App.tsx"
    - "scripts/smoke-phase07.mjs"
    - "scripts/migration-smoke-test.mjs"
decisions:
  - "Pattern A vs B: components that had getWaterSeason import get Pattern A (inline compute); components that only threaded latitude get Pattern B (prop ratchet to season: WaterSeason)"
  - "PlantCard keeps latitude prop (Pattern A) — too many call sites to ratchet; derives Location inline for getEffectiveSeason"
  - "TodayScreen uses effectiveSeason name (not season) to avoid collision with useSeason hook"
  - "Rule 3 auto-fixes: GardenHealth, WateringTips, useNotifications were not in plan but blocking — migrated same day as Task 4"
  - "Rule 1 auto-fix: migration-smoke-test had direct getWaterSeason import; replaced with getEffectiveSeason + ws() wrapper preserving all SEASON-01..03 assertion contracts"
  - "smoke-phase07.mjs gets typescript + compile function inline (not imported separately) — same pattern as smoke-phase06.mjs"
metrics:
  duration: "~18 min"
  completed: "2026-05-01"
  tasks_completed: 6
  files_modified: 19
---

# Phase 7 Plan 2: getEffectiveSeason SSOT + Season Signature Migration Summary

New public `getEffectiveSeason(location, climateOverride, date)` replaces `getWaterSeason` as the production SSOT; signatures of `getNextWaterDate` and `getTasksForDay` change from `latitude: number | null` to `season: WaterSeason`; all 8+ production call sites migrated with season pre-computed once per render/scheduler tick via `getEffectiveSeason`.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add getEffectiveSeason + remove export from getWaterSeason | 2bf2cd2 | src/utils/seasonality.ts |
| 2 | Migrate plantLogic.ts — getNextWaterDate + getTasksForDay take season | 9396b50 | src/utils/plantLogic.ts |
| 3 | Migrate utility-layer callers — plantHealth + wateringRecommendations + notificationScheduler | a5f7d22 | src/utils/plantHealth.ts, src/utils/wateringRecommendations.ts, src/utils/notificationScheduler.ts |
| 4 | Migrate component-layer callers — PlantCard + MyPlantDetailModal + DayDetail + DayDetailModal + MonthCalendar | 1969709 | src/components/ ×5, src/components/GardenHealth.tsx, src/components/WateringTips.tsx, src/hooks/useNotifications.ts |
| 5 | Migrate screen + App.tsx callers — TodayScreen + CalendarScreen + SettingsScreen + App.tsx | 57cc2ff | src/screens/ ×3, App.tsx |
| 6 | Extend smoke-phase07.mjs with getEffectiveSeason matrix (21/21 PASS) | f7182a6 | scripts/smoke-phase07.mjs |
| Rule 1 fix | Update migration-smoke-test to use getEffectiveSeason | 11773bf | scripts/migration-smoke-test.mjs |

## getEffectiveSeason Signature + Branch Table

```typescript
export function getEffectiveSeason(
  location: Location | null,
  climateOverride: ClimateOverride | undefined,
  date: Date
): WaterSeason
```

| Override | Behavior |
|----------|----------|
| `'tropical'` | Always returns `'warm'` (SEASON-02 carry) |
| `'northern'` | Apr-Sep → `'warm'`, Oct-Mar → `'cold'` (explicit hemisphere flip) |
| `'southern'` | Apr-Sep → `'cold'`, Oct-Mar → `'warm'` (inverse) |
| `'auto'` + location set | Delegates to internal `getWaterSeason(location.lat, date)` |
| `'auto'` + `location === null` | Returns `'warm'` (LOC-03 fallback — never under-water) |
| `undefined` (defensive) | Treated as `'auto'` |

## Full List of Migrated Call Sites

### src/utils/plantLogic.ts
- `getNextWaterDate(plant, today, latitude)` → `getNextWaterDate(plant, today, season: WaterSeason)` — removes internal `getWaterSeason` call
- `getTasksForDay(plants, day, latitude)` → `getTasksForDay(plants, day, season: WaterSeason)`
- Import: `import { getWaterSeason, type WaterSeason }` → `import type { WaterSeason }`

### src/utils/plantHealth.ts
- `calculatePlantHealth(plant, today, weather, diagnoses, latitude)` → `calculatePlantHealth(plant, today, weather, diagnoses, season: WaterSeason)` — passes to `getNextWaterDate`
- `calculateGardenHealth(plants, today, weather, diagnosisHistory, latitude)` → `...season: WaterSeason` — passes to `calculatePlantHealth`

### src/utils/wateringRecommendations.ts
- `getWateringRecommendations(plants, weather, today, latitude)` → `...season: WaterSeason`
- Two `getNextWaterDate(plant, today, latitude)` → `getNextWaterDate(plant, today, season)` (lines 45 + 52)

### src/utils/notificationScheduler.ts
- `createMorningContent(plants, weather, latitude, healthStatuses)` → `...season: WaterSeason,...`
- `scheduleMorningReminder(time, plants, weather, latitude, healthStatuses)` → `...season: WaterSeason,...`

### src/components/PlantCard.tsx (Pattern A)
- Adds `const { climateOverride } = useStorage()`
- Derives `locationObj: Location | null` inline from `latitude` prop
- Computes `currentSeason = getEffectiveSeason(locationObj, climateOverride, today)` once per render
- Passes `currentSeason` to `getNextWaterDate` and `calculatePlantHealth`
- Replaces `import { getWaterSeason }` with `import { getEffectiveSeason }`

### src/components/MyPlantDetailModal.tsx (Pattern A)
- Replaces `import { getWaterSeason }` with `import { getEffectiveSeason }`
- Adds `climateOverride` to `useStorage()` destructure
- Both useMemo blocks use `getEffectiveSeason(locationObj, climateOverride, today)` with `Location | null` derived from `latitude` prop
- `useMemo` deps arrays updated to include `climateOverride`

### src/components/DayDetail.tsx (Pattern B)
- Prop: `latitude: number | null` → `season: WaterSeason`
- `getTasksForDay(plants, date, latitude)` → `getTasksForDay(plants, date, season)`

### src/components/DayDetailModal.tsx (Pattern B)
- Same as DayDetail

### src/components/MonthCalendar.tsx (Pattern B)
- Same as DayDetail

### src/components/GardenHealth.tsx (Rule 3 — Pattern B)
- Prop: `latitude: number | null` → `season: WaterSeason`
- `calculateGardenHealth(plants, today, weather, diagnosisHistory, latitude)` → `...season`

### src/components/WateringTips.tsx (Rule 3 — Pattern B)
- Prop: `latitude: number | null` → `season: WaterSeason`
- `getWateringRecommendations(plants, weather, today, latitude)` → `...season`

### src/hooks/useNotifications.ts (Rule 3 — hook option)
- Option: `latitude: number | null` → `season: WaterSeason`
- Two `calculateGardenHealth(..., latitude)` → `...season`
- Two `scheduleMorningReminder(..., latitude, ...)` → `...season,...`

### src/screens/TodayScreen.tsx
- Adds `climateOverride` to `useStorage()` destructure
- Computes `effectiveSeason = getEffectiveSeason(location, climateOverride, today)` once
- Passes `season: effectiveSeason` to `useNotifications` (replaces `latitude`)
- Passes `season={effectiveSeason}` to `WateringTips`, `GardenHealth`
- Three `getNextWaterDate(..., location?.lat ?? null)` → `...effectiveSeason`
- `PlantCard` retains `latitude` prop (Pattern A — card computes season internally)

### src/screens/CalendarScreen.tsx
- Adds `climateOverride` to `useStorage()` destructure
- Computes `effectiveSeason = getEffectiveSeason(location, climateOverride, new Date())`
- `MonthCalendar latitude={...}` → `season={effectiveSeason}`
- `DayDetailModal latitude={...}` → `season={effectiveSeason}`

### src/screens/SettingsScreen.tsx
- Adds `climateOverride` to `useStorage()` destructure
- Computes `effectiveSeason`, passes `season: effectiveSeason` to `useNotifications`

### App.tsx
- Computes `const season = getEffectiveSeason(location, climateOverride, new Date())`
- `scheduleMorningReminder(..., location?.lat ?? null, ...)` → `...season,...`

## Smoke Runner Assertion Count

Phase 7 smoke: PASS 21/21
- 4 foundation assertions (Plan 07-01 ClimateOverride hydration parity)
- 17 matrix assertions (Plan 07-02):
  - `getEffectiveSeason` exported as function ×1
  - `getWaterSeason` NOT exported (SSOT lock) ×1
  - tropical override → always 'warm' ×3
  - northern override flip ×3
  - southern override flip ×2
  - auto → GPS-derived (NY + BA + SG) ×3
  - auto + null location → 'warm' (LOC-03) ×1
  - undefined climateOverride treated as 'auto' ×1
  - TZ-safe Date constructors (no ISO strings) ×0 violations

Phase 6 smoke: PASS 82/82 (regression preserved)
Migration smoke: PASS 106/106 (regression preserved, updated to use getEffectiveSeason via ws() wrapper)

## SEASON-04 Invariant Verification

`grep -c "getWaterSeason" src/utils/notificationScheduler.ts` === 0

Confirmed: `notificationScheduler.ts` does NOT directly import `getWaterSeason`. Season reaches it via `getTasksForDay(plants, day, season)` call chain (single source of truth via call chain, not via import duplication).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing call sites] GardenHealth.tsx + WateringTips.tsx + useNotifications.ts**
- **Found during:** Task 4 (component migration)
- **Issue:** These 3 files also had `latitude: number | null` parameters feeding `calculateGardenHealth` / `getWateringRecommendations` / `scheduleMorningReminder` — not enumerated in plan's Task 4 file list
- **Fix:** Applied Pattern B to GardenHealth and WateringTips; updated `UseNotificationsOptions.season` field + both call sites inside hook
- **Files modified:** src/components/GardenHealth.tsx, src/components/WateringTips.tsx, src/hooks/useNotifications.ts
- **Commit:** 1969709

**2. [Rule 1 - Bug] migration-smoke-test.mjs directly imported getWaterSeason (now private)**
- **Found during:** Task 6 final verification (regression suite)
- **Issue:** `migration-smoke-test.mjs` destructured `getWaterSeason` from seasonality module; it's now module-private and returns `undefined` at runtime → TypeError
- **Fix:** Replaced with `getEffectiveSeason` + thin `ws(lat, date)` wrapper that calls `getEffectiveSeason({lat,...}|null, 'auto', date)` — preserves all SEASON-01..03 behavior assertions exactly
- **Files modified:** scripts/migration-smoke-test.mjs
- **Commit:** 11773bf

## Self-Check: PASSED

- FOUND: src/utils/seasonality.ts (export function getEffectiveSeason: count=1; export function getWaterSeason: count=0; function getWaterSeason: count=1)
- FOUND: src/utils/plantLogic.ts (season: WaterSeason: count=4; latitude: number | null in signature: count=0 in production code)
- FOUND: scripts/smoke-phase07.mjs (exits 0, PASS 21/21)
- FOUND: scripts/migration-smoke-test.mjs (exits 0, 106/106 PASS)
- Commits: 2bf2cd2, 9396b50, a5f7d22, 1969709, 57cc2ff, f7182a6, 11773bf — all present in git log
- tsc --noEmit: exits 0 (project-wide green)
- getWaterSeason in src/: only in seasonality.ts (definition + internal call + JSDoc) and a comment in MyPlantDetailModal.tsx + types/index.ts JSDoc — zero production callers
