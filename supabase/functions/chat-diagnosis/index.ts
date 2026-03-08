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
  imageBase64?: string;
  lang?: string; // 'es' | 'en'
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
    const lang = body.lang || 'en';
    const isEs = lang === 'es';

    const dayNames = isEs
      ? ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
      : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const issuesDescription = diag.issues.length > 0
      ? diag.issues.map(i => `- ${i.name} (${i.severity}, ${i.confidence}% ${isEs ? 'confianza' : 'confidence'}): ${i.description}`).join('\n')
      : isEs ? '- Sin problemas detectados' : '- No problems detected';

    const offTopicReply = isEs
      ? `Solo puedo ayudarte con el diagnóstico de tu ${ctx.species}. ¿Tenés alguna duda sobre su cuidado?`
      : `I can only help you with the diagnosis of your ${ctx.species}. Do you have any questions about its care?`;

    const systemPrompt = isEs
      ? `Sos un experto en fitopatología y cuidado de plantas, haciendo seguimiento de un diagnóstico previo.

Contexto de la planta:
- Especie: ${ctx.species}
- Frecuencia de riego: cada ${ctx.waterEvery} días
- Horas de sol recomendadas: ${ctx.sunHours}h/día
- Último riego: ${ctx.lastWatered || 'desconocido'}
- Días al exterior: ${ctx.outdoorDays.length > 0 ? ctx.outdoorDays.map(d => dayNames[d]).join(', ') : 'ninguno (interior)'}

Diagnóstico previo:
- Estado general: ${diag.overallStatus}
- Resumen: ${diag.summary}
- Problemas:
${issuesDescription}
- Consejos dados: ${diag.careTips.join('; ')}

El usuario te va a dar información adicional o hacer preguntas sobre el diagnóstico. Puede enviar fotos nuevas mostrando la evolución de la planta. Re-evaluá si es necesario con la info nueva.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks):
{
  "reply": "Tu respuesta en español argentino, usando vos/voseo. Sé conciso pero útil.",
  "updatedTips": ["Consejo actualizado 1", "Consejo actualizado 2"]
}

Reglas:
- SOLO respondé preguntas relacionadas con esta planta (${ctx.species}) y su diagnóstico. Si el usuario pregunta algo que NO tiene que ver con esta planta, su salud, su cuidado o su diagnóstico, respondé: "${offTopicReply}"
- Si el usuario corrige algo del diagnóstico (ej: "eso es tierra, no plaga"), aceptá la corrección y ajustá tus consejos
- updatedTips solo si cambiaron respecto a los originales, sino devolvé array vacío
- Usá español argentino (vos, regá, sacá, poné)
- Sé empático y práctico`
      : `You are an expert in plant pathology and plant care, following up on a previous diagnosis.

Plant context:
- Species: ${ctx.species}
- Watering frequency: every ${ctx.waterEvery} days
- Recommended sun hours: ${ctx.sunHours}h/day
- Last watered: ${ctx.lastWatered || 'unknown'}
- Outdoor days: ${ctx.outdoorDays.length > 0 ? ctx.outdoorDays.map(d => dayNames[d]).join(', ') : 'none (indoor)'}

Previous diagnosis:
- Overall status: ${diag.overallStatus}
- Summary: ${diag.summary}
- Issues:
${issuesDescription}
- Tips given: ${diag.careTips.join('; ')}

The user will provide additional information or ask questions about the diagnosis. They may send new photos showing the plant's progress. Re-evaluate if needed with the new info.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "reply": "Your response in clear, friendly English. Be concise but helpful.",
  "updatedTips": ["Updated tip 1", "Updated tip 2"]
}

Rules:
- ONLY answer questions related to this plant (${ctx.species}) and its diagnosis. If the user asks about something unrelated to this plant, its health, care, or diagnosis, reply: "${offTopicReply}"
- If the user corrects something in the diagnosis (e.g., "that's soil, not a pest"), accept the correction and adjust your tips
- updatedTips only if they changed from the originals, otherwise return empty array
- Use clear, friendly English
- Be empathetic and practical`;

    // Build conversation history for Gemini
    const contents = [];

    for (const msg of body.chatHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Add current user message (with optional photo)
    const userParts: any[] = [{ text: body.userMessage }];
    if (body.imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: body.imageBase64,
        },
      });
    }
    contents.push({
      role: 'user',
      parts: userParts,
    });

    console.log('Calling Gemini Flash API for chat, messages:', contents.length, body.imageBase64 ? '(with photo)' : '');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
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
