---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Recommendation-First Plant Guide
status: planning
stopped_at: Completed 11-02-PLAN.md
last_updated: "2026-05-03T01:55:41.074Z"
last_activity: "2026-05-01 — Roadmap created. 15 phases (10-24), 74/74 v1.2 requirements mapped. GAM split applied: GAM-03/04 land in Phase 18 (PlantCard); GAM-01/02/05 land in Phase 22."
progress:
  total_phases: 15
  completed_phases: 1
  total_plans: 8
  completed_plans: 8
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Current focus:** v1.2 Recommendation-First Plant Guide — Phase 10 ready to plan (Perenual Security: move API key server-side before any catalog work).

## Current Position

Phase: 10 of 24 (Perenual Security)
Plan: — (not yet planned)
Status: Ready to plan Phase 10
Last activity: 2026-05-01 — Roadmap created. 15 phases (10-24), 74/74 v1.2 requirements mapped. GAM split applied: GAM-03/04 land in Phase 18 (PlantCard); GAM-01/02/05 land in Phase 22.

Progress: [░░░░░░░░░░] 0% (v1.2 not started)

## Performance Metrics

**Velocity:**
- Total plans completed (v1.0+v1.1): 39
- Average duration: ~9 min (v1.0), ~8 min (v1.1)
- Total execution time: ~5.2 hours across v1.0+v1.1

**Recent Trend (v1.1 Phase 9):**
- Plans ranged 3-8 min each; P07 was 29 min (complex paywall architecture)
- Trend: Stable

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

### Pending Todos

None yet for v1.2.

### Blockers/Concerns

- **Phase 13 (INFRA):** Active bug reports on `@gorhom/bottom-sheet` v5.2.11 with Expo SDK 54 (issues #2528, #2471). Device test required before building any bottom-sheet UI. Fallback: custom `Animated.View` + `PanResponder` for 2-3 action-sheet use cases.
- **Phase 15 (CAT Wave A):** Wave 3.6 trepadoras/colgantes species names are TBD — one research pass needed at Phase 16 planning time.
- **v1.1 manual ops backlog:** Device tests (~27 scenarios), edge function deploys (`chat-diagnosis` + `diagnose-plant`), 15 catalog image uploads — all batched at milestone end per user preference.

## Session Continuity

Last session: 2026-05-03T01:55:41.072Z
Stopped at: Completed 11-02-PLAN.md
Resume file: None
