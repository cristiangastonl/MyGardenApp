import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { usePlantIdentification } from '../../hooks/usePlantIdentification';
import { IdentifiedPlant, Plant } from '../../types';
import { Features } from '../../config/features';
import { getPlantCategories } from '../../data/plantDatabase';
import { CameraCapture } from './CameraCapture';
import { AnalyzingState } from './AnalyzingState';
import { IdentificationResults } from './IdentificationResults';

interface PlantIdentifierModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPlant: (plant: Omit<Plant, 'id'>, imageUri?: string | null) => Promise<Plant>;
  onDiagnoseAfterIdentify?: (plant: Plant, reusePhotos: boolean, imageUri: string | null, imageBase64: string | null) => void;
  isPremium?: boolean;
  diagnosisCount?: number;
}

export function PlantIdentifierModal({
  visible,
  onClose,
  onAddPlant,
  onDiagnoseAfterIdentify,
  isPremium = false,
  diagnosisCount = 0,
}: PlantIdentifierModalProps) {
  const { t } = useTranslation();
  const [showDiagnosisPrompt, setShowDiagnosisPrompt] = useState(false);
  const [addedPlant, setAddedPlant] = useState<Plant | null>(null);
  const {
    state,
    imageUri,
    imageBase64,
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
    setShowDiagnosisPrompt(false);
    setAddedPlant(null);
    onClose();
  };

  const handleRetake = () => {
    reset();
    setShowDiagnosisPrompt(false);
    setAddedPlant(null);
  };

  const handleDiagnose = (reusePhotos: boolean) => {
    if (addedPlant && onDiagnoseAfterIdentify) {
      const capturedUri = imageUri;
      const capturedBase64 = imageBase64;
      handleClose();
      onDiagnoseAfterIdentify(addedPlant, reusePhotos, capturedUri, capturedBase64);
    }
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

    const doAdd = async (usePhoto: boolean) => {
      const createdPlant = await onAddPlant(plantData, usePhoto ? imageUri : null);
      // Show diagnosis prompt if feature is enabled
      if (Features.DLC_PEST_DIAGNOSIS && onDiagnoseAfterIdentify) {
        setAddedPlant(createdPlant);
        setShowDiagnosisPrompt(true);
      } else {
        handleClose();
      }
    };

    if (imageUri) {
      Alert.alert(
        t('identification.photoTitle'),
        t('identification.photoQuestion'),
        [
          {
            text: t('identification.photoNo'),
            style: 'cancel',
            onPress: () => doAdd(false),
          },
          {
            text: t('identification.photoYes'),
            onPress: () => doAdd(true),
          },
        ],
      );
    } else {
      doAdd(false);
    }
  };

  const renderContent = () => {
    // Show diagnosis prompt after plant added
    if (showDiagnosisPrompt && addedPlant) {
      return (
        <View style={styles.diagnosisPrompt}>
          <Text style={styles.diagnosisPromptIcon}>🩺</Text>
          <Text style={styles.diagnosisPromptTitle}>{t('identification.plantAdded')}</Text>
          <Text style={styles.diagnosisPromptQuestion}>{t('identification.wantToDiagnose')}</Text>
          {!isPremium && diagnosisCount < 1 && (
            <View style={styles.freeNoteContainer}>
              <Text style={styles.freeNoteText}>{t('identification.freeDiagnosisNote')}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.diagnosisOptionButton}
            onPress={() => handleDiagnose(true)}
          >
            <Text style={styles.diagnosisOptionButtonText}>{t('identification.useThesePhotos')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.diagnosisOptionButtonSecondary}
            onPress={() => handleDiagnose(false)}
          >
            <Text style={styles.diagnosisOptionButtonSecondaryText}>{t('identification.takeNewPhotos')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.diagnosisSkipButton}
            onPress={handleClose}
          >
            <Text style={styles.diagnosisSkipButtonText}>{t('identification.skipDiagnosis')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

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
            <Text style={styles.errorTitle}>{t('identification.error')}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetake}>
              <Text style={styles.retryButtonText}>{t('identification.retry')}</Text>
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
              <Text style={styles.title}>{t('identification.title')}</Text>
            </View>

            {renderContent()}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function getCategoryName(category: string): string {
  const cat = getPlantCategories().find(c => c.id === category);
  return cat?.name || category;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
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
    width: 44,
    height: 44,
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
  // Diagnosis prompt styles
  diagnosisPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  diagnosisPromptIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  diagnosisPromptTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  diagnosisPromptQuestion: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  freeNoteContainer: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  freeNoteText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    textAlign: 'center',
  },
  diagnosisOptionButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  diagnosisOptionButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  diagnosisOptionButtonSecondary: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  diagnosisOptionButtonSecondaryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  diagnosisSkipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  diagnosisSkipButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textMuted,
  },
});
