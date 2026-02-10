import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, fonts } from '../theme';
import { DAYS_FULL, MONTHS_ES } from '../data/constants';

interface HeaderProps {
  userName: string | null;
  onSettingsPress: () => void;
}

export function Header({ userName, onSettingsPress }: HeaderProps) {
  const today = new Date();
  const dayName = DAYS_FULL[today.getDay()];
  const day = today.getDate();
  const month = MONTHS_ES[today.getMonth()];

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.date}>
          {dayName} {day} de {month}
        </Text>
        <Text style={styles.title}>
          {userName ? `Hola ${userName}!` : 'Mi Jardin'}
        </Text>
      </View>
      <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
        <Text style={styles.settingsIcon}>{'\u2699\uFE0F'}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  left: ViewStyle;
  date: TextStyle;
  title: TextStyle;
  settingsButton: ViewStyle;
  settingsIcon: TextStyle;
}

const styles = StyleSheet.create<Styles>({
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
  date: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
