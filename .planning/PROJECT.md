# My Garden Care — V1.1 Milestone

## What This Is

My Garden Care is a React Native (Expo) plant care app where users track watering, sun, and outdoor activities for their plants, with weather integration, AI plant identification, and AI health diagnosis. This milestone focuses on enhancing the diagnosis experience with camera support in chat and adding premium AI-powered plant problem tracking with follow-up reminders.

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Camera capture in diagnosis chat (take photo on the spot, not just gallery)
- [ ] AI-powered plant problem tracking with follow-up photo reminders (premium)
- [ ] Auto-resolve problems when AI detects improvement (with manual override)
- [ ] Problem timeline in plant detail view (photo history of diagnosis → resolution)
- [ ] Push notifications for follow-up diagnosis reminders (premium)
- [ ] Follow-up diagnosis tasks in "Hoy" screen (premium)

### Out of Scope

<!-- Explicit boundaries. -->

- Auth / Cloud sync — deferred to V1.1 auth milestone, not this one
- Calendar tab / Explore tab — separate feature milestones
- New DLC content packs — future milestone
- Changing the free tier message limit (2-3 messages) — existing gate stays as-is

## Context

This is a brownfield project with a mature MVP codebase (~1,800 lines of codebase documentation in `.planning/codebase/`). The app is already on Google Play (internal track) and being prepared for production.

**Current diagnosis flow:** User opens diagnosis chat → can type messages and upload photos from gallery → AI (Claude Vision via edge function) analyzes and responds → limited to 2-3 messages on free tier, unlimited on premium.

**Gap identified:** Camera cannot be opened directly from diagnosis chat — only gallery picker works. Users want to take a photo of their sick plant right there in the conversation.

**New feature — Problem Tracking:** When the AI diagnoses a problem (e.g., fungus, yellow leaves), premium users get a "tracking" flow:
1. AI creates a follow-up schedule based on problem severity
2. Reminders appear as push notifications AND tasks in the "Hoy" screen
3. User takes follow-up photo → AI re-diagnoses
4. If AI sees improvement → auto-marks as resolved (user can reopen)
5. User can also manually close a problem at any time
6. Timeline of photos/diagnoses visible in the plant's detail screen

**Existing infrastructure to leverage:**
- `expo-image-picker` already installed (supports camera, just not wired in chat)
- `expo-notifications` already configured for care reminders
- Diagnosis chat and edge functions already working
- Plant detail screen exists with care logs
- "Hoy" screen has task generation via `plantLogic.ts`

## Constraints

- **Tech stack**: React Native + Expo SDK 54, TypeScript strict — no changes
- **Local-first**: Problem tracking data stored in AsyncStorage (synced later in V1.1 auth milestone)
- **Premium gate**: Problem tracking is premium-only; camera in chat follows existing message limits
- **AI frequency**: Follow-up interval decided by AI based on problem severity (not user-configurable)
- **Edge functions**: Diagnosis goes through Supabase edge function (Claude Vision) — keep API keys server-side
- **Design system**: Must use existing `src/theme.ts` values — no new colors/fonts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Camera in chat follows existing message gate | No separate camera gate needed — the chat limit already restricts free tier | — Pending |
| AI decides follow-up frequency | Different problems need different monitoring intervals — user shouldn't have to guess | — Pending |
| Auto-resolve with reopen option | Reduces manual work while keeping user in control | — Pending |
| Problem timeline in plant detail (not chat) | Plant-centric view is more natural than scrolling through chat history | — Pending |
| Push + Hoy tasks for reminders | Dual notification ensures user doesn't miss follow-ups | — Pending |

---
*Last updated: 2026-03-19 after initialization*
