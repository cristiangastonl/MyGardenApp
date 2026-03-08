import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fonts } from '../theme';
import { getDaysFull, getMonths } from '../data/constants';

interface HeaderProps {
  userName: string | null;
  onSettingsPress: () => void;
  seasonIcon?: string;
  seasonLabel?: string;
}

export function Header({ userName, onSettingsPress, seasonIcon, seasonLabel }: HeaderProps) {
  const { t } = useTranslation();
  const today = new Date();
  const dayName = getDaysFull()[today.getDay()];
  const day = today.getDate();
  const month = getMonths()[today.getMonth()];

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.dateRow}>
          <Text style={styles.date}>
            {t('header.dateFormat', { dayName, day, month })}
          </Text>
          {seasonIcon && seasonLabel && (
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonIcon}>{seasonIcon}</Text>
              <Text style={styles.seasonLabel}>{seasonLabel}</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>
          {userName ? t('header.hello', { name: userName }) : t('header.appName')}
        </Text>
      </View>
      <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
        <Text style={styles.settingsIcon}>{'\u2699\uFE0F'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  left: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  seasonIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  seasonLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
});
