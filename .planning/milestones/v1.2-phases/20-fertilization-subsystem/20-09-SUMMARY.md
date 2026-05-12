---
phase: 20-fertilization-subsystem
plan: "09"
subsystem: i18n-validation
tags: [i18n, check-script, voseo, parity, fert-07, append-only]
dependency_graph:
  requires: [20-00, 20-06, 20-07, 20-08]
  provides: [FERT-07, fertilizer-conditional-parity-gate, fertilizer-recommendation-validation]
  affects: [scripts/check-i18n-keys.mjs]
tech_stack:
  added: []
  patterns:
    - "Conditional fertilizer.{industrialRecommendation,homemadeRecommendation} validation extending Phase 19 TOX-06 sub-field pattern"
    - "Append-only script extension — existing nutrients/careAction/placement/whyRationale/petToxicity blocks untouched"
    - "Independent sub-field validation (Pitfall 6) — suculentas industrial-only entries pass without false-negative"
key_files:
  created: []
  modified:
    - scripts/check-i18n-keys.mjs
decisions:
  - "Append-only extension landing AFTER petToxicity.symptoms.dogs block (line 124), BEFORE per-locale for-loop close — exact same insertion site discipline as Phase 19 TOX-06"
  - "Independent sub-field gates (industrial separate from homemade) — Pitfall 6 — so suculentas/cactus entries declaring ONLY industrialRecommendation pass without requiring homemadeRecommendation"
  - "Error message format mirrors TOX-06 verbatim: `[${locale}] \"${entry.id}\".fertilizer.{field} missing or empty`"
  - "Verified non-empty string requirement (typeof === 'string' && length >= 1) — matches catalog-content shape produced by Plans 20-06/07/08"
metrics:
  duration: "~3 min"
  completed: "2026-05-11"
  tasks_completed: 1
  files_modified: 1
  lines_added: 21
---

# Phase 20 Plan 09: FERT-07 i18n Parity Gate Extension Summary

**One-liner:** Conditional fertilizer recommendation parity validation appended to check-i18n-keys.mjs (mirrors Phase 19 TOX-06 sub-field pattern); FERT-07 i18n parity gate closed at 118/118 catalog ids; smoke-phase20 FERT-07.checkScript sentinel flips SKIP→PASS without disturbing Phase 18/19 surfaces.

## Tasks Completed

### Task 1: Append fertilizer.industrialRecommendation + homemadeRecommendation conditional validation to check-i18n-keys.mjs
**Commit:** a5e923c

Added Phase 20 (FERT-07) conditional block immediately after the existing TOX-06 `petToxicity.symptoms.dogs` validation (line 124) and before the closing brace of the per-locale `for` loop (now line 145). The extension is append-only — 21 lines added (block comment + 2 independent sub-field gates) to the per-entry loop:

```javascript
// ─── v1.2 Phase 20 (FERT-07): conditional fertilizer recommendation validation ───
// When the catalog entry declares fertilizer.industrialRecommendation OR
// fertilizer.homemadeRecommendation, the corresponding plants.json per-entry node
// MUST provide a non-empty string for each declared sub-field. Sub-fields are
// validated INDEPENDENTLY — suculentas entries (Plan 20-07) declare only
// industrialRecommendation and intentionally omit homemadeRecommendation;
// those entries pass the gate without a false-negative on the missing homemade key.
// (Pitfall 6 — same independent-sub-field discipline as Phase 19 TOX-06 above.)
if (entry.fertilizer?.industrialRecommendation) {
  const industrialNode = node?.fertilizer?.industrialRecommendation;
  if (typeof industrialNode !== 'string' || industrialNode.length < 1) {
    errors.push(`[${locale}] "${entry.id}".fertilizer.industrialRecommendation missing or empty`);
  }
}
if (entry.fertilizer?.homemadeRecommendation) {
  const homemadeNode = node?.fertilizer?.homemadeRecommendation;
  if (typeof homemadeNode !== 'string' || homemadeNode.length < 1) {
    errors.push(`[${locale}] "${entry.id}".fertilizer.homemadeRecommendation missing or empty`);
  }
}
```

