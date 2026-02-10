import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../theme';
import { useStorage } from '../hooks/useStorage';
import { useWeather } from '../hooks/useWeather';
import { useNotifications } from '../hooks/useNotifications';
import { formatDate, isSameDay } from '../utils/dates';
import { getNextWaterDate } from '../utils/plantLogic';
import { generatePlantAlerts } from '../utils/plantAlerts';
import { Plant } from '../types';
import {
  Header,
  WeatherWidget,
  WeatherAlerts,
  WateringTips,
  DailyTip,
  GardenHealth,
  PlantCard,
  SectionHeader,
  ReminderItem,
  NoteItem,
  ExpandedFAB,
  AddPlantModal,
  SettingsPanel,
  PlantIdentifierModal,
} from '../components';
import { uploadPlantImage } from '../services/imageService';

export default function TodayScreen() {
  const {
    plants,
    notes,
    reminders,
    location,
    userName,
    notificationSettings,
    plantNetApiKey,
    loading: storageLoading,
    updatePlant,
    deletePlant,
    addPlant,
    deleteNote,
    deleteReminder,
    updateReminder,
    updateLocation,
    updateNotificationSettings,
    updatePlantNetApiKey,
  } = useStorage();

  const { weather, loading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeather(location);

  // Generate plant alerts for notifications
  const plantAlerts = useMemo(() => {
    return generatePlantAlerts(plants, weather);
  }, [plants, weather]);

  // Notifications hook
  const {
    permissionStatus,
    isRequesting,
    settings: notifSettings,
    scheduledCounts,
    updateSettings,
    enableNotifications,
    disableNotifications,
    sendTest,
    refreshScheduled,
  } = useNotifications({
    settings: notificationSettings,
    onSettingsChange: updateNotificationSettings,
    plants,
    weather,
    alerts: plantAlerts,
  });

  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const todayStr = formatDate(today);

  // Get today's reminders and notes
  const todayReminders = reminders[todayStr] || [];
  const todayNotes = notes[todayStr] || [];

  // Separate plants into those with tasks today and those without
  const { plantsWithTasks, plantsWithoutTasks } = useMemo(() => {
    const withTasks: Plant[] = [];
    const withoutTasks: Plant[] = [];

    plants.forEach((plant) => {
      const nextWater = getNextWaterDate(plant, today);
      const needsWaterToday = isSameDay(nextWater, today);
      const needsSunToday = plant.sunDays.includes(today.getDay());
      const needsOutdoorToday = plant.outdoorDays.includes(today.getDay());

      if (needsWaterToday || needsSunToday || needsOutdoorToday) {
        withTasks.push(plant);
      } else {
        withoutTasks.push(plant);
      }
    });

    return { plantsWithTasks: withTasks, plantsWithoutTasks: withoutTasks };
  }, [plants, today]);

  const handleWater = (plantId: string) => {
    updatePlant(plantId, { lastWatered: todayStr });
  };

  const handleSunDone = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, {
        sunDoneDate: plant.sunDoneDate === todayStr ? null : todayStr
      });
    }
  };

  const handleOutdoorDone = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, {
        outdoorDoneDate: plant.outdoorDoneDate === todayStr ? null : todayStr
      });
    }
  };

  const handleAddPlant = async (plantData: Omit<Plant, 'id'>, imageUri?: string | null) => {
    const plantId = Date.now().toString();

    // Upload image if provided
    let imageUrl: string | undefined;
    if (imageUri) {
      const uploadedUrl = await uploadPlantImage(imageUri, plantId);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const newPlant: Plant = {
      ...plantData,
      id: plantId,
      imageUrl,
    };
    addPlant(newPlant);
  };

  const handleToggleReminder = (reminderId: string, done: boolean) => {
    updateReminder(todayStr, reminderId, { done });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (location) {
      refetchWeather();
    }
    // Short delay to show refresh indicator
    setTimeout(() => setRefreshing(false), 500);
  };

  if (storageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header userName={userName} onSettingsPress={() => setShowSettings(true)} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.green}
            colors={[colors.green]}
          />
        }
      >
        {/* Weather Widget */}
        <WeatherWidget
          weather={weather}
          location={location}
          loading={weatherLoading}
          error={weatherError}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Weather Alerts */}
        <WeatherAlerts weather={weather} plants={plants} />

        {/* Daily Tip - Contextual care advice */}
        <DailyTip
          plants={plants}
          location={location}
          weather={weather}
        />

        {/* Watering Tips based on weather */}
        <WateringTips plants={plants} weather={weather} />

        {/* Garden Health Summary */}
        <GardenHealth plants={plants} weather={weather} />

        {/* Today's Reminders */}
        {todayReminders.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recordatorios" count={todayReminders.length} />
            {todayReminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                onToggle={() => handleToggleReminder(reminder.id, !reminder.done)}
                onDelete={() => deleteReminder(todayStr, reminder.id)}
              />
            ))}
          </View>
        )}

        {/* Today's Notes */}
        {todayNotes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Notas" count={todayNotes.length} />
            {todayNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onDelete={() => deleteNote(todayStr, note.id)}
              />
            ))}
          </View>
        )}

        {/* Plants with tasks today */}
        {plantsWithTasks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Con tareas hoy" count={plantsWithTasks.length} />
            {plantsWithTasks.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                today={today}
                weather={weather}
                onWater={handleWater}
                onSunDone={handleSunDone}
                onOutdoorDone={handleOutdoorDone}
                onDelete={deletePlant}
              />
            ))}
          </View>
        )}

        {/* Plants without tasks today */}
        {plantsWithoutTasks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Sin tareas hoy" count={plantsWithoutTasks.length} />
            {plantsWithoutTasks.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                today={today}
                weather={weather}
                onWater={handleWater}
                onSunDone={handleSunDone}
                onOutdoorDone={handleOutdoorDone}
                onDelete={deletePlant}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {plants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Tu jardin esta vacio</Text>
            <Text style={styles.emptyText}>
              Agrega tu primera planta para comenzar a recibir recordatorios de cuidado.
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Expanded FAB */}
      <ExpandedFAB
        onAddManual={() => setShowAddPlant(true)}
        onIdentify={() => setShowIdentifier(true)}
      />

      {/* Add Plant Modal */}
      <AddPlantModal
        visible={showAddPlant}
        onClose={() => setShowAddPlant(false)}
        onAdd={handleAddPlant}
      />

      {/* Plant Identifier Modal */}
      <PlantIdentifierModal
        visible={showIdentifier}
        onClose={() => setShowIdentifier(false)}
        onAddPlant={handleAddPlant}
      />

      {/* Settings Panel */}
      <SettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        location={location}
        onUpdateLocation={updateLocation}
        notificationSettings={notifSettings}
        notificationPermission={permissionStatus}
        notificationCounts={scheduledCounts}
        isRequestingPermission={isRequesting}
        onUpdateNotificationSettings={updateSettings}
        onEnableNotifications={enableNotifications}
        onDisableNotifications={disableNotifications}
        onSendTestNotification={sendTest}
        plantNetApiKey={plantNetApiKey}
        onUpdatePlantNetApiKey={updatePlantNetApiKey}
      />
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
    paddingTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 100,
  },
});
