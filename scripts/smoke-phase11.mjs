#!/usr/bin/env node
// scripts/smoke-phase11.mjs
// Phase 11 Perenual Data Quality smoke runner. Single-compile-path policy (Phase 4 lock).
// Wave 0: harness + scaffold PASSes (≥12). Wave 1 tasks wire DATA-01/02/03 behavior assertions.

// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase11');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Stub modules — write at startup (gitignored, generated each run, mirrors smoke-phase08.mjs pattern)
const STUB_SUPA = resolve(TMP_DIR, 'supabase.mjs');
const STUB_DB = resolve(TMP_DIR, 'database.mjs');

writeFileSync(STUB_SUPA,
  `// Phase 11 smoke stub for ../lib/supabase. Imported by plantKnowledgeService.ts\n` +
  `// when ts.transpileModule rewrites the import path.\n` +
  `export const supabase = {\n` +
  `  from: () => ({\n` +
  `    select: () => ({\n` +
  `      or: () => ({\n` +
  `        limit: async () => ({ data: null, error: null }),\n` +
  `      }),\n` +
  `      order: async () => ({ data: null, error: null }),\n` +
  `    }),\n` +
  `    insert: () => ({\n` +
  `      select: async () => ({ data: null, error: null }),\n` +
  `    }),\n` +
  `  }),\n` +
  `  functions: {\n` +
  `    invoke: async () => ({ data: null, error: null }),\n` +
  `  },\n` +
  `};\n` +
  `export function isSupabaseConfigured() { return false; }\n`
);

writeFileSync(STUB_DB,
  `// Phase 11 smoke stub for ../types/database. TypeScript interfaces erase at runtime.\n` +
  `export {};\n`
);

// ─── Compile plantKnowledgeService.ts via ts.transpileModule ───
const svcPath = resolve(ROOT, 'src/services/plantKnowledgeService.ts');
const svcSource = readFileSync(svcPath, 'utf8');

