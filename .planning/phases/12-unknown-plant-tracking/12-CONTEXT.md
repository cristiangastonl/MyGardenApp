# Phase 12: Unknown Plant Tracking - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** Requirements-derived (TRACK-01..03 are concrete; no grey areas needed — same pattern as Phase 10)

<domain>
## Phase Boundary

Silently log every plant identification attempt that doesn't match the curated 64-entry catalog. The log lives in AsyncStorage under `@unknown_plants` as `Record<scientificName, UnknownPlantEntry>` and is surfaced as a read-only report inside Settings → Dev tools, sorted by count descending. The tracking call is fire-and-forget — it MUST NOT slow down the identification UX or fail loudly if AsyncStorage rejects the write.

The phase is data-instrumentation, not feature-bearing for end users. Its only real consumer is the developer (during v1.2 closeout and v2 planning) who'll use the report to prioritize which 56 species to add in Phases 14-17 (CAT Wave A/B/C) and which to defer to v2. Phase 11 just established that Perenual free-tier paywalls family/type — that increases the value of TRACK data, since real identification volume is the better signal for catalog expansion than guesswork.

Locked from REQUIREMENTS.md: TRACK-01, TRACK-02, TRACK-03.

**Out of scope (deferred):**
- Cloud sync of `@unknown_plants` to Supabase — local-first per the v1.1 milestone lock; cross-device tracking belongs in the future auth milestone.
- User-facing "request this plant" UI — this is a dev-only signal, not a public feature.
- Telemetry/analytics integration — explicitly avoided per PROJECT.md non-negotiables (no third-party analytics).
- Auto-prioritization of CAT plans based on report counts — manual decision by the developer at v2 planning time.

</domain>

<decisions>
## Implementation Decisions

### Service module (TRACK-01)

- **File:** `src/services/unknownPlantTracker.ts` — new file. Co-locates with `plantKnowledgeService.ts` and `imageService.ts` (services pattern).
- **AsyncStorage key:** `'@unknown_plants'` (verbatim, no namespace prefix — matches the `@`-prefixed convention some libraries use; REQUIREMENTS.md locks the exact string).
- **Storage shape:** `Record<scientificName: string, UnknownPlantEntry>`. Keying by `scientificName` makes increments O(1) and dedupes case-insensitive variants at write time (lowercase the key before lookup).
- **`UnknownPlantEntry` shape (additive optional fields are OK; minimal required core):**
  ```ts
  type UnknownPlantEntry = {
    scientificName: string;     // canonical (lowercase, trimmed)
    commonName?: string;        // best-effort from PlantNet/Perenual response
    family?: string;            // when available (Perenual free tier sometimes returns this — see Phase 11 finding)
    count: number;              // increment per identification
    firstSeen: string;          // ISO timestamp of first identification
    lastSeen: string;           // ISO timestamp of latest identification
  };
  ```
  Rationale: count + firstSeen/lastSeen lets the dev report show "this species has been requested 12 times since 2026-05-15, last 2026-06-02". `commonName`/`family` help the developer recognize the species without copy-pasting into Google.

- **Public API (named exports):**
  - `trackUnknownPlant(scientificName: string, commonName?: string, family?: string): Promise<void>` — fire-and-forget. Wraps everything in a try/catch and **never throws** (failure is silent — a console.warn in `__DEV__` is acceptable; production silently swallows).
  - `getUnknownPlantsReport(): Promise<UnknownPlantEntry[]>` — returns sorted desc by count, then desc by lastSeen.

### Call site (TRACK-02)

- **Where:** `src/services/plantKnowledgeService.ts`, inside `getEnrichedPlantData()` (currently lines 468-510).
- **Trigger condition:** call `trackUnknownPlant(scientificName, commonName, family)` **BEFORE** the `searchPlantKnowledge(plantName)` Perenual fallback chain, when `getPlantById(scientificName)` from `src/data/plantDatabase.ts` returns `undefined` (i.e., not in the curated catalog).
  - REQUIREMENTS.md TRACK-02 wording: "BEFORE the Perenual fallback chain". The order matters: track THEN fall through to Perenual, so the tracking signal is captured even if Perenual returns nothing.
