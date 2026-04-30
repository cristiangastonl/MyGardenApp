---
phase: 04-schema-foundation-migration-core
plan: 06
subsystem: ux

tags: [migration, ux, banner, tooltip, i18n, voseo, theme, async-storage, schema-v1, modal-stacking]

# Dependency graph
requires:
  - phase: 04-schema-foundation-migration-core
    provides: useStorage exposes migrationFailed + migrationJustHappened (Plan 03), Plant._migratedFromV0 flag set during migration (Plan 02), warning palette + card/green/shadows from theme.ts (existing)
provides:
  - MigrationBanner non-modal in-place failure banner driven by useStorage().migrationFailed (Plan 07 wires)
  - MigrationTooltip per-plant first-open overlay backed by separate AsyncStorage key 'migration-tooltip-seen-v1.1'
  - MyPlantDetailModal renders the tooltip conditionally on plant._migratedFromV0 at the W3-required JSX position (sibling to ScrollView, NOT inside, last child of the rounded modal card)
  - i18n keys: migration.banner.{title,body,dismiss} + migration.tooltip.{body,cta} in EN and ES (voseo)
affects: [04-07, phase-5, phase-6, phase-7]

# Tech tracking
tech-stack:
  added: []  # No new runtime dependencies — hand-rolled overlay + existing AsyncStorage / i18next
  patterns:
    - "Non-modal failure banner: plain <View> with warningBg/warningText/warningBorder palette — sidesteps project modal-stacking bug (CLAUDE.md)"
    - "Hand-rolled tooltip overlay: <View pointerEvents='box-none'> with absolute-fill <Pressable> backdrop + absolute-positioned card; tap-anywhere-to-dismiss matches existing UX"
    - "Per-plant seen-state in separate AsyncStorage key 'migration-tooltip-seen-v1.1' (NOT in AppData) — clean v1.2 cleanup paired with cleanupBackup_v1_1()"
    - "i18n migration block placed AFTER tabs in both en/common.json and es/common.json — voseo verified scoped to the migration subtree via JSON.parse + regex (W5)"
    - "W3 deterministic JSX placement: tooltip rendered AFTER outermost </ScrollView> and BEFORE </Modal> — verified by line-number guard in acceptance check"

key-files:
  created:
    - src/components/MigrationBanner.tsx
    - src/components/MigrationTooltip.tsx
  modified:
    - src/components/MyPlantDetailModal.tsx
    - src/components/index.ts
    - src/i18n/locales/en/common.json
    - src/i18n/locales/es/common.json

key-decisions:
  - "Tooltip rendered as sibling-to-ScrollView (inside the rounded `container` View, NOT the dimmed `overlay` backdrop) — the absolute-fill backdrop now overlays the modal card content rather than the full screen including the dimmed area. This is the W3-binding placement: tip line 243 > </ScrollView> line 239 AND < </Modal> line 247."
  - "Tooltip seen-state lives in a separate AsyncStorage key (not AppData) per Open Question 5 recommendation — keeps domain model clean and v1.2 cleanup is a single removeItem call paired with cleanupBackup_v1_1()."
  - "Per-plant gating uses Plant._migratedFromV0 (Open Question 6 recommendation, set during migration in Plan 02) — new plants created post-migration never get the flag, so the tooltip never appears for them."
  - "Banner is a plain <View> (no <Modal>) — `grep -c 'Modal' src/components/MigrationBanner.tsx` returns 0; comment was rephrased from `<Modal>` to `modal component` to keep the count clean and avoid token collisions with future grep guards."
  - "AsyncStorage failure during read or write of seen-state is silently swallowed — tooltip will reappear on next open if write fails; preferred over blocking the UX or surfacing an error for a one-shot UX state."
  - "ES voseo verification is scoped to the migration block via JSON.parse extracting the `.migration` subtree, NOT a file-wide grep — prevents false positives from other voseo verbs elsewhere in es/common.json (W5 contract)."

