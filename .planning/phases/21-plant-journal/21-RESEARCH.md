# Phase 21: Plant Journal — Research

**Researched:** 2026-05-11
**Domain:** Per-plant journal entries with file-system photo storage + bottom-sheet quick-add UX + reverse-chronological timeline in MyPlantDetailModal
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Diario section placement in MyPlantDetailModal (Area 1)**
- **Placement:** Diario lands as the 6th section AFTER Mascotas — modal grows 5→6 sections. Order: `🌿 ¿Qué hacer?` → `🏠 ¿Dónde ubicarla?` → `ℹ️ ¿Por qué?` → `⚙️ ¿Cómo la cuidás vos?` → `🐾 Mascotas` → `📔 Diario`. Diario terminal because it grows over time.
- **`ModalSectionId` union extended** with `'diario'` value → `'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas' | 'diario'`. Second deliberate extension (Phase 19 added `'mascotas'`; Phase 20 deliberately did NOT extend — used orthogonal `initialExpanded`). Phase 21 merits extension because future surfaces (PlantCard "last entry" affordance, notification deep-link) will deep-link.
- **Empty-state always visible:** when `journals[plantId]` is empty/undefined, the header `📔 Diario` stays visible with empty-state CTA "Agregá tu primera entrada 📔" + "+ Nueva entrada" button. Discoverability beats hiding.
- **Initial state on modal arrival:** collapsed by default (matches Phase 14 EducationalSection per-modal-session collapse — `useState`, NOT AsyncStorage; resets every modal close). Auto-expand-on-arrival NOT implemented this phase.

**Bottom-sheet quick-add UX (Area 2)**
- **Sheet size:** `snapPoints={['60%']}` single snap. PlantCard long-press uses 30%; Diario quick-add needs more vertical space (multiline text input + photo preview + chip row + footer). 60% balances visibility with see-through to underlying modal.
- **Photo capture options:** TWO buttons inside the sheet — `📷 Cámara` (`ImagePicker.launchCameraAsync`) + `🖼️ Galería` (`ImagePicker.launchImageLibraryAsync`). After capture, photo tile shows preview with "Quitar" X button.
- **CareTag input:** predefined chip row, 6 single-select options + 1 "(ninguna)" default. Tags + emojis: `riego 💧`, `fertilizar 🌱`, `sol ☀️`, `poda ✂️`, `problema ⚠️`, `otro 📝`. Single-select; tap selected chip again to deselect. i18n via `t('journal.careTag.{key}')`.
- **"2-tap max" mechanism:** Tap 1 = "+ Nueva entrada" button (always present in Diario header). Tap 2 = "Guardar" button in sheet footer (date defaults today; text/photo/tag ALL optional — empty entry with just date is valid).

**Photo storage layout + orphan cleanup + edit/delete (Area 3)**
- **Directory structure:** `${FileSystem.documentDirectory}journal/${plantId}/${entryId}.jpg`. Per-plant subdirectory makes recursive cleanup on plant delete a single `FileSystem.deleteAsync` call with `{ idempotent: true }`. `entryId` generated at entry-creation time.
- **Orphan cleanup trigger:** Inside `useStorage.deletePlant(plantId)` — BEFORE removing entries from `journals[plantId]`, call `FileSystem.deleteAsync(documentDirectory + 'journal/' + plantId, { idempotent: true })` to recursively remove photo directory. Idempotent flag handles directories that don't exist. Atomic-feeling. NO startup orphan-scan; NO manual cleanup script.
- **Photo compression:** `expo-image-manipulator` pipeline — JPEG quality 0.7 + max width 1080px (preserve aspect ratio). Compression happens between camera/gallery capture and FileSystem write.
- **Edit / delete UX:** Long-press on journal entry row → BottomSheetModal with single option "Eliminar entrada". Tap → confirm via native `Alert.alert` ("¿Eliminar esta entrada?") → `useStorage.deleteJournalEntry(plantId, entryId)` removes entry from `journals[plantId]` AND deletes the per-entry photo file. NO edit-in-place for text in v1.2; NO swipe-to-delete.

### Claude's Discretion
- **Animation primitives:** reuse Phase 14 EducationalSection collapse (Reanimated v4 `useSharedValue` + `useDerivedValue` + 180ms `Easing.out(Easing.cubic)`). NEW pattern NOT introduced.
- **Timeline rendering:** FlatList with reverse-chronological sort. Each entry row = small card. Date header per row ("Hoy", "Ayer", "Hace 3 días", absolute date for >7d). Care-tag chip + thumbnail photo if present + text body.
- **Photo thumbnail:** ~80×80px square, tap to open full-screen photo viewer (RN `Image` + `onPress`; viewer details at planner discretion).
- **2-tap max enforcement:** orchestrator-facing requirement is "user can commit a JOURNAL entry in 2 taps from modal-open state". Text/photo/tag all optional → empty entry with just date is valid → 2-tap floor (open sheet → save).
- **Toast feedback:** reuse Phase 18 `<Toast>` for "Entrada guardada 📔" 2s auto-dismiss (minus Undo action).
- **Test/smoke runner:** same three-tier sentinel pattern as Phase 19/20 — `smoke-phase21.cjs` with PASS scaffold + SKIP placeholders for JOURNAL-01..05 + STRICT cross-phase regression for Phase 18/19/20.
- **`check-i18n-keys.mjs` extension:** NO extension needed — journal i18n keys live in `common.json` (NOT `plants.json`). Script only validates catalog-content parity.
- **`useStorage.addJournalEntry(plantId, entry)` / `deleteJournalEntry(plantId, entryId)` actions:** mirror `addNote`/`addReminder` patterns at useStorage.tsx lines 53-69 (interface) + 791-806 (provider value) + 833-836 (dependency array).

### Deferred Ideas (OUT OF SCOPE)
- Auto-expand Diario on modal arrival if recent entry within 7 days — deferred to polish phase
- Edit-in-place for journal entry text — delete + re-add is the only edit path in v1.2
- Per-entry care-tag analytics — Phase 22 gamification scope
- Journal photo CDN upload + cloud sync — local-only in v1.2; v2.0 multi-device sync
- Search inside journal timeline — reverse-chronological scroll only
- Pagination — v1.2 ships all entries in one FlatList
- Free-text custom care tags — only 6 predefined chips ("otro" is the escape hatch)
- Multi-photo per entry — single photo only in v1.2
- Toast "Undo" for entry delete — Phase 18 ships Undo pattern but Phase 21 uses Alert + no undo
- PlantCard "last entry" affordance — Phase 22/23 scope; PlantCard 5-element budget locked in Phase 18
- Notification deep-link to Diario — could compose with `initialSection='diario'` in future phase
- Streak-style gamification on journal entries — explicitly OUT (streak-anxiety anti-pattern)
- Cloud backup of journal photos — out of scope
- Image cropping / filters — only compression + max-width in v1.2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| **JOURNAL-01** | `AppData.journals?: Record<plantId, JournalEntry[]>` added (additive optional); migration default `{}` | §Architecture Patterns "AppData Extension" — exact insertion site at types/index.ts:138-154; default `{}` lands in useStorage load path lines 277-329 (`data.journals \|\| {}`) |
| **JOURNAL-02** | `JournalEntry` type `{ id, date(ISO), text?, photoUri?, careTag? }`; photos in `documentDirectory` (NOT base64) | §Standard Stack — `expo-file-system` `~19.0.21` already installed; existing `photoService.ts` pattern uses `Paths.document.uri` + `File` + `Directory` API (NOT legacy `FileSystem.documentDirectory` string); §Code Examples "Photo Capture + Compression Pipeline" |
| **JOURNAL-03** | `useStorage.addJournalEntry(plantId, entry)`, `deleteJournalEntry(plantId, entryId)` actions | §Architecture Patterns "useStorage Action Surface" — mirror `addNote`/`deleteNote` at useStorage.tsx:460-474 verbatim; 3-site mutation (interface + useCallback + value object + deps array) |
| **JOURNAL-04** | MyPlantDetailModal new "Diario" section reverse-chronological timeline; quick-add via bottom sheet (2-tap max) | §Architecture Patterns "ModalSectionId Extension" (Phase 19-04 precedent); §Architecture Patterns "BottomSheetModal Portal" (PlantsScreen.tsx:448-470 verbatim); §Code Examples "Timeline FlatList + Date Grouping" |
| **JOURNAL-05** | Journal entries NEVER premium-gated at read level (Blossom cautionary tale) | §Don't Hand-Roll "Premium gating discipline" — read paths NEVER call `usePremiumGate()`; no `canRead*` check at the `journals[plantId]` access site |
</phase_requirements>

## Summary

Phase 21 implements per-plant journal entries with three substantive deliverables: (1) **data layer** — `JournalEntry` type + `AppData.journals` map extension + 2 new `useStorage` actions following the existing `addNote`/`addReminder` pattern verbatim; (2) **storage layer** — `expo-file-system` photo persistence using the **modern `Paths`/`File`/`Directory` API already used by `photoService.ts`** (NOT the legacy `FileSystem.documentDirectory` string API) with per-plant subdirectory and atomic cleanup in `deletePlant`; (3) **UI layer** — Diario as 6th section in `MyPlantDetailModal` with collapsed-by-default header, empty-state CTA, FlatList timeline with date grouping, and a bottom-sheet quick-add (60% snap) reusing the Phase 13 `BottomSheetModal` + `BottomSheetBackdrop` pattern from `PlantsScreen.tsx:448-470`.

