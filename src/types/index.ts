export interface PlantType {
  id: string;
  name: string;
  icon: string;
  waterDays: number;
  sunHours: number;
  tip: string;
}

export interface PlantPhoto {
  id: string;
  uri: string;
  date: string;
  note?: string;
}

/**
 * Light level taxonomy (v1.1). Replaces the numeric `sunHours` field.
 * Mapping: see src/utils/migration.ts > sunHoursToLightLevel.
 */
export type LightLevel = 'direct' | 'bright_indirect' | 'medium_indirect' | 'low';

/**
 * Watering mode (v1.1). `soil_check` plants generate a 'check_soil' task instead of 'water'
 * and do not incur health-score penalties for "overdue" watering (Phase 5).
 */
export type WaterMode = 'fixed' | 'soil_check';

/**
 * User-controlled climate-zone override (v1.1 / Phase 7 LOC-05).
 * Wins over derived-from-latitude season detection.
 * - 'auto'      → use getWaterSeason(location.lat, date) (existing behavior)
 * - 'northern'  → force Northern temperate flip (warm Apr-Sep, cold Oct-Mar)
 * - 'southern'  → force Southern temperate flip (warm Oct-Mar, cold Apr-Sep)
 * - 'tropical'  → always 'warm' (matches SEASON-02 lock for tropical zone)
 * Missing on AppData = treat as 'auto' (additive, no schema bump).
 */
export type ClimateOverride = 'auto' | 'northern' | 'southern' | 'tropical';

/**
 * Per-plant warm/cold watering schedule (v1.1). Replaces the single `waterEvery` field.
 * Cold interval is typically warm × per-category factor (see applyColdFactor in migration.ts).
 */
export interface WaterSchedule {
  warm: number; // days between waterings during warm season
  cold: number; // days between waterings during cold season
}

/**
 * v1.2 Phase 20 (FERT-01) — per-plant fertilize schedule. Additive optional.
 * Absence means no fertilize task emission and no health-score penalty.
 * `lastFertilized` is ISO date "YYYY-MM-DD" (matches Plant.lastWatered format).
 * `intervalDays` is season-agnostic when set per-plant (overrides catalog warm/cold).
 */
export interface FertilizeSchedule {
  intervalDays: number;
  lastFertilized?: string;
}

export interface Plant {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  icon: string;
  imageUrl?: string; // URL de foto real de la planta
  databaseId?: string; // Link to PLANT_DATABASE entry for detailed info

  /** @deprecated Removed in v1.2. Use `waterSchedule.warm` (and `.cold`) instead. */
  waterEvery?: number;
  /** @deprecated Removed in v1.2. Use `lightLevel` instead. */
  sunHours?: number;

  sunDays: number[];
  outdoorDays: number[];
  lastWatered: string | null;
  sunDoneDate: string | null;
  outdoorDoneDate: string | null;
  photos?: PlantPhoto[];
  // Optional overrides from database or user
  tempMin?: number;
  tempMax?: number;
  humidity?: HumidityLevel;
  favorite?: boolean;

  // ─── v1.1 Precision Care fields (Phase 4) ───
  /** Light level (v1.1). Replaces sunHours. */
  lightLevel?: LightLevel;
  /** Warm/cold watering schedule (v1.1). Replaces waterEvery. */
  waterSchedule?: WaterSchedule;
  /** Watering mode (v1.1). soil_check plants are not penalized for overdue water. */
  waterMode?: WaterMode;
  /** Internal: set by migration to flag plants that existed pre-v1.1; powers per-plant tooltip eligibility. Removed in v1.2. */
  _migratedFromV0?: true;

  /** v1.2 Phase 20 (FERT-01). Additive optional; absence means no fertilize task emission. */
  fertilizeSchedule?: FertilizeSchedule;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  text: string;
  time: string;
  done: boolean;
}

export interface Location {
  lat: number;
  lon: number;
  name: string;
  country: string;
  admin1?: string;
}

export interface Task {
  type: "water" | "sun" | "outdoor" | "check_soil" | "fertilize"; // FERT-03
  icon: string;
  label: string;
  plantId: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  diagnosisId: string;
  plantId: string;
  plantName: string;
  checked: boolean;
  createdAt: string;
}

/** v1.2 Phase 21 (JOURNAL-02) — care-tag taxonomy. 6 predefined values, single-select. */
export type CareTag = 'riego' | 'fertilizar' | 'sol' | 'poda' | 'problema' | 'otro';

