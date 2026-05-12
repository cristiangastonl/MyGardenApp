import { Plant, PlantDBEntry, Task } from "../types";
import { parseDate, addDays, isSameDay } from "./dates";
import type { WaterSeason } from "./seasonality";
import { getCatalogEntry } from "../data/plantDatabase";
import i18n from "../i18n";

// ─── POLISH-01 (Phase 23) ───────────────────────────────────────────────────
/**
 * Plants whose typeId implies they LIVE outdoors permanently. The "outdoor"
 * task (take indoor plant out for occasional sun) is nonsensical for these.
 *
 * Code-layer defense; the data layer is catalog `outdoor: false` set on the
 * same set of entries (POLISH-02). Both layers compose; either alone would
 * still close UAT #3 for a subset of cases.
 *
 * NOTE: ONLY 'exterior' and 'frutales' here. Aromáticas + huerta have mixed
 * indoor/outdoor entries (e.g. stevia/eneldo/salvia-officinalis indoor;
 * tomato/oregano outdoor); per-entry catalog `outdoor: false` decides
 * those (POLISH-02 data layer).
 */
const OUTDOOR_TYPE_IDS: ReadonlySet<string> = new Set(['exterior', 'frutales']);

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
    // POLISH-01: skip outdoor-task emission for plants that already live outdoors permanently.
    // Two-layer defense — POLISH-02 catalog `outdoor: false` ALSO prevents `outdoorDays`
    // from being initialized at AddPlant time.
    if (
      p.outdoorDays.includes(day.getDay()) &&
      !OUTDOOR_TYPE_IDS.has(p.typeId)
    ) {
      tasks.push({ type: "outdoor", icon: "🌤️", label: `Sacar ${p.name}`, plantId: p.id });
    }
    // FERT-03/04 — emit fertilize task on cadence (season-aware via warm/cold split).
    // catalogEntry resolved via getCatalogEntry; null for custom plants → no emission.
    // Cold-season dormancy + per-plant fertilizeSchedule.intervalDays override
    // both handled inside getNextFertilizeDate (Plan 20-02). i18n key tasks.fertilize
    // (landed in Plan 20-00 Task 3) is the user-facing label with {{name}} interpolation.
    const fertilizeCatalogEntry = p.databaseId ? getCatalogEntry(p.databaseId) : null;
    const nextFertilize = getNextFertilizeDate(p, fertilizeCatalogEntry, day, season);
    if (nextFertilize && isSameDay(nextFertilize, day)) {
      tasks.push({
        type: "fertilize",
        icon: "🌱",
        label: i18n.t('tasks.fertilize', { name: p.name }),
        plantId: p.id,
      });
    }
  });
  return tasks;
}

/**
 * v1.2 Phase 20 (FERT-04) — Resolves the active fertilize interval (days) for a plant
 * given the catalog entry and effective season. Mirrors getSeasonalInterval semantics
 * with season-aware split; cold-season null in catalog ⇒ dormancy (no emission).
 *
 * Resolution order:
 *   1. plant.fertilizeSchedule.intervalDays > 0 → user-overridden (season-agnostic in this phase)
 *   2. catalogEntry.fertilizeIntervalCold (when season==='cold') → null = dormant; number = use it
 *   3. catalogEntry.fertilizeIntervalWarm (when season==='warm' or 'tropical') → undefined → null
 *
 * Tropical bucket maps to 'warm' (matches getSeasonalInterval Pitfall 2 — Plant.fertilizeSchedule
 * has no tropical bucket; catalog warm interval is the right answer in tropical climates).
 */
export function getSeasonalFertilizeInterval(
  plant: Plant,
  catalogEntry: PlantDBEntry | null,
  season: WaterSeason
): number | null {
  // Per-plant override wins (Pattern 7 deep-merge guard protects fertilizeSchedule from catalog clobber).
  if (plant.fertilizeSchedule?.intervalDays != null && plant.fertilizeSchedule.intervalDays > 0) {
    return plant.fertilizeSchedule.intervalDays;
  }
  if (!catalogEntry) return null;
  if (season === 'cold') {
    // Catalog cold interval: null === dormant (no emission); number === use it.
    const cold = catalogEntry.fertilizeIntervalCold;
    if (cold === null) return null; // explicit dormancy
    if (typeof cold === 'number' && cold > 0) return cold;
    return null;
  }
  // 'warm' or 'tropical' bucket — both use fertilizeIntervalWarm.
  const warm = catalogEntry.fertilizeIntervalWarm;
  if (typeof warm === 'number' && warm > 0) return warm;
  return null;
}

/**
 * v1.2 Phase 20 (FERT-04) — Returns the date of the next fertilize event for the plant,
 * given today and the user's effective season. Returns null when the plant emits no
 * fertilize task (no per-plant override AND no catalog entry, OR cold-season dormancy).
 *
 * Mirrors getNextWaterDate advance-loop verbatim — catch-up clip ensures emit ONE task
 * on due-day, never N (Pitfall: do NOT add an "overdue penalty" — the loop guarantees
 * nextDate >= today, so daysUntil < 0 is dead code by-construction).
 *
 * @param plant         The plant.
 * @param catalogEntry  Resolved via getCatalogEntry(plant.databaseId) by caller; null for custom plants.
 * @param today         Reference date.
 * @param season        Pre-computed effective season ('warm' | 'cold' | 'tropical').
 */
export function getNextFertilizeDate(
  plant: Plant,
  catalogEntry: PlantDBEntry | null,
  today: Date,
  season: WaterSeason
): Date | null {
  const intervalDays = getSeasonalFertilizeInterval(plant, catalogEntry, season);
  if (intervalDays == null || intervalDays <= 0) return null;
  // Never-fertilized plants are due today (mirrors getNextWaterDate first-water behavior).
  const lastFertilized = plant.fertilizeSchedule?.lastFertilized;
  if (!lastFertilized) return today;
  const last = parseDate(lastFertilized);
  let next = addDays(last, intervalDays);
  while (next < today) next = addDays(next, intervalDays);
  return next;
}
