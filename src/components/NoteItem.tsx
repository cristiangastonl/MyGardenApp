import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Note } from '../types';
import { colors, spacing, borderRadius, fonts } from '../theme';

interface NoteItemProps {
  note: Note;
  onDelete: () => void;
}

export function NoteItem({ note, onDelete }: NoteItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📝</Text>
      <Text style={styles.text} numberOfLines={2}>
        {note.text}
      </Text>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  icon: TextStyle;
  text: TextStyle;
  deleteButton: ViewStyle;
  deleteIcon: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.warningText,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
});
