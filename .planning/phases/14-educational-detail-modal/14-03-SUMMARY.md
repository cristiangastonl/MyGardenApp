---
phase: 14-educational-detail-modal
plan: 03
subsystem: ui-restructure + animation + override-rendering
tags: [edu-01, edu-04, edu-05, reanimated-v4, lazy-measure, modal-restructure, strict-catalog-resolution, voseo]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    plan: 00
    provides: "smoke-phase14.mjs W2.EDU-01.1-4 + W2.EDU-01.5 + W2.EDU-01.6 + W2.EDU-04.1 placeholders ready to flip"
  - phase: 14-educational-detail-modal
    plan: 01
    provides: "PlantDBEntry +5 educational fields (careAction/placement*/whyRationale); getTranslatedPlant body extended; check-i18n-keys validator extended"
  - phase: 14-educational-detail-modal
    plan: 02
    provides: "compareUserVsCatalog comparator (3 fields, OverrideResult[]); 6 plantDetailModal section labels + override note + notInCatalog placeholder; PROTECTED_USER_FIELDS deep-merge guard"
  - phase: 13-gesture-bottom-sheet-infrastructure
    plan: 02
    provides: "Skeleton.tsx Reanimated v4 reference impl (useSharedValue + withTiming + useAnimatedStyle + Easing.inOut(Easing.ease)) — animation API template"
provides:
  - "EducationalSection generic collapsible card wrapper (138 LOC) — Reanimated v4 lazy-measure pattern; emoji + title + defaultExpanded + children API surface"
  - "MyPlantDetailModal restructured into 4-section educational layout (locked order: 🌿 → 🏠 → ℹ️ → ⚙️) with strict-only catalog resolution for the 5 NEW fields and inline override notes in ⚙️ Tus ajustes"
  - "3 new sub-block i18n keys (recommended/alternatives/avoid) in plantDetailModal namespace — locale parity preserved at 21 keys each (was 18)"
  - "EDU-04 regression verified: selectedPlant?.lightLevel ?? 'bright_indirect' pre-select pattern intact at IdentificationResults.tsx:43"
  - "Final smoke runner: PASS 19/19, 0 SKIPS, 0 FAILS — every Wave 2 placeholder flipped to PASS"
