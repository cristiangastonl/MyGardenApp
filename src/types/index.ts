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
  type: "water" | "sun" | "outdoor" | "check_soil";
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
  role: 'user' | 'assistant';
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
