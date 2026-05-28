import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { SavedDiagnosis, DiagnosisSeverity } from '../../types';

interface DiagnosisHistoryItemProps {
  diagnosis: SavedDiagnosis;
  onPress: (diagnosis: SavedDiagnosis) => void;
}

const STATUS_STYLE: Record<DiagnosisSeverity, { icon: string; color: string; bg: string }> = {
  healthy: { icon: '✅', color: colors.green, bg: colors.successBg },
  minor: { icon: '💛', color: colors.warningText, bg: colors.warningBg },
  moderate: { icon: '🟠', color: '#c47a20', bg: '#fef3e0' },
  severe: { icon: '🔴', color: colors.dangerText, bg: colors.dangerBg },
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
  const { t } = useTranslation();
  const STATUS_LABELS: Record<DiagnosisSeverity, string> = {
    healthy: t('diagnosis.statusHealthy'),
    minor: t('diagnosis.statusMinor'),
    moderate: t('diagnosis.statusModerate'),
    severe: t('diagnosis.statusSevere'),
  };
  const style = STATUS_STYLE[diagnosis.result.overallStatus];
  const label = STATUS_LABELS[diagnosis.result.overallStatus];
  const chatCount = diagnosis.chat.filter(m => m.role === 'user').length;
  const issueCount = diagnosis.result.issues.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(diagnosis)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.statusIcon}>{style.icon}</Text>
        <View style={styles.headerInfo}>
          <View style={styles.headerTop}>
            <Text style={[styles.statusLabel, { color: style.color }]}>
              {label}
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
