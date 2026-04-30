# Technology Stack — v1.1 Precision Care

**Project:** My Garden Care (My Happy Garden)
**Milestone:** v1.1 Precision Care
**Researched:** 2026-04-29
**Mode:** Subsequent-milestone (additions/changes only)
**Overall confidence:** HIGH

## Bottom Line

**No new npm packages are required.** Every v1.1 capability can be built on top of the dependencies already declared in `package.json`. The work is type/schema changes, a small migration utility, a tiny pure-function module for hemisphere/season derivation, and reusing `expo-location` (already installed at `^19.0.8`). Zero new runtime dependencies keeps the install size, Expo SDK 54 compatibility surface, and OTA update story unchanged.

**The single most important deliverable is a versioned migration utility on top of AsyncStorage** — schema changes (sunHours → lightLevel, waterEvery → waterSchedule) are destructive renames against existing user data. This must be done robustly and idempotently in `useStorage.tsx` load path before anything else lands.

---

## Recommended Stack — Additions

### Pure-TS module (no new dep)

| Module | Location (proposed) | Purpose | Why no library |
|--------|---------------------|---------|----------------|
| Hemisphere/season derivation | `src/utils/season.ts` | From `Location.lat` and current month → `'warm' \| 'cold'` season key | 5–10 lines of arithmetic; `lat >= 0 ? 'north' : 'south'` then a 6-month lookup. A library (`spacetime` ~40KB, `date-season`) is gross overkill and adds bundle weight for a constant-time function. |
| Schema migration utility | `src/data/migrations.ts` | Versioned, idempotent migrations applied on AsyncStorage load | Hand-rolled is industry standard for AsyncStorage at this size. Libraries (e.g., redux-persist migrate) presume Redux. We don't have Redux. |
| Light-level → daily-light proxy | inside `plantLogic.ts` | Map `'direct' \| 'bright_indirect' \| 'medium_indirect' \| 'low'` → existing weather/sun-task logic | Domain-specific, no library exists for this. |

### Existing deps used in new ways

| Package | Already installed | New v1.1 use |
|---------|-------------------|--------------|
| `expo-location` `^19.0.8` | Yes | Onboarding location prompt step. Already used elsewhere — `Location.lat` already stored in `AppData.location`. **No new permission, no new entitlement.** |
| `@react-native-async-storage/async-storage` `^2.2.0` | Yes | Add a `schemaVersion` field to the persisted root payload. |
| `react-i18next` `^16.5.4` + `i18next` `^25.8.10` | Yes | New keys for light-level labels, watering modes, location-banner copy, paywall trigger from chat continuity. |
| `react-native-purchases` `^9.14.0` (RevenueCat) | Yes | Paywall trigger from "Continue chat" button — already wired, no new SDK calls. |

### What NOT to add — explicit rejections

| Tempting but rejected | Why not |
|----------------------|---------|
| **`spacetime`** (~40 KB) | Reads as overkill: we need exactly two outputs (hemisphere, current-season-bucket) from `lat` and `Date.now()`. Inline math is 10 lines. |
| **`date-season`** | Northern-hemisphere-only by default. Argentina is the secondary market — this is a regression, not a fix. |
| **`suncalc` / `suncalc3`** | Computes sunrise/sunset/azimuth. We already get sunrise/sunset from Open-Meteo's `daily.sunrise/sunset`. No need to compute client-side. |
| **A SQLite layer (`expo-sqlite`, WatermelonDB, Drizzle, Op-SQLite)** | The whole app is a single ~10–50 KB JSON blob. Migrating to SQL for a schema field rename would be a multi-week refactor against MVP gains. AsyncStorage with versioned migrations is the right tool at this scale. |
| **`zod` / `valibot` for runtime schema validation** | Tempting for migration safety, but adds 20–80 KB and a new mental model. The schema surface is small enough that hand-written type guards in `migrations.ts` are clearer and zero-cost. Revisit if schema complexity grows in v1.2+. |
| **`redux-persist` / `zustand/persist`** | Would require migrating off the existing `useStorage` Context+Ref pattern. Net negative unless we already wanted state-management migration. |
| **A horticultural API (Trefle, OpenFarm)** | Catalog values are static, hand-curated, and translated. Live API calls per plant would slow the app, complicate i18n, and require keys. Keep static `plantDatabase.ts`. |

---

