import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { REVENUECAT_API_KEY, ENTITLEMENT_ID, PRODUCT_IDS } from '../constants/config';
import { trackEvent } from './analyticsService';

// ─── Types ───────────────────────────────────────────────────────

export interface ProductOffering {
  identifier: string;
  priceString: string;
  period: string | null;
  trialDays: number;
}

export interface Offerings {
  annual: ProductOffering;
  lifetime: ProductOffering;
}

export interface PaymentService {
  initialize(): Promise<void>;
  getOfferings(): Promise<Offerings | null>;
  purchaseAnnual(): Promise<boolean>;
  purchaseLifetime(): Promise<boolean>;
  restorePurchases(): Promise<boolean>;
  checkPremiumStatus(): Promise<boolean>;
  /** Dev only — directly set/unset premium (mock mode) */
  mockSetPremium?(value: boolean): Promise<void>;
}

// Callback set by PremiumProvider so both implementations can push status changes
let onPremiumStatusChange: ((isPremium: boolean) => void) | null = null;

export function setOnPremiumStatusChange(cb: (isPremium: boolean) => void) {
  onPremiumStatusChange = cb;
}

function notifyPremiumChange(value: boolean) {
  onPremiumStatusChange?.(value);
}

// ─── Mock Implementation (Expo Go) ──────────────────────────────

const MOCK_PREMIUM_KEY = '@mock_premium';

const MockPaymentService: PaymentService = {
  async initialize() {
    console.log('[Payments] Using mock payment service (Expo Go detected)');
    const stored = await AsyncStorage.getItem(MOCK_PREMIUM_KEY);
    if (stored === 'true') {
      notifyPremiumChange(true);
    }
  },

  async getOfferings(): Promise<Offerings> {
    return {
      annual: {
        identifier: PRODUCT_IDS.ANNUAL,
        priceString: '$29.99',
        period: 'P1Y',
        trialDays: 7,
      },
      lifetime: {
        identifier: PRODUCT_IDS.LIFETIME,
        priceString: '$69.99',
        period: null,
        trialDays: 0,
      },
    };
  },

  async purchaseAnnual(): Promise<boolean> {
    trackEvent('purchase_started', { product: PRODUCT_IDS.ANNUAL, mock: true });
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));
    await AsyncStorage.setItem(MOCK_PREMIUM_KEY, 'true');
    notifyPremiumChange(true);
    trackEvent('purchase_completed', { product: PRODUCT_IDS.ANNUAL, mock: true });
    return true;
  },

  async purchaseLifetime(): Promise<boolean> {
    trackEvent('purchase_started', { product: PRODUCT_IDS.LIFETIME, mock: true });
    await new Promise((r) => setTimeout(r, 1500));
    await AsyncStorage.setItem(MOCK_PREMIUM_KEY, 'true');
    notifyPremiumChange(true);
    trackEvent('purchase_completed', { product: PRODUCT_IDS.LIFETIME, mock: true });
    return true;
  },

  async restorePurchases(): Promise<boolean> {
    trackEvent('restore_started', { mock: true });
    await new Promise((r) => setTimeout(r, 1000));
    const stored = await AsyncStorage.getItem(MOCK_PREMIUM_KEY);
    const isPremium = stored === 'true';
    notifyPremiumChange(isPremium);
    trackEvent('restore_completed', { found: isPremium, mock: true });
    return isPremium;
  },

  async checkPremiumStatus(): Promise<boolean> {
    const stored = await AsyncStorage.getItem(MOCK_PREMIUM_KEY);
    const isPremium = stored === 'true';
    notifyPremiumChange(isPremium);
    return isPremium;
  },

  async mockSetPremium(value: boolean) {
    if (value) {
      await AsyncStorage.setItem(MOCK_PREMIUM_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(MOCK_PREMIUM_KEY);
    }
    notifyPremiumChange(value);
  },
};

// ─── Real Implementation (EAS builds) ───────────────────────────

