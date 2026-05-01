---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "05"
subsystem: ui-write-side
tags: [add-plant-modal, onboarding, location-step, LIGHT-01, LIGHT-02, WATER-01, WATER-02, WATER-03, LOC-01, LOC-06]
dependency_graph:
  requires:
    - "LightLevelPicker from src/components/LightLevelPicker.tsx (Plan 07-04)"
    - "WaterScheduleEditor from src/components/WaterScheduleEditor.tsx (Plan 07-04)"
    - "inferWaterMode, applyColdFactor, sunHoursToLightLevel from migration.ts (Phase 4)"
    - "onboarding.location.* i18n keys (Plan 07-03)"
    - "updateLocation() action from useStorage (Phase 7 Plan 01)"
    - "expo-location (already installed, used in SettingsScreen)"
  provides:
    - "AddPlantModal with LightLevelPicker + WaterScheduleEditor; new schema emit (LIGHT-01, LIGHT-02, WATER-01, WATER-02, WATER-03)"
    - "OnboardingScreen with 4-step flow: name(0) → location(1) → plants(2) → done(3)"
    - "plantDBToPlant emitting v1.1 schema via Phase 4 defensive ladder (Pitfall 1 fixed)"
  affects:
    - "All write-side plant creation flows (blank create AND edit via prefilledPlant)"
    - "Onboarding location step (LOC-01, LOC-06)"
    - "New users now set location during onboarding (GPS / city / skip)"
tech_stack:
  added: []
  patterns:
    - "prefilledPlant union type: PlantDBEntry | Plant — 'category' in X discriminator for shape detection"
    - "Defensive ladder: v1.1 field ?? legacy field ?? safe default — applied in prefill useEffect + plantDBToPlant"
    - "handleTypeSelect derives waterSchedule from PlantType.waterDays + inferWaterMode"
    - "handleAdd writes lightLevel + waterSchedule + waterMode; no waterEvery/sunHours writes"
    - "OnboardingScreen step-index integer pattern retained (not config-driven); totalSteps 3→4"
    - "Location step inline (not extracted to CitySearchInline.tsx — single call site pragmatism)"
    - "GPS denied path falls through to city search inline (no blocking)"
key_files:
  created: []
  modified:
    - "src/components/AddPlantModal.tsx"
    - "src/screens/OnboardingScreen.tsx"
decisions:
  - "prefilledPlant union type widened to PlantDBEntry | Plant using 'category' in x runtime discriminator — no cast-only approach; allows correct waterMode inference from PlantDBEntry.category vs Plant.typeId"
  - "handleTypeSelect uses inferWaterMode(typeId as any) — typeId maps to PlantCategory string values; type assertion acceptable per RESEARCH pragmatism; Phase 8 can tighten if categories/types diverge"
  - "plantDBToPlant uses all three Phase 4 mappers as single SSOT — sunHoursToLightLevel, inferWaterMode, applyColdFactor — consistent with migration.ts usage; no re-derivation"
  - "Location step city-search kept inline in renderStep1Location (not extracted to CitySearchInline.tsx) — only one call site in Phase 7; CONTEXT.md allows inline for few-callsite cases"
  - "Primary button rendering at step 2 checks 'currentStep === 2 &&' before showEmptyWarning to avoid showing continueAnyway on location/name steps"
metrics:
  duration: "~15 min"
  completed: "2026-05-01"
  tasks_completed: 3
  files_modified: 2
---

# Phase 7 Plan 5: AddPlantModal Swap + Onboarding Location Step Summary

AddPlantModal now uses LightLevelPicker + WaterScheduleEditor exclusively for light and water inputs (legacy waterEvery/sunHours state removed). OnboardingScreen gains a new location step (step 1) between name and plant selection, with GPS / city search / skip vertical-stack actions. The plantDBToPlant helper in OnboardingScreen is fixed to emit the v1.1 schema (Pitfall 1) via Phase 4's canonical mappers.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | AddPlantModal — replace legacy state, useEffect prefill, handleTypeSelect, handleAdd, JSX | 41c3e65 | src/components/AddPlantModal.tsx |
| 2 | OnboardingScreen — fix plantDBToPlant (Pitfall 1) | 6685de8 | src/screens/OnboardingScreen.tsx |
| 3 | OnboardingScreen — insert location step (step 1) + ratchet step count + fix guards | e8f8c7e | src/screens/OnboardingScreen.tsx |

## AddPlantModal Edit Details

### State Replacement
- **Removed:** `const [waterEvery, setWaterEvery] = useState("4")` and `const [sunHours, setSunHours] = useState("3")`
- **Added:** `const [lightLevel, setLightLevel] = useState<LightLevel>('bright_indirect')`, `const [waterSchedule, setWaterSchedule] = useState<WaterSchedule>({ warm: 4, cold: 8 })`, `const [waterMode, setWaterMode] = useState<WaterMode>('fixed')`

### Prefill useEffect — Defensive Ladder
Reads `prefilledPlant.lightLevel ?? 'bright_indirect'`, `prefilledPlant.waterSchedule ?? { warm: legacyDays, cold: legacyDays * 2 }`, `prefilledPlant.waterMode ?? inferWaterMode(cat, dbId)`. Shape discrimination uses `'category' in prefilledPlant` to detect PlantDBEntry vs Plant.