## Schema Migration Approach

This is the load-bearing part of v1.1 — getting it right prevents data loss for every existing user.

### Current persisted root (storage key `'plant-agenda-v2'`)

Currently stored as `AppData` JSON, **with no version field**. `useStorage.tsx:147` does `JSON.parse` then field-by-field defaults (`data.plants || []`). There is no migration scaffolding anywhere in `src/`.

### Recommended pattern — versioned, additive, idempotent

```ts
// src/data/migrations.ts
export const CURRENT_SCHEMA_VERSION = 2;

type StoredV1 = AppDataV1 & { schemaVersion?: 1 | undefined };  // pre-v1.1
type StoredV2 = AppDataV2 & { schemaVersion: 2 };               // v1.1
type AnyStored = StoredV1 | StoredV2;

export function migrate(stored: AnyStored): AppDataV2 {
  let data: any = stored;
  const v = data.schemaVersion ?? 1;
  if (v < 2) data = migrateV1toV2(data);
  // Future: if (v < 3) data = migrateV2toV3(data);
  data.schemaVersion = CURRENT_SCHEMA_VERSION;
  return data;
}

function migrateV1toV2(d: AppDataV1): AppDataV2 {
  return {
    ...d,
    schemaVersion: 2,
    plants: d.plants.map(plantV1toV2),
  };
}

function plantV1toV2(p: PlantV1): PlantV2 {
  return {
    ...p,
    lightLevel: deriveLightLevel(p.sunHours),       // 0–2 → low, 3–4 → medium_indirect, 5–6 → bright_indirect, 7+ → direct
    waterMode: p.typeId.match(/cact|sucul/i) ? 'soil_check' : 'fixed',
    waterSchedule: {
      warm: p.waterEvery,
      cold: Math.round(p.waterEvery * 1.5),         // colder months → ~50% longer between waterings (conservative)
    },
    // sunHours: p.sunHours,                        // KEEP for now — see below
  };
}
```

### Integration with `useStorage.tsx`

In `loadData()` (currently lines 144–207), replace the raw `JSON.parse` path:

```ts
const stored = await AsyncStorage.getItem(STORAGE_KEY);
if (stored) {
  const raw = JSON.parse(stored);
  const data = migrate(raw);                    // <-- new
  // ...continue with existing field-by-field defaults from `data`
  if (raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    // Persist migrated shape immediately so we don't re-migrate next launch
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
```

### Migration safety rules (locked in)

