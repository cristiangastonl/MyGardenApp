---
phase: 20-fertilization-subsystem
plan: 04
subsystem: ui-fertilize-card-and-action
tags: [fertilize, react-native, reanimated, plant-detail-modal, plant-card, useStorage, two-column-layout, collapsible, voseo, i18n]

# Dependency graph
requires:
  - phase: 20-fertilization-subsystem
    provides: getNextFertilizeDate + getSeasonalFertilizeInterval real impl from Plan 20-02; FertilizeCardProps + helper signatures locked from Plan 20-00; PROTECTED_USER_FIELDS extension for fertilizeSchedule from Plan 20-01 (deep-merge guard exercised here via fromUserEdit:true); 5-site discriminator sweep from Plan 20-03 (DayDetailModal isDone NESTED-path + onFertilizeDone REQUIRED prop already in place; CalendarScreen no-op closure ready for replacement)
  - phase: 14-educational-detail-modal
    provides: EducationalSection collapse primitives (Reanimated v4 useSharedValue + useDerivedValue + useAnimatedStyle + lazy-measure pattern + hasInteracted gate) — mirrored verbatim into FertilizeCard
  - phase: 18-plantcard-cleanup-mood-emoji
    provides: PlantCard 5-element budget + mode='tasks' && hasTasks gate + TaskButton sibling pattern — protected via STRICT cross-phase regression sentinels (preserved PASS=56)
  - phase: 19-pet-toxicity
    provides: ModalSectionId union + initialSection prop + scrollView ref + sectionLayouts mechanism (NOT extended — initialExpanded is orthogonal; ModalSectionId stays at 5 values per CONTEXT.md lock); PetToxicityBadge headerRight cluster preserved (PASS=85)
provides:
  - src/components/plant-detail/FertilizeCard.tsx real implementation (180 LOC up from 27 skeleton): Reanimated v4 useSharedValue + useDerivedValue + useAnimatedStyle + 180ms Easing.out(Easing.cubic) collapse animation; tap-to-expand on Pressable header; defaultExpanded prop drives initial open state; renders fertilizer.industrialRecommendation + homemadeRecommendation when present; cold-season dormancy header
  - src/hooks/useStorage.tsx fertilizePlant(id: string) action: marks lastFertilized=today; bootstraps schedule from catalog fertilizeIntervalWarm via getCatalogEntry when plant has databaseId but no fertilizeSchedule; uses fromUserEdit:true to bypass Plan 20-01 deep-merge guard (legitimate user-edit flow); no-op for custom plants without manual schedule
  - src/components/MyPlantDetailModal.tsx initialExpanded?: 'fertilize' prop wired through to FertilizeCard; `🌿 ¿Qué hacer?` section refactored into two-column water | fertilize flex-row with single-column graceful degradation (single child gets full row via flex:1); empty-state gate extended with hasFertilizeContent OR-clause (Pitfall 7); careCardsRow + careCard + careCardHalf + careCardFull + careCardHeader styles added (no new design tokens)
  - src/data/plantDatabase.ts getTranslatedPlant extended to resolve fertilizer.industrialRecommendation + homemadeRecommendation per locale (Phase 14 EDU-02 i18n indirection pattern)
  - src/components/PlantCard.tsx onFertilizeDone?: (plantId: string) => void prop sibling to onWater/onSunDone/onOutdoorDone; needsFertilizeToday + fertilizeDone booleans + extended hasTasks OR-clause; fertilize TaskButton renders inside existing mode==='tasks' && hasTasks gate AFTER outdoor sibling (5-element budget preserved per Pitfall 3)
  - src/screens/TodayScreen.tsx + PlantsScreen.tsx fertilizePlant action wired to <PlantCard onFertilizeDone> + <MyPlantDetailModal initialExpanded>; TodayScreen plantsWithTasks filter extended to include needsFertilizeToday (Rule 2 — plants whose ONLY task today is fertilize must surface)
  - src/screens/CalendarScreen.tsx Plan 20-03 no-op closure replaced with real onFertilizeDone={fertilizePlant}
  - 4 SKIPs flipped to PASS in smoke-phase20: FERT-06.FertilizeCard.reanimated-primitives + FERT-06.FertilizeCard.180ms-tuning + FERT-06.MyPlantDetailModal.two-column-layout + FERT-06.MyPlantDetailModal.initialExpanded-prop + FERT-06.PlantCard.fertilize-task-row (5 sentinels total)
