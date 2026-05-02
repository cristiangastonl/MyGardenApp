# Architecture Research

**Domain:** v1.2 Recommendation-First Plant Guide — integration with existing My Garden Care app
**Researched:** 2026-05-01
**Confidence:** HIGH (code read directly; library research verified via official docs and WebSearch)

## Integration Points Table

Each v1.2 feature mapped to existing files it touches, new files it requires, and breaking-change risk.

| Feature | Affects (modified files) | New files | Breaking risk |
|---------|--------------------------|-----------|---------------|
| Catalog content extension (careAction, placement*, whyRationale) | `src/types/index.ts`, `src/data/plantDatabase.ts`, `scripts/check-i18n-keys.mjs`, `src/i18n/locales/{en,es}/plants.json` | None | NONE — additive optional fields |
| Detail modal 4-section redesign | `src/components/MyPlantDetailModal.tsx` | `src/components/PlantDetail/` (section subcomponents) | LOW — internal refactor, same external props |
| Bottom sheets | `App.tsx` (provider hierarchy), screens that use bottom sheets | `src/components/ActionSheet/` or per-use `*Sheet.tsx` | MEDIUM — new native deps; requires dev-client build |
| Swipe-to-delete on PlantCard | `src/components/PlantCard.tsx` | None | MEDIUM — wraps existing TouchableOpacity in Swipeable |
| Plant journal | `src/types/index.ts`, `src/hooks/useStorage.tsx` | `src/components/PlantJournal/` | LOW — additive optional AppData field; no schema bump |
| Pet toxicity | `src/types/index.ts`, `src/data/plantDatabase.ts`, `src/i18n/locales/{en,es}/common.json` | `src/components/ToxicityBadge.tsx` | NONE — additive optional catalog field |
| Fertilization schedule | `src/types/index.ts`, `src/hooks/useStorage.tsx` (updatePlant covers it), `src/utils/plantLogic.ts`, `src/utils/notificationScheduler.ts`, `src/i18n/locales/{en,es}/common.json` | `src/utils/fertilizeLogic.ts` | LOW — additive Plant field; Task union extends |
| Streaks | `src/utils/plantHealth.ts` or standalone util | `src/utils/streaks.ts` | NONE — pure derived data; zero storage change |
| Haptic feedback | Call sites in PlantCard, TaskButton, etc. | None (use expo-haptics) | NONE — additive calls |
| Skeleton loaders | Loading states in existing components | `src/components/SkeletonCard.tsx` | NONE — additive |
| PlantCard cleanup (10 elements to 5) | `src/components/PlantCard.tsx` | None | LOW — visual refactor, no logic change |
| UAT bug fixes | `src/utils/plantLogic.ts`, `src/components/PlantIdentifier/`, `src/theme.ts` | None | LOW |

---

## Feature-by-Feature Integration Analysis

### 1. Catalog Content Extension

**New fields on PlantDBEntry (all optional):**

```typescript
// Additive additions to src/types/index.ts PlantDBEntry interface
careAction?: string;              // What the user should do — actionable, one sentence
placementRecommended?: string;    // Best placement
placementAlternatives?: string;   // Acceptable alternatives
placementAvoid?: string;          // Where NOT to place it
whyRationale?: string;            // Horticultural reason behind the recommendation
```

**Schema migration impact:** NONE. `CURRENT_SCHEMA_VERSION` stays at `1`. These are catalog fields on `PlantDBEntry` in `src/data/plantDatabase.ts`, not persisted in `AppData`. They are read-only compile-time constants. The versioned envelope (`PersistedAppData`) only wraps `AppData`; catalog content is never written to AsyncStorage. No `runMigrations()` changes needed.

**i18n impact:** Currently `plants.json` has 65 entries, each with keys: `name`, `tip`, `description`, `problems`, `nutrients` (optional in TS but present for 64/65 entries). Adding 5 new optional keys to all 65 entries across 2 locales = up to 650 new string keys. Not all entries need all 5 fields — skip fields that don't apply to a species. Realistic count: ~3 meaningful new keys per entry average = ~390 new strings total.

**CI guard updates:** `scripts/check-i18n-keys.mjs` currently validates `name`, `tip`, `description`, `problems`, `nutrients`. Add conditional checks after line 66 (nutrients check) that validate new fields **only when the PlantDBEntry declares them** — same conditional pattern already used for nutrients:

