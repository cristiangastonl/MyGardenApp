# Roadmap: My Garden Care

## Milestones

- ✅ **v1.0 Diagnosis & Tracking** — Phases 1-3 (shipped 2026-03-19)
- ✅ **v1.1 Precision Care** — Phases 4-9 (shipped 2026-05-02)
- 📋 **v1.2 Recommendation-First Plant Guide** — Phases 10-24 (planning)

## Phases

<details>
<summary>✅ v1.0 Diagnosis & Tracking (Phases 1-3) — SHIPPED 2026-03-19</summary>

- [x] Phase 1: Camera in Chat (1/1 plans) — completed 2026-03-19
- [x] Phase 2: Problem Tracking Core (3/3 plans) — completed 2026-03-19
- [x] Phase 3: Reminders, Tasks & Plant Detail UI (3/3 plans) — completed 2026-03-19

See: `.planning/milestones/v1.0-ROADMAP.md` for full details

</details>

<details>
<summary>✅ v1.1 Precision Care (Phases 4-9) — SHIPPED 2026-05-02</summary>

- [x] Phase 4: Schema Foundation + Migration Core (7/7 plans) — completed 2026-04-30
- [x] Phase 5: Hemisphere/Season Helpers + Pure-Utility Switchover (5/5 plans) — completed 2026-05-01
- [x] Phase 6: UI Read-Side Propagation (6/6 plans) — completed 2026-05-01
- [x] Phase 7: UI Write-Side + Onboarding + Edge-Function Contract (8/8 plans) — completed 2026-05-01
- [x] Phase 8: Catalog Rebalance (5/5 plans) — completed 2026-05-02
- [x] Phase 9: Diagnosis Continuity + Paywall Architecture (8/8 plans) — completed 2026-05-02

See: `.planning/milestones/v1.1-ROADMAP.md` for full details

</details>

### 📋 v1.2 Recommendation-First Plant Guide (Phases 10-24)

**Milestone Goal:** Pivot from passive tracker to guided assistant — the app recommends what to do (with horticultural rationale) and the user adjusts to their reality. Polish PlantCard, add brand voice, fix UAT bugs, modernize mobile patterns, secure the Perenual API key, and expand plant coverage from 64 to 120 entries with fertilization, pet toxicity, and journal features.

- [x] **Phase 10: Perenual Security** — Move Perenual API key server-side via new `get-plant-care` edge function; rotate key; remove from client bundle (completed 2026-05-03)
- [x] **Phase 11: Perenual Data Quality** — Harden Perenual response parsing: match validator, dynamic `tempMax`, inferred `humidity` (completed 2026-05-03; DATA-04 FINDING: free-tier API paywall; see 11-03-SUMMARY.md)
- [x] **Phase 12: Unknown Plant Tracking** — Fire-and-forget tracker for catalog misses; dev-tools report in Settings (completed 2026-05-03)
- [ ] **Phase 13: Gesture + Bottom-Sheet Infrastructure** — Install 4 native deps; wire `GestureHandlerRootView` + `BottomSheetModalProvider` into both AppContent paths; custom Skeleton component
- [ ] **Phase 14: Educational Detail Modal** — 4-section `MyPlantDetailModal` redesign; 5 new catalog fields; 640 new strings for 64 existing entries; identification picker pre-selects recommendation; deep-merge guard
- [ ] **Phase 15: Catalog Wave A — Interior Tropicals** — 23 new catalog entries (interior/tropical) with full v1.1+EDU schema, i18n, identification map, image plan
- [ ] **Phase 16: Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending** — 19 new catalog entries across 3 waves with full schema
- [ ] **Phase 17: Catalog Wave C — Exterior + Aromáticas + Frutales** — 14 new catalog entries; catalog reaches 120 total; smoke asserts count
- [ ] **Phase 18: PlantCard Cleanup + Mood Emoji** — Swipe-to-delete with `Gesture.Pan()`; long-press menu; 5-element card; mood emoji (GAM-03/04) replaces health badge
- [ ] **Phase 19: Pet Toxicity** — ASPCA-verified `petToxicity` field on all 120 entries; toxicity badge + detail section + pet-safe catalog filter
- [ ] **Phase 20: Fertilization Subsystem** — `'fertilize'` task type with full discriminator sweep; season-aware scheduling; fertilizer type content; opt-in push notifications
- [ ] **Phase 21: Plant Journal** — Per-plant `JournalEntry[]` with file-system photo storage; bottom-sheet quick-add; reverse-chronological timeline; orphan cleanup on plant delete
- [ ] **Phase 22: Gamification — Toasts + Haptics** — Completion toasts; haptic feedback on task done; streak-anxiety anti-pattern documented and enforced
- [ ] **Phase 23: Polish — UAT Fixes + Brand Voice** — Outdoor task gate; outdoor picker labels; textSecondary WCAG AA; voseo microcopy; illustrated empty states
- [ ] **Phase 24: Documentation** — CLAUDE.md + PROJECT.md updated for v1.2 architecture decisions

