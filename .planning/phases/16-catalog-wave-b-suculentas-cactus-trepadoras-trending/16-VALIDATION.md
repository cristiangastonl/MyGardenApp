---
phase: 16
slug: catalog-wave-b-suculentas-cactus-trepadoras-trending
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (no test runner configured); pre-submit guard scripts (`check:i18n-keys`, `check:images`) + `tsc --noEmit` + Phase 16 smoke runner |
| **Config file** | `package.json` (script entries); `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/phase16-smoke.cjs` |
| **Estimated runtime** | ~5–10s (tsc) + ~2s (i18n) + ~2s (smoke) ≈ 14s |

`npm run check:images` is network-bound (~30–60s) and **not** part of the per-task feedback loop — only run at end-of-phase as the gate for image-plan-registry success criterion.

The Phase 16 smoke runner extends Phase 15's pattern with a critical addition: **TS-transpile or runtime function-import path** so it can assert each species-qualified `scientificName` routes to its OWN entry id via `findPlantInDatabase()`. Phase 15's file-content-regex approach is insufficient because the routing collision requires running the actual function logic, not just checking source-text presence.

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && node scripts/phase16-smoke.cjs`
- **After every plan wave:** Run `npx tsc --noEmit && npm run check:i18n-keys && node scripts/phase16-smoke.cjs`
- **Before `/gsd:verify-work`:** Full suite (incl. `npm run check:images`) green OR all imageUrls documented as accepted-known
- **Max feedback latency:** ~14 seconds

---

## Per-Task Verification Map

> Tasks not yet authored — populated by gsd-planner. Pattern (from research's Validation Architecture):

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-00-T1 | 00 | 0 | CAT-13/14/15/16 | smoke (scaffold) | `node scripts/phase16-smoke.cjs` | ❌ W0 | ⬜ pending |
| 16-00-T2 | 00 | 0 | (routing fix) | unit-style | `node scripts/phase16-smoke.cjs --routing-fix` | ❌ W0 | ⬜ pending |
| 16-00-T3 | 00 | 0 | CAT-13/14/15/16 | smoke (npm wiring) | `npm run smoke:phase16` | ❌ W0 | ⬜ pending |
| 16-01-T* | 01 | 1 | CAT-13 (+upgrades) | static + smoke | `npx tsc --noEmit && node scripts/phase16-smoke.cjs` | ✅ | ⬜ pending |
| 16-02-T* | 02 | 2 | CAT-14, CAT-15 | static + i18n | `npm run check:i18n-keys && node scripts/phase16-smoke.cjs` | ✅ | ⬜ pending |
| 16-03-T1 | 03 | 3 | CAT-16 (routing) | smoke (--identification) | `node scripts/phase16-smoke.cjs --identification` | ✅ | ⬜ pending |
| 16-04-T1 | 04 | 3 | CAT-16 (image plan) | doc | `node scripts/phase16-smoke.cjs && grep -q "Phase 16 Wave B" CLAUDE.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Mid-band exit-0 guarantee:** Phase 16 smoke runner extends Phase 15's partial-landing tolerance pattern. After Wave 1 lands cactus/suculentas batch (catalog at 95-97), the runner stays exit-0 via `idMatches > 87 && idMatches < 104 → SKIP` mid-band gate. Wave 2 lands trepadoras/trending → catalog at 104, all CAT-13/14/15 PASS.

**Routing fix verification:** Wave 0 task `16-00-T2` exercises the `findPlantInDatabase` exact-match-first refactor by importing the function (or TS-transpiling) and asserting each Phase 16 species-qualified scientificName resolves to its OWN id. The 4 Dracaena cases (sansevieria, dracaena, bambu-suerte, sansevieria-cilindrica) get explicit collision-test coverage.

---

## Wave 0 Requirements

- [ ] `scripts/phase16-smoke.cjs` — fixture asserting:
  - `PLANT_DATABASE` id-declaration count === 104 once Waves 1+2 both land (mid-band SKIPs at 88–103)
  - All 17 net-new ids present (deduped, lowercase, kebab-case) — partial-landing tolerant
  - All 19 Phase 16 ids (17 net-new + potus + filodendro) have full EDU keysets — partial-landing tolerant
  - Each new entry's i18n keyset (EN + ES) present (delegates per-key shape check to `npm run check:i18n-keys`)
  - `--identification` flag: each species-qualified `scientificName` routes to its own id via `findPlantInDatabase()` (TS-transpile or import path)
  - `--routing-fix` flag: dedicated assertions for the 4 Dracaena cases (sansevieria → sansevieria, dracaena → dracaena, bambu-suerte → bambu-suerte, sansevieria-cilindrica → sansevieria-cilindrica)
  - Voseo regex baseline (≤2) — runs every invocation as a regression assertion
- [ ] `src/utils/plantIdentification.ts` `findPlantInDatabase` — exact-match-first refactor (≤5 LOC change)

*Existing infrastructure (`tsc`, `check:i18n-keys`, `check:images`) covers static-shape, i18n-keyset, and image-URL validation — Wave 0 adds the 19-id fixture + identification round-trip + routing-fix verification + voseo regression.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voseo tone consistency in 17+ new ES entries | Project i18n style | Tone is a stylistic judgment, not a regex-grammable rule | Spot-check 3 random new entries in `es/plants.json`; confirm `regá / sacá / podés` style. Voseo-leak baseline = 2 (verified post-Phase-15); MUST NOT increase. |
| Educational content factuality | CAT-13/14/15 `whyRationale`, problems, nutrients | Botanical fact-checking, especially Lithops dormancy, Sempervivum hardiness, Schlumbergera × buckleyi photoperiod | Cross-reference at least 3 of the 17 new entries against research sources (POWO/Wikipedia). |
| Image visual quality (when uploaded) | CAT-16 | Aesthetic / accuracy of plant photo | Open uploaded image in Supabase dashboard; confirm it depicts the correct species. |
| Cactus-san-pedro horticultural framing | Project content style | Cultural-context detection requires reader judgment | Read `cactus-san-pedro.description` + `cactus-san-pedro.tip` in es/en plants.json; confirm purely horticultural framing — no Andean ceremonial / psychoactive references. |
| Existing potus + filodendro EDU upgrades | CAT-14 Option A | Verify upgrade preserves existing fields (didn't accidentally regress v1.0 data) | git diff shows existing fields unchanged + 5 new EDU fields added; saved Plants with old `databaseId: 'potus'` still resolve. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`scripts/phase16-smoke.cjs`, `findPlantInDatabase` refactor)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s for per-task loop
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
