import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { SavedDiagnosis } from '../types';
import { TRACKING_STATUS_CONFIG } from '../services/problemTrackingService';
import { ProblemTimeline } from './ProblemTimeline';

interface ActiveProblemsSectionProps {
  diagnoses: SavedDiagnosis[];
  plantIcon: string;
  onPressDiagnosis: (d: SavedDiagnosis) => void;
}

export function ActiveProblemsSection({
  diagnoses,
  plantIcon,
  onPressDiagnosis,
}: ActiveProblemsSectionProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const activeProblems = diagnoses.filter(
    (d) => d.isTracked && d.trackingStatus && d.trackingStatus !== 'resolved'
  );

  if (activeProblems.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toggleTimeline = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t('diagnosis.tracking.activeProblems').toUpperCase()}
      </Text>

      {activeProblems.map((d) => {
        const statusConfig = TRACKING_STATUS_CONFIG[d.trackingStatus!];
        const entries = d.entries ?? [];

        // Last check: most recent entry date, or d.date if no entries
        const lastCheckDate =
          entries.length > 0
            ? new Date(
                entries.reduce((latest, e) =>
                  e.date > latest.date ? e : latest
                ).date
              )
            : new Date(d.date);

        // Follow-up date
        const followUpDate = d.followUpDate ? new Date(d.followUpDate) : null;
        const isOverdue =
          followUpDate !== null && followUpDate < today;

        const isExpanded = expandedIds[d.id] ?? false;

        return (
          <View key={d.id} style={styles.card}>
            {/* Status row */}
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.emoji} {t(statusConfig.labelKey)}
              </Text>
            </View>

            {/* Problem summary */}
            <Text style={styles.summary} numberOfLines={2}>
              {d.problemSummary || d.result.summary}
            </Text>

            {/* Info row */}
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                {t('diagnosis.tracking.lastCheck')}:{' '}
                {lastCheckDate.toLocaleDateString()}
              </Text>
              {followUpDate && (
                <Text
                  style={[
                    styles.infoText,
                    isOverdue && styles.overdueText,
                  ]}
                >
                  {isOverdue
                    ? `${t('diagnosis.tracking.overdue')}: `
                    : `${t('diagnosis.tracking.nextFollowUp')}: `}
                  {followUpDate.toLocaleDateString()}
                </Text>
              )}
            </View>

            {/* Timeline toggle */}
            {entries.length > 0 && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => toggleTimeline(d.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {isExpanded
                    ? '▲ ' + t('diagnosis.tracking.hideTimeline')
                    : '▼ ' + t('diagnosis.tracking.showTimeline')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Inline timeline */}
            {isExpanded && (
              <ProblemTimeline entries={entries} plantIcon={plantIcon} />
            )}

            {/* CTA */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => onPressDiagnosis(d)}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaButtonText}>
                {t('diagnosis.tracking.reDiagnose')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  summary: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  overdueText: {
    color: colors.dangerText,
  },
  toggleButton: {
    marginBottom: spacing.sm,
  },
  toggleButtonText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.green,
  },
  ctaButton: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.green,
  },
});
