import { IdentifiedPlant, IdentificationResult, PlantCategory, HumidityLevel, PlantDBEntry } from '../types';
import { PLANT_DATABASE } from '../data/plantDatabase';
import i18n from '../i18n';

// ============================================================================
// Plant Identification via Supabase Edge Function
// La API key de PlantNet se mantiene segura en el servidor
// ============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Datos de cuidado genéricos por familia/tipo de planta
const GENERIC_CARE_DATA: Record<string, Partial<IdentifiedPlant>> = {
  // Suculentas y cactus
  'Cactaceae': { waterDays: 21, sunHours: 6, humidity: 'baja', indoor: false, category: 'suculentas', icon: '🌵' },
  'Crassulaceae': { waterDays: 14, sunHours: 5, humidity: 'baja', indoor: true, category: 'suculentas', icon: '🪴' },
  'Asphodelaceae': { waterDays: 14, sunHours: 5, humidity: 'baja', indoor: true, category: 'suculentas', icon: '🌿' },

  // Aromáticas
  'Lamiaceae': { waterDays: 4, sunHours: 6, humidity: 'media', indoor: false, category: 'aromaticas', icon: '🌿' },

  // Interior tropicales
  'Araceae': { waterDays: 7, sunHours: 3, humidity: 'alta', indoor: true, category: 'interior', icon: '🌿' },
  'Marantaceae': { waterDays: 4, sunHours: 2, humidity: 'alta', indoor: true, category: 'interior', icon: '🎨' },

  // Palmeras
  'Arecaceae': { waterDays: 7, sunHours: 4, humidity: 'media', indoor: true, category: 'interior', icon: '🌴' },

  // Orquídeas
  'Orchidaceae': { waterDays: 7, sunHours: 3, humidity: 'alta', indoor: true, category: 'interior', icon: '🌸' },

  // Frutales cítricos
  'Rutaceae': { waterDays: 5, sunHours: 6, humidity: 'media', indoor: false, category: 'frutales', icon: '🍋' },

  // Rosáceas (frutillas, rosas)
  'Rosaceae': { waterDays: 3, sunHours: 6, humidity: 'media', indoor: false, category: 'exterior', icon: '🌹' },

  // Solanáceas (tomate, pimiento)
  'Solanaceae': { waterDays: 2, sunHours: 8, humidity: 'media', indoor: false, category: 'huerta', icon: '🍅' },

  // Default
  'default': { waterDays: 7, sunHours: 4, humidity: 'media', indoor: true, category: 'interior', icon: '🌱' },
};

// Mapeo de nombres comunes en español para plantas conocidas
const COMMON_NAMES_ES: Record<string, string> = {
  'Epipremnum aureum': 'Potus',
  'Monstera deliciosa': 'Monstera',
  'Ficus elastica': 'Ficus',
  'Ficus lyrata': 'Ficus lyrata',
  'Dracaena trifasciata': 'Sansevieria',
  'Sansevieria trifasciata': 'Sansevieria',
  'Phalaenopsis': 'Orquídea',
  'Calathea': 'Calathea',
  'Chlorophytum comosum': 'Cinta',
  'Chamaedorea elegans': 'Palmera de interior',
  'Aloe vera': 'Aloe Vera',
  'Lavandula angustifolia': 'Lavanda',
  'Lavandula': 'Lavanda',
  'Hydrangea macrophylla': 'Hortensia',
  'Jasminum officinale': 'Jazmín',
  'Pelargonium': 'Geranio',
  'Ocimum basilicum': 'Albahaca',
  'Salvia rosmarinus': 'Romero',
  'Rosmarinus officinalis': 'Romero',
  'Mentha spicata': 'Menta',
  'Mentha': 'Menta',
  'Solanum lycopersicum': 'Tomatera',
  'Capsicum annuum': 'Pimiento',
  'Fragaria': 'Frutilla',
  'Citrus limon': 'Limonero',
  'Echeveria': 'Echeveria',
  'Sempervivum': 'Siempreviva',
  'Petunia': 'Petunia',
  'Begonia': 'Begonia',
  'Spathiphyllum': 'Espatifilo',
  'Anthurium': 'Anturio',
  'Philodendron': 'Filodendro',
  'Zamioculcas zamiifolia': 'Zamioculca',
  'Pilea peperomioides': 'Pilea',
  'Tradescantia': 'Tradescantia',
  'Hedera helix': 'Hiedra',
  'Fuchsia': 'Fucsia',
  'Hibiscus': 'Hibisco',
  'Gardenia': 'Gardenia',
  'Azalea': 'Azalea',
  'Rhododendron': 'Azalea',
  'Cyclamen': 'Ciclamen',
  'Kalanchoe': 'Kalanchoe',
  'Croton': 'Croton',
  'Codiaeum': 'Croton',
  'Dieffenbachia': 'Difenbaquia',
  'Dracaena': 'Dracena',
  'Yucca': 'Yuca',
  'Pachira aquatica': 'Árbol del dinero',
  'Schefflera': 'Cheflera',
  'Fittonia': 'Fitonia',
  'Peperomia': 'Peperomia',
  'Crassula ovata': 'Árbol de jade',
  'Sedum': 'Sedum',
  'Haworthia': 'Haworthia',
  'Gasteria': 'Gasteria',
  'Lithops': 'Piedras vivas',
  'Opuntia': 'Nopal',
  'Mammillaria': 'Mammillaria',
  'Euphorbia': 'Euforbia',
};

