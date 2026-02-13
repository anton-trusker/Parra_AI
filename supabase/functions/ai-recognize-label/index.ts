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
    // Auth check
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create user-scoped client for auth
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

    // Service role client for DB writes
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { image_base64, session_id } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create AI attempt record
    const { data: attempt, error: attemptErr } = await supabaseAdmin
      .from("ai_recognition_attempts")
      .insert({
        user_id: userId,
        session_id: session_id || null,
        model_used: "google/gemini-2.5-flash",
        prompt_version: "v1",
        status: "processing",
      })
      .select("id")
      .single();

    if (attemptErr) {
      console.error("Failed to create attempt:", attemptErr);
      throw new Error("Failed to create recognition attempt");
    }

    // Call Lovable AI Gateway with vision
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: VISION_PROMPT },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${image_base64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);

      // Update attempt as failed
      await supabaseAdmin
        .from("ai_recognition_attempts")
        .update({
          status: "failed",
          error_message: `AI gateway error: ${aiResponse.status}`,
          processing_time_ms: Date.now() - startTime,
          processed_at: new Date().toISOString(),
        })
        .eq("id", attempt.id);

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
    let extracted: any = null;
    try {
      // Strip markdown code fences if present
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
        JSON.stringify({
          status: "failed",
          attempt_id: attempt.id,
          error: "Could not parse label data",
          ocr_text: rawText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to match against wines in DB
    let matchedWine: any = null;
    let matchMethod = "none";
    let matchConfidence = 0;

    if (extracted?.product_name || extracted?.producer) {
      // Build search terms
      const searchTerms = [extracted.product_name, extracted.producer]
        .filter(Boolean)
        .join(" ");

      // Search wines by name/producer similarity
      const { data: candidates } = await supabaseAdmin
        .from("wines")
        .select("id, name, producer, vintage, volume_ml, volume_label, region, country")
        .eq("is_active", true)
        .or(
          `name.ilike.%${extracted.product_name || ""}%,producer.ilike.%${extracted.producer || ""}%`
        )
        .limit(20);

      if (candidates && candidates.length > 0) {
        // Score candidates
        const scored = candidates.map((w) => {
          let score = 0;
          const nameNorm = (w.name || "").toLowerCase();
          const producerNorm = (w.producer || "").toLowerCase();
          const extractedName = (extracted.product_name || "").toLowerCase();
          const extractedProducer = (extracted.producer || "").toLowerCase();

          // Name match
          if (nameNorm === extractedName) score += 40;
          else if (nameNorm.includes(extractedName) || extractedName.includes(nameNorm))
            score += 25;

          // Producer match
          if (producerNorm === extractedProducer) score += 30;
          else if (
            producerNorm.includes(extractedProducer) ||
            extractedProducer.includes(producerNorm)
          )
            score += 15;

          // Vintage match
          if (extracted.vintage && w.vintage) {
            if (w.vintage === extracted.vintage) score += 20;
          }

          // Region match
          if (
            extracted.region &&
            w.region &&
            w.region.toLowerCase().includes(extracted.region.toLowerCase())
          ) {
            score += 10;
          }

          return { ...w, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const best = scored[0];

        if (best.score >= 50) {
          matchedWine = best;
          matchConfidence = Math.min(best.score, 100);
          matchMethod = best.score >= 70 ? "exact" : "fuzzy";
        }

        // If vintage was detected but best match has a different vintage,
        // check if there's a family match (same wine, different year)
        if (
          extracted.vintage &&
          matchedWine &&
          matchedWine.vintage !== extracted.vintage
        ) {
          // Look for exact vintage match in candidates
          const vintageMatch = scored.find(
            (c) => c.vintage === extracted.vintage && c.score >= 30
          );
          if (vintageMatch) {
            matchedWine = vintageMatch;
            matchConfidence = Math.min(vintageMatch.score + 10, 100);
          }
        }
      }
    }

    // Update attempt with results
    const finalStatus =
      matchedWine && matchConfidence >= 50
        ? "success"
        : matchedWine
        ? "manual_review"
        : "failed";

    await supabaseAdmin
      .from("ai_recognition_attempts")
      .update({
        raw_response: aiJson,
        extracted_data: extracted,
        matched_product_id: matchedWine?.id || null,
        match_confidence: matchConfidence,
        match_method: matchMethod,
        tokens_used: tokensUsed,
        processing_time_ms: Date.now() - startTime,
        status: finalStatus,
        processed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    // Build response
    const result: any = {
      status: finalStatus,
      attempt_id: attempt.id,
      extracted: extracted,
      confidence: matchConfidence,
      processing_time_ms: Date.now() - startTime,
    };

    if (matchedWine) {
      result.match = {
        id: matchedWine.id,
        name: matchedWine.name,
        producer: matchedWine.producer,
        vintage: matchedWine.vintage,
        volume_ml: matchedWine.volume_ml,
        volume_label: matchedWine.volume_label,
        region: matchedWine.region,
        country: matchedWine.country,
      };
      result.match_method = matchMethod;
    }

    // If no vintage detected but matched a family, get all vintage variants
    if (matchedWine && !extracted?.vintage) {
      const { data: variants } = await supabaseAdmin
        .from("wines")
        .select("id, name, producer, vintage, volume_ml, volume_label")
        .eq("is_active", true)
        .ilike("name", `%${matchedWine.name}%`)
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
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        status: "failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
