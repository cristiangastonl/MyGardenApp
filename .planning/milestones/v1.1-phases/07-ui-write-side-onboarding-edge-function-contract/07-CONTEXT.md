# Phase 7: UI Write-Side + Onboarding + Edge-Function Contract - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Every plant-creating and plant-editing surface emits the new precision-care schema. A reusable 4-card light picker replaces the legacy `sunHours` numeric input in `AddPlantModal`, the (yet-to-be-built) plant edit form, and the plant identification result modal. A reusable seasonal-water schedule editor replaces the legacy `waterEvery` input with `waterMode` toggle + warm/cold dual inputs. Onboarding gains a new location-prompt step (after name, before plant selection) with GPS / city-search / skip actions. Settings gains a manual climate-zone override under the existing Location section. Edge functions (`diagnose-plant`, `chat-diagnosis`) accept both old and new payloads via `waterSchedule` discriminator with prompts adapted accordingly; `identify-plant` defaults `lightLevel: 'bright_indirect'` with optional PlantNet "sunlight" tag mapping.

**No catalog data changes** — that's Phase 8 (CAT-01..08). Phase 7 only emits the new shape from write surfaces and consumes catalog values when prefilling.

**No diagnosis-continuity / paywall work** — that's Phase 9 (DIAG-01..07, PAY-01..03). Phase 7 only updates the diagnosis context payload shape; conversation continuity is a separate concern.

Locked from REQUIREMENTS.md: LIGHT-01, LIGHT-02, LIGHT-05, WATER-01, WATER-02, WATER-03, LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06.

</domain>

<decisions>
## Implementation Decisions

### 4-Card Light Picker (LIGHT-01, LIGHT-02)
- **Layout:** 2×2 card grid. All 4 levels (`direct`, `bright_indirect`, `medium_indirect`, `low`) visible at once, scannable on mobile width.
- **Card content:** Icon + level name + 1-line placement hint in user locale. New i18n keys `lightLevel.{indoor,outdoor}.{level}.hint` (e.g., ES `Junto a ventana sur` / `A 2m de ventana clara` / `Pasillo sin sol directo` for indoor; `Sin sombra todo el día` / `Sombra de árbol vecino` for outdoor).
- **Reusable component:** `src/components/LightLevelPicker.tsx` — single source consumed by AddPlantModal, edit form, and PlantIdentification result. Indoor/outdoor branch driven by the same `OUTDOOR_TYPE_IDS` set Phase 6 locked in `lightLabel.ts` (single SSOT). Picker accepts `typeId` prop to choose label set.
- **Default selection:** `bright_indirect` for blank-state. For catalog-prefilled (when user picks from PLANT_DATABASE), use catalog's `lightLevel` (populated by Phase 4 codemod, refined by Phase 8). Picker still shown to allow override.
- **Indoor/outdoor switching:** Picker re-derives label set if `typeId` prop changes (e.g., user switches category in the form mid-flow). Same `OUTDOOR_TYPE_IDS` lookup as Phase 6.
- **Selection feedback:** Selected card uses `colors.green` border + accent background; unselected use card neutral background. Touch target ≥ 44pt (RN min tap target).

