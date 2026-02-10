import { Plant, Task } from "../types";
import { parseDate, addDays, isSameDay } from "./dates";

export function getNextWaterDate(plant: Plant, today: Date): Date {
  if (!plant.lastWatered) return today;
  const last = parseDate(plant.lastWatered);
  let next = addDays(last, plant.waterEvery);
  while (next < today) next = addDays(next, plant.waterEvery);
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
