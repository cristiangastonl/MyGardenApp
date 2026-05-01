# Roadmap: My Garden Care

## Milestones

- ✅ **v1.0 Diagnosis & Tracking** — Phases 1-3 (shipped 2026-03-19)
- 🚧 **v1.1 Precision Care** — Phases 4-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 Diagnosis & Tracking (Phases 1-3) — SHIPPED 2026-03-19</summary>

- [x] Phase 1: Camera in Chat (1/1 plans) — completed 2026-03-19
- [x] Phase 2: Problem Tracking Core (3/3 plans) — completed 2026-03-19
- [x] Phase 3: Reminders, Tasks & Plant Detail UI (3/3 plans) — completed 2026-03-19

See: `.planning/milestones/v1.0-ROADMAP.md` for full details

</details>

### 🚧 v1.1 Precision Care (In Progress)

**Milestone Goal:** Replace fixed-value plant care with precision-aware schedules tied to user location, light quality, and seasonal context — and surface diagnosis chat continuity so users can resume conversations instead of staring at frozen summaries.

- [x] **Phase 4: Schema Foundation + Migration Core** — Versioned envelope, runMigrations infrastructure, deterministic mappers, cancel-and-reschedule notifications, post-migration explainer
- [x] **Phase 5: Hemisphere/Season Helpers + Pure-Utility Switchover** — 3-zone seasonality utility, soil-check task type, health/logic/notifications consume new fields (completed 2026-05-01)
- [x] **Phase 6: UI Read-Side Propagation** — Plant cards, detail modals, diagnosis context display lightLevel + seasonal interval + mode badges (completed 2026-05-01)
- [ ] **Phase 7: UI Write-Side + Onboarding + Edge-Function Contract** — 4-card light picker, warm/cold inputs, location prompt + banner + manual override, edge functions accept new payload
- [ ] **Phase 8: Catalog Rebalance** — All 60+ entries gain new fields, 14 LATAM outdoor additions, lavender variety split, lookup-by-id contract, CI guards
- [ ] **Phase 9: Diagnosis Continuity + Paywall Architecture** — Continue button visible to all, "Reabrir consulta" rename, App-level paywall context, message-count per diagnosis lifetime, retroactive premium lift

## Phase Details

### Phase 4: Schema Foundation + Migration Core
**Goal**: User's existing v1.0 data is migrated to the new precision-care schema on first launch, without data loss, and OS-level notifications are rebuilt against the new shape so no stale reminders fire.
**Depends on**: Phase 3 (v1.0 shipped)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08, SCHEMA-09, LIGHT-03, WATER-04, UX-01
**Success Criteria** (what must be TRUE):
  1. A user upgrading from v1.0 with 50 plants opens the app once and finds every plant intact, with `lightLevel` and `waterSchedule {warm, cold}` populated and care behavior unchanged.
  2. If migration is interrupted (app killed mid-launch) the user reopens the app and finds either the migrated payload OR the original payload — never a half-written blob; a backup blob exists at `plant-agenda-v2.backup-pre-v1.1` for one release.
  3. The user sees a one-time in-app message explaining the change ("Cambiamos cómo medimos la luz. Tu Monstera ahora está marcada como Luz brillante indirecta.") on first post-migration launch.
  4. After migration, no scheduled OS notification fires with stale "Xh sol" copy or pre-migration intervals — every reminder reflects the new schema.
  5. Migration completes inside the existing `loadData` window on a low-end Android device with 50 plants — no extra splash, no white screen, no perceptible launch lag.
**Plans**: 7 plans
- [x] 04-01-PLAN.md — Wave 0: Test infrastructure (CI grep guard, smoke runner, fixture, SMOKE-TEST.md) — completed 2026-04-30
- [x] 04-02-PLAN.md — Wave 1: Type system + pure mappers (LightLevel/WaterMode/WaterSchedule + migration.ts) — completed 2026-04-30
- [x] 04-03-PLAN.md — Wave 2: Storage envelope + migration call in useStorage — completed 2026-04-30
- [x] 04-04-PLAN.md — Wave 2: Notification scheduler refactor to consume lightLevel — completed 2026-04-30
- [x] 04-05-PLAN.md — Wave 3: Catalog mechanical update via codemod — completed 2026-04-30
- [x] 04-06-PLAN.md — Wave 3: MigrationBanner + per-plant MigrationTooltip + i18n — completed 2026-04-30
- [ ] 04-07-PLAN.md — Wave 4: App-level reschedule trigger + banner integration

