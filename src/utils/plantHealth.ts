import {
  Plant,
  WeatherData,
  PlantHealthStatus,
  HealthIssue,
  HealthLevel,
  HealthIssueSeverity,
} from '../types';
import { getNextWaterDate } from './plantLogic';
import { daysBetween, formatDate } from './dates';

/**
 * Calculates the health status of a plant based on its care history and weather conditions.
 *
 * Health calculation:
 * - Base: 100 points
 * - -20 if overdue for watering (more days than waterEvery since last watered)
 * - -10 per extra day overdue (max -30 additional)
 * - -15 if today is a sun day and sun care wasn't done
 * - -10 if there are adverse weather conditions for the plant
 *
 * Levels:
 * - 80-100: excellent
 * - 60-79: good
 * - 40-59: warning
 * - 0-39: danger
 */
export function calculatePlantHealth(
  plant: Plant,
  today: Date,
  weather: WeatherData | null
): PlantHealthStatus {
  let score = 100;
  const issues: HealthIssue[] = [];
  const todayStr = formatDate(today);

  // Check water status
  const nextWaterDate = getNextWaterDate(plant, today);
  const daysUntilWater = daysBetween(today, nextWaterDate);

  // If nextWaterDate is in the past, plant is overdue
  if (daysUntilWater < 0) {
    const daysOverdue = Math.abs(daysUntilWater);

    // -20 for being overdue
    score -= 20;

    // -10 per extra day (max -30)
    const extraPenalty = Math.min(daysOverdue - 1, 3) * 10;
    score -= extraPenalty;

    const severity: HealthIssueSeverity = daysOverdue > 3 ? 'high' : daysOverdue > 1 ? 'medium' : 'low';

    issues.push({
      type: 'overdue_water',
      severity,
      message: daysOverdue === 1
        ? 'Necesita riego desde ayer'
        : `Necesita riego hace ${daysOverdue} dias`,
      daysSince: daysOverdue,
    });
  }

  // Check sun care - only if today is a sun day and not done
  const isSunDay = plant.sunDays.includes(today.getDay());
  if (isSunDay && plant.sunDoneDate !== todayStr) {
    score -= 15;
    issues.push({
      type: 'overdue_sun',
      severity: 'medium',
      message: 'Hoy toca ponerla al sol',
    });
  }

  // Check for no care at all
  if (!plant.lastWatered && !plant.sunDoneDate && !plant.outdoorDoneDate) {
    score -= 10;
    issues.push({
      type: 'no_care',
      severity: 'low',
      message: 'Esta planta nunca fue cuidada',
    });
  }

  // Check weather conditions if available
  if (weather) {
    const temp = weather.current.temperature;
    const windSpeed = weather.current.windSpeed;
    const todayForecast = weather.daily[0];

    // Check for extreme cold (frost risk)
    if (temp < 5 || (todayForecast && todayForecast.tempMin < 3)) {
      score -= 10;
      issues.push({
        type: 'extreme_weather',
        severity: 'high',
        message: 'Riesgo de heladas - protege tus plantas',
      });
    }
    // Check for extreme heat
    else if (temp > 35 || (todayForecast && todayForecast.tempMax > 38)) {
      score -= 10;
      issues.push({
        type: 'extreme_weather',
        severity: 'high',
        message: 'Ola de calor - riega temprano o al atardecer',
      });
    }

    // Check for strong winds (plants outdoors at risk)
    if (windSpeed > 40 && plant.outdoorDays.length > 0) {
      score -= 5;
      issues.push({
        type: 'extreme_weather',
        severity: 'medium',
        message: 'Viento fuerte - no saques las plantas afuera',
      });
    }

    // Check for heavy rain and watering needed
    if (todayForecast && todayForecast.precipitation > 10 && daysUntilWater === 0) {
      // This is actually good - rain helps, so we add a positive note
      // but we keep score neutral
      issues.push({
        type: 'extreme_weather',
        severity: 'low',
        message: 'Lluvia prevista - quiza no necesites regar',
      });
    }
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine level based on score
  const level = getHealthLevel(score);

  return {
    plantId: plant.id,
    score,
    level,
    issues,
  };
}

/**
 * Returns the health level based on score
 */
export function getHealthLevel(score: number): HealthLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'danger';
}

/**
 * Returns the color for a health level
 */
export function getHealthColor(level: HealthLevel): string {
  switch (level) {
    case 'excellent':
      return '#5b9a6a'; // green
    case 'good':
      return '#f0c040'; // yellow/gold
    case 'warning':
      return '#e8a820'; // orange
    case 'danger':
      return '#c75050'; // red
  }
}

/**
 * Returns the background color for a health level
 */
export function getHealthBgColor(level: HealthLevel): string {
  switch (level) {
    case 'excellent':
      return '#e8f5e9'; // light green
    case 'good':
      return '#fff8e1'; // light yellow
    case 'warning':
      return '#fff3e0'; // light orange
    case 'danger':
      return '#ffebee'; // light red
  }
}

/**
 * Returns a friendly message for the health level
 */
export function getHealthMessage(level: HealthLevel): string {
  switch (level) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Bien';
    case 'warning':
      return 'Necesita atencion';
    case 'danger':
      return 'Requiere cuidado urgente';
  }
}

/**
 * Calculate health for all plants and return summary statistics
 */
export function calculateGardenHealth(
  plants: Plant[],
  today: Date,
  weather: WeatherData | null
): {
  averageScore: number;
  level: HealthLevel;
  healthStatuses: PlantHealthStatus[];
  plantsNeedingAttention: PlantHealthStatus[];
} {
  if (plants.length === 0) {
    return {
      averageScore: 100,
      level: 'excellent',
      healthStatuses: [],
      plantsNeedingAttention: [],
    };
  }

  const healthStatuses = plants.map((plant) =>
    calculatePlantHealth(plant, today, weather)
  );

  const totalScore = healthStatuses.reduce((sum, status) => sum + status.score, 0);
  const averageScore = Math.round(totalScore / plants.length);
  const level = getHealthLevel(averageScore);

  // Plants needing attention (score < 80)
  const plantsNeedingAttention = healthStatuses
    .filter((status) => status.score < 80)
    .sort((a, b) => a.score - b.score); // Most urgent first

  return {
    averageScore,
    level,
    healthStatuses,
    plantsNeedingAttention,
  };
}
