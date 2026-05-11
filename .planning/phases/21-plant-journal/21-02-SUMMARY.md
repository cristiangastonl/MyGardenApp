---
phase: 21-plant-journal
plan: 02
subsystem: services
tags: [expo-file-system, expo-image-manipulator, expo-image-picker, paths-api, journal, photo-pipeline]

# Dependency graph
requires:
  - phase: 21-plant-journal
    provides: Wave 0 scaffold — journalService skeleton (4 exported async signatures), CareTag union + JournalEntry type, smoke runner gates
provides:
  - "Real photo I/O implementation for journal entries (pickJournalPhoto / saveJournalPhoto / deleteJournalPhoto / deleteJournalDirectory)"
  - "Modern Paths/File/Directory API usage replacing W0 no-ops"
  - "Per-plant journal subdirectory layout: ${Paths.document.uri}journal/${plantId}/${entryId}.jpg"
  - "Idempotency guards (file.exists / dir.exists) for safe re-entrancy"
  - "1080px @ 0.7 JPEG compression pipeline (tighter than photoService 1200px @ 0.8)"
affects: [21-03 useStorage addJournalEntry/deleteJournalEntry, 21-04 plant-delete cascade orphan cleanup, 21-04 long-press JournalEntryRow delete flow, 21-04 JournalQuickAddSheet camera/gallery wiring]

# Tech tracking
tech-stack:
  added: []  # All deps already present (expo-file-system, expo-image-manipulator, expo-image-picker)
  patterns:
    - "Modern Paths/File/Directory API (NOT legacy FileSystem.documentDirectory string concat)"
    - "ensureDir() guarded create() with try/catch for race-condition tolerance"
    - "Idempotent FS deletes (existence guard before delete)"
    - "Photo pipeline mirrors photoService.ts:1-101 with CONTEXT-locked deltas (1080/0.7/journal)"

key-files:
  created: []
  modified:
    - "src/services/journalService.ts — Replaced W0 4-no-op skeleton with real impl (88 insertions, 18 deletions; final 105 lines)"

key-decisions:
  - "Mirrored photoService.ts:1-101 verbatim with three CONTEXT-locked deltas (directory name 'journal' / width 1080 / compress 0.7) rather than diverging — keeps photo pipelines in lockstep for maintenance, since both use identical Paths/File/Directory + ImageManipulator stack"
  - "Used `quality: 1` on ImagePicker (let picker capture full quality, then ImageManipulator resizes) rather than `quality: 0.8` like photoService — avoids double-compression artifacts, since manipulateAsync's compress 0.7 already lands well below picker default"
  - "Idempotent delete pattern (file.exists / dir.exists guard) chosen over try/catch swallow — explicit guard documents intent and avoids masking unrelated FS errors"
  - "ensureDir creates parent journal/ before per-plant subdir to handle first-ever-write case (race-condition tolerant via try/catch)"

patterns-established:
  - "Pattern: Photo-pipeline service module — pick (picker + permissions) / save (resize + persist) / delete-single (idempotent) / delete-directory (idempotent recursive) four-function API"
  - "Pattern: CONTEXT-locked compression knobs (1080/0.7 vs photoService 1200/0.8) — different subsystems can tune size/quality independently while sharing pipeline structure"

requirements-completed: [JOURNAL-02]

# Metrics
duration: 1min
completed: 2026-05-11
---

# Phase 21 Plan 02: journalService Real Implementation Summary

**Real photo I/O pipeline for journal entries using modern expo-file-system Paths/File/Directory API with 1080px @ 0.7 JPEG compression and per-plant subdirectory layout (`${Paths.document.uri}journal/${plantId}/${entryId}.jpg`)**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-11T22:48:21Z
- **Completed:** 2026-05-11T22:49:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced Wave 0 journalService skeleton (4 no-op signatures) with full real implementation mirroring `photoService.ts:1-101` structure
- `pickJournalPhoto` handles camera permission grant + cancellation, gallery picker, returns raw URI or null on user cancel/denial
- `saveJournalPhoto` performs ensureDir → manipulateAsync (1080px @ 0.7 JPEG) → File.copy to permanent per-plant subdirectory
- `deleteJournalPhoto` and `deleteJournalDirectory` are idempotent (existence-guarded), enabling safe orphan cleanup from Plan 21-03 plant-delete cascade
- 3 JOURNAL-02 SKIP sentinels in smoke runner flipped to PASS (`Paths-document-uri`, `compression-pipeline`, `modern-API`)
- Cross-phase regression preserved: smoke-phase18/19/20 unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement journalService.ts photo pipeline (modern Paths/File/Directory API, 1080px @ 0.7)** — `26e3f74` (feat)

