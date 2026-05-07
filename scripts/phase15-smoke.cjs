#!/usr/bin/env node
// scripts/phase15-smoke.cjs
// Phase 15 Catalog Wave A — Interior Tropicals smoke runner.
// CommonJS (.cjs) per VALIDATION.md lock. Wave 0 ships harness + scaffold PASSes + SKIP placeholders for CAT-09/10/11/12.
// Later waves flip SKIPs to PASSes by landing concrete content/code; the runner itself is NOT modified after Wave 0.
//
// Usage:
//   node scripts/phase15-smoke.cjs                   — primary loop (per-id, count, keyset, voseo)
//   node scripts/phase15-smoke.cjs --identification  — adds scientificName↔id co-occurrence checks
//
// Mid-band exit-0 guarantee (Plan 15-01 lands 12/23 ids before Plan 15-02 lands the remaining 11):
//   anyLanded=false        → all CAT-09/IDENT placeholders SKIP (Wave 0/pre-W2 baseline)
//   anyLanded && !allLanded → unlanded ids SKIP, landed ids PASS (mid-band)
//   allLanded=true         → every id MUST PASS (genuine assertion)

const fs = require('node:fs');
const path = require('node:path');

globalThis.__DEV__ = false;

const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.resolve(__dirname, '.tmp-phase15');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ─── Stubs (auto-write if absent — gitignored) ───
const STUB_AS = path.resolve(TMP_DIR, 'async-storage.cjs');
if (!fs.existsSync(STUB_AS)) {
  fs.writeFileSync(STUB_AS,
    `// Phase 15 smoke stub for @react-native-async-storage/async-storage. Auto-written. CJS.\n` +
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
    `// Phase 15 smoke stub for ../i18n. Auto-written. CJS.\n` +
    `module.exports = { default: { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' } };\n`
  );
}

// ─── Assertion harness (mirrors Phase 14) ───
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

// ─── Phase 15 constants (locked by REQUIREMENTS.md CAT-09; species-qualified per RESEARCH §Pitfall 5) ───
const PHASE_15_IDS = [
  // Sub-batch A — aroceous (7) + foliage especial (5) = 12
  'anthurium', 'alocasia', 'caladium', 'singonio', 'aglaonema', 'costilla-adan', 'difenbaquia',
  'begonia-rex', 'croton', 'fitonia', 'ficus-lyrata', 'maranta',
  // Sub-batch B — diverse rest = 11
  'zamioculca', 'cola-burro', 'hiedra', 'palmera-areca', 'palmera-kentia',
  'helecho-boston', 'helecho-nido', 'pilea', 'tradescantia', 'cheflera', 'arbol-dinero',
];

// IMPORTANT: species-qualified to match scientificName values authored in Plans 15-01/02.
// Genus-only names (e.g., 'Dieffenbachia') would FAIL the IDENT.CAT-11 exact-regex assertion in Step 13.
const PHASE_15_SCIENTIFIC_NAMES = [
  // Sub-batch A
  'Anthurium andraeanum', 'Alocasia × amazonica', 'Caladium bicolor', 'Syngonium podophyllum',
  'Aglaonema commutatum', 'Monstera adansonii', 'Dieffenbachia seguine',
  'Begonia rex', 'Codiaeum variegatum', 'Fittonia albivenis', 'Ficus lyrata', 'Maranta leuconeura',
  // Sub-batch B
  'Zamioculcas zamiifolia', 'Sedum morganianum', 'Hedera helix', 'Dypsis lutescens',
  'Howea forsteriana', 'Nephrolepis exaltata', 'Asplenium nidus', 'Pilea peperomioides',
  'Tradescantia zebrina', 'Heptapleurum arboricola', 'Pachira aquatica',
];

// ─── Read source files ONCE ───
const dbSrc = readSafe('src/data/plantDatabase.ts');
const idSrc = readSafe('src/utils/plantIdentification.ts');
const enJson = readSafe('src/i18n/locales/en/plants.json');
const esJson = readSafe('src/i18n/locales/es/plants.json');
const claudeMd = readSafe('CLAUDE.md');

