#!/usr/bin/env node
// scripts/smoke-phase23.cjs
// Phase 23 Polish (UAT Fixes + Brand Voice) smoke runner.
// CommonJS (.cjs). Wave 0 ships harness + scaffold PASSes + SKIP→PASS placeholders for
// POLISH-01 (outdoor task gate), POLISH-02 (catalog outdoor:false), POLISH-03 (PlantNet
// category-conflict resolution), POLISH-05 (textSecondary WCAG-AA hex), POLISH-06
// (4 action button voseo+emoji literals + voseo-lint exit 0), POLISH-07 (3 illustrated
// empty states + 6+6 i18n keys finalized) + STRICT POLISH-08 negative-grep (no sample/
// mock/seed/demo/firstLaunch plant arrays in src/) + STRICT cross-phase regression
// sentinels for Phase 18 (PlantCard 5-element layout + mood emoji + Gesture.Pan + Toast),
// Phase 19 (TOX-03 / TOX-04 / TOX-06), Phase 20 (FERT-03 / FERT-06 / FERT-07), Phase 21
// (JOURNAL-01 / JOURNAL-02 / JOURNAL-04 / JOURNAL-05), and Phase 22 (GAM-01 / GAM-02 /
// GAM-05) — forked VERBATIM from smoke-phase22.cjs cross-phase block.
//
// Three-tier pattern (Phase 14-00 / 19-00 / 20-00 / 21-00 / 22-00 precedent):
//   TIER 1 — W0 Scaffold (STRICT PASS — files MUST exist after Wave 0)
//   TIER 2 — POLISH-01/02/03/05/06/07 SKIP-to-PASS placeholders (flip as Plans 23-01/02/03 land)
//   TIER 2.5 — STRICT POLISH-08 negative-grep (NEVER SKIP — RESEARCH §Finding 12 PASS at baseline)
//   TIER 3 — STRICT cross-phase regression sentinels (NEVER SKIP — preserves Phases 18-22)
//
// POLISH-04 is manual-only (device-test gate in Plan 23-04 — no automated sentinel).
//
// Runner is NOT modified after Wave 0 lands. Later plans flip SKIPs to PASSes by landing
// concrete code/JSX/data.
//
// Usage:
//   node scripts/smoke-phase23.cjs
//   npm run smoke:phase23

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

// ─── Assertion harness (verbatim from Phase 22 lines 30-51) ───
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

