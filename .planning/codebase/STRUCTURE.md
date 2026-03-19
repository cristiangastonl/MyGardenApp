# Codebase Structure

**Analysis Date:** 2025-03-19

## Directory Layout

```
MiJardinApp/
├── App.tsx                    # Root entry point with provider setup and main tab navigator
├── app.json                   # Expo config (SDK 54, permissions, plugins, privacy manifest)
├── package.json               # Dependencies (React Native, Expo, Supabase, RevenueCat, i18n)
├── tsconfig.json              # TypeScript strict mode config
├── eas.json                   # Expo build service config for iOS/Android production builds
├──
├── src/                       # Main application code
│   ├── screens/               # Main screens (Hoy, Plantas, Ajustes, Calendario, Explorar, Login)
│   ├── components/            # Reusable UI components (modals, cards, sections)
│   ├── hooks/                 # Custom React hooks (useStorage, useWeather, usePremium, etc)
│   ├── services/              # Business logic & API integrations (auth, sync, plant knowledge)
│   ├── utils/                 # Pure functions & algorithms (plantHealth, plantLogic, dates)
│   ├── config/                # Feature flags & premium gating (features.ts, premium.ts)
│   ├── data/                  # Static databases (plantDatabase, careTips, constants)
│   ├── lib/                   # Initialized client libraries (supabase.ts)
│   ├── types/                 # TypeScript type definitions (index.ts, database.ts)
│   ├── i18n/                  # Internationalization config & translation files
│   ├── theme.ts               # Design system (colors, spacing, fonts, shadows, seasonal palettes)
│   └── index.ts               # (Deprecated or empty)
│
├── supabase/                  # Supabase backend configuration
│   ├── functions/             # Edge functions (identify-plant, diagnose-plant, chat-diagnosis, waitlist)
│   └── migrations/            # Database schema migrations
│
├── assets/                    # App icons, splash screen, notification icon (PNG)
├── ios/                       # Native iOS project (Xcode, Pods, assets)
├── android/                   # Native Android project
├── landing/                   # Landing page (separate web project, Cloudflare Workers)
├── docs/                      # Documentation (schema, API specs)
├── plugins/                   # Custom Expo plugins (withDisableExtraTranslationLint.js)
└── .planning/                 # GSD planning documents (generated)
    └── codebase/              # Architecture, structure, conventions, testing analysis
```

## Directory Purposes

**src/screens/:**
- Purpose: Main navigation screens for the 5-6 tabs
- Contains: TodayScreen, PlantsScreen, SettingsScreen, CalendarScreen (V1.1), ExploreScreen (V1.1), LoginScreen (V1.1+)
- Key files:
  - `TodayScreen.tsx` (676 lines) — Dashboard with tasks, weather, plant cards, modals
  - `SettingsScreen.tsx` (866 lines) — Profile, location, notifications, language, premium, about
  - `OnboardingScreen.tsx` (1168 lines) — First-run flow: location → language → plant selection
  - Other screens: 245–392 lines each
- Import pattern: Screens import shared components, hooks (useStorage, useWeather, usePremium), and services

**src/components/:**
- Purpose: Reusable modular UI pieces—modals, cards, widgets, lists
- Contains: 30+ component files organized by feature
- Key structure:
  - Presentation modals: `AddPlantModal`, `PlantDetailModal`, `DayDetailModal`, `ShoppingListModal`
  - Feature modals: `PlantIdentifier/` (camera → identify), `PlantDiagnosis/` (camera → diagnose)
  - Data display: `PlantCard`, `PlantHealthDetail`, `WeatherWidget`, `WeatherAlerts`, `WateringTips`
  - Settings: `SettingsPanel` (1327 lines, large) — all user settings in one component
  - Misc: `Header`, `PaywallModal`, `SyncStatusBadge`, `SeasonalBackground`, `ExpandedFAB`
- Import pattern: Components import useStorage, useTranslation, services, and other components
- No barrel file exports for consistency; each component self-contained

