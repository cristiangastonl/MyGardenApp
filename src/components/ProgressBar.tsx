import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface ProgressBarProps {
  // Original props (for backward compatibility)
  completed?: number;
  total?: number;
  // New props for custom progress bar
  progress?: number; // 0-1
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  completed,
  total,
  progress: progressProp,
  color,
  backgroundColor,
  height,
  showLabel = true,
}: ProgressBarProps) {
  // Support both old and new API
  const progress = progressProp !== undefined
    ? progressProp * 100
    : (total && total > 0 ? (completed || 0) / total * 100 : 0);

  const barHeight = height || 8;
  const fillColor = color || colors.green;
  const bgColor = backgroundColor || colors.bgTertiary;

  // Simple mode (just the bar) when using new props
  if (progressProp !== undefined) {
    return (
      <View style={[styles.barBackground, { height: barHeight, backgroundColor: bgColor }]}>
        <View
          style={[
            styles.barFill,
            { width: `${progress}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
    );
  }

  // Original mode with label
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={[styles.barBackground, { height: barHeight, backgroundColor: bgColor }]}>
          <View
            style={[
              styles.barFill,
              { width: `${progress}%`, backgroundColor: fillColor },
            ]}
          />
        </View>
      </View>
      {showLabel && total !== undefined && (
        <Text style={styles.text}>
          {completed}/{total}
        </Text>
      )}
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  barContainer: ViewStyle;
  barBackground: ViewStyle;
  barFill: ViewStyle;
  text: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: borderRadius.full,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
});
