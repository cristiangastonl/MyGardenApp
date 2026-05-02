---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "04"
subsystem: ui-components
tags: [light-picker, water-schedule, LIGHT-01, LIGHT-02, WATER-01, WATER-02, WATER-03, i18n]
dependency_graph:
  requires:
    - "OUTDOOR_TYPE_IDS from lightLabel.ts (Phase 6 lock)"
    - "LightLevel, WaterMode, WaterSchedule types from types/index.ts (Phase 4)"
    - "lightLevel.{indoor,outdoor}.{level} i18n keys (Phase 6)"
    - "lightLevelHint.{indoor,outdoor}.{level} i18n keys (Plan 07-03 — ES present, EN added here)"
    - "waterSchedule.* i18n keys (Plan 07-03 — ES present, EN added here)"
  provides:
    - "export function LightLevelPicker — 4-card 2x2 grid, locale-aware, indoor/outdoor branch"
    - "export function WaterScheduleEditor — segmented mode toggle + dual warm/cold numeric inputs"
  affects:
    - "src/components/AddPlantModal.tsx (Plan 07-05 — consumes both components)"
    - "src/components/PlantIdentifier/IdentificationResults.tsx (Plan 07-06 — consumes LightLevelPicker)"
tech_stack:
  added: []
  patterns:
    - "flexBasis 48% + flexWrap for 2x2 grid — no FlatList for fixed 4-card layout"
    - "Conditional render (not disabled) for HIDE-not-disable soil_check mode"
    - "OUTDOOR_TYPE_IDS single SSOT import — never redefine locally"
    - "minHeight: 44 + height: 44 touch targets per Apple HIG"
key_files:
  created:
    - "src/components/LightLevelPicker.tsx"
    - "src/components/WaterScheduleEditor.tsx"
  modified:
    - "src/i18n/locales/en/common.json"
decisions:
  - "LightLevelPicker icon mapping: direct=☀️ bright_indirect=🌤️ medium_indirect=⛅ low=☁️ (emoji throughout convention)"
  - "flexBasis 48% chosen over FlatList for the fixed 4-card 2x2 layout per RESEARCH §Don't Hand-Roll lock"
  - "WaterScheduleEditor HIDE confirmed: mode==='fixed' wraps inputs in conditional {mode==='fixed' && <View>}; soil_check shows only explainer text — inputs not in tree at all, no disabled= prop anywhere"
  - "Rule 3 auto-fix: EN i18n keys (lightLevelHint + waterSchedule) missing from en/common.json — Plan 07-03 shipped ES only; added EN parity in same Task 1 commit to unblock both components"
  - "cold min=2 chosen per Phase 4 applyColdFactor heuristic; warm min=1 is the absolute floor for any valid interval"
metrics:
  duration: "~4 min"
  completed: "2026-05-01"
  tasks_completed: 2
  files_modified: 3
---

# Phase 7 Plan 4: LightLevelPicker + WaterScheduleEditor Components Summary

Two new reusable components that form the Phase 7 picker UX: `LightLevelPicker` (4-card 2x2 grid with locale-aware indoor/outdoor labels) and `WaterScheduleEditor` (segmented mode toggle + conditional dual warm/cold numeric inputs). Both consume i18n keys and the locked `OUTDOOR_TYPE_IDS` SSOT from Phase 6.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create LightLevelPicker component (4-card 2x2, locale-aware, indoor/outdoor) | 2d49376 | src/components/LightLevelPicker.tsx, src/i18n/locales/en/common.json |
| 2 | Create WaterScheduleEditor component (segmented mode + dual warm/cold inputs) | 7cc459a | src/components/WaterScheduleEditor.tsx |

## Artifact Details

### LightLevelPicker (src/components/LightLevelPicker.tsx, 112 lines)

- 4 cards rendered via `LEVELS.map()` inside `flexWrap: 'wrap'` grid — no FlatList
- `flexBasis: '48%'` produces 2 cards per row → 2x2 layout
- Indoor/outdoor branch: `const ns = OUTDOOR_TYPE_IDS.has(typeId) ? 'outdoor' : 'indoor'`
- OUTDOOR_TYPE_IDS imported from `../utils/lightLabel` — single SSOT, not redefined
- Selected card: `borderColor: colors.green` + `backgroundColor: colors.infoBg`
- Unselected card: `borderColor: colors.borderLight` + `backgroundColor: colors.bgPrimary`
- Touch target: `minHeight: 44` on `.card` + `padding: spacing.md` ensures > 44pt
- i18n: `t('lightLevel.${ns}.${level}')` (label) + `t('lightLevelHint.${ns}.${level}')` (hint)
- Icon mapping: `direct → ☀️`, `bright_indirect → 🌤️`, `medium_indirect → ⛅`, `low → ☁️`

