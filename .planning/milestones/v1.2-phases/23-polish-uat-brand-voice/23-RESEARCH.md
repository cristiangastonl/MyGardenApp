# Phase 23: Polish — UAT Fixes + Brand Voice - Research

**Researched:** 2026-05-11
**Domain:** UAT bug fixes, accessibility (WCAG AA), brand voice (voseo), illustrated empty states, smoke-runner cross-phase regression preservation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Empty-state illustrations (POLISH-07, Area 1)
- **Static SVG/PNG only.** No Lottie. No `lottie-react-native` dependency. Keeps bundle lean (no ~200KB animation runtime) and avoids motion accessibility concerns.
- **Per-screen variants, NOT shared.** Three distinct illustrations:
  - **PlantsScreen empty state** — "planta en maceta vacía" motif (small SVG + sprout illustration with brand `colors.green` accent)
  - **CalendarScreen empty state** — "calendario sin tasks" motif (calendar with checkmarks complete)
  - **ExploreScreen empty state** — "lupa/búsqueda" motif (magnifying glass over a leaf)
- **Theme tokens only.** Fills use existing tokens: `colors.green`, `colors.bgPrimary`, `colors.textPrimary`, `colors.textSecondary` (post-darkening). NO new "muted-illustration" tokens.
- **Distinct voseo copy per screen:**
  - PlantsScreen: `"Tu jardín está esperando 🌱"` + CTA `"Agregá tu primera planta"`
  - CalendarScreen: `"No hay tareas hoy ☀️"` + sub `"Disfrutá del descanso"`
  - ExploreScreen: `"Explorá +100 plantas para tu hogar"` + CTA `"Buscar especies"`
- **Asset location:** `assets/illustrations/empty-{plants,calendar,explore}.svg` (or `.png` if SVG renderer is missing — planner picks). i18n keys live under `emptyState.*` namespace in `common.json`.

#### Voseo lint enforcement (POLISH-06, Area 2)
- **Lint scope:** `scripts/voseo-lint.mjs` over `src/i18n/locales/es/*.json` (common.json + plants.json). NOT over `.tsx` source.
- **Banned forms regex** (`\b...\b` word-bounded):
  - Castilian 2nd-person: `tienes`, `puedes`, `debes`, `quieres`, `eres`, `tú`, `tu` (as separate word — possessive contexts ok)
  - Formal 3rd-person: `usted`, `su` (as separate word)
  - Castilian imperatives that have voseo equivalents: `riega`, `saca`, `pode`, `corta`, `fertiliza`, `agrega`, `ven`, `mira`, `escucha`
  - Voseo replacements: `tenés`, `podés`, `querés`, `sos`, `vos`, `regá`, `sacá`, `podá`, `cortá`, `fertilizá`, `agregá`, `vení`, `mirá`, `escuchá`
- **Whitelist:** Test fixtures + comments + JSON keys themselves (regex anchored on string-value content, not keys).
- **Wired into smoke-phase23.cjs as STRICT sentinel** — failure blocks the gate. Also exposed as `npm run lint:voseo` for manual runs.
- **Action button copy variants — single set across surfaces:**
  - `Regá ahora 💧` (water — currently `Regar`)
  - `Sacalo al sol ☀️` (sun — currently `Sol`)
  - `Sacalo afuera 🌳` (outdoor — currently `Sacar afuera`)
  - `Fertilizá 🌱` (fertilize — currently `Fertilizar`)
- All 4 strings update at the i18n key sites (no JSX changes). Used by PlantCard mode='tasks' + DayDetailModal `<TaskButton>` invocations.

