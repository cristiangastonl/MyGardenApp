---
phase: 21-plant-journal
plan: 04
subsystem: ui
tags: [react-native, reanimated, bottom-sheet, i18n, toast, journal]

# Dependency graph
requires:
  - phase: 21-plant-journal
    provides: "Plan 21-03 useStorage actions (journals read + addJournalEntry + deleteJournalEntry); Plan 21-02 journalService photo pipeline (pickJournalPhoto + saveJournalPhoto + deleteJournalPhoto); Plan 21-00 Wave-0 scaffold (3 skeleton components + 22 i18n keys)"
  - phase: 19-pet-toxicity
    provides: "ModalSectionId precedent (mascotas anchor); 5-section MyPlantDetailModal structure (Diario inserts AFTER Mascotas)"
  - phase: 18-card-overhaul
    provides: "Toast primitive (PlantsScreen.tsx:135 + TodayScreen.tsx:249 swipe-undo state — preserved untouched; new journalToastVisible Toast renders as second sibling)"
  - phase: 14-edu
    provides: "EducationalSection composition pattern (180ms Easing.out(Easing.cubic) + hasInteracted gate against Android height-0 bug)"
provides:
  - "6th educational section in MyPlantDetailModal ('diario' — AFTER Mascotas)"
  - "JournalSection: collapsible card with FlatList timeline + empty-state CTA + '+ Nueva entrada' header button (180ms collapse animation mirrors EducationalSection)"
  - "JournalEntryRow: timeline row (date header + careTag chip + 80x80 thumbnail + body); long-press → BottomSheetModal delete option → Alert.alert confirm → deleteJournalPhoto (best-effort) + onDelete"
  - "JournalQuickAddSheet: BottomSheetModal (60% snap) with multiline TextInput + 📷 Cámara + 🖼️ Galería buttons + 6-chip careTag row driven by module-level literal CARE_TAGS array + Guardar/Cancelar footer; atomic-write sequence (saveJournalPhoto → addJournalEntry → onSave)"
  - "ModalSectionId union widened from 5 to 6 anchors; both consumer screens (PlantsScreen + TodayScreen) widened via SEPARATE type-only NAMED import line"
  - "Toast wiring via screen-level Approach B (Important 6 LOCKED) using DISTINCT identifier `journalToastVisible` to coexist with the Phase 18 `toastVisible` swipe-undo Toast as two independent <Toast> siblings"
