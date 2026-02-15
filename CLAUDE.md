# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Mi Jardín is a React Native (Expo) plant care app. Users track watering, sun, and outdoor activities for their plants, with weather integration and plant identification.

## Commands

```bash
npx expo start                # Dev server (Expo Go or dev client)
npx tsc --noEmit              # Type-check (no linter or test runner configured)
npx expo install [pkg]        # Install Expo-compatible dependency version

# Supabase Edge Functions
source .envrc && supabase functions deploy identify-plant
source .envrc && supabase secrets set KEY=value
```

No test framework is set up. No linter/formatter configured.

## Architecture

### Stack
- React Native + Expo SDK 54, TypeScript (strict)
- `@react-navigation/bottom-tabs` (MVP: 3 tabs — Hoy, Plantas, Ajustes)
- AsyncStorage (local-first, no cloud sync in MVP)
- Open-Meteo API (weather/geocoding, free)

### Feature Flags (`src/config/features.ts`)

The app uses a **two-axis gating model**: version flags × premium gate.

- **`Features`** object — compile-time constants. MVP flags are `true`, everything else `false`.
- **`usePremiumGate()`** hook (`src/config/premium.ts`) — runtime checks combining feature flags with premium status (always `false` in MVP).

| Version | Flags enabled |
|---------|--------------|
| MVP | WEATHER_ALERTS, HEALTH_SCORE, DAILY_TIPS, NOTIFICATIONS_BASIC, PLANT_CATALOG, PREMIUM_GATE |
| V1.1 | AUTH, CLOUD_SYNC, CALENDAR_TAB, EXPLORE_TAB, PLANT_IDENTIFICATION, PHOTO_UPLOAD, FULL_CATALOG, NOTIFICATIONS_ADVANCED |
| V1.2 | DLC_KITCHEN_GARDEN, DLC_PEST_DIAGNOSIS, AFFILIATE_LINKS, REFERRAL_SYSTEM, HOME_WIDGETS |
| V2.0 | DLC_SEASONAL_PREP, DLC_ADVANCED_DIAGNOSTICS, PLANT_COMPATIBILITY, CARE_STREAKS, SPONSORED_TIPS, MULTIPLE_GARDENS |

To enable V1.1 features, flip the V1.1 flags to `true` in `features.ts`. All existing code (auth, sync, calendar, explore) is preserved but not rendered.

### Data Flow: Local-First
The app is **local-first**. All writes go to AsyncStorage immediately.

1. **`useStorage` (Context + Hook)** — Single source of truth. Wraps all app data in `AppData` under storage key `'plant-agenda-v2'`. Every mutation calls `AsyncStorage.setItem` synchronously.
2. **`useSync`** — (V1.1) Debounced auto-sync to Supabase. Only active when `Features.CLOUD_SYNC` is `true`.
3. **`syncService.ts`** — (V1.1) Full sync with camelCase ↔ snake_case converters.

### Provider Hierarchy (App.tsx)
```
SafeAreaProvider → StorageProvider → [AuthProvider if AUTH] → AppContent
```
When `Features.AUTH` is `false`, AuthProvider is skipped entirely. AppContent goes straight to OnboardingScreen or MainTabs.

### Key Patterns

- **No nested navigators** — All modals use local state visibility toggles within screens
- **Task generation is stateless** — `getTasksForDay()` in `plantLogic.ts` recalculates tasks fresh from plant data each time (no task storage)
- **Health scoring** — `plantHealth.ts` computes a 0-100 score from watering/sun/outdoor overdue days + weather extremes → maps to excellent/good/warning/danger
- **Dual data model** — Local types (camelCase in `types/index.ts`) and DB types (snake_case in `types/database.ts`) with converters in `syncService.ts`
- **Edge function as API proxy** — `identify-plant` edge function proxies PlantNet API to keep the API key server-side
- **Plant knowledge cache** — `plantKnowledgeService.ts` checks Supabase `plant_knowledge` table first, falls back to Perenual API, then caches result
- **Emoji icons throughout** — Uses emoji instead of an icon library
- **Feature-gated rendering** — Components check `Features.*` and `usePremiumGate()` before rendering gated UI

### Services Layer (`src/services/`)
- `authService.ts` — (V1.1) Google/Apple OAuth via `expo-auth-session` + `expo-web-browser`
- `syncService.ts` — (V1.1) Supabase CRUD with local↔DB converters
- `plantKnowledgeService.ts` — Two-tier lookup: Supabase cache → Perenual API → cache result
- `imageService.ts` — (V1.1) Upload/delete plant photos to Supabase Storage bucket `plant-images`

### Supabase Configuration
- Client in `src/lib/supabase.ts` — Uses `expo-secure-store` for session (localStorage on web)
- Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- RLS enabled on all tables — users only access their own data (`auth.uid() = user_id`)
- Edge functions in `supabase/functions/`
- Secret: `PLANTNET_API_KEY` configured in Supabase dashboard

## Design System (MUST follow)

Use values from `src/theme.ts`. Do not introduce new colors, fonts, or shadow values.

- **Colors**: `colors.*` from theme.ts (bgPrimary `#f5f0e6`, card `#fffdf8`, textPrimary `#2d3a2e`, green `#5b9a6a`, sunGold `#f0c040`, waterBlue `#3a6b8c`, etc.)
- **Fonts**: Titles → `PlayfairDisplay_700Bold`, Body → `DMSans_400Regular` / `500Medium` / `600SemiBold`
- **Spacing/radius/shadows**: Use `spacing.*`, `borderRadius.*`, `shadows.*` from theme.ts

## Language

All UI text in **Spanish (Argentine)**: vos conjugation (regá, sacá, podés). Friendly, casual tone.

## Security

**Never commit** `.env` or `.envrc` (both in .gitignore). These contain Supabase keys and CLI tokens.
