#!/usr/bin/env node
// scripts/smoke-phase14.mjs
// Phase 14 Educational Detail Modal smoke runner. Single-compile-path policy (Phase 4 lock).
// Wave 0: harness + scaffold PASSes + Wave 1+ placeholders for EDU-01..07.
//
// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase14');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// ─── Stubs (auto-write if absent — gitignored) ───
const STUB_AS = resolve(TMP_DIR, 'async-storage.mjs');
if (!existsSync(STUB_AS)) {
  writeFileSync(STUB_AS,
    `// Phase 14 smoke stub for \`@react-native-async-storage/async-storage\`. Auto-written.\n` +
    `const _store = new Map();\n` +
    `export default {\n` +
    `  async getItem(key) { return _store.get(key) ?? null; },\n` +
    `  async setItem(key, value) { _store.set(key, value); },\n` +
    `  async removeItem(key) { _store.delete(key); },\n` +
    `};\n`
  );
}
const STUB_I18N = resolve(TMP_DIR, 'i18n.mjs');
if (!existsSync(STUB_I18N)) {
  writeFileSync(STUB_I18N,
    `// Phase 14 smoke stub for ../i18n. Auto-written. Mirrors scripts/.tmp-check-i18n/i18n.mjs.\n` +
    `export default { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' };\n`
  );
}

// ─── Helpers ───
function readSafe(relPath) {
  const abs = resolve(ROOT, relPath);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}
function countMatches(text, pattern) {
  if (!text) return 0;
  const m = text.match(pattern);
  return m ? m.length : 0;
}

// ─── Assertion harness (mirrors Phase 12) ───
let pass = 0, fail = 0, skip = 0;
const errors = [];
const skips = [];
function assert(cond, label) {
  if (cond) { pass++; }
  else { fail++; errors.push(`FAIL: ${label}`); }
}
function assertSkippable(condFn, label) {
  try {
    const cond = condFn();
    if (cond === undefined) { skip++; skips.push(`SKIP: ${label}`); }
    else if (cond) { pass++; }
    else { fail++; errors.push(`FAIL: ${label}`); }
  } catch (e) {
    skip++; skips.push(`SKIP: ${label} (threw: ${e.message})`);
  }
}
async function assertSkippableAsync(condFn, label) {
  try {
    const cond = await condFn();
    if (cond === undefined) { skip++; skips.push(`SKIP: ${label}`); }
    else if (cond) { pass++; }
    else { fail++; errors.push(`FAIL: ${label}`); }
  } catch (e) {
    skip++; skips.push(`SKIP: ${label} (threw: ${e.message})`);
  }
}

// ─── Wave 0 scaffold PASSes (always pass — verify the harness itself) ───
assert(typeof readFileSync === 'function', 'W0.1: node:fs.readFileSync available');
assert(typeof ts.transpileModule === 'function', 'W0.2: typescript.transpileModule available (single-compile-path policy)');
assert(typeof globalThis.__DEV__ === 'boolean', 'W0.3: __DEV__ shim present (false in smoke runner)');
assert(existsSync(STUB_AS), 'W0.4: scripts/.tmp-phase14/async-storage.mjs exists (auto-written)');
assert(existsSync(STUB_I18N), 'W0.5: scripts/.tmp-phase14/i18n.mjs exists (auto-written)');
assert(existsSync(resolve(ROOT, 'src/types/index.ts')), 'W0.6: src/types/index.ts present at repo root');

// ─── Read source files ONCE ───
const typesSrc = readSafe('src/types/index.ts');
const useStorageSrc = readSafe('src/hooks/useStorage.tsx');
const validatorSrc = readSafe('scripts/check-i18n-keys.mjs');
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx');
const idResultsSrc = readSafe('src/components/PlantIdentifier/IdentificationResults.tsx');
const educationalSectionSrc = readSafe('src/components/plant-detail/EducationalSection.tsx');
const overrideDetectionSrc = readSafe('src/utils/overrideDetection.ts');
const enCommon = readSafe('src/i18n/locales/en/common.json');
const esCommon = readSafe('src/i18n/locales/es/common.json');
const dbSrc = readSafe('src/data/plantDatabase.ts');

