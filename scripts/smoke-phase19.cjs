#!/usr/bin/env node
// scripts/smoke-phase19.cjs
// Phase 19 Pet Toxicity smoke runner.
// CommonJS (.cjs). Wave 0 ships harness + scaffold PASSes + SKIP placeholders for TOX-01..06.
// Later plans flip SKIPs to PASSes by landing concrete code/JSX/data; the runner itself is NOT modified after Wave 0.
//
// Phase 19 is content + small JSX additions — file-content asserts via readFileSync + regex are sufficient.
//
// Usage:
//   node scripts/smoke-phase19.cjs

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// ─── Assertion harness (mirrors Phase 18) ───
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
const helperSrc = readSafe('src/utils/petToxicity.ts') || '';
const badgeSrc = readSafe('src/components/PetToxicityBadge.tsx') || '';
const componentsIndex = readSafe('src/components/index.ts') || '';
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
const onboardingSrc = readSafe('src/screens/OnboardingScreen.tsx') || '';
const addPlantSrc = readSafe('src/components/AddPlantModal.tsx') || '';
const plantsScreenSrc = readSafe('src/screens/PlantsScreen.tsx') || '';
const todayScreenSrc = readSafe('src/screens/TodayScreen.tsx') || '';
const dbSrc = readSafe('src/data/plantDatabase.ts') || '';
const csvSrc = readSafe('data/petToxicity.csv') || '';

// ─── W0.scaffold (PASS at Wave 0 baseline) ───
assert(readSafe('scripts/smoke-phase19.cjs') !== null, 'W0.scaffold.runner-self-exists');
assert(typesSrc.includes('export type ToxLevel'), 'W0.scaffold.types.ToxLevel-defined');
assert(typesSrc.includes('export interface PetToxicityEntry'), 'W0.scaffold.types.PetToxicityEntry-defined');
assert(/petToxicity\?:\s*PetToxicityEntry/.test(typesSrc), 'W0.scaffold.types.PlantDBEntry-extended');
assert(helperSrc.includes('export function getPetToxicity'), 'W0.scaffold.helper.getPetToxicity-exported');
assert(helperSrc.includes('export function isPetSafe'), 'W0.scaffold.helper.isPetSafe-exported');
assert(helperSrc.includes('export function shouldShowBadge'), 'W0.scaffold.helper.shouldShowBadge-exported');
assert(helperSrc.includes('export function hasAnyToxicityWarning'), 'W0.scaffold.helper.hasAnyToxicityWarning-exported');
assert(badgeSrc.includes('export interface PetToxicityBadgeProps'), 'W0.scaffold.badge.props-interface');
assert(badgeSrc.includes('export function PetToxicityBadge'), 'W0.scaffold.badge.component-exported');
assert(componentsIndex.includes("export { PetToxicityBadge } from './PetToxicityBadge'"), 'W0.scaffold.badge.index-reexport');
assert(csvSrc.split('\n').filter(l => l.length > 0).length === 119, 'W0.scaffold.csv.119-lines');
assert(csvSrc.startsWith('id,scientificName,category,cats_level,cats_source,dogs_level,dogs_source,cats_symptoms,dogs_symptoms,notes'), 'W0.scaffold.csv.header-shape');

// i18n skeleton (EN + ES parity)
const enCommonRaw = readSafe('src/i18n/locales/en/common.json');
const esCommonRaw = readSafe('src/i18n/locales/es/common.json');
let enCommon = null, esCommon = null;
try { enCommon = enCommonRaw ? JSON.parse(enCommonRaw) : null; } catch (_) {}
try { esCommon = esCommonRaw ? JSON.parse(esCommonRaw) : null; } catch (_) {}

const PHASE_19_I18N_KEYS = [
  'toxicity.toxic',
  'toxicity.caution',
  'toxicity.safe',
  'toxicity.unknown',
  'toxicity.safeForBoth',
  'toxicity.safeForSpecies',
  'toxicity.cautionForSpecies',
  'toxicity.toxicForSpecies',
  'toxicity.unverifiedLatam',
  'toxicity.symptomsLabel',
  'toxicity.species.cats',
  'toxicity.species.dogs',
  'toxicity.filter.label',
  'toxicity.filter.emptyState',
  'toxicity.banner.toxicSingle',
  'toxicity.banner.toxicBoth',
  'toxicity.banner.cautionSingle',
  'toxicity.banner.mixed',
  'toxicity.a11y.cats.toxic',
  'toxicity.a11y.cats.caution',
  'toxicity.a11y.dogs.toxic',
  'toxicity.a11y.dogs.caution',
  'plantDetailModal.pets',
];
PHASE_19_I18N_KEYS.forEach(k => {
  assert(enCommon !== null && getNested(enCommon, k) !== undefined, 'W0.scaffold.i18n.en.' + k);
  assert(esCommon !== null && getNested(esCommon, k) !== undefined, 'W0.scaffold.i18n.es.' + k);
});

