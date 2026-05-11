#!/usr/bin/env node
// scripts/smoke-phase21.cjs
// Phase 21 Plant Journal smoke runner.
// CommonJS (.cjs). Wave 0 ships harness + scaffold PASSes + SKIP placeholders for JOURNAL-01..05
// + STRICT cross-phase regression sentinels for Phase 18 (PlantCard 5-element layout),
// Phase 19 (TOX-03 / TOX-04 / TOX-06), and Phase 20 (FERT-03 / FERT-06 / FERT-07).
//
// Later plans flip SKIPs to PASSes by landing concrete code/JSX/data; the runner itself is NOT
// modified after Wave 0 (Phase 14-00 / 19-00 / 20-00 precedent).
//
// Phase 21 is file-content + JSX additions + new component skeletons — file-content asserts via
// readFileSync + regex are sufficient at Wave 0. Plan 21-02 may add ts.transpileModule behavioral
// asserts via stubs in scripts/.tmp-phase21/ (gitignored).
//
// Usage:
//   node scripts/smoke-phase21.cjs

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ─── Assertion harness (verbatim from Phase 20 lines 23-44) ───
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
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
// Phase 21 new source files (skeletons land in Task 2 of THIS plan)
const journalServiceSrc = readSafe('src/services/journalService.ts') || '';
const journalSectionSrc = readSafe('src/components/plant-detail/JournalSection.tsx') || '';
const journalQuickAddSrc = readSafe('src/components/plant-detail/JournalQuickAddSheet.tsx') || '';
const journalEntryRowSrc = readSafe('src/components/plant-detail/JournalEntryRow.tsx') || '';
const useStorageSrc = readSafe('src/hooks/useStorage.tsx') || '';
const plantsScreenSrc = readSafe('src/screens/PlantsScreen.tsx') || '';
const todayScreenSrc = readSafe('src/screens/TodayScreen.tsx') || '';
const enCommonSrc = readSafe('src/i18n/locales/en/common.json') || '{}';
const esCommonSrc = readSafe('src/i18n/locales/es/common.json') || '{}';
let enCommon = {}, esCommon = {};
try { enCommon = JSON.parse(enCommonSrc); } catch (_) {}
try { esCommon = JSON.parse(esCommonSrc); } catch (_) {}

// ─── W0 Scaffold (STRICT PASS — files MUST exist after Wave 0) ───
assert(readSafe('scripts/smoke-phase21.cjs') !== null, 'W0.scaffold.smoke-runner-exists');
assert(/smoke:phase21/.test(readSafe('package.json') || ''), 'W0.scaffold.npm-script-exists');
assert(/scripts\/\.tmp-phase21\//.test(readSafe('.gitignore') || ''), 'W0.scaffold.gitignore-tmp-dir');
assert(/export type CareTag\s*=/.test(typesSrc), 'W0.scaffold.types.CareTag-union');
assert(/export interface JournalEntry\b/.test(typesSrc), 'W0.scaffold.types.JournalEntry');
assert(/journals\?:\s*Record<string,\s*JournalEntry\[\]>/.test(typesSrc), 'W0.scaffold.types.AppData.journals-field');
assert(
  journalServiceSrc.includes('pickJournalPhoto') &&
  journalServiceSrc.includes('saveJournalPhoto') &&
  journalServiceSrc.includes('deleteJournalPhoto') &&
  journalServiceSrc.includes('deleteJournalDirectory'),
  'W0.scaffold.journalService.4-signatures'
);
assert(journalSectionSrc.length > 0, 'W0.scaffold.JournalSection-file-exists');
assert(journalQuickAddSrc.length > 0, 'W0.scaffold.JournalQuickAddSheet-file-exists');
assert(journalEntryRowSrc.length > 0, 'W0.scaffold.JournalEntryRow-file-exists');

// ─── W0 i18n namespace presence + key-count thresholds (STRICT — Important 5) ───
assert(enCommon && enCommon.journal && esCommon && esCommon.journal, 'W0.scaffold.i18n-namespace-exists');
// Count top-level + nested keys recursively to satisfy threshold (6 careTag.* + 3 dateLabel.* + 1 error.* + scalars)
function countLeafKeys(obj) {
  if (obj == null || typeof obj !== 'object') return 0;
  let n = 0;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object') n += countLeafKeys(v);
    else n += 1;
  }
  return n;
}
assert(countLeafKeys(enCommon.journal) >= 22, 'W0.scaffold.i18n-key-count-en');
assert(countLeafKeys(esCommon.journal) >= 22, 'W0.scaffold.i18n-key-count-es');