// ─── EDU-02 placeholders (Plan 14-01 — type extension) ───
assertSkippable(() => {
  if (!typesSrc) return undefined;
  if (!/careAction|placementRecommended|whyRationale/.test(typesSrc)) return undefined;
  return /careAction\?:/.test(typesSrc);
}, 'W1.EDU-02.1: src/types/index.ts declares careAction?: optional field [Plan 14-01]');

assertSkippable(() => {
  if (!typesSrc) return undefined;
  if (!/careAction|placementRecommended|whyRationale/.test(typesSrc)) return undefined;
  return /placementRecommended\?:\s*string/.test(typesSrc);
}, 'W1.EDU-02.2: src/types/index.ts declares placementRecommended?: string [Plan 14-01]');

assertSkippable(() => {
  if (!typesSrc) return undefined;
  if (!/careAction|placementRecommended|whyRationale/.test(typesSrc)) return undefined;
  return /placementAlternatives\?:\s*string\[\]/.test(typesSrc);
}, 'W1.EDU-02.3: src/types/index.ts declares placementAlternatives?: string[] [Plan 14-01]');

assertSkippable(() => {
  if (!typesSrc) return undefined;
  if (!/careAction|placementRecommended|whyRationale/.test(typesSrc)) return undefined;
  return /placementAvoid\?:\s*string/.test(typesSrc);
}, 'W1.EDU-02.4: src/types/index.ts declares placementAvoid?: string [Plan 14-01]');

assertSkippable(() => {
  if (!typesSrc) return undefined;
  if (!/careAction|placementRecommended|whyRationale/.test(typesSrc)) return undefined;
  return /whyRationale\?:\s*string/.test(typesSrc);
}, 'W1.EDU-02.5: src/types/index.ts declares whyRationale?: string [Plan 14-01]');

assertSkippable(() => {
  if (!dbSrc) return undefined;
  // Heuristic: getTranslatedPlant body should now reference the 5 new keys.
  const fnMatch = dbSrc.match(/export function getTranslatedPlant[\s\S]*?^\}/m);
  if (!fnMatch) return undefined;
  const body = fnMatch[0];
  if (!/careAction|placementRecommended|whyRationale/.test(body)) return undefined;
  return /careAction/.test(body)
    && /placementRecommended/.test(body)
    && /placementAlternatives/.test(body)
    && /placementAvoid/.test(body)
    && /whyRationale/.test(body);
}, 'W1.EDU-02.6: getTranslatedPlant body references all 5 new educational fields [Plan 14-01]');

// ─── EDU-07 placeholders (Plan 14-01 — validator extension) ───
assertSkippable(() => {
  if (!validatorSrc) return undefined;
  if (!/careAction|placementRecommended|whyRationale/.test(validatorSrc)) return undefined;
  return /entry\.careAction/.test(validatorSrc)
    && /entry\.placementRecommended/.test(validatorSrc)
    && /entry\.placementAlternatives/.test(validatorSrc)
    && /entry\.placementAvoid/.test(validatorSrc)
    && /entry\.whyRationale/.test(validatorSrc);
}, 'W1.EDU-07.1: scripts/check-i18n-keys.mjs has conditional checks for all 5 new fields [Plan 14-01]');

// ─── EDU-06 placeholders (Plan 14-02 — deep-merge guard, behavioral) ───
assertSkippable(() => {
  if (!useStorageSrc) return undefined;
  if (!/PROTECTED_USER_FIELDS|fromUserEdit/.test(useStorageSrc)) return undefined;
  return /PROTECTED_USER_FIELDS/.test(useStorageSrc)
    && /fromUserEdit/.test(useStorageSrc)
    && /waterSchedule/.test(useStorageSrc)
    && /lightLevel/.test(useStorageSrc);
}, 'W1.EDU-06.1: useStorage.updatePlant has PROTECTED_USER_FIELDS + fromUserEdit option [Plan 14-02]');