/** v1.2 Phase 21 (JOURNAL-02) — single per-plant journal entry.
 *  All fields except `id` and `date` are optional → empty entry with just the date is valid.
 *  `photoUri` points to a file in `${Paths.document.uri}journal/${plantId}/${id}.jpg` — NEVER base64.
 *  `date` is ISO string ("YYYY-MM-DD" — matches Plant.lastWatered format).
 *  `id` is generated via `Date.now().toString()` (matches app-wide convention). */
export interface JournalEntry {
  id: string;
  date: string;
  text?: string;
  photoUri?: string;
  careTag?: CareTag;
}

export interface AppData {
  plants: Plant[];
  notes: Record<string, Note[]>;
  reminders: Record<string, Reminder[]>;
  location: Location | null;
  onboardingCompleted: boolean;
  userName: string | null;
  notificationSettings: NotificationSettings | null;
  plantNetApiKey: string | null;
  installDate: string | null;
  identificationCount: number;
  diagnosisCount: number;
  diagnosisHistory: Record<string, SavedDiagnosis[]>;
  shoppingList: ShoppingItem[];
  /** v1.1 Phase 7 (LOC-05). User-controlled climate-zone override. Missing = 'auto'. */
  climateOverride?: ClimateOverride;
  /** v1.2 Phase 21 (JOURNAL-01). Additive optional; absence/empty = no entries. Keyed by plant.id. */
  journals?: Record<string, JournalEntry[]>;
}

/**
 * Versioned envelope for AsyncStorage persistence (v1.1+).
 * v0 (pre-v1.1) wrote the unwrapped `AppData` directly.
 */
export interface PersistedAppData {
  schemaVersion: number;
  data: AppData;
}

// Plant Database Types
export type PlantCategory = "interior" | "exterior" | "aromaticas" | "huerta" | "frutales" | "suculentas";

export type HumidityLevel = "baja" | "media" | "alta";

export interface PlantProblem {
  symptom: string;
  cause: string;
  solution: string;
}

/**
 * v1.2 Phase 14 (EDU-02). Care-action copy for the "¿Qué hacer?" educational section.
 * Both sub-fields optional — entries gain content gradually; sub-blocks hide if absent.
 */
export interface CareAction {
  /** Fixed-cadence care copy (e.g., "Regá cada 7 días en temporada cálida; cada 14 días en frío."). */
  fixed?: string;
  /** Soil-check care copy for waterMode === 'soil_check' plants (e.g., "Tocá los primeros 2cm de tierra: si están secos, regá."). */
  soilCheck?: string;
}

/** v1.2 Phase 19 (TOX-01) — pet toxicity classification levels. */
export type ToxLevel = 'safe' | 'caution' | 'toxic' | 'unknown';

/** v1.2 Phase 19 (TOX-01) — per-entry pet toxicity record. */
export interface PetToxicityEntry {
  /** ASPCA classification per species. */
  cats: ToxLevel;
  dogs: ToxLevel;
  /** Per-species symptom arrays — only present when level is 'caution' or 'toxic'.
   *  Catalog source field; displayed strings come from plants.json (per-entry, EN+ES). */
  symptoms?: {
    cats?: string[];
    dogs?: string[];
  };
  /** ASPCA source URL per entry — CRIT-2 audit requirement (STATE.md pre-decision lock).
   *  Empty string is acceptable ONLY for entries where cats === 'unknown' && dogs === 'unknown'. */
  source?: string;
}

export interface PlantDBEntry {
  id: string;
  name: string;
  scientificName: string;
  icon: string;
  imageUrl?: string; // URL de foto real de la planta
  galleryUrls?: string[]; // URLs adicionales para galería en detalle
  category: PlantCategory;

  /** @deprecated Removed in v1.2. Use `waterSchedule.warm` instead. */
  waterDays?: number;
  /** @deprecated Removed in v1.2. Use `lightLevel` instead. */
  sunHours?: number;

  tempMin: number;
  tempMax: number;
  humidity: HumidityLevel;
  outdoor: boolean;
  tip: string;
  description: string;
  problems: PlantProblem[];
  nutrients?: {
    type: string;
    homemade: string;
  };

