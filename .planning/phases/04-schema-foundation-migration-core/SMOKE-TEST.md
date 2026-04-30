# Phase 4 — Manual Smoke Test Protocol

Run before declaring Phase 4 ship-ready. Tests run on a real low-end Android device (Pixel 3a-class or older) AND a real iOS device. Sign off below per scenario.

## Pre-flight
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run check:legacy-fields` exits 0
- [ ] `npm run smoke:migration` exits 0
- [ ] Build a v1.0 fixture build (use git checkout of last v1.0 tag) and install on test device
- [ ] Populate 50 plants in v1.0 build (use Settings dev tool OR sideload `tests/fixtures/v0-app-data.json` via dev console: `AsyncStorage.setItem('plant-agenda-v2', JSON.stringify(fixture))`)

## Scenario 1 — Happy-path migration (SCHEMA-01, SCHEMA-04, SCHEMA-05, UX-01)
Steps:
1. With v1.0 fixture data populated, OTA-upgrade to v1.1 build (or sideload v1.1 over v1.0).
2. Cold launch the app from device launcher.
3. Observe launch — there should be NO white flash, NO splash beyond the existing one, NO error banner.
Expected:
- [ ] App opens directly to Hoy / Plantas with all 50 plants visible
- [ ] Open any plant → MyPlantDetailModal shows the migration tooltip ONCE
- [ ] Dismiss tooltip → reopen same plant → tooltip is gone
- [ ] Open a different plant → tooltip shows again (per-plant)
- [ ] In Supabase analytics_events table (or `__DEV__` console): `migration_started` event fired ONCE with `{ plantCount: 50 }`
- [ ] `migration_completed` event fired ONCE with `{ plantCount: 50, durationMs: <200, schemaVersionFrom: 0, schemaVersionTo: 1 }`

## Scenario 2 — Kill mid-migration (SCHEMA-02, SCHEMA-07)
Steps:
1. Same fixture setup as Scenario 1.
2. Cold launch v1.1 build.
3. Within 1 second of launch (before splash dismisses), force-kill the app from recent-apps.
4. Cold launch again.
Expected:
- [ ] App opens normally — either fully migrated OR shows the legacy-data banner
- [ ] If banner shown: tap into a plant, edit a name, kill app, reopen — change persisted (legacy reads still working)
- [ ] AsyncStorage backup key `plant-agenda-v2.backup-pre-v1.1` exists (verify via dev console: `AsyncStorage.getItem('plant-agenda-v2.backup-pre-v1.1')` returns the original v1.0 blob exactly)

## Scenario 3 — Idempotency (SCHEMA-03)
Steps:
1. After Scenario 1 completes successfully, kill app.
2. Cold launch v1.1 build again.
3. Check analytics events.
Expected:
- [ ] NO `migration_started` event on this second launch (envelope short-circuits)
- [ ] App opens with same plant data, no UI change
- [ ] Bytes-on-disk for `plant-agenda-v2` are identical to before launch (within JSON key-order stability tolerance)

## Scenario 4 — Notification reschedule (SCHEMA-06)
Steps:
1. Pre-migration: in v1.0 build, ensure morning reminder is enabled and a few sun-needing plants exist. Run `getAllScheduledNotificationsAsync()` via dev console; record count and dump payloads.
2. Upgrade to v1.1 and launch (Scenario 1 setup).
3. Wait for the morning-reminder reschedule (App-level effect, runs immediately after migration sets `migrationJustHappened`). Verify `getScheduledNotificationCounts()` shows non-zero `morning` count.
4. Open the Hoy tab. The TodayScreen mounts and `useNotifications` schedules sun notifications once weather has loaded (typically 1-3 seconds after first opening Hoy). Wait for this, then re-run `getScheduledNotificationCounts()`.
Expected:
- [ ] Immediately post-migration: `morning` count > 0 (App-level reschedule wired the morning reminder)
- [ ] After Hoy tab opens and weather loads: `sun` count > 0 (TodayScreen's existing `useNotifications` hook scheduled sun reminders against migrated `lightLevel`)
- [ ] No notification's `data` payload contains `sunHours` references
- [ ] `isNotificationsAvailable()` returns `true` (proves no silent disable from CRIT-3)
- [ ] NOTE: sun notifications are NOT scheduled by the App-level effect (would be a no-op without weather). They schedule on the existing TodayScreen weather-loaded path — this is the correct flow.

## Scenario 5 — Forced migration failure (SCHEMA-07)
Steps:
1. Build v1.1 with `__DEV__ && process.env.FORCE_MIGRATION_FAIL === '1'` flag enabled (set via `npx expo start --dev-client` env var). The dev build must throw inside `migratePlant_0to1` when this flag is set (Wave 2 task adds this dev-only hook).
2. Cold launch.
Expected:
- [ ] Failure banner visible above tabs ("Tu jardín está cargando con datos antiguos" / "Your garden is loading with older data")
- [ ] App is fully usable — can open plants, create plants, edit, diagnose
- [ ] AsyncStorage live key `plant-agenda-v2` is UNTOUCHED (still v1.0 unwrapped shape)
- [ ] `migration_failed` analytics event fired with `{ stage: 'load' }` payload (per simplified stage contract — load covers read/parse/transform pre-write; reschedule remains a separate stage)

## Performance Gate (SCHEMA-04)
- [ ] On Pixel 3a-class device with 50 plants: `migration_completed.durationMs` < 200ms
- [ ] No splash flash visible to the human eye
- [ ] Launch-to-first-paint not perceptibly slower than v1.0 build

## Sign-off
- [ ] All scenarios pass on iOS
- [ ] All scenarios pass on Android (low-end)
- [ ] Phase gate approved by: ________ on ________
