---
phase: 24-documentation
plan: 02
subsystem: docs
tags: [project-md, key-decisions, handoff, recommendation-first, deep-merge-guard, gam-05-lock, journal-fs, bottomsheet-provider, modal-section-id, three-tier-smoke, option-b]

# Dependency graph
requires:
  - phase: 24-documentation
    provides: Plan 24-01 CLAUDE.md handoff extensions (DOCS-01 — journal photo storage + unknownPlantTracker + lint:voseo + smoke-phase18..23 chain + three-tier discipline)
  - phase: 14-educational-detail-modal
    provides: PROTECTED_USER_FIELDS deep-merge guard (EDU-06) + recommendation-first 4-section MyPlantDetailModal pivot
  - phase: 20-fertilization-subsystem
    provides: PROTECTED_USER_FIELDS extension for fertilizeSchedule (FERT-01) + ModalSectionId deliberate non-extension precedent (FERT-06 — initialExpanded orthogonal pattern)
  - phase: 21-plant-journal
    provides: Journal photo FileSystem storage lock (JOURNAL-02 — documentDirectory + Paths API; never base64) + ModalSectionId 'diario' extension (JOURNAL-04)
  - phase: 22-gamification-toasts-haptics
    provides: GAM-05 anti-pattern lock (derived-only mood emoji + STRICT smoke negative-grep against streak tokens)
  - phase: 13-mobile-ux-modernization
    provides: Single App-root BottomSheetModalProvider wrap above Features.AUTH branch (INFRA-02 — two-AppContent-paths discipline)
  - phase: 19-pet-toxicity
    provides: ModalSectionId 'mascotas' extension precedent (TOX-04 — initialSection + ScrollView scrollTo-section)
  - phase: 23-polish-uat-brand-voice
    provides: Three-tier smoke runner discipline + STRICT cross-phase regression sentinels final state (smoke-phase23.cjs as latest cross-phase fork)
provides:
  - Authoritative PROJECT.md Key Decisions table extended with 7 v1.2 architectural decisions surfacing the locked patterns future Claude sessions must honor
  - Footer "Last updated" date refresh to 2026-05-12 with v1.2 closure note
  - Phase 24 docs closure (both DOCS-01 and DOCS-02 complete) — v1.2 milestone fully landed at code+docs level
