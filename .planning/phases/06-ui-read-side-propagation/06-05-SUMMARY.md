---
phase: 06-ui-read-side-propagation
plan: "05"
subsystem: components
tags: [light-level, catalog-surfaces, PlantDBEntry, wave-2, dead-ui-v1.1-ready]
dependency_graph:
  requires:
    - src/utils/lightLabel.ts (Plan 06-01 — getLightLabel, LightLabelInput, OUTDOOR_TYPE_IDS)
    - src/i18n/locales/en/common.json (Plan 06-02 — lightLevel.* keys)
    - src/i18n/locales/es/common.json (Plan 06-02 — lightLevel.* keys, voseo)
  provides:
    - src/components/PlantDetailModal.tsx (catalog detail modal sun info item renders localized lightLevel label)
    - src/components/PlantDatabaseCard.tsx (catalog browse card sun badge renders localized lightLevel label)
  affects:
    - V1.1 EXPLORE_TAB flag flip — both surfaces ship with new copy when flag goes true; no follow-up needed
    - Plan 06-06 (TodayScreen) — final Phase 6 work; no changes to these catalog surfaces from later plans
tech_stack:
  added: []
  patterns:
    - PlantDBEntry → LightLabelInput mapping at call site ({ ...entry, typeId: entry.category })
    - getLightLabel defensive 3-rung ladder inherited via helper (lightLevel ?? sunHoursToLightLevel(sunHours) ?? bright_indirect)
    - numberOfLines={2} on badge Text to allow label wrapping in compact 48% card layout
key_files:
  created: []
  modified:
    - src/components/PlantDetailModal.tsx (import + sun infoItem swap; 2 lines changed)
    - src/components/PlantDatabaseCard.tsx (2 imports + useTranslation hook + sun badge swap; 6 lines changed)
decisions:
  - "PlantDBEntry.category mapped to typeId at call site ({ ...plant, typeId: plant.category }) — single getLightLabel signature handles both Plant and PlantDBEntry without overloading"
  - "numberOfLines={2} added to sun badge Text in PlantDatabaseCard — localized labels (e.g. 'Luz brillante indirecta') are longer than the legacy '4h' badge; wrapping prevents text truncation at 48% card width"
  - "Water sides preserved: plantDetailModal.everyDays + {plant.waterDays}d badge unchanged — catalog water-side migration is Phase 8 territory (SCHEMA-08 boundary)"
  - "Manual UAT deferred: both surfaces are dead UI in MVP (only mounted via ExploreScreen behind Features.EXPLORE_TAB === false); V1.1 flag flip will surface them"
metrics:
  duration: "2 min"
  completed: "2026-05-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 6 Plan 5: Wave 2 Catalog Surfaces — PlantDetailModal + PlantDatabaseCard Light Labels Summary

**One-liner:** Wave 2 catalog surfaces: swapped PlantDetailModal sun infoItem and PlantDatabaseCard sun badge from legacy sunHours text to localized getLightLabel output via PlantDBEntry.category → typeId mapping; tsc clean, smoke 82/82 PASS.

---

## What Was Built

### Task 1: PlantDetailModal.tsx — sun infoItem swap to getLightLabel

**Files changed:** `src/components/PlantDetailModal.tsx` (2 lines changed: +1 import, -1/+1 infoValue)

Two surgical edits:

1. **Edit 1 — Add import** (after theme import, line 19):
   ```typescript
   import { getLightLabel } from '../utils/lightLabel';
   ```

2. **Edit 2 — Swap sun infoValue** (line 98):
   - Before: `{t('plantDetailModal.hoursPerDay', { hours: plant.sunHours })}`
   - After: `{getLightLabel({ ...plant, typeId: plant.category }, t)}`

The spread `{ ...plant, typeId: plant.category }` maps PlantDBEntry's `category` field to the `typeId` key that `LightLabelInput` expects. The defensive ladder (lightLevel → sunHoursToLightLevel(sunHours) → bright_indirect) is handled entirely inside `getLightLabel`. The `t` function is already available from `useTranslation()` at line 36.

**Water side preserved:** `t('plantDetailModal.everyDays', { days: plant.waterDays })` at line 93 is unchanged — catalog water-rendering is Phase 8 territory.

**Verification:**
- `grep -c "import.*getLightLabel.*from '../utils/lightLabel'" PlantDetailModal.tsx` === 1
- `grep -c "t('plantDetailModal.hoursPerDay'" PlantDetailModal.tsx` === 0
- `grep -c "getLightLabel" PlantDetailModal.tsx` === 2 (import + usage)
- `grep -c "typeId: plant.category" PlantDetailModal.tsx` === 1
- `grep -c "t('plantDetailModal.everyDays'" PlantDetailModal.tsx` === 1 (water preserved)
- No PlantDetailModal-specific tsc errors

### Task 2: PlantDatabaseCard.tsx — sun badge swap to getLightLabel

**Files changed:** `src/components/PlantDatabaseCard.tsx` (6 lines changed: +2 imports, +1 hook call, -1/+3 badge JSX)

