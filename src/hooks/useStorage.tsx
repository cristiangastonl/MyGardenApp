import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, PlantPhoto, Note, Reminder, Location, AppData, NotificationSettings, SavedDiagnosis, DiagnosisChatMessage, ShoppingItem, TrackingStatus, ProblemEntry, ClimateOverride, JournalEntry } from '../types';
import type { PersistedAppData } from '../types';
import { STORAGE_KEY } from '../data/constants';
import { formatDate } from '../utils/dates';
import { severityToTrackingStatus } from '../services/problemTrackingService';
import { trackEvent } from '../services/analyticsService';
import {
  runMigrations,
  isVersioned,
  toPersisted,
  BACKUP_KEY,
  CURRENT_SCHEMA_VERSION,
} from '../utils/migration';
import { getCatalogEntry } from '../data/plantDatabase';
import { deleteJournalDirectory } from '../services/journalService';

/**
 * v1.2 Phase 14 (EDU-06). Fields that represent user-customized values which catalog-source
 * code paths MUST NOT silently overwrite. Pickers / settings / explicit user-edit flows
 * pass `{ fromUserEdit: true }` to opt out of the guard. Per CRIT-1 (.planning/research/PITFALLS.md).
 */
const PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode', 'fertilizeSchedule'] as const;

interface UpdatePlantOptions {
  /** Pass `true` ONLY when the caller is a user-edit flow (picker save, settings save).
   *  Catalog-source code paths MUST omit / pass false. */
  fromUserEdit?: boolean;
}

interface StorageState {
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
  journals: Record<string, JournalEntry[]>; // v1.2 Phase 21 JOURNAL-01; never undefined at runtime, defaults to {}
  climateOverride: ClimateOverride; // v1.1 Phase 7 LOC-05; never undefined at runtime, defaults to 'auto'
  loading: boolean;
  migrationFailed: boolean;       // SCHEMA-07: drives MigrationBanner render (Plan 06)
  migrationJustHappened: boolean; // SCHEMA-06: drives App-level reschedule trigger (Plan 07)
}

interface StorageActions {
  setPlants: (plants: Plant[]) => void;
  addPlant: (plant: Plant) => void;
  addPlants: (plants: Plant[]) => void;
  deletePlant: (id: string) => void;
  updatePlant: (id: string, updates: Partial<Plant>, options?: UpdatePlantOptions) => void;
  /** v1.2 Phase 20 (FERT-06) — marks fertilization done on plant.fertilizeSchedule.lastFertilized; bootstraps schedule from catalog when absent. */
  fertilizePlant: (id: string) => void;
  addNote: (dateStr: string, note: Note) => void;
  deleteNote: (dateStr: string, noteId: string) => void;
  addReminder: (dateStr: string, reminder: Reminder) => void;
  deleteReminder: (dateStr: string, reminderId: string) => void;
  updateReminder: (dateStr: string, reminderId: string, updates: Partial<Reminder>) => void;
  // ─── v1.2 Phase 21 (JOURNAL-03) ───
  /** Adds a journal entry for plantId. Caller pre-generated `entry.id` via Date.now().toString().
   *  Photo file (if any) MUST already be written to documentDirectory BEFORE this call —
   *  invariant: every `photoUri` in storage points to a real file (atomic write order). */
  addJournalEntry: (plantId: string, entry: JournalEntry) => void;
  /** Removes a journal entry. Caller is responsible for the per-entry photo file deletion via
   *  journalService.deleteJournalPhoto(plantId, entryId) BEFORE invoking this action. */
  deleteJournalEntry: (plantId: string, entryId: string) => void;
  updateLocation: (location: Location | null) => void;
  completeOnboarding: () => void;
  completeOnboardingWithData: (plants: Plant[], userName: string | null) => void;
  setUserName: (name: string | null) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  updatePlantNetApiKey: (key: string | null) => void;
  incrementIdentificationCount: () => void;
  incrementDiagnosisCount: () => void;
  addPhotoToPlant: (plantId: string, photo: PlantPhoto) => void;
  removePhotoFromPlant: (plantId: string, photoId: string) => void;
  saveDiagnosis: (diagnosis: SavedDiagnosis) => void;
  addChatMessage: (plantId: string, diagnosisId: string, message: DiagnosisChatMessage | DiagnosisChatMessage[]) => void;
  getDiagnosesForPlant: (plantId: string) => SavedDiagnosis[];
  resolveDiagnosis: (plantId: string, diagnosisId: string) => void;
  updateDiagnosis: (plantId: string, diagnosisId: string, updates: Partial<SavedDiagnosis>) => void; // Phase 9 (DIAG-03): generic merge for reopenedAt + system-message append on reopen
  getActiveDiagnosesForPlant: (plantId: string) => SavedDiagnosis[];
  trackProblem: (plantId: string, diagnosisId: string, trackingStatus: TrackingStatus, followUpDate: string, notificationId: string | null, problemSummary: string) => void;
  resolveTrackedProblem: (plantId: string, diagnosisId: string) => void;
  reopenTrackedProblem: (plantId: string, diagnosisId: string) => void;
  addFollowUpEntry: (plantId: string, diagnosisId: string, entry: ProblemEntry) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  removeShoppingItem: (itemId: string) => void;
  toggleShoppingItem: (itemId: string) => void;
  clearCheckedShoppingItems: () => void;
  acknowledgeMigrationReschedule: () => void; // App.tsx (Plan 07) calls this once it has rescheduled notifications
  setClimateOverride: (override: ClimateOverride) => void; // v1.1 Phase 7 (LOC-05)
}

