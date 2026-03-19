# Architecture

**Analysis Date:** 2025-03-19

## Pattern Overview

**Overall:** Local-first React Native mobile app with feature-gated premium tier and optional cloud sync layer

**Key Characteristics:**
- Single-source-of-truth local storage via AsyncStorage with debounced persistence
- Feature flags enable/disable entire feature sets (MVP vs V1.1+ capabilities)
- Premium gating via `usePremiumGate()` hook that combines feature flags + runtime subscription checks
- Edge functions proxy external APIs (PlantNet, Claude Vision) for security
- Stateless task generation—cached plant data recalculates tasks on every render
- Two-tier data model: camelCase local types + snake_case DB types with converters for sync

## Layers

**Presentation (Screens & Components):**
- Purpose: Render UI, handle user interactions, manage local visibility state (modals, expanded sections)
- Location: `src/screens/`, `src/components/`
- Contains: 6 main screens (TodayScreen, PlantsScreen, SettingsScreen, CalendarScreen, ExploreScreen, LoginScreen), 30+ modal/helper components
- Depends on: Hooks (useStorage, useWeather, usePremiumGate), Services (analytics, image upload), Utilities (plantHealth, plantLogic)
- Used by: App.tsx navigation layer

**Navigation:**
- Purpose: Manage screen routing via React Navigation bottom-tab navigator
- Location: `App.tsx` (MainTabs function)
- Contains: 5-6 tabs conditional on feature flags (Hoy, Calendario, Plantas, Explorar, Ajustes)
- Depends on: Screens
- Used by: App root, wrapped in SafeAreaProvider

**State Management (Context + Hooks):**
- Purpose: Provide single source of truth for app data and sync state
- Location: `src/hooks/useStorage.tsx` (primary), `src/hooks/useSync.ts`, `src/hooks/usePremium.tsx`
- Contains:
  - `useStorage`: Wraps 12+ plant-related data types (plants, notes, reminders, location, settings) in AsyncStorage under `plant-agenda-v2`
  - `useSync`: Debounced bidirectional sync with Supabase when `Features.CLOUD_SYNC` is true
  - `usePremium`: Runtime premium status from RevenueCat
- Depends on: AsyncStorage, Supabase client, RevenueCat SDK
- Used by: All screens and feature-gated components

**Services (Business Logic & Integrations):**
- Purpose: Encapsulate API calls, data transformation, and external service interactions
- Location: `src/services/`
- Contains:
  - `plantKnowledgeService.ts`: Two-tier plant lookup (Supabase cache → Perenual API → cache result)
  - `authService.ts`: Google/Apple OAuth via expo-auth-session (V1.1+)
  - `syncService.ts`: Supabase CRUD + camelCase↔snake_case conversion (V1.1+)
  - `imageService.ts`: Supabase Storage upload/delete for plant photos (V1.1+)
  - `analyticsService.ts`: Expo's analytics via Segment
  - `photoService.ts`: Image capture and processing
  - `payments.ts`: RevenueCat subscription management
- Depends on: Supabase client, external APIs (Perenual, RevenueCat, Anthropic), AsyncStorage
- Used by: Components, hooks, screens

**Utilities (Pure & Algorithmic Functions):**
- Purpose: Stateless calculations and transformations
- Location: `src/utils/`
- Contains:
  - `plantLogic.ts`: `getTasksForDay()` generates watering/sun/outdoor tasks (stateless, runs every render)
  - `plantHealth.ts`: `calculatePlantHealth()` scores plant 0-100 based on care history + weather
  - `plantAlerts.ts`: Generates weather-based alerts for plants (frost, heat, rain, wind)
  - `plantDiagnosis.ts`: Formats diagnosis data for Claude Vision API
  - `plantIdentification.ts`: Handles PlantNet API proxy response parsing
  - `wateringRecommendations.ts`: Calculates optimal watering schedule
  - `dates.ts`: Date parsing, formatting, comparison utilities
  - `notificationScheduler.ts`: Calculates notification times and schedules
  - `tipSelector.ts`: Selects daily tips based on conditions
- Depends on: Date libraries, type definitions
- Used by: Hooks, components, services

**Data Access & Configuration:**
- Purpose: Static configuration, constants, and feature definitions
- Location: `src/config/`, `src/data/`
- Contains:
  - `features.ts`: Boolean flags for 20+ features (MVP, V1.1, V1.2, V2.0)
  - `premium.ts`: `usePremiumGate()` hook combining feature + premium checks
  - `constants.ts`: Plant types, day/month names, storage key
  - `plantDatabase.ts`: 60+ entries for known plants with care instructions
  - `careTips.ts`: Database of care tips organized by plant type
  - `weatherCodes.ts`: Open-Meteo weather code → human-readable mapping
- Depends on: i18n for translations, types
- Used by: Everywhere (imported for feature checks)

