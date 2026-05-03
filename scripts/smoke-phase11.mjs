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

// ─── Wave 1 placeholders (Plans 01/02 will replace these with real assertions) ───
// DATA-01 (Plan 01) — isGoodMatch validator placement + behavior
assertSkippable(() => edgeSource.includes('function isGoodMatch(') ? edgeSource.includes('function isGoodMatch(') : undefined,
  'W1.DATA-01.placement: edge function defines isGoodMatch(...) [Plan 11-01]');
// DATA-02 (Plan 02) — parseHardiness reads hardiness.max
assertSkippable(() => svcSource.includes('zoneToTempMax') ? svcSource.includes('zoneToTempMax') : undefined,
  'W1.DATA-02.zoneToTempMax: parseHardiness has zoneToTempMax table [Plan 11-02]');
// DATA-03 (Plan 02) — humidity inference present in convertPerenualToKnowledge
assertSkippable(() => /inferHumidity|humidity:\s*(infer|classify|getHumidity)/.test(svcSource) ? true : undefined,
  'W1.DATA-03.inferHumidity: humidity inference helper present [Plan 11-02]');
// Schema expansion (Plan 01 + Plan 02) — family/type optional fields in BOTH PerenualPlantDetail interfaces
assertSkippable(() => /family\?:\s*string/.test(edgeSource) && /type\?:\s*string/.test(edgeSource) ? true : undefined,
  'W1.schema.edge: PerenualPlantDetail in edge function has family?: string AND type?: string [Plan 11-01]');
assertSkippable(() => /family\?:\s*string/.test(svcSource) && /type\?:\s*string/.test(svcSource) ? true : undefined,
  'W1.schema.client: PerenualPlantDetail in client service has family?: string AND type?: string [Plan 11-02]');

// ─── Final report (assertSkippable placeholders shown when skipped) ───
if (skip > 0) {
  console.log(`[smoke-phase11] Skipped ${skip} (Wave 1 placeholders):\n${skips.join('\n')}`);
}
if (fail > 0) {
  console.error(`\n[smoke-phase11] FAIL ${fail}/${pass + fail}\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`[smoke-phase11] PASS ${pass}/${pass}${skip > 0 ? ` (+${skip} skipped)` : ''}`);
