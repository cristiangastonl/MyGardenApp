import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
import { useStorage } from '../hooks/useStorage';
import { MONTHS_ES } from '../data/constants';
import { formatDate } from '../utils/dates';
import { Note, Reminder } from '../types';
import {
  MonthCalendar,
  DayDetailModal,
} from '../components';

export default function CalendarScreen() {
  const {
    plants,
    notes,
    reminders,
    loading,
    updatePlant,
    addNote,
    deleteNote,
    addReminder,
    deleteReminder,
  } = useStorage();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const goToPreviousMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }, [viewMonth, viewYear]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }, [viewMonth, viewYear]);

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
    setShowDayDetail(true);
  }, [today]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetail(true);
  };

  const handleCloseDayDetail = () => {
    setShowDayDetail(false);
  };

  // Day detail handlers
  const handleWater = (plantId: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      updatePlant(plantId, { lastWatered: dateStr });
    }
  };

  const handleSunDone = (plantId: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      const plant = plants.find(p => p.id === plantId);
      if (plant) {
        updatePlant(plantId, {
          sunDoneDate: plant.sunDoneDate === dateStr ? null : dateStr
        });
      }
    }
  };

  const handleOutdoorDone = (plantId: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      const plant = plants.find(p => p.id === plantId);
      if (plant) {
        updatePlant(plantId, {
          outdoorDoneDate: plant.outdoorDoneDate === dateStr ? null : dateStr
        });
      }
    }
  };

  const handleAddNote = (text: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      const newNote: Note = {
        id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
      };
      addNote(dateStr, newNote);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      deleteNote(dateStr, noteId);
    }
  };

  const handleAddReminder = (text: string, time: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      const newReminder: Reminder = {
        id: Date.now().toString(),
        text,
        time,
        done: false,
      };
      addReminder(dateStr, newReminder);
    }
  };

  const handleToggleReminder = (reminderId: string, done: boolean) => {
    // For now we don't have update reminder functionality
    console.log('Toggle reminder', reminderId, done);
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (selectedDate) {
      const dateStr = formatDate(selectedDate);
      deleteReminder(dateStr, reminderId);
    }
  };

  // Get notes and reminders for selected date
  const selectedDateStr = selectedDate ? formatDate(selectedDate) : '';
  const selectedNotes = notes[selectedDateStr] || [];
  const selectedReminders = reminders[selectedDateStr] || [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando calendario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendario</Text>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Hoy</Text>
          </TouchableOpacity>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS_ES[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <MonthCalendar
          year={viewYear}
          month={viewMonth}
          plants={plants}
          notes={notes}
          reminders={reminders}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>LEYENDA</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.waterBlue }]} />
              <Text style={styles.legendText}>Riego</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.sunGold }]} />
              <Text style={styles.legendText}>Sol</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.green }]} />
              <Text style={styles.legendText}>Exterior</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warningText }]} />
              <Text style={styles.legendText}>Notas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.textSecondary }]} />
              <Text style={styles.legendText}>Recordatorios</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsIcon}>💡</Text>
          <Text style={styles.instructionsText}>
            Toca un dia para ver las tareas, agregar notas o recordatorios.
          </Text>
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          visible={showDayDetail}
          date={selectedDate}
          plants={plants}
          notes={selectedNotes}
          reminders={selectedReminders}
          onClose={handleCloseDayDetail}
          onWater={handleWater}
          onSunDone={handleSunDone}
          onOutdoorDone={handleOutdoorDone}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onAddReminder={handleAddReminder}
          onToggleReminder={handleToggleReminder}
          onDeleteReminder={handleDeleteReminder}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
  },
  todayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
  },
  todayButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.white,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  navButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  monthTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  legend: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  legendTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    marginBottom: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
  },
  instructionsIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  instructionsText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 19,
  },
});
