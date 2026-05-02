# Project Research Summary

**Project:** My Garden Care — v1.2 Recommendation-First Plant Guide
**Domain:** React Native plant care app — UX modernization, domain expansion, catalog hardening
**Researched:** 2026-05-01
**Confidence:** MEDIUM-HIGH (stack HIGH, architecture HIGH, features HIGH, pitfalls HIGH; Plant DB spec is authoritative user-provided, no external research needed)

---

## Executive Summary

v1.2 is the largest milestone to date: two scopes running in parallel on a single shipping tag. The first scope (the original six themes) pivots the app from passive tracker to guided assistant by adding an educational detail modal, fertilization scheduling, pet toxicity data, a per-plant journal, gamification toasts, and a mobile UX modernization pass (bottom sheets, swipe gestures, haptics, skeleton loaders). The second scope (Plant Database hardening and expansion) fixes an active Perenual API key leak, improves data quality, adds unknown-plant telemetry, and expands the catalog from 64 to 120 entries across seven content waves. Together they ship as roughly 15 phases under one milestone tag.

The recommended approach is dependency-first ordering. Three items must precede everything else: (1) the Perenual API key is currently exposed as `EXPO_PUBLIC_PERENUAL_API_KEY` — a public-facing env var committed to source — and must be moved to an edge function before any catalog expansion puts the key under additional load; (2) the v1.1 AsyncStorage backup must be cleaned up and the schema version bumped to 2 before new data models land; (3) the gesture/bottom-sheet native library triad (`react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet`) must be installed and wired into `App.tsx` before any swipe-gesture or bottom-sheet UI work begins, because these require a dev-client rebuild. The catalog content extension (educational fields for all 120 entries) forms the biggest single content-authoring effort and should run in parallel with feature phases, not block them.

The primary risks are: (1) the recommendation-first UI silently overwriting users' deliberately customized watering schedules if `updatePlant` is called with catalog defaults (CRIT-1); (2) pet toxicity data carrying real safety liability if sourced from AI without ASPCA cross-check (CRIT-2); (3) journal photo storage bloating AsyncStorage past the ~6MB Android limit if base64 URIs are used instead of file-system paths (CRIT-3); (4) `@gorhom/bottom-sheet` v5 having active bug reports under Expo SDK 54 + Reanimated v4 that require device testing before committing to the pattern; and (5) the `'fertilize'` task type needing a full discriminator sweep through five files before any UI work — same pattern as `'check_soil'` in Phase 5.

---

## Key Findings

### Recommended Stack

Five new npm packages are required; all existing packages are used in new ways for the remaining work. The critical constraint is Expo SDK 54 running with `newArchEnabled: true`, which mandates `react-native-reanimated` v4 (v3 is unsupported on New Architecture). `@gorhom/bottom-sheet` added Reanimated v4 support in v5.1.8 (July 2025); current stable is v5.2.11. The `ReanimatedSwipeable` convenience component has an active iOS crash bug with RNGH 2.28 + Reanimated 4.1; swipe gestures must use the lower-level `Gesture.Pan()` API instead. Skeleton loaders should be custom (30-40 LOC using `expo-linear-gradient` + Reanimated v4 `withRepeat`/`withTiming`) because every third-party skeleton library targets Reanimated v2 or v3 and will conflict. Lottie (`lottie-react-native ^7.3.6`) is optional for streak celebration animations and can be deferred until designer provides JSON assets.

The Perenual API security fix requires a new edge function `get-plant-care` mirroring the `identify-plant` pattern. This is a straightforward proxy pattern with no new external dependencies.

**New packages:**

- `react-native-reanimated` (v4 via `npx expo install`) — drive bottom sheet, skeleton shimmer, swipe gestures; required by New Architecture
- `react-native-gesture-handler` (`~2.28.0` via `npx expo install`) — pan gestures for swipe-to-delete/complete; peer dep of bottom-sheet
- `@gorhom/bottom-sheet` (`^5.2.11`) — standard for short-action bottom sheets; v5.1.8+ required for Reanimated v4 support
- `expo-haptics` (via `npx expo install`) — tactile feedback on swipe, task completion, streak toast; first-party Expo package, zero risk
- `lottie-react-native` (`^7.3.6`) — streak celebration animations; optional, defer until Lottie JSON assets exist

