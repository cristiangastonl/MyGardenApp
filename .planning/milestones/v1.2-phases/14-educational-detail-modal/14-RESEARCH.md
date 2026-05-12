# Phase 14: Educational Detail Modal — Research

**Researched:** 2026-05-03
**Domain:** React Native modal restructuring + catalog data extension + i18n authoring at scale + Reanimated v4 collapse animations + storage-mutation hardening
**Confidence:** HIGH (all decisions locked in CONTEXT.md; codebase already on Reanimated v4 with a working reference pattern; CRIT-1 deep-merge precedent fully documented)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Modal structure (sheet vs fullscreen):**
- Keep the existing fullscreen `<Modal>` shell from `src/components/MyPlantDetailModal.tsx`. Phase 13's `BottomSheetModalProvider` stays unused for this phase — Phase 21's journal quick-add will be the first real BottomSheet caller. Lower-risk evolution path; reuses 495 LOC of working code.
- Replace the existing "Recomendaciones" card with the 4 new educational sections (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes). The recommendations card is deleted, not preserved alongside.
- Fold the existing "Active Problems" list into "¿Qué hacer?" as a top sub-block. The standalone `<ActiveProblemsSection />` component goes away from the detail modal (it may stay used elsewhere; planner decides).
- Preserve photo album + diagnosis history + delete button below the 4 new sections (existing real estate stays for power users).
- **Final section order in the ScrollView:** Header (title, close X, plant name, scientific name) → Photo + health badge → 🌿 ¿Qué hacer? (NEW — replaces Recomendaciones, includes folded Active Problems) → 🏠 ¿Dónde ponerla? (NEW) → ℹ️ ¿Por qué? (NEW — collapsable per REQUIREMENTS, defaults to expanded) → ⚙️ Tus ajustes (NEW) → Photo album → Diagnosis history → Delete (snap to bottom).

**Visual hierarchy + section styling:**
- Equal weight across all 4 sections — no section visually dominates. All 4 share the same card style (theme.ts: `borderRadius.lg`, `shadows.sm`, `card` background). No accent borders, no size variations.
- Leading emoji as visual anchor, locked: `🌿 ¿Qué hacer?` / `🏠 ¿Dónde ponerla?` / `ℹ️ ¿Por qué?` / `⚙️ Tus ajustes`. The emojis are part of the section title, not standalone icons.
- Typography hierarchy within each section: title (`fonts.title` PlayfairDisplay_700Bold, ~18-20px), section copy (`fonts.body` DMSans_400Regular). Sub-block titles (e.g., "Recomendado:") use `fonts.bodySemiBold` DMSans_600SemiBold.
- Spacing between sections uses `spacing.md` between section cards.

**Section animations:**
- Use Reanimated v4 worklets for the collapse/expand animation (height + opacity) — runs on UI thread, no JS jank. ~250ms with `Easing.inOut(Easing.ease)`. Mirrors the `withTiming` + `useSharedValue` pattern from `src/components/Skeleton.tsx`.
- Animate: section content height (0 → measured) + opacity (0 → 1) on expand; reverse on collapse. The section title row (emoji + label + chevron indicator) is always rendered.
- Chevron rotation: chevron points down when expanded, right when collapsed. 180° rotation animation tied to the same shared value.

**Default collapsed/expanded state:**
- All 4 sections expanded by default when the modal opens. User sees the full educational content immediately on first interaction.
- The "collapsable" requirement on `¿Por qué?` (REQUIREMENTS line 39) is interpreted as "MUST support collapse," NOT "MUST start collapsed." All 4 sections are tap-to-collapse capable; they all default to expanded.

**Custom-plant fallback (no catalog match):**
- All 4 sections render for ALL plants, including user-created custom plants with no `databaseId`.
- For plants where lookup returns null:
  - **¿Qué hacer?** renders only the user's actual care state — no catalog-sourced "fixed" or "soilCheck" copy.
  - **¿Dónde ponerla?** shows placeholder: "Esta planta no está en nuestro catálogo todavía." (or EN equivalent). NO aggressive CTA to identify the plant.
  - **¿Por qué?** is hidden entirely for custom plants (no rationale to surface). Section header is also hidden.
  - **Tus ajustes** works fully — purely user-data-driven.

**Partial catalog data (sub-block visibility):**
- Sub-blocks within sections hide gracefully when their backing field is missing. Section headers stay visible if at least ONE sub-block has data.
- `whyRationale` missing → ENTIRE ¿Por qué? section header + content is hidden (zero-content section disappears, special case for ¿Por qué? since it has only ONE backing field).

**Collapse-state persistence:**
- Per-modal-session (resets every time the modal closes). Implementation: section-collapse state lives in component-local `useState`, NOT in AsyncStorage / `useStorage`.

**"Tus ajustes" override-detection:**
- Trigger: when user's stored value differs from the catalog recommendation for the matching `PlantDBEntry`.
- Copy: *"Diferente a la recomendación para esta especie. ¿Querés ajustar?"* (locked from REQUIREMENTS.md line 43).
- Behavior nuances:
  - Inline within `Tus ajustes` next to the differing field, NOT a top-of-section banner.
  - Non-pushy: small text, theme color (probably `textSecondary` or `bgPrimary` accent).
  - The `¿Querés ajustar?` is informational — does NOT need to be a tappable CTA in Phase 14.

**Out of scope:** real bottom-sheet content for sections (Phase 21 first); fertilization detail (Phase 16/20); pet-toxicity badging (Phase 19); per-plant collapse persistence; "Ajustar"-style edit-flow rebuilds (deferred).

### Claude's Discretion
- **640-string content authoring workflow.** Per-plant Claude prompts vs bulk template pass; where strings live (`plants.json` with 5 new keys per entry vs new `plant-edu.json`); what "horticultural review" means in practice. Quality bar: voseo-correct ES, no exclamation marks unless emphasizing, follows existing tip/description tone in `plants.json`.
- **Override note frequency + dismissibility.** Always-on vs first-detection vs persistent-with-dismiss.
- **Override note "Ajustar" CTA wiring.** Tappable inline link to edit-mode for that field, or stays informational. Both acceptable.
- **Field selection for override-detection.** Probably `lightLevel`, `waterSchedule.warm`, `waterSchedule.cold` to start.
- **`¿Por qué?` collapse default.** Defaults to expanded, but user can collapse. Default-collapse only with brief justification.
- **Sub-block presentation for `placementAlternatives` array.** Bullet list / comma-separated inline / chip badges.
- **Animation timing & easing curves.** ~250ms `Easing.inOut(Easing.ease)` is target; ±50ms acceptable.