patterns-established:
  - "Non-modal banner pattern: <View> + warning palette tokens from theme.ts — reusable for any future global-state banner (e.g., offline indicator)"
  - "First-open overlay pattern: AsyncStorage seen-map keyed by entity id, mount-effect read + dismiss-handler write, render null if seen — reusable for any future per-entity onboarding tooltip"

requirements-completed: [SCHEMA-07, UX-01]

# Metrics
duration: ~9min
completed: 2026-04-30
---

# Phase 4 Plan 06: Migration UX (Banner + Tooltip) Summary

**Two new theme-compliant UI surfaces — a non-modal failure banner and a per-plant first-open tooltip — both driven by i18n with voseo verified scoped to the migration block; tooltip integrated into MyPlantDetailModal at the W3-required JSX position (sibling to ScrollView, between the closing `</ScrollView>` and `</Modal>` tags).**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-30T21:50:14Z (recorded at start of Task 1)
- **Completed:** 2026-04-30 (immediately after Task 3 commit + verification)
- **Tasks:** 3 (i18n, MigrationBanner, MigrationTooltip + MyPlantDetailModal integration)
- **Files created:** 2 (MigrationBanner.tsx, MigrationTooltip.tsx)
- **Files modified:** 4 (MyPlantDetailModal.tsx, components/index.ts, en/common.json, es/common.json)

## Accomplishments

- **i18n keys added in EN + ES** under a new top-level `"migration"` block (after `"tabs"` in both files). All five keys (`banner.title`, `banner.body`, `banner.dismiss`, `tooltip.body`, `tooltip.cta`) populated. Spanish copy uses voseo (Tocá / revisá / querés / cambiamos), verified by a JSON.parse-based check scoped to the `.migration` subtree (W5 contract — no file-wide grep that could match unrelated copy).
- **MigrationBanner component** built as a plain `<View>` with horizontal layout (text column + dismiss button). Uses `warningBg` / `warningText` / `warningBorder` from `theme.ts`. NOT a modal component — `grep -c "Modal" src/components/MigrationBanner.tsx` returns 0. Component compiles in isolation; Plan 07 will wire it above MainTabs in `App.tsx`.
- **MigrationTooltip component** built with absolute-positioned overlay pattern: `<View pointerEvents="box-none">` containing a tap-anywhere `<Pressable>` backdrop (`colors.overlay`) and an absolute-positioned card (`colors.card` + `shadows.lg`). Reads `'migration-tooltip-seen-v1.1'` AsyncStorage key on mount; on dismiss (backdrop tap OR "Entendido" button), writes `seen[plantId] = true` and calls `onDismiss?.()`. AsyncStorage failures are swallowed silently (tooltip reappears on next open if write fails — acceptable per CONTEXT.md "no degraded mode on storage failures").
- **MyPlantDetailModal integration** at the W3-required position: tooltip JSX placed between `</ScrollView>` (line 239) and the matching `</View>` (line 245) that closes the rounded `container` View, sibling to the ScrollView (NOT inside it). Conditionally rendered only when `plant._migratedFromV0 === true && visible === true`.

## Task Commits

Each task was committed atomically:

1. **Task 1: i18n keys (EN + ES voseo)** — `d1eed53` (feat)
2. **Task 2: MigrationBanner component** — `e78331a` (feat)
3. **Task 3: MigrationTooltip component + MyPlantDetailModal integration** — `75538ce` (feat)

## Files Created/Modified

- `src/components/MigrationBanner.tsx` (NEW, 79 lines) — non-modal in-place banner
- `src/components/MigrationTooltip.tsx` (NEW, 125 lines) — first-open overlay with AsyncStorage-backed seen state
- `src/components/MyPlantDetailModal.tsx` (modified, +6 lines) — added MigrationTooltip import + conditional render block at W3 position
- `src/components/index.ts` (modified, +2 lines) — barrel exports for both new components
- `src/i18n/locales/en/common.json` (modified, +11 lines) — `migration` block
- `src/i18n/locales/es/common.json` (modified, +11 lines) — `migration` block (voseo)

## Final JSX Placement of `<MigrationTooltip>` in MyPlantDetailModal

