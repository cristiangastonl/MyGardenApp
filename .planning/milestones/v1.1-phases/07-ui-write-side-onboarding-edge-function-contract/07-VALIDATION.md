---
phase: 7
slug: ui-write-side-onboarding-edge-function-contract
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-01
updated: 2026-05-01
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | typescript.transpileModule smoke runner (Phase 4/5/6 single-compile-path policy carried; no jest/vitest installed by project policy) |
| **Config file** | `scripts/smoke-phase07.mjs` (Wave 0 / Plan 07-01 creates) |
| **Quick run command** | `npx tsc --noEmit` (type-only, ~6s) |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase07.mjs && node scripts/smoke-phase06.mjs && node scripts/migration-smoke-test.mjs` (type + Phase 7 + Phase 6 + Phase 4/5 regression) |
| **Estimated runtime** | ~18 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run full suite (above)
- **Before `/gsd:verify-work`:** Full suite must be green AND manual UI inspection in Expo Go for the visual SC items
- **Max feedback latency:** 18 seconds

---

## Per-Task Verification Map

> Filled in by gsd-planner during plan creation. Every plan task entry MUST appear here with an automated command OR be flagged Manual in the table below. Sampling continuity rule: no 3 consecutive tasks without automated verify.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-T1 | 07-01 | 0 | LOC-05 | Type | `npx tsc --noEmit` | src/types/index.ts | ⬜ |
| 07-01-T2 | 07-01 | 0 | LOC-05 | Type | `npx tsc --noEmit` | src/hooks/useStorage.tsx | ⬜ |
| 07-01-T3 | 07-01 | 0 | LOC-05 | Grep | `grep -c "climateOverride" App.tsx` (expect ≥2) | App.tsx | ⬜ |
| 07-01-T4 | 07-01 | 0 | LOC-05 | Smoke | `node scripts/smoke-phase07.mjs` (foundation suite) | scripts/smoke-phase07.mjs | ⬜ |
| 07-02-T1 | 07-02 | 0 | LOC-03/04/05 | Type+Smoke | `npx tsc --noEmit` then matrix in smoke runner | src/utils/seasonality.ts | ⬜ |
| 07-02-T2 | 07-02 | 0 | LOC-04/05 | Type | `npx tsc --noEmit` | src/utils/plantLogic.ts | ⬜ |
| 07-02-T3 | 07-02 | 0 | LOC-03/04/05 | Type | `npx tsc --noEmit` | utility-layer files | ⬜ |
| 07-02-T4 | 07-02 | 0 | LOC-04/05 | Type+Grep | `npx tsc --noEmit` + `grep -c "getEffectiveSeason" src/components/MyPlantDetailModal.tsx` ≥1 | component-layer files | ⬜ |
| 07-02-T5 | 07-02 | 0 | LOC-04/05 | Type | `npx tsc --noEmit` (project-wide green) | screen + App.tsx | ⬜ |
| 07-02-T6 | 07-02 | 0 | LOC-04/05 | Smoke | `node scripts/smoke-phase07.mjs` (≥18 PASS) | scripts/smoke-phase07.mjs | ⬜ |
| 07-03-T1 | 07-03 | 1 | LIGHT-01/02 + WATER-01/02/03 + LOC-01/02/05/06 | JSON+Grep | `node -e "JSON.parse(...)"` + custom parse-and-count script | src/i18n/locales/es/common.json | ⬜ |
| 07-03-T2 | 07-03 | 1 | (same) | JSON+Parity | Strict EN+ES key parity script | src/i18n/locales/en/common.json | ⬜ |
| 07-03-T3 | 07-03 | 1 | (same) | Smoke | `node scripts/smoke-phase07.mjs` (≥78 PASS) | scripts/smoke-phase07.mjs | ⬜ |
| 07-04-T1 | 07-04 | 1 | LIGHT-01/02 | Type+Grep | `npx tsc --noEmit` + grep `OUTDOOR_TYPE_IDS` ≥2 + `minHeight: 44` ≥1 | src/components/LightLevelPicker.tsx | ⬜ |
| 07-04-T2 | 07-04 | 1 | WATER-01/02/03 | Type+Grep | `npx tsc --noEmit` + grep `mode === 'fixed'` ≥1 + `disabled=` === 0 | src/components/WaterScheduleEditor.tsx | ⬜ |
| 07-05-T1 | 07-05 | 2 | LIGHT-01/02 + WATER-01/02/03 | Type+Grep | `npx tsc --noEmit` + grep `LightLevelPicker` ≥2 + `WaterScheduleEditor` ≥2 + `waterEvery: parseInt` === 0 | src/components/AddPlantModal.tsx | ⬜ |
| 07-05-T2 | 07-05 | 2 | LIGHT-01/02 + WATER-01/02/03 | Type+Grep | `npx tsc --noEmit` + grep `lightLevel` ≥2 in plantDBToPlant + `waterEvery: dbEntry.waterDays` === 0 | src/screens/OnboardingScreen.tsx | ⬜ |
| 07-05-T3 | 07-05 | 2 | LOC-01/06 | Type+Grep | `npx tsc --noEmit` + grep `renderStep1Location` ≥2 + `totalSteps={4}` ≥1 + `currentStep === 2` ≥2 | src/screens/OnboardingScreen.tsx | ⬜ |
| 07-06-T1 | 07-06 | 2 | LIGHT-05 | Type+Grep | `npx tsc --noEmit` + grep `lightLevel?: LightLevel` ≥2 + `sunHoursToLightLevel` ≥2 in plantIdentification.ts | src/types/index.ts + src/utils/plantIdentification.ts | ⬜ |
| 07-06-T2 | 07-06 | 2 | LIGHT-05 | Type+Grep | `npx tsc --noEmit` + grep `LightLevelPicker` ≥3 + `selectedLightLevel` ≥4 | src/components/PlantIdentifier/IdentificationResults.tsx | ⬜ |
| 07-07-T1 | 07-07 | 3 | LOC-02 | Type+Grep | `npx tsc --noEmit` + grep `today.locationBanner` ≥2 + `minHeight: 44` ≥2 | src/components/LocationBanner.tsx | ⬜ |
| 07-07-T2 | 07-07 | 3 | LOC-02/03 | Type+Grep | `npx tsc --noEmit` + grep `LocationBanner` ≥2 + `locationBannerDismissed` ≥3 + AsyncStorage usage === 0 | src/screens/TodayScreen.tsx | ⬜ |
| 07-07-T3 | 07-07 | 3 | LOC-04/05 | Type+Grep | `npx tsc --noEmit` + grep `setClimateOverride` ≥2 + `'auto', 'northern', 'southern', 'tropical'` ≥1 + `minHeight: 44` ≥1 | src/components/SettingsPanel.tsx | ⬜ |
| 07-08-T1 | 07-08 | 4 | LIGHT-05 | Type | `npx tsc --noEmit` | src/types/index.ts | ⬜ |
| 07-08-T2 | 07-08 | 4 | LIGHT-05 | Type+Grep | `npx tsc --noEmit` + grep `getEffectiveSeason` ≥2 + `currentSeason` ≥2 + `waterEveryForContext` === 0 | src/components/PlantDiagnosis/PlantDiagnosisModal.tsx | ⬜ |
| 07-08-T3 | 07-08 | 4 | LIGHT-05 | Grep | grep `isV2 = !!ctx` ≥1 + `Modo de riego` ≥1 + `Watering mode` ≥1 + `temporada cálida cada` + `por chequeo` + legacy preserved | supabase/functions/diagnose-plant/index.ts | ⬜ |
| 07-08-T4 | 07-08 | 4 | LIGHT-05 | Grep | (same as T3 mirrored) | supabase/functions/chat-diagnosis/index.ts | ⬜ |
| 07-08-T5 | 07-08 | 4 | LIGHT-05 | Smoke | `node scripts/smoke-phase07.mjs` (≥95 PASS) | scripts/smoke-phase07.mjs | ⬜ |
| 07-08-T6 | 07-08 | 4 | LIGHT-05 | **Manual** | Deploy command output ("Deployed Function") — see Manual-Only table | (Supabase deploy) | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity check:** No 3 consecutive tasks without automated verify. Tasks 07-08-T6 is the only manual-flagged task; all surrounding tasks have automated verify (T5 smoke, T1-T4 type+grep). Continuity rule satisfied.

---

## Wave 0 Requirements

- [x] `scripts/smoke-phase07.mjs` (Plan 07-01 Task 4) — pure-utility smoke runner scaffold (foundation suite + ENOENT-tolerant placeholder for Plan 07-02 matrix); locked single-compile-path policy carried from Phase 4/5/6.
- [x] Storage extension: `climateOverride: ClimateOverride` field added to `AppData` (Plan 07-01 Task 1) + `useStorage` action `setClimateOverride()` (Plan 07-01 Task 2) + Both AppContent destructures (Plan 07-01 Task 3) — lays foundation for getEffectiveSeason consumers in Plan 07-02.
- [x] `getEffectiveSeason(location, climateOverride, date)` SSOT export (Plan 07-02 Task 1) + matrix smoke assertions across 4 climate-override modes × tropical/temperate latitudes (Plan 07-02 Task 6).
- [x] Edge-function payload discriminator string assertions (Plan 07-08 Task 5) — string-level smoke against the prompt-builder branch logic; no live Supabase fetch.
- [x] No new framework install — typescript already a project dep; node mjs runner sufficient. PlantNet API not exercised live.

*Visual rendering (RN screen + modal output) is verified manually in Expo Go per the Manual-Only table — no React Native test renderer in this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 4-card light picker (icon + name + locale-specific hint) renders correctly in EN and ES on AddPlantModal, edit form, and IdentificationResults | LIGHT-01, LIGHT-02 | Visual; layout-sensitive; touch-target verification | Open Expo Go iOS+Android. Open AddPlantModal blank. Confirm 2×2 grid with 4 cards, each ≥44pt tap target, hint text in user locale. Switch language; confirm hints translate. Confirm pre-selected card has green border. |
| WaterScheduleEditor segmented toggle hides intervals when soil_check, shows side-by-side warm/cold for fixed | WATER-01, WATER-02, WATER-03 | Visual + interaction | Open AddPlantModal, set mode to "Por chequeo" — confirm warm/cold inputs disappear (HIDE, not disable). Switch to "Calendario" — confirm both inputs reappear. Edit values via +/-. Save and reopen plant in edit mode — confirm round-trip. |
| Onboarding location step renders between name and plant selection with 3 actions (GPS / city search / skip) | LOC-01, LOC-06 | Full flow visual | Fresh install. Complete name step. Confirm new step appears with literal LOC-06 copy. Tap "Use my location" — accept GPS prompt — confirm location saved. Re-test with deny — confirm city search inline appears. Re-test with skip — confirm advances to plants. |
| Hoy LocationBanner appears when location null + climateOverride 'auto'; dismissible per session; CTA opens Settings | LOC-02 | Visual + interaction across sessions | Skip location at onboarding. Open Hoy — confirm banner above tasks ("Agregá tu ubicación"). Dismiss — confirm gone for session. Force-quit + relaunch — confirm banner returns. Tap CTA — confirm Settings location screen opens. Set location — confirm banner stops appearing. |
| Settings Zona climática 4-option segmented picker overrides season correctly | LOC-04, LOC-05 | Visual + cross-screen behavior | Open Settings → Location → Zona climática. Confirm 4 options. Set "Tropical" — return to Hoy → MyPlantDetailModal — confirm season badge reads "trópico" regardless of latitude. Set "Norte templado" — confirm temperate Northern flip. Set Auto — confirm derives from location lat. |
| PlantIdentifier result modal shows 4-card light picker pre-selected with edge-function returned lightLevel | LIGHT-05 | Full identify flow | Capture a photo via PlantIdentifier. Confirm result modal shows 4-card picker with one card pre-selected (default bright_indirect or PlantNet-derived). Tap a different card → tap Save Plant → confirm saved plant has the user-picked lightLevel. |
| Diagnosis chat reflects new payload (precision wording in AI response) for new clients; legacy wording for old clients | LIGHT-05 | Edge function — server log inspection | Trigger a diagnosis from updated client. Inspect Supabase function logs — confirm prompt contains "Modo de riego", "temporada cálida", "Nivel de luz" (NOT "waterEvery", "sunHours"). Re-test with simulated old payload (curl with old shape) — confirm legacy prompt still works. |
| Edge functions deployed to Supabase (Task 07-08-T6) | LIGHT-05 | Requires `.envrc` secrets — Claude has no read access | Run `source .envrc && supabase functions deploy diagnose-plant` and `source .envrc && supabase functions deploy chat-diagnosis`. Confirm "Deployed Function" output line for each. Optional: tail Supabase Dashboard → Functions → Logs to verify new prompt format on next diagnosis trigger. |

---

## Validation Sign-Off

- [x] All tasks have automated verify OR are listed in Manual-Only table above
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (only 07-08-T6 is manual; surrounded by automated verify on both sides)
- [x] Wave 0 (`scripts/smoke-phase07.mjs`) covers `getEffectiveSeason` matrix + AppData migration + payload discriminator
- [x] No watch-mode flags
- [x] Feedback latency < 18s
- [x] `nyquist_compliant: true` set in frontmatter (above)

**Approval:** validated by planner — ready for execution
