import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { DiagnosisResult, DiagnosisSeverity, DiagnosisChatMessage } from '../../types';

interface DiagnosisResultsProps {
  result: DiagnosisResult;
  onRetake: () => void;
  onClose: () => void;
  isResumedChat?: boolean;
  // Chat props
  chatMessages?: DiagnosisChatMessage[];
  chatLoading?: boolean;
  chatError?: string | null;
  canSendChat?: boolean;
  onSendChat?: (message: string, imageBase64?: string, imageUri?: string) => void;
  onPickChatPhoto?: () => Promise<{ base64: string; uri: string } | null>;
  isPremium?: boolean;
  // Shopping list
  onAddToShoppingList?: (treatment: string) => void;
  canAddToShoppingList?: boolean;
}

const STATUS_STYLE: Record<DiagnosisSeverity, { icon: string; color: string; bg: string }> = {
  healthy: { icon: '✅', color: colors.green, bg: colors.successBg },
  minor: { icon: '💛', color: colors.warningText, bg: colors.warningBg },
  moderate: { icon: '🟠', color: '#c47a20', bg: '#fef3e0' },
  severe: { icon: '🔴', color: colors.dangerText, bg: colors.dangerBg },
};

export function DiagnosisResults({
  result,
  onRetake,
  onClose,
  isResumedChat = false,
  chatMessages = [],
  chatLoading = false,
  chatError = null,
  canSendChat = false,
  onSendChat,
  onPickChatPhoto,
  isPremium = false,
  onAddToShoppingList,
  canAddToShoppingList = false,
}: DiagnosisResultsProps) {
  const { t } = useTranslation();

  const STATUS_LABELS: Record<DiagnosisSeverity, string> = {
    healthy: t('diagnosis.statusHealthy'),
    minor: t('diagnosis.statusMinor'),
    moderate: t('diagnosis.statusModerate'),
    severe: t('diagnosis.statusSevere'),
  };

  const statusStyle = STATUS_STYLE[result.overallStatus];
  const statusLabel = STATUS_LABELS[result.overallStatus];
  const [chatInput, setChatInput] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<{ base64: string; uri: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleSendChat = () => {
    const trimmed = chatInput.trim();
    if ((!trimmed && !pendingPhoto) || !onSendChat) return;
    onSendChat(trimmed || t('diagnosis.photoSent'), pendingPhoto?.base64, pendingPhoto?.uri);
    setChatInput('');
    setPendingPhoto(null);
  };

  const handlePickPhoto = async () => {
    if (!onPickChatPhoto) return;
    const photo = await onPickChatPhoto();
    if (photo) {
      setPendingPhoto(photo);
      scrollToEnd();
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    // Second scroll after layout settles (fixes first-time keyboard open)
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 400);
  };

  // Listen to keyboard events to add bottom padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollToEnd();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll when new messages arrive or loading starts
  useEffect(() => {
    if (chatMessages.length > 0 || chatLoading) {
      scrollToEnd();
    }
  }, [chatMessages.length, chatLoading]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : spacing.xxl }}
    >
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={styles.statusIcon}>{statusStyle.icon}</Text>
        <Text style={[styles.statusLabel, { color: statusStyle.color }]}>
          {statusLabel}
        </Text>
      </View>

      {/* Summary */}
      <Text style={styles.summary}>{result.summary}</Text>

      {/* Issues */}
      {result.issues.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('diagnosis.problemsDetected')}</Text>
          {result.issues.map((issue, index) => {
            const issueConfig = STATUS_STYLE[issue.severity];
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
                  <Text style={styles.treatmentLabel}>{t('diagnosis.treatment')}</Text>
                  <Text style={styles.treatmentText}>{issue.treatment}</Text>
                  {canAddToShoppingList && onAddToShoppingList && (
                    <TouchableOpacity
                      style={styles.shoppingButton}
                      onPress={() => onAddToShoppingList(issue.treatment)}
                    >
                      <Text style={styles.shoppingButtonText}>{t('diagnosis.addToShoppingList')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Care tips */}
      {result.careTips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('diagnosis.tips')}</Text>
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
          <Text style={styles.sectionTitle}>{t('diagnosis.followUpConsultation')}</Text>

          {/* Chat messages */}
          {chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.chatBubble,
                msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
              ]}
            >
              {msg.imageUri && (
                <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />
              )}
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
              <Text style={styles.chatLoadingText}>{t('diagnosis.analyzingQuery')}</Text>
            </View>
          )}

          {/* Chat error */}
          {chatError && (
            <Text style={styles.chatErrorText}>{chatError}</Text>
          )}

          {/* Input or upsell */}
          {canSendChat && !chatLoading ? (
            <View>
              {pendingPhoto && (
                <View style={styles.pendingPhotoContainer}>
                  <Image source={{ uri: pendingPhoto.uri }} style={styles.pendingPhotoPreview} />
                  <TouchableOpacity style={styles.pendingPhotoRemove} onPress={() => setPendingPhoto(null)}>
                    <Text style={styles.pendingPhotoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.chatInputContainer}>
                {onPickChatPhoto && isPremium && (
                  <TouchableOpacity style={styles.chatPhotoButton} onPress={handlePickPhoto}>
                    <Text style={styles.chatPhotoButtonText}>📷</Text>
                  </TouchableOpacity>
                )}
                <TextInput
                  style={styles.chatInput}
                  placeholder={t('diagnosis.chatPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onFocus={scrollToEnd}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.chatSendButton, (!chatInput.trim() && !pendingPhoto) && styles.chatSendButtonDisabled]}
                  onPress={handleSendChat}
                  disabled={!chatInput.trim() && !pendingPhoto}
                >
                  <Text style={styles.chatSendButtonText}>{t('diagnosis.send')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : !canSendChat && !isPremium && chatMessages.length > 0 ? (
            <View style={styles.upsellContainer}>
              <Text style={styles.upsellText}>
                {t('diagnosis.upsellChat')}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!isResumedChat && (
          <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
            <Text style={styles.retakeButtonText}>{t('diagnosis.retakePhoto')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{t('diagnosis.close')}</Text>
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
  shoppingButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  shoppingButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.green,
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
  chatImage: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pendingPhotoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pendingPhotoPreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  pendingPhotoRemove: {
    backgroundColor: colors.dangerBg,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    marginTop: -4,
  },
  pendingPhotoRemoveText: {
    fontSize: 12,
    color: colors.dangerText,
    fontFamily: fonts.bodySemiBold,
  },
  chatPhotoButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  chatPhotoButtonText: {
    fontSize: 20,
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
