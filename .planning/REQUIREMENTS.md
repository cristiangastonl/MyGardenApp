# Requirements: My Garden Care — v1.2 Recommendation-First Plant Guide

**Defined:** 2026-05-02
**Core Value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten. v1.2 pivot: app *recommends* what to do (with horticultural rationale) and *tracks* user adjustments to their reality, instead of passively recording user-defined values.
**Milestone Goal:** Combined scope — (A) UX pivot from passive tracker to guided assistant + (B) Plant Database security hardening + data quality + tracking + +56 plant expansion (64 → 120).

## v1.2 Requirements

### Perenual Security Hardening (SEC)

- [x] **SEC-01**: `EXPO_PUBLIC_PERENUAL_API_KEY` is removed from `.env`, `.env.example`, and the client bundle (no `process.env.EXPO_PUBLIC_PERENUAL_API_KEY` reference in `src/`)
- [x] **SEC-02**: New Supabase edge function `get-plant-care` proxies Perenual search + details using `Deno.env.get('PERENUAL_API_KEY')` server-side, mirroring `identify-plant` structure
- [x] **SEC-03**: `plantKnowledgeService.fetchFromPerenual()` is replaced with `supabase.functions.invoke('get-plant-care', { body: { plantName, lang } })`
- [ ] **SEC-04**: Perenual API key is rotated in the Perenual dashboard before merge; old key invalidated
- [x] **SEC-05**: CLAUDE.md documents the new edge function deploy command and the post-deploy verification (Supabase Functions logs check)

### Perenual Data Quality (DATA)

- [x] **DATA-01**: Edge function adds `isGoodMatch(query, result)` validator — checks bidirectional `lowercase().includes(...)` overlap between query and `common_name`/`scientific_name`; failed match returns `null` (no cached garbage)
- [x] **DATA-02**: `parseHardiness()` reads `hardiness.max` (USDA zone → °C mapping) when present; falls back per category: indoor tropical 32, succulent/cactus 40, templada 35, fría 28
- [x] **DATA-03**: `convertPerenualToKnowledge()` infers `humidity` from `plant.family` and `plant.type`: `araceae`/tropical → `'alta'`; `cactaceae`/`crassulaceae`/succulent/cactus → `'baja'`; default → `'media'`
- [ ] **DATA-04**: Identifying a plant not in the curated catalog produces enriched data with `tempMax ≠ 35` and `humidity ≠ null` in ≥80% of cases (verified via test fixture of 5 known species)

### Unknown Plant Tracking (TRACK)

- [x] **TRACK-01**: New service `src/services/unknownPlantTracker.ts` exports `trackUnknownPlant(scientificName, commonName, family)` and `getUnknownPlantsReport()` writing to AsyncStorage key `@unknown_plants` (Record<scientificName, UnknownPlantEntry>)
- [x] **TRACK-02**: `getEnrichedPlantData()` calls `trackUnknownPlant` (fire-and-forget, non-blocking) when `getPlantById(scientificName)` returns no curated entry — BEFORE the Perenual fallback chain
- [x] **TRACK-03**: Settings → Dev tools section shows `getUnknownPlantsReport()` sorted desc by count (read-only — used to prioritize future expansion phases)

### Gesture + Bottom-Sheet Infrastructure (INFRA)

- [x] **INFRA-01**: 4 native dependencies installed via `npx expo install`: `react-native-reanimated@^4`, `react-native-gesture-handler` (compatible v4), `@gorhom/bottom-sheet@^5.1.8`, `expo-haptics`
- [x] **INFRA-02**: `App.tsx` provider hierarchy updated to wrap `StorageProvider` with `GestureHandlerRootView` and add `BottomSheetModalProvider` — single App-root wrap above the `Features.AUTH` branch; both AppContent paths inherit context (grep count assertion = 3 per ROADMAP success-criterion adjustment)
- [x] **INFRA-03**: Custom `Skeleton` component using `expo-linear-gradient` + Reanimated v4 `withRepeat/withTiming` (30 LOC; replaces full-screen `LoadingScreen` for inline loads)
- [x] **INFRA-04**: Verified on iOS + Android device (Expo Go or dev client) that bottom-sheet gestures work without Z-order glitch with App-level `PaywallModal`

