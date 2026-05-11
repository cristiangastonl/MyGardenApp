/**
 * src/services/journalService.ts — Phase 21 (JOURNAL-02) photo pipeline.
 *
 * Mirrors src/services/photoService.ts:1-101 with three deltas:
 *  1. Directory name: 'journal' (not 'plant-photos')
 *  2. JPEG resize: 1080px width (not 1200px) — CONTEXT lock
 *  3. JPEG compression: 0.7 (not 0.8) — CONTEXT lock
 *
 * Modern API: Paths/File/Directory from expo-file-system (NOT legacy FileSystem.documentDirectory
 * string concat). Pitfall 1 from RESEARCH — legacy API is deprecated in new code.
 *
 * Atomic-write invariant: every photoUri persisted in AppData.journals points to a real file.
 * Plant-delete cascade calls deleteJournalDirectory(plantId) for recursive cleanup.
 */
import { Paths, File, Directory } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const JOURNAL_DIR_NAME = 'journal';

function getPlantDir(plantId: string): string {
  return `${Paths.document.uri}${JOURNAL_DIR_NAME}/${plantId}/`;
}

async function ensureDir(dirUri: string): Promise<void> {
  // Create parent journal/ if missing, then per-plant subdir if missing.
  // Guarded with try/catch for race-condition tolerance (photoService.ts:14-32 precedent).
  const parentUri = `${Paths.document.uri}${JOURNAL_DIR_NAME}/`;
  const parentDir = new Directory(parentUri);
  try { if (!parentDir.exists) parentDir.create(); } catch { /* race condition safe */ }
  const dir = new Directory(dirUri);
  try { if (!dir.exists) dir.create(); } catch { /* race condition safe */ }
}

async function resizeImage(uri: string): Promise<string> {
  // CONTEXT lock: 1080px max width + JPEG quality 0.7 (tighter than photoService 1200px @ 0.8)
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

/**
 * Opens camera or gallery picker. Returns the raw URI (un-resized, un-compressed)
 * or null if the user canceled / denied permission.
 * Caller is expected to feed the returned URI into saveJournalPhoto for compression + persistence.
 */
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

/**
 * Resizes + compresses + copies the source image into the per-plant journal directory.
 * Returns the final destUri (the value that should be persisted in JournalEntry.photoUri).
 * Throws on FS / manipulation failure — caller is expected to wrap in try/catch
 * and abort the addJournalEntry call (preserves atomic-write invariant).
 */
export async function saveJournalPhoto(plantId: string, entryId: string, imageUri: string): Promise<string> {
  const dir = getPlantDir(plantId);
  await ensureDir(dir);
  const resizedUri = await resizeImage(imageUri);
  const destUri = `${dir}${entryId}.jpg`;
  const source = new File(resizedUri);
  source.copy(new File(destUri));
  return destUri;
}

/**
 * Deletes a single journal photo file. Idempotent — no-op if file is already absent.
 * Called when the user deletes a journal entry (Plan 21-04 long-press flow).
 */
export async function deleteJournalPhoto(plantId: string, entryId: string): Promise<void> {
  const filePath = `${getPlantDir(plantId)}${entryId}.jpg`;
  const file = new File(filePath);
  if (file.exists) file.delete();
}

/**
 * Recursively deletes the per-plant journal subdirectory and all photos within.
 * Idempotent — no-op if directory is already absent (plant had no photo entries).
 * Called from useStorage.deletePlant orphan cleanup (Plan 21-03) BEFORE state mutation.
 */
export async function deleteJournalDirectory(plantId: string): Promise<void> {
  const dir = new Directory(getPlantDir(plantId));
  if (dir.exists) dir.delete(); // recursive by default for Directory
}
