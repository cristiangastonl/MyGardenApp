---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Recommendation-First Plant Guide
current_plan: 2 of 5
status: verifying
stopped_at: Completed 15-01-PLAN.md
last_updated: "2026-05-07T14:40:56.053Z"
last_activity: "2026-05-07 — Phase 15 Plan 01 complete (Wave A Sub-batch A — 12 interior-tropical entries). 3 files modified (plantDatabase.ts +411 LOC; es/plants.json +240 LOC; en/plants.json +240 LOC). 2 tasks, 12 min. Catalog 64 → 76 entries. Smoke runner: PASS 34/81. Voseo baseline preserved at 2. Zero deviations — pre-write voseo regex sweep + char-limit-from-draft both worked first try."
progress:
  total_phases: 15
  completed_phases: 5
  total_plans: 30
  completed_plans: 28
  percent: 93
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Current focus:** v1.2 Recommendation-First Plant Guide — Phase 10 ready to plan (Perenual Security: move API key server-side before any catalog work).

## Current Position

Phase: 15 of 24 (Catalog Wave A — Interior Tropicals) — IN PROGRESS
Current Plan: 2 of 5
Plan: 15-01 complete (2/5 plans in Phase 15 — Wave A Sub-batch A: 12 interior tropicals, Aroceous + Foliage especial). Phase 14 Plan 14-08 (manual device verification checkpoint, autonomous: false) and Plan 13-03 (manual device verification) still pending.
Status: **Phase 15 Wave A Sub-batch A landed.** Catalog grows from 64 → 76 entries. 12 interior-tropical PlantDBEntry rows added (anthurium, alocasia, caladium, singonio, aglaonema, costilla-adan, difenbaquia, begonia-rex, croton, fitonia, ficus-lyrata, maranta) — all with full Phase 14 EDU shape (5 legacy + 5 EDU fields), all `category: "interior"` + `outdoor: false`, all `waterMode: "soil_check"` + `careAction.soilCheck`. ES + EN i18n keysets shipped in lockstep (240 LOC each); voseo discipline preserved at baseline 2 (zero new regressions); whyRationale max 198 chars (ES) / 189 (EN), all ≤250 ceiling. Phase 15 smoke runner: PASS 34/81 (was 10/81), 24 SKIP→PASS flips (12 CAT-09 ids + 12 CAT-10 keysets); CAT-09 count assertion still SKIP at 76 (waits on Plan 15-02 to land remaining 11 ids → 87). `npm run check:i18n-keys` PASS — 76 catalog ids verified across both locales. `npx tsc --noEmit` clean. Plan 15-02 (Wave B Sub-batch B) is unblocked and ready.
Last activity: 2026-05-07 — Phase 15 Plan 01 complete (Wave A Sub-batch A — 12 interior-tropical entries). 3 files modified (plantDatabase.ts +411 LOC; es/plants.json +240 LOC; en/plants.json +240 LOC). 2 tasks, 12 min. Catalog 64 → 76 entries. Smoke runner: PASS 34/81. Voseo baseline preserved at 2. Zero deviations — pre-write voseo regex sweep + char-limit-from-draft both worked first try.

Progress: [█████████░] 93% (v1.2 in progress — 28/30 plans complete in tracked window; Phase 14 Plan 14-08 + Phase 13 Plan 03 + Phase 15 Plans 15-02..04 + Phases 16-24 still ahead)

## Performance Metrics

**Velocity:**
- Total plans completed (v1.0+v1.1): 39
- Average duration: ~9 min (v1.0), ~8 min (v1.1)
- Total execution time: ~5.2 hours across v1.0+v1.1

