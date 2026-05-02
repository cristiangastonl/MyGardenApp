# Phase 7: UI Write-Side + Onboarding + Edge-Function Contract — Research

**Researched:** 2026-05-01
**Domain:** React Native form UI + AsyncStorage schema extension + Supabase/Deno edge functions
**Confidence:** HIGH (all findings verified against actual source files; no training-data-only claims)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **4-Card Light Picker:** 2×2 card grid, all 4 levels visible at once. Component `src/components/LightLevelPicker.tsx`. Reuses `OUTDOOR_TYPE_IDS` from `lightLabel.ts`. Default `bright_indirect`. Selected card = `colors.green` border + accent background, touch target ≥ 44pt.
- **Watering Mode + Schedule Editor:** `src/components/WaterScheduleEditor.tsx`. Inline segmented control "Calendario | Por chequeo". Fixed mode = two side-by-side numeric ±  inputs. Soil-check mode = hides both inputs. Defaults: `warm: 4, cold: 8` for new plants; catalog prefill uses catalog waterSchedule/waterMode. Soil-check default categories: suculentas, cactus, aloe-vera, echeveria, haworthia, sedum, jade.
- **Onboarding location step:** Position = after name step (step 0), before plant selection (step 1). New step is step 1; plants is step 2. Full-screen onboarding step pattern. 3 vertical-stack action buttons: GPS / city search / skip. GPS denied → show city search inline. Skip = `markLocationSkipped()` flag. Banner dismissible per session.
- **Banner copy:** "Agregá tu ubicación para horarios precisos" (ES) / "Add your location for precise schedules" (EN). Placement: TodayScreen above task list, below WeatherWidget. Appears when `location === null && climateOverride === 'auto' && !dismissed`.
- **Climate override:** `userSettings.climateOverride: 'auto' | 'northern' | 'southern' | 'tropical'`. 4-option segmented control in Settings under Location. Missing = treat as `'auto'`. `getEffectiveSeason(location, climateOverride, date)` is new public SSOT; `getWaterSeason` becomes private.
- **Edge function cut-over:** Server accepts both old and new payloads via `waterSchedule` presence discriminator. New payload replaces `waterEvery`/`sunHours` with `lightLevel`, `waterSchedule`, `waterMode`, `currentSeason`. Legacy fallback sunset in v1.2. Three functions touched: `diagnose-plant`, `chat-diagnosis`, `identify-plant`.
- **identify-plant:** Default `lightLevel: 'bright_indirect'`. May map PlantNet "sunlight" tag if present. User edits via picker before save.
- **Schema version stays at 1** — `climateOverride` is additive; treat missing as `'auto'`.
- **Two-AppContent paths:** Both MVP (`AppContentMVP`) and AUTH (`AppContentFullInner`) must destructure any new field added to AppData.

### Claude's Discretion
- AddPlantModal restructure: exact vertical spacing after replacing two numeric inputs with two new components.
- Onboarding flow state: step-index pattern (inline) vs config-driven flow. Keep existing step-index pattern unless call sites are very few.
- `expo-location` permission UX: use `requestForegroundPermissionsAsync()`.
- City search inline UI: extract to `CitySearchInline.tsx` or inline in OnboardingScreen. Extract if duplication is awkward.
- i18n key audit: ~30+ new keys across `lightLevel.{indoor,outdoor}.{level}.hint`, `waterSchedule.*`, `onboarding.location.*`, `settings.climateOverride.*`, `today.locationBanner.*`, identify result picker labels.

### Deferred Ideas (OUT OF SCOPE)
- Catalog data field rebalance (CAT-01..08) — Phase 8.
- Diagnosis continuity / paywall (DIAG-01..07, PAY-01..03) — Phase 9.
- Backward-compat legacy key removal — v1.2.
- Auto-detect light from room photo via Vision API — v2.0.
- PPFD/DLI numeric readouts — v2.0.
- Per-month watering schedule — v2.0.
- Multi-pot tracking — out of scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIGHT-01 | 4-card picker: icon + level name + placement description in user locale | LightLevelPicker.tsx new component; reuses OUTDOOR_TYPE_IDS; new i18n keys `lightLevel.{indoor,outdoor}.{level}.hint` |
| LIGHT-02 | Light levels `direct/bright_indirect/medium_indirect/low` translated EN+ES voseo | New hint keys added to both locale files; existing base keys already present in es/common.json |
| LIGHT-05 | identify-plant flow returns `lightLevel`; default `bright_indirect`; user adjusts before save | Edge function response shape extended; IdentificationResults renders picker; IdentifiedPlant type gains optional `lightLevel` |
| WATER-01 | `waterSchedule: { warm, cold }` replaces `waterEvery` on write side | WaterScheduleEditor emits { warm, cold }; AddPlantModal.onAdd payload uses new shape; `handleAdd` no longer writes `waterEvery` |
| WATER-02 | `waterMode: 'fixed' \| 'soil_check'`; default soil_check categories listed | WaterScheduleEditor emits mode; soil-check defaults driven by SOIL_CHECK_DB_IDS (Phase 4 canon) |
| WATER-03 | User can edit warm/cold separately; soil_check plants show no interval inputs but can toggle | WaterScheduleEditor: segmented control toggles input visibility immediately |
| LOC-01 | Non-blocking onboarding location step with clear skip option | New step 1 in OnboardingScreen between name (0) and plants (2); skip button calls markLocationSkipped() |
| LOC-02 | "Hoy" shows soft dismissible banner when location missing | LocationBanner component in TodayScreen; dismissible per session via local state |
| LOC-03 | Warm schedule fallback when location missing | getEffectiveSeason returns 'warm' when location===null && climateOverride==='auto'; already encoded in getWaterSeason |
| LOC-04 | Location fallback chain: GPS → city → locale-based default | Onboarding step covers GPS and city; locale-based default (es-AR → 'southern', en → 'northern') in getEffectiveSeason when neither location nor override set |
| LOC-05 | Settings: manual climate-zone override wins over derived hemisphere | climateOverride field + 4-option picker in SettingsPanel; getEffectiveSeason checks override first |
| LOC-06 | Onboarding copy: "Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima" | Literal string in onboarding.location.body i18n key (both locales) |
</phase_requirements>

