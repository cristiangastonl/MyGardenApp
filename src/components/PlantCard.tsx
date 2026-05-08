import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Image, ImageStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Plant, WeatherData, SavedDiagnosis, TrackingStatus, Location, HealthLevel } from '../types';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
import { TRACKING_STATUS_CONFIG } from '../services/problemTrackingService';
import { getNextWaterDate, getSeasonalInterval } from '../utils/plantLogic';
import { getEffectiveSeason } from '../utils/seasonality';
import { useStorage } from '../hooks/useStorage';
import { isSameDay, formatDate } from '../utils/dates';
import { calculatePlantHealth, getHealthBgColor } from '../utils/plantHealth';
import { triggerHaptic } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { TaskButton } from './TaskButton';
import { PlantHealthDetail } from './PlantHealthDetail';
import { getPlantCategories } from '../data/plantDatabase';

// Phase 18 GAM-03: HealthLevel → mood-emoji mapping (frozen by REQUIREMENTS).
const moodEmojiByLevel: Record<HealthLevel, string> = {
  excellent: '🌱',
  good: '😊',
  warning: '😐',
  danger: '😟',
};

interface PlantCardProps {
  plant: Plant;
  today: Date;
  latitude: number | null;
  weather?: WeatherData | null;
  mode?: 'tasks' | 'collection';
  onWater?: (plantId: string) => void;
  onSunDone?: (plantId: string) => void;
  onOutdoorDone?: (plantId: string) => void;
  // Phase 18 (CARD-01): re-purposed — invoked on swipe-commit (was Alert-confirmed delete).
  // Plan 04 wires this to the optimistic delete + Toast undo flow.
  onDelete: (plantId: string) => void;
  onPress?: (plant: Plant) => void;
  // Still passed by screens — invoked from long-press menu in Plan 04, not from card face.
  onToggleFavorite?: (plantId: string) => void;
  diagnoses?: SavedDiagnosis[];
  hasActiveDiagnosis?: boolean;
  activeTrackingStatus?: TrackingStatus;
  // Phase 18 CARD-02: optional — invoked when long-press gesture fires; Plan 04's screens present BottomSheetModal.
  onLongPress?: (plant: Plant) => void;
  // Phase 18 CARD-04: optional — invoked once after a successful swipe-commit; PlantsScreen flips @plantcard_swipe_discovered.
  onSwipeCommitted?: () => void;
}

