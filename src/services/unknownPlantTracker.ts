/**
 * Unknown Plant Tracker — local-first instrumentation for catalog misses.
 *
 * LOCAL ONLY — do NOT add Supabase/network calls. Cloud sync is deferred
 * to TRACK-V01 (v2 auth milestone). See PROJECT.md non-negotiable: "no
 * third-party analytics".
 *
 * Storage:  AsyncStorage key `@unknown_plants`
 * Shape:    Record<scientificName: string, UnknownPlantEntry>
 * Lookup:   case-insensitive (lowercase + trim canonicalization at write time)
 * Errors:   silent — fire-and-forget. console.warn in __DEV__ only.
 *
 * Race condition note: AsyncStorage reads/writes are not atomic at app level.
 * Two parallel identifications for the same name can race. Accepted as known
 * low-risk issue (development data, eventual consistency at this scale).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNKNOWN_PLANTS_KEY = '@unknown_plants';

export type UnknownPlantEntry = {
  scientificName: string;     // canonical key (lowercase + trim of input)
  commonName?: string;        // best-effort from caller
  family?: string;            // often undefined — Perenual free tier paywall (Phase 11 DATA-04)
  count: number;              // monotonically increasing per miss
  firstSeen: string;          // ISO 8601, immutable across re-tracks
  lastSeen: string;           // ISO 8601, updated every track
};

/**
 * Fire-and-forget. Always resolves. Caller does:
 *   void trackUnknownPlant(name).catch(() => {});
 */
export async function trackUnknownPlant(
  scientificName: string,
  commonName?: string,
  family?: string
): Promise<void> {
  try {
    const key = scientificName.toLowerCase().trim();
    if (!key) return; // empty/whitespace input → silent no-op

    let record: Record<string, UnknownPlantEntry> = {};
    try {
      const raw = await AsyncStorage.getItem(UNKNOWN_PLANTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          record = parsed as Record<string, UnknownPlantEntry>;
        }
      }
    } catch {
      // Corrupt JSON → start fresh; write a clean record.
      record = {};
    }

    const now = new Date().toISOString();
    const existing = record[key];
    record[key] = existing
      ? {
          ...existing,
          count: existing.count + 1,
          lastSeen: now,
          commonName: commonName ?? existing.commonName,
          family: family ?? existing.family,
        }
      : {
          scientificName: key,
          commonName,
          family,
          count: 1,
          firstSeen: now,
          lastSeen: now,
        };

    await AsyncStorage.setItem(UNKNOWN_PLANTS_KEY, JSON.stringify(record));
  } catch (e) {
    if (__DEV__) {
      console.warn('[UnknownPlantTracker] write failed:', e);
    }
    // silent swallow — fire-and-forget
  }
}

/**
 * Read-only report for dev tools. Returns [] on any failure (silent).
 * Sorted: desc by count, ties broken by desc lastSeen (newer first).
 */
export async function getUnknownPlantsReport(): Promise<UnknownPlantEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(UNKNOWN_PLANTS_KEY);
    if (!raw) return [];
    let record: Record<string, UnknownPlantEntry>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return [];
      record = parsed as Record<string, UnknownPlantEntry>;
    } catch {
      // Corrupt JSON → empty report
      return [];
    }
    return Object.values(record).sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : b.lastSeen.localeCompare(a.lastSeen)
    );
  } catch (e) {
    if (__DEV__) {
      console.warn('[UnknownPlantTracker] read failed:', e);
    }
    return [];
  }
}