---

## Summary

Phase 7 is a pure write-side and integration update built on a well-understood codebase. All key source files have been verified directly. The phase introduces two new reusable components (LightLevelPicker, WaterScheduleEditor), one new utility function (getEffectiveSeason), one new banner component (LocationBanner), one new storage field (climateOverride), and updates three edge functions and one screen (OnboardingScreen) with a new step.

The most critical coordination points are: (1) the AddPlantModal replacement of two numeric inputs with the two new components while preserving the `prefilledPlant` round-trip for edit mode; (2) the global search-and-replace of `getWaterSeason` call sites to `getEffectiveSeason`; (3) the edge-function backward-compat discriminator where server reads `waterSchedule` presence to select legacy vs new prompt path; and (4) the Two-AppContent-paths discipline in App.tsx (MVP path at line 116, AUTH path at line 270) — both must destructure `climateOverride` once it is added to AppData.

**Primary recommendation:** Break Phase 7 into waves: (Wave 0) types + storage extension + getEffectiveSeason; (Wave 1) LightLevelPicker + WaterScheduleEditor components; (Wave 2) AddPlantModal swap + IdentificationResults picker; (Wave 3) OnboardingScreen new step + LocationBanner; (Wave 4) SettingsPanel climate override; (Wave 5) edge function updates + i18n completion. Each wave leaves the project at a type-check green state.

---

## Standard Stack

### Core (already installed — no new dependencies)
| Library | Purpose | Phase 7 Use |
|---------|---------|-------------|
| `expo-location` | GPS permission + geocode | Already used in SettingsScreen.tsx:84 — identical pattern for onboarding GPS button |
| `react-i18next` | i18n | All new UI copy goes through `t()` |
| `@react-native-async-storage/async-storage` | Persistence | Banner dismiss-per-session key; climateOverride via AppData envelope |
| `react-native` (View, TouchableOpacity, etc.) | UI primitives | LightLevelPicker cards, WaterScheduleEditor segmented control |
| `src/theme.ts` | Design tokens | colors.green (selected card), colors.bgSecondary (unselected card), spacing.*, borderRadius.* |

No new packages required. Phase 7 uses only what is already in package.json.

### Key Existing Utilities Phase 7 Consumes
| Utility | Location | Phase 7 Role |
|---------|----------|-------------|
| `OUTDOOR_TYPE_IDS` | `src/utils/lightLabel.ts:24` | Picker imports to select indoor/outdoor label set |
| `getLightLabel` | `src/utils/lightLabel.ts:44` | Read-side; picker uses same set for label copy in cards |
| `getSeasonalInterval` | `src/utils/plantLogic.ts:16` | WaterScheduleEditor preview ("current season = every N days") |
| `getWaterSeason` | `src/utils/seasonality.ts:25` | Becomes private helper inside `getEffectiveSeason` |
| `sunHoursToLightLevel` | `src/utils/migration.ts` | Used in lightLabel fallback ladder — no new import needed |
| `MigrationBanner` | `src/components/MigrationBanner.tsx` | Reference pattern for LocationBanner layout |
| `MigrationTooltip` | `src/components/MigrationTooltip.tsx` | Reference for per-session dismiss via AsyncStorage key |

---

## Architecture Patterns

### Recommended New File Locations
```
src/
├── components/
│   ├── LightLevelPicker.tsx        # new: 2×2 card grid, typeId prop, value/onChange
│   ├── WaterScheduleEditor.tsx     # new: segmented control + optional warm/cold inputs
│   ├── LocationBanner.tsx          # new: dismissible soft banner for TodayScreen
│   └── CitySearchInline.tsx        # new (if extracted): geocoding text input + result list
├── utils/
│   └── seasonality.ts              # extend: add getEffectiveSeason(); keep getWaterSeason private
└── i18n/locales/{en,es}/common.json   # extend: ~30 new keys
```
`AppData` (in `src/types/index.ts`) gains `climateOverride?: 'auto' | 'northern' | 'southern' | 'tropical'`.
`useStorage.tsx` gains `climateOverride` state, `snapshotFromRef` include, and `setClimateOverride()` action.

