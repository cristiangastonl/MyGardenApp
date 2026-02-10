import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Plant, Note, Reminder, Location, NotificationSettings } from '../types';
import {
  DbPlant,
  DbNote,
  DbReminder,
  DbUserSettings,
} from '../types/database';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncResult {
  success: boolean;
  error?: string;
  syncedAt?: string;
}

export interface CloudData {
  plants: Plant[];
  notes: Record<string, Note[]>;
  reminders: Record<string, Reminder[]>;
  location: Location | null;
  notificationSettings: NotificationSettings | null;
  plantNetApiKey: string | null;
}

// === Converters: Local <-> Database ===

function plantToDb(plant: Plant, userId: string) {
  return {
    user_id: userId,
    local_id: plant.id,
    name: plant.name,
    type_id: plant.typeId,
    type_name: plant.typeName,
    icon: plant.icon,
    water_every: plant.waterEvery,
    sun_hours: plant.sunHours,
    sun_days: plant.sunDays,
    outdoor_days: plant.outdoorDays,
    last_watered: plant.lastWatered,
    sun_done_date: plant.sunDoneDate,
    outdoor_done_date: plant.outdoorDoneDate,
  };
}

function dbToPlant(dbPlant: DbPlant): Plant {
  return {
    id: dbPlant.local_id,
    name: dbPlant.name,
    typeId: dbPlant.type_id,
    typeName: dbPlant.type_name,
    icon: dbPlant.icon,
    waterEvery: dbPlant.water_every,
    sunHours: dbPlant.sun_hours,
    sunDays: dbPlant.sun_days,
    outdoorDays: dbPlant.outdoor_days,
    lastWatered: dbPlant.last_watered,
    sunDoneDate: dbPlant.sun_done_date,
    outdoorDoneDate: dbPlant.outdoor_done_date,
  };
}

function noteToDb(note: Note, date: string, userId: string) {
  return {
    user_id: userId,
    local_id: note.id,
    date,
    text: note.text,
  };
}

function dbToNote(dbNote: DbNote): Note {
  return {
    id: dbNote.local_id,
    text: dbNote.text,
    createdAt: dbNote.created_at,
  };
}

function reminderToDb(reminder: Reminder, date: string, userId: string) {
  return {
    user_id: userId,
    local_id: reminder.id,
    date,
    text: reminder.text,
    time: reminder.time,
    done: reminder.done,
  };
}

function dbToReminder(dbReminder: DbReminder): Reminder {
  return {
    id: dbReminder.local_id,
    text: dbReminder.text,
    time: dbReminder.time,
    done: dbReminder.done,
  };
}

// === Sync Functions ===

/**
 * Upload local data to the cloud
 */
export async function syncToCloud(
  userId: string,
  data: {
    plants: Plant[];
    notes: Record<string, Note[]>;
    reminders: Record<string, Reminder[]>;
    location: Location | null;
    notificationSettings: NotificationSettings | null;
    plantNetApiKey: string | null;
  }
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // 1. Upsert plants
    if (data.plants.length > 0) {
      const plantsToUpsert = data.plants.map((p) => plantToDb(p, userId));
      const { error: plantsError } = await supabase
        .from('plants')
        .upsert(plantsToUpsert as any, { onConflict: 'user_id,local_id' });

      if (plantsError) throw plantsError;
    }

    // 2. Upsert notes
    const allNotes = [];
    for (const [date, noteList] of Object.entries(data.notes)) {
      for (const note of noteList) {
        allNotes.push(noteToDb(note, date, userId));
      }
    }
    if (allNotes.length > 0) {
      const { error: notesError } = await supabase
        .from('notes')
        .upsert(allNotes as any, { onConflict: 'user_id,local_id' });

      if (notesError) throw notesError;
    }

    // 3. Upsert reminders
    const allReminders = [];
    for (const [date, reminderList] of Object.entries(data.reminders)) {
      for (const reminder of reminderList) {
        allReminders.push(reminderToDb(reminder, date, userId));
      }
    }
    if (allReminders.length > 0) {
      const { error: remindersError } = await supabase
        .from('reminders')
        .upsert(allReminders as any, { onConflict: 'user_id,local_id' });

      if (remindersError) throw remindersError;
    }

    // 4. Upsert user settings
    const settings = {
      user_id: userId,
      location_lat: data.location?.lat ?? null,
      location_lon: data.location?.lon ?? null,
      location_name: data.location?.name ?? null,
      location_country: data.location?.country ?? null,
      location_admin1: data.location?.admin1 ?? null,
      notification_enabled: data.notificationSettings?.enabled ?? false,
      notification_morning_time: data.notificationSettings?.morningTime ?? '08:00',
      notification_weather_alerts: data.notificationSettings?.weatherAlerts ?? false,
      notification_care_reminders: data.notificationSettings?.careReminders ?? false,
      notification_morning_reminder: data.notificationSettings?.morningReminder ?? false,
      plantnet_api_key: data.plantNetApiKey,
      updated_at: new Date().toISOString(),
    };

    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert(settings as any, { onConflict: 'user_id' });

    if (settingsError) throw settingsError;

    return {
      success: true,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Sync] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de sincronización',
    };
  }
}

