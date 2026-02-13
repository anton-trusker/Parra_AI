import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha1(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

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

    // Validate session exists and is approved
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

    if (session.status !== "approved" && session.status !== "completed") {
      return new Response(JSON.stringify({ error: `Session status is '${session.status}', expected 'approved' or 'completed'` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Use aggregated totals from event-sourced model
    const { data: aggregates, error: aggErr } = await adminClient
      .from("inventory_product_aggregates")
      .select("*, wine_variants!inventory_product_aggregates_variant_id_fkey(syrve_product_id)")
      .eq("session_id", session_id);

    // Fallback to legacy inventory_items if no aggregates exist
    let itemsForSubmission: any[] = [];

    if (aggregates && aggregates.length > 0) {
      itemsForSubmission = aggregates;
    } else {
      // Legacy fallback: use inventory_items
      const { data: items, error: itemsErr } = await adminClient
        .from("inventory_items")
        .select("*, wine_variants!inventory_items_variant_id_fkey(syrve_product_id)")
        .eq("session_id", session_id)
        .in("count_status", ["counted", "verified"]);
      if (itemsErr) throw itemsErr;
      itemsForSubmission = (items || []).map(item => ({
        ...item,
        counted_qty_total: (item.counted_quantity_unopened || 0) + (item.counted_quantity_opened || 0),
      }));
    }

    if (!itemsForSubmission || itemsForSubmission.length === 0) {
      return new Response(JSON.stringify({ error: "No counted items found in session" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build inventory document XML for Syrve
    const storeId = config.default_store_id;
    const docDate = new Date().toISOString().split("T")[0];
    const docNumber = `INV-${session.session_name.replace(/\s+/g, "-").substring(0, 20)}-${Date.now().toString(36)}`;

    let itemsXml = "";
    let itemCount = 0;
    for (const item of itemsForSubmission) {
      const syrveProductId = item.wine_variants?.syrve_product_id;
      if (!syrveProductId) continue;

      const totalCounted = item.counted_qty_total || 0;

      itemsXml += `
        <item>
          <product>${escapeXml(syrveProductId)}</product>
          <amount>${totalCounted}</amount>
        </item>`;
      itemCount++;
    }

    const payloadXml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>${escapeXml(docNumber)}</documentNumber>
  <dateIncoming>${docDate}</dateIncoming>
  <store>${escapeXml(storeId || "")}</store>
  <items>${itemsXml}
  </items>
</document>`;

    // Compute payload hash for idempotency
    const payloadHash = await sha1(payloadXml);

    // Check for existing job with same hash (idempotency)
    const { data: existingJob } = await adminClient
      .from("syrve_outbox_jobs")
      .select("id, status")
      .eq("payload_hash", payloadHash)
      .eq("job_type", "inventory_commit")
      .maybeSingle();

    if (existingJob) {
      return new Response(JSON.stringify({
        success: true,
        outbox_job_id: existingJob.id,
        status: existingJob.status,
        message: "Job already exists (idempotent)",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create outbox job
    const { data: job, error: jobErr } = await adminClient
      .from("syrve_outbox_jobs")
      .insert({
        job_type: "inventory_commit",
        session_id,
        payload_xml: payloadXml,
        payload_hash: payloadHash,
        status: "pending",
      })
      .select()
      .single();

    if (jobErr) throw jobErr;

    // Update session status
    await adminClient.from("inventory_sessions")
      .update({ status: "submitted" as any })
      .eq("id", session_id);

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "inventory.submit_to_syrve",
      entity_type: "inventory_session",
      entity_id: session_id,
      description: `Submitted session to Syrve outbox. ${itemCount} items, job: ${job.id}`,
      metadata: { outbox_job_id: job.id, items_count: itemCount, doc_number: docNumber },
    });

    return new Response(JSON.stringify({
      success: true,
      outbox_job_id: job.id,
      status: "queued",
      message: "Inventory queued for submission to Syrve",
      items_count: itemCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("inventory-submit-to-syrve error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
