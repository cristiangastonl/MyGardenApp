// src/components/PetToxicityBadge.tsx
// v1.2 Phase 19 (TOX-03) — Per-species toxicity badge for PlantCard headerRight slot.
//
// Renders Pressable with species emoji + colored severity stripe for 'toxic' / 'caution'.
// Returns null for 'safe' and 'unknown' (badge HIDDEN per CONTEXT.md TOX-03 lock).
//
// Visual hierarchy: subtler than Phase 18 mood emoji's solid-circle treatment.
// Mood emoji = "how this plant is feeling" (continuum); toxicity badge = "fixed safety fact" (binary per-species).

import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, hitSlop } from '../theme';
import type { ToxLevel } from '../types';

export interface PetToxicityBadgeProps {
  species: 'cats' | 'dogs';
  level: ToxLevel;
  onPress: () => void;
}

export function PetToxicityBadge({ species, level, onPress }: PetToxicityBadgeProps): React.ReactElement | null {
  const { t } = useTranslation();

  // Gate: render ONLY for 'toxic' or 'caution' (RESEARCH.md Pattern 3, CONTEXT.md TOX-03 lock).
  if (level !== 'toxic' && level !== 'caution') return null;

  const stripeColor = level === 'toxic' ? colors.dangerText : colors.warningText;
  const emoji = species === 'cats' ? '🐈' : '🐕';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityLabel={t(`toxicity.a11y.${species}.${level}`)}
      accessibilityRole="button"
      style={styles.badge}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create<{ badge: ViewStyle; emoji: TextStyle; stripe: ViewStyle }>({
  badge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emoji: {
    fontSize: 16,
  },
  stripe: {
    width: 16,
    height: 3,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
});
