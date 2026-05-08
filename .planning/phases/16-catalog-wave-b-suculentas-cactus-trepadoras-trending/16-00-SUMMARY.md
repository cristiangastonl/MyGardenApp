---
phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending
plan: 00
subsystem: testing
tags: [smoke-runner, ts-transpile, plant-identification, routing-fix, gsd-nyquist-gate]

# Dependency graph
requires:
  - phase: 15-catalog-wave-a-interior-tropicals
    provides: phase15-smoke.cjs harness pattern + COMMON_NAMES_ES extension precedent
  - phase: 14-educational-detail-modal
    provides: ts.transpileModule + Module._resolveFilename intercept pattern
provides:
  - scripts/phase16-smoke.cjs Wave 0 harness with CAT-13/14/15/16 SKIP placeholders
  - findPlantInDatabase exact-match-first refactor (closes Dracaena fragrans → sansevieria latent bug)
  - npm run smoke:phase16 wired
  - 6 W0.ROUTING-FIX probes PASSing as regression sentinel (Dracaena, Heptapleurum, Pachira, Epipremnum, Philodendron)
  - Mid-band partial-landing tolerance (anyLanded/allLanded gates) for Plans 16-01/16-02 incremental commits
affects: [16-01, 16-02, 16-03, 16-04, future-catalog-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ts.transpileModule + runtime function-call routing assertions (Phase 16 NEW; phase15 was file-content only)"
    - "Module._resolveFilename intercept for stubbing i18n / AsyncStorage / supabase / migration in compiled CJS"
    - "Routing-fix sentinel = literal 'const exactMatch = PLANT_DATABASE.find' substring → SKIP→PASS flip"
    - "Dual sentinel pattern: PHASE_16_LANDED_FLAGS (catalog landing) + W3_SENTINEL_PRESENT (COMMON_NAMES_ES landing)"

key-files:
  created:
    - "scripts/phase16-smoke.cjs (396 LOC NEW — Wave 0 harness + ts-transpile routing path)"
    - "scripts/.tmp-phase16/async-storage.cjs (auto-written, gitignored)"
    - "scripts/.tmp-phase16/i18n.cjs (auto-written, gitignored)"
  modified:
    - "src/utils/plantIdentification.ts (+6/-3 — findPlantInDatabase exact-match-first refactor)"
    - "package.json (+1 line — smoke:phase16 npm script)"
    - ".gitignore (+1 line — explicit scripts/.tmp-phase16/ exclusion)"

key-decisions:
  - "ts-transpile + runtime function call (not file-content regex) for routing assertions — only way to verify exact-match-first behavior end-to-end"
  - "6 W0.ROUTING-FIX probes locked in this exact order: Pachira/Epipremnum/Heptapleurum/Philodendron/Dracaena fragrans/Dracaena trifasciata — covers regression + bug-fix + Phase 15 sentinels"
  - "potus + filodendro CAT-14 upgrade gates PASS at Wave 0 (EDU fields already added in Phase 14) — runner treats them as regression sentinels for Plan 16-02"
  - "Mid-band SKIP window for catalog count: idMatches > 87 && idMatches < 104 → undefined (mirrors Phase 15 64→87 pattern)"
  - "Routing-fix refactor lands as Task 3 (separate from runner Task 1, npm wiring Task 2) per CONTEXT.md lock — keeps each commit single-concern + makes ROUTING-FIX SKIP→PASS flip auditable"
  - "Carry-forward: Phase-15-era Sedum duplicate (sedum line 1842 vs cola-burro line 2761 both → Sedum morganianum) NOT fixed in Phase 16 per RESEARCH §Pitfall 9 — out of scope, future maintenance work"

patterns-established:
  - "Pattern 1: Wave 0 smoke runner with ts-transpile routing path for catalog phases that introduce new species-qualified scientificNames potentially colliding with genus-prefix fallback"
  - "Pattern 2: Routing assertions via dynamic require + Module._resolveFilename hijack (compiled .ts → .cjs in tmp dir, stubs for i18n/types/migration/supabase)"
  - "Pattern 3: Two-sentinel SKIP→PASS design: catalog landing flag (PHASE_16_LANDED_FLAGS regex on dbSrc) + refactor literal-substring flag (refactorLanded on idSrc) gate independent assertion families"

requirements-completed: [CAT-13, CAT-14, CAT-15, CAT-16]

# Metrics
duration: 7min
completed: 2026-05-08
---

# Phase 16 Plan 00: Wave 0 Smoke Runner + findPlantInDatabase Routing Fix Summary

**Phase 16 Wave 0 harness + ts-transpile routing path + 5-LOC findPlantInDatabase exact-match-first refactor — closes pre-existing Dracaena fragrans → sansevieria latent collision and pre-locks the Dracaena bambu-suerte/sansevieria-cilindrica entries arriving in Plan 16-02.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-08T03:30:33Z
- **Completed:** 2026-05-08T03:37:41Z
- **Tasks:** 3 (auto, no checkpoints)
- **Files modified:** 5 (3 created + 2 modified; 2 of the created files are gitignored auto-written stubs)

## Accomplishments

- `scripts/phase16-smoke.cjs` (396 LOC) created — full Wave 0 scaffold with CAT-13/14/15/16 SKIP placeholders that auto-flip to PASS as Plans 16-01/02/03/04 land.
- `findPlantInDatabase` refactored to exact-match-first (5 net-new lines + 1 modified return). Dracaena fragrans → dracaena now confirmed via runtime call (was misrouting to sansevieria pre-refactor).
- `npm run smoke:phase16` wired with full flag pass-through (`-- --identification` and `-- --routing-fix`).
- `--routing-fix` flag exercises ts.transpileModule + Module._resolveFilename intercept to load `findPlantInDatabase` and call it on 6 probes — all PASS post-refactor.
- Phase 15 smoke runner remains 81/81 default + 104/104 --identification (zero regression from routing change).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create phase16-smoke.cjs runner with full Wave 0 scaffold + ts-transpile routing path** — `e111116` (feat)
2. **Task 2: Wire smoke:phase16 npm script + .gitignore exclusion** — `a863935` (chore)
3. **Task 3: Refactor findPlantInDatabase to exact-match-first** — `b04d83f` (fix)

## Files Created/Modified

- `scripts/phase16-smoke.cjs` — 396 LOC NEW. Mirrors phase15-smoke.cjs harness; encodes 19 PHASE_16_IDS, 17 PHASE_16_NEW_IDS, 19 PHASE_16_SCIENTIFIC_NAMES; CAT-13/14/15/16 placeholders + count gate (87→104); --identification adds IDENT.CAT-16.* file-content co-occurrence checks; --routing-fix adds 6 W0.ROUTING-FIX runtime probes + 17 W2.ROUTING-FIX Phase 16 species probes (SKIPped until Wave 2 lands).
- `scripts/.tmp-phase16/async-storage.cjs` — auto-written stub, in-memory Map-backed; gitignored via `scripts/.tmp-*/` wildcard + explicit line.
- `scripts/.tmp-phase16/i18n.cjs` — auto-written i18n stub returning defaultValue or key; gitignored.
- `src/utils/plantIdentification.ts` — refactored `findPlantInDatabase` to two-pass (exact-match → genus-prefix fallback). +6/-3 lines; signature + JSDoc preserved verbatim.
- `package.json` — added `"smoke:phase16": "node scripts/phase16-smoke.cjs"` (1 line, alphabetical placement next to smoke:phase15).
- `.gitignore` — added `scripts/.tmp-phase16/` (1 line, under existing wildcard, mirrors Phase 14/15 precedent).

## Smoke Runner Wave 0 Baseline Numbers

| Invocation | PASS | SKIP | FAIL | Exit |
| ---------- | ---- | ---- | ---- | ---- |
| `node scripts/phase16-smoke.cjs` (default) | 14 | 55 | 0 | 0 |
| `node scripts/phase16-smoke.cjs --identification` | 16 | 72 | 0 | 0 |
| `node scripts/phase16-smoke.cjs --routing-fix` (post-refactor) | 20 | 72 | 0 | 0 |
| `npm run smoke:phase16` (alias check) | 14 | 55 | 0 | 0 |
| `node scripts/phase15-smoke.cjs` (regression) | 81 | 0 | 0 | 0 |
| `node scripts/phase15-smoke.cjs --identification` (regression) | 104 | 0 | 0 | 0 |

The 14 default PASSes break down as: 9 W0 scaffold + 1 GLOBAL.voseo + 2 W2.CAT-14 (potus + filodendro EDU regression sentinels — already PASSing because Phase 14-04 landed EDU fields on these entries) + 2 W2.CAT-16 keyset (potus + filodendro i18n keys already present from Phase 14).

The 6 W0.ROUTING-FIX probes flipped SKIP→PASS exactly when Task 3 lands the `const exactMatch = PLANT_DATABASE.find` substring (refactor sentinel).

## findPlantInDatabase Refactor — LOC Delta + Verification

**LOC delta:** 6 insertions, 3 deletions. Net +3 lines. `git diff` count: 11 lines (within ≤14 budget).

**Pre-refactor:**
```typescript
return PLANT_DATABASE.find(plant => {
  const dbName = plant.scientificName.toLowerCase();
  return dbName === searchName ||
         dbName.startsWith(searchName.split(' ')[0]) ||
         searchName.startsWith(dbName.split(' ')[0]);
});
```

**Post-refactor:**
```typescript
const exactMatch = PLANT_DATABASE.find(p => p.scientificName.toLowerCase() === searchName);
if (exactMatch) return exactMatch;
return PLANT_DATABASE.find(plant => {
  const dbName = plant.scientificName.toLowerCase();
  return dbName.startsWith(searchName.split(' ')[0]) ||
         searchName.startsWith(dbName.split(' ')[0]);
});
```

**Runtime-verified routing probes (all PASSing post-refactor):**

| Input scientificName | Expected id | Status |
| -------------------- | ----------- | ------ |
| Dracaena fragrans | dracaena | PASS (BUG-FIX — was sansevieria pre-refactor) |
| Dracaena trifasciata | sansevieria | PASS (unchanged exact match) |
| Heptapleurum arboricola | cheflera | PASS (Phase 15 regression sentinel) |
| Pachira aquatica | arbol-dinero | PASS (Phase 15 regression sentinel) |
| Epipremnum aureum | potus | PASS (existing v1.0 regression sentinel) |
| Philodendron hederaceum | filodendro | PASS (existing v1.0 regression sentinel) |

## Voseo Baseline

`grep -cE '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json` = **2** (post-Phase-15 baseline preserved). The `GLOBAL.voseo` assertion in the smoke runner is a PASS (not SKIP), confirming baseline holds at Wave 0.

## SKIP-Flip Sentinels for Downstream Plans

Each downstream plan flips its SKIPs to PASS by landing a single sentinel substring or value. The runner itself is NEVER edited again after Plan 00:

- **Plan 16-01 (Wave 1 — 10 cactus/suculentas):** Any of the 10 ids (`kalanchoe`, `siempreviva`, `piedras-vivas`, `nopal`, `mammillaria`, `corona-espinas`, `gasteria`, `senecio-rowleyanus`, `cactus-navidad`, `agave`) appearing as `id: "..."` in `src/data/plantDatabase.ts` triggers `anyLanded=true`. Their per-id W1.CAT-13.* gates flip individually as each lands; mid-band count gate stays SKIP until idMatches reaches 104. i18n keyset W2.CAT-16.*.keyset gates flip per-id once both en+es plants.json have a matching block.
- **Plan 16-02 (Wave 2 — 7 net-new + 2 EDU upgrades):** Last 7 net-new ids (`hoya`, `mini-monstera`, `strelitzia`, `eucalipto`, `bambu-suerte`, `sansevieria-cilindrica`, `cactus-san-pedro`) trigger `allLanded=true` → catalog count gate PASSes at idMatches===104. potus + filodendro EDU upgrade gates already PASS (Phase 14 pre-applied). All 17 W2.ROUTING-FIX.* species probes flip to PASS once both `allLanded=true` AND each species' scientificName co-occurs in their entry block (verified via runtime `findPlantInDatabase` call under `--routing-fix`).
- **Plan 16-03 (Wave 3 — COMMON_NAMES_ES extension):** Any of `Hoya kerrii | Rhaphidophora tetrasperma | Strelitzia reginae | Curio rowleyanus | Echinopsis pachanoi | Dracaena sanderiana | Dracaena angolensis | Schlumbergera × buckleyi | Eucalyptus citriodora | Agave americana` appearing in `src/utils/plantIdentification.ts` triggers `W3_SENTINEL_PRESENT=true` → all 19 W3.CAT-16.* gates flip to PASS (each id passes if its species-qualified key OR genus-only key is present in COMMON_NAMES_ES).
- **Plan 16-04 (Wave 3 — image plan documentation):** Literal `Phase 16 Wave B` substring in `CLAUDE.md` triggers W3.CAT-16.imagePlan flip; gate PASSes if ≥17 of 19 Phase 16 ids are mentioned in the same file.

**Routing-fix sentinel (already flipped in this plan):** Literal `const exactMatch = PLANT_DATABASE.find` substring in `src/utils/plantIdentification.ts` → flips all 6 W0.ROUTING-FIX.* probes from SKIP to PASS at runtime.

## Partial-Landing Midpoint Behavior

When Plan 16-01 lands its 10 ids, `idMatches` will be 97 (87+10). The count gate evaluates `idMatches > 87 && idMatches < 104 → undefined` → SKIP. The 10 W1.CAT-13.* per-id gates each PASS individually (their `present` flag is true and `anyLanded && allLanded` is false but they're checked with `if (anyLanded && !allLanded && !present) return undefined; return present;` — present=true means PASS, regardless of `allLanded`). The 9 unlanded ids (`hoya`/`mini-monstera`/`strelitzia`/`eucalipto`/`bambu-suerte`/`sansevieria-cilindrica`/`cactus-san-pedro` + the upgrade gates which always PASS) SKIP. Runner stays exit-0. This mirrors Phase 15's 12-then-11 pattern verbatim.

## Decisions Made

- **ts-transpile vs file-content regex for routing assertions:** chose ts-transpile for the `--routing-fix` flag because file-content regex cannot detect "exact match takes precedence over genus prefix" — the only way to verify is to actually call the function and inspect the returned `PlantDBEntry.id`. This is the first phase that needs runtime function-call assertions for catalog routing (Phase 14 used the same pattern but for EDU detection, not routing).
- **6 W0.ROUTING-FIX probes locked in exact order per CONTEXT.md:** Pachira aquatica → arbol-dinero / Epipremnum aureum → potus / Heptapleurum arboricola → cheflera / Philodendron hederaceum → filodendro / Dracaena fragrans → dracaena (BUG-FIX) / Dracaena trifasciata → sansevieria. Plan 00 order followed user's locked decision.
- **Refactor lands in this plan (not Plan 16-02):** keeps the routing-fix sentinel concentrated in one commit + ensures any subsequent catalog wave can rely on exact-match-first behavior. Smoke runner Task 1 + npm wiring Task 2 + refactor Task 3 split keeps each commit single-concern.

## Deviations from Plan

None — plan executed exactly as written. All Step-by-Step content from the PLAN.md was followed verbatim:
- Smoke runner Steps 1-15 implemented in order with the exact code blocks specified.
- Refactor used the verbatim Step B replacement block.
- Acceptance criteria all green on first run (no rework needed).

## Issues Encountered

None — first execution of each task hit all acceptance criteria. The auto-written stubs in `scripts/.tmp-phase16/` were correctly excluded by the existing `scripts/.tmp-*/` wildcard (verified via `git status --short scripts/.tmp-phase16/` returning empty).

## Carry-Forward

- **Phase-15-era Sedum duplicate not fixed:** `src/data/plantDatabase.ts:1842` has `id: 'sedum', scientificName: 'Sedum morganianum'` and `:2761` has `id: 'cola-burro', scientificName: 'Sedum morganianum'`. Both declare the same scientificName, so `findPlantInDatabase('Sedum morganianum')` returns whichever appears first in array order (line 1842 → `sedum`). This is a Phase-15-era latent issue out of Phase 16 scope per RESEARCH §Pitfall 9 — Phase 16 only adds Dracaena entries (not Sedum), so the collision doesn't affect this phase's deliverables. Future maintenance work: rename one of the two entries or designate canonical scientificName.
- **17 W2.ROUTING-FIX SKIPs:** until Plans 16-01/02 land all 17 net-new ids, the Phase 16 species routing probes stay SKIP under `--routing-fix`. They auto-flip to PASS once each species' entry lands.

## Next Phase Readiness

- Per-task feedback loop unblocked for Plans 16-01..04: `node scripts/phase16-smoke.cjs && npx tsc --noEmit` runs in <15s.
- All Wave 1-3 verification surfaces locked as SKIP placeholders that future waves flip without modifying the runner.
- Phase 16 ROADMAP success criteria #1 (catalog === 104) and #5 (routing fix landed) — #5 is satisfied at Wave 0; #1 is gated and will flip when Plan 16-02 lands the final 7 net-new ids.
- Plan 16-01 (Wave 1: 10 cactus/suculentas content authoring) ready to plan + execute.

---
*Phase: 16-catalog-wave-b-suculentas-cactus-trepadoras-trending*
*Completed: 2026-05-08*

## Self-Check: PASSED

All claimed artifacts and commits verified:
- FOUND: scripts/phase16-smoke.cjs
- FOUND: scripts/.tmp-phase16/async-storage.cjs (gitignored)
- FOUND: scripts/.tmp-phase16/i18n.cjs (gitignored)
- FOUND: .planning/phases/16-catalog-wave-b-suculentas-cactus-trepadoras-trending/16-00-SUMMARY.md
- FOUND commit: e111116 (Task 1)
- FOUND commit: a863935 (Task 2)
- FOUND commit: b04d83f (Task 3)
