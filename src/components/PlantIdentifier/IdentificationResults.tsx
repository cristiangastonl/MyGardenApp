import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { IdentificationResult, IdentifiedPlant } from '../../types';

interface IdentificationResultsProps {
  result: IdentificationResult;
  imageUri: string | null;
  selectedPlant: IdentifiedPlant | null;
  onSelectPlant: (plant: IdentifiedPlant) => void;
  onAddPlant: () => void;
  onRetry: () => void;
  onClose: () => void;
}

const HUMIDITY_LABELS = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export function IdentificationResults({
  result,
  imageUri,
  selectedPlant,
  onSelectPlant,
  onAddPlant,
  onRetry,
  onClose,
}: IdentificationResultsProps) {
  // Case C: No result / error
  if (!result.success || result.type === 'none') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🤔</Text>
          <Text style={styles.errorTitle}>No pudimos identificarla</Text>
          <Text style={styles.errorMessage}>
            {result.reason || 'No se reconoció la planta en la imagen. Probá con otra foto con mejor iluminación.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Intentar con otra foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualButton} onPress={onClose}>
            <Text style={styles.manualButtonText}>Agregar manualmente</Text>
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
          <Text style={styles.successTitle}>¡Planta identificada!</Text>
        </View>

        <PlantResultCard
          plant={plant}
          isSelected={true}
          showDetails={true}
          onSelect={() => onSelectPlant(plant)}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.addButton} onPress={onAddPlant}>
            <Text style={styles.addButtonText}>Agregar a mi jardín</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>No es esta, intentar de nuevo</Text>
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
        <Text style={styles.multipleTitle}>Posibles coincidencias</Text>
        <Text style={styles.multipleSubtitle}>
          {result.reason || 'Encontramos varias opciones. Seleccioná la que corresponda.'}
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.addButton, !selectedPlant && styles.addButtonDisabled]}
          onPress={onAddPlant}
          disabled={!selectedPlant}
        >
          <Text style={styles.addButtonText}>
            {selectedPlant ? 'Agregar a mi jardín' : 'Seleccioná una opción'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Ninguna es correcta</Text>
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
              <Text style={styles.infoLabel}>Riego</Text>
              <Text style={styles.infoValue}>Cada {plant.waterDays} días</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>☀️</Text>
              <Text style={styles.infoLabel}>Sol</Text>
              <Text style={styles.infoValue}>{plant.sunHours}h/día</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🌡️</Text>
              <Text style={styles.infoLabel}>Temp</Text>
              <Text style={styles.infoValue}>{plant.tempMin}° - {plant.tempMax}°</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>💨</Text>
              <Text style={styles.infoLabel}>Humedad</Text>
              <Text style={styles.infoValue}>{HUMIDITY_LABELS[plant.humidity]}</Text>
            </View>
          </View>

          {plant.tip && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipLabel}>CONSEJO</Text>
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
