#!/usr/bin/env node
// scripts/smoke-phase20.cjs
// Phase 20 Fertilization Subsystem smoke runner.
// CommonJS (.cjs). Wave 0 ships harness + scaffold PASSes + SKIP placeholders for FERT-01..07
// + STRICT cross-phase regression sentinels for Phase 18 (PlantCard 5-element layout) and
// Phase 19 (TOX-03 / TOX-04 / TOX-06).
//
// Later plans flip SKIPs to PASSes by landing concrete code/JSX/data; the runner itself is NOT
// modified after Wave 0 (Phase 14-00 / 19-00 precedent).
//
// Phase 20 is mostly file-content + JSX additions — file-content asserts via readFileSync + regex
// are sufficient at Wave 0. Plan 20-02 may add ts.transpileModule behavioral asserts via stubs in
// scripts/.tmp-phase20/ (gitignored).
//
// Usage:
//   node scripts/smoke-phase20.cjs

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ─── Assertion harness (verbatim from Phase 19) ───
let pass = 0, fail = 0, skip = 0;
const errors = [], skips = [];
function assert(cond, label) {
  if (cond) pass++;
  else { fail++; errors.push(`FAIL: ${label}`); }
}
function assertSkippable(condFn, label) {
  try {
    const cond = condFn();
    if (cond === undefined) { skip++; skips.push(`SKIP: ${label}`); }
    else if (cond) pass++;
    else { fail++; errors.push(`FAIL: ${label}`); }
  } catch (e) { skip++; skips.push(`SKIP: ${label} (threw: ${e.message})`); }
}
function readSafe(relPath) {
  const abs = path.resolve(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}
function getNested(obj, dotted) {
  return dotted.split('.').reduce((a, b) => (a == null ? a : a[b]), obj);
}

// ─── Read source files ONCE ───
const typesSrc = readSafe('src/types/index.ts') || '';
const plantLogicSrc = readSafe('src/utils/plantLogic.ts') || '';
const schedulerSrc = readSafe('src/utils/notificationScheduler.ts') || '';
const plantHealthSrc = readSafe('src/utils/plantHealth.ts') || '';
const dayDetailSrc = readSafe('src/components/DayDetail.tsx') || '';
const dayDetailModalSrc = readSafe('src/components/DayDetailModal.tsx') || '';
const monthCalendarSrc = readSafe('src/components/MonthCalendar.tsx') || '';
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
const fertilizeCardSrc = readSafe('src/components/plant-detail/FertilizeCard.tsx') || '';
const settingsScreenSrc = readSafe('src/screens/SettingsScreen.tsx') || '';
const dbSrc = readSafe('src/data/plantDatabase.ts') || '';
const enCommonSrc = readSafe('src/i18n/locales/en/common.json');
const esCommonSrc = readSafe('src/i18n/locales/es/common.json');

// ─── W0.scaffold (PASS at Wave 0 baseline once Tasks 2 + 3 of THIS plan land) ───
assert(readSafe('scripts/smoke-phase20.cjs') !== null, 'W0.scaffold.runner-self-exists');
assert(typesSrc.includes('fertilizeSchedule?:'), 'W0.scaffold.types.Plant-fertilizeSchedule');
assert(typesSrc.includes('fertilizeIntervalWarm?:'), 'W0.scaffold.types.PlantDBEntry-fertilizeIntervalWarm');
assert(typesSrc.includes('fertilizeIntervalCold?:'), 'W0.scaffold.types.PlantDBEntry-fertilizeIntervalCold');
assert(/type:\s*['"]industrial['"]\s*\|\s*['"]homemade['"]\s*\|\s*['"]both['"]/.test(typesSrc), 'W0.scaffold.types.PlantDBEntry-fertilizer');
assert(typesSrc.includes('"fertilize"'), 'W0.scaffold.types.Task-discriminator-extended');
assert(typesSrc.includes('fertilizeReminders?:'), 'W0.scaffold.types.NotificationSettings-fertilizeReminders');
assert(readSafe('src/components/plant-detail/FertilizeCard.tsx') !== null, 'W0.scaffold.FertilizeCard.file-exists');
assert(plantLogicSrc.includes('export function getSeasonalFertilizeInterval'), 'W0.scaffold.helpers.getSeasonalFertilizeInterval-exported');
assert(plantLogicSrc.includes('export function getNextFertilizeDate'), 'W0.scaffold.helpers.getNextFertilizeDate-exported');

// i18n skeleton (EN + ES parity)
let enJSON = {}, esJSON = {};
try { enJSON = enCommonSrc ? JSON.parse(enCommonSrc) : {}; } catch (_) {}
try { esJSON = esCommonSrc ? JSON.parse(esCommonSrc) : {}; } catch (_) {}

assert(getNested(enJSON, 'tasks.fertilize') && getNested(esJSON, 'tasks.fertilize'), 'W0.scaffold.i18n.tasks.fertilize-parity');
assert(getNested(enJSON, 'notifications.fertilize') && getNested(esJSON, 'notifications.fertilize'), 'W0.scaffold.i18n.notifications.fertilize-parity');
assert(getNested(enJSON, 'plantCard.fertilize') && getNested(esJSON, 'plantCard.fertilize'), 'W0.scaffold.i18n.plantCard.fertilize-parity');
assert(getNested(enJSON, 'plantDetailModal.water') && getNested(esJSON, 'plantDetailModal.water'), 'W0.scaffold.i18n.plantDetailModal.water-parity');
assert(getNested(enJSON, 'plantDetailModal.fertilize') && getNested(esJSON, 'plantDetailModal.fertilize'), 'W0.scaffold.i18n.plantDetailModal.fertilize-parity');
assert(getNested(enJSON, 'plantDetailModal.fertilizeEvery') && getNested(esJSON, 'plantDetailModal.fertilizeEvery'), 'W0.scaffold.i18n.plantDetailModal.fertilizeEvery-parity');
assert(getNested(enJSON, 'plantDetailModal.fertilizeDormant') && getNested(esJSON, 'plantDetailModal.fertilizeDormant'), 'W0.scaffold.i18n.plantDetailModal.fertilizeDormant-parity');
assert(getNested(enJSON, 'settings.fertilizeReminders') && getNested(esJSON, 'settings.fertilizeReminders'), 'W0.scaffold.i18n.settings.fertilizeReminders-parity');
assert(getNested(enJSON, 'settings.fertilizeRemindersSubtitle') && getNested(esJSON, 'settings.fertilizeRemindersSubtitle'), 'W0.scaffold.i18n.settings.fertilizeRemindersSubtitle-parity');

// ─── FERT-02 catalog content — SKIP at Wave 0, PASS as Plans 20-06/07/08 land ───
assertSkippable(() => {
  const matches = (dbSrc.match(/fertilizeIntervalWarm:\s*\d+/g) || []).length;
  if (matches === 0) return undefined;
  return matches >= 100;
}, 'FERT-02.catalog.fertilizeIntervalWarm-coverage');

// ─── FERT-03 5-site discriminator sweep — SKIP at Wave 0, PASS after Plan 20-03 ───
assertSkippable(() => plantLogicSrc.includes('type: "fertilize"') || undefined, 'FERT-03.plantLogic.emit-branch');
assertSkippable(() => /case "fertilize"/.test(dayDetailSrc) || undefined, 'FERT-03.dayDetail.discriminator');
assertSkippable(() => /task\.type === ['"]fertilize['"]/.test(dayDetailModalSrc) || undefined, 'FERT-03.dayDetailModal.discriminator');
assertSkippable(() => monthCalendarSrc.includes('hasFertilize') || undefined, 'FERT-03.monthCalendar.dot-indicator');
assertSkippable(() => schedulerSrc.includes('fertilizeTasks') || undefined, 'FERT-03.scheduler.body-filter');
assertSkippable(() => {
  const taskButtonSrc = readSafe('src/components/TaskButton.tsx') || '';
  return /case "fertilize"|task\.type === ['"]fertilize['"]/.test(taskButtonSrc) || /fertilize/i.test(taskButtonSrc) || undefined;
}, 'FERT-03.TaskButton.fertilize-render');

// ─── FERT-04 cadence math — SKIP at Wave 0, PASS after Plan 20-02 lands real impl ───
assertSkippable(() => /export function getNextFertilizeDate[^]*?\bcatalogEntry\b/.test(plantLogicSrc) && !plantLogicSrc.includes('return null; // skeleton') || undefined, 'FERT-04.helper.getNextFertilizeDate-real-impl');
assertSkippable(() => /export function getSeasonalFertilizeInterval[^]*?\bseason\b/.test(plantLogicSrc) && !plantLogicSrc.includes('return null; // skeleton') || undefined, 'FERT-04.helper.getSeasonalFertilizeInterval-real-impl');
assertSkippable(() => /season === ['"]cold['"][^]*?return null|fertilizeIntervalCold/.test(plantLogicSrc) || undefined, 'FERT-04.helper.cold-season-null');
assertSkippable(() => /while\s*\(\s*next\s*<\s*today\s*\)\s*next\s*=\s*addDays/.test(plantLogicSrc) || undefined, 'FERT-04.helper.catch-up-clip');

// ─── FERT-05 Settings toggle + opt-in gate — SKIP at Wave 0, PASS after Plan 20-05 ───
assertSkippable(() => settingsScreenSrc.includes('fertilizeReminders') || undefined, 'FERT-05.settings.toggle-rendered');
assertSkippable(() => /notifSettings\?\.fertilizeReminders\s*===\s*true|notifSettings\.fertilizeReminders\s*===\s*true/.test(schedulerSrc) || undefined, 'FERT-05.scheduler.opt-in-gate');
assertSkippable(() => {
  const useNotifSrc = readSafe('src/hooks/useNotifications.ts') || '';
  return /fertilizeReminders:\s*false/.test(useNotifSrc) || undefined;
}, 'FERT-05.useNotifications.default-OFF');

// ─── FERT-06 PlantCard + modal two-column — SKIP at Wave 0, PASS after Plan 20-04 ───
assertSkippable(() => plantCardSrc.includes('onFertilizeDone') || undefined, 'FERT-06.PlantCard.fertilize-task-row');
assertSkippable(() => modalSrc.includes('careCardsRow') || modalSrc.includes('FertilizeCard') || undefined, 'FERT-06.MyPlantDetailModal.two-column-layout');
assertSkippable(() => /initialExpanded\?:\s*['"]fertilize['"]|initialExpanded\?:\s*'fertilize'/.test(modalSrc) || undefined, 'FERT-06.MyPlantDetailModal.initialExpanded-prop');
assertSkippable(() => fertilizeCardSrc.includes('useSharedValue') && fertilizeCardSrc.includes('useDerivedValue') || undefined, 'FERT-06.FertilizeCard.reanimated-primitives');
assertSkippable(() => /COLLAPSE_DURATION\s*=\s*180|duration:\s*180/.test(fertilizeCardSrc) || undefined, 'FERT-06.FertilizeCard.180ms-tuning');

// ─── FERT-07 i18n parity gate extension — SKIP at Wave 0, PASS after Plan 20-09 ───
assertSkippable(() => {
  const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';
  if (checkScript.includes('fertilizer.industrialRecommendation') || checkScript.includes('fertilizer.homemadeRecommendation')) return true;
  return undefined;
}, 'FERT-07.checkScript.fertilizer-conditional-extension');

// ─── Cross-phase regression (STRICT — never SKIP) ───
// Phase 18 GAM-04 — PlantHealthBadge preserved in modal
assert(modalSrc.includes('PlantHealthBadge'), 'CROSS.GAM-04.healthBadge.MODAL-USAGE-PRESERVED');
assert(readSafe('src/components/PlantHealthBadge.tsx') !== null, 'CROSS.GAM-04.healthBadge.FILE-NOT-DELETED');
// Phase 18 CARD-01 — Gesture.Pan/GestureDetector preserved in PlantCard
assert(/Gesture\.Pan|GestureDetector/.test(plantCardSrc), 'CROSS.CARD-01.plantcard.gesture-pan-preserved');
// Phase 18 GAM-03 — mood emoji preserved (5-element budget)
assert(plantCardSrc.includes('moodEmoji') && plantCardSrc.includes('moodBadge'), 'CROSS.GAM-03.plantcard.mood-emoji-preserved');
// Phase 18 Toast primitive preserved
assert(readSafe('src/components/Toast.tsx') !== null, 'CROSS.Toast.FILE-NOT-DELETED');
// Phase 19 TOX-03 — PetToxicityBadge usage in PlantCard preserved
assert(plantCardSrc.includes('PetToxicityBadge'), 'CROSS.TOX-03.plantcard.toxicity-badges-preserved');
// Phase 19 TOX-04 — Mascotas section preserved in modal
assert(modalSrc.includes('MascotasContent') || modalSrc.includes('emoji="🐾"'), 'CROSS.TOX-04.modal.mascotas-section-preserved');
// Phase 19 TOX-04 — initialSection prop preserved on modal
assert(modalSrc.includes('initialSection?: ModalSectionId'), 'CROSS.TOX-04.modal.initialSection-preserved');
// Phase 19 TOX-06 — petToxicity.symptoms parity gate preserved in check script
const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';
assert(/petToxicity[^]*?symptoms/.test(checkScript), 'CROSS.TOX-06.checkScript.symptoms-extension-preserved');
// Phase 20 health-axis no-op (Success Criterion 5) — plantHealth MUST NOT mention 'fertilize'
assert(!plantHealthSrc.includes("'fertilize'") && !plantHealthSrc.includes('"fertilize"'), 'CROSS.health-no-fertilize-axis');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 20-01..09 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
}
console.log(`[Phase 20 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
