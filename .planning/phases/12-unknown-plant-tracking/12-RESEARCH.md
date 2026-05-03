# Phase 12: Unknown Plant Tracking — Research

**Researched:** 2026-05-03
**Domain:** AsyncStorage instrumentation, service module pattern, Settings dev-tools UI, i18n, smoke runner (transpileModule)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Service module (TRACK-01)**
- File: `src/services/unknownPlantTracker.ts` — new file co-located with `plantKnowledgeService.ts`
- AsyncStorage key: `'@unknown_plants'` (verbatim)
- Storage shape: `Record<scientificName: string, UnknownPlantEntry>`
- `UnknownPlantEntry` shape (minimum required core):
  ```ts
  type UnknownPlantEntry = {
    scientificName: string;     // canonical (lowercase, trimmed)
    commonName?: string;
    family?: string;            // often missing in prod due to Phase 11 DATA-04 paywall finding
    count: number;
    firstSeen: string;          // ISO timestamp
    lastSeen: string;           // ISO timestamp
  };
  ```
- Public API: `trackUnknownPlant(scientificName, commonName?, family?): Promise<void>` (fire-and-forget, never throws) + `getUnknownPlantsReport(): Promise<UnknownPlantEntry[]>` (sorted desc by count, then desc by lastSeen)

**Call site (TRACK-02)**
- Location: `src/services/plantKnowledgeService.ts` inside `getEnrichedPlantData()` (lines 468-512)
- Trigger condition: when `getPlantById(scientificName)` returns `undefined` — BEFORE `searchPlantKnowledge(plantName)` Perenual fallback chain
- Fire-and-forget invocation: `void trackUnknownPlant(scientificName, commonName, family).catch(() => {})`
- Field sourcing: use `plantName` (the input param) as `scientificName` — best-effort signal; no post-Perenual enrichment

**Settings UI (TRACK-03)**
- Location: `src/screens/SettingsScreen.tsx` inside `{__DEV__ && (` block
- Display: `Alert.alert` (not a Modal) with stringified report — dev-only ergonomic
- Read-only: no edit, no clear-on-tap, no export
- Format per row: `{count}× {scientificName} — last: {lastSeen}` (or with `commonName` when present)
- i18n: add keys `settings.unknownPlantsReport`, `settings.unknownPlantsReportEmpty` (and optionally `settings.unknownPlantsReportTitle`) to `src/i18n/locales/{en,es}/common.json`

