import { DiagnosisResult, DiagnosisChatMessage, PlantDiagnosisContext } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Diagnostica la salud de una planta usando Claude Vision via Edge Function
 */
export async function diagnosePlant(
  imageBase64: string,
  plantContext: PlantDiagnosisContext,
  signal?: AbortSignal
): Promise<DiagnosisResult> {
  // Si Supabase no está configurado, usar mock para desarrollo
  if (!isSupabaseConfigured()) {
    console.log('[Diagnosis] Supabase no configurado, usando modo mock');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return getMockDiagnosisResult();
  }

  try {
    console.log('[Diagnosis] Calling edge function, image size:', Math.round(imageBase64.length / 1024), 'KB');

    const { data, error } = await supabase.functions.invoke<DiagnosisResult>('diagnose-plant', {
      body: { imageBase64, plantContext },
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (error) {
      console.error('[Diagnosis] Edge function error:', error);
      let reason = 'Error al conectar con el servicio de diagnóstico';
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          reason = errorBody?.error || errorBody?.message || reason;
        } else if (error.message) {
          reason = error.message;
        }
      } catch {
        // Use default message
      }
      throw new Error(reason);
    }

    if (!data) {
      throw new Error('No se recibió respuesta del diagnóstico');
    }

    console.log('[Diagnosis] Result:', data.overallStatus, 'issues:', data.issues?.length);
    return data;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('[Diagnosis] Error:', error);
    throw new Error(error.message || 'Error al diagnosticar la planta');
  }
}

/**
 * Mock para desarrollo (sin Supabase configurado)
 */
export function getMockDiagnosisResult(): DiagnosisResult {
  const scenarios: DiagnosisResult[] = [
    {
      overallStatus: 'healthy',
      summary: 'Tu planta se ve muy bien. Las hojas tienen buen color y forma, sin signos de estrés.',
      issues: [],
      careTips: [
        'Seguí con el riego actual, le va bárbaro',
        'Podés rotar la maceta cada 2 semanas para un crecimiento parejo',
        'Limpiá las hojas con un trapo húmedo una vez por mes',
      ],
    },
    {
      overallStatus: 'moderate',
      summary: 'Tu planta muestra algunos signos de estrés que conviene atender pronto.',
      issues: [
        {
          name: 'Puntas marrones',
          confidence: 85,
          severity: 'moderate',
          description: 'Las puntas de las hojas están marrones y secas, lo que indica falta de humedad ambiental o riego irregular.',
          treatment: 'Regá de forma más consistente y pulverizá las hojas con agua cada 2-3 días. Si está cerca de una fuente de calor, alejala.',
        },
        {
          name: 'Hojas amarillentas',
          confidence: 70,
          severity: 'minor',
          description: 'Algunas hojas inferiores están amarillentas, posible exceso de riego o falta de nutrientes.',
          treatment: 'Dejá que la tierra se seque entre riegos. Podés agregar fertilizante líquido diluido cada 15 días.',
        },
      ],
      careTips: [
        'Revisá que la maceta tenga buen drenaje',
        'Evitá mojar las hojas al regar',
      ],
    },
    {
      overallStatus: 'severe',
      summary: 'Tu planta necesita atención urgente. Se ven varios problemas que hay que tratar ya.',
      issues: [
        {
          name: 'Posible plaga (cochinilla)',
          confidence: 75,
          severity: 'severe',
          description: 'Se ven manchas blancas algodonosas en el envés de las hojas, típicas de cochinilla.',
          treatment: 'Limpiá las hojas con alcohol isopropílico usando un algodón. Repetí cada 3 días por 2 semanas. Si persiste, usá aceite de neem.',
        },
        {
          name: 'Hojas caídas',
          confidence: 90,
          severity: 'moderate',
          description: 'Varias hojas están caídas y sin turgencia, señal de estrés hídrico.',
          treatment: 'Regá profundamente y dejá drenar. Si la tierra está muy compacta, sumergí la maceta en agua 15 minutos.',
        },
      ],
      careTips: [
        'Aislá la planta de otras para evitar contagio',
        'Revisá las demás plantas por si también tienen plaga',
      ],
    },
  ];

  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

export interface ChatDiagnosisResponse {
  reply: string;
  updatedTips: string[];
}

/**
 * Envía un mensaje de seguimiento sobre un diagnóstico previo
 */
export async function chatDiagnosis(
  diagnosisResult: DiagnosisResult,
  plantContext: PlantDiagnosisContext,
  chatHistory: DiagnosisChatMessage[],
  userMessage: string,
  signal?: AbortSignal
): Promise<ChatDiagnosisResponse> {
  if (!isSupabaseConfigured()) {
    console.log('[ChatDiagnosis] Supabase no configurado, usando modo mock');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockChatResponse(userMessage);
  }

  try {
    console.log('[ChatDiagnosis] Calling edge function, message:', userMessage.substring(0, 50));

    const { data, error } = await supabase.functions.invoke<ChatDiagnosisResponse>('chat-diagnosis', {
      body: {
        diagnosisResult,
        plantContext,
        chatHistory: chatHistory.map(m => ({ role: m.role, text: m.text })),
        userMessage,
      },
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (error) {
      console.error('[ChatDiagnosis] Edge function error:', error);
      let reason = 'Error al conectar con el servicio';
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          reason = errorBody?.error || errorBody?.message || reason;
        } else if (error.message) {
          reason = error.message;
        }
      } catch {
        // Use default message
      }
      throw new Error(reason);
    }

    if (!data) {
      throw new Error('No se recibió respuesta');
    }

    console.log('[ChatDiagnosis] Reply received, updatedTips:', data.updatedTips?.length || 0);
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error('[ChatDiagnosis] Error:', error);
    throw new Error(error.message || 'Error al enviar consulta');
  }
}

function getMockChatResponse(userMessage: string): ChatDiagnosisResponse {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('tierra') || lowerMsg.includes('no es')) {
    return {
      reply: 'Tenés razón, gracias por la aclaración. Si lo que se ve es tierra y no plaga, entonces tu planta está mejor de lo que pensaba. Igualmente te recomiendo seguir monitoreando las hojas por las dudas.',
      updatedTips: [
        'Limpiá las hojas con un paño húmedo para ver mejor su estado',
        'Revisá cada semana si aparecen manchas nuevas',
      ],
    };
  }

  return {
    reply: 'Buena pregunta. Basándome en el diagnóstico anterior y lo que me contás, te sugiero que sigas con los cuidados recomendados y observes si hay cambios en los próximos días. Si empeora, sacale otra foto y hacemos un nuevo diagnóstico.',
    updatedTips: [],
  };
}
