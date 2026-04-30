# Project Research Summary — v1.1 Precision Care

**Project:** My Happy Garden (My Garden Care)
**Domain:** React Native / Expo plant-care app — schema-evolution milestone
**Researched:** 2026-04-29
**Mode:** Subsequent-milestone research (additions/changes to live local-first app)
**Confidence:** HIGH

## Executive Summary

v1.1 is a **schema-evolution milestone**, not a feature-addition milestone. The four research streams converge on the same conclusion: the technical risk is concentrated in one place (migrating `sunHours → lightLevel` and `waterEvery → waterSchedule {warm, cold}` against live user AsyncStorage data), the feature scope is mostly translation of existing care semantics into a more honest model (4-level light, hemisphere-aware seasonal watering, soil-check mode for cacti/succulents), and the entire delivery can ship with **zero new npm dependencies**.

The recommended approach is a one-way migration with a versioned envelope inside the existing `'plant-agenda-v2'` AsyncStorage blob, an idempotent `runMigrations()` invoked synchronously inside `useStorage.loadData()`, deterministic `sunHours → lightLevel` and `waterEvery → waterSchedule` mappers reused by both user-data migration and the catalog rebalance, and a single derivation point (`useWarmCold(location)`) that feeds the existing pure-utility layer (`plantLogic`, `plantHealth`, `notificationScheduler`). Diagnosis chat continuity is a fully isolated change (`DiagnosisDetailModal.tsx:248`) and should be the last small phase, but it carries the highest paywall-revenue risk through the modal-stacking pitfall — it is small in lines and large in QA.

The dominant risks are: (1) partial migration on app kill causing silent data loss [CRIT-1], (2) keeping legacy fields "just in case" → dual-source-of-truth bugs [CRIT-2], (3) stale OS-level scheduled notifications computed from the old schema [CRIT-3], (4) modal-stacking on the paywall flow [CRIT-4], and (5) soil-check mode having no natural notification trigger [CRIT-5]. Each has a concrete, testable mitigation locked in across the research.

## Key Findings

### Recommended Stack

**No new packages.** Two new pure-TS modules (`src/utils/seasonality.ts`, `src/utils/migration.ts`) and field additions to existing types. See `.planning/research/STACK.md`.

**Stack additions (all internal):**
- `src/utils/seasonality.ts` — `getSeason(lat, date) → 'warm' | 'cold'`. ~30 LOC arithmetic.
- `src/utils/migration.ts` — `runMigrations`, `migratePlant_0to1`, deterministic mappers. Hand-rolled, idempotent, single-pass on load.
- `expo-location` ^19.0.8 — already installed; new use is onboarding location prompt. **No new permission** (verify privacy manifest in MIN-8).
- `expo-localization` + `react-i18next` — new keys for light/water/season/banner copy.
- `react-native-purchases` — paywall trigger from "Continue chat" is a render-gate removal, not a new SDK call.

**Critical:** Storage key stays `'plant-agenda-v2'`. Schema version lives **inside** the payload, not in the key.

**Rejected:** `spacetime`, `date-season`, `suncalc`, SQLite, `zod`, `redux-persist`.

### Expected Features

See `.planning/research/FEATURES.md`. The market has converged on a 4-level light system and hemisphere-aware seasonal watering — these are table stakes. Differentiators are LATAM-specific.

**Must have (table stakes):**
- 4-level light enum with visual picker showing real-world placement descriptions
- Seasonal `waterSchedule: { warm, cold }` driven by hemisphere + month
- Hemisphere + season detection from latitude (plus tropical zone — see MOD-1)
- `waterMode: 'fixed' | 'soil_check'` — soil-check is correct default for cacti/succulents
- Location-skip fallback with non-blocking banner on Hoy
- Diagnosis "Continue chat" button always visible to free users; paywall on tap
- Resolved-diagnosis "Reabrir consulta" rename + reopen-context summary
- Catalog migration of all 60+ existing entries

**Should have (differentiators for LATAM):**
- Argentine-Spanish-first location descriptions in voseo
- Soil-check mode honest copy ("Tocá la tierra…")
- 10-15 outdoor catalog additions (jacarandá, ceibo, glicina, gardenia, camelia, dalia, salvia, cala, copete, verbena, lavanda francesa/dentada, romero rastrero, tomate cherry)
- Hemisphere-aware seasonal copy
- Lavender variety split (angustifolia/stoechas/dentata)

**Anti-features (DO NOT build):**
- Lux/light-meter via phone camera
- 5+ level light system
- Per-month watering schedule
- Auto-rescheduling on weather forecast
- Multi-pot tracking
- Per-plant configurable seasonal ratio
- Auto-detect light from room photo
- PPFD/DLI numeric readouts

### Architecture Approach

See `.planning/research/ARCHITECTURE.md`. Three concentric rings, each gated on the previous:

1. **Schema + migration core** — `PersistedAppData { schemaVersion, data }` envelope, `runMigrations()` ordered array, `migratePlant_0to1()` deterministic mapper. All inside `useStorage.tsx` load path.
2. **Derived helpers** — `seasonality.ts`, `useWarmCold(location)` hook, `getEffectiveWaterEvery(plant, season)`. Pass `season` as **argument** to pure utilities.
3. **UI propagation** — every screen reading `waterEvery`/`sunHours` switches to new fields; every plant-creating flow writes new fields. Catalog rebalance is data-only and uses **same** mapping functions as user migration.

**Patterns to follow:**
- Versioned envelope, ordered migrations, idempotent re-runs
- Deterministic mappers reused across migrations and catalog
- Premium gate on tap, not on render
- One-way migration: drop legacy fields, let TypeScript surface every read site

**Anti-patterns:**
- Lazy per-plant migration on read
- Reading `useStorage` from inside pure utilities
- Hard-keeping legacy fields beyond migration completion
- Migrating catalog with different mapping than user plants
- Hardcoding any user-facing string

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full detail (5 critical, 10 moderate, 8 minor).

1. **CRIT-1 Partial migration on app kill → silent data loss.** Mitigation: schemaVersion field, single atomic transaction, pre-migration backup blob to `'plant-agenda-v2.backup-pre-v1.1'` for one release, idempotent re-runs, analytics events. **Verification gate: simulate kill-during-migration on real device.**
2. **CRIT-2 Dual source of truth from "we'll keep old fields just in case".** Mitigation: one-way migration; delete legacy fields from `Plant` type; let TypeScript compiler surface every read site. ESLint/grep guard in CI.
3. **CRIT-3 OS-level scheduled notifications still fire on old schema.** Mitigation: `cancelAllNotifications()` then full reschedule pass as part of migration completion; refactor `notificationScheduler` to consume `lightLevel`. **Verification gate: pre/post migration count inspection.**
4. **CRIT-4 Modal stacking — paywall opened from nested modal.** Mitigation: lift paywall presentation to App-level component (mirrors NotificationContext pattern); deferred callback after purchase; iOS+Android × free × upgraded × cancelled-purchase test matrix.
5. **CRIT-5 Soil-check mode has no natural notification trigger.** Mitigation: low-frequency check-in notification with action buttons "Registrar riego" / "Aún seca, recordame en 3 días"; new task type `'check_soil'`; **health score does NOT penalize overdue watering for soil-check plants**.

## Implications for Roadmap

The four research streams independently arrive at almost identical phasing — the dependency graph is nearly forced.

### Phase A: Schema Foundation + Migration Core
**Must ship first.** Anything else without migration corrupts user data.
- `PersistedAppData` envelope + `runMigrations()` infrastructure
- `migratePlant_0to1()` with deterministic mappers
- New types in `src/types/index.ts`; legacy `sunHours`/`waterEvery` removed (CRIT-2 stance)
- `PLANT_DATABASE` (60+ entries) updated using **same** mapper as user data
- Pre-migration backup blob, atomic post-migration write, idempotent re-run
- `cancelAllNotifications()` + full reschedule as part of migration completion
- Analytics: `migration_started/completed/failed`

**Verification gate:** kill-during-migration on real device; pre/post notification count; <200ms launch budget on low-end Android with 50 plants.

### Phase B: Hemisphere/Season Helpers + Pure-Utility Switchover
Pure-utility surface only — no UI changes.
- `src/utils/seasonality.ts` with **3-zone classification** (Northern temperate / Southern temperate / Tropical)
- `useWarmCold(location)` hook
- `getEffectiveWaterEvery(plant, season)` in `plantInfo.ts`
- `plantLogic.ts` accepts `season`; soil-check plants get `'check_soil'` task type
- `plantHealth.ts` accepts `season`; suppresses overdue penalty for `soil_check`
- `notificationScheduler.ts` reads `lightLevel`; sun-window per level
- Location fallback chain: GPS → manual city → locale-based default
- Month-based season boundaries, not equinox

### Phase C: UI Read-Side Propagation
Display components catch up. Lower risk than write-side.
- All plant rendering components show `lightLevel` (translated) instead of `${sunHours}h sol`
- `MyPlantDetailModal` shows effective interval with season badge
- Plant card mode badge ("💧 Cada 5d" or "🤚 Por chequeo")
- Empty state for soil-check plants on non-check-in days
- One-time post-migration in-app message explaining the change
- All new i18n keys EN + ES (incl. outdoor-context labels for `lightLevel`)

### Phase D: UI Write-Side + Onboarding + Edge-Function Contract
Highest UX risk surface.
- `AddPlantModal` rewrite: 4-button picker, conditional warm/cold inputs
- `OnboardingScreen` location prompt + non-blocking banner if denied
- `IdentifiedPlant` + edge function `identify-plant` updated (accept legacy fields one release)
- `PlantDiagnosisContext` migrated; `chat-diagnosis` and `diagnose-plant` edge functions updated
- `plantKnowledgeService.ts` returns new fields
- `PLANT_TYPES` constants extended
- Settings → manual climate-zone override (Northern / Southern / Tropical)

