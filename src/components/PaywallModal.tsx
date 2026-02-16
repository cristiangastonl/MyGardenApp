import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { usePremium } from '../hooks/usePremium';
import { paymentService, Offerings } from '../services/payments';

type PlanType = 'annual' | 'lifetime';

const BENEFITS = [
  { icon: '🌿', title: 'Plantas ilimitadas', description: 'Agrega todas las que quieras', bg: '#E8F0E4' },
  { icon: '🌦', title: 'Pronostico 3 dias', description: 'Planifica el cuidado con anticipacion', bg: '#E3EEF5' },
  { icon: '🛡', title: 'Alertas por planta', description: 'Proteccion de helada y calor personalizada', bg: '#FDEEE8' },
  { icon: '💡', title: 'Consejos ilimitados', description: 'Aprende algo nuevo cada dia', bg: '#FEF6E0' },
  { icon: '📊', title: 'Salud en detalle', description: 'Desgloses completos de cuidado', bg: '#EDE8F5' },
] as const;

// Paywall color palette
const pw = {
  cream: '#F7F4ED',
  creamLight: '#FDFBF7',
  bark: '#3D3229',
  barkLight: '#6B5D52',
  sageDark: '#4A5A40',
  sage: '#7A8B6F',
  sageLight: '#E8EFE4',
  terracotta: '#C4745A',
  gradientTop: '#F7F4ED',
  gradientBottom: '#E8EFE4',
};

const ANIM_STAGGER = 80;
const ANIM_DURATION = 400;

