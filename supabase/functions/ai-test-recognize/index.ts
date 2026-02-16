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
  "year": null or 4-digit year (e.g. 2021),
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
- For year, only extract a clear 4-digit year (1900-2100).
- confidence should reflect how clearly you can read the label.
- Return ONLY valid JSON, no markdown, no explanation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const steps: Array<{ step: string; status: string; detail: string; duration_ms: number }> = [];
  const overallStart = Date.now();

  function logStep(step: string, status: string, detail: string, startMs: number) {
    steps.push({ step, status, detail, duration_ms: Date.now() - startMs });
  }

  try {
    // Step 1: Auth
    const authStart = Date.now();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logStep("Authentication", "failed", "No authorization header", authStart);
      return new Response(JSON.stringify({ error: "Unauthorized", steps }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("Authentication", "failed", "Invalid token", authStart);
      return new Response(JSON.stringify({ error: "Unauthorized", steps }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Authentication", "success", `User verified: ${claimsData.claims.sub}`, authStart);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Step 2: Parse request
    const parseStart = Date.now();
    const { image_base64 } = await req.json();
    if (!image_base64) {
      logStep("Parse Request", "failed", "image_base64 is required", parseStart);
      return new Response(JSON.stringify({ error: "image_base64 is required", steps }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const imageSizeKb = Math.round((image_base64.length * 3) / 4 / 1024);
    logStep("Parse Request", "success", `Image received: ~${imageSizeKb} KB`, parseStart);

    // Step 3: Load AI config
    const configStart = Date.now();
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
      logStep("Load AI Config", "failed", "No API key configured", configStart);
      return new Response(JSON.stringify({ error: "AI not configured", steps }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gatewayUrl = customGatewayUrl || "https://ai.gateway.lovable.dev/v1/chat/completions";
    logStep("Load AI Config", "success", `Model: ${modelName}, Gateway: ${customApiKey ? 'custom key' : 'built-in'}`, configStart);

    // Step 4: Vision extraction
    const visionStart = Date.now();
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
      logStep("Vision Extraction", "failed", `AI gateway returned ${aiResponse.status}: ${errText.substring(0, 200)}`, visionStart);
      return new Response(JSON.stringify({ error: `AI gateway error: ${aiResponse.status}`, steps }), {
        status: aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    const rawText = aiJson.choices?.[0]?.message?.content ?? "";
    const tokensUsed = aiJson.usage?.total_tokens ?? null;
    logStep("Vision Extraction", "success", `Tokens used: ${tokensUsed || 'unknown'}. Raw response length: ${rawText.length} chars`, visionStart);

    // Step 5: Parse extracted data
    const parseExtStart = Date.now();
    let extracted: Record<string, unknown> | null = null;
    try {
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      extracted = JSON.parse(cleaned);
      logStep("Parse AI Response", "success", `Extracted: ${extracted?.product_name || 'unknown'}, Producer: ${extracted?.producer || 'unknown'}, Year: ${extracted?.year || 'N/A'}, Volume: ${extracted?.bottle_size_ml || 'N/A'}ml`, parseExtStart);
    } catch {
      logStep("Parse AI Response", "failed", `Could not parse JSON from: ${rawText.substring(0, 100)}...`, parseExtStart);
      return new Response(
        JSON.stringify({
          status: "failed",
          steps,
          extracted: null,
          matches: [],
          raw_ocr_text: rawText,
          processing_time_ms: Date.now() - overallStart,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 6: Search products via v_stock_summary (only GOODS with available stock)
    const searchStart = Date.now();
    const selectCols = "product_id, name, code, sku, total_stock, purchase_price, sale_price, unit_capacity, category_name, syrve_data";

    const productName = extracted.product_name ? String(extracted.product_name) : "";
    const producer = extracted.producer ? String(extracted.producer) : "";
    const year = extracted.year ? String(extracted.year) : "";

    // Cascading search: most specific first, stop if high-confidence match found
    const HIGH_SCORE_THRESHOLD = 50;
    let allCandidates: any[] = [];
    const seenIds = new Set<string>();

    const addCandidates = (hits: any[], method: string) => {
      for (const hit of hits) {
        if (!seenIds.has(hit.product_id)) {
          seenIds.add(hit.product_id);
          allCandidates.push({ ...hit, id: hit.product_id, retrieval_method: method });
        }
      }
    };

    // Quick score check: does any candidate already look like a strong match?
    const hasHighScore = () => {
      for (const c of allCandidates) {
        const pName = (c.name || "").toLowerCase();
        const eName = productName.toLowerCase();
        const eProd = producer.toLowerCase();
        let s = 0;
        if (pName === eName) s += 40;
        else if (pName.includes(eName) || eName.includes(pName)) s += 25;
        if (eProd && pName.includes(eProd)) s += 20;
        if (year && pName.includes(year)) s += 15;
        if (s >= HIGH_SCORE_THRESHOLD) return true;
      }
      return false;
    };

    const searchIlike = async (phrase: string, method: string) => {
      const escaped = phrase.replace(/'/g, "''");
      const { data, error } = await supabaseAdmin
        .from("v_stock_summary")
        .select(selectCols)
        .ilike("name", `%${escaped}%`)
        .limit(30);
      if (data) addCandidates(data, method);
      if (error) console.error(`Search error (${method}):`, error);
    };

    // Phase 1: Producer + Name + Year (most specific)
    if (producer && productName && year) {
      await searchIlike(`${producer} ${productName} ${year}`, "producer_name_year");
      if (hasHighScore()) {
        logStep("Product Search (Stock)", "success", `Found high-confidence match at phase 1 (producer+name+year). ${allCandidates.length} candidates`, searchStart);
      }
    }

    // Phase 2: Producer + Name
    if (!hasHighScore() && producer && productName) {
      await searchIlike(`${producer} ${productName}`, "producer_name");
      if (hasHighScore()) {
        logStep("Product Search (Stock)", "success", `Found high-confidence match at phase 2 (producer+name). ${allCandidates.length} candidates`, searchStart);
      }
    }

    // Phase 3: Name only
    if (!hasHighScore() && productName) {
      await searchIlike(productName, "name_only");
      if (hasHighScore()) {
        logStep("Product Search (Stock)", "success", `Found high-confidence match at phase 3 (name). ${allCandidates.length} candidates`, searchStart);
      }
    }

    // Phase 4: Producer only
    if (!hasHighScore() && producer) {
      await searchIlike(producer, "producer_only");
    }

    // Phase 5: Word-level fallback for broader recall
    if (!hasHighScore()) {
      const allWords = [productName, producer, year].join(" ").split(/\s+/).filter(w => w.length > 2);
      const uniqueWords = [...new Set(allWords)];
      for (const word of uniqueWords.slice(0, 6)) {
        await searchIlike(word, "word_fallback");
        if (hasHighScore()) break;
      }
    }

    if (!allCandidates.length || !hasHighScore()) {
      logStep("Product Search (Stock)", "success", `Completed all phases. ${allCandidates.length} candidates found`, searchStart);
    }

    // Step 7: Score and rank
    const scoreStart = Date.now();
    const scored = allCandidates.map(product => {
      let score = 0;
      const pName = (product.name || "").toLowerCase();
      const extractedName = ((extracted!.product_name as string) || "").toLowerCase();
      const extractedProducer = ((extracted!.producer as string) || "").toLowerCase();

      // Name similarity
      if (pName === extractedName) score += 40;
      else if (pName.includes(extractedName) || extractedName.includes(pName)) score += 25;
      else {
        const pWords = new Set(pName.split(/\s+/).filter(w => w.length > 2));
        const eWords = extractedName.split(/\s+/).filter(w => w.length > 2);
        const overlap = eWords.filter(w => pWords.has(w)).length;
        if (eWords.length > 0) score += Math.round((overlap / eWords.length) * 25);
      }

      // Producer in name check
      if (extractedProducer && pName.includes(extractedProducer)) score += 20;

      // Producer in syrve_data
      const syrveData = product.syrve_data || {};
      const metaProducer = ((syrveData as any).producer || "").toLowerCase();
      if (extractedProducer && metaProducer && (metaProducer.includes(extractedProducer) || extractedProducer.includes(metaProducer))) {
        score += 15;
      }

      // Year in product name check
      const extractedYear = extracted!.year ? String(extracted!.year) : null;
      if (extractedYear && pName.includes(extractedYear)) score += 15;

      // Volume/bottle size in product name check
      const extractedVolume = extracted!.bottle_size_ml ? Number(extracted!.bottle_size_ml) : null;
      if (extractedVolume) {
        const volStr = String(extractedVolume);
        const volLiters = (extractedVolume / 1000).toFixed(1).replace(/\.0$/, "");
        if (pName.includes(volStr) || pName.includes(volLiters + "l") || pName.includes(volLiters + " l")) score += 10;
      }

      // SKU/code partial match
      if (extracted!.product_name && product.code) {
        const codeNorm = product.code.toLowerCase();
        if (extractedName.includes(codeNorm) || codeNorm.includes(extractedName.substring(0, 8))) score += 5;
      }

      // Retrieval method bonus
      if (product.retrieval_method === "ilike") score += 5;

      return {
        id: product.id,
        name: product.name,
        code: product.code,
        sku: product.sku,
        product_type: "GOODS",
        current_stock: product.total_stock,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        unit_capacity: product.unit_capacity,
        category_name: product.category_name,
        retrieval_method: product.retrieval_method,
        confidence_pct: Math.min(score, 100),
      };
    });

    scored.sort((a, b) => b.confidence_pct - a.confidence_pct);
    const topMatches = scored.filter(m => m.confidence_pct > 0).slice(0, 20);

    logStep("Score & Rank", "success", `Scored ${scored.length} products. Top match: ${topMatches[0]?.name || 'none'} (${topMatches[0]?.confidence_pct || 0}%)`, scoreStart);

    // Build final response
    const bestMatch = topMatches[0] || null;
    const finalStatus = bestMatch && bestMatch.confidence_pct >= 50 ? "matched" :
                        bestMatch ? "low_confidence" : "no_match";

    return new Response(
      JSON.stringify({
        status: finalStatus,
        extracted,
        raw_ocr_text: extracted?.label_text_raw || rawText,
        best_match: bestMatch,
        all_matches: topMatches,
        steps,
        tokens_used: tokensUsed,
        model_used: modelName,
        processing_time_ms: Date.now() - overallStart,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-test-recognize error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        status: "failed",
        steps,
        processing_time_ms: Date.now() - overallStart,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
