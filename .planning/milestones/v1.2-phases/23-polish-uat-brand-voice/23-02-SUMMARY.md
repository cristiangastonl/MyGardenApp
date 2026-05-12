---
phase: 23-polish-uat-brand-voice
plan: 02
subsystem: polish
tags: [wcag-aa, accessibility, voseo, i18n, brand-voice, lint, theme, design-tokens]

# Dependency graph
requires:
  - phase: 23-polish-uat-brand-voice/00
    provides: smoke-phase23 SKIP placeholders for POLISH-05/06; voseo-lint.mjs skeleton with empty BANNED + WHITELIST_KEYS
provides:
  - colors.textSecondary darkened from #8a7e6b to #6f6450 (5.12:1 on bgPrimary, 5.72:1 on card — both PASS WCAG 2.1 AA at 4.5:1 threshold)
  - scripts/voseo-lint.mjs STRICT body with 22-form BANNED regex array + WHITELIST_KEYS for legitimate 3rd-person uses
  - 4 plantCard action buttons localized to voseo+emoji ("Regá ahora 💧", "Sol ☀️ ({{hours}}h)", "Sacalo afuera 🌳", "Fertilizá 🌱") + plantDetailModal mirrors
  - 4 EN action button parity with emoji ("Water now 💧", "Sun ☀️ ({{hours}}h)", "Put outside 🌳", "Fertilize 🌱")
  - 21 pre-existing voseo violations fixed inline across es/common.json + es/plants.json + es/tips.json (lint scope: all ES JSON locales, not just common)
  - voseo-lint STRICT gate now blocks future Castilian/formal forms via smoke-phase23 cross-phase regression
affects: [phase-24-docs-and-launch, future-i18n-additions, all-future-plans-touching-es-jsons]

# Tech tracking
tech-stack:
  added: []  # No new dependencies; theme-token swap + lint script population only
  patterns:
    - "WCAG AA token darkening — single hex swap in theme.ts, hierarchy preserved (textSecondary #6f6450 lighter than textMuted #6a604f)"
    - "voseo-lint deterministic fix script under scripts/.tmp-phase23/ — exact-string find/replace + JSON-key fallback for ambiguous descriptive 3rd-person cases (gitignored)"
    - "Descriptive-3rd-person rewording over whitelist expansion — false-positive 'Usa CAM' / 'vida corta' / 'le saca color' reworded to non-banned phrasings (Funciona con / vida breve / le quita color) rather than expanding WHITELIST_KEYS surface"