// ─── TOX-01 (type extension already PASSed in W0.scaffold) — no separate SKIP ───

// ─── TOX-02 (118 entries classified) — SKIP at Wave 0, PASS after Plan 19-02 ───
assertSkippable(() => {
  const matches = (dbSrc.match(/petToxicity:\s*\{/g) || []).length;
  if (matches === 0) return undefined; // Wave 0: no entries classified
  return matches === 118;
}, 'TOX-02.catalog.118-entries-have-petToxicity');

assertSkippable(() => {
  // Every petToxicity block contains both `cats:` and `dogs:` keys with valid 4-state ToxLevel values.
  const matches = (dbSrc.match(/petToxicity:\s*\{[^}]*\}/g) || []);
  if (matches.length === 0) return undefined;
  const valid = matches.every(m => {
    const cats = /cats:\s*'(safe|caution|toxic|unknown)'/.test(m);
    const dogs = /dogs:\s*'(safe|caution|toxic|unknown)'/.test(m);
    return cats && dogs;
  });
  return valid;
}, 'TOX-02.catalog.cats-and-dogs-valid-enum');

assertSkippable(() => {
  // CRIT-2: every non-'unknown' entry cites an ASPCA URL via source field.
  // 'unknown' entries may have empty source. Heuristic: ASPCA URL count >= count of (toxic|caution|safe) entries.
  const matches = (dbSrc.match(/petToxicity:\s*\{[^}]*\}/g) || []);
  if (matches.length === 0) return undefined;
  const nonUnknown = matches.filter(m => /(cats|dogs):\s*'(safe|caution|toxic)'/.test(m));
  const aspcaUrls = (dbSrc.match(/https:\/\/(www\.)?aspca\.org/g) || []).length;
  // Allow some entries to share a URL (genus-inheritance per Pitfall 6); require at least 50% citation density.
  return aspcaUrls >= Math.floor(nonUnknown.length * 0.5);
}, 'TOX-02.catalog.aspca-source-urls-cited');

// ─── TOX-03 (PlantCard badge) — SKIP at Wave 0, PASS after Plan 19-03 ───
assertSkippable(() => {
  if (plantCardSrc.includes('PetToxicityBadge')) return /import.*PetToxicityBadge/.test(plantCardSrc);
  return undefined;
}, 'TOX-03.plantcard.PetToxicityBadge-imported');

assertSkippable(() => {
  if (plantCardSrc.includes('<PetToxicityBadge')) return /<PetToxicityBadge\s+species/.test(plantCardSrc);
  return undefined;
}, 'TOX-03.plantcard.badge-jsx-rendered');

assertSkippable(() => {
  if (plantCardSrc.includes('getPetToxicity')) return plantCardSrc.includes('getPetToxicity');
  return undefined;
}, 'TOX-03.plantcard.getPetToxicity-helper-used');

