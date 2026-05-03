---
phase: 11
slug: perenual-data-quality
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework — `typescript.transpileModule` single-compile-path smoke runner (Phase 4 policy lock) |
| **Config file** | none — runner is a standalone `.mjs` script |
| **Quick run command** | `node scripts/smoke-phase11.mjs` |
| **Full suite command** | `node scripts/smoke-phase11.mjs && npm run typecheck` |
| **Estimated runtime** | ~3 seconds (smoke) + ~10 seconds (typecheck) |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/smoke-phase11.mjs`
- **After every plan wave:** Run `node scripts/smoke-phase11.mjs && npm run typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green + manual 5-species fixture verified post-deploy
- **Max feedback latency:** ~3 seconds for unit-level (smoke), ~10 seconds for full

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-WAVE0 | 00 | 0 | infra | scaffold | `node scripts/smoke-phase11.mjs` (returns 0 on stub) | ❌ W0 | ⬜ pending |
| 11-01-01 | 01 | 1 | DATA-01 | unit + structural | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | DATA-01 | structural (source grep — placement between search & details fetch) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | DATA-01 | manual (post-deploy edge function smoke) | manual — Supabase Functions logs | N/A | ⬜ pending |
| 11-02-01 | 02 | 1 | DATA-02 | unit (`parseHardiness({ max: "10" }) → 38`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | DATA-02 | unit (`parseHardiness({ max: "11" }) → 40`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-02-03 | 02 | 1 | DATA-02 | unit (`parseHardiness(undefined) → { tempMin: null, tempMax: null }`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-02-04 | 02 | 1 | DATA-02 | unit (tropical fallback → `tempMax: 32`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-02-05 | 02 | 1 | DATA-02 | unit (cactus fallback → `tempMax: 40`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 1 | DATA-03 | unit (`family: "Araceae" → humidity: 'alta'`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 1 | DATA-03 | unit (`family: "Cactaceae" → humidity: 'baja'`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 1 | DATA-03 | unit (`type: "succulent" → humidity: 'baja'`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-03-04 | 03 | 1 | DATA-03 | unit (default `family: "Rosaceae" → humidity: 'media'`) | `node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 2 | DATA-04 | manual (5-species fixture ≥80% non-default) | manual post-deploy fixture | N/A | ⬜ pending |
| 11-04-02 | 04 | 2 | schema | structural (`PerenualPlantDetail.family/type` declared in BOTH files) | `npm run typecheck && node scripts/smoke-phase11.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase11.mjs` — runner with ≥12 assertions covering DATA-01 (structural placement + behavior), DATA-02 (unit + fallbacks), DATA-03 (unit per branch)
- [ ] `scripts/.tmp-phase11/supabase.mjs` — mock module exporting `supabase.functions.invoke` stub for client-side `parseHardiness`/`convertPerenualToKnowledge` import isolation
- [ ] `scripts/.tmp-phase11/database.mjs` — empty types export for `DbPlantKnowledge` / `DbPlantKnowledgeInsert` so `transpileModule` import compiles
- [ ] No new framework install — pattern identical to `smoke-phase09.mjs` (source grep for edge function Deno code) and `smoke-phase08.mjs` (`ts.transpileModule` for client TS)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edge function returns `{ data: null }` on mismatch end-to-end | DATA-01 | Requires deployed edge function + live Perenual call | After `supabase functions deploy get-plant-care`, identify a known-mismatch query (e.g., "qwerty fictional plant"). Check Supabase Functions logs for `[get-plant-care] Mismatch:` line and verify client-side `getEnrichedPlantData` returns defaults. |
| 5-species accuracy fixture | DATA-04 | Live Perenual API call required; deterministic mocks would not catch real schema drift | Post-deploy: in Expo Go, identify (or call `getEnrichedPlantData` directly) for the 5 fixture species (Monstera deliciosa, Echinopsis pachanoi, Rosa canina, Phalaenopsis amabilis, Aloe vera). Record `tempMax` and `humidity` for each. Assert ≥4/5 have `tempMax ≠ 35 AND humidity !== null`. |
| Edge function deploy + key parity | DATA-01..04 (deploy gate) | Executor cannot run `supabase functions deploy` (no `.envrc` token access) | User runs `source .envrc && supabase functions deploy get-plant-care`, replies "deployed" — Phase 10 checkpoint pattern. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (manual checkpoints isolated)
- [ ] Wave 0 covers all MISSING references (`smoke-phase11.mjs` + 2 stub modules)
- [ ] No watch-mode flags
- [ ] Feedback latency < ~15s (smoke + typecheck)
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0 lands

**Approval:** pending
