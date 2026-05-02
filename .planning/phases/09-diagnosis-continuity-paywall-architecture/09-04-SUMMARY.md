---
phase: 09
plan: 04
subsystem: i18n
tags: [i18n, diagnosis, voseo, wave-3, parity]
dependency_graph:
  requires:
    - 09-01 (type extension — 'system' role for system messages)
  provides:
    - EN + ES diagnosis namespace with 5 locked keys under 'diagnosis.*'
    - T4 smoke assertion active (i18n parity + interpolation markers)
  affects:
    - Plans 09-05 + 09-06 (consume t('diagnosis.reopenChat'), t('diagnosis.resumeBanner'), t('diagnosis.reopenSystemMessage', {days}), t('diagnosis.messagesRemaining', {remaining,total}))
tech_stack:
  added: []
  patterns:
    - i18n parity invariant (Phase 4/6/7/8 lock carried — every new key in both EN + ES)
    - Voseo discipline (ES-AR: sacá, marcaste — verb forms verified in smoke runner)
key_files:
  created: []
  modified:
    - src/i18n/locales/es/common.json
    - src/i18n/locales/en/common.json
    - scripts/smoke-phase09.mjs
decisions:
  - "continueChat wording updated (drop emoji prefix): ES 'Continuar consulta', EN 'Continue chat' — matches CONTEXT §Example 4 exactly"
  - "Template literal assertion pattern for T4 key-presence loop (T4.en.${k} / T4.es.${k}) generates 10 runtime assertions from 2 source lines; satisfies >= 12 runtime assertions even though grep -c on source shows 7 lines"
  - "4 new keys inserted immediately after continueChat at line 645 in both files — preserves namespace ordering and comma correctness"
metrics:
  duration: "~4 min"
  completed: "2026-05-02"
  tasks: 3
  files: 3
---

# Phase 9 Plan 04: Wave 3 i18n Keys — Diagnosis Namespace Extension Summary

Five diagnosis-namespace i18n keys inserted into both EN and ES locale files, with voseo verb form ("sacá") in ES resumeBanner, interpolation markers preserved, and T4 smoke assertion activated (34/34 PASS).

## What Was Built

Three targeted changes:

1. **`src/i18n/locales/es/common.json` (Task 1):**
   - Line 645: `continueChat` updated from `"💬 Seguir consultando"` to `"Continuar consulta"` (emoji prefix dropped, wording per RESEARCH §Example 4).
   - Lines 646-649: 4 new keys inserted:
     - `reopenChat`: `"Reabrir consulta"`
     - `resumeBanner`: `"Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva."` (voseo: sacá)
     - `reopenSystemMessage`: `"Hace {{days}} días marcaste esta consulta como resuelta. ¿Qué cambió?"` (interpolates {{days}})
     - `messagesRemaining`: `"{{remaining}} de {{total}} mensajes restantes"` (interpolates {{remaining}} + {{total}})

2. **`src/i18n/locales/en/common.json` (Task 2):**
   - Line 645: `continueChat` updated from `"💬 Continue consulting"` to `"Continue chat"`.
   - Lines 646-649: 4 new keys inserted (exact parity with ES):
     - `reopenChat`: `"Reopen consultation"`
     - `resumeBanner`: `"Continuing prior diagnosis. For visual reassessment, take a new photo."`
     - `reopenSystemMessage`: `"You marked this consultation resolved {{days}} days ago. What changed?"` (interpolates {{days}})
     - `messagesRemaining`: `"{{remaining}} of {{total}} messages remaining"` (interpolates {{remaining}} + {{total}})

3. **`scripts/smoke-phase09.mjs` (Task 3):**
   - T4 placeholder replaced with real assertion block (22 inserted lines, 4 placeholder lines removed).
   - 10 key-presence assertions (5 keys × 2 locales via template literal loop).
   - 4 interpolation marker assertions ({{days}} × 2 locales + {{remaining}}+{{total}} × 2 locales).
   - 1 voseo verb assertion (`/sac[aá]/i` on ES resumeBanner).
   - Runner exits 0: `Phase 9 smoke: PASS (34/34)` (up from 19/19 before this plan).

## Key Verification Results

| Check | Result |
|-------|--------|
| ES JSON parses as valid | PASS |
| EN JSON parses as valid | PASS |
| `grep -c "Continuar consulta" es/common.json` | 1 |
| `grep -c "Continue chat" en/common.json` | 1 |
| `grep -c "Reabrir consulta" es/common.json` | 1 |
| `grep -c "Reopen consultation" en/common.json` | 1 |
| ES resumeBanner contains "sacá" (voseo) | PASS |
| `grep -c "💬 Seguir consultando" es/common.json` | 0 (old wording removed) |
| `grep -c "💬 Continue consulting" en/common.json` | 0 (old wording removed) |
| T4 smoke assertion | 34/34 PASS |

## New Key Positions

Both files: new keys inserted at lines 645-649, immediately after the pre-existing `continueChat` key position (which itself was updated). Line numbers are identical in both locale files.

| Line | Key | ES Value | EN Value |
|------|-----|----------|----------|
| 645 | continueChat | "Continuar consulta" | "Continue chat" |
| 646 | reopenChat | "Reabrir consulta" | "Reopen consultation" |
| 647 | resumeBanner | "Continuando diagnóstico anterior..." sacá | "Continuing prior diagnosis..." |
| 648 | reopenSystemMessage | "Hace {{days}} días marcaste..." | "You marked this consultation resolved {{days}} days ago." |
| 649 | messagesRemaining | "{{remaining}} de {{total}} mensajes restantes" | "{{remaining}} of {{total}} messages remaining" |

## Voseo Verification

ES resumeBanner: `"Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva."`

- `sacá` — imperative voseo form of `sacar` (correct ES-AR; tuteo would be `saca`).
- `marcaste` in reopenSystemMessage — preterite voseo conjugation (same form as tuteo for this verb; grammatically correct ES-AR).
- No additional verb forms required in other keys (declarative strings).

## Interpolation Marker Confirmation

| Key | Markers | Both Locales |
|-----|---------|-------------|
| reopenSystemMessage | `{{days}}` | CONFIRMED |
| messagesRemaining | `{{remaining}}`, `{{total}}` | CONFIRMED |

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 51b65a8 | feat(09-04): ES i18n — update continueChat wording + add 4 new diagnosis keys |
| Task 2 | 5063cbe | feat(09-04): EN i18n — update continueChat wording + add 4 new diagnosis keys (parity) |
| Task 3 | 52093c8 | feat(09-04): activate T4 smoke assertion — i18n parity + interpolation marker checks |

## Self-Check: PASSED

- src/i18n/locales/es/common.json: FOUND
- src/i18n/locales/en/common.json: FOUND
- scripts/smoke-phase09.mjs: FOUND
- commit 51b65a8: FOUND
- commit 5063cbe: FOUND
- commit 52093c8: FOUND
