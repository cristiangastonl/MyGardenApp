/**
 * Phase 7 (LOC-02, LOC-03). Dismissible soft banner for TodayScreen.
 *
 * Appears above the task list (below WeatherWidget — see Pitfall 4 for
 * placement decision: Hoy-tab inside ScrollView, NOT App-level like
 * MigrationBanner) when location === null && climateOverride === 'auto'.
 *
 * Dismiss is per-session via the parent's React state (NOT AsyncStorage —
 * Pitfall 8: banner reappears on relaunch matching CONTEXT.md spec).
 *
 * Light-blue accent matches AddPlantModal prefilledBanner / general "info" tone.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface LocationBannerProps {
  onCtaPress: () => void;
  onDismiss: () => void;
}

export function LocationBanner({ onCtaPress, onDismiss }: LocationBannerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📍</Text>
      <View style={styles.body}>
        <Text style={styles.bodyText}>{t('today.locationBanner.body')}</Text>
      </View>
      <TouchableOpacity
        onPress={onCtaPress}
        style={styles.cta}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{t('today.locationBanner.cta')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.dismiss}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoBg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  body: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 18,
  },
  cta: {
    backgroundColor: colors.infoText,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
  },
  dismiss: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  dismissText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: colors.infoText,
  },
});
