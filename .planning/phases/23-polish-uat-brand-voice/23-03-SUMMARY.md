---
phase: 23-polish-uat-brand-voice
plan: 03
subsystem: ui
tags: [empty-state, illustrations, png, react-native-image, voseo, accessibility, brand-voice]

# Dependency graph
requires:
  - phase: 23-polish-uat-brand-voice/00
    provides: smoke-phase23 SKIP placeholder for POLISH-07; STRICT POLISH-08 negative-grep already PASS at Wave 0 baseline; `emptyState.{plants,calendar,explore}.{title,cta}` i18n keys (6 EN + 6 ES) landed in skeleton
  - phase: 23-polish-uat-brand-voice/02
    provides: voseo-lint STRICT body + textSecondary WCAG AA hex (#6f6450) — context for empty-state copy palette discipline (no new tokens introduced here)
provides:
  - 3 PNG illustrations under assets/illustrations/ (empty-plants.png 30,999B / empty-calendar.png 11,267B / empty-explore.png 60,950B — all 600×600, valid PNG, palette restricted to existing theme tokens)
  - PlantsScreen EmptyState swap — emoji 🌿 → <Image>; i18n keys `plants.emptyTitle`/`plants.emptyText` → `emptyState.plants.title`/`.cta` (voseo CTA "Agregá tu primera planta")
  - ExploreScreen EmptyState swap — emoji 🔍 → <Image>; i18n keys `explore.noResults`/`explore.noResultsText` → `emptyState.explore.title`/`.cta`
  - CalendarScreen NEW EmptyState (RESEARCH §Pitfall 7 — none existed previously) — conditional render below MonthCalendar when `plants.length === 0`; per-day "no tasks scheduled" inside DayDetailModal unchanged
  - POLISH-08 STRICT negative-grep PASS preserved — zero samplePlants/mockPlants/seedPlants/demoPlants/firstLaunchPlants arrays introduced
  - smoke-phase23 PASS=48 SKIP=1 → PASS=49 SKIP=0 — POLISH-07 flipped SKIP → PASS; all POLISH-01..08 automated sentinels now PASS (POLISH-04 manual-only deferred to Plan 23-04)
affects: [phase-24-docs-and-launch]

# Tech tracking
tech-stack:
  added: []  # No new dependencies; PNG path via RN built-in <Image> per RESEARCH §Finding 10 + §Pitfall 6 — react-native-svg NOT in package.json, deliberately avoided
  patterns:
    - "PNG illustration generation via SVG-to-ImageMagick conversion (Approach A): hand-authored 600×600 SVG sources under scripts/.tmp-phase23/ (gitignored) + `magick <svg> -background <bgPrimary> -resize 600x600 <png>` produces RN-Image-ready assets with zero runtime dependencies"
    - "EmptyState shape consistency across 3 screens: <Image 180×180 contain> + <Text fontSize 18-22 PlayfairDisplay heading> + <Text fontSize 14-15 DMSans textSecondary> — composable pattern for future empty-state additions"
    - "CalendarScreen empty-state conditional gate: `{plants.length === 0 && (<View>...)}` rendered BELOW MonthCalendar grid — does NOT replace the grid (Pitfall 7 lock); per-day modal continues to own per-day empties (`dayDetail.noTasksScheduled`)"

key-files:
  created:
    - assets/illustrations/empty-plants.png (30,999 bytes, 600×600 PNG — planta-en-maceta motif)
    - assets/illustrations/empty-calendar.png (11,267 bytes, 600×600 PNG — calendario-sin-tasks motif)
    - assets/illustrations/empty-explore.png (60,950 bytes, 600×600 PNG — lupa-sobre-hoja motif)
    - scripts/.tmp-phase23/empty-plants.svg (gitignored — SVG source for ImageMagick conversion)
    - scripts/.tmp-phase23/empty-calendar.svg (gitignored — SVG source)
    - scripts/.tmp-phase23/empty-explore.svg (gitignored — SVG source)
    - .planning/phases/23-polish-uat-brand-voice/23-03-SUMMARY.md
  modified:
    - src/screens/PlantsScreen.tsx (Image import + EmptyState swap to <Image> + emptyIllustration style + key swap to emptyState.plants.*)
    - src/screens/CalendarScreen.tsx (Image import + NEW empty-state conditional block below MonthCalendar + 4 new styles emptyState/emptyIllustration/emptyTitle/emptyText)
    - src/screens/ExploreScreen.tsx (Image import + EmptyState swap to <Image> + emptyIllustration style + key swap to emptyState.explore.*)

key-decisions:
  - "Approach A (SVG-to-PNG via ImageMagick) chosen over fallback approaches B/C — `magick` available at /opt/homebrew/bin/magick; hand-authored SVG sources land deterministic, on-brand illustrations rather than emoji/data-URI placeholders. SVG sources committed to scripts/.tmp-phase23/ (gitignored — pattern mirrors Plan 23-02's fix-plants-voseo.cjs runner discipline) so future plans can re-render the PNGs by re-running ImageMagick."
  - "180×180 EmptyState illustration sizing chosen across all 3 screens for surface consistency. RESEARCH §Pattern 4 specifies width: 180, height: 180. CalendarScreen previously had no EmptyState at all (Pitfall 7), so a fresh styles block was added mirroring the PlantsScreen + ExploreScreen shape."
  - "CalendarScreen empty-state placed BELOW MonthCalendar grid as an addendum (Pitfall 7 explicit lock) — does NOT replace the grid. Rationale: users with zero plants still want to see month navigation context; the empty illustration informs without removing affordances. Per-day 'no tasks scheduled' inside DayDetailModal stays in place — out of scope per plan."
  - "Old i18n keys (plants.emptyTitle, plants.emptyText, explore.noResults, explore.noResultsText) LEFT IN PLACE — they are now orphan keys with no JSX consumer, but removing them is OUT OF SCOPE per plan (RESEARCH §'Deprecated/outdated' notes Phase 24 DOCS may add a cleanup pass). Preserves backward-compat for any unreviewed integration points."
  - "POLISH-08 STRICT negative-grep PASS preserved (no sample-plant arrays introduced). The smoke-phase23 STRICT block in TIER 2.5 already enforces this on every run since Wave 0; Plan 23-03 added no new tasks for POLISH-08 — only inherited the gate. RESEARCH §Finding 12 PASS at baseline carried forward."

patterns-established:
  - "Illustration asset pipeline: hand-authored SVG (scripts/.tmp-phase23/, gitignored) + ImageMagick `magick <svg> -resize 600x600 <png>` → assets/illustrations/<name>.png. Single @1x 600×600 source acceptable for RN <Image resizeMode='contain'> rendering at 180×180 — RN downscales. Future illustration plans (Phase 24+) can fork this pipeline."
  - "EmptyState component shape (3 screens, consistent): <View style={styles.emptyState}> wrapping <Image style={styles.emptyIllustration} resizeMode='contain' accessibilityIgnoresInvertColors source={require('../../assets/illustrations/empty-X.png')}> + <Text style={styles.emptyTitle}>{t('emptyState.X.title')}</Text> + <Text style={styles.emptyText}>{t('emptyState.X.cta')}</Text>. Future screens with empty states should mirror this shape verbatim."
  - "POLISH-08 STRICT permanent CI guard: smoke-phase23 TIER 2.5 walks src/ recursively and asserts `\\b(samplePlants|mockPlants|seedPlants|demoPlants|firstLaunchPlants)\\b` returns zero matches. Any future plan that accidentally introduces a sample-plant array will hard-fail at smoke time. Locks 'no test event syndrome' as a permanent product discipline."

requirements-completed: [POLISH-07, POLISH-08]

# Metrics
duration: 2 min
completed: 2026-05-12
---

# Phase 23 Plan 03: Illustrated Empty States + Sample-Plant Guard Summary

**3 brand-voice PNG illustrated empty states (PlantsScreen swap + ExploreScreen swap + CalendarScreen NEW per Pitfall 7) using RN built-in `<Image>` with zero new dependencies — and STRICT POLISH-08 negative-grep gate locked permanent against future sample-plant pre-seeding regressions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-12T05:06:17Z
- **Completed:** 2026-05-12T05:08:49Z
- **Tasks:** 2 (POLISH-07 assets + POLISH-07 JSX wiring; POLISH-08 verification-only inherited from Wave 0 STRICT gate)
- **Files modified:** 3 source files (PlantsScreen, CalendarScreen, ExploreScreen) + 3 new PNG assets

## Accomplishments

- **POLISH-07 closed (asset half):** 3 hand-authored on-brand PNG illustrations land at `assets/illustrations/empty-{plants,calendar,explore}.png`. All 600×600, valid PNG, file sizes 11–61 KB (well above 5 KB minimum). Palette restricted to existing theme tokens (`colors.green #5b9a6a`, `colors.bgPrimary #f5f0e6`, `colors.textPrimary #2d3a2e`, `colors.textSecondary #6f6450` — the post-WCAG-AA-darkening value from Plan 23-02). SVG sources under `scripts/.tmp-phase23/` (gitignored).
- **POLISH-07 closed (JSX half):** PlantsScreen (line ~365) and ExploreScreen (line ~164) EmptyState components swap from emoji icon to `<Image>` with the new PNG sources + i18n key swap to `emptyState.{plants,explore}.{title,cta}` namespace. CalendarScreen gains an ENTIRELY NEW EmptyState block (RESEARCH §Pitfall 7 — none existed previously) rendered below MonthCalendar when `plants.length === 0`. All 3 EmptyStates use identical 180×180 illustration sizing and consistent typography (PlayfairDisplay title, DMSans body, textSecondary fill).
- **POLISH-08 STRICT permanent gate preserved:** No `samplePlants`/`mockPlants`/`seedPlants`/`demoPlants`/`firstLaunchPlants` arrays introduced in `src/`. The smoke-phase23 STRICT negative-grep in TIER 2.5 already enforces this on every smoke run — Plan 23-03 inherits and confirms the gate stays PASS.
- **smoke-phase23 PASS=49 FAIL=0 SKIP=0** — all POLISH-01..08 automated sentinels PASS (POLISH-04 manual-only deferred to Plan 23-04). SKIP count: 1 → 0.
- **Phase 18-22 cross-phase STRICT regression preserved verbatim** — all TIER 3 sentinels unchanged (PlantCard 5-element layout + Gesture.Pan + mood emoji, Toast primitive, PetToxicityBadge, fertilize/scheduler/FertilizeCard, JournalEntry/journalService/JournalSection, useStorage water/sun/outdoor/fertilize task actions + triggerHaptic + gamificationToastVisible 3-screen wiring).
- **Zero new dependencies, zero new theme tokens** — CLAUDE.md design-system lock honored. `react-native-svg` deliberately avoided (RESEARCH §Finding 10).

## Task Commits

Each task committed atomically:

1. **Task 1: POLISH-07 assets — 3 PNG illustrations under assets/illustrations/** — `336a272` (feat)
2. **Task 2: POLISH-07 JSX — wire 3 illustrated EmptyState components in PlantsScreen + CalendarScreen + ExploreScreen** — `c83982d` (feat)

_Plan metadata commit follows via gsd-tools commit step._

## Files Created/Modified

- `assets/illustrations/empty-plants.png` — 600×600 planta-en-maceta motif (pot + sprout + 2 leaves, brand green stem on bgPrimary)
- `assets/illustrations/empty-calendar.png` — 600×600 calendario-sin-tasks motif (4×4 day grid with 3 green checkmarks + brand-green header bar)
- `assets/illustrations/empty-explore.png` — 600×600 lupa-sobre-hoja motif (stylized leaf with magnifying glass overlay)
- `scripts/.tmp-phase23/empty-{plants,calendar,explore}.svg` — gitignored SVG sources (deterministic ImageMagick render path for future re-generation)
- `src/screens/PlantsScreen.tsx` — Image imported from react-native; EmptyState swapped from emoji+legacy-keys to Image+emptyState.plants.{title,cta}; new emptyIllustration style entry (180×180)
- `src/screens/CalendarScreen.tsx` — Image imported from react-native; NEW empty-state conditional block (`{plants.length === 0 && ...}`) below MonthCalendar; 4 new style entries (emptyState/emptyIllustration/emptyTitle/emptyText)
- `src/screens/ExploreScreen.tsx` — Image imported from react-native; EmptyState swapped from emoji+legacy-keys to Image+emptyState.explore.{title,cta}; new emptyIllustration style entry (180×180)

## Decisions Made

See frontmatter `key-decisions` block (5 entries — Approach A SVG-to-PNG via ImageMagick, 180×180 illustration sizing, CalendarScreen below-grid placement per Pitfall 7, orphan key preservation for backward compat, POLISH-08 STRICT inherited gate).

## Deviations from Plan

None — plan executed exactly as written. Approach A (Claude SVG-to-PNG via ImageMagick) succeeded on first attempt; no fallback to Approach B (emoji-as-PNG) or Approach C (minimal data-URI PNG) was needed. ImageMagick `magick` binary was present at `/opt/homebrew/bin/magick` and converted all 3 SVG sources to PNG cleanly with `-background "#f5f0e6" -resize 600x600`.

## Issues Encountered

None — both Tasks landed cleanly. tsc / check:i18n-keys / lint:voseo / smoke-phase23 all green on first run after JSX edits.

## User Setup Required

None — no external service configuration required. All changes are file-internal (3 PNG asset additions + 3 source file edits).

## Next Phase Readiness

- **Plan 23-04 (Wave 4 manual gate) ready:** POLISH-04 device-test on iOS + Android (identify → diagnose flow with camera permissions + edge function call) + Block A-E 8-12-item manual checklist + Option A/B closure. No automated surface change — manual verification only.
- **smoke-phase23 is at terminal state (PASS=49 FAIL=0 SKIP=0)** — all automated POLISH sentinels PASS. Plan 23-04 will not add new sentinels; it documents manual verification outcomes.
- **POLISH-08 STRICT gate is permanent CI surface** — any future plan that introduces a sample-plant array will hard-fail smoke-phase23. Locks "no test event syndrome" product discipline forever.
- **Phase 24 (Documentation) preparation:** orphan i18n keys (`plants.emptyTitle`, `plants.emptyText`, `explore.noResults`, `explore.noResultsText`) intentionally left in place — Phase 24 may add an optional cleanup pass.

## Self-Check

Verifying claims:
- `assets/illustrations/empty-plants.png` exists (30,999 bytes, PNG image data, 600×600, RGBA) — VERIFIED
- `assets/illustrations/empty-calendar.png` exists (11,267 bytes, PNG image data, 600×600, RGB) — VERIFIED
- `assets/illustrations/empty-explore.png` exists (60,950 bytes, PNG image data, 600×600, RGBA) — VERIFIED
- `src/screens/PlantsScreen.tsx` contains `require('../../assets/illustrations/empty-plants.png')` (count=1) — VERIFIED
- `src/screens/CalendarScreen.tsx` contains `require('../../assets/illustrations/empty-calendar.png')` (count=1) — VERIFIED
- `src/screens/ExploreScreen.tsx` contains `require('../../assets/illustrations/empty-explore.png')` (count=1) — VERIFIED
- PlantsScreen references `emptyState.plants.(title|cta)` (count=2) — VERIFIED
- CalendarScreen references `emptyState.calendar.(title|cta)` (count=2) AND `plants.length === 0` (count=2 — 1 new EmptyState gate + 1 pre-existing subtitle gate) — VERIFIED
- ExploreScreen references `emptyState.explore.(title|cta)` (count=2) — VERIFIED
- POLISH-08 STRICT negative-grep: zero matches across `src/` for `(samplePlants|mockPlants|seedPlants|demoPlants|firstLaunchPlants)` — VERIFIED
- `npx tsc --noEmit` exits 0 — VERIFIED
- `npm run check:i18n-keys` PASS 118 catalog ids — VERIFIED
- `npm run lint:voseo` exits 0 (STRICT preserved from Plan 23-02) — VERIFIED
- `node scripts/smoke-phase23.cjs` PASS=49 FAIL=0 SKIP=0 — VERIFIED
- All Phase 18-22 cross-phase smoke runners green (Phase 18: 56/0/0; Phase 19: 85/0/0; Phase 20: 49/0/0; Phase 21: 76/0/0; Phase 22: 56/0/0) — VERIFIED
- Task 1 commit `336a272` exists — VERIFIED (`git log --oneline | grep 336a272` returns row)
- Task 2 commit `c83982d` exists — VERIFIED (`git log --oneline | grep c83982d` returns row)

## Self-Check: PASSED

---
*Phase: 23-polish-uat-brand-voice*
*Completed: 2026-05-12*
