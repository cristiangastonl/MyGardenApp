import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface TaskButtonProps {
  done: boolean;
  onPress: () => void;
  icon: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export function TaskButton({ done, onPress, icon, label, bgColor, textColor }: TaskButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor },
        done && styles.buttonDone,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text
        style={[
          styles.label,
          { color: textColor },
          done && styles.labelDone,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface Styles {
  button: ViewStyle;
  buttonDone: ViewStyle;
  icon: TextStyle;
  label: TextStyle;
  labelDone: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    minHeight: 44,
  },
  buttonDone: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
  labelDone: {
    textDecorationLine: 'line-through',
  },
});
