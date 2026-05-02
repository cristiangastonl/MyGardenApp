---
phase: 08-catalog-rebalance
plan: 05
subsystem: storage + ci-scripts + docs
tags: [alias-rewrite, ci-guard, i18n-parity, image-check, pre-submit, documentation]

# Dependency graph
requires:
  - phase: 08-catalog-rebalance
    plan: 01
    provides: getCatalogEntry helper; smoke-phase08 harness
  - phase: 08-catalog-rebalance
    plan: 03
    provides: 64-entry catalog with lavender split + 14 new outdoor entries + full EN/ES i18n
  - phase: 08-catalog-rebalance
    plan: 04
    provides: read-site consumers migrated to getCatalogEntry
provides:
  - "useStorage.updatePlant: alias databaseId auto-rewrite to canonical on save (CAT-05 closed)"
  - "scripts/check-i18n-keys.mjs: sync CI guard — 64 canonical ids verified in en/es plants.json (CAT-06)"
  - "scripts/check-images.mjs: async HEAD CI guard — 64 imageUrls checked at concurrency 8 (CAT-07)"
  - "package.json: check:i18n-keys + check:images npm scripts registered"
  - "CLAUDE.md: Pre-submit Checks section with accepted-known image failure list"
affects:
  - "Phase 8 complete — all 5 plans shipped; v1.1 Precision Care milestone complete"
  - "Pre-ship checklist: user runs check:i18n-keys (must pass) + check:images (15 known failures until image upload)"
  - "v1.1 device-test backlog: manual image upload for 15 catalog entries"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Alias-rewrite-on-save: getCatalogEntry(updates.databaseId) in updatePlant → rewrite alias to canonical; idempotent"
    - "Single-compile-path CI script idiom: transpileModule + stub modules + writeFileSync + dynamic import (carried from smoke runners)"
    - "Concurrency-limited async pool: Array.from workers pattern at CONCURRENCY=8 for HEAD requests"
    - "Accepted-known failure documentation: script exits 1 + itemised list + references CLAUDE.md + backlog"
    - "Markdown fence balance verification: FENCE_COUNT % 2 === 0 as doc-quality gate"

key-files:
  created:
    - scripts/check-i18n-keys.mjs
    - scripts/check-images.mjs
  modified:
    - src/hooks/useStorage.tsx
    - package.json
    - CLAUDE.md

key-decisions:
  - "alias-rewrite scope: ONLY in updatePlant, NOT addPlant or setPlants — per CONTEXT decision (CAT-05). Read-side alias resolution via getCatalogEntry covers the render path; save-time normalization closes the round-trip only when the user actually edits a plant. Pure runtime — no migration script."
  - "_aliases NOT checked by check:i18n-keys: canonical-id-only check. Runtime getCatalogEntry resolves aliases to canonical ids whose keysets ARE checked. i18n parity is a per-canonical-id concern. The lavanda alias has no i18n key (renamed to lavanda-angustifolia in Plan 03) — checking aliases would produce false-positive failures."
  - "Markdown insertion form chosen for CLAUDE.md: flat Markdown headings + bash fences (no nested markdown fence). Avoids double-nesting ``` inside ``` which renders badly in most viewers. Pre-submit section is raw Markdown prose with a single ```bash block pair. Fence count: 12 (before) + 2 (Pre-submit bash block) = 14 (even — balanced)."
  - "check:i18n-keys PASS count: 64 ids (not 52 as plan text said). STATE.md documents: 'A8 baseline corrected 50→64; 50 + 14 new = 64'. Plan text had stale count from RESEARCH.md. Output: '[check:i18n-keys] PASS — 64 catalog ids verified across en/es plants.json'."
  - "check:images accepted-known failures: 15 URLs fail (14 new outdoor entries + lavanda-angustifolia rename); all return HTTP 400 (Supabase Storage returns 400 for non-existent objects, not 404). This is expected-known per CONTEXT — does not block phase ship."

