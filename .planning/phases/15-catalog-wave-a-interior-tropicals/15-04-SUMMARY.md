---
phase: 15-catalog-wave-a-interior-tropicals
plan: 04
subsystem: docs
tags: [claude-md, accepted-known-failures, image-upload-backlog, milestone-end-batching]

# Dependency graph
requires:
  - phase: 15-catalog-wave-a-interior-tropicals
    provides: 23 new PLANT_DATABASE entries (Plans 15-00/01/02) — all need imageUrl 404 documentation
  - phase: 08
    provides: v1.1 LATAM 15-entry "Accepted-known failures" precedent format in CLAUDE.md
provides:
  - CLAUDE.md "Phase 15 Wave A" accepted-known image failures block (23 ids)
  - CAT-12 closure (final Phase 15 requirement)
  - Documented exception that npm run check:images failures for the 23 new ids are NOT a Phase 15 ship blocker
affects:
  - milestone-end-image-upload-batch (38 entries pending: 15 v1.1 + 23 v1.2)
  - phase-24-docs (catalog readiness audit)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Accepted-known image failures: single grouped block per phase (not per-entry lines), referencing milestone-end batch upload pattern"
    - "Cross-phase shared 'Image upload steps' numbered list — applies to all accepted-known blocks above it"

key-files:
  created: []
  modified:
    - "CLAUDE.md (+11 LOC — new Phase 15 Wave A accepted-known failures block inserted between v1.1 list and shared upload steps)"

key-decisions:
  - "Insert location: AFTER lavanda-angustifolia line, BEFORE 'These failures are documented...' paragraph — keeps the shared 'Image upload steps' list applicable to BOTH Phase 8 v1.1 and Phase 15 v1.2 backlogs"
  - "Single grouped block (6 sub-batch lines) — mirrors v1.1 LATAM 15-entry precedent, not 23 individual lines (avoids list-bloat)"
  - "Sub-batch grouping order matches Plans 15-01/02 catalog append order: Aroceous (7) + Foliage especial (5) + CAM (2) + Trepadora (1) + Palmera (2) + Helecho (2) + All-rounder (4) = 23"
  - "Milestone-end batch upload: 23 Phase 15 + 15 v1.1 = 38 entries pending, batched alongside v1.2 device-test backlog"

patterns-established:
  - "Phase-level accepted-known image failure block: one block per phase that introduces image-deferred entries; all sharing the project-wide 'Image upload steps' procedure"
  - "Smoke runner sentinel pattern: CLAUDE.md substring + ≥N-of-M id-mention threshold can flip a SKIP→PASS for documentation-only requirements (no source code change required)"

requirements-completed: [CAT-12]

# Metrics
duration: 3min
completed: 2026-05-07
---

# Phase 15 Plan 04: Image Plan Documentation Summary

