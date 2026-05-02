---
phase: 8
slug: catalog-rebalance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | typescript.transpileModule smoke runner (Phase 4/5/6/7 single-compile-path policy carried) |
| **Config file** | `scripts/smoke-phase08.mjs` (Wave 0 / Plan 08-01 creates) |
| **Quick run command** | `npx tsc --noEmit` (type-only, ~6s) |
| **Full suite command** | `npx tsc --noEmit && node scripts/smoke-phase08.mjs && node scripts/smoke-phase07.mjs && node scripts/smoke-phase06.mjs && node scripts/migration-smoke-test.mjs` |
| **Estimated runtime** | ~22 seconds (image check `npm run check:images` is async/standalone, NOT in default loop) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run full suite (above)
- **Before `/gsd:verify-work`:** Full suite green AND `npm run check:i18n-keys` green AND `npm run check:images` (with documented exceptions for the 14 new outdoor entries, accepted-known-failure pending image upload)
- **Max feedback latency:** 22 seconds for inline; image-check is opt-in pre-submit

---

## Per-Task Verification Map

> Filled in by gsd-planner during plan creation. Every plan task entry MUST appear here with an automated command OR be flagged Manual in the table below.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| _TBD by planner_ | — | — | — | — | — | — | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase08.mjs` — pure smoke runner; assertions for: every entry in `PLANT_DATABASE` has `lightLevel`, `waterSchedule.{warm,cold}`, `waterMode` populated and in valid range; `getCatalogEntry(id)` resolves canonical ids; `getCatalogEntry(alias)` resolves to canonical entry via `_aliases`; `getCatalogEntry('nonexistent')` returns null; alias-collision check (no canonical id matches another's alias).
- [ ] `scripts/check-i18n-keys.mjs` — sync standalone script; for every catalog `id` AND every `_aliases` entry, assert both `en/plants.json[id]` AND `es/plants.json[id]` exist with full keyset (`name`, `tip`, `description`, `problems` array length ≥1, `nutrients` array length ≥1). Exit 1 with itemised list on failure. Wired in `package.json` as `npm run check:i18n-keys`.
- [ ] `scripts/check-images.mjs` — async standalone; HEAD requests parallel concurrency 8; 200 = pass, anything else = fail with URL list and exit 1. Wired in `package.json` as `npm run check:images`. Expected to fail for 14 new entries until image upload (documented in v1.1 backlog as accepted-known).
- [ ] No new framework install — typescript already a project dep; node mjs runner sufficient.

*Visual rendering (catalog browse, lavender variant differentiation, alias resolution from existing user plants) is verified manually in Expo Go per the Manual-Only table — no React Native test renderer in this project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Catalog browse shows 14 new outdoor entries with images, ES content correct (voseo `tip`, regional plant names) | CAT-02 | Visual + content review | Open app → Plantas → Add plant → browse catalog. Confirm 14 new entries (jacarandá, ceibo, glicina, gardenia, camelia, dalia, salvia ornamental, cala, copete, verbena, lavanda francesa, lavanda dentada, romero rastrero, tomate cherry) appear with names, tips, images. Switch language to EN; confirm names + tips translate. Note: images for new entries 404 until manual upload. |
| Lavender 3 variants render distinct cold tolerance + care text | CAT-03 | Visual differentiation check | Browse catalog → search "lavanda" → confirm 3 entries (angustifolia, francesa/stoechas, dentada). Open each in catalog detail; confirm distinct `tip` text reflecting cold-hardiness difference. Add lavanda-angustifolia + lavanda-stoechas as plants; in cold season verify the angustifolia interval is longer (more cold-tolerant) than stoechas. |
| Patch update to a `tip` text propagates to existing user plants on next render | CAT-04 | End-to-end behavior across sessions | Add a monstera. Edit `src/data/plantDatabase.ts` to change monstera `tip`. Hot reload. Open monstera in PlantCard / MyPlantDetailModal — confirm new `tip` displays (proves lookup-by-id is working, not cached on instance). |
| Alias resolution: legacy plant with `dbId === "lavanda"` resolves to lavanda-angustifolia | CAT-05 | End-to-end across plant store | Manually craft a plant with `dbId: "lavanda"` (or run app on pre-Phase-8 device upgrade). Open plant card — confirm name/tip/description show angustifolia content. Open + save — confirm `dbId` rewritten to `lavanda-angustifolia` (auto-migrate-on-alias). |
| `npm run check:i18n-keys` and `npm run check:images` are documented in CLAUDE.md and runnable | CAT-06, CAT-07 | Doc + tooling smoke | Read CLAUDE.md "Pre-submit checks" section. Run `npm run check:i18n-keys` — should pass after Phase 8. Run `npm run check:images` — should fail with itemised list of 14 new entries (accepted-known until image upload). |

---

## Validation Sign-Off

- [ ] All tasks have automated verify OR are listed in Manual-Only table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 (`scripts/smoke-phase08.mjs`) covers entry completeness + alias resolution + missing-entry defensive return
- [ ] No watch-mode flags
- [ ] Feedback latency < 22s
- [ ] `nyquist_compliant: true` set in frontmatter after planner fills the per-task map and Wave 0 ships

**Approval:** pending