## Phase Details

### Phase 10: Perenual Security
**Goal**: The Perenual API key is removed from the client bundle and all future catalog lookups go through a server-side edge function
**Depends on**: Phase 9 (v1.1 complete)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. `grep -r "EXPO_PUBLIC_PERENUAL_API_KEY" src/` returns no results
  2. Plant identification that previously fell back to Perenual still enriches data correctly (end-to-end smoke test with a known species)
  3. Supabase Functions logs show `get-plant-care` invocations with no errors after deploy
  4. Old Perenual API key is rotated and the new key is only accessible via `Deno.env.get` server-side
**Plans:** 5/4 plans complete
  - [ ] 10-01-PLAN.md — Create get-plant-care edge function source mirroring identify-plant (SEC-02)
  - [ ] 10-02-PLAN.md — Swap fetchFromPerenual to invoke edge function; remove EXPO_PUBLIC_PERENUAL_API_KEY from client bundle + .env + .env.example + audit app.json (SEC-01, SEC-03)
  - [ ] 10-03-PLAN.md — MANUAL CHECKPOINTS: deploy edge function + set Supabase secret + verify live; decision gate; rotate Perenual key + final verify (SEC-04)
  - [ ] 10-04-PLAN.md — Update CLAUDE.md (edge function list + deploy command + secret + grep guard) and PROJECT.md Key Decisions (SEC-05)

### Phase 11: Perenual Data Quality
**Goal**: Plants identified via Perenual return accurate `tempMax` and `humidity` values instead of hardcoded fallbacks, and mismatched results are rejected before caching
**Depends on**: Phase 10
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Identifying a species with a known USDA hardiness zone returns a `tempMax` derived from that zone (not always 35)
  2. Identifying an Araceae/tropical plant returns `humidity: 'alta'`; identifying a cactus returns `humidity: 'baja'`
  3. Querying a species name that doesn't match the top Perenual result returns `null` (no garbage cached)
  4. Test fixture of 5 known species shows `tempMax ≠ 35` and `humidity ≠ null` in ≥80% of cases
**Plans:** 4/4 plans complete
  - [x] 11-00-PLAN.md — Wave 0 scaffold: smoke-phase11.mjs runner + 2 import-stub modules (Nyquist gate)
  - [x] 11-01-PLAN.md — Edge function: isGoodMatch validator + PerenualPlantDetail family/type schema (DATA-01)
  - [x] 11-02-PLAN.md — Client service: parseHardiness reads .max + inferHumidity + classifyTempMaxFallback + schema parity (DATA-02, DATA-03)
  - [x] 11-03-PLAN.md — Manual checkpoints: redeploy + 5-species fixture (DATA-04 FINDING: Perenual free tier paywalls family/type/hardiness — 0/5 threshold; implementation correct; forward-compatible)

### Phase 12: Unknown Plant Tracking
**Goal**: Every time a user identifies a plant not in the curated catalog, that species is silently logged so future expansion waves can be prioritized by real user demand
**Depends on**: Nothing (independent)
**Requirements**: TRACK-01, TRACK-02, TRACK-03
**Success Criteria** (what must be TRUE):
  1. Identifying a plant that isn't in the 64-entry catalog increments its count in `@unknown_plants` AsyncStorage key (verified in dev tools)
  2. Settings → Dev tools section shows the unknown plant report sorted by count descending
  3. The tracking call is fire-and-forget — identifying a plant completes at the same speed whether tracking succeeds or fails
**Plans:** 4/4 plans complete
  - [ ] 12-00-PLAN.md — Wave 0 scaffold: smoke-phase12.mjs runner + AsyncStorage stub (Nyquist gate)
  - [ ] 12-01-PLAN.md — Wave 1: src/services/unknownPlantTracker.ts service module (TRACK-01)
  - [ ] 12-02-PLAN.md — Wave 2 (parallel): TRACK-02 catalog-miss gate in getEnrichedPlantData
  - [ ] 12-03-PLAN.md — Wave 2 (parallel): TRACK-03 Settings dev-tools UI + 4 i18n keys × 2 locales

