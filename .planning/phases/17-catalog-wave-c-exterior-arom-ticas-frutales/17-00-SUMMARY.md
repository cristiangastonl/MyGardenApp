---
phase: 17-catalog-wave-c-exterior-arom-ticas-frutales
plan: 00
subsystem: testing
tags: [smoke-runner, ts-transpile, plant-identification, gsd-nyquist-gate, catalog-v1.2-closure]

# Dependency graph
requires:
  - phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending
    provides: phase16-smoke.cjs harness template + ts.transpileModule routing path + exact-match-first findPlantInDatabase refactor (inherited unchanged as regression sentinel)
  - phase: 15-catalog-wave-a-interior-tropicals
    provides: CJS smoke-runner pattern + partial-landing tolerance window precedent
provides:
  - scripts/phase17-smoke.cjs Wave 0 harness with CAT-17/18/19/20/21 SKIP placeholders (337 LOC)
  - npm run smoke:phase17 wired
  - Mid-band partial-landing tolerance (anyLanded/allLanded gates) for Plans 17-01/17-02 incremental commits
  - Final CAT-21 count gate at idMatches === 118 (closes the entire v1.2 catalog expansion)
  - Phase 16 exact-match-first refactor inherited as routing-fix regression sentinel (NO refactor task in this plan)
affects: [17-01, 17-02, 17-03, 17-04, future-catalog-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase 16 textual-delta runner pattern (copy template + apply substitution table) — minimizes drift, max code-reuse across phases"
    - "Removed hasEduFieldsForId helper (Phase 16-specific upgrade detection) — Phase 17 has no in-place upgrades, all 14 ids are net-new"
    - "Dual sentinel pattern continued: PHASE_17_LANDED_FLAGS (catalog landing) + W3_SENTINEL_PRESENT (COMMON_NAMES_ES landing)"
    - "Final-milestone count gate at idMatches === 118 (104 baseline + 14 net-new) — CAT-21 closes v1.2 catalog expansion"

key-files:
  created:
    - "scripts/phase17-smoke.cjs (337 LOC NEW — Wave 0 harness + ts-transpile routing path)"
    - "scripts/.tmp-phase17/async-storage.cjs (auto-written at runtime, gitignored)"
    - "scripts/.tmp-phase17/i18n.cjs (auto-written at runtime, gitignored)"
  modified:
    - "package.json (+1 line — smoke:phase17 npm script alphabetical placement after smoke:phase16)"
    - ".gitignore (+1 line — explicit scripts/.tmp-phase17/ exclusion under existing wildcard)"

key-decisions:
  - "Phase 17 inherits Phase 16's exact-match-first findPlantInDatabase refactor unchanged — NO refactor task in this plan; refactor sentinel reused as regression check (refactorLanded literal-substring gate)"
  - "PHASE_17_NEW_IDS === PHASE_17_IDS (no in-place upgrades) — simpler than Phase 16 which split potus/filodendro upgrades from net-new entries"
  - "Mid-band SKIP window: idMatches > 104 && < 118 → undefined (mirrors Phase 15 64→87 and Phase 16 87→104 patterns); Plan 17-01 lands 8 → 112 mid-band SKIP; Plan 17-02 lands 6 → 118 PASS"
  - "Final CAT-21 assertion (idMatches === 118) closes the entire v1.2 catalog expansion when Plan 17-02 lands the last 6 entries"
  - "4 open questions surfaced for user review (aromáticas outdoor flag, PlantCategory enum count, arandano category, magnolia variant) — Plan 17-00 is content-agnostic and unaffected"
  - "Carry-forward: Phase 17 Wave C image-upload backlog will be batched at v1.2 milestone end alongside v1.1 LATAM 15 + Phase 15 Wave A 23 + Phase 16 Wave B 17 = 55-entry cumulative backlog (becomes 67-69 after Phase 17 Plan 17-04 lands)"

patterns-established:
  - "Pattern 1: Phase-N smoke runner authored as textual delta from Phase-(N-1) — copy verbatim + apply documented substitution table; minimizes drift and accelerates Wave 0 by ~5x vs from-scratch authoring"
  - "Pattern 2: Final-milestone catalog count gate (idMatches === FINAL) becomes a closure assertion when the phase's catalog count target equals the milestone's terminal target — Phase 17 closes v1.2 because 104 + 14 = 118 is the v1.2 endpoint"
  - "Pattern 3: Phase-N runner inherits Phase-(N-1) routing refactor as regression sentinel without re-implementing the refactor task — when the upstream refactor is robust enough to need no further changes, downstream runners just check it's still in place"

requirements-completed: [CAT-17, CAT-18, CAT-19, CAT-20, CAT-21]

# Metrics
duration: 4min
completed: 2026-05-08
---

# Phase 17 Plan 00: Wave 0 Smoke Runner Scaffold Summary

**Phase 17 Wave C smoke runner (337 LOC, CJS, ts-transpile routing path) with CAT-17/18/19/20/21 SKIP placeholders + final v1.2-closure count gate at idMatches === 118 — inherits Phase 16's exact-match-first refactor unchanged as regression sentinel.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-08T15:46:23Z
- **Completed:** 2026-05-08T15:50:36Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified) + 2 auto-written stubs (gitignored)

