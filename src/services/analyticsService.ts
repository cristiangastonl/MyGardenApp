import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbAnalyticsEventInsert } from '../types/database';

const DEVICE_ID_KEY = 'analytics_device_id';
const QUEUE_KEY = 'analytics_queue';
const APP_VERSION = '1.0.0';
const FLUSH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_BATCH_SIZE = 50;

let deviceId: string | null = null;
let queue: DbAnalyticsEventInsert[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      deviceId = stored;
      return stored;
    }

    const newId = randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    deviceId = newId;
    return newId;
  } catch {
    // Fallback: generate but don't persist
    deviceId = randomUUID();
    return deviceId;
  }
}

async function persistQueue(): Promise<void> {
  try {
    if (queue.length > 0) {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } else {
      await AsyncStorage.removeItem(QUEUE_KEY);
    }
  } catch {
    // Silent fail - analytics should never crash the app
  }
}

async function loadPersistedQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DbAnalyticsEventInsert[];
      queue = [...parsed, ...queue];
      console.log(`[Analytics] Loaded ${parsed.length} persisted events`);
    }
  } catch {
    // Silent fail
  }
}

export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    await getDeviceId();
    await loadPersistedQueue();

    // Auto-flush every 30s
    flushTimer = setInterval(() => {
      flushEvents();
    }, FLUSH_INTERVAL_MS);

    console.log('[Analytics] Initialized');
  } catch {
    // Silent fail
  }
}

export async function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const id = await getDeviceId();

    const event: DbAnalyticsEventInsert = {
      device_id: id,
      event_name: eventName,
      event_data: eventData,
      app_version: APP_VERSION,
      platform: Platform.OS,
    };

    queue.push(event);
    console.log(`[Analytics] Queued: ${eventName}`);
  } catch {
    // Silent fail
  }
}

export async function flushEvents(): Promise<void> {
  if (queue.length === 0) return;
  if (!isSupabaseConfigured()) {
    console.log('[Analytics] Supabase not configured, persisting queue');
    await persistQueue();
    return;
  }

  const batch = queue.splice(0, MAX_BATCH_SIZE);

  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert(batch as any);

    if (error) {
      // Put events back in queue for retry
      queue.unshift(...batch);
      console.log('[Analytics] Flush failed, will retry:', error.message);
      await persistQueue();
    } else {
      console.log(`[Analytics] Flushed ${batch.length} events`);
      await persistQueue();
    }
  } catch {
    // Put events back in queue for retry
    queue.unshift(...batch);
    await persistQueue();
  }
}

export function stopAnalytics(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}
