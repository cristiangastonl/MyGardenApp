import { Plant, PlantDBEntry, HumidityLevel } from "../types";
import { PLANT_DATABASE } from "../data/plantDatabase";

/**
 * Full plant info combining user settings with database knowledge
 */
export interface PlantFullInfo {
  plant: Plant;
  dbEntry: PlantDBEntry | null;
  // Resolved values (from plant override, db, or defaults)
  tempMin: number;
  tempMax: number;
  humidity: HumidityLevel;
  isSensitiveToSun: boolean;
  isSensitiveToHeat: boolean;
  isSensitiveToCold: boolean;
  needsHighHumidity: boolean;
}

/**
 * Default values when no database entry or override exists
 */
const DEFAULTS = {
  tempMin: 10,
  tempMax: 30,
  humidity: "media" as HumidityLevel,
};

/**
 * Finds the best matching database entry for a plant
 */
export function findDatabaseEntry(plant: Plant): PlantDBEntry | null {
  // First try exact databaseId match
  if (plant.databaseId) {
    const exact = PLANT_DATABASE.find((db) => db.id === plant.databaseId);
    if (exact) return exact;
  }

  // Try matching by name (fuzzy)
  const nameLower = plant.name.toLowerCase().trim();
  const nameMatch = PLANT_DATABASE.find(
    (db) =>
      db.name.toLowerCase() === nameLower ||
      db.scientificName.toLowerCase() === nameLower ||
      nameLower.includes(db.name.toLowerCase()) ||
      db.name.toLowerCase().includes(nameLower)
  );
  if (nameMatch) return nameMatch;

  // Try matching by typeId
  const typeMatch = PLANT_DATABASE.find((db) => db.id === plant.typeId);
  if (typeMatch) return typeMatch;

  return null;
}

/**
 * Gets full plant info by combining user data with database
 */
export function getPlantFullInfo(plant: Plant): PlantFullInfo {
  const dbEntry = findDatabaseEntry(plant);

  // Resolve values: plant override > database > defaults
  const tempMin = plant.tempMin ?? dbEntry?.tempMin ?? DEFAULTS.tempMin;
  const tempMax = plant.tempMax ?? dbEntry?.tempMax ?? DEFAULTS.tempMax;
  const humidity = plant.humidity ?? dbEntry?.humidity ?? DEFAULTS.humidity;

  // Calculate sensitivities
  const isSensitiveToSun = plant.sunHours <= 3; // Needs little sun
  const isSensitiveToHeat = tempMax <= 28;
  const isSensitiveToCold = tempMin >= 10;
  const needsHighHumidity = humidity === "alta";

  return {
    plant,
    dbEntry,
    tempMin,
    tempMax,
    humidity,
    isSensitiveToSun,
    isSensitiveToHeat,
    isSensitiveToCold,
    needsHighHumidity,
  };
}

/**
 * Gets full info for multiple plants
 */
export function getPlantsFullInfo(plants: Plant[]): PlantFullInfo[] {
  return plants.map(getPlantFullInfo);
}

/**
 * Filters plants that are at risk given current temperature
 */
export function getPlantsAtTempRisk(
  plants: Plant[],
  currentTemp: number,
  forecastTempMin: number,
  forecastTempMax: number
): { cold: PlantFullInfo[]; heat: PlantFullInfo[] } {
  const infos = getPlantsFullInfo(plants);

  const cold = infos.filter(
    (info) => forecastTempMin < info.tempMin || currentTemp < info.tempMin
  );

  const heat = infos.filter(
    (info) => forecastTempMax > info.tempMax || currentTemp > info.tempMax
  );

  return { cold, heat };
}

/**
 * Gets plants that need protection from UV based on their sun tolerance
 */
export function getPlantsUVSensitive(plants: Plant[]): PlantFullInfo[] {
  return getPlantsFullInfo(plants).filter((info) => info.isSensitiveToSun);
}

/**
 * Gets tip for a plant based on current conditions
 */
export function getPlantConditionTip(
  plant: Plant,
  currentTemp: number,
  uvIndex: number | null
): string | null {
  const info = getPlantFullInfo(plant);

  if (currentTemp < info.tempMin) {
    return `${plant.icon} ${plant.name} no tolera menos de ${info.tempMin}°C - protegela del frío`;
  }

  if (currentTemp > info.tempMax) {
    return `${plant.icon} ${plant.name} sufre sobre ${info.tempMax}°C - dale sombra y agua`;
  }

  if (uvIndex && uvIndex >= 8 && info.isSensitiveToSun) {
    return `${plant.icon} ${plant.name} es sensible al sol intenso - evitá exposición directa`;
  }

  return null;
}
