import * as Notifications from "expo-notifications";
import { Plant, WeatherData, NotificationSettings } from "../types";
import { getTasksForDay } from "./plantLogic";
import { PlantAlert } from "./plantAlerts";
import { formatDate } from "./dates";
import { getPlantFullInfo, getPlantsAtTempRisk, PlantFullInfo } from "./plantInfo";

// Constants for smart scheduling
const SUNRISE_OFFSET_MINUTES = 30; // Notify 30 min after sunrise
const SUNSET_OFFSET_MINUTES = 60;  // Notify 60 min before sunset
const HIGH_UV_THRESHOLD = 8;       // UV index considered dangerous
const MODERATE_UV_THRESHOLD = 5;   // UV index for warning

// Track if notifications are available (set to false on first error)
// Start as true and will be disabled on first error in Expo Go
let notificationsAvailable = true;

export function isNotificationsAvailable(): boolean {
  return notificationsAvailable;
}

function markNotificationsUnavailable(error: unknown) {
  if (!notificationsAvailable) return;
  notificationsAvailable = false;
  console.log("expo-notifications disabled:", error);
}

// Notification channel IDs
const MORNING_REMINDER_ID = "morning-reminder";
const WEATHER_ALERT_PREFIX = "weather-alert-";
const CARE_REMINDER_PREFIX = "care-reminder-";

/**
 * Parses a time string "HH:MM" to hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours: hours || 8, minutes: minutes || 0 };
}

/**
 * Creates the morning reminder notification content
 */
function createMorningContent(
  plants: Plant[],
  weather: WeatherData | null
): { title: string; body: string } {
  const today = new Date();
  const tasks = getTasksForDay(plants, today);

  const waterTasks = tasks.filter((t) => t.type === "water");
  const sunTasks = tasks.filter((t) => t.type === "sun");
  const outdoorTasks = tasks.filter((t) => t.type === "outdoor");

  let body = "";

  if (tasks.length === 0) {
    body = "Tus plantas estan bien por hoy. Disfrutá el dia!";
  } else {
    const parts: string[] = [];

    if (waterTasks.length > 0) {
      const plantNames = waterTasks
        .map((t) => {
          const plant = plants.find((p) => p.id === t.plantId);
          return plant?.name || "";
        })
        .filter(Boolean);
      if (plantNames.length <= 2) {
        parts.push(`regar ${plantNames.join(" y ")}`);
      } else {
        parts.push(`regar ${plantNames.length} plantas`);
      }
    }

    if (sunTasks.length > 0) {
      const plantNames = sunTasks
        .map((t) => {
          const plant = plants.find((p) => p.id === t.plantId);
          return plant?.name || "";
        })
        .filter(Boolean);
      if (plantNames.length <= 2) {
        parts.push(`sol para ${plantNames.join(" y ")}`);
      } else {
        parts.push(`sol para ${plantNames.length} plantas`);
      }
    }

    if (outdoorTasks.length > 0) {
      parts.push(
        outdoorTasks.length === 1
          ? `sacar 1 planta`
          : `sacar ${outdoorTasks.length} plantas`
      );
    }

    body = `Hoy: ${parts.join(", ")}.`;
  }

  // Add weather info if available
  if (weather && weather.current) {
    const temp = Math.round(weather.current.temperature);
    body += ` Ahora hace ${temp}°C.`;
  }

  return {
    title: "Buenos dias!",
    body,
  };
}

/**
 * Schedules the daily morning reminder notification
 */