### Phase 13: Gesture + Bottom-Sheet Infrastructure
**Goal**: The four native gesture/animation/haptic packages are installed and wired into the provider hierarchy so all future swipe and bottom-sheet UI can be built without a second rebuild
**Depends on**: Phase 9 (v1.1 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. App boots without crash on both iOS and Android dev client after the 4 package installs
  2. `grep -c "BottomSheetModalProvider" App.tsx` returns exactly 2 (both AppContent paths)
  3. A test bottom sheet opens and closes with correct gesture behavior and no z-order conflict with the existing `PaywallModal`
  4. The custom `Skeleton` component renders a shimmer animation on a device (not just simulator)
**Plans**: TBD

### Phase 14: Educational Detail Modal
**Goal**: Opening any plant's detail reveals four sections — what to do, where to place it, why, and the user's current settings — with horticultural rationale for all 64 existing catalog entries
**Depends on**: Phase 13 (INFRA for bottom-sheet section animations; EDU-06 deep-merge guard needs INFRA types)
**Requirements**: EDU-01, EDU-02, EDU-03, EDU-04, EDU-05, EDU-06, EDU-07
**Success Criteria** (what must be TRUE):
  1. A user can open any of the 64 existing catalog plants and see all four sections: "¿Qué hacer?", "¿Dónde ponerla?", "¿Por qué?", "Tus ajustes"
  2. Opening the detail modal on a plant with a custom watering schedule and closing without saving leaves the custom schedule intact (CRIT-1 guard)
  3. After identifying a plant via PlantNet, the light level picker pre-selects the species' recommended level
  4. `npm run check:i18n-keys` passes with the 5 new field validations in place
  5. "Tus ajustes" shows a soft override note when the user's stored value differs from the catalog recommendation
**Plans**: TBD

### Phase 15: Catalog Wave A — Interior Tropicals
**Goal**: 23 interior/tropical plants are fully added to the catalog with educational content, identification routing, and image plan — expanding from 64 to 87 entries
**Depends on**: Phase 14 (EDU schema fields established)
**Requirements**: CAT-09, CAT-10, CAT-11, CAT-12
**Success Criteria** (what must be TRUE):
  1. `PLANT_DATABASE.length === 87` (64 + 23)
  2. All 23 entries have full i18n keyset in EN + ES; `npm run check:i18n-keys` passes
  3. PlantNet identification of any of the 23 species routes to the curated entry (not to unknown-plant fallback)
  4. Each entry's image is either uploaded to Supabase Storage or documented as accepted-known in CLAUDE.md
**Plans**: TBD

### Phase 16: Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending
**Goal**: 19 more plants across three waves are added with full schema — catalog grows from 87 to 106 entries
**Depends on**: Phase 15 (authoring pattern established)
**Requirements**: CAT-13, CAT-14, CAT-15, CAT-16
**Success Criteria** (what must be TRUE):
  1. `PLANT_DATABASE.length === 106` (87 + 19)
  2. All Wave B entries have full v1.1 + EDU keyset; `npm run check:i18n-keys` passes
  3. Wave B entries appear correctly in identification map and catalog browse
  4. `sansevieria-cilindrica` is distinct from existing `sansevieria` entry with no i18n key collision
**Plans**: TBD

### Phase 17: Catalog Wave C — Exterior + Aromáticas + Frutales
**Goal**: The final 14 catalog entries land and the catalog reaches exactly 120 entries — the v1.2 expansion target
**Depends on**: Phase 16 (authoring pattern established)
**Requirements**: CAT-17, CAT-18, CAT-19, CAT-20, CAT-21
**Success Criteria** (what must be TRUE):
  1. `PLANT_DATABASE.length === 120` (106 + 14); smoke runner asserts this count
  2. All Wave C entries have full v1.1 + EDU keyset; `npm run check:i18n-keys` passes
  3. `salvia-officinalis` is clearly distinguished from existing `salvia-ornamental` in both name and description
  4. `npm run check:i18n-keys` passes across all 120 entries end-to-end
**Plans**: TBD

### Phase 18: PlantCard Cleanup + Mood Emoji
**Goal**: PlantCard is reduced to 5 visual elements; swipe-to-delete and long-press menu replace the in-card trash button; mood emoji is always visible as the health affordance
**Depends on**: Phase 13 (gesture infrastructure), Phase 17 (full 120-entry catalog for toxicity badges)
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, GAM-03, GAM-04
**Success Criteria** (what must be TRUE):
  1. Swiping left on a PlantCard reveals a delete affordance; completing the swipe triggers a haptic and a confirmation step — the plant is not instantly deleted
  2. Long-pressing a PlantCard reveals an overflow menu with favorite, delete, and edit options
  3. Every PlantCard shows a mood emoji (🌱/😊/😐/😟) derived from health score — always visible, not conditional on score threshold
  4. The legacy conditional `PlantHealthBadge` (shown only when score < 80) is removed from PlantCard
  5. First-render swipe affordance hint is shown on the first card in PlantsScreen (dismissible)
**Plans**: TBD

### Phase 19: Pet Toxicity
**Goal**: Every catalog entry is classified for cat and dog toxicity against the ASPCA list; users can see pet safety information in plant detail and filter the catalog to pet-safe plants
**Depends on**: Phase 17 (full 120-entry catalog complete)
**Requirements**: TOX-01, TOX-02, TOX-03, TOX-04, TOX-05, TOX-06
**Success Criteria** (what must be TRUE):
  1. Every one of the 120 catalog entries has `petToxicity` set (not absent/undefined); `grep` count assertion passes
  2. PlantCard shows a red cat/dog badge only for `'toxic'` species and a yellow badge for `'caution'` — nothing shown for `'safe'` or `'unknown'`
  3. MyPlantDetailModal "Mascotas" section is always visible with species-appropriate copy for all four states
  4. Catalog browse has a pet-safe filter toggle that correctly filters to entries where both cats and dogs are `'safe'`
  5. LATAM species not in the ASPCA database show the `'unknown'` state honestly ("No verificada para esta especie en LATAM 🤷")
**Plans**: TBD

### Phase 20: Fertilization Subsystem
**Goal**: Fertilize tasks appear in the Hoy screen on the correct cadence; all five discriminator sites are updated; push notifications are opt-in; every catalog entry has fertilizer type content
**Depends on**: Phase 17 (full 120-entry catalog for fertilizer content), Phase 13 (INFRA for bottom-sheet task actions)
**Requirements**: FERT-01, FERT-02, FERT-03, FERT-04, FERT-05, FERT-06, FERT-07
**Success Criteria** (what must be TRUE):
  1. A plant with `fertilizeSchedule` set shows a fertilize task in Hoy on the correct due date and not on other days
  2. `npx tsc --noEmit` passes with `'fertilize'` in the Task union — all five discriminator sites updated (DayDetail, DayDetailModal, MonthCalendar, TaskButton, notificationScheduler)
  3. Fertilize push notifications default to OFF in Settings; toggling ON schedules reminders correctly
  4. MyPlantDetailModal "¿Qué hacer?" section shows how and when to fertilize, including the fertilizer type (industrial and/or homemade) for that species
  5. Plants without `fertilizeSchedule` emit no fertilize task and are not penalized in health score
**Plans**: TBD

### Phase 21: Plant Journal
**Goal**: Users can log text notes and photos for any plant in a reverse-chronological journal; journal data is stored safely in the file system (not AsyncStorage base64); deleting a plant cleans up its journal
**Depends on**: Phase 20 (serializes useStorage.tsx changes to avoid concurrent conflicts)
**Requirements**: JOURNAL-01, JOURNAL-02, JOURNAL-03, JOURNAL-04, JOURNAL-05
**Success Criteria** (what must be TRUE):
  1. A user can add a journal entry (text + optional photo + optional care tag) via a bottom sheet from MyPlantDetailModal in 2 taps or fewer
  2. Journal entries survive an app restart and appear in reverse-chronological order
  3. Journal photo URIs point to `documentDirectory` paths — no base64 strings in AsyncStorage (verified by startup size log)
  4. Deleting a plant also removes its journal entries from storage (no orphans)
  5. Journal entries are readable without a premium subscription — no paywall at read level
**Plans**: TBD

### Phase 22: Gamification — Toasts + Haptics
**Goal**: Completing a care task triggers a positive celebration (toast + haptic) without introducing streak counters, punishment, or persistent scorekeeping in the UI
**Depends on**: Phase 13 (expo-haptics installed), Phase 21 (all task types exist for toast triggers)
**Requirements**: GAM-01, GAM-02, GAM-05
**Success Criteria** (what must be TRUE):
  1. Completing any care task (water/sun/outdoor/fertilize) shows a transient celebration toast ("¡Vas bien! 🌱") that auto-dismisses in ~2 seconds
  2. Task completion triggers a haptic (`NotificationFeedbackType.Success`) on both iOS and Android
  3. No streak counter, reset number, or "N-day streak" is visible anywhere in the UI
**Plans**: TBD

### Phase 23: Polish — UAT Fixes + Brand Voice
**Goal**: All four UAT bugs are fixed; all action button copy uses voseo + emoji; textSecondary passes WCAG AA; illustrated empty states replace blank screens
**Depends on**: Phase 22 (all features exist for copy to reference)
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08
**Success Criteria** (what must be TRUE):
  1. An outdoor plant (e.g. tomato, rose) generates no "Sacar afuera" task in Hoy
  2. After PlantNet identifies an outdoor plant, the light level picker shows outdoor-appropriate labels ("Pleno sol", "Sol parcial") not indoor labels
  3. `colors.textSecondary` passes WCAG AA contrast ratio (~4.5:1) against both `bgPrimary` and `card` backgrounds
  4. All action buttons in ES locale use voseo imperative forms ("Regá ahora 💧", not "Regar"); voseo linter passes
  5. PlantsScreen, CalendarScreen, and ExploreScreen show illustrated empty states with motivating voseo copy when empty
**Plans**: TBD

### Phase 24: Documentation
**Goal**: CLAUDE.md and PROJECT.md accurately reflect v1.2 architecture decisions so future Claude sessions start with correct context
**Depends on**: Phase 23 (all v1.2 features complete)
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. CLAUDE.md contains the `get-plant-care` edge function deploy command and post-deploy verification steps
  2. PROJECT.md Key Decisions table includes all v1.2 decisions: recommendation-first pivot, deep-merge guard, derived-only streak approach, journal photos in FileSystem, two-AppContent-paths extended to BottomSheetProvider
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Camera in Chat | v1.0 | 1/1 | Complete | 2026-03-19 |
| 2. Problem Tracking Core | v1.0 | 3/3 | Complete | 2026-03-19 |
| 3. Reminders, Tasks & Plant Detail UI | v1.0 | 3/3 | Complete | 2026-03-19 |
| 4. Schema Foundation + Migration Core | v1.1 | 7/7 | Complete | 2026-04-30 |
| 5. Hemisphere/Season Helpers + Pure-Utility Switchover | v1.1 | 5/5 | Complete | 2026-05-01 |
| 6. UI Read-Side Propagation | v1.1 | 6/6 | Complete | 2026-05-01 |
| 7. UI Write-Side + Onboarding + Edge-Function Contract | v1.1 | 8/8 | Complete | 2026-05-01 |
| 8. Catalog Rebalance | v1.1 | 5/5 | Complete | 2026-05-02 |
| 9. Diagnosis Continuity + Paywall Architecture | v1.1 | 8/8 | Complete | 2026-05-02 |
| 10. Perenual Security | 5/4 | Complete    | 2026-05-03 | - |
| 11. Perenual Data Quality | 3/4 | Complete    | 2026-05-03 | - |
| 12. Unknown Plant Tracking | 4/4 | Complete   | 2026-05-03 | - |
| 13. Gesture + Bottom-Sheet Infrastructure | v1.2 | 0/TBD | Not started | - |
| 14. Educational Detail Modal | v1.2 | 0/TBD | Not started | - |
| 15. Catalog Wave A — Interior Tropicals | v1.2 | 0/TBD | Not started | - |
| 16. Catalog Wave B — Suculentas/Cactus + Trepadoras + Trending | v1.2 | 0/TBD | Not started | - |
| 17. Catalog Wave C — Exterior + Aromáticas + Frutales | v1.2 | 0/TBD | Not started | - |
| 18. PlantCard Cleanup + Mood Emoji | v1.2 | 0/TBD | Not started | - |
| 19. Pet Toxicity | v1.2 | 0/TBD | Not started | - |
| 20. Fertilization Subsystem | v1.2 | 0/TBD | Not started | - |
| 21. Plant Journal | v1.2 | 0/TBD | Not started | - |
| 22. Gamification — Toasts + Haptics | v1.2 | 0/TBD | Not started | - |
| 23. Polish — UAT Fixes + Brand Voice | v1.2 | 0/TBD | Not started | - |
| 24. Documentation | v1.2 | 0/TBD | Not started | - |
