# FEATURES — v1.2 Recommendation-First Plant Guide

**Domain:** Plant care app — educational detail, fertilization, pet toxicity, journal, gamification, mobile UX patterns
**Researched:** 2026-05-01
**Confidence:** HIGH (fertilization cadences, ASPCA dataset, RN bottom-sheet patterns); MEDIUM (competitor UX structure from indirect sources, streak patterns); LOW (Planta "perfect care" streak specifics — not publicly documented)

---

## Executive Summary

Six feature themes ship in v1.2. Research finds:

1. **Educational detail (recommendation-first UX)**: Best-in-class apps (Planta, Greg, Blossom) structure plant detail as tabs: Care / Placement / About / (optionally) Pests. The key differentiator is always leading with *what to do right now*, then placement/light, then the "why" rationale. Apps that lead with taxonomy bore users; apps that lead with actionable verbs retain them. The v1.2 four-section design (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes) directly matches this pattern — with the "¿Por qué?" rationale section being a genuine differentiator (most apps omit scientific reasoning).

2. **Fertilization**: Horticultural consensus establishes clear cadences per category. Apps implement fertilization as either (a) a separate scheduled task alongside watering or (b) a care-guide note only. The separate scheduled task approach is table stakes for apps above hobby-tracker level (Planta, Blossom both do this). Monthly display in the existing Hoy screen is the right integration point — no separate tab needed.

3. **Pet toxicity**: ASPCA list is the canonical dataset (1,000+ plants, cats/dogs/horses, publicly scrapable — no API, no licensing fee noted). Apps surface it as a badge on the plant card + a dismissible modal on detail open. Filter in catalog browse is a differentiator; most apps do not have it.

4. **Plant journal**: Blossom's notes feature (photo + text + date) is the market reference. The key UX insight is that it is NOT a diary — it is a per-plant growth timeline. One entry = one moment-in-time snapshot. Date, photo, optional note, optional care tag (repotted / new growth / problem noticed). Entries should be reverse-chronological in the plant detail view.

