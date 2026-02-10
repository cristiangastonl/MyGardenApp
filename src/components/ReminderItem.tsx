import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Reminder } from '../types';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface ReminderItemProps {
  reminder: Reminder;
  onToggle: () => void;
  onDelete: () => void;
}

export function ReminderItem({ reminder, onToggle, onDelete }: ReminderItemProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        <Text style={styles.checkIcon}>{reminder.done ? '✓' : ''}</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.text, reminder.done && styles.textDone]}>
          {reminder.text}
        </Text>
        {reminder.time && (
          <Text style={styles.time}>{reminder.time}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  checkbox: ViewStyle;
  checkIcon: TextStyle;
  content: ViewStyle;
  text: TextStyle;
  textDone: TextStyle;
  time: TextStyle;
  deleteButton: ViewStyle;
  deleteIcon: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkIcon: {
    fontSize: 14,
    color: colors.green,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
});
