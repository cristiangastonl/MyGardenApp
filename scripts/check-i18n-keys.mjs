#!/usr/bin/env node
// scripts/check-i18n-keys.mjs
// Phase 8 (CAT-06). For every PLANT_DATABASE canonical id, verify both
// en/plants.json and es/plants.json contain the full keyset.
// _aliases are NOT checked — runtime resolution via getCatalogEntry resolves
// aliases to canonical ids whose keysets we DO check.
// Exit 1 with itemised list on any failure. Exit 0 on full coverage.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-check-i18n');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Stub modules (reused pattern from smoke-phase08.mjs — single-compile-path policy)
writeFileSync(resolve(TMP_DIR, 'i18n.mjs'),
  `export default { t: (key, opts) => (opts && opts.defaultValue) || key, on: () => {}, language: 'es' };\n`);
writeFileSync(resolve(TMP_DIR, 'types.mjs'), `export {};\n`);

// Compile plantDatabase.ts via single-compile-path policy (typescript.transpileModule, no alternative compile paths)
const dbSource = readFileSync(resolve(ROOT, 'src/data/plantDatabase.ts'), 'utf8');
const rewritten = dbSource
  .replace(/from ['"]\.\.\/i18n['"]/g, `from './.tmp-check-i18n/i18n.mjs'`)
  .replace(/from ['"]\.\.\/types['"]/g, `from './.tmp-check-i18n/types.mjs'`);

const compiled = ts.transpileModule(rewritten, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  },
});

const tmpDbPath = resolve(__dirname, 'plantDatabase.compiled-check.mjs');
writeFileSync(tmpDbPath, compiled.outputText);
const { PLANT_DATABASE } = await import(tmpDbPath);

// Load i18n JSON
const en = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/locales/en/plants.json'), 'utf8'));
const es = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/locales/es/plants.json'), 'utf8'));

// Verify keyset per canonical id only.
// _aliases are NOT checked — runtime getCatalogEntry resolves them to canonical ids
// whose keysets are already verified here. i18n parity is a per-canonical-id concern.
const errors = [];
for (const entry of PLANT_DATABASE) {
  for (const [locale, dict] of [['en', en], ['es', es]]) {
    const node = dict[entry.id];
    if (!node) {
      errors.push(`[${locale}] missing key: "${entry.id}"`);
      continue;
    }
    if (!node.name) errors.push(`[${locale}] "${entry.id}".name missing`);
    if (!node.tip) errors.push(`[${locale}] "${entry.id}".tip missing`);
    if (!node.description) errors.push(`[${locale}] "${entry.id}".description missing`);
    if (!Array.isArray(node.problems) || node.problems.length < 1) {
      errors.push(`[${locale}] "${entry.id}".problems missing or empty`);
    }
    // nutrients: only required if entry declares nutrients
    if (entry.nutrients) {
      if (!node.nutrients || typeof node.nutrients !== 'object') {
        errors.push(`[${locale}] "${entry.id}".nutrients missing (entry declares nutrients)`);
      } else {
        if (!node.nutrients.type) errors.push(`[${locale}] "${entry.id}".nutrients.type missing`);
        if (!node.nutrients.homemade) errors.push(`[${locale}] "${entry.id}".nutrients.homemade missing`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`\n[check:i18n-keys] FAIL (${errors.length} issues):`);
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}
console.log(`[check:i18n-keys] PASS — ${PLANT_DATABASE.length} catalog ids verified across en/es plants.json`);
