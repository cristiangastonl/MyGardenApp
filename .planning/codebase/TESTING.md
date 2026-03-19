# Testing Patterns

**Analysis Date:** 2025-03-19

## Test Framework

**Framework Status:**
- No test framework is configured in project (stated in CLAUDE.md: "No test framework is set up")
- No test files exist in `src/` directory
- No test scripts defined in `package.json`
- Only `typescript` devDependency for type checking

**Type Checking (Alternative to Testing):**
- `npx tsc --noEmit` - Type-check entire codebase with strict TypeScript
- Configured with `strict: true` in `tsconfig.json`
- Performs static analysis, not runtime testing

**Run Commands:**
```bash
npx tsc --noEmit              # Type-check (replaces test runner)
npx expo start                # Start dev server (manual testing)
npx expo run:ios              # Run on iOS simulator
npx expo run:android          # Run on Android device
```

## Current Testing Approach

**Manual Testing:**
- App is tested manually via Expo dev client
- Features are gated with compile-time feature flags (`Features.*`)
- Feature flags allow safe testing of incomplete features in development

**Type Safety First:**
- TypeScript strict mode catches many errors at compile time
- Strong interface definitions (`Plant`, `DiagnosisResult`, etc.) prevent runtime type issues
- All imports and function signatures are type-checked

**Example of Type Safety:**
```typescript
// From src/types/index.ts
export interface Plant {
  id: string;
  name: string;
  typeId: string;
  waterEvery: number;
  sunHours: number;
  // ... 20+ required/optional fields strictly typed
}

// Type checking ensures all Plant properties are valid
const plant: Plant = { ... };
getNextWaterDate(plant, today); // TS ensures plant has required fields
```

## Test Coverage Gaps

**Untested Areas (High Risk):**
- **Date calculation logic** - `src/utils/dates.ts` and `src/utils/plantLogic.ts`
  - Complex date math: `daysBetween()`, `getNextWaterDate()`
  - Off-by-one errors could fail silently
  - Time zone handling not tested

- **Plant health scoring** - `src/utils/plantHealth.ts`
  - Scoring algorithm with edge cases (overdue days, weather extremes, active diagnoses)
  - No verification of score calculation accuracy
  - Health level thresholds (80-100 excellent, 60-79 good, etc.) not validated

- **Data synchronization** - `src/services/syncService.ts`
  - Local ↔ database converters (`plantToDb()`, `dbToPlant()`, `noteToDb()`, etc.)
  - camelCase ↔ snake_case conversion critical, no validation
  - Partial sync failures and retry logic untested
  - JSON parsing for `photos` field could throw silently

- **API Integration** - `src/utils/plantIdentification.ts`, `src/utils/plantDiagnosis.ts`
  - Edge function invocations with image data
  - Error handling paths not validated
  - Mock fallback behavior untested
  - AbortSignal handling edge cases

- **Async Storage** - `src/hooks/useStorage.tsx`
  - SAVE_DEBOUNCE_MS (100ms) debounce logic untested
  - Data persistence and recovery scenarios
  - Migration from old storage format
  - Concurrent write safety

- **i18n Integration** - `src/i18n/index.ts`
  - Device language detection fallback
  - Language persistence across sessions
  - Interpolation of variables in translations (`t('header.hello', { name })`)
  - Missing translation key behavior

- **Platform-specific code:**
  - iOS/Android notification scheduling
  - Async storage behavior differences
  - Image picker and camera access permissions
  - File system operations

## Manual Testing Checklist

**Core Features (should test before merging):**
- [ ] Add plant - creates with correct default values
- [ ] Water plant - updates lastWatered to today, UI reflects no watering needed
- [ ] Calculate health score - changes correctly as days pass
- [ ] Sync to cloud - data persists correctly if `Features.CLOUD_SYNC` enabled
- [ ] Plant identification - edge function call succeeds with image
- [ ] Plant diagnosis - multiple images (up to 3) processed correctly
- [ ] Language switching - Spanish/English toggle works, persists on restart
- [ ] Notifications - morning reminder fires at set time
- [ ] Premium gate - paywall shows/hides for gated features correctly

**Regression Testing:**
- Date math: test plant watering schedule over month boundaries
- Health scoring: verify score changes correctly when overdue
- Photos: verify add/delete photo from plant doesn't corrupt other data
- Notes/reminders: date-based grouping works (same date formats)

## Known Testing Challenges

