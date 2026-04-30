---
phase: 04-schema-foundation-migration-core
verified: 2026-04-29T00:00:00Z
status: human_needed
score: 5/8 must-haves verified automatically; 3/8 require hand-run on real device
re_verification: false
human_verification:
  - test: "v1.0 user with 50 plants opens v1.1, all plants intact with new fields, care behavior unchanged"
    expected: "App boots cold; no white flash; 50 plants visible in Hoy/Plantas; tap a plant → MyPlantDetailModal renders correctly with lightLevel + waterSchedule data; care actions (water/sun/outdoor) behave as in v1.0; analytics dashboard shows migration_started + migration_completed with plantCount=50"
    why_human: "Requires real device + 50-plant fixture + cold launch + visual smoke. Code path is verified (migration.ts + useStorage.tsx + plantDatabase.ts) but the perceptual no-flash + behavior-unchanged assertion needs human eyes."
    refs: "SCHEMA-01, SCHEMA-04, SMOKE-TEST.md Scenario 1"
  - test: "App killed mid-migration → either fully migrated or original payload, never partial; backup blob exists"
    expected: "After force-quit during loadData, reopening shows EITHER fully migrated state OR legacy banner with original v1.0 data intact. AsyncStorage key plant-agenda-v2.backup-pre-v1.1 contains the byte-exact pre-migration blob."
    why_human: "Requires manual force-quit during the <200ms migration window — cannot be reproduced from code inspection alone. Backup-then-write sequence is verified in code (useStorage.tsx:204 setItem(BACKUP_KEY) BEFORE runMigrations on line 207), but the kill-during-write race needs device confirmation."
    refs: "SCHEMA-02, SCHEMA-07, SMOKE-TEST.md Scenario 2"
  - test: "Migration completes <200ms inside loadData on low-end Android with 50 plants"
    expected: "On Pixel 3a-class device, migration_completed.durationMs payload < 200; no perceptible launch lag vs v1.0 build."
    why_human: "Performance budget is hardware-dependent. 7-plant smoke test passes; 50-plant low-end-device profiling is the contracted gate (SMOKE-TEST.md Performance Gate)."
    refs: "SCHEMA-04, SMOKE-TEST.md Performance Gate"
---

# Phase 4: Schema Foundation + Migration Core — Verification Report

**Phase Goal:** User's existing v1.0 data is migrated to the new precision-care schema on first launch, without data loss, and OS-level notifications are rebuilt against the new shape so no stale reminders fire.

**Verified:** 2026-04-29
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | v1.0 user with 50 plants opens v1.1, all plants intact with new fields, care behavior unchanged | ⚠️ HUMAN_NEEDED | All code paths verified (see 5/6/7 below). 50-plant cold-launch on device required. |
| 2 | App killed mid-migration → either fully migrated or original payload, never partial; backup blob exists | ⚠️ HUMAN_NEEDED | Backup-then-write sequence verified in code (useStorage.tsx L204→L207→L210). Force-quit race needs device test. |
| 3 | Mini-tooltip per plant appears once on first MyPlantDetailModal open after migration, never after dismissal | ✓ VERIFIED | MigrationTooltip uses AsyncStorage `migration-tooltip-seen-v1.1` keyed map; rendered conditionally on `plant._migratedFromV0 && visible` at MyPlantDetailModal.tsx:242 |
| 4 | Zero scheduled OS notifications fire with stale sunHours-derived data; reschedule rebuilds against lightLevel | ✓ VERIFIED | notificationScheduler.calculateSunWindow / groupPlantsByLightLevel consume `plant.lightLevel`; App.tsx:171 calls cancelAllNotifications then scheduleMorningReminder when migrationJustHappened flips |
| 5 | Migration completes <200ms inside loadData on low-end Android with 50 plants | ⚠️ HUMAN_NEEDED | Synchronous migration runs inside existing loadData useEffect; 7-plant smoke completes instantly. 50-plant low-end-device profiling required. |
| 6 | CI grep guard exits non-zero on new code reading plant.sunHours / plant.waterEvery | ✓ VERIFIED | `npm run check:legacy-fields` exits 0 today; ALLOWLIST of 27 transitional readers in scripts/check-no-legacy-reads.js; new offending reads outside allowlist return exit 1 |
| 7 | Analytics: migration_started, migration_completed (with plantCount, durationMs), migration_failed (with error, stage) emitted appropriately | ✓ VERIFIED | useStorage.tsx L196 (started), L215 (completed with plantCount/durationMs/schemaVersionFrom/To), L246 (failed with stage:'load'), App.tsx L179 (failed with stage:'reschedule') |
| 8 | Failure path: banner shows above MainTabs, AsyncStorage live key untouched, app continues working with legacy reads | ✓ VERIFIED | App.tsx L213 renders `<MigrationBanner>` when migrationFailed && !bannerDismissed (sibling to NavigationContainer, NOT Modal); useStorage.tsx L224-242 catches throw BEFORE any setItem on STORAGE_KEY; legacy fallback parse at L232-241 |

