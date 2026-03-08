import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SeasonKey, seasonalThemes } from '../theme';
import { setDevSeasonOverride, getDevSeasonOverride } from '../hooks/useSeason';
import { colors, fonts, spacing, borderRadius } from '../theme';

const SEASONS: SeasonKey[] = ['spring', 'summer', 'fall', 'winter'];

export function SeasonDevSelector() {
  if (!__DEV__) return null;

  const [current, setCurrent] = useState<SeasonKey | null>(getDevSeasonOverride());
  const [collapsed, setCollapsed] = useState(true);

  const handleSelect = (season: SeasonKey | null) => {
    setDevSeasonOverride(season);
    setCurrent(season);
  };

  if (collapsed) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setCollapsed(false)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>
          {current ? seasonalThemes[current].icon : '🔄'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {SEASONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.button,
              current === s && styles.buttonActive,
              { borderColor: seasonalThemes[s].accent },
            ]}
            onPress={() => handleSelect(s)}
          >
            <Text style={styles.icon}>{seasonalThemes[s].icon}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.button, current === null && styles.buttonActive]}
          onPress={() => {
            handleSelect(null);
            setCollapsed(true);
          }}
        >
          <Text style={styles.resetText}>Auto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
  },
  floatingButtonText: {
    fontSize: 18,
  },
  container: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    borderColor: colors.green,
    backgroundColor: colors.successBg,
  },
  icon: {
    fontSize: 16,
  },
  resetText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.textSecondary,
  },
});
