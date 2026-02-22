import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Image, ImageStyle, Alert } from 'react-native';
import { Plant, WeatherData } from '../types';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
import { getNextWaterDate } from '../utils/plantLogic';
import { isSameDay, daysBetween, formatDate } from '../utils/dates';
import { calculatePlantHealth } from '../utils/plantHealth';
import { useTranslation } from 'react-i18next';
import { TaskButton } from './TaskButton';
import { PlantHealthBadge } from './PlantHealthBadge';
import { PlantHealthDetail } from './PlantHealthDetail';
import { getPlantTypes } from '../data/constants';

interface PlantCardProps {
  plant: Plant;
  today: Date;
  weather?: WeatherData | null;
  onWater: (plantId: string) => void;
  onSunDone: (plantId: string) => void;
  onOutdoorDone: (plantId: string) => void;
  onDelete: (plantId: string) => void;
  onPress?: (plant: Plant) => void;
}

export function PlantCard({
  plant,
  today,
  weather,
  onWater,
  onSunDone,
  onOutdoorDone,
  onDelete,
  onPress,
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
    () => calculatePlantHealth(plant, today, weather ?? null),
    [plant, today, weather]
  );

  // Show health badge if health is not excellent (score < 80)
  const showHealthBadge = healthStatus.score < 80;

  return (
    <TouchableOpacity
      style={[styles.card, needsWaterToday && !waterDone && styles.cardNeedsWater]}
      onPress={() => onPress?.(plant)}
      activeOpacity={onPress ? 0.7 : 1}
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
            <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
            <Text style={styles.type} numberOfLines={1}>{plant.typeName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
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

      {hasTasks ? (
        <View style={styles.tasks}>
          {needsWaterToday && (
            <TaskButton
              done={waterDone}
              onPress={() => onWater(plant.id)}
              icon="💧"
              label={t('plantCard.water')}
              bgColor={colors.waterLight}
              textColor={colors.waterBlue}
            />
          )}
          {needsSunToday && (
            <TaskButton
              done={sunDone}
              onPress={() => onSunDone(plant.id)}
              icon="☀️"
              label={t('plantCard.sunLabel', { hours: plant.sunHours })}
              bgColor={colors.warningBg}
              textColor={colors.sunDark}
            />
          )}
          {needsOutdoorToday && (
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
  name: TextStyle;
  type: TextStyle;
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
  name: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  type: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
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
