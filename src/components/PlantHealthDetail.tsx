import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plant, PlantHealthStatus, HealthIssueSeverity } from '../types';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import {
  getHealthColor,
  getHealthBgColor,
  getHealthMessage,
} from '../utils/plantHealth';
import { formatDate } from '../utils/dates';
import { getDaysShort } from '../data/constants';
import { ProgressBar } from './ProgressBar';

interface PlantHealthDetailProps {
  visible: boolean;
  onClose: () => void;
  plant: Plant;
  healthStatus: PlantHealthStatus;
}

export function PlantHealthDetail({
  visible,
  onClose,
  plant,
  healthStatus,
}: PlantHealthDetailProps) {
  const { t } = useTranslation();
  const healthColor = getHealthColor(healthStatus.level);
  const healthBgColor = getHealthBgColor(healthStatus.level);
  const healthMessage = getHealthMessage(healthStatus.level);

  const getSeverityColor = (severity: HealthIssueSeverity): string => {
    switch (severity) {
      case 'high':
        return colors.dangerText;
      case 'medium':
        return colors.warningText;
      case 'low':
        return colors.textSecondary;
    }
  };

  const getSeverityLabel = (severity: HealthIssueSeverity): string => {
    switch (severity) {
      case 'high':
        return t('health.urgent');
      case 'medium':
        return t('health.important');
      case 'low':
        return t('health.suggestion');
    }
  };

  const getSuggestion = (issueType: string): string => {
    switch (issueType) {
      case 'overdue_water':
        return t('health.overdueWaterSuggestion');
      case 'overdue_sun':
        return t('health.overdueSunSuggestion');
      case 'no_care':
        return t('health.noCareSuggestion');
      case 'extreme_weather':
        return t('health.extremeWeatherSuggestion');
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: healthBgColor }]}>
            <View style={styles.headerContent}>
              <Text style={styles.plantIcon}>{plant.icon}</Text>
              <View style={styles.headerInfo}>
                <Text style={styles.plantName}>{plant.name}</Text>
                <Text style={[styles.healthLevel, { color: healthColor }]}>
                  {healthMessage}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>x</Text>
              </Pressable>
            </View>

            {/* Health Score Bar */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreLabel}>{t('health.healthLabel')}</Text>
                <Text style={[styles.scoreValue, { color: healthColor }]}>
                  {healthStatus.score}/100
                </Text>
              </View>
              <ProgressBar
                progress={healthStatus.score / 100}
                color={healthColor}
                backgroundColor={colors.white}
                height={8}
              />
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Issues List */}
            {healthStatus.issues.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('health.detectedProblems')}</Text>
                {healthStatus.issues.map((issue, index) => (
                  <View key={index} style={styles.issueCard}>
                    <View style={styles.issueHeader}>
                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(issue.severity) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityText,
                            { color: getSeverityColor(issue.severity) },
                          ]}
                        >
                          {getSeverityLabel(issue.severity)}
                        </Text>
                      </View>
                      {issue.daysSince !== undefined && (
                        <Text style={styles.daysSince}>
                          {t('health.daysAgo', { count: issue.daysSince })}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.issueMessage}>{issue.message}</Text>
                    <Text style={styles.issueSuggestion}>
                      {getSuggestion(issue.type)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noIssuesSection}>
                <Text style={styles.noIssuesIcon}>🌿</Text>
                <Text style={styles.noIssuesTitle}>{t('health.plantHealthy')}</Text>
                <Text style={styles.noIssuesText}>
                  {t('health.keepItUp')}
                </Text>
              </View>
            )}

            {/* Care History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('health.recentHistory')}</Text>
              <View style={styles.historyCard}>
                <View style={styles.historyItem}>
                  <Text style={styles.historyIcon}>💧</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>{t('health.lastWatering')}</Text>
                    <Text style={styles.historyValue}>
                      {plant.lastWatered
                        ? formatDateFriendly(plant.lastWatered, t)
                        : t('health.noRecord')}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDivider} />
                <View style={styles.historyItem}>
                  <Text style={styles.historyIcon}>☀️</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>{t('health.lastSun')}</Text>
                    <Text style={styles.historyValue}>
                      {plant.sunDoneDate
                        ? formatDateFriendly(plant.sunDoneDate, t)
                        : t('health.noRecord')}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDivider} />
                <View style={styles.historyItem}>
                  <Text style={styles.historyIcon}>🌤️</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>{t('health.lastOutdoor')}</Text>
                    <Text style={styles.historyValue}>
                      {plant.outdoorDoneDate
                        ? formatDateFriendly(plant.outdoorDoneDate, t)
                        : t('health.noRecord')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('health.tipsLabel')}</Text>
              <View style={styles.tipsCard}>
                <Text style={styles.tipItem}>
                  {t('health.waterEvery', { days: plant.waterEvery })}
                </Text>
                {plant.sunHours > 0 && (
                  <Text style={styles.tipItem}>
                    {t('health.needsSunHours', { hours: plant.sunHours })}
                  </Text>
                )}
                {plant.sunDays.length > 0 && (
                  <Text style={styles.tipItem}>
                    {t('health.sunDaysLabel', { days: getDayNames(plant.sunDays) })}
                  </Text>
                )}
                {plant.outdoorDays.length > 0 && (
                  <Text style={styles.tipItem}>
                    {t('health.outdoorDaysLabel', { days: getDayNames(plant.outdoorDays) })}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function formatDateFriendly(dateStr: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (dateStr === todayStr) return t('health.today');
  if (dateStr === yesterdayStr) return t('health.yesterday');

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff < 7) {
    return t('health.daysAgo', { count: dayDiff });
  }

  const dayNames = getDaysShort();
  return `${dayNames[date.getDay()]} ${day}/${month}`;
}

function getDayNames(days: number[]): string {
  const names = getDaysShort();
  return days.map((d) => names[d]).join(', ');
}

interface Styles {
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  plantIcon: TextStyle;
  headerInfo: ViewStyle;
  plantName: TextStyle;
  healthLevel: TextStyle;
  closeButton: ViewStyle;
  closeIcon: TextStyle;
  scoreSection: ViewStyle;
  scoreHeader: ViewStyle;
  scoreLabel: TextStyle;
  scoreValue: TextStyle;
  content: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  issueCard: ViewStyle;
  issueHeader: ViewStyle;
  severityBadge: ViewStyle;
  severityText: TextStyle;
  daysSince: TextStyle;
  issueMessage: TextStyle;
  issueSuggestion: TextStyle;
  noIssuesSection: ViewStyle;
  noIssuesIcon: TextStyle;
  noIssuesTitle: TextStyle;
  noIssuesText: TextStyle;
  historyCard: ViewStyle;
  historyItem: ViewStyle;
  historyIcon: TextStyle;
  historyInfo: ViewStyle;
  historyLabel: TextStyle;
  historyValue: TextStyle;
  historyDivider: ViewStyle;
  tipsCard: ViewStyle;
  tipItem: TextStyle;
  bottomPadding: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '88%',
  },
  header: {
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  plantIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  plantName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
  },
  healthLevel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
  scoreSection: {
    marginTop: spacing.sm,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scoreLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  scoreValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  issueCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysSince: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  issueMessage: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  issueSuggestion: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  noIssuesSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  noIssuesIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noIssuesTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  noIssuesText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  historyIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 28,
    textAlign: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  historyValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 2,
  },
  historyDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  tipsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  tipItem: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  bottomPadding: {
    height: spacing.xxxl,
  },
});
