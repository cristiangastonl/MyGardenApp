import { useMemo, useState, useCallback } from 'react';
import { seasonalThemes, SeasonalPalette, SeasonKey } from '../theme';
import { getCurrentSeason } from '../utils/tipSelector';
import { Location } from '../types';

// Dev override — shared across hook instances
let devSeasonOverride: SeasonKey | null = null;
let devListeners: Array<() => void> = [];

export function setDevSeasonOverride(season: SeasonKey | null) {
  devSeasonOverride = season;
  devListeners.forEach((l) => l());
}

export function getDevSeasonOverride(): SeasonKey | null {
  return devSeasonOverride;
}

export interface SeasonInfo {
  season: SeasonKey;
  palette: SeasonalPalette;
}

export function useSeason(location: Location | null): SeasonInfo {
  const [, forceUpdate] = useState(0);

  // Subscribe to dev override changes
  useMemo(() => {
    if (!__DEV__) return;
    const listener = () => forceUpdate((n) => n + 1);
    devListeners.push(listener);
    return () => {
      devListeners = devListeners.filter((l) => l !== listener);
    };
  }, []);

  return useMemo(() => {
    const season = devSeasonOverride ?? (getCurrentSeason(location?.lat ?? null) as SeasonKey);
    return {
      season,
      palette: seasonalThemes[season],
    };
  }, [location, devSeasonOverride]);
}