## Accomplishments

- `scripts/phase17-smoke.cjs` (337 LOC) authored as textual delta from `phase16-smoke.cjs` per RESEARCH §Example 3 substitution table
- 14 PHASE_17_IDS encoded across CAT-17 (8 exterior flores) + CAT-18 (3 aromáticas) + CAT-19 (3 frutales/huerta)
- 14 species-qualified scientificNames in PHASE_17_SCIENTIFIC_NAMES (POWO 2024 + RHS/NCSU cross-verified per 17-RESEARCH §Standard Stack)
- Mid-band partial-landing tolerance encoded: `idMatches > 104 && < 118 → SKIP` keeps runner exit-0 between Plans 17-01 and 17-02
- Final CAT-21 manifest gate: `idMatches === 118` closes the entire v1.2 catalog expansion
- `npm run smoke:phase17` wired with `--identification` and `--routing-fix` flag pass-through
- `scripts/.tmp-phase17/` gitignored (explicit line + existing wildcard cover)
- Phase 16 exact-match-first refactor sentinel (`/const exactMatch = PLANT_DATABASE\.find/`) reused as regression check — fires under `--routing-fix` flag without re-implementing the refactor

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/phase17-smoke.cjs** — `3987ec3` (feat)
2. **Task 2: Wire smoke:phase17 npm script + .gitignore exclusion** — `c374f1a` (chore)

## Wave 0 Baseline Numbers

**Default invocation (`node scripts/phase17-smoke.cjs`):**
- PASS: 10 (9 W0.* scaffold + 1 GLOBAL.voseo regression)
- SKIP: 44 (8 CAT-17 + 3 CAT-18 + 3 CAT-19 + 1 CAT-counts.total + 14 CAT-20 keysets + 14 CAT-20 commonNames + 1 CAT-20 imagePlan)
- FAIL: 0
- Exit: 0

**`--identification` flag:**
- PASS: 10 / SKIP: 58 / FAIL: 0 / Exit: 0
- Adds 14 IDENT.CAT-20.* SKIPs (file-content scientificName↔id co-occurrence)

**`--routing-fix` flag:**
- PASS: 10 / SKIP: 58 / FAIL: 0 / Exit: 0
- Adds 14 W2.ROUTING-FIX.* SKIPs (ts.transpileModule + runtime findPlantInDatabase calls; partial-landing-gated)

## Voseo Baseline Confirmed

`grep -cE '\\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\\b' src/i18n/locales/es/plants.json` → **2** (preserved from Phase 16 baseline). The GLOBAL.voseo assertion PASSes at Wave 0 — the regression check fires from cold start, NOT a SKIP.

## Cross-Phase Regression Check

| Runner | Default | --identification | --routing-fix |
|--------|---------|------------------|---------------|
| Phase 15 | PASS 81/81 | PASS 104/104 | n/a |
| Phase 16 | PASS 69/69 | PASS 88/88 | PASS 92/92 |
| Phase 17 (NEW) | PASS 10/54 | PASS 10/68 | PASS 10/68 |

