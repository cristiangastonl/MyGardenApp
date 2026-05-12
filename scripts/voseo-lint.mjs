#!/usr/bin/env node
/**
 * scripts/voseo-lint.mjs
 *
 * Phase 23 POLISH-06 voseo-lint enforcement (STRICT body).
 *
 * Scope: walks src/i18n/locales/es/*.json and asserts that no banned Castilian /
 * formal forms appear in string values. ES JSON only — NOT .tsx (CLAUDE.md already
 * mandates `t('key')` only; hardcoded strings are caught elsewhere).
 *
 * Plan 23-02 landed the STRICT body:
 *   - BANNED regex array populated per RESEARCH §Pattern 3 (Castilian tuteo, imperatives,
 *     pronouns, formal 3rd-person) with §Pitfall 4 accent discrimination on `\btú\b`
 *   - WHITELIST_KEYS finalized for legitimate 3rd-person uses (§Open Question 2)
 *   - All pre-existing voseo violations across es/common.json, es/plants.json and
 *     es/tips.json fixed atomically alongside the lint impl
 *
 * Exit codes:
 *   0 — no violations
 *   1 — one or more banned forms detected
 *   2 — parse error or missing locale directory
 *
 * Usage:
 *   node scripts/voseo-lint.mjs
 *   npm run lint:voseo
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ES_DIR = path.resolve(ROOT, 'src/i18n/locales/es');

/**
 * Banned forms — word-bounded. Castilian/formal Spanish forbidden in es-AR voseo register.
 *
 * IMPORTANT (Pitfall 4): only `\btú\b` (accented pronoun) is banned. The unaccented
 * `tu` is a legitimate possessive ("tu jardín está esperando"). Spanish keyboards
 * may produce either form; the regex requires the accent to flag a violation.
 */
const BANNED = [
  // Castilian 2nd-person verbs (tuteo)
  /\btienes\b/i, /\bpuedes\b/i, /\bdebes\b/i, /\bquieres\b/i, /\beres\b/i,
  // Castilian imperatives (have voseo equivalents)
  /\briega\b/i, /\bsaca\b/i, /\bpode\b/i, /\bcorta\b/i,
  /\bfertiliza\b/i, /\bagrega\b/i, /\bven\b/i, /\bmira\b/i, /\bescucha\b/i,
  /\belige\b/i, /\busa\b/i, /\btoca\b/i, /\bmueve\b/i, /\bhaz\b/i,
  // Pronouns (NOT possessive 'tu' — see JSDoc above)
  /\btú\b/i,
  // Formal 3rd-person
  /\busted\b/i, /\bustedes\b/i,
];

/**
 * Whitelist — i18n key paths where banned forms appear as legitimate 3rd-person
 * verb forms, NOT Castilian imperatives. Documented in RESEARCH §Open Question 2.
 *
 * - settings.locationDescription: "Tu ubicación se usa para..." (reflexive 3rd-person)
 * - alerts.sunDayToday: "Hoy toca sacarla al sol" (impersonal 3rd-person "it's time to")
 */
const WHITELIST_KEYS = new Set([
  'common.settings.locationDescription',
  'common.alerts.sunDayToday',
]);

let fail = 0;
const violations = [];

function walkValues(obj, keyPath) {
  if (typeof obj === 'string') {
    if (WHITELIST_KEYS.has(keyPath)) return;
    for (const re of BANNED) {
      const m = obj.match(re);
      if (m) {
        violations.push(`${keyPath}: "${obj.slice(0, 70)}" — banned form: ${m[0]}`);
        fail++;
      }
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      walkValues(v, keyPath ? `${keyPath}.${k}` : k);
    }
  }
}

if (!fs.existsSync(ES_DIR)) {
  console.error(`voseo-lint: ES locale directory not found at ${ES_DIR}`);
  process.exit(2);
}

for (const f of fs.readdirSync(ES_DIR)) {
  if (!f.endsWith('.json')) continue;
  const full = path.join(ES_DIR, f);
  let json;
  try {
    json = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    console.error(`voseo-lint: parse error in ${f}: ${e.message}`);
    process.exit(2);
  }
  walkValues(json, f.replace(/\.json$/, ''));
}

if (fail > 0) {
  console.error(`voseo-lint: ${fail} violation(s):`);
  violations.forEach((v) => console.error(`  ${v}`));
  process.exit(1);
}

console.log('voseo-lint: PASS');
process.exit(0);
