import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fonts, borderRadius, shadows } from '../theme';
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
  MyPlantDetailModal,
} from '../components';
import { uploadPlantImage } from '../services/imageService';
import { trackEvent } from '../services/analyticsService';
import { LinearGradient } from 'expo-linear-gradient';
import { Features } from '../config/features';
import { usePremiumGate } from '../config/premium';
import { usePremium } from '../hooks/usePremium';

export default function TodayScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const premium = usePremiumGate();
  const { showPaywall } = usePremium();
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
    installDate,
    identificationCount,
    incrementIdentificationCount,
    addPhotoToPlant,
    removePhotoFromPlant,
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
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);

  const handleOpenAddPlant = () => {
    if (!premium.canAddPlant(plants.length)) {
      showPaywall('plant_limit');
      return;
    }
    setShowAddPlant(true);
  };

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
    trackEvent('watering_logged', { plant_id: plantId });
  };

  const handleSunDone = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, {
        sunDoneDate: plant.sunDoneDate === todayStr ? null : todayStr
      });
      trackEvent('sun_logged', { plant_id: plantId });
    }
  };

  const handleOutdoorDone = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, {
        outdoorDoneDate: plant.outdoorDoneDate === todayStr ? null : todayStr
      });
      trackEvent('outdoor_logged', { plant_id: plantId });
    }
  };

  const handleAddPlant = async (plantData: Omit<Plant, 'id'>, imageUri?: string | null) => {
    const plantId = Date.now().toString();

    // Upload image if provided
    let imageUrl: string | undefined;
    if (imageUri) {
      try {
        const uploadedUrl = await uploadPlantImage(imageUri, plantId);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } catch (e) {
        console.error('Error uploading plant image:', e);
      }
    }

    const newPlant: Plant = {
      ...plantData,
      id: plantId,
      imageUrl,
    };
    addPlant(newPlant);
    trackEvent('plant_added', { plant_name: plantData.name, source: 'today' });
  };

  const handleDeletePlant = (plantId: string) => {
    deletePlant(plantId);
    trackEvent('plant_deleted', { plant_id: plantId });
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
          <Text style={styles.loadingText}>{t('today.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header userName={userName} onSettingsPress={() => navigation.navigate('Ajustes')} />

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
          onOpenSettings={() => navigation.navigate('Ajustes')}
        />

        {/* Weather Alerts */}
        <WeatherAlerts weather={weather} plants={plants} />

        {/* Premium banner for free users */}
        {!premium.isPremium && plants.length >= 5 && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => showPaywall('premium_feature')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.premiumDark, colors.premiumLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBannerGradient}
            >
              <Text style={styles.premiumBannerIcon}>🌿</Text>
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumBannerTitle}>{t('today.unlockGarden')}</Text>
                <Text style={styles.premiumBannerSubtitle}>{t('today.unlimitedPlants')}</Text>
              </View>
              <View style={styles.premiumBannerArrow}>
                <Text style={styles.premiumBannerArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

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
            <SectionHeader title={t('today.reminders')} count={todayReminders.length} />
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
            <SectionHeader title={t('today.notes')} count={todayNotes.length} />
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
            <SectionHeader title={t('today.withTasksToday')} count={plantsWithTasks.length} />
            {plantsWithTasks.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                today={today}
                weather={weather}
                onWater={handleWater}
                onSunDone={handleSunDone}
                onOutdoorDone={handleOutdoorDone}
                onDelete={handleDeletePlant}
                onPress={setDetailPlant}
              />
            ))}
          </View>
        )}

        {/* Plants without tasks today */}
        {plantsWithoutTasks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t('today.noTasksToday')} count={plantsWithoutTasks.length} />
            {plantsWithoutTasks.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                today={today}
                weather={weather}
                onWater={handleWater}
                onSunDone={handleSunDone}
                onOutdoorDone={handleOutdoorDone}
                onDelete={handleDeletePlant}
                onPress={setDetailPlant}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {plants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>{t('today.emptyGarden')}</Text>
            <Text style={styles.emptyText}>
              {t('today.emptyGardenText')}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ExpandedFAB
        onAddManual={handleOpenAddPlant}
        onIdentify={() => {
          if (!premium.canIdentify(identificationCount)) {
            showPaywall('plant_identification');
            return;
          }
          incrementIdentificationCount();
          setShowIdentifier(true);
        }}
        showIdentifyOption={Features.PLANT_IDENTIFICATION}
      />

      {/* Add Plant Modal */}
      <AddPlantModal
        visible={showAddPlant}
        onClose={() => setShowAddPlant(false)}
        onAdd={handleAddPlant}
      />

      {/* Plant Identifier Modal — only when flag is on */}
      {Features.PLANT_IDENTIFICATION && (
        <PlantIdentifierModal
          visible={showIdentifier}
          onClose={() => setShowIdentifier(false)}
          onAddPlant={handleAddPlant}
        />
      )}

      {/* Plant Detail Modal with Photo Album */}
      <MyPlantDetailModal
        visible={!!detailPlant}
        plant={detailPlant ? plants.find(p => p.id === detailPlant.id) ?? detailPlant : null}
        weather={weather}
        onClose={() => setDetailPlant(null)}
        onDelete={(id) => {
          handleDeletePlant(id);
          setDetailPlant(null);
        }}
        onAddPhoto={addPhotoToPlant}
        onDeletePhoto={removePhotoFromPlant}
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
  premiumBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  premiumBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  premiumBannerIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  premiumBannerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  premiumBannerArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.whiteOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  premiumBannerArrowText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  bottomPadding: {
    height: 100,
  },
});