### handleTypeSelect
Derives `waterSchedule` from `plantType.waterDays` (warm/cold x2 default) and `waterMode` from `inferWaterMode(typeId as any)`.

### handleAdd Payload
Writes `lightLevel, waterSchedule, waterMode`. No `waterEvery` or `sunHours` writes.

### JSX Swap
Two `numberInputRow` blocks replaced by:
- `<LightLevelPicker typeId={selectedTypeId} value={lightLevel} onChange={setLightLevel} />`
- `<WaterScheduleEditor mode={waterMode} schedule={waterSchedule} onModeChange={setWaterMode} onScheduleChange={setWaterSchedule} />`

## plantDBToPlant Defensive Ladder Confirmation

```typescript
const lightLevel = dbEntry.lightLevel
  ?? (typeof dbEntry.sunHours === 'number' ? sunHoursToLightLevel(dbEntry.sunHours) : 'bright_indirect');
const waterMode = dbEntry.waterMode ?? inferWaterMode(dbEntry.category, dbEntry.id);
const waterSchedule = dbEntry.waterSchedule ?? {
  warm: dbEntry.waterDays ?? 4,
  cold: applyColdFactor(dbEntry.waterDays ?? 4, dbEntry.category),
};
```

All three Phase 4 canonical mappers used. Legacy writes (`waterEvery: dbEntry.waterDays`, `sunHours: dbEntry.sunHours`) removed entirely.

## OnboardingScreen Step Machine Deltas

| Property | Before | After |
|----------|--------|-------|
| StepIndicator totalSteps | 3 | 4 |
| Step 0 | name | name (unchanged) |
| Step 1 | plants | location (NEW — renderStep1Location) |
| Step 2 | done/summary | plants (was step 1) |
| Step 3 | — | done/summary (was step 2) |
| handleNext plant-empty guard | currentStep === 1 | currentStep === 2 |
| handleNext advancement cap | currentStep < 2 | currentStep < 3 |
| handleBack identifiedPlants reset | currentStep === 1 | currentStep === 2 |
| Primary button "begin" | currentStep >= 2 | currentStep >= 3 |

## Location Handlers (GPS / City Search / Skip)

### handleUseGps
1. `ExpoLocation.requestForegroundPermissionsAsync()` — if denied → `setShowCitySearch(true)` (no blocking)
2. `ExpoLocation.getCurrentPositionAsync({})` + `reverseGeocodeAsync()` → build `Location` object
3. `updateLocation(newLocation)` → `animateTransition('next')`
4. Catch block → `setShowCitySearch(true)` (network failure fallback)

### handleCitySearch
Open-Meteo geocoding API (`https://geocoding-api.open-meteo.com/v1/search`) — same pattern as SettingsScreen. Debounces at `query.length < 2`.

### handleSelectCity
Calls `updateLocation(newLocation)` then `animateTransition('next')`.

### handleSkipLocation
Calls `animateTransition('next')` only — no location set. Warm-fallback (LOC-03) covers this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] prefilledBanner JSX — `.tip` property access on union type**
- **Found during:** Task 1 tsc verification
- **Issue:** `prefilledPlant.tip` — `.tip` exists only on `PlantDBEntry`, not on `Plant`. After widening prop type to union, TypeScript correctly flagged this at line 145.
- **Fix:** Guarded with `'tip' in prefilledPlant` check and cast `(prefilledPlant as PlantDBEntry).tip`
- **Files modified:** `src/components/AddPlantModal.tsx`
- **Commit:** 41c3e65 (bundled with Task 1)

## Regression Results

- `npx tsc --noEmit` — exits 0 (all tasks clean)
- `node scripts/smoke-phase07.mjs` — PASS 82/82 (unchanged from Plan 07-04 baseline)
- `node scripts/smoke-phase06.mjs` — PASS 82/82 (read-side untouched)
- `node scripts/migration-smoke-test.mjs` — PASS 106/106 (mappers untouched)

## Self-Check: PASSED

- FOUND: src/components/AddPlantModal.tsx — LightLevelPicker import + JSX ✓; WaterScheduleEditor import + JSX ✓; [waterEvery/sunHours] state removed ✓; lightLevel ≥4 occurrences ✓; waterMode ≥4 occurrences ✓; handleAdd writes lightLevel+waterSchedule+waterMode, no waterEvery/sunHours writes ✓
- FOUND: src/screens/OnboardingScreen.tsx — lightLevel ≥2 ✓; waterSchedule ≥2 ✓; waterMode ≥2 ✓; waterEvery: dbEntry.waterDays = 0 ✓; sunHours: dbEntry.sunHours = 0 ✓; all 3 Phase 4 mappers ≥3 occurrences ✓; renderStep1Location ≥2 ✓; totalSteps={4} ✓; plant-empty guard at step===2 ✓; currentStep < 3 ✓; ExpoLocation.requestForegroundPermissionsAsync ✓; geocoding-api.open-meteo.com ✓; all 3 i18n keys for location buttons ✓
- Commits: 41c3e65, 6685de8, e8f8c7e — all present
- tsc --noEmit: exits 0
- Smoke tests: 82/82 + 82/82 + 106/106 all PASS