### Pattern 1: AddPlantModal State Replacement
**Current state (verified, lines 34-35):**
```typescript
const [waterEvery, setWaterEvery] = useState("4");
const [sunHours, setSunHours] = useState("3");
```
**Phase 7 replacement:**
```typescript
const [lightLevel, setLightLevel] = useState<LightLevel>('bright_indirect');
const [waterSchedule, setWaterSchedule] = useState<WaterSchedule>({ warm: 4, cold: 8 });
const [waterMode, setWaterMode] = useState<WaterMode>('fixed');
```

The prefill `useEffect` (line 38-55) currently calls:
```typescript
setWaterEvery(String(prefilledPlant.waterDays));
setSunHours(String(prefilledPlant.sunHours));
```
Phase 7 replaces with:
```typescript
setLightLevel(prefilledPlant.lightLevel ?? 'bright_indirect');
setWaterSchedule(prefilledPlant.waterSchedule ?? { warm: prefilledPlant.waterDays ?? 4, cold: (prefilledPlant.waterDays ?? 4) * 2 });
setWaterMode(prefilledPlant.waterMode ?? 'fixed');
```
The `handleTypeSelect` (line 64-71) currently sets `waterEvery`/`sunHours` from type defaults. Phase 7 sets `waterSchedule` from type's waterSchedule if present, else constructs from waterDays. `waterMode` derives from whether the selected typeId is in SOIL_CHECK categories.

The `handleAdd` payload (line 78-93) currently writes `waterEvery: parseInt(waterEvery)` and `sunHours: parseInt(sunHours)`. Phase 7 writes `waterSchedule`, `waterMode`, `lightLevel` — drops the `waterEvery`/`sunHours` writes entirely (they are deprecated).

**Onboarding `plantDBToPlant` (lines 98-117):** This helper function at lines 98-117 also currently writes `waterEvery: dbEntry.waterDays` and `sunHours: dbEntry.sunHours`. Phase 7 must update this helper to emit `waterSchedule`, `waterMode`, `lightLevel` from the catalog entry's new fields (already present via Phase 4 catalog codemod).

### Pattern 2: OnboardingScreen Step Insertion
**Current step machine (verified):**
- Step 0: name + language picker (`renderStep0`, line 327)
- Step 1: plant selection (`renderStep1`, implied)
- Step 2: done/summary (`renderStep2`, implied)
- `currentStep` is a plain integer via `useState(0)` (line 185)
- `handleNext` checks `currentStep === 0` (name required) and `currentStep === 1` (plants optional) (lines 286-296)
- `handleBack` uses `currentStep > 0` (line 300)
- Total steps = 3 in StepIndicator

**Phase 7 insertion:**
- Step 0: name (unchanged)
- Step 1: location (NEW)
- Step 2: plant selection (was step 1)
- Step 3: done (was step 2)

Changes required:
1. Update `handleNext` step-boundary checks: `currentStep === 0` (name guard), `currentStep === 2` (plant empty warning), `currentStep < 3` (was `< 2`).
2. Add `renderStep1Location()` render function.
3. `StepIndicator` `totalSteps` changes from 3 to 4.
4. `handleBack` reset of `identifiedPlants` moves from `currentStep === 1` to `currentStep === 2`.
5. Add `isLocationLoading` state for GPS button spinner.
6. The location step does NOT call `animateTransition('next')` on skip — it calls it directly like the other steps do (the skip action just advances step).

**Location step action pattern** (reuse from SettingsScreen.tsx:84-101):
```typescript
// GPS button
const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
if (status !== 'granted') { /* show city search inline */ return; }
const { coords } = await ExpoLocation.getCurrentPositionAsync({});
const geo = await ExpoLocation.reverseGeocodeAsync(coords);
updateLocation({ lat: coords.latitude, lon: coords.longitude, name: geo[0]?.city || 'Tu ubicación', country: geo[0]?.country || '', admin1: geo[0]?.region });
animateTransition('next'); // auto-advance after GPS success
```
**City search** (reuse from SettingsScreen.tsx:103-118):
```typescript
const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${i18n.language}`);
const data = await response.json();
// setSearchResults(data.results || [])
// tap → updateLocation({...}) → animateTransition('next')
```

### Pattern 3: getEffectiveSeason Wrapper
```typescript
// src/utils/seasonality.ts (addition to existing file)
export type ClimateOverride = 'auto' | 'northern' | 'southern' | 'tropical';