**Integrations & External APIs:**
- Purpose: Client libraries and network communication
- Location: `src/lib/`, services
- Contains:
  - `supabase.ts`: Initialized Supabase client with secure token storage (expo-secure-store on mobile, localStorage on web)
  - Open-Meteo weather API (direct HTTP fetch via `useWeather` hook)
  - PlantNet API (proxied via Supabase edge function `identify-plant`)
  - Claude Vision API (proxied via `diagnose-plant` and `chat-diagnosis` edge functions)
  - Perenual API (for plant knowledge cache fallback)
  - RevenueCat SDK (subscription status)
  - Expo APIs: notifications, image picker, location, font loading, secure storage
- Depends on: Environment variables (EXPO_PUBLIC_*)
- Used by: Services, hooks

## Data Flow

**User Opens App:**

1. `App.tsx` wraps with providers: SafeAreaProvider → StorageProvider → PremiumProvider → (AuthProvider if Features.AUTH)
2. StorageProvider loads `plant-agenda-v2` from AsyncStorage on mount
3. If Features.AUTH: AuthProvider checks Supabase session, routes to LoginScreen or MainTabs
4. If not Features.AUTH: Routes directly to OnboardingScreen (if no plants) or MainTabs
5. Main tabs load based on feature flags (Hoy, Plantas, Ajustes always; Calendario/Explorar if flags enabled)

**Plant Care Workflow (TodayScreen):**

1. TodayScreen calls `useStorage()` to get plants array
2. `useWeather(location)` fetches weather if location set, caches for 30min
3. `getTasksForDay(plants, today)` runs stateless—recalculates watering/sun/outdoor tasks fresh
4. `calculatePlantHealth(plant, today, weather)` scores each plant 0-100, identifies issues
5. Components render tasks, health badges, and alerts
6. User marks task done via `updatePlant()` which writes to AsyncStorage immediately + schedules debounced save (100ms)
7. If Features.CLOUD_SYNC: `useSync()` auto-syncs changes up to Supabase 2s after user action

**Plant Identification (PlantIdentifierModal):**

1. User captures photo via camera
2. Edge function `identify-plant` receives base64 image + PlantNet API key
3. PlantNet responds with species guesses + confidence scores
4. Claude Vision refines results using plant database context
5. Results returned: single match → add to plants, multiple → user chooses, none → show tips
6. New plant written to AsyncStorage, sync queued if Features.CLOUD_SYNC

**Health Diagnosis (DiagnosisModal):**

1. User captures photo of plant showing symptoms
2. `diagnose-plant` edge function sends image + `PlantDiagnosisContext` (species, watering schedule, last watered) to Claude Vision
3. Claude returns diagnosis: overall status (healthy/minor/moderate/severe), issue list with treatments
4. Results cached in `diagnosisHistory: Record<plantId, SavedDiagnosis[]>` in storage
5. User can follow up via `chat-diagnosis` for clarification (limited to 1 free message)
6. Shopping items auto-generated from treatment suggestions if premium

**Data Persistence (AsyncStorage):**

- Every mutation (`updatePlant()`, `addNote()`, etc.) updates both React state AND internal ref immediately
- 100ms debounce timer prevents excessive disk I/O—only one write per batch of changes
- AsyncStorage fails gracefully; errors logged but don't block UI
- No automatic cloud sync in MVP (Features.CLOUD_SYNC=false)

**Premium Gating Example (Add Plant):**

1. User taps + to add plant, counter shows: "You have 2 of 5 plants"
2. `canAddPlant(currentCount)` checks: isPremium || currentCount < 5
3. If free tier at limit: PaywallModal shown with RevenueCat offer
4. If tapped subscribe → RevenueCat SDK handles flow → `usePremium()` updates → re-render unlocked

## State Management

**Local-First Model:**

- `AppData` interface (types/index.ts) defines all state: plants, notes, reminders, location, settings, counts, history
- `useStorage` context holds entire `AppData` + 20+ action functions
- Every action mutates state in memory, writes to AsyncStorage immediately (async, fire-and-forget)
- Debounced persistence prevents thrashing disk
- No backend sync in MVP; cloud sync (V1.1) is opt-in via feature flag

**Feature Flags as State:**

- `Features` object (config/features.ts) is **compile-time constants**, not runtime state
- To enable V1.1: flip flag to `true` in features.ts, rebuild app
- All V1.1 code (auth, sync, calendar) is preserved but not rendered when flag is `false`
- Eliminates dead code in MVP, no runtime overhead from disabled features

**Premium State:**

- `isPremium` from `usePremium()` hook (checks RevenueCat subscription)
- Combined with feature flags in `usePremiumGate()` to determine feature availability
- Example: `canIdentify()` returns `isPremium || identificationCount < 1`

## Error Handling

**Strategy:** Graceful degradation—app remains functional even if external services fail

**Patterns:**

- Weather fetch: If Open-Meteo fails, cached weather used; alerts omitted; no crash
- Plant knowledge: If Perenual fails, user can still add plant manually with defaults
- Image upload: If Supabase Storage fails, photo not saved to cloud; local storage persists
- Notifications: If schedule fails, morning reminder not shown; user can see tasks anyway
- Network errors: Try-catch with console.error; user shown "retry" button or fallback UI

**Error Boundaries:**

