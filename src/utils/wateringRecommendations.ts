import { Plant, WeatherData } from '../types';
import { isRainyWeather } from '../data/weatherCodes';
import { getNextWaterDate } from './plantLogic';
import { isSameDay, addDays } from './dates';

export interface WateringRecommendation {
  plantId: string;
  plantName: string;
  icon: string;
  type: 'skip' | 'delay' | 'advance' | 'normal' | 'extra';
  reason: string;
  message: string;
}

/**
 * Generates smart watering recommendations based on weather conditions
 * and plant watering schedules.
 */
export function getWateringRecommendations(
  plants: Plant[],
  weather: WeatherData | null,
  today: Date
): WateringRecommendation[] {
  if (!weather || plants.length === 0) return [];

  const recommendations: WateringRecommendation[] = [];
  const { current, daily } = weather;
  const todayForecast = daily[0];
  const tomorrowForecast = daily[1];

  // Check weather conditions
  const isRainingNow = isRainyWeather(current.weatherCode);
  const willRainToday = todayForecast && todayForecast.precipitation > 5;
  const willRainTomorrow = tomorrowForecast && tomorrowForecast.precipitation > 5;
  const isExtremeHeat = current.temperature >= 35 || (todayForecast && todayForecast.tempMax >= 35);
  const isVeryHot = current.temperature >= 32 || (todayForecast && todayForecast.tempMax >= 32);
  const isHighHumidity = current.humidity > 80;
  const isWindyAndSunny = current.windSpeed > 30 && !isRainyWeather(current.weatherCode) && current.weatherCode <= 3;

  // Get plants that need watering today or tomorrow
  const plantsNeedingWater = plants.filter(plant => {
    const nextWater = getNextWaterDate(plant, today);
    const tomorrow = addDays(today, 1);
    return isSameDay(nextWater, today) || isSameDay(nextWater, tomorrow);
  });

  // Process each plant that needs watering
  plantsNeedingWater.forEach(plant => {
    const nextWater = getNextWaterDate(plant, today);
    const needsWaterToday = isSameDay(nextWater, today);
    const isOutdoorPlant = plant.outdoorDays.length > 0;

    // Skip watering if it's raining (outdoor plants only)
    if (isOutdoorPlant && needsWaterToday && (isRainingNow || willRainToday)) {
      recommendations.push({
        plantId: plant.id,
        plantName: plant.name,
        icon: plant.icon,
        type: 'skip',
        reason: 'rain',
        message: isRainingNow
          ? 'Esta lloviendo, no necesitas regar'
          : 'Va a llover hoy, podes saltear el riego',
      });
      return;
    }

    // Skip watering if rain expected tomorrow (outdoor plants)
    if (isOutdoorPlant && !needsWaterToday && willRainTomorrow) {
      recommendations.push({
        plantId: plant.id,
        plantName: plant.name,
        icon: plant.icon,
        type: 'skip',
        reason: 'rain_tomorrow',
        message: 'Manana se esperan lluvias, podes esperar',
      });
      return;
    }

    // Extra water recommendation for extreme heat
    if (isExtremeHeat && needsWaterToday) {
      recommendations.push({
        plantId: plant.id,
        plantName: plant.name,
        icon: plant.icon,
        type: 'advance',
        reason: 'extreme_heat',
        message: 'Hace mucho calor, rega temprano (antes de las 9am) o al atardecer',
      });
      return;
    }

    // Consider extra water for very hot days
    if (isVeryHot && needsWaterToday) {
      recommendations.push({
        plantId: plant.id,
        plantName: plant.name,
        icon: plant.icon,
        type: 'extra',
        reason: 'heat',
        message: 'Hace calor, considera regar un poco mas de lo habitual',
      });
      return;
    }

    // Delay watering if high humidity
    if (isHighHumidity && needsWaterToday && !isVeryHot) {
      recommendations.push({
        plantId: plant.id,
        plantName: plant.name,
        icon: plant.icon,
        type: 'delay',
        reason: 'humidity',
        message: 'Hay mucha humedad, podes esperar un dia',
      });
      return;
    }

    // Windy and sunny - don't forget to water
    if (isWindyAndSunny && needsWaterToday) {
      recommendations.push({
        plantId: plant.id,
        plantName: plant.name,
        icon: plant.icon,
        type: 'advance',
        reason: 'wind',
        message: 'El viento seca rapido, no te olvides de regar',
      });
      return;
    }
  });

  return recommendations;
}

/**
 * Groups recommendations by type for display purposes
 */
export function groupRecommendationsByType(
  recommendations: WateringRecommendation[]
): Record<WateringRecommendation['type'], WateringRecommendation[]> {
  const grouped: Record<WateringRecommendation['type'], WateringRecommendation[]> = {
    skip: [],
    delay: [],
    advance: [],
    normal: [],
    extra: [],
  };

  recommendations.forEach(rec => {
    grouped[rec.type].push(rec);
  });

  return grouped;
}

/**
 * Get a summary message for a group of recommendations
 */
export function getRecommendationSummary(
  type: WateringRecommendation['type'],
  count: number
): { title: string; icon: string } {
  switch (type) {
    case 'skip':
      return {
        title: count === 1 ? 'Podes saltear el riego' : `Podes saltear ${count} riegos`,
        icon: '💧',
      };
    case 'delay':
      return {
        title: count === 1 ? 'Podes demorar el riego' : `Podes demorar ${count} riegos`,
        icon: '⏳',
      };
    case 'advance':
      return {
        title: count === 1 ? 'Rega temprano o al atardecer' : `Rega temprano ${count} plantas`,
        icon: '⏰',
      };
    case 'extra':
      return {
        title: count === 1 ? 'Considera riego extra' : `Riego extra para ${count} plantas`,
        icon: '💦',
      };
    case 'normal':
    default:
      return {
        title: 'Riego normal',
        icon: '✅',
      };
  }
}
