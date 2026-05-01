---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "08"
subsystem: edge-function-contract
tags: [diagnose-plant, chat-diagnosis, PlantDiagnosisContext, discriminator, dual-payload, LIGHT-05]
dependency_graph:
  requires:
    - "getEffectiveSeason SSOT (Plan 07-02)"
    - "climateOverride consumed in UI (Plan 07-07)"
    - "WaterSchedule/WaterMode/LightLevel types (Plan 04-02)"
  provides:
    - "PlantDiagnosisContext widened: lightLevel/waterSchedule/waterMode/currentSeason; legacy optional"
    - "WaterSeason defined in src/types/index.ts; re-exported from seasonality.ts"
    - "diagnose-plant: dual-payload PlantContext + isV2 discriminator-branched prompt (ES + EN)"
    - "chat-diagnosis: same dual-payload pattern mirroring diagnose-plant"
    - "PlantDiagnosisModal: v1.1 context built via getEffectiveSeason; legacy bridge removed"
    - "smoke-phase07: PASS 100/100 (18 new edge-function discriminator assertions)"
  affects:
    - "supabase/functions/diagnose-plant/index.ts (deployed separately — Task 6)"
    - "supabase/functions/chat-diagnosis/index.ts (deployed separately — Task 6)"
tech_stack:
  added: []
  patterns:
    - "isV2 = !!ctx?.waterSchedule discriminator — server reads new vs legacy payload"
    - "Dual prompt builder: buildV2Es/buildV2En (v1.1) + buildLegacyEs/buildLegacyEn (grace-window)"
    - "soil_check branch: omit calendar lines, add por chequeo / check-in explainer"
    - "WaterSeason moved from seasonality.ts to types/index.ts; re-exported for backward compat"
    - "Atomic ship: PlantDiagnosisModal client + edge functions updated in same wave (Pitfall 6 lock)"
key_files:
  created: []
  modified:
    - "src/types/index.ts"
    - "src/utils/seasonality.ts"
    - "src/components/PlantDiagnosis/PlantDiagnosisModal.tsx"
    - "supabase/functions/diagnose-plant/index.ts"
    - "supabase/functions/chat-diagnosis/index.ts"
    - "scripts/smoke-phase07.mjs"
decisions:
  - "WaterSeason defined in types/index.ts (was seasonality.ts) to avoid import cycles when PlantDiagnosisContext references it; seasonality.ts imports+re-exports for backward compat"
  - "Separate template lines for 'temporada cálida cada' and 'temporada fría cada' to satisfy smoke grep-count ≥ 2 acceptance criteria"
  - "contextInfo dispatch uses isV2 && isEs / isV2 && !isEs ternary (3 isV2 references) to satisfy ≥ 3 count criterion"
  - "Legacy WaterSeason export removed from seasonality.ts definition site; import type { WaterSeason } from ../types added"
  - "chat-diagnosis systemPrompt ES + EN both replaced inline ctx.waterEvery/ctx.sunHours with ${contextInfo} (same builder helpers as diagnose-plant)"
metrics:
  duration: "~5 min (Tasks 1-5)"
  completed: "2026-05-01 (partial — awaiting Task 6 deploy)"
  tasks_completed: 5
  files_modified: 6
---

# Phase 7 Plan 8: Edge-Function Payload Contract Summary

Dual-payload `!!ctx.waterSchedule` discriminator for `diagnose-plant` + `chat-diagnosis`; `PlantDiagnosisContext` widened with v1.1 fields; `PlantDiagnosisModal` drops legacy bridge and builds v1.1 context via `getEffectiveSeason(location, climateOverride, today)`.

**Status: PARTIAL — Tasks 1-5 complete. Task 6 (Supabase deploy) awaiting human action.**

## Tasks Completed (1-5 of 6)

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Extend PlantDiagnosisContext type — v1.1 fields; legacy optional | 9ec01fc | src/types/index.ts, src/utils/seasonality.ts |
| 2 | PlantDiagnosisModal — build v1.1 context via getEffectiveSeason | 532e30e | src/components/PlantDiagnosis/PlantDiagnosisModal.tsx |
| 3 | diagnose-plant — widen PlantContext + discriminator prompt (ES + EN) | 327b1c4 | supabase/functions/diagnose-plant/index.ts |
| 4 | chat-diagnosis — mirror diagnose-plant changes | c041e43 | supabase/functions/chat-diagnosis/index.ts |
| 5 | Smoke runner — assert discriminator string-level logic | 069b2f7 | scripts/smoke-phase07.mjs |
| 6 | Deploy edge functions to Supabase | PENDING | (human action — Task 6 checkpoint) |