#### Wave structure (Area 3) — 5 plans
- **23-00 Wave 0:** Nyquist scaffold — `smoke-phase23.cjs` + npm script (incl. `lint:voseo`) + SKIP→PASS placeholders for POLISH-01..08 + STRICT cross-phase Phase 18+19+20+21+22 sentinels + voseo-lint script skeleton
- **23-01 Wave 1 (outdoor cluster):** POLISH-01 (outdoor task gate in `plantLogic.getTasksForDay`) + POLISH-02 (catalog `outdoor: false` for OUTDOOR_TYPE_IDS entries) + POLISH-03 (IdentificationResults.tsx category-over-PlantNet-flag conflict resolution). Single plan, 3 atomic commits.
- **23-02 Wave 2 (WCAG + voseo):** POLISH-05 (darken `colors.textSecondary` to a value passing 4.5:1 on both `bgPrimary` `#f5f0e6` AND `card` `#fffdf8`) + POLISH-06 voseo-lint impl + 4 action button copy updates
- **23-03 Wave 3 (empty states):** POLISH-07 (3 SVG/PNG illustrations + 3 empty-state JSX inserts in PlantsScreen + CalendarScreen + ExploreScreen) + POLISH-08 (negative-grep confirming no `samplePlants`/`mockPlants`/`seedPlant` arrays in first-launch path)
- **23-04 Wave 4 (manual gate):** POLISH-04 device-test (identify→diagnose flow on iOS + Android) + Block A–E 8-12-item checklist + Option A/B closure
- **POLISH-04 device-test placement:** inside 23-04 (no automated surface change — it's a verification-only requirement)
- **POLISH-08 implementation:** negative-grep in 23-03. If found, BLOCK and remove. If absent (expected), document as VERIFIED via grep sentinel.

### Claude's Discretion

- **Outdoor task gate (POLISH-01) exact insertion:** `getTasksForDay` in `src/utils/plantLogic.ts`; planner identifies canonical home for `OUTDOOR_TYPE_IDS` constant
- **POLISH-02 catalog defensive complement:** all entries in OUTDOOR_TYPE_IDS get `outdoor: false` in `plantDatabase.ts`. Two-layer gate: data + code.
- **POLISH-03 PlantNet conflict logic:** `IdentificationResults.tsx` uses catalog category when present; PlantNet `indoor` only used as fallback when catalog lookup fails.
- **POLISH-05 exact new hex value:** research computes via WCAG contrast tool. Lock is "passes 4.5:1 on both #f5f0e6 AND #fffdf8". theme.ts comment about the failure (line 13) gets removed once fixed.
- **i18n key updates for POLISH-06:** mostly value changes, no new keys (existing `t('plantCard.water')` etc. just change ES string).
- **Three-tier smoke runner** forked from `smoke-phase22.cjs` (latest pattern with Phase 21+22 STRICT cross-phase regression preserved).

### Deferred Ideas (OUT OF SCOPE)

- **Lottie/animated illustrations** — out of scope; static SVG/PNG only
- **First-run sample-plant pre-loading** — explicitly rejected (POLISH-08 lock); avoid "test event" syndrome
- **Achievement / onboarding tutorial illustrations** — out of scope
- **Per-locale illustration variants** (e.g., different cultural motifs) — out of scope; single illustration set works for both EN and ES
- **Voseo lint over `.tsx` inline strings** — CLAUDE.md already mandates `t()` only; hardcoded strings caught elsewhere
- **WCAG AAA contrast (~7:1)** — AA only in v1.2; AAA polish would require multiple token darkenings
- **New theme tokens for illustrations** — reuse existing tokens
- **Empty-state CTAs that navigate to specific screens** (e.g., Explore CTA opens PlantIdentifier) — defer; copy-only CTAs in v1.2
- **Animated transition into/out of empty state** — out of scope
- **A/B testing of empty-state copy** — out of scope; ship single copy
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POLISH-01 | Outdoor task gate — `getTasksForDay` in `plantLogic.ts` skips `'outdoor'` task emission when `plant.typeId ∈ OUTDOOR_TYPE_IDS` | §Finding 1 (exact emit site `plantLogic.ts:81-83`); §Finding 11 (OUTDOOR_TYPE_IDS shape & home); §Pitfall 1 |
| POLISH-02 | Outdoor entries' `outdoor: false` set in catalog as defensive complement to POLISH-01 (data + code gate, both layers) | §Finding 2 (45 entries to flip — 28 exterior + 7 frutales + 10 outdoor-aromaticas); §Pitfall 2 |
| POLISH-03 | PlantNet identification result `typeId` derivation in `IdentificationResults.tsx` honors catalog category over PlantNet's `indoor` flag when conflict exists | §Finding 3 (current shape: `selectedPlant?.indoor === false ? 'exterior' : 'interior'` at line 53/100); §Finding 4 (PlantNet flow + `IdentifiedPlant.category` already exists) |
| POLISH-04 | Verify identification entry points (onboarding card + PlantsScreen FAB) — both must open `PlantIdentifierModal` AND keep identify→diagnose chain functional via `onDiagnoseAfterIdentify` after Phase 7 changes. Device-test both flows on iOS + Android | §Pattern 6 (Phase 22-03 manual-gate Option B precedent); §Validation Architecture (manual-only test) |
| POLISH-05 | `colors.textSecondary` darkened from `#8a7e6b` to a value passing WCAG AA (~4.5:1) on both `bgPrimary` AND `card`; audit usages | §Finding 6 (computed contrast table; `#6f6450` and `#6a604f` both pass AA on both backgrounds with margin); §Finding 7 (current value computed contrasts: 3.50 on bgPrimary, 3.91 on card — both fail) |
| POLISH-06 | All action buttons updated with voseo + emoji microcopy; audit `t()` keys for action verbs; locale parity preserved | §Finding 8 (exact i18n keys at `plantCard.water/sunLabel/outdoor/fertilize` + `dayDetail.taskWater/taskSun/taskOutdoor/taskFertilize` + `plantDetailModal.water/fertilize`); §Finding 9 (existing voseo violations in es/common.json need clean-up); §Pitfall 3 (`plantLogic.ts` hardcoded ES strings at lines 74, 79, 82) |
| POLISH-07 | Empty states in PlantsScreen, ExploreScreen, CalendarScreen are illustrated (Lottie or SVG) with motivating voseo copy | §Finding 5 (PlantsScreen + ExploreScreen have EmptyState components; CalendarScreen has NONE); §Finding 10 (`react-native-svg` NOT in deps → PNG path is simpler); §Pattern 4 (PNG asset structure) |
| POLISH-08 | NO sample plant pre-loaded on first launch — first-run empty-state UX handled exclusively by POLISH-07 | §Finding 12 (negative-grep result: 0 violations in `src/` — `useStorage.tsx` has NO sample/seed/demoPlant arrays; expected PASS at runtime) |
</phase_requirements>

## Summary

Phase 23 closes 8 POLISH-* requirements: four UAT bug fixes (outdoor task gate, PlantNet category-conflict, identify→diagnose verification, WCAG contrast), brand-voice enforcement (voseo + emoji action button microcopy with a STRICT lint sentinel), illustrated empty states (per-screen distinct, static PNG/SVG, voseo copy), and a negative-grep confirming no sample-plant pre-loading. The phase is **polish, not new features** — five plans grouped by domain following the established three-tier smoke-runner pattern (Phase 22 fork).

All 8 requirements have HIGH-confidence research backing. The exact code surfaces are identified:
- POLISH-01: emit site at `src/utils/plantLogic.ts:81-83` (the existing `outdoorDays.includes(day.getDay())` branch); `OUTDOOR_TYPE_IDS` lands in `plantLogic.ts` as a `Set<string>` constant alongside the gate
- POLISH-02: 45 entries to flip (28 exterior + 7 frutales + 10 outdoor-aromaticas) in `src/data/plantDatabase.ts`
- POLISH-03: `IdentificationResults.tsx` lines 53, 100 (typeId derivation); `IdentifiedPlant.category` already populated at `plantIdentification.ts:337` so the rewire is mechanical
- POLISH-05: `#6f6450` is the canonical new value — 5.12:1 on `bgPrimary` and 5.72:1 on `card`, with comfortable AA margins; alternative `#6a604f` (already used as `textMuted`) also passes
- POLISH-06: four `t()` keys at `plantCard.*`, four sibling keys at `dayDetail.task*`, plus three hardcoded-ES strings at `plantLogic.ts:74,79,82`; **9 pre-existing voseo violations in `es/common.json` must be cleaned up as part of Plan 23-02 to make the STRICT lint sentinel green**
- POLISH-07: PNG path preferred over SVG (no `react-native-svg` dep installed; PNG renders via built-in `<Image>` with zero new deps)
- POLISH-08: negative-grep returns 0 in `src/` — VERIFIED as PASS at Wave 0 baseline

**Primary recommendation:** Fork `smoke-phase22.cjs` verbatim, layer 8 POLISH-* SKIP→PASS placeholders + 1 STRICT voseo-lint sentinel + preserved Phase 18-22 cross-phase regression block, and execute the 5-plan wave structure. Plan 23-01 is the bug-fix anchor (3 atomic commits); Plan 23-02 is the brand-voice + WCAG cluster; Plan 23-03 is the empty-state visual layer; Plan 23-04 is the closing manual gate (POLISH-04 device test).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native` (`<Image>`) | 0.81.5 | Render PNG illustrations (POLISH-07) | Zero new deps; supports PNG/JPG via `require()` |
| `react-i18next` | 16.5.4 | i18n key rewires for POLISH-06 voseo copy | Already wired across all screens; no new install |
| `react-native` (StyleSheet color tokens) | 0.81.5 | `colors.textSecondary` darkening for POLISH-05 | Native API; theme.ts is the single source of truth |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node `fs` (CJS smoke runner) | built-in | `smoke-phase23.cjs` + `voseo-lint.mjs` harness | Established Phase 18-22 pattern; no test framework needed |
| `node:fs` `walkSrcForStreakTokens`-style walker | built-in | Voseo lint walks `src/i18n/locales/es/*.json` | Verbatim Phase 22 STRICT negative-grep precedent |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PNG illustrations | `react-native-svg` + SVG inline | SVG is crisper at all DPRs but adds a native dependency rebuild; PNG @1x/@2x/@3x is zero-install and renders via `<Image source={require(...)} />`. **CONTEXT.md leaves the choice to planner**; PNG is the lower-risk default. |
| Custom voseo-lint regex | ESLint plugin (e.g., `eslint-plugin-i18next`) | Custom mjs script matches the Phase 22 STRICT negative-grep pattern (no new dep), runs at smoke-time, integrates as `npm run lint:voseo`. ESLint would require a config rewrite and add a parsing dependency. |
| Darken textSecondary | Add a new `textSecondaryAA` token | Adds token sprawl; CONTEXT.md locks "no new theme tokens". Single-value swap inside the existing token is cleaner. |
| OUTDOOR_TYPE_IDS as Set | typeof check via `dbEntry.outdoor === false` only | Set is faster (O(1)), explicit, and survives missing catalog entries (defense-in-depth); the boolean-only path fails for custom plants without `databaseId`. |

**Installation:**

```bash
# No new dependencies. Phase 23 is configuration + assets only.
# Optional: react-native-svg if planner chooses SVG path — not needed for PNG.
# npx expo install react-native-svg
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── data/
│   └── plantDatabase.ts        # POLISH-02: flip outdoor:true→false on 45 entries
├── utils/
│   └── plantLogic.ts           # POLISH-01: OUTDOOR_TYPE_IDS + outdoor task gate
├── components/
│   └── PlantIdentifier/
│       └── IdentificationResults.tsx  # POLISH-03: prefer category over indoor flag
├── theme.ts                    # POLISH-05: textSecondary #8a7e6b → #6f6450; remove TODO comment line 13
├── i18n/locales/
│   ├── en/common.json          # POLISH-06: EN action button copy + emptyState namespace
│   └── es/common.json          # POLISH-06: ES voseo + emoji copy + emptyState namespace + 9 voseo violation fixes
├── screens/
│   ├── PlantsScreen.tsx        # POLISH-07: EmptyState illustration import
│   ├── CalendarScreen.tsx      # POLISH-07: ADD EmptyState (none currently)
│   └── ExploreScreen.tsx       # POLISH-07: EmptyState illustration import
├── hooks/
│   └── useStorage.tsx          # POLISH-08: negative-grep target (no changes expected)
assets/
└── illustrations/              # NEW directory
    ├── empty-plants.png        # @1x/@2x/@3x or single 3x asset
    ├── empty-calendar.png
    └── empty-explore.png
scripts/
├── smoke-phase23.cjs           # NEW: fork of smoke-phase22.cjs
└── voseo-lint.mjs              # NEW: STRICT lint over es/*.json
```

### Pattern 1: Two-Layer Outdoor Gate (POLISH-01 + POLISH-02)

**What:** Defense-in-depth — code layer (POLISH-01) + data layer (POLISH-02).

**When to use:** Bug fixes where a single layer could regress in future phases.

**Example:**

```typescript
// src/utils/plantLogic.ts — POLISH-01 gate (NEW)

// Plants whose typeId implies they LIVE outdoors permanently. The "Sacar afuera" task
// (take indoor plant out for occasional sun) is nonsensical for these. POLISH-01 gate.
// This Set is the CODE layer of a two-layer defense (data layer = catalog outdoor:false).
const OUTDOOR_TYPE_IDS = new Set<string>(['exterior', 'frutales']);
// NOTE: 'aromaticas' and 'huerta' are mixed (some indoor herbs vs. outdoor garden plot);
// the catalog data layer (POLISH-02) decides per-entry via `outdoor: false`.

export function getTasksForDay(plants: Plant[], day: Date, season: WaterSeason): Task[] {
  const tasks: Task[] = [];
  plants.forEach(p => {
    // ... water/sun emit unchanged ...

    // POLISH-01: skip outdoor emission for plants that live outdoors permanently.
    // Two-layer defense — catalog `outdoor:false` ALSO prevents `outdoorDays` from
    // being initialized (see OnboardingScreen:132, ExploreScreen:69, IdentifierModal:112).
    if (
      p.outdoorDays.includes(day.getDay()) &&
      !OUTDOOR_TYPE_IDS.has(p.typeId)
    ) {
      tasks.push({ type: "outdoor", icon: "🌤️", label: `Sacar ${p.name}`, plantId: p.id });
    }

    // ... fertilize emit unchanged ...
  });
  return tasks;
}
```

```typescript
// src/data/plantDatabase.ts — POLISH-02 (45 entries)
// BEFORE
{ id: 'tomate-cherry', category: 'huerta', outdoor: true, /* ... */ }

