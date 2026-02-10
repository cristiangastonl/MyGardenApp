import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbPlantKnowledge, DbPlantKnowledgeInsert } from '../types/database';

const PERENUAL_API_BASE = 'https://perenual.com/api';

// Get API key from environment variable or allow runtime override
let perenualApiKey: string | null = process.env.EXPO_PUBLIC_PERENUAL_API_KEY || null;

export function setPerenualApiKey(key: string | null) {
  perenualApiKey = key;
}

export function getPerenualApiKey(): string | null {
  return perenualApiKey;
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

  // 2. If not in cache, fetch from API
  if (!perenualApiKey) {
    return {
      success: false,
      data: null,
      source: 'none',
      error: 'No API key configured',
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
    const nameLower = plantName.toLowerCase().trim();

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
 * Fetch plant data from Perenual API
 */
async function fetchFromPerenual(
  plantName: string
): Promise<DbPlantKnowledgeInsert | null> {
  if (!perenualApiKey) return null;

  try {
    // 1. Search for the plant
    const searchUrl = `${PERENUAL_API_BASE}/species-list?key=${perenualApiKey}&q=${encodeURIComponent(plantName)}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      console.log('[PlantKnowledge] Search failed:', searchRes.status);
      return null;
    }

    const searchData = await searchRes.json();
    const plants: PerenualPlant[] = searchData.data || [];

    if (plants.length === 0) {
      console.log('[PlantKnowledge] No plants found for:', plantName);
      return null;
    }

    // Get the first match
    const plant = plants[0];

    // 2. Get detailed info
    const detailUrl = `${PERENUAL_API_BASE}/species/details/${plant.id}?key=${perenualApiKey}`;
    const detailRes = await fetch(detailUrl);

    let detail: PerenualPlantDetail = plant;
    if (detailRes.ok) {
      detail = await detailRes.json();
    }

    // 3. Convert to our format
    return convertPerenualToKnowledge(detail);
  } catch (error) {
    console.error('[PlantKnowledge] API error:', error);
    return null;
  }
}

/**
 * Convert Perenual API response to our format
 */
function convertPerenualToKnowledge(
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
    temp_max_c: tempMax,
    humidity: null, // Perenual doesn't provide this directly
    indoor: plant.indoor ?? null,
    description: plant.description || null,
    care_tips: plant.maintenance || null,
    source: 'perenual',
    source_id: String(plant.id),
  };
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
 * Parse hardiness zones to temperature
 */
function parseHardiness(hardiness?: {
  min?: string;
  max?: string;
}): { tempMin: number | null; tempMax: number | null } {
  // USDA Hardiness zones to approximate Celsius
  const zoneToTemp: Record<string, number> = {
    '1': -45,
    '2': -40,
    '3': -35,
    '4': -30,
    '5': -25,
    '6': -20,
    '7': -15,
    '8': -10,
    '9': -5,
    '10': 0,
    '11': 5,
    '12': 10,
    '13': 15,
  };

  let tempMin: number | null = null;
  let tempMax: number | null = 35; // Default max

  if (hardiness?.min) {
    const zone = hardiness.min.replace(/[^0-9]/g, '');
    tempMin = zoneToTemp[zone] ?? null;
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
    const { data, error } = await supabase
      .from('plant_knowledge')
      .select('*')
      .or(
        `common_name.ilike.%${query}%,scientific_name.ilike.%${query}%`
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
