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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId, productId, countedQuantity, notes } = await req.json();
    
    if (!sessionId || !productId || countedQuantity === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if inventory item exists
    const { data: existingItem, error: checkError } = await adminClient
      .from('inventory_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let result;
    if (existingItem) {
      // Update existing item
      const { data, error } = await adminClient
        .from('inventory_items')
        .update({
          counted_quantity: countedQuantity,
          variance: countedQuantity - existingItem.baseline_quantity,
          status: 'completed',
          last_counted_by: user.id,
          last_counted_at: new Date().toISOString(),
          notes: notes || existingItem.notes
        })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Get baseline quantity from session
      const { data: session, error: sessionError } = await adminClient
        .from('inventory_sessions')
        .select('baseline_data')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      
      const baselineQuantity = session.baseline_data?.[productId] || 0;

      // Create new item
      const { data, error } = await adminClient
        .from('inventory_items')
        .insert({
          session_id: sessionId,
          product_id: productId,
          baseline_quantity: baselineQuantity,
          counted_quantity: countedQuantity,
          variance: countedQuantity - baselineQuantity,
          status: 'completed',
          last_counted_by: user.id,
          last_counted_at: new Date().toISOString(),
          notes: notes || null
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in inventory-upsert-item:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});