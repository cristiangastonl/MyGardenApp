---
phase: 19
slug: pet-toxicity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom Node CJS smoke runner (`scripts/smoke-phaseN.cjs`) — no test runner installed (CLAUDE.md: "No test framework is set up"). Static-analysis-style file-content asserts via `readFileSync` + regex. Three-tier sentinels (PASS / SKIP / STRICT) mirroring Phase 18 (`scripts/smoke-phase18.cjs:1-160`). |
| **Config file** | `package.json` `"scripts"` entry: `"smoke:phase19": "node scripts/smoke-phase19.cjs"` |
| **Quick run command** | `npm run smoke:phase19` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase19 && npm run smoke:phase18` |
| **Estimated runtime** | ~30-60s for full suite (smoke runners ~2-5s each, i18n parity ~2s, tsc ~10-30s) |

---

## Sampling Rate

- **After every task commit:** Run `npm run smoke:phase19` (~2-5s)
- **After every plan wave:** Run `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase19 && npm run smoke:phase18` (~30-60s)
- **Before `/gsd:verify-work`:** Full suite must be green AND manual device-test checklist appended to v1.2 backlog memory (Phase 18 Option B deferral precedent)
- **Max feedback latency:** 60s

---

## Per-Task Verification Map

> Filled by planner during task creation. Every task gets at least one row.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-00-* | 00 | 0 | All TOX | infrastructure | `npm run smoke:phase19` (Wave 0 sentinels: smoke runner + helper stub + badge skeleton + i18n skeleton + CSV stub) | ❌ W0 | ⬜ pending |
| 19-01-* | 01 | 1 | TOX-01 | unit (file-content) | `npm run smoke:phase19` (`ToxLevel` type + helper module presence) | ❌ W0 | ⬜ pending |
| 19-02-* | 02 | 1 | TOX-02 | unit (count + enum) | `npm run smoke:phase19` (118 entries × `petToxicity` presence + enum validity + ASPCA URL audit) | ❌ W0 | ⬜ pending |
| 19-03-* | 03 | 2 | TOX-03 | unit (file-content) | `npm run smoke:phase19` (`PetToxicityBadge` import + JSX in `PlantCard.tsx`) | ❌ W0 | ⬜ pending |
| 19-04-* | 04 | 2 | TOX-04 | unit (file-content) | `npm run smoke:phase19` (Mascotas section render + `initialSection` prop) | ❌ W0 | ⬜ pending |
| 19-05-* | 05 | 2 | TOX-05 | unit (file-content) | `npm run smoke:phase19` (OnboardingScreen pet-safe Switch + filter logic + AddPlantModal banner) | ❌ W0 | ⬜ pending |
| 19-06-* | 06 | 3 | TOX-06 | unit (i18n parity) | `npm run check:i18n-keys` (extended) + `npm run smoke:phase19` (toxicity key namespace EN+ES parity) | ✅ existing (extends) | ⬜ pending |
| 19-07-* | 07 | 4 | All TOX | manual checkpoint | Device-test checklist (autonomous: false) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase19.cjs` — three-tier sentinels (PASS/SKIP/STRICT) for TOX-01..06; SKIP placeholders for every requirement until downstream waves flip them to PASS
- [ ] `package.json` `"scripts"` entry: `"smoke:phase19": "node scripts/smoke-phase19.cjs"`
- [ ] `.gitignore` entry: `scripts/.tmp-phase19/` (convention even if unused — mirrors Phase 18)
- [ ] `data/petToxicity.csv` — pre-populated with `id`, `scientificName`, `category` for all 118 catalog entries; classification cells (cats, dogs, cats_symptoms, dogs_symptoms, source) empty (Wave 1 fills via per-entry research pass)
- [ ] `src/utils/petToxicity.ts` (skeleton) — exports `getPetToxicity(entry)` that returns `{ cats: ToxLevel, dogs: ToxLevel }` with `'unknown'` fallback for absence; `isPetSafe(entry)` boolean helper
- [ ] `src/components/PetToxicityBadge.tsx` (skeleton) — props interface only; full impl in Wave 2
- [ ] `src/components/index.ts` — re-export `PetToxicityBadge`
- [ ] `src/i18n/locales/en/common.json` — toxicity.* namespace skeleton keys (4-state labels + framing strings + filter strings)
- [ ] `src/i18n/locales/es/common.json` — toxicity.* namespace skeleton keys (voseo)
- [ ] `src/types/index.ts` — `ToxLevel` type union + `petToxicity` field on `PlantDBEntry` interface

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toxicity badge tap inside `Gesture.Race(Pan, LongPress)` does NOT swallow swipe gesture | TOX-03 | Smoke runner cannot exercise RNGH gesture system. Pitfall 3 from RESEARCH.md flagged for device verification (RNGH 2.28 + Reanimated v4). | iOS dev client: long-press a card to open menu (≥500ms hold) — confirm menu opens. Then swipe-left on same card — confirm swipe reveals delete action. Tap toxicity badge on a third card — confirm modal opens to Mascotas section. No gesture-fall-through. |
| Mascotas section scroll-to-anchor smoothness | TOX-04 | Smoke runner cannot verify ScrollView scrollTo timing or visual smoothness. | Open MyPlantDetailModal via toxicity badge tap — confirm Mascotas section is visible without manual scroll, scroll-to-anchor animation feels natural. |
| Onboarding pet-safe Switch toggles correctly with category combinations | TOX-05 | Smoke runner verifies code presence; only device-test verifies user-perceived filter behavior across all 7 categories × {ON, OFF}. | Walk through onboarding: pick each category × toggle pet-safe; verify filtered list matches expected (e.g., Aromáticas + pet-safe-ON should hide oregano if oregano is toxic). |
| AddPlantModal banner renders only for catalog plants with non-safe toxicity | TOX-05 (banner extension) | Smoke runner verifies code presence; only device-test verifies banner visibility logic across all 4 toxicity states. | Add 4 plants via Identify flow: one safe, one cats=caution, one dogs=toxic, one unknown. Confirm banner renders/colors correctly per state. |
| Banner tap opens MyPlantDetailModal Mascotas section | TOX-05 (banner extension) | Smoke runner cannot exercise tap-to-modal-with-anchor flow. | Tap banner on toxic plant — confirm MyPlantDetailModal opens scrolled to Mascotas. |
| Cross-language voseo correctness (ES) | TOX-06 | Smoke runner verifies key parity but not voseo correctness in copy values. | Switch app to ES — confirm all 4 toxicity labels + framing strings + symptoms read in voseo. |

