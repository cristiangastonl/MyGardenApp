import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { SavedDiagnosis, DiagnosisSeverity } from '../../types';

interface DiagnosisDetailModalProps {
  visible: boolean;
  diagnosis: SavedDiagnosis | null;
  onClose: () => void;
}

const STATUS_CONFIG: Record<DiagnosisSeverity, { icon: string; label: string; color: string; bg: string }> = {
  healthy: { icon: '✅', label: 'Saludable', color: colors.green, bg: colors.successBg },
  minor: { icon: '💛', label: 'Leve', color: colors.warningText, bg: colors.warningBg },
  moderate: { icon: '🟠', label: 'Moderado', color: '#c47a20', bg: '#fef3e0' },
  severe: { icon: '🔴', label: 'Grave', color: colors.dangerText, bg: colors.dangerBg },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} de ${month}, ${hours}:${minutes}`;
}

export function DiagnosisDetailModal({ visible, diagnosis, onClose }: DiagnosisDetailModalProps) {
  if (!diagnosis) return null;

  const result = diagnosis.result;
  const statusConfig = STATUS_CONFIG[result.overallStatus];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Diagnóstico</Text>
              <Text style={styles.dateText}>{formatDate(diagnosis.date)}</Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>

              {/* Summary */}
              <Text style={styles.summary}>{result.summary}</Text>

              {/* Issues */}
              {result.issues.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PROBLEMAS DETECTADOS</Text>
                  {result.issues.map((issue, index) => {
                    const issueConfig = STATUS_CONFIG[issue.severity];
                    return (
                      <View key={index} style={styles.issueCard}>
                        <View style={styles.issueHeader}>
                          <Text style={styles.issueName}>{issue.name}</Text>
                          <View style={[styles.confidenceBadge, { backgroundColor: issueConfig.bg }]}>
                            <Text style={[styles.confidenceText, { color: issueConfig.color }]}>
                              {issue.confidence}%
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.issueDescription}>{issue.description}</Text>
                        <View style={styles.treatmentContainer}>
                          <Text style={styles.treatmentLabel}>TRATAMIENTO</Text>
                          <Text style={styles.treatmentText}>{issue.treatment}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Care tips */}
              {result.careTips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>CONSEJOS</Text>
                  <View style={styles.tipsContainer}>
                    {result.careTips.map((tip, index) => (
                      <View key={index} style={styles.tipRow}>
                        <Text style={styles.tipBullet}>💡</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Chat history */}
              {diagnosis.chat.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>CONSULTAS DE SEGUIMIENTO</Text>
                  {diagnosis.chat.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.chatBubble,
                        msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chatBubbleText,
                          msg.role === 'user' ? styles.chatBubbleTextUser : styles.chatBubbleTextAssistant,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Close button */}
              <TouchableOpacity style={styles.closeAction} onPress={onClose}>
                <Text style={styles.closeActionText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '95%',
    minHeight: '50%',
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    padding: spacing.lg,
  },
  // Status
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  statusLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  summary: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  // Issues
  issueCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  issueName: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.textPrimary,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  confidenceText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
  issueDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  treatmentContainer: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  treatmentLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.infoText,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  treatmentText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 19,
  },
  // Tips
  tipsContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  // Chat
  chatBubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.green,
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  chatBubbleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  chatBubbleTextUser: {
    color: colors.white,
  },
  chatBubbleTextAssistant: {
    color: colors.textPrimary,
  },
  // Close action
  closeAction: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  closeActionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