```javascript
// Pattern already established — replicate for each new field:
if (entry.nutrients) {
  if (!node.nutrients || typeof node.nutrients !== 'object') { ... }
}
// New blocks for v1.2:
if (entry.careAction !== undefined) {
  if (!node.careAction) errors.push(`[${locale}] "${entry.id}".careAction missing`);
}
if (entry.placementRecommended !== undefined) {
  if (!node.placementRecommended) errors.push(`[${locale}] "${entry.id}".placementRecommended missing`);
}
// ... same for placementAlternatives, placementAvoid, whyRationale
```

**getTranslatedPlant extension:** `getTranslatedPlant()` in `plantDatabase.ts` merges i18n strings onto the base entry. Add the 5 new fields to this merge, each guarded by presence check: `...(i18nEntry.careAction ? { careAction: i18nEntry.careAction } : {})`.

**Files modified:** `src/types/index.ts`, `src/data/plantDatabase.ts`, `scripts/check-i18n-keys.mjs`, `src/i18n/locales/en/plants.json`, `src/i18n/locales/es/plants.json`
**Files created:** None

---

### 2. Detail Modal Restructure (4-Section Redesign)

**Current structure:** `MyPlantDetailModal.tsx` (~320 lines) — single-file component with: image header, info pills (water interval + light label season badge), diagnose button, nutrients section, active problems, diagnosis history, photo album, delete button. Local state: `showDiagnosis`, `selectedDiagnosis`, `resumeDiagnosis`. External props: `visible`, `plant`, `weather`, `latitude`, `onClose`, `onDelete`, `onAddPhoto`, `onDeletePhoto`.

**v1.2 structure:** 4 sections inside the same modal scroll: "Que hacer?" (care action + diagnose), "Donde ponerla?" (placement + light label), "Por que?" (rationale + nutrients), "Tus ajustes" (water schedule, delete, photos).

**Decomposition strategy:** Extract section components into `src/components/PlantDetail/` — mirrors existing `PlantIdentifier/` and `PlantDiagnosis/` multi-file patterns.

```
src/components/PlantDetail/
  index.ts                 — re-export MyPlantDetailModal (no change to import sites)
  CareActionSection.tsx    — careAction from catalog + diagnose button
  PlacementSection.tsx     — placement fields + light label badge
  WhySection.tsx           — whyRationale + nutrients
  UserSettingsSection.tsx  — water schedule editor, photo album, delete
```

`MyPlantDetailModal.tsx` becomes an orchestrator: imports section components, owns local modal state, passes `plant`, `dbEntry`, `season`, `waterInterval`, `lightLabel` as props. The external `MyPlantDetailModalProps` interface does not change.

**Reuse PlantHealthDetail patterns:** Yes. `PlantHealthDetail.tsx` is the reference for conditional section rendering, `getLightLabel(plant, t)` for light label, `waterSchedule.warm` for interval display, ScrollView + per-component StyleSheet. Section layout should follow same visual grammar (card containers, spacing from theme.ts).

**No nested-navigator concern:** Maintains existing pattern — `PlantDiagnosisModal` and `DiagnosisDetailModal` are sibling modals controlled by local state flags. The redesign does not introduce new navigation. Sections are scrolled content within the existing `Modal`, not separate screens.

**Files modified:** `src/components/MyPlantDetailModal.tsx` (refactored to orchestrator)
**Files created:** `src/components/PlantDetail/index.ts`, `CareActionSection.tsx`, `PlacementSection.tsx`, `WhySection.tsx`, `UserSettingsSection.tsx`

---

### 3. Bottom Sheets + Swipe Gestures

**Current state:** `react-native-reanimated`, `react-native-gesture-handler`, and `@gorhom/bottom-sheet` are NOT installed (confirmed by reading `package.json`). `expo-haptics` is also absent.

**Installation:**

```bash
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler expo-haptics
```

`npx expo install` pins Expo SDK 54-compatible versions automatically. Expo SDK 54 requires Reanimated v4.1.x (supports New Architecture only — Expo SDK 54 defaults to New Architecture). The Reanimated Babel plugin is configured automatically by `babel-preset-expo`; no `babel.config.js` needs to be created. After install, run `npx expo start --clear` to clear the Metro bundle cache.

**GestureHandlerRootView + BottomSheetModalProvider in App.tsx:**

Current provider hierarchy (App.tsx, confirmed by direct read):
```
SafeAreaProvider
  └── (fonts loading guard)
        └── StorageProvider
              └── PremiumProvider
                    └── AppContentMVP
                          └── NavigationContainer
                                └── MainTabs
```

Required v1.2 hierarchy:
```
SafeAreaProvider
  └── GestureHandlerRootView (style={{ flex: 1 }})
        └── StorageProvider
              └── PremiumProvider
                    └── BottomSheetModalProvider
                          └── AppContentMVP
                                └── NavigationContainer
                                      └── MainTabs
```

