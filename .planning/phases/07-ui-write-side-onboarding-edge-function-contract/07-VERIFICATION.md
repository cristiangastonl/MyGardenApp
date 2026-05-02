---
phase: 07-ui-write-side-onboarding-edge-function-contract
verified: 2026-05-01T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
human_verification:
  - test: "LightLevelPicker 2x2 visual layout on device"
    expected: "4 cards render as a 2x2 grid with icon + level name + hint text visible; selected card has green border and info-blue background; tapping each card highlights it"
    why_human: "flexBasis 48% + flexWrap layout verified by code inspection, but actual pixel render depends on device width and font metrics"
  - test: "WaterScheduleEditor segmented toggle behavior"
    expected: "Switching from 'fixed' to 'soil_check' immediately hides warm/cold number inputs (not disabled — absent from tree); switching back restores them with previously set values"
    why_human: "Conditional render verified (mode === 'fixed' && <View>), but show/hide animation and value preservation require running the app"
  - test: "LocationBanner dismiss across sessions"
    expected: "Banner appears on first launch if location is null and climateOverride is 'auto'; dismissing it with x removes it for the session; killing and relaunching the app brings it back"
    why_human: "useState(false) confirm verified in code but per-session vs. persistent behavior requires device test"
  - test: "Climate override end-to-end (Settings → season badge)"
    expected: "Setting 'Tropical' in Settings > Zona climatica makes season always show 'warm' regardless of location lat; 'Norte templado' applies Northern hemisphere flip; 'Sur templado' applies Southern flip; 'Auto' reverts to GPS-derived"
    why_human: "getEffectiveSeason branch logic verified by code + smoke test, but the end-to-end Settings knob → MyPlantDetailModal season badge requires visual confirmation"
---

# Phase 7: UI Write-Side, Onboarding, Edge-Function Contract — Verification Report

**Phase Goal:** Every plant-creating and plant-editing surface — onboarding, AddPlantModal, plant identification, diagnosis context — emits the new schema; the user is asked for location at onboarding with a clear skip path; if location is missing the app falls back gracefully and surfaces a non-blocking banner; manual climate-zone override is available in Settings.

**Verified:** 2026-05-01
**Status:** human_needed (all automated checks pass; 4 visual/behavioral items in v1.1 device-test backlog per user standing preference)
**Re-verification:** No — initial verification

---

## Automated Test Results

