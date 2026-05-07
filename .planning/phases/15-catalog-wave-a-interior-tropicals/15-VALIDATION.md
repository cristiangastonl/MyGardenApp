---
phase: 15
slug: catalog-wave-a-interior-tropicals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (no test runner configured); pre-submit guard scripts (`check:i18n-keys`, `check:images`) + `tsc --noEmit` |
| **Config file** | `package.json` (script entries); `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys` |
| **Estimated runtime** | ~5–10 seconds (tsc) + ~2 seconds (i18n) ≈ 12s |

`npm run check:images` is network-bound (~30–60s) and is **not** part of the per-task feedback loop. It is run only at end-of-wave for Wave 4 (image plan registry) and again at end-of-phase as the gate for Success Criterion #4.

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run check:i18n-keys`
- **Before `/gsd:verify-work`:** Full suite (incl. `npm run check:images` for the 23 new entries) must be green OR all unresolved imageUrls documented as accepted-known in CLAUDE.md
- **Max feedback latency:** ~12 seconds

---

## Per-Task Verification Map

> Plans not yet authored — table populated by gsd-planner per ## Validation Architecture in 15-RESEARCH.md.
> Pattern (from research): every content-authoring task uses fixture-style assertions against `PLANT_DATABASE`, `en/plants.json`, `es/plants.json`, plus `tsc --noEmit` and `npm run check:i18n-keys`. Smoke fixture for the 23 ids lives at `scripts/phase15-smoke.cjs` (Wave 0).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-00-01 | 00 | 0 | CAT-09 / CAT-10 | smoke | `node scripts/phase15-smoke.cjs` | ❌ W0 | ⬜ pending |
| 15-02-* | 02 | 2 | CAT-09, CAT-10, CAT-12 | static | `npx tsc --noEmit && npm run check:i18n-keys` | ✅ | ⬜ pending |
| 15-03-* | 03 | 3 | CAT-09, CAT-10, CAT-12 | static | `npx tsc --noEmit && npm run check:i18n-keys` | ✅ | ⬜ pending |
| 15-01-* | 01 | 1‖3 | CAT-11 | static | `node scripts/phase15-smoke.cjs --identification` | ❌ W0 | ⬜ pending |
| 15-04-* | 04 | 4 | CAT-12 | network/doc | `npm run check:images` (or accepted-known doc grep) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/phase15-smoke.cjs` — fixture asserting:
  - `PLANT_DATABASE.length === 87` once Waves 2+3 land
  - All 23 new ids present (deduped, lowercase, kebab-case)
  - Each new entry has all EDU schema fields populated (Phase 14 fields)
  - Each new entry has matching keyset in EN + ES `plants.json` (delegates to existing check)
  - `--identification` flag: each new `scientificName` returns its own entry from `findPlantInDatabase()` (no fallback to unknown-plant)

*Existing infrastructure (`tsc`, `check:i18n-keys`, `check:images`) covers static-shape, i18n-keyset, and image-URL validation — Wave 0 only adds the 23-id fixture + identification round-trip.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voseo tone consistency in 23 new ES entries | Project i18n style | Tone is a stylistic judgment, not a regex-grammable rule | Spot-check 3 random new entries in `es/plants.json`; confirm `regá / sacá / podés` style and no `tú` conjugations leak in. Voseo-leak baseline = 2 (verified 2026-05-07); MUST NOT increase. |
| Educational content factuality | CAT-09 `whyRationale`, problems, nutrients | Botanical fact-checking | Cross-reference at least 3 of the 23 new entries against research sources (POWO/Wikipedia). |
| Image visual quality (when uploaded) | CAT-12 | Aesthetic / accuracy of plant photo | Open uploaded image in Supabase dashboard; confirm it depicts the correct species. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`scripts/phase15-smoke.cjs`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s for per-task loop
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
