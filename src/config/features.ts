export const Features = {
  // MVP (enabled)
  WEATHER_ALERTS: true,
  HEALTH_SCORE: true,
  DAILY_TIPS: true,
  NOTIFICATIONS_BASIC: true,
  PLANT_CATALOG: true,
  PREMIUM_GATE: true,

  // V1.1 (disabled)
  AUTH: false,
  CLOUD_SYNC: false,
  CALENDAR_TAB: false,
  EXPLORE_TAB: false,
  PLANT_IDENTIFICATION: false,
  PHOTO_UPLOAD: false,
  FULL_CATALOG: false,
  NOTIFICATIONS_ADVANCED: false,

  // V1.2 (disabled)
  DLC_KITCHEN_GARDEN: false,
  DLC_PEST_DIAGNOSIS: false,
  AFFILIATE_LINKS: false,
  REFERRAL_SYSTEM: false,
  HOME_WIDGETS: false,

  // V2.0 (disabled)
  DLC_SEASONAL_PREP: false,
  DLC_ADVANCED_DIAGNOSTICS: false,
  PLANT_COMPATIBILITY: false,
  CARE_STREAKS: false,
  SPONSORED_TIPS: false,
  MULTIPLE_GARDENS: false,
} as const;

export function isEnabled(flag: keyof typeof Features): boolean {
  return Features[flag];
}
