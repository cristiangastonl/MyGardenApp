# Phase 6: UI Read-Side Propagation - Research

**Researched:** 2026-05-01
**Domain:** React Native component read-side rendering — light-level labels, season badge, watering-mode badge, soil-check empty state
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Light-Level Label Translation (LIGHT-06, LIGHT-07)**
- Indoor/outdoor switch source: `plant.typeName` / category. `interior` → indoor labels ("Luz brillante indirecta"); `exterior`, `aromaticas`, `huerta`, `frutales` → outdoor labels ("Sol pleno", "Sol parcial", "Semi sombra", "Sombra"). No new schema field.
- i18n namespace: New top-level `lightLevel.*` block with `indoor.{direct|bright_indirect|medium_indirect|low}` and `outdoor.{direct|bright_indirect|medium_indirect|low}` subkeys. Both EN and ES (es-AR voseo).
- Display format: Plain translated label string only — no icon, no placement hint (placement hint is Phase 7).
- Fallback when `lightLevel` undefined: `plant.lightLevel` → `sunHoursToLightLevel(plant.sunHours)` → `bright_indirect` safe default. Reuses Phase 4 `migration.ts` mapper.
- Surfaces: `PlantCard`, `PlantDetailModal`, `MyPlantDetailModal`, `PlantHealthDetail`, `PlantDiagnosisModal` (user-visible light row only — AI payload preserved per Phase 4 Plan 04).

**Season Badge Display (SEASON-05)**
- Placement in PlantDetail: Same line as next-water info — single row "Cada 5 días — temporada cálida". No pill chip, no accent background.
- Visual style: Inline text, em-dash separator, season qualifier in `colors.textSecondary`.
- Wording: `"temporada cálida"` / `"temporada fría"` / `"trópico"` (ES); `"warm season"` / `"cold season"` / `"tropical"` (EN).
- PlantCard scope: No season badge on the card. Card shows the watering-mode badge with current-season interval baked in.
- Effective interval source: `getSeasonalInterval(plant, currentSeason)` from Phase 5 `seasonality.ts` — same SSOT.
- Tropical zone note: Badge reads "trópico" / "tropical". Interval is always warm-schedule value.

**Watering-Mode Badge on PlantCard (UX-02)**
- Position: Replaces the existing watering-text line on `PlantCard`. One source of watering info per card.
- Format (`fixed` mode): `"💧 Cada {N}d"` where N is the current-season interval.
- Format (`soil_check` mode): `"🤚 Por chequeo"` — fixed string, no interval shown.
- Visibility: Always visible, regardless of whether a task is due today.
- i18n keys: `plantCard.waterBadge.fixed` (with `{{days}}` interp) and `plantCard.waterBadge.soilCheck`.
- Theme: Reuses existing `PlantCard` text styles (no new color or shadow tokens).

**Soil-Check Empty State Copy (UX-03)**
- Render location: TodayScreen task list — per soil_check plant that has no task today, render a per-plant info row.
- Copy format: `"Tu {{plantName}} está en modo chequeo. Te avisamos en {{days}} días."` (ES) / `"Your {{plantName}} is in check mode. We'll remind you in {{days}} days."` (EN).
- Aggregation: Per-plant (one row per soil_check plant on a non-check-in day).
- Visual treatment: Subtle info-card row — `colors.bgSecondary` background, body font (`DMSans_400Regular`), leading `🤚` icon, padding/radius from `spacing` and `borderRadius` theme tokens.
- i18n key: `today.soilCheckEmptyRow` (with `{{plantName}}` and `{{days}}` interp).
- Source of truth for `days`: next-check-in date derived from `getNextWaterDate` + `daysBetween`.

**Cross-Cutting**
- i18n key audit: Phase 6 introduces ~12-16 new keys. Each MUST land in BOTH `en/common.json` AND `es/common.json`.
- Legacy `plantInfo.sunHours` / `plantInfo.waterEvery` keys: Keep for one release (rollback safety).
- Diagnosis modal user-visible row: Display new lightLevel label. AI payload shape preserved.
- Helper file decision: Likely `src/utils/lightLabel.ts` (`getLightLabel(plant, t)`) and possibly `src/utils/wateringMode.ts` (`getWaterBadge(plant, season, t)`) — planner may inline if call sites are few.

### Claude's Discretion
- Whether to extract helpers to separate files or inline in components.
- Exact style values for soil-check info row (padding, margin, corner radius) — must use theme tokens.
- Whether to export `getSeasonalInterval` from `seasonality.ts` or access it via `getNextWaterDate` path in components.