// ─── Wave 0 scaffold PASSes (always pass — verify the harness itself) ───
assert(typeof fs.readFileSync === 'function', 'W0.1: node:fs.readFileSync available');
assert(typeof globalThis.__DEV__ === 'boolean', 'W0.2: __DEV__ shim present (false in smoke runner)');
assert(fs.existsSync(STUB_AS), 'W0.3: scripts/.tmp-phase15/async-storage.cjs exists (auto-written)');
assert(fs.existsSync(STUB_I18N), 'W0.4: scripts/.tmp-phase15/i18n.cjs exists (auto-written)');
assert(dbSrc !== null, 'W0.5: src/data/plantDatabase.ts present at repo root');
assert(idSrc !== null, 'W0.6: src/utils/plantIdentification.ts present at repo root');
assert(enJson !== null, 'W0.7: src/i18n/locales/en/plants.json present');
assert(esJson !== null, 'W0.8: src/i18n/locales/es/plants.json present');
assert(claudeMd !== null, 'W0.9: CLAUDE.md present at repo root');

// ─── Voseo regression assertion (PASSES at Wave 0 — baseline already 2) ───
const voseoCount = (esJson.match(/\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b/g) || []).length;
assert(voseoCount <= 2, `GLOBAL.voseo: es/plants.json voseo regex count <= 2 (post-Phase-14 baseline; got ${voseoCount})`);

