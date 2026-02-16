import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin using their token
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to bypass RLS for deletions
    const client = createClient(supabaseUrl, serviceRoleKey);

    const results: Record<string, number> = {};

    // Delete in dependency order (foreign keys)
    const tables = [
      "stock_levels",
      "product_barcodes",
      "products",
      "categories",
      "stores",
      "measurement_units",
      "syrve_raw_objects",
      "syrve_api_logs",
      "syrve_sync_runs",
    ];

    for (const table of tables) {
      const { data, error } = await client.from(table).delete().gte("created_at", "1970-01-01");
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
        // For tables with FK constraints, try alternative approach
        const { error: retryError } = await client.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (retryError) {
          console.error(`Retry failed for ${table}:`, retryError.message);
        }
      }
      results[table] = Array.isArray(data) ? data.length : 0;
    }

    // Reset syrve_config
    const { data: config } = await client.from("syrve_config").select("id").limit(1).maybeSingle();
    if (config) {
      await client.from("syrve_config").update({
        connection_status: "not_configured",
        selected_category_ids: null,
        selected_store_ids: null,
        default_store_id: null,
        default_store_name: null,
        product_type_filters: ["GOODS", "DISH"],
      }).eq("id", config.id);
    }

    return new Response(
      JSON.stringify({ success: true, deleted: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Clean all error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
