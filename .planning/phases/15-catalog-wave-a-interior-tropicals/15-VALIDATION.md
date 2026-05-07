---
phase: 15
slug: catalog-wave-a-interior-tropicals
status: draft
nyquist_compliant: true
wave_0_complete: true
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

`npm run check:images` is network-bound (~30–60s) and is **not** part of the per-task feedback loop. It is run only at end-of-wave for Wave 3 (Plan 15-04 image plan registry) and again at end-of-phase as the gate for Success Criterion #4.

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run check:i18n-keys`
- **Before `/gsd:verify-work`:** Full suite (incl. `npm run check:images` for the 23 new entries) must be green OR all unresolved imageUrls documented as accepted-known in CLAUDE.md
- **Max feedback latency:** ~12 seconds

---

## Per-Task Verification Map

> Populated 2026-05-07 from authored plans. Wave numbering follows `max(deps)+1`: Plan 15-00 = Wave 0; Plan 15-01 = Wave 1; Plan 15-02 = Wave 2; Plans 15-03 + 15-04 = Wave 3.
> Pattern (from research): every content-authoring task uses fixture-style assertions against `PLANT_DATABASE`, `en/plants.json`, `es/plants.json`, plus `tsc --noEmit` and `npm run check:i18n-keys`. Smoke fixture for the 23 ids lives at `scripts/phase15-smoke.cjs` (Wave 0).

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-00-T1 | 00 | 0 | CAT-09 / CAT-10 / CAT-11 / CAT-12 | smoke (scaffold) | `node scripts/phase15-smoke.cjs` | ✅ (created in this task) | ⬜ pending |
| 15-00-T2 | 00 | 0 | CAT-09 / CAT-10 / CAT-11 / CAT-12 | smoke (npm wiring) | `npm run smoke:phase15 && git check-ignore scripts/.tmp-phase15/foo.cjs` | ✅ | ⬜ pending |
| 15-01-T1 | 01 | 1 | CAT-09 | static + smoke | `node scripts/phase15-smoke.cjs && npx tsc --noEmit` | ✅ | ⬜ pending |
| 15-01-T2 | 01 | 1 | CAT-10 | static + i18n | `npm run check:i18n-keys && node scripts/phase15-smoke.cjs` | ✅ | ⬜ pending |
| 15-02-T1 | 02 | 2 | CAT-09 | static + smoke | `node scripts/phase15-smoke.cjs && npx tsc --noEmit` | ✅ | ⬜ pending |
| 15-02-T2 | 02 | 2 | CAT-10 | static + i18n | `npm run check:i18n-keys && node scripts/phase15-smoke.cjs` | ✅ | ⬜ pending |
| 15-03-T1 | 03 | 3 | CAT-11 | smoke (--identification) | `node scripts/phase15-smoke.cjs --identification && npx tsc --noEmit` | ✅ | ⬜ pending |
| 15-04-T1 | 04 | 3 | CAT-12 | doc (smoke + grep) | `node scripts/phase15-smoke.cjs && grep -q "Phase 15 Wave A" CLAUDE.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Mid-band exit-0 guarantee:** Plan 15-00's smoke runner encodes partial-landing tolerance for CAT-09 per-id, CAT-09 count, AND IDENT.CAT-11 modes. After Plan 15-01 lands 12/23 ids (catalog at 76), the runner stays exit-0: landed ids PASS, unlanded ids SKIP, count is mid-band SKIP. After Plan 15-02 lands the remaining 11 (catalog at 87), all gates flip to genuine PASS.

---

## Wave 0 Requirements

- [x] `scripts/phase15-smoke.cjs` — fixture asserting:
  - `PLANT_DATABASE` id-declaration count === 87 once Plans 15-01 + 15-02 both land (mid-band SKIPs at 65–86)
  - All 23 new ids present (deduped, lowercase, kebab-case) — partial-landing tolerant
  - Each new entry's i18n keyset (EN + ES) present (delegates the per-key shape check to `npm run check:i18n-keys`)
  - `--identification` flag: each new `scientificName` (species-qualified) co-occurs with its id in `plantDatabase.ts` — partial-landing tolerant
  - Voseo regex baseline (≤2) — runs every invocation as a regression assertion

*Existing infrastructure (`tsc`, `check:i18n-keys`, `check:images`) covers static-shape, i18n-keyset, and image-URL validation — Wave 0 only adds the 23-id fixture + identification round-trip + voseo regression.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voseo tone consistency in 23 new ES entries | Project i18n style | Tone is a stylistic judgment, not a regex-grammable rule | Spot-check 3 random new entries in `es/plants.json`; confirm `regá / sacá / podés` style and no `tú` conjugations leak in. Voseo-leak baseline = 2 (verified 2026-05-07); MUST NOT increase. |
| Educational content factuality | CAT-09 `whyRationale`, problems, nutrients | Botanical fact-checking | Cross-reference at least 3 of the 23 new entries against research sources (POWO/Wikipedia). |
| Image visual quality (when uploaded) | CAT-12 | Aesthetic / accuracy of plant photo | Open uploaded image in Supabase dashboard; confirm it depicts the correct species. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (`scripts/phase15-smoke.cjs`)
- [x] No watch-mode flags
- [x] Feedback latency < 15s for per-task loop
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (planning-time validation; runtime PASSes recorded as plans execute)