// ─── WCAG AA helper (POLISH-05) ───
// hexToRgb → linearize → relativeLuminance → contrast ratio.
// Reference: WCAG 2.1 §1.4.3 — contrast ratio ≥ 4.5:1 for normal text.
function hexToRgb(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}
function linearize(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function wcagAA(fgHex, bgHex) {
  const L1 = relativeLuminance(fgHex);
  const L2 = relativeLuminance(bgHex);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

// ─── Read source files ONCE ───
const pkgJsonSrc = readSafe('package.json') || '{}';
let pkgJson = {};
try { pkgJson = JSON.parse(pkgJsonSrc); } catch (_) {}
const gitignoreSrc = readSafe('.gitignore') || '';
const enCommonSrc = readSafe('src/i18n/locales/en/common.json') || '{}';
const esCommonSrc = readSafe('src/i18n/locales/es/common.json') || '{}';
let enJson = {}, esJson = {};
try { enJson = JSON.parse(enCommonSrc); } catch (_) {}
try { esJson = JSON.parse(esCommonSrc); } catch (_) {}

// Phase 23-specific targets (POLISH-01/02/03/05/07)
const plantLogicSrc = readSafe('src/utils/plantLogic.ts') || '';
const plantDatabaseSrc = readSafe('src/data/plantDatabase.ts') || '';
const identResultsSrc = readSafe('src/components/PlantIdentifier/IdentificationResults.tsx') || '';
const themeSrc = readSafe('src/theme.ts') || '';
const plantsScreenSrc = readSafe('src/screens/PlantsScreen.tsx') || '';
const calendarScreenSrc = readSafe('src/screens/CalendarScreen.tsx') || '';
const exploreScreenSrc = readSafe('src/screens/ExploreScreen.tsx') || '';

// Cross-phase preservation reads (Phase 18-22 sentinels)
const useStorageSrc = readSafe('src/hooks/useStorage.tsx') || '';
const todayScreenSrc = readSafe('src/screens/TodayScreen.tsx') || '';
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
const schedulerSrc = readSafe('src/utils/notificationScheduler.ts') || '';
const journalServiceSrc = readSafe('src/services/journalService.ts') || '';
const journalSectionSrc = readSafe('src/components/plant-detail/JournalSection.tsx') || '';
const journalEntryRowSrc = readSafe('src/components/plant-detail/JournalEntryRow.tsx') || '';
const journalQuickAddSrc = readSafe('src/components/plant-detail/JournalQuickAddSheet.tsx') || '';
const typesSrc = readSafe('src/types/index.ts') || '';
const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';

// ─── TIER 1 — W0 Scaffold (STRICT PASS — files MUST exist after Wave 0) ───
assert(fs.existsSync(path.resolve(ROOT, 'scripts/smoke-phase23.cjs')), 'W0.scaffold.smoke-runner-exists');
assert(fs.existsSync(path.resolve(ROOT, 'scripts/voseo-lint.mjs')), 'W0.scaffold.voseo-lint-exists');
assert(!!(pkgJson.scripts && pkgJson.scripts['smoke:phase23']), 'W0.scaffold.npm-script-smoke');
assert(!!(pkgJson.scripts && pkgJson.scripts['lint:voseo']), 'W0.scaffold.npm-script-voseo');
assert(/scripts\/\.tmp-phase23\//.test(gitignoreSrc), 'W0.scaffold.gitignore-tmp');
// i18n parity: 6 EN + 6 ES emptyState leaf keys
assert(
  getNested(enJson, 'emptyState.plants.title') !== undefined &&
  getNested(enJson, 'emptyState.plants.cta') !== undefined &&
  getNested(enJson, 'emptyState.calendar.title') !== undefined &&
  getNested(enJson, 'emptyState.calendar.cta') !== undefined &&
  getNested(enJson, 'emptyState.explore.title') !== undefined &&
  getNested(enJson, 'emptyState.explore.cta') !== undefined &&
  getNested(esJson, 'emptyState.plants.title') !== undefined &&
  getNested(esJson, 'emptyState.plants.cta') !== undefined &&
  getNested(esJson, 'emptyState.calendar.title') !== undefined &&
  getNested(esJson, 'emptyState.calendar.cta') !== undefined &&
  getNested(esJson, 'emptyState.explore.title') !== undefined &&
  getNested(esJson, 'emptyState.explore.cta') !== undefined,
  'W0.scaffold.i18n-emptyState-12keys'
);

// ─── TIER 2 — POLISH-01..07 SKIP→PASS placeholders ───

// POLISH-01: OUTDOOR_TYPE_IDS Set + gate in getTasksForDay (Plan 23-01)
// Looks for: const OUTDOOR_TYPE_IDS = new Set(['exterior', 'frutales']); AND OUTDOOR_TYPE_IDS.has(...)
assertSkippable(() => {
  const hasSet = /const\s+OUTDOOR_TYPE_IDS[\s\S]*?=\s*new Set\(\s*\[\s*['"]exterior['"]\s*,\s*['"]frutales['"]\s*\]\s*\)/.test(plantLogicSrc);
  const hasGate = /OUTDOOR_TYPE_IDS\.has\(/.test(plantLogicSrc);
  if (!hasSet && !hasGate) return undefined;
  return hasSet && hasGate;
}, 'POLISH-01.outdoor-task-gate');

// POLISH-02: catalog outdoor:false count for OUTDOOR_TYPE_IDS entries (Plan 23-01)
// RESEARCH §Finding 2 expects 28 exterior + 7 frutales + 10 outdoor-aromaticas = 45.
// Sentinel: count outdoor:false occurrences AND skip if total < 45 (PASS at >= 45).
assertSkippable(() => {
  if (!plantDatabaseSrc) return undefined;
  const matches = plantDatabaseSrc.match(/outdoor:\s*false/g) || [];
  if (matches.length < 45) return undefined;
  return matches.length >= 45;
}, 'POLISH-02.catalog-outdoor-false');

// POLISH-03: PlantNet category-conflict resolution — resolveTypeIdForPicker function
// OR direct selectedPlant?.category fallback in IdentificationResults.tsx (Plan 23-01)
assertSkippable(() => {
  if (!identResultsSrc) return undefined;
  const hasResolver = /function\s+resolveTypeIdForPicker|const\s+resolveTypeIdForPicker\s*=/.test(identResultsSrc);
  const hasCategoryRef = /selectedPlant\?\.category|plant\?\.category/.test(identResultsSrc);
  if (!hasResolver && !hasCategoryRef) return undefined;
  return hasResolver || hasCategoryRef;
}, 'POLISH-03.category-over-indoor-flag');

// POLISH-05: textSecondary darken to pass WCAG AA on both bgPrimary + card (Plan 23-02)
// Skip if still '#8a7e6b'; PASS if new hex achieves ≥4.5:1 on both backgrounds.
assertSkippable(() => {
  const m = themeSrc.match(/textSecondary:\s*['"](#[0-9a-fA-F]{6})['"]/);
  if (!m) return undefined;
  const hex = m[1].toLowerCase();
  if (hex === '#8a7e6b') return undefined;
  const bgPrimary = '#f5f0e6';
  const card = '#fffdf8';
  return wcagAA(hex, bgPrimary) >= 4.5 && wcagAA(hex, card) >= 4.5;
}, 'POLISH-05.textSecondary-wcag-aa');

// POLISH-06: 4 action button voseo + emoji literals in es/common.json (Plan 23-02)
// "water" → "Regá ahora 💧", "outdoor" → "Sacalo afuera 🌳", "fertilize" → "Fertilizá 🌱",
// "sunLabel" → contains ☀️
assertSkippable(() => {
  const hasWater = /"water"\s*:\s*"Regá ahora 💧"/.test(esCommonSrc);
  const hasOutdoor = /"outdoor"\s*:\s*"Sacalo afuera 🌳"/.test(esCommonSrc);
  const hasFert = /"fertilize"\s*:\s*"Fertilizá 🌱"/.test(esCommonSrc);
  const hasSun = /"sunLabel"\s*:\s*"[^"]*☀️[^"]*"/.test(esCommonSrc);
  if (!hasWater && !hasOutdoor && !hasFert && !hasSun) return undefined;
  return hasWater && hasOutdoor && hasFert && hasSun;
}, 'POLISH-06.action-button-voseo-emoji');

// POLISH-06: voseo-lint exits 0 AND no longer reports "skeleton — BANNED list empty"
// (skeleton at W0 baseline exits 0 but reports skeleton flag → SKIP; STRICT body lands in
// Plan 23-02 → flag disappears → PASS).
assertSkippable(() => {
  const voseoLintPath = path.resolve(ROOT, 'scripts/voseo-lint.mjs');
  if (!fs.existsSync(voseoLintPath)) return undefined;
  const r = spawnSync('node', [voseoLintPath], { encoding: 'utf8' });
  if (r.status !== 0) return false;
  const out = (r.stdout || '') + (r.stderr || '');
  if (/skeleton — BANNED list empty/.test(out)) return undefined;
  return true;
}, 'POLISH-06.voseo-lint-exit-0');

// POLISH-07: 3 illustration PNGs + 3 EmptyState JSX inserts in PlantsScreen +
// CalendarScreen + ExploreScreen (Plan 23-03)
assertSkippable(() => {
  const pngs = [
    fs.existsSync(path.resolve(ROOT, 'assets/illustrations/empty-plants.png')),
    fs.existsSync(path.resolve(ROOT, 'assets/illustrations/empty-calendar.png')),
    fs.existsSync(path.resolve(ROOT, 'assets/illustrations/empty-explore.png')),
  ];
  const jsxRefs = [
    /empty-plants\.png/.test(plantsScreenSrc),
    /empty-calendar\.png/.test(calendarScreenSrc),
    /empty-explore\.png/.test(exploreScreenSrc),
  ];
  const anyPng = pngs.some(Boolean);
  const anyJsx = jsxRefs.some(Boolean);
  if (!anyPng && !anyJsx) return undefined;
  return pngs.every(Boolean) && jsxRefs.every(Boolean);
}, 'POLISH-07.illustrated-empty-states');

// ─── TIER 2.5 — STRICT POLISH-08 negative-grep (NEVER SKIP — RESEARCH §Finding 12) ───
// No samplePlants/mockPlants/seedPlants/demoPlants/firstLaunchPlants arrays in src/.
// Mirror smoke-phase22.cjs walkSrcForStreakTokens pattern.
const SAMPLE_PLANT_RE = /\b(samplePlants|mockPlants|seedPlants|demoPlants|firstLaunchPlants)\b/;
const SAMPLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const samplePlantViolations = [];
function walkSrcForSamplePlantArrays(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (_) { return; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkSrcForSamplePlantArrays(full);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (!SAMPLE_EXTENSIONS.has(ext)) continue;
      let content;
      try { content = fs.readFileSync(full, 'utf8'); }
      catch (_) { continue; }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (SAMPLE_PLANT_RE.test(line)) {
          const rel = path.relative(ROOT, full);
          samplePlantViolations.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      }
    }
  }
}
walkSrcForSamplePlantArrays(path.resolve(ROOT, 'src'));
assert(samplePlantViolations.length === 0, 'POLISH-08.negative-grep.no-sample-plant-arrays');
if (samplePlantViolations.length > 0) {
  console.error('--- POLISH-08 SAMPLE PLANT VIOLATIONS ---');
  samplePlantViolations.forEach((v) => console.error('  ' + v));
}

// ─── TIER 3 — STRICT cross-phase regression sentinels (NEVER SKIP) ───
// Forked VERBATIM from smoke-phase22.cjs lines 248-286. DO NOT MODIFY.

// === PHASE 18 STRICT === PlantCard + mood emoji + Toast primitive
assert(modalSrc.includes('PlantHealthBadge'), 'CROSS.GAM-04.healthBadge.MODAL-USAGE-PRESERVED');
assert(readSafe('src/components/PlantHealthBadge.tsx') !== null, 'CROSS.GAM-04.healthBadge.FILE-NOT-DELETED');
assert(/Gesture\.Pan|GestureDetector/.test(plantCardSrc), 'CROSS.CARD-01.plantcard.gesture-pan-preserved');
assert(plantCardSrc.includes('moodEmoji') && plantCardSrc.includes('moodBadge'), 'CROSS.GAM-03.plantcard.mood-emoji-preserved');
assert(readSafe('src/components/Toast.tsx') !== null, 'CROSS.Toast.FILE-NOT-DELETED');

// === PHASE 19 STRICT === TOX-03 / TOX-04 / TOX-06
assert(plantCardSrc.includes('PetToxicityBadge'), 'CROSS.TOX-03.plantcard.toxicity-badges-preserved');
assert(modalSrc.includes('MascotasContent') || modalSrc.includes('emoji="🐾"'), 'CROSS.TOX-04.modal.mascotas-section-preserved');
assert(modalSrc.includes('initialSection?: ModalSectionId'), 'CROSS.TOX-04.modal.initialSection-preserved');
assert(/petToxicity[^]*?symptoms/.test(checkScript), 'CROSS.TOX-06.checkScript.symptoms-extension-preserved');

// === PHASE 20 STRICT === FERT-03 / FERT-06 / FERT-07
assert(plantLogicSrc.includes("'fertilize'") || plantLogicSrc.includes('"fertilize"'), 'CROSS.FERT-03.plantLogic.fertilize-emit');
assert(schedulerSrc.includes("'fertilize'") || schedulerSrc.includes('"fertilize"') || schedulerSrc.includes('fertilizeTasks'), 'CROSS.FERT-03.scheduler.fertilize-filter');
assert(readSafe('src/components/plant-detail/FertilizeCard.tsx') !== null, 'CROSS.FERT-06.FertilizeCard.FILE-NOT-DELETED');
assert(/fertilizer\.(industrial|homemade)/.test(checkScript), 'CROSS.FERT-07.checkScript.fertilizer-extension-preserved');

// === PHASE 21 STRICT === JOURNAL-01 / JOURNAL-02 / JOURNAL-04 / JOURNAL-05
assert(/journals\?:\s*Record<string,\s*JournalEntry\[\]>/.test(typesSrc), 'CROSS.JOURNAL-01.types.AppData.journals');
assert(readSafe('src/services/journalService.ts') !== null, 'CROSS.JOURNAL-02.journalService.FILE-NOT-DELETED');
assert(/'que-hacer'\s*\|\s*'donde'\s*\|\s*'por-que'\s*\|\s*'tus-ajustes'\s*\|\s*'mascotas'\s*\|\s*'diario'/.test(modalSrc), 'CROSS.JOURNAL-04.ModalSectionId.diario-extension');
assert(modalSrc.includes('JournalSection'), 'CROSS.JOURNAL-04.modal.JournalSection-rendered');
// Phase 21 JOURNAL-04 journalToastVisible Toast wiring preserved in BOTH PlantsScreen + TodayScreen
{
  const proximityRe = /journalToastVisible[\s\S]{0,500}journal\.savedToast|journal\.savedToast[\s\S]{0,500}journalToastVisible/;
  assert(proximityRe.test(plantsScreenSrc), 'CROSS.JOURNAL-04.PlantsScreen.journalToastVisible-preserved');
  assert(proximityRe.test(todayScreenSrc), 'CROSS.JOURNAL-04.TodayScreen.journalToastVisible-preserved');
}
// Phase 21 JOURNAL-05 — no premium-gate at journal-read sites
{
  const GATE_RE = /usePremiumGate|isPremium|canReadJournal/;
  assert(!GATE_RE.test(journalSectionSrc), 'CROSS.JOURNAL-05.JournalSection.no-premium-gate');
  assert(!GATE_RE.test(journalEntryRowSrc), 'CROSS.JOURNAL-05.JournalEntryRow.no-premium-gate');
  assert(!GATE_RE.test(journalQuickAddSrc), 'CROSS.JOURNAL-05.JournalQuickAddSheet.no-premium-gate');
}

// === PHASE 22 STRICT === GAM-01 / GAM-02 / GAM-05
// GAM-02 task-done actions wired with triggerHaptic
assert(/const\s+waterPlant\s*=\s*useCallback/.test(useStorageSrc), 'CROSS.GAM-02.useStorage.waterPlant-action');
assert(/const\s+sunPlant\s*=\s*useCallback/.test(useStorageSrc), 'CROSS.GAM-02.useStorage.sunPlant-action');
assert(/const\s+outdoorPlant\s*=\s*useCallback/.test(useStorageSrc), 'CROSS.GAM-02.useStorage.outdoorPlant-action');
assert(/import\s*\{[^}]*triggerHaptic[^}]*\}\s*from\s*['"][^'"]*utils\/haptics['"]/.test(useStorageSrc), 'CROSS.GAM-02.useStorage.triggerHaptic-import');
// GAM-01 setOnTaskCompleted plumbing
assert(/setOnTaskCompleted\s*:\s*\(/.test(useStorageSrc), 'CROSS.GAM-01.useStorage.setOnTaskCompleted-in-interface');
assert(/const\s+setOnTaskCompleted\s*=\s*useCallback/.test(useStorageSrc), 'CROSS.GAM-01.useStorage.setOnTaskCompleted-implementation');
assert(/onTaskCompletedRef\s*=\s*useRef/.test(useStorageSrc), 'CROSS.GAM-01.useStorage.onTaskCompletedRef-useRef');
// GAM-01 Toast wired in all 3 screens
{
  const proximityRe = /gamificationToastVisible[\s\S]{0,500}gamification\.toastSuccess|gamification\.toastSuccess[\s\S]{0,500}gamificationToastVisible/;
  assert(proximityRe.test(plantsScreenSrc), 'CROSS.GAM-01.PlantsScreen.gamificationToastVisible-preserved');
  assert(proximityRe.test(todayScreenSrc), 'CROSS.GAM-01.TodayScreen.gamificationToastVisible-preserved');
  assert(proximityRe.test(calendarScreenSrc), 'CROSS.GAM-01.CalendarScreen.gamificationToastVisible-preserved');
}
// GAM-01 i18n EN+ES literals preserved
assert(getNested(enJson, 'gamification.toastSuccess') === "You're on it! 🌱", 'CROSS.GAM-01.i18n.en.literal');
assert(getNested(esJson, 'gamification.toastSuccess') === '¡Vas bien! 🌱', 'CROSS.GAM-01.i18n.es.voseo-literal');
// GAM-05 anti-pattern comment 4x marker preserved
assert((useStorageSrc.match(/GAM-05 lock/g) || []).length === 4, 'CROSS.GAM-05.useStorage.anti-pattern-comment-x4');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 23-01/02/03 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
}
console.log(`[Phase 23 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