// ─── JOURNAL-01 AppData.journals migration default — SKIP at W0, PASS after 21-01 ───
assertSkippable(() => /data\.journals\s*\|\|\s*\{\}/.test(useStorageSrc) || undefined, 'JOURNAL-01.useStorage.load-path-default');
assertSkippable(() => /dataRef\.current\.journals\s*=/.test(useStorageSrc) || undefined, 'JOURNAL-01.useStorage.dataRef-init');
// StorageState interface MUST be extended with journals field so snapshotFromRef's generic accepts d.journals (Blocker 3)
assertSkippable(() => /journals:\s*Record<string,\s*JournalEntry\[\]>/.test(useStorageSrc) || undefined, 'JOURNAL-01.useStorage.StorageState-extension');
// snapshotFromRef MUST list journals in its returned AppData (Blocker 3)
assertSkippable(() => /journals:\s*d\.journals/.test(useStorageSrc) || undefined, 'JOURNAL-01.useStorage.snapshotFromRef-includes-journals');
// __DEV__ payload-size instrumentation log (Important 9)
assertSkippable(() => /AsyncStorage payload bytes/.test(useStorageSrc) || undefined, 'JOURNAL-01.useStorage.payload-size-log');

// ─── JOURNAL-02 CareTag 6-literal union + journalService real impl — SKIP at W0 / PASS after 21-01/02 ───
assertSkippable(() => (/'riego'/.test(typesSrc) && /'fertilizar'/.test(typesSrc) && /'sol'/.test(typesSrc) && /'poda'/.test(typesSrc) && /'problema'/.test(typesSrc) && /'otro'/.test(typesSrc)) || undefined, 'JOURNAL-02.types.CareTag-6-literals');
// Tightened regex (Minor 10): require ${Paths.document.uri} template-literal interpolation, not just bare mention
assertSkippable(() => /\$\{Paths\.document\.uri\}[^]*journal/.test(journalServiceSrc) || undefined, 'JOURNAL-02.journalService.Paths-document-uri');
assertSkippable(() => (journalServiceSrc.includes('manipulateAsync') && /compress:\s*0\.7/.test(journalServiceSrc) && /width:\s*1080/.test(journalServiceSrc)) || undefined, 'JOURNAL-02.journalService.compression-pipeline');
assertSkippable(() => (journalServiceSrc.includes('new Directory') && journalServiceSrc.includes('new File')) || undefined, 'JOURNAL-02.journalService.modern-API');

