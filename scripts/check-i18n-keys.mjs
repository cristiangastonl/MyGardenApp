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

    // ─── v1.2 Phase 14 (EDU-07) educational field checks ───
    // careAction: sub-fields independently conditional
    if (entry.careAction) {
      if (!node.careAction || typeof node.careAction !== 'object') {
        errors.push(`[${locale}] "${entry.id}".careAction missing (entry declares careAction)`);
      } else {
        if (entry.careAction.fixed && !node.careAction.fixed) {
          errors.push(`[${locale}] "${entry.id}".careAction.fixed missing`);
        }
        if (entry.careAction.soilCheck && !node.careAction.soilCheck) {
          errors.push(`[${locale}] "${entry.id}".careAction.soilCheck missing`);
        }
      }
    }
    // placementRecommended: scalar string — required if entry declares it
    if (entry.placementRecommended && !node.placementRecommended) {
      errors.push(`[${locale}] "${entry.id}".placementRecommended missing`);
    }
    // placementAlternatives: array — required non-empty if entry declares it
    if (entry.placementAlternatives) {
      if (!Array.isArray(node.placementAlternatives) || node.placementAlternatives.length < 1) {
        errors.push(`[${locale}] "${entry.id}".placementAlternatives missing or empty`);
      }
    }
    // placementAvoid: scalar string
    if (entry.placementAvoid && !node.placementAvoid) {
      errors.push(`[${locale}] "${entry.id}".placementAvoid missing`);
    }
    // whyRationale: scalar string — drives entire ¿Por qué? section visibility
    if (entry.whyRationale && !node.whyRationale) {
      errors.push(`[${locale}] "${entry.id}".whyRationale missing`);
    }

    // ─── v1.2 Phase 19 (TOX-06): conditional petToxicity.symptoms validation ───
    // When the catalog entry declares symptoms.{cats,dogs}, the corresponding plants.json
    // per-entry node MUST provide a non-empty array of the same approximate length.
    // 'safe' entries with no symptoms declared are NOT required to provide any key.
    if (Array.isArray(entry.petToxicity?.symptoms?.cats) && entry.petToxicity.symptoms.cats.length >= 1) {
      const catsNode = node?.petToxicity?.symptoms?.cats;
      if (!Array.isArray(catsNode) || catsNode.length < 1) {
        errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.cats missing or empty`);
      }
    }
    if (Array.isArray(entry.petToxicity?.symptoms?.dogs) && entry.petToxicity.symptoms.dogs.length >= 1) {
      const dogsNode = node?.petToxicity?.symptoms?.dogs;
      if (!Array.isArray(dogsNode) || dogsNode.length < 1) {
        errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.dogs missing or empty`);
      }
    }

    // ─── v1.2 Phase 20 (FERT-07): conditional fertilizer recommendation validation ───
    // When the catalog entry declares fertilizer.industrialRecommendation OR
    // fertilizer.homemadeRecommendation, the corresponding plants.json per-entry node
    // MUST provide a non-empty string for each declared sub-field. Sub-fields are
    // validated INDEPENDENTLY — suculentas entries (Plan 20-07) declare only
    // industrialRecommendation and intentionally omit homemadeRecommendation;
    // those entries pass the gate without a false-negative on the missing homemade key.
    // (Pitfall 6 — same independent-sub-field discipline as Phase 19 TOX-06 above.)
    if (entry.fertilizer?.industrialRecommendation) {
      const industrialNode = node?.fertilizer?.industrialRecommendation;
      if (typeof industrialNode !== 'string' || industrialNode.length < 1) {
        errors.push(`[${locale}] "${entry.id}".fertilizer.industrialRecommendation missing or empty`);
      }
    }
    if (entry.fertilizer?.homemadeRecommendation) {
      const homemadeNode = node?.fertilizer?.homemadeRecommendation;
      if (typeof homemadeNode !== 'string' || homemadeNode.length < 1) {
        errors.push(`[${locale}] "${entry.id}".fertilizer.homemadeRecommendation missing or empty`);
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
