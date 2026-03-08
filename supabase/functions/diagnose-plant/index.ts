// Supabase Edge Function: diagnose-plant
// Proxy para Google Gemini Flash API - diagnóstico de salud de plantas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlantContext {
  species: string;
  waterEvery: number;
  sunHours: number;
  lastWatered: string | null;
  outdoorDays: number[];
}

interface RequestBody {
  imagesBase64?: string[];
  imageBase64?: string; // backward compat
  plantContext: PlantContext;
  lang?: string; // 'es' | 'en'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Servicio de diagnóstico no configurado',
          code: 'NO_API_KEY'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body: RequestBody = await req.json();

    // Support both single image (backward compat) and multiple images
    const images = body.imagesBase64 || (body.imageBase64 ? [body.imageBase64] : []);

    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Se requiere al menos una imagen', code: 'NO_IMAGE' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate image sizes (max 5MB each in base64)
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in base64 chars
    for (let i = 0; i < images.length; i++) {
      if (images[i].length > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({
            error: `La imagen ${i + 1} es demasiado grande. El tamaño máximo es 5MB.`,
            code: 'IMAGE_TOO_LARGE'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    const ctx = body.plantContext;
    const lang = body.lang || 'en';
    const isEs = lang === 'es';

    const dayNames = isEs
      ? ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
      : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const contextInfo = ctx
      ? isEs
        ? `
Contexto de la planta:
- Especie: ${ctx.species}
- Frecuencia de riego: cada ${ctx.waterEvery} días
- Horas de sol recomendadas: ${ctx.sunHours}h/día
- Último riego: ${ctx.lastWatered || 'desconocido'}
- Días al exterior: ${ctx.outdoorDays.length > 0 ? ctx.outdoorDays.map(d => dayNames[d]).join(', ') : 'ninguno (interior)'}
`
        : `
Plant context:
- Species: ${ctx.species}
- Watering frequency: every ${ctx.waterEvery} days
- Recommended sun hours: ${ctx.sunHours}h/day
- Last watered: ${ctx.lastWatered || 'unknown'}
- Outdoor days: ${ctx.outdoorDays.length > 0 ? ctx.outdoorDays.map(d => dayNames[d]).join(', ') : 'none (indoor)'}
`
      : '';

    const photoContext = images.length > 1
      ? isEs
        ? `Se proporcionan ${images.length} fotos de la misma planta desde distintos ángulos. Analizá TODAS las fotos en conjunto para un diagnóstico más preciso.`
        : `${images.length} photos of the same plant from different angles are provided. Analyze ALL photos together for a more accurate diagnosis.`
      : isEs
        ? 'Se proporciona una foto de la planta.'
        : 'One photo of the plant is provided.';

    const langInstruction = isEs
      ? 'Usá español argentino (vos, regá, sacá, poné). Sé específico con los tratamientos (dosis, frecuencia).'
      : 'Use clear, friendly English. Be specific with treatments (dosage, frequency).';

    const systemPrompt = isEs
      ? `Sos un experto en fitopatología y cuidado de plantas. Analizá las imágenes de esta planta y diagnosticá su estado de salud.
${contextInfo}
${photoContext}

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "overallStatus": "healthy" | "minor" | "moderate" | "severe",
  "summary": "Resumen breve del estado general",
  "issues": [
    {
      "name": "Nombre del problema",
      "confidence": 0-100,
      "severity": "healthy" | "minor" | "moderate" | "severe",
      "description": "Descripción del problema",
      "treatment": "Tratamiento recomendado"
    }
  ],
  "careTips": ["Consejo general 1", "Consejo general 2"]
}

Reglas:
- Si la planta se ve sana, devolvé overallStatus "healthy" con issues vacío y tips de mantenimiento
- Máximo 3 issues, ordenados por severidad
- Confidence es tu nivel de certeza sobre cada diagnóstico (0-100)
- ${langInstruction}
- Si no podés ver bien la planta, mencionalo en el summary
- Si hay múltiples fotos, considerá la información de TODAS para el diagnóstico`
      : `You are an expert in plant pathology and plant care. Analyze the images of this plant and diagnose its health status.
${contextInfo}
${photoContext}

Respond ONLY with valid JSON (no markdown, no backticks) with this exact structure:
{
  "overallStatus": "healthy" | "minor" | "moderate" | "severe",
  "summary": "Brief summary of the overall status",
  "issues": [
    {
      "name": "Problem name",
      "confidence": 0-100,
      "severity": "healthy" | "minor" | "moderate" | "severe",
      "description": "Problem description",
      "treatment": "Recommended treatment"
    }
  ],
  "careTips": ["General tip 1", "General tip 2"]
}

Rules:
- If the plant looks healthy, return overallStatus "healthy" with empty issues and maintenance tips
- Maximum 3 issues, ordered by severity
- Confidence is your certainty level for each diagnosis (0-100)
- ${langInstruction}
- If you can't see the plant clearly, mention it in the summary
- If there are multiple photos, consider ALL of them for the diagnosis`;

    console.log(`Calling Gemini Flash API with ${images.length} image(s), lang: ${lang}...`);

    // Build image parts for Gemini
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img,
      },
    }));

    const userText = images.length > 1
      ? isEs
        ? `Diagnosticá el estado de salud de esta planta. Te envío ${images.length} fotos desde distintos ángulos.`
        : `Diagnose this plant's health status. Here are ${images.length} photos from different angles.`
      : isEs
        ? 'Diagnosticá el estado de salud de esta planta.'
        : 'Diagnose the health status of this plant.';

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
          contents: [
            {
              parts: [
                ...imageParts,
                { text: userText },
              ],
            },
          ],
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
        JSON.stringify({
          error: `Error del servicio de IA: ${geminiResponse.status}`,
          details: errorText,
          code: 'GEMINI_ERROR'
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('Empty Gemini response:', JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({
          error: 'No se recibió respuesta del análisis',
          code: 'EMPTY_RESPONSE'
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse the JSON response from Gemini
    let diagnosis;
    try {
      diagnosis = JSON.parse(textContent);
    } catch {
      // Try to extract JSON from the response if wrapped in markdown
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Could not parse response:', textContent);
        throw new Error('Could not parse diagnosis response');
      }
    }

    console.log(`Diagnosis complete: ${diagnosis.overallStatus}, ${diagnosis.issues?.length || 0} issues (from ${images.length} photos)`);

    return new Response(
      JSON.stringify(diagnosis),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
