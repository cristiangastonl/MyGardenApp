import { Features } from './features';
import { usePremium } from '../hooks/usePremium';

export function usePremiumGate() {
  const { isPremium } = usePremium();

  return {
    isPremium,

    canAddPlant(currentCount: number): boolean {
      return isPremium || currentCount < 5;
    },

    canSeeAlerts(): boolean {
      return isPremium;
    },

    canSeeTips(shownToday: number): boolean {
      return isPremium || shownToday < 1;
    },

    canSeeForecast(): boolean {
      return isPremium;
    },

    canSync(): boolean {
      return isPremium && Features.CLOUD_SYNC;
    },

    canIdentify(usedThisMonth: number): boolean {
      return Features.PLANT_IDENTIFICATION && (isPremium || usedThisMonth < 2);
    },

    canAccessDLC(dlcFlag: keyof typeof Features): boolean {
      return Features[dlcFlag] && isPremium;
    },
  };
}
