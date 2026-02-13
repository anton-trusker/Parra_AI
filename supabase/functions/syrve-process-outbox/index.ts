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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional: process a specific job
    const body = await req.json().catch(() => ({}));
    const specificJobId = body.job_id;

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

    // Fetch pending jobs
    let jobQuery = adminClient
      .from("syrve_outbox_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (specificJobId) {
      jobQuery = adminClient
        .from("syrve_outbox_jobs")
        .select("*")
        .eq("id", specificJobId);
    }

    const { data: jobs, error: jobsErr } = await jobQuery.limit(10);
    if (jobsErr) throw jobsErr;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "No pending jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    let syrveToken: string | null = null;

    try {
      // Login to Syrve
      const authUrl = `${config.server_url}/auth?login=${encodeURIComponent(config.api_login)}&pass=${config.api_password_hash}`;
      const authResp = await fetch(authUrl);
      if (!authResp.ok) throw new Error(`Syrve auth failed: ${authResp.status}`);
      syrveToken = (await authResp.text()).trim();

      for (const job of jobs) {
        // Check max attempts
        if (job.attempts >= (job.max_attempts || 3)) {
          await adminClient.from("syrve_outbox_jobs")
            .update({ status: "failed", last_error: "Max attempts reached", updated_at: new Date().toISOString() })
            .eq("id", job.id);
          results.push({ job_id: job.id, status: "failed", error: "Max attempts reached" });
          continue;
        }

        // Mark as processing
        await adminClient.from("syrve_outbox_jobs")
          .update({ 
            status: "processing", 
            attempts: (job.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        try {
          if (job.job_type === "inventory_check" || job.job_type === "inventory_commit") {
            // Submit inventory document to Syrve
            const submitUrl = `${config.server_url}/documents/import/incomingInventory?key=${syrveToken}`;
            const submitResp = await fetch(submitUrl, {
              method: "POST",
              headers: { "Content-Type": "application/xml" },
              body: job.payload_xml,
            });

            const responseXml = await submitResp.text();

            if (submitResp.ok) {
              // Extract document ID from response if available
              const docIdMatch = responseXml.match(/<documentNumber>([^<]+)<\/documentNumber>/);
              const syrveDocId = docIdMatch ? docIdMatch[1] : null;

              await adminClient.from("syrve_outbox_jobs")
                .update({ 
                  status: "success", 
                  response_xml: responseXml,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", job.id);

              // Update session status if linked
              if (job.session_id) {
                await adminClient.from("inventory_sessions")
                  .update({ status: "synced" as any })
                  .eq("id", job.session_id);
              }

              results.push({ job_id: job.id, status: "success", syrve_doc_id: syrveDocId });

              // Log success
              await adminClient.from("syrve_api_logs").insert({
                action_type: `OUTBOX_${job.job_type.toUpperCase()}`,
                status: "success",
                request_url: submitUrl,
                request_method: "POST",
                response_payload_preview: responseXml.substring(0, 500),
              });
            } else {
              throw new Error(`Syrve returned ${submitResp.status}: ${responseXml.substring(0, 200)}`);
            }
          } else {
            throw new Error(`Unknown job type: ${job.job_type}`);
          }
        } catch (jobError) {
          const errMsg = jobError instanceof Error ? jobError.message : "Unknown error";
          await adminClient.from("syrve_outbox_jobs")
            .update({ 
              status: "pending", // Back to pending for retry
              last_error: errMsg,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          results.push({ job_id: job.id, status: "error", error: errMsg });

          await adminClient.from("syrve_api_logs").insert({
            action_type: `OUTBOX_${job.job_type.toUpperCase()}`,
            status: "error",
            error_message: errMsg,
          });
        }
      }
    } finally {
      if (syrveToken) {
        try {
          await fetch(`${config.server_url}/logout?key=${syrveToken}`);
        } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("syrve-process-outbox error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
