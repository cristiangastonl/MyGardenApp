---
phase: 06-ui-read-side-propagation
plan: "06"
subsystem: ui
tags: [today-screen, soil-check, empty-state, ux-03, wave-3, memo, i18n]
dependency_graph:
  requires:
    - src/utils/plantLogic.ts (getNextWaterDate — already imported in TodayScreen)
    - src/utils/dates.ts (isSameDay already imported; daysBetween added)
    - src/i18n/locales/en/common.json (Plan 06-02 — today.soilCheckEmptyRow key)
    - src/i18n/locales/es/common.json (Plan 06-02 — today.soilCheckEmptyRow key with voseo)
    - src/screens/TodayScreen.tsx (plantsWithTasks memo + all-caught-up block)
  provides:
    - src/screens/TodayScreen.tsx (soilCheckSilentPlants memo + per-plant info-row section + all-caught-up triple guard)
  affects:
    - Phase 7 — TodayScreen read-side is complete; no further UX-03 work expected
    - gsd:verify-work — manual UAT matrix item UX-03 can now be exercised on device
tech_stack:
  added: []
  patterns:
    - Parallel memo pattern — soilCheckSilentPlants is a sibling to plantsWithTasks, mutually exclusive via isSameDay filter
    - Triple-condition empty-state guard — plants.length > 0 && plantsWithTasks.length === 0 && soilCheckSilentPlants.length === 0
    - Alphabetical sort for passive info rows — vs. favorite-first for actionable task cards
key_files:
  created: []
  modified:
    - src/screens/TodayScreen.tsx (soilCheckSilentPlants memo + per-plant info rows + all-caught-up guard + 3 new styles)
key-decisions:
  - "soilCheckSilentPlants sorted by name (alphabetical) NOT by favorite — passive info rows have no actionable priority; favorite sort is reserved for plantsWithTasks where the user has tasks to complete"
  - "Inline JSX for soil-check rows — no new component file, per CONTEXT.md 'inline labels over abstract badge components if call sites are few'"
  - "daysBetween(today, getNextWaterDate(...)) for countdown — getNextWaterDate already returns the next due date >= today, so daysBetween gives the correct forward-looking count without a separate getSeasonalInterval call"
  - "lat extracted as const inside memo body for clarity — functionally equivalent to inline location?.lat ?? null in each call site"
requirements-completed:
  - UX-03
duration: 4min
completed: "2026-05-01"
---

# Phase 6 Plan 6: Wave 3 TodayScreen — soilCheckSilentPlants + UX-03 Empty-State Rows Summary

**Wave 3 (final): TodayScreen now renders a per-plant info row (🤚 + i18n countdown) for every soil_check plant on a non-check-in day, guards the "all caught up" celebration with a triple condition, and maintains mutual exclusion with the plantsWithTasks section via isSameDay.**

---

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-01
- **Completed:** 2026-05-01
- **Tasks:** 1
- **Files modified:** 1

---

## Accomplishments

- UX-03 satisfied: soil_check plants on non-check-in days are now visible in "Hoy" as per-plant info rows. Users with only cacti no longer see a misleading "All caught up!" celebration.
- "All caught up" guard updated from dual-condition to triple-condition: `plants.length > 0 && plantsWithTasks.length === 0 && soilCheckSilentPlants.length === 0`.
- Mutual exclusion between plantsWithTasks (PlantCard with check_soil task) and soilCheckSilentPlants (info row) is enforced by the same `isSameDay(nextCheckIn, today)` predicate used in both memos.
- Phase 6 complete: all 5 requirements (LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03) shipped across 6 plans, 3 waves, ~10 file modifications, 0 new theme tokens, 15 new i18n key paths × 2 locales.

---

## soilCheckSilentPlants Memo Shape

```typescript
const soilCheckSilentPlants = useMemo(() => {
  const lat = location?.lat ?? null;
  const silent = plants.filter((plant) => {
    if (plant.waterMode !== 'soil_check') return false;
    const nextCheckIn = getNextWaterDate(plant, today, lat);
    return !isSameDay(nextCheckIn, today);
  });
  // Stable order: by plant name (alphabetical). Avoids reorder-flicker on re-render.
  return silent.sort((a, b) => a.name.localeCompare(b.name));
}, [plants, today, location?.lat]);
```

Key properties:
- Strict `=== 'soil_check'` discriminator — `undefined` waterMode (legacy/migration-failure) treated as fixed-mode, consistent with Phase 5 Plan 04 WATER-06 gate idiom.
- `!isSameDay(nextCheckIn, today)` — mutually exclusive with plantsWithTasks's `isSameDay(nextWater, today)` check.
- Alphabetical sort — not favorite-first. Silent rows are passive info; favorites sort applies only to actionable task cards.

---

## JSX Section Shape (per-plant info rows)

