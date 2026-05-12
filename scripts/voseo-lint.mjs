#!/usr/bin/env node
/**
 * scripts/voseo-lint.mjs
 *
 * Phase 23 POLISH-06 voseo-lint enforcement skeleton.
 *
 * Scope: walks src/i18n/locales/es/*.json and asserts that no banned Castilian /
 * formal forms appear in string values. ES JSON only — NOT .tsx (CLAUDE.md already
 * mandates `t('key')` only; hardcoded strings are caught elsewhere).
 *
 * Wave 0 (Plan 23-00) ships THIS SKELETON: BANNED list is empty, walkValues is
 * implemented, exit codes are wired. The skeleton exits 0 with a stdout flag
 * literal `skeleton — BANNED list empty until Plan 23-02` that smoke-phase23.cjs
 * POLISH-06.voseo-lint-exit-0 sentinel uses to discriminate SKIP (skeleton state)
 * from PASS (strict body shipped in Plan 23-02).
 *
 * Plan 23-02 lands STRICT body:
 *   - Populates BANNED list per RESEARCH §Pattern 3 lines 263-274
 *   - Finalizes WHITELIST_KEYS per RESEARCH §Pitfall 4 + §Open Question 2
 *   - Fixes the 17 pre-existing voseo violations in es/common.json (§Finding 7)
 *   - Removes the `skeleton — BANNED list empty` stdout literal
 *
 * Exit codes:
 *   0 — no violations (or skeleton state at W0 baseline)
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

// Plan 23-02 populates per RESEARCH §Pattern 3 lines 263-274 (Castilian tuteo,
// imperatives, pronouns, formal 3rd-person). Empty placeholder skeleton at W0.
const BANNED = [];

// Plan 23-02 finalizes — see RESEARCH §Open Question 2 + §Pitfall 4 (e.g. allow
// `tu` as possessive adjective via `\btu\s+\w+` context-aware regex, not `\btú\b`
// pronoun). Empty placeholder skeleton at W0.
const WHITELIST_KEYS = new Set();

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

console.log('voseo-lint: PASS (skeleton — BANNED list empty until Plan 23-02)');
process.exit(0);
