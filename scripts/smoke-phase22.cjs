#!/usr/bin/env node
// scripts/smoke-phase22.cjs
// Phase 22 Gamification (Toasts + Haptics) smoke runner.
// CommonJS (.cjs). Wave 0 ships harness + scaffold PASSes + SKIP→PASS placeholders for GAM-01/02/05
// + STRICT cross-phase regression sentinels for Phase 18 (PlantCard 5-element layout + mood emoji),
// Phase 19 (TOX-03 / TOX-04 / TOX-06), Phase 20 (FERT-03 / FERT-06 / FERT-07), and Phase 21
// (JOURNAL-01 / JOURNAL-02 / JOURNAL-04 / JOURNAL-05).
//
// Three-tier pattern:
//   TIER 1 — W0 Scaffold (STRICT PASS — files MUST exist after Wave 0)
//   TIER 2 — GAM-01 / GAM-02 / GAM-05 SKIP-to-PASS placeholders (flip as Plans 22-01/02 land)
//            EXCEPT the GAM-05 STRICT negative-grep block which NEVER SKIPs.
//   TIER 3 — STRICT cross-phase regression sentinels (NEVER SKIP — preserves Phases 18-21)
//
// Later plans flip SKIPs to PASSes by landing concrete code/JSX/data; the runner itself is NOT
// modified after Wave 0 (Phase 14-00 / 19-00 / 20-00 / 21-00 precedent).
//
// GAM-05 negative-grep MUST whitelist (a) CARE_STREAKS (V2.0 placeholder flag at
// src/config/features.ts:31) AND (b) any line containing the literal gam_anti_patterns.md (allows
// code-comment references to the anti-pattern memory file).
//
// Usage:
//   node scripts/smoke-phase22.cjs

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ─── Assertion harness (verbatim from Phase 21 lines 23-44) ───
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
const useStorageSrc = readSafe('src/hooks/useStorage.tsx') || '';
const plantsScreenSrc = readSafe('src/screens/PlantsScreen.tsx') || '';
const todayScreenSrc = readSafe('src/screens/TodayScreen.tsx') || '';
const calendarScreenSrc = readSafe('src/screens/CalendarScreen.tsx') || '';
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
const plantLogicSrc = readSafe('src/utils/plantLogic.ts') || '';
const schedulerSrc = readSafe('src/utils/notificationScheduler.ts') || '';
const enCommonSrc = readSafe('src/i18n/locales/en/common.json') || '{}';
const esCommonSrc = readSafe('src/i18n/locales/es/common.json') || '{}';
let enCommon = {}, esCommon = {};
try { enCommon = JSON.parse(enCommonSrc); } catch (_) {}
try { esCommon = JSON.parse(esCommonSrc); } catch (_) {}
// Cross-phase only (Phase 21 JOURNAL-* preservation)
const journalServiceSrc = readSafe('src/services/journalService.ts') || '';
const journalSectionSrc = readSafe('src/components/plant-detail/JournalSection.tsx') || '';
const journalEntryRowSrc = readSafe('src/components/plant-detail/JournalEntryRow.tsx') || '';
const journalQuickAddSrc = readSafe('src/components/plant-detail/JournalQuickAddSheet.tsx') || '';
const typesSrc = readSafe('src/types/index.ts') || '';
const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';

