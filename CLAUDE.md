# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

My Happy Garden is a React Native (Expo) plant care app. Users track watering, sun, and outdoor activities for their plants, with weather integration, AI plant identification, and AI health diagnosis.

## Commands

```bash
npx expo start                # Dev server (Expo Go or dev client)
npx tsc --noEmit              # Type-check (no linter or test runner configured)
npx expo install [pkg]        # Install Expo-compatible dependency version
npm run check:i18n-keys       # Pre-submit: catalog id ↔ i18n keyset parity
npm run check:images          # Pre-submit: catalog imageUrl 200 OK (network)

# Supabase Edge Functions
source .envrc && supabase functions deploy identify-plant
source .envrc && supabase functions deploy get-plant-care
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
| Adelantados (already enabled) | PLANT_IDENTIFICATION, PHOTO_UPLOAD (from V1.1), DLC_PEST_DIAGNOSIS (from V1.2) |
| V1.1 (pending) | AUTH, CLOUD_SYNC, CALENDAR_TAB, EXPLORE_TAB, FULL_CATALOG, NOTIFICATIONS_ADVANCED |
| V1.2 (pending) | DLC_KITCHEN_GARDEN, AFFILIATE_LINKS, REFERRAL_SYSTEM, HOME_WIDGETS |
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
- Edge functions in `supabase/functions/`: `identify-plant`, `diagnose-plant`, `chat-diagnosis`, `waitlist`, `get-plant-care`
- Secrets: `PLANTNET_API_KEY`, `GEMINI_API_KEY`, `PERENUAL_API_KEY` configured in Supabase dashboard (set via `source .envrc && supabase secrets set PERENUAL_API_KEY=<value>`)

## Design System (MUST follow)

Use values from `src/theme.ts`. Do not introduce new colors, fonts, or shadow values.

- **Colors**: `colors.*` from theme.ts (bgPrimary `#f5f0e6`, card `#fffdf8`, textPrimary `#2d3a2e`, green `#5b9a6a`, sunGold `#f0c040`, waterBlue `#3a6b8c`, etc.)
- **Fonts**: Titles → `PlayfairDisplay_700Bold`, Body → `DMSans_400Regular` / `500Medium` / `600SemiBold`
- **Spacing/radius/shadows**: Use `spacing.*`, `borderRadius.*`, `shadows.*` from theme.ts

## Internationalization (i18n)

The app supports **English** and **Spanish (Argentine)**. System language is auto-detected, user can override in Settings.

- All UI text MUST use `t('key')` from `react-i18next` — **never hardcode user-facing strings**
- Translation files: `src/i18n/locales/{en,es}/common.json` and `plants.json`
- Plant database content (name, tip, description, problems, nutrients) is translated via `getTranslatedPlant()` in `plantDatabase.ts`
- Category names are resolved dynamically via `getPlantCategories()` — never use stored `typeName` directly for display
- Edge functions (diagnose-plant, chat-diagnosis, identify-plant) accept a `lang` parameter and respond in the user's language
- Spanish uses vos conjugation (regá, sacá, podés). Friendly, casual tone.

## App Store & Privacy

- **App name**: My Happy Garden
- **Store listing**: `store-listing.md` in project root (EN/ES descriptions, keywords)
- **Privacy manifest**: `privacyManifests` in `app.json` — declares APIs accessed and data collected
- **Update privacy manifest when**: adding auth/email collection, adding analytics/tracking, adding cloud sync, or using new Apple-required APIs
- **No update needed for**: UI changes, new screens, catalog additions, feature improvements that don't change data collection
- **iOS config**: `usesNonExemptEncryption: false`, push notification entitlements configured
- **iOS bundle**: `com.mygardencare.app`
- **iOS submit fields** in `eas.json`: `appleId: cristiangastonl@gmail.com`, `ascAppId: 6760934404`, `appleTeamId: N3K92QGR4U`
- **PrivacyInfo.xcprivacy** included in project root

## Android Build & Submit

### Build
```bash
eas build --platform android --profile production   # Generates .aab for Google Play
```
- **Do NOT create a new build if one already exists** — check first with `eas build:list --platform android --status finished --limit 5`
- Credentials source: `remote` (keystore stored on EAS servers)
- Keystore alias: `b357e57c403e45a4772fcdb168129f18`

