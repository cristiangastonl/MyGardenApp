import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../../theme';
import { usePlantDiagnosis } from '../../hooks/usePlantDiagnosis';
import { usePremiumGate } from '../../config/premium';
import { usePremium } from '../../hooks/usePremium';
import { useStorage } from '../../hooks/useStorage';
import { Plant, WeatherData, PlantDiagnosisContext, SavedDiagnosis, ProblemEntry } from '../../types';
import { startTracking } from '../../services/problemTrackingService';
import { CameraCapture } from '../PlantIdentifier/CameraCapture';
import { DiagnosisAnalyzingState } from './DiagnosisAnalyzingState';
import { DiagnosisResults } from './DiagnosisResults';

interface PlantDiagnosisModalProps {
  visible: boolean;
  plant: Plant;
  weather: WeatherData | null;
  onClose: () => void;
  initialImages?: string[] | Array<{ uri: string; base64: string }>;
  resumeDiagnosis?: SavedDiagnosis | null;
  onAddToShoppingList?: (treatment: string) => void;
  canAddToShoppingList?: boolean;
}

export function PlantDiagnosisModal({
  visible,
  plant,
  weather,
  onClose,
  initialImages,
  resumeDiagnosis = null,
  onAddToShoppingList,
  canAddToShoppingList = false,
}: PlantDiagnosisModalProps) {
  const { t } = useTranslation();
  const { saveDiagnosis, addChatMessage, diagnosisCount, trackProblem, resolveTrackedProblem, addFollowUpEntry } = useStorage();
  const { canChatDiagnosis, canDiagnose, isPremium } = usePremiumGate();
  const { showPaywall } = usePremium();

  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const photoSourceResolveRef = useRef<((value: { base64: string; uri: string } | null) => void) | null>(null);

  // Ref to hold the current SavedDiagnosis for tracking (updated on completion)
  const currentDiagnosisRef = useRef<SavedDiagnosis | null>(resumeDiagnosis);

  // Resolution suggestion state
  const [showResolutionSuggestion, setShowResolutionSuggestion] = useState(false);
  const [dismissedResolution, setDismissedResolution] = useState(false);
  const [resolvedAnimation, setResolvedAnimation] = useState(false);

  const handleDiagnosisComplete = useCallback((diagnosis: SavedDiagnosis) => {
    currentDiagnosisRef.current = diagnosis;
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
    images,
    imageUri,
    result,
    error,
    savedDiagnosisId,
    maxPhotos,
    isResumedChat,
    chatMessages,
    chatLoading,
    chatError,
    pickFromCamera,
    pickFromGallery,
    removeImage,
    analyze,
    sendChatMessage,
    reset,
  } = usePlantDiagnosis({
    plantId: plant.id,
    plantContext,
    onDiagnosisComplete: handleDiagnosisComplete,
    initialImages,
    resumeDiagnosis: resumeDiagnosis,
    onImprovementDetected: () => setShowResolutionSuggestion(true),
    onFollowUpEntry: (entry: ProblemEntry) => {
      if (!plant || !savedDiagnosisId) return;
      addFollowUpEntry(plant.id, savedDiagnosisId, entry);
    },
  });

  // Handler for "Track this problem" button
  const handleTrackProblem = useCallback(async () => {
    const diagnosis = currentDiagnosisRef.current;
    if (!plant || !diagnosis) return;
    await startTracking(plant, diagnosis, trackProblem);
  }, [plant, trackProblem]);

  // Handler for resolution confirmation
  const handleConfirmResolution = useCallback(() => {
    const diagnosis = currentDiagnosisRef.current;
    if (!plant || !diagnosis) return;
    resolveTrackedProblem(plant.id, diagnosis.id);
    setShowResolutionSuggestion(false);
    setResolvedAnimation(true);
    setTimeout(() => setResolvedAnimation(false), 1500);
  }, [plant, resolveTrackedProblem]);

  const handleDismissResolution = useCallback(() => {
    setDismissedResolution(true);
    setShowResolutionSuggestion(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRetake = () => {
    // Only check paywall if a diagnosis was already completed (not on permission errors etc.)
    if (result && !canDiagnose(diagnosisCount)) {
      showPaywall('plant_diagnosis');
      handleClose();
      return;
    }
    reset();
  };

  const handleAnalyze = () => {
    analyze(plantContext);
  };

  const userMessageCount = chatMessages.filter(m => m.role === 'user').length;
  const totalUserMessages = isResumedChat
    ? userMessageCount  // For resumed chats, count only new messages in this session
    : userMessageCount;
  const canChat = canChatDiagnosis(totalUserMessages);

  const pickChatPhotoFromCamera = useCallback(async (): Promise<{ base64: string; uri: string } | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setCameraPermissionDenied(true);
        return null;
      }
      // Clear any previous denial message on successful permission grant
      setCameraPermissionDenied(false);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return null;
      return { base64: result.assets[0].base64!, uri: result.assets[0].uri };
    } catch {
      return null;
    }
  }, []);

  const pickChatPhotoFromGallery = useCallback(async (): Promise<{ base64: string; uri: string } | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return null;
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      if (pickerResult.canceled || !pickerResult.assets?.[0]?.base64) return null;
      return { base64: pickerResult.assets[0].base64!, uri: pickerResult.assets[0].uri };
    } catch {
      return null;
    }
  }, []);

  const pickChatPhoto = useCallback((): Promise<{ base64: string; uri: string } | null> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [t('settings.cancel'), t('diagnosis.chatTakePhoto'), t('diagnosis.chatChooseGallery')],
            cancelButtonIndex: 0,
          },
          async (index) => {
            if (index === 1) resolve(await pickChatPhotoFromCamera());
            else if (index === 2) resolve(await pickChatPhotoFromGallery());
            else resolve(null);
          }
        );
      } else {
        // Android: show custom bottom sheet modal
        setShowPhotoSourceModal(true);
        photoSourceResolveRef.current = resolve;
      }
    });
  }, [pickChatPhotoFromCamera, pickChatPhotoFromGallery, t]);

  const handlePhotoSourceSelect = useCallback(async (source: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
    const resolve = photoSourceResolveRef.current;
    photoSourceResolveRef.current = null;
    if (!resolve) return;
    if (source === 'camera') {
      resolve(await pickChatPhotoFromCamera());
    } else {
      resolve(await pickChatPhotoFromGallery());
    }
  }, [pickChatPhotoFromCamera, pickChatPhotoFromGallery]);

  const handlePhotoSourceCancel = useCallback(() => {
    setShowPhotoSourceModal(false);
    const resolve = photoSourceResolveRef.current;
    photoSourceResolveRef.current = null;
    if (resolve) resolve(null);
  }, []);
  const persistedCountRef = useRef(resumeDiagnosis?.chat?.length || 0);

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
            imageUris={images.map(img => img.uri)}
            maxPhotos={maxPhotos}
            onPickCamera={pickFromCamera}
            onPickGallery={pickFromGallery}
            onAnalyze={handleAnalyze}
            onRetake={handleRetake}
            onRemoveImage={removeImage}
            analyzeLabel={t('diagnosis.diagnoseButton')}
            title={t('diagnosis.diagnoseCameraTitle')}
            subtitle={t('diagnosis.diagnoseCameraSubtitle')}
            tips={[
              t('diagnosis.diagnoseCameraTip1'),
              t('diagnosis.diagnoseCameraTip2'),
              t('diagnosis.diagnoseCameraTip3'),
            ]}
          />
        );

      case 'analyzing':
        return <DiagnosisAnalyzingState imageUris={images.map(img => img.uri)} />;

      case 'results':
        if (!result) return null;
        return (
          <DiagnosisResults
            result={result}
            onRetake={handleRetake}
            onClose={handleClose}
            isResumedChat={isResumedChat}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            chatError={chatError}
            canSendChat={canChat}
            onSendChat={sendChatMessage}
            onPickChatPhoto={pickChatPhoto}
            isPremium={isPremium}
            chatCameraPermissionDenied={cameraPermissionDenied}
            onPaywall={() => showPaywall('plant_diagnosis')}
            onAddToShoppingList={onAddToShoppingList}
            canAddToShoppingList={canAddToShoppingList}
            onTrackProblem={handleTrackProblem}
            isAlreadyTracked={currentDiagnosisRef.current?.isTracked ?? false}
            trackingStatus={currentDiagnosisRef.current?.trackingStatus}
            showResolutionSuggestion={showResolutionSuggestion && !dismissedResolution}
            onConfirmResolution={handleConfirmResolution}
            onDismissResolution={handleDismissResolution}
          />
        );

      case 'error':
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>{t('diagnosis.errorTitle')}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetake}>
              <Text style={styles.retryButtonText}>{t('diagnosis.retryButton')}</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.container, state === 'results' && styles.containerExpanded]}>
              <View style={styles.header}>
                <View style={styles.handle} />
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('diagnosis.modalTitle')}</Text>
              </View>

              {renderContent()}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Android photo source bottom sheet */}
      <Modal
        visible={showPhotoSourceModal}
        transparent
        animationType="slide"
        onRequestClose={handlePhotoSourceCancel}
      >
        <TouchableOpacity
          style={styles.photoSourceOverlay}
          activeOpacity={1}
          onPress={handlePhotoSourceCancel}
        >
          <View style={styles.photoSourceSheet}>
            <TouchableOpacity
              style={styles.photoSourceRow}
              onPress={() => handlePhotoSourceSelect('camera')}
            >
              <Text style={styles.photoSourceRowText}>📷  {t('diagnosis.chatTakePhoto')}</Text>
            </TouchableOpacity>
            <View style={styles.photoSourceSeparator} />
            <TouchableOpacity
              style={styles.photoSourceRow}
              onPress={() => handlePhotoSourceSelect('gallery')}
            >
              <Text style={styles.photoSourceRowText}>🖼️  {t('diagnosis.chatChooseGallery')}</Text>
            </TouchableOpacity>
            <View style={styles.photoSourceSeparator} />
            <TouchableOpacity
              style={styles.photoSourceRow}
              onPress={handlePhotoSourceCancel}
            >
              <Text style={styles.photoSourceCancelText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  containerExpanded: {
    minHeight: '95%',
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
  photoSourceOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  photoSourceSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.lg,
    paddingBottom: Platform.OS === 'android' ? spacing.lg : 0,
  },
  photoSourceRow: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
  },
  photoSourceRowText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  photoSourceSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
  photoSourceCancelText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