**Score:** 5/8 truths automatically verified; 3/8 flagged for human verification (no truths failed automated checks)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/migration.ts` | Mappers (sunHoursToLightLevel, applyColdFactor, inferWaterMode), envelope helpers (isVersioned, toPersisted), runMigrations, BACKUP_KEY, CURRENT_SCHEMA_VERSION | ✓ VERIFIED | 232 lines; all exports present and idempotent; thresholds locked per CONTEXT.md |
| `src/types/index.ts` LightLevel/WaterMode/WaterSchedule/PersistedAppData | New v1.1 types exported | ✓ VERIFIED | Lines 21, 27, 33, 133; Plant type adds optional lightLevel/waterSchedule/waterMode/_migratedFromV0; legacy sunHours/waterEvery marked optional (@deprecated) |
| `src/hooks/useStorage.tsx` envelope detection + backup-then-write | Migration runs in loadData; backup BEFORE write; envelope on save | ✓ VERIFIED | L186 parse, L189 envelope short-circuit, L196 trackEvent('migration_started'), L204 BACKUP setItem, L207 runMigrations, L210 envelope setItem, L215 completed event; envelope wrapping on save path L151+L324 |
| `src/utils/notificationScheduler.ts` lightLevel-aware | calculateSunWindow + groupPlantsByLightLevel consume Plant.lightLevel | ✓ VERIFIED | groupPlantsByLightLevel at L566; calculateSunWindow at L544 reads `plant.lightLevel` via lightLevelToSunHours; `cancelAllNotifications` exported at L358; defensive sunHours fallback only in isSensitiveToSun for safety |
| `src/components/MigrationBanner.tsx` | Non-modal in-place banner | ✓ VERIFIED | Plain `<View>` (NOT Modal); reads i18n `migration.banner.{title,body,dismiss}`; warning palette from theme.ts |
| `src/components/MigrationTooltip.tsx` | Per-plant first-open overlay | ✓ VERIFIED | Pressable-backdrop overlay (NOT Modal); persists to AsyncStorage `migration-tooltip-seen-v1.1` keyed by plantId; reads i18n `migration.tooltip.{body,cta}` |
| `src/data/plantDatabase.ts` every entry has new fields | All 50 catalog entries populated | ✓ VERIFIED | Programmatic count: 50/50 entries have all three (lightLevel, waterSchedule, waterMode); same mappers used for user data via scripts/migrate-catalog.mjs |
| `App.tsx` banner + reschedule wired | MigrationBanner rendered + post-migration reschedule effect | ✓ VERIFIED | L213 banner render (sibling to NavigationContainer); L164-197 useEffect reschedules morning reminder when migrationJustHappened; reschedule failure emits `migration_failed` with stage:'reschedule' |
| `scripts/check-no-legacy-reads.js` | CI grep guard | ✓ VERIFIED | ALLOWLIST of 27 transitional files; exits 0 today; v1.2 target = 0 |
| `scripts/migration-smoke-test.mjs` | Idempotency + edge-case coverage | ✓ VERIFIED | 63/63 PASS; covers no-sunHours plant, suculenta, aloe synonym, idempotency, byte-identical second run |
| `scripts/migrate-catalog.mjs` | Single-use codemod for catalog using same mappers | ✓ VERIFIED | Uses typescript.transpileModule on src/utils/migration.ts (same source-of-truth mappers); idempotent skip on existing v1.1 fields |
| `tests/fixtures/v0-app-data.json` | v0 fixture with edge cases | ✓ VERIFIED | 7 plants; includes plant w/o sunHours, suculentas, aloe synonym, multiple categories |
| `.planning/phases/04-.../SMOKE-TEST.md` | Hand-test protocol | ✓ VERIFIED | Pre-flight + 5 scenarios + performance gate + iOS/Android sign-off |

**Score:** 13/13 artifacts present and pass Levels 1-3 (exists, substantive, wired)

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `useStorage.tsx` | `migration.ts` | imports runMigrations, toPersisted, isVersioned, BACKUP_KEY, CURRENT_SCHEMA_VERSION | ✓ WIRED | useStorage.tsx L1-15 imports, L189-220 invocations |
| `useStorage.tsx` | `analyticsService.trackEvent` | trackEvent('migration_started/completed/failed') | ✓ WIRED | 3 emissions: started L196, completed L215, failed L246 |
| `App.tsx` | `useStorage().migrationFailed` | conditional render | ✓ WIRED | L121 destructure, L213 conditional `<MigrationBanner>` |
| `App.tsx` | `useStorage().migrationJustHappened` | useEffect → reschedule | ✓ WIRED | L122 destructure, L164-192 effect, L188 acknowledgeMigrationReschedule clear |
| `App.tsx` | `notificationScheduler.cancelAllNotifications + scheduleMorningReminder` | imports + calls in reschedule effect | ✓ WIRED | L171 cancel, L173 scheduleMorningReminder |
| `MyPlantDetailModal.tsx` | `MigrationTooltip` | conditional render on `plant._migratedFromV0` | ✓ WIRED | L22 import, L242 `{plant._migratedFromV0 && visible ? <MigrationTooltip plantId={plant.id}/> : null}` |
| `migration.ts.migratePlant_0to1` | `Plant._migratedFromV0` flag | sets `_migratedFromV0: true` on every migrated plant | ✓ WIRED | migration.ts L158 |
| `scripts/migrate-catalog.mjs` | `migration.ts` mappers | typescript.transpileModule + import | ✓ WIRED | Single source-of-truth — user data + catalog migration use same functions |
| `notificationScheduler.calculateSunWindow` | `plant.lightLevel` | derives sun-window from lightLevel band, returns null for non-direct | ✓ WIRED | L544-562; lightLevelToSunHours at L527 |
| Save path envelope wrapping | `PersistedAppData` envelope on disk | `JSON.stringify({ schemaVersion, data })` on every setItem | ✓ WIRED | useStorage.tsx L151 (debounced), L324 (unmount flush), L210-213 (post-migration) |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SCHEMA-01 | 04-03 | User's existing plant data migrates automatically on first launch of v1.1 without data loss | ✓ SATISFIED | Migration runs inside loadData (useStorage.tsx L165-242) before setState; idempotency guard at migration.ts L135 |
| SCHEMA-02 | 04-03 | Migration writes one-time backup blob before mutating live data | ✓ SATISFIED | useStorage.tsx L204 `setItem(BACKUP_KEY, stored)` precedes L207 runMigrations and L210 STORAGE_KEY write |
| SCHEMA-03 | 04-02 | Migration is idempotent — re-running on already-migrated data is a no-op | ✓ SATISFIED | Envelope short-circuit at useStorage.tsx L189 (`schemaVersion >= CURRENT_SCHEMA_VERSION`) + per-plant guard at migration.ts L135; smoke test asserts byte-identical second run |
| SCHEMA-04 | 04-03 | <200ms with 50 plants on low-end Android | ⚠️ HUMAN_NEEDED | Synchronous transform; 7-plant smoke test instant; 50-plant on Pixel 3a-class device required (SMOKE-TEST.md Performance Gate) |
| SCHEMA-05 | 04-03 | Analytics: migration_started/completed/failed with payload | ✓ SATISFIED | All 3 events emitted with full payload; B2 simplified contract (single 'load' stage for pre-write failures) |
| SCHEMA-06 | 04-04, 04-07 | Migration cancels and reschedules OS notifications against new schema | ✓ SATISFIED | notificationScheduler refactored to lightLevel; App.tsx L164-192 cancels + reschedules morning reminder on migrationJustHappened. Sun reminders re-scheduled by TodayScreen's existing useNotifications hook (weather-gated; correct flow per CONTEXT.md). |
| SCHEMA-07 | 04-03, 04-06, 04-07 | If migration throws, banner shows; AsyncStorage NOT overwritten; app continues with legacy reads | ✓ SATISFIED | useStorage.tsx L224-252 catches all pre-write throws; setMigrationFailed(true); legacy fallback parse at L232-241; App.tsx L213 renders banner |
| SCHEMA-08 | 04-01, 04-02, 04-04 | Legacy fields @deprecated optional; CI grep guard rejects new reads | ✓ SATISFIED | sunHours/waterEvery marked optional in types/index.ts L48-50; check-no-legacy-reads.js with 27-entry ALLOWLIST exits 0 today, exits 1 on new outside-allowlist reads |
| SCHEMA-09 | 04-02 | Versioned envelope `{ schemaVersion, data }`; storage key unchanged | ✓ SATISFIED | PersistedAppData type at types/index.ts L133; envelope written by all save paths (useStorage L151, L210, L324); STORAGE_KEY remains 'plant-agenda-v2' |
| LIGHT-03 | 04-02, 04-05 | Auto-map sunHours → lightLevel with locked thresholds (≥5h direct, ≥3h bright_indirect, ≥2h medium_indirect, <2h low) | ✓ SATISFIED | sunHoursToLightLevel(h) at migration.ts L57-62; smoke test asserts each band; SAME function used by scripts/migrate-catalog.mjs |
| WATER-04 | 04-02, 04-05 | Migrate waterEvery → warm; cold computed via per-category factor (clamped [1,30]) | ✓ SATISFIED | applyColdFactor at migration.ts L69-81 with locked factors {suculentas:2.0, interior:1.5, exterior:1.7, aromaticas:1.5, huerta:1.3, frutales:1.5}; clamp at L80; SAME function used by catalog codemod |
| UX-01 | 04-06 | First launch after upgrade shows one-time in-app message explaining the change | ✓ SATISFIED | MigrationTooltip per-plant on first MyPlantDetailModal open after migration; persists dismissal to AsyncStorage `migration-tooltip-seen-v1.1`; copy is generic per CONTEXT.md decision (rejected per-plant diff) |

**No orphaned requirements** — REQUIREMENTS.md maps SCHEMA-01..09, LIGHT-03, WATER-04, UX-01 to Phase 4 and every ID is claimed by at least one of the 7 plans.

---

### Anti-Patterns Found

None at blocker severity.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/utils/migration.ts` | 18-20 | TODO(v1.2): cleanupBackup_v1_1 helper deletion | ℹ️ Info | Intentional — paired with backup retention contract; v1.2 cleanup task |
| `scripts/check-no-legacy-reads.js` | (header) | TODO Phase 5-7 to drain ALLOWLIST | ℹ️ Info | Intentional transitional state; v1.2 target = 0 entries |