### Phase 5: Hemisphere/Season Helpers + Pure-Utility Switchover
**Goal**: Pure-utility layer (`plantLogic`, `plantHealth`, `notificationScheduler`) consumes `lightLevel` + `waterSchedule` + season — soil-check plants get a new task type, never penalized for "overdue" watering, and three-zone seasonality (Northern temperate / Southern temperate / Tropical) drives every interval calculation.
**Depends on**: Phase 4
**Requirements**: SEASON-01, SEASON-02, SEASON-03, SEASON-04, WATER-05, WATER-06
**Success Criteria** (what must be TRUE):
  1. A user in Buenos Aires (lat -34.6) on April 1 sees their tropical houseplant's interval flip from warm to cold; a user in Singapore (lat 1.35) sees the same houseplant stay on warm year-round; a user in New York (lat 40) sees warm Apr-Sep, cold Oct-Mar.
  2. Tasks shown in "Hoy", scheduled OS notifications, and the plant health score for a given plant on a given day all derive their watering interval from the SAME `(plant.waterSchedule, currentSeason)` lookup — no field disagrees with another.
  3. A user with a cactus in `soil_check` mode on a non-check-in day sees no "regar" task and no health-score penalty for overdue watering; on a check-in day they see a `'check_soil'` task with copy "Tocá la tierra. Si está seca 5cm hacia abajo, regá."
  4. Season transition between months is observable in the data layer (badge-ready) but produces no NaN, no crash, and no >1-cycle jump in next-watering date.
**Plans**: 5 plans (completed 2026-05-01)
- [x] 05-01-PLAN.md — Wave 0: Phase-5 scaffold in migration smoke runner — completed 2026-05-01
- [x] 05-02-PLAN.md — Wave 1: seasonality.ts source + getWaterSeason matrix assertions — completed 2026-05-01
- [x] 05-03-PLAN.md — Wave 2: soil_check task emission in plantLogic + i18n keys — completed 2026-05-01
- [x] 05-04-PLAN.md — Wave 2: plantHealth overdue-water penalty skip for soil_check — completed 2026-05-01
- [x] 05-05-PLAN.md — Wave 3: notificationScheduler season-aware water reminders + task-discriminator audit — completed 2026-05-01

### Phase 6: UI Read-Side Propagation
**Goal**: Every screen that renders plant care today shows the precision-care model — light level translated to the user's locale (with outdoor-context labels for outdoor plants), current-season badge with effective interval, watering-mode badge — so the user never sees stale "Xh sol" copy or wonders why their cactus list is empty.
**Depends on**: Phase 5
**Requirements**: LIGHT-06, LIGHT-07, SEASON-05, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. The user opens any plant card, plant detail modal, or diagnosis context and sees a translated light-level label ("Luz brillante indirecta" / "Bright indirect light") instead of "Xh sol".
  2. Outdoor plants show outdoor-context labels ("Sol pleno" / "Semi sombra") that map to the same 4 buckets as indoor plants.
  3. The plant detail view shows the current effective interval with a season badge ("Cada 5 días — temporada cálida").
  4. Plant cards show a watering-mode badge ("💧 Cada 5d" or "🤚 Por chequeo") so a mixed garden of cacti and houseplants is self-explanatory.
  5. A user with a cactus in `soil_check` mode opening "Hoy" on a non-check-in day sees explicit empty-state copy ("Tu cactus está en modo chequeo. Te avisamos en 12 días.") rather than an empty list.
