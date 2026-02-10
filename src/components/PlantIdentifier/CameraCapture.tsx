import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';

interface CameraCaptureProps {
  imageUri: string | null;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onAnalyze: () => void;
  onRetake: () => void;
}

export function CameraCapture({
  imageUri,
  onPickCamera,
  onPickGallery,
  onAnalyze,
  onRetake,
}: CameraCaptureProps) {
  if (imageUri) {
    // Show preview with analyze/retake options
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
        </View>

        <Text style={styles.previewHint}>
          ¿La foto se ve bien? Asegurate de que la planta esté clara y enfocada.
        </Text>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
            <Text style={styles.retakeButtonText}>Otra foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze}>
            <Text style={styles.analyzeButtonText}>Identificar</Text>
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

      <Text style={styles.title}>Sacá una foto de tu planta</Text>
      <Text style={styles.subtitle}>
        Enfocá las hojas o flores para una mejor identificación
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={onPickCamera}>
          <Text style={styles.optionIcon}>📸</Text>
          <Text style={styles.optionLabel}>Cámara</Text>
          <Text style={styles.optionHint}>Sacá una foto ahora</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={onPickGallery}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={styles.optionLabel}>Galería</Text>
          <Text style={styles.optionHint}>Elegí una foto existente</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>CONSEJOS</Text>
        <Text style={styles.tip}>• Buena iluminación natural</Text>
        <Text style={styles.tip}>• Hojas o flores visibles</Text>
        <Text style={styles.tip}>• Fondo simple si es posible</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
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
  // Preview styles
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
});