key-files:
  created:
    - scripts/.tmp-phase23/fix-plants-voseo.cjs (gitignored deterministic fix runner — not committed)
    - .planning/phases/23-polish-uat-brand-voice/23-02-SUMMARY.md
  modified:
    - src/theme.ts (textSecondary #8a7e6b → #6f6450 + obsolete TODO comment removed)
    - scripts/voseo-lint.mjs (BANNED populated 22 forms + WHITELIST_KEYS finalized + skeleton tag scrubbed throughout)
    - src/i18n/locales/es/common.json (16 pre-existing voseo fixes + 4 plantCard action button voseo+emoji + 2 plantDetailModal mirrors)
    - src/i18n/locales/es/plants.json (46 imperative voseo fixes + 5 descriptive-3rd-person rewordings + 3 whyRationale key-path rewrites)
    - src/i18n/locales/es/tips.json (5 voseo fixes — summer-early-water title+message / summer-mulch / cloudy-less-evaporation / rain-coming / pale-leaves-light)
    - src/i18n/locales/en/common.json (4 plantCard + 2 plantDetailModal emoji parity — no voseo for EN)

key-decisions:
  - "textSecondary hex locked at #6f6450 — chosen for 5.12:1 contrast on bgPrimary AND 5.72:1 on card with comfortable AA margin while preserving the warm-brown hue identity of the original #8a7e6b; lighter than textMuted #6a604f so the typographic hierarchy is preserved without further token cascade."
  - "Voseo lint scope extended beyond es/common.json to ALL es/*.json — RESEARCH §Finding 7 listed 17 violations in common.json alone but the lint walks the entire es/ locale tree. plants.json had 49 additional violations (46 imperatives + 3 reworded descriptive 3rd-person) and tips.json had 5. All fixed atomically to land voseo-lint exit 0 STRICT in the same commit (Rule 3 — Blocking deviation auto-fixed)."
  - "Descriptive-3rd-person reworded rather than expanding WHITELIST_KEYS — petunia 'vida corta' → 'vida breve'; cactus/sedum/cola-burro 'Usa CAM' → 'Funciona con CAM'; echeveria/haworthia 'usa' → 'aprovecha'; senecio 'se ven blandas' → 'se notan blandas'; stevia 'perenne corta' → 'perenne breve'; bougainvillea 'le saca color' → 'le quita color'. WHITELIST_KEYS kept minimal at 2 entries (settings.locationDescription + alerts.sunDayToday) to avoid creating an exception culture; rewording is the preferred remedy."
  - "Unaccented possessive 'tu' NOT in BANNED — only `\\btú\\b` accented form is banned per RESEARCH §Pitfall 4; preserves legitimate possessive uses across the i18n surface (e.g. 'Tu jardín está esperando 🌱')."
  - "plantDetailModal.water + plantDetailModal.fertilize ALSO updated to voseo+emoji values — RESEARCH §Finding 8 footer flagged these as separate keys consumed by MyPlantDetailModal; surface consistency requires both PlantCard's plantCard.* and the modal's plantDetailModal.* to show identical 'Regá ahora 💧' / 'Fertilizá 🌱' wording."
  - "Deterministic fix runner in scripts/.tmp-phase23/fix-plants-voseo.cjs — string-based exact-match (errors if any find is missing or ambiguous) + JSON-key navigation for 3 ambiguous whyRationale entries. Gitignored to keep git history clean; pattern mirrors Phase 11/12/14 tmp-runner discipline."

patterns-established:
  - "voseo-lint STRICT gate: walks all es/*.json files; BANNED is 22-regex array with word-boundary anchors; WHITELIST_KEYS uses dotted key path with file basename prefix ('common.settings.locationDescription'); future plans introducing ES strings must pass `npm run lint:voseo` before commit (enforceable in pre-submit or CI)."
  - "Theme-token darkening lock: single hex swap with inline WCAG citation comment ('5.12:1 on bgPrimary, 5.72:1 on card — both PASS AA per WCAG 2.1'); no new tokens introduced per CLAUDE.md design-system lock; hierarchy verification done by comparing hex values (textSecondary #6f6450 between textPrimary #2d3a2e darkest and textMuted #6a604f darker)."
  - "Descriptive-3rd-person rewording catalog (for future authors): 'usa' / 'Usa' as descriptive verb → 'funciona con' / 'Funciona con' / 'aprovecha' / 'recurre al'; 'corta' / 'larga' as descriptive adjective → 'breve' / 'larga' alternatives; 'le saca X' → 'le quita X'; 'se ven Y' → 'se notan Y'. Catalog content authors prefer rewording over whitelisting to keep the lint surface as STRICT as possible."
  - "Composite atomic commit pattern: one requirement = one git commit even when commit touches 5 files (voseo-lint.mjs + 4 JSON files) — POLISH-06 committed as a single 'feat(23-02)' because the lint body + violation fixes + button copy updates are an indivisible unit (lint exit 0 only achievable when all 3 components land together)."

requirements-completed: [POLISH-05, POLISH-06]

# Metrics
duration: 25 min
completed: 2026-05-12
---

# Phase 23 Plan 02: WCAG AA + Brand-Voice Lock Summary

**WCAG-AA textSecondary darkening (#8a7e6b → #6f6450) + STRICT voseo-lint with 22-form BANNED + 70 pre-existing voseo violations fixed atomically across es/common+plants+tips.json + 4 ES voseo+emoji action buttons with EN parity**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-12T04:36:14Z
- **Completed:** 2026-05-12T05:01:22Z
- **Tasks:** 2
- **Files modified:** 5 (1 theme + 1 lint script + 3 ES JSON + 1 EN JSON)

## Accomplishments

- **POLISH-05 closed:** `colors.textSecondary` flipped to `#6f6450` — 5.12:1 on bgPrimary (#f5f0e6) and 5.72:1 on card (#fffdf8); both comfortably above WCAG 2.1 AA's 4.5:1 threshold. Obsolete two-line TODO comment removed; single inline WCAG citation added.
- **POLISH-06 closed (composite atomic):** scripts/voseo-lint.mjs STRICT body landed — 22-regex BANNED array (5 tuteo verbs + 14 Castilian imperatives + accented `\btú\b` + 2 formal 3rd-person) + WHITELIST_KEYS finalized for 2 legitimate 3rd-person uses (`settings.locationDescription` + `alerts.sunDayToday`). Skeleton JSDoc references scrubbed throughout file.
- **70 pre-existing voseo violations fixed atomically** alongside the lint impl: 16 in es/common.json (planned per RESEARCH §Finding 7) + 49 in es/plants.json (Rule 3 — Blocking deviation: lint scope mandated full coverage) + 5 in es/tips.json. Voseo-lint exits 0 STRICT.
- **4 ES action button voseo+emoji + 4 EN emoji parity:** `plantCard.water` "Regá ahora 💧" / "Water now 💧"; `plantCard.sunLabel` "Sol ☀️ ({{hours}}h)" / "Sun ☀️ ({{hours}}h)" — `{{hours}}` interpolation preserved per RESEARCH §Open Question 1 Option B; `plantCard.outdoor` "Sacalo afuera 🌳" / "Put outside 🌳"; `plantCard.fertilize` "Fertilizá 🌱" / "Fertilize 🌱". `plantDetailModal.water` + `plantDetailModal.fertilize` mirrored for surface consistency.
- **smoke-phase23 PASS=46→48, SKIP=3→1.** POLISH-05.textSecondary-wcag-aa + POLISH-06.action-button-voseo-emoji + POLISH-06.voseo-lint-exit-0 all flipped SKIP → PASS. Only POLISH-07.illustrated-empty-states SKIP remains for Plan 23-03.
- **Phase 18-22 cross-phase STRICT regression preserved verbatim** — all TIER 3 sentinels unchanged (PlantCard 5-element layout, mood emoji, Gesture.Pan, Toast, TOX-03/04/06, FERT-03/06/07, JOURNAL-01/02/04/05, GAM-01/02/05).

## Task Commits

Each task committed atomically:

1. **Task 1: POLISH-05 — darken colors.textSecondary to #6f6450** — `f664e9f` (fix)
2. **Task 2: POLISH-06 — STRICT voseo-lint + 70 pre-existing fixes + 4 action button voseo+emoji + EN parity** — `3fd4100` (feat)

_Plan metadata commit follows via gsd-tools commit step._

## Files Created/Modified

- `src/theme.ts` — textSecondary hex swap + obsolete TODO comment removed
- `scripts/voseo-lint.mjs` — BANNED populated (22 regex) + WHITELIST_KEYS finalized + JSDoc + stdout scrubbed of skeleton references
- `src/i18n/locales/es/common.json` — 16 voseo fixes + 4 plantCard voseo+emoji + 2 plantDetailModal mirrors
- `src/i18n/locales/es/plants.json` — 46 imperative voseo fixes + 3 descriptive 3rd-person rewordings (whyRationale entries on echeveria/cola-burro/haworthia/sedum/cactus) + 2 false-positive adjective rewordings (petunia/stevia)
- `src/i18n/locales/es/tips.json` — 5 voseo fixes
- `src/i18n/locales/en/common.json` — 4 plantCard emoji parity + 2 plantDetailModal mirrors

## Decisions Made

See frontmatter `key-decisions` block (6 entries — hex value rationale, scope extension to plants/tips.json, rewording over whitelisting, accent discrimination for `\btú\b`, plantDetailModal mirror, deterministic fix runner pattern).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] voseo-lint scope is all es/*.json, not just common.json**
- **Found during:** Task 2 first lint run after fixing 16 violations in es/common.json + populating BANNED
- **Issue:** voseo-lint reported 56 violations remaining after the planned 16 common.json fixes — the lint walks the entire `src/i18n/locales/es/` directory, not just common.json. The PLAN's RESEARCH §Finding 7 enumerated only common.json violations (16 in practice, plan said 17). Without fixing the other 54 violations in plants.json + tips.json, voseo-lint would exit 1, blocking the POLISH-06.voseo-lint-exit-0 smoke sentinel.
- **Fix:** Authored deterministic Node fix runner at `scripts/.tmp-phase23/fix-plants-voseo.cjs` (gitignored, mirrors Phase 11/12/14 tmp-runner pattern); applied 46 string-exact-match imperative fixes + 5 descriptive-3rd-person rewordings to es/plants.json + 5 voseo fixes to es/tips.json directly. Decision: reword false-positive descriptive 3rd-person ("Usa CAM" → "Funciona con CAM", "vida corta" adjective → "vida breve") rather than expand WHITELIST_KEYS, to preserve STRICT lint surface and prevent exception culture.
- **Files modified:** src/i18n/locales/es/plants.json (49 entries touched), src/i18n/locales/es/tips.json (5 entries touched), scripts/.tmp-phase23/fix-plants-voseo.cjs (runner — gitignored)
- **Verification:** `node scripts/voseo-lint.mjs` exits 0; `npm run check:i18n-keys` PASS 118 catalog ids (locale parity preserved); `npx tsc --noEmit` clean
- **Committed in:** `3fd4100` (same Task 2 atomic commit — composite includes Rule 3 scope expansion alongside planned common.json fixes per PLAN's "composite atomic" lock)

**2. [Rule 2 - Missing Critical] JSDoc references to skeleton state must be scrubbed too**
- **Found during:** Task 2 acceptance criteria verification (`! grep -F "skeleton — BANNED list empty" scripts/voseo-lint.mjs` returned 2 instead of 0)
- **Issue:** PLAN's action note targeted only the `console.log('voseo-lint: PASS (skeleton — BANNED list empty until Plan 23-02)')` literal for removal. But the PLAN's acceptance criterion is stricter — it greps the entire file. Two JSDoc references to "skeleton — BANNED list empty" remained at lines 11-14 and 19-21 of the original skeleton, documenting the Wave 0 skeleton-state behavior.
- **Fix:** Rewrote the JSDoc header comment block to reflect the STRICT body shipped in Plan 23-02 instead of describing the skeleton-era behavior. No functional change; documentation accuracy maintained.
- **Files modified:** scripts/voseo-lint.mjs (JSDoc header)
- **Verification:** `grep -cF "skeleton — BANNED list empty" scripts/voseo-lint.mjs` returns 0; voseo-lint still exits 0
- **Committed in:** `3fd4100` (same Task 2 atomic commit — JSDoc cleanup landed inline with lint impl)

---

**Total deviations:** 2 auto-fixed (1 blocking scope-expansion, 1 missing-critical doc-scrub)
**Impact on plan:** Both deviations were correctness requirements for landing voseo-lint exit 0 STRICT. The Rule 3 scope-expansion is the substantive one — it lifted the voseo-fix surface from 16 violations to 70 across 3 ES JSON files. No scope creep beyond what was required to satisfy `npm run lint:voseo` STRICT exit. Token count: ~70 voseo fixes vs planned 17 reflects RESEARCH §Finding 7's local-only enumeration (planner inspected only common.json; real-world lint surface is larger).

## Issues Encountered

None — both Tasks landed cleanly. The Rule 3 scope expansion was caught immediately by the first post-fix lint run and resolved inline via the deterministic runner.

## User Setup Required

None — no external service configuration required. All changes are file-internal (theme token swap + lint script + JSON value updates).

## Next Phase Readiness

- **Plan 23-03 (Wave 3 empty states) ready:** Only `POLISH-07.illustrated-empty-states` SKIP remains in smoke-phase23. Plan 23-03 lands 3 SVG/PNG illustrations + 3 EmptyState JSX inserts in PlantsScreen + CalendarScreen + ExploreScreen + i18n keys (already in emptyState.* namespace per Wave 0 scaffold).
- **Plan 23-04 (Wave 4 manual gate):** POLISH-04 device-test gate — no automated surface change, manual identify→diagnose flow verification on iOS + Android.
- **Voseo lint is now a permanent STRICT gate:** any future plan introducing ES strings into `src/i18n/locales/es/*.json` MUST pass `npm run lint:voseo`. Encourage adding `npm run lint:voseo && npx tsc --noEmit && npm run check:i18n-keys` to pre-submit checks alongside `npm run check:i18n-keys` + `npm run check:images`.

## Self-Check

Verifying claims:
- `src/theme.ts` contains `#6f6450` — VERIFIED
- `src/theme.ts` no longer contains `#8a7e6b` — VERIFIED
- `scripts/voseo-lint.mjs` has populated BANNED — VERIFIED
- `scripts/voseo-lint.mjs` has WHITELIST_KEYS with 2 keys — VERIFIED
- `scripts/voseo-lint.mjs` no longer references "skeleton — BANNED list empty" — VERIFIED (grep returns 0)
- `src/i18n/locales/es/common.json` contains 4 voseo+emoji action button values — VERIFIED
- `src/i18n/locales/en/common.json` contains 4 emoji parity action button values — VERIFIED
- `node scripts/voseo-lint.mjs` exits 0 — VERIFIED
- `node scripts/smoke-phase23.cjs` PASS=48 FAIL=0 SKIP=1 — VERIFIED
- Task 1 commit `f664e9f` exists — VERIFIED (`git log --oneline | grep f664e9f` returns row)
- Task 2 commit `3fd4100` exists — VERIFIED (`git log --oneline | grep 3fd4100` returns row)

## Self-Check: PASSED

---
*Phase: 23-polish-uat-brand-voice*
*Completed: 2026-05-12*
