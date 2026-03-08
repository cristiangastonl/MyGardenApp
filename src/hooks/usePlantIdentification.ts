import { useState, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { IdentificationState, IdentificationResult, IdentifiedPlant } from '../types';
import { identifyPlant } from '../utils/plantIdentification';
import { getEnrichedPlantData, EnrichedPlantData } from '../services/plantKnowledgeService';
import { trackEvent } from '../services/analyticsService';

const TIMEOUT_MS = 30000; // 30 seconds timeout

interface UsePlantIdentificationReturn {
  state: IdentificationState;
  imageUri: string | null;
  imageBase64: string | null;
  result: IdentificationResult | null;
  error: string | null;
  enrichedData: EnrichedPlantData | null;
  isEnriching: boolean;

  // Actions
  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  analyze: () => Promise<void>;
  reset: () => void;
  selectResult: (plant: IdentifiedPlant) => void;
  selectedPlant: IdentifiedPlant | null;
}

export function usePlantIdentification(): UsePlantIdentificationReturn {
  const { t } = useTranslation();
  const [state, setState] = useState<IdentificationState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<IdentifiedPlant | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedPlantData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState('idle');
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    setSelectedPlant(null);
    setEnrichedData(null);
    setIsEnriching(false);
  }, []);

  const handleImageResult = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) {
      return false;
    }

    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageBase64(asset.base64 || null);
    setState('capturing');
    setError(null);
    return true;
  }, []);

  const pickFromCamera = useCallback(async () => {
    try {
      if (__DEV__) console.log('[PlantID] Requesting camera permission...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (__DEV__) console.log('[PlantID] Camera permission status:', status);
      if (status !== 'granted') {
        setError(t('identification.cameraPermissionNeeded'));
        setState('error');
        return;
      }

      if (__DEV__) console.log('[PlantID] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (__DEV__) console.log('[PlantID] Camera result - canceled:', result.canceled, 'assets:', result.assets?.length, 'hasBase64:', !!result.assets?.[0]?.base64, 'base64Length:', result.assets?.[0]?.base64?.length);
      handleImageResult(result);
    } catch (err) {
      console.error('[PlantID] Camera error:', err);
      setError(t('identification.cameraError'));
      setState('error');
    }
  }, [handleImageResult]);

  const pickFromGallery = useCallback(async () => {
    try {
      if (__DEV__) console.log('[PlantID] Requesting gallery permission...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (__DEV__) console.log('[PlantID] Gallery permission status:', status);
      if (status !== 'granted') {
        setError(t('identification.galleryPermissionNeeded'));
        setState('error');
        return;
      }

      if (__DEV__) console.log('[PlantID] Launching gallery...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (__DEV__) console.log('[PlantID] Gallery result - canceled:', result.canceled, 'assets:', result.assets?.length, 'hasBase64:', !!result.assets?.[0]?.base64, 'base64Length:', result.assets?.[0]?.base64?.length);
      handleImageResult(result);
    } catch (err) {
      console.error('[PlantID] Gallery error:', err);
      setError(t('identification.galleryError'));
      setState('error');
    }
  }, [handleImageResult]);

  const analyze = useCallback(async () => {
    if (!imageBase64) {
      setError(t('identification.noImageToAnalyze'));
      setState('error');
      return;
    }

    if (__DEV__) console.log('[PlantID] Starting analysis, base64 length:', imageBase64.length);
    setState('analyzing');
    setError(null);
    setResult(null);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (__DEV__) console.log('[PlantID] Request timed out after', TIMEOUT_MS, 'ms');
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      const identificationResult = await identifyPlant(
        imageBase64,
        undefined, // API key ya no es necesaria, está en el servidor
        abortControllerRef.current.signal
      );

      clearTimeout(timeoutId);

      if (__DEV__) console.log('[PlantID] Result:', JSON.stringify({ success: identificationResult.success, type: identificationResult.type, resultsCount: identificationResult.results.length, reason: identificationResult.reason }));
      setResult(identificationResult);

      if (identificationResult.success) {
        setState('results');
        trackEvent('plant_identified', {
          result_count: identificationResult.results.length,
          top_result: identificationResult.results[0]?.commonName,
        });
        // Auto-select if single high-confidence result
        if (identificationResult.type === 'single' && identificationResult.results.length === 1) {
          setSelectedPlant(identificationResult.results[0]);
        }
      } else {
        setState('results');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[PlantID] Analysis threw error:', err.name, err.message, err);

      if (err.name === 'AbortError') {
        setError(t('identification.identificationTimeout'));
      } else {
        setError(err.message || t('identification.identificationError'));
      }
      setState('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [imageBase64]);

  const selectResult = useCallback(async (plant: IdentifiedPlant) => {
    setSelectedPlant(plant);
    setEnrichedData(null);
    setIsEnriching(true);

    try {
      // Try to get enriched data from Perenual API or cache
      const enriched = await getEnrichedPlantData(plant.commonName, {
        waterEvery: plant.waterDays,
        sunHours: plant.sunHours,
        tempMin: plant.tempMin,
        tempMax: plant.tempMax,
        indoor: plant.indoor,
      });

      setEnrichedData(enriched);

      // If we got better data, log it
      if (enriched.source !== 'default') {
        if (__DEV__) console.log(`[PlantID] Enriched ${plant.commonName} from ${enriched.source}`);
      }
    } catch (err) {
      if (__DEV__) console.log('[PlantID] Could not enrich plant data:', err);
      // Keep using the original identified data
    } finally {
      setIsEnriching(false);
    }
  }, []);

  return {
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
  };
}
