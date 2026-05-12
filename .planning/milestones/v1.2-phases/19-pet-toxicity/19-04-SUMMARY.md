---
phase: 19-pet-toxicity
plan: "04"
subsystem: MyPlantDetailModal
tags: [tox-04, mascotas, scroll-to-section, pet-toxicity, educational-modal]
dependency_graph:
  requires: [19-00, 19-01, 19-02, 19-03]
  provides: [initialSection-prop, mascotas-section, scroll-to-mascotas]
  affects: [PlantsScreen, TodayScreen, MyPlantDetailModal]
tech_stack:
  added: []
  patterns:
    - "ScrollView ref + sectionLayouts.current for programmatic scroll-to-section"
    - "50ms setTimeout Pitfall-2 mitigation for onLayout race on slow devices"
    - "Module-level sub-components (SpeciesLine/MascotasContent) referencing post-hoc styles"
    - "returnObjects: true for plants.json symptom arrays via react-i18next"
key_files:
  created: []
  modified:
    - src/components/MyPlantDetailModal.tsx
    - src/screens/PlantsScreen.tsx
    - src/screens/TodayScreen.tsx
decisions:
  - "MascotasContent + SpeciesLine defined at module level (below styles) — hooks require module-level scope; placement after styles avoids const-before-init issues since components only instantiate at render time"
  - "50ms setTimeout chosen over requestAnimationFrame — 50ms absorbs slow-device layout settle per RESEARCH Pitfall 2; matches plan prescription"
  - "@ts-expect-error placeholders removed from PlantsScreen + TodayScreen as part of Task 1 (prop now exists — unused directives would cause tsc errors)"
  - "Symptoms list graceful degradation: when t() returns the key string (i18n miss) instead of an array, Array.isArray guard silently omits the list"
metrics:
  duration: 3min
  completed: "2026-05-09"
  tasks: 2
  files: 3
---

# Phase 19 Plan 04: initialSection Prop + Mascotas Section Summary

TOX-04 closure: 5-section MyPlantDetailModal with scroll-to-section via `initialSection` prop and always-visible `🐾 Mascotas` educational section covering all 4 ToxLevel × 2 species combinations.

## What Was Built

### initialSection Prop API

`ModalSectionId` exported type: `'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas'`

`MyPlantDetailModalProps.initialSection?: ModalSectionId` — when set on open, the ScrollView scrolls to that section's y-coordinate after layout settles.

**Consumer wiring (all three consumers from Plan 19-03):**
- `PlantsScreen.tsx` — passes `detailInitialSection` (set to `'mascotas'` on badge tap)
- `TodayScreen.tsx` — passes `detailInitialSection` (set to `'mascotas'` on badge tap)
- `AddPlantModal` (Plan 19-05) — will pass `'mascotas'` on banner tap (Plan 19-05 territory)

**@ts-expect-error cleanup:** Plans 19-03 had placed `@ts-expect-error` on both screen files optimistically. Those comments were removed in Task 1 since the prop now exists.

### Scroll-to-Section Mechanism

- `scrollViewRef = useRef<ScrollView>(null)` — attached via `ref={scrollViewRef}` on the ScrollView
- `sectionLayouts = useRef<Partial<Record<ModalSectionId, number>>>({})` — captures `layout.y` from each section's `onLayout`
- `onSectionLayout(id)` — curried factory: `(id: ModalSectionId) => (e: LayoutChangeEvent) => { sectionLayouts.current[id] = e.nativeEvent.layout.y }`
- Scroll effect: 50ms `setTimeout` + `scrollViewRef.current?.scrollTo({ y, animated: true })` on `[visible, initialSection]` change
- Layout reset effect: `sectionLayouts.current = {}` on modal hide to prevent stale y values on re-open

**Pitfall 2 mitigation chosen:** 50ms `setTimeout` (vs `setTimeout(fn, 0)` or `requestAnimationFrame`). The 50ms window absorbs slow-device layout settle before `scrollTo` fires.

### Mascotas Section Position