### Educational Detail Modal (EDU)

- [x] **EDU-01**: `MyPlantDetailModal` restructured into 4 sections: "¿Qué hacer?" (action card), "¿Dónde ponerla?" (placement recommendation + alternatives + avoid), "¿Por qué?" (rationale, collapsable), "Tus ajustes" (current user state with override-detection)
- [x] **EDU-02**: `PlantDBEntry` type extended with 5 new optional fields: `careAction: { fixed?: string, soilCheck?: string }`, `placementRecommended: string`, `placementAlternatives: string[]`, `placementAvoid: string`, `whyRationale: string` (additive, no schema bump per architecture research)
- [x] **EDU-03**: All 64 existing catalog entries gain content for the 5 new fields in BOTH EN and ES (es-AR voseo for ES) — total ~640 new strings; AI-drafted + horticultural review
- [x] **EDU-04**: `IdentificationResults` LightLevelPicker pre-selects the species' recommended `lightLevel` (closes UAT #1 — picker recommendation visible)
- [x] **EDU-05**: When user's chosen value (e.g., `lightLevel`, `waterSchedule.warm`) differs from the catalog recommendation, "Tus ajustes" section shows a soft note ("Diferente a la recomendación para esta especie. ¿Querés ajustar?") — non-pushy
- [x] **EDU-06**: `useStorage.updatePlant` deep-merge guard prevents catalog-source values from silently overwriting user customizations (Pitfall CRIT-1 from research)
- [x] **EDU-07**: `check-i18n-keys.mjs` extended to validate the 5 new fields when present on entry; nutrient-conditional pattern (line 66) is the template

### Catalog Expansion Wave A — Interior Tropicales (CAT, continuing v1.1 numbering)

- [x] **CAT-09**: 23 new interior/tropical entries added to `plantDatabase.ts` with full v1.1 + EDU schema: zamioculca, pilea, tradescantia, hiedra, croton, difenbaquia, fitonia, cheflera, anthurium, begonia-rex, arbol-dinero, maranta, helecho-boston, helecho-nido, alocasia, caladium, palmera-areca, palmera-kentia, costilla-adan, singonio, aglaonema, ficus-lyrata, cola-burro
- [x] **CAT-10**: All 23 Wave A entries have full keyset in EN + ES (`name`, `tip` (voseo for ES), `description`, `problems[]` length ≥1, `nutrients`); `npm run check:i18n-keys` passes
- [x] **CAT-11**: All 23 Wave A entries are added to `PLANT_TYPE_MAP` and `COMMON_NAMES_ES` in `plantIdentification.ts` so PlantNet identification routes them to the curated entry
- [x] **CAT-12**: All 23 Wave A entries' images are uploaded to Supabase Storage `plant-images/catalog/<id>.jpg` OR documented as accepted-known failure in CLAUDE.md (mirrors v1.1 stance for the 14 LATAM)

### Catalog Expansion Wave B — Suculentas/Cactus + Trepadoras + Trending (CAT)

- [x] **CAT-13**: Wave 3.2 — 10 succulents/cactus added: kalanchoe, siempreviva, piedras-vivas, nopal, mammillaria, corona-espinas, gasteria, senecio-rowleyanus, cactus-navidad, agave
- [x] **CAT-14**: Wave 3.6 — 4 trepadoras/colgantes added (species names finalized during research at planning time)
- [x] **CAT-15**: Wave 3.7 — 5 trending entries added: strelitzia, eucalipto, bambu-suerte, sansevieria-cilindrica (Dracaena angolensis — distinguished from existing `sansevieria`), cactus-san-pedro
- [x] **CAT-16**: Waves B all have full v1.1 + EDU keyset, identification map entries, and image plan (uploaded or accepted-known) — 10/19 keysets landed in Plan 16-01; remaining 9 keysets + COMMON_NAMES_ES extension + image plan land in Plans 16-02/03/04

