# Roadmap: My Garden Care — V1.1 Diagnosis & Tracking

## Overview

This milestone extends the existing diagnosis chat with camera capture, then builds a premium problem tracking system that persists follow-up schedules, fires push notifications, surfaces tasks on the Hoy screen, and renders a photo timeline per plant. The work is wiring and extending an already-functional codebase — no new dependencies required. Phases flow in strict dependency order: camera ships alone (zero data model impact), then the data model and service layer are solidified before any consumer UI touches them.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Camera in Chat** - Wire camera capture into the diagnosis chat alongside the existing gallery picker (1/1 plans complete)
- [x] **Phase 2: Problem Tracking Core** - Extend data model, build problemTrackingService, schedule notifications, and wire i18n (completed 2026-03-19)
- [ ] **Phase 3: Reminders, Tasks & Plant Detail UI** - Hoy follow-up tasks, notification deep-links, and problem timeline in plant detail

## Phase Details

### Phase 1: Camera in Chat
**Goal**: Users can take a photo with the device camera from inside the diagnosis chat, with the same inline preview experience as gallery picks
**Depends on**: Nothing (first phase)
**Requirements**: CAM-01, CAM-02, CAM-03, CAM-04
**Success Criteria** (what must be TRUE):
  1. User taps the attachment button in diagnosis chat and sees an action sheet with two options: camera and gallery
  2. User selects camera, takes a photo, and it appears as an inline thumbnail preview before sending (identical to gallery flow)
  3. User denies camera permission and sees a contextual explanation with a link that opens device Settings
  4. Camera option respects the existing free-tier message limit — no separate gate is introduced
**Plans:** 1 plan
Plans:
- [x] 01-01-PLAN.md — Action sheet + camera path + permission UI + free-tier button behavior

### Phase 2: Problem Tracking Core
**Goal**: Premium users can create a tracked problem record from a diagnosis, with AI-determined follow-up scheduling, persistent storage, push notifications, and full i18n coverage for all new strings
**Depends on**: Phase 1
**Requirements**: PROB-01, PROB-02, PROB-03, PROB-04, PROB-05, PROB-06, PROB-07, PROB-08, PROB-09, PROB-10, NOTF-01, NOTF-04, I18N-01, I18N-02
**Success Criteria** (what must be TRUE):
  1. After an AI diagnosis, a premium user can tap to create a tracked problem record; free users do not see the option
  2. The problem record is saved with plant ID, summary, severity label (Watch closely / Needs attention / Recovering / Resolved), photo, AI notes, creation date, follow-up date, and status — and persists across app restarts
  3. A push notification is scheduled at the AI-determined follow-up date (severe: 3 days, moderate: 7 days, minor: 14 days); notification ID is persisted so the app never schedules duplicates after restart
  4. User can manually resolve a problem at any time and can reopen a resolved problem
  5. When a follow-up re-diagnosis returns improvement, the app prompts the user to confirm resolution with one tap
  6. Photos captured for follow-up are immediately copied to the persistent document directory — not left in cache — so the timeline does not break after OS cache clears
  7. All new UI strings appear in both English and Argentine Spanish (vos); the diagnosis edge function receives the lang parameter for follow-up descriptions
**Plans:** 3/3 plans complete
Plans:
- [ ] 02-01-PLAN.md — Types, service logic, i18n keys, edge function severity+problemSummary
- [ ] 02-02-PLAN.md — Storage actions, notification scheduling, photo persistence, startTracking orchestrator
- [ ] 02-03-PLAN.md — Track button in DiagnosisResults, resolution card, modal wiring, photo persistence on capture

### Phase 3: Reminders, Tasks & Plant Detail UI
**Goal**: Follow-up reminders reach users through both push notifications and Hoy screen tasks, and the complete problem history is visible in the plant detail screen
**Depends on**: Phase 2
**Requirements**: NOTF-02, NOTF-03, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. On the follow-up date, a "Follow-up due today" task card appears in the Hoy screen for premium users alongside regular care tasks; free users never see the card
  2. Tapping the push notification — whether the app is in foreground, background, or cold-started — navigates the user to the correct plant detail or diagnosis flow
  3. The plant detail screen shows a section for active problems with current status, severity label, last check date, and next follow-up date
  4. The plant detail screen shows a chronological photo timeline of all diagnosis entries (photo, AI notes, date) for each tracked problem
  5. Plant list cards display a status indicator when a plant has at least one active (unresolved) problem
**Plans:** 2/3 plans executed
Plans:
- [ ] 03-01-PLAN.md — Hoy follow-up task cards + PlantCard tracking badge
- [ ] 03-02-PLAN.md — Plant detail active problems section + problem timeline
- [ ] 03-03-PLAN.md — Notification deep-link navigation (tap-to-plant-detail)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Camera in Chat | 1/1 | Complete | 2026-03-19 |
| 2. Problem Tracking Core | 3/3 | Complete   | 2026-03-19 |
| 3. Reminders, Tasks & Plant Detail UI | 2/3 | In Progress|  |
