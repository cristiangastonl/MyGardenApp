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

## Cross-Milestone Trends

| Milestone | Phases | Plans | Checker Iterations | Key Pattern |
|-----------|--------|-------|-------------------|-------------|
| v1.0 | 3 | 7 | 5 total (1+3+1) | Research catches bugs early |
