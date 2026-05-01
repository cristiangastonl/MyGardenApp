/**
 * Phase 7 (LIGHT-01, LIGHT-02). 4-card 2×2 light-level picker.
 *
 * Indoor/outdoor branch driven by OUTDOOR_TYPE_IDS from lightLabel.ts (single SSOT;
 * see Phase 6 06-CONTEXT.md). Pass `typeId` from the parent's selected category;
 * suculentas is INDOOR (not in OUTDOOR_TYPE_IDS) per Phase 6 lock.
 *
 * Card touch target ≥ 44pt (Apple HIG); selected = colors.green border + accent bg.
 *
 * Consumed by:
 *  - AddPlantModal (Plan 07-05) — replaces the legacy sunHours numeric input
 *  - IdentificationResults (Plan 07-06) — pre-selected with edge-function returned lightLevel
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LightLevel } from '../types';
import { OUTDOOR_TYPE_IDS } from '../utils/lightLabel';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface LightLevelPickerProps {
  typeId: string;
  value: LightLevel;
  onChange: (level: LightLevel) => void;
}

const LEVELS: readonly LightLevel[] = ['direct', 'bright_indirect', 'medium_indirect', 'low'] as const;

const LEVEL_ICONS: Record<LightLevel, string> = {
  direct: '☀️',
  bright_indirect: '🌤️',
  medium_indirect: '⛅',
  low: '☁️',
};

export function LightLevelPicker({ typeId, value, onChange }: LightLevelPickerProps) {
  const { t } = useTranslation();
  const ns: 'indoor' | 'outdoor' = OUTDOOR_TYPE_IDS.has(typeId) ? 'outdoor' : 'indoor';

  return (
    <View style={styles.grid}>
      {LEVELS.map((level) => {
        const selected = value === level;
        return (
          <TouchableOpacity
            key={level}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange(level)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t(`lightLevel.${ns}.${level}`)}, ${t(`lightLevelHint.${ns}.${level}`)}`}
          >
            <Text style={styles.icon}>{LEVEL_ICONS[level]}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
              {t(`lightLevel.${ns}.${level}`)}
            </Text>
            <Text style={[styles.hint, selected && styles.hintSelected]} numberOfLines={2}>
              {t(`lightLevelHint.${ns}.${level}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexBasis: '48%',
    minHeight: 44,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.infoBg,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  labelSelected: {
    color: colors.green,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  hintSelected: {
    color: colors.textPrimary,
  },
});
