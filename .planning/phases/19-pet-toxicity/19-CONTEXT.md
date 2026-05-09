# Phase 19: Pet Toxicity - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Classify all 118 catalog entries (`src/data/plantDatabase.ts`) for cat + dog toxicity against the ASPCA Animal Poison Control list (canonical source). Surface that classification in three places:

1. **PlantCard** — small cat 🐈 / dog 🐕 toxicity badge in `headerRight`, peer of the existing diagnosis badge. Renders only for `'toxic'` (red severity) and `'caution'` (yellow severity); hidden for `'safe'` and `'unknown'`.
2. **MyPlantDetailModal** — new "Mascotas" section, ALWAYS visible (even for safe plants), with per-state copy. `'safe'` → "Segura para gatos y perros ✓"; `'caution'`/`'toxic'` → species-specific copy with symptom list; `'unknown'` → "No verificada para esta especie en LATAM 🤷". No phone CTA. No specific clinic recommendation.
3. **AddPlantModal catalog browse** — pet-safe filter toggle in the modal header. Toggle filters to entries where `cats === 'safe' && dogs === 'safe'` (excludes `'unknown'` honestly).

**In scope (REQUIREMENTS):** TOX-01, TOX-02, TOX-03, TOX-04, TOX-05, TOX-06.

**Out of scope (deferred):**
- Toxicity badge on `PlantDatabaseCard` (catalog browse cards) — only TOX-03 PlantCard scope is locked. Catalog browse cards may add toxicity hint later if useful, but not required this phase.
- User pet-preference (e.g., "I have cats only" filter mode) — pet-safe filter is the canonical "both species safe" toggle per TOX-05; per-pet preference is a separate phase.
- Toxicity badge tap → opens MyPlantDetailModal scrolled to Mascotas section. Implementation requires (a) badge `Pressable` with `hitSlop` to avoid swipe-gesture interference, (b) `MyPlantDetailModal` `initialSection` prop or scroll-to-anchor mechanism. Locked in scope this phase but called out separately because it touches Phase 14's modal section model.
- Edit-time pet-toxicity warning modal ("Esta planta es tóxica para gatos — ¿confirmar?") on AddPlant → no UX commitment this phase. Filter-only.

</domain>

<decisions>
## Implementation Decisions

### Data shape (TOX-01 — locked from REQUIREMENTS)

- `PlantDBEntry.petToxicity?: { cats: ToxLevel, dogs: ToxLevel }` — additive optional field on the existing `PlantDBEntry` interface at `src/types/index.ts:173`.
- `ToxLevel = 'safe' | 'caution' | 'toxic' | 'unknown'`.
- **Absence of field is treated as `'unknown'` (NOT `'safe'`).** A helper that resolves `entry.petToxicity?.cats ?? 'unknown'` and same for dogs is the pattern for all consumers (PlantCard / Mascotas section / pet-safe filter).
- LATAM species not in the ASPCA database get `petToxicity: { cats: 'unknown', dogs: 'unknown' }` — explicit field, honest UI ("No verificada para esta especie en LATAM 🤷"). This keeps the absence-vs-unknown distinction meaningful only at the type-system level; in data, every entry should set the field explicitly during Phase 19.

### PlantCard badge slot

