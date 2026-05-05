---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Recommendation-First Plant Guide
status: "Phase 14 Wave 1 complete. Plan 14-01 (foundation: types + getTranslatedPlant + validator) and Plan 14-02 (storage guard + override comparator + section labels) ran in parallel as file-disjoint Wave 1 plans. Smoke runner: PASS 16/19, 3 SKIP (W2.EDU-01.* for Plan 14-03), 0 FAIL. ts.transpileModule single-compile-path locked. Plan 14-03 (modal restructure, Wave 2) ready to begin."
stopped_at: "Completed 14-01-PLAN.md (Wave 1 foundation: types + getTranslatedPlant + validator)"
last_updated: "2026-05-05T02:39:00.320Z"
last_activity: "2026-05-05 — Phase 14 Plans 14-01 + 14-02 complete in parallel (Wave 1). 14-01: PlantDBEntry +5 fields; getTranslatedPlant body extended; check-i18n-keys.mjs validator extended. 14-02: useStorage.tsx +33 lines (PROTECTED_USER_FIELDS deep-merge guard, EDU-06); src/utils/overrideDetection.ts CREATED (78 LOC, EDU-05); en/es common.json +6 plantDetailModal keys (EDU-01 labels). Smoke: PASS 16/19, 3 SKIP, 0 FAIL."
progress:
  total_phases: 15
  completed_phases: 4
  total_plans: 25
  completed_plans: 21
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Current focus:** v1.2 Recommendation-First Plant Guide — Phase 10 ready to plan (Perenual Security: move API key server-side before any catalog work).

## Current Position

Phase: 14 of 24 (Educational Detail Modal) — IN PROGRESS
Plan: 14-00, 14-01, 14-02 complete (3/9 plans in Phase 14 — Wave 0 scaffold + Wave 1 foundation + Wave 1 storage guard). Plans 14-01 and 14-02 ran in parallel as Wave 1 file-disjoint plans. Plan 13-03 (manual device verification) still pending.
Status: Phase 14 Wave 1 complete. PROTECTED_USER_FIELDS deep-merge guard in useStorage.updatePlant (EDU-06); compareUserVsCatalog comparator in src/utils/overrideDetection.ts (EDU-05); 6 plantDetailModal i18n keys with locale parity + ES voseo (EDU-01 label portion); PlantDBEntry +5 educational fields (EDU-02); getTranslatedPlant extended; check-i18n-keys.mjs validator extended (EDU-07). Smoke runner: PASS 16/19, 3 SKIP (W2.EDU-01.* for Plan 14-03), 0 FAIL. Plan 14-03 (Wave 2 modal restructure) ready.
Last activity: 2026-05-05 — Phase 14 Plan 02 complete (Wave 1 storage guard + override comparator + section labels). 4 files: useStorage.tsx +33 lines, overrideDetection.ts CREATED 78 LOC, en/es common.json +6 keys each. W1.EDU-06.1 + W1.EDU-05.* flipped SKIP→PASS.

Progress: [████████░░] 80% (v1.2 in progress — 20/25 plans complete in tracked window; Phase 14 Plans 14-03..08 + Phase 13 Plan 03 + Phases 15-24 still ahead)

## Performance Metrics

**Velocity:**
- Total plans completed (v1.0+v1.1): 39
- Average duration: ~9 min (v1.0), ~8 min (v1.1)
- Total execution time: ~5.2 hours across v1.0+v1.1

**Recent Trend (v1.2 Phase 14):**
- Plan 14-00 (Wave 0 scaffold): ~3 min, 1 task, 3 files
- Plan 14-01 (Wave 1 foundation): ~13 min, 3 tasks, 3 files
- Plan 14-02 (Wave 1 storage guard + override + labels): ~11 min, 3 tasks, 4 files
- Trend: Stable

| Phase-Plan | Duration | Tasks | Files |
| ---------- | -------- | ----- | ----- |
| 14-00      | 3min     | 1     | 3     |
| 14-01      | 13min    | 3     | 3     |
| 14-02      | 11min    | 3     | 4     |

*Updated after each plan completion*

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

### Pending Todos

None yet for v1.2.

### Blockers/Concerns

- **Phase 13 (INFRA):** Active bug reports on `@gorhom/bottom-sheet` v5.2.11+ with Expo SDK 54 (issues #2528, #2471). Code installation + provider wrap + dev-tools test surface all clean (Plans 13-00/01/02). Plan 13-03 (manual device verification checkpoint) is the gate — iOS + Android dev clients need to be rebuilt and the Test bottom sheet exercised. Fallback if regression: custom `Animated.View` + `PanResponder` for 2-3 action-sheet use cases.
- **Phase 15 (CAT Wave A):** Wave 3.6 trepadoras/colgantes species names are TBD — one research pass needed at Phase 16 planning time.
- **v1.1 manual ops backlog:** Device tests (~27 scenarios), edge function deploys (`chat-diagnosis` + `diagnose-plant`), 15 catalog image uploads — all batched at milestone end per user preference.

## Session Continuity

Last session: 2026-05-05T02:39:00.318Z
Stopped at: Completed 14-01-PLAN.md (Wave 1 foundation: types + getTranslatedPlant + validator)
Resume file: None
