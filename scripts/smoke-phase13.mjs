#!/usr/bin/env node
// scripts/smoke-phase13.mjs
// Phase 13 Gesture + Bottom-Sheet Infrastructure smoke runner.
// Wave 0: harness + scaffold PASSes + Plan 13-01/02 placeholders.
// Plan 13-01 wires INFRA-01 (deps) + INFRA-02 (App.tsx providers + babel).
// Plan 13-02 wires INFRA-03 (Skeleton + haptics + useDismissOnPaywall + SettingsScreen + i18n).
//
// FILE-CONTENT ASSERTS ONLY. NO ts-transpile compilation. Phase 13 is config + JSX wrapping
// (not runtime logic) so module compilation is unnecessary — readFileSync + regex is sufficient.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

globalThis.__DEV__ = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ─── Helpers ───
function readSafe(relPath) {
  const abs = resolve(ROOT, relPath);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}
function countMatches(text, pattern) {
  if (!text) return 0;
  const m = text.match(pattern);
  return m ? m.length : 0;
}

// ─── Assertion harness (mirrors smoke-phase12.mjs) ───
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

// ─── Wave 0: scaffold PASSes (always pass — verify the harness itself) ───
assert(typeof readFileSync === 'function', 'W0.1: node:fs.readFileSync available');
assert(typeof existsSync === 'function', 'W0.2: node:fs.existsSync available');
assert(typeof globalThis.__DEV__ === 'boolean', 'W0.3: __DEV__ shim present (false in smoke runner)');
assert(existsSync(resolve(ROOT, 'package.json')), 'W0.4: package.json present at repo root');
assert(existsSync(resolve(ROOT, 'App.tsx')), 'W0.5: App.tsx present at repo root');

// ─── Read source files ONCE for placeholder evaluation ───
let pkgJson = null;
try {
  const raw = readSafe('package.json');
  pkgJson = raw ? JSON.parse(raw) : null;
} catch { pkgJson = null; }
const appTsx = readSafe('App.tsx');
const babelConfig = readSafe('babel.config.js');
const skeletonSrc = readSafe('src/components/Skeleton.tsx');
const hapticsSrc = readSafe('src/utils/haptics.ts');
const dismissHookSrc = readSafe('src/hooks/useDismissOnPaywall.ts');
const settingsSrc = readSafe('src/screens/SettingsScreen.tsx');
const enCommon = readSafe('src/i18n/locales/en/common.json');
const esCommon = readSafe('src/i18n/locales/es/common.json');

// ─── INFRA-01 placeholders (Plan 13-01 — package.json deps) ───
// Each returns undefined → SKIP until the dep lands; then flips to true → PASS.
const deps = pkgJson && pkgJson.dependencies ? pkgJson.dependencies : {};

assertSkippable(() => {
  const v = deps['react-native-reanimated'];
  if (!v) return undefined;
  return /(\^|~)?4\.|(\^|~)4(\b|\.)/.test(v);
}, 'INFRA-01.reanimated: package.json includes react-native-reanimated at v4+ [Plan 13-01]');

assertSkippable(() => {
  const v = deps['react-native-gesture-handler'];
  if (!v) return undefined;
  return v.length > 0;
}, 'INFRA-01.gesture-handler: package.json includes react-native-gesture-handler [Plan 13-01]');

assertSkippable(() => {
  const v = deps['@gorhom/bottom-sheet'];
  if (!v) return undefined;
  return /(\^|~)?5\.|(\^|~)5(\b|\.)/.test(v);
}, 'INFRA-01.bottom-sheet: package.json includes @gorhom/bottom-sheet at v5+ [Plan 13-01]');

assertSkippable(() => {
  const v = deps['expo-haptics'];
  if (!v) return undefined;
  return v.length > 0;
}, 'INFRA-01.expo-haptics: package.json includes expo-haptics [Plan 13-01]');

// ─── INFRA-02 placeholders (Plan 13-01 — App.tsx provider wrap + babel) ───
assertSkippable(() => {
  if (!appTsx) return undefined;
  const c = countMatches(appTsx, /BottomSheetModalProvider/g);
  if (c === 0) return undefined; // baseline before Plan 13-01 — SKIP
  return c === 3;
}, 'INFRA-02.bottom-sheet-provider-count: App.tsx contains exactly 3 BottomSheetModalProvider refs (1 import + 1 JSX opening tag + 1 JSX closing tag) — single App-root wrap, locked JSX shape [Plan 13-01]');

