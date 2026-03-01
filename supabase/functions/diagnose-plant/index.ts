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
  imageBase64: string;
  plantContext: PlantContext;
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

    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Se requiere una imagen', code: 'NO_IMAGE' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ctx = body.plantContext;
    const contextInfo = ctx
      ? `
Contexto de la planta:
- Especie: ${ctx.species}
- Frecuencia de riego: cada ${ctx.waterEvery} días
- Horas de sol recomendadas: ${ctx.sunHours}h/día
- Último riego: ${ctx.lastWatered || 'desconocido'}
- Días al exterior: ${ctx.outdoorDays.length > 0 ? ctx.outdoorDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ') : 'ninguno (interior)'}
`
      : '';

    const systemPrompt = `Sos un experto en fitopatología y cuidado de plantas. Analizá la imagen de esta planta y diagnosticá su estado de salud.
${contextInfo}
Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "overallStatus": "healthy" | "minor" | "moderate" | "severe",
  "summary": "Resumen breve del estado general en español argentino, usando vos/voseo",
  "issues": [
    {
      "name": "Nombre del problema",
      "confidence": 0-100,
      "severity": "healthy" | "minor" | "moderate" | "severe",
      "description": "Descripción del problema en español argentino",
      "treatment": "Tratamiento recomendado en español argentino"
    }
  ],
  "careTips": ["Consejo general 1", "Consejo general 2"]
}

Reglas:
- Si la planta se ve sana, devolvé overallStatus "healthy" con issues vacío y tips de mantenimiento
- Máximo 3 issues, ordenados por severidad
- Confidence es tu nivel de certeza sobre cada diagnóstico (0-100)
- Usá español argentino (vos, regá, sacá, poné)
- Sé específico con los tratamientos (dosis, frecuencia)
- Si no podés ver bien la planta, mencionalo en el summary`;

    console.log('Calling Gemini Flash API...');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: body.imageBase64,
                  },
                },
                {
                  text: 'Diagnosticá el estado de salud de esta planta.',
                },
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

    console.log(`Diagnosis complete: ${diagnosis.overallStatus}, ${diagnosis.issues?.length || 0} issues`);

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
