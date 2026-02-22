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

export interface Plant {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  icon: string;
  imageUrl?: string; // URL de foto real de la planta
  databaseId?: string; // Link to PLANT_DATABASE entry for detailed info
  waterEvery: number;
  sunHours: number;
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
  type: "water" | "sun" | "outdoor";
  icon: string;
  label: string;
  plantId: string;
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
  waterDays: number;
  sunHours: number;
  tempMin: number;
  tempMax: number;
  humidity: HumidityLevel;
  outdoor: boolean;
  tip: string;
  description: string;
  problems: PlantProblem[];
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

export type HealthIssueType = 'overdue_water' | 'overdue_sun' | 'no_care' | 'extreme_weather';

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
}

export type IdentificationResultType = 'single' | 'multiple' | 'none';

export interface IdentificationResult {
  success: boolean;
  type: IdentificationResultType;
  results: IdentifiedPlant[];
  reason?: string; // Reason for failure or ambiguity
}

export type IdentificationState = 'idle' | 'capturing' | 'analyzing' | 'results' | 'error';

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