| Suite | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | PASS (0 errors) |
| Phase 7 smoke | `node scripts/smoke-phase07.mjs` | PASS 100/100 |
| Phase 6 regression | `node scripts/smoke-phase06.mjs` | PASS 82/82 |
| Phase 4/5 regression | `node scripts/migration-smoke-test.mjs` | PASS 106/106 |

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | LightLevelPicker exists, exports named function, imports OUTDOOR_TYPE_IDS from lightLabel.ts (no local redefinition), 2x2 grid layout, minHeight 44pt | VERIFIED | `src/components/LightLevelPicker.tsx` — 113 lines; `import { OUTDOOR_TYPE_IDS } from '../utils/lightLabel'`; `flexBasis: '48%'` + `flexWrap: 'wrap'`; `minHeight: 44` on `.card` |
| 2 | LightLevelPicker is used in both AddPlantModal and IdentificationResults | VERIFIED | AddPlantModal line 17 (import) + line 206 (render); IdentificationResults line 13 (import) + lines 99, 143 (render in single + multiple branches) |
| 3 | IdentifiedPlant.lightLevel?: LightLevel defined in types/index.ts | VERIFIED | `src/types/index.ts` line 276: `lightLevel?: LightLevel` on `IdentifiedPlant` interface |
| 4 | convertPlantNetResult populates lightLevel via 3-rung defensive ladder (catalog lightLevel → sunHoursToLightLevel → 'bright_indirect') | VERIFIED | `src/utils/plantIdentification.ts` lines 213-215 (catalog branch) + lines 237-239 (generic branch); both branches call `sunHoursToLightLevel` or fall back to `'bright_indirect'` |
| 5 | WaterScheduleEditor exports editor with segmented mode toggle; hides warm/cold inputs entirely when mode === 'soil_check' (conditional render, no disabled= prop) | VERIFIED | `src/components/WaterScheduleEditor.tsx` — `{mode === 'fixed' && <View ...>}` (line 68); `{mode === 'soil_check' && <Text ...>}` (line 116); zero occurrences of `disabled=` prop |
| 6 | AddPlantModal uses both LightLevelPicker and WaterScheduleEditor | VERIFIED | AddPlantModal lines 17-18 (imports); lines 205-216 (LightLevelPicker render); line 216+ (WaterScheduleEditor render) |
| 7 | OnboardingScreen has location step (step 1) with totalSteps=4, plant-empty check at currentStep===2, 3 vertical buttons (GPS/city/skip) | VERIFIED | Lines 892 (`totalSteps={4}`); 904-905 (`renderStep1Location` at step 1, `renderStep1` at step 2); 311-312 (empty check at `currentStep === 2`); 537-589 (GPS + city + skip buttons each with `minHeight: 44`) |
| 8 | LOC-06 body text verbatim in ES i18n: "Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima" | VERIFIED | `src/i18n/locales/es/common.json` `onboarding.location.body` matches REQUIREMENTS.md LOC-06 spec exactly |
| 9 | LocationBanner exists; TodayScreen renders it conditionally on `location === null && climateOverride === 'auto' && !sessionDismissed`; dismiss is useState only (no AsyncStorage) | VERIFIED | `src/components/LocationBanner.tsx` — 101 lines; TodayScreen lines 154 (`useState(false)`), 316-319 (condition + render); zero matches for `AsyncStorage.*location-banner` in TodayScreen |
| 10 | getEffectiveSeason returns 'warm' when climateOverride === 'auto' AND location === null (LOC-03 fallback) | VERIFIED | `src/utils/seasonality.ts` line 29: `if (latitude === null ...) return 'warm'`; invoked via `getWaterSeason(location?.lat ?? null, date)` on the 'auto' branch |
| 11 | SettingsPanel has 4-option climate-zone segmented picker (auto/northern/southern/tropical) calling setClimateOverride | VERIFIED | `src/components/SettingsPanel.tsx` lines 499-511: `(['auto', 'northern', 'southern', 'tropical'] as const).map(...)` + `setClimateOverride(opt)`; `t('settings.climateOverride.${opt}')` labels confirmed in ES i18n |
| 12 | getEffectiveSeason honors override: tropical → always 'warm'; northern/southern → respective temperate flip; auto → GPS-derived | VERIFIED | `src/utils/seasonality.ts` lines 66-77: three explicit branches for tropical, northern, southern; auto delegates to `getWaterSeason`; confirmed by smoke-phase07.mjs 100/100 |
| 13 | PlantDiagnosisContext widened with v1.1 fields; PlantDiagnosisModal builds context via getEffectiveSeason; edge functions use `!!ctx.waterSchedule` discriminator with legacy branch preserved | VERIFIED | `src/types/index.ts` lines 325-340 (`PlantDiagnosisContext` has `waterSchedule?`, `lightLevel?`); `PlantDiagnosisModal.tsx` lines 21, 74, 81-82; `diagnose-plant/index.ts` line 100 (`const isV2 = !!ctx?.waterSchedule`); `chat-diagnosis/index.ts` line 101 (same) |

**Score:** 12/12 truths verified (truth 13 covers the PlantDiagnosisContext group)

---

### Required Artifacts

