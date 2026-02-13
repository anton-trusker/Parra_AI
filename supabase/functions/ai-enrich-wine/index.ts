import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { wine_id } = await req.json();
    if (!wine_id) {
      return new Response(JSON.stringify({ error: "wine_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the wine
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: wine, error: wineErr } = await adminClient
      .from("wines")
      .select("*")
      .eq("id", wine_id)
      .single();

    if (wineErr || !wine) {
      return new Response(JSON.stringify({ error: "Wine not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context about the wine
    const wineContext = [
      `Name: "${wine.raw_source_name || wine.name}"`,
      wine.producer ? `Producer: ${wine.producer}` : null,
      wine.vintage ? `Vintage: ${wine.vintage}` : null,
      wine.volume_ml ? `Volume: ${wine.volume_ml}ml` : null,
      wine.region ? `Region: ${wine.region}` : null,
      wine.country ? `Country: ${wine.country}` : null,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a world-class wine sommelier and expert. Given a wine product, provide comprehensive enrichment data. Return ONLY a JSON object with these fields:
- country: wine-producing country
- region: wine region
- sub_region: sub-region if identifiable
- appellation: official appellation (DOC, AOC, DOCG, etc.)
- grape_varieties: array of grape variety names
- wine_type: one of "Red", "White", "Rosé", "Sparkling", "Dessert", "Fortified", "Orange"
- producer: producer/winery name (if not already known)
- tasting_notes: brief tasting description (2-3 sentences)
- food_pairing: food pairing suggestions (1-2 sentences)
- sweetness: one of "dry", "off-dry", "semi-sweet", "sweet"
- acidity: one of "low", "medium", "high", "crisp"
- tannins: one of "low", "medium", "high", "firm" (for reds/some rosés, null for whites)
- body: one of "light", "medium", "full"

Use null for fields you cannot determine with reasonable confidence.`
          },
          {
            role: "user",
            content: `Enrich this wine:\n${wineContext}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    const usage = result.usage || {};
    const totalTokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    const estimatedCost = (totalTokens / 1_000_000) * 0.30;

    let enrichment: any;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      enrichment = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 300));
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      enrichment,
      tokens_used: totalTokens,
      estimated_cost_usd: Math.round(estimatedCost * 10000) / 10000,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-enrich-wine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});