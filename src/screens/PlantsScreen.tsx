import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import { LoadingScreen } from '../components/LoadingScreen';
import { useStorage } from '../hooks/useStorage';
import { useWeather } from '../hooks/useWeather';
import { getNextFertilizeDate } from '../utils/plantLogic';
import { getEffectiveSeason } from '../utils/seasonality';
import { getCatalogEntry } from '../data/plantDatabase';
import { isSameDay } from '../utils/dates';
import { useDismissOnPaywall } from '../hooks/useDismissOnPaywall';
import { Plant, TrackingStatus } from '../types';
import {
  PlantCard,
  ExpandedFAB,
  AddPlantModal,
  PlantIdentifierModal,
  MyPlantDetailModal,
  Toast,
} from '../components';
// Phase 21 (JOURNAL-04, Blocker A): separate type-only NAMED import — the existing
// barrel import above stays untouched. MyPlantDetailModal is a NAMED export from
// the component file, so this is the only correct shape.
import type { ModalSectionId } from '../components/MyPlantDetailModal';
import { PlantDiagnosisModal } from '../components/PlantDiagnosis/PlantDiagnosisModal';
import { uploadPlantImage } from '../services/imageService';
import { trackEvent } from '../services/analyticsService';
import { Features } from '../config/features';
import { usePremiumGate } from '../config/premium';
import { usePremium } from '../hooks/usePremium';

