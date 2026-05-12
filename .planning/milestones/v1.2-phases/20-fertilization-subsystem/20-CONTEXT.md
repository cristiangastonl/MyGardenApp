# Phase 20: Fertilization Subsystem - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a new `'fertilize'` task type that flows through the existing 5-site discriminator chain (`plantLogic.getTasksForDay`, `notificationScheduler`, `plantHealth`, `DayDetail`/`DayDetailModal`/`MonthCalendar` discriminator chains, `TaskButton` rendering). Plants gain optional `fertilizeSchedule`; catalog entries gain `fertilizeIntervalWarm`/`fertilizeIntervalCold` + `fertilizer.{type, industrialRecommendation?, homemadeRecommendation?}` content for ALL 118 catalog entries × EN+ES. PlantCard surfaces a "fertilize due today" affordance (mode='tasks' branch). MyPlantDetailModal explains how + when via a new sub-block inside the existing `🌿 ¿Qué hacer?` section. Push notifications opt-in (Settings → Notifications, default OFF).

**Out of scope:** custom user-defined fertilizer schedules; per-plant fertilizer logging history; fertilizer-specific photo journal entries; brand-specific recommendations; "skip this fertilize" workflow (mark-done is the only completion path); paid premium-gated fertilizer content. Plants without `fertilizeSchedule` emit no fertilize task and incur no health-score penalty.

</domain>

<decisions>
## Implementation Decisions

### MyPlantDetailModal Integration (the area discussed)

**Structural placement:**
- Fertilize content lands as a **sub-block inside the existing `🌿 ¿Qué hacer?` section** — peer of the existing `careAction.fixed`/`careAction.soilCheck` water sub-block. NOT a new peer section. NOT split between "¿Qué hacer?" and "¿Por qué?". Modal stays at 5 sections (4 educational + Mascotas) — does NOT grow to 6.
- Phase 19's `ModalSectionId` union (`'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas'`) is **NOT extended** with a new `'fertilizar'` value. Fertilize content is reachable via the existing `'que-hacer'` anchor.

**Layout: two-column side-by-side cards (water | fertilize)**
- Inside `🌿 ¿Qué hacer?`, the watering/check_soil sub-block and the fertilize sub-block render as **two parallel mini-cards** in a horizontal row when both fields have data. This is a deliberate one-off layout pattern within an otherwise single-column modal — the user wants the visual parallel between "regá" and "fertilizá" as related-but-distinct care actions.
- **Card heights match** (CSS-style equalization or RN equivalent) when both are present.
- This layout is INSIDE the section's existing card; it does not introduce two top-level cards.

**Graceful degradation: collapse to single column when only one has data**
- When `fertilizeIntervalWarm` is missing (e.g., custom plant without `databaseId`, or catalog entry without fertilizer content), the watering card spans **full width** — no awkward empty card placeholder.
- Conversely, if a plant has fertilize content but no watering recommendation (rare — would only be a custom plant with manual fertilize schedule), the fertilize card spans full width.
- Mirrors Phase 14's per-field graceful degradation pattern (zero-content sub-blocks disappear; never a "broken half-empty" state).

**Card content: header always visible, deep content tap-to-expand**
- The fertilize card always shows: emoji + action verb + frequency, e.g., `🌱 Fertilizá cada 14 días (cálido)`.
- **Deep content (industrial NPK ratio + homemade recipe) collapsed by default.** Tap the card → expand reveals `fertilizer.industrialRecommendation` and/or `fertilizer.homemadeRecommendation` from the catalog entry.
- Reuses the **EducationalSection collapse/expand pattern from Phase 14** (Reanimated v4 `useSharedValue` + `useDerivedValue` + 250ms `Easing.inOut(Easing.ease)`, chevron rotation 0°→90°). Same animation primitives — no new pattern.
- Watering card behavior is **unchanged** — the existing `careAction.fixed`/`careAction.soilCheck` content rendering is untouched. Only the fertilize card introduces the tap-to-expand behavior. (Future polish phase may align the water card to match.)

