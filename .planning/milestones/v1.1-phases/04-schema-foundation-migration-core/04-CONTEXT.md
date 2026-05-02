# Phase 4: Schema Foundation + Migration Core - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate v1.0 plant data to the precision-care schema (`sunHours → lightLevel`, `waterEvery → waterSchedule {warm, cold}`, add `waterMode`) on first launch of v1.1, without data loss, and rebuild OS-level scheduled notifications against the new shape. All UI behavior remains unchanged in this phase — read-side and write-side UI propagation belong to phases 5/6/7.

Locked from REQUIREMENTS.md: SCHEMA-01..09, LIGHT-03, WATER-04, UX-01.

</domain>

<decisions>
## Implementation Decisions

### Failure Handling
- If migration throws on first load: surface non-blocking banner ("Tu jardín está cargando con datos antiguos"), do NOT overwrite AsyncStorage, log analytics event `migration_failed` with error details (SCHEMA-07).
- The app continues to work normally with legacy schema reads. User can create/edit/diagnose plants without restriction. Migration is idempotent and will run again on next launch — no degraded read-only mode.
- Rationale: testing phase, low user count, idempotent migration design covers retry. Better UX trumps strict data-divergence prevention at this stage.

### Post-Migration Explainer (UX-01)
- **Format:** Mini-tooltip per plant on first open of `MyPlantDetailModal` after migration — NOT a global modal/toast.
- Tooltip points at the new light + water fields and explains in one line ("Cambiamos cómo medimos luz y agua — revisá si querés ajustar.").
- Once the user dismisses the tooltip on a given plant (tap anywhere or tap "Entendido"), it never shows again for that plant.
- Storage: a `seenMigrationTooltipPlantIds: string[]` set inside `AppData` (or a separate flag if AppData layout makes it cleaner — Claude's discretion).
- **Copy is generic** — does NOT enumerate per-plant changes (Monstera became X). Specific diff is rejected as too noisy and fragile.

### Backup Blob Lifecycle
- Migration writes one-time backup to AsyncStorage key `'plant-agenda-v2.backup-pre-v1.1'` before mutating live data (SCHEMA-02).
- Backup is auto-deleted in the **next release after v1.1** (v1.2). Implementation: a `cleanupBackup_v1_1()` helper called once on launch in v1.2 that removes the key if present.
- For v1.1: backup persists across the entire release window. No automatic deletion based on usage signals.
- No dev-only "restore from backup" UI in v1.1 — if rollback is needed, manual deletion of the live key + rename of backup key via a build-only debug script.

### Notification Reschedule (SCHEMA-06)
- Migration completion calls `cancelAllNotifications()` then full reschedule pass against the new schema.
- Reschedule re-derives every notification time from current schedule rules — does NOT attempt to preserve original fire times for in-flight notifications.
- A user with a 10am reminder scheduled who launches the app at 9:55am may see their reminder shift slightly. Acceptable in testing phase (decision: "no me preocuparía por esas cosas").
- `notificationScheduler.ts` must consume `lightLevel` (not `sunHours`) before reschedule — refactor of `calculateSunWindow` and `groupPlantsBySunHours` is part of this phase.

### Mapper Thresholds (LIGHT-03, WATER-04)
- **`sunHoursToLightLevel(h)`** — locked from REQUIREMENTS.md:
  - `>= 5h` → `direct`
  - `>= 3h` → `bright_indirect`
  - `>= 2h` → `medium_indirect`
  - `< 2h` → `low`
- **`applyColdFactor(warmDays, category)`** — locked from REQUIREMENTS.md:
  - `suculentas: 2.0`, `interior: 1.5`, `exterior: 1.7`, `aromaticas: 1.5`, `huerta: 1.3`, `frutales: 1.5`
  - Result clamped to `[1, 30]` days.
- **`waterMode` defaults**: `category === 'suculentas'` AND explicit allowlist for edge cases (aloe, jade) → `soil_check`. All others → `fixed`.
- **Same mapper functions** used for user data migration AND catalog rebalance (Phase 8). One source of truth.

### Versioned Envelope (SCHEMA-09)
- Storage payload: `{ schemaVersion: number, data: AppData }`.
- Storage key remains `'plant-agenda-v2'` (do NOT change — orphans data).
- Detection on load: if `parsed.schemaVersion === undefined`, treat as `schemaVersion: 0` and run migrations 0→1.
- `runMigrations(persisted)` runs ordered array; idempotent.

### Analytics Events (SCHEMA-05)
- `migration_started` — emitted before any read/write
- `migration_completed` — payload: `{ plantCount, durationMs, schemaVersionFrom, schemaVersionTo }`
- `migration_failed` — payload: `{ error: string, stage: 'read' | 'transform' | 'write' | 'reschedule', plantCount }`
- All via existing `analyticsService.ts` `trackEvent()` API.

### Legacy Field Retention (SCHEMA-08)
- `Plant.sunHours` and `Plant.waterEvery` remain on the type as `@deprecated` optional for v1.1 only.
- CI grep guard: a script run via npm/EAS prepare-step that fails the build if NEW code reads `plant.sunHours` or `plant.waterEvery`. Existing reads in files being migrated are exempt via inline `// eslint-disable-next-line` or a transitional allowlist.
- v1.2 will drop the fields entirely; the grep guard should make that a clean delete.

### Migration Performance Budget (SCHEMA-04)
- Synchronous, runs inside the existing `loadData` window in `useStorage.tsx:144-207`.
- Target: <200ms with 50 plants on a low-end Android device.
- No splash flash, no white screen, no perceptible launch lag.
- If profiling shows we miss the budget: chunked migration with `await Promise.resolve()` between chunks is acceptable (still inside `loadData`, just yields to event loop).

### Claude's Discretion
- Exact filename split for migration helpers (single `migration.ts` vs `migration.ts` + `mappers.ts`).
- Whether `seenMigrationTooltipPlantIds` lives inside `AppData` or as a separate AsyncStorage key.
- Idempotency check implementation (envelope version vs per-plant `if (plant.lightLevel)` short-circuit).
- Inline ESLint comment vs allowlist file for the legacy-field grep guard.
- Logging level/format for `__DEV__` migration trace.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — project guidelines (i18n rules, design system, RC config, build/submit)

### Planning artifacts
- `.planning/PROJECT.md` — current milestone, validated requirements, key decisions
- `.planning/REQUIREMENTS.md` §Schema Migration / Light Model / Watering Model — locked requirements for this phase
- `.planning/research/SUMMARY.md` — synthesis with cross-file tensions resolved
- `.planning/research/STACK.md` — versioned-envelope pattern, no-new-packages rationale
- `.planning/research/ARCHITECTURE.md` §3 (Schema Migration Strategy), §4 (File Inventory) — file-by-file impact list
- `.planning/research/PITFALLS.md` CRIT-1 (partial migration), CRIT-2 (dual-source-of-truth), CRIT-3 (stale notifications) — mitigation specifics

### Codebase maps
- `.planning/codebase/STRUCTURE.md` — file layout
- `.planning/codebase/CONVENTIONS.md` — coding patterns
- `.planning/codebase/ARCHITECTURE.md` — runtime flows

### Source files of interest (for migration touch points)
- `src/hooks/useStorage.tsx` — load path lines 143-207, save path 128-141 (envelope detection + persist)
- `src/types/index.ts` — `Plant`, `PlantDBEntry`, `AppData` (schema additions)
- `src/types/database.ts` — DB shapes (snake_case mirrors; sync flag is off, but keep in sync for future)
- `src/utils/notificationScheduler.ts` — `calculateSunWindow`, `groupPlantsBySunHours` (refactor to lightLevel)
- `src/services/analyticsService.ts` — `trackEvent` API
- `src/data/plantDatabase.ts` — catalog updated with new fields using same mappers

### External docs
- [DEV.to: Versioned persisted state in React Native](https://dev.to/sebastian_thiebaud_3f06ad/a-simple-pattern-for-versioned-persisted-state-in-react-native-ll6) — pattern reference
- [React Native School: Migrating Data in AsyncStorage](https://www.reactnativeschool.com/migrating-data-in-asyncstorage/) — pattern reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/analyticsService.ts` `trackEvent()` — direct API for migration analytics events
- `useStorage.tsx` already has a `loadData()` async fn with try/catch and a `setLoading(false)` finalizer — migration drops in cleanly
- `findDatabaseEntry(plant)` in `src/utils/plantInfo.ts` — used in catalog reference resolution; mappers can use it to look up category for `applyColdFactor`
- `__DEV__` global from React Native — already used in `useStorage.tsx:201` for dev-only logging

### Established Patterns
- All persisted data lives under one key (`plant-agenda-v2`); single blob read/write — migration must rewrite the entire blob atomically
- Save path uses 100ms debounce — migration write should NOT go through debounce; it should be direct/synchronous
- `if (__DEV__) console.log(...)` is the established trace pattern
- Errors silently swallowed in `loadData` (`catch (e) { if (__DEV__) console.log(...) }` line 200-202) — migration must NOT silently swallow; it must call analytics + show banner

### Integration Points
- `useStorage.tsx:147` — `AsyncStorage.getItem(STORAGE_KEY)` is the load entry point; migration runs after parse, before setState calls
- `useStorage.tsx:136` — save path; envelope wrapping happens here
- `notificationScheduler.ts` consumers — every place that calls scheduler must pass `lightLevel` instead of `sunHours` after this phase
- `App.tsx` providers — no change; migration is internal to `StorageProvider`

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no tan importante el tema de la data ahora" — sets the bar: prefer simpler implementation over paranoid safety mechanisms when tradeoff exists
- Mini-tooltip per plant pattern aligns with existing tap-to-dismiss UX in the app (no separate disruptive flow)
- The handover already flagged modal-stacking as a known bug — migration banner must be a non-modal banner (in-place at top of Hoy or below header), NOT a Modal component

</specifics>

<deferred>
## Deferred Ideas

- **Dev-only "restore from backup" UI** — not in v1.1; manual key swap via build-only debug script suffices
- **Per-plant migration explainer with specific diff** ("Tu Monstera ahora es 'Luz brillante indirecta'") — rejected; copy stays generic
- **Reschedule preserving exact in-flight notification fire times** — out of scope; re-derive from new schedule
- **Hard cut of `sunHours`/`waterEvery` from Plant type** — deferred to v1.2 with grep-guard already in place from this phase
- **Degraded read-only mode on migration failure** — rejected; full normal usage continues, idempotent retry on next launch

</deferred>

---

*Phase: 04-schema-foundation-migration-core*
*Context gathered: 2026-04-30*
