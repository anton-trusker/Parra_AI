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

    const { title, description, session_type, location_filter, wine_filter } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Count expected wines based on filters
    let expectedCount = 0;
    let wineQuery = adminClient.from("wines").select("id", { count: "exact", head: true }).eq("is_active", true);
    
    if (location_filter) {
      wineQuery = wineQuery.eq("bin_location", location_filter);
    }

    const { count } = await wineQuery;
    expectedCount = count || 0;

    // Create session
    const { data: session, error: sessionErr } = await adminClient
      .from("inventory_sessions")
      .insert({
        session_name: title,
        description: description || null,
        session_type: session_type || "full",
        status: "draft",
        location_filter: location_filter || null,
        wine_filter: wine_filter || {},
        total_wines_expected: expectedCount,
        started_by: user.id,
      })
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    // Log activity
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "inventory.create_session",
      entity_type: "inventory_session",
      entity_id: session.id,
      description: `Created inventory session: ${title}`,
    });

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      session,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("inventory-create-session error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
