---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "06"
subsystem: plant-identification
tags: [light-level, plant-identification, LIGHT-05, picker, IdentifiedPlant, convertPlantNetResult]
dependency_graph:
  requires:
    - "LightLevel type from src/types/index.ts (Phase 4)"
    - "sunHoursToLightLevel mapper from src/utils/migration.ts (Phase 4)"
    - "LightLevelPicker component from src/components/LightLevelPicker.tsx (Plan 07-04)"
    - "identification.lightLevelLabel i18n key (Plan 07-03)"
  provides:
    - "IdentifiedPlant.lightLevel?: LightLevel field (src/types/index.ts)"
    - "convertPlantNetResult populates lightLevel via 3-rung defensive ladder (src/utils/plantIdentification.ts)"
    - "IdentificationResults renders LightLevelPicker in both single + multi-result branches"
    - "onAddPlant signature: (lightLevel: LightLevel) => void — user-picked value flows to saved Plant"
    - "PlantIdentifierModal injects lightLevel into plantData at save time"
  affects:
    - "src/screens/OnboardingScreen.tsx (receives Plant with lightLevel via PlantIdentifierModal.onAddPlant callback — no change needed)"
    - "src/screens/TodayScreen.tsx (same — no change needed)"
    - "src/screens/PlantsScreen.tsx (same — no change needed)"
tech_stack:
  added: []
  patterns:
    - "3-rung defensive ladder: catalog v1.1 lightLevel → sunHoursToLightLevel(sunHours) → 'bright_indirect'"
    - "useEffect re-sync pattern for selectedLightLevel when selectedPlant changes (multi-result tap)"
    - "Client-side lightLevel derivation (NOT edge-function) — Pitfall 7 option B for Phase 7"
key_files:
  created: []
  modified:
    - "src/types/index.ts"
    - "src/utils/plantIdentification.ts"
    - "src/components/PlantIdentifier/IdentificationResults.tsx"
    - "src/components/PlantIdentifier/PlantIdentifierModal.tsx"
decisions:
  - "Client-side derivation (not edge-function) for Phase 7 — RESEARCH §Pitfall 7 preferred option A (server-side mapping) deferred to Phase 8 catalog rebalance; Phase 7 locked to option B (client-side) per CONTEXT.md 'may map' wording and lower confidence on PlantNet sunlight tag presence"
  - "onAddPlant signature changed to (lightLevel: LightLevel) => void — breaking but cleaner; picker is now mandatory part of the flow (not optional override); only immediate caller PlantIdentifierModal.handleAddPlant updated"
  - "selectedLightLevel re-syncs via useEffect([selectedPlant]) — not via useMemo — because the value must be mutable (user can change it after sync)"
  - "typeIdForPicker derived from selectedPlant.indoor === false (explicit false) not !selectedPlant.indoor — prevents undefined/null from being treated as outdoor"
metrics:
  duration: "~8 min"
  completed: "2026-05-01"
  tasks_completed: 2
  files_modified: 4
---

# Phase 7 Plan 6: lightLevel End-to-End Through Plant Identification Flow Summary

LIGHT-05 wired end-to-end: `IdentifiedPlant` type extended with optional `lightLevel?: LightLevel`; `convertPlantNetResult` populates `lightLevel` via a 3-rung defensive ladder (catalog v1.1 → sunHoursToLightLevel → `'bright_indirect'`); `IdentificationResults` renders `<LightLevelPicker>` in both branches; user-picked value threads through `onAddPlant(lightLevel)` → `PlantIdentifierModal.handleAddPlant(lightLevel)` → `plantData.lightLevel` → saved Plant.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Extend IdentifiedPlant type + update convertPlantNetResult to populate lightLevel | a80f4f1 | src/types/index.ts, src/utils/plantIdentification.ts |
| 2 | IdentificationResults — render LightLevelPicker, manage selectedLightLevel state, thread to onAddPlant | 04eae3c | src/components/PlantIdentifier/IdentificationResults.tsx, src/components/PlantIdentifier/PlantIdentifierModal.tsx |

## Artifact Details

### IdentifiedPlant type extension (src/types/index.ts)

- `lightLevel?: LightLevel` added as last field with JSDoc: `v1.1 Phase 7 (LIGHT-05). Populated client-side from catalog match or sunHours mapping. User overrides via picker before save.`
- `LightLevel` was already imported/defined in the same file (Phase 4 Plan 02)
- Field count: `grep -c "lightLevel?: LightLevel" src/types/index.ts` → 3 (Plant + PlantDBEntry + IdentifiedPlant)

### convertPlantNetResult 3-rung defensive ladder (src/utils/plantIdentification.ts)

- Import added: `import { sunHoursToLightLevel } from './migration';`
- **Rung 1+2 (dbPlant path):**
  ```typescript
  lightLevel: translated.lightLevel
    ?? (typeof translated.sunHours === 'number' ? sunHoursToLightLevel(translated.sunHours) : 'bright_indirect'),
  ```
  Rung 1: catalog v1.1 `lightLevel` field (Phase 4 codemod populated). Rung 2: mapped from `sunHours` if present. Rung 3: implicit `'bright_indirect'` default via the `?? 'bright_indirect'` tail.
