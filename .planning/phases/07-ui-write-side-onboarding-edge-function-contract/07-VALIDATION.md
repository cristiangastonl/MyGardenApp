---
phase: 7
slug: ui-write-side-onboarding-edge-function-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-01
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
| _TBD by planner_ | — | — | — | — | — | — | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase07.mjs` — pure-utility smoke runner for `getEffectiveSeason` (4 climate-override modes × tropical/temperate latitudes), `useStorage` migration of missing `climateOverride`, AppData shape parity, edge-function payload discriminator unit (string-level smoke against the prompt builder logic).
- [ ] No new framework install — typescript already a project dep; node mjs runner sufficient. PlantNet API not exercised live.

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

---

## Validation Sign-Off

- [ ] All tasks have automated verify OR are listed in Manual-Only table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (`scripts/smoke-phase07.mjs`) covers `getEffectiveSeason` matrix + AppData migration + payload discriminator
- [ ] No watch-mode flags
- [ ] Feedback latency < 18s
- [ ] `nyquist_compliant: true` set in frontmatter after planner fills the per-task map and Wave 0 ships

**Approval:** pending
