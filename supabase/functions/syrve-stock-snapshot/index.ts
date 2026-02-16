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

    const { store_id, session_id } = await req.json();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Syrve config
    const { data: config } = await adminClient
      .from("syrve_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ error: "Syrve not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storeId = store_id || config.default_store_id;
    if (!storeId) {
      return new Response(JSON.stringify({ error: "No store_id provided and no default store configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Login to Syrve
    const authUrl = `${config.server_url}/auth?login=${encodeURIComponent(config.api_login)}&pass=${config.api_password_hash}`;
    const authResp = await fetch(authUrl);
    if (!authResp.ok) throw new Error(`Syrve auth failed: ${authResp.status}`);
    const syrveToken = (await authResp.text()).trim();

    let stockItems: any[] = [];
    try {
      // Fetch stock from legacy report endpoint (Server API)
      const today = new Date().toISOString().split("T")[0];
      const stockUrl = `${config.server_url}/reports/balance/stores?key=${syrveToken}&store=${storeId}&timestamp=${today}`;
      const stockResp = await fetch(stockUrl);

      if (!stockResp.ok) {
        const errText = await stockResp.text();
        throw new Error(`Syrve stock fetch failed (${stockResp.status}): ${errText.substring(0, 200)}`);
      }

      const stockText = await stockResp.text();

      // Store raw response
      await adminClient.from("syrve_raw_objects").insert({
        entity_type: "stock_snapshot",
        syrve_id: `snapshot_${storeId}_${today}`,
        payload: { raw_length: stockText.length, store_id: storeId, date: today },
        synced_at: new Date().toISOString(),
      });

      // Parse stock items from XML
      stockItems = parseStockXml(stockText);

      // Map syrve product IDs to our product IDs
      const syrveProductIds = stockItems.map((s: any) => s.product_id).filter(Boolean);
      const { data: products } = await adminClient
        .from("products")
        .select("id, syrve_product_id, main_unit_id")
        .in("syrve_product_id", syrveProductIds);

      const productLookup = new Map((products || []).map((p: any) => [p.syrve_product_id, p]));

      // Look up internal store ID for stock_levels
      const { data: storeRow } = await adminClient.from("stores").select("id").eq("syrve_store_id", storeId).maybeSingle();
      const internalStoreId = storeRow?.id;

      // Also map to wines via wine_variants.syrve_product_id
      const { data: variants } = await adminClient
        .from("wine_variants")
        .select("id, syrve_product_id, base_wine_id")
        .in("syrve_product_id", syrveProductIds);

      const variantLookup = new Map((variants || []).map((v: any) => [v.syrve_product_id, v]));

      // Insert stock snapshots for wines we can map + populate stock_levels
      let snapshotCount = 0;
      for (const item of stockItems) {
        const variant = variantLookup.get(item.product_id);
        if (variant) {
          await adminClient.from("stock_snapshots").insert({
            wine_id: variant.base_wine_id,
            session_id: session_id || null,
            stock_unopened: Math.floor(item.amount || 0),
            stock_opened: 0,
            snapshot_type: "syrve_sync",
            triggered_by: user.id,
          });
          snapshotCount++;
        }

        // Update stock_levels per product per store
        const prod = productLookup.get(item.product_id);
        if (prod && internalStoreId) {
          await adminClient.from("stock_levels").upsert({
            product_id: prod.id,
            store_id: internalStoreId,
            quantity: item.amount || 0,
            unit_id: prod.main_unit_id || null,
            source: 'syrve_snapshot',
            last_synced_at: new Date().toISOString(),
          }, { onConflict: "product_id,store_id" });

          // Also update products.current_stock
          await adminClient.from("products").update({
            current_stock: item.amount || 0,
            stock_updated_at: new Date().toISOString(),
          }).eq("id", prod.id);
        }
      }

      // Log API call
      await adminClient.from("syrve_api_logs").insert({
        action_type: "STOCK_SNAPSHOT",
        status: "success",
        request_url: stockUrl,
        request_method: "GET",
        response_payload_preview: `${stockItems.length} items parsed, ${snapshotCount} snapshots created`,
      });
    } finally {
      // Always logout
      try {
        await fetch(`${config.server_url}/logout?key=${syrveToken}`);
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({
      success: true,
      store_id: storeId,
      items_fetched: stockItems.length,
      session_id: session_id || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("syrve-stock-snapshot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseStockXml(xml: string): any[] {
  const items: any[] = [];
  // Parse <item> or <remainItem> blocks from stock response
  const itemRegex = /<(?:item|remainItem|record)>([\s\S]*?)<\/(?:item|remainItem|record)>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const getField = (tag: string): string | null => {
      const m = content.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1].trim() : null;
    };
    const productId = getField("product") || getField("productId") || getField("id");
    const amount = parseFloat(getField("amount") || getField("endStore") || getField("balance") || "0");
    if (productId) {
      items.push({ product_id: productId, amount });
    }
  }
  return items;
}
