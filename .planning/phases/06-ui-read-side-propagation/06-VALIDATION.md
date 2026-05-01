---
phase: 6
slug: ui-read-side-propagation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-01
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | typescript.transpileModule smoke runner (Phase 4/5 single-compile-path policy carried; no jest/vitest installed by project policy) |
| **Config file** | `scripts/smoke-phase06.mjs` (Wave 0 creates) |
| **Quick run command** | `npx tsc --noEmit` (type-only, ~6s) |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase06.mjs` (type + behavior, ~12s) |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && node scripts/smoke-phase06.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green AND manual UI inspection in Expo Go for the visual SC items
- **Max feedback latency:** 12 seconds

---

## Per-Task Verification Map

> Filled in by gsd-planner during plan creation. Every plan task entry MUST appear here with an automated command OR be flagged Manual in the table below. Sampling continuity rule: no 3 consecutive tasks without automated verify.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| _TBD by planner_ | — | — | — | — | — | — | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase06.mjs` — pure-utility smoke runner for `getLightLabel`, `getWaterBadge`, `getSeasonBadgeText`, `getNextCheckInDays` (whatever helper file the planner extracts). Single-compile-path policy carries from Phases 4/5.
- [ ] No new framework install — typescript already a project dep; node mjs runner sufficient.

*Visual rendering (RN screen + modal output) is verified manually in Expo Go per the Manual-Only table below — there is no React Native test renderer in this project (CLAUDE.md: "No test framework is set up").*

---

## Manual-Only Verifications

> Required complement to automated tests because the project has no RN test renderer.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Light-level label renders correctly on PlantCard, PlantDetailModal, MyPlantDetailModal, PlantHealthDetail, PlantDiagnosisModal in EN and ES | LIGHT-06 | No RN renderer; visual placement matters | Open Expo Go on iOS simulator and Android emulator. For each surface, open a plant in each `lightLevel` × locale combination. Confirm label reads `Luz brillante indirecta` (ES) / `Bright indirect light` (EN), no `Xh sol` legacy copy anywhere. |
| Outdoor plants (typeId in `exterior`,`aromaticas`,`huerta`,`frutales`) show outdoor-context labels | LIGHT-07 | Visual; needs typeId-aware switching at runtime | Add a "tomate" (huerta) and a "monstera" (interior). Open both in PlantDetail. Confirm tomate shows `Sol pleno`/`Semi sombra` family, monstera shows indoor `Luz brillante indirecta` family. |
| Season badge inline with next-water row, em-dash separator, secondary color | SEASON-05 | Visual + style | Open PlantDetail; confirm row reads `Cada 5 días — temporada cálida`. Toggle a tropical-latitude plant (lat 0) and confirm row reads `Cada 5 días — trópico`. |
| Watering-mode badge always visible on PlantCard with current-season interval for `fixed`, fixed string for `soil_check` | UX-02 | Visual + interval correctness varies by season | Open PlantsScreen. Confirm a non-cactus shows `💧 Cada Nd` where N matches current-season interval. Confirm a cactus shows `🤚 Por chequeo`. Test with device clock set to a cold-season date and confirm interval flips. |
| Soil-check empty-state row shows on Hoy when soil_check plant has no task today; "all caught up" does NOT fire if such plants exist | UX-03 | Visual + empty-state interaction with existing TodayScreen logic | Add only a cactus (soil_check). Open Hoy on a non-check-in day. Confirm row reads `Tu Cactus está en modo chequeo. Te avisamos en N días.` Confirm celebration empty state does NOT render. Add a non-cactus with a task today; confirm cactus row still shows alongside the task. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify OR are listed in Manual-Only table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (`scripts/smoke-phase06.mjs`) covers helper utility behavior
- [ ] No watch-mode flags
- [ ] Feedback latency < 12s
- [ ] `nyquist_compliant: true` set in frontmatter after planner fills the per-task map and Wave 0 ships

**Approval:** pending