// ============================================================================
// Funciones de búsqueda en base de datos local
// ============================================================================

/**
 * Busca una planta en la base de datos local por nombre científico
 */
export function findPlantInDatabase(scientificName: string): PlantDBEntry | undefined {
  const searchName = scientificName.toLowerCase();

  return PLANT_DATABASE.find(plant => {
    const dbName = plant.scientificName.toLowerCase();
    // Coincidencia exacta o parcial (género)
    return dbName === searchName ||
           dbName.startsWith(searchName.split(' ')[0]) ||
           searchName.startsWith(dbName.split(' ')[0]);
  });
}

/**
 * Obtiene el nombre común en español para un nombre científico
 */
function getSpanishCommonName(scientificName: string, plantNetCommonName?: string): string {
  // Buscar coincidencia exacta
  if (COMMON_NAMES_ES[scientificName]) {
    return COMMON_NAMES_ES[scientificName];
  }

  // Buscar por género (primera palabra del nombre científico)
  const genus = scientificName.split(' ')[0];
  if (COMMON_NAMES_ES[genus]) {
    return COMMON_NAMES_ES[genus];
  }

  // Usar nombre de PlantNet o el científico
  return plantNetCommonName || scientificName;
}

/**
 * Obtiene datos de cuidado genéricos basados en la familia de la planta
 */
function getGenericCareData(family?: string): Partial<IdentifiedPlant> {
  if (family && GENERIC_CARE_DATA[family]) {
    return GENERIC_CARE_DATA[family];
  }
  return GENERIC_CARE_DATA['default'];
}

// ============================================================================
// PlantNet Response Types
// ============================================================================

interface PlantNetResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
    genus: { scientificNameWithoutAuthor: string };
    family: { scientificNameWithoutAuthor: string };
    commonNames?: string[];
  };
  images?: { url: { o: string } }[];
}

interface PlantNetResponse {
  results: PlantNetResult[];
  bestMatch?: string;
  error?: string;
  code?: string;
  message?: string;
}

/**
 * Convierte un resultado de PlantNet a nuestro formato IdentifiedPlant
 */
function convertPlantNetResult(result: PlantNetResult): IdentifiedPlant {
  const scientificName = result.species.scientificNameWithoutAuthor;
  const family = result.species.family?.scientificNameWithoutAuthor;
  const plantNetCommonName = result.species.commonNames?.[0];

  // Buscar en nuestra base de datos local
  const dbPlant = findPlantInDatabase(scientificName);

  if (dbPlant) {
    // Tenemos datos verificados de esta planta
    return {
      commonName: dbPlant.name,
      scientificName: dbPlant.scientificName,
      confidence: Math.round(result.score * 100),
      category: dbPlant.category,
      waterDays: dbPlant.waterDays,
      sunHours: dbPlant.sunHours,
      tempMin: dbPlant.tempMin,
      tempMax: dbPlant.tempMax,
      humidity: dbPlant.humidity,
      indoor: !dbPlant.outdoor,
      tip: dbPlant.tip,
      icon: dbPlant.icon,
    };
  }

  // No está en nuestra base de datos, usar datos genéricos por familia
  const genericCare = getGenericCareData(family);
  const commonName = getSpanishCommonName(scientificName, plantNetCommonName);

  return {
    commonName,
    scientificName,
    confidence: Math.round(result.score * 100),
    category: genericCare.category || 'interior',
    waterDays: genericCare.waterDays || 7,
    sunHours: genericCare.sunHours || 4,
    tempMin: 15,
    tempMax: 28,
    humidity: genericCare.humidity || 'media',
    indoor: genericCare.indoor ?? true,
    tip: i18n.t('identification.genericFamilyTip', { family: family || i18n.t('identification.unknownFamily') }),
    icon: genericCare.icon || '🌱',
  };
}

/**
 * Identifica una planta usando la Edge Function de Supabase
 * La API key de PlantNet se mantiene segura en el servidor
 */
