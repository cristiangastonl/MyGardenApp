import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';

export interface ToastProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;   // default 4000
  onDismiss?: () => void;
}

/**
 * Generic app-wide Toast primitive.
 * Phase 18 consumer: swipe-to-delete undo flow (PlantsScreen + TodayScreen).
 * Phase 22 consumer (forward-looking): GAM-01 celebration toasts.
 *
 * Slide-in from bottom via Reanimated v4. Auto-dismisses on durationMs.
 * Optional action button (e.g., "Undo"). Announces via accessibilityLiveRegion.
 *
 * Placement: render at screen level (PlantsScreen / TodayScreen) — sibling of FlatList.
 */
export function Toast({ visible, message, actionLabel, onAction, durationMs = 4000, onDismiss }: ToastProps) {
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 220 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(80, { duration: 180 });
        opacity.value = withTiming(0, { duration: 180 });
        onDismiss?.();
      }, durationMs);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(80, { duration: 180 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, durationMs, onDismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.toast, animatedStyle]}
      pointerEvents="auto"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.message}>{message}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.fabClearance, // clears bottom tab + ExpandedFAB
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.white, flex: 1 },
  actionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.green, marginLeft: spacing.md },
});