- **Fire-and-forget invocation:** `void trackUnknownPlant(scientificName, commonName, family).catch(() => {})`. The `void` operator + `.catch` ensures no unhandled promise rejection AND no `await` (zero added latency per success criterion #3 in ROADMAP).
- **Field sourcing:** at the call site we have `plantName` (the search query passed in). We do NOT yet have `scientificName`/`commonName`/`family`. The tracker should be called with `plantName` as the `scientificName` parameter when the catalog miss happens — it's a best-effort signal. After the Perenual response arrives, we could OPTIONALLY enrich the entry with the real `scientificName` from Perenual, but that's scope creep — the simple "track on miss with the input name" path is enough for prioritization.

### Settings UI (TRACK-03)

- **Location:** `src/screens/SettingsScreen.tsx`, inside the existing `{__DEV__ && (` block (lines 422-???). The existing pattern uses TouchableOpacity buttons + Alert prompts for dev actions. Add a new TouchableOpacity that opens a modal (or Alert with stringified report) showing the sorted list.
- **Recommended display:** a new TouchableOpacity labeled `t('settings.unknownPlantsReport')` that opens a simple full-screen modal (or `Alert.alert` with a multi-line message) containing the report. Format per row: `{count}× {scientificName} — last: {lastSeen}` (or with `commonName` when present).
- **Read-only:** REQUIREMENTS.md TRACK-03 says "read-only — used to prioritize future expansion phases". No edit, no clear-on-tap, no export-to-file. If the developer wants to clear, they can do it via the dev settings hot-reload reset (existing affordance).
- **i18n:** add EN + ES keys to `src/i18n/locales/{en,es}/common.json` under `settings.*` (e.g., `settings.unknownPlantsReport`, `settings.unknownPlantsReportEmpty`). Keep locale parity per CLAUDE.md.

### Cross-cutting / Claude's Discretion

- **Smoke runner:** REQUIREMENTS.md does not lock smoke coverage for Phase 12. Planner should add `scripts/smoke-phase12.mjs` modeled after `smoke-phase11.mjs` — `transpileModule` import of `unknownPlantTracker.ts` with mocked AsyncStorage, ≥5 behavior asserts (track inserts new entry; second track increments count; getReport returns sorted desc; missing AsyncStorage doesn't throw; lowercase canonicalization).
- **Mock AsyncStorage stub for smoke:** add `scripts/.tmp-phase12/async-storage.mjs` with an in-memory Map-backed implementation exposing `getItem`/`setItem` (mirrors Phase 11's `.tmp-phase11/supabase.mjs` pattern).
- **Dev-tools UI: modal vs Alert.** Either is acceptable. Alert.alert with stringified report is simpler (1 task, fits dev-only ergonomics); a Modal looks more polished but adds component scope. Recommend **Alert.alert** for v1.2 since this is dev-only and shipping fast matters.
- **Lowercase canonicalization at write time.** REQUIREMENTS.md doesn't specify. Recommend lowercase + trim because PlantNet returns mixed-case scientific names ("Monstera deliciosa" vs "monstera deliciosa") and we don't want two entries for the same species. Document this in a comment.
- **Retention policy.** No cap. The Map is small (<1KB per 100 entries) and v1.2 is testing context. Premature optimization to add LRU eviction.
- **Phase 11 carry-forward (DATA-04 finding):** because Perenual free tier paywalls `family`, the `family?` field on `UnknownPlantEntry` will often be missing in production. That's expected — the count + scientific name are the primary signal. Document this in the field comment.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project root
- `/Users/gaston/Documents/Personal/MiJardinApp/CLAUDE.md` — local-first AsyncStorage convention, i18n EN/ES parity, no test framework, single-compile-path smoke pattern (Phase 4 lock).

### Planning artifacts
- `.planning/PROJECT.md` — milestone context (v1.2 Recommendation-First Plant Guide); local-first non-negotiable.
- `.planning/REQUIREMENTS.md` §"Unknown Plant Tracking (TRACK)" — TRACK-01..03 locked requirements.
- `.planning/ROADMAP.md` §"Phase 12: Unknown Plant Tracking" — goal, success criteria, no upstream dependency.
- `.planning/phases/11-perenual-data-quality/11-VERIFICATION.md` — DATA-04 finding (Perenual free-tier paywall on family/type) — directly relevant to TRACK because tracking provides an alternative prioritization signal.

### Source files of interest
- `src/services/plantKnowledgeService.ts:468-510` (`getEnrichedPlantData`) — the call site for TRACK-02. The catalog miss check needs `getPlantById(scientificName)` from `plantDatabase.ts`.
- `src/data/plantDatabase.ts:1671` (`getPlantById`) — exports the curated-catalog lookup. Returns `undefined` when not in catalog → that's the "unknown plant" signal.
- `src/screens/SettingsScreen.tsx:421-` — existing Dev tools section pattern (`__DEV__` guard, TouchableOpacity + Alert.alert pattern). New report button slots in here.
- `src/i18n/locales/{en,es}/common.json` (search `settings.devTools` to find current dev keys) — add new `settings.unknownPlants*` keys with locale parity.

### Existing patterns to mirror
- **Service shape:** `src/services/imageService.ts` (similar narrow service module — exports a few async helpers, wraps AsyncStorage/expo-file-system).
- **AsyncStorage error handling:** existing services swallow errors silently in production (e.g., `useStorage` defaults to empty data on read failure). Mirror that — never crash the calling flow.
- **Smoke runner pattern:** `scripts/smoke-phase11.mjs` — `transpileModule` + import-isolation stubs at runtime under `.tmp-phaseN/`.
- **Phase 10 closure pattern:** requirements-derived CONTEXT.md without discuss-phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AsyncStorage` from `@react-native-async-storage/async-storage` — already imported across services (e.g., `useStorage`). Standard pattern: `getItem(key)` returns `string | null`, parse JSON manually.
- `getEnrichedPlantData()` is the single funnel for any "I want enriched data for this plant name" call — instrumenting it instruments every identification path.
- `getPlantById()` is the curated-catalog source of truth — its `undefined` return is the unambiguous "not in catalog" signal.
- `__DEV__` guard already in place at `SettingsScreen.tsx:422` — new dev-tools UI slots in there with zero structural change.

### Established Patterns
- **Versioned envelope NOT needed for `@unknown_plants`** — it's dev/instrumentation data, not user data. No migration safety net required.
- **Fire-and-forget promise pattern:** `void someAsyncFn().catch(() => {})` — used elsewhere when caller doesn't await.
- **Lowercase canonicalization:** seen in `plantKnowledgeService.ts:104` (`escapePostgrestFilter` after `.toLowerCase().trim()`). Reuse for tracker keys.
- **Smoke runner stubs at `.tmp-phaseN/`** written at runtime (gitignored) — Phase 8 / 11 pattern.

### Integration Points
- **`getEnrichedPlantData()`** — single call-site change in `plantKnowledgeService.ts`. Adds 2 lines (catalog check + fire-and-forget tracker invocation). Zero downstream caller changes.
- **`SettingsScreen` Dev tools section** — adds 1 new TouchableOpacity + 1 Alert.alert handler. No new components.
- **i18n locale files** — 2-4 new keys per locale (`unknownPlantsReport`, `unknownPlantsReportEmpty`, possibly `unknownPlantsReportTitle`).

</code_context>

<specifics>
## Specific Ideas

- "Estamos en testing, no me preocuparía por esas cosas" — apply to: silent error handling in tracker (no Sentry, no toast — just `console.warn` in `__DEV__`).
- Dev-only feature → **Alert.alert** is the right ergonomic, NOT a polished modal. Save modal scope for user-facing UI in Phase 18+.
- Phase 11 just shipped DATA-04 finding (Perenual paywall on `family`/`type`). TRACK is the cheap-and-honest alternative for prioritizing v2 — count signal beats taxonomic-derivation signal when the upstream data is gone.
- Tracker is **truly silent** — no telemetry, no cloud sync, no user-facing surface. PROJECT.md's "no third-party analytics" non-negotiable holds.

</specifics>

<deferred>
## Deferred Ideas

- **Cloud sync of `@unknown_plants`** — needs auth milestone; not in v1.2 scope.
- **User-facing "request this plant" feature** — different value proposition; rejected for v1.2 per PROJECT.md "no user-configurable follow-up interval" stance (similar minimalism principle).
- **Auto-generation of CAT plans from report top-N** — manual prioritization is fine at this scale; automation is premature.
- **LRU/retention cap for `@unknown_plants`** — defer until storage size becomes a measured problem (likely never at this volume).
- **Enriching tracked entries with Perenual response after the fact** — scope creep; the simple "track on miss with input name" path satisfies all 3 requirements.
- **Phase 11 DATA-04 follow-up (Perenual premium upgrade or provider migration)** — separate decision in v1.2 closeout; tracked in STATE.md, not Phase 12's job.

</deferred>

---

*Phase: 12-unknown-plant-tracking*
*Context gathered: 2026-05-03 (requirements-derived; no discuss-phase needed for this concrete instrumentation work)*
