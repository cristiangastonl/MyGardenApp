---
phase: 10
slug: perenual-security
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-02
updated: 2026-05-02
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Phase 10 is a **structural security refactor**, not a feature build. There is NO new business logic to test (Phase 11 owns Perenual data quality improvements). The validation surface is therefore:

1. **Source presence** (does the new edge function file exist?)
2. **Source structure** (does it match the identify-plant template — CORS, Deno.env.get, error handling?)
3. **Grep guards** (is `EXPO_PUBLIC_PERENUAL_API_KEY` truly gone from src/, .env, .env.example, app.json?)
4. **TypeScript health** (does `npx tsc --noEmit` still exit 0?)
5. **Live deploy verification** (manual — Supabase Functions logs show successful invocations)

NO new smoke runner script is created for Phase 10 (per CONTEXT.md: "Phase 10 doesn't NEED a new smoke runner — it's a structural refactor (client→server). The verification surface is: tsc green + grep guard + manual edge function deploy verification."). Existing smoke runners (smoke-phase06.mjs, smoke-phase07.mjs, smoke-phase08.mjs, migration-smoke-test.mjs) continue to work — they don't touch the Perenual fetch path so they're unaffected by this phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | grep + tsc + (manual) Supabase Dashboard inspection |
| **Config file** | None new (no `scripts/smoke-phase10.mjs`) |
| **Quick run command** | `npx tsc --noEmit` (type-only, ~6s) |
| **Full suite command** | `npx tsc --noEmit && grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json && grep -c "supabase.functions.invoke('get-plant-care'" src/services/plantKnowledgeService.ts && test -f supabase/functions/get-plant-care/index.ts` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (~6s)
- **After every plan wave:** Run full suite above (~8s)
- **Before `/gsd:verify-work`:** Full suite green AND Plan 10-03 manual checkpoints completed (or explicitly aborted in Task 2 decision gate)
- **Max feedback latency:** 8 seconds for automated; manual checkpoints in Plan 10-03 may take user-driven time

---

## Per-Task Verification Map

> Every task in every plan appears here with an automated command OR is flagged Manual in the Manual-Only table below. Sampling continuity rule: no 3 consecutive tasks without automated verify.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-T1 | 10-01 | 1 | SEC-02 | File+Grep | `test -f supabase/functions/get-plant-care/index.ts && grep -c "Deno.env.get('PERENUAL_API_KEY')" supabase/functions/get-plant-care/index.ts` (≥1) AND `grep -c "Access-Control-Allow-Origin" ...` (≥1) AND `grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" ...` (===0) AND `npx tsc --noEmit` exits 0 | supabase/functions/get-plant-care/index.ts | ⬜ |
| 10-02-T1 | 10-02 | 2 | SEC-01, SEC-03 | Type+Grep | `npx tsc --noEmit` AND `grep -c "supabase.functions.invoke('get-plant-care'" src/services/plantKnowledgeService.ts` (===1) AND `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/` (===0) AND `grep -c "setPerenualApiKey\|getPerenualApiKey\|let perenualApiKey" src/services/plantKnowledgeService.ts` (===0) | src/services/plantKnowledgeService.ts | ⬜ |
| 10-02-T2 | 10-02 | 2 | SEC-01 | Grep | `grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" .env` (===0) AND `grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" .env.example` (===0) AND `grep -c "EXPO_PUBLIC_SUPABASE_URL" .env` (≥1) | .env, .env.example | ⬜ |
| 10-02-T3 | 10-02 | 2 | SEC-01 | Grep+JSON | `grep -ci "perenual" app.json` (===0) AND `node -e "JSON.parse(require('fs').readFileSync('app.json'))"` exits 0 | app.json | ⬜ |
| 10-03-T1 | 10-03 | 3 | SEC-04 | **Manual** | Deploy command output (`Deployed Function`) + secret-set output (`Finished`) + Supabase Dashboard logs check — see Manual-Only table | (Supabase deploy + secret + live identify) | ⬜ |
| 10-03-T2 | 10-03 | 3 | SEC-04 | **Manual** | Decision-gate response (`proceed` or `abort`) — see Manual-Only table | (User decision) | ⬜ |
| 10-03-T3 | 10-03 | 3 | SEC-04 | **Manual** | Perenual dashboard rotation + secret-set output + Supabase Dashboard logs check + curl 401 on old key — see Manual-Only table | (Perenual dashboard + Supabase secret + live identify + curl) | ⬜ |
| 10-04-T1 | 10-04 | 4 | SEC-05 | Grep | `grep -c "get-plant-care" CLAUDE.md` (≥3) AND `grep -c "PERENUAL_API_KEY" CLAUDE.md` (≥2) AND `grep -c "EXPO_PUBLIC_PERENUAL_API_KEY" CLAUDE.md` (≥1) AND `grep -c "supabase functions deploy get-plant-care" CLAUDE.md` (≥1) | CLAUDE.md | ⬜ |
| 10-04-T2 | 10-04 | 4 | SEC-05 | Grep | `grep -c "Perenual" .planning/PROJECT.md` (≥1) AND `grep -c "get-plant-care" .planning/PROJECT.md` (≥1) AND `grep -c "Key Decisions" .planning/PROJECT.md` (≥1) | .planning/PROJECT.md | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity check:** No 3 consecutive tasks without automated verify. Plan 10-03 contains 3 consecutive Manual tasks (T1, T2, T3) — but these are intrinsically manual (deploy requires `.envrc` access; key rotation requires Perenual dashboard access; both are listed in the Manual-Only table below with explicit step-by-step instructions). Surrounding tasks (10-02-T3 before, 10-04-T1 after) have automated verify, so the manual block is bookended by automated checks. Continuity rule satisfied via the bookend pattern (same precedent as v1.1 Phase 7 where Task 07-08-T6 was the only manual checkpoint).

