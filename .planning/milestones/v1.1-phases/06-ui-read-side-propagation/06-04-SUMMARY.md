---
phase: 06-ui-read-side-propagation
plan: "04"
subsystem: components
tags: [season-badge, light-level, info-pills, modal, wave-2, SEASON-05, LIGHT-06, LIGHT-07]
dependency_graph:
  requires:
    - src/utils/seasonality.ts (getWaterSeason, WaterSeason — Phase 5)
    - src/utils/plantLogic.ts (getSeasonalInterval — exported Plan 06-01)
    - src/utils/lightLabel.ts (getLightLabel — Plan 06-01)
    - src/i18n/locales/en/common.json (plantDetail.seasonBadge.* — Plan 06-02)
    - src/i18n/locales/es/common.json (plantDetail.seasonBadge.* — Plan 06-02)
  provides:
    - src/components/MyPlantDetailModal.tsx (water pill: season-aware interval + em-dash + qualifier; sun pill: localized lightLevel label)
  affects:
    - PlantsScreen (opens MyPlantDetailModal — visual change on next Expo Go launch)
    - TodayScreen (opens MyPlantDetailModal via plant tap — same)
tech_stack:
  added: []
  patterns:
    - useMemo for season/interval/lightLabel/seasonKey computation — recomputes on plant, latitude, or locale change
    - Nested <Text> for em-dash + season qualifier inline (React Native nested Text pattern; qualifier inherits parent font/size, overrides only color)
    - seasonKey union 'warm' | 'cold' | 'tropical' gates dynamic i18n key composition — all three keys verified present (Plan 06-02)
key_files:
  created: []
  modified:
    - src/components/MyPlantDetailModal.tsx (4 edits: imports, useMemo block, info-pills JSX, seasonQualifier style)
decisions:
  - "useMemo deps array includes 't' — locale-switch correctness: getLightLabel produces locale-specific string; recompute required when i18next locale changes. 't' identity changes on locale switch."
  - "currentSeason returned from useMemo but only used for internal key derivation — intentionally not used directly in JSX to avoid redundant computation; TypeScript noUnusedLocals not set so no warning."
  - "Nested <Text style={styles.seasonQualifier}> inside parent infoPillText <Text> — React Native nested Text pattern. Qualifier inherits parent DMSans_500Medium/13px; seasonQualifier only overrides color to colors.textSecondary (same as parent, providing a stable fallback if parent color changes in future)."
metrics:
  duration: "~2 min"
  completed: "2026-05-01"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 6 Plan 4: MyPlantDetailModal Info Pills — Season Badge + LightLevel Label Summary

**One-liner:** Wave 2 vertical slice 2: MyPlantDetailModal water pill now shows season-aware interval with em-dash + season qualifier (SEASON-05), sun pill shows localized indoor/outdoor lightLevel label via getLightLabel (LIGHT-06/07).

---

## What Was Built

### Task 1: MyPlantDetailModal.tsx — info pills swap

Four precise edits to `src/components/MyPlantDetailModal.tsx`:

**Edit 1 — Imports (lines 26-28):**

```typescript
import { getWaterSeason, type WaterSeason } from '../utils/seasonality';
import { getSeasonalInterval } from '../utils/plantLogic';
import { getLightLabel } from '../utils/lightLabel';
```

**Edit 2 — useMemo block (after `dbEntry` useMemo, before `resolvedImageUrl`):**

```typescript
const { currentSeason, waterInterval, lightLabel, seasonKey } = useMemo(() => {
  const today = new Date();
  const season: WaterSeason = getWaterSeason(latitude, today);
  const interval = plant ? getSeasonalInterval(plant, season) : 0;
  const label = plant ? getLightLabel(plant, t) : '';
  const key: 'warm' | 'cold' | 'tropical' =
    season === 'cold' ? 'cold' : season === 'tropical' ? 'tropical' : 'warm';
  return { currentSeason: season, waterInterval: interval, lightLabel: label, seasonKey: key };
}, [plant, latitude, t]);
```

**Edit 3 — Info pills JSX:**

Water pill: `{t('plantDetail.seasonBadge.every', { days: waterInterval })} {' — '} <Text style={styles.seasonQualifier}>{t(\`plantDetail.seasonBadge.${seasonKey}\`)}</Text>`

Sun pill: `{lightLabel}` (from getLightLabel(plant, t) — routes through indoor/outdoor branch)

**Edit 4 — `seasonQualifier` style:**

```typescript
seasonQualifier: {
  color: colors.textSecondary,
},
```

---

## Final Shape of Info-Pill JSX

```tsx
<View style={styles.infoRow}>
  <View style={styles.infoPill}>
    <Text style={styles.infoPillIcon}>💧</Text>
    <Text style={styles.infoPillText}>
      {t('plantDetail.seasonBadge.every', { days: waterInterval })}
      {' — '}
      <Text style={styles.seasonQualifier}>
        {t(`plantDetail.seasonBadge.${seasonKey}`)}
      </Text>
    </Text>
  </View>
  <View style={styles.infoPill}>
    <Text style={styles.infoPillIcon}>☀️</Text>
    <Text style={styles.infoPillText}>
      {lightLabel}
    </Text>
  </View>
</View>
```