### Deferred Ideas (OUT OF SCOPE)
- Per-plant collapse persistence (separate phase / backlog)
- Stacked bottom-sheet detail UI (Phase 21 first BottomSheet caller)
- "Ajustar" CTA full edit-mode wiring (informational-only is locked baseline)
- Override frequency UI variants (post-launch backlog if always-on proves noisy)
- Identification CTA inside custom-plant fallback (explicitly rejected)
- `<ActiveProblemsSection />` deprecation — planner decides whether the standalone component is removed entirely or preserved
- Bulk catalog content review pipeline (own tooling phase)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDU-01 | `MyPlantDetailModal` restructured into 4 sections | §Architecture Patterns — Pattern 1 (4-Section ScrollView Restructure); §Code Examples — Section card with animated collapse |
| EDU-02 | `PlantDBEntry` extended with 5 new optional fields (`careAction.{fixed?,soilCheck?}`, `placementRecommended`, `placementAlternatives[]`, `placementAvoid`, `whyRationale`); additive, no schema bump | §Standard Stack — TypeScript discriminator pattern; §Architecture Patterns — Pattern 2 (Additive Catalog Field Extension); confirms locked CONTEXT decision |
| EDU-03 | All 64 catalog entries gain content for 5 new fields × EN/ES voseo (~640 strings) | §Architecture Patterns — Pattern 3 (Authoring workflow options); §Common Pitfalls — voseo drift (MOD-2 referenced); §Don't Hand-Roll — JSON locale files (NOT a database) |
| EDU-04 | `IdentificationResults` LightLevelPicker pre-selects species' recommended `lightLevel` | §Code Examples — Pre-select with `selectedPlant.lightLevel ?? 'bright_indirect'` (already in IdentificationResults.tsx:42); just needs catalog-resolution wiring |
| EDU-05 | "Tus ajustes" shows soft override note when user value differs from catalog | §Architecture Patterns — Pattern 4 (Override-detection comparator); §Code Examples — Override note rendering; §Common Pitfalls — judgmental tone (MOD-1) |
| EDU-06 | `useStorage.updatePlant` deep-merge guard prevents catalog-source values from silently overwriting user customizations | §Don't Hand-Roll — guarded merge; §Common Pitfalls — CRIT-1 deep-merge precedent; §Code Examples — protected fields list + opt-in flag |
| EDU-07 | `check-i18n-keys.mjs` extended to validate the 5 new fields when present on entry | §Code Examples — nutrient-conditional pattern at line 66 is the template; §Architecture Patterns — Pattern 5 (Conditional validator extension) |
</phase_requirements>

## Summary

Phase 14 is a **UI restructure + catalog data extension + i18n authoring + storage-mutation hardening** phase, all locked structurally by CONTEXT.md. The technical surface is small and well-trodden:

1. The fullscreen `<Modal>` shell stays — no new framework. Sections are vertically-stacked theme cards inside the existing ScrollView.
2. Reanimated v4 is already installed (Phase 13: `~4.1.1`) and there's a working reference (`src/components/Skeleton.tsx`) using exactly the API the accordion pattern needs (`useSharedValue` + `withTiming` + `useAnimatedStyle`).
3. `PlantDBEntry` schema extension is purely additive — same precedent as v1.1 `climateOverride` and `waterSchedule` (no schema-version bump needed for additive optional fields).
4. The CRIT-1 deep-merge guard pattern is **fully designed** in `.planning/research/PITFALLS.md` (CRIT-1 lines 14-34) and on the Project Decisions table (STATE.md line 57). It's a "implement the locked design" task, not a research question.
5. `getTranslatedPlant()` (plantDatabase.ts:1628) already does i18n indirection for `name/tip/description/problems/nutrients` — the 5 new fields plug into the same template.
6. The i18n validator (`scripts/check-i18n-keys.mjs:66`) already has the conditional-on-entry-declares-the-field pattern (nutrients block); 5 mirrored conditional checks.

The dominant **risk** in this phase is content-authoring quality drift across 640 strings (MOD-2 in PITFALLS.md), not technical complexity. Voseo discipline + horticultural correctness for ES strings is the bottleneck.

**Primary recommendation:** Plan as 4 waves — (W0) Wave 0 scaffold + smoke runner, (W1) schema extension + getTranslatedPlant + i18n validator + deep-merge guard (foundation, no catalog content yet), (W2) modal restructure + animations + override detection + LightLevelPicker pre-select (UI surface, gated on W1 + bare-minimum stub strings for 1-2 entries), (W3) catalog content authoring 640 strings (parallelizable per-category batch). Authoring workflow: extend `plants.json` with 5 keys per entry (NOT a new file), AI-drafted in batches per category, voseo linter run after each batch.

## Standard Stack

### Core (already installed; nothing new)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-reanimated` | `~4.1.1` | Section collapse/expand worklet animation | Phase 13 INFRA-01 lock; Skeleton.tsx is the reference impl |
| `react-i18next` | `^16.5.4` | All translatable strings (section labels + 640 catalog strings) | Project lock; `t()` discipline enforced everywhere |
| `expo-linear-gradient` | `~15.0.8` | Already used by Skeleton; not needed for this phase but available | — |
| `expo-haptics` | `~15.0.8` | Optional: `triggerHaptic('selection')` on section-toggle for tactile feedback | Phase 13 INFRA wraps it via `src/utils/haptics.ts` |

### Supporting (existing utilities being extended)

| Module | Purpose | Phase 14 change |
|--------|---------|-----------------|
| `src/data/plantDatabase.ts` `getTranslatedPlant()` (line 1628) | i18n indirection for catalog content | Extend return shape to surface 5 new fields when present |
| `src/data/plantDatabase.ts` `getCatalogEntry()` (line 1691) | Canonical lookup with alias fallback | No change — already correct |
| `src/utils/plantInfo.ts` `findDatabaseEntry()` | Fuzzy fallback for plants without `databaseId` | No change — used as defensive 3-rung fallback |
| `src/hooks/useStorage.tsx` `updatePlant()` (line 378) | Plant mutation with alias-rewrite | Add deep-merge guard for protected user-custom fields (CRIT-1) |
| `scripts/check-i18n-keys.mjs` (line 66) | Pre-submit i18n validator | Extend with 5 conditional checks mirroring nutrient pattern |
| `src/utils/haptics.ts` (Phase 13) | `triggerHaptic('selection' \| 'success' \| ...)` wrapper | Optional consumer; planner discretion |
| `src/components/Skeleton.tsx` (Phase 13, 53 LOC) | Reanimated v4 reference pattern | Read-only reference for accordion section pattern |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Why rejected |
|------------|-----------|--------------|
| Fullscreen `<Modal>` | `@gorhom/bottom-sheet` BottomSheetModal | Locked: Phase 21 (journal quick-add) is first BottomSheet caller. Lower-risk evolution. |
| 5 keys per entry in `plants.json` | New `plant-edu.json` namespace | Existing `getTranslatedPlant()` already loads from `plants` namespace; extending the same file is one less i18next config change. |
| Reanimated v4 `Animated.View` height transition | `LayoutAnimation` from RN core | Reanimated v4 worklet runs on UI thread (no JS jank); LayoutAnimation has known Android-iOS inconsistencies and conflicts with FlatList. Project lock from Phase 13: Reanimated v4 is the engine. |
| `useState`-driven inline content rendering with `display: none` | Reanimated `useAnimatedStyle` collapsible | Locked in CONTEXT: Reanimated v4 worklets per Skeleton pattern. |

**Installation:** None. All 4 native deps installed in Phase 13 (INFRA-01). Phase 14 is JavaScript + JSON only.

## Architecture Patterns

### Recommended Project Structure (deltas only)

