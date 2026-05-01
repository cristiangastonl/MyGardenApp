---
phase: 06-ui-read-side-propagation
plan: "02"
subsystem: i18n
tags: [i18n, localization, smoke-runner, wave-1, voseo, parity]
dependency_graph:
  requires:
    - src/i18n/locales/en/common.json (existing structure — plantCard, plantDetail, today blocks)
    - src/i18n/locales/es/common.json (existing structure — same blocks)
    - scripts/smoke-phase06.mjs (Plan 06-01 Wave 0 scaffold)
    - src/utils/lightLabel.ts (Plan 06-01 — getLightLabel)
    - src/utils/plantLogic.ts (Plan 06-01 — getSeasonalInterval exported)
  provides:
    - lightLevel.{indoor,outdoor}.{direct,bright_indirect,medium_indirect,low} in both locales
    - plantCard.waterBadge.{fixed,soilCheck} in both locales
    - plantDetail.seasonBadge.{every,warm,cold,tropical} in both locales
    - today.soilCheckEmptyRow in both locales
    - scripts/smoke-phase06.mjs Wave 1 assertions (82/82 PASS)
  affects:
    - Wave 2 plans (06-03/04/05) — can now call t('lightLevel.*'), t('plantCard.waterBadge.*'), t('plantDetail.seasonBadge.*'), t('today.soilCheckEmptyRow') and get localized output
tech_stack:
  added: []
  patterns:
    - i18n parity discipline — every new key asserted programmatically in smoke runner (EN + ES)
    - Voseo verification scoped to new namespaces only (avoids false positives from existing ES keys)
    - Legacy key preservation (SCHEMA-08 stance — keep one release)
key_files:
  created: []
  modified:
    - src/i18n/locales/en/common.json (15 new keys added, 0 existing keys removed)
    - src/i18n/locales/es/common.json (15 new keys added, 0 existing keys removed)
    - scripts/smoke-phase06.mjs (Wave 1 assertions — 134 lines added, 1 placeholder line removed)
decisions:
  - "lightLevel block inserted after plantCategories (alphabetical-ish neighbor); waterBadge inside plantCard after inDays; seasonBadge inside plantDetail after sunHours; soilCheckEmptyRow appended to today block — all placements preserve unrelated key order"
  - "ES copy confirmed voseo-correct: 'Te avisamos' is 1st-person plural (no conjugation change from tuteo at this form); 'está' is 3rd-person singular (same in all registers)"
  - "Actual key count is 15, not 14 as stated in plan objective — plan text itself corrects this ('That's 15 paths, not 14'). 15 keys asserted and passing."
metrics:
  duration: "3 min"
  completed: "2026-05-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 3
---

# Phase 6 Plan 2: Wave 1 i18n Keys + Smoke Runner Extensions Summary

**One-liner:** Wave 1 i18n foundation: added 15 key paths × 2 locales (EN + ES voseo) covering lightLevel labels, waterBadge, seasonBadge, and soil-check empty state; extended Phase 6 smoke runner from 16 to 82 assertions (all PASS).

---

## What Was Built

### Task 1: Add 15 new keys to `src/i18n/locales/en/common.json`

Four insertion sites, zero existing keys modified:

1. **New top-level `lightLevel` block** (inserted after `plantCategories`):
   - `lightLevel.indoor.{direct,bright_indirect,medium_indirect,low}` → "Direct light", "Bright indirect light", "Medium indirect light", "Low light"
   - `lightLevel.outdoor.{direct,bright_indirect,medium_indirect,low}` → "Full sun", "Partial sun", "Semi-shade", "Shade"

2. **`plantCard.waterBadge` nested block** (inserted after `inDays`):
   - `fixed` → "💧 Every {{days}}d"
   - `soilCheck` → "🤚 Check soil"

3. **`plantDetail.seasonBadge` nested block** (inserted after `sunHours`):
   - `every` → "Every {{days}} days"
   - `warm` → "warm season", `cold` → "cold season", `tropical` → "tropical"

4. **`today.soilCheckEmptyRow`** (appended after `allCaughtUpText`):
   - "Your {{plantName}} is in check mode. We'll remind you in {{days}} days."

All legacy keys preserved: `plantDetail.sunHours`, `plantDetail.waterEvery`, `plantCard.nextWater`, `plantDetailModal.hoursPerDay`.

### Task 2: Add 15 new keys to `src/i18n/locales/es/common.json` with voseo

Exact mirror of Task 1's structure with es-AR copy:

