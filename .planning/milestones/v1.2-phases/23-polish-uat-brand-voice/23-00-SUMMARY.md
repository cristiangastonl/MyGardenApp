---
phase: 23-polish-uat-brand-voice
plan: 00
subsystem: testing
tags: [smoke-runner, voseo-lint, i18n, wcag, nyquist-scaffold, polish, regression-gate]

# Dependency graph
requires:
  - phase: 22-gamification-toasts-haptics
    provides: "smoke-phase22.cjs three-tier runner (PASS scaffold + SKIP placeholders + STRICT cross-phase 18-21 + STRICT negative-grep); fork source for smoke-phase23.cjs"
  - phase: 21-plant-journal
    provides: "journalToastVisible + ModalSectionId.diario + JournalSection sentinels preserved in Phase 23 cross-phase Tier 3 block"
  - phase: 20-fertilization-subsystem
    provides: "fertilize emit/scheduler/FertilizeCard sentinels preserved in Phase 23 cross-phase Tier 3 block"
  - phase: 19-pet-toxicity
    provides: "PetToxicityBadge + MascotasContent + checkScript symptoms sentinels preserved in Phase 23 cross-phase Tier 3 block"
  - phase: 18-plant-card-refresh
    provides: "PlantCard mood emoji + Gesture.Pan + Toast.tsx + PlantHealthBadge sentinels preserved in Phase 23 cross-phase Tier 3 block"
provides:
  - "scripts/smoke-phase23.cjs three-tier runner (W0 STRICT scaffold + POLISH-01/02/03/05/06/07 SKIP→PASS + STRICT POLISH-08 negative-grep + STRICT cross-phase Phase 18-22 regression)"
  - "scripts/voseo-lint.mjs skeleton (empty BANNED list + walkValues + exit 0/1/2; STRICT body deferred to Plan 23-02)"
  - "package.json smoke:phase23 + lint:voseo npm scripts (count grew 22 → 24)"
  - ".gitignore scripts/.tmp-phase23/ entry (parity with Phase 19/20/21/22)"
  - "src/i18n/locales/{en,es}/common.json emptyState.{plants,calendar,explore}.{title,cta} namespace (6 EN + 6 ES leaf keys; ES locked to CONTEXT.md voseo copy)"
  - "WCAG AA contrast helper inlined in smoke-phase23.cjs (hexToRgb + linearize + relativeLuminance + contrast ratio)"
  - "voseo-lint subprocess discrimination (stdout 'skeleton — BANNED list empty' substring → SKIP vs PASS)"
affects: [23-01-PLAN, 23-02-PLAN, 23-03-PLAN, 23-04-PLAN, future-phase-smoke-runners]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-tier smoke runner (W0 scaffold STRICT + POLISH SKIP→PASS placeholders + STRICT cross-phase preservation); forked verbatim from smoke-phase22.cjs"
    - "Voseo-lint as STRICT subprocess sentinel — stdout-flag-based SKIP discrimination so skeleton state remains green at W0 baseline yet flips to PASS automatically when Plan 23-02 lands the STRICT body and removes the flag"
    - "Inline WCAG AA contrast computation in smoke runner (no runtime cost; pure function over theme hex + bg hex tuple)"
    - "POLISH-08 negative-grep walks src/ tree for sample/mock/seed/demo/firstLaunchPlants ARRAY identifiers (mirror walkSrcForStreakTokens pattern from Phase 22 GAM-05 lock)"

key-files:
  created:
    - "scripts/smoke-phase23.cjs (344 LOC three-tier sentinel runner)"
    - "scripts/voseo-lint.mjs (skeleton — 89 LOC)"
    - ".planning/phases/23-polish-uat-brand-voice/23-00-SUMMARY.md"
  modified:
    - "package.json (+2 npm scripts after smoke:phase22)"
    - ".gitignore (+1 line scripts/.tmp-phase23/)"
    - "src/i18n/locales/en/common.json (+emptyState namespace, 6 leaf keys)"
    - "src/i18n/locales/es/common.json (+emptyState namespace, 6 leaf keys with CONTEXT.md-locked voseo copy)"

