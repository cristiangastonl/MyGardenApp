// src/components/PetToxicityBadge.tsx
// v1.2 Phase 19 (TOX-03) — Per-species toxicity badge for PlantCard headerRight slot.
// Wave 0 SKELETON: props interface + null return until Plan 19-03 ships full impl.

import React from 'react';
import type { ToxLevel } from '../types';

export interface PetToxicityBadgeProps {
  species: 'cats' | 'dogs';
  level: ToxLevel;
  onPress: () => void;
}

export function PetToxicityBadge(_props: PetToxicityBadgeProps): React.ReactElement | null {
  // Skeleton — Plan 19-03 lands the Pressable + emoji + colored stripe impl.
  return null;
}
