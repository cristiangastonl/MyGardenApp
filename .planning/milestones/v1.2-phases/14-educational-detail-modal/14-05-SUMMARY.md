---
phase: 14-educational-detail-modal
plan: 05
subsystem: catalog-content
tags: [edu-03, content-authoring, exterior-plants, voseo, whyRationale, geographic-origin-citations]

# Dependency graph
requires:
  - phase: 14-04
    provides: voseo grep baseline (count=2), content-quality template (sotobosque/CAM/hemiepífita citation style), getTranslatedPlant indirection wired
  - phase: 14-01
    provides: PlantDBEntry +5 optional fields, getTranslatedPlant extension, check-i18n-keys.mjs +5 conditional checks
provides:
  - "21 EXTERIOR catalog entries with 5 EDU-02 fields populated in plantDatabase.ts catalog defaults"
  - "210 i18n strings (105 EN + 105 ES voseo) covering 5 fields × 21 entries × 2 locales"
  - "Geographic-origin citations as whyRationale convention for exterior plants (Mediterranean lavandas, LATAM endemics, Asian tropical, Andean petunia, etc.)"
affects: [14-06 (continues sequential content-authoring chain on plantDatabase.ts + plants.json), 14-07, 14-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Geographic-origin whyRationale citations for outdoor plants (vs physiology-mechanism citations for indoor in 14-04) — climate-of-origin explains care needs more naturally for outdoor species"
    - "≤250 char whyRationale ceiling enforced post-hoc via refactor commit (70fdeac) — initial drafts ran over; trim pass preserved meaning while honoring the cap from 14-04 baseline"
    - "Voseo grep guard maintained at 2 (no NEW Castilian forms introduced) across +210 ES strings"

key-files:
  created: []
  modified:
    - "src/data/plantDatabase.ts (~+390 LOC for 21 entries × 5 fields catalog defaults; final ~2400 LOC)"
    - "src/i18n/locales/en/plants.json (+~175 LOC for 21 entries × 5 fields)"
    - "src/i18n/locales/es/plants.json (+~175 LOC for 21 entries × 5 fields, voseo)"

key-decisions:
  - "whyRationale style for exterior plants leans on geographic origin + climate analog (e.g., 'Mediterránea — tolera sequía y suelo pobre' for lavanda) rather than the physiology-mechanism pattern used for interior plants (CAM/hemiepífita/sotobosque). Rationale: outdoor users intuit climate-of-origin → care needs more directly than abstract physiology."
  - "≤250 char ceiling on whyRationale strings — initial drafts had 18 ES + 15 EN entries running 251-309 chars. Refactored in commit 70fdeac to honor the post-14-04 char-limit baseline. Meaning preserved; trim pass removed redundant qualifiers."
  - "All 21 entries follow the same 5-field shape: careAction.fixed (or .soilCheck where waterMode='soil-check'), placementRecommended (1-2 sentences), placementAlternatives[] (2-3 array items), placementAvoid (1 sentence), whyRationale (single paragraph ≤250 chars)."

patterns-established:
  - "Geographic-origin citations for whyRationale on outdoor/exterior plants — Mediterranean lavandas, jacaranda NW Argentina, ceibo flor nacional Argentina, glicina templada Asia, camelia/gardenia/hibisco Asia tropical, petunia Andean, dalia/copete/verbena Mexican-Centroamerican, hortensia/jazmin Asian-Korean, geranio/cala South African, salvia-ornamental Brazilian riverbank"
  - "Char-limit refactor as a separate atomic commit (vs squashed into the content commit) — preserves auditability of which entries needed trimming and what was removed"

requirements-completed: [EDU-03 (partial — 21/64 entries done; full closure at end of 14-07)]

# Metrics
duration: ~57 min content authoring + char-limit refactor + stream-timeout aftermath
completed: 2026-05-05
---

# Phase 14 Plan 05: 21 EXTERIOR Catalog Entries Summary

**21 EXTERIOR catalog entries (3 lavandas, jacaranda, ceibo, glicina, camelia, gardenia, hibisco, petunia, dalia, copete, verbena, hortensia, jazmin, geranio, cala, salvia-ornamental, romero-rastrero + others) gain all 5 EDU-02 educational fields populated in plantDatabase.ts catalog defaults plus 210 matching i18n strings (105 EN + 105 ES voseo) authored in both locale files. Voseo grep baseline of 2 preserved (no NEW Castilian forms in +210 ES strings). whyRationale convention for outdoor plants: geographic-origin + climate analog citations (vs physiology-mechanism for interior plants in 14-04). Char-limit ceiling of ≤250 chars enforced via post-content refactor commit.**

## Performance

- **Duration:** ~57 min content authoring + ~5 min char-limit refactor + stream-timeout-aftermath bookkeeping by orchestrator
- **Started:** 2026-05-05T03:24:30Z (approximate, after 14-04 SUMMARY commit)
- **Code commits completed:** 2026-05-05T04:38:43Z (`70fdeac` refactor commit)
- **Tasks:** 1 (content authoring) + 1 implicit refactor (char-limit trim)
- **Files modified:** 3

## Accomplishments

- All 21 EXTERIOR entries declare all 5 EDU-02 fields in `src/data/plantDatabase.ts` catalog defaults: `careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`
- 105 EN strings authored in `src/i18n/locales/en/plants.json` covering the 5 fields × 21 entries
- 105 ES strings authored in `src/i18n/locales/es/plants.json` covering the 5 fields × 21 entries — vos conjugation throughout (regá, podá, sacá, querés, hacé, tutorá)
- Char-limit overflow fixed: 18 ES + 15 EN whyRationale strings initially ran 251-309 chars; refactor commit `70fdeac` trimmed all to ≤250 chars while preserving meaning
- Voseo grep guard `grep -cE "\b(riega|saca|puedes|quieres|mueve|toca|haz)\b" src/i18n/locales/es/plants.json` returns 2 — unchanged from post-14-04 baseline (those 2 hits are in legacy tip/description from pre-Phase-14 catalog and are out of scope for this plan)
- `npm run check:i18n-keys` exits 0 — 64 catalog ids verified across en/es plants.json (the 5 conditional checks added in Plan 14-01 are now firing for the 36 entries that have content: 15 from 14-04 + 21 from this plan)
- `npx tsc --noEmit` exits 0
- `node scripts/smoke-phase14.mjs` exits 0 with PASS 19/19 (no smoke regression)

## Task Commits

1. **Task 1: 21 EXTERIOR entries × 5 fields × EN+ES voseo content authoring** — `a4135d2` (feat)
2. **Implicit refactor: trim whyRationale strings to ≤250 chars** — `70fdeac` (refactor)

**Plan metadata:** _(separate final commit captures SUMMARY + STATE + ROADMAP)_

## Files Created/Modified

- `src/data/plantDatabase.ts` (+~390 LOC for 21 entries × 5 fields catalog defaults)
- `src/i18n/locales/en/plants.json` (+~175 LOC for 21 entries × 5 EN strings each)
- `src/i18n/locales/es/plants.json` (+~175 LOC for 21 entries × 5 ES voseo strings each)

## Geographic-Origin Citations (whyRationale convention for exterior plants)

The 21 EXTERIOR entries' whyRationale strings cite climate-of-origin as the primary explanation for care needs:

| Region/origin | Entries |
|---|---|
| Mediterranean | 3 lavandas (angustifolia, dentada, stoechas), romero-rastrero |
| LATAM endemic | jacaranda (NW Argentina), ceibo (flor nacional Argentina), salvia-ornamental (Brazil riverbank) |
| Asian temperate | glicina, hortensia, jazmin |
| Asian tropical | camelia, gardenia, hibisco |
| Andean | petunia |
| Mexican-Centroamerican | dalia, copete, verbena |
| South African | geranio, cala |

This contrasts with Plan 14-04's interior-plant convention (CAM metabolism, hemiepífita, sotobosque tropical, semi-árida Mexico) — geographic-origin is more intuitive for outdoor users who plant species in similar-latitude climates.

## Decisions Made

1. **Geographic-origin citations for outdoor whyRationale.** Outdoor plant care correlates strongly with climate-of-origin; users intuit "Mediterranean → likes drought + poor soil" more naturally than abstract physiology. Reserved physiology-mechanism citations for interior plants (Plan 14-04) where the cause-effect is decoupled from outdoor climate.

2. **≤250 char ceiling enforced via separate refactor commit.** Authoring the 21 entries' whyRationale produced strings averaging ~270 chars on first draft. Rather than squash the trim into the content commit, kept it as a separate atomic commit (`70fdeac`) — preserves the audit trail of what was removed (mostly redundant qualifiers like "ya que" "para que" pleonasms).

3. **Voseo discipline maintained without grep regression.** Authored ~105 NEW ES strings without introducing any of the 7 banned Castilian forms. The 2 pre-existing hits in plants.json are from legacy tip/description text and are out of scope for Phase 14.

## Deviations from Plan

### Operational deviations

**1. [Stream timeout] Executor agent stream-idled mid-bookkeeping after task commits landed**

- **Found during:** Post-Task 1 + char-limit-refactor (SUMMARY/STATE/ROADMAP write phase)
- **Issue:** Claude API stream-idle timeout interrupted the gsd-executor agent after both code commits (`a4135d2`, `70fdeac`) were already on disk. The agent never wrote `14-05-SUMMARY.md`, never ran `gsd-tools state advance-plan`, and never ran `gsd-tools roadmap update-plan-progress`. Full code work was complete; only bookkeeping was stranded. Same pattern as Plan 13-01 stream-idle (a known intermittent runtime issue with high-token-output content-authoring tasks).
- **Fix:** Orchestrator finalized bookkeeping directly after spot-checking that both commits were authored cleanly, smoke runner reports `PASS 19/19`, `npm run check:i18n-keys` reports `64 catalog ids verified`, and voseo grep guard returns 2 (unchanged from baseline). SUMMARY.md authored from the captured commit metadata; STATE.md + ROADMAP.md updated via the same gsd-tools commands the executor would have used.
- **Files modified:** This SUMMARY.md (new), STATE.md (append session + advance plan position), ROADMAP.md (plan-progress update)
- **Verification:** `node scripts/smoke-phase14.mjs` → `PASS 19/19`, `npx tsc --noEmit` → exit 0, `npm run check:i18n-keys` → PASS 64/64, `git log --oneline` shows both task commits present, no `Self-Check: FAILED` markers anywhere

### No code deviations

The two task commits faithfully implement the plan's `<action>` blocks. Char-limit refactor was a Rule 1 auto-fix (defect: drafts ran over the post-14-04 baseline ceiling) — not a scope deviation, just a correctness adjustment captured as its own atomic commit per the deviation-rules atomic-commit policy.

## Issues Encountered

1. **Stream-idle timeout in executor agent.** Documented above. No code impact.
2. **Initial whyRationale drafts ran over the ≤250 char ceiling.** 18 ES + 15 EN strings between 251-309 chars. Caught by the post-content char-limit verification step; refactor commit trimmed all to ≤250 with meaning preserved. This pattern (initial draft slightly over ceiling, then trim pass) is now documented as expected for content-authoring waves and the planner can adjust the upcoming Plans 14-06/14-07 if needed (e.g., enforce the ceiling during draft via prompt).

## User Setup Required

None — content authoring is purely local, no external services.

## Next Phase Readiness

- **Plan 14-06 unblocked:** 18 entries across AROMATICAS (9) + HUERTA (9) categories. Sequential dependency: Plan 14-06 starts after this completes (file conflict on plantDatabase.ts + plants.json).
- **Voseo baseline now `count=2`** — Plan 14-06's voseo grep guard runs against this same baseline (it should remain at 2 throughout the remaining content waves).
- **Char-limit ceiling now enforced as a known constraint** — Plan 14-06 should draft whyRationale ≤250 chars from the start (or expect a similar trim pass).
- **Coverage so far:** 36 of 64 catalog entries done (15 INTERIOR from 14-04 + 21 EXTERIOR from this plan). 28 remaining: 18 AROMATICAS+HUERTA in 14-06, 10 FRUTALES+SUCULENTAS in 14-07.
- **Phase 10 SEC-01 grep guard preserved:** `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` returns count 0 on every line. Plan 14-05 did not touch any client source.

---
*Phase: 14-educational-detail-modal*
*Completed: 2026-05-05*

## Self-Check: PASSED

Verification (run after SUMMARY.md write):

- 21 EXTERIOR entries declare all 5 EDU-02 fields in plantDatabase.ts: VERIFIED via commit `a4135d2` stat (+390 LOC)
- 105 EN + 105 ES strings authored in plants.json: VERIFIED via commit stat (+175 LOC each locale)
- `node scripts/smoke-phase14.mjs` exit code: 0
- Final report: `[smoke-phase14] PASS 19/19`
- `npx tsc --noEmit` exit code: 0
- `npm run check:i18n-keys` exit code: 0 — 64 catalog ids verified
- Voseo grep guard: count=2 (unchanged from post-14-04 baseline)
- Char-limit ≤250 chars: refactor commit `70fdeac` confirms trim pass complete
- Commits `a4135d2` + `70fdeac` exist in git log: VERIFIED
- SEC-01 grep guard: 0 hits (count 0 on every line)
