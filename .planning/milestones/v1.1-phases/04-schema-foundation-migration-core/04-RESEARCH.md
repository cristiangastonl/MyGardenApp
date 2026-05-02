# Phase 4: Schema Foundation + Migration Core — Research

**Researched:** 2026-04-29
**Domain:** AsyncStorage versioned schema migration in a live React Native (Expo SDK 54) app + OS-level notification reschedule
**Confidence:** HIGH on foundational decisions (already pinned in CONTEXT.md). MEDIUM-HIGH on integration mechanics (verified against `useStorage.tsx` source). MEDIUM on a few implementation-detail open questions explicitly flagged below.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Failure Handling**
- If migration throws on first load: surface non-blocking banner ("Tu jardín está cargando con datos antiguos"), do NOT overwrite AsyncStorage, log analytics event `migration_failed` with error details (SCHEMA-07).
- The app continues to work normally with legacy schema reads. User can create/edit/diagnose plants without restriction. Migration is idempotent and will run again on next launch — no degraded read-only mode.
- Rationale: testing phase, low user count, idempotent migration design covers retry. Better UX trumps strict data-divergence prevention at this stage.

**Post-Migration Explainer (UX-01)**
- **Format:** Mini-tooltip per plant on first open of `MyPlantDetailModal` after migration — NOT a global modal/toast.
- Tooltip points at the new light + water fields and explains in one line ("Cambiamos cómo medimos luz y agua — revisá si querés ajustar.").
- Once the user dismisses the tooltip on a given plant (tap anywhere or tap "Entendido"), it never shows again for that plant.
- Storage: a `seenMigrationTooltipPlantIds: string[]` set inside `AppData` (or a separate flag if AppData layout makes it cleaner — Claude's discretion).
- **Copy is generic** — does NOT enumerate per-plant changes (Monstera became X). Specific diff is rejected as too noisy and fragile.

**Backup Blob Lifecycle**
- Migration writes one-time backup to AsyncStorage key `'plant-agenda-v2.backup-pre-v1.1'` before mutating live data (SCHEMA-02).
- Backup is auto-deleted in the **next release after v1.1** (v1.2). Implementation: a `cleanupBackup_v1_1()` helper called once on launch in v1.2 that removes the key if present.
- For v1.1: backup persists across the entire release window. No automatic deletion based on usage signals.
- No dev-only "restore from backup" UI in v1.1 — if rollback is needed, manual deletion of the live key + rename of backup key via a build-only debug script.

**Notification Reschedule (SCHEMA-06)**
- Migration completion calls `cancelAllNotifications()` then full reschedule pass against the new schema.
- Reschedule re-derives every notification time from current schedule rules — does NOT attempt to preserve original fire times for in-flight notifications.
- A user with a 10am reminder scheduled who launches the app at 9:55am may see their reminder shift slightly. Acceptable in testing phase (decision: "no me preocuparía por esas cosas").
- `notificationScheduler.ts` must consume `lightLevel` (not `sunHours`) before reschedule — refactor of `calculateSunWindow` and `groupPlantsBySunHours` is part of this phase.

**Mapper Thresholds (LIGHT-03, WATER-04)**
- `sunHoursToLightLevel(h)`: `>= 5h → direct`, `>= 3h → bright_indirect`, `>= 2h → medium_indirect`, `< 2h → low`
- `applyColdFactor(warmDays, category)`: `suculentas: 2.0`, `interior: 1.5`, `exterior: 1.7`, `aromaticas: 1.5`, `huerta: 1.3`, `frutales: 1.5`. Result clamped to `[1, 30]` days.
- `waterMode` defaults: `category === 'suculentas'` AND explicit allowlist for edge cases (aloe, jade) → `soil_check`. All others → `fixed`.
- **Same mapper functions** used for user data migration AND catalog rebalance (Phase 8). One source of truth.

**Versioned Envelope (SCHEMA-09)**
- Storage payload: `{ schemaVersion: number, data: AppData }`.
- Storage key remains `'plant-agenda-v2'` (do NOT change — orphans data).
- Detection on load: if `parsed.schemaVersion === undefined`, treat as `schemaVersion: 0` and run migrations 0→1.
- `runMigrations(persisted)` runs ordered array; idempotent.

**Analytics Events (SCHEMA-05)**
- `migration_started` — emitted before any read/write
- `migration_completed` — payload: `{ plantCount, durationMs, schemaVersionFrom, schemaVersionTo }`
- `migration_failed` — payload: `{ error: string, stage: 'read' | 'transform' | 'write' | 'reschedule', plantCount }`
- All via existing `analyticsService.ts` `trackEvent()` API.

**Legacy Field Retention (SCHEMA-08)**
- `Plant.sunHours` and `Plant.waterEvery` remain on the type as `@deprecated` optional for v1.1 only.
- CI grep guard: a script run via npm/EAS prepare-step that fails the build if NEW code reads `plant.sunHours` or `plant.waterEvery`. Existing reads in files being migrated are exempt via inline `// eslint-disable-next-line` or a transitional allowlist.
- v1.2 will drop the fields entirely; the grep guard should make that a clean delete.

**Migration Performance Budget (SCHEMA-04)**
- Synchronous, runs inside the existing `loadData` window in `useStorage.tsx:144-207`.
- Target: <200ms with 50 plants on a low-end Android device.
- No splash flash, no white screen, no perceptible launch lag.
- Chunked migration with `await Promise.resolve()` between chunks acceptable if profiling shows budget miss.

### Claude's Discretion
- Exact filename split for migration helpers (single `migration.ts` vs `migration.ts` + `mappers.ts`).
- Whether `seenMigrationTooltipPlantIds` lives inside `AppData` or as a separate AsyncStorage key.
- Idempotency check implementation (envelope version vs per-plant `if (plant.lightLevel)` short-circuit).
- Inline ESLint comment vs allowlist file for the legacy-field grep guard.
- Logging level/format for `__DEV__` migration trace.

### Deferred Ideas (OUT OF SCOPE)
- Dev-only "restore from backup" UI — not in v1.1.
- Per-plant migration explainer with specific diff ("Tu Monstera ahora es 'Luz brillante indirecta'") — rejected.
- Reschedule preserving exact in-flight notification fire times — out of scope.
- Hard cut of `sunHours`/`waterEvery` from Plant type — deferred to v1.2.
- Degraded read-only mode on migration failure — rejected.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHEMA-01 | Migrate existing user data on first v1.1 launch without data loss | "Single-blob atomic write" pattern — read once, transform fully in-memory, write once via single `AsyncStorage.setItem`. See §Migration Atomicity. |
| SCHEMA-02 | Pre-mutation backup blob to `'plant-agenda-v2.backup-pre-v1.1'` | Backup-before-write sequence verified safe: even if `setItem` of live key gets killed mid-write on Android (kernel-OOM), the backup key has already committed. See §Backup Sequence. |
| SCHEMA-03 | Idempotent migration | Two layers: envelope-version short-circuit (`if (parsed.schemaVersion >= 1) return data`) + defensive per-plant guard (`if (plant.lightLevel) return plant`). See §Idempotency. |
| SCHEMA-04 | <200ms with 50 plants on low-end Android | In-memory transform of ~50 objects with two integer mappers + 1 array map = <5ms typical. Single `setItem` of ~10–50KB JSON = ~30–80ms on low-end Android. Total well under budget. See §Performance. |
| SCHEMA-05 | Analytics events for `started`, `completed`, `failed` | `analyticsService.trackEvent()` is fire-and-forget queued — does NOT block migration. Safe to call inline. See §Analytics Integration. |
| SCHEMA-06 | Cancel and reschedule all OS-level notifications | `Notifications.cancelAllScheduledNotificationsAsync()` clears OS state; reschedule must wait for `notificationScheduler.ts` refactor (lightLevel-aware). See §Notification Reschedule. |
| SCHEMA-07 | On migration throw: non-blocking banner, no overwrite, analytics | Banner must be in-place (not Modal) to avoid stacking-modal bug. See §Failure Banner Pattern. |
| SCHEMA-08 | `sunHours`/`waterEvery` remain `@deprecated` optional; CI grep guard rejects new reads | Custom node script in `package.json` script + EAS prepare-step. ESLint custom rule rejected (no eslint config in project today). See §CI Grep Guard. |
| SCHEMA-09 | Versioned envelope `{ schemaVersion, data }`, key unchanged | Standard React Native pattern; multiple authoritative sources. See §Versioned Envelope. |
| LIGHT-03 | Deterministic `sunHoursToLightLevel` mapper | Pure function, locked thresholds from CONTEXT.md. Reused by catalog mapper in Phase 8. See §Mappers. |
| WATER-04 | Deterministic `waterEvery → waterSchedule` with per-category cold factors | Pure function `applyColdFactor(warmDays, category)`. Reused by catalog mapper in Phase 8. See §Mappers. |
| UX-01 | First-open mini-tooltip per plant in `MyPlantDetailModal` | Hand-rolled (no tooltip lib in project). Tap-anywhere-to-dismiss matches existing UX patterns. Storage choice: separate AsyncStorage key recommended. See §Mini-Tooltip Implementation. |
</phase_requirements>

## Summary

This phase ships the **load-bearing schema migration infrastructure** for v1.1. It is the prerequisite for every subsequent phase: nothing else can read `plant.lightLevel` or `plant.waterSchedule` until this lands.

The work decomposes into **six concrete deliverables**:

1. **Type system update** (`src/types/index.ts`): add `LightLevel`, `WaterMode`, `WaterSchedule`, `PersistedAppData<V>` envelope; add fields to `Plant` (and `PlantDBEntry`); mark `sunHours`/`waterEvery` `@deprecated optional`.
2. **Pure mappers** (`src/utils/migration.ts` or split): `sunHoursToLightLevel`, `applyColdFactor`, `inferWaterMode`, `migratePlant_0to1`, `runMigrations(persisted)`. Locked threshold tables from CONTEXT.md.
3. **Storage integration** (`src/hooks/useStorage.tsx` lines 144-207): envelope detection, backup-blob write, migration call, save path emits envelope going forward.
4. **Notification refactor** (`src/utils/notificationScheduler.ts`): `calculateSunWindow` + `groupPlantsBySunHours` consume `lightLevel`. After migration: `cancelAllScheduledNotificationsAsync()` then reschedule pass.
5. **Catalog mechanical update** (`src/data/plantDatabase.ts` 56 entries × ~22 lines each = ~1200 LOC): every entry gains `lightLevel`, `waterSchedule`, `waterMode` via the same mappers used for user data. Recommended approach: codemod script.
6. **Post-migration UX** (UX-01): mini-tooltip in `MyPlantDetailModal` on first open per plant after migration. Banner in `TodayScreen` (or root) for migration-failure case.

**Primary recommendation:** Implement the migration as a **read-once, transform-fully-in-memory, backup-then-write-then-confirm** sequence inside the existing `loadData()` async function in `useStorage.tsx`. Treat the migration as the load path, not a separate phase. This avoids splash-screen flashes and double-loading-state complexity. Keep mappers as pure functions in `src/utils/migration.ts` so catalog rebalance (Phase 8) imports the same source of truth.

**Critical risk:** Stale OS-level notifications referencing legacy fields. The notification scheduler MUST be refactored to consume `lightLevel` before the post-migration reschedule pass runs, otherwise `calculateSunWindow` will read `undefined.sunHours` and throw, which silently disables the entire notification subsystem via `markNotificationsUnavailable()` (verified at `notificationScheduler.ts:17-27`).

## Standard Stack

### Core (already installed — NO new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-native-async-storage/async-storage` | `^2.2.0` | Single-key blob persistence; envelope wrapping | Already the persistence layer; versioned-envelope pattern is de-facto standard for RN apps at this scale (sources: DEV.to versioned-state article, React Native School migration guide) |
| `expo-notifications` | `~0.32.16` | `cancelAllScheduledNotificationsAsync()` + full reschedule pass | Already wired in `notificationScheduler.ts`; cancel + reschedule is the only safe pattern when notification trigger logic changes (see CRIT-3) |
| `react-i18next` + `i18next` | `^16.5.4` / `^25.8.10` | Banner copy, tooltip copy, `migration.banner.*`, `migration.tooltip.*` keys | Project rule: never hardcode user-facing strings; vos voseo for ES |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `analyticsService.trackEvent` (project-internal) | n/a | `migration_started/completed/failed` events | Already fire-and-forget queued (`analyticsService.ts:84-107`); does NOT block migration timeline |
| `__DEV__` global | n/a | Migration trace logging | Established pattern in `useStorage.tsx:201` |
| `findDatabaseEntry(plant)` (project-internal) | n/a | Resolve plant's category for `applyColdFactor` | Already implemented in `plantInfo.ts:32`; covers databaseId → name → typeId fallback chain |

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Verdict |
|------------|-----------|----------|---------|
| Hand-rolled migration utility | `redux-persist` migrate, `zustand/persist` | Both presume corresponding state libs | REJECTED — would require state-management migration |
| Hand-rolled type guards | `zod` / `valibot` runtime validation | +20-80KB; new mental model | REJECTED — schema surface small enough; pure TS type guards clearer |
| AsyncStorage versioned envelope | `expo-sqlite` / WatermelonDB / Drizzle | Multi-week refactor for a field rename | REJECTED — see STACK.md rationale |
| Custom CI grep script (node) | ESLint rule + `eslint-plugin-deprecation` | Project has NO eslint config today; adding one is out of scope for this phase | RECOMMENDED: simple node script (~30 LOC) run as `npm run check:legacy-fields` and from EAS hook |
| Hand-rolled tooltip | `react-native-tooltip-2`, `rn-tooltip` | New dependency; bundle weight; design-system fit unclear | RECOMMENDED: hand-rolled — small absolute-positioned `View` with theme.ts colors; tap-anywhere dismiss pattern matches existing UX |

**No new packages added to `package.json`.** Verified against project STACK.md "no new packages" stance.

**Installation:** none.

## Architecture Patterns

### Recommended File Layout

```
src/
├── utils/
│   ├── migration.ts          # NEW — pure functions: runMigrations, migratePlant_0to1, mappers
│   └── notificationScheduler.ts  # MODIFIED — calculateSunWindow consumes lightLevel
├── hooks/
│   └── useStorage.tsx        # MODIFIED — envelope detect + migrate in loadData (lines 144-207)
├── types/
│   └── index.ts              # MODIFIED — Plant gains lightLevel/waterSchedule/waterMode; add PersistedAppData
├── components/
│   ├── MigrationBanner.tsx   # NEW — non-modal in-place banner for failure case (UX-01 sibling)
│   └── MigrationTooltip.tsx  # NEW — hand-rolled tooltip in MyPlantDetailModal
├── data/
│   └── plantDatabase.ts      # MODIFIED — every entry gains new fields via codemod
└── scripts/
    └── check-legacy-fields.js  # NEW — CI grep guard (npm script)
```

**Discretion:** single-file `src/utils/migration.ts` is recommended. The mapper functions are 5-10 LOC each; splitting into `mappers.ts` + `migration.ts` adds import-graph friction without clarity gain. If the file exceeds ~250 LOC, revisit.

### Pattern 1: Versioned Envelope with Backup Sequence

**What:** Storage payload becomes `{ schemaVersion: number, data: AppData }`. Migration on load runs ordered functions and writes back atomically via single `AsyncStorage.setItem` AFTER backup blob is committed.

**When to use:** First load only. Subsequent loads short-circuit on `parsed.schemaVersion >= 1`.

**Sequence (CRITICAL ORDER):**

```
1. AsyncStorage.getItem(STORAGE_KEY)              // read legacy blob
2. Parse JSON                                     // throws → SCHEMA-07 banner
3. Detect envelope:
   if parsed.schemaVersion >= CURRENT_VERSION → short-circuit, no migration
4. trackEvent('migration_started', { plantCount })
5. AsyncStorage.setItem(BACKUP_KEY, stored)       // commit backup FIRST (raw original string)
6. data = runMigrations(parsed)                   // pure transform in-memory
7. AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, data }))
8. trackEvent('migration_completed', { plantCount, durationMs, ... })
9. Cancel + reschedule notifications              // SCHEMA-06
10. setState calls hydrate React state            // useStorage continues normally
```

**Why this order:** If step 7 (live-key write) is killed mid-write by OS, the backup key from step 5 is intact AND the live key still contains the legacy blob (because `setItem` either commits or doesn't — Android's SQLite-backed AsyncStorage is atomic per-key, just not multi-key transactional). Worst case: on next launch, we re-read the legacy blob and re-run migration. Idempotent.

**Example:**
```typescript
// src/utils/migration.ts
// Source: project pattern + .planning/research/STACK.md §Schema Migration

export const CURRENT_SCHEMA_VERSION = 1;
export const BACKUP_KEY = 'plant-agenda-v2.backup-pre-v1.1';

export interface PersistedAppData {
  schemaVersion: number;
  data: AppData;
}

export function isVersioned(raw: unknown): raw is PersistedAppData {
  return typeof raw === 'object' && raw !== null
    && typeof (raw as any).schemaVersion === 'number'
    && (raw as any).data !== undefined;
}

export function runMigrations(persisted: PersistedAppData): AppData {
  let { schemaVersion, data } = persisted;
  if (schemaVersion < 1) data = migrateV0toV1(data);
  // future: if (schemaVersion < 2) data = migrateV1toV2(data);
  return data;
}

function migrateV0toV1(data: AppData): AppData {
  return {
    ...data,
    plants: data.plants.map(migratePlant_0to1),
  };
}

export function migratePlant_0to1(plant: Plant): Plant {
  // Idempotency guard: defensive double-check
  if (plant.lightLevel && plant.waterSchedule && plant.waterMode) return plant;

  const dbEntry = findDatabaseEntry(plant);
  const category = dbEntry?.category;

  const lightLevel = plant.lightLevel ?? sunHoursToLightLevel(plant.sunHours ?? 3);
  const warmDays = plant.waterSchedule?.warm ?? plant.waterEvery ?? 7;
  const coldDays = plant.waterSchedule?.cold ?? applyColdFactor(warmDays, category);
  const waterMode = plant.waterMode ?? inferWaterMode(category, dbEntry?.id);

  return {
    ...plant,
    lightLevel,
    waterSchedule: { warm: warmDays, cold: coldDays },
    waterMode,
    // legacy fields retained @deprecated for v1.1 only
  };
}
```

### Pattern 2: Pure Mappers (Reused by Catalog Rebalance)

**What:** All transform functions are pure (no I/O, no side effects). The same `sunHoursToLightLevel` and `applyColdFactor` will be used in Phase 8 catalog rebalance.

**Why:** Single source of truth. If the cold-factor heuristic changes, both user data and catalog defaults change in lockstep. No drift.

**Locked thresholds (from CONTEXT.md, NOT to be debated by planner):**

```typescript
export function sunHoursToLightLevel(h: number): LightLevel {
  if (h >= 5) return 'direct';
  if (h >= 3) return 'bright_indirect';
  if (h >= 2) return 'medium_indirect';
  return 'low';
}

export function applyColdFactor(warmDays: number, category?: PlantCategory): number {
  const factor: Record<PlantCategory, number> = {
    suculentas: 2.0,
    interior:   1.5,
    exterior:   1.7,
    aromaticas: 1.5,
    huerta:     1.3,
    frutales:   1.5,
  };
  const result = Math.round(warmDays * (factor[category ?? 'interior']));
  return Math.max(1, Math.min(30, result));  // clamp [1, 30]
}

const SOIL_CHECK_DB_IDS = new Set(['aloe', 'jade', 'echeveria', 'haworthia', 'sedum', 'cactus']);
// ↑ verify exact slugs against plantDatabase.ts during implementation

export function inferWaterMode(category?: PlantCategory, dbId?: string): WaterMode {
  if (category === 'suculentas') return 'soil_check';
  if (dbId && SOIL_CHECK_DB_IDS.has(dbId)) return 'soil_check';
  return 'fixed';
}
```

### Pattern 3: Failure Banner (Non-Modal, In-Place)

**What:** A `<MigrationBanner>` component rendered in-place at top of `TodayScreen` (or above `MainTabs` in `App.tsx`). NOT a `Modal`.

**When to use:** Only when migration threw and `migration_failed` analytics event fired. Banner has dismissable "X" but reappears on next launch if migration still fails (idempotent retry).

**Why:** PITFALLS.md flags modal-stacking as a known bug — banner must be a plain `<View>` with absolute or relative positioning, not a `Modal` component. CLAUDE.md confirms "no nested navigators / no nested modals" rule.

**Storage of "migration failed" flag:** Either (a) recompute on each launch by attempting migration and catching, or (b) store `migrationFailedAt: string | null` on `AppData`. Recommendation: **(a)** — every launch tries migration, banner derives from "did this load throw?" state. No persisted failure flag avoids stale-banner bugs.

### Pattern 4: Mini-Tooltip on First Open

**What:** When user opens `MyPlantDetailModal` for plant X for the first time post-migration, render a small tooltip pointing at the new fields.

**When to dismiss:** Tap anywhere on tooltip OR tap "Entendido" button. Once dismissed for plant X, never shows again for plant X.

**Storage decision:** **Separate AsyncStorage key** `'migration-tooltip-seen-v1.1'` storing `{[plantId: string]: boolean}`. Reasons:
- Avoids polluting `AppData` with one-shot UX state
- Lifecycle is "v1.1 release-only" — clean to delete in v1.2 (paired with `cleanupBackup_v1_1()`)
- No need to gate tooltip behavior through `useStorage` Context — direct read-on-mount is fine
- Simpler than embedding tooltip-seen IDs in `Plant` (don't pollute domain model with UX state)

**Why hand-roll the tooltip:** Project has no tooltip component today. A small absolute-positioned `<View>` with `theme.ts` colors and a tap-anywhere `Pressable` overlay is ~50 LOC. Adding `react-native-tooltip-2` (~12KB) for one usage in v1.1 is over-engineered.

**Trigger logic:**
- `MyPlantDetailModal` mounts → check AsyncStorage for `'migration-tooltip-seen-v1.1'[plantId]`
- If false AND plant has post-migration fields (i.e., `lightLevel` is set) AND `installDate` predates v1.1 release → show tooltip
- On dismiss, set `seenMap[plantId] = true` and persist

**Discretion (per CONTEXT.md):** if planner decides `seenMigrationTooltipPlantIds: string[]` in `AppData` is cleaner (e.g., to avoid second AsyncStorage call), that's acceptable. The recommendation above leans toward separate key to keep AppData clean.

### Anti-Patterns to Avoid

- **Lazy per-plant migration on read** — pollutes every consumer; prevents legacy field deletion. Migration is one-shot at load.
- **Reading `useStorage` from inside `migration.ts` or `plantHealth.ts`** — breaks testability. Migration takes raw data in, returns transformed data out.
- **`Modal` component for the failure banner** — known modal-stacking bug. Use absolute-positioned `<View>` only.
- **Debounced write of migrated payload** — bypass the existing 100ms debounce (`useStorage.tsx:128-141`); migration uses direct `AsyncStorage.setItem`. Then resume debounce for subsequent saves.
- **Setting React state BEFORE migration write succeeds** — if the write throws, state and disk diverge. Order: backup → migrate → write → setState.
- **Re-running migration after setState** — idempotency guard means it's safe, but it's wasted CPU and risks racing the debounced save.
- **Calling `cancelAllScheduledNotificationsAsync` BEFORE the notificationScheduler refactor** — it would cancel notifications then fail to reschedule (because `calculateSunWindow` would throw on `undefined.sunHours`). Refactor scheduler FIRST, reschedule SECOND.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AsyncStorage atomic transaction | Multi-key commit-marker dance | Single-blob `setItem` of envelope (already the project pattern) | AsyncStorage is atomic per-key on Android (SQLite-backed) and iOS (RocksDB/file-backed). Multi-key transactionality doesn't exist; the closest is `multiSet` which is NOT atomic across keys (it's a convenience for batched parallel calls). The single-blob pattern sidesteps this entirely. |
| Notification cancel-and-reschedule choreography | Try to preserve in-flight fire times | `Notifications.cancelAllScheduledNotificationsAsync()` + full reschedule pass | OS-level notification IDs are opaque; preserving fire times requires reading every scheduled notification's trigger, mapping to plant, and re-deriving — much more code than a fresh reschedule. CONTEXT.md explicitly accepts the small UX shift. |
| Tooltip positioning math | Anchor-based positioning library | Static absolute positioning relative to `MyPlantDetailModal` content layout | The modal is a single full-screen `Modal` with predictable layout. A library is overkill. |
| TypeScript deprecation enforcement at build time | `eslint-plugin-deprecation` (would need eslint config) | Custom node `check-legacy-fields.js` script | Project has NO eslint config today; adding ESLint just for this is out of scope. Simple grep script is ~30 LOC. |
| Migration version comparison | Semver library | Integer `schemaVersion` | Schema versions are simple integers; semver semantics don't apply. |

**Key insight:** This phase has very few "complex problem" surfaces. The main discipline is **ordering** (backup before write, refactor scheduler before reschedule) and **purity** (mappers as pure functions). Don't introduce libraries for problems we don't have.

## Common Pitfalls

### Pitfall 1: Notification subsystem silently dies after migration (CRIT-3 from PITFALLS.md)

**What goes wrong:** Migration completes, calls `cancelAllScheduledNotificationsAsync`, then the reschedule pass invokes `calculateSunWindow` which still reads `plant.sunHours`. After migration, `sunHours` is still present (`@deprecated`), so it doesn't throw — BUT the value is stale relative to the new `lightLevel`. Worse, when a future plant is created without `sunHours` (just `lightLevel`), `plant.sunHours * 60 * 60 * 1000` returns `NaN`, the function throws, and `markNotificationsUnavailable()` (notificationScheduler.ts:17-27) silently disables ALL notifications globally for the rest of the session.

**Why it happens:** Single-failure-disables-everything pattern at `notificationScheduler.ts:17`. Verified directly in source.

**How to avoid:**
1. Refactor `calculateSunWindow(plant, sunrise, sunset)` and `groupPlantsBySunHours` to consume `lightLevel`, mapping to a recommended hour-band per level (CONTEXT.md proposes `direct: 4-6h`, `bright_indirect: all-day no direct`, `medium_indirect: morning only`, `low: no outdoor schedule`).
2. Refactor `getPlantsUVSensitive` filter and `plantInfo.ts:69` `isSensitiveToSun = plant.sunHours <= 3` to use `lightLevel === 'low' || lightLevel === 'medium_indirect'`.
3. Sequence: refactor scheduler FIRST (otherwise it throws on first call), then trigger reschedule.
4. Light-band mapping table to validate during planning:
   - `direct` → 4-6 hours of direct sun, schedule sunrise+30min to ~6h after sunrise
   - `bright_indirect` → all-day window, no direct-sun mid-day notification needed
   - `medium_indirect` → morning-only, schedule a "move to morning sun" tip if outdoor
   - `low` → no outdoor schedule at all, skip sunrise/sunset notifications for this plant
5. Sanity check by running `getScheduledNotificationCounts()` post-reschedule and asserting `total >= prevTotal - X` (X = a small tolerance for genuinely cancelled notifications).

**Warning signs:** `notificationsAvailable === false` after migration where it was `true` before. `getScheduledNotificationCounts()` returns near-zero counts for plants that should have schedules.

### Pitfall 2: User customizations overwritten by catalog defaults (MOD-3 from PITFALLS.md)

**What goes wrong:** User saved Monstera with `sunHours: 5` (catalog says 3 because their apartment is dim). Migration looks up catalog and uses catalog `sunHours: 3` to derive `lightLevel: 'bright_indirect'`. User loses their customization silently.

**Why it happens:** Mapper resolves catalog instead of using per-instance `plant.sunHours`.

**How to avoid:** Mapper takes `plant.sunHours` from the user's stored value, NOT from `findDatabaseEntry(plant).sunHours`. The catalog is consulted ONLY for `category` (input to `applyColdFactor`) and `dbId` (input to `inferWaterMode`). Verified in the example code above.

**Test fixture:** `{ sunHours: 5, databaseId: 'monstera' }` → expect `lightLevel: 'direct'` (NOT `bright_indirect`).

**Warning signs:** Manual QA: edit a plant's `sunHours` to a non-default before migration, verify `lightLevel` reflects the override.

### Pitfall 3: Migration runs on every launch (idempotency failure)

**What goes wrong:** Envelope check is wrong (e.g., checks `data.schemaVersion` instead of `parsed.schemaVersion`); migration re-runs each launch, slowing startup and writing-back unchanged data. Or worse, mappers are not idempotent and re-running corrupts data on the second pass.

**Why it happens:** Two failure modes — envelope detection bug, or mapper not idempotent.

**How to avoid:**
1. **Envelope check at the right level:** test `parsed.schemaVersion`, not `parsed.data.schemaVersion`.
2. **Defensive per-plant guard inside `migratePlant_0to1`:** if `plant.lightLevel && plant.waterSchedule && plant.waterMode` are all set, return plant unchanged. This protects against partial migrations and weird re-entry.
3. **Unit-style smoke test in dev:** load already-migrated data, verify `runMigrations` returns identical reference (or `JSON.stringify` matches).

**Warning signs:** Analytics event `migration_started` fires every launch (should fire ONLY on the first v1.1 launch). Bytes-on-disk for `'plant-agenda-v2'` differs across two consecutive launches with no user activity.

### Pitfall 4: Modal-stacking with the migration tooltip + paywall + diagnosis modals

**What goes wrong:** User has a soil-check plant they tap on. `MyPlantDetailModal` opens. Migration tooltip overlays it. User taps a button that opens a nested modal (e.g., diagnosis). Tooltip is now stuck behind the new modal.

**Why it happens:** Tooltip is rendered inside `MyPlantDetailModal`, so its z-index is bound by the modal's stacking context. Nested modals on iOS stack on top.

**How to avoid:**
1. Tooltip is rendered at the ROOT of `MyPlantDetailModal`'s content, with `pointerEvents="auto"` and a translucent backdrop. Tapping anywhere on the backdrop dismisses it.
2. When a nested modal opens, the outer tooltip dismisses (lifecycle: dismiss-on-outside-press handler covers this — when nested modal mounts, it consumes the tap event that would have hit the tooltip backdrop).
3. As an explicit safety: the tooltip listens for any modal-open event on the parent and auto-dismisses.

**Warning signs:** Manual QA: open a plant with tooltip showing → immediately tap "Diagnosticar" button → confirm tooltip is gone, not buried.

### Pitfall 5: Backup blob persists indefinitely if cleanup never ships

**What goes wrong:** v1.2 ships without `cleanupBackup_v1_1()`. The backup blob persists forever, doubling storage usage for every existing user.

**Why it happens:** Cleanup is in a different milestone; easy to forget.

**How to avoid:**
1. Add a **TODO marker** with explicit milestone reference at the top of `migration.ts`: `// TODO(v1.2): call cleanupBackup_v1_1() once on launch and remove this comment + the helper.`
2. Add a checklist item in the v1.1 → v1.2 release notes / project STATE.md.
3. Implement and EXPORT `cleanupBackup_v1_1()` from `migration.ts` in this phase. It just needs to be wired up in v1.2.

**Warning signs:** Long-running users notice AsyncStorage usage growing without explanation. (Low priority — typical blob is ~10-50KB.)

### Pitfall 6: Performance budget miss on real low-end Android

**What goes wrong:** 50 plants with full diagnosis history → blob is several hundred KB → `JSON.parse` + `JSON.stringify` each take 50ms+ on low-end Android. Plus migration map. Total exceeds 200ms.

**Why it happens:** AsyncStorage on Android is SQLite-backed; reads of large blobs are not free. JSON.parse on RN is also non-trivial for large strings.

**How to avoid:**
1. **Profile before optimizing.** `console.time('migration')` / `console.timeEnd` in dev gives a real number.
2. If over budget, chunked migration with `await Promise.resolve()` between chunks (still inside `loadData`).
3. Diagnosis history is the biggest contributor to blob size (chat messages can be long). The migration does NOT touch diagnosis history; only `plants[]`. So even if the blob is 500KB, the `.map` over plants is still <5ms.
4. Heaviest cost is `JSON.parse(stored)` (one-time, unavoidable) and `AsyncStorage.setItem(...)` (one-time, unavoidable). Migration math itself is negligible.

**Warning signs:** Splash screen visible >300ms post-tap on a real low-end device with full diagnosis history.

### Pitfall 7: Catalog mechanical update introduces typos via hand-edit

**What goes wrong:** Hand-editing 56 catalog entries × 3 new fields = 168 manual edits. Easy to mis-type a `lightLevel` or assign a non-existent category to `applyColdFactor`.

**Why it happens:** Volume of mechanical changes.

**How to avoid:** **Use a codemod script** instead of hand-editing. Approach:
1. Write `scripts/migrate-catalog.js` that imports `PLANT_DATABASE`, calls the same `migratePlant_0to1`-style mapper on each entry (with adapted typing — `PlantDBEntry` not `Plant`), and emits a new `plantDatabase.ts` with the added fields.
2. Hand-review the diff before committing. Any field that looks wrong, override manually before commit.
3. The script is run-once (doesn't ship) — keep it in `scripts/` with a clear "single-use" comment.
4. Phase 8 catalog rebalance does the horticultural review pass — Phase 4 just does mechanical mapping for parity.

**Test:** `tsc --noEmit` after the codemod must succeed.

## Code Examples

### Example 1: Storage Load Path with Migration (replaces `useStorage.tsx:144-207`)

Source: project pattern + `useStorage.tsx` current load path

```typescript
useEffect(() => {
  const loadData = async () => {
    const startTime = Date.now();
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        // Brand new user — set install date now
        const id = formatDate(new Date());
        setInstallDate(id);
        dataRef.current.installDate = id;
        setLoading(false);
        return;
      }

      let data: AppData;

      try {
        const raw = JSON.parse(stored);

        // Detect envelope (SCHEMA-09)
        if (isVersioned(raw) && raw.schemaVersion >= CURRENT_SCHEMA_VERSION) {
          // Already migrated; short-circuit
          data = raw.data;
        } else {
          // Run migration 0 → 1
          const persisted: PersistedAppData = isVersioned(raw)
            ? raw
            : { schemaVersion: 0, data: raw };

          trackEvent('migration_started', { plantCount: persisted.data.plants?.length ?? 0 });

          // Backup BEFORE mutating live data (SCHEMA-02)
          await AsyncStorage.setItem(BACKUP_KEY, stored);

          // Pure transform
          data = runMigrations(persisted);

          // Persist envelope (SCHEMA-09)
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, data })
          );

          trackEvent('migration_completed', {
            plantCount: data.plants.length,
            durationMs: Date.now() - startTime,
            schemaVersionFrom: persisted.schemaVersion,
            schemaVersionTo: CURRENT_SCHEMA_VERSION,
          });

          // Defer reschedule until after setState (so notificationScheduler can read fresh state)
          schedulePostMigrationReschedule = true;
        }
      } catch (migrationError) {
        // SCHEMA-07: do NOT overwrite live data; surface banner; analytics
        trackEvent('migration_failed', {
          error: String(migrationError),
          stage: 'transform',  // or read/write — narrow per catch location
          plantCount: 0,
        });
        setMigrationFailed(true);  // drives <MigrationBanner> render
        // Fall through to legacy reads (graceful degradation per CONTEXT.md)
        data = JSON.parse(stored) as AppData;  // legacy unwrapped shape
      }

      // ... existing setState calls hydrate from `data` ...
    } catch (e) {
      if (__DEV__) console.log('[Storage] load error:', e);
      trackEvent('migration_failed', { error: String(e), stage: 'read', plantCount: 0 });
      setMigrationFailed(true);
    }
    setLoading(false);
  };
  loadData();
}, []);
```

### Example 2: Save Path Emits Envelope Going Forward

Source: modify `useStorage.tsx:128-141`

```typescript
const scheduleSave = useCallback(() => {
  if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(async () => {
    saveTimerRef.current = null;
    try {
      const data = snapshotFromRef(dataRef);
      // Envelope wrap (SCHEMA-09)
      const persisted: PersistedAppData = { schemaVersion: CURRENT_SCHEMA_VERSION, data };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (e) {
      console.error('Save error:', e);
    }
  }, SAVE_DEBOUNCE_MS);
}, []);
```

### Example 3: Notification Reschedule After Migration

Source: `notificationScheduler.ts` existing API + new lightLevel flow

```typescript
// In useStorage loadData, AFTER setState:
useEffect(() => {
  if (loading) return;
  if (!schedulePostMigrationReschedule) return;
  schedulePostMigrationReschedule = false;

  const reschedule = async () => {
    try {
      await cancelAllNotifications();  // existing API at notificationScheduler.ts:358

      // Reschedule: morning reminder + per-plant care reminders + sun notifications
      // (calculateSunWindow now consumes lightLevel — refactored in this phase)
      await scheduleMorningReminder(notificationSettings.morningTime, plants, weather, healthStatuses);
      await scheduleSmartSunNotifications(plants, weather);
      // ... follow-up reminders rebuilt from active diagnoses ...
    } catch (e) {
      trackEvent('migration_failed', { error: String(e), stage: 'reschedule', plantCount: plants.length });
      // Don't surface banner — partial reschedule is acceptable per CONTEXT.md
    }
  };
  reschedule();
}, [loading, plants, weather]);
```

### Example 4: lightLevel-aware `calculateSunWindow`

Source: refactor `notificationScheduler.ts:524-543`

```typescript
// Mapping per CONTEXT.md / PITFALLS CRIT-3 recommendation:
function lightLevelToSunHours(level: LightLevel): number {
  switch (level) {
    case 'direct': return 5;            // 4-6h band, midpoint
    case 'bright_indirect': return 0;   // no direct-sun window
    case 'medium_indirect': return 0;
    case 'low': return 0;
  }
}

function calculateSunWindow(plant: Plant, sunrise: Date, sunset: Date): { start: Date; end: Date } | null {
  const hours = lightLevelToSunHours(plant.lightLevel);
  if (hours === 0) return null;  // no outdoor sun schedule for non-direct plants

  const start = new Date(sunrise.getTime() + SUNRISE_OFFSET_MINUTES * 60 * 1000);
  const sunHoursMs = hours * 60 * 60 * 1000;
  let end = new Date(start.getTime() + sunHoursMs);
  const maxEnd = new Date(sunset.getTime() - 30 * 60 * 1000);
  if (end > maxEnd) end = maxEnd;
  return { start, end };
}
```

Callers (`scheduleSunriseNotification`, `scheduleSunsetNotification`) check for `null` return and skip the plant. `groupPlantsBySunHours` becomes `groupPlantsByLightLevel` returning `Map<LightLevel, Plant[]>` filtered to `direct` only.

### Example 5: CI Grep Guard (`scripts/check-legacy-fields.js`)

Source: hand-rolled, ~30 LOC

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');

// Allowlist: files where legacy-field reads are tolerated during transition
const ALLOWLIST = new Set([
  'src/utils/migration.ts',           // mapper reads plant.sunHours / plant.waterEvery
  'src/types/index.ts',               // type definition
  'src/screens/OnboardingScreen.tsx', // until Phase 7 rewrites onboarding
  'src/screens/ExploreScreen.tsx',    // catalog spec
  'src/utils/plantIdentification.ts', // until Phase 7 updates identification
  'src/data/constants.ts',            // legacy PlantType
  // ... add files as planner identifies
]);

const forbidden = ['\\.sunHours', '\\.waterEvery'];
let violations = [];

for (const pattern of forbidden) {
  try {
    const out = execSync(
      `git grep -nE "${pattern}" -- 'src/**/*.ts' 'src/**/*.tsx'`,
      { encoding: 'utf8' }
    );
    out.split('\n').filter(Boolean).forEach(line => {
      const [file] = line.split(':');
      if (!ALLOWLIST.has(file)) violations.push(line);
    });
  } catch (e) {
    // grep returns 1 when no matches — that's success
    if (e.status !== 1) throw e;
  }
}

if (violations.length > 0) {
  console.error('❌ Legacy field reads found outside allowlist:');
  violations.forEach(v => console.error(' ', v));
  console.error('\nMigrate these to plant.lightLevel / plant.waterSchedule, or add file to ALLOWLIST in scripts/check-legacy-fields.js if transitional.');
  process.exit(1);
}
console.log('✅ No new legacy-field reads.');
```

Wire to `package.json`:
```json
"scripts": {
  "check:legacy-fields": "node scripts/check-legacy-fields.js"
}
```

EAS hook (in `eas.json` `build.production.prebuildCommand` or via a `predeploy` npm script): `npm run check:legacy-fields`.

## State of the Art

| Old Approach | Current Approach | Source |
|--------------|------------------|--------|
| Unwrapped JSON blob with no version | Versioned envelope `{ schemaVersion, data }` | Standard React Native pattern (DEV.to, RN School) |
| Manual sun-hours per plant | Light-level taxonomy (4 buckets) | Industry-standard plant-care UX (Planta, Greg, Picture This) |
| Single watering interval | Warm/cold seasonal split | RHS, UMN Extension horticultural guidance |
| Lazy per-read field defaults | Eager one-shot migration with idempotency | Standard for AsyncStorage at this scale |

**Deprecated/outdated:**
- `Plant.sunHours: number` (required) → optional `@deprecated` in v1.1, removed in v1.2
- `Plant.waterEvery: number` (required) → optional `@deprecated` in v1.1, removed in v1.2
- `calculateSunWindow(plant.sunHours)` → `calculateSunWindow(plant.lightLevel)`
- `groupPlantsBySunHours` → `groupPlantsByLightLevel`
- `isSensitiveToSun = plant.sunHours <= 3` (in `plantInfo.ts:69`) → `lightLevel === 'low' || lightLevel === 'medium_indirect'`

## Open Questions

These need a planner decision (or a quick spike) before implementation locks. None are blocking research; all are flagged for the planner.

### 1. Exact `SOIL_CHECK_DB_IDS` allowlist
- **What we know:** CONTEXT.md says `category === 'suculentas'` → `soil_check`, with explicit allowlist for edge cases (aloe, jade).
- **What's unclear:** Some plants in `plantDatabase.ts` may be categorized as `interior` (e.g., aloe is sometimes in `interior` for low-light tolerance) but should still be `soil_check` mode.
- **Recommendation:** Open `plantDatabase.ts`, grep for cactus/succulent species in non-`suculentas` categories, build the allowlist explicitly. Keep the list inline in `migration.ts`. Verify by `grep "scientificName.*Aloe\\|scientificName.*Crassula\\|scientificName.*Echeveria"` to find candidates.

### 2. Reschedule trigger location
- **What we know:** Reschedule must happen AFTER migration AND AFTER React state hydrates (because `notificationScheduler` consumes `plants` and `weather`).
- **What's unclear:** Where to put the trigger. Options:
  - (a) Inside `useStorage` `loadData`'s post-setState callback (tight coupling)
  - (b) In `App.tsx` via a `useEffect([plants, weather, migrationJustHappened])` (looser, but `migrationJustHappened` flag has to come from somewhere)
  - (c) Inside an existing notification-scheduling effect that already exists in `App.tsx` or a screen (likely `TodayScreen` based on `getScheduledNotificationCounts` usage)
- **Recommendation:** (b) — a top-level `useEffect` in `App.tsx` that checks a `migrationJustHappened` ref/state set by `useStorage` and triggers reschedule. Keeps `useStorage` pure-storage; reschedule is an app-level concern.

### 3. Banner integration point
- **What we know:** Must be non-modal in-place.
- **What's unclear:** Where in the layout. Options:
  - Top of `TodayScreen` (only visible when on Hoy tab)
  - Above `MainTabs` in `App.tsx` (always visible until dismissed)
- **Recommendation:** Above `MainTabs` in `App.tsx`. Highest visibility for what is, by definition, a serious-but-non-blocking error state. Match the project's `NotificationContext`-style root-level pattern.

### 4. Codemod for catalog vs. hand-edit
- **What we know:** 56 entries × 3 new fields. Pure mechanical mapping.
- **What's unclear:** Should the codemod be committed as `scripts/migrate-catalog.js` or run-once-and-deleted?
- **Recommendation:** Commit as `scripts/migrate-catalog.js` with header "Single-use codemod for v1.1 catalog migration. Re-running is safe but unnecessary. Delete in v1.2 cleanup." Keeps audit trail.

### 5. `seenMigrationTooltipPlantIds` storage location
- **What we know:** CONTEXT.md gives Claude's discretion.
- **What's unclear:** AppData field vs. separate AsyncStorage key.
- **Recommendation:** Separate AsyncStorage key `'migration-tooltip-seen-v1.1'`. Simpler v1.2 cleanup (`AsyncStorage.removeItem(key)` paired with `cleanupBackup_v1_1`). Keeps domain model clean. Decided in §Pattern 4 above.

### 6. Where does install-date check live for tooltip-eligibility gating?
- **What we know:** Tooltip should only show for plants that EXISTED at migration time (not new plants created in v1.1).
- **What's unclear:** Use `plant.createdAt` if present? Use a new `migrationCohort: boolean` field? Use `installDate` cutoff?
- **Recommendation:** During migration, set `plant._migratedFromV0: true` (private/underscore field) on every plant the migration touches. Tooltip checks this flag. New plants created post-migration don't have it. Cleaner than relying on dates. The `_migratedFromV0` flag is dropped in v1.2 alongside legacy field cleanup. Drop into the locked tooltip-trigger logic.

## Validation Architecture

Project config has `workflow.nyquist_validation: true`. This is a data-migration phase — validation is critical.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **NONE installed** — project ships without test runner (verified `package.json`, no test script, no jest/vitest config) |
| Config file | none |
| Quick run command | `npx tsc --noEmit` (type check only — the project's only automated check) |
| Full suite command | manual smoke test per Wave 0 |
| Phase gate | `npx tsc --noEmit` green + manual smoke test checklist signed off |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHEMA-01 | Pre-v1.1 fixture loads, plants have `lightLevel`/`waterSchedule`/`waterMode` after | manual smoke | dev fixture load + `console.log(plants[0])` | ❌ Wave 0 |
| SCHEMA-02 | Backup key contains exact pre-migration JSON | manual smoke | dev: `AsyncStorage.getItem(BACKUP_KEY)` and diff | ❌ Wave 0 |
| SCHEMA-03 | Migration is idempotent — second run is no-op | smoke + grep | run migration twice in dev, verify identical output | ❌ Wave 0 |
| SCHEMA-04 | <200ms with 50 plants on low-end Android | profiling | `console.time('migration')` on real device | ❌ Wave 0 |
| SCHEMA-05 | Analytics events fire with correct payloads | manual smoke | dev: tail Supabase `analytics_events` after launch | ❌ Wave 0 |
| SCHEMA-06 | OS notifications cancelled and rescheduled | manual smoke | `getScheduledNotificationCounts()` pre/post | ❌ Wave 0 |
| SCHEMA-07 | Migration throw → banner shows, blob unchanged | manual smoke | inject error in dev migrate, verify banner + blob | ❌ Wave 0 |
| SCHEMA-08 | Grep guard fails on new legacy reads | automated | `npm run check:legacy-fields` (sad path) | ❌ Wave 0 |
| SCHEMA-09 | Envelope shape on disk after first migration | manual smoke | `AsyncStorage.getItem(STORAGE_KEY)` and verify shape | ❌ Wave 0 |
| LIGHT-03 | Mapper output matches lock table | dev assertion | inline `console.assert` in `__DEV__` block | ❌ Wave 0 |
| WATER-04 | Cold-factor table application + clamp | dev assertion | inline `console.assert` in `__DEV__` block | ❌ Wave 0 |
| UX-01 | Tooltip shows once per plant first-open, never again | manual smoke | manual QA on 3 plants × dismiss × kill app × reopen | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (must pass) + `npm run check:legacy-fields` (must pass)
- **Per wave merge:** above + manual smoke-test checklist for the requirements covered by that wave
- **Phase gate:** Full SMOKE-TEST.md walkthrough on real iOS + real Android low-end device, with these specific scenarios:
  1. v1.0 fixture user (5 plants, 2 with diagnoses) → launch v1.1 → verify migrated shape, no data loss, tooltip appears on first plant open
  2. Same as 1 but force-kill app DURING migration (before write completes) → relaunch → verify legacy data still on disk + migration runs cleanly
  3. v1.0 fixture user → launch v1.1 → kill app → relaunch → verify migration does NOT re-run (idempotency)
  4. v1.0 fixture user with stale notifications → launch v1.1 → verify `getScheduledNotificationCounts` shows expected new-shape counts
  5. v1.0 fixture user → inject migration error in dev (e.g., throw inside `migratePlant_0to1`) → verify banner shown, no overwrite, app usable in legacy mode

### Wave 0 Gaps

- [ ] `scripts/check-legacy-fields.js` — automated grep guard with allowlist (SCHEMA-08)
- [ ] `scripts/migrate-catalog.js` — codemod for plantDatabase.ts (single-use)
- [ ] `__DEV__`-gated assertion calls inside `migration.ts` for mapper verification (LIGHT-03, WATER-04)
- [ ] `.planning/phases/04-schema-foundation-migration-core/SMOKE-TEST.md` — phase-gate manual smoke test checklist
- [ ] Fixture JSON files: `tests/fixtures/v0-empty.json`, `tests/fixtures/v0-five-plants.json`, `tests/fixtures/v0-fifty-plants.json` for dev-time fixture loading. (Not unit tests — feed these via a dev-only `__DEV__` button or via `AsyncStorage.setItem` in dev console.)
- [ ] Add `npm run check:legacy-fields` to EAS pre-build hook in `eas.json`

**Note:** No test runner is installed. The Wave 0 gaps above are NOT unit tests — they are smoke-test scaffolding and inline assertions. A future milestone may add Jest; at that point, `runMigrations`, `migratePlant_0to1`, `sunHoursToLightLevel`, `applyColdFactor`, and `inferWaterMode` are all pure functions and trivially testable. **Design them to be unit-testable now even though no test runner exists.**

## Sources

### Primary (HIGH confidence)

- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useStorage.tsx` (lines 90-220) — direct read of load/save paths, debounced save, ref pattern
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/notificationScheduler.ts` (lines 17-27, 358-366, 524-560, 716-790) — direct read of `markNotificationsUnavailable`, `cancelAllScheduledNotificationsAsync`, `calculateSunWindow`, `groupPlantsBySunHours`, UV/temp warning consumers of `sunHours`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/types/index.ts` — direct read of `Plant`, `AppData`, `PlantDBEntry`, `IdentifiedPlant`, `PlantDiagnosisContext` types
- `/Users/gaston/Documents/Personal/MiJardinApp/src/services/analyticsService.ts` (lines 84-107) — direct read of `trackEvent` queued/non-blocking semantics
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantInfo.ts` (lines 32-55, 69) — direct read of `findDatabaseEntry` lookup chain and `isSensitiveToSun` heuristic
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantLogic.ts` — direct read of `getNextWaterDate`, `getTasksForDay` (consumes `waterEvery`, `sunHours`)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/data/plantDatabase.ts` — line/entry count, structure verified (1200 lines, 56 entries)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/App.tsx` — provider hierarchy and notification listener pattern
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/research/ARCHITECTURE.md` — schema migration strategy section
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/research/PITFALLS.md` — CRIT-1 (partial migration), CRIT-2 (dual source of truth), CRIT-3 (stale notifications), MOD-3 (customizations overwritten), MOD-10 (splash flash)
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/research/STACK.md` — versioned envelope pattern, no-new-packages stance
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

- [Expo Notifications SDK docs — cancelAllScheduledNotificationsAsync](https://docs.expo.dev/versions/latest/sdk/notifications/) — verified API surface; explicit pattern for cancel-then-reschedule not documented but implied by Promise return
- [DEV.to: A simple pattern for versioned persisted state in React Native](https://dev.to/sebastian_thiebaud_3f06ad/a-simple-pattern-for-versioned-persisted-state-in-react-native-ll6) — versioned-envelope pattern reference
- [React Native School: Migrating Data in AsyncStorage](https://www.reactnativeschool.com/migrating-data-in-asyncstorage/) — versioned-state advice; cross-confirms STACK.md recommendation
- [LinkedIn: Versioned migration of local data in React Native AsyncStorage](https://www.linkedin.com/pulse/versioned-migration-local-data-react-native-amal-jose-) — same pattern, third source

### Tertiary (LOW confidence — flagged for validation)

- AsyncStorage atomicity claim (single-key writes are atomic): not formally documented by Facebook RN team. Inferred from SQLite-backed Android implementation and observed-but-not-formally-promised behavior on iOS. Verified secondarily by [GitHub issue #125 (parallel setItem crash)](https://github.com/react-native-community/async-storage/issues/125), [GitHub issue #16576 (large blob memory)](https://github.com/facebook/react-native/issues/16576), [GitHub issue #521 (force quit clears storage)](https://github.com/react-native-async-storage/async-storage/issues/521). Practical implication: single-blob writes are the safest pattern; parallel writes are NOT safe; very large blobs (>4-6MB) can lose data on Android force-quit. The migration writes one ~10-50KB blob, well below the danger zone.
- Light-level → sun-window mapping table (`direct: 4-6h`, etc.): based on PITFALLS.md recommendation, no horticultural source. Reasonable defaults for a notification-trigger heuristic; not load-bearing for plant health. Phase 8 catalog horticultural review can refine if needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against `package.json`, no new deps required, all libraries already in production use
- Architecture (versioned envelope, in-load migration, backup-then-write): HIGH — verified against `useStorage.tsx` source code; pattern is industry-standard for RN at this scale
- Pitfalls (CRIT-3 stale notifications, MOD-3 customization loss, modal stacking, splash flash): HIGH — directly observable in source code; PITFALLS.md authored from same source reads
- Mapper thresholds: HIGH — locked in CONTEXT.md, no debate
- Reschedule trigger location: MEDIUM — three viable options, Open Question §2
- Tooltip storage location: HIGH for separate-key recommendation, but Claude's discretion per CONTEXT.md
- Catalog codemod feasibility: HIGH — straightforward AST/regex transform of static TS array
- AsyncStorage write atomicity (single-key): MEDIUM — community-accepted but not formally guaranteed; backup-blob design covers the gap

**Research date:** 2026-04-29
**Valid until:** 30 days (stable domain — no fast-moving libs in scope)