export function getEffectiveSeason(
  location: Location | null,
  climateOverride: ClimateOverride | undefined,
  date: Date
): WaterSeason {
  const override = climateOverride ?? 'auto';
  if (override === 'tropical') return 'warm';     // tropical always warm (SEASON-02)
  if (override === 'northern') {
    const month = date.getMonth();
    return (month >= 3 && month <= 8) ? 'warm' : 'cold';
  }
  if (override === 'southern') {
    const month = date.getMonth();
    return (month >= 3 && month <= 8) ? 'cold' : 'warm';
  }
  // override === 'auto'
  return getWaterSeason(location?.lat ?? null, date);
}
```
`getWaterSeason` loses its `export` keyword (becomes module-private). Every existing call site migrates.

### Pattern 4: LocationBanner Component
```typescript
// src/components/LocationBanner.tsx — mirrors MigrationBanner layout
// Light-blue accent (colors.infoBg / colors.infoText — same as prefilledBanner in AddPlantModal)
// Props: onDismiss, onSettingsPress
// Placement: rendered as sibling above NavigationContainer in AppContentMVP
// OR directly inside TodayScreen above task list — see Pitfall 4 below for ruling
```

### Pattern 5: Edge Function Discriminator (server-side Deno/TypeScript)
```typescript
// diagnose-plant/index.ts — new PlantContext shape
interface PlantContextV1 {
  species: string;
  waterEvery: number;      // legacy
  sunHours: number;        // legacy
  lastWatered: string | null;
  outdoorDays: number[];
}
interface PlantContextV2 extends PlantContextV1 {
  lightLevel?: string;
  waterSchedule?: { warm: number; cold: number };
  waterMode?: 'fixed' | 'soil_check';
  currentSeason?: 'warm' | 'cold' | 'tropical';
}

// In the prompt builder:
const isNewPayload = !!ctx.waterSchedule; // discriminator
const waterInfo = isNewPayload
  ? buildNewPromptLines(ctx)    // waterSchedule + lightLevel + currentSeason
  : buildLegacyPromptLines(ctx); // waterEvery + sunHours (existing code)
