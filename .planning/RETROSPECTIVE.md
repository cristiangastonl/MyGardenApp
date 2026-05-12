# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Diagnosis & Tracking

**Shipped:** 2026-03-19
**Phases:** 3 | **Plans:** 7 | **Sessions:** 1

### What Was Built
- Camera capture in diagnosis chat (iOS ActionSheetIOS + Android custom Modal)
- Full problem tracking system: types, service, storage, notifications, UI
- AI-determined follow-up scheduling with emoji severity labels (🟠🟡🟢✅)
- Active problems section + photo timeline in plant detail
- Follow-up task cards in Hoy screen (premium)
- Cold-start safe notification deep-link navigation

### What Worked
- Research phase caught critical issues early: cache URI invalidation, notification dedup, async/sync conflict
- Plan checker caught 4 blockers in Phase 2 (wrong font tokens, missing PROB-05 wiring, missing PROB-07 call site, minor severity mapping) — all fixed before execution
- Coarse granularity (3 phases) kept overhead low while still having meaningful boundaries
- Wave 1 parallelization in Phase 3 (plans 03-01 and 03-02 ran simultaneously) saved time
- Extending SavedDiagnosis in-place with optional fields avoided migration complexity

### What Was Inefficient
- Phase 2 required 3 plan checker iterations to reach pass — the planner's initial output had significant gaps
- The `resolvedAnimation` state was declared but the actual Animated rendering was deferred — this creates dead code until Phase 3 polish or next milestone
- No CONTEXT.md for Phase 3 meant the planner had less user intent to work with

### Patterns Established
- Emoji + text severity labels following the app's emoji-throughout convention
- Client-side severity → follow-up days mapping (not AI-returned intervals)
- NotificationContext for lightweight deep-linking without URL schemes
- Synchronous photo persistence (File.copy() to documentDirectory) immediately on capture
- Inline chat cards for AI suggestions (not modals or alerts)

### Key Lessons
1. Plan checker iterations are worth it — 4 blockers caught in Phase 2 would have caused runtime bugs
2. Font token names can't be caught by TypeScript when they're strings — always verify against theme.ts
3. When extending a type with tracking fields, make all new fields optional for backward compat
4. Cold-start notification handling needs a timing guard — navReady AND storageLoaded

### Cost Observations
- Model mix: 100% sonnet for agents, opus for orchestration
- All 3 phases completed in a single session
- Notable: zero new npm packages installed across entire milestone

---

## Milestone: v1.2 — Recommendation-First Plant Guide

**Shipped:** 2026-05-12
**Phases:** 16 | **Plans:** 83 | **Commits:** ~271 | **LOC:** 39,322 src/ TS+TSX | **Timeline:** 10 days (2026-05-02 → 2026-05-12)