**Recent Trend (v1.2 Phase 14):**
- Plan 14-00 (Wave 0 scaffold): ~3 min, 1 task, 3 files
- Plan 14-01 (Wave 1 foundation): ~13 min, 3 tasks, 3 files
- Plan 14-02 (Wave 1 storage guard + override + labels): ~11 min, 3 tasks, 4 files
- Plan 14-03 (Wave 2 modal restructure): ~12 min, 3 tasks, 4 files
- Plan 14-04 (Wave 3a interior catalog content): ~22 min, 1 task, 3 files
- Trend: Stable; content-authoring plans run longer than scaffold/structure plans (expected: 75 strings × 2 locales)

| Phase-Plan | Duration | Tasks | Files |
| ---------- | -------- | ----- | ----- |
| 14-00      | 3min     | 1     | 3     |
| 14-01      | 13min    | 3     | 3     |
| 14-02      | 11min    | 3     | 4     |
| 14-03      | 12min    | 3     | 4     |

*Updated after each plan completion*
| Phase 14 P04 | 22min | 1 tasks | 3 files |
| Phase 14 P06 | 46min | 1 tasks | 3 files |
| Phase 14 P07 | 26min | 1 tasks | 3 files |
| Phase 15 P00 | 3min | 2 tasks | 4 files |
| Phase 15 P01 | 12min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key v1.2 pre-decisions locked during research:

