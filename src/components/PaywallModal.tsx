import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { usePremium } from '../hooks/usePremium';
import { paymentService, Offerings } from '../services/payments';

type PlanType = 'annual' | 'lifetime';

const BENEFITS = [
  { icon: '🌿', title: 'Plantas ilimitadas', description: 'Agrega todas las que quieras' },
  { icon: '🌦', title: 'Pronostico 3 dias', description: 'Planifica el cuidado de tu jardin' },
  { icon: '🥶', title: 'Alertas de helada y calor', description: 'Proteccion personalizada por planta' },
  { icon: '💡', title: 'Consejos ilimitados', description: 'Aprende algo nuevo cada dia' },
  { icon: '📊', title: 'Detalles de salud', description: 'Desgloses completos de cuidado' },
] as const;

// Paywall colors — extended from theme for this specific UI
const pw = {
  cream: '#F7F4ED',
  bark: '#3D3229',
  barkLight: '#6B5D52',
  sageDark: '#4A5A40',
  sage: '#7A8B6F',
  terracotta: '#C4745A',
};

export function PaywallModal() {
  const { isPaywallVisible, hidePaywall, isPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isPaywallVisible) {
      setSelectedPlan('annual');
      setError(null);
      setLoading(false);
      setRestoring(false);
      paymentService.getOfferings().then(setOfferings);
    }
  }, [isPaywallVisible]);

  // Auto-dismiss on premium activation
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
      // If success, isPremium will change via callback and auto-dismiss
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
    ? 'Comenzar prueba gratuita'
    : 'Comprar acceso de por vida';

  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={hidePaywall}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
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
            {/* Header illustration */}
            <Text style={styles.illustration}>🌿🌸🪴</Text>

            {/* Headline */}
            <Text style={styles.headline}>
              Desbloquea todo el potencial de tu jardin
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Todo lo que necesitas para convertirte en expert@ en plantas
            </Text>

            {/* Benefits list */}
            <View style={styles.benefitsList}>
              {BENEFITS.map((benefit) => (
                <View key={benefit.title} style={styles.benefitRow}>
                  <View style={styles.benefitIconContainer}>
                    <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Plan selector */}
            <View style={styles.plansContainer}>
              {/* Annual plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.7}
              >
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
                  por ano
                </Text>
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
              </TouchableOpacity>
            </View>

            {/* CTA button */}
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
                <Text style={styles.ctaText}>{ctaText}</Text>
              )}
            </TouchableOpacity>

            {/* Error message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Restore link */}
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

            {/* Fine print */}
            <Text style={styles.finePrint}>
              {selectedPlan === 'annual'
                ? 'Cancela en cualquier momento durante los 7 dias de prueba. No se cobra hasta que termine el periodo de prueba.'
                : 'Pago unico. Acceso premium de por vida sin renovaciones.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAN_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.lg * 2 - spacing.md) / 2;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 58, 46, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: pw.cream,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '92%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 93, 82, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: pw.barkLight,
    fontFamily: fonts.bodyMedium,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl + 16,
  },
  illustration: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: pw.bark,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: pw.barkLight,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  benefitsList: {
    marginBottom: spacing.xxl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(122, 139, 111, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitIcon: {
    fontSize: 20,
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
  plansContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  planCardSelected: {
    borderColor: pw.sageDark,
    backgroundColor: 'rgba(74, 90, 64, 0.04)',
  },
  planBadge: {
    backgroundColor: pw.terracotta,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
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
    fontSize: 22,
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
  },
  planPeriodSelected: {
    color: pw.sageDark,
  },
  ctaButton: {
    backgroundColor: pw.sageDark,
    paddingVertical: spacing.lg,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
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
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dangerText,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  restoreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: pw.sage,
  },
  finePrint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: pw.barkLight,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 16,
  },
});
