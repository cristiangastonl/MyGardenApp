---
phase: 11-perenual-data-quality
verified: 2026-05-02T00:00:00Z
status: human_needed
score: 3/4 requirements fully verified; DATA-04 passed-with-finding
re_verification: false
human_verification:
  - test: "Confirm DATA-04 FINDING is accepted — Perenual free tier paywalls family/type/hardiness/indoor in /species/details/<id>"
    expected: "Phase 11 is closed with the DATA-04 finding documented. No code fix is required. Forward-compatible when upstream data becomes available."
    why_human: "0/5 live fixture species met the ≥80% threshold due to external API paywall. Implementation is verified correct at the unit level (31/31 smoke PASS). Threshold unachievable without Perenual premium upgrade or alternative provider — this is an explicit user-accepted FINDING (Option A, 11-03-SUMMARY.md), not an implementation gap."
---

# Phase 11: Perenual Data Quality Verification Report

**Phase Goal:** Plants identified via Perenual return accurate `tempMax` and `humidity` values instead of hardcoded fallbacks, and mismatched results are rejected before caching
**Verified:** 2026-05-02
**Status:** human_needed (DATA-01..03 fully verified; DATA-04 passed-with-finding — external API paywall)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Identifying a species with a known USDA hardiness zone returns a `tempMax` derived from that zone (not always 35) | VERIFIED | `parseHardiness` reads `hardiness.max` via `zoneToTempMax` table; `convertPerenualToKnowledge` wires `tempMax ?? classifyTempMaxFallback(plant)`. Smoke: `parseHardiness({ max: "10" }) → 38`, `parseHardiness({ max: "11" }) → 40` — PASS |
| 2 | Identifying an Araceae/tropical plant returns `humidity: 'alta'`; identifying a cactus returns `humidity: 'baja'` | VERIFIED | `inferHumidity` exported and wired at `plantKnowledgeService.ts:196`. Family match first (Araceae → `'alta'`, Cactaceae → `'baja'`), then type substring. Smoke: `inferHumidity({ family: 'Araceae' }) → 'alta'`, `inferHumidity({ family: 'Cactaceae' }) → 'baja'` — PASS |
| 3 | Querying a species name that doesn't match the top Perenual result returns `null` (no garbage cached) | VERIFIED | `isGoodMatch` defined at edge function line 20; guard inserted at line 136 (between search and details fetch); returns `{ data: null }` status 200 on mismatch. Live-verified: curl with fictional plant `"qwerty fictional plant xyzzy"` returns `{"data":null}`. Smoke: structural grep PASS |
| 4 | Test fixture of 5 known species shows `tempMax ≠ 35` and `humidity ≠ null` in ≥80% of cases | FINDING | 0/5 species met threshold in live fixture. Root cause: Perenual free tier paywalls `family`, `type`, `hardiness`, `indoor` fields in `/species/details/<id>`. Implementation is correct and forward-compatible. See DATA-04 FINDING section below. |

