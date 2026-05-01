import { Plant, Task } from "../types";
import { parseDate, addDays, isSameDay } from "./dates";
import type { WaterSeason } from "./seasonality";
import i18n from "../i18n";

/**
 * Resolves the active watering interval (days) for a plant given the season.
 * Tropical zone maps to the 'warm' bucket — Plant.waterSchedule has only
 * { warm, cold } keys (Pitfall 2 — tropical-bucket schema mismatch).
 *
 * Defensive fallback ladder (Phase 4 Plan 04 pattern):
 *   v1.1 waterSchedule[bucket] → legacy waterEvery → 7d safe default.
 *
 * Exported in Phase 6 (Plan 06-01) for read-side consumers (PlantCard badge, MyPlantDetailModal season badge).
 */
export function getSeasonalInterval(plant: Plant, season: WaterSeason): number {
  const bucket: 'warm' | 'cold' = season === 'cold' ? 'cold' : 'warm';

  const fromSchedule = plant.waterSchedule?.[bucket];
  if (typeof fromSchedule === 'number' && fromSchedule > 0) return fromSchedule;

  // Legacy fallback (covers migration-failure code path where the plant kept its v1.0 shape).
  if (typeof plant.waterEvery === 'number' && plant.waterEvery > 0) return plant.waterEvery;

  return 7; // safe default — weekly
}

/**
 * Returns the date of the next watering (or check-in for soil_check plants),
 * given the plant, today, and the user's effective season.
 *
 * Phase 7 (Plan 07-02): signature changed from `latitude: number | null` to
 * `season: WaterSeason` per RESEARCH.md Open-Question-3 Recommendation B.
 * Callers MUST pre-compute season via getEffectiveSeason(location, climateOverride, today)
 * exactly ONCE per render/scheduler tick, then pass to all consumers.
 *
 * @param plant   The plant.
 * @param today   Reference date.
 * @param season  Pre-computed effective season ('warm' | 'cold' | 'tropical').
 */
export function getNextWaterDate(plant: Plant, today: Date, season: WaterSeason): Date {
  const intervalDays = getSeasonalInterval(plant, season);
  if (intervalDays <= 0) return today;
  if (!plant.lastWatered) return today;
  const last = parseDate(plant.lastWatered);
  let next = addDays(last, intervalDays);
  while (next < today) next = addDays(next, intervalDays);
  return next;
}

/**
 * Generates the task list for a given day. Dispatches soil_check plants to
 * a 'check_soil' task (WATER-05); fixed-mode plants continue emitting 'water'.
 *
 * Mode is the dispatcher; cadence comes from the same season-aware lookup
 * regardless of mode (CONTEXT.md decision: "single source of truth across modes").
 *
 * Phase 7 (Plan 07-02): `latitude` parameter replaced by pre-computed `season`.
 */
export function getTasksForDay(plants: Plant[], day: Date, season: WaterSeason): Task[] {
  const tasks: Task[] = [];
  plants.forEach(p => {
    const next = getNextWaterDate(p, day, season);
    if (isSameDay(next, day)) {
      if (p.waterMode === 'soil_check') {
        tasks.push({
          type: "check_soil",
          icon: "🤚",
          label: i18n.t('tasks.checkSoil', { name: p.name }),
          plantId: p.id,
        });
      } else {
        tasks.push({ type: "water", icon: "💧", label: `Regar ${p.name}`, plantId: p.id });
      }
    }
    if (p.sunDays.includes(day.getDay())) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tasks.push({ type: "sun", icon: "☀️", label: `Sol para ${p.name} (${p.sunHours}h)`, plantId: p.id });
    }
    if (p.outdoorDays.includes(day.getDay())) {
      tasks.push({ type: "outdoor", icon: "🌤️", label: `Sacar ${p.name}`, plantId: p.id });
    }
  });
  return tasks;
}
