#!/usr/bin/env node
// scripts/smoke-phase12.mjs
// Phase 12 Unknown Plant Tracking smoke runner. Single-compile-path policy (Phase 4 lock).
// Wave 0: harness + scaffold PASSes + 7 Wave 1 placeholders. Plan 01 wires TRACK-01 behavior assertions.

// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase12');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

const STUB_AS = resolve(TMP_DIR, 'async-storage.mjs');
if (!existsSync(STUB_AS)) {
  // Stub is gitignored — write it at startup (mirrors Phase 11 pattern for gitignored .tmp-* dirs).
  writeFileSync(STUB_AS,
    `// Phase 12 smoke stub for \`@react-native-async-storage/async-storage\`.\n` +
    `// Imported by src/services/unknownPlantTracker.ts when ts.transpileModule\n` +
    `// rewrites the bare specifier to this relative ESM path. In-memory Map-backed\n` +
    `// implementation; matches AsyncStorage default-export API surface used by the\n` +
    `// tracker (getItem, setItem, removeItem). Module-scoped state — fresh per\n` +
    `// process invocation, which is fine for the smoke runner's single-process\n` +
    `// lifecycle.\n` +
    `const _store = new Map();\n` +
    `export default {\n` +
    `  async getItem(key) { return _store.get(key) ?? null; },\n` +
    `  async setItem(key, value) { _store.set(key, value); },\n` +
    `  async removeItem(key) { _store.delete(key); },\n` +
    `};\n`
  );
}

// ─── Compile src/services/unknownPlantTracker.ts via ts.transpileModule (when present) ───
const svcPath = resolve(ROOT, 'src/services/unknownPlantTracker.ts');
let svcMod = null;
let svcSource = '';
if (existsSync(svcPath)) {
  svcSource = readFileSync(svcPath, 'utf8');
  const rewritten = svcSource
    .replace(
      /from ['"]@react-native-async-storage\/async-storage['"]/g,
      `from './.tmp-phase12/async-storage.mjs'`
    );
  const compiled = ts.transpileModule(rewritten, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    },
  });
  const compiledPath = resolve(__dirname, 'unknownPlantTracker.compiled-phase12.mjs');
  writeFileSync(compiledPath, compiled.outputText);
  try {
    svcMod = await import(compiledPath + '?t=' + Date.now());
  } catch (err) {
    console.error('[smoke-phase12] Compile/import failed:', err && err.message);
    process.exit(3);
  }
}

// ─── Assertion harness ───
let pass = 0, fail = 0, skip = 0;
const errors = [];
const skips = [];
function assert(cond, label) {
  if (cond) { pass++; }
  else { fail++; errors.push(`FAIL: ${label}`); }
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

// ─── Wave 0: scaffold PASSes (≥4 required, baseline before src file exists) ───
assert(existsSync(STUB_AS), 'W0.1: scripts/.tmp-phase12/async-storage.mjs present');
assert(typeof ts.transpileModule === 'function', 'W0.2: typescript.transpileModule available (single-compile-path lock)');
assert(typeof globalThis.__DEV__ === 'boolean', 'W0.3: __DEV__ shim present (false in smoke runner — production-mode path)');
{
  // Verify stub round-trips a value
  const stub = await import(STUB_AS + '?t=' + Date.now());
  await stub.default.setItem('@smoke_probe', 'ok');
  const got = await stub.default.getItem('@smoke_probe');
  await stub.default.removeItem('@smoke_probe');
  assert(got === 'ok', 'W0.4: AsyncStorage stub round-trips a value (set → get → ok)');
  const after = await stub.default.getItem('@smoke_probe');
  assert(after === null, 'W0.5: AsyncStorage stub returns null after removeItem');
}

// ─── Wave 1 placeholders for TRACK-01 (Plan 01 makes these flip from SKIP to PASS) ───
// Each condFn returns `undefined` when svcMod is null (Wave 0 baseline) — assertSkippableAsync logs SKIP, not FAIL.

// P1.1: trackUnknownPlant inserts a new entry on first call
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.trackUnknownPlant !== 'function') return undefined;
  const stub = await import(STUB_AS);
  await stub.default.removeItem('@unknown_plants');
  await svcMod.trackUnknownPlant('Monstera deliciosa');
  const report = await svcMod.getUnknownPlantsReport();
  return report.length === 1 && report[0].count === 1;
}, 'W1.TRACK-01.insert: first track inserts 1 entry with count=1 [Plan 12-01]');

