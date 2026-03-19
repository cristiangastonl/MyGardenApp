# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript 5.9.2 - Full codebase with strict mode enabled (`src/`, `supabase/functions/`)

**Secondary:**
- JavaScript (Expo configuration, build scripts)

## Runtime

**Environment:**
- React Native 0.81.5 via Expo SDK 54.0.33
- Deno (Supabase Edge Functions)

**Package Manager:**
- npm (inferred from package.json structure)
- Lockfile: Not present in repo (typical for Expo projects)

## Frameworks

**Core:**
- React 19.1.0 - UI layer
- React Native 0.81.5 - Cross-platform native runtime
- Expo 54.0.33 - Build system, development server, native module access

**Navigation:**
- @react-navigation/native 7.1.28 - Navigation infrastructure
- @react-navigation/bottom-tabs 7.12.0 - Bottom tab bar (Hoy, Plantas, Ajustes)
- react-native-screens 4.16.0 - Native screen optimization

**Internationalization:**
- i18next 25.8.10 - Translation framework
- react-i18next 16.5.4 - React integration for i18n

**Styling:**
- Inline theme object via `src/theme.ts` - No CSS/styling library
- expo-linear-gradient 15.0.8 - Gradient backgrounds

**Storage:**
- @react-native-async-storage/async-storage 2.2.0 - Local persistence (MVP: primary data store)
- expo-secure-store 15.0.8 - Secure token storage (OAuth sessions)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.95.3 - Backend as a service (auth, database, storage, edge functions)
  - Used for: cloud sync (V1.1+), analytics, plant knowledge cache, image storage
  - Client configured in `src/lib/supabase.ts`

- react-native-purchases 7.x (conditional) - RevenueCat integration for in-app payments
  - Only loaded in EAS production builds (mocked in Expo Go)
  - Configured in `src/services/payments.ts`

**Device Access:**
- expo-camera (via expo-image-picker 17.0.10) - Camera access
- expo-image-picker 17.0.10 - Photo library and camera
- expo-image-manipulator 14.0.8 - Image compression/rotation
- expo-file-system 19.0.21 - File read/write
- expo-location 19.0.8 - GPS location (optional, weather)
- expo-device 8.0.10 - Device info for analytics
- expo-notifications 0.32.16 - Push/local notifications
- expo-crypto 15.0.8 - UUID generation, cryptographic functions

**Development:**
- expo-auth-session 7.0.10 - OAuth flow (Google, Apple)
- expo-web-browser 15.0.10 - OAuth redirect handling
- expo-dev-client 6.0.20 - Development client for native modules
- expo-font 14.0.11 - Font loading (PlayfairDisplay, DMSans)
- expo-localization 17.0.8 - System language detection
- expo-status-bar 3.0.9 - Status bar control
- expo-ngrok 4.1.3 - Tunneling for local dev

**UI & Content:**
- base64-arraybuffer 1.0.2 - Image encoding for upload
- react-native-url-polyfill 3.0.0 - URL API polyfill
- react-native-safe-area-context 5.6.2 - Safe area support

## Configuration

**Environment Variables:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public, safe to expose)
- `EXPO_PUBLIC_PERENUAL_API_KEY` - Optional, Perenual API key for plant data
- `REVENUECAT_API_KEY` - RevenueCat SDK key (hardcoded in `src/config/revenuecat.ts` for test mode)

**Supabase Secrets (server-side):**
- `PLANTNET_API_KEY` - PlantNet API key for plant identification edge function

**Build Profiles:**
- `app.json` - Expo configuration (iOS bundle ID, Android package, permissions, plugins)
- `eas.json` - EAS build and submit configuration (development, preview, production profiles)
- `tsconfig.json` - TypeScript strict mode enabled, extends `expo/tsconfig.base`

## Platform Requirements

**Development:**
- Node.js (npm)
- iOS 13.0+ simulator / device
- Android 5.1+ emulator / device
- Expo Go app (optional: dev client for native modules)

**Production:**
- iOS 13.0+ (native app via App Store)
- Android 5.1+ (native app via Google Play)
- App signing: Google Play App Signing (managed) + EAS keystore upload key

**Build Pipeline:**
- EAS (Expo Application Services) for CI/CD
- Remote credentials on EAS servers (keystore, signing certs)

## Deployment

**Platforms:**
- Apple App Store - iOS distribution
- Google Play Store - Android distribution
- Expo Updates (over-the-air updates, via EAS)

**App Identifiers:**
- iOS: `com.cristianlopez.mijardin`
- Android: `app.mygardencare.app`
- Expo Project ID: `b0bc8bf8-e038-41e4-8b6e-6bf6dd868b4d`

## Native Modules

**Required (Expo Go not compatible):**
- expo-dev-client - Custom dev client
- expo-secure-store - Keychain/Keystore (local)
- expo-notifications - Native notification scheduling
- expo-image-picker - Camera + photo library
- expo-image-manipulator - Native image processing

**Optional/Feature-gated:**
- react-native-purchases - RevenueCat (EAS builds only)

---

*Stack analysis: 2026-03-19*