### Catalog Expansion Wave C — Exterior + Aromáticas + Frutales (CAT)

- [x] **CAT-17**: Wave 3.3 — 8 exterior flores added: azalea, ciclamen, fucsia, clavel, crisantemo, tulipan, girasol, magnolia
- [x] **CAT-18**: Wave 3.4 — 3 aromáticas added: salvia-officinalis (distinct from existing `salvia-ornamental`, `name` and `description` make this clear), eneldo, stevia
- [x] **CAT-19**: Wave 3.5 — 3 frutales/huerta added: olivo, arandano, espinaca
- [x] **CAT-20**: All Wave C entries have full v1.1 + EDU keyset, identification map entries, and image plan
- [x] **CAT-21**: Final `PLANT_DATABASE.length === 118` (64 v1.1 + 54 v1.2 = 23 Phase 15 + 17 Phase 16 + 14 Phase 17; potus + filodendro upgraded in place at Phase 16 per CAT-14 addendum, not counted as net-new); smoke runner asserts the count. *Amended 2026-05-08 from original 120 target during Phase 17 context discussion — see `.planning/phases/17-catalog-wave-c-exterior-arom-ticas-frutales/17-CONTEXT.md` §"Catalog count target".*

### PlantCard Cleanup + Swipe (CARD)

- [x] **CARD-01**: Delete trash 🗑️ removed from PlantCard JSX; deletion now via swipe-left gesture using `Gesture.Pan()` from react-native-gesture-handler (NOT `ReanimatedSwipeable` per Pitfall research — iOS crash bug)
- [x] **CARD-02**: Long-press on PlantCard reveals overflow menu (favorite, delete, edit) as fallback for users who don't discover swipe
- [x] **CARD-03**: Tip italic moved from PlantCard to MyPlantDetailModal "¿Qué hacer?" section; PlantCard now shows: image + name + 1 task (or none) + water badge + mood emoji (always visible per GAM-03/04) — 5 elements max. Mood emoji REPLACES the legacy conditional `PlantHealthBadge`.
- [x] **CARD-04**: Swipe action shows visual affordance (chevron peek on first card render in PlantsScreen, dismissible) so users discover the gesture
- [x] **CARD-05**: Haptic feedback (`Haptics.ImpactFeedbackStyle.Medium`) on swipe-completion threshold

### Pet Toxicity (TOX)

- [x] **TOX-01**: `PlantDBEntry.petToxicity?: { cats: ToxLevel, dogs: ToxLevel }` added (additive optional); `ToxLevel = 'safe' | 'caution' | 'toxic' | 'unknown'`; absence of field is treated as `'unknown'` (NOT `'safe'`)
- [x] **TOX-02**: All 120 catalog entries classified per cats + dogs against ASPCA Animal Poison Control list (canonical source); LATAM species not in ASPCA marked `'unknown'` with honest UI
- [x] **TOX-03**: PlantCard renders cat 🐈 / dog 🐕 toxicity badge when `'toxic'` (red), `'caution'` (yellow); hidden for `'safe'` and `'unknown'`
- [x] **TOX-04**: MyPlantDetailModal "Mascotas" section is ALWAYS visible (even for safe plants — reinforces user confidence). Per-species copy: `'safe'` → "Segura para gatos y perros ✓"; `'caution'` → "Precaución para [especie]. Síntomas: [lista]"; `'toxic'` → "Tóxica para [especie]. Síntomas: [lista]"; `'unknown'` → "No verificada para esta especie en LATAM 🤷". NO phone CTA, NO specific clinic recommendation (avoids liability — user finds local vet themselves).
- [x] **TOX-05**: Catalog browse (PlantDatabaseCard) gains pet-safe filter — toggle to show only entries safe for cats AND dogs
- [x] **TOX-06**: i18n keys for toxicity labels in `common.json` (4-state enum strings × 2 locales), NOT `plants.json`