  // ─── v1.1 Precision Care fields (Phase 4 mechanical mapping; Phase 8 expert override) ───
  /** Light level (v1.1). Auto-mapped from sunHours by scripts/migrate-catalog.mjs. */
  lightLevel?: LightLevel;
  /** Warm/cold watering schedule (v1.1). Auto-mapped from waterDays. */
  waterSchedule?: WaterSchedule;
  /** Watering mode (v1.1). Inferred from category + dbId allowlist. */
  waterMode?: WaterMode;

  /**
   * Phase 8 (CAT-05). Legacy slug aliases that resolve to this entry via getCatalogEntry().
   * Underscore prefix denotes meta. Canonical id always wins; aliases scanned only if no id match.
   */
  _aliases?: string[];

  // ─── v1.2 Phase 14 (EDU-02) educational fields — additive, all optional ───
  /** Action card copy for "¿Qué hacer?" section. Both sub-fields independently optional. */
  careAction?: CareAction;
  /** Single recommended placement description for "¿Dónde ponerla?". */
  placementRecommended?: string;
  /** Acceptable alternative placements (rendered as bullets/chips). */
  placementAlternatives?: string[];
  /** Single line of placement to avoid (e.g., "Evitá corrientes de aire frío"). */
  placementAvoid?: string;
  /** Horticultural rationale for "¿Por qué?" section. Hides ENTIRE section if absent. */
  whyRationale?: string;
  // ─── v1.2 Phase 19 (TOX-01) — pet toxicity per cats/dogs against ASPCA ───
  /** Pet toxicity classification (TOX-01). Absence of field is treated as 'unknown' (NOT 'safe'). */
  petToxicity?: PetToxicityEntry;

  // ─── v1.2 Phase 20 (FERT-02 / FERT-07) — fertilization cadence + recommendation copy ───
  /** v1.2 Phase 20 (FERT-02). Days between fertilizations in warm season. Absence skips emission. */
  fertilizeIntervalWarm?: number;
  /** v1.2 Phase 20 (FERT-02). Days between fertilizations in cold season. null = dormant (no emission). */
  fertilizeIntervalCold?: number | null;
  /** v1.2 Phase 20 (FERT-07). Fertilizer type + per-locale recommendation copy (industrial NPK ratios + homemade recipes; NEVER brand names — FERT-07 lock). */
  fertilizer?: {
    type: 'industrial' | 'homemade' | 'both';
    industrialRecommendation?: string;
    homemadeRecommendation?: string;
  };
}

// Weather types for Open-Meteo API integration
export interface WeatherCurrent {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number | null;
}

export interface WeatherDaily {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  sunrise: string | null;  // ISO datetime string
  sunset: string | null;   // ISO datetime string
  uvIndexMax: number | null;
}

export interface WeatherData {
  current: WeatherCurrent;
  daily: WeatherDaily[];
  lastFetched: number;
}

export interface WeatherAlert {
  type: "frost" | "heat" | "rain" | "wind";
  icon: string;
  title: string;
  message: string;
  severity: "danger" | "warning" | "info";
}

// Notification Settings
export interface NotificationSettings {
  enabled: boolean;
  morningReminder: boolean;
  morningTime: string; // "HH:MM" format, e.g. "08:00"
  weatherAlerts: boolean;
  careReminders: boolean;
  /** v1.2 Phase 20 (FERT-05). Default OFF; opt-in fertilize axis in morning body. */
  fertilizeReminders?: boolean;
}

// Plant Health Types
export type HealthLevel = 'excellent' | 'good' | 'warning' | 'danger';

export type HealthIssueType = 'overdue_water' | 'overdue_sun' | 'no_care' | 'extreme_weather' | 'active_diagnosis';

export type HealthIssueSeverity = 'low' | 'medium' | 'high';

export interface HealthIssue {
  type: HealthIssueType;
  severity: HealthIssueSeverity;
  message: string;
  daysSince?: number;
}

export interface PlantHealthStatus {
  plantId: string;
  score: number; // 0-100
  level: HealthLevel;
  issues: HealthIssue[];
}

// Plant Identification Types (Claude Vision)
export interface IdentifiedPlant {
  commonName: string;
  scientificName: string;
  confidence: number; // 0-100
  category: PlantCategory;
  waterDays: number;
  sunHours: number;
  tempMin: number;
  tempMax: number;
  humidity: HumidityLevel;
  indoor: boolean;
  tip: string;
  icon: string;
  /** v1.1 Phase 7 (LIGHT-05). Populated client-side from catalog match or sunHours mapping. User overrides via picker before save. */
  lightLevel?: LightLevel;
}

