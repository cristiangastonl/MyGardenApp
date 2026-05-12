---
phase: 14-educational-detail-modal
plan: 02
subsystem: storage-guard + override-detection + i18n
tags: [edu-06, edu-05, edu-01, deep-merge-guard, override-comparator, voseo, locale-parity]

# Dependency graph
requires:
  - phase: 14-educational-detail-modal
    plan: 00
    provides: "smoke-phase14.mjs SKIP placeholders for W1.EDU-06.1 and W1.EDU-05.* (deep-merge guard + override comparator behavioral assertions)"
provides:
  - "useStorage.updatePlant deep-merge guard (PROTECTED_USER_FIELDS + fromUserEdit option) — catalog-source code paths can't silently overwrite user-customized waterSchedule, lightLevel, waterMode"
  - "compareUserVsCatalog pure utility — drives Plan 14-03 YourSettings section soft override notes"
  - "6 plantDetailModal i18n keys (en + es voseo, locale parity) — 4 section titles + override note + custom-plant placeholder"
affects: [14-03-modal-restructure]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deep-merge guard via single-flag opt-in (CRIT-1 lock from .planning/research/PITFALLS.md)"
    - "Pure utility module style — named exports only, import type, no React/I/O/logging (mirrors src/utils/seasonality.ts)"
    - "Locale parity discipline — identical key set in en/es common.json plantDetailModal namespace"
    - "Voseo lock — overrideNote uses 'Querés' (es-AR), not 'Quieres' (Castilian)"

key-files:
  created:
    - "src/utils/overrideDetection.ts (78 LOC)"
  modified:
    - "src/hooks/useStorage.tsx (+33 lines: PROTECTED_USER_FIELDS const + UpdatePlantOptions interface + updatePlant signature change + 16-line guard block)"
    - "src/i18n/locales/en/common.json (+6 keys in plantDetailModal namespace)"
    - "src/i18n/locales/es/common.json (+6 keys in plantDetailModal namespace, voseo)"

key-decisions:
  - "PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode'] as const — readonly tuple, type-safe key indexing without cast"
  - "Single fromUserEdit boolean flag (NOT per-field opt-in) — RESEARCH §Open Questions Q3 lock; per-field is YAGNI"
  - "Guard runs BEFORE alias-rewrite — locked ordering per RESEARCH §Pitfall 1; functionally equivalent today (databaseId not protected) but documented design"
  - "existing[key] !== undefined guard, not !== null — null is treated as deliberate user-clear; only undefined means 'no user value yet'"
  - "key in normalizedUpdates check, not normalizedUpdates[key] truthy — catches { waterSchedule: undefined } explicit-erase intent"
  - "compareUserVsCatalog returns 3 fields only (lightLevel, waterScheduleWarm, waterScheduleCold) — tempMin/tempMax/humidity climate-driven; waterMode category-derived; all excluded per CONTEXT.md lock"
  - "Field discriminator strings camelCase ('waterScheduleWarm' not 'waterSchedule.warm') — fileable as i18n key suffixes if Plan 14-03 needs"
  - "ES overrideNote locked verbatim from REQUIREMENTS.md line 43 — 'Diferente a la recomendación para esta especie. ¿Querés ajustar?'"
  - "EN overrideNote tone non-pushy — 'Want to adjust?' not 'You should adjust' (CONTEXT.md guardrail)"
  - "No retrofit of existing 7 updatePlant call sites — all touch non-protected fields per RESEARCH §Pitfall 1 audit (PlantsScreen.tsx:109 favorite, CalendarScreen.tsx:86/95/107 sun/outdoor, TodayScreen.tsx:187/194/204 lastWatered/sunDoneDate/outdoorDoneDate)"

requirements-completed: [EDU-06, EDU-05, EDU-01]

# Metrics
duration: 11min
completed: 2026-05-05
---

# Phase 14 Plan 02: Storage Guard + Override Detection + Section Labels Summary

