# Domain Pitfalls — v1.1 Precision Care

**Domain:** Schema migration + behavioral model change in a live local-first React Native app with real production users
**Researched:** 2026-04-29
**Scope:** Pitfalls specific to ADDING precision care features (light levels, seasonal watering, soil-check mode, hemisphere/season, diagnosis continuity, catalog rebalance) to the existing My Happy Garden app — NOT generic mobile/RN advice

> **Read this first.** This document is opinionated. Each pitfall is concrete, has a detection signal, a prevention you can actually test, and a phase placement. The roadmap should map each pitfall to a milestone gate (migration phase / feature phase / verification / post-ship).

---

## Critical Pitfalls

These cause data loss, support fires, or rewrites if missed.

### CRIT-1: Migration runs partially, app is killed mid-write, user loses plants

**What goes wrong:**
The current `useStorage` writes the entire `AppData` blob to a single AsyncStorage key (`'plant-agenda-v2'`) under a 100ms debounce. A migration that maps `sunHours → lightLevel` and `waterEvery → waterSchedule` for every plant must rewrite the entire blob. If the user backgrounds the app or the OS kills the process while the migration `setItem` is in flight (or worse, between read and write), they end up with: pre-migration blob still on disk, in-memory state already mutated, and on next launch — the load handler in `useStorage.tsx:144` reads the OLD blob silently, treating new fields as missing.

**Why it happens:**
- AsyncStorage write is async and not atomic from the user's perspective (RN bridge → native → SQLite/leveldb)
- The 100ms debounce means there is always a window where in-memory state and on-disk state diverge
- No migration version marker exists in the current `AppData` schema — there is no way to detect "did migration finish?" on next launch
- The `useStorage` load path silently swallows missing fields with `|| []` / `|| {}` defaults — a half-migrated record looks identical to a not-yet-migrated record

**Consequences:**
- Plants reset to default care schedules silently, user thinks app is broken
- Worst case: user customized `waterEvery` for a plant, migration overwrote with `waterSchedule.warm/cold` defaults from catalog mapping, original value lost
- Worst case 2: user opens TestFlight build, migration runs but doesn't commit, then opens stable build — schema version mismatches cause type errors

**Prevention (testable, not vague):**
1. **Add `schemaVersion: number` to `AppData`** at top level. Default `0` for legacy blobs (missing field).
2. **Migration runs as a single atomic transaction:** read blob → migrate in memory → write NEW blob with `schemaVersion: 1` → only after `setItem` resolves do we set `loading: false` in storage provider. NOT debounced. NOT optimistic.
3. **Backup-before-migrate:** before writing migrated blob, write a copy to key `'plant-agenda-v2.backup-pre-v1.1'`. Keep for one app version then delete.
4. **Test by killing the app:** in dev, install pre-migration build, create test data, sideload v1.1 build, force-kill during launch, verify data on relaunch.
5. **Migration must be idempotent:** running it twice on already-migrated data is a no-op (check `schemaVersion >= 1` first).
6. **Add structured log/analytics event:** `migration_started`, `migration_completed`, `migration_failed` so we can detect crashes in production via analytics rate.

**Detection signals in production:**
- Spike in `migration_failed` analytics events
- Drop in `plants_with_lightLevel_set / total_plants` ratio (should be ~100% post-migration)
- Support tickets mentioning "my schedules reset" within 48h of v1.1 release

**Phase placement:** **Migration phase (must complete before any feature work).** Block any v1.1 feature that touches Plant fields until schemaVersion infrastructure is shipped. Verification gate: simulate kill-during-migration on real device.

**Confidence:** HIGH — directly observable from `useStorage.tsx:144-207` load logic.

---

### CRIT-2: Old field kept "just in case" → tech debt forever, dual-source-of-truth bugs

**What goes wrong:**
Tempting "safe" approach: keep `sunHours: number` AND add `lightLevel`, keep `waterEvery: number` AND add `waterSchedule`. Sounds like backward compat. Reality: every read site (`plantHealth.ts`, `plantLogic.ts:13-28`, `notificationScheduler.ts:533, 732`, plant card UI, edit modal, etc.) now has to choose which field to trust, and over time half use one and half use the other. Catalog seed says one thing, user override says another, computed task says a third.

**Why it happens:**
- Risk-aversion at migration time
- "We'll remove old field next release" — but next release adds another concern, old field stays
- No single owner for "this is how watering interval is computed"

**Consequences:**
- `getNextWaterDate(plant)` (plantLogic.ts:4) uses `plant.waterEvery`, but a new "next watering" widget uses `waterSchedule.warm` — they disagree → user sees two different "next watering" dates
- `scheduleSunWindow(plant.sunHours * 3600 * 1000)` (notificationScheduler.ts:533) keeps using stale `sunHours` while plant card shows new "Bright indirect" badge → notification body says "needs 4hs of sun" for a plant the user told the app needs "low light"

