import { Features } from './features';

// For MVP, premium is always false. Later this will come from useStorage or a purchase hook.
const isPremium = false;

export function usePremiumGate() {
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