### WaterScheduleEditor (src/components/WaterScheduleEditor.tsx, 202 lines)

- Segmented control: plain `flexDirection: 'row'` View with 2 `TouchableOpacity` pills
- Selected pill: `backgroundColor: colors.green`; unselected: transparent in `colors.bgPrimary` container
- `minHeight: 44` on `.segment` + `height: 44` on `.numberButton` — both touch-target compliant
- Fixed mode: `{mode === 'fixed' && <View style={styles.inputsRow}>...}` — conditional render
- Soil-check mode: `{mode === 'soil_check' && <Text ...>}` — only explainer text
- `disabled=` prop: ZERO occurrences — HIDE-not-disable invariant confirmed
- Warm clamp: `Math.max(1, schedule.warm + delta)` | Cold clamp: `Math.max(2, schedule.cold + delta)`
- TextInput direct edit validates `n >= 1` (warm) / `n >= 2` (cold) before calling onScheduleChange

## Touch-Target Verification

```
grep -c "minHeight: 44" src/components/LightLevelPicker.tsx  → 1 (.card)
grep -c "minHeight: 44" src/components/WaterScheduleEditor.tsx → 1 (.segment)
grep -c "height: 44"    src/components/WaterScheduleEditor.tsx → 1 (.numberButton)
```

## OUTDOOR_TYPE_IDS Single SSOT Verification

```
grep -c "OUTDOOR_TYPE_IDS" src/components/LightLevelPicker.tsx → 4 (import + usage + comment)
grep -c "OUTDOOR_TYPE_IDS" src/components/WaterScheduleEditor.tsx → 0 (WaterEditor has no outdoor branch)
```

## Regression Results

- `npx tsc --noEmit` — exits 0 (new components self-contained)
- `node scripts/smoke-phase07.mjs` — PASS 21/21 (no new assertions; existing hold)
- `node scripts/smoke-phase06.mjs` — PASS 82/82 (regression preserved)
- `node scripts/migration-smoke-test.mjs` — PASS 106/106 (regression preserved)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing EN i18n keys for lightLevelHint + waterSchedule**
- **Found during:** Task 1 setup (pre-implementation read of en/common.json)
- **Issue:** Plan 07-03 shipped `lightLevelHint` and `waterSchedule` keys only in `es/common.json`; `en/common.json` had neither block. Both components call `t('lightLevelHint.*')` and `t('waterSchedule.*')` — missing EN keys would produce raw key strings in the EN locale at runtime.
- **Fix:** Added EN-locale equivalents of both blocks immediately after `lightLevel` in `en/common.json`:
  - `lightLevelHint.indoor.*`: "By a south-facing window" / "1m from a bright window" / "2m from a bright window" / "Hallway with no direct sun"
  - `lightLevelHint.outdoor.*`: "No shade all day" / "Shade from a nearby tree" / "Half the day in shade" / "Under a roof or north wall"
  - `waterSchedule.*`: "Schedule" / "Check-in" / "Warm season" / "Cold season" / "We'll remind you every {{days}} days to touch the soil"
- **Files modified:** `src/i18n/locales/en/common.json`
- **Commit:** 2d49376 (bundled with Task 1)

## Self-Check: PASSED

- FOUND: src/components/LightLevelPicker.tsx (export function LightLevelPicker: count=1; OUTDOOR_TYPE_IDS: count=4; lightLevelHint: count=2; minHeight: 44: count=1; colors.green: count=3; FlatList: count=0)
- FOUND: src/components/WaterScheduleEditor.tsx (export function WaterScheduleEditor: count=1; waterSchedule.*: count=5; mode==='fixed': count=4; mode==='soil_check': count=4; disabled=: count=0; minHeight/height 44: count=2)
- FOUND: src/i18n/locales/en/common.json (lightLevelHint block + waterSchedule block present)
- Commits: 2d49376, 7cc459a — both present in git log
- tsc --noEmit: exits 0
- Smoke tests: 21/21 + 82/82 + 106/106 all PASS
