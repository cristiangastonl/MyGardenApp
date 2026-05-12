# Phase 23: Polish — UAT Fixes + Brand Voice - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Close 8 POLISH-* requirements: outdoor-task gating (POLISH-01/02), PlantNet category-conflict resolution (POLISH-03), identify→diagnose flow verification (POLISH-04, manual), WCAG AA contrast for `textSecondary` (POLISH-05), voseo + emoji action button microcopy with smoke-lint enforcement (POLISH-06), illustrated empty states with motivating voseo copy on PlantsScreen + CalendarScreen + ExploreScreen (POLISH-07), and confirmed no-sample-plant first-run UX (POLISH-08). No new feature surfaces — all polish.

**Out of scope:** new task types (e.g., pruning); new modal sections; new theme tokens (POLISH-05 darkens an existing hex value, doesn't introduce a new one); Lottie / animated illustrations (static SVG/PNG only); per-screen color-themed empty states; achievement / onboarding tutorial illustrations; first-run sample-plant pre-seeding (POLISH-08 explicitly rejects this); voseo lint over inline `.tsx` strings (CLAUDE.md already mandates `t()` only — lint covers ES JSON only); new dependencies.

</domain>

<decisions>
## Implementation Decisions

### Empty-state illustrations (POLISH-07, Area 1)

- **Static SVG/PNG only.** No Lottie. No `lottie-react-native` dependency. Keeps bundle lean (no ~200KB animation runtime) and avoids motion accessibility concerns. If user later wants motion, a polish phase can revisit.
- **Per-screen variants, NOT shared.** Three distinct illustrations:
  - **PlantsScreen empty state** — "planta en maceta vacía" motif (small SVG + sprout illustration with the brand `colors.green` accent)
  - **CalendarScreen empty state** — "calendario sin tasks" motif (calendar with checkmarks complete)
  - **ExploreScreen empty state** — "lupa/búsqueda" motif (magnifying glass over a leaf)
- **Theme tokens only.** SVG fills use existing tokens: `colors.green`, `colors.bgPrimary`, `colors.textPrimary`, `colors.textSecondary` (post-darkening). NO new "muted-illustration" tokens.
- **Distinct voseo copy per screen:**
  - PlantsScreen: `"Tu jardín está esperando 🌱"` + CTA `"Agregá tu primera planta"`
  - CalendarScreen: `"No hay tareas hoy ☀️"` + sub `"Disfrutá del descanso"`
  - ExploreScreen: `"Explorá +100 plantas para tu hogar"` + CTA `"Buscar especies"`
- **Asset location:** `assets/illustrations/empty-{plants,calendar,explore}.svg` (or `.png` if SVG renderer is missing — planner picks). i18n keys live under `emptyState.*` namespace in `common.json`.

### Voseo lint enforcement (POLISH-06, Area 2)

- **Lint scope:** `scripts/voseo-lint.mjs` runs over `src/i18n/locales/es/*.json` (common.json + plants.json + any future locale file). NOT over `.tsx` source (CLAUDE.md already requires `t('key')` only — hardcoded strings are caught elsewhere).
- **Banned forms regex** (`\b...\b` word-bounded):
  - Castilian 2nd-person: `tienes`, `puedes`, `debes`, `quieres`, `eres`, `tú`, `tu` (as separate word — possessive contexts are ok)
  - Formal 3rd-person: `usted`, `su` (as separate word)
  - Castilian imperatives that have voseo equivalents: `riega`, `saca`, `pode`, `corta`, `fertiliza`, `agrega`, `ven`, `mira`, `escucha`
  - Voseo replacements: `tenés`, `podés`, `querés`, `sos`, `vos`, `regá`, `sacá`, `podá`, `cortá`, `fertilizá`, `agregá`, `vení`, `mirá`, `escuchá`
- **Whitelist:** Test fixtures + comments + JSON keys themselves (regex anchored on string-value content, not keys).
- **Wired into smoke-phase23.cjs as STRICT sentinel** — failure blocks the gate. Also exposed as `npm run lint:voseo` for manual runs.
- **Action button copy variants — single set across surfaces:**
  - `Regá ahora 💧` (water — currently `Regar`)
  - `Sacalo al sol ☀️` (sun — currently `Sol`)
  - `Sacalo afuera 🌳` (outdoor — currently `Sacar afuera`, which is also POLISH-01's offending UAT-3 string for indoor plants — its presence/absence is gated by the OUTDOOR_TYPE_IDS check)
  - `Fertilizá 🌱` (fertilize — currently `Fertilizar` from Plan 20-04)
- All 4 strings update at the i18n key sites (no JSX changes). Used by PlantCard mode='tasks' + DayDetailModal `<TaskButton>` invocations.

### Wave structure (Area 3)

- **Grouped by domain, NOT plan-per-requirement.** 5 plans:
  - **23-00 Wave 0:** Nyquist scaffold — `smoke-phase23.cjs` + npm script (incl. `lint:voseo`) + SKIP→PASS placeholders for POLISH-01..08 + STRICT cross-phase Phase 18+19+20+21+22 sentinels + voseo-lint script skeleton
  - **23-01 Wave 1 (outdoor cluster):** POLISH-01 (outdoor task gate in `plantLogic.getTasksForDay`) + POLISH-02 (catalog `outdoor: 0` for OUTDOOR_TYPE_IDS entries) + POLISH-03 (IdentificationResults.tsx category-over-PlantNet-flag conflict resolution). Single plan, 3 atomic commits.
  - **23-02 Wave 2 (WCAG + voseo):** POLISH-05 (darken `colors.textSecondary` to a value passing 4.5:1 on both `bgPrimary` `#f5f0e6` AND `card` `#fffdf8` — research will compute the exact hex) + POLISH-06 voseo-lint impl + 4 action button copy updates
  - **23-03 Wave 3 (empty states):** POLISH-07 (3 SVG/PNG illustrations + 3 empty-state JSX inserts in PlantsScreen + CalendarScreen + ExploreScreen) + POLISH-08 (negative-grep confirming no `samplePlants`/`mockPlants`/`seedPlant` arrays in first-launch path)
  - **23-04 Wave 4 (manual gate):** POLISH-04 device-test (identify→diagnose flow on iOS + Android) + Block A–E 8-12-item checklist + Option A/B closure
- **POLISH-04 device-test placement:** inside 23-04 (no automated surface change — it's a verification-only requirement)
- **POLISH-08 implementation:** negative-grep in 23-03 (verify absence of sample-plant arrays). If found, BLOCK and remove. If absent (expected), document as VERIFIED via grep sentinel.

### Claude's Discretion

- **Outdoor task gate (POLISH-01) exact insertion:** `getTasksForDay` in `src/utils/plantLogic.ts` currently emits outdoor tasks when `plant.outdoor` flag is set or based on `lastOutdoor` cadence. The gate adds `if (OUTDOOR_TYPE_IDS.has(plant.typeId)) return null;` before emission. `OUTDOOR_TYPE_IDS` is a `Set<string>` constant defined in `src/utils/plantLogic.ts` (or `src/data/plantDatabase.ts`) — planner identifies the canonical home for the constant.
- **POLISH-02 catalog defensive complement:** all entries in OUTDOOR_TYPE_IDS get `outdoor: 0` in `plantDatabase.ts`. Planner identifies the entries (likely all `category: 'exterior'` + `frutales` + outdoor `aromaticas`). Two-layer gate: data + code.
- **POLISH-03 PlantNet conflict logic:** `IdentificationResults.tsx` currently sets `typeId` based on PlantNet's `indoor` boolean. The conflict-resolution rule: if catalog category for the matched species exists, USE catalog category's typeId; PlantNet `indoor` only used as fallback when catalog lookup fails.
- **POLISH-05 exact new hex value:** research computes via WCAG contrast tool. Reasonable candidate: `#6f6450` or darker. The lock is "passes 4.5:1 on both #f5f0e6 AND #fffdf8". theme.ts comment about the failure (line 13) gets removed once fixed.
- **i18n key updates for POLISH-06:** mostly value changes, no new keys (existing `t('plantCard.water')` etc. just change ES string). Planner enumerates the exact keys.
- **Three-tier smoke runner** forked from `smoke-phase22.cjs` (latest pattern with Phase 21+22 STRICT cross-phase regression preserved).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`getTasksForDay` outdoor-task discriminator** (`src/utils/plantLogic.ts`): existing emission site for POLISH-01 gate insertion
- **`plantDatabase.ts` entries** (`src/data/plantDatabase.ts`): 118 catalog entries; outdoor entries (~28 exterior + 7 frutales + some aromáticas) get `outdoor: 0` for POLISH-02
- **`IdentificationResults.tsx`** (`src/components/PlantIdentifier/IdentificationResults.tsx`): consumes PlantNet `indoor` flag; site for POLISH-03 conflict resolution
- **`colors.textSecondary` token** (`src/theme.ts:11`): current `#8a7e6b` fails WCAG AA per comment at line 13. POLISH-05 darkens.
- **i18n action button keys** (`src/i18n/locales/es/common.json`): `plantCard.water`/`sun`/`outdoor`/`fertilize` + similar in DayDetailModal namespace. POLISH-06 updates.
- **Three-tier smoke runner pattern** (`scripts/smoke-phase22.cjs`): fork verbatim for `smoke-phase23.cjs`; STRICT cross-phase regression for Phase 18+19+20+21+22.
- **Empty-state precedents** (`src/screens/TodayScreen.tsx`, `OnboardingScreen.tsx`): existing empty-state patterns to mirror.

### Established Patterns

- **Phase 18 atomic commit per task** (GSD baseline)
- **Phase 14+ char-limit-from-draft + voseo pre-sweep authoring discipline**: POLISH-06 voseo-lint is the formal enforcement layer for what's been informally checked since Phase 14
- **WCAG AA token discipline** (CLAUDE.md design system lock): POLISH-05 darkens within existing token; no new tokens introduced
- **Three-tier smoke runner with STRICT cross-phase regression** (Phase 19 onwards): Phase 23 preserves Phase 18+19+20+21+22

### Integration Points

- **`src/utils/plantLogic.ts`** `getTasksForDay`: POLISH-01 gate; possibly host `OUTDOOR_TYPE_IDS` constant
- **`src/data/plantDatabase.ts`**: POLISH-02 outdoor: 0 defensive complement on outdoor entries
- **`src/components/PlantIdentifier/IdentificationResults.tsx`**: POLISH-03 PlantNet conflict resolution
- **`src/theme.ts`**: POLISH-05 `colors.textSecondary` hex change + remove TODO comment at line 13
- **`src/i18n/locales/es/common.json`** + `en/common.json`: POLISH-06 action button copy updates + `emptyState.*` new namespace for POLISH-07
- **`src/screens/PlantsScreen.tsx`**: POLISH-07 empty-state JSX + illustration import
- **`src/screens/CalendarScreen.tsx`**: POLISH-07 empty-state JSX + illustration import
- **`src/screens/ExploreScreen.tsx`**: POLISH-07 empty-state JSX + illustration import
- **`assets/illustrations/empty-{plants,calendar,explore}.svg`** (new): POLISH-07 illustration files
- **`scripts/voseo-lint.mjs`** (new): POLISH-06 enforcement
- **`scripts/smoke-phase23.cjs`** (new): three-tier sentinel runner

</code_context>

<specifics>
## Specific Ideas

- **Two-layer outdoor gate (data + code)** is intentional defense-in-depth. POLISH-01 in code + POLISH-02 in catalog. If a future catalog entry forgets `outdoor: 0`, the code gate still skips emission. If a future plant has a custom typeId outside OUTDOOR_TYPE_IDS, the catalog `outdoor: 0` prevents auto-emission.
- **Voseo lint is STRICT, not advisory.** Smoke-phase23 sentinel fails if any banned form appears in es/*.json. This locks the ES authoring discipline at compile-time for all future phases.
- **No new design tokens.** POLISH-05 darkens an existing hex; POLISH-07 uses only existing tokens. CLAUDE.md design-system lock honored.
- **POLISH-08 confirms by negative-grep** that no sample-plant arrays exist. If grep returns 0, document as VERIFIED. If returns >0, the plan blocks and surfaces to the orchestrator for explicit user decision (likely "remove them").
- **Three illustrations, not one.** Each screen's empty state communicates a different mode (no plants yet, no tasks today, no exploration yet). Single shared illustration would dilute the per-screen empathy.

</specifics>

<deferred>
## Deferred Ideas

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

</deferred>

---

*Phase: 23-polish-uat-brand-voice*
*Context gathered: 2026-05-12 via smart-discuss (autonomous mode)*
