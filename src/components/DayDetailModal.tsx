import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Plant, Note, Reminder } from '../types';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
import { DAYS_FULL, MONTHS_ES } from '../data/constants';
import { formatDate } from '../utils/dates';
import { getTasksForDay } from '../utils/plantLogic';
import { TaskButton } from './TaskButton';
import { ReminderItem } from './ReminderItem';
import { NoteItem } from './NoteItem';

interface DayDetailModalProps {
  visible: boolean;
  date: Date;
  plants: Plant[];
  notes: Note[];
  reminders: Reminder[];
  onClose: () => void;
  onWater: (plantId: string) => void;
  onSunDone: (plantId: string) => void;
  onOutdoorDone: (plantId: string) => void;
  onAddNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onAddReminder: (text: string, time: string) => void;
  onToggleReminder: (reminderId: string, done: boolean) => void;
  onDeleteReminder: (reminderId: string) => void;
}

export function DayDetailModal({
  visible,
  date,
  plants,
  notes,
  reminders,
  onClose,
  onWater,
  onSunDone,
  onOutdoorDone,
  onAddNote,
  onDeleteNote,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}: DayDetailModalProps) {
  const [newNote, setNewNote] = useState('');
  const [newReminder, setNewReminder] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showReminderInput, setShowReminderInput] = useState(false);

  const dateStr = formatDate(date);
  const tasks = getTasksForDay(plants, date);
  const dayName = DAYS_FULL[date.getDay()];
  const monthName = MONTHS_ES[date.getMonth()];

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setShowNoteInput(false);
    }
  };

  const handleAddReminder = () => {
    if (newReminder.trim()) {
      onAddReminder(newReminder.trim(), '');
      setNewReminder('');
      setShowReminderInput(false);
    }
  };

  const getPlantForTask = (plantId: string) => plants.find(p => p.id === plantId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View>
                <Text style={styles.dayName}>{dayName}</Text>
                <Text style={styles.dateText}>
                  {date.getDate()} de {monthName}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Tasks */}
              {tasks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>TAREAS</Text>
                  {tasks.map((task, index) => {
                    const plant = getPlantForTask(task.plantId);
                    if (!plant) return null;

                    const isDone =
                      (task.type === 'water' && plant.lastWatered === dateStr) ||
                      (task.type === 'sun' && plant.sunDoneDate === dateStr) ||
                      (task.type === 'outdoor' && plant.outdoorDoneDate === dateStr);

                    const handlePress = () => {
                      if (task.type === 'water') onWater(task.plantId);
                      else if (task.type === 'sun') onSunDone(task.plantId);
                      else if (task.type === 'outdoor') onOutdoorDone(task.plantId);
                    };

                    return (
                      <TaskButton
                        key={`${task.type}-${task.plantId}-${index}`}
                        done={isDone}
                        onPress={handlePress}
                        icon={task.icon}
                        label={task.label}
                        bgColor={
                          task.type === 'water'
                            ? colors.waterLight
                            : task.type === 'sun'
                            ? colors.warningBg
                            : colors.infoBg
                        }
                        textColor={
                          task.type === 'water'
                            ? colors.waterBlue
                            : task.type === 'sun'
                            ? colors.sunDark
                            : colors.infoText
                        }
                      />
                    );
                  })}
                </View>
              )}

              {/* Reminders */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>RECORDATORIOS</Text>
                  <TouchableOpacity onPress={() => setShowReminderInput(true)}>
                    <Text style={styles.addButton}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>

                {showReminderInput && (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nuevo recordatorio..."
                      placeholderTextColor={colors.textMuted}
                      value={newReminder}
                      onChangeText={setNewReminder}
                      onSubmitEditing={handleAddReminder}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.inputButton} onPress={handleAddReminder}>
                      <Text style={styles.inputButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {reminders.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={() => onToggleReminder(reminder.id, !reminder.done)}
                    onDelete={() => onDeleteReminder(reminder.id)}
                  />
                ))}

                {reminders.length === 0 && !showReminderInput && (
                  <Text style={styles.emptyText}>No hay recordatorios</Text>
                )}
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>NOTAS</Text>
                  <TouchableOpacity onPress={() => setShowNoteInput(true)}>
                    <Text style={styles.addButton}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>

                {showNoteInput && (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nueva nota..."
                      placeholderTextColor={colors.textMuted}
                      value={newNote}
                      onChangeText={setNewNote}
                      onSubmitEditing={handleAddNote}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.inputButton} onPress={handleAddNote}>
                      <Text style={styles.inputButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onDelete={() => onDeleteNote(note.id)}
                  />
                ))}

                {notes.length === 0 && !showNoteInput && (
                  <Text style={styles.emptyText}>No hay notas</Text>
                )}
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface Styles {
  overlay: ViewStyle;
  keyboardView: ViewStyle;
  container: ViewStyle;
  handle: ViewStyle;
  header: ViewStyle;
  dayName: TextStyle;
  dateText: TextStyle;
  closeButton: ViewStyle;
  closeIcon: TextStyle;
  content: ViewStyle;
  section: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  addButton: TextStyle;
  inputRow: ViewStyle;
  input: TextStyle;
  inputButton: ViewStyle;
  inputButtonText: TextStyle;
  emptyText: TextStyle;
  bottomPadding: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '80%',
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dayName: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 32,
    color: colors.textMuted,
    lineHeight: 32,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  addButton: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.green,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  inputButton: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  inputButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: spacing.xxxl,
  },
});
