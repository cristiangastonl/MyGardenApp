# Requirements: My Garden Care — V1.1 Diagnosis & Tracking

**Defined:** 2026-03-19
**Core Value:** Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Camera in Chat

- [x] **CAM-01**: User can take a photo with the device camera directly from the diagnosis chat
- [x] **CAM-02**: User sees an action sheet (camera vs gallery) when tapping the attachment button in diagnosis chat
- [x] **CAM-03**: Camera permission denial shows a contextual explanation and links to device Settings
- [x] **CAM-04**: Photo taken from camera shows as inline thumbnail preview before sending (same as gallery photos)

### Problem Tracking

- [ ] **PROB-01**: When AI diagnoses a problem, user can create a tracked problem record for that plant (premium only)
- [x] **PROB-02**: Problem record stores: plant ID, problem summary, severity label, photo URI, AI notes, creation date, follow-up date, status
- [x] **PROB-03**: AI determines follow-up frequency based on problem severity (e.g., fungus=3 days, yellowing=7 days)
- [x] **PROB-04**: User can manually resolve/close a tracked problem at any time
- [ ] **PROB-05**: When a follow-up diagnosis shows improvement, AI suggests resolution and user confirms with one tap
- [x] **PROB-06**: User can reopen a previously resolved problem
- [x] **PROB-07**: Each follow-up adds an entry to the problem record (photo, AI notes, date, status change)
- [ ] **PROB-08**: Follow-up re-diagnosis opens a new chat session (not same thread)
- [x] **PROB-09**: Problem uses descriptive severity labels (Watch closely / Needs attention / Recovering / Resolved) not numeric scores
- [x] **PROB-10**: Photos are copied from cache to persistent document directory immediately after capture (prevents URI invalidation)

### Notifications & Reminders

- [x] **NOTF-01**: Push notification sent at AI-determined follow-up date reminding user to check on the plant (premium only)
- [ ] **NOTF-02**: Follow-up task appears in "Hoy" screen on the follow-up date (premium only)
- [ ] **NOTF-03**: Tapping the push notification navigates to the plant's detail or diagnosis flow
- [x] **NOTF-04**: Notification IDs are persisted so they survive app restart without duplication

### Plant Detail UI

- [ ] **UI-01**: Active problems shown as a section/card in the plant detail screen
- [ ] **UI-02**: Problem timeline shows chronological photo history with AI notes per entry
- [ ] **UI-03**: Status indicator (dot or badge) on plant card in plant list when plant has active problem
- [ ] **UI-04**: Problem card shows current status, severity label, last check date, and next follow-up date

### Internationalization

- [x] **I18N-01**: All new UI strings use `t('key')` with translations in both EN and ES (Argentine Spanish with vos)
- [x] **I18N-02**: AI diagnosis edge function receives `lang` parameter for follow-up interval descriptions

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Enhanced Diagnosis

- **DIAG-01**: Re-diagnosis continues in the same chat thread with prior context (requires cloud sync)
- **DIAG-02**: Fully automatic problem resolution without user confirmation (requires confidence threshold tuning)
- **DIAG-03**: Intermediate severity labels (mild / moderate / severe) with color-coded progress tracking

### Data Sync

- **SYNC-01**: Problem tracking records sync to Supabase when cloud sync is enabled
- **SYNC-02**: Photo URIs migrate from local paths to cloud URLs via imageService

## Out of Scope

| Feature | Reason |
|---------|--------|
| User-configurable follow-up interval | Contradicts core value prop (AI decides); adds UI complexity |
| Numeric severity scores | Creates anxiety in consumer gardening context; use descriptive labels instead |
| Photo crop/edit before sending | Adds friction to diagnosis flow; AI works fine with raw captures |
| Social sharing of problem timeline | Requires moderation infrastructure; separate feature vector |
| Offline diagnosis | Requires on-device model; not viable in current stack |
| Multiple parallel chat threads per problem | Creates UX confusion; one chat per re-diagnosis is simpler |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAM-01 | Phase 1 | Complete |
| CAM-02 | Phase 1 | Complete |
| CAM-03 | Phase 1 | Complete |
| CAM-04 | Phase 1 | Complete |
| PROB-01 | Phase 2 | Pending |
| PROB-02 | Phase 2 | Complete |
| PROB-03 | Phase 2 | Complete |
| PROB-04 | Phase 2 | Complete |
| PROB-05 | Phase 2 | Pending |
| PROB-06 | Phase 2 | Complete |
| PROB-07 | Phase 2 | Complete |
| PROB-08 | Phase 2 | Pending |
| PROB-09 | Phase 2 | Complete |
| PROB-10 | Phase 2 | Complete |
| NOTF-01 | Phase 2 | Complete |
| NOTF-02 | Phase 3 | Pending |
| NOTF-03 | Phase 3 | Pending |
| NOTF-04 | Phase 2 | Complete |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| I18N-01 | Phase 2 | Complete |
| I18N-02 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
