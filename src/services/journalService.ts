/**
 * src/services/journalService.ts — Phase 21 (JOURNAL-02) skeleton.
 *
 * Real implementation lands in Plan 21-02 (modern Paths/File/Directory API
 * mirroring src/services/photoService.ts:1-101, with 1080px @ 0.7 JPEG compression
 * and per-plant subdirectory layout under documentDirectory/journal/<plantId>/<entryId>.jpg).
 *
 * Skeleton purpose: file exists for tsc + smoke runner gating at Wave 0.
 * All functions return null / no-op to keep tsc green.
 *
 * Note: the Paths.document.uri TEMPLATE-LITERAL interpolation lands in the real impl
 * (Plan 21-02). The W0 smoke gate `JOURNAL-02.journalService.Paths-document-uri` regex
 * requires `${Paths.document.uri}` interpolation (not a bare mention), so this skeleton
 * intentionally does NOT include that pattern.
 */
import { Paths } from 'expo-file-system';

void Paths; // satisfy unused-import; real impl uses Paths.document.uri

export async function pickJournalPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  void source;
  return null;
}

export async function saveJournalPhoto(plantId: string, entryId: string, imageUri: string): Promise<string> {
  void plantId; void entryId;
  return imageUri;
}

export async function deleteJournalPhoto(plantId: string, entryId: string): Promise<void> {
  void plantId; void entryId;
}

export async function deleteJournalDirectory(plantId: string): Promise<void> {
  void plantId;
}