**Prevention:**
1. **One-way migration, then delete.** After migration completes, the old field MUST be removed from the in-memory `Plant` type AND from the persisted blob. Migration writes new schema, period.
2. **TypeScript will catch the rest.** Remove `sunHours: number` and `waterEvery: number` from `Plant` type in `src/types/index.ts`. The compiler will surface every read site. Fix or delete each.
3. **Keep old field on `PlantDBEntry` (catalog)** ONLY as a `_legacySunHours` / `_legacyWaterDays` private field used by the migration mapper, never read at runtime. Better: derive at build time and never persist.
4. **Add an ESLint rule or grep guard in CI:** any reference to `.sunHours` or `.waterEvery` outside the migration file fails the type-check (since the field is gone, the project won't compile).

**Detection signals:**
- Any PR that reintroduces `plant.sunHours` outside `migrations/` should fail type-check
- A code review checklist: "does this read either of the old fields?"

**Phase placement:** **Migration phase + feature phase.** Migration removes old fields. Feature phase rebuilds anything that read them on top of the new model.

**Confidence:** HIGH — pattern observed at notificationScheduler.ts:533, 732, 880 — all read `sunHours`/`tempMin` directly today.

---

### CRIT-3: Notification reschedule not triggered after schedule-shape change

**What goes wrong:**
v1.0 has scheduled notifications already alive on user devices: morning reminders, follow-up diagnosis reminders (`scheduleFollowUpReminder` in notificationScheduler.ts:305), care reminders, weather alerts, sun-window notifications. Their **trigger times were computed from old `waterEvery` and `sunHours` values**. After migration to seasonal schedules, the in-memory plant says "water every 5 days in warm season" but the OS-level scheduled notification still fires on the OLD interval (e.g. every 7 days).

For sun-window notifications it is even worse: `calculateSunWindow` uses `plant.sunHours * 60 * 60 * 1000` (notificationScheduler.ts:533). Migration changes `sunHours` to nothing — the function will throw or return `NaN` if not refactored, killing all sun notifications silently because of the global try/catch that calls `markNotificationsUnavailable()`.

**Why it happens:**
- Notifications live in the OS, not in app state
- `scheduleNotificationAsync` returns an identifier that gets stored in plant data; if you change the trigger logic but don't cancel + reschedule, OS keeps the old one
- The `notificationsAvailable` global flag (notificationScheduler.ts:17) silently disables ALL notifications on first error — a single migration-related throw in sun-window calc kills the whole notification subsystem

**Consequences:**
- User sees stale "Regar Monstera (4hs sol)" reminder for a plant they just changed to "low light"
- Sun notifications stop firing entirely after first migration (silent failure via `markNotificationsUnavailable`)
- Follow-up diagnosis reminders may also be affected if they reference plant fields that changed

**Prevention:**
1. **As part of migration, call `cancelAllNotifications()` then re-run the daily scheduling pass** with new model values. Treat OS notifications as cache, not source of truth.
2. **Refactor `calculateSunWindow` and `groupPlantsBySunHours`** (notificationScheduler.ts:524, 548) to take `lightLevel` and translate to a recommended hour-band per level (e.g. `direct: 4-6h`, `bright_indirect: 0h direct sun, all-day window`, `medium_indirect: morning only`, `low: no outdoor schedule`). Verify each level path doesn't throw.
3. **Remove the global "first error disables all" pattern** — at minimum, log which call failed before disabling. The current `markNotificationsUnavailable(error)` swallows the cause.
4. **Add a dev-only "show all scheduled notifications" debug screen** to verify post-migration that body text matches new schedule.
5. **Test matrix:** plant in `direct` mode in summer (warm), plant in `low` mode in winter (cold), plant in `soil_check` mode (should NOT schedule water reminders at all? — see CRIT-5).

**Detection signals:**
- After migration, `getScheduledNotificationCounts` (notificationScheduler.ts:411) should NOT show care reminders with intervals matching old `waterEvery`
- `notificationsAvailable === false` after migration on a device where it was true before
- Support: "I changed my plant to low light but it still tells me to put it in the sun"

**Phase placement:** **Migration phase + feature phase.** Cancel-all-and-reschedule is part of migration completion. Refactoring sun/light scheduling logic is part of light-level feature phase. Verification: run pre/post migration on real device, count and inspect scheduled notifications.

**Confidence:** HIGH — read directly in notificationScheduler.ts.

---

### CRIT-4: Modal stacking — paywall opened from nested modal closes only the paywall

**What goes wrong:**
The "Continue diagnosis" button lives inside `DiagnosisDetailModal`, which itself is presented from `MyPlantDetailModal`. When a free user taps Continue and the paywall opens, **iOS modal stack semantics** dismiss only the topmost modal on close. Result: paywall closes, the user is back inside `DiagnosisDetailModal`, and (if `usePremiumGate.canSendChatMessage` is reactive) they may either be unable to interact, or the flow proceeds before the underlying modal finished re-rendering with the new premium state.

The handover note explicitly says: "we just hit this exact bug elsewhere — mention as known pattern."

**Why it happens:**
- React Native `Modal` uses native presentation; nested Modals stack on iOS but Android handles them with overlay z-index — behavior is platform-divergent
- The premium-gate hook's value updates async (RevenueCat callback), so a simple `if (isPremium)` re-check after paywall close races the modal animation
- CLAUDE.md confirms the design rule: "No nested navigators — All modals use local state visibility toggles within screens" — but local-state toggles don't auto-coordinate across siblings

**Consequences:**
- User pays, comes back, has to tap Continue a second time — looks broken
- Or worse: `canSendChatMessage` returns `true` immediately on RevenueCat callback but the chat input is still disabled because the parent modal hasn't re-rendered

**Prevention:**
1. **Lift the paywall presentation to a single top-level component** (App-level paywall context, similar to existing `NotificationContext` pattern noted in CLAUDE.md / PROJECT.md). When any flow needs the paywall, it dispatches via context. Paywall renders at root. No modal stacking.
2. **Continue-after-purchase flow is a deferred callback**, not a re-check. Caller passes `onContinueAfterPurchase: () => ...` to the paywall context; paywall calls it AFTER both the modal animation completes AND the RevenueCat customerInfo update has been observed.
3. **Test matrix is mandatory:** iOS + Android × free user mid-conversation × user who upgrades × user who cancels purchase. Verify the modal returns the user to the chat with the correct premium state visible.
4. **Reuse the existing v1.0 NotificationContext deep-link pattern** — that already solves "deep link into a nested modal flow" cleanly per PROJECT.md context. Don't reinvent.

**Detection signals:**
- Manual QA test: free user opens past diagnosis → Continue → paywall → close without buying → expected: stays in `DiagnosisDetailModal` with Continue still visible. Bug if either modal disappears unexpectedly OR paywall lingers.
- Free user opens past diagnosis → Continue → paywall → buys → expected: paywall closes, returns to chat, send button enabled, no second tap needed.

**Phase placement:** **Diagnosis-continuity feature phase.** This is the highest-risk piece of the milestone for premium revenue (a broken purchase loop = lost conversion). Verification phase: dedicated paywall regression checklist.

**Confidence:** HIGH — pattern explicitly flagged in handover, premium hook structure confirmed in `src/config/premium.ts:18-66`.

---

### CRIT-5: Soil-check mode notifications don't translate to scheduled push

**What goes wrong:**
The new `waterMode: 'fixed' | 'soil_check'` mode is for cacti and succulents where "water every N days" is dangerous advice. But the existing notification model assumes a date-triggerable schedule: `scheduleNotificationAsync({ trigger: { seconds: ... } })` (notificationScheduler.ts:289). What does a "soil_check" plant get? Options:
1. No notifications → user forgets the plant → dies of slow neglect
2. Notification every N days that says "Check your plant's soil" → but that is essentially fixed mode wearing a costume; user gets desensitized
3. Adaptive interval based on weather (humidity / temperature) → not currently supported by `getNextWaterDate`

The current `getNextWaterDate` in plantLogic.ts:4-11 returns `today` if `waterEvery <= 0`, then keeps adding `waterEvery` days. There is no concept of "indeterminate next watering."

**Why it happens:**
- Soil-check is fundamentally a behavior signal ("the plant tells you, not the calendar") that does not have a natural notification trigger
- Mixing soil-check plants with fixed plants in one user's garden creates UI inconsistency in the "Hoy" tab — half tasks have a clear due date, half don't

**Consequences:**
- Cacti/succulents get over-watered because the app keeps reminding (defeats the entire feature)
- OR the app silently never reminds, user complains "you forgot about my cactus"
- Health score (plantHealth.ts:40-64) penalizes "overdue water" — soil-check plants are perpetually "overdue" or perpetually "fine" depending on default, both wrong

**Prevention:**
1. **Soil-check plants get a low-frequency *check-in* notification (e.g. weekly or biweekly), not a watering reminder.** Body text: "Tocá la tierra de tu Cactus — si está seca 5cm hacia abajo, regalo." Action button: "Registrar riego" or "Aún seca, recordame en 3 días."
2. **Health score for `waterMode === 'soil_check'` plants does NOT penalize for overdue watering at all.** Document this in `plantHealth.ts` with a clear comment referencing the design decision. Their health is driven by other factors (weather extremes, light mismatch, diagnoses).
3. **In "Hoy" tasks, soil-check plants surface only when the check-in date is reached, with a different task type** (`type: 'check_soil'` distinct from `type: 'water'`) so the UI can render a different verb and a confirm/snooze flow.
4. **Onboarding copy** when a user picks a cactus must explain: "Esta planta no tiene un calendario fijo. Te avisamos para chequear, no para regar." — set the expectation up front.

**Detection signals:**
- Health score dashboard for a test cactus over 30 days should never go below 80 from watering alone
- "Hoy" screen for a user with only soil-check plants on a non-check-in day shows zero water tasks (not "overdue: cactus")

**Phase placement:** **Watering-feature phase + verification.** This is the trickiest UX piece — needs dedicated copy review and a multi-day device test.

**Confidence:** HIGH for the structural problem; MEDIUM for the exact UX copy (needs validation with real users).

---

## Moderate Pitfalls

These cause embarrassing bugs but not data loss.

### MOD-1: Equator and tropical users have no meaningful "warm/cold" split

**What goes wrong:**
The `waterSchedule: { warm, cold }` model assumes a real seasonal swing. In Quito, Singapore, Nairobi, Manaus — temperature varies by 3-5°C across the year. Mapping "current month → warm/cold" produces nonsense flips. A user in Quito would get "warm season" all year, which is fine — but a user in Bogotá at 2600m altitude has consistent 14°C — perpetually "cold" by a naive mapping, but plants there don't slow down because there is no seasonal dormancy.

**Why it happens:**
- Hemisphere-month mapping is a Northern/Southern hemisphere concept that breaks at low latitudes
- "Tropical" is a climate concept, not a hemisphere concept

**Prevention:**
1. **Three zones, not two hemispheres:** Northern temperate (lat > ~23.5°N), Southern temperate (lat < ~23.5°S), Tropical (between). Tropical zone uses a single schedule (the "warm" one), no seasonal flip. Catalog entries can declare `waterSchedule: { warm: 7 }` (no `cold`) for tropical-suited plants, or both for temperate.
2. **Edge case: equator (lat ≈ 0)** falls into tropical zone naturally. No special handling needed.
3. **Allow user override:** Settings → "Climate zone: Northern / Southern / Tropical / I'll choose per plant." Default detected from location, manually overridable.
4. **Catalog test data:** include plants where this matters (e.g. tropical houseplant doesn't change schedule; temperate fruit tree does) and unit-test the zone-classification function with lat=0, lat=23, lat=24, lat=-23, lat=-24.

**Detection signals:**
- Test user with location set to Singapore (1.35°N) sees same schedule year-round
- Test user with location set to Buenos Aires (34.6°S) sees schedule flip in March/September

**Phase placement:** **Hemisphere/season feature phase.** Add tropical zone from day one, not "we'll add it later" — adding a third zone retroactively requires migrating user preferences.

**Confidence:** HIGH on the structural issue, MEDIUM on the latitude threshold (23.5° is the Tropic of Cancer/Capricorn but climate boundaries are fuzzier — could go with 20° or 25° based on Köppen-ish heuristic).

---

### MOD-2: Season transition jitters on March 21 / September 21

**What goes wrong:**
If "warm season" is defined by month range (e.g. Northern: April-October warm, November-March cold), the schedule flips abruptly at midnight March 31 → April 1. A user wakes up on April 1 and the next-watering date jumps from "in 3 days" to "in 5 days" (or vice versa) with no explanation. Worse, if defined by astronomical equinox (March 21), users in different time zones flip on different local dates, leading to support questions.

The user-prompt also calls out March 21 vs March 22 — the exact equinox date varies (Mar 19-21 depending on year and time zone).

**Why it happens:**
- Discrete boundaries on continuous phenomena
- No transition smoothing
- Time zone math + astronomy = bugs

**Prevention:**
1. **Use month-based zones, not equinox-based.** Northern: warm = April-September (months 4-9), cold = October-March. Southern: inverted. Easy to reason about, no time zone edge cases. Document in code comment: "approximation, not astronomical."
2. **Show the user what season the app thinks it is.** A small badge in plant detail: "Verano · regando cada 5 días". When the season flips, the user sees the new label and the new interval at the same time — no mystery.
3. **Smooth the transition (optional, can defer):** in the boundary month (March/September depending on hemisphere), interpolate. E.g. `cold=10d, warm=7d` → mid-September: `8.5d` rounded to 9d. Adds complexity, only do if user testing reveals abruptness as a complaint.
4. **Test:** unit test for every month × hemisphere combination. Just 24 cases. Snapshot the expected season label.

**Detection signals:**
- A plant's "next watering" date should never jump by more than 1 cycle when the season flips (i.e. if `cold=10d` and `warm=7d`, the next-watering date should change by at most 3 days)
- No support tickets about "my schedule changed overnight"

**Phase placement:** **Season feature phase.** Pin design decision early.

**Confidence:** HIGH on the issue, HIGH on the recommended solution (month-based is industry standard for consumer apps).

---

### MOD-3: User customized `sunHours` for a plant; migration overwrites with catalog default

**What goes wrong:**
User has Monstera (slug `monstera`). The catalog entry says `sunHours: 3`. But the user manually set `sunHours: 5` last month because their apartment is dim and they wanted longer windows. Migration runs and maps "catalog sunHours 3 → bright_indirect" without checking what the user actually saved. User's customization is silently lost.

**Why it happens:**
- Migration mapper most likely uses `plant.id` to look up catalog and derive lightLevel
- Forgets that `plant.sunHours` is per-plant-instance, not per-catalog-entry — it diverges over the user's lifetime

**Prevention:**
1. **Migration maps per-instance, not per-catalog.** `lightLevel = mapSunHoursToLight(plant.sunHours)` where the mapper uses the user's actual stored value (not the catalog default).
2. **Mapping table** — concrete and testable:
   - `sunHours <= 1` → `low`
   - `sunHours <= 3` → `medium_indirect`
   - `sunHours <= 5` → `bright_indirect`
   - `sunHours > 5` → `direct`
3. **Add a one-time post-migration in-app message:** "Cambiamos cómo medimos la luz. Tu Monstera ahora está marcada como Luz brillante indirecta. Podés cambiarla en cualquier momento." — sets expectations that this is a translation, not a reset.
4. **Spot-check migration with real users:** before rolling to 100%, run on dev account that has actually-used data, verify customizations preserved.

**Detection signals:**
- After migration, plants where `oldSunHours > catalogSunHours` should map to a higher light level than the catalog default
- Snapshot test: feed the migration a plant with custom `sunHours: 6` whose catalog entry has `sunHours: 2`, expect output `lightLevel: 'direct'`

**Phase placement:** **Migration phase.** This is part of the mapper, must be right before any user runs it.

**Confidence:** HIGH on the issue, HIGH on the prevention.

---

### MOD-4: Resumed diagnosis loses image context, AI hallucinates

**What goes wrong:**
"Continue diagnosis" reopens an old chat. The AI receives the full text history. But the original photo(s) the user uploaded are referenced in the chat as image messages. Edge functions (`chat-diagnosis`, `diagnose-plant`) typically pass images inline as base64 or URLs. If photos were uploaded only as attachments in the original turn and not persisted as URLs accessible in the resume request, the resumed AI sees text like "the user sent a photo showing yellow leaves" but no actual image — and may invent or contradict the original analysis.

Worse: if the original analysis said "moderate severity, leaf spot" but the resumed AI re-evaluates without the photo and says "looks fine, healthy" — the user is now confused and might dismiss a real problem.

**Why it happens:**
- AsyncStorage isn't a great place to store image bytes — they're in `PlantPhoto.uri` which may be a local file path that no longer exists if the user deleted/cleared cache
- The image was sent to the edge function once and the response was saved; the image itself may not be in `SavedDiagnosis`
- AI re-prompted with text-only context can drift

**Prevention:**
1. **Diagnosis chat continuity is explicitly text-only.** UI should display: "Continuando diagnóstico anterior. Para una reevaluación visual, sacá una foto nueva." Don't pretend the AI can see the original photo.
2. **The system prompt for resumed conversations** must include: "User is continuing a previous diagnosis. Your prior assessment was: [summary]. The user is asking for follow-up advice. Do NOT re-assess severity unless they upload a new photo."
3. **If a new photo IS uploaded mid-resume**, treat it as a re-diagnosis, possibly with a UX confirm: "Reevaluar el problema con esta foto nueva?" — explicit, not silent.
4. **Persist the original image URL** to a stable location (Supabase Storage when cloud sync ships, or document directory in the meantime) so even if cache is cleared, the photo stays. Alternative: ship without this and accept image loss, but document explicitly in chat.

**Detection signals:**
- Resume an old diagnosis on a fresh app install (no local images) — does the AI behave coherently?
- Look at the prompt sent to the edge function in dev logs for a resumed chat — does it correctly indicate "continuation" mode?

**Phase placement:** **Diagnosis-continuity feature phase.** Prompt design and UX copy are part of feature work, not migration.

**Confidence:** MEDIUM — depends on edge function implementation details I haven't read. Worth verifying with `chat-diagnosis` source before locking the design.

---

### MOD-5: Diagnosis message-count limit on resume — reset or carry over?

**What goes wrong:**
Free tier limit is `FREE_CHAT_MESSAGES_PER_DIAGNOSIS` (premium.ts:62). If a user used 5/5 messages 3 weeks ago and now resumes, what is the budget?

- **Reset to 5:** infinite-money exploit — free users open old diagnoses repeatedly to keep chatting
- **Stay at 0/5:** correct behavior, but the user's first reaction is "this is broken, I have 0 even though I just opened it" — looks like a bug
- **Hybrid (e.g. +1 free per week):** complex, hard to communicate, hard to test

**Why it happens:**
- The original limit was per-diagnosis-session, not per-diagnosis-lifetime — resume blurs that line
- The premium gate hook reads a `userMessageCount` parameter; the source of truth for "messages already sent in this diagnosis" is the saved chat history

**Prevention:**
1. **Pick "Stay at 0/5" — count messages per diagnosis lifetime, not per session.** Implement: when computing `canSendChatMessage`, count user messages across the entire `SavedDiagnosis.chat` array (not just the current session).
2. **Surface the count in UI before the user types:** "Te quedan 0 mensajes en esta conversación. Convertite en Premium para seguir." So the limit is a precondition, not a mid-typing gotcha.
3. **Premium upgrade lifts the limit retroactively** — this is the value prop of upgrading mid-resume.
4. **Document the rule** in a code comment in `premium.ts` so future contributors don't re-debate this.

**Detection signals:**
- QA flow: free user uses 5 messages, kills app, reopens 1 day later, opens diagnosis → can NOT send messages, sees paywall trigger.
- Premium user has unlimited messages even on resumed conversations.

**Phase placement:** **Diagnosis-continuity feature phase.** Pair with CRIT-4 (paywall coordination).

**Confidence:** HIGH on the recommendation — this is the only option that doesn't either lose money or look broken.

---

### MOD-6: Catalog `tip` text update → user's existing plant has stale instance copy

**What goes wrong:**
If `Plant` instances copy `tip`, `description`, `problems` from `PLANT_DATABASE` at creation time (which the schema implies — `Plant` has these as fields), then updating the catalog (e.g. fixing a typo in `monstera.tip`) does NOT propagate to existing user plants. They keep the old tip.

OR: if `Plant` instances reference the catalog by `id` and read `tip` at render time, then changing the catalog DOES update everyone — but then user's overridden `tip` (if the UI allows editing) is lost, or never rendered.

**Why it happens:**
- The current data model isn't fully clear on this from the snippets — needs verification
- Either model is reasonable; mixing the two is the bug

**Prevention:**
1. **Pick one and document it.** Recommendation: catalog content (`tip`, `description`, `problems`, `nutrients`) is **always read by lookup** (`getCatalogEntry(plant.dbId).tip`), never copied to the instance. User customizations live in dedicated nullable fields (e.g. `plant.userNotes`, `plant.userTip`) that are checked first.
2. **i18n of catalog content** flows through the same lookup path → updating Spanish translations is automatic for all users.
3. **Audit the existing schema** before v1.1 — if old user plants have a copied `tip` field, the migration is the place to drop it and switch to lookup.

**Detection signals:**
- Update a catalog `tip` in dev, reload an existing user's plant — new tip should show.
- Test by changing one entry's tip text and verifying old plants display the new text after relaunch.

**Phase placement:** **Migration phase + catalog rebalance phase.** Lock the contract before adding 10-15 new outdoor plants.

**Confidence:** MEDIUM — depends on current schema (need to read `Plant` type fully). Flag for verification.

---

### MOD-7: Adding new plants — i18n keys missing for one language → "[plants:new_plant.name]" shown in production

**What goes wrong:**
v1.0 has Spanish and English locale files (`src/i18n/locales/{en,es}/plants.json`). When adding 10-15 outdoor plants, it is easy to add the English keys, ship, and discover later that Spanish keys for `name`, `tip`, `description`, `problems[N].symptom`, `problems[N].cause`, `problems[N].solution`, `nutrients.type`, `nutrients.homemade` are missing for some entries → Spanish users see the raw key in their UI.

**Why it happens:**
- No automated check that every catalog entry has corresponding i18n keys in every locale
- New plant added in a hurry, missing a single problem entry
- Plant has 3 problems in EN but 2 in ES → accessing `problems[2]` returns a missing key

**Prevention:**
1. **Add a build-time check** (npm script + CI step): walks `PLANT_DATABASE`, asserts every `id` has full keyset in both EN and ES locales. Fail loudly.
2. **Use a typed catalog schema** that includes the expected number of problems → translations file generates a TS type listing required keys → mismatched count is a type error.
3. **i18n fallback config**: if EN key exists but ES key missing, fall back to EN string (with a `__MISSING_TRANSLATION__` console.warn in dev). Avoid showing raw keys in prod ever.
4. **PR template for catalog additions** has a checklist: "Added EN keys / Added ES keys / Verified in both locales / Image hosted in Supabase Storage."

**Detection signals:**
- Switch app language to ES, browse all 75+ plants, look for `[plants:` brackets or English text where Spanish should be
- CI build step fails when keys are missing

**Phase placement:** **Catalog-rebalance phase + verification phase.** Build-time check is part of CI infrastructure, applies to all future catalog work.

**Confidence:** HIGH — this is a generic i18n pitfall but acutely relevant given the milestone scope.

---

### MOD-8: Renaming or removing a plant in the catalog → orphaned user references

**What goes wrong:**
User has `plant.dbId = "monstera"`. A future catalog reorganization renames the slug to `monstera-deliciosa`. User's plant now points to a non-existent catalog entry. Lookup returns undefined, plant detail screen renders blank or crashes.

Less obvious: if catalog rebalance "splits" a plant (e.g. `tomate` → `tomate-cherry` and `tomate-perita`), user's tomato is now ambiguous.

**Why it happens:**
- Catalog is shipped with the app, but user data persists across versions
- No alias/redirect table

**Prevention:**
1. **Slugs are forever.** Document this rule. Rename = add new slug + keep old slug as alias.
2. **Add a `_aliases: string[]` field on catalog entries** (or a top-level `CATALOG_ALIASES: Record<string, string>` map) so old slugs redirect to new ones at lookup time.
3. **Migration handles known renames:** if v1.1 renames any v1.0 slugs, the migration also rewrites `plant.dbId` for affected user plants.
4. **Lookup must fail soft:** `getCatalogEntry(unknownSlug)` returns a sentinel "Unknown plant" entry, not undefined. Plant detail handles it gracefully.

**Detection signals:**
- Test data: a user's plant with a stale `dbId` should render with a fallback name and not crash.
- v1.0 → v1.1 migration verification: count of plants with valid `dbId` post-migration ≥ count pre-migration.

**Phase placement:** **Catalog-rebalance phase.** If renames are happening as part of v1.1, the alias map is part of this phase. Otherwise, ship the alias-map infrastructure now to enable safe catalog evolution later.

**Confidence:** HIGH.

---

### MOD-9: Location permission denied — user gets no precision care

**What goes wrong:**
User denies location permission on the prompt. The app needs hemisphere/season for the new model. Without location, the app falls back to... what? Hardcoded northern hemisphere assumption? Asks user manually? Disables seasonal feature entirely?

The user prompt explicitly asks: "Permission denial → fallback story (geocoding alternative? city-only via search?)"

**Why it happens:**
- Location permission denial is permanent until user manually changes settings
- iOS in particular makes re-prompting impossible from the app

**Prevention:**
1. **Manual location entry as first-class fallback.** Settings → "Tu zona" → search by city, returns lat/lon via Open-Meteo geocoding (which the app already uses per CLAUDE.md). No GPS required. Privacy-friendly. Works on iOS where re-prompt isn't possible.
2. **Default to a sensible guess** until set: if the app's locale/region is `es-AR` → assume Southern hemisphere; if `en-US` / `en-GB` → Northern. Show a small banner: "Usando hemisferio sur por tu idioma. Tocá para ajustar."
3. **Privacy copy on the location prompt** must be brief and clear: "Solo usamos tu ubicación para clima local y estación. No la compartimos con nadie. No la guardamos en servidores." Reduce paranoia.
4. **No precision feature is locked behind location.** Watering schedule with `warm/cold` works without location — it just uses the default-zone assumption. Location refines, never gates.

**Detection signals:**
- Deny location on iOS sim → onboarding flow completes, plants get reasonable schedules from locale fallback.
- Settings → manually set city → schedule recomputes correctly.

**Phase placement:** **Hemisphere/season feature phase.** The fallback chain (manual entry → locale guess → conservative default) must exist on day one.

**Confidence:** HIGH.

---

### MOD-10: Migration on app launch flashes a black screen / blocks splash

**What goes wrong:**
The current `useStorage` provider sets `loading: true` until the load completes (useStorage.tsx:105, 203). If the migration adds 100ms+ of work (mapping every plant's fields, validating, writing back), the splash/loading screen visible to the user lengthens. Worse: if migration fails partway, the app may never set `loading: false` → white screen forever.

The user prompt explicitly: "Async migrations blocking app start — splash screen must not flash."

**Why it happens:**
- Migration is on the critical path (must run before any UI renders that touches plant data)
- AsyncStorage on Android can be slow with large blobs (10+ plants with diagnosis history)
- A throw inside the migration code is caught by the parent try/catch (useStorage.tsx:200) but the error path doesn't differentiate "no data" from "migration failed"

**Prevention:**
1. **Run migration synchronously inside the existing `loadData` flow in `useStorage`** — same place the load happens, same `loading: true` window. Don't add a second loading state.
2. **Time-budget the migration:** typical case <50ms (in-memory transform). If it routinely exceeds 200ms, profile and optimize before shipping.
3. **Show splash with progress for migration** if needed: native splash → JS splash with "Actualizando tu jardín..." text → main UI. Avoid silent black screen.
4. **Migration failure path is explicit:** wrap migration in its own try/catch separate from the load try/catch. On failure: log, alert user with "Reintentar" / "Continuar con datos viejos" buttons (using legacy schema in read-only mode), do NOT lock the app.
5. **Test on a low-end Android device with 50 plants and full diagnosis history.** Real-world worst case.

**Detection signals:**
- App launch time on dev device pre/post migration: should differ by <200ms
- Crashlytics: "App not responding" / ANR reports after v1.1 release

**Phase placement:** **Migration phase + verification phase.** Performance test on real low-end device is a release blocker.

**Confidence:** HIGH.

---

## Minor Pitfalls

### MIN-1: TestFlight vs Production behavior differences for RevenueCat

**What goes wrong:**
RevenueCat sandbox (used by TestFlight) and production receipts behave differently — particularly around subscription renewals, "ask to buy" Family Sharing flows, and refresh latency. A diagnosis-continuity flow tested in TestFlight may behave differently for paying production users.

**Prevention:**
1. RevenueCat docs explicitly enumerate sandbox quirks — review before release.
2. Use a real Apple test account configured in App Store Connect (not just TestFlight tester) for purchase regression.
3. Don't ship the diagnosis-continuity premium flow without a `customerInfo.activeEntitlements` smoke test on a real production-style account.

**Phase placement:** Verification phase, paywall regression checklist.

**Confidence:** MEDIUM — well-known RevenueCat issue, exact severity for this app depends on prior release testing.

---

### MIN-2: User travels with cached location → wrong hemisphere

**What goes wrong:**
User's cached location is Buenos Aires. They visit family in Madrid for a month. Phone GPS isn't queried (or permission is "while in use" and the app doesn't trigger a refresh). App keeps using cached Southern hemisphere data → wrong season for current location. Edge case for a small subset of users.

**Prevention:**
1. **Refresh location on app foreground if more than N days old** (e.g. 7 days). Existing weather fetch likely already does something similar — verify and align.
2. **Show current location in Settings** so users can manually update.
3. **Manual override** (per MOD-9) lets travelers force a zone.
4. Accept this as a low-frequency edge case; do not over-engineer.

**Phase placement:** Hemisphere feature phase. Low priority.

**Confidence:** HIGH on the issue, MEDIUM on the priority — affects few users.

---

### MIN-3: Northern-hemisphere-developer testing southern-only logic

**What goes wrong:**
You (developer) live in Argentina (Southern hemisphere). The team or anyone using the codebase from a Northern-hemisphere dev environment may test on April 1 and see "warm season" because the local clock + a buggy hemisphere check defaults to Northern. Subtle bugs creep in because the developer's local context masks them.

**Prevention:**
1. **Test fixtures with explicit lat/lon in unit tests:** assert season for (lat=-34, month=4) === 'cold' (BA in autumn) and (lat=40, month=4) === 'warm' (NY in spring) and (lat=1, month=4) === 'tropical'.
2. **Dev menu:** override location/date in development builds. Existing "fake care" / debug toggles are referenced in recent commits (`8a014c6 feat: notification settings clarity — breakdown subtitle, hide fake care toggle`) — extend the same pattern.
3. **Snapshot tests** for "what does the Hoy screen show in March" with a fixed mocked date and a fixed mocked location.

**Phase placement:** Verification phase. CI unit tests catch the most insidious cases.

**Confidence:** HIGH — this is a classic timezone/locale-developer-blindness bug pattern.

---

### MIN-4: Catalog images for new outdoor plants not yet uploaded to Supabase Storage

**What goes wrong:**
New outdoor plants have `imageUrl` referencing `${CATALOG_BASE_URL}/{slug}.jpg`. If those images aren't uploaded to Supabase Storage before release, users see broken images.

**Prevention:**
1. Pre-release checklist: every catalog entry's `imageUrl` resolves to a 200 OK before submitting to App Store / Play Store.
2. Automated script: `curl -I` every URL in the catalog as part of CI.
3. Fallback image: the plant card renders the `icon` emoji prominently when image fails — already part of the design (per CLAUDE.md "Emoji icons throughout").

**Phase placement:** Catalog rebalance phase, pre-submit verification.

**Confidence:** HIGH.

---

### MIN-5: Ambiguous light-level for outdoor plants

**What goes wrong:**
The `lightLevel` taxonomy (`direct | bright_indirect | medium_indirect | low`) is designed for indoor positioning relative to a window. Outdoor plants don't have an "indirect" light context the same way — they have "full sun / partial shade / shade." Forcing outdoor plants into the indoor taxonomy creates absurd labels (a tomato as "bright indirect"?).

**Prevention:**
1. **Either extend the taxonomy** with `partial_shade` and `shade` for outdoor plants, OR map: `direct = full sun, bright_indirect = partial sun, medium_indirect = partial shade, low = shade`. The latter keeps 4 levels but requires clear copy that explains the mapping for outdoor plants.
2. **Surface different copy per plant context:** if `outdoor === true`, label the lightLevel selector with outdoor terms; if false, indoor terms.
3. **Catalog entries** can suggest the right lightLevel per plant, so users don't have to translate themselves.

**Phase placement:** Light-level feature phase + catalog rebalance phase. Copy and labels.

**Confidence:** MEDIUM — depends on taxonomy decision not yet locked. Worth a UX review with real outdoor-plant users.

---

### MIN-6: Mixing fixed-mode and soil-check-mode plants in one user's garden — UI consistency

**What goes wrong:**
On the "Hoy" tab, water tasks for fixed plants show "Regar Monstera". For soil-check plants on a check-in day, tasks show "Chequear cactus". For soil-check plants on a non-check-in day, tasks show... nothing? But the user thinks "did I forget to add my cactus to the schedule?"

**Prevention:**
1. **Plant card always shows current mode badge** (a small "💧 Cada 5d" or "🤚 Por chequeo") so the user understands why the task list looks the way it does.
2. **Empty state for soil-check plants** when no check-in is due: "Tu cactus está en modo chequeo. Te avisamos en 12 días." — explicit, not silent.
3. **Settings has a global preference** (or a per-plant choice via edit modal): "Modo de riego para [plant]". Unblocks user fixing whatever the migration mapped them to.

**Phase placement:** Watering feature phase, UX details.

**Confidence:** HIGH.

---

### MIN-7: Schema-version drift between TestFlight users and Production users

**What goes wrong:**
TestFlight beta users get v1.1 with `schemaVersion: 1`. They migrate. Then they later install (or roll back to) the v1.0 production build for any reason — old build reads new blob, sees fields it doesn't know, ignores them silently. Or worse, crashes if a non-nullable assumption is violated by new data.

**Prevention:**
1. **v1.0 was never built to handle v1.1 data — that's expected and unavoidable.** Make v1.0 → v1.1 a one-way door. Don't actively support downgrade.
2. **Document this in TestFlight release notes:** "v1.1 changes how plant data is stored. Reverting to v1.0 is not supported and may cause data loss." Sets expectations.
3. **The pre-migration backup blob** (CRIT-1 prevention) gives users a recovery path: reinstall v1.0 + manual recovery from backup if absolutely needed (would require a secondary tool, not supported in-app).
4. **Don't let a beta user be a production user simultaneously** — App Store / TestFlight don't let this happen normally, but be aware that some users uninstall TestFlight and reinstall production.

**Phase placement:** Verification + release notes.

**Confidence:** MEDIUM — affects very few users but support cost is high if it happens.

---

### MIN-8: Privacy manifest update for location use

**What goes wrong:**
v1.0 may already declare location use in `privacyManifests` (CLAUDE.md mentions `app.json` declares APIs). v1.1 makes location MORE prominent (onboarding prompt, banner, settings UI). If the manifest already covers "Coarse Location" and "Reverse Geocoding," no change needed. If not, App Store submission may flag this.

**Prevention:**
1. **Audit `app.json` privacyManifests entry** vs new usage. If location was already declared, fine. If not, update before submission.
2. **PrivacyInfo.xcprivacy** mentioned in CLAUDE.md root — verify it covers location category.
3. CLAUDE.md guidance: "Update privacy manifest when adding cloud sync or new Apple-required APIs." Adding more visible location UI alone doesn't require update if the API category was already declared.

**Phase placement:** Pre-submission verification.

**Confidence:** MEDIUM — depends on what's currently declared.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Migration phase (kickoff) | CRIT-1 partial migration data loss | schemaVersion + atomic write + backup blob + idempotent re-runs |
| Migration phase | CRIT-2 dual-source-of-truth from kept-old fields | Remove old fields entirely; let TS surface read sites |
| Migration phase | CRIT-3 stale notifications fire after migration | cancelAllNotifications() then full reschedule on first post-migration launch |
| Migration phase | MOD-3 user customizations overwritten | Map per-instance values, not catalog defaults; show one-time post-migration message |
| Migration phase | MOD-10 splash flash / blocked launch | Synchronous migration in existing loadData flow, time-budget <200ms, profile on low-end Android |
| Light-level feature phase | MIN-5 outdoor plants ambiguous | Outdoor labels: full sun / partial sun / partial shade / shade — same 4 buckets, different copy |
| Watering-feature phase | CRIT-5 soil-check has no notification trigger | Check-in (not water) reminders, distinct task type, no health penalty for soil-check overdue |
| Watering-feature phase | MIN-6 mixed-mode UI inconsistency | Mode badge on plant card + explicit empty states |
| Hemisphere/season phase | MOD-1 tropical zone | Three zones: Northern temperate / Southern temperate / Tropical |
| Hemisphere/season phase | MOD-2 abrupt season transitions | Month-based boundaries (April vs October), not equinox; show season label in UI |
| Hemisphere/season phase | MOD-9 permission denied fallback | Manual city entry via Open-Meteo geocoding; locale-based default; never gate features behind GPS |
| Hemisphere/season phase | MIN-3 northern-dev testing southern logic | Unit tests with explicit lat/lon fixtures; dev menu for date/location override |
| Diagnosis continuity phase | CRIT-4 modal stacking / paywall | Lift paywall to root context; deferred-callback after purchase confirmation |
| Diagnosis continuity phase | MOD-4 image context lost on resume | Text-only resume; explicit copy "para reevaluar visualmente, sacá una foto nueva" |
| Diagnosis continuity phase | MOD-5 message-count limit on resume | Count per diagnosis lifetime, not per session; surface count before user types |
| Catalog rebalance phase | MOD-6 stale tip text on existing plants | Lookup-by-id, never copy catalog content to plant instance |
| Catalog rebalance phase | MOD-7 partial i18n keys | CI build-time check that every slug has full keyset in both locales |
| Catalog rebalance phase | MOD-8 renamed/removed plants | Slugs are forever; alias map for renames; soft-fail lookup |
| Catalog rebalance phase | MIN-4 missing catalog images | Pre-submit script validates all imageUrl resolve to 200 |
| Verification phase | MIN-1 RevenueCat sandbox vs prod | Test with real production-style Apple account, not just TestFlight tester |
| Verification phase | MIN-7 schema drift TestFlight↔Prod | One-way migration; document in beta release notes |
| Pre-submission | MIN-8 privacy manifest | Audit app.json + PrivacyInfo.xcprivacy for location declarations |

---

## Sources

This document is grounded in direct reading of:

- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — confirmed local-first AsyncStorage, RevenueCat, i18n, modal pattern
- `/Users/gaston/Documents/Personal/MiJardinApp/.planning/PROJECT.md` — milestone scope, target features, out-of-scope
- `/Users/gaston/Documents/Personal/MiJardinApp/src/hooks/useStorage.tsx` — single-blob persistence, debounced save, load fallbacks (lines 144-207)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantHealth.ts` — health scoring assumes `waterEvery` semantics (line 41 via getNextWaterDate)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/plantLogic.ts` — `getNextWaterDate` and `getTasksForDay` reference `waterEvery`, `sunHours`, `sunDays`, `outdoorDays` directly
- `/Users/gaston/Documents/Personal/MiJardinApp/src/utils/notificationScheduler.ts` — sun-window logic depends on `sunHours` (lines 524-543); UV warning filters by `sunHours <= 3` (line 732); notifications subsystem disables globally on first error (line 17, 23-27)
- `/Users/gaston/Documents/Personal/MiJardinApp/src/data/plantDatabase.ts` (read partial) — confirms current catalog shape with `waterDays`, `sunHours`, `tempMin`, `tempMax`, `humidity`, `outdoor`
- `/Users/gaston/Documents/Personal/MiJardinApp/src/config/premium.ts` — `canSendChatMessage` based on `userMessageCount` parameter (line 61), confirms message-limit per chat session

**Confidence levels assigned per pitfall above.** All HIGH-confidence pitfalls are observable directly in the code or design constraints. MEDIUM-confidence pitfalls flag assumptions that should be verified in implementation.

**Not verified (recommended follow-up before locking design):**
- Exact shape of `Plant` type re: whether `tip`/`description`/`problems` are copied or referenced (MOD-6)
- Exact prompt structure used by `chat-diagnosis` edge function (MOD-4)
- Current privacyManifests location declaration (MIN-8)
