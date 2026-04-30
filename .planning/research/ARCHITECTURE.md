# ARCHITECTURE — v1.1 Precision Care

**Researched:** 2026-04-29
**Mode:** Project Architecture (subsequent milestone)
**Confidence:** HIGH (all findings grounded in current source files)

## Executive Recommendation

This is a **schema-evolution milestone**, not a feature-addition milestone. Three concentric rings:

1. **Core schema + migration** (Plant types, AppData versioning, runtime migration on load)
2. **Derived helpers** (season/lightLevel/effective-water-interval) consumed by `plantHealth`/`plantLogic`
3. **UI propagation** (every screen reading `waterEvery`/`sunHours` reads new fields, every plant-creating flow writes new fields)

The **existing `useStorage` shape is the bottleneck**: a single AsyncStorage key (`'plant-agenda-v2'`) holds everything. Schema change is "all-or-nothing" on app boot. Recommend **eager migration on load** with versioned envelope. Keep `waterEvery` and `sunHours` as `@deprecated` optional for one release as safety net.

**Diagnosis chat continuity fix is fully isolated** (one file: `DiagnosisDetailModal.tsx:248`) — bundle as the **last small phase**.

**Catalog rebalance is data-only** (no user migration — references catalog by `databaseId`), but must ship in same release as user-data migration so backfill mappings stay consistent.

## Data Flow

### Warm/Cold Derivation Chain

```
Location (AppData.location.lat) ───┐
                                   │
Date (new Date() at render time) ──┤
                                   ▼
                         getSeason(lat, date)            ← src/utils/seasonality.ts (NEW)
                         returns 'warm' | 'cold'
                                   │
                                   ▼
                  getEffectiveWaterEvery(plant, season)  ← src/utils/plantLogic.ts (modified)
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
        getNextWaterDate()                 calculatePlantHealth()
        (plantLogic.ts — modified)          (plantHealth.ts — modified)
```

**Single derivation point:** new hook `useWarmCold(location)` in `src/hooks/useSeason.ts`.

```ts
export function useWarmCold(location: Location | null): 'warm' | 'cold' {
  const { season } = useSeason(location);   // 'spring' | 'summer' | 'fall' | 'winter'
  return season === 'summer' || season === 'spring' ? 'warm' : 'cold';
}
```

**CRITICAL:** `plantLogic.ts` and `plantHealth.ts` are pure utilities (no React) — pass `season: 'warm' | 'cold'` (or `location: Location | null`) as argument. Screens get it via `useWarmCold(location)`; tests/notification scheduler call `getSeason(lat, date)` directly.

This matches existing pattern: `calculatePlantHealth(plant, today, weather, diagnoses)` already takes `today`/`weather` as args, not context.

## Schema Migration Strategy

### Versioned Envelope

```ts
// src/types/index.ts
export interface PersistedAppData {
  schemaVersion: number;   // 0 = legacy unwrapped, 1 = post-v1.1 wrapped
  data: AppData;
}
```

**Loading in `useStorage.tsx` (lines 144-207):**

```ts
const stored = await AsyncStorage.getItem(STORAGE_KEY);
if (stored) {
  const raw = JSON.parse(stored);
  const persisted: PersistedAppData = isVersioned(raw)
    ? raw
    : { schemaVersion: 0, data: raw };
  const data = runMigrations(persisted);
}
```

`runMigrations(persisted)` runs ordered array of migration functions — easy to extend in v1.2.

### The 0 → 1 Migration

```ts
// src/utils/migration.ts (NEW)
function migratePlant_0to1(plant: LegacyPlant): Plant {
  const lightLevel = sunHoursToLightLevel(plant.sunHours);
  const dbEntry = findDatabaseEntry({ ...plant } as Plant);
  const category = dbEntry?.category;

  const warmDays = plant.waterEvery;
  const coldDays = applyColdFactor(warmDays, category);

  const waterMode = isSoilCheckCategory(plant.typeId, dbEntry)
    ? 'soil_check'
    : 'fixed';

  return {
    ...plant,
    lightLevel,
    waterSchedule: { warm: warmDays, cold: coldDays },
    waterMode,
    // Keep legacy fields for one release as @deprecated
    waterEvery: plant.waterEvery,
    sunHours: plant.sunHours,
  };
}
```

**Mapping tables:**

```ts
function sunHoursToLightLevel(h: number): LightLevel {
  if (h >= 5) return 'direct';            // lavanda 6, petunia 6, cactus 6
  if (h >= 3) return 'bright_indirect';   // ficus 4, monstera 3, jazmin 5
  if (h >= 2) return 'medium_indirect';   // potus 2, sansevieria 2, calathea 2
  return 'low';                           // helecho 1
}

function applyColdFactor(warmDays: number, category?: PlantCategory): number {
  const factor: Record<PlantCategory, number> = {
    suculentas: 2.0,
    interior:   1.5,
    exterior:   1.7,
    aromaticas: 1.5,
    huerta:     1.3,
    frutales:   1.5,
  };
  return Math.round(warmDays * (factor[category ?? 'interior'] ?? 1.5));
}
```

