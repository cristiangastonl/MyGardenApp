import { IdentifiedPlant, IdentificationResult, PlantCategory, HumidityLevel, PlantDBEntry } from '../types';
import { PLANT_DATABASE, getTranslatedPlant } from '../data/plantDatabase';
import i18n from '../i18n';
import { sunHoursToLightLevel } from './migration';

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

  // ─── v1.2 Phase 15 Wave A — Interior Tropicals (23 entries + ~5 synonym aliases) ───
  // Note: existing genus-only entries above already cover several Phase 15 species
  // (Anthurium, Begonia, Codiaeum, Croton, Dieffenbachia, Fittonia, Ficus lyrata,
  //  Hedera helix, Pachira aquatica, Pilea peperomioides, Schefflera, Tradescantia,
  //  Zamioculcas zamiifolia). The mappings below ADD species-qualified keys plus
  //  the genera not yet covered (Maranta, Nephrolepis, Asplenium, Alocasia, Caladium,
  //  Dypsis, Howea, Syngonium, Aglaonema, Sedum morganianum, Heptapleurum, Monstera adansonii).
  'Maranta leuconeura': 'Maranta',
  'Maranta': 'Maranta',                             // genus alias
  'Nephrolepis exaltata': 'Helecho de Boston',
  'Nephrolepis': 'Helecho de Boston',               // genus alias
  'Asplenium nidus': 'Helecho nido de ave',
  'Alocasia × amazonica': 'Alocasia',
  'Alocasia': 'Alocasia',                           // genus alias
  'Caladium bicolor': 'Caladium',
  'Caladium': 'Caladium',                           // genus alias
  'Dypsis lutescens': 'Palmera areca',
  'Howea forsteriana': 'Palmera kentia',
  'Syngonium podophyllum': 'Singonio',
  'Syngonium': 'Singonio',                          // genus alias
  'Aglaonema commutatum': 'Aglaonema',
  'Aglaonema': 'Aglaonema',                         // genus alias
  'Sedum morganianum': 'Cola de burro',
  'Heptapleurum arboricola': 'Cheflera',            // current accepted name (POWO 2024); legacy Schefflera arboricola alias below
  'Monstera adansonii': 'Costilla de Adán',         // distinct from existing 'Monstera deliciosa' → 'Monstera' (different species)
  'Begonia rex': 'Begonia rex',                     // species-qualified (existing 'Begonia' genus already mapped above)
  'Tradescantia zebrina': 'Tradescantia',           // species-qualified (existing 'Tradescantia' genus mapped above)
  'Anthurium andraeanum': 'Anturio',                // species-qualified (existing 'Anthurium' genus → 'Anturio' above)

  // ─── PlantNet synonym aliases (taxonomic drift coverage; ≤2 per entry) ───
  'Ficus pandurata': 'Ficus lyrata',                // older synonym sometimes returned by PlantNet
  'Pachira glabra': 'Árbol del dinero',             // taxonomically more accurate; PlantNet mostly returns Pachira aquatica (already mapped)
  'Sansevieria': 'Sansevieria',                     // genus alias (Sansevieria trifasciata already mapped above)
  'Schefflera arboricola': 'Cheflera',              // legacy name — Schefflera genus already mapped above; species-qualified legacy form
  'Dieffenbachia seguine': 'Difenbaquia',           // species-qualified for Plan 15-01's exact scientificName value

  // ─── v1.2 Phase 16 Wave B — Suculentas/Cactus + Trepadoras + Trending (19 species + ~7 synonym aliases) ───
  // Note: existing genus-only entries above already cover several Phase 16 species
  // (Kalanchoe, Sempervivum, Lithops, Opuntia, Mammillaria, Gasteria, Epipremnum aureum, Philodendron).
  // The mappings below ADD species-qualified keys plus genera not yet covered (Hoya, Rhaphidophora,
  // Strelitzia, Eucalyptus/Corymbia, Echinopsis, Curio, Schlumbergera, Agave). Two species OVERRIDE
  // genus aliases (Euphorbia milii ≠ Euforbia for corona-espinas; Dracaena sanderiana/angolensis ≠ Dracena
  // for bambu-suerte/sansevieria-cilindrica) — exact-match-first refactor (Plan 16-00) ensures the
  // species-qualified keys take precedence over genus prefix matching in findPlantInDatabase.

  // NEW canonical species-qualified mappings (CAT-13 cactus + suculentas):
  'Kalanchoe blossfeldiana': 'Kalanchoe',
  'Sempervivum tectorum': 'Siempreviva',
  'Lithops lesliei': 'Piedras vivas',
  'Opuntia ficus-indica': 'Nopal',
  'Mammillaria elongata': 'Mammillaria',
  'Euphorbia milii': 'Corona de espinas',           // species-qualified (overrides genus 'Euforbia')
  'Gasteria bicolor': 'Gasteria',
  'Curio rowleyanus': 'Senecio colgante',           // POWO accepted (since 1999)
  'Schlumbergera × buckleyi': 'Cactus de Navidad',
  'Schlumbergera': 'Cactus de Navidad',             // genus alias
  'Agave americana': 'Agave',
  'Agave': 'Agave',                                 // genus alias (NEW — Agave was not previously in COMMON_NAMES_ES)

  // NEW canonical species-qualified mappings (CAT-14 trepadoras NET-NEW):
  'Hoya kerrii': 'Hoya corazón',
  'Hoya': 'Hoya',                                   // genus fallback for other Hoya species
  'Rhaphidophora tetrasperma': 'Mini Monstera',

  // NEW canonical species-qualified mappings (CAT-15 trending):
  'Strelitzia reginae': 'Strelitzia',
  'Strelitzia': 'Strelitzia',                       // genus alias
  'Eucalyptus citriodora': 'Eucalipto limón',
  'Eucalyptus': 'Eucalipto',                        // genus alias
  'Dracaena sanderiana': 'Bambú de la suerte',      // species-qualified (overrides genus 'Dracena')
  'Dracaena angolensis': 'Sansevieria cilíndrica',  // species-qualified (overrides genus 'Dracena')
  'Echinopsis pachanoi': 'Cactus San Pedro',        // POWO 2024 canonical
  // NOTE: do NOT add 'Echinopsis' genus alias — Echinopsis is a large genus with many species
  // (E. oxygona, E. multiplex, etc.). Routing all to "San Pedro" is incorrect for non-pachanoi species.

  // ─── PlantNet synonym aliases (taxonomic drift coverage; ≤2 per entry) ───
  'Senecio rowleyanus': 'Senecio colgante',         // legacy synonym (still heavy use in trade)
  'Trichocereus pachanoi': 'Cactus San Pedro',      // legacy synonym (POWO 2024 reduced Trichocereus)
  'Sansevieria cylindrica': 'Sansevieria cilíndrica', // legacy synonym (very common in trade)
  'Schlumbergera truncata': 'Cactus de Navidad',    // Thanksgiving cactus often mis-sold as Christmas
  'Pothos aureus': 'Potus',                         // legacy Epipremnum aureum synonym
  'Philodendron scandens': 'Filodendro',            // legacy Philodendron hederaceum synonym
  'Dracaena braunii': 'Bambú de la suerte',         // contested synonym for D. sanderiana
  'Corymbia citriodora': 'Eucalipto limón',         // POWO new genus (since 2000s); PlantNet still uses Eucalyptus
};