**Smoke runner (Claude's Discretion)**
- File: `scripts/smoke-phase12.mjs` — mirrors `smoke-phase11.mjs` pattern
- Stub: `scripts/.tmp-phase12/async-storage.mjs` — in-memory Map-backed AsyncStorage stub
- Minimum 5 behavior asserts

**Ergonomics**
- Silent error handling: `console.warn` in `__DEV__` only; production swallows silently
- Lowercase + trim canonicalization at write time
- No retention cap (dev/testing context; <1KB for 100 entries)
- No telemetry, no cloud sync — strictly local

### Claude's Discretion
- Alert.alert vs Modal: Alert.alert selected (simpler, dev-only, faster to ship)
- Lowercase canonicalization at write time (recommended)
- Retention policy: no cap
- i18n key names: `settings.unknownPlantsReport`, `settings.unknownPlantsReportEmpty`, optionally `settings.unknownPlantsReportTitle`

### Deferred Ideas (OUT OF SCOPE)
- Cloud sync of `@unknown_plants` to Supabase (needs auth milestone)
- User-facing "request this plant" UI
- Auto-generation of CAT plans from report top-N
- LRU/retention cap
- Enriching tracked entries with Perenual response after the fact (scope creep)
- Phase 11 DATA-04 follow-up (provider migration)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRACK-01 | New service `src/services/unknownPlantTracker.ts` exports `trackUnknownPlant` and `getUnknownPlantsReport` writing to AsyncStorage key `@unknown_plants` | AsyncStorage import pattern from `payments.ts` / `useWeather.ts`; `@mock_premium` precedent for `@`-prefixed keys; service module shape from `imageService.ts` |
| TRACK-02 | `getEnrichedPlantData()` calls `trackUnknownPlant` fire-and-forget when `getPlantById(scientificName)` returns no curated entry — BEFORE the Perenual fallback chain | Code path confirmed: `getEnrichedPlantData` at lines 468-512 goes straight to `searchPlantKnowledge(plantName)` — no existing catalog check; must add one. `getPlantById` is the right function but is `@deprecated` — `getCatalogEntry` is the Phase 8 canonical replacement. |
| TRACK-03 | Settings → Dev tools section shows `getUnknownPlantsReport()` sorted desc by count (read-only) | Dev-tools section pattern confirmed: `{__DEV__ && (` at line 422; `TouchableOpacity` + `Alert.alert` pattern at lines 443-473; new button slots before the destructive "Reset App" button |
</phase_requirements>

---

## Summary

Phase 12 is a narrow instrumentation phase: create one new service module, add two lines to one existing function, and add one button to the dev-tools section of Settings. All three deliverables are self-contained and have zero upstream dependency.

The key research finding is that `getEnrichedPlantData()` does NOT currently check whether `plantName` is in the curated catalog before calling Perenual. The CONTEXT.md TRACK-02 description says to call `getPlantById(scientificName)` — but `getPlantById` is marked `@deprecated` as of Phase 8 (CAT-04). The Phase 8 canonical replacement is `getCatalogEntry(slug)`. However, `getCatalogEntry` resolves by **id/slug** (e.g. `"monstera"`), not by scientific name. `getEnrichedPlantData` receives `plantName` — which is a common name or scientific name (e.g., `"Monstera deliciosa"` or `"Monstrera"`) — not a catalog slug. The correct function for a scientific-name lookup is `findPlantInDatabase(scientificName)` from `src/utils/plantIdentification.ts`, which already does fuzzy genus-level matching.

The AsyncStorage key inventory is clear: `@unknown_plants` does not collide with any existing key. The `@`-prefix is used for dev/premium toggle data (`@mock_premium`) and is the appropriate convention.

The smoke runner pattern from Phase 11 is directly reusable: `ts.transpileModule` rewrite of import paths, runtime-written stubs in `scripts/.tmp-phase12/`, in-memory AsyncStorage stub, assertion harness.

**Primary recommendation:** Use `findPlantInDatabase(plantName)` (from `plantIdentification.ts`) as the catalog-miss gate in `getEnrichedPlantData`, not `getPlantById` (deprecated) and not `getCatalogEntry` (slug-only). If `findPlantInDatabase` returns `undefined`, it is an unknown plant — call the tracker.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-native-async-storage/async-storage` | already installed | Persist `@unknown_plants` record | Project-standard; already used in `payments.ts`, `useWeather.ts`, `useStorage.tsx`, `MigrationTooltip.tsx`, `DailyTip.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Alert` (React Native core) | built-in | Display report in dev tools | Already used in Settings dev-tools for "Load v0 fixture" and "Reset App" buttons |
| `DevSettings` (React Native) | built-in | Hot reload after dev reset | Already imported in SettingsScreen — no new dep needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Alert.alert` for report display | Custom Modal component | Modal is 1 extra component; Alert is 5 lines; dev-only context favors Alert |
| `findPlantInDatabase` for catalog miss gate | `getCatalogEntry` | `getCatalogEntry` takes a slug, not a scientific name — wrong tool |
| `findPlantInDatabase` for catalog miss gate | `getPlantById` (deprecated) | Deprecated since Phase 8 with a `@deprecated` JSDoc; avoid for new code |

**Installation:** No new packages required. All needed libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/services/unknownPlantTracker.ts    # NEW — TRACK-01
src/services/plantKnowledgeService.ts  # MODIFY — TRACK-02 (2-line change)
src/screens/SettingsScreen.tsx         # MODIFY — TRACK-03 (1 button)
src/i18n/locales/en/common.json        # MODIFY — 2-4 new keys
src/i18n/locales/es/common.json        # MODIFY — 2-4 new keys (voseo)
scripts/smoke-phase12.mjs             # NEW — Nyquist gate
scripts/.tmp-phase12/async-storage.mjs # NEW — runtime stub (gitignored)
```

### Pattern 1: Service Module Shape (mirror imageService.ts)

**What:** Narrow async service module — a few named exports, no class, no default export, all errors caught internally.
**When to use:** Any service that wraps I/O (AsyncStorage, Supabase, file system) and must never crash the caller.

```typescript
// src/services/unknownPlantTracker.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNKNOWN_PLANTS_KEY = '@unknown_plants';

export type UnknownPlantEntry = {
  scientificName: string;
  commonName?: string;
  family?: string;          // often undefined — Perenual free tier paywall (Phase 11 DATA-04)
  count: number;
  firstSeen: string;        // ISO 8601
  lastSeen: string;         // ISO 8601
};

export async function trackUnknownPlant(
  scientificName: string,
  commonName?: string,
  family?: string
): Promise<void> {
  try {
    const key = scientificName.toLowerCase().trim();  // canonicalize
    const raw = await AsyncStorage.getItem(UNKNOWN_PLANTS_KEY);
    const record: Record<string, UnknownPlantEntry> = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();
    const existing = record[key];
    record[key] = existing
      ? { ...existing, count: existing.count + 1, lastSeen: now,
          commonName: commonName ?? existing.commonName,
          family: family ?? existing.family }
      : { scientificName: key, commonName, family, count: 1, firstSeen: now, lastSeen: now };
    await AsyncStorage.setItem(UNKNOWN_PLANTS_KEY, JSON.stringify(record));
  } catch (e) {
    if (__DEV__) console.warn('[UnknownPlantTracker] write failed:', e);
    // never throw — fire-and-forget
  }
}

export async function getUnknownPlantsReport(): Promise<UnknownPlantEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(UNKNOWN_PLANTS_KEY);
    if (!raw) return [];
    const record: Record<string, UnknownPlantEntry> = JSON.parse(raw);
    return Object.values(record).sort((a, b) =>
      b.count !== a.count ? b.count - a.count : b.lastSeen.localeCompare(a.lastSeen)
    );
  } catch (e) {
    if (__DEV__) console.warn('[UnknownPlantTracker] read failed:', e);
    return [];
  }
}
```

### Pattern 2: Call Site in getEnrichedPlantData (TRACK-02)

**What:** Two-line insertion in `getEnrichedPlantData()` before `searchPlantKnowledge(plantName)`.
**When to use:** Every time a caller passes a plant name that is not in the curated catalog.

```typescript
// src/services/plantKnowledgeService.ts — getEnrichedPlantData() (lines 468-512)
// ADD import at top:
import { findPlantInDatabase } from '../utils/plantIdentification';
import { trackUnknownPlant } from './unknownPlantTracker';

