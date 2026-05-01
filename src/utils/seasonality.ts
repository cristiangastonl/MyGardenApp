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
export type WaterSeason = 'warm' | 'cold' | 'tropical';

/** Tropic of Cancer / Capricorn — inclusive boundary per CONTEXT.md SEASON-02 lock. */
export const TROPICAL_LAT_BOUNDARY = 23.5;

/**
 * Returns the watering season for a given latitude and date.
 *
 * @param latitude  GPS latitude in degrees, or null for safe default ('warm' — LOC-03).
 * @param date      Reference date (callers MUST pass; no default for testability).
 */
export function getWaterSeason(latitude: number | null, date: Date): WaterSeason {
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