**App.tsx provider hierarchy change required before any gesture/sheet UI:**

`GestureHandlerRootView` must be the outermost gesture boundary, with `BottomSheetModalProvider` inside it (portal layer wrapping NavigationContainer), inside `SafeAreaProvider` and `StorageProvider`. Both `AppContentMVP` and `AppContentFull` paths must include this change in the same commit.

**Data sources (no new API calls beyond the edge function proxy):**

- Pet toxicity: ASPCA Animal Poison Control plant lists (cats + dogs) — manual cross-reference for all catalog entries; no API, no license fee
- Fertilization cadences: static per-category baselines from horticultural sources as `plantDatabase.ts` fields
- `poisonous_to_pets` Perenual field exists but coverage is inconsistent for LATAM species; ASPCA manual lookup is more reliable

### Expected Features

Research confirms best-in-class plant apps (Planta, Greg, Blossom) lead with actionable guidance, not taxonomy. The four-section design (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes) directly matches this pattern. The "¿Por qué?" rationale section is a genuine differentiator — most competitors omit scientific reasoning. Fertilization as a separate task in the Hoy screen (alongside watering) is market standard. Gamification must be positive-only toasts, never streak counters that reset.

**Must have (table stakes):**

- Educational Detail Modal — 4 sections, catalog extension for 64 existing + 56 new entries (`careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`)
- Fertilization scheduling — `fertilizeIntervalWarm`/`fertilizeIntervalCold` per catalog entry, season-aware, Hoy task type, `lastFertilizedAt` on Plant
- Pet toxicity data — ASPCA-verified `petToxicity: { cats, dogs }` for all catalog entries; badge on PlantCard (toxic/mild only); detail section with disclaimer
- Plant journal — per-plant `JournalEntry` (date, photoUri from file system, note, optional care tag); quick-add via bottom sheet; reverse-chronological timeline
- Swipe-to-delete PlantCard — `Gesture.Pan()` API (not `ReanimatedSwipeable`); haptic at threshold; bottom sheet confirmation (no instant delete)
- Haptic feedback + completion toast on task completion in Hoy screen
- Perenual API key secured in `get-plant-care` edge function before catalog expansion
- Catalog expansion +56 plants in 7 waves (64 to 120), each wave includes educational fields and toxicity data

**Should have (competitive differentiators):**

- Unknown plant tracking — `unknownPlantTracker.ts` writing to `@unknown_plants` in AsyncStorage; fire-and-forget after catalog miss in `getEnrichedPlantData()`
- Pet-safe filter in catalog browse (differentiator — most apps lack this)
- Pet-safe warning on plant add (requires `hasCats`/`hasDogs` user prefs)
- Journal care tags (repotted / nueva hoja / problema / observación)
- Skeleton loaders for plant detail modal while Perenual data loads
- PlantCard cleanup: reduce 10 visual elements to 5; tip italic collapses to detail
- Microcopy + brand voice: voseo on all action buttons, illustrated empty states
- UAT bug fixes: outdoor task gate, picker outdoor labels, identification dedup, textSecondary WCAG AA contrast

**Defer to v1.3+:**

- Light streak toast (`CARE_STREAKS` flag already defined as V2.0 in `features.ts`)
- Per-plant care consistency score (health score from v1.0 covers this adequately)
- Auto-journal entry on care completion (complexity before journal adoption is validated)
- Illustrated empty states (pure polish; low conversion impact)
- Pet toxicity for PlantNet species outside the 64/120 catalog (show "no data" honestly)

### Architecture Approach

