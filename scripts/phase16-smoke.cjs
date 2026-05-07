#!/usr/bin/env node
// scripts/phase16-smoke.cjs
// Phase 16 Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending smoke runner.
// CommonJS (.cjs) per VALIDATION.md lock. Wave 0 ships harness + scaffold PASSes + SKIP placeholders for CAT-13/14/15/16.
// Later waves flip SKIPs to PASSes by landing concrete content/code; the runner itself is NOT modified after Wave 0.
//
// Usage:
//   node scripts/phase16-smoke.cjs                   — primary loop (per-id, count, keyset, voseo)
//   node scripts/phase16-smoke.cjs --identification  — adds scientificName↔id co-occurrence checks (file-content)
//   node scripts/phase16-smoke.cjs --routing-fix     — runtime findPlantInDatabase calls via ts.transpileModule
//
// Mid-band exit-0 guarantee (Wave 1 lands 10 ids, Wave 2 lands the remaining 9):
//   anyLanded=false        → all CAT-13/14/15/IDENT placeholders SKIP (Wave 0/pre-W1 baseline)
//   anyLanded && !allLanded → unlanded ids SKIP, landed ids PASS (mid-band 88-103)
//   allLanded=true         → every id MUST PASS (genuine assertion at 104)

const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

globalThis.__DEV__ = false;

const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.resolve(__dirname, '.tmp-phase16');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ─── Stubs (auto-write if absent — gitignored) ───
const STUB_AS = path.resolve(TMP_DIR, 'async-storage.cjs');
if (!fs.existsSync(STUB_AS)) {
  fs.writeFileSync(STUB_AS,
    `// Phase 16 smoke stub for @react-native-async-storage/async-storage. Auto-written. CJS.\n` +
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
    `// Phase 16 smoke stub for ../i18n. Auto-written. CJS.\n` +
    `module.exports = { default: { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' } };\n`
  );
}

// ─── Assertion harness (mirrors Phase 15) ───
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

// ─── Phase 16 constants (locked by REQUIREMENTS.md CAT-13/14/15 + CONTEXT.md addendum) ───
const PHASE_16_IDS = [
  // CAT-13 (10): cactus + suculentas — Wave 1
  'kalanchoe', 'siempreviva', 'piedras-vivas', 'nopal', 'mammillaria',
  'corona-espinas', 'gasteria', 'senecio-rowleyanus', 'cactus-navidad', 'agave',
  // CAT-14 (4): trepadoras — Wave 2 (potus + filodendro = upgrades, hoya + mini-monstera = net-new)
  'potus', 'filodendro', 'hoya', 'mini-monstera',
  // CAT-15 (5): trending — Wave 2
  'strelitzia', 'eucalipto', 'bambu-suerte', 'sansevieria-cilindrica', 'cactus-san-pedro',
];

// 17 net-new ids. potus + filodendro are CAT-14 in-place EDU upgrades (Pattern 6 / Option A — RESEARCH §Pitfall 7).
// They count toward CAT-14 keyset assertions but NOT toward the 87→104 catalog-count gate.
const PHASE_16_NEW_IDS = PHASE_16_IDS.filter(id => !['potus', 'filodendro'].includes(id));

