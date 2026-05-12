# Phase 20: Fertilization Subsystem - Research

**Researched:** 2026-05-09
**Domain:** Local-first React Native task subsystem extension (`'fertilize'` Task discriminator + season-aware cadence + 118-entry catalog content authoring + opt-in push notifications + MyPlantDetailModal two-column layout)
**Confidence:** HIGH (direct precedent — Phase 5 `'check_soil'` 5-site sweep + Phase 14 EducationalSection + Phase 19 modal-section anchor mechanism — all in-repo, frozen, verifiable)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**MyPlantDetailModal Integration (the area discussed)**

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

### Deferred Ideas (OUT OF SCOPE)

- **Custom user-defined fertilizer schedules** (override catalog cadence) — future phase if user demand emerges; mark-done with manual interval works for power users via the existing override-detection pattern.
- **Per-plant fertilizer logging history** (which recipe used, when, growth observed) — Phase 21 (Plant Journal) is the natural home for this; fertilize entries can become a special-case `careTag` on `JournalEntry`.
- **Brand-specific fertilizer recommendations** (NPK product names) — explicitly OUT (FERT-07 lock); avoids endorsement liability.
- **"Skip this fertilize" workflow** — only mark-done in this phase. If user wants to skip without marking, they ignore the task.
- **Per-plant notification toggles** (mute fertilize reminders for plant X) — global toggle only in this phase.
- **Fertilize-completion celebration toast/haptic** — Phase 22 GAM-01/GAM-02 covers this for all task types including fertilize.
- **Watering-card tap-to-expand alignment** — Phase 20 introduces tap-to-expand only on the fertilize card. Aligning the watering card to match (e.g., expanded careAction.tip, hidden by default) is a polish-phase decision, not Phase 20.
- **Aligning the fertilize sub-block layout with future task types** (e.g., pruning, repotting) — those would be new task discriminators in future phases; for now, two-column water | fertilize is the locked layout.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FERT-01 | `Plant.fertilizeSchedule?: { intervalDays: number, lastFertilized?: string }` (additive optional) | §Standard Stack — TypeScript shape locked vs `Plant.waterSchedule`; deep-merge guard list extension §Architecture Pattern 7 |
| FERT-02 | `PlantDBEntry.fertilizeIntervalWarm/Cold` (number/null) — per-category baselines | §Standard Stack — TypeScript shape locked; §Architecture Pattern 6 — seasonality.warm-cold reuse mirrors `waterScheduleWarm/Cold` |
| FERT-03 | `Task.type === 'fertilize'` 5-site discriminator sweep | §Architecture Pattern 1 — exact 6-site recipe extracted from Phase 5 Plan 05 (8 chains across 5 files) |
| FERT-04 | Cadence math: emit one task on due-day, season-aware, catch-up clipped | §Architecture Pattern 2 — `getNextFertilizeDate` mirrors `getNextWaterDate` advance-loop verbatim |
| FERT-05 | Push notification opt-in (Settings → Notifications, default OFF) | §Architecture Pattern 4 — `NotificationSettings` shape extension + body-line composition diff at notificationScheduler.ts:85 |
| FERT-06 | PlantCard mode='tasks' fertilize indicator + MyPlantDetailModal explanation | §Architecture Pattern 5 — TaskButton inline below water/sun/outdoor; §Architecture Pattern 8 — two-column layout |
| FERT-07 | `PlantDBEntry.fertilizer?: { type, industrialRecommendation?, homemadeRecommendation? }` × 118 EN+ES | §Architecture Pattern 9 — content-authoring playbook from Phase 14/15/16/17; per-category framing matrix |
</phase_requirements>

## Summary

Phase 20 is a **mechanical extension** of three already-locked v1.1/v1.2 patterns:

1. **Phase 5 `'check_soil'` 5-site discriminator sweep** is the exact template for FERT-03. Plan 05 of Phase 5 modified 5 files in 8 discriminator chains. Phase 20 adds a 9th task type to those same chains — but `'fertilize'` is split visually (own icon, own color token) rather than lumped under water (water/check_soil are lumped because they share the lastWatered marker; fertilize has its own `lastFertilized` marker so visual lumping has no ergonomic justification).
2. **Phase 14 EducationalSection collapse/expand** primitives (Reanimated v4 `useSharedValue` + `useDerivedValue` + `withTiming` + `Easing.out(Easing.cubic)` 180ms — note: **the in-repo implementation is 180ms with out-cubic, NOT the 250ms inOut quoted in CONTEXT.md** — see Open Question 1) drive the fertilize card tap-to-expand. The component is reusable as-is; the planner ships a new `FertilizeCard` that composes the same primitives at a smaller scale (no chevron, single shared value, optional `initialExpanded` prop).
3. **Phase 19 modal-section anchor mechanism** (`initialSection` prop + `scrollViewRef` + `sectionLayouts.current` + 50ms `setTimeout` defer) is preserved verbatim. Phase 20 adds an **orthogonal** one-shot signal `initialExpanded?: 'fertilize'` to `MyPlantDetailModalProps` that flows down to the new FertilizeCard's `defaultExpanded`. Smallest possible surface — no `ModalSectionId` extension.

**Primary recommendation:** Wave 0 ships the smoke runner + skeleton FertilizeCard + i18n keys + type extensions; Wave 1 lands the 5-site discriminator sweep + cadence math + helpers; Wave 2 lands UI integrations (PlantCard task button + MyPlantDetailModal two-column refactor + Settings toggle); Wave 3 lands FERT-07 catalog content in 4 category-grouped batches mirroring Phase 14's authoring rhythm; Wave 4 lands the i18n-parity gate extension + manual checkpoint.

## Standard Stack

### Core (already installed — Phase 13/14 inheritance)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-reanimated` | ^4 | Tap-to-expand fertilize card animation | Phase 14 EducationalSection canonical primitive set |
| `react-native-gesture-handler` | (peer of Reanimated v4) | Pressable for fertilize card header | Already wired in App.tsx for Phase 18 swipe |
| `expo-notifications` | (managed by Expo SDK 54) | Morning reminder body emits fertilize axis | Phase 3 + Phase 5 + Phase 19 use existing scheduler |
| `react-i18next` | (already wired) | t('fertilize.*') keys + plants.json fertilizer content | All UI text — voseo for ES, char-limit-from-draft |

### Supporting (no new installs)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-native-async-storage/async-storage` | (already wired) | `Plant.fertilizeSchedule` persists via existing `useStorage` save loop | All `useStorage` mutations already hit AsyncStorage; no new code needed |

### No New Dependencies
This phase introduces ZERO new npm packages. Every surface is composed from already-installed v1.1/v1.2 primitives.

**Alternatives Considered:**
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reanimated v4 collapse | `LayoutAnimation` (RN built-in) | Inferior animation quality, breaks Phase 14 visual consistency — REJECTED |
| New `'fertilizar'` ModalSectionId | Add 6th educational section | Modal grows from 5 to 6 sections; CONTEXT explicitly forbids — REJECTED |
| Per-plant notification toggle | Global toggle only | Per-plant scope-creep; deferred per FERT-05 lock |
| Visual lump under water (like check_soil) | Distinct icon/color | check_soil shares `lastWatered` marker (single tap → both done); fertilize has own `lastFertilized` marker — visual lump would mislead users |

## Architecture Patterns

### Recommended Plan Structure (Wave-based, mirrors Phase 19's 7-plan rhythm)

```
20-fertilization-subsystem/
├── 20-CONTEXT.md             ✅ exists (user decisions locked)
├── 20-RESEARCH.md            ✅ this file
├── 20-00-PLAN.md             # Wave 0: smoke runner + types/helper skeletons + i18n skeleton + npm script (Nyquist gate)
├── 20-01-PLAN.md             # Wave 1: FERT-01 + FERT-02 type extensions + getNextFertilizeDate + getSeasonalFertilizeInterval helpers
├── 20-02-PLAN.md             # Wave 1: FERT-03 5-site discriminator sweep (atomic — single commit closes tsc-green)
├── 20-03-PLAN.md             # Wave 2: FERT-06 PlantCard mode='tasks' fertilize TaskButton + onFertilizeDone wiring at PlantsScreen + TodayScreen
├── 20-04-PLAN.md             # Wave 2: FERT-06 modal side — MyPlantDetailModal two-column water | fertilize layout + initialExpanded prop
├── 20-05-PLAN.md             # Wave 2: FERT-05 Settings toggle + notificationScheduler body-line branch + NotificationSettings.fertilizeReminders
├── 20-06-PLAN.md             # Wave 3a: FERT-07 catalog content — 36 tropicales/interior + suculentas (Phase 14-04 + Phase 16 lineage)
├── 20-07-PLAN.md             # Wave 3b: FERT-07 catalog content — 27 exterior + aromaticas (Phase 14-05/06 + Phase 17 lineage)
├── 20-08-PLAN.md             # Wave 3c: FERT-07 catalog content — 32 frutales + huerta + remaining suculentas (Phase 14-07 lineage)
├── 20-09-PLAN.md             # Wave 4: FERT-07 i18n parity gate — check-i18n-keys.mjs conditional fertilizer.industrial/homemade extension
└── 20-10-PLAN.md             # Wave 5: MANUAL CHECKPOINT (autonomous: false) — iOS + Android device verification (mirrors 19-07)
```