The phase is constrained by THREE locked precedents from prior phases: (a) **`ModalSectionId` extension follows Phase 19-04 mechanism exactly** (union literal + `sectionLayouts` ref key + onSectionLayout call site + consumer state-type widening in `PlantsScreen.tsx:74` + `TodayScreen.tsx:134`); (b) **collapse animation reuses Phase 14 `EducationalSection` primitives verbatim** (Reanimated v4 + 180ms tuned in 14-03, mirrored by Phase 20 `FertilizeCard`); (c) **i18n keys go to `common.json` `journal.*` namespace**, NOT `plants.json` — so `check-i18n-keys.mjs` needs NO extension (script only validates catalog-content layer). The atomic-write invariant ("every photoUri in storage points to a real file") is enforced by writing the file FIRST, then mutating `AppData` with the resolved URI.

**Primary recommendation:** Land Wave 0 with the existing `photoService.ts` `Paths`/`File`/`Directory` API as the template (NOT `FileSystem.documentDirectory + 'journal/'`). Mirror `useStorage` add/delete action signatures from `addNote`/`addReminder` at lines 53-69 + 791-806. Extend `ModalSectionId` union, sectionLayouts map, AND the two consumer state-type strings (PlantsScreen + TodayScreen) in a single atomic commit. Smoke runner forks `smoke-phase20.cjs` verbatim; STRICT cross-phase regression sentinels MUST cover Phase 18 (PlantCard 5-element), Phase 19 (TOX-03/04/06), Phase 20 (FERT-03 5-site, FERT-06 two-column, FERT-07 i18n parity gate).

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-file-system` | `~19.0.21` | Photo persistence in `documentDirectory` per JOURNAL-02 | Already in deps + used by `photoService.ts` (modern `Paths`/`File`/`Directory` API) + `problemTrackingService.ts` |
| `expo-image-picker` | `~17.0.10` | Camera + gallery capture | Already in deps + used by `usePlantDiagnosis.ts`, `usePlantIdentification.ts`, `PlantDiagnosisModal.tsx`, `photoService.ts` |
| `expo-image-manipulator` | `~14.0.8` | JPEG compression 0.7 + 1080px resize | Already in deps + used by `photoService.ts:35-42` (1200px @ 0.8 — Phase 21 tightens to 1080px @ 0.7 per CONTEXT) |
| `@gorhom/bottom-sheet` | `^5.2.13` | Quick-add bottom sheet (60% snap) | Already in deps (Phase 13 INFRA-01); pattern at `PlantsScreen.tsx:448-470` |
| `react-native-reanimated` | `~4.1.1` | Diario section collapse animation (mirror EducationalSection 180ms) | Already in deps; pattern at `EducationalSection.tsx:14-115` |
| `react-i18next` | `^16.5.4` | i18n for `journal.*` namespace in `common.json` | Already in deps; pattern at every existing component |

**No `npx expo install` needed in Wave 0** — all 6 packages are pre-installed and version-pinned for Expo SDK 54.

### Supporting (already wired)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-crypto` | `~15.0.8` | `randomUUID()` for `entryId` generation | If using UUID over `Date.now().toString()` — see §Open Questions Q6 |
| `expo-haptics` | `~15.0.8` | Optional haptic on "Guardar" tap | Discretionary; matches Phase 20 FERT-05 pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Paths.document.uri` + `File`/`Directory` (modern API) | `FileSystem.documentDirectory` + `FileSystem.deleteAsync` (legacy string API) | Modern API used by `photoService.ts` and `problemTrackingService.ts`; legacy used by `usePlantDiagnosis.ts:104`. CONTEXT.md references the legacy API string `FileSystem.deleteAsync(documentDirectory + 'journal/' + plantId, { idempotent: true })` — both work in `~19.0.21` BUT **modern API is the in-repo precedent** for photo storage; legacy is just for one-off reads. **Recommendation: use modern `Directory(...).delete()` to match `photoService.ts:96-101` `deleteAllPhotos` pattern verbatim.** |
| `crypto.randomUUID()` (expo-crypto) | `Date.now().toString()` (existing pattern) | App-wide ID convention is `Date.now().toString()` (CalendarScreen.tsx:119,138, ExploreScreen.tsx:61, PlantsScreen.tsx:96, photoService.ts:75) — collision-resistant enough for single-user offline app. **Recommendation: match existing pattern with `Date.now().toString()` to stay consistent. UUID would be defensible for entries but introduces a new convention.** See §Open Questions Q6 below. |
| FlatList | ScrollView with `entries.map(...)` | FlatList virtualizes — important if user has 50+ entries; ScrollView simpler but renders all rows. CONTEXT explicitly says FlatList; matches DiagnosisHistory pattern (`MyPlantDetailModal.tsx:485`). |
| Native `Alert.alert` for delete confirm | Custom modal | CONTEXT explicitly: "Long-press → BottomSheetModal with single option 'Eliminar entrada'. Tap → confirm via native `Alert.alert`". Matches `MyPlantDetailModal.handleDelete` at L200-216 — verbatim pattern. |

**Installation:** None — all 6 packages are pre-installed.

## Architecture Patterns

### Recommended File Structure

```
src/
├── types/
│   └── index.ts                                   # ADD: JournalEntry type + CareTag union + AppData.journals
├── hooks/
│   └── useStorage.tsx                             # ADD: journals state + addJournalEntry + deleteJournalEntry + deletePlant orphan cleanup
├── services/
│   └── journalService.ts                          # NEW: photo capture + compression + write/delete + dir mgmt (mirrors photoService.ts)
├── components/
│   ├── MyPlantDetailModal.tsx                     # MODIFY: ModalSectionId extension + 6th section + state for sheet visibility
│   └── plant-detail/
│       ├── JournalSection.tsx                     # NEW: collapsible header + FlatList timeline + "+ Nueva entrada" CTA
│       ├── JournalQuickAddSheet.tsx               # NEW: BottomSheetModal content (text input + photo capture + chips + footer)
│       └── JournalEntryRow.tsx                    # NEW: single row (date header + chip + thumbnail + body); long-press → delete sheet
├── i18n/locales/
│   ├── en/common.json                             # ADD: journal.* namespace (header, emptyState, savedToast, photoCamera, photoGallery, careTag.{6 keys}, deleteConfirm, etc.)
│   └── es/common.json                             # ADD: same keyset (voseo for ES — "Agregá", "Guardá")
└── screens/
    ├── PlantsScreen.tsx                           # MODIFY: ModalSectionId state-type widening only (line 74) — initialSection consumer
    └── TodayScreen.tsx                            # MODIFY: ModalSectionId state-type widening only (line 134) — initialSection consumer

scripts/
└── smoke-phase21.cjs                              # NEW: fork verbatim from smoke-phase20.cjs; replace FERT-* with JOURNAL-*; preserve cross-phase STRICT regression
```

### Pattern 1: AppData Extension (JOURNAL-01)

**What:** Additive optional field on `AppData`. Mirrors `Plant.fertilizeSchedule?` precedent from Phase 20.

**Insertion site:** `src/types/index.ts` between line 153 (`climateOverride?: ClimateOverride;`) and 154 (`}`):

```typescript
// Source: src/types/index.ts:138-154 (AppData interface), 100-104 (Note as precedent for shape)

/** v1.2 Phase 21 (JOURNAL-02) — care-tag taxonomy. 6 predefined values, single-select. */
export type CareTag = 'riego' | 'fertilizar' | 'sol' | 'poda' | 'problema' | 'otro';

/** v1.2 Phase 21 (JOURNAL-02) — single per-plant journal entry.
 *  All fields except `id` and `date` are optional → empty entry with just the date is valid.
 *  `photoUri` points to a file in `${Paths.document.uri}journal/${plantId}/${id}.jpg` — NEVER base64.
 *  `date` is ISO string ("YYYY-MM-DD" — matches Plant.lastWatered format). */
export interface JournalEntry {
  id: string;
  date: string;
  text?: string;
  photoUri?: string;
  careTag?: CareTag;
}

export interface AppData {
  plants: Plant[];
  notes: Record<string, Note[]>;
  reminders: Record<string, Reminder[]>;
  // ... existing fields ...
  climateOverride?: ClimateOverride;
  /** v1.2 Phase 21 (JOURNAL-01). Additive optional; absence/empty = no entries. Keyed by plant.id. */
  journals?: Record<string, JournalEntry[]>;
}
```

**Migration handling:** No schema bump needed (additive optional precedent: `climateOverride` in v1.1 Phase 7, `fertilizeSchedule` in v1.2 Phase 20). The existing migration runner doesn't need touch. Load-path default `{}` happens at `useStorage.tsx` line 290 area (alongside `co: ClimateOverride = data.climateOverride ?? 'auto'`).

### Pattern 2: useStorage State + Actions (JOURNAL-03)

**What:** Mirror `addNote`/`deleteNote` verbatim (`useStorage.tsx:460-474`). Three-site mutation: interface entry + useCallback body + provider value + dependency array.

**Insertion site:** `src/hooks/useStorage.tsx`:

```typescript
// Source: src/hooks/useStorage.tsx:53-69 (interface) + 460-474 (impl) + 791-806 (value) + 833-836 (deps)