```
Deno supports optional chaining `?.` fully — HIGH confidence from official Deno docs.

### Pattern 6: IdentifiedPlant + IdentificationResults LightLevel Round-Trip
Current `IdentifiedPlant` type (types/index.ts:249-262) has `waterDays: number` and `sunHours: number` but no `lightLevel`. Phase 7 adds:
```typescript
export interface IdentifiedPlant {
  // ... existing fields
  lightLevel?: LightLevel;  // NEW: populated by edge function; undefined = use bright_indirect default
}
```
`IdentificationResults.tsx` gains `selectedLightLevel` local state pre-initialized from `selectedPlant?.lightLevel ?? 'bright_indirect'`. The picker renders between the PlantResultCard and the "Add to Garden" button.

The `onAddPlant` callback path must pass `lightLevel` through. Current flow: `IdentificationResults` → `onAddPlant()` → `usePlantIdentification` hook → `onPlantIdentified(plantData)` → `handleIdentifiedPlant` in OnboardingScreen/TodayScreen. The `plantData` is currently `Omit<Plant, 'id'>` — `lightLevel` is already in the `Plant` type (optional), so no prop-type change needed, only value wiring.

### Anti-Patterns to Avoid
- **Hardcoding string "northern"/"southern"/"tropical" in multiple places** — define `ClimateOverride` type once in `types/index.ts`, import everywhere.
- **Calling `getWaterSeason` directly in new code** — all new code must call `getEffectiveSeason`. The planner must add a grep guard check to the smoke runner.
- **Adding `climateOverride` to only one AppContent path** — the two-AppContent discipline. Search for "loading: storageLoading" in App.tsx to find both destructures.
- **Putting `LocationBanner` inside NavigationContainer** — MigrationBanner is sibling-to-NavigationContainer (App.tsx:213-216). LocationBanner in TodayScreen is different: it lives inside the screen's ScrollView above tasks — NOT at App level. This is correct because the banner is tab-specific.
- **Two separate geocoding implementations** — extract to `CitySearchInline.tsx` component once OnboardingScreen and SettingsPanel would both contain the same 20-line pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GPS location request | Custom permission dialog | `expo-location` `requestForegroundPermissionsAsync()` | Already in SettingsScreen:84 — exact same API, same permission rationale strings |
| City geocoding | Custom geocoding client | Open-Meteo Geocoding API (already used in SettingsScreen:107) | Free, no key, already wired; same endpoint, same response shape |
| Banner dismiss per session | Complex state machine | Local `useState(false)` + AsyncStorage key (see MigrationTooltip pattern) | Session = app lifetime = React state is sufficient; AsyncStorage key for "skip forever" only |
| Segmented control | Custom tab bar component | Plain `View` + `TouchableOpacity` row with `selected` styling | App already has 3 examples of this pattern (language pill in onboarding, type chips in AddPlantModal) |
| 4-card grid | `FlatList` numColumns=2 | `View` with `flexDirection: 'row' + flexWrap: 'wrap'` | Only 4 fixed cards; FlatList is overkill and adds scroll behavior complexity |

---

## Common Pitfalls

### Pitfall 1: plantDBToPlant Still Writes Legacy Fields
**What goes wrong:** `OnboardingScreen.tsx:109-110` — the `plantDBToPlant` helper function sets `waterEvery: dbEntry.waterDays` and `sunHours: dbEntry.sunHours`. Plants added during onboarding via catalog selection arrive without `waterSchedule`/`lightLevel`, breaking the new schema invariant.
**Root cause:** `plantDBToPlant` was not part of the Phase 4 / Phase 5 / Phase 6 migrations which focused on `useStorage` hooks and `AddPlantModal`. Onboarding catalog path was not touched.
**How to avoid:** Update `plantDBToPlant` in OnboardingScreen as part of the same plan that updates AddPlantModal. Both write plants; both must emit the new schema. Use catalog entry's `lightLevel`, `waterSchedule`, `waterMode` (populated by Phase 4 catalog codemod).
**Warning signs:** `npx tsc --noEmit` will not catch this — all fields are optional on `Plant`. Smoke test must verify that a plant created via catalog prefill has `waterSchedule` set.

### Pitfall 2: Two-AppContent-Paths Not Kept in Sync
**What goes wrong:** `climateOverride` is destructured from `useStorage()` in `AppContentMVP` (line 116 block) but not in `AppContentFullInner` (line 270 block). Result: AUTH path silently uses `undefined` for `climateOverride` everywhere it needs it.
**Root cause:** Phase 5 Plan 05 already found this — `location` was added to MVP path but not AUTH path. STATE.md documents this as a known trap.
**How to avoid:** When adding `climateOverride` to `AppData` and the `StorageState` interface, immediately add it to BOTH destructure blocks in App.tsx. Verify with grep: `grep -c "climateOverride" App.tsx` should return ≥ 2.
**Warning signs:** tsc passes but runtime uses undefined climateOverride in AUTH mode.

### Pitfall 3: prefilledPlant Round-Trip Missing New Fields (Edit Mode)
**What goes wrong:** A user edits an existing plant (pre-Phase-4 migrated). The `prefilledPlant` useEffect sets state from the plant's new fields — but the `useEffect` currently reads `prefilledPlant.waterDays` and `prefilledPlant.sunHours` (the deprecated catalog fields). For `Plant` objects (not `PlantDBEntry`) passed as prefill, those fields are undefined post-migration.
**Root cause:** `AddPlantModal` receives `prefilledPlant?: PlantDBEntry` (line 23). The "edit" path passes a `Plant` (not a `PlantDBEntry`) cast as `PlantDBEntry` — or the `onSave` prop shape changes. Verify the exact call site in TodayScreen/PlantsScreen to confirm what object type is passed.
**How to avoid:** Extend `AddPlantModal` to accept `prefilledPlant?: PlantDBEntry | Plant`. In the prefill useEffect, read v1.1 fields first: `lightLevel`, `waterSchedule`, `waterMode`. The defensive fallback ladder (v1.1 → legacy → default) applies here too.
**Warning signs:** Edit form shows `bright_indirect` and `warm: 4, cold: 8` for every plant regardless of actual saved values.

### Pitfall 4: LocationBanner Placement — TodayScreen vs App Level
**What goes wrong:** Placing LocationBanner at App level (like MigrationBanner) means it appears on ALL tabs, including Plantas and Ajustes, where it is irrelevant. The CONTEXT.md spec says "Hoy tab" explicitly.
**Root cause:** MigrationBanner is at App level because migration failures can block any tab. LocationBanner is Hoy-tab-specific informational nudge.
**How to avoid:** Place LocationBanner inside `TodayScreen.tsx`, above the ScrollView content, below WeatherWidget. Use local `useState(false)` for dismiss state (session lifetime). The banner hide condition `location !== null || climateOverride !== 'auto' || dismissed` reads from `useStorage()` directly inside TodayScreen — no prop threading required.
**Warning signs:** Banner visible on Plantas screen or Ajustes screen.

### Pitfall 5: old `getWaterSeason` Call Sites Not Migrated
**What goes wrong:** After `getWaterSeason` becomes private to `seasonality.ts`, TypeScript will error at every remaining import. But if the planner misses call sites, tsc errors surface at the end of the wave rather than incrementally.
**Root cause:** Multiple files import `getWaterSeason` directly: `plantLogic.ts` (via `getNextWaterDate`), `MyPlantDetailModal.tsx` (direct import, line 26). `plantHealth.ts` and `notificationScheduler.ts` use it via call chain (not direct import — verified via grep).
**Verified call sites (from source grep):**
- `src/components/MyPlantDetailModal.tsx:26` — direct import, direct call at line 83
- `src/utils/plantLogic.ts` — imports and calls inside `getNextWaterDate`; `getEffectiveSeason` needs `location + climateOverride`, so `getNextWaterDate` signature changes: adds `climateOverride` parameter
- No direct imports in `plantHealth.ts` or `notificationScheduler.ts` (they go via `getTasksForDay` → `getNextWaterDate`)
**How to avoid:** Remove `export` from `getWaterSeason` in seasonality.ts as the FIRST task of the wave. tsc will immediately surface all importers that must be updated. Fix each one before proceeding.

### Pitfall 6: PlantDiagnosisContext Shape Still Uses Legacy Fields
**What goes wrong:** Phase 4 Plan 04 deliberately preserved `PlantDiagnosisContext` with `waterEvery`/`sunHours` so diagnosis edge functions remain stable until Phase 7. Phase 7 changes the edge function prompts. But `PlantDiagnosisModal.tsx` (lines 73-80) currently derives `waterEveryForContext` and `sunHoursForContext` from v1.1 fields to bridge the old context shape. Phase 7 must update BOTH the client context builder AND the edge function prompt reader simultaneously.
**Root cause:** The bridge is a two-sided contract (client sends v2 shape → server reads v2 shape). They must ship together.
**How to avoid:** Update `PlantDiagnosisContext` type in `types/index.ts` to the v2 shape (add new fields, mark old as optional). Update `PlantDiagnosisModal` to build v2 context. Update edge functions to read new fields via discriminator. Same atomic wave.
**Warning signs:** Diagnosis prompts say "Frecuencia de riego: undefined días" (old server code reading new payload with no `waterEvery`).

### Pitfall 7: identify-plant Edge Function Response Shape Mismatch
**What goes wrong:** The edge function currently returns raw PlantNet data. `plantIdentification.ts` processes it client-side via `convertPlantNetResult()`. Phase 7 adds `lightLevel` to the response — but the edge function currently passes through the PlantNet response without transformation. The `lightLevel` must be added server-side (in the edge function response), not just client-side.
**Root cause:** `identify-plant/index.ts` is a pure proxy — it returns `JSON.stringify(data)` where `data` is the raw PlantNet JSON (line 128-135). The lightLevel mapping and default must happen in the edge function BEFORE returning, because the client parses the PlantNet response format, not a custom format.
**How to avoid:** Phase 7 has two options: (A) Edge function post-processes results and adds `lightLevel` to each result before returning (preferred — consistent, single transformation point); (B) Client maps PlantNet "sunlight" tag in `convertPlantNetResult()`. CONTEXT.md says "Edge function may map PlantNet sunlight tag" — choose option A. The edge function adds a `lightLevel` field to each result item. `convertPlantNetResult` reads `result.lightLevel ?? 'bright_indirect'`.
**Warning signs:** `selectedPlant.lightLevel` is `undefined` in `IdentificationResults`, picker defaults to `bright_indirect` for every plant.

### Pitfall 8: Banner Dismiss Key Pattern — Session vs Forever
**What goes wrong:** LocationBanner dismiss is per-session. The CONTEXT.md spec says "dismissible per session." Using AsyncStorage for the dismiss key (like MigrationTooltip) would make it persist across app restarts (forever-dismiss, not per-session).
**Root cause:** Confusion between MigrationTooltip (forever dismiss, uses AsyncStorage) vs LocationBanner (session dismiss only).
**How to avoid:** Use `useState(false)` local state in the component that renders the banner (TodayScreen). When user sets location or climateOverride later, the banner's visibility condition becomes false automatically via the `location !== null || climateOverride !== 'auto'` check — no need for the dismiss flag to persist. The dismiss flag is only for "I know, leave me alone today."
**Warning signs:** User dismisses banner, installs location next day, banner never shows again even on new devices or re-installs.

### Pitfall 9: i18n Parity — ES Voseo on New Keys
**What goes wrong:** New ES keys use tuteo verb forms (regá → riega, omitir vs omití, buscar → buscá). This violates the project-wide voseo contract.
**Root cause:** Copy written in standard Spanish and not reviewed for Argentine voseo.
**How to avoid:** For every ES key with a verb: use voseo. Check against: "Usá mi ubicación" (NOT "Usa"), "Buscar ciudad" (infinitive — acceptable in button labels), "Omitir" (infinitive — acceptable). Action verbs in body copy must be voseo. The LOC-06 copy ("Lo usamos para ajustar..." — no direct-address verb) is safe as-is.

---

## Code Examples

### LightLevelPicker Structure
```typescript
// src/components/LightLevelPicker.tsx
import { OUTDOOR_TYPE_IDS } from '../utils/lightLabel';
import { LightLevel } from '../types';