- **Location: `headerRight` peer of diagnosis badge.** Reuses the existing `<View style={styles.headerRight}>` flex container at `PlantCard.tsx:245`. No new view tree, no new layout. Order: diagnosis badge first (when active), then toxicity badges. Visual order top-down or left-right depends on `headerRight` flex direction at planning time.
- **Stacking when both species are non-safe: SIDE-BY-SIDE HORIZONTAL.** `🐈 🐕` in a single row, cat first. Each emoji rendered with its OWN per-species severity color (cats may be yellow while dogs are red). Compact, single visual unit reads as "pet safety".
- **Visual treatment: emoji + colored severity stripe.** Emoji on transparent (or `card`) background with a small colored vertical stripe or thin border indicating severity per species. Lower visual weight than the solid-circle mood-emoji treatment from Phase 18 — toxicity badge should not visually compete with mood emoji.
  - `'toxic'` → red severity stripe (`colors.dangerText` per Phase 18 token-selection precedent at `PlantCard.tsx` for the swipe action background; or `colors.danger*` if a softer red is preferred — Claude's discretion at planning).
  - `'caution'` → yellow severity stripe (`colors.sunGold` candidate; Claude's discretion at planning — pick a token that exists in `theme.ts` and reads as caution-yellow without conflicting with sunGold's "sun task" semantic).
  - Single badge size: ~22-26px wide, height matches diagnosis badge for visual parity.
- **Tap target: opens `MyPlantDetailModal` scrolled to Mascotas section.** Tap badge → `setEditingPlant(plant)` (or whatever existing PlantsScreen/TodayScreen mechanism opens MyPlantDetailModal) AND pass an `initialSection: 'mascotas'` (or named anchor) hint that the modal consumes to scroll the user directly to the Mascotas section.
  - Implementation note for planner: badge must use `Pressable` (or `TouchableOpacity`) with `hitSlop` tuned to avoid conflict with PlantCard's `Gesture.Pan()` swipe-to-delete and `Gesture.LongPress()` long-press menu. Phase 18's gesture composition uses `Gesture.Race(Gesture.Pan, Gesture.LongPress)` — adding a child `Pressable` inside a `GestureDetector` requires testing on real device for fall-through behavior. If conflict cannot be resolved cleanly, fall back to "tap the rest of the card → modal opens at top → user scrolls" (still one tap to reach Mascotas if it's the 5th section in the locked Phase 14 order).
  - **`MyPlantDetailModal` consumes a new optional `initialSection?: 'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas'` prop** — when set, modal mounts with that section's `ScrollView` ref scrolled into view via `scrollTo` after layout. Keeping section IDs as kebab-case strings matches existing emoji-prefixed section pattern.
- **Tap on PlantCard body (not the toxicity badge specifically): UNCHANGED.** Existing onPress (open MyPlantDetailModal at top of scroll) preserved. Only the toxicity badge itself routes to Mascotas-anchored open.
- **Both render modes:** PlantCard is used in `mode="tasks"` (TodayScreen) AND `mode="collection"` (PlantsScreen). Toxicity badge renders identically in BOTH modes.

### Modal Mascotas section content (TOX-04 — partially locked)

- **Position in modal: 5th section after Phase 14's locked 4 (`🌿 ¿Qué hacer?` / `🏠 ¿Dónde ponerla?` / `ℹ️ ¿Por qué?` / `⚙️ Tus ajustes`).** Section title: `🐾 Mascotas` (paw emoji as visual anchor matching Phase 14 convention).
- **Visibility: ALWAYS RENDERED** (per TOX-04 — even for safe plants reinforces user confidence). Default expanded like the other 4 sections (Phase 14 lock).
- **Per-state copy (locked from REQUIREMENTS TOX-04):**
  - `'safe'` (both species) → "Segura para gatos y perros ✓"
  - `'caution'` (per species) → "Precaución para [especie]. Síntomas: [lista]"
  - `'toxic'` (per species) → "Tóxica para [especie]. Síntomas: [lista]"
  - `'unknown'` (per species) → "No verificada para esta especie en LATAM 🤷"
- **Symptoms list source: PER-ENTRY CATALOG FIELD (Claude's default).** Add `petToxicity.cats.symptoms?: string[]` and `petToxicity.dogs.symptoms?: string[]` to the data shape ONLY for entries where `level === 'caution' || 'toxic'`. ASPCA per-species symptom lists are scraped/extracted during catalog research (per-entry by Claude during execution, NOT a bulk script). For `'safe'` and `'unknown'` states, symptoms field is absent (no list shown).
  - **Symptoms i18n: in `plants.json`** (per-entry content, follows existing catalog pattern). NOT in `common.json`. TOX-06 only covers app-level toxicity LABELS in `common.json` (the 4 enum strings: "Tóxica", "Precaución", "Segura", "No verificada"). Symptom-list strings are catalog content, owned by `plants.json`, EN+ES parity required (existing `check:i18n-keys` script extends to cover toxicity symptoms).
  - **If a symptom field is missing for a 'caution'/'toxic' entry:** copy degrades gracefully to "Precaución/Tóxica para [especie]." (no symptoms list line). Modal section still always renders.
- **No phone CTA, no clinic recommendation.** REQUIREMENTS lock — avoids liability. User finds local vet themselves.
- **Per-species asymmetry rendering: TWO INDEPENDENT LINES** (Claude's default). When cats=safe and dogs=toxic, modal shows two distinct lines — one per species — with per-species copy. Reads honest. Matches the side-by-side badge model on PlantCard.

### Pet-safe filter UX

**RESOLVED 2026-05-08 (post-research correction).** Original CONTEXT decision said "AddPlantModal header toggle" but research surfaced that AddPlantModal has no catalog browse — the only catalog browse with a category filter today lives in `OnboardingScreen.tsx:207-230`. Re-resolved with user as: **filter in OnboardingScreen + toxicity warning banner in AddPlantModal**. This covers both the onboarding plant-pick path and the post-onboarding add-plant path.

#### Primary host: OnboardingScreen catalog browse (TOX-05)

- **Location: `OnboardingScreen.tsx:207-230`, alongside the existing category pill row** (`'all' | PlantCategory` selector). Pet-safe toggle is a sibling control to the category pills.
- **Filter behavior: `cats === 'safe' && dogs === 'safe'`.** `'unknown'` is EXCLUDED from results (honest — not lying that LATAM species are safe). When toggle is OFF, all entries show as today.
- **Toggle interaction with category filter:** ADDITIVE (filter chains AND-style — category match AND pet-safe match). User experience: pick a category, then toggle pet-safe to narrow further.
- **Visual treatment: React Native `Switch` control with label "🐾 Solo seguras"** (i18n key in `common.json` per TOX-06 namespace). Compact, reuses primitive used elsewhere in Settings, no new component needed.
- **Empty-state behavior: friendly empty state with tip.** When toggle is ON and no plants in the active category match: show "🌿 No hay plantas seguras para mascotas en esta categoría. Probá con [otra categoría]." (or equivalent EN copy). Encourages exploration; matches recommendation-first pivot ethos. Empty-state copy lands as i18n keys in `common.json`.
- **Filter-state persistence:** session-only (resets when onboarding closes). No AsyncStorage flag. Phase 19 does NOT carry pet-safe state forward into the post-onboarding experience.

#### Secondary surface: AddPlantModal toxicity warning banner

When a user adds a plant via `AddPlantModal` with a `prefilledPlant` that resolves to `cats === 'toxic' || dogs === 'toxic'` OR `cats === 'caution' || dogs === 'caution'`, a small warning banner renders at the top of the modal form.

- **Banner copy (locked):**
  - Single-species toxic: "⚠️ Tóxica para [gatos|perros]"
  - Both species toxic: "⚠️ Tóxica para gatos y perros"
  - Single-species caution: "⚠️ Precaución para [gatos|perros]"
  - Mixed (e.g., cats=toxic + dogs=caution): "⚠️ Tóxica para gatos · Precaución para perros"
  - For `'safe'` and `'unknown'` (any species): banner does NOT render. Banner is opt-in — only when there's a non-safe signal.
- **Visual: passive informational banner.** Yellow background (caution-only) or red background (any toxic). NO add-blocking. NO confirmation step before form. NOT paternalistic — user has already chosen this plant; banner is awareness, not gatekeeping.
- **Tap behavior: opens `MyPlantDetailModal` scrolled to Mascotas section** for `prefilledPlant` (only when `prefilledPlant` is a `PlantDBEntry` from the catalog — not when it's a manual creation with no `databaseId`). Reuses the same `initialSection: 'mascotas'` plumbing that the PlantCard toxicity badge tap uses.
- **Renders only when `prefilledPlant` is provided AND resolves to a catalog entry** with non-safe toxicity. Manual plant creation (no prefilledPlant) shows no banner.
- **i18n: in `common.json`.** TOX-06 namespace covers banner strings.

### Classification workflow (Claude's discretion — flagged for planner)

- **How the 118 entries get ASPCA-mapped:** Claude's discretion at Phase 19 planning. Recommendation: per-entry research during execution (slow but accurate; fits the per-task model the planner already uses). Alternatives the planner may consider:
  - Bulk one-shot script that reads ASPCA's published list and matches to catalog `scientificName`.
  - Human-in-the-loop spreadsheet that Claude consumes (catalog ID → cats/dogs/symptoms mapping in a separate JSON/CSV that gets merged into `plantDatabase.ts`).
- **For LATAM species not in ASPCA:** explicit `'unknown'` per cats AND dogs. NOT `'safe'`. Honest UI per TOX-04.
- **Validation gate:** smoke runner asserts EVERY catalog entry has `petToxicity` set (not absent). Mirrors Phase 18 smoke runner shape.

### i18n surface (TOX-06)

- **App-level toxicity LABELS in `common.json`:** the 4 enum strings × 2 locales (EN + ES voseo). Examples (final wording at planning):
  - `toxicity.toxic` → ES: "Tóxica" / EN: "Toxic"
  - `toxicity.caution` → ES: "Precaución" / EN: "Caution"
  - `toxicity.safe` → ES: "Segura" / EN: "Safe"
  - `toxicity.unknown` → ES: "No verificada" / EN: "Unverified"
  - Plus framing strings: `toxicity.safeForBoth`, `toxicity.unverifiedLatam`, `toxicity.symptomsLabel`, `toxicity.filter.label`, `toxicity.filter.emptyState`, `toxicity.toxicForSpecies`, `toxicity.cautionForSpecies`. Final key shape Claude's discretion at planning.
- **Per-entry symptom lists in `plants.json`** (per-entry content, follows existing catalog pattern). EN + ES parity required. Existing `check:i18n-keys` npm script gates this.

### Smoke / Verification

- A `scripts/smoke-phase19.cjs` runner mirroring Phase 13/14/15/16/17/18 shape. Coverage candidates:
  - Every catalog entry in `plantDatabase.ts` has `petToxicity` set (regex/AST count assertion: count of `petToxicity:` matches 118 entries).
  - Every entry's `petToxicity.cats` and `petToxicity.dogs` is one of the 4 valid `ToxLevel` values.
  - Every `'caution'` or `'toxic'` entry has a symptoms list (or graceful-degradation copy is rendered).
  - `PlantCard.tsx` imports a toxicity helper and renders cat/dog badge in `headerRight`.
  - `MyPlantDetailModal.tsx` contains a 🐾 Mascotas section.
  - `AddPlantModal.tsx` (or wherever catalog browse lives) contains the pet-safe Switch toggle.
  - i18n keys for toxicity labels exist in EN + ES `common.json`.
  - `MyPlantDetailModal` accepts an `initialSection` prop (or equivalent scroll-to-section mechanism).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level docs

- `.planning/PROJECT.md` — Vision, principles, non-negotiables, user preferences
- `.planning/REQUIREMENTS.md` §TOX-01..06 — Locked acceptance criteria for Phase 19
- `.planning/ROADMAP.md` §"Phase 19: Pet Toxicity" — Goal + 5 success criteria + dependencies on Phase 17 (118-entry catalog)

### Prior CONTEXT.md files (locked patterns Phase 19 inherits)

- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — `MyPlantDetailModal` section model: emoji-anchored titles, equal weight, expanded by default, sub-blocks hide gracefully, per-modal-session collapse state. Phase 19 Mascotas section MUST follow this pattern as the 5th section.
- `.planning/phases/18-plantcard-cleanup-mood-emoji/18-CONTEXT.md` — PlantCard 5-element budget (image w/ mood-emoji overlay + name + 1 task or none + water badge + mood emoji); `headerRight` slot model; gesture composition (`Gesture.Race(Pan, LongPress)`); `useDismissOnPaywall` opt-in pattern.
- `.planning/phases/13-gesture-bottom-sheet-infrastructure/13-CONTEXT.md` — Reanimated v4 + RNGH 2.28 worklet engine, `triggerHaptic` utility, `BottomSheetModal` provider mount.

### External standards

- ASPCA Animal Poison Control toxic plants list (canonical source per REQUIREMENTS TOX-02). URL not committed; gsd-phase-researcher resolves at planning time.

### CLAUDE.md project instructions

- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` §"Pre-submit Checks" — `check:i18n-keys` and `check:images` gates that Phase 19 outputs must satisfy. New `petToxicity` symptom strings (when added) extend the i18n parity check.
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` §"Internationalization" — voseo for ES, all UI text via `t('key')`, never hardcoded user-facing strings.
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` §"Design System" — values from `src/theme.ts`. No new colors, fonts, or shadow values.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/components/PlantCard.tsx` — `headerRight` flex container at line 245 (currently holds the diagnosis badge); toxicity badge cluster slots in here as a peer. `Gesture.Race(Pan, LongPress)` composition lives in this file from Phase 18 — toxicity badge `Pressable` must coexist via `hitSlop` and (likely) `Gesture.exclusive` or child `Pressable` testing.
- `src/components/MyPlantDetailModal.tsx` — Phase 14 4-section model already established. Phase 19 adds 5th section (`🐾 Mascotas`). Existing `useState` per-modal-session collapse pattern reused. New `initialSection` prop (Claude's discretion — final shape at planning) supports tap-from-toxicity-badge → scroll-to-Mascotas behavior.
- `src/components/AddPlantModal.tsx` — Catalog browse host. Has existing category filter at line 46-70. Pet-safe `Switch` lands in the modal header alongside (or above) the category pills.
- `src/components/PlantDatabaseCard.tsx` — Catalog browse card. Phase 19 does NOT add toxicity badge here per OUT-OF-SCOPE lock; only the in-app `PlantCard.tsx` gets the badge.
- `src/data/plantDatabase.ts` — 118 catalog entries. `PlantDBEntry` interface at `src/types/index.ts:173`. Phase 19 adds `petToxicity` to the interface and to every entry.
- `src/i18n/locales/{en,es}/common.json` — toxicity LABELS land here (TOX-06).
- `src/i18n/locales/{en,es}/plants.json` — per-entry symptom strings land here.
- `scripts/check-i18n-keys.cjs` — existing pre-submit gate; extend coverage to include `petToxicity` symptom keys per entry.

### Established Patterns

- **Catalog content lookup:** `getCatalogEntry(id)` with `_aliases` support. Phase 19 helpers (`getPetToxicity(entry)`, `isPetSafe(entry)`) wrap this and return `{ cats, dogs }` with `'unknown'` fallback for absence.
- **i18n consumption:** `useTranslation()` hook + `t('common:toxicity.toxic')` namespaced keys. Per-entry symptoms: `t('plants:<id>.toxicity.cats.symptoms', { returnObjects: true })` if array shape used; or flat string keys.
- **Smoke runner:** `scripts/smoke-phaseN.cjs` per phase; `npm run smoke:phase19` script wired into `package.json`. PASS/FAIL/SKIP counts reported.
- **Phase 18 token-selection precedent:** `colors.danger` does NOT exist in `theme.ts`; existing precedent uses `colors.dangerText` for red surfaces. Phase 19 toxicity-stripe color must pick from existing tokens.

### Integration Points

- **PlantCard `headerRight` slot:** `PlantCard.tsx:245-256` (current state — diagnosis badge only). Add toxicity badge cluster as a sibling element.
- **MyPlantDetailModal section list:** Phase 14 locks 4 sections; Phase 19 adds the 5th (`🐾 Mascotas`) AFTER `⚙️ Tus ajustes`.
- **AddPlantModal header:** Above or alongside the existing category pills row.
- **Catalog data:** Every `PlantDBEntry` literal in `plantDatabase.ts` gets a `petToxicity` field added during the classification task. Migration is additive — existing entries are not removed or restructured.

</code_context>

<specifics>
## Specific Ideas

- **Mood emoji vs toxicity badge visual hierarchy:** mood emoji uses solid colored circle treatment from Phase 18 (the more prominent "how this plant is feeling" signal). Toxicity badge uses a subtler stripe-on-emoji treatment to NOT compete visually — toxicity is a critical safety signal but a binary state per-species, not a continuum like health. The visual weight asymmetry communicates: "mood is the always-changing pulse; toxicity is a fixed fact."
- **Side-by-side `🐈 🐕` cluster matches REQUIREMENTS literal wording.** Two independent badges, cat first per REQUIREMENTS TOX-03.
- **"Direct-to-Mascotas tap target" decision is a UX investment for discoverability** — the user explicitly chose this over no-op despite higher implementation cost. Worth the planner-time to wire `initialSection` plumbing through MyPlantDetailModal.

</specifics>

<deferred>
## Deferred Ideas

- **User pet-preference setting** ("I have cats only" / "I have dogs only" / "both") — would personalize the pet-safe filter. Phase-deferred.
- **Toxicity badge on `PlantDatabaseCard`** (catalog browse cards). Could help users scan toxicity at-a-glance during catalog browse. Phase-deferred — current Phase 19 scope is filter-only on browse + badge on in-app PlantCard.
- **Edit-time toxicity warning modal** ("This plant is toxic to cats — confirm add?") on AddPlant flow. Phase-deferred. Filter is the canonical mechanism this phase.
- **App-wide pet-safe Settings preference** that hides toxic plants globally (catalog browse + identify results + diagnosis suggestions). Phase-deferred — local AddPlantModal toggle only.
- **Per-pet-name profiles** (e.g., "Mishi (cat)" / "Toby (dog)" with photos). Way out of scope.

</deferred>

---

*Phase: 19-pet-toxicity*
*Context gathered: 2026-05-08*