// ─── 1) interface entry — after addReminder/deleteReminder block, line ~63 ───
interface StorageActions {
  // ... existing ...
  addReminder: (dateStr: string, reminder: Reminder) => void;
  deleteReminder: (dateStr: string, reminderId: string) => void;
  updateReminder: (dateStr: string, reminderId: string, updates: Partial<Reminder>) => void;
  // ─── v1.2 Phase 21 (JOURNAL-03) ───
  /** Adds a journal entry for plantId. Caller pre-generated `entry.id` via Date.now().toString().
   *  Photo file (if any) MUST already be written to documentDirectory BEFORE this call —
   *  invariant: every `photoUri` in storage points to a real file (atomic write order). */
  addJournalEntry: (plantId: string, entry: JournalEntry) => void;
  /** Removes a journal entry. Caller is responsible for the per-entry photo file deletion via
   *  journalService.deleteJournalPhoto(plantId, entryId) BEFORE invoking this action. */
  deleteJournalEntry: (plantId: string, entryId: string) => void;
  // ... rest unchanged ...
}

// ─── 2) state field (parallels notes/reminders) ───
const [journals, setJournals] = useState<Record<string, JournalEntry[]>>({});

// dataRef.current default — add `journals: {}` to initializer at L143-158

// ─── 3) useCallback impls (mirror addNote/deleteNote at L460-474 verbatim) ───
const addJournalEntry = useCallback((plantId: string, entry: JournalEntry) => {
  const cur = dataRef.current.journals;
  const newJournals = { ...cur, [plantId]: [...(cur[plantId] || []), entry] };
  setJournals(newJournals);
  dataRef.current.journals = newJournals;
  scheduleSave();
}, [scheduleSave]);

const deleteJournalEntry = useCallback((plantId: string, entryId: string) => {
  const cur = dataRef.current.journals;
  const newJournals = { ...cur, [plantId]: (cur[plantId] || []).filter(e => e.id !== entryId) };
  setJournals(newJournals);
  dataRef.current.journals = newJournals;
  scheduleSave();
}, [scheduleSave]);

// ─── 4) load-path hydration — extend the L277-329 hydration block ───
const j = data.journals || {};
setJournals(j);
dataRef.current.journals = j;

// ─── 5) provider value object — line ~791-806 ───
// add: journals, addJournalEntry, deleteJournalEntry

// ─── 6) dependency array — line ~833-836 ───
// add: journals, addJournalEntry, deleteJournalEntry

// ─── 7) snapshotFromRef helper — line 101-119 — add journals to AppData snapshot ───
// d.journals,
```

**Critical:** `dataRef.current` initialization at line 143-158 ALSO needs `journals: {}` added — otherwise `snapshotFromRef` returns `undefined` and `JSON.stringify` produces an `AppData` without the `journals` key, causing the first save to omit it.

### Pattern 3: deletePlant Orphan Cleanup (CONTEXT Area 3)

**What:** Recursive delete of per-plant journal photo directory + journals state map cleanup BEFORE state mutation.

**Insertion site:** `src/hooks/useStorage.tsx:379-391` (existing `deletePlant`):

```typescript
// Source: src/hooks/useStorage.tsx:379-391 (existing deletePlant) + photoService.ts:96-101 (deleteAllPhotos pattern)
// + photoService.ts:8-9 (Paths.document.uri usage)
import { deleteJournalDirectory } from '../services/journalService'; // new service module

const deletePlant = useCallback((id: string) => {
  // ─── ORPHAN CLEANUP — BEFORE state mutation per CONTEXT decision ───
  // Fire-and-forget: photo dir delete is async but state mutation is sync.
  // Idempotent: missing dir is a no-op (Directory.delete on non-existent throws → caught + swallowed inside service).
  // If FS delete throws (permissions etc.), we LOG and continue — state mutation still happens,
  // photos are orphaned but the plant is gone (acceptable — orphans are inert files, not corruption).
  deleteJournalDirectory(id).catch(e => {
    if (__DEV__) console.warn('[deletePlant] journal photo cleanup failed (orphans possible):', e);
  });

  const newPlants = dataRef.current.plants.filter(p => p.id !== id);
  setPlants(newPlants);
  dataRef.current.plants = newPlants;

  // Clean up orphaned diagnosis history for the deleted plant (existing)
  const newHistory = { ...dataRef.current.diagnosisHistory };
  delete newHistory[id];
  setDiagnosisHistory(newHistory);
  dataRef.current.diagnosisHistory = newHistory;

  // ─── NEW: orphan cleanup of journals[id] state map entry ───
  const newJournals = { ...dataRef.current.journals };
  delete newJournals[id];
  setJournals(newJournals);
  dataRef.current.journals = newJournals;

  scheduleSave();
}, [scheduleSave]);
```

**Fail-fast policy:** FS delete throws → log + continue. **Do NOT block the state mutation.** Rationale: the photo dir delete failing leaves orphaned files but the plant is gone from state — orphans are inert. Refusing to delete the plant because the FS cleanup failed would create a worse UX (user can't delete plant) for a marginal correctness gain (orphaned JPGs).

**Note on existing leak:** The current `deletePlant` does NOT call `deleteAllPhotos(id)` for `PlantPhoto[]`. That's a pre-existing leak unrelated to Phase 21 — flag for future cleanup but **do NOT fix in Phase 21** (out of scope; would expand the diff and confuse the JOURNAL-* sentinels).

### Pattern 4: journalService Photo Pipeline (JOURNAL-02)

**What:** Mirror `photoService.ts:1-101` verbatim, swap `plant-photos` → `journal`, tighten compression to 1080px @ 0.7.

```typescript
// Source: src/services/photoService.ts:1-101 (modern Paths/File/Directory API)
// Phase 21 differences from photoService:
//  1. Top-level dir: 'journal' (not 'plant-photos')
//  2. Resize: 1080px (not 1200px) — CONTEXT lock
//  3. Compress: 0.7 (not 0.8) — CONTEXT lock
//  4. Returns string URI (not PlantPhoto object) — JournalEntry stores photoUri directly
//  5. Add deleteJournalDirectory(plantId) for deletePlant orphan cleanup

import { Paths, File, Directory } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const JOURNAL_DIR_NAME = 'journal';

function getPlantDir(plantId: string): string {
  return `${Paths.document.uri}${JOURNAL_DIR_NAME}/${plantId}/`;
}

async function ensureDir(dirUri: string): Promise<void> {
  const parentUri = `${Paths.document.uri}${JOURNAL_DIR_NAME}/`;
  const parentDir = new Directory(parentUri);
  try { if (!parentDir.exists) parentDir.create(); } catch {}
  const dir = new Directory(dirUri);
  try { if (!dir.exists) dir.create(); } catch {}
}

async function resizeImage(uri: string): Promise<string> {
  // CONTEXT lock: 1080px max width + JPEG quality 0.7 (vs photoService 1200px @ 0.8)
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function pickJournalPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1, // we resize ourselves via manipulateAsync — let picker grab full quality
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  } else {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }
}

export async function saveJournalPhoto(plantId: string, entryId: string, imageUri: string): Promise<string> {
  const dir = getPlantDir(plantId);
  await ensureDir(dir);
  const resizedUri = await resizeImage(imageUri);
  const destUri = `${dir}${entryId}.jpg`;
  const source = new File(resizedUri);
  source.copy(new File(destUri));
  return destUri;
}

export async function deleteJournalPhoto(plantId: string, entryId: string): Promise<void> {
  const filePath = `${getPlantDir(plantId)}${entryId}.jpg`;
  const file = new File(filePath);
  if (file.exists) file.delete();
}

export async function deleteJournalDirectory(plantId: string): Promise<void> {
  const dir = new Directory(getPlantDir(plantId));
  if (dir.exists) dir.delete(); // recursive by default for Directory
}
```

### Pattern 5: ModalSectionId Extension (JOURNAL-04, Phase 19-04 precedent)

**What:** Extend the union literal + add the new section in `sectionLayouts` map + onSectionLayout call site + widen consumer state types.

**Insertion sites:**

```typescript
// Source: src/components/MyPlantDetailModal.tsx:38 (union); src/screens/PlantsScreen.tsx:74 + TodayScreen.tsx:134 (consumers)

// 1) MyPlantDetailModal.tsx line 38 — extend union:
export type ModalSectionId = 'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas' | 'diario';

// 2) MyPlantDetailModal.tsx — add the 6th section AFTER the Mascotas section at L474-479:
{/* Phase 21 (JOURNAL-04): 6th educational section. Empty-state CTA always visible. */}
<View onLayout={onSectionLayout('diario')}>
  <JournalSection
    plantId={plant.id}
    entries={journals[plant.id] || []}
    onAddEntry={() => setQuickAddSheetVisible(true)}
    onDeleteEntry={(entryId) => /* ... */}
  />
</View>

// 3) PlantsScreen.tsx line 74 — widen state type:
const [detailInitialSection, setDetailInitialSection] = useState<
  'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas' | 'diario' | undefined
