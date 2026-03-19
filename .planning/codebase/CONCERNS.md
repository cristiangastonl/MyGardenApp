# Codebase Concerns

**Analysis Date:** 2025-03-19

## Tech Debt

**Dual State Management Pattern (useStorage + dataRef):**
- Issue: `useStorage.tsx` maintains both React state and a mutable ref (`dataRef`) that are kept in sync. This creates two sources of truth that must be manually synchronized. The pattern is error-prone — mutations must update both state and ref, and re-renders are tied to state changes while async saves operate on ref. Any mutation missing the synchronization will cause stale reads.
- Files: `src/hooks/useStorage.tsx` (lines 103-222)
- Impact: Silent data corruption risk if a mutation path forgets to update the ref. State updates lag behind ref mutations for debounced saves, creating a window where different parts of the app see different data. Refactoring or adding new mutation types requires three-step updates (state setter, ref update, scheduleSave) instead of one.
- Fix approach: Unify to a single source of truth using either: (1) state-only with useReducer for all mutations, or (2) pure ref-based with forceUpdate, or (3) Zustand/Jotai for proper state management. Current approach is a mid-way between two patterns.

**Debounced Saves with 100ms Delay:**
- Issue: All AsyncStorage writes are debounced to 100ms to avoid thrashing. If the app crashes or user force-quits between mutations and the flush, data is lost. The unmount cleanup (lines 205-216) attempts a synchronous save but this is not guaranteed on all platforms.
- Files: `src/hooks/useStorage.tsx` (lines 123-136, 204-216)
- Impact: Data loss risk on sudden app termination. Users can lose recent plant updates, notes, or reminders if the app is killed. No recovery mechanism exists.
- Fix approach: Consider write-through for critical mutations (plant additions/deletions) while keeping read-heavy updates debounced. Or add a recovery/undo journal for the last N mutations.

**Plant Identification Fallback Chain Lacks Transparency:**
- Issue: The identification flow (lines 184-229 in `plantIdentification.ts`) tries local database, then generic care data by family if plant not found. If a plant is not in `PLANT_DATABASE`, it falls back to guessing care parameters based on plant family (e.g., Cactaceae → 21 day watering). No user indication that data is estimated rather than verified. Generic care data for unknown plants may be wildly wrong.
- Files: `src/utils/plantIdentification.ts` (lines 150-155, 184-229)
- Impact: Users following incorrect care guidelines for plants not in the database. A Cactaceae plant that needs water more frequently will be damaged by the default 21-day interval.
- Fix approach: Add a "confidence" or "source" field to IdentifiedPlant result showing whether care data is from verified database, generic family fallback, or Perenual API. Show UI badge/warning when using generic data.

**Hardcoded Generic Care Lookup Table:**
- Issue: GENERIC_CARE_DATA in `plantIdentification.ts` (lines 13-43) contains hardcoded plant family → care mappings with no validation or sourcing. The values are ad-hoc estimates: "Lamiaceae: waterDays: 4" is not justified. If these estimates are wrong, all unidentified plants in that family get wrong care.
- Files: `src/utils/plantIdentification.ts` (lines 13-43)
- Impact: Potentially hundreds of users following incorrect watering/sunlight schedules for common plant families. No way to update without code changes.
- Fix approach: Move to database table `plant_family_care_defaults` with versioning and timestamp. Allow runtime updates. Add comments or citations for where each value came from.

**Missing Error Boundaries:**
- Issue: No Error Boundary components exist to catch rendering errors. If any component throws during render, the entire app crashes. No fallback UI.
- Files: Root of codebase — missing from App.tsx, all screen components
- Impact: Any React error (null pointer, property access on undefined, infinite loop in render) crashes the app with a black/white screen. Users cannot recover.
- Fix approach: Add ErrorBoundary wrapper at App level and per route. Show user-friendly error UI with "try again" or navigation home. Log errors to analytics service.

