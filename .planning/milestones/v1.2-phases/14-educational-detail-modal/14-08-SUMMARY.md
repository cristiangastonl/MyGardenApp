---
phase: 14-educational-detail-modal
plan: 08
subsystem: manual-checkpoint
tags: [edu-01, edu-04, edu-05, manual-device-test, android-verified, ios-deferred, ux-deviations-fixed-inline]

# Dependency graph
requires:
  - phase: 14-00..07
    provides: full Phase 14 surface (smoke runner PASS 19/19, catalog content 64/64, modal restructure with EducationalSection)
provides:
  - "Manual device verification of EDU-01 (sections + animation + collapse state) on physical Android"
  - "5 inline UX fix commits authored from device-test feedback (animation tuning, copy improvements, first-render glitch fix)"
  - "v1.2 device-test backlog entry documenting deferred items + databaseId persistence bug"
affects: [Phase 15+ all downstream phases that depend on the educational modal surface; v1.2 milestone-end QA pass]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "First-render height-measurement glitch resolution for Reanimated v4 collapsible: render with height: 'auto' until first user interaction, then switch to controlled animated height. Avoids the chicken-and-egg where height: 0 + overflow: hidden prevents onLayout from firing."
    - "Inline UX-deviation fixes during device-test checkpoint — surgical commits with targeted scope; alternative to gap-closure phase when fixes are pure JS / no architectural impact"

key-files:
  created: []
  modified:
    - "src/components/plant-detail/EducationalSection.tsx (animation + first-render glitch fix)"
    - "src/components/MyPlantDetailModal.tsx (empty-state placeholders + light label)"
    - "src/i18n/locales/en/common.json + src/i18n/locales/es/common.json (rename + new placeholder keys)"

key-decisions:
  - "5 UX fixes applied inline rather than in a gap-closure phase: animation tuning (250ms→180ms cubic-out), 'Tus ajustes'→'¿Cómo la cuidás vos?' rename, '¿Dónde ponerla?'→'¿Dónde ubicarla?' rename (es-AR), 'ponerla al sol'→'sacarla al sol' (es-AR polish), empty-section placeholders, light label prefix, first-render glitch fix. All JS-only."
  - "Phase 14 closes with documented deferrals (full Phase 14 verification gated by databaseId persistence bug) — user opted to defer full QA to milestone-end + a Phase 14.x gap-closure for the databaseId bug."

patterns-established:
  - "When device-test reveals UX issues that are surgical fixes (no scope/architecture change), apply inline as polish commits; reserve gap-closure phases for issues requiring structural changes or new requirements"

requirements-completed: [EDU-01 (with inline UX polish), EDU-04 (smoke runner verified), EDU-05 (logic verified, full UX gated by databaseId bug)]

# Metrics
duration: ~90 min device test + 5 inline UX fix commits + bookkeeping
completed: 2026-05-06
---

# Phase 14 Plan 08: Manual Device Verification Checkpoint Summary

**Android device verification surfaced 5 UX deviations + 1 deeper architectural bug. The 5 UX deviations were fixed inline via surgical commits during the checkpoint (animation tuning, copy renames, empty-state placeholders, light label, first-render glitch fix). The deeper bug — `databaseId` is never set when adding plants through any current flow, blocking real-content rendering of the Phase 14 educational fields — was documented in the v1.2 device-test backlog memory entry for a future gap-closure phase. User opted to close Phase 14 with this gap deferred and resume the full QA pass at milestone-end. EDU-01 structurally verified on device with all 5 inline polish commits applied; EDU-04/05 wired correctly per smoke runner but full user-visible verification gated by the databaseId bug.**

## Performance

- **Duration:** ~90 min device test + 5 inline UX fix commits + bookkeeping
- **Started:** 2026-05-05 (build attempt) → 2026-05-06 (Android device test session)
- **Completed:** 2026-05-06
- **Tasks:** 1 (autonomous: false — checkpoint:human-verify)
- **Files modified:** 0 in this plan; 5 inline UX fix commits authored across `EducationalSection.tsx`, `MyPlantDetailModal.tsx`, `en/common.json`, `es/common.json`

## Accomplishments

