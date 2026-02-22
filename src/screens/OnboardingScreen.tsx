import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { PlantDBEntry, PlantCategory, Plant } from '../types';
import { PLANT_DATABASE, getPlantCategories, getTranslatedPlant, getTranslatedDatabase } from '../data/plantDatabase';
import { getPlantTypes } from '../data/constants';
import { useStorage } from '../hooks/useStorage';
import { useAuthContext } from '../components/AuthProvider';
import { trackEvent } from '../services/analyticsService';

// Optional: Try to use expo-linear-gradient if available
let LinearGradient: React.ComponentType<any> | null = null;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  // expo-linear-gradient not installed, will use fallback
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Map plant database IDs to PLANT_TYPES care type IDs
const PLANT_TYPE_MAP: Record<string, string> = {
  'potus': 'trepa',
  'monstera': 'trepa',
  'ficus': 'otra',
  'sansevieria': 'suculenta',
  'orquidea': 'floral',
  'calathea': 'helecho',
  'cinta': 'helecho',
  'palmera-interior': 'otra',
  'aloe-vera': 'suculenta',
  'lavanda': 'aromatica',
  'petunia': 'floral',
  'hortensia': 'floral',
  'jazmin': 'trepa',
  'geranio': 'floral',
  'albahaca': 'aromatica',
  'romero': 'aromatica',
  'menta': 'aromatica',
  'tomatera': 'frutal',
  'pimiento': 'frutal',
  'frutilla': 'frutal',
  'limonero': 'frutal',
  'suculenta-generica': 'suculenta',
  'cactus': 'cactus',
  'echeveria': 'suculenta',
  // New plants
  'espatifilo': 'otra',
  'dracaena': 'otra',
  'filodendro': 'trepa',
  'jade': 'suculenta',
  'peperomia': 'otra',
  'rosa': 'floral',
  'bougainvillea': 'trepa',
  'hibisco': 'floral',
  'margarita': 'floral',
  'perejil': 'aromatica',
  'oregano': 'aromatica',
  'cilantro': 'aromatica',
  'tomillo': 'aromatica',
  'lechuga': 'otra',
  'pepino': 'frutal',
  'zanahoria': 'otra',
  'rucula': 'otra',
  'naranjo': 'frutal',
  'aguacate': 'frutal',
  'higuera': 'frutal',
  'mandarino': 'frutal',
  'zapallito': 'frutal',
  'ciboulette': 'aromatica',
  'haworthia': 'suculenta',
  'sedum': 'suculenta',
};

// Helper to convert PlantDBEntry to Plant
function plantDBToPlant(dbEntry: PlantDBEntry): Plant {
  const today = new Date().toISOString().split('T')[0];
  const typeId = PLANT_TYPE_MAP[dbEntry.id] || 'otra';
  const plantType = getPlantTypes().find(t => t.id === typeId);
  return {
    id: `${dbEntry.id}-${Date.now()}`,
    name: dbEntry.name,
    typeId,
    typeName: plantType?.name || 'Otra',
    icon: dbEntry.icon,
    imageUrl: dbEntry.imageUrl,
    waterEvery: dbEntry.waterDays,
    sunHours: dbEntry.sunHours,
    sunDays: [1, 2, 3, 4, 5], // Default: weekdays
    outdoorDays: dbEntry.outdoor ? [0, 6] : [], // Weekends if outdoor plant
    lastWatered: today,
    sunDoneDate: null,
    outdoorDoneDate: null,
  };
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index === currentStep && styles.stepDotActive,
            index < currentStep && styles.stepDotCompleted,
          ]}
        />
      ))}
    </View>
  );
}

interface PlantSelectCardProps {
  plant: PlantDBEntry;
  selected: boolean;
  onToggle: () => void;
}

