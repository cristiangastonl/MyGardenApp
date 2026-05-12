# Phase 19: Pet Toxicity - Research

**Researched:** 2026-05-08
**Domain:** Catalog data classification (ASPCA) + RN UI integration (badge, modal section, filter) + i18n + Reanimated v4 / RNGH 2.28 gesture coexistence
**Confidence:** HIGH (codebase, Phase 13/14/18 patterns, ASPCA structure); MEDIUM (RNGH `Pressable` inside `Gesture.Race` pass-through behavior — known patterns but precise iOS edge cases require device verification at smoke time, not researcher time).

## Summary

Phase 19 is a **content-first** phase wrapped in three small UI integrations. The locked CONTEXT.md decisions remove ~70% of the typical research surface (badge slot, filter UX, modal section, data shape, copy — all locked). What's left is the *how*: classification workflow, `initialSection` plumbing into Phase 14's modal, gesture-coexistence for the badge `Pressable`, and Nyquist validation pillars.

The work decomposes cleanly: (1) extend `PlantDBEntry` with `petToxicity?: { cats: ToxLevel; dogs: ToxLevel; symptoms? }`, (2) classify all 118 entries against ASPCA in a single human-in-the-loop spreadsheet pass that Claude consumes during execution, (3) add a `PetToxicityBadge` cluster to `PlantCard.tsx:245-256` `headerRight`, (4) thread an `initialSection` prop through `MyPlantDetailModal.tsx` to scroll the new 5th `🐾 Mascotas` section into view, (5) add a pet-safe filter `Switch` to the catalog-browse host (clarification: `OnboardingScreen.tsx`, NOT `AddPlantModal.tsx` — see §"Critical CONTEXT.md mismatch" below), (6) extend `check-i18n-keys.mjs` and ship `scripts/smoke-phase19.cjs` mirroring Phase 18's CJS runner shape.

**Primary recommendation:** Adopt the human-in-the-loop spreadsheet workflow (Section §"Classification Workflow"). It is the only approach that scales honestly to 118 entries against ASPCA's non-API list while preserving auditability per the CRIT-2 lock ("ASPCA source URL required per entry in code comment").

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data shape (TOX-01)**
- `PlantDBEntry.petToxicity?: { cats: ToxLevel, dogs: ToxLevel }` — additive optional field on `PlantDBEntry` interface at `src/types/index.ts:173`.
- `ToxLevel = 'safe' | 'caution' | 'toxic' | 'unknown'`.
- **Absence of field is treated as `'unknown'` (NOT `'safe'`).** Helper `entry.petToxicity?.cats ?? 'unknown'` and same for dogs is the pattern for all consumers.
- LATAM species not in ASPCA get `petToxicity: { cats: 'unknown', dogs: 'unknown' }` — explicit field, honest UI.

**PlantCard badge slot (TOX-03)**
- **Location:** `headerRight` peer of diagnosis badge at `PlantCard.tsx:245-256`. Reuses existing `<View style={styles.headerRight}>` flex container. No new view tree, no new layout. Order: diagnosis badge first (when active), then toxicity badges.
- **Stacking when both species are non-safe: SIDE-BY-SIDE HORIZONTAL.** `🐈 🐕` in a single row, cat first. Each emoji rendered with its OWN per-species severity color (cats may be yellow while dogs are red).
- **Visual treatment: emoji + colored severity stripe** (NOT solid circle — must NOT visually compete with mood emoji from Phase 18).
- **Hidden for `'safe'` and `'unknown'`.** Only `'toxic'` and `'caution'` render.
- **Tap target: opens `MyPlantDetailModal` scrolled to Mascotas section.** Badge must use `Pressable`/`TouchableOpacity` with `hitSlop`; coexists with PlantCard's `Gesture.Race(Pan, LongPress)`.
- **PlantCard body tap UNCHANGED:** existing `onPress` behavior preserved.
- **Both render modes:** identical in `mode="tasks"` and `mode="collection"`.

**Modal Mascotas section (TOX-04)**
- **Position:** 5th section after Phase 14's locked 4 (`🌿 ¿Qué hacer?` / `🏠 ¿Dónde ponerla?` / `ℹ️ ¿Por qué?` / `⚙️ Tus ajustes`). Section title: `🐾 Mascotas`.
- **Visibility: ALWAYS RENDERED** (even for safe plants). Default expanded like the other 4.
- **Per-state copy (locked from REQUIREMENTS):**
  - `'safe'` (both species) → "Segura para gatos y perros ✓"
  - `'caution'` (per species) → "Precaución para [especie]. Síntomas: [lista]"
  - `'toxic'` (per species) → "Tóxica para [especie]. Síntomas: [lista]"
  - `'unknown'` (per species) → "No verificada para esta especie en LATAM 🤷"
- **Symptoms list source: PER-ENTRY catalog field.** `petToxicity.cats.symptoms?: string[]` and `petToxicity.dogs.symptoms?: string[]` only for `'caution'`/`'toxic'` entries.
- **Symptoms i18n: in `plants.json`** (per-entry content, follows existing catalog pattern). `check:i18n-keys` extends to cover symptoms.
- **Toxicity LABELS (4 enum strings + framing) in `common.json`** (per TOX-06).
- **Graceful degradation:** if symptoms missing for `'caution'`/`'toxic'` entry, copy degrades to "Precaución/Tóxica para [especie]." (no symptoms list line).
- **No phone CTA, no clinic recommendation.**
- **Per-species asymmetry: TWO INDEPENDENT LINES** when cats=safe and dogs=toxic.

**Pet-safe filter (TOX-05)**
- **Location:** AddPlantModal header *(but see §"Critical CONTEXT.md mismatch" below — actual host is OnboardingScreen.tsx, planner must clarify)*.
- **Filter behavior:** `cats === 'safe' && dogs === 'safe'`. `'unknown'` is EXCLUDED from results.
- **Visual treatment:** React Native `Switch` with label "🐾 Solo seguras" (i18n key in `common.json`).
- **Empty-state behavior:** friendly empty state with category-suggestion fallback. Copy in `common.json`.
- **Toggle interaction with category filter:** ADDITIVE (AND-style — category match AND pet-safe match).