Zero cross-phase regressions. `npx tsc --noEmit` exits clean. `npm run check:i18n-keys` PASSes (104 catalog ids verified across en/es plants.json).

## Sentinel Patterns Documented

- **Phase 17 species substring sentinel for COMMON_NAMES_ES (Plan 17-03 SKIP→PASS):** `W3_SENTINEL_PRESENT` regex matches any of the 14 species-qualified scientificNames in `idSrc` (Rhododendron simsii, Cyclamen persicum, Fuchsia magellanica, Dianthus caryophyllus, Chrysanthemum × morifolium, Tulipa gesneriana, Helianthus annuus, Magnolia stellata, Salvia officinalis, Anethum graveolens, Stevia rebaudiana, Olea europaea, Vaccinium corymbosum, Spinacia oleracea). Genus-only matches accepted as legacy compat for Rhododendron/Cyclamen/Fuchsia (which already exist in COMMON_NAMES_ES at the genus level).
- **"Phase 17 Wave C" substring for image plan (Plan 17-04 SKIP→PASS):** `/Phase 17 Wave C/i.test(claudeMd)` AND ≥12-of-14 ids mentioned in CLAUDE.md flips the imagePlan SKIP to PASS.
- **`const exactMatch = PLANT_DATABASE.find` for routing-fix:** Phase 16 refactor sentinel reused unchanged. `refactorLanded` literal-substring gate confirms Plan 16-00's protection is still in place — if a future phase accidentally strips the refactor, all 14 W2.ROUTING-FIX.* gates flip to SKIP loudly.
- **Partial-landing anyLanded/allLanded windowing:** PHASE_17_LANDED_FLAGS regex array drives single-source-of-truth landing-state across CAT-17/18/19 per-id, count, IDENT, ROUTING-FIX modes. Mid-band Plans 17-01 (8 of 14) and 17-02 (final 6) keep the runner exit-0 throughout authoring.

## Open Questions Surfaced (4 — for user review BEFORE Plan 17-01/02 execute)

These were surfaced by 17-RESEARCH.md as deserving user review. Each has a researcher-recommended default; planning proceeds with defaults unless flipped. None block Plan 17-00 (Wave 0 is content-agnostic).

1. **Q1 — Aromáticas outdoor flag (HIGH IMPACT):** CONTEXT.md locks 3 new aromáticas at `outdoor: false`. Direct grep shows ALL 6 existing aromáticas use `outdoor: true`. Default in Plan 17-02 honors the lock; **researcher recommends flip to `outdoor: true`** to match real precedent. **UNRESOLVED at Plan 17-00 close** — user decision pending before Plan 17-02.
2. **Q2 — PlantCategory enum count (LOW IMPACT, doc correction):** CONTEXT.md says "8 PlantCategory values"; src/types/index.ts:152 declares 6. No code action needed in Phase 17. **UNRESOLVED at Plan 17-00 close** — doc correction deferred to Phase 24.
3. **Q3 — arandano category (CONTENT-LEVEL):** Default `frutales` (matches limonero precedent — woody perennial Vaccinium). Alternative `huerta` (matches frutilla precedent). **UNRESOLVED at Plan 17-00 close** — researcher recommends `frutales`; user decision pending before Plan 17-02.
4. **Q4 — Magnolia variant choice (MEDIUM IMPACT):** Default `Magnolia stellata` (RHS small-garden choice, 3m). Alternative `Magnolia grandiflora` (iconic 20m evergreen). **UNRESOLVED at Plan 17-00 close** — researcher recommends `stellata` canonical with `grandiflora` as legacy alias in Plan 17-03; user decision pending before Plan 17-01.

All 4 defaults are encoded throughout Plans 17-01/02/03/04. User changes propagate trivially (per-token edits in author plans).

## Files Created/Modified

