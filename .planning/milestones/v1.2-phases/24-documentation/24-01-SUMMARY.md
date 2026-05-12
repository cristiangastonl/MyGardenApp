---
phase: 24-documentation
plan: 01
subsystem: docs
tags: [claude-md, docs, handoff, pre-submit, smoke-runners, three-tier-discipline]

# Dependency graph
requires:
  - phase: 10-perenual-security
    provides: Server-side Perenual API key + pre-submit grep guard (already documented at line 233 of CLAUDE.md prior to Phase 24)
  - phase: 12-unknown-plant-tracker
    provides: unknownPlantTracker.ts service (catalog-miss logger to @unknown_plants AsyncStorage)
  - phase: 21-plant-journal
    provides: journalService.ts (documentDirectory + Paths API + per-plant subdirectory + deleteJournalDirectory orphan cleanup)
  - phase: 23-polish-uat-fixes-brand-voice
    provides: npm run lint:voseo (POLISH-06 STRICT) + smoke-phase23.cjs (STRICT cross-phase regression fork of Phase 18-22 sentinels)
provides:
  - Authoritative CLAUDE.md handoff context for future Claude sessions covering v1.2 architecture (journal storage / unknown-plant tracker / pre-submit chain / three-tier discipline)
  - Pre-submit Checks section extended from 2 commands (check:i18n-keys + check:images) to 9 commands (adds lint:voseo + smoke-phase{18..23}.cjs chain)
  - Commands block at file top extended with lint:voseo + smoke-phase23.cjs reference
  - Architecture §Key Patterns extended with 2 new bullets (Journal photo storage + Three-tier smoke runner discipline)
  - Services Layer extended with 2 new bullets (unknownPlantTracker.ts + journalService.ts)
affects: [24-02-PLAN — PROJECT.md Key Decisions table extension; v1.2-milestone-close — pre-submit chain authoritative]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Surgical Edit-tool insertion against verbatim anchors (4 targeted edits; no full-section rewrites; no paragraph reflows)"
    - "Documentation phase closes at file-content sentinel level (no device-test gate; no source code touched)"

key-files:
  created: []
  modified:
    - "CLAUDE.md (+18 lines / -3 lines net; 4 surgical additions: Commands block / Key Patterns / Services Layer / Pre-submit Checks)"

key-decisions:
  - "Skip Edit 4 (Security section) — paragraph already states 'has been rotated as of v1.2'; plan explicitly designates Edit 4 as verification-only when text is current (matches STATE.md confirmation that Phase 10 authored this paragraph 2026-05-03)"
  - "Add 3rd lint:voseo reference in the post-bash-block paragraph to satisfy plan's 'at least 3' expected count (Commands block + Pre-submit Checks bash block + explanatory paragraph)"
  - "Preserve all existing section structure: 6 top-level ## headers (About / Architecture / Pre-submit Checks / Security / etc.) and 2 targeted ### subheaders (Key Patterns / Services Layer) all unchanged; additions are pure append-style insertions"

patterns-established:
  - "Documentation handoff pattern: future Claude sessions read CLAUDE.md as authoritative starting context — extensions are surgical, structure-preserving"
  - "Three-tier smoke runner discipline (Phase 19+) is now first-class in CLAUDE.md, not just implicit in the script files"

requirements-completed: [DOCS-01]

# Metrics
duration: 2 min
completed: 2026-05-12
---

# Phase 24 Plan 01: CLAUDE.md DOCS-01 Surgical Extensions Summary

**CLAUDE.md extended with v1.2 architecture handoff context (journal photo storage / unknownPlantTracker service / lint:voseo + smoke-phase18..23 pre-submit chain / three-tier smoke runner discipline) — 4 surgical additions, +18/-3 lines, zero source-code edits, Phase 18-23 cross-phase smoke chain remains 6/6 GREEN**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-12T05:28:22Z
- **Completed:** 2026-05-12T05:30:07Z
- **Tasks:** 1
- **Files modified:** 1 (CLAUDE.md only)

## Accomplishments

