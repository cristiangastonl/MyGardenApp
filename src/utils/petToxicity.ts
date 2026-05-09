// src/utils/petToxicity.ts
// v1.2 Phase 19 (TOX-01) — Pet toxicity helpers.
//
// LOCKED DISCIPLINE: absence-of-field === 'unknown' (NOT 'safe').
// Pitfall 1 from RESEARCH.md: a `?? 'safe'` default would silently misclassify unclassified
// catalog entries as pet-safe. ALL consumers MUST use these helpers — never read
// `entry.petToxicity` directly.
//
// Consumers:
//   - PlantCard (TOX-03 badge gating)
//   - MyPlantDetailModal Mascotas section (TOX-04 per-state copy)
//   - OnboardingScreen pet-safe filter (TOX-05 isPetSafe filter chain)
//   - AddPlantModal toxicity warning banner (TOX-05 hasAnyToxicityWarning gate)

import type { PlantDBEntry, ToxLevel } from '../types';

/**
 * Resolve cats + dogs ToxLevel from an entry, defaulting absence to 'unknown'.
 *
 * @param entry The catalog entry (or null/undefined for custom plants without databaseId).
 * @returns Object with cats and dogs ToxLevel; both default to 'unknown' on absence.
 *
 * @example
 *   getPetToxicity(null)                                        // { cats: 'unknown', dogs: 'unknown' }
 *   getPetToxicity({ id: 'x' })                                 // { cats: 'unknown', dogs: 'unknown' }
 *   getPetToxicity({ id: 'x', petToxicity: { cats: 'toxic', dogs: 'safe' } })
 *                                                               // { cats: 'toxic', dogs: 'safe' }
 */
export function getPetToxicity(
  entry: PlantDBEntry | null | undefined
): { cats: ToxLevel; dogs: ToxLevel } {
  return {
    cats: entry?.petToxicity?.cats ?? 'unknown',
    dogs: entry?.petToxicity?.dogs ?? 'unknown',
  };
}

/**
 * True ONLY when BOTH cats and dogs are explicitly 'safe'.
 * 'unknown' is excluded (honest UI per CONTEXT.md TOX-05 lock).
 *
 * Used by: OnboardingScreen pet-safe filter (TOX-05).
 *
 * @example
 *   isPetSafe(null)                                             // false
 *   isPetSafe({ petToxicity: { cats: 'safe', dogs: 'safe' } })  // true
 *   isPetSafe({ petToxicity: { cats: 'safe', dogs: 'unknown' } })  // false (CRITICAL)
 */
export function isPetSafe(entry: PlantDBEntry | null | undefined): boolean {
  const tox = getPetToxicity(entry);
  return tox.cats === 'safe' && tox.dogs === 'safe';
}

/**
 * PlantCard badge gate (TOX-03): renders ONLY for 'toxic' and 'caution'.
 * 'safe' and 'unknown' return false — badge is hidden.
 *
 * @example
 *   shouldShowBadge('toxic')   // true
 *   shouldShowBadge('caution') // true
 *   shouldShowBadge('safe')    // false
 *   shouldShowBadge('unknown') // false
 */
export function shouldShowBadge(level: ToxLevel): boolean {
  return level === 'toxic' || level === 'caution';
}

/**
 * AddPlantModal warning banner gate (TOX-05): true when EITHER species is 'toxic' or 'caution'.
 * 'safe' + 'unknown' on both species → returns false (no banner).
 *
 * @example
 *   hasAnyToxicityWarning({ petToxicity: { cats: 'safe', dogs: 'safe' } })    // false
 *   hasAnyToxicityWarning({ petToxicity: { cats: 'caution', dogs: 'safe' } }) // true
 *   hasAnyToxicityWarning(null)                                               // false
 */
export function hasAnyToxicityWarning(
  entry: PlantDBEntry | null | undefined
): boolean {
  const tox = getPetToxicity(entry);
  return shouldShowBadge(tox.cats) || shouldShowBadge(tox.dogs);
}
