# My Garden Care

## What This Is

My Garden Care is a React Native (Expo) plant care app where users track watering, sun, outdoor, and fertilization activities for their plants, with weather integration, AI plant identification, AI health diagnosis with camera support, premium AI-powered plant problem tracking with follow-up reminders and photo timelines, a 118-entry curated plant catalog with horticultural recommendations and pet toxicity, and a per-plant photo journal.

## Core Value

Users get recommendations on what to do for each plant (with horticultural rationale) and adjust to their reality — the app guides instead of passively recording. When a plant has a problem, photo + AI diagnosis and proactive follow-up tracking ensure nothing goes forgotten.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Plant tracking with watering, sun, and outdoor schedules — MVP
- ✓ Weather integration via Open-Meteo with plant-specific alerts — MVP
- ✓ AI plant identification via PlantNet edge function — MVP
- ✓ AI health diagnosis via Claude Vision chat — MVP
- ✓ Photo upload from gallery in diagnosis chat — MVP
- ✓ Premium gating with RevenueCat + feature flags — MVP
- ✓ Daily tips and health score — MVP
- ✓ Notifications for care reminders — MVP
- ✓ Plant catalog with 60+ species — MVP
- ✓ i18n (English + Argentine Spanish) — MVP
- ✓ Local-first data with AsyncStorage — MVP
- ✓ Seasonal theme with animated backgrounds — MVP
- ✓ Camera capture in diagnosis chat (take photo on the spot) — v1.0
- ✓ AI-powered plant problem tracking with follow-up photo reminders (premium) — v1.0
- ✓ AI suggests resolution on improvement, user confirms with one tap (premium) — v1.0
- ✓ Problem timeline in plant detail view (photo history of diagnosis → resolution) — v1.0
- ✓ Push notifications for follow-up diagnosis reminders (premium) — v1.0
- ✓ Follow-up diagnosis tasks in "Hoy" screen (premium) — v1.0
- ✓ Notification deep-link navigation (cold-start safe) — v1.0
- ✓ PlantCard tracking status emoji badges — v1.0
- ✓ 4-level light model with locale-aware labels (indoor + outdoor variants) — v1.1
- ✓ Seasonal watering schedule (warm/cold split) with soil-check mode for cacti — v1.1
- ✓ Three-zone seasonality (Northern/Southern/Tropical) with manual climate override — v1.1
- ✓ Onboarding location prompt with GPS / city search / skip — v1.1
- ✓ Diagnosis conversation continuity (continue + reopen) with App-level paywall + deferred callback — v1.1
- ✓ Per-diagnosis-lifetime message count + retroactive premium lift on upgrade — v1.1
- ✓ Catalog rebalance: 50 expert overrides + 14 new LATAM outdoor plants + lavender split (64 total) — v1.1
- ✓ Lookup-by-id catalog content with `_aliases` for renamed slugs — v1.1
- ✓ CI guards for catalog i18n key parity + image URL 200 OK — v1.1
- ✓ Perenual API key moved server-side via `get-plant-care` Supabase edge function (rotation pending pre-public-ship) — v1.2
- ✓ Hardened Perenual response parsing: `isGoodMatch` validator + dynamic `tempMax` from USDA hardiness + inferred `humidity` from family/type — v1.2
- ✓ Unknown plant tracking: fire-and-forget logging of catalog misses + Settings dev-tools report — v1.2
- ✓ Gesture + bottom-sheet infrastructure: 4 native deps, `GestureHandlerRootView` + `BottomSheetModalProvider` at App root, custom `Skeleton` shimmer — v1.2
- ✓ Educational `MyPlantDetailModal` with 4 base sections (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes) + Mascotas + Diario; 5 new EDU fields per catalog entry; identification picker pre-selects recommendation; override-detection note in "Tus ajustes" — v1.2
- ✓ `PROTECTED_USER_FIELDS` deep-merge guard in `useStorage.updatePlant` (extended for `fertilizeSchedule` in Phase 20) — v1.2
- ✓ Catalog expansion 64 → 118 entries across 3 waves (interior tropicals, suculentas/cactus/trepadoras, exterior/aromáticas/frutales) — v1.2
- ✓ PlantCard 5-element redesign: swipe-to-delete + long-press menu + always-visible mood emoji (replaces conditional health badge) — v1.2
- ✓ Pet toxicity (ASPCA-verified) on all 118 entries: cat/dog badges + Mascotas detail section + pet-safe catalog filter + onboarding switch — v1.2
- ✓ Fertilization subsystem: `'fertilize'` task type with 5-site discriminator sweep, season-aware cadence, opt-in push notifications, full EN/ES fertilizer-type content — v1.2
- ✓ Plant Journal: per-plant `JournalEntry[]` with file-system photo storage (1080px @ 0.7 JPEG, never base64), bottom-sheet quick-add, reverse-chronological timeline, orphan cleanup on plant delete — v1.2
- ✓ Celebration toasts + `NotificationFeedbackType.Success` haptics on task completion; GAM-05 anti-pattern lock (no persistent streak counters) enforced via smoke negative-grep — v1.2
- ✓ UAT + brand voice polish: outdoor task gate, outdoor picker labels, `textSecondary` WCAG AA contrast, voseo lint over ES locale, illustrated empty states on 3 screens — v1.2

