---
phase: 19-pet-toxicity
plan: "06"
subsystem: i18n-validation
tags: [i18n, check-script, voseo, parity, tox-06]
dependency_graph:
  requires: [19-00, 19-02, 19-03, 19-04, 19-05]
  provides: [TOX-06, i18n-parity-gate, petToxicity-symptoms-validation]
  affects: [scripts/check-i18n-keys.mjs, src/i18n/locales]
tech_stack:
  added: []
  patterns:
    - "Conditional petToxicity.symptoms validation extending Phase 14 nutrient/careAction pattern"
    - "Append-only script extension — existing validation logic untouched"
key_files:
  created: []
  modified:
    - scripts/check-i18n-keys.mjs
    - src/i18n/locales/es/plants.json
decisions:
  - "emptyState_no_alternative key NOT added — OnboardingScreen does not use it (grep confirmed)"
  - "voseo regression fix applied to limonero.tip (puedes → podés) as Rule 2 auto-fix"
metrics:
  duration: "~2 min"
  completed: "2026-05-09"
  tasks_completed: 2
  files_modified: 2
---

# Phase 19 Plan 06: TOX-06 i18n Parity Gate Summary

**One-liner:** Conditional petToxicity.symptoms parity validation added to check-i18n-keys.mjs; voseo regression fixed in limonero; all 85 smoke sentinels at PASS with zero SKIPs remaining.

## Tasks Completed

### Task 1: Extend scripts/check-i18n-keys.mjs with conditional petToxicity.symptoms validation
**Commit:** b495462

Added Phase 19 (TOX-06) conditional block immediately after the existing whyRationale check at line 108. The extension is append-only — 17 lines added to the per-entry loop:

```
// ─── v1.2 Phase 19 (TOX-06): conditional petToxicity.symptoms validation ───
if (Array.isArray(entry.petToxicity?.symptoms?.cats) && ...) { ... }
if (Array.isArray(entry.petToxicity?.symptoms?.dogs) && ...) { ... }
```

Acceptance criteria verified:
- `grep -c "petToxicity.symptoms" scripts/check-i18n-keys.mjs` = 5 (>= 2 required)
- `grep -c "Phase 19 (TOX-06)" scripts/check-i18n-keys.mjs` = 1
- `npm run check:i18n-keys` exits 0
- `npm run smoke:phase19` PASS=85, FAIL=0, SKIP=0 (TOX-06.checkScript SKIP → PASS)
- `npx tsc --noEmit` exits 0

### Task 2: Polish common.json toxicity.* wording + voseo audit + baseline regression check
**Commit:** bf469b0

**Parity audit result:**
- toxicity.* namespace: 22 keys × 2 locales = 44 strings, EN=ES parity confirmed
- plantDetailModal.pets present in both EN ("Pets") and ES ("Mascotas")
- EN-only: [] / ES-only: [] (parity script exits 0)

**Voseo regression sentinel:**
- Pre-audit: `grep -cE "\btienes\b|\bpuedes\b|\bdebes\b|\bquieres\b" src/i18n/locales/es/plants.json` = 1
- Found: limonero.tip — "puedes entrarlo en invierno" (Castilian)
- Fixed: "podés entrarlo en invierno" (voseo)
- Post-fix count: 0 (restored to expected baseline)

**emptyState_no_alternative check:**
- `grep -rn "emptyState_no_alternative" src/` = no results
- Key NOT used in OnboardingScreen — not added to common.json

**Final toxicity.* keyset (22 keys in each locale):**
a11y.cats.caution, a11y.cats.toxic, a11y.dogs.caution, a11y.dogs.toxic, banner.cautionSingle, banner.mixed, banner.toxicBoth, banner.toxicSingle, caution, cautionForSpecies, filter.emptyState, filter.label, safe, safeForBoth, safeForSpecies, species.cats, species.dogs, symptomsLabel, toxic, toxicForSpecies, unknown, unverifiedLatam

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Bug] Fixed Castilian 'puedes' voseo regression in limonero.tip**
- **Found during:** Task 2 voseo regression sentinel sweep
- **Issue:** es/plants.json limonero.tip contained "puedes entrarlo en invierno" — Castilian second-person singular instead of Argentine voseo
- **Fix:** Changed "puedes" → "podés" (voseo imperative of poder)
- **Files modified:** src/i18n/locales/es/plants.json (1 line)
- **Commit:** bf469b0

## Final Smoke Runner Results

| Runner | PASS | FAIL | SKIP |
|--------|------|------|------|
| smoke-phase19 | 85 | 0 | 0 |
| smoke-phase18 | 56 | 0 | 0 |

All TOX-XX.* sentinels at PASS. SKIP queue fully emptied (was 1 at plan start).

## check-i18n-keys.mjs Extension Diff

Lines added to per-entry loop (after existing whyRationale check, before closing `}`):

```javascript
    // ─── v1.2 Phase 19 (TOX-06): conditional petToxicity.symptoms validation ───
    // When the catalog entry declares symptoms.{cats,dogs}, the corresponding plants.json
    // per-entry node MUST provide a non-empty array of the same approximate length.
    // 'safe' entries with no symptoms declared are NOT required to provide any key.
    if (Array.isArray(entry.petToxicity?.symptoms?.cats) && entry.petToxicity.symptoms.cats.length >= 1) {
      const catsNode = node?.petToxicity?.symptoms?.cats;
      if (!Array.isArray(catsNode) || catsNode.length < 1) {
        errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.cats missing or empty`);
      }
    }
    if (Array.isArray(entry.petToxicity?.symptoms?.dogs) && entry.petToxicity.symptoms.dogs.length >= 1) {
      const dogsNode = node?.petToxicity?.symptoms?.dogs;
      if (!Array.isArray(dogsNode) || dogsNode.length < 1) {
        errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.dogs missing or empty`);
      }
    }
```

## Cross-Phase Regression Status

- smoke-phase18: PASS=56, FAIL=0, SKIP=0 — GREEN
- npm run check:i18n-keys: PASS (118 ids)
- npx tsc --noEmit: exits 0

## Self-Check: PASSED
