# Phase 8: Catalog Rebalance - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the auto-mapped Phase-4 catalog values (`applyColdFactor` heuristic + `sunHoursToLightLevel` derivation) with expert-vetted per-entry defaults for all 50+ existing catalog entries. Add 14 LATAM outdoor plants with full new-model fields. Split lavender into 3 variants (angustifolia, stoechas, dentata) with distinct cold tolerance — original `lavanda` becomes alias to `lavanda-angustifolia`. Introduce a `getCatalogEntry(plant.dbId)` lookup helper so catalog content (`tip`, `description`, `problems`, `nutrients`) is read fresh from the catalog at render time instead of cached on plant instances. Ship `_aliases: string[]` on entries so renamed slugs auto-resolve. Wire two CI guards (i18n keyset parity per id; imageUrl 200-OK).

**No edge function or write-side changes** — Phase 7 territory. Phase 8 only edits catalog data + adds lookup helper + adds CI scripts. Read-side consumers (PlantCard, MyPlantDetailModal, etc.) migrate to use the lookup helper.

Locked from REQUIREMENTS.md: LIGHT-04, WATER-07, CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08.

</domain>

<decisions>
## Implementation Decisions

### Lookup-by-id Pattern (CAT-04, CAT-05)
- **`getCatalogEntry(slug: string): PlantDBEntry | null`** — new exported helper in `src/data/plantDatabase.ts`. Takes a slug, returns the canonical entry or null. Internally checks `id` first, then scans `_aliases`.
- **Read-site migration:** `PlantCard`, `MyPlantDetailModal`, `PlantHealthDetail`, `PlantDetailModal`, `IdentificationResults` — every consumer that today reads `plant.tip`, `plant.description`, `plant.problems`, `plant.nutrients` from the Plant instance switches to `getCatalogEntry(plant.dbId)?.tip` etc. Plant instance keeps `dbId` only for catalog-sourced data; user-edited overrides (custom name) stay on the instance.
- **Defensive missing-entry handling:** `getCatalogEntry(slug)` returns `null` when not found. Consumer code uses `?.` chain + safe-default empty content (e.g., `entry?.tip ?? ''`). `__DEV__` logs a warning with the missing slug — graceful degradation, never crash.
- **`_aliases: string[]`** field on `PlantDBEntry` (already typed-optional). Entries that get renamed list old slugs. `getCatalogEntry` resolves aliases. **Auto-migrate on save:** when `useStorage().updatePlant()` writes a Plant whose `dbId` was an alias, rewrite to canonical id transparently. Idempotent — no-op for already-canonical ids.
- **Legacy fields on Plant type:** keep `name`, `typeName`, `tip`, `description`, `problems`, `nutrients` as `@deprecated` optional in v1.1 (rollback safety net + grep guard rejects new reads). Same SCHEMA-08 stance Phase 4 took for `sunHours`/`waterEvery`. v1.2 deletes them.
- **`getTranslatedPlant`** stays the i18n bridge — but now operates on `getCatalogEntry` results, not Plant instances. The function signature shifts from `(plant: PlantDBEntry) => PlantDBEntry` to `(entry: PlantDBEntry, t: TFunction) => PlantDBEntry` if needed (Claude's discretion at implementation time).

### Expert Overrides for 50+ Existing Entries (CAT-01, CAT-08, LIGHT-04, WATER-07)
- **Direct entry edits as SSOT:** the catalog file (`src/data/plantDatabase.ts`) is the single source of truth. Every entry gains explicit `lightLevel`, `waterSchedule.{warm, cold}`, `waterMode` fields per horticultural research. Phase-4 mappers are NOT re-run on these entries.
- **Source of expert defaults:** Phase 8 researcher reads `.planning/research/FEATURES.md` watering-ratio reference table + Argentine/LATAM horticultural sources (e.g., INTA references for outdoor, indoor plant care guides for tropical houseplants). Researcher generates a per-entry table with proposed values; user reviews during planning if any look off.
- **Per-category factor table (Phase 4 `applyColdFactor`):** kept as documented constants in `migration.ts` for backward compat / migration of legacy v1.0 plants. **Not used** by Phase 8 catalog edits — explicit per-entry values win. Future v1.2 may delete the constants if no consumers remain.
- **Validation at smoke-runner level:** `scripts/smoke-phase08.mjs` asserts every entry in `PLANT_DATABASE` has `lightLevel`, `waterSchedule.warm`, `waterSchedule.cold`, `waterMode` populated (not undefined). CI fails if any are missing or out of valid range (e.g., `warm < 1` or `cold < warm`).
- **`waterMode` defaults locked from Phase 4:** suculentas, cactus, aloe-vera, echeveria, haworthia, sedum, jade default to `'soil_check'`. New `lavanda-stoechas`/`-dentata` and herbs (lavanda-angustifolia, romero-rastrero) stay `'fixed'`. Tomate cherry, gardenia, camelia, copete: `'fixed'` with shorter intervals (3-4 days warm).

### 14 New Outdoor Plants + Lavender Split (CAT-02, CAT-03)
- **14 new entries** (per REQUIREMENTS.md CAT-02): jacarandá, ceibo, glicina, gardenia, camelia, dalia, salvia ornamental, cala, copete (Tagetes), verbena, lavanda francesa (lavanda-stoechas), lavanda dentada (lavanda-dentada), romero rastrero (romero-rastrero), tomate cherry.
- **Researcher fills full new-model fields per entry:** `id`, `category`, `name` (ES), `lightLevel`, `waterSchedule.{warm, cold}`, `waterMode`, `tip` (ES voseo), `description` (ES), `problems` (ES, array length ≥ 1), `nutrients` (ES, array length ≥ 1). Plus EN translations of `name`/`tip`/`description`/`problems`/`nutrients` per the translation rule below.
- **Image strategy (deferred):** Code ships pointing at `${CATALOG_BASE_URL}/<id>.jpg` URLs that 404 until images are uploaded to Supabase Storage. Image upload itself is added to v1.1 device-test backlog as a manual step. CI guard (CAT-07) flags missing images — accepted-known-failure during v1.1 staging, must resolve before declaring v1.1 ready to ship.
- **Translation quality bar:** ES expert (Argentine voseo, regionally-appropriate plant names like "lavanda francesa" not "spike lavender"); EN auto-derived from ES via simple 1:1 mapping (plant name + tip translation) — functional, not literary. Smoke runner checks keyset parity, not translation quality.
- **Lavender split execution:**
  1. Rename existing `id: "lavanda"` → `id: "lavanda-angustifolia"` (canonical English/most-common species).
  2. Add `_aliases: ["lavanda"]` so legacy user plants whose `dbId === "lavanda"` resolve via alias.
  3. Add 2 new entries: `lavanda-stoechas` (lavanda francesa — distinctive bracts, tolerates more heat, less cold-hardy) and `lavanda-dentada` (lavanda dentada — serrated leaves, similar to stoechas in care).
  4. Distinct cold-tolerance per CAT-03: angustifolia hardiest (cold ≤ 12d), stoechas+dentada warmer (cold ≤ 8d).
- **i18n key relocation:** `lavanda` key in `en/plants.json` and `es/plants.json` becomes `lavanda-angustifolia`. The `_aliases` mechanism is for the runtime entry lookup — the i18n key migration is direct (rename keys in JSON). Smoke runner CAT-06 catches any drift.

### CI Guards (CAT-06, CAT-07)
- **Two npm scripts in `package.json`:**
  - `npm run check:i18n-keys` — synchronous Node script; runs as part of `scripts/smoke-phase08.mjs` AND standalone. Asserts that for every catalog `id` (and every `_aliases` entry, just in case), both `en/plants.json[id]` AND `es/plants.json[id]` exist with full keyset: `name`, `tip`, `description`, `problems` (array, length ≥ 1), `nutrients` (array, length ≥ 1). Missing keys produce an itemised list and exit 1.
  - `npm run check:images` — async standalone Node script (slow due to network). HEAD requests in parallel (concurrency 8). 200 = pass; anything else (404, 5xx, network error) = fail with URL list and exit 1. New entries' missing images count as failures (CAT-07 strictness).
- **Documentation:** Both scripts documented in CLAUDE.md under a new "Pre-submit checks" section. User runs them before submitting builds. No GitHub Actions / pre-commit hook (no CI infrastructure in project).
- **Failure mode:** Exit 1 + itemised list. No auto-fix mode (would mask drift). User reads list, fixes, re-runs.
- **Phase-8-ship state:** `check:i18n-keys` MUST pass before Phase 8 ships (12+ new keys per locale). `check:images` is EXPECTED to fail for the 14 new outdoor entries until manual upload — failure is documented as accepted-known in v1.1 backlog.

### Cross-Cutting / Claude's Discretion
- **`PlantDBEntry._aliases` field:** add as `_aliases?: string[]`. Underscore prefix denotes meta (matches existing convention if any; Claude's discretion on whether to keep prefix or use plain `aliases`).
- **`getCatalogEntry` co-location:** lives in `src/data/plantDatabase.ts` next to `PLANT_DATABASE` export. Single SSOT.
- **`updatePlant` auto-migrate-on-alias:** the rewrite-to-canonical happens inside `useStorage.updatePlant()`. Pure runtime, no migration script needed. If user never opens a legacy plant, alias resolves at render forever.
- **`getTranslatedPlant` signature:** Claude's discretion on whether to widen, replace with `getTranslatedCatalogEntry(slug)`, or leave alone.
- **Researcher table format:** Claude's discretion on table layout (markdown table, JSON, TypeScript const). Researcher's output is ground-truth for planner — just needs to be parseable.
- **CI guard exit codes:** Always 0 (success) or 1 (failure). No partial states, no warnings-only mode. Keep simple.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — i18n rules, design system, Supabase storage layout (catalog images at `xibriencutmxkrzluzse.supabase.co/storage/v1/object/public/plant-images/catalog`).

### Planning artifacts
- `.planning/PROJECT.md` — current milestone goals.
- `.planning/REQUIREMENTS.md` §Light Model (LIGHT-04), §Watering Model (WATER-07), §Catalog Rebalance (CAT-01..08).
- `.planning/research/FEATURES.md` — watering-ratio table referenced by CAT-08.
- `.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — Phase 4 mapper definitions (`sunHoursToLightLevel`, `inferWaterMode`, `applyColdFactor`); SCHEMA-08 stance for legacy field deprecation.
- `.planning/phases/06-ui-read-side-propagation/06-CONTEXT.md` — `OUTDOOR_TYPE_IDS` set (read-side consumers expect this for outdoor labels).
- `.planning/phases/07-ui-write-side-onboarding-edge-function-contract/07-CONTEXT.md` — `LightLevelPicker` and `WaterScheduleEditor` exist; `getEffectiveSeason` SSOT; defaults locked.

### Codebase maps
- `.planning/codebase/STRUCTURE.md` — file layout, where to add npm scripts.
- `.planning/codebase/CONVENTIONS.md` — naming, i18n discipline.

### Source files of interest
- `src/data/plantDatabase.ts` — 50+ entries; `CATALOG_BASE_URL` const at line 4; `getTranslatedPlant` at line 1308; `PLANT_DATABASE` array. Entry shape: `{ id, category, name, lightLevel, waterSchedule, waterMode, ... }` post-Phase-4.
- `src/i18n/locales/en/plants.json` and `src/i18n/locales/es/plants.json` — translated `{ name, tip, description, problems, nutrients }` per id.
- `src/types/index.ts` — `PlantDBEntry` (line ~190 area), `Plant` (legacy fields). Add `_aliases?: string[]` to `PlantDBEntry`.
- `src/hooks/useStorage.tsx` — `updatePlant` action; auto-migrate-on-alias goes here.
- `src/components/PlantCard.tsx`, `MyPlantDetailModal.tsx`, `PlantDetailModal.tsx`, `PlantHealthDetail.tsx`, `PlantIdentifier/IdentificationResults.tsx` — read-site consumers that migrate to `getCatalogEntry`.
- `src/utils/migration.ts` — Phase 4 mappers stay as legacy migration helpers; not invoked by Phase 8 catalog edits.

### Image hosting
- Supabase Storage bucket `plant-images` → `catalog/<id>.jpg` pattern. New entries point at this; images uploaded manually post-ship per backlog.

### npm scripts
- `package.json` — add `check:i18n-keys` and `check:images` entries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getTranslatedPlant(plant: PlantDBEntry)` already operates on entries (not on Plant instances) — `getCatalogEntry(slug)` becomes the upstream lookup that feeds it.
- Phase 4 mappers (`sunHoursToLightLevel`, `inferWaterMode`, `applyColdFactor`) stay in `src/utils/migration.ts` as legacy helpers for v1.0→v1.1 user-data migration. Not consumed by Phase 8 catalog edits.
- `PLANT_DATABASE.map(getTranslatedPlant)` exists at line 1326 — the catalog-list iteration. Phase 8 adds nothing here unless adding category filters.
- `${CATALOG_BASE_URL}/<id>.jpg` URL pattern is consistent across all 50+ entries — new entries follow.
- Phase 5/6/7 i18n parity discipline carries — every new key MUST land in both EN and ES.

### Established Patterns
- **i18n parity** (Phase 4/6/7 lock) — every catalog id needs full keyset in both `en/plants.json` and `es/plants.json`.
- **Voseo for ES** — `tip` and `description` use voseo verb forms (`regá`, `tocá`, `elegí`, `tenés`).
- **Defensive fallback ladder** (Phase 4 lock) — applies at lookup site: `getCatalogEntry(plant.dbId)?.tip ?? ''`. Never crash on missing entry.
- **Single SSOT for catalog data** — `plantDatabase.ts` is canonical; consumers read via `getCatalogEntry`, never duplicate.
- **`__DEV__`-gated logging** — warnings on missing/aliased lookups go through `if (__DEV__) console.warn(...)`, no logger abstraction.
- **Smoke-runner discipline** (Phases 4/5/6/7) — single-compile-path policy; `scripts/smoke-phase08.mjs` follows the same idiom as 06/07.
- **Schema is additive** — adding `_aliases` to `PlantDBEntry` is a non-breaking change. No schemaVersion bump.

### Integration Points
- **`PlantCard.tsx`:** today reads `plant.typeName`, `plant.tip` from instance. Phase 8 swaps to `getCatalogEntry(plant.dbId)?.{typeName,tip}` with `?? ''` fallback.
- **`MyPlantDetailModal.tsx`:** today renders `plant.description`, `plant.tip`, `plant.problems`, `plant.nutrients`. Same swap pattern.
- **`PlantHealthDetail.tsx`:** today uses `plant.problems`, `plant.nutrients` in health summaries. Same swap.
- **`PlantDetailModal.tsx`:** catalog-side render of a `PlantDBEntry` directly — already uses entry, just needs to consume new fields if it doesn't.
- **`PlantIdentifier/IdentificationResults.tsx`:** identification result displays `tip`/`description` from converted PlantNet result. Phase 8 doesn't change this directly — identification results aren't catalog entries.
- **`useStorage.updatePlant()`:** Phase 8 adds the alias-rewrite-on-save logic at the entry point so `dbId` always normalizes to canonical.
- **CI guard scripts:** new files `scripts/check-i18n-keys.mjs` and `scripts/check-images.mjs`. `package.json` scripts entries.

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" (Phase 4 lock, carried) — image-upload deferral is acceptable; ship code that points at 404s and document in backlog.
- Single SSOT for catalog data extends the Phase-5/6/7 SSOT discipline — `plantDatabase.ts` is the only place per-plant defaults live; `migration.ts` mappers are legacy-only.
- Voseo discipline (Phase 5/7 lock) extends to all 14 new ES entries' `tip`/`description` text.
- Lavender split is the only entry rename in Phase 8. The `_aliases` mechanism is built for it but generally available.
- CI guards are local-only (no GitHub Actions infrastructure) — match the project's "manual deploys + Expo Go testing" reality. Documenting in CLAUDE.md is sufficient.

</specifics>

<deferred>
## Deferred Ideas

- **Image upload to Supabase Storage** — manual step, in v1.1 device-test backlog. Must complete before declaring v1.1 ready.
- **GitHub Actions / pre-commit hook for CI guards** — no CI infrastructure in project; manual runs are sufficient for now. Revisit if team grows.
- **Auto-fix mode for CI guards** — rejected; would mask drift.
- **Per-month (12-bucket) watering schedule** — v2.0 (ADV-01 in REQUIREMENTS.md).
- **Auto-rescheduling watering based on weather forecast** — v2.0 (ADV-02).
- **Removal of legacy fields on Plant type** (`tip`, `description`, etc.) — v1.2, mirrors SCHEMA-08 cleanup stance.
- **Removal of legacy `applyColdFactor` per-category constants** — v1.2 if no consumers remain after Phase 8 catalog overrides land.
- **Horticultural review by external expert** — out of scope; researcher uses public horticultural sources (INTA, etc.) for v1.1.
- **Per-region catalog variants** (different cold tolerance for different latitudes) — out of scope; current 3-zone seasonality (Phase 5) handles regional differences.

</deferred>

---

*Phase: 08-catalog-rebalance*
*Context gathered: 2026-05-02*