**src/hooks/:**
- Purpose: Custom React hooks encapsulating stateful logic
- Key hooks:
  - `useStorage.tsx` — Context + hook providing single source of truth for all app data
  - `usePremium.tsx` — Checks RevenueCat subscription status, provides isPremium + showPaywall
  - `useWeather.ts` — Fetch + cache weather from Open-Meteo API
  - `useNotifications.ts` — Schedule notifications based on settings
  - `usePlantIdentification.ts` — Handle image capture + edge function call for plant ID
  - `usePlantDiagnosis.ts` — Handle diagnosis workflow (capture → API → results → chat)
  - `useSeason.ts` — Calculate current season from location
  - `useAuth.ts` — (V1.1+) Google/Apple auth via Supabase
  - `useSync.ts` — (V1.1+) Debounced bidirectional sync with Supabase
- Pattern: Each hook manages isolated concern; composed in screens/components as needed

**src/services/:**
- Purpose: Encapsulate external API calls and business logic
- Files:
  - `plantKnowledgeService.ts` — Lookup plant by name: Supabase cache → Perenual API → cache result
  - `authService.ts` — (V1.1+) OAuth flow via expo-auth-session + Supabase Auth
  - `syncService.ts` — (V1.1+) Full sync: local camelCase ↔ Supabase snake_case converters
  - `imageService.ts` — (V1.1+) Upload/delete images to Supabase Storage
  - `photoService.ts` — Image capture helpers, compression, base64 encoding
  - `analyticsService.ts` — Expo analytics via Segment (app_opened, feature tracking)
  - `payments.ts` — RevenueCat SDK integration for subscriptions
- Pattern: Sync/async functions return `{ success, data, error?, source? }` tuples

**src/utils/:**
- Purpose: Pure functions for calculations and transformations
- Files:
  - `plantLogic.ts` — `getTasksForDay()` generates watering/sun/outdoor tasks (stateless)
  - `plantHealth.ts` — `calculatePlantHealth()` scores 0-100 based on care + weather; identifies issues
  - `plantAlerts.ts` — Generate weather-based alerts (frost, heat, rain, wind) for plants
  - `plantDiagnosis.ts` — Format diagnosis data for Claude Vision API payload
  - `plantIdentification.ts` — Parse PlantNet + Claude responses into IdentifiedPlant[]
  - `wateringRecommendations.ts` — Calculate optimal watering schedule given plant type + weather
  - `dates.ts` — parseDate, addDays, daysBetween, formatDate, isSameDay
  - `notificationScheduler.ts` — Calculate next notification time, schedule via Expo notifications
  - `tipSelector.ts` — Select daily tip based on plant conditions
- Pattern: No dependencies on React, context, or async I/O; testable in isolation

**src/config/:**
- Purpose: Feature flags and premium gating logic
- Files:
  - `features.ts` — Boolean constants for 20+ features (WEATHER_ALERTS, AUTH, CLOUD_SYNC, etc.)
  - `premium.ts` — `usePremiumGate()` hook combining feature flags + isPremium for feature access
  - `revenuecat.ts` — RevenueCat SDK initialization
- Pattern: Features object is compile-time; to enable V1.1, flip flags in features.ts and rebuild

**src/data/:**
- Purpose: Static knowledge bases
- Files:
  - `plantDatabase.ts` — 60+ plant entries with care instructions, problems, nutrients, images
  - `careTips.ts` — 100+ care tips organized by plant type
  - `constants.ts` — Plant types, day/month names, storage key, i18n helper functions
  - `weatherCodes.ts` — Open-Meteo code → icon + description mapping
- Pattern: Imported by utils and components; translated via i18n system

**src/lib/:**
- Purpose: Initialized client libraries
- Files:
  - `supabase.ts` — Supabase client with secure token storage adapter (expo-secure-store mobile / localStorage web)
- Pattern: Single file exports configured client; imported by services + hooks

**src/types/:**
- Purpose: TypeScript type definitions
- Files:
  - `index.ts` — Main types: Plant, Task, Note, Reminder, PlantDBEntry, WeatherData, HealthStatus, Diagnosis, etc.
  - `database.ts` — Supabase table schema types (snake_case DB types)
- Pattern: Local types use camelCase; DB types use snake_case; syncService.ts converters transform between

**src/i18n/:**
- Purpose: Internationalization configuration and translation files
- Files:
  - `locales/en/common.json` — English UI strings (buttons, labels, messages)
  - `locales/en/plants.json` — English plant database translations
  - `locales/es/common.json` — Spanish (Argentine) UI strings (vos conjugation)
  - `locales/es/plants.json` — Spanish plant care tips and descriptions
  - Index file: Initializes react-i18next with language detection