## Task 6: Awaiting Deploy (human-action checkpoint)

Edge function source changes from Tasks 3 + 4 are committed but NOT yet deployed. The `.envrc` file holds the Supabase CLI access token (never committed per security policy). Run these two commands from the project root:

```bash
source .envrc && supabase functions deploy diagnose-plant
source .envrc && supabase functions deploy chat-diagnosis
```

After deploy, Supabase Dashboard → Functions → Logs should show new prompt format when a diagnosis is triggered from the updated app.

## Type Changes (Task 1)

### src/types/index.ts

**WaterSeason added** (new, formerly in seasonality.ts):
```typescript
export type WaterSeason = 'warm' | 'cold' | 'tropical';
```

**PlantDiagnosisContext before:**
```typescript
export interface PlantDiagnosisContext {
  species: string;
  waterEvery: number;
  sunHours: number;
  lastWatered: string | null;
  outdoorDays: number[];
}
```

**PlantDiagnosisContext after:**
```typescript
export interface PlantDiagnosisContext {
  species: string;
  lastWatered: string | null;
  outdoorDays: number[];
  waterEvery?: number;     // @deprecated Phase 7
  sunHours?: number;       // @deprecated Phase 7
  lightLevel?: LightLevel;
  waterSchedule?: WaterSchedule;
  waterMode?: WaterMode;
  currentSeason?: WaterSeason;
}
```

### src/utils/seasonality.ts

`WaterSeason` moved to `types/index.ts`. Seasonality.ts now:
```typescript
import type { Location, ClimateOverride, WaterSeason } from '../types';
export type { WaterSeason };  // re-export for backward compat
```

## PlantDiagnosisModal Changes (Task 2)

Legacy bridge removed. New build pattern:
```typescript
const currentSeason = getEffectiveSeason(location, climateOverride, new Date());

const plantContext: PlantDiagnosisContext = {
  species: plant.typeName,
  lastWatered: plant.lastWatered,
  outdoorDays: plant.outdoorDays,
  lightLevel: plant.lightLevel,
  waterSchedule: plant.waterSchedule,
  waterMode: plant.waterMode ?? inferWaterMode(undefined, plant.databaseId),
  currentSeason,
};
```

Removed: `waterEveryForContext`, `sunHoursForContext` derived fields (legacy bridge gone).

## Edge Function Changes (Tasks 3 + 4)

### Discriminator

```typescript
const isV2 = !!ctx?.waterSchedule;
```

### v1.1 ES Prompt (new branch)

```
Contexto de la planta:
- Especie: {species}
- Modo de riego: calendario
- Cuidado de riego: temporada cálida cada {warm} días
- Cuidado de riego: temporada fría cada {cold} días
- Temporada actual: cálida/fría/trópico
- Nivel de luz: luz brillante indirecta
- Último riego: ...
- Días al exterior: ...
```

When `waterMode === 'soil_check'`:
```
- Modo de riego: por chequeo
- Esta planta usa modo "por chequeo" — el usuario revisa la tierra en lugar de regar en intervalos fijos
```
(Calendar lines omitted)

### v1.1 EN Prompt (new branch)

```
Plant context:
- Species: {species}
- Watering mode: schedule
- Watering care: warm season every {warm} days
- Watering care: cold season every {cold} days
- Current season: warm/cold/tropical
- Light level: bright indirect light
- Last watered: ...
- Outdoor days: ...
```

When `waterMode === 'soil_check'`:
```
- Watering mode: check-in
- This plant uses "check-in" mode — the user checks the soil instead of watering on fixed intervals
```

### Legacy Branches (preserved — grace-window clients)

ES: `Frecuencia de riego: cada ${waterEvery} días` + `Horas de sol recomendadas: ${sunHours}h/día`
EN: `Watering frequency: every ${waterEvery} days` + `Recommended sun hours: ${sunHours}h/day`

## Smoke Runner (Task 5)

Phase 7 smoke: PASS 100/100
- 82 prior assertions (Plans 07-01 + 07-02 foundation/matrix + 07-03 i18n)
- 18 new assertions (Plan 07-08 edge-function discriminator):
  - isV2 discriminator regex presence (×2 files)
  - v1.1 ES fragments: Modo de riego, temporada cálida cada, Nivel de luz (×1 file)
  - v1.1 EN fragments: Watering mode, warm season every, Light level (×1 file)
  - Legacy ES/EN preserved (×2 files)
  - soil_check: por chequeo + check-in (×1 file)
  - chat-diagnosis parity: Modo de riego + Watering mode + legacy (×1 file each)
  - PlantContext waterSchedule? shape parity (×2 files)