**Notification Scheduling State Not Persisted:**
- Issue: Scheduled notification IDs (returned by `Notifications.scheduleNotificationAsync`) are not stored anywhere. If the app is force-quit and relaunched, there's no way to know which notifications are already scheduled vs. need rescheduling. The cancel logic (lines 177-192 in `notificationScheduler.ts`) searches by notification content instead of ID.
- Files: `src/utils/notificationScheduler.ts` (lines 177-192)
- Impact: Duplicate notifications on app restart, or notifications never delivered because they were already scheduled but forgotten. Searching by content (`title === "Buenos dias!"`) is brittle — localized titles will cause search misses.
- Fix approach: Store scheduled notification IDs in AsyncStorage under a key like `scheduled_notifications`. Load and validate on app start. Use IDs for cleanup, not content matching.

**Image Upload Has No Size Validation on Client:**
- Issue: `imageService.ts` (lines 13-66) accepts any imageUri and attempts upload. The edge function checks max 5MB base64 (line 57 of `identify-plant/index.ts`), but the client doesn't validate before encoding. Large images will be base64-encoded (4x larger) and sent over the wire before hitting the 5MB limit.
- Files: `src/services/imageService.ts` (lines 13-66), `supabase/functions/identify-plant/index.ts` (lines 56-69)
- Impact: Unnecessary bandwidth waste and long upload times for large images. Poor UX with no progress feedback.
- Fix approach: Add client-side image compression before upload (Expo.ImageManipulator). Check file size after base64 encoding, reject if > 5MB with user-facing error. Show upload progress to user.

**Perenual API Key Stored in Environment Variable Without Rotation:**
- Issue: EXPO_PUBLIC_PERENUAL_API_KEY is a public environment variable. If it's exposed or rotated, code must be redeployed. No runtime mechanism to swap keys without a code update.
- Files: `src/services/plantKnowledgeService.ts` (lines 14-23)
- Impact: Key rotation requires app rebuild + store resubmission. API key is visible in Expo prebuild logs. If key is leaked, attacker can use it until next app release.
- Fix approach: Move Perenual API key to Supabase secrets. Create a wrapper function in an edge function that proxies Perenual requests (like the PlantNet proxy). This allows key rotation without app rebuild.

**Plant JSON Photos Parsed Without Schema Validation:**
- Issue: In `syncService.ts` (lines 56-61) and `useStorage.tsx` (lines 363-371), photos are JSON.stringify'd and JSON.parse'd. No schema validation after parsing. If stored photo structure changes or is corrupted, parsing fails silently (catch block) and photos are lost.
- Files: `src/services/syncService.ts` (lines 56-61), `src/hooks/useStorage.tsx` (lines 363-371)
- Impact: Photo history can be lost on malformed JSON in storage. No error reporting to user or developer.
- Fix approach: Use Zod or io-ts schema to validate parsed photos. If validation fails, log error and provide fallback (empty photos array) with user notification.

**Diagnosis Chat History Unbounded Growth:**
- Issue: `useStorage.tsx` (lines 400-411) appends to diagnosis chat arrays without limit. A user can generate infinite chat messages within a diagnosis, and all are stored in AsyncStorage indefinitely.
- Files: `src/hooks/useStorage.tsx` (lines 400-411)
- Impact: AsyncStorage will grow unbounded and eventually slow down or run out of space. No pruning or archival mechanism. Old diagnoses never cleaned up.
- Fix approach: Implement diagnosis retention policy: keep only last 10 active diagnoses, archive resolved ones to cloud, truncate chat history to last N messages per diagnosis.

**Shopping List No Persistence Guarantee:**
- Issue: Shopping list items are stored in AsyncStorage but there's no sync to cloud. If user has multiple devices, shopping list is not synced. If user clears app data on one device, list is lost with no recovery.
- Files: `src/hooks/useStorage.tsx` (lines 437-465)
- Impact: Users maintain separate shopping lists per device. No single source of truth. Data loss if app data is cleared.
- Fix approach: For MVP, document this limitation. For V1.1, add cloud sync support for shopping list when CLOUD_SYNC is enabled.

## Known Bugs

**Identification Count Increment Race Condition:**
- Symptoms: Multiple taps on identify button before previous identification completes may result in count increment twice.
- Files: `src/screens/TodayScreen.tsx`, `src/hooks/useStorage.tsx` (incrementIdentificationCount)
- Trigger: Identify plant, tap button again before API response arrives
- Workaround: Disable button while request is pending (check existing modal implementation)