>(undefined);

// 4) TodayScreen.tsx line 134 — same widening as PlantsScreen
```

**Pitfall:** ModalSectionId is currently inlined as a string-union literal in `PlantsScreen.tsx:74` and `TodayScreen.tsx:134` (NOT imported from the type). The widening is mechanical but tsc-fails if you forget either consumer — Phase 19-04 SUMMARY documents this exact gotcha (the `@ts-expect-error` placeholders that needed removal). **Recommendation: in this phase, import `ModalSectionId` from MyPlantDetailModal in BOTH consumers and replace the inline union — clean up the legacy inline literal as part of the JOURNAL-04 plan.**

### Pattern 6: BottomSheetModal Portal Placement (CONTEXT Area 2)

**What:** Where does `JournalQuickAddSheet` render? Two candidates:

| Option | Placement | Pros | Cons |
|--------|-----------|------|------|
| **A: Inside MyPlantDetailModal** | Render `<BottomSheetModal ref={quickAddSheetRef}>` as a sibling to `<ScrollView>` inside the Modal | Closes when modal closes; no portal escape | Z-order: gorhom sheet inside a RN `<Modal>` — Pitfall 10 from Phase 18 (use `useDismissOnPaywall` ref hook) |
| **B: Provider/screen level** | Render in `PlantsScreen.tsx` + `TodayScreen.tsx` (sibling to `<MyPlantDetailModal>`) | Cleaner z-order — gorhom is App-root-wrapped at Phase 13; sheet renders ABOVE the RN Modal | Cross-component event wiring; need callbacks to MyPlantDetailModal |

**Recommendation: Option A — inside MyPlantDetailModal**, mirroring `PlantsScreen.tsx:448-470` long-press menu pattern. Phase 13 INFRA-04 already verified gorhom + RN `<Modal>` Z-order coexistence in dev client. The `useDismissOnPaywall` hook is the Phase 18 Pitfall 10 workaround — apply the same pattern: `const quickAddSheetRef = useRef<BottomSheetModal>(null); useDismissOnPaywall(quickAddSheetRef);`. Toast feedback follows the same render-at-screen-level pattern (sibling of MyPlantDetailModal) — see Q12 below.

**Snap points:** `snapPoints={['60%']}` single snap (CONTEXT lock; 30% is too small for multiline text + photo + chip row + footer).

### Pattern 7: Timeline FlatList + Date Grouping (CONTEXT discretion)

**What:** Reverse-chronological sort + per-row date label (relative for ≤7d, absolute for >7d).

```typescript
// Source: CONTEXT.md Area 1 + Area 2 (Claude's discretion); pattern from MyPlantDetailModal.tsx:485 DiagnosisHistory rendering
import { format } from 'date-fns'; // CHECK availability — see Open Questions Q14 below
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns'; // same check

function getRelativeDateLabel(dateISO: string, t: TFunction): string {
  const entryDate = new Date(dateISO);
  const today = new Date();
  const diff = differenceInDays(today, entryDate);
  if (diff === 0) return t('journal.dateLabel.today');     // "Hoy"
  if (diff === 1) return t('journal.dateLabel.yesterday'); // "Ayer"
  if (diff <= 7) return t('journal.dateLabel.daysAgo', { count: diff }); // "Hace 3 días"
  return entryDate.toLocaleDateString(); // absolute fallback
}

// Sort REVERSE chronological:
const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

<FlatList
  data={sorted}
  keyExtractor={(entry) => entry.id}
  renderItem={({ item }) => <JournalEntryRow entry={item} plantId={plantId} onDelete={onDeleteEntry} />}
  ListEmptyComponent={
    <View style={styles.emptyState}>
      <Text style={styles.emptyCopy}>{t('journal.emptyState')}</Text>
      <Button title={t('journal.addEntry')} onPress={onAddEntry} />
    </View>
  }