key-decisions:
  - "Voseo-lint skeleton ships at W0 with empty BANNED list — smoke discriminates skeleton state vs strict body via stdout substring 'skeleton — BANNED list empty' (auto-flips SKIP → PASS when Plan 23-02 removes the literal)"
  - "WCAG helper inlined directly in smoke-phase23.cjs (no separate utility module) — runner stays self-contained, no theme.ts coupling beyond the regex extraction of textSecondary hex"
  - "POLISH-08 STRICT at baseline (no SKIP layer) per RESEARCH §Finding 12 — zero violations expected; sentinel acts as forward-blocking regression gate against future first-launch sample-plant pre-seeding"
  - "Cross-phase Tier 3 block forked VERBATIM from smoke-phase22.cjs lines 248-286 + Phase 22-specific GAM-01/02/05 STRICT sentinels appended (Phase 22 entries promoted from SKIP-style to STRICT now that Phase 22 closed)"
  - "ES emptyState voseo copy locked at W0 per CONTEXT.md (decisions block lines 26-29): 'Tu jardín está esperando 🌱' / 'Agregá tu primera planta' / 'No hay tareas hoy ☀️' / 'Disfrutá del descanso' / 'Explorá +100 plantas para tu hogar' / 'Buscar especies' — Plan 23-03 only wires JSX consumers, no copy changes"

patterns-established:
  - "Pattern: Skeleton-with-flag voseo-lint — empty BANNED list + stdout substring discriminator allows W0 to ship a callable but no-op linter that auto-promotes to STRICT when Plan 23-02 lands the body. Inverts the usual SKIP/PASS polarity (the smoke sentinel treats stdout-flag-present as SKIP, flag-absent as PASS) so the same subprocess invocation handles both lifecycle stages without runner edits."
  - "Pattern: WCAG AA helper inline in smoke runner — keeps the validation contract self-contained (no theme-side dependency cycle when Plan 23-02 edits theme.ts; smoke runner only does regex extraction + math, never imports the module)."
  - "Pattern: POLISH-08 negative-grep walks src/ tree for ARRAY identifiers (samplePlants/mockPlants/seedPlants/demoPlants/firstLaunchPlants). Mirrors GAM-05 lock walkSrcForStreakTokens pattern. Forward-blocking gate: catches any future regression that would pre-seed plants on first launch."
  - "Pattern: Phase 22 → Phase 23 cross-phase block promotion — SKIP-tier Phase 22 GAM-* sentinels in smoke-phase22.cjs are promoted to STRICT in smoke-phase23.cjs Tier 3 (now that Phase 22 closed, the sentinels are regression-only and never expected to fail). Establishes precedent: each new phase's smoke runner upgrades the prior phase's Tier 2 sentinels to Tier 3 STRICT."

requirements-completed: []  # Plan 23-00 is W0 scaffold — POLISH-01..08 IDs remain pending until Plans 23-01/02/03/04 land. This plan ships the validation contract, not the source changes.

# Metrics
duration: 3min
completed: 2026-05-12
---

# Phase 23 Plan 00: Polish UAT + Brand Voice W0 Scaffold Summary

