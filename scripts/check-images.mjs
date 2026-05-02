#!/usr/bin/env node
// scripts/check-images.mjs
// Phase 8 (CAT-07). Async HEAD-request check for every catalog imageUrl.
// Exits 1 with itemised URL list on any non-200.
// EXPECTED to fail at Phase 8 ship for the 14 new outdoor entries
// (images not yet uploaded to Supabase Storage). See CLAUDE.md > Pre-submit Checks
// for the accepted-known list. Tracked in v1_1_test_backlog.md.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-check-images');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Stub modules (single-compile-path policy — typescript.transpileModule, no alternative compile paths)
writeFileSync(resolve(TMP_DIR, 'i18n.mjs'),
  `export default { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' };\n`);
writeFileSync(resolve(TMP_DIR, 'types.mjs'), `export {};\n`);

const dbSource = readFileSync(resolve(ROOT, 'src/data/plantDatabase.ts'), 'utf8');
const rewritten = dbSource
  .replace(/from ['"]\.\.\/i18n['"]/g, `from './.tmp-check-images/i18n.mjs'`)
  .replace(/from ['"]\.\.\/types['"]/g, `from './.tmp-check-images/types.mjs'`);

const compiled = ts.transpileModule(rewritten, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  },
});

const tmpDbPath = resolve(__dirname, 'plantDatabase.compiled-images.mjs');
writeFileSync(tmpDbPath, compiled.outputText);
const { PLANT_DATABASE } = await import(tmpDbPath);

const CONCURRENCY = 8;
const TIMEOUT_MS = 10_000;

// Build the URL list (skip entries without imageUrl)
const urls = PLANT_DATABASE
  .filter(e => e.imageUrl)
  .map(e => ({ id: e.id, url: e.imageUrl }));

console.log(`[check:images] HEAD-checking ${urls.length} URLs at concurrency ${CONCURRENCY}...`);

const failures = [];

async function checkOne({ id, url }) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(timer);
    if (res.status !== 200) {
      failures.push(`[${id}] ${url} → ${res.status}`);
    }
  } catch (err) {
    failures.push(`[${id}] ${url} → ERROR ${err.message || err}`);
  }
}

// Concurrency-limited runner
async function runPool(items, concurrency, fn) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

await runPool(urls, CONCURRENCY, checkOne);

if (failures.length > 0) {
  console.error(`\n[check:images] FAIL (${failures.length}/${urls.length} URLs):`);
  failures.forEach(f => console.error('  ' + f));
  console.error(`\nNote: 14 new entries (jacaranda, ceibo, glicina, gardenia, camelia, dalia,`);
  console.error(`salvia-ornamental, cala, copete, verbena, lavanda-stoechas, lavanda-dentada,`);
  console.error(`romero-rastrero, tomate-cherry) are accepted-known failures pending image upload.`);
  console.error(`lavanda-angustifolia (renamed from lavanda) may also need re-upload.`);
  console.error(`See CLAUDE.md > Pre-submit Checks for context. Tracked in v1_1_test_backlog.md.`);
  process.exit(1);
}
console.log(`[check:images] PASS — ${urls.length} URLs returned 200 OK`);