**Guard rails:**
- Idempotency: if `plant.waterSchedule` exists, return as-is
- Validation: clamp `coldDays ∈ [1, 30]`
- Logging: `if (__DEV__) console.log('[Migration] migrated', plants.length, 'plants from v0 to v1')`

### Catalog Migration (No User Migration Needed)

`PLANT_DATABASE` is static TS. Three reference paths:
1. `plant.databaseId` → exact id match
2. `plant.name` ↔ `db.name` fuzzy match
3. `plant.typeId` ↔ `db.id` fallback

**None break when adding fields to `PlantDBEntry`.** Catalog rebalance is purely additive. User plants either:
- Were created from catalog → migrated via `migratePlant_0to1`
- Lookup catalog at render time → automatically gets new fields

**Action:** every existing 60+ entry in `PLANT_DATABASE` gains `lightLevel`, `waterSchedule`, `waterMode`. Use same deterministic mapping as user migration so behavior matches.

### Rollback / Failure Mode

If migration throws:
1. Catch in `loadData()` (currently swallows errors silently, line 200-202)
2. **DON'T overwrite** AsyncStorage; surface error via non-blocking banner
3. Log to analytics

Prevents single bad plant from nuking save.

## File Inventory

### NEW Files

| File | Purpose | LOC |
|------|---------|-----|
| `src/utils/seasonality.ts` | `getSeason(lat, date) → 'warm' \| 'cold'` | ~30 |
| `src/utils/migration.ts` | `runMigrations`, `migratePlant_0to1`, mapping helpers | ~120 |

### MODIFIED Files

| File | Change | Risk |
|------|--------|------|
| `src/types/index.ts` | Add `LightLevel`, `WaterMode`, `WaterSchedule`, `PersistedAppData`; add fields to `Plant`/`PlantDBEntry`; mark `waterEvery`/`sunHours` `@deprecated` optional | Low (additive) |
| `src/hooks/useStorage.tsx` | Detect legacy envelope on load (lines 144-207), call `runMigrations`, persist with new envelope on save | **High** — entire app loads through this |
| `src/hooks/useSeason.ts` | Add `useWarmCold(location)` exported helper | Low |
| `src/utils/plantLogic.ts` | `getNextWaterDate(plant, today, season)`, `getTasksForDay(plants, day, season)`, handle `waterMode === 'soil_check'` | Medium — many callers |
| `src/utils/plantHealth.ts` | Accept `season` param; replace `plant.waterEvery` lookup with seasonal. Suppress overdue penalty for soil_check | High — central UX |
| `src/utils/plantInfo.ts` | `isSensitiveToSun` (line 70) uses `plant.sunHours <= 3` → switch to `lightLevel`. Add `getEffectiveWaterEvery(plant, season)` | Medium |
| `src/utils/notificationScheduler.ts` | Reads `waterEvery` → seasonal lookup; computes season via `getSeason(location.lat, new Date())` | Medium |
| `src/components/AddPlantModal.tsx` | Replace `sunHours` text input with `lightLevel` picker (4 buttons); `waterEvery` → conditional warm/cold inputs | Medium — UX |
| `src/components/MyPlantDetailModal.tsx` | Display `lightLevel` (translated) instead of `${sunHours}h sol`; show effective interval with season badge ("Cada 5 días — temporada cálida") | Medium |
| `src/components/PlantCard.tsx`, `PlantDetailModal.tsx`, `PlantDatabaseCard.tsx`, `PlantHealthDetail.tsx` | Render `lightLevel` instead of `sunHours` | Low |
| `src/components/DayDetail.tsx`, `MonthCalendar` | Pass `season` through to `getTasksForDay` | Low |
| `src/components/PlantIdentifier/IdentificationResults.tsx`, `usePlantIdentification.ts`, `plantIdentification.ts` | `IdentifiedPlant` type emits `waterDays`/`sunHours` → extend to emit `lightLevel`/`waterSchedule`. Edge function `identify-plant` may need update | Medium — touches edge function |
| `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`, `plantDiagnosis.ts` | `PlantDiagnosisContext` has `waterEvery: number; sunHours: number` → migrate. `chat-diagnosis` and `diagnose-plant` edge functions update payload | Medium — server contract |
| `src/screens/OnboardingScreen.tsx` | Plant creation emits new shape. **Also: location prompt + non-blocking banner** | High — error-prone surface |
| `src/data/plantDatabase.ts` | Every entry gains new fields. Add 10-15 outdoor plants | Medium — data volume |
| `src/data/constants.ts` | `PLANT_TYPES` (lines 21-44) declare `waterDays`/`sunHours` per type — add new fields | Low |
| `src/services/plantKnowledgeService.ts` | If returns `waterDays`/`sunHours`, must emit new fields | Medium |
| `src/components/PlantDiagnosis/DiagnosisDetailModal.tsx` | Line 248: remove `isPremium &&` from Continue chat button | **Low — fully isolated** |
| `src/i18n/locales/{en,es}/{common,plants}.json` | New keys: `lightLevel.{direct,bright_indirect,medium_indirect,low}`, `waterMode.soil_check`, `season.{warm,cold}`, location-missing banner copy | Low (mechanical) |