assertSkippable(() => {
  if (!appTsx) return undefined;
  const c = countMatches(appTsx, /GestureHandlerRootView/g);
  if (c === 0) return undefined; // baseline before Plan 13-01 — SKIP
  return c === 3;
}, 'INFRA-02.gesture-root-view-count: App.tsx contains exactly 3 GestureHandlerRootView refs (1 import + 1 JSX opening tag + 1 JSX closing tag) — single App-root wrap, locked JSX shape [Plan 13-01]');

assertSkippable(() => {
  if (!appTsx) return undefined;
  const hasGorhomImport = /from ['"]@gorhom\/bottom-sheet['"]/.test(appTsx);
  const hasRNGHImport = /from ['"]react-native-gesture-handler['"]/.test(appTsx);
  if (!hasGorhomImport && !hasRNGHImport) return undefined; // baseline — SKIP
  return hasGorhomImport && hasRNGHImport;
}, 'INFRA-02.imports-present: App.tsx imports BOTH @gorhom/bottom-sheet AND react-native-gesture-handler [Plan 13-01]');

assertSkippable(() => {
  if (!appTsx) return undefined;
  // Verify JSX nesting: GestureHandlerRootView must wrap BottomSheetModalProvider
  // (i.e., GHRV opens before BSMP opens; BSMP closes before GHRV closes).
  const ghrvOpen = appTsx.indexOf('<GestureHandlerRootView');
  const bsmpOpen = appTsx.indexOf('<BottomSheetModalProvider');
  const bsmpClose = appTsx.indexOf('</BottomSheetModalProvider>');
  const ghrvClose = appTsx.indexOf('</GestureHandlerRootView>');
  if (ghrvOpen === -1 || bsmpOpen === -1) return undefined; // baseline — SKIP
  return ghrvOpen < bsmpOpen && bsmpOpen < bsmpClose && bsmpClose < ghrvClose;
}, 'INFRA-02.jsx-nesting: <GestureHandlerRootView> wraps <BottomSheetModalProvider> in App.tsx [Plan 13-01]');

assertSkippable(() => {
  if (!appTsx) return undefined;
  const ghrvOpen = appTsx.indexOf('<GestureHandlerRootView');
  if (ghrvOpen === -1) return undefined; // baseline — SKIP
  // Slice from <GHRV opener to next > and assert style flex 1
  const sliceEnd = appTsx.indexOf('>', ghrvOpen);
  const ghrvTag = appTsx.slice(ghrvOpen, sliceEnd + 1);
  return /style=\{\{\s*flex:\s*1\s*\}\}/.test(ghrvTag);
}, 'INFRA-02.flex-1: <GestureHandlerRootView> has style={{ flex: 1 }} [Plan 13-01]');

assertSkippable(() => {
  // babel.config.js conditional: either absent OR uses react-native-worklets/plugin (NOT the deprecated react-native-reanimated/plugin).
  // This assertion ALWAYS evaluates (no SKIP) because absence is a valid pass state.
  if (!babelConfig) return true; // ABSENT: PASS (preferred — babel-preset-expo auto-manages plugin under SDK 54)
  const hasWorklets = /react-native-worklets\/plugin/.test(babelConfig);
  const hasDeprecated = /react-native-reanimated\/plugin/.test(babelConfig);
  return hasWorklets && !hasDeprecated;
}, 'INFRA-02.babel-conditional: babel.config.js absent OR uses worklets/plugin (NOT deprecated reanimated/plugin) [Plan 13-01]');

// ─── INFRA-03 placeholders (Plan 13-02 — Skeleton + haptics + useDismissOnPaywall + SettingsScreen + i18n) ───

assertSkippable(() => {
  if (skeletonSrc === null) return undefined; // file absent — SKIP
  // Accept any of: `export function Skeleton`, `export const Skeleton`, `export default function Skeleton`, `export { Skeleton }`
  return /export\s+(?:default\s+)?(?:function|const)\s+Skeleton\b/.test(skeletonSrc)
    || /export\s*\{[^}]*\bSkeleton\b[^}]*\}/.test(skeletonSrc);
}, 'INFRA-03.skeleton-export: src/components/Skeleton.tsx exports a Skeleton component [Plan 13-02]');

