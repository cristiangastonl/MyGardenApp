# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Plant Identification:**
- PlantNet API - AI plant species identification from photos
  - SDK/Client: Custom via Supabase Edge Function `supabase/functions/identify-plant/index.ts`
  - Auth: `PLANTNET_API_KEY` (Supabase secret, server-side only)
  - Endpoint: `https://my-api.plantnet.org/v2/identify/all`
  - Flow: App sends base64 image → Edge function proxies to PlantNet → returns species matches

**Plant Knowledge & Catalog:**
- Perenual API - Plant care information and botanical database
  - SDK/Client: Direct HTTP fetch in `src/services/plantKnowledgeService.ts`
  - Auth: `EXPO_PUBLIC_PERENUAL_API_KEY` (environment variable, optional)
  - Endpoints:
    - `https://perenual.com/api/species-list` - Search plants by name
    - `https://perenual.com/api/species/details/{id}` - Get detailed care info
  - Flow: Lookup cached data in Supabase first → fallback to Perenual API → cache result

**Weather Data:**
- Open-Meteo API - Free weather forecasting (no API key required)
  - SDK/Client: Direct HTTPS fetch in `src/hooks/useWeather.ts`
  - Auth: None (public API)
  - Endpoint: `https://api.open-meteo.com/v1/forecast`
  - Parameters: latitude, longitude, current conditions, daily forecast (7 days)
  - Response: Temperature, weather codes, sunrise/sunset, UV index, wind, humidity
  - Caching: 30-minute in-app cache via AsyncStorage

**Geocoding:**
- Open-Meteo API - Reverse geocoding (location to address)
  - Integrated with weather fetch for location name resolution

**Plant Diagnosis (AI):**
- Edge Function: `supabase/functions/diagnose-plant/index.ts` - Health analysis
  - Input: Plant condition data (watering, sun, temperature extremes)
  - Output: Health score (0-100), recommendations
  - Server-side logic, no external AI provider integrated

## Data Storage

**Databases:**
- Supabase PostgreSQL - Cloud relational database
  - Connection: Configured in `src/lib/supabase.ts`
  - Client: @supabase/supabase-js
  - Tables:
    - `plant_knowledge` - Cached plant care data from Perenual
    - `analytics_events` - Usage analytics (optional, V1.1+)
    - `users` - User profiles (V1.1+ with auth)
    - `plants` - User's plants (V1.1+ with sync)
    - `watering_logs` - Care history (V1.1+ with sync)
  - Authentication: Row-level security (RLS) - users only see their own data via `auth.uid()`
  - Status: MVP uses AsyncStorage only; Supabase enabled but sync not active until V1.1

**File Storage:**
- Supabase Storage - Plant photo uploads
  - Bucket: `plant-images`
  - Service: `src/services/imageService.ts`
  - Upload flow: Compress image → base64 → Supabase Storage → return public URL
  - Access: Public read (via signed URLs or public bucket policy)

**Local Storage:**
- AsyncStorage - Device-local JSON persistence (MVP primary)
  - Key: `'plant-agenda-v2'` contains entire AppData
  - Scope: All user data (plants, logs, settings)
  - Sync: Manual on demand or debounced auto-sync (V1.1+)

**Caching:**
- AsyncStorage - Multi-purpose caching
  - Weather data: `weather-cache` (30-minute TTL)
  - Analytics queue: `analytics_queue` (persisted events pending upload)
  - Device ID: `analytics_device_id` (unique per install)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (configured but not active in MVP)
  - Providers: Google, Apple
  - Implementation: `src/services/authService.ts`
  - OAuth flow: App → expo-auth-session → browser → OAuth provider → Supabase → app
  - Token storage: expo-secure-store (iOS Keychain, Android Keystore)
  - Session management: Auto-refresh, persistence across app restarts

**Premium Status Verification:**
- RevenueCat SDK (payment verification)
  - Feature: Check entitlement `premium` for premium features
  - Mock in Expo Go, real in EAS production builds
  - Service: `src/services/payments.ts`

## Monitoring & Observability

**Error Tracking:**
- Not integrated (errors logged to console in dev, silently fail in production)

**Analytics:**
- Custom analytics via Supabase
  - Service: `src/services/analyticsService.ts`
  - Events: Purchase events, feature usage, errors
  - Persistence: Events queued in AsyncStorage, batch flushed to Supabase every 30s
  - Data: device_id, event_name, event_data, app_version, platform
  - Opt-in: Optional, depends on Supabase configuration

**Logs:**
- Console logging (dev mode only via `__DEV__` guards)
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Expo/EAS (managed build service)
  - Build types: dev client (for testing), preview (internal testing), production (store release)
  - Cloud builds: Compiled by EAS servers, not local

**Backend Hosting:**
- Supabase Cloud - Hosted PostgreSQL + managed services
  - Edge functions deployed to Supabase infrastructure

**Build & Release Pipeline:**
```bash
npx expo start              # Local dev server (Expo Go or dev client)
eas build --platform ios --profile production    # Build for App Store
eas build --platform android --profile production # Build for Google Play
eas submit --platform ios/android --id <BUILD_ID> # Auto-submit to stores
```

**CI/CD Service:**
- No GitHub Actions or external CI configured
- Manual builds and submissions via EAS CLI

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL (safe to commit reference)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (safe, limited RLS)

**Optional env vars:**
- `EXPO_PUBLIC_PERENUAL_API_KEY` - Plant knowledge API (graceful fallback if missing)

**Secrets location:**
- `.env` and `.envrc` files (not in repo, in `.gitignore`)
- Supabase dashboard → Project Settings → API Keys and Secrets
- EAS Secrets managed in EAS dashboard (for builds/functions)

**Signing & Credentials:**
- iOS: Remote credentials stored on EAS servers, referenced by profile name
- Android:
  - Keystore: Remote on EAS (alias `b357e57c403e45a4772fcdb168129f18`)
  - Google Play Service Account: `./pc-api-key.json` (local, git-ignored)

## Webhooks & Callbacks

**Incoming:**
- Supabase webhooks - Not configured in codebase (possible future feature)

**Outgoing:**
- OAuth callback: `mijardin://auth/callback` (app scheme for auth redirect)
- Analytics flush: POST to Supabase `analytics_events` table
- Image upload callback: Supabase Storage upload completion
- Payment verification: RevenueCat webhook listener (in-app via SDK)

**Health/Monitoring Webhooks:**
- None configured

## Third-Party Services Summary

| Service | Purpose | Status | Dependency |
|---------|---------|--------|------------|
| Supabase | Auth, DB, storage, functions | Active | Critical in V1.1+ |
| Perenual | Plant knowledge | Active (optional) | Non-critical, graceful fallback |
| PlantNet | Plant identification | Active (V1.1+) | Feature-gated |
| Open-Meteo | Weather forecasting | Active | Optional, MVP feature |
| RevenueCat | In-app purchases | Active | Feature-gated, mocked in dev |
| Google OAuth | Authentication | Configured | Feature-gated (V1.1+) |
| Apple OAuth | Authentication | Configured | Feature-gated (V1.1+) |
| Google Play Store | App distribution | Active | Android production |
| Apple App Store | App distribution | Configured | iOS production |

---

*Integration audit: 2026-03-19*
