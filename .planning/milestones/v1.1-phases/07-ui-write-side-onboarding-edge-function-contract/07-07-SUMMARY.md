---
phase: 07-ui-write-side-onboarding-edge-function-contract
plan: "07"
subsystem: ui-location-surfaces
tags: [location-banner, climate-override, settings-panel, today-screen, loc-02, loc-03, loc-04, loc-05]
dependency_graph:
  requires:
    - "ClimateOverride type + useStorage wiring (Plan 07-01)"
    - "getEffectiveSeason SSOT (Plan 07-02)"
    - "today.locationBanner.* + settings.climateOverride.* i18n keys (Plan 07-03)"
  provides:
    - "src/components/LocationBanner.tsx — light-blue dismissible soft banner (LOC-02)"
    - "TodayScreen renders LocationBanner between WeatherWidget and WeatherAlerts with per-session dismiss"
    - "SettingsPanel 'Zona climática' 4-option segmented picker calling setClimateOverride (LOC-04, LOC-05)"
  affects:
    - "Phase 7 location story complete (LOC-02..05 satisfied)"
tech_stack:
  added: []
  patterns:
    - "LocationBanner: dismiss via useState(false) in TodayScreen — NOT AsyncStorage (Pitfall 8 lock)"
    - "SettingsPanel directly consumes useStorage() for climateOverride — parallel to existing patterns"
    - "4-pill flexWrap segmented control for climate zone picker (same pattern as language pills in OnboardingScreen)"
key_files:
  created:
    - "src/components/LocationBanner.tsx"
  modified:
    - "src/screens/TodayScreen.tsx"
    - "src/components/SettingsPanel.tsx"
decisions:
  - "LocationBanner placed inside TodayScreen ScrollView (not App-level like MigrationBanner) — banner is Hoy-tab-specific nudge per Pitfall 4 lock"
  - "Dismiss flag is local useState(false) only — banner reappears on next launch per CONTEXT.md per-session spec (Pitfall 8 lock)"
  - "SettingsPanel imports useStorage() directly (parallel hook consume) — avoids prop threading through SettingsScreen → SettingsPanel for climateOverride"
  - "4-option pill array uses as const + .map() with template literal t() interpolation — single render path for all 4 options"
metrics:
  duration: "~29 min"
  completed: "2026-05-01"
  tasks_completed: 3
  files_modified: 3
---

# Phase 7 Plan 7: LocationBanner + SettingsPanel Climate Override Picker Summary

Phase 7 final UI surfaces: `LocationBanner` soft nudge component for TodayScreen (per-session dismiss, light-blue accent, LOC-02/03) + `SettingsPanel` Zona climática 4-option segmented picker wired to `setClimateOverride()` (LOC-04/05).

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create LocationBanner component | 14e1f37 | src/components/LocationBanner.tsx |
| 2 | TodayScreen — render LocationBanner with hide condition + dismiss state | cd646a7 | src/screens/TodayScreen.tsx |
| 3 | SettingsPanel — add Zona climática 4-option segmented subsection | e9479f4 | src/components/SettingsPanel.tsx |

## Artifact Details

### LocationBanner (src/components/LocationBanner.tsx — 101 lines)

Light-blue accent banner with:
- Props: `onCtaPress: () => void` + `onDismiss: () => void`
- `t('today.locationBanner.body')` + `t('today.locationBanner.cta')` from Plan 07-03 keys
- `colors.infoBg` / `colors.infoText` (matches prefilledBanner pattern in AddPlantModal)
- 44pt touch targets: `cta` style has `minHeight: 44`; `dismiss` has `width: 44, height: 44`
- Single-row layout: 📍 icon + flex body text + CTA button + × dismiss button

### TodayScreen Visibility Condition (verbatim)

```jsx
{location === null && (climateOverride ?? 'auto') === 'auto' && !locationBannerDismissed && (
  <LocationBanner
    onCtaPress={() => navigation.navigate('Ajustes' as never)}
    onDismiss={() => setLocationBannerDismissed(true)}
  />
)}
```

Placement: immediately after `<WeatherWidget>`, before `{/* Weather Alerts */}` (verified line order in file).

### SettingsPanel Section Placement

Inserted at line 489 (before the `{/* Notifications Section */}` comment), immediately after the closing `</View>` of the existing Location section (line 488). Insertion point: `SettingsPanel.tsx` around former line 489.

### Dismiss-via-useState Confirmation (NO AsyncStorage)

```bash
grep -c "AsyncStorage.*location-banner|location-banner.*AsyncStorage" src/screens/TodayScreen.tsx
# Output: 0
```

Banner dismiss is purely `useState(false)` local to TodayScreen. Resets to `false` on every app launch. Matches CONTEXT.md per-session spec and Pitfall 8 lock.

### 4-Option Pill Array Order Verification

```typescript
(['auto', 'northern', 'southern', 'tropical'] as const).map((opt) => { ... })
```

Order: Auto → Norte templado → Sur templado → Tropical (matches LOC-04/05 picker spec). Labels via `t(\`settings.climateOverride.${opt}\`)` interpolation.

## Verification Results

- `npx tsc --noEmit` — exits 0 (project-wide green)
- `node scripts/smoke-phase07.mjs` — Phase 7 smoke: PASS 82/82 (unchanged — no new assertions needed; Plan 07-03 already covers i18n key existence)
- `node scripts/smoke-phase06.mjs` — Phase 6 smoke: PASS 82/82 (regression preserved)
- `node scripts/migration-smoke-test.mjs` — Migration smoke: PASS 106/106 (regression preserved)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/components/LocationBanner.tsx (export function LocationBanner: count=1; touch targets: minHeight: 44 + height: 44 count=2)
- FOUND: src/screens/TodayScreen.tsx (LocationBanner count=4; locationBannerDismissed+setter=3 lines; visibility condition=1; AsyncStorage banner grep=0)
- FOUND: src/components/SettingsPanel.tsx (settings.climateOverride.title+.body=2; setClimateOverride=2; climateOptionPill=3; minHeight: 44=1; 4-option array=1)
- Commits: 14e1f37, cd646a7, e9479f4 — all present in git log
- tsc --noEmit: exits 0; smoke-phase07: 82/82; smoke-phase06: 82/82; migration-smoke: 106/106