These manual-only verifications append to the **v1.2 device-test backlog memory** (`/Users/gaston/.claude/projects/-Users-gaston-Documents-Personal-MiJardinApp/memory/v1_2_test_backlog.md`) per Phase 18 Option B deferral precedent. Phase 19 Plan 07 documents the full checklist.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**4 Validation Pillars** (per RESEARCH.md §"Validation Architecture"):

1. **Data shape integrity** — every entry has `petToxicity` set; cats AND dogs are valid 4-state enum; absence-fallback helper resolves to `'unknown'`. Smoke runner: `grep -c "petToxicity:" src/data/plantDatabase.ts === 118`. Helper compile via TypeScript.
2. **UI render rules** — PlantCard renders badge for `'toxic'`/`'caution'` ONLY (not `'safe'`/`'unknown'`); MyPlantDetailModal Mascotas section ALWAYS visible; OnboardingScreen filter excludes `'unknown'`. Smoke runner: regex on `PlantCard.tsx`, `MyPlantDetailModal.tsx`, `OnboardingScreen.tsx`, `AddPlantModal.tsx` (banner) for gating logic.
3. **i18n parity (extending Phase 14 EDU-07 pattern)** — `common.json` toxicity.* namespace EN+ES parity; per-entry symptom arrays in `plants.json` conditional parity (only required when entry declares `petToxicity.symptoms`); voseo discipline manual-checked.
4. **CRIT-2 audit trail** — every non-`'unknown'` entry's `petToxicity.source` field cites an ASPCA URL. Smoke runner: regex `https://(www\.)?aspca\.org` count matches non-`'unknown'` count.

**Approval:** pending