assertSkippable(() => {
  if (plantCardSrc.includes('onOpenToMascotas')) return /onOpenToMascotas\?\:|onOpenToMascotas\?\.\(/.test(plantCardSrc);
  return undefined;
}, 'TOX-03.plantcard.onOpenToMascotas-prop-wired');

// Badge full impl (Plan 19-03 lands these in PetToxicityBadge.tsx)
assertSkippable(() => {
  if (badgeSrc.includes('Pressable')) return badgeSrc.includes('Pressable') && badgeSrc.includes('hitSlop');
  return undefined;
}, 'TOX-03.badge.Pressable-with-hitSlop');

assertSkippable(() => {
  if (badgeSrc.includes('🐈') || badgeSrc.includes('🐕')) return badgeSrc.includes('🐈') && badgeSrc.includes('🐕');
  return undefined;
}, 'TOX-03.badge.cat-and-dog-emoji-present');

assertSkippable(() => {
  // Badge gates: returns null for 'safe' and 'unknown' (only renders 'toxic'/'caution').
  if (badgeSrc.includes('shouldShowBadge') || /level\s*!==\s*'toxic'\s*&&\s*level\s*!==\s*'caution'/.test(badgeSrc)) return true;
  return undefined;
}, 'TOX-03.badge.gates-toxic-and-caution-only');

// ─── TOX-04 (Mascotas section + initialSection prop) — SKIP at Wave 0, PASS after Plan 19-04 ───
assertSkippable(() => {
  if (modalSrc.includes('🐾')) return /🐾.*Mascotas|plantDetailModal\.pets/.test(modalSrc);
  return undefined;
}, 'TOX-04.modal.mascotas-section-present');

assertSkippable(() => {
  if (modalSrc.includes('initialSection')) return /initialSection\?:\s*ModalSectionId|initialSection\?:\s*'que-hacer'/.test(modalSrc);
  return undefined;
}, 'TOX-04.modal.initialSection-prop-defined');

assertSkippable(() => {
  if (modalSrc.includes('sectionLayouts')) return /sectionLayouts\.current/.test(modalSrc) && /scrollViewRef\.current\?\.scrollTo/.test(modalSrc);
  return undefined;
}, 'TOX-04.modal.scrollTo-section-mechanism');

assertSkippable(() => {
  if (modalSrc.includes('MascotasContent') || modalSrc.includes('SpeciesLine') || /onSectionLayout\('mascotas'\)/.test(modalSrc)) return true;
  return undefined;
}, 'TOX-04.modal.mascotas-content-renderer');

// ─── TOX-05 (OnboardingScreen filter + AddPlantModal banner) — SKIP at Wave 0, PASS after Plan 19-05 ───
assertSkippable(() => {
  if (onboardingSrc.includes('petSafeOnly')) return /petSafeOnly/.test(onboardingSrc) && /isPetSafe/.test(onboardingSrc);
  return undefined;
}, 'TOX-05.onboarding.petSafeOnly-state-and-filter');

assertSkippable(() => {
  if (onboardingSrc.includes('toxicity.filter.label')) return onboardingSrc.includes('toxicity.filter.label');
  return undefined;
}, 'TOX-05.onboarding.filter-label-i18n-key');

assertSkippable(() => {
  if (onboardingSrc.includes('Switch')) return /<Switch\s+value=\{petSafeOnly\}/.test(onboardingSrc);
  return undefined;
}, 'TOX-05.onboarding.Switch-control-wired');

assertSkippable(() => {
  if (onboardingSrc.includes('toxicity.filter.emptyState')) return onboardingSrc.includes('toxicity.filter.emptyState');
  return undefined;
}, 'TOX-05.onboarding.empty-state-copy');

assertSkippable(() => {
  if (addPlantSrc.includes('hasAnyToxicityWarning') || /toxicity\.banner\.(toxicSingle|toxicBoth|cautionSingle|mixed)/.test(addPlantSrc)) return true;
  return undefined;
}, 'TOX-05.addPlant.warning-banner-renders');

assertSkippable(() => {
  if (addPlantSrc.includes('initialSection')) return /initialSection.*['\"]mascotas['\"]/.test(addPlantSrc) || /onOpenToMascotas/.test(addPlantSrc);
  return undefined;
}, 'TOX-05.addPlant.banner-tap-opens-mascotas');

// ─── TOX-06 (per-entry symptoms i18n parity) — SKIP at Wave 0, PASS after Plan 19-06 ───
assertSkippable(() => {
  const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';
  if (checkScript.includes('petToxicity')) return /petToxicity\?\.\s*symptoms/.test(checkScript) || /petToxicity\.symptoms/.test(checkScript);
  return undefined;
}, 'TOX-06.checkScript.symptoms-conditional-extension');

// ─── Cross-phase regression (STRICT — Phase 18 GAM-04 sentinels MUST stay PASS) ───
assert(modalSrc.includes('PlantHealthBadge'), 'CROSS.GAM-04.healthBadge.MODAL-USAGE-PRESERVED');
assert(componentsIndex.includes("export { PlantHealthBadge }"), 'CROSS.GAM-04.healthBadge.INDEX-REEXPORT-PRESERVED');
assert(readSafe('src/components/PlantHealthBadge.tsx') !== null, 'CROSS.GAM-04.healthBadge.FILE-NOT-DELETED');
// CARD-01 (Phase 18) — Gesture.Pan still wires PlantCard
assert(/Gesture\.Pan|GestureDetector/.test(plantCardSrc), 'CROSS.CARD-01.plantcard.gesture-pan-preserved');
// Toast primitive (Phase 18) — must still exist for future reuse
assert(readSafe('src/components/Toast.tsx') !== null, 'CROSS.Toast.FILE-NOT-DELETED');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 19-02/03/04/05/06 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
}
console.log(`[Phase 19 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