type StorageContextType = StorageState & StorageActions;

const StorageContext = createContext<StorageContextType | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

// Helper to get AppData snapshot from the ref (excludes runtime-only state fields)
function snapshotFromRef(ref: React.MutableRefObject<Omit<StorageState, 'loading' | 'migrationFailed' | 'migrationJustHappened'>>): AppData {
  const d = ref.current;
  return {
    plants: d.plants,
    notes: d.notes,
    reminders: d.reminders,
    location: d.location,
    onboardingCompleted: d.onboardingCompleted,
    userName: d.userName,
    notificationSettings: d.notificationSettings,
    plantNetApiKey: d.plantNetApiKey,
    installDate: d.installDate,
    identificationCount: d.identificationCount,
    diagnosisCount: d.diagnosisCount,
    diagnosisHistory: d.diagnosisHistory,
    shoppingList: d.shoppingList,
    climateOverride: d.climateOverride,
    journals: d.journals,
  };
}

const SAVE_DEBOUNCE_MS = 100;

export function StorageProvider({ children }: StorageProviderProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [reminders, setReminders] = useState<Record<string, Reminder[]>>({});
  const [location, setLocation] = useState<Location | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [plantNetApiKey, setPlantNetApiKeyState] = useState<string | null>(null);
  const [installDate, setInstallDate] = useState<string | null>(null);
  const [identificationCount, setIdentificationCount] = useState(0);
  const [diagnosisCount, setDiagnosisCount] = useState(0);
  const [diagnosisHistory, setDiagnosisHistory] = useState<Record<string, SavedDiagnosis[]>>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  // v1.2 Phase 21 (JOURNAL-01): state field; load-path hydrates via setJournals. Mutation actions land in Plan 21-03.
  const [journals, setJournals] = useState<Record<string, JournalEntry[]>>({});
  const [climateOverride, setClimateOverrideState] = useState<ClimateOverride>('auto');
  const [loading, setLoading] = useState(true);
  const [migrationFailed, setMigrationFailed] = useState(false);
  const [migrationJustHappened, setMigrationJustHappened] = useState(false);

  // Ref that always holds the latest data — updated synchronously on every mutation
  const dataRef = useRef<Omit<StorageState, 'loading' | 'migrationFailed' | 'migrationJustHappened'>>({
    plants: [],
    notes: {},
    reminders: {},
    location: null,
    onboardingCompleted: false,
    userName: null,
    notificationSettings: null,
    plantNetApiKey: null,
    installDate: null,
    identificationCount: 0,
    diagnosisCount: 0,
    diagnosisHistory: {},
    shoppingList: [],
    journals: {},
    climateOverride: 'auto',
  });

  // Debounced save timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist the current ref snapshot to AsyncStorage (debounced)
  // Always emits the v1.1 versioned envelope { schemaVersion, data } (SCHEMA-09).
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      try {
        const data = snapshotFromRef(dataRef);
        const persisted: PersistedAppData = { schemaVersion: CURRENT_SCHEMA_VERSION, data };
        if (__DEV__) {
          // v1.2 Phase 21 (JOURNAL-01 / Important 9): payload-size instrumentation so Wave 5 device tester
          // can verify photos are NOT stored as base64 (payload should grow <1KB per photo add, not ~50KB).
          // eslint-disable-next-line no-console
          console.log('[useStorage] AsyncStorage payload bytes:', JSON.stringify(persisted).length);
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      } catch (e) {
        console.error('Save error:', e);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Load data on mount
  // Envelope-aware migration sequence (SCHEMA-01..09 / B2 simplified stage contract).
  // Single outer try/catch — ANY throw from getItem, JSON.parse, runMigrations, or
  // backup/envelope writes during migration is treated as a 'load' stage failure
  // that emits one `migration_failed` analytics event with the load-stage marker.
  // Plan 07 owns the separate `stage: 'reschedule'` emission.
  useEffect(() => {
    const loadData = async () => {
      const startTime = Date.now();
      let stored: string | null = null;
      let data: AppData | null = null;
      let didMigrate = false;
      let loadFailed = false;
      let loadFailureError: unknown = null;

      try {
        stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored) {
          // Brand new user — no migration needed; do not throw, do not emit failure
          const id = formatDate(new Date());
          setInstallDate(id);
          dataRef.current.installDate = id;
          dataRef.current.journals = {};
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);

        // Envelope short-circuit (SCHEMA-03 + SCHEMA-09)
        if (isVersioned(parsed) && parsed.schemaVersion >= CURRENT_SCHEMA_VERSION) {
          data = parsed.data as AppData;
        } else {
          // Run migration v0 → v1 (SCHEMA-01)
          const persisted = toPersisted(parsed);
          const plantCount = persisted.data?.plants?.length ?? 0;

          trackEvent('migration_started', { plantCount });

          // Synthetic-failure hook for SMOKE-TEST.md Scenario 5
          if (__DEV__ && (global as { FORCE_MIGRATION_FAIL?: boolean }).FORCE_MIGRATION_FAIL) {
            throw new Error('FORCE_MIGRATION_FAIL (dev-only synthetic failure)');
          }

          // Backup BEFORE mutating live data (SCHEMA-02) — write raw original verbatim
          await AsyncStorage.setItem(BACKUP_KEY, stored);

          // Pure transform
          data = runMigrations(persisted);

          // Persist envelope (SCHEMA-09) — direct setItem, NOT debounced
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, data })
          );

          trackEvent('migration_completed', {
            plantCount: data.plants?.length ?? 0,
            durationMs: Date.now() - startTime,
            schemaVersionFrom: persisted.schemaVersion,
            schemaVersionTo: CURRENT_SCHEMA_VERSION,
          });

          didMigrate = true;
        }
      } catch (loadError) {
        // SCHEMA-07: any pre-write failure — read, parse, or migration throw.
        // Do NOT overwrite live data; fall back to legacy reads if possible.
        if (__DEV__) console.log('[Storage] load failed:', loadError);
        loadFailed = true;
        loadFailureError = loadError;

        // Best-effort legacy parse so the user sees their data
        if (stored) {
          try {
            const legacyParsed = JSON.parse(stored);
            data = isVersioned(legacyParsed)
              ? (legacyParsed.data as AppData)
              : (legacyParsed as AppData);
          } catch {
            data = null;
          }
        }
      }

      // Emit single load-stage failure event AFTER fallback parse so plantCount is accurate
      if (loadFailed) {
        trackEvent('migration_failed', {
          error: String(loadFailureError),
          stage: 'load',
          plantCount: data?.plants?.length ?? 0,
        });
        setMigrationFailed(true);
      }

      // Hydrate React state from `data` (migrated OR legacy fallback OR null)
      if (data) {
        const p = data.plants || [];
        const n = data.notes || {};
        const r = data.reminders || {};
        const loc = data.location || null;
        const ob = data.onboardingCompleted || false;
        const un = data.userName || null;
        const ns = data.notificationSettings || null;
        const pnk = data.plantNetApiKey || null;
        const ic = data.identificationCount || 0;
        const dc = data.diagnosisCount || 0;
        const dh = data.diagnosisHistory || {};
        const sl = data.shoppingList || [];
        const co: ClimateOverride = (data as AppData).climateOverride ?? 'auto';
        const j: Record<string, JournalEntry[]> = data.journals || {};
        const effectiveInstallDate = data.installDate || formatDate(new Date());

        setPlants(p);
        setNotes(n);
        setReminders(r);
        setLocation(loc);
        setOnboardingCompleted(ob);
        setUserNameState(un);
        setNotificationSettings(ns);
        setPlantNetApiKeyState(pnk);
        setIdentificationCount(ic);
        setDiagnosisCount(dc);
        setDiagnosisHistory(dh);
        setShoppingList(sl);
        setJournals(j);
        setClimateOverrideState(co);
        setInstallDate(effectiveInstallDate);

        dataRef.current = {
          plants: p,
          notes: n,
          reminders: r,
          location: loc,
          onboardingCompleted: ob,
          userName: un,
          notificationSettings: ns,
          plantNetApiKey: pnk,
          installDate: effectiveInstallDate,
          identificationCount: ic,
          diagnosisCount: dc,
          diagnosisHistory: dh,
          shoppingList: sl,
          journals: j,
          climateOverride: co,
        };
      } else {
        // Both migration AND legacy parse failed — treat as brand-new user
        const id = formatDate(new Date());
        setInstallDate(id);
        dataRef.current.installDate = id;
        dataRef.current.journals = {};
      }

      if (didMigrate) {
        setMigrationJustHappened(true);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Cleanup debounce timer on unmount — flush pending save
  // Always emits the v1.1 versioned envelope { schemaVersion, data } (SCHEMA-09).
  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
        // Flush synchronously on unmount
        const data = snapshotFromRef(dataRef);
        const persisted: PersistedAppData = { schemaVersion: CURRENT_SCHEMA_VERSION, data };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(e =>
          console.error('Save error on unmount:', e)
        );
      }
    };
  }, []);

  // --- Mutation helpers: each updates its own field in state + ref, then schedules save ---

  const handleSetPlants = useCallback((newPlants: Plant[]) => {
    setPlants(newPlants);
    dataRef.current.plants = newPlants;
    scheduleSave();
  }, [scheduleSave]);

  const addPlant = useCallback((plant: Plant) => {
    const newPlants = [...dataRef.current.plants, plant];
    setPlants(newPlants);
    dataRef.current.plants = newPlants;
    scheduleSave();
  }, [scheduleSave]);

  const addPlants = useCallback((newPlantsToAdd: Plant[]) => {
    const newPlants = [...dataRef.current.plants, ...newPlantsToAdd];
    setPlants(newPlants);
    dataRef.current.plants = newPlants;
    scheduleSave();
  }, [scheduleSave]);

  const deletePlant = useCallback((id: string) => {
    // ─── Phase 21 (JOURNAL-04) ORPHAN CLEANUP — BEFORE state mutation ───
    // Fire-and-forget: photo dir delete is async but state mutation is sync.
    // Idempotent: missing dir is a no-op inside the service (deleteJournalDirectory existence-guarded).
    // If FS delete throws (permissions etc.), we LOG and continue — state mutation still happens,
    // photos are orphaned but the plant is gone (acceptable per RESEARCH fail-fast policy —
    // orphans are inert files, not corruption).
    // `__DEV__` is the standard RN runtime global (Metro-defined); matches usage in
    // src/hooks/usePlantIdentification.ts (L74/76/83/92) and src/utils/haptics.ts:44.
    deleteJournalDirectory(id).catch(e => {
      if (__DEV__) console.warn('[deletePlant] journal photo cleanup failed (orphans possible):', e);
    });

    const newPlants = dataRef.current.plants.filter(p => p.id !== id);
    setPlants(newPlants);
    dataRef.current.plants = newPlants;

    // Clean up orphaned diagnosis history for the deleted plant
    const newHistory = { ...dataRef.current.diagnosisHistory };
    delete newHistory[id];
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;

    // ─── Phase 21 (JOURNAL-04) — clean up journals map entry for the deleted plant ───
    const newJournals = { ...dataRef.current.journals };
    delete newJournals[id];
    setJournals(newJournals);
    dataRef.current.journals = newJournals;

    scheduleSave();
  }, [scheduleSave]);

  const updatePlant = useCallback((id: string, updates: Partial<Plant>, options: UpdatePlantOptions = {}) => {
    // Phase 8 (CAT-05): auto-rewrite alias databaseId to canonical on save.
    // Idempotent — if databaseId is already canonical, entry.id === updates.databaseId
    // and no rewrite occurs. ONLY in updatePlant (not addPlant/setPlants) per CONTEXT decision.
    const normalizedUpdates = { ...updates };

    // ─── v1.2 Phase 14 (EDU-06) deep-merge guard ───
    // Per CRIT-1 (.planning/research/PITFALLS.md): catalog-source code paths must not
    // silently overwrite user-customized values. Drop protected fields from
    // `normalizedUpdates` if the existing plant has a non-undefined value AND the
    // caller did NOT pass `{ fromUserEdit: true }`. Runs BEFORE alias-rewrite.
    if (!options.fromUserEdit) {
      const existing = dataRef.current.plants.find(p => p.id === id);
      if (existing) {
        for (const key of PROTECTED_USER_FIELDS) {
          if (existing[key] !== undefined && key in normalizedUpdates) {
            if (__DEV__) {
              console.warn(`[updatePlant] EDU-06 guard: dropped catalog-source ${key} update (existing user value preserved). Pass {fromUserEdit:true} to override.`);
            }
            delete normalizedUpdates[key];
          }
        }
      }
    }

    if (updates.databaseId) {
      const entry = getCatalogEntry(updates.databaseId);
      if (entry && entry.id !== updates.databaseId) {
        normalizedUpdates.databaseId = entry.id;
        if (__DEV__) {
          console.warn(`[updatePlant] aliased databaseId "${updates.databaseId}" → "${entry.id}"`);
        }
      }
    }
    const newPlants = dataRef.current.plants.map(p => p.id === id ? { ...p, ...normalizedUpdates } : p);
    setPlants(newPlants);
    dataRef.current.plants = newPlants;
    scheduleSave();
  }, [scheduleSave]);

  /**
   * v1.2 Phase 20 (FERT-06). Marks fertilization done — sets fertilizeSchedule.lastFertilized = today.
   * Bootstraps fertilizeSchedule from catalog entry if absent (uses fertilizeIntervalWarm as the
   * intervalDays default; cold-season-only catalogs fall through to no-op).
   *
   * fromUserEdit:true bypasses the Plan 20-01 deep-merge guard since the user explicitly tapped.
   * If the plant has no databaseId AND no existing fertilizeSchedule → no-op (custom plant without
   * a manual fertilize schedule has nothing to bootstrap from).
   */
  const fertilizePlant = useCallback((id: string) => {
    const plant = dataRef.current.plants.find(p => p.id === id);
    if (!plant) return;
    const today = formatDate(new Date());
    let nextSchedule: { intervalDays: number; lastFertilized: string } | null = null;
    if (plant.fertilizeSchedule?.intervalDays != null && plant.fertilizeSchedule.intervalDays > 0) {
      nextSchedule = { ...plant.fertilizeSchedule, lastFertilized: today };
    } else if (plant.databaseId) {
      const entry = getCatalogEntry(plant.databaseId);
      const warm = entry?.fertilizeIntervalWarm;
      if (typeof warm === 'number' && warm > 0) {
        nextSchedule = { intervalDays: warm, lastFertilized: today };
      }
    }
    if (!nextSchedule) return; // custom plant without manual schedule → no-op
    updatePlant(id, { fertilizeSchedule: nextSchedule }, { fromUserEdit: true });
  }, [updatePlant]);

  const addNote = useCallback((dateStr: string, note: Note) => {
    const cur = dataRef.current.notes;
    const newNotes = { ...cur, [dateStr]: [...(cur[dateStr] || []), note] };
    setNotes(newNotes);
    dataRef.current.notes = newNotes;
    scheduleSave();
  }, [scheduleSave]);

  const deleteNote = useCallback((dateStr: string, noteId: string) => {
    const cur = dataRef.current.notes;
    const newNotes = { ...cur, [dateStr]: (cur[dateStr] || []).filter(n => n.id !== noteId) };
    setNotes(newNotes);
    dataRef.current.notes = newNotes;
    scheduleSave();
  }, [scheduleSave]);

  const addReminder = useCallback((dateStr: string, reminder: Reminder) => {
    const cur = dataRef.current.reminders;
    const newReminders = { ...cur, [dateStr]: [...(cur[dateStr] || []), reminder] };
    setReminders(newReminders);
    dataRef.current.reminders = newReminders;
    scheduleSave();
  }, [scheduleSave]);

  const deleteReminder = useCallback((dateStr: string, reminderId: string) => {
    const cur = dataRef.current.reminders;
    const newReminders = { ...cur, [dateStr]: (cur[dateStr] || []).filter(r => r.id !== reminderId) };
    setReminders(newReminders);
    dataRef.current.reminders = newReminders;
    scheduleSave();
  }, [scheduleSave]);

  const updateReminder = useCallback((dateStr: string, reminderId: string, updates: Partial<Reminder>) => {
    const cur = dataRef.current.reminders;
    const dateReminders = cur[dateStr] || [];
    const newReminders = {
      ...cur,
      [dateStr]: dateReminders.map(r => r.id === reminderId ? { ...r, ...updates } : r)
    };
    setReminders(newReminders);
    dataRef.current.reminders = newReminders;
    scheduleSave();
  }, [scheduleSave]);

  // ─── Phase 21 (JOURNAL-03) — mirrors addNote/deleteNote at lines 476-490 ───
  const addJournalEntry = useCallback((plantId: string, entry: JournalEntry) => {
    const cur = dataRef.current.journals;
    const newJournals = { ...cur, [plantId]: [...(cur[plantId] || []), entry] };
    setJournals(newJournals);
    dataRef.current.journals = newJournals;
    scheduleSave();
  }, [scheduleSave]);

  const deleteJournalEntry = useCallback((plantId: string, entryId: string) => {
    const cur = dataRef.current.journals;
    const newJournals = { ...cur, [plantId]: (cur[plantId] || []).filter(e => e.id !== entryId) };
    setJournals(newJournals);
    dataRef.current.journals = newJournals;
    scheduleSave();
  }, [scheduleSave]);

  const updateLocation = useCallback((newLocation: Location | null) => {
    setLocation(newLocation);
    dataRef.current.location = newLocation;
    scheduleSave();
  }, [scheduleSave]);

  const completeOnboarding = useCallback(() => {
    if (__DEV__) console.log('[Storage] completeOnboarding called');
    setOnboardingCompleted(true);
    dataRef.current.onboardingCompleted = true;
    scheduleSave();
  }, [scheduleSave]);

  const completeOnboardingWithData = useCallback((newPlants: Plant[], newUserName: string | null) => {
    if (__DEV__) console.log('[Storage] completeOnboardingWithData called');
    const allPlants = [...dataRef.current.plants, ...newPlants];
    const finalUserName = newUserName ?? dataRef.current.userName;
    setPlants(allPlants);
    setUserNameState(finalUserName);
    setOnboardingCompleted(true);
    dataRef.current.plants = allPlants;
    dataRef.current.userName = finalUserName;
    dataRef.current.onboardingCompleted = true;
    scheduleSave();
  }, [scheduleSave]);

  const setUserName = useCallback((name: string | null) => {
    setUserNameState(name);
    dataRef.current.userName = name;
    scheduleSave();
  }, [scheduleSave]);

  const updateNotificationSettings = useCallback((settings: NotificationSettings) => {
    setNotificationSettings(settings);
    dataRef.current.notificationSettings = settings;
    scheduleSave();
  }, [scheduleSave]);

  const updatePlantNetApiKey = useCallback((key: string | null) => {
    setPlantNetApiKeyState(key);
    dataRef.current.plantNetApiKey = key;
    scheduleSave();
  }, [scheduleSave]);

  const incrementIdentificationCount = useCallback(() => {
    const newCount = dataRef.current.identificationCount + 1;
    setIdentificationCount(newCount);
    dataRef.current.identificationCount = newCount;
    scheduleSave();
  }, [scheduleSave]);

  const incrementDiagnosisCount = useCallback(() => {
    const newCount = dataRef.current.diagnosisCount + 1;
    setDiagnosisCount(newCount);
    dataRef.current.diagnosisCount = newCount;
    scheduleSave();
  }, [scheduleSave]);

  const addPhotoToPlant = useCallback((plantId: string, photo: PlantPhoto) => {
    const newPlants = dataRef.current.plants.map(p => {
      if (p.id !== plantId) return p;
      return { ...p, photos: [...(p.photos || []), photo] };
    });
    setPlants(newPlants);
    dataRef.current.plants = newPlants;
    scheduleSave();
  }, [scheduleSave]);

  const removePhotoFromPlant = useCallback((plantId: string, photoId: string) => {
    const newPlants = dataRef.current.plants.map(p => {
      if (p.id !== plantId) return p;
      return { ...p, photos: (p.photos || []).filter(ph => ph.id !== photoId) };
    });
    setPlants(newPlants);
    dataRef.current.plants = newPlants;
    scheduleSave();
  }, [scheduleSave]);

  const saveDiagnosis = useCallback((diagnosis: SavedDiagnosis) => {
    const withDefaults: SavedDiagnosis = {
      ...diagnosis,
      resolved: diagnosis.resolved ?? false,
      resolvedDate: diagnosis.resolvedDate ?? null,
    };
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[withDefaults.plantId] || [];
    const newHistory = {
      ...cur,
      [withDefaults.plantId]: [withDefaults, ...plantDiagnoses],
    };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const addChatMessage = useCallback((plantId: string, diagnosisId: string, message: DiagnosisChatMessage | DiagnosisChatMessage[]) => {
    const messages = Array.isArray(message) ? message : [message];
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId] || [];
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId ? { ...d, chat: [...d.chat, ...messages] } : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const getDiagnosesForPlant = useCallback((plantId: string): SavedDiagnosis[] => {
    return (dataRef.current.diagnosisHistory[plantId] || []).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  const resolveDiagnosis = useCallback((plantId: string, diagnosisId: string) => {
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId] || [];
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId
        ? {
            ...d,
            resolved: true,
            resolvedDate: formatDate(new Date()),
            ...(d.isTracked ? { previousStatus: d.trackingStatus, trackingStatus: 'resolved' as TrackingStatus } : {}),
          }
        : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const updateDiagnosis = useCallback((plantId: string, diagnosisId: string, updates: Partial<SavedDiagnosis>) => {
    // Phase 9 (DIAG-03 / RESEARCH §CF-4): generic merge action.
    // Used by reopen path to atomically set reopenedAt AND append system message in one state update.
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId];
    if (!plantDiagnoses) return; // no-op when plant has no history
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId ? { ...d, ...updates } : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const getActiveDiagnosesForPlant = useCallback((plantId: string): SavedDiagnosis[] => {
    return (dataRef.current.diagnosisHistory[plantId] || []).filter(d =>
      !d.resolved && d.result.overallStatus !== 'healthy'
    );
  }, []);

  const trackProblem = useCallback((plantId: string, diagnosisId: string, trackingStatus: TrackingStatus, followUpDate: string, notificationId: string | null, problemSummary: string) => {
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId] || [];
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId
        ? {
            ...d,
            isTracked: true,
            trackingStatus,
            followUpDate,
            followUpNotificationId: notificationId,
            problemSummary,
          }
        : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const resolveTrackedProblem = useCallback((plantId: string, diagnosisId: string) => {
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId] || [];
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId
        ? {
            ...d,
            resolved: true,
            resolvedDate: formatDate(new Date()),
            previousStatus: d.trackingStatus,
            trackingStatus: 'resolved' as TrackingStatus,
          }
        : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const reopenTrackedProblem = useCallback((plantId: string, diagnosisId: string) => {
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId] || [];
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId
        ? {
            ...d,
            resolved: false,
            resolvedDate: null,
            trackingStatus: d.previousStatus || 'needs_attention' as TrackingStatus,
          }
        : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const addFollowUpEntry = useCallback((plantId: string, diagnosisId: string, entry: ProblemEntry) => {
    const cur = dataRef.current.diagnosisHistory;
    const plantDiagnoses = cur[plantId] || [];
    const updatedDiagnoses = plantDiagnoses.map(d =>
      d.id === diagnosisId
        ? { ...d, entries: [...(d.entries || []), entry] }
        : d
    );
    const newHistory = { ...cur, [plantId]: updatedDiagnoses };
    setDiagnosisHistory(newHistory);
    dataRef.current.diagnosisHistory = newHistory;
    scheduleSave();
  }, [scheduleSave]);

  const addShoppingItem = useCallback((item: ShoppingItem) => {
    const newList = [...dataRef.current.shoppingList, item];
    setShoppingList(newList);
    dataRef.current.shoppingList = newList;
    scheduleSave();
  }, [scheduleSave]);

  const removeShoppingItem = useCallback((itemId: string) => {
    const newList = dataRef.current.shoppingList.filter(i => i.id !== itemId);
    setShoppingList(newList);
    dataRef.current.shoppingList = newList;
    scheduleSave();
  }, [scheduleSave]);

  const toggleShoppingItem = useCallback((itemId: string) => {
    const newList = dataRef.current.shoppingList.map(i =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );
    setShoppingList(newList);
    dataRef.current.shoppingList = newList;
    scheduleSave();
  }, [scheduleSave]);

  const clearCheckedShoppingItems = useCallback(() => {
    const newList = dataRef.current.shoppingList.filter(i => !i.checked);
    setShoppingList(newList);
    dataRef.current.shoppingList = newList;
    scheduleSave();
  }, [scheduleSave]);

  const acknowledgeMigrationReschedule = useCallback(() => {
    setMigrationJustHappened(false);
  }, []);

  const setClimateOverride = useCallback((override: ClimateOverride) => {
    setClimateOverrideState(override);
    dataRef.current.climateOverride = override;
    scheduleSave();
  }, [scheduleSave]);

  const value: StorageContextType = useMemo(() => ({
    plants,
    notes,
    reminders,
    location,
    onboardingCompleted,
    userName,
    notificationSettings,
    plantNetApiKey,
    installDate,
    identificationCount,
    diagnosisCount,
    diagnosisHistory,
    shoppingList,
    journals,
    climateOverride,
    loading,
    migrationFailed,
    migrationJustHappened,
    setPlants: handleSetPlants,
    addPlant,
    addPlants,
    deletePlant,
    updatePlant,
    fertilizePlant,
    addNote,
    deleteNote,
    addReminder,
    deleteReminder,
    updateReminder,
    addJournalEntry,
    deleteJournalEntry,
    updateLocation,
    completeOnboarding,
    completeOnboardingWithData,
    setUserName,
    updateNotificationSettings,
    updatePlantNetApiKey,
    incrementIdentificationCount,
    incrementDiagnosisCount,
    addPhotoToPlant,
    removePhotoFromPlant,
    saveDiagnosis,
    addChatMessage,
    getDiagnosesForPlant,
    resolveDiagnosis,
    updateDiagnosis,
    getActiveDiagnosesForPlant,
    trackProblem,
    resolveTrackedProblem,
    reopenTrackedProblem,
    addFollowUpEntry,
    addShoppingItem,
    removeShoppingItem,
    toggleShoppingItem,
    clearCheckedShoppingItems,
    acknowledgeMigrationReschedule,
    setClimateOverride,
  }), [
    plants, notes, reminders, location, onboardingCompleted, userName,
    notificationSettings, plantNetApiKey, installDate, identificationCount,
    diagnosisCount, diagnosisHistory, shoppingList,
    journals,
    climateOverride, loading,
    migrationFailed, migrationJustHappened,
    handleSetPlants, addPlant,
    addPlants, deletePlant, updatePlant, fertilizePlant, addNote, deleteNote, addReminder,
    deleteReminder, updateReminder, addJournalEntry, deleteJournalEntry, updateLocation, completeOnboarding,
    completeOnboardingWithData, setUserName, updateNotificationSettings,
    updatePlantNetApiKey, incrementIdentificationCount, incrementDiagnosisCount,
    addPhotoToPlant, removePhotoFromPlant, saveDiagnosis, addChatMessage,
    getDiagnosesForPlant, resolveDiagnosis, updateDiagnosis, getActiveDiagnosesForPlant,
    trackProblem, resolveTrackedProblem, reopenTrackedProblem, addFollowUpEntry,
    addShoppingItem, removeShoppingItem, toggleShoppingItem, clearCheckedShoppingItems,
    acknowledgeMigrationReschedule,
  ]);

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextType {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