All v1.2 changes integrate additively into the existing local-first architecture. No new sync service, no new navigation stack, no new top-level tabs. The five key integration patterns are: (1) additive optional fields on `AppData` with graceful load-time defaults — `CURRENT_SCHEMA_VERSION` bumps to 2 at milestone start to establish a clean boundary; (2) mode-as-dispatcher for `'fertilize'` extending the existing `Task.type` union — same pattern as `'check_soil'`; (3) catalog-only vs. per-plant data boundary — educational fields and toxicity live on `PlantDBEntry` (never persisted), while `lastFertilizedAt` and `JournalEntry[]` live on per-user `Plant`/`AppData`; (4) pure derived data for streaks and scores — derive from `lastWatered` + `waterSchedule` per render rather than caching; (5) the `getCatalogEntry(plant.databaseId)` live-lookup pattern means all new catalog fields propagate to existing users on next app version automatically.

**New files created in v1.2:**

- `src/components/PlantDetail/` — `CareActionSection`, `PlacementSection`, `WhySection`, `UserSettingsSection`
- `src/components/PlantJournal/` — `JournalEntryList`, `JournalEntryForm`
- `src/components/ToxicityBadge.tsx`
- `src/utils/fertilizeLogic.ts` — `getNextFertilizeDate()` pure function
- `src/utils/streaks.ts` — `getWaterStreakStatus()` pure function
- `src/services/unknownPlantTracker.ts` — fire-and-forget catalog miss logging
- `supabase/functions/get-plant-care/` — Perenual API proxy edge function

**High-touch files modified across many phases:**

- `src/types/index.ts` — new types (`JournalEntry`, `FertilizeSchedule`, `PetToxicity`, `ToxicityLevel`); Task.type union extended; `PlantDBEntry` and `Plant` extended
- `src/data/plantDatabase.ts` — all 120 entries (64 existing + 56 new) with new fields
- `src/hooks/useStorage.tsx` — journals field + 3 actions + load-time default + `deletePlant` cleanup
- `App.tsx` — `GestureHandlerRootView` + `BottomSheetModalProvider` added to BOTH AppContent paths
- `src/i18n/locales/{en,es}/plants.json` — ~390 new string keys for 64 existing entries alone

### Critical Pitfalls

1. **Recommendation overwrites user custom values (CRIT-1)** — Never call `updatePlant` with catalog-default values as the payload. The picker must reflect the user's current stored value; catalog values are display-only suggestions. "Tus ajustes" section is read-only with a single "Ajustar" CTA. Smoke test: open picker, close without saving, assert `updatePlant` was not called with catalog data.

2. **Pet toxicity data sourced from AI alone (CRIT-2)** — Every catalog entry must have ASPCA source URL cited in a code comment. Use `safe | caution | toxic | unknown` — never leave the field absent (absence reads as safe). Add a single legal disclaimer sentence in the UI. Do not claim coverage for PlantNet species outside the catalog.

3. **Journal photos stored as base64 in AsyncStorage (CRIT-3)** — Journal photo URIs must be permanent local file paths (`FileSystem.documentDirectory + 'journals/' + uuid + '.jpg'`). Never store base64 in journal entries. Add a dev-only startup log of AppData JSON byte size; warn at 1MB, error at 3MB.

4. **`BottomSheetModalProvider` missing from one AppContent path (CRIT-4)** — Add to BOTH `AppContentMVP` and `AppContentFull` in the same commit. Smoke guard: `grep -c "BottomSheetModalProvider" App.tsx` must return 2. Comment in `AppContentFull`: `// TWO-PATH DISCIPLINE: keep in sync with AppContentMVP`.

5. **`'fertilize'` task type not fully propagated (CRIT-5)** — Discriminator sweep is a blocking gate before any UI work: `DayDetail.tsx`, `DayDetailModal.tsx`, `MonthCalendar.tsx`, `TaskButton.tsx`, `notificationScheduler.ts`. Same pattern as `'check_soil'` in Phase 5. Use TypeScript `never` exhaustiveness default in all switches going forward.

6. **Perenual API key exposed in client (Plant DB scope)** — `EXPO_PUBLIC_PERENUAL_API_KEY` is visible in the compiled JS bundle today. Must be moved to `get-plant-care` edge function and rotated before the milestone ships any new catalog work.

---

## Implications for Roadmap

