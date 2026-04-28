import { useState, useCallback, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { DiagnosisState, DiagnosisResult, DiagnosisChatMessage, PlantDiagnosisContext, SavedDiagnosis } from '../types';
import { diagnosePlant, chatDiagnosis, ChatDiagnosisResponse } from '../utils/plantDiagnosis';
import { trackEvent } from '../services/analyticsService';

const TIMEOUT_MS = 45000; // More time for multiple images
const CHAT_TIMEOUT_MS = 15000;
const MAX_PHOTOS = 3;

interface UsePlantDiagnosisOptions {
  plantId?: string;
  plantContext?: PlantDiagnosisContext;
  onDiagnosisComplete?: (diagnosis: SavedDiagnosis) => void;
  initialImages?: string[] | Array<{ uri: string; base64: string }>;
  resumeDiagnosis?: SavedDiagnosis | null;
}

interface ImageEntry {
  uri: string;
  base64: string;
}

interface UsePlantDiagnosisReturn {
  state: DiagnosisState;
  images: ImageEntry[];
  imageUri: string | null; // First image for backward compat
  result: DiagnosisResult | null;
  error: string | null;
  savedDiagnosisId: string | null;
  maxPhotos: number;
  isResumedChat: boolean;

  // Chat
  chatMessages: DiagnosisChatMessage[];
  chatLoading: boolean;
  chatError: string | null;

  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  removeImage: (index: number) => void;
  analyze: (plantContext: PlantDiagnosisContext) => Promise<void>;
  sendChatMessage: (message: string, imageBase64?: string, imageUri?: string) => Promise<void>;
  reset: () => void;
}

export function usePlantDiagnosis(options?: UsePlantDiagnosisOptions): UsePlantDiagnosisReturn {
  const { t, i18n } = useTranslation();
  const resumeDiag = options?.resumeDiagnosis;
  const [state, setState] = useState<DiagnosisState>(resumeDiag ? 'results' : 'idle');
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(resumeDiag?.result || null);
  const [error, setError] = useState<string | null>(null);
  const [savedDiagnosisId, setSavedDiagnosisId] = useState<string | null>(resumeDiag?.id || null);
  const [isResumedChat, setIsResumedChat] = useState(!!resumeDiag);

  // Chat state - preload from resumed diagnosis
  const [chatMessages, setChatMessages] = useState<DiagnosisChatMessage[]>(resumeDiag?.chat || []);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const plantContextRef = useRef<PlantDiagnosisContext | null>(options?.plantContext || resumeDiag?.context || null);

  // Abort any pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Load initial images if provided (e.g. reusing photos from identification)
  const initialImagesLoadedRef = useRef(false);
  useEffect(() => {
    if (!options?.initialImages || options.initialImages.length === 0 || initialImagesLoadedRef.current) return;
    initialImagesLoadedRef.current = true;

    const items = options.initialImages!;
    // Check if items are pre-loaded { uri, base64 } entries or plain URI strings
    if (typeof items[0] === 'object' && 'base64' in items[0]) {
      // Pre-loaded entries — use directly, no file read needed
      setImages(items as ImageEntry[]);
      setState('capturing');
      return;
    }

    // Legacy: plain URI strings — read from file
    const loadImages = async () => {
      const entries: ImageEntry[] = [];
      for (const uri of items as string[]) {
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          entries.push({ uri, base64 });
        } catch (e) {
          console.warn('[Diagnosis] Failed to read initial image:', e);
        }
      }
      if (entries.length > 0) {
        setImages(entries);
        setState('capturing');
      }
    };
    loadImages();
  }, [options?.initialImages]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState('idle');
    setImages([]);
    setResult(null);
    setError(null);
    setSavedDiagnosisId(null);
    setIsResumedChat(false);
    setChatMessages([]);
    setChatLoading(false);
    setChatError(null);
  }, []);

  const addImage = useCallback((pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return false;
    }
    const asset = pickerResult.assets[0];
    if (!asset.base64) {
      console.warn('[Diagnosis] No base64 returned from picker');
      return false;
    }

    setImages(prev => {
      if (prev.length >= MAX_PHOTOS) return prev;
      return [...prev, { uri: asset.uri, base64: asset.base64! }];
    });
    setState('capturing');
    setError(null);
    return true;
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setState('idle');
      }
      return next;
    });
  }, []);

  const pickFromCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError(t('diagnosis.cameraPermissionNeeded'));
        setState('error');
        return;
      }
      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      addImage(pickerResult);
    } catch (err) {
      console.error('[Diagnosis] Camera error:', err);
      setError(t('diagnosis.cameraError'));
      setState('error');
    }
  }, [addImage]);

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError(t('diagnosis.galleryPermissionNeeded'));
        setState('error');
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      addImage(pickerResult);
    } catch (err) {
      console.error('[Diagnosis] Gallery error:', err);
      setError(t('diagnosis.galleryError'));
      setState('error');
    }
  }, [addImage]);

  const analyze = useCallback(async (plantContext: PlantDiagnosisContext) => {
    if (images.length === 0) {
      setError(t('diagnosis.noImageToAnalyze'));
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
      const imagesBase64 = images.map(img => img.base64);
      const diagnosisResult = await diagnosePlant(
        imagesBase64,
        plantContext,
        abortControllerRef.current.signal,
        i18n.language
      );

      clearTimeout(timeoutId);
      setResult(diagnosisResult);
      setState('results');

      trackEvent('plant_diagnosed', {
        status: diagnosisResult.overallStatus,
        issues_count: diagnosisResult.issues.length,
        photo_count: images.length,
      });

      // Create SavedDiagnosis and notify parent
      if (options?.plantId) {
        const diagId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setSavedDiagnosisId(diagId);

        const imageUris = images.map(img => img.uri);
        const saved: SavedDiagnosis = {
          id: diagId,
          plantId: options.plantId,
          date: new Date().toISOString(),
          imageUri: imageUris[0] || null,
          imageUris,
          result: diagnosisResult,
          context: plantContext,
          chat: [],
          resolved: false,
          resolvedDate: null,
          lang: i18n.language,
        };
        options.onDiagnosisComplete?.(saved);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError(t('diagnosis.diagnosisTimeout'));
      } else {
        setError(err.message || t('diagnosis.diagnosisError'));
      }
      setState('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [images, options?.plantId, options?.onDiagnosisComplete, t, i18n.language]);

  const sendChatMessage = useCallback(async (message: string, imageBase64?: string, imageUri?: string) => {
    if (!result || !plantContextRef.current) return;

    const userMsg: DiagnosisChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: message,
      timestamp: new Date().toISOString(),
      imageUri: imageUri || null,
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    setChatError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), imageBase64 ? TIMEOUT_MS : CHAT_TIMEOUT_MS);

    try {
      const response: ChatDiagnosisResponse = await chatDiagnosis(
        result,
        plantContextRef.current,
        [...chatMessages, userMsg],
        message,
        controller.signal,
        imageBase64,
        i18n.language,
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
        setChatError(t('diagnosis.chatTimeout'));
      } else {
        setChatError(err.message || t('diagnosis.chatError'));
      }
    } finally {
      setChatLoading(false);
    }
  }, [result, chatMessages, t, i18n.language]);

  return {
    state,
    images,
    imageUri: images[0]?.uri || null,
    result,
    error,
    savedDiagnosisId,
    maxPhotos: MAX_PHOTOS,
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
  };
}
