import { useState, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { DiagnosisState, DiagnosisResult, DiagnosisChatMessage, PlantDiagnosisContext, SavedDiagnosis } from '../types';
import { diagnosePlant, chatDiagnosis, ChatDiagnosisResponse } from '../utils/plantDiagnosis';
import { trackEvent } from '../services/analyticsService';

const TIMEOUT_MS = 30000;
const CHAT_TIMEOUT_MS = 15000;

interface UsePlantDiagnosisOptions {
  plantId?: string;
  plantContext?: PlantDiagnosisContext;
  onDiagnosisComplete?: (diagnosis: SavedDiagnosis) => void;
}

interface UsePlantDiagnosisReturn {
  state: DiagnosisState;
  imageUri: string | null;
  imageBase64: string | null;
  result: DiagnosisResult | null;
  error: string | null;
  savedDiagnosisId: string | null;

  // Chat
  chatMessages: DiagnosisChatMessage[];
  chatLoading: boolean;
  chatError: string | null;

  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  analyze: (plantContext: PlantDiagnosisContext) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  reset: () => void;
}

export function usePlantDiagnosis(options?: UsePlantDiagnosisOptions): UsePlantDiagnosisReturn {
  const [state, setState] = useState<DiagnosisState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedDiagnosisId, setSavedDiagnosisId] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<DiagnosisChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const plantContextRef = useRef<PlantDiagnosisContext | null>(options?.plantContext || null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState('idle');
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    setSavedDiagnosisId(null);
    setChatMessages([]);
    setChatLoading(false);
    setChatError(null);
  }, []);

  const handleImageResult = useCallback((pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return false;
    }
    const asset = pickerResult.assets[0];
    setImageUri(asset.uri);
    setImageBase64(asset.base64 || null);
    setState('capturing');
    setError(null);
    return true;
  }, []);

  const pickFromCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Se necesita permiso para acceder a la cámara');
        setState('error');
        return;
      }
      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      handleImageResult(pickerResult);
    } catch (err) {
      console.error('[Diagnosis] Camera error:', err);
      setError('Error al abrir la cámara');
      setState('error');
    }
  }, [handleImageResult]);

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Se necesita permiso para acceder a la galería');
        setState('error');
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      handleImageResult(pickerResult);
    } catch (err) {
      console.error('[Diagnosis] Gallery error:', err);
      setError('Error al abrir la galería');
      setState('error');
    }
  }, [handleImageResult]);

  const analyze = useCallback(async (plantContext: PlantDiagnosisContext) => {
    if (!imageBase64) {
      setError('No hay imagen para analizar');
      setState('error');
      return;
    }

    plantContextRef.current = plantContext;
    setState('analyzing');
    setError(null);
    setResult(null);

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      const diagnosisResult = await diagnosePlant(
        imageBase64,
        plantContext,
        abortControllerRef.current.signal
      );

      clearTimeout(timeoutId);
      setResult(diagnosisResult);
      setState('results');

      trackEvent('plant_diagnosed', {
        status: diagnosisResult.overallStatus,
        issues_count: diagnosisResult.issues.length,
      });

      // Create SavedDiagnosis and notify parent
      if (options?.plantId) {
        const diagId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setSavedDiagnosisId(diagId);

        const saved: SavedDiagnosis = {
          id: diagId,
          plantId: options.plantId,
          date: new Date().toISOString(),
          imageUri: imageUri,
          result: diagnosisResult,
          context: plantContext,
          chat: [],
          resolved: false,
          resolvedDate: null,
        };
        options.onDiagnosisComplete?.(saved);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('El diagnóstico tardó demasiado. Intentá de nuevo.');
      } else {
        setError(err.message || 'Error al diagnosticar la planta');
      }
      setState('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [imageBase64, imageUri, options?.plantId, options?.onDiagnosisComplete]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!result || !plantContextRef.current) return;

    const userMsg: DiagnosisChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    setChatError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

    try {
      const response: ChatDiagnosisResponse = await chatDiagnosis(
        result,
        plantContextRef.current,
        [...chatMessages, userMsg],
        message,
        controller.signal
      );

      clearTimeout(timeoutId);

      const assistantMsg: DiagnosisChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, assistantMsg]);

      // Update tips if provided
      if (response.updatedTips && response.updatedTips.length > 0) {
        setResult(prev => prev ? { ...prev, careTips: response.updatedTips } : prev);
      }

      trackEvent('diagnosis_chat_sent', {
        has_updated_tips: response.updatedTips.length > 0,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setChatError('La consulta tardó demasiado. Intentá de nuevo.');
      } else {
        setChatError(err.message || 'Error al enviar consulta');
      }
    } finally {
      setChatLoading(false);
    }
  }, [result, chatMessages]);

  return {
    state,
    imageUri,
    imageBase64,
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
  };
}