export type IdentificationResultType = 'single' | 'multiple' | 'none';

export interface IdentificationResult {
  success: boolean;
  type: IdentificationResultType;
  results: IdentifiedPlant[];
  reason?: string; // Reason for failure or ambiguity
}

export type IdentificationState = 'idle' | 'capturing' | 'analyzing' | 'results' | 'error';

// Plant Diagnosis Types (Claude Vision)
export type DiagnosisSeverity = 'healthy' | 'minor' | 'moderate' | 'severe';

export interface DiagnosisIssue {
  name: string;
  confidence: number; // 0-100
  severity: DiagnosisSeverity;
  description: string;
  treatment: string;
}

export interface DiagnosisResult {
  overallStatus: DiagnosisSeverity;
  summary: string;
  issues: DiagnosisIssue[];
  careTips: string[];
}

export type DiagnosisState = 'idle' | 'capturing' | 'analyzing' | 'results' | 'error';

/**
 * Watering season bucket (Phase 5 — SEASON-01..03). 'tropical' always maps to 'warm' interval lookup.
 * Defined here so PlantDiagnosisContext can reference it without importing from utils (avoids cycle).
 * src/utils/seasonality.ts re-exports this type; all existing imports of WaterSeason remain valid.
 */
export type WaterSeason = 'warm' | 'cold' | 'tropical';

/**
 * Diagnosis context payload sent to edge functions (diagnose-plant, chat-diagnosis).
 *
 * Phase 7 (Plan 07-08, LIGHT-05): extended with v1.1 fields. The edge function
 * uses `!!ctx.waterSchedule` as a discriminator to choose between legacy and v1.1
 * prompt branches. New clients send v1.1 fields; legacy fields kept optional for
 * backward compat (old store-installed clients still work; v1.2 sunsets the legacy branch).
 */
export interface PlantDiagnosisContext {
  species: string;
  lastWatered: string | null;
  outdoorDays: number[];

  // ─── v1.0 legacy fields (optional in Phase 7; new clients no longer send) ───
  /** @deprecated Phase 7. v1.0 clients still send; new clients use waterSchedule. */
  waterEvery?: number;
  /** @deprecated Phase 7. v1.0 clients still send; new clients use lightLevel. */
  sunHours?: number;

  // ─── v1.1 fields (Phase 7 new — sent by post-Plan-07-08 clients) ───
  /** v1.1 light level taxonomy. */
  lightLevel?: LightLevel;
  /** v1.1 warm/cold watering schedule. */
  waterSchedule?: WaterSchedule;
  /** v1.1 watering mode (fixed | soil_check). */
  waterMode?: WaterMode;
  /** v1.1 current effective season (warm | cold | tropical) — derived via getEffectiveSeason. */
  currentSeason?: WaterSeason;
}

export interface DiagnosisChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system'; // 'system' added in Phase 9 (DIAG-03) — rendered as centered info banner, NOT chat bubble
  text: string;
  timestamp: string;
  imageUri?: string | null;
}

export type TrackingStatus = 'watching' | 'needs_attention' | 'recovering' | 'resolved';

export interface ProblemEntry {
  id: string;
  date: string;
  photoUri: string | null;
  aiNotes: string;
  statusChange: TrackingStatus | null;
}

export interface SavedDiagnosis {
  id: string;
  plantId: string;
  date: string;
  imageUri: string | null; // Kept for backward compat with single-photo diagnoses
  imageUris?: string[]; // Multiple photos (up to 3)
  result: DiagnosisResult;
  context: PlantDiagnosisContext;
  chat: DiagnosisChatMessage[];
  resolved: boolean;
  resolvedDate: string | null;
  /** Phase 9 (DIAG-03): ISO timestamp of latest reopen for resolved diagnoses. Single-reopen tracking; latest overwrites. */
  reopenedAt?: string;
  // Problem tracking (Phase 2)
  isTracked?: boolean;
  trackingStatus?: TrackingStatus;
  previousStatus?: TrackingStatus;
  followUpDate?: string;
  followUpNotificationId?: string | null;
  problemSummary?: string;
  severity?: DiagnosisSeverity;
  entries?: ProblemEntry[];
}

// Auth & Sync Types
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
}

// Re-export database types
export * from './database';