```
src/
├── components/
│   ├── MyPlantDetailModal.tsx        # MODIFIED — restructured to 4 sections
│   ├── plant-detail/                 # NEW (suggested) — section sub-components
│   │   ├── EducationalSection.tsx    # NEW — generic collapsible card wrapper
│   │   ├── WhatToDoSection.tsx       # NEW — 🌿 (folds ActiveProblems)
│   │   ├── WhereToPlaceSection.tsx   # NEW — 🏠
│   │   ├── WhySection.tsx            # NEW — ℹ️ (single backing field, special hide rule)
│   │   └── YourSettingsSection.tsx   # NEW — ⚙️ (override-detection logic)
│   └── Skeleton.tsx                  # UNCHANGED — reference pattern only
├── data/
│   └── plantDatabase.ts              # MODIFIED — getTranslatedPlant extended; entries gain 5 fields each
├── hooks/
│   └── useStorage.tsx                # MODIFIED — updatePlant gains deep-merge guard
├── i18n/locales/
│   ├── en/
│   │   ├── plants.json               # MODIFIED — 5 keys × 64 entries = 320 EN strings added
│   │   └── common.json               # MODIFIED — 4 section labels + override note copy
│   └── es/
│       ├── plants.json               # MODIFIED — 5 keys × 64 entries = 320 ES voseo strings added
│       └── common.json               # MODIFIED — 4 section labels + override note copy
├── types/
│   └── index.ts                      # MODIFIED — PlantDBEntry gains 5 optional fields
└── utils/
    └── overrideDetection.ts          # NEW (suggested) — pure function: compareUserVsCatalog(plant, entry)
scripts/
└── check-i18n-keys.mjs               # MODIFIED — 5 conditional checks added
```

The component split is a **suggestion** — planner may keep all 4 sections inline in `MyPlantDetailModal.tsx` if a single-file refactor is simpler. The locked decision (CONTEXT.md) is the section structure, not the file decomposition.

### Pattern 1: 4-Section ScrollView Restructure

**What:** Replace existing "Recomendaciones" + "Active Problems" cards in `MyPlantDetailModal.tsx` with 4 new equal-weight section cards inside the existing `<ScrollView contentContainerStyle={styles.scrollContent}>`.

**When to use:** This is the entire EDU-01 deliverable.

**Existing slot to replace** (`MyPlantDetailModal.tsx:217-237`):
```tsx
{/* Nutrients */}
{dbEntry?.nutrients && ( ... existing card ... )}

{/* Active Problems */}
<ActiveProblemsSection ... />
```

**New slot pattern** (after the `<View style={styles.infoRow}>` pills + diagnose button, before `<PlantPhotoAlbum>`):
```tsx
{/* 🌿 ¿Qué hacer? — folds Active Problems + careAction.fixed/soilCheck */}
<EducationalSection
  emoji="🌿"
  title={t('plantDetailModal.whatToDo')}
  defaultExpanded
>
  <WhatToDoContent
    plant={plant}
    dbEntry={dbEntry}
    activeProblems={allPlantDiagnoses}
    onPressDiagnosis={(d) => { setResumeDiagnosis(d); setShowDiagnosis(true); }}
  />
</EducationalSection>

{/* 🏠 ¿Dónde ponerla? — placementRecommended/Alternatives/Avoid */}
<EducationalSection emoji="🏠" title={t('plantDetailModal.whereToPlace')} defaultExpanded>
  <WhereToPlaceContent dbEntry={dbEntry} />
</EducationalSection>

{/* ℹ️ ¿Por qué? — whyRationale only; SKIP entire section if absent */}
{dbEntry?.whyRationale && (
  <EducationalSection emoji="ℹ️" title={t('plantDetailModal.why')} defaultExpanded>
    <Text style={...}>{dbEntry.whyRationale}</Text>
  </EducationalSection>
)}

{/* ⚙️ Tus ajustes — user data + override notes; works for ALL plants */}
<EducationalSection emoji="⚙️" title={t('plantDetailModal.yourSettings')} defaultExpanded>
  <YourSettingsContent plant={plant} dbEntry={dbEntry} onAdjust={...} />
</EducationalSection>
```

### Pattern 2: Additive Catalog Field Extension (PlantDBEntry)

**What:** Extend `PlantDBEntry` (`src/types/index.ts:162`) with 5 new **optional** fields. Entries gain fields gradually; absence is graceful (sub-block hides).

```ts
// src/types/index.ts — additions to PlantDBEntry interface
export interface CareAction {
  /** Fixed-cadence care copy (e.g., "Regá cada 7 días en temporada cálida"). */
  fixed?: string;
  /** Soil-check care copy for waterMode === 'soil_check' plants (e.g., "Tocá la tierra: si los primeros 2cm están secos, regá."). */
  soilCheck?: string;
}

export interface PlantDBEntry {
  // ...existing fields (unchanged)...

  // ─── v1.2 Phase 14 (EDU-02) educational fields ───
  /** Action card copy for "¿Qué hacer?" section. Both sub-fields optional. */
  careAction?: CareAction;
  /** Single recommended placement description for "¿Dónde ponerla?". */
  placementRecommended?: string;
  /** Acceptable alternative placements (rendered as bullets/chips). */
  placementAlternatives?: string[];
  /** Single line of placement to avoid (e.g., "Evitá corrientes de aire frío"). */
  placementAvoid?: string;
  /** Horticultural rationale for "¿Por qué?" section. Hides ENTIRE section if absent. */
  whyRationale?: string;
}
```