**Wave 1 storage hardening landed: useStorage.updatePlant gains a single-flag deep-merge guard (PROTECTED_USER_FIELDS + fromUserEdit option) that drops catalog-source overwrites of user-customized waterSchedule/lightLevel/waterMode; src/utils/overrideDetection.ts lands as a pure 78-LOC comparator returning OverrideResult[] for 3 user-set fields; both common.json locales gain 6 plantDetailModal keys (whatToDo / whereToPlace / why / yourSettings / overrideNote / notInCatalog) with locale parity and voseo discipline; smoke runner W1.EDU-06.1 + W1.EDU-05.* flipped from SKIP to PASS at 15/19.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-05-05T02:25:19Z
- **Completed:** 2026-05-05T02:35:54Z
- **Tasks:** 3
- **Files:** 4 (1 created, 3 modified)

## Accomplishments

- `src/hooks/useStorage.tsx` gains the EDU-06 deep-merge guard:
  - `PROTECTED_USER_FIELDS = ['waterSchedule', 'lightLevel', 'waterMode'] as const` (module scope, readonly tuple)
  - `UpdatePlantOptions { fromUserEdit?: boolean }` interface
  - `updatePlant(id, updates, options?)` signature with optional 3rd param
  - Per-field guard fires BEFORE Phase-8 CAT-05 alias-rewrite — drops catalog-source updates silently with `__DEV__` console.warn when the existing plant has a non-undefined value
  - StorageActions interface signature updated to mirror new shape
- `src/utils/overrideDetection.ts` (NEW, 78 LOC) — pure comparator:
  - Named exports: `compareUserVsCatalog`, `OverrideField`, `OverrideResult`
  - 3-field detection: lightLevel, waterScheduleWarm, waterScheduleCold
  - Returns `[]` on null entry, no user values set, or full match
  - `import type` only — no React, no I/O, no console logging
- 6 new keys in `src/i18n/locales/{en,es}/common.json` plantDetailModal namespace:
  - whatToDo / whereToPlace / why / yourSettings — section titles (emojis live in component, not key)
  - overrideNote — verbatim from REQUIREMENTS.md line 43 (ES voseo)
  - notInCatalog — non-pushy custom-plant placeholder
- Locale parity verified — `JSON.stringify(en.plantDetailModal keys.sort()) === JSON.stringify(es.plantDetailModal keys.sort())` returns `true`

## Task Commits

1. **Task 1: Add deep-merge guard to useStorage.updatePlant (EDU-06)** — `4db97bd` (feat)
2. **Task 2: Create src/utils/overrideDetection.ts with compareUserVsCatalog (EDU-05)** — `cadd0d0` (feat)
3. **Task 3: Add 6 plantDetailModal i18n keys (en + es voseo, locale parity)** — `ed42884` (feat)

## Files Created/Modified

- `src/hooks/useStorage.tsx` (MODIFIED, +33 lines, now 827 LOC) — PROTECTED_USER_FIELDS const + UpdatePlantOptions interface + updatePlant signature + 16-line guard block
- `src/utils/overrideDetection.ts` (CREATED, 78 LOC) — pure comparator: compareUserVsCatalog + OverrideField + OverrideResult
- `src/i18n/locales/en/common.json` (MODIFIED, +6 keys, now 829 LOC) — plantDetailModal namespace gains 6 educational labels
- `src/i18n/locales/es/common.json` (MODIFIED, +6 keys, now 829 LOC) — same with es-AR voseo discipline

## Smoke Runner Final State

**Exact stdout final line:** `[smoke-phase14] PASS 15/19 (4 placeholders skipped — Wave 1+ will flip)`

### PASSes (15)

Plan 14-02 owned the flips of:
- **W1.EDU-06.1** — `useStorage.updatePlant has PROTECTED_USER_FIELDS + fromUserEdit option` (was SKIP, now PASS)
- **W1.EDU-05.*** — `compareUserVsCatalog returns correct override list (null=0, full-mismatch=3, partial=2)` (was SKIP, now PASS — runtime ts.transpileModule + dynamic import behavioral assertion)

Other PASSes carried from previous plans:
- 6 W0 scaffold PASSes (Plan 14-00)
- 1 EDU-04 regression PASS (Plan 14-00)
- 5 W1.EDU-02.1..5 PASSes (Plan 14-01 type extension landed at commit `7cbd999` running in parallel)
- 1 W1.EDU-02.6 PASS (getTranslatedPlant body — landed alongside the 14-01 type-extension Wave 1 work)

### SKIPs (4) — Wave 1+ flip targets remaining

