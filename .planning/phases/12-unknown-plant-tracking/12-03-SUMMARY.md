---
phase: 12-unknown-plant-tracking
plan: "03"
subsystem: dev-tools / i18n
tags: [dev-tools, i18n, settings, unknown-plant-tracker]
dependency_graph:
  requires: ["12-01"]
  provides: ["TRACK-03 dev-tools read path for catalog prioritization"]
  affects: ["SettingsScreen.tsx", "en/common.json", "es/common.json"]
tech_stack:
  added: []
  patterns: ["Alert.alert dev-tools pattern", "async onPress fire-and-forget"]
key_files:
  modified:
    - src/screens/SettingsScreen.tsx
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json
decisions:
  - "Alert.alert for dev report (not Modal) per CONTEXT.md lock — simpler scope for dev-only feature"
  - "Read-only button — no clear/export affordance per CONTEXT.md non-negotiable"
  - "lastSeen.slice(0, 10) for YYYY-MM-DD display — truncates ISO 8601 to date portion"
  - "name field: prefers scientificName (commonName) when commonName present, else scientificName only"
metrics:
  duration_seconds: 89
  completed_date: "2026-05-02"
  tasks_completed: 2
  files_modified: 3
---

# Phase 12 Plan 03: Unknown Plants Dev-Tools Report Summary

**One-liner:** Dev-only Settings button that reads `@unknown_plants` AsyncStorage and shows an Alert.alert report sorted desc by count, with 4 new i18n keys (EN + voseo ES).

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add 4 i18n keys to en/common.json and es/common.json under `settings` object | dc953d0 |
| 2 | Add unknown plants report TouchableOpacity to SettingsScreen dev-tools section | 96839c3 |

## Files Modified

| File | Change |
|------|--------|
| `src/i18n/locales/en/common.json` | +4 keys under `settings`: unknownPlantsReport, unknownPlantsReportTitle, unknownPlantsReportEmpty, unknownPlantsReportFormatRow |
| `src/i18n/locales/es/common.json` | +4 keys (voseo Argentine tone): "Todavía no se registraron plantas desconocidas." confirmed |
| `src/screens/SettingsScreen.tsx` | +1 import (getUnknownPlantsReport) + 1 TouchableOpacity with async onPress in `__DEV__` block |

## i18n Details

- 4 keys × 2 locales = 8 new strings total
- Voseo confirmed: `"Todavía no se registraron plantas desconocidas."` (NOT Iberian "Aún no se han registrado")
- `{{count}}`, `{{name}}`, `{{lastSeen}}` placeholders identical across EN and ES (required by react-i18next runtime substitution)
- `npm run check:i18n-keys` exit status: **0** — `[check:i18n-keys] PASS — 64 catalog ids verified`

## Verification Results

- `npm run check:i18n-keys`: **PASS** (exit 0)
- `npx tsc --noEmit`: **exit 0** (clean)
- `node scripts/smoke-phase12.mjs`: **PASS 12/12** (unaffected — Plan 03 does not touch tracker source)
- Phase 10 SEC-01 grep guard: **all counts 0** (`EXPO_PUBLIC_PERENUAL_API_KEY` absent from all client bundle paths)

## Placement Order in Dev Tools

After this plan the `__DEV__` section renders in order:
1. Toggle Premium switch
2. Show Paywall button
3. **Unknown Plants Report button (NEW)**
4. Load v0 fixture button
5. Reset App button (destructive)

## Wave 2 Parallel Execution Note

Plan 03 ran in parallel with Plan 02 (Wave 2). Both plans depended only on Plan 01's exported contract (`getUnknownPlantsReport`, `UnknownPlantEntry`). File ownership was strictly disjoint:
- Plan 02 owns: `src/services/plantKnowledgeService.ts`
- Plan 03 owns: `src/screens/SettingsScreen.tsx`, `en/common.json`, `es/common.json`
No merge conflicts possible.

## Manual Verification Deferred

The following TRACK-03 rows from VALIDATION.md are deferred to `/gsd:verify-work` (device test):
- `12-03-03`: Settings dev-tools button renders and is tappable on device
- Empty-state Alert shows correct copy
- `__DEV__`-only check (button absent in production build)

## Deviations from Plan

None — plan executed exactly as written.
