import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Plant, SavedDiagnosis, DiagnosisSeverity } from '../types';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import { Features } from '../config/features';

interface DiagnosisFollowUpProps {
  plants: Plant[];
  diagnosisHistory: Record<string, SavedDiagnosis[]>;
  onResolve: (plantId: string, diagnosisId: string) => void;
  onPressDiagnosis: (diagnosis: SavedDiagnosis) => void;
}

const SEVERITY_CONFIG: Record<DiagnosisSeverity, { icon: string; label: string; color: string; bg: string; border: string }> = {
  healthy: { icon: '✅', label: 'Saludable', color: colors.green, bg: colors.successBg, border: colors.green },
  minor: { icon: '💛', label: 'Leve', color: colors.warningText, bg: colors.warningBg, border: colors.sunGold },
  moderate: { icon: '🟠', label: 'Moderado', color: '#c47a20', bg: '#fef3e0', border: '#c47a20' },
  severe: { icon: '🔴', label: 'Grave', color: colors.dangerText, bg: colors.dangerBg, border: colors.dangerText },
};

function formatDiagnosisDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[date.getMonth()]}`;
}

export function DiagnosisFollowUp({
  plants,
  diagnosisHistory,
  onResolve,
  onPressDiagnosis,
}: DiagnosisFollowUpProps) {
  if (!Features.DLC_PEST_DIAGNOSIS) return null;

  // Collect all active diagnoses across all plants
  const activeDiagnoses: { plant: Plant; diagnosis: SavedDiagnosis }[] = [];
  for (const plant of plants) {
    const diagnoses = diagnosisHistory[plant.id] || [];
    for (const d of diagnoses) {
      if (!d.resolved && d.result.overallStatus !== 'healthy') {
        activeDiagnoses.push({ plant, diagnosis: d });
      }
    }
  }

  if (activeDiagnoses.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionIcon}>🩺</Text>
        <Text style={styles.sectionTitle}>Seguimiento de diagnosticos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{activeDiagnoses.length}</Text>
        </View>
      </View>

      {activeDiagnoses.map(({ plant, diagnosis }) => {
        const config = SEVERITY_CONFIG[diagnosis.result.overallStatus];
        const firstIssue = diagnosis.result.issues[0];

        return (
          <TouchableOpacity
            key={diagnosis.id}
            style={[styles.card, { borderLeftColor: config.border }]}
            onPress={() => onPressDiagnosis(diagnosis)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardPlantInfo}>
                <Text style={styles.plantIcon}>{plant.icon}</Text>
                <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                <Text style={styles.severityIcon}>{config.icon}</Text>
                <Text style={[styles.severityLabel, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>

            <Text style={styles.dateText}>{formatDiagnosisDate(diagnosis.date)}</Text>

            {firstIssue && (
              <View style={styles.issuePreview}>
                <Text style={styles.issueName} numberOfLines={1}>{firstIssue.name}</Text>
                <Text style={styles.issueTreatment} numberOfLines={2}>{firstIssue.treatment}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => onResolve(plant.id, diagnosis.id)}
            >
              <Text style={styles.resolveButtonText}>✅ Marcar como resuelto</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.dangerBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.dangerText,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardPlantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plantIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  plantName: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  severityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  severityLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  issuePreview: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  issueName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  issueTreatment: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  resolveButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.successBg,
  },
  resolveButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
  },
});