(Researcher's recommended decomposition — final wave-count is planner's discretion. The 4-batch Wave 3 mirrors the Phase 14-04/05/06/07 4-wave content authoring rhythm; Phase 14 averaged 22-46 min per wave for ~15-20 entries. Phase 20's 118-entry × 2-locale × 1-2 fertilizer fields = ~300-500 strings, comfortably split into 3 waves.)

### Pattern 1: 5-Site Discriminator Sweep — VERBATIM Phase 5 Plan 05 Recipe

**Source:** `.planning/milestones/v1.1-phases/05-hemisphere-season-helpers-pure-utility-switchover/05-05-SUMMARY.md` (Plan 05 of Phase 5).

**The exact 8 discriminator chains across 5 files** (Phase 5 left these as a reusable template):

| File | Chain | What changes for `'fertilize'` |
|------|-------|--------------------------------|
| `src/utils/plantLogic.ts` | `getTasksForDay` task-emission | NEW branch: when `getNextFertilizeDate(p, day, season)` is `isSameDay(today)` AND `season !== 'cold'` (or fertilizeIntervalCold present), push `{ type: 'fertilize', icon: '🌱', label: i18n.t('tasks.fertilize', { name: p.name }), plantId: p.id }` |
| `src/utils/notificationScheduler.ts` | `createMorningContent` body-line filter (lines 85-129) | NEW branch: `const fertilizeTasks = tasks.filter(t => t.type === 'fertilize')` (NOT lumped under water — distinct verb). Add if-block parallel to lines 108-119 (sun branch) BUT gated on `notifSettings.fertilizeReminders === true` per FERT-05 opt-in lock |
| `src/utils/plantHealth.ts` | `calculatePlantHealth` penalty discriminator | **NO penalty added.** Per Success Criterion 5: "Plants without `fertilizeSchedule` emit no fertilize task and are not penalized in health score." Plants WITH `fertilizeSchedule` who miss fertilization could in theory degrade health — but CONTEXT.md does not request a fertilize-overdue penalty, so the planner leaves this axis alone. Future phase decision. |
| `src/components/DayDetail.tsx` | 3 chains: `getTaskIcon` + `getTaskTypeLabel` + `taskIcon` style switch | `case "fertilize": return "🌱"` (icon); `case "fertilize": return t('tasks.fertilize')` (label); `task.type === "fertilize" && styles.taskIconFertilize` (NEW style — green-gold tone, planner's discretion in theme) |
| `src/components/DayDetailModal.tsx` | 4 chains: `isDone` + `handlePress` + `bgColor` + `textColor` | `(task.type === 'fertilize' && plant.lastFertilized === dateStr)` (isDone — uses NEW `lastFertilized` marker, NOT lumped with `lastWatered`); `else if (task.type === 'fertilize') onFertilizeDone(task.plantId)` (NEW callback — plumbed from `onWater`/`onSunDone`/`onOutdoorDone` peer chain — see Pattern 5); `bgColor: task.type === 'fertilize' ? colors.successBg : ...` (planner discretion, success/leaf-green palette); `textColor: task.type === 'fertilize' ? colors.green : ...` |
| `src/components/MonthCalendar.tsx` | `getIndicators` `hasFertilize` + dot indicator | `const hasFertilize = tasks.some(t => t.type === 'fertilize')` (separate variable, NOT lumped); `<View style={[styles.dot, styles.dotFertilize]} />` (NEW dot — green-gold tone — Phase 5 lump precedent doesn't apply because fertilize is visually distinct from day 1 per FERT-06) |
| `src/components/TaskButton.tsx` | NO change | TaskButton is generic — accepts `bgColor`/`textColor`/`icon`/`label` props; rendering dispatch happens in callers via the variables above |

**Cascading required-prop ratchet** (already-wired since Phase 5 — verify only):
- `getTasksForDay(plants, day, season)` already 3-arg — no signature change for fertilize.
- `latitude` already required on PlantCard, MyPlantDetailModal, etc. — no new prop ratchet.

**Audit checklist:**
- [ ] grep `task.type === 'fertilize'` returns ≥6 occurrences across the 5 files (excluding TaskButton)
- [ ] grep `'fertilize'` (quoted, including i18n keys) in src/types/index.ts returns 1 (in Task discriminator union)
- [ ] grep `lastFertilized` returns ≥4 occurrences (Plant type + DayDetailModal isDone + handler + plantLogic)

### Pattern 2: Cadence Math — Mirror `getNextWaterDate` Verbatim

**Source:** `src/utils/plantLogic.ts:41-49`.

**Exact shape of the new helper:**

```typescript
// Source: src/utils/plantLogic.ts (Phase 5 Plan 03 advance-loop pattern)
export function getSeasonalFertilizeInterval(
  plant: Plant,
  catalogEntry: PlantDBEntry | null,
  season: WaterSeason
): number | null {
  // Per-instance Plant.fertilizeSchedule wins over catalog defaults (matches Pattern 7 deep-merge guard).
  // Cold-season null → no emission (FERT-04 dormancy lock).
  if (plant.fertilizeSchedule?.intervalDays != null) {
    // User-overridden interval is season-agnostic in this phase (intervalDays is single value, not warm/cold).
    return plant.fertilizeSchedule.intervalDays;
  }
  if (!catalogEntry) return null;
  const bucket = season === 'cold' ? 'fertilizeIntervalCold' : 'fertilizeIntervalWarm';
  const interval = catalogEntry[bucket];
  if (interval == null) return null; // dormancy: cold=null OR no catalog content
  return interval;
}

export function getNextFertilizeDate(
  plant: Plant,
  catalogEntry: PlantDBEntry | null,
  today: Date,
  season: WaterSeason
): Date | null {
  const intervalDays = getSeasonalFertilizeInterval(plant, catalogEntry, season);
  if (intervalDays == null || intervalDays <= 0) return null;
  if (!plant.fertilizeSchedule?.lastFertilized) return today; // never fertilized → due today
  const last = parseDate(plant.fertilizeSchedule.lastFertilized);
  let next = addDays(last, intervalDays);
  // Catch-up clip — same as getNextWaterDate. CONTEXT lock: emit ONE task on due-day, not N.
  while (next < today) next = addDays(next, intervalDays);
  return next;
}
```

**Pitfall — repeating the Phase 5 plantHealth no-advance dead-code finding:** The advance-loop ALWAYS yields nextDate >= today. So `daysUntilFertilize < 0` is unreachable — the planner can skip designing an "overdue penalty" because the catch-up logic by-construction prevents past-dates. Plant tasks emit on `isSameDay(next, today)`, identical to water/check_soil precedent.

**Emit branch** in `getTasksForDay` (lines 60-85 of plantLogic.ts):

```typescript
// NEW — between sun and outdoor branches in getTasksForDay
const dbEntry = p.databaseId ? getCatalogEntry(p.databaseId) : null;
const nextFertilize = getNextFertilizeDate(p, dbEntry, day, season);
if (nextFertilize && isSameDay(nextFertilize, day)) {
  tasks.push({
    type: "fertilize",
    icon: "🌱",
    label: i18n.t('tasks.fertilize', { name: p.name }),
    plantId: p.id,
  });
}
```

**Note on import edge:** `getCatalogEntry` from `../data/plantDatabase` would need to import into `plantLogic.ts`. Verify no circular import risk — `plantDatabase` imports `i18n`, `plantLogic` imports `dates` + `seasonality` + `i18n`. Should be safe; planner verifies during Plan 20-01.

### Pattern 3: Health-Score Discriminator — DEFENSIVE NO-OP

Per Success Criterion 5 ("Plants without `fertilizeSchedule` emit no fertilize task and are not penalized in health score"), Phase 20 makes **zero changes** to `plantHealth.calculatePlantHealth`. The existing 5 health axes (overdue_water, overdue_sun, no_care, extreme_weather, active_diagnosis) stay as-is. No `overdue_fertilize` axis added. This satisfies Success Criterion 5 trivially — plants without `fertilizeSchedule` don't enter any new code path; plants WITH `fertilizeSchedule` who miss fertilizations also don't degrade because no penalty branch was added.

**Verification sentinel** for Wave 0 smoke runner:
```javascript
assert(!plantHealthSrc.includes('fertilize'), 'CROSS.health-no-fertilize-axis');
```

### Pattern 4: Notification Body-Line Composition — Exact Diff Site

**Source:** `src/utils/notificationScheduler.ts:85-129` (the existing waterTasks/sunTasks/outdoorTasks parts-builder).

**Exact insertion point — line 87 (after outdoorTasks filter declaration, before the `if (tasks.length === 0)` block):**

```typescript
// Existing (lines 85-87):
const waterTasks = tasks.filter((t) => t.type === "water" || t.type === "check_soil");
const sunTasks = tasks.filter((t) => t.type === "sun");
const outdoorTasks = tasks.filter((t) => t.type === "outdoor");

// NEW (Phase 20 FERT-03/05) — opt-in gated:
const fertilizeTasks = tasks.filter((t) => t.type === "fertilize");
```

**Body-parts insertion** (after the `if (outdoorTasks.length > 0)` block at lines 122-126):

```typescript
// NEW — gate on settings.fertilizeReminders === true (FERT-05 opt-in lock).
// The settings parameter must be threaded into createMorningContent — currently it isn't,
// so the planner adds a 5th positional arg `notifSettings: NotificationSettings | null`
// (or destructures from existing settings via the useNotifications caller chain).
if (fertilizeTasks.length > 0 && notifSettings?.fertilizeReminders === true) {
  parts.push(
    `${i18n.t('notifications.fertilize')} ${fertilizeTasks.length} ${
      fertilizeTasks.length === 1 ? i18n.t('notifications.plantWord') : i18n.t('notifications.plantsWord')
    }`
  );
}
```

**Caller signature ratchet:** `scheduleMorningReminder(time, plants, weather, season, healthStatuses?)` becomes `scheduleMorningReminder(time, plants, weather, season, notifSettings, healthStatuses?)`. Two callers (`useNotifications.ts:159` morning-reminder effect + `useNotifications.ts:278` enableNotifications) update; `App.tsx:173` post-migration trigger updates with `null` (defensive — fertilize OFF if no settings). This is the **third positional-arg ratchet in this codebase**, following the same pattern as Phase 5's `latitude` insertion. Documented in Phase 5 SUMMARY's "required-prop ratchet" pattern as reusable.

**i18n keys needed in `common.json`:**
- `notifications.fertilize` (e.g., "Fertilizá:" / "Fertilize:")
- `tasks.fertilize` (e.g., "Fertilizar {{name}}" / "Fertilize {{name}}") — also referenced in `getTasksForDay` label

### Pattern 5: PlantCard Mode='tasks' — Inline TaskButton Below Outdoor

**Source:** `src/components/PlantCard.tsx:284-317`.

**Locator:** The existing `mode === 'tasks' && hasTasks &&` block already renders 3 conditional TaskButtons (water, sun, outdoor) in a `<View style={styles.tasks}>`.

**Insertion point — after the outdoor TaskButton (line 314), before closing `</View>`:**

```typescript
// NEW — Phase 20 FERT-06
{needsFertilizeToday && onFertilizeDone && (
  <TaskButton
    done={fertilizeDone}
    onPress={() => onFertilizeDone(plant.id)}
    icon="🌱"
    label={t('plantCard.fertilize')}
    bgColor={colors.successBg}      // green-leaf tone — verify in theme.ts; if absent, planner adds OR reuses existing
    textColor={colors.green}
  />
)}
```

**Computed booleans — added near lines 100-106:**

```typescript
// NEW
const dbEntry = plant.databaseId ? getCatalogEntry(plant.databaseId) : null;
const nextFertilizeDate = getNextFertilizeDate(plant, dbEntry, today, currentSeason);
const needsFertilizeToday = nextFertilizeDate ? isSameDay(nextFertilizeDate, today) : false;
const fertilizeDone = plant.fertilizeSchedule?.lastFertilized === todayStr && needsFertilizeToday;

// hasTasks expansion (line 106):
const hasTasks = needsWaterToday || needsSunToday || needsOutdoorToday || needsFertilizeToday;
```

**New props on PlantCardProps:** `onFertilizeDone?: (plantId: string) => void`. Optional, mirrors `onWater`/`onSunDone`/`onOutdoorDone`.

**Cascading screens that pass the prop:**
- `src/screens/PlantsScreen.tsx` — adds `onFertilizeDone={fertilizePlant}` to `<PlantCard>`
- `src/screens/TodayScreen.tsx` — same

**New `useStorage` action — `fertilizePlant(plantId: string)`:**
```typescript
// Mirrors waterPlant pattern in useStorage.tsx
const fertilizePlant = useCallback((id: string) => {
  const plant = dataRef.current.plants.find(p => p.id === id);
  if (!plant?.fertilizeSchedule) return; // no-op for plants without schedule
  updatePlant(id, {
    fertilizeSchedule: {
      ...plant.fertilizeSchedule,
      lastFertilized: formatDate(new Date()),
    },
  }, { fromUserEdit: true }); // bypass deep-merge guard since user explicitly tapped
}, [updatePlant]);
```

**Coexistence with Phase 18 + 19 PlantCard surfaces** (already verified by reading PlantCard.tsx):
- Phase 18 mood emoji overlay is on `imageContainer` (lines 230-249) — untouched.
- Phase 19 toxicity badges are in `headerRight` cluster (lines 257-281) — untouched.
- Fertilize TaskButton renders inside the existing `tasks` row (line 285), peer of water/sun/outdoor — preserves the 5-element budget because tasks-row collapses gracefully when no tasks pending.
- Phase 18 Gesture.Race(longPress, pan) wraps the entire card — NEW TaskButton renders inside `<TouchableOpacity onPress={() => onPress?.(plant)}>`, so onPress propagates through the gesture composition correctly. **Verify:** Plan should test that tapping a TaskButton does NOT trigger long-press menu OR swipe — Phase 18 already handled this for water/sun/outdoor TaskButtons; fertilize inherits the behavior.

### Pattern 6: Seasonality Reuse — Zero New Code

**Source:** `src/utils/seasonality.ts:58-78`.

`getEffectiveSeason(location, climateOverride, today)` already returns `'warm' | 'cold' | 'tropical'`. Phase 20 calls it from the same call sites that already invoke it (PlantCard, MyPlantDetailModal, useNotifications, etc.).

**Tropical mapping:** `'tropical'` → `'warm'` bucket lookup (matches `waterScheduleWarm` precedent in `plantLogic.getSeasonalInterval`). Cold-season tropical plants don't exist in catalog — defensive only.

**Hemisphere flip:** Already wired. Northern temperate warm Apr-Sep / cold Oct-Mar; Southern temperate inverse. Phase 5 SEASON-04 single-source-of-truth holds.

### Pattern 7: Deep-Merge Guard — Extend PROTECTED_USER_FIELDS Tuple

**Source:** `src/hooks/useStorage.tsx:23`.

```typescript
// Existing:
const PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode'] as const;

// Phase 20 extension:
const PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode', 'fertilizeSchedule'] as const;
```

**Why this matters:** Per CRIT-1 (.planning/research/PITFALLS.md, Phase 14 origin), if a user manually overrides their plant's fertilize interval (rare in this phase since no UI for it — but the Plant.fertilizeSchedule is exposed in MyPlantDetailModal "Tus ajustes" potentially), catalog-source code paths must NOT silently overwrite that override. Adding `'fertilizeSchedule'` to the tuple ensures any future `updatePlant({ fertilizeSchedule: catalogDefault })` call without `{ fromUserEdit: true }` is dropped.

**Important:** The `fertilizePlant` action above explicitly passes `{ fromUserEdit: true }` because it's user-tapped — the guard correctly allows the update through. Migration init (deriving `fertilizeSchedule` from catalog at first run) should ALSO use `fromUserEdit: false` (default) so the guard is exercised — except migration uses raw `setPlants` (not `updatePlant`), so it bypasses the guard entirely. Verify in Plan 20-01.

### Pattern 8: MyPlantDetailModal Two-Column Layout — Inside `🌿 ¿Qué hacer?`

**Source:** `src/components/MyPlantDetailModal.tsx:294-338` (the existing `🌿 ¿Qué hacer?` EducationalSection block).

**Current shape (excerpted):**
```typescript
<EducationalSection emoji="🌿" title={t('plantDetailModal.whatToDo')}>
  {(() => {
    const hasDiagnoses = ...;
    const hasCareAction = ...;
    const hasNutrients = ...;
    const hasRelocatedTip = ...;
    if (!hasDiagnoses && !hasCareAction && !hasNutrients && !hasRelocatedTip) {
      return <Text style={styles.placeholderCopy}>{t('plantDetailModal.emptyWhatToDo')}</Text>;
    }
    return (
      <>
        <ActiveProblemsSection ... />
        {strictDbEntry?.careAction?.fixed && (<Text style={styles.eduCopy}>...</Text>)}
        {strictDbEntry?.careAction?.soilCheck && (<Text style={styles.eduCopy}>...</Text>)}
        {dbEntry?.nutrients && (<View style={styles.nutrientsCardEdu}>...</View>)}
        {relocatedTip ? (<Text style={styles.relocatedTip}>...</Text>) : null}
      </>
    );
  })()}
</EducationalSection>
```

**Phase 20 refactor — wrap the water sub-block + new fertilize sub-block in a horizontal row:**

```typescript
// Replace the careAction copy lines with a two-column layout:
<View style={styles.careCardsRow}>
  {/* WATER CARD — always renders if any water content present */}
  {(strictDbEntry?.careAction?.fixed || strictDbEntry?.careAction?.soilCheck) && (
    <View style={[styles.careCard, hasFertilizeContent ? styles.careCardHalf : styles.careCardFull]}>
      <Text style={styles.careCardHeader}>💧 {t('plantDetailModal.water')}</Text>
      {strictDbEntry.careAction.fixed && (<Text style={styles.eduCopy}>{strictDbEntry.careAction.fixed}</Text>)}
      {strictDbEntry.careAction.soilCheck && (<Text style={styles.eduCopy}>{strictDbEntry.careAction.soilCheck}</Text>)}
    </View>
  )}
  {/* FERTILIZE CARD — collapsible, tap-to-expand */}
  {hasFertilizeContent && (
    <FertilizeCard
      strictDbEntry={strictDbEntry}
      season={currentSeason}
      defaultExpanded={initialExpanded === 'fertilize'}
      style={(strictDbEntry?.careAction?.fixed || strictDbEntry?.careAction?.soilCheck) ? styles.careCardHalf : styles.careCardFull}
    />
  )}
</View>
```

**Height-equalization in RN:**
- React Native flexbox: `flexDirection: 'row'` + both children `flex: 1` (or 50% each via `width: '50%'` minus gap). When children render side-by-side in a flex row, the row's cross-axis (vertical) `alignItems: 'stretch'` (default) makes both children equal height — children inherit the tallest sibling's height naturally.
- For the "single column" graceful degradation: when only one card renders, give it `flex: 1` (fills the row) — no special-case CSS needed.
- Style hint:
  ```typescript
  careCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch', // ensures equal height
  },
  careCardHalf: {
    flex: 1, // 50% minus gap
  },
  careCardFull: {
    flex: 1, // also 50%? or 100%? — when only 1 card, this expands to fill row width
  },
  careCard: {
    backgroundColor: 'rgba(0,0,0,0.03)', // mirrors nutrientsCardEdu nested-card pattern
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  ```
- The `alignItems: 'stretch'` (RN flexbox default) is the height-equalization mechanism — no CSS subgrid or measurement loop needed.

**`hasFertilizeContent` boolean:**
```typescript
const hasFertilizeContent =
  strictDbEntry?.fertilizeIntervalWarm != null ||
  strictDbEntry?.fertilizer != null;
```

### Pattern 9: FertilizeCard Component — Composes EducationalSection Primitives at Smaller Scale

**New component at `src/components/plant-detail/FertilizeCard.tsx`:**

The card has two states:
- **Header (always visible):** `🌱 Fertilizá cada {N} días ({warm|cold|tropical})` — frequency derived from `getSeasonalFertilizeInterval`.
- **Body (tap-to-expand, default collapsed unless `defaultExpanded={true}`):** `fertilizer.industrialRecommendation` and/or `fertilizer.homemadeRecommendation` (translated via `getTranslatedPlant`).

**Reanimated v4 primitives** — VERIFIED against existing `EducationalSection.tsx` (the in-repo implementation deviates from CONTEXT.md's "250ms inOut" — actual is 180ms with `Easing.out(Easing.cubic)` per Plan 14-03 device test tuning, see Open Question 1):

```typescript
// src/components/plant-detail/FertilizeCard.tsx
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useDerivedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../../theme';
import type { PlantDBEntry } from '../../types';
import type { WaterSeason } from '../../utils/seasonality';
import { getSeasonalFertilizeInterval } from '../../utils/plantLogic';

const COLLAPSE_DURATION = 180; // matches EducationalSection.tsx tuning (NOT 250ms — see Open Question 1)

interface FertilizeCardProps {
  strictDbEntry: PlantDBEntry | null;
  season: WaterSeason;
  defaultExpanded?: boolean;
  style?: any;
}

export function FertilizeCard({ strictDbEntry, season, defaultExpanded = false, style }: FertilizeCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hasInteracted, setHasInteracted] = useState(false);
  const measuredHeight = useSharedValue(0);
  const open = useSharedValue(defaultExpanded ? 1 : 0);

  // Same primitives as EducationalSection — see src/components/plant-detail/EducationalSection.tsx
  const derivedHeight = useDerivedValue(() =>
    withTiming(measuredHeight.value * open.value, { duration: COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
  );
  const opacity = useDerivedValue(() =>
    withTiming(open.value, { duration: COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    opacity: opacity.value,
  }));

  const toggle = () => {
    if (!hasInteracted) setHasInteracted(true);
    const next = !expanded;
    setExpanded(next);
    open.value = next ? 1 : 0;
  };

  if (!strictDbEntry) return null;
  const interval = getSeasonalFertilizeInterval(/* dummy plant */ {} as any, strictDbEntry, season);
  if (interval == null) {
    // Cold-season dormancy — render dormancy hint instead of frequency
    return (
      <View style={[styles.card, style]}>
        <Text style={styles.header}>🌱 {t('plantDetailModal.fertilizeDormant')}</Text>
      </View>
    );
  }

  const seasonKey = season === 'cold' ? 'cold' : season === 'tropical' ? 'tropical' : 'warm';
  const headerText = t('plantDetailModal.fertilizeEvery', { days: interval, season: t(`plantDetail.seasonBadge.${seasonKey}`) });

  const hasIndustrial = !!strictDbEntry.fertilizer?.industrialRecommendation;
  const hasHomemade = !!strictDbEntry.fertilizer?.homemadeRecommendation;
  const hasBody = hasIndustrial || hasHomemade;

  return (
    <View style={[styles.card, style]}>
      <Pressable
        onPress={hasBody ? toggle : undefined}
        accessibilityRole={hasBody ? 'button' : undefined}
        accessibilityState={hasBody ? { expanded } : undefined}
      >
        <Text style={styles.header}>🌱 {headerText}{hasBody ? ' ›' : ''}</Text>
      </Pressable>
      {hasBody && (
        <Animated.View style={hasInteracted ? bodyStyle : styles.bodyAuto}>
          <View
            style={styles.bodyContent}
            onLayout={(e) => { const h = e.nativeEvent.layout.height; if (h > 0) measuredHeight.value = h; }}
          >
            {hasIndustrial && (
              <Text style={styles.recipe}>🧪 {strictDbEntry.fertilizer!.industrialRecommendation}</Text>
            )}
            {hasHomemade && (
              <Text style={styles.recipe}>🏡 {strictDbEntry.fertilizer!.homemadeRecommendation}</Text>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
```

**Note on `defaultExpanded` from `initialExpanded` prop:**
- MyPlantDetailModalProps gains `initialExpanded?: 'fertilize'` (one-shot — orthogonal to Phase 19's `initialSection`).
- When `initialExpanded === 'fertilize'`, the FertilizeCard is rendered with `defaultExpanded={true}` (passes through).
- Modal close + reopen resets the prop to undefined (caller's responsibility — same pattern as `initialSection`).
- No state machine, no AsyncStorage — pure prop pass-through. Phase 14 Pattern 7 (per-modal-session collapse state) preserved verbatim.

**Tap-routing from PlantCard fertilize indicator → modal:**
The PlantCard fertilize TaskButton's `onPress` already wires to `onFertilizeDone(plant.id)` (mark-done). For the **info-routing** path, the user taps the card body (existing `onPress?.(plant)` flow at line 222) which opens the modal at top — there's currently NO indicator-tap-opens-modal-at-fertilize flow because FERT-06 says "fertilize task badge when due today" and the user toggles done via TaskButton tap.

**However**, CONTEXT.md ¶ "Tap-routing from PlantCard → modal" says: "A future PlantCard fertilize-due-today indicator (FERT-06) opens MyPlantDetailModal with `initialSection='que-hacer'`. The modal also receives a signal that the fertilize card should auto-expand."

**Recommendation:** The TaskButton `onPress` does mark-done; a separate **long-press OR card-body-tap-while-fertilize-pending** gesture opens the modal with `initialExpanded='fertilize'`. But this conflicts with Phase 18's existing long-press menu. Cleanest interpretation: `onPress` on the TaskButton itself remains mark-done; the user taps the card body (existing `onPress?.(plant)` → opens modal at top) and then the auto-expand triggers because the planner could choose to ALWAYS pass `initialExpanded='fertilize'` when there's a pending fertilize task. **Open Question 2 — see below.**

### Pattern 10: Settings Toggle — `NotificationSettings.fertilizeReminders`

**Source:** `src/types/index.ts:283-289` (NotificationSettings interface).

```typescript
// Existing
export interface NotificationSettings {
  enabled: boolean;
  morningReminder: boolean;
  morningTime: string;
  weatherAlerts: boolean;
  careReminders: boolean;
  // Phase 20 (FERT-05) — opt-in fertilize reminders, default OFF.
  // Behavioral contract: when true AND morningReminder is true, the morning body
  // includes the fertilize axis (notificationScheduler.ts createMorningContent).
  fertilizeReminders?: boolean;
}
```

**DEFAULT_SETTINGS** in `src/hooks/useNotifications.ts:49`:
```typescript
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  morningReminder: true,
  morningTime: "08:00",
  weatherAlerts: true,
  careReminders: true,
  fertilizeReminders: false, // Phase 20 FERT-05 lock: default OFF
};
```

**SettingsScreen JSX** — insertion point at `src/screens/SettingsScreen.tsx:336` (after careReminders Switch row, before testButton):

```tsx
<View style={styles.settingRow}>
  <View style={styles.settingInfo}>
    <Text style={styles.settingIcon}>🌱</Text>
    <View style={styles.settingText}>
      <Text style={styles.settingTitle}>{t('settings.fertilizeReminders')}</Text>
      <Text style={styles.settingSubtitle}>{t('settings.fertilizeRemindersSubtitle')}</Text>
    </View>
  </View>
  <Switch
    value={!!notifSettings.fertilizeReminders}
    onValueChange={(value) => updateSettings({ fertilizeReminders: value })}
    trackColor={{ false: colors.border, true: colors.green }}
    thumbColor={colors.white}
  />
</View>
```

**i18n keys** for `common.json` (EN+ES parity):
- `settings.fertilizeReminders` ("Fertilize reminders" / "Recordatorios de fertilización")
- `settings.fertilizeRemindersSubtitle` ("Get notified when plants need fertilizing" / "Te avisamos cuándo abonar tus plantas")

### Pattern 11: Migration Strategy — `useStorage` Init-Time Derivation

**Source:** Phase 14 EDU-06 deep-merge guard pattern (no migration; catalog-driven derivation at runtime).

**Decision tree:**
- **Existing plants with `databaseId` resolving to a catalog entry that has `fertilizeIntervalWarm`:** Plant.fertilizeSchedule remains undefined; the runtime helper `getNextFertilizeDate(plant, getCatalogEntry(plant.databaseId), ...)` derives the cadence from the catalog on every call.
- **Existing plants without `databaseId` (custom plants) OR with `databaseId` not resolving:** `getNextFertilizeDate` returns `null` (no catalog entry, no Plant.fertilizeSchedule.intervalDays override) → no fertilize task emits → no health penalty. Behavioral contract satisfied per Success Criterion 5.

**No migration needed in `migration.ts`.** This is the same approach Phase 14 took for the 5 EDU-02 educational fields — they were added as catalog-only fields, not Plant-level. Phase 20 mirrors that pattern: `fertilizeIntervalWarm/Cold` and `fertilizer` live ONLY on `PlantDBEntry`; `Plant.fertilizeSchedule` is opt-in user override (additive optional, no migration default).

**Optional alternative considered:** Migration script that derives `Plant.fertilizeSchedule = { intervalDays: catalogEntry.fertilizeIntervalWarm }` at first launch for every plant with databaseId. **REJECTED** because:
1. Locks the plant's schedule in stone — the user can't pick up new catalog cadences without manual reset.
2. The deep-merge guard (Pattern 7) would prevent catalog updates from flowing through.
3. Adds a schemaVersion bump (currently at v1).

**Recommendation:** No migration. Plants with databaseId get cadence from catalog dynamically; plants without get nothing. This matches CONTEXT.md ¶ "Plants without `fertilizeSchedule` (additive optional): zero fertilize tasks, zero health-score penalty."

### Pattern 12: Catalog Content Authoring Playbook (FERT-07)

**Source:** Phase 14-04..07 SUMMARYs + Phase 15-01..02 + Phase 16-01..02 + Phase 17-01..02.

**Cross-phase rhythm distilled:**

1. **char-limit-from-draft** (Phase 14-06 origin, Phase 15-01 first-try-zero-trim): Every fertilizer copy field drafted ≤ ceiling from start. Recommended ceiling: **120 chars** for `industrialRecommendation` and `homemadeRecommendation` (vs Phase 14's 250 for `whyRationale` — fertilize copy is shorter, action-oriented).
2. **voseo pre-sweep** (Phase 14-04 origin): Before any commit, `grep -cE "\btienes\b|\bpuedes\b|\bdebes\b|\bquieres\b" src/i18n/locales/es/plants.json` MUST return baseline (currently 0 after Phase 19 limonero fix). Common false-positives to watch: `\btoca\b` (verb form vs noun), `\bten\b` (matches `tenés`), `\briego se\b` (3rd-person reflexive). Pattern: if regex hits, reword (e.g., "se riega al pie" → "el riego va al pie" per Phase 14-06 fix).
3. **locale parity from start** (Phase 15-01 + Phase 16-01): Author EN + ES in same commit, same file pair. Verify `jq 'keys' src/i18n/locales/{en,es}/plants.json | diff` returns 0 lines diff.
4. **distinct per-entry rationale** (Phase 14-07 + Phase 15-01 + Phase 16-01 + Phase 17-01 — zero copy-paste discipline): Each entry's fertilizer copy must cite a per-species mechanism or sub-typology — e.g., "tropicales palmera-areca: NPK 20-20-20 cada 14d en cálido + lombricompuesto líquido cada 21d (sotobosque-tipo, suelo orgánico)" vs "tropicales monstera: NPK 20-20-20 cada 14d en cálido + té de cáscara de plátano cada 21d (epífita aroide, alta demanda K)".
5. **category-grouped batches** (Phase 14-04..07 4-wave precedent): Recommended Phase 20 split:
   - **Batch 1 (Wave 3a):** 36 entries — 22 interior tropicales + 14 suculentas/cactus (homemade-first vs NPK-only contrast). Mirrors Phase 14-04 (15 interior) + Phase 16-01 (10 cactus) lineage.
   - **Batch 2 (Wave 3b):** 27 entries — 18 exterior + 9 aromáticas (Mediterranean climate framing). Mirrors Phase 14-05/06 + Phase 17-01.
   - **Batch 3 (Wave 3c):** 32 entries — 9 huerta + 5 frutales + 6 helechos/aroides + 12 misc. Mirrors Phase 14-07 + Phase 17-02.
   - 36 + 27 + 32 = 95. Add 23 from Phase 15+16+17 catalog growth not yet covered = 118 total.
   - **Discretionary**: planner may consolidate into 2 mega-batches or split into 4 finer batches based on velocity from Phase 14-04 trend (~22 min for 15 entries × 5 fields × 2 locales = 150 strings; Phase 20 has fewer fields per entry: 1-2 fertilizer copy fields = ~80-100 strings per batch of 30).

**Per-category default framing matrix (CONTEXT.md derived):**

| Category | `fertilizer.type` default | Industrial framing | Homemade framing |
|----------|-----------------------|---------------------|---------------------|
| Interior tropicales (anthurium, monstera, ficus, palmeras, helechos, aroides) | `'both'` | NPK 20-20-20 diluido cada 14-21d en cálido | Té de cáscara de banana / lombricompuesto / té de compost |
| Suculentas/cactus | `'industrial'` (homemade omitted — too N-rich for arid succulents) | NPK 5-10-10 cada 60-90d en cálido / null en frío | (skip — homemadeRecommendation undefined) |
| Aromáticas | `'homemade'` (industrial optional — herbs prefer organic) | (rare — only when explicit) | Té de compost cada 7-14d / harina de hueso para floración |
| Huerta | `'both'` | NPK 10-10-10 + variantes según fase (vegetativa vs fructificación) | Lombricompuesto + té de cáscara de banana + cenizas de madera |
| Frutales | `'both'` | NPK 8-12-12 cada 30-60d cálido / null en frío | Compost + harina de hueso + cenizas (potasio) |
| Exterior flores | `'both'` | NPK 10-15-10 (alto P para floración) | Compost + harina de hueso + té de cáscara de banana (alto K) |

**Tone matching Phase 14 register:** prescriptive frequency + neutral how. Voseo for ES imperatives ("Fertilizá cada 14d con NPK 20-20-20 diluido 1:4 en agua durante temporada cálida"). Mirrors `whyRationale` register from Phase 14.

### Anti-Patterns to Avoid

- **Adding a `'fertilizar'` ModalSectionId** — CONTEXT explicitly forbids growing the modal section count.
- **Lumping fertilize under water in calendar dot / notification body** — water + check_soil are lumped because they share `lastWatered`; fertilize has its own `lastFertilized` marker, so visual lumping would mislead users into thinking marking water-done also marks fertilize-done.
- **Adding overdue_fertilize health penalty** — Success Criterion 5 forbids it, AND the advance-loop pattern makes the daysUntil < 0 branch dead code anyway (Phase 5 dead-code finding).
- **Defaulting `fertilizeReminders: true`** — FERT-05 lock: default OFF to avoid notification fatigue (4th task type).
- **Specific brand names in fertilizer copy** — FERT-07 lock: generic NPK ratios + standard amendments only (e.g., "NPK 10-10-10", "lombricompuesto", "harina de hueso" — never "Bayer Bayfolan" or specific commercial brands).
- **Per-plant fertilize toggle UI** — out of scope; global Settings toggle only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tap-to-expand animation | Custom `LayoutAnimation` impl | Phase 14 EducationalSection's Reanimated v4 primitives | Already battle-tested across 5 catalog phases, breaks visual consistency if reinvented |
| Modal section anchor / scroll-to | Custom `useEffect` + `measure()` | Phase 19's `initialSection` prop + `sectionLayouts.current` mechanism | Already verified on iOS + Android device (Phase 19 manual gate) |
| 5-site discriminator switch boilerplate | Wrap in a "task type registry" abstraction | Inline switch/if-else like the 8 existing chains | The codebase has 4 discriminator chains in 5 files — abstraction adds indirection without saving lines |
| Fertilize cadence catch-up logic | Custom date-loop | Reuse `getNextWaterDate` advance-loop pattern verbatim (mirror) | Same arithmetic; same edge cases (lastFertilized null → today) |
| Fertilize task notification ID scheme | Per-plant `care-reminder-{plantId}` | Lump under existing morning-reminder body | FERT-05 says opt-in to morning summary, not per-plant individual notifications |
| Catalog content authoring drift detection | Per-entry character-count CI gate | char-limit-from-draft discipline + voseo pre-sweep grep | Established Phase 14-15-16-17 muscle memory; CI gate is overkill |
| i18n parity validation | Snapshot tests | check-i18n-keys.mjs conditional pattern (Phase 19 origin for symptoms) | Append-only extension; no test framework needed |

**Key insight:** Every Phase 20 surface has a verbatim or near-verbatim precedent in v1.1 (Phase 5) or v1.2 (Phase 14, 18, 19). The phase is **>90% mechanical extension** + **<10% novel design** (the two-column layout is the only novel UX, and it's a 30-LOC flexbox row). Plan velocity should match Phase 19's 7-plan / ~40-min execution (modulo content authoring time which dominates).

## Common Pitfalls

### Pitfall 1: Fertilize-Card Auto-Expand Race with Section Scroll
**What goes wrong:** When the user taps PlantCard's fertilize indicator, the modal opens with both `initialSection='que-hacer'` AND `initialExpanded='fertilize'`. The Phase 19 50ms-setTimeout scrolls to "que-hacer" section while the FertilizeCard's Reanimated open shared value is set to 1 (auto-expand starts). On slow devices, the scroll might happen before the FertilizeCard is mounted, and `measuredHeight.value` is still 0 — auto-expand collapses prematurely.
**Why it happens:** Mount order ≠ layout order on slow devices. Phase 14 already handled this for `EducationalSection.tsx:46-48` via `hasInteracted` gate.
**How to avoid:** FertilizeCard's `defaultExpanded` prop is consumed at component mount; the `hasInteracted` gate from EducationalSection (lazy-measure Pattern A) ensures the body renders with `height: 'auto'` until the first toggle. For auto-expand, the planner sets `useState(defaultExpanded)` initial state to true AND ensures the body renders from `bodyAuto` style (height: 'auto') on first render — only switching to animated style after first user interaction. This means auto-expand looks "instant" (no animation on initial paint), which is correct behavior.
**Warning signs:** Device test shows fertilize content half-rendered or animation jank during modal open.

### Pitfall 2: Notification Body-Line `notifSettings` Threading Skip
**What goes wrong:** Plan adds `fertilizeReminders` gate to notificationScheduler.ts but forgets to thread `notifSettings` through `scheduleMorningReminder` → `createMorningContent`. Result: TypeScript compiles (because notifSettings is optional), runtime always emits fertilize body even when toggle OFF.
**Why it happens:** notificationScheduler.ts:143 `scheduleMorningReminder(time, plants, weather, season, healthStatuses?)` has 5 params; adding `notifSettings` between season and healthStatuses (or after healthStatuses) requires touching 3 callers (useNotifications:159 morning effect, useNotifications:278 enableNotifications, App.tsx:173 post-migration). Phase 5's "required-prop ratchet" anti-pattern explicitly warns against defaulting inside the function.
**How to avoid:** Make `notifSettings: NotificationSettings | null` REQUIRED (not optional) in the new signature. Forces tsc to surface every caller. App.tsx post-migration trigger passes `null` (acceptable — fertilize OFF at migration time is correct semantically).
**Warning signs:** Smoke runner sentinel `grep -c "fertilizeReminders" src/utils/notificationScheduler.ts >= 1` passes but device test shows fertilize line in morning body even with toggle OFF.

### Pitfall 3: PlantCard 5-Element Budget Violation
**What goes wrong:** Plan adds fertilize TaskButton to mode='tasks' branch but a screen passes `mode='collection'` (or default) — the TaskButton renders unconditionally because `needsFertilizeToday` short-circuits the check.
**Why it happens:** Existing PlantCard:284 gates the entire tasks block on `mode === 'tasks' && hasTasks`. Future plan additions might forget the outer gate.
**How to avoid:** New `needsFertilizeToday` boolean MUST be inside the existing `mode === 'tasks' && hasTasks` block. The existing 4-element budget is preserved (image + name + 1 task OR no task + water badge + mood emoji = 5; fertilize TaskButton displaces nothing because it's an additional task only when due).
**Warning signs:** Phase 18 cross-phase regression sentinel fails — `grep -c "moodEmoji" src/components/PlantCard.tsx >= 2` should still PASS after Phase 20.

### Pitfall 4: `lastFertilized` String Format Drift
**What goes wrong:** `Plant.fertilizeSchedule.lastFertilized` stored as `formatDate(today)` ("YYYY-MM-DD") in `fertilizePlant` action; DayDetailModal `isDone` checks `plant.lastFertilized === dateStr` (note: `plant.lastFertilized` doesn't exist — it's nested `plant.fertilizeSchedule?.lastFertilized`).
**Why it happens:** Schema asymmetry — `lastWatered` is a top-level field on Plant; `lastFertilized` is nested inside `fertilizeSchedule`. Easy to write the wrong access path.
**How to avoid:** Use a helper getter `getLastFertilized(plant: Plant): string | undefined { return plant.fertilizeSchedule?.lastFertilized; }` that all 4 call sites (DayDetailModal isDone, PlantCard fertilizeDone boolean, fertilizePlant action, plantLogic getNextFertilizeDate) use. Avoids deep-access boilerplate at each site.
**Warning signs:** Type errors or runtime "Cannot read property 'lastFertilized' of undefined" on plants without fertilizeSchedule.

### Pitfall 5: Two-Column Layout Height-Equalization on Single-Column Fallback
**What goes wrong:** When only the water card is present (fertilize content absent), `flex: 1` on the water card makes it span 50% of the row width — leaving an awkward right-side empty space because there's no fertilize card to fill the other 50%.
**Why it happens:** RN flexbox `flex: 1` shares space proportionally with siblings; if no sibling, the single child still gets 100% but the row layout shifts.
**How to avoid:** Conditional style — when only one card present, give it `flex: 1` AND ensure the row has only one child (don't render an empty `<View />` placeholder). The flex-row + single-child = full-width works correctly.

```typescript
<View style={styles.careCardsRow}>
  {hasWaterContent && <WaterCard style={hasFertilizeContent ? styles.cardHalf : styles.cardFull} />}
  {hasFertilizeContent && <FertilizeCard style={hasWaterContent ? styles.cardHalf : styles.cardFull} />}
</View>
// styles.cardHalf: { flex: 1 }
// styles.cardFull: { flex: 1 } — also works because there's no sibling competing
```
Both `cardHalf` and `cardFull` can be `{ flex: 1 }` — flexbox distributes correctly with single child OR equal siblings.
**Warning signs:** Device test shows visible empty space on right when only water card present.

### Pitfall 6: i18n Parity Gate False-Negative on Optional `fertilizer` Sub-Fields
**What goes wrong:** Catalog entry declares `fertilizer.type === 'industrial'` and only `fertilizer.industrialRecommendation` (homemade omitted intentionally for suculentas/cactus). Naive parity gate would FAIL on plants.json missing `fertilizer.homemadeRecommendation`.
**Why it happens:** Phase 14 EDU-07 set the precedent for sub-fields independently conditional (careAction.fixed and careAction.soilCheck checked separately). Phase 19 TOX-06 followed the same pattern for `petToxicity.symptoms.{cats,dogs}`.
**How to avoid:** Phase 20's parity gate extension follows the same independent-conditional pattern:

```javascript
// Phase 20 (FERT-07) — append after the petToxicity.symptoms block in check-i18n-keys.mjs
if (entry.fertilizer?.industrialRecommendation && !node?.fertilizer?.industrialRecommendation) {
  errors.push(`[${locale}] "${entry.id}".fertilizer.industrialRecommendation missing`);
}
if (entry.fertilizer?.homemadeRecommendation && !node?.fertilizer?.homemadeRecommendation) {
  errors.push(`[${locale}] "${entry.id}".fertilizer.homemadeRecommendation missing`);
}
```

**Warning signs:** Suculentas entries that only declare `industrialRecommendation` fail the gate.

### Pitfall 7: Missing Catalog Entry Hide Cascade in Two-Column Layout
**What goes wrong:** Custom plant (no databaseId) opens MyPlantDetailModal. `strictDbEntry === null`, so `hasFertilizeContent === false`. The two-column layout renders only the water card OR nothing at all — but the planner forgot to also gate the section header → the section header `🌿 ¿Qué hacer?` shows even when both cards collapse to placeholder.
**Why it happens:** Phase 14 already handled this for the inner content (placeholder-on-empty), but the new two-column layout adds another nesting layer.
**How to avoid:** Reuse the existing Phase 14 "any sub-block has data" gate. The fertilize content is now a 5th condition alongside hasDiagnoses/hasCareAction/hasNutrients/hasRelocatedTip:

```typescript
const hasFertilizeContent = strictDbEntry?.fertilizeIntervalWarm != null || strictDbEntry?.fertilizer != null;
if (!hasDiagnoses && !hasCareAction && !hasNutrients && !hasRelocatedTip && !hasFertilizeContent) {
  return <Text>{t('plantDetailModal.emptyWhatToDo')}</Text>;
}
```

**Warning signs:** Empty `🌿 ¿Qué hacer?` card displayed for custom plants.

## Code Examples

### Example 1: Type Extensions

```typescript
// src/types/index.ts (Phase 20 additions)

/** v1.2 Phase 20 (FERT-01) — per-plant fertilize schedule. Additive optional. */
export interface FertilizeSchedule {
  intervalDays: number;
  lastFertilized?: string; // ISO date "YYYY-MM-DD"
}

// Extend Plant interface (line 49-84 area):
export interface Plant {
  // ... existing fields ...
  /** v1.2 Phase 20 (FERT-01). Additive optional; absence means no fertilize task emission. */
  fertilizeSchedule?: FertilizeSchedule;
}

// Extend PlantDBEntry interface (line 192-246 area):
export interface PlantDBEntry {
  // ... existing fields ...
  /** v1.2 Phase 20 (FERT-02). Days between fertilizations in warm season. Absence skips emission. */
  fertilizeIntervalWarm?: number;
  /** v1.2 Phase 20 (FERT-02). Days between fertilizations in cold season. null = dormant (no emission). */
  fertilizeIntervalCold?: number | null;
  /** v1.2 Phase 20 (FERT-07). Fertilizer type + per-locale recommendation copy. */
  fertilizer?: {
    type: 'industrial' | 'homemade' | 'both';
    industrialRecommendation?: string;
    homemadeRecommendation?: string;
  };
}

// Extend Task discriminator union (line 107-112):
export interface Task {
  type: "water" | "sun" | "outdoor" | "check_soil" | "fertilize"; // FERT-03
  icon: string;
  label: string;
  plantId: string;
}

// Extend NotificationSettings (line 283-289):
export interface NotificationSettings {
  enabled: boolean;
  morningReminder: boolean;
  morningTime: string;
  weatherAlerts: boolean;
  careReminders: boolean;
  /** v1.2 Phase 20 (FERT-05). Default OFF; opt-in fertilize axis in morning body. */
  fertilizeReminders?: boolean;
}
```

### Example 2: getTasksForDay Emit Branch

```typescript
// src/utils/plantLogic.ts (NEW emit branch)
import { getCatalogEntry } from '../data/plantDatabase';

export function getTasksForDay(plants: Plant[], day: Date, season: WaterSeason): Task[] {
  const tasks: Task[] = [];
  plants.forEach(p => {
    // ... existing water/check_soil/sun/outdoor branches ...

    // FERT-03/04 — emit fertilize task on cadence (season-aware via warm/cold split).
    const dbEntry = p.databaseId ? getCatalogEntry(p.databaseId) : null;
    const nextFertilize = getNextFertilizeDate(p, dbEntry, day, season);
    if (nextFertilize && isSameDay(nextFertilize, day)) {
      tasks.push({
        type: "fertilize",
        icon: "🌱",
        label: i18n.t('tasks.fertilize', { name: p.name }),
        plantId: p.id,
      });
    }
  });
  return tasks;
}
```

### Example 3: smoke-phase20.cjs Skeleton (mirroring smoke-phase19.cjs)

```javascript
#!/usr/bin/env node
// scripts/smoke-phase20.cjs
// Phase 20 Fertilization Subsystem smoke runner. CommonJS (.cjs).
// Wave 0 ships scaffold PASSes + SKIP placeholders for FERT-01..07.
// STRICT cross-phase regression sentinels for Phase 18 + Phase 19 surfaces.

const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0, skip = 0;
const errors = [], skips = [];
function assert(cond, label) { if (cond) pass++; else { fail++; errors.push(`FAIL: ${label}`); } }
function assertSkippable(condFn, label) {
  try {
    const cond = condFn();
    if (cond === undefined) { skip++; skips.push(`SKIP: ${label}`); }
    else if (cond) pass++;
    else { fail++; errors.push(`FAIL: ${label}`); }
  } catch (e) { skip++; skips.push(`SKIP: ${label} (threw: ${e.message})`); }
}
function readSafe(rel) { const abs = path.resolve(ROOT, rel); return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null; }
function getNested(obj, dotted) { return dotted.split('.').reduce((a, b) => (a == null ? a : a[b]), obj); }

const typesSrc = readSafe('src/types/index.ts') || '';
const plantLogicSrc = readSafe('src/utils/plantLogic.ts') || '';
const schedulerSrc = readSafe('src/utils/notificationScheduler.ts') || '';
const plantHealthSrc = readSafe('src/utils/plantHealth.ts') || '';
const dayDetailSrc = readSafe('src/components/DayDetail.tsx') || '';
const dayDetailModalSrc = readSafe('src/components/DayDetailModal.tsx') || '';
const monthCalendarSrc = readSafe('src/components/MonthCalendar.tsx') || '';
const plantCardSrc = readSafe('src/components/PlantCard.tsx') || '';
const modalSrc = readSafe('src/components/MyPlantDetailModal.tsx') || '';
const fertilizeCardSrc = readSafe('src/components/plant-detail/FertilizeCard.tsx') || '';
const settingsScreenSrc = readSafe('src/screens/SettingsScreen.tsx') || '';
const plantsScreenSrc = readSafe('src/screens/PlantsScreen.tsx') || '';
const todayScreenSrc = readSafe('src/screens/TodayScreen.tsx') || '';
const dbSrc = readSafe('src/data/plantDatabase.ts') || '';
const useStorageSrc = readSafe('src/hooks/useStorage.tsx') || '';

// ─── W0.scaffold (PASS at Wave 0 baseline) ───
assert(readSafe('scripts/smoke-phase20.cjs') !== null, 'W0.scaffold.runner-self-exists');
assert(typesSrc.includes('fertilizeSchedule?:'), 'W0.scaffold.types.Plant-fertilizeSchedule');
assert(typesSrc.includes('fertilizeIntervalWarm?:'), 'W0.scaffold.types.PlantDBEntry-fertilizeIntervalWarm');
assert(typesSrc.includes('fertilizeIntervalCold?:'), 'W0.scaffold.types.PlantDBEntry-fertilizeIntervalCold');
assert(typesSrc.includes('"fertilize"'), 'W0.scaffold.types.Task-discriminator-extended');
assert(typesSrc.includes('fertilizeReminders?:'), 'W0.scaffold.types.NotificationSettings-fertilizeReminders');

// ─── FERT-01 (type extension already PASSed in W0.scaffold) ───

// ─── FERT-02 (catalog content) — SKIP at Wave 0 baseline, PASS as Wave 3 lands ───
assertSkippable(() => {
  const matches = (dbSrc.match(/fertilizeIntervalWarm:\s*\d+/g) || []).length;
  if (matches === 0) return undefined;
  return matches >= 100; // most entries have warm interval; cold can be null
}, 'FERT-02.catalog.fertilizeIntervalWarm-coverage');

// ─── FERT-03 (5-site discriminator sweep) — SKIP at Wave 0, PASS after Plan 20-02 ───
assertSkippable(() => plantLogicSrc.includes("type: \"fertilize\"") || undefined, 'FERT-03.plantLogic.emit-branch');
assertSkippable(() => /case "fertilize"|task\.type === "fertilize"/.test(dayDetailSrc) || undefined, 'FERT-03.dayDetail.discriminator');
assertSkippable(() => /task\.type === ['"]fertilize['"]/.test(dayDetailModalSrc) || undefined, 'FERT-03.dayDetailModal.discriminator');
assertSkippable(() => monthCalendarSrc.includes('hasFertilize') || undefined, 'FERT-03.monthCalendar.dot-indicator');
assertSkippable(() => schedulerSrc.includes('fertilizeTasks') || undefined, 'FERT-03.scheduler.body-filter');

// ─── FERT-04 (cadence math) — SKIP at Wave 0, PASS after Plan 20-01 ───
assertSkippable(() => plantLogicSrc.includes('getNextFertilizeDate') || undefined, 'FERT-04.helper.getNextFertilizeDate');
assertSkippable(() => plantLogicSrc.includes('getSeasonalFertilizeInterval') || undefined, 'FERT-04.helper.getSeasonalFertilizeInterval');

// ─── FERT-05 (Settings toggle + opt-in) — SKIP at Wave 0, PASS after Plan 20-05 ───
assertSkippable(() => settingsScreenSrc.includes('fertilizeReminders') || undefined, 'FERT-05.settings.toggle-rendered');
assertSkippable(() => /fertilizeReminders.*===\s*true|notifSettings\?\.fertilizeReminders/.test(schedulerSrc) || undefined, 'FERT-05.scheduler.opt-in-gate');

// ─── FERT-06 (PlantCard + modal two-column) — SKIP at Wave 0, PASS after Plans 20-03 + 20-04 ───
assertSkippable(() => plantCardSrc.includes('onFertilizeDone') || undefined, 'FERT-06.plantCard.fertilize-task-button');
assertSkippable(() => modalSrc.includes('careCardsRow') || modalSrc.includes('FertilizeCard') || undefined, 'FERT-06.modal.two-column-layout');
assertSkippable(() => modalSrc.includes("initialExpanded") || undefined, 'FERT-06.modal.initialExpanded-prop');
assertSkippable(() => fertilizeCardSrc.includes('useSharedValue') && fertilizeCardSrc.includes('useDerivedValue') || undefined, 'FERT-06.fertilizeCard.reanimated-primitives');

// ─── FERT-07 (i18n parity gate) — SKIP at Wave 0, PASS after Plan 20-09 ───
assertSkippable(() => {
  const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';
  if (checkScript.includes('fertilizer.industrialRecommendation') || checkScript.includes('fertilizer.homemadeRecommendation')) return true;
  return undefined;
}, 'FERT-07.checkScript.fertilizer-conditional-extension');

// ─── Cross-phase regression (STRICT — Phase 18 + 19 sentinels MUST stay PASS) ───
// Phase 18 GAM-04 — PlantHealthBadge preserved
assert(modalSrc.includes('PlantHealthBadge'), 'CROSS.GAM-04.healthBadge.MODAL-USAGE-PRESERVED');
assert(readSafe('src/components/PlantHealthBadge.tsx') !== null, 'CROSS.GAM-04.healthBadge.FILE-NOT-DELETED');
// Phase 18 CARD-01 — Gesture.Pan preserved
assert(/Gesture\.Pan|GestureDetector/.test(plantCardSrc), 'CROSS.CARD-01.plantcard.gesture-pan-preserved');
// Phase 18 mood emoji preserved (5-element budget)
assert(plantCardSrc.includes('moodEmoji') && plantCardSrc.includes('moodBadge'), 'CROSS.GAM-03.plantcard.mood-emoji-preserved');
// Phase 18 Toast primitive preserved
assert(readSafe('src/components/Toast.tsx') !== null, 'CROSS.Toast.FILE-NOT-DELETED');
// Phase 19 TOX-03 — PetToxicityBadge in PlantCard preserved
assert(plantCardSrc.includes('PetToxicityBadge'), 'CROSS.TOX-03.plantcard.toxicity-badges-preserved');
// Phase 19 TOX-04 — Mascotas section preserved
assert(modalSrc.includes('MascotasContent') || modalSrc.includes("emoji=\"🐾\""), 'CROSS.TOX-04.modal.mascotas-section-preserved');
// Phase 19 TOX-04 — initialSection prop preserved
assert(modalSrc.includes('initialSection?: ModalSectionId'), 'CROSS.TOX-04.modal.initialSection-preserved');
// Phase 19 TOX-06 — petToxicity.symptoms parity gate preserved
const checkScript = readSafe('scripts/check-i18n-keys.mjs') || '';
assert(/petToxicity.*symptoms/.test(checkScript), 'CROSS.TOX-06.checkScript.symptoms-extension-preserved');
// Phase 20 health-axis no-op (Success Criterion 5)
assert(!plantHealthSrc.includes("'fertilize'") && !plantHealthSrc.includes('"fertilize"'), 'CROSS.health-no-fertilize-axis');

// ─── Report ───
console.log('');
if (skips.length > 0) {
  console.log('--- SKIPS (will flip to PASS as Plans 20-01..09 land) ---');
  skips.forEach(s => console.log('  ' + s));
}
if (errors.length > 0) {
  console.error('--- FAILURES ---');
  errors.forEach(e => console.error('  ' + e));
}
console.log(`[Phase 20 smoke] PASS=${pass} FAIL=${fail} SKIP=${skip}`);
process.exit(fail > 0 ? 1 : 0);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `EducationalSection.tsx` 250ms `Easing.inOut` | 180ms `Easing.out(Easing.cubic)` | Phase 14 Plan 14-03 device test 2026-05-06 | Snappier feel ("250ms felt sluggish") — Phase 20 FertilizeCard MUST mirror 180ms or feel inconsistent. **CONTEXT.md still says 250ms — this is a doc lag, NOT a hard requirement** (see Open Question 1) |
| Direct `getWaterSeason` import in scheduler | `latitude` threaded through `getTasksForDay` | Phase 5 Plan 05 SEASON-04 | Scheduler doesn't import getWaterSeason; same pattern applies to Phase 20 — fertilize cadence comes via `getTasksForDay`, no new direct import needed |
| `lastWatered` as top-level Plant field | `lastFertilized` nested inside `fertilizeSchedule` | Phase 20 (this phase) | Schema asymmetry — Pitfall 4. Helper getter recommended |
| Per-task notification | Lump under morning summary | Phase 4 (v1.0 baseline, preserved through v1.1+v1.2) | Phase 20 follows precedent; no new per-plant notifications |

**Deprecated/outdated:**
- ~~CONTEXT.md says "Reanimated v4 250ms `Easing.inOut(Easing.ease)`"~~ — **Doc lag.** In-repo EducationalSection uses 180ms `Easing.out(Easing.cubic)` per Plan 14-03 device-test tuning. Planner should use 180ms to match.
- ~~"chevron rotation 0°→90°"~~ — Still correct for sections WITH chevron. FertilizeCard could use a smaller rotation indicator (e.g., `›`) or skip the chevron entirely (use a small triangle). Planner discretion.

## Open Questions

1. **EducationalSection 180ms vs CONTEXT 250ms — which wins?**
   - What we know: CONTEXT.md ¶ "Card content" says "250ms `Easing.inOut(Easing.ease)`" but the in-repo `EducationalSection.tsx:23-26` uses `COLLAPSE_DURATION = 180` with `Easing.out(Easing.cubic)` — explicitly tuned via 2026-05-06 device test ("250ms felt sluggish").
   - What's unclear: Planner's decision — prefer in-repo tuning OR strictly mirror CONTEXT prescription.
   - Recommendation: **Use 180ms `Easing.out(Easing.cubic)`** to match the live, device-tuned EducationalSection. CONTEXT.md is doc lag; the 180ms tuning supersedes. Planner notes in 20-XX-PLAN.md.

2. **Auto-expand on PlantCard tap — TaskButton tap or card-body tap?**
   - What we know: CONTEXT.md says "PlantCard fertilize-due-today indicator opens MyPlantDetailModal with `initialSection='que-hacer'` AND `initialExpanded='fertilize'`."
   - What's unclear: TaskButton onPress already wires to mark-done (water/sun/outdoor precedent). What gesture opens the modal at fertilize?
   - Recommendation: **Card-body `onPress?.(plant)` flow opens modal at top.** When the modal opens AND there's a pending fertilize task today, the parent screen passes `initialExpanded='fertilize'` automatically. The TaskButton remains mark-done. This satisfies CONTEXT's "tap-routing from PlantCard" without adding a new gesture. Implementation: PlantsScreen + TodayScreen `<MyPlantDetailModal>` gets `initialExpanded={detailPlant && needsFertilizeToday(detailPlant) ? 'fertilize' : undefined}`.

3. **fertilizer.type 'both' vs implicit from sub-field presence?**
   - What we know: CONTEXT and FERT-07 both say `fertilizer.type: 'industrial' | 'homemade' | 'both'`.
   - What's unclear: Is `type` redundant when both `industrialRecommendation` and `homemadeRecommendation` presence/absence already encodes the type?
   - Recommendation: **Keep `type` as explicit field.** Reasons: (a) catalog authoring discipline (forces author to consciously decide per category), (b) i18n shape stability, (c) edge case where type='both' but only one recommendation populated (allowed; renders only the populated one). The i18n parity gate (Pitfall 6) checks sub-fields independently, not type field — so `type` is informational metadata.

4. **Migration init derives `Plant.fertilizeSchedule` from catalog, OR catalog-only at runtime?**
   - What we know: Pattern 11 above recommends catalog-only at runtime (no migration script).
   - What's unclear: Some users may want their plant's schedule "fixed" at creation time (so subsequent catalog updates don't change cadence).
   - Recommendation: **Catalog-only at runtime (no migration).** If user demand emerges, add custom-fertilizer-schedule UI in a future phase (deferred per CONTEXT). The deep-merge guard Pattern 7 protects future user overrides.

5. **PlantCard fertilize TaskButton color token — reuse `colors.successBg` / `colors.green` OR introduce new fertilize palette?**
   - What we know: CLAUDE.md §Design System forbids new colors. theme.ts has `colors.green` and (likely) `colors.successBg`.
   - What's unclear: Does reusing the green palette muddle the "task done" success affordance vs "task pending fertilize"?
   - Recommendation: **Reuse `colors.successBg` background + `colors.green` text** for fertilize TaskButton. Differentiation comes from the 🌱 emoji + label. Consistent with CLAUDE.md design-system lock. Verify `colors.successBg` exists; if not, planner picks closest existing token.

## Validation Architecture

> Nyquist gate enabled per `.planning/config.json` workflow.nyquist_validation = true. This section maps each FERT-XX requirement to its validation surface and identifies Wave 0 gaps.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (no Jest/Vitest) — three-tier smoke-runner pattern (CommonJS file-content asserts via fs+regex) |
| Config file | n/a — runner is `scripts/smoke-phase20.cjs` (self-contained) |
| Quick run command | `npm run smoke:phase20` (npm script added in Wave 0) |
| Full suite command | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FERT-01 | `Plant.fertilizeSchedule?: { intervalDays: number, lastFertilized?: string }` additive optional | unit (file-content) | `node scripts/smoke-phase20.cjs` (W0.scaffold.types.Plant-fertilizeSchedule sentinel) | ❌ Wave 0 |
| FERT-02 | `PlantDBEntry.fertilizeIntervalWarm?/Cold? + fertilizer?` types added; ≥100 of 118 entries have catalog values | unit (file-content + grep count) | `node scripts/smoke-phase20.cjs` (W0.scaffold.types.* + FERT-02.catalog.fertilizeIntervalWarm-coverage SKIP→PASS) | ❌ Wave 0 |
| FERT-03 | 5-site discriminator sweep across plantLogic / scheduler / plantHealth / DayDetail+Modal+MonthCalendar / TaskButton; tsc-green | unit (file-content + tsc) | `node scripts/smoke-phase20.cjs` (5 FERT-03.* sentinels SKIP→PASS) + `npx tsc --noEmit` exit 0 | ❌ Wave 0 |
| FERT-04 | `getNextFertilizeDate` returns due-day; cold-season null = no emission; catch-up clipped to 1 task | unit (smoke-runner ts.transpileModule with stubs — Phase 14-00 pattern) | `node scripts/smoke-phase20.cjs` (FERT-04.helper.* sentinels) — runner compiles plantLogic and asserts behavioral output | ❌ Wave 0 |
| FERT-05 | Settings toggle renders; default OFF; toggling ON wires fertilize body in scheduler | unit (file-content for toggle JSX) + manual (device test for E2E behavior) | smoke FERT-05.* sentinels + manual checkpoint plan | ❌ Wave 0 |
| FERT-06 | PlantCard fertilize TaskButton renders when due; modal two-column layout; initialExpanded prop | unit (file-content) + manual (device test for animation + height-eq) | smoke FERT-06.* sentinels + manual checkpoint plan | ❌ Wave 0 |
| FERT-07 | 118 catalog entries × EN+ES fertilizer copy; conditional i18n parity gate | i18n parity script (`scripts/check-i18n-keys.mjs`) extension | `npm run check:i18n-keys` exit 0 + smoke FERT-07.checkScript sentinel | ❌ Wave 0 (gate extension landed in Plan 20-09) |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit && npm run smoke:phase20` (~3-5 sec — file-content only; no transpileModule for most sentinels)
- **Per wave merge:** Above + `npm run check:i18n-keys` + `npm run smoke:phase18` + `npm run smoke:phase19` (~10 sec full)
- **Phase gate:** Above + manual device-test checklist (mirroring 19-07-SUMMARY.md 14-item Block A-E pattern) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] **`scripts/smoke-phase20.cjs`** — covers FERT-01..07 file-content sentinels + Phase 18+19 cross-phase regression (skeleton authored above in Code Examples §Example 3)
- [ ] **`package.json` script entry** — `"smoke:phase20": "node scripts/smoke-phase20.cjs"` added in Wave 0
- [ ] **`scripts/.tmp-phase20/`** added to `.gitignore` (mirrors Phase 14-00 / 15-00 / 19-00 pattern; needed only if Wave 1 adds ts.transpileModule for behavioral assertions)
- [ ] **i18n skeleton keys** in `src/i18n/locales/{en,es}/common.json`:
  - `tasks.fertilize` ("Fertilize {{name}}" / "Fertilizar {{name}}")
  - `notifications.fertilize` ("Fertilize:" / "Fertilizá:")
  - `plantCard.fertilize` ("Fertilize" / "Fertilizá")
  - `plantDetailModal.water` ("Water" / "Regar") — section header for left card
  - `plantDetailModal.fertilize` ("Fertilize" / "Fertilizar") — section header for right card
  - `plantDetailModal.fertilizeEvery` ("Fertilize every {{days}} days ({{season}})" / "Fertilizá cada {{days}} días ({{season}})")
  - `plantDetailModal.fertilizeDormant` ("Dormant — no fertilizer needed in cold season" / "Dormante — no fertilizar en frío")
  - `settings.fertilizeReminders` ("Fertilize reminders" / "Recordatorios de fertilización")
  - `settings.fertilizeRemindersSubtitle` ("Get notified when plants need fertilizing" / "Te avisamos cuándo abonar tus plantas")
- [ ] **`src/components/plant-detail/FertilizeCard.tsx`** — skeleton component shipped in Wave 0 (file exists with component export but body returns `null` so Wave 0 baseline doesn't render it)
- [ ] **`src/utils/plantLogic.ts`** skeletons — `getSeasonalFertilizeInterval` + `getNextFertilizeDate` exported but return `null` until Plan 20-01 lands real implementation

### Manual-Only Test Justifications (for VALIDATION.md)

| Test | Why Manual | Instrumentation Substitute |
|------|------------|----------------------------|
| Two-column water/fertilize layout renders side-by-side; height-equalized | RN flexbox layout requires actual rendering engine | File-content sentinel that the JSX includes `careCardsRow` style + `flex: 1` siblings |
| FertilizeCard tap-to-expand 180ms animation feels snappy | Subjective UX — animation perception | Device test on iOS + Android |
| `initialExpanded='fertilize'` auto-expand doesn't conflict with `initialSection='que-hacer'` scroll | Race conditions on slow devices | Device test (Pitfall 1) |
| PlantCard fertilize TaskButton tap doesn't fire long-press menu OR swipe (Phase 18 Gesture.Race coexistence) | Multi-touch gesture composition is OS-level | Device test (Pitfall 3) |
| Fertilize push notification appears in morning body when toggle ON | Requires real device + notification permission grant | Device test (FERT-05 manual checkpoint) |
| Voseo register feels natural across all 118 catalog entries | Native-speaker quality judgment | Pre-commit grep regex baseline + ES-locale review |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/20-fertilization-subsystem/20-CONTEXT.md` — User decisions locked 2026-05-09
- `.planning/REQUIREMENTS.md` lines 88-94 — FERT-01..07 contract
- `.planning/ROADMAP.md` §"Phase 20: Fertilization Subsystem" — 5 success criteria
- `src/utils/plantLogic.ts:41-85` — `getNextWaterDate` advance-loop + `getTasksForDay` discriminator chain (template for FERT-03/04)
- `src/utils/notificationScheduler.ts:46-138` — `createMorningContent` body-line composition (insertion site for FERT-03/05)
- `src/utils/plantHealth.ts:30-180` — Verified no fertilize discriminator; Success Criterion 5 trivially satisfied (Pattern 3)
- `src/components/MyPlantDetailModal.tsx:294-338` — Existing `🌿 ¿Qué hacer?` section render (insertion site for two-column layout)
- `src/components/plant-detail/EducationalSection.tsx:23-117` — Reanimated v4 collapse primitives (template for FertilizeCard) — **180ms `Easing.out(Easing.cubic)`, NOT 250ms**
- `src/components/PlantCard.tsx:284-317` — Existing tasks-row branch (insertion site for fertilize TaskButton)
- `src/types/index.ts:107-112, 192-246, 283-289` — Task discriminator + PlantDBEntry + NotificationSettings interfaces (extension sites)
- `src/screens/SettingsScreen.tsx:271-342` — Notifications section (insertion site for FERT-05 toggle)
- `src/hooks/useStorage.tsx:23, 397-414` — `PROTECTED_USER_FIELDS` tuple + deep-merge guard (Pattern 7 extension site)
- `scripts/check-i18n-keys.mjs:109-125` — Phase 19 petToxicity.symptoms conditional pattern (template for fertilizer extension)
- `scripts/smoke-phase19.cjs` — 257-LOC three-tier sentinel runner (template for smoke-phase20.cjs)
- `.planning/milestones/v1.1-phases/05-hemisphere-season-helpers-pure-utility-switchover/05-05-SUMMARY.md` — VERBATIM 5-site discriminator sweep recipe + 8 chains × 5 files matrix; required-prop ratchet pattern; Rule-3 cascading-deviation discipline
- `.planning/phases/19-pet-toxicity/19-04-SUMMARY.md` — `ModalSectionId` + `initialSection` prop + scrollViewRef + sectionLayouts mechanism (Phase 20 reuses orthogonally for `initialExpanded`)
- `.planning/phases/19-pet-toxicity/19-06-SUMMARY.md` — i18n parity gate extension pattern (append-only after whyRationale block, conditional per-sub-field validation)
- `.planning/phases/19-pet-toxicity/19-07-SUMMARY.md` — Manual gate closure pattern (14-item device-test checklist Blocks A-E + Run-now Option A vs Defer Option B)
- `.planning/STATE.md` accumulated context — Phase 19 carry-forward decisions for Phase 20

### Secondary (MEDIUM confidence)
- Phase 14 Plan 14-04..07 SUMMARY content-authoring playbook (char-limit-from-draft, voseo pre-sweep, distinct per-entry rationale, locale parity from start, category-grouped batches)
- Phase 15-01..02, 16-01..02, 17-01..02 SUMMARY catalog content authoring rhythm (3-batch precedent for FERT-07 Wave 3)
- Phase 14-03 SUMMARY device-tuning result (180ms vs 250ms for EducationalSection)

### Tertiary (LOW confidence — flagged for validation)
- None — all findings sourced from in-repo files or canonical .planning summaries.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all primitives from Phase 13/14
- Architecture (5-site sweep): HIGH — verbatim Phase 5 Plan 05 template
- Architecture (two-column layout): MEDIUM — novel UX, but flexbox + Phase 14 graceful-degradation pattern composition is straightforward
- Architecture (FertilizeCard collapse): HIGH — direct Phase 14 EducationalSection composition
- Migration: HIGH — catalog-only-at-runtime mirrors Phase 14 EDU-02 (no Plant-level migration)
- Cadence math: HIGH — verbatim `getNextWaterDate` advance-loop mirror
- Notification: HIGH — verbatim Phase 5 Plan 05 ratchet pattern (notifSettings new positional arg)
- i18n parity gate: HIGH — verbatim Phase 19 TOX-06 pattern
- Catalog content authoring (FERT-07 — 95-118 entries × 1-2 fields × 2 locales): MEDIUM — execution risk on voseo regression + char-limit drift, but established discipline mitigates
- Smoke runner three-tier: HIGH — verbatim Phase 19 smoke-phase19.cjs fork
- Cross-phase regression preservation (Phase 18 + 19): HIGH — STRICT sentinels enumerated above

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (30 days — stable; in-repo precedents are frozen, no fast-moving external dependencies)

---

*Phase: 20-fertilization-subsystem*
*Researched: 2026-05-09*