function PlantSelectCard({ plant, selected, onToggle }: PlantSelectCardProps) {
  const translated = getTranslatedPlant(plant);
  return (
    <TouchableOpacity
      style={[styles.plantCard, selected && styles.plantCardSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {plant.imageUrl ? (
        <Image
          source={{ uri: plant.imageUrl }}
          style={styles.plantCardImage}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.plantCardIcon}>{plant.icon}</Text>
      )}
      <View style={styles.plantCardContent}>
        <Text style={styles.plantCardName} numberOfLines={1}>
          {translated.name}
        </Text>
        <Text style={styles.plantCardTip} numberOfLines={2}>
          {translated.tip}
        </Text>
      </View>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { completeOnboardingWithData } = useStorage();
  const { displayName } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  // Pre-fill name from auth if available
  const [name, setName] = useState(displayName || '');
  // Pre-select Pothos as a quick-start plant
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set(['potus']));
  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | 'all'>('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const translatedDatabase = getTranslatedDatabase();
  const filteredPlants = selectedCategory === 'all'
    ? PLANT_DATABASE
    : PLANT_DATABASE.filter(p => p.category === selectedCategory);

  const togglePlant = useCallback((plantId: string) => {
    setSelectedPlants(prev => {
      const next = new Set(prev);
      if (next.has(plantId)) {
        next.delete(plantId);
      } else {
        next.add(plantId);
      }
      return next;
    });
  }, []);

  const animateTransition = useCallback((direction: 'next' | 'back') => {
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toValue * 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => direction === 'next' ? prev + 1 : prev - 1);
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(() => {
    if (currentStep < 2) {
      animateTransition('next');
    }
  }, [currentStep, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition('back');
    }
  }, [currentStep, animateTransition]);

  const handleComplete = useCallback(() => {
    console.log('[Onboarding] Completing onboarding...');
    trackEvent('onboarding_completed', { plants_selected: selectedPlants.size });

    // Convert selected plants to Plant format
    const plantsToAdd = selectedPlants.size > 0
      ? PLANT_DATABASE.filter(p => selectedPlants.has(p.id)).map(plantDBToPlant)
      : [];

    const finalName = name.trim() || null;

    // Atomic save: plants + userName + onboardingCompleted in a single write
    completeOnboardingWithData(plantsToAdd, finalName);
  }, [name, selectedPlants, completeOnboardingWithData]);

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeEmoji}>🌱</Text>
        <Text style={styles.welcomeTitle}>{t('onboarding.welcome')}</Text>
        <Text style={styles.welcomeSubtitle}>
          {t('onboarding.subtitle')}
        </Text>
      </View>

      <View style={styles.nameSection}>
        <Text style={styles.inputLabel}>
          {displayName ? t('onboarding.yourName') : t('onboarding.whatsYourName')}
        </Text>
        <TextInput
          style={styles.nameInput}
          placeholder={t('onboarding.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Text style={styles.inputHint}>
          {displayName
            ? t('onboarding.canChangeName')
            : t('onboarding.weWillUseIt')}
        </Text>
      </View>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💧</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.wateringReminders')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.neverForget')}</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>☀️</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.sunControl')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.lightTracking')}</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🌤️</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.weatherAlerts')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.protectPlants')}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{t('onboarding.choosePlants')}</Text>
        <Text style={styles.stepSubtitle}>
          {t('onboarding.selectPlants')}
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryScrollContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextActive,
            ]}
          >
            {t('onboarding.all')}
          </Text>
        </TouchableOpacity>
        {getPlantCategories().map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plant Grid */}
      <ScrollView
        style={styles.plantGrid}
        contentContainerStyle={styles.plantGridContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPlants.map(plant => (
          <PlantSelectCard
            key={plant.id}
            plant={plant}
            selected={selectedPlants.has(plant.id)}
            onToggle={() => togglePlant(plant.id)}
          />
        ))}
      </ScrollView>

      {selectedPlants.size > 0 && (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionBadgeText}>
            {t('onboarding.plantSelected', { count: selectedPlants.size })}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.confirmSection}>
        <Text style={styles.confirmEmoji}>🎉</Text>
        <Text style={styles.confirmTitle}>
          {name.trim() ? t('onboarding.ready', { name: name.trim() }) : t('onboarding.allReady')}
        </Text>
        <Text style={styles.confirmSubtitle}>
          {t('onboarding.gardenConfigured')}
        </Text>
      </View>

      <View style={styles.summarySection}>
        {selectedPlants.size > 0 ? (
          <>
            <Text style={styles.summaryLabel}>{t('onboarding.yourPlants')}</Text>
            <View style={styles.summaryPlants}>
              {translatedDatabase
                .filter(p => selectedPlants.has(p.id))
                .slice(0, 6)
                .map(plant => (
                  <View key={plant.id} style={styles.summaryPlant}>
                    <Text style={styles.summaryPlantIcon}>{plant.icon}</Text>
                    <Text style={styles.summaryPlantName} numberOfLines={1}>
                      {plant.name}
                    </Text>
                  </View>
                ))}
              {selectedPlants.size > 6 && (
                <View style={styles.summaryMore}>
                  <Text style={styles.summaryMoreText}>
                    {t('onboarding.more', { count: selectedPlants.size - 6 })}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noPlantsSummary}>
            <Text style={styles.noPlantsSummaryIcon}>🌿</Text>
            <Text style={styles.noPlantsSummaryText}>
              {t('onboarding.canAddLater')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsLabel}>{t('onboarding.tips')}</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            {t('onboarding.configureLocation')}
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📱</Text>
          <Text style={styles.tipText}>
            {t('onboarding.enableNotifications')}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render primary button with or without gradient
  const renderPrimaryButton = (text: string, onPress: () => void) => {
    if (LinearGradient) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.green, colors.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{text}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.primaryButtonFallback}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>{text}</Text>
      </TouchableOpacity>
    );
  };

  // Main container - with or without gradient
  const MainContainer = LinearGradient || View;
  const containerProps = LinearGradient
    ? { colors: [colors.bgPrimary, colors.bgSecondary], style: styles.container }
    : { style: styles.containerFallback };

  return (
    <MainContainer {...containerProps}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
          <StepIndicator currentStep={currentStep} totalSteps={3} />

          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {currentStep === 0 && renderStep0()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </Animated.View>

          {/* Navigation */}
          <View style={[styles.navigation, { paddingBottom: insets.bottom + spacing.lg }]}>
            {currentStep > 0 ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>{t('onboarding.back')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}

            {currentStep < 2
              ? renderPrimaryButton(currentStep === 0 ? t('onboarding.start') : t('onboarding.continue'), handleNext)
              : renderPrimaryButton(t('onboarding.begin'), handleComplete)
            }
          </View>
        </View>
      </KeyboardAvoidingView>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerFallback: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  stepDotActive: {
    width: 24,
    backgroundColor: colors.green,
  },
  stepDotCompleted: {
    backgroundColor: colors.greenLight,
  },

  // Step Container
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },

  // Step 0: Welcome
  welcomeSection: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxxl,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  nameSection: {
    marginBottom: spacing.xxxl,
  },
  inputLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  inputHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  featuresList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  featureDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Step 1: Plant Selection
  stepHeader: {
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  categoryScrollContainer: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  categoryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  plantGrid: {
    flex: 1,
  },
  plantGridContent: {
    paddingBottom: spacing.xxl,
  },
  plantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  plantCardSelected: {
    borderColor: colors.green,
    backgroundColor: colors.successBg,
  },
  plantCardContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  plantCardIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  plantCardImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  plantCardName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  plantCardTip: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectionBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  selectionBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },

  // Step 2: Confirmation
  confirmSection: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxxl,
  },
  confirmEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  confirmTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmSubtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  summaryPlants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryPlant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryPlantIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  summaryPlantName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
    maxWidth: 80,
  },
  summaryMore: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryMoreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.white,
  },
  noPlantsSummary: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noPlantsSummaryIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  noPlantsSummaryText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tipsSection: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  tipsLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.infoText,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.infoText,
    lineHeight: 20,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 100,
  },
  backButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  primaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonFallback: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    minWidth: 140,
    alignItems: 'center',
    backgroundColor: colors.green,
  },
  primaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
});