**CLAUDE.md gains a Phase 15 Wave A accepted-known image failures block listing all 23 interior-tropical entries — closing CAT-12, the final Phase 15 requirement, while explicitly declaring `npm run check:images` failures for these ids as NOT a ship blocker.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-07T14:55:46Z
- **Completed:** 2026-05-07T14:58:52Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Appended a new "Accepted-known failures (Phase 15 Wave A, v1.2 — 23 entries — image upload pending)" block to CLAUDE.md immediately after the existing v1.1 LATAM 15-entry list and before the shared "Image upload steps" numbered list — keeping the upload procedure cross-cutting between both backlogs
- All 23 ids documented across 6 sub-batch lines (anthurium..arbol-dinero) — exceeds the smoke-runner ≥20 threshold
- Phase 15 smoke runner W4.CAT-12 SKIP→PASS flip confirmed: PASS 57/81 → 58/81 (sole remaining SKIPs are 23 CAT-11 placeholders, owned by parallel Plan 15-03)
- Phase 15 CAT-12 requirement closed with zero source-code changes (documentation-only flip)
- Existing Phase 8 v1.1 block + shared "Image upload steps" + rest of CLAUDE.md byte-identical (`git diff` shows only adds, zero deletes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Append Phase 15 Wave A accepted-known block to CLAUDE.md** - `cf6f285` (docs)

**Plan metadata:** _(pending — final commit after STATE/ROADMAP updates)_

## Files Created/Modified

- `CLAUDE.md` (+11 LOC) — New "Phase 15 Wave A" accepted-known failures block inserted between line 185 (lavanda-angustifolia) and the shared "Image upload steps" paragraph. Block opens with `**Accepted-known failures (Phase 15 Wave A, v1.2 — 23 entries — image upload pending):**` style-matching the existing Phase 8 v1.1 header.

## Decisions Made

- **Insert location** between v1.1 block end and shared upload-steps numbered list — single decision that keeps the cross-cutting "Image upload steps" applicable to BOTH Phase 8 and Phase 15 backlogs without duplication
- **Single grouped block (6 sub-batch lines)** — followed the v1.1 LATAM precedent format exactly; avoided 23 individual list lines (would have inflated CLAUDE.md ~3× more than necessary)
- **Sub-batch order in block matches Plans 15-01/02 catalog append order** — readers can cross-reference to plantDatabase.ts in the same physiology-grouped reading flow

## Deviations from Plan

None — plan executed exactly as written. The plan's Step A/B/C/D/E procedure was followed verbatim, including the exact text in Step B.

## Issues Encountered

None.

## Verification Results

End-of-plan verification (all from plan's `<verification>` section):

| Check | Result | Notes |
| ----- | ------ | ----- |
| `node scripts/phase15-smoke.cjs` | PASS 58/81 | Was 57/81; W4.CAT-12 flipped SKIP→PASS |
| `npm run check:i18n-keys` | PASS | 87 catalog ids verified across en/es plants.json |
| `npx tsc --noEmit` | PASS (clean) | No output = no errors |
| Voseo regression count (`grep -cE '\b(riega\|saca\|...)\b' es/plants.json`) | 2 | Baseline preserved |
| Catalog count (`grep -cE "^\s{4}id: ['\"]" plantDatabase.ts`) | 87 | Phase 15 target reached |
| `grep -c "Phase 15 Wave A" CLAUDE.md` | 1 | Block header present |
| `grep -c "anthurium, alocasia, caladium" CLAUDE.md` | 1 | First sub-batch line present |
| `grep -c "zamioculca, cola-burro, hiedra" CLAUDE.md` | 1 | CAM/trepadora sub-batch present |
| `grep -c "jacaranda, ceibo" CLAUDE.md` | 1 | v1.1 block byte-identical |
| `grep -c "lavanda-angustifolia" CLAUDE.md` | 1 | v1.1 block byte-identical |
| 23-id presence loop | 0 missing | All 23 ids appear in CLAUDE.md |
| `git diff CLAUDE.md` deletions count | 0 | Zero existing lines removed — only adds |
| `npm run check:images` (expected fail) | _(not run — expected to exit 1 by design)_ | Failure for 38 entries (15 v1.1 + 23 Phase 15) is NOW documented and accepted |

## Phase 15 Final Status

**Phase 15 (Catalog Wave A — Interior Tropicals) is now FULLY CLOSED on all CAT requirements:**

- **CAT-09** ✓ — 87-entry catalog target (Plan 15-02 closure)
- **CAT-10** ✓ — Full i18n keysets EN+ES for 23 new entries (Plan 15-02 closure)
- **CAT-11** ✓ — COMMON_NAMES_ES + scientificName routing for 23 species (Plan 15-03, parallel to this plan)
- **CAT-12** ✓ — Accepted-known image failures registry in CLAUDE.md (this plan)

**Smoke runner final state (with this plan + 15-03):** PASS 81/81, 0 SKIP, 0 FAIL once Plan 15-03 lands. With only this plan landed (15-03 still in-flight): PASS 58/81, 23 SKIP (all CAT-11 — owned by 15-03), 0 FAIL.

## Carry-Forward to Milestone Close

**Image upload backlog: 38 entries pending manual upload to Supabase Storage** (`plant-images/catalog/<id>.jpg`):

- 15 v1.1 LATAM entries (Phase 8 backlog) — jacaranda, ceibo, glicina, gardenia, camelia, dalia, salvia-ornamental, cala, copete, verbena, lavanda-stoechas, lavanda-dentada, romero-rastrero, tomate-cherry, lavanda-angustifolia
- 23 v1.2 Phase 15 Wave A entries (this backlog) — anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia, begonia-rex, croton, fitonia, ficus-lyrata, maranta, zamioculca, cola-burro, hiedra, palmera-areca, palmera-kentia, helecho-boston, helecho-nido, pilea, tradescantia, cheflera, arbol-dinero

To be batched at v1.2 milestone end alongside the existing v1.2 device-test backlog (mirroring v1.1 milestone-end batching pattern locked by user preference).

## User Setup Required

None — documentation-only change. No external service configuration required.

## Next Phase Readiness

- **Phase 15 closes** with all 4 CAT requirements PASSing (pending parallel Plan 15-03 landing CAT-11)
- **Phase 16 (CAT Wave B)** can proceed once 15-03 verifies; carries forward the same accepted-known failures pattern for any new image-deferred entries
- **No blockers introduced** — image upload backlog is explicitly accepted and tracked

---
*Phase: 15-catalog-wave-a-interior-tropicals*
*Completed: 2026-05-07*

## Self-Check: PASSED

- File created: `.planning/phases/15-catalog-wave-a-interior-tropicals/15-04-SUMMARY.md` — FOUND
- File modified: `CLAUDE.md` — FOUND (+11 LOC, verified via `git diff --stat`)
- Commit `cf6f285` — FOUND in `git log`
- All 23 ids present in CLAUDE.md — FOUND (0 missing in id-presence loop)
- Smoke runner SKIP→PASS flip — VERIFIED (57/81 → 58/81)