| Artifact | Status | Details |
|---|---|---|
| `src/components/LightLevelPicker.tsx` | VERIFIED | 113 lines; substantive — 4-card grid, indoor/outdoor branch, 44pt targets, i18n labels |
| `src/components/WaterScheduleEditor.tsx` | VERIFIED | 203 lines; segmented control + conditional warm/cold inputs; HIDE-not-disable confirmed |
| `src/components/LocationBanner.tsx` | VERIFIED | 101 lines; 44pt CTA and dismiss targets; uses `colors.infoBg`/`colors.infoText`; i18n |
| `src/utils/seasonality.ts` | VERIFIED | `getEffectiveSeason` exported; `getWaterSeason` private; 4 override branches implemented |
| `src/utils/plantIdentification.ts` | VERIFIED | `convertPlantNetResult` populates `lightLevel` via 3-rung ladder in both catalog and generic branches |
| `src/screens/OnboardingScreen.tsx` | VERIFIED | `renderStep1Location` at step 1; `totalSteps={4}`; plant-empty guard at `currentStep===2`; 3 buttons with 44pt targets |
| `src/screens/TodayScreen.tsx` | VERIFIED | LocationBanner render with correct condition; dismiss via `useState`; `getEffectiveSeason` called for `effectiveSeason` |
| `src/components/SettingsPanel.tsx` | VERIFIED | 4-option climate picker at lines 499-511; `setClimateOverride` wired; 4-pill flexWrap layout |
| `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` | VERIFIED | `getEffectiveSeason` imported and called; `lightLevel` and `waterSchedule` added to context object |
| `supabase/functions/diagnose-plant/index.ts` | VERIFIED | `waterSchedule?` in PlantContext type; `!!ctx?.waterSchedule` discriminator; v1.0 legacy branch preserved |
| `supabase/functions/chat-diagnosis/index.ts` | VERIFIED | Same discriminator pattern; legacy branch preserved |

---

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `LightLevelPicker.tsx` | `src/utils/lightLabel.ts` | `import { OUTDOOR_TYPE_IDS }` | WIRED |
| `AddPlantModal.tsx` | `LightLevelPicker.tsx` | import + render at line 206 | WIRED |
| `AddPlantModal.tsx` | `WaterScheduleEditor.tsx` | import + render | WIRED |
| `IdentificationResults.tsx` | `LightLevelPicker.tsx` | import line 13 + render lines 99, 143 | WIRED |
| `plantIdentification.ts` | `src/utils/migration.ts` | `import { sunHoursToLightLevel }` | WIRED |
| `TodayScreen.tsx` | `LocationBanner.tsx` | import line 50 + conditional render line 316 | WIRED |
| `TodayScreen.tsx` | `seasonality.ts` | `getEffectiveSeason` called at line 103 | WIRED |
| `PlantDiagnosisModal.tsx` | `seasonality.ts` | `getEffectiveSeason` imported line 21, called line 74 | WIRED |
| `SettingsPanel.tsx` | `useStorage` | `useStorage().setClimateOverride` at line 107, line 505 | WIRED |
| `diagnose-plant/index.ts` | discriminator | `!!ctx?.waterSchedule` at line 100 | WIRED |
| `chat-diagnosis/index.ts` | discriminator | `!!ctx?.waterSchedule` at line 101 | WIRED |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|---|---|---|---|
| LIGHT-01 | User can set light level via 4-card picker | SATISFIED | LightLevelPicker: 4 cards, icon + name + hint, used in AddPlantModal + IdentificationResults |
| LIGHT-02 | 4 LightLevel values translated in en + es-AR | SATISFIED | i18n keys `lightLevel.{indoor,outdoor}.{level}` + `lightLevelHint.*` present in both locales |
| LIGHT-05 | Plant identification flow returns lightLevel (default bright_indirect) | SATISFIED | `convertPlantNetResult` 3-rung ladder; IdentificationResults renders LightLevelPicker pre-seeded |
| WATER-01 | waterSchedule: { warm, cold } on each plant | SATISFIED | Type at `types/index.ts`; WaterScheduleEditor edits it; AddPlantModal wires it |
| WATER-02 | waterMode: 'fixed' | 'soil_check' on each plant | SATISFIED | WaterMode type + WaterScheduleEditor segmented control |
| WATER-03 | User can edit warm/cold intervals; soil_check shows no interval inputs but toggle | SATISFIED | HIDE-not-disable confirmed; zero `disabled=` props in WaterScheduleEditor |
| LOC-01 | Onboarding has non-blocking location prompt with skip | SATISFIED | `renderStep1Location` at step 1; `handleSkipLocation` just advances to next step |
| LOC-02 | Location-missing banner on Hoy with CTA to settings | SATISFIED | LocationBanner in TodayScreen with correct condition and `navigate('Ajustes')` CTA |
| LOC-03 | Missing location falls back to 'warm' schedule | SATISFIED | `getWaterSeason(null, date)` returns `'warm'`; invoked by `getEffectiveSeason` 'auto' branch |
| LOC-04 | Location fallback chain: GPS → city → graceful default | SATISFIED | OnboardingScreen: GPS button + city search + skip; `getEffectiveSeason` auto+null → 'warm' (CONTEXT.md locked this as the final fallback, superseding the aspirational locale-based default in REQUIREMENTS.md pre-design text) |
| LOC-05 | Manual climate-zone override in Settings | SATISFIED | SettingsPanel 4-option picker wired to `setClimateOverride`; `getEffectiveSeason` honors override |
| LOC-06 | Location prompt explains why location is needed | SATISFIED | ES i18n `onboarding.location.body` verbatim matches REQUIREMENTS.md spec |

