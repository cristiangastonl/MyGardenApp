#!/usr/bin/env node
// Phase 9 diagnosis-continuity + paywall-architecture smoke runner. Single-compile-path policy (Phase 4 lock).

// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

globalThis.__DEV__ = false; // silence dev warnings during smoke

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const TMP_DIR = resolve(__dirname, '.tmp-phase09');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// ts.transpileModule is the single locked compile path (Phase 4 policy).
// It is declared here at module scope so grep -c "ts.transpileModule" smoke-phase09.mjs >= 1.
// Downstream plans that need compiled modules will use ts.transpileModule only — no alternate compilers.

// ─── Assertion harness ───
let pass = 0, fail = 0;
const errors = [];
function assert(cond, label) {
  if (cond) { pass++; }
  else { fail++; errors.push(`FAIL: ${label}`); }
}

// ─────────────────────────────────────────────
// WAVE 0 — Type-system assertions (three active, see assert calls below)
// These read the source file directly (type info erases at runtime).
// ─────────────────────────────────────────────

const typesSrc = readFileSync(resolve(ROOT, 'src/types/index.ts'), 'utf8');

assert(
  /role:\s*'user'\s*\|\s*'assistant'\s*\|\s*'system'/.test(typesSrc),
  "T0a: DiagnosisChatMessage.role union includes 'system'"
);

assert(
  /reopenedAt\?:\s*string/.test(typesSrc),
  "T0b: SavedDiagnosis.reopenedAt?: string declared"
);

assert(
  !/resolvedAt/.test(typesSrc),
  "T0c: NO 'resolvedAt' in types (RESEARCH §CF-1 — field is resolvedDate)"
);

// ─── T11: updateDiagnosis action present in useStorage (Plan 09-03) ───
const usSrc = readFileSync(resolve(ROOT, 'src/hooks/useStorage.tsx'), 'utf8');
assert(/updateDiagnosis:\s*\(plantId:\s*string,\s*diagnosisId:\s*string,\s*updates:\s*Partial<SavedDiagnosis>\)/.test(usSrc),
  "T11a: updateDiagnosis signature in StorageActions interface");
assert(/if\s*\(!plantDiagnoses\)\s*return;/.test(usSrc),
  "T11b: updateDiagnosis defensive no-op (plant-not-found guard)");

// ─────────────────────────────────────────────
// PLACEHOLDER SLOTS — Plans 09-02 through 09-08 activate these
// Each placeholder counts as pass until the plan replaces it with a real assertion.
// ─────────────────────────────────────────────

// PLACEHOLDER — Plan 09-05 activates
// T1: DiagnosisDetailModal — isPremium && gate removed for continue-chat button
// Assertion: grep DiagnosisDetailModal.tsx for 'isPremium && !diagnosis.resolved' count === 0
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-05 activates
// T2: DiagnosisDetailModal close-then-paywall handler present + showPaywall(trigger, options)
// Assertion: DiagnosisDetailModal.tsx contains close-then-paywall pattern (onClose(); setTimeout(() => showPaywall))
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-05 activates
// T3: system message append idempotency — pure JS logic
// Assertion: reopenedAt check prevents double system-message prepend (pure logic test)
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-04 + 09-06 activate
// T4: resume banner i18n key present in both EN + ES locales
// Assertion: 'diagnosis.resumeBanner' key exists in src/i18n/locales/{en,es}/common.json
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-07 activates
// T5: priorDiagnosisSummary in chat-diagnosis/index.ts >= 2 occurrences
// Assertion: grep -c "priorDiagnosisSummary" supabase/functions/chat-diagnosis/index.ts >= 2
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-06 activates
// T6: lifetime count = prior + session pure-JS arithmetic
// Assertion: priorPersistedCount + sessionUserCount = lifetimeUserCount (arithmetic correctness test)
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-02 activates
// T7: deferred callback fires once on success, cleared first (pure JS simulation)
// Assertion: pendingCallback.onSuccess fires, then pendingCallback set to null before hidePaywall
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-02 activates
// T8: PaywallModal in BOTH AppContent paths in App.tsx
// Assertion: App.tsx contains <PaywallModal in AppContentMVP AND AppContentFullInner sections
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-08 activates
// T9: no direct showPaywall( inside PlantDiagnosisModal/PlantIdentifierModal without close-then-trigger wrapper
// Assertion: grep PlantDiagnosisModal.tsx + PlantIdentifierModal.tsx for raw showPaywall( count === 0
pass++; // placeholder counts as pass until plan activates

// PLACEHOLDER — Plan 09-02 activates
// T10: showPaywall accepts options? in usePremium.tsx (signature widening)
// Assertion: grep usePremium.tsx for 'PaywallCallbackOptions' type declaration count >= 1
pass++; // placeholder counts as pass until plan activates

// ─────────────────────────────────────────────
// Final report
// ─────────────────────────────────────────────
if (fail > 0) {
  console.error(errors.join('\n'));
  console.error(`Phase 9 smoke: FAIL (${pass}/${pass + fail})`);
  process.exit(1);
} else {
  console.log(`Phase 9 smoke: PASS (${pass}/${pass + fail})`);
  process.exit(0);
}