// ─── JOURNAL-03 useStorage actions — SKIP at W0, PASS after 21-03 ───
assertSkippable(() => /addJournalEntry:\s*\(plantId:\s*string,\s*entry:\s*JournalEntry\)/.test(useStorageSrc) || undefined, 'JOURNAL-03.useStorage.addJournalEntry-interface');
assertSkippable(() => /deleteJournalEntry:\s*\(plantId:\s*string,\s*entryId:\s*string\)/.test(useStorageSrc) || undefined, 'JOURNAL-03.useStorage.deleteJournalEntry-interface');
assertSkippable(() => (useStorageSrc.match(/addJournalEntry/g) || []).length >= 4 || undefined, 'JOURNAL-03.useStorage.addJournalEntry-4-sites');
// Important 7: 3-name surface STRICT-ish gate for downstream pre-flight.
// Plan 21-01 lands the `journals` state field standalone (read-side wiring); Plan 21-03 lands the two actions.
// Skip while either action is absent (Plan 21-03 territory) regardless of `journals` presence.
assertSkippable(() => {
  if (useStorageSrc.length === 0) return undefined;
  const hasJournals = /\bjournals\b/.test(useStorageSrc);
  const hasAdd = /\baddJournalEntry\b/.test(useStorageSrc);
  const hasDel = /\bdeleteJournalEntry\b/.test(useStorageSrc);
  // Only flip to PASS once all three appear AND at least one is in the public interface (StorageActions or StorageContextType)
  const inInterface = /addJournalEntry:\s*\(/.test(useStorageSrc) && /deleteJournalEntry:\s*\(/.test(useStorageSrc);
  // Skip until both actions are wired (Plan 21-03). `journals` alone (Plan 21-01) is not enough to flip.
  if (!hasAdd || !hasDel) return undefined;
  return hasJournals && hasAdd && hasDel && inInterface;
}, 'JOURNAL-03.useStorage.public-interface-exposes-3-names');
assertSkippable(() => useStorageSrc.includes('deleteJournalDirectory') || undefined, 'JOURNAL-04.useStorage.deletePlant-calls-deleteJournalDirectory');
assertSkippable(() => /delete\s+newJournals\[id\]|delete\s+newJournals\[plantId\]/.test(useStorageSrc) || undefined, 'JOURNAL-04.useStorage.deletePlant-removes-journals-map-entry');

// ─── JOURNAL-04 ModalSectionId + Diario section + BottomSheetModal — SKIP at W0, PASS after 21-04 ───
assertSkippable(() => /'que-hacer'\s*\|\s*'donde'\s*\|\s*'por-que'\s*\|\s*'tus-ajustes'\s*\|\s*'mascotas'\s*\|\s*'diario'/.test(modalSrc) || undefined, 'JOURNAL-04.ModalSectionId.diario-extension');
assertSkippable(() => modalSrc.includes("onSectionLayout('diario')") || undefined, 'JOURNAL-04.modal.diario-section-layout');
assertSkippable(() => modalSrc.includes('JournalSection') || undefined, 'JOURNAL-04.modal.JournalSection-rendered');
assertSkippable(() => /snapPoints=\{\[['"]60%['"]\]\}/.test(journalQuickAddSrc) || undefined, 'JOURNAL-04.JournalQuickAddSheet.60-percent-snap');
assertSkippable(() => journalQuickAddSrc.includes('launchCameraAsync') || journalQuickAddSrc.includes('photoCamera') || undefined, 'JOURNAL-04.JournalQuickAddSheet.camera-button');
assertSkippable(() => journalQuickAddSrc.includes('launchImageLibraryAsync') || journalQuickAddSrc.includes('photoGallery') || undefined, 'JOURNAL-04.JournalQuickAddSheet.gallery-button');
assertSkippable(() => /careTag/.test(journalQuickAddSrc) || undefined, 'JOURNAL-04.JournalQuickAddSheet.careTag-chips');
assertSkippable(() => journalEntryRowSrc.includes('onLongPress') || /Gesture\.LongPress/.test(journalEntryRowSrc) || undefined, 'JOURNAL-04.JournalEntryRow.long-press');

// ─── Toast wiring (Blocker B + Warning E TIGHTENED) ───
// Phase 18 CARD-01 already shipped `toastVisible` in BOTH PlantsScreen.tsx:135 and TodayScreen.tsx:249
// for swipe-undo Toast. A loose `toastVisible >= 2` or bare `savedToast` substring match would
// false-positive against the existing Phase 18 state.
// STRICT proximity regex: BOTH `journalToastVisible` (distinct journal-specific identifier) AND
// `journal.savedToast` (i18n key literal) MUST appear in the same file within 500 chars, in
// either order. This proves the journal-specific Toast wiring actually landed.
assertSkippable(() => {
  if (plantsScreenSrc.length === 0 && todayScreenSrc.length === 0) return undefined;
  const proximityRe = /journalToastVisible[\s\S]{0,500}journal\.savedToast|journal\.savedToast[\s\S]{0,500}journalToastVisible/;
  const inPlants = proximityRe.test(plantsScreenSrc);
  const inToday = proximityRe.test(todayScreenSrc);
  // Both consumers MUST carry the wiring (Plan 21-04 Task 4 mandates both).
  if (!inPlants && !inToday) return undefined;
  return inPlants && inToday;
}, 'JOURNAL-04.Toast.entrada-guardada-wired');

// Important 8: ModalSectionId import path locked — both consumers MUST import ModalSectionId (>=2 occurrences = import + usage)
assertSkippable(() => (plantsScreenSrc.match(/ModalSectionId/g) || []).length >= 2 || undefined, 'JOURNAL-04.PlantsScreen.ModalSectionId-widened');
assertSkippable(() => (todayScreenSrc.match(/ModalSectionId/g) || []).length >= 2 || undefined, 'JOURNAL-04.TodayScreen.ModalSectionId-widened');

// ─── JOURNAL-05 negative-grep (NO premium-gate at journal-read sites) — SKIP at W0, PASS after 21-05 ───
// Plan 21-05 enforcement: ALL three Wave 3 journal component files MUST be free of premium-gate
// references. JournalQuickAddSheet was previously omitted from this sentinel — the plan's
// acceptance criterion (line 224) explicitly enumerates all three files. Extended in Plan 21-05.
assertSkippable(() => {
  if (journalSectionSrc.length === 0) return undefined;
  const GATE_RE = /usePremiumGate|isPremium|canReadJournal/;
  const hasGate =
    GATE_RE.test(journalSectionSrc) ||
    GATE_RE.test(journalEntryRowSrc) ||
    GATE_RE.test(journalQuickAddSrc);
  return hasGate ? false : true;
}, 'JOURNAL-05.negative-grep.no-premium-gate-at-read-sites');

// Plan 21-05 additional guard: MyPlantDetailModal's Diario render block must NOT be wrapped in
// a premium-gate conditional. The modal uses usePremiumGate() for the (Phase 8) diagnosis flow
// — that is legitimate and unrelated. We forbid the gate symbols appearing inside the Diario
// JSX block specifically. Pattern: locate the `onLayout={onSectionLayout('diario')}` anchor and
// confirm no premium-gate identifier appears within ±5 lines of it.
assertSkippable(() => {
  if (modalSrc.length === 0) return undefined;
  const lines = modalSrc.split('\n');
  const anchor = lines.findIndex((l) => /onSectionLayout\(['"]diario['"]\)/.test(l));
  if (anchor === -1) return undefined;
  const window = lines.slice(Math.max(0, anchor - 5), anchor + 6).join('\n');
  const wrapped = /(isPremium|canReadJournal|usePremiumGate)\s*\&\&/.test(window);
  return wrapped ? false : true;
}, 'JOURNAL-05.modal.diario-block-not-premium-gated');

// ─── i18n parity (≥22 keys — covers ALL Wave 3 t() sites) — SKIP per-key at W0, PASS after Wave 0 task 1 lands JSON skeletons ───
const requiredJournalKeys = [
  'journal.header', 'journal.emptyState', 'journal.addEntry', 'journal.savedToast',
  'journal.photoCamera', 'journal.photoGallery',
  'journal.careTag.riego', 'journal.careTag.fertilizar', 'journal.careTag.sol',
  'journal.careTag.poda', 'journal.careTag.problema', 'journal.careTag.otro',
  'journal.deleteConfirm',
  'journal.dateLabel.today', 'journal.dateLabel.yesterday', 'journal.dateLabel.daysAgo',
  // Blocker 4: 6 additional keys used by Wave 3 components (bare t() — no ?? fallbacks)
  'journal.save', 'journal.cancel', 'journal.delete', 'journal.deleteEntry',
  'journal.textPlaceholder', 'journal.error.photoSaveFailed',
];
requiredJournalKeys.forEach(k => {
  assertSkippable(() => {
    const enHas = getNested(enCommon, k) !== undefined;
    const esHas = getNested(esCommon, k) !== undefined;
    if (!enHas && !esHas) return undefined;
    return enHas && esHas;
  }, `i18n.parity.${k}`);
});

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
// Phase 20 FERT-03 5-site discriminator preserved
assert(plantLogicSrc.includes("'fertilize'") || plantLogicSrc.includes('"fertilize"'), 'CROSS.FERT-03.plantLogic.fertilize-emit');
assert(schedulerSrc.includes("'fertilize'") || schedulerSrc.includes('"fertilize"') || schedulerSrc.includes('fertilizeTasks'), 'CROSS.FERT-03.scheduler.fertilize-filter');
// Phase 20 FERT-06 FertilizeCard preserved
assert(readSafe('src/components/plant-detail/FertilizeCard.tsx') !== null, 'CROSS.FERT-06.FertilizeCard.FILE-NOT-DELETED');
// Phase 20 FERT-07 i18n parity extension preserved
assert(/fertilizer\.(industrial|homemade)/.test(checkScript), 'CROSS.FERT-07.checkScript.fertilizer-extension-preserved');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 21-01..05 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
}
console.log(`[Phase 21 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