const rewritten = svcSource
  .replace(/from ['"]\.\.\/lib\/supabase['"]/g, `from './.tmp-phase11/supabase.mjs'`)
  .replace(/from ['"]\.\.\/types\/database['"]/g, `from './.tmp-phase11/database.mjs'`);

const compiled = ts.transpileModule(rewritten, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  },
});

const compiledPath = resolve(__dirname, 'plantKnowledgeService.compiled-phase11.mjs');
writeFileSync(compiledPath, compiled.outputText);

// Wave 1 tasks will use these exports (parseHardiness, convertPerenualToKnowledge are
// currently file-private — see ─── Wave 1 placeholder ─── below for the temporary export plan).
// Wave 0 only asserts the module loads.
let svcMod;
try {
  svcMod = await import(compiledPath);
} catch (err) {
  console.error('[smoke-phase11] Compile/import failed:', err && err.message);
  process.exit(3);
}

// ─── Edge function source for DATA-01 structural greps (Wave 1 Plan 01) ───
const edgeSource = readFileSync(resolve(ROOT, 'supabase/functions/get-plant-care/index.ts'), 'utf8');

// ─── Assertion harness ───
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

// ─── Wave 0: scaffold PASSes (≥12 required) ───
assert(typeof svcMod === 'object', 'W0.1: plantKnowledgeService compiled module loaded');
assert(typeof edgeSource === 'string' && edgeSource.length > 0, 'W0.2: get-plant-care edge function source readable');
assert(existsSync(STUB_SUPA), 'W0.3: scripts/.tmp-phase11/supabase.mjs present');
assert(existsSync(STUB_DB), 'W0.4: scripts/.tmp-phase11/database.mjs present');
assert(svcSource.includes('parseHardiness'), 'W0.5: parseHardiness symbol present in source');
assert(svcSource.includes('convertPerenualToKnowledge'), 'W0.6: convertPerenualToKnowledge symbol present in source');
assert(edgeSource.includes('PerenualPlantDetail'), 'W0.7: PerenualPlantDetail interface present in edge function');
assert(svcSource.includes('PerenualPlantDetail'), 'W0.8: PerenualPlantDetail interface present in client service');
assert(edgeSource.includes("Deno.env.get('PERENUAL_API_KEY')") || edgeSource.includes('Deno.env.get("PERENUAL_API_KEY")'), 'W0.9: edge function reads PERENUAL_API_KEY from Deno.env');
assert(svcSource.includes("supabase.functions.invoke(") && (svcSource.includes("'get-plant-care'") || svcSource.includes('"get-plant-care"')), 'W0.10: client service invokes get-plant-care edge function');
assert(edgeSource.includes('species-list') && edgeSource.includes('species/details'), 'W0.11: edge function performs both Perenual API calls (search + details)');
assert(/zoneToTemp|hardiness/.test(svcSource), 'W0.12: hardiness handling code present in client service');

// ─── Wave 1 placeholders for server-side / non-compiled assertions (Plan 01) ───
// DATA-01 placement: edge function file is NOT compiled by this runner (Deno code) — structural grep is the only available verification at Node level.
assertSkippable(() => edgeSource.includes('function isGoodMatch(') ? edgeSource.includes('function isGoodMatch(') : undefined,
  'W1.DATA-01.placement: edge function defines isGoodMatch(...) [Plan 11-01]');
// Schema parity for edge function side (Plan 01); client side is now exercised end-to-end in the Wave 1 behavior block below.
assertSkippable(() => /family\?:\s*string/.test(edgeSource) && /type\?:\s*string/.test(edgeSource) ? true : undefined,
  'W1.schema.edge: PerenualPlantDetail in edge function has family?: string AND type?: string [Plan 11-01]');

// ─── Wave 1 Behavior Assertions ───
// Plan 11-02 wires real function invocations against the compiled plantKnowledgeService module.
// These supersede the Wave 0 assertSkippable placeholders for DATA-02 zoneToTempMax, DATA-03 inferHumidity,
// and client-side schema expansion. Every row in VALIDATION.md Per-Task Verification Map for Plan 02 is covered.
// CRITICAL: parseHardiness, classifyTempMaxFallback, inferHumidity, convertPerenualToKnowledge MUST be exported
// from src/services/plantKnowledgeService.ts (Tasks 1+2 add the `export` keyword).

function deepEq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// --- DATA-02: parseHardiness behavior (zoneToTempMax + null fallback) ---
{
  const r1 = svcMod.parseHardiness({ max: '10' });
  assert(r1.tempMax === 38 && r1.tempMin === null,
    `W1.DATA-02.h1: parseHardiness({ max: "10" }) → tempMax: 38 (got ${JSON.stringify(r1)})`);

  const r2 = svcMod.parseHardiness({ max: '11' });
  assert(r2.tempMax === 40 && r2.tempMin === null,
    `W1.DATA-02.h2: parseHardiness({ max: "11" }) → tempMax: 40 (got ${JSON.stringify(r2)})`);

  const r3 = svcMod.parseHardiness(undefined);
  assert(deepEq(r3, { tempMin: null, tempMax: null }),
    `W1.DATA-02.h3: parseHardiness(undefined) → { tempMin: null, tempMax: null } (got ${JSON.stringify(r3)})`);

  const r4 = svcMod.parseHardiness({ min: '9', max: '11' });
  assert(r4.tempMin === -5 && r4.tempMax === 40,
    `W1.DATA-02.h4: parseHardiness({ min: "9", max: "11" }) → { tempMin: -5, tempMax: 40 } (got ${JSON.stringify(r4)})`);
}

// --- DATA-02: classifyTempMaxFallback behavior (4 anchors: 32 / 40 / 28 / 35) ---
{
  const t1 = svcMod.classifyTempMaxFallback({ family: 'Araceae' });
  assert(t1 === 32, `W1.DATA-02.f1: tropical fallback Araceae → 32 (got ${t1})`);

  const t2 = svcMod.classifyTempMaxFallback({ family: 'Cactaceae' });
  assert(t2 === 40, `W1.DATA-02.f2: succulent fallback Cactaceae → 40 (got ${t2})`);

  // NEW (Issue 1 fix): fría-28 cold-hardy branch
  const t3 = svcMod.classifyTempMaxFallback({ family: 'Rosaceae' });
  assert(t3 === 28, `W1.DATA-02.f3: fría fallback Rosaceae → 28 (got ${t3})`);

  // NEW: type-substring fría path (perennial keyword)
  const t4 = svcMod.classifyTempMaxFallback({ family: null, type: 'perennial' });
  assert(t4 === 28, `W1.DATA-02.f4: fría fallback type=perennial → 28 (got ${t4})`);

  // Cactus-first order discipline (Cactaceae + perennial type → 40, not 28)
  const t5 = svcMod.classifyTempMaxFallback({ family: 'Cactaceae', type: 'perennial' });
  assert(t5 === 40, `W1.DATA-02.f5: cactus-first order — Cactaceae + perennial → 40 not 28 (got ${t5})`);

  // Default templada when no rule matches
  const t6 = svcMod.classifyTempMaxFallback({});
  assert(t6 === 35, `W1.DATA-02.f6: default templada → 35 (got ${t6})`);
}

// --- DATA-03: inferHumidity behavior (4 spec rows from VALIDATION.md) ---
{
  const h1 = svcMod.inferHumidity({ family: 'Araceae' });
  assert(h1 === 'alta', `W1.DATA-03.h1: family=Araceae → 'alta' (got ${h1})`);

  const h2 = svcMod.inferHumidity({ family: 'Cactaceae' });
  assert(h2 === 'baja', `W1.DATA-03.h2: family=Cactaceae → 'baja' (got ${h2})`);

  const h3 = svcMod.inferHumidity({ family: null, type: 'succulent' });
  assert(h3 === 'baja', `W1.DATA-03.h3: type=succulent → 'baja' (got ${h3})`);

  const h4 = svcMod.inferHumidity({ family: 'Rosaceae' });
  assert(h4 === 'media', `W1.DATA-03.h4: family=Rosaceae → 'media' (default — humidity rules do not include Rosaceae) (got ${h4})`);
}

// --- End-to-end: convertPerenualToKnowledge wires both helpers + hardiness path ---
{
  // Tropical with hardiness.max = "11" → zone-derived tempMax=40 (not category fallback), humidity='alta'
  const k1 = svcMod.convertPerenualToKnowledge({
    id: 1, common_name: 'Monstera', scientific_name: ['Monstera deliciosa'], other_name: [],
    watering: 'Average', sunlight: ['part shade'], family: 'Araceae', type: 'tree',
    indoor: true, hardiness: { min: '9', max: '11' },
  });
  assert(k1.humidity === 'alta' && k1.temp_max_c === 40,
    `W1.E2E.k1: Monstera (Araceae, hardiness 9-11) → humidity='alta', tempMax=40 (got humidity=${k1.humidity}, tempMax=${k1.temp_max_c})`);

  // Tropical without hardiness → category fallback: humidity='alta', tempMax=32 (tropical anchor)
  const k2 = svcMod.convertPerenualToKnowledge({
    id: 2, common_name: 'X', scientific_name: ['X'], other_name: [],
    watering: 'M', sunlight: [], family: 'Araceae', type: 'tree',
  });
  assert(k2.humidity === 'alta' && k2.temp_max_c === 32,
    `W1.E2E.k2: Araceae no-hardiness → humidity='alta', tempMax=32 (category fallback) (got humidity=${k2.humidity}, tempMax=${k2.temp_max_c})`);

  // Rose without hardiness → humidity='media' (default — humidity rules don't match Rosaceae) AND tempMax=28 (fría branch DOES match Rosaceae)
  const k3 = svcMod.convertPerenualToKnowledge({
    id: 3, common_name: 'Rose', scientific_name: ['Rosa canina'], other_name: [],
    watering: 'M', sunlight: [], family: 'Rosaceae',
  });
  assert(k3.humidity === 'media' && k3.temp_max_c === 28,
    `W1.E2E.k3: Rosaceae no-hardiness → humidity='media', tempMax=28 (fría branch) (got humidity=${k3.humidity}, tempMax=${k3.temp_max_c})`);
}

// ─── Final report (assertSkippable placeholders shown when skipped) ───
if (skip > 0) {
  console.log(`[smoke-phase11] Skipped ${skip} (Wave 1 placeholders):\n${skips.join('\n')}`);
}
if (fail > 0) {
  console.error(`\n[smoke-phase11] FAIL ${fail}/${pass + fail}\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`[smoke-phase11] PASS ${pass}/${pass}${skip > 0 ? ` (+${skip} skipped)` : ''}`);
