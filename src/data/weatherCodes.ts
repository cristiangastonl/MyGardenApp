// Open-Meteo WMO Weather interpretation codes
// https://open-meteo.com/en/docs

export interface WeatherCodeInfo {
  icon: string;
  description: string;
}

export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  // Clear
  0: { icon: "☀️", description: "Despejado" },

  // Mainly clear, partly cloudy, overcast
  1: { icon: "🌤️", description: "Mayormente despejado" },
  2: { icon: "⛅", description: "Parcialmente nublado" },
  3: { icon: "☁️", description: "Nublado" },

  // Fog and depositing rime fog
  45: { icon: "🌫️", description: "Niebla" },
  48: { icon: "🌫️", description: "Niebla con escarcha" },

  // Drizzle: Light, moderate, dense intensity
  51: { icon: "🌦️", description: "Llovizna leve" },
  53: { icon: "🌦️", description: "Llovizna moderada" },
  55: { icon: "🌧️", description: "Llovizna intensa" },

  // Freezing Drizzle: Light and dense intensity
  56: { icon: "🌧️", description: "Llovizna helada leve" },
  57: { icon: "🌧️", description: "Llovizna helada intensa" },

  // Rain: Slight, moderate and heavy intensity
  61: { icon: "🌧️", description: "Lluvia leve" },
  63: { icon: "🌧️", description: "Lluvia moderada" },
  65: { icon: "🌧️", description: "Lluvia intensa" },

  // Freezing Rain: Light and heavy intensity
  66: { icon: "🌧️", description: "Lluvia helada leve" },
  67: { icon: "🌧️", description: "Lluvia helada intensa" },

  // Snow fall: Slight, moderate, and heavy intensity
  71: { icon: "🌨️", description: "Nevada leve" },
  73: { icon: "🌨️", description: "Nevada moderada" },
  75: { icon: "❄️", description: "Nevada intensa" },

  // Snow grains
  77: { icon: "🌨️", description: "Granizo fino" },

  // Rain showers: Slight, moderate, and violent
  80: { icon: "🌦️", description: "Chubascos leves" },
  81: { icon: "🌧️", description: "Chubascos moderados" },
  82: { icon: "⛈️", description: "Chubascos intensos" },

  // Snow showers: slight and heavy
  85: { icon: "🌨️", description: "Chubascos de nieve leves" },
  86: { icon: "❄️", description: "Chubascos de nieve intensos" },

  // Thunderstorm: Slight or moderate, with slight and heavy hail
  95: { icon: "⛈️", description: "Tormenta" },
  96: { icon: "⛈️", description: "Tormenta con granizo leve" },
  99: { icon: "⛈️", description: "Tormenta con granizo intenso" },
};

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] || { icon: "❓", description: "Desconocido" };
}

// Check if weather code indicates rain
export function isRainyWeather(code: number): boolean {
  return (
    (code >= 51 && code <= 67) || // Drizzle and rain
    (code >= 80 && code <= 82) || // Rain showers
    (code >= 95 && code <= 99)    // Thunderstorms
  );
}
