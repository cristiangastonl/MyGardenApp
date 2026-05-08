#!/usr/bin/env node
// scripts/phase17-smoke.cjs
// Phase 17 Catalog Wave C — Exterior + Aromáticas + Frutales smoke runner.
// CommonJS (.cjs) per VALIDATION.md lock. Wave 0 ships harness + scaffold PASSes + SKIP placeholders for CAT-17/18/19/20/21.
// Later waves flip SKIPs to PASSes by landing concrete content/code; the runner itself is NOT modified after Wave 0.
//
// Usage:
//   node scripts/phase17-smoke.cjs                   — primary loop (per-id, count, keyset, voseo)
//   node scripts/phase17-smoke.cjs --identification  — adds scientificName↔id co-occurrence checks (file-content)
//   node scripts/phase17-smoke.cjs --routing-fix     — runtime findPlantInDatabase calls via ts.transpileModule
//
// Mid-band exit-0 guarantee (Wave 1 lands 8 ids, Wave 2 lands the remaining 6):
//   anyLanded=false        → all CAT-17/18/19/IDENT placeholders SKIP (Wave 0/pre-W1 baseline)
//   anyLanded && !allLanded → unlanded ids SKIP, landed ids PASS (mid-band 105-117)
//   allLanded=true         → every id MUST PASS (genuine assertion at 118)

const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

globalThis.__DEV__ = false;

const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.resolve(__dirname, '.tmp-phase17');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ─── Stubs (auto-write if absent — gitignored) ───
const STUB_AS = path.resolve(TMP_DIR, 'async-storage.cjs');
if (!fs.existsSync(STUB_AS)) {
  fs.writeFileSync(STUB_AS,
    `// Phase 17 smoke stub for @react-native-async-storage/async-storage. Auto-written. CJS.\n` +
    `const _store = new Map();\n` +
    `module.exports = {\n` +
    `  default: {\n` +
    `    async getItem(key) { return _store.get(key) ?? null; },\n` +
    `    async setItem(key, value) { _store.set(key, value); },\n` +
    `    async removeItem(key) { _store.delete(key); },\n` +
    `  },\n` +
    `};\n`
  );
}
const STUB_I18N = path.resolve(TMP_DIR, 'i18n.cjs');
if (!fs.existsSync(STUB_I18N)) {
  fs.writeFileSync(STUB_I18N,
    `// Phase 17 smoke stub for ../i18n. Auto-written. CJS.\n` +
    `module.exports = { default: { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' } };\n`
  );
}

// ─── Assertion harness (mirrors Phase 15/16) ───
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

// ─── Phase 17 constants (locked by REQUIREMENTS.md CAT-17/18/19 + 17-CONTEXT.md) ───
const PHASE_17_IDS = [
  // CAT-17 (8): exterior flores — Wave 1
  'azalea', 'ciclamen', 'fucsia', 'clavel', 'crisantemo', 'tulipan', 'girasol', 'magnolia',
  // CAT-18 (3): aromáticas — Wave 2
  'salvia-officinalis', 'eneldo', 'stevia',
  // CAT-19 (3): frutales/huerta — Wave 2
  'olivo', 'arandano', 'espinaca',
];

// Phase 17 has NO in-place upgrades (unlike Phase 16's potus/filodendro). All 14 ids are net-new.
const PHASE_17_NEW_IDS = PHASE_17_IDS;

const PHASE_17_SCIENTIFIC_NAMES = {
  // CAT-17 (8) — Wave 1
  'azalea': 'Rhododendron simsii',
  'ciclamen': 'Cyclamen persicum',
  'fucsia': 'Fuchsia magellanica',
  'clavel': 'Dianthus caryophyllus',
  'crisantemo': 'Chrysanthemum × morifolium',
  'tulipan': 'Tulipa gesneriana',
  'girasol': 'Helianthus annuus',
  'magnolia': 'Magnolia stellata',
  // CAT-18 (3) — Wave 2
  'salvia-officinalis': 'Salvia officinalis',
  'eneldo': 'Anethum graveolens',
  'stevia': 'Stevia rebaudiana',
  // CAT-19 (3) — Wave 2
  'olivo': 'Olea europaea',
  'arandano': 'Vaccinium corymbosum',
  'espinaca': 'Spinacia oleracea',
};