/>
```

**Caveat:** `date-fns` may not be in deps — verify via `package.json` grep. If not, fall back to plain JS `Math.floor((today - entryDate) / 86_400_000)` for day diff and ISO string comparison for sort. Sort via `localeCompare` works because ISO strings sort lexicographically = chronologically.

### Pattern 8: Atomic Write Order (CONTEXT Established Patterns + JOURNAL-02)

**What:** Photo file written FIRST, then `addJournalEntry` mutates state with the resolved photoUri. If photo write fails, entry is NOT added.

```typescript
// Source: CONTEXT.md "Established Patterns" — Atomic photo + entry write order
async function handleSaveEntry({ text, photoUri: rawUri, careTag }: QuickAddFormState) {
  const entryId = Date.now().toString(); // see Open Questions Q6
  let savedPhotoUri: string | undefined;
  if (rawUri) {
    try {
      savedPhotoUri = await saveJournalPhoto(plantId, entryId, rawUri);
    } catch (e) {
      // Photo write failed — DO NOT mutate state. Surface error to user via Alert.
      Alert.alert(t('journal.error.photoSaveFailed'));
      return;
    }
  }
  const entry: JournalEntry = {
    id: entryId,
    date: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
    text: text?.trim() || undefined,
    photoUri: savedPhotoUri,
    careTag,
  };
  addJournalEntry(plantId, entry);
  // Trigger toast at screen level via prop / context — see Open Questions Q12
  onSaveSuccess();
}
```

### Anti-Patterns to Avoid

- **base64 photos in AsyncStorage** — Pitfall research lock from JOURNAL-02; AsyncStorage 6MB iOS / 10MB Android total cap; 10 photos × 1MB base64 = full quota. Use `documentDirectory` URIs.
- **Hand-rolled UUID library** — `Date.now().toString()` is the in-repo convention. Don't add `uuid` or `nanoid` packages.
- **`FileSystem.deleteAsync` (legacy) when `Directory.delete` (modern) is available** — `photoService.ts:96-101` is the local precedent; match it.
- **Hardcoding strings** — every user-facing string MUST use `t('journal.*')` key from `common.json` (CLAUDE.md hard rule).
- **Reading entries through `usePremiumGate()`** — JOURNAL-05 lock; never gate journal reads.
- **Extending `PROTECTED_USER_FIELDS`** — journals live OUTSIDE the `Plant` object, in `AppData.journals` keyed by `plantId`. The CRIT-1 deep-merge guard doesn't apply.
- **`react-native-modal` or another modal library** — gorhom BottomSheetModal is the locked pattern (Phase 13 INFRA-02).
- **`autoExpand` based on journal recency** — CONTEXT deferred this. Collapsed by default. Period.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo capture UX | Custom camera surface, manual permission flow | `expo-image-picker.launchCameraAsync` + `launchImageLibraryAsync` | Already in deps + used by 4 in-repo modules; handles permissions, cancellation, iOS/Android quirks |
| Image compression | Hand-roll Canvas resize via WebView | `expo-image-manipulator.manipulateAsync` | Already in deps + used by `photoService.ts`; native pipeline |
| Directory creation | Manual `mkdir`-style logic | `Directory(uri).create()` (with try/catch race-condition guard from `photoService.ts:14-32`) | In-repo pattern |
| Recursive directory delete | Hand-roll file-by-file iteration | `Directory(uri).delete()` (recursive by default) + `idempotent: true` semantics | In-repo pattern at `photoService.ts:96-101` |
| ID generation | UUID library | `Date.now().toString()` | App-wide convention; single-user offline app — no collision risk |
| Bottom sheet | Custom modal sliding from bottom | `@gorhom/bottom-sheet` `BottomSheetModal` + `BottomSheetBackdrop` | Phase 13 INFRA-01 locked; pattern at `PlantsScreen.tsx:448-470` |
| Collapse animation | New Reanimated worklet | Phase 14 `EducationalSection` (180ms `Easing.out(Easing.cubic)`) — mirror verbatim | Phase 20 FertilizeCard already mirrored this; Phase 21 is the 3rd mirror |
| Toast feedback | Custom slide-in | Phase 18 `<Toast>` from `src/components/Toast.tsx` | Already wired; cross-screen rendering pattern at `PlantsScreen.tsx:473-480` |
| Delete confirmation | Custom modal | `Alert.alert(title, msg, [cancel, destructive])` | App-wide; pattern at `MyPlantDetailModal.tsx:200-216` |
| FlatList virtualization | Hand-rolled list windowing | RN FlatList with `keyExtractor` | Standard pattern; matches DiagnosisHistory consumption |
| Premium gate at read level | `usePremiumGate().canRead*` | **NOT applicable** — JOURNAL-05 lock | Blossom cautionary tale — never gate user data |
| Date grouping ("Hoy"/"Ayer") | Hand-rolled day diff | Plain JS `Math.floor((today - date) / 86_400_000)` or `date-fns/differenceInDays` if present | Trivial — no new dep needed |

**Key insight:** All hand-roll-able layers (photo pipeline, sheet UX, animations, toast) have IN-REPO precedents from prior phases. Phase 21 is largely composition + new types + new actions + new components. ZERO new dependencies.

## Common Pitfalls

### Pitfall 1: `documentDirectory` API confusion (legacy string vs modern Paths)

**What goes wrong:** Developer mixes `FileSystem.documentDirectory + 'journal/'` (legacy string concat) with `new Directory(...)` (modern class) inside the same module, or imports from `'expo-file-system'` differently than the in-repo precedent.

**Why it happens:** `expo-file-system@~19.0.21` exports BOTH APIs side-by-side. Migration was non-uniform — `usePlantDiagnosis.ts:3` still uses `import * as FileSystem from 'expo-file-system'` (legacy), while `photoService.ts:1` uses `import { Paths, File, Directory } from 'expo-file-system'` (modern). CONTEXT.md uses legacy string syntax in its description, which is misleading.

**How to avoid:** Use the modern API for Phase 21. Import `{ Paths, File, Directory }`. Build paths via `${Paths.document.uri}journal/${plantId}/${entryId}.jpg`. Delete via `new Directory(uri).delete()` / `new File(uri).delete()` — both recursive-by-default for Directory; both no-op-on-missing if guarded by `dir.exists` / `file.exists`. Match `photoService.ts:8-101` literally.

**Warning signs:** Type errors in tsc about `FileSystem.deleteAsync` argument shape, runtime crashes on iOS about "URI not in app sandbox", or smoke runner regex misses on `Paths.document.uri`.

### Pitfall 2: ModalSectionId extension miss in consumers (TS-fail trap)

**What goes wrong:** Developer extends the union in `MyPlantDetailModal.tsx:38` but forgets the inline state-type widening in `PlantsScreen.tsx:74` AND `TodayScreen.tsx:134`. `tsc --noEmit` fails: "Argument of type '\"diario\"' is not assignable to parameter of type 'Pre-Phase-21 union'".

**Why it happens:** The two consumers don't import `ModalSectionId` — they inline the union literal verbatim. Phase 19-04 SUMMARY documents this trap: the `@ts-expect-error` placeholders had to be cleaned up after the prop landed.

**How to avoid:** Extend the union in MyPlantDetailModal **first**, then immediately import `ModalSectionId` in both consumers and replace the inline literal — single atomic commit. **Better:** export `ModalSectionId` (already exported at L38), and refactor both consumers to `useState<ModalSectionId | undefined>(undefined)` in this phase as part of JOURNAL-04 plan.

**Warning signs:** tsc errors after the modal change but BEFORE the screen updates.

### Pitfall 3: BottomSheetModal Z-order inside RN Modal (Phase 18 Pitfall 10)

**What goes wrong:** `<BottomSheetModal>` rendered inside a top-level `<Modal>` (`MyPlantDetailModal`) is invisible or appears behind the RN Modal on iOS.

**Why it happens:** RN `<Modal>` renders in a separate native window; gorhom sheet renders in the JS root view. The two windows don't compose by default.

**How to avoid:** Confirmed working pattern from `PlantsScreen.tsx:448-470` (the long-press menu sheet is OUTSIDE the RN Modal — sibling at the screen level). For Phase 21 Quick-Add sheet, the in-modal pattern works ONLY because gorhom is App-root-wrapped (Phase 13 INFRA-02) — the sheet portals up to the gorhom provider. **Apply `useDismissOnPaywall(quickAddSheetRef)` from Phase 13 INFRA-03 to handle paywall Z-order edge cases.** Device-test on iOS + Android in Wave 5 manual checkpoint.

**Warning signs:** Sheet visible on Android but invisible on iOS (or vice versa); sheet appears behind the dark overlay of the parent RN Modal.

### Pitfall 4: Empty entry insertion (silent data growth)

**What goes wrong:** User opens Diario, taps "+ Nueva entrada", immediately taps "Guardar" (empty text + no photo + no tag). System inserts an entry with just `{id, date}`. User may not realize they created a record.

**Why it happens:** CONTEXT explicitly allows empty entries to enable 2-tap floor. But UX-wise, it can feel unintentional.

**How to avoid:** This is BY DESIGN per CONTEXT specifics line 101: "the intent is 'I noticed something but haven't decided what — log the moment, fill in later' → user can long-press to delete + re-add if they decide nothing was worth logging." Toast confirmation "Entrada guardada 📔" makes the action visible. Empty entries still render their date header + (empty) body → not invisible. **Do NOT add a "you didn't write anything" guard.**

**Warning signs:** User reports "phantom entries" in TestFlight feedback → reframe in copy ("Log the moment, fill in later").

### Pitfall 5: Atomic write race — photo write succeeds but state mutation throws

**What goes wrong:** `saveJournalPhoto` writes the file successfully, then `addJournalEntry` throws (impossible in practice — pure state mutation — but defensive). Orphan file in journal/ with no matching entry in `journals[plantId]`.

**Why it happens:** `addJournalEntry` is a useCallback that does `{...cur, [plantId]: [...prev, entry]}` + setState + scheduleSave. The only failure mode is OOM (catastrophic) or React lifecycle bugs (rare in production).

**How to avoid:** Accept the orphan risk as negligible. State mutation doesn't throw in practice. **Do NOT add a try/catch around `addJournalEntry` that calls `deleteJournalPhoto` on rollback — adds complexity for a near-zero failure mode.** The startup orphan-scan is explicitly out of scope per CONTEXT — orphan JPGs without matching entries are inert.

**Warning signs:** None practical. If discovered in beta, address in v2.0.

### Pitfall 6: i18n key in `plants.json` (wrong file)

**What goes wrong:** Developer adds `journal.*` keys to `plants.json` thinking "plants → journals are about plants". `check-i18n-keys.mjs` doesn't validate the new keys (it only validates `plants.json` per-catalog-entry keyset). Worse: a tsc-green build ships with hardcoded English strings on a Spanish device.

**Why it happens:** `plants.json` and `common.json` look similar; new contributors don't know the boundary.

**How to avoid:** **All Diario keys go to `common.json` under `journal.*` namespace** — exactly mirrors Phase 19 `toxicity.*` and Phase 20 `tasks.fertilize` / `notifications.fertilize` patterns. `plants.json` is for per-catalog-entry content only. **Document this in smoke-phase21.cjs i18n-parity assertions** to give the developer immediate feedback.

**Warning signs:** Hardcoded English text on Spanish device builds; `check-i18n-keys` passes but UI text is wrong.

### Pitfall 7: Long-press conflict with FlatList scroll

**What goes wrong:** User long-presses a `JournalEntryRow` to trigger the delete menu, but the long-press is consumed by FlatList's scroll gesture system → menu never opens, OR scroll jumps unexpectedly.

**Why it happens:** RN `<Pressable onLongPress>` inside FlatList competes with the scroll gesture handler. iOS is more forgiving; Android sometimes drops the event.

**How to avoid:** Use `GestureDetector` with `Gesture.LongPress()` from `react-native-gesture-handler` (already in deps via Phase 13 INFRA-01), composed via `Gesture.Race(longPress, tapForPhotoViewer)`. This is the same pattern Phase 18 uses in `PlantCard.tsx` for the long-press menu (`grep "Gesture.LongPress\|Gesture.Race" src/components/PlantCard.tsx`). Alternative: native `Pressable onLongPress={500}` works on iOS reliably but is flaky on Android — device-test in Wave 5.

**Warning signs:** Delete menu doesn't open on long-press during Android device test; scroll feels janky in the timeline.

### Pitfall 8: Photo size + AsyncStorage growth

**What goes wrong:** Even with photos OUT of AsyncStorage, the `journals: Record<plantId, JournalEntry[]>` map can grow unbounded. 1000 entries × 100 bytes (id + date + small text + careTag) ≈ 100KB per plant. Acceptable, but for 10 plants × 1000 entries = 1MB.

**Why it happens:** No pagination, no archival.

**How to avoid:** Out of scope per CONTEXT deferred ideas ("Pagination of the timeline — v1.2 ships all entries in one FlatList"). Document in code comment that v2.0 should add archival if power users hit the AsyncStorage limit.

**Warning signs:** Slow modal-open on plants with 1000+ entries (FlatList virtualizes but the initial sort over the full array is O(n log n)).

### Pitfall 9: Reanimated v4 collapse on Android (Phase 14 Pitfall 4 carry-forward)

**What goes wrong:** Reanimated v4 `useAnimatedStyle({ height: derivedHeight.value })` on Android starts at `height: 0` with `overflow: hidden` → `onLayout` never fires → `measuredHeight` stays 0 forever → section never expands.

**Why it happens:** Documented in `EducationalSection.tsx:42-48` comment block. Android-specific layout pass behavior.

**How to avoid:** Use the EXACT `hasInteracted` gate pattern from `EducationalSection.tsx:48,79-86,100`. While `!hasInteracted`, render the body with `style={styles.bodyAuto}` (height: 'auto') so RN measures naturally on Android. After first tap, switch to the animated style. **Mirror verbatim. Don't reinvent.**

**Warning signs:** Diario section appears not to expand on Android during device test.

### Pitfall 10: Toast cross-component rendering

**What goes wrong:** `JournalQuickAddSheet` calls `addJournalEntry`, but the `<Toast>` lives at PlantsScreen / TodayScreen level (sibling of `<MyPlantDetailModal>`). The sheet has no direct way to trigger toast visibility.

**Why it happens:** Toast is intentionally placed at the screen level (CONTEXT pattern from Phase 18) — it must overlay everything including modals.

**How to avoid:** Pass `onSaveSuccess: () => void` callback prop chain: `PlantsScreen` → `MyPlantDetailModal` → `JournalSection` → `JournalQuickAddSheet`. PlantsScreen sets `toastVisible=true` + `toastMessage=t('journal.savedToast')` in the callback. Alternative: Toast Context — overkill for one consumer in v1.2.

**Warning signs:** Toast doesn't appear after save; toast appears INSIDE the RN Modal (Z-order wrong) instead of overlaying it.

## Code Examples

### Photo Capture + Compression Pipeline (verified pattern)

```typescript
// Source: src/services/photoService.ts:35-86 (verified working) + JOURNAL-02 1080px @ 0.7 lock from CONTEXT
import { Paths, File, Directory } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// 1) Capture
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1, // we resize ourselves
});
if (result.canceled || !result.assets[0]) return null;
const rawUri = result.assets[0].uri;

