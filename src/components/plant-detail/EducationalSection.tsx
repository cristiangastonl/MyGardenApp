/**
 * v1.2 Phase 14 (EDU-01). Generic collapsible card wrapper for the 4 educational sections
 * in MyPlantDetailModal. Reanimated v4 worklets — runs on UI thread, no JS jank.
 *
 * Pattern: Pitfall 4 Option A "lazy-measure" — measures content height on first onLayout
 *          when measuredHeight is 0; then animates height + opacity + chevron rotation
 *          tied to a single shared value. Simpler than off-screen measurer (Pattern 6 docs)
 *          and sufficient for the locked "all 4 expanded by default" UX (no rapid toggle).
 *
 * Per-modal-session collapse state via useState — NOT AsyncStorage / useStorage. Reset on close.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';

// Tuned 2026-05-06 from device test: 250ms inOut(ease) felt sluggish ("app feels broken").
// 180ms with out-cubic easing is the iOS/Material standard for "appearing" UI — snappy
// start, gentle settle. Stays within the CONTEXT.md "~250ms" guardrail (planner discretion).
const COLLAPSE_DURATION = 180;

interface EducationalSectionProps {
  emoji: string;
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function EducationalSection({
  emoji,
  title,
  defaultExpanded = true,
  children,
}: EducationalSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
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
  const chevronRotation = useDerivedValue(() =>
    withTiming(open.value * 90, {
      duration: COLLAPSE_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    opacity: opacity.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    open.value = next ? 1 : 0;
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={toggle}
        style={styles.titleRow}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
      >
        <Text style={styles.title}>{emoji} {title}</Text>
        <Animated.Text style={[styles.chevron, chevronStyle]}>›</Animated.Text>
      </Pressable>
      <Animated.View style={[styles.bodyClip, bodyStyle]}>
        <View
          style={styles.bodyContent}
          onLayout={(e) => {
            // Lazy-measure (Pitfall 4 Option A): set on every onLayout when h > 0.
            // Subsequent re-layouts (e.g., children change) update too — UI-thread shared value.
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              measuredHeight.value = h;
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44, // Apple HIG touch target
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  bodyContent: {
    paddingTop: spacing.md,
  },
});
