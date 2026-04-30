import type {
  Plant,
  AppData,
  PlantCategory,
  LightLevel,
  WaterMode,
  WaterSchedule,
  PersistedAppData,
} from '../types';

// ───────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 1;
export const BACKUP_KEY = 'plant-agenda-v2.backup-pre-v1.1';

// TODO(v1.2): call cleanupBackup_v1_1() once on launch, then delete this helper
// and the backup key. Also delete this entire migration module — by v1.2 every
// user has migrated.

/**
 * Plants in non-suculenta categories that should still default to soil_check mode
 * because of their drought-tolerance / cactus-family physiology.
 *
 * Verified against src/data/plantDatabase.ts (Phase 4, Wave 1, 2026-04-30):
 *   - 'aloe-vera' (catalog id) — present
 *   - 'jade'                   — present
 *   - 'echeveria'              — present
 *   - 'haworthia'              — present
 *   - 'sedum'                  — present
 *   - 'cactus'                 — present
 *
 * 'aloe' is retained as a synonym because the v0 fixture and legacy plant
 * records may carry `databaseId: "aloe"` (vs. catalog's canonical 'aloe-vera').
 * The smoke runner's contract `inferWaterMode('interior', 'aloe') === 'soil_check'`
 * also depends on this synonym entry.
 */
const SOIL_CHECK_DB_IDS = new Set<string>([
  'aloe',
  'aloe-vera',
  'jade',
  'echeveria',
  'haworthia',
  'sedum',
  'cactus',
]);

// ───────────────────────────────────────────────────────────────────────────
// Pure mappers (LIGHT-03, WATER-04) — same source of truth used by Phase 8 catalog rebalance
// ───────────────────────────────────────────────────────────────────────────

/**
 * Maps legacy `sunHours` (numeric, daily-direct-sun-hours estimate) to the
 * v1.1 `LightLevel` taxonomy. Thresholds locked in CONTEXT.md.
 */
export function sunHoursToLightLevel(h: number): LightLevel {
  if (h >= 5) return 'direct';
  if (h >= 3) return 'bright_indirect';
  if (h >= 2) return 'medium_indirect';
  return 'low';
}

/**
 * Computes cold-season interval from warm-season interval using a per-category
 * heuristic factor. Result clamped to [1, 30] days. Phase 8 catalog rebalance
 * will replace heuristic outputs with expert-vetted per-entry overrides.
 */
export function applyColdFactor(warmDays: number, category?: PlantCategory): number {
  const factor: Record<PlantCategory, number> = {
    suculentas: 2.0,
    interior:   1.5,
    exterior:   1.7,
    aromaticas: 1.5,
    huerta:     1.3,
    frutales:   1.5,
  };
  const cat = category ?? 'interior';
  const result = Math.round(warmDays * factor[cat]);
  return Math.max(1, Math.min(30, result));
}

/**
 * Infers default watering mode. category === 'suculentas' OR explicit allowlist
 * → 'soil_check'. All others → 'fixed'.
 */
export function inferWaterMode(category?: PlantCategory, dbId?: string): WaterMode {
  if (category === 'suculentas') return 'soil_check';
  if (dbId && SOIL_CHECK_DB_IDS.has(dbId)) return 'soil_check';
  return 'fixed';
}

// ───────────────────────────────────────────────────────────────────────────
// Optional helper resolution — keeps migration runnable from a node-only smoke
// test that cannot import the full RN module graph.
// ───────────────────────────────────────────────────────────────────────────

type FindDatabaseEntry = (plant: Plant) => { category?: PlantCategory; id?: string } | null | undefined;

let _findDatabaseEntry: FindDatabaseEntry | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('./plantInfo');
  if (mod && typeof mod.findDatabaseEntry === 'function') {
    _findDatabaseEntry = mod.findDatabaseEntry;
  }
} catch {
  _findDatabaseEntry = null;
}

function lookupCategoryAndId(plant: Plant): { category?: PlantCategory; dbId?: string } {
  if (_findDatabaseEntry) {
    const entry = _findDatabaseEntry(plant);
    if (entry) return { category: entry.category, dbId: entry.id };
  }
  // Fallback: derive nothing about category, pass through stored databaseId
  // (smoke-test path or first-launch before catalog ready)
  return { category: undefined, dbId: plant.databaseId };
}