- **GAM split (Phase 18 vs 22):** GAM-03/04 (mood emoji replaces health badge) ship with PlantCard in Phase 18 — they define PlantCard's 5-element layout. GAM-01/02/05 (toasts, haptics, streak policy) ship in Phase 22 after all task types exist.
- **Two-AppContent-paths discipline extended:** `BottomSheetModalProvider` must land in BOTH AppContentMVP and AppContentFull in the same commit (CRIT-4). Grep count = 2 enforced by Phase 13 smoke.
- **CRIT-1 deep-merge guard:** `updatePlant` must never overwrite user-customized values with catalog defaults. EDU phase establishes the pattern; all pickers inherit it.
- **Journal photos in FileSystem:** `JournalEntry.photoUri` must be a `documentDirectory` file path — never base64 in AsyncStorage (CRIT-3).
- **Fertilize is free; fertilize push notifications are opt-in:** `FERTILIZE_SCHEDULE` feature flag from day one (MOD-9).
- **Pet toxicity sourced from ASPCA only:** No AI-only toxicity classification; ASPCA source URL required per entry in code comment (CRIT-2).
- **`ReanimatedSwipeable` banned:** iOS crash bug with RNGH 2.28 + Reanimated 4.1; use `Gesture.Pan()` directly for all swipe gestures.
- **Edge function dual-payload backward-compat:** `!!ctx.waterSchedule` discriminator sunset decision deferred to Phase 24 (DOCS).
- [Phase 10]: SEC-02: PERENUAL_API_KEY moved server-side via Deno.env.get in get-plant-care edge function; response envelope { data: PerenualPlantDetail | null } enables clean null-fallback chain in client
- [Phase 10]: SEC-01/SEC-03: fetchFromPerenual() rewired to supabase.functions.invoke('get-plant-care'); EXPO_PUBLIC_PERENUAL_API_KEY removed from all client-bundle paths; gap window until Plan 10-03 deploy is expected degraded state
- [Phase 10]: SEC-05: CLAUDE.md updated with get-plant-care deploy docs, PERENUAL_API_KEY secret docs, and pre-submit grep guard; PROJECT.md Key Decisions row added with rotation-deferred wording
- [Phase 11-perenual-data-quality]: Phase 11-00: Stubs written at runtime via writeFileSync (scripts/.tmp-phase11/ is gitignored); W0.10 assertion uses split-match for multi-line invoke call
- [Phase 11-01]: DATA-01: isGoodMatch uses bidirectional lowercase().includes() per spec lock — inserted between search and details fetch in get-plant-care edge function; mismatch returns { data: null } status 200
- [Phase 11-01]: PerenualPlantDetail in edge function gains family?: string and type?: string (schema parity with client service Plan 11-02)
- [Phase 11]: parseHardiness returns tempMax: null when hardiness.max absent; caller (convertPerenualToKnowledge) applies classifyTempMaxFallback with 4 anchors (cactus 40, tropical 32, fría 28, templada 35)
- [Phase 11]: inferHumidity: family-first classification (Araceae/Orchidaceae/Bromeliaceae→alta; Cactaceae/Crassulaceae→baja; type substring fallback; media default) — DATA-03
- [Phase 11]: DATA-04 ≥80% threshold not achievable on Perenual free tier (paywall on family/type/hardiness/indoor fields). Implementation DATA-01..03 verified correct (31/31 smoke + live mismatch validator). Code is forward-compatible for future API upgrade. Carry-forward: consider Perenual premium or alternative provider (Trefle, GBIF, USDA PLANTS) in milestone closeout.
- [Phase 12-unknown-plant-tracking]: AsyncStorage stub gitignored; runner writes stub at startup via writeFileSync (mirrors Phase 11 pattern)
- [Phase 12-unknown-plant-tracking]: Phase 12-00: 7 TRACK-01 assertSkippableAsync placeholders wired in smoke runner; flip SKIP→PASS when Plan 01 lands trackUnknownPlant + getUnknownPlantsReport
- [Phase 12-unknown-plant-tracking]: Smoke runner P1.1-P1.5 stub imports changed from cache-busted bare URL so removeItem operates on same Map singleton as tracker; dual try/catch pattern for silent fire-and-forget service
- [Phase 12-unknown-plant-tracking]: Alert.alert for dev report (not Modal) per CONTEXT.md lock — dev-only feature
- [Phase 12-unknown-plant-tracking]: TRACK-02: findPlantInDatabase used as catalog-miss gate in getEnrichedPlantData; fire-and-forget void trackUnknownPlant(plantName).catch(() => {}); only plantName passed (commonName/family undefined at this call site)
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-00: smoke-phase13.mjs sheds ts-transpile compilation block from Phase 11/12 pattern — Phase 13 is config + JSX wrapping (not runtime logic), so file-content asserts via readFileSync + regex are sufficient and ~5x faster
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-00: provider-count placeholders (BottomSheetModalProvider + GestureHandlerRootView) locked at `c === 3` (1 import + 1 JSX opening tag + 1 JSX closing tag) — encodes ROADMAP success criterion as smoke-runner invariant; SKIP at c=0 (Wave 0 baseline), PASS only at c=3 (locked shape)
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-00: babel.config.js conditional placeholder always evaluates (no SKIP) — absence is preferred state under Expo SDK 54 + babel-preset-expo auto-management; returns true when file absent → counts as PASS on Wave 0 baseline
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-01: Used `npx expo install` (NEVER `npm install`) for all 4 native deps per CONTEXT.md lock; @gorhom/bottom-sheet resolved to ^5.2.13 (latest 5.2.x patch under the ^5.2.11 caret); single App-root wrap above Features.AUTH branch — both AppContent paths inherit context via React context propagation, no per-AppContent duplication
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-02: Skeleton ships with NO variants exported (YAGNI lock) — Phase 14/21 callers will add SkeletonText/Card/Image when a real consumer needs them; fixed 200px translateX sweep range (no measured-width threading)
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-02: triggerHaptic returns void synchronously — Haptics.*Async promises explicitly discarded, no await/then; mirrors Phase 12 unknownPlantTracker.ts silent fire-and-forget pattern with try/catch + console.warn in __DEV__ + swallow in production
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-02: useDismissOnPaywall ships unused in Phase 13 — Phase 14 (educational modal) and Phase 21 (journal quick-add) will be the first consumers, opting in via one-line `useDismissOnPaywall(sheetRef)` after their `useRef<BottomSheetModal>(null)` line; locks the API surface NOW
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-02: BottomSheetModal placement at screen-component level (sibling of ScrollView, NOT inside) — gorhom's portal-based modal needs a stable parent for portaling to App-root BottomSheetModalProvider
- [Phase 13-gesture-bottom-sheet-infrastructure]: Plan 13-02: i18n convention discovered — common.json file has NO top-level `common.*` namespace despite the file name; close-button keys live at `diagnosis.close` + `plantDetailModal.close`. Plan 13-02 added `settings.devTestBottomSheetClose` instead of reusing non-existent `common.close` (Rule 3 deviation). Phase 24 DOCS may want to document this convention.
- [Phase 14-educational-detail-modal]: Plan 14-00: Hybrid smoke runner — file-content asserts (modal/JSX) + ts.transpileModule (overrideDetection.ts behavioral) in one harness; 6 W0 scaffold PASSes + 12 SKIP placeholders + 1 EDU-04 regression PASS; baseline = PASS 7/19, 0 FAIL, exit 0
- [Phase 14-educational-detail-modal]: Plan 14-00: Heuristic SKIP gate — each EDU placeholder uses marker-regex sentinel (e.g., /careAction|placementRecommended|whyRationale/) so partial-shape Wave 1 commits FAIL loudly instead of silently SKIPping; prevents false PASS during in-progress work
- [Phase 14-educational-detail-modal]: Plan 14-00: EDU-04 has NO SKIP gate — selectedPlant?.lightLevel ?? pre-select pattern at IdentificationResults.tsx:42-44 (Phase 7) is regression-checked, MUST PASS at baseline
- [Phase 14-educational-detail-modal]: Plan 14-00: Stubs auto-written at runtime via writeFileSync (mirrors Phase 11/12) — scripts/.tmp-phase14/{async-storage,i18n}.mjs are gitignored, NOT committed; explicit scripts/.tmp-phase14/ added to .gitignore alongside existing wildcard
- [Phase 14]: Plan 14-02: PROTECTED_USER_FIELDS const tuple + single fromUserEdit flag in useStorage.updatePlant — guard runs BEFORE alias-rewrite; existing[key] !== undefined check; key in normalizedUpdates check; no retrofit of 7 existing call sites (audit confirmed all touch non-protected fields)
- [Phase 14]: Plan 14-02: compareUserVsCatalog detects 3 fields (lightLevel, waterScheduleWarm, waterScheduleCold) — tempMin/tempMax/humidity climate-driven; waterMode category-derived; all excluded per CONTEXT.md lock; field discriminator camelCase strings (waterScheduleWarm not waterSchedule.warm) for i18n key suffix compatibility
- [Phase 14]: Plan 14-02: ES overrideNote locked verbatim from REQUIREMENTS.md line 43 — 'Diferente a la recomendación para esta especie. ¿Querés ajustar?' (voseo); 6 plantDetailModal keys land inside existing namespace with locale parity (jq keys identical); EN tone non-pushy ('Want to adjust?' not 'You should adjust')
- [Phase 14]: Plan 14-01: PlantDBEntry gains 5 optional educational fields (careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale) plus new CareAction interface; getTranslatedPlant surfaces them via i18n indirection mirroring nutrients pattern; check-i18n-keys.mjs extended with 5 conditional checks (careAction sub-fields independent per Pitfall 5)
- [Phase 14]: Plan 14-03: EducationalSection.tsx (138 LOC NEW) uses Reanimated v4 lazy-measure pattern (Pitfall 4 Option A — useSharedValue + 3× useDerivedValue + 2× useAnimatedStyle drive height/opacity/chevron rotation tied to single open shared value at 250ms with Easing.inOut(Easing.ease)); chevron rotates 0°→90° (CONTEXT.md "180°" was doc typo); per-modal-session useState only (NO AsyncStorage)
- [Phase 14]: Plan 14-03: MyPlantDetailModal restructure — strictDbEntry useMemo (getCatalogEntry strict only) coexists with legacy dbEntry (3-rung fuzzy fallback) — strict drives 5 NEW educational fields, legacy drives nutrients backward compat; compareUserVsCatalog called against strictDbEntry to prevent false-positive overrides on ambiguous user-named plants; override note rendered INLINE next to differing settingRow (not top-of-section banner) per RESEARCH §Example 2
- [Phase 14]: Plan 14-03: ¿Por qué? section uses {strictDbEntry?.whyRationale && <EducationalSection .../>} — entire header+content hide together when single backing field absent; other 3 sections render unconditionally with sub-block-level graceful hiding via per-field conditional ternaries
- [Phase 14]: Plan 14-03: ActiveProblemsSection import retained (still used inside 🌿 section); standalone consumer JSX site at original line 230-237 removed; nutrients card relocated INSIDE 🌿 with nutrientsCardEdu nested-card styling (rgba 0,0,0,0.03 background)
- [Phase 14]: Plan 14-03: EDU-04 NO source change — selectedPlant?.lightLevel ?? 'bright_indirect' pattern at IdentificationResults.tsx:43 intact since Phase 7 LIGHT-05; W2.EDU-04.1 smoke regression check stays PASS after modal restructure (which doesn't touch IdentificationResults.tsx)
- [Phase 14]: Plan 14-03: 3 new sub-block i18n keys (recommended/alternatives/avoid) land alongside JSX consumers in same Task 2 commit (atomic surface lock); locale parity preserved at 21 plantDetailModal keys each (was 18 after Plan 14-02); ES voseo-friendly forms (Recomendado:/Alternativas:/Evitar:)
- [Phase 14]: Plan 14-04: Wave 3a interior catalog content (15 entries × 5 educational fields × 2 locales = 225 content units); 100% per-entry coverage on all 5 fields exceeds ≥80%/≥90% targets; whyRationale physiology-mechanism citation per entry (sotobosque/CAM/hemiepífita/suculenta xerófita); careAction sub-field per waterMode (12× fixed, 2× soilCheck, 1× both for sansevieria); voseo regression count maintained at baseline 2; locale parity 15/15
- [Phase 14]: Plan 14-04: Voseo grep guard caught 'mueve sus hojas' in calathea whyRationale draft (third-person descriptive verb form, false-positive on regex); reworded to 'reorienta sus hojas' to keep regex baseline at 2 (no NEW Castilian forms)
- [Phase 14]: Plan 14-04: Initial whyRationale drafts had 13/15 entries 252-312 chars (over 250 ceiling); systematic trim pass on ES + EN + catalog defaults brought all 15 to ≤250 chars while preserving physiology mechanism citation
- [Phase 14]: Plan 14-06: char-limit-from-draft discipline — all 18 whyRationale strings drafted ≤250 chars from start (max 241); avoids the post-hoc refactor pattern from Plan 14-05
- [Phase 14]: Plan 14-06: aromaticas vs huerta thematic batch — both share cosecha-driven verbs (cosechá/pellizcá/cortá/sembrá) but diverge on whyRationale framing (aromaticas use climate-of-origin Mediterráneo/Frigorial/Tropical/Subtropical; huerta use family-level ecology Solanáceas/Cucurbitáceas/Brassicáceas/Apiáceas/Rosáceas/Asteráceas)
- [Phase 14]: Plan 14-06: Voseo regression on frutilla 'se riega al pie' (3rd-person reflexive matched regex); reworded to 'el riego va al pie' (verb→noun phrase) to keep baseline at 2; ciboulette self-reference in placementAlternatives caught and fixed (replaced with cilantro)
- [Phase 14-educational-detail-modal]: Plan 14-07: FULL CATALOG COVERAGE achieved — 64/64 entries (100%) declare all 5 EDU-02/03 educational fields. 10 frutales+suculentas × 5 fields × 2 locales = 150 content units. Frutales family-lexicon framing (Rutáceas/Lauráceas/Moráceas, 5 citations); suculentas CAM-photosynthesis marquee mechanism (cited in 5/5).
- [Phase 14-educational-detail-modal]: Plan 14-07: 3 citrus rationales distinct (limonero perpetual; naranjo seasonal+heat; mandarino compact+early). All 5 suculentas use careAction.soilCheck per waterMode discipline; all 5 frutales use careAction.fixed. haworthia is the rare shade-tolerant exception with translucent leaf-windows mechanism layered on top of CAM.
- [Phase 14-educational-detail-modal]: Plan 14-07: Char-limit-from-draft + inline-trim discipline applied. 9 of 10 initial drafts ran 251-312 chars; trimmed catalog defaults inline BEFORE mirroring to JSON (avoiding the 14-04 trim-the-i18n-after-the-fact pattern). Final max = 249 chars (naranjo).
- [Phase 15]: Plan 15-00: CJS smoke runner (.cjs) per VALIDATION.md lock — Phase 15 is content-only so file-content asserts via readFileSync + regex are sufficient (no ts.transpileModule unlike Phase 14)
- [Phase 15]: Plan 15-00: PHASE_15_SCIENTIFIC_NAMES species-qualified ('Dieffenbachia seguine' not 'Dieffenbachia') for IDENT.CAT-11 exact match; CAT-11 COMMON_NAMES_ES gate accepts EITHER species-qualified OR genus-only as legacy compat
- [Phase 15]: Plan 15-00: Single-source PHASE_15_LANDED_FLAGS array shared across CAT-09 per-id, CAT-09 count (idMatches > 64 && < 87 → SKIP), AND IDENT.CAT-11 — runner stays exit-0 at Plan 15-01 (12 ids → 76) → Plan 15-02 (final 11 → 87) midpoint
- [Phase 15]: Plan 15-00: Wave 0 baseline PASS 10/81 / 71 SKIP / 0 FAIL exit 0 (10 = 9 scaffold + 1 voseo regression). SKIP→PASS flip sentinels: anyLanded for 15-01/02; 'Maranta leuconeura' in plantIdentification.ts for 15-03; 'Phase 15' substring in CLAUDE.md for 15-04. Runner is NEVER edited again after this plan
- [Phase 15]: Plan 15-01: All 12 Sub-batch A entries use waterMode soil_check + careAction.soilCheck — interior tropics need finger-test discipline because temp/humidity drive evapotranspiration; fixed schedules can't span variable-dormancy entries (alocasia, caladium)
- [Phase 15]: Plan 15-01: Pre-write voseo regex sweep + char-limit-from-draft both worked first try across 12 entries — zero rewordings, zero post-hoc trims (vs Phase 14-04/06 which caught regressions mid-authoring). Discipline is compounding.
- [Phase 15]: Plan 15-01: Aroceous (7) physiology rationales kept distinct per genus mechanism (spathes / capillary veins / tuber dormancy / heteroblasty / low-light chlorophyll / fenestrations vs M. deliciosa / oxalate stems); Foliage especial (5) anchored on pigment-vs-light (anthocyanins+carotenoids) + nyctinasty + understory adaptation. No copy-paste rationales.

### Pending Todos

None yet for v1.2.

### Blockers/Concerns

- **Phase 13 (INFRA):** Active bug reports on `@gorhom/bottom-sheet` v5.2.11+ with Expo SDK 54 (issues #2528, #2471). Code installation + provider wrap + dev-tools test surface all clean (Plans 13-00/01/02). Plan 13-03 (manual device verification checkpoint) is the gate — iOS + Android dev clients need to be rebuilt and the Test bottom sheet exercised. Fallback if regression: custom `Animated.View` + `PanResponder` for 2-3 action-sheet use cases.
- **Phase 15 (CAT Wave A):** Wave 3.6 trepadoras/colgantes species names are TBD — one research pass needed at Phase 16 planning time.
- **v1.1 manual ops backlog:** Device tests (~27 scenarios), edge function deploys (`chat-diagnosis` + `diagnose-plant`), 15 catalog image uploads — all batched at milestone end per user preference.

## Session Continuity

Last session: 2026-05-07T14:40:56.050Z
Stopped at: Completed 15-01-PLAN.md
Resume file: None