### Active

<!-- Current scope. Building toward these. -->

- TBD — define next milestone via `/gsd:new-milestone`

### Pending Operational Tasks (v1.2 closeout)

Manual ops batched at end of milestone — must complete before public ship to App Store / Play Store:
- Run device-test backlog (see `v1_2_test_backlog.md` memory) on iOS + Android (14-item checklist per phase × 5 deferred phases — Phase 18-05 / 20-10 / 21-06 / 22-03 / 23-04)
- Upload 69 catalog images to Supabase Storage `plant-images/catalog/<id>.jpg` (15 v1.1 LATAM + 23 Phase 15 Wave A + 17 Phase 16 Wave B + 14 Phase 17 Wave C)
- Re-run `npm run check:images` until exit 0
- Rotate Perenual API key in Perenual dashboard (SEC-04 — deferred from Phase 10 trusted-test-build context)
- RevenueCat-gated PaywallModal Z-order regression check on iOS (per `v1_2_test_backlog.md`)

### Out of Scope

<!-- Explicit boundaries. -->

- Auth / Cloud sync — deferred to future auth milestone
- Calendar tab / Explore tab — separate feature milestones
- New DLC content packs — future milestone
- User-configurable follow-up interval — contradicts AI-decides design
- Fully automatic resolution without user confirmation — deferred until confidence threshold tuned
- Re-diagnosis in same chat thread with prior context — needs cloud sync
- Numeric severity scores — use descriptive labels instead

## Context

Shipped v1.2 Recommendation-First Plant Guide milestone (83 plans across 16 phases — Phases 10-24 including 14.1 — over 10 days, 2026-05-02 → 2026-05-12). v1.1 Precision Care shipped earlier (39 plans / 6 phases); v1.0 Diagnosis & Tracking shipped before that (7 plans / 3 phases). The app is on Google Play (internal track), preparing for public ship after v1.2 device-test backlog + 69-entry image-upload backlog + Perenual key rotation complete (tracked in `v1_2_test_backlog.md` memory).

**Current state (post-v1.2):** App pivoted from passive tracker to guided assistant. 6-section `MyPlantDetailModal` (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes + Mascotas + Diario) with override-detection note. Catalog is 118 expert-vetted entries with full EDU schema (`careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`), ASPCA-verified pet toxicity flags, and fertilizer-type content (industrial + homemade). PlantCard reduced to 5 elements with swipe-to-delete + long-press menu + always-visible mood emoji. Fertilization is a first-class task type with season-aware cadence. Plant Journal stores photos in `documentDirectory` (never base64). Three-tier smoke runner with STRICT cross-phase regression covers all phases 4-23 (single `smoke-phase23.cjs` invocation is sufficient pre-submit coverage). Codebase: ~39,322 LOC `src/` TS+TSX, project-wide `tsc --noEmit` strict, `check:i18n-keys` PASS on all 118 entries, `lint:voseo` PASS on ES locale.

**Tech stack:** React Native + Expo SDK 54, TypeScript strict, Supabase edge functions (with dual-payload backward compat; `identify-plant` + `get-plant-care` + `diagnose-plant` + `chat-diagnosis` + `waitlist`), AsyncStorage local-first with versioned envelope, RevenueCat premium gating, `@gorhom/bottom-sheet` v5 + Reanimated v4 + `react-native-gesture-handler` + `expo-haptics`, expo-image-manipulator for journal photo compression, single-compile-path smoke runner via `typescript.transpileModule` (no jest/vitest installed).

**Deferred items:** See `v1_2_test_backlog.md` memory for the device-test backlog + 69-entry image-upload backlog + Perenual key rotation + RevenueCat-gated PaywallModal Z-order iOS check. Same milestone-end batching pattern as v1.1.

## Constraints

