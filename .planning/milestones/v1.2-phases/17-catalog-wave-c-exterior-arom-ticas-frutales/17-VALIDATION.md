---
phase: 17
slug: catalog-wave-c-exterior-arom-ticas-frutales
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Closes the v1.2 catalog expansion (CAT-21 final assertion `PLANT_DATABASE.length === 118`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | CJS smoke runner (`scripts/phase17-smoke.cjs`, file-content asserts + `ts.transpileModule` for routing probes) + `scripts/check-i18n-keys.mjs` (TS validator, EDU-aware) + `npx tsc --noEmit` (project gate) |
| **Config file** | `package.json` scripts (`smoke:phase17`, `check:i18n-keys`); no separate config |
| **Quick run command** | `node scripts/phase17-smoke.cjs` (~50ms — file-content asserts only, default mode) |
| **Full suite command** | `node scripts/phase17-smoke.cjs --identification --routing-fix && npm run check:i18n-keys && npx tsc --noEmit` (~10s) |
| **Estimated runtime** | ~50ms quick / ~10s full |

---

## Sampling Rate

- **After every task commit:** `node scripts/phase17-smoke.cjs` (CJS file-content asserts; ~50ms)
- **After every plan wave:** `node scripts/phase17-smoke.cjs --identification --routing-fix && npm run check:i18n-keys && npx tsc --noEmit` (~10s; routing-fix uses ts.transpileModule)
- **Before `/gsd:verify-work`:** Full suite must be green; voseo regex count ≤ 2 (baseline preserved); char-limit content review pass
- **Max feedback latency:** 50ms quick / 10s full

---

## Per-Task Verification Map

> Plan/task IDs are placeholders to be finalized by gsd-planner. The mapping below preserves the requirement → automated-command contract; planner replaces task IDs verbatim when authoring `<verify><automated>` blocks.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-00-T1 | 00 | 0 | scaffold | smoke runner + npm script + .gitignore | `node scripts/phase17-smoke.cjs` | ❌ Wave 0 | ⬜ pending |
| 17-01-T1 | 01 | 1 | CAT-17 (5 of 8 flores) | smoke (file-content) | `node scripts/phase17-smoke.cjs` (5 W1.CAT-17.* gates) | ❌ Wave 0 | ⬜ pending |
| 17-01-T2 | 01 | 1 | CAT-17 (3 of 8 flores) + i18n keyset | smoke + validator | `node scripts/phase17-smoke.cjs && npm run check:i18n-keys` | ❌ Wave 0 / ✅ check:i18n-keys | ⬜ pending |
| 17-02-T1 | 02 | 2 | CAT-18 (3 aromáticas) + CAT-19 (3 frutales/huerta) | smoke (file-content) | `node scripts/phase17-smoke.cjs` (6 W2.CAT-18/19.* gates) | ❌ Wave 0 | ⬜ pending |
| 17-02-T2 | 02 | 2 | CAT-20 (i18n keyset 14 entries) + CAT-21 (final 118) | smoke + validator | `node scripts/phase17-smoke.cjs && npm run check:i18n-keys && npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 17-03-T1 | 03 | 3 | CAT-20 (COMMON_NAMES_ES routing) | smoke routing-fix | `node scripts/phase17-smoke.cjs --identification --routing-fix` | ❌ Wave 0 | ⬜ pending |
| 17-04-T1 | 04 | 3 | CAT-20 (image plan registry) | smoke (file-content) | `node scripts/phase17-smoke.cjs` (W3.CAT-20.imagePlan gate) | ❌ Wave 0 | ⬜ pending |
| GLOBAL-voseo | (continuous) | (continuous) | voseo regression | smoke regex count | `node scripts/phase17-smoke.cjs` (GLOBAL.voseo gate) | ✅ pattern from Phase 15/16 | ⬜ pending |
| GLOBAL-tsc | (continuous) | (continuous) | TS strict | tsc | `npx tsc --noEmit` | ✅ project pre-submit gate | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/phase17-smoke.cjs` — covers CAT-17/18/19/20/21 with anyLanded/allLanded windowing + mid-band SKIP + final `=== 118` + IDENT.CAT-20 + IMAGE.CAT-20 + voseo regression. Mirrors `scripts/phase16-smoke.cjs` structure (textual delta: PHASE_16 → PHASE_17 substitutions, 14-id array, count window `> 104 && < 118 → undefined`, final `=== 118`).
- [ ] `package.json` — add `"smoke:phase17": "node scripts/phase17-smoke.cjs"` script line.
- [ ] `.gitignore` — add `scripts/.tmp-phase17/` line (mirrors `.tmp-phase15/` + `.tmp-phase16/` precedents).
- No new fixture files needed — `phase17-smoke.cjs` auto-writes async-storage + i18n stubs to `.tmp-phase17/` like `phase16-smoke.cjs` does.
- No framework install needed — `node:fs` + `typescript` already available.

**Pre-write discipline (no automated test, but enforced at commit time):**
- Voseo grep sweep before each content commit: `grep -E '\b(riega|saca|pon|ten|haz|quieres|toca|mueve|puedes)\b' src/i18n/locales/es/plants.json | wc -l` MUST stay ≤2 (baseline preserved through Phases 14/15/16).
- Char-limit grep: every `whyRationale` string ≤250 chars at draft time. Phase 16 zero-overflow pattern proves this is achievable; do NOT post-hoc trim.
- Voseo false-positive disambiguation: `tocá` matches `\btoca\b` regex — manual confirm voseo verb form vs Castilian; same for `tenés` → `\bten\b`. Inline reword if needed (Phase 16 Plan 16-01 precedent).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `whyRationale` ≤250 chars per entry | Content quality lock from Phase 14-06 | Regex `whyRationale: .{251,}` returns 0 lines is reliable, but enforced at draft-time discipline rather than blocking smoke gate (Phase 16 zero-overflow proves it works) | At each content commit, run `grep -nE 'whyRationale: ".{251,}"' src/data/plantDatabase.ts` — 0 lines required. Inline trim before commit if violation surfaces. |
| Voseo false-positive review | GLOBAL voseo regression | `tocá` (correct voseo) matches `\btoca\b` regex; needs human eye to disambiguate | Before each content commit, scan grep hits for false positives; reword Castilian forms; preserve voseo verb forms |
| Image upload (deferred to milestone end) | CAT-20 (image plan documentation closes; actual upload deferred) | Manual ops backlog — same pattern as Phase 15/16 (cumulative 69-entry backlog at v1.2 milestone end) | Document in CLAUDE.md "Phase 17 Wave C" block as accepted-known failures. No upload during Phase 17 execution. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (`scripts/phase17-smoke.cjs` covers all CAT-17/18/19/20/21 gates)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (every task has smoke runner gate at minimum)
- [ ] Wave 0 covers all MISSING references (`scripts/phase17-smoke.cjs` + `.tmp-phase17/` stubs created)
- [ ] No watch-mode flags (smoke runner is one-shot CJS)
- [ ] Feedback latency < 10s (full suite ~10s, quick ~50ms)
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0 lands `phase17-smoke.cjs` and verifies baseline PASS at idMatches=104 mid-band SKIP)

**Approval:** pending
