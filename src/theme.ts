// Design System - Mi Jardín
export const colors = {
  // Backgrounds
  bgPrimary: '#f5f0e6',
  bgSecondary: '#ede7d9',
  bgTertiary: '#e8e0d0',
  card: '#fffdf8',

  // Text
  textPrimary: '#2d3a2e',
  textSecondary: '#8a7e6b',
  textMuted: '#a89e8b',

  // Accents
  green: '#5b9a6a',
  greenDark: '#3a5a3e',
  greenLight: '#7ab87a',

  sunGold: '#f0c040',
  sunDark: '#e8a820',

  waterBlue: '#3a6b8c',
  waterLight: '#e3f0fb',

  // Alerts
  dangerBg: '#fde8e8',
  dangerText: '#7a2d2d',
  dangerBorder: '#e8b4b4',
  warningBg: '#fef9e7',
  warningText: '#7a6a2d',
  warningBorder: '#e8dbb4',
  warningHeaderBg: '#f5ecd0',
  infoBg: '#e8f4fb',
  infoText: '#3a6b8c',
  infoBorder: '#b4d4e8',
  infoHeaderBg: '#d4e8f4',
  successBg: '#f0f7f0',
  successBorder: '#d4e8d4',
  successLight: '#e8f5e8',
  successLightBorder: '#b4e8b4',
  successHeaderBg: '#d4f0d4',

  // Premium / Paywall
  premiumDark: '#4A5A40',
  premiumLight: '#5B6E4E',
  premiumSage: '#7A8B6F',
  premiumSageLight: '#E8EFE4',
  premiumBark: '#3D3229',
  premiumBarkLight: '#6B5D52',
  premiumCream: '#F7F4ED',
  premiumCreamLight: '#FDFBF7',
  premiumTerracotta: '#C4745A',
  premiumLavender: '#EDE8F5',

  // UI
  border: '#e0d8c8',
  borderLight: '#f0ebe0',
  borderSeparator: 'rgba(0,0,0,0.08)',
  white: '#fff',
  whiteOverlay: 'rgba(255,255,255,0.2)',
  whiteSubdued: 'rgba(255,255,255,0.75)',
  overlay: 'rgba(45, 58, 46, 0.4)',
};

export const fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingMedium: 'PlayfairDisplay_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  fabClearance: 100,
};

export const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

export const MIN_TOUCH_SIZE = 44;

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
};
