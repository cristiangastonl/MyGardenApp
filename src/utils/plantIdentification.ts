import { IdentifiedPlant, IdentificationResult, PlantCategory, HumidityLevel, PlantDBEntry } from '../types';
import { PLANT_DATABASE } from '../data/plantDatabase';

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
    tip: `Planta de la familia ${family || 'desconocida'}. Los cuidados pueden variar según la especie específica.`,
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
    // Llamar a la Edge Function
    const { data, error } = await supabase.functions.invoke<PlantNetResponse>('identify-plant', {
      body: { imageBase64, organ: 'auto' },
    });

    // Manejar cancelación (AbortSignal no es soportado directamente por supabase.functions.invoke,
    // pero dejamos el chequeo por si el usuario navega fuera)
    if (signal?.aborted) {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: 'La identificación fue cancelada',
      };
    }

    // Error de la función
    if (error) {
      console.error('[PlantID] Edge function error:', error);
      return {
        success: false,
        type: 'none',
        results: [],
        reason: error.message || 'Error al conectar con el servicio de identificación',
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
        reason: data?.message || 'No se encontraron coincidencias. Asegurate de que la foto muestre claramente las hojas o flores.',
      };
    }

    // Filtrar resultados con confianza > 10%
    const validResults = data.results
      .filter(r => r.score > 0.1)
      .slice(0, 3)
      .map(convertPlantNetResult);

    if (validResults.length === 0) {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: 'La identificación no fue lo suficientemente confiable. Probá con otra foto.',
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
      reason: 'Encontramos varias plantas similares. Seleccioná la que corresponda.',
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        type: 'none',
        results: [],
        reason: 'La identificación fue cancelada',
      };
    }

    console.error('[PlantID] Error:', error);
    return {
      success: false,
      type: 'none',
      results: [],
      reason: error.message || 'Error al conectar con el servicio de identificación',
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