Suggested phase count: ~15 phases (ONE milestone tag, shipped incrementally).

### Phase 1: Security — Perenual API Key Migration

**Rationale:** The API key is currently a `EXPO_PUBLIC_` env var visible in the compiled JS bundle. Live security risk that gets worse as catalog expansion increases API usage.
**Delivers:** New `get-plant-care` Supabase edge function mirroring `identify-plant`; key rotated; `EXPO_PUBLIC_PERENUAL_API_KEY` removed from `.env` and `.env.example`; `plantKnowledgeService.ts` updated to call the edge function.
**Architecture:** `supabase/functions/get-plant-care/` — standard Supabase edge function proxy pattern.
**Research flag:** None — mirrors existing `identify-plant` structure exactly.

### Phase 2: Data Quality — Perenual Response Hardening

**Rationale:** Before expanding the catalog, validate that the Perenual data pipeline matches results correctly. `plants[0]` is currently accepted without checking if it matches the queried species.
**Delivers:** `plants[0]` match validator (compare scientific name to query); `tempMax` derived dynamically from `hardiness.max`; `humidity` inferred from `family`/`type`; improved data fidelity for all 120 future catalog entries.
**Architecture:** Additive improvements to `plantKnowledgeService.ts:getEnrichedPlantData()`.
**Research flag:** None — spec is authoritative from user.

### Phase 3: Housekeeping — Schema Version Bump + Backup Cleanup

**Rationale:** The v1.1 AsyncStorage backup (`plant-agenda-v2.backup-pre-v1.1`) doubles storage for all migrated users. `migration.ts` TODO explicitly calls out v1.2 as the cleanup point. `_migratedFromV0` is marked "Removed in v1.2" in `types/index.ts`. Must happen before new data models land.
**Delivers:** `CURRENT_SCHEMA_VERSION` bumped to 2; `cleanupBackup_v1_1()` called on first launch; `_migratedFromV0` removed from `Plant` type; no-op v1 to v2 migration identity function.
**Avoids:** MOD-8 (stale backup bloat), MIN-1 (schema version desync), MIN-2 (MigrationBanner false-positive), MIN-5 (`_migratedFromV0` not cleaned up).

### Phase 4: Unknown Plant Tracking

**Rationale:** Independent of all other phases — no blockers, no blockers on others. Provides product intelligence on which species are missing from the catalog, directly informing wave priorities.
**Delivers:** `src/services/unknownPlantTracker.ts`; fire-and-forget call after `getPlantById` miss in `getEnrichedPlantData()` at `plantKnowledgeService.ts:400`; data written to AsyncStorage key `@unknown_plants`.
**Architecture:** Additive service; no UI, no type changes, no schema bump.
**Research flag:** None — straightforward implementation.

### Phase 5: Gesture + Bottom-Sheet Infrastructure