# Metrics
duration: 6min
completed: 2026-05-02
---

# Phase 8 Plan 05: CI Guards + Alias-Rewrite-on-Save Summary

**useStorage.updatePlant alias-rewrite (CAT-05) + check-i18n-keys CI guard (CAT-06) + check-images CI guard (CAT-07) + CLAUDE.md Pre-submit Checks section; Phase 8 catalog-rebalance complete**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-02T12:40:17Z
- **Completed:** 2026-05-02T12:46:26Z
- **Tasks:** 4
- **Files modified:** 5 (useStorage.tsx, check-i18n-keys.mjs, check-images.mjs, package.json, CLAUDE.md)

## Accomplishments

- T1: `useStorage.updatePlant` now auto-rewrites alias `databaseId` to canonical on save. `getCatalogEntry(updates.databaseId)` imported and called before the `.map()`; `normalizedUpdates` spread instead of raw `updates`. Idempotent — canonical ids pass through unchanged. `__DEV__`-gated `console.warn` for dev visibility.
- T2: `scripts/check-i18n-keys.mjs` created; transpileModule single-compile-path idiom; checks all 64 canonical catalog ids in both `en/plants.json` and `es/plants.json` for full keyset (`name`, `tip`, `description`, `problems[>=1]`, `nutrients` if entry declares it). Exits 0 with PASS on full coverage. `check:i18n-keys` npm script registered.
- T3: `scripts/check-images.mjs` created; async `fetch` with `method: 'HEAD'` at `CONCURRENCY = 8`, 10s timeout per URL. Ran to completion: 15/64 failures (accepted-known per CONTEXT). Documents failure list in script output + references `CLAUDE.md` + `v1_1_test_backlog.md`. `check:images` npm script registered.
- T4: `CLAUDE.md` gains `## Pre-submit Checks` section documenting both scripts, the accepted-known 15-URL failure list, and image upload steps. Two one-liners appended to the Commands section. Markdown fence balance verified: 14 fences (even).
- Cross-phase regressions: smoke-phase08 PASS 396/396; smoke-phase07 PASS 100/100; smoke-phase06 PASS 82/82; migration-smoke-test PASS 106/106. tsc exits 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: useStorage.updatePlant alias-rewrite-on-save** — `ba7ffbe` (feat)
2. **Task 2: check-i18n-keys.mjs + npm script** — `6910111` (feat)
3. **Task 3: check-images.mjs + npm script** — `d84cfe2` (feat)
4. **Task 4: CLAUDE.md Pre-submit Checks section** — `65a97cd` (docs)

## Files Created/Modified

- `src/hooks/useStorage.tsx` — import getCatalogEntry; normalizedUpdates alias-rewrite in updatePlant
- `scripts/check-i18n-keys.mjs` — sync CI guard; transpileModule + stub pattern; 64-id i18n parity check
- `scripts/check-images.mjs` — async CI guard; HEAD requests; concurrency 8; accepted-known failure notice
- `package.json` — added check:i18n-keys + check:images script entries
- `CLAUDE.md` — Pre-submit Checks section + Commands section additions

## Decisions Made

- **Alias-rewrite scope (only updatePlant):** The plan was explicit: alias-rewrite ONLY in `updatePlant`, not in `addPlant` or `setPlants`. The read-side `getCatalogEntry` in Plan 04 already covers render resolution. Save-time normalization in `updatePlant` closes the round-trip for user-initiated edits only. No batch-migration script — pure runtime, idempotent.
- **_aliases NOT checked by check:i18n-keys:** Post-Plan-03, the `lavanda` alias has NO i18n key (renamed to `lavanda-angustifolia`). Checking `_aliases` entries would produce a false-positive failure for `lavanda` since there's no `lavanda` key in plants.json. Script checks canonical ids only; runtime `getCatalogEntry` resolves aliases to canonical ids whose keysets ARE verified.
- **Markdown fence form — flat, not nested:** The plan offered two choices: insert the section with a nested `\`\`\`markdown` wrapper, or insert flat Markdown directly. Flat chosen (safer for viewer compatibility). One `\`\`\`bash` block pair added = 2 new fences, 14 total (even). Fence balance verified via `FENCE_COUNT % 2 === 0` check.
- **PASS count 64 not 52:** plan text said "52 catalog ids" but the actual catalog has 64 entries (50 original + 14 new from Plan 03). STATE.md documents: "A8 baseline corrected 50→64". Script output correctly reflects the live catalog size.
- **check:images returns 400, not 404:** Supabase Storage returns HTTP 400 for non-existent objects (not standard 404). The script correctly treats any non-200 as failure. All 15 expected-known failures return 400 — all captured and itemised.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Accepted Deviations (not bugs)

