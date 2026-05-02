---
phase: 09-diagnosis-continuity-paywall-architecture
plan: "07"
subsystem: diagnosis-chat-edge-function
tags: [DIAG-05, chat-diagnosis, priorDiagnosisSummary, resume-clause, voseo, i18n, edge-function]
dependency_graph:
  requires: [09-06]
  provides: [priorDiagnosisSummary-resume-clause, buildPriorDiagnosisSummary-helper]
  affects:
    - supabase/functions/chat-diagnosis/index.ts
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
    - src/hooks/usePlantDiagnosis.ts
    - src/utils/plantDiagnosis.ts
    - scripts/smoke-phase09.mjs
tech_stack:
  added: []
  patterns:
    - "additive-optional-field: priorDiagnosisSummary added to RequestBody as optional; absent field omitted by JSON serializer; server falls back to current behavior (Phase 7 dual-payload backward-compat lock)"
    - "plain-text LLM context injection: summary built from SavedDiagnosis.result fields as human-readable lines, not JSON — optimal for LLM prompt inclusion"
    - "locale-aware summary builder: buildPriorDiagnosisSummary(diagnosis, isEs) — same i18n discipline as edge function prompt branches"
key_files:
  created: []
  modified:
    - supabase/functions/chat-diagnosis/index.ts
    - src/components/PlantDiagnosis/PlantDiagnosisModal.tsx
    - src/hooks/usePlantDiagnosis.ts
    - src/utils/plantDiagnosis.ts
    - scripts/smoke-phase09.mjs
decisions:
  - "T5g assertion scoped to TypeScript/source files only, not plan markdown docs — plan docs reference the phrase 'supabase functions deploy' in explanatory text to document its prohibition; checking plan docs would cause self-defeating false positives"
  - "buildPriorDiagnosisSummary placed as module-level function in PlantDiagnosisModal.tsx (not extracted to utils/) — helper is small, single-use, and co-located with its only consumer per planner discretion note"
  - "priorDiagnosisSummary threaded via chatDiagnosis() function signature (positional param after lang) not via object options — maintains backward compat with existing callers that pass positional args"
  - "Edge function deploy NOT performed — deferred to v1.1 batch deploy per CLAUDE.md and v1_1_test_backlog.md; local source change ships so batch deploy bundle includes it"
metrics:
  duration: "7 min"
  completed: "2026-05-02"
  tasks_completed: 3
  files_modified: 5
---

# Phase 09 Plan 07: chat-diagnosis Resume Clause (DIAG-05) Summary

DIAG-05 satisfied: `chat-diagnosis` edge function RequestBody gains `priorDiagnosisSummary?: string`; server prepends locale-aware resume clause with voseo discipline when present; client builds the summary from `SavedDiagnosis.result` via `buildPriorDiagnosisSummary` and threads it only when `resumeDiagnosis` is non-null.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Edge function — RequestBody + resume clause (ES + EN) | f10fbba | supabase/functions/chat-diagnosis/index.ts |
| 2 | Client — buildPriorDiagnosisSummary + thread through chat send | abe8eca | PlantDiagnosisModal.tsx, usePlantDiagnosis.ts, plantDiagnosis.ts |
| 3 | Activate smoke-phase09 T5a-g | efb1fd9 | scripts/smoke-phase09.mjs |

## Edge Function Changes (supabase/functions/chat-diagnosis/index.ts)

**RequestBody.priorDiagnosisSummary added at line 57:**
```typescript
/** Phase 9 (DIAG-05): when present, server prepends a resume clause to systemPrompt
 *  including this summary verbatim plus the no-severity-re-assess instruction.
 *  Backward-compat: when absent, behavior unchanged. */
priorDiagnosisSummary?: string;
```

**resumeClause constructed at line 185 (after contextInfo, before systemPrompt):**
```typescript
const resumeClause = body.priorDiagnosisSummary
  ? (isEs
    ? `\n\nResumen del diagnóstico previo:\n${body.priorDiagnosisSummary}\n\nNo re-evalúes la severidad ni cambies el diagnóstico salvo que el usuario suba una foto nueva. Continuá el seguimiento basándote en el diagnóstico previo.`
    : `\n\nPrior diagnosis summary:\n${body.priorDiagnosisSummary}\n\nDo not re-assess severity or change the diagnosis unless the user uploads a new photo. Continue follow-up based on the prior diagnosis.`)
  : '';
```

