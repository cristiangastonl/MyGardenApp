import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { DiagnosisResult, DiagnosisSeverity, DiagnosisChatMessage } from '../../types';

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  onRetake: () => void;
  onClose: () => void;
  // Chat props
  chatMessages?: DiagnosisChatMessage[];
  chatLoading?: boolean;
  chatError?: string | null;
  canSendChat?: boolean;
  onSendChat?: (message: string) => void;
  isPremium?: boolean;
}

const STATUS_CONFIG: Record<DiagnosisSeverity, { icon: string; label: string; color: string; bg: string }> = {
  healthy: { icon: '✅', label: 'Saludable', color: colors.green, bg: colors.successBg },
  minor: { icon: '💛', label: 'Leve', color: colors.warningText, bg: colors.warningBg },
  moderate: { icon: '🟠', label: 'Moderado', color: '#c47a20', bg: '#fef3e0' },
  severe: { icon: '🔴', label: 'Grave', color: colors.dangerText, bg: colors.dangerBg },
};

export function DiagnosisResults({
  result,
  onRetake,
  onClose,
  chatMessages = [],
  chatLoading = false,
  chatError = null,
  canSendChat = false,
  onSendChat,
  isPremium = false,
}: DiagnosisResultsProps) {
  const statusConfig = STATUS_CONFIG[result.overallStatus];
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if (!trimmed || !onSendChat) return;
    onSendChat(trimmed);
    setChatInput('');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      {/* Chat section */}
      {onSendChat && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONSULTA DE SEGUIMIENTO</Text>

          {/* Chat messages */}
          {chatMessages.map((msg) => (
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

          {/* Loading indicator */}
          {chatLoading && (
            <View style={styles.chatLoadingContainer}>
              <ActivityIndicator size="small" color={colors.green} />
              <Text style={styles.chatLoadingText}>Analizando tu consulta...</Text>
            </View>
          )}

          {/* Chat error */}
          {chatError && (
            <Text style={styles.chatErrorText}>{chatError}</Text>
          )}

          {/* Input or upsell */}
          {canSendChat && !chatLoading ? (
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ej: eso es tierra, no plaga..."
                placeholderTextColor={colors.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.chatSendButton, !chatInput.trim() && styles.chatSendButtonDisabled]}
                onPress={handleSendChat}
                disabled={!chatInput.trim()}
              >
                <Text style={styles.chatSendButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          ) : !canSendChat && !isPremium && chatMessages.length > 0 ? (
            <View style={styles.upsellContainer}>
              <Text style={styles.upsellText}>
                Querés seguir consultando? Pasate a Premium
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
          <Text style={styles.retakeButtonText}>Tomar otra foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
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
  // Chat styles
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
  chatLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  chatLoadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  chatErrorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dangerText,
    marginBottom: spacing.sm,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 80,
    ...shadows.sm,
  },
  chatSendButton: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  chatSendButtonDisabled: {
    opacity: 0.5,
  },
  chatSendButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  upsellContainer: {
    backgroundColor: colors.warningBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  upsellText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.warningText,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  retakeButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retakeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  closeButton: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