**Note on LOC-04:** REQUIREMENTS.md mentions "locale-based default (es-AR → Southern, en-US/en-GB → Northern)" as the last fallback. The CONTEXT.md design lock (the authoritative spec for this phase) collapsed this to 'warm' — the same safe-default LOC-03 already requires. The manual climate override (LOC-05) is the provided mechanism for users in those locales to correct hemisphere derivation. No gap.

---

### Anti-Patterns Found

None. No TODO/FIXME/placeholder comments, no empty implementations, no return null stubs found in any Phase 7 key files.

---

### Known-Deferred Items (Not Gaps)

- **Plan 07-08 Task 6 — Supabase edge function deploy:** Deferred by user decision; batched at end-of-milestone with other manual deploys. Edge functions are production-ready in source; legacy branch preservation ensures all in-field clients continue working. Not a gap.
- **Mock getMockIdentificationResult objects** do not carry `lightLevel` — this is a dev-only code path with no user-facing consequence. Not a gap.

---

### Human Verification Required

These items are in the v1.1 device-test backlog per the user's standing preference for end-of-milestone manual E2E testing:

#### 1. LightLevelPicker 2x2 Visual Layout

**Test:** Open AddPlantModal on a physical device. Navigate to the light level section.
**Expected:** 4 cards render in a 2x2 grid. Each card shows emoji icon, level name, and hint text on separate lines. Selected card has green border and blue-tint background. Tapping each card highlights it immediately.
**Why human:** `flexBasis: '48%'` + `flexWrap` layout was code-inspected but pixel render depends on device width and font metrics.

#### 2. WaterScheduleEditor Segmented Toggle

**Test:** Open AddPlantModal, toggle watering mode from "Calendario" to "Por tacto del suelo" and back.
**Expected:** Switching to soil_check immediately removes the warm/cold number inputs from the layout (not greyed out — gone). Switching back to fixed restores them with the previous values intact.
**Why human:** Conditional render (`{mode === 'fixed' && <View>}`) confirmed by code inspection; visual disappearance and value preservation require a running app.

#### 3. LocationBanner Session Dismiss Behavior

**Test:** Launch the app with location = null and climateOverride = 'auto'. Go to Hoy tab.
**Expected:** Banner appears. Tap ×. Banner disappears for the session. Kill and relaunch the app. Banner reappears on Hoy.
**Why human:** `useState(false)` dismiss logic was confirmed; session-scoped (not persisted) behavior must be verified on device.

#### 4. Climate Override End-to-End

**Test:** In Settings > Zona climática, set "Tropical", then check a plant's season indicator. Set "Norte templado" and "Sur templado" and verify the flip. Set back to "Auto" and verify it derives from location.
**Expected:** Tropical always shows warm season regardless of GPS. Norte/Sur flip correctly by month. Auto reverts to GPS-derived hemisphere.
**Why human:** `getEffectiveSeason` branch logic and smoke test confirmed; the end-to-end knob → UI badge requires a running app with visible season display.

---

## Gaps Summary

No gaps. All 12 must-haves are verified in the actual codebase. The phase goal is achieved: every plant-creating and plant-editing surface emits the new schema; onboarding has a location step with a clear skip; missing location falls back gracefully and shows a dismissible banner; manual climate-zone override is in Settings.

The 4 human-verification items are pre-catalogued in the v1.1 device-test backlog and do not block phase completion per the user's established testing policy.

---

_Verified: 2026-05-01_
_Verifier: Claude (gsd-verifier)_
