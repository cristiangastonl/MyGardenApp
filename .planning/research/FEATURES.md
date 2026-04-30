# FEATURES — v1.1 Precision Care

**Researched:** 2026-04-29
**Confidence:** HIGH (Planta/PictureThis/RHS terminology, seasonal ratios); MEDIUM (catalog gaps for LATAM)

## Executive Summary

The plant-care market has converged on a **4-level light system** (full sun / bright indirect / medium indirect / low). The proposed enum `direct / bright_indirect / medium_indirect / low` matches Greg, Planta, PictureThis and RHS exactly. Outdoor uses parallel "full sun / partial sun / partial shade" vocabulary that maps cleanly to the same enum.

For watering, dominant pattern is **seasonal warm/cold ratios driven by hemisphere + month**. The 2x interval rule (7d→14d in winter) is broadly accurate for tropical houseplants. For cacti/succulents the standard is **NOT a fixed schedule but a soil-check prompt** — proposed `waterMode: 'fixed' | 'soil_check'` is a genuine differentiator.

**Lux measurement via camera is a gimmick** — smartphone sensors measure illuminance for human eyes, not PPFD/PAR for photosynthesis. Skip this; visual-card picker with location descriptions is higher-value, lower-complexity.

---

## Table Stakes (Must ship)

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| **4-level light enum** | Medium | Catalog migration; PlantNet→enum mapping; PlantDiagnosisContext.sunHours→lightLevel |
| **Visual light picker with location descriptions** | Small | Light enum |
| **Seasonal watering split (warm/cold)** | Medium | DEPENDS ON LOCATION for hemisphere→month→season |
| **Hemisphere + season detection from latitude** | Small | `lat >= 0 ? 'north' : 'south'`; cold months: north=Nov-Mar, south=May-Sep |
| **Soil-check watering mode** | Medium | Light enum + season; notification copy variant |
| **Location-skip fallback with non-blocking banner** | Small | Hoy screen banner slot (existing weather alert UI as model) |
| **Diagnosis "Continue chat" always visible (paywall on tap)** | Small | Existing paywall flow + RevenueCat — just remove `isPremium &&` gate |
| **"Reabrir consulta" rename for resolved diagnoses** | Small | New i18n key `t('diagnosis.reopen')` |
| **Catalog migration of 60+ existing entries** | Medium | Light enum + watering schema. Scriptable mapping: sunHours <2→low, 2-3→medium, 3-5→bright, >5→direct |

## Differentiators

| Feature | Value |
|---------|-------|
| **Argentine Spanish-first location descriptions** | "Junto a la ventana sur" + voseo. Real es-AR voice |
| **Soil-check mode** | Most apps force a calendar; honest "go check the soil" is rare and aligns with succulent expert consensus |
| **10-15 outdoor plants tuned for LATAM** | Catalogs are northern-hemisphere-biased. Adding jacarandá, ceibo, glicina speaks to audience |
| **Hemisphere-aware seasonal copy** | "En invierno regá menos" is wrong if user is in São Paulo entering autumn |
| **Diagnosis "Reabrir" with prior context summary** | When reopening: prepend "Hace 14 días marcaste esta consulta como resuelta. ¿Qué cambió?" |

## Anti-Features (DO NOT build)

| Anti-Feature | Why Avoid |
|--------------|-----------|
| **Lux/light-meter via phone camera** | Phone sensors measure lux for human eyes, not PPFD for photosynthesis. Documented accuracy issues in Photone/PictureThis |
| **5-level or 6-level light system** | Adds cognitive load; RHS/Planta/Greg all use 4 |
| **Humidity/temperature sensor adjustments (in-app)** | Phone sensors unreliable for ambient humidity. Hardware play, defer |
| **Per-month (12-bucket) watering schedule** | Explodes catalog migration cost (60×12=720 cells) for marginal benefit |
| **Auto-rescheduling watering based on weather forecast** | Breaks user trust when forecast wrong |
| **Multi-pot tracking** | Massive scope creep. One Plant = one row |
| **User-configurable seasonal ratio per plant** | Most users don't want to answer this |
| **PPFD/DLI numeric readouts** | Horticulturist-grade; 99% of users don't know what PPFD is |
| **Auto-detect light from room photo** | Visual picker handles in 5 seconds; LLM/Vision call is overkill |
| **Fully automatic season transitions without explanation** | Show seasonal context explicitly: "Estás en época fría — riego cada 14 días" |

## Feature Dependency Graph

```
Location (lat/lon, optional)
  ├── Hemisphere (north/south)
  │     └── Season (warm/cold)
  │           └── Watering interval
  │                 └── Notifications

Light level enum
  ├── Plant create/edit form (visual picker)
  ├── Plant catalog (every entry needs lightLevel)
  ├── Plant identification result mapping (PlantNet → lightLevel)
  └── Diagnosis context

Watering mode (fixed | soil_check)
  ├── Notification copy ("regar" vs "revisá el sustrato")
  ├── Hoy task generation
  └── Catalog defaults (cactus, suculenta, echeveria, haworthia, sedum → soil_check)

Diagnosis continuity (no new dep)
  ├── Continue button always visible
  ├── Resolved → "Reabrir consulta"
  └── (optional) Reopen-context summary
```