1. **`lightLevel` block**: Luz directa / Luz brillante indirecta / Luz media indirecta / Poca luz (indoor) + Sol pleno / Sol parcial / Semi sombra / Sombra (outdoor)
2. **`plantCard.waterBadge`**: "💧 Cada {{days}}d" / "🤚 Por chequeo"
3. **`plantDetail.seasonBadge`**: "Cada {{days}} días" / "temporada cálida" / "temporada fría" / "trópico"
4. **`today.soilCheckEmptyRow`**: "Tu {{plantName}} está en modo chequeo. Te avisamos en {{days}} días."

Voseo verification: "Te avisamos" is 1st-person plural (conjugation identical across voseo/tuteo); no bare tuteo verb forms (riega/toca/revisa) in new keys.

### Task 3: Extend `scripts/smoke-phase06.mjs` with Wave 1 assertions

Replaced the Wave 0 placeholder line with 66 new Wave 1 assertions (total 82/82 PASS):

- **i18n parity loop**: 15 key paths × 2 locales = 30 existence assertions
- **Specific value assertions**: 10 spot-checks for locked copy values
- **Voseo-rejection check**: scoped to new ES namespaces only
- **Legacy key preservation**: 4 assertions (SCHEMA-08)
- **getLightLabel behavior matrix**: 8 indoor/outdoor × 4 level cases
- **getLightLabel anti-pattern lock**: suculentas → indoor (1 assertion)
- **getLightLabel defensive ladder rung 2**: sunHours fallback (3 cases)
- **getLightLabel defensive ladder rung 3**: safe default for no lightLevel (2 cases)
- **getSeasonalInterval full matrix**: 7 cases covering warm, cold, tropical, legacy waterEvery fallback, missing plant, zero interval (treated as fallback)

Phase 4/5 regression: 106/106 PASS (unchanged). tsc: exits 0.

---

## Deviations from Plan

None — plan executed exactly as written. Actual key count of 15 was noted in the plan itself ("That's 15 paths, not 14"), and 15 keys were added and verified.

---

## Final i18n Key Count

- **New key paths added**: 15
- **Locales**: 2 (EN + ES)
- **Total new key-locale pairs**: 30
- **Existing keys removed**: 0

---

## Smoke Runner Final State

- **Wave 0 assertions**: 16
- **Wave 1 assertions**: 66
- **Total**: 82/82 PASS
- **Phase 6 smoke: PASS**
- **Phase 4/5 regression**: 106/106 PASS

---

## Commits

| Hash | Task | Description |
|------|------|-------------|
| b9ecc57 | Task 1 | feat(06-02): add 15 i18n keys to en/common.json |
| 601f9b8 | Task 2 | feat(06-02): add 15 i18n keys to es/common.json with voseo |
| 03db2cb | Task 3 | feat(06-02): extend smoke-phase06.mjs with Wave 1 assertions |

---

## Hand-off to Wave 2 (Plans 06-03/04/05/06)

Wave 2 component swaps can now consume:
- `t('lightLevel.indoor.bright_indirect')` → "Bright indirect light" / "Luz brillante indirecta"
- `t('lightLevel.outdoor.direct')` → "Full sun" / "Sol pleno"
- `t('plantCard.waterBadge.fixed', { days: N })` → "💧 Every Nd" / "💧 Cada Nd"
- `t('plantCard.waterBadge.soilCheck')` → "🤚 Check soil" / "🤚 Por chequeo"
- `t('plantDetail.seasonBadge.every', { days: N })` → "Every N days" / "Cada N días"
- `t('plantDetail.seasonBadge.warm')` → "warm season" / "temporada cálida"
- `t('plantDetail.seasonBadge.cold')` → "cold season" / "temporada fría"
- `t('plantDetail.seasonBadge.tropical')` → "tropical" / "trópico"
- `t('today.soilCheckEmptyRow', { plantName, days })` → full interpolated string

Plans 06-03 through 06-06 may proceed to component-level swaps without i18n key gaps.

---

## Self-Check: PASSED

- `src/i18n/locales/en/common.json` — modified, parses as JSON, 15 new keys verified
- `src/i18n/locales/es/common.json` — modified, parses as JSON, 15 new keys verified, voseo clean
- `scripts/smoke-phase06.mjs` — modified, 82/82 PASS, Wave 1 assertions complete
- Commits b9ecc57, 601f9b8, 03db2cb all present in git log
- `node scripts/smoke-phase06.mjs` exits 0
- `node scripts/migration-smoke-test.mjs` exits 0 (106/106)
- `npx tsc --noEmit` exits 0