Three surgical edits:

1. **Edit 1 — Add imports** (after theme import, lines 5-6):
   ```typescript
   import { useTranslation } from 'react-i18next';
   import { getLightLabel } from '../utils/lightLabel';
   ```
   (PlantDatabaseCard previously had no i18n usage — this is the first `t` consumption in this component.)

2. **Edit 2 — Hook call** (first line inside function body, line 14):
   ```typescript
   const { t } = useTranslation();
   ```

3. **Edit 3 — Swap sun badge** (lines 34-36):
   - Before: `<Text style={styles.badgeText}>☀️ {plant.sunHours}h</Text>`
   - After:
     ```tsx
     <Text style={styles.badgeText} numberOfLines={2}>
       ☀️ {getLightLabel({ ...plant, typeId: plant.category }, t)}
     </Text>
     ```
   The `numberOfLines={2}` allows label text to wrap within the compact 48%-width card — localized labels like "Luz brillante indirecta" are 4-5x longer than the legacy "4h" badge.

**Water badge preserved:** `{plant.waterDays}d` at line 31 is unchanged.

**Verification:**
- `grep -c "import.*useTranslation.*from 'react-i18next'" PlantDatabaseCard.tsx` === 1
- `grep -c "import.*getLightLabel.*from '../utils/lightLabel'" PlantDatabaseCard.tsx` === 1
- `grep -c "plant.sunHours" PlantDatabaseCard.tsx` === 0 (legacy reference removed)
- `grep -c "getLightLabel" PlantDatabaseCard.tsx` === 2 (import + usage)
- `grep -c "{plant.waterDays}" PlantDatabaseCard.tsx` === 1 (water badge preserved)
- `grep -c "numberOfLines" PlantDatabaseCard.tsx` === 2 (name + badge, >= 1 satisfied)
- No PlantDatabaseCard-specific tsc errors

---

## PlantDBEntry → LightLabelInput Mapping

Both surfaces use the same call pattern:

```typescript
getLightLabel({ ...plant, typeId: plant.category }, t)
```

`PlantDBEntry.category` is a `PlantCategory` union (`"interior" | "exterior" | "aromaticas" | "huerta" | "frutales" | "suculentas"`). These exact strings are the same values that `OUTDOOR_TYPE_IDS` (`ReadonlySet<string>`) uses for the indoor/outdoor branch. The spread copies `plant.lightLevel` and `plant.sunHours` (both optional on `PlantDBEntry`) through to the helper's defensive ladder. TypeScript compiles this cleanly because `LightLabelInput` is a structural type (`{ lightLevel?: LightLevel; sunHours?: number; typeId: string }`) — satisfied by the spread.

---

## Phase 6 Boundary Respected

| Surface | Sun side | Water side |
|---------|----------|------------|
| PlantDetailModal.tsx | ✅ getLightLabel | ✅ unchanged (everyDays + waterDays) |
| PlantDatabaseCard.tsx | ✅ getLightLabel | ✅ unchanged (waterDays + 'd') |

Catalog water-side migration (waterSchedule/waterMode for PlantDBEntry) belongs to the Phase 8 catalog rebalance. Phase 6 only handles LIGHT-06/07 on these surfaces.

---

## MVP-Dead UI Note

Both components are currently dead UI in MVP:
- `PlantDetailModal` and `PlantDatabaseCard` are only mounted via `ExploreScreen`
- `ExploreScreen` is rendered only when `Features.EXPLORE_TAB === true` (currently `false`)

Structural correctness is verified by `npx tsc --noEmit` + grep acceptance criteria + `node scripts/smoke-phase06.mjs`. Manual UAT is deferred to V1.1 — when the `EXPLORE_TAB` flag flips, both surfaces ship with the new localized copy intact. No follow-up work needed.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Plan-Level Verification

- `npx tsc --noEmit` — PlantDetailModal.tsx and PlantDatabaseCard.tsx: 0 errors (pre-existing errors from parallel Wave 2 plans 06-03/06-04 are orthogonal)
- `grep -rn "plant.sunHours" src/components/PlantDetailModal.tsx src/components/PlantDatabaseCard.tsx` === 0 matches
- `node scripts/smoke-phase06.mjs` — 82/82 PASS (unchanged from Wave 1)
- `node scripts/migration-smoke-test.mjs` — 106/106 PASS (Phase 4/5 regression clean)

---

## Commits

| Hash | Task | Description |
|------|------|-------------|
| d86c347 | Task 1 | feat(06-05): PlantDetailModal.tsx — sun infoItem swap to getLightLabel |
| 6449b5f | Task 2 | feat(06-05): PlantDatabaseCard.tsx — sun badge swap to getLightLabel |

---

## Hand-off to Plan 06-06

Plan 06-06 (TodayScreen empty-state row — UX-03) is the final Phase 6 work. No changes to these catalog surfaces from later plans. When Plan 06-06 ships, Phase 6 is complete and the Phase 6 smoke runner + tsc should be run as the final gate before `/gsd:verify-work`.

---

## Self-Check: PASSED