- **Edit 1 (Architecture §Key Patterns)** — Appended 2 new bullets after "Feature-gated rendering": (a) **Journal photo storage** documenting `journalService.ts` `documentDirectory` + Paths API + per-plant subdirectory + 1080px @ 0.7 JPEG + `deleteJournalDirectory` orphan cleanup, explicit "NEVER base64 in AsyncStorage"; (b) **Three-tier smoke runner discipline (Phase 19+)** documenting the W0 scaffold / SKIP→PASS / STRICT cross-phase regression pattern with explicit Phase 18-23 invariant examples (PlantCard.moodEmoji, ModalSectionId, triggerHaptic, journals?: Record, petToxicity symptoms, fertilizer.industrial/homemade, GAM-05 streak negative-grep).
- **Edit 2 (Architecture §Services Layer)** — Appended 2 new bullets after `imageService.ts`: (a) `unknownPlantTracker.ts` (v1.2 Phase 12 — fire-and-forget catalog-miss logger to AsyncStorage `@unknown_plants` key, called from `getEnrichedPlantData()` before Perenual fallback, future v2 `TRACK-V01` Supabase migration noted); (b) `journalService.ts` (v1.2 Phase 21 — full API surface: `pickJournalPhoto` / `saveJournalPhoto` / `deleteJournalPhoto` / `deleteJournalDirectory`, `expo-image-manipulator` 1080px @ 0.7 JPEG compression, `<documentDirectory>/journals/<plantId>/<entryId>.jpg` path scheme).
- **Edit 3a (Commands block, file top)** — Extended pre-submit commands from 2 lines (check:i18n-keys + check:images) to 4 lines (adds `lint:voseo` STRICT + `node scripts/smoke-phase23.cjs` STRICT cross-phase regression fork).
- **Edit 3b (Pre-submit Checks section)** — Replaced the 2-command bash block with a 9-command block (adds `lint:voseo` + `smoke-phase18..23.cjs` chain). Added explanatory paragraph noting the chain enforces the three-tier discipline described in Architecture §Key Patterns, that `smoke-phase23.cjs` alone is sufficient for Phase 18-22 invariants (regression sentinels are forked verbatim), and that the full chain is recommended pre-submit to localize regressions to the originating phase.
- **Edit 4 (Security section)** — VERIFY-ONLY by plan design. Existing paragraph (line 233) already states "has been rotated as of v1.2" verbatim; no edit needed. Plan explicitly designates this as a skip-if-current step.
- **Post-edit verification:** All 15 grep sentinels (Edits 1-4 content + 6 structure-preservation invariants) PASS. Cross-phase verification: `npx tsc --noEmit` exit 0 / `npm run check:i18n-keys` PASS 118 catalog ids / `npm run lint:voseo` PASS / all 6 `smoke-phase{18..23}.cjs` runners PASS (FAIL=0, SKIP=0 across all six).

## Task Commits

1. **Task 1: DOCS-01 surgical CLAUDE.md extensions (4 sections)** — `65b6edc` (docs)

**Plan metadata:** (this commit; SUMMARY + STATE + ROADMAP follow)

## Files Created/Modified

- `CLAUDE.md` — 4 surgical insertions: Commands block (+2 lines), Architecture §Key Patterns (+2 bullets), Architecture §Services Layer (+2 bullets), Pre-submit Checks section (block extension + explanatory paragraph). Net diff: +18 / -3 lines. Structure unchanged: 6 top-level `##` section headers preserved verbatim, 2 targeted `###` subsection headers preserved verbatim, no paragraphs deleted, no behavioral docs altered.

## Decisions Made

- **Skip Edit 4 (Security section)** — Plan designates Edit 4 as verification-only when text is current. Baseline grep confirmed `has been rotated as of v1.2` already present at line 233 (Phase 10 SEC-01 authored this paragraph 2026-05-03 per STATE.md). No edit applied; sentinel count of 1 satisfied automatically.
- **Add 3rd `lint:voseo` reference in explanatory paragraph** — Initial post-edit sentinel count for `lint:voseo` was 2 (Commands block + Pre-submit Checks bash block); plan expected "at least 3". Resolved by prepending `lint:voseo` to the explanatory paragraph noun phrase ("The `lint:voseo` + smoke-phase{18..23}.cjs chain enforces..."). Count is now 3, matching plan's intent of three explicit surfaces (commands / bash block / paragraph reference).
- **Order edits to preserve anchor uniqueness** — Edits applied sequentially via the Edit tool with verbatim anchors. Each anchor was confirmed unique in the file before applying (no `replace_all` used). No paragraph reflows or section reorderings.

## Deviations from Plan

None - plan executed exactly as written. (Edit 4 was a planned verification-only step per the plan body; skipping the edit is the explicit "if text is already current" branch the plan documents at the end of EDIT 4.)

## Issues Encountered

None.

## User Setup Required

None - documentation-only changes. No external service configuration, no environment variables, no dashboard changes.

## Next Phase Readiness

- **Ready for Plan 24-02** (PROJECT.md Key Decisions table extension — DOCS-02 requirement). Plan 24-01 establishes the CLAUDE.md handoff context; Plan 24-02 will extend the `.planning/PROJECT.md` Key Decisions table with v1.2 decisions (recommendation-first pivot / deep-merge guard / derived-only streaks / journal photo storage / two-AppContent-paths discipline / ModalSectionId precedent / three-tier smoke runner / Option B device-test deferral pattern).
- **No blockers, no follow-up.**
- **Cross-phase Phase 18-23 smoke chain remains 6/6 GREEN** — `lint:voseo` PASS, `check:i18n-keys` PASS 118 ids, `tsc --noEmit` exit 0. Phase 24 source-code surface count remains zero (as designed — pure documentation infrastructure phase).

---
*Phase: 24-documentation*
*Completed: 2026-05-12*

## Self-Check: PASSED

- `CLAUDE.md` — modified in commit `65b6edc` (verified via `git log --oneline --all | grep 65b6edc`)
- `.planning/phases/24-documentation/24-01-SUMMARY.md` — file exists on disk
- All 15 grep sentinels green (Edit 1-4 content + structure-preservation invariants)
- Cross-phase verification: `tsc` exit 0 / `check:i18n-keys` PASS 118 ids / `lint:voseo` PASS / all 6 smoke-phase{18..23}.cjs runners PASS