```tsx
{/* UX-03: soil-check info rows — per-plant on non-check-in days */}
{soilCheckSilentPlants.length > 0 && (
  <View style={styles.section}>
    {soilCheckSilentPlants.map((plant) => {
      const daysLeft = daysBetween(
        today,
        getNextWaterDate(plant, today, location?.lat ?? null)
      );
      return (
        <View key={plant.id} style={styles.soilCheckRow}>
          <Text style={styles.soilCheckIcon}>🤚</Text>
          <Text style={styles.soilCheckText}>
            {t('today.soilCheckEmptyRow', { plantName: plant.name, days: daysLeft })}
          </Text>
        </View>
      );
    })}
  </View>
)}
```

The `🤚` is a leading icon in JSX (NOT part of the i18n string) — distinct from PlantCard's waterBadge where the emoji IS in the i18n string per the emoji-throughout convention. The separation here follows the CONTEXT.md pattern where the icon is a visual element and the body text is the localized sentence.

---

## All-Caught-Up Guard: Before → After

**Before (Plan 05 state):**
```tsx
{plants.length > 0 && plantsWithTasks.length === 0 && (
```

**After (Plan 06-06):**
```tsx
{plants.length > 0 && plantsWithTasks.length === 0 && soilCheckSilentPlants.length === 0 && (
```

---

## New Styles (all existing theme tokens)

```typescript
soilCheckRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: colors.bgSecondary,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  marginBottom: spacing.sm,
},
soilCheckIcon: {
  fontSize: 20,
  marginRight: spacing.sm,
  marginTop: 1, // optical alignment with first line of body text
},
soilCheckText: {
  flex: 1,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.textSecondary,
  lineHeight: 20,
},
```

Zero new theme tokens. All values from `src/theme.ts`.

---

## Manual UAT Results (UX-03)

Not yet run on device — code-layer commit. Per the Manual-Only table in `06-VALIDATION.md`, UAT for UX-03 requires Expo Go on iOS simulator/Android emulator to confirm:

1. Add ONLY a cactus (soil_check). Open Hoy on non-check-in day → ONE info row reads `Tu Cactus está en modo chequeo. Te avisamos en N días.` Celebration empty state does NOT render.
2. Add a non-cactus with a task today + a cactus → both render: the non-cactus as PlantCard with task buttons, the cactus as info row alongside.
3. Empty garden → empty-state copy ("Tu jardín está vacío") renders, soil-check section absent.
4. Cactus on its check-in day → appears in plantsWithTasks (PlantCard with check_soil task), NOT in soilCheckSilentPlants.

UAT deferred to `/gsd:verify-work` session per Phase 6 workflow.

---

## Phase 6 Completion Summary

Phase 6 ships UX polish for the v1.1 precision-care model across 6 plans, 3 waves:

| Wave | Plans | Requirements | Files |
|------|-------|-------------|-------|
| 0 | 06-01 | LIGHT-06, LIGHT-07, SEASON-05 (utilities) | lightLabel.ts (created), plantLogic.ts, smoke-phase06.mjs (created) |
| 1 | 06-02 | All 5 (i18n layer) | en/common.json, es/common.json, smoke-phase06.mjs |
| 2 | 06-03, 06-04, 06-05 | UX-02, LIGHT-06, LIGHT-07, SEASON-05 (component swaps) | PlantCard, PlantHealthDetail, MyPlantDetailModal, PlantDetailModal, PlantDatabaseCard |
| 3 | 06-06 | UX-03 (TodayScreen empty-state) | TodayScreen |

All 5 requirements satisfied: LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03.
- 15 new i18n key paths × 2 locales (EN + ES voseo) = 30 key-locale pairs
- 0 new theme tokens
- ~10 file modifications total
- smoke-phase06.mjs: 82/82 PASS throughout
- migration-smoke-test.mjs: 106/106 PASS throughout
- `npx tsc --noEmit` green at every task commit

---

## Task Commits

| Hash | Task | Description |
|------|------|-------------|
| 8c6c930 | Task 1 | feat(06-06): TodayScreen — soilCheckSilentPlants memo + per-plant row + all-caught-up guard (UX-03) |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

- `src/screens/TodayScreen.tsx` — modified, exists
- Commit 8c6c930 — present in git log
- `npx tsc --noEmit` — exits 0
- `node scripts/smoke-phase06.mjs` — 82/82 PASS
- `node scripts/migration-smoke-test.mjs` — 106/106 PASS
- `grep -c "import.*daysBetween.*from '../utils/dates'" src/screens/TodayScreen.tsx` === 1
- `grep -c "const soilCheckSilentPlants = useMemo" src/screens/TodayScreen.tsx` === 1
- `grep -c "soilCheckSilentPlants" src/screens/TodayScreen.tsx` === 5
- `grep -c "t('today.soilCheckEmptyRow'" src/screens/TodayScreen.tsx` === 1
- `grep -c "soilCheckSilentPlants.length === 0" src/screens/TodayScreen.tsx` === 1
- `grep -c "soilCheckRow:" src/screens/TodayScreen.tsx` === 1
- `grep -c "soilCheckIcon:" src/screens/TodayScreen.tsx` === 1
- `grep -c "soilCheckText:" src/screens/TodayScreen.tsx` === 1
- `grep -c "colors.bgSecondary" src/screens/TodayScreen.tsx` >= 1
