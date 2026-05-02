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
- ✓ 4-level light model with locale-aware labels (indoor + outdoor variants) — v1.1
- ✓ Seasonal watering schedule (warm/cold split) with soil-check mode for cacti — v1.1
- ✓ Three-zone seasonality (Northern/Southern/Tropical) with manual climate override — v1.1
- ✓ Onboarding location prompt with GPS / city search / skip — v1.1
- ✓ Diagnosis conversation continuity (continue + reopen) with App-level paywall + deferred callback — v1.1
- ✓ Per-diagnosis-lifetime message count + retroactive premium lift on upgrade — v1.1
- ✓ Catalog rebalance: 50 expert overrides + 14 new LATAM outdoor plants + lavender split (64 total) — v1.1
- ✓ Lookup-by-id catalog content with `_aliases` for renamed slugs — v1.1
- ✓ CI guards for catalog i18n key parity + image URL 200 OK — v1.1

### Active

<!-- Current scope. Building toward these. -->

## Current Milestone: v1.2 Recommendation-First Plant Guide

**Goal:** Pivot from passive tracker to guided assistant — the app recommends what to do (with horticultural rationale) and the user adjusts to their reality. Polish PlantCard, add brand voice, fix UAT bugs, modernize mobile patterns, and expand plant-app domain coverage (fertilization, pet toxicity, journal).

**Target features (6 themes):**
- **Educational Detail Modal** (centerpiece): 4-section redesign with ¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes; catalog extended with `careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale` per entry; identification picker pre-selects species recommendation
- **PlantCard Cleanup**: delete trash out of card (swipe-to-delete or detail menu); reduce 10 visual elements → 5; tip italic collapses to detail
- **Microcopy + Brand Voice**: voseo + emoji on action buttons; consistent voice/personality; illustrated empty states; sample-data path in onboarding
- **UAT Bug Fixes**: outdoor task gate (no "Sacar afuera" on outdoor plants); picker outdoor labels for outdoor PlantNet results; consolidate two identification entry points; textSecondary contrast fix (WCAG AA)
- **Mobile UX Modernization**: bottom sheets replacing full-screen modals for short actions; swipe gestures (delete, complete, favorite); long-press actions; haptic feedback at key moments; skeleton loaders
- **Plant-App Domain Expansion**: fertilization schedule per plant; pet toxicity (cats/dogs) per catalog entry; per-plant photo journal; light streaks/celebration toasts (no heavy gamification)

### Pending Operational Tasks (v1.1 closeout)

Manual ops batched at end of milestone — must complete before declaring v1.1 publicly released:
- Run device-test backlog (~27 scenarios) on Android device
- Deploy 2 Supabase edge functions: `chat-diagnosis` + `diagnose-plant`
- Upload 15 catalog images to Supabase Storage `plant-images/catalog/<id>.jpg` (14 new outdoor + lavanda-angustifolia rename)
- Re-run `npm run check:images` until exit 0

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

Shipped v1.1 Precision Care milestone (39 plans across 6 phases, 4 waves of complexity). v1.0 shipped earlier with +1,545 LOC. The app is on Google Play (internal track), preparing for production after v1.1 device-test backlog completes.

**Current state (post-v1.1):** Plant care is precision-driven — light quality (4 levels indoor/outdoor), seasonal warm/cold watering split, three-zone seasonality (lat-derived or manual override), soil-check mode for cacti. Onboarding asks for location with skip-safe path. Catalog has 64 expert-vetted entries (50 rebalanced + 14 new LATAM outdoor + lavender 3-variant split). Diagnosis chat now resumes across sessions with App-level paywall + deferred callback. All code green: smoke 752 PASS across all phases, project-wide tsc strict.

**Tech stack:** React Native + Expo SDK 54, TypeScript strict, Supabase edge functions (with dual-payload backward compat), AsyncStorage local-first with versioned envelope, RevenueCat premium gating, single-compile-path smoke runner via `typescript.transpileModule` (no jest/vitest installed).

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
| Three-zone seasonality (Northern/Southern/Tropical) from day one | Avoids two-hemisphere assumption; tropical zone bypasses season flip | ✓ Good (v1.1) |
| Schema migration via versioned envelope `{schemaVersion, data}` + backup blob | Atomic from user's perspective; rollback safety net for one release | ✓ Good (v1.1) |
| Mode-as-dispatcher: waterMode toggles task type, NOT cadence math | Single SSOT across modes; future v1.2/v2 modes reuse cadence | ✓ Good (v1.1) |
| `getEffectiveSeason(location, climateOverride, date)` as public SSOT, `getWaterSeason` private | Single search-and-replace for 8 call sites; manual override wins over derived hemisphere | ✓ Good (v1.1) |
| Lookup-by-id catalog content (`getCatalogEntry(plant.databaseId)`) with `_aliases` | Patch updates to `tip` propagate to existing user plants on next render; renamed slugs don't orphan | ✓ Good (v1.1) |
| App-level PaywallModal context with deferred onSuccess callback | No nested-modal stacking; purchase auto-resends gated action; close-then-trigger contract documented | ✓ Good (v1.1) |
| Single-compile-path smoke runner (`typescript.transpileModule`) instead of jest/vitest | Zero new framework install; 752 assertions across 5 phase runners; carried Phase 4→9 | ✓ Good (v1.1) |
| Edge function dual-payload via discriminator (`!!ctx.waterSchedule`) | Backward-compat grace window for old clients; v1.2 sunset target | ⚠️ Revisit v1.2 |
| Defer manual ops (device tests, edge function deploys, image uploads) to end-of-milestone | Per user preference — full E2E test more efficient than per-phase smoke | ✓ Good (v1.1) |

---
*Last updated: 2026-05-02 after v1.2 Recommendation-First Plant Guide milestone defined (6 themes from UAT findings + UX diagnostic). Previous: v1.1 Precision Care shipped (39 plans / 6 phases).*