Acceptance criteria verified:
- `grep -c "fertilizer.industrialRecommendation" scripts/check-i18n-keys.mjs` = 2 (comment ref + access path)
- `grep -c "fertilizer.homemadeRecommendation" scripts/check-i18n-keys.mjs` = 2 (comment ref + access path)
- `grep -cE "entry\.fertilizer\?\.industrialRecommendation" scripts/check-i18n-keys.mjs` = 1
- `grep -cE "entry\.fertilizer\?\.homemadeRecommendation" scripts/check-i18n-keys.mjs` = 1
- `npm run check:i18n-keys` exits 0 — `PASS — 118 catalog ids verified across en/es plants.json`
- `node scripts/smoke-phase20.cjs` → FERT-07.checkScript.fertilizer-conditional-extension SKIP→PASS (smoke went from 47 PASS/2 SKIP previously to 48 PASS/1 SKIP now)
- `node scripts/smoke-phase20.cjs` → CROSS.TOX-06.checkScript.symptoms-extension-preserved STAYS PASS (regex `/petToxicity[^]*?symptoms/` unaffected by append)
- `npm run smoke:phase18` PASS=56, FAIL=0, SKIP=0 (untouched)
- `npm run smoke:phase19` PASS=85, FAIL=0, SKIP=0 (untouched)
- `npx tsc --noEmit` exits 0

## Deviations from Plan

None — plan executed exactly as written. The +21 LOC delta vs PLAN's predicted +17 LOC comes from a slightly more verbose block-comment header for Pitfall 6 traceability; the executable gate logic itself is exactly the 12 lines specified in the plan.

## i18n Parity Gate Coverage After This Plan

| Field | Conditional check | Pattern source |
|-------|------------------|----------------|
| `name`, `tip`, `description`, `problems` | Required for all entries | Phase 8 CAT-06 |
| `nutrients.{type,homemade}` | Conditional on entry.nutrients | Phase 14 |
| `careAction.{fixed,soilCheck}` | Independent sub-fields | Phase 14 EDU-07 |
| `placement{Recommended,Alternatives,Avoid}` | Per-field conditional | Phase 14 EDU-07 |
| `whyRationale` | Conditional scalar | Phase 14 EDU-07 |
| `petToxicity.symptoms.{cats,dogs}` | Independent sub-fields, array-length-aware | Phase 19 TOX-06 |
| **`fertilizer.industrialRecommendation`** | **Conditional scalar (new)** | **Phase 20 FERT-07** |
| **`fertilizer.homemadeRecommendation`** | **Conditional scalar (new)** | **Phase 20 FERT-07** |

## Pitfall 6 — Suculentas Industrial-Only Entries

Plan 20-07 produced 16 suculentas/cactus entries declaring `fertilizer.type === 'industrial'` with ONLY `industrialRecommendation` (no `homemadeRecommendation` — homemade composts are nitrogen-rich and unsuitable for CAM xerophytes). The new gate validates each sub-field independently:

- Catalog declares `industrialRecommendation` only → gate requires `industrialRecommendation` in both locales; does NOT require `homemadeRecommendation`. ✅
- Catalog declares `homemadeRecommendation` only → gate requires `homemadeRecommendation` in both locales; does NOT require `industrialRecommendation`. ✅
- Catalog declares both → gate requires both in both locales. ✅
- Catalog declares neither → gate is silent (the catalog entry has no fertilizer content at all). ✅

The 118-id PASS proves no false-negatives on suculentas.

## Cross-Phase Regression Status

| Runner / Check | Result | Notes |
|---------------|--------|-------|
| `npm run check:i18n-keys` | PASS — 118 ids verified | New gate active, all locales parity-correct |
| `node scripts/smoke-phase20.cjs` | PASS=48 FAIL=0 SKIP=1 | FERT-07.checkScript SKIP→PASS; only remaining SKIP is FERT-03.TaskButton.fertilize-render (out of scope, unchanged) |
| `npm run smoke:phase18` | PASS=56 FAIL=0 SKIP=0 | Untouched (no shared files) |
| `npm run smoke:phase19` | PASS=85 FAIL=0 SKIP=0 | TOX-06 sentinel preserved |
| `npx tsc --noEmit` | exits 0 | Script change is .mjs runtime; no TS impact |

The CROSS.TOX-06.checkScript.symptoms-extension-preserved sentinel uses regex `/petToxicity[^]*?symptoms/` which matches the still-present TOX-06 block above the new FERT-07 append.

## Append-Only Discipline Verification

`git diff HEAD~1 scripts/check-i18n-keys.mjs` shows pure insertions — no deletions, no rewrites. Existing checks (`nutrients`, `careAction`, `placement*`, `whyRationale`, `petToxicity.symptoms.{cats,dogs}`) untouched. The final PASS-message line at the end of the script is also unchanged (still `${PLANT_DATABASE.length} catalog ids verified`).

## Self-Check: PASSED

Verified:
- `scripts/check-i18n-keys.mjs` modified (FOUND)
- Commit `a5e923c` exists on main (FOUND via `git log --oneline | grep a5e923c`)
- `.planning/phases/20-fertilization-subsystem/20-09-SUMMARY.md` created (this file)
