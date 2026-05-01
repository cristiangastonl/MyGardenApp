import type { Location, ClimateOverride, WaterSeason } from '../types';
export type { WaterSeason };

/**
 * Three-zone watering season helper (Phase 5, SEASON-01..03).
 *
 * Returns 'warm' | 'cold' | 'tropical' for a given latitude and date.
 * - Tropical (|lat| ≤ 23.5°): always 'warm' bucket equivalent — no seasonal flip.
 * - Northern temperate (lat > 23.5°): warm Apr-Sep, cold Oct-Mar (month boundary).
 * - Southern temperate (lat < -23.5°): warm Oct-Mar, cold Apr-Sep.
 *
 * Pure function — recomputed on every read, no cache (CONTEXT.md SEASON locks).
 * Coexists with src/utils/tipSelector.ts > getSeason (4-season UI palette);
 * intentionally a different export name to avoid the naming collision called
 * out in Phase 5 RESEARCH.md Pitfall 1.
 */
/** Tropic of Cancer / Capricorn — inclusive boundary per CONTEXT.md SEASON-02 lock. */
export const TROPICAL_LAT_BOUNDARY = 23.5;

/**
 * Internal helper: returns the watering season for a given latitude and date.
 * Public callers MUST use `getEffectiveSeason` (Phase 7 SSOT).
 *
 * @param latitude  GPS latitude in degrees, or null for safe default ('warm' — LOC-03).
 * @param date      Reference date (callers MUST pass; no default for testability).
 */
function getWaterSeason(latitude: number | null, date: Date): WaterSeason {
  // SCHEMA-07 / LOC-03 alignment — never under-water on missing/invalid location.
  if (latitude === null || !Number.isFinite(latitude)) return 'warm';

  if (Math.abs(latitude) <= TROPICAL_LAT_BOUNDARY) return 'tropical';

  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  // Northern hemisphere warm = Apr(3) through Sep(8) inclusive.
  const isNorthernWarm = month >= 3 && month <= 8;

  if (latitude > 0) return isNorthernWarm ? 'warm' : 'cold';
  // Southern hemisphere — invert.
  return isNorthernWarm ? 'cold' : 'warm';
}

/**
 * Public SSOT for season selection (Phase 7, LOC-04 + LOC-05).
 *
 * Honors a user-set `climateOverride` (Settings > Zona climática) before
 * falling back to GPS-derived season via the internal getWaterSeason helper.
 *
 * Branch table (CONTEXT.md lock):
 * - 'tropical' → always 'warm' (matches SEASON-02; no flip)
 * - 'northern' → Northern temperate flip (warm Apr-Sep, cold Oct-Mar)
 * - 'southern' → Southern temperate flip (warm Oct-Mar, cold Apr-Sep)
 * - 'auto'     → use location.lat via getWaterSeason; null lat → 'warm' (LOC-03)
 *
 * @param location          User's set location (or null if not set / skipped)
 * @param climateOverride   User's manual override; undefined treated as 'auto'
 * @param date              Reference date (callers MUST pass)
 */
export function getEffectiveSeason(
  location: Location | null,
  climateOverride: ClimateOverride | undefined,
  date: Date
): WaterSeason {
  const override: ClimateOverride = climateOverride ?? 'auto';

  // Tropical override: always warm (SEASON-02 carry).
  if (override === 'tropical') return 'warm';

  // Temperate overrides: month-boundary flip with explicit hemisphere.
  if (override === 'northern' || override === 'southern') {
    const month = date.getMonth(); // 0 = Jan, 11 = Dec
    const isNorthernWarm = month >= 3 && month <= 8; // Apr-Sep
    if (override === 'northern') return isNorthernWarm ? 'warm' : 'cold';
    return isNorthernWarm ? 'cold' : 'warm'; // 'southern' inverse
  }

  // 'auto': delegate to existing GPS-derived helper.
  return getWaterSeason(location?.lat ?? null, date);
}
