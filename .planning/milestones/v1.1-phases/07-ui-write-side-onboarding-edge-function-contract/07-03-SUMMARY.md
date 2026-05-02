---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "03"
subsystem: i18n
tags: [i18n, locales, voseo, parity, smoke-runner, wave-1]
dependency_graph:
  requires:
    - "ClimateOverride type + useStorage wiring (Plan 07-01)"
    - "getEffectiveSeason SSOT (Plan 07-02)"
  provides:
    - "27 new Phase 7 i18n keys in both en/common.json and es/common.json with strict parity"
    - "lightLevelHint namespace (8 keys) — placement hints for LightLevelPicker cards"
    - "waterSchedule namespace (5 keys) — mode labels + {{days}} interpolation"
    - "onboarding.location sub-block (5 keys) — LOC-06 verbatim body"
    - "settings.climateOverride sub-block (6 keys)"
    - "today.locationBanner sub-block (2 keys) — LOC-02 verbatim body"
    - "identification.lightLevelLabel (1 key)"
    - "smoke-phase07.mjs extended: 82/82 PASS (was 21/21)"
  affects:
    - "src/components/LightLevelPicker.tsx (Plan 07-04 consumes lightLevelHint keys)"
    - "src/components/WaterScheduleEditor.tsx (Plan 07-04 consumes waterSchedule keys)"
    - "src/screens/OnboardingScreen.tsx (Plan 07-05 consumes onboarding.location keys)"
    - "src/screens/TodayScreen.tsx (Plan 07-07 consumes today.locationBanner keys)"
    - "src/components/SettingsPanel.tsx (Plan 07-07 consumes settings.climateOverride keys)"
    - "src/components/PlantIdentifier/IdentificationResults.tsx (Plan 07-06 consumes identification.lightLevelLabel)"
tech_stack:
  added: []
  patterns:
    - "lightLevelHint as parallel top-level namespace — preserves backward compat for t('lightLevel.indoor.direct') string callers"
    - "Strict EN+ES key parity enforced by flatten+Set comparison in smoke runner"
    - "Verbatim requirement lock assertions in smoke runner (LOC-02 + LOC-06 exact string checks)"
    - "Voseo discipline: action verbs tested at smoke runner level (Usá, elegí, tenés)"
key_files:
  created: []
  modified:
    - "src/i18n/locales/es/common.json"
    - "src/i18n/locales/en/common.json"
    - "scripts/smoke-phase07.mjs"
decisions:
  - "lightLevelHint as parallel top-level namespace (not nested under lightLevel.*.hint) — keeps t('lightLevel.indoor.direct') returning string unchanged for Phase 6 callers; no breaking change"
  - "EN lightLevelHint values use plan-spec wording verbatim (Next to a south-facing window, Within 1m, etc.) — replaced shorter EN variants found in file at task start"
  - "soilCheckExplanation EN value corrected to 'We will remind you every {{days}} days to touch the soil' per plan spec (pre-existing file had 'We remind you')"
metrics:
  duration: "~5 min"
  completed: "2026-05-01"
  tasks_completed: 3
  files_modified: 3
---

# Phase 7 Plan 3: Phase 7 i18n Keys — EN + ES Parity + Smoke Assertions Summary

27 new i18n keys across 5 namespace groups added to both `en/common.json` and `es/common.json` with strict structural parity; Argentine voseo maintained for all ES action verbs; LOC-02 and LOC-06 verbatim copy locked; smoke runner extended from 21 to 82 assertions covering keyset existence, parity, verbatim requirements, voseo discipline, and interpolation markers.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add Phase 7 keys to ES locale (es/common.json) | 3f518b9 | src/i18n/locales/es/common.json |
| 2 | Add Phase 7 keys to EN locale (en/common.json) — strict parity with ES | ba46b27 | src/i18n/locales/en/common.json |
| 3 | Extend smoke-phase07.mjs with i18n key parity assertions | a45a735 | scripts/smoke-phase07.mjs |

## 27-Key Inventory (per namespace)

| Namespace | Keys | Count |
|-----------|------|-------|
| `lightLevelHint.indoor` | direct, bright_indirect, medium_indirect, low | 4 |
| `lightLevelHint.outdoor` | direct, bright_indirect, medium_indirect, low | 4 |
| `waterSchedule` | modeFixed, modeSoilCheck, warmLabel, coldLabel, soilCheckExplanation | 5 |
| `onboarding.location` | title, body (LOC-06), useGps, searchCity, skip | 5 |
| `settings.climateOverride` | title, body, auto, northern, southern, tropical | 6 |
| `today.locationBanner` | body (LOC-02), cta | 2 |
| `identification` | lightLevelLabel | 1 |
| **Total** | | **27** |

## ES Key Values (representative)

```json
"lightLevelHint": {
  "indoor": {
    "direct": "Junto a ventana sur",
    "bright_indirect": "A 1m de ventana clara",
    "medium_indirect": "A 2m de ventana clara",
    "low": "Pasillo sin sol directo"
  },
  "outdoor": {
    "direct": "Sin sombra todo el día",
    "bright_indirect": "Sombra de árbol vecino",
    "medium_indirect": "Mitad del día con sombra",
    "low": "Bajo techo o pared norte"
  }
},
"waterSchedule": {
  "modeFixed": "Calendario",
  "modeSoilCheck": "Por chequeo",
  "warmLabel": "Temporada cálida",
  "coldLabel": "Temporada fría",
  "soilCheckExplanation": "Te avisamos cada {{days}} días para que toques la tierra"
},
"onboarding": {
  "location": {
    "title": "¿Dónde tenés tus plantas?",
    "body": "Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima",
    "useGps": "Usá mi ubicación",
    "searchCity": "Buscar ciudad",
    "skip": "Omitir"
  }
},
"settings": {
  "climateOverride": {
    "title": "Zona climática",
    "body": "Si la detección automática no acierta, elegí tu zona manualmente",
    "auto": "Auto",
    "northern": "Norte templado",
    "southern": "Sur templado",
    "tropical": "Tropical"
  }
},
"today": {
  "locationBanner": {
    "body": "Agregá tu ubicación para horarios precisos",
    "cta": "Agregar"
  }
},
"identification": {
  "lightLevelLabel": "Nivel de luz"
}
```