Em-dash: Unicode em-dash U+2014 surrounded by spaces as literal `{' — '}` string — NOT a hyphen-minus, NOT an en-dash.

---

## useMemo Deps Array

`[plant, latitude, t]` — `t` is included. When the user switches locale in Settings, i18next updates the `t` identity returned by `useTranslation()`, triggering the memo to recompute and produce the label in the new locale. Without `t` in deps, locale switching would show stale labels until a plant or latitude change.

---

## Manual UAT Results

Manual UAT deferred to Expo Go session (no RN test renderer per CLAUDE.md). Expected behaviors per locked decisions in 06-CONTEXT.md:

| Case | Expected output (ES) | Key path | Notes |
|------|---------------------|----------|-------|
| BA (lat -34.6), Apr (cold S-hem) | `Cada 10 días — temporada fría` | `plantDetail.seasonBadge.cold` | May 1 in Buenos Aires = Southern autumn = cold season |
| NY (lat 40), Apr (warm N-hem) | `Cada 5 días — temporada cálida` | `plantDetail.seasonBadge.warm` | April in New York = Northern spring = warm season |
| lat 0 (Singapore/tropical) | `Cada 5 días — trópico` | `plantDetail.seasonBadge.tropical` | Tropical zone, warm bucket interval |
| interior plant, bright_indirect | `Luz brillante indirecta` | `lightLevel.indoor.bright_indirect` | typeId 'interior' → indoor branch |
| huerta plant, direct | `Sol pleno` | `lightLevel.outdoor.direct` | typeId 'huerta' → outdoor branch |

*Note: Current date is 2026-05-01. In Buenos Aires (Southern hemisphere), May is autumn/cold season. In New York (Northern hemisphere), May is spring/warm season.*

---

## Deviations from Plan

None — plan executed exactly as written. All four edits applied in sequence. tsc green. Smoke runners green (82/82 Phase 6, 106/106 Phase 4/5 regression).

---

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `npx tsc --noEmit` exits 0 | PASS |
| `grep -c "import.*getSeasonalInterval"` === 1 | PASS (1) |
| `grep -c "import.*getWaterSeason"` === 1 | PASS (1) |
| `grep -c "import.*getLightLabel"` === 1 | PASS (1) |
| `grep -c "t('plantDetail.waterEvery'"` === 0 | PASS (0) |
| `grep -c "t('plantDetail.sunHours'"` === 0 | PASS (0) |
| `grep -c "t('plantDetail.seasonBadge.every'"` === 1 | PASS (1) |
| `grep -c "plantDetail.seasonBadge.\${seasonKey}"` === 1 | PASS (1) |
| `grep -c "{lightLabel}"` === 1 | PASS (1) |
| `grep -c "seasonQualifier"` >= 2 | PASS (2) |
| `grep -c "colors.textSecondary"` >= 1 | PASS (4) |
| `grep -c " — "` >= 1 (em-dash with spaces) | PASS (4) |
| `node scripts/smoke-phase06.mjs` exits 0 | PASS (82/82) |
| `node scripts/migration-smoke-test.mjs` exits 0 | PASS (106/106) |

---

## Commits

| Hash | Task | Description |
|------|------|-------------|
| b330a29 | Task 1 | feat(06-04): MyPlantDetailModal info pills — season-aware interval + lightLevel label |

---

## Hand-off Note

Plan 06-05 implements the same getLightLabel pattern in `PlantDetailModal.tsx` (catalog browse modal — the `PlantDBEntry` surface, gated behind `Features.EXPLORE_TAB`). Key difference from this plan:

- Surface receives `PlantDBEntry` (not `Plant`) — `getLightLabel` accepts `LightLabelInput` which requires `typeId` (mapped from `PlantDBEntry.category`)
- Also updates `PlantDatabaseCard.tsx` (catalog card light/water label)
- Both surfaces are MVP-dead (EXPLORE_TAB === false) so UAT is deferred to V1.1 flag flip

The `seasonQualifier` style pattern established here (nested `<Text>` with `colors.textSecondary` override) is available as a reference for any future inline secondary-text qualifier in other modals.

---

## Self-Check: PASSED

- `src/components/MyPlantDetailModal.tsx` — exists, modified (26 insertions, 3 deletions)
- Commit b330a29 present in git log
- `npx tsc --noEmit` exits 0 (verified)
- `node scripts/smoke-phase06.mjs` exits 0 with 82/82 PASS (verified)
- `node scripts/migration-smoke-test.mjs` exits 0 with 106/106 PASS (verified)
- All 14 acceptance criteria from plan: PASS