### Fertilization Subsystem (FERT)

- [x] **FERT-01**: `Plant.fertilizeSchedule?: { intervalDays: number, lastFertilized?: string }` added (additive optional); migration default = derived from `PlantDBEntry.fertilizeIntervalWarm/Cold` (catalog-driven)
- [x] **FERT-02**: `PlantDBEntry.fertilizeIntervalWarm?: number, fertilizeIntervalCold?: number | null` added; per-category baselines: tropical 14-28d/null, succulent 60-90d/null, herb 7-14d, woody perennial 180d
- [x] **FERT-03**: New `Task.type === 'fertilize'` added to discriminator union; 5-site sweep mirrors v1.1 `'check_soil'` precedent: `plantLogic.getTasksForDay`, `notificationScheduler`, `plantHealth`, `DayDetail`/`DayDetailModal`/`MonthCalendar` discriminator chains, `TaskButton` rendering
- [x] **FERT-04**: `getTasksForDay` emits `'fertilize'` task on cadence (season-aware via warm/cold split); user marks done via TaskButton; `lastFertilized` updates
- [x] **FERT-05**: Fertilize push notifications are **opt-in** (toggle in Settings → Notifications, default OFF). Task still appears in Hoy regardless. Avoids notification fatigue (4th task type alongside water/sun/outdoor) while letting power users opt in.
- [x] **FERT-06**: PlantCard shows fertilize task badge when due today (mode: 'tasks' branch); MyPlantDetailModal "¿Qué hacer?" section explains how + when (referencing FERT-07 fertilizer type per plant)
- [x] **FERT-07**: `PlantDBEntry.fertilizer?: { type: 'industrial' | 'homemade' | 'both', industrialRecommendation?: string, homemadeRecommendation?: string }` added — content per entry. Industrial example: "NPK 10-10-10 diluido 1:4 en agua, cada 2 semanas en temporada cálida". Homemade example: "Té de cáscara de banana o cáscara de huevo molida cada 10-14 días en primavera/verano". Horticultural research per category required (tropicales / suculentas / hierbas / huerta / frutales). Industrial recommendations should be generic NPK ratios + standard amendments (NOT specific brands — avoid endorsement liability). All 118 catalog entries × EN+ES. _(Plans 20-06 + 20-07 + 20-08 complete: 118/118 entries — interior + aromáticas + huerta + suculentas + exterior + frutales. FERT-07 catalog content layer fully closed; locale parity verified at 118 × 2 locales. Plan 20-09 closes the i18n parity gate: scripts/check-i18n-keys.mjs extended with conditional fertilizer.industrial/homemadeRecommendation sub-field validation — append-only, mirroring Phase 19 TOX-06 pattern; future drift between plantDatabase.ts and plants.json fertilizer copy is now caught pre-submit.)_

### Plant Journal (JOURNAL)

- [x] **JOURNAL-01**: `AppData.journals?: Record<plantId, JournalEntry[]>` added (additive optional); migration default `{}`
- [x] **JOURNAL-02**: `JournalEntry` type: `{ id, date (ISO), text?: string, photoUri?: string, careTag?: string }`; photos saved to `expo-file-system` `documentDirectory` NOT base64-in-AsyncStorage (Pitfall research lock)
- [x] **JOURNAL-03**: `useStorage` adds `addJournalEntry(plantId, entry)`, `deleteJournalEntry(plantId, entryId)` actions
- [x] **JOURNAL-04**: MyPlantDetailModal new "Diario" section shows reverse-chronological timeline; quick-add via bottom sheet (2-tap max — date defaults today, optional text + photo + tag)
- [x] **JOURNAL-05**: Journal entries are NEVER premium-gated at the read level (Blossom cautionary tale — data hostage when subscription lapses)

