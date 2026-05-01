---
phase: 6
slug: ui-read-side-propagation
status: planner-filled
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-01
updated: 2026-05-01
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | typescript.transpileModule smoke runner (Phase 4/5 single-compile-path policy carried; no jest/vitest installed by project policy) |
| **Config file** | `scripts/smoke-phase06.mjs` (Wave 0 / Plan 06-01 creates) |
| **Quick run command** | `npx tsc --noEmit` (type-only, ~6s) |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase06.mjs && node scripts/migration-smoke-test.mjs` (type + behavior + Phase 4/5 regression, ~15s) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && node scripts/smoke-phase06.mjs && node scripts/migration-smoke-test.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green AND manual UI inspection in Expo Go for the visual SC items
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

> Every Phase 6 task — automated check + plan/wave traceability. Sampling continuity rule satisfied (no 3 consecutive tasks without automated verify; every task has a `<verify><automated>` block).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-T1 | 06-01 | 0 | LIGHT-06, LIGHT-07, SEASON-05 | tsc + grep | `grep -c '^export function getSeasonalInterval' src/utils/plantLogic.ts` === 1 && `npx tsc --noEmit` | ✅ Plan 06-01 creates | ⬜ |
| 06-01-T2 | 06-01 | 0 | LIGHT-06, LIGHT-07 | tsc + grep | `grep -c '^export function getLightLabel' src/utils/lightLabel.ts` === 1 && `npx tsc --noEmit` | ✅ Plan 06-01 creates | ⬜ |
| 06-01-T3 | 06-01 | 0 | LIGHT-06, LIGHT-07, SEASON-05 | smoke runner exit code | `node scripts/smoke-phase06.mjs` exits 0 with `Phase 6 smoke: PASS` | ✅ Plan 06-01 creates | ⬜ |
| 06-02-T1 | 06-02 | 1 | LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03 | JSON parse + key assertions | `node -e "..."` validates 15 EN keys exist with exact values | ✅ Plan 06-02 creates | ⬜ |
| 06-02-T2 | 06-02 | 1 | LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03 | JSON parse + voseo regex | `node -e "..."` validates 15 ES keys + voseo cleanliness | ✅ Plan 06-02 creates | ⬜ |
| 06-02-T3 | 06-02 | 1 | LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03 | smoke runner exit code | `node scripts/smoke-phase06.mjs` exits 0 with ≥50 PASS lines | ✅ Plan 06-02 extends | ⬜ |
| 06-03-T1 | 06-03 | 2 | UX-02 | tsc + grep | `npx tsc --noEmit` && `grep -c "waterBadge" src/components/PlantCard.tsx` >= 4 && `grep -c "nextWater\b" ...` === 0 | ✅ MVP-live | ⬜ |
| 06-03-T2 | 06-03 | 2 | LIGHT-06 | tsc + grep | `npx tsc --noEmit` && `grep -c "sunHoursForDisplay" src/components/PlantHealthDetail.tsx` === 0 && `grep -c "getLightLabel"` === 2 | ✅ MVP-live | ⬜ |
| 06-04-T1 | 06-04 | 2 | LIGHT-06, LIGHT-07, SEASON-05 | tsc + grep | `npx tsc --noEmit` && 7 grep counts: getSeasonalInterval, getWaterSeason, getLightLabel, plantDetail.seasonBadge, lightLabel, seasonQualifier, em-dash all present; legacy waterEvery/sunHours t() calls removed | ✅ MVP-live | ⬜ |
| 06-05-T1 | 06-05 | 2 | LIGHT-06, LIGHT-07 | tsc + grep | `npx tsc --noEmit` && `grep -c "t('plantDetailModal.hoursPerDay'"` === 0 && `grep -c "getLightLabel"` === 2 | ⚠️ MVP-dead (EXPLORE_TAB false) | ⬜ |
| 06-05-T2 | 06-05 | 2 | LIGHT-06, LIGHT-07 | tsc + grep | `npx tsc --noEmit` && `grep -c "plant.sunHours" src/components/PlantDatabaseCard.tsx` === 0 && `grep -c "useTranslation"` >= 2 | ⚠️ MVP-dead (EXPLORE_TAB false) | ⬜ |
| 06-06-T1 | 06-06 | 3 | UX-03 | tsc + grep + smoke regression | `npx tsc --noEmit` && `grep -c "soilCheckSilentPlants"` >= 4 && `grep -c "soilCheckSilentPlants.length === 0"` === 1 (all-caught-up guard) && `grep -c "🤚"` >= 1 && `grep -c "today.soilCheckEmptyRow"` === 1 | ✅ MVP-live | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*MVP-dead = surface only mounted via ExploreScreen which is gated behind `Features.EXPLORE_TAB === false`; structural correctness verified by tsc + grep + smoke; manual UAT deferred to V1.1 flag flip.*

---

## Wave 0 Requirements

- [x] `scripts/smoke-phase06.mjs` — pure-utility smoke runner for `getLightLabel`, `getSeasonalInterval`, i18n parity, defensive ladder. Single-compile-path policy carries from Phases 4/5. **Created by Plan 06-01 Task 3, extended by Plan 06-02 Task 3.**
- [x] No new framework install — typescript already a project dep; node mjs runner sufficient.

*Visual rendering (RN screen + modal output) is verified manually in Expo Go per the Manual-Only table below — there is no React Native test renderer in this project (CLAUDE.md: "No test framework is set up").*

---

## Manual-Only Verifications

> Required complement to automated tests because the project has no RN test renderer.

| Behavior | Requirement | Why Manual | Test Instructions | Plan |
|----------|-------------|------------|-------------------|------|
| Light-level label renders correctly on PlantCard, PlantDetailModal, MyPlantDetailModal, PlantHealthDetail in EN and ES | LIGHT-06 | No RN renderer; visual placement matters | Open Expo Go on iOS simulator and Android emulator. For each surface, open a plant in each `lightLevel` × locale combination. Confirm label reads `Luz brillante indirecta` (ES) / `Bright indirect light` (EN), no `Xh sol` legacy copy anywhere. | 06-03 + 06-04 (live MVP); 06-05 deferred (V1.1) |
| Outdoor plants (typeId in `exterior`,`aromaticas`,`huerta`,`frutales`) show outdoor-context labels | LIGHT-07 | Visual; needs typeId-aware switching at runtime | Add a "tomate" (huerta) and a "monstera" (interior). Open both in MyPlantDetailModal. Confirm tomate sun pill shows `Sol pleno`/`Semi sombra` family, monstera shows indoor `Luz brillante indirecta` family. | 06-04 (live MVP); 06-05 deferred |
| Season badge inline with next-water row, em-dash separator, secondary color | SEASON-05 | Visual + style | Open MyPlantDetailModal; confirm water pill reads `Cada 5 días — temporada cálida`. Toggle SeasonDevSelector to a tropical-latitude plant (lat 0) and confirm row reads `Cada 5 días — trópico`. Verify the season qualifier text is visually muted (textSecondary). | 06-04 |
| Watering-mode badge always visible on PlantCard with current-season interval for `fixed`, fixed string for `soil_check` | UX-02 | Visual + interval correctness varies by season | Open PlantsScreen. Confirm a non-cactus shows `💧 Cada Nd` where N matches current-season interval (Apr in BA shows cold; Apr in NY shows warm). Confirm a cactus shows `🤚 Por chequeo`. Test with SeasonDevSelector flipping season and confirm fixed-mode badge interval flips. | 06-03 |
| Soil-check empty-state row shows on Hoy when soil_check plant has no task today; "all caught up" does NOT fire if such plants exist | UX-03 | Visual + empty-state interaction with existing TodayScreen logic | Add only a cactus (soil_check). Open Hoy on a non-check-in day. Confirm row reads `Tu Cactus está en modo chequeo. Te avisamos en N días.` Confirm celebration empty state does NOT render. Add a non-cactus with a task today; confirm cactus row still shows alongside the task. Toggle the cactus's lastWatered to make today its check-in day; confirm cactus moves to PlantCard `check_soil` task and disappears from soil-check row section. | 06-06 |

---

## Validation Sign-Off

- [x] All tasks have automated verify OR are listed in Manual-Only table above (12/12 tasks have automated checks; 5 visual behaviors in Manual-Only table)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task ends in `<verify><automated>`)
- [x] Wave 0 (`scripts/smoke-phase06.mjs`) covers helper utility behavior (Plans 06-01 + 06-02 ship the runner)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (full suite ~15s including Phase 4/5 regression)
- [x] `nyquist_compliant: true` set in frontmatter (planner filled per-task map; Wave 0 covered by Plan 06-01 + 06-02)

**Approval:** planner-filled — ready for execute-phase.
