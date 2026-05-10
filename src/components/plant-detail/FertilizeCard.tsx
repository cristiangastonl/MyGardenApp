/**
 * v1.2 Phase 20 (FERT-06). Collapsible mini-card for the fertilize sub-block inside
 * MyPlantDetailModal's `🌿 ¿Qué hacer?` section.
 *
 * Composes the same Reanimated v4 primitives as EducationalSection.tsx (180ms
 * Easing.out(Easing.cubic) — tuned 2026-05-06 device test; NOT 250ms even though
 * 20-CONTEXT.md says so — see RESEARCH §State of the Art Open Question 1).
 *
 * Header always visible (frequency teaser); body collapsed by default unless
 * defaultExpanded=true (one-shot from MyPlantDetailModal's initialExpanded prop).
 * Tap header → toggle.
 *
 * Per-modal-session expand state via useState — NOT AsyncStorage (Phase 14 precedent).
 * Modal close + reopen resets the prop to undefined; expand state resets accordingly.
 *
 * Pitfall 4 averted (lazy-measure + hasInteracted gate): while !hasInteracted, body
 * renders with `height: 'auto'` so RN measures naturally on Android; after first toggle
 * the animated height takes over driven by measuredHeight + open shared values.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../../theme';
import type { Plant, PlantDBEntry } from '../../types';
import type { WaterSeason } from '../../utils/seasonality';
import { getSeasonalFertilizeInterval } from '../../utils/plantLogic';

// Mirrors EducationalSection.tsx — see RESEARCH §State of the Art Open Question 1.
// 250ms quoted in 20-CONTEXT.md is a stale guardrail — 180ms is the tuned in-repo value.
const COLLAPSE_DURATION = 180;

export interface FertilizeCardProps {
  strictDbEntry: PlantDBEntry | null;
  /** Per-locale resolver — caller passes the result of getTranslatedPlant for industrial / homemade text. */
  industrialText?: string;
  homemadeText?: string;
  season: WaterSeason;
  /** One-shot signal from MyPlantDetailModal initialExpanded prop. */
  defaultExpanded?: boolean;
  /** Style override for half-width vs full-width layout (computed by caller). */
  style?: StyleProp<ViewStyle>;
}

export function FertilizeCard({
  strictDbEntry,
  industrialText,
  homemadeText,
  season,
  defaultExpanded = false,
  style,
}: FertilizeCardProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hasInteracted, setHasInteracted] = useState(false);
  const measuredHeight = useSharedValue(0);
  const open = useSharedValue(defaultExpanded ? 1 : 0);

  const derivedHeight = useDerivedValue(() =>
    withTiming(measuredHeight.value * open.value, {
      duration: COLLAPSE_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  );
  const opacity = useDerivedValue(() =>
    withTiming(open.value, {
      duration: COLLAPSE_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  );
  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    opacity: opacity.value,
  }));

  const toggle = () => {
    if (!hasInteracted) setHasInteracted(true);
    const next = !expanded;
    setExpanded(next);
    open.value = next ? 1 : 0;
  };

  if (!strictDbEntry) return null;

  // Pass an empty plant — getSeasonalFertilizeInterval falls through to catalog branch
  // when plant.fertilizeSchedule.intervalDays is missing. The card's purpose is to display
  // catalog-driven frequency + recipes; per-plant override (if any) is reflected via the
  // catalog interval lookup ladder in plantLogic.
  const interval = getSeasonalFertilizeInterval(
    {} as Plant,
    strictDbEntry,
    season
  );

  // Cold-season dormancy: render dormancy hint instead of frequency teaser.
  if (interval == null) {
    return (
      <View style={[styles.card, style]}>
        <Text style={styles.header}>🌱 {t('plantDetailModal.fertilizeDormant')}</Text>
      </View>
    );
  }

  const seasonKey = season === 'cold' ? 'cold' : season === 'tropical' ? 'tropical' : 'warm';
  const headerText = t('plantDetailModal.fertilizeEvery', {
    days: interval,
    season: t(`plantDetail.seasonBadge.${seasonKey}`),
  });

  const hasIndustrial = !!industrialText;
  const hasHomemade = !!homemadeText;
  const hasBody = hasIndustrial || hasHomemade;

  return (
    <View style={[styles.card, style]}>
      <Pressable
        onPress={hasBody ? toggle : undefined}
        accessibilityRole={hasBody ? 'button' : undefined}
        accessibilityState={hasBody ? { expanded } : undefined}
        accessibilityLabel={t('plantDetailModal.fertilize') + ' ' + headerText}
      >
        <Text style={styles.header}>🌱 {headerText}{hasBody ? ' ›' : ''}</Text>
      </Pressable>
      {hasBody && (
        <Animated.View style={[styles.bodyClip, hasInteracted ? bodyStyle : styles.bodyAuto]}>
          <View
            style={styles.bodyContent}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) measuredHeight.value = h;
            }}
          >
            {hasIndustrial && (
              <Text style={styles.recipe}>🧪 {industrialText}</Text>
            )}
            {hasHomemade && (
              <Text style={styles.recipe}>🏡 {homemadeText}</Text>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,0,0,0.03)', // mirrors nutrientsCardEdu nested-card pattern from Phase 14
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.green,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  bodyAuto: {
    height: 'auto',
  },
  bodyContent: {
    paddingTop: spacing.sm,
  },
  recipe: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