### Deferred Ideas (OUT OF SCOPE)
- Light-level icon set
- Placement hint inline ("Junto a ventana sur") — Phase 7 picker territory
- PlantCard season badge — rejected; mode badge already encodes current-season interval
- Global aggregated soil-check summary card — rejected
- Calendar-day empty-state copy for soil_check plants — out of scope
- Diagnosis edge-function payload rewrite — Phase 7 (LIGHT-05 territory)
- Removal of legacy i18n keys — v1.2
- Two-button check-in completion — deferred to v2.0
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIGHT-06 | All plant cards, detail modals, and diagnosis context display `lightLevel` translated label instead of `${sunHours}h sol` | Confirmed: 6 surfaces identified. Indoor/outdoor branch via `plant.typeId`/category. Defensive fallback ladder from Phase 4. |
| LIGHT-07 | Outdoor plants show `lightLevel` with outdoor-context labels ("Sol pleno" / "Sol parcial" / "Semi sombra" / "Sombra") | Confirmed: Same 4 buckets as indoor, different i18n subkey (`lightLevel.outdoor.*`). Category detection via `plant.typeId`. |
| SEASON-05 | Plant detail view shows current season badge ("Cada 5 días — temporada cálida") | Confirmed: `getWaterSeason(latitude, today)` + `getSeasonalInterval` already in `plantLogic.ts` (unexported helper). Needs export or re-derivation. |
| UX-02 | Plant cards show a watering-mode badge ("💧 Cada 5d" or "🤚 Por chequeo") | Confirmed: `PlantCard` has an existing `nextWater` section to replace. `plant.waterMode` is the discriminator. Season-aware interval from `getNextWaterDate`. |
| UX-03 | Soil-check plants on non-check-in days display empty-state copy ("Tu cactus está en modo chequeo. Te avisamos en 12 días.") | Confirmed: TodayScreen `plantsWithTasks` memo excludes soil_check plants on non-check-in days. New per-plant row needed in the section rendering. |
</phase_requirements>

---

## Summary

Phase 6 is a pure read-side rendering phase. Phases 4 and 5 already established the data model (`lightLevel`, `waterSchedule`, `waterMode`) and season utilities (`getWaterSeason`, `getSeasonalInterval` in `plantLogic.ts`). Phase 6 only needs to wire these values to the UI layer and add the corresponding i18n strings.

The codebase has six surfaces to update: `PlantCard`, `PlantDetailModal`, `MyPlantDetailModal`, `PlantHealthDetail`, `PlantDiagnosisModal`, and `TodayScreen`. Each has a clear, bounded change. The dominant risk is i18n key parity — the project enforces EN+ES for every key, and Phase 6 introduces ~14 new keys. The second risk is that `getSeasonalInterval` is currently unexported from `plantLogic.ts` (it is a module-private function), so either it needs exporting or the components must re-derive the value via `getNextWaterDate` + `daysBetween`.

The soil-check empty state in TodayScreen requires careful insertion: the current `plantsWithTasks` memo filters out soil_check plants on non-check-in days (they have no task), and the "all caught up" empty state fires when `plantsWithTasks.length === 0`. A mixed garden with only soil_check plants would show "All caught up!" — that is the UX-03 problem. The fix is a parallel `soilCheckSilentPlants` array and a distinct per-plant info row rendered alongside (or instead of) the "all caught up" copy.

**Primary recommendation:** Extract `getLightLabel(plant, t)` to `src/utils/lightLabel.ts` (pure, no React) and export `getSeasonalInterval` from `plantLogic.ts` for reuse in component season-badge and badge-interval computation. Inline the soil-check row directly in TodayScreen (no new component needed — it is a single info card).

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Relevant to Phase 6 |
|---------|---------|---------|---------------------|
| react-i18next | current | i18n translation | `t('lightLevel.indoor.bright_indirect')` etc. |
| React Native | SDK 54 | UI primitives | `View`, `Text`, `StyleSheet` for new rows |
| `src/utils/seasonality.ts` | Phase 5 | `getWaterSeason(lat, date)` | Season-badge and badge-interval source |
| `src/utils/plantLogic.ts` | Phase 5 | `getNextWaterDate`, `getSeasonalInterval` (private) | Interval for badge and check-in countdown |
| `src/utils/migration.ts` | Phase 4 | `sunHoursToLightLevel(h)` | Fallback rung in defensive ladder |
| `src/theme.ts` | current | Design tokens | `colors.bgSecondary`, `colors.textSecondary`, `spacing.*`, `borderRadius.*`, `fonts.*` |

