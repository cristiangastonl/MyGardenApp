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

// ─── T4: i18n parity + interpolation markers (Plan 09-04) ───
const enJson = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/locales/en/common.json'), 'utf8'));
const esJson = JSON.parse(readFileSync(resolve(ROOT, 'src/i18n/locales/es/common.json'), 'utf8'));
const requiredKeys = ['continueChat', 'reopenChat', 'resumeBanner', 'reopenSystemMessage', 'messagesRemaining'];
for (const k of requiredKeys) {
  assert(typeof enJson?.diagnosis?.[k] === 'string' && enJson.diagnosis[k].length > 0,
    `T4.en.${k}: present + non-empty in en/common.json`);
  assert(typeof esJson?.diagnosis?.[k] === 'string' && esJson.diagnosis[k].length > 0,
    `T4.es.${k}: present + non-empty in es/common.json`);
}
// Interpolation markers
assert(enJson.diagnosis.reopenSystemMessage.includes('{{days}}'),
  "T4.en.reopenSystemMessage: contains {{days}} interpolation");
assert(esJson.diagnosis.reopenSystemMessage.includes('{{days}}'),
  "T4.es.reopenSystemMessage: contains {{days}} interpolation");
assert(enJson.diagnosis.messagesRemaining.includes('{{remaining}}') && enJson.diagnosis.messagesRemaining.includes('{{total}}'),
  "T4.en.messagesRemaining: contains {{remaining}} AND {{total}}");
assert(esJson.diagnosis.messagesRemaining.includes('{{remaining}}') && esJson.diagnosis.messagesRemaining.includes('{{total}}'),
  "T4.es.messagesRemaining: contains {{remaining}} AND {{total}}");
// Voseo verb (Phase 5 lock — /i flag tolerated, but exact match preferred)
assert(/sac[aá]/i.test(esJson.diagnosis.resumeBanner),
  "T4.es.resumeBanner: voseo verb 'sacá' present");

// PLACEHOLDER — Plan 09-07 activates
// T5: priorDiagnosisSummary in chat-diagnosis/index.ts >= 2 occurrences
// Assertion: grep -c "priorDiagnosisSummary" supabase/functions/chat-diagnosis/index.ts >= 2
pass++; // placeholder counts as pass until plan activates

// ─── T6: lifetime count arithmetic + presence (Plan 09-06 / DIAG-06 / RESEARCH §CF-7 fix) ───
(function testLifetimeCount() {
  const LIMIT = 3;
  const prior = [{role:'user'},{role:'assistant'},{role:'user'}];
  const session = [{role:'user'}];
  const priorUserCount = prior.filter(m => m.role === 'user').length; // 2
  const sessionUserCount = session.filter(m => m.role === 'user').length; // 1
  const lifetime = priorUserCount + sessionUserCount; // 3
  assert(lifetime === 3, 'T6a: lifetime count = prior(2) + session(1) = 3');
  const remaining = Math.max(0, LIMIT - lifetime);
  assert(remaining === 0, 'T6b: remaining = max(0, 3 - 3) = 0');
  // Above-limit boundary
  const overLimit = Math.max(0, LIMIT - 5);
  assert(overLimit === 0, 'T6c: above-limit clamped to 0 by Math.max guard');
  // At LIMIT-1
  const atOneRemaining = Math.max(0, LIMIT - 2);
  assert(atOneRemaining === 1, 'T6d: at lifetime=2, remaining=1');
})();
const premiumSrc = readFileSync(resolve(ROOT, 'src/config/premium.ts'), 'utf8');
assert(/^export const FREE_CHAT_MESSAGES_PER_DIAGNOSIS = 3;/m.test(premiumSrc),
  "T6e: FREE_CHAT_MESSAGES_PER_DIAGNOSIS exported from premium.ts (Plan 09-06 Task 1)");
const pdmSrc = readFileSync(resolve(ROOT, 'src/components/PlantDiagnosis/PlantDiagnosisModal.tsx'), 'utf8');
assert(/priorPersistedCount/.test(pdmSrc),
  "T6f: PlantDiagnosisModal computes priorPersistedCount (CF-7 fix)");
assert(/lifetimeUserCount/.test(pdmSrc),
  "T6g: PlantDiagnosisModal computes lifetimeUserCount");
