import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plant, SavedDiagnosis } from '../types';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import { isSameDay } from '../utils/dates';
import { TRACKING_STATUS_CONFIG } from '../services/problemTrackingService';
import { SectionHeader } from './SectionHeader';

interface FollowUpTaskSectionProps {
  plants: Plant[];
  diagnosisHistory: Record<string, SavedDiagnosis[]>;
  isPremium: boolean;
  onPressPlant: (plant: Plant) => void;
  onPressDiagnosis: (diagnosis: SavedDiagnosis) => void;
}

export function FollowUpTaskSection({
  plants,
  diagnosisHistory,
  isPremium,
  onPressPlant,
  onPressDiagnosis,
}: FollowUpTaskSectionProps) {
  const { t } = useTranslation();

  const followUpsDueToday = useMemo(() => {
    if (!isPremium) return [];

    const today = new Date();
    const results: { plant: Plant; diagnosis: SavedDiagnosis }[] = [];

    for (const plant of plants) {
      const diagnoses = diagnosisHistory[plant.id] || [];
      for (const d of diagnoses) {
        if (
          d.isTracked &&
          d.trackingStatus !== 'resolved' &&
          d.followUpDate
        ) {
          const followUpDate = new Date(d.followUpDate);
          const isDueToday = isSameDay(followUpDate, today);
          const isOverdue = followUpDate < today && !isDueToday;

          if (isDueToday || isOverdue) {
            results.push({ plant, diagnosis: d });
          }
        }
      }
    }

    return results;
  }, [plants, diagnosisHistory, isPremium]);

  if (!isPremium || followUpsDueToday.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title={t('diagnosis.tracking.followUpDueToday')}
        count={followUpsDueToday.length}
      />

      {followUpsDueToday.map(({ plant, diagnosis }) => {
        const statusConfig = diagnosis.trackingStatus
          ? TRACKING_STATUS_CONFIG[diagnosis.trackingStatus]
          : null;
        const description = diagnosis.problemSummary || diagnosis.result.summary;

        return (
          <TouchableOpacity
            key={diagnosis.id}
            style={styles.card}
            onPress={() => onPressPlant(plant)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.plantIcon}>{plant.icon}</Text>
              <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
              {statusConfig && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
                  <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                    {t(statusConfig.labelKey)}
                  </Text>
                </View>
              )}
            </View>

            {description ? (
              <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
                {description}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => onPressPlant(plant)}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaText}>{t('diagnosis.tracking.checkNow')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  plantIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  plantName: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  statusEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  statusLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  ctaButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.successBg,
  },
  ctaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
  },
});