- `scripts/phase17-smoke.cjs` (337 LOC NEW) — Wave 0 harness with CAT-17/18/19/20/21 SKIP placeholders + final CAT-21 idMatches===118 gate
- `scripts/.tmp-phase17/async-storage.cjs` (auto-written, gitignored) — In-memory Map-backed AsyncStorage stub
- `scripts/.tmp-phase17/i18n.cjs` (auto-written, gitignored) — i18n stub returning defaultValue or key
- `package.json` (+1 line) — `"smoke:phase17": "node scripts/phase17-smoke.cjs"` alphabetical placement after smoke:phase16
- `.gitignore` (+1 line) — `scripts/.tmp-phase17/` explicit exclusion under existing smoke-runner block

## Decisions Made

- **NO findPlantInDatabase refactor in this plan** — Phase 16 Plan 16-00 already landed exact-match-first; verified at `src/utils/plantIdentification.ts` (`grep -c 'const exactMatch = PLANT_DATABASE.find' === 1`). Phase 17 inherits the protection unchanged.
- **PHASE_17_NEW_IDS === PHASE_17_IDS** — no in-place upgrades (unlike Phase 16's potus/filodendro). Removed `hasEduFieldsForId` helper from Phase 16 template entirely.
- **Final CAT-21 count gate at idMatches === 118** — when Plan 17-02 lands the last 6 entries, this assertion flips SKIP→PASS, simultaneously closing CAT-21 AND the v1.2 catalog expansion (104 + 14 = 118).
- **Mid-band SKIP window pattern carried forward verbatim** — `> 104 && < 118 → undefined` mirrors Phase 15 (64→87) and Phase 16 (87→104). Single-source-of-truth PHASE_17_LANDED_FLAGS array shared across per-id, count, IDENT, ROUTING-FIX modes.
- **Auto-written stubs gitignored via existing wildcard** — `scripts/.tmp-*/` already covers `.tmp-phase17/`, but the explicit line is added for grep-discoverability per Phase 14/15/16 precedent.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria for both tasks pass on first invocation:
- File line count: 337 LOC (≥280 minimum)
- All grep counts hit specified thresholds (PHASE_17_IDS, scientificNames, ids, partial-landing gates, ts-transpile path, exactMatch sentinel, Phase 17 Wave C, post-Phase-16 baseline)
- `hasEduFieldsForId` helper correctly absent (count = 0)
- No leftover `phase16` references (count = 0)
- `npm run smoke:phase17` + flag pass-through all exit 0
- `git check-ignore scripts/.tmp-phase17/foo.cjs` succeeds
- `git status` excludes `.tmp-phase17/`
- `npx tsc --noEmit` clean
- Phase 15 + Phase 16 cross-phase regression checks all green

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 0 scaffold complete; Plan 17-01 (8 CAT-17 exterior flores: azalea/ciclamen/fucsia/clavel/crisantemo/tulipan/girasol/magnolia) ready to land entries with mid-band SKIP tolerance
- Plan 17-02 (3 CAT-18 aromáticas + 3 CAT-19 frutales/huerta) lands next, flipping mid-band → final CAT-21 PASS at idMatches === 118
- Plan 17-03 (COMMON_NAMES_ES species-qualified additions) flips W3_SENTINEL_PRESENT → all 14 W3.CAT-20.* gates PASS
- Plan 17-04 (CLAUDE.md image plan) flips W3.CAT-20.imagePlan gate at "Phase 17 Wave C" substring + ≥12 of 14 ids
- 4 open questions to surface for user review at plan-checker stage before Plans 17-01/02 execute

## Self-Check: PASSED

All claimed files exist:
- `scripts/phase17-smoke.cjs` — FOUND (337 LOC)
- `scripts/.tmp-phase17/async-storage.cjs` — FOUND (auto-written)
- `scripts/.tmp-phase17/i18n.cjs` — FOUND (auto-written)
- `package.json` smoke:phase17 entry — FOUND
- `.gitignore` scripts/.tmp-phase17/ line — FOUND

All claimed commits exist:
- `3987ec3` (Task 1: feat — phase17-smoke.cjs scaffold) — FOUND in `git log`
- `c374f1a` (Task 2: chore — npm script + gitignore wiring) — FOUND in `git log`

---
*Phase: 17-catalog-wave-c-exterior-arom-ticas-frutales*
*Completed: 2026-05-08*