// 2) Resize + compress
const resized = await ImageManipulator.manipulateAsync(
  rawUri,
  [{ resize: { width: 1080 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);

// 3) Ensure directory + copy
const dir = `${Paths.document.uri}journal/${plantId}/`;
const dirObj = new Directory(dir);
if (!dirObj.exists) dirObj.create();
const destUri = `${dir}${entryId}.jpg`;
new File(resized.uri).copy(new File(destUri));

// destUri is what gets persisted in JournalEntry.photoUri
```

### useStorage Action Surface (verified pattern from addNote)

```typescript
// Source: src/hooks/useStorage.tsx:460-474 (addNote/deleteNote) — mirror verbatim with journal substitution
const addJournalEntry = useCallback((plantId: string, entry: JournalEntry) => {
  const cur = dataRef.current.journals;
  const newJournals = { ...cur, [plantId]: [...(cur[plantId] || []), entry] };
  setJournals(newJournals);
  dataRef.current.journals = newJournals;
  scheduleSave();
}, [scheduleSave]);

const deleteJournalEntry = useCallback((plantId: string, entryId: string) => {
  const cur = dataRef.current.journals;
  const newJournals = { ...cur, [plantId]: (cur[plantId] || []).filter(e => e.id !== entryId) };
  setJournals(newJournals);
  dataRef.current.journals = newJournals;
  scheduleSave();
}, [scheduleSave]);
```

### BottomSheetModal Quick-Add (verified pattern from PlantsScreen.tsx:448-470)

```typescript
// Source: src/screens/PlantsScreen.tsx:448-470 — long-press menu sheet pattern; Phase 21 swaps 30% → 60% snap
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useDismissOnPaywall } from '../../hooks/useDismissOnPaywall'; // Phase 13 INFRA-03

const quickAddSheetRef = useRef<BottomSheetModal>(null);
useDismissOnPaywall(quickAddSheetRef);

// In JSX (sibling of <ScrollView> inside MyPlantDetailModal Modal):
<BottomSheetModal
  ref={quickAddSheetRef}
  snapPoints={['60%']}
  enablePanDownToClose
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
  )}
>
  <BottomSheetView style={styles.sheetContent}>
    {/* multiline TextInput */}
    {/* Cámara + Galería buttons */}
    {/* photo preview + Quitar */}
    {/* careTag chip row */}
    {/* Guardar / Cancelar footer */}
  </BottomSheetView>
</BottomSheetModal>

// Open: quickAddSheetRef.current?.present()
// Close: quickAddSheetRef.current?.dismiss()
```

### Long-Press Delete Sheet (single option)

```typescript
// Source: PlantsScreen.tsx:448-470 long-press pattern; reuse with single menuItem
// Trigger: <Pressable onLongPress={openDeleteSheet}> wrapping each JournalEntryRow
<BottomSheetModal
  ref={deleteSheetRef}
  snapPoints={['25%']} // smaller — single option
  enablePanDownToClose
  backdropComponent={/* same backdrop */}
>
  <BottomSheetView style={styles.menuSheet}>
    <Text style={styles.menuTitle}>{t('journal.entryActions')}</Text>
    <TouchableOpacity onPress={handleDelete} style={[styles.menuItem, styles.menuItemDestructive]}>
      <Text style={[styles.menuItemText, styles.menuItemTextDestructive]}>
        {t('journal.deleteEntry')}
      </Text>
    </TouchableOpacity>
  </BottomSheetView>
</BottomSheetModal>