export async function identifyPlant(
  imageBase64: string,
  _config?: { apiKey?: string }, // Deprecated: ya no se necesita, la key está en el servidor
  signal?: AbortSignal
): Promise<IdentificationResult> {

  // Si Supabase no está configurado, usar mock para desarrollo
  if (!isSupabaseConfigured()) {
    console.log('[PlantID] Supabase no configurado, usando modo mock');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return getMockIdentificationResult();
  }

  try {
    console.log('[PlantID] Calling edge function, image size:', Math.round(imageBase64.length / 1024), 'KB');
    // Llamar a la Edge Function
    // Usamos la anon key explícitamente para que funcione sin usuario logueado
    const { data, error } = await supabase.functions.invoke<PlantNetResponse>('identify-plant', {
      body: { imageBase64, organ: 'auto' },
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    console.log('[PlantID] Edge function returned - data:', !!data, 'error:', !!error);

    // Manejar cancelación (AbortSignal no es soportado directamente por supabase.functions.invoke,
    // pero dejamos el chequeo por si el usuario navega fuera)
    if (signal?.aborted) {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: i18n.t('identification.identificationCancelled'),
      };
    }

    // Error de la función
    if (error) {
      console.error('[PlantID] Edge function error:', error);

      // FunctionsHttpError tiene el response en .context — extraer el mensaje real
      let reason = i18n.t('identification.serviceConnectionError');
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          reason = errorBody?.error || errorBody?.message || reason;
          console.error('[PlantID] Server response:', errorBody);
        } else if (error.message) {
          reason = error.message;
        }
      } catch {
        // If we can't parse the error body, use the default message
      }

      return {
        success: false,
        type: 'none',
        results: [],
        reason,
      };
    }

    // Error retornado por la función
    if (data?.error) {
      console.error('[PlantID] API error:', data.error, data.code);
      return {
        success: false,
        type: 'none',
        results: [],
        reason: data.error,
      };
    }

    // Sin resultados (planta no identificada)
    if (!data?.results || data.results.length === 0) {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: data?.message || i18n.t('identification.noMatchesFound'),
      };
    }

    // Filtrar resultados con confianza > 10%
    const rawResults = data.results
      .filter(r => r.score > 0.1)
      .slice(0, 5)
      .map(convertPlantNetResult);

    // Deduplicate by common name, keeping the result with the highest confidence
    const deduped = new Map<string, IdentifiedPlant>();
    for (const plant of rawResults) {
      const key = plant.commonName.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || plant.confidence > existing.confidence) {
        deduped.set(key, plant);
      }
    }
    const validResults = Array.from(deduped.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    if (validResults.length === 0) {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: i18n.t('identification.lowConfidence'),
      };
    }

    // Determinar tipo de resultado
    if (validResults.length === 1 || validResults[0].confidence >= 70) {
      return {
        success: true,
        type: 'single',
        results: [validResults[0]],
      };
    }

    return {
      success: true,
      type: 'multiple',
      results: validResults,
      reason: i18n.t('identification.multiplePlantsFound'),
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: i18n.t('identification.identificationCancelled'),
      };
    }

    console.error('[PlantID] Error:', error);
    return {
      success: false,
      type: 'none',
      results: [],
      reason: error.message || i18n.t('identification.serviceConnectionError'),
    };
  }
}

// ============================================================================
// Mock para desarrollo (sin API key)
// ============================================================================

export function getMockIdentificationResult(): IdentificationResult {
  const scenarios: IdentificationResult[] = [
    {
      success: true,
      type: 'single',
      results: [
        {
          commonName: 'Potus',
          scientificName: 'Epipremnum aureum',
          confidence: 92,
          category: 'interior',
          waterDays: 7,
          sunHours: 2,
          tempMin: 15,
          tempMax: 30,
          humidity: 'media',
          indoor: true,
          tip: 'Ideal para principiantes. Tolera poca luz y olvidos de riego.',
          icon: '🍃',
        },
      ],
    },
    {
      success: true,
      type: 'multiple',
      results: [
        {
          commonName: 'Echeveria',
          scientificName: 'Echeveria elegans',
          confidence: 75,
          category: 'suculentas',
          waterDays: 10,
          sunHours: 5,
          tempMin: 5,
          tempMax: 35,
          humidity: 'baja',
          indoor: false,
          tip: 'Evitá mojar la roseta. Regá por abajo o directo a la tierra.',
          icon: '🌸',
        },
        {
          commonName: 'Siempreviva',
          scientificName: 'Sempervivum tectorum',
          confidence: 60,
          category: 'suculentas',
          waterDays: 14,
          sunHours: 6,
          tempMin: -10,
          tempMax: 35,
          humidity: 'baja',
          indoor: false,
          tip: 'Muy resistente. Tolera heladas y sequías prolongadas.',
          icon: '🌵',
        },
      ],
      reason: 'La imagen muestra una suculenta en roseta. Podría ser Echeveria o Sempervivum.',
    },
    {
      success: true,
      type: 'single',
      results: [
        {
          commonName: 'Lavanda',
          scientificName: 'Lavandula angustifolia',
          confidence: 88,
          category: 'exterior',
          waterDays: 10,
          sunHours: 6,
          tempMin: -5,
          tempMax: 35,
          humidity: 'baja',
          indoor: false,
          tip: 'Podá después de la floración para mantenerla compacta. Atrae abejas.',
          icon: '💜',
        },
      ],
    },
  ];

  return scenarios[Math.floor(Math.random() * scenarios.length)];
}