**Notification Permission Check Missing Dependency Update:**
- Symptoms: Permission status shown as "undetermined" even after user grants permission.
- Files: `src/hooks/useNotifications.tsx` (if exists, check useNotifications implementation)
- Trigger: Grant notification permission, close settings panel, reopen
- Workaround: Force app restart to refresh permission state

**Plant Knowledge Cache Escape Sequence Bypass:**
- Symptoms: Special characters in plant names like `"` or `%` may bypass PostgREST filter escaping.
- Files: `src/services/plantKnowledgeService.ts` (lines 10-12)
- Trigger: Search for plant with name containing `%`, `_`, `'`, `"`, etc.
- Workaround: Current escapePostgrestFilter removes these chars rather than escaping, so no results. Acceptable for now.

## Security Considerations

**PlantNet API Key Visible in Client Logs:**
- Risk: During development or error reporting, the Authorization header with EXPO_PUBLIC_SUPABASE_ANON_KEY is logged to console (line 254 in `plantIdentification.ts`). The PlantNet API key itself is proxied through the edge function, but the Supabase anon key is exposed.
- Files: `src/utils/plantIdentification.ts` (lines 249, 258)
- Current mitigation: Anon key has limited scope (identified in ENV). PlantNet API key is on server. But logs may be uploaded to Sentry or similar.
- Recommendations: (1) Remove console.log in production or sanitize headers from logs. (2) Use a cloud function to invoke edge functions instead of client-side invoke, so no keys in client logs.

**Supabase RLS Not Documented for new tables:**
- Risk: New tables added (plant_knowledge, analytics_events) may have incomplete RLS policies. If a policy is missing or misconfigured, users could read/write each other's data.
- Files: `supabase/migrations/002_plant_knowledge.sql`, `003_analytics_events.sql`
- Current mitigation: plant_knowledge is shared read-only (no RLS restriction). analytics_events is also shared. This is intentional for app data sharing, but needs explicit review.
- Recommendations: Add comments in migrations explaining RLS intent. Audit RLS quarterly.

**Image URL Extraction Regex May Be Bypassed:**
- Risk: In `imageService.ts` (line 80), file path extraction uses regex `/plant-images\/(.+)/`. An attacker could craft a URL to delete arbitrary files if the path contains special sequences.
- Files: `src/services/imageService.ts` (lines 79-86)
- Current mitigation: Supabase Storage RLS should prevent unauthorized deletes. Needs verification that user can only delete their own plant images.
- Recommendations: (1) Verify RLS bucket policies. (2) Use Supabase SDK methods that handle path validation instead of manual regex.

**Privacy Manifest May Be Outdated:**
- Risk: `privacyManifests` in app.json declares APIs used by the app. If a new library or feature uses new Apple-required APIs (location, camera, contacts), privacy manifest is outdated and app may be rejected.
- Files: `app.json` (privacyManifests section)
- Current mitigation: Reminders in CLAUDE.md to update manifest, but no automated check.
- Recommendations: Before each release, audit all new dependencies against Apple's required APIs list. Automated dependency audit in CI would help.

**Edge Functions Have Permissive CORS:**
- Risk: CORS header `'Access-Control-Allow-Origin': '*'` (line 9 in `identify-plant/index.ts`) allows any origin to call the function. If a PlantNet rate limit is shared across origins, a malicious site could use the shared quota.
- Files: `supabase/functions/identify-plant/index.ts` (lines 8-11)
- Current mitigation: PlantNet API rate limit is per API key, not per caller. Supabase function is rate-limited by Supabase. CORS is permissive to allow dev/testing.
- Recommendations: (1) Restrict CORS to known Supabase domains and development URLs. (2) Add request rate limiting per client IP or API caller identifier.