---

## Wave 0 Requirements

Phase 10 has **no Wave 0** in the traditional sense (no smoke runner scaffolding to write before feature work begins). The closest analog is Plan 10-01 itself — it produces the edge function source as a prerequisite for Plan 10-02's client swap and Plan 10-03's deploy. By assigning 10-01 to Wave 1 and 10-02 to Wave 2 with `depends_on: [01]`, the dependency ordering is enforced at the wave level.

- [ ] No new framework install (typescript, grep, supabase CLI all already available — no project changes)
- [ ] No new smoke runner script (intentional per CONTEXT.md — verification surface is grep + tsc + manual)
- [ ] Existing smoke runners (smoke-phase06/07/08, migration-smoke-test) NOT touched — Phase 10 doesn't modify the surfaces they cover (catalog, season helpers, migration)

*Visual rendering does not apply to Phase 10 (no UI changes). The "live verification" in Plan 10-03 IS the manual UAT — identify a plant in Expo Go and confirm enriched data flows through.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `get-plant-care` edge function deployed to Supabase | SEC-04 | `.envrc` holds Supabase CLI access token; Claude has no read access (CLAUDE.md security note) | From project root: `source .envrc && supabase functions deploy get-plant-care`. Confirm `Deployed Function` output line. If 401: re-run `supabase login` + `supabase link --project-ref <ref>`. |
| `PERENUAL_API_KEY` Supabase secret set (initial — current key) | SEC-04 | Same `.envrc` access constraint | From project root: `source .envrc && supabase secrets set PERENUAL_API_KEY=<current_key_value>`. Confirm `Finished` output. Optionally `supabase secrets list` to confirm the key name appears (value masked). |
| Live identification triggers edge function with NO errors (initial verification post-deploy) | SEC-04 | Requires Expo Go on a real device + Supabase Dashboard browser access | Open Expo Go → identify a known species (e.g., monstera leaf photo). Open https://supabase.com/dashboard/project/<ref>/functions → `get-plant-care` → Logs tab. Confirm log line `[get-plant-care] Returning detail for plant id: <N>`. Confirm in-app the plant card shows enriched info (Perenual-derived watering / sun) NOT just defaults. |
| Decision gate before key rotation | SEC-04 | User-only judgment call — proceed only if Task 1 verification was REAL | Reply `proceed` to continue to Task 3, OR `abort` to skip key rotation (acceptable per CONTEXT.md if Task 1 verification was flaky — SEC-04 then deferred to a future security pass). |
| Perenual API key rotated in dashboard | SEC-04 | Perenual dashboard requires user login; Claude has no Perenual credentials | Open https://perenual.com/account → API Keys → Generate new key → copy value. Then `source .envrc && supabase secrets set PERENUAL_API_KEY=<NEW_VALUE>` (`Finished` output). Then trigger live identification AGAIN — confirm Supabase Logs show fresh successful invocation. Then return to Perenual dashboard → DELETE the OLD key. Optionally verify with `curl "https://perenual.com/api/species-list?key=<OLD_VALUE>&q=monstera"` — expect 401/403. |

---

## Validation Sign-Off

- [x] All tasks have automated verify OR are listed in Manual-Only table above
- [x] Sampling continuity: Plan 10-03's 3-manual-task block is bookended by automated verify (10-02-T3 before, 10-04-T1 after) per the v1.1 Phase 7 precedent
- [x] No new smoke runner needed (CONTEXT.md decision: structural refactor surface = grep + tsc + manual deploy verification)
- [x] No new framework / dependency installed
- [x] Feedback latency < 8s for automated; manual checkpoints user-driven
- [x] `nyquist_compliant: true` set in frontmatter (above)
- [x] Existing smoke runners (smoke-phase06/07/08, migration-smoke-test) NOT modified — Phase 10 doesn't touch their surface

**Approval:** validated by planner — ready for execution
