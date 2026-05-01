import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n, { setLanguage } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { PlantDBEntry, PlantCategory, Plant } from '../types';
import { PLANT_DATABASE, getPlantCategories, getTranslatedPlant, getTranslatedDatabase } from '../data/plantDatabase';
import { getPlantTypes } from '../data/constants';
import { useStorage } from '../hooks/useStorage';
import { useAuthContext } from '../components/AuthProvider';
import { inferWaterMode, applyColdFactor, sunHoursToLightLevel } from '../utils/migration';
import * as ExpoLocation from 'expo-location';
import { Location } from '../types';
import { trackEvent } from '../services/analyticsService';
import { PlantIdentifierModal } from '../components';
import { PlantDiagnosisModal } from '../components/PlantDiagnosis/PlantDiagnosisModal';
import { Features } from '../config/features';
import { usePremiumGate } from '../config/premium';
import { uploadPlantImage } from '../services/imageService';

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

// Helper to convert PlantDBEntry to Plant — emits Phase 7 v1.1 schema (Pitfall 1 fix)
function plantDBToPlant(dbEntry: PlantDBEntry): Plant {
  const today = new Date().toISOString().split('T')[0];
  const typeId = PLANT_TYPE_MAP[dbEntry.id] || 'otra';
  const plantType = getPlantTypes().find(t => t.id === typeId);

  // v1.1 fields with defensive ladder (Phase 4 lock — single SSOT via Phase 4 mappers):
  //   1. Catalog v1.1 fields (Phase 4 codemod populated; Phase 8 expert refines)
  //   2. Derived from legacy fields via Phase 4 mappers
  //   3. Safe defaults
  const lightLevel = dbEntry.lightLevel
    ?? (typeof dbEntry.sunHours === 'number' ? sunHoursToLightLevel(dbEntry.sunHours) : 'bright_indirect');
  const waterMode = dbEntry.waterMode ?? inferWaterMode(dbEntry.category, dbEntry.id);
  const waterSchedule = dbEntry.waterSchedule ?? {
    warm: dbEntry.waterDays ?? 4,
    cold: applyColdFactor(dbEntry.waterDays ?? 4, dbEntry.category),
  };

  return {
    id: `${dbEntry.id}-${Date.now()}`,
    name: dbEntry.name,
    typeId,
    typeName: plantType?.name || 'Otra',
    icon: dbEntry.icon,
    imageUrl: dbEntry.imageUrl,
    // v1.1 schema (Phase 7 SSOT — replaces legacy waterEvery/sunHours)
    lightLevel,
    waterSchedule,
    waterMode,
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
  const { completeOnboardingWithData, updateLocation } = useStorage();
  const { displayName } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  // Pre-fill name from auth if available
  const [name, setName] = useState(displayName || '');
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | 'all'>('all');
  const [identifiedPlants, setIdentifiedPlants] = useState<Plant[]>([]);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [diagnosePlant, setDiagnosePlant] = useState<Plant | null>(null);
  const [diagnosisInitialImages, setDiagnosisInitialImages] = useState<Array<{ uri: string; base64: string }> | undefined>();
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  // Location step state
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<Array<{ id: string | number; name: string; admin1?: string; country: string; latitude: number; longitude: number }>>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const { isPremium, canDiagnose } = usePremiumGate();
  const { diagnosisCount } = useStorage();

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

  const handleDiagnoseAfterIdentify = useCallback((plant: Plant, reusePhotos: boolean, imageUri: string | null, imageBase64: string | null) => {
    setDiagnosePlant(plant);
    if (reusePhotos && imageUri && imageBase64) {
      setDiagnosisInitialImages([{ uri: imageUri, base64: imageBase64 }]);
    } else {
      setDiagnosisInitialImages(undefined);
    }
    setShowDiagnosis(true);
  }, []);

  const handleIdentifiedPlant = useCallback(async (plantData: Omit<Plant, 'id'>, imageUri?: string | null): Promise<Plant> => {
    const id = `identified-${Date.now()}`;
    let finalImageUrl = plantData.imageUrl;

    if (imageUri && Features.PHOTO_UPLOAD) {
      const uploaded = await uploadPlantImage(imageUri, id);
      if (uploaded) finalImageUrl = uploaded;
    }

    const newPlant: Plant = {
      ...plantData,
      id,
      imageUrl: finalImageUrl,
    };
    setIdentifiedPlants(prev => [...prev, newPlant]);
    // Don't close identifier here - let the modal show the diagnosis prompt first
    // It will close itself via onClose when done
    return newPlant;
  }, []);

  const animateTransition = useCallback((direction: 'next' | 'back') => {
    const exitTo = direction === 'next' ? -SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.6;
    const enterFrom = direction === 'next' ? SCREEN_WIDTH * 0.6 : -SCREEN_WIDTH * 0.6;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitTo,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => direction === 'next' ? prev + 1 : prev - 1);
      slideAnim.setValue(enterFrom);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 60,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(() => {
    if (currentStep === 0 && !name.trim()) return;
    // Plant-empty warning moves from step 1 → step 2 (location is now step 1)
    if (currentStep === 2 && selectedPlants.size + identifiedPlants.length === 0) {
      if (!showEmptyWarning) {
        setShowEmptyWarning(true);
        return;
      }
    }
    // Advancement guard: 4 steps (0,1,2,3) → cap at < 3
    if (currentStep < 3) {
      setShowEmptyWarning(false);
      animateTransition('next');
    }
  }, [currentStep, name, selectedPlants.size, identifiedPlants.length, showEmptyWarning, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      // identifiedPlants reset moves from currentStep === 1 to currentStep === 2 (plant step is now step 2)
      if (currentStep === 2) {
        setIdentifiedPlants([]);
      }
      animateTransition('back');
    }
  }, [currentStep, animateTransition]);

  const handleUseGps = useCallback(async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // GPS denied — show city search inline instead of blocking flow
        setShowCitySearch(true);
        setIsLocationLoading(false);
        return;
      }
      const { coords } = await ExpoLocation.getCurrentPositionAsync({});
      const geo = await ExpoLocation.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const place = geo[0];
      const newLocation: Location = {
        lat: coords.latitude,
        lon: coords.longitude,
        name: place?.city || place?.subregion || t('settingsPanel.yourLocation'),
        country: place?.country || '',
        admin1: place?.region || undefined,
      };
      updateLocation(newLocation);
      setIsLocationLoading(false);
      animateTransition('next');
    } catch (e) {
      console.warn('[Onboarding] GPS failed:', e);
      setShowCitySearch(true);
      setIsLocationLoading(false);
    }
  }, [t, updateLocation, animateTransition]);

  const handleCitySearch = useCallback(async (query: string) => {
    setCitySearchQuery(query);
    if (query.length < 2) { setCitySearchResults([]); return; }
    setIsSearchingCity(true);
    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${i18n.language}`
      );
      const data = await r.json();
      setCitySearchResults(data?.results || []);
    } catch (e) {
      console.warn('[Onboarding] geocoding failed:', e);
    } finally {
      setIsSearchingCity(false);
    }
  }, []);

  const handleSelectCity = useCallback((city: { name: string; admin1?: string; country: string; latitude: number; longitude: number }) => {
    const newLocation: Location = {
      lat: city.latitude,
      lon: city.longitude,
      name: city.name,
      country: city.country,
      admin1: city.admin1,
    };
    updateLocation(newLocation);
    setShowCitySearch(false);
    setCitySearchQuery('');
    setCitySearchResults([]);
    animateTransition('next');
  }, [updateLocation, animateTransition]);

  const handleSkipLocation = useCallback(() => {
    animateTransition('next');
  }, [animateTransition]);

  const [isCompleting, setIsCompleting] = useState(false);
  const handleComplete = useCallback(() => {
    if (isCompleting) return;
    setIsCompleting(true);
    const totalCount = selectedPlants.size + identifiedPlants.length;
    console.log('[Onboarding] Completing onboarding...');
    trackEvent('onboarding_completed', { plants_selected: totalCount });

    const catalogPlants = selectedPlants.size > 0
      ? PLANT_DATABASE.filter(p => selectedPlants.has(p.id)).map(plantDBToPlant)
      : [];

    const plantsToAdd = [...identifiedPlants, ...catalogPlants];
    const finalName = name.trim() || null;

    completeOnboardingWithData(plantsToAdd, finalName);
  }, [isCompleting, name, selectedPlants, identifiedPlants, completeOnboardingWithData]);

  const renderStep0 = () => (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={styles.step0ScrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.languagePickerRow}>
        <TouchableOpacity
          style={[styles.languagePill, i18n.language === 'es' && styles.languagePillActive]}
          onPress={() => setLanguage('es')}
          activeOpacity={0.7}
        >
          <Text style={[styles.languagePillText, i18n.language === 'es' && styles.languagePillTextActive]}>🇦🇷 Español</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.languagePill, i18n.language === 'en' && styles.languagePillActive]}
          onPress={() => setLanguage('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.languagePillText, i18n.language === 'en' && styles.languagePillTextActive]}>🇺🇸 English</Text>
        </TouchableOpacity>
      </View>

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
          <Text style={styles.featureIcon}>📸</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.featurePlantId')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.featurePlantIdDesc')}</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🩺</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.featureDiagnosis')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.featureDiagnosisDesc')}</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🌤️</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.weatherAlerts')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.protectPlants')}</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔔</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t('onboarding.featureNotifications')}</Text>
            <Text style={styles.featureDesc}>{t('onboarding.featureNotificationsDesc')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep1Location = () => (
    <ScrollView
      style={styles.stepContent}
      contentContainerStyle={styles.step0ScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeEmoji}>📍</Text>
        <Text style={styles.welcomeTitle}>{t('onboarding.location.title')}</Text>
        <Text style={styles.welcomeSubtitle}>{t('onboarding.location.body')}</Text>
      </View>

      {!showCitySearch && (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.xl }}>
          <TouchableOpacity
            onPress={handleUseGps}
            disabled={isLocationLoading}
            style={{
              backgroundColor: colors.green,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center',
            }}
            accessibilityRole="button"
          >
            {isLocationLoading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.white }}>
                  {t('onboarding.location.useGps')}
                </Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowCitySearch(true)}
            style={{
              backgroundColor: colors.bgPrimary,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary }}>
              {t('onboarding.location.searchCity')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkipLocation}
            style={{
              paddingVertical: spacing.md,
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center',
            }}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.textSecondary }}>
              {t('onboarding.location.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showCitySearch && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <TextInput
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.textPrimary,
              backgroundColor: colors.bgPrimary,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderLight,
              minHeight: 44,
            }}
            value={citySearchQuery}
            onChangeText={handleCitySearch}
            placeholder={t('onboarding.location.searchCity')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearchingCity && (
            <ActivityIndicator style={{ marginTop: spacing.md }} color={colors.textSecondary} />
          )}
          {citySearchResults.map((city) => (
            <TouchableOpacity
              key={String(city.id)}
              onPress={() => handleSelectCity(city)}
              style={{
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}>
                {city.name}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>
                {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => { setShowCitySearch(false); setCitySearchQuery(''); setCitySearchResults([]); }}
            style={{ marginTop: spacing.md, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary }}>
              {t('onboarding.back')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{t('onboarding.choosePlants')}</Text>
        <Text style={styles.stepSubtitle}>
          {t('onboarding.selectPlants')}
        </Text>
      </View>

      {/* Camera Identification */}
      {Features.PLANT_IDENTIFICATION && (
        <TouchableOpacity
          style={[
            styles.identifyCard,
            identifiedPlants.length > 0 && styles.identifyCardUsed,
          ]}
          onPress={() => setShowIdentifier(true)}
          activeOpacity={0.7}
          disabled={identifiedPlants.length > 0}
        >
          <Text style={styles.identifyCardIcon}>
            {identifiedPlants.length > 0 ? '✅' : '📸'}
          </Text>
          <View style={styles.identifyCardContent}>
            <Text style={styles.identifyCardTitle}>
              {identifiedPlants.length > 0
                ? t('onboarding.plantIdentified', { name: identifiedPlants[0].name })
                : t('onboarding.identifyWithCamera')}
            </Text>
            <Text style={styles.identifyCardSubtitle}>
              {identifiedPlants.length > 0
                ? t('onboarding.freeIdUsed')
                : t('onboarding.freeIdIncluded')}
            </Text>
          </View>
        </TouchableOpacity>
      )}

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

      {(selectedPlants.size + identifiedPlants.length) > 0 && (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionBadgeText}>
            {t('onboarding.plantSelected', { count: selectedPlants.size + identifiedPlants.length })}
          </Text>
        </View>
      )}

      {showEmptyWarning && (selectedPlants.size + identifiedPlants.length) === 0 && (
        <View style={styles.emptyWarning}>
          <Text style={styles.emptyWarningText}>
            {t('onboarding.emptyWarning')}
          </Text>
          <Text style={styles.emptyWarningHint}>
            {t('onboarding.emptyWarningHint')}
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
        {(selectedPlants.size + identifiedPlants.length) > 0 ? (
          <>
            <Text style={styles.summaryLabel}>{t('onboarding.yourPlants')}</Text>
            <View style={styles.summaryPlants}>
              {identifiedPlants.map(plant => (
                <View key={plant.id} style={styles.summaryPlant}>
                  <Text style={styles.summaryPlantIcon}>{plant.icon}</Text>
                  <Text style={styles.summaryPlantName} numberOfLines={1}>
                    {plant.name}
                  </Text>
                </View>
              ))}
              {translatedDatabase
                .filter(p => selectedPlants.has(p.id))
                .slice(0, 6 - identifiedPlants.length)
                .map(plant => (
                  <View key={plant.id} style={styles.summaryPlant}>
                    <Text style={styles.summaryPlantIcon}>{plant.icon}</Text>
                    <Text style={styles.summaryPlantName} numberOfLines={1}>
                      {plant.name}
                    </Text>
                  </View>
                ))}
              {(selectedPlants.size + identifiedPlants.length) > 6 && (
                <View style={styles.summaryMore}>
                  <Text style={styles.summaryMoreText}>
                    {t('onboarding.more', { count: selectedPlants.size + identifiedPlants.length - 6 })}
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
  const renderPrimaryButton = (text: string, onPress: () => void, loading: boolean = false) => {
    const inner = loading
      ? <ActivityIndicator color={colors.white} />
      : <Text style={styles.primaryButtonText}>{text}</Text>;

    if (LinearGradient) {
      return (
        <Pressable onPress={loading ? undefined : onPress} disabled={loading}>
          {({ pressed }) => (
            <LinearGradient
              colors={[colors.green, colors.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              {inner}
            </LinearGradient>
          )}
        </Pressable>
      );
    }
    return (
      <Pressable onPress={loading ? undefined : onPress} disabled={loading}>
        {({ pressed }) => (
          <View style={[styles.primaryButtonFallback, pressed && styles.primaryButtonPressed]}>
            {inner}
          </View>
        )}
      </Pressable>
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
          <StepIndicator currentStep={currentStep} totalSteps={4} />

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
            {currentStep === 1 && renderStep1Location()}
            {currentStep === 2 && renderStep1()}    {/* old renderStep1 = plants */}
            {currentStep === 3 && renderStep2()}    {/* old renderStep2 = done/summary */}
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

            <View style={currentStep === 0 && !name.trim() ? { opacity: 0.4 } : undefined}>
              {currentStep < 3
                ? renderPrimaryButton(
                    currentStep === 0
                      ? t('onboarding.start')
                      : currentStep === 2 && showEmptyWarning && (selectedPlants.size + identifiedPlants.length) === 0
                        ? t('onboarding.continueAnyway')
                        : t('onboarding.continue'),
                    handleNext,
                  )
                : renderPrimaryButton(t('onboarding.begin'), handleComplete, isCompleting)
              }
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {Features.PLANT_IDENTIFICATION && (
        <PlantIdentifierModal
          visible={showIdentifier}
          onClose={() => setShowIdentifier(false)}
          onAddPlant={handleIdentifiedPlant}
          onDiagnoseAfterIdentify={handleDiagnoseAfterIdentify}
          isPremium={isPremium}
          diagnosisCount={diagnosisCount}
        />
      )}

      {diagnosePlant && (
        <PlantDiagnosisModal
          visible={showDiagnosis}
          plant={diagnosePlant}
          weather={null}
          initialImages={diagnosisInitialImages}
          onClose={() => {
            setShowDiagnosis(false);
            setDiagnosePlant(null);
            setDiagnosisInitialImages(undefined);
          }}
        />
      )}
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
  step0ScrollContent: {
    paddingBottom: spacing.xl,
  },

  // Step 0: Language picker
  languagePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  languagePill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  languagePillActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  languagePillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  languagePillTextActive: {
    color: colors.white,
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
  identifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.green,
    ...shadows.sm,
  },
  identifyCardUsed: {
    borderColor: colors.border,
    opacity: 0.7,
  },
  identifyCardIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  identifyCardContent: {
    flex: 1,
  },
  identifyCardTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  identifyCardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
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

  emptyWarning: {
    backgroundColor: colors.warningBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  emptyWarningText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.warningText,
    textAlign: 'center',
  },
  emptyWarningHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.warningText,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.8,
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
  primaryButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