**Analytics Device ID Permanent Across Reinstalls:**
- Risk: Device ID stored in AsyncStorage is not cleared on app uninstall. User can be tracked across multiple app installs if AsyncStorage is not cleared (possible on Android if app is not fully uninstalled).
- Files: `src/services/analyticsService.ts` (lines 19-38)
- Current mitigation: Device ID is anonymous (UUID, not tied to person). Analytics data itself is minimal.
- Recommendations: (1) Document that device ID persists. (2) Provide app setting to reset device ID. (3) On first launch, regenerate device ID if app version changed significantly.

## Performance Bottlenecks

**Full Plant Database Search Loaded on Explore Tab:**
- Problem: When Explore tab is rendered, `getAllCachedPlants()` may fetch entire plant_knowledge table (currently small, but will grow). No pagination or lazy loading.
- Files: `src/services/plantKnowledgeService.ts` (lines 336-350)
- Cause: All results loaded into memory at once. No filtering server-side.
- Improvement path: (1) Add pagination (limit 20 per page). (2) Implement server-side search with Supabase `.ilike()` filter. (3) Cache results locally with timestamp-based invalidation.

**Notification Recalculation Every Render:**
- Problem: `createMorningContent()` in `notificationScheduler.ts` calls `getTasksForDay()` which scans all plants and calculates task status every time the notification is scheduled. This is called on every app focus or settings change.
- Files: `src/utils/notificationScheduler.ts` (lines 45-132)
- Cause: No memoization. Tasks are recalculated even if plant data hasn't changed.
- Improvement path: Memoize `getTasksForDay()` results based on plants array. Cache notification content.

**Plant Alerts Generated on Every Weather Change:**
- Problem: `generatePlantAlerts()` in TodayScreen.tsx iterates all plants and all weather data points, checking thresholds. Called on every render or weather update. No caching.
- Files: `src/screens/TodayScreen.tsx` (lines 95-98)
- Cause: useMemo exists but dependencies include `plants` and `weather`, which are recreated frequently.
- Improvement path: Memoize weather object. Debounce alert generation on weather updates.

**Large Files Bundle (plantDatabase.ts, careTips.ts):**
- Problem: `plantDatabase.ts` (1200 lines) and `careTips.ts` (1053 lines) are bundled in the main app. No code-splitting or dynamic import. This increases initial bundle size and parse time.
- Files: `src/data/plantDatabase.ts` (1200 lines), `src/data/careTips.ts` (1053 lines)
- Cause: Static imports at the top of the codebase. No dynamic loading.
- Improvement path: (1) Move to Supabase and lazy-load on demand. (2) Split database into plant families and load-on-demand. (3) Use `dynamic()` import with code splitting in Next.js if web version exists.

**Photo Parsing on Every Storage Read:**
- Problem: Photos are stored as JSON strings and parsed every time a plant is accessed via `dbToPlant()`. For a user with many plants and photos, this is repeated work.
- Files: `src/services/syncService.ts` (lines 56-61)
- Cause: No caching of parsed photo arrays. Sync happens every time user loads plants.
- Improvement path: Cache photos at the plant object level. Parse once at load time, not on every sync.

## Fragile Areas

**Notification Identifier Matching (String-Based):**
- Files: `src/utils/notificationScheduler.ts` (lines 182-188)
- Why fragile: Cancel logic searches for notifications by content title string: `n.content.title === "Buenos dias!"`. This breaks if: (1) title is translated and language changes, (2) i18n key changes, (3) Expo returns different title format.
- Safe modification: Store notification identifiers in AsyncStorage immediately after scheduling. Reference by ID on cancel.
- Test coverage: No tests for notification lifecycle. Manual testing only.

**Plant Family Care Fallback:**
- Files: `src/utils/plantIdentification.ts` (lines 150-155, GENERIC_CARE_DATA)
- Why fragile: If a plant's family name is misspelled in Perenual API response or doesn't match the hardcoded keys, the plant gets fallback defaults ("default" entry). No error logging to detect this.
- Safe modification: Add logging when falling back to default care. Quarterly audit Perenual API responses for new family names.
- Test coverage: No tests for fallback paths. Manual testing of unidentified plants only.

