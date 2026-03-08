import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';

interface CameraCaptureProps {
  imageUri: string | null;
  imageUris?: string[];
  maxPhotos?: number;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onAnalyze: () => void;
  onRetake: () => void;
  onRemoveImage?: (index: number) => void;
  analyzeLabel?: string;
  title?: string;
  subtitle?: string;
  tips?: string[];
}

export function CameraCapture({
  imageUri,
  imageUris,
  maxPhotos = 1,
  onPickCamera,
  onPickGallery,
  onAnalyze,
  onRetake,
  onRemoveImage,
  analyzeLabel,
  title,
  subtitle,
  tips,
}: CameraCaptureProps) {
  const { t } = useTranslation();
  const resolvedAnalyzeLabel = analyzeLabel ?? t('camera.identify');
  const resolvedTitle = title ?? t('camera.defaultTitle');
  const resolvedSubtitle = subtitle ?? t('camera.defaultSubtitle');
  const resolvedTips = tips ?? [t('camera.defaultTip1'), t('camera.defaultTip2'), t('camera.defaultTip3')];
  const photos = imageUris && imageUris.length > 0 ? imageUris : imageUri ? [imageUri] : [];
  const isMultiMode = maxPhotos > 1;
  const canAddMore = isMultiMode && photos.length < maxPhotos;

  if (photos.length > 0) {
    // Multi-photo preview
    if (isMultiMode) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.photoCount}>
            {t('camera.photoCount', { current: photos.length, max: maxPhotos })}
          </Text>

          <View style={styles.thumbnailGrid}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                {onRemoveImage && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveImage(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.photoNumber}>
                  <Text style={styles.photoNumberText}>{index + 1}</Text>
                </View>
              </View>
            ))}

            {canAddMore && (
              <View style={styles.addPhotoContainer}>
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={onPickCamera}
                >
                  <Text style={styles.addPhotoIcon}>📸</Text>
                  <Text style={styles.addPhotoLabel}>{t('camera.cameraButton')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={onPickGallery}
                >
                  <Text style={styles.addPhotoIcon}>🖼️</Text>
                  <Text style={styles.addPhotoLabel}>{t('camera.galleryButton')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {canAddMore && (
            <Text style={styles.addPhotoHint}>
              {maxPhotos - photos.length > 1
                ? t('camera.addMoreHintPlural', { count: maxPhotos - photos.length })
                : t('camera.addMoreHint', { count: maxPhotos - photos.length })}
            </Text>
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
              <Text style={styles.retakeButtonText}>{t('camera.startOver')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze}>
              <Text style={styles.analyzeButtonText}>{resolvedAnalyzeLabel}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // Single photo preview (original behavior for identification)
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photos[0] }} style={styles.preview} />
        </View>

        <Text style={styles.previewHint}>
          {t('camera.previewHint')}
        </Text>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
            <Text style={styles.retakeButtonText}>{t('camera.anotherPhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze}>
            <Text style={styles.analyzeButtonText}>{resolvedAnalyzeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show camera/gallery options
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.mainIcon}>📷</Text>
      </View>

      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.subtitle}>{resolvedSubtitle}</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={onPickCamera}>
          <Text style={styles.optionIcon}>📸</Text>
          <Text style={styles.optionLabel}>{t('camera.cameraButton')}</Text>
          <Text style={styles.optionHint}>{t('camera.takePhotoNow')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={onPickGallery}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={styles.optionLabel}>{t('camera.galleryButton')}</Text>
          <Text style={styles.optionHint}>{t('camera.chooseExisting')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>{t('camera.tipsTitle')}</Text>
        {resolvedTips.map((tip, i) => (
          <Text key={i} style={styles.tip}>• {tip}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  mainIcon: {
    fontSize: 64,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  tipsTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.infoText,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    marginBottom: spacing.xs,
  },
  // Single preview styles
  previewContainer: {
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  // Multi-photo styles
  photoCount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumbnailWrapper: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  photoNumber: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNumberText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
  },
  addPhotoContainer: {
    width: '47%',
    aspectRatio: 4 / 3,
    flexDirection: 'column',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  addPhotoButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  addPhotoIcon: {
    fontSize: 16,
  },
  addPhotoLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  addPhotoHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