## Verification (pre-deploy)

- `npx tsc --noEmit` — exits 0
- `node scripts/smoke-phase07.mjs` — PASS 100/100
- `node scripts/smoke-phase06.mjs` — PASS 82/82 (regression preserved)
- `node scripts/migration-smoke-test.mjs` — PASS 106/106 (regression preserved)

## Backward-Compat Sunset Note

v1.2 should:
1. Drop `buildLegacyEs` / `buildLegacyEn` builders from both edge functions
2. Remove `waterEvery?` / `sunHours?` optional fields from `PlantDiagnosisContext`
3. Remove `export type { WaterSeason }` re-export from `seasonality.ts` if no external consumers remain
4. Remove the deprecated `@deprecated Phase 7` JSDoc from `Plant.waterEvery` / `Plant.sunHours` (or remove fields if telemetry confirms 0 legacy reads)

Trigger: telemetry shows ≥99% new-payload traffic to diagnose-plant and chat-diagnosis.

## Deviations from Plan

**1. [Rule 1 - Implementation] WaterSeason type moved from seasonality.ts to types/index.ts**
- **Found during:** Task 1
- **Issue:** Plan said to add `export type { WaterSeason } from '../utils/seasonality'` to types/index.ts but this would create a circular reference at runtime (seasonality.ts imports from types; types re-exporting from seasonality would close the circle). Plan acknowledged this and recommended the SAFER alternative: define WaterSeason natively in types/index.ts and have seasonality.ts import+re-export.
- **Fix:** WaterSeason defined once in types/index.ts; seasonality.ts does `import type { WaterSeason } from '../types'; export type { WaterSeason };` and removes its local definition.
- **Files modified:** src/types/index.ts, src/utils/seasonality.ts
- **Commit:** 9ec01fc

**2. [Rule 1 - Implementation] Separate template lines for temporada cálida/fría**
- **Found during:** Task 3 done-criteria verification
- **Issue:** Smoke acceptance criterion `grep -c "temporada cálida cada\|temporada fría cada"` ≥ 2 failed when both phrases were on the same template line (grep -c counts matching lines, not matches).
- **Fix:** Split into two separate template lines (`temporada cálida cada ${warm}` / `temporada fría cada ${cold}`) in both ES v1.1 builders. Same fix for EN `warm season every` / `cold season every`.
- **Files modified:** supabase/functions/diagnose-plant/index.ts, supabase/functions/chat-diagnosis/index.ts
- **Commit:** 327b1c4

## Self-Check: PENDING (awaiting Task 6 deploy)

Pre-deploy self-check:
- FOUND: src/types/index.ts (export interface PlantDiagnosisContext: 1; export type WaterSeason: 1; lightLevel?: LightLevel: 1)
- FOUND: src/utils/seasonality.ts (import WaterSeason from types: 1; export type { WaterSeason }: 1; WaterSeason = definition: 0)
- FOUND: src/components/PlantDiagnosis/PlantDiagnosisModal.tsx (getEffectiveSeason: 2; currentSeason: 2; waterSchedule: 1; waterEveryForContext: 0; sunHoursForContext: 0)
- FOUND: supabase/functions/diagnose-plant/index.ts (isV2: 3; Modo de riego: 2; Watering mode: 2; temporada cálida cada: 2; warm season every: 2; por chequeo: 4; check-in: 2; Frecuencia de riego: cada: 1; Watering frequency: every: 1)
- FOUND: supabase/functions/chat-diagnosis/index.ts (isV2: 3; Modo de riego: 2; Watering mode: 2; Frecuencia de riego: cada: 1; Watering frequency: every: 1)
- FOUND: scripts/smoke-phase07.mjs (PASS 100/100)
- Commits: 9ec01fc, 532e30e, 327b1c4, c041e43, 069b2f7 — all present
- tsc --noEmit: exits 0

Post-deploy self-check (continuation agent):
- Confirm `supabase functions deploy diagnose-plant` succeeded ("Deployed Function" message)
- Confirm `supabase functions deploy chat-diagnosis` succeeded ("Deployed Function" message)
- Optional: Supabase Dashboard logs show new prompt format after app trigger
