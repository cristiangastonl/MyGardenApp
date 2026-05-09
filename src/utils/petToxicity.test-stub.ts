// src/utils/petToxicity.test-stub.ts
// v1.2 Phase 19 (TOX-01) — Documentation-as-code for petToxicity helpers.
//
// This file is NOT a test file — no test runner is installed (per CLAUDE.md).
// It encodes the locked behavioral contract in TypeScript-checkable form so:
//   1. tsc --noEmit verifies the helper signatures haven't drifted.
//   2. Future maintainers see the expected behavior at-a-glance.
//   3. Plan 19-04 / 19-05 executors can copy these expectations into manual
//      device-test checklists without re-deriving them.
//
// CRITICAL CONTRACT (Pitfall 1): absence === 'unknown', NEVER 'safe'.

import type { PlantDBEntry } from '../types';
import {
  getPetToxicity,
  isPetSafe,
  shouldShowBadge,
  hasAnyToxicityWarning,
} from './petToxicity';

// ─── Type-level checks (compile-time only) ───
// If these signatures drift, tsc --noEmit will FAIL.

const _absentEntry: PlantDBEntry = {
  id: 'test-absent',
  name: 'Test',
  scientificName: 'Test',
  icon: '🌱',
  category: 'interior',
  tempMin: 10,
  tempMax: 30,
  humidity: 'media',
  outdoor: false,
  tip: '',
  description: '',
  problems: [],
};

const _toxicEntry: PlantDBEntry = {
  ..._absentEntry,
  id: 'test-toxic',
  petToxicity: {
    cats: 'toxic',
    dogs: 'toxic',
    symptoms: { cats: ['Vomiting'], dogs: ['Vomiting'] },
    source: 'https://www.aspca.org/test',
  },
};

const _safeEntry: PlantDBEntry = {
  ..._absentEntry,
  id: 'test-safe',
  petToxicity: { cats: 'safe', dogs: 'safe' },
};

const _mixedEntry: PlantDBEntry = {
  ..._absentEntry,
  id: 'test-mixed',
  petToxicity: { cats: 'safe', dogs: 'caution', symptoms: { dogs: ['Mild GI upset'] }, source: 'https://www.aspca.org/test' },
};

// ─── Behavioral expectations (encoded as compile-time const declarations) ───
// These are NOT executed; they document the locked contract.

// EXPECTED: absence and null/undefined → both species 'unknown'
const _absentResult: { cats: 'unknown'; dogs: 'unknown' } = getPetToxicity(_absentEntry) as { cats: 'unknown'; dogs: 'unknown' };
const _nullResult: { cats: 'unknown'; dogs: 'unknown' } = getPetToxicity(null) as { cats: 'unknown'; dogs: 'unknown' };
const _undefResult: { cats: 'unknown'; dogs: 'unknown' } = getPetToxicity(undefined) as { cats: 'unknown'; dogs: 'unknown' };

// EXPECTED: explicit values surface unchanged
const _toxicResult: { cats: 'toxic'; dogs: 'toxic' } = getPetToxicity(_toxicEntry) as { cats: 'toxic'; dogs: 'toxic' };

// EXPECTED: isPetSafe excludes 'unknown' (CRITICAL — this is the contract)
const _isSafe_safe: true = isPetSafe(_safeEntry) as true;
const _isSafe_absent: false = isPetSafe(_absentEntry) as false;        // 'unknown' is NOT safe
const _isSafe_mixed: false = isPetSafe(_mixedEntry) as false;          // 'caution' is NOT safe

// EXPECTED: shouldShowBadge gates 'toxic' + 'caution' only
const _badge_toxic: true = shouldShowBadge('toxic') as true;
const _badge_caution: true = shouldShowBadge('caution') as true;
const _badge_safe: false = shouldShowBadge('safe') as false;
const _badge_unknown: false = shouldShowBadge('unknown') as false;     // NOT shown — honest UI

// EXPECTED: hasAnyToxicityWarning fires on either-species non-safe-non-unknown signal
const _banner_safe: false = hasAnyToxicityWarning(_safeEntry) as false;
const _banner_mixed: true = hasAnyToxicityWarning(_mixedEntry) as true;
const _banner_absent: false = hasAnyToxicityWarning(_absentEntry) as false;
const _banner_null: false = hasAnyToxicityWarning(null) as false;

// Suppress unused-binding warnings — these are documentation-only.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void [_absentResult, _nullResult, _undefResult, _toxicResult, _isSafe_safe, _isSafe_absent, _isSafe_mixed, _badge_toxic, _badge_caution, _badge_safe, _badge_unknown, _banner_safe, _banner_mixed, _banner_absent, _banner_null];