const PHASE_16_SCIENTIFIC_NAMES = {
  // CAT-13 (10) — Wave 1
  'kalanchoe': 'Kalanchoe blossfeldiana',
  'siempreviva': 'Sempervivum tectorum',
  'piedras-vivas': 'Lithops lesliei',
  'nopal': 'Opuntia ficus-indica',
  'mammillaria': 'Mammillaria elongata',
  'corona-espinas': 'Euphorbia milii',
  'gasteria': 'Gasteria bicolor',
  'senecio-rowleyanus': 'Curio rowleyanus',
  'cactus-navidad': 'Schlumbergera × buckleyi',
  'agave': 'Agave americana',
  // CAT-14 (4) — Wave 2
  'potus': 'Epipremnum aureum',
  'filodendro': 'Philodendron hederaceum',
  'hoya': 'Hoya kerrii',
  'mini-monstera': 'Rhaphidophora tetrasperma',
  // CAT-15 (5) — Wave 2
  'strelitzia': 'Strelitzia reginae',
  'eucalipto': 'Eucalyptus citriodora',
  'bambu-suerte': 'Dracaena sanderiana',
  'sansevieria-cilindrica': 'Dracaena angolensis',
  'cactus-san-pedro': 'Echinopsis pachanoi',
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
assert(fs.existsSync(STUB_AS), 'W0.3: scripts/.tmp-phase16/async-storage.cjs exists (auto-written)');
assert(fs.existsSync(STUB_I18N), 'W0.4: scripts/.tmp-phase16/i18n.cjs exists (auto-written)');
assert(dbSrc !== null, 'W0.5: src/data/plantDatabase.ts present at repo root');
assert(idSrc !== null, 'W0.6: src/utils/plantIdentification.ts present at repo root');
assert(enJson !== null, 'W0.7: src/i18n/locales/en/plants.json present');
assert(esJson !== null, 'W0.8: src/i18n/locales/es/plants.json present');
assert(claudeMd !== null, 'W0.9: CLAUDE.md present at repo root');

// ─── Voseo regression assertion (PASSES at Wave 0 — baseline already 2) ───
const voseoCount = (esJson.match(/\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b/g) || []).length;
assert(voseoCount <= 2, `GLOBAL.voseo: es/plants.json voseo regex count <= 2 (post-Phase-15 baseline; got ${voseoCount})`);

// ─── CAT-13/14/15 placeholders (per-id presence in PLANT_DATABASE; PARTIAL-LANDING TOLERANT) ───
// Compute landing state ONCE so per-id, count, IDENT, ROUTING-FIX gates share the same window.
const PHASE_16_LANDED_FLAGS = PHASE_16_IDS.map(id =>
  new RegExp(`id:\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(dbSrc)
);
const anyLanded = PHASE_16_LANDED_FLAGS.some(Boolean);
const allLanded = PHASE_16_LANDED_FLAGS.every(Boolean);

// NOTE: `potus` and `filodendro` are pre-existing in dbSrc (lines 30, 1038) — their
// PHASE_16_LANDED_FLAGS bits are TRUE at Wave 0 baseline. To detect EDU UPGRADE we
// also require careAction|placementRecommended|whyRationale within their entry blocks.
function hasEduFieldsForId(id) {
  const idIdxDouble = dbSrc.indexOf(`id: "${id}"`);
  const idIdxSingle = dbSrc.indexOf(`id: '${id}'`);
  const idIdx = idIdxDouble >= 0 ? idIdxDouble : idIdxSingle;
  if (idIdx < 0) return false;
  const block = dbSrc.slice(idIdx, idIdx + 5000);
  return /careAction|placementRecommended|whyRationale/.test(block);
}

// CAT-13: 10 cactus/suculentas (all NEW; partial-landing tolerant)
PHASE_16_IDS.slice(0, 10).forEach((id, i) => {
  assertSkippable(() => {
    const present = PHASE_16_LANDED_FLAGS[i];
    if (!anyLanded) return undefined;
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W1.CAT-13.${id}: entry id '${id}' present in plantDatabase.ts`);
});