affects: [22-gamification, 23-social, future-phases-touching-MyPlantDetailModal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Type-only NAMED import for cross-component union widening (Blocker A): `import type { ModalSectionId } from '../components/MyPlantDetailModal'` ADDED as a separate line; existing barrel import preserved untouched. Default-import shape is FORBIDDEN because the component file uses only NAMED exports."
    - "Co-existing Toast siblings under DISTINCT state identifiers (Blocker B): when two unrelated subsystems both need screen-level Toasts, they declare DISTINCT `useState` identifiers (`toastVisible` vs `journalToastVisible`) and render INDEPENDENT <Toast> siblings — no shared message queue, no priority logic, no z-order conflict."
    - "Screen-level Toast ownership via callback prop (Important 6 Approach B): MyPlantDetailModal exposes `onJournalEntrySaved?: () => void` and owns ZERO toast state. Parent screens flip their own `journalToastVisible` state, avoiding Pitfall 10 (Toast-inside-RN-Modal z-order)."
    - "Module-level literal-array driver for chip render (Warning D): `const CARE_TAGS = ['riego','fertilizar','sol','poda','problema','otro'] as const satisfies readonly CareTag[]` lives at module top — drives chip render via `.map()` AND keeps the literal text grep-able for acceptance criteria AND pins the union/array parity at compile time."
    - "180ms `Easing.out(Easing.cubic)` collapse animation mirroring EducationalSection (Phase 14-03 device-tuned timing) — Reanimated v4 useSharedValue + useDerivedValue + hasInteracted gate (RESEARCH Pitfall 9 — Android height-0 lockout)."
    - "Atomic-write order (RESEARCH Pattern 8): photo save FIRST (try/catch + abort + Alert on failure) → JournalEntry composed with resolved photoUri → onSave invokes addJournalEntry. Guarantees photoUri pointers in AppData always resolve to real files on disk."

key-files:
  created:
    - "(none — all 3 Wave 0 skeleton components rewritten in place; no new files)"
  modified:
    - "src/components/MyPlantDetailModal.tsx — ModalSectionId union extended with 'diario'; new onJournalEntrySaved prop; Diario section as 6th in scroll order; JournalQuickAddSheet portal mounted sibling-of-ScrollView; useStorage destructure extended with journals + addJournalEntry + deleteJournalEntry"
    - "src/components/plant-detail/JournalSection.tsx — real impl (collapsible 180ms + FlatList reverse-chrono + empty-state CTA + Nueva entrada button)"
    - "src/components/plant-detail/JournalEntryRow.tsx — real impl (date header + careTag chip + thumbnail + body + long-press → BottomSheetModal delete → Alert.alert confirm)"
    - "src/components/plant-detail/JournalQuickAddSheet.tsx — real impl (BottomSheetModal 60% snap + multiline TextInput + camera/gallery buttons + literal CARE_TAGS chip array + atomic-write Guardar + Cancelar reset)"
    - "src/screens/PlantsScreen.tsx — separate type-only NAMED import for ModalSectionId; state widened to `ModalSectionId | undefined`; new `journalToastVisible` state co-located with Phase 18 `toastVisible` (DISTINCT identifier); `onJournalEntrySaved` wired on MyPlantDetailModal; second <Toast> sibling rendered alongside the existing Phase 18 Toast"
    - "src/screens/TodayScreen.tsx — mirror of PlantsScreen wiring"

key-decisions:
  - "Blocker A LOCKED — separate type-only NAMED import line for ModalSectionId in both consumers, barrel imports untouched (default-import shape forbidden because MyPlantDetailModal is a NAMED export)"
  - "Blocker B LOCKED — DISTINCT identifier `journalToastVisible` for the journal-saved Toast; Phase 18 swipe-undo `toastVisible` stays at PlantsScreen:139 + TodayScreen:253 untouched; two <Toast> siblings coexist independently"
  - "Important 6 LOCKED Approach B — MyPlantDetailModal owns ZERO toast state; forwards via `onJournalEntrySaved` callback prop to screen-level Toast (avoids Pitfall 10 Toast-inside-RN-Modal z-order)"
  - "Important 7 LOCKED — pre-flight verified Plan 21-03 deliverables (StorageContextType exposes journals + addJournalEntry + deleteJournalEntry) BEFORE consumer mutation"
  - "Important 8 LOCKED — both consumers use the type import (option a); inline-literal extension (option b) forbidden"
  - "Warning D LOCKED — JournalQuickAddSheet renders chips via module-level literal `CARE_TAGS` array (grep-able tag names AND compile-time union parity via `as const satisfies readonly CareTag[]`)"
  - "180ms collapse animation (Phase 14-03 device-tuned) mirrors EducationalSection — NOT 250ms even though CONTEXT.md mentioned 250ms (RESEARCH §Pattern lock)"
  - "Diario default-expanded — empty-state CTA is the primary discovery surface; collapse-by-default would hide it"

patterns-established:
  - "Co-existing screen-level Toast siblings: when a screen needs multiple independent Toasts, declare them under DISTINCT identifiers and render them as siblings — no shared queue, no priority"
  - "Screen-level Toast handoff via callback prop: modals forward save signals (`onJournalEntrySaved?`) so screens own Toast state, avoiding cross-modal z-order pitfalls"
  - "Module-level literal-array chip driver: lock chip taxonomy via `as const satisfies readonly Union[]` at module top — drives render AND grep AND type parity"
  - "Type-only NAMED import for cross-file union widening: when barrel imports already exist, add a separate `import type { X } from '../components/Component'` line rather than rewriting the barrel"

requirements-completed: [JOURNAL-04]

# Metrics
duration: 6 min
completed: 2026-05-11
---

# Phase 21 Plan 04: JOURNAL-04 UI Surfaces Summary

**Diario as the 6th MyPlantDetailModal section with full quick-add + timeline + long-press delete + screen-level Toast wiring — three Wave-0 skeletons replaced with real impls, ModalSectionId widened via separate type-only NAMED import (Blocker A), `journalToastVisible` declared as DISTINCT identifier alongside the existing Phase 18 swipe-undo Toast (Blocker B); 10 JOURNAL-04 smoke SKIPs flipped to PASS.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-11T23:03:56Z
- **Completed:** 2026-05-11T23:10:14Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- ModalSectionId union extended with `'diario'` (5 → 6 anchors); both consumer screens (PlantsScreen + TodayScreen) widened via separate type-only NAMED import (Blocker A LOCKED); existing barrel imports remain untouched; inline literals removed (Important 8 LOCKED).
- JournalSection real impl with 180ms `Easing.out(Easing.cubic)` collapse animation mirroring EducationalSection (Phase 14-03 device-tuned timing) + FlatList reverse-chronological timeline + empty-state CTA + "+ Nueva entrada" header button + hasInteracted gate (RESEARCH Pitfall 9 — Android height-0 lockout).
- JournalEntryRow real impl with date header (Hoy/Ayer/Hace N días/locale via `getRelativeDateLabel`) + careTag chip + optional 80x80 thumbnail + optional text body + long-press → BottomSheetModal "Eliminar entrada" → Alert.alert confirm → `deleteJournalPhoto` (best-effort) + `onDelete`.
- JournalQuickAddSheet real impl with `snapPoints=['60%']` BottomSheetModal + multiline TextInput + 📷 Cámara + 🖼️ Galería buttons + 6-chip careTag row driven by module-level literal `CARE_TAGS = ['riego','fertilizar','sol','poda','problema','otro'] as const satisfies readonly CareTag[]` (Warning D LOCKED — all 6 tag names grep-able + compile-time union parity) + atomic-write Guardar (Pattern 8 — photo save FIRST with try/catch + Alert + abort) + Cancelar reset.
- MyPlantDetailModal integrates Diario as the 6th section IMMEDIATELY AFTER Mascotas (line ordering verified); JournalQuickAddSheet portal mounted as sibling of ScrollView (Pattern 6 Option A — gorhom App-root provider supports the portal); new optional `onJournalEntrySaved?: () => void` prop forwards journal-save signals to parent screens.
- Toast wiring via screen-level Approach B (Important 6 LOCKED) using DISTINCT `journalToastVisible` identifier (Blocker B LOCKED) — Phase 18 swipe-undo `toastVisible` at PlantsScreen.tsx:139 + TodayScreen.tsx:253 untouched; second `<Toast>` sibling renders independently with `t('journal.savedToast')` message + 2000 ms auto-dismiss.

## Task Commits

1. **Task 1: Extend ModalSectionId + widen consumers** - `50f24ed` (feat)
2. **Task 2: JournalEntryRow + JournalSection real impls** - `6e90442` (feat)
3. **Task 3: JournalQuickAddSheet real impl** - `6156ac5` (feat)
4. **Task 4: Diario as 6th section + screen-level Toast wiring** - `cb353ad` (feat)

## Files Created/Modified

- `src/components/MyPlantDetailModal.tsx` — union extended to 6 anchors; new `onJournalEntrySaved` prop; Diario section as 6th in scroll order; JournalQuickAddSheet portal mounted; useStorage destructure extended (journals + addJournalEntry + deleteJournalEntry)
- `src/components/plant-detail/JournalSection.tsx` — full real impl (replaces Wave 0 skeleton)
- `src/components/plant-detail/JournalEntryRow.tsx` — full real impl (replaces Wave 0 skeleton)
- `src/components/plant-detail/JournalQuickAddSheet.tsx` — full real impl (replaces Wave 0 skeleton)
- `src/screens/PlantsScreen.tsx` — separate type-only NAMED import + state widening + `journalToastVisible` state + `onJournalEntrySaved` wiring + second `<Toast>` sibling
- `src/screens/TodayScreen.tsx` — mirror of PlantsScreen

## Decisions Made

- **Type-only NAMED import for ModalSectionId widening (Blocker A LOCKED).** MyPlantDetailModal exports `ModalSectionId` and the component itself as NAMED exports at lines 38/57 — default-import + named-import shape (`import MyPlantDetailModal, { ModalSectionId } from '../components/MyPlantDetailModal'`) is FORBIDDEN because it would TS-fail. Added a separate `import type { ModalSectionId } from '../components/MyPlantDetailModal'` line in both screens; existing barrel imports remained untouched. This keeps diffs minimal and signals "type-only consumption" via `import type`.
- **DISTINCT identifier `journalToastVisible` for the journal-saved Toast (Blocker B LOCKED).** Phase 18 CARD-01 already owns `const [toastVisible, setToastVisible]` in BOTH PlantsScreen.tsx:139 and TodayScreen.tsx:253 for swipe-undo. Declaring a second `toastVisible` would TS-fail with duplicate-identifier. The new state lives under a clearly distinct name, and the two `<Toast>` components coexist as independent siblings — no shared message queue, no priority, no z-order conflict.
- **Screen-level Toast ownership via callback prop (Important 6 LOCKED Approach B).** MyPlantDetailModal owns ZERO toast state and ZERO Toast imports. The save-success signal travels up via `onJournalEntrySaved?: () => void`, and each parent screen owns its own `journalToastVisible` state. Avoids Pitfall 10 (Toast-inside-RN-Modal z-order) and matches the Phase 18 Toast-at-screen-root pattern.
- **180ms collapse animation, NOT 250ms.** CONTEXT.md mentioned ~250ms as a guardrail, but Phase 14-03 device test concluded 180ms `Easing.out(Easing.cubic)` is the right call — 250ms feels sluggish. JournalSection mirrors EducationalSection's exact timing primitives.
- **Diario default-expanded.** The empty-state CTA inside JournalSection is the primary discovery surface for first-time users (no journal entries yet). Collapsing it by default would hide the CTA behind an additional tap.
- **Module-level literal `CARE_TAGS` array (Warning D LOCKED).** Listing the 6 tag names verbatim at module top (a) drives chip render via `.map()`, (b) makes the literal tag names grep-able for acceptance criteria, (c) keeps the array and the `CareTag` union in compile-time lockstep via `as const satisfies readonly CareTag[]`.
- **Bare `t()` calls — NO `??` fallbacks (Blocker 4 LOCKED).** All 22 journal i18n keys were shipped in Wave 0 (Plan 21-00), so every `t('journal.X')` call lands a real translation. Theme-token fallback `colors.border ?? '#ccc'` (originally suggested in the plan's StyleSheet example) was REMOVED because `colors.border` already exists in theme.ts:64 — no fallback needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSDoc comment in MyPlantDetailModalProps tripped the strict negative-grep check for `journalToastVisible` ownership on the modal**
- **Found during:** Task 4 verification (Important 6 enforcement negative grep on modal)
- **Issue:** The JSDoc for `onJournalEntrySaved?` originally contained the substring `journalToastVisible` inside a doc comment explaining the parent-screen pattern. The plan's negative-grep acceptance criterion requires `grep -c "journalToastVisible" src/components/MyPlantDetailModal.tsx` returns 0 — the doc-comment substring caused a false positive (count 1) even though the modal owns ZERO toast STATE/imports/renders.
- **Fix:** Rewrote the JSDoc comment to describe the pattern in prose without using the literal `journalToastVisible` identifier. The semantic meaning is preserved; the grep now correctly returns 0.
- **Files modified:** src/components/MyPlantDetailModal.tsx (single JSDoc text edit)
- **Verification:** `grep -c "journalToastVisible" src/components/MyPlantDetailModal.tsx` → 0 ✓; `grep -c "toastVisible" src/components/MyPlantDetailModal.tsx` → 0 ✓; tsc green.
- **Committed in:** `cb353ad` (folded into Task 4 commit — caught and fixed before commit)

**2. [Rule 1 - Bug] Plan's example StyleSheet used `colors.border ?? '#ccc'` token-existence fallback that is actually unnecessary**
- **Found during:** Task 3 (JournalQuickAddSheet implementation)
- **Issue:** The plan's example code in `<action>` included `borderColor: colors.border ?? '#ccc'` as a defensive token-existence guard. Inspection of `src/theme.ts:64` confirms `border: '#e0d8c8'` is a real existing token — the `??` fallback is dead code and looks confusing.
- **Fix:** Used `colors.border` directly without the fallback. This is also more consistent with how other screens (PlantsScreen, EducationalSection) consume the token.
- **Files modified:** src/components/plant-detail/JournalQuickAddSheet.tsx (StyleSheet.input.borderColor)
- **Verification:** tsc green; `npm run smoke:phase21` PASS.
- **Committed in:** `6156ac5` (folded into Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes; both folded into the relevant task commits)
**Impact on plan:** Both deviations were minor source-text cleanups discovered during verification; neither changed scope, surface area, or behavior. No new dependencies, no scope creep.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 11 JOURNAL-04 sentinels covered by this plan (smoke runner reports 10 SKIP→PASS for the JOURNAL-04 namespace — the `JOURNAL-04.JournalQuickAddSheet.careTag-chips` sentinel was already PASS from the Wave 0 skeleton because the type annotation `const _careTag: CareTag` matched the loose `/careTag/` regex; final smoke output: PASS=75 FAIL=0 SKIP=0).
- Phase 21 progress: Plan 21-04 complete (Wave 3 — JOURNAL-04 UI surfaces shipped). Next: Plan 21-05 (Wave 4 — JOURNAL-05 premium-gate verification + no-gate at journal-read sites, per smoke sentinel `JOURNAL-05.negative-grep.no-premium-gate-at-read-sites`).
- 2-tap floor from modal-open works as designed in source — the JournalQuickAddSheet Guardar handler is empty-entry tolerant (CONTEXT line 101). Device verification deferred to Plan 21-06 device-test backlog.
- Cross-phase regression intact: Phase 18 swipe-undo Toast (56 PASS), Phase 19 MascotasContent (85 PASS), Phase 20 FertilizeCard (49 PASS) — all untouched.

---
*Phase: 21-plant-journal*
*Completed: 2026-05-11*

## Self-Check: PASSED

All 6 modified files exist on disk. All 4 task commit hashes (50f24ed, 6e90442, 6156ac5, cb353ad) present in git log.
