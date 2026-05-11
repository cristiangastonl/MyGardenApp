# Phase 21: Plant Journal - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a per-plant `JournalEntry[]` log surfaced as a new "Diario" section in MyPlantDetailModal. Each entry has `id, date(ISO), text?, photoUri?, careTag?`. Storage lives in `AppData.journals?: Record<plantId, JournalEntry[]>` (additive optional, migration default `{}`). Photos are saved to `expo-file-system` `documentDirectory` (NOT base64-in-AsyncStorage). Quick-add via bottom sheet in 2 taps. Deleting a plant cleans up its journal entries AND its photo directory recursively. Journal reads are NEVER premium-gated (Blossom cautionary tale — never hold user data hostage when subscription lapses).

**Out of scope:** edit-in-place for entry text (delete + re-add is the only edit path); per-entry premium gating; cloud-sync of journal entries (v1.1 sync stays disabled until v2.0); journal-photo CDN upload (local-only in v1.2); brand-specific care-tag taxonomies (6 predefined chips locked); search/filter inside the timeline; pagination (reverse-chronological scroll only).

</domain>

<decisions>
## Implementation Decisions

### Diario section placement in MyPlantDetailModal (Area 1)

- **Placement:** Diario lands as the 6th section AFTER Mascotas — modal grows from 5 → 6 sections. Order: `🌿 ¿Qué hacer?` → `🏠 ¿Dónde ubicarla?` → `ℹ️ ¿Por qué?` → `⚙️ ¿Cómo la cuidás vos?` → `🐾 Mascotas` → `📔 Diario`. Diario as terminal section because it grows over time (variable height; user-generated content).
- **`ModalSectionId` union extended** with `'diario'` value — joining `'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas' | 'diario'`. This is the second deliberate extension (Phase 19 added `'mascotas'`; Phase 20 deliberately did NOT extend). Phase 21 merits extension because future surfaces (PlantCard "last entry" affordance, notification deep-link from "Has been a week since you wrote about X") will need to deep-link to the Diario section.
- **Empty-state always visible:** when `journals[plantId]` is empty or undefined, the Diario section header `📔 Diario` stays visible with an empty-state CTA copy: "Agregá tu primera entrada 📔" + the "+ Nueva entrada" button. Discoverability beats hiding. Mirrors the Phase 14 graceful-degradation pattern where the section header stays visible if at least one sub-block has data — for Diario, the empty-state CTA IS the sub-block.
- **Initial state on modal arrival:** collapsed by default (matches Phase 14 EducationalSection per-modal-session collapse state — `useState`, NOT AsyncStorage; resets every modal close). Auto-expand-on-arrival is NOT implemented in this phase (deferred — see Deferred Ideas).

### Bottom-sheet quick-add UX (Area 2)

- **Sheet size:** `snapPoints={['60%']}` single snap. The PlantCard long-press menu uses 30% but Diario quick-add needs more vertical space: 1 text input (multiline, ~3 lines) + photo preview tile + care-tag chip row + "Guardar"/"Cancelar" footer. 60% balances visibility with see-through context to the underlying modal.
- **Photo capture options:** TWO buttons inside the sheet — `📷 Cámara` (opens `ImagePicker.launchCameraAsync`) + `🖼️ Galería` (opens `ImagePicker.launchImageLibraryAsync`). Max flexibility matches common journaling app pattern (Day One, Bear). After capture, photo tile shows preview with a tiny "Quitar" X button.
- **CareTag input:** predefined chip row with 6 single-select options + 1 "(ninguna)" default. Tags + emojis: `riego 💧`, `fertilizar 🌱`, `sol ☀️`, `poda ✂️`, `problema ⚠️`, `otro 📝`. Tags are i18n via `t('journal.careTag.{key}')` keys. Single-select chip; tap selected chip again to deselect.
- **"2-tap max" mechanism:** Tap 1 = "+ Nueva entrada" button in the Diario section header (always present, whether empty or with entries). Tap 2 = "Guardar" button in the bottom sheet's footer (commits the entry with date defaulting to today; text/photo/tag all optional — empty entry is still valid with just the date). "Cancelar" closes the sheet without commit.

### Photo storage layout + orphan cleanup + edit/delete (Area 3)

