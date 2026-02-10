import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location, WeatherData } from '../types';

const WEATHER_CACHE_KEY = 'weather-cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useWeather(location: Location | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (loc: Location, force = false) => {
    // Check cache first
    if (!force) {
      try {
        const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const data: WeatherData & { cachedLat: number; cachedLon: number } = JSON.parse(cached);
          const isRecent = Date.now() - data.lastFetched < CACHE_DURATION;
          const isSameLocation = data.cachedLat === loc.lat && data.cachedLon === loc.lon;

          if (isRecent && isSameLocation) {
            setWeather(data);
            return;
          }
        }
      } catch (e) {
        // Cache read failed, continue to fetch
      }
    }

    setLoading(true);
    setError(null);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather fetch failed');

      const data = await response.json();

      const weatherData: WeatherData = {
        current: {
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weathercode,
          windSpeed: data.current.windspeed_10m,
          humidity: data.current.relative_humidity_2m,
          uvIndex: data.current.uv_index || null,
        },
        daily: data.daily.time.map((date: string, i: number) => ({
          date,
          weatherCode: data.daily.weathercode[i],
          tempMax: data.daily.temperature_2m_max[i],
          tempMin: data.daily.temperature_2m_min[i],
          precipitation: data.daily.precipitation_sum[i],
          sunrise: data.daily.sunrise?.[i] || null,
          sunset: data.daily.sunset?.[i] || null,
          uvIndexMax: data.daily.uv_index_max?.[i] || null,
        })),
        lastFetched: Date.now(),
      };

      setWeather(weatherData);

      // Cache the result
      await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        ...weatherData,
        cachedLat: loc.lat,
        cachedLon: loc.lon,
      }));
    } catch (e) {
      setError('No se pudo obtener el clima');
      console.error('Weather fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
    }
  }, [location, fetchWeather]);

  const refetch = useCallback(() => {
    if (location) {
      fetchWeather(location, true);
    }
  }, [location, fetchWeather]);

  return { weather, loading, error, refetch };
}
