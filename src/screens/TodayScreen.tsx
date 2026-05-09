import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
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
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { colors, spacing, fonts, borderRadius, shadows } from '../theme';
import { LoadingScreen } from '../components/LoadingScreen';
import { useStorage } from '../hooks/useStorage';
import { useWeather } from '../hooks/useWeather';
import { useNotifications } from '../hooks/useNotifications';
import { useDismissOnPaywall } from '../hooks/useDismissOnPaywall';
import { formatDate, isSameDay, daysBetween } from '../utils/dates';
import { getNextWaterDate } from '../utils/plantLogic';
import { getEffectiveSeason } from '../utils/seasonality';
import { generatePlantAlerts } from '../utils/plantAlerts';
import { Plant, SavedDiagnosis, ShoppingItem, TrackingStatus } from '../types';
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
  SettingsPanel,
  MyPlantDetailModal,
  DiagnosisFollowUp,
  Toast,
} from '../components';
import { trackEvent } from '../services/analyticsService';
import { LinearGradient } from 'expo-linear-gradient';
import { DiagnosisDetailModal } from '../components/PlantDiagnosis/DiagnosisDetailModal';
import { PlantDiagnosisModal } from '../components/PlantDiagnosis/PlantDiagnosisModal';
import { ShoppingListModal } from '../components/ShoppingListModal';
import { FollowUpTaskSection } from '../components/FollowUpTaskSection';
import { Features } from '../config/features';
import { LocationBanner } from '../components/LocationBanner';
import { NotificationContext } from '../../App';
import { usePremiumGate } from '../config/premium';
import { usePremium } from '../hooks/usePremium';
import { useSeason } from '../hooks/useSeason';
import { SeasonDevSelector } from '../components/SeasonDevSelector';
import { SeasonalBackground } from '../components/SeasonalBackground';

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
    climateOverride,
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
    addPhotoToPlant,
    removePhotoFromPlant,
    diagnosisHistory,
    resolveDiagnosis,
    getActiveDiagnosesForPlant,
    shoppingList,
    addShoppingItem,
    removeShoppingItem,
    toggleShoppingItem,
    clearCheckedShoppingItems,
  } = useStorage();

  const { weather, loading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeather(location);
  const { season, palette: seasonalPalette } = useSeason(location);

  // Pre-compute effective season (climate-override-aware SSOT, Phase 7 LOC-05).
  // Computed once per render — passed to all children instead of threading location?.lat.
  const today = new Date();
  const effectiveSeason = getEffectiveSeason(location, climateOverride, today);

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
    diagnosisHistory,
    season: effectiveSeason,
  });

  const { pendingPlantId, clearPendingPlantId } = useContext(NotificationContext);

  const [refreshing, setRefreshing] = useState(false);
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [detailInitialSection, setDetailInitialSection] = useState<'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas' | undefined>(undefined);

  useEffect(() => {
    if (pendingPlantId && plants.length > 0) {
      const plant = plants.find(p => p.id === pendingPlantId);
      if (plant) {
        setDetailPlant(plant);
      }
      clearPendingPlantId();
    }
  }, [pendingPlantId, plants]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<SavedDiagnosis | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [diagnosePlant, setDiagnosePlant] = useState<Plant | null>(null);
  const [diagnosisInitialImages, setDiagnosisInitialImages] = useState<Array<{ uri: string; base64: string }> | undefined>();
  const [resumeDiagnosis, setResumeDiagnosis] = useState<SavedDiagnosis | null>(null);

  // Per-session banner dismiss (Pitfall 8: useState, NOT AsyncStorage — banner reappears next launch)
  const [locationBannerDismissed, setLocationBannerDismissed] = useState(false);

  const todayStr = formatDate(today);

  // Get today's reminders and notes
  const todayReminders = reminders[todayStr] || [];
  const todayNotes = notes[todayStr] || [];

  // Get plants with tasks today
  const plantsWithTasks = useMemo(() => {
    const withTasks: Plant[] = [];

    plants.forEach((plant) => {
      const nextWater = getNextWaterDate(plant, today, effectiveSeason);
      const needsWaterToday = isSameDay(nextWater, today);
      const needsSunToday = plant.sunDays.includes(today.getDay());
      const needsOutdoorToday = plant.outdoorDays.includes(today.getDay());

      if (needsWaterToday || needsSunToday || needsOutdoorToday) {
        withTasks.push(plant);
      }
    });

    const favSort = (a: Plant, b: Plant) => (a.favorite ? -1 : 0) - (b.favorite ? -1 : 0);
    return withTasks.sort(favSort);
  }, [plants, today, effectiveSeason]);

  // UX-03: per-plant info rows for soil_check plants on non-check-in days.
  // Mutually exclusive with plantsWithTasks via the isSameDay filter — soil_check
  // plants on their check-in day appear in plantsWithTasks (PlantCard with check_soil task);
  // soil_check plants on a non-check-in day appear in soilCheckSilentPlants (info row).
  const soilCheckSilentPlants = useMemo(() => {
    const silent = plants.filter((plant) => {
      if (plant.waterMode !== 'soil_check') return false;
      const nextCheckIn = getNextWaterDate(plant, today, effectiveSeason);
      return !isSameDay(nextCheckIn, today);
    });
    // Stable order: by plant name (alphabetical). Avoids reorder-flicker on re-render.
    return silent.sort((a, b) => a.name.localeCompare(b.name));
  }, [plants, today, effectiveSeason]);

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

  const getActiveTrackingStatus = (plantId: string): TrackingStatus | undefined => {
    const diagnoses = diagnosisHistory[plantId] || [];
    const tracked = diagnoses.find(d => d.isTracked && d.trackingStatus && d.trackingStatus !== 'resolved');
    return tracked?.trackingStatus;
  };

  // Phase 18 CARD-01: optimistic delete + Toast undo flow (Pattern 2 + Pitfall 4 cleanup)
  const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 18 CARD-02: long-press BottomSheetModal
  const longPressSheetRef = useRef<BottomSheetModal>(null);
  const [longPressTarget, setLongPressTarget] = useState<Plant | null>(null);
  useDismissOnPaywall(longPressSheetRef); // Pitfall 10 — paywall z-order

  const handleCommitDelete = (plant: Plant) => {
    // Pitfall 4 — clear any pending dismiss timer when overlapping deletes occur.
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    setPendingDelete(plant);
    deletePlant(plant.id);
    setToastMessage(t('plantCard.undoToast.deletedMessage', { name: plant.name }));
    setToastVisible(true);
    dismissTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setPendingDelete(null);
    }, 4000);
    trackEvent('plant_deleted', { plant_id: plant.id });
  };

  const handleUndo = () => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
    if (pendingDelete) {
      addPlant(pendingDelete);
      setPendingDelete(null);
    }
    setToastVisible(false);
  };

  const handleToastDismissed = () => {
    // Called by Toast onDismiss after slide-out animation completes; finalize pendingDelete state cleanup.
    setToastVisible(false);
    setPendingDelete(null);
  };

  useEffect(() => {
    // Pitfall 4 — clean up timeout on unmount.
    return () => {
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  const handleLongPress = (plant: Plant) => {
    setLongPressTarget(plant);
    longPressSheetRef.current?.present();
  };

  const handleMenuFavorite = () => {
    if (!longPressTarget) return;
    updatePlant(longPressTarget.id, { favorite: !longPressTarget.favorite });
    longPressSheetRef.current?.dismiss();
  };

  const handleMenuDelete = () => {
    if (!longPressTarget) return;
    const plant = longPressTarget;
    longPressSheetRef.current?.dismiss();
    // Defer commit to after the sheet is dismissed so the Toast and the sheet do not overlap visually.
    requestAnimationFrame(() => handleCommitDelete(plant));
  };

  const handleMenuEdit = () => {
    if (!longPressTarget) return;
    const plant = longPressTarget;
    longPressSheetRef.current?.dismiss();
    // Reuse existing TodayScreen detailPlant flow → MyPlantDetailModal (rendered at bottom of return).
    setDetailPlant(plant);
  };

  // Phase 19 (TOX-03): toxicity badge tap → open MyPlantDetailModal scrolled to Mascotas section.
  const handleOpenToMascotas = (plant: Plant) => {
    setDetailPlant(plant);
    setDetailInitialSection('mascotas');
  };

  if (storageLoading) {
    return <LoadingScreen message={t('today.loading')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: seasonalPalette.bgTint }]}>
      <SeasonalBackground season={season} palette={seasonalPalette}>
        <Header
          userName={userName}
          onSettingsPress={() => navigation.navigate('Ajustes')}
          seasonIcon={seasonalPalette.icon}
          seasonLabel={t(`seasons.${season}`)}
        />
      </SeasonalBackground>

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

        {/* Phase 7 LOC-02: dismissible soft nudge if no location AND no climate override */}
        {location === null && (climateOverride ?? 'auto') === 'auto' && !locationBannerDismissed && (
          <LocationBanner
            onCtaPress={() => navigation.navigate('Ajustes' as never)}
            onDismiss={() => setLocationBannerDismissed(true)}
          />
        )}

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
        <WateringTips plants={plants} weather={weather} season={effectiveSeason} />

        {/* Garden Health Summary */}
        <GardenHealth plants={plants} weather={weather} diagnosisHistory={diagnosisHistory} season={effectiveSeason} />

        {/* Shopping List button */}
        {premium.canUseShoppingList() && shoppingList.length > 0 && (
          <TouchableOpacity
            style={styles.shoppingListButton}
            onPress={() => setShowShoppingList(true)}
          >
            <Text style={styles.shoppingListButtonIcon}>🛒</Text>
            <Text style={styles.shoppingListButtonText}>
              {t('shoppingList.title')} ({shoppingList.filter(i => !i.checked).length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Follow-Up Tasks Due Today (premium only) */}
        <FollowUpTaskSection
          plants={plants}
          diagnosisHistory={diagnosisHistory}
          isPremium={premium.isPremium}
          onPressPlant={(plant) => setDetailPlant(plant)}
          onPressDiagnosis={setSelectedDiagnosis}
        />

        {/* Diagnosis Follow-Up — only untracked diagnoses (tracked ones are handled above) */}
        <DiagnosisFollowUp
          plants={plants}
          diagnosisHistory={Object.fromEntries(
            Object.entries(diagnosisHistory).map(([plantId, diagnoses]) => [
              plantId,
              diagnoses.filter(d => !d.isTracked),
            ])
          )}
          onResolve={resolveDiagnosis}
          onPressDiagnosis={setSelectedDiagnosis}
        />

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
                latitude={location?.lat ?? null}
                weather={weather}
                onWater={handleWater}
                onSunDone={handleSunDone}
                onOutdoorDone={handleOutdoorDone}
                onDelete={(id) => {
                  const target = plants.find(p => p.id === id);
                  if (target) handleCommitDelete(target);
                }}
                onPress={setDetailPlant}
                diagnoses={diagnosisHistory[plant.id]}
                hasActiveDiagnosis={getActiveDiagnosesForPlant(plant.id).length > 0}
                activeTrackingStatus={getActiveTrackingStatus(plant.id)}
                onLongPress={handleLongPress}
                onOpenToMascotas={handleOpenToMascotas}
              />
            ))}
          </View>
        )}

        {/* UX-03: soil-check info rows — per-plant on non-check-in days */}
        {soilCheckSilentPlants.length > 0 && (
          <View style={styles.section}>
            {soilCheckSilentPlants.map((plant) => {
              const daysLeft = daysBetween(
                today,
                getNextWaterDate(plant, today, effectiveSeason)
              );
              return (
                <View key={plant.id} style={styles.soilCheckRow}>
                  <Text style={styles.soilCheckIcon}>🤚</Text>
                  <Text style={styles.soilCheckText}>
                    {t('today.soilCheckEmptyRow', { plantName: plant.name, days: daysLeft })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* All caught up message */}
        {plants.length > 0 && plantsWithTasks.length === 0 && soilCheckSilentPlants.length === 0 && (
          <View style={styles.allCaughtUp}>
            <Text style={styles.allCaughtUpIcon}>🎉</Text>
            <Text style={styles.allCaughtUpTitle}>{t('today.allCaughtUp')}</Text>
            <Text style={styles.allCaughtUpText}>{t('today.allCaughtUpText')}</Text>
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

      {/* Diagnosis Modal from Identify flow */}
      {diagnosePlant && (
        <PlantDiagnosisModal
          visible={!!diagnosePlant}
          plant={diagnosePlant}
          weather={weather}
          initialImages={diagnosisInitialImages}
          resumeDiagnosis={resumeDiagnosis}
          onClose={() => {
            setDiagnosePlant(null);
            setDiagnosisInitialImages(undefined);
            setResumeDiagnosis(null);
          }}
          canAddToShoppingList={premium.canUseShoppingList()}
          onAddToShoppingList={(treatment) => {
            if (!diagnosePlant) return;
            addShoppingItem({
              id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              text: treatment,
              diagnosisId: '',
              plantId: diagnosePlant.id,
              plantName: diagnosePlant.name,
              checked: false,
              createdAt: new Date().toISOString(),
            });
          }}
        />
      )}

      {/* Diagnosis Detail from Follow-Up */}
      <DiagnosisDetailModal
        visible={!!selectedDiagnosis}
        diagnosis={selectedDiagnosis}
        onClose={() => setSelectedDiagnosis(null)}
        onContinueChat={(diag) => {
          setSelectedDiagnosis(null);
          const plant = plants.find(p => p.id === diag.plantId);
          if (plant) {
            setResumeDiagnosis(diag);
            setDiagnosePlant(plant);
          }
        }}
        onResolve={(plantId, diagnosisId) => {
          resolveDiagnosis(plantId, diagnosisId);
          setSelectedDiagnosis(null);
        }}
        canAddToShoppingList={premium.canUseShoppingList()}
        onAddToShoppingList={selectedDiagnosis ? (treatment: string) => {
          const plant = plants.find(p => p.id === selectedDiagnosis.plantId);
          addShoppingItem({
            id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            text: treatment,
            diagnosisId: selectedDiagnosis.id,
            plantId: selectedDiagnosis.plantId,
            plantName: plant?.name || '',
            checked: false,
            createdAt: new Date().toISOString(),
          });
        } : undefined}
      />

      {/* Shopping List Modal */}
      <ShoppingListModal
        visible={showShoppingList}
        items={shoppingList}
        onClose={() => setShowShoppingList(false)}
        onToggle={toggleShoppingItem}
        onRemove={removeShoppingItem}
        onClearChecked={clearCheckedShoppingItems}
      />

      {/* Dev: Season selector */}
      <SeasonDevSelector />

      {/* Plant Detail Modal with Photo Album */}
      <MyPlantDetailModal
        visible={!!detailPlant}
        plant={detailPlant ? plants.find(p => p.id === detailPlant.id) ?? detailPlant : null}
        weather={weather}
        latitude={location?.lat ?? null}
        initialSection={detailInitialSection}
        onClose={() => {
          setDetailPlant(null);
          setDetailInitialSection(undefined);
        }}
        onDelete={(id) => {
          handleDeletePlant(id);
          setDetailPlant(null);
          setDetailInitialSection(undefined);
        }}
        onAddPhoto={addPhotoToPlant}
        onDeletePhoto={removePhotoFromPlant}
      />

      {/* Phase 18 CARD-02 — long-press overflow menu */}
      <BottomSheetModal
        ref={longPressSheetRef}
        snapPoints={['30%']}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetView style={styles.menuSheet}>
          <Text style={styles.menuTitle}>{t('plantCard.menuSheet.title')}</Text>
          <TouchableOpacity onPress={handleMenuFavorite} style={styles.menuItem}>
            <Text style={styles.menuItemText}>
              {longPressTarget?.favorite ? t('plantCard.menu.unfavorite') : t('plantCard.menu.favorite')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMenuEdit} style={styles.menuItem}>
            <Text style={styles.menuItemText}>{t('plantCard.menu.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMenuDelete} style={[styles.menuItem, styles.menuItemDestructive]}>
            <Text style={[styles.menuItemText, styles.menuItemTextDestructive]}>{t('plantCard.menu.delete')}</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Phase 18 CARD-01 — undo Toast for swipe-delete */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        actionLabel={t('plantCard.undoToast.undoLabel')}
        onAction={handleUndo}
        durationMs={4000}
        onDismiss={handleToastDismissed}
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
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  shoppingListButtonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  shoppingListButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  allCaughtUp: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  allCaughtUpIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  allCaughtUpTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  allCaughtUpText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  soilCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  soilCheckIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 1, // optical alignment with first line of body text
  },
  soilCheckText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
  menuSheet: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menuTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  menuItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuItemDestructive: {
    borderBottomWidth: 0,
  },
  menuItemTextDestructive: {
    color: colors.dangerText,
    fontFamily: fonts.bodySemiBold,
  },
});
