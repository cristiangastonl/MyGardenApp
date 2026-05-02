# Domain Pitfalls — v1.2 Recommendation-First Plant Guide

**Domain:** Feature expansion + UX modernization on a live local-first React Native app (My Happy Garden)
**Researched:** 2026-05-01
**Scope:** Pitfalls specific to ADDING v1.2 features (recommendation-first refactor, catalog authoring at scale, PlantCard cleanup, bottom sheets, swipe gestures, pet toxicity, fertilization, plant journal, streaks) to the existing app — NOT a repeat of v1.1 pitfalls.

> This document is opinionated. Each pitfall is concrete, has a detection signal, a prevention you can actually implement and test, and a phase placement. It reads the existing codebase first and draws conclusions from what is actually there — not generic mobile advice.

---

## Critical Pitfalls

These cause data loss, broken user trust, or rewrites if missed.

### CRIT-1: Recommendation adoption silently overwrites user's deliberate custom values

**What goes wrong:**
The pivot to "recommendation-first" means the picker for watering interval and light level will pre-select the species recommendation (`PlantDBEntry.waterSchedule.warm`, `.lightLevel`). When the user saves a plant — especially from the identification flow or via "update care settings" — a naive implementation passes the recommendation as the default and calls `updatePlant(id, { waterSchedule: catalogEntry.waterSchedule })`. If the user already had a custom value (e.g. they water their Monstera every 5 days instead of the catalog's 7 because their apartment is hot), the recommendation replaces it silently.

**Why it happens:**
`updatePlant` in `useStorage.tsx:378` does a shallow merge of `Partial<Plant>`. If the caller passes `waterSchedule: { warm: 7, cold: 14 }` from the catalog, the user's stored `{ warm: 5, cold: 10 }` is gone. There is no "did the user touch this field?" signal in the current `Plant` type. The current "identification picker pre-selects species recommendation" feature goal actively creates this code path.

**How to avoid:**
1. **Never call `updatePlant` with catalog values as the payload.** The picker must render catalog values as display-only suggestions and the actual saved value must come from the picker's current state — meaning if the user hasn't changed anything, the pre-selected value IS the catalog default, but it's the user's next explicit choice, not an auto-push.
2. **Distinguish two states in the picker:** "Using recommended (7d)" vs "Using your custom (5d)". If the stored plant value differs from the catalog recommendation, show a visual indicator: "Tu configuración difiere de la recomendación (7d). Tocá para aplicar la recomendación." — This makes the divergence visible without making it feel wrong.
3. **The Tus ajustes section** (4th section in the educational detail modal per PROJECT.md) is the right place for user-adjustable values. The first three sections (¿Qué hacer?, ¿Dónde ponerla?, ¿Por qué?) are read-only recommendations. Keep them structurally separate.
4. **Smoke test guard:** add an assertion to the smoke runner that calls `updatePlant` with a catalog-default payload on a plant that already has a custom value, then reads back and verifies the custom value is unchanged unless the caller explicitly opted in.

**Warning signs:**
- A user reports "my watering schedule reset after I looked at the plant detail"
- `updatePlant` call sites in `PlantDetailModal`, `AddPlantModal`, or `IdentificationResults` that accept a full `Plant` or `PlantDBEntry` as argument without user-edit confirmation

**Phase to address:** Educational Detail Modal phase (first feature phase). Establish the pattern before any picker UI is built; all subsequent pickers inherit it.

---

### CRIT-2: Pet toxicity data shown as authoritative when source is unverified or incomplete

**What goes wrong:**
Pet toxicity information carries real liability. A user trusts the app, ignores a safety risk because the app says "no tóxica", and their cat gets sick. Or worse: the app says "tóxica" for a plant that is fine, causing user anxiety and undermining trust in the whole feature.

The dataset accuracy problem is two-sided: (1) wrong classification, (2) incomplete catalog — if 30 of 64 entries lack toxicity data, user interprets "no warning = safe" when it might mean "unknown."

ASPCA Toxic Plant Database is the canonical US source. There is no single equivalent LATAM authority — Argentine SENASA, Chilean SAG, and regional veterinary associations don't publish a digital-first toxicity list comparable to ASPCA. The app's audience is primarily Argentine Spanish speakers.

**Why it happens:**
- AI-drafted catalog content will hallucinate toxicity classifications if prompted naively ("is this plant toxic to cats?")
- "Mildly toxic" is ambiguous medical territory — most plants cause GI discomfort at worst; a few cause systemic damage
- Incomplete data is treated as negative ("not listed = safe") by users who read absence of a warning as clearance

**How to avoid:**
1. **Use ASPCA as primary source, cross-checked with one additional source per entry** (e.g. ASPCA + UC Davis Poisonous Plants database, or ASPCA + PetMD). Do NOT rely on AI drafts for toxicity classification — use AI only to format and translate human-verified data.
2. **Three-state taxonomy, not binary:** `safe | caution | toxic`. Never omit the field — if unverified, use `'unknown'` (4th state) and display "No verificamos la toxicidad de esta planta. Consultá a tu veterinario."
3. **"Mildly toxic" copy discipline:** avoid "no es dañina" — say "puede causar molestias digestivas si se ingiere. En caso de ingestión, consultá a tu veterinario." This is honest and not alarmist.
4. **Scope to cats/dogs only** for v1.2. Other pets (birds, reptiles, horses) have different sensitivities; don't overpromise scope.
5. **Legal copy:** add a single disclaimer sentence in the toxicity section: "Esta información es orientativa. En caso de emergencia, contactá a un veterinario." Not a wall of text — one sentence.
6. **Smoke guard:** `grep -r "petToxicity\|toxicCats\|toxicDogs" src/data/plantDatabase.ts | wc -l` — run after catalog content phase, assert count equals total catalog entries.

**Warning signs:**
- Any catalog entry has `petToxicity: 'safe'` without a source citation in the code comment
- AI-drafted entries for toxicity that don't cite a specific database entry
- Catalog entries where `petToxicity` field is absent (undefined treated as safe)

**Phase to address:** Pet toxicity dataset phase. Authoring checklist must include "ASPCA reference URL" comment per entry. No AI-only sourcing.

---

### CRIT-3: AsyncStorage size pressure from journal photo URIs — no hard limit enforced

**What goes wrong:**
Plant journal entries will store `photoUri` fields. If these are local file paths from `expo-image-picker` or `expo-camera`, the file path itself is tiny but the underlying file is in the app's cache. If journal entries store base64-encoded images (as `PlantPhoto` does today for diagnosis photos), the single `plant-agenda-v2` JSON blob grows rapidly. AsyncStorage has documented limits: 6MB per item on Android (LevelDB backend), though in practice React Native apps have hit limits around 2-4MB before corruption or silent failures.

A user with 15 plants × 5 journal entries × 1 photo each = 75 photos. If stored as base64 at 200KB each = 15MB in a single AsyncStorage item → guaranteed corruption on Android.

**Why it happens:**
- `PlantPhoto.uri` (src/types/index.ts:11) stores a string URI. Historically this was a local path or base64 string — the existing photo album (`PlantPhotoAlbum.tsx`) already stores photos this way.
- Journal entries are likely modeled after `PlantPhoto` — same pattern, same size problem.
- The app is local-first (no Supabase Storage for personal photos until cloud sync ships in a future milestone), so there's nowhere else to put them.

**How to avoid:**
1. **Journal photo URIs must be permanent local file paths, not base64.** When the user picks a photo, copy it to `expo-file-system` document directory immediately: `FileSystem.copyAsync({ from: pickerResult.uri, to: documentDirectory + 'journals/' + uuid + '.jpg' })`. This reference survives app restarts and doesn't inflate AsyncStorage.
2. **Never store base64 in journal entries.** Even for existing `PlantPhoto` entries: if legacy entries have base64 URIs, that is a pre-existing problem, do not extend the pattern.
3. **AsyncStorage size guard:** add a dev-only check at app startup that logs `JSON.stringify(appData).length`. Track it across milestones. Warn at 1MB, error at 3MB.
4. **Supabase Storage migration path:** design `JournalEntry.photoUri` as a field that can hold either a local `file://` path (pre-sync) or a Supabase URL (post-sync). The field name is stable; the value changes when sync ships. No schema migration needed later.
5. **Maximum photos per journal entry:** cap at 3 (matching existing diagnosis photo limit). Document the cap in the UI.

**Warning signs:**
- Any `JournalEntry` or journal photo stored with `data:image/jpeg;base64,...` URIs
- AsyncStorage JSON blob exceeding 1MB in development with typical plant count
- Crash reports on Android with "AsyncStorage: Failed to set item" errors

**Phase to address:** Plant journal phase. Establish file-system-first pattern before any photo storage is implemented.

---

### CRIT-4: BottomSheetModalProvider not added to both AppContent paths — AUTH-mode bugs

**What goes wrong:**
App.tsx has two AppContent branches: `AppContentMVP` (no auth, current active path) and `AppContentFull` (with auth, used when `Features.AUTH: true`). The "Two AppContent paths discipline" was established at Phase 5 and is explicitly flagged in PROJECT.md as a lock. If `BottomSheetModalProvider` (from `@gorhom/bottom-sheet`) is added to `AppContentMVP` but forgotten in `AppContentFull`, any bottom sheet rendered when `Features.AUTH` is flipped on will either crash ("No BottomSheetModalProvider found") or render without the provider context and appear at z-index 0 behind all other content.

This is silent in MVP mode (current) and only surfaces when the auth milestone flips `Features.AUTH: true`. By that time the v1.2 engineer may be gone.

**Why it happens:**
- `AppContentFull` uses lazy requires and is never actually rendered during current development (Features.AUTH is false)
- Easy to add a provider to the path you're testing and forget the other
- No test exercises `AppContentFull`

**How to avoid:**
1. **Add `BottomSheetModalProvider` to BOTH AppContent paths in the same commit.** No exceptions.
2. **Add a smoke test assertion:** `grep -c "BottomSheetModalProvider"` in `App.tsx` must return exactly 2 (once per path). Fail the smoke runner if count is 1.
3. **Document the discipline** with a comment in App.tsx at the `AppContentFull` provider stack: `// TWO-PATH DISCIPLINE: keep in sync with AppContentMVP. See PROJECT.md Phase 5 lock.`
4. **Same applies to any new React context provider** added in v1.2: `StreakProvider`, `JournalContext`, etc. — must be in both paths.

**Warning signs:**
- A new provider appears in `AppContentMVP` but not in `AppContentFull`
- Grep count for any new provider name returns 1 in App.tsx

**Phase to address:** Bottom sheets phase (first phase that requires a new root-level provider). Establish the guard before any other providers are added.

---

### CRIT-5: Fertilization as 4th task type — notification + health score not wired up, silently skipped

**What goes wrong:**
The `Task.type` union (src/types/index.ts:107) currently has `"water" | "sun" | "outdoor" | "check_soil"`. Adding `"fertilize"` as a 5th type is not just a UI change — it must propagate through: `getTasksForDay()` in `plantLogic.ts` (task generation), `notificationScheduler.ts` (push notification scheduling), `calculatePlantHealth()` in `plantHealth.ts` (overdue penalty or not), and the "Hoy" screen discriminator switch. If the task type is added in the UI but skipped in any of these, fertilization tasks either: (a) never appear, (b) never get reminders, (c) don't affect health score, or (d) make the health score wrong by penalizing "no fertilization" for plants that don't need it.

Additionally: `DayDetail.tsx`, `DayDetailModal.tsx`, and `MonthCalendar.tsx` all have explicit discriminator chains over task types (as evidenced by the recent commit history: "add 'check_soil' branch to icon/label/style switches"). Fertilize needs a branch in all of them.

**Why it happens:**
- Discriminator chains (switch/if-else over task.type) are manually maintained — there's no compile-time exhaustiveness check in the current code (TypeScript union works only if devs use typed exhaustive switches, which they may not)
- `getTasksForDay` is stateless and easy to miss as a place where new tasks need to be generated
- Health score logic is in a separate file and easy to overlook

**How to avoid:**
1. **Add `fertilize` to the `Task.type` union AND immediately grep for every discriminator chain over task type.** Fix all branches before any UI work. This is the single commit that extends the type — use TypeScript's exhaustiveness checker: add `never` default to all switches.
2. **Health score design decision must be made explicitly:** overdue fertilization should NOT penalize score at the same rate as overdue watering (missing water = plant dies; missing fertilizer = plant grows slower). Suggest a 0-penalty model for fertilize overdue, OR a separate "fertilization score" subcategory that doesn't drag down the main score.
3. **Fertilize notifications: seasonal gating.** Fertilization is warm-season only for most plants. The notification scheduler must check current season before scheduling fertilize reminders. A "fertilize your monstera" push in winter is incorrect advice.
4. **Smoke guard:** extend the smoke runner's task-type discriminator test to assert that `getTasksForDay()` for a plant with `fertilizeSchedule` set returns a `fertilize` task on the correct day; returns no task on off-days; and returns no task when `fertilizeSchedule` is absent.

**Warning signs:**
- Any switch over `task.type` that compiles but has no `fertilize` case
- `getTasksForDay()` modified to add fertilize but `notificationScheduler.ts` not updated in the same PR
- Health score decreasing for a plant whose only issue is overdue fertilization

**Phase to address:** Fertilization feature phase. Must be treated as a new subsystem expansion (same rigor as v1.1's `check_soil` mode addition), not just a UI card.

---

## Moderate Pitfalls

These cause friction, wrong behavior, or slow production fire-drills.

### MOD-1: User-chosen value treated as "wrong" by recommendation UI tone

**What goes wrong:**
When user's stored `waterSchedule.warm = 5` and the catalog recommends `7`, a naively-worded UI says "Recomendado: 7 días" next to the picker showing "5 días" — implicitly labeling the user's choice as incorrect. This is especially damaging for the tone this app is trying to set: "app recommends, user adjusts to their reality." If the user feels judged, they disengage with the educational content entirely.

Voseo copy pitfall: "Estás usando 5 días cuando recomendamos 7" sounds like a scolding teacher. Correct tone: "Te recomendamos cada 7 días. Podés ajustarlo a tu realidad." — the recommendation is offered, the override is celebrated.

**How to avoid:**
1. **Copy rule:** the recommendation section never says "you are wrong." Phrases to ban: "incorrecto," "diferente a lo recomendado," "estás usando menos/más." Permitted: "Te sugerimos," "La mayoría de los Potus prospera con," "Adaptalo a cómo regar mejor en tu espacio."
2. **Visual hierarchy:** recommendation text is smaller and secondary; user's current setting is the primary displayed value.
3. **"¿Por qué?" section** in the educational modal is the rationale — it explains the recommendation's basis without implying the user must comply.
4. **Copy review gate:** before each phase ships, review all strings involving recommendation + user value divergence for patronizing tone.

**Warning signs:**
- Any i18n key value containing "incorrecto," "diferente," or comparing recommendation vs. user value negatively
- Numeric comparison shown as "too much/too little" rather than "we recommend X"

**Phase to address:** Microcopy + brand voice phase. Establish tone rules before authoring any new copy.

---

### MOD-2: Catalog content quality drift across 512 strings — batch 3 degrades

**What goes wrong:**
64 entries × 4 new fields (`careAction`, `placementRecommended`, `placementAlternatives`, `placementAvoid`, `whyRationale`) × 2 locales = 512+ strings. The first batch (10-15 entries) gets careful horticultural review. By batch 4, the reviewer is tired, the AI drafts get less scrutiny, and subtle errors accumulate: wrong seasonality advice for LATAM outdoor plants, generic `careAction` text that doesn't match the plant's actual care needs, `whyRationale` that's scientifically imprecise ("because plants love water" level explanations).

Voseo discipline drift is a specific sub-problem: Spanish strings in batch 1 use "Regá," "Sacá," "Ponela." By batch 3 under time pressure, AI returns "Riega," "Saca," "Ponla" — standard Castilian conjugations — and the reviewer misses it.

**How to avoid:**
1. **Schema-first authoring.** Define the exact character limit and quality bar per field before batch 1: `careAction` ≤ 120 chars, imperative voseo sentence, no filler words. `whyRationale` must cite a specific plant physiology mechanism (photoperiod, transpiration rate, nutrient cycle), not generic advice.
2. **Voseo linter:** add a script that greps all ES strings in the batch for Castilian conjugation patterns (`" riega "`, `" saca "`, `" pon "`, `" ten "`, `" haz "`) and fails if found. This is a 15-line script, not a major undertaking.
3. **Batch review checklist:** for every entry, reviewer signs off on: (a) careAction is voseo, (b) whyRationale cites a mechanism, (c) placement advice is LATAM-relevant (not "outside in summer" for a plant that has no cold-dormancy concept in subtropical LATAM climates), (d) at least 1 source URL in code comment.
4. **Cross-check against existing tips.json:** several fertilizer, light, and seasonal tips already exist in `src/i18n/locales/es/tips.json`. The new `whyRationale` and `careAction` fields must not contradict them.

**Warning signs:**
- Castilian conjugation in any ES batch output
- `whyRationale` fields starting with "porque" and ending with generic advice ("las plantas necesitan luz")
- All 64 entries in a category having identical or near-identical `careAction` text

**Phase to address:** Catalog content authoring phase. Establish batch checklist and voseo linter before drafting entry 1.

---

### MOD-3: PlantCard health badge hidden (score > 80) — but power users want always-visible

**What goes wrong:**
Current behavior: `showHealthBadge = healthStatus.score < 80` (PlantCard.tsx:91). v1.2 will reduce visual elements from 10 to 5. The plan is to hide the badge when score is high. Some power users who track health obsessively use the badge to monitor exactly when a plant dips from 95 to 78 — they want the score visible all the time.

Hiding it feels like information removal. The user can't tell if their plant is at 82 (just above the hide threshold) or at 95 without tapping into the detail.

**How to avoid:**
1. **Don't hard-remove the badge rendering — change its visual weight.** When score ≥ 80, show a minimal dot or no badge at all is fine, but make the detail tap target always present (the plant card itself is tappable, health detail is one tap away — that is sufficient for power users).
2. **Alternative:** settings toggle "Mostrar puntuación de salud siempre" — but this adds settings complexity. Simpler: health badge hidden when excellent, detail modal always accessible via card tap.
3. **Communicate the change in onboarding or via a one-time tooltip** for users who upgraded from a version where the badge was always visible. Otherwise they think the score feature broke.

**Warning signs:**
- Users asking "where did the health score go?" in reviews
- No accessible way to see health score when badge is hidden

**Phase to address:** PlantCard cleanup phase. One-time tooltip for badge-hiding change is part of this phase's UX work.

---

### MOD-4: Swipe-to-delete vs. scroll — gesture conflict in FlatList

**What goes wrong:**
Swipe gestures on PlantCard items in a vertically-scrolling FlatList create a classic conflict: horizontal swipe (delete) vs. vertical scroll. Without proper gesture priority configuration, a diagonal swipe (which most real-world gestures are) either: (a) always triggers delete accidentally when user tries to scroll, or (b) never triggers delete because the scroll consumes the touch first.

This is worse on Android where gesture handling priority differs from iOS. The current app has no `react-native-gesture-handler` or `react-native-reanimated` in `package.json` — these would need to be freshly installed.

**How to avoid:**
1. **Install `react-native-gesture-handler` via `npx expo install`**, not via npm direct (Expo version compatibility is critical — wrong version of RNGH with Expo SDK 54 causes subtle crashes on Android gesture cancel).
2. **Use a proven pattern for swipe-in-list:** wrap PlantCard in `Swipeable` from RNGH, configure `friction={2}` and `leftThreshold={40}` to distinguish casual scroll from intentional swipe. The horizontal threshold should be large enough that normal vertical-ish scrolling doesn't trigger it.
3. **Visual affordance is mandatory.** Users do NOT discover swipe gestures on their own. Options: (a) chevron/arrow peek when list first renders, (b) hint animation on first app launch after upgrade, (c) long-press context menu as fallback delete path. Both swipe AND long-press must work — swipe is primary, long-press is discoverable fallback.
4. **Delete confirmation:** swipe-to-delete should reveal a red "Eliminar" action, NOT immediately delete. Instant delete with no undo is a hard UX anti-pattern in plant apps (data loss is permanent without cloud sync).

**Warning signs:**
- Swipe triggers during normal list scrolling
- No visual affordance for swipe gesture existence on first launch
- Delete executes immediately without confirmation

**Phase to address:** Mobile UX modernization phase (swipe gestures). RNGH installation must happen at the START of this phase — it requires a dev client rebuild, not just a JS change.

---

### MOD-5: Bottom sheet keyboard interaction on iOS — input fields inside sheets

**What goes wrong:**
If any bottom sheet contains a text input (e.g. journal entry note field, plant name in a quick-edit sheet), iOS keyboard presentation interacts badly with `@gorhom/bottom-sheet`'s snap behavior. When keyboard appears, the bottom sheet either: (a) doesn't move up, keyboard covers the input, (b) snaps to the wrong position, or (c) fights the keyboard avoidance system from `react-native-safe-area-context`.

This is a well-documented gotcha with `@gorhom/bottom-sheet` v4 — requires `keyboardBehavior="extend"` or `keyboardBlurBehavior="restore"` prop configuration and sometimes a `scrollRef` attachment.

**How to avoid:**
1. **Design constraint: keep text inputs OUT of bottom sheets where possible.** Bottom sheets in v1.2 should be used for short-action flows (confirm delete, pick a care setting from a list, view toxicity info). Full text-input flows (journal entry authoring) should remain as full-screen modals or full-screen screens.
2. **If a text input MUST be in a bottom sheet:** use `@gorhom/bottom-sheet`'s `BottomSheetTextInput` component (not the standard RN `TextInput`) — it's wired to the sheet's internal keyboard handling. Do NOT mix standard `TextInput` with bottom sheet.
3. **Test on real device:** simulator keyboard behavior is not representative on iOS. Test on a physical iPhone with iOS 17+.

**Warning signs:**
- Standard `TextInput` used inside a `BottomSheetView`
- Bottom sheet content hidden behind keyboard on iOS
- KeyboardAvoidingView inside a bottom sheet (they conflict)

**Phase to address:** Bottom sheets phase. Include a physical iOS device test for any sheet containing a focusable input.

---

### MOD-6: Bottom sheet z-order conflict with root-level PaywallModal

**What goes wrong:**
`PaywallModal` renders at the root level in both AppContent paths (App.tsx lines 228, 368). It uses RN's `Modal` component which renders natively above all other content. `BottomSheetModal` from `@gorhom/bottom-sheet` renders in a `BottomSheetModalProvider` portal. When a user triggers a bottom sheet AND the paywall is visible simultaneously (e.g. a premium feature triggers both), the two compete for z-index and the result is platform-dependent.

On iOS: native `Modal` wins — paywall covers the bottom sheet. On Android: z-index can be wrong either way depending on whether the sheet was already rendered when the modal opened.

**How to avoid:**
1. **Never trigger a bottom sheet while the paywall is open.** Before showing any BottomSheetModal, check `isPaywallVisible` from `usePremium()` and short-circuit.
2. **Before dismissing a bottom sheet, don't show the paywall immediately.** Use the existing `setTimeout(() => showPaywall(trigger), 350)` pattern (already in `MyPlantDetailModal.tsx:line ~350`) to let the sheet finish its dismiss animation before the paywall presents.
3. **Test matrix:** (a) open bottom sheet → trigger premium gate → paywall appears on top of sheet, (b) close paywall → sheet is still accessible or has been dismissed gracefully.

**Warning signs:**
- Paywall and bottom sheet visible simultaneously in UI
- Bottom sheet rendering on top of paywall on Android

**Phase to address:** Bottom sheets phase. Add the z-order test to the phase verification checklist.

---

### MOD-7: Light streaks / celebration toasts crossing into heavy gamification territory

**What goes wrong:**
Plant apps that add heavy gamification (badges, points, leaderboards, "level up", daily login streaks with punishment for missing) alienate adult users who care about their plants, not a game. Gardenio and PlantParent (2022-2023 cohort) added badge systems and saw negative reviews: "I don't need a badge, I need to know when to water."

Streaks specifically have an anti-pattern: **the streak anxiety loop**. When a user misses a day, the streak counter resets to 0. This either causes the user to feel punished (opens resentment) or causes them to care more about the streak than the plant (waterS the plant at midnight to keep the number). Both outcomes are bad.

**How to avoid:**
1. **Celebration, not streak tracking.** Show a toast when: plant is watered on time ("¡Bien! Tu Monstera está feliz."), week of perfect care completed ("Semana perfecta para el Potus."). No counter, no reset, no "streak of 7 days" visible anywhere.
2. **No streak counter in the UI.** Streaks can exist as an internal signal for notification copy personalization ("llevas 5 días cuidando bien a tu jardín" in a weekly summary), but NOT as a visible metric that resets.
3. **No punishment for missing.** Celebration-only model: a missed day is just a missed day; the next on-time action is celebrated fresh.
4. **No leaderboards, badges, or points.** The premium value prop is better AI, not more gamification.

**Warning signs:**
- Any UI showing a number that resets to 0 when user misses a care action
- "Streak" as a visible counter (not just internal analytics signal)
- Achievement badge unlocks

**Phase to address:** Streaks/celebration phase. The design decision (celebration-not-streaks) must be locked in phase planning before any implementation; it's hard to undo a streak counter once users see it.

---

### MOD-8: v1.1 schema migration backup cleanup not done — stale backup bloats AsyncStorage

**What goes wrong:**
`migration.ts` line 18 explicitly flags: `// TODO(v1.2): call cleanupBackup_v1_1() once on launch, then delete this helper.` The function `cleanupBackup_v1_1()` exists and is ready to call. If this is not done in v1.2, the backup key `'plant-agenda-v2.backup-pre-v1.1'` persists in AsyncStorage indefinitely. For users who migrated from v1.0 to v1.1, this backup contains a full duplicate of their plant data — doubling AsyncStorage usage for that cohort. Combined with journal photo path storage (CRIT-3), this is an unnecessary pressure on the 6MB limit.

**How to avoid:**
1. **Call `cleanupBackup_v1_1()` in the storage load sequence early in v1.2**, before any new features run. It's already written — just needs to be wired. Place it immediately after the `schemaVersion >= CURRENT_SCHEMA_VERSION` short-circuit in `useStorage.tsx:196`.
2. **After calling it, set `CURRENT_SCHEMA_VERSION = 2`** and delete the migration module entirely (as the comment says). Add a `migrateV1toV2` stub for v1.2's additive changes (new optional fields default gracefully, so the migration can be a no-op identity function for now — but it establishes the v1→v2 envelope so future real migrations are incremental, not a surprise).
3. **Smoke guard:** after startup, assert that `AsyncStorage.getItem('plant-agenda-v2.backup-pre-v1.1')` returns null.

**Warning signs:**
- `migration.ts` TODO comment still present after v1.2 ships
- `cleanupBackup_v1_1` never called in `useStorage.tsx` load sequence
- Backup key still present in AsyncStorage during dev testing

**Phase to address:** v1.2 kickoff / first phase. This is a housekeeping item that should be done before any new data model work.

---

### MOD-9: Fertilization schedule treated as free feature when it creates premium-adjacent engagement

**What goes wrong:**
Fertilization schedule adds a 4th task type visible in the "Hoy" screen and potentially in notifications. If it's free for everyone, premium users get no differentiation from it. If it's premium-gated entirely, free users feel the app nags them about an upsell every time they see a fertilize task.

The risk: adding a task type that shows up in push notifications for free users (increased notification fatigue) but the action flow requires premium to interact fully with.

**How to avoid:**
1. **Design decision must be explicit before implementation:** Recommended model — fertilize schedule configuration is free (add the task, set the interval), but fertilize reminder notifications are premium-gated (same gating model as NOTIFICATIONS_ADVANCED in features.ts). This way free users still see fertilize tasks on the "Hoy" screen but don't get push notifications for them unless they upgrade.
2. **If fertilize is fully free:** ensure it doesn't inflate notification count for users who already have 10+ morning + care + follow-up notifications. Fertilize is a low-frequency event (every 2-4 weeks); the notification budget impact is low.
3. **Features.ts must have a `FERTILIZE_SCHEDULE` flag** from day one. This lets the feature be shipped behind a flag and its premium gating adjusted post-launch without a code change.

**Warning signs:**
- `fertilizeSchedule` feature shipped with no feature flag
- Fertilize task notifications dispatched via `notificationScheduler.ts` without checking premium status

**Phase to address:** Fertilization feature phase design gate (before implementation).

---

### MOD-10: Identification picker pre-selects recommendation but outdoor/indoor label is wrong

**What goes wrong:**
This is a v1.1 UAT bug cited in the milestone scope: "picker outdoor labels for outdoor PlantNet results." When PlantNet identifies an outdoor plant, the light level picker currently shows indoor labels ("Luz directa," "Luz brillante indirecta") — these are meaningless for a tomato plant that lives outside.

The fix for this is in `LightLevelPicker.tsx` (and related label utilities in `getLightLabel` / `src/utils/lightLabel.ts`). If the v1.2 recommendation-first refactor adds new picker sections for `placementRecommended` / `placementAlternatives` without fixing this underlying label mapping, the new educational content will use indoor framing for outdoor plants and confuse users.

**How to avoid:**
1. **Fix the outdoor label mapping FIRST**, before building the new educational sections. The label lookup must check `plant.outdoor` (or `PlantDBEntry.outdoor`) and use outdoor terms: "Pleno sol," "Sol parcial," "Media sombra," "Sombra."
2. **`getLightLabel` utility** must accept an `isOutdoor: boolean` parameter (or derive it from the plant). This is a single-function change with downstream impact on every place labels render.
3. **Grep guard:** after fix, assert that `getLightLabel('direct', true)` returns an outdoor-specific string (not "Luz directa").

**Warning signs:**
- PlantNet identification of an outdoor plant shows "Luz brillante indirecta" in the picker
- `getLightLabel` called without context about indoor/outdoor

**Phase to address:** UAT bug fixes phase (must be fixed before the educational detail modal renders recommendation labels).

---

## Minor Pitfalls

### MIN-1: Schema version not bumped in v1.2 — new optional fields silently ignored

**What goes wrong:**
v1.2 adds optional fields to `Plant` (`fertilizeSchedule?`, `journals?`, `petToxicityOverride?`) and to `PlantDBEntry` (`careAction?`, `petToxicity?`, etc.). If `CURRENT_SCHEMA_VERSION` stays at `1` and no migration runs, these fields are simply absent for all existing users — which is fine, they default gracefully. BUT: if the migration module is supposed to be deleted (per the TODO comment) and a future migration needs to run between v1.2 and v2.0, the version counter is behind.

**How to avoid:**
Bump `CURRENT_SCHEMA_VERSION` to `2` at the start of v1.2. The migration itself can be a no-op (identity function: all new fields are optional and default to absent). This establishes the clean v1→v2 boundary and keeps the migration sequence correct for v2.0 when real migrations will be needed.

**Warning signs:**
- `CURRENT_SCHEMA_VERSION = 1` in migration.ts after v1.2 ships

**Phase to address:** v1.2 kickoff, same commit as backup cleanup.

---

### MIN-2: `MigrationBanner` triggered again for v1.2 non-migration

**What goes wrong:**
`MigrationBanner` in App.tsx renders when `migrationFailed: true`. This is set in `useStorage.tsx:259`. If the v1.2 migration path throws for any reason (even a benign parsing issue with the new optional fields), `migrationFailed` flips and the user sees the "Datos antiguos" banner — which was designed for a real migration failure, not a v1.2 additive change.

**How to avoid:**
Since v1.2 schema changes are purely additive (new optional fields with graceful defaults), the load path in `useStorage.tsx` already handles them: `data.journals ?? []` style defaults. As long as the CURRENT_SCHEMA_VERSION short-circuit (`isVersioned(parsed) && parsed.schemaVersion >= CURRENT_SCHEMA_VERSION`) correctly matches the bumped version number, no migration code runs and no banner risk exists.

The risk is: if CURRENT_SCHEMA_VERSION is bumped but the stored data still says `schemaVersion: 1`, the migration runner triggers and attempts to run a no-op v1→v2 function. If that no-op has a bug (even a minor one), `migrationFailed` fires. Prevention: unit test the no-op migration function explicitly.

**Warning signs:**
- `MigrationBanner` visible to users who have never had a real migration error
- Smoke runner not covering the v1→v2 no-op migration path

**Phase to address:** v1.2 kickoff / schema version bump phase.

---

### MIN-3: Voseo discipline in new microcopy for action buttons

**What goes wrong:**
Brand voice phase adds voseo + emoji to action buttons. New strings authored under time pressure default to Castilian conjugations. AI-assisted copy drafts will almost always use standard Spanish ("Riega," "Saca," "Confirmar") unless explicitly prompted with voseo requirement AND example strings.

The existing ES translation files use consistent voseo: "Regá," "Sacá," "Chequear." New action button strings must match.

**How to avoid:**
1. Extend the voseo linter (from MOD-2) to cover all locale files, not just the catalog batch.
2. Copy authoring checklist for action button strings: every imperative verb must be voseo form.
3. Prompt engineering for AI-assisted drafts: include explicit instruction "usar voseo argentino (regá, sacá, ponela) en lugar de tuteo (riega, saca, ponla)" and include 3 example pairs.

**Warning signs:**
- Any new action button string with Castilian imperative forms
- Voseo linter not run as part of i18n key check

**Phase to address:** Microcopy + brand voice phase.

---

### MIN-4: Long-press actions have no discoverability mechanism

**What goes wrong:**
Long-press for hidden actions (favorite, duplicate, archive) is a power-user pattern that casual users never find. Unlike swipe (which has visual affordance via peek animation), long-press has no visual indicator in the React Native standard component set. Users will use the app for months without knowing the feature exists.

**How to avoid:**
1. One-time hint: on first visit to the plant list after v1.2 upgrade, show a brief overlay or tooltip: "Mantené apretado una planta para más opciones."
2. All long-press actions must also be accessible via the plant detail modal — long-press is a shortcut, not the only path. Never put an action exclusively behind long-press.
3. Haptic feedback (`expo-haptics`) on long-press activation confirms to the user that something happened.

**Warning signs:**
- Any action only accessible via long-press with no alternative path
- No onboarding hint for long-press on first encounter

**Phase to address:** Mobile UX modernization phase.

---

### MIN-5: `_migratedFromV0` flag on Plant objects not cleaned up in v1.2

**What goes wrong:**
The `Plant._migratedFromV0?: true` field (types/index.ts:83) is explicitly marked: "Removed in v1.2." It was used in v1.1 to show per-plant tooltips to users who had pre-v1.1 plants. By v1.2, all users have seen the tooltip (or it's been dismissed). The field should be removed from the type and cleaned up in the v1→v2 migration no-op.

If not removed, it persists in AsyncStorage forever, consuming a small amount of space per plant and creating dead code paths.

**How to avoid:**
Include `_migratedFromV0` removal in the v1→v2 migration no-op: `const { _migratedFromV0, ...rest } = plant; return rest;`. Remove the field from the `Plant` type in `types/index.ts`. Remove any UI code that checks `plant._migratedFromV0`.

**Warning signs:**
- `_migratedFromV0` still in `Plant` type after v1.2 ships
- Any component rendering tooltip logic based on `_migratedFromV0`

**Phase to address:** v1.2 kickoff / schema version bump phase.

---

### MIN-6: Plant journal entries not deleted when plant is deleted

**What goes wrong:**
`deletePlant()` in `useStorage.tsx:364` cleans up `diagnosisHistory[id]` for the deleted plant. Journal entries stored at `plant.journals` (if embedded on the Plant object) would be deleted automatically with the plant. But if journals are stored in a top-level key (e.g. `journals: Record<plantId, JournalEntry[]>` as a sibling to `diagnosisHistory`), they become orphaned silently when the plant is deleted — same pattern that would have happened with `diagnosisHistory` if it weren't explicitly cleaned up.

**How to avoid:**
1. If journals are stored at top-level (recommended for future cloud sync alignment — same pattern as `diagnosisHistory`), extend `deletePlant()` to also clean `newJournals[id]`. One line. Do it in the same commit that adds the journal field.
2. If journals are embedded on `Plant` (simpler), they're automatically cleaned up but harder to migrate to cloud sync later. Design decision should be made explicitly.

**Warning signs:**
- `deletePlant` implementation in v1.2 not updated to clean journal data
- Orphaned journal entries for deleted plants accumulating in AsyncStorage

**Phase to address:** Plant journal phase. Include orphan cleanup in the deletePlant update.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| AI-only toxicity data without source verification | Faster authoring | Wrong safety data = real liability + trust loss | Never — always cross-check with ASPCA |
| Base64 photo storage in journal entries | Simpler implementation | AsyncStorage bloat → Android corruption | Never — use file system URIs |
| Single AppContent path tested (MVP only) | Faster development cycle | AUTH-mode bugs surface in a future milestone | Never — both paths must stay in sync |
| Streak counter visible to users | Higher engagement metric | Streak anxiety, user resentment, negative reviews | Never for this app's audience |
| Skip CURRENT_SCHEMA_VERSION bump for "minor" additive changes | One less migration to write | Version counter desync, harder future migrations | Acceptable ONLY if no migration function runs; still bump the version |
| Fertilize notifications without premium check | Simpler code | Notification fatigue for free users, undermines premium value | Acceptable in MVP of the feature if gating is flagged as a TODO and tracked |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `@gorhom/bottom-sheet` | Install via `npm install` directly | Use `npx expo install` to get Expo-compatible version for SDK 54 |
| `@gorhom/bottom-sheet` | Use standard `TextInput` inside a sheet | Use `BottomSheetTextInput` from the library |
| `react-native-gesture-handler` | Forget to wrap root component in `GestureHandlerRootView` | Add `GestureHandlerRootView` at the top of App.tsx, outside both AppContent paths |
| ASPCA toxicity data | Scrape ASPCA website without checking update date | ASPCA Toxic Plant database is periodically updated; note the access date in code comments |
| `expo-file-system` for journal photos | Store photos in cache directory | Store in document directory (`FileSystem.documentDirectory`) — cache may be cleared by OS |
| Voseo in AI-assisted copy | Prompt AI in generic Spanish | Explicitly specify "voseo argentino" and provide 3-5 example pairs in the prompt |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Journal photos as base64 in AsyncStorage | App crash on launch, "Failed to parse" errors on Android | File system URIs only; cap photo count per entry at 3 | ~10 journal entries with photos (varies by device) |
| Re-rendering all PlantCards when any one plant updates | Visible scroll jank as plant list grows | `React.memo` on `PlantCard`, stable callback refs for handlers | 15+ plants in collection mode |
| Bottom sheet Reanimated worklet on slow JS thread | Sheet snap animation jitter | Use `@gorhom/bottom-sheet` v5 (Reanimated 3 native driver) not v4 | Low-end Android devices |
| Discriminator switch over task types without default branch | Silent runtime no-op for unhandled task type | TypeScript `never` exhaustiveness check in all switches | Every time a new task type is added |

---

## "Looks Done But Isn't" Checklist

- [ ] **Fertilization task type:** Added to `Task.type` union, `getTasksForDay`, `notificationScheduler`, `plantHealth`, AND all discriminator switches in DayDetail/DayDetailModal/MonthCalendar — verify all 5 sites, not just the UI.
- [ ] **Pet toxicity:** Every catalog entry has `petToxicity` field set (not absent/undefined) — run grep count assertion.
- [ ] **Both AppContent paths:** Any new root provider (BottomSheetModalProvider, etc.) appears in BOTH `AppContentMVP` and `AppContentFull` — grep count must be 2.
- [ ] **Journal orphan cleanup:** `deletePlant()` cleans journal data for the deleted plant — verify in smoke test.
- [ ] **v1.1 backup removed:** `AsyncStorage.getItem('plant-agenda-v2.backup-pre-v1.1')` returns null after first v1.2 launch.
- [ ] **Voseo compliance:** All new ES strings pass the voseo linter — no Castilian imperative forms in new i18n keys.
- [ ] **Outdoor light labels:** `getLightLabel` with `isOutdoor: true` returns outdoor-appropriate terms — verify with `direct` + outdoor = "Pleno sol" (or equivalent).
- [ ] **Recommendation vs. custom value:** Existing user with custom `waterSchedule` can open educational modal and close it without their custom value being overwritten — smoke test this flow explicitly.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CRIT-1: Recommendation overwrites user custom values | HIGH | Schema migration to restore from backup is impossible (values gone); post-hoc: show "reset to our recommendation?" banner with ability to undo; long-term: cannot recover lost custom values without user input |
| CRIT-2: Wrong toxicity data shipped | HIGH | Hotfix release with corrected data; public acknowledgment in app update notes; add disclaimer copy to all entries as immediate mitigation |
| CRIT-3: AsyncStorage corruption from journal photos | HIGH | `AsyncStorage.clear()` is nuclear (loses all data); partial recovery via backup blob if v1.1 backup still present; lesson: never store binary in AsyncStorage |
| CRIT-4: Missing BottomSheetModalProvider in one path | MEDIUM | Hotfix App.tsx to add provider to missing path; no data impact |
| CRIT-5: Fertilize task type incomplete | MEDIUM | Hotfix the missing switch branches; notification rescheduling required if notificationScheduler was missed |
| MOD-7: Streak counter shipped and users complain | MEDIUM | Remove or hide the counter in a patch; UX damage partially irreversible (users who saw it feel the loss) |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CRIT-1: Recommendation overwrites custom values | Educational Detail Modal phase | Smoke test: open picker → close without saving → assert no updatePlant call was made |
| CRIT-2: Wrong toxicity data | Pet toxicity dataset phase | ASPCA cross-check checklist; grep guard for entries with undefined petToxicity |
| CRIT-3: Journal photo AsyncStorage bloat | Plant journal phase | Dev startup log of AppData JSON byte size; cap at 3 photos per entry |
| CRIT-4: Missing BottomSheetModalProvider | Bottom sheets phase (first phase) | Grep count for BottomSheetModalProvider in App.tsx == 2 |
| CRIT-5: Fertilize task type not fully wired | Fertilization feature phase | Smoke runner extension: fertilize task in getTasksForDay, notificationScheduler, plantHealth |
| MOD-1: Recommendation tone feels judgmental | Microcopy phase | Copy review checklist: no "incorrecto" or negative comparison language |
| MOD-2: Catalog quality drift + voseo drift | Catalog authoring phase | Voseo linter script; per-entry source citation check |
| MOD-3: Health badge hidden without communication | PlantCard cleanup phase | One-time tooltip for returning users; health detail always accessible via card tap |
| MOD-4: Swipe-delete vs. scroll conflict | Mobile UX modernization phase | Physical device test: diagonal swipe on iOS and Android; long-press fallback exists |
| MOD-5: Bottom sheet keyboard issues | Bottom sheets phase | Physical iOS device test with text input in a sheet |
| MOD-6: Bottom sheet z-order vs. PaywallModal | Bottom sheets phase | Test matrix: paywall + bottom sheet simultaneously |
| MOD-7: Streaks anti-pattern | Streaks/celebration phase | Design review gate before any streak counter implementation |
| MOD-8: v1.1 backup not cleaned up | v1.2 kickoff (first commit) | AsyncStorage.getItem backup key == null after first run |
| MOD-9: Fertilize gating decision | Fertilization phase design gate | features.ts FERTILIZE_SCHEDULE flag present from day one |
| MOD-10: Outdoor light labels wrong | UAT bug fixes phase (first) | getLightLabel('direct', true) returns outdoor term |
| MIN-1: Schema version not bumped | v1.2 kickoff | CURRENT_SCHEMA_VERSION == 2 in migration.ts |
| MIN-2: MigrationBanner triggers for v1.2 | v1.2 kickoff | Smoke test: load v1.1 schema → migrationFailed remains false |
| MIN-3: Voseo in microcopy | Microcopy phase | Voseo linter on all locale files |
| MIN-4: Long-press undiscoverable | Mobile UX modernization phase | All long-press actions have an alternative tap path |
| MIN-5: _migratedFromV0 not removed | v1.2 kickoff | Field absent from Plant type; grep returns 0 hits |
| MIN-6: Journal orphan on plant delete | Plant journal phase | Smoke test: add journal entries, delete plant, assert no orphans in storage |

---

## Sources

Grounded in direct reading of:
- `src/hooks/useStorage.tsx` — persistence model, deletePlant orphan cleanup pattern, debounce behavior
- `src/types/index.ts` — Plant type, Task.type union, `_migratedFromV0` deprecation notice
- `src/utils/migration.ts` — CURRENT_SCHEMA_VERSION=1, cleanupBackup_v1_1 TODO, v1→v2 stub stub
- `src/components/PlantCard.tsx` — `showHealthBadge = healthStatus.score < 80` (line 91), current 10-element visual structure
- `src/data/plantDatabase.ts` — catalog structure, 64 entries, existing field set
- `App.tsx` — Two-AppContent-paths discipline, PaywallModal root placement (lines 228, 368), provider hierarchy
- `src/hooks/usePremium.tsx` — PaywallCallbackOptions, showPaywall API, deferred callback pattern
- `package.json` — no react-native-gesture-handler, no reanimated, no @gorhom/bottom-sheet currently installed
- `.planning/PROJECT.md` — v1.2 milestone scope, Key Decisions table, Two-path discipline lock
- `src/config/features.ts` — feature flag architecture, CARE_STREAKS already defined as V2.0 feature
- Recent git commits — "add check_soil branch to all 4 discriminator chains" (confirming discriminator propagation pattern and risk)
- ASPCA Toxic Plant Database (canonical source): https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants

---
*Pitfalls research for: v1.2 Recommendation-First Plant Guide*
*Researched: 2026-05-01*
