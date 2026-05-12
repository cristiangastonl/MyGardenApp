---
phase: 21-plant-journal
plan: 00
subsystem: infra
tags: [smoke-runner, scaffold, types, i18n, gitignore, journal]

# Dependency graph
requires:
  - phase: 20-fertilization-subsystem
    provides: Smoke-runner three-tier sentinel template (smoke-phase20.cjs) + STRICT cross-phase regression pattern + assertion harness helpers (assert/assertSkippable/readSafe/getNested lines 23-44)
  - phase: 19-pet-toxicity
    provides: STRICT cross-phase regression sentinels (TOX-03/04/06) preserved verbatim
  - phase: 18-plantcard-cleanup
    provides: Toast primitive + toastVisible identifier (PlantsScreen:135 / TodayScreen:249) — basis for Blocker B tightened Toast sentinel design
  - phase: 14-educational-detail-modal
    provides: EducationalSection collapse pattern + getCatalogEntry strict lookup (carry-forward for Plan 21-04)
  - phase: 13-gesture-bottom-sheet-infrastructure
    provides: BottomSheetModal + BottomSheetModalProvider (root-wrapped) for journal quick-add sheet (carry-forward for Plan 21-04)
provides:
  - scripts/smoke-phase21.cjs three-tier smoke runner (PASS scaffold + JOURNAL-01..05 SKIP placeholders + Phase 18/19/20 STRICT cross-phase regression)
  - npm script smoke:phase21 (alphabetical-by-phase ordering preserved)
  - .gitignore entry for scripts/.tmp-phase21/ (gitignored behavioral-asserts tmp dir for Plan 21-02)
  - src/types/index.ts CareTag union (6 literals) + JournalEntry interface + AppData.journals?: Record<string, JournalEntry[]> additive-optional field
  - src/services/journalService.ts skeleton (4 exported async signatures — pickJournalPhoto/saveJournalPhoto/deleteJournalPhoto/deleteJournalDirectory)
  - 3 component skeletons (JournalSection.tsx / JournalQuickAddSheet.tsx / JournalEntryRow.tsx) with locked prop contracts
  - i18n journal.* namespace skeleton with 22 leaf keys EN+ES parity (voseo ES) — covers ALL Wave 3 bare t() call sites so Wave 3 needs no ?? fallbacks
  - STRICT i18n-namespace-exists + key-count thresholds (≥22 EN + ES) sentinels
  - TIGHTENED journalToastVisible-proximity Toast sentinel (Blocker B + Warning E — no false-positive on existing Phase 18 toastVisible)