| Label                                                                                         | Flipped by  |
| --------------------------------------------------------------------------------------------- | ----------- |
| W1.EDU-07.1: scripts/check-i18n-keys.mjs has conditional checks for all 5 new fields          | Plan 14-01 (still in flight) |
| W2.EDU-01.1-4: MyPlantDetailModal.tsx contains all 4 locked emoji anchors (🌿/🏠/ℹ️/⚙️)        | Plan 14-03  |
| W2.EDU-01.5: MyPlantDetailModal.tsx imports EducationalSection                                | Plan 14-03  |
| W2.EDU-01.6: EducationalSection.tsx uses Reanimated v4                                        | Plan 14-03  |

### FAILs (0)

None.

## EDU-06 Guard Behavior — Code Excerpt

The guard sits **before** the existing CAT-05 alias-rewrite, mirroring the locked design from `.planning/research/PITFALLS.md` CRIT-1:

```typescript
const updatePlant = useCallback((id: string, updates: Partial<Plant>, options: UpdatePlantOptions = {}) => {
  const normalizedUpdates = { ...updates };

  // ─── v1.2 Phase 14 (EDU-06) deep-merge guard ───
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

  // Existing alias-rewrite (Phase 8 CAT-05) — unchanged
  if (updates.databaseId) { ... }
  ...
});
```

Existing 7 call sites verified file-disjoint with protected fields:

| Call site                            | Updates | Protected? |
| ------------------------------------ | ------- | ---------- |
| PlantsScreen.tsx:109                 | favorite | NO        |
| CalendarScreen.tsx:86                | sunDoneDate | NO     |
| CalendarScreen.tsx:95                | outdoorDoneDate | NO |
| CalendarScreen.tsx:107               | sunDays | NO        |
| TodayScreen.tsx:187                  | lastWatered | NO    |
| TodayScreen.tsx:194                  | sunDoneDate | NO    |
| TodayScreen.tsx:204                  | outdoorDoneDate | NO |

**Zero retrofit needed.** The guard is dormant for all current call paths and only activates when Plan 14-03 (modal restructure) introduces picker save flows that touch waterSchedule/lightLevel/waterMode.

## 6 New i18n Keys (verbatim from common.json)

### ES (es-AR voseo)

```json
"whatToDo": "¿Qué hacer?",
"whereToPlace": "¿Dónde ponerla?",
"why": "¿Por qué?",
"yourSettings": "Tus ajustes",
"overrideNote": "Diferente a la recomendación para esta especie. ¿Querés ajustar?",
"notInCatalog": "Esta planta no está en nuestro catálogo todavía."
```

### EN

```json
"whatToDo": "What to do?",
"whereToPlace": "Where to place it?",
"why": "Why?",
"yourSettings": "Your settings",
"overrideNote": "Different from the recommendation for this species. Want to adjust?",
"notInCatalog": "This plant isn't in our catalog yet."
```

**Voseo discipline confirmed:** ES `overrideNote` uses `Querés` (4 voseo hits in es/common.json total). Castilian-form regex check (`/\b(riega|saca|puedes|quieres)\b/i`) on the 6 new ES values returns `OK`.

**Locale parity confirmed:** `JSON.stringify(Object.keys(en.plantDetailModal).sort()) === JSON.stringify(Object.keys(es.plantDetailModal).sort())` returns `true`. Both namespaces have 18 keys (12 existing + 6 new).

## Gate Verification

