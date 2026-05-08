---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Recommendation-First Plant Guide
current_plan: 5 of 5
status: completed
stopped_at: Completed 17-03-PLAN.md (parallel with 17-04)
last_updated: "2026-05-08T16:30:30.482Z"
last_activity: 2026-05-08 — Phase 17 Plan 04 complete (CAT-20 image-plan documentation; Phase 17 Wave C accepted-known block appended to CLAUDE.md; v1.2 catalog expansion fully closed at 118 entries; Phase 17 fully closed). 1 file, 1 task, ~2 min.
progress:
  total_phases: 15
  completed_phases: 8
  total_plans: 40
  completed_plans: 41
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Current focus:** v1.2 Recommendation-First Plant Guide — Phase 10 ready to plan (Perenual Security: move API key server-side before any catalog work).

## Current Position

Phase: 17 of 24 (Catalog Wave C — Exterior + Aromáticas + Frutales) — **COMPLETE**
Current Plan: 5 of 5
Plan: 17-04 complete (CAT-20 image-plan documentation closure — Phase 17 Wave C accepted-known block appended to CLAUDE.md, +8 LOC; cumulative v1.2 image backlog 69 entries: 15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17; W3.CAT-20.imagePlan SKIP→PASS in all 3 phase17-smoke modes). Phase 17 fully closed in parallel with Plan 17-03 (COMMON_NAMES_ES routing closure landed first, file-disjoint).
Status: **Phase 17 COMPLETE.** Plan 17-04 (this plan) appended the "Phase 17 Wave C, v1.2 — 14 entries — image upload pending" accepted-known block to CLAUDE.md between the Phase 16 Wave B closing paragraph and the shared "Image upload steps:" numbered list. 14 ids in 3 sub-batch lines: 8 exterior flores (azalea/ciclamen/fucsia/clavel/crisantemo/tulipan/girasol/magnolia) + 3 aromáticas (salvia-officinalis/eneldo/stevia) + 3 frutales/huerta (olivo/arandano/espinaca). Closing paragraph cites cumulative 69-entry v1.2 backlog and explicit milestone-closure language ("Phase 17 closes the v1.2 catalog expansion at 118 entries"). 4 separate Accepted-known blocks now coexist in CLAUDE.md (Phase 8 v1.1 + Phase 15 Wave A + Phase 16 Wave B + Phase 17 Wave C); shared Image upload steps numbered list remains cross-cutting. CAT-20 image-plan portion CLOSED: phase17-smoke default 40/54, --identification 54/68, --routing-fix 68/68 full PASS (was 39/54 / 53/68 / 67/68 pre-plan — +1 PASS each). Cross-phase regressions clean: phase15 81/81, phase16 69/69, tsc 0 errors, check:i18n-keys PASS at 118 ids, voseo regex baseline preserved at 2. **v1.2 catalog expansion FULLY CLOSED** — Phase 17 is the final catalog wave; PLANT_DATABASE locked at 118 entries (64 v1.1 + 54 v1.2 net-add: 23 Phase 15 + 17 Phase 16 + 14 Phase 17). All 5 Phase 17 requirements PASS (CAT-17/18/19/20/21). **Next:** Phase 18 (PlantCard Cleanup + Mood Emoji) — depends on Phase 17 (full 118-entry catalog ✓) + Phase 13 (gesture infrastructure ✓ already landed).
Last activity: 2026-05-08 — Phase 17 Plan 04 complete (CAT-20 image-plan documentation; Phase 17 Wave C accepted-known block appended to CLAUDE.md; v1.2 catalog expansion fully closed at 118 entries; Phase 17 fully closed). 1 file, 1 task, ~2 min.

