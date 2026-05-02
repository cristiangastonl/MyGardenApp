# Phase 6: UI Read-Side Propagation - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Propagate the precision-care model into every read-side UI surface: plant cards, plant detail modals, diagnosis context, "Hoy" tab. Translate `lightLevel` to user-facing labels (with indoor / outdoor variant copy), surface the current effective watering interval with a season qualifier, render a watering-mode badge per plant card, and add explicit empty-state copy for soil_check plants on non-check-in days.

**No write-side work in this phase** — picker UIs, edit forms, onboarding location prompt, and edge-function payload changes belong to Phase 7. Phase 6 only renders what Phase 4 schema and Phase 5 utilities have already populated.

Locked from REQUIREMENTS.md: LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03.

</domain>

<decisions>
## Implementation Decisions

### Light-Level Label Translation (LIGHT-06, LIGHT-07)
- **Indoor/outdoor switch source:** `plant.typeName` / category. `interior` → indoor labels ("Luz brillante indirecta"); `exterior`, `aromaticas`, `huerta`, `frutales` → outdoor labels ("Sol pleno", "Sol parcial", "Semi sombra", "Sombra"). No new schema field; reuses existing category data.
- **i18n namespace:** New top-level `lightLevel.*` block with `indoor.{direct|bright_indirect|medium_indirect|low}` and `outdoor.{direct|bright_indirect|medium_indirect|low}` subkeys. Both EN and ES (es-AR voseo). Mirrors existing namespacing convention (`tasks.*`, `notifications.*`).
- **Display format:** Plain translated label string only — no icon, no placement hint. The placement-hint affordance (e.g., "Junto a ventana sur") belongs to the Phase 7 picker, not the read-side.
- **Fallback when `lightLevel` undefined:** Defensive ladder — `plant.lightLevel` → `sunHoursToLightLevel(plant.sunHours)` → `bright_indirect` safe default. Reuses Phase 4 `migration.ts` mapper (no new mapper). Same pattern Phase 4 Plan 04 established across 5 consumers.
- **Surfaces touched:** `PlantCard`, `PlantDetailModal`, `MyPlantDetailModal`, `PlantHealthDetail`, `PlantDiagnosisModal` (user-visible light row only — AI payload shape preserved per Phase 4 Plan 04 / Phase 7 territory).

### Season Badge Display (SEASON-05)
- **Placement in PlantDetail:** Same line as the next-water info — single row "Cada 5 días — temporada cálida" (literal SC3 copy). Avoids new section / chip clutter.
- **Visual style:** Inline text, em-dash separator, season qualifier in `colors.textSecondary`. No pill chip, no accent background.
- **Wording:** `"temporada cálida"` / `"temporada fría"` / `"trópico"` (ES); `"warm season"` / `"cold season"` / `"tropical"` (EN). Locale-stable, matches success-criteria copy. Calendar-season terms ("verano"/"invierno") rejected — confusing across hemispheres.
- **PlantCard scope:** No season badge on the card. Card already shows the watering-mode badge with current-season interval baked in; second season label would be redundant. Detail-only.
- **Effective interval source:** `getSeasonalInterval(plant, currentSeason)` from Phase 5 `seasonality.ts` — same SSOT scheduler/health/tasks already use.
- **Tropical zone note:** When `currentSeason === 'tropical'`, badge reads "trópico" / "tropical". Interval is always the warm-schedule value (per Phase 5 SEASON-02 lock).

### Watering-Mode Badge on PlantCard (UX-02)
- **Position:** Replaces the existing watering-text line on `PlantCard`. One source of watering info per card — no duplicated copy.
- **Format (`fixed` mode):** `"💧 Cada {N}d"` where `N` is the **current-season** interval (warm if season warm/tropical, cold if season cold). Matches SC4 copy literally.
- **Format (`soil_check` mode):** `"🤚 Por chequeo"` — fixed string, no interval shown (interval would be misleading for a check-in plant).
- **Visibility:** Always visible, regardless of whether a task is due today. SC4 reads "plant cards show a watering-mode badge" without conditionals.
- **i18n keys:** New `plantCard.waterBadge.fixed` (with `{{days}}` interp) and `plantCard.waterBadge.soilCheck` keys. Emoji is part of the translated string (matches existing emoji-throughout convention).
- **Theme:** Reuses existing `PlantCard` text styles (no new color or shadow tokens).

