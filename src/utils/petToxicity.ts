// src/utils/petToxicity.ts
// v1.2 Phase 19 (TOX-01) — Pet toxicity helpers.
// Single source of truth for "absence === 'unknown'" discipline. ALL consumers use these
// helpers; never read entry.petToxicity directly. (Pitfall 1 from RESEARCH.md.)

import type { PlantDBEntry, ToxLevel } from '../types';

/** Resolve cats + dogs ToxLevel from an entry, defaulting absence to 'unknown'. */
export function getPetToxicity(
  entry: PlantDBEntry | null | undefined
): { cats: ToxLevel; dogs: ToxLevel } {
  return {
    cats: entry?.petToxicity?.cats ?? 'unknown',
    dogs: entry?.petToxicity?.dogs ?? 'unknown',
  };
}

/** True only when BOTH species are explicitly 'safe'. 'unknown' is excluded honestly. */
export function isPetSafe(entry: PlantDBEntry | null | undefined): boolean {
  const tox = getPetToxicity(entry);
  return tox.cats === 'safe' && tox.dogs === 'safe';
}

/** PlantCard badge gates: render only for 'toxic' or 'caution' (not 'safe' / 'unknown'). */
export function shouldShowBadge(level: ToxLevel): boolean {
  return level === 'toxic' || level === 'caution';
}

/** AddPlantModal banner gate: any non-safe non-unknown signal on either species. */
export function hasAnyToxicityWarning(
  entry: PlantDBEntry | null | undefined
): boolean {
  const tox = getPetToxicity(entry);
  return shouldShowBadge(tox.cats) || shouldShowBadge(tox.dogs);
}
