---
phase: 4
slug: schema-foundation-migration-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

> **NOTE — Project lacks a test framework.** Per CLAUDE.md and research, this project has no test runner configured. Validation in v1.1 is a mix of TypeScript-compile gates, hand-run smoke tests, and runtime analytics. Wave 0 does NOT install a test framework (out of scope for v1.1 — REQUIREMENTS.md "Gaps to Address" notes this).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — TypeScript compile (`tsc --noEmit`) is the only automated gate |
| **Config file** | `tsconfig.json` (existing) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && bash scripts/migration-smoke-test.sh` (Wave 0 creates the smoke script) |
| **Estimated runtime** | ~5s for tsc, ~10s for smoke test |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` — must be green
- **After every plan wave:** Run smoke test if migration-touching code changed
- **Before `/gsd:verify-work`:** Hand-run on real device with v1.0 fixture data + production analytics check
- **Max feedback latency:** 15 seconds for tsc + smoke test

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD by planner | TBD | TBD | SCHEMA-01..09, LIGHT-03, WATER-04, UX-01 | tsc + manual + analytics | `npx tsc --noEmit` + smoke + device test | ⬜ pending | ⬜ pending |

*Map populated by gsd-planner after PLAN.md creation. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 must create:

- [ ] `scripts/migration-smoke-test.sh` — hand-runnable smoke test that:
  - Loads `tests/fixtures/v0-app-data.json` via a dev-only entry point (or AsyncStorage shim in node)
  - Runs `migrate(fixture)` deterministically
  - Asserts: every plant has `lightLevel`, `waterSchedule.warm`, `waterSchedule.cold`, `waterMode`
  - Asserts: idempotency — running twice produces identical output
  - Asserts: backup blob present in mock storage
- [ ] `tests/fixtures/v0-app-data.json` — synthetic v1.0 user data with edge cases (1 plant, 50 plants, plant with `sunHours: undefined`, plant with `waterEvery: 0`, suculenta vs interior categories)
- [ ] `scripts/check-no-legacy-reads.js` — CI grep guard for SCHEMA-08 (rejects new reads of `plant.sunHours` / `plant.waterEvery` outside allowlist of files in transition)
- [ ] `.planning/phases/04-schema-foundation-migration-core/SMOKE-TEST.md` — manual device test protocol (load fixture → upgrade → verify analytics fired → verify notifications rescheduled)

*Wave 0 does NOT install jest / vitest. Adding a test runner is out of scope for v1.1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App boots with v1.0 data and migrates without UI flicker | SCHEMA-01, SCHEMA-04 | Requires real device + real `loadData` window | Install v1.0 build, populate 50 plants, OTA-upgrade to v1.1 build, observe launch — no white flash, no error banner, plants visible in Hoy |
| Migration interrupted (kill mid-launch) does not corrupt data | SCHEMA-02, SCHEMA-07 | Requires force-quit during loadData | Install v1.0 build with 10 plants, upgrade to v1.1, force-quit during launch (within first 2s), reopen — verify either fully-migrated or original payload intact, never partial |
| Banner appears on migration failure without overwriting data | SCHEMA-07 | Requires synthetic failure injection in dev build | Dev build with `__DEV__ && process.env.FORCE_MIGRATION_FAIL` flag; on launch, banner shows above MainTabs, AsyncStorage live key remains untouched |
| OS notifications rescheduled against new schema | SCHEMA-06 | Requires inspecting `getScheduledNotifications` count + payload | Pre-migration: `expo-notifications` `getAllScheduledNotificationsAsync()` count + dump payload to log. Post-migration: same call, count matches, every notification's data references `lightLevel` not `sunHours` |
| Mini-tooltip appears on first MyPlantDetailModal open per plant after migration | UX-01 | Requires multi-step user interaction | Migrate. Open plant A → tooltip visible. Dismiss. Reopen plant A → no tooltip. Open plant B → tooltip visible. Reopen plant B → no tooltip |
| Migration analytics events emitted with correct payload | SCHEMA-05 | Requires analytics inspection | RevenueCat / app analytics dashboard (or `__DEV__ console`) shows `migration_started`, `migration_completed` with `{plantCount, durationMs}`. On synthetic failure: `migration_failed` with stage |
| Catalog rebalance: every PLANT_DATABASE entry has new fields populated | LIGHT-04, WATER-04, CAT-01 (catalog mechanical only) | Requires per-entry inspection | `scripts/audit-catalog.js` (Wave 0) prints any entry missing `lightLevel`, `waterSchedule`, or `waterMode`. Output must be empty |
| Performance budget: <200ms migration with 50 plants on low-end Android | SCHEMA-04 | Requires actual device profiling | Run on Pixel 3a or equivalent with 50-plant fixture. Time `migration_completed` event payload `durationMs`. Must be <200ms |
| CI grep guard fails build on new legacy field reads | SCHEMA-08 | Requires intentionally bad commit | Add a fake `plant.sunHours` read in non-allowlist file, run `node scripts/check-no-legacy-reads.js`, exit 1 |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (`npx tsc --noEmit`) OR explicit manual entry above
- [ ] Sampling continuity: tsc runs after every task commit
- [ ] Wave 0 covers all MISSING references (smoke script, fixture, grep guard, smoke test doc)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s for automated tier
- [ ] All 9 manual verifications have device-test instructions
- [ ] `nyquist_compliant: true` set in frontmatter (after planner maps each task)

**Approval:** pending
