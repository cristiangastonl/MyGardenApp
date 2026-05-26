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
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { DiagnosisResult, DiagnosisSeverity, DiagnosisChatMessage, TrackingStatus, ToxLevel } from '../../types';
import { shouldShowTrackButton, isTrackingOptional, TRACKING_STATUS_CONFIG } from '../../services/problemTrackingService';
import { getCatalogEntry } from '../../data/plantDatabase';
import { getPetToxicity } from '../../utils/petToxicity';

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
  chatCameraPermissionDenied?: boolean;
  onPaywall?: () => void;
  // Phase 9 (DIAG-06 / DIAG-07): per-diagnosis-lifetime count display + send-tap gating
  remaining?: number;
  chatLimit?: number;
  onPaywallWithDeferredSend?: (text: string, base64?: string, uri?: string) => void;
  // Pet safety surface — when set, renders compact toxicity summary after the diagnosis summary.
  plantDatabaseId?: string;
  // Shopping list
  onAddToShoppingList?: (treatment: string) => void;
  canAddToShoppingList?: boolean;
  // Problem tracking (Phase 2)
  onTrackProblem?: () => void;
  isAlreadyTracked?: boolean;
  trackingStatus?: TrackingStatus;
  // Resolution suggestion (PROB-05)
  showResolutionSuggestion?: boolean;
  onConfirmResolution?: () => void;
  onDismissResolution?: () => void;
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
  chatCameraPermissionDenied = false,
  onPaywall,
  remaining,
  chatLimit,
  onPaywallWithDeferredSend,
  onAddToShoppingList,
  canAddToShoppingList = false,
  onTrackProblem,
  isAlreadyTracked = false,
  trackingStatus,
  showResolutionSuggestion = false,
  onConfirmResolution,
  onDismissResolution,
  plantDatabaseId,
}: DiagnosisResultsProps) {
  const { t } = useTranslation();

  const catalogEntry = plantDatabaseId ? getCatalogEntry(plantDatabaseId) : null;
  const petToxicity = catalogEntry ? getPetToxicity(catalogEntry) : null;

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
    const text = trimmed || t('diagnosis.photoSent');
    const base64 = pendingPhoto?.base64;
    const uri = pendingPhoto?.uri;

    // Phase 9 (DIAG-07): send-tap gate at 0 remaining for free users.
    // typedText captured here in closure; deferred onSuccess re-invokes sendChatMessage(text, base64, uri).
    if (!isPremium && (remaining ?? Infinity) === 0 && onPaywallWithDeferredSend) {
      onPaywallWithDeferredSend(text, base64, uri);
      setChatInput('');
      setPendingPhoto(null);
      return;
    }

    onSendChat(text, base64, uri);
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

      {/* Pet safety — renders only when the diagnosed plant matches a catalog entry. */}
      {petToxicity && (
        <View style={styles.petSafetyCard}>
          <Text style={styles.petSafetyTitle}>🐾 {t('plantDetailModal.pets')}</Text>
          {petToxicity.cats === 'safe' && petToxicity.dogs === 'safe' ? (
            <Text style={styles.petSafetyLine}>{t('toxicity.safeForBoth')}</Text>
          ) : (
            <>
              <PetSafetyLine species="cats" level={petToxicity.cats} />
              <PetSafetyLine species="dogs" level={petToxicity.dogs} />
            </>
          )}
        </View>
      )}

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

      {/* Track this problem button - premium only, non-healthy only */}
      {onTrackProblem && !isAlreadyTracked && shouldShowTrackButton(result.overallStatus, isPremium ?? false) && (
        <TouchableOpacity
          style={[
            styles.trackButton,
            isTrackingOptional(result.overallStatus) && styles.trackButtonOptional,
          ]}
          onPress={onTrackProblem}
        >
          <Text style={[
            styles.trackButtonText,
            isTrackingOptional(result.overallStatus) && styles.trackButtonTextOptional,
          ]}>
            {isTrackingOptional(result.overallStatus)
              ? t('diagnosis.tracking.trackButtonOptional')
              : t('diagnosis.tracking.trackButton')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Already tracked indicator */}
      {isAlreadyTracked && trackingStatus && (
        <View style={styles.trackedIndicator}>
          <Text style={styles.trackedIndicatorText}>
            {TRACKING_STATUS_CONFIG[trackingStatus].emoji} {t(TRACKING_STATUS_CONFIG[trackingStatus].labelKey)}
          </Text>
        </View>
      )}

      {/* Chat section */}
      {onSendChat && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('diagnosis.followUpConsultation')}</Text>

          {/* Chat messages */}
          {chatMessages.map((msg) => {
            // Phase 9 (DIAG-03 / RESEARCH §Pattern 6 + §Pitfall 6): system messages render as
            // centered italic info banners, NOT user/assistant chat bubbles.
            if (msg.role === 'system') {
              return (
                <View key={msg.id} style={styles.systemMessageBanner}>
                  <Text style={styles.systemMessageBannerText}>{msg.text}</Text>
                </View>
              );
            }
            return (
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
            );
          })}

          {/* Phase 9 (DIAG-04): resume banner — centered, above input area */}
          {isResumedChat && (
            <View style={styles.resumeBanner}>
              <Text style={styles.resumeBannerText}>{t('diagnosis.resumeBanner')}</Text>
            </View>
          )}

          {/* Resolution suggestion card - shown when AI detects improvement (PROB-05) */}
          {showResolutionSuggestion && (
            <View style={styles.resolutionCard}>
              <Text style={styles.resolutionCardTitle}>
                {t('diagnosis.tracking.improvementDetected')}
              </Text>
              <View style={styles.resolutionCardActions}>
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={onConfirmResolution}
                >
                  <Text style={styles.resolveButtonText}>
                    {t('diagnosis.tracking.markResolved')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keepTrackingButton}
                  onPress={onDismissResolution}
                >
                  <Text style={styles.keepTrackingButtonText}>
                    {t('diagnosis.tracking.keepTracking')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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

          {/* Camera permission denial inline message */}
          {chatCameraPermissionDenied && (
            <View style={styles.cameraPermissionDenied}>
              <Text style={styles.cameraPermissionDeniedText}>
                {t('diagnosis.chatCameraPermissionDenied')}
              </Text>
              <TouchableOpacity onPress={() => Linking.openSettings()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.cameraPermissionDeniedLink}>
                  {t('diagnosis.chatOpenSettings')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input or upsell */}
          {canSendChat && !chatLoading ? (
            <View>
              {/* Phase 9 (DIAG-06): per-diagnosis-lifetime remaining count, free users only */}
              {!isPremium && remaining !== undefined && (
                <Text style={[
                  styles.messagesRemainingRow,
                  remaining <= 2 && styles.messagesRemainingWarning,
                ]}>
                  {t('diagnosis.messagesRemaining', { count: remaining, total: chatLimit ?? 3 })}
                </Text>
              )}
              {pendingPhoto && (
                <View style={styles.pendingPhotoContainer}>
                  <Image source={{ uri: pendingPhoto.uri }} style={styles.pendingPhotoPreview} />
                  <TouchableOpacity style={styles.pendingPhotoRemove} onPress={() => setPendingPhoto(null)}>
                    <Text style={styles.pendingPhotoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.chatInputContainer}>
                {onPickChatPhoto && (
                  <TouchableOpacity
                    style={[styles.chatPhotoButton, !canSendChat && styles.chatPhotoButtonDisabled]}
                    onPress={canSendChat ? handlePickPhoto : onPaywall}
                  >
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
              {onPickChatPhoto && (
                <TouchableOpacity
                  style={[styles.chatPhotoButton, styles.chatPhotoButtonDisabled]}
                  onPress={onPaywall}
                >
                  <Text style={styles.chatPhotoButtonText}>📷</Text>
                </TouchableOpacity>
              )}
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
  petSafetyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  petSafetyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  petSafetyLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
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
  chatPhotoButtonDisabled: {
    opacity: 0.4,
  },
  chatPhotoButtonText: {
    fontSize: 20,
  },
  cameraPermissionDenied: {
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  cameraPermissionDeniedText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.infoText,
    lineHeight: 18,
  },
  cameraPermissionDeniedLink: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.infoText,
    textDecorationLine: 'underline',
    marginTop: 4,
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
  // Problem tracking styles
  trackButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  trackButtonOptional: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.green,
  },
  trackButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: '#fff',
  },
  trackButtonTextOptional: {
    color: colors.green,
  },
  trackedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  trackedIndicatorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
  },
  resolutionCard: {
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.green,
  },
  resolutionCardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.green,
    marginBottom: spacing.sm,
  },
  resolutionCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resolveButton: {
    flex: 1,
    backgroundColor: colors.green,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  resolveButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#fff',
  },
  keepTrackingButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  keepTrackingButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
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
  // Phase 9 styles (DIAG-04 / DIAG-06 / DIAG-03)
  resumeBanner: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  resumeBannerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.infoText,
    textAlign: 'center',
    lineHeight: 18,
  },
  systemMessageBanner: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  systemMessageBannerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.infoText,
    textAlign: 'center',
    lineHeight: 18,
  },
  messagesRemainingRow: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  messagesRemainingWarning: {
    color: colors.warningText,
  },
});

// File-private helper for the pet safety section. Mirrors the per-species
// rendering used by MyPlantDetailModal's Mascotas section, minus the symptoms
// detail (the diagnosis view shows a compact summary; users can open the
// MyPlantDetailModal Mascotas section for the full breakdown including symptoms).
function PetSafetyLine({
  species,
  level,
}: {
  species: 'cats' | 'dogs';
  level: ToxLevel;
}): React.ReactElement {
  const { t } = useTranslation();
  const speciesLabel = t(`toxicity.species.${species}`);

  if (level === 'safe') {
    return <Text style={styles.petSafetyLine}>{t('toxicity.safeForSpecies', { species: speciesLabel })}</Text>;
  }
  if (level === 'unknown') {
    return <Text style={styles.petSafetyLine}>{t('toxicity.unverifiedLatam')}</Text>;
  }
  const headerKey = level === 'toxic' ? 'toxicity.toxicForSpecies' : 'toxicity.cautionForSpecies';
  return <Text style={styles.petSafetyLine}>{t(headerKey, { species: speciesLabel })}</Text>;
}
