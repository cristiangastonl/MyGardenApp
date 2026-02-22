import { PlantType } from "../types";
import i18n from '../i18n';

export function getDaysShort(): string[] {
  return i18n.t('days.short', { returnObjects: true }) as string[];
}

export function getDaysFull(): string[] {
  return i18n.t('days.full', { returnObjects: true }) as string[];
}

export function getMonths(): string[] {
  return i18n.t('months', { returnObjects: true }) as string[];
}

// Keep static arrays for backward compat in non-reactive contexts
export const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function getPlantTypes(): PlantType[] {
  const t = i18n.t.bind(i18n);
  return [
    { id: "suculenta", name: t('plantTypes.suculenta.name'), icon: "🪴", waterDays: 10, sunHours: 4, tip: t('plantTypes.suculenta.tip') },
    { id: "helecho", name: t('plantTypes.helecho.name'), icon: "🌿", waterDays: 3, sunHours: 1, tip: t('plantTypes.helecho.tip') },
    { id: "cactus", name: t('plantTypes.cactus.name'), icon: "🌵", waterDays: 14, sunHours: 6, tip: t('plantTypes.cactus.tip') },
    { id: "floral", name: t('plantTypes.floral.name'), icon: "🌸", waterDays: 2, sunHours: 3, tip: t('plantTypes.floral.tip') },
    { id: "aromatica", name: t('plantTypes.aromatica.name'), icon: "🌱", waterDays: 2, sunHours: 5, tip: t('plantTypes.aromatica.tip') },
    { id: "trepa", name: t('plantTypes.trepa.name'), icon: "🍃", waterDays: 3, sunHours: 2, tip: t('plantTypes.trepa.tip') },
    { id: "frutal", name: t('plantTypes.frutal.name'), icon: "🍋", waterDays: 3, sunHours: 6, tip: t('plantTypes.frutal.tip') },
    { id: "otra", name: t('plantTypes.otra.name'), icon: "🌻", waterDays: 4, sunHours: 3, tip: t('plantTypes.otra.tip') },
  ];
}

export const PLANT_TYPES: PlantType[] = [
  { id: "suculenta", name: "Suculenta", icon: "🪴", waterDays: 10, sunHours: 4, tip: "Tierra bien drenada, poca agua. Toleran olvidos." },
  { id: "helecho", name: "Helecho", icon: "🌿", waterDays: 3, sunHours: 1, tip: "Humedad constante, luz indirecta. Les gusta la sombra." },
  { id: "cactus", name: "Cactus", icon: "🌵", waterDays: 14, sunHours: 6, tip: "Muy poco riego, mucho sol directo. Resistentes." },
  { id: "floral", name: "Planta floral", icon: "🌸", waterDays: 2, sunHours: 3, tip: "Riego frecuente, sol parcial. Cuidar hojas marchitas." },
  { id: "aromatica", name: "Aromática", icon: "🌱", waterDays: 2, sunHours: 5, tip: "Sol directo, riego regular. Podar para que crezcan." },
  { id: "trepa", name: "Trepadora", icon: "🍃", waterDays: 3, sunHours: 2, tip: "Luz indirecta brillante, suelo húmedo. Guiar el crecimiento." },
  { id: "frutal", name: "Frutal", icon: "🍋", waterDays: 3, sunHours: 6, tip: "Mucho sol, riego profundo. Fertilizar en primavera." },
  { id: "otra", name: "Otra", icon: "🌻", waterDays: 4, sunHours: 3, tip: "Ajustá los valores según las necesidades de tu planta." },
];

export const STORAGE_KEY = "plant-agenda-v2";
