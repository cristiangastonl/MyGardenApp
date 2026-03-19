# My Garden Care

## What This Is

My Garden Care is a React Native (Expo) plant care app where users track watering, sun, and outdoor activities for their plants, with weather integration, AI plant identification, AI health diagnosis with camera support, and premium AI-powered plant problem tracking with follow-up reminders and photo timelines.

## Core Value

Users can diagnose their plants' problems through photos and AI, and the app proactively tracks recovery — so no plant issue goes forgotten.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Plant tracking with watering, sun, and outdoor schedules — MVP
- ✓ Weather integration via Open-Meteo with plant-specific alerts — MVP
- ✓ AI plant identification via PlantNet edge function — MVP
- ✓ AI health diagnosis via Claude Vision chat — MVP
- ✓ Photo upload from gallery in diagnosis chat — MVP
- ✓ Premium gating with RevenueCat + feature flags — MVP
- ✓ Daily tips and health score — MVP
- ✓ Notifications for care reminders — MVP
- ✓ Plant catalog with 60+ species — MVP
- ✓ i18n (English + Argentine Spanish) — MVP
- ✓ Local-first data with AsyncStorage — MVP
- ✓ Seasonal theme with animated backgrounds — MVP
- ✓ Camera capture in diagnosis chat (take photo on the spot) — v1.0
- ✓ AI-powered plant problem tracking with follow-up photo reminders (premium) — v1.0
- ✓ AI suggests resolution on improvement, user confirms with one tap (premium) — v1.0
- ✓ Problem timeline in plant detail view (photo history of diagnosis → resolution) — v1.0
- ✓ Push notifications for follow-up diagnosis reminders (premium) — v1.0
- ✓ Follow-up diagnosis tasks in "Hoy" screen (premium) — v1.0
- ✓ Notification deep-link navigation (cold-start safe) — v1.0
- ✓ PlantCard tracking status emoji badges — v1.0

### Active

<!-- Current scope. Building toward these. -->

(None yet — start next milestone to define)

### Out of Scope

<!-- Explicit boundaries. -->

- Auth / Cloud sync — deferred to future auth milestone
- Calendar tab / Explore tab — separate feature milestones
- New DLC content packs — future milestone
- User-configurable follow-up interval — contradicts AI-decides design
- Fully automatic resolution without user confirmation — deferred until confidence threshold tuned
- Re-diagnosis in same chat thread with prior context — needs cloud sync
- Numeric severity scores — use descriptive labels instead

## Context

Shipped v1.0 Diagnosis & Tracking milestone with +1,545 LOC across 20 files. The app is on Google Play (internal track) and being prepared for production.

**Current state:** Camera works in diagnosis chat (iOS ActionSheetIOS + Android custom Modal). Problem tracking fully operational: premium users can track problems, get push notification reminders, see follow-up tasks in Hoy, view photo timelines in plant detail, and resolve problems via AI suggestion or manually. Notification deep-linking handles cold start, background, and foreground scenarios.

**Tech stack:** React Native + Expo SDK 54, TypeScript strict, Supabase edge functions, AsyncStorage local-first, RevenueCat premium gating.

## Constraints

- **Tech stack**: React Native + Expo SDK 54, TypeScript strict — no changes
- **Local-first**: All data in AsyncStorage (synced later in auth milestone)
- **Premium gate**: Problem tracking is premium-only; camera in chat follows existing message limits
- **AI frequency**: Follow-up interval decided by severity mapping (Watch closely=3d, Needs attention=7d, Minor=14d)
- **Edge functions**: Diagnosis through Supabase edge functions — API keys server-side
- **Design system**: Must use existing `src/theme.ts` values

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Camera in chat follows existing message gate | No separate camera gate — chat limit restricts free tier | ✓ Good |
| AI decides follow-up frequency via severity mapping | Different problems need different intervals — client maps severity to days | ✓ Good |
| AI suggests resolution, user confirms (not auto-resolve) | Reduces false positives from blurry photos while keeping UX smart | ✓ Good |
| Problem timeline in plant detail (not chat) | Plant-centric view is more natural than scrolling chat history | ✓ Good |
| Push + Hoy tasks for dual reminders | Ensures follow-ups aren't missed regardless of notification preferences | ✓ Good |
| Extend SavedDiagnosis in-place (not parallel collection) | Avoids stale cross-reference bugs, backward-compatible with optional fields | ✓ Good |
| NotificationContext for deep-link (not URL-based) | Lightweight, avoids deep-linking complexity, cold-start safe | ✓ Good |
| Emoji + text severity labels | Fits app's emoji-throughout convention, avoids anxiety of numeric scores | ✓ Good |

---
*Last updated: 2026-03-19 after v1.0 milestone*
