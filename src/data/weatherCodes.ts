// Open-Meteo WMO Weather interpretation codes
// https://open-meteo.com/en/docs

import i18n from '../i18n';

export interface WeatherCodeInfo {
  icon: string;
  description: string;
}

const WEATHER_ICONS: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  const icon = WEATHER_ICONS[code] || "❓";
  const description = i18n.t(`codes.${code}`, { ns: 'weather', defaultValue: i18n.t('unknown', { ns: 'weather' }) });
  return { icon, description };
}

// Keep the static WEATHER_CODES export for backward compatibility
export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { icon: "☀️", description: "Despejado" },
  1: { icon: "🌤️", description: "Mayormente despejado" },
  2: { icon: "⛅", description: "Parcialmente nublado" },
  3: { icon: "☁️", description: "Nublado" },
  45: { icon: "🌫️", description: "Niebla" },
  48: { icon: "🌫️", description: "Niebla con escarcha" },
  51: { icon: "🌦️", description: "Llovizna leve" },
  53: { icon: "🌦️", description: "Llovizna moderada" },
  55: { icon: "🌧️", description: "Llovizna intensa" },
  56: { icon: "🌧️", description: "Llovizna helada leve" },
  57: { icon: "🌧️", description: "Llovizna helada intensa" },
  61: { icon: "🌧️", description: "Lluvia leve" },
  63: { icon: "🌧️", description: "Lluvia moderada" },
  65: { icon: "🌧️", description: "Lluvia intensa" },
  66: { icon: "🌧️", description: "Lluvia helada leve" },
  67: { icon: "🌧️", description: "Lluvia helada intensa" },
  71: { icon: "🌨️", description: "Nevada leve" },
  73: { icon: "🌨️", description: "Nevada moderada" },
  75: { icon: "❄️", description: "Nevada intensa" },
  77: { icon: "🌨️", description: "Granizo fino" },
  80: { icon: "🌦️", description: "Chubascos leves" },
  81: { icon: "🌧️", description: "Chubascos moderados" },
  82: { icon: "⛈️", description: "Chubascos intensos" },
  85: { icon: "🌨️", description: "Chubascos de nieve leves" },
  86: { icon: "❄️", description: "Chubascos de nieve intensos" },
  95: { icon: "⛈️", description: "Tormenta" },
  96: { icon: "⛈️", description: "Tormenta con granizo leve" },
  99: { icon: "⛈️", description: "Tormenta con granizo intenso" },
};

// Check if weather code indicates rain
export function isRainyWeather(code: number): boolean {
  return (
    (code >= 51 && code <= 67) || // Drizzle and rain
    (code >= 80 && code <= 82) || // Rain showers
    (code >= 95 && code <= 99)    // Thunderstorms
  );
}
