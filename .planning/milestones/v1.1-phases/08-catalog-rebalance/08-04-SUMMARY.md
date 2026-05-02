---
phase: 08-catalog-rebalance
plan: 04
subsystem: components
tags: [read-site-migration, getCatalogEntry, live-lookup, defensive-fallback, catalog-propagation]

# Dependency graph
requires:
  - phase: 08-catalog-rebalance
    plan: 01
    provides: getCatalogEntry helper + getTranslatedPlant; smoke-phase08 with A1-A9 assertions
  - phase: 08-catalog-rebalance
    plan: 03
    provides: 64-entry PLANT_DATABASE with expert-vetted values + lavender split + 12 new outdoor entries
provides:
  - "PlantCard: live catalog tip lookup via getCatalogEntry(plant.databaseId)"
  - "MyPlantDetailModal: primary id-based lookup via getCatalogEntry before findDatabaseEntry fuzzy fallback"
  - "PlantHealthDetail: Phase 8 (CAT-04) verified catalog-clean (0 direct Plant-instance content reads)"
  - "PlantDetailModal: canonical re-lookup via getCatalogEntry(rawPlant.id) before getTranslatedPlant"
  - "Patch-update-propagation contract (CAT-04): PLANT_DATABASE edits reach all read-side consumers on next render"
affects:
  - "08-05: check-i18n-keys.mjs CI guard can run against 64-entry catalog; all 4 consumers now route through getCatalogEntry"
  - "Future consumers: defensive 3-rung fallback pattern established (translatedEntry -> plant.field -> '' / [] / undefined)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defensive 3-rung fallback: translatedEntry?.field ?? plant.field ?? '' (or ?? [] for arrays)"
    - "getCatalogEntry primary, findDatabaseEntry fuzzy fallback for custom plants without databaseId"
    - "Canonical re-lookup pattern for entry-driven modals: getCatalogEntry(rawEntry.id) ?? rawEntry before getTranslatedPlant"
    - "Comment-only path for catalog-clean files: Phase 8 (CAT-04) verification comment where 0 direct reads confirmed"
    - "Conditional migration decision rule: grep -cE 'plant.(tip|description|problems|nutrients)' determines migration vs comment-only"

key-files:
  created: []
  modified:
    - src/components/PlantCard.tsx
    - src/components/MyPlantDetailModal.tsx
    - src/components/PlantHealthDetail.tsx
    - src/components/PlantDetailModal.tsx

key-decisions:
  - "PlantCard tip source upgraded: getCatalogEntry(plant.databaseId) primary (per-plant tip) > getPlantTypes() category tip > empty string. Preserves category-level generic tip as a middle fallback for plants with databaseId but no matching catalog tip (defensive)."
  - "MyPlantDetailModal already entry-driven for content display (dbEntry via findDatabaseEntry + getTranslatedPlant already existed). Migration adds getCatalogEntry as the preferred primary lookup; findDatabaseEntry stays as fuzzy fallback for user-created custom plants without databaseId."
  - "PlantHealthDetail verified catalog-clean (Warning 5 strict rule honored): 0 grep matches for plant.{tip|description|problems|nutrients}. Uses getLightLabel utility + waterSchedule (instance scheduling state). Comment-only path applied — migration would add no value."
  - "PlantDetailModal is entry-driven (receives PlantDBEntry prop directly). Added canonical re-lookup (getCatalogEntry(rawPlant.id) ?? rawPlant) before getTranslatedPlant to ensure live PLANT_DATABASE values render even if caller passed a stale list-snapshot PlantDBEntry."
  - "No plant.dbId references written anywhere: all code edits use plant.databaseId (Pitfall 4 avoided)."

patterns-established:
  - "Read-site consumer migration checklist: (1) grep for plant.(tip|description|problems|nutrients) to determine scope, (2) add import, (3) add lookup once at component top, (4) apply 3-rung fallback to each read, (5) verify no plant.dbId, (6) tsc + smoke"
  - "Entry-driven modal pattern (PlantDetailModal): getCatalogEntry canonical re-lookup guards against stale snapshot entries; getTranslatedPlant receives the canonical live entry"
  - "Warning 5 strict rule: comment-only path valid ONLY when grep returns 0; migration required when grep returns >= 1 — no loophole"

requirements-completed: [CAT-04]

# Metrics
duration: 4min
completed: 2026-05-02
---

# Phase 8 Plan 04: Read-Site Consumer Migration Summary