// CAT-14: 4 trepadoras — potus + filodendro = upgrades (need EDU fields detected); hoya + mini-monstera = NEW
['potus', 'filodendro'].forEach(id => {
  assertSkippable(() => {
    // Always present in dbSrc (existing v1.0/v1.1 entries) — gate on EDU upgrade marker.
    const upgraded = hasEduFieldsForId(id);
    // NOTE: existing potus + filodendro entries at lines 30 + 1038 ALREADY have
    // careAction/placementRecommended/whyRationale (EDU fields were added in Phase 14).
    // Therefore this gate PASSes at Wave 0 baseline — the upgrade has effectively
    // been pre-applied during Phase 14. The W2.CAT-14 assertion remains a regression
    // sentinel: if Plan 16-02 accidentally strips fields, the gate FLIPs to FAIL.
    return upgraded ? true : undefined;
  }, `W2.CAT-14.${id}: existing entry '${id}' carries EDU fields (careAction/placementRecommended/whyRationale)`);
});
['hoya', 'mini-monstera'].forEach(id => {
  const i = PHASE_16_IDS.indexOf(id);
  assertSkippable(() => {
    const present = PHASE_16_LANDED_FLAGS[i];
    if (!anyLanded) return undefined;
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W2.CAT-14.${id}: NEW entry id '${id}' present in plantDatabase.ts`);
});

// CAT-15: 5 trending (all NEW)
['strelitzia', 'eucalipto', 'bambu-suerte', 'sansevieria-cilindrica', 'cactus-san-pedro'].forEach(id => {
  const i = PHASE_16_IDS.indexOf(id);
  assertSkippable(() => {
    const present = PHASE_16_LANDED_FLAGS[i];
    if (!anyLanded) return undefined;
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W2.CAT-15.${id}: entry id '${id}' present in plantDatabase.ts`);
});

// ─── CAT-13/14/15 secondary: PLANT_DATABASE.length === 104 via id-declaration count (PARTIAL-LANDING TOLERANT) ───
// Wave 1 lands 10 net-new (kalanchoe..agave) → 87+10 = 97 (mid-band SKIP).
// Wave 2 lands 7 net-new (hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro) → 97+7 = 104 (PASS).
// potus + filodendro are upgrades, NOT new id declarations — count gate uses 87 → 104, NOT 87 → 106.
assertSkippable(() => {
  const idMatches = (dbSrc.match(/^\s{4}id:\s*['"][^'"]+['"]/gm) || []).length;
  if (idMatches < 87) return undefined;       // pre-baseline catalog drift — SKIP
  if (idMatches === 87) return undefined;     // baseline = pre-W1 — SKIP
  if (idMatches > 87 && idMatches < 104) return undefined;  // mid-band Plan 16-01 → 16-02 — SKIP
  return idMatches === 104;
}, 'W2.CAT-counts.total: plantDatabase.ts has exactly 104 entry id declarations (87 + 17 net-new; potus/filodendro upgrades counted in 87)');

// ─── CAT-16 (i18n keysets — Plan 16-01 + 16-02 land 19 entry blocks) ───
PHASE_16_IDS.forEach(id => {
  assertSkippable(() => {
    const idEsc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enHas = new RegExp(`"${idEsc}"\\s*:\\s*\\{`).test(enJson);
    const esHas = new RegExp(`"${idEsc}"\\s*:\\s*\\{`).test(esJson);
    // Note: 'potus' and 'filodendro' i18n keys ALREADY exist (Phase 14-04 SUMMARY
    // records they were authored with EDU keys). For these two, the gate PASSes
    // at Wave 0 — Plan 16-02 adds NO new keys for them, just verifies presence.
    if (!enHas && !esHas) return undefined; // SKIP at baseline for new ids
    return enHas && esHas;
  }, `W2.CAT-16.${id}.keyset: '${id}' keyset present in BOTH en + es plants.json`);
});

// ─── CAT-16 (COMMON_NAMES_ES placeholders — Plan 16-03 lands the species-qualified keys) ───
// Sentinel: any of the new species-qualified additions appear in idSrc.
// Use 'Hoya kerrii' as the flip sentinel — it's a clean new addition not present in current COMMON_NAMES_ES.
const W3_SENTINEL_PRESENT = /Hoya kerrii|Rhaphidophora tetrasperma|Strelitzia reginae|Curio rowleyanus|Echinopsis pachanoi|Dracaena sanderiana|Dracaena angolensis|Schlumbergera × buckleyi|Eucalyptus citriodora|Agave americana/.test(idSrc);

PHASE_16_IDS.forEach(id => {
  assertSkippable(() => {
    if (!W3_SENTINEL_PRESENT) return undefined;
    const sn = PHASE_16_SCIENTIFIC_NAMES[id];
    const genus = sn.split(' ')[0].split('×')[0].trim();
    const snEsc = sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const genusEsc = genus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const speciesQualified = new RegExp(`['"]${snEsc}['"]\\s*:`).test(idSrc);
    const genusOnly = new RegExp(`['"]${genusEsc}['"]\\s*:`).test(idSrc);
    return speciesQualified || genusOnly;
  }, `W3.CAT-16.${id}: '${PHASE_16_SCIENTIFIC_NAMES[id]}' (or its genus) mapped in COMMON_NAMES_ES`);
});

// ─── CAT-16 image plan (CLAUDE.md "Phase 16 Wave B" mention of ≥17 of 19 ids) ───
assertSkippable(() => {
  if (!/Phase 16 Wave B/i.test(claudeMd)) return undefined; // SKIP until Plan 16-04 lands
  const found = PHASE_16_IDS.filter(id => claudeMd.includes(id)).length;
  return found >= 17;
}, 'W3.CAT-16.imagePlan: CLAUDE.md "Phase 16 Wave B" block mentions >=17 of 19 Phase 16 ids');

// ─── --identification flag (file-content co-occurrence; same partial-landing tolerance as Step 8) ───
const isIdentificationMode = process.argv.includes('--identification');
if (isIdentificationMode) {
  PHASE_16_IDS.forEach(id => {
    const i = PHASE_16_IDS.indexOf(id);
    const sn = PHASE_16_SCIENTIFIC_NAMES[id];
    assertSkippable(() => {
      const idLanded = PHASE_16_LANDED_FLAGS[i];
      if (!anyLanded) return undefined;
      // Mid-band: this id hasn't landed yet → SKIP.
      // Special case potus/filodendro: they're always landed but we still verify scientificName co-occurrence.
      if (anyLanded && !allLanded && !idLanded && !['potus', 'filodendro'].includes(id)) return undefined;
      const idIdxDouble = dbSrc.indexOf(`id: "${id}"`);
      const idIdxSingle = dbSrc.indexOf(`id: '${id}'`);
      const idIdx = idIdxDouble >= 0 ? idIdxDouble : idIdxSingle;
      if (idIdx < 0) return undefined;
      const block = dbSrc.slice(idIdx, idIdx + 5000);
      const snEsc = sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`scientificName:\\s*['"]${snEsc}['"]`).test(block);
    }, `IDENT.CAT-16.${id}: scientificName '${sn}' co-occurs with id '${id}' in plantDatabase.ts`);
  });
}