### Soil-Check Empty State Copy (UX-03)
- **Render location:** TodayScreen task list — per soil_check plant that has no task today, render a per-plant info row alongside any tasks (and as the empty state when "Hoy" would otherwise be empty for that plant). Reads naturally inline with the existing task list.
- **Copy format:** `"Tu {{plantName}} está en modo chequeo. Te avisamos en {{days}} días."` (ES, literal SC5 copy) / `"Your {{plantName}} is in check mode. We'll remind you in {{days}} days."` (EN). Plant-name interpolation, days from `next-check-in - today`.
- **Aggregation:** Per-plant (one row per soil_check plant on a non-check-in day). Keeps Phase 5's mode-as-dispatcher invariant at the rendering layer too. Global aggregation rejected — loses per-plant context the user actually needs.
- **Visual treatment:** Subtle info-card row — `colors.bgSecondary` background, body font (`DMSans_400Regular`), leading `🤚` icon, padding/radius from `spacing` and `borderRadius` theme tokens. Non-intrusive; sits alongside `TaskButton` rows without competing for attention.
- **i18n key:** New `today.soilCheckEmptyRow` (with `{{plantName}}` and `{{days}}` interp). Voseo verified for ES.
- **Source of truth for `days`:** `getNextCheckInDate(plant, currentSeason)` derived from Phase 5 `getSeasonalInterval` + `lastWatered`. Pure utility, no React state.

### Cross-Cutting / Claude's Discretion
- **i18n key audit:** Phase 6 introduces ~12-16 new keys across `lightLevel.*`, `plantCard.waterBadge.*`, `today.soilCheckEmptyRow`, `plantDetail.seasonBadge.*`. Each must land in BOTH `en/common.json` AND `es/common.json` — keep parity (Phase 4 Plan 06 ES-voseo discipline applies).
- **Legacy `plantInfo.sunHours` / `plantInfo.waterEvery` keys:** Keep for one release (rollback safety, mirrors SCHEMA-08 stance for legacy schema fields). v1.2 removes them with a grep guard.
- **Diagnosis modal user-visible row:** Display new lightLevel label. AI payload shape (sunHours/waterEvery derived from v1.1 fields) is preserved per Phase 4 Plan 04 — Phase 7 rewrites the prompt.
- **Helper file decision:** Likely `src/utils/lightLabel.ts` (small, pure: `getLightLabel(plant, t)`) and `src/utils/wateringMode.ts` (`getWaterBadge(plant, season, t)`) — but the planner may inline if the call sites are few. Single source of truth for label strings either way.
- **Tropical-zone label sanity:** Verify "trópico" reads naturally inline with "Cada 5 días — trópico" (not "Cada 5 días — temporada trópica"). Same for EN ("— tropical").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — i18n rules (`t()` everywhere; voseo for ES), design system (`src/theme.ts` only; no new color tokens), emoji-throughout convention.

### Planning artifacts
- `.planning/PROJECT.md` — current milestone, validated requirements.
- `.planning/REQUIREMENTS.md` §Light Model (LIGHT-06, LIGHT-07), §Seasonality (SEASON-05), §User-facing Migration (UX-02, UX-03) — locked requirements for this phase.
- `.planning/phases/04-schema-foundation-migration-core/04-CONTEXT.md` — defensive fallback ladder pattern, two display-vs-scheduler light mappings.
- `.planning/phases/05-hemisphere-season-helpers-pure-utility-switchover/05-CONTEXT.md` — `getSeason(lat, date)` SSOT, `getSeasonalInterval(plant, season)`, mode-as-dispatcher invariant, fallback ladder for season computation.

### Codebase maps
- `.planning/codebase/STRUCTURE.md` — file layout, where to add `src/utils/lightLabel.ts` if extracted.
- `.planning/codebase/CONVENTIONS.md` — naming, i18n key patterns, theme usage.
- `.planning/codebase/ARCHITECTURE.md` — runtime flows for screens/modals.

### Source files of interest (read-side surfaces)
- `src/components/PlantCard.tsx` — water-text line replacement (UX-02 badge).
- `src/components/PlantDetailModal.tsx` — light row + season badge inline.
- `src/components/MyPlantDetailModal.tsx` — same surfaces, owned-plant variant.
- `src/components/PlantHealthDetail.tsx` — currently reads `lightLevel` and `sunHours`; switch to label-driven row.
- `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — user-visible light row only (AI payload preserved).
- `src/components/PlantDatabaseCard.tsx` — catalog browse card light/water labels (Phase 6 read-side).
- `src/screens/TodayScreen.tsx` — soil-check empty-state row alongside `TaskButton` rows (UX-03).
- `src/utils/seasonality.ts` (Phase 5) — `getWaterSeason`, `getSeasonalInterval` — single source of truth for season + interval.
- `src/utils/migration.ts` — `sunHoursToLightLevel` mapper for the legacy fallback rung.
- `src/types/index.ts` — `Plant.lightLevel`, `Plant.waterMode`, `Plant.waterSchedule.{warm,cold}` already present.

### i18n
- `src/i18n/locales/en/common.json` — add `lightLevel.*`, `plantCard.waterBadge.*`, `plantDetail.seasonBadge.*`, `today.soilCheckEmptyRow`.
- `src/i18n/locales/es/common.json` — same keys, voseo for any verb forms.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Plant.lightLevel`, `Plant.waterSchedule.{warm,cold}`, `Plant.waterMode` populated for all migrated plants (Phase 4 invariant).
- `getSeasonalInterval(plant, season)` from Phase 5 `seasonality.ts` — returns the right interval for current season; reuse for badge interval AND check-in day count.
- `getWaterSeason(latitude, date)` from Phase 5 — returns `'warm' | 'cold' | 'tropical'`. Already imported by `getTasksForDay`, `plantHealth`, `notificationScheduler`.
- `useStorage().location` — provides `latitude` for season computation; already destructured in TodayScreen + plant detail modals.
- `sunHoursToLightLevel` in `src/utils/migration.ts` — deterministic mapper for legacy fallback.
- Existing `plantInfo.sunHours` / `plantInfo.waterEvery` i18n keys — keep for one release (rollback safety per SCHEMA-08).
- Two-mapping convention from Phase 4 Plan 04 — display layer uses `{direct: 6, bright_indirect: 4, medium_indirect: 2, low: 0/1}` for hours-readable text; scheduler uses `{direct: 5, others: 0}`. Phase 6 reads neither directly — labels come from i18n via lightLevel string, not hours.