**Three-tier smoke-phase23 runner + voseo-lint skeleton + emptyState i18n namespace establish the validation contract for POLISH-01..08 before any source change lands.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-12T04:23:16Z
- **Completed:** 2026-05-12T04:26:30Z
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- **`scripts/smoke-phase23.cjs` (344 LOC three-tier runner)** — W0 STRICT scaffold (smoke runner exists + voseo-lint exists + npm scripts wired + .gitignore entry + 12 emptyState keys) + 6 POLISH SKIP→PASS placeholders for POLISH-01 (OUTDOOR_TYPE_IDS Set + gate) / POLISH-02 (catalog outdoor:false count ≥ 45) / POLISH-03 (resolveTypeIdForPicker or selectedPlant.category) / POLISH-05 (textSecondary ≠ #8a7e6b + WCAG AA on bgPrimary + card) / POLISH-06 (4 action button voseo+emoji literals + voseo-lint subprocess exit 0 with strict body landed) / POLISH-07 (3 illustration PNGs + 3 EmptyState JSX inserts) + STRICT POLISH-08 negative-grep (zero sample/mock/seed/demo/firstLaunch plant arrays in src/) + STRICT cross-phase Tier 3 block forked verbatim from smoke-phase22.cjs preserving Phase 18 + 19 + 20 + 21 + 22 invariants.
- **`scripts/voseo-lint.mjs` (89 LOC skeleton)** — ESM module with shebang + JSDoc header + empty BANNED placeholder + empty WHITELIST_KEYS placeholder + walkValues recursive walker + ES locale directory existence guard + JSON parse-error handling + tri-state exit codes (0 = no violations, 1 = violations, 2 = parse/missing-dir error). Stdout reports literal "voseo-lint: PASS (skeleton — BANNED list empty until Plan 23-02)" so the smoke sentinel can auto-discriminate skeleton state from strict-body state.
- **2 npm scripts wired** (`smoke:phase23` + `lint:voseo`) — package.json scripts block grew 22 → 24 entries.
- **`.gitignore` extended** with `scripts/.tmp-phase23/` (parity with Phase 19/20/21/22 ignore lines).
- **`emptyState` i18n namespace** seeded in both EN + ES common.json — 6 leaf paths each (plants.title + plants.cta + calendar.title + calendar.cta + explore.title + explore.cta); ES values locked to CONTEXT.md voseo copy with sprout/sun/explorá emoji where appropriate; JSX consumers wired in Plan 23-03.
- **W0 baseline gate established**: `npm run smoke:phase23` exits 0 (PASS=43 FAIL=0 SKIP=6); `npm run lint:voseo` exits 0; `npx tsc --noEmit` exits 0; `npm run check:i18n-keys` PASS 118 catalog ids.
- **Cross-phase preservation verified**: Phase 18 (PASS=56/0/0), Phase 19 (PASS=85/0/0), Phase 20 (PASS=49/0/0), Phase 21 (PASS=76/0/0), Phase 22 (PASS=56/0/0) all green — zero regression introduced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/smoke-phase23.cjs forked from smoke-phase22.cjs** — `fa1ec2f` (feat)
2. **Task 2: Create voseo-lint skeleton + wire 2 npm scripts + .gitignore + 6-key emptyState i18n namespace EN+ES** — `528d5e4` (feat)

**Plan metadata commit:** _pending — final docs commit closes Plan 23-00 after STATE.md + ROADMAP.md updates._

## Files Created/Modified

- `scripts/smoke-phase23.cjs` (CREATED, 344 LOC) — three-tier sentinel runner with inline WCAG AA helper, voseo-lint subprocess invocation, POLISH-08 negative-grep walker, and verbatim Phase 18-22 cross-phase Tier 3 block.
- `scripts/voseo-lint.mjs` (CREATED, 89 LOC) — ESM skeleton with empty BANNED placeholder + walkValues + exit codes; stdout flag literal `skeleton — BANNED list empty until Plan 23-02` for smoke sentinel discrimination.
- `package.json` (MODIFIED) — added `smoke:phase23` and `lint:voseo` script entries immediately after `smoke:phase22`.
- `.gitignore` (MODIFIED) — added `scripts/.tmp-phase23/` line after `scripts/.tmp-phase22/`.
- `src/i18n/locales/en/common.json` (MODIFIED) — appended `emptyState` top-level namespace with 3 sub-namespaces × 2 leaf keys (6 EN strings).
- `src/i18n/locales/es/common.json` (MODIFIED) — appended `emptyState` top-level namespace with 3 sub-namespaces × 2 leaf keys (6 ES strings, CONTEXT.md-locked voseo copy).

## Decisions Made

- **Voseo-lint skeleton ships at W0 with stdout discriminator** rather than deferring the file entirely to Plan 23-02. Rationale: Plan 23-00 owns the validation contract (smoke runner CAN spawn the linter), Plan 23-02 owns the enforcement body (BANNED list + 17-violation fix). Stdout substring `skeleton — BANNED list empty` lets the same smoke sentinel handle both lifecycle stages without runner edits in 23-02 — a key invariant per Phase 14-00 / 19-00 / 20-00 / 21-00 / 22-00 precedent.
- **WCAG helper inlined in smoke runner**, not in a shared util. Keeps validation contract self-contained; smoke runner stays read-only after Wave 0 and never imports the soon-to-be-edited theme.ts module.
- **POLISH-08 STRICT at baseline** per RESEARCH §Finding 12 — zero violations expected. Sentinel acts as a forward-blocking regression gate (catches any future first-launch sample-plant pre-seed attempts).
- **Phase 22 cross-phase block promoted from SKIP to STRICT** in smoke-phase23.cjs Tier 3 — Phase 22 GAM-01/02/05 sentinels are now regression-only (Phase 22 closed; sentinels never expected to fail). Establishes precedent: each new phase's smoke runner upgrades the prior phase's Tier 2 SKIP-tier sentinels to Tier 3 STRICT.
- **POLISH-02 catalog count ≥ 45 PASSes at baseline** — `plantDatabase.ts` already has 54 `outdoor: false` occurrences (exceeds the 28 exterior + 7 frutales + 10 outdoor-aromaticas = 45 threshold from RESEARCH §Finding 2). Plan 23-01 will confirm OUTDOOR_TYPE_IDS membership + catalog flag alignment; raw count is already there.
- **ES emptyState voseo copy locked at W0** per CONTEXT.md decisions block (lines 26-29). Plan 23-03 wires JSX consumers but introduces zero copy edits — Plan 23-00 takes the brand-voice authoring responsibility and the smoke sentinel checks the keys, not the strings.

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed in single passes; all 9 acceptance criteria per task verified by grep/node script output; all 4 plan-level verification gates green (smoke:phase23 exit 0, lint:voseo exit 0, tsc --noEmit clean, check:i18n-keys PASS 118 catalog ids); all 5 cross-phase smokes (Phase 18 + 19 + 20 + 21 + 22) preserved verbatim with zero regression.

**Total deviations:** 0
**Impact on plan:** Zero scope creep. Wave 0 Nyquist gate established exactly as the validation contract specified.

## Issues Encountered

None.

**Implementation note (not an issue):** POLISH-02 (`outdoor:false count ≥ 45`) PASSes at baseline because the existing `src/data/plantDatabase.ts` already contains 54 such entries from prior phases (Phase 8 / 14 / 15 / 16 / 17 catalog landings). Plan 23-01 will confirm the entries align with `OUTDOOR_TYPE_IDS = new Set(['exterior', 'frutales'])` membership and add any missing per-entry `outdoor: false` flags for the 10 outdoor-aromaticas where the category is `aromaticas` but the species belongs outdoors (rosemary, lavender, etc.). The raw count threshold is satisfied; alignment is the Plan 23-01 responsibility.

## User Setup Required

None — no external service configuration required. All artifacts are local source files and npm scripts.

## Next Phase Readiness

- **Plan 23-01 (Wave 1 — outdoor cluster)** ready: smoke sentinel SKIPs POLISH-01 (`OUTDOOR_TYPE_IDS` Set + gate in `plantLogic.getTasksForDay`) and POLISH-03 (PlantNet category-conflict resolution in `IdentificationResults.tsx`) at baseline; landing the code flips both to PASS. POLISH-02 is already PASSing — Plan 23-01 confirms alignment, not raw count.
- **Plan 23-02 (Wave 2 — WCAG + voseo)** ready: smoke sentinel SKIPs POLISH-05 (textSecondary darkening to pass WCAG AA on bgPrimary + card), POLISH-06 button literals (4 action button voseo + emoji strings in es/common.json), and POLISH-06 voseo-lint (skeleton state → strict body removes the `skeleton — BANNED list empty` stdout flag and adds BANNED + 17-violation fix).
- **Plan 23-03 (Wave 3 — empty states)** ready: smoke sentinel SKIPs POLISH-07 (3 illustration PNGs at `assets/illustrations/empty-{plants,calendar,explore}.png` + 3 EmptyState JSX inserts referencing those filenames). The i18n keys are already wired by Plan 23-00 — Plan 23-03 only adds JSX consumers, no key additions.
- **Plan 23-04 (Wave 4 — manual gate)** ready: POLISH-04 device-test (identify→diagnose flow on iOS + Android) is the only manual-only requirement; no automated sentinel.
- **No blockers.** Cross-phase regression gate green across Phase 18 + 19 + 20 + 21 + 22.

## Self-Check: PASSED

- `scripts/smoke-phase23.cjs` exists (344 LOC, ≥ 280 required) ✓
- `scripts/voseo-lint.mjs` exists (89 LOC, ≥ 60 required) ✓
- `package.json` contains both `smoke:phase23` and `lint:voseo` script entries ✓
- `.gitignore` contains `scripts/.tmp-phase23/` ✓
- EN + ES `common.json` both contain `emptyState.{plants,calendar,explore}.{title,cta}` (12 leaf keys total, locale parity verified via `node -e` Object.keys diff) ✓
- `npm run smoke:phase23` exits 0 with PASS=43 FAIL=0 SKIP=6 ✓
- `npm run lint:voseo` exits 0 (skeleton) ✓
- `npx tsc --noEmit` exits 0 ✓
- `npm run check:i18n-keys` PASS 118 catalog ids ✓
- Phase 18 + 19 + 20 + 21 + 22 cross-phase smokes preserved verbatim (PASS=56/85/49/76/56 all green) ✓
- Commit `fa1ec2f` (Task 1) exists in git log ✓
- Commit `528d5e4` (Task 2) exists in git log ✓

---
*Phase: 23-polish-uat-brand-voice*
*Completed: 2026-05-12*