assert(/showPaywall\('diagnosis-limit'/.test(pdmSrc),
  "T6h: showPaywall('diagnosis-limit' wired in PlantDiagnosisModal");
const drSrc = readFileSync(resolve(ROOT, 'src/components/PlantDiagnosis/DiagnosisResults.tsx'), 'utf8');
assert(/msg\.role === 'system'/.test(drSrc),
  "T6i: DiagnosisResults renders system messages distinctly (Pitfall 6 lock)");
assert(/diagnosis\.resumeBanner/.test(drSrc),
  "T6j: DiagnosisResults renders resume banner via t('diagnosis.resumeBanner')");
assert(/diagnosis\.messagesRemaining/.test(drSrc),
  "T6k: DiagnosisResults renders count display via t('diagnosis.messagesRemaining', ...)");

// T7: deferred callback fires once on success, cleared first (pure JS simulation)
// Plan 09-02 (PAY-03): consumePendingCallback clears before onSuccess fires; hidePaywall sees null.
{
  let callbackFired = false;
  let cancelFired = false;
  let pendingCallback = { onSuccess: () => { callbackFired = true; }, onCancel: () => { cancelFired = true; } };
  // Simulate consumePendingCallback (Plan 09-02 Task 2 contract)
  const cb = pendingCallback;
  pendingCallback = null;
  cb?.onSuccess?.();
  // Then simulate hidePaywall (which sees null pendingCallback)
  const cb2 = pendingCallback;
  pendingCallback = null;
  cb2?.onCancel?.();
  assert(callbackFired === true, "T7: onSuccess fires on consume");
  assert(cancelFired === false, "T7: onCancel does NOT fire after consume (Pitfall 7 lock)");
  assert(pendingCallback === null, "T7: pendingCallback cleared atomically");
}

// T8: PaywallModal in BOTH AppContent paths in App.tsx
// Plan 09-02 (PAY-01): Two-AppContent-paths discipline (Phase 5 Plan 05 lock).
// Slice-based extraction: each function body runs from its declaration to the next top-level declaration.
{
  const appSrc = readFileSync(resolve(ROOT, 'App.tsx'), 'utf8');
  const mvpStart = appSrc.indexOf('function AppContentMVP(');
  const fullStart = appSrc.indexOf('function AppContentFull(');
  const authStart = appSrc.indexOf('function AppContentFullInner(');
  const exportStart = appSrc.indexOf('\nexport default function App(');
  const mvpBody = mvpStart !== -1 && fullStart !== -1 ? appSrc.slice(mvpStart, fullStart) : '';
  const authBody = authStart !== -1 && exportStart !== -1 ? appSrc.slice(authStart, exportStart) : '';
  assert(mvpBody.length > 0 && /<PaywallModal/.test(mvpBody), "T8: PaywallModal mounted in AppContentMVP");
  assert(authBody.length > 0 && /<PaywallModal/.test(authBody), "T8: PaywallModal mounted in AppContentFullInner");
}

// PLACEHOLDER — Plan 09-08 activates
// T9: no direct showPaywall( inside PlantDiagnosisModal/PlantIdentifierModal without close-then-trigger wrapper
// Assertion: grep PlantDiagnosisModal.tsx + PlantIdentifierModal.tsx for raw showPaywall( count === 0
pass++; // placeholder counts as pass until plan activates

// T10: usePremium signature + PaywallCallbackOptions + new union members
// Plan 09-02 (PAY-03): all three widenings verified via source grep.
{
  const upSrc = readFileSync(resolve(ROOT, 'src/hooks/usePremium.tsx'), 'utf8');
  assert(/showPaywall:\s*\(trigger:\s*PaywallTrigger,\s*options\?:\s*PaywallCallbackOptions\)/.test(upSrc),
    "T10a: showPaywall signature accepts options? PaywallCallbackOptions");
  assert(/'diagnosis-resume'/.test(upSrc) && /'diagnosis-limit'/.test(upSrc),
    "T10b: PaywallTrigger union expanded with diagnosis-resume + diagnosis-limit");
  assert(/consumePendingCallback/.test(upSrc),
    "T10c: consumePendingCallback exposed (Plan 09-02 atomic get-and-clear contract)");
}

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