**Tap-routing from PlantCard → modal**
- A future PlantCard fertilize-due-today indicator (FERT-06) opens MyPlantDetailModal with `initialSection='que-hacer'`.
- The modal also receives a signal that the fertilize card should **auto-expand on arrival** (so the user lands directly on the fertilize content, not on the watering card). Implementation: a one-shot `initialExpanded?: 'fertilize'` prop on the section content (planner's discretion on exact mechanism — this CONTEXT locks the behavior, not the API shape).
- No new `ModalSectionId` value added. Smallest possible API surface change to Phase 19's mechanism.

### Claude's Discretion

The user explicitly opted not to discuss the other 3 originally-flagged gray areas. Trust Claude's defaults during research and planning, anchored on prior-phase precedents:

**Catalog content depth + cultural framing (FERT-07) — Claude's discretion:**
- Lean on Phase 14-04/06/07 + 15/16/17 catalog-content authoring discipline: char-limit-from-draft, voseo pre-sweep, locale parity from start, distinct per-entry rationale (zero copy-paste), category-grouped batches.
- Per-category default: tropicales/aromáticas/huerta lean homemade-first (lombricompuesto, té de cáscara de banana, té de compost) with industrial NPK ratio as alternative; suculentas/cactus default to NPK only (homemade composts can be too nitrogen-rich for arid succulents); frutales offer both industrial and homemade. Researcher confirms per-category framing.
- LATAM-specific homemade lexicon authenticity: prefer Argentine/regional terms when applicable, voseo-neutral imperatives.
- "Industrial = generic NPK ratios, never brand names" is locked in FERT-07 — already a non-decision.
- Tone: prescriptive frequency + neutral how (mirrors Phase 14's `whyRationale` register).

**PlantCard fertilize task affordance (FERT-06) — Claude's discretion:**
- Default: render in PlantCard's `mode='tasks'` branch only (matches FERT-06 wording). Reuse the existing watering-task-icon visual language from `DayDetail.tsx` (`task.type === "water"` styling) — fertilize gets a similar icon container with its own color token.
- Coexists with Phase 18's mood emoji (always visible image overlay) and Phase 19's headerRight toxicity badge cluster — fertilize indicator slots into the existing tasks-row area (NOT headerRight, NOT image overlay) to preserve the 5-element budget.
- Researcher checks: is there a "task due today" badge pattern already established for water/sun/outdoor on the card? If yes, reuse it. If no, the planner introduces one consistent with PlantCard's existing visual language.

**Cadence + dormancy + skip behavior (FERT-04) — Claude's discretion:**
- `fertilizeIntervalCold: null` semantics: in cold-season the plant emits NO fertilize task. Mirrors v1.1 `WaterMode` season-aware split.
- Hemisphere flips already handled by the existing `seasonality.ts` warm/cold helper (Phase 5) — the same season detection that drives `waterScheduleWarm`/`waterScheduleCold` drives `fertilizeIntervalWarm`/`fertilizeIntervalCold`.
- Catch-up logic: if `lastFertilized` was N×interval days ago, emit ONE fertilize task today (not N tasks). Same cadence-clipping pattern as existing watering logic.
- "Skip this one" UX: NOT in scope for this phase. Mark-done is the only completion path — same UX as existing water/sun/outdoor tasks.
- Plants without `fertilizeSchedule` (additive optional): zero fertilize tasks, zero health-score penalty — already locked in Success Criterion 5.

**Settings → Notifications toggle (FERT-05) — Claude's discretion:**
- One global toggle "Fertilize reminders" in Settings → Notifications. Default OFF. Toggling ON wires `fertilize` task into the existing morning-reminder body (`notificationScheduler.ts`) alongside water/sun/outdoor — same body-line pattern.
- NOT per-plant toggles in this phase (would expand scope).

**Test/smoke runner pattern — Claude's discretion:**
- Same three-tier sentinel pattern as Phase 19: `smoke-phase20.cjs` with PASS scaffold + SKIP placeholders for FERT-01..07 + STRICT cross-phase regression sentinels for Phase 18 (PlantCard 5-element layout) and Phase 19 (TOX-03 badge cluster, TOX-04 Mascotas section, TOX-06 i18n parity script).
- `check-i18n-keys.mjs` extended with conditional `fertilizer.{industrialRecommendation,homemadeRecommendation}` parity validation (mirrors Phase 19's symptoms parity extension).
- Three-tier discipline locked: STRICT preservation sentinels for Phase 18+19 surfaces, SKIP→PASS placeholders for Phase 20 features, PASS-on-baseline for cross-cutting regression.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 20 specification
- `.planning/REQUIREMENTS.md` — FERT-01..07 contract (lines under "### Fertilize Task Subsystem (FERT)"); per-category baselines locked (FERT-02); industrial-no-brands locked (FERT-07); opt-in default-OFF locked (FERT-05); 5-site discriminator sweep locked (FERT-03)
- `.planning/ROADMAP.md` §"Phase 20: Fertilization Subsystem" — 5 success criteria, depends_on Phase 13 (INFRA) + Phase 17 (catalog at 118)

### Architectural anchors (MyPlantDetailModal integration)
- `.planning/phases/14-educational-detail-modal/14-CONTEXT.md` — 4-section structure, EducationalSection collapse/expand animation primitives (Reanimated v4 `useSharedValue` + 250ms `Easing.inOut`), per-field graceful degradation pattern, char-limit-from-draft authoring discipline
- `.planning/phases/14-educational-detail-modal/14-04-SUMMARY.md` through `14-07-SUMMARY.md` — content-authoring playbook (voseo pre-sweep, char-limit-from-draft, distinct per-entry rationales, category-grouped batches)
- `.planning/phases/19-pet-toxicity/19-04-SUMMARY.md` — `ModalSectionId` union + `initialSection` prop + ScrollView ref + `sectionLayouts.current` + `onSectionLayout` (50ms layout-settle defer); the mechanism Phase 20 reuses (NOT extends)
- `src/components/MyPlantDetailModal.tsx` — current 5-section rendering, `ModalSectionId` export site, EducationalSection wrapper usage

### Discriminator-sweep precedent (5 sites)
- `src/utils/plantLogic.ts` — `getTasksForDay` task-emission discriminator
- `src/utils/notificationScheduler.ts` — body-line task-type switch (existing water/sun/outdoor branches at lines 102-128)
- `src/utils/plantHealth.ts` — health-score penalty discriminator
- `src/components/DayDetail.tsx`, `src/components/DayDetailModal.tsx`, `src/components/MonthCalendar.tsx` — UI task-type styling discriminator
- `src/components/TaskButton.tsx` — task render dispatcher

### v1.1 precedent: `'check_soil'` 5-site sweep (Phase 5)
- `.planning/phases/05-hemisphere-season-helpers-pure-utility-switchover` — the precedent FERT-03 explicitly mirrors. Researcher reads its SUMMARYs to find the exact 5-site sweep pattern; planner uses it as the FERT-03 task-decomposition template.

### Catalog content authoring (FERT-07)
- `src/data/plantDatabase.ts` — 118 entries, target for `fertilizeIntervalWarm/Cold` + `fertilizer.*` field additions
- `src/i18n/locales/en/plants.json` + `src/i18n/locales/es/plants.json` — content authoring target (118 × 2 locales × 2 recipe fields)
- `scripts/check-i18n-keys.mjs` — i18n parity gate template (Phase 19 added conditional `petToxicity.symptoms` extension at the end of the `whyRationale` block — Phase 20 mirrors that pattern)

### Smoke runner template
- `scripts/smoke-phase19.cjs` — 12,389 LOC three-tier sentinel runner; Phase 20 forks the structure, replaces TOX-* sentinels with FERT-* sentinels, preserves and extends the STRICT cross-phase regression block to include Phase 19 surfaces

### Project guardrails
- `CLAUDE.md` §Design System — theme tokens (colors, fonts, spacing, borderRadius, shadows) — locked, NEVER introduce new
- `CLAUDE.md` §Internationalization — voseo (regá/sacá/podés), `t('key')` only, no hardcoded user-facing strings
- `CLAUDE.md` §Pre-submit Checks — `npm run check:i18n-keys` + `npm run check:images` must pass; phase-content i18n keys participate in this gate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **EducationalSection collapse/expand pattern** (`src/components/MyPlantDetailModal.tsx`, Phase 14): Reanimated v4 `useSharedValue` + `useDerivedValue` + `useAnimatedStyle` + 250ms `Easing.inOut(Easing.ease)`. Reuse for the fertilize card tap-to-expand behavior. Chevron rotation 0°→90°.
- **`ModalSectionId` + `initialSection` prop + scroll-to mechanism** (`src/components/MyPlantDetailModal.tsx`, Phase 19): exact API surface preserved. Phase 20 routes fertilize-card taps via existing `'que-hacer'` value.
- **Three-tier smoke runner pattern** (`scripts/smoke-phase19.cjs`, Phase 19): PASS scaffold + SKIP placeholders + STRICT cross-phase regression. Phase 20 forks this verbatim.
- **`check-i18n-keys.mjs` conditional-field validation** (Phase 14 introduced for `careAction`/`whyRationale`; Phase 19 extended for `petToxicity.symptoms`). Phase 20 adds conditional validation for `fertilizer.industrialRecommendation`/`fertilizer.homemadeRecommendation` (when present in plantDatabase, must exist in EN+ES plants.json).
- **`seasonality.ts` warm/cold split** (Phase 5): drives existing `waterScheduleWarm`/`waterScheduleCold`; drives Phase 20's `fertilizeIntervalWarm`/`fertilizeIntervalCold` identically.
- **Task discriminator chain** (5 sites listed in canonical_refs): the v1.1 `'check_soil'` precedent (Phase 5) is the exact template for adding `'fertilize'`.
- **PlantCard tasks-row visual language** (`src/components/DayDetail.tsx` lines around `task.type === "water"`): existing styles for water/sun/outdoor task icons. Fertilize gets a similar icon container.
- **Notification body-line composition** (`src/utils/notificationScheduler.ts` lines 102-128): existing water/sun/outdoor body-parts pattern. Fertilize adds a 4th body-line branch.
- **Toast primitive** (`src/components/Toast.tsx`, Phase 18): NOT used in this phase but ready for Phase 22 GAM-01 fertilize-completion celebration toast.

### Established Patterns

- **Phase 14 char-limit-from-draft + voseo pre-sweep authoring discipline**: 250-char ceiling on `whyRationale`-style fields; voseo regex pre-sweep before commit; locale parity verified by jq key-count match.
- **Phase 14 per-field graceful degradation**: each sub-block within a section conditionally renders based on its backing field's presence. Section header stays visible if at least ONE sub-block has data.
- **Phase 19 distinct top-level i18n namespaces** (sansevieria-cilindrica precedent): for any future genus/species split with shared parent, use distinct top-level keys; never nested under shared parent.
- **Phase 14 EducationalSection per-modal-session collapse state**: `useState`, NOT AsyncStorage. Resets every modal close. Phase 20's fertilize card auto-expand-on-arrival uses a one-shot prop, not persistence.
- **Atomic commit per task** (GSD baseline): each plan's tasks commit individually; no bundled commits.
- **CRIT-1 deep-merge guard** in `useStorage.updatePlant` (Phase 14): prevents catalog-source values from silently overwriting user customizations. `fertilizeSchedule` participates: if user edits frequency manually, catalog-source defaults must NOT clobber.

### Integration Points

- **`Plant` type** (`src/types/index.ts`): adds `fertilizeSchedule?: { intervalDays: number; lastFertilized?: string }` (FERT-01).
- **`PlantDBEntry` type** (`src/types/index.ts`): adds `fertilizeIntervalWarm?: number`, `fertilizeIntervalCold?: number | null`, `fertilizer?: { type: 'industrial' | 'homemade' | 'both'; industrialRecommendation?: string; homemadeRecommendation?: string }` (FERT-02, FERT-07).
- **`Task` discriminator union**: adds `| 'fertilize'` (FERT-03).
- **Migration** (`src/utils/migration.ts`): for existing plants with no `fertilizeSchedule`, derive default from catalog entry's `fertilizeIntervalWarm` if `databaseId` resolves; else leave undefined (no task emission, no penalty).
- **Settings screen** (`src/screens/SettingsScreen.tsx`): new "Fertilize reminders" toggle under Notifications.
- **`SettingsScreen` notifications storage**: existing notification-prefs storage layer extends with `fertilizeNotifications: boolean` (default false).
- **MyPlantDetailModal `🌿 ¿Qué hacer?` section render** (Phase 14 site): the two-column water | fertilize layout lands here.
- **PlantCard `mode='tasks'` branch** (`src/components/PlantCard.tsx`, Phase 18 cleanup): fertilize task indicator lands here.

</code_context>

<specifics>
## Specific Ideas

- **Two-column visual parallel:** the user explicitly chose side-by-side `💧 Regá ...` | `🌱 Fertilizá ...` cards inside `🌿 ¿Qué hacer?` even though it's a one-off layout pattern within an otherwise single-column modal. The visual parallel between watering and fertilizing is the point — they read as a pair of related care actions.
- **Header always visible, deep content collapsed:** the fertilize card's frequency line acts like a teaser; tap reveals the recipe. Mirrors how a recipe card works in cookbook apps — always shows the dish name + cook time, expand for ingredients.
- **No `ModalSectionId` extension:** user-locked smallest-API-surface decision. Reuses Phase 19's mechanism without growing it.

</specifics>

<deferred>
## Deferred Ideas

- **Custom user-defined fertilizer schedules** (override catalog cadence) — future phase if user demand emerges; mark-done with manual interval works for power users via the existing override-detection pattern.
- **Per-plant fertilizer logging history** (which recipe used, when, growth observed) — Phase 21 (Plant Journal) is the natural home for this; fertilize entries can become a special-case `careTag` on `JournalEntry`.
- **Brand-specific fertilizer recommendations** (NPK product names) — explicitly OUT (FERT-07 lock); avoids endorsement liability.
- **"Skip this fertilize" workflow** — only mark-done in this phase. If user wants to skip without marking, they ignore the task.
- **Per-plant notification toggles** (mute fertilize reminders for plant X) — global toggle only in this phase.
- **Fertilize-completion celebration toast/haptic** — Phase 22 GAM-01/GAM-02 covers this for all task types including fertilize.
- **Watering-card tap-to-expand alignment** — Phase 20 introduces tap-to-expand only on the fertilize card. Aligning the watering card to match (e.g., expanded careAction.tip, hidden by default) is a polish-phase decision, not Phase 20.
- **Aligning the fertilize sub-block layout with future task types** (e.g., pruning, repotting) — those would be new task discriminators in future phases; for now, two-column water | fertilize is the locked layout.

</deferred>

---

*Phase: 20-fertilization-subsystem*
*Context gathered: 2026-05-09*