const handleDelete = () => {
  deleteSheetRef.current?.dismiss();
  Alert.alert(
    t('journal.deleteConfirmTitle'),
    t('journal.deleteConfirmMessage'),
    [
      { text: t('journal.cancel'), style: 'cancel' },
      {
        text: t('journal.delete'),
        style: 'destructive',
        onPress: async () => {
          // 1) Delete the photo file first (best-effort)
          if (entry.photoUri) {
            try { await deleteJournalPhoto(plantId, entry.id); } catch {}
          }
          // 2) Then mutate state
          deleteJournalEntry(plantId, entry.id);
        },
      },
    ]
  );
};
```

### Timeline Date Grouping (no new deps)

```typescript
// Source: CONTEXT.md Area 1 + Pattern 7 above — plain JS day diff (no date-fns dep needed)
function getRelativeDateLabel(dateISO: string, t: TFunction): string {
  const entryDate = new Date(dateISO + 'T00:00:00'); // Force local midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('journal.dateLabel.today');     // "Hoy"
  if (diffDays === 1) return t('journal.dateLabel.yesterday'); // "Ayer"
  if (diffDays >= 2 && diffDays <= 7) return t('journal.dateLabel.daysAgo', { count: diffDays });
  return entryDate.toLocaleDateString(); // "11/4/2026" or "4/11/2026"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `FileSystem.documentDirectory + 'path'` (legacy string API) | `Paths.document.uri + 'path'` + `new File(uri)`/`new Directory(uri)` (modern API) | expo-file-system `19.x` (current `~19.0.21`) | Both APIs work; modern is in-repo precedent (`photoService.ts`, `problemTrackingService.ts`). Phase 21 must use modern. |
| 250ms Reanimated v4 collapse `Easing.inOut(Easing.ease)` | 180ms `Easing.out(Easing.cubic)` | Phase 14-03 device tuning (2026-05-06): 250ms felt "sluggish" / "app broken" | Mirror EducationalSection.tsx:26 — `COLLAPSE_DURATION = 180`. Tuned, NOT CONTEXT.md's stale 250ms guardrail. |
| `ReanimatedSwipeable` for swipe-to-delete | `Gesture.Pan()` direct | Phase 18 CARD-01 — iOS crash bug in ReanimatedSwipeable | Not relevant to Phase 21 (no swipe-to-delete on journal entries — long-press only). |
| Inline string-union literals for ModalSectionId in consumers | Import + reuse `ModalSectionId` from MyPlantDetailModal | Phase 19-04 + Phase 21 cleanup opportunity | Current Phase 19-04 left inline literal in consumers — Phase 21 should consolidate. |

**Deprecated/outdated:**
- `FileSystem.documentDirectory` string concat in NEW code — prefer `Paths.document.uri`. Legacy `usePlantDiagnosis.ts:104` is left as-is (not Phase 21 territory).
- `react-native-modal` library — never wanted, never installed; gorhom BottomSheetModal is the locked replacement for any sheet-like UX.

## Open Questions

1. **`date-fns` availability for `differenceInDays` / `format`?**
   - What we know: `package.json` shows NO `date-fns` dep. App-wide pattern uses raw `Date` math via `formatDate(date)` from `src/utils/dates.ts`.
   - What's unclear: Whether the planner wants to introduce date-fns for cleaner date grouping or stay with raw JS.
   - **Recommendation:** Stay with raw JS — `Math.floor((today - entryDate) / 86_400_000)` + `Date.toLocaleDateString()`. No new dep. See §Code Examples "Timeline Date Grouping".

2. **`entryId` generation — `Date.now().toString()` vs `crypto.randomUUID()`?**
   - What we know: App-wide convention is `Date.now().toString()` (CalendarScreen.tsx:119,138, ExploreScreen.tsx:61, PlantsScreen.tsx:96, photoService.ts:75). `expo-crypto` IS installed and `randomUUID()` is already used by `analyticsService.ts:2,29,35` for device ID.
   - What's unclear: Whether single-user offline app has any collision risk with `Date.now().toString()` when user taps "Guardar" twice in quick succession (<1ms).
   - **Recommendation:** Use `Date.now().toString()` to match in-repo convention. If a concrete collision case is identified during device testing, upgrade to `${Date.now()}-${Math.random().toString(36).slice(2,7)}` (still no new dep) or `randomUUID()` from expo-crypto.

3. **Modal "+ Nueva entrada" button placement in Diario section header**
   - What we know: CONTEXT specifies header button always present.
   - What's unclear: Tap-area inside collapsed-section header (which itself is a Pressable for the collapse toggle) — overlapping touch targets.
   - **Recommendation:** Add the "+ Nueva entrada" button as a **trailing inline element in the EducationalSection's `titleRow`** (right of the chevron) using `hitSlop` to ensure precise hit testing. Alternative: button INSIDE the body content (only visible when expanded) + an inline empty-state CTA — but this loses the "discoverability beats hiding" intent. Planner discretion at PLAN-time; prototype both and pick whichever feels less crowded on device.

4. **Photo viewer (full-screen) shape**
   - What we know: CONTEXT puts viewer details at planner discretion. ~80×80 thumbnail tap opens full-screen.
   - What's unclear: Pinch-zoom (requires `react-native-image-zoom-viewer` or similar new dep) vs simple full-bleed render.
   - **Recommendation:** Simple full-bleed render — `<Modal transparent>` + `<Image style={{ width: '100%', height: '100%' }} resizeMode="contain">` + tap-anywhere-to-close. NO pinch-zoom in v1.2. Adding a zoom dep is overkill for journal photos at 1080px max width. Deferred to v2.0 if user feedback demands.

5. **JournalQuickAddSheet behavior when photo capture fails mid-flow**
   - What we know: §Pattern 8 Atomic Write Order — photo write fails → Alert + abort.
   - What's unclear: User UX when they've typed text + selected a careTag, then photo write fails. Lose the text?
   - **Recommendation:** Show Alert "No pudimos guardar la foto. ¿Querés guardar la entrada sin foto?" with 3 options: Cancelar (keep sheet open, keep typed text), Reintentar (re-call saveJournalPhoto), Guardar sin foto (proceed with photoUri=undefined). This is the user-respecting fail mode.

6. **Photo orientation / EXIF rotation**
   - What we know: `expo-image-manipulator` defaults to stripping EXIF unless `{ format, base64 }` is set with caveats.
   - What's unclear: Whether iOS portrait photos render rotated 90° when saved without EXIF (a known iOS gotcha).
   - **Recommendation:** Verify in Wave 5 manual device test. If rotation issue surfaces, add `{ rotate: 0 }` action before resize to normalize, OR pass through `Image.getSize()` to detect aspect and resize accordingly. Defer detailed handling to device-test feedback.

## Validation Architecture

**Nyquist validation: enabled per `.planning/config.json` (`workflow.nyquist_validation: true`).**

### Test Framework

| Property | Value |
|----------|-------|
| **Framework** | Custom Node CJS smoke runner (`scripts/smoke-phaseN.cjs`) — NO test runner installed (CLAUDE.md: "No test framework is set up"). Static-analysis-style file-content asserts via `readFileSync` + regex; optional `ts.transpileModule` for behavioral helpers via gitignored `scripts/.tmp-phase21/` stubs. |
| **Config file** | `package.json` `scripts` entry: `"smoke:phase21": "node scripts/smoke-phase21.cjs"` |
| **Quick run command** | `npm run smoke:phase21` |
| **Full suite command** | `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20 && npm run smoke:phase21` |
| **Estimated runtime** | ~3-5 sec quick · ~15 sec full (5 smoke runners + tsc + i18n-keys) |
| **Phase gate** | All commands exit-0 + Phase 18 / 19 / 20 sentinels remain PASS (cross-phase regression) + manual device-test checklist Blocks A-E |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **JOURNAL-01** | `AppData.journals?: Record<plantId, JournalEntry[]>` + migration default `{}` at useStorage load path | unit (file-content + tsc) | `node scripts/smoke-phase21.cjs` (regex: `journals\?:.*Record<string,\s*JournalEntry\[\]>` in types/index.ts; `data\.journals\s*\|\|\s*\{\}` in useStorage.tsx) + `npx tsc --noEmit` | ❌ Wave 0 |
| **JOURNAL-02** | `JournalEntry` type matches lock; `CareTag` union has 6 values; photo paths point to `Paths.document.uri + 'journal/'` (never base64) | unit (file-content + tsc) | smoke-phase21 (regex: `CareTag\s*=\s*['"]riego['"]\|['"]fertilizar['"]\|['"]sol['"]\|['"]poda['"]\|['"]problema['"]\|['"]otro['"]`; `Paths\.document\.uri.*journal` in journalService.ts; `photoUri\?: string` in types) + `npx tsc --noEmit` | ❌ Wave 0 |
| **JOURNAL-03** | `useStorage` exposes `addJournalEntry(plantId, entry)` + `deleteJournalEntry(plantId, entryId)`; both call `setJournals` + `scheduleSave`; interface + value object + dep array all updated | unit (file-content + tsc) | smoke-phase21 (regex: `addJournalEntry:\s*\(plantId:\s*string,\s*entry:\s*JournalEntry\)` in interface; useCallback impl; 3-site count `grep -c "addJournalEntry" src/hooks/useStorage.tsx` >= 4) + `npx tsc --noEmit` | ❌ Wave 0 |
| **JOURNAL-04** | MyPlantDetailModal has 6th `📔 Diario` section after `🐾 Mascotas`; `ModalSectionId` extended with `'diario'`; sectionLayouts['diario']; BottomSheetModal quick-add with snapPoints=['60%']; 2-tap floor verified via "+ Nueva entrada" button + "Guardar" footer | unit (file-content) | smoke-phase21 (regex: `'que-hacer'\|'donde'\|'por-que'\|'tus-ajustes'\|'mascotas'\|'diario'` in ModalSectionId; `emoji="📔"` or `t\('plantDetailModal\.diario'\)`; `JournalQuickAddSheet`; `snapPoints={\['60%'\]}`; `onSectionLayout\('diario'\)`) | ❌ Wave 0 |
| **JOURNAL-05** | Journal reads NEVER call `usePremiumGate` / `canRead*` / `isPremium` at the `journals[plantId]` access site | unit (file-content) | smoke-phase21 (negative-grep regex: `!/usePremiumGate.*journal\|isPremium.*journal\|canReadJournal/` in JournalSection.tsx / MyPlantDetailModal.tsx) — fail if found | ❌ Wave 0 |
| **deletePlant orphan cleanup** | `useStorage.deletePlant` calls `deleteJournalDirectory(id)` (or equivalent recursive FS delete) BEFORE state mutation; `journals[id]` map entry removed in same call | unit (file-content + tsc) | smoke-phase21 (regex: `deleteJournalDirectory` import + call in deletePlant useCallback; `delete newJournals\[id\]`) + tsc | ❌ Wave 0 |
| **i18n parity** | `common.json` has full `journal.*` namespace in EN + ES (header, emptyState, savedToast, photoCamera, photoGallery, careTag.{6 keys}, deleteConfirm, dateLabel.{today, yesterday, daysAgo}) | unit (JSON keyset parity) | smoke-phase21 (per-key `getNested(enJSON, 'journal.X') && getNested(esJSON, 'journal.X')` for every required key) | ❌ Wave 0 |
| **Cross-phase Phase 18 regression** | PlantHealthBadge in modal preserved; Toast.tsx exists; PlantCard mood emoji + Gesture.Pan preserved; 5-element budget intact | STRICT regression (never SKIP) | smoke-phase21 (regex same as smoke-phase20.cjs:140-150) | ✅ Phase 20 baseline |
| **Cross-phase Phase 19 regression** | PetToxicityBadge usage in PlantCard preserved; MascotasContent / `emoji="🐾"` preserved in modal; initialSection prop preserved; check-i18n-keys petToxicity.symptoms extension preserved | STRICT regression | smoke-phase21 (regex same as smoke-phase20.cjs:150-157) | ✅ Phase 20 baseline |
| **Cross-phase Phase 20 regression** | FertilizeCard preserved; careCardsRow + initialExpanded prop preserved; FERT-03 5-site discriminator chain intact; check-i18n-keys fertilizer.{industrial,homemade}Recommendation extension preserved | STRICT regression | smoke-phase21 (new — fork pattern from existing CROSS sentinels) | New (Wave 0) |
| **TypeScript** | All new types + action signatures compile | static | `npx tsc --noEmit` | ✅ existing |

**Manual-only validations (deferred to Wave 5 device-test checklist mirroring Blocks A-E from Phase 19-07 / 20-10):**

- **BottomSheetModal inside RN Modal Z-order** — Pitfall 3; smoke runner can't exercise window composition. iOS + Android device test required.
- **Reanimated v4 collapse height-0 Android bug** — Pitfall 9; only manifests at runtime on Android device. Test on physical Android (NOT just simulator).
- **Photo capture EXIF rotation iOS** — Pitfall 6/Q7; iOS portrait photo orientation can render rotated 90° if not handled. Device test only.
- **Long-press vs FlatList scroll conflict** — Pitfall 7; gesture composition behavior. iOS + Android device test.
- **Toast position above 60% sheet** — visual check that Toast doesn't render under the sheet's see-through area.
- **2-tap floor flow** — UX validation: open modal → tap "+ Nueva entrada" (1) → tap "Guardar" (2) → entry committed. Stopwatch + screenshot at each step.
- **Permissions flow first-run** — Camera + photo library permission prompts on first capture; rejection path tested.
- **Plant delete cascade** — Delete a plant with journal photos; verify directory is gone via `Files` app inspection (iOS) or `adb shell ls` (Android).

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npm run smoke:phase21` (~3-5 s)
- **Per wave merge:** Full suite — `npx tsc --noEmit && npm run check:i18n-keys && npm run smoke:phase18 && npm run smoke:phase19 && npm run smoke:phase20 && npm run smoke:phase21` (~15 s)
- **Phase gate:** Full suite green + manual device-test checklist Blocks A-E closed before `/gsd:verify-work` (or Option B deferral to v1.2 backlog memory per Phase 18-05 / 19-07 / 20-10 precedent).

### Wave 0 Gaps

- [ ] `scripts/smoke-phase21.cjs` — three-tier runner (PASS scaffold + SKIP→PASS placeholders for JOURNAL-01..05 + STRICT cross-phase regression sentinels for Phase 18 PlantCard 5-element, Phase 19 TOX-03/04/06, Phase 20 FERT-03 5-site + FERT-06 two-column + FERT-07 i18n parity)
- [ ] `package.json` — add `"smoke:phase21": "node scripts/smoke-phase21.cjs"`
- [ ] `.gitignore` — add `scripts/.tmp-phase21/` (mirrors Phase 14-00 / 19-00 / 20-00 pattern; needed if Plan 21-02 uses ts.transpileModule for behavioral asserts on date-grouping helper)
- [ ] `src/types/index.ts` — type skeletons: `CareTag` union + `JournalEntry` interface + `AppData.journals?:` field (Wave 0 PASS via grep for the literal patterns)
- [ ] `src/services/journalService.ts` — skeleton file with exported `pickJournalPhoto`, `saveJournalPhoto`, `deleteJournalPhoto`, `deleteJournalDirectory` signatures (real impl in later wave; Wave 0 just gates file existence)
- [ ] `src/components/plant-detail/JournalSection.tsx` — skeleton with default-export component returning empty View (Wave 0 PASS on file existence)
- [ ] `src/components/plant-detail/JournalQuickAddSheet.tsx` — skeleton (same)
- [ ] `src/components/plant-detail/JournalEntryRow.tsx` — skeleton (same)
- [ ] `src/i18n/locales/{en,es}/common.json` — `journal.*` namespace skeleton with at least the keys validated by smoke i18n-parity assertions (header, emptyState, savedToast, photoCamera, photoGallery, careTag.{riego,fertilizar,sol,poda,problema,otro}, deleteConfirm, dateLabel.today, dateLabel.yesterday, dateLabel.daysAgo, addEntry)

### 4 Validation Pillars (Nyquist gate enumeration)

The Nyquist gate looks for 3-5 pillars. Phase 21's 4:

1. **Data shape integrity** — `JournalEntry` type matches lock (id + date + optional text/photoUri/careTag); `AppData.journals` field is `Record<string, JournalEntry[]>` (optional, migration default `{}`); useStorage load path defaults to `{}` when absent. Smoke runner: regex on `types/index.ts` + `useStorage.tsx`; tsc-green.

2. **Action surface fidelity** — `useStorage.addJournalEntry(plantId, entry)` mirrors `addNote` impl (idempotent setState pattern); `deleteJournalEntry(plantId, entryId)` mirrors `deleteNote`; `deletePlant` extended to call `deleteJournalDirectory(id)` + remove `journals[id]` map entry BEFORE state mutation. Smoke runner: grep-count assertions on useStorage.tsx for 4 sites per action (interface + useCallback + value object + dep array).

3. **i18n parity** — `common.json` `journal.*` namespace EN+ES parity for every key used in the JournalSection / JournalQuickAddSheet / JournalEntryRow components. Smoke runner: explicit per-key `getNested(en, 'journal.X') && getNested(es, 'journal.X')` assertions for ≥15 required keys. `check-i18n-keys.mjs` extension NOT required (journal keys live in common.json, not plants.json).

4. **Cross-phase regression discipline** — Phase 18 STRICT GAM-04 + CARD-01 + GAM-03 sentinels remain PASS; Phase 19 TOX-03/04/06 sentinels remain PASS; Phase 20 FERT-03/06/07 sentinels remain PASS. Smoke runner: STRICT (never SKIP) sentinels forked verbatim from smoke-phase20.cjs:140-157 + new Phase 20-specific entries (FertilizeCard preserved, careCardsRow preserved, fertilizer i18n-extension preserved). The negative-grep sentinel for JOURNAL-05 (premium-gate) is a 5th implicit pillar.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/21-plant-journal/21-CONTEXT.md` lines 1-130 — locked decisions, code context, integration points (CRITICAL — authoritative for this phase).
- `.planning/REQUIREMENTS.md` lines 96-102 — JOURNAL-01..05 verbatim spec.
- `.planning/STATE.md` lines 246-258 — Phase 21 traceability table entries.
- `.planning/ROADMAP.md` lines 248-258 — Phase 21 description + success criteria.
- `package.json` lines 24-58 — all 6 required packages pre-installed at SDK-54-compatible versions; no `npx expo install` needed in Wave 0.
- `src/types/index.ts` lines 100-154 — AppData shape + Note/Reminder shape (precedents for JournalEntry); lines 50-58 (FertilizeSchedule additive-optional precedent).
- `src/hooks/useStorage.tsx` lines 53-69 (interface) + 379-391 (deletePlant) + 460-474 (addNote/deleteNote impl precedent for addJournalEntry) + 791-806 (value object) + 833-836 (deps array) + 100-119 (snapshotFromRef) + 143-158 (dataRef.current init).
- `src/services/photoService.ts` lines 1-101 — **complete reference implementation** for journalService (modern Paths/File/Directory API + capture + compress + save + delete + recursive directory delete).
- `src/components/MyPlantDetailModal.tsx` lines 37-38 (ModalSectionId union) + 65-67 (initialSection prop) + 76-82 (scrollViewRef + sectionLayouts + onSectionLayout) + 163-181 (scroll-to-section effect + reset effect) + 200-216 (handleDelete Alert pattern) + 474-479 (Mascotas section as insertion-after target).
- `src/components/plant-detail/EducationalSection.tsx` lines 1-155 — **complete reference implementation** for Diario section collapse (180ms `Easing.out(Easing.cubic)` Reanimated v4 + hasInteracted gate + lazy-measure onLayout).
- `src/screens/PlantsScreen.tsx` lines 13 (imports) + 74 (ModalSectionId inline literal) + 139-142 (longPressSheetRef + useDismissOnPaywall) + 448-470 (BottomSheetModal full pattern) + 472-480 (Toast usage at screen level).
- `src/screens/TodayScreen.tsx` line 134 (ModalSectionId inline literal — same as PlantsScreen).
- `src/components/Toast.tsx` lines 1-87 — Toast primitive (visible + message + actionLabel + durationMs + onDismiss props; render-at-screen-level pattern).
- `scripts/smoke-phase20.cjs` lines 1-175 — **complete reference smoke runner** for fork (file-content + ts.transpileModule + STRICT cross-phase regression).
- `scripts/check-i18n-keys.mjs` lines 1-60 — confirms script validates `plants.json` only; `common.json` is out of scope (no extension needed for Phase 21).
- `.planning/phases/19-pet-toxicity/19-04-SUMMARY.md` — **canonical reference** for ModalSectionId extension mechanism (the precedent Phase 21 follows exactly).
- `.planning/phases/20-fertilization-subsystem/20-04-SUMMARY.md` — orthogonal `initialExpanded` mechanism (NOT extending ModalSectionId — Phase 21 explicitly differs).
- `.planning/phases/20-fertilization-subsystem/20-VALIDATION.md` — Phase 20 validation strategy template.
- `.planning/phases/19-pet-toxicity/19-RESEARCH.md` § Validation Architecture — pattern reference for this RESEARCH's Validation Architecture section.
- `.planning/config.json` — `workflow.nyquist_validation: true` confirms Validation Architecture section is REQUIRED.

### Secondary (MEDIUM confidence)

- React Native `<Modal>` + gorhom `BottomSheetModal` Z-order interaction (Phase 13 INFRA-04 device-verified; Pitfall 10 from Phase 18 — `useDismissOnPaywall` workaround documented).
- Reanimated v4 collapse height-0 Android bug — documented in `EducationalSection.tsx:42-48` comment block, surfaced during 2026-05-06 device test (Phase 14-03).
- `expo-image-manipulator` EXIF stripping behavior — known iOS portrait rotation gotcha; defer to device test in Wave 5.
- ASPCA-style ID generation collision risk for `Date.now().toString()` at sub-millisecond intervals — single-user offline app makes this negligible but not impossible if user double-taps "Guardar" within React's render cycle.

### Tertiary (LOW confidence — none for this phase)

- N/A — Phase 21 is a composition phase with strong in-repo precedents at every layer. All findings are HIGH or MEDIUM confidence.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all 6 packages pre-installed and version-locked to SDK 54; in-repo usage precedents for every one.
- Architecture patterns: HIGH — every pattern (AppData extension, useStorage action surface, ModalSectionId extension, BottomSheetModal portal, EducationalSection collapse, photoService) has a literal in-repo reference implementation to mirror.
- Pitfalls: HIGH — 4 of 10 pitfalls (1, 2, 3, 9) directly carry forward from Phase 14/18/19/20 RESEARCH; the rest are derived from in-repo code reading. None are speculative.
- Code examples: HIGH — every example block is grounded in a specific file:line range from the existing codebase.
- Validation architecture: HIGH — fork pattern from Phase 19-RESEARCH + Phase 20-VALIDATION is well-established.

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (30 days — stable composition phase; ecosystem unlikely to shift unless Expo SDK 55 ships and forces a `Paths` API change)