```
Line 116: <Modal visible={visible} ...>
Line 122:   <View style={styles.overlay}>          ← OUTERMOST Modal-wrapping View
Line 123:     <View style={styles.container}>      ← rounded modal card
Line 124:       <View style={styles.handle} />
Line 134:       <ScrollView ...>
Line ...           ... ScrollView contents (header, info pills, diagnose button, ...) ...
Line 239:       </ScrollView>
Line 240:       {/* W3: tooltip is a sibling of ScrollView (NOT inside it) ... */}
Line 241:       {plant._migratedFromV0 && visible ? (
Line 242:         <MigrationTooltip plantId={plant.id} />
Line 243:         ← <MigrationTooltip line — between </ScrollView> and </Modal>
Line 244:       ) : null}
Line 245:     </View>                              ← closes container (line 123)
Line 246:   </View>                                ← closes overlay (line 122)
Line 247: </Modal>
```

**W3 acceptance: line 243 > line 239 (`</ScrollView>`) AND line 243 < line 247 (`</Modal>`)** ✓

## AsyncStorage Key + Value Shape

```
Key:   'migration-tooltip-seen-v1.1'
Value: Record<string, true>            // plantId → seen
```

Lifecycle:
- **Read on mount:** `getItem(key)` → JSON.parse → `seen[plantId] ? render null : render visible`
- **Write on dismiss:** read-modify-write `seen[plantId] = true` → `setItem(key, JSON.stringify(seen))`
- **Failure modes:** read fail → `state = 'hidden'` (tooltip never shows on this open); write fail → silent (tooltip will reappear on next open of the same plant)
- **v1.2 cleanup:** paired with `cleanupBackup_v1_1()` — single `AsyncStorage.removeItem('migration-tooltip-seen-v1.1')` call

## Confirmation Items (per plan §output)

- **Final placement of `<MigrationTooltip>`:** line 243 — sandwiched between `</ScrollView>` (line 239) and `</Modal>` (line 247). Sibling to ScrollView, last child of the rounded `container` View. Verified programmatically by the W3 line-number guard (acceptance check command from the plan).
- **Components do NOT use `<Modal>`:** Both `MigrationBanner.tsx` and `MigrationTooltip.tsx` have `grep -c "import.*Modal"` == 0. `MigrationBanner.tsx` has `grep -c "Modal"` == 0 (clean — no token collisions). `MigrationTooltip.tsx` does not import or render any Modal element. No stacking-bug risk.
- **W3 verification result:**
  ```
  ScrollView close: 239 / Tooltip: 243 / Modal close: 247 / Pass: true
  ```
- **W5 verification result:** `JSON.parse(es).migration` subtree contains the voseo markers `Tocá` (banner.body), `revisá` (tooltip.body), `querés` (tooltip.body), `cambiamos` (tooltip.body) — `Voseo present: true`. Scoped check, NOT file-wide.
- **Wave 3 sign-off:** This plan (04-06) is complete. The sibling Wave 3 plan 04-05 (catalog mechanical update) is running concurrently and has already updated `src/types/index.ts` (adding `lightLevel` / `waterSchedule` / `waterMode` to `PlantDBEntry`) and `src/utils/plantIdentification.ts` (bridging `waterDays ?? 7` / `sunHours ?? 3` defaults for v1.0 callers). Once Plan 05 also completes, Wave 4 (Plan 07 — App.tsx wiring + reschedule trigger) is unblocked.

## Decisions Made

