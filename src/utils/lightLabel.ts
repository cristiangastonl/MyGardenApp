/**
 * Pure helper: maps a plant (or catalog entry) to its translated light-level label.
 *
 * Phase 6 (LIGHT-06, LIGHT-07). Single source of truth for light-label rendering;
 * every read-side surface (PlantCard, MyPlantDetailModal, PlantHealthDetail,
 * PlantDetailModal, PlantDatabaseCard) calls this helper.
 *
 * Indoor/outdoor branch uses the typeId/category KEY, NOT the typeName display
 * string (Pitfall 2 — typeName is locale-variant and user-editable).
 *
 * Defensive 3-rung fallback ladder (Phase 4 Plan 04 pattern):
 *   1. v1.1 plant.lightLevel
 *   2. legacy plant.sunHours mapped via sunHoursToLightLevel()
 *   3. safe default 'bright_indirect'
 */
import type { LightLevel } from '../types';
import { sunHoursToLightLevel } from './migration';

/**
 * Outdoor category typeIds (Plant.typeId / PlantDBEntry.category). Locked in
 * 06-CONTEXT.md. NOTE: suculentas is INDOOR by default — succulents stay indoor
 * even though some are drought-tolerant.
 */
export const OUTDOOR_TYPE_IDS: ReadonlySet<string> = new Set([
  'exterior',
  'aromaticas',
  'huerta',
  'frutales',
]);

/**
 * Structural input type — accepts both Plant and PlantDBEntry. Callers operating
 * on PlantDBEntry should pass `{ ...entry, typeId: entry.category }` to map the
 * category field to typeId.
 */
export interface LightLabelInput {
  lightLevel?: LightLevel;
  sunHours?: number;
  typeId: string;
}

type Translator = (key: string) => string;

export function getLightLabel(input: LightLabelInput, t: Translator): string {
  // Rung 1 → 2 → 3 defensive ladder.
  const level: LightLevel =
    input.lightLevel
    ?? (typeof input.sunHours === 'number' ? sunHoursToLightLevel(input.sunHours) : undefined)
    ?? 'bright_indirect';

  const ns: 'indoor' | 'outdoor' = OUTDOOR_TYPE_IDS.has(input.typeId) ? 'outdoor' : 'indoor';
  return t(`lightLevel.${ns}.${level}`);
}