### Watering Mode + Schedule Edit Form (WATER-01, WATER-02, WATER-03)
- **Mode toggle:** Inline segmented control at top of water section: `Calendario | Por chequeo` (ES) / `Schedule | Check-in` (EN). Tapping toggles input visibility immediately. Reusable component `src/components/WaterScheduleEditor.tsx`.
- **Fixed-mode inputs:** Two side-by-side numeric inputs, "Temporada cálida" / "Temporada fría", each with the same +/- pattern as the existing `waterEvery` input. Compact, fits AddPlantModal width.
- **Soil_check inputs visibility:** When `mode === 'soil_check'`: HIDE warm/cold interval inputs entirely. Only the segmented control + a small explanatory line remain (e.g., "Te avisamos cada 12 días para que toques la tierra"). Defaults from category.
- **Defaults for new plants (no catalog):** `warm: 4`, `cold: 8`. Mirrors current `waterEvery: 4` default with category-factor 2.0 for cold (matches Phase 4 mapper for `interior` baseline).
- **Defaults for catalog-prefilled:** Use the catalog entry's `waterSchedule.{warm,cold}` and `waterMode` (Phase 4 codemod populated; Phase 8 will refine with expert values).
- **Soil_check default categories (carried from Phase 4):** suculentas, cactus, aloe-vera, echeveria, haworthia, sedum, jade. New plants in those categories default `mode: 'soil_check'`; user can switch to fixed if they prefer.
- **Edit form scope:** AddPlantModal already exists for create. The "edit" surface is the same modal opened with `prefilledPlant`. No separate edit screen — modal handles both create and edit per existing pattern.

### Onboarding Location Prompt (LOC-01, LOC-02, LOC-03, LOC-06)
- **Position in flow:** New step between the existing "name" step and "plant selection" step. Name → **Location** → Plants → Done.
- **Step UI:** Full-screen onboarding step matching the existing pattern (welcome image / icon + title + body + actions). Title: "¿Dónde tenés tus plantas?" / "Where are your plants?". Body: literal LOC-06 copy ("Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima").
- **Action buttons (3, vertical stack):**
  1. **Primary** "Usar mi ubicación" / "Use my location" — triggers `expo-location` permission request → reverse-geocode → save to `useStorage().updateLocation()`.
  2. **Secondary** "Buscar ciudad" / "Search city" — opens an inline city search input using Open-Meteo geocoding (same API the Settings flow already uses).
  3. **Tertiary** "Omitir" / "Skip" — advances to next step. Triggers `markLocationSkipped()` flag in storage so banner can recur.
