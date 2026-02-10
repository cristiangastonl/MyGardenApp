import { useState, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { IdentificationState, IdentificationResult, IdentifiedPlant } from '../types';
import { identifyPlant } from '../utils/plantIdentification';
import { getEnrichedPlantData, EnrichedPlantData } from '../services/plantKnowledgeService';

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
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Se necesita permiso para acceder a la cámara');
        setState('error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      handleImageResult(result);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Error al abrir la cámara');
      setState('error');
    }
  }, [handleImageResult]);

  const pickFromGallery = useCallback(async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Se necesita permiso para acceder a la galería');
        setState('error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      handleImageResult(result);
    } catch (err) {
      console.error('Gallery error:', err);
      setError('Error al abrir la galería');
      setState('error');
    }
  }, [handleImageResult]);

  const analyze = useCallback(async () => {
    if (!imageBase64) {
      setError('No hay imagen para analizar');
      setState('error');
      return;
    }

    setState('analyzing');
    setError(null);
    setResult(null);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      const identificationResult = await identifyPlant(
        imageBase64,
        undefined, // API key ya no es necesaria, está en el servidor
        abortControllerRef.current.signal
      );

      clearTimeout(timeoutId);

      setResult(identificationResult);

      if (identificationResult.success) {
        setState('results');
        // Auto-select if single high-confidence result
        if (identificationResult.type === 'single' && identificationResult.results.length === 1) {
          setSelectedPlant(identificationResult.results[0]);
        }
      } else {
        setState('results');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        setError('La identificación tardó demasiado. Intentá de nuevo.');
      } else {
        setError(err.message || 'Error al identificar la planta');
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
        console.log(`[PlantID] Enriched ${plant.commonName} from ${enriched.source}`);
      }
    } catch (err) {
      console.log('[PlantID] Could not enrich plant data:', err);
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