affects: [21-plant-journal/21-01, 21-plant-journal/21-02, 21-plant-journal/21-03, 21-plant-journal/21-04, 21-plant-journal/21-05, 21-plant-journal/21-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 Nyquist scaffold: every modification site for the phase exists on disk before Wave 1 begins; later waves modify existing files only, never create new ones."
    - "Three-tier smoke runner (STRICT scaffold + SKIP-then-PASS placeholders + STRICT cross-phase regression) — third consecutive phase (19/20/21) using this pattern."
    - "Tight proximity-regex sentinel for distinct-but-similar identifiers: when a phase ships state with a name that collides with prior-phase state, the sentinel uses distinct-identifier+i18n-key co-occurrence within 500 chars in the same file (Blocker B journalToastVisible/journal.savedToast precedent)."
    - "i18n parity skeleton lands ALL Wave 3 t() call sites at Wave 0 so Wave 3 components use bare t() with NO ?? fallbacks (≥22 keys EN/ES voseo)."

key-files:
  created:
    - scripts/smoke-phase21.cjs (262 lines — forked from smoke-phase20.cjs verbatim)
    - src/services/journalService.ts (skeleton; real impl in Plan 21-02)
    - src/components/plant-detail/JournalSection.tsx (skeleton; real impl in Plan 21-04)
    - src/components/plant-detail/JournalQuickAddSheet.tsx (skeleton; real impl in Plan 21-04)
    - src/components/plant-detail/JournalEntryRow.tsx (skeleton; real impl in Plan 21-04)
  modified:
    - package.json (1 line — smoke:phase21 script entry)
    - .gitignore (1 line — scripts/.tmp-phase21/ entry)
    - src/types/index.ts (CareTag + JournalEntry + AppData.journals?)
    - src/i18n/locales/en/common.json (+30 lines — journal.* namespace, 22 keys)
    - src/i18n/locales/es/common.json (+30 lines — journal.* namespace, 22 keys voseo)

key-decisions:
  - "TIGHTENED Toast sentinel design (Blocker B + Warning E): require journalToastVisible identifier AND journal.savedToast i18n key within 500 chars in same file. Both screens (PlantsScreen + TodayScreen) MUST carry the wiring. Prevents false-positive against existing Phase 18 toastVisible state at PlantsScreen:135 + TodayScreen:249."
  - "i18n key-count threshold raised to ≥22 (was ≥15 in VALIDATION.md draft) — adds 6 Wave 3 bare-t() keys (save/cancel/delete/deleteEntry/textPlaceholder/error.photoSaveFailed). Wave 3 components will use bare t() calls with NO ?? fallback strings — keysets are guaranteed present at Wave 0."
  - "Preserved assertion harness helpers verbatim from smoke-phase20.cjs lines 23-44 (assert / assertSkippable / readSafe / getNested) — third consecutive phase reusing this exact 4-helper harness."
  - "Cross-phase STRICT regression block now spans 3 prior phases (Phase 18 + 19 + 20) — extends Phase 20's 2-phase regression block with 3 new Phase 20 sentinels (FERT-03 plantLogic emit + FERT-06 FertilizeCard file-not-deleted + FERT-07 check-script extension)."
  - "Both AppData.journals? and JournalEntry are additive-optional — migration default {} in Plan 21-01 useStorage load-path; absence/empty = no entries (no schema bump, no backfill)."

patterns-established:
  - "Wave 0 Nyquist scaffold for any phase introducing N new components + new service + new types + new i18n namespace: land all paths on disk with skeleton content first, then later waves replace bodies in-place. Mirrors Phase 18 Toast skeleton-then-impl + Phase 20 FertilizeCard skeleton-then-impl two-plan splits."
  - "Distinct-identifier+i18n-key proximity regex sentinel: when introducing state that shares a name pattern with prior-phase state (toastVisible → journalToastVisible), use distinct-identifier + i18n-key co-occurrence within bounded character distance in same file as the SKIP→PASS gate. Reusable for any future phase adding parallel state with naming-collision risk."
  - "i18n bare-t() Wave 0 lock: lock ALL Wave-3 t() call sites in the Wave 0 i18n skeleton so Wave 3 components use bare t() without ?? fallbacks. Reduces translation-key drift between code and JSON."

requirements-completed: []  # Plan 21-00 is Wave 0 scaffold; JOURNAL-01..05 close in Plans 21-01..05.

# Metrics
duration: 2min
completed: 2026-05-11
---

# Phase 21 Plan 00: Wave 0 Scaffold Summary

**Wave 0 Nyquist scaffold lands smoke runner + npm script + .gitignore + types (CareTag/JournalEntry/AppData.journals?) + journalService skeleton + 3 component skeletons + i18n journal.* namespace (22-key EN/ES parity) so every Phase 21 modification site exists on disk before Wave 1 begins.**

## Performance

- **Duration:** 2 min (178 s)
- **Started:** 2026-05-11T22:42:04Z
- **Completed:** 2026-05-11T22:45:02Z
- **Tasks:** 2
- **Files created:** 5 (smoke-phase21.cjs + journalService.ts + 3 component skeletons)
- **Files modified:** 4 (package.json + .gitignore + types/index.ts + en+es common.json)

## Accomplishments

- Three-tier smoke runner scripts/smoke-phase21.cjs (262 LOC) green at PASS=51 FAIL=0 SKIP=24
- All STRICT W0 scaffold sentinels PASS (smoke runner + npm script + .gitignore + types + journalService + 3 components + i18n-namespace-exists + key-count EN/ES)
- TIGHTENED journalToastVisible-proximity Toast sentinel (Blocker B + Warning E) lands in source — proves false-positive bug fixed (loose `toastVisible >= 2` pattern absent except in documenting comment)
- Phase 18/19/20 STRICT cross-phase regression sentinels all PASS (12 cross-phase asserts: GAM-04 / CARD-01 / GAM-03 / Toast / TOX-03 / TOX-04 / TOX-06 / FERT-03 plantLogic+scheduler / FERT-06 FertilizeCard / FERT-07 check-script)
- npx tsc --noEmit exits 0 with new type skeletons
- All standalone cross-phase smoke runners still exit 0: smoke:phase18 (PASS=56), smoke:phase19 (PASS=85), smoke:phase20 (PASS=49)

## Task Commits

Each task was committed atomically:

1. **Task 1: Smoke runner + npm script + .gitignore + i18n skeleton (≥22 keys EN+ES — covers ALL Wave 3 t() sites)** - `f049f45` (feat)
2. **Task 2: Type skeletons (CareTag + JournalEntry + AppData.journals?) + 4 source-file skeletons** - `350f7fe` (feat)

**Plan metadata:** [pending docs commit]

## Files Created/Modified

- `scripts/smoke-phase21.cjs` - Three-tier smoke runner; forked verbatim from smoke-phase20.cjs (assertion harness lines 23-44 preserved). Adds Phase 21 W0 scaffold sentinels + JOURNAL-01..05 SKIP placeholders + Phase 18/19/20 STRICT cross-phase regression.
- `package.json` - smoke:phase21 script entry inserted after smoke:phase20 (alphabetical ordering preserved).
- `.gitignore` - scripts/.tmp-phase21/ entry appended after scripts/.tmp-phase20/.
- `src/types/index.ts` - CareTag union (6 literals 'riego' | 'fertilizar' | 'sol' | 'poda' | 'problema' | 'otro') + JournalEntry interface (id/date required; text/photoUri/careTag optional) inserted BEFORE AppData. journals?: Record<string, JournalEntry[]> field added as last property of AppData (additive optional).
- `src/services/journalService.ts` - Skeleton with 4 exported async signatures (pickJournalPhoto, saveJournalPhoto, deleteJournalPhoto, deleteJournalDirectory). Skeleton bodies return null / no-op / imageUri pass-through to keep tsc green. Real impl in Plan 21-02.
- `src/components/plant-detail/JournalSection.tsx` - Default-export skeleton component returning empty View; locks JournalSectionProps contract (plantId/entries/onAddEntry/onDeleteEntry).
- `src/components/plant-detail/JournalQuickAddSheet.tsx` - Default-export skeleton; locks JournalQuickAddSheetProps contract (plantId/visible/onDismiss/onSave) + imports CareTag type to anchor downstream chip-row usage.
- `src/components/plant-detail/JournalEntryRow.tsx` - Default-export skeleton; locks JournalEntryRowProps contract (entry/plantId/onDelete).
- `src/i18n/locales/en/common.json` - journal.* namespace with 22 leaf keys (header/emptyState/addEntry/savedToast/photoCamera/photoGallery/careTag.{riego,fertilizar,sol,poda,problema,otro}/deleteConfirm/dateLabel.{today,yesterday,daysAgo}/save/cancel/delete/deleteEntry/textPlaceholder/error.photoSaveFailed).
- `src/i18n/locales/es/common.json` - Mirror namespace with voseo (agregá / escribí / no pudimos).

## Decisions Made

- **TIGHTENED Toast sentinel design (Blocker B + Warning E):** the smoke runner requires `journalToastVisible` identifier AND `journal.savedToast` i18n key co-occurrence within 500 chars in same file, in EITHER order. Both screens (PlantsScreen + TodayScreen) MUST carry the wiring (`inPlants && inToday`). Prevents false-positive against existing Phase 18 `toastVisible` state declared at PlantsScreen:135 + TodayScreen:249.
- **i18n key-count threshold raised to ≥22** (VALIDATION.md draft cited ≥15): adds 6 Wave 3 bare-t() keys (`save`, `cancel`, `delete`, `deleteEntry`, `textPlaceholder`, `error.photoSaveFailed`). Wave 3 components will use bare t() calls with NO ?? fallback strings — keysets guaranteed present at Wave 0.
- **Preserved assertion harness helpers verbatim** from smoke-phase20.cjs lines 23-44 (assert/assertSkippable/readSafe/getNested) — third consecutive phase reusing this 4-helper harness without modification.
- **Cross-phase STRICT regression now spans 3 prior phases (18 + 19 + 20)** — extends Phase 20's 2-phase regression block with 3 new Phase 20 sentinels.
- **Both AppData.journals? and JournalEntry are additive-optional** — migration default `{}` lands in Plan 21-01 useStorage load-path; absence/empty = no entries (no schema bump, no backfill).

## Deviations from Plan

None - plan executed exactly as written. Helpers preserved verbatim from smoke-phase20.cjs; all acceptance criteria green on first run after each task.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 21-01 (Wave 1, JOURNAL-01)** ready: useStorage.tsx extension — `data.journals || {}` load-path default + dataRef.current.journals = ... init + StorageState interface extension with `journals: Record<string, JournalEntry[]>` field + snapshotFromRef inclusion + __DEV__ payload-size instrumentation log. 5 SKIP→PASS sentinels wired in smoke runner.
- **Plan 21-02 (Wave 1, JOURNAL-02)** ready: journalService.ts real impl — modern expo-file-system Paths/File/Directory API with ${Paths.document.uri}journal/${plantId}/${entryId}.jpg layout + expo-image-manipulator compress:0.7 + width:1080 pipeline. 4 SKIP→PASS sentinels wired (CareTag-6-literals already flipped on by Task 2).
- **Plan 21-03 (Wave 2, JOURNAL-03)** ready: useStorage addJournalEntry/deleteJournalEntry actions + deletePlant cascade (calls deleteJournalDirectory + removes journals map entry). 6 SKIP→PASS sentinels wired.
- **Plan 21-04 (Wave 3, JOURNAL-04)** ready: ModalSectionId extension to 'diario' + JournalSection rendered after Mascotas + JournalQuickAddSheet snapPoints=['60%'] + careTag chip row + JournalEntryRow long-press + Toast wiring on BOTH PlantsScreen and TodayScreen with locked `journalToastVisible` identifier. 8 SKIP→PASS sentinels wired (plus Toast proximity + 2 ModalSectionId-widened).
- **Plan 21-05 (Wave 4, JOURNAL-05)** ready: negative-grep (no premium-gate at journal-read sites) sentinel already PASSes at W0 baseline because the JournalSection + JournalEntryRow skeletons import zero premium-related code.
- **Plan 21-06 (Wave 5, closing manual gate)** ready: device-test checklist + Option B deferral path per Phase 18-05 / 19-07 / 20-10 milestone-end batching precedent.

## Self-Check: PASSED

Verified each artifact:

- `scripts/smoke-phase21.cjs`: FOUND
- `package.json` smoke:phase21 entry: FOUND (grep `smoke:phase21` returns 1 match in package.json)
- `.gitignore` scripts/.tmp-phase21/ entry: FOUND (grep `scripts/\.tmp-phase21/` returns 1 match)
- `src/types/index.ts` CareTag: FOUND (grep `export type CareTag` returns 1 match)
- `src/types/index.ts` JournalEntry: FOUND (grep `export interface JournalEntry` returns 1 match)
- `src/types/index.ts` AppData.journals?: FOUND (grep `journals\?:\s*Record<string,\s*JournalEntry\[\]>` returns 1 match)
- `src/services/journalService.ts`: FOUND with 4 exported async signatures
- `src/components/plant-detail/JournalSection.tsx`: FOUND
- `src/components/plant-detail/JournalQuickAddSheet.tsx`: FOUND
- `src/components/plant-detail/JournalEntryRow.tsx`: FOUND
- EN+ES common.json 22-key parity: FOUND (Node verification script exits 0)
- Commits: `f049f45` (Task 1) FOUND; `350f7fe` (Task 2) FOUND

---
*Phase: 21-plant-journal*
*Completed: 2026-05-11*