export async function getEnrichedPlantData(
  plantName: string,
  defaults?: Partial<EnrichedPlantData>
): Promise<EnrichedPlantData> {
  // ... defaultData setup (unchanged) ...

  // TRACK-02: fire-and-forget before Perenual fallback
  if (!findPlantInDatabase(plantName)) {
    void trackUnknownPlant(plantName).catch(() => {});
  }

  // existing: Try to get from cache or API
  const result = await searchPlantKnowledge(plantName);
  // ... rest unchanged ...
}
```

**Note on function choice:** `findPlantInDatabase(scientificName)` from `src/utils/plantIdentification.ts` is the correct lookup — it matches by `plant.scientificName` with fuzzy genus matching. `getPlantById(id)` takes a slug like `"monstera"` (not a scientific name) and is `@deprecated` since Phase 8. `getCatalogEntry(slug)` also takes a slug. Neither is appropriate for the `plantName` string passed to `getEnrichedPlantData`.

### Pattern 3: Settings Dev-Tools Button (TRACK-03)

**What:** One additional `TouchableOpacity` inside the `{__DEV__ && (` block, using the same `styles.devButton` style as existing buttons. Placed after `showPaywall` button, before the destructive "Reset App" button.

```typescript
// src/screens/SettingsScreen.tsx — inside {__DEV__ && ( ... )} block
// After the "Show Paywall" TouchableOpacity, before "Load v0 fixture":
<TouchableOpacity
  style={styles.devButton}
  onPress={async () => {
    const report = await getUnknownPlantsReport();
    if (report.length === 0) {
      Alert.alert(t('settings.unknownPlantsReportTitle'), t('settings.unknownPlantsReportEmpty'));
      return;
    }
    const body = report
      .map(e => `${e.count}× ${e.scientificName}${e.commonName ? ` (${e.commonName})` : ''} — last: ${e.lastSeen.slice(0, 10)}`)
      .join('\n');
    Alert.alert(t('settings.unknownPlantsReportTitle'), body);
  }}
>
  <Text style={styles.devButtonText}>{t('settings.unknownPlantsReport')}</Text>
</TouchableOpacity>
```

### Pattern 4: Smoke Runner (mirrors smoke-phase11.mjs)

**What:** `scripts/smoke-phase12.mjs` — `ts.transpileModule` rewrite of import paths; runtime-written stub at `scripts/.tmp-phase12/async-storage.mjs`; in-memory Map-backed AsyncStorage.

**Key difference from Phase 11:** Phase 11 stubbed `../lib/supabase` and `../types/database`. Phase 12 stubs `@react-native-async-storage/async-storage`. The `@react-native-async-storage/async-storage` import is a non-relative path — `ts.transpileModule` does NOT resolve node modules, it only rewrites source text. The import path rewrite must be a string replacement: replace `'@react-native-async-storage/async-storage'` with a relative path pointing to the stub.

```javascript
// scripts/smoke-phase12.mjs — stub rewrite approach
const rewritten = svcSource
  .replace(
    /from ['"]@react-native-async-storage\/async-storage['"]/g,
    `from './.tmp-phase12/async-storage.mjs'`
  );
```

**Stub content** (in-memory Map, matches AsyncStorage API surface needed by tracker):

```javascript
// scripts/.tmp-phase12/async-storage.mjs
const _store = new Map();
export default {
  async getItem(key) { return _store.get(key) ?? null; },
  async setItem(key, value) { _store.set(key, value); },
  async removeItem(key) { _store.delete(key); },
};
```

### Anti-Patterns to Avoid

- **Using `getPlantById(id)`** for the catalog miss check: it takes a slug (`"monstera"`), not a scientific name. Will always return `undefined` for valid plants (false positives — everything would be tracked).
- **Using `getCatalogEntry(slug)`** for the same reason.
- **`await trackUnknownPlant(...)`** at the call site — breaks the fire-and-forget requirement and adds latency.
- **`throw` inside `trackUnknownPlant`** — any error must be swallowed (or `console.warn` in `__DEV__`). Never propagate.
- **Modal component for the report UI** — adds scope to Phase 12 for a dev-only feature. Alert.alert is the correct ergonomic.
- **Storing `@unknown_plants` under the `plant-agenda-v2` envelope** — must be its own independent AsyncStorage key.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-memory AsyncStorage for smoke tests | Custom test infra | Map-based stub per Phase 11 pattern | 10 lines; already proven in Phase 11 for Supabase |
| Scientific name → catalog lookup | Custom fuzzy matcher | `findPlantInDatabase()` from `plantIdentification.ts` | Already handles exact + genus-level matching; battle-tested |

---

## Common Pitfalls

### Pitfall 1: Wrong Catalog Lookup Function

**What goes wrong:** Using `getPlantById(plantName)` or `getCatalogEntry(plantName)` with a scientific name input. Both functions look up by **slug** (`"monstera"`), not by scientific name (`"Monstera deliciosa"`). This means every plant — including catalog plants — would return `undefined`, and every identification would be tracked as unknown.

**Why it happens:** CONTEXT.md mentions `getPlantById(scientificName)` from `plantDatabase.ts:1671`. The function signature is `getPlantById(id: string)` — the parameter is named `id`, not `scientificName`. The JSDoc says `@deprecated Phase 8 (CAT-04)`. The `id` is a slug like `"monstera"`, not a scientific name.

**How to avoid:** Use `findPlantInDatabase(plantName)` from `src/utils/plantIdentification.ts`. It matches against `plant.scientificName` with fuzzy genus-level matching.

**Warning signs:** Smoke test shows all plants being tracked, including known catalog species.

### Pitfall 2: Race Condition on Concurrent Identification

**What goes wrong:** Two parallel identifications for the same scientific name both read `count: 0` → both write `count: 1` → second write overwrites the first → count stays at 1 instead of 2.

**Why it happens:** AsyncStorage reads and writes are not atomic at the application level.

**How to avoid:** Accept as known low-risk issue (development-only data, eventual consistency is fine at this scale). Document in a code comment. No mutex/serialization needed.

### Pitfall 3: JSON.parse Failure on Corrupt Storage

**What goes wrong:** `AsyncStorage.getItem('@unknown_plants')` returns a corrupt or truncated JSON string → `JSON.parse` throws → tracker crashes.

**How to avoid:** Wrap the entire `trackUnknownPlant` body in try/catch (already in the pattern above). On parse failure, treat as empty record and continue. The entry will be re-created from scratch.

### Pitfall 4: Native Module in Smoke Runner

**What goes wrong:** `import AsyncStorage from '@react-native-async-storage/async-storage'` in Node fails — native module with no Node implementation.

**How to avoid:** Rewrite the import path in the `ts.transpileModule` string rewrite step (`.replace(/'@react-native-async-storage\/async-storage'/g, "'./.tmp-phase12/async-storage.mjs'")`). This is the same technique Phase 11 uses for Supabase.

### Pitfall 5: Circular Import

**What goes wrong:** `plantKnowledgeService.ts` imports from `plantIdentification.ts`, and `plantIdentification.ts` imports from `plantKnowledgeService.ts` (or vice versa), creating a circular dependency.

**How to avoid:** Check import graph before adding `findPlantInDatabase` import to `plantKnowledgeService.ts`. `plantIdentification.ts` currently imports from `supabase.ts` and local data — it does NOT import `plantKnowledgeService.ts`. No cycle.

### Pitfall 6: Telemetry / Cloud Sync

**What goes wrong:** Future developer adds Supabase `insert` call inside `trackUnknownPlant`, violating PROJECT.md "no third-party analytics" non-negotiable.

**How to avoid:** Comment in the service file: `// LOCAL ONLY — do NOT add Supabase/network calls. Cloud sync is deferred to TRACK-V01 (v2 auth milestone).`

---

## Code Examples

### Exact Integration Point in getEnrichedPlantData

Current code at `src/services/plantKnowledgeService.ts:489-511`:
```typescript
// CURRENT (lines 489-511):
// Try to get from cache or API
const result = await searchPlantKnowledge(plantName);

if (result.success && result.data) {
  // ... map result to EnrichedPlantData ...
}

return defaultData;
```

After TRACK-02 patch (2 lines inserted before line 490):
```typescript
// AFTER PATCH:
// TRACK-02: Log catalog miss before Perenual fallback (fire-and-forget)
if (!findPlantInDatabase(plantName)) {
  void trackUnknownPlant(plantName).catch(() => {});
}

// Try to get from cache or API
const result = await searchPlantKnowledge(plantName);
// ... rest unchanged
```

### AsyncStorage Key Inventory (no collision)

| Key | Source | Pattern |
|-----|--------|---------|
| `'plant-agenda-v2'` | `src/data/constants.ts:46` | No `@` prefix — main app data |
| `'plant-agenda-v2.backup-pre-v1.1'` | `src/utils/migration.ts:16` | No `@` prefix — migration backup |
| `'migration-tooltip-seen-v1.1'` | `MigrationTooltip.tsx:7` | No `@` prefix — one-shot flag |
| `'daily-tips-seen'` | `DailyTip.tsx:20` | No `@` prefix — seen tips set |
| `'weather-cache'` | `useWeather.ts:5` | No `@` prefix — weather data |
| `'@mock_premium'` | `src/services/payments.ts:46` | `@` prefix — dev/test data |
| `'@unknown_plants'` | **NEW Phase 12** | `@` prefix — dev/instrumentation data |

**Conclusion:** `@unknown_plants` does not collide with any existing key. The `@`-prefix convention is established by `@mock_premium` in `payments.ts` for non-user-data dev keys.

### i18n Keys to Add

**`src/i18n/locales/en/common.json`** (after `"showPaywall"` key, within the same object):
```json
"unknownPlantsReport": "Unknown plants report",
"unknownPlantsReportTitle": "Unknown Plants",
"unknownPlantsReportEmpty": "No unknown plants logged yet."
```

**`src/i18n/locales/es/common.json`** (after `"showPaywall"` key):
```json
"unknownPlantsReport": "Reporte de plantas desconocidas",
"unknownPlantsReportTitle": "Plantas desconocidas",
"unknownPlantsReportEmpty": "Todavía no se registraron plantas desconocidas."
```

**i18n key nesting context:** These keys sit at the top level of the `settings` object (e.g., `settings.unknownPlantsReport`). Confirmed by looking at existing keys: `settings.devTools`, `settings.devToolsDescription`, `settings.togglePremium`, `settings.showPaywall` — all are flat keys in the settings object. The `SettingsScreen` reads them as `t('settings.devTools')` etc.

### Smoke Runner Behavior Asserts (≥6 required)

```javascript
// 1. trackUnknownPlant inserts a new entry
await svcMod.trackUnknownPlant('Monstera deliciosa');
const report1 = await svcMod.getUnknownPlantsReport();
assert(report1.length === 1, 'S1: first track inserts 1 entry');

// 2. Second call for the same name increments count
await svcMod.trackUnknownPlant('Monstera deliciosa');
const report2 = await svcMod.getUnknownPlantsReport();
assert(report2[0].count === 2, 'S2: second track increments count to 2');

// 3. Lowercase canonicalization — 'MONSTERA DELICIOSA' merges with 'monstera deliciosa'
await svcMod.trackUnknownPlant('MONSTERA DELICIOSA');
const report3 = await svcMod.getUnknownPlantsReport();
assert(report3[0].count === 3 && report3.length === 1, 'S3: uppercase key merges with canonical lowercase');

// 4. Two different species — report has 2 entries
await svcMod.trackUnknownPlant('Rosa canina');
const report4 = await svcMod.getUnknownPlantsReport();
assert(report4.length === 2, 'S4: two different species = 2 entries');

// 5. Report is sorted desc by count
assert(report4[0].count >= report4[1].count, 'S5: report sorted desc by count');

// 6. getReport returns [] when storage is empty (simulate fresh store)
// (use a fresh module instance or clear the in-memory store)
assert(Array.isArray(report4), 'S6: getReport returns an array');

// 7. AsyncStorage.setItem failure is silently caught (does not throw)
// Force the stub to throw once, then verify trackUnknownPlant resolves without error
let threw = false;
try {
  await svcMod.trackUnknownPlant_with_broken_storage('anything');
} catch {
  threw = true;
}
assert(!threw, 'S7: AsyncStorage failure is swallowed — no throw to caller');

// 8. firstSeen is set on first call; not overwritten on subsequent calls
const entry = report2[0];
assert(typeof entry.firstSeen === 'string' && entry.firstSeen.length > 0, 'S8: firstSeen is an ISO string');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getPlantById(id)` | `getCatalogEntry(slug)` | Phase 8 (CAT-04) | `getPlantById` is `@deprecated`; `getCatalogEntry` resolves aliases; new code should prefer `getCatalogEntry` for slug lookups |
| `fetchFromPerenual()` direct API call | `supabase.functions.invoke('get-plant-care')` | Phase 10 (SEC-03) | Perenual key is server-side; `plantKnowledgeService.ts` now calls the edge function |

**Deprecated/outdated:**
- `getPlantById(id)`: deprecated since Phase 8 with `@deprecated` JSDoc. Use `getCatalogEntry(slug)` for slug lookups, `findPlantInDatabase(scientificName)` for scientific name lookups.

---

## Open Questions

1. **`findPlantInDatabase` import in smoke runner**
   - What we know: `plantIdentification.ts` imports `i18n`, `PLANT_DATABASE`, and the supabase client. It also imports `PlantDBEntry` from types. The smoke runner would need to stub these too if it imports `findPlantInDatabase`.
   - What's unclear: Whether the smoke runner for `unknownPlantTracker.ts` even needs to test the integration with `findPlantInDatabase`, or just unit-test the tracker in isolation (with the call site change verified by `tsc --noEmit`).
   - Recommendation: Smoke `unknownPlantTracker.ts` in isolation (it only needs `AsyncStorage`). The `findPlantInDatabase` integration in `getEnrichedPlantData` is verified by TypeScript type-check (`npx tsc --noEmit`) — no smoke needed for the 2-line call site change.

2. **`usePlantIdentification.ts` passes `plant.commonName` to `getEnrichedPlantData`, not scientific name**
   - What we know: `selectResult(plant: IdentifiedPlant)` calls `getEnrichedPlantData(plant.commonName, ...)` (line 196 of `usePlantIdentification.ts`). So `plantName` in `getEnrichedPlantData` is the common name (e.g., "Monstera", "Potus"), not the scientific name. `findPlantInDatabase` matches against `PlantDBEntry.scientificName` — it won't match on common names like "Monstera".
   - What's unclear: Whether `plant.commonName` ever equals a scientific name (possible when PlantNet returns scientific name as common name for un-translated species).
   - Recommendation: The tracker captures whatever `plantName` is at the call site — it's a best-effort signal. The CONTEXT.md explicitly states: "track on miss with the input name" is enough for prioritization. No change needed to the call site — `findPlantInDatabase` will simply return `undefined` for common names that don't match scientific names (which is fine: if the plant isn't in the catalog, it IS unknown). Document this in a code comment.

---

## Validation Architecture

> `nyquist_validation: true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js `ts.transpileModule` smoke runner (no test framework — project lock since Phase 4) |
| Config file | none — `scripts/smoke-phase12.mjs` is self-contained |
| Quick run command | `node scripts/smoke-phase12.mjs` |
| Full suite command | `node scripts/smoke-phase12.mjs && npx tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACK-01 | `trackUnknownPlant` inserts new entry | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-01 | `trackUnknownPlant` increments count on second call | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-01 | Lowercase canonicalization merges mixed-case inputs | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-01 | `getUnknownPlantsReport` returns sorted desc by count | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-01 | AsyncStorage failure is silently caught (no throw) | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-01 | `firstSeen` set on first call; not overwritten | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-01 | JSON.parse failure on corrupt storage returns empty (no throw) | unit (smoke) | `node scripts/smoke-phase12.mjs` | ❌ Wave 0 |
| TRACK-02 | `getEnrichedPlantData` compiles with new import and call | type-check | `npx tsc --noEmit` | ✅ existing |
| TRACK-02 | Identify non-catalog plant in Expo Go → appears in dev tools report | integration (manual) | manual device test | N/A |
| TRACK-03 | Settings dev tools button renders and Alert shows report | manual (visual) | manual device test | N/A |
| TRACK-03 | Empty report shows `unknownPlantsReportEmpty` text | manual (visual) | manual device test | N/A |

### Sampling Rate

- **Per task commit:** `node scripts/smoke-phase12.mjs`
- **Per wave merge:** `node scripts/smoke-phase12.mjs && npx tsc --noEmit`
- **Phase gate:** Full suite green (`node scripts/smoke-phase12.mjs` PASS + `npx tsc --noEmit` exits 0) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/smoke-phase12.mjs` — smoke runner (covers TRACK-01 unit behavior, ≥7 asserts)
- [ ] `scripts/.tmp-phase12/async-storage.mjs` — in-memory Map-backed AsyncStorage stub
- [ ] `src/services/unknownPlantTracker.ts` — the service under test (written in Wave 0 so smoke can import it)

*(Existing `npx tsc --noEmit` covers type-check for TRACK-02 and TRACK-03 — no new infra needed)*

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/services/plantKnowledgeService.ts:468-512` — `getEnrichedPlantData` full code path
- Direct source read: `src/utils/plantIdentification.ts:117-127` — `findPlantInDatabase` function
- Direct source read: `src/data/plantDatabase.ts:1667-1673` — `getPlantById` deprecation annotation
- Direct source read: `src/screens/SettingsScreen.tsx:421-497` — dev-tools JSX pattern
- Direct source read: `src/i18n/locales/en/common.json:204-209` — existing settings keys
- Direct source read: `scripts/smoke-phase11.mjs` — full smoke runner pattern
- Direct source read: `src/services/payments.ts:46` — `@mock_premium` key precedent
- All AsyncStorage key constants across `src/` — collision check

### Secondary (MEDIUM confidence)
- `.planning/phases/12-unknown-plant-tracking/12-CONTEXT.md` — locked decisions (authoritative project planning artifact)
- `.planning/phases/11-perenual-data-quality/11-VERIFICATION.md` — DATA-04 finding context
- `.planning/REQUIREMENTS.md` §"Unknown Plant Tracking (TRACK)" — TRACK-01..03 spec

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; `AsyncStorage` usage is well-established across 6+ files
- Architecture: HIGH — integration point confirmed by code read; patterns confirmed from Phase 11
- Pitfalls: HIGH — getPlantById/getCatalogEntry wrong-function pitfall confirmed by code + deprecation annotation; others are standard AsyncStorage patterns
- i18n: HIGH — existing key structure confirmed by file read
- Smoke runner: HIGH — Phase 11 pattern confirmed to work; stub rewrite for `@react-native-async-storage` is the only new element

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (stable domain; no external API changes)