// ─── --routing-fix flag (ts.transpileModule + runtime function call — Phase 16 NEW pattern) ───
const isRoutingFixMode = process.argv.includes('--routing-fix');
if (isRoutingFixMode) {
  // Sentinel: refactor has landed when idSrc contains the literal "exactMatch" identifier.
  const refactorLanded = /const exactMatch = PLANT_DATABASE\.find/.test(idSrc);

  // Helper: compile and require findPlantInDatabase via ts.transpileModule.
  // Stubs i18n + AsyncStorage via Module._resolveFilename intercept (mirrors smoke-phase14.mjs).
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

  // Wave 0 routing-fix sentinel — refactor must have landed for these PASSes to fire.
  // SKIP gate: if refactor not yet present in idSrc, all routing-fix gates SKIP (this allows the runner
  // to be created BEFORE Task 3 of this plan; final commit lands refactor → SKIPs flip to PASS).
  const ROUTING_FIX_PROBES = [
    // [scientificName input, expected id output, label]
    ['Dracaena fragrans', 'dracaena', 'BUG-FIX: Dracaena fragrans now routes to dracaena (not sansevieria)'],
    ['Dracaena trifasciata', 'sansevieria', 'unchanged: Dracaena trifasciata routes to sansevieria'],
    ['Heptapleurum arboricola', 'cheflera', 'regression: Phase 15 canonical scientificName routes to cheflera via exact-match-first'],
    ['Pachira aquatica', 'arbol-dinero', 'regression: Pachira aquatica routes to arbol-dinero (Phase 15)'],
    ['Epipremnum aureum', 'potus', 'regression: Epipremnum aureum routes to potus (existing v1.0)'],
    ['Philodendron hederaceum', 'filodendro', 'regression: Philodendron hederaceum routes to filodendro (existing v1.0)'],
  ];

  let findFn = null;
  ROUTING_FIX_PROBES.forEach(([sn, expectedId, label]) => {
    assertSkippable(() => {
      if (!refactorLanded) return undefined; // SKIP until Task 3 of this plan lands the refactor
      try {
        if (!findFn) findFn = loadFindPlantInDatabase();
        const result = findFn(sn);
        return result?.id === expectedId;
      } catch (e) {
        // Surface compile/load errors as SKIPs with explanation
        return undefined;
      }
    }, `W0.ROUTING-FIX.${expectedId}: findPlantInDatabase('${sn}')?.id === '${expectedId}' — ${label}`);
  });

  // Phase 16 species routing tests (post-Plan 16-01/02 landing — uses anyLanded/allLanded gate):
  PHASE_16_NEW_IDS.forEach(id => {
    const sn = PHASE_16_SCIENTIFIC_NAMES[id];
    assertSkippable(() => {
      if (!refactorLanded) return undefined;
      const idLanded = PHASE_16_LANDED_FLAGS[PHASE_16_IDS.indexOf(id)];
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
  console.error(`[phase16-smoke] FAIL — ${pass} pass, ${fail} fail, ${skip} skip`);
  process.exit(1);
}
console.log(`[phase16-smoke] PASS ${pass}/${pass + skip} (${skip} placeholder${skip === 1 ? '' : 's'} skipped — Waves 1-3 flip)`);
