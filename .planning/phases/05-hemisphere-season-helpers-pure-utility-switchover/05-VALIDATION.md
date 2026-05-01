---
phase: 5
slug: hemisphere-season-helpers-pure-utility-switchover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-01
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — Phase 4 established `scripts/migration-smoke-test.mjs` (typescript.transpileModule + Node assertions) as the smoke test harness; Phase 5 extends it. |
| **Config file** | None |
| **Quick run command** | `npm run smoke:migration` (extended; existing 63/63 + Phase-5 additions) |
| **Full suite command** | `npx tsc --noEmit && npm run check:legacy-fields && npm run smoke:migration` |
| **Estimated runtime** | ~15 seconds (tsc ~10s, smoke ~3s, grep guard ~1s) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npm run check:legacy-fields`
- **After every plan wave:** Run `npm run smoke:migration` (full quick suite incl. Phase 5 extensions)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | infra | smoke harness extension | `npm run smoke:migration` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | SEASON-01,02,03 | unit (smoke section) | `npm run smoke:migration` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | SEASON-04 | unit + grep | `npm run smoke:migration && grep -c 'getWaterSeason' src/utils/notificationScheduler.ts src/utils/plantHealth.ts` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 2 | WATER-05 | unit + i18n verify | `npm run smoke:migration && jq '.tasks.checkSoil' src/i18n/locales/{en,es}/common.json` | ❌ W0 | ⬜ pending |
| 05-05-01 | 05 | 2 | WATER-06 | unit | `npm run smoke:migration` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/migration-smoke-test.mjs` — extend with Phase 5 section (BA/NY/Singapore × month-boundary, soil_check task emission, overdue-water penalty skip, season-aware interval lookup matrix)
- [ ] `tests/fixtures/` — add `phase5-season-fixtures.json` if needed (lat-keyed plant fixtures for season testing — defer to plan if existing fixture suffices)
- [ ] No new test framework — Phase 4's smoke harness reused per CTRL-03

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cactus in soil_check on non-check-in day shows no "regar" task in Hoy | WATER-06 | Requires running app on device — task list rendering is UI | Set device date to mid-cycle for a cactus plant; cold-launch app; navigate to Hoy; assert no water/check_soil task for cactus |
| Same plant on check-in day shows `'check_soil'` task with copy "Tocá la tierra. Si está seca 5cm hacia abajo, regá." | WATER-05 | i18n string render check requires UI | Advance device date past `lastWatered + interval`; cold-launch app; navigate to Hoy; assert task with exact copy |
| Season transition observable in next-watering badge after Apr 1 (Southern) | SEASON-05 (covered Phase 6, but data layer is Phase 5) | Visual badge is Phase 6; Phase 5 only needs to expose the data | Inspect `getNextWaterDate(plant, latitude)` return on Mar 31 vs Apr 1 for BA latitude — must shift if interval differs |

*Manual scenarios are also captured in SMOKE-TEST.md for Phase 5 if generated.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (smoke harness extension)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter once Wave 0 lands

**Approval:** pending — to be approved by gsd-planner during plan generation
