import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbPlantKnowledge, DbPlantKnowledgeInsert } from '../types/database';

/**
 * Escape special characters that have meaning in PostgREST filter strings
 * to prevent injection via ilike/or filters.
 */
function escapePostgrestFilter(str: string): string {
  return str.replace(/[%_,.()"'\\]/g, '');
}

interface PerenualPlant {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name: string[];
  default_image?: {
    regular_url?: string;
    medium_url?: string;
    small_url?: string;
  };
  watering: string;
  sunlight: string[];
}

interface PerenualPlantDetail extends PerenualPlant {
  description?: string;
  care_level?: string;
  maintenance?: string;
  watering_general_benchmark?: {
    value?: string;
    unit?: string;
  };
  indoor?: boolean;
  hardiness?: {
    min?: string;
    max?: string;
  };
  family?: string;   // ADD: taxonomic family (e.g., "Araceae", "Cactaceae") - mirrors edge function (Plan 11-01)
  type?: string;     // ADD: plant type (e.g., "tree", "Flower", "succulent") - used by inferHumidity + classifyTempMaxFallback
}

interface PlantKnowledgeResult {
  success: boolean;
  data: DbPlantKnowledge | null;
  source: 'cache' | 'api' | 'none';
  error?: string;
}

/**
 * Search for plant knowledge - first in cache, then API
 */
export async function searchPlantKnowledge(
  plantName: string
): Promise<PlantKnowledgeResult> {
  // 1. Try local cache first
  const cached = await searchLocalCache(plantName);
  if (cached) {
    return { success: true, data: cached, source: 'cache' };
  }

  // 2. If not in cache, fetch from edge function
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      data: null,
      source: 'none',
      error: 'Supabase not configured',
    };
  }

  const apiResult = await fetchFromPerenual(plantName);
  if (apiResult) {
    // 3. Save to cache for future use
    const saved = await saveToCache(apiResult);
    if (saved) {
      return { success: true, data: saved, source: 'api' };
    }
    // If save failed, return the data anyway (with fake id for TS)
    const fakeData: DbPlantKnowledge = {
      ...apiResult,
      id: 'temp-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: fakeData, source: 'api' };
  }

  return {
    success: false,
    data: null,
    source: 'none',
    error: 'Plant not found',
  };
}

/**
 * Search in Supabase cache
 */
async function searchLocalCache(
  plantName: string
): Promise<DbPlantKnowledge | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const nameLower = escapePostgrestFilter(plantName.toLowerCase().trim());

    // Search by common name, scientific name, or other names
    const { data, error } = await supabase
      .from('plant_knowledge')
      .select('*')
      .or(
        `common_name.ilike.%${nameLower}%,scientific_name.ilike.%${nameLower}%`
      )
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0] as unknown as DbPlantKnowledge;
  } catch {
    return null;
  }
}

/**
 * Fetch plant data via the get-plant-care Supabase Edge Function (Phase 10 SEC-02/03).
 * The Perenual API key lives ONLY in Supabase secrets (PERENUAL_API_KEY) — never bundled with the client.
 *
 * Signature preserved: all 4 internal callers (searchPlantKnowledge etc.) work unchanged.
 * On any failure (Supabase error, network, no plants found, edge function error) returns null
 * so the defensive fallback ladder in getEnrichedPlantData() drops to defaults.
 */
async function fetchFromPerenual(
  plantName: string,
  lang?: 'en' | 'es'
): Promise<DbPlantKnowledgeInsert | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    console.log('[PlantKnowledge] Fetching from Perenual via edge function...');

    const { data: invokeResponse, error: invokeError } = await supabase.functions.invoke(
      'get-plant-care',
      { body: { plantName, lang } }
    );

    if (invokeError) {
      console.log('[PlantKnowledge] Edge function invoke error:', invokeError.message);
      return null;
    }

    // Edge function envelope: { data: PerenualPlantDetail | null, error?: string }
    // (Plan 10-01 deliberate envelope so future fields don't break the contract.)
    const detail = (invokeResponse as { data?: PerenualPlantDetail | null; error?: string } | null)?.data ?? null;

    if (!detail) {
      console.log('[PlantKnowledge] No plants found via edge function for:', plantName);
      return null;
    }

    return convertPerenualToKnowledge(detail);
  } catch (error) {
    console.error('[PlantKnowledge] API error:', error);
    return null;
  }
}