- **Rung 2+3 (genericCare path):**
  ```typescript
  lightLevel: typeof genericCare.sunHours === 'number'
    ? sunHoursToLightLevel(genericCare.sunHours)
    : 'bright_indirect',
  ```
  No catalog entry for this plant — derive from GENERIC_CARE_DATA sunHours or default.
- Legacy `waterDays`/`sunHours` fields unchanged — backward compat preserved.

### IdentificationResults — LightLevelPicker integration (src/components/PlantIdentifier/IdentificationResults.tsx)

- Imports added: `LightLevel` from `'../../types'`; `LightLevelPicker` from `'../LightLevelPicker'`
- Props interface: `onAddPlant: (lightLevel: LightLevel) => void` (was `() => void`)
- State:
  ```typescript
  const [selectedLightLevel, setSelectedLightLevel] = useState<LightLevel>(
    selectedPlant?.lightLevel ?? 'bright_indirect'
  );
  ```
- Re-sync effect:
  ```typescript
  useEffect(() => {
    if (selectedPlant) {
      setSelectedLightLevel(selectedPlant.lightLevel ?? 'bright_indirect');
    }
  }, [selectedPlant]);
  ```
- `typeIdForPicker = selectedPlant?.indoor === false ? 'exterior' : 'interior'`
- **Single-result branch:** `<LightLevelPicker>` inserted between `<PlantResultCard>` and `<View style={styles.actions}>`. Add button: `onPress={() => onAddPlant(selectedLightLevel)}`
- **Multiple-result branch:** `{selectedPlant && <View style={styles.pickerSection}>...<LightLevelPicker>...</View>}` inserted before actions. Add button: `onPress={() => selectedPlant && onAddPlant(selectedLightLevel)}`
- Styles added: `pickerSection` (marginTop: spacing.lg, marginBottom: spacing.md), `pickerLabel` (uppercase, bodySemiBold, textSecondary)

### Caller update: PlantIdentifierModal (src/components/PlantIdentifier/PlantIdentifierModal.tsx)

- Import: `LightLevel` added to types import
- `handleAddPlant` signature changed from `() => void` to `(lightLevel: LightLevel) => void`
- `lightLevel` injected into `plantData` at build site:
  ```typescript
  // v1.1 Phase 7 (LIGHT-05): user-picked lightLevel from IdentificationResults picker
  lightLevel,
  ```
- The `onAddPlant` prop on `<IdentificationResults>` now passes `handleAddPlant` directly (signature match)
- No changes to OnboardingScreen, TodayScreen, or PlantsScreen — they receive `PlantIdentifierModal.onAddPlant: (plant: Omit<Plant, 'id'>, imageUri?) => Promise<Plant>` which is unchanged; the lightLevel is already inside `plant`

## Decision Rationale: Client-Side Derivation (Not Edge-Function)

LIGHT-05 requirement: "Plant identification flow returns plants with lightLevel populated (default bright_indirect if PlantNet doesn't supply enough info, user can adjust before saving)."

Per CONTEXT.md: the identify-plant edge function "may map" sunlight tags — this optional phrasing signals lower confidence in PlantNet sunlight tag presence/quality. RESEARCH §Pitfall 7 offers two options:
- **Option A (preferred):** Server-side mapping in identify-plant edge function
- **Option B (Phase 7 lock):** Client-side derivation using existing sunHoursToLightLevel mapper

Option A deferred to Phase 8 catalog rebalance when PlantNet sunlight tags will have been validated against the full catalog and the mapping quality is proven. Phase 7 uses Option B — no edge-function changes required, zero backend deploy risk.

## Regression Results

- `npx tsc --noEmit` — exits 0
- `node scripts/smoke-phase07.mjs` — Phase 7 smoke: PASS 82/82 (no new assertions required; existing hold)
- `node scripts/smoke-phase06.mjs` — Phase 6 smoke: PASS 82/82 (unchanged)
- `node scripts/migration-smoke-test.mjs` — Migration smoke: PASS 106/106 (unchanged)

## Deviations from Plan

None — plan executed exactly as written. The caller update described in the plan's Task 2 action (Edit 5) was implemented precisely as documented: `PlantIdentifierModal.handleAddPlant` updated to accept `(lightLevel: LightLevel)` and inject it into `plantData`. No architectural changes were needed. OnboardingScreen, TodayScreen, and PlantsScreen are unaffected because they use `PlantIdentifierModal.onAddPlant` which has a stable signature.

## Self-Check: PASSED

- FOUND: src/types/index.ts (lightLevel?: LightLevel count=3 — Plant + PlantDBEntry + IdentifiedPlant)
- FOUND: src/utils/plantIdentification.ts (sunHoursToLightLevel import=1; lightLevel: count=2; sunHoursToLightLevel count=3; 'bright_indirect' count=2)
- FOUND: src/components/PlantIdentifier/IdentificationResults.tsx (LightLevelPicker count=3; selectedLightLevel count=5; onAddPlant: (lightLevel: LightLevel) count=1; onAddPlant(selectedLightLevel) count=2; identification.lightLevelLabel count=2)
- FOUND: src/components/PlantIdentifier/PlantIdentifierModal.tsx (LightLevel import=1; lightLevel param in handleAddPlant=1; lightLevel in plantData=1)
- Commits: a80f4f1 (Task 1), 04eae3c (Task 2) — both present in git log
- tsc --noEmit: exits 0
- Smoke tests: 82/82 + 82/82 + 106/106 — all PASS