// AFTER
{ id: 'tomate-cherry', category: 'huerta', outdoor: false, /* ... */ }
```

### Pattern 2: Catalog-Category Conflict Resolution (POLISH-03)

**What:** When PlantNet returns `indoor: true/false` AND the species exists in the catalog with a known `category`, prefer the catalog category.

**When to use:** Cross-source data reconciliation where one source has known false positives.

**Example:**

```tsx
// src/components/PlantIdentifier/IdentificationResults.tsx (CURRENT - lines 53, 100)
const typeIdForPicker = selectedPlant?.indoor === false ? 'exterior' : 'interior';
// ... <LightLevelPicker typeId={plant.indoor === false ? 'exterior' : 'interior'} />

// AFTER POLISH-03
// `IdentifiedPlant.category` already populated by convertPlantNetResult() in
// plantIdentification.ts:337 (catalog hit) or :364 (generic fallback).
// Prefer catalog category; fall back to PlantNet `indoor` flag when catalog category absent.
function resolveTypeIdForPicker(plant: IdentifiedPlant | null): string {
  if (plant?.category) return plant.category;  // catalog wins
  if (plant?.indoor === false) return 'exterior';
  return 'interior';
}
const typeIdForPicker = resolveTypeIdForPicker(selectedPlant);
// ... <LightLevelPicker typeId={resolveTypeIdForPicker(plant)} />
```

### Pattern 3: STRICT Voseo Lint Sentinel (POLISH-06)

**What:** A Node mjs script that walks `src/i18n/locales/es/*.json`, extracts string values, and fails on any banned Castilian/formal form match.

**When to use:** Brand-voice discipline lock-in at smoke-time.

**Example:**

```javascript
// scripts/voseo-lint.mjs (NEW)
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const ES_DIR = path.resolve(ROOT, 'src/i18n/locales/es');

// Banned forms — word-bounded. The whitelist 'tu' as POSSESSIVE adjective requires
// context-aware regex (\btu\s+\w+ for possessive; \btú\b for pronoun).
const BANNED = [
  // Castilian 2nd-person verbs (tuteo)
  /\btienes\b/i, /\bpuedes\b/i, /\bdebes\b/i, /\bquieres\b/i, /\beres\b/i,
  // Castilian imperatives (have voseo equivalents)
  /\briega\b/i, /\bsaca\b/i, /\bpode\b/i, /\bcorta\b/i,
  /\bfertiliza\b/i, /\bagrega\b/i, /\bven\b/i, /\bmira\b/i, /\bescucha\b/i,
  /\belige\b/i, /\busa\b/i, /\btoca\b/i, /\bmueve\b/i, /\bhaz\b/i,
  // Pronouns (NOT possessive 'tu' before noun — see whitelist)
  /\btú\b/i,
  // Formal 3rd-person
  /\busted\b/i, /\bustedes\b/i,
];

let fail = 0;
const violations = [];

function walkValues(obj, keyPath) {
  if (typeof obj === 'string') {
    for (const re of BANNED) {
      const m = obj.match(re);
      if (m) {
        violations.push(`${keyPath}: "${obj.slice(0, 70)}" — banned form: ${m[0]}`);
        fail++;
      }
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      walkValues(v, keyPath ? `${keyPath}.${k}` : k);
    }
  }
}

for (const f of fs.readdirSync(ES_DIR)) {
  if (!f.endsWith('.json')) continue;
  const full = path.join(ES_DIR, f);
  let json;
  try { json = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (e) {
    console.error(`Parse error in ${f}: ${e.message}`); process.exit(2);
  }
  walkValues(json, f.replace('.json', ''));
}

if (fail > 0) {
  console.error(`voseo-lint: ${fail} violation(s):`);
  violations.forEach(v => console.error(`  ${v}`));
  process.exit(1);
}
console.log('voseo-lint: PASS');
process.exit(0);
```

```bash
# package.json scripts addition
"lint:voseo": "node scripts/voseo-lint.mjs"
```

### Pattern 4: PNG Asset Render Path (POLISH-07)

**What:** PNG illustration loaded via `require()` and rendered via React Native's built-in `<Image>` component. No new dependencies.

**When to use:** Static illustrations when SVG is overkill or `react-native-svg` is unavailable.

**Example:**

```tsx
// src/screens/PlantsScreen.tsx — POLISH-07 EmptyState
import { Image } from 'react-native';

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Image
      source={require('../../assets/illustrations/empty-plants.png')}
      style={styles.emptyIllustration}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
    <Text style={styles.emptyTitle}>{t('emptyState.plants.title')}</Text>
    <Text style={styles.emptyText}>{t('emptyState.plants.cta')}</Text>
  </View>
);

// styles
emptyIllustration: { width: 180, height: 180, marginBottom: spacing.lg },
```

**Asset structure** (React Native auto-picks DPR variant):

```
assets/illustrations/
├── empty-plants.png       # ~600x600 @ 3x natively
├── empty-plants@2x.png    # optional
├── empty-plants@3x.png    # optional
├── empty-calendar.png
└── empty-explore.png
```

Single high-res `@3x` source is acceptable for simple illustrations — RN will downscale.

### Pattern 5: Three-Tier Smoke Runner Fork (Plan 23-00)

**What:** Verbatim fork of `smoke-phase22.cjs` with three tiers preserved + POLISH-* SKIP→PASS layer + STRICT voseo block.

**When to use:** Every Phase Wave 0 since Phase 19.

**Three-tier structure:**

```javascript
// scripts/smoke-phase23.cjs structure (mirrors smoke-phase22.cjs)
// TIER 1: W0 scaffold — STRICT PASS (files MUST exist after Wave 0)
//   - smoke-phase23.cjs exists
//   - npm script "smoke:phase23" exists
//   - npm script "lint:voseo" exists
//   - .gitignore has scripts/.tmp-phase23/
//   - i18n: emptyState.{plants,calendar,explore}.{title,cta} keys exist EN+ES
//
// TIER 2: POLISH-01..08 SKIP→PASS placeholders
//   - POLISH-01: /const OUTDOOR_TYPE_IDS\s*=\s*new Set/.test(plantLogicSrc)
//   - POLISH-02: 45 entries with category∈{exterior,frutales,aromaticas-outdoor} have outdoor:false
//   - POLISH-03: /function resolveTypeIdForPicker/.test(identResultsSrc) || /selectedPlant\?\.category/.test(...)
//   - POLISH-05: colors.textSecondary string match in theme.ts NOT equal to '#8a7e6b'
//   - POLISH-06: 4 action button strings match voseo+emoji literals in es/common.json
//   - POLISH-07: 3 illustration files exist in assets/illustrations/
//   - POLISH-08: STRICT negative-grep over src/ for sample|seed|demoPlant ARRAYS (not strings)
//
// TIER 2.5: STRICT voseo-lint sentinel (NEVER SKIP after Plan 23-02 lands the script)
//   - Spawn scripts/voseo-lint.mjs and assert exit 0
//
// TIER 3: STRICT cross-phase regression (NEVER SKIP)
//   - Phase 18 (PlantCard mood-emoji, Toast.tsx, Gesture.Pan)
//   - Phase 19 (PetToxicityBadge, MascotasContent, check-i18n-keys symptoms)
//   - Phase 20 (fertilize emit + scheduler filter + FertilizeCard + checkScript fertilizer)
//   - Phase 21 (AppData.journals, journalService, ModalSectionId diario, JournalSection)
//   - Phase 22 (waterPlant/sunPlant/outdoorPlant useStorage actions + triggerHaptic + gamificationToastVisible 3-screen wiring)
```

### Anti-Patterns to Avoid

- **Hand-rolling first-launch sample plants:** POLISH-08 EXPLICITLY rejects this. Empty state is the UX; do not add `samplePlants: Plant[]`, `seedData`, or `firstLaunchPlants` to `useStorage.tsx`.
- **Per-locale illustration variants:** out of scope per CONTEXT.md.
- **Lottie animations:** explicit lock; static PNG/SVG only.
- **New theme tokens:** Reuse existing tokens; POLISH-05 darkens IN-PLACE.
- **Voseo lint over .tsx files:** CLAUDE.md already mandates `t()` only — hardcoded strings caught elsewhere. Lint scope is `es/*.json` ONLY.
- **Ignoring 9 pre-existing voseo violations in es/common.json:** They WILL break the STRICT lint sentinel. Plan 23-02 MUST fix them inline (see §Finding 9).
- **Hardcoded "Regar/Sol/Sacar" in plantLogic.ts:** lines 74/79/82 currently bypass i18n. POLISH-06 brand-voice fix should route these through `i18n.t('tasks.water'/'sun'/'outdoor', {name})` for consistency with `tasks.fertilize`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voseo enforcement | Inline `grep | head` chain in CI | `scripts/voseo-lint.mjs` (this phase) | Word-bounded regex with whitelist support; integrates with smoke harness |
| WCAG contrast computation | Manual `Math.pow` formula in source | Pre-computed table (this RESEARCH.md §Finding 6) | Pure constant — no runtime cost. Computed once, stored as theme token. |
| EmptyState rendering | Conditional `if (plants.length === 0)` blocks scattered across FlatList renderers | `<FlatList ListEmptyComponent={EmptyState}>` (existing pattern at PlantsScreen:383, ExploreScreen:184) | RN built-in; no scrim flash on data load |
| Sample-plant first-launch UX | `samplePlants: Plant[] = [...]` constant | Illustrated empty state with strong CTA (POLISH-07) | Sample plants confuse users about plant origin ("test event syndrome") |
| Cross-source category resolution | `if (indoor) typeId='interior' else if (category) typeId=category` ladder | Three-tier ladder: catalog category → PlantNet indoor → default `'interior'` (§Pattern 2) | Explicit precedence; testable as a single function |

**Key insight:** Phase 23 is **discipline + small surgical fixes**, not infrastructure. Every fix targets a known UAT bug or a measurable accessibility/brand-voice metric. No new patterns — just better enforcement of existing ones (voseo lint, WCAG-AA token, catalog-category precedence).

## Common Pitfalls

### Pitfall 1: OUTDOOR_TYPE_IDS scope mismatch (POLISH-01)

**What goes wrong:** Naively setting `OUTDOOR_TYPE_IDS = new Set(['exterior', 'frutales', 'aromaticas', 'huerta'])` over-fires the gate. Aromáticas have a mix (3 indoor `outdoor:false` entries: stevia, eneldo, salvia-officinalis per Phase 17 lock); huerta varies (kitchen-window basil vs. outdoor tomato).

**Why it happens:** typeId is one of 6 categories; only TWO (`exterior`, `frutales`) are 100% outdoor by definition.

**How to avoid:** Use `OUTDOOR_TYPE_IDS = new Set(['exterior', 'frutales'])` ONLY. Let the catalog data layer (POLISH-02) handle per-entry outdoor flagging for aromáticas/huerta. The two layers compose:
- `OUTDOOR_TYPE_IDS.has(p.typeId)` → CODE layer (covers exterior + frutales)
- `dbEntry.outdoor === false` (via POLISH-02 catalog flip) → DATA layer (covers outdoor aromáticas + huerta)
- The OnboardingScreen/ExploreScreen/IdentifierModal init code (`outdoorDays: dbEntry.outdoor ? [0,6] : []`) becomes a third-layer barrier.

**Warning signs:** A stevia plant emitting "Sacar afuera" tasks would mean the data layer failed; an exterior rose plant emitting one would mean the code layer failed.

### Pitfall 2: POLISH-02 boolean semantics (NOT 0/1)

**What goes wrong:** CONTEXT.md writes "outdoor: 0" — but the TypeScript schema is `outdoor: boolean`. Misinterpreting "0" as numeric `0` would be a type error.

**Why it happens:** CONTEXT.md uses informal shorthand. The actual data is `outdoor: true | false`.

**How to avoid:** All POLISH-02 mutations are `outdoor: true` → `outdoor: false` literal replacements. The 45 entries enumerated in §Finding 2.

**Warning signs:** `npx tsc --noEmit` failures on `plantDatabase.ts`.

### Pitfall 3: Hardcoded ES strings in plantLogic.ts (POLISH-06)

**What goes wrong:** `plantLogic.ts:74`, `:79`, `:82` use template literals `Regar ${p.name}`, `Sol para ${p.name} (...h)`, `Sacar ${p.name}` — NOT `i18n.t()`. The voseo-lint over `es/*.json` won't catch these (out of scope per CONTEXT.md), and EN users see Spanish strings.

**Why it happens:** Pre-i18n legacy from Phase 1-3. The `tasks.fertilize` label at line 95 already uses `i18n.t('tasks.fertilize', {name})` — but water/sun/outdoor were never migrated.

**How to avoid:** Plan 23-02 (voseo + WCAG cluster) MUST migrate the three labels to `i18n.t('tasks.water', {name})`, `t('tasks.sun', {name, hours: p.sunHours})`, `t('tasks.outdoor', {name})`. Add the 3 keys to `tasks.*` namespace EN+ES with voseo+emoji values:
- ES: `"water": "Regá {{name}}"`, `"sun": "Sol para {{name}} ({{hours}}h)"`, `"outdoor": "Sacá {{name}}"`
- EN: `"water": "Water {{name}}"`, `"sun": "Sun for {{name}} ({{hours}}h)"`, `"outdoor": "Take {{name}} outside"`

**Warning signs:** `npm run check:i18n-keys` flags missing keys; smoke-phase23 voseo sentinel passes BUT the visible task labels still say "Regar" not "Regá".

### Pitfall 4: 'tu' as banned word breaks legitimate possessive use (POLISH-06 lint)

**What goes wrong:** Naive `\btu\b` regex flags legitimate Spanish possessive ("tu jardín está esperando 🌱" — the locked PlantsScreen empty-state copy itself!).

**Why it happens:** Spanish possessive `tu` (your) is identical in form to truncated `tú` (you, pronoun) — only the accent disambiguates.

**How to avoid:** Lint regex differentiates: ban `\btú\b` (accented) only as pronoun. The unaccented `tu` as possessive is legitimate and remains unblocked. Add JSDoc above the BANNED array clarifying the discrimination.

**Warning signs:** Empty-state copy "Tu jardín está esperando 🌱" fails lint → false positive; the BANNED regex needs the accent disambiguation.

### Pitfall 5: WCAG large-text exception bypass (POLISH-05)

**What goes wrong:** WCAG AA allows 3:1 for "large text" (≥18pt or ≥14pt bold). Some `textSecondary` use sites might be large enough to pass at 3:1 even at `#8a7e6b`. Naively darkening all uses isn't a regression — but knowing which call sites are large helps document the scope.

**Why it happens:** Component-level text sizing varies (10-18pt). The token is applied uniformly.

**How to avoid:** Darkening to `#6f6450` (5.12:1 on `bgPrimary`) provides 4.5:1+ for ALL sizes — strictly better. No call-site audit needed for the darken itself; visual smoke-test in 23-04 device test verifies legibility didn't degrade.

**Warning signs:** Visual review on Pixel 6 / iPhone 14 in 23-04 shows ANY textSecondary use harder to read post-change — unlikely given the contrast IMPROVED.

### Pitfall 6: SVG render without `react-native-svg` (POLISH-07)

**What goes wrong:** Attempting `<Svg><Path .../></Svg>` JSX without installing `react-native-svg` produces a runtime crash on Android/iOS.

**Why it happens:** RN does NOT bundle SVG — it requires the `react-native-svg` package (peer of `expo` for managed workflow installs).

**How to avoid:** Use PNG path (CONTEXT.md leaves the choice to planner; PNG is zero-install). If SVG required later, run `npx expo install react-native-svg` and rebuild dev client.

**Warning signs:** `Cannot find native module 'RNSVGSvgViewManager'` on app boot after Plan 23-03 ships SVG JSX.

### Pitfall 7: CalendarScreen has NO existing EmptyState (POLISH-07)

**What goes wrong:** Planner assumes all 3 screens have an `EmptyState` JSX block to swap. PlantsScreen has one (lines 365-373), ExploreScreen has one (lines 164-172), but **CalendarScreen has NONE**. Calendar always shows a month grid (`<MonthCalendar>`) regardless of whether plants exist.

**Why it happens:** Calendar shows note/reminder/task aggregations PER DAY; the "empty" concept differs from list screens.

**How to avoid:** For CalendarScreen, the "empty state" lands when `plants.length === 0` — show illustration ABOVE the month grid (or replace the grid entirely?). Planner picks. CONTEXT.md copy `"No hay tareas hoy ☀️"` suggests SHOW when the SELECTED day has no tasks (or no plants). Recommend: render below the month grid only when `plants.length === 0`, mirroring the no-plants state of the other two screens. Edge case: user has plants but no tasks today → CalendarScreen does NOT render the empty illustration (the DayDetailModal already shows `dayDetail.noTasksScheduled`).

**Warning signs:** Smoke-phase23 placeholder `/empty-calendar\.png/.test(calendarScreenSrc)` would fail — easy to spot.

### Pitfall 8: 9 pre-existing voseo violations in es/common.json (POLISH-06 lint blocker)

**What goes wrong:** STRICT lint sentinel goes RED on Plan 23-02 land if existing violations are not also fixed. The violations exist BEFORE this phase touched the file.

**Why it happens:** Phase 23 is the first phase to introduce automated voseo enforcement; prior phases used informal pre-commit greps.

**How to avoid:** Plan 23-02 fixes ALL 9 violations atomically alongside the lint impl. See §Finding 9 for the exact list. The lint sentinel goes green at commit time.

**Warning signs:** First green smoke-phase23 run reveals existing-debt violations — planner pre-fixes in Plan 23-02 Task 2.

## Code Examples

Verified patterns from the existing codebase + Phase 22 fork.

### Example 1: POLISH-01 Outdoor Gate Insertion

```typescript
// src/utils/plantLogic.ts — diff (after import block, before getSeasonalInterval)

// ─── POLISH-01 (Phase 23) ───
/**
 * Plants whose typeId implies they LIVE outdoors permanently. The "outdoor" task
 * (take indoor plant out for occasional sun) is nonsensical for these. Code-layer
 * defense; data-layer defense is catalog `outdoor:false` set in POLISH-02.
 */