```
$ npx tsc --noEmit                                                 # exit 0
$ npm run check:i18n-keys                                          # PASS — 64 catalog ids verified
$ node scripts/smoke-phase14.mjs                                   # PASS 15/19 (4 SKIP, 0 FAIL, exit 0)
$ grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json    # 0 on every line (Phase 10 SEC-01 regression)

$ grep -c "PROTECTED_USER_FIELDS" src/hooks/useStorage.tsx         # 2
$ grep -c "fromUserEdit" src/hooks/useStorage.tsx                   # 5
$ grep -c "interface UpdatePlantOptions" src/hooks/useStorage.tsx   # 1
$ grep -c "EDU-06" src/hooks/useStorage.tsx                         # 3
$ grep -c "delete normalizedUpdates" src/hooks/useStorage.tsx       # 1
$ grep -c "EDU-06 guard" src/hooks/useStorage.tsx                   # 1
$ grep -cE "console\.warn.*EDU-06" src/hooks/useStorage.tsx         # 1

$ test -f src/utils/overrideDetection.ts                            # exit 0
$ grep -c "export.*function compareUserVsCatalog" src/utils/overrideDetection.ts   # 1
$ grep -c "export type OverrideField" src/utils/overrideDetection.ts                # 1
$ grep -c "export interface OverrideResult" src/utils/overrideDetection.ts          # 1
$ grep -c "import type" src/utils/overrideDetection.ts                              # 1
$ grep -c "AsyncStorage\|fetch\|axios" src/utils/overrideDetection.ts               # 0
$ grep -c "console\." src/utils/overrideDetection.ts                                # 0
$ grep -c "export default" src/utils/overrideDetection.ts                           # 0

$ grep -c "Querés" src/i18n/locales/es/common.json                                  # 4 (1 in overrideNote, 3 elsewhere)
$ grep -c "Diferente a la recomendación para esta especie. ¿Querés ajustar?" src/i18n/locales/es/common.json   # 1
$ for k in whatToDo whereToPlace why yourSettings overrideNote notInCatalog; do grep -c "\"$k\":" src/i18n/locales/{en,es}/common.json; done   # all return 1
```

## Decisions Made

- **Guard runs BEFORE alias-rewrite.** Locked ordering per RESEARCH §Pitfall 1; functionally equivalent today (databaseId is not in PROTECTED_USER_FIELDS) but the documented design protects against future protected-field expansion.
- **Single fromUserEdit flag, not per-field opt-in.** RESEARCH §Open Questions Q3 lock — per-field opt-in is YAGNI; the natural call sites are categorically "user picker save" or "catalog auto-population", which the boolean cleanly discriminates.
- **`existing[key] !== undefined` instead of `!== null`.** All 3 protected fields are typed `Plant.<field>?:` — null is treated as a deliberate user-clear; only `undefined` means "no user value yet" (the gate condition for the guard to even fire).
- **`key in normalizedUpdates` instead of truthy check.** The `in` operator detects "key is present in updates" regardless of value, catching `{ waterSchedule: undefined }` explicit-erase intent that a truthy-check would silently let through.
- **`as const` on PROTECTED_USER_FIELDS.** Makes the const a readonly tuple of literals (`readonly ['waterSchedule', 'lightLevel', 'waterMode']`) — the for...of loop's `key` then has type `'waterSchedule' | 'lightLevel' | 'waterMode'` (literal union), enabling type-safe indexing into `existing[key]` without a cast.
- **`waterMode` is in PROTECTED_USER_FIELDS but NOT in compareUserVsCatalog.** Different concerns: PROTECTED_USER_FIELDS protects against catalog-source overwrites (storage layer); compareUserVsCatalog detects "user diverges from recommendation" (UX layer). waterMode (fixed vs soil_check) is category-derived per Phase 8 lock — user changing it is rare; the soft override note UX would feel wrong, so excluded from the comparator.
- **Field discriminator camelCase strings.** `'waterScheduleWarm'`/`'waterScheduleCold'` (not `'waterSchedule.warm'`) keeps the type fileable as i18n key suffixes for Plan 14-03 if needed.
- **ES overrideNote locked verbatim.** REQUIREMENTS.md line 43 — "Diferente a la recomendación para esta especie. ¿Querés ajustar?" — the entire copy decision was pre-locked during research; no copy authoring at execute time.
- **Voseo lock honored.** ES file gains 4 `Querés` hits total (1 new in overrideNote, 3 pre-existing). Castilian-form regex on the 6 new ES values returns OK.

## Deviations from Plan

None - plan executed exactly as written.