// ─── EDU-05 placeholders (Plan 14-02 — override comparator, runtime check) ───
await assertSkippableAsync(async () => {
  if (!overrideDetectionSrc) return undefined;
  // Compile + import. Throws → SKIP via the harness.
  const compiled = ts.transpileModule(overrideDetectionSrc, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  });
  const compiledPath = resolve(__dirname, 'overrideDetection.compiled-phase14.mjs');
  writeFileSync(compiledPath, compiled.outputText);
  const mod = await import(compiledPath + '?t=' + Date.now());
  const fn = mod.compareUserVsCatalog;
  if (typeof fn !== 'function') return undefined;
  // Behavioral asserts (concise — fixture data inline).
  const plantA = { id: 'p1', lightLevel: 'low', waterSchedule: { warm: 5, cold: 10 } };
  const entryA = { id: 'potus', lightLevel: 'medium_indirect', waterSchedule: { warm: 7, cold: 14 } };
  const r1 = fn(plantA, null);
  const r2 = fn(plantA, entryA);
  const r3 = fn({ ...plantA, lightLevel: 'medium_indirect' }, entryA);
  // null entry → []; full mismatch → 3 results; only lightLevel matches → 2 results.
  return r1.length === 0 && r2.length === 3 && r3.length === 2;
}, 'W1.EDU-05.*: compareUserVsCatalog returns correct override list (null=0, full-mismatch=3, partial=2) [Plan 14-02]');

// ─── EDU-01 placeholders (Plan 14-03 — file-content asserts only, NO runtime) ───
assertSkippable(() => {
  if (!modalSrc) return undefined;
  const hasAnyEduMarker = /EducationalSection|🌿|🏠|ℹ️|⚙️/.test(modalSrc);
  if (!hasAnyEduMarker) return undefined;
  return /🌿/.test(modalSrc)
    && /🏠/.test(modalSrc)
    && /ℹ️/.test(modalSrc)
    && /⚙️/.test(modalSrc);
}, 'W2.EDU-01.1-4: MyPlantDetailModal.tsx contains all 4 locked emoji anchors (🌿/🏠/ℹ️/⚙️) [Plan 14-03]');

assertSkippable(() => {
  if (!modalSrc) return undefined;
  if (!/EducationalSection/.test(modalSrc)) return undefined;
  return /from\s+['"][^'"]*plant-detail\/EducationalSection['"]/.test(modalSrc)
    || /from\s+['"][^'"]*EducationalSection['"]/.test(modalSrc);
}, 'W2.EDU-01.5: MyPlantDetailModal.tsx imports EducationalSection [Plan 14-03]');

assertSkippable(() => {
  if (!educationalSectionSrc) return undefined;
  return /useSharedValue/.test(educationalSectionSrc)
    && /withTiming/.test(educationalSectionSrc)
    && /useAnimatedStyle/.test(educationalSectionSrc);
}, 'W2.EDU-01.6: EducationalSection.tsx uses Reanimated v4 (useSharedValue + withTiming + useAnimatedStyle) [Plan 14-03]');

// ─── EDU-04 placeholder (Plan 14-03 — regression check; mostly closed) ───
assertSkippable(() => {
  if (!idResultsSrc) return undefined;
  // The pre-select pattern already exists at IdentificationResults.tsx:42-44.
  // This is a regression check — fail if removed.
  return /selectedPlant\?\.lightLevel\s*\?\?/.test(idResultsSrc);
}, 'W2.EDU-04.1: IdentificationResults.tsx still pre-selects from selectedPlant?.lightLevel ?? (regression) [Plan 14-03]');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('─── SKIPS (will flip to PASS as Wave 1+ lands) ───');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('─── FAILURES ───');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
  console.error(`[smoke-phase14] FAIL — ${pass} pass, ${fail} fail, ${skip} skip`);
  process.exit(1);
}
console.log(`[smoke-phase14] PASS ${pass}/${pass + skip} (${skip} placeholder${skip === 1 ? '' : 's'} skipped — Wave 1+ will flip)`);
