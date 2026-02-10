import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useAuthContext } from '../components/AuthProvider';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, skipAuth, isConfigured } = useAuthContext();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    const result = await signInWithGoogle();
    setIsLoading(null);

    if (!result.success && result.error !== 'Cancelado por el usuario') {
      Alert.alert('Error', result.error || 'No se pudo iniciar sesion con Google');
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading('apple');
    const result = await signInWithApple();
    setIsLoading(null);

    if (!result.success && result.error !== 'Cancelado por el usuario') {
      Alert.alert('Error', result.error || 'No se pudo iniciar sesion con Apple');
    }
  };

  const handleSkip = () => {
    skipAuth();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🌿</Text>
          <Text style={styles.logoText}>Mi Jardin</Text>
          <Text style={styles.tagline}>Cuida tus plantas con amor</Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.buttonsContainer}>
          {!isConfigured && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                La sincronizacion en la nube no esta configurada.
                Podes usar la app sin cuenta.
              </Text>
            </View>
          )}

          {isConfigured && (
            <>
              {/* Google Button */}
              <TouchableOpacity
                style={[styles.authButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={isLoading !== null}
              >
                {isLoading === 'google' ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>G</Text>
                    <Text style={styles.buttonText}>Continuar con Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Button - only on iOS */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.authButton, styles.appleButton]}
                  onPress={handleAppleSignIn}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'apple' ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.appleIcon}></Text>
                      <Text style={styles.appleButtonText}>Continuar con Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading !== null}
          >
            <Text style={styles.skipButtonText}>
              {isConfigured ? 'Continuar sin cuenta' : 'Continuar'}
            </Text>
          </TouchableOpacity>

          {isConfigured && (
            <Text style={styles.disclaimer}>
              Tus datos se guardaran solo en este dispositivo.
              Inicia sesion para sincronizar entre dispositivos.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  logoText: {
    fontFamily: fonts.heading,
    fontSize: 42,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.textSecondary,
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  warningBox: {
    backgroundColor: colors.warningBg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  warningText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.warningText,
    textAlign: 'center',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonIcon: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: '#4285F4',
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleIcon: {
    fontSize: 20,
    color: colors.white,
  },
  appleButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
  },
  skipButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.green,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