export async function scheduleMorningReminder(
  time: string,
  plants: Plant[],
  weather: WeatherData | null
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  try {
    // Cancel any existing morning reminder
    await cancelMorningReminder();

    const { hours, minutes } = parseTime(time);
    const { title, body } = createMorningContent(plants, weather);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

/**
 * Cancels the morning reminder notification
 */
export async function cancelMorningReminder(): Promise<void> {
  if (!notificationsAvailable) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const morningNotifications = scheduled.filter(
      (n) => n.identifier === MORNING_REMINDER_ID || n.content.title === "Buenos dias!"
    );

    for (const notification of morningNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}

/**
 * Schedules a weather alert notification
 */
export async function scheduleWeatherAlert(
  alert: PlantAlert,
  triggerDate: Date
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  try {
    const now = new Date();
    const timeDiff = triggerDate.getTime() - now.getTime();

    // Don't schedule if the trigger date is in the past
    if (timeDiff <= 0) return null;

    const seconds = Math.floor(timeDiff / 1000);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${alert.plantIcon} ${alert.title}`,
        body: alert.message,
        sound: true,
        priority:
          alert.severity === "danger"
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: "weather-alert",
          alertType: alert.type,
          plantId: alert.plantId,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

/**
 * Schedules a care reminder for a specific plant
 * (e.g., "No te olvides de regar tu Monstera")
 */
export async function scheduleCareReminder(
  plant: Plant,
  lastWateredDaysAgo: number,
  triggerDate: Date
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  try {
    const now = new Date();
    const timeDiff = triggerDate.getTime() - now.getTime();

    // Don't schedule if the trigger date is in the past
    if (timeDiff <= 0) return null;

    const seconds = Math.floor(timeDiff / 1000);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${plant.icon} Recordatorio de riego`,
        body: `No te olvides de regar tu ${plant.name} (lleva ${lastWateredDaysAgo} dias).`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        data: {
          type: "care-reminder",
          plantId: plant.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

/**
 * Cancels all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (!notificationsAvailable) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}

/**
 * Cancels all weather alert notifications
 */
export async function cancelWeatherAlerts(): Promise<void> {
  if (!notificationsAvailable) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const weatherAlerts = scheduled.filter(
      (n) => n.content.data?.type === "weather-alert"
    );

    for (const notification of weatherAlerts) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}

/**
 * Cancels all care reminder notifications
 */
export async function cancelCareReminders(): Promise<void> {
  if (!notificationsAvailable) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const careReminders = scheduled.filter(
      (n) => n.content.data?.type === "care-reminder"
    );

    for (const notification of careReminders) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}

/**
 * Gets the count of scheduled notifications by type
 */
export async function getScheduledNotificationCounts(): Promise<{
  morning: number;
  weatherAlerts: number;
  careReminders: number;
  total: number;
}> {
  if (!notificationsAvailable) {
    return { morning: 0, weatherAlerts: 0, careReminders: 0, total: 0 };
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const morning = scheduled.filter(
      (n) => n.content.title === "Buenos dias!"
    ).length;
    const weatherAlerts = scheduled.filter(
      (n) => n.content.data?.type === "weather-alert"
    ).length;
    const careReminders = scheduled.filter(
      (n) => n.content.data?.type === "care-reminder"
    ).length;

    return {
      morning,
      weatherAlerts,
      careReminders,
      total: scheduled.length,
    };
  } catch (error) {
    markNotificationsUnavailable(error);
    return { morning: 0, weatherAlerts: 0, careReminders: 0, total: 0 };
  }
}

/**
 * Sends an immediate test notification
 */
export async function sendTestNotification(): Promise<void> {
  if (!notificationsAvailable) {
    console.log("Notifications not available in Expo Go");
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Mi Jardin",
        body: "Las notificaciones estan funcionando correctamente!",
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}

/**
 * Parses an ISO datetime string and returns a Date object
 */
function parseISODateTime(isoString: string): Date | null {
  try {
    return new Date(isoString);
  } catch {
    return null;
  }
}

/**
 * Gets plants that need outdoor time today and haven't completed it
 */
function getPlantsNeedingOutdoor(plants: Plant[]): Plant[] {
  const today = new Date();
  const todayStr = formatDate(today);
  const dayOfWeek = today.getDay();

  return plants.filter((p) =>
    p.outdoorDays.includes(dayOfWeek) &&
    p.outdoorDoneDate !== todayStr
  );
}

/**
 * Gets plants that need sun today and haven't completed it
 */
function getPlantsNeedingSun(plants: Plant[]): Plant[] {
  const today = new Date();
  const todayStr = formatDate(today);
  const dayOfWeek = today.getDay();

  return plants.filter((p) =>
    p.sunDays.includes(dayOfWeek) &&
    p.sunDoneDate !== todayStr
  );
}

/**
 * Calculates optimal sun window based on plant's sunHours needs
 */
function calculateSunWindow(
  plant: Plant,
  sunrise: Date,
  sunset: Date
): { start: Date; end: Date } {
  // Start 30 min after sunrise
  const start = new Date(sunrise.getTime() + SUNRISE_OFFSET_MINUTES * 60 * 1000);

  // End after plant gets its required sun hours
  const sunHoursMs = plant.sunHours * 60 * 60 * 1000;
  let end = new Date(start.getTime() + sunHoursMs);

  // But don't go past sunset
  const maxEnd = new Date(sunset.getTime() - 30 * 60 * 1000); // 30 min before sunset
  if (end > maxEnd) {
    end = maxEnd;
  }

  return { start, end };
}

/**
 * Groups plants by similar sun hour requirements
 */
function groupPlantsBySunHours(plants: Plant[]): Map<number, Plant[]> {
  const groups = new Map<number, Plant[]>();

  plants.forEach((plant) => {
    // Round to nearest hour for grouping
    const hours = Math.round(plant.sunHours);
    const group = groups.get(hours) || [];
    group.push(plant);
    groups.set(hours, group);
  });

  return groups;
}

/**
 * Schedules smart notifications based on each plant's sun requirements
 */
export async function scheduleSunriseNotification(
  plants: Plant[],
  weather: WeatherData
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  const today = weather.daily[0];
  if (!today?.sunrise || !today?.sunset) return null;

  const outdoorPlants = getPlantsNeedingOutdoor(plants);
  if (outdoorPlants.length === 0) return null;

  try {
    const sunriseTime = parseISODateTime(today.sunrise);
    const sunsetTime = parseISODateTime(today.sunset);
    if (!sunriseTime || !sunsetTime) return null;

    // Schedule for SUNRISE_OFFSET_MINUTES after sunrise
    const notifyTime = new Date(sunriseTime.getTime() + SUNRISE_OFFSET_MINUTES * 60 * 1000);

    // Don't schedule if time has passed
    if (notifyTime <= new Date()) return null;

    const timeDiff = notifyTime.getTime() - Date.now();
    const seconds = Math.floor(timeDiff / 1000);

    // Group plants by sun hour needs to give specific advice
    const groups = groupPlantsBySunHours(outdoorPlants);
    let bodyParts: string[] = [];

    groups.forEach((groupPlants, hours) => {
      const names = groupPlants.length <= 2
        ? groupPlants.map(p => p.name).join(" y ")
        : `${groupPlants.length} plantas`;

      const window = calculateSunWindow(groupPlants[0], sunriseTime, sunsetTime);
      const endTime = window.end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      bodyParts.push(`${names} (${hours}hs sol, hasta ~${endTime})`);
    });

    const sunriseHour = sunriseTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const body = `Sol desde ${sunriseHour}. Sacá: ${bodyParts.join("; ")}`;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌅 Hora de sacar las plantas!",
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: "sunrise-reminder", plantIds: outdoorPlants.map(p => p.id) },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

/**
 * Schedules individual "bring inside" notifications based on each plant's sun hours
 */
export async function scheduleSunsetNotification(
  plants: Plant[],
  weather: WeatherData
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  const today = weather.daily[0];
  if (!today?.sunrise || !today?.sunset) return null;

  const outdoorPlants = getPlantsNeedingOutdoor(plants);
  if (outdoorPlants.length === 0) return null;

  try {
    const sunriseTime = parseISODateTime(today.sunrise);
    const sunsetTime = parseISODateTime(today.sunset);
    if (!sunriseTime || !sunsetTime) return null;

    // Group plants by their "bring inside" time
    const plantsByEndTime = new Map<number, Plant[]>();

    outdoorPlants.forEach((plant) => {
      const window = calculateSunWindow(plant, sunriseTime, sunsetTime);
      // Round to 15-minute intervals for grouping
      const endTimeKey = Math.round(window.end.getTime() / (15 * 60 * 1000));
      const group = plantsByEndTime.get(endTimeKey) || [];
      group.push(plant);
      plantsByEndTime.set(endTimeKey, group);
    });

    // Schedule notification for the earliest group (most restrictive)
    const sortedKeys = Array.from(plantsByEndTime.keys()).sort((a, b) => a - b);
    if (sortedKeys.length === 0) return null;

    const earliestKey = sortedKeys[0];
    const earliestPlants = plantsByEndTime.get(earliestKey) || [];
    const notifyTime = new Date(earliestKey * 15 * 60 * 1000);

    // Don't schedule if time has passed
    if (notifyTime <= new Date()) return null;

    const timeDiff = notifyTime.getTime() - Date.now();
    const seconds = Math.floor(timeDiff / 1000);

    const plantNames = earliestPlants.length <= 2
      ? earliestPlants.map(p => `${p.icon} ${p.name}`).join(" y ")
      : `${earliestPlants.length} plantas`;

    const endHour = notifyTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    let body = `${plantNames} ya tuvieron sus horas de sol.`;

    // If there are more plants later, mention them
    if (sortedKeys.length > 1) {
      const laterPlants = sortedKeys.slice(1).reduce((acc, key) =>
        acc + (plantsByEndTime.get(key)?.length || 0), 0
      );
      if (laterPlants > 0) {
        body += ` Otras ${laterPlants} pueden quedarse más.`;
      }
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌿 Hora de guardar plantas",
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        data: { type: "sunset-reminder", plantIds: earliestPlants.map(p => p.id) },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

/**
 * Schedules UV warning notification based on plants' sensitivity
 */
export async function scheduleUVWarning(
  plants: Plant[],
  weather: WeatherData
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  const today = weather.daily[0];
  if (!today?.uvIndexMax || today.uvIndexMax < MODERATE_UV_THRESHOLD) return null;

  // Plants that need sun today and haven't gotten it yet
  const sunPlants = getPlantsNeedingSun(plants);
  if (sunPlants.length === 0) return null;

  // Find plants that need few sun hours (more sensitive)
  const sensitivePlants = sunPlants.filter(p => p.sunHours <= 3);
  const hardyPlants = sunPlants.filter(p => p.sunHours > 3);

  try {
    // Schedule for 11:00 AM (when UV is typically starting to peak)
    const now = new Date();
    const notifyTime = new Date(now);
    notifyTime.setHours(11, 0, 0, 0);

    // Don't schedule if time has passed
    if (notifyTime <= now) return null;

    const timeDiff = notifyTime.getTime() - now.getTime();
    const seconds = Math.floor(timeDiff / 1000);

    const isHigh = today.uvIndexMax >= HIGH_UV_THRESHOLD;
    let title: string;
    let body: string;

    if (isHigh && sensitivePlants.length > 0) {
      const names = sensitivePlants.length <= 2
        ? sensitivePlants.map(p => p.name).join(" y ")
        : `${sensitivePlants.length} plantas`;
      title = "☀️ UV peligroso para tus plantas!";
      body = `UV de ${today.uvIndexMax}. ${names} son sensibles - evitá sol directo entre 12-16hs.`;
    } else if (isHigh) {
      title = "☀️ UV muy alto hoy";
      body = `Indice UV de ${today.uvIndexMax}. Sol intenso entre 12-16hs.`;
    } else {
      title = "⚠️ UV moderado-alto";
      body = `Indice UV de ${today.uvIndexMax}. Tus plantas pueden tomar sol pero vigilalas.`;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: isHigh
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: "uv-warning",
          uvIndex: today.uvIndexMax,
          sensitivePlantIds: sensitivePlants.map(p => p.id),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}

/**
 * Schedules all smart sun-based notifications for the day
 */
export async function scheduleSmartSunNotifications(
  plants: Plant[],
  weather: WeatherData | null
): Promise<void> {
  if (!notificationsAvailable || !weather) return;

  // Cancel any existing sun notifications first
  await cancelSunNotifications();

  // Schedule sunrise notification (for putting plants outside)
  await scheduleSunriseNotification(plants, weather);

  // Schedule sunset notification (for bringing plants inside)
  await scheduleSunsetNotification(plants, weather);

  // Schedule UV warning if needed
  await scheduleUVWarning(plants, weather);

  // Schedule temperature warning based on each plant's tolerance
  await scheduleTemperatureWarning(plants, weather);
}

/**
 * Cancels all sun-related notifications
 */
export async function cancelSunNotifications(): Promise<void> {
  if (!notificationsAvailable) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const sunNotifications = scheduled.filter((n) =>
      n.content.data?.type === "sunrise-reminder" ||
      n.content.data?.type === "sunset-reminder" ||
      n.content.data?.type === "uv-warning" ||
      n.content.data?.type === "temp-warning"
    );

    for (const notification of sunNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    markNotificationsUnavailable(error);
  }
}

/**
 * Schedules temperature warning based on each plant's tolerance
 */
export async function scheduleTemperatureWarning(
  plants: Plant[],
  weather: WeatherData
): Promise<string | null> {
  if (!notificationsAvailable || plants.length === 0) return null;

  const today = weather.daily[0];
  if (!today) return null;

  const currentTemp = weather.current.temperature;
  const { cold, heat } = getPlantsAtTempRisk(
    plants,
    currentTemp,
    today.tempMin,
    today.tempMax
  );

  // No plants at risk
  if (cold.length === 0 && heat.length === 0) return null;

  try {
    // Schedule for early morning (7:00 AM) for cold warnings
    // or mid-day (12:00) for heat warnings
    const now = new Date();
    const notifyTime = new Date(now);

    let title: string;
    let body: string;
    let priority: Notifications.AndroidNotificationPriority;

    if (cold.length > 0) {
      notifyTime.setHours(7, 0, 0, 0);

      const plantNames = cold.length <= 2
        ? cold.map(p => p.plant.name).join(" y ")
        : `${cold.length} plantas`;

      const coldestTolerance = Math.max(...cold.map(p => p.tempMin));

      title = "🥶 Alerta de frío para tus plantas";
      body = `Mínima de ${today.tempMin}°C. ${plantNames} no toleran menos de ${coldestTolerance}°C - protegelás!`;
      priority = Notifications.AndroidNotificationPriority.MAX;
    } else {
      notifyTime.setHours(12, 0, 0, 0);

      const plantNames = heat.length <= 2
        ? heat.map(p => p.plant.name).join(" y ")
        : `${heat.length} plantas`;

      const lowestTolerance = Math.min(...heat.map(p => p.tempMax));

      title = "🔥 Alerta de calor para tus plantas";
      body = `Máxima de ${today.tempMax}°C. ${plantNames} sufren sobre ${lowestTolerance}°C - dalas sombra y agua extra.`;
      priority = Notifications.AndroidNotificationPriority.HIGH;
    }

    // Don't schedule if time has passed
    if (notifyTime <= now) return null;

    const timeDiff = notifyTime.getTime() - now.getTime();
    const seconds = Math.floor(timeDiff / 1000);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority,
        data: {
          type: "temp-warning",
          coldPlantIds: cold.map(p => p.plant.id),
          heatPlantIds: heat.map(p => p.plant.id),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return identifier;
  } catch (error) {
    markNotificationsUnavailable(error);
    return null;
  }
}