No FIXME/HACK/PLACEHOLDER patterns. No empty `return null` / `return {}` stubs. No `console.log`-only handlers. No silent error swallowing in migration path (errors trigger `migration_failed` analytics + banner per CONTEXT.md). MigrationBanner and MigrationTooltip are non-modal as required.

---

### Automated Gates

| Command | Expected | Actual |
|---------|----------|--------|
| `npm run typecheck` | exit 0 | ✓ exit 0 |
| `npm run smoke:migration` | exit 0; all assertions PASS | ✓ exit 0; 63/63 PASS |
| `npm run check:legacy-fields` | exit 0 (no new offending reads) | ✓ exit 0; "No new legacy-field reads outside allowlist" |

---

### Plan Completion

All 7 plans have both PLAN.md and SUMMARY.md present:

- 04-01 (Wave 0 — testing scaffolding) ✓
- 04-02 (Wave 1 — migration core + types) ✓
- 04-03 (Wave 2 — useStorage envelope + analytics) ✓
- 04-04 (Wave 2 — notificationScheduler refactor) ✓
- 04-05 (Wave 3 — catalog rebalance) ✓
- 04-06 (Wave 3 — banner + tooltip components) ✓
- 04-07 (Wave 4 — App.tsx wiring) ✓

---

### Human Verification Required

