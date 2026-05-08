#!/usr/bin/env node
// scripts/smoke-phase18.cjs
// Phase 18 PlantCard Cleanup + Mood Emoji smoke runner.
// CommonJS (.cjs). Wave 0 ships harness + scaffold PASSes + SKIP placeholders for CARD-01..05 + GAM-03/04 + Toast.
// Later plans flip SKIPs to PASSes by landing concrete code/JSX; the runner itself is NOT modified after Wave 0.
//
// Phase 18 is JSX-restructure only — NO ts.transpileModule, NO Module._resolveFilename intercept,
// NO runtime stubs (the .tmp-phase18/ slot is reserved by .gitignore for convention only).
//
// Usage:
//   node scripts/smoke-phase18.cjs

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ─── Assertion harness (mirrors Phase 15/16/17) ───
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

// ─── W0.scaffold (PASS at Wave 0 baseline) ───
assert(readSafe('scripts/smoke-phase18.cjs') !== null, 'W0.scaffold.runner-self-exists');
assert(readSafe('src/components/Toast.tsx') !== null, 'W0.scaffold.Toast-file-exists');

const componentsIndex = readSafe('src/components/index.ts') || '';
assert(componentsIndex.includes("export { Toast } from './Toast'"), 'W0.scaffold.Toast-reexport');

// i18n parity — load EN + ES common.json and verify every Phase 18 key exists in BOTH.
const enCommonRaw = readSafe('src/i18n/locales/en/common.json');
const esCommonRaw = readSafe('src/i18n/locales/es/common.json');
let enCommon = null, esCommon = null;
try { enCommon = enCommonRaw ? JSON.parse(enCommonRaw) : null; } catch (_) {}
try { esCommon = esCommonRaw ? JSON.parse(esCommonRaw) : null; } catch (_) {}

const PHASE_18_I18N_KEYS = [
  'plantCard.menu.favorite',
  'plantCard.menu.unfavorite',
  'plantCard.menu.delete',
  'plantCard.menu.edit',
  'plantCard.menuSheet.title',
  'plantCard.menuSheet.cancel',
  'plantCard.deleteHint',
  'plantCard.undoToast.deletedMessage',
  'plantCard.undoToast.undoLabel',
  'plantCard.moodA11y.excellent',
  'plantCard.moodA11y.good',
  'plantCard.moodA11y.warning',
  'plantCard.moodA11y.danger',
];
PHASE_18_I18N_KEYS.forEach(k => {
  assert(enCommon !== null && getNested(enCommon, k) !== undefined, 'W0.scaffold.i18n.en.' + k);
  assert(esCommon !== null && getNested(esCommon, k) !== undefined, 'W0.scaffold.i18n.es.' + k);
});