interface LightLevelPickerProps {
  typeId: string;        // for indoor/outdoor branch
  value: LightLevel;
  onChange: (level: LightLevel) => void;
}

const LEVELS: LightLevel[] = ['direct', 'bright_indirect', 'medium_indirect', 'low'];

// Card: 2×2 grid via flexWrap
// Each card: icon + t(`lightLevel.${ns}.${level}`) + t(`lightLevel.${ns}.${level}.hint`)
// Selected border: colors.green, borderWidth: 2
// Touch target: minHeight: 44, minWidth: 44 (entire card is touchable)
// ns derived: OUTDOOR_TYPE_IDS.has(typeId) ? 'outdoor' : 'indoor'
```

### WaterScheduleEditor Structure
```typescript
// src/components/WaterScheduleEditor.tsx
interface WaterScheduleEditorProps {
  mode: WaterMode;
  schedule: WaterSchedule;
  onModeChange: (mode: WaterMode) => void;
  onScheduleChange: (schedule: WaterSchedule) => void;
}
// Segmented control: two TouchableOpacity pills
// Fixed mode: two side-by-side +/- number inputs (same style as existing numberInputRow in AddPlantModal)
// Soil-check mode: hides both inputs, shows explanatory text
```

### getEffectiveSeason Signature
```typescript
// src/utils/seasonality.ts
export type ClimateOverride = 'auto' | 'northern' | 'southern' | 'tropical';