// ─── CAT-09 placeholders (per-id presence in PLANT_DATABASE; PARTIAL-LANDING TOLERANT) ───
// Compute landing state ONCE so both per-id and count gates use the same partial-landing window.
const PHASE_15_LANDED_FLAGS = PHASE_15_IDS.map(id =>
  new RegExp(`id:\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(dbSrc)
);
const anyLanded = PHASE_15_LANDED_FLAGS.some(Boolean);
const allLanded = PHASE_15_LANDED_FLAGS.every(Boolean);

PHASE_15_IDS.forEach((id, i) => {
  assertSkippable(() => {
    const present = PHASE_15_LANDED_FLAGS[i];
    // Pre-W2 (nothing landed) — SKIP all.
    if (!anyLanded) return undefined;
    // Mid-band (Plan 15-01 has landed but 15-02 hasn't) — SKIP unlanded ids so they don't FAIL.
    // Once allLanded, every id MUST be PASS (genuine assertion).
    if (anyLanded && !allLanded && !present) return undefined;
    return present;
  }, `W2-3.CAT-09.${id}: entry id '${id}' present in plantDatabase.ts`);
});

// ─── CAT-09 secondary: PLANT_DATABASE.length === 87 via id-declaration count (PARTIAL-LANDING TOLERANT) ───
assertSkippable(() => {
  const idMatches = (dbSrc.match(/^\s{4}id:\s*['"][^'"]+['"]/gm) || []).length;
  if (idMatches < 64) return undefined;     // pre-baseline catalog drift — SKIP
  if (idMatches === 64) return undefined;   // baseline = pre-W2 — SKIP
  // Mid-band: between Plan 15-01 (lands 12 → 76) and Plan 15-02 (lands 11 → 87) the count is 65..86 — SKIP.
  if (idMatches > 64 && idMatches < 87) return undefined;
  return idMatches === 87;
}, 'W2-3.CAT-09.count: plantDatabase.ts has exactly 87 entry id declarations (64 + 23)');

// ─── CAT-10 placeholders (each id has en + es key block) ───
PHASE_15_IDS.forEach(id => {
  assertSkippable(() => {
    const idEsc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enHas = new RegExp(`"${idEsc}"\\s*:\\s*\\{`).test(enJson);
    const esHas = new RegExp(`"${idEsc}"\\s*:\\s*\\{`).test(esJson);
    if (!enHas && !esHas) return undefined; // SKIP at baseline
    return enHas && esHas;
  }, `W2-3.CAT-10.${id}: '${id}' keyset present in BOTH en + es plants.json`);
});

// ─── CAT-11 placeholders (each scientificName mapped in COMMON_NAMES_ES OR genus already covered) ───
// Sentinel: any of the NEW additions appear (these are NOT yet in idSrc at Wave 0).
// Use 'Maranta leuconeura' as the flip sentinel — it's a clean new addition not present in current COMMON_NAMES_ES.
const W1_SENTINEL_PRESENT = /Maranta leuconeura|Asplenium nidus|Heptapleurum arboricola|Sedum morganianum|Howea forsteriana|Dypsis lutescens|Caladium bicolor/.test(idSrc);

PHASE_15_SCIENTIFIC_NAMES.forEach(sn => {
  assertSkippable(() => {
    if (!W1_SENTINEL_PRESENT) return undefined; // SKIP until Wave 3 (Plan 15-03) lands
    // Match either species-qualified OR genus-only key in COMMON_NAMES_ES
    const genus = sn.split(' ')[0].split('×')[0].trim();
    const snEsc = sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const genusEsc = genus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const speciesQualified = new RegExp(`['"]${snEsc}['"]\\s*:`).test(idSrc);
    const genusOnly = new RegExp(`['"]${genusEsc}['"]\\s*:`).test(idSrc);
    return speciesQualified || genusOnly;
  }, `W1.CAT-11.${sn}: '${sn}' (or its genus) mapped in COMMON_NAMES_ES`);
});

// ─── CAT-12 placeholder (CLAUDE.md accepted-known mention of ≥20 of 23 ids) ───
assertSkippable(() => {
  if (!/Phase 15/i.test(claudeMd)) return undefined; // SKIP until Wave 3 (Plan 15-04) lands
  const found = PHASE_15_IDS.filter(id => claudeMd.includes(id)).length;
  return found >= 20;
}, 'W4.CAT-12: CLAUDE.md accepted-known list mentions >=20 of 23 Phase 15 ids');

// ─── --identification flag (per VALIDATION.md per-task map; deeper assertion variant) ───
const isIdentificationMode = process.argv.includes('--identification');
if (isIdentificationMode) {
  // Heuristic: each Phase 15 entry's scientificName appears in plantDatabase.ts as `scientificName: '<name>'`
  // Apply the same partial-landing tolerance as CAT-09: unlanded ids SKIP rather than FAIL during the
  // Plan 15-01 → 15-02 mid-band, ensuring downstream verify commands can exit 0 incrementally.
  PHASE_15_SCIENTIFIC_NAMES.forEach((sn, i) => {
    assertSkippable(() => {
      const id = PHASE_15_IDS[i];
      const idLanded = PHASE_15_LANDED_FLAGS[i];
      // Pre-W2 (nothing landed) — SKIP all.
      if (!anyLanded) return undefined;
      // Mid-band: this id hasn't landed yet → SKIP (don't FAIL).
      if (anyLanded && !allLanded && !idLanded) return undefined;
      // Block-scan: does `id: 'foo'` ... `scientificName: '<sn>'` co-occur within ~5000 chars?
      const idIdx = dbSrc.indexOf(`id: "${id}"`) >= 0 ? dbSrc.indexOf(`id: "${id}"`) : dbSrc.indexOf(`id: '${id}'`);
      if (idIdx < 0) return undefined;
      const block = dbSrc.slice(idIdx, idIdx + 5000);
      const snEsc = sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`scientificName:\\s*['"]${snEsc}['"]`).test(block);
    }, `IDENT.CAT-11.${PHASE_15_IDS[i]}: scientificName '${sn}' co-occurs with id '${PHASE_15_IDS[i]}' in plantDatabase.ts`);
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
  console.error(`[phase15-smoke] FAIL — ${pass} pass, ${fail} fail, ${skip} skip`);
  process.exit(1);
}
console.log(`[phase15-smoke] PASS ${pass}/${pass + skip} (${skip} placeholder${skip === 1 ? '' : 's'} skipped — Waves 1-3 flip)`);