export function PlantCard({
  plant,
  today,
  latitude,
  weather,
  mode = 'tasks',
  onWater,
  onSunDone,
  onOutdoorDone,
  onDelete,
  onPress,
  onToggleFavorite,
  diagnoses,
  hasActiveDiagnosis,
  activeTrackingStatus,
  onLongPress,
  onSwipeCommitted,
}: PlantCardProps) {
  const { t } = useTranslation();
  const { climateOverride } = useStorage();
  const [showHealthDetail, setShowHealthDetail] = useState(false);

  const todayStr = formatDate(today);
  // Pre-compute season once per render — PlantCard keeps latitude prop (Pattern A),
  // derives Location inline for getEffectiveSeason (uses location?.lat ?? null internally).
  const locationObj: Location | null = latitude !== null ? { lat: latitude, lon: 0, name: '', country: '' } : null;
  const currentSeason = getEffectiveSeason(locationObj, climateOverride, today);
  const nextWaterDate = getNextWaterDate(plant, today, currentSeason);
  const needsWaterToday = isSameDay(nextWaterDate, today);
  const waterDone = plant.lastWatered === todayStr && needsWaterToday;

  const needsSunToday = plant.sunDays.includes(today.getDay());
  const sunDone = plant.sunDoneDate === todayStr;

  const needsOutdoorToday = plant.outdoorDays.includes(today.getDay());
  const outdoorDone = plant.outdoorDoneDate === todayStr;

  const hasTasks = needsWaterToday || needsSunToday || needsOutdoorToday;

  // Phase 18 (CARD-03): per-plant catalog tip relocated to MyPlantDetailModal "¿Qué hacer?" section.
  // The catalog/translatedEntry/plantType lookups + inline tip render were removed from PlantCard.

  const waterInterval = getSeasonalInterval(plant, currentSeason);
  const isCheckMode = plant.waterMode === 'soil_check';

  // Calculate plant health
  const healthStatus = useMemo(
    () => calculatePlantHealth(plant, today, weather ?? null, diagnoses, currentSeason),
    [plant, today, weather, diagnoses, currentSeason]
  );

  // Phase 18 GAM-03: mood emoji + a11y label derived from existing healthStatus.level.
  const moodEmoji = moodEmojiByLevel[healthStatus.level];
  const moodA11yKey = `plantCard.moodA11y.${healthStatus.level}`;

  // ─── Phase 18 CARD-01/05 — Gesture.Pan swipe-to-delete ───────────────────────
  // Hybrid threshold model (CONTEXT.md): reveal at ~30% of card width, full-commit at ~70%.
  // FlatList scroll co-existence (Pitfall 1): activeOffsetX([-15,15]) + failOffsetY([-10,10]).
  const CARD_WIDTH_FALLBACK = 360; // pixel default until onLayout measures
  const cardWidth = useSharedValue(CARD_WIDTH_FALLBACK);
  const translateX = useSharedValue(0);
  const isRevealed = useSharedValue(false);
  const hapticFired = useSharedValue(false); // Pitfall 2 — one-shot guard
  const RESTING_REVEAL_X = -88; // px width of revealed action button

  // Pitfall 5: reset swipe state when the FlatList row is recycled to a different plant.
  useEffect(() => {
    translateX.value = 0;
    isRevealed.value = false;
    hapticFired.value = false;
  }, [plant.id, translateX, isRevealed, hapticFired]);

  const handleCommitDelete = () => {
    onDelete(plant.id); // Plan 04 wires this to optimistic delete + Toast undo
    onSwipeCommitted?.(); // CARD-04 hook
  };

  const handleLongPressFire = () => {
    onLongPress?.(plant); // Plan 04's screen presents BottomSheetModal
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // Pitfall 1 — horizontal threshold
    .failOffsetY([-10, 10])    // Pitfall 1 — vertical fail threshold
    .onUpdate((event) => {
      'worklet';
      // Left-only — clamp positive translateX (no right-swipe reveal per CONTEXT.md).
      const base = isRevealed.value ? RESTING_REVEAL_X : 0;
      const next = Math.min(0, event.translationX + base);
      translateX.value = next;

      const COMMIT_THRESHOLD = -cardWidth.value * 0.7;
      if (next < COMMIT_THRESHOLD && !hapticFired.value) {
        hapticFired.value = true; // Pitfall 2 — one-shot
        runOnJS(triggerHaptic)('impactMedium');
      }
    })
    .onEnd((event) => {
      'worklet';
      hapticFired.value = false; // reset for next gesture
      const REVEAL_THRESHOLD = -cardWidth.value * 0.3;
      const COMMIT_THRESHOLD = -cardWidth.value * 0.7;
      if (event.translationX < COMMIT_THRESHOLD) {
        translateX.value = withTiming(-cardWidth.value, { duration: 200 });
        runOnJS(handleCommitDelete)();
      } else if (event.translationX < REVEAL_THRESHOLD) {
        translateX.value = withSpring(RESTING_REVEAL_X, { damping: 18, stiffness: 240 });
        isRevealed.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 240 });
        isRevealed.value = false;
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500) // canonical default per RESEARCH.md
    .onStart(() => {
      'worklet';
      runOnJS(triggerHaptic)('impactLight');
      runOnJS(handleLongPressFire)();
    });

  // Pitfall 3: Race composition — first-to-activate wins. NOT Simultaneous.
  const composedGesture = Gesture.Race(longPressGesture, panGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.cardContainer}>
      {/* Phase 18 CARD-01: Action layer revealed under the card during left-swipe. */}
      <View style={styles.actionLayer} pointerEvents="box-none">
        <TouchableOpacity
          onPress={handleCommitDelete}
          style={styles.deleteAction}
          accessibilityLabel={t('plantCard.deleteButton')}
          accessibilityRole="button"
        >
          <Text style={styles.deleteActionText}>{t('plantCard.deleteButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground card (translates under gesture). Gesture.Race prevents pan/long-press conflict. */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[styles.card, needsWaterToday && !waterDone && styles.cardNeedsWater, cardAnimatedStyle]}
          onLayout={(e) => {
            cardWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <TouchableOpacity
            activeOpacity={onPress ? 0.7 : 1}
            onPress={() => onPress?.(plant)}
            accessible={true}
            accessibilityLabel={`${plant.name}, ${plant.typeName}${needsWaterToday ? `, ${t('plantCard.a11y.needsWater')}` : ''}${needsSunToday ? `, ${t('plantCard.a11y.needsSun')}` : ''}`}
            accessibilityRole="button"
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {/* Phase 18 GAM-03: image container with mood-emoji overlay (Greg-style pet badge). */}
                <View style={styles.imageContainer}>
                  {plant.imageUrl ? (
                    <Image
                      source={{ uri: plant.imageUrl }}
                      style={styles.plantImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.icon}>{plant.icon}</Text>
                  )}
                  <TouchableOpacity
                    style={[styles.moodBadge, { backgroundColor: getHealthBgColor(healthStatus.level) }]}
                    onPress={() => setShowHealthDetail(true)}
                    hitSlop={8}
                    accessibilityLabel={t(moodA11yKey)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.moodEmoji}>{moodEmoji}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
                  </View>
                  <Text style={styles.type} numberOfLines={1}>{getPlantCategories().find(c => c.id === plant.typeId)?.name || plant.typeName}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                {(hasActiveDiagnosis || (activeTrackingStatus && activeTrackingStatus !== 'resolved')) && (
                  <View style={styles.diagnosisBadge}>
                    <Text style={styles.diagnosisBadgeText}>
                      {activeTrackingStatus && activeTrackingStatus !== 'resolved'
                        ? TRACKING_STATUS_CONFIG[activeTrackingStatus].emoji
                        : '🩺'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {mode === 'tasks' && hasTasks && (
              <View style={styles.tasks}>
                {needsWaterToday && onWater && (
                  <TaskButton
                    done={waterDone}
                    onPress={() => onWater(plant.id)}
                    icon="💧"
                    label={t('plantCard.water')}
                    bgColor={colors.waterLight}
                    textColor={colors.waterBlue}
                  />
                )}
                {needsSunToday && onSunDone && (
                  <TaskButton
                    done={sunDone}
                    onPress={() => onSunDone(plant.id)}
                    icon="☀️"
                    label={t('plantCard.sunLabel', { hours: plant.sunHours })}
                    bgColor={colors.warningBg}
                    textColor={colors.sunDark}
                  />
                )}
                {needsOutdoorToday && onOutdoorDone && (
                  <TaskButton
                    done={outdoorDone}
                    onPress={() => onOutdoorDone(plant.id)}
                    icon="🌤️"
                    label={t('plantCard.outdoor')}
                    bgColor={colors.infoBg}
                    textColor={colors.infoText}
                  />
                )}
              </View>
            )}

            {/* UX-02: Watering-mode badge — ALWAYS visible regardless of hasTasks or mode.
                Both modes show parallel "verb + interval" form (voseo for ES) so the user
                knows the action AND the cadence. soil_check uses "Chequeá cada Nd" (check
                the soil every N days), fixed uses "Regá cada Nd" — both share the same
                waterInterval (season-aware via getSeasonalInterval). */}
            <View style={styles.waterBadge}>
              <Text style={styles.waterBadgeText}>
                {isCheckMode
                  ? t('plantCard.waterBadge.soilCheck', { days: waterInterval })
                  : t('plantCard.waterBadge.fixed', { days: waterInterval })}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>

      {/* Health Detail Modal — preserved from previous PlantCard; mood-emoji tap reuses showHealthDetail state. */}
      <PlantHealthDetail
        visible={showHealthDetail}
        onClose={() => setShowHealthDetail(false)}
        plant={plant}
        healthStatus={healthStatus}
      />
    </View>
  );
}

interface Styles {
  cardContainer: ViewStyle;
  actionLayer: ViewStyle;
  deleteAction: ViewStyle;
  deleteActionText: TextStyle;
  card: ViewStyle;
  cardNeedsWater: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  headerRight: ViewStyle;
  imageContainer: ViewStyle;
  icon: TextStyle;
  plantImage: ImageStyle;
  moodBadge: ViewStyle;
  moodEmoji: TextStyle;
  info: ViewStyle;
  nameRow: ViewStyle;
  name: TextStyle;
  type: TextStyle;
  diagnosisBadge: ViewStyle;
  diagnosisBadgeText: TextStyle;
  tasks: ViewStyle;
  waterBadge: ViewStyle;
  waterBadgeText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  // Phase 18 CARD-01: outer container hosts both the action layer (under) and the gesture-translating card (over).
  cardContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  actionLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 88,
    backgroundColor: colors.dangerText,
    borderTopRightRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardNeedsWater: {
    borderWidth: 2,
    borderColor: colors.green,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  // Phase 18 GAM-03: relative-positioned image wrapper anchors the bottom-right mood-emoji badge.
  imageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  plantImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  // Phase 18 GAM-03: 22×22 circular badge anchored bottom-right of the 48×48 image.
  moodBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  moodEmoji: {
    fontSize: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  type: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  diagnosisBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagnosisBadgeText: {
    fontSize: 14,
  },
  tasks: {
    marginTop: spacing.sm,
  },
  waterBadge: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  waterBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
