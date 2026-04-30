# Requirements: My Garden Care — v1.1 Precision Care

**Defined:** 2026-04-29
**Core Value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.
**Milestone Goal:** Replace fixed-value plant care with precision-aware schedules tied to user location, light quality, and seasonal context — and surface diagnosis chat continuity so users can resume conversations instead of staring at frozen summaries.

## v1.1 Requirements

### Schema Migration (SCHEMA)

- [ ] **SCHEMA-01**: User's existing plant data migrates automatically on first launch of v1.1 without data loss
- [ ] **SCHEMA-02**: Migration writes a one-time backup blob (`plant-agenda-v2.backup-pre-v1.1`) before mutating live data, kept for one release as rollback safety net
- [ ] **SCHEMA-03**: Migration is idempotent — re-running on already-migrated data is a no-op
- [ ] **SCHEMA-04**: Migration completes in <200ms on a low-end Android device with 50 plants (synchronous inside existing `loadData` window — no extra splash)
- [ ] **SCHEMA-05**: Migration emits analytics events (`migration_started`, `migration_completed`, `migration_failed`) with plant count and duration
- [ ] **SCHEMA-06**: Migration cancels and reschedules all OS-level notifications so they fire against the new schema, not the old one
- [ ] **SCHEMA-07**: If migration throws, the app surfaces a non-blocking banner ("Tu jardín está cargando con datos antiguos") and does NOT overwrite AsyncStorage — original data preserved
- [ ] **SCHEMA-08**: Legacy fields `sunHours` and `waterEvery` remain on `Plant` type as `@deprecated` optional for v1.1 only; CI grep guard rejects new code that reads them
- [ ] **SCHEMA-09**: Storage payload uses versioned envelope `{ schemaVersion, data }`; storage key remains `'plant-agenda-v2'`

### Light Model (LIGHT)