export function getEffectiveSeason(
  location: Location | null,
  climateOverride: ClimateOverride | undefined,
  date: Date
): WaterSeason { ... }

// getWaterSeason stays in file but removes 'export' keyword
```

### AppData Extension Pattern
```typescript
// src/types/index.ts — AppData interface
export interface AppData {
  // ... existing fields
  climateOverride?: ClimateOverride; // v1.1 — missing treated as 'auto'
}

// src/hooks/useStorage.tsx — StorageState
interface StorageState {
  // ... existing
  climateOverride: ClimateOverride; // never undefined at runtime; defaults to 'auto'
}

// In loadData / snapshotFromRef:
climateOverride: parsed?.climateOverride ?? 'auto',
```

### Edge Function Discriminator (diagnose-plant)
```typescript
// supabase/functions/diagnose-plant/index.ts — updated PlantContext
interface PlantContext {
  species: string;
  // Legacy fields (v1.0 clients) — optional
  waterEvery?: number;
  sunHours?: number;
  // v1.1 fields (Phase 7+ clients)
  lightLevel?: string;
  waterSchedule?: { warm: number; cold: number };
  waterMode?: 'fixed' | 'soil_check';
  currentSeason?: 'warm' | 'cold' | 'tropical';
  // Unchanged
  lastWatered: string | null;
  outdoorDays: number[];
}

// Prompt builder:
const isV2 = !!ctx.waterSchedule; // discriminator
const waterLine = isV2
  ? `Modo de riego: ${ctx.waterMode === 'soil_check' ? 'por chequeo' : 'calendario'}`
  : `Frecuencia de riego: cada ${ctx.waterEvery} días`;