1. **Keep `STORAGE_KEY = 'plant-agenda-v2'` unchanged.** The version is *inside* the payload, not in the key. Changing the key means orphaned data; we already lived through that once (`-v2` suffix in the key suggests a prior migration).
2. **Migrations are pure functions, no I/O.** Easy to unit-test (when we add tests in a future milestone) and reason about.
3. **Migrations run before state hydration.** React state never sees pre-v2 shapes.
4. **One-shot persist after migration.** The migrated payload is written back synchronously the first time we load it, so subsequent launches are zero-cost.
5. **Never delete fields in the same migration that introduces replacements.** See `sunHours` retention below.
6. **Confidence:** HIGH — pattern is the standard advice in the React Native community ([DEV: Versioned persisted state](https://dev.to/sebastian_thiebaud_3f06ad/a-simple-pattern-for-versioned-persisted-state-in-react-native-ll6), [LinkedIn: Versioned migration of local data](https://www.linkedin.com/pulse/versioned-migration-local-data-react-native-amal-jose-)).

### Should `sunHours` be dropped?

**Recommendation: keep it on `Plant` and `PlantDBEntry` as a deprecated/optional field for one milestone.** Concretely:

```ts
interface Plant {
  // ...
  /** @deprecated since v1.1 — use lightLevel. Retained for outdoor plants & rollback safety. */
  sunHours?: number;
  lightLevel: 'direct' | 'bright_indirect' | 'medium_indirect' | 'low';
  // ...
}
```

**Rationale:**
- Outdoor plants meaningfully differ between "needs 6+ hrs direct sun" and "tolerates 3 hrs direct sun" even within `lightLevel: 'direct'`. Sun *quantity* is a real second axis for outdoor plants and the catalog rebalance adds 10–15 of these. Don't delete the data we have.
- Keeping it optional lets the migration be reversible if we hit a bug post-release.
- Plant identification (`IdentifiedPlant`) and the edge function still return `sunHours` — keeping the field aligned avoids edge-function contract churn.
- Drop in a future v1.2+ migration only if it's still unused. Cheap to keep, expensive to bring back if we cut it now.

The migration *adds* `lightLevel` derived from `sunHours`; both coexist. UI prefers `lightLevel` for indoor plants and can use `sunHours` as a tiebreaker / detail line for outdoor plants.

### Confidence per migration choice

| Choice | Confidence | Source |
|--------|------------|--------|
| Versioned in-payload schemaVersion | HIGH | Standard React Native pattern, multiple credible sources |
| Idempotent migrate() called on load | HIGH | Same |
| Keep STORAGE_KEY unchanged | HIGH | Reasoning from existing key history |
| Keep `sunHours` as optional | MEDIUM | Pragmatic call; revisit when catalog rebalance is done |
| `cold = warm * 1.5` heuristic | LOW | Placeholder. Catalog rebalance phase should set per-plant cold values explicitly; this is only the migration default. Flag for FEATURES.md / catalog review. |
| Cactus/succulent → `soil_check` via regex on `typeId` | LOW | Quick heuristic. Better: explicit `category === 'suculentas'` check against `PlantDBEntry`. Validate against `plantDatabase.ts` IDs at implementation. |

---

## Hemisphere / Season Derivation

### Recommendation: write inline (~10 LOC), no dependency

```ts
// src/utils/season.ts
export type SeasonKey = 'warm' | 'cold';
export type Hemisphere = 'north' | 'south';

export function hemisphereOf(lat: number): Hemisphere {
  return lat >= 0 ? 'north' : 'south';
}

/** Returns the broad watering bucket — warm (longer days, faster drying) vs cold. */
export function seasonOf(lat: number, date: Date = new Date()): SeasonKey {
  const m = date.getMonth(); // 0 = Jan, 11 = Dec
  const h = hemisphereOf(lat);
  // Warm = late spring through early autumn in each hemisphere
  // Northern: Apr–Sep (months 3–8). Southern: Oct–Mar (months 9–11, 0–2).
  if (h === 'north') return m >= 3 && m <= 8 ? 'warm' : 'cold';
  return m >= 3 && m <= 8 ? 'cold' : 'warm';
}

export function waterIntervalFor(plant: Plant, lat: number, now: Date = new Date()): number {
  if (plant.waterMode === 'soil_check') return plant.waterSchedule.warm; // user-driven
  return plant.waterSchedule[seasonOf(lat, now)];
}
```

### Why not `spacetime`?

- ~40 KB minified ([spacetime npm](https://github.com/spencermountain/spacetime)) for what is six lines of arithmetic.
- Spacetime's `season()` returns four-season strings (`spring/summer/autumn/winter`); we need a two-bucket model anyway, so we'd be remapping its output.
- Adds a transitive timezone-data dependency we don't otherwise need.
- **Verdict: REJECTED.** The ten-line module above is testable, debuggable, and zero-byte cost.

### Why a 2-bucket warm/cold and not 4 seasons?

Plant-care literature treats watering primarily as a binary "growing season vs dormant season" decision; finer granularity (4 seasons) creates UX confusion ("why is the September interval different from October?") without proportional accuracy gains. Locked in by the existing `waterSchedule: { warm, cold }` shape in the milestone brief.

**Confidence:** HIGH (math), MEDIUM (month boundaries — March/April and September/October are fuzzy in practice; document the rule as "approximate growing-season buckets" rather than "astronomical seasons").

---

## Light-Classification Reference Sources

The catalog rebalance needs *defensible* light-level assignments. There is **no canonical machine-readable taxonomy** — even the RHS uses prose ("bright, indirect light", "low to medium, indirect light") rather than enumerated levels. Recommendation: pick our four-level taxonomy intentionally and map authoritatively-described values into it.

### Suggested taxonomy mapping (for FEATURES.md / catalog work)

| Our enum | Foot-candles (informal) | RHS-style description | Real-world placement |
|----------|------------------------|----------------------|----------------------|
| `direct` | 2,000+ fc | "Full sun" / "bright direct" | South-facing window, outdoor patio, full-sun garden |
| `bright_indirect` | 1,000–2,000 fc | "Bright, indirect light" | Near sunny window, no direct rays |
| `medium_indirect` | 250–1,000 fc | "Low to medium, indirect light" | Middle of a well-lit room |
| `low` | <250 fc | "Low light" / "shade" | Bathroom, hallway, far from windows |

Foot-candle ranges are commonly cited but **not standardized** ([JOMO Studio guide](https://jomostudio.com/blogs/plant-with-jomo/the-ultimate-houseplant-lighting-guide), [Plantophiles light guide](https://plantophiles.com/houseplant-tips/light-levels-for-plants/)). We don't ship the numbers — we ship the four-bucket UX.

### Authoritative sources to cross-reference during catalog rebalance

| Source | Use | Confidence |
|--------|-----|------------|
| [RHS houseplant care guides](https://www.rhs.org.uk/plants/types/houseplants/houseplant-101/episode-two) | Royal Horticultural Society — generally the gold standard for plain-language light requirements | HIGH |
| [RHS shade-tolerant houseplants list](https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-shade) | Direct mapping for `low` bucket | HIGH |
| [RHS sun-loving houseplants list](https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-sunlight) | Direct mapping for `direct` / `bright_indirect` | HIGH |
| [UMN Extension — Lighting for indoor plants](https://extension.umn.edu/planting-and-growing-guides/lighting-indoor-plants) | University extension service, scientifically grounded | HIGH |
| [House Plant Journal — Bright Indirect Light by Plant Type](https://www.houseplantjournal.com/bright-indirect-light-requirements-by-plant/) | Practitioner-focused, well-known author (Darryl Cheng) | MEDIUM |
| Existing `plantDatabase.ts` `sunHours` field | Pre-translated into our tone & language | HIGH (for already-curated plants) |

**No library dependency** — these are reference materials for a human (or AI-assisted) catalog edit pass, not runtime data.

**Confidence on no-library-needed:** HIGH. Verified by survey: there is no maintained npm package mapping plant species → light requirements. Trefle and OpenFarm exist as APIs, but require keys, network calls, and offer botanical metadata far broader than what we need. Static curation in `plantDatabase.ts` remains the right approach.

---

## Versions Table — Already Installed (No Changes)

All versions verified against `package.json` and Expo SDK 54 compatibility (Expo's auto-version policy via `npx expo install` keeps these aligned).

| Package | Installed version | v1.1 use | Verified |
|---------|-------------------|----------|----------|
| `expo` | `~54.0.33` | Runtime — unchanged | HIGH |
| `expo-location` | `^19.0.8` | Onboarding location prompt, hemisphere derivation | HIGH ([Expo docs](https://docs.expo.dev/versions/latest/sdk/location/)) |
| `@react-native-async-storage/async-storage` | `^2.2.0` | Add `schemaVersion` to root payload | HIGH |
| `react-i18next` / `i18next` | `^16.5.4` / `^25.8.10` | New light/water/location/paywall keys | HIGH |
| `react-native-purchases` | `^9.14.0` | Paywall trigger on Continue-chat (no API change) | HIGH |
| `@react-navigation/bottom-tabs` | `^7.12.0` | Banner UI in Hoy — no nav change | HIGH |
| `expo-localization` | `~17.0.8` | Already used for i18n detection | HIGH |

**No new packages added.** No `package.json` change is necessary for v1.1 Precision Care.

---

## Integration Points with `useStorage`

Reviewed `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useStorage.tsx` end-to-end. The integration surface is small and surgical:

| Touchpoint | File:line | Change |
|------------|-----------|--------|
| Load path | `useStorage.tsx:147–199` | Wrap `JSON.parse(stored)` in `migrate()`; persist back if version changed. |
| `Plant` shape | `types/index.ts:17–38` | Add `lightLevel`, `waterSchedule`, `waterMode`. Mark `sunHours` and `waterEvery` as optional (`@deprecated`). |
| `updatePlant` | `useStorage.tsx:259` | No code change — `Partial<Plant>` already accepts new fields. |
| Onboarding | `completeOnboardingWithData` `useStorage.tsx:323` | New plants must already have `lightLevel`, `waterSchedule`, `waterMode` set by the onboarding screens (responsibility shifts to UI layer). |
| Location storage | `updateLocation` `useStorage.tsx:310` | No change — already supports `Location \| null`. The new banner reads from `state.location`. |
| Plant-create flows | All call sites of `addPlant` / `addPlants` | Need to set new fields. Migration handles existing data; new code paths must be updated. |

**No changes required to** `StorageContext` shape, the debounced save (`scheduleSave`, line 128), the unmount flush (line 210), or any of the diagnosis/shopping-list mutations.

---

## Pre-flight Checklist for v1.1 Roadmap

1. **Phase 1 — Schema & migration foundation** must land before any UI work.
   - Add `schemaVersion` to persisted payload.
   - Implement `migrate()` and `plantV1toV2()`.
   - Update `Plant`, `PlantDBEntry`, `IdentifiedPlant` types.
   - Smoke-test on a device with existing user data (worst case: factory user with v1.0 data).

2. **Phase 2 — Pure logic modules** can land in parallel once types exist.
   - `src/utils/season.ts`
   - Update `plantLogic.ts` `getTasksForDay()` to consult `waterIntervalFor(plant, lat)`.
   - Update `plantHealth.ts` to use `lightLevel` for severity scoring.

3. **Phase 3 — UI** (location prompt, banner, light/water selectors, continue-chat ungate).

4. **Phase 4 — Catalog rebalance** is the last step because it depends on (a) the new fields existing in types and (b) the human curation pass to set values.

---

## Open Questions for Roadmapper / Planners

1. **Cold-season interval default per plant** — the migration's `cold = warm * 1.5` is a placeholder. Should the catalog rebalance phase set `cold` explicitly per `PlantDBEntry`, then re-migrate existing user plants whose `typeId` matches a known DB entry? (Recommendation: yes; flag as a sub-task in catalog phase.)
2. **`waterMode` heuristic** — defaulting to `soil_check` for cacti/succulents is right, but the migration uses a regex on `typeId`. Better to switch to `category === 'suculentas'` once we confirm `typeId` ↔ `databaseId` linkage in current user data.
3. **Outdoor plants and `lightLevel`** — for outdoor plants, "direct sun" alone underspecifies. Recommend keeping `sunHours` as a *secondary* field shown in plant detail for outdoor entries only. Decision deferred to FEATURES.md.
4. **Schema-version regression test strategy** — without a test framework, there is no automated guard against migration regressions. Suggest a hand-run "migration smoke test" doc step (load fixture v1 JSON in dev, verify migrated shape) until a test runner is added.

---

## Sources

- [Expo Location SDK docs](https://docs.expo.dev/versions/latest/sdk/location/) — HIGH
- [DEV: A simple pattern for versioned persisted state in React Native](https://dev.to/sebastian_thiebaud_3f06ad/a-simple-pattern-for-versioned-persisted-state-in-react-native-ll6) — MEDIUM
- [LinkedIn: Versioned migration of local data in React Native AsyncStorage](https://www.linkedin.com/pulse/versioned-migration-local-data-react-native-amal-jose-) — MEDIUM
- [React Native School: Migrating Data in AsyncStorage](https://www.reactnativeschool.com/migrating-data-in-asyncstorage/) — MEDIUM
- [How to Persist State with AsyncStorage and MMKV in React Native (2026)](https://oneuptime.com/blog/post/2026-01-15-react-native-asyncstorage-mmkv/view) — MEDIUM
- [spacetime npm package](https://github.com/spencermountain/spacetime) — HIGH (rejection rationale)
- [date-season npm package](https://www.npmjs.com/package/date-season) — HIGH (rejection rationale)
- [RHS Houseplant 101 — Episode Two](https://www.rhs.org.uk/plants/types/houseplants/houseplant-101/episode-two) — HIGH (catalog reference)
- [RHS shade-tolerant houseplants](https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-shade) — HIGH
- [RHS sun-loving houseplants](https://www.rhs.org.uk/shows-events/rhs-urban-show/houseplant-profiles/houseplants-for-sunlight) — HIGH
- [UMN Extension: Lighting for indoor plants](https://extension.umn.edu/planting-and-growing-guides/lighting-indoor-plants) — HIGH
- [House Plant Journal: Bright Indirect Light by Plant Type](https://www.houseplantjournal.com/bright-indirect-light-requirements-by-plant/) — MEDIUM
- [JOMO Studio: Houseplant Lighting Guide](https://jomostudio.com/blogs/plant-with-jomo/the-ultimate-houseplant-lighting-guide) — MEDIUM
- [Plantophiles: Light levels for plants](https://plantophiles.com/houseplant-tips/light-levels-for-plants/) — LOW