**Sync Conflict Resolution (Last-Write-Wins):**
- Files: `src/services/syncService.ts` (lines 129-219 syncToCloud, 224-327 syncFromCloud)
- Why fragile: If user edits plant on two devices simultaneously, the last sync wins and one edit is lost. No conflict detection or merge strategy.
- Safe modification: (1) Add `updated_at` timestamp to all data. (2) On sync, compare timestamps and merge intelligently (take most recent). (3) If conflict, warn user and let them choose.
- Test coverage: No tests for concurrent sync scenarios.

**SettingsPanel Component Size (1327 Lines):**
- Files: `src/components/SettingsPanel.tsx` (1327 lines)
- Why fragile: Massive component with multiple responsibilities: location, notifications, language, analytics, auth, premium. Hard to refactor without breaking UX.
- Safe modification: Split into sub-components: LocationSettings, NotificationSettings, LanguageSettings, AccountSettings, PrivacySettings. Each in separate file.
- Test coverage: No tests. Manual UI testing only.

**OnboardingScreen Hardcoded Logic (1168 Lines):**
- Files: `src/screens/OnboardingScreen.tsx` (1168 lines)
- Why fragile: All onboarding flows (welcome, plant selection, tips preview) are mixed in one component. Hard to A/B test or modify one flow without affecting others.
- Safe modification: Extract flows into separate screen components. Use a state machine or router to navigate between flows.
- Test coverage: No tests.

## Scaling Limits

**AsyncStorage Limit on Local Data:**
- Current capacity: AsyncStorage has ~10MB limit on most platforms (varies by device/OS).
- Limit: App will start experiencing slowdowns and potential data loss at ~5-7MB of stored data. For a heavy user with 100+ plants, each with 10+ photos encoded as base64, this is a real risk.
- Scaling path: (1) Implement cloud sync to move photos to Supabase Storage (remove from AsyncStorage). (2) Use SQLite via `expo-sqlite` for local database to avoid JSON serialization overhead. (3) Add data archival: move old diagnoses and notes to cloud, keep only recent data locally.

**Diagnosis Chat Messages Per Diagnosis:**
- Current capacity: No limit. Users can add infinite messages to a diagnosis.
- Limit: Each message adds to the AsyncStorage blob. 1000+ messages will bloat storage and slow down reads.
- Scaling path: Implement server-side storage for diagnoses (move to Supabase when CLOUD_SYNC enabled). Archive old diagnoses. Limit chat history to last 100 messages.

**Plant Knowledge Cache Table:**
- Current capacity: `plant_knowledge` table grows with every new plant identified via Perenual API. No pruning.
- Limit: At 10K+ rows, Supabase queries slow down. Full-text search becomes expensive.
- Scaling path: (1) Add materialized view for top 1000 plants. (2) Implement PostgreSQL full-text search. (3) Cache results in Cloudflare or Redis.

**Notification Scheduling Limits:**
- Current capacity: Expo Notifications supports ~64 scheduled notifications per app on most platforms.
- Limit: If user has >64 plants with daily reminders, some won't schedule.
- Scaling path: Implement a daemon/background task that wakes the app periodically and re-evaluates which plants need reminders. Post only the most urgent as scheduled notifications.

## Dependencies at Risk

**Expo SDK 54:**
- Risk: Expo SDK 54 is not the latest. Newer SDKs have better performance and bug fixes. Old SDK may have security patches not backported.
- Impact: Missing security updates. Performance regressions vs. latest. Harder to adopt new React features.
- Migration plan: Plan upgrade to Expo SDK 52+ (latest as of Jan 2025) after V1.0 release. Test thoroughly for breaking changes in dependencies.

**@react-navigation/bottom-tabs:**
- Risk: Bottom tabs implementation may have performance issues on older devices with large plant lists. No lazy loading of screens.
- Impact: Switching tabs may stall briefly. Memory usage grows as user navigates tabs (screens not destroyed).
- Migration plan: Implement screen lazy loading / unloading. Test on low-end Android devices (API 24).

**expo-notifications Unavailable in Expo Go:**
- Risk: Feature flag (lines 15-27 in `notificationScheduler.ts`) silently disables notifications if they error. Users on Expo Go get no notifications, but no error message.
- Impact: Notifications work during development with a dev client, but not in Expo Go. Confusing for testers.
- Migration plan: Document this limitation. Require dev client for testing notifications. Add dev warning UI if notifications unavailable.