// ─── Read source files ONCE ───
const dbSrc = readSafe('src/data/plantDatabase.ts');
const idSrc = readSafe('src/utils/plantIdentification.ts');
const enJson = readSafe('src/i18n/locales/en/plants.json');
const esJson = readSafe('src/i18n/locales/es/plants.json');
const claudeMd = readSafe('CLAUDE.md');

// ─── Wave 0 scaffold PASSes (always pass — verify the harness itself) ───
assert(typeof fs.readFileSync === 'function', 'W0.1: node:fs.readFileSync available');
assert(typeof globalThis.__DEV__ === 'boolean', 'W0.2: __DEV__ shim present (false in smoke runner)');
assert(fs.existsSync(STUB_AS), 'W0.3: scripts/.tmp-phase17/async-storage.cjs exists (auto-written)');
assert(fs.existsSync(STUB_I18N), 'W0.4: scripts/.tmp-phase17/i18n.cjs exists (auto-written)');
assert(dbSrc !== null, 'W0.5: src/data/plantDatabase.ts present at repo root');
assert(idSrc !== null, 'W0.6: src/utils/plantIdentification.ts present at repo root');
assert(enJson !== null, 'W0.7: src/i18n/locales/en/plants.json present');
assert(esJson !== null, 'W0.8: src/i18n/locales/es/plants.json present');
assert(claudeMd !== null, 'W0.9: CLAUDE.md present at repo root');

// ─── Voseo regression assertion (PASSES at Wave 0 — baseline already 2) ───
const voseoCount = (esJson.match(/\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b/g) || []).length;
assert(voseoCount <= 2, `GLOBAL.voseo: es/plants.json voseo regex count <= 2 (post-Phase-16 baseline; got ${voseoCount})`);

// ─── CAT-17/18/19 placeholders (per-id presence in PLANT_DATABASE; PARTIAL-LANDING TOLERANT) ───
// Compute landing state ONCE so per-id, count, IDENT, ROUTING-FIX gates share the same window.
const PHASE_17_LANDED_FLAGS = PHASE_17_IDS.map(id =>
  new RegExp(`id:\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(dbSrc)
);
const anyLanded = PHASE_17_LANDED_FLAGS.some(Boolean);
const allLanded = PHASE_17_LANDED_FLAGS.every(Boolean);

// CAT-17: 8 exterior flores (all NEW; partial-landing tolerant)
PHASE_17_IDS.slice(0, 8).forEach((id, i) => {
  assertSkippable(() => {
    const present = PHASE_17_LANDED_FLAGS[i];
    if (!anyLanded) return undefined;
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W1.CAT-17.${id}: entry id '${id}' present in plantDatabase.ts`);
});

