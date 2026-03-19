# Coding Conventions

**Analysis Date:** 2025-03-19

## Naming Patterns

**Files:**
- React components: PascalCase, `.tsx` extension. Example: `PlantCard.tsx`, `AddPlantModal.tsx`
- Non-component TypeScript: camelCase, `.ts` extension. Example: `plantLogic.ts`, `dates.ts`
- Hooks: `use` prefix + PascalCase, `.tsx` or `.ts` extension. Example: `useStorage.tsx`, `useWeather.ts`
- Services: camelCase + `Service` suffix, `.ts` extension. Example: `syncService.ts`, `imageService.ts`
- Utilities: camelCase, `.ts` extension. Example: `dates.ts`, `plantHealth.ts`, `plantIdentification.ts`
- Directories: lowercase, plural for collections. Example: `src/components/`, `src/hooks/`, `src/services/`, `src/screens/`, `src/utils/`

**Functions:**
- camelCase for all functions. Example: `getNextWaterDate()`, `calculatePlantHealth()`, `formatDate()`
- Prefixed with action verb: `get`, `set`, `calculate`, `format`, `search`, `sync`, `upload`, `delete`
- Async functions return `Promise<Type>`. Example: `async function syncToCloud(...): Promise<SyncResult>`

**Variables:**
- camelCase for all variables and properties
- Boolean flags prefixed with `is` or `has`. Example: `isSupabaseConfigured()`, `hasActiveDiagnosis`
- State setter functions in React: `set` + PascalCase of state name. Example: `setPlants`, `setShowHealthDetail`, `setNotificationSettings`
- Mutable refs suffixed with `Ref`. Example: `dataRef`, `timeoutRef`

**Types:**
- Interfaces: PascalCase without `I` prefix. Example: `Plant`, `PlantCard`, `StorageState`, `DiagnosisResult`
- Type aliases: PascalCase. Example: `HealthLevel`, `IdentificationState`, `SyncStatus`
- Enum-like string unions: lowercase values. Example: `'water' | 'sun' | 'outdoor'`, `'excellent' | 'good' | 'warning' | 'danger'`
- Database types prefixed with `Db`. Example: `DbPlant`, `DbNote`, `DbReminder`, `DbUserSettings`
- Props interface suffix: `Props`. Example: `PlantCardProps`, `HeaderProps`, `StorageProviderProps`

**Constants:**
- UPPERCASE_WITH_UNDERSCORES for compile-time constants and magic numbers. Example: `SAVE_DEBOUNCE_MS`, `STORAGE_KEY`, `PERENUAL_API_BASE`
- camelCase for computed/derived constants. Example: `colors.green`, `spacing.lg`, `fonts.titleLarge`

## Code Style

**Formatting:**
- No linter or formatter configured in project (CLAUDE.md states: "No linter/formatter configured")
- Consistent indentation: 2 spaces (inferred from existing files)
- Arrow functions preferred for callbacks and simple functions
- Line length: no strict limit observed, but typically under 100 characters for readability

**Imports:**
- Import statements grouped in order:
  1. React and React Native imports
  2. Third-party libraries (navigation, i18next, etc.)
  3. Local imports (from project)
  4. Relative imports from same directory last
- Example from `src/components/PlantCard.tsx`:
  ```typescript
  import React, { useState, useMemo } from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, ... } from 'react-native';
  import { Plant, WeatherData, SavedDiagnosis } from '../types';
  import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
  import { getNextWaterDate } from '../utils/plantLogic';
  import { TaskButton } from './TaskButton';
  ```

**Path Aliases:**
- No path aliases configured; all imports are relative paths
- Standard pattern: `../` to go up directories

## Error Handling

**Patterns:**
- Try-catch blocks for async operations that can fail. Example from `src/utils/plantDiagnosis.ts`:
  ```typescript
  try {
    const { data, error } = await supabase.functions.invoke<DiagnosisResult>('diagnose-plant', {...});
    if (error) {
      console.error('[Diagnosis] Edge function error:', error);
      throw new Error(reason);
    }
    if (!data) {
      throw new Error(i18n.t('diagnosis.noResponseReceived'));
    }
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('[Diagnosis] Error:', error);
    throw new Error(error.message || i18n.t('diagnosis.diagnosisError'));
  }
  ```

- Return objects for error states in service functions. Example from `src/services/syncService.ts`:
  ```typescript
  export interface SyncResult {
    success: boolean;
    error?: string;
    syncedAt?: string;
  }
  ```

- Null checks before operations:
  ```typescript
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no está configurado' };
  }
  ```

- Graceful fallbacks for missing data (e.g., mock modes when Supabase not configured)

- Exception types:
  - Use standard `Error` class with descriptive messages
  - Check `error.name === 'AbortError'` for abort signals
  - Catch-all `catch (error: any)` pattern used throughout

**Logging:**
- Prefixed console logs with feature context in brackets. Examples:
  - `console.log('[Diagnosis] Calling edge function...')`
  - `console.error('[PlantID] API error:', error)`
  - `console.log('[Onboarding] Completing onboarding...')`
- Used for debugging API calls, state changes, and error conditions
- No log levels or structured logging library

## Internationalization (i18n)

**Framework:** react-i18next

**Pattern:**
- All UI text uses `t('key')` from react-i18next hook
- Never hardcode user-facing strings
- Translation keys use dot notation: `t('header.hello', { name })`