### Phase E: Catalog Rebalance
Mostly mechanical but largest line count.
- 10-15 LATAM/Argentine outdoor entries
- Audit existing 60+ entries for category-appropriate `lightLevel`
- Per-category `cold` defaults set explicitly per `PlantDBEntry` (override migration heuristic)
- Lavender variety split
- Catalog content **always read by lookup** (`getCatalogEntry(plant.dbId).tip`), never copied — fixes MOD-6
- `_aliases: string[]` for slug renames (MOD-8)
- CI build-time check: every catalog `id` has full keyset in EN + ES (MOD-7)
- Pre-submit check: every `imageUrl` resolves 200 OK (MIN-4)

### Phase F: Diagnosis Chat Continuity (Highest Revenue Risk)
Single-line render-gate change but riskiest paywall surface.
- Remove `isPremium &&` gate on Continue button at `DiagnosisDetailModal.tsx:248`
- "Reabrir consulta" rename for resolved diagnoses
- Reopen-context summary prepended on resume
- Lift paywall to App-level context; deferred callback after purchase
- Resume is text-only by design; explicit copy
- Resume system prompt continuation marker
- Message-count limit per diagnosis lifetime, visible budget
- Premium upgrade lifts limit retroactively

**Verification gate:** dedicated paywall regression checklist; iOS+Android × free × upgraded × cancelled test matrix.

### Phase Ordering Rationale

- **A before everything:** anything else without migration corrupts user data
- **B before C/D:** UI consumes new fields; pure utilities must be ready first
- **C before D:** read-side lower risk; shake out display bugs first
- **D before E:** new catalog uses same emit shape as new-plant flows
- **F independent:** zero schema coupling; ship after A-E for stable schema, OR as hotfix

### Research Flags (Recommend `/gsd:research-phase` before planning)

- **Phase A** — kill-during-migration semantics on RN AsyncStorage (it's not actually atomic)
- **Phase D** — edge-function source code not yet read; need backward-compat window design
- **Phase F** — modal-stacking architecture review

### Standard Patterns (skip research-phase, plan directly)

- **Phase B** — arithmetic + well-documented patterns
- **Phase C** — mechanical display swaps
- **Phase E** — data entry against defensible reference table

## Open Decisions for the Planner (Cross-File Tensions)

Resolve **before** Phase A locks.

1. **Drop legacy fields immediately vs `@deprecated` for one release?**
   - STACK + ARCHITECTURE recommend `@deprecated` optional with v1.2 deletion
   - PITFALLS CRIT-2 recommends immediate deletion to prevent dual-source bugs
   - **Recommendation:** middle path with CRIT-2 ESLint/grep guard from day one. Delete in v1.2.

2. **Soil-check task UX in Hoy.**
   - **Recommendation:** Adopt CRIT-5 design (new `'check_soil'` task type, low-frequency check-in, no health penalty). Lock before Phase B.

3. **Cold-season default strategy.**
   - **Recommendation:** Use ARCHITECTURE's `applyColdFactor(category)` for migration default (Phase A); override per-`PlantDBEntry` with FEATURES table values during Phase E. Migration conservative; catalog defensible.

4. **`lightLevel` threshold boundaries.**
   - **Recommendation:** lock ARCHITECTURE proposal (`>=5 direct, >=3 bright_indirect, >=2 medium_indirect, <2 low`). Apply identically to user migration and catalog rebalance.

5. **`waterMode` heuristic for migration.**
   - **Recommendation:** ARCHITECTURE approach using `category === 'suculentas'` plus explicit allowlist for edge cases (aloe, jade).

6. **Tropical zone classification.**
   - **Recommendation:** Add tropical zone from day one in Phase B. Tropical always returns `'warm'`. User-facing copy + Settings → climate-zone override must support it.

7. **Resumed-diagnosis message-count budget.** PITFALLS MOD-5: count per diagnosis lifetime, visible budget. **Adopt as-is.**

8. **Edge-function compatibility window.** Server accepts both legacy and new payloads for one release. Worth focused research on edge-function source (Phase D).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | "No new packages" claim grounded in survey of plausible alternatives |
| Features | HIGH on table-stakes / MEDIUM on LATAM catalog | 4-level light + soil-check confirmed across competitors |
| Architecture | HIGH | Every file path/line number grounded in direct codebase read |
| Pitfalls | HIGH on critical / MEDIUM on a few moderate | All 5 CRIT pitfalls observable directly in code |
| Cold-factor mapping | LOW–MEDIUM | Set explicitly per `PlantDBEntry` during catalog rebalance |
| `lightLevel` thresholds | MEDIUM | Lock one boundary set before Phase A |

**Overall confidence:** HIGH

## Gaps to Address

- **Edge-function source not read.** Resolve in Phase D research.
- **`Plant` type re: copied vs referenced catalog content.** Read full type before locking Phase E lookup pattern.
- **Privacy manifest current state.** Audit `app.json` `privacyManifests` and `PrivacyInfo.xcprivacy` before submission.
- **Test framework absence.** No test runner configured. Migration regressions caught only by hand-run smoke test until test runner added in future milestone.

---
*Research completed: 2026-04-29*
*Ready for roadmap: yes*
