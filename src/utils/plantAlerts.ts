import { Plant, WeatherData } from "../types";
import { getPlantById } from "../data/plantDatabase";

export interface PlantAlert {
  plantId: string;
  plantName: string;
  plantIcon: string;
  type: "cold" | "heat" | "rain" | "wind";
  severity: "danger" | "warning" | "info";
  title: string;
  message: string;
}

interface AlertConfig {
  type: PlantAlert["type"];
  severity: PlantAlert["severity"];
  title: string;
  message: string;
}

/**
 * Generates personalized weather alerts for each plant based on its
 * temperature tolerances from the plant database.
 */
export function generatePlantAlerts(
  plants: Plant[],
  weather: WeatherData | null
): PlantAlert[] {
  if (!weather || plants.length === 0) return [];

  const alerts: PlantAlert[] = [];
  const { current, daily } = weather;
  const tomorrowForecast = daily[1];

  // For each plant, check if weather conditions are outside their tolerance
  plants.forEach((plant) => {
    const plantInfo = getPlantById(plant.typeId);
    if (!plantInfo) return;

    const { tempMin, tempMax } = plantInfo;

    // Check tomorrow's minimum temperature against plant's cold tolerance
    if (tomorrowForecast && tomorrowForecast.tempMin < tempMin) {
      const alertConfig = getColdAlertConfig(
        plant.name,
        tempMin,
        tomorrowForecast.tempMin
      );
      alerts.push({
        plantId: plant.id,
        plantName: plant.name,
        plantIcon: plant.icon,
        ...alertConfig,
      });
    }

    // Check tomorrow's maximum temperature against plant's heat tolerance
    if (tomorrowForecast && tomorrowForecast.tempMax > tempMax) {
      const alertConfig = getHeatAlertConfig(
        plant.name,
        tempMax,
        tomorrowForecast.tempMax
      );
      alerts.push({
        plantId: plant.id,
        plantName: plant.name,
        plantIcon: plant.icon,
        ...alertConfig,
      });
    }

    // Check current temperature extremes for immediate alerts
    if (current.temperature < tempMin) {
      alerts.push({
        plantId: plant.id,
        plantName: plant.name,
        plantIcon: plant.icon,
        type: "cold",
        severity: "danger",
        title: `${plant.name} en riesgo`,
        message: `Ahora hay ${Math.round(current.temperature)}°C. Tu ${plant.name.toLowerCase()} no tolera menos de ${tempMin}°C.`,
      });
    }

    if (current.temperature > tempMax) {
      alerts.push({
        plantId: plant.id,
        plantName: plant.name,
        plantIcon: plant.icon,
        type: "heat",
        severity: "danger",
        title: `${plant.name} en riesgo`,
        message: `Ahora hay ${Math.round(current.temperature)}°C. Tu ${plant.name.toLowerCase()} sufre con mas de ${tempMax}°C.`,
      });
    }
  });

  // Check wind alerts for outdoor plants
  if (current.windSpeed > 40) {
    const outdoorPlants = plants.filter((p) => p.outdoorDays.length > 0);
    outdoorPlants.forEach((plant) => {
      alerts.push({
        plantId: plant.id,
        plantName: plant.name,
        plantIcon: plant.icon,
        type: "wind",
        severity: "warning",
        title: "Viento fuerte",
        message: `Protege tu ${plant.name.toLowerCase()} de las rafagas de ${Math.round(current.windSpeed)} km/h.`,
      });
    });
  }

  // Sort by severity (danger > warning > info) and remove duplicates per plant/type
  const sortedAlerts = sortAlertsBySeverity(alerts);
  return deduplicateAlerts(sortedAlerts);
}

function getColdAlertConfig(
  plantName: string,
  tempMin: number,
  forecastTemp: number
): AlertConfig {
  const diff = tempMin - forecastTemp;
  const severity: PlantAlert["severity"] = diff >= 5 ? "danger" : "warning";

  return {
    type: "cold",
    severity,
    title: severity === "danger" ? "Helada manana" : "Frio manana",
    message: `Tu ${plantName.toLowerCase()} no tolera menos de ${tempMin}°C, manana habra ${Math.round(forecastTemp)}°C.`,
  };
}

function getHeatAlertConfig(
  plantName: string,
  tempMax: number,
  forecastTemp: number
): AlertConfig {
  const diff = forecastTemp - tempMax;
  const severity: PlantAlert["severity"] = diff >= 5 ? "danger" : "warning";

  return {
    type: "heat",
    severity,
    title: severity === "danger" ? "Calor extremo manana" : "Calor manana",
    message: `Tu ${plantName.toLowerCase()} sufre con mas de ${tempMax}°C, manana habra ${Math.round(forecastTemp)}°C.`,
  };
}

function sortAlertsBySeverity(alerts: PlantAlert[]): PlantAlert[] {
  const severityOrder: Record<PlantAlert["severity"], number> = {
    danger: 0,
    warning: 1,
    info: 2,
  };

  return [...alerts].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

function deduplicateAlerts(alerts: PlantAlert[]): PlantAlert[] {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = `${alert.plantId}-${alert.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Returns the count of alerts by severity
 */
export function getAlertCounts(alerts: PlantAlert[]): {
  danger: number;
  warning: number;
  info: number;
} {
  return {
    danger: alerts.filter((a) => a.severity === "danger").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };
}