- **Sibling-to-ScrollView placement (inside `container` View, not `overlay` View):** The plan's W3 line-number guard (`tip > lastSV && tip < mc`) is satisfied by both candidate positions. Choosing inside `container` makes the tooltip's `StyleSheet.absoluteFillObject` overlay only the rounded modal card content, NOT the dimmed full-screen backdrop area below the bottom sheet (`maxHeight: '92%'`). This matches the CONTEXT.md UX intent: "tooltip points at the new light + water fields", which live inside the modal card.
- **Tooltip uses `Pressable` (not `TouchableWithoutFeedback`) for the backdrop:** Pressable is the modern RN pattern with built-in `accessibilityLabel` propagation; `TouchableWithoutFeedback` requires a wrapping View child to render correctly with screenreaders.
- **Banner comment phrasing — "modal component" instead of `<Modal>`:** Initial implementation referenced `<Modal>` literally in the JSDoc; refactored to "modal component" so `grep -c "Modal" src/components/MigrationBanner.tsx` returns 0. Avoids token collisions with future automated greps that scan for Modal usage.
- **Voseo verification scoped to JSON subtree:** Per plan W5 contract — `JSON.parse(es).migration` extracts the migration block as a JS object, then `JSON.stringify(m)` serializes it for regex check. This is robust against false positives where voseo verbs appear elsewhere in the file but not specifically in the migration block.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Banner comment contained literal `<Modal>` token, violating verify intent**
- **Found during:** Task 2 verification — `grep -c "Modal" src/components/MigrationBanner.tsx` returned 1, but the plan's `<verify>` block expected 0 (the formal acceptance criterion `grep -c "import.*Modal"` returns 0 was already met).
- **Issue:** The JSDoc comment included the phrase `<Modal>` for documentation, which collided with the verify-level grep that scans for the literal token.
- **Fix:** Rephrased the comment from "MUST NOT be a `<Modal>` — project-wide modal-stacking bug" to "MUST NOT be a modal component — project-wide modal-stacking bug". Same documentation intent, no token collision.
- **Files modified:** `src/components/MigrationBanner.tsx` (comment block above the function)
- **Verification:** `grep -c "Modal" src/components/MigrationBanner.tsx` now returns 0; `grep -c "import.*Modal"` still returns 0.
- **Committed in:** `e78331a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking — verify-level grep collision)
**Impact on plan:** No scope creep. Acceptance criteria still met identically; deviation was purely cosmetic (comment wording) to satisfy the verify command.

## Issues Encountered

- **Concurrent Plan 05 changes to `src/types/index.ts` + `src/utils/plantIdentification.ts`:** Plan 05 (catalog mechanical update — running in parallel as a sibling Wave 3 plan) made `PlantDBEntry.waterDays` and `PlantDBEntry.sunHours` optional and bridged `plantIdentification.ts` with `?? 7` / `?? 3` defaults. During Task 2 verification a transient `tsc --noEmit` failure surfaced because of an apparent ordering issue with the unstaged Plan 05 changes; re-running tsc after a stash-pop confirmed the project compiles cleanly with all Plan 05 + Plan 06 changes together. Out-of-scope for this plan; Plan 05 owns the changes.

## Verification

All acceptance criteria pass:

```text
npx tsc --noEmit                                                                      exit 0 (PASS)
npm run check:legacy-fields                                                           exit 0 (PASS — no new legacy-field reads outside allowlist)
npm run smoke:migration                                                               63/63 PASS

# Task 1 — i18n
node parse + key existence check (en + es)                                            OK
node parse + voseo regex on .migration subtree (es)                                   Voseo OK
grep -c "\"migration\":" src/i18n/locales/en/common.json                              1
grep -c "\"migration\":" src/i18n/locales/es/common.json                              1
grep -c "Tu jardín está cargando con datos antiguos" src/i18n/locales/es/common.json  1
grep -c "Cambiamos cómo medimos luz y agua" src/i18n/locales/es/common.json           1

# Task 2 — MigrationBanner
wc -l src/components/MigrationBanner.tsx                                              79  (>= 40)
grep -c "export function MigrationBanner" src/components/MigrationBanner.tsx          1
grep -c "import.*Modal" src/components/MigrationBanner.tsx                            0
grep -c "Modal" src/components/MigrationBanner.tsx                                    0
grep -c "from '../theme'" src/components/MigrationBanner.tsx                          1
grep -c "warningBg" src/components/MigrationBanner.tsx                                1
grep -c "t('migration.banner" src/components/MigrationBanner.tsx                      3  (>= 2)
grep -c "export { MigrationBanner }" src/components/index.ts                          1