### What Was Built
- Locked Perenual API key server-side via new `get-plant-care` Supabase edge function (rotation pending); hardened parsing with `isGoodMatch` validator + dynamic `tempMax` + inferred `humidity`
- 6-section educational `MyPlantDetailModal` (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes + Mascotas + Diario) with 4 collapsible sections, override-detection note, identification picker pre-select, and `PROTECTED_USER_FIELDS` deep-merge guard
- Expanded catalog from 64 to 118 plants across 3 waves (Interior Tropicals 23, Suculentas/Cactus/Trepadoras 17 + 2 EDU upgrades, Exterior/Aromáticas/Frutales 14); identification routing fix (exact-match-first) closed the Dracaena genus collision
- PlantCard 5-element redesign: swipe-to-delete + long-press menu via `Gesture.Pan/LongPress/Race`, always-visible mood emoji (🌱/😊/😐/😟) replacing conditional health badge
- ASPCA-verified pet toxicity on all 118 entries: cat/dog badges + Mascotas modal section + pet-safe catalog filter + onboarding switch; LATAM species honestly flagged `'unknown'`
- Fertilization subsystem: `'fertilize'` task type with 5-site discriminator sweep, season-aware cadence (cold-season null = no emission), opt-in push notifications, 472 distinct EN/ES recipe strings (industrial + homemade) across all 118 entries
- Plant Journal: per-plant `JournalEntry[]` with file-system photo storage (1080px @ 0.7 JPEG, never base64), bottom-sheet quick-add, reverse-chronological timeline, orphan cleanup on plant delete
- Celebration toasts + `NotificationFeedbackType.Success` haptics on task completion; GAM-05 anti-pattern lock enforced at smoke-runner level (no persistent streak counters anywhere)
- UAT + brand voice polish: outdoor task gate, outdoor picker labels, `textSecondary` WCAG AA contrast (#8a7e6b → #6f6450), voseo lint over ES locale, illustrated empty states on 3 screens

### What Worked
- Three-tier smoke runner discipline with STRICT cross-phase regression — caught issues early in autonomous Phase 19+ chain; single `smoke-phase23.cjs` invocation is sufficient pre-submit coverage for Phase 18-22 invariants
- Option B device-test deferral pattern (5 consecutive precedents — Phase 18-05 / 20-10 / 21-06 / 22-03 / 23-04) — kept code velocity high without skipping verification; batched device-test backlog to `v1_2_test_backlog.md` memory for end-of-milestone sweep
- Plan-checker iteration loop (max 3) — caught two real BLOCKING TS-fail bugs in Phase 21 before execution
- Smart-discuss with grey-area proposals — kept the user in control without slowing things down; enabled the 4-phase autonomous chain (21 → 22 → 23 → 24)
- Catalog content authoring discipline (char-limit-from-draft + voseo pre-sweep + zero copy-paste) — scaled cleanly from 64 to 118 entries across 3 waves

### What Was Inefficient
- Several VALIDATION.md files left at `nyquist_compliant: false` flag despite runtime green — planning-time bookkeeping debt
- Plan 21-01 originally bled into Plan 21-03's provider-surface scope (type-system intersection forced the deviation) — caught by plan-checker but cost a revision iteration
- Manual gate plans (Option B path) often duplicated Block A-E content verbatim across phases — could have been a single template

### Patterns Established
- Three-tier smoke runner (PASS scaffold + SKIP→PASS placeholders + STRICT cross-phase regression sentinels forked verbatim from prior phase)
- Voseo lint script over `src/i18n/locales/es/*.json` — token-bound `\btú\b` vs unaccented `\btu\b` distinction
- Option B device-test deferral with hard-fail/soft-fail classifier — defaults to defer when manual-checkpoint structural threshold is met
- ModalSectionId controlled extension (Phase 19 `mascotas` + Phase 21 `diario` extended; Phase 20 deliberately did NOT — used orthogonal `initialExpanded` prop instead)
- Wave 0 Nyquist scaffold pattern (smoke runner + i18n skeleton + component skeletons land before any implementation)

### Key Lessons
1. Cross-phase STRICT regression sentinels are the most valuable runtime safety net — every subsequent phase smoke runner asserts prior-phase invariants verbatim, catching unintentional regressions across the autonomous chain
2. The plan-checker's first-iteration BLOCKING issues are almost always real (TS-fails, missing pre-existing code patterns) — worth the cost
3. Token-bound `\btú\b` vs unaccented `\btu\b` distinction matters for voseo lint — caught early in Phase 23 saved the empty-state copy ("Tu jardín está esperando")
4. Single i18n key skeleton in Wave 0 with all ~22 keys upfront is cheaper than fallback `??` strings in Wave 3

### Cost Observations
- Model mix: predominantly sonnet 4.6 (executors) + opus 4.7 1M (orchestrator)
- Sessions: ~10 over 10 days
- Notable: autonomous chain ran 4 consecutive phases (21 → 22 → 23 → 24) without user intervention beyond grey-area accept-all

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Checker Iterations | Key Pattern |
|-----------|--------|-------|-------------------|-------------|
| v1.0 | 3 | 7 | 5 total (1+3+1) | Research catches bugs early |
| v1.2 | 16 | 83 | Plan-checker loop max-3 (caught 2 real BLOCKING TS-fails in Phase 21) | Three-tier smoke runner + STRICT cross-phase regression + Option B device-test deferral |