#### 1. Happy-path migration on real device with 50 plants

**Test:** Install last v1.0 build on Pixel 3a-class Android (or comparable iPhone), populate 50 plants (sideload tests/fixtures/v0-app-data.json scaled OR populate manually), OTA-upgrade to v1.1, cold-launch.

**Expected:** App opens directly to Hoy/Plantas; all 50 plants visible with v1.1-shaped data underlying; no white flash; no error banner; opening any plant shows MigrationTooltip ONCE; analytics dashboard shows `migration_started`+`migration_completed` with `plantCount: 50` and `durationMs < 200`.

**Why human:** Hardware-dependent perf budget + perceptual no-flash + multi-step interaction (see SMOKE-TEST.md Scenario 1).

**Refs:** SCHEMA-01, SCHEMA-04, SCHEMA-05, UX-01

#### 2. Force-quit during migration

**Test:** With v1.0 fixture data populated, cold-launch v1.1 build and force-kill from recent-apps within 1 second of launch (before splash dismisses). Cold-launch again. Inspect AsyncStorage via dev console.

**Expected:** App opens normally — either fully migrated OR shows legacy banner with v1.0 data intact. Backup key `plant-agenda-v2.backup-pre-v1.1` contains the byte-exact pre-migration blob.

**Why human:** Race window is <200ms. Code path verified — `setItem(BACKUP_KEY, stored)` precedes any `setItem(STORAGE_KEY, ...)` writes — but the kill-during-write empirical assertion needs device confirmation.