Progress: [██████████] 100% (v1.2 in progress — Phase 16 fully closed; Phase 14 Plan 14-08, Phase 13 Plan 03, Phases 17-24 still ahead)

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
| Phase 15 P02 | 10 min | 2 tasks | 3 files |
| Phase 15 P03 | 2 min | 1 tasks | 1 files |
| Phase 15 P04 | 3 min | 1 tasks | 1 files |
| Phase 16 P00 | 7min | 3 tasks | 5 files |
| Phase 16 P01 | 18min | 2 tasks | 4 files |
| Phase 16 P02 | 32min | 2 tasks | 3 files |
| Phase 16 P03 | 12min | 1 tasks | 1 files |
| Phase 16 P04 | 3min | 1 tasks | 1 files |
| Phase 17 P00 | 4min | 2 tasks | 3 files |
| Phase 17 P01 | 8min | 2 tasks | 4 files |
| Phase 17 P02 | 7min | 2 tasks | 3 files |
| Phase 17 P04 | 2min | 1 tasks | 1 files |
| Phase 17 P03 | 1min | 1 tasks | 1 files |

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
- [Phase 15]: Plan 15-02: Sub-batch B 11-entry append uses waterMode soil_check + careAction.soilCheck for ALL 11 entries (no fixed) — interior tropicals need finger-test discipline because temp/humidity drive evapotranspiration variably; fixed schedules can't span palmera-areca's 2x cold/warm spread or helecho-boston's 3-day cycle
- [Phase 15]: Plan 15-02: Cheflera scientificName = Heptapleurum arboricola per 2024 POWO reclassification (was Schefflera arboricola); whyRationale explicitly cites the reclassification as user-facing anchor. Arbol-dinero scientificName = Pachira aquatica per Open Question 2 lock.
- [Phase 15]: Plan 15-02: Per-sub-type physiology citation matrix — CAM succulent 2x (rizomas+CAM zamioculca / hojas-carnosas+CAM cola-burro), trepadora 1x (raicillas adventicias hiedra), Arecaceae 2x (sotobosque areca / Lord Howe shaded-forest kentia), helecho 2x (esporofito-sin-almacén boston / epífito-nido nido), all-rounder 4x (Yunnan-rizomas pilea / antocianinas tradescantia / 2024-POWO cheflera / pantanos-tronco arbol-dinero). Zero copy-paste rationales.
- [Phase 15]: Plan 15-03: COMMON_NAMES_ES extension is APPEND-ONLY when adding catalog batches — never modify existing entries; verify with git diff |grep '^-' returning 0. Extension closed CAT-11 with 26 net new entries (21 Phase 15 canonical + 5 PlantNet synonym aliases for taxonomic-drift coverage).
- [Phase 15]: Plan 15-03: Taxonomic disambiguation confirmed — costilla-adan = Monstera adansonii (species-qualified, distinct from existing Monstera deliciosa→Monstera entry); arbol-dinero = Pachira aquatica canonical + Pachira glabra alias; cheflera = Heptapleurum arboricola (POWO 2024) + Schefflera arboricola legacy alias; ficus-lyrata = Ficus lyrata canonical + Ficus pandurata older-synonym alias.
- [Phase 15]: Plan 15-03: PlantNet → curated catalog routing closure relies on three-tier matching in findPlantInDatabase — exact scientificName, genus prefix, OR species-qualified key — combined with COMMON_NAMES_ES fallback for display-name resolution when PlantNet returns species not in PLANT_DATABASE. Synonym alias pattern (≤2 per entry) absorbs taxonomic drift without diluting canonical mappings.
- [Phase 15]: Plan 15-04: CAT-12 image plan documentation — single grouped block per phase (NOT 23 individual lines) following v1.1 LATAM 15-entry precedent format. Insert location between v1.1 list end and shared "Image upload steps" numbered list — keeps the upload procedure cross-cutting between Phase 8 and Phase 15 backlogs without duplication.
- [Phase 15]: Plan 15-04: Sub-batch grouping order in CLAUDE.md block matches Plans 15-01/02 catalog append order — Aroceous (7) + Foliage especial (5) + CAM (2) + Trepadora (1) + Palmera (2) + Helecho (2) + All-rounder (4) = 23 — readers can cross-reference plantDatabase.ts in physiology-grouped reading flow.
- [Phase 15]: Plan 15-04: Smoke runner sentinel pattern locked: CLAUDE.md substring + ≥N-of-M id-mention threshold flips a SKIP→PASS for documentation-only requirements (no source code change). Phase 15 closure pattern reusable in Phase 16 (CAT Wave B) and beyond when image deferral repeats.
- [Phase 15]: Plan 15-04: Image upload backlog totals 38 entries (15 v1.1 + 23 v1.2 Phase 15) — batched at v1.2 milestone end per established v1.1 milestone-end batching pattern. `npm run check:images` failures for these 38 entries are NOW documented in CLAUDE.md and explicitly NOT a ship blocker.
- [Phase 16]: Plan 16-00: phase16-smoke.cjs adds ts.transpileModule + Module._resolveFilename intercept path for runtime findPlantInDatabase routing assertions (Phase 15 was file-content only) — only way to verify exact-match-first behavior
- [Phase 16]: Plan 16-00: 6 W0.ROUTING-FIX probes locked (Pachira/Epipremnum/Heptapleurum/Philodendron/Dracaena fragrans BUG-FIX/Dracaena trifasciata) — refactor sentinel = literal 'const exactMatch = PLANT_DATABASE.find' substring in idSrc
- [Phase 16]: Plan 16-00: findPlantInDatabase refactored to exact-match-first (5 net-new lines) — fixes pre-existing Dracaena fragrans → sansevieria latent collision; pre-locks routing for Phase 16 Dracaena entries (bambu-suerte, sansevieria-cilindrica) arriving in Plan 16-02
- [Phase 16]: Plan 16-00: Mid-band SKIP window for catalog count (idMatches > 87 && idMatches < 104 → undefined) mirrors Phase 15's 64→87 pattern verbatim; Plan 16-01 lands 10 ids → mid-band SKIP at 97; Plan 16-02 lands final 7 → PASS at 104
- [Phase 16]: Plan 16-00: Phase-15-era Sedum duplicate (sedum line 1842 + cola-burro line 2761 both → Sedum morganianum) NOT fixed in Phase 16 per RESEARCH §Pitfall 9 — out of scope, future maintenance work
- [Phase 16]: Plan 16-01: Sub-batch A 10-entry append uses waterMode fixed for 9 (predictable cactus/suculenta schedules with low humidity dependence) + soilCheck for piedras-vivas only (Lithops dormancy cycle requires touch-test discipline tied to autumn-winter active period vs absolute summer dormancy). nopal+agave outdoor:true (xerophyte arid-zone scale); the other 8 outdoor:false per CONTEXT.md user_constraints lock.
- [Phase 16]: Plan 16-01: Lithops (piedras-vivas) gets CUSTOM whyRationale citing Aizoácea mesemb + annual leaf-replacement cycle + absolute summer dormancy (NOT generic CAM template). Generic CAM would mislead users about the unique annual leaf-replacement physiology and the fatal-summer-watering rule. Sub-typology citation matrix has zero copy-paste rationales across the 10 entries.
- [Phase 16]: Plan 16-01: Voseo regression on `te toca` (matches `\btoca\b`) and `tenés` (matches `\bten\b`) caught at pre-commit grep sweep — false positives on legitimate voseo verb forms. Reworded inline (corona-espinas: "ante contacto con piel"; agave: "si queda en zona de paso") to keep plantDatabase.ts voseo regex baseline at 0. Recurring pattern across Phase 14-04/06 + 15-01 + 16-01.
- [Phase 16]: Plan 16-01: Char-limit-from-draft + voseo-pre-sweep continued from Phase 15. whyRationale max ES=221 (mammillaria), max EN=216 (agave) — comfortable margin under 250 ceiling, zero post-hoc trims required.
- [Phase 16]: Plan 16-01: Rule 3 deviation — scripts/phase15-smoke.cjs CAT-09.count assertion changed from `idMatches === 87` to `idMatches >= 87` (Phase 15 floor semantics). Frozen-phase smoke runners with growable-quantity assertions need >= floor instead of === exact-equals to avoid manufacturing false regressions on natural forward catalog growth. Pattern reusable in future phases when growable assertions span phase boundaries.
- [Phase 16]: Plan 16-02: 7 net-new entries (hoya, mini-monstera, strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica, cactus-san-pedro) appended; catalog 97 → 104 (Phase 16 final target). POWO 2024 canonical names cited at-source: Echinopsis pachanoi (was Trichocereus pachanoi); Dracaena angolensis (was Sansevieria cylindrica). Description text acknowledges trade-name persistence to avoid user confusion at point of sale.
- [Phase 16]: Plan 16-02: cactus-san-pedro framed PURELY as horticulture per CONTEXT.md lock — 0 ceremonial/psychoactive references in description, tip, or whyRationale of either locale. Verified by per-locale grep counter (==0). Pattern reusable for any future ethnobotanical entries with cultural associations.
- [Phase 16]: Plan 16-02: sansevieria-cilindrica i18n key uses distinct top-level namespace from sansevieria — both coexist as separate parents (verified by Node parse). Pattern: distinct top-level keys for species splits, never nested under shared parent. Prevents getTranslatedPlant runtime collisions.
- [Phase 16]: Plan 16-02: bambu-suerte waterMode 'fixed' preserved while description/tip/careAction.fixed all flag water-culture cultivation context (cultivo hidropónico, agua filtrada, cambio cada 10-14 días). Pattern: water-culture variants documented in copy without changing schedule semantics.
- [Phase 16]: Plan 16-02: All 7 whyRationale rationales DISTINCT (zero copy-paste); each cites per-entry physiology mechanism: Asclepiadácea CAM-corazón / Aroide heteroblastia / Strelitziacea paddle-leaves / Mirtácea citronellal / Asparagácea hidropónica-flúor / Asparagácea cilíndrica CAM / Cactácea columnar Andes-precordillera. whyRationale max ES=228, EN=224 chars (≤250 ceiling — zero trims required, pre-emptive char-limit-from-draft discipline carried forward from Phase 15).
- [Phase 16]: Plan 16-04: CAT-16 image plan documentation — single grouped Phase 16 Wave B block in CLAUDE.md (17 net-new ids); potus + filodendro deliberately excluded with in-block note (CAT-14 in-place EDU upgrades); cumulative v1.2 image-upload backlog totals 55 entries (15 v1.1 + 23 Phase 15 + 17 Phase 16)
- [Phase 16]: Plan 16-04: imagePlan SKIP→PASS sentinel pattern (CLAUDE.md substring 'Phase 16 Wave B' + ≥N-of-M id-mention threshold) carries forward from Phase 15 Plan 15-04 — reusable for any future documentation-only requirement closure with deliberately-excluded entries
- [Phase 16]: Plan 16-03: COMMON_NAMES_ES extension is APPEND-ONLY when adding catalog batches (mirrors Phase 15 Plan 15-03); 30 net-new entries (13 species-qualified + 5 net-new genus aliases + 8 legacy synonym aliases) appended before closing `};`; existing 88+ entries verbatim — git diff |grep '^-' returns 0.
- [Phase 16]: Plan 16-03: Selective genus alias pattern locked — add genus alias when single-species genus or all species share display name (Agave/Hoya/Strelitzia/Eucalyptus/Schlumbergera ✓); deliberately omit when genus is large with divergent species (Echinopsis ✗, ~135 species; routing all to 'Cactus San Pedro' would mis-route). Documented inline in source via comment block.
- [Phase 16]: Plan 16-03: Species-qualified override pattern via Plan 16-00 exact-match-first refactor — Euphorbia milii→'Corona de espinas' (overrides genus 'Euphorbia'→'Euforbia'); Dracaena sanderiana/angolensis→species-specific names (override genus 'Dracaena'→'Dracena'). Refactor sentinel verified post-edit (grep count 1).
- [Phase 16]: Plan 16-03: 8 legacy synonym aliases for taxonomic-drift coverage (≤2 per entry pattern from Phase 15 Plan 15-03): Senecio rowleyanus, Trichocereus pachanoi, Sansevieria cylindrica, Schlumbergera truncata, Pothos aureus, Philodendron scandens, Dracaena braunii, Corymbia citriodora. Pattern absorbs PlantNet's lagging API responses without diluting POWO canonical mappings.
- [Phase 16]: Plan 16-03: Sempervivum tectorum literal pre-existed at line 479 (mock data array in getMockIdentificationResult), NOT in COMMON_NAMES_ES Record — Step B duplicate-watch verified the new COMMON_NAMES_ES key is a distinct first occurrence in that Record (zero conflict).
- [Phase 17]: Plan 17-00: Wave 0 smoke runner authored as textual delta from phase16-smoke.cjs per RESEARCH §Example 3 — 337 LOC, max code-reuse, minimal drift; reusable Phase-N delta pattern for catalog phases
- [Phase 17]: Plan 17-00: NO findPlantInDatabase refactor task — Phase 16 Plan 16-00 exact-match-first refactor inherited unchanged as routing-fix regression sentinel (refactorLanded literal-substring gate)
- [Phase 17]: Plan 17-00: PHASE_17_NEW_IDS === PHASE_17_IDS (no in-place upgrades unlike Phase 16 potus/filodendro); hasEduFieldsForId helper removed entirely from runner
- [Phase 17]: Plan 17-00: Final CAT-21 count gate at idMatches === 118 (104 + 14 net-new) closes v1.2 catalog expansion when Plan 17-02 lands the last 6 entries; mid-band SKIP window > 104 && < 118 keeps runner exit-0 between Plans 17-01 and 17-02
- [Phase 17]: Plan 17-00: 4 open questions surfaced (Q1 aromáticas outdoor flag, Q2 PlantCategory enum count, Q3 arandano category, Q4 magnolia variant) — each has researcher-recommended default; Plan 17-00 is content-agnostic, propagation to Plans 17-01/02/03/04 trivial via per-token edits
- [Phase 17]: Plan 17-01: Sub-batch A appended (8 CAT-17 exterior flores; 104 → 112). Bulb/dormancy + ericaceous (4 entries) use waterMode soil_check + careAction.soilCheck; Mediterranean/annual/tree (4 entries) use fixed. Char-limit-from-draft + voseo-pre-sweep zero-trim discipline preserved (max whyRationale ES=243 EN=243 chars; voseo regex unchanged at es/plants.json=2 + plantDatabase.ts=0).
- [Phase 17]: Plan 17-01: Rule 3 deviation — phase16-smoke.cjs CAT-counts.total assertion bumped from `=== 104` to `>= 104` floor (forward-compat for natural catalog growth across phases). Same pattern as Phase 16's earlier Rule 3 fix to phase15-smoke (`=== 87` → `>= 87`). Reusable cross-phase pattern: every phase that grows the catalog must bump the previous phase's smoke runner CAT-counts gate to `>= floor`.
- [Phase 17]: Plan 17-01: ciclamen LATAM indoor-pot lock honored (category:'interior' + outdoor:false despite phase name 'Exterior + Aromáticas + Frutales'); description explicitly notes 'En LATAM se cultiva como pot interior de flor invernal-primaveral, no como planta de jardín'. Magnolia stellata locked as canonical (Q4 default — RHS small-garden 3m dwarf form); M. grandiflora 20m mentioned in description for context, scheduled as legacy alias in Plan 17-03.
- [Phase 17]: Plan 17-02: Sub-batch B appended (6 CAT-18 + CAT-19 entries; 112 → 118 — CAT-21 closes). 3 aromáticas (salvia-officinalis/eneldo/stevia) + 3 frutales/huerta (olivo/arandano/espinaca). Aromáticas outdoor:false honored per CONTEXT lock despite researcher discrepancy with existing aromáticas precedent (albahaca/romero/menta/cilantro/perejil/ciboulette all use outdoor:true) — surfaced for user awareness, no unilateral flip. arandano frutales (Q3 default — woody perennial like limonero) + soil_check + ericaceous lexicon cross-referenced from azalea Plan 17-01. olivo tree-realism framing carried forward from magnolia Plan 17-01. espinaca tempMax:25 (Pitfall 4 bolt-flag).
- [Phase 17]: Plan 17-02: salvia-officinalis distinct top-level i18n namespace from salvia-ornamental (Phase 16 sansevieria-cilindrica precedent applied verbatim) — both keys coexist as siblings in plants.json, never nested under shared parent. Verified via Node parse: salvia-officinalis ✓ + salvia-ornamental ✓ + shared salvia parent ✗ in BOTH en + es. salvia-ornamental entry at plantDatabase.ts:2110 + plants.json:2107 untouched (git diff ADDS only). scientificNames distinct: Salvia officinalis vs Salvia splendens — zero collision. Phase 16 exact-match-first refactor (inherited unchanged) protects routing. Pattern reusable for any future genus-level species splits.
- [Phase 17]: Plan 17-02: CAT-21 final assertion idMatches===118 satisfied — closes the entire v1.2 catalog expansion content layer (Phases 15 + 16 + 17 = 54 net-new entries from v1.1 baseline 64 → 118). Phase 17 W2 closed (CAT-17/18/19 fully + CAT-20 keyset + CAT-21 all PASS). Only documentation-only requirements remain: CAT-20 routing in Plan 17-03 (COMMON_NAMES_ES extension for 14 Phase 17 entries) + CAT-20 image plan in Plan 17-04 (CLAUDE.md "Phase 17 Wave C" image-deferral block). Plans 17-03 + 17-04 are file-disjoint (plantIdentification.ts vs CLAUDE.md) and parallelizable. Cumulative v1.2 image-upload backlog will reach 69 entries after Plan 17-04 (15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17).
- [Phase 17]: Plan 17-03: COMMON_NAMES_ES extension is APPEND-ONLY when adding catalog batches (mirrors Phase 15 Plan 15-03 + Phase 16 Plan 16-03); 27 net-new entries (14 species-qualified canonical + 8 net-new genus aliases + 5 legacy synonym aliases) appended before closing `};`; existing 100+ entries verbatim — git diff |grep '^-' returns 0 (49 insertions only).
- [Phase 17]: Plan 17-03: Selective genus alias pattern reinforced — 8 ADD (Dianthus/Chrysanthemum/Tulipa/Helianthus/Magnolia/Anethum/Olea/Spinacia — single display name / monotypic / cultivated-only) + 3 OMIT (Stevia ~240 spp / Vaccinium divergent display names — V. myrtillus = European blueberry, V. macrocarpon = cranberry / Salvia >900 spp + collision-with-salvia-ornamental Salvia splendens). Mirrors Phase 16 Echinopsis pattern. Pattern reusable for any future catalog wave needing same large/divergent-genus discipline.
- [Phase 17]: Plan 17-03: POWO 2024 × Unicode hybrid symbols preserved verbatim at-source — Chrysanthemum × morifolium and Fuchsia × hybrida use actual × character (U+00D7 Multiplication Sign), continuing the Phase 16 Schlumbergera × buckleyi convention. POWO canonical names sourced at-key.
- [Phase 17]: Plan 17-03: Existing 'Rhododendron' (line 88) / 'Cyclamen' (line 89) / 'Fuchsia' (line 84) genus mappings cover fallback for azalea/ciclamen/fucsia even without species-qualified additions — but Plan 17-03 ADDS species-qualified keys ('Rhododendron simsii' / 'Cyclamen persicum' / 'Fuchsia magellanica') on top to lock canonical routing via Phase 16-00 exact-match-first refactor (sentinel `const exactMatch = PLANT_DATABASE.find` count = 1 preserved post-edit). Magnolia stellata canonical (Q4 default — RHS small-garden 3m dwarf form per Plan 17-01) + Magnolia grandiflora retained as legacy synonym alias to absorb PlantNet drift if user identifies a grandiflora variety.
- [Phase 17]: Plan 17-03: Salvia officinalis species-qualified ONLY (Pitfall 1 — DO NOT add 'Salvia' genus alias). Mirrors existing 'Salvia rosmarinus' species-qualified pattern at line 65 — multiply-routed-genus is established safe approach. Phase 16 exact-match-first refactor (inherited unchanged) protects against genus collision with salvia-ornamental (Salvia splendens). 5 legacy synonym aliases (≤2 per entry budget): Rhododendron indicum (Japanese-azalea drift), Tulipa hybrida (older horticultural designation), Magnolia grandiflora (Q4 alternative variant), Fuchsia × hybrida (commercial cultivar mix), Chrysanthemum indicum (parent species — sometimes returned by PlantNet). Phase 17 species are taxonomically more stable than Phase 16's (5 synonym aliases vs Phase 16's 8).
- [Phase 17]: Plan 17-04: Phase 17 Wave C accepted-known image-upload backlog appended to CLAUDE.md (14 net-new ids in 3 sub-batch lines: 8 exterior flores + 3 aromáticas + 3 frutales/huerta). Cumulative v1.2 image-upload backlog now 69 entries (15 v1.1 + 23 Phase 15 + 17 Phase 16 + 14 Phase 17). Closing paragraph cites 'Phase 17 closes the v1.2 catalog expansion at 118 entries' as milestone-closure marker. 4 separate Accepted-known blocks now coexist; shared 'Image upload steps' procedure remains cross-cutting. CAT-20 image-plan portion CLOSED — W3.CAT-20.imagePlan SKIP→PASS in all 3 phase17-smoke modes (default 40/54, --identification 54/68, --routing-fix 68/68 full PASS). +8 LOC, 0 deletions. Phase 17 documentation side fully closed; 14 W3.CAT-20.* per-id SKIPs owned by parallel Plan 17-03 (file-disjoint). v1.2 catalog expansion fully closed — Phase 17 is the final catalog wave; ROADMAP next phase = Phase 18 (PlantCard Cleanup + Mood Emoji).

