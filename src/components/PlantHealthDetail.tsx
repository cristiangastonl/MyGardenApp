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
import { Plant, PlantHealthStatus, HealthIssueSeverity } from '../types';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import {
  getHealthColor,
  getHealthBgColor,
  getHealthMessage,
} from '../utils/plantHealth';
import { formatDate } from '../utils/dates';
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
        return 'Urgente';
      case 'medium':
        return 'Importante';
      case 'low':
        return 'Sugerencia';
    }
  };

  const getSuggestion = (issueType: string): string => {
    switch (issueType) {
      case 'overdue_water':
        return 'Rega la planta lo antes posible. Asegurate de mojar bien toda la tierra.';
      case 'overdue_sun':
        return 'Coloca la planta en un lugar con luz natural durante las horas recomendadas.';
      case 'no_care':
        return 'Registra cuando riegas o cuidas la planta para hacer un seguimiento.';
      case 'extreme_weather':
        return 'Presta atencion a las condiciones climaticas y protege tus plantas.';
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
                <Text style={styles.scoreLabel}>SALUD</Text>
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
                <Text style={styles.sectionTitle}>PROBLEMAS DETECTADOS</Text>
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
                          Hace {issue.daysSince} {issue.daysSince === 1 ? 'dia' : 'dias'}
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
                <Text style={styles.noIssuesTitle}>Tu planta esta sana</Text>
                <Text style={styles.noIssuesText}>
                  No hay problemas detectados. Segui cuidandola asi!
                </Text>
              </View>
            )}

            {/* Care History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HISTORIAL RECIENTE</Text>
              <View style={styles.historyCard}>
                <View style={styles.historyItem}>
                  <Text style={styles.historyIcon}>💧</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>Ultimo riego</Text>
                    <Text style={styles.historyValue}>
                      {plant.lastWatered
                        ? formatDateFriendly(plant.lastWatered)
                        : 'Sin registro'}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDivider} />
                <View style={styles.historyItem}>
                  <Text style={styles.historyIcon}>☀️</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>Ultima exposicion al sol</Text>
                    <Text style={styles.historyValue}>
                      {plant.sunDoneDate
                        ? formatDateFriendly(plant.sunDoneDate)
                        : 'Sin registro'}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDivider} />
                <View style={styles.historyItem}>
                  <Text style={styles.historyIcon}>🌤️</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyLabel}>Ultima salida al exterior</Text>
                    <Text style={styles.historyValue}>
                      {plant.outdoorDoneDate
                        ? formatDateFriendly(plant.outdoorDoneDate)
                        : 'Sin registro'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CONSEJOS</Text>
              <View style={styles.tipsCard}>
                <Text style={styles.tipItem}>
                  • Riega cada {plant.waterEvery} dias para mantenerla saludable
                </Text>
                {plant.sunHours > 0 && (
                  <Text style={styles.tipItem}>
                    • Necesita {plant.sunHours} horas de sol por dia
                  </Text>
                )}
                {plant.sunDays.length > 0 && (
                  <Text style={styles.tipItem}>
                    • Dias de sol: {getDayNames(plant.sunDays)}
                  </Text>
                )}
                {plant.outdoorDays.length > 0 && (
                  <Text style={styles.tipItem}>
                    • Sacar afuera: {getDayNames(plant.outdoorDays)}
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

function formatDateFriendly(dateStr: string): string {
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (dateStr === todayStr) return 'Hoy';
  if (dateStr === yesterdayStr) return 'Ayer';

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff < 7) {
    return `Hace ${dayDiff} dias`;
  }

  const dayNames = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  return `${dayNames[date.getDay()]} ${day}/${month}`;
}

function getDayNames(days: number[]): string {
  const names = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
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
