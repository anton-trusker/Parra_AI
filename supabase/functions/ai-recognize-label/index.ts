import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VISION_PROMPT = `You are a wine label recognition system for restaurant inventory counting.
Analyze this photo of a wine bottle label and extract the following information in JSON format:

{
  "product_name": "Full wine name as written on the label",
  "producer": "Producer/winery name",
  "vintage": null or 4-digit year (e.g. 2021),
  "region": "Wine region if visible",
  "country": "Country of origin if identifiable",
  "grape_variety": "Grape variety if visible",
  "bottle_size_ml": null or number (e.g. 750),
  "appellation": "Appellation/DOC/AOC if visible",
  "alcohol_content": null or number (e.g. 13.5),
  "confidence": 0.0 to 1.0 - your confidence in the overall extraction,
  "label_text_raw": "All readable text from the label"
}

Rules:
- Extract ONLY what you can actually read on the label. Do not guess.
- If a field is not visible, set it to null.
- For vintage, only extract a clear 4-digit year (1900-2100).
- confidence should reflect how clearly you can read the label.
- Return ONLY valid JSON, no markdown, no explanation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
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
    const userId = claimsData.claims.sub;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { image_base64, session_id } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read AI config for custom API key
    const { data: aiConfig } = await supabaseAdmin
      .from("ai_config")
      .select("settings, model_name")
      .limit(1)
      .maybeSingle();

    const aiSettings = (aiConfig?.settings as Record<string, any>) || {};
    const customApiKey = aiSettings.custom_api_key;
    const customGatewayUrl = aiSettings.custom_gateway_url;
    const modelName = aiConfig?.model_name || "google/gemini-2.5-flash";

    const apiKey = customApiKey || Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("AI not configured: no API key available");
    }
    const gatewayUrl = customGatewayUrl || "https://ai.gateway.lovable.dev/v1/chat/completions";

    // Create AI attempt record
    const { data: attempt, error: attemptErr } = await supabaseAdmin
      .from("ai_recognition_attempts")
      .insert({
        user_id: userId,
        session_id: session_id || null,
        model_used: modelName,
        prompt_version: "v2-pgvector",
        status: "processing",
      })
      .select("id")
      .single();

    if (attemptErr) {
      console.error("Failed to create attempt:", attemptErr);
      throw new Error("Failed to create recognition attempt");
    }

    // Step 1: Vision extraction via AI Gateway
    const aiResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image_base64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      await updateAttemptFailed(supabaseAdmin, attempt.id, `AI gateway error: ${aiResponse.status}`, startTime);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiJson = await aiResponse.json();
    const rawText = aiJson.choices?.[0]?.message?.content ?? "";
    const tokensUsed = aiJson.usage?.total_tokens ?? null;

    // Parse extracted data
    let extracted: Record<string, unknown> | null = null;
    try {
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      extracted = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      await supabaseAdmin
        .from("ai_recognition_attempts")
        .update({
          status: "failed",
          raw_response: { text: rawText },
          error_message: "Failed to parse AI response as JSON",
          tokens_used: tokensUsed,
          processing_time_ms: Date.now() - startTime,
          processed_at: new Date().toISOString(),
        })
        .eq("id", attempt.id);

      return new Response(
        JSON.stringify({ status: "failed", attempt_id: attempt.id, error: "Could not parse label data", ocr_text: rawText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Multi-strategy candidate retrieval
    const candidates = await retrieveCandidates(supabaseAdmin, extracted, openaiApiKey);

    // Step 3: Score and rank candidates
    let matchedWine: Record<string, unknown> | null = null;
    let matchMethod = "none";
    let matchConfidence = 0;

    if (candidates.length > 0) {
      const scored = scoreCandidates(candidates, extracted);
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];

      if (best.score >= 50) {
        matchedWine = best;
        matchConfidence = Math.min(best.score, 100);
        matchMethod = best.retrieval_method || (best.score >= 70 ? "exact" : "fuzzy");
      }

      // Vintage refinement
      if (extracted?.vintage && matchedWine && (matchedWine as Record<string, unknown>).vintage !== extracted.vintage) {
        const vintageMatch = scored.find(
          (c) => c.vintage === extracted!.vintage && c.score >= 30
        );
        if (vintageMatch) {
          matchedWine = vintageMatch;
          matchConfidence = Math.min(vintageMatch.score + 10, 100);
        }
      }
    }

    // Update attempt with results
    const finalStatus =
      matchedWine && matchConfidence >= 50 ? "success" :
      matchedWine ? "manual_review" : "failed";

    await supabaseAdmin
      .from("ai_recognition_attempts")
      .update({
        raw_response: aiJson,
        extracted_data: extracted,
        matched_product_id: (matchedWine as Record<string, unknown>)?.id || null,
        match_confidence: matchConfidence,
        match_method: matchMethod,
        tokens_used: tokensUsed,
        processing_time_ms: Date.now() - startTime,
        status: finalStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    // Build response
    const result: Record<string, unknown> = {
      status: finalStatus,
      attempt_id: attempt.id,
      extracted,
      confidence: matchConfidence,
      processing_time_ms: Date.now() - startTime,
    };

    if (matchedWine) {
      const mw = matchedWine as Record<string, unknown>;
      result.match = {
        id: mw.id, name: mw.name, producer: mw.producer,
        vintage: mw.vintage, volume_ml: mw.volume_ml,
        volume_label: mw.volume_label, region: mw.region, country: mw.country,
      };
      result.match_method = matchMethod;
    }

    // Variant lookup if no vintage detected
    if (matchedWine && !extracted?.vintage) {
      const mw = matchedWine as Record<string, unknown>;
      const { data: variants } = await supabaseAdmin
        .from("wines")
        .select("id, name, producer, vintage, volume_ml, volume_label")
        .eq("is_active", true)
        .ilike("name", `%${mw.name}%`)
        .order("vintage", { ascending: false });

      if (variants && variants.length > 1) {
        result.variants = variants;
        result.status = "select_variant";
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recognize-label error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", status: "failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// --- Helper functions ---

async function updateAttemptFailed(
  supabaseAdmin: ReturnType<typeof createClient>,
  attemptId: string,
  errorMessage: string,
  startTime: number
) {
  await supabaseAdmin
    .from("ai_recognition_attempts")
    .update({
      status: "failed",
      error_message: errorMessage,
      processing_time_ms: Date.now() - startTime,
      processed_at: new Date().toISOString(),
    })
    .eq("id", attemptId);
}

interface CandidateWine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  volume_ml: number | null;
  volume_label: string | null;
  region: string | null;
  country: string | null;
  retrieval_method: string;
  retrieval_score: number;
  score: number;
}

async function retrieveCandidates(
  supabaseAdmin: ReturnType<typeof createClient>,
  extracted: Record<string, unknown> | null,
  openaiApiKey: string | undefined
): Promise<CandidateWine[]> {
  if (!extracted) return [];

  const candidateMap = new Map<string, CandidateWine>();

  // Strategy 1: Trigram similarity search (always available)
  const searchQuery = [extracted.product_name, extracted.producer, extracted.region, extracted.grape_variety]
    .filter(Boolean)
    .join(" ");

  if (searchQuery) {
    const { data: trigramResults } = await supabaseAdmin.rpc("match_wines_trigram", {
      p_query: searchQuery,
      p_limit: 15,
    });

    if (trigramResults) {
      for (const r of trigramResults) {
        candidateMap.set(r.wine_id, {
          id: r.wine_id,
          name: r.wine_name,
          producer: r.producer,
          vintage: r.vintage,
          volume_ml: r.volume_ml,
          volume_label: r.volume_label,
          region: r.region,
          country: r.country,
          retrieval_method: "trigram",
          retrieval_score: r.similarity_score,
          score: 0,
        });
      }
    }
  }

  // Strategy 2: Vector embedding search (if OpenAI key available and embeddings exist)
  if (openaiApiKey && searchQuery) {
    try {
      const queryEmbedding = await generateEmbedding(openaiApiKey, searchQuery.toUpperCase());

      const { data: vectorResults } = await supabaseAdmin.rpc("match_wines_embedding", {
        p_query_embedding: JSON.stringify(queryEmbedding),
        p_limit: 15,
      });

      if (vectorResults) {
        for (const r of vectorResults) {
          const existing = candidateMap.get(r.wine_id);
          if (existing) {
            // Boost score for wines found by both methods
            existing.retrieval_method = "hybrid";
            existing.retrieval_score = Math.max(existing.retrieval_score, r.cosine_score);
          } else {
            candidateMap.set(r.wine_id, {
              id: r.wine_id,
              name: r.wine_name,
              producer: r.producer,
              vintage: r.vintage,
              volume_ml: r.volume_ml,
              volume_label: r.volume_label,
              region: r.region,
              country: r.country,
              retrieval_method: "embedding",
              retrieval_score: r.cosine_score,
              score: 0,
            });
          }
        }
      }
    } catch (e) {
      console.error("Vector search failed, falling back to trigram only:", e);
    }
  }

  // Strategy 3: Fallback ILIKE search for basic name/producer matching
  if (candidateMap.size < 5) {
    const { data: ilikeCandidates } = await supabaseAdmin
      .from("wines")
      .select("id, name, producer, vintage, volume_ml, volume_label, region, country")
      .eq("is_active", true)
      .or(
        `name.ilike.%${extracted.product_name || ""}%,producer.ilike.%${extracted.producer || ""}%`
      )
      .limit(20);

    if (ilikeCandidates) {
      for (const w of ilikeCandidates) {
        if (!candidateMap.has(w.id)) {
          candidateMap.set(w.id, {
            ...w,
            retrieval_method: "ilike",
            retrieval_score: 0.3,
            score: 0,
          });
        }
      }
    }
  }

  return Array.from(candidateMap.values());
}

function scoreCandidates(
  candidates: CandidateWine[],
  extracted: Record<string, unknown> | null
): CandidateWine[] {
  if (!extracted) return candidates;

  return candidates.map((w) => {
    let score = 0;
    const nameNorm = (w.name || "").toLowerCase();
    const producerNorm = (w.producer || "").toLowerCase();
    const extractedName = ((extracted.product_name as string) || "").toLowerCase();
    const extractedProducer = ((extracted.producer as string) || "").toLowerCase();

    // Name match (max 40)
    if (nameNorm === extractedName) score += 40;
    else if (nameNorm.includes(extractedName) || extractedName.includes(nameNorm)) score += 25;

    // Producer match (max 30)
    if (producerNorm === extractedProducer) score += 30;
    else if (producerNorm.includes(extractedProducer) || extractedProducer.includes(producerNorm)) score += 15;

    // Vintage match (max 20)
    if (extracted.vintage && w.vintage) {
      if (w.vintage === extracted.vintage) score += 20;
    }

    // Region match (max 10)
    if (extracted.region && w.region && w.region.toLowerCase().includes((extracted.region as string).toLowerCase())) {
      score += 10;
    }

    // Retrieval method bonus: hybrid candidates get a boost
    if (w.retrieval_method === "hybrid") score += 10;
    else if (w.retrieval_method === "embedding") score += 5;
    else if (w.retrieval_method === "trigram") score += 3;

    // Retrieval score bonus (normalized 0-10)
    score += Math.round(w.retrieval_score * 10);

    return { ...w, score };
  });
}

async function generateEmbedding(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding;
}