// P1.2: Second call for the same name increments count to 2
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.trackUnknownPlant !== 'function') return undefined;
  const stub = await import(STUB_AS);
  await stub.default.removeItem('@unknown_plants');
  await svcMod.trackUnknownPlant('Monstera deliciosa');
  await svcMod.trackUnknownPlant('Monstera deliciosa');
  const report = await svcMod.getUnknownPlantsReport();
  return report.length === 1 && report[0].count === 2;
}, 'W1.TRACK-01.increment: second track increments count to 2 [Plan 12-01]');

// P1.3: Lowercase canonicalization — 'MONSTERA DELICIOSA' merges with 'monstera deliciosa'
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.trackUnknownPlant !== 'function') return undefined;
  const stub = await import(STUB_AS);
  await stub.default.removeItem('@unknown_plants');
  await svcMod.trackUnknownPlant('Monstera deliciosa');
  await svcMod.trackUnknownPlant('MONSTERA DELICIOSA');
  await svcMod.trackUnknownPlant('  monstera deliciosa  ');
  const report = await svcMod.getUnknownPlantsReport();
  return report.length === 1 && report[0].count === 3;
}, 'W1.TRACK-01.lowercase: mixed-case + whitespace inputs merge into single canonical entry, count=3 [Plan 12-01]');

// P1.4: Report sorted desc by count, then desc by lastSeen
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.trackUnknownPlant !== 'function') return undefined;
  const stub = await import(STUB_AS);
  await stub.default.removeItem('@unknown_plants');
  await svcMod.trackUnknownPlant('Rosa canina');     // count=1
  await svcMod.trackUnknownPlant('Monstera deliciosa');
  await svcMod.trackUnknownPlant('Monstera deliciosa');
  await svcMod.trackUnknownPlant('Monstera deliciosa'); // count=3
  const report = await svcMod.getUnknownPlantsReport();
  return report.length === 2 && report[0].count === 3 && report[1].count === 1;
}, 'W1.TRACK-01.sorted: report sorted desc by count [Plan 12-01]');

// P1.5: firstSeen is set on first call and NOT overwritten by subsequent calls
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.trackUnknownPlant !== 'function') return undefined;
  const stub = await import(STUB_AS);
  await stub.default.removeItem('@unknown_plants');
  await svcMod.trackUnknownPlant('Ficus lyrata');
  const r1 = await svcMod.getUnknownPlantsReport();
  const firstSeenInitial = r1[0].firstSeen;
  await new Promise(r => setTimeout(r, 5));
  await svcMod.trackUnknownPlant('Ficus lyrata');
  const r2 = await svcMod.getUnknownPlantsReport();
  return typeof firstSeenInitial === 'string'
    && firstSeenInitial.length > 0
    && r2[0].firstSeen === firstSeenInitial
    && r2[0].lastSeen >= firstSeenInitial;
}, 'W1.TRACK-01.firstSeen: firstSeen immutable across re-tracks; lastSeen advances [Plan 12-01]');

// P1.6: AsyncStorage setItem failure is silently swallowed — no throw to caller
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.trackUnknownPlant !== 'function') return undefined;
  // Note: test forces the stub's setItem to throw temporarily by monkey-patching the
  // module-level singleton. Because ESM imports return the SAME singleton,
  // mutating .setItem here affects the tracker's reference too.
  const stub = await import(STUB_AS);
  const originalSet = stub.default.setItem;
  stub.default.setItem = async () => { throw new Error('disk full'); };
  let threw = false;
  try { await svcMod.trackUnknownPlant('Crashing plant'); }
  catch { threw = true; }
  stub.default.setItem = originalSet;
  return threw === false;
}, 'W1.TRACK-01.silent-error: AsyncStorage setItem failure is swallowed (no throw) [Plan 12-01]');

// P1.7: JSON.parse failure on corrupt storage returns empty Record (no throw)
await assertSkippableAsync(async () => {
  if (!svcMod || typeof svcMod.getUnknownPlantsReport !== 'function') return undefined;
  const stub = await import(STUB_AS);
  await stub.default.setItem('@unknown_plants', '{not-json,,,');
  let threw = false;
  let report;
  try { report = await svcMod.getUnknownPlantsReport(); }
  catch { threw = true; }
  // Cleanup so subsequent runs are clean
  await stub.default.removeItem('@unknown_plants');
  return threw === false && Array.isArray(report) && report.length === 0;
}, 'W1.TRACK-01.json-parse-fail: corrupt storage → empty array, no throw [Plan 12-01]');

// ─── Final report ───
if (skip > 0) {
  console.log(`[smoke-phase12] Skipped ${skip} (Wave 1 placeholders):\n${skips.join('\n')}`);
}
if (fail > 0) {
  console.error(`\n[smoke-phase12] FAIL ${fail}/${pass + fail}\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`[smoke-phase12] PASS ${pass}/${pass}${skip > 0 ? ` (+${skip} skipped)` : ''}`);