**Refs:** SCHEMA-02, SCHEMA-07, SMOKE-TEST.md Scenario 2

#### 3. Performance gate

**Test:** On Pixel 3a-class device with 50-plant fixture, capture `migration_completed.durationMs` from analytics or `__DEV__` console.

**Expected:** durationMs < 200; no perceptible launch lag vs v1.0 build.

**Why human:** Hardware-dependent. Synchronous migration design + 7-plant instant smoke result indicate budget is plausible; only device profiling can confirm.

**Refs:** SCHEMA-04, SMOKE-TEST.md Performance Gate

(Additional manual scenarios from SMOKE-TEST.md — idempotency on second launch, notification reschedule data inspection, forced FORCE_MIGRATION_FAIL banner — also fall under the same human verification umbrella but their underlying code paths are all verified.)

---

### Gaps Summary

No code-level gaps were found. All 13 artifacts exist, are substantive, and are wired. All 12 requirement IDs are satisfied or in human-needed mode. All 3 automated gates exit 0. The phase ships a complete, idempotent migration with a versioned envelope, backup-before-write, lightLevel-aware notification reschedule, generic per-plant tooltip, and graceful failure path with non-modal banner.

The remaining work is purely the device-bound smoke pass documented in SMOKE-TEST.md — three scenarios that require real hardware (50-plant cold launch, kill-during-migration race, low-end Android perf profile). These are inherent to the goal ("on first launch of v1.1") and cannot be exercised without a physical pre-v1.1 install upgrade.

**Recommendation:** Run SMOKE-TEST.md scenarios on iOS + low-end Android. If all five scenarios + performance gate pass on device, flip status to `passed`.

---

*Verified: 2026-04-29*
*Verifier: Claude (gsd-verifier)*
