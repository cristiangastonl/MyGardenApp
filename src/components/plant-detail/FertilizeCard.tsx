// src/components/plant-detail/FertilizeCard.tsx
//
// v1.2 Phase 20 (FERT-06) — Two-column water | fertilize layout inside the existing
// 🌿 ¿Qué hacer? section of MyPlantDetailModal. Skeleton at Wave 0; real implementation
// (Reanimated v4 collapse + tap-to-expand + recipe rendering) lands in Plan 20-04.
//
// At Wave 0 baseline this component returns null — it is imported nowhere yet, but the
// file must exist for smoke-phase20.cjs W0.scaffold.FertilizeCard.file-exists assertion
// AND the FERT-06.FertilizeCard.reanimated-primitives SKIP placeholder.

import React from 'react';
import type { PlantDBEntry } from '../../types';
import type { WaterSeason } from '../../utils/seasonality';

export interface FertilizeCardProps {
  strictDbEntry: PlantDBEntry | null;
  season: WaterSeason;
  /** One-shot signal from MyPlantDetailModal initialExpanded prop. */
  defaultExpanded?: boolean;
  /** Style override for half-width vs full-width layout (computed by caller). */
  style?: any;
}

export function FertilizeCard(_props: FertilizeCardProps): React.ReactElement | null {
  // Skeleton — returns null until Plan 20-04 lands real impl with Reanimated v4 collapse.
  return null;
}
