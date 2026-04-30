import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing } from '../theme';

interface MigrationBannerProps {
  onDismiss?: () => void;
}

/**
 * Non-modal in-place banner shown above MainTabs when migration to v1.1 schema failed
 * on this launch. SCHEMA-07: app remains fully usable; migration retries on next launch.
 *
 * MUST NOT be a modal component — project-wide modal-stacking bug (see CLAUDE.md).
 * This is a plain <View> rendered as a sibling to the navigator so it occupies layout
 * space at the top of the screen instead of overlaying.
 *
 * Plan 07 wires this component into App.tsx; this plan only ships the component.
 */
export function MigrationBanner({ onDismiss }: MigrationBannerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {t('migration.banner.title')}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {t('migration.banner.body')}
        </Text>
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('migration.banner.dismiss')}
          accessibilityRole="button"
        >
          <Text style={styles.dismiss}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 0,
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.warningText,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warningText,
    lineHeight: 18,
  },
  dismiss: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.warningText,
    paddingHorizontal: spacing.sm,
  },
});