export default function PlantsScreen() {
  const { t } = useTranslation();
  const premium = usePremiumGate();
  const { showPaywall } = usePremium();
  const {
    plants,
    plantNetApiKey,
    location,
    loading,
    identificationCount,
    incrementIdentificationCount,
    updatePlant,
    deletePlant,
    addPlant,
    addPhotoToPlant,
    removePhotoFromPlant,
    diagnosisHistory,
    getActiveDiagnosesForPlant,
    fertilizePlant,
    setOnTaskCompleted,
    climateOverride,
  } = useStorage();

  const { weather } = useWeather(location);

  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [detailInitialSection, setDetailInitialSection] = useState<ModalSectionId | undefined>(undefined);
  const [diagnosePlantState, setDiagnosePlantState] = useState<Plant | null>(null);
  const [diagnosisInitialImages, setDiagnosisInitialImages] = useState<Array<{ uri: string; base64: string }> | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAddPlant = () => {
    if (!premium.canAddPlant(plants.length)) {
      showPaywall('plant_limit');
      return;
    }
    setShowAddPlant(true);
  };

  const today = new Date();

  const getActiveTrackingStatus = (plantId: string): TrackingStatus | undefined => {
    const diagnoses = diagnosisHistory[plantId] || [];
    const tracked = diagnoses.find(d => d.isTracked && d.trackingStatus && d.trackingStatus !== 'resolved');
    return tracked?.trackingStatus;
  };

  const handleAddPlant = async (plantData: Omit<Plant, 'id'>, imageUri?: string | null): Promise<Plant> => {
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
    trackEvent('plant_added', { plant_name: plantData.name, source: 'plants' });
    return newPlant;
  };

  const handleDeletePlant = (plantId: string) => {
    deletePlant(plantId);
    trackEvent('plant_deleted', { plant_id: plantId });
  };

  const handleToggleFavorite = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, { favorite: !plant.favorite });
    }
  };

  // Phase 18 CARD-01: optimistic delete + Toast undo flow (Pattern 2 + Pitfall 4 cleanup)
  const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 21 (JOURNAL-04): journal-saved Toast — DISTINCT identifier from the Phase 18
  // swipe-undo `toastVisible` above (Blocker B LOCKED). Two independent <Toast> siblings
  // coexist; Phase 18 owns swipe-undo, Phase 21 owns journal.savedToast.
  const [journalToastVisible, setJournalToastVisible] = useState(false);

  // Phase 22 (GAM-01): task-completion Toast — DISTINCT identifier from Phase 18 swipe-undo
  // `toastVisible` and Phase 21 `journalToastVisible`. Three coexisting <Toast> siblings.
  // The setter is registered with useStorage.setOnTaskCompleted on mount; cleared on unmount.
  const [gamificationToastVisible, setGamificationToastVisible] = useState(false);

  useEffect(() => {
    setOnTaskCompleted(() => setGamificationToastVisible(true));
    return () => setOnTaskCompleted(null);
  }, [setOnTaskCompleted]);

  // Phase 18 CARD-02: long-press BottomSheetModal
  const longPressSheetRef = useRef<BottomSheetModal>(null);
  const [longPressTarget, setLongPressTarget] = useState<Plant | null>(null);
  useDismissOnPaywall(longPressSheetRef); // Pitfall 10 — paywall z-order

  // Phase 18 CARD-04: first-card affordance hint
  const SWIPE_DISCOVERED_KEY = '@plantcard_swipe_discovered';
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const hintTranslateX = useSharedValue(0);

  useEffect(() => {
    // Read flag once on mount; show hint until user completes first swipe (Open Question 3 — repeats per launch).
    let cancelled = false;
    AsyncStorage.getItem(SWIPE_DISCOVERED_KEY)
      .then((value) => {
        if (cancelled) return;
        setShowSwipeHint(value !== 'true');
      })
      .catch(() => {
        /* silent — hint will appear; acceptable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Drive the chevron-peek animation when the hint becomes visible. Reveal ~12px and spring back.
    if (showSwipeHint) {
      hintTranslateX.value = withDelay(
        400,
        withSequence(
          withTiming(-12, { duration: 350, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
        ),
      );
    }
  }, [showSwipeHint, hintTranslateX]);

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hintTranslateX.value }],
  }));

  const handleSwipeDiscovered = () => {
    // Fired by PlantCard onSwipeCommitted after a successful commit.
    AsyncStorage.setItem(SWIPE_DISCOVERED_KEY, 'true').catch(() => {
      /* silent */
    });
    setShowSwipeHint(false);
  };

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
    setDetailPlant(plant); // Reuses existing modal — CONTEXT.md recommendation
  };

  // Phase 19 (TOX-03): toxicity badge tap → open MyPlantDetailModal scrolled to Mascotas section.
  const handleOpenToMascotas = (plant: Plant) => {
    setDetailPlant(plant);
    setDetailInitialSection('mascotas');
  };

  // Filter by search query and sort: favorites first
  const sortedPlants = [...plants]
    .filter((plant) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        plant.name.toLowerCase().includes(query) ||
        plant.typeName.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });

  if (loading) {
    return <LoadingScreen message={t('plants.loadingPlants')} />;
  }

  const renderPlant = ({ item, index }: { item: Plant; index: number }) => {
    const isFirstWithHint = index === 0 && showSwipeHint;
    return (
      <Animated.View style={isFirstWithHint ? hintAnimatedStyle : undefined}>
        <PlantCard
          plant={item}
          today={today}
          weather={weather}
          latitude={location?.lat ?? null}
          mode="collection"
          onFertilizeDone={fertilizePlant}
          onDelete={(id) => {
            const plant = plants.find(p => p.id === id);
            if (plant) handleCommitDelete(plant);
          }}
          onPress={setDetailPlant}
          onToggleFavorite={handleToggleFavorite}
          diagnoses={diagnosisHistory[item.id]}
          hasActiveDiagnosis={getActiveDiagnosesForPlant(item.id).length > 0}
          activeTrackingStatus={getActiveTrackingStatus(item.id)}
          onLongPress={handleLongPress}
          onSwipeCommitted={handleSwipeDiscovered}
          onOpenToMascotas={handleOpenToMascotas}
        />
      </Animated.View>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('plants.title')}</Text>
      <Text style={styles.subtitle}>
        {plants.length === 0
          ? t('plants.noPlants')
          : t('plants.plantCount', { count: plants.length })}
      </Text>

      {/* Search bar */}
      {plants.length > 0 && (
        <TextInput
          style={styles.searchBar}
          placeholder={t('plants.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      )}

      {/* Tip card */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{t('plants.tip')}</Text>
          <Text style={styles.tipText}>
            {t('plants.tipText')}
          </Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTitle}>{t('plants.emptyTitle')}</Text>
      <Text style={styles.emptyText}>
        {t('plants.emptyText')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sortedPlants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />

      <ExpandedFAB
        onAddManual={handleOpenAddPlant}
        onIdentify={() => {
          if (!premium.canIdentify(identificationCount)) {
            showPaywall('plant_identification');
            return;
          }
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
          onAddPlant={async (plantData, imageUri) => {
            incrementIdentificationCount();
            return handleAddPlant(plantData, imageUri);
          }}
          isPremium={premium.isPremium}
          onDiagnoseAfterIdentify={(plant, reusePhotos, capturedUri, capturedBase64) => {
            setShowIdentifier(false);
            setDiagnosePlantState(plant);
            setDiagnosisInitialImages(reusePhotos && capturedUri && capturedBase64 ? [{ uri: capturedUri, base64: capturedBase64 }] : undefined);
          }}
        />
      )}

      {/* Diagnosis Modal from Identify flow */}
      {diagnosePlantState && (
        <PlantDiagnosisModal
          visible={!!diagnosePlantState}
          plant={diagnosePlantState}
          weather={weather}
          initialImages={diagnosisInitialImages}
          onClose={() => {
            setDiagnosePlantState(null);
            setDiagnosisInitialImages(undefined);
          }}
        />
      )}

      {/* Plant Detail Modal with Photo Album */}
      <MyPlantDetailModal
        visible={!!detailPlant}
        plant={detailPlant ? plants.find(p => p.id === detailPlant.id) ?? detailPlant : null}
        weather={weather}
        latitude={location?.lat ?? null}
        initialSection={detailInitialSection}
        // Phase 20 FERT-06 — auto-expand fertilize card on arrival when the user opens
        // detail for a plant with a pending fertilize task today (Open Question 2 rec).
        initialExpanded={(() => {
          if (!detailPlant) return undefined;
          const cat = detailPlant.databaseId ? getCatalogEntry(detailPlant.databaseId) : null;
          const season = getEffectiveSeason(location, climateOverride, today);
          const next = getNextFertilizeDate(detailPlant, cat, today, season);
          return next && isSameDay(next, today) ? 'fertilize' : undefined;
        })()}
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
        // Phase 21 (JOURNAL-04 — Important 6 Approach B + Blocker B): modal forwards
        // the journal-save signal here so this screen owns Toast state. Uses the
        // DISTINCT identifier `journalToastVisible` to avoid clashing with the
        // Phase 18 swipe-undo `toastVisible` declared above.
        onJournalEntrySaved={() => setJournalToastVisible(true)}
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

      {/* Phase 21 (JOURNAL-04) — journal-saved Toast. DISTINCT state from the Phase 18
          Toast above; the two coexist as independent siblings. */}
      <Toast
        visible={journalToastVisible}
        message={t('journal.savedToast')}
        durationMs={2000}
        onDismiss={() => setJournalToastVisible(false)}
      />

      {/* Phase 22 (GAM-01) — task-completion Toast. THIRD independent sibling alongside Phase 18 swipe-undo
          Toast and Phase 21 journal-saved Toast. */}
      <Toast
        visible={gamificationToastVisible}
        message={t('gamification.toastSuccess')}
        durationMs={2000}
        onDismiss={() => setGamificationToastVisible(false)}
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.fabClearance,
  },
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  searchBar: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.infoText,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
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
