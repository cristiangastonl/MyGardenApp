import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { usePlantIdentification } from '../../hooks/usePlantIdentification';
import { IdentifiedPlant, Plant } from '../../types';
import { CameraCapture } from './CameraCapture';
import { AnalyzingState } from './AnalyzingState';
import { IdentificationResults } from './IdentificationResults';

interface PlantIdentifierModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPlant: (plant: Omit<Plant, 'id'>, imageUri?: string | null) => void;
}

export function PlantIdentifierModal({
  visible,
  onClose,
  onAddPlant,
}: PlantIdentifierModalProps) {
  const {
    state,
    imageUri,
    result,
    error,
    enrichedData,
    isEnriching,
    pickFromCamera,
    pickFromGallery,
    analyze,
    reset,
    selectResult,
    selectedPlant,
  } = usePlantIdentification();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRetake = () => {
    reset();
  };

  const handleAddPlant = () => {
    if (!selectedPlant) return;

    // Use enriched data if available, otherwise fall back to identified data
    const data = enrichedData;
    const useEnriched = data && data.source !== 'default';

    // Convert IdentifiedPlant to Plant format
    const plantData: Omit<Plant, 'id'> = {
      name: useEnriched ? data.name : selectedPlant.commonName,
      typeId: selectedPlant.category,
      typeName: getCategoryName(selectedPlant.category),
      icon: selectedPlant.icon,
      waterEvery: useEnriched ? data.waterEvery : selectedPlant.waterDays,
      sunHours: useEnriched ? data.sunHours : selectedPlant.sunHours,
      sunDays: [], // User can configure later
      outdoorDays: (useEnriched ? !data.indoor : !selectedPlant.indoor) ? [0, 6] : [],
      lastWatered: null,
      sunDoneDate: null,
      outdoorDoneDate: null,
      // Add temperature info from enriched data
      tempMin: useEnriched ? (data.tempMin ?? undefined) : selectedPlant.tempMin,
      tempMax: useEnriched ? (data.tempMax ?? undefined) : selectedPlant.tempMax,
    };

    // Pass imageUri to parent for upload
    onAddPlant(plantData, imageUri);
    handleClose();
  };

  const renderContent = () => {
    switch (state) {
      case 'idle':
      case 'capturing':
        return (
          <CameraCapture
            imageUri={imageUri}
            onPickCamera={pickFromCamera}
            onPickGallery={pickFromGallery}
            onAnalyze={analyze}
            onRetake={handleRetake}
          />
        );

      case 'analyzing':
        return <AnalyzingState imageUri={imageUri} />;

      case 'results':
        if (!result) return null;
        return (
          <IdentificationResults
            result={result}
            imageUri={imageUri}
            selectedPlant={selectedPlant}
            onSelectPlant={selectResult}
            onAddPlant={handleAddPlant}
            onRetry={handleRetake}
            onClose={handleClose}
          />
        );

      case 'error':
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetake}>
              <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Identificar planta</Text>
            </View>

            {renderContent()}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    interior: 'Interior',
    exterior: 'Exterior',
    aromaticas: 'Aromáticas',
    huerta: 'Huerta',
    frutales: 'Frutales',
    suculentas: 'Suculentas',
  };
  return names[category] || 'Otra';
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 58, 46, 0.4)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '95%',
    minHeight: '70%',
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
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
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
});
