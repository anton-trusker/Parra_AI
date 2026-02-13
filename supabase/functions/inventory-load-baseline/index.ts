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

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate session exists and is in draft status
    const { data: session, error: sessErr } = await adminClient
      .from("inventory_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.status !== "draft") {
      return new Response(JSON.stringify({ error: `Session status is '${session.status}', expected 'draft'` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check baseline source setting
    const { data: baselineSetting } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "inventory_baseline_source")
      .maybeSingle();

    const baselineSource = (baselineSetting?.value as any) || "local";

    let itemsLoaded = 0;

    if (baselineSource === "syrve") {
      // Load baseline from Syrve via stock snapshot
      const { data: config } = await adminClient
        .from("syrve_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!config || config.connection_status !== "connected") {
        return new Response(JSON.stringify({ error: "Syrve not connected. Configure Syrve or change baseline source to 'local'." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Login to Syrve
      const authUrl = `${config.server_url}/auth?login=${encodeURIComponent(config.api_login)}&pass=${config.api_password_hash}`;
      const authResp = await fetch(authUrl);
      if (!authResp.ok) throw new Error(`Syrve auth failed: ${authResp.status}`);
      const syrveToken = (await authResp.text()).trim();

      try {
        const storeId = config.default_store_id;
        const today = new Date().toISOString().split("T")[0];
        const stockUrl = `${config.server_url}/reports/balance/stores?key=${syrveToken}&store=${storeId}&timestamp=${today}`;
        const stockResp = await fetch(stockUrl);

        if (stockResp.ok) {
          const stockXml = await stockResp.text();
          const stockItems = parseStockXml(stockXml);

          // Map syrve IDs to wine variants
          const syrveIds = stockItems.map((s: any) => s.product_id).filter(Boolean);
          const { data: variants } = await adminClient
            .from("wine_variants")
            .select("id, syrve_product_id, base_wine_id, volume_ml")
            .in("syrve_product_id", syrveIds);

          const variantLookup = new Map((variants || []).map((v: any) => [v.syrve_product_id, v]));

          // Insert into inventory_baseline_items (immutable) AND legacy inventory_items
          for (const item of stockItems) {
            const variant = variantLookup.get(item.product_id);
            if (!variant) continue;

            const expectedQty = Math.floor(item.amount || 0);
            const expectedLiters = variant.volume_ml
              ? (expectedQty * variant.volume_ml) / 1000
              : 0;

            // Event-sourced baseline (immutable)
            await adminClient.from("inventory_baseline_items").insert({
              session_id,
              product_id: variant.base_wine_id,
              variant_id: variant.id,
              expected_qty: expectedQty,
              expected_liters: expectedLiters,
              raw_stock_payload: item,
            });

            // Legacy inventory_items for backward compat
            await adminClient.from("inventory_items").insert({
              session_id,
              wine_id: variant.base_wine_id,
              variant_id: variant.id,
              expected_quantity_unopened: expectedQty,
              expected_quantity_opened: 0,
              count_status: "pending",
            });

            itemsLoaded++;
          }

          // Also create stock snapshot
          for (const item of stockItems) {
            const variant = variantLookup.get(item.product_id);
            if (!variant) continue;
            await adminClient.from("stock_snapshots").insert({
              wine_id: variant.base_wine_id,
              session_id,
              stock_unopened: Math.floor(item.amount || 0),
              stock_opened: 0,
              snapshot_type: "baseline",
              triggered_by: user.id,
            });
          }
        }
      } finally {
        try {
          await fetch(`${config.server_url}/logout?key=${syrveToken}`);
        } catch { /* ignore */ }
      }
    } else {
      // Load baseline from local wines table (current stock)
      let wineQuery = adminClient
        .from("wines")
        .select("id, current_stock_unopened, current_stock_opened, volume_ml")
        .eq("is_active", true);

      if (session.location_filter) {
        wineQuery = wineQuery.eq("bin_location", session.location_filter);
      }

      const { data: wines } = await wineQuery;

      for (const wine of (wines || [])) {
        const totalQty = (wine.current_stock_unopened || 0) + (wine.current_stock_opened || 0);
        const expectedLiters = wine.volume_ml
          ? (totalQty * wine.volume_ml) / 1000
          : 0;

        // Event-sourced baseline (immutable)
        await adminClient.from("inventory_baseline_items").insert({
          session_id,
          product_id: wine.id,
          expected_qty: totalQty,
          expected_liters: expectedLiters,
        });

        // Legacy inventory_items
        await adminClient.from("inventory_items").insert({
          session_id,
          wine_id: wine.id,
          expected_quantity_unopened: wine.current_stock_unopened || 0,
          expected_quantity_opened: wine.current_stock_opened || 0,
          count_status: "pending",
        });
        itemsLoaded++;
      }
    }

    // Update session status to in_progress
    await adminClient.from("inventory_sessions").update({
      status: "in_progress",
      started_at: new Date().toISOString(),
      started_by: user.id,
      total_wines_expected: itemsLoaded,
    }).eq("id", session_id);

    // Log
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "inventory.load_baseline",
      entity_type: "inventory_session",
      entity_id: session_id,
      description: `Loaded baseline: ${itemsLoaded} items from ${baselineSource}`,
    });

    return new Response(JSON.stringify({
      success: true,
      baseline_loaded: true,
      products_count: itemsLoaded,
      baseline_source: baselineSource,
      session_status: "in_progress",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("inventory-load-baseline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseStockXml(xml: string): any[] {
  const items: any[] = [];
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