**1. PASS count 64 vs plan text 52** — plan text said "52 catalog ids" but catalog is actually 64 entries post-Plan-03. Plan 05 output matches reality. No fix needed.

**2. check:images esbuild comment mention removed** — T2 verify block requires `grep -c "esbuild" ... === 0`. The script comment said "no esbuild/swc fallbacks" which contains "esbuild". Rewrote comment to "no alternative compile paths" to satisfy the contract. The single-compile-path policy is preserved; only the wording changed.

## Issues Encountered

- `check:images` returns 400 (not 404) for missing Supabase Storage objects — expected behavior, documented in decisions.
- T2 first verify attempt failed because the single-compile-path comment contained the word "esbuild" triggering the `grep -c "esbuild" === 0` check — fixed immediately by rephrasing the comment.

## User Setup Required

**Image upload backlog (v1.1 ship blocker):** Upload 15 catalog images to Supabase Storage:

14 new outdoor entries: `jacaranda`, `ceibo`, `glicina`, `gardenia`, `camelia`, `dalia`, `salvia-ornamental`, `cala`, `copete`, `verbena`, `lavanda-stoechas`, `lavanda-dentada`, `romero-rastrero`, `tomate-cherry`

1 renamed entry: `lavanda-angustifolia` (old `lavanda.jpg` needs re-upload as `lavanda-angustifolia.jpg`)

Upload to: `plant-images/catalog/<id>.jpg` in Supabase Storage bucket.
After upload: re-run `npm run check:images` to confirm PASS.

## Next Phase Readiness

- Phase 8 catalog-rebalance is COMPLETE (5/5 plans shipped)
- v1.1 Precision Care milestone COMPLETE — all phases done
- Next step: `/gsd:verify-work` then phase commit + v1.1 ship preparation
- Manual verification pending (CAT-04, CAT-05 in 08-VALIDATION.md Manual-Only):
  - Patch-update: edit a plant tip in plantDatabase.ts → hot reload → confirm new tip in PlantCard
  - Alias-round-trip: craft Plant with `databaseId: 'lavanda'` → open + save → confirm rewrites to `lavanda-angustifolia`

## Self-Check: PASSED

- FOUND: src/hooks/useStorage.tsx (getCatalogEntry import + normalizedUpdates spread)
- FOUND: scripts/check-i18n-keys.mjs
- FOUND: scripts/check-images.mjs
- FOUND: package.json check:i18n-keys script
- FOUND: package.json check:images script
- FOUND: CLAUDE.md ## Pre-submit Checks section
- FOUND commit: ba7ffbe (Task 1)
- FOUND commit: 6910111 (Task 2)
- FOUND commit: d84cfe2 (Task 3)
- FOUND commit: 65a97cd (Task 4)
- tsc: exits 0
- smoke-phase08: PASS 396/396
- check:i18n-keys: PASS 64 catalog ids
- check:images: runs to completion (15 accepted-known failures)
- smoke-phase07: PASS 100/100
- smoke-phase06: PASS 82/82
- migration-smoke-test: PASS 106/106
- CLAUDE.md fence count: 14 (even — balanced)

---
*Phase: 08-catalog-rebalance*
*Completed: 2026-05-02*
