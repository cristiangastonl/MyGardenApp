import { Platform } from 'react-native';

// RevenueCat API keys per platform
const REVENUECAT_IOS_KEY = 'appl_NSBzjMYEBnDMKZnZznHlvFRqwFS';
const REVENUECAT_ANDROID_KEY = 'test_vVUlWrAkGlnisOSgTZBKHXODZDV';

export const REVENUECAT_API_KEY =
  Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

export const ENTITLEMENT_ID = 'premium';

// Product IDs (must match RevenueCat dashboard + App Store / Play Store)
export const PRODUCT_IDS = {
  ANNUAL: 'yearly',
  LIFETIME: 'lifetime',
} as const;
