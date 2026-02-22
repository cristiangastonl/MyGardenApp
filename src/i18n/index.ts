import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import esCommon from './locales/es/common.json';
import esPlants from './locales/es/plants.json';
import esTips from './locales/es/tips.json';
import esWeather from './locales/es/weather.json';

import enCommon from './locales/en/common.json';
import enPlants from './locales/en/plants.json';
import enTips from './locales/en/tips.json';
import enWeather from './locales/en/weather.json';

const LANGUAGE_KEY = 'app-language';

const resources = {
  es: {
    common: esCommon,
    plants: esPlants,
    tips: esTips,
    weather: esWeather,
  },
  en: {
    common: enCommon,
    plants: enPlants,
    tips: enTips,
    weather: enWeather,
  },
};

function getDeviceLanguage(): string {
  const locales = getLocales();
  const lang = locales[0]?.languageCode ?? 'en';
  return lang.startsWith('es') ? 'es' : 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  ns: ['common', 'plants', 'tips', 'weather'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Load saved language preference
AsyncStorage.getItem(LANGUAGE_KEY).then((savedLang) => {
  if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
    i18n.changeLanguage(savedLang);
  }
});

export async function setLanguage(lang: string) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export { LANGUAGE_KEY };
export default i18n;
