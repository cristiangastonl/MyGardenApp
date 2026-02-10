import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Plant, Note, Reminder } from '../types';
import { colors, spacing, borderRadius, fonts } from '../theme';
import { DAYS_ES } from '../data/constants';
import { formatDate, isSameDay } from '../utils/dates';
import { getTasksForDay } from '../utils/plantLogic';

interface MonthCalendarProps {
  year: number;
  month: number;
  plants: Plant[];
  notes: Record<string, Note[]>;
  reminders: Record<string, Reminder[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function MonthCalendar({
  year,
  month,
  plants,
  notes,
  reminders,
  selectedDate,
  onSelectDate,
}: MonthCalendarProps) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Generate calendar grid
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add empty cells for remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getIndicators = (date: Date) => {
    const dateStr = formatDate(date);
    const tasks = getTasksForDay(plants, date);
    const hasNotes = (notes[dateStr] || []).length > 0;
    const hasReminders = (reminders[dateStr] || []).length > 0;
    const hasWater = tasks.some(t => t.type === 'water');
    const hasSun = tasks.some(t => t.type === 'sun');
    const hasOutdoor = tasks.some(t => t.type === 'outdoor');

    return { hasWater, hasSun, hasOutdoor, hasNotes, hasReminders };
  };

  return (
    <View style={styles.container}>
      {/* Header with day names */}
      <View style={styles.weekRow}>
        {DAYS_ES.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((date, dayIndex) => {
            if (!date) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }

            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const { hasWater, hasSun, hasOutdoor, hasNotes, hasReminders } = getIndicators(date);
            const hasAnyIndicator = hasWater || hasSun || hasOutdoor || hasNotes || hasReminders;

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => onSelectDate(date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {date.getDate()}
                </Text>
                {hasAnyIndicator && (
                  <View style={styles.indicators}>
                    {hasWater && <View style={[styles.dot, styles.dotWater]} />}
                    {hasSun && <View style={[styles.dot, styles.dotSun]} />}
                    {hasOutdoor && <View style={[styles.dot, styles.dotOutdoor]} />}
                    {hasNotes && <View style={[styles.dot, styles.dotNote]} />}
                    {hasReminders && <View style={[styles.dot, styles.dotReminder]} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  weekRow: ViewStyle;
  dayHeader: ViewStyle;
  dayHeaderText: TextStyle;
  dayCell: ViewStyle;
  todayCell: ViewStyle;
  selectedCell: ViewStyle;
  dayText: TextStyle;
  todayText: TextStyle;
  selectedText: TextStyle;
  indicators: ViewStyle;
  dot: ViewStyle;
  dotWater: ViewStyle;
  dotSun: ViewStyle;
  dotOutdoor: ViewStyle;
  dotNote: ViewStyle;
  dotReminder: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dayHeaderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    margin: 2,
  },
  todayCell: {
    backgroundColor: colors.bgSecondary,
  },
  selectedCell: {
    backgroundColor: colors.green,
  },
  dayText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  todayText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.green,
  },
  selectedText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  dotWater: {
    backgroundColor: colors.waterBlue,
  },
  dotSun: {
    backgroundColor: colors.sunGold,
  },
  dotOutdoor: {
    backgroundColor: colors.green,
  },
  dotNote: {
    backgroundColor: colors.warningText,
  },
  dotReminder: {
    backgroundColor: colors.textSecondary,
  },
});