### Pre-check gates (all green at start of checkpoint)
- `node scripts/smoke-phase14.mjs` → PASS 19/19 (no skips, no fails)
- `npx tsc --noEmit` → exit 0
- `npm run check:i18n-keys` → 64 catalog ids verified
- 4 locked emojis present in `MyPlantDetailModal.tsx` (count ≥ 4)
- `EducationalSection.tsx`, `overrideDetection.ts`, deep-merge guard with `fromUserEdit` all wired

### Build chain pain (resolved before testing)
- Initial `npx expo run:android` failed with `Type expo.modules.ExpoModulesPackageList$LazyHolder is defined multiple times` — Gradle dexing error from stale cache (Phase 13's autolinking artifacts left stale transformed `.jar`s). Multiple cleanup attempts cascaded: `gradlew clean` failed, `rm -rf ~/.gradle/caches/transforms` left Gradle in inconsistent state (NoSuchFileException for `settings-plugin.jar`), `rm -rf ~/.gradle/caches/8.14.3` regenerated cache but Gradle daemon held stale state.
- Resolution: full nuclear cleanup (`./gradlew --stop` + `rm -rf ~/.gradle` + `rm -rf android/build android/app/build android/.gradle node_modules/.cache` + `npx expo prebuild --clean --platform android` + create `android/local.properties` with sdk.dir + `npx expo run:android`). Took ~15 min total.
- Pre-cleanup safety: 16 untracked PLAN.md files committed in 3 audit-trail commits (`939eb64` phase 12, `eaff628` phase 13, `21c9f36` phase 14) before any destructive operation.

### Device test feedback + inline fixes

| # | Feedback | Fix commit | Notes |
|---|---|---|---|
| 1 | Section structure visible (4 sections in order, ActiveProblems folded into 🌿) | (no fix needed — verified PASS) | EDU-01 structural verification ✓ |
| 2 | Collapse animation feels sluggish, "hace pensar que la app funciona mal" | `863d63e` | 250ms inOut(ease) → 180ms out(cubic). iOS/Material standard for "appearing UI" |
| 3 | Per-modal-session collapse state resets correctly | (no fix — verified PASS) | EDU-01 verified ✓ |
| 4 | Section title "Tus ajustes" ambiguous (sounds like app preferences); empty 🌿 + 🏠 sections show no content | `2ebdd43` | Rename to "¿Cómo la cuidás vos?" (matches question pattern of other 3 sections); add empty-state placeholder keys with positive forward-looking copy; add "Luz:" prefix label to lightLevel row |
| 5 | "¿Dónde ponerla?" sounds awkward in es-AR | `dc98030` | Rename to "¿Dónde ubicarla?" (more natural Argentine Spanish). Audit confirmed 0 "ponerla/ponela/poner" in plants.json (320 ES strings authored in 14-04..07 are clean) |
| 6 | "Hoy toca ponerla al sol" daily reminder also feels awkward | `aaefae7` | Renamed to "Hoy toca sacarla al sol". Not Phase 14 scope but bundled as related polish |
| 7 | After all fixes deployed, sections still render with empty body (header only, no content AND no placeholder) | `f6a5b74` | First-render height-measurement glitch (RESEARCH §Pitfall 4): bodyClip starting at height: 0 + overflow: hidden prevents inner View layout → onLayout never fires → measuredHeight stays 0 forever. Fix: render with height: 'auto' until first user toggle, then switch to animated height |

### Deeper architectural bug surfaced (deferred)

After the first-render glitch fix landed, the user reported still seeing empty sections. Root-cause investigation revealed the underlying issue: `AddPlantModal.tsx:96-119` (handleAdd) and `PlantIdentifierModal.tsx:98-115` (plantData construction) **never set `plant.databaseId`** on save. This means:

- `getCatalogEntry(plant.databaseId)` returns null for all plants added through current UI flows
- `strictDbEntry` is always null → 5 educational fields cannot resolve to catalog entries → Phase 14 sections fall back to placeholders
- Override detection (EDU-05) cannot trigger — there's no catalog entry to compare user values against

**Decision:** Deferred to a future Phase 14.x gap-closure plan or Phase 15.x. User opted to close Phase 14 with the bug documented in `v1_2_test_backlog.md` memory and resume full QA at milestone-end.

## Task Commits

1. **Task 1: Manual device verification checkpoint** — _no commit_ (autonomous: false; verification-only task)

**Inline UX fix commits authored during the checkpoint:**
- `863d63e` fix(14): tune EducationalSection animation — 180ms + cubic-out
- `2ebdd43` fix(14): rename Tus ajustes + add empty-section placeholders + light label
- `dc98030` fix(14): rename "¿Dónde ponerla?" → "¿Dónde ubicarla?" (es-AR)
- `aaefae7` chore(i18n): rename "ponerla al sol" → "sacarla al sol" (es-AR polish)
- `f6a5b74` fix(14): EducationalSection first-render glitch — height:auto until first toggle

**Audit-trail commits before nuclear cleanup:**
- `939eb64` docs(12): commit plan files retrospectively
- `eaff628` docs(13): commit plan files retrospectively
- `21c9f36` docs(14): commit plan files

## Files Created/Modified

- `src/components/plant-detail/EducationalSection.tsx` (animation tuning + first-render glitch fix; ~10 LOC delta)
- `src/components/MyPlantDetailModal.tsx` (empty-state placeholders for 🌿 and 🏠, light label prefix; ~20 LOC delta)
- `src/i18n/locales/en/common.json` (1 retitle, 1 reword, 2 new keys: emptyWhatToDo + lightLabel)
- `src/i18n/locales/es/common.json` (1 retitle, 1 reword, 2 new keys + 1 unrelated daily-reminder polish)

## Verified Acceptance Behaviors

| Acceptance | Status | Notes |
|---|---|---|
| 1. Section structure (4 sections in order, ActiveProblems folded into 🌿) | ✅ VERIFIED on device | Renders correctly on physical Android |
| 2. Collapse animation smooth | ✅ FIXED + APPLIED | After commit `863d63e` + `f6a5b74` reload pending — initial implementation broke; final implementation needs re-verify on next device test |
| 3. Per-modal-session collapse state | ✅ VERIFIED on device | Resets correctly on close |
| 4. Content quality (voseo, mechanism citations) | ✅ VERIFIED via npm run check:i18n-keys + content review during 14-04..07 |
| 5. LightLevelPicker pre-select on PlantNet identification | ⏸ DEFERRED | Not exercised — requires PlantNet flow + databaseId fix; logic verified via smoke runner |
| 6. Override note triggers on user value ≠ catalog | ⏸ DEFERRED | Gated by databaseId bug; logic unit-tested via smoke runner (compareUserVsCatalog fixture set in `scripts/smoke-phase14.mjs`) |
| 7. Custom-plant fallback (4 sections render with placeholders, ¿Por qué? hidden when whyRationale absent) | ⏸ DEFERRED | Empty-state placeholders shipped + first-render glitch fixed; needs reload + re-verify on next device test |
| 8. Deep-merge guard (custom waterSchedule survives navigation) | ✅ VERIFIED via smoke runner | EDU-06 logic tested with fromUserEdit flag fixture |

## Deferred Items

### 1. `databaseId` persistence bug (BLOCKING for steps 5/6/7 full e2e verification)

Documented in detail in `v1_2_test_backlog.md` memory entry. Summary: every current "add plant" flow loses the catalog id. Fix scope: ~10 LOC across `AddPlantModal.handleAdd` + `PlantIdentifierModal.plantData` construction. To unblock: small Phase 14.x gap-closure or fold into Phase 15.

### 2. Re-verify steps 2/7 after fixes

Animation fix (`863d63e` + `f6a5b74`) and empty-state placeholder fix (`2ebdd43`) need re-verification with reload (or fresh build). Initial implementation broke; final needs a fresh device-test pass.

### 3. iOS device verification (carried forward from Phase 13 pattern)

Same Xcode 26.3 toolchain friction as Phase 13. Deferred to milestone-end batching.

### 4. Plant identification + override note end-to-end (steps 5 + 6)

Gated by databaseId fix. Once unblocked, exercise PlantNet identification → verify pre-select → verify override note fires when user picks non-default lightLevel.

## Decisions Made

1. **Inline UX fixes vs gap-closure phase.** The 5 UX deviations surfaced during the checkpoint were all surgical (no architecture change, no new requirements, JS-only). Applied inline as polish commits with separate audit trail rather than spinning up a gap-closure phase. Reserved gap-closure for the deeper databaseId bug.

2. **Defer databaseId fix to a future phase.** User explicitly opted to close Phase 14 and continue with the next phase rather than absorb a 14.1 gap-closure into the current cycle. Trade-off: Phase 14 sections won't display real content for any plant added through current UI until the databaseId bug is fixed; mitigated by the empty-state placeholders that explain what WILL appear.

3. **Document deferred verification in v1.2 backlog memory.** Mirrors Phase 13's pattern. Provides a structured checklist of what needs re-verification before milestone-end.

4. **Atomic commits per fix.** Each UX deviation got its own commit (5 fixes = 5 commits). Provides clean revert path if any individual fix proves problematic + clear audit trail of device-test feedback → code change correspondence.

## Issues Encountered

1. **Gradle dexing cache corruption.** Phase 13's autolinking artifacts left stale transformed `.jar`s; surfaced as `Type LazyHolder is defined multiple times`. Took multiple cleanup iterations to resolve (each clean attempt left Gradle in slightly different inconsistent state). Lesson learned: when `rm -rf ~/.gradle/caches/transforms` doesn't fully fix, go straight to nuclear (`rm -rf ~/.gradle` + project-local clean + `expo prebuild --clean`) rather than incremental attempts.

2. **First-render height-measurement glitch in EducationalSection.** RESEARCH.md's Pitfall 4 was acknowledged as "may need upgrading from lazy-measure to off-screen-measurer if device test reveals jank" — confirmed needed. The simpler lazy-measure pattern broke entirely on device because of the height: 0 + overflow: hidden chicken-and-egg. Fix used a different approach (state-gated height: 'auto' until first interaction) which is even simpler than the off-screen-measurer.

3. **databaseId never persisted on save.** Pre-existing gap from add flow never wiring this field. Surfaced when Phase 14 made it the critical input for educational-field rendering. Documented in v1.2 backlog for future fix.

4. **Stream timeouts on long-content executors.** Plans 13-01 and 14-05 both hit Claude API stream-idle timeouts mid-bookkeeping after task commits landed. Pattern: long high-token-output content-authoring executors. Both finalized via orchestrator after spot-checks confirmed task commits + gates green. Operationally fine, but worth noting for future content-heavy phases.

## User Setup Required

None for Phase 14 closure. Future Phase 14.x gap-closure for databaseId bug is the next setup-touching change.

## Next Phase Readiness

- **Phase 14 EDU-01..07 all marked complete in REQUIREMENTS.md** — wiring verified via smoke runner; user-visible content rendering blocked by orthogonal databaseId bug
- **Phase 15 unblocked** — pet-toxicity badging can build on top of the 4-section modal structure (TOX content can populate existing 🌿 ¿Qué hacer? or be added as a 5th section in Phase 15's discretion)
- **Phase 16 unblocked** — fertilization detail can extend nutrients sub-block in 🌿 ¿Qué hacer?
- **Phase 18 unblocked** — swipe-to-delete + haptic call sites can build on EducationalSection animation pattern
- **Phase 21 unblocked** — journal quick-add bottom sheet (first real BottomSheet caller) ready
- **Phase 22 unblocked** — task-done celebration can use triggerHaptic + Skeleton patterns
- **v1.2 device-test backlog updated** with 4 entries: databaseId fix, animation re-verify, custom-plant fallback re-verify, full e2e steps 5/6 (PlantNet pre-select + override note)
- **Phase 10 SEC-01 grep guard preserved** across all Phase 14 commits

---
*Phase: 14-educational-detail-modal*
*Completed: 2026-05-06*

## Self-Check: PASSED

Verification (run after SUMMARY.md write):

- `node scripts/smoke-phase14.mjs` exit code: 0
- Final report: `[smoke-phase14] PASS 19/19`
- `npx tsc --noEmit` exit code: 0
- `npm run check:i18n-keys` → 64 catalog ids verified
- All 5 inline UX fix commits exist in git log: `863d63e`, `2ebdd43`, `dc98030`, `aaefae7`, `f6a5b74` VERIFIED
- All 7 EDU requirements marked complete in REQUIREMENTS.md (Plans 14-01..07)
- v1.2 device-test backlog memory updated with Phase 14 deferred items (databaseId bug + re-verify items)
- SEC-01 grep guard: 0 hits (count 0 on every line)
