import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { User } from '@supabase/supabase-js';
import {
  syncToCloud,
  syncFromCloud,
  hasCloudData,
  SyncStatus,
  CloudData,
} from '../services/syncService';
import { Plant, Note, Reminder, Location, NotificationSettings } from '../types';
import { flushEvents } from '../services/analyticsService';

// Debounce delay for auto-sync after changes (5 seconds)
const SYNC_DEBOUNCE_MS = 5000;
// Minimum time between syncs when returning from background (5 minutes)
const BACKGROUND_SYNC_THRESHOLD_MS = 5 * 60 * 1000;

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  hasCloudData: boolean;
}

export interface SyncActions {
  syncUp: () => Promise<void>;
  syncDown: () => Promise<CloudData | null>;
  checkCloudData: () => Promise<boolean>;
  triggerSync: () => void;
  clearError: () => void;
}

interface UseSyncParams {
  user: User | null;
  plants: Plant[];
  notes: Record<string, Note[]>;
  reminders: Record<string, Reminder[]>;
  location: Location | null;
  notificationSettings: NotificationSettings | null;
  plantNetApiKey: string | null;
  onDataReceived?: (data: CloudData) => void;
}

export function useSync({
  user,
  plants,
  notes,
  reminders,
  location,
  notificationSettings,
  plantNetApiKey,
  onDataReceived,
}: UseSyncParams): SyncState & SyncActions {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cloudDataExists, setCloudDataExists] = useState(false);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBackgroundTimeRef = useRef<number>(Date.now());

  // Sync up (upload to cloud)
  const syncUp = useCallback(async () => {
    if (!user) return;

    setStatus('syncing');
    setError(null);

    const result = await syncToCloud(user.id, {
      plants,
      notes,
      reminders,
      location,
      notificationSettings,
      plantNetApiKey,
    });

    if (result.success) {
      setStatus('success');
      setLastSyncedAt(result.syncedAt ?? new Date().toISOString());
      // Reset to idle after a short delay
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
      setError(result.error ?? 'Error desconocido');
    }
  }, [user, plants, notes, reminders, location, notificationSettings, plantNetApiKey]);

  // Sync down (download from cloud)
  const syncDown = useCallback(async (): Promise<CloudData | null> => {
    if (!user) return null;

    setStatus('syncing');
    setError(null);

    const result = await syncFromCloud(user.id);

    if (result.success && result.data) {
      setStatus('success');
      setLastSyncedAt(new Date().toISOString());
      onDataReceived?.(result.data);
      setTimeout(() => setStatus('idle'), 2000);
      return result.data;
    } else {
      setStatus('error');
      setError(result.error ?? 'Error desconocido');
      return null;
    }
  }, [user, onDataReceived]);

  // Check if user has cloud data
  const checkCloudData = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const exists = await hasCloudData(user.id);
    setCloudDataExists(exists);
    return exists;
  }, [user]);

  // Trigger debounced sync
  const triggerSync = useCallback(() => {
    if (!user) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new timeout
    syncTimeoutRef.current = setTimeout(() => {
      syncUp();
    }, SYNC_DEBOUNCE_MS);
  }, [user, syncUp]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        const timeSinceBackground = now - lastBackgroundTimeRef.current;

        // Sync if we've been in background for more than threshold
        if (timeSinceBackground > BACKGROUND_SYNC_THRESHOLD_MS) {
          syncDown();
        }
      } else if (nextAppState === 'background') {
        lastBackgroundTimeRef.current = Date.now();
        // Sync before going to background
        syncUp();
        flushEvents();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user, syncUp, syncDown]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSyncedAt,
    error,
    hasCloudData: cloudDataExists,
    syncUp,
    syncDown,
    checkCloudData,
    triggerSync,
    clearError,
  };
}
