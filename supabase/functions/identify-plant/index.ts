// Supabase Edge Function: identify-plant
// Proxy para PlantNet API - mantiene la API key segura en el servidor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify/all';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  imageBase64: string;
  organ?: string; // 'leaf', 'flower', 'fruit', 'bark', 'auto'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get PlantNet API key from Supabase secrets
    const plantnetApiKey = Deno.env.get('PLANTNET_API_KEY');

    if (!plantnetApiKey) {
      console.error('PLANTNET_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Servicio de identificación no configurado',
          code: 'NO_API_KEY'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
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

    // Convert base64 to Uint8Array for the blob
    const binaryString = atob(body.imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // Create FormData for PlantNet API
    const formData = new FormData();
    formData.append('images', blob, 'plant.jpg');
    formData.append('organs', body.organ || 'auto');

    // Call PlantNet API
    const url = `${PLANTNET_API_URL}?api-key=${plantnetApiKey}&include-related-images=false&no-reject=false&lang=es`;

    console.log('Calling PlantNet API...');

    const plantnetResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    // Handle PlantNet response
    if (!plantnetResponse.ok) {
      if (plantnetResponse.status === 404) {
        // No plant identified - this is a valid response
        return new Response(
          JSON.stringify({
            results: [],
            message: 'No se pudo identificar la planta en la imagen'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.error('PlantNet API error:', plantnetResponse.status);
      return new Response(
        JSON.stringify({
          error: `Error de PlantNet: ${plantnetResponse.status}`,
          code: 'PLANTNET_ERROR'
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await plantnetResponse.json();

    console.log(`PlantNet returned ${data.results?.length || 0} results`);

    return new Response(
      JSON.stringify(data),
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
