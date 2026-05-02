---
phase: 09
plan: 03
subsystem: storage-actions
tags: [storage, useStorage, updateDiagnosis, wave-1, additive, mutation-helper]
dependency_graph:
  requires:
    - 09-01 (SavedDiagnosis.reopenedAt type declared; DiagnosisChatMessage.role union extended)
  provides:
    - updateDiagnosis action in useStorage (StorageActions interface + useCallback impl + value + memo deps)
    - T11a/T11b smoke assertions active in smoke-phase09.mjs
  affects:
    - Plan 09-05 (DiagnosisDetailModal reopen handler calls updateDiagnosis)
tech_stack:
  added: []
  patterns:
    - Mutation-helper pattern (state setter + dataRef sync + scheduleSave) — mirrors addChatMessage / resolveDiagnosis
    - Defensive no-op on missing plant key (plantDiagnoses undefined guard)
    - Partial<T> merge semantics for generic field updates
key_files:
  created: []
  modified:
    - src/hooks/useStorage.tsx
    - scripts/smoke-phase09.mjs
decisions:
  - "updateDiagnosis placed directly after resolveDiagnosis in StorageActions interface (line 63) — preserves alphabetical/functional grouping of diagnosis actions"
  - "Partial<SavedDiagnosis> merge semantics chosen (spread { ...d, ...updates }) — only fields present in updates are overwritten; allows atomic single-call for reopenedAt + chat update from Plan 09-05"
  - "No-op on !plantDiagnoses (undefined key) — mirrors resolveDiagnosis's || [] pattern but uses explicit undefined check to avoid writing back empty arrays; if-not-found-in-map is still a no-op via .map returning unchanged items (matches addChatMessage behavior)"
  - "No existing diagnosis actions were touched — tsc count of saveDiagnosis|addChatMessage|resolveDiagnosis|getActiveDiagnosesForPlant unchanged at 14"
metrics:
  duration: "~4 min"
  completed: "2026-05-02"
  tasks: 2
  files: 2
---

# Phase 9 Plan 03: updateDiagnosis Storage Action Summary

Wave 1 storage action adding `updateDiagnosis(plantId, diagnosisId, updates: Partial<SavedDiagnosis>)` to useStorage, enabling Plan 09-05 to atomically set `reopenedAt` and append a system message in a single state update.

## What Was Built

Two targeted changes fulfilling the Wave 1 storage contract for Phase 9:

1. **`src/hooks/useStorage.tsx` — updateDiagnosis action added in four locations:**
   - **StorageActions interface (line 63):** `updateDiagnosis: (plantId: string, diagnosisId: string, updates: Partial<SavedDiagnosis>) => void;` inserted directly after `resolveDiagnosis`.
   - **useCallback implementation (after resolveDiagnosis at line 572):** Follows the established mutation-helper pattern — reads `dataRef.current.diagnosisHistory`, guards on `!plantDiagnoses` (no-op), maps over diagnoses with `{ ...d, ...updates }` merge, writes back via `setDiagnosisHistory`, `dataRef.current.diagnosisHistory`, and `scheduleSave()`.
   - **value object (useMemo literal):** `updateDiagnosis,` inserted after `resolveDiagnosis,`.
   - **useMemo dependency array:** `updateDiagnosis,` inserted after `resolveDiagnosis,`.

2. **`scripts/smoke-phase09.mjs` — T11a + T11b assertions activated:**
   - **T11a:** Regex asserts `updateDiagnosis: (plantId: string, diagnosisId: string, updates: Partial<SavedDiagnosis>)` signature is present in StorageActions interface.
   - **T11b:** Regex asserts `if (!plantDiagnoses) return;` defensive no-op guard is present.
   - Smoke runner exits 0: `Phase 9 smoke: PASS (15/15)`.

## Action Details

| Concern | Implementation |
|---------|---------------|
| Interface location | StorageActions line 63, after `resolveDiagnosis` |
| Merge semantics | `{ ...d, ...updates }` — Partial, only supplied fields overwrite |
| No-op guard (plant) | `if (!plantDiagnoses) return;` — fires when `cur[plantId]` is undefined |
| No-op behavior (diagnosis) | `.map()` returns same item if `d.id !== diagnosisId` — no write overhead avoided (matches addChatMessage) |
| State write-through | `setDiagnosisHistory` + `dataRef.current.diagnosisHistory` + `scheduleSave()` |
| Memo deps | Added `updateDiagnosis` after `resolveDiagnosis` in array |

## Downstream Use (Plan 09-05)

Plan 09-05 will call:
```typescript
updateDiagnosis(plantId, diagnosisId, {
  reopenedAt: new Date().toISOString(),
  chat: [...existingChat, systemMessage],
});
```
This single call atomically sets `reopenedAt` AND replaces `chat[]` — both in one state update and one `scheduleSave()` call.

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | dd4574d | feat(09-03): add updateDiagnosis action to useStorage |
| Task 2 | a1b2977 | feat(09-03): activate T11 smoke assertions for updateDiagnosis (smoke-phase09) |

## Self-Check: PASSED

- src/hooks/useStorage.tsx: FOUND
- scripts/smoke-phase09.mjs: FOUND
- commit dd4574d: FOUND
- commit a1b2977: FOUND
- grep -c "updateDiagnosis" src/hooks/useStorage.tsx: 4 (>= 4 required)
- grep -c "updates: Partial<SavedDiagnosis>" src/hooks/useStorage.tsx: 2 (>= 2 required)
- grep -c "if (!plantDiagnoses) return;": 1 (>= 1 required)
- node scripts/smoke-phase09.mjs: Phase 9 smoke: PASS (15/15)
- npx tsc --noEmit: exit 0