**Rationale:** Foundation for all swipe-gesture and bottom-sheet UI. Requires a dev-client rebuild — cannot be verified in Expo Go. Must be a standalone validated phase before building UI on top.
**Delivers:** `react-native-reanimated` + `react-native-gesture-handler` + `@gorhom/bottom-sheet` + `expo-haptics` installed via `npx expo install`; `GestureHandlerRootView` and `BottomSheetModalProvider` added to BOTH AppContent paths in `App.tsx`; app boots without crash on dev client.
**Architecture:** Provider hierarchy change in `App.tsx`; no feature UI yet.
**Avoids:** CRIT-4 (missing provider in one AppContent path), MOD-5 (keyboard + bottom sheet conflict), MOD-6 (z-order vs PaywallModal).
**Research flag:** MEDIUM risk — active bug reports on `@gorhom/bottom-sheet` v5.2.11 with Expo SDK 54 (issues #2528, #2471). Device test required before proceeding. Fallback: custom `Animated.View` + `PanResponder` for the 2-3 limited action-sheet use cases.

### Phase 6: Educational Detail Modal + Catalog Content Extension (64 Existing Entries)

**Rationale:** The centerpiece feature. Catalog content for 64 existing entries authored here — users have these plants now. Expansion waves follow. Depends on type foundation (done in this phase).
**Delivers:** `MyPlantDetailModal.tsx` decomposed to orchestrator + `PlantDetail/` section components (`CareActionSection`, `PlacementSection`, `WhySection`, `UserSettingsSection`); `PlantDBEntry` extended with 5 new optional fields; all 64 existing entries authored in both locales; `check-i18n-keys.mjs` guard extended; identification picker pre-selects species recommendation without overwriting existing custom values.
**Architecture:** `PlantDetail/` directory mirroring `PlantIdentifier/` and `PlantDiagnosis/` patterns; `getTranslatedPlant()` extended.
**Avoids:** CRIT-1 (recommendation overwrites custom values), Anti-Pattern 6 (careAction as paragraph), MOD-2 (catalog quality drift).
**Research flag:** Content authoring effort — ~390 new strings for 64 entries across 2 locales. Establish voseo linter and per-entry authoring checklist (`careAction` ≤ 120 chars, imperative voseo, source URL per entry) before starting.

### Phase 7: Catalog Expansion Wave 3.1 — Interior Tropicals (23 Plants)

**Rationale:** Largest single wave; interior tropicales are the most commonly owned houseplants in the LATAM market. Each new entry includes full educational fields + toxicity data from the start.
**Delivers:** 23 new `plantDatabase.ts` entries (zamioculca, pilea, tradescantia, hiedra, croton, difenbaquia, fitonia, cheflera, anthurium, begonia-rex, arbol-dinero, maranta, helecho-boston, helecho-nido, alocasia, caladium, palmera-areca, palmera-kentia, costilla-adan, singonio, aglaonema, ficus-lyrata, cola-burro); all educational fields + `petToxicity` ASPCA-verified per entry; both locale files; catalog images.
**Avoids:** CRIT-2 (toxicity from AI alone — ASPCA source URL required per entry in code comment).

### Phase 8: Catalog Expansion Waves 3.2 through 3.7 (33 More Plants)

**Rationale:** Remaining six waves batched. Each wave follows the same authoring checklist as Wave 3.1.
**Delivers:** Wave 3.2 Suculentas y cactus (10), Wave 3.3 Exterior flores (8), Wave 3.4 Aromáticas (3), Wave 3.5 Frutales/Huerta (3), Wave 3.6 Trepadoras y colgantes (4, species names TBD), Wave 3.7 Trending (5); catalog at 120 entries total.
**Research flag:** Wave 3.6 plant names are TBD — one targeted research pass needed before authoring. Waves 3.2–3.5/3.7 are well-documented species.

### Phase 9: PlantCard Cleanup + Swipe-to-Delete

**Rationale:** Depends on gesture infra (Phase 5). PlantCard cleanup (10 to 5 elements) and swipe-to-delete are the same component touch — batch them. Catalog entries have toxicity data by this point.
**Delivers:** `PlantCard.tsx` wrapped in `Gesture.Pan()` swipe-to-delete (NOT `ReanimatedSwipeable` — iOS crash bug); haptic at 80px threshold; bottom-sheet confirmation (not instant delete); PlantCard visual reduced to 5 elements; `ToxicityBadge` added (toxic/mild species only); health badge hidden when score >= 80 with one-time tooltip for returning users.
**Avoids:** MOD-4 (gesture conflict with FlatList scroll — use `friction={2}`), MIN-3 (badge hidden without communication).

### Phase 10: Pet Toxicity Dataset + UI

**Rationale:** Toxicity data can be authored across catalog phases; this phase surfaces the UI and ensures 100% catalog coverage. `ToxicityBadge` component already exists from Phase 9.
**Delivers:** `petToxicity` audited for all 120 entries (ASPCA cross-checked); toxicity section in `PlantDetail/WhySection.tsx`; `petSafety.*` i18n keys in `common.json`; legal disclaimer sentence; `'unknown'` displayed honestly for LATAM species not in ASPCA database.
**Avoids:** CRIT-2 (unverified toxicity data), Anti-Pattern 4 (toxicity labels in `plants.json` — use `common.json` enum lookup).

### Phase 11: Fertilization Subsystem

**Rationale:** Full subsystem expansion — same rigor as `check_soil` mode in Phase 5 of v1.1. Must include type extension, discriminator sweep, task generation, notification wiring, and UI in a single phase to avoid the "looks done but isn't" failure mode.
**Delivers:** `'fertilize'` added to `Task.type` union; discriminator sweep across all five files (tsc green required before any UI); `fertilizeLogic.ts` (`getNextFertilizeDate()`); `getTasksForDay()` extended; `fertilizeIntervalWarm`/`fertilizeIntervalCold` on all 120 catalog entries; `Plant.fertilizeSchedule` optional field; season-aware scheduling (no fertilize tasks when `fertilizeIntervalCold` is null); `FERTILIZE_SCHEDULE` feature flag in `features.ts`.
**Architecture:** Mirrors `waterMode`/`check_soil` dispatcher pattern exactly; `getEffectiveSeason()` SSOT reused.
**Avoids:** CRIT-5 (incomplete discriminator sweep), MOD-9 (fertilize gating decision — flag from day one).
**Research flag:** Explicit design decision required before implementation: Is fertilize schedule config free, or are push notifications premium-gated? Recommendation: schedule config free, push notifications premium.

### Phase 12: Plant Journal

**Rationale:** New data model; independent of task machinery. Ships after fertilization to avoid concurrent `useStorage.tsx` changes.
**Delivers:** `JournalEntry` type; `AppData.journals` field (additive optional, defaults to `{}`); `useStorage.tsx` extended with 3 new actions + orphan cleanup in `deletePlant()`; `PlantJournal/` components; photo picker writing to `FileSystem.documentDirectory` (never base64); quick-add via bottom sheet using `BottomSheetTextInput`; reverse-chronological timeline; care tag enum.
**Architecture:** Top-level `journals: Record<plantId, JournalEntry[]>` mirrors `diagnosisHistory` pattern; `climateOverride` additive-optional precedent from v1.1 covers the data model.
**Avoids:** CRIT-3 (base64 photo storage), MIN-6 (journal orphan on plant delete), MOD-5 (standard `TextInput` in bottom sheet).

### Phase 13: Gamification — Completion Toasts + Haptics

**Rationale:** Haptics require gesture infra (Phase 5). Streak logic is pure derived data — no new storage. Includes swipe-right-to-complete gesture on Hoy screen tasks.
**Delivers:** `streaks.ts` (`getWaterStreakStatus()` pure function); completion toast — transient 2-second overlay, no counter visible; `expo-haptics.impactAsync(Medium)` on task completion swipe; swipe-right to complete Hoy tasks with distinct green affordance; no visible streak counter anywhere in UI.
**Avoids:** MOD-7 (streak counter anti-pattern — celebration only, no punishment, no reset counter).

### Phase 14: Polish — Microcopy, Brand Voice, UAT Bug Fixes

**Rationale:** Polish last; requires all other features to exist so copy can reference them correctly.
**Delivers:** Voseo linter script (all locale files); all new action button strings in voseo form; outdoor task gate fix (`getTasksForDay` — no "Sacar afuera" for outdoor plants); `getLightLabel(isOutdoor: boolean)` for outdoor picker labels; identification entry-point dedup; `textSecondary` color bumped to WCAG AA contrast; sample-data path in onboarding; skeleton loaders for plant detail modal.
**Avoids:** MIN-3 (voseo drift), MOD-1 (recommendation tone sounds judgmental), MOD-10 (outdoor light labels wrong — if this blocks Phase 6 work, pull the label fix forward).

### Phase 15: Documentation Update

**Rationale:** `CLAUDE.md` must reflect the new edge function architecture and key v1.2 decisions.
**Delivers:** `CLAUDE.md` updated with `get-plant-care` edge function; Perenual key removal documented; edge function dual-payload backward-compat sunset decision recorded; v1.2 architectural decisions in `PROJECT.md` Key Decisions table.
**Research flag:** None — documentation pass only.

---

### Phase Ordering Rationale

- Security before catalog (Phases 1-2 first): The Perenual key is live risk today. Every catalog expansion call is a call on the exposed key.
- Housekeeping before new data models (Phase 3 third): Cleaning the backup and bumping the schema version must precede journal and fertilization fields.
- Unknown plant tracking early and independent (Phase 4): Zero blockers; provides catalog priority intelligence while everything else runs.
- Gesture infra as a standalone blocking phase (Phase 5): Requires dev-client rebuild. One blocking rebuild is better than rebuilding mid-feature. All swipe/sheet UI in Phases 9, 12, 13 depends on this.
- Educational modal before catalog expansion (Phase 6): The 64 existing user plants get educational fields first. Expansion waves follow the established authoring pattern.
- Catalog waves before PlantCard cleanup (Phases 7-8 before 9): PlantCard will show toxicity badges; better to have data populated before the badge component is wired.
- Fertilization as a complete subsystem (Phase 11): Treating it as just a UI feature without all five discriminator sites is the CRIT-5 failure mode.
- Journal after fertilization (Phase 12): Both touch `useStorage.tsx` and `AppData`; serializing avoids concurrent conflicts.
- Polish last (Phase 14): Microcopy can only be finalized when all features exist and their UI surfaces are known.

### Research Flags

Phases needing deeper investigation or explicit design decisions during planning:

- **Phase 5 (Gesture + Bottom-Sheet infra):** Active bug reports on `@gorhom/bottom-sheet` v5.2.11 with Expo SDK 54 (issues #2528, #2471). Verify on dev client before proceeding. Have a custom `Animated.View` + `PanResponder` fallback scoped for the 2-3 action-sheet use cases.
- **Phase 6 (Educational Modal content):** ~390 new strings across 2 locales for 64 entries. Establish voseo linter and per-entry authoring checklist before entry 1.
- **Phase 8 (Wave 3.6 Trepadoras):** Plant names are TBD — one targeted research pass needed.
- **Phase 10 (Pet Toxicity — LATAM coverage):** ASPCA may not list LATAM-endemic species. Classify as `'unknown'` and add LATAM veterinary source to authoring checklist.
- **Phase 11 (Fertilization gating):** Explicit design decision required before implementation: schedule config free, push notifications premium (recommendation).
- **Phase 14 (Outdoor labels UAT fix):** If outdoor light label bug blocks Phase 6 educational modal work, pull this fix forward.

Phases with well-established patterns (skip research phase):

- **Phase 1 (Security):** Mirrors `identify-plant` edge function exactly.
- **Phase 3 (Housekeeping):** `cleanupBackup_v1_1()` already written; additive-optional pattern proven by v1.1.
- **Phase 4 (Unknown tracker):** Simple AsyncStorage write. No external dependencies.
- **Phase 9 (PlantCard swipe):** `Gesture.Pan()` API documented in STACK.md; `friction={2}` for FlatList coexistence is a proven pattern.
- **Phase 12 (Journal):** `climateOverride` additive-optional precedent from v1.1 covers the data model exactly.
- **Phase 13 (Toasts + Haptics):** `expo-haptics` API is trivial; celebration toast is a simple animated `View`.
- **Phase 15 (Docs):** Documentation pass only.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 5 new packages verified against Expo SDK 54 + New Architecture. Reanimated v4 requirement confirmed from `app.json` + SDK 54 docs. One active risk: `@gorhom/bottom-sheet` open bug reports — fallback scoped. |
| Features | HIGH | Educational modal structure confirmed against Planta/Greg/Blossom competitive analysis. ASPCA dataset confirmed as authoritative. Fertilization cadences confirmed across multiple independent horticultural sources. |
| Architecture | HIGH | All integration points read directly from source code. Additive-optional pattern proven by `climateOverride` in v1.1. Discriminator sweep pattern proven by `check_soil` in Phase 5. No speculative decisions. |
| Pitfalls | HIGH | Pitfalls grounded in direct source code reading — not generic mobile advice. CRIT-1 through CRIT-5 are concrete code paths with line-level prevention strategies. |
| Plant DB spec | HIGH | User-provided authoritative spec. Wave 3.6 species names are the only gap (4 plants, TBD by design). |

**Overall confidence:** HIGH

### Gaps to Address

- **`@gorhom/bottom-sheet` stability on Expo SDK 54:** Issues #2528, #2471, #2507 are active. Decision: test on dev client at Phase 5; if crashes reproduced, switch to `Animated.View` + `PanResponder` for the 2-3 action-sheet use cases. Do not block the milestone on the library.
- **LATAM plant toxicity coverage:** ASPCA may not list LATAM-endemic species. Strategy: classify as `'unknown'`, surface in UI, and add a LATAM veterinary source (Argentine SENASA or similar) to Phase 10 authoring checklist.
- **Catalog Wave 3.6 plant names:** 4 species TBD — one research pass at Phase 8 planning.
- **`get-plant-care` edge function rate limits:** Perenual rate limits may behave differently when calls route through a shared edge function origin. Check limits at Phase 1 and add response caching if needed (same `plant_knowledge` Supabase table already serves as cache tier).
- **Edge function dual-payload backward-compat sunset:** PROJECT.md flags `discriminator (!!ctx.waterSchedule)` as "Revisit v1.2." Phase 15 (docs) is the decision point.

---

## Sources

### Primary (HIGH confidence)

- `src/types/index.ts` — Plant, PlantDBEntry, AppData, Task union (read directly, v1.1 state)
- `src/hooks/useStorage.tsx` — persistence model, deletePlant, `climateOverride` additive precedent
- `src/utils/migration.ts` — CURRENT_SCHEMA_VERSION=1, cleanupBackup_v1_1 TODO, v1.2 cleanup target
- `src/data/plantDatabase.ts` — 64 entries, PlantDBEntry structure, getTranslatedPlant
- `App.tsx` — provider hierarchy (no GestureHandlerRootView currently), two AppContent paths confirmed
- `package.json` — confirmed absence of reanimated, gesture-handler, bottom-sheet, haptics
- `src/config/features.ts` — CARE_STREAKS defined as V2.0, confirming streak counter is correctly deferred
- `scripts/check-i18n-keys.mjs` — guard logic, nutrients conditional pattern (v1.2 will extend)
- Expo SDK 54 changelog — New Architecture default, Reanimated v4 requirement confirmed
- ASPCA Toxic and Non-Toxic Plants database — canonical pet toxicity source, cats + dogs lists
- @gorhom/bottom-sheet v5.1.8 release — Reanimated v4 support added 2025-07-27; v5.2.11 current stable
- gorhom/bottom-sheet issues #2528, #2471, #2507 — Expo SDK 54 compatibility (active, unresolved)
- Perenual API docs — `poisonous_to_pets` field confirmed; coverage inconsistent for LATAM species

### Secondary (MEDIUM confidence)

- Planta UX copy review (Medium, Mar 2025) — Care tab structure: task-first, then education
- Greg plant care guide pages (greg.app/plant-care) — Water/Light/Nutrients/Problems structure confirmed
- Blossom App Store reviews 2024 — journal feature (photo + note), premium gating trust failure
- Savvy Gardening, almanac.com, provenwinners.com — fertilization cadence baselines by category
- gorhom/bottom-sheet issues #1389, #1846 — GestureHandlerRootView and SafeAreaProvider ordering
- ReanimatedSwipeable crash issue #3720 — iOS crash with RNGH 2.28 + Reanimated 4.1
- moti issue #391 — confirmed incompatible with Reanimated v4 / Expo SDK 54 (skeleton library rejection rationale)

### Tertiary (LOW confidence)

- Planta streak specifics — not publicly documented; pattern inferred from reviews and competitor analysis
- Competitor swipe gesture implementations — Planta confirmed; Greg/Blossom inferred from indirect sources

---

*Research completed: 2026-05-01*
*Scope: v1.2 Recommendation-First Plant Guide — BOTH scopes (original 6 themes + Plant DB hardening/expansion)*
*Ready for roadmap: yes*