### Established Patterns
- **Defensive fallback ladder:** v1.1 field → legacy field → safe default. Apply uniformly to lightLevel reads in every consumer.
- **Single SSOT for season + interval:** `seasonality.ts` exports. No re-implementation in components.
- **i18n parity discipline:** Every new key MUST exist in both `en/common.json` AND `es/common.json`. ES voseo for verb forms.
- **No new theme tokens:** Reuse `colors.textSecondary`, `colors.bgSecondary`, `spacing.*`, `borderRadius.*`, `fonts.*` from `src/theme.ts`.
- **Emoji as first-class UI:** Watering-mode badges include emoji as part of the i18n string (`💧`, `🤚`).
- **Stateless utilities:** Pure functions only — no React, no context, no async I/O. Helpers like `getLightLabel(plant, t)` follow this.
- **Local modal visibility state:** Modals manage their own visibility — no nested navigators (CONVENTIONS.md).

### Integration Points
- `PlantCard.tsx` — currently renders watering text via `t('plantInfo.waterEvery', { days: getNextWaterDate-derived })`. Replace with new badge component / inline call. **MUST** use season-aware interval, not hardcoded warm.
- `PlantDetailModal.tsx` & `MyPlantDetailModal.tsx` — currently render light row via `t('plantInfo.sunHours', { hours })`. Replace with light-level label + new season-aware interval row.
- `PlantHealthDetail.tsx` — already has lightLevel awareness from Phase 4. Verify the user-facing label uses new i18n keys, not raw hours.
- `PlantDiagnosis/PlantDiagnosisModal.tsx` — user-visible plant info section uses light-level label. AI payload preserved (Phase 7 rewrites prompt).
- `TodayScreen.tsx` — task list (currently `TaskButton` rows) gains soil-check empty-row rendering when a soil_check plant has no task today. Latitude from `useStorage().location` → season → next-check-in date.
- `MonthCalendar.tsx`, `DayDetail.tsx`, `DayDetailModal.tsx` — already handle `'check_soil'` task type after Phase 5 Plan 05. Phase 6 does NOT add empty-state copy here (calendar empty days are a calendar-level concern, not per-plant).
- `App.tsx` two `AppContent` paths (MVP / AUTH) — both already destructure `location` (Phase 5 Plan 05 ratchet). No App.tsx changes expected in Phase 6.

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" (Phase 4 lock, carried) — prefer simple, direct rendering. Inline labels over abstract badge components if the call sites are few.
- Single SSOT for season + interval (Phase 5 invariant) — extends to read-side. Components compute via shared utility, never re-implement season → interval lookup.
- "Plant.lightLevel populated for all migrated plants" — primary read path is the v1.1 field. Defensive fallback via `sunHoursToLightLevel` is for safety.
- Emoji-throughout convention applies to badges. `💧` for fixed water mode, `🤚` for soil_check, both rendered via i18n string interpolation (translatable, but emoji constant across locales).

</specifics>

<deferred>
## Deferred Ideas

- **Light-level icon set** — purely textual labels for v1.1; iconography deferred until a designer pass.
- **Placement hint inline ("Junto a ventana sur")** — Phase 7 picker territory; not a read-side concern.
- **PlantCard season badge** — rejected; mode badge already encodes current-season interval. Revisit if telemetry shows confusion.
- **Global aggregated soil-check summary card** — rejected; per-plant context wins. Revisit if user has 5+ soil_check plants and Hoy gets noisy.
- **Calendar-day empty-state copy for soil_check plants** — out of scope; calendar empty days are a calendar concern, not per-plant. Revisit if data shows users miss check-ins from calendar view.
- **Diagnosis edge-function payload rewrite** — Phase 7 (LIGHT-05 territory). Phase 6 only updates user-visible row.
- **Removal of legacy `plantInfo.sunHours` / `plantInfo.waterEvery` i18n keys** — v1.2, with grep guard (mirrors SCHEMA-08 cleanup stance).
- **Two-button check-in completion ("estaba húmeda" / "regué")** — deferred to v2.0 (Phase 5 carried).

</deferred>

---

*Phase: 06-ui-read-side-propagation*
*Context gathered: 2026-05-01*