- [ ] **LIGHT-01**: User can set a plant's light level via a 4-card picker showing icon + level name + real-world placement description ("Junto a ventana sur" / "A 2m de ventana clara" / "Pasillo sin sol directo")
- [ ] **LIGHT-02**: Light levels are `direct`, `bright_indirect`, `medium_indirect`, `low` — translated to user locale (en + es-AR with voseo)
- [ ] **LIGHT-03**: Existing user plants are auto-mapped from `sunHours` to `lightLevel` deterministically (≥5h direct, ≥3h bright_indirect, ≥2h medium_indirect, <2h low)
- [ ] **LIGHT-04**: Plant catalog (60+ entries) is updated with `lightLevel` using same deterministic mapper; horticultural review pass corrects edge cases (orquídea, calathea, etc.)
- [ ] **LIGHT-05**: Plant identification flow returns plants with `lightLevel` populated (default `bright_indirect` if PlantNet doesn't supply enough info, user can adjust)
- [ ] **LIGHT-06**: All plant cards, detail modals, and diagnosis context display `lightLevel` translated label instead of `${sunHours}h sol`
- [ ] **LIGHT-07**: Outdoor plants show `lightLevel` with outdoor-context labels ("Sol pleno" / "Sol parcial" / "Semi sombra" / "Sombra") that map to the same 4 buckets

### Watering Model (WATER)

- [ ] **WATER-01**: Each plant has `waterSchedule: { warm: number, cold: number }` replacing `waterEvery: number`
- [ ] **WATER-02**: Each plant has `waterMode: 'fixed' | 'soil_check'`; cacti, succulents, echeveria, haworthia, sedum, aloe, jade default to `soil_check`
- [ ] **WATER-03**: User can edit warm/cold intervals separately in plant edit form; `soil_check` plants show no interval inputs but a toggle to switch to `fixed` mode
- [ ] **WATER-04**: Existing plants migrate `waterEvery` → `warm`; `cold` is computed by per-category factor (suculentas 2.0, interior 1.5, exterior 1.7, aromaticas 1.5, huerta 1.3, frutales 1.5)
- [ ] **WATER-05**: `soil_check` plants generate a new `'check_soil'` task type instead of `'water'` — copy reads "Tocá la tierra. Si está seca 5cm hacia abajo, regá."
- [ ] **WATER-06**: `soil_check` plants do NOT incur health-score penalty for "overdue watering"
- [ ] **WATER-07**: Catalog rebalance phase replaces `applyColdFactor` heuristic values with explicit per-`PlantDBEntry` warm/cold defaults from the watering-ratio reference table

### Seasonality (SEASON)

- [ ] **SEASON-01**: A new `getSeason(latitude, date)` utility returns `'warm' | 'cold' | 'tropical'` — three zones, not two
- [ ] **SEASON-02**: Tropical zone (~lat between 23.5°S and 23.5°N) always uses `warm` schedule (no flip)
- [ ] **SEASON-03**: Northern temperate uses warm Apr-Sep, cold Oct-Mar; Southern temperate uses warm Oct-Mar, cold Apr-Sep — month boundaries, not equinox
- [ ] **SEASON-04**: Health calculation, task generation, and notification scheduler all derive watering interval from `(plant.waterSchedule, currentSeason)` consistently
- [ ] **SEASON-05**: Plant detail view shows current season badge ("Cada 5 días — temporada cálida")

### Location Precision (LOC)

- [ ] **LOC-01**: Onboarding includes a non-blocking location prompt step with a clear skip option
- [ ] **LOC-02**: If location is missing, "Hoy" tab shows a soft banner ("Agregá tu ubicación para horarios precisos") with CTA to settings location picker — banner is dismissible per session
- [ ] **LOC-03**: When location is missing, the app falls back to `warm` schedule (never under-waters by default)
- [ ] **LOC-04**: Location fallback chain: GPS → manual city via Open-Meteo geocoding → locale-based default (es-AR → Southern, en-US/en-GB → Northern)
- [ ] **LOC-05**: Settings includes a manual climate-zone override (Northern temperate / Southern temperate / Tropical) that wins over derived hemisphere
- [ ] **LOC-06**: Location prompt copy explains why it's needed ("Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima")

### Diagnosis Continuity (DIAG)

- [ ] **DIAG-01**: "Continue chat" button on `DiagnosisDetailModal` is visible to all users regardless of premium status (`isPremium &&` gate removed from render)
- [ ] **DIAG-02**: Free users tapping "Continue chat" see the paywall before chat opens; existing paywall message-count limits remain enforced
- [ ] **DIAG-03**: Resolved diagnoses show "Reabrir consulta" instead of "Continuar consulta"; reopened chats prepend a system message ("Hace N días marcaste esta consulta como resuelta. ¿Qué cambió?")
- [ ] **DIAG-04**: Resumed conversations are text-only by design; UI shows explicit copy ("Continuando diagnóstico anterior. Para reevaluación visual, sacá una foto nueva.")
- [ ] **DIAG-05**: Resume system prompt includes prior assessment summary so AI doesn't re-assess severity unless new photo is uploaded
- [ ] **DIAG-06**: Message-count limit on resume is per-diagnosis-lifetime, not per-session; remaining count is visible to user before they type
- [ ] **DIAG-07**: Premium upgrade lifts the message limit retroactively (no re-tap required)

### Paywall Architecture (PAY)

- [ ] **PAY-01**: Paywall presentation lifts to App-level context (mirrors existing NotificationContext pattern); single render at root level
- [ ] **PAY-02**: Any nested modal that triggers paywall closes itself first, then the App-level paywall opens (no stacking)
- [ ] **PAY-03**: Successful purchase invokes a deferred callback (registered when paywall opened) so the original gated action proceeds without the user re-tapping

### Catalog Rebalance (CAT)

- [ ] **CAT-01**: All 60+ existing `PLANT_DATABASE` entries gain `lightLevel`, `waterSchedule: { warm, cold }`, and `waterMode` fields populated by the same deterministic mapper used for user migration
- [ ] **CAT-02**: 10-15 new outdoor plants are added with full new-model fields: jacarandá, ceibo, glicina, gardenia, camelia, dalia, salvia ornamental, cala, copete (Tagetes), verbena, lavanda francesa, lavanda dentada, romero rastrero, tomate cherry
- [ ] **CAT-03**: Existing lavanda entry is split into angustifolia, stoechas, dentata variants with distinct cold-tolerance and care
- [ ] **CAT-04**: Plant catalog `tip`, `description`, `problems`, and `nutrients` are always read by lookup (`getCatalogEntry(plant.dbId).tip`), never copied to plant instance
- [ ] **CAT-05**: Catalog entries support `_aliases: string[]` so renamed slugs don't orphan user references
- [ ] **CAT-06**: CI build-time check verifies every catalog `id` has a complete keyset in both `en/plants.json` and `es/plants.json`
- [ ] **CAT-07**: Pre-submit check verifies every catalog `imageUrl` returns 200 OK
- [ ] **CAT-08**: Horticultural audit pass replaces auto-mapped `lightLevel` and `cold` values with expert-vetted defaults per category (FEATURES.md watering-ratio table)

### User-facing Migration (UX)

- [ ] **UX-01**: First launch after upgrade shows a one-time in-app message explaining the change ("Cambiamos cómo medimos la luz. Tu Monstera ahora está marcada como Luz brillante indirecta.")
- [ ] **UX-02**: Plant cards show a watering-mode badge ("💧 Cada 5d" or "🤚 Por chequeo") so users understand their list shape
- [ ] **UX-03**: Soil-check plants on non-check-in days display empty-state copy ("Tu cactus está en modo chequeo. Te avisamos en 12 días.")

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Sensors & Hardware

- **SENS-01**: Soil moisture sensor integration
- **SENS-02**: Smart-pot connectivity

### Advanced Precision

- **ADV-01**: Per-month (12-bucket) watering schedule
- **ADV-02**: Auto-rescheduling watering based on weather forecast
- **ADV-03**: Auto-detect light from room photo via Vision API
- **ADV-04**: PPFD/DLI numeric readouts for advanced users

### Diagnosis Resume Vision

- **DIAG-V01**: Re-upload photo within resumed chat to update visual context (currently text-only on resume)

## Out of Scope

Explicitly excluded.

| Feature | Reason |
|---------|--------|
| Lux/light-meter via phone camera | Phone sensors measure illuminance for human eyes (lux), not PPFD/PAR for photosynthesis. Documented accuracy issues across competitors |
| 5-level or 6-level light system | Adds cognitive load with no signal gain; market converged on 4 |
| Per-plant user-configurable seasonal ratio | Most users don't want to answer "what's my warm-to-cold ratio" — catalog defaults sufficient |
| Multi-pot tracking (one plant in multiple pots) | Adds entire entity layer for marginal benefit |
| Hard-cut deletion of legacy `sunHours`/`waterEvery` in v1.1 | Rollback safety net needed for one release; deletion deferred to v1.2 with grep guard from day one |
| New auth or cloud sync | Out of milestone scope; deferred to dedicated auth milestone |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (To be populated by roadmapper) | | |

**Coverage:**
- v1.1 requirements: 47 total
- Mapped to phases: TBD by roadmapper
- Unmapped: TBD

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 after research synthesis*
