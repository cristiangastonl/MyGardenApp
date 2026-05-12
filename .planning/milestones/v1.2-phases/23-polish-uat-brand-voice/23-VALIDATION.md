---
phase: 23
slug: polish-uat-brand-voice
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `23-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom Node CJS smoke runner (`scripts/smoke-phase23.cjs`) — three-tier sentinel pattern (PASS scaffold + SKIP→PASS placeholders for POLISH-01..08 + STRICT cross-phase regression for Phase 18 + 19 + 20 + 21 + 22). Plus `scripts/voseo-lint.mjs` (STRICT, exit-code-driven). |
| **Config file** | `package.json` scripts: `"smoke:phase23"` + `"lint:voseo"` |
| **Quick run command** | `npm run smoke:phase23` (Wave 0 baseline ~200 ms) |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20 && npm run smoke:phase21 && npm run smoke:phase22 && npm run smoke:phase23 && npm run lint:voseo` |
| **Estimated runtime** | ~5 s quick · ~20 s full |

---

## Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npm run smoke:phase23 && npm run lint:voseo` (~5 s)
- **Per wave merge:** Full cross-phase suite (~20 s)
- **Phase gate:** Full suite green + manual gate (or Option B deferral)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-00-01 | 00 | 0 | scaffold (smoke runner + npm + .gitignore + voseo-lint skeleton + i18n emptyState skeleton) | unit (file-content) | `npm run smoke:phase23 && npm run lint:voseo` | ❌ W0 | ⬜ pending |
| 23-01-01 | 01 | 1 | POLISH-01 | unit (file-content + tsc) | smoke (OUTDOOR_TYPE_IDS Set + outdoor-emit gate sentinel) + tsc | ✅ | ⬜ pending |
| 23-01-02 | 01 | 1 | POLISH-02 | unit (smoke transpileModule count) | smoke (catalog count: 35 exterior+frutales + 10 outdoor-aromaticas have outdoor:false) | ✅ | ⬜ pending |
| 23-01-03 | 01 | 1 | POLISH-03 | unit (file-content + tsc) | smoke (`selectedPlant.category` precedence in IdentificationResults.tsx) + tsc | ✅ | ⬜ pending |
| 23-02-01 | 02 | 2 | POLISH-05 | unit (file-content + WCAG calc) | smoke (textSecondary new hex ≠ '#8a7e6b' AND ≥4.5:1 on bgPrimary + card) | ✅ | ⬜ pending |
| 23-02-02 | 02 | 2 | POLISH-06 | unit (file-content + voseo-lint) | smoke (4 action button keys with voseo + emoji) + `npm run lint:voseo` exit 0 STRICT | ✅ | ⬜ pending |
| 23-03-01 | 03 | 3 | POLISH-07 | unit (file-content + asset exists) | smoke (3 illustration files + 3 EmptyState JSX + 6 EN + 6 ES emptyState.* keys) | ✅ | ⬜ pending |
| 23-03-02 | 03 | 3 | POLISH-08 | unit (negative-grep) | smoke (no `samplePlants`/`mockPlants`/`seedPlants`/`demoPlants`/`firstLaunchPlants` in src/) | ✅ | ⬜ pending |
| 23-04-01 | 04 | 4 | POLISH-04 + all | manual (device test) | Manual checklist (or Option B deferral) | n/a | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase23.cjs` — three-tier runner (PASS scaffold + SKIP→PASS placeholders for POLISH-01..08 + STRICT cross-phase Phase 18-22 sentinels)
- [ ] `scripts/voseo-lint.mjs` — initial skeleton (BANNED list + walkValues + exit codes); STRICT body lands in Plan 23-02
- [ ] `package.json` — `"smoke:phase23"` + `"lint:voseo"` scripts
- [ ] `.gitignore` — `scripts/.tmp-phase23/`
- [ ] `src/i18n/locales/{en,es}/common.json` — `emptyState.{plants,calendar,explore}.{title,cta}` namespace skeleton (6 EN + 6 ES keys)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Identify → diagnose flow works on iOS + Android | POLISH-04 | Multi-screen flow with camera permissions + edge function call | Take photo via onboarding card AND PlantsScreen FAB → identify succeeds → "Diagnosticar" CTA opens chat → chat continues |
| Outdoor plant (tomate/rosa) shows NO "Sacalo afuera" task on Hoy | POLISH-01 | Real catalog data + day-emission flow | Add tomate (exterior); Hoy screen shows water/sun only, NO outdoor task |
| Indoor plant identified via PlantNet uses indoor labels in picker | POLISH-03 | PlantNet API call + UI rendering | Identify a Monstera; LightLevelPicker shows "Sombra" / "Luz indirecta" labels |
| `textSecondary` text readable on both card backgrounds | POLISH-05 | Visual contrast check | Open MyPlantDetailModal; subtitle text is clearly readable on `card #fffdf8` AND `bgPrimary #f5f0e6` |
| Action button voseo register feels natural | POLISH-06 | Native-speaker quality | Tap water/sun/outdoor/fertilize buttons; "Regá ahora 💧" etc. feel correct |
| 3 illustrated empty states render | POLISH-07 | RN Image rendering | First-launch app: PlantsScreen shows planta-en-maceta illustration + "Tu jardín está esperando 🌱"; CalendarScreen shows calendar illustration when no tasks; ExploreScreen shows lupa illustration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (5 surfaces: smoke runner, voseo-lint skeleton, 2 npm scripts, .gitignore, i18n skeleton)
- [ ] No watch-mode flags
- [ ] Feedback latency < 20 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
