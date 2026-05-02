---
phase: 08-catalog-rebalance
verified: 2026-05-02T00:00:00Z
status: human_needed
score: 7/7
human_verification:
  - test: "Browse catalog — 14 new entries visible and translatable"
    expected: "jacaranda, ceibo, glicina, gardenia, camelia, dalia, salvia-ornamental, cala, copete, verbena, lavanda-stoechas, lavanda-dentada, romero-rastrero, tomate-cherry all appear with correct ES/EN names and care data"
    why_human: "Runtime rendering and i18n resolution cannot be confirmed by static grep"
  - test: "Lavender 3-variant cold tolerance distinct in UI"
    expected: "lavanda-angustifolia, lavanda-stoechas, lavanda-dentada each show distinct cold tolerance values in the detail modal"
    why_human: "Visual diff between 3 entries requires device rendering"
  - test: "Alias resolution from legacy lavanda plant"
    expected: "A plant saved with plantType 'lavanda' resolves to lavanda-angustifolia catalog data without crashing or showing empty fields"
    why_human: "Requires live storage migration path exercised on device"
  - test: "Image upload to Supabase Storage for 15 entries"
    expected: "check:images exits 0 after images are uploaded for the 15 pending entries (14 new + lavanda-angustifolia); no broken image placeholders in catalog"
    why_human: "Image assets are not in the repo; upload must happen manually before release"
  - test: "CLAUDE.md Pre-submit Checks section runnable"
    expected: "npm run check:i18n-keys and npm run check:images both documented under '## Pre-submit Checks' and produce clear pass/fail output on a fresh clone"
    why_human: "Readability and usability of developer docs requires human judgment"
---

# Phase 8: Catalog Rebalance — Verification Report

**Phase Goal:** Expand the plant catalog from 50 to 64 entries, split the lavender group into 3 climate-distinct variants, add lookup-by-id with alias rewrite, and add CI guards for i18n key and image coverage.
**Verified:** 2026-05-02
**Status:** human_needed — all automated checks pass; 5 items deferred to v1.1 device backlog.

## Must-Have Results

| # | Requirement | Check | Result |
|---|-------------|-------|--------|
| 1 | CAT-01/04/08 + LIGHT-04 + WATER-07 expert overrides | 64 entries, 64× lightLevel/waterSchedule/waterMode | VERIFIED |
| 2 | CAT-02: 14 new entries | All 14 ids present in plantDatabase.ts + es/plants.json | VERIFIED |
| 3 | CAT-03: lavender split | lavanda-angustifolia: 1, lavanda: 0, _aliases entry: 1, es key removed | VERIFIED |
| 4 | CAT-04: getCatalogEntry exported + used in 3 components | PlantCard(2), MyPlantDetailModal(4), PlantDetailModal(5) | VERIFIED |
| 5 | CAT-05: alias support wired | _aliases in types + database; getCatalogEntry in useStorage(2) | VERIFIED |
| 6 | CAT-06: i18n-keys CI guard | scripts/check-i18n-keys.mjs exists; package.json script present; 64 ids PASS | VERIFIED |
| 7 | CAT-07: images CI guard | scripts/check-images.mjs exists; package.json script present; 15 known failures expected (images pending upload) | VERIFIED |

**Score: 7/7**

External smoke suites confirmed passing by orchestrator: phase08 396/396, phase07 100/100, phase06 82/82, migration 106/106, i18n-keys 64 ids.

## Human Verification Required (v1.1 device backlog)

### 1. Catalog browse — 14 new entries visible

**Test:** Open Explorar/Plantas tab, scroll catalog, verify all 14 new entries appear with correct names and care cards in both ES and EN.
**Expected:** No missing entries, no "undefined" strings, care level badges match expert values.
**Why human:** Runtime i18n resolution and card rendering require device.

### 2. Lavender 3 variants show distinct cold tolerance

**Test:** Open detail modal for lavanda-angustifolia, lavanda-stoechas, and lavanda-dentada in sequence.
**Expected:** Each shows a visually distinct cold tolerance rating; stoechas and dentada are less cold-hardy than angustifolia.
**Why human:** Visual comparison between 3 detail screens.

### 3. Alias resolution from legacy lavanda plant

**Test:** Seed a plant with `plantType: "lavanda"` in AsyncStorage (or use a pre-v8 backup), launch app, open its detail modal.
**Expected:** Catalog data loads from lavanda-angustifolia without errors or empty fields.
**Why human:** Requires exercising the alias-rewrite path at runtime with real storage state.

### 4. Image upload for 15 pending entries

**Test:** Upload images for the 14 new entries + lavanda-angustifolia to Supabase Storage, then run `npm run check:images`.
**Expected:** Script exits 0; all catalog entries display real plant photos (no broken placeholder).
**Why human:** Asset upload is a manual release step outside the codebase.

### 5. CLAUDE.md Pre-submit Checks section usable

**Test:** On a fresh terminal, run `npm run check:i18n-keys` and `npm run check:images` and read the output.
**Expected:** Output is clear, actionable, and matches the description in `## Pre-submit Checks`.
**Why human:** Developer-docs usability requires human judgment.

---

_Verified: 2026-05-02_
_Verifier: Claude (gsd-verifier)_
