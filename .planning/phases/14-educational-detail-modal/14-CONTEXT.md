# Phase 14: Educational Detail Modal - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure `MyPlantDetailModal.tsx` (495 LOC fullscreen Modal) into 4 educational sections: "¿Qué hacer?" (action), "¿Dónde ponerla?" (placement), "¿Por qué?" (rationale, collapsable), "Tus ajustes" (user state with override-detection). Extend `PlantDBEntry` with 5 new optional fields (`careAction.{fixed?,soilCheck?}`, `placementRecommended`, `placementAlternatives[]`, `placementAvoid`, `whyRationale`). Author ~640 new strings (5 fields × 64 catalog entries × EN/ES voseo). Pre-select `LightLevelPicker` to species recommendation after PlantNet identification. Surface a soft non-pushy override note when user value differs from catalog. Implement deep-merge guard in `useStorage.updatePlant` to prevent catalog-source values from silently overwriting user customizations (Pitfall CRIT-1). Extend `check-i18n-keys.mjs` with conditional validation for the 5 new fields (nutrient-conditional pattern at line 66 is the template).

**Out of scope:** real bottom-sheet content for sections (Phase 21's journal quick-add is the first BottomSheet caller); fertilization detail (Phase 16); pet-toxicity badging (Phase 15); per-plant collapse persistence; "Ajustar"-style edit-flow rebuilds (deferred).

</domain>

<decisions>
## Implementation Decisions

### Modal structure (sheet vs fullscreen)

- **Keep the existing fullscreen `<Modal>` shell** from `src/components/MyPlantDetailModal.tsx`. Phase 13's `BottomSheetModalProvider` stays unused for this phase — Phase 21's journal quick-add will be the first real BottomSheet caller. Lower-risk evolution path; reuses 495 LOC of working code.
- **Replace the existing "Recomendaciones" card** with the 4 new educational sections (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes). The recommendations card is deleted, not preserved alongside.
- **Fold the existing "Active Problems" list** into "¿Qué hacer?" as a top sub-block. The standalone `<ActiveProblemsSection />` component goes away from the detail modal (it may stay used elsewhere; planner decides).
- **Preserve** photo album + diagnosis history + delete button below the 4 new sections (existing real estate stays for power users).
- **Final section order in the ScrollView:**
  1. Header (title, close X, plant name, scientific name)
  2. Photo + health badge (existing)
  3. **🌿 ¿Qué hacer?** (NEW — replaces Recomendaciones, includes folded Active Problems)
  4. **🏠 ¿Dónde ponerla?** (NEW)
  5. **ℹ️ ¿Por qué?** (NEW — collapsable per REQUIREMENTS, but defaults to expanded per Area 2 below)
  6. **⚙️ Tus ajustes** (NEW)
  7. Photo album (existing `<PlantPhotoAlbum />`)
  8. Diagnosis history (existing)
  9. Delete (existing, snap to bottom)

### Visual hierarchy + section styling

- **Equal weight across all 4 sections** — no section visually dominates. All 4 share the same card style (theme.ts: `borderRadius.lg`, `shadows.sm`, `card` background). No accent borders, no size variations.
- **Leading emoji as visual anchor**, locked: `🌿 ¿Qué hacer?` / `🏠 ¿Dónde ponerla?` / `ℹ️ ¿Por qué?` / `⚙️ Tus ajustes`. Match existing emoji-throughout convention (CLAUDE.md "Emoji icons throughout"). The emojis are part of the section title, not standalone icons.
- **Typography hierarchy** within each section: title (`fonts.title` PlayfairDisplay_700Bold, ~18-20px), section copy (`fonts.body` DMSans_400Regular). Sub-block titles (e.g., "Recomendado:" inside ¿Dónde ponerla?) use `fonts.bodySemiBold` DMSans_600SemiBold.
- **Spacing between sections** uses `spacing.md` between section cards (not the existing tighter gap between current modal cards) so the new education content has breathing room.

### Section animations

- **Use Reanimated v4 worklets** for the collapse/expand animation (height + opacity) — runs on UI thread, no JS jank. ~250ms with `Easing.inOut(Easing.ease)`. Mirrors the `withTiming` + `useSharedValue` pattern from `src/components/Skeleton.tsx` (Phase 13). This is the "INFRA for bottom-sheet section animations" the ROADMAP referenced — even though we kept the fullscreen Modal, sections still benefit from Phase 13's worklet engine.
- **Animate**: section content height (0 → measured) + opacity (0 → 1) on expand; reverse on collapse. The section title row (emoji + label + chevron indicator) is always rendered.
- **Chevron rotation**: chevron points down when expanded, right when collapsed. 180° rotation animation tied to the same shared value.

### Default collapsed/expanded state

- **All 4 sections expanded by default** when the modal opens. User sees the full educational content immediately on first interaction.
- The "collapsable" requirement on `¿Por qué?` (REQUIREMENTS line 39) is interpreted as "MUST support collapse," NOT "MUST start collapsed." All 4 sections are tap-to-collapse capable; they all default to expanded.
- Risk acknowledged: with 4 expanded sections + photo album + diagnosis history, the scroll length can be long for content-rich plants. Mitigation: equal-weight visual hierarchy keeps each section scannable; users who want a tighter view collapse `¿Por qué?` (the most reading-heavy section).

### Custom-plant fallback (no catalog match)

- **All 4 sections render for ALL plants**, including user-created custom plants with no `databaseId`. The structural consistency is the priority — users always see the same 4-section layout regardless of catalog match.
- For plants where `getCatalogEntry(databaseId)` returns null (or `databaseId` is absent → `findDatabaseEntry` fuzzy fallback also returns null):
  - **¿Qué hacer?** renders only the user's actual care state (watering schedule, last watered, etc.) — no catalog-sourced "fixed" or "soilCheck" copy.
  - **¿Dónde ponerla?** shows a placeholder copy: "Esta planta no está en nuestro catálogo todavía." (or EN equivalent). NO aggressive CTA to identify the plant — that would feel pushy. The Phase 12 unknown-plants tracking already silently logs these for catalog expansion.
  - **¿Por qué?** is hidden entirely for custom plants (no rationale to surface). Section header is also hidden — not just "empty content."
  - **Tus ajustes** works fully — it's purely user-data-driven and doesn't depend on catalog content.

### Partial catalog data (sub-block visibility)

- **Sub-blocks within sections hide gracefully** when their backing field is missing. Section headers stay visible if at least ONE sub-block has data.
- Examples:
  - `careAction.fixed` exists but `careAction.soilCheck` is missing → only the fixed sub-block renders inside ¿Qué hacer?.
  - `placementAlternatives` is empty array → that bullet list is skipped, but `placementRecommended` still renders.
  - `whyRationale` is missing → ENTIRE ¿Por qué? section header + content is hidden (zero-content section disappears, special case for ¿Por qué? since it has only ONE backing field).
  - `placementAvoid` is missing → that single line is skipped, others render.
- This keeps the UX consistent during the rollout: as catalog entries gain content, sub-blocks light up progressively; never a "broken half-empty" state.

### Collapse-state persistence

- **Per-modal-session** (resets every time the modal closes). Open plant A, collapse `¿Por qué?`, close → reopen plant A: `¿Por qué?` is expanded again (matches default).
- Implementation: section-collapse state lives in component-local `useState`, NOT in AsyncStorage / `useStorage`. Zero storage overhead, fully predictable.
- Trade-off acknowledged: power users who always close `¿Por qué?` re-collapse each open. Acceptable — Phase 14's mandate is the educational rollout, not advanced UX preference memory.

### "Tus ajustes" override-detection (locked from REQUIREMENTS)

- **Trigger:** when user's stored value (`lightLevel`, `waterSchedule.warm`, `waterSchedule.cold`, etc. — full list TBD by planner from `Plant` type fields) differs from the catalog recommendation for the matching `PlantDBEntry`.
- **Copy:** *"Diferente a la recomendación para esta especie. ¿Querés ajustar?"* (locked from REQUIREMENTS.md line 43).
- **Behavior nuances** (planner discretion within these guardrails):
  - Inline within `Tus ajustes` next to the differing field, NOT a top-of-section banner.
  - Non-pushy: small text, theme color (probably `textSecondary` or `bgPrimary` accent — planner picks).
  - The `¿Querés ajustar?` is informational — does NOT need to be a tappable CTA in Phase 14. If planner finds it trivial to wire up "Ajustar" → opens edit-mode for that field, fine; if not, plain text is acceptable.

### Claude's Discretion

- **640-string content authoring workflow.** User trusts Claude to choose: per-plant Claude prompts vs bulk template pass; where strings live (`plants.json` with 5 new keys per entry vs new `plant-edu.json`); what "horticultural review" means in practice. Planner should propose a workflow in the plan and the user reviews via the verification gate. Quality bar: voseo-correct ES, no exclamation marks unless emphasizing, follows the existing tip/description tone in `plants.json`.
- **Override note frequency + dismissibility.** Always-on vs first-detection vs persistent-with-dismiss. Planner picks the simplest implementation that respects the "non-pushy" requirement. If always-on is too noisy in practice, post-launch backlog item to refine.
- **Override note "Ajustar" CTA wiring.** Planner decides whether the question mark text becomes a tappable inline link to edit-mode for that field, or stays informational. Both are acceptable Phase 14 outcomes.
- **Field selection for override-detection.** Planner picks which of the user's stored fields are compared against catalog (probably `lightLevel`, `waterSchedule.warm`, `waterSchedule.cold` to start; tempMin/tempMax/humidity arguably less interesting since they're climate-driven not user-set).
- **`¿Por qué?` collapse default.** REQUIREMENTS spec says collapsable; user said "all 4 expanded by default" in this discussion. Final lock: defaults to expanded, but user can collapse. If planner has a strong reason to default-collapse `¿Por qué?` only (e.g., it's text-heavy and skippable), that's an acceptable deviation with brief justification in PLAN.md.
- **Sub-block presentation for `placementAlternatives` array.** Bullet list, comma-separated inline, or chip badges. Planner picks; chip badges is probably most scannable but adds component LOC.
- **Animation timing & easing curves.** ~250ms `Easing.inOut(Easing.ease)` is the suggested target — planner can refine ±50ms with no concern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 14 spec
- `.planning/REQUIREMENTS.md` — EDU-01 through EDU-07 (lines 39-45) — the 7 requirements that close in Phase 14
- `.planning/ROADMAP.md` §"Phase 14: Educational Detail Modal" (line 44, success criteria lines 122-127)

### Project conventions
- `CLAUDE.md` — Design system (theme tokens), i18n discipline (vos conjugation, no hardcoded strings, `getTranslatedPlant()` for catalog content), pre-submit checks (`npm run check:i18n-keys`)
- `.planning/STATE.md` — current project state, active bug-watches, milestone version

### Existing components & types (files being modified or referenced)
- `src/components/MyPlantDetailModal.tsx` (495 LOC) — the file being restructured. Read fully before planning to understand the existing prop surface, ScrollView structure, and section card pattern.
- `src/types/index.ts` §`PlantDBEntry` (line 162+) — the interface being extended with 5 new optional fields. EDU-02 says "additive, no schema bump per architecture research."
- `src/data/plantDatabase.ts` (1705 LOC, 64 entries) — the catalog being augmented with 5 new fields per entry. Read the existing entry shape (e.g., the first 2 entries) to match the convention.
- `src/hooks/useStorage.tsx` (794 LOC) §`updatePlant` — the function gaining the deep-merge guard (EDU-06). Find the current implementation and identify the silent-overwrite path.
- `src/components/PlantIdentifier/IdentificationResults.tsx` — where the LightLevelPicker pre-selection lives (EDU-04).
- `src/components/LightLevelPicker.tsx` — the picker that needs an `initialValue` or `recommended` prop.
- `src/components/PlantPhotoAlbum.tsx`, `src/components/ActiveProblemsSection.tsx` — existing modal sub-components; ActiveProblemsSection's role gets folded into ¿Qué hacer? (planner decides whether the file is deprecated entirely or stays for other call sites).
- `src/components/Skeleton.tsx` (Phase 13) — reference implementation for Reanimated v4 `useSharedValue` + `withRepeat`/`withTiming` pattern. Section collapse animation should mirror this.
- `src/utils/seasonality.ts`, `src/utils/plantHealth.ts`, `src/utils/plantInfo.ts` — used by current modal; preserved.

### i18n
- `src/i18n/locales/en/plants.json`, `src/i18n/locales/es/plants.json` — where the ~640 new strings live (5 fields × 64 entries × 2 locales). Existing structure: per-entry block keyed by id, with `name`, `tip`, `description`, `problems[]`, `nutrients?`. The 5 new keys land alongside.
- `src/i18n/locales/en/common.json`, `src/i18n/locales/es/common.json` — where shared section labels live (e.g., `plantDetailModal.whatToDo`, `plantDetailModal.whereToPlace`, `plantDetailModal.why`, `plantDetailModal.yourSettings`, the override note copy).
- `scripts/check-i18n-keys.mjs` (83 LOC) — the i18n validator. EDU-07 extends it; the existing nutrient-conditional pattern at line 66 is the template.

### Prior phase context
- `.planning/phases/13-gesture-bottom-sheet-infrastructure/13-CONTEXT.md` — INFRA decisions (Reanimated v4, BottomSheetModalProvider availability, `useDismissOnPaywall(sheetRef)` hook). Phase 14 stays in fullscreen Modal but uses the Reanimated worklet engine for section collapse.
- `.planning/phases/12-unknown-plant-tracking/12-CONTEXT.md` — Phase 12 silently logs unknown-plant identifications. Phase 14's custom-plant fallback DOES NOT add a CTA pointing here; it's already silently in effect.
- `.planning/phases/11-perenual-data-quality/11-CONTEXT.md` — Phase 11 catalog-miss gating; relevant to how Phase 14 interacts with `getCatalogEntry` lookups.
- `.planning/phases/08-precision-care-uat/08-CONTEXT.md` (if it exists) — CRIT-1 (deep-merge guard) and CAT-04 (direct id lookup over fuzzy) decisions originated here. Locate the deep-merge research finding.
- `.planning/research/PITFALLS.md` — CRIT-1 deep-merge precedent. Read before planning EDU-06.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/components/Skeleton.tsx`** (Phase 13, 53 LOC) — Reanimated v4 reference implementation. Section collapse animations should mirror this pattern (`useSharedValue`, `useAnimatedStyle`, `withTiming`).
- **`src/utils/haptics.ts`** (Phase 13, 50 LOC) — `triggerHaptic('selection')` could be invoked when toggling a section collapse for tactile feedback. Optional, planner discretion.
- **`src/data/plantDatabase.ts`** §`getCatalogEntry`, `getTranslatedPlant`, `getPlantCategories` — direct id lookup is preferred (Phase 8 CAT-04). `getTranslatedPlant` already does the i18n indirection for existing fields; the 5 new fields will follow the same pattern.
- **`src/utils/plantInfo.ts`** §`findDatabaseEntry` — fuzzy fallback for plants without `databaseId`. Stays as defensive 3-rung path: `getCatalogEntry(databaseId)` → `findDatabaseEntry` → null.
- **`src/components/MyPlantDetailModal.tsx`** existing card structure — section cards already use `borderRadius.lg`, shadow tokens, and theme colors. The 4 new sections inherit this convention (just rearranged).
- **`src/components/PlantHealthBadge.tsx`** — preserved at top of modal; no changes.
- **`src/components/PlantPhotoAlbum.tsx`** — preserved below the 4 new sections.

### Established Patterns

- **All UI text via `t('key')`** from `react-i18next` — never hardcoded. The 4 section labels live in `common.json`; the 640 entry-specific strings live in `plants.json` per entry.
- **Plant database content translation** via `getTranslatedPlant()` in `plantDatabase.ts` — extend this helper to surface the 5 new fields when present.
- **Category names resolved dynamically** via `getPlantCategories()` — never use stored `typeName` directly for display.
- **Stateless task generation** via `getTasksForDay()` in `plantLogic.ts` — Phase 14 doesn't add task storage; status info inside ¿Qué hacer? is computed fresh.
- **Two-AppContent paths discipline (CRIT-4)** — Phase 14 changes are entirely inside `MyPlantDetailModal.tsx`, which is already used by both AppContent paths. No App.tsx changes required.
- **Dual data model** (camelCase types/index.ts vs snake_case types/database.ts) — `PlantDBEntry` is the local catalog type; the 5 new fields are local-only (no Supabase round-trip; v1.1 deferred).
- **Spanish vos conjugation** (regá, sacá, podés) — applies to all 320 ES strings authored in EDU-03.
- **Pre-submit checks** — `npm run check:i18n-keys` blocks any submit. EDU-07 extends this validator. EDU-03 needs all 640 strings landed for the validator to pass.

### Integration Points

- **`useStorage.updatePlant`** is the central mutation for plant data. EDU-06 deep-merge guard sits here. Planner identifies all callers (catalog source path vs user-edit path) and ensures only user-edit paths can overwrite user-set fields.
- **`IdentificationResults` → `LightLevelPicker`** is the EDU-04 integration. After PlantNet returns a species, look up the matching `PlantDBEntry`, extract `lightLevel`, pass to picker as recommended/initial.
- **`getTranslatedPlant()`** is the data-flow integration for the 5 new fields. Extend the function signature and return type; downstream UI consumers (the 4 sections) read from the translated object.
- **`scripts/check-i18n-keys.mjs`** validator extension — line 66 nutrient-conditional pattern: when an entry's catalog data declares a `nutrients` block, the validator demands matching i18n keys. EDU-07 mirrors this for each of the 5 new fields: when an entry declares the field, the validator demands the corresponding i18n key in both EN and ES.

</code_context>

<specifics>
## Specific Ideas

- "Educational content first, existing power-user content (album, diagnosis) second" — section order reflects this priority.
- "Equal-weight cards with emoji anchors" — match the existing emoji-throughout aesthetic; don't introduce a new icon library or visual hierarchy convention.
- "Reanimated worklets for section collapse — same engine that powers Phase 13's Skeleton shimmer" — keep the animation API surface tight, reuse the worklet pattern.
- "Custom plants get the 4-section structure too, with placeholders" — predictable UX over tight UX.
- "Sub-blocks hide gracefully on partial data, headers stay visible" — accommodates the gradual catalog-content rollout.
- "Per-modal-session collapse state, no persistence" — zero storage overhead, predictable.
- "Override note non-pushy, copy locked, behavior is informational by default" — Phase 14 doesn't need to wire the "Ajustar" CTA fully.

</specifics>

<deferred>
## Deferred Ideas

- **Per-plant collapse persistence** — if power users want their preference remembered per plant, separate phase / backlog item.
- **Stacked bottom-sheet detail UI** — the more modern UX paradigm. Considered and explicitly rejected for Phase 14 in favor of the lower-risk fullscreen-modal evolution. Phase 21 (journal quick-add) is the first real BottomSheet caller; if that lands well, future phases can revisit.
- **"Ajustar" CTA full edit-mode wiring** — if planner finds it trivially wireable, fine; otherwise informational-only is the locked baseline. Full inline-edit-from-override is its own UX investment, deferred.
- **Override frequency UI (first-detection vs always-on vs dismissible)** — left to planner discretion within the "non-pushy" guardrail. Post-launch backlog if always-on proves noisy.
- **Identification CTA inside custom-plant fallback** — explicitly rejected. Phase 12 silently logs unknown plants; pushing identification feels intrusive.
- **`<ActiveProblemsSection />` deprecation** — planner decides whether the standalone component is removed entirely or preserved for other call sites. Not a Phase 14 forcing function.
- **Bulk catalog content review pipeline** — if Claude-drafted content needs a structured review gate (e.g., a CSV export for human review, a sampling test), that's its own tooling phase.

</deferred>

---

*Phase: 14-educational-detail-modal*
*Context gathered: 2026-05-04*
