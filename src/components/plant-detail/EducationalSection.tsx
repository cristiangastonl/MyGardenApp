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
import React, { useState, useRef, useEffect } from 'react';
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
  // useAutoHeight: when true the body renders at `height: 'auto'` (natural, never
  // clipped). We only drop to the measured numeric height DURING a collapse/expand
  // transition (so it can animate), then snap back to 'auto' once settled-open. This
  // avoids the "last line clipped" bug when the measured height is a hair short — e.g.
  // the long ¿Por qué? paragraph rendered "...and suck" cut off. Starts at 'auto' when
  // defaultExpanded so there's no expand-animation flicker on modal open.
  const [useAutoHeight, setUseAutoHeight] = useState(defaultExpanded);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
  }, []);
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
    if (expandTimer.current) {
      clearTimeout(expandTimer.current);
      expandTimer.current = null;
    }
    const next = !expanded;
    setExpanded(next);
    // Drive a numeric (measured) height during the transition so it animates...
    setUseAutoHeight(false);
    open.value = next ? 1 : 0;
    // ...then restore 'auto' once fully open so the content is never clipped.
    if (next) {
      expandTimer.current = setTimeout(() => {
        setUseAutoHeight(true);
        expandTimer.current = null;
      }, COLLAPSE_DURATION + 20);
    }
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
      <View style={styles.bodyWrap}>
        {/* Off-layout measuring ghost — an absolutely-positioned, invisible copy of the
            body that always renders at natural height and is never clipped, so its
            onLayout reliably reports the true height on both platforms. The previous
            in-clip onLayout went stale once the section collapsed (height 0), so on
            re-expand `height = measuredHeight` clipped the content to nothing ("se
            borra"). Mirrors the FertilizeCard ghost-measure fix (09f4b79). */}
        <View
          style={styles.ghost}
          pointerEvents="none"
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              measuredHeight.value = h;
            }
          }}
        >
          <View style={styles.bodyContent}>{children}</View>
        </View>
        <Animated.View style={[styles.bodyClip, useAutoHeight ? styles.bodyAuto : bodyStyle]}>
          <View style={styles.bodyContent}>{children}</View>
        </Animated.View>
      </View>
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
  bodyWrap: {
    position: 'relative',
  },
  ghost: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  bodyAuto: {
    height: 'auto',
  },
  bodyContent: {
    paddingTop: spacing.md,
  },
});
