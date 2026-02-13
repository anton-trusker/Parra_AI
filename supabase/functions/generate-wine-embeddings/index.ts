import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - require admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    // Verify user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check if user is admin
    const userId = claimsData.claims.sub;
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 100;
    const forceRefresh = body.force_refresh || false;

    // Mode 1: If OPENAI_API_KEY exists, generate real vector embeddings
    // Mode 2: Otherwise, just rebuild search_text (trigram matching)
    const hasOpenAI = !!openaiApiKey;

    let totalProcessed = 0;
    let totalEmbedded = 0;
    let offset = 0;

    while (true) {
      // Fetch wines that need processing
      let query = supabaseAdmin
        .from("wines")
        .select("id, name, producer, vintage, region, country, appellation, grape_varieties, volume_ml, search_text, embedding")
        .eq("is_active", true)
        .range(offset, offset + batchSize - 1);

      if (!forceRefresh) {
        // Only process wines without search_text
        query = query.is("search_text", null);
      }

      const { data: wines, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      if (!wines || wines.length === 0) break;

      for (const wine of wines) {
        // Build search text (always done)
        const searchText = buildSearchText(wine);

        const updatePayload: Record<string, unknown> = { search_text: searchText };

        // Generate embedding if OpenAI key is available
        if (hasOpenAI && (forceRefresh || !wine.embedding)) {
          try {
            const embedding = await generateEmbedding(openaiApiKey!, searchText);
            updatePayload.embedding = JSON.stringify(embedding);
            totalEmbedded++;
          } catch (e) {
            console.error(`Embedding failed for wine ${wine.id}:`, e);
          }
        }

        await supabaseAdmin
          .from("wines")
          .update(updatePayload)
          .eq("id", wine.id);

        totalProcessed++;
      }

      offset += batchSize;

      // Safety limit
      if (offset > 10000) break;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_processed: totalProcessed,
        total_embedded: totalEmbedded,
        embedding_mode: hasOpenAI ? "openai" : "trigram_only",
        message: hasOpenAI
          ? `Processed ${totalProcessed} wines, generated ${totalEmbedded} embeddings`
          : `Processed ${totalProcessed} wines with trigram search text (add OPENAI_API_KEY for vector embeddings)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-wine-embeddings error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSearchText(wine: Record<string, unknown>): string {
  const parts = [
    wine.producer as string,
    wine.name as string,
    wine.vintage ? String(wine.vintage) : null,
    wine.region as string,
    wine.country as string,
    wine.appellation as string,
  ].filter(Boolean);

  // Extract grape varieties from JSON array
  if (wine.grape_varieties && Array.isArray(wine.grape_varieties)) {
    parts.push(...(wine.grape_varieties as string[]));
  }

  if (wine.volume_ml) {
    parts.push(`${wine.volume_ml}ML`);
  }

  return parts.join(" ").toUpperCase().trim();
}

async function generateEmbedding(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI embeddings error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}