// ─── TIER 1 — W0 Scaffold (STRICT PASS — files MUST exist after Wave 0) ───
assert(readSafe('scripts/smoke-phase22.cjs') !== null, 'W0.scaffold.smoke-runner-exists');
assert(/smoke:phase22/.test(readSafe('package.json') || ''), 'W0.scaffold.npm-script-exists');
assert(/scripts\/\.tmp-phase22\//.test(readSafe('.gitignore') || ''), 'W0.scaffold.gitignore-tmp-dir');
assert(getNested(enCommon, 'gamification.toastSuccess') !== undefined, 'W0.scaffold.i18n.en.gamification.toastSuccess');
assert(getNested(esCommon, 'gamification.toastSuccess') !== undefined, 'W0.scaffold.i18n.es.gamification.toastSuccess');
assert(getNested(esCommon, 'gamification.toastSuccess') === '¡Vas bien! 🌱', 'W0.scaffold.i18n.es.voseo-literal');
assert(getNested(enCommon, 'gamification.toastSuccess') === "You're on it! 🌱", 'W0.scaffold.i18n.en.literal');

// ─── TIER 2 — GAM-01 / GAM-02 SKIP-to-PASS placeholders ───
// (Each returns undefined until the new identifier appears; flips to PASS/FAIL once present.)

// GAM-02 useStorage actions (presence — Plan 22-01)
assertSkippable(() => /const\s+waterPlant\s*=\s*useCallback/.test(useStorageSrc) || undefined, 'GAM-02.useStorage.waterPlant-action');
assertSkippable(() => /const\s+sunPlant\s*=\s*useCallback/.test(useStorageSrc) || undefined, 'GAM-02.useStorage.sunPlant-action');
assertSkippable(() => /const\s+outdoorPlant\s*=\s*useCallback/.test(useStorageSrc) || undefined, 'GAM-02.useStorage.outdoorPlant-action');

// GAM-02 triggerHaptic('success') proximity (within 400 chars of each action's useCallback body)
assertSkippable(() => {
  if (!/const\s+waterPlant\s*=\s*useCallback/.test(useStorageSrc)) return undefined;
  return /const\s+waterPlant\s*=\s*useCallback[\s\S]{0,400}triggerHaptic\(['"]success['"]\)/.test(useStorageSrc);
}, 'GAM-02.useStorage.waterPlant.triggerHaptic-success');
assertSkippable(() => {
  if (!/const\s+sunPlant\s*=\s*useCallback/.test(useStorageSrc)) return undefined;
  return /const\s+sunPlant\s*=\s*useCallback[\s\S]{0,400}triggerHaptic\(['"]success['"]\)/.test(useStorageSrc);
}, 'GAM-02.useStorage.sunPlant.triggerHaptic-success');
assertSkippable(() => {
  if (!/const\s+outdoorPlant\s*=\s*useCallback/.test(useStorageSrc)) return undefined;
  return /const\s+outdoorPlant\s*=\s*useCallback[\s\S]{0,400}triggerHaptic\(['"]success['"]\)/.test(useStorageSrc);
}, 'GAM-02.useStorage.outdoorPlant.triggerHaptic-success');
// fertilizePlant: SKIP if /triggerHaptic/ test on useStorageSrc is false (Wave 0 baseline).
// Proximity widened to 1000 chars because fertilizePlant body has multi-branch catalog-bootstrap
// logic (~16 lines) BEFORE the haptic+callback firing site — per Plan 22-01 step F, the haptic
// MUST fire AFTER the no-op early-return guard so custom plants without a schedule do not get
// spurious celebration feedback. The 400-char window in Plan 22-00's scaffold was sized for the
// simpler waterPlant shape, not fertilizePlant's longer body.
assertSkippable(() => {
  if (!/triggerHaptic/.test(useStorageSrc)) return undefined;
  return /const\s+fertilizePlant\s*=\s*useCallback[\s\S]{0,1000}triggerHaptic\(['"]success['"]\)/.test(useStorageSrc);
}, 'GAM-02.useStorage.fertilizePlant.triggerHaptic-success');

// GAM-02 triggerHaptic import
assertSkippable(() => /import\s*\{[^}]*triggerHaptic[^}]*\}\s*from\s*['"][^'"]*utils\/haptics['"]/.test(useStorageSrc) || undefined, 'GAM-02.useStorage.triggerHaptic-import');

// GAM-01 setOnTaskCompleted plumbing (Plan 22-01)
assertSkippable(() => /setOnTaskCompleted\s*:\s*\(/.test(useStorageSrc) || undefined, 'GAM-01.useStorage.setOnTaskCompleted-in-interface');
assertSkippable(() => /const\s+setOnTaskCompleted\s*=\s*useCallback/.test(useStorageSrc) || undefined, 'GAM-01.useStorage.setOnTaskCompleted-implementation');
assertSkippable(() => /onTaskCompletedRef\s*=\s*useRef/.test(useStorageSrc) || undefined, 'GAM-01.useStorage.onTaskCompletedRef-useRef');

// GAM-01 onTaskCompletedRef.current?.() invocation in each task-done action (proximity)
assertSkippable(() => {
  if (!/onTaskCompletedRef/.test(useStorageSrc)) return undefined;
  return /const\s+waterPlant\s*=\s*useCallback[\s\S]{0,400}onTaskCompletedRef\.current\?\.\(\)/.test(useStorageSrc);
}, 'GAM-01.useStorage.waterPlant.onTaskCompleted-call');
assertSkippable(() => {
  if (!/onTaskCompletedRef/.test(useStorageSrc)) return undefined;
  return /const\s+sunPlant\s*=\s*useCallback[\s\S]{0,400}onTaskCompletedRef\.current\?\.\(\)/.test(useStorageSrc);
}, 'GAM-01.useStorage.sunPlant.onTaskCompleted-call');
assertSkippable(() => {
  if (!/onTaskCompletedRef/.test(useStorageSrc)) return undefined;
  return /const\s+outdoorPlant\s*=\s*useCallback[\s\S]{0,400}onTaskCompletedRef\.current\?\.\(\)/.test(useStorageSrc);
}, 'GAM-01.useStorage.outdoorPlant.onTaskCompleted-call');
// fertilizePlant proximity widened to 1000 chars per same rationale as the triggerHaptic sentinel above.
assertSkippable(() => {
  if (!/onTaskCompletedRef/.test(useStorageSrc)) return undefined;
  return /const\s+fertilizePlant\s*=\s*useCallback[\s\S]{0,1000}onTaskCompletedRef\.current\?\.\(\)/.test(useStorageSrc);
}, 'GAM-01.useStorage.fertilizePlant.onTaskCompleted-call');

// GAM-01 gamificationToastVisible state in each screen (Plan 22-02)
assertSkippable(() => /gamificationToastVisible/.test(plantsScreenSrc) || undefined, 'GAM-01.PlantsScreen.gamificationToastVisible-state');
assertSkippable(() => /gamificationToastVisible/.test(todayScreenSrc) || undefined, 'GAM-01.TodayScreen.gamificationToastVisible-state');
assertSkippable(() => /gamificationToastVisible/.test(calendarScreenSrc) || undefined, 'GAM-01.CalendarScreen.gamificationToastVisible-state');

// GAM-01 Toast.vas-bien-wired-3-screens: STRICT proximity regex MUST match in ALL THREE screens (SKIP when none match)
assertSkippable(() => {
  const proximityRe = /gamificationToastVisible[\s\S]{0,500}gamification\.toastSuccess|gamification\.toastSuccess[\s\S]{0,500}gamificationToastVisible/;
  const inPlants = proximityRe.test(plantsScreenSrc);
  const inToday = proximityRe.test(todayScreenSrc);
  const inCalendar = proximityRe.test(calendarScreenSrc);
  if (!inPlants && !inToday && !inCalendar) return undefined;
  return inPlants && inToday && inCalendar;
}, 'GAM-01.Toast.vas-bien-wired-3-screens');

// GAM-01 durationMs={2000} proximity in all 3 screens
assertSkippable(() => {
  const proximityRe = /visible=\{gamificationToastVisible\}[\s\S]{0,300}durationMs=\{2000\}|durationMs=\{2000\}[\s\S]{0,300}visible=\{gamificationToastVisible\}/;
  const inPlants = proximityRe.test(plantsScreenSrc);
  const inToday = proximityRe.test(todayScreenSrc);
  const inCalendar = proximityRe.test(calendarScreenSrc);
  if (!inPlants && !inToday && !inCalendar) return undefined;
  return inPlants && inToday && inCalendar;
}, 'GAM-01.Toast.durationMs-2000-3-screens');

// GAM-01 useEffect registers callback (setOnTaskCompleted + setGamificationToastVisible proximity)
assertSkippable(() => {
  const proximityRe = /setOnTaskCompleted\([\s\S]{0,200}setGamificationToastVisible|setGamificationToastVisible[\s\S]{0,200}setOnTaskCompleted/;
  return proximityRe.test(plantsScreenSrc) || undefined;
}, 'GAM-01.PlantsScreen.useEffect-registers-callback');
assertSkippable(() => {
  const proximityRe = /setOnTaskCompleted\([\s\S]{0,200}setGamificationToastVisible|setGamificationToastVisible[\s\S]{0,200}setOnTaskCompleted/;
  return proximityRe.test(todayScreenSrc) || undefined;
}, 'GAM-01.TodayScreen.useEffect-registers-callback');
assertSkippable(() => {
  const proximityRe = /setOnTaskCompleted\([\s\S]{0,200}setGamificationToastVisible|setGamificationToastVisible[\s\S]{0,200}setOnTaskCompleted/;
  return proximityRe.test(calendarScreenSrc) || undefined;
}, 'GAM-01.CalendarScreen.useEffect-registers-callback');

// GAM-02 screen handlers migrated to useStorage actions
assertSkippable(() => {
  const hasWater = /waterPlant\(/.test(todayScreenSrc);
  const hasSun = /sunPlant\(/.test(todayScreenSrc);
  const hasOutdoor = /outdoorPlant\(/.test(todayScreenSrc);
  if (!hasWater && !hasSun && !hasOutdoor) return undefined;
  return hasWater && hasSun && hasOutdoor;
}, 'GAM-02.TodayScreen.handlers-migrated-to-actions');
assertSkippable(() => {
  const hasWater = /waterPlant\(/.test(calendarScreenSrc);
  const hasSun = /sunPlant\(/.test(calendarScreenSrc);
  const hasOutdoor = /outdoorPlant\(/.test(calendarScreenSrc);
  if (!hasWater && !hasSun && !hasOutdoor) return undefined;
  return hasWater && hasSun && hasOutdoor;
}, 'GAM-02.CalendarScreen.handlers-migrated-to-actions');

// GAM-05 anti-pattern comment count (exactly 4 'GAM-05 lock' literals in useStorage when present)
assertSkippable(() => {
  const count = (useStorageSrc.match(/GAM-05 lock/g) || []).length;
  if (count === 0) return undefined;
  return count === 4;
}, 'GAM-05.useStorage.anti-pattern-comment-x4');

// ─── GAM-05 STRICT negative-grep (NEVER SKIP — runs unconditionally at W0 and beyond) ───
// Whitelist: lines containing CARE_STREAKS (V2.0 placeholder at src/config/features.ts:31)
// OR the literal `gam_anti_patterns.md` (allows code-comment references to the memory file)
// OR the literal `GAM-05 lock` (anchors the canonical 4-line anti-pattern comment block —
//   only the 4th line of each block carries the gam_anti_patterns.md path; lines 1-3 contain
//   the word `streak` inside the anti-pattern doc itself, so they need a separate whitelist
//   token. Plan 22-01 lands these comment blocks verbatim above each task-done useCallback).
const STREAK_TOKENS_RE = /\b(streak|consecutiveDays|dayCount|currentStreak|bestStreak|streakReset)\b/i;
const WHITELIST_LINE_RE = /CARE_STREAKS|gam_anti_patterns\.md|GAM-05 lock|streaks weaponize missed days/;
const STREAK_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const streakViolations = [];
function walkSrcForStreakTokens(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (_) { return; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkSrcForStreakTokens(full);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (!STREAK_EXTENSIONS.has(ext)) continue;
      let content;
      try { content = fs.readFileSync(full, 'utf8'); }
      catch (_) { continue; }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (STREAK_TOKENS_RE.test(line) && !WHITELIST_LINE_RE.test(line)) {
          const rel = path.relative(ROOT, full);
          streakViolations.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      }
    }
  }
}
walkSrcForStreakTokens(path.resolve(ROOT, 'src'));
assert(streakViolations.length === 0, 'GAM-05.negative-grep.no-streak-tokens-in-src');
if (streakViolations.length > 0) {
  console.error('--- GAM-05 STREAK VIOLATIONS ---');
  streakViolations.forEach((v) => console.error('  ' + v));
}

// ─── TIER 3 — STRICT cross-phase regression sentinels (NEVER SKIP) ───

// Phase 18 — PlantCard + mood emoji + Toast primitive
assert(modalSrc.includes('PlantHealthBadge'), 'CROSS.GAM-04.healthBadge.MODAL-USAGE-PRESERVED');
assert(readSafe('src/components/PlantHealthBadge.tsx') !== null, 'CROSS.GAM-04.healthBadge.FILE-NOT-DELETED');
assert(/Gesture\.Pan|GestureDetector/.test(plantCardSrc), 'CROSS.CARD-01.plantcard.gesture-pan-preserved');
assert(plantCardSrc.includes('moodEmoji') && plantCardSrc.includes('moodBadge'), 'CROSS.GAM-03.plantcard.mood-emoji-preserved');
assert(readSafe('src/components/Toast.tsx') !== null, 'CROSS.Toast.FILE-NOT-DELETED');

// Phase 19 — TOX-03 / TOX-04 / TOX-06
assert(plantCardSrc.includes('PetToxicityBadge'), 'CROSS.TOX-03.plantcard.toxicity-badges-preserved');
assert(modalSrc.includes('MascotasContent') || modalSrc.includes('emoji="🐾"'), 'CROSS.TOX-04.modal.mascotas-section-preserved');
assert(modalSrc.includes('initialSection?: ModalSectionId'), 'CROSS.TOX-04.modal.initialSection-preserved');
assert(/petToxicity[^]*?symptoms/.test(checkScript), 'CROSS.TOX-06.checkScript.symptoms-extension-preserved');

// Phase 20 — FERT-03 / FERT-06 / FERT-07
assert(plantLogicSrc.includes("'fertilize'") || plantLogicSrc.includes('"fertilize"'), 'CROSS.FERT-03.plantLogic.fertilize-emit');
assert(schedulerSrc.includes("'fertilize'") || schedulerSrc.includes('"fertilize"') || schedulerSrc.includes('fertilizeTasks'), 'CROSS.FERT-03.scheduler.fertilize-filter');
assert(readSafe('src/components/plant-detail/FertilizeCard.tsx') !== null, 'CROSS.FERT-06.FertilizeCard.FILE-NOT-DELETED');
assert(/fertilizer\.(industrial|homemade)/.test(checkScript), 'CROSS.FERT-07.checkScript.fertilizer-extension-preserved');

// Phase 21 — JOURNAL-01 / JOURNAL-02 / JOURNAL-04 / JOURNAL-05
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

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 22-01/02 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
}
console.log(`[Phase 22 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
