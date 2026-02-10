// Supabase Database Types
// These types mirror the SQL schema defined in the plan

export interface DbProfile {
  id: string; // UUID from auth.users
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbPlant {
  id: string; // UUID
  user_id: string;
  local_id: string;
  name: string;
  type_id: string;
  type_name: string;
  icon: string;
  water_every: number;
  sun_hours: number;
  sun_days: number[];
  outdoor_days: number[];
  last_watered: string | null; // DATE as ISO string
  sun_done_date: string | null;
  outdoor_done_date: string | null;
  updated_at: string;
}

export interface DbNote {
  id: string; // UUID
  user_id: string;
  local_id: string;
  date: string; // YYYY-MM-DD
  text: string;
  created_at: string;
}

export interface DbReminder {
  id: string; // UUID
  user_id: string;
  local_id: string;
  date: string; // YYYY-MM-DD
  text: string;
  time: string; // HH:MM
  done: boolean;
}

export interface DbUserSettings {
  user_id: string;
  location_lat: number | null;
  location_lon: number | null;
  location_name: string | null;
  location_country: string | null;
  location_admin1: string | null;
  notification_enabled: boolean;
  notification_morning_time: string;
  notification_weather_alerts: boolean;
  notification_care_reminders: boolean;
  notification_morning_reminder: boolean;
  plantnet_api_key: string | null;
  updated_at: string;
}

// Insert types (without auto-generated fields)
export type DbPlantInsert = Omit<DbPlant, 'id' | 'updated_at'>;
export type DbNoteInsert = Omit<DbNote, 'id' | 'created_at'>;
export type DbReminderInsert = Omit<DbReminder, 'id'>;
export type DbUserSettingsInsert = Omit<DbUserSettings, 'updated_at'>;

// Cached plant knowledge from external APIs (shared across all users)
export interface DbPlantKnowledge {
  id: string; // UUID
  common_name: string;
  scientific_name: string | null;
  other_names: string[] | null;
  image_url: string | null;
  // Care info
  watering_frequency_days: number | null;
  sunlight: string | null; // "full_sun", "part_shade", "full_shade"
  sun_hours_min: number | null;
  sun_hours_max: number | null;
  temp_min_c: number | null;
  temp_max_c: number | null;
  humidity: string | null; // "low", "medium", "high"
  indoor: boolean | null;
  // Additional info
  description: string | null;
  care_tips: string | null;
  // Source tracking
  source: string; // "perenual", "trefle", "ai", "manual"
  source_id: string | null; // ID from the source API
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type DbPlantKnowledgeInsert = Omit<DbPlantKnowledge, 'id' | 'created_at' | 'updated_at'>;

// Supabase Database schema type for type-safe queries
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: Omit<DbProfile, 'created_at'>;
        Update: Partial<Omit<DbProfile, 'id' | 'created_at'>>;
      };
      plants: {
        Row: DbPlant;
        Insert: DbPlantInsert;
        Update: Partial<Omit<DbPlant, 'id' | 'user_id'>>;
      };
      notes: {
        Row: DbNote;
        Insert: DbNoteInsert;
        Update: Partial<Omit<DbNote, 'id' | 'user_id'>>;
      };
      reminders: {
        Row: DbReminder;
        Insert: DbReminderInsert;
        Update: Partial<Omit<DbReminder, 'id' | 'user_id'>>;
      };
      user_settings: {
        Row: DbUserSettings;
        Insert: DbUserSettingsInsert;
        Update: Partial<Omit<DbUserSettings, 'user_id'>>;
      };
      plant_knowledge: {
        Row: DbPlantKnowledge;
        Insert: DbPlantKnowledgeInsert;
        Update: Partial<Omit<DbPlantKnowledge, 'id' | 'created_at'>>;
      };
    };
  };
}
