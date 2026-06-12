import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { IdentificationResult, IdentifiedPlant, LightLevel } from '../../types';
import { LightLevelPicker } from '../LightLevelPicker';

interface IdentificationResultsProps {
  result: IdentificationResult;
  imageUri: string | null;
  selectedPlant: IdentifiedPlant | null;
  onSelectPlant: (plant: IdentifiedPlant) => void;
  onAddPlant: (lightLevel: LightLevel) => void;   // CHANGED — accepts user's picker selection
  onRetry: () => void;
  onClose: () => void;
  isAdding?: boolean;   // add-in-flight: disables actions + spinner on the add button
}

const HUMIDITY_KEYS: Record<string, string> = {
  baja: 'identification.humidityLow',
  media: 'identification.humidityMedium',
  alta: 'identification.humidityHigh',
};

/**
 * POLISH-03 (Phase 23) — Resolves the typeId for LightLevelPicker honoring
 * catalog category over PlantNet's `indoor` boolean.
 *
 * Catalog wins because PlantNet often mis-flags species (e.g. tomato as
 * `indoor: true`). IdentifiedPlant.category is populated on EVERY successful
 * identification (convertPlantNetResult in plantIdentification.ts:337 — catalog
 * hit) or :364 (generic family-based fallback), so this rewire is a pure
 * preference reorder, not a new data path.
 */
function resolveTypeIdForPicker(plant: IdentifiedPlant | null | undefined): string {
  if (plant?.category) return plant.category;       // catalog wins
  if (plant?.indoor === false) return 'exterior';   // PlantNet flag fallback
  return 'interior';                                // safe default
}

export function IdentificationResults({
  result,
  imageUri,
  selectedPlant,
  onSelectPlant,
  onAddPlant,
  onRetry,
  onClose,
  isAdding = false,
}: IdentificationResultsProps) {
  const { t } = useTranslation();

  const [selectedLightLevel, setSelectedLightLevel] = useState<LightLevel>(
    selectedPlant?.lightLevel ?? 'bright_indirect'
  );

  // Re-sync when user taps a different plant card in multi-result branch
  useEffect(() => {
    if (selectedPlant) {
      setSelectedLightLevel(selectedPlant.lightLevel ?? 'bright_indirect');
    }
  }, [selectedPlant]);

  const typeIdForPicker = resolveTypeIdForPicker(selectedPlant);

  // Case C: No result / error
  if (!result.success || result.type === 'none') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🤔</Text>
          <Text style={styles.errorTitle}>{t('identification.couldNotIdentify')}</Text>
          <Text style={styles.errorMessage}>
            {result.reason || t('identification.couldNotIdentifyMessage')}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>{t('identification.tryAnotherPhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualButton} onPress={onClose}>
            <Text style={styles.manualButtonText}>{t('identification.addManually')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Case A: Single high-confidence result
  if (result.type === 'single' && result.results.length === 1) {
    const plant = result.results[0];
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.successHeader}>
          <Text style={styles.successIcon}>✨</Text>
          <Text style={styles.successTitle}>{t('identification.plantIdentified')}</Text>
        </View>

        <PlantResultCard
          plant={plant}
          isSelected={true}
          showDetails={true}
          onSelect={() => onSelectPlant(plant)}
        />

        {/* Phase 7 LIGHT-05: user adjusts light level before saving */}
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>{t('identification.lightLevelLabel')}</Text>
          <LightLevelPicker
            typeId={resolveTypeIdForPicker(plant)}
            value={selectedLightLevel}
            onChange={setSelectedLightLevel}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.addButtonDisabled]}
            onPress={() => onAddPlant(selectedLightLevel)}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.addButtonText}>{t('identification.addToGarden')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, isAdding && styles.addButtonDisabled]}
            onPress={onRetry}
            disabled={isAdding}
          >
            <Text style={styles.retryButtonText}>{t('identification.notThisOneTryAgain')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Case B: Multiple options
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.multipleHeader}>
        <Text style={styles.multipleIcon}>🌿</Text>
        <Text style={styles.multipleTitle}>{t('identification.possibleMatches')}</Text>
        <Text style={styles.multipleSubtitle}>
          {result.reason || t('identification.possibleMatchesMessage')}
        </Text>
      </View>

      {result.results.map((plant, index) => (
        <PlantResultCard
          key={index}
          plant={plant}
          isSelected={selectedPlant?.commonName === plant.commonName}
          showDetails={selectedPlant?.commonName === plant.commonName}
          onSelect={() => onSelectPlant(plant)}
        />
      ))}

      {/* Phase 7 LIGHT-05: user adjusts light level once a plant is selected */}
      {selectedPlant && (
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>{t('identification.lightLevelLabel')}</Text>
          <LightLevelPicker
            typeId={typeIdForPicker}
            value={selectedLightLevel}
            onChange={setSelectedLightLevel}
          />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.addButton, (!selectedPlant || isAdding) && styles.addButtonDisabled]}
          onPress={() => selectedPlant && onAddPlant(selectedLightLevel)}
          disabled={!selectedPlant || isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.addButtonText}>
              {selectedPlant ? t('identification.addToGarden') : t('identification.selectAnOption')}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, isAdding && styles.addButtonDisabled]}
          onPress={onRetry}
          disabled={isAdding}
        >
          <Text style={styles.retryButtonText}>{t('identification.noneCorrect')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

interface PlantResultCardProps {
  plant: IdentifiedPlant;
  isSelected: boolean;
  showDetails: boolean;
  onSelect: () => void;
}

function PlantResultCard({ plant, isSelected, showDetails, onSelect }: PlantResultCardProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.resultCard, isSelected && styles.resultCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.plantIcon}>{plant.icon}</Text>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plant.commonName}</Text>
          <Text style={styles.plantScientific}>{plant.scientificName}</Text>
        </View>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{plant.confidence}%</Text>
        </View>
      </View>

      {showDetails && (
        <>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💧</Text>
              <Text style={styles.infoLabel}>{t('identification.watering')}</Text>
              <Text style={styles.infoValue}>{t('identification.everyDays', { days: plant.waterDays })}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>☀️</Text>
              <Text style={styles.infoLabel}>{t('identification.sun')}</Text>
              <Text style={styles.infoValue}>{t('identification.hoursPerDay', { hours: plant.sunHours })}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🌡️</Text>
              <Text style={styles.infoLabel}>{t('identification.temp')}</Text>
              <Text style={styles.infoValue}>{plant.tempMin}° - {plant.tempMax}°</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💨</Text>
              <Text style={styles.infoLabel}>{t('identification.humidity')}</Text>
              <Text style={styles.infoValue}>{t(HUMIDITY_KEYS[plant.humidity])}</Text>
            </View>
          </View>

          {plant.tip && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipLabel}>{t('identification.tip')}</Text>
              <Text style={styles.tipText}>{plant.tip}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  // Success state (single result)
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  // Multiple results
  multipleHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  multipleIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  multipleTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  multipleSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  // Result card
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.md,
  },
  resultCardSelected: {
    borderColor: colors.green,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  plantScientific: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  confidenceBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  infoItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  // Tip
  tipContainer: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  tipLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.infoText,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 19,
  },
  // Light level picker section
  pickerSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  // Actions
  actions: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  addButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  retryButton: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retryButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  manualButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  manualButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.green,
  },
});
