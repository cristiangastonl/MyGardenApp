import { Features } from './features';
import { usePremium } from '../hooks/usePremium';

const FREE_PLANT_LIMIT = 5;
const FREE_IDENTIFICATION_LIMIT = 2;
const FREE_DIAGNOSIS_LIMIT = 1;
const FREE_CHAT_MESSAGES_PER_DIAGNOSIS = 1;
const FREE_TIPS_TRIAL_DAYS = 7;

function daysSinceInstall(installDate: string | null): number {
  if (!installDate) return Infinity;
  const install = new Date(installDate);
  const now = new Date();
  const diff = now.getTime() - install.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function usePremiumGate() {
  const { isPremium } = usePremium();

  return {
    isPremium,

    canAddPlant(currentCount: number): boolean {
      return isPremium || currentCount < FREE_PLANT_LIMIT;
    },

    canSeeAlerts(): boolean {
      // All users see all alerts — this is core functionality
      return true;
    },

    canSeeTips(shownToday: number, installDate: string | null): boolean {
      if (isPremium) return true;
      // First week: unlimited tips
      if (daysSinceInstall(installDate) < FREE_TIPS_TRIAL_DAYS) return true;
      return shownToday < 1;
    },

    canSeeForecast(): boolean {
      // Basic forecast visible for all, premium gets extended
      return true;
    },

    canSync(): boolean {
      return isPremium && Features.CLOUD_SYNC;
    },

    canIdentify(identificationCount: number): boolean {
      if (!Features.PLANT_IDENTIFICATION) return false;
      return isPremium || identificationCount < FREE_IDENTIFICATION_LIMIT;
    },

    canDiagnose(diagnosisCount: number): boolean {
      if (!Features.DLC_PEST_DIAGNOSIS) return false;
      return isPremium || diagnosisCount < FREE_DIAGNOSIS_LIMIT;
    },

    canChatDiagnosis(userMessageCount: number): boolean {
      if (!Features.DLC_PEST_DIAGNOSIS) return false;
      return isPremium || userMessageCount < FREE_CHAT_MESSAGES_PER_DIAGNOSIS;
    },

    canAccessDLC(dlcFlag: keyof typeof Features): boolean {
      return Features[dlcFlag] && isPremium;
    },
  };
}