- Pattern: All user-facing text must use `t('key')` hook; system language auto-detected, user can override in settings

## Key File Locations

**Entry Points:**
- `App.tsx` — Root component; wraps with providers, loads fonts, routes based on auth + feature flags
- `src/screens/TodayScreen.tsx` — Primary dashboard; most complex screen with task generation, modals, API calls
- `src/screens/OnboardingScreen.tsx` — First-run experience; sets location, language, adds initial plants

**Configuration:**
- `src/config/features.ts` — Feature flag toggles (flip to enable V1.1+ features)
- `src/config/premium.ts` — Premium gating rules for each feature
- `src/theme.ts` — Design system: colors, fonts, spacing, shadows, seasonal palettes
- `eas.json` — iOS/Android build config, code signing, version numbers
- `app.json` — Expo config, SDK version, permissions, privacy manifest

**Core Logic:**
- `src/hooks/useStorage.tsx` — Single source of truth for all app data; 20+ action functions
- `src/utils/plantLogic.ts` — Stateless task generation (recalculates every render)
- `src/utils/plantHealth.ts` — Health scoring algorithm (0-100 + issues list)
- `src/utils/plantAlerts.ts` — Weather alert generation for each plant
- `src/utils/notificationScheduler.ts` — Notification scheduling and timing

**Data Access:**
- `src/data/plantDatabase.ts` — Plant knowledge base (60+ entries)
- `src/data/careTips.ts` — Care tips indexed by plant type
- `src/lib/supabase.ts` — Supabase client initialization

**API & Services:**
- `src/services/plantKnowledgeService.ts` — Plant lookup with Supabase cache + Perenual fallback
- `src/services/imageService.ts` — Supabase Storage image upload/delete
- `src/services/analyticsService.ts` — Expo analytics events
- `src/services/authService.ts` — (V1.1+) OAuth flows
- `src/services/syncService.ts` — (V1.1+) Full bidirectional sync

**Feature Implementations:**
- `src/components/PlantIdentifier/` — Camera capture + identify-plant edge function integration
- `src/components/PlantDiagnosis/` — Symptom photo capture + diagnose-plant + follow-up chat
- `src/components/PaywallModal.tsx` — Premium offer presentation + RevenueCat integration
- `src/hooks/useNotifications.ts` — Morning reminder + care alert scheduling

## Naming Conventions

**Files:**
- Screens: PascalCase + "Screen" suffix (TodayScreen.tsx, PlantsScreen.tsx)
- Components: PascalCase (PlantCard.tsx, WeatherWidget.tsx)
- Hooks: camelCase + "use" prefix (useStorage.tsx, useWeather.ts)
- Services: camelCase + "Service" suffix (authService.ts, plantKnowledgeService.ts)
- Utilities: camelCase (plantHealth.ts, dates.ts)
- Config: camelCase (features.ts, premium.ts)
- Types: index.ts (main), database.ts (DB schema)

**Directories:**
- Feature-based grouping: `PlantIdentifier/`, `PlantDiagnosis/` for multi-file features
- Type-based grouping: `screens/`, `components/`, `hooks/`, `services/`, `utils/`, `config/`, `data/`, `lib/`, `types/`, `i18n/`

**Code Conventions:**
- Interfaces: PascalCase, no "I" prefix (Plant, PlantHealthStatus, NotificationSettings)
- Type unions: lowercase (HealthLevel = 'excellent' | 'good' | 'warning' | 'danger')
- Functions: camelCase, action verbs (calculatePlantHealth, getTasksForDay, addPlant)
- Constants: UPPER_SNAKE_CASE (STORAGE_KEY, FETCH_TIMEOUT_MS, FREE_PLANT_LIMIT)
- React components: Export default at end of file

## Where to Add New Code

**New Feature (e.g., Plant Breeding/Propagation):**
- Feature logic: `src/utils/propagationLogic.ts`
- New screen: `src/screens/PropagationScreen.tsx`
- Feature components: `src/components/PropagationModal.tsx`, `src/components/PropagationCard.tsx`
- If needs API: `src/services/propagationService.ts`
- Data: Add to `src/data/plantDatabase.ts` or new file `src/data/propagationTips.ts`
- Hook: `src/hooks/usePropagation.ts` if managing internal state
- Tests: `src/utils/propagationLogic.test.ts` (if test framework added)
- Localization: Keys in `src/i18n/locales/{en,es}/common.json`
- Feature flag: Add to `src/config/features.ts`, gate rendering in screen/component

