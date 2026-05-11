---
phase: 21
slug: plant-journal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `21-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom Node CJS smoke runner (`scripts/smoke-phase21.cjs`) — three-tier sentinel pattern (PASS scaffold + SKIP→PASS placeholders for JOURNAL-01..05 + STRICT cross-phase regression for Phase 18 + 19 + 20). Optional `ts.transpileModule` via gitignored `scripts/.tmp-phase21/` for behavioral asserts. |
| **Config file** | `package.json` `scripts` entry: `"smoke:phase21": "node scripts/smoke-phase21.cjs"` |
| **Quick run command** | `npm run smoke:phase21` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20 && npm run smoke:phase21` |
| **Estimated runtime** | ~3–5 s quick · ~15 s full |

---

## Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npm run smoke:phase21` (~3–5 s)
- **Per wave merge:** Full suite (~15 s)
- **Phase gate:** Full suite green + manual device-test checklist Blocks A–E closed (or Option B deferral per Phase 18-05 / 19-07 / 20-10 precedent)
- **Max feedback latency:** 15 s for full suite

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-00-01 | 00 | 0 | scaffold (smoke runner) | unit (file-content) | `node scripts/smoke-phase21.cjs` | ❌ W0 | ⬜ pending |
| 21-00-02 | 00 | 0 | scaffold (npm script + .gitignore) | unit (file-content) | `node -e "require('./package.json').scripts['smoke:phase21']"` + `grep -q '.tmp-phase21' .gitignore` | ❌ W0 | ⬜ pending |
| 21-00-03 | 00 | 0 | scaffold (types) | unit (file-content + tsc) | `node scripts/smoke-phase21.cjs` (W0.scaffold.types.JournalEntry + CareTag + AppData.journals sentinels) + `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 21-00-04 | 00 | 0 | scaffold (journalService skeleton) | unit (file-content + tsc) | `node scripts/smoke-phase21.cjs` (W0.scaffold.journalService sentinel) + `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 21-00-05 | 00 | 0 | scaffold (3 component skeletons) | unit (file-content + tsc) | smoke + tsc | ❌ W0 | ⬜ pending |
| 21-00-06 | 00 | 0 | scaffold (i18n skeleton ≥15 keys EN+ES) | unit (file-content) | `node scripts/smoke-phase21.cjs` (i18n parity sentinels) | ❌ W0 | ⬜ pending |
| 21-01-01 | 01 | 1 | JOURNAL-01 | unit (file-content + tsc) | smoke (JOURNAL-01.types + load-path default sentinels) + tsc | ✅ | ⬜ pending |
| 21-01-02 | 01 | 1 | JOURNAL-02 | unit (file-content + tsc) | smoke (JOURNAL-02.types.JournalEntry + CareTag-union sentinels) + tsc | ✅ | ⬜ pending |
| 21-02-01 | 02 | 1 | JOURNAL-02 | unit (transpileModule) | smoke (journalService.pickJournalPhoto + saveJournalPhoto + deleteJournalPhoto + deleteJournalDirectory real-impl sentinels) | ✅ | ⬜ pending |
| 21-03-01 | 03 | 2 | JOURNAL-03 | unit (file-content + tsc) | smoke (useStorage.addJournalEntry interface + value + dep array sentinels) + tsc | ✅ | ⬜ pending |
| 21-03-02 | 03 | 2 | JOURNAL-03 | unit (file-content + tsc) | smoke (useStorage.deleteJournalEntry sentinel) + tsc | ✅ | ⬜ pending |
| 21-03-03 | 03 | 2 | JOURNAL-04 (orphan cleanup) | unit (file-content + tsc) | smoke (useStorage.deletePlant.calls-deleteJournalDirectory sentinel + journals[id]-removed sentinel) + tsc | ✅ | ⬜ pending |
| 21-04-01 | 04 | 3 | JOURNAL-04 | unit (file-content + tsc) | smoke (ModalSectionId-extended-diario + JournalSection-rendered-after-mascotas + sectionLayouts.diario sentinels) + tsc | ✅ | ⬜ pending |
| 21-04-02 | 04 | 3 | JOURNAL-04 | unit (file-content + tsc) | smoke (JournalQuickAddSheet + snapPoints['60%'] + Cámara/Galería buttons + careTag chip row sentinels) + tsc | ✅ | ⬜ pending |
| 21-04-03 | 04 | 3 | JOURNAL-04 | unit (file-content + tsc) | smoke (JournalEntryRow + long-press → BottomSheetModal delete sentinels) + tsc | ✅ | ⬜ pending |
| 21-04-04 | 04 | 3 | JOURNAL-04 / Toast | unit (file-content) | smoke (Toast "Entrada guardada" wired sentinel) | ✅ | ⬜ pending |
| 21-05-01 | 05 | 4 | JOURNAL-05 | unit (file-content negative-grep) | smoke (negative-grep: NO usePremiumGate/isPremium/canReadJournal at journal-read sites) | ✅ | ⬜ pending |
| 21-05-02 | 05 | 4 | i18n parity | unit (file-content) | smoke (≥15 journal.* keys EN+ES parity sentinels) | ✅ | ⬜ pending |
| 21-06-01 | 06 | 5 | JOURNAL-01..05 | manual (device test) | Manual checklist Blocks A–E in `21-06-PLAN.md` (or deferral path) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase21.cjs` — three-tier runner (PASS scaffold + SKIP→PASS placeholders for JOURNAL-01..05 + STRICT cross-phase regression sentinels for Phase 18 PlantCard 5-element + Phase 19 TOX-03/04/06 + Phase 20 FERT-03 5-site + FERT-06 two-column + FERT-07 i18n parity)
- [ ] `package.json` — add `"smoke:phase21": "node scripts/smoke-phase21.cjs"`
- [ ] `.gitignore` — add `scripts/.tmp-phase21/`
- [ ] `src/types/index.ts` — type skeletons: `CareTag` union (6 literals: riego, fertilizar, sol, poda, problema, otro) + `JournalEntry` interface + `AppData.journals?: Record<string, JournalEntry[]>` additive-optional
- [ ] `src/services/journalService.ts` — skeleton file with exported `pickJournalPhoto`, `saveJournalPhoto`, `deleteJournalPhoto`, `deleteJournalDirectory` signatures (real impl in Plan 21-02)
- [ ] `src/components/plant-detail/JournalSection.tsx` — skeleton with default-export component returning empty View
- [ ] `src/components/plant-detail/JournalQuickAddSheet.tsx` — skeleton
- [ ] `src/components/plant-detail/JournalEntryRow.tsx` — skeleton
- [ ] `src/i18n/locales/{en,es}/common.json` — `journal.*` namespace skeleton (≥15 keys):
  - `journal.header` ("Journal" / "Diario")
  - `journal.emptyState` ("Add your first entry 📔" / "Agregá tu primera entrada 📔")
  - `journal.addEntry` ("+ New entry" / "+ Nueva entrada")
  - `journal.savedToast` ("Entry saved 📔" / "Entrada guardada 📔")
  - `journal.photoCamera` ("📷 Camera" / "📷 Cámara")
  - `journal.photoGallery` ("🖼️ Gallery" / "🖼️ Galería")
  - `journal.careTag.riego` ("Watering 💧" / "Riego 💧")
  - `journal.careTag.fertilizar` ("Fertilizing 🌱" / "Fertilizar 🌱")
  - `journal.careTag.sol` ("Sun ☀️" / "Sol ☀️")
  - `journal.careTag.poda` ("Pruning ✂️" / "Poda ✂️")
  - `journal.careTag.problema` ("Problem ⚠️" / "Problema ⚠️")
  - `journal.careTag.otro` ("Other 📝" / "Otro 📝")
  - `journal.deleteConfirm` ("Delete this entry?" / "¿Eliminar esta entrada?")
  - `journal.dateLabel.today` ("Today" / "Hoy")
  - `journal.dateLabel.yesterday` ("Yesterday" / "Ayer")
  - `journal.dateLabel.daysAgo` ("{{n}} days ago" / "Hace {{n}} días")

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BottomSheetModal Z-order inside RN Modal | JOURNAL-04 | Pitfall 3 — window composition can't be exercised in unit tests | Open MyPlantDetailModal → tap "+ Nueva entrada" → bottom sheet renders ABOVE the modal on iOS + Android |
| Reanimated v4 collapse height-0 Android bug | JOURNAL-04 | Pitfall 9 — only manifests at runtime on Android device | Tap Diario section header to collapse, then re-expand; no flicker, no height-0 stuck state on physical Android device |
| Photo capture EXIF rotation iOS | JOURNAL-02 | iOS portrait photos can render rotated 90° if EXIF not handled | Capture a portrait photo on iPhone via "📷 Cámara"; preview tile shows it upright; saved file renders correctly in timeline |
| Long-press vs FlatList scroll conflict | JOURNAL-04 | Multi-touch gesture composition is OS-level | Scroll the journal timeline rapidly; long-press on an entry mid-scroll does NOT fire delete sheet (long-press only on settled finger) |
| Toast position above 60% sheet | JOURNAL-04 | Visual check that Toast doesn't render under the sheet's see-through area | Save an entry; "Entrada guardada 📔" Toast renders above the sheet's dim overlay area, fully visible |
| 2-tap floor flow | JOURNAL-04 | UX validation | Stopwatch + screenshot: modal open → tap "+ Nueva entrada" (1) → tap "Guardar" (2) → entry appears in timeline. Two taps from modal-open state. |
| Permissions flow first-run | JOURNAL-04 | Camera + photo library permission prompts; rejection path | Fresh install: tap 📷 Cámara → iOS/Android permission prompt appears; reject → graceful fallback (Alert or silent close) |
| Plant delete cascade | JOURNAL-04 (orphan cleanup) | Filesystem state requires device inspection | Add a plant with journal photos; delete the plant; verify `documentDirectory/journal/${plantId}/` is gone via Files app (iOS) or `adb shell ls` (Android) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (smoke runner, npm script, .gitignore, types, journalService skeleton, 3 component skeletons, i18n skeleton with ≥15 keys)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