**react-i18next Configuration Minimal:**
- Risk: No translation management tool (Crowdin, Lokalise). Translations live only in `src/i18n/locales/`. If the project scales, managing translations becomes a bottleneck.
- Impact: Non-technical team members can't update translations. No version control for translation changes. Risk of mistranslation.
- Migration plan: Integrate with Lokalise or similar for translation management. Add CI check to verify all keys are translated.

## Missing Critical Features

**No Backup/Export Feature:**
- Problem: Users cannot export their plant data. If they lose their phone or switch devices, all data is lost (in MVP with no cloud sync).
- Blocks: User retention. Switching to a new device is a "start over" moment.
- Fix: Add "Export data as JSON" button in Settings. In V1.1, auto-backup to cloud.

**No Data Validation on App Startup:**
- Problem: If AsyncStorage is corrupted or partially loaded, the app may start with incomplete data. No validation checks on load (lines 139-202 in `useStorage.tsx`).
- Blocks: Debugging user issues. Silent data corruption possible.
- Fix: Add schema validation on load. If corrupted, prompt user to recover from backup or start fresh. Log validation errors.

**No Offline Indicator:**
- Problem: App makes API calls (weather, plant identification) without showing user when offline. Requests fail silently or timeout.
- Blocks: User confusion about why features aren't working.
- Fix: Add connection state detection. Show banner when offline. Disable features that require network.

**No Analytics/Crash Reporting:**
- Problem: analyticsService exists but is not integrated into screens. App crashes go unreported. User behavior is invisible.
- Blocks: Understanding what users do. Debugging production issues. A/B testing.
- Fix: Wire up trackEvent calls in key user flows (identify plant, add plant, view health, etc.). Integrate with Sentry for crash reporting.

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: All utilities (plantLogic, plantHealth, dates, etc.), all services (analyticsService, plantKnowledgeService, syncService, imageService), all hooks (useStorage, useWeather, useNotifications, usePremium).
- Files: Entire src/utils, src/services, src/hooks directories
- Risk: Refactoring breaks logic without detection. Edge cases (leap years in date math, NaN in health score, empty arrays) go unnoticed.
- Priority: High — add Jest setup and unit tests for utilities first.

**No Integration Tests:**
- What's not tested: Sync flow (upload then download), notification scheduling and cancellation, plant identification flow with mock API, image upload flow.
- Files: Would test integration between useStorage + syncService, notificationScheduler + Expo.Notifications, plantIdentification + supabase.functions.
- Risk: Integration bugs (e.g., sync loses data, notifications don't reschedule) go unnoticed until user reports.
- Priority: High after unit tests.

**No E2E Tests:**
- What's not tested: Full user flows (onboard, add plant, take photo, identify, view health, set notification, modify plant, delete plant, export data). No scenario coverage (fast network, slow network, offline, permission denied, low storage).
- Files: Would test from TodayScreen through all modals and screens.
- Risk: App shipped with broken onboarding, broken plant identification, etc. No regression detection between releases.
- Priority: Medium — add after unit/integration tests. Can use Detox or Cypress for E2E.

**No Component Tests:**
- What's not tested: Large components (SettingsPanel, OnboardingScreen, TodayScreen). Prop changes, user interactions, conditional rendering.
- Files: `src/components/SettingsPanel.tsx`, `src/screens/OnboardingScreen.tsx`, `src/screens/TodayScreen.tsx`
- Risk: UI breaks silently. Modals don't open/close. Buttons don't respond.
- Priority: Medium — use React Native Testing Library.

**Error Handling Not Tested:**
- What's not tested: Network errors (timeout, 500, CORS), permission errors (notifications, location, camera), storage errors (AsyncStorage full), parse errors (corrupted JSON).
- Files: All services and hooks
- Risk: Error messages may be missing or unhelpful. Partial failures silently fail. User stuck with broken state.
- Priority: Medium — add error scenario tests to service unit tests.

---

*Concerns audit: 2025-03-19*