Section order (locked per CONTEXT.md):
1. 🌿 ¿Qué hacer?
2. 🏠 ¿Dónde ponerla?
3. ℹ️ ¿Por qué? (conditional — only when `whyRationale` present)
4. ⚙️ Tus ajustes
5. **🐾 Mascotas** ← NEW, ALWAYS renders

### Per-State Copy Matrix

| cats \ dogs | safe | caution | toxic | unknown |
|---|---|---|---|---|
| **safe** | `safeForBoth` (single line) | 2 lines: `safeForSpecies` + `cautionForSpecies`+symptoms | 2 lines: `safeForSpecies` + `toxicForSpecies`+symptoms | 2 lines: `safeForSpecies` + `unverifiedLatam` |
| **caution** | 2 lines: `cautionForSpecies`+symptoms + `safeForSpecies` | 2 lines each with symptoms | … | … |
| **toxic** | 2 lines: `toxicForSpecies`+symptoms + `safeForSpecies` | … | 2 lines each with symptoms | … |
| **unknown** | 2 lines: `unverifiedLatam` + `safeForSpecies` | … | … | 2 lines: `unverifiedLatam` × 2 |

Collapsed to **5 distinct render paths**:
1. Both safe → `safeForBoth`
2. One species safe → `safeForSpecies`
3. One species unknown → `unverifiedLatam`
4. One species caution → `cautionForSpecies` + optional symptoms list
5. One species toxic → `toxicForSpecies` + optional symptoms list

### Symptoms Graceful Degradation

Symptoms read via `t('plants:<plantId>.petToxicity.symptoms.<species>', { returnObjects: true, defaultValue: [] })`.

- When `plantId` is undefined (custom plant) → `symptoms = []` (no-op, header only)
- When plants.json has no entry for that species → t() returns `[]` default → `Array.isArray` guard passes, `length === 0` → no symptoms rendered (header only)
- When symptoms array present → `symptomsLabel` header + bullet list rendered

## Deviations from Plan

**1. [Rule 1 - Cleanup] Removed @ts-expect-error from PlantsScreen + TodayScreen**
- **Found during:** Task 1 (objective note in prompt)
- **Issue:** Plan 19-03 placed `@ts-expect-error` on `initialSection` prop pass; once prop lands, directives become "Unused @ts-expect-error directive" tsc errors
- **Fix:** Removed both comment lines as part of Task 1 edits
- **Files modified:** `src/screens/PlantsScreen.tsx`, `src/screens/TodayScreen.tsx`
- **Commit:** 5e3f278

**2. [Design] Sub-components at module level vs inside function body**
- **Found during:** Task 2 implementation
- **Issue:** Plan suggested "inside the function body" but `MascotasContent` and `SpeciesLine` use `useTranslation()` hook — hooks require stable (non-nested) component definitions; defined inside the render function would violate Rules of Hooks
- **Fix:** Placed both sub-components at module level, after the `styles` `StyleSheet.create` block
- **No behavior change:** Components reference `styles` correctly at render time

## All 4 TOX-04 Smoke Sentinels: PASS

| Sentinel | Before Plan 19-04 | After Plan 19-04 |
|---|---|---|
| `TOX-04.modal.mascotas-section-present` | SKIP | **PASS** |
| `TOX-04.modal.initialSection-prop-defined` | SKIP | **PASS** |
| `TOX-04.modal.scrollTo-section-mechanism` | SKIP | **PASS** |
| `TOX-04.modal.mascotas-content-renderer` | SKIP | **PASS** |

Phase 19 smoke: PASS=78 FAIL=0 SKIP=7 (remaining 7 are TOX-05/06 territory)
Phase 18 smoke: PASS=56 FAIL=0 SKIP=0 (no regression)

## Self-Check: PASSED

Files verified:
- `src/components/MyPlantDetailModal.tsx` — exists, contains `ModalSectionId`, `initialSection`, `scrollViewRef`, `MascotasContent`, `SpeciesLine`, `🐾`
- `src/screens/PlantsScreen.tsx` — `@ts-expect-error` removed
- `src/screens/TodayScreen.tsx` — `@ts-expect-error` removed

Commits verified:
- `5e3f278` — Task 1: initialSection + scroll mechanism
- `0e47c5b` — Task 2: Mascotas section
