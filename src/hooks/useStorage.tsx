import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, PlantPhoto, Note, Reminder, Location, AppData, NotificationSettings } from '../types';
import { STORAGE_KEY } from '../data/constants';
import { formatDate } from '../utils/dates';

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
  loading: boolean;
}

interface StorageActions {
  setPlants: (plants: Plant[]) => void;
  addPlant: (plant: Plant) => void;
  addPlants: (plants: Plant[]) => void;
  deletePlant: (id: string) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  addNote: (dateStr: string, note: Note) => void;
  deleteNote: (dateStr: string, noteId: string) => void;
  addReminder: (dateStr: string, reminder: Reminder) => void;
  deleteReminder: (dateStr: string, reminderId: string) => void;
  updateReminder: (dateStr: string, reminderId: string, updates: Partial<Reminder>) => void;
  updateLocation: (location: Location | null) => void;
  completeOnboarding: () => void;
  completeOnboardingWithData: (plants: Plant[], userName: string | null) => void;
  setUserName: (name: string | null) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  updatePlantNetApiKey: (key: string | null) => void;
  incrementIdentificationCount: () => void;
  addPhotoToPlant: (plantId: string, photo: PlantPhoto) => void;
  removePhotoFromPlant: (plantId: string, photoId: string) => void;
}

type StorageContextType = StorageState & StorageActions;

