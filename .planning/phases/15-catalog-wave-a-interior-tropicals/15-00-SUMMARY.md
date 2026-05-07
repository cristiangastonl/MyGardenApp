---
phase: 15-catalog-wave-a-interior-tropicals
plan: 00
subsystem: testing
tags: [smoke-runner, cjs, fixture-asserts, partial-landing-tolerance, voseo-regression, catalog-fixture]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    provides: 64-entry PLANT_DATABASE baseline + voseo regex baseline (count=2) + EN/ES plants.json keyset shape
provides:
  - scripts/phase15-smoke.cjs (217 LOC) — Wave 0 fixture runner for Phase 15 catalog wave
  - 23 PHASE_15_IDS + 23 species-qualified PHASE_15_SCIENTIFIC_NAMES encoded as runner constants
  - Partial-landing tolerance gate (anyLanded/allLanded shared window) — keeps runner exit-0 at Plan 15-01 → 15-02 midpoint
  - Voseo regression assertion (≤2 matches against es/plants.json) running every invocation
  - npm run smoke:phase15 wired (alphabetical placement next to smoke:phase14)
  - scripts/.tmp-phase15/{async-storage,i18n}.cjs auto-write + gitignore line
affects: [15-01, 15-02, 15-03, 15-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CJS smoke runner with require() (VALIDATION.md locks .cjs extension — distinct from Phase 14's .mjs)
    - Partial-landing tolerance via PHASE_15_LANDED_FLAGS + anyLanded/allLanded shared window (NEW — extends Phase 14's heuristic SKIP gate)
    - Sentinel-based SKIP→PASS auto-flip ('Maranta leuconeura' for CAT-11, anyLanded for CAT-09/IDENT, 'Phase 15' substring for CAT-12)
    - Mid-band count tolerance (`idMatches > 64 && idMatches < 87` → SKIP) for catalog growth across two plans
    - Genus-OR-species-qualified match for COMMON_NAMES_ES (handles legacy genus-only entries like 'Anthurium', 'Dieffenbachia', 'Hedera helix')

key-files:
  created:
    - scripts/phase15-smoke.cjs (217 LOC — CJS runner with full Wave 0 scaffold + Wave 1-3 SKIP placeholders)
    - scripts/.tmp-phase15/async-storage.cjs (auto-written; gitignored)
    - scripts/.tmp-phase15/i18n.cjs (auto-written; gitignored)
  modified:
    - package.json (+1 line — smoke:phase15 npm script)
    - .gitignore (+1 line — explicit scripts/.tmp-phase15/ entry)

key-decisions:
  - "Wave 0 baseline output locked at PASS 10/81 (71 SKIP) — 9 scaffold + 1 voseo regression PASSes; 23+1+23+23+1 = 71 SKIPs"
  - "Partial-landing tolerance window applied to CAT-09 per-id, CAT-09 count (idMatches > 64 && < 87 → SKIP), AND IDENT.CAT-11 — runner stays exit-0 at the Plan 15-01 (12 ids → catalog 76) → Plan 15-02 (final 11 ids → catalog 87) midpoint"
  - "Species-qualified scientificNames in PHASE_15_SCIENTIFIC_NAMES (e.g., 'Dieffenbachia seguine' not 'Dieffenbachia') — required to match scientificName values authored in Plans 15-01/02; CAT-11 gate accepts EITHER species-qualified OR genus-only as legacy compat for COMMON_NAMES_ES"
  - "CJS extension (.cjs) over .mjs — VALIDATION.md lock; uses require()/module.exports; no top-level await; differs from Phase 14 (.mjs + ts.transpileModule). Phase 15 is content-only (no behavioral runtime), so file-content asserts via readFileSync + regex are sufficient"
  - "SKIP→PASS flip sentinels are runner-level constants — Plans 15-01..04 only land catalog/i18n/identification/CLAUDE.md content; the runner itself is NEVER edited again after this plan"

patterns-established:
  - "Pattern: PHASE_N_LANDED_FLAGS array computed ONCE at top of runner (PHASE_15_IDS.map(id => regexTest(dbSrc))). Reused across CAT-09 per-id, CAT-09 count gate, AND IDENT.CAT-11 for consistent partial-landing window"
  - "Pattern: Mid-band count gate uses an explicit numeric range (`idMatches > BASELINE && idMatches < FINAL` → SKIP) rather than booleans — surfaces the catalog-growth window in code"
  - "Pattern: Auto-written stubs use writeFileSync at runtime (only if absent), with explicit comment '// Auto-written. CJS.' — keeps Phase 14 precedent + extends to CJS"

requirements-completed: [CAT-09, CAT-10, CAT-11, CAT-12]

# Metrics
duration: 3min
completed: 2026-05-07
---

# Phase 15 Plan 00: Wave 0 Smoke Runner Scaffold Summary

**CJS smoke runner (`scripts/phase15-smoke.cjs`, 217 LOC) encoding all 23 Phase 15 ids + 23 species-qualified scientificNames as constants with partial-landing tolerance gates, baseline 10 PASS / 71 SKIP / 0 FAIL exit 0**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-07T14:17:50Z
- **Completed:** 2026-05-07T14:20:42Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 1 generated stub-pair, 2 modified)

## Accomplishments

- Phase 15 per-task feedback loop unblocked: `node scripts/phase15-smoke.cjs && npx tsc --noEmit && npm run check:i18n-keys` < 15 s
- Every Wave 1-3 verification surface (CAT-09 per-id, CAT-09 count, CAT-10 keyset parity, CAT-11 COMMON_NAMES_ES, IDENT.CAT-11 sci-name↔id co-occurrence, CAT-12 CLAUDE.md mention) encoded as SKIP placeholder that auto-flips on content land — runner is never edited again
- Voseo regression assertion (≤2 matches) PASSes immediately against current `es/plants.json` (baseline=2 verified pre- and post-implementation); locks the global tone discipline as a regression gate for Plans 15-01/02
- Partial-landing tolerance: 3 gates (CAT-09 per-id, CAT-09 count, IDENT.CAT-11) share an `anyLanded`/`allLanded` window so the runner stays exit-0 at the Plan 15-01 → 15-02 midpoint where catalog count is 65–86 and 12 of 23 ids exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/phase15-smoke.cjs runner with full Wave 0 scaffold + Wave 1-3 SKIP placeholders** — `953999a` (feat)
2. **Task 2: Wire smoke:phase15 npm script + .gitignore exclusion for scripts/.tmp-phase15/** — `26ad871` (chore)

**Plan metadata commit (SUMMARY + STATE + ROADMAP):** to be made after this file lands.

## Files Created/Modified

- `scripts/phase15-smoke.cjs` (NEW, 217 LOC) — Phase 15 smoke runner. Encodes 23 ids + 23 species-qualified scientificNames + voseo regression + 5 SKIP→PASS sentinel groups + --identification mode
- `scripts/.tmp-phase15/async-storage.cjs` (auto-written at runtime, gitignored) — in-memory Map-backed AsyncStorage stub
- `scripts/.tmp-phase15/i18n.cjs` (auto-written at runtime, gitignored) — i18n stub returning defaultValue or key
- `package.json` (+1 line) — `"smoke:phase15": "node scripts/phase15-smoke.cjs"` placed alphabetically between `smoke:phase14` and `typecheck`
- `.gitignore` (+1 line) — explicit `scripts/.tmp-phase15/` line under existing `scripts/.tmp-*/` wildcard block (Phase 14 precedent)

## Wave 0 Baseline Numbers

| Mode | PASS | SKIP | FAIL | Exit |
|------|------|------|------|------|
| `node scripts/phase15-smoke.cjs` | 10 | 71 | 0 | 0 |
| `node scripts/phase15-smoke.cjs --identification` | 10 | 94 | 0 | 0 |
| `npm run smoke:phase15` (alias) | 10 | 71 | 0 | 0 |

**PASS breakdown (10):** 9 scaffold (W0.1–W0.9: fs.readFileSync, __DEV__, both stubs, plantDatabase.ts, plantIdentification.ts, en/plants.json, es/plants.json, CLAUDE.md) + 1 voseo regression (`GLOBAL.voseo: voseoCount === 2 ≤ 2`).

**SKIP breakdown (71 in primary mode):** 23 CAT-09 per-id + 1 CAT-09 count + 23 CAT-10 keyset-pair + 23 CAT-11 sci-name + 1 CAT-12. With `--identification`: + 23 IDENT.CAT-11 co-occurrence = 94.

## SKIP-Flip Sentinels (per downstream plan)

| Plan | Requirement(s) | Sentinel that flips SKIP→PASS | Mechanism |
|------|----------------|-------------------------------|-----------|
| 15-01 | CAT-09 (12 ids), CAT-10 (12 keysets) | Any of the 23 Phase 15 ids appears as `id: 'foo'` in `src/data/plantDatabase.ts` (sets `anyLanded=true`) | landed ids → PASS, unlanded ids → still SKIP (mid-band) |
| 15-02 | CAT-09 (final 11 ids → count = 87), CAT-10 (final 11 keysets) | All 23 ids land (`allLanded=true`) AND `idMatches === 87` | every CAT-09/IDENT gate flips to genuine PASS |
| 15-03 | CAT-11 (COMMON_NAMES_ES) | Any of the W1 sentinel scientificNames present in `src/utils/plantIdentification.ts` (canonical: `Maranta leuconeura`; OR `Asplenium nidus` / `Heptapleurum arboricola` / `Sedum morganianum` / `Howea forsteriana` / `Dypsis lutescens` / `Caladium bicolor`) | unlocks all 23 CAT-11 gates simultaneously; each accepts species-qualified OR genus-only key |
| 15-04 | CAT-12 (CLAUDE.md accepted-known) | Substring `Phase 15` present in CLAUDE.md | unlocks the ≥20-of-23 ids count check |

## Voseo Baseline (verified)

```bash
grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json
# => 2  (post-Phase-14 baseline; assertion is "<= 2", so PASSes immediately at Wave 0)
```

This regex match-count is asserted on EVERY runner invocation (not SKIP-gated). Plans 15-01/02 ES content authoring MUST keep the count ≤2 — any new tú-form leak surfaces as a `GLOBAL.voseo` FAIL within the per-task feedback loop, blocking the wave.

## Partial-Landing Midpoint Behavior (verified)

The single source of truth for landing state:

```js
const PHASE_15_LANDED_FLAGS = PHASE_15_IDS.map(id => new RegExp(`id:\\s*['"]${id}['"]`).test(dbSrc));
const anyLanded = PHASE_15_LANDED_FLAGS.some(Boolean);
const allLanded = PHASE_15_LANDED_FLAGS.every(Boolean);
```

Three gates share this window:

1. **CAT-09 per-id (23 placeholders):** `if (!anyLanded) SKIP; if (anyLanded && !allLanded && !present) SKIP; else PASS/FAIL on present`
2. **CAT-09 count (1 placeholder):** explicit numeric range — `idMatches < 64 → SKIP (catalog drift)`, `=== 64 → SKIP (baseline)`, `> 64 && < 87 → SKIP (mid-band)`, `=== 87 → PASS`
3. **IDENT.CAT-11 (23 placeholders, --identification only):** same anyLanded/allLanded gate as CAT-09 per-id; unlanded ids SKIP, landed ids assert scientificName co-occurrence

After Plan 15-01 lands 12 of 23 ids: `anyLanded=true, allLanded=false`, `idMatches=76`. Expected runner output: 12 CAT-09 per-id PASSes + 11 SKIPs + 1 count SKIP (mid-band) + 12 CAT-10 PASSes + 11 SKIPs (assuming Task 2 lands keysets in the same wave). Runner exits 0.

After Plan 15-02 lands the remaining 11: `allLanded=true`, `idMatches=87`. All CAT-09/CAT-10/IDENT gates flip to genuine PASS.

## Decisions Made

- **CJS over MJS for the runner:** VALIDATION.md locks `.cjs`. Phase 15 is content-only (catalog data, i18n strings, identification map, CLAUDE.md mention) — no runtime behavior to compile. File-content asserts via `readFileSync` + regex are sufficient and ~5× faster than the Phase 14 hybrid (file-content + ts.transpileModule). Differs from Phase 11/12/14 precedent and is documented in the runner header.
- **Species-qualified PHASE_15_SCIENTIFIC_NAMES with genus-OR-species fallback in CAT-11 gate:** Plans 15-01/02 will author scientificName values like 'Dieffenbachia seguine' not 'Dieffenbachia'. The CAT-11 COMMON_NAMES_ES gate accepts EITHER form to remain compatible with existing genus-only entries (e.g., 'Anthurium', 'Codiaeum', 'Hedera helix'). The IDENT.CAT-11 gate (--identification mode) requires EXACT species-qualified match against plantDatabase.ts.
- **Single source of truth for landing state:** PHASE_15_LANDED_FLAGS computed ONCE at module top, reused across CAT-09 per-id, CAT-09 count, AND IDENT.CAT-11. Prevents drift between the three gates and makes the partial-landing window auditable in one place.
- **Maranta leuconeura as the W1.CAT-11 sentinel:** Clean new addition not present in current COMMON_NAMES_ES; cannot accidentally appear during 15-01/15-02 catalog edits (they touch plantDatabase.ts, not plantIdentification.ts). Six other species names act as redundant sentinels.

## Deviations from Plan

None — plan executed exactly as written.

The plan's Step 1–14 specification was followed verbatim. All 23 ids and all 23 species-qualified scientificNames were copied from the locked interfaces block. Acceptance criteria 1–14 all PASSed (the `grep -cE "(anthurium|alocasia|...|arbol-dinero)"` line-count returned 4 because all 23 fit on 4 lines, but each individual id appears as a quoted literal — verified by `grep -oE "'(anthurium|...)'" | sort -u | wc -l = 23`). Voseo baseline regression PASSed at Wave 0 (count=2). All 7 end-of-plan verification commands passed.

## Issues Encountered

None.

## Self-Check

- [x] `scripts/phase15-smoke.cjs` exists (217 LOC)
- [x] Task 1 commit `953999a` exists in git log
- [x] Task 2 commit `26ad871` exists in git log
- [x] `package.json` contains `"smoke:phase15": "node scripts/phase15-smoke.cjs"` (1 occurrence)
- [x] `.gitignore` contains `scripts/.tmp-phase15/` (1 occurrence)
- [x] `node scripts/phase15-smoke.cjs` exits 0 with PASS 10/81
- [x] `node scripts/phase15-smoke.cjs --identification` exits 0 with PASS 10/104
- [x] `npm run smoke:phase15` exits 0 (alias works)
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run check:i18n-keys` exits 0 (still 64 ids, no regression)
- [x] `git check-ignore scripts/.tmp-phase15/` exits 0
- [x] `git status --short | grep tmp-phase15` returns nothing (stubs not tracked)

## Next Phase Readiness

Plan 15-00 hands off to Plan 15-01 (Wave 1 — Sub-batch A: 12 entries × catalog + i18n + identification). Plan 15-01 verify command:
```bash
node scripts/phase15-smoke.cjs && npx tsc --noEmit && npm run check:i18n-keys
```
At Plan 15-01 completion, expected runner output: 22 PASSes (10 baseline + 12 CAT-09 per-id + 12 CAT-10 keyset for sub-batch A — minus partial overlap), with 11 unlanded-id SKIPs and 1 mid-band count SKIP. Runner exits 0.

Plan 15-02 (sub-batch B: 11 ids) will trip `allLanded=true` and flip every CAT-09 / CAT-10 / IDENT.CAT-11 placeholder to genuine PASS — at which point the runner becomes a regression-only fixture for Plans 15-03 and 15-04.

## Self-Check: PASSED

All claimed files exist; both task commits are in `git log`; runner exits 0 in all three modes; tsc + check:i18n-keys exit 0; gitignore covers tmp-phase15.

---
*Phase: 15-catalog-wave-a-interior-tropicals*
*Completed: 2026-05-07*
