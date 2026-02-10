import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, fonts, spacing, borderRadius, shadows } from "../theme";
import { Plant, Note, Reminder, Task } from "../types";
import { DAYS_FULL, MONTHS_ES } from "../data/constants";
import { getTasksForDay } from "../utils/plantLogic";
import { parseDate } from "../utils/dates";

interface DayDetailProps {
  visible: boolean;
  dateStr: string;
  plants: Plant[];
  notes: Note[];
  reminders: Reminder[];
  onClose: () => void;
  onAddNote: (dateStr: string, text: string) => void;
  onDeleteNote: (dateStr: string, noteId: string) => void;
  onAddReminder: (dateStr: string, text: string, time: string) => void;
  onDeleteReminder: (dateStr: string, reminderId: string) => void;
  onToggleReminder?: (dateStr: string, reminderId: string) => void;
}

export function DayDetail({
  visible,
  dateStr,
  plants,
  notes,
  reminders,
  onClose,
  onAddNote,
  onDeleteNote,
  onAddReminder,
  onDeleteReminder,
  onToggleReminder,
}: DayDetailProps) {
  const [newNoteText, setNewNoteText] = useState("");
  const [newReminderText, setNewReminderText] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("09:00");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);

  const date = parseDate(dateStr);
  const dayName = DAYS_FULL[date.getDay()];
  const monthName = MONTHS_ES[date.getMonth()];
  const dayNumber = date.getDate();

  const tasks = getTasksForDay(plants, date);

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      onAddNote(dateStr, newNoteText.trim());
      setNewNoteText("");
      setShowNoteForm(false);
    }
  };

  const handleAddReminder = () => {
    if (newReminderText.trim()) {
      onAddReminder(dateStr, newReminderText.trim(), newReminderTime);
      setNewReminderText("");
      setNewReminderTime("09:00");
      setShowReminderForm(false);
    }
  };

  const getTaskIcon = (task: Task): string => {
    switch (task.type) {
      case "water":
        return "💧";
      case "sun":
        return "☀️";
      case "outdoor":
        return "🌤️";
      default:
        return "🌱";
    }
  };

  const getTaskTypeLabel = (type: string): string => {
    switch (type) {
      case "water":
        return "Riego";
      case "sun":
        return "Sol";
      case "outdoor":
        return "Exterior";
      default:
        return "";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.handle} />

            {/* Header with date */}
            <View style={styles.header}>
              <View style={styles.dateInfo}>
                <Text style={styles.dayNumber}>{dayNumber}</Text>
                <View style={styles.dateText}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <Text style={styles.monthYear}>
                    {monthName} {date.getFullYear()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tasks section */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TAREAS DEL DIA</Text>
                {tasks.length > 0 ? (
                  <View style={styles.tasksList}>
                    {tasks.map((task, index) => {
                      const plant = plants.find((p) => p.id === task.plantId);
                      return (
                        <View key={`${task.plantId}-${task.type}-${index}`} style={styles.taskItem}>
                          <View
                            style={[
                              styles.taskIconContainer,
                              task.type === "water" && styles.taskIconWater,
                              task.type === "sun" && styles.taskIconSun,
                              task.type === "outdoor" && styles.taskIconOutdoor,
                            ]}
                          >
                            <Text style={styles.taskIconText}>
                              {getTaskIcon(task)}
                            </Text>
                          </View>
                          <View style={styles.taskInfo}>
                            <Text style={styles.taskLabel}>{task.label}</Text>
                            <Text style={styles.taskType}>
                              {getTaskTypeLabel(task.type)}
                              {task.type === "sun" &&
                                plant &&
                                ` - ${plant.sunHours}h`}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    No hay tareas programadas para este dia
                  </Text>
                )}
              </View>

              {/* Reminders section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>RECORDATORIOS</Text>
                  {!showReminderForm && (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setShowReminderForm(true)}
                    >
                      <Text style={styles.addButtonText}>+ Agregar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {showReminderForm && (
                  <View style={styles.formCard}>
                    <TextInput
                      style={styles.formInput}
                      value={newReminderText}
                      onChangeText={setNewReminderText}
                      placeholder="Recordatorio..."
                      placeholderTextColor={colors.textMuted}
                      autoFocus
                    />
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Hora:</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={newReminderTime}
                        onChangeText={setNewReminderTime}
                        placeholder="09:00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View style={styles.formActions}>
                      <TouchableOpacity
                        style={styles.formCancelButton}
                        onPress={() => {
                          setShowReminderForm(false);
                          setNewReminderText("");
                        }}
                      >
                        <Text style={styles.formCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.formSaveButton,
                          !newReminderText.trim() && styles.formSaveButtonDisabled,
                        ]}
                        onPress={handleAddReminder}
                        disabled={!newReminderText.trim()}
                      >
                        <Text style={styles.formSaveText}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {reminders.length > 0 ? (
                  <View style={styles.remindersList}>
                    {reminders.map((reminder) => (
                      <View key={reminder.id} style={styles.reminderItem}>
                        <TouchableOpacity
                          style={[
                            styles.reminderCheckbox,
                            reminder.done && styles.reminderCheckboxDone,
                          ]}
                          onPress={() =>
                            onToggleReminder?.(dateStr, reminder.id)
                          }
                        >
                          {reminder.done && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                        <View style={styles.reminderContent}>
                          <Text
                            style={[
                              styles.reminderText,
                              reminder.done && styles.reminderTextDone,
                            ]}
                          >
                            {reminder.text}
                          </Text>
                          <Text style={styles.reminderTime}>{reminder.time}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => onDeleteReminder(dateStr, reminder.id)}
                        >
                          <Text style={styles.deleteIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : !showReminderForm ? (
                  <Text style={styles.emptyText}>Sin recordatorios</Text>
                ) : null}
              </View>

              {/* Notes section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>NOTAS</Text>
                  {!showNoteForm && (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setShowNoteForm(true)}
                    >
                      <Text style={styles.addButtonText}>+ Agregar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {showNoteForm && (
                  <View style={styles.formCard}>
                    <TextInput
                      style={[styles.formInput, styles.noteInput]}
                      value={newNoteText}
                      onChangeText={setNewNoteText}
                      placeholder="Escribi tu nota..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      autoFocus
                    />
                    <View style={styles.formActions}>
                      <TouchableOpacity
                        style={styles.formCancelButton}
                        onPress={() => {
                          setShowNoteForm(false);
                          setNewNoteText("");
                        }}
                      >
                        <Text style={styles.formCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.formSaveButton,
                          !newNoteText.trim() && styles.formSaveButtonDisabled,
                        ]}
                        onPress={handleAddNote}
                        disabled={!newNoteText.trim()}
                      >
                        <Text style={styles.formSaveText}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {notes.length > 0 ? (
                  <View style={styles.notesList}>
                    {notes.map((note) => (
                      <View key={note.id} style={styles.noteItem}>
                        <Text style={styles.noteText}>{note.text}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => onDeleteNote(dateStr, note.id)}
                        >
                          <Text style={styles.deleteIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : !showNoteForm ? (
                  <Text style={styles.emptyText}>Sin notas</Text>
                ) : null}
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(45, 58, 46, 0.4)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: "88%",
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayNumber: {
    fontFamily: fonts.heading,
    fontSize: 48,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  dateText: {
    justifyContent: "center",
  },
  dayName: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  monthYear: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  addButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.green,
  },
  tasksList: {
    gap: spacing.sm,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  taskIconWater: {
    backgroundColor: colors.waterLight,
  },
  taskIconSun: {
    backgroundColor: "#fef9e7",
  },
  taskIconOutdoor: {
    backgroundColor: "#e8f4fb",
  },
  taskIconText: {
    fontSize: 20,
  },
  taskInfo: {
    flex: 1,
  },
  taskLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  taskType: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  formCard: {
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  formInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  timeLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  timeInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    width: 80,
    textAlign: "center",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  formCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  formCancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  formSaveButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  formSaveButtonDisabled: {
    opacity: 0.5,
  },
  formSaveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  remindersList: {
    gap: spacing.sm,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reminderCheckbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderCheckboxDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  reminderContent: {
    flex: 1,
  },
  reminderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  reminderTextDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  reminderTime: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  deleteIcon: {
    fontSize: 16,
  },
  notesList: {
    gap: spacing.sm,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing.xxxl,
  },
});
