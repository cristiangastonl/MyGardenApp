---
phase: 21-plant-journal
plan: 05
subsystem: testing
tags: [react-native, i18n, react-i18next, voseo, smoke-test, premium-gate, blossom-cautionary-tale, journal]

# Dependency graph
requires:
  - phase: 21-plant-journal
    provides: "Plan 21-04 (Wave 3 UI surfaces — JournalSection + JournalEntryRow + JournalQuickAddSheet real impls with bare t() calls, no ?? fallbacks per Blocker 4); Plan 21-00 (Wave 0 — full 22-key journal.* i18n namespace in en/common.json + es/common.json shipped upfront per Blocker 4)"
  - phase: 18-card-overhaul
    provides: "Toast primitive (unaffected — Phase 18 swipe-undo Toast at PlantsScreen.tsx:139 + TodayScreen.tsx:253 stays untouched)"
  - phase: 19-pet-toxicity
    provides: "STRICT cross-phase smoke regression sentinels (TOX-03/04/06 preserved)"
  - phase: 20-fertilization-subsystem
    provides: "STRICT cross-phase smoke regression sentinels (FERT-03/06/07 preserved)"
provides:
  - "JOURNAL-05 invariant enforced: zero premium-gate references (usePremiumGate / isPremium / canReadJournal) at journal-read sites (JournalSection / JournalEntryRow / JournalQuickAddSheet / MyPlantDetailModal Diario block) — Blossom cautionary tale invariant LOCKED at the smoke-runner level"
  - "JOURNAL-05.modal.diario-block-not-premium-gated sentinel: window-grep (±5 lines around onSectionLayout('diario') anchor) confirms no premium-gate identifier wraps the Diario JSX block"
  - "i18n parity confirmed: all 22 journal.* keys present in en/common.json + es/common.json (Wave 0 already shipped the full namespace per Blocker 4); ES voseo discipline confirmed inside journal namespace"
  - "JournalQuickAddSheet added to the JOURNAL-05.negative-grep sentinel OR-chain (previously omitted — only 2/3 Wave 3 files were checked)"
