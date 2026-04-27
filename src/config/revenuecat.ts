import { Platform } from 'react-native';

export const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_NSBzjMYEBnDMKZnZznHlvFRqwFS',
  android: 'goog_LdRPduDNmtqmeEvyDSTuhPLPPeq',
}) as string;
export const ENTITLEMENT_ID = 'premium';

// Product IDs (must match RevenueCat dashboard + App Store / Play Store)
export const PRODUCT_IDS = {
  ANNUAL: 'yearly',
  LIFETIME: 'lifetime',
} as const;