- **Directory structure:** `${FileSystem.documentDirectory}journal/${plantId}/${entryId}.jpg`. Per-plant subdirectory makes recursive cleanup on plant delete a single `FileSystem.deleteAsync` call with `{ idempotent: true }`. `entryId` is generated via `crypto.randomUUID()` or similar at entry-creation time.
- **Orphan cleanup trigger:** Inside `useStorage.deletePlant(plantId)` action — BEFORE removing entries from `journals[plantId]` in AppData state, call `FileSystem.deleteAsync(documentDirectory + 'journal/' + plantId, { idempotent: true })` to recursively remove the photo directory. Idempotent flag handles the case where the directory doesn't exist (plant had no photo entries). Atomic-feeling: photo directory is gone the moment the plant is gone. NO startup orphan-scan; NO manual cleanup script.
- **Photo compression:** `expo-image-manipulator` pipeline — JPEG quality 0.7 + max width 1080px (preserve aspect ratio). Matches the existing `imageService` pattern from Phase 15+ catalog image uploads. Compression happens at save time (between camera/gallery capture and FileSystem write).
- **Edit / delete UX:** Long-press on a journal entry row in the timeline → BottomSheetModal opens with single option "Eliminar entrada". Tap → confirm via native `Alert.alert` ("¿Eliminar esta entrada?") → calls `useStorage.deleteJournalEntry(plantId, entryId)` which removes the entry from `journals[plantId]` AND deletes the per-entry photo file via `FileSystem.deleteAsync`. NO edit-in-place for text in v1.2 (delete + re-add is the only edit path — mirrors WhatsApp's "delete for me" pattern). NO swipe-to-delete.

### Claude's Discretion

- **Animation primitives:** reuse Phase 14 EducationalSection collapse pattern (Reanimated v4 `useSharedValue` + `useDerivedValue` + 180ms `Easing.out(Easing.cubic)` per Phase 14-03 device-tuning), same chevron 0°→90° rotation. NEW pattern NOT introduced.
- **Timeline rendering:** FlatList with reverse-chronological sort. Each entry row = small card (similar to PlantCard tasks-row mini-card but read-only). Date header at top of each row (e.g., "Hoy", "Ayer", "Hace 3 días", absolute date for >7d). Care-tag chip + thumbnail photo if present + text body.
- **Photo thumbnail in timeline:** ~80×80px square, tap to open full-screen photo viewer (use `react-native`'s `Image` component with `onPress`; viewer is a full-screen `Modal` with pinch-zoom OR a simple full-bleed render — viewer details at planner discretion).
- **2-tap max enforcement:** the orchestrator-facing requirement is "user can commit a JOURNAL entry in 2 taps from the modal-open state". Text input + photo + tag are all optional — empty entry with just the date is valid; this is what enables the 2-tap floor (open sheet → save).
- **Toast feedback:** reuse Phase 18 `<Toast>` primitive to confirm "Entrada guardada 📔" after `addJournalEntry`. 2-second auto-dismiss. Same pattern as Phase 18 swipe-to-delete undo toast (minus the Undo action — adding an undo here is deferred).
- **Test/smoke runner pattern:** same three-tier sentinel pattern as Phase 19/20 — `smoke-phase21.cjs` with PASS scaffold + SKIP placeholders for JOURNAL-01..05 + STRICT cross-phase regression sentinels for Phase 18 (PlantCard 5-element layout), Phase 19 (TOX-03/04/06), Phase 20 (FERT-03 + FERT-06 modal two-column).
- **`check-i18n-keys.mjs` extension:** add conditional validation for `journal.careTag.{riego,fertilizar,sol,poda,problema,otro}` keys + `journal.emptyState` + `journal.savedToast` etc. The new section's i18n keys live in `common.json`, not `plants.json` (plants.json is catalog-content-only).
- **`useStorage.addJournalEntry(plantId, entry)` / `deleteJournalEntry(plantId, entryId)` actions:** mirror the existing `addNote(plantId, note)` / `addReminder(plantId, reminder)` patterns at lines 791-806 — flat additions to the StorageContext interface + provider value object + dependency array.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`BottomSheetModal` from `@gorhom/bottom-sheet`** (`src/screens/PlantsScreen.tsx`, Phase 13 INFRA): wired at root provider hierarchy; pattern at line 448-470 (`ref={longPressSheetRef}` + `snapPoints` + `backdropComponent` + `BottomSheetView` content). Phase 21 quick-add reuses this verbatim with `snapPoints={['60%']}`.
- **`BottomSheetBackdrop`** (`src/screens/PlantsScreen.tsx:452-461`): standard backdrop with `disappearsOnIndex={-1}` + `appearsOnIndex={0}`. Reuse for the quick-add sheet.
- **`expo-file-system` documentDirectory** (`src/hooks/usePlantDiagnosis.ts:3` already imports `* as FileSystem from 'expo-file-system'`): pattern exists for `readAsStringAsync(uri, { encoding: 'base64' })` for diagnosis upload. Phase 21 will use `writeAsStringAsync` (or pipe from `ImagePicker` → `manipulateAsync` → final URI) and `deleteAsync` for cleanup.
- **`expo-image-picker`** — `ImagePicker.launchCameraAsync` + `launchImageLibraryAsync` (likely already in deps for PlantNet identification photo flow; verify in plan-phase research).
- **`expo-image-manipulator`** — JPEG quality 0.7 + 1080px max width pipeline; pattern exists in catalog `imageService` (Phase 15+).
- **`<Toast>` primitive** (`src/components/Toast.tsx`, Phase 18): plug "Entrada guardada 📔" 2s auto-dismiss feedback after `addJournalEntry`. Already wired for cross-screen use.
- **`ModalSectionId` union + `initialSection` prop + scrollViewRef + `sectionLayouts` mechanism** (`src/components/MyPlantDetailModal.tsx`, Phase 19/20): extend the union with `'diario'` and wire the new section into the existing scroll-to mechanism.
- **EducationalSection collapse/expand pattern** (`src/components/plant-detail/EducationalSection.tsx`, Phase 14 → tuned 180ms in 14-03 → reused in Phase 20 FertilizeCard): direct reuse for the Diario section's collapse/expand chevron.
- **`useStorage` action surface** (`src/hooks/useStorage.tsx:53-69` interface + line 791-806 provider value + line 833-836 dependency array): pattern locked from `addNote`/`deleteNote` (already exists), `addReminder`/`deleteReminder` (already exists). `addJournalEntry`/`deleteJournalEntry` slot in identically.
- **CRIT-1 deep-merge guard via `PROTECTED_USER_FIELDS`** (`src/hooks/useStorage.tsx:23`, currently 4 fields including `fertilizeSchedule`): NOT extended for journals — journals live OUTSIDE `Plant` object (in `AppData.journals` keyed by plantId), so the deep-merge guard doesn't apply. Journal entries are NEVER catalog-sourced.
- **Three-tier smoke runner template** (`scripts/smoke-phase19.cjs` + `scripts/smoke-phase20.cjs`): fork verbatim, replace TOX-*/FERT-* sentinels with JOURNAL-* sentinels.

### Established Patterns

- **Phase 14 per-field graceful degradation:** each sub-block within a section conditionally renders based on backing field's presence; section header stays visible if at least ONE sub-block has data. For Diario, the empty-state CTA IS the data when entries.length === 0.
- **Phase 14 per-modal-session collapse state** (`useState`, NOT AsyncStorage): resets every modal close. Diario uses the same.
- **Phase 18 atomic commit per task** (GSD baseline): each plan's tasks commit individually; no bundled commits.
- **Phase 18 long-press → BottomSheetModal** with menu options (Favorito/Editar/Eliminar): Phase 21 long-press-on-journal-entry reuses the pattern with single option "Eliminar entrada".
- **Phase 18 Toast 2s auto-dismiss + cross-screen consistency**: reuse for "Entrada guardada".
- **Phase 19 distinct top-level i18n namespaces** (sansevieria-cilindrica precedent): journal i18n keys live under `common.json` `journal.*` namespace, NEVER nested under shared parents.
- **Phase 20 careCardsRow flex-row pattern**: NOT used by Phase 21 (Diario stays single-column).
- **Atomic photo + entry write order:** photo compression + FileSystem write FIRST, then `addJournalEntry` mutates AppData with the resolved photoUri. If photo write fails, the entry is NOT added (preserves invariant: every photoUri in storage points to a real file).

### Integration Points

- **`AppData` type** (`src/types/index.ts`): add `journals?: Record<string, JournalEntry[]>` (additive optional). Migration default `{}` in `useStorage`'s load path.
- **`JournalEntry` type** (`src/types/index.ts`): new type `{ id: string; date: string; text?: string; photoUri?: string; careTag?: CareTag }` where `CareTag = 'riego' | 'fertilizar' | 'sol' | 'poda' | 'problema' | 'otro'`.
- **`useStorage` interface + provider** (`src/hooks/useStorage.tsx`): add `addJournalEntry(plantId, entry)`, `deleteJournalEntry(plantId, entryId)` actions; extend `deletePlant` to recursively remove the per-plant photo directory.
- **`MyPlantDetailModal.tsx`** (Phase 14 + 19 + 20 site): add Diario as 6th section, extend `ModalSectionId` union, wire `sectionLayouts` ref entry, add "+ Nueva entrada" button → `setSheetVisible(true)` state, mount `<JournalQuickAddSheet>` portal at the modal root.
- **New component: `src/components/plant-detail/JournalSection.tsx`** — Diario section render (collapsed/expanded shell + timeline FlatList + "+ Nueva entrada" header button).
- **New component: `src/components/plant-detail/JournalQuickAddSheet.tsx`** — bottom sheet content (text input + photo capture buttons + care-tag chips + Guardar/Cancelar footer).
- **New component: `src/components/plant-detail/JournalEntryRow.tsx`** — single timeline row (date header + care-tag chip + thumbnail + text body); long-press → delete BottomSheetModal.
- **i18n keys** (`src/i18n/locales/{en,es}/common.json`): new `journal.*` namespace (header, emptyState, savedToast, photoCamera, photoGallery, careTag.{riego,fertilizar,sol,poda,problema,otro}, deleteConfirm, etc.). ES uses voseo throughout.
- **Smoke runner** (`scripts/smoke-phase21.cjs`): new, forked from `smoke-phase20.cjs`. Preserves STRICT cross-phase regression sentinels for Phase 18 + 19 + 20.
- **`check-i18n-keys.mjs`** (`scripts/check-i18n-keys.mjs`): no extension needed (journal keys live in common.json which is not catalog-content — the script validates plants.json catalog parity, not common.json).

</code_context>

<specifics>
## Specific Ideas

- **6-section modal lock:** modal grows from 5 to 6 sections. Diario is the terminal section. NO further extensions in v1.2.
- **`ModalSectionId` second deliberate extension:** Phase 19 added `'mascotas'`, Phase 21 adds `'diario'`. Phase 20 deliberately did NOT extend (used orthogonal `initialExpanded` prop instead). Phase 21 merits extension because future surfaces will deep-link.
- **Per-plant photo subdirectory cleanup is atomic-feeling:** `FileSystem.deleteAsync(documentDirectory + 'journal/' + plantId, { idempotent: true })` inside `deletePlant` BEFORE state mutation means the photos are gone the moment the plant is gone — no orphan-scan, no manual cleanup. Idempotent flag handles plants that never had photos.
- **`addJournalEntry` is allowed to write an entry with empty text + no photo + no tag** — only the date (defaulting to today). This is what enables the 2-tap floor. The intent is "I noticed something but haven't decided what — log the moment, fill in later" → user can long-press to delete + re-add if they decide nothing was worth logging.
- **Premium gate decision (JOURNAL-05):** journal entries are NEVER premium-gated at read level. The Blossom cautionary tale: if a user's subscription lapses, they MUST still be able to read everything they wrote. Premium can gate FUTURE features (cloud sync, advanced filters) — never historical user content.

</specifics>

<deferred>
## Deferred Ideas

- **Auto-expand Diario on modal arrival** if recent entry within last 7 days — deferred to a future polish phase; v1.2 keeps the section collapsed by default for consistency with other modal sections.
- **Edit-in-place for journal entry text** — explicitly OUT for v1.2; delete + re-add is the only edit path. Future phase could add WhatsApp-style "Editado" indicator + edit history.
- **Per-entry care-tag analytics** ("you noted a problema 3 times this month") — Phase 22 gamification scope, NOT here.
- **Journal photo CDN upload + cloud sync** — local-only in v1.2; v2.0 multi-device sync scope.
- **Search inside journal timeline** — out of scope; reverse-chronological scroll only. If a user has 100+ entries we'll address this in v2.0.
- **Pagination of the timeline** — v1.2 ships all entries in one FlatList. Pagination if/when performance demands it.
- **Free-text custom care tags** — only 6 predefined chips in v1.2 ("otro" is the escape hatch). Free-text tags would require i18n + analytics taxonomy decisions.
- **Multi-photo per entry** — single photo only in v1.2. Future phase could add carousel.
- **Toast "Undo" for entry delete** — Phase 18 ships the Undo Toast pattern, but Phase 21 keeps deletion confirmed via native Alert + no undo (matches WhatsApp delete-for-me UX). Future phase could add Undo.
- **PlantCard "last entry" affordance** (e.g., small "🆕 hace 2d" badge if recent journal entry) — Phase 22 or 23 scope; PlantCard 5-element budget is locked in Phase 18 and would need re-litigating.
- **Notification deep-link to Diario** ("Hace una semana que no escribís sobre X") — out of scope; could compose with `initialSection='diario'` mechanism in a future phase.
- **Streak-style gamification on journal entries** — explicitly OUT per the streak-anxiety anti-pattern locked in `gam_anti_patterns.md` memory + Phase 22 scope.
- **Cloud backup of journal photos** — out of scope; local-only with documentDirectory.
- **Image cropping / filters** — out of scope; compression + max-width is all the manipulation v1.2 does.

</deferred>

---

*Phase: 21-plant-journal*
*Context gathered: 2026-05-11 via smart-discuss (autonomous mode)*