/**
 * Convert Perenual API response to our format
 */
export function convertPerenualToKnowledge(
  plant: PerenualPlantDetail
): DbPlantKnowledgeInsert {
  // Parse watering to days
  const wateringDays = parseWateringToDays(plant.watering, plant.watering_general_benchmark);

  // Parse sunlight to hours
  const { sunHoursMin, sunHoursMax, sunlightType } = parseSunlight(plant.sunlight);

  // Parse hardiness to temperature
  const { tempMin, tempMax } = parseHardiness(plant.hardiness);

  return {
    common_name: plant.common_name,
    scientific_name: plant.scientific_name?.[0] || null,
    other_names: plant.other_name || null,
    image_url:
      plant.default_image?.medium_url ||
      plant.default_image?.regular_url ||
      null,
    watering_frequency_days: wateringDays,
    sunlight: sunlightType,
    sun_hours_min: sunHoursMin,
    sun_hours_max: sunHoursMax,
    temp_min_c: tempMin,
    temp_max_c: tempMax ?? classifyTempMaxFallback(plant), // DATA-02: category fallback when no hardiness.max (includes fría-28 cold-hardy branch)
    humidity: inferHumidity(plant),                         // DATA-03: family/type → 'alta' | 'media' | 'baja'
    indoor: plant.indoor ?? null,
    description: plant.description || null,
    care_tips: plant.maintenance || null,
    source: 'perenual',
    source_id: String(plant.id),
  };
}

/**
 * DATA-03: Infer humidity preference from Perenual family/type metadata.
 * Family match wins (most reliable taxonomic signal); type substring is the fallback.
 * Returns 'media' when no rule matches (default safe value — neutral humidity).
 * Spec lock: REQUIREMENTS.md DATA-03.
 */
export function inferHumidity(plant: { family?: string | null; type?: string | null }): 'alta' | 'media' | 'baja' {
  const family = (plant.family || '').toLowerCase();
  const type = (plant.type || '').toLowerCase();

  // Family match (most reliable)
  if (family.includes('araceae') || family.includes('orchidaceae') || family.includes('bromeliaceae')) {
    return 'alta';
  }
  if (family.includes('cactaceae') || family.includes('crassulaceae')) {
    return 'baja';
  }

  // Type substring fallback
  if (type.includes('cactus') || type.includes('succulent')) {
    return 'baja';
  }
  if (type.includes('tropical') || type.includes('fern') || type.includes('moss')) {
    return 'alta';
  }

  return 'media';
}

/**
 * DATA-02 fallback: derive a category-appropriate tempMax when hardiness.max is missing.
 * Called by convertPerenualToKnowledge when parseHardiness returns tempMax: null.
 * Spec lock: REQUIREMENTS.md DATA-02 — four anchors: indoor tropical 32, succulent/cactus 40, templada 35, fría 28.
 *
 * Order discipline (load-bearing — keep the cactus rule first):
 *   1. cactus/succulent (Cactaceae/Crassulaceae OR type contains cactus/succulent)  → 40
 *   2. tropical (Araceae/Orchidaceae/Bromeliaceae OR type contains tropical/fern/moss) → 32
 *   3. fría / cold-hardy (Rosaceae/Asteraceae/Lamiaceae/Fagaceae/Pinaceae OR type contains perennial/conifer/tree/bulb) → 28
 *   4. generic indoor (indoor === true)                                                → 32
 *   5. default (templada)                                                              → 35
 *
 * Note step 1 must run before step 3 — a Cactaceae plant with type "perennial" is still a succulent (40 ceiling, not 28 fría).
 */
