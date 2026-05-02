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
  lastWatered: string | null;
  outdoorDays: number[];

  // ─── v1.0 legacy fields (optional — old clients only) ───
  waterEvery?: number;
  sunHours?: number;

  // ─── v1.1 fields (Phase 7+) ───
  lightLevel?: 'direct' | 'bright_indirect' | 'medium_indirect' | 'low';
  waterSchedule?: { warm: number; cold: number };
  waterMode?: 'fixed' | 'soil_check';
  currentSeason?: 'warm' | 'cold' | 'tropical';
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
  /** Phase 9 (DIAG-05): when present, server prepends a resume clause to systemPrompt
   *  including this summary verbatim plus the no-severity-re-assess instruction.
   *  Backward-compat: when absent, behavior unchanged. */
  priorDiagnosisSummary?: string;
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

    // Phase 7 (Plan 07-08): dual-payload discriminator. New clients send waterSchedule;
    // old clients (pre-Phase-7, store-update grace window) send waterEvery + sunHours.
    // Legacy branch sunsets in v1.2 once telemetry shows ≥99% new-payload traffic.
    const isV2 = !!ctx?.waterSchedule;

    // ─── i18n helpers for v1.1 enums (ES + EN) ───
    const lightLevelLabelEs: Record<string, string> = {
      direct: 'luz directa',
      bright_indirect: 'luz brillante indirecta',
      medium_indirect: 'luz media indirecta',
      low: 'poca luz',
    };
    const lightLevelLabelEn: Record<string, string> = {
      direct: 'direct light',
      bright_indirect: 'bright indirect light',
      medium_indirect: 'medium indirect light',
      low: 'low light',
    };
    const seasonLabelEs: Record<string, string> = { warm: 'cálida', cold: 'fría', tropical: 'trópico' };
    const seasonLabelEn: Record<string, string> = { warm: 'warm', cold: 'cold', tropical: 'tropical' };

    // ─── v1.1 prompt builder ───
    const buildV2Es = (c: PlantContext) => {
      const ll = c.lightLevel ? lightLevelLabelEs[c.lightLevel] : 'no especificado';
      const season = c.currentSeason ? seasonLabelEs[c.currentSeason] : 'no especificada';
      const waterLines = c.waterMode === 'soil_check'
        ? `- Modo de riego: por chequeo
- Esta planta usa modo "por chequeo" — el usuario revisa la tierra en lugar de regar en intervalos fijos`
        : `- Modo de riego: calendario
- Cuidado de riego: temporada cálida cada ${c.waterSchedule?.warm ?? '?'} días
- Cuidado de riego: temporada fría cada ${c.waterSchedule?.cold ?? '?'} días`;
      return `Contexto de la planta:
- Especie: ${c.species}
${waterLines}
- Temporada actual: ${season}
- Nivel de luz: ${ll}
- Último riego: ${c.lastWatered || 'desconocido'}
- Días al exterior: ${c.outdoorDays.length > 0 ? c.outdoorDays.map(d => dayNames[d]).join(', ') : 'ninguno (interior)'}`;
    };

    const buildV2En = (c: PlantContext) => {
      const ll = c.lightLevel ? lightLevelLabelEn[c.lightLevel] : 'unspecified';
      const season = c.currentSeason ? seasonLabelEn[c.currentSeason] : 'unspecified';
      const waterLines = c.waterMode === 'soil_check'
        ? `- Watering mode: check-in
- This plant uses "check-in" mode — the user checks the soil instead of watering on fixed intervals`
        : `- Watering mode: schedule
- Watering care: warm season every ${c.waterSchedule?.warm ?? '?'} days
- Watering care: cold season every ${c.waterSchedule?.cold ?? '?'} days`;
      return `Plant context:
- Species: ${c.species}
${waterLines}
- Current season: ${season}
- Light level: ${ll}
- Last watered: ${c.lastWatered || 'unknown'}
- Outdoor days: ${c.outdoorDays.length > 0 ? c.outdoorDays.map(d => dayNames[d]).join(', ') : 'none (indoor)'}`;
    };

    // ─── v1.0 legacy prompt builder (preserved for grace-window clients) ───
    const buildLegacyEs = (c: PlantContext) =>
      `Contexto de la planta:
- Especie: ${c.species}
- Frecuencia de riego: cada ${c.waterEvery} días
- Horas de sol recomendadas: ${c.sunHours}h/día
- Último riego: ${c.lastWatered || 'desconocido'}
- Días al exterior: ${c.outdoorDays.length > 0 ? c.outdoorDays.map(d => dayNames[d]).join(', ') : 'ninguno (interior)'}`;
    const buildLegacyEn = (c: PlantContext) =>
      `Plant context:
- Species: ${c.species}
- Watering frequency: every ${c.waterEvery} days
- Recommended sun hours: ${c.sunHours}h/day
- Last watered: ${c.lastWatered || 'unknown'}
- Outdoor days: ${c.outdoorDays.length > 0 ? c.outdoorDays.map(d => dayNames[d]).join(', ') : 'none (indoor)'}`;

    const contextInfo = ctx
      ? (isV2 && isEs ? buildV2Es(ctx)
        : isV2 && !isEs ? buildV2En(ctx)
        : isEs ? buildLegacyEs(ctx)
        : buildLegacyEn(ctx))
      : '';

    // Phase 9 (DIAG-05): resume clause injected when priorDiagnosisSummary is present.
    // Voseo: "Continuá", "evalúes" — Phase 5 Plan 02 lock.
    const resumeClause = body.priorDiagnosisSummary
      ? (isEs
        ? `\n\nResumen del diagnóstico previo:\n${body.priorDiagnosisSummary}\n\nNo re-evalúes la severidad ni cambies el diagnóstico salvo que el usuario suba una foto nueva. Continuá el seguimiento basándote en el diagnóstico previo.`
        : `\n\nPrior diagnosis summary:\n${body.priorDiagnosisSummary}\n\nDo not re-assess severity or change the diagnosis unless the user uploads a new photo. Continue follow-up based on the prior diagnosis.`)
      : '';

    const systemPrompt = isEs
      ? `Sos un experto en fitopatología y cuidado de plantas, haciendo seguimiento de un diagnóstico previo.

${contextInfo}${resumeClause}

Diagnóstico previo:
- Estado general: ${diag.overallStatus}
- Resumen: ${diag.summary}
- Problemas:
${issuesDescription}
- Consejos dados: ${diag.careTips.join('; ')}

El usuario te va a dar información adicional o hacer preguntas sobre el diagnóstico. Puede enviar fotos nuevas mostrando la evolución de la planta. Re-evaluá si es necesario con la info nueva.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks):
{
  "reply": "Tu respuesta en espanol argentino, usando vos/voseo. Se conciso pero util.",
  "updatedTips": ["Consejo actualizado 1", "Consejo actualizado 2"],
  "improvementDetected": false
}

Reglas:
- SOLO respondé preguntas relacionadas con esta planta (${ctx.species}) y su diagnóstico. Si el usuario pregunta algo que NO tiene que ver con esta planta, su salud, su cuidado o su diagnóstico, respondé: "${offTopicReply}"
- Si el usuario corrige algo del diagnóstico (ej: "eso es tierra, no plaga"), aceptá la corrección y ajustá tus consejos
- updatedTips solo si cambiaron respecto a los originales, sino devolvé array vacío
- Usá español argentino (vos, regá, sacá, poné)
- Sé empático y práctico
- "improvementDetected": true SOLO si observas una mejora clara comparando la foto/info nueva con el diagnostico previo. No lo pongas en true solo porque el usuario dice que mejoro — evalualo vos.`
      : `You are an expert in plant pathology and plant care, following up on a previous diagnosis.

${contextInfo}${resumeClause}

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
  "updatedTips": ["Updated tip 1", "Updated tip 2"],
  "improvementDetected": false
}

Rules:
- ONLY answer questions related to this plant (${ctx.species}) and its diagnosis. If the user asks about something unrelated to this plant, its health, care, or diagnosis, reply: "${offTopicReply}"
- If the user corrects something in the diagnosis (e.g., "that's soil, not a pest"), accept the correction and adjust your tips
- updatedTips only if they changed from the originals, otherwise return empty array
- Use clear, friendly English
- Be empathetic and practical
- "improvementDetected": true ONLY if you observe clear improvement comparing the new photo/info with the previous diagnosis. Do not set true just because the user claims improvement — evaluate it yourself.`;

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
