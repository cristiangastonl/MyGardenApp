import React, { useCallback, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { usePlantDiagnosis } from '../../hooks/usePlantDiagnosis';
import { usePremiumGate } from '../../config/premium';
import { useStorage } from '../../hooks/useStorage';
import { Plant, WeatherData, PlantDiagnosisContext, SavedDiagnosis } from '../../types';
import { CameraCapture } from '../PlantIdentifier/CameraCapture';
import { DiagnosisAnalyzingState } from './DiagnosisAnalyzingState';
import { DiagnosisResults } from './DiagnosisResults';

interface PlantDiagnosisModalProps {
  visible: boolean;
  plant: Plant;
  weather: WeatherData | null;
  onClose: () => void;
}

export function PlantDiagnosisModal({
  visible,
  plant,
  weather,
  onClose,
}: PlantDiagnosisModalProps) {
  const { saveDiagnosis, addChatMessage } = useStorage();
  const { canChatDiagnosis, isPremium } = usePremiumGate();

  const handleDiagnosisComplete = useCallback((diagnosis: SavedDiagnosis) => {
    saveDiagnosis(diagnosis);
  }, [saveDiagnosis]);

  const plantContext: PlantDiagnosisContext = {
    species: plant.typeName,
    waterEvery: plant.waterEvery,
    sunHours: plant.sunHours,
    lastWatered: plant.lastWatered,
    outdoorDays: plant.outdoorDays,
  };

  const {
    state,
    imageUri,
    result,
    error,
    savedDiagnosisId,
    chatMessages,
    chatLoading,
    chatError,
    pickFromCamera,
    pickFromGallery,
    analyze,
    sendChatMessage,
    reset,
  } = usePlantDiagnosis({
    plantId: plant.id,
    plantContext,
    onDiagnosisComplete: handleDiagnosisComplete,
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRetake = () => {
    reset();
  };

  const handleAnalyze = () => {
    analyze(plantContext);
  };

  const userMessageCount = chatMessages.filter(m => m.role === 'user').length;
  const canChat = canChatDiagnosis(userMessageCount);
  const persistedCountRef = useRef(0);

  // Persist new chat messages to storage when assistant replies arrive
  React.useEffect(() => {
    if (!savedDiagnosisId || chatMessages.length === 0) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg.role !== 'assistant') return;

    // Persist both user + assistant messages in one batch
    const newMessages = chatMessages.slice(persistedCountRef.current);
    if (newMessages.length > 0) {
      addChatMessage(plant.id, savedDiagnosisId, newMessages);
    }
    persistedCountRef.current = chatMessages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length]);

  const renderContent = () => {
    switch (state) {
      case 'idle':
      case 'capturing':
        return (
          <CameraCapture
            imageUri={imageUri}
            onPickCamera={pickFromCamera}
            onPickGallery={pickFromGallery}
            onAnalyze={handleAnalyze}
            onRetake={handleRetake}
            analyzeLabel="Diagnosticar"
            title="Foto de la zona afectada"
            subtitle="Enfocá las hojas, tallos o raíces que te preocupen"
            tips={[
              'Enfocá la zona con problemas',
              'Buena iluminación natural',
              'Mostrá hojas de cerca si están dañadas',
            ]}
          />
        );

      case 'analyzing':
        return <DiagnosisAnalyzingState imageUri={imageUri} />;

      case 'results':
        if (!result) return null;
        return (
          <DiagnosisResults
            result={result}
            onRetake={handleRetake}
            onClose={handleClose}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            chatError={chatError}
            canSendChat={canChat}
            onSendChat={sendChatMessage}
            isPremium={isPremium}
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
              <Text style={styles.title}>Diagnóstico de salud</Text>
            </View>

            {renderContent()}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
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
