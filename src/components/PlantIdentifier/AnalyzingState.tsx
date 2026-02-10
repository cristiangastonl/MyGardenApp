import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../theme';

interface AnalyzingStateProps {
  imageUri: string | null;
}

export function AnalyzingState({ imageUri }: AnalyzingStateProps) {
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

  return (
    <View style={styles.container}>
      {imageUri && (
        <View style={styles.imageContainer}>
          <Animated.View
            style={[
              styles.imageWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.imageOverlay} />
          </Animated.View>
        </View>
      )}

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.loadingTitle}>Analizando...</Text>
        <Text style={styles.loadingSubtitle}>
          Identificando tu planta con inteligencia artificial
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🔍</Text>
          <Text style={styles.stepText}>Analizando forma de las hojas</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>🎨</Text>
          <Text style={styles.stepText}>Detectando colores y patrones</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepIcon}>📚</Text>
          <Text style={styles.stepText}>Buscando en base de datos</Text>
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
