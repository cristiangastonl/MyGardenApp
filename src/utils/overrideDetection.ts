/**
 * v1.2 Phase 14 (EDU-05). Override detection — compares user's stored Plant fields
 * against catalog PlantDBEntry recommendations. Drives the "Tus ajustes" section's
 * soft override note rendering in MyPlantDetailModal.
 *
 * Field selection (locked from CONTEXT.md):
 *   - lightLevel — user-set via LightLevelPicker
 *   - waterSchedule.warm — user-set via watering picker
 *   - waterSchedule.cold — user-set via watering picker
 *
 * Excluded (climate-driven, NOT user-set):
 *   - tempMin / tempMax — derived from location + climateOverride
 *   - humidity — derived from species + environment
 *
 * Pure function — no React, no async, no side effects.
 */
import type { Plant, PlantDBEntry } from '../types';

export type OverrideField = 'lightLevel' | 'waterScheduleWarm' | 'waterScheduleCold';

export interface OverrideResult {
  field: OverrideField;
  userValue: string | number;
  catalogValue: string | number;
}

/**
 * Returns the list of fields where the user's stored value differs from the catalog.
 * Empty array if entry is null, or if no user values are set, or if all set values match catalog.
 *
 * @param plant The user's stored Plant (camelCase types/index.ts).
 * @param entry The matching catalog PlantDBEntry (translated or not — only the locked-shape
 *              fields are compared, all of which are locale-independent enums/numbers).
 */
export function compareUserVsCatalog(
  plant: Plant,
  entry: PlantDBEntry | null
): OverrideResult[] {
  if (!entry) return [];
  const out: OverrideResult[] = [];

  // lightLevel — both must be set; both are LightLevel enum strings
  if (plant.lightLevel && entry.lightLevel && plant.lightLevel !== entry.lightLevel) {
    out.push({
      field: 'lightLevel',
      userValue: plant.lightLevel,
      catalogValue: entry.lightLevel,
    });
  }

  // waterSchedule.warm — both must be set non-undefined numbers
  if (
    plant.waterSchedule?.warm != null &&
    entry.waterSchedule?.warm != null &&
    plant.waterSchedule.warm !== entry.waterSchedule.warm
  ) {
    out.push({
      field: 'waterScheduleWarm',
      userValue: plant.waterSchedule.warm,
      catalogValue: entry.waterSchedule.warm,
    });
  }

  // waterSchedule.cold — both must be set non-undefined numbers
  if (
    plant.waterSchedule?.cold != null &&
    entry.waterSchedule?.cold != null &&
    plant.waterSchedule.cold !== entry.waterSchedule.cold
  ) {
    out.push({
      field: 'waterScheduleCold',
      userValue: plant.waterSchedule.cold,
      catalogValue: entry.waterSchedule.cold,
    });
  }

  return out;
}