**4 read-side components migrated to getCatalogEntry live lookup: PlantCard (tip), MyPlantDetailModal (primary id lookup), PlantHealthDetail (verified clean), PlantDetailModal (canonical re-lookup); CAT-04 patch-update-propagation contract shippable**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-02T12:27:49Z
- **Completed:** 2026-05-02T12:32:41Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- PlantCard: `getCatalogEntry(plant.databaseId)` + `getTranslatedPlant` added; tip source upgraded from generic category tip (`getPlantTypes()`) to per-plant catalog tip (`translatedEntry?.tip`) with 3-rung defensive fallback
- MyPlantDetailModal: `getCatalogEntry` imported; existing `dbEntry` useMemo upgraded from `findDatabaseEntry`-only to `getCatalogEntry(plant.databaseId) ?? findDatabaseEntry(plant)` — direct id lookup preferred, fuzzy match retained as fallback for custom plants
- PlantHealthDetail: Warning 5 strict rule applied — `grep -cE "plant.(tip|description|problems|nutrients)"` returned 0; Phase 8 (CAT-04) verification comment added; comment-only path is valid (no loophole)
- PlantDetailModal: Verified entry-driven (receives `PlantDBEntry` prop, not `Plant` instance); added `getCatalogEntry(rawPlant.id) ?? rawPlant` canonical re-lookup before `getTranslatedPlant` to guarantee live PLANT_DATABASE values render
- All plan gates passed: tsc green; smoke-phase08 PASS 396/396; smoke-phase07 100/100; smoke-phase06 82/82; migration-smoke-test 106/106
- Zero `plant.dbId` references in any edit (Pitfall 4 fully observed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate PlantCard.tsx to getCatalogEntry lookup** - `3d785a8` (feat)
2. **Task 2: Migrate MyPlantDetailModal.tsx + PlantHealthDetail.tsx** - `0618b96` (feat)
3. **Task 3: Verify PlantDetailModal.tsx entry-driven + add canonical re-lookup** - `1941fdb` (feat)

## Files Created/Modified
- `src/components/PlantCard.tsx` — import getCatalogEntry + getTranslatedPlant; catalogEntry + translatedEntry computed once at component top; tip: translatedEntry?.tip ?? plantType?.tip ?? ''
- `src/components/MyPlantDetailModal.tsx` — import getCatalogEntry; dbEntry useMemo: (getCatalogEntry(plant.databaseId) ?? findDatabaseEntry(plant)) pattern; findDatabaseEntry retained as import + fallback
- `src/components/PlantHealthDetail.tsx` — Phase 8 (CAT-04) verification comment added at file top; no code changes (0 direct content reads confirmed)
- `src/components/PlantDetailModal.tsx` — import getCatalogEntry; Phase 8 marker comment; canonical re-lookup: getCatalogEntry(rawPlant.id) ?? rawPlant before getTranslatedPlant

## Decisions Made
- **PlantCard tip upgrade:** The existing code read `tip` from `getPlantTypes()` (a generic category-level tip shared by all plants of that type). `getCatalogEntry(plant.databaseId)` provides the per-plant specialist tip from PLANT_DATABASE — more specific and patchable. Both sources retained as a 3-rung ladder: `translatedEntry?.tip ?? plantType?.tip ?? ''`. This means a typo fix in a specific plant's `tip` in `plantDatabase.ts` now propagates to PlantCard on next render (CAT-04 payoff).
- **PlantHealthDetail comment-only is valid:** Warning 5 enforcement ran the strict grep before deciding. The file genuinely has no `plant.{tip|description|problems|nutrients}` reads — it shows scheduling state (`waterSchedule.warm`, `sunDays`, `outdoorDays`) and uses the `getLightLabel` utility (not plant.tip). Migration would be form-over-substance; comment-only is the correct path.
- **PlantDetailModal canonical re-lookup:** The modal already calls `getTranslatedPlant(rawPlant)`. However, if the caller passed a list-snapshot `PlantDBEntry` (e.g., from a filtered array populated at mount), and a background catalog update patched a field, the render would show stale data. The canonical re-lookup `getCatalogEntry(rawPlant.id) ?? rawPlant` adds one O(N) call (N<64, negligible) and guarantees live values. The `?? rawPlant` fallback means the modal still works if somehow the id is not in the catalog.

## Deviations from Plan

None — plan executed exactly as written. All 4 components handled per their specified migration paths. No `plant.dbId` references encountered or created.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All 4 read-site consumers (PlantCard, MyPlantDetailModal, PlantHealthDetail, PlantDetailModal) route through getCatalogEntry
- CAT-04 patch-update-propagation contract is shippable: editing any field in PLANT_DATABASE now propagates to all read-side consumers on next render
- Plan 05 (check-i18n-keys.mjs CI guard) unblocked: can run against 64-entry catalog, verify all entry ids have i18n keys

## Self-Check: PASSED

- FOUND: src/components/PlantCard.tsx
- FOUND: src/components/MyPlantDetailModal.tsx
- FOUND: src/components/PlantHealthDetail.tsx
- FOUND: src/components/PlantDetailModal.tsx
- FOUND commit: 3d785a8 (Task 1)
- FOUND commit: 0618b96 (Task 2)
- FOUND commit: 1941fdb (Task 3)

---
*Phase: 08-catalog-rebalance*
*Completed: 2026-05-02*