affects: [v1.2-milestone-close — only manual ops backlog remains before App Store / Play Store submit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Surgical Edit-tool insertion against verbatim anchors (2 targeted edits; append-only table extension + single-line footer swap; no row reorderings, no paragraph reflows)"
    - "Documentation phase closes at file-content sentinel level (no device-test gate; no source code touched; zero tsc/i18n/voseo surface)"

key-files:
  created:
    - ".planning/phases/24-documentation/24-02-SUMMARY.md"
  modified:
    - ".planning/PROJECT.md (+8 lines / -1 line net; 2 surgical additions: append 7 new Key Decisions rows + footer date refresh)"

key-decisions:
  - "Two surgical edits via Edit tool with verbatim anchors — Edit 1 appends 7 new rows immediately before the closing horizontal rule (preserving pre-existing Phase 10 Perenual row + closing `---`); Edit 2 swaps the single footer 'Last updated' line in-place"
  - "Append-only table strategy preserved all 18 pre-existing decision rows verbatim — no row reorderings, no row deletions, no in-row text modifications; structure invariants (## Key Decisions header, table header, table separator) all unchanged at exactly 1 occurrence each"
  - "All 7 new rows surface decisions the v1.2 milestone LOCKED architecturally (not just shipped) — each row's Outcome column is '✓ Good (v1.2 Phase N)' or '✓ Good (v1.2 Phase N + Phase M)' for cross-phase extensions"

patterns-established:
  - "PROJECT.md Key Decisions table is the canonical 'what's locked and why' surface for future Claude sessions — extensions are surgical append-only with verbatim anchors"
  - "Documentation phase final-plan pattern: SUMMARY references both DOCS-01 (Plan 24-01) and DOCS-02 (Plan 24-02) as joint Phase 24 closure"
  - "Cross-phase verification (tsc + i18n + voseo + smoke-phase{18..23}) runs even when zero source code is touched — confirms doc-only edits did not accidentally collateral-damage source files"

requirements-completed: [DOCS-02]

# Metrics
duration: 1 min
completed: 2026-05-12
---

# Phase 24 Plan 02: PROJECT.md DOCS-02 Key Decisions Table Extension Summary

**PROJECT.md Key Decisions table extended with 7 v1.2 architectural decisions (recommendation-first pivot / deep-merge guard PROTECTED_USER_FIELDS / derived-only streaks GAM-05 anti-pattern lock / journal photos in FileSystem documentDirectory / single App-root BottomSheetModalProvider wrap / ModalSectionId controlled extension precedent / three-tier smoke runner discipline + Option B end-of-milestone device-test deferral) + footer date bumped 2026-05-02 → 2026-05-12; 2 surgical Edit-tool inserts, +8/-1 lines on `.planning/PROJECT.md` only, 24 grep sentinels PASS, cross-phase Phase 18-23 smoke chain remains 6/6 GREEN**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-12T05:32:53Z
- **Completed:** 2026-05-12T05:34:17Z
- **Tasks:** 1
- **Files modified:** 1 (`.planning/PROJECT.md` only)

## Accomplishments

- **Edit 1 (Key Decisions table extension)** — Appended 7 new decision rows immediately before the closing horizontal rule, preserving the pre-existing Phase 10 Perenual server-side row verbatim. Rows added (in append order):
  1. **Recommendation-first pivot** — anchors the entire v1.2 milestone direction; 4-section MyPlantDetailModal (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes); 5 EDU catalog fields; identification picker pre-selects species recommendation. Outcome: ✓ Good (v1.2 Phase 14).
  2. **Deep-merge guard PROTECTED_USER_FIELDS** — CRIT-1 pitfall lock; Phase 14 EDU-06 introduced the tuple guard; Phase 20 Plan 01 extended to `Plant.fertilizeSchedule` (FERT-01). Future-Claude instruction: any new user-editable `Plant` field MUST be added to PROTECTED_USER_FIELDS at the same time. Outcome: ✓ Good (v1.2 Phase 14 + Phase 20).
  3. **GAM-05 anti-pattern lock (derived-only mood emoji)** — Blossom cautionary tale; STRICT smoke negative-grep in `smoke-phase22.cjs` against `samplePlants/mockPlants/seedPlants/streakCount/CARE_STREAKS` tokens with `gam_anti_patterns.md` whitelist; persistent streaks deferred to v2 STREAK-01/02 opt-in. Outcome: ✓ Good (v1.2 Phase 18 + Phase 22).
  4. **Journal photos in FileSystem `documentDirectory`** — modern Paths/File/Directory API; AsyncStorage ~6 MB ceiling rationale; `journalService.ts` `<documentDirectory>/journals/<plantId>/<entryId>.jpg` (1080px @ 0.7 JPEG); `deletePlant` orphan cleanup via `deleteJournalDirectory`; STRICT negative-grep against `data:image/.*;base64`. Outcome: ✓ Good (v1.2 Phase 21).
  5. **Single App-root BottomSheetModalProvider wrap** — Phase 13 INFRA-02 lock; above-`Features.AUTH`-branch placement covers both AppContent paths via React context; avoids double-wrapping AND per-branch wrapping drift; same two-AppContent-paths discipline as V1.1 AuthProvider skip pattern; PaywallModal Z-order verified in Phase 13 Plan 03 manual gate. Outcome: ✓ Good (v1.2 Phase 13).
  6. **ModalSectionId controlled extension precedent** — Phase 19 TOX-04 added `'mascotas'`; Phase 21 JOURNAL-04 added `'diario'`; Phase 20 FERT-06 deliberately did NOT extend (uses orthogonal `initialExpanded` prop). Future-Claude rule: extend ModalSectionId ONLY for scroll-to-section navigation entry-points; use `initialExpanded` for in-section expansion. Outcome: ✓ Good (v1.2 Phase 19 + Phase 21).
  7. **Three-tier smoke runner discipline + Option B end-of-milestone device-test deferral** — Three-tier pattern (W0 STRICT scaffold / SKIP→PASS placeholders / cross-phase STRICT regression forked verbatim); each `smoke-phase<N>.cjs` ships in Wave 0 and is NOT modified after; `smoke-phase23.cjs` is sufficient pre-submit cover for Phase 18-22 invariants; Option B deferral pattern has 5 consecutive precedents (Phase 18-05 / 20-10 / 21-06 / 22-03 / 23-04) with Phase 19-07 the ONE Option A outlier. Full manual device-test batch + 69-entry image-upload backlog run end-of-milestone. Outcome: ✓ Good (v1.2 Phase 19-23).
- **Edit 2 (Footer date refresh)** — Replaced `*Last updated: 2026-05-02 ...*` with `*Last updated: 2026-05-12 after v1.2 Recommendation-First Plant Guide milestone Phase 24 docs closure — Key Decisions table extended with 7 v1.2 architectural decisions ... Previous: 2026-05-02 v1.2 milestone defined. v1.1 Precision Care shipped (39 plans / 6 phases).*` — preserves historical detail chain (v1.2 milestone defined 2026-05-02 + v1.1 shipped 39 plans / 6 phases) while bumping the active date.
- **Post-edit verification — 24 grep sentinels PASS:**
  - 8 new-row sentinels (Recommendation-first pivot / PROTECTED_USER_FIELDS / GAM-05 anti-pattern lock / documentDirectory / BottomSheetModalProvider / ModalSectionId controlled extension / Three-tier smoke runner discipline / Option B) — all ≥1.
  - 2 footer date sentinels (`Last updated: 2026-05-12` = 1; `Last updated: 2026-05-02` = 0).
  - 14 pre-existing row sentinels (camera-in-chat, AI-decides, AI-suggests-resolution, problem-timeline, push+Hoy, Extend-SavedDiagnosis, NotificationContext, severity-labels, three-zone-seasonality, versioned-envelope, mode-as-dispatcher, getEffectiveSeason, lookup-by-id, App-level-PaywallModal, single-compile-path-smoke, edge-function-dual-payload, defer-manual-ops, v1.2-Phase-10) — all preserved at HEAD's pre-edit counts (1 or 2; the 2-counts are due to pre-existing prose-overlap with the Validated Requirements block at file top, unchanged by this plan).
  - 3 structure-preservation sentinels (`^## Key Decisions` = 1, table header `^| Decision | Rationale | Outcome |` = 1, table separator `^|----------|-----------|---------|` = 1).
- **Cross-phase verification (zero source code touched, but still run for collateral-damage check):**
  - `npx tsc --noEmit` exit 0
  - `npm run check:i18n-keys` PASS 118 catalog ids
  - `npm run lint:voseo` PASS
  - `node scripts/smoke-phase18.cjs` PASS=56 FAIL=0 SKIP=0
  - `node scripts/smoke-phase19.cjs` PASS=85 FAIL=0 SKIP=0
  - `node scripts/smoke-phase20.cjs` PASS=49 FAIL=0 SKIP=0
  - `node scripts/smoke-phase21.cjs` PASS=76 FAIL=0 SKIP=0
  - `node scripts/smoke-phase22.cjs` PASS=56 FAIL=0 SKIP=0
  - `node scripts/smoke-phase23.cjs` PASS=49 FAIL=0 SKIP=0
  - **Cumulative smoke chain: 6/6 GREEN, PASS=371, FAIL=0, SKIP=0**

## Task Commits

1. **Task 1: DOCS-02 surgical PROJECT.md Key Decisions table extension (append 7 rows + bump footer)** — `bc98ca0` (docs)

**Plan metadata commit:** (this commit; SUMMARY + STATE + ROADMAP follow)

## Files Created/Modified

- `.planning/PROJECT.md` — 2 surgical insertions: append 7 new Key Decisions rows (+7 lines) and replace 1 footer line (+1/-1 net). Diff: +8 / -1 lines. Structure unchanged: top-level sections (`## What This Is` / `## Core Value` / `## Requirements` / `## Context` / `## Constraints` / `## Key Decisions`) all preserved; table header + separator preserved; all 12 pre-Phase-24 decision rows (Camera-in-chat through Defer-manual-ops + Phase 10 Perenual) preserved verbatim.
- `.planning/phases/24-documentation/24-02-SUMMARY.md` — this file.

## Decisions Made

- **Append-only edit strategy with verbatim anchors** — Edit 1 used the last existing row (Phase 10 Perenual server-side) + closing horizontal rule as the verbatim anchor, replaced with `<original 7-row content> + <7 new rows> + ---` so the closing rule is preserved at the same structural position. Edit 2 swapped the single footer line in-place. No `replace_all` flag used; both anchors confirmed unique pre-edit.
- **All 7 new rows phrased as architectural LOCKS, not feature shipments** — Each Decision column states the locked pattern; each Rationale column explains the design reason + cross-phase ownership (e.g., "Phase 14 EDU-06 + Phase 20 Plan 01" for the deep-merge guard); each Outcome column resolves to `✓ Good (v1.2 Phase N)` or `✓ Good (v1.2 Phase N + Phase M)` for multi-phase extensions. This phrasing matches the existing table's voice (vs. shipped-feature checkboxes which live in `## Requirements` ## Validated).
- **Document Option B deferral pattern as the 7th decision** — even though Option B is a meta-discipline (not a code/architecture lock per se), it is captured as a decision because it represents the LOCKED v1.2 workflow precedent (5 consecutive precedents + 1 Phase 19-07 outlier). A future Claude session reading this row immediately understands the milestone-end ops batching pattern without re-deriving it from STATE.md history.
- **Footer date includes the 7-decision enumeration inline** — Rather than just bumping the date, the new footer summarizes which 7 decisions were added in this revision. This provides an at-a-glance change-summary for readers who diff PROJECT.md across milestones.

## Deviations from Plan

None - plan executed exactly as written. Two surgical edits applied via Edit tool with verbatim anchors; both succeeded on first attempt. All sentinel grep counts match plan expectations (or exceed expectations due to documented prose-overlap with the Validated Requirements block at file top — pre-existing duplicates unchanged by this plan, confirmed by `git show HEAD:.planning/PROJECT.md | grep -c`).

## Issues Encountered

None.

## User Setup Required

None - documentation-only changes. No external service configuration, no environment variables, no dashboard changes, no migrations, no manual ops.

## Phase 24 Closure (joint Plan 24-01 + Plan 24-02)

Phase 24 ships ZERO source code (per phase context: "pure documentation infrastructure phase — no runtime behavior change"). Both DOCS-01 and DOCS-02 land cleanly:

- **DOCS-01 (Plan 24-01)** — `CLAUDE.md` extended with 4 surgical additions (Commands block / Architecture §Key Patterns +2 bullets / Architecture §Services Layer +2 bullets / Pre-submit Checks block + paragraph). Commit `65b6edc`. +18/-3 lines.
- **DOCS-02 (Plan 24-02)** — `.planning/PROJECT.md` Key Decisions table extended with 7 v1.2 architectural decision rows + footer date refresh. Commit `bc98ca0`. +8/-1 lines.

**Phase 24 cumulative diff:** +26 / -4 lines across 2 doc files; 0 source code files touched.

**v1.2 milestone status at code+docs level:** FULLY LANDED. All 15 phases (Phase 10 → Phase 24) complete on disk per ROADMAP.md. Only manual ops backlog remains before v1.2 App Store / Play Store submit:
- Device-test backlog (per `v1_2_test_backlog.md` memory — full E2E sweep on iOS + Android)
- 69-entry image-upload backlog to Supabase Storage `plant-images/catalog/<id>.jpg` (15 v1.1 LATAM + 23 Phase 15 Wave A + 17 Phase 16 Wave B + 14 Phase 17 Wave C)
- Perenual API key rotation before public ship (deferred during Phase 10 SEC-01 for trusted-test-build context — 5 trusted testers only)

## Next Phase Readiness

- **No next phase** — Phase 24 is the final phase of v1.2. ROADMAP.md will mark Phase 24 as Complete (2/2 plans) and the milestone status moves to verifying/ready-for-submit pending the manual ops backlog above.
- **Cross-phase Phase 18-23 smoke chain remains 6/6 GREEN** — `tsc`/`check:i18n-keys`/`lint:voseo` ALL PASS.
- **No blockers, no follow-up plans needed.**

---
*Phase: 24-documentation*
*Completed: 2026-05-12*

## Self-Check: PASSED

- `.planning/PROJECT.md` — file exists; commit `bc98ca0` verified in git log
- `.planning/phases/24-documentation/24-02-SUMMARY.md` — file exists on disk
- All 24 grep sentinels green (8 new-row content + 2 footer date + 14 pre-existing row preservation + 3 structure-preservation invariants)
- Cross-phase verification: `tsc` exit 0 / `check:i18n-keys` PASS 118 ids / `lint:voseo` PASS / all 6 smoke-phase{18..23}.cjs runners PASS (PASS=371 FAIL=0 SKIP=0)
