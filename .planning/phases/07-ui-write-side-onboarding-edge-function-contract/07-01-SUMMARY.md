---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "01"
subsystem: storage-types
tags: [climate-override, appdata, usestorage, smoke-runner, wave-0]
dependency_graph:
  requires: []
  provides:
    - "ClimateOverride union type exported from src/types/index.ts"
    - "AppData.climateOverride? optional field (additive, schema version 1)"
    - "useStorage climateOverride state + setClimateOverride action"
    - "Both AppContent paths destructure climateOverride"
    - "scripts/smoke-phase07.mjs Phase 7 foundation smoke runner (PASS 4/4)"
  affects:
    - "src/utils/seasonality.ts (Plan 07-02 extends with getEffectiveSeason)"
    - "src/screens/TodayScreen.tsx (Plan 07-07 LocationBanner reads climateOverride)"
    - "src/components/SettingsPanel.tsx (Plan 07-07 setClimateOverride consumer)"
tech_stack:
  added: []
  patterns:
    - "Additive AppData field with ?? 'auto' hydration default (no schema bump)"
    - "Two-AppContent-paths discipline — both MVP and AUTH destructures updated atomically"
    - "Phase 4/5/6 single-compile-path smoke runner policy carried to Phase 7"
key_files:
  created:
    - "scripts/smoke-phase07.mjs"
  modified:
    - "src/types/index.ts"
    - "src/hooks/useStorage.tsx"
    - "App.tsx"
decisions:
  - "ClimateOverride is optional on AppData (?: syntax) but non-optional in StorageState — avoids runtime undefined while preserving backward compat for old stored payloads"
  - "Schema version stays at 1 — climateOverride is purely additive; missing field hydrates to 'auto' via ?? operator at the read site (not a migration)"
  - "Two-AppContent-paths discipline applied immediately in Wave 0 per Phase 5 Plan 05 documented trap — both AppContentMVP (line 116 block) and AppContentFullInner (line 270 block) destructure climateOverride"
  - "Smoke runner Phase 7 uses ENOENT-tolerant try/catch for getEffectiveSeason placeholder — Plan 07-02 will extend without needing to restructure the runner"
metrics:
  duration: "~4 min"
  completed: "2026-05-01"
  tasks_completed: 4
  files_modified: 4
---

# Phase 7 Plan 1: Foundation — ClimateOverride Type + Storage Plumbing + Smoke Runner Summary

Phase 7 Wave 0 foundation: `ClimateOverride` union type + additive `AppData.climateOverride?` field + full `useStorage` wiring (state, action, snapshot, hydration default) + both AppContent destructures + Phase 7 smoke runner scaffold (PASS 4/4, ENOENT-tolerant).

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add ClimateOverride type + AppData.climateOverride field | 6010bf3 | src/types/index.ts |
| 2 | Wire climateOverride through useStorage | 40e5253 | src/hooks/useStorage.tsx |
| 3 | Destructure climateOverride in BOTH AppContent paths | f0bfa0b | App.tsx |
| 4 | Phase 7 smoke runner scaffold (foundation suite) | bba225e | scripts/smoke-phase07.mjs |

## Artifact Details

### ClimateOverride Type (src/types/index.ts)
- `export type ClimateOverride = 'auto' | 'northern' | 'southern' | 'tropical'` placed immediately after `WaterMode` (line 27 area) — colocated with other v1.1 type definitions
- `climateOverride?: ClimateOverride` added as last field in `AppData` interface (optional `?:` for backward compat)

### useStorage 5-edit List (src/hooks/useStorage.tsx)
1. **Import** — `ClimateOverride` added to top-level type import from `'../types'`
2. **StorageState** — `climateOverride: ClimateOverride` (non-optional; defaults guaranteed at init/hydration)
3. **StorageActions** — `setClimateOverride: (override: ClimateOverride) => void` added after `acknowledgeMigrationReschedule`
4. **snapshotFromRef** — `climateOverride: d.climateOverride` added to returned AppData object
5. **useState + dataRef + hydration + setter + Provider value:**
   - `useState<ClimateOverride>('auto')` — default 'auto' for brand-new users
   - `dataRef.current` init includes `climateOverride: 'auto'`
   - Hydration: `const co: ClimateOverride = (data as AppData).climateOverride ?? 'auto'` — backward compat for old payloads
   - `setClimateOverride` useCallback updates state + dataRef.current + scheduleSave
   - Provider value includes `climateOverride` in state spread and `setClimateOverride` in actions spread + useMemo deps

### Both AppContent Destructures (App.tsx)
- `climateOverride` added after `location` in `AppContentMVP` destructure (line 116 block)
- `climateOverride` added after `location` in `AppContentFullInner` destructure (line 270 block)
- Proof: `grep -c "climateOverride" App.tsx` === 2 (exactly two occurrences — one per path)

### Phase 7 Smoke Runner (scripts/smoke-phase07.mjs)
- Foundation suite: 4 assertions, PASS 4/4
  1. Missing `climateOverride` hydrates to `'auto'` (LOC-05 backward-compat)
  2. Present `climateOverride: 'tropical'` round-trips correctly
  3. `'northern'` is a valid ClimateOverride value
  4. `'southern'` is a valid ClimateOverride value
- ENOENT-tolerant placeholder for Plan 07-02 `getEffectiveSeason` matrix (file present, export not yet added — logs "PLACEHOLDER: getEffectiveSeason not yet present")
- Lock comment header carried verbatim from Phase 4/5/6: `// COMPILE PATH IS LOCKED to typescript.transpileModule`
- Zero actual esbuild/swc compile path usage (policy comment mentions them only to reject them)

## Regression Results

Full suite post-plan-01:
- `npx tsc --noEmit` — exits 0 (no new errors)
- `node scripts/smoke-phase07.mjs` — Phase 7 smoke: PASS 4/4
- `node scripts/smoke-phase06.mjs` — Phase 6 smoke: PASS 82/82 (unchanged)
- `node scripts/migration-smoke-test.mjs` — Migration smoke: PASS 106/106 (unchanged)
- `CURRENT_SCHEMA_VERSION` in `src/utils/migration.ts` — still 1 (no schema bump)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/types/index.ts (ClimateOverride type + AppData.climateOverride? field)
- FOUND: src/hooks/useStorage.tsx (climateOverride count=9, setClimateOverride count=6, ClimateOverride count=9)
- FOUND: App.tsx (climateOverride count=2 exactly)
- FOUND: scripts/smoke-phase07.mjs (exits 0, PASS 4/4)
- Commits: 6010bf3, 40e5253, f0bfa0b, bba225e — all present in git log