**Why Full Test Suite Wasn't Implemented:**
1. **React Native complexity** - Expo environment requires device/simulator, not headless
2. **Async storage mocking** - MockAsyncStorage behavior differs from real implementation
3. **Navigation testing** - React Navigation tab/screen navigation complex to mock
4. **Image processing** - Image picker, camera, and image manipulation library integration
5. **External APIs** - Supabase edge functions, PlantNet, Perenual API require mocking
6. **Styling** - React Native StyleSheet testing often skipped in favor of visual verification

## Integration Points That Need Testing (If Framework Added)

**Mocking Requirements:**

1. **Supabase Client** - `src/lib/supabase.ts`
   ```typescript
   // Would need to mock:
   supabase.from('plants').upsert(...)
   supabase.functions.invoke('diagnose-plant', ...)
   supabase.storage.from('plant-images').upload(...)
   ```

2. **AsyncStorage** - `@react-native-async-storage/async-storage`
   ```typescript
   // Would need mock implementing:
   AsyncStorage.getItem(key)
   AsyncStorage.setItem(key, value)
   AsyncStorage.removeItem(key)
   AsyncStorage.multiSet(items)
   ```

3. **i18n** - `react-i18next`
   ```typescript
   // Mock setup for different languages:
   i18n.changeLanguage('es')
   t('key.path', { variable: value })
   ```

4. **Expo APIs**
   ```typescript
   // Harder to mock:
   expo-notifications - registerForNotificationsAsync()
   expo-location - getCurrentPositionAsync()
   expo-image-picker - launchCameraAsync()
   expo-file-system - Image URI handling
   ```

## Recommended Testing Strategy (If Implemented)

**Suggested Stack:**
- **Test Runner:** Jest (React Native compatible)
- **Component Testing:** React Native Testing Library
- **Mocking:** jest.mock() for services
- **Async:** jest.useFakeTimers() for debounce/setTimeout

**Priority Order (Highest ROI first):**
1. **Utilities** (unit tests) - `dates.ts`, `plantLogic.ts`, `plantHealth.ts`
   - Pure functions, easy to test
   - High impact on core logic

2. **Services** (unit tests with mocks) - `syncService.ts`, `plantKnowledgeService.ts`
   - Mock Supabase and API responses
   - Test converters and error handling

3. **Hooks** (component tests with context) - `useStorage`, `useWeather`, `useNotifications`
   - Render hook with mocked providers
   - Test state updates and side effects

4. **Components** (snapshot + interaction) - `PlantCard.tsx`, `TaskButton.tsx`
   - Visual regression via snapshots
   - Interaction: press, toggle, etc.

5. **Integration** (E2E with real device) - Full user flows
   - Use Detox or similar for mobile E2E
   - Test real AsyncStorage and notifications

## Coverage Target (If Implemented)

**Recommended Minimums:**
- **Utilities:** 90%+ (pure functions, easy to achieve)
- **Services:** 80%+ (mocked dependencies)
- **Hooks:** 70%+ (context/provider complexity)
- **Components:** 60%+ (visual/interaction heavy)
- **Overall:** 75%+ (pragmatic for React Native)

## Feature-Specific Testing Notes

**Plant Identification (V1.1):**
- Mock edge function response with multiple plant candidates
- Test confidence scoring threshold
- Test image size validation before upload
- Mock fallback when Supabase not configured

**Plant Diagnosis (V1.2):**
- Test single and multiple image upload (up to 3)
- Mock diagnosis with various severity levels
- Test follow-up chat functionality
- Test diagnosis history persistence

**Cloud Sync (V1.1):**
- Mock Supabase auth and RLS
- Test conflict resolution when data diverges
- Test offline mode graceful degradation
- Test partial sync failures

**Notifications (MVP & V1.1):**
- Mock notification permissions (granted/denied)
- Test morning reminder scheduling
- Test weather alert scheduling
- Verify notification payloads contain correct data

## Observability for Testing (Current State)

**Console Logging for Debugging:**
- `console.log('[Feature] ...')` prefixed logs throughout
- Examples: `[Diagnosis]`, `[PlantID]`, `[Onboarding]`
- Helps with manual testing and debugging

**Feature Flag Testing:**
- `Features.*` compile-time flags can be toggled to test unfinished features
- `usePremiumGate()` can be mocked to test premium-only flows
- Example from App.tsx: `{Features.CALENDAR_TAB && <Tab.Screen ...>}`

---

*Testing analysis: 2025-03-19*