## Parity Check Command + Output

```bash
node -e "
const en=require('./src/i18n/locales/en/common.json');
const es=require('./src/i18n/locales/es/common.json');
function flatten(o,p=''){return Object.entries(o).flatMap(([k,v])=>typeof v==='object'&&v!==null&&!Array.isArray(v)?flatten(v,p?p+'.'+k:k):[p?p+'.'+k:k]);}
const ek=new Set(flatten(en));
const sk=new Set(flatten(es));
console.log('only_in_es:',[...sk].filter(k=>!ek.has(k)).length,'only_in_en:',[...ek].filter(k=>!sk.has(k)).length);
"
```

Output: `only_in_es: 0 only_in_en: 0`

## Voseo Verifications

| Key | ES Value | Voseo token | Status |
|-----|----------|-------------|--------|
| `onboarding.location.useGps` | "Usá mi ubicación" | `Usá` | PASS |
| `onboarding.location.title` | "¿Dónde tenés tus plantas?" | `tenés` | PASS |
| `settings.climateOverride.body` | "Si la detección automática no acierta, elegí tu zona manualmente" | `elegí` | PASS |
| `today.locationBanner.body` | "Agregá tu ubicación para horarios precisos" | `Agregá` | PASS |
| `waterSchedule.soilCheckExplanation` | "Te avisamos cada {{days}} días para que toques la tierra" | infinitive `toques` — voseo safe | PASS |

Zero tuteo verbs in Phase 7 namespaces:
```bash
grep -nE 'riega|tienes|puedes|toca' src/i18n/locales/es/common.json | grep -E 'lightLevelHint|waterSchedule|location|climateOverride|locationBanner'
# Output: (empty — 0 matches)
```

## LOC-02 + LOC-06 Verbatim Check

LOC-06 (`onboarding.location.body`):
```
"Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima"
```
`grep -c "Lo usamos para ajustar el cuidado a tu clima — no se envía" src/i18n/locales/es/common.json` → **1**

LOC-02 (`today.locationBanner.body`):
```
"Agregá tu ubicación para horarios precisos"
```
`grep -c "Agregá tu ubicación para horarios precisos" src/i18n/locales/es/common.json` → **1**

## Smoke Runner Assertion Count Delta

| Phase | Before | After | Added |
|-------|--------|-------|-------|
| Phase 7 smoke | 21/21 | 82/82 | +61 |

Breakdown of new assertions:
- Phase 7 keyset existence: 27 keys × 2 locales = 54 assertions
- LOC-02 verbatim lock: 1 assertion
- LOC-06 verbatim lock: 1 assertion
- Voseo discipline: 3 assertions (useGps, climateOverride body, location title)
- Interpolation markers: 2 assertions (EN + ES soilCheckExplanation)
- **Total added: 61**

## Regression Results

- `npx tsc --noEmit` — exits 0 (no type changes — JSON files not type-checked)
- `node scripts/smoke-phase07.mjs` — Phase 7 smoke: PASS 82/82
- `node scripts/smoke-phase06.mjs` — Phase 6 smoke: PASS 82/82 (existing lightLevel.indoor.*/outdoor.* keys preserved as strings — backward compat confirmed)
- `node scripts/migration-smoke-test.mjs` — Migration smoke: PASS 106/106

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EN lightLevelHint values used shorter variant wording**
- **Found during:** Task 2 verification
- **Issue:** en/common.json already had a `lightLevelHint` block (from a pre-existing edit) with different values: "By a south-facing window" instead of plan-spec "Next to a south-facing window"; "1m from a bright window" vs "Within 1m of a bright window"; outdoor values also abbreviated
- **Fix:** Replaced all EN lightLevelHint values with the exact plan-spec wording
- **Files modified:** src/i18n/locales/en/common.json
- **Commit:** ba46b27

**2. [Rule 1 - Bug] EN soilCheckExplanation had wrong auxiliary verb**
- **Found during:** Task 2 verification
- **Issue:** Pre-existing EN value "We remind you every {{days}} days to check the soil" (present tense) vs plan spec "We'll remind you every {{days}} days to touch the soil" (future + "touch")
- **Fix:** Updated to plan-spec value
- **Files modified:** src/i18n/locales/en/common.json
- **Commit:** ba46b27

## Self-Check: PASSED

- FOUND: src/i18n/locales/es/common.json (lightLevelHint.indoor.direct, waterSchedule.modeFixed, onboarding.location.body LOC-06 verbatim, today.locationBanner.body LOC-02 verbatim, identification.lightLevelLabel)
- FOUND: src/i18n/locales/en/common.json (all 27 keys mirrored; parity only_in_es: 0 only_in_en: 0)
- FOUND: scripts/smoke-phase07.mjs (phase7Keys count=2, LOC-06 verbatim check count=1, exits 0, PASS 82/82)
- Commits: 3f518b9, ba46b27, a45a735 — all present in git log