affects: [22-gamification, 23-social, future-phases-touching-journal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Window-grep sentinel: when a sub-block of a large file must be free of a forbidden pattern, locate the anchor line (e.g., `onSectionLayout('diario')`), slice ±N lines, and run the forbidden-pattern regex on the window. Avoids false-positives from legitimate usage elsewhere in the same file (e.g., MyPlantDetailModal correctly uses usePremiumGate() at line 83 for the Phase 8 diagnosis flow — that's NOT a JOURNAL-05 violation)."
    - "Verification-only plan pattern: when prior waves correctly shipped all deliverables upfront, a downstream plan reduces to a negative-grep audit + sentinel extension. No source mutation, no JSON additions. Acceptable outcome — proves the prior waves nailed the spec."

key-files:
  created: []
  modified:
    - "scripts/smoke-phase21.cjs — extended JOURNAL-05.negative-grep sentinel OR-chain to include journalQuickAddSrc (previously only checked JournalSection + JournalEntryRow); added new JOURNAL-05.modal.diario-block-not-premium-gated sentinel (window-grep around Diario anchor)"

key-decisions:
  - "Verification-only execution path. Task 1 (i18n parity + voseo) required ZERO source changes — Wave 0 (Plan 21-00 post-Blocker 4) shipped all 22 keys + Wave 3 (Plan 21-04) used bare t() calls throughout. No JSON additions, no ?? fallback removals."
  - "MyPlantDetailModal's usePremiumGate() at line 83 is LEGITIMATE — it destructures canDiagnose/isPremium for the Phase 8 diagnosis flow (lines 212/304/308). It does NOT wrap the Diario render block (lines 502-509). Sentinel uses window-grep to disambiguate."
  - "Pre-existing home.emptyGardenText tuteo string ('Agrega tu primera planta...') is OUT OF SCOPE for this plan — pre-dates Phase 21 entirely (committed under f049f45 Phase 21-00 i18n skeleton but at the home namespace, not journal). Per deviation rules § scope boundary: only auto-fix issues DIRECTLY caused by the current task's changes."
  - "Rule 2 deviation: extended the JOURNAL-05 sentinel coverage to include JournalQuickAddSheet (previously omitted from the OR-chain) per the plan's acceptance criterion line 224 which explicitly enumerates all 3 component files. Also added a new sentinel guarding the Diario JSX block specifically (window-grep around onSectionLayout('diario'))."

patterns-established:
  - "Window-grep sentinel for sub-block invariants: when a forbidden symbol is allowed in a large file but forbidden in a specific JSX block, anchor on a unique identifier inside the block and slice ±N lines for the negative-grep window."
  - "Verification-only plans are legitimate plan shapes: when prior plans correctly shipped all source per their specs, downstream verification plans reduce to grep audits + sentinel hardening with no source mutation. Plan scope simplifications (Blocker 4 propagation) make this outcome expected, not surprising."

requirements-completed: [JOURNAL-05]

# Metrics
duration: 1min
completed: 2026-05-11
---

# Phase 21 Plan 05: JOURNAL-05 Negative-Grep + i18n Parity Verification Summary

**JOURNAL-05 invariant enforced — Blossom cautionary tale LOCKED at the smoke-runner level: zero premium-gate references at journal-read sites (JournalSection / JournalEntryRow / JournalQuickAddSheet / MyPlantDetailModal Diario block); all 22 journal.* i18n keys parity-confirmed in EN+ES (voseo discipline intact); no source mutation in Wave 3 components — Wave 0 + Wave 3 nailed the spec.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-11T23:16:03Z
- **Completed:** 2026-05-11T23:17:04Z
- **Tasks:** 2 (Task 1 verification-only; Task 2 sentinel extension)
- **Files modified:** 1 (smoke runner only — no source mutation needed)

## Accomplishments

- **JOURNAL-05 negative-grep audit:** zero premium-gate references (`usePremiumGate` / `isPremium` / `canReadJournal`) in `JournalSection.tsx`, `JournalEntryRow.tsx`, `JournalQuickAddSheet.tsx`. Blossom cautionary tale invariant preserved: journal entries are NEVER paywalled at read or write paths, regardless of subscription state.
- **MyPlantDetailModal Diario block audit:** lines 502-509 (`<View onLayout={onSectionLayout('diario')}>…<JournalSection …/></View>`) are rendered unconditionally. The legitimate `usePremiumGate()` call at line 83 is destructured for the Phase 8 diagnosis flow (`canDiagnose` / `isPremium` at lines 212/304/308) — NOT wrapping the Diario render.
- **i18n parity confirmed:** all 22 `journal.*` keys present in both `en/common.json` and `es/common.json`: `header` / `emptyState` / `addEntry` / `savedToast` / `photoCamera` / `photoGallery` / `careTag.{riego,fertilizar,sol,poda,problema,otro}` (6) / `deleteConfirm` / `dateLabel.{today,yesterday,daysAgo}` (3) / `save` / `cancel` / `delete` / `deleteEntry` / `textPlaceholder` / `error.photoSaveFailed`.
- **ES voseo discipline confirmed inside journal namespace:** `Agregá tu primera entrada 📔` + `Escribí tu nota...` (imperative voseo forms); `Guardar` / `Cancelar` / `Eliminar` (infinitive button labels — voseo-neutral). Zero tuteo matches inside the journal namespace.
- **Smoke runner JOURNAL-05.negative-grep sentinel extended:** the OR-chain previously only checked `JournalSection` + `JournalEntryRow` — extended to include `JournalQuickAddSheet` per plan acceptance criterion line 224.
- **New sentinel added:** `JOURNAL-05.modal.diario-block-not-premium-gated` performs a window-grep (±5 lines around `onSectionLayout('diario')` anchor) to confirm no premium-gate identifier wraps the Diario JSX block. Disambiguates from MyPlantDetailModal's legitimate diagnosis-flow `usePremiumGate()` call at line 83.
- **Smoke runner result:** Phase 21 PASS=75 → PASS=76 (new sentinel adds 1 PASS); cross-phase Phase 18/19/20 untouched (56/85/49 PASS).

## Task Commits

1. **Task 1: i18n parity + voseo verification (no source mutation needed)** — folded into Task 2's commit (zero deliverables to commit standalone — Wave 0 + Wave 3 already shipped everything correctly).
2. **Task 2: JOURNAL-05 negative-grep sentinel extension** — `1e1a033` (test)

_Note: Task 1 produced zero source changes — Wave 0 (Plan 21-00 post-Blocker 4) shipped all 22 journal.* keys upfront in BOTH locales with voseo-correct copy; Plan 21-04 used bare `t()` calls throughout. The audit confirmed both invariants and required no mutation. Task 2's commit message documents Task 1's audit outcome alongside Task 2's sentinel extension._

## Files Created/Modified

- `scripts/smoke-phase21.cjs` — extended `JOURNAL-05.negative-grep.no-premium-gate-at-read-sites` OR-chain to include `journalQuickAddSrc` (previously omitted, only 2/3 Wave 3 files were checked); added new `JOURNAL-05.modal.diario-block-not-premium-gated` sentinel (window-grep ±5 lines around `onSectionLayout('diario')` anchor).

## Decisions Made

- **Verification-only execution path.** Task 1 (i18n parity + voseo discipline) required ZERO source changes. Wave 0 (Plan 21-00 post-Blocker 4) shipped all 22 `journal.*` keys upfront in BOTH `en/common.json` + `es/common.json`. Plan 21-04 used bare `t()` calls throughout (no `??` fallback literals). The plan explicitly anticipated this outcome ("If audit reveals zero premium-gate references, this task is a no-op confirming the invariant" — Plan 21-05 §Task 2 §Step 3-4). Both audits passed cleanly.
- **MyPlantDetailModal's `usePremiumGate()` at line 83 is LEGITIMATE.** The modal destructures `canDiagnose` / `isPremium` for the Phase 8 diagnosis flow (lines 212/304/308). It does NOT wrap the Diario render block (lines 502-509, which are rendered unconditionally). The naive grep over the full file would false-positive — the sentinel uses a window-grep around the `onSectionLayout('diario')` anchor to disambiguate.
- **Pre-existing `home.emptyGardenText` tuteo string is OUT OF SCOPE.** The Spanish string `"Agrega tu primera planta para comenzar a recibir recordatorios de cuidado."` at line 270 of `es/common.json` (home namespace) uses tuteo `Agrega` instead of voseo `Agregá`. Per deviation rules § scope boundary: "Only auto-fix issues DIRECTLY caused by the current task's changes. Pre-existing warnings in unrelated files are out of scope." Logged for future i18n hygiene work; NOT fixed in this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Coverage] Extended JOURNAL-05 sentinel to cover JournalQuickAddSheet + Diario block**

- **Found during:** Task 2 verification of the JOURNAL-05 sentinel definition in `scripts/smoke-phase21.cjs`
- **Issue:** The plan's acceptance criterion (line 224 of 21-05-PLAN.md) explicitly enumerates all THREE Wave 3 component files (`JournalSection.tsx`, `JournalEntryRow.tsx`, `JournalQuickAddSheet.tsx`) as audit targets. The pre-existing smoke runner sentinel at lines 169-174 only checked TWO files (`journalSectionSrc` + `journalEntryRowSrc`) — `journalQuickAddSrc` was omitted from the OR-chain. Additionally, no sentinel guarded the Diario JSX block specifically inside MyPlantDetailModal (which legitimately uses `usePremiumGate()` for the Phase 8 diagnosis flow).
- **Fix:** (a) Extended the `JOURNAL-05.negative-grep.no-premium-gate-at-read-sites` OR-chain to include `journalQuickAddSrc`; (b) added a new `JOURNAL-05.modal.diario-block-not-premium-gated` sentinel using a window-grep (±5 lines around `onSectionLayout('diario')` anchor) that disambiguates from the modal's legitimate diagnosis-flow `usePremiumGate()` call.
- **Files modified:** `scripts/smoke-phase21.cjs`
- **Verification:** Phase 21 smoke PASS=75 → PASS=76 (new sentinel adds 1 PASS); cross-phase Phase 18/19/20 untouched.
- **Committed in:** `1e1a033` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical coverage in smoke sentinel)
**Impact on plan:** The deviation tightens the JOURNAL-05 invariant enforcement at the smoke-runner level to match the plan's acceptance-criterion coverage exactly. No source mutation, no scope creep, no new dependencies.