const OUTDOOR_TYPE_IDS: ReadonlySet<string> = new Set(['exterior', 'frutales']);

// ... existing getSeasonalInterval, getNextWaterDate ...

export function getTasksForDay(plants: Plant[], day: Date, season: WaterSeason): Task[] {
  const tasks: Task[] = [];
  plants.forEach(p => {
    // ... water/sun emit unchanged ...

-   if (p.outdoorDays.includes(day.getDay())) {
+   // POLISH-01: skip outdoor emission for plants that already live outdoors.
+   if (
+     p.outdoorDays.includes(day.getDay()) &&
+     !OUTDOOR_TYPE_IDS.has(p.typeId)
+   ) {
      tasks.push({ type: "outdoor", icon: "🌤️", label: `Sacar ${p.name}`, plantId: p.id });
    }

    // ... fertilize emit unchanged ...
  });
  return tasks;
}
```

### Example 2: POLISH-02 Catalog Bulk Edit (45 entries)

```typescript
// src/data/plantDatabase.ts — per-entry edit

// BEFORE (45 entries)
{
  id: 'tomate-cherry',
  category: 'huerta',          // or 'exterior' or 'frutales' or outdoor 'aromaticas'
  // ...
  outdoor: true,
  // ...
}

// AFTER
{
  id: 'tomate-cherry',
  category: 'huerta',
  // ...
  outdoor: false,              // POLISH-02 — defensive complement; this plant lives outdoors permanently
  // ...
}
```

Use a one-shot script if the planner prefers (or sed):

```bash
# Sample diff command (planner discretion)
# scripts/.tmp-phase23/apply-polish-02.mjs walks PLANT_DATABASE and flips outdoor:true→false
# for entries where category ∈ {'exterior', 'frutales'} OR id ∈ OUTDOOR_AROMATICAS_IDS
```

### Example 3: POLISH-03 IdentificationResults.tsx Rewire

```tsx
// src/components/PlantIdentifier/IdentificationResults.tsx — diff

+ /**
+  * POLISH-03 (Phase 23) — Resolves the typeId for LightLevelPicker honoring
+  * catalog category over PlantNet's `indoor` boolean. Catalog wins because
+  * PlantNet often mis-flags species (e.g., tomato as "indoor: true").
+  */
+ function resolveTypeIdForPicker(plant: IdentifiedPlant | null): string {
+   if (plant?.category) return plant.category;       // catalog wins
+   if (plant?.indoor === false) return 'exterior';   // PlantNet flag fallback
+   return 'interior';                                // safe default
+ }

  export function IdentificationResults({ /* ... */ }: IdentificationResultsProps) {
    // ...
-   const typeIdForPicker = selectedPlant?.indoor === false ? 'exterior' : 'interior';
+   const typeIdForPicker = resolveTypeIdForPicker(selectedPlant);

    // ... Case A (single result):
-       <LightLevelPicker typeId={plant.indoor === false ? 'exterior' : 'interior'} ... />
+       <LightLevelPicker typeId={resolveTypeIdForPicker(plant)} ... />

    // ... Case B (multiple results):
        <LightLevelPicker typeId={typeIdForPicker} ... />
  }
```

### Example 4: POLISH-05 theme.ts Token Darken

```typescript
// src/theme.ts — diff at lines 9-14

  // Text
  textPrimary: '#2d3a2e',
- textSecondary: '#8a7e6b',
- // textMuted: darkened from #a89e8b → #6a604f to meet WCAG AA contrast on bgPrimary (#f5f0e6) and card (#fffdf8). Was ~3.1:1 → now ~4.9:1.
- // NOTE (v1.2): textSecondary #8a7e6b also fails AA on bgPrimary (~3.1:1). Audit + fix in v1.2 polish phase.
+ textSecondary: '#6f6450',  // POLISH-05 (Phase 23) — darkened from #8a7e6b (3.50:1 fail AA) to #6f6450 (5.12:1 on bgPrimary, 5.72:1 on card — both pass AA).
+ // textMuted: darkened from #a89e8b → #6a604f to meet WCAG AA contrast on bgPrimary (#f5f0e6) and card (#fffdf8). Was ~3.1:1 → now ~4.9:1.
  textMuted: '#6a604f',
```

### Example 5: POLISH-06 i18n Action Button Copy

```json
// src/i18n/locales/es/common.json — diff

  "plantCard": {
-   "water": "Regar",
+   "water": "Regá ahora 💧",
    "sunLabel": "Sol ({{hours}}h)",
-   "outdoor": "Sacar afuera",
+   "outdoor": "Sacalo afuera 🌳",
-   "fertilize": "Fertilizar",
+   "fertilize": "Fertilizá 🌱",
    // ...
  },
  // also: plantDetailModal.water, plantDetailModal.fertilize, dayDetail.taskWater/taskSun/taskOutdoor/taskFertilize
```

```json
// src/i18n/locales/en/common.json — diff (NO emoji change needed; voseo is ES-only)

  "plantCard": {
    "water": "Water now 💧",
    "sunLabel": "Sun ({{hours}}h)",
    "outdoor": "Put outside 🌳",
    "fertilize": "Fertilize 🌱",
  },
```

**Sun label "Sol ☀️":** CONTEXT.md locks "Sacalo al sol ☀️" (water+sun semantics merged into single voseo verb). Re-reading: the sun action button currently says `"Sol ({{hours}}h)"` (template literal with `{{hours}}` interpolation). The locked copy "Sacalo al sol ☀️" replaces it but DROPS the `{{hours}}` interpolation. **Planner should confirm interpolation strategy** — likely append `"Sacalo al sol ☀️ ({{hours}}h)"` OR remove the hours hint from the button and surface hours elsewhere. (Open question — flag in planner discussion.)

### Example 6: POLISH-07 EmptyState (PNG Path)

```tsx
// src/screens/PlantsScreen.tsx — diff at line 365

  const EmptyState = () => (
    <View style={styles.emptyState}>
-     <Text style={styles.emptyIcon}>🌿</Text>
+     <Image
+       source={require('../../assets/illustrations/empty-plants.png')}
+       style={styles.emptyIllustration}
+       resizeMode="contain"
+       accessibilityIgnoresInvertColors
+     />
-     <Text style={styles.emptyTitle}>{t('plants.emptyTitle')}</Text>
+     <Text style={styles.emptyTitle}>{t('emptyState.plants.title')}</Text>
      <Text style={styles.emptyText}>
-       {t('plants.emptyText')}
+       {t('emptyState.plants.cta')}
      </Text>
    </View>
  );

  // ... styles:
+ emptyIllustration: { width: 180, height: 180, marginBottom: spacing.lg },
```

```json
// src/i18n/locales/es/common.json — NEW emptyState namespace
{
  "emptyState": {
    "plants": {
      "title": "Tu jardín está esperando 🌱",
      "cta": "Agregá tu primera planta"
    },
    "calendar": {
      "title": "No hay tareas hoy ☀️",
      "cta": "Disfrutá del descanso"
    },
    "explore": {
      "title": "Explorá +100 plantas para tu hogar",
      "cta": "Buscar especies"
    }
  }
}
```

### Example 7: POLISH-08 Negative-Grep Sentinel

```javascript
// scripts/smoke-phase23.cjs — POLISH-08 STRICT negative-grep (NEVER SKIP)

const SAMPLE_PLANT_RE = /\b(samplePlants|mockPlants|seedPlants|demoPlants|examplePlants|firstLaunchPlants)\b/;
const samplePlantViolations = [];

function walkSrcForSamplePlantArrays(dir) {
  // ... mirrors walkSrcForStreakTokens from smoke-phase22.cjs lines 215-240
}
walkSrcForSamplePlantArrays(path.resolve(ROOT, 'src'));
assert(samplePlantViolations.length === 0, 'POLISH-08.negative-grep.no-sample-plant-arrays');
```

## Findings

### Finding 1: `getTasksForDay` outdoor emit branch location

**Location:** `src/utils/plantLogic.ts:81-83` (Phase 5 / Phase 20 precedent code).

```typescript
if (p.outdoorDays.includes(day.getDay())) {
  tasks.push({ type: "outdoor", icon: "🌤️", label: `Sacar ${p.name}`, plantId: p.id });
}
```

Insertion point: AND the existing condition with `!OUTDOOR_TYPE_IDS.has(p.typeId)`. The `OUTDOOR_TYPE_IDS` constant should be defined at the top of `plantLogic.ts` (module-private, not exported) — co-located with the function that uses it.

**Confidence:** HIGH (direct source inspection).

### Finding 2: POLISH-02 entry enumeration (45 entries to flip)

**Method:** `grep` for `category: "(exterior|frutales|aromaticas)"` + check `outdoor:` field within each entry block.

**Counts:**

| Category | `outdoor: true` (FLIP) | `outdoor: false` (already correct) | Total |
|----------|------------------------|-----------------------------------|-------|
| `exterior` | 28 | 0 | 28 |
| `frutales` | 7 | 0 | 7 |
| `aromaticas` | 10 | 3 | 13 |
| **TOTAL TO FLIP** | **45** | (3 already correct) | (45 + 3 = 48 enumerated) |

The 3 `outdoor: false` aromáticas are likely indoor-friendly herbs (stevia, eneldo, salvia-officinalis per Phase 17 lock). They are correct and should NOT be touched.

**Note on `huerta`:** Not flagged in CONTEXT.md, but worth audit — kitchen-window herbs may be `outdoor: true` defensively. Planner should `grep -nE 'category: "huerta"' plantDatabase.ts` and assess case-by-case. Out of strict POLISH-02 scope per CONTEXT.md ("exterior + frutales + outdoor aromáticas").

**Confidence:** HIGH (direct grep enumeration).

### Finding 3: `IdentificationResults.tsx` current typeId derivation

**Site 1:** Line 53 — variable assignment used in Case B (multiple results):

```tsx
const typeIdForPicker = selectedPlant?.indoor === false ? 'exterior' : 'interior';
```

**Site 2:** Line 100 — inline expression in Case A (single result):

```tsx
<LightLevelPicker typeId={plant.indoor === false ? 'exterior' : 'interior'} ... />
```

Both sites use PlantNet's `indoor` boolean ONLY. They IGNORE the catalog `category` field (which `convertPlantNetResult` already populates at `plantIdentification.ts:337`).

**Confidence:** HIGH.

### Finding 4: PlantNet flow `findPlantInDatabase` + `IdentifiedPlant.category`

`convertPlantNetResult` in `src/utils/plantIdentification.ts:322` calls `findPlantInDatabase(scientificName)`:

- **Hit (line 330-353):** Returns `IdentifiedPlant` with `category: translated.category` (from catalog) — exact category match available.
- **Miss (line 357-376):** Returns `IdentifiedPlant` with `category: genericCare.category || 'interior'` (family-based generic).

`IdentifiedPlant.category` is a `PlantCategory = "interior" | "exterior" | "aromaticas" | "huerta" | "frutales" | "suculentas"` (src/types/index.ts:184).

This means `selectedPlant.category` is ALWAYS defined after a successful identification — POLISH-03 fix is a pure rewire.

**Confidence:** HIGH.

### Finding 5: Existing empty state patterns per screen

| Screen | EmptyState exists | Component | i18n keys | Render path |
|--------|-------------------|-----------|-----------|-------------|
| **PlantsScreen** | YES (lines 365-373) | inline `EmptyState` fn | `plants.emptyTitle`, `plants.emptyText` | `<FlatList ListEmptyComponent={EmptyState}>` line 383 |
| **CalendarScreen** | **NO** | — | — | Always shows MonthCalendar grid; no empty branch |
| **ExploreScreen** | YES (lines 164-172) | inline `EmptyState` fn | `explore.noResults`, `explore.noResultsText` | `<FlatList ListEmptyComponent={EmptyState}>` line 184 |

**CalendarScreen treatment:** Render empty state below MonthCalendar when `plants.length === 0` — separate from the per-day "no tasks scheduled" state. (Per Pitfall 7.)

**Confidence:** HIGH.

### Finding 6: WCAG AA Contrast Computation — Candidate Table

Computed via JavaScript `(L1 + 0.05) / (L2 + 0.05)` (WCAG 2.1 formula).

| Candidate | vs `bgPrimary` #f5f0e6 | vs `card` #fffdf8 | vs `bgSecondary` #ede7d9 | AA on bgPrimary AND card |
|-----------|------------------------|---------------------|--------------------------|---------------------------|
| `#8a7e6b` (current) | 3.50 ✗ | 3.91 ✗ | 3.23 ✗ | **NO (fail)** |
| `#7a6f5d` | 4.34 ✗ | 4.85 ✓ | 4.00 ✗ | NO |
| `#6f6450` ⭐ | **5.12 ✓** | **5.72 ✓** | 4.71 ✓ | **YES** |
| `#6a604f` (= existing `textMuted`) | 5.44 ✓ | 6.08 ✓ | 5.01 ✓ | YES |
| `#665a4a` | 5.91 ✓ | 6.61 ✓ | 5.45 ✓ | YES |
| `#5f543e` | 6.55 ✓ | 7.31 ✓ | 6.03 ✓ | YES |
| `#5a4f3a` | 7.07 ✓ | 7.90 ✓ | 6.52 ✓ | YES (also AAA on `card`) |

**Recommendation:** `#6f6450` — the gentlest darkening that comfortably passes AA on BOTH backgrounds. Preserves visual hierarchy (`textSecondary` remains distinctly LIGHTER than `textMuted #6a604f`, which it should be — secondary < muted in lightness scale? Actually, **NOTE**: `#6f6450` (luminance ~5.12 vs bgPrimary) is LIGHTER than `#6a604f` (luminance ~5.44 vs bgPrimary). The hierarchy is preserved: `textSecondary` is slightly lighter than `textMuted`. ✓

**Alternative if planner prefers stronger contrast:** `#665a4a` (5.91:1 on bgPrimary). Still maintains hierarchy.

**Confidence:** HIGH (direct numeric computation; WCAG formula standard).

### Finding 7: Existing voseo violations in `es/common.json` (POLISH-06 cleanup)

Pre-existing Castilian/formal forms (must be fixed alongside POLISH-06 lint impl):

| Banned Form | Path | Current Text | Voseo Replacement |
|-------------|------|--------------|-------------------|
| `Elige` | `onboarding.languageStep` | "Elige tu idioma" | "Elegí tu idioma" |
| `Elige` | `settings.languageDescription` | "Elige el idioma de la aplicación." | "Elegí el idioma de la aplicación." |
| `Elige` | `fab.chooseKnown` | "Elige de plantas conocidas" | "Elegí de plantas conocidas" |
| `usa` | `settings.locationDescription` | "Tu ubicación se usa para mostrar..." | "Tu ubicación se usa para mostrar..." (3rd-person verb — LEGITIMATE; this is "is used", not imperative "use") |
| `Usa` | `plants.tipText` | "Usa el botón + para agregar..." | "Usá el botón + para agregar..." |
| `Usa` | `fab.useCamera` | "Usa la cámara o galería" | "Usá la cámara o galería" |
| `Agrega` | `today.emptyGardenText` | "Agrega tu primera planta..." | "Agregá tu primera planta..." (matches CONTEXT.md PlantsScreen empty-state CTA — re-use this string!) |
| `agrega` | `paywall.unlimitedPlantsDesc` | "...agrega todas las que quieras" | "...agregá todas las que quieras" |
| `Toca` | `plants.emptyText` | "Toca el botón + ..." | (replaced by emptyState.plants.cta in POLISH-07; KEEP as fallback or DELETE) |
| `Toca` | `calendar.instructions` | "Toca un día para ver las tareas..." | "Tocá un día para ver las tareas..." |
| `Toca` | `weatherAlerts.tapToUnlock` | "Toca para desbloquear" | "Tocá para desbloquear" |
| `toca` (verb form) | `alerts.sunDayToday` | "Hoy toca sacarla al sol" | "Hoy toca sacarla al sol" (3rd-person "it's time to" — LEGITIMATE; NOT imperative) |
| `Riega` | `health.waterEvery` | "Riega cada {{days}} días..." | "Regá cada {{days}} días..." |
| `Riega` | `health.overdueWaterSuggestion` | "Riega la planta lo antes posible..." | "Regá la planta lo antes posible..." |
| `riega` (in compound) | `alerts.heatWave` | "...riega temprano o al atardecer" | "...regá temprano o al atardecer" |
| `riega` | `wateringRec.extremeHeat` | "...riega temprano (antes de las 9am)..." | "...regá temprano (antes de las 9am)..." |
| `Riega` | `wateringRec.advanceOne` | "Riega temprano o al atardecer" | "Regá temprano o al atardecer" |
| `Riega` | `wateringRec.advanceMany` | "Riega temprano {{count}} plantas" | "Regá temprano {{count}} plantas" |

**Approx 17 line-level edits** required for clean POLISH-06 lint pass. Two genuine legitimate uses (3rd-person `usa`/`toca`) — voseo-lint regex must NOT flag these. Discrimination strategy: ban only as **leading imperative** (first word of sentence/clause) OR require word-position context. **Simpler approach: whitelist specific keys** (`settings.locationDescription`, `alerts.sunDayToday`).

**Confidence:** HIGH (direct enumeration).

### Finding 8: i18n action button keys for POLISH-06

**Primary call sites** (PlantCard mode='tasks' + DayDetailModal):

| Key path | Current ES value | New ES value (CONTEXT.md lock) | Current EN | New EN |
|----------|------------------|--------------------------------|------------|--------|
| `plantCard.water` | "Regar" | "Regá ahora 💧" | "Water" | "Water now 💧" |
| `plantCard.sunLabel` | "Sol ({{hours}}h)" | "Sacalo al sol ☀️ ({{hours}}h)" or just "Sol ☀️ ({{hours}}h)" | "Sun ({{hours}}h)" | "Sun ☀️ ({{hours}}h)" |
| `plantCard.outdoor` | "Sacar afuera" | "Sacalo afuera 🌳" | "Put outside" | "Put outside 🌳" |
| `plantCard.fertilize` | "Fertilizar" | "Fertilizá 🌱" | "Fertilize" | "Fertilize 🌱" |

**Sibling keys in `dayDetail.*` namespace:**

| Key path | Current ES | Maps to plantCard variant |
|----------|------------|---------------------------|
| `dayDetail.taskWater` | "Riego" | (label only — likely no change, or rename to "Regar" voseo) |
| `dayDetail.taskSun` | "Sol" | (label only — possibly add ☀️) |
| `dayDetail.taskOutdoor` | "Exterior" | (label only — possibly add 🌳) |
| `dayDetail.taskFertilize` | "Fertilizar" | (label only — possibly add 🌱) |

**Note:** `dayDetail.task*` keys appear UNUSED in DayDetailModal (which uses `task.label` from `getTasksForDay` instead — see Pitfall 3). Verify with `grep -rn "dayDetail.task" src/` to confirm whether to update.

**`plantDetailModal.water`, `plantDetailModal.fertilize`** at lines 853-854 of es/common.json — also action button copy; planner verifies their consumer sites in `MyPlantDetailModal.tsx`.

**Confidence:** HIGH (direct file inspection).

### Finding 9: Pre-existing voseo violations summary

See §Finding 7 above. Bottom line: **17 line edits** in es/common.json for clean lint pass.

**Confidence:** HIGH.

### Finding 10: `react-native-svg` dependency check

`package.json` (current state, line-by-line inspection): **NO `react-native-svg` dependency installed.**

The PNG path is therefore the lower-risk default for POLISH-07. If SVG is preferred:

```bash
npx expo install react-native-svg
# Rebuild dev client required
```

**Confidence:** HIGH.

### Finding 11: OUTDOOR_TYPE_IDS shape & canonical home

**Shape:** `ReadonlySet<string>` of `PlantCategory` values.

**Home:** `src/utils/plantLogic.ts` (module-private; co-located with the function that uses it). NOT exported. NOT in `plantDatabase.ts` (that file is data-only).

**Value (per Pitfall 1):** `new Set(['exterior', 'frutales'])` — TWO categories only. Aromáticas + huerta handled by data layer.

**Confidence:** HIGH.

### Finding 12: POLISH-08 negative-grep result

**Command:** `grep -rnE "sample|seed|demoPlant|defaultPlant|examplePlant" src/`

**Result:** Zero `samplePlants`, `seedPlants`, `demoPlants`, or `firstLaunchPlants` ARRAYS in `src/`. Only matches are:
- `careTips.ts` care-tip id `spring-seed-starting` (unrelated)
- i18n strings about "seed" semantics ("when basil starts flowering, cut...")
- One EN string about "sample data" in `noApiKeyWarning` (unrelated — about API mode)

**`useStorage.tsx` first-launch path:** No sample plants initialized. `AppData.plants` defaults to `[]` on first launch. Confirmed VERIFIED at Wave 0 baseline.

**Confidence:** HIGH.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-phase informal voseo grep | STRICT voseo-lint mjs at smoke-time + npm script | Phase 23 (POLISH-06) | Brand voice discipline locked at CI gate, no more drift |
| `textSecondary` #8a7e6b (3.50:1 — FAIL AA) | `textSecondary` #6f6450 (5.12:1 — PASS AA + margin) | Phase 23 (POLISH-05) | All `textSecondary` use sites now WCAG 2.1 AA compliant |
| Blank empty states with emoji icons | Illustrated PNG with brand-voice voseo copy | Phase 23 (POLISH-07) | Increased "welcome to your jardín" emotional onboarding affordance |
| Sample-plant first-launch pre-load (proposed but rejected) | Illustrated empty-state with strong CTA (POLISH-07/08) | Phase 23 lock | Zero "test event syndrome"; user adds first plant intentionally |
| Hardcoded ES strings in `plantLogic.ts` task labels | i18n.t() with voseo+emoji values | Phase 23 (POLISH-06 — recommended) | EN users finally see EN task labels; voseo lint covers all surfaces |

**Deprecated/outdated:**

- `plants.emptyTitle` / `plants.emptyText` (PlantsScreen empty state) → DEPRECATED in favor of `emptyState.plants.title`/`.cta` (POLISH-07 new namespace). Keep old keys for backward compat OR remove (planner decides; orphan-key sweep optional).
- `explore.noResults` / `explore.noResultsText` → similar deprecation in favor of `emptyState.explore.title`/`.cta`.

## Open Questions

### 1. Sun label hours interpolation strategy

**What we know:** Current `plantCard.sunLabel` is `"Sol ({{hours}}h)"` with `{{hours}}` interpolation. CONTEXT.md locks the new copy as `"Sacalo al sol ☀️"` — DROPS the hours hint.

**What's unclear:** Should the new copy:
- (A) `"Sacalo al sol ☀️ ({{hours}}h)"` — preserve hours interpolation
- (B) `"Sol ☀️ ({{hours}}h)"` — emoji only, preserve current label semantics
- (C) `"Sacalo al sol ☀️"` — drop hours hint; surface hours elsewhere in card

**Recommendation:** Option (B) — minimal disruption; emoji adds brand voice without changing semantics. Planner should confirm during plan-check.

### 2. Three legitimate Spanish 3rd-person verbs flagged by lint

**What we know:** `usa` (in `se usa` reflexive) and `toca` (in `hoy toca` impersonal) are legitimate 3rd-person verb forms in es-AR, NOT Castilian imperatives. Naive `\busa\b`/`\btoca\b` regex flags them as false positives.

**What's unclear:** Strategy:
- (A) Per-string whitelist (specific i18n keys excluded from regex)
- (B) Word-position heuristic (banned only at start-of-sentence)
- (C) Drop these words from BANNED list entirely (accept lower coverage in exchange for zero false positives)

**Recommendation:** Option (A) — explicit whitelist for `settings.locationDescription` (line 168, "se usa") and `alerts.sunDayToday` ("hoy toca sacarla"). The lint regex stays simple; whitelisted keys are documented.

### 3. PNG vs SVG final choice

**What we know:** CONTEXT.md leaves this to planner. PNG is zero-install; SVG requires `npx expo install react-native-svg`.

**Recommendation:** PNG. Empty-state illustrations don't need vector scaling beyond 3 DPRs; PNG @3x renders crisply at all sizes. Saves a dev-client rebuild.

### 4. `dayDetail.task*` keys — used or vestigial?

**What we know:** Lines 871-874 of es/common.json declare `dayDetail.taskWater/taskSun/taskOutdoor/taskFertilize`. Grep showed they MAY be unused (DayDetailModal uses `task.label` from `getTasksForDay`, which uses hardcoded ES strings).

**What's unclear:** Are these keys consumed anywhere?

**Recommendation:** Planner runs `grep -rn "dayDetail.task" src/` during Plan 23-02 prep. If unused, optionally remove (cleanup); if used, update with voseo+emoji.

### 5. Aromáticas catalog count discrepancy

**What we know:** CONTEXT.md says "expected count ~35" for POLISH-02. Actual grep: 28 exterior + 7 frutales + 10 outdoor-aromaticas = **45 entries**.

**What's unclear:** CONTEXT estimate was lower — does the user want all 45 flipped, or only some?

**Recommendation:** Flip all 45. CONTEXT.md decision lock is "outdoor entries' `outdoor: 0`", which by the cleanest reading includes all 45 currently-`outdoor:true` entries in the three categories. Planner can clarify if user prefers stricter scope.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom CJS smoke runners (`scripts/smoke-phaseXX.cjs`); cross-runs `npx tsc --noEmit` + `npm run check:i18n-keys` |
| Config file | `package.json` "scripts" map (smoke-phase23, lint:voseo, check:i18n-keys, typecheck) |
| Quick run command | `node scripts/smoke-phase23.cjs` (Wave 0 baseline ≈ 200ms) |
| Full suite command | `npx tsc --noEmit && npm run check:i18n-keys && node scripts/smoke-phase18.cjs && node scripts/smoke-phase19.cjs && node scripts/smoke-phase20.cjs && node scripts/smoke-phase21.cjs && node scripts/smoke-phase22.cjs && node scripts/smoke-phase23.cjs && npm run lint:voseo` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLISH-01 | `getTasksForDay` emits NO outdoor task for plants where `typeId ∈ {'exterior','frutales'}` | unit (smoke regex) | `node scripts/smoke-phase23.cjs` — sentinel `/const OUTDOOR_TYPE_IDS\s*=\s*new Set\(\['exterior',\s*'frutales'\]\)/.test(plantLogicSrc)` AND proximity check `OUTDOOR_TYPE_IDS\.has\(p\.typeId\)` within getTasksForDay body | Wave 0 will create |
| POLISH-02 | 45 catalog entries (exterior/frutales/outdoor-aromaticas) have `outdoor: false` | unit (smoke count) | `node scripts/smoke-phase23.cjs` — sentinel: parse PLANT_DATABASE via `scripts/.tmp-phase23/db-export.cjs` (ts-transpile), count entries matching `category∈{exterior,frutales}` with `outdoor:false === 35` AND outdoor-aromaticas-id-list with `outdoor:false === 10` | Wave 0 will create (deferred via SKIP placeholder) |
| POLISH-03 | `IdentificationResults.tsx` uses `selectedPlant.category` before `selectedPlant.indoor` | unit (smoke regex) | `node scripts/smoke-phase23.cjs` — sentinel `/resolveTypeIdForPicker|selectedPlant\?\.category/.test(identResultsSrc)` AND NEGATIVE `!(/typeId.*indoor\s*===\s*false[\s\S]{0,40}exterior.*interior/.test(identResultsSrc))` | Wave 0 will create |
| POLISH-04 | Identification → diagnose flow works on iOS + Android device | manual-only | (no automated command) — 14-item Block A-E checklist appended to `/Users/gaston/.claude/projects/-Users-gaston-Documents-Personal-MiJardinApp/memory/v1_2_test_backlog.md` per Phase 22-03 / 21-06 / 20-10 / 18-05 precedent | n/a |
| POLISH-05 | `colors.textSecondary` ≠ `'#8a7e6b'` AND new value passes 4.5:1 AA against both `bgPrimary` AND `card` | unit (smoke regex + value check) | `node scripts/smoke-phase23.cjs` — sentinels: (a) `textSecondary` string-match in theme.ts NOT equal to `'#8a7e6b'`; (b) value extracted via regex AND luminance-computed against `bgPrimary` `#f5f0e6` AND `card` `#fffdf8`, both ≥ 4.5 | Wave 0 will create |
| POLISH-06 | All ES action button keys use voseo + emoji; voseo-lint over `es/*.json` passes | unit (smoke + lint script) | `node scripts/smoke-phase23.cjs` — 4 i18n value literals + STRICT `node scripts/voseo-lint.mjs` (exit 0) | Wave 0 will create lint skeleton; Plan 23-02 lands strict body |
| POLISH-07 | 3 illustration files exist + 3 EmptyState components reference them + emptyState.* i18n namespace populated EN+ES | unit (smoke file-exists + JSX regex) | `node scripts/smoke-phase23.cjs` — sentinels: `fs.existsSync('assets/illustrations/empty-plants.png')` ×3, JSX `require\('.+/illustrations/empty-(plants|calendar|explore)'\)` ×3, i18n `emptyState.{plants,calendar,explore}.{title,cta}` ×6 EN + ×6 ES | Wave 0 will create i18n skeleton; Plan 23-03 lands assets + JSX |
| POLISH-08 | Zero `samplePlants`/`mockPlants`/`seedPlants`/`demoPlants`/`firstLaunchPlants` array declarations in `src/` | STRICT negative-grep | `node scripts/smoke-phase23.cjs` — recursive walk of `src/` matching `/\b(samplePlants\|mockPlants\|seedPlants\|demoPlants\|firstLaunchPlants)\b/`, assert count === 0 | Wave 0 expects PASS at baseline (no source change needed; verification only) |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && node scripts/smoke-phase23.cjs && npm run lint:voseo` (~5s combined)
- **Per wave merge:** Full cross-phase regression suite (typecheck + 6 smoke runners + 2 checks) (~15-20s)
- **Phase gate:** Full suite green before `/gsd:verify-work` invocation; manual device test Block A-E for POLISH-04 (Option B precedent — defer to v1_2_test_backlog.md memory)

### Wave 0 Gaps

- [ ] `scripts/smoke-phase23.cjs` — fork of smoke-phase22.cjs with POLISH-01..08 SKIP→PASS placeholders + STRICT voseo-lint + Phase 18-22 cross-phase regression preserved
- [ ] `scripts/voseo-lint.mjs` — initial skeleton (BANNED list + walkValues + exit codes); STRICT enforcement body lands in Plan 23-02
- [ ] `package.json` — add `"smoke:phase23"` + `"lint:voseo"` npm scripts
- [ ] `.gitignore` — add `scripts/.tmp-phase23/` line
- [ ] `src/i18n/locales/en/common.json` + `es/common.json` — `emptyState.{plants,calendar,explore}.{title,cta}` namespace skeleton (Plan 23-00 lays placeholder values; Plan 23-03 finalizes copy)

*Wave 0 gaps total: 5 surfaces. No existing test framework changes needed.*

## Sources

### Primary (HIGH confidence)
- `src/utils/plantLogic.ts` — direct source read (POLISH-01 emit site)
- `src/data/plantDatabase.ts` — direct grep (POLISH-02 entry count)
- `src/components/PlantIdentifier/IdentificationResults.tsx` — direct source read (POLISH-03)
- `src/utils/plantIdentification.ts` — direct source read (`convertPlantNetResult` + `IdentifiedPlant.category` flow)
- `src/theme.ts` — direct source read (POLISH-05 current value + WCAG TODO comment line 13)
- `src/i18n/locales/{en,es}/common.json` — direct source read (POLISH-06 i18n keys + Finding 7 voseo violations)
- `src/screens/{PlantsScreen,ExploreScreen,CalendarScreen}.tsx` — direct source read (POLISH-07 empty state patterns)
- `src/hooks/useStorage.tsx` — direct source read (POLISH-08 negative-grep)
- `package.json` — direct source read (Finding 10 react-native-svg absence)
- `scripts/smoke-phase22.cjs` — direct source read (Wave 0 fork template)
- [W3 WCAG 2.2 Specification](https://www.w3.org/TR/WCAG22/) — 4.5:1 normal text / 3:1 large text official thresholds (WCAG 2.1 AA carries forward unchanged in 2.2)

### Secondary (MEDIUM confidence)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — cross-validates the computed contrast ratios in Finding 6
- WCAG normal/large text definitions cross-referenced via [Make Things Accessible](https://www.makethingsaccessible.com/guides/contrast-requirements-for-wcag-2-2-level-aa/)

### Tertiary (LOW confidence)
- N/A — all critical findings backed by direct source inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; PNG path is RN built-in; voseo-lint is a Node mjs script
- Architecture: HIGH — five plans grouped by domain; three-tier smoke runner is the established Phase 19+ pattern
- Pitfalls: HIGH — all 8 pitfalls identified via direct source inspection or computed contrast tables

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (30 days for stable surface; Phase 23 is closing v1.2, no fast-moving dependencies expected)