// ============================================================================
// Funciones de búsqueda en base de datos local
// ============================================================================

/**
 * Busca una planta en la base de datos local por nombre científico
 */
export function findPlantInDatabase(scientificName: string): PlantDBEntry | undefined {
  const searchName = scientificName.toLowerCase();

  // First pass: exact match (case-insensitive) — fixes genus-prefix collision (Dracaena/Sedum/etc.)
  const exactMatch = PLANT_DATABASE.find(p => p.scientificName.toLowerCase() === searchName);
  if (exactMatch) return exactMatch;

  // Second pass: genus prefix (legacy fuzzy fallback)
  return PLANT_DATABASE.find(plant => {
    const dbName = plant.scientificName.toLowerCase();
    return dbName.startsWith(searchName.split(' ')[0]) ||
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
    // Tenemos datos verificados de esta planta — usar traducción
    const translated = getTranslatedPlant(dbPlant);
    return {
      commonName: translated.name,
      scientificName: translated.scientificName,
      confidence: Math.round(result.score * 100),
      category: translated.category,
      // PlantDBEntry.waterDays/.sunHours made optional in v1.1 (Plan 04-05);
      // IdentifiedPlant still requires number for v1.0 callers — bridged with
      // safe defaults (7d / 3h = bright_indirect) until Phase 7 rewrites the
      // identification flow to v1.1 fields.
      waterDays: translated.waterDays ?? 7,
      sunHours: translated.sunHours ?? 3,
      tempMin: translated.tempMin,
      tempMax: translated.tempMax,
      humidity: translated.humidity,
      indoor: !translated.outdoor,
      tip: translated.tip,
      icon: translated.icon,
      // v1.1 Phase 7 (LIGHT-05): defensive ladder — catalog v1.1 → mapped from sunHours → safe default
      lightLevel: translated.lightLevel
        ?? (typeof translated.sunHours === 'number' ? sunHoursToLightLevel(translated.sunHours) : 'bright_indirect'),
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
    // v1.1 Phase 7 (LIGHT-05): no catalog match — derive from genericCare sunHours or default
    lightLevel: typeof genericCare.sunHours === 'number'
      ? sunHoursToLightLevel(genericCare.sunHours)
      : 'bright_indirect',
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
      body: { imageBase64, organ: 'auto', lang: i18n.language },
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