**New Component/Modal:**
- Location: `src/components/FeatureName.tsx` or `src/components/FeatureName/index.tsx` (if multi-file)
- Import useStorage, useTranslation, services, other components as needed
- Style with colors/spacing from `src/theme.ts` (never hardcode)
- Export default at end
- If complex: break into subcomponents (e.g., PlantIdentifier/ has AnalyzingState, CameraCapture, IdentificationResults)

**New Screen:**
- Location: `src/screens/FeatureScreen.tsx`
- Import: useStorage, useTranslation, navigation, useWeather (if needed), hooks
- Define as default export function
- Import in App.tsx and add to Tab.Navigator if it's a main tab
- Or import in another screen for navigation if it's modal

**New Hook:**
- Location: `src/hooks/useFeatureName.ts`
- Return object with state + actions
- Document with JSDoc what it does, what it depends on
- Called from screens/components or other hooks

**Utilities:**
- Location: `src/utils/featureName.ts` (new file) or add to existing file if related
- Pure functions only—no React, no context, no async I/O except caching
- Export individual functions, not default
- Document algorithms with comments

**API Integration:**
- If simple: add function to existing service or create new `src/services/featureService.ts`
- Edge functions: Add to `supabase/functions/feature-name/index.ts` if server-side logic needed
- External API: Use `fetch()` or SDK; consider caching strategy (see plantKnowledgeService for example)

**Database Changes (V1.1+):**
- Migration: `supabase/migrations/NNN_feature_name.sql`
- Schema types: Add interfaces to `src/types/database.ts`
- Sync converters: Update `src/services/syncService.ts` to handle new fields
- Storage: Update `AppData` interface in `src/types/index.ts` and useStorage.tsx if persisting locally

## Special Directories

**assets/:**
- Purpose: App icons, splash screen, notification icon
- Generated: No (hand-designed PNGs)
- Committed: Yes (icon.png, splash-icon.png, adaptive-icon.png, favicon.png, notification-icon.png)
- Note: Images referenced in app.json; changes require app rebuild

**ios/ & android/:**
- Purpose: Native platform code (Podfile, Gradle, native config)
- Generated: Partially (Pods/ folder generated by CocoaPods; android/ folder rebuilt by `eas build`)
- Committed: Yes (but not node_modules or generated artifacts)
- Note: Modify only if adding native modules; otherwise use Expo plugins

**supabase/functions/:**
- Purpose: Backend edge functions (API proxies, secrets, Claude calls)
- Files:
  - `identify-plant/index.ts` — Proxy PlantNet API with key server-side
  - `diagnose-plant/index.ts` — Call Claude Vision with plant context
  - `chat-diagnosis/index.ts` — Follow-up chat for diagnosis
  - `waitlist/index.ts` — Collect landing page email signups
- Deploy: `source .envrc && supabase functions deploy function-name`
- Note: Edge functions written in TypeScript/Deno; separate from main React code

**supabase/migrations/:**
- Purpose: Database schema evolution
- Files: Named `NNN_description.sql` (000_initial.sql, 001_add_users.sql, etc.)
- Apply: `supabase db push` applies pending migrations to local dev instance
- Deploy: Migrations auto-applied to production on `supabase deploy`
- Note: Use migrations for schema changes; use drift for data changes (apply post-deploy script)

**landing/:**
- Purpose: Separate web project for marketing landing page
- Tool: Cloudflare Workers (wrangler framework)
- Files: index.html, styles.css, favicon, images
- Deploy: `wrangler deploy` (separate from app deployment)
- Note: Not part of main app; separate build/deploy pipeline

**plugins/:**
- Purpose: Custom Expo plugins for extending native behavior
- Files:
  - `withDisableExtraTranslationLint.js` — Disable ExtraTranslation lint for Android production (locales/ios)
- Applied: Defined in app.json plugins array
- Note: Plugins run during `eas build` to modify native configs before building

**docs/:**
- Purpose: Project documentation (database schema, API specs, design decisions)
- Files: Schema diagrams, API endpoint docs, architecture decisions
- Note: Kept separate from code; updated manually as needed

---

*Structure analysis: 2025-03-19*
