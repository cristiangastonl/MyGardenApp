import { useState, useEffect, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { Plant, WeatherData, NotificationSettings } from "../types";
import { PlantAlert } from "../utils/plantAlerts";
import {
  scheduleMorningReminder,
  cancelMorningReminder,
  scheduleWeatherAlert,
  cancelWeatherAlerts,
  cancelAllNotifications,
  sendTestNotification,
  getScheduledNotificationCounts,
  isNotificationsAvailable,
  scheduleSmartSunNotifications,
} from "../utils/notificationScheduler";

// Configure how notifications are handled when app is in foreground
// Wrapped in try-catch for Expo Go compatibility (SDK 53+)
try {
  if (isNotificationsAvailable()) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  console.log("Notifications not available (Expo Go):", error);
}

export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface NotificationCounts {
  morning: number;
  weatherAlerts: number;
  careReminders: number;
  total: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  morningReminder: true,
  morningTime: "08:00",
  weatherAlerts: true,
  careReminders: true,
};

interface UseNotificationsOptions {
  settings: NotificationSettings | null;
  onSettingsChange: (settings: NotificationSettings) => void;
  plants: Plant[];
  weather: WeatherData | null;
  alerts: PlantAlert[];
}

interface UseNotificationsReturn {
  // State
  permissionStatus: PermissionStatus;
  isRequesting: boolean;
  settings: NotificationSettings;
  scheduledCounts: NotificationCounts;

  // Actions
  requestPermission: () => Promise<boolean>;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  sendTest: () => Promise<void>;
  refreshScheduled: () => Promise<void>;
}

export function useNotifications({
  settings: storedSettings,
  onSettingsChange,
  plants,
  weather,
  alerts,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [isRequesting, setIsRequesting] = useState(false);
  const [scheduledCounts, setScheduledCounts] = useState<NotificationCounts>({
    morning: 0,
    weatherAlerts: 0,
    careReminders: 0,
    total: 0,
  });

  // Use stored settings or defaults
  const settings = storedSettings || DEFAULT_SETTINGS;

  // Refs for listeners
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Check permission status on mount
  useEffect(() => {
    if (!isNotificationsAvailable()) return;

    const init = async () => {
      await checkPermissionStatus();
      await refreshScheduledImpl();
    };
    init();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    if (!isNotificationsAvailable()) return;

    try {
      // Listener for notifications received while app is foregrounded
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

      // Listener for when user taps on notification
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("Notification response:", response);
          // Could navigate to specific screen based on notification data
          const data = response.notification.request.content.data;
          if (data?.type === "weather-alert" && data?.plantId) {
            // Could emit event to navigate to plant detail
          }
        });
    } catch (error) {
      console.log("Could not set up notification listeners:", error);
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Reschedule morning reminder when settings or plants change
  useEffect(() => {
    if (settings.enabled && settings.morningReminder && plants.length > 0) {
      scheduleMorningReminder(settings.morningTime, plants, weather);
      refreshScheduled();
    }
  }, [
    settings.enabled,
    settings.morningReminder,
    settings.morningTime,
    plants.length,
  ]);

  // Schedule weather alerts when they change
  useEffect(() => {
    if (settings.enabled && settings.weatherAlerts && alerts.length > 0) {
      scheduleWeatherAlerts();
    }
  }, [settings.enabled, settings.weatherAlerts, alerts]);

  // Schedule smart sun notifications based on sunrise/sunset
  useEffect(() => {
    if (settings.enabled && weather && plants.length > 0) {
      scheduleSmartSunNotifications(plants, weather);
    }
  }, [settings.enabled, weather, plants.length]);

  const checkPermissionStatus = async () => {
    if (!isNotificationsAvailable()) return;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.log("Notifications not available:", error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isNotificationsAvailable()) {
      console.log("Notifications not available in Expo Go");
      return false;
    }

    setIsRequesting(true);
    try {
      // Check if this is a physical device (required for push notifications)
      if (!Device.isDevice) {
        console.log("Push notifications only work on physical devices");
        // For simulator/emulator, we can still use local notifications
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus === "granted") {
        // Configure notification channel for Android
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Mi Jardin",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#5b9a6a",
          });
        }
        return true;
      }

      return false;
    } catch (error) {
      console.log("Error requesting permission:", error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const updateSettings = useCallback(
    (updates: Partial<NotificationSettings>) => {
      const newSettings = { ...settings, ...updates };
      onSettingsChange(newSettings);

      // Handle specific setting changes
      if (updates.enabled === false) {
        // Disable all notifications
        cancelAllNotifications();
        setScheduledCounts({
          morning: 0,
          weatherAlerts: 0,
          careReminders: 0,
          total: 0,
        });
      } else if (updates.morningReminder === false) {
        cancelMorningReminder();
        refreshScheduled();
      } else if (updates.weatherAlerts === false) {
        cancelWeatherAlerts();
        refreshScheduled();
      }
    },
    [settings, onSettingsChange]
  );

  const enableNotifications = async (): Promise<boolean> => {
    const granted = await requestPermission();

    if (granted) {
      updateSettings({ enabled: true });

      // Schedule morning reminder if enabled
      if (settings.morningReminder && plants.length > 0) {
        await scheduleMorningReminder(settings.morningTime, plants, weather);
      }

      // Schedule weather alerts if enabled
      if (settings.weatherAlerts && alerts.length > 0) {
        await scheduleWeatherAlerts();
      }

      await refreshScheduled();
      return true;
    }

    return false;
  };

  const disableNotifications = async (): Promise<void> => {
    updateSettings({ enabled: false });
    await cancelAllNotifications();
    setScheduledCounts({
      morning: 0,
      weatherAlerts: 0,
      careReminders: 0,
      total: 0,
    });
  };

  const scheduleWeatherAlerts = async () => {
    // Cancel existing weather alerts first
    await cancelWeatherAlerts();

    // Schedule new alerts for tomorrow morning (8:00 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    // Only schedule danger and warning alerts
    const importantAlerts = alerts.filter(
      (a) => a.severity === "danger" || a.severity === "warning"
    );

    for (const alert of importantAlerts) {
      await scheduleWeatherAlert(alert, tomorrow);
    }
  };

  const sendTest = async (): Promise<void> => {
    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await sendTestNotification();
  };

  const refreshScheduledImpl = async (): Promise<void> => {
    const counts = await getScheduledNotificationCounts();
    setScheduledCounts(counts);
  };

  const refreshScheduled = refreshScheduledImpl;

  return {
    permissionStatus,
    isRequesting,
    settings,
    scheduledCounts,
    requestPermission,
    updateSettings,
    enableNotifications,
    disableNotifications,
    sendTest,
    refreshScheduled,
  };
}