**Classification workflow (Claude's discretion within TOX-02 + CRIT-2 lock)**
- ASPCA Animal Poison Control list is canonical source.
- LATAM species not in ASPCA → explicit `'unknown'` for cats AND dogs.
- CRIT-2 lock from STATE.md: "ASPCA source URL required per entry in code comment."

**i18n surface (TOX-06)**
- App-level toxicity LABELS (4 enum strings + framing) in `common.json` × EN+ES (voseo for ES).
- Per-entry symptom lists in `plants.json` × EN+ES.

**Smoke / Verification**
- `scripts/smoke-phase19.cjs` mirrors Phase 13/14/15/16/17/18 shape. Coverage candidates listed in CONTEXT.md §"Smoke / Verification".

### Claude's Discretion

- **Classification workflow execution detail** — per-entry research vs bulk script vs spreadsheet. (See §"Classification Workflow" below for prescriptive recommendation.)
- **Exact severity colors from existing tokens** — `colors.dangerText` for red, `colors.sunGold` candidate for yellow caution. (See §"Theme Tokens" below — verified.)
- **Concrete badge dimensions, stripe geometry, padding** — within the "subtler than mood emoji" guardrail.
- **`initialSection` prop shape** — Claude picks final API. Recommendation: `initialSection?: 'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas'`.
- **Catalog-browse host disambiguation** — see §"Critical CONTEXT.md mismatch" below. Recommendation: implement filter in OnboardingScreen (the actual MVP catalog browse) and document deferral if/when ExploreScreen ships.
- **Empty-state category-suggestion algorithm** — Claude picks. Simplest viable: pick a different category that has ≥1 pet-safe entry.
- **Smoke runner sentinel shapes** — Claude picks regex/AST patterns.

### Deferred Ideas (OUT OF SCOPE)

- User pet-preference setting ("I have cats only" / "I have dogs only" / "both").
- Toxicity badge on `PlantDatabaseCard` (catalog browse cards).
- Edit-time toxicity warning modal on AddPlant flow.
- App-wide pet-safe Settings preference that hides toxic plants globally.
- Per-pet-name profiles ("Mishi (cat)" / "Toby (dog)").

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOX-01 | `PlantDBEntry.petToxicity?: { cats: ToxLevel, dogs: ToxLevel }` additive optional; absence = `'unknown'` | §"Data Shape" — exact field placement at `src/types/index.ts:223` (after `whyRationale?`); `getTranslatedPlant` extension pattern matches Phase 14 EDU-02 precedent |
| TOX-02 | All 118 entries classified per cats + dogs against ASPCA; LATAM species → `'unknown'` honestly | §"Classification Workflow" — spreadsheet pipeline + ASPCA URL pattern + family-genus heuristics + per-entry source URL comment for CRIT-2 audit |
| TOX-03 | PlantCard renders cat 🐈 / dog 🐕 toxicity badge: red for `'toxic'`, yellow for `'caution'`; hidden for `'safe'`/`'unknown'` | §"PlantCard Badge Integration" — exact slot at `PlantCard.tsx:245-256`; Phase 18 `Gesture.Race(Pan, LongPress)` coexistence solution; theme tokens verified |
| TOX-04 | MyPlantDetailModal "Mascotas" section ALWAYS visible with per-species copy for all 4 states; no phone CTA | §"Modal Mascotas Section" — 5th section after Phase 14's 4; `initialSection` plumbing pattern; per-state copy + symptoms rendering |
| TOX-05 | Catalog browse pet-safe filter — toggles entries safe for cats AND dogs; `'unknown'` excluded | §"Pet-safe Filter" — host is OnboardingScreen (not AddPlantModal — clarified); Switch component, additive AND with category, empty-state with category suggestion |
| TOX-06 | i18n toxicity labels in `common.json` (4-state enum × 2 locales); per-entry symptoms in `plants.json` | §"i18n Architecture" — `common.json` structure verified; `plants.json` array shape + `returnObjects: true` consumption; `check-i18n-keys.mjs` extension recipe with conditional pattern |

</phase_requirements>

## Critical CONTEXT.md Mismatch (planner must reconcile)

CONTEXT.md repeatedly states the pet-safe filter lives in the "AddPlantModal header." **This is incorrect** — `src/components/AddPlantModal.tsx` (441 LOC) is a form modal for manual plant creation (name input + plant-type chips + light picker + water schedule). It does NOT contain a catalog browse with category filter.

The actual catalog browse with category filter chips lives in:

1. **`src/screens/OnboardingScreen.tsx:207-230`** — MVP catalog browse (the first-plant flow). `selectedCategory` state at L207, `filteredPlants = PLANT_DATABASE.filter(p => p.category === selectedCategory)` at L228-230. Renders `PlantDatabaseCard` for each. **This is the canonical MVP host for the pet-safe filter.**

2. **`src/screens/ExploreScreen.tsx:36-48`** — V1.1 Explore tab. `selectedCategory` state, `searchPlants()` + category filter. Currently gated behind `Features.EXPLORE_TAB: false` (V1.1 pending). **NOT mounted in MVP.**

**Recommendation:** Plan the filter for **`OnboardingScreen.tsx`** (the actual MVP catalog browse). A second copy for `ExploreScreen.tsx` is acceptable in the same phase since the toggle pattern is small and self-contained, OR defer ExploreScreen integration until `EXPLORE_TAB` flips. Either is honest. Planner should surface this disambiguation in PLAN.md ahead of execution.

**Confidence:** HIGH — verified via `grep -n "selectedCategory\|PlantDatabaseCard\|FlatList" OnboardingScreen.tsx ExploreScreen.tsx AddPlantModal.tsx`.

## Standard Stack

### Core (already installed — Phase 13)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native` | (Expo SDK 54) | `Switch`, `Pressable`, `Text`, `TouchableOpacity` for badge + filter | Already used in `SettingsScreen` (5 Switches) and `SettingsPanel` (3 Switches) — mature pattern |
| `react-native-gesture-handler` | 2.28.x | `Gesture.Pan/LongPress/Race` already on PlantCard; child `Pressable` requires `hitSlop` to coexist | Phase 13 INFRA-01 lock |
| `react-native-reanimated` | 4.x | Phase 14's `EducationalSection` uses `useSharedValue` + `useAnimatedStyle` for collapse — modal scroll-to-section reuses `useAnimatedRef` + `scrollTo` worklet | Phase 13 INFRA lock |
| `react-i18next` | (existing) | All UI strings — toxicity labels in `common.json`, symptoms in `plants.json`; `t('plants:potus.petToxicity.cats.symptoms', { returnObjects: true })` | Existing app discipline |

**No new dependencies.** Phase 19 is content + JSX-restructure only.

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `@gorhom/bottom-sheet` | Already provider-wrapped at App root (Phase 13) | NOT needed for Phase 19 (Mascotas section is inside existing fullscreen Modal) |
| `expo-haptics` via `triggerHaptic` | Phase 13 utility | Optional on toxicity-badge tap (`'selection'` recommended); Claude's discretion |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `useScrollToSection` worklet via `useAnimatedRef.scrollTo` | Measure section `onLayout` y-coordinates and `scrollViewRef.current?.scrollTo({y, animated: true})` (JS-thread, classic) | Reanimated worklet is ~16ms smoother BUT ScrollView (not Animated.ScrollView) is what `MyPlantDetailModal.tsx:193` currently uses. Recommendation: stay with classic `scrollViewRef.current?.scrollTo` + a layout map (see §"initialSection plumbing"). Avoids switching ScrollView to Animated.ScrollView and re-validating the existing Phase 14 collapse animation. |
| Per-entry `petToxicity` field | Separate `src/data/petToxicity.json` lookup keyed by id | Locked: per CONTEXT.md decision, lives on `PlantDBEntry`. Single-source-of-truth, cleaner getCatalogEntry consumption. |

## Architecture Patterns

### Recommended file layout

```
src/
├── types/index.ts                        # +ToxLevel + petToxicity field on PlantDBEntry
├── data/plantDatabase.ts                 # +petToxicity per entry (118 entries × cats/dogs/symptoms?)
├── i18n/locales/{en,es}/common.json      # +toxicity.* namespace (4 states + framing)
├── i18n/locales/{en,es}/plants.json      # +per-entry petToxicity.cats.symptoms[] / petToxicity.dogs.symptoms[]
├── components/
│   ├── PetToxicityBadge.tsx              # NEW — small per-species badge (emoji + stripe)
│   ├── PetToxicityBadgeCluster.tsx       # NEW (or inline in PlantCard) — cat+dog side-by-side
│   ├── PlantCard.tsx                     # +cluster in headerRight at L245-256
│   ├── MyPlantDetailModal.tsx            # +5th section + initialSection prop + scroll-to-section
│   └── plant-detail/
│       └── EducationalSection.tsx        # UNCHANGED (Phase 14 collapsible)
├── utils/
│   └── petToxicity.ts                    # NEW — getPetToxicity(entry), isPetSafe(entry), getSymptoms(entry, species)
├── screens/
│   ├── OnboardingScreen.tsx              # +pet-safe Switch above category chips + filter
│   └── ExploreScreen.tsx                 # OPTIONAL — same Switch (gated behind EXPLORE_TAB=false MVP)
└── scripts/
    ├── check-i18n-keys.mjs               # +conditional petToxicity symptom checks (mirror nutrient pattern at L66-73)
    └── smoke-phase19.cjs                 # NEW — file-content asserts mirroring Phase 18 shape
```

### Pattern 1: Catalog field extension (Phase 14 EDU-02 precedent)

**What:** Additive optional fields on `PlantDBEntry`, surfaced via `getTranslatedPlant()` helper, gated by feature presence in consumers.

**When to use:** Adding new per-entry catalog content that ships gradually (118 classifications won't all be perfect on day one — some will be `'unknown'` honestly).

**Example:** Pattern from Phase 14 EDU-02 at `src/types/index.ts:213-223`. Phase 19 mirrors verbatim:

```typescript
// src/types/index.ts (after L223)
export type ToxLevel = 'safe' | 'caution' | 'toxic' | 'unknown';

export interface PetToxicityEntry {
  /** ASPCA classification per species. */
  cats: ToxLevel;
  dogs: ToxLevel;
  /** Per-species symptom arrays — only present when level is 'caution' or 'toxic'.
   *  Catalog source field; displayed strings come from plants.json (per-entry, EN+ES). */
  symptoms?: {
    cats?: string[];
    dogs?: string[];
  };
  /** ASPCA source URL per entry — CRIT-2 audit requirement (STATE.md pre-decision lock). */
  source?: string;
}

export interface PlantDBEntry {
  // ... existing fields ...
  /** v1.2 Phase 19 (TOX-01) — pet toxicity per cats/dogs against ASPCA. Absence = 'unknown'. */
  petToxicity?: PetToxicityEntry;
}
```

### Pattern 2: Helper module (CONTEXT.md "absence = unknown" discipline)

**What:** Single helper resolves `entry.petToxicity?.cats ?? 'unknown'` so consumers never branch on absence themselves.

```typescript
// src/utils/petToxicity.ts
import { PlantDBEntry, ToxLevel } from '../types';

export function getPetToxicity(entry: PlantDBEntry | null | undefined): { cats: ToxLevel; dogs: ToxLevel } {
  return {
    cats: entry?.petToxicity?.cats ?? 'unknown',
    dogs: entry?.petToxicity?.dogs ?? 'unknown',
  };
}

export function isPetSafe(entry: PlantDBEntry | null | undefined): boolean {
  const tox = getPetToxicity(entry);
  return tox.cats === 'safe' && tox.dogs === 'safe';
}

export function shouldShowBadge(level: ToxLevel): boolean {
  return level === 'toxic' || level === 'caution';
}
```

### Pattern 3: Pressable-inside-GestureDetector with hitSlop (Phase 18 coexistence)

**What:** Phase 18's `Gesture.Race(longPressGesture, panGesture)` wraps the entire card. RNGH 2.28's behavior: a child `Pressable`/`TouchableOpacity` placed inside a `GestureDetector` will receive its `onPress` as long as the parent gestures have **not yet activated**. Pan activates on `activeOffsetX([-15, 15])`. LongPress activates after 500ms. A `Pressable.onPress` that fires on `onTouchEnd` BEFORE either threshold cross is reached is honored.

**When to use:** Tap-target inside an active gesture region — exactly Phase 19 toxicity-badge case.

**Example:**

```tsx
// PetToxicityBadge.tsx
import { Pressable, View, Text } from 'react-native';
import { hitSlop } from '../theme';

export function PetToxicityBadge({ species, level, onPress }: Props) {
  if (level !== 'toxic' && level !== 'caution') return null;
  const stripeColor = level === 'toxic' ? colors.dangerText : colors.sunGold;
  const emoji = species === 'cats' ? '🐈' : '🐕';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}            // theme.ts exports {top:12,bottom:12,left:12,right:12}
      accessibilityLabel={t(`toxicity.a11y.${species}.${level}`)}
      accessibilityRole="button"
      style={styles.badge}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
    </Pressable>
  );
}
```

**Gotcha (MEDIUM confidence):** if user touches the badge AND the gesture later resolves to LongPress (held >500ms), Race may declare LongPress winner and the `Pressable.onPress` will not fire. This is the **intended** behavior — long-press wins overflow menu. The risk window is small (500ms) and there's no easy mitigation without breaking long-press. Acceptable trade-off; mirrored by countless production apps. Add to smoke-phase19 device-test checklist.

**Fallback if conflict cannot be resolved cleanly:** the badge becomes a visual-only indicator and the user opens MyPlantDetailModal via card-body tap (existing behavior), then scrolls to Mascotas (5th section, ~3 swipes). This degrades the "tap badge → open at Mascotas" UX but does NOT lose information. Implement primary path; if device-test reveals conflict, ship fallback in same phase.

### Pattern 4: ScrollView programmatic scroll-to-section (`initialSection` plumbing)

**What:** Modal opens with scroll already at the section the user clicked from.

`MyPlantDetailModal.tsx:193` uses a plain `<ScrollView>`. Pattern:

```tsx
const scrollViewRef = useRef<ScrollView>(null);
const sectionLayouts = useRef<Record<SectionId, number>>({});

const onSectionLayout = (id: SectionId) => (e: LayoutChangeEvent) => {
  sectionLayouts.current[id] = e.nativeEvent.layout.y;
};

useEffect(() => {
  if (!visible || !initialSection) return;
  const y = sectionLayouts.current[initialSection];
  if (y == null) return;
  // Wait one tick for layout to settle on first open.
  const t = setTimeout(() => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  }, 0);
  return () => clearTimeout(t);
}, [visible, initialSection]);

// In JSX:
<ScrollView ref={scrollViewRef} ...>
  <View onLayout={onSectionLayout('que-hacer')}>...</View>
  <View onLayout={onSectionLayout('donde')}>...</View>
  <View onLayout={onSectionLayout('por-que')}>...</View>
  <View onLayout={onSectionLayout('tus-ajustes')}>...</View>
  <View onLayout={onSectionLayout('mascotas')}>...</View>  {/* NEW */}
</ScrollView>
```

**Prop shape (recommendation):**

```typescript
type ModalSectionId = 'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas';

interface MyPlantDetailModalProps {
  // ... existing props ...
  initialSection?: ModalSectionId;
}
```

**Wiring path:** `PetToxicityBadge.onPress → PlantsScreen/TodayScreen.handleOpenDetailToMascotas(plant) → setDetailPlant(plant) + setDetailInitialSection('mascotas') → <MyPlantDetailModal initialSection={detailInitialSection} ... />`. Reset `detailInitialSection` to `undefined` on `onClose` so subsequent opens don't auto-scroll.

**Confidence:** HIGH — pattern documented in React Native ScrollView docs and broadly used in production apps. Edge case: `onLayout` fires asynchronously, so the very first open MAY race the scroll. The `setTimeout(..., 0)` defers to next tick which is sufficient in practice; if not, fall back to a `requestAnimationFrame` or 50ms delay.

### Anti-Patterns to Avoid

- **Hand-rolling a global "PetToxicityProvider" Context** — YAGNI. Per-component computation via `getPetToxicity(entry)` helper is sufficient. (Phase 18 OnboardingScreen "no global Toast context" precedent applies.)
- **Caching `petToxicity` on `Plant` instances** (vs reading from catalog) — would replicate the `tip` cache anti-pattern Phase 14 corrected. Read from `getCatalogEntry(plant.databaseId)` at consumption time.
- **Using `Modal` to show the Mascotas section** — DON'T. The CONTEXT.md lock says Mascotas is a 5th `EducationalSection` inside the existing fullscreen modal — same component the other 4 sections use.
- **Adding `petToxicity` to a Supabase round-trip** — out of scope. Phase 19 ships local-only catalog data (no `syncService.ts` changes).
- **Fixing the AddPlantModal vs OnboardingScreen mismatch silently** — surface it in PLAN.md with the disambiguation question, do not assume.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Side-by-side cat+dog cluster in `headerRight` | New flex container | Existing `<View style={styles.headerRight}>` at `PlantCard.tsx:245` (`flexDirection: 'row', gap: spacing.xs`) | Already a row container with gap — the cluster IS the row, no wrapper needed |
| Per-species severity color | New theme tokens | `colors.dangerText` (red) + `colors.sunGold` (yellow caution) | Phase 18 `dangerText` precedent; sunGold reads as caution-yellow without conflicting with sun-task semantic (sun task uses `colors.warningBg`/`colors.sunDark`, not raw sunGold) |
| Pet-safe filter UI primitive | Custom toggle component | React Native `<Switch>` | 8 existing usages in `SettingsPanel.tsx` and `SettingsScreen.tsx` (verified via grep) — proven pattern |
| Symptom-list i18n shape | Flat keyed strings (`symptom1`, `symptom2`) | `t(key, { returnObjects: true })` returning string array | `react-i18next` first-class for arrays; existing `plants.json` `problems[]` array pattern is the precedent |
| ASPCA classification UI in app | "Recommend a vet" CTA | Honest 4-state copy, NO phone CTA | REQUIREMENTS TOX-04 lock + research liability rationale (FEATURES.md L139) |
| Modal scroll-to-section animation primitive | Reanimated `useAnimatedRef.scrollTo` worklet | Plain `scrollViewRef.current?.scrollTo({y, animated: true})` | Existing modal uses standard `<ScrollView>`, not `Animated.ScrollView`. Avoids touching Phase 14 surface unnecessarily |
| Smoke runner harness | New harness shape | Copy `scripts/smoke-phase18.cjs` verbatim, adapt sentinels | Phase 13/14/15/16/17/18 all share this CJS harness shape — `pass/fail/skip` counters + `assertSkippable` for SKIP-then-PASS gating |

**Key insight:** Phase 19 is content + small JSX additions on top of well-established Phase 13/14/18 infrastructure. Building anything novel here is over-investment; reuse precedent verbatim.

## Common Pitfalls

### Pitfall 1: Treating absence-of-field as 'safe'

**What goes wrong:** Helper resolves `entry.petToxicity?.cats ?? 'safe'` instead of `?? 'unknown'`. Catalog entries that haven't been classified yet show as "Segura para gatos y perros ✓" — a dangerous false claim.

**Why it happens:** TypeScript's optional-chaining + nullish-coalescing makes 'safe' a tempting default ("seems harmless"). Reading CONTEXT.md carefully shows the explicit lock: absence = `'unknown'`.

**How to avoid:** Helper module `src/utils/petToxicity.ts` with `getPetToxicity()` is the ONLY way consumers read toxicity data. Smoke runner asserts "absence-fallback" via a synthetic test entry.

**Warning signs:** Any consumer code that reads `entry.petToxicity` directly. Any default that says `'safe'` instead of `'unknown'`.

### Pitfall 2: ScrollView `scrollTo` race with `onLayout`

**What goes wrong:** Modal opens with `initialSection='mascotas'`. The `useEffect` fires before `onLayout` callbacks have populated `sectionLayouts.current` — `y` is undefined and the scroll silently no-ops. User sees the modal at the top.

**Why it happens:** React's mount → layout → paint cycle is async; effects run before layout in some cases.

**How to avoid:** `setTimeout(..., 0)` defers the scroll to next macrotask, by which point all `onLayout` callbacks have fired. If still racy on slower devices, escalate to `requestAnimationFrame` or 50ms `setTimeout`. Always-render fallback: include a small "Mascotas" anchor link in the modal header (chip "Mascotas →") so the user has a manual recovery path.

**Warning signs:** Phase 19 device-test reveals "modal opens at top, doesn't scroll" — fix is to bump the defer.

### Pitfall 3: `Pressable` swallowed by Gesture.Race

**What goes wrong:** User taps the toxicity badge. The `Pan` gesture activates on horizontal movement >15px (likely if user thumb drifts), Pan wins the Race, badge `onPress` doesn't fire. User concludes badge is broken.

**Why it happens:** `Gesture.Pan().activeOffsetX([-15, 15])` is permissive on iOS. A 16px drift kills the press.

**How to avoid:**
1. `hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}` (theme.ts exports `hitSlop` constant) — gives user a generous tap region with less drift pressure.
2. Document in smoke-phase19 device-test checklist as a known-test scenario.
3. Fallback path documented: if user can't reliably tap badge, modal opens via card-body tap.

**Warning signs:** QA reports "I tapped the badge but nothing happened, then on the second try it worked." Indicates drift-on-first-tap.

### Pitfall 4: i18n parity drift on per-entry symptom arrays

**What goes wrong:** Entry `lirio` declares `petToxicity.cats: 'toxic'` with symptoms in EN `plants.json` but ES is missing. `check:i18n-keys` doesn't catch it because the script only validates EN+ES PARITY for keys EXISTING in catalog declarations — and `petToxicity.cats.symptoms` is OPTIONAL.

**Why it happens:** Conditional validation has nuanced edge cases. The Phase 14 nutrient-conditional pattern at `check-i18n-keys.mjs:67-74` treats nutrients as a required keyset when declared. Symptom-list extension must follow the same pattern.

**How to avoid:** Conditional check in `check-i18n-keys.mjs`:

```javascript
// Mirror lines 78-89 nutrient/careAction pattern
if (entry.petToxicity?.symptoms?.cats) {
  if (!Array.isArray(node.petToxicity?.symptoms?.cats) || node.petToxicity.symptoms.cats.length < 1) {
    errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.cats missing or empty`);
  }
}
if (entry.petToxicity?.symptoms?.dogs) {
  if (!Array.isArray(node.petToxicity?.symptoms?.dogs) || node.petToxicity.symptoms.dogs.length < 1) {
    errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.dogs missing or empty`);
  }
}
```

**Warning signs:** Live render shows English symptoms in Spanish app. Pre-submit `check:i18n-keys` should catch BEFORE this lands.

### Pitfall 5: ASPCA "non-toxic" ≠ "safe" (subtle data-modeling mistake)

**What goes wrong:** ASPCA's binary classification is "Toxic to Cats / Non-Toxic to Cats." Mapping "Non-Toxic" → our `'safe'` is correct. But ASPCA's "non-toxic" doesn't mean "dietary supplement" — it means "no significant toxicity reported." Users reading "Segura para gatos y perros ✓" may interpret this as "actively safe to chew." Different audience expectation.

**Why it happens:** Translation drift between ASPCA's veterinary terminology and consumer-facing UX copy.

**How to avoid:** "Segura" in ES context, in this app, communicates "won't poison your pet if curiously nibbled" — which IS what ASPCA "non-toxic" certifies. The CONTEXT.md-locked copy "Segura para gatos y perros ✓" with the checkmark is honest-enough. NO need to caveat in-app. (Adding "Pero no es comida" caveat would bloat the modal and dilute the safety signal.) Document this interpretation in PLAN.md so future maintainers don't silently rework the copy.

**Warning signs:** User feedback asking "can my cat eat this?" — answer: ASPCA says non-toxic, but no plant is intentional cat food. App is not the place for that nuance.

### Pitfall 6: Classification non-determinism — same plant, different results

**What goes wrong:** A catalog entry like `lavanda-angustifolia` (Lavandula angustifolia) — ASPCA's main plant list has "Lavender" listed as toxic to cats. But `lavanda-stoechas` (Lavandula stoechas, Spanish lavender) and `lavanda-dentada` (Lavandula dentata, French lavender) — neither species is named in ASPCA. Are they toxic by-genus? Likely yes, but Claude has no per-species ASPCA citation.

**Why it happens:** ASPCA lists ~1,000 entries by common name; many genera have multiple species, only some of which appear by common name on ASPCA.

**How to avoid:** Per-genus classification rule (**document in plantDatabase.ts code comment**, not just CRIT-2 lock):
1. If ASPCA lists species directly by scientific name → use that.
2. If ASPCA lists genus only OR a sister species → inherit classification, comment cites the related entry.
3. If neither → mark `'unknown'` honestly. **Do not extrapolate from family-level patterns** (Asteraceae includes both daisies and dandelions — wildly different toxicity).

**Warning signs:** Spreadsheet has classifications without source URLs. CRIT-2 audit fails.

### Pitfall 7: Mood emoji and toxicity badge visual collision

**What goes wrong:** Phase 18 mood emoji is on the **image-overlay** (bottom-right of 48×48 plant image, 22×22 circle). Toxicity badge is in `headerRight`. Visually distinct slots — but user perception may conflate them as "two badges that mean similar things."

**Why it happens:** Both use emoji + colored background. Both are small. Both signal plant-status.

**How to avoid:** CONTEXT.md-locked visual hierarchy: mood emoji = solid colored circle (prominent); toxicity badge = emoji + thin colored stripe (subtler). The asymmetry MUST be visible at-a-glance. Smoke runner can't enforce this — device-test checklist item: "are mood emoji and toxicity badge visually distinct enough that the toxicity message reads as a safety fact, not a health pulse?"

**Warning signs:** UAT feedback that users can't tell mood from toxicity at-a-glance.

## Code Examples

### Example 1: PetToxicityBadge component

```tsx
// src/components/PetToxicityBadge.tsx
import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, hitSlop, fonts } from '../theme';
import type { ToxLevel } from '../types';

interface Props {
  species: 'cats' | 'dogs';
  level: ToxLevel;
  onPress: () => void;
}

export function PetToxicityBadge({ species, level, onPress }: Props) {
  const { t } = useTranslation();
  if (level !== 'toxic' && level !== 'caution') return null;

  const stripeColor = level === 'toxic' ? colors.dangerText : colors.sunGold;
  const emoji = species === 'cats' ? '🐈' : '🐕';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityLabel={t(`toxicity.a11y.${species}.${level}`)}
      accessibilityRole="button"
      style={styles.badge}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create<{ badge: ViewStyle; emoji: TextStyle; stripe: ViewStyle }>({
  badge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emoji: { fontSize: 16 },
  stripe: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
});
```

### Example 2: PlantCard headerRight integration

```tsx
// src/components/PlantCard.tsx — headerRight slot at L245-256 (additive)
import { PetToxicityBadge } from './PetToxicityBadge';
import { getPetToxicity, shouldShowBadge } from '../utils/petToxicity';
import { getCatalogEntry } from '../data/plantDatabase';

// Inside component body:
const catalogEntry = plant.databaseId ? getCatalogEntry(plant.databaseId) : null;
const tox = getPetToxicity(catalogEntry);
const showCatBadge = shouldShowBadge(tox.cats);
const showDogBadge = shouldShowBadge(tox.dogs);

// In JSX, modify L245-256:
<View style={styles.headerRight}>
  {(hasActiveDiagnosis || (activeTrackingStatus && activeTrackingStatus !== 'resolved')) && (
    <View style={styles.diagnosisBadge}>
      <Text style={styles.diagnosisBadgeText}>
        {activeTrackingStatus && activeTrackingStatus !== 'resolved'
          ? TRACKING_STATUS_CONFIG[activeTrackingStatus].emoji
          : '🩺'}
      </Text>
    </View>
  )}
  {showCatBadge && (
    <PetToxicityBadge
      species="cats"
      level={tox.cats}
      onPress={() => onOpenToMascotas?.(plant)}
    />
  )}
  {showDogBadge && (
    <PetToxicityBadge
      species="dogs"
      level={tox.dogs}
      onPress={() => onOpenToMascotas?.(plant)}
    />
  )}
</View>
```

`onOpenToMascotas?: (plant: Plant) => void` is a new optional prop on `PlantCard`. Passed by `PlantsScreen` and `TodayScreen` (parallel to existing `onPress`, `onLongPress`, `onSwipeCommitted`).

### Example 3: MyPlantDetailModal — initialSection plumbing + Mascotas section

```tsx
// src/components/MyPlantDetailModal.tsx — additive

import { LayoutChangeEvent, ScrollView } from 'react-native';
type ModalSectionId = 'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas';

interface MyPlantDetailModalProps {
  // ... existing props ...
  /** v1.2 Phase 19 — when set, modal scrolls to that section after layout. Reset to undefined on close. */
  initialSection?: ModalSectionId;
}

// Inside component body:
const scrollViewRef = useRef<ScrollView>(null);
const sectionLayouts = useRef<Partial<Record<ModalSectionId, number>>>({});

const onSectionLayout = (id: ModalSectionId) => (e: LayoutChangeEvent) => {
  sectionLayouts.current[id] = e.nativeEvent.layout.y;
};

useEffect(() => {
  if (!visible || !initialSection) return;
  const t = setTimeout(() => {
    const y = sectionLayouts.current[initialSection];
    if (y != null) scrollViewRef.current?.scrollTo({ y, animated: true });
  }, 0);
  return () => clearTimeout(t);
}, [visible, initialSection]);

// In JSX, modify ScrollView at L193:
<ScrollView ref={scrollViewRef} ...>
  {/* ... existing 4 sections each wrapped with onLayout={onSectionLayout('que-hacer' | 'donde' | 'por-que' | 'tus-ajustes')} ... */}
  
  {/* 🐾 Mascotas — NEW 5th section. ALWAYS visible. */}
  <View onLayout={onSectionLayout('mascotas')}>
    <EducationalSection emoji="🐾" title={t('plantDetailModal.pets')}>
      <MascotasContent
        toxicity={getPetToxicity(strictDbEntry)}
        plantId={plant.databaseId}
      />
    </EducationalSection>
  </View>
</ScrollView>
```

`MascotasContent` is a small inline sub-component that branches on `(cats, dogs) ∈ {safe, caution, toxic, unknown}` and renders the per-state copy.

### Example 4: MascotasContent — per-state rendering with two-line asymmetric layout

```tsx
// Inline or src/components/plant-detail/MascotasContent.tsx
import { useTranslation } from 'react-i18next';

function MascotasContent({ toxicity, plantId }: { toxicity: { cats: ToxLevel; dogs: ToxLevel }; plantId?: string }) {
  const { t } = useTranslation();
  const { cats, dogs } = toxicity;

  // Special case: both safe → single line.
  if (cats === 'safe' && dogs === 'safe') {
    return <Text style={styles.eduCopy}>{t('toxicity.safeForBoth')}</Text>;
  }

  // Otherwise, two independent lines (CONTEXT.md lock).
  return (
    <>
      <SpeciesLine species="cats" level={cats} plantId={plantId} />
      <SpeciesLine species="dogs" level={dogs} plantId={plantId} />
    </>
  );
}

function SpeciesLine({ species, level, plantId }: { species: 'cats' | 'dogs'; level: ToxLevel; plantId?: string }) {
  const { t } = useTranslation();
  const speciesLabel = t(`toxicity.species.${species}`); // "gatos" / "perros"
  
  if (level === 'safe') return <Text style={styles.eduCopy}>{t('toxicity.safeForSpecies', { species: speciesLabel })}</Text>;
  if (level === 'unknown') return <Text style={styles.eduCopy}>{t('toxicity.unverifiedLatam')}</Text>;
  
  // 'caution' or 'toxic'
  const symptoms = plantId 
    ? (t(`plants:${plantId}.petToxicity.symptoms.${species}`, { returnObjects: true, defaultValue: [] }) as string[])
    : [];
  const headerKey = level === 'toxic' ? 'toxicity.toxicForSpecies' : 'toxicity.cautionForSpecies';
  
  return (
    <View style={styles.subBlock}>
      <Text style={styles.eduCopy}>{t(headerKey, { species: speciesLabel })}</Text>
      {symptoms.length > 0 && (
        <>
          <Text style={styles.subTitle}>{t('toxicity.symptomsLabel')}</Text>
          {symptoms.map((s, i) => <Text key={i} style={styles.bullet}>• {s}</Text>)}
        </>
      )}
    </View>
  );
}
```

### Example 5: OnboardingScreen pet-safe filter integration

```tsx
// src/screens/OnboardingScreen.tsx — additive at L207-230

import { Switch } from 'react-native';
import { isPetSafe } from '../utils/petToxicity';

const [selectedCategory, setSelectedCategory] = useState<PlantCategory | 'all'>('all');
const [petSafeOnly, setPetSafeOnly] = useState(false);  // NEW

const filteredPlants = useMemo(() => {
  let results = selectedCategory === 'all'
    ? PLANT_DATABASE
    : PLANT_DATABASE.filter(p => p.category === selectedCategory);
  if (petSafeOnly) {
    results = results.filter(isPetSafe);  // cats === 'safe' && dogs === 'safe', excludes 'unknown'
  }
  return results;
}, [selectedCategory, petSafeOnly]);

// In JSX, above the category-chip row:
<View style={styles.petSafeRow}>
  <Text style={styles.petSafeLabel}>{t('toxicity.filter.label')}</Text>  {/* "🐾 Solo seguras" */}
  <Switch value={petSafeOnly} onValueChange={setPetSafeOnly} />
</View>

// Empty-state fallback (replaces filtered FlatList when filteredPlants.length === 0 && petSafeOnly):
{petSafeOnly && filteredPlants.length === 0 && (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateText}>
      {t('toxicity.filter.emptyState', {
        suggestion: getCategoryWithPetSafeEntries(selectedCategory)
      })}
    </Text>
  </View>
)}
```

## i18n Architecture

### `common.json` keys (TOX-06)

```json
// src/i18n/locales/es/common.json — ADDITIONS
{
  "toxicity": {
    "toxic": "Tóxica",
    "caution": "Precaución",
    "safe": "Segura",
    "unknown": "No verificada",
    "safeForBoth": "Segura para gatos y perros ✓",
    "safeForSpecies": "Segura para {{species}} ✓",
    "cautionForSpecies": "Precaución para {{species}}.",
    "toxicForSpecies": "Tóxica para {{species}}.",
    "unverifiedLatam": "No verificada para esta especie en LATAM 🤷",
    "symptomsLabel": "Síntomas:",
    "species": {
      "cats": "gatos",
      "dogs": "perros"
    },
    "filter": {
      "label": "🐾 Solo seguras",
      "emptyState": "🌿 No hay plantas seguras para mascotas en esta categoría. Probá con {{suggestion}}."
    },
    "a11y": {
      "cats": {
        "toxic": "Tóxica para gatos",
        "caution": "Precaución para gatos"
      },
      "dogs": {
        "toxic": "Tóxica para perros",
        "caution": "Precaución para perros"
      }
    }
  },
  "plantDetailModal": {
    "pets": "Mascotas"
  }
}
```

EN parity required (locked from CLAUDE.md i18n discipline).

### `plants.json` per-entry symptom shape (TOX-06)

```json
// src/i18n/locales/es/plants.json — per-entry petToxicity.symptoms.{cats|dogs} arrays
{
  "potus": {
    "name": "...",
    "tip": "...",
    "petToxicity": {
      "symptoms": {
        "cats": ["Irritación oral", "Babeo", "Vómitos", "Dificultad para tragar"],
        "dogs": ["Irritación oral", "Babeo", "Vómitos"]
      }
    }
  }
}
```

`react-i18next` consumes via `t('plants:potus.petToxicity.symptoms.cats', { returnObjects: true })` returning `string[]`. Verified pattern: `plants.json` already uses array shapes for `problems[]` (existing precedent at every entry).

### `check-i18n-keys.mjs` extension recipe

Mirror nutrient pattern at L67-74 and EDU-07 pattern at L78-107. Conditional checks:

```javascript
// scripts/check-i18n-keys.mjs — additions after L107
if (entry.petToxicity?.symptoms?.cats) {
  if (!Array.isArray(node.petToxicity?.symptoms?.cats) || node.petToxicity.symptoms.cats.length < 1) {
    errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.cats missing or empty`);
  }
}
if (entry.petToxicity?.symptoms?.dogs) {
  if (!Array.isArray(node.petToxicity?.symptoms?.dogs) || node.petToxicity.symptoms.dogs.length < 1) {
    errors.push(`[${locale}] "${entry.id}".petToxicity.symptoms.dogs missing or empty`);
  }
}
```

## Classification Workflow (PRESCRIPTIVE)

The CONTEXT.md flags this as Claude's discretion. Recommendation locked here:

### Pipeline: human-in-the-loop spreadsheet → catalog merge

**Why not bulk script:** ASPCA's plant list lives at https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants and is HTML. A scrape-script CAN extract entries, but matching ASPCA common names + scientific names to our 118 catalog `scientificName` fields is a fuzzy join — wrong matches are catastrophic for a safety signal. Per-entry script automation introduces the exact non-determinism Pitfall 6 warns against.

**Why not per-entry research during execution:** 118 entries × per-entry web fetch + classification = ~3-4 hours of slow execution with high I/O cost. Spreadsheet is faster AND auditable.

**Recommended pipeline:**

1. **Wave 0 (pre-Plan-01):** Generate a CSV `data/petToxicity.csv` with columns: `id`, `scientificName`, `category` (pre-filled from `PLANT_DATABASE`). Empty columns: `cats_level`, `cats_source_url`, `dogs_level`, `dogs_source_url`, `cats_symptoms` (semicolon-separated), `dogs_symptoms`, `notes`. Initial generation can be a tiny Node script that imports `PLANT_DATABASE` and writes the CSV stub.

2. **Wave 1 (research pass — Claude):** Claude fills the CSV by:
   - For each entry, look up the scientific name on ASPCA's plant list at the canonical URL. Use the per-plant detail page pattern: `https://www.aspca.org/pet-care/animal-poison-control/{cats-plant-list,dogs-plant-list}/{slug}`.
   - Record per-species level + source URL.
   - For LATAM-specific species not in ASPCA → `'unknown'` for both, source URL empty, notes column flags "Not in ASPCA — LATAM-specific."
   - For species where Latin name is in ASPCA → record verbatim levels + symptom list (clinical signs from ASPCA's per-plant detail page).
   - For genus-only matches → mark per Pitfall 6 rule: inherit only when species is in same genus as a definitively-classified ASPCA entry; cite the related entry.

3. **Wave 2 (catalog merge — Claude):** A merge script reads the CSV and emits TypeScript object literals to splice into `plantDatabase.ts`:
   ```typescript
   petToxicity: {
     cats: 'toxic',
     dogs: 'toxic',
     symptoms: { cats: [...], dogs: [...] },
     source: 'https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list/pothos',
   }
   ```
   Symptoms are EN translations that get extracted to `plants.json` as authored ES (voseo) + canonical EN.

4. **Wave 3 (i18n + smoke):** `check:i18n-keys` extension → smoke-phase19 PASS → user manual checkpoint per Phase 13/14/18 precedent.

**CRIT-2 audit compliance:** Source URL on every entry's `petToxicity.source` field IS the audit trail required by the STATE.md lock. Code review can verify by `grep -c "petToxicity.source" src/data/plantDatabase.ts` matching count of classified entries.

**Confidence:** HIGH (workflow, data pipeline). MEDIUM (ASPCA URL slug stability — slugs may change; mitigation: use full URL from search-result, never construct from common name).

### LATAM-specific entries expected to be `'unknown'`

Based on `scientificName` scan of catalog (118 entries) cross-referenced against ASPCA's published list, anticipated `'unknown'` count: ~10-15 entries. Examples:

- `ceibo` (Erythrina crista-galli — Argentina national flower; not in ASPCA)
- `palo borracho` (if added in future) 
- `verbena` (some species in ASPCA, others not — needs per-species check)
- `salvia-ornamental` (Salvia splendens — not in ASPCA's main list)
- Multiple LATAM cultivars

Honest `'unknown'` count is a feature, not a bug. UI is built for it ("No verificada para esta especie en LATAM 🤷").

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI-only toxicity classification | ASPCA-source-required + URL audit per entry | STATE.md CRIT-2 lock (pre-decision) | Phase 19 must cite ASPCA URL per entry; AI extrapolation banned |
| Boolean `petSafe: boolean` field | 4-state `ToxLevel` enum × 2 species | CONTEXT.md decision | Captures `'caution'` (mild GI) distinct from `'toxic'` (severe), and `'unknown'` distinct from `'safe'` |
| Toxicity in catalog detail card (PlantDatabaseCard) | Toxicity on user's own PlantCard + filter on browse | CONTEXT.md OUT-OF-SCOPE for PlantDatabaseCard | Filter does the safety-discovery work in browse; in-app card surfaces post-purchase awareness |
| Phone CTA to vet poison control | NO phone CTA, NO clinic recommendation | REQUIREMENTS TOX-04 lock | Avoids liability; user finds local LATAM vet themselves |

**Deprecated/outdated:**
- `toxicCats: 'toxic' | 'non_toxic' | 'unknown'` (FEATURES.md research draft) — superseded by 4-state `ToxLevel` × 2-species shape.

## Open Questions

1. **AddPlantModal vs OnboardingScreen filter host (HIGH priority for planner)**
   - What we know: CONTEXT.md says "AddPlantModal header"; codebase says OnboardingScreen.tsx (and ExploreScreen behind feature flag).
   - What's unclear: whether the user intended a different UX surface or whether the CONTEXT.md text is a misattribution.
   - **Recommendation:** Plan for OnboardingScreen, surface the discrepancy in PLAN.md, ask user to confirm. ExploreScreen extension can be deferred or co-implemented (small).

2. **Severity color choice — `colors.sunGold` vs new yellow caution token (LOW priority)**
   - What we know: CONTEXT.md flags as Claude's discretion; existing tokens are `colors.sunGold` (#f0c040, used for sun task), `colors.warningBg`/`colors.warningText` (yellow surfaces).
   - What's unclear: whether `sunGold` "caution stripe" reads as caution or as "this plant needs sun" (semantic conflict).
   - **Recommendation:** Use `colors.warningText` (#7a6a2d) — darker yellow-brown, visually clearly cautionary, no semantic overlap with sun task. Verified at `src/theme.ts:30`.

3. **Long-press menu Edit destination after Phase 18 (LOW priority)**
   - What we know: Phase 18 long-press menu has Favorite/Delete/Edit. Edit currently opens `MyPlantDetailModal`.
   - What's unclear: whether toxicity-badge-tap → Mascotas should ALSO be reachable from long-press menu Edit (probably no — separate paths, mood-emoji-tap-opens-HealthDetail precedent).
   - **Recommendation:** Don't expose Mascotas as a long-press menu item. Toxicity badge IS the affordance.

4. **Smoke runner for catalog `petToxicity.source` URL audit (LOW priority)**
   - What we know: STATE.md CRIT-2 lock requires source URL per entry.
   - What's unclear: whether smoke-phase19 should regex `https://(www\.)?aspca\.org/.*` per entry or just check `source` field presence.
   - **Recommendation:** Both — `source` field present-or-empty count + URL pattern match for non-empty source. Empty source is acceptable for `'unknown'` LATAM entries (no source to cite when ASPCA doesn't list the species).

## Validation Architecture

**Nyquist validation: enabled per `.planning/config.json` (`workflow.nyquist_validation: true`).**

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom Node CJS smoke runner (`scripts/smoke-phaseN.cjs`) — NO test runner installed (CLAUDE.md: "No test framework is set up"). Static-analysis-style file-content asserts via `readFileSync` + regex. |
| Config file | `package.json` scripts entry: `"smoke:phase19": "node scripts/smoke-phase19.cjs"` |
| Quick run command | `npm run smoke:phase19` |
| Full suite command | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase19` |
| Phase gate | All three commands exit-0 + Phase 18 sentinels still PASS (cross-phase regression) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOX-01 | `PlantDBEntry` extended with `petToxicity?: { cats, dogs, symptoms?, source? }`; absence = `'unknown'` honored by helper | unit (file-content) | `node scripts/smoke-phase19.cjs` — regex on `src/types/index.ts` for `ToxLevel\|petToxicity` + helper file presence | New (Wave 0) |
| TOX-02 | All 118 entries have `petToxicity` set; cats AND dogs are valid `ToxLevel`; non-`'unknown'` entries cite ASPCA URL | unit (AST/grep) | `node scripts/smoke-phase19.cjs` — `petToxicity:` count == 118; 4-value enum check; URL regex per non-unknown entry | New (Wave 0) |
| TOX-03 | PlantCard imports `PetToxicityBadge`; renders cluster in `headerRight` for `'toxic'`/`'caution'` only | unit (file-content) | smoke-phase19 — regex `PetToxicityBadge` import + JSX presence in `PlantCard.tsx` | New (Wave 0) |
| TOX-04 | Mascotas section present in `MyPlantDetailModal`; ALWAYS rendered; `initialSection` prop wired | unit (file-content) | smoke-phase19 — regex `🐾.*Mascotas|toxicity.species|MascotasContent` + `initialSection` prop in modal source | New (Wave 0) |
| TOX-05 | OnboardingScreen has pet-safe `Switch`; filter combines AND with category; empty-state copy present | unit (file-content) | smoke-phase19 — regex `petSafeOnly\|isPetSafe` in `OnboardingScreen.tsx` | New (Wave 0) |
| TOX-06 | `common.json` toxicity.* keys parity in EN+ES; `plants.json` symptom arrays parity for declared entries | unit (i18n parity) | `npm run check:i18n-keys` (existing, extended in Wave 0 with petToxicity conditional) | Extends existing |
| Cross-phase regression | Phase 18 GAM-04 STRICT sentinels (PlantHealthBadge in modal + index re-export + file presence) still PASS | regression | `npm run smoke:phase18` (already exists) | ✅ existing |
| TypeScript | All new types compile | static | `npx tsc --noEmit` | ✅ existing |

**Manual-only:** Pressable-inside-Gesture-Race tap behavior on iOS device (Pitfall 3). Smoke runner cannot exercise gesture system. Add to Phase 19 device-test backlog mirroring Phase 18 38-item checklist pattern.

### Sampling Rate

- **Per task commit:** `npm run smoke:phase19` (~2-5s)
- **Per wave merge:** `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase19 && npm run smoke:phase18` (~30-60s including i18n parity check)
- **Phase gate:** All four green + manual device-test checklist appended to v1.2 backlog memory before `/gsd:verify-work` (mirrors Phase 18 closure pattern with Option B deferral).

### Wave 0 Gaps

- [ ] `scripts/smoke-phase19.cjs` — covers TOX-01..06 with PASS/SKIP/STRICT three-tier sentinels (mirroring `scripts/smoke-phase18.cjs:1-160`)
- [ ] `package.json` `scripts` entry: `"smoke:phase19": "node scripts/smoke-phase19.cjs"`
- [ ] `.gitignore` entry: `scripts/.tmp-phase19/` (convention even if unused)
- [ ] `data/petToxicity.csv` (or equivalent) — pre-populated with `id`, `scientificName`, `category` for 118 entries; classification cells empty (Wave 1 fills)
- [ ] Stub `src/utils/petToxicity.ts` module (helper exports — test surface for type imports without runtime data)
- [ ] Stub `src/components/PetToxicityBadge.tsx` (skeleton — type-only import target so Wave 0 PASSes the file-existence sentinel)
- [ ] i18n key skeletons in `common.json` (EN + ES) for `toxicity.*` namespace — minimal subset present at Wave 0 to gate `check:i18n-keys` correctness BEFORE catalog data lands

### 4 Validation Pillars (Nyquist gate enumeration)

The Nyquist gate looks for 3-5 pillars. Phase 19's 4:

1. **Data shape integrity** — every entry has `petToxicity` set; cats AND dogs are valid 4-state enum; absence-fallback helper resolves to `'unknown'`. Smoke runner: `grep -c "petToxicity:" src/data/plantDatabase.ts === 118`. Helper unit-style assertion via stub-module compile.

2. **UI render rules** — PlantCard renders badge for `'toxic'`/`'caution'` ONLY (not `'safe'`/`'unknown'`); MyPlantDetailModal Mascotas section ALWAYS visible regardless of state; OnboardingScreen filter excludes `'unknown'` from pet-safe results. Smoke runner: regex on `PlantCard.tsx`, `MyPlantDetailModal.tsx`, `OnboardingScreen.tsx` for the gating logic patterns.

3. **i18n parity (extending Phase 14 EDU-07 pattern)** — `common.json` toxicity.* namespace EN+ES parity (`check:i18n-keys` extension); per-entry symptom arrays in `plants.json` conditional parity (only required when entry declares `petToxicity.symptoms.{cats|dogs}`); voseo discipline in ES copy (audit `t()` keys for non-voseo verbs).

4. **CRIT-2 audit trail** — every non-`'unknown'` entry's `petToxicity.source` field cites an ASPCA URL. Smoke runner: regex `https://(www\.)?aspca\.org` count matches non-`'unknown'` count.

(Optional 5th pillar if planner wants tighter gate: **cross-phase regression** — Phase 18 STRICT GAM-04 sentinels remain PASS post-Phase-19. Already mandatory via `npm run smoke:phase18` in full-suite command — explicit listing as 5th pillar makes the gate self-documenting.)

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` (existing milestone-level research) — pet-toxicity stack notes lines 76-92, 248, 270-272: ASPCA canonical URL pattern, manual classification feasibility, `petToxicity` field shape recommendation.
- `.planning/research/FEATURES.md` (existing milestone-level research) — pet-toxicity feature notes lines 107-141: ASPCA dataset structure, badge UX patterns, do/don't list (no phone CTA, no comprehensive coverage claims).
- `.planning/STATE.md` line 96 — CRIT-2 lock: ASPCA-only, source URL per entry.
- `.planning/REQUIREMENTS.md` lines 78-85 — TOX-01..06 verbatim spec.
- `src/components/PlantCard.tsx:1-475` — exact `headerRight` slot structure, `Gesture.Race` composition (Phase 18 lock), theme token usage precedent (`colors.dangerText` for red surfaces at L358).
- `src/components/MyPlantDetailModal.tsx:1-712` — Phase 14 4-section model, `EducationalSection` consumer pattern, plain `<ScrollView>` (not Animated) at L193.
- `src/screens/OnboardingScreen.tsx:207-230` — actual MVP catalog browse with category filter (not AddPlantModal).
- `scripts/check-i18n-keys.mjs:1-117` — conditional validation pattern for nutrient/EDU-07 fields, exact extension pattern for petToxicity.symptoms.
- `scripts/smoke-phase18.cjs:1-160` — CJS smoke runner harness, three-tier discipline (PASS-always / SKIP-then-PASS / PASS-or-FAIL).
- ASPCA Toxic and Non-Toxic Plants list at https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants — verified URL pattern per-plant: `/{plant-slug}` appended.
- `src/theme.ts:1-159` — `colors.dangerText`, `colors.sunGold`, `colors.warningText`, `hitSlop` exports verified.

### Secondary (MEDIUM confidence)

- React Native `<ScrollView>.scrollTo({y, animated})` API (RN docs) — programmatic scroll-to-position; standard since RN 0.30+.
- React-i18next `t(key, { returnObjects: true })` — array-shape key consumption; verified pattern in existing `plants.json` `problems[]` consumption.
- RNGH 2.28 `GestureDetector` + child `Pressable` coexistence — pattern documented in RNGH issue threads; iOS edge cases require device verification (Pitfall 3).

### Tertiary (LOW confidence — flagged for device verification)

- Exact race condition between `Pressable.onPress` and `Gesture.Pan().activeOffsetX([-15,15])` on iOS 17+. Documented as Pitfall 3 + smoke-phase19 manual checklist item.
- ASPCA URL slug stability over time (slugs MAY change in their CMS migrations). Mitigation: store full URL per entry, never reconstruct.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure already installed (Phase 13); Phase 19 is content + JSX
- Architecture: HIGH — Phase 14 EDU-02 + Phase 18 PlantCard precedents map 1:1
- Pitfalls: MEDIUM-HIGH — 7 pitfalls identified; Pitfalls 3 + 6 are MEDIUM (require device verification or content judgment); rest HIGH
- Classification workflow: MEDIUM — pipeline is sound but ASPCA scrape vs human-loop has trade-offs only confirmable in execution
- Validation pillars: HIGH — 4 pillars track 1:1 to Phase 19 requirements; Phase 18 smoke runner template is proven

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 days — stable domain; ASPCA list is human-curated, not API-versioned; no major RN/RNGH releases expected in window)

---

*Phase: 19-pet-toxicity*
*Research authored: 2026-05-08*