### Submit
```bash
eas submit --platform android --profile production --id <BUILD_ID>
```
- Service account key: `./pc-api-key.json` (Google Play API access — **requires permissions configured in Google Play Console**)
- Track: `internal` (promote to production from Google Play Console)
- **Manual alternative**: Download `.aab` from EAS build URL → upload in Google Play Console → Versiones → Pruebas → Prueba cerrada → Crear nueva versión

### Signing (Google Play App Signing)
- Google manages the **app signing key** — the developer uploads with an **upload key**
- EAS keystore SHA1: `86:F5:51:D5:84:4C:88:F3:52:44:DC:03:F0:A7:FC:17:DC:1A:39:D8`
- The upload key in Google Play **must match** the EAS keystore. If they don't match, reset the upload key via: Google Play Console → Integridad de la app → Firma de apps → "Solicitar restablecimiento de la clave de carga" → upload `upload_key.pem` generated from EAS keystore
- To export EAS upload cert: `keytool -exportcert -alias <alias> -keystore <file>.jks -rfc -file upload_key.pem -storepass <password>`
- Google Play API access ("Acceso a la API") is configured at **account level** in Google Play Console (not per-app), under Configuración

## iOS Build & Submit

### Build
```bash
eas build --platform ios --profile production   # Generates .ipa for App Store
```
- Credentials source: `remote` (managed by EAS)
- `autoIncrement: true` for build numbers
- Bundle ID: `com.mygardencare.app`

### Submit
```bash
eas submit --platform ios --profile production --id <BUILD_ID>
```
- Apple ID: `cristiangastonl@gmail.com`
- App Store Connect App ID: `6760934404`
- Team ID: `N3K92QGR4U`

### Pre-submit Checklist
- RevenueCat iOS key must be set (currently placeholder in `revenuecat.ts`)
- In-app purchase products must be created in App Store Connect (yearly + lifetime)
- Privacy Policy URL required
- Screenshots required (6.7" iPhone, 5.5" iPhone minimum)

## Pre-submit Checks

Two npm scripts must be run before submitting builds to catch catalog drift:

```bash
npm run check:i18n-keys   # sync; ~2s; fails on missing en/es plants.json keys
npm run check:images      # async network HEAD; ~30-60s; fails on 404 imageUrl
```

**`check:i18n-keys`** — verifies every entry id in `src/data/plantDatabase.ts` has a complete keyset (`name`, `tip`, `description`, `problems[>=1]`, `nutrients` if entry declares any) in both `src/i18n/locales/en/plants.json` AND `src/i18n/locales/es/plants.json`. Exits 1 with itemised list of missing keys. **MUST pass before any submit.**

**`check:images`** — HEAD-requests every `imageUrl` in PLANT_DATABASE at concurrency 8. Exits 1 with itemised URL list on any non-200. **Accepted-known failures (Phase 8, v1.1):** the following 15 entries point at imageUrls that 404 until manual image upload to Supabase Storage:

- jacaranda, ceibo, glicina, gardenia, camelia, dalia
- salvia-ornamental, cala, copete, verbena
- lavanda-stoechas, lavanda-dentada
- romero-rastrero, tomate-cherry
- lavanda-angustifolia (renamed from lavanda; old lavanda.jpg needs re-upload as lavanda-angustifolia.jpg)

These failures are documented in the v1.1 device-test backlog. Image upload steps:
1. Source images (CC0/public domain or user-shot photos).
2. Upload to Supabase Storage bucket `plant-images/catalog/<id>.jpg`.
3. Re-run `npm run check:images` — should now pass.

## Landing Page & Waitlist

- Landing page in `landing/` — static HTML deployed via Cloudflare Workers (`wrangler.toml`)
- Waitlist edge function in `supabase/functions/waitlist/`
- Waitlist migration: `supabase/migrations/004_waitlist.sql`

## Security

**Never commit** `.env` or `.envrc` (both in .gitignore). These contain Supabase keys and CLI tokens.

**Pre-submit grep guard (Phase 10 SEC-01):** `EXPO_PUBLIC_PERENUAL_API_KEY` MUST NOT appear in `.env`, `.env.example`, `app.json`, or anywhere under `src/`. The Perenual API key lives ONLY in Supabase secrets (`PERENUAL_API_KEY`) and is accessed server-side via `Deno.env.get` in `supabase/functions/get-plant-care/index.ts`. Verify with: `grep -rc "EXPO_PUBLIC_PERENUAL_API_KEY" src/ .env .env.example app.json` — every line must show count 0. The pre-Phase-10 leaked key has been rotated as of v1.2.