export function PaywallModal() {
  const { isPaywallVisible, hidePaywall, isPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Animation refs — header + 5 benefits + plans + cta + footer = 9 items
  const fadeAnims = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0))
  ).current;
  const slideAnims = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(20))
  ).current;

  useEffect(() => {
    if (isPaywallVisible) {
      setSelectedPlan('annual');
      setError(null);
      setLoading(false);
      setRestoring(false);
      paymentService.getOfferings().then(setOfferings);

      // Reset animations
      fadeAnims.forEach((a) => a.setValue(0));
      slideAnims.forEach((a) => a.setValue(20));

      // Staggered entrance
      const animations = fadeAnims.map((fade, i) =>
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: ANIM_DURATION,
            delay: i * ANIM_STAGGER,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnims[i], {
            toValue: 0,
            duration: ANIM_DURATION,
            delay: i * ANIM_STAGGER,
            useNativeDriver: true,
          }),
        ])
      );
      Animated.stagger(0, animations).start();
    }
  }, [isPaywallVisible]);

  useEffect(() => {
    if (isPremium && isPaywallVisible) {
      hidePaywall();
    }
  }, [isPremium, isPaywallVisible, hidePaywall]);

  const handlePurchase = async () => {
    setError(null);
    setLoading(true);
    try {
      const success = selectedPlan === 'annual'
        ? await paymentService.purchaseAnnual()
        : await paymentService.purchaseLifetime();
      if (!success) {
        setError('No se pudo completar la compra. Intenta de nuevo.');
      }
    } catch {
      setError('Ocurrio un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setRestoring(true);
    try {
      const found = await paymentService.restorePurchases();
      if (!found) {
        setError('No se encontraron compras previas.');
      }
    } catch {
      setError('Error al restaurar compras.');
    } finally {
      setRestoring(false);
    }
  };

  const annualPrice = offerings?.annual.priceString ?? '$29.99';
  const lifetimePrice = offerings?.lifetime.priceString ?? '$69.99';

  const ctaText = loading
    ? 'Procesando...'
    : selectedPlan === 'annual'
    ? 'Empezar mi prueba gratuita'
    : 'Desbloquear para siempre';

  const animatedStyle = (index: number) => ({
    opacity: fadeAnims[index],
    transform: [{ translateY: slideAnims[index] }],
  });

  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={hidePaywall}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[pw.gradientTop, pw.gradientBottom]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hidePaywall}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Header: illustration + headline + subtitle + social proof */}
            <Animated.View style={[styles.headerSection, animatedStyle(0)]}>
              <View style={styles.illustrationContainer}>
                <View style={styles.illustrationCircle}>
                  <Text style={styles.illustrationMain}>🌱</Text>
                </View>
                <View style={[styles.illustrationOrbit, styles.orbitLeft]}>
                  <Text style={styles.illustrationSmall}>🌸</Text>
                </View>
                <View style={[styles.illustrationOrbit, styles.orbitRight]}>
                  <Text style={styles.illustrationSmall}>🪴</Text>
                </View>
                <View style={[styles.illustrationOrbit, styles.orbitTop]}>
                  <Text style={styles.illustrationSmall}>🌿</Text>
                </View>
              </View>

              <Text style={styles.headline}>
                Tu jardin merece{'\n'}lo mejor
              </Text>
              <Text style={styles.subtitle}>
                Desbloquea todas las herramientas para cuidar tus plantas como un experto
              </Text>

              {/* Social proof */}
              <View style={styles.socialProof}>
                <Text style={styles.socialProofStars}>★★★★★</Text>
                <Text style={styles.socialProofText}>
                  Miles de jardineros ya usan Premium
                </Text>
              </View>
            </Animated.View>

            {/* Benefits list */}
            {BENEFITS.map((benefit, i) => (
              <Animated.View
                key={benefit.title}
                style={[styles.benefitRow, animatedStyle(i + 1)]}
              >
                <View style={[styles.benefitIconContainer, { backgroundColor: benefit.bg }]}>
                  <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
                <Text style={styles.benefitCheck}>✓</Text>
              </Animated.View>
            ))}

            {/* Plan selector */}
            <Animated.View style={[styles.plansContainer, animatedStyle(6)]}>
              {/* Annual plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.7}
              >
                {/* Recommended ribbon */}
                <View style={styles.planRecommended}>
                  <Text style={styles.planRecommendedText}>RECOMENDADO</Text>
                </View>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>7 DIAS GRATIS</Text>
                </View>
                <Text style={[
                  styles.planPrice,
                  selectedPlan === 'annual' && styles.planPriceSelected,
                ]}>
                  {annualPrice}
                </Text>
                <Text style={[
                  styles.planPeriod,
                  selectedPlan === 'annual' && styles.planPeriodSelected,
                ]}>
                  por año
                </Text>
                <View style={styles.planSavings}>
                  <Text style={styles.planSavingsText}>AHORRA 57%</Text>
                </View>
                {/* Radio indicator */}
                <View style={[
                  styles.radioOuter,
                  selectedPlan === 'annual' && styles.radioOuterSelected,
                ]}>
                  {selectedPlan === 'annual' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              {/* Lifetime plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'lifetime' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('lifetime')}
                activeOpacity={0.7}
              >
                <View style={styles.planRecommendedHidden}>
                  <Text style={styles.planRecommendedText}> </Text>
                </View>
                <View style={[styles.planBadge, styles.planBadgeLifetime]}>
                  <Text style={styles.planBadgeText}>PARA SIEMPRE</Text>
                </View>
                <Text style={[
                  styles.planPrice,
                  selectedPlan === 'lifetime' && styles.planPriceSelected,
                ]}>
                  {lifetimePrice}
                </Text>
                <Text style={[
                  styles.planPeriod,
                  selectedPlan === 'lifetime' && styles.planPeriodSelected,
                ]}>
                  pago unico
                </Text>
                <View style={styles.planSavingsHidden}>
                  <Text style={styles.planSavingsText}> </Text>
                </View>
                {/* Radio indicator */}
                <View style={[
                  styles.radioOuter,
                  selectedPlan === 'lifetime' && styles.radioOuterSelected,
                ]}>
                  {selectedPlan === 'lifetime' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* CTA button */}
            <Animated.View style={animatedStyle(7)}>
              <TouchableOpacity
                style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
                onPress={handlePurchase}
                disabled={loading || restoring}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.ctaLoadingRow}>
                    <ActivityIndicator color={colors.white} size="small" />
                    <Text style={styles.ctaText}>{ctaText}</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.ctaText}>{ctaText}</Text>
                    <Text style={styles.ctaSubtext}>
                      {selectedPlan === 'annual' ? 'Sin cargo por 7 dias' : 'Un solo pago, acceso eterno'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Error */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Footer: restore + fine print */}
            <Animated.View style={[styles.footer, animatedStyle(8)]}>
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
                disabled={restoring || loading}
              >
                {restoring ? (
                  <ActivityIndicator color={pw.sage} size="small" />
                ) : (
                  <Text style={styles.restoreText}>Restaurar compras</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.finePrint}>
                {selectedPlan === 'annual'
                  ? 'Cancela cuando quieras durante la prueba gratuita. No se cobra hasta que terminen los 7 dias.'
                  : 'Pago unico. Acceso premium de por vida sin renovaciones.'}
              </Text>
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 58, 46, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(107, 93, 82, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: pw.barkLight,
    fontFamily: fonts.bodyMedium,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl + 8,
    paddingBottom: spacing.xxxl + 20,
  },

  // ── Header ──────────────────────────────
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(122, 139, 111, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  illustrationMain: {
    fontSize: 40,
  },
  illustrationOrbit: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  orbitLeft: {
    left: 0,
    top: '50%',
    marginTop: -18,
  },
  orbitRight: {
    right: 0,
    top: '50%',
    marginTop: -18,
  },
  orbitTop: {
    top: -4,
    left: '50%',
    marginLeft: -18,
  },
  illustrationSmall: {
    fontSize: 18,
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: pw.bark,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: pw.barkLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122, 139, 111, 0.1)',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  socialProofStars: {
    fontSize: 12,
    color: '#E8A820',
    marginRight: spacing.xs,
  },
  socialProofText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: pw.sageDark,
  },

  // ── Benefits ────────────────────────────
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitIcon: {
    fontSize: 22,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: pw.bark,
  },
  benefitDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: pw.barkLight,
    marginTop: 2,
  },
  benefitCheck: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: pw.sage,
    marginLeft: spacing.sm,
  },

  // ── Plans ───────────────────────────────
  plansContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(224, 216, 200, 0.6)',
    ...shadows.sm,
  },
  planCardSelected: {
    borderColor: pw.sageDark,
    backgroundColor: 'rgba(74, 90, 64, 0.03)',
    ...shadows.md,
  },
  planRecommended: {
    backgroundColor: pw.sageDark,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  planRecommendedHidden: {
    opacity: 0,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  planRecommendedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 8,
    color: colors.white,
    letterSpacing: 1,
  },
  planBadge: {
    backgroundColor: pw.terracotta,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  planBadgeLifetime: {
    backgroundColor: pw.sage,
  },
  planBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.white,
    letterSpacing: 0.5,
  },
  planPrice: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  planPriceSelected: {
    color: pw.sageDark,
  },
  planPeriod: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  planPeriodSelected: {
    color: pw.sageDark,
  },
  planSavings: {
    backgroundColor: '#FEF6E0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  planSavingsHidden: {
    opacity: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  planSavingsText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#B8940F',
    letterSpacing: 0.3,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: pw.sageDark,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: pw.sageDark,
  },

  // ── CTA ─────────────────────────────────
  ctaButton: {
    backgroundColor: pw.sageDark,
    paddingVertical: spacing.lg + 2,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.white,
  },
  ctaSubtext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dangerText,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // ── Footer ──────────────────────────────
  footer: {
    alignItems: 'center',
  },
  restoreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  restoreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: pw.sage,
    textDecorationLine: 'underline',
  },
  finePrint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: pw.barkLight,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
});
