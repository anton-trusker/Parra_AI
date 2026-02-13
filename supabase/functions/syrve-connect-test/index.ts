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
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { server_url, api_login, api_password } = await req.json();
    if (!server_url || !api_login || !api_password) {
      return new Response(JSON.stringify({ error: "server_url, api_login, and api_password are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Compute SHA1 hash of password
    const passHash = await sha1(api_password);

    // 2. Authenticate with Syrve
    const authUrl = `${server_url}/auth?login=${encodeURIComponent(api_login)}&pass=${passHash}`;
    const authResp = await fetch(authUrl);
    if (!authResp.ok) {
      const errText = await authResp.text();
      return new Response(JSON.stringify({ 
        error: "Syrve authentication failed", 
        details: errText,
        status_code: authResp.status 
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const syrveToken = (await authResp.text()).trim();
    if (!syrveToken || syrveToken.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid token received from Syrve" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch stores list
    let stores: any[] = [];
    try {
      const storesUrl = `${server_url}/corporation/stores?key=${syrveToken}`;
      const storesResp = await fetch(storesUrl);
      if (storesResp.ok) {
        const storesText = await storesResp.text();
        // Parse XML to extract stores
        stores = parseStoresXml(storesText);
      }
    } catch (e) {
      console.error("Error fetching stores:", e);
    }

    // 4. Always logout to release license
    try {
      await fetch(`${server_url}/logout?key=${syrveToken}`);
    } catch (e) {
      console.error("Logout error:", e);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Connection successful",
      password_hash: passHash,
      stores,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("syrve-connect-test error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseStoresXml(xml: string): any[] {
  // Simple XML parser for corporateItemDto list
  const stores: any[] = [];
  const itemRegex = /<corporateItemDto>([\s\S]*?)<\/corporateItemDto>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const getId = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1] : null;
    };
    stores.push({
      id: getId("id"),
      name: getId("name"),
      code: getId("code"),
      type: getId("type"),
    });
  }
  return stores;
}