// ─── Read source files used by Wave 1+ assertions ONCE ───
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const plantsScreenSrc = readSafe('src/screens/PlantsScreen.tsx') || '';
const todayScreenSrc = readSafe('src/screens/TodayScreen.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
const toastSrc = readSafe('src/components/Toast.tsx') || '';

// ─── CARD-01 (swipe-to-delete) — SKIP at Wave 0, PASS after Plan 03 ───
assertSkippable(() => {
  if (plantCardSrc.includes('Gesture.Pan')) {
    return plantCardSrc.includes('Gesture.Pan') && !plantCardSrc.includes("Alert.alert(\n        t('plantCard.deletePlant')");
  }
  return undefined;
}, 'CARD-01.swipe.gestureRef-and-alert-removed');

assertSkippable(() => {
  if (plantCardSrc.includes('GestureDetector')) return plantCardSrc.includes('GestureDetector');
  return undefined;
}, 'CARD-01.swipe.gestureDetector-wraps-card');

assertSkippable(() => {
  if (plantCardSrc.includes('activeOffsetX')) return /activeOffsetX\(\[-15,\s*15\]\)/.test(plantCardSrc);
  return undefined;
}, 'CARD-01.swipe.activeOffsetX-15');

assertSkippable(() => {
  if (plantCardSrc.includes('failOffsetY')) return /failOffsetY\(\[-10,\s*10\]\)/.test(plantCardSrc);
  return undefined;
}, 'CARD-01.swipe.failOffsetY-10');

assertSkippable(() => !plantCardSrc.includes('🗑️') ? true : undefined, 'CARD-01.swipe.trash-emoji-removed');

// ─── CARD-02 (long-press menu) — SKIP at Wave 0 ───
assertSkippable(() => plantCardSrc.includes('Gesture.LongPress') ? true : undefined, 'CARD-02.longPress.gestureRef');
assertSkippable(() => /Gesture\.Race\(/.test(plantCardSrc) ? true : undefined, 'CARD-02.longPress.race-composition');
assertSkippable(() => plantsScreenSrc.includes('BottomSheetModal') && plantsScreenSrc.includes('useDismissOnPaywall') ? true : undefined, 'CARD-02.longPress.bottomSheet-on-PlantsScreen');
assertSkippable(() => todayScreenSrc.includes('BottomSheetModal') ? true : undefined, 'CARD-02.longPress.bottomSheet-on-TodayScreen');

// ─── CARD-03 (tip relocation + 5-element budget) — SKIP at Wave 0 ───
assertSkippable(() => !plantCardSrc.includes('styles.tip') ? true : undefined, 'CARD-03.tip-block-removed-from-PlantCard');
assertSkippable(() => modalSrc.includes('styles.relocatedTip') || /translatedEntry\?\.tip\s*\?\?/.test(modalSrc) ? true : undefined, 'CARD-03.tip-relocated-to-modal');
assertSkippable(() => !plantCardSrc.includes("plant.favorite ? '❤️' : '🤍'") ? true : undefined, 'CARD-03.favorite-heart-removed-from-card-face');

// ─── CARD-04 (first-render affordance hint) — SKIP at Wave 0 ───
assertSkippable(() => plantsScreenSrc.includes('@plantcard_swipe_discovered') ? true : undefined, 'CARD-04.affordanceHint.async-storage-flag');
assertSkippable(() => /firstCardHint|swipeHint|showSwipeHint/i.test(plantsScreenSrc) ? true : undefined, 'CARD-04.affordanceHint.state-or-prop');

// ─── CARD-05 (haptic at threshold) — SKIP at Wave 0 ───
assertSkippable(() => /runOnJS\(triggerHaptic\)\(\s*'impactMedium'\s*\)/.test(plantCardSrc) ? true : undefined, 'CARD-05.haptic.runOnJS-impactMedium');
assertSkippable(() => /hapticFired|HAPTIC_FIRED/.test(plantCardSrc) ? true : undefined, 'CARD-05.haptic.one-shot-guard');

// ─── GAM-03 (mood emoji always visible) — SKIP at Wave 0 ───
assertSkippable(() => plantCardSrc.includes("'🌱'") && plantCardSrc.includes("'😊'") && plantCardSrc.includes("'😐'") && plantCardSrc.includes("'😟'") ? true : undefined, 'GAM-03.moodEmoji.all-four-glyphs-present');
assertSkippable(() => /moodEmojiByLevel|moodEmoji\[/.test(plantCardSrc) ? true : undefined, 'GAM-03.moodEmoji.level-mapping-table');
assertSkippable(() => plantCardSrc.includes('setShowHealthDetail(true)') ? true : undefined, 'GAM-03.moodEmoji.tap-opens-existing-PlantHealthDetail');

// ─── GAM-04 (PlantHealthBadge removal scoped to PlantCard) — SKIP at Wave 0, PASS after Plan 03 ───
assertSkippable(() => !plantCardSrc.includes("import { PlantHealthBadge }") ? true : undefined, 'GAM-04.healthBadge.import-removed-from-PlantCard');
assertSkippable(() => !plantCardSrc.includes('showHealthBadge') ? true : undefined, 'GAM-04.healthBadge.score-gate-removed');
// STRICT — modal usage MUST remain.
assert(modalSrc.includes('PlantHealthBadge'), 'GAM-04.healthBadge.MODAL-USAGE-PRESERVED');
// STRICT — index re-export MUST remain.
assert(componentsIndex.includes("export { PlantHealthBadge }"), 'GAM-04.healthBadge.INDEX-REEXPORT-PRESERVED');
// STRICT — file MUST remain.
assert(readSafe('src/components/PlantHealthBadge.tsx') !== null, 'GAM-04.healthBadge.FILE-NOT-DELETED');

// ─── Toast (Plan 02 contract) — SKIP at Wave 0 ───
assertSkippable(() => /interface ToastProps/.test(toastSrc) ? true : undefined, 'Toast.props.interface-defined');
assertSkippable(() => /useSharedValue|useAnimatedStyle/.test(toastSrc) ? true : undefined, 'Toast.impl.uses-reanimated');
assertSkippable(() => /accessibilityLiveRegion/.test(toastSrc) ? true : undefined, 'Toast.a11y.liveRegion');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 02-04 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
}
console.log(`[Phase 18 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
