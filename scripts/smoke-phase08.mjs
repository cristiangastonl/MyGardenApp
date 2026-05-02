#!/usr/bin/env node
// scripts/smoke-phase08.mjs
// Phase 8 catalog rebalance smoke runner. Single-compile-path policy (Phase 4 lock).
// Assertions A1..A8 active in Wave 0. A9/A10 activate in Plan 03.

// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false; // silence dev warnings during smoke

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase08');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Stub modules — write minimal stubs at first-write time (Node ESM module cache: these must be complete on first write)
// Stub i18n: identity translator
writeFileSync(resolve(TMP_DIR, 'i18n.mjs'),
  `export default { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' };\n`);
// Stub types: empty (TS interfaces erase to nothing at runtime)
writeFileSync(resolve(TMP_DIR, 'types.mjs'), `export {};\n`);

// Read plantDatabase.ts source
const dbSource = readFileSync(resolve(ROOT, 'src/data/plantDatabase.ts'), 'utf8');

// Rewrite imports to point at stubs (paths relative to compiled file location: scripts/)
const rewritten = dbSource
  .replace(/from ['"]\.\.\/i18n['"]/g, `from './.tmp-phase08/i18n.mjs'`)
  .replace(/from ['"]\.\.\/types['"]/g, `from './.tmp-phase08/types.mjs'`);

// Single compile path — typescript.transpileModule (NO esbuild/swc fallbacks)
const compiled = ts.transpileModule(rewritten, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  },
});

const tmpDbPath = resolve(__dirname, 'plantDatabase.compiled.mjs');
writeFileSync(tmpDbPath, compiled.outputText);

const dbMod = await import(tmpDbPath);
const { PLANT_DATABASE, getCatalogEntry } = dbMod;

// ─── Assertion harness ───
let pass = 0, fail = 0;
const errors = [];
function assert(cond, label) {
  if (cond) { pass++; }
  else { fail++; errors.push(`FAIL: ${label}`); }
}

// ─── A1: entry-completeness — every entry has v1.1 fields populated ───
for (const entry of PLANT_DATABASE) {
  assert(entry.lightLevel !== undefined,
    `A1.${entry.id}: lightLevel undefined`);
  assert(typeof entry.waterSchedule?.warm === 'number' && entry.waterSchedule.warm > 0,
    `A1.${entry.id}: waterSchedule.warm missing or invalid`);
  assert(typeof entry.waterSchedule?.cold === 'number' && entry.waterSchedule.cold > 0,
    `A1.${entry.id}: waterSchedule.cold missing or invalid`);
  assert(entry.waterMode !== undefined,
    `A1.${entry.id}: waterMode undefined`);
}

// ─── A2: cold >= warm invariant ───
for (const entry of PLANT_DATABASE) {
  if (entry.waterSchedule?.warm && entry.waterSchedule?.cold) {
    assert(entry.waterSchedule.cold >= entry.waterSchedule.warm,
      `A2.${entry.id}: cold (${entry.waterSchedule.cold}) < warm (${entry.waterSchedule.warm})`);
  }
}

// ─── A3: waterMode contract ───
const SOIL_CHECK_IDS = new Set([
  'suculenta-generica', 'cactus', 'echeveria', 'haworthia', 'sedum',
  'aloe-vera', 'jade',
]);
for (const entry of PLANT_DATABASE) {
  const expected = SOIL_CHECK_IDS.has(entry.id) ? 'soil_check' : 'fixed';
  assert(entry.waterMode === expected,
    `A3.${entry.id}: waterMode=${entry.waterMode}, expected=${expected}`);
}

// ─── A4: canonical lookup ───
assert(getCatalogEntry('monstera')?.id === 'monstera',
  `A4: getCatalogEntry('monstera').id === 'monstera'`);

// ─── A5: missing returns null ───
assert(getCatalogEntry('definitely-not-a-real-slug-xyz') === null,
  `A5: getCatalogEntry('definitely-not-a-real-slug-xyz') === null`);

// ─── A6 + A7: synthetic alias + id-before-alias (no PLANT_DATABASE mutation) ───
// Inline algorithm copy mirrors getCatalogEntry's contract.
const synth = [
  { id: 'canonical-a', _aliases: ['legacy-x'] },
  { id: 'canonical-b', _aliases: ['canonical-a'] }, // collides with A's id
];
function synthLookup(slug) {
  const c = synth.find(e => e.id === slug); if (c) return c;
  const a = synth.find(e => e._aliases?.includes(slug)); if (a) return a;
  return null;
}
assert(synthLookup('canonical-a').id === 'canonical-a',
  `A7: id-before-alias — canonical wins even when another entry aliases its id`);
assert(synthLookup('legacy-x').id === 'canonical-a',
  `A6: alias resolves to canonical`);

// ─── A8: count baseline (Plan 03 will UPDATE THIS to 64 when 14 new entries land) ───
// NOTE: RESEARCH.md stated 38 entries but the live catalog has 50 entries (Phase 4 Plan 05 codemod
// added entries beyond the planner's estimate; see 04-05-SUMMARY.md deviation note).
// Baseline here is 50; Plan 03 flips to 64 (50 + 14 new outdoor entries).
assert(PLANT_DATABASE.length === 50,
  `A8: PLANT_DATABASE.length === 50 baseline (current: ${PLANT_DATABASE.length}). Plan 03 must update this assertion to 64.`);

// === Plan 03 will activate the following assertions ===
// A9: lavender split — getCatalogEntry('lavanda')?.id === 'lavanda-angustifolia' (alias)
//     getCatalogEntry('lavanda-angustifolia')?.waterSchedule.cold > getCatalogEntry('lavanda-stoechas')?.waterSchedule.cold
// A10: i18n key parity per id (delegated to scripts/check-i18n-keys.mjs in Plan 05)

// ─── Final report ───
if (fail > 0) {
  console.error(`\n[smoke-phase08] FAIL ${fail}/${pass + fail}\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`[smoke-phase08] PASS ${pass}/${pass}`);