### Gamification — Light Celebrations (GAM)

- [x] **GAM-01**: Toast component shown on task completion ("¡Vas bien! 🌱") — positive-only, NEVER a broken-streak penalty
- [x] **GAM-02**: Haptic feedback (`Haptics.NotificationFeedbackType.Success`) on water/sun/outdoor/fertilize task done
- [x] **GAM-03**: Per-plant happiness mood emoji ALWAYS visible on PlantCard (Greg-style). Derived from existing `calculatePlantHealth(plant).healthLevel` — `excellent`→🌱, `good`→😊, `warning`→😐, `danger`→😟. Tap opens existing `PlantHealthDetail` modal (preserves current behavior).
- [x] **GAM-04**: Mood emoji REPLACES the conditional `PlantHealthBadge` (currently shown only when score<80). Card stays at 5 elements per CARD-03 — mood emoji is the always-visible health affordance, healthBadge component deprecated. NO numeric score on the card itself; numbers only inside HealthDetail modal.
- [x] **GAM-05**: NO persistent streak counter in primary UI (anti-pattern per research — creates anxiety; missing a watering day is sometimes horticulturally correct). Mood emoji communicates state without requiring sustained streaks.

### Polish — UAT Bug Fixes + Brand Voice (POLISH)

- [x] **POLISH-01**: Outdoor task gate — `getTasksForDay` in `plantLogic.ts` skips `'outdoor'` task emission when `plant.typeId ∈ OUTDOOR_TYPE_IDS` (closes UAT #3 — no more "Sacar afuera" on outdoor plants)
- [x] **POLISH-02**: Outdoor entries' `outdoor: 0` set in catalog as defensive complement to POLISH-01 (data + code gate, both layers)
- [x] **POLISH-03**: PlantNet identification result `typeId` derivation in `IdentificationResults.tsx` honors catalog category over PlantNet's `indoor` flag when conflict exists (closes UAT #3a — picker labels match plant category)
- [x] **POLISH-04**: Verify identification entry points (onboarding card + PlantsScreen FAB) — both must open `PlantIdentifierModal` AND keep the identify→diagnose chain functional via `onDiagnoseAfterIdentify` after Phase 7 changes. NO removal of either entry point per UAT user decision (UAT #2 marked "verified, no change needed"). Device-test both flows on iOS + Android: take photo → identify → save plant AND take photo → identify → diagnose → chat.
- [x] **POLISH-05**: `colors.textSecondary` darkened from `#8a7e6b` to a value passing WCAG AA (~4.5:1) on both `bgPrimary` and `card`; audit usages and adjust if needed (carryover from QW4)
- [x] **POLISH-06**: All action buttons updated with voseo + emoji microcopy ("Regá ahora 💧" instead of "Regar"); audit `t()` keys for action verbs; locale parity preserved
- [x] **POLISH-07**: Empty states in PlantsScreen, ExploreScreen, CalendarScreen are illustrated (Lottie or SVG) with motivating voseo copy ("Tu jardín está esperando")
- [x] **POLISH-08**: NO sample plant pre-loaded on first launch — first-run empty-state UX is handled exclusively by POLISH-07's illustrated empty states with strong CTAs ("Agregá tu primera planta" / "Tu jardín está esperando"). Rejected sample-data approach to avoid "test event" syndrome and zero confusion about plant origin.

### Documentation (DOCS)

- [x] **DOCS-01**: CLAUDE.md updated with: new edge function `get-plant-care` deploy commands; v1.2 architecture decisions (Perenual now server-side, unknown-plant tracker, journal photo storage strategy); pre-submit checks updated for new CI guards
- [x] **DOCS-02**: PROJECT.md Key Decisions table extended with v1.2 decisions (recommendation-first pivot, deep-merge guard for updatePlant, derived-only streaks, journal photos in FileSystem, two-AppContent-paths discipline extended to BottomSheetProvider)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Sensors & Hardware

- **SENS-01**: Soil moisture sensor integration
- **SENS-02**: Smart-pot connectivity

### Advanced Precision

- **ADV-01**: Per-month (12-bucket) watering schedule
- **ADV-02**: Auto-rescheduling watering based on weather forecast
- **ADV-03**: Auto-detect light from room photo via Vision API
- **ADV-04**: PPFD/DLI numeric readouts for advanced users

### Diagnosis Resume Vision

- **DIAG-V01**: Re-upload photo within resumed chat to update visual context (currently text-only on resume)

### Persistent Streaks (deferred from GAM)

- **STREAK-01**: Per-plant streak history array enabling true N-day consecutive count display
- **STREAK-02**: Optional opt-in achievements / badges for power users (off by default to avoid anxiety)

### Unknown Plant Tracking — Cloud Phase

- **TRACK-V01**: Migrate `@unknown_plants` AsyncStorage to Supabase `unknown_plant_requests` table when AUTH ships; aggregate view `top_missing_plants` for prioritization

### Garden View

- **GARD-V01**: Visual 2D layout of garden (Planta-style); per-plant placement on canvas

### Plant Compatibility — LATAM

- **COMP-V01**: "Vecinos de planta" recommendations using LATAM catalog; suggest plants that grow well together in Argentine climate (unique differentiator)

## Out of Scope

Explicitly excluded for v1.2.

| Feature | Reason |
|---------|--------|
| Schema version bump (v1.2 → v2 envelope) | All new fields are additive optional; v1.1 `climateOverride` precedent applies |
| Cloud sync of journals/streaks | AUTH not enabled in MVP; deferred to dedicated auth milestone |
| Heavy gamification (badges, points, leaderboards) | Industry research: infantilizes plant-serious users; positive-only celebrations win |
| Lux/light meter via phone camera | Sensor accuracy issues; documented v1.1 carryover |
| Multi-pot tracking | Adds entity layer for marginal benefit |
| LATAM toxicity authoritative dataset | No digital equivalent to ASPCA found; mark `'unknown'` honestly |
| Re-upload photo within resumed diagnosis chat | v2.0 (DIAG-V01) — text-only resume locked in v1.1 |
| Per-plant configurable seasonal ratio | Catalog defaults sufficient |
| Streak counter in primary UI (anxiety risk) | Anti-pattern per research; toast-only celebrations |
| `ReanimatedSwipeable` for swipe-to-delete | iOS crash bug; use `Gesture.Pan()` directly |
| `EXPO_PUBLIC_PERENUAL_API_KEY` in client | Deliberate elimination — security risk; replaced by edge function |
| Subscription-gating journal entries at read level | Blossom cautionary tale; entries always readable |

## Traceability

Populated during roadmap creation by `gsd-roadmapper`. Every v1.2 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 10 | Complete |
| SEC-02 | Phase 10 | Complete |
| SEC-03 | Phase 10 | Complete |
| SEC-04 | Phase 10 | Pending |
| SEC-05 | Phase 10 | Complete |
| DATA-01 | Phase 11 | Complete |
| DATA-02 | Phase 11 | Complete |
| DATA-03 | Phase 11 | Complete |
| DATA-04 | Phase 11 | Pending |
| TRACK-01 | Phase 12 | Complete |
| TRACK-02 | Phase 12 | Complete |
| TRACK-03 | Phase 12 | Complete |
| INFRA-01 | Phase 13 | Complete |
| INFRA-02 | Phase 13 | Complete |
| INFRA-03 | Phase 13 | Complete |
| INFRA-04 | Phase 13 | Complete |
| EDU-01 | Phase 14 | Complete |
| EDU-02 | Phase 14 | Complete |
| EDU-03 | Phase 14 | Complete |
| EDU-04 | Phase 14 | Complete |
| EDU-05 | Phase 14 | Complete |
| EDU-06 | Phase 14 | Complete |
| EDU-07 | Phase 14 | Complete |
| CAT-09 | Phase 15 | Complete |
| CAT-10 | Phase 15 | Complete |
| CAT-11 | Phase 15 | Complete |
| CAT-12 | Phase 15 | Complete |
| CAT-13 | Phase 16 | Complete |
| CAT-14 | Phase 16 | Complete |
| CAT-15 | Phase 16 | Complete |
| CAT-16 | Phase 16 | Complete |
| CAT-17 | Phase 17 | Complete |
| CAT-18 | Phase 17 | Complete |
| CAT-19 | Phase 17 | Complete |
| CAT-20 | Phase 17 | Complete |
| CAT-21 | Phase 17 | Complete |
| CARD-01 | Phase 18 | Complete |
| CARD-02 | Phase 18 | Complete |
| CARD-03 | Phase 18 | Complete |
| CARD-04 | Phase 18 | Complete |
| CARD-05 | Phase 18 | Complete |
| GAM-03 | Phase 18 | Complete |
| GAM-04 | Phase 18 | Complete |
| TOX-01 | Phase 19 | Complete |
| TOX-02 | Phase 19 | Complete |
| TOX-03 | Phase 19 | Complete |
| TOX-04 | Phase 19 | Complete |
| TOX-05 | Phase 19 | Complete |
| TOX-06 | Phase 19 | Complete |
| FERT-01 | Phase 20 | Complete |
| FERT-02 | Phase 20 | Complete |
| FERT-03 | Phase 20 | Complete |
| FERT-04 | Phase 20 | Complete |
| FERT-05 | Phase 20 | Complete |
| FERT-06 | Phase 20 | Complete |
| FERT-07 | Phase 20 | Complete |
| JOURNAL-01 | Phase 21 | Complete |
| JOURNAL-02 | Phase 21 | Complete |
| JOURNAL-03 | Phase 21 | Complete |
| JOURNAL-04 | Phase 21 | Complete |
| JOURNAL-05 | Phase 21 | Complete |
| GAM-01 | Phase 22 | Complete |
| GAM-02 | Phase 22 | Complete |
| GAM-05 | Phase 22 | Complete |
| POLISH-01 | Phase 23 | Complete |
| POLISH-02 | Phase 23 | Complete |
| POLISH-03 | Phase 23 | Complete |
| POLISH-04 | Phase 23 | Complete |
| POLISH-05 | Phase 23 | Complete |
| POLISH-06 | Phase 23 | Complete |
| POLISH-07 | Phase 23 | Complete |
| POLISH-08 | Phase 23 | Complete |
| DOCS-01 | Phase 24 | Complete |
| DOCS-02 | Phase 24 | Complete |

**Coverage:**
- v1.2 requirements: 74 total (5 SEC + 4 DATA + 3 TRACK + 4 INFRA + 7 EDU + 13 CAT + 5 CARD + 6 TOX + 7 FERT + 5 JOURNAL + 5 GAM + 8 POLISH + 2 DOCS)
- Catalog final count: 118 entries (64 v1.1 + 54 v1.2). Original 120/56 v1.2 target amended 2026-05-08 — see CAT-21 wording.
- Mapped to phases: 74/74 — complete

**Note on GAM split:** GAM-03 and GAM-04 (mood emoji replacing health badge) are mapped to Phase 18 (PlantCard Cleanup) because they define PlantCard's 5-element layout and the CARD requirements explicitly reference them. GAM-01, GAM-02, and GAM-05 (toasts, haptics, streak policy) are mapped to Phase 22 after all task types exist.

---

*Requirements defined: 2026-05-02*
*Last updated: 2026-05-01 — Traceability table filled by gsd-roadmapper. 74/74 requirements mapped to Phases 10-24.*