**Migration:** None required. All fields optional; `schemaVersion` stays at `1` for the local-data envelope (catalog isn't versioned). This matches v1.1's additive precedent (`waterSchedule?`, `lightLevel?`, `waterMode?`).

### Pattern 3: i18n authoring workflow (recommended)

**Decision: extend `plants.json`, do NOT create `plant-edu.json`.**

Rationale:
- `getTranslatedPlant()` already loads `plants` namespace — no i18next config change.
- Single file per locale to validate (mirrors current `check-i18n-keys.mjs` shape).
- Existing per-entry block is the natural home for related strings.

**Per-entry shape (after Phase 14):**
```json
{
  "potus": {
    "name": "Potus",
    "tip": "Ideal para principiantes. Tolera poca luz y olvidos de riego.",
    "description": "El Potus es una de las plantas de interior más populares...",
    "problems": [ ... existing ... ],
    "nutrients": { ... existing ... },

    "careAction": {
      "fixed": "Regá cada 7 días en temporada cálida; cada 14 días en frío.",
      "soilCheck": "Tocá los primeros 2cm de tierra: si están secos, regá."
    },
    "placementRecommended": "Cerca de una ventana con luz indirecta brillante.",
    "placementAlternatives": [
      "A 1-2 metros de una ventana sur (hemisferio sur)",
      "Baño con luz natural (le gusta la humedad)"
    ],
    "placementAvoid": "Sol directo del mediodía — quema las hojas.",
    "whyRationale": "Es una planta tropical de sotobosque: en su hábitat crece bajo el dosel, así que necesita luz tamizada y humedad constante. Su tolerancia a la sombra viene de su adaptación al piso de la selva."
  }
}
```

**Authoring workflow (recommended; Claude's discretion to refine):**

1. **Stub-first:** Author all 64 entries with placeholder strings (1-2 sentence drafts) BEFORE wave 2 starts so the validator passes and the UI can be developed against real (if rough) data.
2. **Per-category batch authoring:** Group plants by `category` (interior / exterior / aromaticas / huerta / frutales / suculentas) — within a category, plants share placement, care cadence, and rationale shape, so prompts can be templated.
3. **Voseo linter (suggested):** small grep script scans new ES strings for Castilian conjugation patterns (` riega `, ` saca `, ` pon `, ` ten `, ` haz `) — fail batch if any found. Per PITFALLS.md MOD-2 lock.
4. **Quality bar per field:**
   - `careAction.fixed`: ≤120 chars, imperative voseo (ES), present-tense (EN). One sentence.
   - `careAction.soilCheck`: ≤140 chars (instructional). Same voseo discipline.
   - `placementRecommended`: ≤100 chars. One sentence.
   - `placementAlternatives`: 1-3 bullets, ≤80 chars each.
   - `placementAvoid`: ≤80 chars. One imperative.
   - `whyRationale`: 100-220 chars. Cite a specific physiology mechanism (photoperiod, transpiration, sotobosque/canopy origin, drought adaptation, etc.) — NOT generic "porque las plantas necesitan agua."
5. **Pre-merge gate:** `npm run check:i18n-keys` passes (extended with 5 conditional checks per Pattern 5).

**Alternative considered:** Generate strings with a pre-build script from a single CSV. Rejected because the `t()` indirection through `plants.json` is already the i18n contract; a CSV adds a step without removing one.

### Pattern 4: Override-detection comparator (EDU-05)

**What:** Pure function `compareUserVsCatalog(plant, entry)` returns a list of differing fields. UI renders the soft note inline next to each differing field in "Tus ajustes."

```ts
// src/utils/overrideDetection.ts (suggested location)
export type OverrideField = 'lightLevel' | 'waterScheduleWarm' | 'waterScheduleCold';

export interface OverrideResult {
  field: OverrideField;
  userValue: string | number;
  catalogValue: string | number;
}

export function compareUserVsCatalog(
  plant: Plant,
  entry: PlantDBEntry | null
): OverrideResult[] {
  if (!entry) return [];
  const out: OverrideResult[] = [];

  if (plant.lightLevel && entry.lightLevel && plant.lightLevel !== entry.lightLevel) {
    out.push({ field: 'lightLevel', userValue: plant.lightLevel, catalogValue: entry.lightLevel });
  }
  if (plant.waterSchedule?.warm != null && entry.waterSchedule?.warm != null
      && plant.waterSchedule.warm !== entry.waterSchedule.warm) {
    out.push({ field: 'waterScheduleWarm', userValue: plant.waterSchedule.warm, catalogValue: entry.waterSchedule.warm });
  }
  if (plant.waterSchedule?.cold != null && entry.waterSchedule?.cold != null
      && plant.waterSchedule.cold !== entry.waterSchedule.cold) {
    out.push({ field: 'waterScheduleCold', userValue: plant.waterSchedule.cold, catalogValue: entry.waterSchedule.cold });
  }
  return out;
}
```

**Field selection (planner discretion within CONTEXT guardrails):** start with `lightLevel`, `waterSchedule.warm`, `waterSchedule.cold`. Skip `tempMin/tempMax/humidity` — they're climate-driven, not user-set. Override note for any of those would be misleading.

**Render placement:** inline within "Tus ajustes" section next to each differing field row. Copy from REQUIREMENTS line 43 (locked): "Diferente a la recomendación para esta especie. ¿Querés ajustar?"

### Pattern 5: Conditional i18n validator extension (EDU-07)

**Template (existing, line 66):**
```js
// nutrients: only required if entry declares nutrients
if (entry.nutrients) {
  if (!node.nutrients || typeof node.nutrients !== 'object') {
    errors.push(`[${locale}] "${entry.id}".nutrients missing (entry declares nutrients)`);
  } else {
    if (!node.nutrients.type) errors.push(`[${locale}] "${entry.id}".nutrients.type missing`);
    if (!node.nutrients.homemade) errors.push(`[${locale}] "${entry.id}".nutrients.homemade missing`);
  }
}
```

**Mirror for 5 new fields:**
```js
// careAction: only required if entry declares careAction (sub-fields independently conditional)
if (entry.careAction) {
  if (!node.careAction || typeof node.careAction !== 'object') {
    errors.push(`[${locale}] "${entry.id}".careAction missing (entry declares careAction)`);
  } else {
    if (entry.careAction.fixed && !node.careAction.fixed) {
      errors.push(`[${locale}] "${entry.id}".careAction.fixed missing`);
    }
    if (entry.careAction.soilCheck && !node.careAction.soilCheck) {
      errors.push(`[${locale}] "${entry.id}".careAction.soilCheck missing`);
    }
  }
}
if (entry.placementRecommended && !node.placementRecommended) {
  errors.push(`[${locale}] "${entry.id}".placementRecommended missing`);
}
if (entry.placementAlternatives) {
  if (!Array.isArray(node.placementAlternatives) || node.placementAlternatives.length < 1) {
    errors.push(`[${locale}] "${entry.id}".placementAlternatives missing or empty`);
  }
}
if (entry.placementAvoid && !node.placementAvoid) {
  errors.push(`[${locale}] "${entry.id}".placementAvoid missing`);
}
if (entry.whyRationale && !node.whyRationale) {
  errors.push(`[${locale}] "${entry.id}".whyRationale missing`);
}
```

### Pattern 6: Reanimated v4 collapsible section (Accordion pattern)

**Adapted from official Reanimated docs accordion example + project's Skeleton.tsx:**

```tsx
// src/components/plant-detail/EducationalSection.tsx (suggested)
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';

const COLLAPSE_DURATION = 250; // CONTEXT lock: ~250ms

interface Props {
  emoji: string;
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function EducationalSection({ emoji, title, defaultExpanded = true, children }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const measuredHeight = useSharedValue(0);
  const open = useSharedValue(defaultExpanded ? 1 : 0);

  const derivedHeight = useDerivedValue(() =>
    withTiming(measuredHeight.value * open.value, {
      duration: COLLAPSE_DURATION,
      easing: Easing.inOut(Easing.ease),
    })
  );
  const opacity = useDerivedValue(() =>
    withTiming(open.value, { duration: COLLAPSE_DURATION })
  );
  const chevronRotation = useDerivedValue(() =>
    withTiming(open.value * 90, { duration: COLLAPSE_DURATION })
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    opacity: opacity.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    open.value = next ? 1 : 0;
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={toggle} style={styles.titleRow} accessibilityRole="button">
        <Text style={styles.title}>{emoji} {title}</Text>
        <Animated.Text style={[styles.chevron, chevronStyle]}>›</Animated.Text>
      </Pressable>
      <Animated.View style={[styles.bodyClip, bodyStyle]}>
        {/* The hidden measurement layer is positioned absolute and reports height once. */}
        <View
          style={styles.bodyContent}
          onLayout={(e) => {
            // Set once; layout-only measurement keeps animation cheap.
            if (measuredHeight.value === 0) {
              measuredHeight.value = e.nativeEvent.layout.height;
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  bodyContent: {
    paddingTop: spacing.md,
  },
});
```

**Caveat:** The classic Reanimated accordion uses an off-screen "measurer" + position-absolute layer to capture the unconstrained height. The simplified version above measures lazily on first render (works because all sections start expanded). Planner can adopt the more robust off-screen measure pattern from the official docs accordion example if simpler approach has glitches on rapid toggle.

### Anti-Patterns to Avoid

- **Don't store collapse state in `useStorage` or AsyncStorage.** Locked: per-modal-session state. `useState` is correct.
- **Don't call `updatePlant(id, { waterSchedule: catalogEntry.waterSchedule })` from any new picker.** That is exactly the CRIT-1 path. Pickers must pass user-touched values, not catalog defaults masquerading as user input.
- **Don't add a `data:image/jpeg;base64,...` URI anywhere in this phase.** Out of scope (Phase 21 territory) — but the discipline applies.
- **Don't render the override note as a top-of-section banner** — locked inline-next-to-field (CONTEXT.md).
- **Don't add an "Identify this plant" CTA to the custom-plant fallback** — explicitly rejected (CONTEXT.md `<deferred>`).
- **Don't introduce a new icon library or visual hierarchy** — emoji anchors and existing theme tokens only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section collapse animation | Custom `Animated.View` height interpolation on JS thread | Reanimated v4 worklets per Skeleton.tsx pattern | Phase 13 lock; UI thread = no jank |
| i18n string resolution per entry | Direct dictionary lookup in components | `getTranslatedPlant()` extension (exists, 1628) | Single SSOT; avoids drift between callers |
| Catalog id resolution | Re-implement fuzzy matching | `getCatalogEntry(databaseId)` → `findDatabaseEntry(plant)` (3-rung fallback already in MyPlantDetailModal:79-84) | CAT-04 lock from Phase 8 |
| Deep merge of plant updates | Custom recursive merge in every call site | Single guard inside `updatePlant` that filters protected fields | One choke-point; easy smoke test |
| Voseo discipline check | Manual code review only | Small grep linter script + checklist | MOD-2 lock; eyes get tired by batch 3 |
| i18n key parity | Manual file diff | Existing `check-i18n-keys.mjs` extended with 5 conditional checks | Pattern is in the file; line 66 is the template |
| Override-detection rendering | Per-section ad-hoc string comparisons | Pure `compareUserVsCatalog()` returns OverrideResult[] | Testable; reusable; symmetry across fields |

**Key insight:** Almost everything Phase 14 needs already exists in the codebase as a working pattern. The phase is **mostly composition**, not invention. The only "novel" code is (a) `EducationalSection` accordion wrapper (~80 LOC, pattern from Reanimated docs), (b) `compareUserVsCatalog` pure function (~30 LOC), (c) `updatePlant` deep-merge guard (~15 LOC additional inside the existing function). Everything else is incremental: 5 fields added to a type, 5 conditional branches in the validator, 4 new section components composing existing helpers, 640 strings in 2 JSON files.

## Common Pitfalls

### Pitfall 1: CRIT-1 — Recommendation silently overwrites user's deliberate custom values

**What goes wrong:** A picker passes `catalogEntry.waterSchedule` to `updatePlant(id, { waterSchedule: ... })`; user's prior custom `{ warm: 5, cold: 10 }` is shallow-merged away to `{ warm: 7, cold: 14 }`. User doesn't notice for days; their plant is now under-watered for their hot apartment.

**Why it happens:** `updatePlant` (`useStorage.tsx:378`) does shallow merge `{ ...p, ...normalizedUpdates }`. There's no signal of "did the user explicitly choose this value, or is it a catalog echo?"

**How to avoid (locked design from PITFALLS.md CRIT-1 + STATE.md decisions):**

1. **Never pass `catalogEntry.X` directly into `updatePlant`** from any new picker added in Phase 14. Pickers render catalog values as visual defaults; the saved value comes from the picker's own state (which == catalog default if user hasn't changed anything; the issue is auto-pushing without user intent).

2. **Add a deep-merge guard to `updatePlant`:**

```ts
// src/hooks/useStorage.tsx — modified updatePlant (additions in comments)
const PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode'] as const;

interface UpdatePlantOptions {
  /** Pass `true` ONLY when the caller is a user-edit flow (picker save, settings save).
   *  Catalog-source code paths (auto-population from catalog) MUST omit / pass false. */
  fromUserEdit?: boolean;
}

const updatePlant = useCallback((
  id: string,
  updates: Partial<Plant>,
  options: UpdatePlantOptions = {}
) => {
  const normalizedUpdates = { ...updates };

  // Existing alias-rewrite (Phase 8 CAT-05) ...

  // NEW: Phase 14 EDU-06 deep-merge guard.
  // If the caller is NOT a user-edit, strip protected fields that are already set on the plant.
  if (!options.fromUserEdit) {
    const existing = dataRef.current.plants.find(p => p.id === id);
    if (existing) {
      for (const key of PROTECTED_USER_FIELDS) {
        if (existing[key] !== undefined && key in normalizedUpdates) {
          if (__DEV__) {
            console.warn(`[updatePlant] EDU-06 guard: dropped catalog-source ${key} update (existing user value preserved). Pass {fromUserEdit:true} to override.`);
          }
          delete normalizedUpdates[key];
        }
      }
    }
  }

  const newPlants = dataRef.current.plants.map(p => p.id === id ? { ...p, ...normalizedUpdates } : p);
  // ...rest unchanged
}, [scheduleSave]);
```

3. **Audit existing call sites:** `grep -n updatePlant src/screens/*.tsx src/hooks/useStorage.tsx`. Current callers (verified):
   - `PlantsScreen.tsx:109` — `{ favorite: !plant.favorite }` — NOT a protected field, no flag needed.
   - `CalendarScreen.tsx:86,95,107` — `{ lastWatered: dateStr }` and `{ sunDays/outdoorDays }` updates — NOT protected.
   - `TodayScreen.tsx:187,194,204` — `{ lastWatered/sunDoneDate/outdoorDoneDate }` — NOT protected.

   ⇒ **No existing call site needs `fromUserEdit: true` retrofit.** The guard is purely defensive against future picker-save paths added in Phase 14 and beyond.

4. **Smoke guard:** Add a smoke runner test that calls `updatePlant('plant-1', { waterSchedule: { warm: 999, cold: 999 } })` (no flag) on a plant with custom `{ warm: 5, cold: 10 }`. Read back; assert custom values intact.

**Warning signs:**
- Any new `updatePlant` caller in Phase 14+ that passes `catalogEntry.waterSchedule`, `catalogEntry.lightLevel`, or `catalogEntry.waterMode` without `{ fromUserEdit: true }`.
- A user reporting "my watering schedule reset after I looked at the plant detail." (This phase's success criterion #2 explicitly tests this.)

### Pitfall 2: MOD-1 — Override note tone implies user is wrong

**What goes wrong:** Copy like "Estás usando 5 días cuando recomendamos 7" reads as a scolding teacher. Users disengage.

**How to avoid:**
- Use the **locked copy** from REQUIREMENTS.md line 43: *"Diferente a la recomendación para esta especie. ¿Querés ajustar?"* — neutral, offers agency.
- Visual hierarchy: user's current value is the **primary** displayed value; the override note is **smaller, secondary, `textSecondary` color**.
- If planner makes the `¿Querés ajustar?` tappable, the destination is **the existing edit picker**, NOT a coercive "set to recommendation" button.

### Pitfall 3: MOD-2 — Voseo + horticultural drift across 640 strings

**What goes wrong:** Batch 1 careful, batch 4 sloppy. ES strings drift to Castilian. `whyRationale` fields become generic.

**How to avoid:**
- Per-category batch authoring (see Pattern 3).
- Voseo linter script after each batch (15 LOC; greps for ` riega `, ` saca `, ` pon `, ` ten `, ` haz `).
- Per-field char limits enforced by the validator (mechanical guard against rambling).
- `whyRationale` quality bar: must cite a specific physiology mechanism, not generic "porque las plantas necesitan luz."
- **Check existing `tips.json` for contradictions** — several fertilizer/light/seasonal tips already exist; new `whyRationale`/`careAction` must not contradict them.

### Pitfall 4: Reanimated v4 height-measurement glitch on first render

**What goes wrong:** The lazy `onLayout` height-capture in Pattern 6 fires AFTER the first render, when the section is already styled with `height: derivedHeight.value` which is `0 * 1 = 0` if `defaultExpanded` is true but height hasn't been measured yet. Result: section briefly renders at height 0 before snapping open.

**How to avoid:**
- **Option A (simpler, recommended):** Render section content normally (no animated height) until `measuredHeight.value > 0`, THEN switch to animated style. Track via a `hasMeasured` boolean.
- **Option B (Reanimated docs accordion):** Use an off-screen position-absolute measurement layer that doesn't affect visible layout. Add complexity but eliminates the 1-frame flash.
- **Option C (acceptable):** Set a sensible default minimum height (e.g., 80px) until measured. First render shows partial content; second frame settles. User likely doesn't notice.

Planner picks; Option A is the fewest LOC. Option B is the canonical Reanimated pattern.

### Pitfall 5: i18n validator silently passes when entry-shape changes mid-rollout

**What goes wrong:** An entry has `careAction: { fixed: "..." }` in `plantDatabase.ts`. The EN locale has `careAction: { fixed: "..." }`. The ES locale has `careAction: { soilCheck: "..." }` (someone authored the wrong sub-field). Validator passes because *some* `careAction` exists in both locales — but the actual rendered ES string for `careAction.fixed` falls through to `defaultValue` (the catalog `name`/etc fallback in `getTranslatedPlant`).

**How to avoid:**
- Sub-field validator (Pattern 5) checks each declared sub-field explicitly. The pattern in the example above does this correctly: `if (entry.careAction.fixed && !node.careAction.fixed)`.
- Add a `npm run check:i18n-keys` step to the smoke runner before each merge.

### Pitfall 6: `findDatabaseEntry` (fuzzy fallback) returns wrong plant for ambiguous user-named plants

**What goes wrong:** User has a custom plant they named "rosa" — no `databaseId`. `findDatabaseEntry` fuzzy matches to the catalog `rosa` entry. Educational sections render content for the wrong plant.

**How to avoid:**
- The current 3-rung fallback (`getCatalogEntry(databaseId)` → `findDatabaseEntry` → null) is intentional and the user's responsibility to name accurately.
- For Phase 14 specifically: prefer the strict path. The custom-plant fallback (CONTEXT.md) is the correct UX when no `databaseId` is set; do NOT use fuzzy match results to populate `¿Por qué?` content.
- **Suggestion:** In Phase 14, change the dbEntry resolution in `MyPlantDetailModal.tsx:79-84` to skip the fuzzy fallback when surfacing the 5 NEW educational fields — render the custom-plant fallback for the educational sections if `databaseId` is absent, regardless of whether `findDatabaseEntry` matched. This keeps the existing fuzzy fallback for `tip`/`description` (legacy behavior) while preventing wrong-plant educational content. Planner discretion.

## Code Examples

### Example 1: Existing `LightLevelPicker` pre-select (EDU-04 — already in place!)

`src/components/PlantIdentifier/IdentificationResults.tsx:42-44`:
```tsx
const [selectedLightLevel, setSelectedLightLevel] = useState<LightLevel>(
  selectedPlant?.lightLevel ?? 'bright_indirect'
);
```

The pre-select already pulls from `selectedPlant.lightLevel` (set on `IdentifiedPlant` from PlantNet edge function in Phase 7). EDU-04's "closes UAT #1 — picker recommendation visible" is **mostly closed**. What remains:
- **Verify** the catalog-resolved lightLevel is being threaded through. Phase 7 LIGHT-05 already populated `IdentifiedPlant.lightLevel` "client-side from catalog match or sunHours mapping" (per `types/index.ts:282`).
- **If gap exists:** add a final fallback that calls `getCatalogEntry(scientificName)` (or species-name slug) and uses `entry.lightLevel` before defaulting to `'bright_indirect'`.

### Example 2: Soft override note rendering

```tsx
// src/components/plant-detail/YourSettingsSection.tsx (suggested)
import { compareUserVsCatalog } from '../../utils/overrideDetection';

function YourSettingsContent({ plant, dbEntry }: Props) {
  const { t } = useTranslation();
  const overrides = useMemo(
    () => compareUserVsCatalog(plant, dbEntry),
    [plant, dbEntry]
  );

  const hasOverride = (field: OverrideField) =>
    overrides.some(o => o.field === field);

  return (
    <View>
      {/* Light level row */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{t('plantDetailModal.lightLevel')}</Text>
        <Text style={styles.fieldValue}>
          {plant.lightLevel ? t(`lightLevel.indoor.${plant.lightLevel}`) : '—'}
        </Text>
        {hasOverride('lightLevel') && (
          <Text style={styles.overrideNote}>
            {t('plantDetailModal.overrideNote')}
            {/* ⇒ "Diferente a la recomendación para esta especie. ¿Querés ajustar?" */}
          </Text>
        )}
      </View>

      {/* Watering rows ... same pattern for waterScheduleWarm + waterScheduleCold */}
    </View>
  );
}

const styles = StyleSheet.create({
  // ...
  overrideNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
```

### Example 3: Custom-plant fallback rendering

```tsx
// Pattern: ¿Dónde ponerla? section content
function WhereToPlaceContent({ dbEntry }: { dbEntry: PlantDBEntry | null }) {
  const { t } = useTranslation();

  // CONTEXT.md custom-plant fallback rule
  if (!dbEntry) {
    return (
      <Text style={styles.placeholderCopy}>
        {t('plantDetailModal.notInCatalog')}
        {/* ⇒ "Esta planta no está en nuestro catálogo todavía." */}
      </Text>
    );
  }

  const hasAny = dbEntry.placementRecommended
    || (dbEntry.placementAlternatives && dbEntry.placementAlternatives.length > 0)
    || dbEntry.placementAvoid;

  // CONTEXT.md partial-data rule: section header stays visible if at least 1 sub-block has data
  if (!hasAny) return null; // (caller decides whether to render the section header)

  return (
    <View>
      {dbEntry.placementRecommended && (
        <View style={styles.subBlock}>
          <Text style={styles.subTitle}>{t('plantDetailModal.recommended')}</Text>
          <Text style={styles.copy}>{dbEntry.placementRecommended}</Text>
        </View>
      )}

      {dbEntry.placementAlternatives && dbEntry.placementAlternatives.length > 0 && (
        <View style={styles.subBlock}>
          <Text style={styles.subTitle}>{t('plantDetailModal.alternatives')}</Text>
          {dbEntry.placementAlternatives.map((alt, i) => (
            <Text key={i} style={styles.bullet}>• {alt}</Text>
          ))}
        </View>
      )}

      {dbEntry.placementAvoid && (
        <View style={styles.subBlock}>
          <Text style={styles.subTitle}>{t('plantDetailModal.avoid')}</Text>
          <Text style={styles.copy}>{dbEntry.placementAvoid}</Text>
        </View>
      )}
    </View>
  );
}
```

### Example 4: `getTranslatedPlant` extension

```ts
// src/data/plantDatabase.ts:1628 — extend the existing function
export function getTranslatedPlant(plant: PlantDBEntry): PlantDBEntry {
  const t = i18n.t.bind(i18n);
  const key = plant.id;
  return {
    ...plant,
    name: t(`${key}.name`, { ns: 'plants', defaultValue: plant.name }),
    tip: t(`${key}.tip`, { ns: 'plants', defaultValue: plant.tip }),
    description: t(`${key}.description`, { ns: 'plants', defaultValue: plant.description }),
    problems: (t(`${key}.problems`, { ns: 'plants', returnObjects: true, defaultValue: plant.problems }) as typeof plant.problems),
    nutrients: plant.nutrients ? {
      type: t(`${key}.nutrients.type`, { ns: 'plants', defaultValue: plant.nutrients.type }),
      homemade: t(`${key}.nutrients.homemade`, { ns: 'plants', defaultValue: plant.nutrients.homemade }),
    } : undefined,

    // ─── v1.2 Phase 14 (EDU-02) educational fields ───
    careAction: plant.careAction ? {
      fixed: plant.careAction.fixed
        ? t(`${key}.careAction.fixed`, { ns: 'plants', defaultValue: plant.careAction.fixed })
        : undefined,
      soilCheck: plant.careAction.soilCheck
        ? t(`${key}.careAction.soilCheck`, { ns: 'plants', defaultValue: plant.careAction.soilCheck })
        : undefined,
    } : undefined,
    placementRecommended: plant.placementRecommended
      ? t(`${key}.placementRecommended`, { ns: 'plants', defaultValue: plant.placementRecommended })
      : undefined,
    placementAlternatives: plant.placementAlternatives
      ? (t(`${key}.placementAlternatives`, { ns: 'plants', returnObjects: true, defaultValue: plant.placementAlternatives }) as string[])
      : undefined,
    placementAvoid: plant.placementAvoid
      ? t(`${key}.placementAvoid`, { ns: 'plants', defaultValue: plant.placementAvoid })
      : undefined,
    whyRationale: plant.whyRationale
      ? t(`${key}.whyRationale`, { ns: 'plants', defaultValue: plant.whyRationale })
      : undefined,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `LayoutAnimation` for collapse | Reanimated v4 worklets (Skeleton.tsx, this phase) | Project-wide Phase 13 (2026-05-04) | UI-thread animations, no JS jank, consistent iOS/Android |
| Standalone "Recomendaciones" + "Active Problems" cards | 4 educational sections (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes) | This phase | Educational rationale instead of raw recommendation values |
| Picker-save passes catalog values verbatim | Deep-merge guard with `fromUserEdit: true` opt-in | This phase (CRIT-1 lock) | User customizations protected from silent overwrites |
| `BottomSheetModalProvider` unused | Available but Phase 14 stays in fullscreen Modal | Phase 13 prepared infra; Phase 21 first real consumer | Lower-risk evolution; bottom-sheet adoption phased |

**Deprecated/outdated for this phase:**
- The standalone `<ActiveProblemsSection />` consumer in `MyPlantDetailModal` is being replaced; component itself may stay if used elsewhere.
- The `_migratedFromV0` field rendering inside the modal stays for now (PITFALLS MIN-5 — separate cleanup phase, not Phase 14).

## Open Questions

1. **Should `findDatabaseEntry` fuzzy fallback feed the 5 NEW educational fields, or only the legacy `name`/`tip`/`description`?**
   - What we know: CONTEXT.md says custom plants render placeholder for ¿Dónde ponerla?, hide ¿Por qué? entirely. Doesn't explicitly say what happens for a plant with no `databaseId` whose name fuzzy-matches a catalog entry.
   - What's unclear: ambiguity bias of fuzzy-match — do we trust it for educational content?
   - Recommendation: Only use `getCatalogEntry(plant.databaseId)` (strict) for the 5 new educational fields. Fall back to custom-plant placeholder if no `databaseId`. This eliminates Pitfall 6 risk. Planner can add a 1-line note in PLAN.md justifying this scope-tightening.

2. **Authoring batch ordering — what category first?**
   - What we know: 64 entries split across 6 categories; interior tropicals (potus, monstera, etc.) are most common in user gardens.
   - What's unclear: whether to author by category or by alphabetical id.
   - Recommendation: by category, starting with `interior` (largest user-share). Allows rapid feedback on tone/quality before committing to all 64. Each category is one wave or one PR.

3. **Should the `update plant` deep-merge guard accept a per-field opt-in, or one global `fromUserEdit` flag?**
   - What we know: PITFALLS CRIT-1 suggests "explicit opt-in"; PROTECTED_USER_FIELDS is a small, stable list.
   - What's unclear: whether granular per-field opt-in is over-engineering.
   - Recommendation: single `fromUserEdit: boolean` flag. Per-field is YAGNI — all 3 protected fields share the same protection model.

4. **Reanimated v4 collapse animation: simple lazy-measure (Pattern 6) vs. canonical off-screen measurer?**
   - What we know: Reanimated docs accordion uses off-screen measurer; project's Skeleton uses simple `useSharedValue` + `withRepeat`.
   - What's unclear: whether the simple lazy-measure has a visible 1-frame glitch on Android low-end devices.
   - Recommendation: ship the simple approach (Option A in Pitfall 4); upgrade to off-screen measurer only if Plan 14-N device-test reveals jank.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom Node smoke runners (project convention; mirrors Phase 11/12/13: `scripts/smoke-phase{N}.mjs` invoking `typescript.transpileModule` against stubbed source). No Jest/Vitest installed. |
| Config file | none — each phase ships its own runner |
| Quick run command | `npm run check:i18n-keys && npx tsc --noEmit` (default per-task gate) |
| Full suite command | `node scripts/smoke-phase14.mjs && npm run check:i18n-keys && npx tsc --noEmit && npm run check:images` |
| Phase gate | All four pass green; manual device-test of section animation + override note + custom-plant fallback at end of phase. |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDU-01 | 4 sections render in order; collapsable; equal-weight cards | structural | `node scripts/smoke-phase14.mjs` (asserts MyPlantDetailModal.tsx contains the 4 emoji+title strings + `EducationalSection` import) | ❌ Wave 0 |
| EDU-02 | `PlantDBEntry` extended with 5 optional fields | type | `npx tsc --noEmit` (compile-checks src/types/index.ts; smoke runner asserts the 5 field names appear in types/index.ts) | ✅ existing tsc |
| EDU-03 | All 64 entries have all 5 fields populated in EN + ES | content | `npm run check:i18n-keys` (extended per EDU-07; fails if any declared catalog field lacks i18n key) | ✅ existing script |
| EDU-04 | LightLevelPicker pre-selects from species' recommended `lightLevel` | unit | `node scripts/smoke-phase14.mjs` asserts `selectedPlant?.lightLevel ??` pattern present + catalog-fallback wired | ❌ Wave 0 |
| EDU-05 | "Tus ajustes" shows soft override note when user value ≠ catalog | unit | `node scripts/smoke-phase14.mjs` runs `compareUserVsCatalog(plant, entry)` against fixtures: 3 differing fields + 1 matching field + null entry; asserts result lengths | ❌ Wave 0 (creates `scripts/smoke-phase14.mjs` + stubs) |
| EDU-06 | `useStorage.updatePlant` deep-merge guard | unit | `node scripts/smoke-phase14.mjs` calls `updatePlant('p1', {waterSchedule:{warm:999,cold:999}})` (no `fromUserEdit`) on plant with custom `{warm:5,cold:10}`; reads back; asserts custom value intact. Then with `{fromUserEdit:true}`; asserts overwrite occurred. | ❌ Wave 0 |
| EDU-07 | `check-i18n-keys.mjs` validates 5 new fields conditionally | static-analysis | `npm run check:i18n-keys` (extended; fails if entry declares `careAction.fixed` but locale lacks the key) — invoke a fixture entry with all 5 fields + a deliberately-missing locale key; assert non-zero exit | ✅ existing script (extended) |

### Sampling Rate

- **Per task commit:** `npm run check:i18n-keys && npx tsc --noEmit` (~5s)
- **Per wave merge:** `node scripts/smoke-phase14.mjs && npm run check:i18n-keys && npx tsc --noEmit` (~15s)
- **Phase gate:** Full suite green + `npm run check:images` (~30-60s) + manual device-test of section animation, override note rendering, and custom-plant fallback path before `/gsd:verify-work`.

### Wave 0 Gaps

- [ ] `scripts/smoke-phase14.mjs` — covers EDU-01, EDU-04, EDU-05, EDU-06 with placeholders that SKIP at baseline and PASS only when locked shape lands (mirrors Phase 11/12/13 runner pattern)
- [ ] `scripts/.tmp-phase14/` (gitignored) — AsyncStorage stub + i18n stub modules for runner
- [ ] (No new fixtures required — runner builds inline test plants in-memory; existing PLANT_DATABASE serves as catalog fixture)
- [ ] `npm run` script entry: `"smoke:phase14": "node scripts/smoke-phase14.mjs"` in package.json

*(Test framework is already installed — no `npm install` step required. Reanimated/gesture-handler installed Phase 13.)*

## Sources

### Primary (HIGH confidence)
- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — full lock from user discussion (sole authority on locked decisions)
- `.planning/REQUIREMENTS.md` lines 39-45 — EDU-01..EDU-07 verbatim
- `.planning/research/PITFALLS.md` — CRIT-1 (lines 14-34, deep-merge guard design), MOD-1 (lines 154-170, recommendation tone), MOD-2 (lines 174-192, voseo + content drift)
- `src/components/MyPlantDetailModal.tsx` (495 LOC) — the file being restructured
- `src/components/Skeleton.tsx` (53 LOC) — Reanimated v4 reference impl from Phase 13
- `src/data/plantDatabase.ts:1628` — `getTranslatedPlant()` extension point
- `src/data/plantDatabase.ts:1691` — `getCatalogEntry()` lookup
- `src/hooks/useStorage.tsx:378-396` — `updatePlant()` shallow-merge pattern (the body of the EDU-06 change)
- `src/components/PlantIdentifier/IdentificationResults.tsx:42-51` — existing pre-select infrastructure (EDU-04 mostly closed)
- `src/components/LightLevelPicker.tsx` — picker prop surface (already accepts `value` initial state)
- `scripts/check-i18n-keys.mjs:66-75` — nutrient-conditional pattern (EDU-07 template)
- `src/types/index.ts:162-201` — `PlantDBEntry` shape being extended
- `package.json` — confirms Reanimated 4.1.1, gesture-handler 2.28, bottom-sheet 5.2.13, expo-haptics 15.0.8 already installed
- `.planning/STATE.md` — project decisions (CRIT-1 deep-merge guard listed under "Key v1.2 pre-decisions locked during research")
- `.planning/config.json` — `nyquist_validation: true` (this phase ships a smoke runner)
- `CLAUDE.md` — design system tokens, voseo discipline, pre-submit checks

### Secondary (MEDIUM confidence)
- [Reanimated v4 Accordion docs](https://docs.swmansion.com/react-native-reanimated/examples/accordion/) — canonical pattern for collapsible section with `useSharedValue` + `useDerivedValue` + `withTiming` + `useAnimatedStyle` + `onLayout` measurement (verified by WebFetch 2026-05-03)
- Phase 13 14-CONTEXT.md (referenced from Phase 14 CONTEXT) — confirms Reanimated v4 + BottomSheetModalProvider context availability

### Tertiary (LOW confidence — flagged for validation in Plan 14-NN device test)
- Reanimated v4 + Expo SDK 54 simultaneous accordion + scroll behavior on low-end Android — community reports vary; Phase 13 device test (Plan 13-03) is the existing precedent for this kind of validation. Recommend: run section-collapse test on Android dev client before phase complete.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps installed Phase 13; reference impl in Skeleton.tsx
- Architecture: HIGH — CONTEXT.md is fully locked; restructure pattern mirrors existing card layouts
- Catalog schema extension: HIGH — additive optional fields are v1.1 precedent (waterSchedule, lightLevel, climateOverride)
- i18n authoring: MEDIUM-HIGH — workflow is composable from existing `getTranslatedPlant` + `check-i18n-keys.mjs`; quality drift risk is the wildcard (640 strings, MOD-2 lock)
- Reanimated collapse animation: MEDIUM-HIGH — official docs pattern is well-documented; first-render measurement glitch is a known papercut with 3 valid resolution paths
- CRIT-1 deep-merge guard: HIGH — design fully locked in PITFALLS.md + STATE.md; existing call sites verified clean (no retrofit needed)
- Validator extension: HIGH — line 66 nutrient pattern is the literal template for 5 conditional checks
- Override-detection: HIGH — pure function over Plant + PlantDBEntry; trivially testable
- LightLevelPicker pre-select (EDU-04): HIGH — pre-select infrastructure already in IdentificationResults.tsx; potentially zero code change required, just verification

**Research date:** 2026-05-03
**Valid until:** 2026-06-02 (30 days; stable domain — no library version churn expected; only fast-moving piece is content authoring quality which is a process concern, not technical)