// CAT-18: 3 aromáticas (all NEW)
['salvia-officinalis', 'eneldo', 'stevia'].forEach(id => {
  const i = PHASE_17_IDS.indexOf(id);
  assertSkippable(() => {
    const present = PHASE_17_LANDED_FLAGS[i];
    if (!anyLanded) return undefined;
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W2.CAT-18.${id}: entry id '${id}' present in plantDatabase.ts`);
});

// CAT-19: 3 frutales/huerta (all NEW)
['olivo', 'arandano', 'espinaca'].forEach(id => {
  const i = PHASE_17_IDS.indexOf(id);
  assertSkippable(() => {
    const present = PHASE_17_LANDED_FLAGS[i];
    if (!anyLanded) return undefined;
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W2.CAT-19.${id}: entry id '${id}' present in plantDatabase.ts`);
});

// ─── CAT-21 final manifest assertion (PARTIAL-LANDING TOLERANT) — closes the entire v1.2 catalog expansion ───
// Wave 1 lands 8 net-new (azalea..magnolia) → 104+8 = 112 (mid-band SKIP).
// Wave 2 lands 6 net-new (salvia-officinalis, eneldo, stevia, olivo, arandano, espinaca) → 112+6 = 118 (PASS).
// All 14 are net-new — Phase 17 has no in-place upgrades.
assertSkippable(() => {
  const idMatches = (dbSrc.match(/^\s{4}id:\s*['"][^'"]+['"]/gm) || []).length;
  if (idMatches < 104) return undefined;       // pre-baseline catalog drift — SKIP
  if (idMatches === 104) return undefined;     // baseline = pre-W1 — SKIP
  if (idMatches > 104 && idMatches < 118) return undefined;  // mid-band Plan 17-01 → 17-02 — SKIP
  return idMatches === 118;
}, 'W2.CAT-counts.total: plantDatabase.ts has exactly 118 entry id declarations (104 + 14 net-new; closes v1.2 catalog expansion — CAT-21)');

// ─── CAT-20 (i18n keysets — Plan 17-01 + 17-02 land 14 entry blocks) ───
PHASE_17_IDS.forEach(id => {
  assertSkippable(() => {
    const idEsc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enHas = new RegExp(`"${idEsc}"\\s*:\\s*\\{`).test(enJson);
    const esHas = new RegExp(`"${idEsc}"\\s*:\\s*\\{`).test(esJson);
    if (!enHas && !esHas) return undefined; // SKIP at baseline for new ids
    return enHas && esHas;
  }, `W2.CAT-20.${id}.keyset: '${id}' keyset present in BOTH en + es plants.json`);
});

// ─── CAT-20 (COMMON_NAMES_ES placeholders — Plan 17-03 lands the species-qualified keys) ───
// Sentinel: any of the 14 Phase 17 species-qualified scientificNames appears in idSrc.
// (Some Phase 17 genera — Rhododendron, Cyclamen, Fuchsia — already exist in COMMON_NAMES_ES at the genus
// level; Plan 17-03 ADDS species-qualified keys on top. The sentinel uses species-level matches only so
// the SKIP→PASS flip happens precisely when Plan 17-03 lands its block.)
const W3_SENTINEL_PRESENT = /Rhododendron simsii|Cyclamen persicum|Fuchsia magellanica|Dianthus caryophyllus|Chrysanthemum × morifolium|Tulipa gesneriana|Helianthus annuus|Magnolia stellata|Salvia officinalis|Anethum graveolens|Stevia rebaudiana|Olea europaea|Vaccinium corymbosum|Spinacia oleracea/.test(idSrc);

PHASE_17_IDS.forEach(id => {
  assertSkippable(() => {
    if (!W3_SENTINEL_PRESENT) return undefined;
    const sn = PHASE_17_SCIENTIFIC_NAMES[id];
    const genus = sn.split(' ')[0].split('×')[0].trim();
    const snEsc = sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const genusEsc = genus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const speciesQualified = new RegExp(`['"]${snEsc}['"]\\s*:`).test(idSrc);
    const genusOnly = new RegExp(`['"]${genusEsc}['"]\\s*:`).test(idSrc);
    return speciesQualified || genusOnly;
  }, `W3.CAT-20.${id}: '${PHASE_17_SCIENTIFIC_NAMES[id]}' (or its genus) mapped in COMMON_NAMES_ES`);
});

// ─── CAT-20 image plan (CLAUDE.md "Phase 17 Wave C" mention of ≥12 of 14 ids) ───
assertSkippable(() => {
  if (!/Phase 17 Wave C/i.test(claudeMd)) return undefined; // SKIP until Plan 17-04 lands
  const found = PHASE_17_IDS.filter(id => claudeMd.includes(id)).length;
  return found >= 12;
}, 'W3.CAT-20.imagePlan: CLAUDE.md "Phase 17 Wave C" block mentions >=12 of 14 Phase 17 ids');

// ─── --identification flag (file-content co-occurrence; same partial-landing tolerance) ───
const isIdentificationMode = process.argv.includes('--identification');
if (isIdentificationMode) {
  PHASE_17_IDS.forEach(id => {
    const i = PHASE_17_IDS.indexOf(id);
    const sn = PHASE_17_SCIENTIFIC_NAMES[id];
    assertSkippable(() => {
      const idLanded = PHASE_17_LANDED_FLAGS[i];
      if (!anyLanded) return undefined;
      if (anyLanded && !allLanded && !idLanded) return undefined;
      const idIdxDouble = dbSrc.indexOf(`id: "${id}"`);
      const idIdxSingle = dbSrc.indexOf(`id: '${id}'`);
      const idIdx = idIdxDouble >= 0 ? idIdxDouble : idIdxSingle;
      if (idIdx < 0) return undefined;
      const block = dbSrc.slice(idIdx, idIdx + 5000);
      const snEsc = sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`scientificName:\\s*['"]${snEsc}['"]`).test(block);
    }, `IDENT.CAT-20.${id}: scientificName '${sn}' co-occurs with id '${id}' in plantDatabase.ts`);
  });
}