**Critical path:** Location → Season → Seasonal watering. If location skipped, fall back to warm-season schedule with banner explaining "configurá ubicación para precisión estacional".

## Catalog Gaps (Argentina/LATAM Outdoor)

Currently in catalog: rosa, bougainvillea, hibisco, hortensia, jazmín, lavanda (angustifolia), petunia, geranio, margarita.

**Suggested 10-15 additions (priority order):**

| Plant | Scientific | Why |
|-------|------------|-----|
| Jacarandá | Jacaranda mimosifolia | Iconic to BA (November bloom) |
| Gardenia | Gardenia jasminoides | Commonly requested; tricky care = high catalog value |
| Azalea | Rhododendron simsii | Classic patio plant |
| Camelia | Camellia japonica | Popular winter bloomer in BA |
| Dalia | Dahlia spp. | Summer staple, tuber storage tips |
| Glicina | Wisteria sinensis | Iconic trepadora |
| Salvia ornamental | Salvia splendens | Pollinator garden trend, drought-tolerant |
| Ceibo | Erythrina crista-galli | Argentina's national flower |
| Cala | Zantedeschia aethiopica | Semi-shade preference fills category gap |
| Copete (Tagetes) | Tagetes patula | Companion planting with huerta |
| Verbena | Verbena bonariensis | Native, pollinator-friendly |
| Lavanda francesa | Lavandula stoechas | **Variety split** (cold tolerance differs by 3 zones) |
| Lavanda dentada | Lavandula dentata | **Variety split** |
| Romero rastrero | Rosmarinus officinalis 'Prostratus' | Popular balcony variety |
| Tomate cherry | Solanum lycopersicum cerasiforme | Differs from "tomatera" enough (smaller pots, indeterminate) |

**Lavender variety split — YES, worth separate entries:** angustifolia (cold-hardy zones 5-8) vs stoechas (zones 8-9, drought-tolerant) vs dentata (zones 8-10). Cold tolerance differs by 3 zones → heat/frost alert thresholds genuinely change.

## Watering Ratio Reference (warm:cold)

Defensible defaults per category for catalog migration.

| Category | Warm | Cold | Ratio | Mode |
|----------|------|------|-------|------|
| Tropical houseplant (Monstera, Filodendro, Potus) | 7d | 14d | 1:2 | fixed |
| Sensitive tropical (Calathea, Espatifilo) | 4-5d | 7d | 1:1.5 | fixed |
| Sturdy houseplant (Sansevieria, Dracaena) | 14d | 21d | 1:1.5 | fixed |
| Mediterranean aromatic (Romero, Tomillo, Orégano) | 7-10d | 14d | 1:1.5 | fixed |
| Tender herb (Albahaca, Cilantro, Perejil) | 2d | 4d | 1:2 | fixed |
| Garden flower (Rosa, Hortensia, Petunia) | 2-3d | 5-7d | 1:2 | fixed |
| Drought-tolerant outdoor (Lavanda, Bougainvillea) | 7-10d | 14-21d | 1:2 | fixed |
| Citrus (Limonero, Naranjo) | 5d | 10d | 1:2 | fixed |
| Suculenta/Echeveria/Haworthia/Sedum | n/a | n/a | — | **soil_check** |
| Cactus | n/a | n/a | — | **soil_check** |
| Aloe Vera | 14d | 30d | 1:2 | soil_check (more honest) |
| Jade (Crassula) | 14d | 30+d | 1:2+ | soil_check |

## Implications for Roadmap

1. **Schema + types** (small) — Foundation
2. **Hemisphere/season utility + location skip** (small) — No catalog dependency
3. **Watering logic refactor** (medium) — Must continue to render correctly
4. **Light picker UI** (small-medium)
5. **Catalog migration** (medium, parallelizable with #4) — Largest by line count, mostly mechanical
6. **Diagnosis continuity** (small) — Independent, could ship as quick win

**Phases 1-3 critical path. Phase 6 (diagnosis) small + independent — could ship first.**

## Sources

- Planta: getplanta.com (watering algorithm, seasonal adjustment)
- Soltech, Greenery Unlimited, Patch — 4-level light nomenclature
- Photone (growlightmeter.com), Greg.app community — lux camera accuracy critique
- Cactus Outlet, Succulent Plant Care, Planet Desert — soil-check consensus
- Gardener's Path, Gardenia.net, UC Master Gardener — lavender variety split
- Argentina.travel, Garden Travel Hub — LATAM catalog gaps
- UserOnboard, Appcues, AppSamurai 2025 — location-skip patterns
- PatternFly, aiuxdesign.guide — chatbot conversation history patterns
