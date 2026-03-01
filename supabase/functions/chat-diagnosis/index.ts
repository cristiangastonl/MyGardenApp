// Supabase Edge Function: chat-diagnosis
// Proxy para Google Gemini Flash API - chat de seguimiento de diagnósticos

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosisIssue {
  name: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
}

interface DiagnosisResult {
  overallStatus: string;
  summary: string;
  issues: DiagnosisIssue[];
  careTips: string[];
}

interface PlantContext {
  species: string;
  waterEvery: number;
  sunHours: number;
  lastWatered: string | null;
  outdoorDays: number[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface RequestBody {
  diagnosisResult: DiagnosisResult;
  plantContext: PlantContext;
  chatHistory: ChatMessage[];
  userMessage: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Servicio no configurado', code: 'NO_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();

    if (!body.userMessage?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un mensaje', code: 'NO_MESSAGE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ctx = body.plantContext;
    const diag = body.diagnosisResult;

    const issuesDescription = diag.issues.length > 0
      ? diag.issues.map(i => `- ${i.name} (${i.severity}, ${i.confidence}% confianza): ${i.description}`).join('\n')
      : '- Sin problemas detectados';

    const systemPrompt = `Sos un experto en fitopatología y cuidado de plantas, haciendo seguimiento de un diagnóstico previo.

Contexto de la planta:
- Especie: ${ctx.species}
- Frecuencia de riego: cada ${ctx.waterEvery} días
- Horas de sol recomendadas: ${ctx.sunHours}h/día
- Último riego: ${ctx.lastWatered || 'desconocido'}
- Días al exterior: ${ctx.outdoorDays.length > 0 ? ctx.outdoorDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ') : 'ninguno (interior)'}

Diagnóstico previo:
- Estado general: ${diag.overallStatus}
- Resumen: ${diag.summary}
- Problemas:
${issuesDescription}
- Consejos dados: ${diag.careTips.join('; ')}

El usuario te va a dar información adicional o hacer preguntas sobre el diagnóstico. Re-evaluá si es necesario con la info nueva.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks):
{
  "reply": "Tu respuesta en español argentino, usando vos/voseo. Sé conciso pero útil.",
  "updatedTips": ["Consejo actualizado 1", "Consejo actualizado 2"]
}

Reglas:
- Si el usuario corrige algo del diagnóstico (ej: "eso es tierra, no plaga"), aceptá la corrección y ajustá tus consejos
- updatedTips solo si cambiaron respecto a los originales, sino devolvé array vacío
- Usá español argentino (vos, regá, sacá, poné)
- Sé empático y práctico`;

    // Build conversation history for Gemini
    const contents = [];

    for (const msg of body.chatHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: body.userMessage }],
    });

    console.log('Calling Gemini Flash API for chat, messages:', contents.length);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Error del servicio de IA: ${geminiResponse.status}`, code: 'GEMINI_ERROR' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('Empty Gemini response:', JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: 'No se recibió respuesta', code: 'EMPTY_RESPONSE' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let chatResponse;
    try {
      chatResponse = JSON.parse(textContent);
    } catch {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        chatResponse = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Could not parse response:', textContent);
        throw new Error('Could not parse chat response');
      }
    }

    console.log('Chat response generated, updatedTips:', chatResponse.updatedTips?.length || 0);

    return new Response(
      JSON.stringify(chatResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
