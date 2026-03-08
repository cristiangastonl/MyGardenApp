import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { SavedDiagnosis, DiagnosisSeverity } from '../../types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.5;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.95;
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.35;

interface DiagnosisDetailModalProps {
  visible: boolean;
  diagnosis: SavedDiagnosis | null;
  onClose: () => void;
  onResolve?: (plantId: string, diagnosisId: string) => void;
  onContinueChat?: (diagnosis: SavedDiagnosis) => void;
  onAddToShoppingList?: (treatment: string) => void;
  canAddToShoppingList?: boolean;
  isPremium?: boolean;
}

const STATUS_STYLE: Record<DiagnosisSeverity, { icon: string; color: string; bg: string }> = {
  healthy: { icon: '✅', color: colors.green, bg: colors.successBg },
  minor: { icon: '💛', color: colors.warningText, bg: colors.warningBg },
  moderate: { icon: '🟠', color: '#c47a20', bg: '#fef3e0' },
  severe: { icon: '🔴', color: colors.dangerText, bg: colors.dangerBg },
};

function formatDate(dateStr: string, monthNames: string[]): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}

export function DiagnosisDetailModal({ visible, diagnosis, onClose, onResolve, onContinueChat, onAddToShoppingList, canAddToShoppingList = false, isPremium = false }: DiagnosisDetailModalProps) {
  const { t } = useTranslation();
  const modalHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const currentHeight = useRef(COLLAPSED_HEIGHT);

  // Reset to collapsed when modal opens
  useEffect(() => {
    if (visible) {
      modalHeight.setValue(COLLAPSED_HEIGHT);
      currentHeight.current = COLLAPSED_HEIGHT;
      setIsExpanded(false);
    }
  }, [visible, modalHeight]);

  const snapTo = (target: number) => {
    currentHeight.current = target;
    setIsExpanded(target === EXPANDED_HEIGHT);
    Animated.spring(modalHeight, {
      toValue: target,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        // Dragging up = negative dy = increase height
        const newHeight = currentHeight.current - gestureState.dy;
        const clamped = Math.min(Math.max(newHeight, DISMISS_THRESHOLD * 0.8), EXPANDED_HEIGHT);
        modalHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = currentHeight.current - gestureState.dy;
        const velocity = gestureState.vy;

        // Fast flick down → dismiss
        if (velocity > 1.5 && newHeight < COLLAPSED_HEIGHT) {
          onClose();
          return;
        }

        // Fast flick up → expand
        if (velocity < -1.0) {
          snapTo(EXPANDED_HEIGHT);
          return;
        }

        // Below dismiss threshold → dismiss
        if (newHeight < DISMISS_THRESHOLD) {
          onClose();
          return;
        }

        // Snap to nearest
        const midpoint = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
        if (newHeight < midpoint) {
          snapTo(COLLAPSED_HEIGHT);
        } else {
          snapTo(EXPANDED_HEIGHT);
        }
      },
    })
  ).current;

  if (!diagnosis) return null;

  const monthNames = [
    t('diagnosis.monthJan'), t('diagnosis.monthFeb'), t('diagnosis.monthMar'),
    t('diagnosis.monthApr'), t('diagnosis.monthMay'), t('diagnosis.monthJun'),
    t('diagnosis.monthJul'), t('diagnosis.monthAug'), t('diagnosis.monthSep'),
    t('diagnosis.monthOct'), t('diagnosis.monthNov'), t('diagnosis.monthDec'),
  ];

  const STATUS_LABELS: Record<DiagnosisSeverity, string> = {
    healthy: t('diagnosis.statusHealthy'),
    minor: t('diagnosis.statusMinor'),
    moderate: t('diagnosis.statusModerate'),
    severe: t('diagnosis.statusSevere'),
  };

  const result = diagnosis.result;
  const statusStyle = STATUS_STYLE[result.overallStatus];
  const statusLabel = STATUS_LABELS[result.overallStatus];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.container, { height: modalHeight }]}>
            {/* Draggable handle area */}
            <View {...panResponder.panHandlers} style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.dragIndicator}>{isExpanded ? '▼' : '▲'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{t('diagnosis.detailTitle')}</Text>
              <Text style={styles.dateText}>{formatDate(diagnosis.date, monthNames)}</Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
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

              {/* Chat history */}
              {diagnosis.chat.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('diagnosis.followUpQueries')}</Text>
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

              {/* Continue chat button (premium) */}
              {isPremium && !diagnosis.resolved && onContinueChat && (
                <TouchableOpacity
                  style={styles.continueChatAction}
                  onPress={() => onContinueChat(diagnosis)}
                >
                  <Text style={styles.continueChatActionText}>{t('diagnosis.continueChat')}</Text>
                </TouchableOpacity>
              )}

              {/* Resolve button / badge */}
              {diagnosis.resolved ? (
                <View style={styles.resolvedBadge}>
                  <Text style={styles.resolvedBadgeIcon}>✅</Text>
                  <Text style={styles.resolvedBadgeText}>
                    {t('diagnosis.resolvedOn', { date: diagnosis.resolvedDate ? formatDate(diagnosis.resolvedDate, monthNames) : '' })}
                  </Text>
                </View>
              ) : result.overallStatus !== 'healthy' && onResolve ? (
                <TouchableOpacity
                  style={styles.resolveAction}
                  onPress={() => onResolve(diagnosis.plantId, diagnosis.id)}
                >
                  <Text style={styles.resolveActionText}>{t('diagnosis.markAsResolved')}</Text>
                </TouchableOpacity>
              ) : null}

              {/* Close button */}
              <TouchableOpacity style={styles.closeAction} onPress={onClose}>
                <Text style={styles.closeActionText}>{t('diagnosis.close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
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
    ...shadows.lg,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  dragIndicator: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 44,
    height: 44,
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
  // Continue chat
  continueChatAction: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueChatActionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  // Resolve action
  resolveAction: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resolveActionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.white,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  resolvedBadgeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  resolvedBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
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
