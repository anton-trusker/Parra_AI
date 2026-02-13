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

    const { server_url, api_login, api_password_hash, default_store_id, default_store_name, selected_category_ids } = await req.json();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if config exists
    const { data: existing } = await adminClient
      .from("syrve_config")
      .select("id")
      .limit(1)
      .maybeSingle();

    const configData: Record<string, any> = {
      server_url,
      api_login,
      api_password_hash,
      default_store_id: default_store_id || null,
      default_store_name: default_store_name || null,
      connection_status: "connected",
      connection_tested_at: new Date().toISOString(),
    };

    // Include selected_category_ids if provided
    if (selected_category_ids !== undefined) {
      configData.selected_category_ids = selected_category_ids;
    }

    let result;
    if (existing) {
      result = await adminClient
        .from("syrve_config")
        .update(configData)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await adminClient
        .from("syrve_config")
        .insert(configData)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return new Response(JSON.stringify({ success: true, config: result.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("syrve-save-config error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