5. **Gamification (streaks)**: Research consistently finds that punitive streaks (Duolingo-style) feel wrong for plant apps because missing a watering day is sometimes correct (don't water on schedule if soil is moist). The winning pattern is positive-only: "N days of great care" toast that fires on task completion, never a broken-streak penalty. Greg's happiness scoring and Planta's care reminders avoid explicit streak numerics in their primary UI — they show health state, not streak count.

6. **Bottom sheets vs full-screen modals**: `@gorhom/bottom-sheet` v5 is the standard. There are confirmed Expo SDK 54 compatibility issues with reanimated v4 — this needs investigation before committing. Short actions (confirm delete, complete task, pick date) belong in bottom sheets. Complex, multi-step, or full-content views (journal entry, diagnosis chat, full plant detail) belong in full-screen modals or navigated screens.

---

## Theme 1: Educational Detail Modal (Centerpiece)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Action-first section "¿Qué hacer?" with `careAction` field | Users open plant detail to know what to do; leading with taxonomy is a known failure mode confirmed in multiple UX case studies | MEDIUM | Requires catalog extension with `careAction` per entry (64 entries) |
| Placement section "¿Dónde ponerla?" with recommended / alternatives / avoid | Planta and Greg both provide room/position guidance, not just lux number | MEDIUM | New catalog fields: `placementRecommended`, `placementAlternatives`, `placementAvoid` |
| Tus ajustes section showing current schedule params | Users need to reconcile app recommendation with their own setup | SMALL | Read from existing plant data — display-only |
| Collapsible sections with clear visual hierarchy | Plant detail has grown too long; progressive disclosure is standard | SMALL | Existing RN Animated or simple show/hide state |
| Identification picker pre-selects species recommendation | Users who identify via PlantNet land in detail immediately in recommendation mode | SMALL | Depends on existing PlantNet identification flow |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "¿Por qué?" rationale section with `whyRationale` | Most apps omit scientific reasoning; plant-serious users want to understand, not just comply. Teaches confidence. | MEDIUM | New catalog field; ~2-3 sentences of expert rationale per entry; can reuse diagnosis-chat tone |
| Argentine Spanish voseo tone throughout with emoji on action verbs | Personality differentiates; formal tuteo in a plant app feels clinical | SMALL | i18n keys already exist; update copy in es/common.json |
| Placement alternatives ("si no hay luz directa, probá el alféizar") | Greg gives a single prescription; offering a ranked fallback reduces friction for imperfect apartments | SMALL | `placementAlternatives` catalog field |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full Wikipedia-length botanical description | Users scan; walls of text cause immediate back-button. PictureThis has this problem — users call it "overwhelming" in reviews | 2-3 sentence `whyRationale` max; link to diagnosis chat for deep questions |
| Editable care params inline in the recommendation section | Mixes "what the plant needs" with "what you set" — creates confusion about which is authoritative | Keep Tus ajustes read-only with a single "Ajustar" CTA that opens existing schedule edit flow |

### Competitor Reference

- **Planta**: Tabs are Care / Expert Tips / About. Care tab shows watering/fertilizer/misting/repotting as icon rows with frequency. Expert Tips tab is educational prose. The hierarchy is task-first, then education — confirmed by UX copy review (Medium, Mar 2025).
- **Greg**: Plant care guide page (e.g., greg.app/plant-care/vitis-spp-grapevines) sections: Water, Light, Nutrients, Propagation, Common Problems. Actionable frequencies are prominent. Rationale sentences appear inline with each section header. Community Q&A appears below.
- **Blossom**: Tabs: Care / Guides / Notes. Care tab has icon rows. Guides tab provides contextual educational articles ("Learn More" expands inline, per UX case study found in search).
- **PictureThis**: Identification-first flow; detail page overwhelms with taxonomy, photos, range maps before care. Care is buried — widely cited as UX weakness.

---

## Theme 2: Fertilization Scheduling

### Cadence Reference (HIGH confidence — horticultural consensus)

| Category | Growing Season | Dormant Season | Notes |
|----------|---------------|----------------|-------|
| Interior tropicals (Monstera, Pothos, Philodendron, Ficus) | Every 2–4 weeks (spring/summer) | None or once in autumn | Balanced NPK 10-10-10 or similar |
| Flowering houseplants (Peace lily, Anthurium, African violet) | Every 2 weeks when budding/blooming | Skip or quarter-strength | Higher phosphorus during bud formation |
| Cacti and succulents | Once every 2–3 months during growing season (spring–autumn) | None | Half-strength; overfertilization causes root burn |
| Herbs and edibles | Every 1–2 weeks during growing season | Reduce to monthly | Higher nitrogen; flush monthly to prevent salt buildup |
| Woody perennials / outdoor shrubs | Once in early spring, once in early summer | None | Slow-release granular; avoid late-season to prevent frost-tender new growth |
| Orchids | Every 2 weeks when in active growth | Monthly quarter-strength | "Weakly, weekly" is the orchid community standard |

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Fertilization interval per plant in catalog (new field `fertilizeIntervalWarm`, `fertilizeIntervalCold`) | Without category-aware cadences, fertilization reminders are useless generic noise | MEDIUM | Two fields per catalog entry; mirrors existing watering interval pattern exactly |
| Fertilization task in "Hoy" screen alongside watering | Users managing schedules expect all care in one place | MEDIUM | New task type `fertilize`; needs icon (🌿 or dedicated emoji), label, completion flow |
| Season-aware fertilization (skip in dormant season, same zone logic as watering) | Fertilizing a dormant succulent in winter is actively harmful — app must know not to schedule it | SMALL | Reuse existing `getEffectiveSeason()` SSOT; `fertilizeIntervalCold: null` = skip winter |
| Per-plant fertilization log (last fertilized date) | Users need confirmation that they did it | SMALL | Extend `PlantRecord` with `lastFertilizedAt: string | null` |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fertilization rationale inline ("Las tropicales en crecimiento activo necesitan nitrógeno cada 3 semanas") | Most apps say "fertilize in 21 days" with no explanation; rationale builds user competence | SMALL | Part of `whyRationale` field or separate `fertilizeNote` string in catalog |
| Slow-release vs liquid distinction | Power users distinguish fertilizer types; surfacing this in the recommendation adds credibility | SMALL | Optional `fertilizeType: 'liquid' | 'slow_release' | 'either'` catalog field; display-only |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User-configurable fertilization interval | Plant-serious users may want control, but wrong intervals cause harm; also creates support burden | Use catalog cadence as authoritative default; allow snooze (defer 1 week) but not full reconfiguration |
| NPK ratio recommendations | Scientifically correct but creates decision paralysis for most users ("which fertilizer do I buy?") | Simple guidance: "fertilizante balanceado para interior" — brand agnostic, actionable |

### Implementation Notes

- Integration point: extend the same task-generation pipeline as watering in `plantLogic.ts` — `getTasksForDay()` already dispatches by `waterMode`; add fertilize task type under same dispatcher pattern
- Planta implements fertilization as a separate timed reminder; Blossom and Vera also track fertilization separately from watering — this is the market standard, not combined
- The `fertilizeIntervalWarm` / `fertilizeIntervalCold` pattern directly mirrors `waterIntervalWarm` / `waterIntervalCold` already in the schema (v1.1 decision: mode-as-dispatcher, cadence separate)

---

## Theme 3: Pet Toxicity

### Dataset Assessment

**ASPCA Animal Poison Control Plant Lists** (aspca.org/pet-care/animal-poison-control) — HIGH confidence canonical source:
- Covers cats, dogs, horses separately (cats and dogs are the relevant targets)
- 1,000+ plant entries, each with: common name, scientific name, toxic/non-toxic classification, toxic parts, clinical signs
- No official API; data is publicly scrapable (HTML lists) — a Kaggle dataset exists and community scrapers confirmed on GitHub
- No licensing fee cited for using the information (it is public health information); appropriate to credit ASPCA in-app
- Secondary source: Veterinary Partner / VIN database (clinically reviewed, veterinarian-authored)

**For the 64-entry catalog**: Manual classification per entry is feasible (64 lookups). Suggested new fields: `toxicCats: 'toxic' | 'non_toxic' | 'unknown'`, `toxicDogs: 'toxic' | 'non_toxic' | 'unknown'`, `toxicNote: string | null` (brief clinical sign if toxic, e.g., "puede causar irritación oral y GI")

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Toxicity badge on PlantCard (cat/dog icons + color) | Planty and ToxiPets both use card-level badge; users with pets scan for this before adding a plant | SMALL | Display-only; reads `toxicCats` / `toxicDogs` from catalog entry |
| Toxicity section in plant detail modal | Pet owners need detail — which part, what happens — not just a red/green badge | SMALL | Display block in detail; shows `toxicNote`; links to ASPCA if toxic |
| Toxicity data for all 64 catalog entries | Partial coverage creates dangerous false confidence | MEDIUM | Research pass against ASPCA list; some entries will be `unknown` — that is acceptable and honest |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pet-safe filter in catalog browse | UX research confirms "filter by pet safety" is listed as desired feature but most apps do not implement it | SMALL | Add `petSafe` filter toggle to existing catalog browse; reads `toxicCats` + `toxicDogs` combined |
| Toxicity warning on add-plant flow if user has pets | Proactive, contextual warning before user commits — no other app in the competitive set does this proactively | MEDIUM | Requires user "has pets" preference (new setting: `hasCats: boolean`, `hasDogs: boolean` in user prefs); check on plant add |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Displaying detailed clinical symptoms in-app | Creates medical anxiety; users may misinterpret symptoms as diagnosis | Show severity (toxic / non-toxic) + brief note + clear "call ASPCA Poison Control (888) 426-4435" CTA if toxic |
| Claiming comprehensive toxicity coverage for all plant identifications | PlantNet returns species outside the 64-entry catalog — app cannot make toxicity claims for unrecognized plants | Show toxicity data only for catalog entries; display "No tenemos datos de toxicidad para esta especie" for unrecognized |

---

## Theme 4: Plant Journal

### Market Reference (MEDIUM confidence — Blossom confirmed, others from indirect sources)

- **Blossom**: "Notes" feature — photo attachment + text entry + date. Per-plant. Reverse-chronological in plant detail. Photo data reported to disappear on subscription lapse — a critical trust failure to avoid. **Lesson: journal data must never be premium-gated at the read level.**
- **Planta**: Has "plant journal" in premium tier. Photo + note per entry. Per-plant timeline. Light meter reading can be attached.
- **Plantingo**: Bulk photo upload organized by species. More gallery than journal.
- **GrowNotes / Gardenize**: Garden-level (not per-plant) journal with calendar view. Different use case.

**Pattern that works**: One entry = one moment. Date (auto, editable), photo (optional), note (optional), care tag (optional: repotted / new growth / problem / observation). Reverse-chronological list in plant detail view. Quick-add from plant detail is essential — if it takes more than 2 taps to add, users won't.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-plant journal entries (date + photo + text note) | Users who track plants want a growth history; this is the primary differentiator between a tracker app and a plant care companion | MEDIUM | New data model: `JournalEntry { id, plantId, date, photoUri?: string, note?: string, careTag?: string }` stored in AsyncStorage |
| Reverse-chronological timeline in plant detail view | Standard for growth tracking; most recent observation is most relevant | SMALL | FlatList with entries sorted by date desc |
| Photo picker from camera roll (no new photo capture required) | Camera capture in diagnosis already exists; journal adds gallery pick | SMALL | Reuse `imageService` or Expo ImagePicker; local URI stored (no Supabase upload until cloud sync milestone) |
| Quick-add entry from plant detail (bottom sheet or inline form) | 2-tap entry is the bar; more than that and adoption drops to near zero | SMALL | Bottom sheet with date/photo/note; autofills today's date |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Care tag on journal entry (repotted / nueva hoja / problema / observación) | Converts unstructured notes into queryable data; enables "when did I last repot?" without text search | SMALL | Enum field; display as chip on timeline entry |
| Auto-entry on care completion ("Regada el 1 de mayo") | Diagnosis chat already auto-logs; applying same pattern to watering completion provides automatic growth history with zero user effort | MEDIUM | Hook into task completion in Hoy screen; write JournalEntry with type `watering_complete` |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Premium-gating journal read access | Blossom's data disappearance on subscription lapse is cited in user reviews as a trust destroyer | Journal entries are always readable; photo capture or AI-analysis of entries may be premium-gated in future |
| Height/measurement field | Adds complexity for no payoff — houseplant users don't measure height; growth is assessed visually | Use photo comparison (temporal sequence) as the measurement mechanism |

---

## Theme 5: Gamification (Light Streaks / Care Celebration)

### Pattern Analysis (MEDIUM confidence — synthesized from multiple app reviews and gamification research)

**What works in plant apps:**

1. **Completion toast, not streak counter**: A momentary celebratory message on task completion ("¡Regaste a Monstera! Lleva 5 días de buena atención") is universally cited as pleasant. A persistent streak counter creates anxiety when users are away.

2. **Health state > streak number**: Greg's approach (plant health score as primary feedback, not days-since-care) is better than Duolingo-style streak numerics. Users feel good about a healthy plant, not about a number.

3. **Positive-only signals**: Research consensus: "If you have a bad day, your plant just doesn't grow — no punishment." Missing a watering day should never feel penalized (skipping watering is sometimes correct). The streak should pause, not break.

4. **Milestone badges, not daily counters**: "30 días cuidando a Monstera" badge on reaching a milestone feels like an achievement. "Racha: 3 días" feels irrelevant.

5. **Haptic feedback at completion**: Recommended at the moment of swipe completion. The haptic pulse + toast combination is the standard micro-interaction for iOS plant apps.

**What fails:**
- Tamagotchi-style animations (plant looks sad when uncared for) — condescending to serious users
- Daily login streaks unrelated to plant care
- Gamified onboarding progress bars that don't reflect care reality

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Completion toast on task done ("¡Lista! Regaste a X") | Positive reinforcement on completion is the minimum affirmation; absence feels cold | SMALL | Transient 2-second toast (not bottom alert); already implied by "celebration toasts" in v1.2 theme |
| Haptic feedback (medium impact) on task completion swipe | iOS users expect haptic on swipe-complete; absence is noticed | SMALL | `expo-haptics` — already an Expo SDK dependency; `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Care count display in plant detail ("Cuidada 47 veces") | Satisfying metric that rewards long-term commitment without creating streak anxiety | SMALL | Derive from JournalEntry count or from existing watering log |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Luz perfecta N días seguidos" light streak toast | Light compliance is harder to track than watering; celebrating it is novel | MEDIUM | Requires tracking consecutive days with light task completed; reset only on explicit "no cumplí" — NOT on missing a day |
| Per-plant care consistency score (0–100, displayed in detail) | Richer signal than raw streak; incorporates all care dimensions (water, light, outdoor) | MEDIUM | Reuse existing `plantHealth.ts` scoring infrastructure; display as radial or bar in detail |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Visible streak counter in primary UI (plant card or home screen) | Creates anxiety; punishes users who are sick/traveling; not aligned with horticultural reality (soil moisture > calendar) | Show health score (already in v1.0) as the primary health signal; reserve streak mention for toast only |
| "Your plant is sad" negative framing | Infantilizing; plant-serious users find it condescending (cited in Gamification of Plant Care research) | Use care overdue state from existing health score system — no emotional anthropomorphization |

---

## Theme 6: Mobile UX Modernization (Bottom Sheets, Swipe, Haptics, Skeletons)

### Bottom Sheets vs Full-Screen Modals

**When to use bottom sheet** (confirmed pattern from React Native community, 2024–2025):
- Short actions requiring user attention but not full context switch: confirm delete, complete task with note, pick a date, add quick journal entry, fertilize confirmation
- Contextual overlays where underlying content should remain visible
- Actions completable in under 3 taps

**When to use full-screen modal / navigation**:
- Complex forms (edit plant schedule — multiple fields)
- Multi-step flows (onboarding, plant add wizard)
- Content too large for sheet (diagnosis chat, full journal entry with photo)
- Deep navigation (plant detail from Hoy — already navigated screen, correct)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Bottom sheet for swipe-to-delete confirmation | Swipe-to-delete without confirmation is destructive; sheet is less disruptive than full Alert | SMALL | React Native built-in `Modal` or `@gorhom/bottom-sheet`; confirm/cancel in sheet |
| Swipe-left to reveal delete on PlantCard | iOS/Android users expect swipe-to-delete on card lists; it is the standard | MEDIUM | `react-native-gesture-handler` Swipeable; already installed (Expo dependency); haptic at activation point |
| Long-press context menu on task items (complete / skip / info) | Standard gesture for secondary actions on list items in modern mobile apps | MEDIUM | Gesture handler long press → action sheet (3 options max) |
| Skeleton loaders for Hoy screen on first load | Eliminates layout shift; perceived performance improvement; standard in 2024 apps | SMALL | Animated pulse placeholder matching card shape; use Reanimated (already installed) — no new library needed |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Swipe-right to mark complete on Hoy task items | WhatsApp-style swipe-complete is faster than tapping; reduces friction for daily care routine | MEDIUM | Opposite swipe direction from delete; distinct color (green vs red) with haptic at threshold |
| Illustrated empty states (per screen, not generic) | Empty state is a first impression; illustrated states improve retention vs generic "no hay plantas" text | SMALL | Static SVG/PNG illustrations per screen; no animation needed — simplicity is the point |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| `@gorhom/bottom-sheet` without confirming Expo SDK 54 + reanimated v4 compatibility | Known open bug reports (Issue #2528, #2471) — may cause crashes on upgrade | Investigate and test before committing; fallback is RN built-in Modal with slide-up animation if compatibility unresolved |
| Pull-to-refresh on Hoy screen | App is local-first; there is nothing to refresh from a server | Remove if present; skeleton loaders solve perceived staleness without network round-trip |

---

## Feature Dependencies

```
Educational Detail Modal
    └──requires──> catalog extension (careAction, placementRecommended, placementAlternatives, placementAvoid, whyRationale)
    └──requires──> getCatalogEntry() lookup (already exists from v1.1)

Fertilization Scheduling
    └──requires──> catalog extension (fertilizeIntervalWarm, fertilizeIntervalCold, fertilizeNote)
    └──requires──> getTasksForDay() in plantLogic.ts (existing hook point)
    └──requires──> getEffectiveSeason() SSOT (already exists from v1.1)
    └──enhances──> Plant Journal (auto-entry on fertilize completion)

Pet Toxicity
    └──requires──> catalog extension (toxicCats, toxicDogs, toxicNote)
    └──optional──> user prefs (hasCats, hasDogs) for proactive warning on add

Plant Journal
    └──requires──> new JournalEntry data model in AsyncStorage
    └──requires──> imageService (existing, for photo URI)
    └──enhances──> Gamification (care count derived from journal entries)

Gamification (Streaks/Toasts)
    └──requires──> expo-haptics (existing Expo dependency)
    └──enhances──> Task completion in Hoy screen (hook point)
    └──depends on──> Plant Journal (for care count display)

Mobile UX Modernization
    └──requires──> react-native-gesture-handler (existing Expo dependency)
    └──requires──> @gorhom/bottom-sheet v5 OR RN Modal fallback (verify SDK 54 compat)
    └──blocks──> Swipe-to-delete PlantCard (must resolve before PlantCard Cleanup phase)
```

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Educational Detail — ¿Qué hacer? + ¿Dónde ponerla? sections | HIGH | MEDIUM | P1 |
| Educational Detail — ¿Por qué? rationale section | HIGH | MEDIUM | P1 |
| Fertilization task in Hoy screen | HIGH | MEDIUM | P1 |
| Fertilization catalog fields (64 entries) | HIGH | MEDIUM | P1 |
| Pet toxicity badges on PlantCard | HIGH | SMALL | P1 |
| Pet toxicity data for 64 catalog entries | HIGH | MEDIUM | P1 |
| Journal — per-plant entry (date + photo + note) | HIGH | MEDIUM | P1 |
| Swipe-to-delete PlantCard (gesture + confirmation sheet) | HIGH | MEDIUM | P1 |
| Haptic feedback on task completion | MEDIUM | SMALL | P1 |
| Completion toast on care action | MEDIUM | SMALL | P1 |
| Skeleton loaders for Hoy screen | MEDIUM | SMALL | P2 |
| Pet toxicity filter in catalog browse | MEDIUM | SMALL | P2 |
| Pet-safe warning on plant add | MEDIUM | MEDIUM | P2 |
| Journal care tag field | MEDIUM | SMALL | P2 |
| Long-press context menu on task items | MEDIUM | MEDIUM | P2 |
| Swipe-right to complete task in Hoy | MEDIUM | MEDIUM | P2 |
| Light streak toast | LOW | MEDIUM | P3 |
| Per-plant care consistency score | LOW | MEDIUM | P3 |
| Auto-journal entry on care completion | LOW | MEDIUM | P3 |
| Illustrated empty states | LOW | SMALL | P3 |

---

## Competitor Feature Analysis

| Feature | Planta | Greg | Blossom | Our v1.2 Approach |
|---------|--------|------|---------|-------------------|
| Plant detail structure | Tabs: Care / Expert Tips / About | Long-scroll sections: Water / Light / Nutrients / Problems | Tabs: Care / Guides / Notes | 4-section accordion: ¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes |
| Rationale/"why" explanation | Expert Tips tab (prose, secondary) | Inline sentence per section | Guides tab (expandable articles) | Dedicated ¿Por qué? section (first-class, not secondary) |
| Fertilization scheduling | Separate timed reminder (premium) | Listed in care guide sections | Listed as reminders alongside watering | Hoy task alongside watering (season-aware, catalog-driven) |
| Pet toxicity | Not confirmed in public sources | Not confirmed | Not confirmed | Badge on PlantCard + detail section + catalog filter |
| Plant journal | Premium tier; photo + note + date | Community posts / "story" feature | Notes feature (photo + text) | Free; per-plant; reverse-chronological; care tags |
| Streaks/gamification | Not prominent in primary UI | Plant "happiness" via health score | Not confirmed | Health score (existing) + completion toast + milestone badge |
| Swipe gestures | Confirmed (task completion) | Not confirmed | Not confirmed | Swipe-left delete + swipe-right complete (Hoy screen) |

---

## MVP for v1.2 (Phase Guidance)

### Ship in v1.2 core (P1 features)

- [ ] Educational Detail Modal — all four sections with catalog extension (centerpiece; affects all 64 entries)
- [ ] Fertilization task in Hoy + catalog cadence fields (season-aware; extends existing task pipeline)
- [ ] Pet toxicity data for 64 entries + badge on PlantCard + detail section
- [ ] Journal — per-plant entries (date, photo, note) with quick-add bottom sheet
- [ ] Swipe-to-delete PlantCard with bottom sheet confirmation
- [ ] Haptic feedback + completion toast on task complete

### Add in v1.2 later phases (P2 features)

- [ ] Pet-safe filter in catalog browse
- [ ] Pet-safe warning on plant add (requires user prefs `hasCats`/`hasDogs`)
- [ ] Journal care tags
- [ ] Skeleton loaders for Hoy screen
- [ ] Long-press context menu on Hoy task items

### Defer to v1.3 or later (P3 features)

- [ ] Light streak toast (novel but low-value without data showing users care about light compliance specifically)
- [ ] Per-plant care consistency score (health score from v1.0 already covers this use case adequately)
- [ ] Auto-journal entry on care completion (nice, but adds complexity to the core care loop before journal adoption is validated)
- [ ] Illustrated empty states (pure polish; low conversion impact vs feature work)

---

## Sources

- ASPCA Toxic and Non-Toxic Plant Lists: aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants (canonical, HIGH confidence)
- Planta UX copy review: medium.com/@l.kolobova/reviewing-ux-copy-in-the-planta-app (Mar 2025, MEDIUM confidence — indirect)
- Greg plant care guide structure: greg.app/plant-care/ (multiple species pages, MEDIUM confidence)
- Blossom plant journal feature: blossomplant.com + App Store reviews 2024 (MEDIUM confidence)
- Fertilization cadences: almanac.com, savvygardening.com, provenwinners.com, succulentalley.com (HIGH confidence — horticultural consensus across multiple independent sources)
- Pet toxicity badge UX pattern: medium.com/@maria.preyzner (planning article), Planty App Store listing (MEDIUM confidence)
- React Native bottom sheet vs full-screen modal: addjam.com/blog/2025-03-24, blog.andrewmchester.com (HIGH confidence)
- gorhom/bottom-sheet SDK 54 compatibility issues: github.com/gorhom/react-native-bottom-sheet/issues/2528, /2471 (HIGH confidence — confirmed open issues)
- Swipe-to-delete RN implementation: stoyan-garov.medium.com, dev.to/nrymarz (MEDIUM confidence)
- Gamification plant care pattern: gamification-of-plantcare.tumblr.com, revenuecat.com/blog/growth/gamification-in-apps-complete-guide (MEDIUM confidence)
- Skeleton loaders RN 2025: medium.com/@andrew.chester (MEDIUM confidence)
- Haptic feedback RN: medium.com/timeless (expo-haptics hook), mkuczera/react-native-haptic-feedback GitHub (MEDIUM confidence)

---

*Feature research for: My Garden Care v1.2 Recommendation-First Plant Guide*
*Researched: 2026-05-01*