**No new npm packages.** All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── utils/
│   └── lightLabel.ts          # NEW — getLightLabel(plant, t): string (pure, no React)
├── components/
│   ├── PlantCard.tsx          # MODIFY — replace nextWater block with waterBadge
│   ├── PlantDetailModal.tsx   # MODIFY — replace sunHours row with lightLevel label
│   ├── MyPlantDetailModal.tsx # MODIFY — replace waterEvery + sunHours pills
│   ├── PlantHealthDetail.tsx  # MODIFY — switch sunHoursForDisplay to label
│   └── PlantDiagnosis/
│       └── PlantDiagnosisModal.tsx  # MODIFY — user-visible light row only
├── screens/
│   └── TodayScreen.tsx        # MODIFY — soilCheckSilentPlants row below plantsWithTasks
└── i18n/locales/
    ├── en/common.json          # ADD lightLevel.*, plantCard.waterBadge.*, plantDetail.seasonBadge.*, today.soilCheckEmptyRow
    └── es/common.json          # ADD same keys, voseo for verb forms
```

The `lightLabel.ts` helper should be a pure function module (no React, no context, no i18n import at module level — receives `t` as argument). This follows the project's `src/utils/` convention documented in `STRUCTURE.md` and `CONVENTIONS.md`.

---

### Pattern 1: Defensive Fallback Ladder (LIGHT-06, LIGHT-07)

**What:** Every lightLevel read in Phase 6 uses a three-rung ladder.
**When to use:** In every component that renders a light label.
**Example:**

```typescript
// src/utils/lightLabel.ts
import { sunHoursToLightLevel } from './migration';
import { Plant } from '../types';
import { TFunction } from 'i18next';

const OUTDOOR_CATEGORIES = new Set(['exterior', 'aromaticas', 'huerta', 'frutales']);

export function getLightLabel(plant: Plant, t: TFunction): string {
  // Rung 1: v1.1 field
  const level = plant.lightLevel
    // Rung 2: legacy sunHours mapper
    ?? (typeof plant.sunHours === 'number'
        ? sunHoursToLightLevel(plant.sunHours)
        : undefined)
    // Rung 3: safe default
    ?? 'bright_indirect';

  // Indoor vs outdoor branch from typeId/category
  const isOutdoor = OUTDOOR_CATEGORIES.has(plant.typeId);
  const ns = isOutdoor ? 'outdoor' : 'indoor';
  return t(`lightLevel.${ns}.${level}`);
}
```

**Critical note on indoor/outdoor detection:** `plant.typeId` is the stored category key (`'interior'`, `'exterior'`, `'aromaticas'`, `'huerta'`, `'frutales'`, `'suculentas'`). The OUTDOOR_CATEGORIES set must use these actual typeId strings, NOT typeName (which is a display string that varies by locale). Confirmed by reading `PlantCard.tsx` line 111 and `types/index.ts` `Plant.typeId`.

---

### Pattern 2: Season Badge + Effective Interval (SEASON-05)

**What:** `MyPlantDetailModal` info pills row shows "Cada 5 días — temporada cálida".
**When to use:** In `MyPlantDetailModal` only (PlantCard gets mode-badge instead).

The key challenge: `getSeasonalInterval` is currently a **module-private** function inside `plantLogic.ts`. It is NOT exported. Two options:

**Option A (recommended):** Export `getSeasonalInterval` from `plantLogic.ts`.
```typescript
// plantLogic.ts — add `export` keyword to existing function
export function getSeasonalInterval(plant: Plant, season: WaterSeason): number { ... }
```
This gives `MyPlantDetailModal` and any other component a clean import path. The function is already stable (used internally by `getNextWaterDate` and `getTasksForDay`).

**Option B:** Re-derive via `daysBetween(today, getNextWaterDate(plant, today, latitude))` which indirectly uses the season-aware interval. However, this only gives the "days until next water" not the raw interval. Not suitable for displaying "every N days".

Option A is correct. Export `getSeasonalInterval`.

Season badge text formula:
```typescript
const season = getWaterSeason(latitude, today);          // 'warm' | 'cold' | 'tropical'
const interval = getSeasonalInterval(plant, season);
const seasonKey = season === 'warm' ? 'warm'
                : season === 'cold' ? 'cold'
                : 'tropical'; // 'tropical' maps to warm interval but distinct label