### Pending Todos

None yet for v1.2.

### Blockers/Concerns

- **Phase 13 (INFRA):** Active bug reports on `@gorhom/bottom-sheet` v5.2.11+ with Expo SDK 54 (issues #2528, #2471). Code installation + provider wrap + dev-tools test surface all clean (Plans 13-00/01/02). Plan 13-03 (manual device verification checkpoint) is the gate — iOS + Android dev clients need to be rebuilt and the Test bottom sheet exercised. Fallback if regression: custom `Animated.View` + `PanResponder` for 2-3 action-sheet use cases.
- **Phase 15 (CAT Wave A):** Wave 3.6 trepadoras/colgantes species names are TBD — one research pass needed at Phase 16 planning time.
- **v1.1 manual ops backlog:** Device tests (~27 scenarios), edge function deploys (`chat-diagnosis` + `diagnose-plant`), 15 catalog image uploads — all batched at milestone end per user preference.
- **v1.2 image upload backlog (Phase 15 Wave A):** 23 catalog image uploads (anthurium..arbol-dinero) — documented in CLAUDE.md as accepted-known `check:images` failures; batched at v1.2 milestone end alongside v1.1 backlog (38 entries total). NOT a Phase 15 ship blocker.

## Session Continuity

Last session: 2026-05-08T16:30:30.479Z
Stopped at: Completed 17-03-PLAN.md (parallel with 17-04)
Resume file: None