- **GPS permission denied:** Catch the rejection, show the city-search inline (don't block the flow).
- **What "skip" means:**
  - Onboarding completes; banner appears in Hoy on first open.
  - App falls back to **warm** schedule per LOC-03 (never under-water).
  - Banner is **dismissible per session** (matches Phase 4 Plan 06 dismiss-per-session pattern).
  - `markLocationSkipped()` flag is true; cleared when user sets location later from Settings or banner CTA.
- **Banner copy (Hoy):** Literal LOC-02 — "Agregá tu ubicación para horarios precisos" / "Add your location for precise schedules" + CTA opens Settings location picker.
- **Banner placement:** Above the task list in TodayScreen, below the WeatherWidget. Reuses MigrationBanner-style (Phase 4 Plan 07) component pattern: dismissible, light-blue accent.

### Manual Climate Override + Banner Visibility (LOC-04, LOC-05)
- **Settings location:** New "Zona climática" subsection inside the existing Location section in `SettingsPanel.tsx`. Subsection has a 1-line explanation: "Si la detección automática no acierta, elegí tu zona manualmente" / "If auto-detection is off, pick your zone manually".
- **Picker format:** 4-option segmented control: `Auto` / `Norte templado` / `Sur templado` / `Tropical` (ES); `Auto` / `Northern temperate` / `Southern temperate` / `Tropical` (EN). Default = `Auto`.
- **Storage:** New field `userSettings.climateOverride: 'auto' | 'northern' | 'southern' | 'tropical'`. Default `'auto'`. Persisted in AsyncStorage envelope. Migration-safe — when reading old payloads, treat missing field as `'auto'`.
- **Effective-season logic:** New helper `getEffectiveSeason(location, climateOverride, date)` in `seasonality.ts`:
  - If `climateOverride === 'tropical'` → always `'warm'` (matches SEASON-02 lock for tropical zone).
  - If `climateOverride === 'northern'` → use Northern temperate flip (warm Apr-Sep, cold Oct-Mar).
  - If `climateOverride === 'southern'` → use Southern temperate flip (warm Oct-Mar, cold Apr-Sep).
  - If `climateOverride === 'auto'` AND `location` set → existing `getWaterSeason(location.lat, date)` (Phase 5 SSOT).
  - If `climateOverride === 'auto'` AND `location === null` → return `'warm'` (LOC-03 fallback). Same fallback Phase 5 already uses.
- **Consumer migration:** Every existing call to `getWaterSeason(lat, date)` (in `plantLogic.ts`, `plantHealth.ts`, `notificationScheduler.ts`, `MyPlantDetailModal.tsx`, etc.) is rewritten to `getEffectiveSeason(location, climateOverride, date)`. The `getWaterSeason` core stays as private helper inside `seasonality.ts`. Single SSOT preserved.
- **Banner visibility:** Banner appears in Hoy when BOTH `location === null` AND `climateOverride === 'auto'`. If user sets either a location OR an override, banner stops appearing. Dismiss-per-session for the case where user wants to ignore today.

### Edge-Function Contract + PlantNet (LIGHT-05, write payload)
- **Cut-over strategy:** Server accepts BOTH old and new payloads. Discriminator: presence of `waterSchedule` field. New payload → precision wording in prompt; old payload → legacy wording (current code path). Buys store-update grace window for users who haven't updated.
- **Client behavior (after Phase 7 ships):** Always sends new fields:
  - `lightLevel: LightLevel`
  - `waterSchedule: { warm: number, cold: number }`
  - `waterMode: 'fixed' | 'soil_check'`
  - `currentSeason: 'warm' | 'cold' | 'tropical'` (derived via `getEffectiveSeason` so prompt matches what user sees)
  - Legacy `sunHours` / `waterEvery` no longer sent (server falls back if absent — but new clients never trigger fallback).
- **Edge functions touched (3):** `diagnose-plant/index.ts`, `chat-diagnosis/index.ts`, `identify-plant/index.ts`.
- **Prompt rewrites (diagnose-plant + chat-diagnosis):** Replace `Frecuencia de riego: cada ${ctx.waterEvery} días` and `Horas de sol recomendadas: ${ctx.sunHours}h/día` with:
  - `Modo de riego: ${ctx.waterMode}` (calendario / por chequeo)
  - `Cuidado de riego: temporada cálida cada ${ctx.waterSchedule.warm} días, fría cada ${ctx.waterSchedule.cold} días`
  - `Temporada actual: ${ctx.currentSeason}` (cálida / fría / tropical)
  - `Nivel de luz: ${ctx.lightLevel}` (translated to ES/EN inside the prompt)
  - When `waterMode === 'soil_check'`, omit the calendar lines and add: `Esta planta usa modo "por chequeo" — el usuario revisa la tierra en lugar de regar en intervalos fijos`.
- **Backward-compat sunset:** Edge function reads `waterEvery` only as fallback when `waterSchedule` absent. Drop legacy branch in v1.2 once telemetry shows ≥99% new-payload traffic. Sunset commit also removes legacy i18n keys per SCHEMA-08.
- **`identify-plant` defaults:** Default `lightLevel: 'bright_indirect'` if PlantNet doesn't supply enough info. Edge function may map PlantNet "sunlight" tag (if present in API response) to a `lightLevel` guess (`Full sun` → `direct`, `Partial sun` → `bright_indirect`, `Shade` → `low`); otherwise default. User always edits via picker before save.
- **Identification result modal:** Reuses `LightLevelPicker.tsx` from Area 1 for `lightLevel` adjustment before "Save plant" button. Same component, same i18n. Pre-selects whatever the edge function returned. Tap to override.

### Cross-Cutting / Claude's Discretion
- **AddPlantModal restructure:** The existing modal mixes name + type + waterEvery + sunHours inputs. Phase 7 replaces the two numeric inputs with the two new components (`LightLevelPicker`, `WaterScheduleEditor`). Form layout adjusts vertically — Claude's discretion on exact spacing.
- **`useStorage` extension:** Add `climateOverride: 'auto' | 'northern' | 'southern' | 'tropical'` field to the AppData envelope. Migrate by treating missing as `'auto'`. Schema version stays at 1 (additive, no rewrite).
- **Onboarding flow state:** New step in OnboardingScreen state machine. Claude's discretion on whether to use existing step-index pattern or extract to a config-driven flow.
- **`expo-location` permission UX:** Use `requestForegroundPermissionsAsync()` (the same SettingsScreen uses today). Handle iOS / Android permission rationale copy.
- **City search inline UI:** Reuse the same Open-Meteo geocoding pattern from SettingsScreen — text input + result list + tap-to-select. Extract to a shared `CitySearchInline.tsx` component if the duplication is awkward, otherwise inline.
- **i18n key audit:** Phase 7 introduces ~30+ new keys: `lightLevel.{indoor,outdoor}.{level}.hint` (8), `waterSchedule.modeFixed/modeSoilCheck/warmLabel/coldLabel/soilCheckExplanation` (5), `onboarding.location.title/body/useGps/searchCity/skip` (5), `settings.climateOverride.title/body/auto/northern/southern/tropical` (6), `today.locationBanner.body/cta` (2), plus identify result picker labels. Each lands in BOTH `en/common.json` AND `es/common.json` with voseo for ES.
- **Two-AppContent-paths discipline:** Phase 5 Plan 05 lock — App.tsx has MVP path AND AUTH path. Any new prop threaded through (e.g., `climateOverride`) MUST be added to BOTH destructures. Failure is silent.
- **Plant edit flow:** Currently AddPlantModal opened with prefill = edit. After Phase 7 it must round-trip `lightLevel`, `waterSchedule`, `waterMode` correctly. New plants without those fields use the defaults; existing plants (post-Phase-4 migration) have them populated.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — i18n rules (`t()` everywhere; voseo for ES), design system (`src/theme.ts` only), edge function deploy commands, RevenueCat / RLS notes.

### Planning artifacts
- `.planning/PROJECT.md` — current milestone, validated requirements.
- `.planning/REQUIREMENTS.md` §Light Model (LIGHT-01, LIGHT-02, LIGHT-05), §Watering Model (WATER-01, WATER-02, WATER-03), §Location Precision (LOC-01..06).
- `.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — schema envelope, defensive fallback ladder, two display-vs-scheduler light mappings, AppData shape.
- `.planning/phases/05-hemisphere-season-helpers-pure-utility-switchover/05-CONTEXT.md` — `getWaterSeason`, `getSeasonalInterval`, mode-as-dispatcher invariant, three-zone seasonality.
- `.planning/phases/06-ui-read-side-propagation/06-CONTEXT.md` — `OUTDOOR_TYPE_IDS = {exterior, aromaticas, huerta, frutales}` (suculentas indoor), `getLightLabel(plant, t)` SSOT for read-side labels, indoor/outdoor branch on `typeId`.

### Codebase maps
- `.planning/codebase/STRUCTURE.md` — file layout, where to place new components.
- `.planning/codebase/CONVENTIONS.md` — naming, i18n key patterns, theme usage.
- `.planning/codebase/ARCHITECTURE.md` — runtime flows.
- `.planning/codebase/INTEGRATIONS.md` — Supabase edge function deploy.

### Source files of interest (write-side surfaces)
- `src/components/AddPlantModal.tsx` — currently has `[waterEvery, setWaterEvery]` and `[sunHours, setSunHours]` (lines 34-35). Replace with `LightLevelPicker` and `WaterScheduleEditor`. Round-trip via `prefilledPlant` for edit.
- `src/screens/OnboardingScreen.tsx` — currently has name → plant-selection flow. Insert location step between (around line 314 onwards).
- `src/components/PlantIdentifier/IdentificationResults.tsx` — show `lightLevel` from edge function result, allow user override via picker before save.
- `src/components/SettingsPanel.tsx` — add Zona climática subsection under existing Location section.
- `src/screens/SettingsScreen.tsx` — already has GPS + Open-Meteo geocoding code (lines 84-115). Reuse the patterns; do NOT duplicate.
- `src/screens/TodayScreen.tsx` — add LocationBanner above task list, below WeatherWidget. Hide when `location !== null` OR `climateOverride !== 'auto'`. Dismissible per session.
- `src/utils/seasonality.ts` (Phase 5) — extend with `getEffectiveSeason(location, climateOverride, date)` wrapper. Existing `getWaterSeason` becomes private helper.
- `src/types/index.ts` — extend `UserSettings` (or wherever it lives) with `climateOverride: 'auto' | 'northern' | 'southern' | 'tropical'`.
- `src/hooks/useStorage.tsx` — add `climateOverride` to AppData; provide `setClimateOverride()` action; migrate missing as `'auto'`.

### Edge functions (Supabase)
- `supabase/functions/diagnose-plant/index.ts` — line 13-14 has `waterEvery: number; sunHours: number;` in PlantContext. Add new fields with discriminator. Lines 94-95 (ES prompt) and 102-103 (EN prompt) need rewrite per Phase 7 prompt design.
- `supabase/functions/chat-diagnosis/index.ts` — same structure as diagnose-plant. Lines 28-29 + 95-96 + 127-128 same rewrite pattern.
- `supabase/functions/identify-plant/index.ts` — add `lightLevel` to response shape; map PlantNet "sunlight" tag if present; default `bright_indirect`.

### i18n
- `src/i18n/locales/en/common.json` — add new keys per "i18n key audit" section above.
- `src/i18n/locales/es/common.json` — same keys, voseo for any verb forms.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Open-Meteo geocoding flow** already in `SettingsScreen.tsx:107` — fetch `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=${lang}`. Reuse pattern for onboarding city search.
- **`expo-location` GPS flow** already in `SettingsScreen.tsx:84` — `ExpoLocation.getCurrentPositionAsync()` + `reverseGeocodeAsync({latitude, longitude})`. Reuse pattern for onboarding GPS button.
- **`useStorage().updateLocation()`** already exists. New `setClimateOverride()` follows same pattern.
- **MigrationBanner pattern** (Phase 4 Plan 07) — `src/components/MigrationBanner.tsx` is the reference for LocationBanner: sibling-to-NavigationContainer placement, dismissible local state.
- **MigrationTooltip dismiss-per-session pattern** (Phase 4 Plan 06) — reuse for banner dismiss-per-session if storing in AsyncStorage; `'location-banner-dismissed-v1.1'` key (or similar).
- **`getLightLabel` from `src/utils/lightLabel.ts`** (Phase 6) — read-side label SSOT. Picker uses the same `OUTDOOR_TYPE_IDS` set.
- **`getSeasonalInterval` exported from `src/utils/plantLogic.ts`** (Phase 6) — useful in WaterScheduleEditor preview ("In current season this means: every 5 days").
- **AddPlantModal `prefilledPlant` round-trip** — already handles create + edit through one component. Phase 7 maintains this pattern.

### Established Patterns
- **i18n parity discipline** (Phase 4/6 lock) — every new key MUST exist in both EN and ES, voseo for ES verbs.
- **Defensive fallback ladder** (Phase 4 lock) — v1.1 field → legacy field → safe default. Apply for `lightLevel` reads in identify result; legacy `sunHours` should never make it past the edge function for new clients but server-side fallback covers grace window.
- **Single SSOT for season** (Phase 5/6 lock) — `getEffectiveSeason` becomes the new SSOT; old `getWaterSeason` private inside `seasonality.ts`. Cross-cutting search-and-replace.
- **Mode-as-dispatcher** (Phase 5 lock) — `waterMode` switches the task type AND, in Phase 7, switches the EDIT FORM input visibility. Same dispatcher invariant at write side.
- **No new theme tokens** — reuse `colors.green` for selected state, `colors.bgSecondary` for cards, etc.
- **Local modal visibility state** (CONVENTIONS.md) — picker and editor are inline components within AddPlantModal, no nested navigators.
- **App.tsx two AppContent paths** (Phase 5 Plan 05 lock) — MVP and AUTH both destructure `useStorage`. Any new field added (e.g., `climateOverride`) MUST be in both.
- **Edge function dual-payload pattern** — server reads optional new fields with `??` fallback to old fields. Same pattern Phase 4 used at the edge of the data layer; carries to network edge.

### Integration Points
- **AddPlantModal:** Two new sub-components replace two text inputs. Form `onSave` builds the new schema directly (no `sunHoursToLightLevel` derivation needed at write side — picker outputs `lightLevel` directly).
- **OnboardingScreen:** Adds a new step. Claude's discretion on whether to extract to a config-driven flow or inline-render.
- **PlantIdentifier:** Identify result modal renders the picker pre-selected with the edge-function returned `lightLevel`. Save action emits the picked value.
- **SettingsPanel:** New subsection. `setClimateOverride()` from `useStorage`.
- **TodayScreen:** New `LocationBanner` placed above task list. Hide condition: `location || climateOverride !== 'auto' || dismissed`.
- **Edge functions:** Three files updated. Server tolerates either payload shape via `?.` chains. Client unconditionally sends new shape after Phase 7.
- **`seasonality.ts`:** `getEffectiveSeason` wrapper. All current consumers of `getWaterSeason` migrate to it. `getWaterSeason` becomes private (or stays exported for tests, but production consumers go through wrapper).

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" (Phase 4 lock, carried) — prefer simple, direct UI over abstract reusable patterns when the call sites are few.
- Reuse Open-Meteo geocoding (already in Settings) — don't introduce a new geocoding provider for onboarding. Same API, same i18n parameter, same result shape.
- The `OUTDOOR_TYPE_IDS` set is the locked SSOT for indoor/outdoor branching across read AND write side. Phase 7 picker imports it from `lightLabel.ts` rather than redefining.
- Banner dismiss-per-session pattern carries from Phase 4 Plan 06 (Migration tooltip). Use AsyncStorage keyed by feature ('location-banner-dismissed-session' with date stamp).
- Edge functions accept both old and new payload — explicit, documented in code comments. Same defensive-fallback discipline Phase 4 used internally now applies at the network edge.

</specifics>

<deferred>
## Deferred Ideas

- **Catalog data field rebalance (CAT-01..08)** — Phase 8. Phase 7 only consumes catalog values when prefilling.
- **Diagnosis continuity / paywall (DIAG-01..07, PAY-01..03)** — Phase 9. Phase 7 only updates the diagnosis context payload shape.
- **Backward-compat sunset / legacy key removal** — v1.2, when telemetry shows ≥99% new-payload traffic. Removal is a one-line edge-function commit + grep guard.
- **Auto-detect light from room photo via Vision API** — v2.0 (ADV-03 in REQUIREMENTS.md).
- **PPFD/DLI numeric readouts** — v2.0 (ADV-04).
- **Per-month watering schedule** — v2.0 (ADV-01).
- **Auto-rescheduling from weather forecast** — v2.0 (ADV-02).
- **Re-upload photo within resumed chat for visual context update** — v2.0 (DIAG-V01). Diagnosis resume itself ships in Phase 9 but text-only.
- **Multi-pot tracking** — out of scope per PROJECT.md.
- **Lux/light-meter via phone camera** — out of scope (sensor accuracy issues).
- **Per-plant user-configurable seasonal ratio** — out of scope (catalog defaults sufficient).

</deferred>

---

*Phase: 07-ui-write-side-onboarding-edge-function-contract*
*Context gathered: 2026-05-01*