const StorageContext = createContext<StorageContextType | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

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
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data: AppData = JSON.parse(stored);
          setPlants(data.plants || []);
          setNotes(data.notes || {});
          setReminders(data.reminders || {});
          setLocation(data.location || null);
          setOnboardingCompleted(data.onboardingCompleted || false);
          setUserNameState(data.userName || null);
          setNotificationSettings(data.notificationSettings || null);
          setPlantNetApiKeyState(data.plantNetApiKey || null);
          setIdentificationCount(data.identificationCount || 0);
          // Use stored install date, or set today as install date for existing users
          const effectiveInstallDate = data.installDate || formatDate(new Date());
          setInstallDate(effectiveInstallDate);
        } else {
          // Brand new user — set install date now
          setInstallDate(formatDate(new Date()));
        }
      } catch (e) {
        console.log('No saved data:', e);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // Save all data
  const saveAll = useCallback(async (
    newPlants: Plant[],
    newNotes: Record<string, Note[]>,
    newReminders: Record<string, Reminder[]>,
    newLocation: Location | null,
    newOnboardingCompleted: boolean,
    newUserName: string | null,
    newNotificationSettings: NotificationSettings | null,
    newPlantNetApiKey: string | null,
    newInstallDate: string | null = null,
    newIdentificationCount: number = 0
  ) => {
    const data: AppData = {
      plants: newPlants,
      notes: newNotes,
      reminders: newReminders,
      location: newLocation,
      onboardingCompleted: newOnboardingCompleted,
      userName: newUserName,
      notificationSettings: newNotificationSettings,
      plantNetApiKey: newPlantNetApiKey,
      installDate: newInstallDate,
      identificationCount: newIdentificationCount,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Save error:', e);
    }
  }, []);

  const handleSetPlants = useCallback((newPlants: Plant[]) => {
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const addPlant = useCallback((plant: Plant) => {
    const newPlants = [...plants, plant];
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const addPlants = useCallback((newPlantsToAdd: Plant[]) => {
    const newPlants = [...plants, ...newPlantsToAdd];
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const deletePlant = useCallback((id: string) => {
    const newPlants = plants.filter(p => p.id !== id);
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
    const newPlants = plants.map(p => p.id === id ? { ...p, ...updates } : p);
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const addNote = useCallback((dateStr: string, note: Note) => {
    const newNotes = { ...notes, [dateStr]: [...(notes[dateStr] || []), note] };
    setNotes(newNotes);
    saveAll(plants, newNotes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const deleteNote = useCallback((dateStr: string, noteId: string) => {
    const newNotes = { ...notes, [dateStr]: (notes[dateStr] || []).filter(n => n.id !== noteId) };
    setNotes(newNotes);
    saveAll(plants, newNotes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const addReminder = useCallback((dateStr: string, reminder: Reminder) => {
    const newReminders = { ...reminders, [dateStr]: [...(reminders[dateStr] || []), reminder] };
    setReminders(newReminders);
    saveAll(plants, notes, newReminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const deleteReminder = useCallback((dateStr: string, reminderId: string) => {
    const newReminders = { ...reminders, [dateStr]: (reminders[dateStr] || []).filter(r => r.id !== reminderId) };
    setReminders(newReminders);
    saveAll(plants, notes, newReminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const updateReminder = useCallback((dateStr: string, reminderId: string, updates: Partial<Reminder>) => {
    const dateReminders = reminders[dateStr] || [];
    const newReminders = {
      ...reminders,
      [dateStr]: dateReminders.map(r => r.id === reminderId ? { ...r, ...updates } : r)
    };
    setReminders(newReminders);
    saveAll(plants, notes, newReminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const updateLocation = useCallback((newLocation: Location | null) => {
    setLocation(newLocation);
    saveAll(plants, notes, reminders, newLocation, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const completeOnboarding = useCallback(() => {
    console.log('[Storage] completeOnboarding called');
    setOnboardingCompleted(true);
    saveAll(plants, notes, reminders, location, true, userName, notificationSettings, plantNetApiKey, installDate, identificationCount)
      .then(() => console.log('[Storage] Onboarding saved successfully'))
      .catch(e => console.error('[Storage] Error saving onboarding:', e));
  }, [plants, notes, reminders, location, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  // Atomic onboarding completion: saves plants, userName, and onboardingCompleted in one write
  const completeOnboardingWithData = useCallback((newPlants: Plant[], newUserName: string | null) => {
    console.log('[Storage] completeOnboardingWithData called');
    const allPlants = [...plants, ...newPlants];
    const finalUserName = newUserName ?? userName;
    setPlants(allPlants);
    setUserNameState(finalUserName);
    setOnboardingCompleted(true);
    saveAll(allPlants, notes, reminders, location, true, finalUserName, notificationSettings, plantNetApiKey, installDate, identificationCount)
      .then(() => console.log('[Storage] Onboarding saved successfully'))
      .catch(e => console.error('[Storage] Error saving onboarding:', e));
  }, [plants, notes, reminders, location, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const setUserName = useCallback((name: string | null) => {
    setUserNameState(name);
    saveAll(plants, notes, reminders, location, onboardingCompleted, name, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const updateNotificationSettings = useCallback((settings: NotificationSettings) => {
    setNotificationSettings(settings);
    saveAll(plants, notes, reminders, location, onboardingCompleted, userName, settings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, plantNetApiKey, saveAll]);

  const updatePlantNetApiKey = useCallback((key: string | null) => {
    setPlantNetApiKeyState(key);
    saveAll(plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, key, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, saveAll]);

  const incrementIdentificationCount = useCallback(() => {
    const newCount = identificationCount + 1;
    setIdentificationCount(newCount);
    saveAll(plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, newCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const addPhotoToPlant = useCallback((plantId: string, photo: PlantPhoto) => {
    const newPlants = plants.map(p => {
      if (p.id !== plantId) return p;
      return { ...p, photos: [...(p.photos || []), photo] };
    });
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const removePhotoFromPlant = useCallback((plantId: string, photoId: string) => {
    const newPlants = plants.map(p => {
      if (p.id !== plantId) return p;
      return { ...p, photos: (p.photos || []).filter(ph => ph.id !== photoId) };
    });
    setPlants(newPlants);
    saveAll(newPlants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount);
  }, [plants, notes, reminders, location, onboardingCompleted, userName, notificationSettings, plantNetApiKey, installDate, identificationCount, saveAll]);

  const value: StorageContextType = {
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
    loading,
    setPlants: handleSetPlants,
    addPlant,
    addPlants,
    deletePlant,
    updatePlant,
    addNote,
    deleteNote,
    addReminder,
    deleteReminder,
    updateReminder,
    updateLocation,
    completeOnboarding,
    completeOnboardingWithData,
    setUserName,
    updateNotificationSettings,
    updatePlantNetApiKey,
    incrementIdentificationCount,
    addPhotoToPlant,
    removePhotoFromPlant,
  };

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