# Task 3 — MigrationTooltip + integration
wc -l src/components/MigrationTooltip.tsx                                             125 (>= 80)
grep -c "export function MigrationTooltip" src/components/MigrationTooltip.tsx        1
grep -c "migration-tooltip-seen-v1.1" src/components/MigrationTooltip.tsx             1
grep -c "AsyncStorage.setItem" src/components/MigrationTooltip.tsx                    1
grep -c "AsyncStorage.getItem" src/components/MigrationTooltip.tsx                    2  (>= 2)
grep -c "import.*Modal" src/components/MigrationTooltip.tsx                           0
grep -c "t('migration.tooltip" src/components/MigrationTooltip.tsx                    3  (>= 2)
grep -c "import { MigrationTooltip" src/components/MyPlantDetailModal.tsx             1
grep -c "_migratedFromV0" src/components/MyPlantDetailModal.tsx                       1  (>= 1)
grep -c "<MigrationTooltip" src/components/MyPlantDetailModal.tsx                     1
grep -c "export { MigrationTooltip }" src/components/index.ts                         1

# W3 placement (binding contract)
ScrollView close: 239 / Tooltip: 243 / Modal close: 247 / Pass: true                  ✓

# W5 voseo (binding contract)
JSON.parse(.migration) regex /Tocá|revisá|querés|cambiamos|regá/                      Voseo present: true  ✓
```

## Next Phase Readiness

- **Plan 04-05 (sibling, Wave 3 — catalog mechanical update):** Already in progress. Disjoint files from this plan. Both must complete before Wave 4.
- **Plan 04-07 (Wave 4 — App.tsx wiring + reschedule trigger):** Will:
  1. Render `<MigrationBanner onDismiss={...} />` above MainTabs when `useStorage().migrationFailed === true`
  2. Implement a `useEffect([plants, weather, migrationJustHappened])` that calls `cancelAllNotifications()` then triggers a full reschedule pass against the v1.1 schema, and emits `migration_failed { stage: 'reschedule' }` on reschedule errors
  3. Call `acknowledgeMigrationReschedule()` after successful reschedule to flip `migrationJustHappened` back to false
- **Phase 5 (UI propagation):** Will replace the legacy `plant.sunHours` / `plant.waterEvery` reads in `MyPlantDetailModal` info pills (lines 163-170 — currently using `plant.waterEvery` and `plant.sunHours` for display) with `lightLevel` / `waterSchedule.{warm,cold}` reads. The grep guard already passes because those reads are in the allowlist; Phase 5 cleanup makes them v1.1-native.
- **Phase 7 (edge functions):** No coupling to this plan.

## Self-Check: PASSED

- Files created verified present:
  - `src/components/MigrationBanner.tsx` ✓ FOUND (79 lines)
  - `src/components/MigrationTooltip.tsx` ✓ FOUND (125 lines)
- Files modified verified present:
  - `src/components/MyPlantDetailModal.tsx` ✓ FOUND (added MigrationTooltip import + conditional render)
  - `src/components/index.ts` ✓ FOUND (barrel exports both new components)
  - `src/i18n/locales/en/common.json` ✓ FOUND (migration block)
  - `src/i18n/locales/es/common.json` ✓ FOUND (migration block, voseo)
- Commits verified present in `git log --oneline -5`:
  - `d1eed53` ✓ FOUND (Task 1 — i18n keys EN + ES voseo)
  - `e78331a` ✓ FOUND (Task 2 — MigrationBanner non-modal banner)
  - `75538ce` ✓ FOUND (Task 3 — MigrationTooltip + MyPlantDetailModal integration)
- All acceptance grep counts pass (see Verification block above)
- `npx tsc --noEmit` exits 0 ✓
- `npm run check:legacy-fields` exits 0 ✓
- `npm run smoke:migration` 63/63 PASS ✓
- W3 placement: line 243 between `</ScrollView>` (line 239) and `</Modal>` (line 247) ✓
- W5 voseo: JSON-scoped regex on `.migration` subtree returns true ✓

---
*Phase: 04-schema-foundation-migration-core*
*Completed: 2026-04-30*