The plan specified `npm run check:i18n-keys` to remain green — confirmed PASS (64 catalog ids verified). The plan specified `node scripts/smoke-phase14.mjs` to flip W1.EDU-06.1 + W1.EDU-05.* to PASS — confirmed (PASS 15/19, was 12/19 at baseline, 13/19 after Task 1, 14/19 after Task 2, 15/19 after Task 3 unchanged because Task 3 doesn't touch a smoke placeholder).

The grep on `tempMin\|tempMax\|humidity\|waterMode` in `src/utils/overrideDetection.ts` returns 2 (not 0), but those 2 hits are docstring lines (`* - tempMin / tempMax — derived from location + climateOverride`, `* - humidity — derived from species + environment`) intentionally documenting the *exclusion* per RESEARCH §Pattern 4 lock. Same for `useState\|useEffect\|useCallback\|React` returning 1 (the docstring `* Pure function — no React, no async, no side effects.`). The acceptance-criteria intent (no actual code references) is met; the smoke runner's behavioral assertion is the runtime proof. The acceptance criteria literally state "excluded fields per lock" — the docstring documents the lock.

## Issues Encountered

None.

## User Setup Required

None.

## Parallel Wave 1 Note

Plans 14-01 and 14-02 ran in parallel as Wave 1 file-disjoint plans:

- **Plan 14-01 (file ownership):** `src/types/index.ts` (PlantDBEntry 5-field extension) + `src/data/plantDatabase.ts` (getTranslatedPlant) + `scripts/check-i18n-keys.mjs` (validator extension)
- **Plan 14-02 (file ownership — this plan):** `src/hooks/useStorage.tsx` (deep-merge guard) + `src/utils/overrideDetection.ts` (NEW comparator) + `src/i18n/locales/{en,es}/common.json` (6 section-label keys)

Zero file overlap, zero merge conflicts. Plan 14-01's commit `7cbd999` (feat: extend PlantDBEntry with 5 optional educational fields) interleaved between this plan's Task 2 commit `cadd0d0` and Task 3 commit `ed42884` — no rebase needed.

## Next Phase Readiness

**Plan 14-03 (modal restructure)** can run after both Plan 14-01 and Plan 14-02 are fully complete. From Plan 14-02 it will consume:

1. **`compareUserVsCatalog` from `src/utils/overrideDetection.ts`** — for the YourSettings (⚙️) section to render `OverrideResult[]` as soft override notes inline next to differing rows.
2. **6 plantDetailModal i18n keys** — t('plantDetailModal.whatToDo') + t('plantDetailModal.whereToPlace') + t('plantDetailModal.why') + t('plantDetailModal.yourSettings') + t('plantDetailModal.overrideNote') + t('plantDetailModal.notInCatalog') for the 4 section titles + override note + custom-plant placeholder.
3. **`updatePlant(id, updates, { fromUserEdit: true })`** — for any picker-save flow that needs to overwrite protected fields. Plan 14-03 doesn't have a picker, but if/when Plan 14-03 wires the YourSettings rows to a picker tap, it must use `{ fromUserEdit: true }`.

Plan 14-03 will also consume Plan 14-01's outputs:
- 5 new optional `PlantDBEntry` fields (`careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`)
- `getTranslatedPlant()` returning translated values for all 5 new fields
- (Plan 14-01's validator extension is still in flight — when complete, it will gate Plans 14-04..07 catalog-content authoring, NOT Plan 14-03 modal restructure)

## Self-Check: PASSED

- [x] `src/utils/overrideDetection.ts` exists (FOUND)
- [x] `src/hooks/useStorage.tsx` modified, contains `PROTECTED_USER_FIELDS` + `fromUserEdit` (FOUND)
- [x] `src/i18n/locales/en/common.json` contains 6 new keys (FOUND, all 6 grep counts = 1)
- [x] `src/i18n/locales/es/common.json` contains 6 new keys with voseo (FOUND, locked ES copy verbatim)
- [x] Commit `4db97bd` exists (FOUND in git log)
- [x] Commit `cadd0d0` exists (FOUND in git log)
- [x] Commit `ed42884` exists (FOUND in git log)
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run check:i18n-keys` exits 0
- [x] `node scripts/smoke-phase14.mjs` exits 0 with PASS 15/19, 4 SKIP, 0 FAIL
- [x] W1.EDU-06.1 flipped from SKIP to PASS
- [x] W1.EDU-05.* flipped from SKIP to PASS
- [x] Phase 10 grep guard returns 0 on every line
- [x] Locale parity check returns PARITY (identical key sets)

---
*Phase: 14-educational-detail-modal*
*Plan: 02*
*Completed: 2026-05-05*