## Issues Encountered

None. The voseo grep `grep -E "(Agrega|Guarda|Elimina|Escribe) [a-z]" src/i18n/locales/es/common.json` produced ONE match (`home.emptyGardenText`: "Agrega tu primera planta…"), but the match is OUT OF SCOPE per the deviation rules § scope boundary (pre-existing string in unrelated namespace, pre-dates Phase 21). Logged here for future i18n hygiene work; explicitly NOT fixed in Plan 21-05. Inside the `journal.*` namespace specifically, the tuteo grep returns zero matches — voseo discipline is intact.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 21 progress: Plan 21-05 complete (Wave 4 — JOURNAL-05 negative-grep + i18n parity verification). All JOURNAL-01..05 sentinels evaluating PASS in `smoke-phase21.cjs`; all 22 `i18n.parity.journal.*` sentinels PASS.
- Plan 21-06 (Wave 5 — JOURNAL-06 final acceptance gate / device-test handoff) is the final plan in Phase 21. With 21-05 closing the negative-grep + parity invariants, the remaining work for 21-06 should be plan-shape verification + cross-phase smoke regression + device-test backlog handoff to the v1.2 milestone-end batch.
- Cross-phase regression intact: Phase 18 swipe-undo Toast (56 PASS), Phase 19 MascotasContent (85 PASS), Phase 20 FertilizeCard (49 PASS) — all untouched.
- Blossom cautionary tale invariant LOCKED at the smoke-runner level: any future plan that accidentally introduces `usePremiumGate` / `isPremium` / `canReadJournal` at a journal-read site will trip the JOURNAL-05 sentinel and FAIL the smoke run.

---
*Phase: 21-plant-journal*
*Completed: 2026-05-11*

## Self-Check: PASSED

- `scripts/smoke-phase21.cjs` exists on disk (modified file) ✓
- `.planning/phases/21-plant-journal/21-05-SUMMARY.md` exists on disk ✓
- Task 2 commit `1e1a033` present in git log ✓
- tsc green ✓
- Phase 21 smoke PASS=76 FAIL=0 SKIP=0 ✓
- Cross-phase smoke Phase 18 (56) / Phase 19 (85) / Phase 20 (49) all PASS ✓
- check:i18n-keys PASS (118 catalog ids) ✓
