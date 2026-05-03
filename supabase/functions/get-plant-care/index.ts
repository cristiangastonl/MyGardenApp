// Supabase Edge Function: get-plant-care
// Proxy para Perenual API (search + details) - mantiene PERENUAL_API_KEY segura en el servidor.
// Phase 10 (SEC-02): mirror estructural de identify-plant. Anónimo-permitido (sin JWT) — plant lookups son lectura pública sin PII.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PERENUAL_API_BASE = 'https://perenual.com/api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DATA-01: Bidirectional name-overlap validator for Perenual search results.
 * Rejects search hits whose name has no substring overlap with the user's query.
 * Spec lock per REQUIREMENTS.md DATA-01: lowercase + bidirectional includes.
 * Known acceptable false positive: query "rose" matches result "rosemary" (documented; revisit only if DATA-04 fixture flags it).
 */
function isGoodMatch(query: string, result: { common_name?: string; scientific_name?: string[] }): boolean {
  const q = (query || '').toLowerCase();
  if (!q) return false;
  const cn = (result.common_name || '').toLowerCase();
  const sn = (result.scientific_name?.[0] || '').toLowerCase();
  // Bidirectional: query includes result name OR result name includes query (either field)
  return (cn !== '' && (cn.includes(q) || q.includes(cn)))
      || (sn !== '' && (sn.includes(q) || q.includes(sn)));
}

interface RequestBody {
  plantName: string;
  lang?: 'en' | 'es';  // accepted for forward-compat with Phase 11; currently no server-side i18n branch
}

// Mirrors src/services/plantKnowledgeService.ts:39-52. Returned inside `data` field of the response envelope.
interface PerenualPlantDetail {
  id: number;
  common_name: string;
  scientific_name: string[];
  other_name: string[];
  default_image?: {
    regular_url?: string;
    medium_url?: string;
    small_url?: string;
  };
  watering: string;
  sunlight: string[];
  description?: string;
  care_level?: string;
  maintenance?: string;
  watering_general_benchmark?: {
    value?: string;
    unit?: string;
  };
  indoor?: boolean;
  hardiness?: {
    min?: string;
    max?: string;
  };
  family?: string;   // ADD: taxonomic family (e.g., "Araceae", "Cactaceae") - used by client humidity classifier (Plan 11-02 DATA-03)
  type?: string;     // ADD: plant type (e.g., "tree", "Flower", "succulent") - used by client humidity + tempMax fallback (Plan 11-02 DATA-02/03)
}

serve(async (req) => {
  // Handle CORS preflight (mirror identify-plant)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Perenual API key from Supabase secrets (server-side only)
    const perenualApiKey = Deno.env.get('PERENUAL_API_KEY');

    if (!perenualApiKey) {
      console.error('PERENUAL_API_KEY not configured');
      return new Response(
        JSON.stringify({
          data: null,
          error: 'Servicio de Perenual no configurado',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();

    if (!body.plantName || typeof body.plantName !== 'string') {
      return new Response(
        JSON.stringify({ data: null, error: 'Se requiere plantName (string)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Search Perenual species-list (mirrors plantKnowledgeService.ts:145)
    const searchUrl = `${PERENUAL_API_BASE}/species-list?key=${perenualApiKey}&q=${encodeURIComponent(body.plantName)}`;
    console.log('[get-plant-care] Searching Perenual for:', body.plantName);

    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      console.log('[get-plant-care] Search failed:', searchRes.status);
      return new Response(
        JSON.stringify({ data: null, error: `Perenual search HTTP ${searchRes.status}` }),
        {
          status: 200,  // 200 to client — search failure is a "no data" outcome, not a server error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const searchData = await searchRes.json();
    const plants = searchData.data || [];

    if (plants.length === 0) {
      console.log('[get-plant-care] No plants found for:', body.plantName);
      return new Response(
        JSON.stringify({ data: null }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the first match
    const plant = plants[0];

    // DATA-01: Reject mismatched search results before the details fetch (no garbage cached, save one Perenual API call)
    if (!isGoodMatch(body.plantName, plant)) {
      console.log(`[get-plant-care] Mismatch: query="${body.plantName}" vs result="${plant.common_name}" / "${plant.scientific_name?.[0] ?? ''}"`);
      return new Response(
        JSON.stringify({ data: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get detailed info (mirrors plantKnowledgeService.ts:165)
    const detailUrl = `${PERENUAL_API_BASE}/species/details/${plant.id}?key=${perenualApiKey}`;
    const detailRes = await fetch(detailUrl);

    let detail: PerenualPlantDetail = plant;
    if (detailRes.ok) {
      detail = await detailRes.json();
    } else {
      console.log('[get-plant-care] Details failed (using search payload):', detailRes.status);
    }

    console.log('[get-plant-care] Returning detail for plant id:', detail.id);

    return new Response(
      JSON.stringify({ data: detail }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[get-plant-care] Edge function error:', error);
    return new Response(
      JSON.stringify({
        data: null,
        error: error.message || 'Error interno del servidor',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