- No formal error boundary components; instead each feature handles own errors
- Services return `{ success: boolean, error?: string, data }` tuples
- Screens check `success` before rendering data, show error message if needed

## Cross-Cutting Concerns

**Logging:**

- Framework: Native `console.log/error` to Expo console
- Patterns: Log at start/end of async operations, errors always logged
- Example: `console.error('Save error:', e)` in useStorage debounce timer

**Validation:**

- Minimal: TypeScript strict mode catches most issues
- Runtime: Each service validates API responses before using (e.g., weather API structure)
- Storage: `AppData` interface enforces structure; invalid data returns empty collections

**Authentication (V1.1+):**

- Stored in Supabase via expo-secure-store (mobile) / localStorage (web)
- `AuthProvider` wraps app if Features.AUTH=true
- LoginScreen shown if not authenticated
- User can log out → clears session → app syncs down cloud data to replace local

**i18n (Internationalization):**

- Framework: react-i18next
- Files: `src/i18n/locales/{en,es}/common.json` (UI text), `plants.json` (plant care tips)
- Plant database content translated via `getTranslatedPlant(plantId, lang)` in plantDatabase.ts
- Spanish uses vos conjugation (regá, sacá, podés) — casual tone
- System language auto-detected, user can override in settings

**Analytics:**

- Framework: Expo analytics via Segment
- Events tracked: `app_opened`, feature usage (identification, diagnosis), errors
- No PII collected (CLAUDE.md notes privacy-first design)
- Configured in `analyticsService.ts`

## Key Abstractions

**Plant:**
- Core data type with care schedule (waterEvery, sunHours, sunDays, outdoorDays)
- Extends with optional database link (`databaseId`) for detailed care info
- Health calculated fresh per render by `calculatePlantHealth()`
- Examples: `src/types/index.ts` Plant interface

**Task:**
- Stateless representation of daily action (water, sun, outdoor)
- Generated fresh every render by `getTasksForDay(plants, today)`
- Not persisted—no task storage, no task completion tracking
- Example: generated by `src/utils/plantLogic.ts`

**PlantDBEntry:**
- Rich plant knowledge from database or Perenual API
- Contains care instructions, problems list, nutrients, category
- Keyed by plant name; user plant (`Plant`) links to DB entry via `databaseId` optional field
- Example: `src/data/plantDatabase.ts` has 60+ entries

**PlantHealthStatus:**
- Score (0-100) + level (excellent/good/warning/danger) + issues list
- Calculated from water overdue, sun care overdue, weather extremes, active diagnoses
- Consumed by UI to color health badge and show issue list
- Example: `src/utils/plantHealth.ts` calculatePlantHealth()

**SavedDiagnosis:**
- Cached diagnosis result with timestamp, issue list, and chat history
- Keyed by plantId + diagnosisId; multiple diagnoses per plant possible
- User can follow up with chat messages; chat limited by premium tier
- Example: stored in `diagnosisHistory: Record<plantId, SavedDiagnosis[]>` in AppData

## Entry Points

**App.tsx (Root):**
- Location: `App.tsx`
- Triggers: App launch (Expo loads this as entry)
- Responsibilities:
  - Wrap with SafeAreaProvider, StorageProvider, PremiumProvider
  - Load fonts
  - Route to AuthProvider (if Features.AUTH) or direct to AppContentMVP
  - Show loading screen until storage loaded

**TodayScreen (Main Tab):**
- Location: `src/screens/TodayScreen.tsx`
- Triggers: User taps "Hoy" tab
- Responsibilities:
  - Display today's watering/sun/outdoor tasks
  - Show plant cards with health badges
  - Render weather widget and alerts
  - Handle plant actions (water, sun, outdoor, note, reminder)
  - Modals for adding/editing plants, viewing health details, identifying new plants, diagnosing problems

**OnboardingScreen:**
- Location: `src/screens/OnboardingScreen.tsx`
- Triggers: App launch with no plants + onboarding not completed
- Responsibilities:
  - Walk user through: location, preferred language, first plant selection
  - Call `completeOnboardingWithData()` to mark done and add first plants

**SettingsScreen:**
- Location: `src/screens/SettingsScreen.tsx`
- Triggers: User taps "Ajustes" tab
- Responsibilities:
  - Display user profile, location, notification settings, language
  - Premium subscription status + paywall link
  - About / privacy / app version

**PlantIdentifierModal:**
- Location: `src/components/PlantIdentifier/PlantIdentifierModal.tsx`
- Triggers: User taps camera icon or "+ Nueva planta" → selects "Identificar"
- Responsibilities:
  - Capture photo via device camera
  - Send to `identify-plant` edge function
  - Display results: single match (add directly), multiple (choose), none (manual add)
  - Increment identification count counter

**PlantDiagnosisModal:**
- Location: `src/components/PlantDiagnosis/PlantDiagnosisModal.tsx`
- Triggers: User taps "Diagnosticar" on plant card
- Responsibilities:
  - Capture symptom photo
  - Send to `diagnose-plant` edge function with plant context
  - Display diagnosis results + treatment steps
  - Allow follow-up chat if premium

---

*Architecture analysis: 2025-03-19*
