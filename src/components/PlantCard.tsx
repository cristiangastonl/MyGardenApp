import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Image, ImageStyle, Alert } from 'react-native';
import { Plant, WeatherData, SavedDiagnosis, TrackingStatus } from '../types';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
import { TRACKING_STATUS_CONFIG } from '../services/problemTrackingService';
import { getNextWaterDate } from '../utils/plantLogic';
import { isSameDay, daysBetween, formatDate } from '../utils/dates';
import { calculatePlantHealth } from '../utils/plantHealth';
import { useTranslation } from 'react-i18next';
import { TaskButton } from './TaskButton';
import { PlantHealthBadge } from './PlantHealthBadge';
import { PlantHealthDetail } from './PlantHealthDetail';
import { getPlantTypes } from '../data/constants';
import { getPlantCategories } from '../data/plantDatabase';

interface PlantCardProps {
  plant: Plant;
  today: Date;
  weather?: WeatherData | null;
  mode?: 'tasks' | 'collection';
  onWater?: (plantId: string) => void;
  onSunDone?: (plantId: string) => void;
  onOutdoorDone?: (plantId: string) => void;
  onDelete: (plantId: string) => void;
  onPress?: (plant: Plant) => void;
  onToggleFavorite?: (plantId: string) => void;
  diagnoses?: SavedDiagnosis[];
  hasActiveDiagnosis?: boolean;
  activeTrackingStatus?: TrackingStatus;
}

export function PlantCard({
  plant,
  today,
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
}: PlantCardProps) {
  const { t } = useTranslation();
  const [showHealthDetail, setShowHealthDetail] = useState(false);

  const todayStr = formatDate(today);
  const nextWater = getNextWaterDate(plant, today);
  const needsWaterToday = isSameDay(nextWater, today);
  const waterDone = plant.lastWatered === todayStr && needsWaterToday;

  const needsSunToday = plant.sunDays.includes(today.getDay());
  const sunDone = plant.sunDoneDate === todayStr;

  const needsOutdoorToday = plant.outdoorDays.includes(today.getDay());
  const outdoorDone = plant.outdoorDoneDate === todayStr;

  const hasTasks = needsWaterToday || needsSunToday || needsOutdoorToday;

  const plantType = getPlantTypes().find(pt => pt.id === plant.typeId);
  const tip = plantType?.tip || '';

  const daysUntilWater = daysBetween(today, nextWater);

  // Calculate plant health
  const healthStatus = useMemo(
    () => calculatePlantHealth(plant, today, weather ?? null, diagnoses),
    [plant, today, weather, diagnoses]
  );

  // Show health badge if health is not excellent (score < 80)
  const showHealthBadge = healthStatus.score < 80;

  return (
    <TouchableOpacity
      style={[styles.card, needsWaterToday && !waterDone && styles.cardNeedsWater]}
      onPress={() => onPress?.(plant)}
      activeOpacity={onPress ? 0.7 : 1}
      accessible={true}
      accessibilityLabel={`${plant.name}, ${plant.typeName}${needsWaterToday ? ', necesita agua' : ''}${needsSunToday ? ', necesita sol' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {plant.imageUrl ? (
            <Image
              source={{ uri: plant.imageUrl }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.icon}>{plant.icon}</Text>
          )}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
              {onToggleFavorite && (
                <TouchableOpacity
                  onPress={() => onToggleFavorite(plant.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.favoriteIcon}>{plant.favorite ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              )}
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
          {showHealthBadge && (
            <PlantHealthBadge
              healthStatus={healthStatus}
              onPress={() => setShowHealthDetail(true)}
            />
          )}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('plantCard.deletePlant'),
                t('plantCard.deleteConfirm', { name: plant.name }),
                [
                  { text: t('plantCard.cancelButton'), style: 'cancel' },
                  { text: t('plantCard.deleteButton'), style: 'destructive', onPress: () => onDelete(plant.id) },
                ]
              );
            }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tip ? <Text style={styles.tip}>{tip}</Text> : null}

      {mode === 'tasks' && (
        hasTasks ? (
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
        ) : (
          <View style={styles.nextWater}>
            <Text style={styles.nextWaterLabel}>{t('plantCard.nextWater')}</Text>
            <Text style={styles.nextWaterText}>
              {daysUntilWater === 0
                ? t('plantCard.today')
                : daysUntilWater === 1
                ? t('plantCard.tomorrow')
                : t('plantCard.inDays', { count: daysUntilWater })}
            </Text>
          </View>
        )
      )}

      {/* Health Detail Modal */}
      <PlantHealthDetail
        visible={showHealthDetail}
        onClose={() => setShowHealthDetail(false)}
        plant={plant}
        healthStatus={healthStatus}
      />
    </TouchableOpacity>
  );
}

interface Styles {
  card: ViewStyle;
  cardNeedsWater: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  headerRight: ViewStyle;
  icon: TextStyle;
  plantImage: ImageStyle;
  info: ViewStyle;
  nameRow: ViewStyle;
  name: TextStyle;
  favoriteIcon: TextStyle;
  type: TextStyle;
  diagnosisBadge: ViewStyle;
  diagnosisBadgeText: TextStyle;
  deleteButton: ViewStyle;
  deleteIcon: TextStyle;
  tip: TextStyle;
  tasks: ViewStyle;
  nextWater: ViewStyle;
  nextWaterLabel: TextStyle;
  nextWaterText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  icon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  plantImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
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
  favoriteIcon: {
    fontSize: 18,
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
  deleteButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  tasks: {
    marginTop: spacing.sm,
  },
  nextWater: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  nextWaterLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  nextWaterText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
