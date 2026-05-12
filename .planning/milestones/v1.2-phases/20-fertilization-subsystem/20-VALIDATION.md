---
phase: 20
slug: fertilization-subsystem
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `20-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no Jest/Vitest) — three-tier smoke-runner pattern (CommonJS file-content asserts via `fs` + regex; optional `ts.transpileModule` for behavioral helpers per Phase 14-00 / 19-00 precedent) |
| **Config file** | n/a — runner is `scripts/smoke-phase20.cjs` (self-contained, forked from `scripts/smoke-phase19.cjs`) |
| **Quick run command** | `npm run smoke:phase20` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20` |
| **Estimated runtime** | ~3–5 sec quick · ~10 sec full |

---

## Sampling Rate

- **After every task commit:** `npx tsc --noEmit && npm run smoke:phase20` (~3–5 s)
- **After every plan wave:** Full suite — adds `npm run check:i18n-keys` + `npm run smoke:phase18` + `npm run smoke:phase19` (~10 s total)
- **Before `/gsd:verify-work`:** Full suite green + manual device-test checklist (Blocks A–E pattern, mirroring `19-07-SUMMARY.md`) closed
- **Max feedback latency:** 10 seconds for the full suite

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-00-01 | 00 | 0 | scaffold | unit (file-content) | `node scripts/smoke-phase20.cjs` | ❌ W0 | ⬜ pending |
| 20-00-02 | 00 | 0 | scaffold (npm script) | unit (file-content) | `node -e "require('./package.json').scripts['smoke:phase20']"` | ❌ W0 | ⬜ pending |
| 20-00-03 | 00 | 0 | scaffold (.gitignore) | unit (file-content) | `grep -q '.tmp-phase20' .gitignore` | ❌ W0 | ⬜ pending |
| 20-00-04 | 00 | 0 | scaffold (i18n skeleton) | unit (file-content) | `node scripts/smoke-phase20.cjs` (W0.scaffold.i18n.* sentinels) | ❌ W0 | ⬜ pending |
| 20-00-05 | 00 | 0 | scaffold (FertilizeCard skeleton) | unit (file-content) | `node scripts/smoke-phase20.cjs` (W0.scaffold.FertilizeCard sentinel) + `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 20-00-06 | 00 | 0 | scaffold (plantLogic helper skeletons) | unit (file-content + tsc) | `node scripts/smoke-phase20.cjs` (W0.scaffold.helpers.* sentinels) + `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 20-01-01 | 01 | 1 | FERT-01 | unit (file-content + tsc) | `node scripts/smoke-phase20.cjs` (FERT-01.types.Plant-fertilizeSchedule) + `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | FERT-02 | unit (file-content + tsc) | `node scripts/smoke-phase20.cjs` (FERT-02.types.PlantDBEntry-fertilizer) + `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 1 | FERT-04 | unit (smoke transpileModule) | `node scripts/smoke-phase20.cjs` (FERT-04.helper.getNextFertilizeDate-* sentinels) | ✅ | ⬜ pending |
| 20-02-02 | 02 | 1 | FERT-04 | unit (smoke transpileModule) | `node scripts/smoke-phase20.cjs` (FERT-04.helper.cold-season-null sentinel) | ✅ | ⬜ pending |
| 20-02-03 | 02 | 1 | FERT-04 | unit (smoke transpileModule) | `node scripts/smoke-phase20.cjs` (FERT-04.helper.catch-up-clip sentinel) | ✅ | ⬜ pending |
| 20-03-01 | 03 | 2 | FERT-03 | unit (file-content + tsc) | `node scripts/smoke-phase20.cjs` (FERT-03.plantLogic.getTasksForDay-fertilize) + `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-03-02 | 03 | 2 | FERT-03 | unit (file-content + tsc) | `node scripts/smoke-phase20.cjs` (FERT-03.scheduler.body-line-fertilize) + `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-03-03 | 03 | 2 | FERT-03 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-03.DayDetail+Modal+MonthCalendar.fertilize-discriminator sentinels) | ✅ | ⬜ pending |
| 20-03-04 | 03 | 2 | FERT-03 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-03.TaskButton.fertilize-render sentinel) | ✅ | ⬜ pending |
| 20-03-05 | 03 | 2 | FERT-03 / SC-5 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-03.plantHealth.no-fertilize-penalty sentinel — defensive no-op) | ✅ | ⬜ pending |
| 20-04-01 | 04 | 3 | FERT-06 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-06.PlantCard.fertilize-task-row sentinel) | ✅ | ⬜ pending |
| 20-04-02 | 04 | 3 | FERT-06 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-06.MyPlantDetailModal.two-column-layout + initialExpanded prop sentinels) | ✅ | ⬜ pending |
| 20-05-01 | 05 | 3 | FERT-05 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-05.SettingsScreen.fertilize-toggle + default-OFF sentinels) | ✅ | ⬜ pending |
| 20-05-02 | 05 | 3 | FERT-05 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-05.scheduler.notifSettings-gate sentinel) | ✅ | ⬜ pending |
| 20-06-01 | 06 | 4a | FERT-07 | unit (file-content + i18n parity) | `node scripts/smoke-phase20.cjs` (FERT-07.batchA.entries + locale-parity sentinels) + `npm run check:i18n-keys` | ✅ | ⬜ pending |
| 20-07-01 | 07 | 4b | FERT-07 | unit (file-content + i18n parity) | `node scripts/smoke-phase20.cjs` (FERT-07.batchB.entries + locale-parity sentinels) + `npm run check:i18n-keys` | ✅ | ⬜ pending |
| 20-08-01 | 08 | 4c | FERT-07 | unit (file-content + i18n parity) | `node scripts/smoke-phase20.cjs` (FERT-07.batchC.entries + locale-parity sentinels) + `npm run check:i18n-keys` | ✅ | ⬜ pending |
| 20-09-01 | 09 | 5 | FERT-07 | unit (file-content) | `node scripts/smoke-phase20.cjs` (FERT-07.checkScript.fertilizer-conditional-extension sentinel) + `npm run check:i18n-keys` | ✅ | ⬜ pending |
| 20-10-01 | 10 | 6 | FERT-01..07 | manual (device test) | Manual checklist Blocks A–E in `20-10-PLAN.md` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase20.cjs` — three-tier runner (PASS scaffold + SKIP→PASS placeholders for FERT-01..07 + STRICT cross-phase regression sentinels for Phase 18 PlantCard 5-element layout and Phase 19 TOX-03 / TOX-04 / TOX-06)
- [ ] `package.json` — add `"smoke:phase20": "node scripts/smoke-phase20.cjs"`
- [ ] `.gitignore` — add `scripts/.tmp-phase20/` (mirrors Phase 14-00 / 15-00 / 19-00 pattern, needed for ts.transpileModule behavioral asserts in Plan 20-02)
- [ ] `src/i18n/locales/{en,es}/common.json` — skeleton keys:
  - `tasks.fertilize` ("Fertilize {{name}}" / "Fertilizar {{name}}")
  - `notifications.fertilize` ("Fertilize:" / "Fertilizá:")
  - `plantCard.fertilize` ("Fertilize" / "Fertilizá")
  - `plantDetailModal.water` ("Water" / "Regar") — left card header
  - `plantDetailModal.fertilize` ("Fertilize" / "Fertilizar") — right card header
  - `plantDetailModal.fertilizeEvery` ("Fertilize every {{days}} days ({{season}})" / "Fertilizá cada {{days}} días ({{season}})")
  - `plantDetailModal.fertilizeDormant` ("Dormant — no fertilizer needed in cold season" / "Dormante — no fertilizar en frío")
  - `settings.fertilizeReminders` ("Fertilize reminders" / "Recordatorios de fertilización")
  - `settings.fertilizeRemindersSubtitle` ("Get notified when plants need fertilizing" / "Te avisamos cuándo abonar tus plantas")
- [ ] `src/components/plant-detail/FertilizeCard.tsx` — skeleton component file (exports `FertilizeCard` returning `null` until Plan 20-04 lands real implementation)
- [ ] `src/utils/plantLogic.ts` — skeleton helper exports `getSeasonalFertilizeInterval` and `getNextFertilizeDate` returning `null` until Plan 20-02 lands real implementation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two-column water/fertilize layout renders side-by-side, height-equalized | FERT-06 | RN flexbox layout requires actual rendering engine | Open MyPlantDetailModal on a plant with both water + fertilize content; visually confirm cards are flush-top, equal height; then open one with only water → confirm full-width fallback |
| FertilizeCard tap-to-expand 180ms animation feels snappy | FERT-06 | Subjective UX — animation perception | Tap fertilize card on iOS + Android; chevron rotates 0°→90°; deep content (recipes) reveals smoothly without jank |
| `initialExpanded='fertilize'` auto-expand does not conflict with `initialSection='que-hacer'` scroll | FERT-06 | Race condition risk on slow devices | From PlantCard's fertilize-due-today indicator, tap → modal opens scrolled to "¿Qué hacer?" AND fertilize card is already expanded on arrival |
| PlantCard fertilize TaskButton tap does not fire long-press menu OR swipe (Phase 18 Gesture.Race coexistence) | FERT-06 | Multi-touch gesture composition is OS-level | Tap fertilize button on PlantCard; only mark-done fires; long-press still opens Phase 18 menu; horizontal swipe still triggers Phase 18 swipe action |
| Fertilize push notification appears in morning body when toggle ON | FERT-05 | Requires real device + notification permission grant | Toggle ON Fertilize reminders; advance device clock to morning reminder time on a day with a fertilize-due plant; confirm body line includes "Fertilizá: <plant>" |
| Voseo register feels natural across all 118 catalog entries | FERT-07 | Native-speaker quality judgment | Pre-commit grep regex baseline (no tú/tu/tienes/debes/usted/su); Argentine ES-locale review of fertilizer recommendations sample |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (smoke runner, npm script, .gitignore, i18n skeleton, FertilizeCard skeleton, helper skeletons)
- [ ] No watch-mode flags
- [ ] Feedback latency < 10 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
