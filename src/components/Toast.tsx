import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';

export interface ToastProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  onDismiss?: () => void;
}

/**
 * Generic app-wide Toast primitive.
 * Phase 18 consumer: swipe-to-delete undo flow (PlantsScreen + TodayScreen).
 * Phase 22 consumer (forward-looking): GAM-01 celebration toasts.
 *
 * Skeleton landed in Plan 18-01 (Wave 0 scaffold). Full implementation
 * (Reanimated v4 slide-in, accessibilityLiveRegion, action button, auto-dismiss)
 * lands in Plan 18-02. Do NOT consume Toast at runtime until Plan 18-02 is complete.
 */
export function Toast(props: ToastProps): React.ReactElement | null {
  // SKELETON — Plan 18-02 replaces with full Reanimated impl.
  // Exporting a no-op render keeps the module loadable for tsc + smoke baseline.
  if (!props.visible) return null;
  return (
    <View
      style={styles.toast}
      pointerEvents="auto"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.message}>{props.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.fabClearance,
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
});
