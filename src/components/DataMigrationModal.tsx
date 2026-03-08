import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';

interface DataMigrationModalProps {
  visible: boolean;
  plantCount: number;
  onUploadToCloud: () => Promise<void>;
  onStartFresh: () => void;
  onCancel: () => void;
}

export function DataMigrationModal({
  visible,
  plantCount,
  onUploadToCloud,
  onStartFresh,
  onCancel,
}: DataMigrationModalProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    await onUploadToCloud();
    setIsUploading(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.icon}>🌱</Text>
          <Text style={styles.title}>{t('dataMigration.title')}</Text>
          <Text style={styles.description}>
            {t('dataMigration.description', { count: plantCount })}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>☁️</Text>
                  <Text style={styles.primaryButtonText}>{t('dataMigration.uploadToCloud')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onStartFresh}
              disabled={isUploading}
            >
              <Text style={styles.buttonIcon}>✨</Text>
              <Text style={styles.secondaryButtonText}>{t('dataMigration.startFresh')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isUploading}
          >
            <Text style={styles.cancelButtonText}>{t('dataMigration.cancel')}</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            {t('dataMigration.hint')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 58, 46, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.green,
  },
  secondaryButton: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