### NOT to touch

- `src/services/syncService.ts` deeper changes — `Features.CLOUD_SYNC` is false; defer
- `src/services/authService.ts`, `useAuth.ts`, `LoginScreen.tsx` — V1.1 auth flag stays off

## Build Order (Phase Decomposition)

### Phase A — Schema + Migration Foundation (must ship first)

**Goal:** App loads, migrates user data, stores new shape, UI behavior unchanged.

1. Add new types in `src/types/index.ts` (additive)
2. Create `src/utils/migration.ts` with `runMigrations`, `migratePlant_0to1`, mapping helpers
3. Modify `src/hooks/useStorage.tsx` load path to detect envelope, run migrations, persist envelope on save
4. Update `PLANT_DATABASE` (all 60+ entries) with new fields using same mapping

**Acceptance:** App boots, AsyncStorage now contains envelope-wrapped data with new fields populated. Health/tasks still work because legacy fields still exist.

### Phase B — Helpers + Pure-utility Switch-over

**Goal:** `plantLogic`/`plantHealth` consume new fields; legacy fields no longer read.

5. Create `src/utils/seasonality.ts`
6. Add `useWarmCold` to `src/hooks/useSeason.ts`
7. Modify `plantLogic.ts`: new `season` param. `soil_check` plants → different task type
8. Modify `plantHealth.ts`: new `season` param. Suppress overdue for `soil_check`
9. Modify `plantInfo.ts` sensitivity logic
10. Modify `notificationScheduler.ts`

### Phase C — UI Propagation (Read Side)

11. Every display component shows new model
12. New i18n keys

### Phase D — UI Propagation (Write Side)

13. `AddPlantModal` form rewrite
14. `OnboardingScreen` — location prompt + banner
15. `PlantIdentifier` flow + edge function
16. `PlantDiagnosisContext` updated

### Phase E — Catalog Rebalance

17. Add 10-15 outdoor entries
18. Audit existing entries for category-appropriate `lightLevel`
19. New i18n keys for new plants

### Phase F — Diagnosis Chat Continuity

20. `DiagnosisDetailModal.tsx:248` — remove `isPremium &&` gate
21. Verify continuation flow end-to-end
22. Surface paywall on tap for free users at message limit

**Why this order:**
- A before everything: anything else without migration corrupts user data
- B before C/D: UI consumes new fields, utilities must be ready
- C before D: read-side lower risk, shake out display bugs first
- D before E: new catalog uses same emit shape as new-plant flows
- F last: zero coupling to schema work; can be hotfix patch

## Patterns to Follow

1. **Pass derived season as argument to pure utilities** — never import hooks into utils
2. **Versioned envelope, ordered migrations**
3. **Deterministic mapping functions reused across migrations and catalog** — guarantees user plants and catalog reference start aligned
4. **Premium gate on tap, not on render** — show CTAs to all users, paywall on action

## Anti-Patterns

1. **Lazy per-plant migration on read** — pollutes consumers, prevents dropping legacy fields
2. **Reading `useStorage` from inside `plantHealth.ts`** — breaks testability + notification scheduler
3. **Hard-cut legacy fields this release** — zero safety net if migration ships with bug
4. **Migrating PLANT_DATABASE with different mapping than user plants** — UX inconsistency
5. **Forgetting i18n on new strings** — project rule: never hardcode user-facing strings; Spanish uses vos

## Open Questions for Planners

1. **`waterMode === 'soil_check'` task UX.** What does Hoy show? Options: (a) `'water_check'` task type with own icon, (b) passive tip, (c) nothing. Current `Task` type only has `'water' | 'sun' | 'outdoor'`. Decide before Phase B.
2. **Edge function compatibility window.** When edge functions accept `lightLevel`/`waterSchedule`, in-flight chats from older app versions send legacy fields. Either accept both shapes server-side for one release, or version the edge function.
3. **Migration analytics.** Recommend yes — `migration_v0_v1` event with `plantCount`.
4. **iOS submit timing.** Onboarding location prompt is **not** new collection — already declared. No manifest update needed.
5. **`PlantType` constants** in `constants.ts` — extend the 8 hardcoded plant types or deprecate in favor of catalog. For this milestone just extend.

## Confidence Summary

| Area | Confidence | Reason |
|------|------------|--------|
| Data flow design | HIGH | Existing patterns make recommendation idiomatic |
| Migration strategy | HIGH | AsyncStorage shape and load path inspected directly |
| File-by-file impact | HIGH | Grep across all `.ts/.tsx` confirmed every reference |
| Build order | HIGH | Driven by dependency analysis |
| Cold-factor table values | MEDIUM | Reasonable defaults; horticultural review recommended |
| `lightLevel` mapping thresholds | MEDIUM | Some entries (orquídea, calathea) may need hand-correction |
| Edge function impact | MEDIUM | Inferred from types; edge function implementations not read |
| Diagnosis chat fix scope | HIGH | Single-line change; isolation confirmed |