**Example from `src/components/Header.tsx`:**
```typescript
const { t } = useTranslation();
<Text style={styles.title}>
  {userName ? t('header.hello', { name: userName }) : t('header.appName')}
</Text>
```

**Translation files:**
- `src/i18n/locales/{en,es}/common.json` - Common UI strings
- `src/i18n/locales/{en,es}/plants.json` - Plant database translations
- `src/i18n/locales/{en,es}/tips.json` - Care tip translations
- `src/i18n/locales/{en,es}/weather.json` - Weather-related strings

## Design System

**Theme usage (required pattern):**
- All colors, fonts, spacing from `src/theme.ts`
- Never introduce new colors or font sizes
- Import from theme: `import { colors, spacing, borderRadius, shadows, fonts } from '../theme'`

**Example from `src/components/PlantCard.tsx`:**
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  },
});
```

**Accessible design:**
- `accessible={true}` and `accessibilityLabel` on interactive components
- Example: `accessibilityLabel={`${plant.name}, ${plant.typeName}...`}`

## Component Design

**Function Components:**
- Always use function components with hooks, never class components
- Props passed as destructured object
- Hooks at top level before JSX

**Example from `src/components/Header.tsx`:**
```typescript
interface HeaderProps {
  userName: string | null;
  onSettingsPress: () => void;
  seasonIcon?: string;
  seasonLabel?: string;
}

export function Header({ userName, onSettingsPress, seasonIcon, seasonLabel }: HeaderProps) {
  const { t } = useTranslation();
  // ... component logic
}
```

**Export pattern:**
- Named exports preferred: `export function ComponentName() {}`
- Component files typically have single export
- Barrel exports in `src/components/index.ts` for re-export

**Modal/Visibility Management:**
- Modals use local state visibility toggles within screens, not nested navigators
- Pattern: `useState(false)` for modal visibility, pass callbacks to toggle

**Feature Gating:**
- Check `Features.*` constant and `usePremiumGate()` before rendering gated UI
- Example from `App.tsx`:
  ```typescript
  {Features.CALENDAR_TAB && (
    <Tab.Screen name="Calendario" component={CalendarScreen} options={{...}} />
  )}
  ```

## Type System

**TypeScript Configuration:**
- `strict: true` enabled in `tsconfig.json`
- All code must pass strict type checking
- No `any` types except in error handling: `catch (error: any)`

**Pattern for optional properties:**
- Use `PropertyName?:` syntax for optional props and object fields
- Example: `imageUrl?: string`, `diagnosisId?: string`, `note?: string`

**Union types for state:**
- Status fields use union types
- Example: `type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline'`

**Type exports from index files:**
- Main types exported from `src/types/index.ts`
- Database types in `src/types/database.ts`
- Re-exported in index: `export * from './database'`

## Comments and Documentation

**When to comment:**
- Complex algorithms with non-obvious logic
- Business rules that aren't self-evident
- Edge cases and workarounds
- Function purpose if not clear from name

**Example from `src/utils/plantHealth.ts`:**
```typescript
/**
 * Calculates the health status of a plant based on its care history and weather conditions.
 *
 * Health calculation:
 * - Base: 100 points
 * - -20 if overdue for watering
 * - -10 per extra day overdue (max -30 additional)
 * ...
 */
export function calculatePlantHealth(...): PlantHealthStatus {
```

**JSDoc style:**
- Triple-slash comments with description
- Document parameters and return types for public functions
- Rarely used; inline comments more common

## Function Design

**Size guideline:**
- Utility functions: 10-30 lines typical
- Component functions: 50-200 lines typical (includes JSX)
- Screen components: 200-700 lines (TodayScreen is 676 lines)

**Parameter count:**
- Prefer object parameter with destructuring over multiple params
- Example: `export function calculatePlantHealth(plant: Plant, today: Date, weather: WeatherData | null, diagnoses?: SavedDiagnosis[]): PlantHealthStatus`

**Return values:**
- Explicit return types on all public functions
- `Promise<T>` for async functions
- Union types for multiple possible outcomes
- Result objects for functions that can fail: `{ success: boolean; error?: string; data?: T }`

## Module Design

**Exports:**
- Named exports preferred over default exports
- Re-exported in barrel files (`index.ts`) for convenience
- Example from `src/components/index.ts`: exports ~40 components

**Barrel files:**
- `src/components/index.ts` - Re-exports all components
- `src/hooks/index.ts` - Re-exports all hooks
- Simplifies imports across codebase

## Reusable Patterns

**Context + Hook pattern (used for StorageProvider):**
```typescript
interface StorageContextType = StorageState & StorageActions;
const StorageContext = createContext<StorageContextType | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  // ... implementation
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
```

**Date handling utility pattern:**
- Export pure functions for date math
- Example from `src/utils/dates.ts`:
  ```typescript
  export const formatDate = (d: Date): string => ...
  export const parseDate = (s: string): Date => ...
  export const isSameDay = (a: Date, b: Date): boolean => ...
  export const addDays = (d: Date, n: number): Date => ...
  export const daysBetween = (a: Date, b: Date): number => ...
  ```

**Debounce pattern for frequent updates:**
- Example from `useStorage.tsx`:
  ```typescript
  const SAVE_DEBOUNCE_MS = 100;
  // Used with debounce timeout for AsyncStorage writes
  ```

---

*Convention analysis: 2025-03-19*