Ordering rationale (from gorhom/react-native-bottom-sheet issue #1389 and #1846, MEDIUM confidence): `GestureHandlerRootView` must be the outermost gesture boundary — crashes if absent. `BottomSheetModalProvider` renders sheets via a portal-like layer and must be inside `GestureHandlerRootView` but wrapping the navigation container so sheet portals are accessible from any screen. `SafeAreaProvider` stays outermost for inset propagation. The existing `PaywallModal` uses React Native's native `Modal` (not bottom-sheet) and is unaffected by this change.

**Swipeable on PlantCard:** `Swipeable` from `react-native-gesture-handler` wraps the card's root view. Import: `import Swipeable from 'react-native-gesture-handler/Swipeable'`. The existing tap handler (`onPress`) on `TouchableOpacity` continues to fire normally — `Swipeable` intercepts only horizontal pan gestures above a velocity threshold. The `renderRightActions` prop renders a red delete affordance. `onSwipeableOpen('right')` triggers `onDelete(plant.id)` after a haptic.

**Gesture conflict risk with FlatList scroll:** LOW but documented. If PlantCard is inside a FlatList with a PanGestureHandler, there can be gesture priority conflicts. Mitigation: set `friction={2}` on Swipeable, which is the standard published pattern. If conflicts persist, `simultaneousHandlers` or `waitFor` refs from RNGH are the resolution path.

**Files modified:** `App.tsx` (provider wrap), `src/components/PlantCard.tsx` (Swipeable + haptics)
**Files created:** `src/components/ActionSheet/` or per-use `*Sheet.tsx` components (e.g., `QuickActionsSheet.tsx`)

---

### 4. Plant Journal

**AppData change (additive, no schema bump):**

```typescript
// src/types/index.ts — new types
export interface JournalEntry {
  id: string;
  plantId: string;
  date: string;           // ISO date "YYYY-MM-DD"
  text: string;
  photoUri?: string | null;
}

// AppData addition — optional, defaults to {} at load time
journals?: Record<string, JournalEntry[]>;  // keyed by plantId
```

**Why no schema version bump:** The v1.1 precedent (SCHEMA-08 stance, documented in migration.ts line 19 comment) treats additive optional fields as non-breaking. `climateOverride` used this exact pattern — added as `ClimateOverride?` to AppData, defaulted to `'auto'` at runtime, no `CURRENT_SCHEMA_VERSION` bump. Journal follows identically: `journals` absent in stored data → default to `{}` in `StorageProvider`.

**useStorage.tsx changes:** Three locations require update:
1. `useState` initial value: add `const [journals, setJournals] = useState<Record<string, JournalEntry[]>>({});`
2. `dataRef.current` initial object: add `journals: {}`
3. `snapshotFromRef()` return object: add `journals: d.journals`

Add to `StorageActions`:
- `addJournalEntry(plantId: string, entry: JournalEntry): void`
- `deleteJournalEntry(plantId: string, entryId: string): void`
- `getJournalEntriesForPlant(plantId: string): JournalEntry[]`

The existing `scheduleSave` debounce handles persistence transparently — no change to save path.

**Load-time default:** In the `loadData` useEffect, after `runMigrations`, add: `if (!data.journals) data.journals = {};` — same pattern as the existing `if (!data.climateOverride) data.climateOverride = 'auto'` guard.

**Sync impact:** Deferred. When auth milestone ships, journals sync via new Supabase `journals` table. At that point: add DB type to `src/types/database.ts` (snake_case), extend `syncService.ts` converters with camelCase↔snake_case transform. For v1.2, journal is local-only.

**Files modified:** `src/types/index.ts`, `src/hooks/useStorage.tsx`
**Files created:** `src/components/PlantJournal/index.ts`, `JournalEntryList.tsx`, `JournalEntryForm.tsx`

---

### 5. Pet Toxicity

**Catalog field (additive, no storage impact):**

```typescript
// src/types/index.ts — new types
export type ToxicityLevel = 'safe' | 'toxic' | 'mild' | 'unknown';

export interface PetToxicity {
  cats: ToxicityLevel;
  dogs: ToxicityLevel;
}

// Addition to PlantDBEntry
petToxicity?: PetToxicity;
```

**i18n placement — common.json, not plants.json:** Toxicity values are a closed 4-value enum. Put labels in `common.json` under `petSafety.*` (`petSafety.safe`, `petSafety.toxic`, `petSafety.mild`, `petSafety.unknown`, `petSafety.cats`, `petSafety.dogs`). This avoids repeating the same 4 strings 65 times per locale. The badge component uses the enum value as a lookup key: `t('petSafety.' + toxicityLevel)`.

**UI surface — recommendation:** Show only when the species is toxic (`toxic` or `mild`). Safe plants need no badge (reduces visual noise on PlantCard, consistent with the "reduce 10 elements to 5" goal). Detail modal section always shows the full toxicity info. Catalog filter deferred until EXPLORE_TAB ships.

**CI guard:** No guard change required. Toxicity labels live in common.json (not checked by check-i18n-keys.mjs which only validates plants.json).

**Files modified:** `src/types/index.ts`, `src/data/plantDatabase.ts` (add petToxicity per entry), `src/i18n/locales/en/common.json`, `src/i18n/locales/es/common.json`
**Files created:** `src/components/ToxicityBadge.tsx`

---

### 6. Fertilization Schedule

**Data model — mirrors water schedule structure:**

```typescript
// src/types/index.ts

export interface FertilizeSchedule {
  intervalDays: number;     // days between fertilizations (e.g. 14 or 30)
  lastFertilized?: string;  // ISO date string; null = never fertilized
}

// Addition to Plant (optional, additive)
fertilizeSchedule?: FertilizeSchedule;
```

**Task union extension:**

```typescript
// Task.type union — extend to add 'fertilize'
export interface Task {
  type: "water" | "sun" | "outdoor" | "check_soil" | "fertilize";
  icon: string;
  label: string;
  plantId: string;
}
```

**CRITICAL — discriminator exhaustion:** Adding `'fertilize'` to the Task type union will cause tsc to fail at every switch/if-chain that exhausts the `task.type` discriminator. The Phase 5 experience with `'check_soil'` documents the exact pattern: search for all `task.type` switch statements and add `'fertilize'` branches before running `tsc --noEmit`. Affected files from the `check_soil` Phase 5 plans: `DayDetail.tsx`, `DayDetailModal.tsx`, `MonthCalendar.tsx`, `TaskButton.tsx`, and `notificationScheduler.ts`.

**Pure util:**

```typescript
// src/utils/fertilizeLogic.ts
import { Plant } from '../types';
import { parseDate, addDays, isSameDay } from './dates';

export function getNextFertilizeDate(plant: Plant, today: Date): Date | null {
  if (!plant.fertilizeSchedule) return null;
  const { intervalDays, lastFertilized } = plant.fertilizeSchedule;
  if (!lastFertilized) return today; // Never fertilized → due today
  const last = parseDate(lastFertilized);
  let next = addDays(last, intervalDays);
  while (next < today) next = addDays(next, intervalDays);
  return next;
}
```

**getTasksForDay extension:** Add fertilize branch after the water/soil-check block:

```typescript
if (plant.fertilizeSchedule) {
  const nextFertilize = getNextFertilizeDate(plant, day);
  if (nextFertilize && isSameDay(nextFertilize, day)) {
    tasks.push({
      type: 'fertilize',
      icon: '🌿',
      label: i18n.t('tasks.fertilize', { name: p.name }),
      plantId: p.id,
    });
  }
}
```

**updatePlant compatibility:** `updatePlant(id, updates: Partial<Plant>)` already accepts any Plant partial. Marking a fertilization done: `updatePlant(plantId, { fertilizeSchedule: { ...plant.fertilizeSchedule, lastFertilized: todayStr } })`. No new action needed.

**Notification scheduler:** `notificationScheduler.ts` calls `getTasksForDay()` internally. If `getTasksForDay` includes `'fertilize'` tasks, the morning notification content builder picks them up via the tasks array. The only required change is adding a `'fertilize'` case to any switch that dispatches on `task.type` within the scheduler.

**Catalog default interval:** Add optional `fertilizeSchedule?: { intervalDays: number }` to PlantDBEntry (no `lastFertilized` on catalog entries — that is per-user-plant data). When a user adds a plant from catalog, pre-populate `Plant.fertilizeSchedule.intervalDays` from the catalog default.

**Files modified:** `src/types/index.ts`, `src/utils/plantLogic.ts`, `src/utils/notificationScheduler.ts`, `src/components/DayDetail.tsx`, `src/components/DayDetailModal.tsx`, `src/components/MonthCalendar.tsx`, `src/components/TaskButton.tsx`, `src/i18n/locales/{en,es}/common.json`, `src/data/plantDatabase.ts`
**Files created:** `src/utils/fertilizeLogic.ts`

---

### 7. Streaks

**Derived vs. cached — recommendation: pure derived data.**

The "cached streak" approach (`Plant.streak: number`) fails in a predictable way: device clock changes, app reinstalls, or any path that bypasses the increment code causes the count to go stale with no clean recovery. This has no fix without a full watering history log.

The derived approach works with data already persisted: `lastWatered` (ISO date string on Plant) + `waterSchedule` + today's date. Streak calculation is O(1) arithmetic — same order as health scoring, which already runs per-render.

**Hard limitation to document:** Without a watering history array, you can only determine "is on schedule today" and "was on schedule yesterday". You cannot reconstruct a true N-day consecutive streak from a single `lastWatered` timestamp. For v1.2's goal of "light celebration toasts" this is sufficient — a toast saying "Vas bien con el riego!" when the plant is on schedule is correct. Do not display a specific streak count (e.g., "5-day streak") unless you introduce a `streakStartDate?: string` anchor on Plant or a journal history.

**Implementation:**

```typescript
// src/utils/streaks.ts (new pure util)
import { Plant } from '../types';
import type { WaterSeason } from './seasonality';
import { getNextWaterDate } from './plantLogic';
import { daysBetween, parseDate } from './dates';

export interface WaterStreakStatus {
  isOnSchedule: boolean;  // True if plant is on-schedule today (watered within interval)
  isConsecutive: boolean; // True if on-schedule both today and yesterday
}

export function getWaterStreakStatus(plant: Plant, today: Date, season: WaterSeason): WaterStreakStatus {
  if (!plant.lastWatered) return { isOnSchedule: false, isConsecutive: false };
  const daysSinceWatered = daysBetween(parseDate(plant.lastWatered), today);
  const interval = plant.waterSchedule?.warm ?? plant.waterEvery ?? 7;
  const isOnSchedule = daysSinceWatered <= interval;
  // Consecutive: was also on-schedule yesterday (daysSince <= interval and >= 1)
  const isConsecutive = isOnSchedule && daysSinceWatered >= 1;
  return { isOnSchedule, isConsecutive };
}
```

**Celebration toast:** A simple animated `View` overlay in TodayScreen or TaskButton. No new complex component required — `expo-haptics.notificationAsync(NotificationFeedbackType.Success)` on task completion + a brief floating text that auto-dismisses. Not persisted, not tracked.

**Files modified:** None to existing files for core logic.
**Files created:** `src/utils/streaks.ts`

---

## New vs. Modified Files Inventory

**New files:**

```
src/
├── components/
│   ├── PlantDetail/
│   │   ├── index.ts
│   │   ├── CareActionSection.tsx
│   │   ├── PlacementSection.tsx
│   │   ├── WhySection.tsx
│   │   └── UserSettingsSection.tsx
│   ├── PlantJournal/
│   │   ├── index.ts
│   │   ├── JournalEntryList.tsx
│   │   └── JournalEntryForm.tsx
│   ├── ToxicityBadge.tsx
│   └── (ActionSheet/ or per-use *Sheet.tsx for bottom sheets)
└── utils/
    ├── fertilizeLogic.ts
    └── streaks.ts
```

**Modified files:**

```
src/types/index.ts
  — JournalEntry, FertilizeSchedule, PetToxicity, ToxicityLevel (new types)
  — Task.type union: add 'fertilize'
  — PlantDBEntry: add careAction, placement*, whyRationale, petToxicity, fertilizeSchedule (all optional)
  — Plant: add fertilizeSchedule (optional)
  — AppData: add journals? (optional)

src/hooks/useStorage.tsx
  — journals state + dataRef + snapshotFromRef
  — addJournalEntry, deleteJournalEntry, getJournalEntriesForPlant actions
  — load-time default: journals = {}

src/data/plantDatabase.ts
  — add petToxicity, fertilizeSchedule.intervalDays, careAction, placement*, whyRationale per entry

src/utils/plantLogic.ts
  — getTasksForDay: add 'fertilize' task branch

src/utils/notificationScheduler.ts
  — handle 'fertilize' task type in notification content builder

src/components/DayDetail.tsx
src/components/DayDetailModal.tsx
src/components/MonthCalendar.tsx
src/components/TaskButton.tsx
  — add 'fertilize' branch to all task.type discriminator switches (same pattern as 'check_soil' in Phase 5)

src/components/MyPlantDetailModal.tsx
  — decompose to orchestrator; import PlantDetail/ section components

src/components/PlantCard.tsx
  — Swipeable wrapper
  — optional ToxicityBadge for toxic species
  — haptic feedback on task completion

App.tsx
  — GestureHandlerRootView + BottomSheetModalProvider in provider hierarchy

scripts/check-i18n-keys.mjs
  — add conditional checks for new catalog fields

src/i18n/locales/en/plants.json
src/i18n/locales/es/plants.json
  — new content keys per entry (careAction, placement*, whyRationale)

src/i18n/locales/en/common.json
src/i18n/locales/es/common.json
  — fertilize task label, pet toxicity enum labels, journal UI copy, streak/toast copy
```

---

## Schema Migration Strategy

**Position: no schema version bump for v1.2. All AppData changes are additive optionals.**

The SCHEMA-08 stance from v1.1 (documented in `migration.ts` line 19 comment: "TODO(v1.2): call cleanupBackup_v1_1()") applies: optional fields default gracefully at load time without a migration function. Three v1.2 AppData additions follow this pattern:

| Field | Type | Default at load | Where defaulted |
|-------|------|-----------------|-----------------|
| `AppData.journals` | `Record<string, JournalEntry[]>` | `{}` | StorageProvider `useState` initial value + `dataRef` + `snapshotFromRef` |
| `Plant.fertilizeSchedule` | `FertilizeSchedule \| undefined` | `undefined` (task not generated if absent) | No explicit default — consumer guards with `?.` |
| `Plant.fertilizeSchedule.lastFertilized` | `string \| undefined` | `undefined` (treated as "never fertilized") | `getNextFertilizeDate` returns `today` when `lastFertilized` is absent |

`CURRENT_SCHEMA_VERSION` remains `1`. The v1.2 migration module cleanup TODO (delete backup helper and migration module) is now eligible to execute since all users have had the v1.1 migration window.

---

## Build Order (Dependency-First)

```
Step 1: Type foundation
  src/types/index.ts
  — Add all new types: JournalEntry, FertilizeSchedule, PetToxicity, ToxicityLevel
  — Extend Task.type union with 'fertilize'
  — Extend PlantDBEntry with new catalog fields
  — Extend Plant with fertilizeSchedule
  — Extend AppData with journals?
  UNBLOCKS: everything downstream

Step 2: Pure utils (no React, no context — smoke-testable via transpileModule)
  src/utils/fertilizeLogic.ts       — getNextFertilizeDate
  src/utils/streaks.ts              — getWaterStreakStatus
  src/utils/plantLogic.ts           — add 'fertilize' branch to getTasksForDay
  RUN: tsc --noEmit (fast feedback)

Step 3: Discriminator exhaustion sweep
  src/components/DayDetail.tsx
  src/components/DayDetailModal.tsx
  src/components/MonthCalendar.tsx
  src/components/TaskButton.tsx
  src/utils/notificationScheduler.ts
  — Add 'fertilize' case to every task.type switch
  RUN: tsc --noEmit — must be green before Step 4

Step 4: Catalog data + i18n (data-only, no logic changes)
  src/data/plantDatabase.ts         — add new fields to entries
  src/i18n/locales/*/plants.json    — new content keys
  src/i18n/locales/*/common.json    — new UI keys
  scripts/check-i18n-keys.mjs      — extend guard
  RUN: npm run check:i18n-keys (exit 0 required)

Step 5: Storage layer
  src/hooks/useStorage.tsx          — journals field + 3 new actions + load-time default
  RUN: tsc --noEmit

Step 6: Native dependency integration (HIGHEST RISK — requires app rebuild)
  npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler expo-haptics
  App.tsx: add GestureHandlerRootView + BottomSheetModalProvider
  NOTE: Cannot be verified in standard Expo Go — requires dev client build
  RUN: build with dev client; verify app loads without crash

Step 7: Component layer (parallelizable after Steps 3-5)
  7a: PlantDetail/ section components (depends on Steps 1+4 catalog data)
  7b: PlantJournal/ components (depends on Step 5 storage)
  7c: ToxicityBadge.tsx (depends on Step 4)
  7d: PlantCard Swipeable + haptics (depends on Step 6)
  7e: Bottom sheet components (depends on Step 6)
  7f: MyPlantDetailModal orchestrator refactor (depends on 7a)

Step 8: Final validation
  npm run check:i18n-keys
  npm run check:legacy-fields
  npx tsc --noEmit
  Run smoke runners
```

---

## Architectural Patterns

### Pattern 1: Additive Optional Field (no schema bump)

**What:** New `AppData` field declared as `fieldName?: Type`. Defaulted to a safe value in three places: `useState` initial value, `dataRef.current` initial object, and `snapshotFromRef()` return object.
**When to use:** Any new per-user-session data that was absent in previously persisted blobs.
**Trade-offs:** Zero migration code, zero version bump, instant rollout safety. Limit: field presence cannot be enforced at the type level — consumers must guard with `?? defaultValue` at read sites.

### Pattern 2: Mode-as-Dispatcher for Task Types

**What:** New task types extend the `Task.type` union. The task type is determined by a plant field (`fertilizeSchedule` presence); cadence math is a separate pure function. Same pattern as `'check_soil'` added in Phase 5.
**When to use:** Any new periodic care action with its own schedule.
**Trade-offs:** Single SSOT for each cadence; easy to add new modes without touching health scoring. Requires exhaustive discriminator sweep when new type is added.

### Pattern 3: Catalog-Only vs. Per-Plant Data Boundary

**What:** Fields on `PlantDBEntry` = catalog truth (species-level, read-only, no user write, not in AsyncStorage). Fields on `Plant` = per-user-plant instance (mutable, stored in AsyncStorage).
**When to use:** Pet toxicity, placement, careAction, whyRationale = catalog. lastFertilized, journals = per-plant.
**Trade-offs:** Keeps AsyncStorage lean; catalog updates propagate to all users on next app version via the `getCatalogEntry` live-lookup pattern established in Phase 8.

### Pattern 4: Pure Derived Data for Scores and Streaks

**What:** Calculate from persisted timestamps each render rather than caching computed values.
**When to use:** Any score or status that can be fully derived from existing `Plant` fields.
**Trade-offs:** Slightly higher per-render CPU; eliminates all invalidation bugs. At current plant counts (<100), per-render recalculation is negligible.

---

## Breaking Change Risk Register

| Change | Risk | Reason | Mitigation |
|--------|------|--------|------------|
| GestureHandlerRootView in App.tsx | MEDIUM | Native dep install; Expo Go incompatible without dev client | Build with dev client; `npx expo install` pins compatible version |
| Reanimated v4 install | MEDIUM | New Architecture only; Expo SDK 54 supports it but verify no old-arch config | Use `npx expo install`; babel-preset-expo handles plugin automatically; clear Metro cache |
| Task union 'fertilize' added | LOW-MEDIUM | Every switch/exhaustive-check on Task.type fails tsc | Step 3 in build order is the discriminator sweep — do it before any other component work |
| MyPlantDetailModal decomposition | LOW | External props interface unchanged; internal refactor only | Keep same exports in PlantDetail/index.ts; verify import sites in TodayScreen and PlantsScreen |
| Swipeable wrapping PlantCard | LOW | Gesture priority with FlatList scroll is a documented pattern | Use `friction={2}` on Swipeable; test on both iOS and Android |
| Journal field in AppData | NONE | Additive optional; load path defaults to `{}` | No action beyond the three useStorage locations |
| New catalog fields on PlantDBEntry | NONE | Optional fields; existing consumers guard with `?.` | Run tsc --noEmit after adding to confirm no regressions |
| BottomSheetModalProvider in provider tree | LOW | Must be outside NavigationContainer — position in hierarchy is correct | Verify with an actual bottom sheet render after install |

---

## Anti-Patterns

### Anti-Pattern 1: Schema Version Bump for Optional Fields

**What people do:** Increment `CURRENT_SCHEMA_VERSION` and write a migration function when adding new AppData fields.
**Why it's wrong:** Triggers migration banner, reschedule flow, and backup write unnecessarily. The existing machinery was designed for structural changes (the v0 unwrapped envelope → v1 versioned envelope transformation).
**Do this instead:** Declare fields as optional, default at load time in `useState`, `dataRef`, and `snapshotFromRef`. See `climateOverride` in v1.1 as the canonical example.

### Anti-Pattern 2: Caching Derived Streak Counts on Plant

**What people do:** Add `Plant.streak: number` incremented on each task completion.
**Why it's wrong:** Cached streaks go stale on device clock changes, app reinstalls, or any code path that bypasses the increment. Recovery requires complex reconciliation and audit logic.
**Do this instead:** Derive `isOnSchedule` from `lastWatered` + `waterSchedule` + `today` in `streaks.ts`. Use `streakStartDate?: string` as a lightweight anchor only if a specific count display is needed.

### Anti-Pattern 3: BottomSheetModalProvider Inside NavigationContainer

**What people do:** Mount `BottomSheetModalProvider` as a tab screen wrapper or inside the navigator tree.
**Why it's wrong:** Bottom sheet portals render outside the navigation tree by design. If the provider is inside navigation, sheets rendered in child components are not accessible.
**Do this instead:** Mount `BottomSheetModalProvider` above `NavigationContainer`, inside `GestureHandlerRootView`.

### Anti-Pattern 4: Storing Toxicity Labels in plants.json

**What people do:** Add `petSafetyLabel` keys to each plant's i18n node in plants.json.
**Why it's wrong:** Toxicity values are a closed 4-value enum. Repeating the same 4 strings 65 times per locale creates translation drift and inflates the file.
**Do this instead:** Translate the enum values in `common.json` under `petSafety.*`; use the enum value as the lookup key in the badge component.

### Anti-Pattern 5: Skipping the Discriminator Sweep After Task Union Extension

**What people do:** Add `'fertilize'` to the Task.type union without searching for exhaustive switches.
**Why it's wrong:** TypeScript strict mode will fail to compile at every switch with an exhaustive check. The `check_soil` addition in Phase 5 required fixing DayDetail.tsx, DayDetailModal.tsx, MonthCalendar.tsx, TaskButton.tsx, and notificationScheduler.ts.
**Do this instead:** Treat Step 3 (discriminator sweep + tsc --noEmit green) as a blocking gate before any component work.

### Anti-Pattern 6: careAction as a Paragraph

**What people do:** Write multi-sentence explanations in the `careAction` field.
**Why it's wrong:** The entire point of v1.2 is scannable, actionable guidance. Long blobs defeat the UX goal and create translation burden.
**Do this instead:** `careAction` = one sentence, imperative voseo. `placementRecommended` = location name + one-phrase reason. `whyRationale` = one sentence of horticultural fact. `description` in the existing catalog is already the long-form slot.

---

## Integration Points: External Services

| Service | v1.2 Impact | Notes |
|---------|-------------|-------|
| AsyncStorage | journals field added to persisted blob | No size concern — journal entries are text + optional photo URI string |
| expo-notifications | 'fertilize' task type added to notification content builder | Scheduler already receives tasks from getTasksForDay; minor handler extension |
| RevenueCat / PaywallModal | No change | Journal, toxicity, fertilize tracking are free features in v1.2 |
| Supabase edge functions | No change | v1.2 adds no new edge functions |
| Open-Meteo weather | No change | Weather alerts unchanged |
| GestureHandlerRootView | New — App.tsx root | Required for Swipeable + bottom-sheet gesture handling |

---

## Sources

- `src/types/index.ts` — read directly (Plant, PlantDBEntry, AppData, Task union, all v1.1 type definitions)
- `src/hooks/useStorage.tsx` — read directly (StorageState, StorageActions, dataRef pattern, snapshotFromRef, load path, climateOverride additive field precedent)
- `src/utils/migration.ts` — read directly (CURRENT_SCHEMA_VERSION = 1, v1.2 cleanup TODO at line 19)
- `src/data/plantDatabase.ts` — read directly (65 entries, PlantDBEntry structure, getTranslatedPlant)
- `src/i18n/locales/en/plants.json` — read directly (65 entries, 5 existing key types, nutrients present on 64/65)
- `src/utils/plantLogic.ts` — read directly (getTasksForDay dispatcher pattern, getSeasonalInterval, WaterSeason)
- `src/components/MyPlantDetailModal.tsx` — read directly (current modal structure, dbEntry lookup, section layout, ~320 lines)
- `src/components/PlantCard.tsx` — read directly (TouchableOpacity root, no gesture handler, getTranslatedPlant)
- `src/components/PlantHealthDetail.tsx` — read directly (section patterns, getLightLabel, waterSchedule.warm)
- `App.tsx` — read directly (provider hierarchy, no GestureHandlerRootView present)
- `package.json` — read directly (confirmed absence of reanimated, gesture-handler, bottom-sheet, haptics)
- `scripts/check-i18n-keys.mjs` — read directly (current guard logic, nutrients conditional pattern at line 66)
- `src/config/features.ts` — read directly (CARE_STREAKS flag exists as V2.0, confirming streaks are gated for full gamification)
- [expo-haptics official docs](https://docs.expo.dev/versions/latest/sdk/haptics/) — separate install required, three API methods (HIGH confidence)
- [react-native-reanimated Expo SDK 54](https://docs.expo.dev/versions/latest/sdk/reanimated/) — v4.1.x, babel-preset-expo handles plugin (HIGH confidence)
- gorhom/react-native-bottom-sheet issues #1389, #1846 — GestureHandlerRootView and SafeAreaProvider ordering (MEDIUM confidence, WebSearch verified)
- [Expo SDK 54 Reanimated compatibility](https://expo.dev/changelog/sdk-54) — New Architecture required for Reanimated v4 (HIGH confidence)

---

*Architecture research for: v1.2 Recommendation-First Plant Guide (My Garden Care)*
*Researched: 2026-05-01*