export function classifyTempMaxFallback(plant: { family?: string | null; type?: string | null; indoor?: boolean | null }): number {
  const family = (plant.family || '').toLowerCase();
  const type = (plant.type || '').toLowerCase();

  // Step 1: Succulent/cactus ceiling (must run BEFORE fría — Cactaceae perennials stay 40)
  if (family.includes('cactaceae') || family.includes('crassulaceae')
      || type.includes('cactus') || type.includes('succulent')) {
    return 40;
  }
  // Step 2: Tropical (Araceae/Orchidaceae/Bromeliaceae/fern/moss/explicit tropical type)
  if (family.includes('araceae') || family.includes('orchidaceae') || family.includes('bromeliaceae')
      || type.includes('tropical') || type.includes('fern') || type.includes('moss')) {
    return 32;
  }
  // Step 3: Fría / cold-hardy — temperate flowering families + cold-tolerant plant types
  // Family list: Rosaceae (rose family), Asteraceae (daisy/sunflower), Lamiaceae (mint/sage),
  //              Fagaceae (oaks/beeches), Pinaceae (pines/conifers).
  // Type list:   "perennial" (cold-dormant herbaceous), "conifer" (evergreen cold-hardy),
  //              "tree" (default cold-hardy unless tropical signal earlier), "bulb" (cold-stratification).
  if (family.includes('rosaceae') || family.includes('asteraceae') || family.includes('lamiaceae')
      || family.includes('fagaceae') || family.includes('pinaceae')
      || type.includes('perennial') || type.includes('conifer') || type.includes('tree') || type.includes('bulb')) {
    return 28;
  }
  // Step 4: Generic indoor → tropical fallback (32) per CONTEXT.md decision tree step 3
  if (plant.indoor === true) {
    return 32;
  }
  // Step 5: Default templada
  return 35;
}

/**
 * Parse watering description to days
 */
function parseWateringToDays(
  watering: string,
  benchmark?: { value?: string; unit?: string }
): number | null {
  // Try benchmark first
  if (benchmark?.value && benchmark?.unit) {
    const value = parseInt(benchmark.value);
    if (!isNaN(value)) {
      if (benchmark.unit.includes('week')) return value * 7;
      if (benchmark.unit.includes('day')) return value;
    }
  }

  // Parse text description
  const lower = watering?.toLowerCase() || '';
  if (lower.includes('frequent') || lower.includes('average')) return 3;
  if (lower.includes('minimum') || lower.includes('rare')) return 14;
  if (lower.includes('moderate')) return 7;

  return 7; // Default
}

/**
 * Parse sunlight array to hours and type
 */
function parseSunlight(sunlight: string[]): {
  sunHoursMin: number | null;
  sunHoursMax: number | null;
  sunlightType: string | null;
} {
  if (!sunlight || sunlight.length === 0) {
    return { sunHoursMin: null, sunHoursMax: null, sunlightType: null };
  }

  const types = sunlight.map((s) => s.toLowerCase());

  if (types.some((t) => t.includes('full sun'))) {
    return { sunHoursMin: 6, sunHoursMax: 8, sunlightType: 'full_sun' };
  }
  if (types.some((t) => t.includes('part shade') || t.includes('partial'))) {
    return { sunHoursMin: 3, sunHoursMax: 6, sunlightType: 'part_shade' };
  }
  if (types.some((t) => t.includes('full shade') || t.includes('shade'))) {
    return { sunHoursMin: 1, sunHoursMax: 3, sunlightType: 'full_shade' };
  }

  return { sunHoursMin: 4, sunHoursMax: 6, sunlightType: 'part_shade' };
}

/**
 * Parse hardiness zones to temperature.
 * DATA-02: reads BOTH hardiness.min and hardiness.max via separate USDA-zone lookup tables.
 * USDA zones define cold tolerance (min); the zoneToTempMax table is the planner-derived
 * heat-tolerance proxy where higher zone → more tropical → higher tempMax.
 * Returns tempMax: null when hardiness.max is missing/unparseable so the caller
 * (convertPerenualToKnowledge) can apply the category-based fallback.
 */