const seasonLabel = t(`plantDetail.seasonBadge.${seasonKey}`);
// Render: `${t('plantDetail.seasonBadge.every', { days: interval })} — ${seasonLabel}`
```

The i18n key structure: `plantDetail.seasonBadge.every` (`"Cada {{days}} días"`) and separate `plantDetail.seasonBadge.warm` / `.cold` / `.tropical` for the qualifier. Alternatively: `plantDetail.seasonBadge.everyWithSeason` with `{{days}}` and `{{season}}` interp — but two separate keys match the existing namespacing style better and allow the `—` separator to vary naturally by locale.

---

### Pattern 3: Watering-Mode Badge on PlantCard (UX-02)

**What:** The `nextWater` block (lines 185-196 of PlantCard.tsx) is replaced by a mode badge always visible.

**Current state (PlantCard.tsx lines 185-196):**
```tsx
// EXISTING — replace this entire block:
{mode === 'tasks' && !hasTasks && (
  <View style={styles.nextWater}>
    <Text style={styles.nextWaterLabel}>{t('plantCard.nextWater')}</Text>
    <Text style={styles.nextWaterText}>
      {daysUntilWater === 0 ? t('plantCard.today') : ...}
    </Text>
  </View>
)}
```

**New badge (always visible regardless of hasTasks or mode):**
```tsx
// NEW — shown in all modes, all plants
{(() => {
  const season = getWaterSeason(latitude, today);
  const interval = getSeasonalInterval(plant, season);
  const isCheckMode = plant.waterMode === 'soil_check';
  return (
    <View style={styles.waterBadge}>
      <Text style={styles.waterBadgeText}>
        {isCheckMode
          ? t('plantCard.waterBadge.soilCheck')
          : t('plantCard.waterBadge.fixed', { days: interval })}
      </Text>
    </View>
  );
})()}
```

The badge reuses existing text styles from the `nextWater` block. No new theme tokens.

**Important tsc consideration:** `getSeasonalInterval` import requires exporting it from `plantLogic.ts` (Pattern 2 above). PlantCard already imports from `plantLogic.ts` (line 6: `getNextWaterDate`), so the import addition is minimal.

---

### Pattern 4: Soil-Check Empty State in TodayScreen (UX-03)

**What:** On non-check-in days, soil_check plants are invisible in "Hoy". Phase 6 adds a per-plant info row for them.

**Current TodayScreen state (lines 161-177):** `plantsWithTasks` memo includes a plant only if `needsWaterToday || needsSunToday || needsOutdoorToday`. A soil_check plant on a non-check-in day satisfies none of these and is absent.

**Fix:** Add a parallel `soilCheckSilentPlants` memo:
```typescript
const soilCheckSilentPlants = useMemo(() => {
  return plants.filter(plant => {
    if (plant.waterMode !== 'soil_check') return false;
    const nextWater = getNextWaterDate(plant, today, location?.lat ?? null);
    return !isSameDay(nextWater, today); // not a check-in day
  });
}, [plants, today, location?.lat]);
```

**Days until next check-in:**
```typescript
// For each plant in soilCheckSilentPlants:
const daysLeft = daysBetween(today, getNextWaterDate(plant, today, location?.lat ?? null));
```
`getNextWaterDate` already advances the date to the next due date, so `daysBetween(today, nextWater)` gives the correct countdown.

**Render location in TodayScreen:** After the `plantsWithTasks` section and before (or merged with) the "all caught up" empty state. The "all caught up" block currently fires when `plantsWithTasks.length === 0` — it should additionally require `soilCheckSilentPlants.length === 0` OR render the soil-check rows first and suppress "all caught up" when there are soil_check plants.

Simplest approach: render `soilCheckSilentPlants` rows in their own section (after tasks section), and keep "all caught up" conditional on `plantsWithTasks.length === 0 && soilCheckSilentPlants.length === 0`.

**Row JSX (inline, no new component needed):**
```tsx
{soilCheckSilentPlants.length > 0 && (
  <View style={styles.section}>
    {soilCheckSilentPlants.map(plant => {
      const daysLeft = daysBetween(
        today,
        getNextWaterDate(plant, today, location?.lat ?? null)
      );
      return (
        <View key={plant.id} style={styles.soilCheckRow}>
          <Text style={styles.soilCheckIcon}>🤚</Text>
          <Text style={styles.soilCheckText}>
            {t('today.soilCheckEmptyRow', { plantName: plant.name, days: daysLeft })}
          </Text>
        </View>
      );
    })}
  </View>
)}
```

Style: `bgSecondary` background, `DMSans_400Regular` font, `spacing.sm` / `spacing.md` padding, `borderRadius.md` radius — all from theme.

---

### Pattern 5: PlantDetailModal Light Row (PlantDBEntry surface)

`PlantDetailModal` shows catalog entries (`PlantDBEntry`), not user `Plant` objects. The existing row:
```tsx
// Line 97: t('plantDetailModal.hoursPerDay', { hours: plant.sunHours })
```
needs to become a light-level label. `PlantDBEntry` has `lightLevel?: LightLevel` and `category: PlantCategory`.

The same defensive ladder applies but with `PlantDBEntry` fields:
```typescript
import { getLightLabelFromEntry } from '../utils/lightLabel';
// OR: overload getLightLabel to accept PlantDBEntry as well as Plant
```

The simplest approach: make `getLightLabel` accept `{ lightLevel?: LightLevel; sunHours?: number; typeId: string }` — the intersection of relevant fields from both types. Both `Plant` and `PlantDBEntry` have `lightLevel?`, `sunHours?`, and the `category` field (on PlantDBEntry) maps directly to the typeId convention. Since `PlantDBEntry.category` is exactly the same string values as `Plant.typeId` (`'interior'`, `'exterior'`, etc.), a single function signature can handle both if it accepts `{ lightLevel?, sunHours?, typeId: string }` where callers pass `plant.category` as `typeId` for DBEntry surfaces.

---

### Pattern 6: PlantHealthDetail Light Row (verified state)

`PlantHealthDetail.tsx` lines 43-58 already implements a `sunHoursForDisplay` derivation from `lightLevel` (Phase 4 Plan 04). However it maps lightLevel → hours and feeds that into the existing `t('health.needsSunHours', { hours })` key. Phase 6 replaces this with `getLightLabel(plant, t)` directly — eliminating the intermediate hours mapping and the `sunHoursForDisplay` variable for this surface.

**Current (Phase 4 state):**
```typescript
const sunHoursForDisplay: number = (() => {
  if (plant.lightLevel) { switch... return hours; }
  return typeof plant.sunHours === 'number' ? plant.sunHours : 0;
})();
// then: t('health.needsSunHours', { hours: sunHoursForDisplay })
```

**Phase 6 target:**
```typescript
const lightLabel = getLightLabel(plant, t);
// render: lightLabel directly (no hours translation key needed)
```

The `sunHoursForDisplay` variable in `PlantHealthDetail.tsx` is removed (or kept only if used elsewhere in the same file — verify before deleting).

---

### Pattern 7: PlantDiagnosisModal User-Visible Row

`PlantDiagnosisModal.tsx` lines 69-93 already derives `sunHoursForContext` for the AI payload. There is a separate user-visible plant info section in the results rendering. Phase 6 adds the light label to the user-visible section only. The `plantContext` object (lines 87-93) is NOT touched — it remains feeding `waterEvery` + `sunHours` to the edge function until Phase 7.

The user-visible section likely lives in `DiagnosisResults.tsx` (the child component that renders result data). Planner must read `DiagnosisResults.tsx` to confirm the exact insertion point.

---

### Anti-Patterns to Avoid

- **Re-implementing season logic in components:** Always use `getWaterSeason(latitude, today)` from `seasonality.ts`. Never compute hemisphere manually in a component.
- **Using `plant.typeName` to detect indoor/outdoor:** `typeName` is a display string that is locale-specific or user-entered. Always use `plant.typeId` (the category key like `'interior'`, `'exterior'`).
- **Using `OUTDOOR_CATEGORIES` as an allowlist of positives only:** `suculentas` is NOT in the outdoor set — they are indoor by default even though some are drought-tolerant. The existing category scheme from `CONTEXT.md` defines: `interior` → indoor; `exterior`, `aromaticas`, `huerta`, `frutales` → outdoor; `suculentas` → indoor.
- **Hardcoding interval for PlantCard badge as warm interval:** The badge must use `getSeasonalInterval(plant, season)` where `season = getWaterSeason(latitude, today)` — not `plant.waterSchedule.warm` directly.
- **Calling `getNextWaterDate` twice when one call suffices:** `daysBetween(today, getNextWaterDate(...))` already gives days-until; no need to separately call `getSeasonalInterval` just for the countdown (though it IS needed for the badge interval display).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Season computation | Custom hemisphere check | `getWaterSeason(latitude, today)` from `seasonality.ts` | Phase 5 SSOT; already tested |
| Interval lookup | Custom waterSchedule read | `getSeasonalInterval(plant, season)` from `plantLogic.ts` (after export) | Handles defensive fallback + tropical-bucket mapping |
| sunHours → lightLevel fallback | Inline threshold logic | `sunHoursToLightLevel(h)` from `migration.ts` | Phase 4 mapper — exact same thresholds |
| Days-until calculation | Manual `Date` arithmetic | `daysBetween(today, date)` from `dates.ts` | Already handles negative/zero correctly |

---

## Common Pitfalls

### Pitfall 1: `getSeasonalInterval` is module-private
**What goes wrong:** Planner assigns a task to use `getSeasonalInterval` from `plantLogic.ts` but it is not exported — tsc will fail.
**Why it happens:** Phase 5 only needed it internally; never exported.
**How to avoid:** The first task of Phase 6 should be "export `getSeasonalInterval` from `plantLogic.ts`" or include it as part of the first plan that touches PlantCard. The export is safe (pure function, no side effects).
**Warning signs:** `tsc` error "Module '"../utils/plantLogic"' has no exported member 'getSeasonalInterval'".

### Pitfall 2: Indoor/outdoor detection via `typeName` instead of `typeId`
**What goes wrong:** `plant.typeName` for an interior plant in Spanish is `"Interior"` (or user-edited string). Comparing it to `'exterior'` etc. fails silently — all plants fall through to indoor label.
**Why it happens:** Conflating display name with category key.
**How to avoid:** Always use `plant.typeId` (the stored category ID). Confirmed by `types/index.ts` Plant interface: `typeId: string` is the category key; `typeName: string` is the display name.

### Pitfall 3: "All caught up" fires for gardens that only have soil_check plants
**What goes wrong:** `plantsWithTasks.length === 0` → "All caught up!" fires. But user has 3 cacti in soil_check mode. Empty screen with a celebration message when the user expects plant-related info.
**Why it happens:** TodayScreen `plantsWithTasks` memo does not include soil_check plants on non-check-in days.
**How to avoid:** Guard the "all caught up" condition with `soilCheckSilentPlants.length === 0`. Render soil-check info rows BEFORE the "all caught up" block.

### Pitfall 4: i18n key parity broken (EN present, ES missing)
**What goes wrong:** App crashes or shows raw key string on Spanish locale for new `lightLevel.*` or `plantCard.waterBadge.*` keys.
**Why it happens:** Adding keys to `en/common.json` but forgetting `es/common.json`.
**How to avoid:** Add both files in the same task/wave. The existing Phase 4 Plan 06 discipline: "every new key MUST exist in both files" applies here.

### Pitfall 5: PlantDatabaseCard and PlantDetailModal operate on `PlantDBEntry`, not `Plant`
**What goes wrong:** Passing a `PlantDBEntry` to `getLightLabel(plant: Plant, t)` causes a tsc error because `PlantDBEntry.category` is not the same property as `Plant.typeId`.
**Why it happens:** Two different types with equivalent category data under different field names.
**How to avoid:** Design `getLightLabel` to accept a structural type `{ lightLevel?: LightLevel; sunHours?: number; typeId: string }` and call it with `{ ...dbEntry, typeId: dbEntry.category }` for DBEntry surfaces, OR create a thin `getLightLabelFromDBEntry(entry, t)` wrapper.

### Pitfall 6: Removing the `nextWaterLabel` / `nextWaterText` styles without removing the JSX
**What goes wrong:** PlantCard renders empty space or wrong styling for the badge because the old styles are removed but JSX still references them.
**Why it happens:** The replacement badge reuses some but not all existing style properties.
**How to avoid:** Remove the old `nextWater` block entirely from JSX and from StyleSheet together. The new badge inherits from existing `type` / body text styles.

### Pitfall 7: `days` countdown shows 0 for plants due today in soil-check mode
**What goes wrong:** A soil_check plant that IS due today has `daysLeft = 0`, but it should not appear in `soilCheckSilentPlants` (it should appear in `plantsWithTasks`). If the filter logic is wrong, it shows "Te avisamos en 0 días."
**Why it happens:** Fence-post error in the `isSameDay` check inside the `soilCheckSilentPlants` filter.
**How to avoid:** Filter with `!isSameDay(nextWater, today)` — same `isSameDay` from `dates.ts` used in `plantsWithTasks`. The filter is mutually exclusive by construction.

---

## Code Examples

### i18n Key Block to Add (both EN and ES)

```json
// src/i18n/locales/en/common.json — add as top-level block
"lightLevel": {
  "indoor": {
    "direct": "Direct light",
    "bright_indirect": "Bright indirect light",
    "medium_indirect": "Medium indirect light",
    "low": "Low light"
  },
  "outdoor": {
    "direct": "Full sun",
    "bright_indirect": "Partial sun",
    "medium_indirect": "Semi-shade",
    "low": "Shade"
  }
}
```

```json
// src/i18n/locales/es/common.json — voseo, no verb forms needed here (labels only)
"lightLevel": {
  "indoor": {
    "direct": "Luz directa",
    "bright_indirect": "Luz brillante indirecta",
    "medium_indirect": "Luz media indirecta",
    "low": "Poca luz"
  },
  "outdoor": {
    "direct": "Sol pleno",
    "bright_indirect": "Sol parcial",
    "medium_indirect": "Semi sombra",
    "low": "Sombra"
  }
}
```

```json
// plantCard.waterBadge (add under existing "plantCard" block in BOTH files)
// EN:
"waterBadge": {
  "fixed": "💧 Every {{days}}d",
  "soilCheck": "🤚 Check soil"
}
// ES:
"waterBadge": {
  "fixed": "💧 Cada {{days}}d",
  "soilCheck": "🤚 Por chequeo"
}
```

```json
// plantDetail.seasonBadge (add under existing "plantDetail" block in BOTH files)
// EN:
"seasonBadge": {
  "every": "Every {{days}} days",
  "warm": "warm season",
  "cold": "cold season",
  "tropical": "tropical"
}
// ES:
"seasonBadge": {
  "every": "Cada {{days}} días",
  "warm": "temporada cálida",
  "cold": "temporada fría",
  "tropical": "trópico"
}
```

```json
// today.soilCheckEmptyRow (add to "today" block in BOTH files)
// EN:
"soilCheckEmptyRow": "Your {{plantName}} is in check mode. We'll remind you in {{days}} days."
// ES:
"soilCheckEmptyRow": "Tu {{plantName}} está en modo chequeo. Te avisamos en {{days}} días."
```

---

### Season Badge Render in MyPlantDetailModal

```tsx
// Replace the waterEvery + sunHours pills (lines ~163-175 of MyPlantDetailModal.tsx)
import { getWaterSeason } from '../utils/seasonality';
import { getSeasonalInterval } from '../utils/plantLogic'; // requires export