- **Tech stack**: React Native + Expo SDK 54, TypeScript strict — no changes
- **Local-first**: All data in AsyncStorage (synced later in auth milestone)
- **Premium gate**: Problem tracking is premium-only; camera in chat follows existing message limits
- **AI frequency**: Follow-up interval decided by severity mapping (Watch closely=3d, Needs attention=7d, Minor=14d)
- **Edge functions**: Diagnosis through Supabase edge functions — API keys server-side
- **Design system**: Must use existing `src/theme.ts` values

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Camera in chat follows existing message gate | No separate camera gate — chat limit restricts free tier | ✓ Good |
| AI decides follow-up frequency via severity mapping | Different problems need different intervals — client maps severity to days | ✓ Good |
| AI suggests resolution, user confirms (not auto-resolve) | Reduces false positives from blurry photos while keeping UX smart | ✓ Good |
| Problem timeline in plant detail (not chat) | Plant-centric view is more natural than scrolling chat history | ✓ Good |
| Push + Hoy tasks for dual reminders | Ensures follow-ups aren't missed regardless of notification preferences | ✓ Good |
| Extend SavedDiagnosis in-place (not parallel collection) | Avoids stale cross-reference bugs, backward-compatible with optional fields | ✓ Good |
| NotificationContext for deep-link (not URL-based) | Lightweight, avoids deep-linking complexity, cold-start safe | ✓ Good |
| Emoji + text severity labels | Fits app's emoji-throughout convention, avoids anxiety of numeric scores | ✓ Good |
| Three-zone seasonality (Northern/Southern/Tropical) from day one | Avoids two-hemisphere assumption; tropical zone bypasses season flip | ✓ Good (v1.1) |
| Schema migration via versioned envelope `{schemaVersion, data}` + backup blob | Atomic from user's perspective; rollback safety net for one release | ✓ Good (v1.1) |
| Mode-as-dispatcher: waterMode toggles task type, NOT cadence math | Single SSOT across modes; future v1.2/v2 modes reuse cadence | ✓ Good (v1.1) |
| `getEffectiveSeason(location, climateOverride, date)` as public SSOT, `getWaterSeason` private | Single search-and-replace for 8 call sites; manual override wins over derived hemisphere | ✓ Good (v1.1) |
| Lookup-by-id catalog content (`getCatalogEntry(plant.databaseId)`) with `_aliases` | Patch updates to `tip` propagate to existing user plants on next render; renamed slugs don't orphan | ✓ Good (v1.1) |
| App-level PaywallModal context with deferred onSuccess callback | No nested-modal stacking; purchase auto-resends gated action; close-then-trigger contract documented | ✓ Good (v1.1) |
| Single-compile-path smoke runner (`typescript.transpileModule`) instead of jest/vitest | Zero new framework install; 752 assertions across 5 phase runners; carried Phase 4→9 | ✓ Good (v1.1) |
| Edge function dual-payload via discriminator (`!!ctx.waterSchedule`) | Backward-compat grace window for old clients; v1.2 sunset target | ⚠️ Revisit v1.2 |
| Defer manual ops (device tests, edge function deploys, image uploads) to end-of-milestone | Per user preference — full E2E test more efficient than per-phase smoke | ✓ Good (v1.1) |
| Perenual API key moved server-side via get-plant-care edge function (was in client bundle since v1.0 as EXPO_PUBLIC_PERENUAL_API_KEY; rotation deferred for trusted-test-build context — to be done before public ship) | Key was accidentally exposed in client bundle since v1.0; Phase 10 moves it exclusively to Supabase secrets (Deno.env.get). Rotation deferred: build is distributed to 5 trusted testers only, not a public APK — risk bounded. Rotate before any public store release. | ✓ Done (v1.2 Phase 10) |
| Recommendation-first pivot — app recommends what to do with horticultural rationale; user adjusts to their reality (4-section MyPlantDetailModal: ¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes) | Pivot away from passive tracking. Catalog extended with 5 EDU fields (`careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`); identification picker pre-selects the species' recommended `lightLevel`. "Tus ajustes" surfaces a soft override note when user differs from recommendation. Anchors the entire v1.2 milestone direction. | ✓ Good (v1.2 Phase 14) |
| Deep-merge guard for `useStorage.updatePlant` (PROTECTED_USER_FIELDS tuple) | CRIT-1 pitfall: catalog-source values silently overwriting user customizations on detail-modal re-open. Phase 14 EDU-06 introduced the PROTECTED_USER_FIELDS tuple guard; Phase 20 Plan 01 extended it to cover `Plant.fertilizeSchedule` (FERT-01). Any new user-editable field on `Plant` MUST be added to PROTECTED_USER_FIELDS at the same time. | ✓ Good (v1.2 Phase 14 + Phase 20) |
| Derived-only mood emoji / NO persistent streak counters in UI (GAM-05 anti-pattern lock) | Industry research: streak counters create anxiety and infantilize plant-serious users; missing a watering day is sometimes horticulturally correct. Mood emoji on PlantCard is DERIVED from `calculatePlantHealth(plant).healthLevel` — no per-plant streak history, no consecutive-day counters, no "N-day streak" UI anywhere. STRICT negative-grep enforced in `smoke-phase22.cjs` against `samplePlants/mockPlants/seedPlants/streakCount/CARE_STREAKS` tokens with documented whitelist (`gam_anti_patterns.md`). Blossom cautionary tale — sustained-engagement gamification was harmful at scale. Persistent streaks deferred to v2 (`STREAK-01/02` opt-in). | ✓ Good (v1.2 Phase 18 + Phase 22) |
| Journal photos in FileSystem `documentDirectory` (modern Paths/File/Directory API) — NEVER base64 in AsyncStorage | Phase 21 JOURNAL-02 lock: AsyncStorage has a ~6 MB practical ceiling on Android; base64 photo strings would saturate it within ~20 journal entries. `journalService.ts` saves to `<documentDirectory>/journals/<plantId>/<entryId>.jpg` (1080px @ 0.7 JPEG via `expo-image-manipulator`). `deletePlant` invokes `deleteJournalDirectory(plantId)` for orphan cleanup. `JournalEntry.photoUri` always holds a filesystem URI. Verified by startup size log + negative-grep against `data:image/.*;base64` tokens in journal code paths. | ✓ Good (v1.2 Phase 21) |
| Single App-root `BottomSheetModalProvider` wrap above the `Features.AUTH` branch (covers both AppContent paths via React context) | Phase 13 INFRA-02: the app has two AppContent paths (AUTH-on and AUTH-off) gated by `Features.AUTH`. Provider wraps at App.tsx root (above the branch) so both paths inherit the same `BottomSheetModalProvider` + `GestureHandlerRootView` context. Avoids double-wrapping (which would break sheet stacking) AND avoids per-branch wrapping (which would drift between AUTH-on/off). Same two-AppContent-paths discipline as the V1.1 `AuthProvider` skip pattern — preserved verbatim. PaywallModal Z-order coexistence verified in Phase 13 Plan 03 manual gate. | ✓ Good (v1.2 Phase 13) |
| ModalSectionId controlled extension precedent (Phase 19 `mascotas` + Phase 21 `diario`; Phase 20 deliberately did NOT extend) | `MyPlantDetailModal.ModalSectionId` is the discriminated union over scrollable sections. Phase 19 TOX-04 extended with `'mascotas'` (initialSection prop + ScrollView scrollTo-section mechanism). Phase 21 JOURNAL-04 extended with `'diario'`. Phase 20 FERT-06 deliberately did NOT extend — fertilize content lives inside the existing `'que-hacer'` section via orthogonal `initialExpanded` prop, avoiding union bloat for non-navigation expansion. Precedent: extend ModalSectionId ONLY when the new section requires a scroll-to-section navigation entry-point from outside the modal; use `initialExpanded` for in-section expansion. | ✓ Good (v1.2 Phase 19 + Phase 21) |
| Three-tier smoke runner discipline + STRICT cross-phase regression sentinels (Phase 19+); Option B end-of-milestone device-test deferral pattern (5 consecutive precedents — Phase 18-05 / 20-10 / 21-06 / 22-03 / 23-04; Phase 19-07 ONE outlier) | Three-tier pattern: (1) W0 scaffold STRICT PASS — files MUST exist; (2) SKIP→PASS placeholders — flip as later plans land code; (3) STRICT cross-phase regression — forked verbatim from prior phase, locks invariants. Each `smoke-phase<N>.cjs` runner ships in Wave 0 of its phase, is NOT modified after, and the latest runner in the chain (Phase 23 = `smoke-phase23.cjs`) is sufficient pre-submit coverage for Phase 18-22 invariants. Manual-checkpoint Option B (defer device-test to `v1_2_test_backlog.md` memory) is the established v1.2 closure pattern for non-source-code device-test gates — 5 consecutive precedents at the manual-checkpoint structural threshold. Phase 19-07 was the ONE Option A (run-now) outlier. Full manual device-test batch runs end-of-milestone before v1.2 App Store / Play Store submit, alongside the 69-entry image-upload backlog. | ✓ Good (v1.2 Phase 19-23) |

---
*Last updated: 2026-05-12 after v1.2 milestone — full evolution review: What This Is + Core Value updated for recommendation-first pivot; 16 v1.2 requirements moved to Validated; Active section reset to TBD pending `/gsd:new-milestone`; Context section refreshed (118-entry catalog, ~39,322 LOC, deferred items reference `v1_2_test_backlog.md` memory); Key Decisions table preserves all 18 prior + 7 v1.2 rows added in Phase 24 Plan 02. Previous: 2026-05-12 Phase 24 docs closure. v1.0/v1.1/v1.2 all shipped.*