affects: [20-06, 20-07, 20-08, 20-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reanimated v4 collapsible primitives mirrored verbatim from EducationalSection.tsx (180ms Easing.out(Easing.cubic) — tuned 2026-05-06 device test; deliberate deviation from CONTEXT.md's stale 250ms guardrail per RESEARCH §State of the Art Open Question 1)"
    - "Two-column flex-row with alignItems:'stretch' single-column graceful degradation: single child + flex:1 = full row width without awkward empty placeholder (Pitfall 5 — RN flexbox single-child handling, zero new dependencies)"
    - "One-shot initialExpanded prop pattern (NOT AsyncStorage; modal close resets via parent's setDetailPlant(null)) — orthogonal to initialSection (Phase 19 TOX-04 mechanism unchanged)"
    - "Auto-expand-on-arrival via inline IIFE in modal call site (no useMemo for trivial derivation) — keeps the prop derivation co-located with detailPlant state"
    - "Deep-merge guard opt-in via fromUserEdit:true (Plan 20-01 → Plan 20-04 pipeline): user-tap mark-fertilize-done is the legitimate user-edit flow that bypasses CRIT-1 catalog-clobber protection"
    - "Pitfall 4 hasInteracted gate (mirrors EducationalSection): while !hasInteracted, body renders with height:'auto' so RN measures naturally on Android; after first toggle the animated height takes over driven by measuredHeight + open shared values"
    - "Bootstrapping fertilizeSchedule on first-fertilize: when plant.fertilizeSchedule is absent BUT plant.databaseId resolves to a catalog entry with fertilizeIntervalWarm, the action seeds {intervalDays: warm, lastFertilized: today} — the 'first-fertilize' bootstrap path"

key-files:
  created: []
  modified:
    - src/components/plant-detail/FertilizeCard.tsx (skeleton → real impl, +153 lines: Reanimated v4 collapse + tap-to-expand + recipe rendering + cold-season dormancy + Pitfall 4 hasInteracted gate)
    - src/hooks/useStorage.tsx (+30 lines: interface entry + fertilizePlant useCallback + value object entry + dependency array entry)
    - src/components/MyPlantDetailModal.tsx (+72 lines: FertilizeCard import + initialExpanded prop + hasFertilizeContent boolean + fertilizerIndustrialText + fertilizerHomemadeText + careCardsRow flex-row JSX + 5 new styles)
    - src/data/plantDatabase.ts (+12 lines: getTranslatedPlant extended with fertilizer.industrialRecommendation + homemadeRecommendation per-locale resolution)
    - src/components/PlantCard.tsx (+25 lines: getNextFertilizeDate import + onFertilizeDone prop + 3 booleans + extended hasTasks OR-clause + fertilize TaskButton render after outdoor sibling)
    - src/screens/TodayScreen.tsx (+24 lines: getNextFertilizeDate + getCatalogEntry imports + fertilizePlant destructure + plantsWithTasks filter extension + onFertilizeDone wiring + initialExpanded IIFE)
    - src/screens/PlantsScreen.tsx (+16 lines: getNextFertilizeDate + getEffectiveSeason + getCatalogEntry + isSameDay imports + fertilizePlant + climateOverride destructure + onFertilizeDone wiring + initialExpanded IIFE)
    - src/screens/CalendarScreen.tsx (-1 +1 line: no-op closure replaced with fertilizePlant action; fertilizePlant added to useStorage destructure)

key-decisions:
  - "180ms Easing.out(Easing.cubic) deliberately overrides CONTEXT.md's 250ms guardrail: the in-repo EducationalSection.tsx tuning (2026-05-06 device test) is the source of truth. Code comment in FertilizeCard.tsx explicitly documents the deviation. Smoke runner sentinel FERT-06.FertilizeCard.180ms-tuning enforces the 180ms value via /COLLAPSE_DURATION\\s*=\\s*180|duration:\\s*180/."
  - "FertilizeCard accepts industrialText + homemadeText as STRING props (NOT entry's raw fields): decouples i18n resolution from the component, mirroring EducationalSection's caller-resolves-text pattern. Caller (MyPlantDetailModal) does the resolution via getTranslatedPlant which is now extended to include fertilizer.{industrial,homemade}Recommendation per Phase 14 EDU-02 i18n indirection."
  - "getTranslatedPlant extended (Rule 2 deviation — plan-checker MINOR advisory #2 honored): without this extension, EN locale would silently show ES default text for fertilizer recipes after Plans 20-06/07/08 author the per-locale plants.json keys. Extension lands NOW with default-value fallback to plantDatabase ES source string (existing nutrients/whyRationale precedent)."
  - "TodayScreen plantsWithTasks filter extended with needsFertilizeToday (Rule 2 — plan body did not explicitly call this out, but plants whose ONLY task today is fertilize would silently miss the 'tasks today' list otherwise — broken behavior). Three lines of inline computation (getCatalogEntry + getNextFertilizeDate + isSameDay) added inside the existing useMemo."
  - "PlantCard onFertilizeDone wired to PlantsScreen <PlantCard mode='collection'> for consistency with plan must-have spec, even though mode='collection' branch does not render the fertilize TaskButton: future-proofs the prop pipeline if PlantsScreen ever switches modes; matches sibling onWater/onSunDone/onOutdoorDone wiring pattern."
  - "Auto-expand-on-arrival initialExpanded prop derived via inline IIFE at the modal call site (NOT a useMemo): trivially cheap (one getCatalogEntry + one getNextFertilizeDate + one isSameDay call); avoids adding a useMemo dependency on detailPlant + today + effectiveSeason + climateOverride. Re-evaluates on every parent re-render, but PlantsScreen + TodayScreen re-renders are not the hot path — modal open/close is the relevant tick."
  - "fertilizePlant action bootstraps schedule from catalog when plant.fertilizeSchedule is absent BUT plant.databaseId resolves to fertilizeIntervalWarm: implements the 'first-fertilize' UX (user taps fertilize button on a catalog plant that never had a fertilize schedule before). Custom plants (no databaseId) AND plants without catalog fertilizeIntervalWarm short-circuit to no-op (Success Criterion 5 — no fertilize task = no health-axis penalty AND no bootstrap surprise)."

patterns-established:
  - "Mirror-verbatim collapsible component pattern: when introducing a new collapsible card type (FertilizeCard), copy EducationalSection's primitives literally (useSharedValue + useDerivedValue + useAnimatedStyle + hasInteracted gate + lazy-measure onLayout + 180ms tuning). Keeps animation behavior consistent across the modal."
  - "Two-column-with-graceful-degradation pattern (RN flexbox alignItems:'stretch' + flex:1 children): single child = full row, two children = equal-height halves. No conditional layout switching needed. Reusable for any future side-by-side care-action surface (pruning + fertilizing, watering + misting, etc.)."
  - "One-shot initialExpanded prop pattern: parent computes the prop value from local state (detailPlant + today + season) at modal-open time; modal close resets to undefined via parent's setDetailPlant(null); FertilizeCard's defaultExpanded prop drives initial useState. No persistence layer; mirrors Phase 14 EducationalSection's per-modal-session expand state."
  - "Caller-resolves-i18n-text pattern: when a child component needs locale-resolved text from the catalog, the CALLER does the resolution via getTranslatedPlant and passes the result as STRING props (not entry-shaped props). Decouples the child from i18n internals; mirrors how EducationalSection consumes careAction.fixed/soilCheck."

requirements-completed: []  # FERT-06 multi-plan closure: FertilizeCard real impl + modal two-column + PlantCard task-row landed in this plan; full FERT-06 closure waits for Plans 20-06/07/08 to author the per-locale plants.json keys (recipe text). FERT-03.TaskButton.fertilize-render correctly remains SKIP (Plan 20-03 documented this as PASS-after-Plan-20-04 expectation, but the smoke runner's regex actually checks TaskButton.tsx source for 'fertilize' literal — TaskButton stays generic per Phase 18 design, so the sentinel staying SKIP is acceptable; the FERT-06.PlantCard.fertilize-task-row sentinel which DOES check PlantCard's onFertilizeDone wiring did flip to PASS).

# Metrics
duration: 12 min
completed: 2026-05-10
---

# Phase 20 Plan 04: FERT-06 PlantCard + FertilizeCard + Two-Column Modal Summary

**Wave 3 UI layer green — FertilizeCard skeleton replaced with real Reanimated v4 collapsible (180ms Easing.out(Easing.cubic) mirrors EducationalSection); MyPlantDetailModal `🌿 ¿Qué hacer?` section refactored into two-column water | fertilize flex-row with single-column graceful degradation; PlantCard mode='tasks' branch gains fertilize TaskButton sibling (5-element budget preserved); useStorage.fertilizePlant action exposed and wired through TodayScreen + PlantsScreen + CalendarScreen consumers. 4 atomic task commits + 1 plan-doc commit. 5 FERT-06 sentinels flipped SKIP→PASS. tsc-green throughout. Cross-phase Phase 18 (PASS=56) + Phase 19 (PASS=85) preserved.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-10T17:00:00Z
- **Completed:** 2026-05-10T17:12:00Z
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- `FertilizeCard.tsx` real implementation (180 LOC up from 27 skeleton):
  - Reanimated v4 `useSharedValue` + `useDerivedValue` + `useAnimatedStyle` collapse primitives (mirrored verbatim from `EducationalSection.tsx`)
  - 180ms `Easing.out(Easing.cubic)` collapse duration — deliberate deviation from CONTEXT.md's stale 250ms guardrail; documented in code comment per RESEARCH §State of the Art Open Question 1
  - Tap-to-expand on `Pressable` header (only when body has content); `defaultExpanded` prop drives initial state from `MyPlantDetailModal.initialExpanded === 'fertilize'`
  - `industrialText` + `homemadeText` as STRING props (caller resolves i18n via `getTranslatedPlant`)
  - Cold-season dormancy: when `getSeasonalFertilizeInterval` returns null, renders `🌱 Dormante — no fertilizar en frío` instead of frequency teaser
  - Pitfall 4 averted: `hasInteracted` gate keeps body at `height:'auto'` until first user tap, so Android measures naturally
  - Header always visible per CONTEXT.md decision: emoji + verb + frequency with `›` chevron when body has content

- `useStorage.fertilizePlant(id: string)` action exposed:
  - Marks `fertilizeSchedule.lastFertilized = today` (ISO `YYYY-MM-DD` via `formatDate`)
  - `fromUserEdit: true` opts out of Plan 20-01 deep-merge guard (user explicitly tapped — legitimate edit)
  - Bootstrap path: when plant has no `fertilizeSchedule` BUT has `databaseId` resolving to catalog entry with `fertilizeIntervalWarm`, action seeds `{ intervalDays: warm, lastFertilized: today }` — the 'first-fertilize' UX
  - Custom plants without manual schedule short-circuit to no-op (Success Criterion 5 preserved trivially)
  - Wired into the StorageActions interface, the value object, and the useMemo dependency array

- `MyPlantDetailModal` `🌿 ¿Qué hacer?` section refactored:
  - `initialExpanded?: 'fertilize'` prop added (orthogonal to `initialSection` — both flow through the modal independently)
  - `hasFertilizeContent` boolean joins existing 4-clause OR-of-presence empty-state gate (Pitfall 7 — prevents empty-section header on custom plants without fertilizer content)
  - Two-column water | fertilize layout: `careCardsRow` flex-row with `alignItems:'stretch'` (RN default cross-axis stretch → equal-height children); single-column graceful degradation via `flex:1` on the present child (Pitfall 5)
  - Water sub-block now wrapped in its own card (`careCard` + `careCardHeader` 💧 emoji + i18n `plantDetailModal.water`) when fertilize sibling is also present; falls back to single full-width card when only water OR only fertilize has content
  - 5 new styles added: `careCardsRow`, `careCard`, `careCardHalf`, `careCardFull`, `careCardHeader` — all use existing design tokens (`colors.waterBlue`, `rgba(0,0,0,0.03)` matching `nutrientsCardEdu`); no new design tokens introduced

- `getTranslatedPlant` extended (plan-checker MINOR advisory #2 honored):
  - Resolves `fertilizer.industrialRecommendation` + `homemadeRecommendation` per locale via `t(\`\${key}.fertilizer.industrialRecommendation\`)` with default-value fallback to plantDatabase ES source string
  - Mirrors Phase 14 EDU-02 i18n indirection pattern; pre-Plan-20-06/07/08 EN locale falls back to ES default (acceptable interim per existing nutrients precedent)

- `PlantCard` mode='tasks' branch gains fertilize TaskButton:
  - `onFertilizeDone?: (plantId: string) => void` prop (sibling to `onWater`/`onSunDone`/`onOutdoorDone`)
  - 3 new computed booleans (`nextFertilizeDate` / `needsFertilizeToday` / `fertilizeDone`) reuse `catalogEntryForTox` (Phase 19) to avoid duplicate `getCatalogEntry` calls
  - Extended `hasTasks` OR-clause: `needsWaterToday || needsSunToday || needsOutdoorToday || needsFertilizeToday`
  - Fertilize TaskButton renders INSIDE existing `mode === 'tasks' && hasTasks` gate, AFTER outdoor sibling — Pitfall 3 averted (5-element budget preserved; the row shrinks naturally when no fertilize task is due)
  - Uses `bgColor={colors.successBg}` + `textColor={colors.green}` + `icon="🌱"` + `label={t('plantCard.fertilize')}` — palette consistent with DayDetailModal fertilize button + MonthCalendar dotFertilize (Plan 20-03)

- Screen wiring:
  - `TodayScreen.tsx`: `fertilizePlant` destructured; passed as `onFertilizeDone` to `<PlantCard>` (mode='tasks'); `initialExpanded` derived via inline IIFE at `<MyPlantDetailModal>` call site; **plantsWithTasks filter extended with `needsFertilizeToday`** (Rule 2 — plants whose ONLY task today is fertilize must surface; otherwise the user would never see the fertilize TaskButton)
  - `PlantsScreen.tsx`: same pattern (mode='collection' on PlantCard so fertilize TaskButton has no visual effect, but prop wired for consistency); `initialExpanded` IIFE on MyPlantDetailModal site
  - `CalendarScreen.tsx`: replaces Plan 20-03 no-op closure with real `onFertilizeDone={fertilizePlant}` (the action from useStorage Task 1)

- Smoke runner status:
  - `node scripts/smoke-phase20.cjs` → PASS=46 FAIL=0 SKIP=3 (5 FERT-06 sentinels flipped this plan)
  - `npm run smoke:phase18` → PASS=56 FAIL=0 SKIP=0 (cross-phase regression preserved)
  - `npm run smoke:phase19` → PASS=85 FAIL=0 SKIP=0 (cross-phase regression preserved)
  - `npm run check:i18n-keys` → PASS — 118 catalog ids verified across en/es plants.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace FertilizeCard skeleton with real Reanimated v4 collapsible + add fertilizePlant action to useStorage** — `10e2f62` (feat)
2. **Task 2: Refactor MyPlantDetailModal `🌿 ¿Qué hacer?` section into two-column water | fertilize layout + add initialExpanded prop** — `18ce77e` (feat)
3. **Task 3: Add fertilize TaskButton + needsFertilizeToday boolean to PlantCard mode='tasks' branch + onFertilizeDone prop** — `d9b415b` (feat)
4. **Task 4: Wire onFertilizeDone + initialExpanded prop in PlantsScreen + TodayScreen + CalendarScreen** — `5fdbe07` (feat)

**Plan metadata commit:** to be added with SUMMARY.md + STATE.md + ROADMAP.md

## Files Created/Modified

- `src/components/plant-detail/FertilizeCard.tsx` (skeleton → real impl, +153 lines) — Reanimated v4 collapsible card with 180ms tuning, tap-to-expand, recipe rendering, cold-season dormancy, Pitfall 4 hasInteracted gate
- `src/hooks/useStorage.tsx` (+30 lines) — fertilizePlant action wired through interface + useCallback + value object + dependency array; bootstraps schedule from catalog when absent; uses fromUserEdit:true to bypass Plan 20-01 deep-merge guard
- `src/components/MyPlantDetailModal.tsx` (+72 lines) — FertilizeCard import + initialExpanded prop + hasFertilizeContent boolean + 5 new styles; `🌿 ¿Qué hacer?` section refactored with two-column flex-row + single-column graceful degradation
- `src/data/plantDatabase.ts` (+12 lines) — getTranslatedPlant extended to resolve fertilizer.industrialRecommendation + homemadeRecommendation per locale (Phase 14 EDU-02 pattern)
- `src/components/PlantCard.tsx` (+25 lines) — getNextFertilizeDate import + onFertilizeDone prop + 3 booleans + extended hasTasks + fertilize TaskButton render
- `src/screens/TodayScreen.tsx` (+24 lines) — fertilizePlant + onFertilizeDone wiring + initialExpanded IIFE; plantsWithTasks filter extended with needsFertilizeToday
- `src/screens/PlantsScreen.tsx` (+16 lines) — fertilizePlant + onFertilizeDone + initialExpanded IIFE
- `src/screens/CalendarScreen.tsx` (-1 +1 line + 1 destructure entry) — no-op closure replaced with real fertilizePlant action

## Decisions Made

- **180ms tuning over CONTEXT.md's 250ms:** Mirrored EducationalSection.tsx's tuned in-repo value (2026-05-06 device test) per RESEARCH §State of the Art Open Question 1. Code comment in FertilizeCard.tsx explicitly documents the deviation. Smoke runner sentinel `FERT-06.FertilizeCard.180ms-tuning` enforces the value via regex.

- **getTranslatedPlant extended (Rule 2 deviation):** Without this extension, EN locale would silently show ES default text for fertilizer recipes after Plans 20-06/07/08 author the per-locale keys. Extension lands NOW with default-value fallback (mirrors existing nutrients/whyRationale precedent).

- **TodayScreen plantsWithTasks filter extended (Rule 2 deviation):** Plan body did not explicitly call this out, but plants whose ONLY task today is fertilize would silently miss the "tasks today" list otherwise — the fertilize TaskButton would never render. Three lines of inline computation added inside the existing useMemo.

- **PlantsScreen onFertilizeDone wired despite mode='collection':** Future-proofs the prop pipeline; matches sibling onWater/onSunDone/onOutdoorDone wiring pattern; consistent with plan must-have spec.

- **Auto-expand IIFE (no useMemo):** Trivially cheap derivation (one getCatalogEntry + one getNextFertilizeDate + one isSameDay call); avoids adding a useMemo dependency array on detailPlant + today + effectiveSeason + climateOverride. Re-evaluates on every parent re-render but modal open/close is the relevant tick — not the hot path.

- **fertilizePlant action bootstraps from catalog:** Implements the 'first-fertilize' UX. Custom plants (no databaseId) AND plants without catalog fertilizeIntervalWarm short-circuit to no-op — Success Criterion 5 preserved (no task = no penalty AND no bootstrap surprise).

- **Caller-resolves-i18n-text pattern:** FertilizeCard accepts `industrialText` + `homemadeText` as STRING props (not entry's raw fields). Decouples the child from i18n internals; mirrors how EducationalSection consumes `careAction.fixed`/`soilCheck`.

- **No ModalSectionId extension:** CONTEXT.md lock honored — `initialExpanded` is orthogonal to `initialSection` (Phase 19 TOX-04 mechanism unchanged). The two props coexist.

- **Two-column flex-row (zero new dependencies):** RN flexbox `alignItems:'stretch'` (default) + `flex:1` on children gives equal-height side-by-side cards when both present; single child + `flex:1` = full-row width when only one has content (Pitfall 5).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Extended getTranslatedPlant in plantDatabase.ts to resolve fertilizer recipe text per locale**
- **Found during:** Pre-Edit-4 read of getTranslatedPlant (Task 2)
- **Issue:** Plan-checker MINOR advisory #2 flagged that without this extension, EN locale would silently show ES default text for fertilizer recipes after Plans 20-06/07/08 author the per-locale plants.json keys.
- **Fix:** Added 12 lines to getTranslatedPlant matching the existing Phase 14 EDU-02 pattern (careAction.fixed / soilCheck / placementRecommended / whyRationale). Default-value fallback to plantDatabase ES source string preserves pre-i18n-author behavior.
- **Files modified:** src/data/plantDatabase.ts
- **Commit:** 18ce77e (Task 2)

**2. [Rule 2 - Missing critical functionality] Extended TodayScreen plantsWithTasks filter to include needsFertilizeToday**
- **Found during:** Task 4 read pass on TodayScreen.tsx
- **Issue:** Plan body's must-have spec said "PlantsScreen + TodayScreen wire `onFertilizeDone={fertilizePlant}` on `<PlantCard>`" but did not explicitly mention extending the `plantsWithTasks` filter that gates which plants render with `mode='tasks'`. Plants whose ONLY due task today is fertilize would silently miss the list — the fertilize TaskButton would never render even though the FERT-06 sentinel passes.
- **Fix:** Added 3 lines of inline computation inside the existing `plantsWithTasks` useMemo (getCatalogEntry + getNextFertilizeDate + isSameDay) and extended the OR-clause from 3 to 4 conditions.
- **Files modified:** src/screens/TodayScreen.tsx
- **Commit:** 5fdbe07 (Task 4)

### Plan-body assumption corrected (per execution_note advisory #1)

**3. [Rule 1 - Bug-prevention] useStorage edit anchor verified at runtime**
- **Found during:** Task 1 Edit 2 (per execution_note advisory)
- **Issue:** Plan referred to lines 391-429 for updatePlant, but advised pre-edit grep verification of BOTH the interface declaration site AND the provider value site to avoid tsc fail.
- **Fix:** Pre-edit grep confirmed: interface entry inserted at line 56-58 (after updatePlant: ... void), useCallback body inserted after line 431 (after closing `}, [scheduleSave]);` of updatePlant), value object entry inserted at the existing alphabetical-style location (after `updatePlant,` and before `addNote,`), and dependency array entry added inline. All 3 sites updated atomically — tsc green on first run.
- **Files modified:** src/hooks/useStorage.tsx (3 sites updated)
- **Commit:** 10e2f62 (Task 1)

## Issues Encountered

None blocking. One brief speed-bump:

- **FertilizeCard write reverted by linter mid-edit:** The first Write of FertilizeCard real impl was reverted to skeleton state immediately after by an auto-linter (or unrelated process). Detected via the post-Write Read warning; re-Wrote the file successfully on the second attempt. No data loss; tsc-green and smoke-runner-green confirm the final state. Pattern: when Write is followed by a linter notification, re-verify the file content before proceeding.

- **FERT-03.TaskButton.fertilize-render staying SKIP:** Plan 20-03 SUMMARY noted "PASS-after-Plan-20-04 when PlantCard renders <TaskButton .../> for fertilize" — but the actual smoke runner regex checks `TaskButton.tsx` source for `'fertilize'` literal, not PlantCard's render of TaskButton. Since TaskButton stays generic (Phase 18 design — `bgColor: string` prop), the sentinel correctly remains SKIP. The FERT-06.PlantCard.fertilize-task-row sentinel (which DOES check PlantCard for `onFertilizeDone`) flipped to PASS. Documented above; not an issue, just a smoke runner regex/intent mismatch carried forward from Plan 20-03.

## Verification Results (Final)

All gates green:
- `npx tsc --noEmit` → exit 0
- `node scripts/smoke-phase20.cjs` → PASS=46 FAIL=0 SKIP=3, exit 0
  - 5 FERT-06 sentinels flipped SKIP→PASS this plan: FertilizeCard.reanimated-primitives + FertilizeCard.180ms-tuning + MyPlantDetailModal.two-column-layout + MyPlantDetailModal.initialExpanded-prop + PlantCard.fertilize-task-row
  - Remaining 3 SKIPs intentional and owned by other plans: FERT-02.catalog (Plan 20-06/07/08 catalog content), FERT-03.TaskButton.fertilize-render (regex-mismatch carried from Plan 20-03 — TaskButton stays generic by design), FERT-07.checkScript (Plan 20-09 check-i18n-keys extension)
- `npm run smoke:phase18` → PASS=56 FAIL=0 SKIP=0 (cross-phase regression preserved)
- `npm run smoke:phase19` → PASS=85 FAIL=0 SKIP=0 (cross-phase regression preserved)
- `npm run check:i18n-keys` → PASS — 118 catalog ids verified across en/es plants.json
- `grep -c "fertilizePlant" src/hooks/useStorage.tsx` → 4 (interface + useCallback declaration + value object + dependency array)
- `grep -c "useSharedValue\|useDerivedValue" src/components/plant-detail/FertilizeCard.tsx` → 4 (1 measuredHeight + 1 open + 2 derived values)
- `grep -qE "COLLAPSE_DURATION = 180" src/components/plant-detail/FertilizeCard.tsx` → match
- `grep -qE "Easing\.out\(Easing\.cubic\)" src/components/plant-detail/FertilizeCard.tsx` → match
- `grep -qE "careCardsRow" src/components/MyPlantDetailModal.tsx` → match
- `grep -qE "<FertilizeCard" src/components/MyPlantDetailModal.tsx` → match
- `grep -qE "defaultExpanded=\\{initialExpanded === 'fertilize'\\}" src/components/MyPlantDetailModal.tsx` → match
- `grep -qE "needsFertilizeToday" src/components/PlantCard.tsx` → match
- `grep -qE "label=\\{t\\('plantCard\\.fertilize'\\)\\}" src/components/PlantCard.tsx` → match
- `grep -c "fertilizePlant" src/screens/{Today,Plants,Calendar}Screen.tsx` → ≥3 (one per screen)
- `grep -c "initialExpanded" src/screens/{Today,Plants}Screen.tsx` → ≥2 (one per screen)

## Self-Check: PASSED

Verified files:
- FOUND: src/components/plant-detail/FertilizeCard.tsx (real impl, 180 LOC)
- FOUND: src/hooks/useStorage.tsx (fertilizePlant action wired)
- FOUND: src/components/MyPlantDetailModal.tsx (initialExpanded + careCardsRow + FertilizeCard usage)
- FOUND: src/data/plantDatabase.ts (getTranslatedPlant fertilizer extension)
- FOUND: src/components/PlantCard.tsx (onFertilizeDone + needsFertilizeToday + fertilize TaskButton)
- FOUND: src/screens/TodayScreen.tsx (fertilizePlant wiring + plantsWithTasks filter extension + initialExpanded IIFE)
- FOUND: src/screens/PlantsScreen.tsx (fertilizePlant wiring + initialExpanded IIFE)
- FOUND: src/screens/CalendarScreen.tsx (no-op replaced with fertilizePlant)

Verified commits:
- FOUND: 10e2f62 (Task 1 — FertilizeCard real impl + fertilizePlant action)
- FOUND: 18ce77e (Task 2 — modal two-column refactor + initialExpanded prop + getTranslatedPlant extension)
- FOUND: d9b415b (Task 3 — PlantCard fertilize TaskButton + needsFertilizeToday)
- FOUND: 5fdbe07 (Task 4 — TodayScreen + PlantsScreen + CalendarScreen wiring)

## Next Phase Readiness

**Plan 20-06 ready (Wave 4a — FERT-07 catalog content batch A):** UI surface is now content-ready. Plan 20-06 authors fertilizeIntervalWarm/Cold + fertilizer.{type,industrial,homemade} for batch A entries (interior tropicals + aromáticas) in plantDatabase.ts AND the per-locale plants.json keys (`<id>.fertilizer.industrialRecommendation` + `<id>.fertilizer.homemadeRecommendation`). With getTranslatedPlant already extended this plan, Plan 20-06 just needs to author the keys.

**Plan 20-07/08 ready (batches B + C):** Same pattern as 20-06 — content authoring against the now-stable UI surface.

**Plan 20-10 ready (manual device test):** Once 20-06/07/08 land, the manual checklist (Blocks A–E mirroring 19-07 SUMMARY) closes the phase.

**No blockers.** Cross-phase regression preserved (Phase 18 + 19 sentinels stay PASS). FertilizeCardProps API surface matches the lock from Plan 20-00 (extended with industrialText/homemadeText caller-resolved string props as documented in Plan 20-00 SUMMARY).

---
*Phase: 20-fertilization-subsystem*
*Completed: 2026-05-10*