const season = getWaterSeason(latitude, new Date());
const interval = getSeasonalInterval(plant, season);
const seasonKey = season === 'cold' ? 'cold' : season === 'tropical' ? 'tropical' : 'warm';

<View style={styles.infoPill}>
  <Text style={styles.infoPillIcon}>💧</Text>
  <Text style={styles.infoPillText}>
    {t('plantDetail.seasonBadge.every', { days: interval })}
    {' — '}
    <Text style={{ color: colors.textSecondary }}>
      {t(`plantDetail.seasonBadge.${seasonKey}`)}
    </Text>
  </Text>
</View>
<View style={styles.infoPill}>
  <Text style={styles.infoPillIcon}>☀️</Text>
  <Text style={styles.infoPillText}>{getLightLabel(plant, t)}</Text>
</View>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sunHours` numeric display ("4h sol") | `lightLevel` translated label ("Luz brillante indirecta") | Phase 6 | All 6 surfaces migrate to label-driven rendering |
| Single `waterEvery` badge | Season-aware `fixed` / `soil_check` badge | Phase 6 | PlantCard badge encodes current-season interval |
| "All caught up!" for soil_check gardens | Per-plant "check mode" info row | Phase 6 | UX-03 — mixed gardens are self-explanatory |
| `getSeasonalInterval` private to `plantLogic.ts` | Exported for component use | Phase 6 | Enables PlantCard and MyPlantDetailModal to read interval |

**Deprecated patterns (Phase 6 replaces):**
- `t('plantDetail.sunHours', { hours: plant.sunHours })` → replaced by `getLightLabel(plant, t)`
- `t('plantDetail.waterEvery', { days: plant.waterEvery })` → replaced by season-aware interval + badge
- `t('plantDetailModal.hoursPerDay', { hours: plant.sunHours })` → replaced by lightLevel label in catalog modal

---

## Open Questions

1. **DiagnosisResults.tsx user-visible light row location**
   - What we know: `PlantDiagnosisModal.tsx` passes `plantContext` to child components; `DiagnosisResults.tsx` presumably renders a plant info section.
   - What's unclear: Exact line in `DiagnosisResults.tsx` where the light row is rendered (file was not read).
   - Recommendation: Planner's first task for the diagnosis surface should read `DiagnosisResults.tsx` and identify the light/sun row. The insertion pattern is identical to other surfaces.

2. **`getSeasonalInterval` export: separate util or in-place export**
   - What we know: The function is at lines 14-24 of `plantLogic.ts`. It is stable and pure.
   - What's unclear: Whether the planner prefers an explicit export from `plantLogic.ts` vs. a re-implementation in a new `wateringMode.ts` helper.
   - Recommendation: Export from `plantLogic.ts` — avoids duplication, keeps the SSOT locked.

3. **PlantDatabaseCard — no lightLevel on browse card?**
   - What we know: `PlantDatabaseCard.tsx` currently shows `💧 {plant.waterDays}d` and `☀️ {plant.sunHours}h` badges. Phase 6 CONTEXT.md lists it as a "read-side surface."
   - What's unclear: Whether the planner should replace the `☀️ {plant.sunHours}h` badge with a lightLevel label on the browse card. The browse card is a `PlantDBEntry` surface; `lightLevel` is present on catalog entries.
   - Recommendation: Replace with lightLevel label for LIGHT-06/07 compliance. The badge is compact so use an abbreviated label or the full label at small font size — CONTEXT.md only says "display lightLevel translated label instead of ${sunHours}h sol", no size restriction.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test framework is set up") |
| Config file | none |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npx tsc --noEmit` + manual smoke via `node scripts/run-smoke-tests.mjs` (Phase 4/5 pattern) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIGHT-06 | `getLightLabel` returns EN label for indoor `bright_indirect` | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 — extend smoke runner |
| LIGHT-06 | `getLightLabel` defensive ladder: no lightLevel → sunHoursToLightLevel → safe default | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| LIGHT-07 | `getLightLabel` returns outdoor label ("Full sun") for `exterior` + `direct` | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| LIGHT-07 | `getLightLabel` returns indoor label for `suculentas` category | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| SEASON-05 | `getSeasonalInterval` returns warm interval for tropical zone | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 (export needed) |
| UX-02 | `plantCard.waterBadge.fixed` key exists in both EN and ES | unit (smoke runner, JSON parse) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| UX-02 | `plantCard.waterBadge.soilCheck` key exists in both EN and ES | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| UX-03 | `today.soilCheckEmptyRow` key exists in both EN and ES | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| UX-03 | `daysBetween(today, getNextWaterDate(soilCheckPlant, today, lat))` > 0 for non-check-in day | unit (smoke runner) | `node scripts/run-smoke-tests.mjs` | ❌ Wave 0 |
| ALL | tsc exits 0 after all component edits | type-check | `npx tsc --noEmit` | ✅ already configured |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npx tsc --noEmit` + `node scripts/run-smoke-tests.mjs`
- **Phase gate:** tsc green + smoke green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `scripts/run-smoke-tests.mjs` with a Phase 6 section — covers `getLightLabel` ladder, outdoor/indoor branch, `getSeasonalInterval` export, i18n key presence assertions
- [ ] Export `getSeasonalInterval` from `plantLogic.ts` (prerequisite for smoke assertions)
- [ ] Add `src/utils/lightLabel.ts` — the utility under test

*(If the project uses a separate smoke file per phase like `scripts/phase-05-smoke.mjs`, create `scripts/phase-06-smoke.mjs` following the same single-compile-path policy.)*

---

## Sources

### Primary (HIGH confidence)

- Source code read directly: `src/components/PlantCard.tsx` — confirmed current nextWater block structure (lines 185-196), waterMode-awareness absent
- Source code read directly: `src/utils/plantLogic.ts` — confirmed `getSeasonalInterval` is private, `getNextWaterDate` signature, `getTasksForDay` waterMode dispatch
- Source code read directly: `src/utils/seasonality.ts` — confirmed `getWaterSeason` signature, WaterSeason type
- Source code read directly: `src/utils/migration.ts` — confirmed `sunHoursToLightLevel` thresholds, `SOIL_CHECK_DB_IDS`
- Source code read directly: `src/types/index.ts` — confirmed `Plant.typeId`, `Plant.lightLevel?`, `PlantDBEntry.category`, `Task.type` union includes `'check_soil'`
- Source code read directly: `src/screens/TodayScreen.tsx` — confirmed `plantsWithTasks` memo logic, "all caught up" condition, location destructuring
- Source code read directly: `src/components/MyPlantDetailModal.tsx` — confirmed legacy waterEvery/sunHours pills (lines 163-175), `latitude` prop already present
- Source code read directly: `src/components/PlantHealthDetail.tsx` — confirmed Phase 4 `sunHoursForDisplay` derivation, lightLevel-aware but still mapping to hours
- Source code read directly: `src/components/PlantDiagnosisModal.tsx` — confirmed AI payload preserved (lines 69-93), separate from user-visible row
- Source code read directly: `src/components/PlantDetailModal.tsx` — confirmed `PlantDBEntry` surface, `plant.sunHours` usage (line 97)
- Source code read directly: `src/components/PlantDatabaseCard.tsx` — confirmed badge structure `☀️ {plant.sunHours}h`
- Source code read directly: `src/i18n/locales/en/common.json` — confirmed existing `plantCard`, `plantDetail` key namespaces; confirmed NO existing `lightLevel.*` keys
- Source code read directly: `src/theme.ts` — confirmed `colors.bgSecondary`, `colors.textSecondary`, all referenced theme tokens exist
- Planning artifacts: `06-CONTEXT.md`, `05-CONTEXT.md`, `04-CONTEXT.md`, `STATE.md`, `REQUIREMENTS.md` — all decisions confirmed

### Secondary (MEDIUM confidence)

- n/a — all findings backed by direct source reads

### Tertiary (LOW confidence)

- `DiagnosisResults.tsx` not read — exact insertion point for diagnosis modal light row is unconfirmed. LOW confidence on implementation details for that specific file.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; no new packages
- Architecture: HIGH — all patterns verified against actual source files
- Pitfalls: HIGH — each pitfall derived from reading existing code
- i18n key inventory: HIGH — confirmed against both en/es common.json
- DiagnosisResults.tsx insertion point: LOW — file not read

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable codebase; no fast-moving external deps)
