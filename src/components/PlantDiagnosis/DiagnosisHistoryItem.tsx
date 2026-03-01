import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { SavedDiagnosis, DiagnosisSeverity } from '../../types';

interface DiagnosisHistoryItemProps {
  diagnosis: SavedDiagnosis;
  onPress: (diagnosis: SavedDiagnosis) => void;
}

const STATUS_CONFIG: Record<DiagnosisSeverity, { icon: string; label: string; color: string; bg: string }> = {
  healthy: { icon: '✅', label: 'Saludable', color: colors.green, bg: colors.successBg },
  minor: { icon: '💛', label: 'Leve', color: colors.warningText, bg: colors.warningBg },
  moderate: { icon: '🟠', label: 'Moderado', color: '#c47a20', bg: '#fef3e0' },
  severe: { icon: '🔴', label: 'Grave', color: colors.dangerText, bg: colors.dangerBg },
};

function formatDiagnosisDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
}

export function DiagnosisHistoryItem({ diagnosis, onPress }: DiagnosisHistoryItemProps) {
  const config = STATUS_CONFIG[diagnosis.result.overallStatus];
  const chatCount = diagnosis.chat.filter(m => m.role === 'user').length;
  const issueCount = diagnosis.result.issues.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(diagnosis)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <View style={styles.headerInfo}>
          <View style={styles.headerTop}>
            <Text style={[styles.statusLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.date}>{formatDiagnosisDate(diagnosis.date)}</Text>
          </View>
          <Text style={styles.summary} numberOfLines={2}>
            {diagnosis.result.summary}
          </Text>
          <View style={styles.metaRow}>
            {issueCount > 0 && (
              <Text style={styles.metaText}>
                {issueCount === 1 ? '1 problema' : `${issueCount} problemas`}
              </Text>
            )}
            {chatCount > 0 && (
              <Text style={styles.metaText}>
                {chatCount === 1 ? '1 consulta' : `${chatCount} consultas`}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  headerInfo: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  metaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: spacing.sm,
    marginTop: 2,
  },
});