**Score:** 3/4 truths fully verified. Truth 4 carries a documented external-API FINDING (not an implementation gap).

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/get-plant-care/index.ts` | `isGoodMatch` validator + `family?`/`type?` on `PerenualPlantDetail` | VERIFIED | Lines 20–28: `isGoodMatch` defined. Lines 60–61: `family?: string` and `type?: string` added to interface. Guard inserted at line 136 before details fetch. |
| `src/services/plantKnowledgeService.ts` | `parseHardiness` reads `hardiness.max`, `inferHumidity`, `classifyTempMaxFallback`, `convertPerenualToKnowledge` wired | VERIFIED | All four helpers exported. `parseHardiness` has `zoneToTempMax` table (lines 353–357). `inferHumidity` at line 211. `classifyTempMaxFallback` at line 248. `convertPerenualToKnowledge` wires both at lines 195–196. `family?`/`type?` at lines 39–40. |
| `scripts/smoke-phase11.mjs` | 31/31 PASS covering DATA-01..03 unit behavior | VERIFIED | `node scripts/smoke-phase11.mjs` → `[smoke-phase11] PASS 31/31`. 12 Wave 0 scaffold + 17 Wave 1 behavior assertions. 0 FAIL, 0 SKIP. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `convertPerenualToKnowledge` | `parseHardiness` | `const { tempMin, tempMax } = parseHardiness(plant.hardiness)` | WIRED | Line 180 calls `parseHardiness`; result used at line 195 via `tempMax ?? classifyTempMaxFallback(plant)` |
| `convertPerenualToKnowledge` | `classifyTempMaxFallback` | `tempMax ?? classifyTempMaxFallback(plant)` | WIRED | Line 195 — fallback activated when `parseHardiness` returns `tempMax: null` |
| `convertPerenualToKnowledge` | `inferHumidity` | `humidity: inferHumidity(plant)` | WIRED | Line 196 — replaces previous hardcoded `humidity: null` |
| `fetchFromPerenual` | `convertPerenualToKnowledge` | `return convertPerenualToKnowledge(detail)` | WIRED | Line 160 |
| Edge function search step | `isGoodMatch` guard | `if (!isGoodMatch(body.plantName, plant))` | WIRED | Line 136 — between `const plant = plants[0]` (line 133) and details fetch (line 145). Returns `{ data: null }` status 200 on mismatch. |
| `PerenualPlantDetail` (edge) | `family?`, `type?` fields | Interface declaration lines 60–61 | WIRED | Both files updated in same commit (Plans 11-01 + 11-02); `family?` and `type?` declared in both `supabase/functions/get-plant-care/index.ts` and `src/services/plantKnowledgeService.ts` |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| DATA-01 | Edge function adds `isGoodMatch` validator — bidirectional `lowercase().includes()` — failed match returns `null` | SATISFIED | `isGoodMatch` at edge function lines 20–28. Guard at line 136. Live mismatch curl returns `{"data":null}`. Smoke W1.DATA-01.placement PASS. |
| DATA-02 | `parseHardiness()` reads `hardiness.max` (USDA zone → °C mapping); per-category fallbacks: tropical 32, succulent/cactus 40, templada 35, fría 28 | SATISFIED | `zoneToTempMax` table at lines 353–357; `classifyTempMaxFallback` at lines 248–278 with all four anchors. `npx tsc --noEmit` exits 0. Smoke 10/31 asserts cover DATA-02 paths. |
| DATA-03 | `convertPerenualToKnowledge()` infers `humidity` from `plant.family`/`plant.type`: araceae/tropical → `'alta'`; cactaceae/crassulaceae/succulent/cactus → `'baja'`; default → `'media'` | SATISFIED | `inferHumidity` at lines 211–232. Wired at line 196. Smoke: 4 unit asserts cover Araceae/Cactaceae/succulent/Rosaceae paths — all PASS. |
| DATA-04 | ≥80% of 5-species live fixture returns `tempMax ≠ 35` and `humidity ≠ null` | FINDING (external API) | 0/5 species met threshold. Root cause: Perenual free tier paywalls `family`, `type`, `hardiness`, `indoor` in `/species/details/<id>`. Implementation is correct; code is forward-compatible. User accepted FINDING (Option A, 11-03-SUMMARY.md). See DATA-04 FINDING section. |

---

### DATA-04 FINDING (Documented External-API Limitation)

**Status:** NOT MET on current Perenual free-tier subscription (0/5 species). This is an explicit user-accepted FINDING, not a blocker.

**Root cause:** Perenual's free tier paywalls `family`, `type`, `hardiness`, and `indoor` fields in the `/species/details/<id>` endpoint. All 5 fixture species (Monstera deliciosa, Echinopsis pachanoi, Rosa canina, Phalaenopsis amabilis, Aloe vera) returned `family: null`, `type: null`, `hardiness: null` — with the sole exception that Aloe vera returned `family: "Asphodelaceae"`, which is not in the DATA-03 classifier spec (Cactaceae/Crassulaceae are the `baja`/40 anchors; Asphodelaceae is not listed).

**Implementation correctness:** Plans 11-01 and 11-02 are fully correct:
- `parseHardiness` reads `hardiness.max` and applies `zoneToTempMax` lookup.
- `classifyTempMaxFallback` has all four REQUIREMENTS.md anchors (40/32/28/35).
- `inferHumidity` classifies Araceae/Orchidaceae/Bromeliaceae → `alta`; Cactaceae/Crassulaceae → `baja`; type substrings as fallback.
- All functions are exported and wired end-to-end in `convertPerenualToKnowledge`.

**Forward compatibility:** When Perenual returns non-null `family`, `type`, or `hardiness.max` (via premium upgrade or provider migration), the classifiers activate without code changes. The `PerenualPlantDetail` interface already declares both fields in both files.

**Carry-forward:** Consider Perenual premium upgrade or alternative provider (Trefle, GBIF, USDA PLANTS) in v1.2 milestone closeout (Phase 24 DOCS).

**User decision:** Option A — Accept and document FINDING. Phase 11 closed with implementation as-is.

---

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholder returns, or empty handlers found in the modified files. The previous hardcoded values (`tempMax: number | null = 35` and `humidity: null`) have been replaced with the correct derived values.

---

### Human Verification Required

#### 1. DATA-04 FINDING Acceptance Confirmation

**Test:** Review 11-03-SUMMARY.md DATA-04 FINDING. Confirm user's Option A decision is final — Phase 11 closed with implementation as-is.
**Expected:** Phase 11 is complete. DATA-04 is documented as an external-API limitation. No code rework is needed. The moment Perenual provides `family`/`type`/`hardiness` fields (via premium or provider switch), derivation activates automatically.
**Why human:** The 0/5 live fixture result cannot be overridden programmatically — it reflects a real Perenual subscription gate. Closing the phase requires explicit user confirmation that the documented FINDING is accepted.

---

### Gaps Summary

There are no implementation gaps. DATA-01, DATA-02, and DATA-03 requirements are fully satisfied per REQUIREMENTS.md wording. DATA-04's ≥80% threshold is unachievable on the current Perenual free tier due to paywalled response fields — this is a documented external-API limitation, not an implementation defect. The code path for DATA-04 is wired and smoke-tested; it will activate without changes when upstream data becomes available.

The single `human_needed` item is confirmation that the user's Option A decision (11-03-SUMMARY.md) closes the phase.

---

_Verified: 2026-05-02_
_Verifier: Claude (gsd-verifier)_
