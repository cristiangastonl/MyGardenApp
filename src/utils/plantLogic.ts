import { Plant, Task } from "../types";
import { parseDate, addDays, isSameDay } from "./dates";

/**
 * Resolves the warm-season watering interval (days) for a plant.
 * v1.1: prefers `waterSchedule.warm`. Defensive fallback to legacy `waterEvery`
 * when `waterSchedule` is undefined (covers migration-failure code path where
 * the plant kept its v1.0 shape). Phase 5 will introduce season-aware selection
 * (warm vs. cold) — this helper currently always returns warm-season cadence.
 */
function getWaterIntervalDays(plant: Plant): number {
  if (plant.waterSchedule?.warm && plant.waterSchedule.warm > 0) {
    return plant.waterSchedule.warm;
  }
  if (typeof plant.waterEvery === 'number' && plant.waterEvery > 0) {
    return plant.waterEvery;
  }
  return 7; // safe default — weekly
}

export function getNextWaterDate(plant: Plant, today: Date): Date {
  const intervalDays = getWaterIntervalDays(plant);
  if (intervalDays <= 0) return today;
  if (!plant.lastWatered) return today;
  const last = parseDate(plant.lastWatered);
  let next = addDays(last, intervalDays);
  while (next < today) next = addDays(next, intervalDays);
  return next;
}

export function getTasksForDay(plants: Plant[], day: Date): Task[] {
  const tasks: Task[] = [];
  plants.forEach(p => {
    const next = getNextWaterDate(p, day);
    if (isSameDay(next, day)) {
      tasks.push({ type: "water", icon: "💧", label: `Regar ${p.name}`, plantId: p.id });
    }
    if (p.sunDays.includes(day.getDay())) {
      tasks.push({ type: "sun", icon: "☀️", label: `Sol para ${p.name} (${p.sunHours}h)`, plantId: p.id });
    }
    if (p.outdoorDays.includes(day.getDay())) {
      tasks.push({ type: "outdoor", icon: "🌤️", label: `Sacar ${p.name}`, plantId: p.id });
    }
  });
  return tasks;
}