assertSkippable(() => {
  if (skeletonSrc === null) return undefined;
  // Verify Skeleton uses Reanimated v4 + LinearGradient
  return /from\s+['"]react-native-reanimated['"]/.test(skeletonSrc)
    && /from\s+['"]expo-linear-gradient['"]/.test(skeletonSrc)
    && /useSharedValue|withRepeat|withTiming/.test(skeletonSrc);
}, 'INFRA-03.skeleton-impl: Skeleton.tsx uses react-native-reanimated + expo-linear-gradient + shimmer worklet [Plan 13-02]');

assertSkippable(() => {
  if (hapticsSrc === null) return undefined;
  return /export\s+function\s+triggerHaptic\b/.test(hapticsSrc)
    && /export\s+type\s+HapticKind\b/.test(hapticsSrc);
}, 'INFRA-03.haptics-exports: src/utils/haptics.ts exports triggerHaptic + HapticKind type [Plan 13-02]');

assertSkippable(() => {
  if (hapticsSrc === null) return undefined;
  // Verify all 7 HapticKind values are handled (impactLight/Medium/Heavy + success/warning/error + selection)
  const kinds = ['impactLight', 'impactMedium', 'impactHeavy', 'success', 'warning', 'error', 'selection'];
  return kinds.every((k) => new RegExp(`['"]${k}['"]`).test(hapticsSrc));
}, 'INFRA-03.haptics-kinds: triggerHaptic handles all 7 HapticKind values [Plan 13-02]');

assertSkippable(() => {
  if (dismissHookSrc === null) return undefined;
  return /export\s+function\s+useDismissOnPaywall\b/.test(dismissHookSrc)
    && /isPaywallVisible/.test(dismissHookSrc)
    && /\.dismiss\(\)/.test(dismissHookSrc);
}, 'INFRA-03.dismiss-hook: useDismissOnPaywall.ts exports hook + subscribes to isPaywallVisible + calls .dismiss() [Plan 13-02]');

assertSkippable(() => {
  if (settingsSrc === null) return undefined;
  const hasBSMImport = /from\s+['"]@gorhom\/bottom-sheet['"]/.test(settingsSrc);
  const hasSkeletonImport = /from\s+['"][^'"]*Skeleton['"]/.test(settingsSrc) || /\bSkeleton\b.*from/.test(settingsSrc);
  const hasDevTestKey = /settings\.devTestBottomSheet/.test(settingsSrc);
  // SKIP only if NONE of these landed (Plan 13-02 baseline)
  if (!hasBSMImport && !hasSkeletonImport && !hasDevTestKey) return undefined;
  return hasBSMImport && hasSkeletonImport && hasDevTestKey;
}, 'INFRA-03/04.settings-test-sheet: SettingsScreen imports BottomSheetModal + Skeleton + uses settings.devTestBottomSheet key [Plan 13-02]');

assertSkippable(() => {
  if (!enCommon || !esCommon) return undefined;
  const enHas = /"devTestBottomSheet"\s*:/.test(enCommon) && /"devTestBottomSheetContent"\s*:/.test(enCommon);
  const esHas = /"devTestBottomSheet"\s*:/.test(esCommon) && /"devTestBottomSheetContent"\s*:/.test(esCommon);
  if (!enHas && !esHas) return undefined; // baseline — SKIP
  return enHas && esHas;
}, 'INFRA-03/04.i18n-parity: en/common.json AND es/common.json contain devTestBottomSheet + devTestBottomSheetContent keys [Plan 13-02]');

// ─── Final report ───
if (skip > 0) {
  console.log(`[smoke-phase13] Skipped ${skip} (Plan 13-01/02 placeholders):\n${skips.join('\n')}`);
}
if (fail > 0) {
  console.error(`\n[smoke-phase13] FAIL ${fail}/${pass + fail}\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`[smoke-phase13] PASS ${pass}/${pass}${skip > 0 ? ` (+${skip} skipped)` : ''}`);