// ───────────────────────────────────────────────────────────────────────────
// Per-plant migration v0 → v1
// ───────────────────────────────────────────────────────────────────────────

/**
 * Migrates a single plant from v1.0 → v1.1 schema.
 * - Preserves per-instance user customizations (sunHours / waterEvery from the
 *   stored plant, NOT from catalog defaults — see PITFALLS MOD-3).
 * - Idempotent: returns unchanged if plant already has all v1.1 fields.
 * - Marks plant with `_migratedFromV0: true` so the post-migration tooltip layer
 *   can show "we changed how light works" hint only on pre-v1.1 plants.
 */
export function migratePlant_0to1(plant: Plant): Plant {
  // Defensive idempotency guard
  if (plant.lightLevel && plant.waterSchedule && plant.waterMode) {
    return plant;
  }

  const { category, dbId } = lookupCategoryAndId(plant);

  // Use per-instance values — NOT catalog defaults (preserves user customizations)
  // Default sunHours to 3 (bright_indirect) when absent — safest indoor default
  const sunHours = typeof plant.sunHours === 'number' ? plant.sunHours : 3;
  const lightLevel: LightLevel = plant.lightLevel ?? sunHoursToLightLevel(sunHours);

  // Default waterEvery to 7 days when absent
  const warmDays = plant.waterSchedule?.warm
    ?? (typeof plant.waterEvery === 'number' ? plant.waterEvery : 7);
  const coldDays = plant.waterSchedule?.cold ?? applyColdFactor(warmDays, category);

  const waterMode: WaterMode = plant.waterMode ?? inferWaterMode(category, dbId);

  return {
    ...plant,
    lightLevel,
    waterSchedule: { warm: warmDays, cold: coldDays },
    waterMode,
    _migratedFromV0: true,
    // legacy fields (sunHours, waterEvery) intentionally retained for v1.1
  };
}

// ───────────────────────────────────────────────────────────────────────────
// AppData migration v0 → v1
// ───────────────────────────────────────────────────────────────────────────

function migrateV0toV1(data: AppData): AppData {
  return {
    ...data,
    plants: (data.plants ?? []).map(migratePlant_0to1),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Envelope detection + idempotent migration runner
// ───────────────────────────────────────────────────────────────────────────

/**
 * Type guard for the v1.1+ versioned envelope.
 * v0 (pre-v1.1) wrote the unwrapped AppData directly with no schemaVersion key.
 */
export function isVersioned(raw: unknown): raw is PersistedAppData {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { schemaVersion?: unknown }).schemaVersion === 'number' &&
    (raw as { data?: unknown }).data !== undefined
  );
}

/**
 * Coerces raw parsed JSON into a PersistedAppData envelope.
 * v0 unwrapped → wraps as { schemaVersion: 0, data: raw }.
 * v1+ envelope → returns as-is.
 */
export function toPersisted(raw: unknown): PersistedAppData {
  if (isVersioned(raw)) return raw;
  return { schemaVersion: 0, data: raw as AppData };
}

/**
 * Idempotent migration entry point. Runs ordered v0→v1 (and future v1→v2, etc.)
 * transforms. Returns the post-migration AppData ready for setState.
 */
export function runMigrations(persisted: PersistedAppData): AppData {
  let { schemaVersion, data } = persisted;
  if (schemaVersion < 1) {
    data = migrateV0toV1(data);
    schemaVersion = 1;
  }
  // Future: if (schemaVersion < 2) data = migrateV1toV2(data);
  return data;
}

// ───────────────────────────────────────────────────────────────────────────
// Cleanup helper — intended to be wired up by v1.2 release, not v1.1
// ───────────────────────────────────────────────────────────────────────────

/**
 * Removes the v1.1 backup blob. Call ONCE on launch in v1.2.
 * Imports AsyncStorage lazily so this module stays runtime-pure for smoke testing.
 */
export async function cleanupBackup_v1_1(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(BACKUP_KEY);
  } catch {
    // Silent — cleanup must not crash startup
  }
}