**Plans**: 6 plans
- [ ] 06-01-PLAN.md — Wave 0: Smoke runner scaffold + export getSeasonalInterval + create lightLabel.ts helper
- [ ] 06-02-PLAN.md — Wave 1: 15 new i18n keys (EN+ES voseo) + extend smoke runner with parity + behavior matrix
- [ ] 06-03-PLAN.md — Wave 2: PlantCard watering-mode badge (UX-02) + PlantHealthDetail label swap (LIGHT-06)
- [ ] 06-04-PLAN.md — Wave 2: MyPlantDetailModal info pills (SEASON-05 season badge + LIGHT-06/07 sun pill)
- [ ] 06-05-PLAN.md — Wave 2: Catalog read-side surfaces — PlantDetailModal + PlantDatabaseCard (LIGHT-06/07)
- [ ] 06-06-PLAN.md — Wave 3: TodayScreen soilCheckSilentPlants per-plant info row + all-caught-up guard (UX-03)

### Phase 7: UI Write-Side + Onboarding + Edge-Function Contract
**Goal**: Every plant-creating and plant-editing surface — onboarding, AddPlantModal, plant identification, diagnosis context — emits the new schema; the user is asked for location at onboarding with a clear skip path; if location is missing the app falls back gracefully and surfaces a non-blocking banner; manual climate-zone override is available in Settings.
**Depends on**: Phase 6
**Requirements**: LIGHT-01, LIGHT-02, LIGHT-05, WATER-01, WATER-02, WATER-03, LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06
**Success Criteria** (what must be TRUE):
  1. A new user creating a plant picks light level via a 4-card visual picker showing icon + level name + real-world placement description ("Junto a ventana sur" / "A 2m de ventana clara") in their locale (en or es-AR with voseo).
  2. The user can edit warm and cold watering intervals separately for fixed-mode plants, or toggle a soil-check plant to fixed mode (no warm/cold inputs visible until toggled).
  3. The user identifying a plant via the camera receives a result with `lightLevel` populated (default `bright_indirect` if PlantNet doesn't supply enough info, user can adjust before saving).
  4. The user is shown a non-blocking location prompt at onboarding with a clear skip option and copy explaining why ("Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima"); skipping does not block onboarding.
  5. If location is missing, "Hoy" shows a soft, dismissible banner ("Agregá tu ubicación para horarios precisos"), the app falls back to warm schedule (never under-waters), and Settings exposes both manual city entry (Open-Meteo geocoding) and a manual climate-zone override (Northern / Southern / Tropical) that wins over derived hemisphere.
**Plans**: 8 plans
- [ ] 07-01-PLAN.md — Wave 0: ClimateOverride type + AppData field + useStorage action + both AppContent destructures + smoke runner scaffold
- [ ] 07-02-PLAN.md — Wave 0: getEffectiveSeason SSOT + getNextWaterDate/getTasksForDay signature change (latitude → season) + 8 call-site migrations + matrix smoke
- [ ] 07-03-PLAN.md — Wave 1: 27 new i18n keys (lightLevelHint + waterSchedule + onboarding.location + settings.climateOverride + today.locationBanner + identification.lightLevelLabel) in EN + ES voseo + parity smoke
- [ ] 07-04-PLAN.md — Wave 1: LightLevelPicker (2×2 grid, locale-aware) + WaterScheduleEditor (segmented mode + dual warm/cold inputs)
- [ ] 07-05-PLAN.md — Wave 2: AddPlantModal swap (LightLevelPicker + WaterScheduleEditor) + OnboardingScreen new location step (3-button: GPS / city / skip) + plantDBToPlant new schema
- [ ] 07-06-PLAN.md — Wave 2: IdentifiedPlant.lightLevel + convertPlantNetResult ladder + IdentificationResults picker integration + onAddPlant signature change
- [ ] 07-07-PLAN.md — Wave 3: SettingsPanel Zona climática 4-option segmented picker + LocationBanner component + TodayScreen integration (per-session dismiss)
- [ ] 07-08-PLAN.md — Wave 4: PlantDiagnosisContext widening + PlantDiagnosisModal v1.1 build + 2 edge functions (diagnose-plant, chat-diagnosis) dual-payload discriminator + ES/EN prompts + manual deploy checkpoint

### Phase 8: Catalog Rebalance
**Goal**: All 60+ existing catalog entries gain expert-vetted `lightLevel`, `waterSchedule {warm, cold}`, and `waterMode` fields; 14 LATAM outdoor plants are added with full new-model fields; lavender is split into three variants with distinct cold tolerance; catalog content is read by lookup, not copied; CI guards every catalog `id` for full keyset in EN + ES and every `imageUrl` resolves to 200.
**Depends on**: Phase 7
**Requirements**: LIGHT-04, WATER-07, CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08
**Success Criteria** (what must be TRUE):
  1. The user browsing the plant catalog finds 14 new outdoor plants (jacarandá, ceibo, glicina, gardenia, camelia, dalia, salvia ornamental, cala, copete, verbena, lavanda francesa, lavanda dentada, romero rastrero, tomate cherry) with full new-model fields, expert-vetted defaults, and translated content in EN and ES.
  2. The user adding a lavender from the catalog sees three distinct variants (angustifolia, stoechas, dentata) with different cold tolerance and care.
  3. A patch update to a catalog `tip` text (e.g., fixing a typo in `monstera.tip`) propagates to existing user plants on next render — content is always read by lookup (`getCatalogEntry(plant.dbId).tip`), never copied to the plant instance.
  4. A user whose plant references a renamed slug (e.g., `tomate` → `tomate-cherry`) does not see a broken plant; alias resolution returns the new entry.
  5. CI fails any build where a catalog `id` is missing keys in `en/plants.json` or `es/plants.json`, or where any `imageUrl` does not return 200 OK — Spanish-only users never see raw `[plants:...]` keys or broken images in production.
**Plans**: TBD

### Phase 9: Diagnosis Continuity + Paywall Architecture
**Goal**: The "Continue chat" button on past diagnoses is visible to all users; free users tapping it see the paywall before chat opens (existing message limits enforced); resolved diagnoses can be reopened with a system-message context summary; the paywall lifts to App-level context so it never stacks behind a nested modal, and a successful purchase invokes a deferred callback so the original gated action proceeds without re-tapping.
**Depends on**: Phase 4 (schema only — independent of Phases 5-8 UI work; can ship as hotfix)
**Requirements**: DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05, DIAG-06, DIAG-07, PAY-01, PAY-02, PAY-03
**Success Criteria** (what must be TRUE):
  1. A free user opens any past diagnosis and sees "Continuar consulta" (or "Reabrir consulta" if resolved); tapping it opens the paywall before the chat opens, not after — the paywall opens cleanly at root, not stacked behind `DiagnosisDetailModal`.
  2. A free user who upgrades inside the paywall is returned to the chat with the message limit lifted retroactively, send button enabled, no second tap required.
  3. A user reopening a resolved diagnosis sees a prepended system message ("Hace N días marcaste esta consulta como resuelta. ¿Qué cambió?") and explicit copy ("Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva.") — the AI does not re-assess severity unless a new photo is uploaded.
  4. A user resuming a diagnosis sees their remaining message count (per-diagnosis-lifetime, not per-session) before they type — at 0 of N, the input is gated by the paywall trigger, not a mid-typing surprise.
  5. A successful purchase from any paywall entry point invokes the deferred callback registered when the paywall opened — the original gated action proceeds without the user re-tapping.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6 → 7 → 8 → 9. Phase 9 is independent of 5-8 and can ship earlier as a hotfix if needed.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Camera in Chat | v1.0 | 1/1 | Complete | 2026-03-19 |
| 2. Problem Tracking Core | v1.0 | 3/3 | Complete | 2026-03-19 |
| 3. Reminders, Tasks & Plant Detail UI | v1.0 | 3/3 | Complete | 2026-03-19 |
| 4. Schema Foundation + Migration Core | v1.1 | 7/7 | Complete | 2026-04-30 |
| 5. Hemisphere/Season Helpers + Pure-Utility Switchover | v1.1 | 5/5 | Complete | 2026-05-01 |
| 6. UI Read-Side Propagation | 6/6 | Complete   | 2026-05-01 | - |
| 7. UI Write-Side + Onboarding + Edge-Function Contract | 7/8 | In Progress|  | - |
| 8. Catalog Rebalance | v1.1 | 0/TBD | Not started | - |
| 9. Diagnosis Continuity + Paywall Architecture | v1.1 | 0/TBD | Not started | - |