**${resumeClause} placement in systemPrompt:**
- Line 194 (ES branch): `${contextInfo}${resumeClause}` — directly after contextInfo block, before "Diagnóstico previo:" header
- Line 221 (EN branch): `${contextInfo}${resumeClause}` — directly after contextInfo block, before "Previous diagnosis:" header

When `priorDiagnosisSummary` is absent, `resumeClause === ''` and the prompt renders exactly as before (Phase 7 dual-payload backward-compat lock honored).

## Client Changes

**buildPriorDiagnosisSummary helper location:** Module-level function in `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` (above the `PlantDiagnosisModalProps` interface). Builds locale-aware plain-text summary from `SavedDiagnosis.result`: overallStatus, summary, issues (name + severity + confidence + treatment), careTips, photo presence indicator.

**Component wiring:**
- `isEs = i18n.language === 'es'` computed inside component
- `priorDiagnosisSummary = resumeDiagnosis ? buildPriorDiagnosisSummary(resumeDiagnosis, isEs) : undefined`
- `priorDiagnosisSummary` passed as new optional field to `usePlantDiagnosis({...})`

**usePlantDiagnosis.ts:** `UsePlantDiagnosisOptions.priorDiagnosisSummary?: string` added; threaded into `chatDiagnosis()` call as 8th positional arg via `options?.priorDiagnosisSummary`.

**plantDiagnosis.ts:** `chatDiagnosis()` signature extended with `priorDiagnosisSummary?: string` as 8th param; included in `supabase.functions.invoke` body (JSON serializer omits undefined key — backward compat).

## No supabase functions deploy

No `supabase functions deploy` command was run. The local source change is included in the v1.1 deploy bundle. Deploy tracked in `.claude/projects/-Users-gaston-Documents-Personal-MiJardinApp/memory/v1_1_test_backlog.md` as "Edge function deploy (DIAG-05 server-side activation)".

## T5 Sub-Assert PASS Confirmation (61/61 total)

- T5a: priorDiagnosisSummary appears 5 times in edge function (>= 3 required)
- T5b: ES copy "Resumen del diagnóstico previo" present
- T5c: EN copy "Prior diagnosis summary" present
- T5d: ES voseo "Continuá el seguimiento" present (Phase 5 Plan 02 voseo lock)
- T5e: EN "Do not re-assess severity" instruction present
- T5f: buildPriorDiagnosisSummary present in PlantDiagnosisModal
- T5g: no active `supabase functions deploy <fn>` call in source files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] T5g false-positive on plan markdown documents**

- **Found during:** Task 3 — first smoke run
- **Issue:** The plan's T5g code (copied verbatim from plan task 3 action) checked plan markdown files (09-01-PLAN.md…09-07-PLAN.md) for the string "supabase functions deploy". But 09-07-PLAN.md itself contains the phrase multiple times in backtick-quoted explanatory text explaining why NOT to run the command. This caused T5g to fail on the plan document that defines T5g.
- **Fix:** Scoped T5g to check only TypeScript/source files (`supabase/functions/chat-diagnosis/index.ts`, `src/hooks/usePlantDiagnosis.ts`, `src/utils/plantDiagnosis.ts`) where an actual active deploy call would appear — not plan docs. Used regex `supabase functions deploy [a-z]` to match real invocations only.
- **Files modified:** scripts/smoke-phase09.mjs
- **Commit:** efb1fd9 (Task 3 commit, same commit)

## Self-Check

**Files created:**
- .planning/phases/09-diagnosis-continuity-paywall-architecture/09-07-SUMMARY.md — this file

**Commits verified:**
- f10fbba: feat(09-07): extend chat-diagnosis RequestBody + resume clause
- abe8eca: feat(09-07): client buildPriorDiagnosisSummary + thread priorDiagnosisSummary
- efb1fd9: test(09-07): activate smoke-phase09 T5a-g

**Verification commands:**
- `npx tsc --noEmit` — exits 0
- `node scripts/smoke-phase09.mjs` — PASS (61/61)
- `grep -c "priorDiagnosisSummary" supabase/functions/chat-diagnosis/index.ts` — 5 (>= 3 required)
- `grep -c "buildPriorDiagnosisSummary" src/components/PlantDiagnosis/PlantDiagnosisModal.tsx` — 2 (>= 2 required)
- `grep -rn "priorDiagnosisSummary" src/ | wc -l` — 8 (>= 4 required)