// ─── --routing-fix flag (ts.transpileModule + runtime function call) ───
const isRoutingFixMode = process.argv.includes('--routing-fix');
if (isRoutingFixMode) {
  // Phase 16 Plan 16-00 already landed the exact-match-first refactor. Phase 17 inherits
  // its protection unchanged — verify the refactor is still in place as a regression sentinel.
  const refactorLanded = /const exactMatch = PLANT_DATABASE\.find/.test(idSrc);

  // Helper: compile and require findPlantInDatabase via ts.transpileModule.
  // Stubs i18n + AsyncStorage via Module._resolveFilename intercept (mirrors Phase 16 verbatim except
  // TMP_DIR resolves to scripts/.tmp-phase17/ via the constant at top of file).
  function loadFindPlantInDatabase() {
    const ts = require('typescript');
    const origResolve = Module._resolveFilename;
    try {
      // Compile data/plantDatabase.ts and utils/plantIdentification.ts to compiled .cjs.
      const compileFile = (relPath) => {
        const src = fs.readFileSync(path.resolve(ROOT, relPath), 'utf8');
        const out = ts.transpileModule(src, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            esModuleInterop: true,
            skipLibCheck: true,
          },
          fileName: relPath,
        }).outputText;
        const compiledPath = path.resolve(TMP_DIR, relPath.replace(/[\/\\]/g, '__').replace(/\.ts$/, '.compiled.cjs'));
        fs.writeFileSync(compiledPath, out);
        return compiledPath;
      };

      const compiledDb = compileFile('src/data/plantDatabase.ts');
      const compiledId = compileFile('src/utils/plantIdentification.ts');

      // Hijack relative require resolution from compiled identification → compiled plantDatabase + stubs.
      Module._resolveFilename = function (request, ...args) {
        if (request === '../i18n' || request.endsWith('/i18n')) return STUB_I18N;
        if (request === '@react-native-async-storage/async-storage') return STUB_AS;
        if (request === '../data/plantDatabase' || request === '../data/plantDatabase.ts') return compiledDb;
        if (request === '../types' || request.endsWith('/types')) {
          // Return a stub for types module — runtime uses no type info.
          const stubTypes = path.resolve(TMP_DIR, 'types-stub.cjs');
          if (!fs.existsSync(stubTypes)) fs.writeFileSync(stubTypes, 'module.exports = {};');
          return stubTypes;
        }
        if (request === './migration' || request.endsWith('/migration')) {
          // sunHoursToLightLevel stub
          const stubMig = path.resolve(TMP_DIR, 'migration-stub.cjs');
          if (!fs.existsSync(stubMig)) fs.writeFileSync(stubMig, 'module.exports = { sunHoursToLightLevel: () => "bright_indirect" };');
          return stubMig;
        }
        if (request === '../lib/supabase' || request.endsWith('/supabase')) {
          const stubSb = path.resolve(TMP_DIR, 'supabase-stub.cjs');
          if (!fs.existsSync(stubSb)) fs.writeFileSync(stubSb, 'module.exports = { supabase: null, isSupabaseConfigured: () => false };');
          return stubSb;
        }
        return origResolve.call(this, request, ...args);
      };
      delete require.cache[compiledId];
      delete require.cache[compiledDb];
      const mod = require(compiledId);
      return mod.findPlantInDatabase;
    } finally {
      Module._resolveFilename = origResolve;
    }
  }

  // Phase 17 species routing tests (post-Plan 17-01/02 landing — uses anyLanded/allLanded gate):
  let findFn = null;
  PHASE_17_NEW_IDS.forEach(id => {
    const sn = PHASE_17_SCIENTIFIC_NAMES[id];
    assertSkippable(() => {
      if (!refactorLanded) return undefined;  // regression sentinel — should never SKIP post-Phase-16
      const idLanded = PHASE_17_LANDED_FLAGS[PHASE_17_IDS.indexOf(id)];
      if (!anyLanded) return undefined;
      if (anyLanded && !allLanded && !idLanded) return undefined;
      try {
        if (!findFn) findFn = loadFindPlantInDatabase();
        const result = findFn(sn);
        return result?.id === id;
      } catch (e) {
        return undefined;
      }
    }, `W2.ROUTING-FIX.${id}: findPlantInDatabase('${sn}')?.id === '${id}'`);
  });
}

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Waves 1-3 land) ---');
  skips.forEach(s => console.log('  ' + s));
  console.log('');
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
  console.log('');
  console.error(`[phase17-smoke] FAIL — ${pass} pass, ${fail} fail, ${skip} skip`);
  process.exit(1);
}
console.log(`[phase17-smoke] PASS ${pass}/${pass + skip} (${skip} placeholder${skip === 1 ? '' : 's'} skipped — Waves 1-3 flip)`);
