import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../../theme';

interface DiagnosisAnalyzingStateProps {
  imageUris?: string[];
}

export function DiagnosisAnalyzingState({ imageUris = [] }: DiagnosisAnalyzingStateProps) {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const showMultiple = imageUris.length > 1;

  return (
    <View style={styles.container}>
      {imageUris.length > 0 && (
        <View style={styles.imageContainer}>
          {showMultiple ? (
            <Animated.View
              style={[
                styles.multiImageRow,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.multiImageWrapper}>
                  <Image source={{ uri }} style={styles.multiImage} />
                  <View style={styles.imageOverlay} />
                </View>
              ))}
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.imageWrapper,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Image source={{ uri: imageUris[0] }} style={styles.image} />
              <View style={styles.imageOverlay} />
            </Animated.View>
          )}
        </View>
      )}

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.loadingTitle}>{t('diagnosis.diagnosing')}</Text>
        <Text style={styles.loadingSubtitle}>
          {imageUris.length > 1
            ? t('diagnosis.analyzingPhotos', { count: imageUris.length })
            : t('diagnosis.analyzingPhoto')}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🔬</Text>
          <Text style={styles.stepText}>{t('diagnosis.stepDetecting')}</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🎨</Text>
          <Text style={styles.stepText}>{t('diagnosis.stepAnalyzing')}</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>💊</Text>
          <Text style={styles.stepText}>{t('diagnosis.stepPreparing')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  imageWrapper: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(91, 154, 106, 0.2)',
  },
  multiImageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  multiImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  multiImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  loadingTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  loadingSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepsContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  stepText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
