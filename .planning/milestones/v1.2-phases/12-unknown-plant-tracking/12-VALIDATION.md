---
phase: 12
slug: unknown-plant-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework — `typescript.transpileModule` single-compile-path smoke runner (Phase 4 policy lock) |
| **Config file** | none — `scripts/smoke-phase12.mjs` is self-contained |
| **Quick run command** | `node scripts/smoke-phase12.mjs` |
| **Full suite command** | `node scripts/smoke-phase12.mjs && npx tsc --noEmit` |
| **Estimated runtime** | ~3 seconds (smoke) + ~10 seconds (typecheck) |

---

## Sampling Rate

- **After every task commit:** `node scripts/smoke-phase12.mjs`
- **After every plan wave:** `node scripts/smoke-phase12.mjs && npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite green; manual device test of dev-tools button visible
- **Max feedback latency:** ~3 seconds (smoke), ~13 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-WAVE0-01 | 00 | 0 | infra | scaffold (stubs) | `test -f scripts/.tmp-phase12/async-storage.mjs` | ❌ W0 | ⬜ pending |
| 12-WAVE0-02 | 00 | 0 | infra | scaffold (runner) | `node scripts/smoke-phase12.mjs` (returns 0 on stub) | ❌ W0 | ⬜ pending |
| 12-01-01 | 01 | 1 | TRACK-01 | unit (insert new entry) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | TRACK-01 | unit (increment count) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | TRACK-01 | unit (lowercase canonicalization) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-01-04 | 01 | 1 | TRACK-01 | unit (sorted desc by count) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-01-05 | 01 | 1 | TRACK-01 | unit (firstSeen immutability) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-01-06 | 01 | 1 | TRACK-01 | unit (silent error on AsyncStorage failure) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-01-07 | 01 | 1 | TRACK-01 | unit (JSON.parse failure → empty Record) | `node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | TRACK-02 | structural (`findPlantInDatabase` import + call site) | `npx tsc --noEmit && node scripts/smoke-phase12.mjs` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | TRACK-02 | structural (`void trackUnknownPlant(...).catch(()=>{})` present) | `grep -c "trackUnknownPlant" src/services/plantKnowledgeService.ts` ≥1 | ❌ W0 | ⬜ pending |
| 12-02-03 | 02 | 2 | TRACK-02 | manual (identify non-catalog plant in Expo Go → tracked) | manual device test | N/A | ⬜ pending |
| 12-03-01 | 03 | 2 | TRACK-03 | structural (Settings dev-tools button renders) | `grep -c "unknownPlantsReport" src/screens/SettingsScreen.tsx` ≥1 | ❌ W0 | ⬜ pending |
| 12-03-02 | 03 | 2 | TRACK-03 | i18n parity (4 new keys × 2 locales) | `npm run check:i18n-keys` | N/A | ⬜ pending |
| 12-03-03 | 03 | 2 | TRACK-03 | manual (Alert.alert shows report sorted desc by count) | manual device test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase12.mjs` — runner with ≥7 behavior asserts covering TRACK-01 unit-level (insert, increment, lowercase, sorted, immutable firstSeen, silent error, JSON.parse fallback)
- [ ] `scripts/.tmp-phase12/async-storage.mjs` — in-memory Map-backed `@react-native-async-storage/async-storage` stub (replaces the bare module specifier at runtime via the runner's rewrite step)
- [ ] `src/services/unknownPlantTracker.ts` — the service module itself (written in Wave 1 Plan 01; smoke runner imports it after that plan lands)
- [ ] No new framework install — pattern identical to `smoke-phase11.mjs`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Identify a non-catalog plant in Expo Go increments `@unknown_plants` | TRACK-02 | Requires real device, real PlantNet round-trip, real AsyncStorage | In Expo Go: identify a plant clearly NOT in the curated catalog (e.g., a random PlantNet result that doesn't match any of our 64 entries). Open Settings → Dev tools → tap "Unknown plants report". Verify the species name appears in the Alert with `count: 1`. Re-identify the same plant; verify `count: 2`. |
| Settings dev-tools button visible only in `__DEV__` | TRACK-03 | Requires running `__DEV__` and a production build to compare | In Expo Go (`__DEV__` true): button is visible. In a production EAS build (`__DEV__` false): button is hidden. (One-time check; doesn't need to repeat per plan.) |
| Empty-report copy shown when `@unknown_plants` is empty/missing | TRACK-03 | Requires fresh-install state | Clear AsyncStorage (`Reset App` dev button), open Unknown plants report, verify the empty-state Alert text matches `t('settings.unknownPlantsReportEmpty')`. |

---

## Validation Sign-Off

- [ ] All implementation tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (manual checkpoints isolated)
- [ ] Wave 0 covers all MISSING references (`smoke-phase12.mjs` + 1 stub module)
- [ ] No watch-mode flags
- [ ] Feedback latency < ~15s
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0 lands

**Approval:** pending
