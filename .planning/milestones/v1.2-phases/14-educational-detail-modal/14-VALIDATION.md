---
phase: 14
slug: educational-detail-modal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-04
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom Node smoke runners (project convention; mirrors Phase 11/12/13: `scripts/smoke-phase{N}.mjs` invoking `typescript.transpileModule` against stubbed source). No Jest/Vitest configured. |
| **Config file** | none — Wave 0 installs `scripts/smoke-phase14.mjs` + `scripts/.tmp-phase14/` stub directory |
| **Quick run command** | `npm run check:i18n-keys && npx tsc --noEmit` |
| **Full suite command** | `node scripts/smoke-phase14.mjs && npm run check:i18n-keys && npx tsc --noEmit && npm run check:images` |
| **Estimated runtime** | ~15 seconds quick, ~45-60 seconds full (check:images is the long pole at network HEAD requests) |

---

## Sampling Rate

- **After every task commit:** Run `npm run check:i18n-keys && npx tsc --noEmit` (~5s)
- **After every plan wave:** Run `node scripts/smoke-phase14.mjs && npm run check:i18n-keys && npx tsc --noEmit` (~15s)
- **Before `/gsd:verify-work`:** Full suite green + manual device-test of section animation, override-note rendering, custom-plant fallback path
- **Max feedback latency:** ~15 seconds quick path

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-00-01 | 00 | 0 | EDU-01..07 | smoke scaffold | `node scripts/smoke-phase14.mjs` | ❌ W0 (created here) | ⬜ pending |
| 14-01-01 | 01 | 1 | EDU-02 | type / smoke | `npx tsc --noEmit` + `node scripts/smoke-phase14.mjs` (asserts 5 fields in types/index.ts) | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | EDU-07 | static-analysis | `npm run check:i18n-keys` + smoke-runner fixture (entry declares 5 fields → validator demands i18n keys) | ✅ | ⬜ pending |
| 14-01-03 | 01 | 1 | EDU-06 | unit | `node scripts/smoke-phase14.mjs` calls `updatePlant` with/without `fromUserEdit` flag, asserts deep-merge guard intact | ✅ | ⬜ pending |
| 14-01-04 | 01 | 1 | EDU-02 | unit | `node scripts/smoke-phase14.mjs` (asserts `getTranslatedPlant` returns the 5 new keys when set on entry) | ✅ | ⬜ pending |
| 14-02-01 | 02 | 2 | EDU-01 | structural | `node scripts/smoke-phase14.mjs` (MyPlantDetailModal.tsx contains the 4 emoji+title strings + EducationalSection import) | ✅ | ⬜ pending |
| 14-02-02 | 02 | 2 | EDU-01 | structural | `node scripts/smoke-phase14.mjs` (EducationalSection component file exists; uses Reanimated v4 useSharedValue + withTiming pattern) | ✅ | ⬜ pending |
| 14-02-03 | 02 | 2 | EDU-05 | unit | `node scripts/smoke-phase14.mjs` (compareUserVsCatalog fixture set: 3 differing fields + 1 matching + null entry) | ✅ | ⬜ pending |
| 14-02-04 | 02 | 2 | EDU-04 | unit | `node scripts/smoke-phase14.mjs` (asserts IdentificationResults still passes selectedPlant.lightLevel as initial value to LightLevelPicker) | ✅ | ⬜ pending |
| 14-03-01..N | 03 | 3 | EDU-03 | content + parity | `npm run check:i18n-keys` (fails on any missing 5-field key in EN or ES) | ✅ | ⬜ pending |
| 14-04-01 | 04 | 4 | EDU-01/04/05 | manual checkpoint | (autonomous: false) — see Manual-Only Verifications | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase14.mjs` — smoke runner with stubbed assertions for EDU-01/04/05/06; fixture entries inline; uses `typescript.transpileModule` to load test sources
- [ ] `scripts/.tmp-phase14/` — gitignored stub directory for AsyncStorage + i18n module mocks (mirrors Phase 11/12 pattern)
- [ ] `package.json` — add `"smoke:phase14": "node scripts/smoke-phase14.mjs"` script entry
- [ ] `.gitignore` — add `scripts/.tmp-phase14/` if not already covered by glob

*No framework install needed — `node` + `typescript` (already a dependency) cover Phase 14's needs. Reanimated/gesture-handler/bottom-sheet/expo-haptics installed in Phase 13.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Section collapse/expand animation runs smoothly on real device | EDU-01 | UI-thread worklet animation; simulator timing differs from device | Open MyPlantDetailModal on Android dev client → tap each of the 4 section titles → verify ~250ms expand/collapse with chevron rotation, no stutter |
| Override note renders inline non-pushy when value differs | EDU-05 | Visual design judgment + tone check | Edit a plant's `lightLevel` to differ from catalog → reopen detail modal → verify "Tus ajustes" shows the soft note ("Diferente a la recomendación...") in `textSecondary` color, not as a banner |
| Custom plant (no databaseId) shows 4 sections with placeholders | EDU-01 | Renders gracefully on real plant data with no catalog match | Add a custom plant via "Add my own" path → open detail → verify all 4 section headers visible; ¿Por qué? hidden when whyRationale is null; placeholders not "broken half-empty" UI |
| LightLevelPicker pre-selects after PlantNet identification | EDU-04 | End-to-end identification flow on device | Identify a known catalog species via PlantNet → verify LightLevelPicker initial value matches `entry.lightLevel` (not the default) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`scripts/smoke-phase14.mjs` + `.tmp-phase14/`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