```

### OnboardingScreen Step Count Change
```typescript
// handleNext updated guard:
if (currentStep < 3) {   // was: < 2
  setShowEmptyWarning(false);
  animateTransition('next');
}
// Empty warning guard moves from currentStep === 1 to currentStep === 2
if (currentStep === 2 && selectedPlants.size + identifiedPlants.length === 0) { ... }
// identifiedPlants reset on back moves from currentStep === 1 to currentStep === 2
if (currentStep === 2) setIdentifiedPlants([]);
// StepIndicator totalSteps: 4 (was: 3)
```

---

## State of the Art

| Old Pattern | Phase 7 Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| `sunHours` numeric input in AddPlantModal | `LightLevelPicker` 4-card grid | Phase 7 | Write side emits `lightLevel` |
| `waterEvery` numeric input in AddPlantModal | `WaterScheduleEditor` with mode toggle | Phase 7 | Write side emits `waterSchedule + waterMode` |
| `getWaterSeason` as public SSOT | `getEffectiveSeason` wrapping `getWaterSeason` | Phase 7 | User override + tropical zone routing |
| `PlantDiagnosisContext` has `waterEvery`/`sunHours` only | `PlantDiagnosisContext` v2 adds new fields, old become optional | Phase 7 | AI prompt receives richer care context |
| `identify-plant` returns raw PlantNet passthrough | `identify-plant` annotates `lightLevel` per result | Phase 7 | IdentificationResults can pre-select picker |
| OnboardingScreen: name → plants → done (3 steps) | name → **location** → plants → done (4 steps) | Phase 7 | LOC-01 satisfied |

**Deprecated (to be removed in v1.2):**
- `PlantDiagnosisContext.waterEvery` and `.sunHours` fields (replaced by new v2 shape)
- Edge function legacy prompt branches (sunset once ≥99% new-payload traffic)

---

## Open Questions

1. **AddPlantModal prop type: `prefilledPlant?: PlantDBEntry`**
   - What we know: The prop type is `PlantDBEntry` (line 23). But the edit flow in TodayScreen passes a `Plant` object. The Plant type differs from PlantDBEntry (different field names: `Plant.waterSchedule` vs `PlantDBEntry.waterSchedule`, both optional).
   - What's unclear: Does the caller cast `Plant as PlantDBEntry`, or is there a conversion? Need to verify the exact call site in TodayScreen that triggers edit mode.
   - Recommendation: Read the TodayScreen / PlantsScreen section where `AddPlantModal` is opened with `prefilledPlant`. If it passes a `Plant`, extend the prop type to `prefilledPlant?: PlantDBEntry | Plant` with a runtime discriminator. If only `PlantDBEntry` is ever passed, the current type is fine.

2. **`markLocationSkipped()` — new storage action or AsyncStorage key?**
   - What we know: CONTEXT.md says "Triggers `markLocationSkipped()` flag in storage". The flag is cleared when user sets location later.
   - What's unclear: Should this be in `AppData` (persisted, survives restart — banner reappears next launch too) or AsyncStorage-only (session)?
   - Recommendation: Per-session dismiss = `useState` in TodayScreen. The "skipped onboarding" flag just means onboarding advances without location — no separate flag needed. The banner reappears on every launch until location is set. The current `location === null` check is sufficient; `markLocationSkipped()` may be unnecessary.

3. **`getNextWaterDate` signature change ripple effect**
   - What we know: `getNextWaterDate(plant, today, latitude)` currently takes `latitude: number | null`. Phase 7 needs `getEffectiveSeason` which needs `location + climateOverride`, not just latitude. Options: (A) add `climateOverride` param to `getNextWaterDate`; (B) `getNextWaterDate` takes `season: WaterSeason` pre-computed; (C) pass `location: Location | null` + `climateOverride` all the way down.
   - What's unclear: Which option causes least cascading change to `getTasksForDay` → `notificationScheduler` → `plantHealth` call chains.
   - Recommendation: Option B — change `getNextWaterDate` to accept `latitude: number | null` → `season: WaterSeason`. Callers pre-compute season once via `getEffectiveSeason`, then pass it. This avoids threading `climateOverride` deep into pure utils. `getTasksForDay` becomes `getTasksForDay(plants, day, season)` (drops `latitude`). Callers derive season before calling.

---

## Validation Architecture

No test framework is configured in this project (CLAUDE.md: "No test framework is set up"). The existing smoke runner pattern (Phase 4/5) via `scripts/smoke-test.mjs` using `typescript.transpileModule` covers pure utility functions. Phase 7 introduces no new pure utility that doesn't already exist (getEffectiveSeason is a wrapper around getWaterSeason which is already tested).

### Smoke Runner Extensions (Phase 4/5 pattern)
| New Utility | Test Behavior | Command |
|-------------|--------------|---------|
| `getEffectiveSeason` | 'tropical' override → always 'warm'; 'northern' override → Apr cold=false; 'auto' + lat null → 'warm' | Extend existing seasonality section in smoke runner |

### Manual Smoke Checks (after each plan)
| Surface | Check | How |
|---------|-------|-----|
| AddPlantModal | New plant has `lightLevel`, `waterSchedule`, `waterMode` set | Add plant, inspect via console.log in handleAdd |
| Onboarding catalog path | plantDBToPlant output has v1.1 fields | Console.log in handleComplete |
| TodayScreen banner | Banner appears when location null, disappears after setting location | Test in dev |
| Edge function | Gemini receives new prompt format with waterSchedule | Check Supabase function logs |

### tsc Gate
Run `npx tsc --noEmit` at end of each plan. Phase 7 should maintain green tsc throughout.

---

## Sources

### Primary (HIGH confidence — verified against actual source files)
- `src/components/AddPlantModal.tsx` — verified state declarations (lines 34-35), useEffect prefill (38-55), handleAdd payload (78-93)
- `src/screens/OnboardingScreen.tsx` — verified step machine (currentStep useState:185, handleNext:285-297, handleBack:299-307, renderStep0:327), plantDBToPlant helper (98-117)
- `src/utils/seasonality.ts` — verified getWaterSeason signature and export
- `src/utils/plantLogic.ts` — verified getSeasonalInterval and getNextWaterDate signatures
- `src/utils/lightLabel.ts` — verified OUTDOOR_TYPE_IDS set definition
- `src/hooks/useStorage.tsx` — verified StorageState interface, AppData snapshot, action list
- `src/types/index.ts` — verified Plant, PlantDBEntry, AppData, PlantDiagnosisContext, IdentifiedPlant shapes
- `src/screens/SettingsScreen.tsx` — verified GPS pattern (84-101), Open-Meteo geocoding pattern (107-118)
- `src/components/MigrationBanner.tsx` — verified sibling-to-navigator layout pattern
- `src/components/MigrationTooltip.tsx` — verified per-item AsyncStorage dismiss pattern (TOOLTIP_SEEN_KEY)
- `supabase/functions/diagnose-plant/index.ts` — verified PlantContext interface (lines 11-17), prompt lines (94-106)
- `supabase/functions/chat-diagnosis/index.ts` — verified PlantContext interface (26-32), prompt lines (90-98 ES, 123-130 EN)
- `supabase/functions/identify-plant/index.ts` — verified passthrough response (line 128-135)
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — verified legacy bridge (lines 73-80)
- `src/components/MyPlantDetailModal.tsx` — verified direct getWaterSeason import (line 26), call site (line 83)
- `App.tsx` — verified AppContentMVP destructure (line 116 block), AppContentFullInner destructure (line 270 block)
- `src/i18n/locales/es/common.json` — verified existing lightLevel block, onboarding block, settings block

### Secondary (MEDIUM confidence)
- STATE.md accumulated decisions — Two-AppContent-paths trap documented from Phase 5 Plan 05 execution
- 04-CONTEXT.md, 05-CONTEXT.md, 06-CONTEXT.md — prior phase decision locks carried forward

### Tertiary (LOW confidence)
- PlantNet "sunlight" tag presence: not verified against live PlantNet API spec. The CONTEXT.md says "if present in API response." Treat as optional — always fall back to `bright_indirect`.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new dependencies
- Architecture: HIGH — verified against actual source files
- Pitfalls: HIGH — most discovered by direct code inspection, not inference
- Edge function Deno optional-chain support: HIGH — standard Deno TypeScript

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable codebase — no fast-moving external APIs in scope)