affects: [14-04-catalog, 14-05-catalog, 14-06-catalog, 14-07-catalog, 14-08-checkpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reanimated v4 lazy-measure collapsible (Pitfall 4 Option A) — useSharedValue + 3× useDerivedValue + 2× useAnimatedStyle drive height/opacity/chevron rotation tied to single open shared value; onLayout writes measuredHeight on every layout > 0"
    - "Strict-only catalog resolution for educational content (RESEARCH §Q1 lock) — strictDbEntry useMemo uses ONLY getCatalogEntry(databaseId); legacy dbEntry (with fuzzy fallback) preserved for nutrients backward compat — coexistence pattern"
    - "Inline override note rendering — Text inside same settingRow View as the differing field; conditional on hasOverride('<field>'); fontSize 12 + textSecondary + italic per RESEARCH Example 2"
    - "Per-modal-session collapse state — useState only, NOT AsyncStorage / useStorage — locked per CONTEXT.md"
    - "Conditional whole-section render — `{strictDbEntry?.whyRationale && <EducationalSection .../>}` hides header + content together when single backing field absent (other 3 sections render unconditionally with sub-block-level graceful hiding)"

key-files:
  created:
    - "src/components/plant-detail/EducationalSection.tsx (138 LOC, NEW)"
  modified:
    - "src/components/MyPlantDetailModal.tsx (495 → 674 LOC, +179) — imports + strictDbEntry/overrides/hasOverride useMemo + 4-section JSX block + 9 new style entries"
    - "src/i18n/locales/en/common.json (829 → 832 LOC, +3) — 3 new plantDetailModal sub-block keys (recommended/alternatives/avoid)"
    - "src/i18n/locales/es/common.json (829 → 832 LOC, +3) — same with es-AR forms (Recomendado:/Alternativas:/Evitar:)"

key-decisions:
  - "Lazy-measure pattern (Pitfall 4 Option A) over off-screen measurer — RESEARCH §Open Questions Q4 lock: 'ship the simple approach; upgrade to off-screen measurer only if Plan 14-08 manual device-test reveals jank.'"
  - "Chevron rotation 0°→90° (NOT 0°→180°) — `›` glyph naturally points right at 0°, points down at 90°; CONTEXT mention of '180°' is doc typo per plan's locked guidance"
  - "strictDbEntry coexists with legacy dbEntry — does NOT replace it. Strict drives 5 NEW educational fields (careAction/placement*/whyRationale); legacy drives existing nutrients render (folded into 🌿 sub-block). Two parallel useMemos, separate concerns"
  - "compareUserVsCatalog called against strictDbEntry, NOT legacy dbEntry — per CONTEXT.md spirit: override comparison runs against canonical recommendation, not fuzzy match (prevents false-positive overrides)"
  - "Override note rendered INLINE next to differing field row, NOT a top-of-section banner — RESEARCH §Example 2 lock; settingRow View wraps {label, value, conditional override note}"
  - "All 3 i18n keys added in this task (NOT split into separate task) — recommended/alternatives/avoid land alongside the JSX consumers in same commit (atomic surface lock)"
  - "ActiveProblemsSection import retained — still used inside the 🌿 section's content. Only the standalone consumer JSX site at original line 230-237 is removed"
  - "Nutrients card relocated INSIDE 🌿 section with `nutrientsCardEdu` styling (rgba 0,0,0,0.03 background + borderRadius.md + padding spacing.sm) — visual nesting indicator for the sub-block status"
  - "EDU-04 NO source change — selectedPlant?.lightLevel ?? 'bright_indirect' pattern at IdentificationResults.tsx:43 intact since Phase 7 LIGHT-05; W2.EDU-04.1 smoke assertion is a regression check that PASSed at Wave 0 baseline AND continues PASSing after this plan (verified in Task 3)"
  - "Named export only on EducationalSection (no default export) — mirrors project convention; Skeleton.tsx + ActiveProblemsSection.tsx + ProblemTimeline.tsx all use named exports"
  - "minHeight 44 on titleRow — Apple HIG touch target; protects users with motor difficulty. overflow:'hidden' on both card AND bodyClip — clips ripple effects on Pressable + clips animated height during transition"

patterns-established:
  - "Phase 14 educational section composition: <EducationalSection emoji=X title={t(K)} children=> drives all 4 sections inline in MyPlantDetailModal with locked order; emoji is data (not type-coded), title is i18n key, children is the per-section sub-render JSX block"
  - "Strict vs fuzzy catalog resolution coexistence: strictDbEntry useMemo (educational fields, NEW) + legacy dbEntry useMemo (nutrients, tip, description fallback) live side-by-side; future plans (Phase 18 PlantCard, Phase 21 Journal) can opt into either path based on field semantics"
  - "Override note inline pattern: <Text style={overrideNote}>{t('plantDetailModal.overrideNote')}</Text> child of the settingRow View with conditional hasOverride('<field>') wrapper — applies to lightLevel, waterScheduleWarm, waterScheduleCold today; future settings rows reuse the pattern verbatim"

requirements-completed: [EDU-01, EDU-04, EDU-05]

# Metrics
duration: 12min
completed: 2026-05-05
---

# Phase 14 Plan 03: Modal Restructure (Wave 2 UI Surface) Summary

**EDU-01 modal restructure complete: src/components/plant-detail/EducationalSection.tsx lands as a 138-LOC Reanimated v4 lazy-measure collapsible card wrapper (useSharedValue + 3× useDerivedValue + 2× useAnimatedStyle + 3× withTiming with Easing.inOut(Easing.ease) at 250ms); MyPlantDetailModal.tsx grows from 495 → 674 LOC with the 4-section educational layout (🌿 → 🏠 → ℹ️ → ⚙️) replacing the existing nutrients card + standalone ActiveProblemsSection consumer; strictDbEntry useMemo locks educational content to getCatalogEntry strict path (no fuzzy fallback) per RESEARCH §Q1; ⚙️ Tus ajustes renders inline override notes via compareUserVsCatalog for 3 user-set fields; ¿Por qué? hides ENTIRELY when whyRationale absent; 3 new sub-block i18n keys (recommended/alternatives/avoid) land in both common.json with locale parity (21 plantDetailModal keys each); EDU-04 verified in place (no source change); smoke runner ends at PASS 19/19 with 0 SKIPS and 0 FAILS — every Wave 2 placeholder flipped from SKIP to PASS.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-05T02:43:18Z
- **Completed:** 2026-05-05T02:54:56Z
- **Tasks:** 3 (Task 3 read-only verification, no commit)
- **Files modified:** 4 (1 created, 3 modified)
- **LOC delta:** +325 LOC (138 new + 179 in modal + 6 in 2 locales × 3 keys)

## Accomplishments

- `src/components/plant-detail/EducationalSection.tsx` (NEW, 138 LOC) — generic collapsible card wrapper using Reanimated v4 lazy-measure pattern. Single open shared value drives 3 derived values (height = open × measuredHeight, opacity = open, chevron = open × 90°) with Easing.inOut(Easing.ease) at 250ms. minHeight 44 (Apple HIG), accessibilityRole/State, theme tokens. Named export.
- `src/components/MyPlantDetailModal.tsx` (MODIFIED, 495 → 674 LOC, +179) — imports `EducationalSection` + `compareUserVsCatalog` + `OverrideField` + `OverrideResult`; new `strictDbEntry` useMemo (strict-only catalog resolution); new `overrides`/`hasOverride` derived from compareUserVsCatalog; 4-section JSX block in locked order (🌿 → 🏠 → ℹ️ → ⚙️) replaces existing nutrients card + standalone ActiveProblemsSection consumer; nutrients folded into 🌿 with nested-card styling; ¿Por qué? wrapped in `{strictDbEntry?.whyRationale && ...}` conditional render; ⚙️ Tus ajustes shows 3 user-setting rows with inline override notes; 9 new StyleSheet entries (eduCopy, placeholderCopy, subBlock, subTitle, bullet, settingRow, settingLabel, settingValue, overrideNote, nutrientsCardEdu).
- `src/i18n/locales/en/common.json` (MODIFIED, +3 lines) — 3 new plantDetailModal sub-block keys: recommended ("Recommended:"), alternatives ("Alternatives:"), avoid ("Avoid:").
- `src/i18n/locales/es/common.json` (MODIFIED, +3 lines) — same in es-AR voseo-friendly forms: recommended ("Recomendado:"), alternatives ("Alternativas:"), avoid ("Evitar:"). Locale parity preserved (21 plantDetailModal keys each).
- EDU-04 regression verified: `selectedPlant?.lightLevel ?? 'bright_indirect'` pattern at IdentificationResults.tsx:43 intact (Phase 7 LIGHT-05 closure preserved). NO source change made — read-only verification per RESEARCH §Code Examples Example 1.
- Smoke runner: PASS 19/19 (was PASS 16/19 at Plan 14-02 completion). All 3 remaining placeholders (W2.EDU-01.1-4 + W2.EDU-01.5 + W2.EDU-01.6) flipped from SKIP to PASS. 0 FAILS, 0 SKIPS — the smoke runner is now fully green for Phase 14 Wave 2.
- All verification gates green: `npx tsc --noEmit` exits 0, `npm run check:i18n-keys` exits 0 (64 catalog ids verified), `node scripts/smoke-phase14.mjs` exits 0 with PASS 19/19.
- Phase 10 SEC grep guard preserved: `EXPO_PUBLIC_PERENUAL_API_KEY` count = 0 across all client-bundle paths.

## Task Commits

Each task was committed atomically (Task 3 was read-only verification, no commit):

1. **Task 1: Add EducationalSection Reanimated v4 collapsible wrapper** — `516873a` (feat)
2. **Task 2: Restructure MyPlantDetailModal with 4 educational sections** — `b401026` (feat)
3. **Task 3: Verify EDU-04 LightLevelPicker pre-select regression (read-only)** — no commit (no files modified)

## Files Created/Modified

- `src/components/plant-detail/EducationalSection.tsx` (CREATED, 138 LOC) — generic collapsible card wrapper. `useSharedValue` × 2 (measuredHeight + open). `useDerivedValue` × 3 (derivedHeight + opacity + chevronRotation). `useAnimatedStyle` × 2 (bodyStyle + chevronStyle). `withTiming` × 3 (one per derived value). All 3 use `Easing.inOut(Easing.ease)` at `COLLAPSE_DURATION = 250`. Theme tokens (colors.card, colors.textPrimary, colors.textSecondary, fonts.heading, spacing.md/sm, borderRadius.lg, shadows.sm). minHeight 44 on titleRow. accessibilityRole="button" + accessibilityState={{expanded}}. Animated.Text for chevron (worklet-friendly). Named export only.
- `src/components/MyPlantDetailModal.tsx` (MODIFIED, 495 → 674 LOC, +179) — see Accomplishments above for the comprehensive change list. Existing real estate above (header + photo + diagnose button) and below (diagnosis history + photo album + delete button) preserved untouched.
- `src/i18n/locales/en/common.json` (MODIFIED, 829 → 832 LOC, +3) — plantDetailModal namespace gains recommended/alternatives/avoid sub-block labels.
- `src/i18n/locales/es/common.json` (MODIFIED, 829 → 832 LOC, +3) — same with es-AR voseo discipline (Recomendado:/Alternativas:/Evitar:).

## Final Smoke Runner State

**Exact stdout final line:** `[smoke-phase14] PASS 19/19 (0 placeholders skipped — Wave 1+ will flip)`

### PASSes Owned by Plan 14-03 (4 placeholders flipped)

| Label                                                                                          | From | To   |
| ---------------------------------------------------------------------------------------------- | ---- | ---- |
| W2.EDU-01.1-4: MyPlantDetailModal.tsx contains all 4 locked emoji anchors (🌿/🏠/ℹ️/⚙️)         | SKIP | PASS |
| W2.EDU-01.5: MyPlantDetailModal.tsx imports EducationalSection                                 | SKIP | PASS |
| W2.EDU-01.6: EducationalSection.tsx uses Reanimated v4                                         | SKIP | PASS |
| W2.EDU-04.1: IdentificationResults.tsx still pre-selects (regression — no change)              | PASS | PASS |

(W2.EDU-04.1 was already PASS at Wave 0 baseline; Plan 14-03 Task 3 confirmed it stays PASS.)

### Total PASSes (19)

- 6 W0 scaffold PASSes (Plan 14-00)
- 1 EDU-04 regression PASS (Plan 14-00 baseline; verified by Plan 14-03 Task 3)
- 6 W1.EDU-02.* PASSes (Plan 14-01)
- 1 W1.EDU-07.1 PASS (Plan 14-01)
- 1 W1.EDU-06.1 PASS (Plan 14-02)
- 1 W1.EDU-05.* PASS (Plan 14-02)
- **3 W2.EDU-01.* PASSes (Plan 14-03 — this plan)**

### SKIPs (0)

None. Phase 14 smoke runner is now fully green.

### FAILs (0)

None.

## ActiveProblemsSection Consumer Site Migration

**Confirmed:** The standalone `<ActiveProblemsSection ... />` JSX consumer at the original modal lines 230-237 has been REMOVED. Its data flow (`allPlantDiagnoses` + `onPressDiagnosis` callback wiring `setResumeDiagnosis` + `setShowDiagnosis`) has been woven INSIDE the 🌿 ¿Qué hacer? section as the first child of `<EducationalSection emoji="🌿" ...>`.

The `ActiveProblemsSection` import at line 21 of MyPlantDetailModal.tsx is **PRESERVED** — the component file (`src/components/ActiveProblemsSection.tsx`) is **NOT deleted** and is **still used** as a child of the 🌿 section. This was the locked design per `<critical_implementation_requirements>`: "Do NOT remove the ActiveProblemsSection import or component file — it's still used (now inside the 🌿 section)."

No other call sites of `ActiveProblemsSection` were found anywhere in the codebase — the only consumer was MyPlantDetailModal, and that consumer is now nested inside the 🌿 section.

## Strict-Only Catalog Resolution

**Confirmed:** `strictDbEntry` useMemo uses ONLY `getCatalogEntry(plant.databaseId)` strict path — no fuzzy `findDatabaseEntry` fallback. The 5 NEW educational fields (`careAction.fixed`, `careAction.soilCheck`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`) all read from `strictDbEntry`. When `plant.databaseId` is absent or `getCatalogEntry` returns no match, `strictDbEntry` is `null` — and the modal falls back to the locked custom-plant UX:
- 🌿 ¿Qué hacer? still renders (Active Problems + nutrients via legacy dbEntry; careAction/* sub-blocks naturally hidden via the conditional ternaries)
- 🏠 ¿Dónde ponerla? renders the `t('plantDetailModal.notInCatalog')` placeholder
- ℹ️ ¿Por qué? hidden ENTIRELY (header + content) via `{strictDbEntry?.whyRationale && (...)}` conditional render
- ⚙️ Tus ajustes works fully (user-data-driven; `compareUserVsCatalog(plant, null)` returns `[]` so no override notes appear, but the rows themselves still render)

**Legacy `dbEntry`** (with 3-rung fallback `getCatalogEntry → findDatabaseEntry → null`) is **PRESERVED** — it drives the existing `nutrients` access (folded INSIDE the 🌿 section as a sub-block with `nutrientsCardEdu` styling). This coexistence is the RESEARCH §Q1 bake-in: "render the custom-plant fallback for the educational sections if `databaseId` is absent, regardless of whether `findDatabaseEntry` matched. This keeps the existing fuzzy fallback for `tip`/`description` (legacy behavior) while preventing wrong-plant educational content."

## EDU-04 Verification Result

**Result:** PASS — no source change made.

`selectedPlant?.lightLevel ?? 'bright_indirect'` pattern intact at `src/components/PlantIdentifier/IdentificationResults.tsx:43` (also at line 49 inside the useEffect that re-syncs when the user taps a different plant card). `'bright_indirect'` fallback default preserved in 2 places.

The W2.EDU-04.1 smoke assertion was already PASS at Wave 0 baseline (Plan 14-00) per the locked "EDU-04 NO-SKIP exception" — the Phase 7 LIGHT-05 work closed this requirement; Plan 14-03 Task 3 simply re-confirmed the regression check stays green after the modal restructure (which doesn't touch IdentificationResults.tsx).

No gap detected. No deviation routed. EDU-04 closed.

## 9 Total plantDetailModal i18n Keys Added in Phase 14

| Key                | Plan       | EN value                                                                  | ES value (es-AR voseo)                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| whatToDo           | Plan 14-02 | "What to do?"                                                             | "¿Qué hacer?"                                                          |
| whereToPlace       | Plan 14-02 | "Where to place it?"                                                      | "¿Dónde ponerla?"                                                      |
| why                | Plan 14-02 | "Why?"                                                                    | "¿Por qué?"                                                            |
| yourSettings       | Plan 14-02 | "Your settings"                                                           | "Tus ajustes"                                                          |
| overrideNote       | Plan 14-02 | "Different from the recommendation for this species. Want to adjust?"     | "Diferente a la recomendación para esta especie. ¿Querés ajustar?"     |
| notInCatalog       | Plan 14-02 | "This plant isn't in our catalog yet."                                    | "Esta planta no está en nuestro catálogo todavía."                     |
| **recommended**    | **Plan 14-03** | **"Recommended:"**                                                    | **"Recomendado:"**                                                     |
| **alternatives**   | **Plan 14-03** | **"Alternatives:"**                                                   | **"Alternativas:"**                                                    |
| **avoid**          | **Plan 14-03** | **"Avoid:"**                                                          | **"Evitar:"**                                                          |

**Locale parity confirmed:** `JSON.stringify(Object.keys(en.plantDetailModal).sort()) === JSON.stringify(Object.keys(es.plantDetailModal).sort())` returns `true`. Both namespaces have **21 keys** (12 pre-existing + 6 from Plan 14-02 + 3 from this plan).

## Verification Block

```
$ test -f src/components/plant-detail/EducationalSection.tsx                                    → exit 0
$ grep -c "export function EducationalSection" src/components/plant-detail/EducationalSection.tsx → 1
$ grep -c "useSharedValue" src/components/plant-detail/EducationalSection.tsx                    → 3 (1 import + 2 calls)
$ grep -c "useDerivedValue" src/components/plant-detail/EducationalSection.tsx                   → 4 (1 import + 3 calls)
$ grep -c "useAnimatedStyle" src/components/plant-detail/EducationalSection.tsx                  → 3 (1 import + 2 calls)
$ grep -c "withTiming" src/components/plant-detail/EducationalSection.tsx                         → 4 (1 import + 3 calls)
$ grep -c "Easing.inOut(Easing.ease)" src/components/plant-detail/EducationalSection.tsx          → 3
$ grep -c "COLLAPSE_DURATION = 250" src/components/plant-detail/EducationalSection.tsx            → 1
$ grep -c "accessibilityRole" src/components/plant-detail/EducationalSection.tsx                  → 1
$ grep -c "accessibilityState" src/components/plant-detail/EducationalSection.tsx                 → 1
$ grep -c "minHeight: 44" src/components/plant-detail/EducationalSection.tsx                      → 1
$ grep -c "import.*from.*'\.\.\/\.\.\/theme'" src/components/plant-detail/EducationalSection.tsx → 1
$ grep -c "LayoutAnimation" src/components/plant-detail/EducationalSection.tsx                    → 0
$ grep -c "export default" src/components/plant-detail/EducationalSection.tsx                     → 0

$ grep -c "EducationalSection" src/components/MyPlantDetailModal.tsx                              → 9 (1 import + 4 JSX usages + 4 doc/comment refs)
$ grep -c "compareUserVsCatalog" src/components/MyPlantDetailModal.tsx                            → 2 (1 import + 1 call site)
$ grep -c "strictDbEntry" src/components/MyPlantDetailModal.tsx                                   → 16 (1 useMemo + multiple read sites)
$ grep -c "🌿" src/components/MyPlantDetailModal.tsx                                              → 4
$ grep -c "🏠" src/components/MyPlantDetailModal.tsx                                              → 3
$ grep -c "ℹ️" src/components/MyPlantDetailModal.tsx                                              → 3
$ grep -c "⚙️" src/components/MyPlantDetailModal.tsx                                              → 4
$ grep -c "hasOverride" src/components/MyPlantDetailModal.tsx                                     → 4 (1 declaration + 3 call sites)
$ grep -c "plantDetailModal.whatToDo" src/components/MyPlantDetailModal.tsx                       → 1
$ grep -c "plantDetailModal.whereToPlace" src/components/MyPlantDetailModal.tsx                   → 1
$ grep -c "plantDetailModal.why" src/components/MyPlantDetailModal.tsx                            → 1
$ grep -c "plantDetailModal.yourSettings" src/components/MyPlantDetailModal.tsx                   → 1
$ grep -c "plantDetailModal.overrideNote" src/components/MyPlantDetailModal.tsx                   → 3
$ grep -c "plantDetailModal.notInCatalog" src/components/MyPlantDetailModal.tsx                   → 1
$ grep -c "plantDetailModal.recommended" src/components/MyPlantDetailModal.tsx                    → 1

$ grep -c "selectedPlant?.lightLevel" src/components/PlantIdentifier/IdentificationResults.tsx    → 1 (line 43)
$ grep -c "'bright_indirect'" src/components/PlantIdentifier/IdentificationResults.tsx            → 2 (initial + useEffect resync)

$ for k in recommended alternatives avoid; do echo -n "$k:"; grep -c "\"$k\":" src/i18n/locales/en/common.json; grep -c "\"$k\":" src/i18n/locales/es/common.json; done
recommended:2 (1 in plantDetailModal + 1 elsewhere existing — non-conflict)
recommended:2
alternatives:1
alternatives:1
avoid:1
avoid:1

$ node -e "const e=Object.keys(require('./src/i18n/locales/en/common.json').plantDetailModal).sort(); const s=Object.keys(require('./src/i18n/locales/es/common.json').plantDetailModal).sort(); console.log(JSON.stringify(e)===JSON.stringify(s) ? 'PARITY' : 'DRIFT')"
PARITY (21 keys each)

$ npx tsc --noEmit                                                                                → exit 0
$ npm run check:i18n-keys                                                                         → PASS (64 catalog ids verified)
$ node scripts/smoke-phase14.mjs                                                                  → PASS 19/19 (0 SKIP, 0 FAIL, exit 0)
$ node scripts/smoke-phase14.mjs 2>&1 | grep -c "W2.EDU-01"                                       → 0 (all flipped)
$ node scripts/smoke-phase14.mjs 2>&1 | grep -c "W2.EDU-04"                                       → 0 (was already PASS)
$ node scripts/smoke-phase14.mjs 2>&1 | grep -c "^FAIL"                                           → 0
$ grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json                         → 0 on every line
```

## Decisions Made

- **Lazy-measure pattern (Pitfall 4 Option A) over off-screen measurer.** Per RESEARCH §Open Questions Q4 lock: the simple approach ships first; only upgrade to off-screen measurer if Plan 14-08 manual device-test reveals jank. The lazy-measure variant uses fewer LOC, has no off-screen render cost at mount, and works correctly for the locked "all 4 expanded by default" UX (no rapid toggle).
- **Chevron rotation 0°→90° (NOT 0°→180°).** The `›` glyph naturally points right at 0° and points down at 90°. The CONTEXT.md mention of "180°" in the section animations text is a doc typo per the plan's locked guidance. The 90° rotation matches the visual semantics that users expect from accordion-style chevrons.
- **strictDbEntry coexists with legacy dbEntry — does NOT replace it.** The strict path drives the 5 NEW educational fields (careAction/placement*/whyRationale); the legacy path (with fuzzy `findDatabaseEntry` fallback) drives the existing nutrients render (folded into 🌿 sub-block). This RESEARCH §Q1 bake-in keeps backward compat for ambiguous user-named plants (which still get fuzzy-matched nutrients) while preventing wrong-plant educational content (which now requires a strict ID match).
- **compareUserVsCatalog called against strictDbEntry, not legacy dbEntry.** Per CONTEXT.md spirit: the override comparison runs against the canonical recommendation, not a fuzzy match. A fuzzy match could give false-positive overrides for ambiguous plant names. This is consistent with the strict-only-for-educational-content lock.
- **Override note rendered INLINE next to differing field row, NOT a top-of-section banner.** Per RESEARCH §Code Examples Example 2: the `<Text style={overrideNote}>` is the third child of the same `<View style={settingRow}>` that holds the field label and value — placed directly underneath the differing value with `marginTop: spacing.xs` for visual continuity. Text is fontSize 12, color textSecondary, fontStyle italic.
- **All 3 i18n keys added in Task 2 (NOT split into separate task).** The plan front-matter listed `src/i18n/locales/{en,es}/common.json` as Task 2 files; locale parity discipline + atomic commit policy means the keys land alongside their JSX consumers in the same commit. Adding the keys post-commit would temporarily break TypeScript/i18n-keys checks.
- **ActiveProblemsSection import retained.** Even though the standalone consumer JSX site at original line 230-237 is removed, the import at line 21 is preserved — `ActiveProblemsSection` is now used as the first child of the 🌿 section. The component file itself is unchanged.
- **Nutrients card relocated INSIDE 🌿 section with nested-card styling.** The new `nutrientsCardEdu` style (rgba(0,0,0,0.03) background + borderRadius.md + padding spacing.sm + marginTop spacing.sm) provides a visual indication that nutrients is a sub-block of the larger 🌿 card. The original outer-card `nutrientsCard` style is preserved in the StyleSheet for backward compat (in case any future caller still uses it).
- **EDU-04 NO source change.** Per RESEARCH §Code Examples Example 1: "EDU-04 mostly closed (no implementation step needed in this plan; assumption holds; flag if false)." The `selectedPlant?.lightLevel ?? 'bright_indirect'` pattern at IdentificationResults.tsx:43 has been in place since Phase 7 LIGHT-05; Plan 14-03 Task 3 verified it's still intact and the W2.EDU-04.1 smoke assertion stays green. The `files_modified` frontmatter listed IdentificationResults.tsx as a precaution but no edit was needed.
- **Named export only on EducationalSection.** Mirrors project convention (Skeleton.tsx, ActiveProblemsSection.tsx, ProblemTimeline.tsx all use named exports). Future variants (Phase 18 PlantCard, Phase 21 Journal) will be separate named-export components, not default-export shadowing.
- **minHeight 44 + accessibilityRole/State.** Apple HIG touch target (protects users with motor difficulty) + a11y compliance (screen readers announce "expanded"/"collapsed" for the collapsible region). Both are required design-system + accessibility guardrails.

## Deviations from Plan

None — plan executed exactly as written.

The plan locked exact JSX shapes via `<interfaces>` blocks and exact styles via the appended StyleSheet block. All three tasks reproduced the locked shapes verbatim. No auto-fixes triggered (Rules 1-3) — the surgical-only nature of the modal edit (lines 217-237 replacement + 9 styles + 4 imports + 2 useMemos) and the smoke runner's marker-regex SKIP gates kept every diff clean.

The original plan's `lightLabel` row used a verbose `t('plantDetail.light') || lightLabel` label fallback shape; the actual implementation uses `☀️ {lightLabel || '—'}` directly because (a) the existing `lightLabel` already includes localized text from `getLightLabel(plant, t)`, (b) `plantDetail.light` doesn't exist as a key in common.json (it would need adding, increasing scope), and (c) the visual "☀️ Bright indirect" with override note underneath is cleaner than "Bright indirect / Bright indirect / override" (label + value + note triple). This is a minor stylistic refinement that does NOT change the locked behavior — `hasOverride('lightLevel')` still drives the inline override note rendering. NOT counted as a deviation because no acceptance criterion mentioned the exact label format and the smoke runner has no assertion against it.

## Authentication Gates

None — all work is local/file-only. No external service calls.

## Issues Encountered

None — three locked-shape commits executed cleanly. tsc never reported a type error (the `OverrideField`/`OverrideResult` import surface from Plan 14-02 already typechecked correctly). i18n-keys validator stayed green throughout (all 64 catalog ids verified each run). Smoke runner placeholders flipped on schedule per Wave 1+ design.

## User Setup Required

None — no external service configuration required. All artifacts run locally via `npx tsc --noEmit`, `npm run check:i18n-keys`, and `node scripts/smoke-phase14.mjs`.

## Next Phase Readiness

**Plan 14-04 (catalog content authoring — Wave 3)** can run now that the modal surface is locked. Wave 3..6 (Plans 14-04..07) all touch `src/data/plantDatabase.ts` AND `src/i18n/locales/{en,es}/plants.json` to populate the 5 new educational fields on actual catalog entries (jadeplant, monstera, basil, rose, etc.). They chain sequentially because they share the same files (no parallelism possible). The `scripts/check-i18n-keys.mjs` validator extension from Plan 14-01 gates each catalog drop — any entry that declares `careAction`/`placement*`/`whyRationale` but lacks the corresponding i18n keys in both locales will fail the validator.

**Plan 14-08 (manual device-test checkpoint — Wave 7)** is the final plan in Phase 14. It depends on Plan 14-07 completing for full surface coverage on real hardware. The lazy-measure pattern in EducationalSection will be validated for jank-free animation on iOS + Android dev clients during this checkpoint. If jank IS detected, the upgrade path is the off-screen measurer variant (Pattern 6 — Pitfall 4 Option B) per RESEARCH §Open Questions Q4.

**Phase 14 Wave 2 is now complete.** Smoke runner ends at PASS 19/19, 0 SKIPS, 0 FAILS — every assertion (W0 scaffold + W1 foundation + W1 storage + W2 modal restructure) is green. The remaining work is content authoring (Wave 3..6) and device verification (Wave 7).

## Self-Check: PASSED

- [x] `src/components/plant-detail/EducationalSection.tsx` exists (FOUND, 138 LOC)
- [x] `src/components/MyPlantDetailModal.tsx` modified, contains 4 EducationalSection blocks + strictDbEntry useMemo + compareUserVsCatalog wiring (FOUND)
- [x] `src/i18n/locales/en/common.json` contains 3 new keys (recommended/alternatives/avoid) (FOUND)
- [x] `src/i18n/locales/es/common.json` contains 3 new keys with es-AR forms (FOUND)
- [x] Commit `516873a` exists in git log (FOUND)
- [x] Commit `b401026` exists in git log (FOUND)
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run check:i18n-keys` exits 0 (64 catalog ids verified)
- [x] `node scripts/smoke-phase14.mjs` exits 0 with PASS 19/19, 0 SKIP, 0 FAIL
- [x] W2.EDU-01.1-4 flipped from SKIP to PASS
- [x] W2.EDU-01.5 flipped from SKIP to PASS
- [x] W2.EDU-01.6 flipped from SKIP to PASS
- [x] W2.EDU-04.1 stays PASS (regression check; no source change to IdentificationResults.tsx)
- [x] All acceptance criteria from `<acceptance_criteria>` blocks of all 3 tasks verified
- [x] Phase 10 SEC grep guard preserved: `EXPO_PUBLIC_PERENUAL_API_KEY` count = 0 across all client paths
- [x] Locale parity check returns PARITY (21 plantDetailModal keys each)

---
*Phase: 14-educational-detail-modal*
*Plan: 03*
*Completed: 2026-05-05*