export function parseHardiness(hardiness?: {
  min?: string;
  max?: string;
}): { tempMin: number | null; tempMax: number | null } {
  // Cold-tolerance: USDA zone → minimum survivable °C
  const zoneToTempMin: Record<string, number> = {
    '1': -45, '2': -40, '3': -35, '4': -30, '5': -25,
    '6': -20, '7': -15, '8': -10, '9': -5, '10': 0,
    '11': 5, '12': 10, '13': 15,
  };
  // Heat-tolerance proxy: planner-derived from DATA-02 fallback anchors (RESEARCH.md table)
  // Zones 1-4 → 25 (cold-only perennials), 5-6 → 28 (fría), 7-8 → 32 (templada/indoor tropical),
  // 9 → 35 (templada default), 10 → 38 (subtropical), 11-13 → 40 (tropical/succulent ceiling)
  const zoneToTempMax: Record<string, number> = {
    '1': 25, '2': 25, '3': 25, '4': 25, '5': 28,
    '6': 28, '7': 32, '8': 32, '9': 35, '10': 38,
    '11': 40, '12': 40, '13': 40,
  };

  let tempMin: number | null = null;
  let tempMax: number | null = null; // null = caller applies category fallback

  if (hardiness?.min) {
    const zone = hardiness.min.replace(/[^0-9]/g, '');
    tempMin = zoneToTempMin[zone] ?? null;
  }
  if (hardiness?.max) {
    const zone = hardiness.max.replace(/[^0-9]/g, '');
    tempMax = zoneToTempMax[zone] ?? null;
  }

  return { tempMin, tempMax };
}

/**
 * Save plant knowledge to Supabase cache
 */
async function saveToCache(
  knowledge: DbPlantKnowledgeInsert
): Promise<DbPlantKnowledge | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Use raw query to avoid type issues with dynamic tables
    const { data, error } = await supabase
      .from('plant_knowledge')
      .insert(knowledge as any)
      .select();

    if (error) {
      console.error('[PlantKnowledge] Save error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return data[0] as unknown as DbPlantKnowledge;
  } catch {
    return null;
  }
}

/**
 * Get all cached plant knowledge (for offline/search)
 */
export async function getAllCachedPlants(): Promise<DbPlantKnowledge[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('plant_knowledge')
      .select('*')
      .order('common_name' as any);

    if (error) return [];
    return (data as unknown as DbPlantKnowledge[]) || [];
  } catch {
    return [];
  }
}

/**
 * Search cached plants by name (local search, no API)
 */
export async function searchCachedPlants(
  query: string
): Promise<DbPlantKnowledge[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const sanitizedQuery = escapePostgrestFilter(query);
    const { data, error } = await supabase
      .from('plant_knowledge')
      .select('*')
      .or(
        `common_name.ilike.%${sanitizedQuery}%,scientific_name.ilike.%${sanitizedQuery}%`
      )
      .limit(10);

    if (error) return [];
    return (data as unknown as DbPlantKnowledge[]) || [];
  } catch {
    return [];
  }
}

/**
 * Enriched plant data ready to use
 */
export interface EnrichedPlantData {
  name: string;
  scientificName: string | null;
  waterEvery: number;
  sunHours: number;
  sunHoursMax: number | null;
  tempMin: number | null;
  tempMax: number | null;
  humidity: string | null;
  indoor: boolean;
  description: string | null;
  careTips: string | null;
  imageUrl: string | null;
  source: 'api' | 'cache' | 'default';
}

/**
 * Get enriched plant data - tries cache, then API, then returns defaults
 * Use this when adding a new plant to get the best available care info
 */
export async function getEnrichedPlantData(
  plantName: string,
  defaults?: Partial<EnrichedPlantData>
): Promise<EnrichedPlantData> {
  // Default values
  const defaultData: EnrichedPlantData = {
    name: plantName,
    scientificName: null,
    waterEvery: defaults?.waterEvery ?? 7,
    sunHours: defaults?.sunHours ?? 4,
    sunHoursMax: null,
    tempMin: defaults?.tempMin ?? 10,
    tempMax: defaults?.tempMax ?? 30,
    humidity: null,
    indoor: defaults?.indoor ?? true,
    description: null,
    careTips: null,
    imageUrl: null,
    source: 'default',
  };

  // Try to get from cache or API
  const result = await searchPlantKnowledge(plantName);

  if (result.success && result.data) {
    const data = result.data;
    return {
      name: data.common_name,
      scientificName: data.scientific_name,
      waterEvery: data.watering_frequency_days ?? defaultData.waterEvery,
      sunHours: data.sun_hours_min ?? defaultData.sunHours,
      sunHoursMax: data.sun_hours_max,
      tempMin: data.temp_min_c,
      tempMax: data.temp_max_c,
      humidity: data.humidity,
      indoor: data.indoor ?? defaultData.indoor,
      description: data.description,
      careTips: data.care_tips,
      imageUrl: data.image_url,
      source: result.source === 'cache' ? 'cache' : 'api',
    };
  }

  return defaultData;
}