/**
 * Download data from the cloud
 */
export async function syncFromCloud(userId: string): Promise<{
  success: boolean;
  data?: CloudData;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // 1. Fetch plants
    const { data: dbPlants, error: plantsError } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId);

    if (plantsError) throw plantsError;

    const plants: Plant[] = ((dbPlants ?? []) as DbPlant[]).map(dbToPlant);

    // 2. Fetch notes
    const { data: dbNotes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    if (notesError) throw notesError;

    const notes: Record<string, Note[]> = {};
    for (const dbNote of (dbNotes ?? []) as DbNote[]) {
      const date = dbNote.date;
      if (!notes[date]) notes[date] = [];
      notes[date].push(dbToNote(dbNote));
    }

    // 3. Fetch reminders
    const { data: dbReminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId);

    if (remindersError) throw remindersError;

    const reminders: Record<string, Reminder[]> = {};
    for (const dbReminder of (dbReminders ?? []) as DbReminder[]) {
      const date = dbReminder.date;
      if (!reminders[date]) reminders[date] = [];
      reminders[date].push(dbToReminder(dbReminder));
    }

    // 4. Fetch user settings
    const { data: dbSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Settings might not exist yet, that's ok
    let location: Location | null = null;
    let notificationSettings: NotificationSettings | null = null;
    let plantNetApiKey: string | null = null;

    const settings = dbSettings as DbUserSettings | null;
    if (settings && !settingsError) {
      if (settings.location_lat && settings.location_lon && settings.location_name) {
        location = {
          lat: settings.location_lat,
          lon: settings.location_lon,
          name: settings.location_name,
          country: settings.location_country ?? '',
          admin1: settings.location_admin1 ?? undefined,
        };
      }

      notificationSettings = {
        enabled: settings.notification_enabled,
        morningReminder: settings.notification_morning_reminder,
        morningTime: settings.notification_morning_time,
        weatherAlerts: settings.notification_weather_alerts,
        careReminders: settings.notification_care_reminders,
      };

      plantNetApiKey = settings.plantnet_api_key;
    }

    return {
      success: true,
      data: {
        plants,
        notes,
        reminders,
        location,
        notificationSettings,
        plantNetApiKey,
      },
    };
  } catch (error) {
    console.error('[Sync] Download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de sincronización',
    };
  }
}

/**
 * Delete all user data from the cloud (for account cleanup)
 */
export async function deleteCloudData(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // Delete in order to respect foreign key constraints
    await supabase.from('reminders').delete().eq('user_id', userId);
    await supabase.from('notes').delete().eq('user_id', userId);
    await supabase.from('plants').delete().eq('user_id', userId);
    await supabase.from('user_settings').delete().eq('user_id', userId);

    return { success: true };
  } catch (error) {
    console.error('[Sync] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar datos',
    };
  }
}

/**
 * Check if user has any cloud data
 */
export async function hasCloudData(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { count, error } = await supabase
      .from('plants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return (count ?? 0) > 0;
  } catch (error) {
    console.error('[Sync] Check data error:', error);
    return false;
  }
}