function createRealPaymentService(): PaymentService {
  // Dynamic import — react-native-purchases only available in EAS builds
  let Purchases: any = null;

  return {
    async initialize() {
      try {
        Purchases = require('react-native-purchases').default;
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        // Listen for external changes (cancel/renew from outside the app)
        Purchases.addCustomerInfoUpdateListener((info: any) => {
          const hasPremium = !!info.entitlements?.active?.[ENTITLEMENT_ID];
          notifyPremiumChange(hasPremium);
        });

        console.log('[Payments] RevenueCat initialized');
      } catch (e) {
        console.error('[Payments] Failed to initialize RevenueCat:', e);
        // Fall back — we'll check on each call
      }
    },

    async getOfferings(): Promise<Offerings | null> {
      if (!Purchases) return null;
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        if (!current) return null;

        const annualPkg = current.availablePackages.find(
          (p: any) => p.product.identifier === PRODUCT_IDS.ANNUAL
        );
        const lifetimePkg = current.availablePackages.find(
          (p: any) => p.product.identifier === PRODUCT_IDS.LIFETIME
        );

        return {
          annual: annualPkg
            ? {
                identifier: annualPkg.product.identifier,
                priceString: annualPkg.product.priceString,
                period: 'P1Y',
                trialDays: annualPkg.product.introPrice?.periodNumberOfUnits ?? 7,
              }
            : {
                identifier: PRODUCT_IDS.ANNUAL,
                priceString: '$29.99',
                period: 'P1Y',
                trialDays: 7,
              },
          lifetime: lifetimePkg
            ? {
                identifier: lifetimePkg.product.identifier,
                priceString: lifetimePkg.product.priceString,
                period: null,
                trialDays: 0,
              }
            : {
                identifier: PRODUCT_IDS.LIFETIME,
                priceString: '$69.99',
                period: null,
                trialDays: 0,
              },
        };
      } catch (e) {
        console.error('[Payments] getOfferings error:', e);
        return null;
      }
    },

    async purchaseAnnual(): Promise<boolean> {
      if (!Purchases) return false;
      trackEvent('purchase_started', { product: PRODUCT_IDS.ANNUAL });
      try {
        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.availablePackages.find(
          (p: any) => p.product.identifier === PRODUCT_IDS.ANNUAL
        );
        if (!pkg) throw new Error('Annual package not found');

        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        notifyPremiumChange(hasPremium);
        if (hasPremium) {
          trackEvent('purchase_completed', { product: PRODUCT_IDS.ANNUAL });
        }
        return hasPremium;
      } catch (e: any) {
        if (!e.userCancelled) {
          trackEvent('purchase_failed', { product: PRODUCT_IDS.ANNUAL, error: e.message });
          console.error('[Payments] purchaseAnnual error:', e);
        }
        return false;
      }
    },

    async purchaseLifetime(): Promise<boolean> {
      if (!Purchases) return false;
      trackEvent('purchase_started', { product: PRODUCT_IDS.LIFETIME });
      try {
        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.availablePackages.find(
          (p: any) => p.product.identifier === PRODUCT_IDS.LIFETIME
        );
        if (!pkg) throw new Error('Lifetime package not found');

        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        notifyPremiumChange(hasPremium);
        if (hasPremium) {
          trackEvent('purchase_completed', { product: PRODUCT_IDS.LIFETIME });
        }
        return hasPremium;
      } catch (e: any) {
        if (!e.userCancelled) {
          trackEvent('purchase_failed', { product: PRODUCT_IDS.LIFETIME, error: e.message });
          console.error('[Payments] purchaseLifetime error:', e);
        }
        return false;
      }
    },

    async restorePurchases(): Promise<boolean> {
      if (!Purchases) return false;
      trackEvent('restore_started', {});
      try {
        const customerInfo = await Purchases.restorePurchases();
        const hasPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        notifyPremiumChange(hasPremium);
        trackEvent('restore_completed', { found: hasPremium });
        return hasPremium;
      } catch (e) {
        console.error('[Payments] restorePurchases error:', e);
        return false;
      }
    },

    async checkPremiumStatus(): Promise<boolean> {
      if (!Purchases) return false;
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        notifyPremiumChange(hasPremium);
        return hasPremium;
      } catch (e) {
        console.error('[Payments] checkPremiumStatus error:', e);
        return false;
      }
    },
  };
}

// ─── Auto-detect and export ─────────────────────────────────────

function detectEnvironment(): boolean {
  const appOwnership = Constants.appOwnership;
  return appOwnership === 'expo';
}

function createPaymentService(): PaymentService {
  if (detectEnvironment()) {
    return MockPaymentService;
  }

  // In EAS build, try real implementation, fall back to mock if native module missing
  try {
    require('react-native-purchases');
    return createRealPaymentService();
  } catch {
    console.log('[Payments] react-native-purchases not available, using mock');
    return MockPaymentService;
  }
}

export const paymentService = createPaymentService();