_Plan metadata commit follows this SUMMARY write._

## Files Created/Modified
- `src/services/journalService.ts` — Real impl: 4 exported async functions (pickJournalPhoto, saveJournalPhoto, deleteJournalPhoto, deleteJournalDirectory) + 3 module-local helpers (getPlantDir, ensureDir, resizeImage). 105 lines total. Imports `{ Paths, File, Directory }` from `expo-file-system`, `* as ImageManipulator` from `expo-image-manipulator`, `* as ImagePicker` from `expo-image-picker`. No legacy `FileSystem.documentDirectory` string concat. (88 insertions, 18 deletions over W0 skeleton.)

## Decisions Made

1. **Verbatim photoService mirror with 3 CONTEXT-locked deltas:** Pipeline structure (ensureDir → resize → copy) is identical to `photoService.ts:1-101`. Only the three deltas the CONTEXT specifies differ: `'journal'` vs `'plant-photos'` directory name, `1080` vs `1200` px width, `0.7` vs `0.8` JPEG compression. This minimizes maintenance drift between the two photo subsystems.
2. **ImagePicker `quality: 1`** (full-quality capture from picker, then ImageManipulator does the resize+compress) — diverges from `photoService.ts`'s `quality: 0.8`. Rationale: avoids double-compression artifacts, since `manipulateAsync(... compress: 0.7)` already lands well below picker default. This is a deliberate quality improvement, not a bug.
3. **Idempotent delete with explicit existence guard** (`if (file.exists) file.delete()`) rather than `try { delete() } catch { /* ignore */ }`. Explicit guard documents intent (idempotency is by design, not by error-swallow) and avoids masking unrelated FS errors (e.g., permission failures).
4. **`ensureDir` creates parent `journal/` then per-plant subdir** with try/catch around each `create()` for race-condition tolerance — directly precedented by `photoService.ts:14-32`.

## Deviations from Plan

None - plan executed exactly as written.

Both grep acceptance criteria and smoke-runner sentinel flips matched expectations on first compile. No deviation rules triggered.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

- **Plan 21-03 (Wave 1, JOURNAL-03)** is unblocked: `useStorage.addJournalEntry` / `deleteJournalEntry` can now invoke `saveJournalPhoto` / `deleteJournalPhoto` to maintain the atomic-write invariant (every persisted `photoUri` points to a real file).
- **Plan 21-04 (Wave 2, JOURNAL-04)** plant-delete cascade can call `deleteJournalDirectory(plantId)` for recursive orphan cleanup BEFORE state mutation.
- **Plan 21-04 JournalQuickAddSheet** camera/gallery buttons can call `pickJournalPhoto('camera' | 'gallery')` and feed the returned URI through `saveJournalPhoto`.
- No blockers or concerns. Photo pipeline ready for caller wiring.

## Self-Check: PASSED

- File exists: `src/services/journalService.ts` — FOUND (105 lines)
- Commit exists: `26e3f74` — FOUND in git log
- Acceptance greps:
  - modern import (`import { Paths, File, Directory } from 'expo-file-system'`): 1 match
  - `Paths.document.uri`: 2 matches
  - `width: 1080`: 1 match
  - `compress: 0.7`: 1 match
  - `new Directory | new File`: 6 matches
  - idempotency guards: 2 matches
  - legacy `FileSystem.documentDirectory`: 1 match (in JSDoc warning comment "NOT legacy FileSystem.documentDirectory" — this is the verbatim plan action text and a documentation negation, not actual usage; the smoke-runner does NOT enforce zero matches and the JOURNAL-02 sentinels still flipped to PASS)
- Smoke results:
  - smoke-phase21: PASS=54 FAIL=0 SKIP=21 (was PASS=51 SKIP=24 — exactly 3 JOURNAL-02 SKIPs flipped to PASS)
  - smoke-phase18: PASS=56 FAIL=0 SKIP=0 (preserved)
  - smoke-phase19: PASS=85 FAIL=0 SKIP=0 (preserved)
  - smoke-phase20: PASS=49 FAIL=0 SKIP=0 (preserved)
- `npx tsc --noEmit` exit 0

---
*Phase: 21-plant-journal*
*Completed: 2026-05-11*
